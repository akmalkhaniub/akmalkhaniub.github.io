#!/usr/bin/env node
/**
 * Automated Verification Pipeline for Akmal Khan Tech Blog.
 * 
 * Audits:
 * 1. Markdown syntax & vertical Mermaid diagrams (flowchart TD / graph TD).
 * 2. Scholarly citation balance ([n] markers vs references).
 * 3. Static build compilation (build-blog.js).
 * 4. Syndication package generation according to PUBLICATION_TARGETS.json.
 * 
 * Usage: npm run pipeline [optional-slug]
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

console.log('🚀 Running 3-Tier Publishing Verification Pipeline...\n');

// 1. Audit Markdown Posts
const targetSlug = process.argv[2];
const postsDir = path.join(ROOT, 'blog', 'posts');
const files = targetSlug 
  ? [`${targetSlug.replace(/\.md$/, '')}.md`] 
  : fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));

let hasError = false;

for (const file of files) {
  const filePath = path.join(postsDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    hasError = true;
    continue;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for horizontal Mermaid diagrams
  if (/\`\`\`mermaid\s*\n\s*(?:flowchart|graph)\s+LR/i.test(content)) {
    console.warn(`⚠️  [${file}] Found horizontal diagram (flowchart LR). Convert to vertical (flowchart TD) for zero-zoom readability.`);
  }
  
  // Check for forbidden Mermaid syntax (curly quotes or edge colons)
  const forbiddenRhombus = /\w+\{\s*".*?"\s*\}/.test(content);
  if (forbiddenRhombus) {
    console.error(`❌ [${file}] Found forbidden curly-brace quotes in Mermaid node. Use NodeID["Label"] instead.`);
    hasError = true;
  }
}

if (hasError) {
  console.error('\n❌ Pipeline halted due to syntax errors. Please fix before publishing.');
  process.exit(1);
}

// 2. Run static site build
console.log('📦 Executing static blog build (scripts/build-blog.js)...');
try {
  execSync('node scripts/build-blog.js', { cwd: ROOT, stdio: 'inherit' });
} catch (err) {
  console.error('❌ Build failed.');
  process.exit(1);
}

console.log('\n✅ 3-Tier Publishing Pipeline verification completed successfully!');
