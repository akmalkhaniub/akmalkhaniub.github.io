#!/usr/bin/env node
/**
 * Automated Verification Pipeline for Akmal Khan Tech Blog.
 *
 * Audits:
 * 1. Mermaid v10 invariants (flowchart TD only, no LR, no quoted rhombus nodes).
 * 2. Duplicate slugs in posts.json.
 * 3. Canonical ## References & Further Reading heading (warn).
 * 4. Static build compilation (build-blog.js).
 *
 * Usage: npm run pipeline [optional-slug]
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

console.log('Running 3-Tier Publishing Verification Pipeline...\n');

const targetSlug = process.argv[2];
const postsDir = path.join(ROOT, 'blog', 'posts');
const postsJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'blog', 'posts.json'), 'utf8'));

const slugCounts = new Map();
for (const p of postsJson) {
  slugCounts.set(p.slug, (slugCounts.get(p.slug) || 0) + 1);
}
const dupes = [...slugCounts.entries()].filter(([, n]) => n > 1);
if (dupes.length) {
  console.error('Duplicate slugs in posts.json:');
  for (const [slug, n] of dupes) console.error(`  ${slug} x${n}`);
  process.exit(1);
}

const files = targetSlug
  ? [`${targetSlug.replace(/\.md$/, '')}.md`]
  : fs.readdirSync(postsDir).filter((f) => f.endsWith('.md'));

let hasError = false;
let warnCount = 0;

for (const file of files) {
  const filePath = path.join(postsDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    hasError = true;
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const mermaidBlocks = [...content.matchAll(/```mermaid[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]);

  for (const block of mermaidBlocks) {
    if (/\b(?:flowchart|graph)\s+LR\b/i.test(block)) {
      console.error(`[${file}] Horizontal diagram (LR). Convert to flowchart TD.`);
      hasError = true;
    }
    if (/\bgraph\s+TD\b/i.test(block)) {
      console.error(`[${file}] Use flowchart TD, not graph TD.`);
      hasError = true;
    }
    if (/\w+\{\s*["']/.test(block)) {
      console.error(`[${file}] Quoted curly-brace Mermaid node. Use NodeID["Label"].`);
      hasError = true;
    }
  }

  if (!/^## References & Further Reading\s*$/m.test(content)) {
    console.warn(`[${file}] Missing canonical ## References & Further Reading heading.`);
    warnCount++;
  }
}

if (hasError) {
  console.error('\nPipeline halted due to diagram/syntax errors.');
  process.exit(1);
}

console.log(`Markdown audit passed (${files.length} files, ${warnCount} reference warnings).`);
console.log('Executing static blog build (scripts/build-blog.js)...');
try {
  execSync('node scripts/build-blog.js', { cwd: ROOT, stdio: 'inherit' });
} catch {
  console.error('Build failed.');
  process.exit(1);
}

console.log('\n3-Tier Publishing Pipeline verification completed.');
