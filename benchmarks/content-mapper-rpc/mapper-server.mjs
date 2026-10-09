#!/usr/bin/env node
/**
 * TypeScript 7.1 content mapper process.
 *
 * Speaks JSON-RPC 2.0 with Content-Length framing on STDIO. Handles the four
 * methods the 7.1 nightly host sends: initialize, openProject, closeProject,
 * transform. Never sends requests of its own.
 *
 * Usage: node mapper-server.mjs
 * Optional: MAPPER_CRASH_AFTER=N exits after N successful transform replies.
 */
import { JsonRpcReader, success, failure, writeMessage } from './protocol.mjs';
import { transformMappedFile } from './sfc-transform.mjs';

const crashAfter = Number.parseInt(process.env.MAPPER_CRASH_AFTER ?? '0', 10);
let transformCount = 0;

const reader = new JsonRpcReader(process.stdin);
process.stdin.resume();

function handle(message) {
  const id = message.id;
  const method = message.method;
  const params = message.params ?? {};

  if (id === undefined || id === null) {
    return null;
  }

  switch (method) {
    case 'initialize': {
      const encodings = params.positionEncodings ?? [];
      const positionEncoding = encodings.includes('utf-8') ? 'utf-8' : encodings[0];
      if (positionEncoding !== 'utf-8' && positionEncoding !== 'utf-16') {
        return failure(id, -32602, 'mapper requires utf-8 or utf-16');
      }
      return success(id, {
        positionEncoding: 'utf-8',
        diagnosticSource: 'sfc-mapper',
      });
    }
    case 'openProject':
      return success(id, {});
    case 'closeProject':
      return success(id, null);
    case 'transform': {
      if (typeof params.fileName !== 'string' || typeof params.content !== 'string') {
        return failure(id, -32602, 'transform requires fileName and content');
      }
      if (!params.projectHandle) {
        return failure(id, -32602, 'transform requires projectHandle');
      }
      const result = transformMappedFile(params.fileName, params.content);
      transformCount += 1;
      if (crashAfter > 0 && transformCount >= crashAfter) {
        writeMessage(process.stdout, success(id, result));
        process.exit(1);
      }
      return success(id, result);
    }
    default:
      return failure(id, -32601, `Method not found: ${method}`);
  }
}

async function main() {
  for (;;) {
    const message = await reader.read();
    const reply = handle(message);
    if (reply) {
      writeMessage(process.stdout, reply);
    }
  }
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
  process.exit(1);
});
