# Canonical Agent Rules: The 3-Tier Publishing Fleet & Vertical-First Standard

Whenever the user asks to write, research, draft, or publish a blog post or technical essay (e.g. using commands like `/goal Publish article...`, `Publish pipeline: <Topic>`, or `Draft blog on <Topic>`), you MUST strictly follow the canonical 3-Tier Publishing Fleet specified in `DEEP_TECH_RESEARCH_AND_VISUAL_BLOG_FRAMEWORK_2026-09-07.md`.

---

## 🛑 Non-Negotiable Invariants

1. **The 3 Mandatory Human-in-the-Loop (HITL) Checkpoints**:
   - **Gate 1 (Topic Selection)**: Present 3 scored dossiers from `topic-proposal-verifier`. STOP and wait for the user's explicit selection.
   - **Gate 2 (Visual Blueprint & Outline)**: Present the vertical diagrams and 5-beat narrative outline. STOP and wait for user confirmation.
   - **Gate 3 (Pre-Deploy Greenlight)**: Present the live preview, benchmark results, and Red Team audit report. STOP and wait for final authorization to push.

2. **The Balanced 2-Column Spine Diagram Standard (`flowchart TD`)**:
   - **BANNED**: `flowchart LR` or `graph LR` (causes horizontal SVG shrinking and illegible micro-fonts).
   - **BANNED**: 100% single-file vertical "totem poles" that waste horizontal space.
   - **MANDATORY**: Top-Down macro spine (`flowchart TD`) with a maximum of **2 balanced parallel columns** side-by-side (e.g. Partition A vs Partition B, or Memory Guard vs Storage Guard). This guarantees $\approx 350\text{px}$ node width and full 14px–16px typography without zooming.
   - Nodes must use square brackets with quotes: `NodeID["Clean Title"]`. Never put quotes inside curly braces (`Node{"..."}` is banned).
   - Clean edge labels: `-->|Cache Hit| Node` (no colons or digits in edge labels).

3. **Production Rigor & Code Invariants**:
   - Verify live LTS versions (e.g. Next.js 16.3 Active LTS, React 19). Never claim an outdated release is current.
   - All code must be strictly typed, modern TypeScript 7 / Rust / Go with real domain models and realistic error boundaries (no `foo/bar` toy code).
   - Include reproducible micro-benchmark scripts for all performance claims.

4. **Scholarly Citations & Primary Sources**:
   - Every technical claim or benchmark assertion must have numbered citations (`[1]`, `[2]`) linked to primary RFCs, W3C specs, or peer-reviewed papers.
   - Conclude with a complete `## References & Further Reading` section.

5. **Syndication Protection**:
   - All downstream cross-posts to Dev.to, Hashnode, or Medium must include canonical URL tags pointing to `https://akmalkhaniub.github.io/blog/<slug>.html`.

6. **Fleet Order**: Follow `DEEP_TECH_RESEARCH_AND_VISUAL_BLOG_FRAMEWORK_2026-09-07.md` §6. `community-feedback-and-errata-manager` and `evergreen-lifecycle-and-analytics-monitor` run **after** Gate 3, never instead of it. Mechanical gate: `npm run pipeline`.

7. **Organic Publication Cadence (No Same-Date Batch Dumping)**:
   - **BANNED**: Assigning the exact same `"date"` in `blog/posts.json` to multiple blog posts. Same-date clustering looks like an automated batch dump and dilutes RSS/syndication visibility.
   - **MANDATORY**: Every blog post must have a unique publication date spaced at least 2–3 days apart, aligned with the actual git commit timeline of the underlying engineering repository.

---

## 🌟 Mandatory Project Release & GitHub Discoverability Standard

Whenever a new engineering project or hackathon repository is added to the workspace (`g:\ReplitProjects`) or to this portfolio (`index.html`, `projects.html`, `hackathons.html`), you MUST execute all 5 steps in [`g:\ReplitProjects\GITHUB_PUBLISH_CHECKLIST.md`](file:///g:/ReplitProjects/GITHUB_PUBLISH_CHECKLIST.md):

1. **Zero Dead Links:** Verify that the target `https://github.com/akmalkhaniub/<repo>` repository exists publicly on GitHub and has its latest commits pushed (`main`).
2. **Synchronize Page Counters:** Keep total project counts (`All Projects (N)`) and hackathon counts (`N Hackathons`) synchronized across `index.html`, `projects.html`, `hackathons.html`, `publications.html`, `certifications.html`, `blog/index.html`, and `scripts/build-blog.js`.
3. **Run Automated GitHub Metadata Sync (`sync_github_metadata.py`):**
   - Run `python g:\ReplitProjects\sync_github_metadata.py` to ensure every public GitHub repository has a non-empty `description`, a `homepage` URL (pointing to its case-study blog post or `https://akmalkhaniub.github.io/projects.html`), and 6–10 searchable `repositoryTopics` (`mcp`, `langgraph`, `voice-ai`, `golang`, `rust`, `agentic-ai`, etc.).
4. **Update Profile README (`g:\ReplitProjects\akmalkhaniub\README.md`):** When adding a new flagship system, update and push the GitHub profile README so visitors landing on `github.com/akmalkhaniub` immediately see current flagship work and the latest blog count.
5. **Companion Case-Study Article:** Every new flagship project should be paired with a deep-dive architectural case study in `blog/posts/<slug>.md` with reproducible benchmarks, generated cover art (`python scripts/generate-covers.py`), and rebuilt feeds (`node scripts/build-blog.js`).
