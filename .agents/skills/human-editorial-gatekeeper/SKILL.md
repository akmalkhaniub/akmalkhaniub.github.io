---
name: human-editorial-gatekeeper
description: >-
  Manages the Human-in-the-Loop (HITL) editorial protocol. Halts autonomous execution at three
  critical checkpoints (Topic Inception, Visual/Outline Blueprinting, and Pre-Deploy Release)
  to obtain explicit human direction, angle adjustments, and final greenlight authorization.
---

# Human Editorial Gatekeeper: The Human-in-the-Loop Director

An autonomous agent fleet must never function as an unchecked rogue publisher. The blog is the personal reputation, voice, and architectural authority of **Akmal Khan**. 

This skill enforces a non-negotiable **3-Gate Human-in-the-Loop Protocol** ensuring the human Editor-in-Chief retains complete strategic control over what gets researched, what gets drawn, and what goes live.

---

## 🛑 The 3 Mandatory Human Checkpoints

```mermaid
flowchart TD
  subgraph Checkpoint1 ["Gate 1: Topic & Strategic Angle Approval"]
    A["topic-proposal-verifier generates 3 Dossiers"] --> B["Present Options to User with Scores"]
    B --> C["Human Decision: Select Topic or Pivot Angle"]
  end

  subgraph Checkpoint2 ["Gate 2: Visual Architecture & Narrative Outline"]
    C -->|Approved| D["deep-tech-researcher builds Vertical Flowcharts"]
    D --> E["Present Vertical Diagrams & 5-Beat Outline"]
    E --> F["Human Decision: Approve Mental Model and Flow"]
  end

  subgraph Checkpoint3 ["Gate 3: Pre-Deploy Release Greenlight"]
    F -->|Approved| G["Drafting, Benchmarks & Red Team Review"]
    G --> H["Present Live Preview, Benchmark Harness & Audit Report"]
    H --> I["Human Decision: Final Authorization to Deploy"]
  end

  I -->|Approved| J["Execute Build & Push to GitHub Pages"]
```

---

## 📋 The Gatekeeper Dossier Formats

### Gate 1 Format (Topic Selection):
* Present 3 candidate dossiers with:
  1. Title variants (dialectical, non-clickbait).
  2. Scoring breakdown (Novelty, Scope, Feasibility, Authority).
  3. Core architectural tension (Thesis vs Antithesis).
  4. Primary RFC/Source reference links.
* **Halt and wait for user's explicit selection.**

### Gate 2 Format (Visual & Outline Approval):
* Present the proposed **Vertical-First diagrams** (Figure 1 and Figure 2 in readable top-down format).
* Present the 5-beat narrative arc and proposed code benchmarks.
* **Halt and wait for user confirmation or diagram adjustments.**

### Gate 3 Format (Pre-Deploy Greenlight):
* Present the completed article title, cover image, benchmark numbers, and Staff Red Team clearance verdict.
* **Halt and wait for final authorization to push to main.**
