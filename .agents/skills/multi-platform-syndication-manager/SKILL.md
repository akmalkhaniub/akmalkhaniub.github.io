---
name: multi-platform-syndication-manager
description: >-
  Manages downstream multi-platform syndication across developer platforms (Dev.to, Hashnode, Medium)
  and developer communities (Hacker News, Lobsters, Reddit, Substack, LinkedIn). Enforces canonical
  URL tags to protect search engine rankings and tailors markdown formatting to each platform.
---

# Multi-Platform Syndication Manager: The Amplification Engine

Publishing solely to your personal domain limits discovery; publishing naively to third-party platforms without canonical tags destroys your domain's Google search authority.

This skill executes a **Downstream Syndication Workflow** referencing `PUBLICATION_TARGETS.json` to distribute canonical articles safely across the global engineering ecosystem.

---

## 🌐 The 4 Syndication Channels

```mermaid
flowchart TD
  Origin["Canonical Article Live on akmalkhaniub.github.io"] --> S1["1. Direct Developer Networks"]
  Origin --> S2["2. Professional Newsletter Broadcasts"]
  Origin --> S3["3. Community Discussion Hubs"]
  Origin --> S4["4. Visual Social Micro-Content"]

  subgraph S1_Detail ["Direct Networks (Strict Canonical Tags)"]
    S1 --> D1["Dev.to (canonical_url: https://...)"]
    S1 --> D2["Hashnode (canonical: https://...)"]
    S1 --> D3["Medium (Import with canonical)"]
  end

  subgraph S2_Detail ["Newsletters"]
    S2 --> N1["Substack Weekly Sunday Briefing"]
    S2 --> N2["LinkedIn Newsletter Article"]
  end

  subgraph S3_Detail ["Community Hubs"]
    S3 --> C1["Hacker News (Algolia Title Optimization)"]
    S3 --> C2["Lobste.rs Submission"]
    S3 --> C3["Reddit (r/webdev, r/reactjs, r/nextjs)"]
  end

  subgraph S4_Detail ["Visual Micro-Content"]
    S4 --> M1["ByteByteGo-Style LinkedIn Carousel Slides"]
    S4 --> M2["Twitter/X Technical Visual Thread"]
  end
```

---

## 🔒 The Canonical SEO Protection Invariant

Never copy-paste an article to Dev.to, Hashnode, or Medium without verifying the canonical URL header:
```yaml
---
title: "The Exact Article Title"
canonical_url: "https://akmalkhaniub.github.io/blog/slug.html"
published: true
---
```
This instructs Google, Bing, and DuckDuckGo that your personal portfolio domain is the original intellectual owner, preventing duplicate content penalization.
