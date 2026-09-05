import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env variables safely
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return {};
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

// Clean and map tags to high-traffic Dev.to community tags
function sanitizeDevtoTags(rawTags = [], customTags = null) {
  if (customTags && customTags.length > 0) {
    return customTags.map(t => t.toLowerCase().replace(/[^a-z0-9]/g, '')).slice(0, 4);
  }

  const tagMap = {
    'ai': 'ai',
    'aiagents': 'ai',
    'agents': 'ai',
    'llms': 'ai',
    'llm': 'ai',
    'aicinema': 'ai',
    'systemdesign': 'architecture',
    'architecture': 'architecture',
    'distributed': 'architecture',
    'programming': 'programming',
    'software': 'programming',
    'engineeringculture': 'discuss',
    'philosophyofai': 'discuss',
    'culture': 'discuss',
    'productivity': 'productivity',
    'deterministicai': 'programming',
    'agentskills': 'ai',
    'python': 'python',
    'webdev': 'webdev'
  };

  const selected = [];
  for (const raw of rawTags) {
    const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    const mapped = tagMap[clean] || (clean.length <= 15 ? clean : null);
    if (mapped && !selected.includes(mapped)) {
      selected.push(mapped);
    }
    if (selected.length === 4) break;
  }

  // Fallback defaults
  const defaults = ['ai', 'programming', 'architecture', 'discuss'];
  for (const d of defaults) {
    if (selected.length >= 4) break;
    if (!selected.includes(d)) selected.push(d);
  }

  return selected.slice(0, 4);
}

// Prepare Markdown body for Dev.to
function prepareMarkdownForDevto(rawMarkdown, metadata, slug) {
  let body = rawMarkdown.trim();

  // Strip leading H1 title if present to avoid duplicate titles on Dev.to
  body = body.replace(/^#\s+[^\n]+\n+/, '');

  // Add canonical source attribution banner at the bottom
  const canonicalUrl = `https://akmalkhaniub.github.io/blog/${slug}.html`;
  const footerBanner = `\n\n---\n\n*Originally published at [akmalkhaniub.github.io](${canonicalUrl})*`;

  return body + footerBanner;
}

// POST article to Dev.to API
async function postToDevto(apiKey, articlePayload) {
  return new Promise((resolve, reject) => {
    const payloadData = JSON.stringify({ article: articlePayload });
    const options = {
      hostname: 'dev.to',
      port: 443,
      path: '/api/articles',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
        'User-Agent': 'AkmalBlogSync/1.0',
        'Content-Length': Buffer.byteLength(payloadData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`Dev.to API Error (${res.statusCode}): ${JSON.stringify(json)}`));
          }
        } catch (err) {
          reject(new Error(`Failed to parse Dev.to response: ${data}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(payloadData);
    req.end();
  });
}

// Main execution function
async function main() {
  const args = process.argv.slice(2);
  const slugIdx = args.indexOf('--slug');
  const slug = slugIdx !== -1 ? args[slugIdx + 1] : null;
  const isPublish = args.includes('--publish'); // Default is draft (published: false)
  const isDryRun = args.includes('--dry-run');

  const tagsIdx = args.indexOf('--tags');
  const customTags = tagsIdx !== -1 ? args[tagsIdx + 1].split(',') : null;

  if (!slug) {
    console.error('Usage: node scripts/publish-to-devto.js --slug <slug> [--publish] [--dry-run] [--tags t1,t2,t3]');
    process.exit(1);
  }

  const env = loadEnv();
  const apiKey = env.DEVTO_API_KEY;

  if (!apiKey && !isDryRun) {
    console.error('Error: DEVTO_API_KEY not found in .env file!');
    process.exit(1);
  }

  // Load post metadata from posts.json
  const postsJsonPath = path.join(__dirname, '..', 'blog', 'posts.json');
  const allPosts = JSON.parse(fs.readFileSync(postsJsonPath, 'utf8'));
  const postMeta = allPosts.find(p => p.slug === slug);

  if (!postMeta) {
    console.error(`Error: Post with slug "${slug}" not found in blog/posts.json!`);
    process.exit(1);
  }

  // Load markdown content
  const mdPath = path.join(__dirname, '..', 'blog', 'posts', `${slug}.md`);
  if (!fs.existsSync(mdPath)) {
    console.error(`Error: Markdown file "${mdPath}" does not exist!`);
    process.exit(1);
  }

  const rawMarkdown = fs.readFileSync(mdPath, 'utf8');
  const devtoBody = prepareMarkdownForDevto(rawMarkdown, postMeta, slug);
  const devtoTags = sanitizeDevtoTags(postMeta.tags, customTags);
  const canonicalUrl = `https://akmalkhaniub.github.io/blog/${slug}.html`;

  const mainImage = (postMeta.coverImage && !postMeta.coverImage.includes('default.png'))
    ? `https://akmalkhaniub.github.io${postMeta.coverImage}`
    : null;

  const articlePayload = {
    title: postMeta.title,
    body_markdown: devtoBody,
    published: isPublish,
    tags: devtoTags,
    canonical_url: canonicalUrl,
    description: postMeta.description,
    ...(mainImage ? { main_image: mainImage } : {})
  };

  console.log(`\n======================================================`);
  console.log(` 🚀 Dev.to Publishing Review for: "${postMeta.title}"`);
  console.log(`======================================================`);
  console.log(` • Slug          : ${slug}`);
  console.log(` • Mode          : ${isPublish ? '🔴 Live Publication' : '🟡 Draft (Preview on Dashboard)'}`);
  console.log(` • Tags (Max 4)  : [ ${devtoTags.join(', ')} ]`);
  console.log(` • Canonical URL : ${canonicalUrl}`);
  console.log(` • Markdown Size : ${devtoBody.length} characters`);

  if (isDryRun) {
    console.log(`\n[DRY RUN] Payload verified successfully. Not sending API request.`);
    return;
  }

  console.log(`\n📡 Sending article to Dev.to API...`);
  try {
    const result = await postToDevto(apiKey, articlePayload);
    console.log(`\n🎉 Success! Article created on Dev.to.`);
    console.log(` • Article ID  : ${result.id}`);
    console.log(` • URL         : ${result.url}`);
    if (!isPublish) {
      console.log(` • Draft Link  : https://dev.to/dashboard (Check your drafts to review and publish!)`);
    }
  } catch (err) {
    console.error(`\n❌ Failed to publish to Dev.to:`, err.message);
    process.exit(1);
  }
}

main();
