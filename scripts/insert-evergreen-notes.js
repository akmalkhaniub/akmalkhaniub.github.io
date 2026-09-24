#!/usr/bin/env node
/**
 * Insert evergreen / sibling-canonical notes into selected posts.
 * Idempotent: skips if the note marker is already present.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const POSTS = join(ROOT, 'blog', 'posts');

const NEXT_BANNER = `> [!NOTE]
> **Update (September 2026)**: Next.js **16.3 is Active LTS**. Next.js 15 is Maintenance LTS until 21 October 2026. Next.js 14 reached EOL on 26 October 2025. Treat version-specific APIs below as historical unless a section is marked current. See [The Great Un-Caching](the-great-un-caching-nextjs-15-caching-architecture-defaults.html) for the 15 default inversion.
`;

const nextjsSlugs = [
  'the-great-un-caching-nextjs-15-caching-architecture-defaults',
  'async-request-apis-nextjs-15-cookies-headers-params-concurrency',
  'nextjs-react19-form-states',
  'nextjs-async-request-apis-react-19',
  'nextjs-15-react-19-optimistic-ui',
  'nextjs-14-to-15-migration-gotchas',
  'react-nextjs-compiler-ppr-actions',
  'nextjs-caching-revolution-unstable-cache',
  'nextjs-partial-prerendering-ppr-production',
  'nextjs-dynamic-io-compilation',
  'nextjs-instrumentation-observability',
  'nextjs-turbopack-native-tooling-era',
  'nextjs-server-actions-unified-mutations',
  'nextjs-rsc-boundary-serialization'
];

const siblingNotes = [
  {
    slug: 'distributed-transactions-two-phase-commit-percolator-protocol',
    note: `> [!NOTE]
> **Catalog note**: This post overlaps [Distributed Transactions: Two-Phase Commit and Percolator](distributed-transactions-two-phase-commit-percolator.html). Prefer that sibling for the primary-lock walkthrough; keep this one for the TSO / prewrite packet sequence.
`
  },
  {
    slug: 'lock-free-data-structures-hazard-pointers-cas-aba-problem',
    note: `> [!NOTE]
> **Catalog note**: This post overlaps [Lock-Free Data Structures: CAS, ABA, and Hazard Pointers](lock-free-data-structures-cas-aba-hazard-pointers.html). Read them as a pair, not as two competing introductions.
`
  },
  {
    slug: 'hybrid-search-reranking-dense-sparse',
    note: `> [!NOTE]
> **Catalog note**: For the production RRF path, see [Hybrid Search with Sparse and Dense Ranking](rag-hybrid-search-sparse-dense-rrf-ranking.html).
`
  },
  {
    slug: 'real-time-token-streaming-sse-websockets',
    note: `> [!NOTE]
> **Catalog note**: Gateway-level SSE vs WebSocket trade-offs also live in [Gateway SSE vs WebSockets](gateway-sse-vs-websockets-real-time-streaming.html).
`
  },
  {
    slug: 'nextjs-async-request-apis-react-19',
    note: `> [!NOTE]
> **Catalog note**: The full async-params / cookies / PPR treatment is in [The Async Request API Shift](async-request-apis-nextjs-15-cookies-headers-params-concurrency.html).
`
  }
];

function insertAfterTitle(md, note) {
  if (md.includes('**Update (September 2026)**') && note.includes('**Update (September 2026)**')) {
    return md;
  }
  if (note.includes('**Catalog note**') && md.includes('**Catalog note**')) {
    return md;
  }
  const match = md.match(/^(# [^\n]+\n+)/);
  if (!match) return `${note}\n${md}`;
  return md.replace(match[1], `${match[1]}\n${note}\n`);
}

let updated = 0;
for (const slug of nextjsSlugs) {
  const path = join(POSTS, `${slug}.md`);
  if (!existsSync(path)) continue;
  const md = readFileSync(path, 'utf8');
  if (md.includes('Next.js **16.3 is Active LTS**')) continue;
  writeFileSync(path, insertAfterTitle(md, NEXT_BANNER));
  updated++;
}

for (const { slug, note } of siblingNotes) {
  const path = join(POSTS, `${slug}.md`);
  if (!existsSync(path)) continue;
  const md = readFileSync(path, 'utf8');
  if (md.includes('**Catalog note**')) continue;
  writeFileSync(path, insertAfterTitle(md, note));
  updated++;
}

console.log(`Inserted notes into ${updated} posts`);
