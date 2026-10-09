#!/usr/bin/env node
/**
 * Catalog hygiene pass:
 *  - Convert graph/flowchart LR and graph TD to flowchart TD
 *  - Replace Node{"..."} with Node["..."]
 *  - Strip emoji from mermaid blocks
 *  - Sanitize edge labels (no leading step digits, no colons)
 *  - Normalize reference headings so the builder can wire citation IDs
 *  - Deduplicate posts.json by slug
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_DIR = join(ROOT, 'blog', 'posts');

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu;

function sanitizeEdgeLabel(label) {
  let out = String(label)
    .replace(/^\s*\d+[a-zA-Z]?\.\s*/, '')
    .replace(/:/g, ' -')
    .replace(/\s+/g, ' ')
    .trim();
  return out;
}

function sanitizeMermaidBlock(body) {
  let b = body;
  b = b.replace(/\b(flowchart|graph)\s+LR\b/gi, 'flowchart TD');
  b = b.replace(/\bgraph\s+TD\b/gi, 'flowchart TD');
  b = b.replace(/(\b[A-Za-z][\w]*)\{\{\s*"([^"]*)"\s*\}\}/g, '$1["$2"]');
  b = b.replace(/(\b[A-Za-z][\w]*)\{\s*"([^"]*)"\s*\}/g, '$1["$2"]');
  b = b.replace(/(\b[A-Za-z][\w]*)\{\s*'([^']*)'\s*\}/g, '$1["$2"]');
  b = b.replace(EMOJI_RE, '');
  b = b.replace(/-->\|([^|]*)\|/g, (_, label) => `-->|${sanitizeEdgeLabel(label)}|`);
  b = b.replace(/-\.->\|([^|]*)\|/g, (_, label) => `-.->|${sanitizeEdgeLabel(label)}|`);
  b = b.replace(/==>\|([^|]*)\|/g, (_, label) => `==>|${sanitizeEdgeLabel(label)}|`);
  return b;
}

function sanitizeMarkdown(md) {
  let next = md.replace(/```mermaid[^\n]*\n([\s\S]*?)```/g, (full, body) => {
    return '```mermaid\n' + sanitizeMermaidBlock(body) + '```';
  });

  next = next.replace(
    /^#{2,3}\s+(Research References(?:\s*&\s*Resources)?|References(?:\s*&\s*Resources)?|Further Reading)\s*$/gim,
    '## References & Further Reading'
  );

  return next;
}

function dedupePostsJson() {
  const path = join(ROOT, 'blog', 'posts.json');
  const posts = JSON.parse(readFileSync(path, 'utf8'));
  const seen = new Set();
  const unique = [];
  const dropped = [];
  for (const p of posts) {
    if (seen.has(p.slug)) {
      dropped.push(p.slug);
      continue;
    }
    seen.add(p.slug);
    unique.push(p);
  }
  writeFileSync(path, JSON.stringify(unique, null, 2) + '\n');
  return { before: posts.length, after: unique.length, dropped };
}

const stats = {
  filesTouched: 0,
  lrConverted: 0,
  graphTdConverted: 0,
  curlyQuotes: 0,
  refHeadings: 0
};

for (const file of readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'))) {
  const path = join(POSTS_DIR, file);
  const original = readFileSync(path, 'utf8');
  const updated = sanitizeMarkdown(original);
  if (updated !== original) {
    writeFileSync(path, updated);
    stats.filesTouched++;
    if (/\b(?:flowchart|graph)\s+LR\b/i.test(original)) stats.lrConverted++;
    if (/\bgraph\s+TD\b/i.test(original)) stats.graphTdConverted++;
    if (/\w+\{\s*["']/.test(original)) stats.curlyQuotes++;
    if (/#{2,3}\s+(Research References|References(?:\s*&\s*Resources)?|Further Reading)\s*$/im.test(original)
      && !/^## References & Further Reading$/m.test(original.split('\n').pop() || '')) {
      stats.refHeadings++;
    }
  }
}

const json = dedupePostsJson();
console.log(JSON.stringify({ markdown: stats, postsJson: json }, null, 2));
