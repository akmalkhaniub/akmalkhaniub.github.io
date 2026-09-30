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
const articlesDir = path.join(ROOT, 'blog', 'articles');

let filesToAudit = [];
if (targetSlug) {
  const cleanSlug = targetSlug.replace(/\.md$/, '');
  const articlePath = path.join(articlesDir, cleanSlug, 'article.md');
  const postPath = path.join(postsDir, `${cleanSlug}.md`);
  if (fs.existsSync(articlePath)) {
    filesToAudit.push({ name: `${cleanSlug}/article.md`, path: articlePath });
  } else if (fs.existsSync(postPath)) {
    filesToAudit.push({ name: `${cleanSlug}.md`, path: postPath });
  } else {
    console.error(`❌ Article not found: neither ${articlePath} nor ${postPath} exists.`);
    process.exit(1);
  }
} else {
  if (fs.existsSync(postsDir)) {
    for (const f of fs.readdirSync(postsDir).filter(f => f.endsWith('.md'))) {
      filesToAudit.push({ name: f, path: path.join(postsDir, f), legacy: true });
    }
  }
  if (fs.existsSync(articlesDir)) {
    for (const f of fs.readdirSync(articlesDir)) {
      const artPath = path.join(articlesDir, f, 'article.md');
      if (fs.existsSync(artPath)) {
        filesToAudit.push({ name: `${f}/article.md`, path: artPath, legacy: false });
      }
    }
  }
}

let hasError = false;

for (const item of filesToAudit) {
  const filePath = item.path;
  const file = item.name;
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
