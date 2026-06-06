In multi-agent systems, naming agents "Expert Helper" or "Smart Writer" is a recipe for system drift. When agent roles are fuzzy, their system prompts overlap. The resulting system suffers from **cognitive duplication** and **"agent soup"**—where agents pass context back and forth, consuming tokens without resolving the task.

To build reliable systems, we must treat agent roles as strict **software interfaces** with defined scopes, tool permissions, and communication contracts.

This article reviews the principles of structured role design for multi-agent applications.

---

## The Hazards of Fuzzy Roles

When agents have overlapping domains of responsibility:
1.  **Context Contamination**: If two agents both believe they are responsible for editing a file, they will overwrite each other's changes.
2.  **Infinite Communication Loops**: An agent without clear boundaries will repeatedly ask other agents for feedback, consuming thousands of tokens in an loop of clarification.
3.  **Tool List Bloat**: To cover all bases, developers give every agent access to every tool. This dilutes LLM attention, resulting in high rates of tool call hallucinations.

---

## The Specialist Kitchen Analogy

A good multi-agent system operates like a Michelin-starred restaurant kitchen. There is no generic "helper." Instead, roles are highly specialized and bounded:

```mermaid
graph TD
    User[Customer Order] --> Expeditor[Expeditor / Supervisor]
    Expeditor -->|Assign Prep| PrepCook[Prep Cook Agent]
    Expeditor -->|Assign Baking| PastryChef[Pastry Chef Agent]
    
    PrepCook -->|Output: Raw Ingredients| Expeditor
    PastryChef -->|Output: Baked Pastry| Expeditor
    
    Expeditor -->|Verification Check| QualityInspector[Quality Inspector Agent]
    QualityInspector -->|Pass/Fail| Expeditor
    Expeditor --> Plate[Served Dish]
```

*   **Prep Cook (Researcher)**: Has access to knife tools (search APIs). Only responsible for raw ingredient cleaning (data cleaning).
*   **Pastry Chef (Writer)**: Has access to baking oven tools (template rendering). Only handles pastry prep (drafting).
*   **Expeditor (Supervisor/Router)**: Coordinates tickets (queries), assigns tasks, and ensures the plate matches the order.
*   **Quality Inspector (Validator)**: Compares the dish to the recipe contract before it leaves the kitchen.

---

## Rules for Structuring Agent Roles

To prevent role drift, implement these three rules in your system prompts:

### 1. Define Strict Input/Output Schema Contracts
Never pass raw, unstructured chat history between agents. Treat agent handoffs like API endpoints. Agent A must output a specific JSON schema (e.g., an outline array), which is validated programmatically before being fed as input to Agent B.

### 2. Enforce the Single Responsibility Principle (SRP)
Every agent must have a single, non-overlapping task.
*   **Bad**: Naming an agent `LeadDeveloper` and giving it tools to search, write files, compile, and deploy.
*   **Better**: Split into `CodeWriterAgent` (writes files), `TestRunnerAgent` (compiles and executes test scripts), and `DeploymentAgent` (pushes to production).

### 3. Restrict Tool Lists to a Maximum of 3 Tools
If an agent needs more than 3 tools to execute its task, its scope is too broad. Split the agent. A narrow tool list ensures the model has 99.9% accuracy when selecting which tool to call.

---

## 📋 The Role Design Checklist

*   [ ] **Strict Prompts**: Remove generic words like "help," "assist," or "smart" from system instructions. Replace them with operational verbs: "extract," "query," "generate," "validate."
*   [ ] **Interface Validation**: Enforce Pydantic schema contracts on all messages exchanged between agent nodes.
*   [ ] **Isolation Audit**: Ensure worker agents do not have visibility into the global plan, limiting their attention strictly to their assigned sub-tasks.

---

## 📚 References & Further Reading

*   **SOPs in Multi-Agent Systems**: Hong et al., 2023. *MetaGPT: Meta Programming for Multi-Agent Collaborative Framework*. Explains how standard operating procedures (SOPs) eliminate role confusion in agent networks. [arXiv:2308.08155](https://arxiv.org/abs/2308.08155)
*   **Engineering MAS Taxonomy**: *Engineering LLM-based Multi-Agent Systems: A Taxonomy of Emerging Frameworks* (June 2026). Explains task decomposition and interface design between agents. [diva-portal.org](https://diva-portal.org/) (Needs verification)

*To explore complete code implementations of all 17 agent microservices in a single monorepo, check out the public [agentic-apps-portfolio](https://github.com/akmalkhaniub/agentic-apps-portfolio) repository.*
