---
name: evergreen-lifecycle-and-analytics-monitor
description: >-
  Audits published catalog for framework version deprecations, breaking changes, and reader
  engagement. Inserts historical deprecation notices, flags articles needing refresh, and maintains
  the evergreen credibility of the 400+ article publication.
---

# Evergreen Lifecycle & Analytics Monitor: Catalog Longevity

A technical blog of over 400 articles inevitably suffers from **framework rot**: APIs get deprecated, breaking changes land in major releases (e.g. Next.js 14 EOL vs Next.js 16), and benchmarks shift.

This skill acts as the **Catalog Health Inspector**, monitoring older articles and reader feedback to ensure the entire archive remains credible, up-to-date, or clearly annotated.

---

## 🔄 Catalog Lifecycle Operations

```mermaid
flowchart TD
  Catalog["438+ Published Articles in Catalog"] --> Audit["Periodic Ecosystem Audit"]
  Audit --> Check{"Does Article Discuss Deprecated API or EOL Version?"}
  
  Check -->|Yes: Obsolete| Tag["Insert Standard Deprecation Banner"]
  Check -->|Major Paradigm Shift| Flag["Queue Article for Refresh Rewrite"]
  Check -->|Still Accurate| Clean["Maintain Active Status"]

  Tag --> Banner["Display Callout: This article discusses Next.js 14 which reached EOL on Oct 2025. See Next.js 16 guide."]
```
