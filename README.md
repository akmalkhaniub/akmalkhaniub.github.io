# Akmal Khan — Professional Portfolio Website 🚀

<p align="left">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome">
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat-square" alt="License MIT">
</p>

This repository hosts the source code for my professional portfolio website: **[akmalkhaniub.github.io](https://akmalkhaniub.github.io)**.

It is a modern, Bento Grid-style site built with semantic HTML5, custom CSS variables, and vanilla JavaScript — plus a fully **pre-rendered static blog** for maximum SEO.

## 🏗️ Structure & Key Features
- **Profile Hero:** Overview of my experience as a Senior Full Stack AI Engineer focusing on AI-Powered Platforms.
- **Featured Projects:** Highlights of core projects linking to their source code.
- **Static Blog:** 38+ technical deep-dives, pre-rendered to static HTML pages with full Open Graph / Twitter Card / JSON-LD metadata.
- **SEO:** `sitemap.xml`, `feed.xml` (RSS), `robots.txt`, canonical URLs, and structured data on every page.
- **Dark/Light Theme:** Persistent theme toggle with theme-aware GitHub stats.
- **Responsive Design:** Optimized for mobile, tablet, and desktop.

## 📁 Layout
```
index.html          Landing page
style.css           Global design system (light/dark themes)
shared.js           Shared behavior (theme toggle, mobile nav)
app.js              Home page behavior (scroll spy, featured article)
blog/
  index.html        Blog index (search + listing)
  posts.json        Blog post registry (metadata)
  posts/*.md        Article sources (Markdown)
  <slug>.html       Generated static article pages (do not edit by hand)
  article.css/.js   Shared article page assets
scripts/
  build-blog.js     Static site generator for the blog
```

## ✍️ Adding a Blog Post
1. Write the article as `blog/posts/<slug>.md`.
2. Add its metadata entry to `blog/posts.json`.
3. Rebuild:

```bash
npm install   # first time only
npm run build # generates blog/<slug>.html, sitemap.xml, feed.xml
```

4. Commit and push — GitHub Pages serves the generated pages directly.

## 🚀 Running Locally
No build needed for browsing — serve the folder statically:

```bash
python -m http.server 8000
# or
npx serve .
```

## 📄 License
MIT License. Feel free to use this layout as inspiration for your own portfolio!
