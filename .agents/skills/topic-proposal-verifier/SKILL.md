---
name: topic-proposal-verifier
description: >-
  Acts as the strategic editorial gatekeeper that scores and validates proposed article topics
  before any research or drafting begins. Evaluates market saturation, technical depth feasibility,
  scope bounding, empirical proof availability, and author persona alignment. Prevents wasting
  resources on generic tutorials, unfeasible ideas, or oversaturated topics.
---

# Topic Proposal Verifier: The Strategic Editorial Gatekeeper

The greatest waste of engineering effort is writing an article that should never have been conceived in the first place: topics that are already oversaturated with 500 shallow tutorials, topics that are too broad to provide concrete value, or topics that lack publicly inspectable source code or benchmarks.

This skill acts as the **Pre-Flight Topic Gatekeeper**. No article idea is allowed into the research or drafting pipeline without passing its rigorous scoring rubric.

---

## ⚖️ The 4-Pillar Scoring Rubric (Minimum Score: 32 / 40)

Every topic proposal is evaluated against four objective criteria (1 to 10 points each):

### 1. Market Saturation & Novelty (Weight: 10 pts)
* **The Rule**: Search Google, Dev.to, Medium, and Hacker News.
* **Score 1-4 (Saturated)**: More than 20 mainstream articles cover the exact same feature in the exact same way (e.g., *"How to use Server Actions in React 19"*). **INSTANT REJECTION.**
* **Score 5-7 (Moderate)**: The topic has been covered, but lacks a deep systems/internals breakdown.
* **Score 8-10 (High Signal / Novel)**: The topic examines an unexamined architectural edge-case, an undocumented failure mode, or a brand new LTS capability (e.g., *"How Next.js 16 Partial Prefetching avoids Client VDOM Allocations"*).

### 2. Technical Depth & Scope Bounding (Weight: 10 pts)
* **The Rule**: Reject topics that try to "boil the ocean" (*"Everything you need to know about Distributed Systems"*).
* **Score 1-4**: Too broad to finish or too trivial to warrant a 2,500-word deep dive.
* **Score 8-10**: Precisely bounded around a specific mechanical trade-off (e.g., V8 microtask queue overhead vs synchronous context propagation in `AsyncLocalStorage`).

### 3. Empirical Feasibility & Proof Availability (Weight: 10 pts)
* **The Rule**: Are there concrete, publicly inspectable artifacts?
* **Requirements**: Must have verifiable RFCs, open-source Git commits, accessible AST structures, or runnable benchmark tools. If the technology is closed-source or un-benchmarkable, it is **REJECTED**.

### 4. Author Persona Alignment (Weight: 10 pts)
* **The Rule**: Does this topic reinforce Akmal Khan's positioning as a **Senior Staff Systems Architect** specializing in full-stack AI platforms, agentic swarms, high-throughput distributed databases, and high-performance frontend runtimes?

---

## 🚦 Gatekeeper Output Contract

Every proposed topic must produce a **Topic Viability Dossier**:
1. **Title Proposal**: 3 dialectical, non-clickbait title options.
2. **Total Score**: Numerical breakdown (out of 40).
3. **The Core Tension**: Explicit formulation of Thesis vs Antithesis.
4. **Targeted Artifacts**: Direct links to the RFC, GitHub PR, or paper that will serve as the technical backbone.
5. **Verdict**: **APPROVED FOR RESEARCH** or **REJECTED (WITH REASONS)**.
