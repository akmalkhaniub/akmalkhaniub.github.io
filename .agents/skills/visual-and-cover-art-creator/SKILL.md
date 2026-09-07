---
name: visual-and-cover-art-creator
description: >-
  Designs high-aesthetic visual assets, 16:9 custom article covers, and bulletproof Mermaid v10
  diagrams. Hardens diagram syntax to eliminate tokenizer/lexer errors, guarantees optimal dark/light
  mode contrast, and creates cohesive architectural blueprints inspired by ByteByteGo.
---

# Visual & Cover Art Creator: The Graphic & Diagram Engine

In modern engineering communication, diagrams are not afterthoughts—they are the primary cognitive anchors. A broken diagram syntax error destroys professional credibility, and a generic stock photo makes an article look amateurish.

This skill governs the **visual aesthetics, cover art generation, and diagram syntax integrity** across the publication.

---

## 🎨 16:9 Cover Art Standards

Every article must feature a custom 16:9 cover image saved to `blog/assets/covers/<slug>.jpg`:
* **Aesthetic**: Minimalist, dark-slate background (`#0a0f1d`), neon cyan/emerald/purple accents, isometric systems engineering blueprints, circuit traces, clean geometric nodes.
* **Banned Elements**: Zero photorealistic human faces, zero random floating robots, zero generic corporate stock handshakes, zero garbled text overlays.
* **Aspect Ratio**: Strictly 16:9 (1920x1080 or 1200x675).

---

## 🛡️ Mermaid v10 Parser Hardening Rules

To prevent tokenizer crashes in Mermaid v10:

1. **Strict Node Identifiers**:
   * Always write: `NodeID["Descriptive Title"]`
   * **BANNED**: `NodeID{"..."}` (quotes inside curly braces cause immediate lexer syntax errors).
   * **BANNED**: Node IDs starting with a digit (write `ZeroVDOM` instead of `0VDOM`).

2. **Edge Label Sanitization**:
   * Keep edge predicates clean: `-->|Cache Hit| Node`
   * **BANNED**: Colons or numbers in edge strings (e.g., `-->|Cache Hit: 0 Allocations|` will break the parser).

3. **Subgraph Syntax**:
   * Format: `subgraph SG1_Name ["Descriptive Name (Details)"]`
   * **BANNED**: Colons inside the title string (`["Name: Details"]` can trigger lexer failures in certain modes).

4. **Numbered ByteByteGo Flows**:
   * All request flows must be clearly numbered: `-->|1. Link Click| `, `-->|2. Edge Shell Lookup| `, `-->|3. Stream Dynamic Holes| `.
