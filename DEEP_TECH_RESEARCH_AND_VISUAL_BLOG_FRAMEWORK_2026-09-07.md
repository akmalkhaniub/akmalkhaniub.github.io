# The 3-Tier Autonomous Engineering Publication Fleet & Visual Framework
**Comprehensive Operations Manual, Vertical Diagram Standards & Canonical Specification**  
**Effective Date:** September 7, 2026  
**Author:** Akmal Khan Engineering Publication  
**Status:** Canonical Operational Specification

---

## 1. Executive Summary: The 3-Tier Publication Model

To ensure strategic human oversight, flawless technical quality, and maximum global reach without SEO duplicate content penalties, our publication operates under a **3-Tier Architecture**:

```mermaid
flowchart TD
  subgraph Tier1 ["Tier 1: Canonical Core Production (Personal Domain)"]
    T1_1["Autonomous 9-Skill Fleet"]
    T1_2["3 Human-in-the-Loop Editorial Gates"]
    T1_3["Deploy to Canonical Home: akmalkhaniub.github.io"]
    T1_1 --> T1_2 --> T1_3
  end

  subgraph Tier2 ["Tier 2: Multi-Platform Syndication & Social Amplification"]
    T2_1["Direct Networks: Dev.to, Hashnode, Medium (rel='canonical')"]
    T2_2["Newsletters: Substack Briefing & LinkedIn Articles"]
    T2_3["Community Hubs: Hacker News, Lobsters, Reddit (r/webdev)"]
    T2_4["Visual Carousels: LinkedIn & X Image Slidedecks"]
    T1_3 --> T2_1 & T2_2 & T2_3 & T2_4
  end

  subgraph Tier3 ["Tier 3: Observability, Reader Feedback & Evergreen Maintenance"]
    T3_1["Giscus / GitHub Discussions & HN Comment Triage"]
    T3_2["Catalog API Deprecation & EOL Auditing (e.g. Next.js 14 -> 16)"]
    T3_3["In-Article Errata & Update Callout Maintenance"]
    T2_1 & T2_2 & T2_3 & T2_4 --> T3_1 --> T3_3
    T1_3 --> T3_2 --> T3_3
  end
```

---

## 2. The Strict Vertical-First Diagram Rule (`flowchart TD`)

> [!IMPORTANT]
> **Why We Banned Horizontal (`LR`) Diagrams**:
> When a diagram flows horizontally (`flowchart LR`), browser containers compress the entire width to fit the screen. This reduces font sizes to unreadable micro-text, frustrating readers and forcing them to zoom in.
>
> **The Vertical-First Mandate**:
> All architectural diagrams, request flows, and compilation pipelines MUST use **`flowchart TD` (Top-Down)**.
> - **Zero Zooming Required**: Boxes retain their natural readable font size (14px-16px).
> - **Mobile & Desktop Native**: Diagrams expand naturally along the natural vertical scroll direction of the article.
> - **Numbered Step Clarity**: Steps `1.`, `2.`, `3.` cascade down the screen like a clear, logical story.

---

## 3. The 3 Human-in-the-Loop (HITL) Checkpoints

The agent fleet acts as the Staff Research & Drafting Bureau, while **Akmal Khan serves as the Editor-in-Chief**. The fleet pauses for explicit user direction at three non-negotiable gates:

```mermaid
flowchart TD
  subgraph Gate1_Section ["Gate 1: Topic Inception Approval"]
    G1_A["topic-proposal-verifier evaluates scores"] --> G1_B["Present 3 Scored Topic Dossiers"]
    G1_B --> G1_C["Human Decision: Select Topic or Pivot Angle"]
  end

  subgraph Gate2_Section ["Gate 2: Vertical Visual & Outline Approval"]
    G1_C -->|Approved| G2_A["deep-tech-researcher builds Vertical Layouts"]
    G2_A --> G2_B["Present Vertical Diagrams & 5-Beat Outline"]
    G2_B --> G2_C["Human Decision: Approve Flow and Mental Models"]
  end

  subgraph Gate3_Section ["Gate 3: Pre-Deploy Release Greenlight"]
    G2_C -->|Approved| G3_A["Drafting, Benchmarks & Red Team Audit"]
    G3_A --> G3_B["Present Live Preview & Audit Report"]
    G3_B --> G3_C["Human Decision: Final Authorization to Deploy"]
  end

  G3_C -->|Approved| G3_D["Git Commit & Push to GitHub Pages"]
```

---

## 4. Complete Skills Directory & Roles

The `.agents/skills/` directory resides directly inside the repository and is tracked in Git:

```
akmalkhaniub.github.io/
├── .agents/
│   └── skills/
│       ├── topic-proposal-verifier/          # 1. Evaluates topic novelty, scope & feasibility
│       ├── human-editorial-gatekeeper/       # 2. Coordinates the 3 Human-in-the-Loop checkpoints
│       ├── deep-tech-researcher/            # 3. Mines real-time releases, RFCs & blueprints
│       ├── narrative-tech-storyteller/      # 4. Crafts literary prose, cold opens & pacing
│       ├── code-and-benchmark-verifier/     # 5. Production TypeScript/Rust code & benchmarks
│       ├── visual-and-cover-art-creator/    # 6. 16:9 covers & VERTICAL Mermaid v10 diagrams
│       ├── staff-architect-red-team/        # 7. Adversarial fact-checking & citations
│       ├── seo-and-publication-qa-auditor/  # 8. Audits TOC anchors, JSON-LD & static build
│       ├── distribution-and-social-packager/# 9. ByteByteGo visual carousels & HN hooks
│       ├── multi-platform-syndication-manager/# 10. Downstream distribution with canonical tags
│       ├── evergreen-lifecycle-and-analytics-monitor/ # 11. Deprecation audits & errata maintenance
│       └── community-feedback-and-errata-manager/     # 12. Giscus / HN triage & living errata
├── blog/
├── scripts/
├── PUBLICATION_TARGETS.json                 # Downstream syndication platform configuration
└── DEEP_TECH_RESEARCH_AND_VISUAL_BLOG_FRAMEWORK_2026-09-07.md
```

---

## 5. Non-Negotiable Publication Invariants

1. **The Vertical Diagram Invariant**: All diagrams must flow vertically (`flowchart TD`) to eliminate horizontal squishing and guarantee zero-zoom readability.
2. **The 3-Gate HITL Invariant**: The fleet must obtain explicit human authorization at Topic Selection, Blueprint Approval, and Pre-Deploy Release.
3. **The Canonical SEO Invariant**: All downstream syndication to Dev.to, Hashnode, and Medium must include `canonical_url: https://akmalkhaniub.github.io/blog/<slug>.html`.
4. **The Stack Freshness Invariant**: Always verify live LTS package versions. Never refer to an older release as current.
5. **The Mermaid Parser Safety Invariant**: Square brackets with quotes for nodes (`NodeID["Clean Title"]`), clean edge text (`-->|Cache Hit| Node`), clean subgraphs.
6. **The Red Team Clearance Invariant**: No article may be deployed without explicit clearance from `staff-architect-red-team`.

---

## 6. Canonical Fleet Execution Order

Skills are not optional flavor text. For a **new** essay they run in this order, stopping at each HITL gate:

1. `topic-proposal-verifier` — three scored dossiers. **Gate 1 STOP.**
2. `human-editorial-gatekeeper` — hold until the editor picks a topic.
3. `deep-tech-researcher` — live LTS versions, primary RFCs, `flowchart TD` blueprints (max two columns). **Gate 2 STOP.**
4. `visual-and-cover-art-creator` — 16:9 cover at `blog/assets/covers/<slug>.jpg` plus hardened Mermaid.
5. `narrative-tech-storyteller` — 5-beat draft with numbered citations.
6. `code-and-benchmark-verifier` — typed snippets and runnable benches.
7. `staff-architect-red-team` — ACCEPTED / REVISE / REJECT.
8. `seo-and-publication-qa-auditor` — TOC, JSON-LD `image`, sitemap/RSS, `npm run pipeline <slug>`. **Gate 3 STOP.**
9. `distribution-and-social-packager` then `multi-platform-syndication-manager` — canonical URL on every cross-post. Write packages under `blog/posts/<slug>.syndication.md` (do not invent a missing `blog/articles/` tree).

Post-publish (not a substitute for Gates 1–3):

10. `community-feedback-and-errata-manager` — Giscus / HN triage, dated errata callouts.
11. `evergreen-lifecycle-and-analytics-monitor` — EOL banners, duplicate-slug audits, Next.js 16.3 vs 15 Maintenance vs 14 EOL.

`scripts/publish-pipeline.js` is the mechanical gate: it fails the build on `flowchart LR` / `graph LR`, `graph TD`, quoted rhombus nodes, and duplicate `posts.json` slugs. Missing `## References & Further Reading` is a warning, not a silent pass.

**Do not** copy example diagrams from older skill drafts that use `graph TD` or `-->|1. Step|`. Those contradict the Visual Invariant.
