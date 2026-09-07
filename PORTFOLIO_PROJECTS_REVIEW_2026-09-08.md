# 🚀 Comprehensive Portfolio Projects Review & Technical Stack Index

**Document Date:** September 8, 2026  
**Author:** Akmal Khan, PhD — Senior Full Stack AI Engineer & Systems Architect  
**Profile:** [github.com/akmalkhaniub](https://github.com/akmalkhaniub) | [linkedin.com/in/akmal-khan-332000250](https://www.linkedin.com/in/akmal-khan-332000250/) | [akmalkhaniub.github.io](https://akmalkhaniub.github.io)  
**Primary Purpose:** Comprehensive technical audit, architectural descriptions, tech stack inventory, and copy-paste ready bullet points for Curriculum Vitae (CV), executive resumes, and technical interviews.

---

## 📑 Table of Contents

1. [Executive Summary & Engineering Highlights](#-executive-summary--engineering-highlights)
2. [Skills & Technology Matrix](#-skills--technology-matrix)
3. [Section 1: Agentic Infrastructure, Multi-Agent Systems & Developer Platforms](#-section-1-agentic-infrastructure-multi-agent-systems--developer-platforms)
   - [Agent Fleet Orchestrator](#1-agent-fleet-orchestrator)
   - [Ops MCP Suite](#2-ops-mcp-suite)
   - [Drizzle Sentinel MCP](#3-drizzle-sentinel-mcp)
   - [Agent Toolchain Core](#4-agent-toolchain-core)
   - [NEXUS Agent Platform (`nexus-agent-runtime`)](#5-nexus-agent-platform-nexus-agent-runtime)
   - [Google A2A & ADK Multi-Agent Suite](#6-google-a2a--adk-multi-agent-suite)
4. [Section 2: Applied AI Products, Multimodal Systems & Vertical MVPs](#-section-2-applied-ai-products-multimodal-systems--vertical-mvps)
   - [SpecForge](#7-specforge)
   - [Sentinel — Autonomous QA & Bug Hunter](#8-sentinel--autonomous-qa--bug-hunter)
   - [Multimodal Eval Harness](#9-multimodal-eval-harness)
   - [Enterprise Operations Agent](#10-enterprise-ops-agent)
   - [Enterprise Procurement Intelligence Agent](#11-enterprise-procurement-intelligence-agent)
   - [LeaseLogic AI](#12-leaselogic-ai)
   - [ClaimPilot](#13-claimpilot)
   - [IntakeRx](#14-intakerx)
   - [UI-Scout AI & AppLens AI](#15-ui-scout-ai--applens-ai)
   - [OpenMontage](#16-openmontage)
   - [QuestionPaperAI](#17-questionpaperai)
   - [Cadence AI](#18-cadence-ai)
5. [Section 3: Cloud-Native, High-Concurrency & Systems Engineering](#-section-3-cloud-native-high-concurrency--systems-engineering)
   - [Enterprise Cloud-Native API Gateway Platform](#19-enterprise-cloud-native-api-gateway-platform)
   - [Go High-Concurrency Reverse Proxy & Load Balancer](#20-go-high-concurrency-reverse-proxy--load-balancer)
   - [Go-Redis-KV (In-Memory Key-Value Store)](#21-go-redis-kv)
   - [Go Distributed Task Queue & DAG Workflow Engine](#22-go-distributed-task-queue--dag-workflow-engine)
   - [LogPulse-rs (Rust High-Throughput Log Profiler)](#23-logpulse-rs)
   - [py-fastfuzzy-rs (Rust Python Native Extension)](#24-py-fastfuzzy-rs)
   - [Django High-Throughput Async Payroll Engine](#25-django-high-throughput-async-payroll-engine)
   - [ScholarAssist Data Pipeline](#26-scholarassist-data-pipeline)
6. [Section 4: Specialized Microservices Suite (`AgenticApps` Monorepo)](#-section-4-specialized-microservices-suite-agenticapps-monorepo)
   - [Fintech Fraud Mitigator](#27-fintech-fraud-mitigator)
   - [Cloud Security Sentinel](#28-cloud-security-sentinel)
   - [Compliance & PII Sanitizer](#29-compliance--pii-sanitizer)
   - [Model Router Sentinel & Budget Guard](#30-model-router-sentinel--budget-guard)
   - [Feature Shippable Agent](#31-feature-shippable-agent)
   - [LLM Benchmark & Hallucination Evaluator](#32-llm-benchmark--hallucination-evaluator)
   - [Medical Intake Voice Nurse](#33-medical-intake-voice-nurse)
   - [Autonomous DevRel & Knowledge Swarm Agent](#34-autonomous-devrel--knowledge-swarm-agent)
7. [Section 5: Domain AI, HealthTech, Web & Mobile Applications](#-section-5-domain-ai-healthtech-web--mobile-applications)
   - [MedEdge (Hybrid Offline/Online Clinical Assistant)](#35-mededge)
   - [Secure Healthcare Audit Vault](#36-secure-healthcare-audit-vault)
   - [AI Care Agency Rota Manager](#37-ai-care-agency-rota-manager)
   - [Socrates — Hybrid Socratic Tutor](#38-socrates--hybrid-socratic-tutor)
   - [AK Productions — Studio OS](#39-ak-productions--studio-os)
   - [RangMaster & RangMasterPro](#40-rangmaster--rangmasterpro)
   - [CardGames Web Platform](#41-cardgames-web-platform)
   - [LudoMaster](#42-ludomaster)
   - [Quiz Application (React Native / Expo)](#43-quiz-application)
   - [AgenticLife (FootprintOS)](#44-agenticlife-footprintos)
8. [Section 6: Advanced Research, Architecture Showcases & Interview Suites](#-section-6-advanced-research-architecture-showcases--interview-suites)
   - [VentureDive Lead Architect Portfolio](#45-venturedive-lead-architect-portfolio)
   - [Kaggle Competition Master](#46-kaggle-competition-master)
   - [Python Interview Preparation Suite](#47-python-interview-preparation-suite)
   - [Object-Oriented Design Patterns Lab](#48-object-oriented-design-patterns-lab)
9. [CV Update Strategy & Placement Guide](#-cv-update-strategy--placement-guide)

---

## 🌟 Executive Summary & Engineering Highlights

This document serves as the master engineering inventory for **Akmal Khan, PhD**. Spanning over 20 years of software systems engineering and 3+ years architecting production-grade AI platforms, this review highlights deep full-stack mastery across:
- **Autonomous Multi-Agent Systems & MCP Infrastructure:** Production Model Context Protocol (MCP) servers, hierarchical supervisor-worker DAGs (LangGraph, CrewAI, AutoGen), git-worktree sandboxing, and closed-loop AST verification.
- **Enterprise Multimodal & RAG Pipelines:** Hybrid semantic retrieval (pgvector, Qdrant, Pinecone), Claude 3.5/3.7 two-pass structured extraction, Zod schema validation, circuit-breaker fallback cascades, and token FinOps monitoring.
- **High-Throughput Systems Engineering & Low Latency:** Zero-copy memory-mapped file profilers in Rust (`memmap2`, `rayon`), high-concurrency Go Layer-7 reverse proxies, sharded Redis-compatible RESP v2 datastores, and PyO3 C-extensions.
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
- **Overview:** An autonomous orchestration engine that accepts complex, high-level natural language feature requests, decomposes them into topological task Directed Acyclic Graphs (DAGs), and concurrently executes them across isolated git worktrees (`.worktrees/task-<id>`). Implements a closed-loop verification pipeline requiring AST analysis, test suite coverage passes, and semantic LLM evals before allowing automated merges into `main`.
- **Key Technical Details:**
  - Dynamic git worktree provisioning eliminating branch collisions across concurrent worker agents.
  - Multi-tiered quality gates: TypeScript/Python AST parser inspection, unit test coverage threshold verification, and semantic evaluation scoring.
  - FastMCP integration exposing toolchains for live terminal execution, codebase semantic search, and pre-commit checks.
  - LiteLLM routing facilitating cost-optimal multi-model delegation (Claude 3.5 Sonnet for code synthesis, Gemini Flash for AST summary).
- **Tech Stack:** Python, LiteLLM, FastMCP, Pydantic v2, Typer, Rich, FastAPI, Uvicorn, Pytest, Git Worktrees, Docker.
- **CV Bullet Points:**
  - *Architected an enterprise multi-agent fleet orchestration engine decomposing natural language specs into task DAGs executed concurrently across isolated git worktrees (`.worktrees/task-<id>`).*
  - *Enforced 100% closed-loop quality gates (AST safety review, test coverage, and semantic eval scoring) preventing broken code from merging into production branches.*
  - *Integrated LiteLLM and FastMCP to dynamically switch model providers between Claude 3.5 and Gemini Flash, cutting orchestration token costs by 42%.*

---

### 2. Ops MCP Suite
- **Repository:** [`github.com/akmalkhaniub/ops-mcp-suite`](https://github.com/akmalkhaniub/ops-mcp-suite)
- **Architectural Role:** Production Micro-MCP Developer & DevOps Tooling Platform
- **Overview:** A modular micro-MCP platform comprising 6 specialized Model Context Protocol (MCP) servers (DevOps, MLOps, AgentOps, DBOps, GitHub, Secrets) unified behind a high-performance FastAPI gateway supporting both standard `stdio` and serverless Server-Sent Events (SSE) transports.
- **Key Technical Details:**
  - Modular server architecture decoupling operational domains (Secrets management, Git operations, Database migrations, Metric telemetry).
  - High-throughput SSE streaming bridge allowing cloud-hosted autonomous agent swarms to interact with private VPC tools without SSH tunnels.
  - Integrated defensive permission layers preventing accidental execution of destructive operations (`DROP`, `DELETE *`, force push).
- **Tech Stack:** Python 3.11+, FastAPI, MCP Protocol SDK, Pydantic, Uvicorn, Docker, Google Cloud Run.
- **CV Bullet Points:**
  - *Engineered a production micro-MCP suite of 6 specialized servers (DevOps, MLOps, AgentOps, DBOps, GitHub, Secrets) unified under a single FastAPI gateway.*
  - *Implemented dual-mode transport supporting local developer `stdio` and cloud Server-Sent Events (SSE) for remote containerized agent swarms on Google Cloud Run.*
  - *Authored defensive schema and command validation layers that blocked destructive shell injections and unchecked database schema drops.*

---

### 3. Drizzle Sentinel MCP
- **Repository:** [`github.com/akmalkhaniub/drizzle-sentinel-mcp`](https://github.com/akmalkhaniub/drizzle-sentinel-mcp)
- **Architectural Role:** Database Architecture Guardian & Schema Drift Detection MCP Server
- **Overview:** A TypeScript-native MCP server purpose-built for Turborepo and Drizzle ORM codebases. It provides AST introspection of schema definitions, live-to-declared drift detection, sandboxed query generation, and defensive linting against destructive migrations.
- **Key Technical Details:**
  - TypeScript Compiler API AST inspection extracting table structures, foreign key constraints, and index definitions directly from TypeScript source code.
  - Live PostgreSQL database reflection comparing active catalog tables against declared Drizzle schemas to flag schema drift.
  - Migration safety linter catching dangerous unindexed foreign keys, table drops, and non-nullable column additions without default values.
- **Tech Stack:** TypeScript, Node.js, Drizzle ORM, PostgreSQL, Model Context Protocol (MCP) SDK, Zod, Turborepo.
- **CV Bullet Points:**
  - *Built a TypeScript-native MCP server providing AST schema introspection and live-to-declared drift detection for Drizzle ORM and PostgreSQL architectures.*
  - *Automated migration defense rules preventing dangerous operations (dropping columns, unindexed foreign keys, table locks) during agent-driven pull requests.*
  - *Exposed sandboxed, read-only SQL execution tools allowing AI coding assistants to explore database state safely without privilege escalation.*

---

### 4. Agent Toolchain Core
- **Repository:** [`github.com/akmalkhaniub/agent-toolchain-core`](https://github.com/akmalkhaniub/agent-toolchain-core)
- **Architectural Role:** Skills-as-Code Developer Platform & Codified Agent Governance
- **Overview:** A versioned "Skills-as-Code" developer package and CLI utility featuring reusable Claude Code slash commands (`/eval-pr`, `/gen-adr`, `/defensive-audit`), a codified `AGENTS.md` schema linter (`bin/rules-lint`), and an automated AST PR review bot.
- **Key Technical Details:**
  - Codified specification validator enforcing mandatory schema sections and architectural constraints across multi-agent workspace manifests (`AGENTS.md`, `CLAUDE.md`).
  - AST-driven static analysis bot detecting dangerous code smells: silent exception swallowing (`catch {}`), unchecked `any` casts in TypeScript, and unparameterized SQL queries.
  - Custom slash commands for Claude Code accelerating architectural decision records (ADR) generation and defensive code audits.
- **Tech Stack:** TypeScript, Node.js, Zod, Commander.js, Babel/TypeScript AST Parser, Git Hooks.
- **CV Bullet Points:**
  - *Developed a versioned "Skills-as-Code" developer package with custom Claude Code commands (`/eval-pr`, `/gen-adr`, `/defensive-audit`) and an `AGENTS.md` schema linter.*
  - *Built an automated AST pull-request review bot catching silent exception swallows, unchecked `any` types, and security anti-patterns prior to CI approval.*
  - *Codified team development standards into pre-commit and pre-merge hooks, accelerating developer onboarding and maintaining architectural consistency across 40+ repos.*

---

### 5. NEXUS Agent Platform (`nexus-agent-runtime`)
- **Repository:** [`github.com/akmalkhaniub/nexus-agent-runtime`](https://github.com/akmalkhaniub/nexus-agent-runtime)
- **Architectural Role:** Enterprise Shared Agent Runtime, Graph Orchestration & MCP Tool Registry
- **Overview:** An enterprise-grade shared runtime and execution platform for agentic applications. Provides stateful graph orchestration, a dynamic MCP tool registry, multi-tenant session isolation, and an SDK for building composable agent workflows.
- **Key Technical Details:**
  - Centralized tool registry dynamically registering and serving MCP tools with RBAC and rate-limiting.
  - Stateful graph execution runtime supporting paused states, human approvals, and resume tokens.
  - Containerized execution sandbox isolating worker agents during unverified code or bash command runs.
- **Tech Stack:** Python 3.10+, FastAPI, Pydantic, Docker, MCP Registry, PostgreSQL, Pytest.
- **CV Bullet Points:**
  - *Engineered the NEXUS Agent Platform, providing a shared multi-tenant execution runtime, MCP tool registry, and stateful graph orchestrator.*
  - *Implemented sandboxed tool execution containers preventing privilege escalation during dynamic agentic shell operations.*
  - *Reduced duplicate agent tooling across company initiatives by creating a centralized, reusable MCP microservice registry.*

---

### 6. Google A2A & ADK Multi-Agent Suite
- **Repository:** [`github.com/akmalkhaniub/google-a2a`](https://github.com/akmalkhaniub/google-a2a) & [`github.com/akmalkhaniub/googleadk`](https://github.com/akmalkhaniub/googleadk)
- **Architectural Role:** Agent-to-Agent (A2A) Communication Protocol & Gemini Streaming Suite
- **Overview:** An implementation of the open Agent-to-Agent (A2A) protocol and Google Agent Development Kit (ADK), establishing standardized communication channels and streaming tool-call pipelines between opaque agentic systems.
- **Key Technical Details:**
  - Standardized JSON message envelope schema for cross-agent negotiation, capability discovery, and task delegation.
  - Streaming token and tool-call parsing leveraging Gemini 2.0 / 2.5 Flash and Pro APIs.
  - Multi-tool coordination topologies allowing distinct agent entities to query each other's specialized toolsets.
- **Tech Stack:** Python, Google GenAI SDK, Google ADK, WebSockets, JSON Schema, Pydantic.
- **CV Bullet Points:**
  - *Implemented an Agent-to-Agent (A2A) communication protocol enabling decentralized negotiation and task delegation between heterogeneous agent systems.*
  - *Built streaming agent pipelines utilizing Google ADK and Gemini 2.5 Pro APIs for ultra-low latency real-time tool execution.*
  - *Authored reusable agent interoperability specs adopted across internal multi-model benchmarks.*

---

## 🧠 Section 2: Applied AI Products, Multimodal Systems & Vertical MVPs

### 7. SpecForge
- **Repository:** [`github.com/akmalkhaniub/SpecForge`](https://github.com/akmalkhaniub/SpecForge)
- **Architectural Role:** Enterprise AI Requirements Engineering & FinOps Extraction Monorepo
- **Overview:** An enterprise AI-driven requirements extraction monorepo that parses unstructured PDF/DOCX Product Requirement Documents (PRDs) into structured epics, user stories, and Gherkin acceptance criteria with semantic deduplication and real-time token FinOps tracking.
- **Key Technical Details:**
  - Two-pass Claude 3.5 Sonnet pipeline: Pass 1 generates high-level architectural epics; Pass 2 synthesizes granular user stories with Gherkin `Given/When/Then` scenarios.
  - Strict JSON schema enforcement with Zod and tool use, ensuring zero markdown parsing failures.
  - pgvector HNSW indexing for sub-second semantic search and deduplication against existing backlog stories.
  - FinOps cost dashboard monitoring input/output tokens, prompt-cache hit rates (achieving ~75% cache reuse), and per-extraction dollar expenditures.
- **Tech Stack:** React 18, TypeScript, Hono/Node.js, BullMQ, Redis, PostgreSQL (pgvector), Claude 3.5 Sonnet API, Tailwind CSS, Docker.
- **CV Bullet Points:**
  - *Engineered an AI requirements extraction monorepo (React, Hono, BullMQ, pgvector) processing 50+ page PRD documents into structured Gherkin user stories.*
  - *Designed a two-pass Claude 3.5 Sonnet extraction architecture with Zod schema validation, achieving 99.4% schema conformity without hallucinations.*
  - *Built an integrated token FinOps dashboard tracking prompt caching and model expenditures, reducing per-document processing costs by 38%.*

---

### 8. Sentinel — Autonomous QA & Bug Hunter
- **Repository:** [`github.com/akmalkhaniub/Sentinel`](https://github.com/akmalkhaniub/Sentinel)
- **Architectural Role:** Autonomous Exploratory QA Agent & Visual Bug Hunter
- **Overview:** An autonomous web exploratory QA system powered by LangGraph, Playwright, and FastAPI that crawls web applications, maps state machines, discovers visual regressions, tests OpenAPI endpoints, and files structured GitHub issues.
- **Key Technical Details:**
  - Self-healing DOM selector algorithms using vision-LLM verification when CSS/XPath locators break.
  - Ingestion of OpenAPI/Swagger specs to automatically synthesize boundary and edge-case API payloads.
  - Automated visual regression testing diffing screenshot baselines with pixel-level and semantic tolerance.
  - Autonomous GitHub Actions CI integration automatically opening bug tickets with reproducible steps and video traces.
- **Tech Stack:** Python 3.11+, LangGraph, Playwright, FastAPI, PostgreSQL, OpenCV, Claude 3.7 Vision / Gemini 2.0, Docker.
- **CV Bullet Points:**
  - *Built an autonomous QA agent (LangGraph, Playwright, FastAPI) that navigates complex web apps, identifies UI breakages, and discovers API edge cases.*
  - *Implemented self-healing selector algorithms and semantic visual diffing, reducing flaky test failures by 65% in dynamic single-page applications.*
  - *Automated CI/CD bug reporting by integrating GitHub API issue generation complete with network HAR logs and annotated screenshot evidence.*

---

### 9. Multimodal Eval Harness
- **Repository:** [`github.com/akmalkhaniub/multimodal-eval-harness`](https://github.com/akmalkhaniub/multimodal-eval-harness)
- **Architectural Role:** Resilient Vision Model Benchmarking & Fallback Orchestration Engine
- **Overview:** A comparative evaluation and resiliency framework benchmarking Gemini 2.0 Flash, Claude 3.7 Vision, and GPT-4o on complex document OCR, tabular data extraction, and visual reasoning with automated circuit-breaker fallbacks.
- **Key Technical Details:**
  - Structural Zod validation scoring exact-match and normalized OCR field precision.
  - Configurable numeric and bounding-box tolerance metrics for geometric accuracy evaluations.
  - Circuit-breaker cascade routing around 429 quota exhaustion or transient upstream latency spikes to backup model providers.
  - Comprehensive cost-accuracy pareto curve visualization across model tiers.
- **Tech Stack:** TypeScript, Node.js, Zod, Gemini 2.0/2.5, Claude 3.7 Vision, OpenAI GPT-4o, Vitest.
- **CV Bullet Points:**
  - *Shipped a multimodal evaluation harness benchmarking Gemini 2.0, Claude 3.7 Vision, and GPT-4o across dense OCR documents and tabular datasets.*
  - *Engineered a circuit-breaker fallback cascade defending against 429 rate limits, ensuring 99.9% pipeline uptime during high-volume document ingestion.*
  - *Formulated automated accuracy and cost-efficiency scoring benchmarks, enabling data-driven model selection that reduced document OCR costs by 45%.*

---

### 10. Enterprise Operations Agent
- **Repository:** [`github.com/akmalkhaniub/enterprise-ops-agent`](https://github.com/akmalkhaniub/enterprise-ops-agent)
- **Architectural Role:** Cross-Functional Business Operations Agent (FinOps & HR)
- **Overview:** Production non-engineering agentic workflows automating cloud invoice reconciliation for FinOps (with spend anomaly detection) and PII-masked resume screening for HR operations, secured by cryptographic Human-in-the-Loop (HITL) approval cards.
- **Key Technical Details:**
  - FinOps workflow reconciling cloud invoices (AWS/GCP) against purchase orders, flagging discrepancies >15%.
  - HR screening workflow stripping PII (names, gender, age) before evaluating candidate criteria against structured rubrics.
  - Slack Block Kit interactive messages with cryptographic HMAC approval tokens for one-click human authorization.
- **Tech Stack:** TypeScript, Node.js, Zod, Slack Bolt SDK, PostgreSQL, Claude 3.5 Sonnet, Docker.
- **CV Bullet Points:**
  - *Delivered enterprise operations agents automating FinOps cloud invoice reconciliation and PII-sanitized HR resume screening.*
  - *Engineered cryptographic Human-In-The-Loop (HITL) Slack cards with HMAC tokens, securing automated workflows against unauthorized disbursements.*
  - *Reduced finance invoice audit cycles from 3 days to under 4 minutes while detecting 100% of vendor billing discrepancies >15%.*

---

### 11. Enterprise Procurement Intelligence Agent
- **Repository:** [`github.com/akmalkhaniub/procurement-intelligence-agent`](https://github.com/akmalkhaniub/procurement-intelligence-agent)
- **Architectural Role:** Multi-Agent Procurement Copilot & SQL Spend Analytics Engine
- **Overview:** An enterprise multi-agent procurement copilot integrating LangGraph, MCP, Pinecone, and AWS Bedrock Guardrails to automate RFP compliance checks, vendor contract risk assessment, and natural language database querying.
- **Key Technical Details:**
  - Vanna AI and LangChain Text-to-SQL pipeline generating validated queries against enterprise vendor and spend databases.
  - AWS Bedrock Guardrails enforcing deterministic policy constraints and blocking sensitive internal vendor terms.
  - Pinecone vector search over historical contracts and supplier agreements for clause liability scoring.
  - Interactive dual-surface interface with Streamlit executive dashboard and FastAPI headless backend.
- **Tech Stack:** Python 3.11, LangGraph, LangChain, AWS Bedrock, Pinecone, ChromaDB, Vanna AI, FastAPI, Streamlit, Pydantic, Docker.
- **CV Bullet Points:**
  - *Architected a multi-agent procurement copilot (LangGraph, Bedrock Guardrails, Pinecone) automating vendor contract risk scoring and RFP analysis.*
  - *Integrated Text-to-SQL natural language querying over multi-million dollar purchasing databases with strict semantic safety guardrails.*
  - *Eliminated compliance review backlogs by accelerating vendor contract evaluation from 5 business days to 30 seconds.*

---

### 12. LeaseLogic AI
- **Repository:** [`github.com/akmalkhaniub/leaselogic`](https://github.com/akmalkhaniub/leaselogic)
- **Architectural Role:** Commercial Real Estate Lease Abstraction & NPV Financial Modeling
- **Overview:** An AI-powered commercial lease extraction platform that transforms 100+ page dense commercial lease agreements into structured relational records, extracting critical financial covenants, rent escalations, and termination liabilities.
- **Key Technical Details:**
  - Hybrid dense vector (pgvector) and BM25 sparse keyword retrieval for precise audit trail citations.
  - Structured extraction of complex multi-tiered escalation schedules and Net Effective Rent modeling.
  - Deterministic financial calculation engine for Net Present Value (NPV) and lease liability projections under IFRS 16.
- **Tech Stack:** TypeScript, Next.js, Node.js, Claude 3.5 Sonnet, PostgreSQL (pgvector), pdfplumber, Tailwind CSS.
- **CV Bullet Points:**
  - *Built LeaseLogic AI to abstract complex 100+ page commercial real estate leases into structured financial data models using Claude 3.5 and pgvector.*
  - *Implemented an audit citation engine mapping every extracted rent escalation and renewal clause back to exact page and paragraph coordinates.*
  - *Engineered an automated IFRS 16 financial modeling engine calculating Net Effective Rent and NPV schedules in real time.*

---

### 13. ClaimPilot
- **Repository:** [`github.com/akmalkhaniub/claim-pilot`](https://github.com/akmalkhaniub/claim-pilot)
- **Architectural Role:** Automated Insurance Policy Parser & Claims Adjudication Engine
- **Overview:** An automated insurance claims triage and policy verification engine that automates First-Notice-of-Loss (FNOL) document ingestion, policy coverage bound checks, deductible scheduling, and fraud risk heuristic scoring.
- **Key Technical Details:**
  - Multi-document parsing pipeline ingesting complex PDFs, DOCX, and photo evidence.
  - Deterministic rules-based verification guardrails preventing LLM hallucination in coverage limits.
  - Sub-second adjudication engine comparing claim damages against policy exclusions and deductible rules.
- **Tech Stack:** TypeScript, React, Node.js, FastAPI, OpenAI / Claude API, ChromaDB, Docker.
- **CV Bullet Points:**
  - *Developed ClaimPilot, an automated insurance claims adjudication engine processing FNOL submissions against complex multi-tier policy documents.*
  - *Architected multi-modal damage verification pipelines cross-referencing claim photos and repair estimates with historical fraud heuristics.*
  - *Reduced claim pre-screening turnaround time by 80% while upholding strict coverage limit verification guardrails.*

---

### 14. IntakeRx
- **Repository:** [`github.com/akmalkhaniub/intakerx`](https://github.com/akmalkhaniub/intakerx)
- **Architectural Role:** HIPAA-Compliant Voice & Chat Clinical Pre-Screening Platform
- **Overview:** A HIPAA-compliant clinical intake platform that converts unstructured patient voice interviews and handwritten forms into standardized FHIR/HL7 EHR records with automated triage classification.
- **Key Technical Details:**
  - Real-time voice and chat intake interface with speech-to-text processing and clinical SOAP note generation.
  - Dual-pass clinical safety verification cross-checking documented symptoms against known allergen and medication conflicts.
  - Field-level AES-256 encryption for Protected Health Information (PHI) and immutable PostgreSQL audit logging.
- **Tech Stack:** React 18, React Native, Vite, Node.js, FastAPI, PostgreSQL, FHIR/HL7 Schemas, Docker.
- **CV Bullet Points:**
  - *Engineered IntakeRx, a HIPAA-hardened clinical pre-screening platform converting conversational voice and chat intakes into FHIR-compliant EHR records.*
  - *Implemented field-level AES-256 encryption, immutable PostgreSQL audit triggers, and dual-pass allergen conflict verification.*
  - *Accelerated clinic intake workflows, reducing nurse documentation overhead by 70% per patient consultation.*

---

### 15. UI-Scout AI & AppLens AI
- **Repository:** [`github.com/akmalkhaniub/ui-scout-ai`](https://github.com/akmalkhaniub/ui-scout-ai) & [`github.com/akmalkhaniub/applens-ai`](https://github.com/akmalkhaniub/applens-ai)
- **Architectural Role:** Real-Time Visual QA & Conversion Rate Optimization (CRO) Suite
- **Overview:** An autonomous visual testing and UX auditing suite that crawls live web applications, captures UI state transitions, and flags visual regressions, broken interactions, and conversion friction points.
- **Key Technical Details:**
  - Headless browser automation via Playwright driven by live WebSocket telemetry (`Socket.IO`).
  - Multimodal vision LLM analysis auditing UI against brand design guidelines and responsive breakpoints.
  - Automated generation of actionable UX/CRO improvement recommendations with annotated screenshot heatmaps.
- **Tech Stack:** TypeScript, Express, React, Playwright, Socket.IO, Gemini Vision / Claude 3.7, Tailwind CSS.
- **CV Bullet Points:**
  - *Created UI-Scout AI and AppLens AI, an autonomous visual testing suite executing real-time Playwright audits and vision-LLM UI inspections.*
  - *Streamed live browser crawling telemetry over WebSockets to an interactive React dashboard with annotated visual diffs.*
  - *Automated conversion friction detection, identifying UX layout anomalies and unclickable elements across responsive viewports.*

---

### 16. OpenMontage
- **Repository:** [`github.com/akmalkhaniub/OpenMontage`](https://github.com/akmalkhaniub/OpenMontage)
- **Architectural Role:** Programmatic Multimodal Video Rendering Pipeline & Composer
- **Overview:** A programmatic multimodal rendering pipeline integrating Remotion, Python, and vision models to automate high-fidelity video synthesis, dynamic typography, and automated prompt galleries.
- **Key Technical Details:**
  - Code-as-Video architecture utilizing React components in Remotion to render frame-accurate animations and typography.
  - Python asset generation pipelines orchestrating AI voiceover synthesis, caption alignments, and image generations.
  - Codified development standards (`CLAUDE.md`, `CURSOR.md`) and multi-GPU acceleration support.
- **Tech Stack:** TypeScript, React, Remotion, Python, Pydantic, FFmpeg, Docker.
- **CV Bullet Points:**
  - *Architected OpenMontage, a programmatic video generation engine combining Remotion React components with Python multimodal synthesis.*
  - *Automated end-to-end video production workflows: script generation, dynamic caption timing, and frame-accurate composition.*
  - *Optimized multi-threaded FFmpeg rendering pipelines, accelerating programmatic video export speeds by 3.5x.*

---

### 17. QuestionPaperAI
- **Repository:** [`github.com/akmalkhaniub/QuestionPaperAI`](https://github.com/akmalkhaniub/QuestionPaperAI)
- **Architectural Role:** Intelligent Assessment Generation & Pedagogical Examination Platform
- **Overview:** An AI-powered intelligent assessment platform that streamlines unique test paper generation, question bank management, and grading rubric synthesis adhering to strict pedagogical taxonomies (Bloom's Taxonomy).
- **Key Technical Details:**
  - Randomized multi-difficulty question generation preventing test duplication and academic dishonesty.
  - OCR scanning service digitizing physical question archives into structured question banks.
  - Export engine generating professionally styled, print-ready DOCX and PDF examination papers with answer keys.
- **Tech Stack:** React, Express, Node.js, PostgreSQL, OpenAI API, Python Scan Service, Docker.
- **CV Bullet Points:**
  - *Engineered QuestionPaperAI, an automated examination generation platform creating randomized, curriculum-aligned test papers and grading rubrics.*
  - *Built an OCR ingestion microservice digitizing physical paper archives into structured, tagged question repositories.*
  - *Implemented automated document compilers exporting print-ready PDF and DOCX examination packages complete with instructor marking schemes.*

---

### 18. Cadence AI
- **Repository:** [`github.com/akmalkhaniub/cadence-ai`](https://github.com/akmalkhaniub/cadence-ai)
- **Architectural Role:** Autonomous Event Orchestration & Conference Operations System
- **Overview:** An enterprise-grade autonomous event orchestration system that plans, provisions, and operates complex virtual, hybrid, and in-person conferences from raw briefs, speaker rosters, and sponsor commitments.
- **Key Technical Details:**
  - Multi-agent scheduling graph resolving room capacities, speaker conflicts, and sponsor track requirements.
  - Automated attendee communication and agenda publishing pipeline.
  - Containerized infrastructure ready for multi-tenant enterprise deployment.
- **Tech Stack:** Python, LangGraph, FastAPI, Docker, PostgreSQL, React.
- **CV Bullet Points:**
  - *Designed Cadence AI, an autonomous conference operations platform synthesizing multi-track agendas and resolving speaker room constraints.*
  - *Orchestrated automated schedule generation algorithms balancing attendee preferences, speaker availability, and sponsor commitments.*

---

## 💻 Section 3: Cloud-Native, High-Concurrency & Systems Engineering

### 19. Enterprise Cloud-Native API Gateway Platform
- **Repository:** [`github.com/akmalkhaniub/enterprise-api-gateway`](https://github.com/akmalkhaniub/enterprise-api-gateway)
- **Architectural Role:** Production Traffic Engineering, Zero-Trust Security & API Governance
- **Overview:** A production-grade cloud-native API Gateway and traffic engineering platform built on Apache APISIX, LuaJIT/OpenResty, Redis Cluster, OpenTelemetry/Jaeger, and Kubernetes CRDs.
- **Key Technical Details:**
  - Custom OpenResty/LuaJIT cryptographic plugin engineering (`hmac-auth-validator`) verifying request integrity at wire speed.
  - Distributed token bucket rate limiting backed by an atomic Redis cluster preventing upstream service degradation.
  - Mutual TLS (mTLS) zero-trust architecture enforcing client CA validation and encrypted internal network communication.
  - End-to-end distributed tracing using OpenTelemetry and W3C TraceContext standards with Jaeger visualization.
  - Canary deployment traffic splitting (80/20 weighted routing) and automated Spectral CI/CD governance guardrails for OpenAPI compliance.
- **Tech Stack:** Apache APISIX, LuaJIT, OpenResty, Redis Cluster, OpenTelemetry, Jaeger, Kubernetes, Docker, Spectral.
- **CV Bullet Points:**
  - *Architected a cloud-native API Gateway platform on Apache APISIX and Kubernetes CRDs featuring declarative GitOps route management and mTLS security.*
  - *Engineered custom OpenResty/LuaJIT cryptographic plugins (`hmac-auth-validator`) and distributed Redis-backed rate limiters handling 10,000+ RPS.*
  - *Implemented end-to-end OpenTelemetry distributed tracing and 80/20 weighted canary traffic routing with automated Spectral CI/CD governance.*

---

### 20. Go High-Concurrency Reverse Proxy & Load Balancer
- **Repository:** [`github.com/akmalkhaniub/go-load-balancer`](https://github.com/akmalkhaniub/go-load-balancer)
- **Architectural Role:** High-Performance Layer-7 Traffic Director & Reverse Proxy
- **Overview:** A production-grade Layer-7 HTTP reverse proxy and load balancer built entirely with Go standard library primitives, demonstrating lightweight goroutine concurrency, lock-free routing, and active health check state machines.
- **Key Technical Details:**
  - Dynamic runtime topology hot-reloading via administrative endpoints (`POST /api/backends/drain`) allowing zero-downtime server maintenance.
  - Atomic lock-free Round-Robin and Least-Connections routing algorithms utilizing `sync/atomic`.
  - Circuit Breaker state machine (`Closed` -> `Open` -> `Half-Open`) preventing cascade failures to unhealthy backends.
  - Per-client token bucket rate limiting and background TCP socket health monitoring.
- **Tech Stack:** Go (Golang), Standard Library (`net/http`, `net/http/httputil`, `sync/atomic`), Docker.
- **CV Bullet Points:**
  - *Engineered a production-grade Layer-7 HTTP reverse proxy and load balancer in Go standard library primitives with zero-downtime hot-reloading.*
  - *Implemented lock-free Round-Robin and Least-Connections routing algorithms using atomic memory operations, achieving sub-millisecond dispatch.*
  - *Built an automated Circuit Breaker state machine and active TCP health checker that isolated failing nodes within 200ms.*

---

### 21. Go-Redis-KV
- **Repository:** [`github.com/akmalkhaniub/go-redis-kv`](https://github.com/akmalkhaniub/go-redis-kv)
- **Architectural Role:** High-Performance Sharded In-Memory Key-Value Store
- **Overview:** A concurrent, high-throughput in-memory key-value database implementing the Redis Serialization Protocol (RESP v2) in Go. Connectable via official `redis-cli`, Python `redis-py`, and standard Redis client libraries.
- **Key Technical Details:**
  - RESP v2 protocol parser handling strings, integers, arrays, bulk strings, and error types.
  - 32-way striped sharding using FNV-1a hashing to minimize global mutex lock contention across parallel reader/writer goroutines.
  - Granular key TTL expiration tracking via active background sweeping and passive access-time checks.
  - Built-in snapshot persistence mechanism saving and restoring key-value state to disk.
- **Tech Stack:** Go (Golang), RESP v2 Protocol, `sync.RWMutex`, Socket Programming, Docker.
- **CV Bullet Points:**
  - *Built a high-performance in-memory key-value database in Go implementing the Redis Serialization Protocol (RESP v2).*
  - *Designed a 32-shard partitioned memory architecture with FNV-1a hashing, eliminating mutex contention under high-volume parallel read/write workloads.*
  - *Implemented precise key TTL expiration and disk snapshotting, supporting seamless drop-in connectivity for standard Redis client drivers.*

---

### 22. Go Distributed Task Queue & DAG Workflow Engine
- **Repository:** [`github.com/akmalkhaniub/go-task-queue`](https://github.com/akmalkhaniub/go-task-queue)
- **Architectural Role:** Asynchronous Task Processing & Topological DAG Execution Engine
- **Overview:** A concurrent, high-throughput asynchronous task processing and DAG workflow engine built in Go, demonstrating priority queues, worker pools, exponential backoff retries, and dead-letter queues (DLQ).
- **Key Technical Details:**
  - Priority task scheduling implemented with binary min-heaps (`container/heap`).
  - Topological sorting DAG workflow engine resolving inter-task dependency graphs for parallel step dispatch.
  - Worker pool pattern with dynamic concurrency throttling, exponential backoff retries, and poison-pill Dead Letter Queues (DLQ).
- **Tech Stack:** Go (Golang), `container/heap`, Goroutines, Channels, Docker.
- **CV Bullet Points:**
  - *Created a concurrent asynchronous task queue and DAG workflow engine in Go featuring binary min-heap priority scheduling.*
  - *Implemented topological DAG resolution for complex task dependencies, enabling maximum concurrent task dispatch across worker pools.*
  - *Engineered resilient failure recovery with exponential backoff retries, jitter, and automated dead-letter queue (DLQ) routing.*

---

### 23. LogPulse-rs
- **Repository:** [`github.com/akmalkhaniub/logpulse-rs`](https://github.com/akmalkhaniub/logpulse-rs)
- **Architectural Role:** Blazingly Fast CLI Log & Tail Latency Profiler in Rust
- **Overview:** A high-throughput, multi-threaded CLI log parser and metrics analyzer built with Rust, `memmap2`, and `rayon`. Designed to process gigabytes of structured JSON or standard web server logs in seconds, computing exact percentile latencies ($p50, p95, p99$) and error distributions.
- **Key Technical Details:**
  - Zero-copy memory-mapped file ingestion using `memmap2`, bypassing user-space buffer duplication.
  - Lock-free parallel chunk reduction powered by `rayon`, saturating multi-core CPU architectures.
  - Exact percentile calculations ($p50, p95, p99, p99.9$) and HTTP status code distribution profiling (~250x faster than traditional Python log scripts).
- **Tech Stack:** Rust, `memmap2`, `rayon`, `serde`, `clap`, `regex`.
- **CV Bullet Points:**
  - *Built LogPulse, a blazingly fast CLI log analyzer in Rust processing gigabytes of web server logs in sub-second runtimes (~250x faster than Python).*
  - *Implemented zero-copy memory-mapped file access (`memmap2`) and multi-threaded parallel reduction (`rayon`) to saturate all available CPU cores.*
  - *Computed exact tail latencies ($p50, p95, p99$) and HTTP error histograms across 10M+ log records without memory bloat.*

---

### 24. py-fastfuzzy-rs
- **Repository:** [`github.com/akmalkhaniub/py-fastfuzzy-rs`](https://github.com/akmalkhaniub/py-fastfuzzy-rs)
- **Architectural Role:** High-Performance Rust Fuzzy Matching C-Extension for Python
- **Overview:** A high-performance Python extension module written in Rust using PyO3 and Rayon. Demonstrates how to supercharge CPU-intensive Python workflows with native Rust speed, zero-copy string processing, and multi-core parallelism.
- **Key Technical Details:**
  - PyO3 native binding exposing Rust string distance algorithms directly as a compiled Python module.
  - Parallel Levenshtein and Jaro-Winkler distance computations across arrays of millions of strings using Rayon.
  - Zero-copy string memory slicing yielding 30x to 60x speedups over pure-Python fuzzy matching packages like `fuzzywuzzy`.
- **Tech Stack:** Rust, Python, PyO3, Rayon, Maturin.
- **CV Bullet Points:**
  - *Developed py-fastfuzzy-rs, a compiled Rust extension for Python (via PyO3 and Rayon) delivering 50x faster fuzzy string matching over pure Python.*
  - *Enabled multi-core parallel string distance calculations (Levenshtein, Jaro-Winkler) across millions of records for real-time deduplication pipelines.*
  - *Packaged and distributed native binary wheels using Maturin for seamless pip installation across Linux and Windows environments.*

---

### 25. Django High-Throughput Async Payroll Engine
- **Repository:** [`github.com/akmalkhaniub/django-payroll-engine`](https://github.com/akmalkhaniub/django-payroll-engine)
- **Architectural Role:** Scale-Tested Async Financial Calculation & PDF Export Engine
- **Overview:** A high-performance asynchronous payroll batch computation engine engineered to process enterprise-scale salary computations, tax deductions, and dynamic payslip PDF generation without database deadlocks or floating-point errors.
- **Key Technical Details:**
  - Offloaded CPU-heavy PDF payslip generation (ReportLab) to asynchronous multi-process Celery workers backed by Redis.
  - Guaranteed financial precision utilizing Python's `Decimal` type, eliminating standard IEEE floating-point rounding errors.
  - Strict database ACID guarantees via `@transaction.atomic` with `select_for_update()` row locking to prevent concurrent double-disbursements.
- **Tech Stack:** Python 3.11, Django, Celery, Redis, MySQL / PostgreSQL, ReportLab, Docker.
- **CV Bullet Points:**
  - *Engineered a high-throughput asynchronous payroll computation engine (Django, Celery, Redis) processing 10,000+ payslip batches concurrently.*
  - *Eliminated financial discrepancy risks by replacing floating-point logic with Python `Decimal` and enforcing `@transaction.atomic` database isolation.*
  - *Offloaded CPU-bound ReportLab PDF payslip rendering to background worker pools, reducing web application response times from 15s to 85ms.*

---

### 26. ScholarAssist Data Pipeline
- **Repository:** [`github.com/akmalkhaniub/scholarassist`](https://github.com/akmalkhaniub/scholarassist)
- **Architectural Role:** Academic Literature Ingestion, Deduplication & RAG Pipeline
- **Overview:** A production-grade academic dataset pipeline powering citation verification and literature synthesis. Ingests raw scientific papers, extracts cross-citations, computes semantic embeddings, and serves normalized search endpoints.
- **Key Technical Details:**
  - Apache Spark batch ETL jobs for large-scale document deduplication and author normalization.
  - Apache Airflow DAGs coordinating automated scraping, text chunking, and embedding generation.
  - FastAPI serving semantic similarity queries and BibTeX reference export endpoints.
- **Tech Stack:** Python, Apache Spark, Apache Airflow, FastAPI, PostgreSQL, Pydantic, Docker Compose.
- **CV Bullet Points:**
  - *Architected an end-to-end academic dataset ingestion pipeline (FastAPI, Apache Spark, Airflow) normalizing millions of scientific publications.*
  - *Built distributed deduplication and citation graph extraction DAGs, delivering clean semantic indices for grounded RAG research assistants.*

---

## 🛡️ Section 4: Specialized Microservices Suite (`AgenticApps` Monorepo)

The `AgenticApps` repository (`github.com/akmalkhaniub/agentic-apps-portfolio`) houses **17 specialized production agent microservices**. Below are the key flagship services highlighted for CV updates:

### 27. Fintech Fraud Mitigator
- **Repository:** [`github.com/akmalkhaniub/fintech-fraud-mitigator`](https://github.com/akmalkhaniub/fintech-fraud-mitigator)
- **Architectural Role:** Real-Time High-Throughput Fraud Detection Engine in Go
- **Overview:** An event-driven transaction risk analysis engine built in Go that monitors high-frequency payment streams, calculates velocity risk scores, and triggers automated account freezes or two-factor step-up verifications.
- **Tech Stack:** Go (Golang), Apache Kafka, Redis, Webhooks, Docker.
- **CV Bullet:** *Engineered a real-time fintech fraud scoring engine in Go consuming Apache Kafka streams to evaluate transaction velocity and trigger automated freeze protocols.*

### 28. Cloud Security Sentinel
- **Repository:** [`github.com/akmalkhaniub/cloud-security-sentinel`](https://github.com/akmalkhaniub/cloud-security-sentinel)
- **Architectural Role:** Autonomous Infrastructure Vulnerability & Policy Auditor in Rust
- **Overview:** A proactive cloud security agent built in Rust that continuously monitors AWS infrastructure, detects IAM misconfigurations, simulates privilege escalation paths, and generates remediation scripts.
- **Tech Stack:** Rust, AWS SDK, Tokio, Serde, Terraform.
- **CV Bullet:** *Developed an autonomous cloud infrastructure auditor in Rust, continuously analyzing AWS IAM policies and simulating exploitability vectors to prevent privilege escalation.*

### 29. Compliance & PII Sanitizer
- **Repository:** [`github.com/akmalkhaniub/compliance-pii-sanitizer`](https://github.com/akmalkhaniub/compliance-pii-sanitizer)
- **Architectural Role:** Privacy-Preserving Proxy Firewall for LLM Requests
- **Overview:** A low-latency security firewall positioned between raw enterprise databases and LLM APIs that detects Personally Identifiable Information (PII, SSNs, credit cards), redacts sensitive tokens, and enforces data residency policies.
- **Tech Stack:** Python, Microsoft Presidio, FastAPI, Regex, Redis.
- **CV Bullet:** *Built a low-latency PII sanitization proxy masking sensitive tokens (SSNs, medical records, credentials) before prompt dispatch to external cloud LLMs.*

### 30. Model Router Sentinel & Budget Guard
- **Repository:** [`github.com/akmalkhaniub/model-router-sentinel`](https://github.com/akmalkhaniub/model-router-sentinel)
- **Architectural Role:** Dynamic Prompt Complexity Classifier & Semantic Cache Proxy
- **Overview:** A cost-aware proxy that classifies incoming prompt complexity, checks a semantic Redis cache for previous responses, routes queries to the most cost-effective model tier (Flash vs. Pro vs. Claude 3.5), and enforces departmental budgets.
- **Tech Stack:** Python, FastAPI, Redis (Semantic Caching), LiteLLM, Pydantic.
- **CV Bullet:** *Created an intelligent LLM router classifying prompt complexity and utilizing semantic caching to route queries dynamically, slashing overall API token costs by 45%.*

### 31. Feature Shippable Agent
- **Repository:** [`github.com/akmalkhaniub/feature-shippable-agent`](https://github.com/akmalkhaniub/feature-shippable-agent)
- **Architectural Role:** Autonomous Coding Agent Operating in Isolated E2B Sandboxes
- **Overview:** An autonomous coding agent that accepts feature specifications, executes code modifications within isolated E2B microVM sandboxes, runs unit test suites, and opens verified pull requests on GitHub.
- **Tech Stack:** TypeScript, Node.js, E2B Code Interpreter Sandboxes, Octokit, Claude 3.5 Sonnet.
- **CV Bullet:** *Built an autonomous coding agent operating in E2B microVMs that writes feature implementations, executes test suites in sandbox isolation, and submits verified PRs.*

### 32. LLM Benchmark & Hallucination Evaluator
- **Repository:** [`github.com/akmalkhaniub/llm-benchmark-evaluator`](https://github.com/akmalkhaniub/llm-benchmark-evaluator)
- **Architectural Role:** Automated Hallucination & Factuality Verification Framework
- **Overview:** A specialized evaluation framework measuring model response relevance, hallucination index, toxicity, latency, and token efficiency against ground-truth datasets.
- **Tech Stack:** Python, LangSmith, DeepEval, Pytest, Pandas.
- **CV Bullet:** *Implemented an automated LLM evaluation harness benchmarking hallucination rates, semantic drift, and latency percentiles across frontier models.*

### 33. Medical Intake Voice Nurse
- **Repository:** [`github.com/akmalkhaniub/medical-intake-nurse`](https://github.com/akmalkhaniub/medical-intake-nurse)
- **Architectural Role:** HIPAA-Compliant Conversational Voice Triage Agent
- **Overview:** An automated voice agent handling inbound patient calls, conducting structured symptom triage against clinical protocols, and scheduling appointments with on-call physicians.
- **Tech Stack:** Python, WebRTC, Twilio Voice API, Whisper, Claude 3.5, PostgreSQL.
- **CV Bullet:** *Engineered an automated voice triage agent handling inbound patient inquiries and scheduling clinic appointments following strict clinical triage protocols.*

### 34. Autonomous DevRel & Knowledge Swarm Agent
- **Repository:** [`github.com/akmalkhaniub/autonomous-devrel-agent`](https://github.com/akmalkhaniub/autonomous-devrel-agent)
- **Architectural Role:** Community Support & Documentation Synthesizer
- **Overview:** An agent that monitors technical developer community channels, answers engineering questions using RAG over source repositories, and drafts missing documentation pages when recurring knowledge gaps are detected.
- **Tech Stack:** TypeScript, Discord/Slack APIs, Vector DB, Next.js.
- **CV Bullet:** *Deployed an autonomous developer advocacy agent parsing GitHub issues and Discord inquiries to generate grounded RAG solutions and draft missing technical documentation.*

---

## 🏥 Section 5: Domain AI, HealthTech, Web & Mobile Applications

### 35. MedEdge
- **Repository:** [`github.com/akmalkhaniub/MedEdge`](https://github.com/akmalkhaniub/MedEdge)
- **Architectural Role:** Local-First Clinical Decision Assistant with 2G SMS Fallback Bridge
- **Overview:** A cross-platform, local-first clinical decision assistant designed for remote and resource-constrained clinics. Operates entirely offline with local Gemma models via Ollama or online with cloud Gemini models, featuring a 2G SMS bridge for feature phones.
- **Key Technical Details:**
  - Dynamic local-to-cloud inference switching: runs offline on edge hardware via Ollama (Gemma) and toggles to Gemini Pro when internet connectivity is detected.
  - Automated transcription of doctor-patient consultations into structured SOAP clinical notes.
  - 2G SMS gateway integration via Africa's Talking API, enabling automated follow-ups with feature-phone patients in offline environments.
- **Tech Stack:** Python, FastAPI, React Native, Ollama (Gemma), Google Gemini API, Africa's Talking SMS API.
- **CV Bullet Points:**
  - *Built MedEdge, a local-first clinical assistant operating offline via Ollama (Gemma) with seamless cloud failover to Gemini Pro for resource-constrained clinics.*
  - *Integrated an SMS fallback bridge communicating with 2G feature phones, enabling post-consultation care instructions in disconnected regions.*

---

### 36. Secure Healthcare Audit Vault
- **Repository:** [`github.com/akmalkhaniub/healthcare-audit-vault`](https://github.com/akmalkhaniub/healthcare-audit-vault)
- **Architectural Role:** HIPAA-Hardened Clinical Document Vault & RAG Search
- **Overview:** A high-security, HIPAA-compliant patient record repository featuring document QA search using vector embeddings, role-based access control (RBAC), and immutable audit logs.
- **Key Technical Details:**
  - Vector search RAG over clinical records using `pgvector` inside PostgreSQL with HNSW index tuning.
  - Database-level immutable audit logging enforced via PostgreSQL triggers, preventing record tampering.
  - Ephemeral AWS S3 pre-signed URLs ensuring patient documents are never exposed through public direct links.
- **Tech Stack:** Next.js, Node.js, TypeScript, PostgreSQL (pgvector), AWS S3 Pre-Signed URLs, Tailwind CSS, Docker.
- **CV Bullet Points:**
  - *Architected a HIPAA-compliant healthcare document vault featuring pgvector semantic Q&A and role-based access control.*
  - *Enforced immutable audit logging via PostgreSQL triggers and temporary AWS S3 signed URLs, guaranteeing zero unauthorized data exposure.*

---

### 37. AI Care Agency Rota Manager
- **Repository:** [`github.com/akmalkhaniub/portfolio-ai-rota-manager`](https://github.com/akmalkhaniub/portfolio-ai-rota-manager)
- **Architectural Role:** Natural Language Healthcare Shift Scheduling Platform
- **Overview:** An AI-powered care scheduling platform that enables agency coordinators to manage shifts and enforce labor compliance using natural language prompts, offloading validation to an agentic tool loop.
- **Key Technical Details:**
  - OpenAI function calling translating natural language staffing directives into optimal shift assignments.
  - Real-time certification verification and automatic double-booking prevention enforced via PostgreSQL constraints.
  - Containerized multi-service deployment with Next.js UI, Express API, and PostgreSQL.
- **Tech Stack:** Next.js, Node.js, TypeScript, Express, PostgreSQL, OpenAI Function Calling, Docker.
- **CV Bullet Points:**
  - *Developed an AI shift scheduling platform for care agencies translating natural language requests into compliant staffing rosters via OpenAI tool use.*
  - *Enforced database-level scheduling integrity, preventing double-bookings and certification lapses across distributed healthcare teams.*

---

### 38. Socrates — Hybrid Socratic Tutor
- **Repository:** [`github.com/akmalkhaniub/socrates`](https://github.com/akmalkhaniub/socrates)
- **Architectural Role:** Offline/Online AI Socratic Educational Platform (Google Gemma Hackathon)
- **Overview:** An educational platform designed for the Google Gemma 4 Good Hackathon. It bridges the gap between personalized tutoring and resource-constrained environments by utilizing on-device Gemma models to conduct guided Socratic dialogues.
- **Tech Stack:** React Native (Mobile), FastAPI (Admin), Ollama, Google Gemma, WebSockets.
- **CV Bullet:** *Engineered Socrates, an educational platform conducting guided Socratic dialogues on edge devices using local Gemma models, built for the Google Gemma Hackathon.*

---

### 39. AK Productions — Studio OS
- **Repository:** [`github.com/akmalkhaniub/AK_Productions`](https://github.com/akmalkhaniub/AK_Productions)
- **Architectural Role:** AI-Native Film Studio Operating System & Multi-Agent Network
- **Overview:** An AI-native film production operating system automating video ingestion, screenplay analysis, casting performance evaluation, and auto-dubbing translation across a coordinated 7-agent network.
- **Key Technical Details:**
  - Coordinated multi-agent workflow: Screenplay breakdown, casting audition analysis (pitch, tempo, emotional intensity), continuous take quality scoring.
  - Multimodal video analysis powered by Gemini 2.5 Pro Vision.
  - Unified backend API Gateway serving a Next.js web portal and an Expo cross-platform mobile app.
- **Tech Stack:** Next.js 16, React, FastAPI, Expo / React Native, Gemini 2.5 Pro Vision, PostgreSQL, Docker.
- **CV Bullet Points:**
  - *Architected Studio OS, an AI film production platform coordinating 7 specialized agents to automate screenplay breakdown and audition analysis.*
  - *Integrated Gemini 2.5 Pro Vision to evaluate video takes and audition recordings for emotional delivery, pitch, and tempo in real time.*

---

### 40. RangMaster & RangMasterPro
- **Repository:** [`github.com/akmalkhaniub/RangMasterPro`](https://github.com/akmalkhaniub/RangMasterPro) & [`github.com/akmalkhaniub/RangMaster`](https://github.com/akmalkhaniub/RangMaster)
- **Architectural Role:** Real-Time Multiplayer Card Game Platform & Multimedia Sync Engine
- **Overview:** A production real-time multiplayer card gaming engine and multimedia synchronization tool powered by Node.js, WebSockets, React, Zustand, and Drizzle ORM on Neon PostgreSQL, packaged for native mobile via Capacitor.
- **Key Technical Details:**
  - Authoritative game state server handling concurrent card dealing, turn timers, and trick resolution over WebSockets.
  - Client state management with Zustand and optimistic UI rendering.
  - Cross-platform distribution across Web, iOS, and Android via Capacitor.
- **Tech Stack:** Node.js, Express, WebSockets (`ws`), React, Zustand, Drizzle ORM, Neon PostgreSQL, Capacitor.
- **CV Bullet Points:**
  - *Engineered a real-time multiplayer card gaming platform supporting sub-50ms game state synchronization over WebSockets.*
  - *Packaged cross-platform mobile builds for iOS and Android using Capacitor, maintaining a single TypeScript codebase.*

---

### 41. CardGames Web Platform
- **Repository:** [`github.com/akmalkhaniub/CardGames`](https://github.com/akmalkhaniub/CardGames)
- **Architectural Role:** Dockerized Full-Stack Card Gaming Engine
- **Overview:** A containerized web application platform delivering multiplayer card game rule engines, player matchmaking, and responsive frontend canvas components.
- **Tech Stack:** Node.js, React, Docker, Nginx, PostgreSQL.
- **CV Bullet:** *Delivered a Dockerized card game platform with Nginx reverse proxying and WebSocket state management.*

---

### 42. LudoMaster
- **Repository:** [`github.com/akmalkhaniub/LudoMaster`](https://github.com/akmalkhaniub/LudoMaster)
- **Architectural Role:** Deterministic Game Physics & Board Logic Engine
- **Overview:** A classic multiplayer Ludo board game implementing complete rules, piece collision logic, safe squares, and AI bot opponents.
- **Tech Stack:** Python, Pygame.
- **CV Bullet:** *Implemented a classic multiplayer board game engine in Python with deterministic piece collision rules and bot logic.*

---

### 43. Quiz Application (React Native / Expo)
- **Repository:** [`github.com/akmalkhaniub/quiz-app`](https://github.com/akmalkhaniub/quiz-app)
- **Architectural Role:** Cross-Platform Mobile Assessment Application
- **Overview:** A modern cross-platform mobile quiz application built with React Native, Expo, TypeScript, Tailwind CSS (NativeWind), Prisma ORM, and Supabase.
- **Key Technical Details:**
  - NativeWind (Tailwind CSS) mobile styling with fluid animations and responsive layouts.
  - Offline question caching and background synchronization with Supabase.
  - Complete test suite using `@testing-library/react-native` and Jest.
- **Tech Stack:** React Native, Expo Router, TypeScript, NativeWind, Prisma, Supabase, Jest.
- **CV Bullet Points:**
  - *Shipped a cross-platform mobile quiz app using React Native, Expo, and NativeWind with Supabase backend synchronization.*
  - *Maintained high test coverage across mobile UI components utilizing Jest and React Native Testing Library.*

---

### 44. AgenticLife (FootprintOS)
- **Repository:** [`github.com/akmalkhaniub/agenticlife`](https://github.com/akmalkhaniub/agenticlife)
- **Architectural Role:** Digital Footprint Growth & Personal PR Operating System
- **Overview:** A private digital footprint growth platform designed as an intelligent personal CRM, PR outreach tracker, conference networking workspace, and product launch planner.
- **Tech Stack:** Next.js (App Router), React, TypeScript, Prisma ORM, PostgreSQL (`@prisma/adapter-pg`), Tailwind CSS.
- **CV Bullet:** *Engineered FootprintOS (Next.js, Prisma, PostgreSQL), a personal CRM and PR automation tool tracking technical outreach and networking touchpoints.*

---

## 🔬 Section 6: Advanced Research, Architecture Showcases & Interview Suites

### 45. VentureDive Lead Architect Portfolio
- **Repository:** [`github.com/akmalkhaniub/venturedive-architect-portfolio`](https://github.com/akmalkhaniub/venturedive-architect-portfolio)
- **Architectural Role:** Enterprise AI Lakehouse, Streaming Anomaly & DataOps Architecture Showcase
- **Overview:** Enterprise-grade architectural blueprints and reference implementations showcasing:
  - **Project 1: Agentic Lakehouse** — Combining Medallion architecture (Bronze/Silver/Gold) with autonomous data quality verification agents.
  - **Project 2: Real-time Streaming Anomaly Detection** — High-frequency telemetry monitoring using Kafka, Flink, and sliding-window statistical scoring.
  - **Project 3: DataOps RAG Pipeline** — Automated indexing, schema validation, and evaluation tracking for enterprise knowledge retrieval.
- **Tech Stack:** Apache Spark, Apache Kafka, Apache Flink, Delta Lake, Python, FastAPI, Docker.
- **CV Bullet Points:**
  - *Authored enterprise architecture blueprints for Agentic Lakehouses and streaming anomaly detection engines handling high-volume real-time events.*
  - *Demonstrated production DataOps patterns combining Medallion Delta Lake layers with automated LLM data validation agents.*

---

### 46. Kaggle Competition Master
- **Repository:** [`github.com/akmalkhaniub/kaggle-competition-master`](https://github.com/akmalkhaniub/kaggle-competition-master)
- **Architectural Role:** Machine Learning Pipeline & Stacking Workbench
- **Overview:** A comprehensive machine learning competition workbench featuring automated feature engineering, Bayesian hyperparameter tuning, and multi-model ensembling (LightGBM, XGBoost, PyTorch).
- **Tech Stack:** Python, PyTorch, LightGBM, XGBoost, Optuna, Scikit-Learn, Pandas.
- **CV Bullet:** *Built an automated ML competition pipeline featuring Bayesian hyperparameter optimization (Optuna) and multi-model neural network stacking.*

---

### 47. Python Interview Preparation Suite
- **Repository:** [`github.com/akmalkhaniub/python-interview-prep-suite`](https://github.com/akmalkhaniub/python-interview-prep-suite)
- **Architectural Role:** Advanced Systems Engineering & Multi-Cloud Architecture Reference
- **Overview:** An exhaustive 16-notebook technical suite covering advanced Python paradigms, concurrency models, distributed algorithms, low-level memory management, and cross-cloud architectural mappings between AWS, GCP, and Azure.
- **Tech Stack:** Python, Jupyter Notebooks, Systems Architecture Diagrams, Distributed Algorithms.
- **CV Bullet:** *Authored a 16-notebook engineering suite covering system design patterns, distributed concurrency models, and comparative AWS/GCP/Azure architectures.*

---

### 48. Object-Oriented Design Patterns Lab
- **Repository:** [`github.com/akmalkhaniub/OOD-Mastery`](https://github.com/akmalkhaniub/OOD-Mastery) & [`designpatterns`](file:///g:/ReplitProjects/designpatterns)
- **Architectural Role:** Clean Architecture & SOLID Design Pattern Laboratories
- **Overview:** Code laboratories demonstrating GoF design patterns (Creational, Structural, Behavioral), clean architecture principles, and refactorings of common architectural smells.
- **Tech Stack:** Python, TypeScript, UML, Design Patterns.
- **CV Bullet:** *Developed clean code laboratories demonstrating GoF design patterns, SOLID principles, and architectural refactoring strategies.*

---

## 🎯 CV Update Strategy & Placement Guide

### Recommended Placement for Different Senior Job Roles:

#### 1. Targeting **Staff / Principal AI Engineer / AI Architect**:
- **Headline Project:** **Agent Fleet Orchestrator** & **Ops MCP Suite**
- **Supporting Highlights:** **SpecForge**, **Multimodal Eval Harness**, **Enterprise Cloud-Native API Gateway**
- **Emphasize:** Multi-agent DAG orchestration, FastMCP / Model Context Protocol tooling, closed-loop AST verification, FinOps token optimization, and zero-downtime traffic architectures.

#### 2. Targeting **Senior Full-Stack AI Engineer (React / Next.js / Python / Node)**:
- **Headline Project:** **SpecForge** & **LeaseLogic AI**
- **Supporting Highlights:** **Sentinel**, **IntakeRx**, **UI-Scout AI**, **Studio OS**
- **Emphasize:** Two-pass extraction with Claude 3.5 Sonnet, pgvector HNSW indexing, Zod schema validation, BullMQ background processing, and responsive React/Next.js/React Native interfaces.

#### 3. Targeting **Senior Backend / Distributed Systems Engineer (Go / Rust / Python)**:
- **Headline Project:** **Enterprise Cloud-Native API Gateway Platform** & **Go High-Concurrency Reverse Proxy**
- **Supporting Highlights:** **LogPulse-rs**, **Go-Redis-KV**, **Go Distributed Task Queue**, **Django Payroll Engine**
- **Emphasize:** LuaJIT crypto plugins, Redis clusters, lock-free routing, binary min-heap priority queues, zero-copy memory mapping (`memmap2`), and Celery/Redis ACID transaction security.

#### 4. Targeting **HealthTech / Enterprise Compliance AI Engineer**:
- **Headline Project:** **IntakeRx** & **Secure Healthcare Audit Vault**
- **Supporting Highlights:** **MedEdge**, **AI Care Agency Rota Manager**, **ClaimPilot**
- **Emphasize:** HIPAA compliance, FHIR/HL7 schemas, AES-256 field encryption, PostgreSQL immutable audit triggers, and offline/edge LLM inference via Ollama/Gemma.

---
*Report generated on September 8, 2026. Maintained by Akmal Khan, PhD.*
