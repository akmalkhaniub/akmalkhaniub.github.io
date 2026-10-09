#!/usr/bin/env node
/**
 * Measures TypeScript 7.1 content-mapper JSON-RPC cost versus the same
 * transform in-process, then optionally drives nightly `tsc --runExternalCode`.
 *
 * This is not a claim about TypeScript 7.1 stable. Numbers are from
 * typescript@7.1.0-dev.20261009.1 when TSC_BIN (or a local typescript@next)
 * is available, plus a protocol-faithful STDIO mapper that does not require tsc.
 *
 * Usage: node benchmarks/content-mapper-rpc/harness.mjs
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, symlinkSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { tmpdir } from 'node:os';
import { JsonRpcReader, writeMessage, JSONRPC_VERSION } from './protocol.mjs';
import {
  CHECKOUT_SFC,
  ADD_LISP,
  transformMappedFile,
  virtualToOriginal,
  plantedStringLiteral,
  SPAN_KIND,
} from './sfc-transform.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const TRANSFORM_ITERS = 500;
const WARMUP = 50;

/**
 * @typedef {object} RpcSession
 * @property {import('node:child_process').ChildProcess} child
 * @property {JsonRpcReader} reader
 * @property {number} nextId
 */

/**
 * @param {NodeJS.ProcessEnv} [extraEnv]
 * @returns {RpcSession}
 */
function spawnMapper(extraEnv = {}) {
  const child = spawn(process.execPath, [join(ROOT, 'mapper-server.mjs')], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...extraEnv },
  });
  if (!child.stdin || !child.stdout) {
    throw new Error('mapper child is missing stdio pipes');
  }
  child.stderr?.on('data', (chunk) => {
    process.stderr.write(chunk);
  });
  return { child, reader: new JsonRpcReader(child.stdout), nextId: 1 };
}

/**
 * @param {RpcSession} session
 * @param {string} method
 * @param {Record<string, unknown>} params
 */
async function rpcCall(session, method, params) {
  const id = session.nextId;
  session.nextId += 1;
  writeMessage(session.child.stdin, {
    jsonrpc: JSONRPC_VERSION,
    id,
    method,
    params,
  });
  const reply = await session.reader.read();
  if (reply.id !== id) {
    throw new Error(`JSON-RPC id mismatch: sent ${id}, got ${reply.id}`);
  }
  if (reply.error) {
    throw new Error(`JSON-RPC ${method} failed: ${JSON.stringify(reply.error)}`);
  }
  return reply.result;
}

/**
 * @param {number[]} samples
 */
function percentile(samples, p) {
  if (samples.length === 0) {
    throw new Error('percentile of empty sample');
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

/**
 * @param {number[]} samples
 */
function summarize(samples) {
  const sum = samples.reduce((a, b) => a + b, 0);
  return {
    n: samples.length,
    meanMs: sum / samples.length,
    p50Ms: percentile(samples, 50),
    p90Ms: percentile(samples, 90),
    p99Ms: percentile(samples, 99),
  };
}

async function measureRpc() {
  const session = spawnMapper();
  const spawnStarted = performance.now();
  await rpcCall(session, 'initialize', {
    positionEncodings: ['utf-8', 'utf-16'],
  });
  await rpcCall(session, 'openProject', {
    configFileName: join(ROOT, 'tsconfig.json'),
    projectHandle: 'checkout-ledger:1',
    compilerOptions: { strict: true },
  });
  const handshakeMs = performance.now() - spawnStarted;

  const fileName = join(ROOT, 'fixtures', 'checkout-total.sfc');
  for (let i = 0; i < WARMUP; i += 1) {
    await rpcCall(session, 'transform', {
      fileName,
      content: CHECKOUT_SFC,
      projectHandle: 'checkout-ledger:1',
    });
  }

  let bytesOut = 0;
  const samples = [];
  for (let i = 0; i < TRANSFORM_ITERS; i += 1) {
    const t0 = performance.now();
    const result = await rpcCall(session, 'transform', {
      fileName,
      content: CHECKOUT_SFC,
      projectHandle: 'checkout-ledger:1',
    });
    samples.push(performance.now() - t0);
    bytesOut += Buffer.byteLength(JSON.stringify(result), 'utf8');
  }

  const lisp = await rpcCall(session, 'transform', {
    fileName: join(ROOT, 'fixtures', 'add.lisp'),
    content: ADD_LISP,
    projectHandle: 'checkout-ledger:1',
  });
  await rpcCall(session, 'closeProject', { projectHandle: 'checkout-ledger:1' });
  session.child.kill('SIGTERM');

  const sfc = transformMappedFile('checkout-total.sfc', CHECKOUT_SFC);
  const planted = plantedStringLiteral(sfc.text);
  const remapped = virtualToOriginal(sfc.mappings, planted.start);
  if (!remapped || remapped.kind !== SPAN_KIND.Verbatim) {
    throw new Error('SFC planted literal must remap through a Verbatim span');
  }
  const originalSlice = CHECKOUT_SFC.slice(remapped.originalPos, remapped.originalPos + planted.length);
  if (originalSlice !== '"not-a-number"') {
    throw new Error(`verbatim remap missed the original literal: ${originalSlice}`);
  }

  const lispAlias = lisp.mappings.find((row) => row[4] === SPAN_KIND.Alias);
  if (!lispAlias) {
    throw new Error('Lisp transform must emit an Alias span for add/+');
  }

  return {
    handshakeMs,
    transform: summarize(samples),
    meanReplyBytes: bytesOut / TRANSFORM_ITERS,
    remap: {
      virtualStart: planted.start,
      originalStart: remapped.originalPos,
      originalText: originalSlice,
      kind: 'Verbatim',
    },
    lispAlias: {
      virtualStart: lispAlias[0],
      virtualLength: lispAlias[1],
      originalStart: lispAlias[2],
      originalLength: lispAlias[3],
      originalText: ADD_LISP.slice(lispAlias[2], lispAlias[2] + lispAlias[3]),
    },
  };
}

function measureInProcess() {
  for (let i = 0; i < WARMUP; i += 1) {
    transformMappedFile('checkout-total.sfc', CHECKOUT_SFC);
  }
  const samples = [];
  for (let i = 0; i < TRANSFORM_ITERS; i += 1) {
    const t0 = performance.now();
    transformMappedFile('checkout-total.sfc', CHECKOUT_SFC);
    samples.push(performance.now() - t0);
  }
  return summarize(samples);
}

async function measureCrashCutoff() {
  const session = spawnMapper({ MAPPER_CRASH_AFTER: '1' });
  await rpcCall(session, 'initialize', { positionEncodings: ['utf-8'] });
  await rpcCall(session, 'openProject', {
    configFileName: '/tmp/crash.json',
    projectHandle: 'crash:1',
    compilerOptions: {},
  });
  let sawExit = false;
  const exitPromise = new Promise((resolve) => {
    session.child.once('exit', (code) => {
      sawExit = true;
      resolve(code);
    });
  });
  try {
    await rpcCall(session, 'transform', {
      fileName: 'checkout-total.sfc',
      content: CHECKOUT_SFC,
      projectHandle: 'crash:1',
    });
  } catch {
    // broken pipe after the crash-after transform is the fail-closed path
  }
  const code = await Promise.race([
    exitPromise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('mapper did not exit after MAPPER_CRASH_AFTER')), 3000);
    }),
  ]);
  return { exited: sawExit, exitCode: code };
}

/**
 * @returns {string | null}
 */
function resolveTsc() {
  if (process.env.TSC_BIN && existsSync(process.env.TSC_BIN)) {
    return process.env.TSC_BIN;
  }
  const nightly = '/tmp/ts71-install/node_modules/typescript/bin/tsc';
  if (existsSync(nightly)) return nightly;
  return null;
}

/**
 * @param {string} tscBin
 */
async function measureTscE2e(tscBin) {
  const work = join(tmpdir(), `ts71-mapper-e2e-${process.pid}`);
  rmSync(work, { recursive: true, force: true });
  mkdirSync(join(work, 'src'), { recursive: true });
  mkdirSync(join(work, 'node_modules'), { recursive: true });
  symlinkSync(ROOT, join(work, 'node_modules', 'sfc-content-mapper'));
  writeFileSync(join(work, 'src', 'checkout-total.sfc'), CHECKOUT_SFC);
  writeFileSync(
    join(work, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          strict: true,
          noEmit: true,
          target: 'esnext',
          module: 'esnext',
          moduleResolution: 'bundler',
          skipLibCheck: true,
        },
        contentMappers: [{ package: 'sfc-content-mapper', extensions: ['.sfc'] }],
        include: ['src'],
      },
      null,
      2,
    )}\n`,
  );

  const t0 = performance.now();
  const child = spawn(tscBin, ['--noEmit', '--runExternalCode', '-p', work], {
    cwd: work,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString('utf8');
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString('utf8');
  });
  const exitCode = await new Promise((resolve) => {
    child.on('close', resolve);
  });
  const elapsedMs = performance.now() - t0;
  rmSync(work, { recursive: true, force: true });
  const combined = `${stdout}\n${stderr}`;
  return {
    exitCode,
    elapsedMs,
    reportsOriginalFile: combined.includes('checkout-total.sfc'),
    reportsTypeError: /TS2322|not assignable|not-a-number/.test(combined),
    stdout: stdout.trim(),
    stderr: stderr.trim(),
  };
}

const rpc = await measureRpc();
const inProcess = measureInProcess();
const crash = await measureCrashCutoff();
const tscBin = resolveTsc();
const tscE2e = tscBin ? await measureTscE2e(tscBin) : { skipped: true, reason: 'tsc nightly binary not found' };

const isolationTax = rpc.transform.p50Ms / Math.max(inProcess.p50Ms, 0.0001);

const report = {
  generatedAt: new Date().toISOString(),
  runtime: { node: process.version, platform: process.platform, arch: process.arch },
  note:
    'Protocol-faithful JSON-RPC mapper (Content-Length, initialize/openProject/transform/closeProject) versus the same SFC extract in-process. tsc --runExternalCode uses typescript@7.1.0-dev.20261009.1 when present. Not TypeScript 7.1 GA.',
  protocol: {
    methods: ['initialize', 'openProject', 'transform', 'closeProject'],
    framing: 'Content-Length JSON-RPC 2.0',
    positionEncoding: 'utf-8',
  },
  iterations: { warmup: WARMUP, transform: TRANSFORM_ITERS },
  handshakeMs: rpc.handshakeMs,
  rpcTransform: rpc.transform,
  inProcessTransform: inProcess,
  isolationTaxP50: isolationTax,
  meanReplyBytes: rpc.meanReplyBytes,
  remap: rpc.remap,
  lispAlias: rpc.lispAlias,
  crashCutoff: crash,
  tscE2e,
};

const outFile = join(ROOT, 'harness.results.json');
writeFileSync(outFile, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
console.log(`\nWrote ${outFile}`);
