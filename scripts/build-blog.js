#!/usr/bin/env node
/**
 * Static blog builder.
 *
 * Reads blog/posts.json + blog/posts/*.md and generates:
 *   - blog/<slug>.html   (fully pre-rendered article pages with SEO meta)
 *   - sitemap.xml        (site root)
 *   - feed.xml           (RSS 2.0, site root)
 *
 * Usage: npm install && npm run build
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://akmalkhaniub.github.io';
const AUTHOR = 'Akmal Khan';

const posts = JSON.parse(readFileSync(join(ROOT, 'blog', 'posts.json'), 'utf8'));

// ---------- helpers ----------
const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const toISO = (dateStr) => {
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
};

// ---------- markdown renderer ----------
const renderer = new marked.Renderer();

renderer.code = function (token) {
  const codeText = typeof token === 'object' && token !== null ? (token.text ?? '') : String(token ?? '');
  const lang = typeof token === 'object' && token !== null ? (token.lang ?? '') : '';
  if (lang === 'mermaid') {
    return `<div class="mermaid">${escapeHtml(codeText)}</div>\n`;
  }
  return `<pre><code class="language-${lang || 'plaintext'}">${escapeHtml(codeText)}</code></pre>\n`;
};

renderer.link = function (token) {
  const href = token.href ?? '';
  const title = token.title ? ` title="${escapeHtml(token.title)}"` : '';
  const text = this.parser ? this.parser.parseInline(token.tokens) : escapeHtml(token.text ?? '');
  const isExternal = /^https?:\/\//.test(href);
  const target = isExternal ? ' target="_blank" rel="noopener"' : '';
  if (href.includes('github.com')) {
    return `<a href="${escapeHtml(href)}"${title}${target} class="repo-link"><i class="fa-brands fa-github"></i> ${text}</a>`;
  }
  return `<a href="${escapeHtml(href)}"${title}${target}>${text}</a>`;
};

marked.use({ renderer });

// ---------- page template ----------
const sortedPosts = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));

const sidebarHtml = (activeSlug) =>
  sortedPosts
    .map(
      (p) => `            <li class="sidebar-post-item${p.slug === activeSlug ? ' active' : ''}">
              <a href="${p.slug}.html">${escapeHtml(p.title)}<span class="sidebar-post-date">${escapeHtml(p.date)}</span></a>
            </li>`
    )
    .join('\n');

function pageHtml(post, bodyHtml) {
  const url = `${SITE}/blog/${post.slug}.html`;
  const title = escapeHtml(post.title);
  const desc = escapeHtml(post.description);
  const iso = toISO(post.date);
  const tagsHtml = post.tags.map((t) => `<span class="project-badge">${escapeHtml(t)}</span>`).join('');
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: post.title,
    description: post.description,
    url,
    ...(iso ? { datePublished: iso } : {}),
    keywords: post.tags.join(', '),
    author: { '@type': 'Person', name: AUTHOR, url: `${SITE}/` },
    mainEntityOfPage: url
  }, null, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Akmal Khan Tech Blog</title>
  <meta name="description" content="${desc}">
  <meta name="author" content="${AUTHOR}">
  <link rel="canonical" href="${url}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="alternate" type="application/rss+xml" title="Akmal Khan Tech Blog" href="${SITE}/feed.xml">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="https://github.com/akmalkhaniub.png">
  <meta property="og:site_name" content="${AUTHOR}">
  ${iso ? `<meta property="article:published_time" content="${iso}">` : ''}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="https://github.com/akmalkhaniub.png">

  <script type="application/ld+json">
${jsonLd}
  </script>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <!-- FontAwesome + Prism theme -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">

  <link rel="stylesheet" href="../style.css">
  <link rel="stylesheet" href="article.css">

  <script>
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  </script>
</head>
<body>

  <div id="progress-container"><div id="progress-bar"></div></div>
  <div class="bg-grid"></div>
  <div class="glow-orb orb-1"></div>
  <div class="glow-orb orb-2"></div>

  <header>
    <div class="header-container">
      <a href="../" class="logo"><span class="logo-accent">&lt;</span>Akmal Khan<span class="logo-accent"> /&gt;</span></a>
      <nav>
        <ul>
          <li><a href="../#about" class="nav-link">About</a></li>
          <li><a href="../#skills" class="nav-link">Skills</a></li>
          <li><a href="../#projects" class="nav-link">Projects</a></li>
          <li><a href="../certifications.html" class="nav-link">Certs</a></li>
          <li><a href="../publications.html" class="nav-link">Research</a></li>
          <li><a href="index.html" class="nav-link active-nav">Blog</a></li>
          <li><a href="../#contact" class="nav-link nav-btn">Get In Touch</a></li>
        </ul>
      </nav>
      <button id="theme-toggle" class="theme-toggle-btn" aria-label="Toggle dark mode"><i class="fa-solid fa-moon"></i></button>
      <button class="mobile-nav-toggle" aria-label="Toggle menu" id="mobile-toggle"><i class="fa-solid fa-bars"></i></button>
    </div>
  </header>

  <main class="article-container">
    <div class="blog-layout">
      <div class="article-main-column">
        <a href="index.html" class="back-btn"><i class="fa-solid fa-arrow-left"></i> Back to Blog</a>

        <article class="article-card">
          <div class="article-header">
            <h1 class="article-title">${title}</h1>
            <div class="article-meta">
              <span><i class="fa-regular fa-calendar"></i> ${escapeHtml(post.date)}</span>
              <span><i class="fa-solid fa-user"></i> ${AUTHOR}</span>
              <span><i class="fa-regular fa-clock"></i> ${escapeHtml(post.readTime)}</span>
              <div class="article-tags">${tagsHtml}</div>
            </div>
          </div>

          <div class="article-body">
${bodyHtml}
          </div>

          <div class="share-box">
            <span class="share-label"><i class="fa-solid fa-share-nodes"></i> Share:</span>
            <button id="share-link-btn" class="btn btn-sm btn-secondary"><i class="fa-regular fa-copy"></i> Copy Link</button>
            <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}" target="_blank" rel="noopener" class="btn btn-sm btn-secondary"><i class="fa-brands fa-linkedin"></i> LinkedIn</a>
            <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(url)}" target="_blank" rel="noopener" class="btn btn-sm btn-secondary"><i class="fa-brands fa-x-twitter"></i> X / Twitter</a>
          </div>

          <div class="newsletter-box">
            <h3><i class="fa-regular fa-paper-plane"></i> Subscribe to my Newsletter</h3>
            <p>Get my latest deep-dives on backend architectures, AI agents, and production systems directly in your inbox.</p>
            <form action="https://akmalshahbaz.substack.com/api/v1/free?nojs=true" method="post" target="_blank" class="newsletter-form">
              <input type="email" name="email" placeholder="Enter your email address..." required aria-label="Email address" />
              <button type="submit" class="btn btn-primary">Subscribe</button>
            </form>
          </div>

          <div class="comments-section">
            <h3><i class="fa-regular fa-comments"></i> Discussion &amp; Comments</h3>
            <div class="giscus"></div>
          </div>
        </article>
      </div>

      <aside class="blog-sidebar">
        <div class="sidebar-card">
          <h4><i class="fa-solid fa-list"></i> Latest Articles</h4>
          <ul class="sidebar-post-list">
${sidebarHtml(post.slug)}
          </ul>
        </div>
        <div class="sidebar-card">
          <h4><i class="fa-solid fa-user-astronaut"></i> The Author</h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.75rem;">
            <strong>${AUTHOR}</strong> is a Senior Staff Engineer specializing in full-stack AI platforms, agentic pipelines, and vector search database systems.
          </p>
          <a href="../#about" style="font-size: 0.8rem; font-weight: 600; color: var(--accent-cyan); text-decoration: underline;">Learn more about Akmal &rarr;</a>
        </div>
      </aside>
    </div>
  </main>

  <div id="zoom-modal"><div id="zoom-content"></div></div>

  <footer>
    <div class="container footer-container">
      <p>&copy; ${new Date().getFullYear()} ${AUTHOR}. All rights reserved.</p>
      <div class="footer-links">
        <a href="https://github.com/akmalkhaniub" target="_blank" rel="noopener"><i class="fa-brands fa-github"></i></a>
        <a href="https://www.linkedin.com/in/akmal-khan-332000250/" target="_blank" rel="noopener"><i class="fa-brands fa-linkedin"></i></a>
      </div>
    </div>
  </footer>

  <!-- Giscus comments -->
  <script src="https://giscus.app/client.js"
          data-repo="akmalkhaniub/akmalkhaniub.github.io"
          data-repo-id="R_kgDOSuTO2A"
          data-category="General"
          data-category-id="DIC_kwDOSuTO2M4C-VTn"
          data-mapping="pathname"
          data-strict="0"
          data-reactions-enabled="1"
          data-emit-metadata="0"
          data-input-position="bottom"
          data-theme="preferred_color_scheme"
          data-lang="en"
          crossorigin="anonymous"
          async></script>

  <!-- Prism syntax highlighting -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-bash.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-sql.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js"></script>
  ${bodyHtml.includes('class="mermaid"') ? '<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>' : ''}

  <script src="../shared.js"></script>
  <script src="article.js"></script>
</body>
</html>
`;
}

// ---------- build ----------
let built = 0;
const failures = [];
for (const post of posts) {
  const mdPath = join(ROOT, 'blog', 'posts', `${post.slug}.md`);
  if (!existsSync(mdPath)) {
    failures.push(`${post.slug}: markdown file missing`);
    continue;
  }
  const md = readFileSync(mdPath, 'utf8');
  const bodyHtml = marked.parse(md);
  writeFileSync(join(ROOT, 'blog', `${post.slug}.html`), pageHtml(post, bodyHtml));
  built++;
}

// sitemap.xml
const today = new Date().toISOString().split('T')[0];
const urls = [
  { loc: `${SITE}/`, lastmod: today, priority: '1.0' },
  { loc: `${SITE}/blog/`, lastmod: today, priority: '0.8' },
  { loc: `${SITE}/certifications.html`, lastmod: today, priority: '0.7' },
  { loc: `${SITE}/publications.html`, lastmod: today, priority: '0.7' },
  ...sortedPosts.map((p) => ({
    loc: `${SITE}/blog/${p.slug}.html`,
    lastmod: toISO(p.date) || today,
    priority: '0.6'
  }))
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap);

// feed.xml (RSS 2.0)
const rssItems = sortedPosts
  .map((p) => {
    const link = `${SITE}/blog/${p.slug}.html`;
    const pub = new Date(p.date);
    return `    <item>
      <title>${escapeHtml(p.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <description>${escapeHtml(p.description)}</description>
      ${Number.isNaN(pub.getTime()) ? '' : `<pubDate>${pub.toUTCString()}</pubDate>`}
      ${p.tags.map((t) => `<category>${escapeHtml(t)}</category>`).join('')}
    </item>`;
  })
  .join('\n');
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Akmal Khan Tech Blog</title>
    <link>${SITE}/blog/</link>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Technical deep-dives on AI agents, database optimization, and high-performance backend systems.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${rssItems}
  </channel>
</rss>
`;
writeFileSync(join(ROOT, 'feed.xml'), rss);
console.log(`Built ${built}/${posts.length} posts, sitemap.xml, feed.xml`);
if (failures.length) {
  console.error('Failures:\n  ' + failures.join('\n  '));
  process.exit(1);
}
