#!/usr/bin/env node
/**
 * Models Next.js 16.3 Partial Prefetch request geometry from the documented
 * scheduler: one App Shell per unique route, versus one prefetch per href.
 *
 * This is a payload-accounting harness, not a claim that it executed the
 * Next.js router. Payload sizes are representative RSC JSON sizes for an
 * inbox chrome shell versus a fully rendered thread (layout + messages).
 *
 * Usage: node benchmarks/partial-prefetch-shell/prefetch_model.mjs
 */
import { performance } from 'node:perf_hooks';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SHELL_BYTES = 6_144; // shared App Shell: chrome + Suspense fallbacks
const THREAD_HOLE_BYTES = 41_984; // URL-specific messages for one threadId
const FULL_PAGE_BYTES = SHELL_BYTES + THREAD_HOLE_BYTES;

/**
 * @typedef {object} InboxThreadLink
 * @property {string} href
 * @property {string} routePattern
 * @property {boolean} prefetchTrue
 */

/**
 * @param {number} linkCount
 * @param {number} uniqueRoutes
 * @param {number} prefetchTrueCount
 * @returns {InboxThreadLink[]}
 */
function buildViewport(linkCount, uniqueRoutes, prefetchTrueCount) {
  if (uniqueRoutes < 1 || uniqueRoutes > linkCount) {
    throw new Error('uniqueRoutes must be in [1, linkCount]');
  }
  /** @type {InboxThreadLink[]} */
  const links = [];
  for (let i = 0; i < linkCount; i += 1) {
    const routeIndex = i % uniqueRoutes;
    const threadId = `thr_${String(i).padStart(4, '0')}`;
    const routePattern =
      uniqueRoutes === 1 ? '/inbox/[threadId]' : `/inbox-shard-${routeIndex}/[threadId]`;
    links.push({
      href: `${routePattern.replace('[threadId]', threadId)}`,
      routePattern,
      prefetchTrue: i < prefetchTrueCount,
    });
  }
  return links;
}

/**
 * Legacy Cache Components default: one prefetch of the cached page render
 * per href (and prefetch={true} also pulled uncached dynamic content).
 * @param {InboxThreadLink[]} links
 */
function accountLegacy(links) {
  let requests = 0;
  let bytes = 0;
  for (const link of links) {
    requests += 1;
    bytes += link.prefetchTrue ? FULL_PAGE_BYTES : FULL_PAGE_BYTES;
  }
  return { requests, bytes, mode: 'legacy-per-href' };
}

/**
 * Partial Prefetching: one App Shell per unique routePattern. prefetch={true}
 * adds a second origin invocation that can resolve cached URL-specific data.
 * @param {InboxThreadLink[]} links
 */
function accountPartial(links) {
  const shells = new Set();
  let extraUrlPrefetches = 0;
  let bytes = 0;
  for (const link of links) {
    if (!shells.has(link.routePattern)) {
      shells.add(link.routePattern);
      bytes += SHELL_BYTES;
    }
    if (link.prefetchTrue) {
      extraUrlPrefetches += 1;
      bytes += THREAD_HOLE_BYTES;
    }
  }
  return {
    requests: shells.size + extraUrlPrefetches,
    bytes,
    shells: shells.size,
    extraUrlPrefetches,
    mode: 'partial-prefetch-app-shell',
  };
}

function pctFewer(legacy, next) {
  return ((legacy - next) / legacy) * 100;
}

function runScenario(name, linkCount, uniqueRoutes, prefetchTrueCount) {
  const links = buildViewport(linkCount, uniqueRoutes, prefetchTrueCount);
  const t0 = performance.now();
  const legacy = accountLegacy(links);
  const partial = accountPartial(links);
  const elapsedMs = performance.now() - t0;
  return {
    name,
    linkCount,
    uniqueRoutes,
    prefetchTrueCount,
    elapsedMs,
    legacy,
    partial,
    requestReductionPct: pctFewer(legacy.requests, partial.requests),
    byteReductionPct: pctFewer(legacy.bytes, partial.bytes),
  };
}

const scenarios = [
  runScenario('twenty-links-one-inbox-route', 20, 1, 0),
  runScenario('twenty-links-one-route-five-prefetch-true', 20, 1, 5),
  runScenario('twenty-links-twenty-distinct-routes', 20, 20, 0),
];

const report = {
  generatedAt: new Date().toISOString(),
  runtime: { node: process.version, platform: process.platform, arch: process.arch },
  payloadModel: {
    shellBytes: SHELL_BYTES,
    threadHoleBytes: THREAD_HOLE_BYTES,
    fullPageBytes: FULL_PAGE_BYTES,
    note:
      'Accounting model of the documented 16.3 scheduler (one shell per route; prefetch={true} adds per-link URL data). Not a Next.js production trace.',
  },
  scenarios,
};

const outDir = dirname(fileURLToPath(import.meta.url));
const outFile = join(outDir, 'prefetch_model.results.json');
writeFileSync(outFile, `${JSON.stringify(report, null, 2)}\n`);

console.log(JSON.stringify(report, null, 2));
console.log(`\nWrote ${outFile}`);
