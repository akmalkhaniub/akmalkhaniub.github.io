---
name: seo-and-publication-qa-auditor
description: >-
  Conducts comprehensive pre-flight technical quality assurance, SEO validation, and static build
  verification before publishing. Audits heading anchors, Table of Contents mapping, JSON-LD schemas,
  OpenGraph tags, RSS feeds, sitemaps, and mobile responsiveness.
---

# SEO & Publication QA Auditor: The Release Gatekeeper

An article is not ready for deployment simply because the markdown is written. Broken navigation links, missing meta tags, malformed JSON-LD schemas, and build warnings ruin the reader experience and damage search engine ranking.

This skill acts as the **Release Quality Assurance Engineer**, executing an exhaustive pre-flight checklist.

---

## 🔍 The 5 Pre-Flight QA Verification Audits

### 1. Heading ID & TOC Alignment
* Scans all `<h2>` and `<h3>` tags in the markdown.
* Verifies that every heading generates a valid, slugified `id` attribute.
* Confirms that the Desktop Sticky TOC and Mobile Collapsible TOC correspond 1-to-1 with the actual heading anchors.

### 2. Scholarly Citation & Hovercard Audit
* Checks that every `[n]` citation marker in the prose corresponds to an active entry in `## References & Further Reading`.
* Verifies that citations contain valid external HTTP/HTTPS links and accurate publisher metadata.

### 3. Structured Data & Technical SEO
* Confirms the presence of valid JSON-LD schema (`TechArticle`) containing:
  - `headline`
  - `datePublished` (ISO format: `YYYY-MM-DD`)
  - `description`
  - `keywords`
  - `author` (Akmal Khan)
* Confirms OpenGraph (`og:image`, `og:title`, `og:description`) and Twitter Card metadata.

### 4. Feed & Sitemap Synchronization
* Confirms that `feed.xml` (RSS 2.0) and `sitemap.xml` are automatically rebuilt and contain the new slug with the latest timestamp.

### 5. Automated Build Verification
* Runs `npm run build` and confirms that:
  - Zero fatal errors or unhandled promise rejections occur.
  - All posts build cleanly (e.g. `Built 439/439 posts`).
  - Git working tree status is verified.
