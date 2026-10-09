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
