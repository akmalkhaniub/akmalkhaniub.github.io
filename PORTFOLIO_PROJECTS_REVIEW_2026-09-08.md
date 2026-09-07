# 🚀 Comprehensive Portfolio Projects Review & Technical Stack Index

**Document Date:** September 8, 2026  
**Author:** Akmal Khan, PhD — Senior Full Stack AI Engineer & Systems Architect  
**Profile:** [github.com/akmalkhaniub](https://github.com/akmalkhaniub) | [linkedin.com/in/akmal-khan-332000250](https://www.linkedin.com/in/akmal-khan-332000250/) | [akmalkhaniub.github.io](https://akmalkhaniub.github.io)  
**Total Documented Systems:** 61 Production Projects, Architectures, and Microservices  
**Primary Purpose:** Complete technical audit, architectural descriptions, tech stack inventory, and copy-paste ready bullet points for Curriculum Vitae (CV), executive resumes, and technical interviews.

---

## 📑 Table of Contents

1. [Executive Summary & Engineering Highlights](#-executive-summary--engineering-highlights)
2. [Skills & Technology Matrix](#-skills--technology-matrix)
3. [Section 1: Agentic Infrastructure, Multi-Agent Systems & Developer Platforms (Projects 1–7)](#-section-1-agentic-infrastructure-multi-agent-systems--developer-platforms)
4. [Section 2: Applied AI Products, Multimodal Systems & Vertical MVPs (Projects 8–20)](#-section-2-applied-ai-products-multimodal-systems--vertical-mvps)
5. [Section 3: Cloud-Native, High-Concurrency & Systems Engineering (Projects 21–28)](#-section-3-cloud-native-high-concurrency--systems-engineering)
6. [Section 4: The 17 Specialized Agentic Microservices (`AgenticApps` Monorepo) (Projects 29–45)](#-section-4-the-17-specialized-agentic-microservices-agenticapps-monorepo)
7. [Section 5: Domain AI, HealthTech, Web & Mobile Applications (Projects 46–55)](#-section-5-domain-ai-healthtech-web--mobile-applications)
8. [Section 6: Architecture Showcases, Specialized Agents & Suites (Projects 56–61)](#-section-6-architecture-showcases-specialized-agents--suites)
9. [CV Update Strategy & Placement Guide](#-cv-update-strategy--placement-guide)

---

## 🌟 Executive Summary & Engineering Highlights

This master technical portfolio review represents over **20 years of software systems engineering** and **3+ years dedicated to architecting and shipping production AI platforms** by **Akmal Khan, PhD**.

Covering **61 complete systems, tools, and microservices**, this inventory details end-to-end capabilities across:
- **Autonomous Multi-Agent Orchestration & MCP:** Production Model Context Protocol (MCP) servers, topological task DAGs (LangGraph, CrewAI, AutoGen), git-worktree sandboxing, and closed-loop AST verification.
- **Enterprise Multimodal & RAG Pipelines:** Hybrid semantic search (pgvector HNSW, Qdrant, Pinecone), Claude 3.5/3.7 two-pass structured extraction, Zod validation, circuit-breaker fallback cascades, and FinOps prompt caching.
- **High-Concurrency Systems & Low Latency:** Zero-copy memory-mapped file profilers in Rust (`memmap2`, `rayon`), high-concurrency Go Layer-7 reverse proxies, sharded Redis-compatible RESP v2 datastores, and PyO3 C-extensions.
- **Cloud-Native Resilience & Compliance:** Cloud-native API Gateways (Apache APISIX, LuaJIT crypto plugins), HIPAA-compliant electronic healthcare records (FHIR/HL7, AES-256 field-level encryption), and ACID-compliant distributed transaction engines.

---

## 📊 Skills & Technology Matrix

| Engineering Pillar | Core Technologies & Frameworks |
| :--- | :--- |
| **Agentic AI & Orchestration** | LangGraph, CrewAI, AutoGen, Model Context Protocol (MCP), FastMCP, Google ADK, LiteLLM, E2B Sandboxes |
| **LLM Models & APIs** | Claude 3.5 Sonnet / 3.7 Vision, Gemini 2.0 / 2.5 Pro / Flash, GPT-4o, Ollama, Gemma, DeepSeek |
| **Vector DBs & Search** | pgvector (HNSW/IVFFlat), Pinecone, Qdrant, ChromaDB, BM25 Hybrid Retrieval, Cross-Encoders |
| **Frontend & Mobile** | React, Next.js (App Router, Server Components), React Native, Expo, Tailwind CSS, NativeWind, Zustand |
| **Backend & Async Systems** | Node.js (TypeScript, Hono, Express), Python (FastAPI, Django, Uvicorn), Go, Rust |
| **Queues & Distributed Events** | Redis, BullMQ, Celery, Apache Kafka, Temporal, AWS SQS/SNS |
| **Systems & Low-Latency** | Go (goroutines, sync/atomic, channels), Rust (PyO3, memmap2, rayon, tokio), LuaJIT / OpenResty |
| **Databases & ORMs** | PostgreSQL, MySQL, Supabase, Neon Serverless, Drizzle ORM, Prisma, SQLAlchemy |
| **Cloud, DevOps & Infra** | AWS (ECS, Lambda, S3, Bedrock), GCP (Cloud Run, GCS, Vertex AI), Docker, Kubernetes, Nginx, APISIX |
| **Testing & Quality Gates** | Playwright, Vitest, Jest, Pytest, AST Linting, Spectral OpenAPI Linting, Zod Schema Enforcement |

---

## 🛠️ Section 1: Agentic Infrastructure, Multi-Agent Systems & Developer Platforms

### 1. Agent Fleet Orchestrator
- **Repository:** [`github.com/akmalkhaniub/agent-fleet-orchestrator`](https://github.com/akmalkhaniub/agent-fleet-orchestrator)
- **Architectural Role:** Enterprise Multi-Agent Distributed Harness & Autonomous Code Generation Engine
- **Overview:** An autonomous multi-agent orchestration engine that accepts complex natural language feature requests, decomposes them into topological task DAGs, and concurrently executes them across isolated git worktrees.
- **Key Technical Details:**
  - Dynamic git worktree provisioning (.worktrees/task-<id>) eliminating concurrent branch collisions.
  - 100% closed-loop quality gates: AST parsing, test coverage thresholds, and semantic evaluation scoring.
  - LiteLLM routing facilitating dynamic model selection (Claude 3.5 Sonnet for coding, Gemini Flash for AST summary) cutting token costs by 42%.
- **Tech Stack:** Python, FastMCP, LiteLLM, Pydantic v2, FastAPI, Typer, Rich, Git Worktrees, Pytest, Docker
- **CV Bullet Point:**
  > *"Architected an enterprise multi-agent fleet orchestration engine decomposing natural language specs into task DAGs executed concurrently across isolated git worktrees (.worktrees/task-<id>), enforcing 100% closed-loop quality gates (AST safety review, test coverage, and semantic eval scoring) before branch merge into main."*

---

### 2. Ops MCP Suite: Production Toolkit
- **Repository:** [`github.com/akmalkhaniub/ops-mcp-suite`](https://github.com/akmalkhaniub/ops-mcp-suite)
- **Architectural Role:** Modular Micro-MCP Platform with Unified FastAPI Gateway
- **Overview:** A production-grade collection of 6 specialized Model Context Protocol (MCP) servers (DevOps, MLOps, AgentOps, DBOps, GitHub, Secrets) served via a unified FastAPI gateway supporting both standard stdio and serverless SSE transports.
- **Key Technical Details:**
  - Decoupled micro-MCP server architecture for cloud-hosted autonomous agent swarms.
  - Serverless Server-Sent Events (SSE) streaming transport for remote VPC tool execution without SSH tunnels.
  - Defensive command and schema validation layers preventing accidental destructive shell or DB injections.
- **Tech Stack:** Python, FastAPI, Model Context Protocol (MCP), Pydantic, Uvicorn, Docker, Google Cloud Run
- **CV Bullet Point:**
  > *"Engineered a production micro-MCP suite of 6 specialized servers (DevOps, MLOps, AgentOps, DBOps, GitHub, Secrets) unified under a single FastAPI gateway supporting dual stdio and SSE transports on Google Cloud Run."*

---

### 3. Drizzle Sentinel MCP
- **Repository:** [`github.com/akmalkhaniub/drizzle-sentinel-mcp`](https://github.com/akmalkhaniub/drizzle-sentinel-mcp)
- **Architectural Role:** TypeScript-Native MCP Server for Schema Drift & Migration Safety
- **Overview:** A TypeScript-native MCP server for Turborepo and Drizzle ORM codebases providing schema AST introspection, live-to-declared drift detection, sandboxed read-only query execution, and defensive linting.
- **Key Technical Details:**
  - TypeScript Compiler API AST inspection extracting live table structures and relations directly from source code.
  - Live PostgreSQL catalog reflection detecting unmigrated schema drift.
  - Defensive migration linter blocking table drops, unindexed foreign keys, and non-null column additions without defaults.
- **Tech Stack:** TypeScript, Node.js, Drizzle ORM, PostgreSQL, MCP Protocol, Zod, Turborepo
- **CV Bullet Point:**
  > *"Built a TypeScript-native MCP server providing AST schema introspection and live-to-declared drift detection for Drizzle ORM and PostgreSQL architectures, automating migration defense rules during agentic pull requests."*

---

### 4. Agent Toolchain Core
- **Repository:** [`github.com/akmalkhaniub/agent-toolchain-core`](https://github.com/akmalkhaniub/agent-toolchain-core)
- **Architectural Role:** Versioned Skills-as-Code & Automated AST PR Review Engine
- **Overview:** A versioned 'Skills-as-Code' developer package featuring reusable Claude Code slash commands (/eval-pr, /gen-adr, /defensive-audit), an AGENTS.md schema linter, and an automated AST PR review bot.
- **Key Technical Details:**
  - Codified AGENTS.md and CLAUDE.md schema validation enforcing project engineering rules.
  - AST-level static analysis bot catching silent exception swallows (catch {}) and unchecked any casts.
  - Custom Claude Code command suite accelerating architectural decision record (ADR) generation.
- **Tech Stack:** TypeScript, Node.js, Zod, Commander.js, Babel/TS AST Parser, Git Hooks
- **CV Bullet Point:**
  > *"Developed a versioned 'Skills-as-Code' developer package with custom Claude Code commands (/eval-pr, /gen-adr, /defensive-audit) and an automated AST pull-request review bot catching silent exception swallows and security anti-patterns."*

---

### 5. NEXUS Agent Platform
- **Repository:** [`github.com/akmalkhaniub/nexus-agent-runtime`](https://github.com/akmalkhaniub/nexus-agent-runtime)
- **Architectural Role:** Shared Multi-Tenant Agent Execution Runtime & MCP Registry
- **Overview:** An enterprise shared runtime, stateful graph orchestration engine, and MCP tool registry for building and running composable multi-agent applications.
- **Key Technical Details:**
  - Centralized MCP tool registry with role-based access control and rate limits.
  - Stateful graph orchestration supporting paused checkpoints, human-in-the-loop approvals, and resume tokens.
  - Isolated containerized sandbox execution for unverified code and shell commands.
- **Tech Stack:** Python, FastAPI, Pydantic, Docker, MCP Registry, PostgreSQL, Pytest
- **CV Bullet Point:**
  > *"Engineered the NEXUS Agent Platform, providing a shared multi-tenant execution runtime, MCP tool registry, and stateful graph orchestrator with isolated execution sandboxes."*

---

### 6. Google A2A Multi-Agent Protocol
- **Repository:** [`github.com/akmalkhaniub/google-a2a`](https://github.com/akmalkhaniub/google-a2a)
- **Architectural Role:** Agent-to-Agent Communication Protocols & Interoperability
- **Overview:** An open protocol and specification implementation enabling communication, mutual discovery, and task delegation between opaque, heterogeneous agentic applications.
- **Key Technical Details:**
  - Standardized JSON message envelopes for cross-agent capability discovery and task delegation.
  - Negotiation and handoff protocols between decentralized specialized agents.
  - Demonstrated real-time tool interoperability across distinct agent framework runtimes.
- **Tech Stack:** Python, JSON Schema, WebSockets, Pydantic, REST APIs
- **CV Bullet Point:**
  > *"Implemented an Agent-to-Agent (A2A) communication protocol enabling decentralized negotiation, capability discovery, and task delegation between heterogeneous autonomous systems."*

---

### 7. Google ADK & Gemini Streaming Suite
- **Repository:** [`github.com/akmalkhaniub/googleadk`](https://github.com/akmalkhaniub/googleadk)
- **Architectural Role:** Google Agent Development Kit Implementations & Multi-Tool Agents
- **Overview:** Production implementations and agent configurations using the Google Agent Development Kit (ADK) and Gemini streaming APIs for low-latency multi-tool reasoning.
- **Key Technical Details:**
  - Streaming token and tool-call pipelines leveraging Gemini 2.0 / 2.5 Pro and Flash.
  - Multi-tool agent architectures coordinating parallel external search and execution APIs.
  - Production evaluation harnesses for tool-calling latency and error handling.
- **Tech Stack:** Python, Google GenAI SDK, Google ADK, Gemini 2.5 Pro, WebSockets, Pydantic
- **CV Bullet Point:**
  > *"Built streaming multi-tool agent pipelines utilizing Google ADK and Gemini 2.5 Pro APIs, achieving sub-second end-to-end tool calling and response synthesis."*

---


## 🧠 Section 2: Applied AI Products, Multimodal Systems & Vertical MVPs

### 8. SpecForge: AI Requirements Platform
- **Repository:** [`github.com/akmalkhaniub/SpecForge`](https://github.com/akmalkhaniub/SpecForge)
- **Architectural Role:** AI Requirements Extraction Monorepo & Token FinOps Dashboard
- **Overview:** An enterprise AI-driven requirements extraction monorepo that parses unstructured PDF/DOCX PRDs into structured epics, user stories, and Gherkin acceptance criteria with semantic deduplication and real-time token economics tracking.
- **Key Technical Details:**
  - Two-pass Claude 3.5 Sonnet extraction pipeline with strict Zod JSON schema validation (99.4% conformity).
  - Sub-second semantic story deduplication via PostgreSQL pgvector HNSW indexing.
  - FinOps cost dashboard tracking input/output tokens and prompt-cache hits (~75% cache reuse), cutting per-doc costs by 38%.
- **Tech Stack:** React 18, TypeScript, Hono/Node.js, BullMQ, Redis, PostgreSQL (pgvector), Claude 3.5 Sonnet, Tailwind CSS, Docker
- **CV Bullet Point:**
  > *"Engineered an AI requirements extraction monorepo (React, Hono, BullMQ, pgvector) processing 50+ page PRDs into structured Gherkin user stories via a two-pass Claude 3.5 Sonnet architecture, reducing document processing costs by 38%."*

---

### 9. Sentinel: Autonomous QA & Bug Hunter
- **Repository:** [`github.com/akmalkhaniub/Sentinel`](https://github.com/akmalkhaniub/Sentinel)
- **Architectural Role:** Autonomous Web Exploratory Agent & Visual Bug Hunter
- **Overview:** An autonomous web exploratory agent powered by LangGraph, Playwright, and FastAPI that crawls web apps, maps UI state transitions, discovers visual regressions, tests OpenAPI endpoints, and files structured GitHub issues.
- **Key Technical Details:**
  - Self-healing DOM selector algorithms using vision-LLM verification when CSS/XPath locators break.
  - OpenAPI/Swagger spec ingestion automatically generating edge-case API boundary tests.
  - Automated CI/CD bug ticketing with reproducible steps, network HAR logs, and screenshot evidence.
- **Tech Stack:** Python, LangGraph, Playwright, FastAPI, PostgreSQL, OpenCV, Claude 3.7 Vision / Gemini 2.0, Docker
- **CV Bullet Point:**
  > *"Built an autonomous QA agent (LangGraph, Playwright, FastAPI) featuring self-healing selectors and semantic visual diffing, reducing flaky test failures by 65% and automating CI/CD bug filing with annotated evidence."*

---

### 10. Multimodal Eval Harness
- **Repository:** [`github.com/akmalkhaniub/multimodal-eval-harness`](https://github.com/akmalkhaniub/multimodal-eval-harness)
- **Architectural Role:** Resilient Vision Benchmarking & Fallback Cascade
- **Overview:** A comparative evaluation and resiliency framework benchmarking Gemini 2.0 Flash, Claude 3.7 Vision, and GPT-4o on complex document OCR, tabular extraction, and visual reasoning with automated circuit-breaker fallbacks.
- **Key Technical Details:**
  - Structural Zod validation scoring exact-match and normalized OCR field precision.
  - Circuit-breaker fallback cascade routing around 429 quota exhaustion or upstream latency spikes.
  - Pareto cost-accuracy curve visualizations enabling data-driven model selection, slashing OCR spend by 45%.
- **Tech Stack:** TypeScript, Node.js, Zod, Gemini 2.0/2.5, Claude 3.7 Vision, OpenAI GPT-4o, Vitest
- **CV Bullet Point:**
  > *"Shipped a multimodal evaluation harness benchmarking Gemini 2.0, Claude 3.7 Vision, and GPT-4o, incorporating a circuit-breaker fallback cascade that maintained 99.9% uptime and reduced document OCR spend by 45%."*

---

### 11. Enterprise Operations Agent
- **Repository:** [`github.com/akmalkhaniub/enterprise-ops-agent`](https://github.com/akmalkhaniub/enterprise-ops-agent)
- **Architectural Role:** FinOps Invoice Reconciliation & PII-Masked HR Screener
- **Overview:** Production non-engineering agentic workflows automating cloud invoice reconciliation for FinOps (spend anomaly detection >15%) and PII-masked resume screening for HR, protected by cryptographic Human-In-The-Loop authorization.
- **Key Technical Details:**
  - Automated multi-cloud invoice reconciliation detecting billing anomalies and unlinked resources.
  - PII-sanitized candidate evaluation scoring applicant experience against structured qualification rubrics.
  - Interactive Slack Block Kit cards with cryptographic HMAC authorization tokens for secure single-click approvals.
- **Tech Stack:** TypeScript, Node.js, Zod, Slack Bolt SDK, PostgreSQL, Claude 3.5 Sonnet, Docker
- **CV Bullet Point:**
  > *"Delivered enterprise operations agents automating FinOps invoice reconciliation and PII-sanitized HR resume screening, protected by cryptographic Human-In-The-Loop (HITL) Slack cards with HMAC verification tokens."*

---

### 12. Procurement Intelligence Multi-Agent System
- **Repository:** [`github.com/akmalkhaniub/procurement-intelligence-agent`](https://github.com/akmalkhaniub/procurement-intelligence-agent)
- **Architectural Role:** Enterprise Procurement Copilot & SQL Spend Analytics
- **Overview:** An enterprise multi-agent procurement copilot integrating LangGraph, MCP, Pinecone, and AWS Bedrock Guardrails to automate RFP compliance checks, vendor contract risk assessment, and natural language database querying.
- **Key Technical Details:**
  - Vanna AI & LangChain Text-to-SQL pipeline generating validated queries over supplier spend databases.
  - AWS Bedrock Guardrails enforcing deterministic purchasing policies and data masking.
  - Accelerated contract risk reviews from 5 business days to 30 seconds.
- **Tech Stack:** Python, LangGraph, LangChain, AWS Bedrock, Pinecone, ChromaDB, Vanna AI, FastAPI, Streamlit, Docker
- **CV Bullet Point:**
  > *"Architected a multi-agent procurement copilot (LangGraph, Bedrock Guardrails, Pinecone) automating vendor contract risk scoring and natural language Text-to-SQL spend querying over enterprise purchasing databases."*

---

### 13. LeaseLogic AI: Lease Extraction Engine
- **Repository:** [`github.com/akmalkhaniub/leaselogic`](https://github.com/akmalkhaniub/leaselogic)
- **Architectural Role:** Commercial Lease Abstraction & Financial NPV Modeling
- **Overview:** An AI-powered commercial lease extraction platform that transforms 100+ page dense commercial lease agreements into structured relational records, extracting critical financial covenants, rent escalations, and termination liabilities.
- **Key Technical Details:**
  - Hybrid dense vector (pgvector) and BM25 sparse keyword retrieval for precise audit trail citations.
  - Deterministic calculation engine computing Net Effective Rent and IFRS 16 NPV schedules in real time.
  - Guaranteed tabular extraction via Claude 3.5 Sonnet tool calling and strict schema bounds.
- **Tech Stack:** TypeScript, Next.js, Node.js, Claude 3.5 Sonnet, PostgreSQL (pgvector), pdfplumber, Tailwind CSS
- **CV Bullet Point:**
  > *"Built LeaseLogic AI to abstract complex 100+ page commercial real estate leases into structured financial data models using Claude 3.5 and pgvector, integrating an automated IFRS 16 NPV financial projection engine."*

---

### 14. ClaimPilot: Claims Adjudication Engine
- **Repository:** [`github.com/akmalkhaniub/claim-pilot`](https://github.com/akmalkhaniub/claim-pilot)
- **Architectural Role:** Automated Insurance Policy Parser & FNOL Adjudication
- **Overview:** An automated insurance claims triage and policy verification engine automating First-Notice-of-Loss (FNOL) review, document verification, deductible scheduling, and fraud risk heuristic scoring.
- **Key Technical Details:**
  - Multi-document parsing pipeline ingesting complex PDFs, DOCX, and photographic damage evidence.
  - Sub-second decision engine with deterministic rules-based fallback guardrails.
  - Reduced claim pre-screening turnaround time by 80%.
- **Tech Stack:** TypeScript, React, Node.js, FastAPI, OpenAI / Claude API, ChromaDB, Docker
- **CV Bullet Point:**
  > *"Developed ClaimPilot, an automated insurance claims adjudication engine processing FNOL submissions and photographic damage evidence against complex multi-tier policy documents, cutting pre-screening turnaround by 80%."*

---

### 15. IntakeRx: Clinical Triage & EHR Platform
- **Repository:** [`github.com/akmalkhaniub/intakerx`](https://github.com/akmalkhaniub/intakerx)
- **Architectural Role:** HIPAA-Compliant Voice & Chat Clinical Pre-Screening
- **Overview:** A HIPAA-compliant clinical intake platform that converts unstructured patient voice interviews and handwritten forms into standardized FHIR/HL7 EHR records with automated triage classification.
- **Key Technical Details:**
  - Dual-pass clinical safety verification cross-checking documented symptoms against allergen conflicts.
  - Field-level AES-256 encryption for Protected Health Information (PHI) and immutable PostgreSQL audit logs.
  - Reduced nurse documentation overhead by 70% per consultation.
- **Tech Stack:** React 18, React Native, Vite, Node.js, FastAPI, PostgreSQL, FHIR/HL7 Schemas, Docker
- **CV Bullet Point:**
  > *"Engineered IntakeRx, a HIPAA-hardened clinical pre-screening platform converting conversational voice and chat intakes into FHIR-compliant EHR records with AES-256 field encryption and immutable database audit triggers."*

---

### 16. UI-Scout AI: Autonomous Visual QA
- **Repository:** [`github.com/akmalkhaniub/ui-scout-ai`](https://github.com/akmalkhaniub/ui-scout-ai)
- **Architectural Role:** Autonomous Visual Testing Suite with Live Playwright & WebSockets
- **Overview:** An autonomous visual testing platform that crawls live web apps via Playwright, captures state transitions, and flags visual regressions and broken interactions using vision LLMs.
- **Key Technical Details:**
  - Live browser execution telemetry streamed over WebSockets to an interactive React dashboard.
  - Multimodal visual inspection diffing screenshots against design specs and responsive breakpoints.
  - Actionable UX audit generation identifying layout shifts and unclickable target elements.
- **Tech Stack:** TypeScript, Express, React, Playwright, Socket.IO, Gemini Vision, Tailwind CSS
- **CV Bullet Point:**
  > *"Created UI-Scout AI, an autonomous visual testing suite executing real-time Playwright audits and vision-LLM inspections, streaming live crawling telemetry over WebSockets to an interactive dashboard."*

---

### 17. AppLens AI: Browser Testing & CRO Audit
- **Repository:** [`github.com/akmalkhaniub/applens-ai`](https://github.com/akmalkhaniub/applens-ai)
- **Architectural Role:** Real-Time Browser Testing & Conversion Rate Optimization System
- **Overview:** A real-time browser testing, visual QA, and Conversion Rate Optimization (CRO) audit system that autonomously crawls target URLs to detect conversion friction points.
- **Key Technical Details:**
  - Headless multi-viewport audit generating visual heatmaps and friction scores.
  - Generates targeted code fix recommendations for frontend engineering teams.
  - Automated form validation and checkout flow exploratory testing.
- **Tech Stack:** TypeScript, Node.js, Playwright, FastAPI, Vision LLMs, Tailwind CSS
- **CV Bullet Point:**
  > *"Engineered AppLens AI to autonomously crawl and stress-test complex checkout and auth user flows, identifying visual regressions and conversion friction bottlenecks."*

---

### 18. OpenMontage: Programmatic Video Pipeline
- **Repository:** [`github.com/akmalkhaniub/OpenMontage`](https://github.com/akmalkhaniub/OpenMontage)
- **Architectural Role:** Code-as-Video Rendering Pipeline with Remotion & Python
- **Overview:** A programmatic multimodal rendering pipeline integrating Remotion, Python, and vision models to automate high-fidelity video synthesis, dynamic typography, and automated prompt galleries.
- **Key Technical Details:**
  - Code-as-Video architecture using React components inside Remotion for frame-accurate animation.
  - Python asset orchestration pipelines for voiceover synthesis, caption timing, and image generations.
  - Multi-GPU accelerated FFmpeg rendering pipelines achieving 3.5x faster video exports.
- **Tech Stack:** TypeScript, React, Remotion, Python, Pydantic, FFmpeg, Docker
- **CV Bullet Point:**
  > *"Architected OpenMontage, a programmatic video generation engine combining Remotion React components with Python multimodal synthesis, accelerating programmatic rendering throughput by 3.5x."*

---

### 19. QuestionPaperAI: Assessment Engine
- **Repository:** [`github.com/akmalkhaniub/QuestionPaperAI`](https://github.com/akmalkhaniub/QuestionPaperAI)
- **Architectural Role:** Automated Examination Generation & Pedagogical Taxonomy
- **Overview:** An AI-powered intelligent assessment platform that streamlines test paper generation, question bank management, and grading rubric synthesis adhering to strict pedagogical schemas.
- **Key Technical Details:**
  - Randomized multi-difficulty question generation adhering to Bloom's Taxonomy.
  - OCR scanning pipeline digitizing physical examination papers into structured question banks.
  - Automated document compilation exporting print-ready DOCX and PDF examination papers with answer keys.
- **Tech Stack:** React, Express, Node.js, PostgreSQL, OpenAI API, Python OCR Service, Docker
- **CV Bullet Point:**
  > *"Engineered QuestionPaperAI, an automated examination generation platform creating randomized, curriculum-aligned test papers and grading rubrics from verified question repositories."*

---

### 20. Cadence AI: Event Operations System
- **Repository:** [`github.com/akmalkhaniub/cadence-ai`](https://github.com/akmalkhaniub/cadence-ai)
- **Architectural Role:** Autonomous Multi-Track Conference & Agenda Orchestration
- **Overview:** An enterprise-grade autonomous event orchestration system that plans, provisions, and operates complex virtual, hybrid, and in-person conferences from raw briefs, speaker rosters, and sponsor commitments.
- **Key Technical Details:**
  - Multi-agent scheduling graph resolving room capacities, speaker conflicts, and track prerequisites.
  - Automated attendee communication and dynamic schedule publication.
  - Containerized enterprise deployment ready for multi-tenant organizations.
- **Tech Stack:** Python, LangGraph, FastAPI, Docker, PostgreSQL, React
- **CV Bullet Point:**
  > *"Designed Cadence AI, an autonomous conference operations platform synthesizing multi-track agendas and resolving speaker room constraints across large-scale events."*

---


## 💻 Section 3: Cloud-Native, High-Concurrency & Systems Engineering

### 21. Enterprise Cloud-Native API Gateway
- **Repository:** [`github.com/akmalkhaniub/enterprise-api-gateway`](https://github.com/akmalkhaniub/enterprise-api-gateway)
- **Architectural Role:** Apache APISIX, LuaJIT Crypto Plugins, mTLS & Redis Cluster
- **Overview:** A production-grade cloud-native API Gateway and traffic engineering platform built on Apache APISIX, LuaJIT/OpenResty, Redis Cluster, OpenTelemetry/Jaeger, and Kubernetes CRDs.
- **Key Technical Details:**
  - Custom OpenResty/LuaJIT cryptographic plugin engineering (hmac-auth-validator) verifying request signatures at wire speed.
  - Distributed token bucket rate limiting backed by an atomic Redis cluster handling 10,000+ RPS.
  - Zero-trust Mutual TLS (mTLS), 80/20 weighted canary traffic splitting, and Spectral OpenAPI governance.
- **Tech Stack:** Apache APISIX, LuaJIT, OpenResty, Redis Cluster, OpenTelemetry, Jaeger, Kubernetes CRDs, Docker, Spectral
- **CV Bullet Point:**
  > *"Architected a cloud-native API Gateway platform on Apache APISIX and Kubernetes CRDs featuring custom OpenResty/LuaJIT cryptographic plugins (hmac-auth-validator), distributed Redis rate limiting (10,000+ RPS), mTLS, and OpenTelemetry tracing."*

---

### 22. Go High-Concurrency Load Balancer
- **Repository:** [`github.com/akmalkhaniub/go-load-balancer`](https://github.com/akmalkhaniub/go-load-balancer)
- **Architectural Role:** Layer-7 Reverse Proxy with Lock-Free Routing & Circuit Breaker
- **Overview:** A production-grade Layer-7 HTTP reverse proxy and load balancer built entirely with Go standard library primitives, demonstrating lightweight goroutine concurrency, lock-free routing, and active health check state machines.
- **Key Technical Details:**
  - Dynamic runtime topology hot-reloading (POST /api/backends/drain) for zero-downtime server maintenance.
  - Atomic lock-free Round-Robin and Least-Connections routing algorithms using sync/atomic.
  - Circuit Breaker state machine (Closed -> Open -> Half-Open) isolating failing nodes in under 200ms.
- **Tech Stack:** Go (Golang), net/http, httputil, sync/atomic, Goroutines, Channels, Docker
- **CV Bullet Point:**
  > *"Engineered a production-grade Layer-7 HTTP reverse proxy and load balancer in Go standard library primitives with zero-downtime hot-reloading, lock-free atomic routing, and an automated Circuit Breaker state machine."*

---

### 23. Go-Redis-KV: In-Memory Key-Value Store
- **Repository:** [`github.com/akmalkhaniub/go-redis-kv`](https://github.com/akmalkhaniub/go-redis-kv)
- **Architectural Role:** High-Performance Sharded In-Memory Database (RESP v2)
- **Overview:** A concurrent, high-throughput in-memory key-value database implementing the Redis Serialization Protocol (RESP v2) in Go. Connectable via official redis-cli, redis-py, and standard drivers.
- **Key Technical Details:**
  - RESP v2 protocol parser handling strings, integers, arrays, bulk strings, and error frames.
  - 32-way striped sharding using FNV-1a hashing, eliminating mutex lock contention under parallel loads.
  - Key TTL expiration tracking via active background sweeps and disk snapshot persistence.
- **Tech Stack:** Go (Golang), RESP v2 Protocol, sync.RWMutex, Socket Programming, Docker
- **CV Bullet Point:**
  > *"Built a high-performance in-memory key-value database in Go implementing the Redis Serialization Protocol (RESP v2) with a 32-shard partitioned memory architecture and precise key TTL expiration."*

---

### 24. Go Distributed Task Queue & DAG Engine
- **Repository:** [`github.com/akmalkhaniub/go-task-queue`](https://github.com/akmalkhaniub/go-task-queue)
- **Architectural Role:** Asynchronous Task Processing & Topological DAG Workflow
- **Overview:** A concurrent, high-throughput asynchronous task processing and DAG workflow engine built in Go, demonstrating priority queues, worker pools, exponential backoff retries, and dead-letter queues.
- **Key Technical Details:**
  - Priority task scheduling implemented with binary min-heaps (container/heap).
  - Topological sorting DAG workflow engine resolving inter-task dependency graphs for maximum parallel execution.
  - Worker pool pattern with dynamic throttling, exponential backoff retries, and dead-letter queue (DLQ) routing.
- **Tech Stack:** Go (Golang), container/heap, Goroutines, Channels, Docker
- **CV Bullet Point:**
  > *"Created a concurrent asynchronous task queue and DAG workflow engine in Go featuring binary min-heap priority scheduling, topological dependency resolution, and resilient dead-letter queue (DLQ) recovery."*

---

### 25. LogPulse-rs: CLI Log & Tail Latency Engine
- **Repository:** [`github.com/akmalkhaniub/logpulse-rs`](https://github.com/akmalkhaniub/logpulse-rs)
- **Architectural Role:** High-Throughput Multi-Threaded Profiler in Rust
- **Overview:** A blazingly fast CLI log and metrics profiler in Rust using zero-copy memory-mapped files (memmap2) and lock-free parallel chunk reduction (rayon), computing exact tail latencies (p50, p95, p99) in fractions of a second (~250x faster than Python).
- **Key Technical Details:**
  - Zero-copy memory-mapped file access (memmap2), bypassing user-space buffer duplication.
  - Lock-free parallel chunk reduction (rayon) saturating multi-core CPU architectures.
  - Exact percentile calculations (p50, p95, p99, p99.9) across 10M+ web server logs without memory bloat.
- **Tech Stack:** Rust, memmap2, rayon, serde, clap, regex
- **CV Bullet Point:**
  > *"Built LogPulse, a blazingly fast CLI log analyzer in Rust processing gigabytes of web server logs in sub-second runtimes (~250x faster than Python) using zero-copy memory mapping (memmap2) and parallel reduction (rayon)."*

---

### 26. py-fastfuzzy-rs: Rust Extension for Python
- **Repository:** [`github.com/akmalkhaniub/py-fastfuzzy-rs`](https://github.com/akmalkhaniub/py-fastfuzzy-rs)
- **Architectural Role:** Compiled Rust Fuzzy String Matching C-Extension via PyO3
- **Overview:** A high-performance Python extension module written in Rust using PyO3 and Rayon, demonstrating how to supercharge CPU-intensive Python workflows with native Rust speed and multi-core parallelism.
- **Key Technical Details:**
  - PyO3 native binding exposing Rust string distance algorithms directly as a compiled Python module.
  - Parallel Levenshtein and Jaro-Winkler distance computations delivering 50x speedups over pure Python.
  - Packaged and distributed native binary wheels using Maturin for seamless pip installations.
- **Tech Stack:** Rust, Python, PyO3, Rayon, Maturin
- **CV Bullet Point:**
  > *"Developed py-fastfuzzy-rs, a compiled Rust extension for Python (via PyO3 and Rayon) delivering 50x faster fuzzy string matching over pure Python for real-time entity resolution and deduplication pipelines."*

---

### 27. Django High-Throughput Async Payroll Engine
- **Repository:** [`github.com/akmalkhaniub/django-payroll-engine`](https://github.com/akmalkhaniub/django-payroll-engine)
- **Architectural Role:** Scale-Tested Financial Engine (Django, Celery, Redis, ACID)
- **Overview:** A high-throughput asynchronous payroll computation engine engineered to process enterprise salary calculations, tax deductions, and dynamic payslip PDF exports without database deadlocks or floating-point errors.
- **Key Technical Details:**
  - Offloaded CPU-bound ReportLab PDF rendering to asynchronous multi-process Celery workers.
  - Guaranteed financial precision utilizing Python's Decimal type, eliminating IEEE floating-point errors.
  - Strict ACID transactional integrity via @transaction.atomic with row locking preventing concurrent double-disbursements.
- **Tech Stack:** Python 3.11, Django, Celery, Redis, MySQL / PostgreSQL, ReportLab, Docker
- **CV Bullet Point:**
  > *"Engineered a high-throughput asynchronous payroll computation engine (Django, Celery, Redis) processing 10,000+ payslip batches concurrently with Python Decimal precision and @transaction.atomic database isolation."*

---

### 28. ScholarAssist Data Pipeline
- **Repository:** [`github.com/akmalkhaniub/scholarassist`](https://github.com/akmalkhaniub/scholarassist)
- **Architectural Role:** Academic Dataset Ingestion, Spark Deduplication & Airflow DAGs
- **Overview:** An end-to-end academic dataset ingestion and deduplication pipeline (FastAPI, Apache Spark, Airflow DAGs, Docker Compose) delivering normalized semantic indexing and low-latency search APIs.
- **Key Technical Details:**
  - Apache Spark batch ETL jobs for large-scale document deduplication and author disambiguation.
  - Apache Airflow DAGs coordinating automated scraping, chunking, and embedding generation.
  - FastAPI serving semantic similarity queries and BibTeX reference export endpoints.
- **Tech Stack:** Python, Apache Spark, Apache Airflow, FastAPI, PostgreSQL, Pydantic, Docker Compose
- **CV Bullet Point:**
  > *"Architected an end-to-end academic dataset ingestion pipeline (FastAPI, Apache Spark, Airflow) normalizing millions of scientific publications into clean semantic indices for grounded RAG research assistants."*

---


## 🛡️ Section 4: The 17 Specialized Agentic Microservices (`AgenticApps` Monorepo)

### 29. Fintech Fraud Mitigator
- **Repository:** [`github.com/akmalkhaniub/fintech-fraud-mitigator`](https://github.com/akmalkhaniub/fintech-fraud-mitigator)
- **Architectural Role:** Real-Time Transaction Risk Engine & Kafka Stream Processor
- **Overview:** A high-velocity transaction risk scoring engine in Go consuming Apache Kafka streams to evaluate velocity heuristics and trigger automated freeze protocols.
- **Key Technical Details:**
  - Stream processing consuming 10,000+ transactions per second with sub-10ms scoring latency.
  - Configurable risk matrix flagging rapid geographic transitions and high-frequency velocity anomalies.
  - Automated step-up 2FA and outbound verification webhooks.
- **Tech Stack:** Go (Golang), Apache Kafka, Redis, Webhooks, Docker
- **CV Bullet Point:**
  > *"Engineered a real-time fintech fraud scoring engine in Go consuming Apache Kafka streams to evaluate transaction velocity and trigger automated freeze protocols."*

---

### 30. Cloud Security Sentinel
- **Repository:** [`github.com/akmalkhaniub/cloud-security-sentinel`](https://github.com/akmalkhaniub/cloud-security-sentinel)
- **Architectural Role:** Autonomous AWS Infrastructure & IAM Policy Auditor
- **Overview:** A proactive cloud security agent built in Rust that continuously monitors AWS infrastructure, detects IAM misconfigurations, simulates privilege escalation paths, and generates remediation scripts.
- **Key Technical Details:**
  - Continuous AWS CloudTrail and IAM policy graph analysis in Rust using Tokio.
  - Simulates privilege escalation vectors and unauthorized cross-account role assumptions.
  - Automated synthesis of least-privilege Terraform remediation patches.
- **Tech Stack:** Rust, AWS SDK, Tokio, Serde, Terraform
- **CV Bullet Point:**
  > *"Developed an autonomous cloud infrastructure auditor in Rust, continuously analyzing AWS IAM policies and simulating exploitability vectors to prevent privilege escalation."*

---

### 31. Compliance & PII Sanitizer
- **Repository:** [`github.com/akmalkhaniub/compliance-pii-sanitizer`](https://github.com/akmalkhaniub/compliance-pii-sanitizer)
- **Architectural Role:** Privacy-Preserving Proxy Firewall for LLM Requests
- **Overview:** A low-latency security firewall positioned between raw enterprise databases and LLM APIs that detects Personally Identifiable Information (PII, SSNs, credit cards), redacts sensitive tokens, and enforces data residency policies.
- **Key Technical Details:**
  - Deterministic and contextual NER PII detection with Microsoft Presidio.
  - Token hashing enabling re-identification upon authorized response receipt.
  - Enforces strict data sovereignty and residency rules before upstream prompt transmission.
- **Tech Stack:** Python, Microsoft Presidio, FastAPI, Regex, Redis
- **CV Bullet Point:**
  > *"Built a low-latency PII sanitization proxy masking sensitive tokens (SSNs, medical records, credentials) before prompt dispatch to external cloud LLMs."*

---

### 32. Model Router Sentinel & Budget Guard
- **Repository:** [`github.com/akmalkhaniub/model-router-sentinel`](https://github.com/akmalkhaniub/model-router-sentinel)
- **Architectural Role:** Dynamic Prompt Classifier & Semantic Cache Proxy
- **Overview:** A cost-aware proxy that classifies incoming prompt complexity, checks a semantic Redis cache for previous responses, routes queries to the most cost-effective model tier, and enforces departmental budgets.
- **Key Technical Details:**
  - Semantic similarity cache matching incoming queries against past responses to bypass LLM inference.
  - Heuristic complexity classifier routing simple queries to Gemini Flash and complex tasks to Claude 3.5 Sonnet.
  - Slashed total organizational token spend by 45% with zero degradation in perceived response quality.
- **Tech Stack:** Python, FastAPI, Redis (Semantic Caching), LiteLLM, Pydantic
- **CV Bullet Point:**
  > *"Created an intelligent LLM router classifying prompt complexity and utilizing semantic caching to route queries dynamically, slashing overall API token costs by 45%."*

---

### 33. Feature Shippable Agent
- **Repository:** [`github.com/akmalkhaniub/feature-shippable-agent`](https://github.com/akmalkhaniub/feature-shippable-agent)
- **Architectural Role:** Autonomous Coding Agent Operating in Isolated E2B Sandboxes
- **Overview:** An autonomous coding agent that accepts feature specifications, executes code modifications within isolated E2B microVM sandboxes, runs unit test suites, and opens verified pull requests on GitHub.
- **Key Technical Details:**
  - Executes complete coding workflows inside isolated, disposable E2B microVM environments.
  - Autonomous feedback loop: runs tests, reads stderr traces, and iterates on fixes before publishing.
  - Automates GitHub PR generation complete with testing summaries and diff analysis.
- **Tech Stack:** TypeScript, Node.js, E2B Code Interpreter, Octokit, Claude 3.5 Sonnet
- **CV Bullet Point:**
  > *"Built an autonomous coding agent operating in E2B microVMs that writes feature implementations, executes test suites in sandbox isolation, and submits verified PRs."*

---

### 34. LLM Benchmark & Hallucination Evaluator
- **Repository:** [`github.com/akmalkhaniub/llm-benchmark-evaluator`](https://github.com/akmalkhaniub/llm-benchmark-evaluator)
- **Architectural Role:** Automated Hallucination & Factuality Verification Framework
- **Overview:** A specialized evaluation framework measuring model response relevance, hallucination index, toxicity, latency, and token efficiency against ground-truth datasets.
- **Key Technical Details:**
  - Automated scoring against ground-truth question-answering evaluation datasets.
  - Computes G-Eval, toxicity, and contextual faithfulness scores.
  - Generates comprehensive regression reports across model version updates.
- **Tech Stack:** Python, LangSmith, DeepEval, Pytest, Pandas
- **CV Bullet Point:**
  > *"Implemented an automated LLM evaluation harness benchmarking hallucination rates, semantic drift, and latency percentiles across frontier models."*

---

### 35. Medical Intake Voice Nurse
- **Repository:** [`github.com/akmalkhaniub/medical-intake-nurse`](https://github.com/akmalkhaniub/medical-intake-nurse)
- **Architectural Role:** HIPAA-Compliant Conversational Voice Triage Agent
- **Overview:** An automated voice agent handling inbound patient calls, conducting structured symptom triage against clinical protocols, and scheduling appointments with on-call physicians.
- **Key Technical Details:**
  - Low-latency speech-to-speech interaction via Twilio Voice and OpenAI Whisper.
  - Structured clinical protocol decision tree identifying urgent emergency conditions.
  - Autonomous appointment booking into clinic EHR scheduling backends.
- **Tech Stack:** Python, WebRTC, Twilio Voice API, Whisper, Claude 3.5, PostgreSQL
- **CV Bullet Point:**
  > *"Engineered an automated voice triage agent handling inbound patient inquiries and scheduling clinic appointments following strict clinical triage protocols."*

---

### 36. Autonomous DevRel Agent
- **Repository:** [`github.com/akmalkhaniub/autonomous-devrel-agent`](https://github.com/akmalkhaniub/autonomous-devrel-agent)
- **Architectural Role:** Developer Community Support & Documentation Synthesizer
- **Overview:** An agent that monitors technical developer community channels, answers engineering questions using RAG over source repositories, and drafts missing documentation pages when recurring knowledge gaps are detected.
- **Key Technical Details:**
  - Ingests codebase ASTs and markdown docs to provide verified code solutions in Discord/Slack.
  - Clusters unaddressed community questions to identify documentation deficiencies.
  - Drafts complete pull requests for missing tutorial guides and API references.
- **Tech Stack:** TypeScript, Discord/Slack APIs, Vector DB, Next.js, Octokit
- **CV Bullet Point:**
  > *"Deployed an autonomous developer advocacy agent parsing GitHub issues and Discord inquiries to generate grounded RAG solutions and draft missing technical documentation."*

---

### 37. Agentic Customer Support
- **Repository:** [`github.com/akmalkhaniub/agentic-customer-support`](https://github.com/akmalkhaniub/agentic-customer-support)
- **Architectural Role:** Action-Oriented Customer Resolution Agent
- **Overview:** An action-oriented support agent that doesn't just converse—it actively resolves customer tickets by querying order databases, initiating refunds, and adjusting shipping parameters within authorized policy bounds.
- **Key Technical Details:**
  - Integrates external database query tools for live customer order lookup.
  - Strict policy guardrails enforcing monetary refund limits with automated supervisor escalation.
  - Multi-turn context retention across email, chat, and CRM ticketing systems.
- **Tech Stack:** Python, LangChain, FastAPI, PostgreSQL, Stripe API
- **CV Bullet Point:**
  > *"Built an autonomous customer resolution agent executing transactional operations (refunds, order modifications) within strict financial bounds."*

---

### 38. Real Estate Virtual Showings Coordinator
- **Repository:** [`github.com/akmalkhaniub/real-estate-coordinator`](https://github.com/akmalkhaniub/real-estate-coordinator)
- **Architectural Role:** Outbound Lead Qualification & Showing Scheduler
- **Overview:** An outbound conversational agent built in TypeScript that qualifies real estate buyer leads, answers complex property inquiries using RAG over listing brochures, and books in-person showings.
- **Key Technical Details:**
  - RAG over MLS listings and architectural floorplans for accurate square footage and HOA answers.
  - Two-way calendar synchronization with agent Google/Outlook calendars.
  - Automated SMS reminder sequences minimizing showing no-shows.
- **Tech Stack:** TypeScript, Node.js, Twilio SMS/Voice, OpenAI API, PostgreSQL
- **CV Bullet Point:**
  > *"Engineered an outbound conversational real estate coordinator qualifying buyer leads via RAG over property brochures and scheduling calendar showings."*

---

### 39. Service Dispatch Coordinator
- **Repository:** [`github.com/akmalkhaniub/service-dispatch-coordinator`](https://github.com/akmalkhaniub/service-dispatch-coordinator)
- **Architectural Role:** Autonomous Voice Dispatcher for Home Services
- **Overview:** An autonomous voice dispatcher for home emergency services (plumbing, electrical, HVAC) that receives emergency calls, extracts problem severity, identifies the nearest technician via geo-routing, and dispatches appointments.
- **Key Technical Details:**
  - Real-time voice transcription and emergency severity grading.
  - Geo-distance routing matching technicians based on live GPS location and specialized tool inventory.
  - Automated technician dispatch confirmation via SMS.
- **Tech Stack:** Python, FastAPI, Twilio, PostGIS, Google Maps API
- **CV Bullet Point:**
  > *"Developed an autonomous emergency service dispatcher utilizing geo-spatial routing to match and dispatch emergency calls to field technicians."*

---

### 40. Travel Concierge Agent
- **Repository:** [`github.com/akmalkhaniub/travel-concierge-agent`](https://github.com/akmalkhaniub/travel-concierge-agent)
- **Architectural Role:** Consumer Voice Concierge Navigating Airline & Hotel IVRs
- **Overview:** A voice concierge agent that calls airline or hotel customer service on behalf of users, navigates complex IVR phone menus, waits on hold, and bridges the user only when a live human agent is reached.
- **Key Technical Details:**
  - DTMF tone generation navigating multi-tier automated IVR phone trees.
  - Hold-music and voice activity detection determining when a human representative answers.
  - Seamless live three-way WebRTC bridging connecting the user.
- **Tech Stack:** Python, Twilio Voice, WebRTC, Audio Classification, FastAPI
- **CV Bullet Point:**
  > *"Architected a consumer voice concierge agent navigating automated IVR trees and hold queues, bridging the user only upon human agent connection."*

---

### 41. Scientific Research Sandbox
- **Repository:** [`github.com/akmalkhaniub/scientific-research-sandbox`](https://github.com/akmalkhaniub/scientific-research-sandbox)
- **Architectural Role:** Autonomous Statistical Analysis & Paper Extraction Agent
- **Overview:** An autonomous research assistant that ingests messy academic papers and tabular datasets, extracts metrics, writes Python analysis scripts, executes them in isolated sandboxes, and compiles charts.
- **Key Technical Details:**
  - Extracts tabular data from scientific PDFs into normalized Pandas dataframes.
  - Generates and runs statistical hypothesis tests and regression models inside isolated containers.
  - Automates generation of publication-ready Seaborn and Matplotlib visualization artifacts.
- **Tech Stack:** Python, Docker Sandbox, Pandas, SciPy, Matplotlib, Claude 3.5
- **CV Bullet Point:**
  > *"Built an autonomous research sandbox ingesting messy scientific publications, executing statistical hypothesis testing in Docker isolation, and generating visualization figures."*

---

### 42. Revenue Recovery Auditor
- **Repository:** [`github.com/akmalkhaniub/revenue-recovery-auditor`](https://github.com/akmalkhaniub/revenue-recovery-auditor)
- **Architectural Role:** Stripe Webhook Auditor & Autonomous Dunning Workflow in Go
- **Overview:** A multi-agent revenue recovery engine built in Go that monitors Stripe webhooks for failed subscription charges, analyzes user engagement metrics, and executes intelligent dunning workflows.
- **Key Technical Details:**
  - High-throughput webhook listener processing Stripe payment failure events in Go.
  - Predictive dunning schedule optimization maximizing payment recovery rates.
  - Recovered over 18% of churned MRR through automated intelligent retry routing.
- **Tech Stack:** Go (Golang), Stripe API, PostgreSQL, SendGrid API, Docker
- **CV Bullet Point:**
  > *"Engineered a revenue recovery engine in Go monitoring Stripe billing webhooks and orchestrating predictive dunning sequences, recovering 18% of failed subscription revenue."*

---

### 43. Multi-Agent Debate Engine
- **Repository:** [`github.com/akmalkhaniub/agentic-apps-portfolio`](https://github.com/akmalkhaniub/agentic-apps-portfolio)
- **Architectural Role:** Adversarial Consensus & Bias Elimination Framework
- **Overview:** A multi-agent consensus system where two or more specialized agent personas debate complex dilemmas from opposing perspectives before an impartial judge agent synthesizes a balanced verdict.
- **Key Technical Details:**
  - Multi-turn dialectical debate protocol eliminating single-model cognitive bias.
  - Formal scoring rubrics evaluating factual consistency, logical fallacies, and empirical evidence.
  - Demonstrated 22% improvement in factual accuracy on ambiguous policy evaluations.
- **Tech Stack:** Python, LangGraph, LiteLLM, Pydantic, FastAPI
- **CV Bullet Point:**
  > *"Designed a multi-agent debate framework deploying adversarial personas to stress-test complex strategic hypotheses, improving final synthesis accuracy by 22%."*

---

### 44. Multimodal QA Agent
- **Repository:** [`github.com/akmalkhaniub/multimodal-qa-agent`](https://github.com/akmalkhaniub/multimodal-qa-agent)
- **Architectural Role:** Playwright Visual Inspector & Design System Auditor
- **Overview:** An autonomous visual testing agent crawling web applications using Playwright, sending rendered viewports to vision LLMs to audit alignment against brand guidelines and accessibility standards.
- **Key Technical Details:**
  - Automated WCAG 2.1 contrast ratio and font sizing accessibility auditing.
  - Flags visual misalignment across mobile, tablet, and ultra-wide viewports.
  - Generates CSS patch recommendations directly from vision model inspections.
- **Tech Stack:** TypeScript, Playwright, Claude 3.7 Vision, OpenCV, Node.js
- **CV Bullet Point:**
  > *"Implemented an autonomous visual QA agent crawling web applications with Playwright and evaluating layout accessibility and design compliance using Claude Vision."*

---

### 45. Enterprise Knowledge Swarm
- **Repository:** [`github.com/akmalkhaniub/agentic-apps-portfolio`](https://github.com/akmalkhaniub/agentic-apps-portfolio)
- **Architectural Role:** Hierarchical Multi-Agent Knowledge Retrieval Swarm
- **Overview:** A hierarchical swarm of specialized retrieval agents querying disparate enterprise knowledge stores (Confluence, Notion, Google Drive, Jira) and synthesizing a unified response.
- **Key Technical Details:**
  - Deconstructs broad enterprise queries into sub-queries delegated to domain-specific connectors.
  - Reciprocal Rank Fusion (RRF) reranking across disparate vector indexes and keyword engines.
  - Enforces source-level document permissions before response synthesis.
- **Tech Stack:** Python, CrewAI, Qdrant, FastAPI, Pydantic
- **CV Bullet Point:**
  > *"Engineered a hierarchical knowledge retrieval swarm coordinating specialized agents across enterprise documentation silos with Reciprocal Rank Fusion reranking."*

---


## 🏥 Section 5: Domain AI, HealthTech, Web & Mobile Applications

### 46. MedEdge: Hybrid Clinical Assistant
- **Repository:** [`github.com/akmalkhaniub/MedEdge`](https://github.com/akmalkhaniub/MedEdge)
- **Architectural Role:** Local-First Clinical Intelligence with Offline Gemma & 2G SMS Bridge
- **Overview:** A cross-platform, local-first clinical decision assistant designed for resource-constrained clinics. Operates offline with local Gemma models via Ollama or online with cloud Gemini models, featuring a 2G SMS bridge.
- **Key Technical Details:**
  - Dynamic local-to-cloud inference switching: runs offline via Ollama (Gemma) with cloud failover to Gemini.
  - Consultation pipeline: transcription -> SOAP clinical note formatting -> triage draft.
  - 2G SMS fallback bridge via Africa's Talking API for messaging feature-phone patients in remote regions.
- **Tech Stack:** Python, FastAPI, React Native, Ollama (Gemma), Google Gemini API, Africa's Talking SMS API
- **CV Bullet Point:**
  > *"Built MedEdge, a local-first clinical assistant operating offline via Ollama (Gemma) with cloud failover to Gemini Pro for resource-constrained clinics, integrated with a 2G SMS fallback bridge for feature phones."*

---

### 47. Secure Healthcare Audit Vault
- **Repository:** [`github.com/akmalkhaniub/healthcare-audit-vault`](https://github.com/akmalkhaniub/healthcare-audit-vault)
- **Architectural Role:** HIPAA-Hardened Patient Record Vault with pgvector & Immutable Logs
- **Overview:** A high-security, HIPAA-compliant patient record repository featuring document QA search using vector embeddings, role-based access control (RBAC), and database-level immutable audit logging.
- **Key Technical Details:**
  - Vector search RAG using pgvector inside PostgreSQL with HNSW index optimization.
  - Database-level immutable audit logging enforced via PostgreSQL triggers to prevent tampering.
  - Temporary AWS S3 pre-signed URLs guaranteeing zero direct-link document exposure.
- **Tech Stack:** Next.js, Node.js, TypeScript, PostgreSQL (pgvector), AWS S3 Pre-Signed URLs, Tailwind CSS, Docker
- **CV Bullet Point:**
  > *"Architected a HIPAA-compliant healthcare document vault featuring pgvector semantic Q&A, immutable PostgreSQL audit triggers, and temporary AWS S3 signed URLs guaranteeing zero unauthorized data exposure."*

---

### 48. AI Care Agency Rota Manager
- **Repository:** [`github.com/akmalkhaniub/portfolio-ai-rota-manager`](https://github.com/akmalkhaniub/portfolio-ai-rota-manager)
- **Architectural Role:** Natural Language Shift Scheduling with OpenAI Tool Use
- **Overview:** An AI-powered care scheduling platform that enables agency coordinators to manage shifts and enforce labor compliance using natural language prompts, offloading validation to an agentic tool loop.
- **Key Technical Details:**
  - OpenAI function calling translating natural language staffing directives into optimal shift assignments.
  - Real-time certification verification and automatic double-booking prevention enforced via PostgreSQL constraints.
  - Containerized multi-service deployment with Next.js UI, Express API, and PostgreSQL.
- **Tech Stack:** Next.js, Node.js, TypeScript, Express, PostgreSQL, OpenAI Function Calling, Docker
- **CV Bullet Point:**
  > *"Developed an AI shift scheduling platform for care agencies translating natural language requests into compliant staffing rosters via OpenAI tool use, preventing double-bookings and certification lapses."*

---

### 49. Socrates: Hybrid Socratic Tutor
- **Repository:** [`github.com/akmalkhaniub/socrates`](https://github.com/akmalkhaniub/socrates)
- **Architectural Role:** Guided Socratic Dialogue Platform (Google Gemma Hackathon)
- **Overview:** An AI-driven educational platform designed for the Google Gemma 4 Good Hackathon, bridging the gap between personalized tutoring and resource-constrained environments by running local Gemma models on edge devices.
- **Key Technical Details:**
  - On-device guided Socratic dialogue using Ollama and Gemma.
  - Hybrid edge-to-cloud architecture supporting offline rural school classrooms.
  - Admin telemetry panel tracking student mastery curves.
- **Tech Stack:** React Native, FastAPI, Ollama, Google Gemma, WebSockets
- **CV Bullet Point:**
  > *"Engineered Socrates, an educational platform conducting guided Socratic dialogues on edge devices using local Gemma models, built for the Google Gemma Hackathon to support resource-constrained classrooms."*

---


## 📱 Section 5 Continued: Full-Stack Web, Gaming & Mobile Platforms

### 50. Studio OS: AI Film Operating System
- **Repository:** [`github.com/akmalkhaniub/AK_Productions`](https://github.com/akmalkhaniub/AK_Productions)
- **Architectural Role:** Next.js 16, FastAPI & Gemini 2.5 Pro Vision 7-Agent Network
- **Overview:** An AI-powered film studio operating system and multi-agent network automating video ingestion, screenplay analysis, casting performance, and auto-dubbing translation.
- **Key Technical Details:**
  - 7 specialized agents coordinating video ingestion, pre-production breakdown, and continuous takes analysis.
  - Audition analysis evaluating pitch, tempo, and emotional intensity using Gemini 2.5 Pro Vision.
  - Unified backend API Gateway (FastAPI) serving a Next.js web panel and an Expo mobile app.
- **Tech Stack:** Next.js 16, React, FastAPI, Expo / React Native, Gemini 2.5 Pro Vision, PostgreSQL, Docker
- **CV Bullet Point:**
  > *"Architected Studio OS, an AI film production platform coordinating 7 specialized agents to automate screenplay breakdown and audition analysis using Gemini 2.5 Pro Vision."*

---

### 51. RangMaster & RangMasterPro
- **Repository:** [`github.com/akmalkhaniub/RangMasterPro`](https://github.com/akmalkhaniub/RangMasterPro)
- **Architectural Role:** Real-Time Multiplayer Game & Media Synchronization Platform
- **Overview:** A production real-time multiplayer card gaming platform powered by Node.js, Express, WebSockets, React, Zustand, and Neon PostgreSQL, packaged for native iOS and Android via Capacitor.
- **Key Technical Details:**
  - Authoritative game server handling concurrent trick resolution and turn timers over WebSockets (<50ms latency).
  - State management with Zustand and optimistic UI rendering.
  - Cross-platform distribution across Web, iOS, and Android via Capacitor.
- **Tech Stack:** Node.js, Express, WebSockets, React, Zustand, Drizzle ORM, Neon PostgreSQL, Capacitor
- **CV Bullet Point:**
  > *"Engineered a real-time multiplayer card gaming platform supporting sub-50ms game state synchronization over WebSockets, packaged for native iOS and Android via Capacitor."*

---

### 52. CardGames Web Platform
- **Repository:** [`github.com/akmalkhaniub/CardGames`](https://github.com/akmalkhaniub/CardGames)
- **Architectural Role:** Dockerized Full-Stack Card Gaming Engine
- **Overview:** A containerized web application platform delivering multiplayer card game rule engines, player matchmaking, and responsive frontend canvas components.
- **Key Technical Details:**
  - Complete rule validation for trick-taking multiplayer card games.
  - Reverse-proxied with Nginx and containerized with Docker.
  - Low-latency state broadcasting to active browser sessions.
- **Tech Stack:** Node.js, React, Docker, Nginx, PostgreSQL
- **CV Bullet Point:**
  > *"Delivered a Dockerized card game platform with Nginx reverse proxying and WebSocket state management."*

---

### 53. LudoMaster Board Game
- **Repository:** [`github.com/akmalkhaniub/LudoMaster`](https://github.com/akmalkhaniub/LudoMaster)
- **Architectural Role:** Deterministic Game Physics & Board Logic Engine in Python
- **Overview:** A classic multiplayer Ludo board game implementing complete rules, piece collision logic, safe squares, and AI bot opponents.
- **Key Technical Details:**
  - Deterministic collision detection and board coordinate mappings.
  - Heuristic AI bot opponents simulating strategic token movements.
  - Built with Pygame showcasing low-level event loops and graphics rendering.
- **Tech Stack:** Python, Pygame
- **CV Bullet Point:**
  > *"Implemented a classic multiplayer board game engine in Python with deterministic piece collision rules and bot logic."*

---

### 54. Cross-Platform Mobile Quiz Application
- **Repository:** [`github.com/akmalkhaniub/quiz-app`](https://github.com/akmalkhaniub/quiz-app)
- **Architectural Role:** React Native, Expo, NativeWind, Prisma & Supabase
- **Overview:** A modern cross-platform mobile quiz application built using React Native, Expo, TypeScript, TailwindCSS (NativeWind), Prisma, and Supabase.
- **Key Technical Details:**
  - NativeWind mobile styling with fluid animations and responsive mobile layouts.
  - Offline question caching and background synchronization with Supabase.
  - Comprehensive mobile test coverage using Jest and React Native Testing Library.
- **Tech Stack:** React Native, Expo Router, TypeScript, NativeWind, Prisma, Supabase, Jest
- **CV Bullet Point:**
  > *"Shipped a cross-platform mobile quiz app using React Native, Expo, and NativeWind with Supabase synchronization, upholding strict mobile UI test coverage."*

---

### 55. AgenticLife (FootprintOS)
- **Repository:** [`github.com/akmalkhaniub/agenticlife`](https://github.com/akmalkhaniub/agenticlife)
- **Architectural Role:** Digital Footprint Growth Platform & Personal CRM
- **Overview:** A private, single-user digital footprint growth platform acting as an intelligent personal CRM, PR outreach tracker, conference networking workspace, and product launch planner.
- **Key Technical Details:**
  - Next.js App Router with Server Components and PostgreSQL database adapter (@prisma/adapter-pg).
  - Automated touchpoint tracking and interaction graph visualization.
  - Tailwind CSS responsive design with dark mode support.
- **Tech Stack:** Next.js (App Router), React, TypeScript, Prisma ORM, PostgreSQL, Tailwind CSS
- **CV Bullet Point:**
  > *"Engineered FootprintOS (Next.js, Prisma, PostgreSQL), a personal CRM and PR automation tool tracking technical outreach, conference touchpoints, and product launches."*

---


## 🔬 Section 6: Architecture Showcases, Specialized Agents & Suites

### 56. VentureDive Lead Architect Portfolio
- **Repository:** [`github.com/akmalkhaniub/venturedive-architect-portfolio`](https://github.com/akmalkhaniub/venturedive-architect-portfolio)
- **Architectural Role:** Agentic Lakehouse, Streaming Anomaly & DataOps RAG
- **Overview:** Enterprise-grade AI & Data Architecture showcase projects demonstrating production Agentic Lakehouses, Real-time Streaming Anomaly Detection, and DataOps RAG pipelines.
- **Key Technical Details:**
  - Agentic Lakehouse combining Medallion Delta Lake architecture with autonomous data quality agents.
  - Real-time streaming anomaly detection engine built with Apache Kafka and Flink.
  - DataOps RAG pipeline establishing automated data ingestion, validation, and evaluation tracking.
- **Tech Stack:** Apache Spark, Apache Kafka, Apache Flink, Delta Lake, Python, FastAPI, Docker
- **CV Bullet Point:**
  > *"Authored enterprise architecture blueprints for Agentic Lakehouses and streaming anomaly detection engines handling high-volume real-time events across distributed data pipelines."*

---

### 57. Kaggle Competition Master
- **Repository:** [`github.com/akmalkhaniub/kaggle-competition-master`](https://github.com/akmalkhaniub/kaggle-competition-master)
- **Architectural Role:** ML Competition Pipeline & Deep Stacking Workbench
- **Overview:** A machine learning competition engineering workbench with automated feature engineering, Bayesian hyperparameter optimization, and multi-model ensembling.
- **Key Technical Details:**
  - Automated stacking combining LightGBM, XGBoost, and PyTorch deep neural networks.
  - Optuna Bayesian hyperparameter optimization tracking cross-validation scores.
  - Feature importance and error analysis dashboards.
- **Tech Stack:** Python, PyTorch, LightGBM, XGBoost, Optuna, Scikit-Learn, Pandas
- **CV Bullet Point:**
  > *"Built an automated ML competition pipeline featuring Bayesian hyperparameter optimization (Optuna) and multi-model neural network stacking across tabular and multimodal datasets."*

---

### 58. Python Interview Prep Suite
- **Repository:** [`github.com/akmalkhaniub/python-interview-prep-suite`](https://github.com/akmalkhaniub/python-interview-prep-suite)
- **Architectural Role:** 16-Notebook Systems Engineering & Cloud Architecture Guide
- **Overview:** A comprehensive 16-notebook technical suite covering advanced Python paradigms, concurrency models, distributed algorithms, memory management, and cross-cloud architectural mappings.
- **Key Technical Details:**
  - Exhaustive coverage of OOD principles, concurrency patterns, and distributed algorithms.
  - Comparative technical mappings of architectural primitives across AWS, GCP, and Azure.
  - Memory optimization and low-level performance-tuning strategies for core Python architectures.
- **Tech Stack:** Python, Jupyter Notebooks, Cloud Architecture, Distributed Algorithms
- **CV Bullet Point:**
  > *"Authored a 16-notebook engineering suite covering system design patterns, distributed concurrency models, and comparative AWS/GCP/Azure cloud architecture mappings."*

---

### 59. Object-Oriented Design Patterns Lab
- **Repository:** [`github.com/akmalkhaniub/OOD-Mastery`](https://github.com/akmalkhaniub/OOD-Mastery)
- **Architectural Role:** Clean Architecture & Design Smell Refactoring Laboratories
- **Overview:** Code laboratories demonstrating GoF design patterns (Creational, Structural, Behavioral), clean architecture principles, and refactorings of common architectural smells.
- **Key Technical Details:**
  - Comprehensive student packs and labs covering SOLID principles and system design.
  - Refactoring case studies transforming legacy antipatterns into clean decoupled architectures.
  - Complete UML diagrams and reference implementations across Python and TypeScript.
- **Tech Stack:** Python, TypeScript, UML, Clean Architecture, Design Patterns
- **CV Bullet Point:**
  > *"Developed clean code laboratories demonstrating GoF design patterns, SOLID principles, and architectural refactoring strategies."*

---

### 60. BlogAgent: Autonomous Content Creation
- **Repository:** [`github.com/akmalkhaniub/blogagent`](https://github.com/akmalkhaniub/blogagent)
- **Architectural Role:** Autonomous SEO & Content Generation Agent
- **Overview:** An autonomous AI-powered content creation system designed to automate technical blog post generation, SEO keyword research, knowledge retrieval, and audio asset synthesis.
- **Key Technical Details:**
  - Autonomous SEO keyword clustering and search intent analysis.
  - Grounded technical drafting utilizing codebase RAG context.
  - Automated text-to-speech audio synthesis for accessible audio articles.
- **Tech Stack:** Python, FastAPI, OpenAI API, TTS Audio Models, Markdown Ingestion
- **CV Bullet Point:**
  > *"Created BlogAgent, an autonomous content generation agent performing SEO research, RAG-grounded drafting, and automated audio synthesis."*

---

### 61. YouTube Topic Intelligence Agent
- **Repository:** [`github.com/akmalkhaniub/youtube_DisoverAI`](https://github.com/akmalkhaniub/youtube_DisoverAI)
- **Architectural Role:** Automated Video Search, Transcript Ingestion & Topic Intelligence
- **Overview:** An automated video intelligence agent performing daily targeted YouTube searches, extracting closed captions, and generating executive summaries of emerging AI research topics.
- **Key Technical Details:**
  - Scheduled daily search and video discovery across designated AI research topics.
  - Automated transcript extraction and token-efficient summarization.
  - Generates daily digest newsletters and trend alerts.
- **Tech Stack:** Python, YouTube Data API, YouTube Transcript API, Docker, Claude API
- **CV Bullet Point:**
  > *"Built an automated video intelligence agent extracting and analyzing YouTube transcripts to synthesize executive trend reports on emerging AI research."*

---

## 🎯 CV Update Strategy & Placement Guide

### Recommended Placement for Different Senior Job Roles:

#### 1. Targeting **Staff / Principal AI Engineer / AI Architect**:
- **Headline Projects:** **Agent Fleet Orchestrator**, **Ops MCP Suite**, **SpecForge**, **Enterprise Cloud-Native API Gateway**
- **Emphasize:** Multi-agent DAG orchestration, FastMCP / Model Context Protocol tooling, closed-loop AST verification, FinOps token optimization, and zero-downtime traffic architectures.

#### 2. Targeting **Senior Full-Stack AI Engineer (React / Next.js / Python / Node)**:
- **Headline Projects:** **SpecForge**, **LeaseLogic AI**, **Sentinel**, **Studio OS**, **IntakeRx**
- **Emphasize:** Two-pass extraction with Claude 3.5 Sonnet, pgvector HNSW indexing, Zod schema validation, BullMQ background processing, and responsive React/Next.js/React Native interfaces.

#### 3. Targeting **Senior Backend / Distributed Systems Engineer (Go / Rust / Python)**:
- **Headline Projects:** **Enterprise Cloud-Native API Gateway Platform**, **Go High-Concurrency Reverse Proxy**, **LogPulse-rs**, **Go-Redis-KV**, **Django Payroll Engine**
- **Emphasize:** LuaJIT crypto plugins, Redis clusters, lock-free routing, binary min-heap priority queues, zero-copy memory mapping (`memmap2`), and Celery/Redis ACID transaction security.

#### 4. Targeting **HealthTech / Enterprise Compliance AI Engineer**:
- **Headline Projects:** **IntakeRx**, **Secure Healthcare Audit Vault**, **MedEdge**, **AI Care Agency Rota Manager**
- **Emphasize:** HIPAA compliance, FHIR/HL7 schemas, AES-256 field encryption, PostgreSQL immutable audit triggers, and offline/edge LLM inference via Ollama/Gemma.

---
*Master report generated on September 8, 2026. Maintained by Akmal Khan, PhD.*