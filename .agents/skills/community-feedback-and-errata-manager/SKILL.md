---
name: community-feedback-and-errata-manager
description: >-
  Manages post-publication community feedback, Giscus comments, Hacker News critiques, and errata.
  Triages technical challenges from readers, drafts authoritative architectural responses, and
  safely integrates Errata & Update callouts into published articles without breaking document integrity.
---

# Community Feedback & Errata Manager: Living Architecture & Reader Engagement

Great engineering publications do not end when an article is deployed. The most insightful technical conversations happen post-publication: on **Giscus (GitHub Discussions)**, **Hacker News**, and **LinkedIn**.

When senior staff engineers point out edge cases, benchmark discrepancies, or newer framework releases, how an author responds defines their credibility.

This skill manages **post-publication community interactions, feedback triage, and errata maintenance**.

---

## 🔄 The 3 Post-Publication Responsibilities

### 1. Reader Feedback & Comment Triage
* Monitors Giscus comments on the blog and Hacker News threads.
* Categorizes incoming feedback:
  - **Clarification Request**: Reader seeking deeper explanation of a diagram or code snippet.
  - **Counter-Argument**: Reader presenting an alternative architectural approach.
  - **Legitimate Erratum**: Reader identifying a typo, API change, or benchmark nuance.

### 2. Errata & Update Callout Protocol
When an article requires an update or correction:
* Never silently alter past claims.
* Insert a standardized GitHub-style Alert blockquote at the top of the relevant section:
  ```markdown
  > [!NOTE]
  > **Update (September 2026)**: Following the release of Next.js 16.3.4, the `cacheLife` profile default was updated from 15 minutes to 60 minutes. The benchmarks below have been re-indexed. Thanks to community member @alex for flagging.
  ```

### 3. Living Document Maintenance
* Annually audits older articles (e.g. Next.js 14, React 18) and inserts historical context banners indicating that the post discusses an older LTS release.
