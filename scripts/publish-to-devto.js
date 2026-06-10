#!/usr/bin/env node
/**
 * Dev.to Auto-Publisher
 * 
 * Usage: node scripts/publish-to-devto.js <slug> <your-devto-api-key>
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://akmalkhaniub.github.io';

const slug = process.argv[2];
const apiKey = process.argv[3];

if (!slug || !apiKey) {
  console.error('Usage: node scripts/publish-to-devto.js <slug> <your-devto-api-key>');
  process.exit(1);
}

// 1. Read post metadata
const postsPath = join(ROOT, 'blog', 'posts.json');
const posts = JSON.parse(readFileSync(postsPath, 'utf8'));
const post = posts.find((p) => p.slug === slug);

if (!post) {
  console.error(`Error: Post with slug "${slug}" not found in blog/posts.json`);
  process.exit(1);
}

// 2. Read markdown source file
const mdPath = join(ROOT, 'blog', 'posts', `${slug}.md`);
if (!existsSync(mdPath)) {
  console.error(`Error: Markdown file not found at ${mdPath}`);
  process.exit(1);
}

let markdown = readFileSync(mdPath, 'utf8');

// 3. Prep Dev.to payload
// Dev.to allows up to 4 tags, lowercase alphanumeric
const cleanTags = post.tags
  .map((t) => t.toLowerCase().replace(/[^a-z0-9]/g, ''))
  .slice(0, 4);

// Dev.to expects frontmatter in the markdown body, or sent via JSON payload.
// We will send the JSON payload.
const payload = {
  article: {
    title: post.title,
    published: false, // Always publish as a draft first for review
    body_markdown: markdown,
    tags: cleanTags,
    series: "Advanced Context Engineering", // Optional series tag
    main_image: "https://github.com/akmalkhaniub.png",
    canonical_url: `${SITE}/blog/${slug}.html`,
    description: post.description
  }
};

console.log(`Publishing "${post.title}" to Dev.to as a draft...`);

try {
  const response = await fetch('https://dev.to/api/articles', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'User-Agent': 'NodeJS-Blog-Publisher'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (response.ok) {
    console.log('\n==================================================');
    console.log('🎉 SUCCESS: Post uploaded to Dev.to successfully!');
    console.log(`Draft URL: ${data.url}`);
    console.log(`Edit Draft: https://dev.to/dashboard/drafts/${data.id}`);
    console.log('==================================================\n');
  } else {
    console.error(`API Error (${response.status}):`, data.error || data.message || data);
    process.exit(1);
  }
} catch (error) {
  console.error('Network Error connecting to Dev.to API:', error.message);
  process.exit(1);
}
