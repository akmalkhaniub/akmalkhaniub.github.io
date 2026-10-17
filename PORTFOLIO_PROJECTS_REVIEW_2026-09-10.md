# 🚀 Comprehensive Portfolio Projects Review & Technical Stack Index

**Document Date:** September 10, 2026  
**Author:** Akmal Khan, PhD — Senior Full Stack AI Engineer & Systems Architect  
**Profile:** [github.com/akmalkhaniub](https://github.com/akmalkhaniub) | [linkedin.com/in/akmal-khan-332000250](https://www.linkedin.com/in/akmal-khan-332000250/) | [akmalkhaniub.github.io](https://akmalkhaniub.github.io)  
**Total Documented Systems:** 102 Production Projects, Architectures, and Microservices  
**Primary Purpose:** Complete technical audit, architectural descriptions, tech stack inventory, and copy-paste ready bullet points for Curriculum Vitae (CV), executive resumes, and technical interviews.

---

## 📑 Table of Contents

1. [Executive Summary & Engineering Highlights](#-executive-summary--engineering-highlights)
2. [Skills & Technology Matrix](#-skills--technology-matrix)
3. [Section 1: Real-Time Voice AI, Speech Systems & Telephony Platforms (Projects 1–7)](#-section-1-real-time-voice-ai-speech-systems--telephony-platforms)
4. [Section 2: Agentic Infrastructure, Multi-Agent Systems & Developer Platforms (Projects 8–14)](#-section-2-agentic-infrastructure-multi-agent-systems--developer-platforms)
5. [Section 3: Applied AI Products, Multimodal Systems & Vertical MVPs (Projects 15–27)](#-section-3-applied-ai-products-multimodal-systems--vertical-mvps)
6. [Section 4: Cloud-Native, High-Concurrency & Systems Engineering (Projects 28–36)](#-section-4-cloud-native-high-concurrency--systems-engineering)
7. [Section 5: The 17 Specialized Agentic Microservices (`AgenticApps` Monorepo) (Projects 37–53)](#-section-5-the-17-specialized-agentic-microservices-agenticapps-monorepo)
8. [Section 6: Domain AI, HealthTech, Web & Mobile Applications (Projects 54–63)](#-section-6-domain-ai-healthtech-web--mobile-applications)
9. [Section 7: Architecture Showcases, Specialized Agents & Suites (Projects 64–70)](#-section-7-architecture-showcases-specialized-agents--suites)
10. [CV Update Strategy & Placement Guide](#-cv-update-strategy--placement-guide)

---

## 🌟 Executive Summary & Engineering Highlights

This master technical portfolio review represents over **20 years of software systems engineering** and **3+ years dedicated to architecting and shipping production AI platforms** by **Akmal Khan, PhD**.

Covering **102 complete systems, tools, and microservices**, this inventory details end-to-end capabilities across:
- **Real-Time Conversational Voice & Audio DSP Platforms:** Full-duplex speech AI (Next.js 16 AudioWorklet, sub-300ms roundtrip latency, Silero VAD v5 ONNX barge-in), carrier-grade SIP/RTP media gateways in Go (`telephony-bridge-go`), ultra-high throughput audio DSP engines in Rust (`audio-dsp-rs`, 232M samples/sec), automated speech MLOps benchmarking (`voice-eval`), interactive 30 FPS video avatars (`avatarpilot-ai`), and hardware telemetry support (`visioncall-ai`).
- **Autonomous Multi-Agent Orchestration & MCP:** Production Model Context Protocol (MCP) servers, topological task DAGs (LangGraph, CrewAI, AutoGen), git-worktree sandboxing, and closed-loop AST verification.
- **Enterprise Multimodal & RAG Pipelines:** Hybrid semantic search (pgvector HNSW, Qdrant, Pinecone), Claude 3.5/3.7 two-pass structured extraction, Zod validation, circuit-breaker fallback cascades, and FinOps prompt caching.
- **High-Concurrency Systems & Low Latency:** Double-entry banking ledgers in Go (`apex-ledger`), zero-copy memory-mapped file profilers in Rust (`memmap2`, `rayon`), Go Layer-7 reverse proxies, sharded Redis-compatible RESP v2 datastores, and PyO3 C-extensions.
- **Cloud-Native Resilience & Compliance:** Cloud-native API Gateways (Apache APISIX, LuaJIT crypto plugins), HIPAA-compliant electronic healthcare records (FHIR/HL7, AES-256 field-level encryption), and ACID-compliant distributed transaction engines.

---

## 📊 Skills & Technology Matrix

| Engineering Pillar | Core Technologies & Frameworks |
| :--- | :--- |
| **Voice & Speech AI** | AudioWorklet (16kHz PCM), Silero VAD v5 (ONNX), Deepgram Nova-3, Faster-Whisper, Kokoro-82M, Cartesia Sonic, SIP/RTP, WebRTC |
| **Audio DSP & Low-Latency** | Rust 2024 (SIMD, Ring Buffers, 232M samples/s), Go 1.26+ (sync.Pool, G.711 Transcoding), WebSockets, Web Audio API |
| **Agentic AI & Orchestration** | LangGraph, CrewAI, AutoGen, Model Context Protocol (MCP), FastMCP, Google ADK, LiteLLM, E2B Sandboxes |
| **LLM Models & APIs** | Claude 3.5 Sonnet / 3.7 Vision, Gemini 2.0 / 2.5 Pro / Flash, Groq Llama 3.3 70B, GPT-4o, Ollama, Gemma |
| **Vector DBs & Search** | pgvector (HNSW/IVFFlat), Pinecone, Qdrant, ChromaDB, BM25 Hybrid Retrieval, Cross-Encoders |
| **Frontend & Mobile** | React 19, Next.js 16 (App Router, Server Components), React Native, Expo, Tailwind CSS, NativeWind, Zustand |
| **Backend & Async Systems** | Node.js (TypeScript, Hono, Express), Python (FastAPI, Django, Uvicorn), Go 1.22-1.26+, Rust 2024, C# (.NET 8) |
| **Queues & Distributed Events** | Redis, BullMQ, Celery, Apache Kafka, Temporal, AWS SQS/SNS, Azure Service Bus |
| **Databases & Financial Ledgers** | PostgreSQL, Double-Entry Ledger Invariants, SQLC, MySQL, Supabase, Neon Serverless, Drizzle ORM, Prisma |
| **Cloud, DevOps & Infra** | AWS (ECS, Lambda, S3, Bedrock), Azure (AKS, Functions, Cosmos DB), GCP (Cloud Run, GCS), Docker, Kubernetes, APISIX |

---

## 🎙️ Section 1: Real-Time Voice AI, Speech Systems & Telephony Platforms

### 1. VoicePilot AI: Real-Time Enterprise Voice Assistant
- **Repository:** [`github.com/akmalkhaniub/voicepilot-ai`](https://github.com/akmalkhaniub/voicepilot-ai)
- **Architectural Role:** Full-Duplex Conversational Voice Platform with Instant Barge-In & Sub-300ms E2E Latency
- **Overview:** A full-duplex conversational voice AI platform engineered for sub-300ms roundtrip latency, instant barge-in interruption cutoff, and enterprise observability across streaming audio hot paths.
- **Key Technical Details:**
  - Next.js 16 (React 19) client with AudioWorkletProcessor delivering zero-lag 16kHz linear PCM streaming.
  - Sub-millisecond Silero VAD v5 (ONNX Runtime, 1.07ms) with instant agent speech cutoff (<20ms) on user barge-in.
  - Streaming STT (Deepgram Nova-3 / Faster-Whisper), low TTFT reasoning (Groq Llama 3.3 70B <90ms), and streaming TTS (Kokoro-82M / Cartesia Sonic).
  - Canvas-based reactive audio frequency orb and live waterfall latency telemetry (VAD, STT, TTFT, TTFB, E2E).
- **Tech Stack:** Next.js 16, React 19, Python 3.12+, FastAPI, WebSockets, AudioWorklet, Silero VAD, Groq, Deepgram, Kokoro TTS, Docker
- **CV Bullet Point:**
  > *"Architected VoicePilot AI, a full-duplex enterprise voice platform delivering sub-300ms roundtrip latency, instant barge-in interruption cutoff (<20ms) via Silero VAD ONNX, and real-time audio waterfall telemetry."*

---

### 2. CallPulse: Inbound Telephony & CRM Voice AI
- **Repository:** [`github.com/akmalkhaniub/callpulse`](https://github.com/akmalkhaniub/callpulse)
- **Architectural Role:** Carrier-Grade Inbound Call Center Voice Platform with Telephony FSM & CRM Tools
- **Overview:** A turnkey enterprise inbound telephony and call center voice AI platform with virtual softphone HUD, state-machine call routing, real-time CRM tool execution, and automated post-call intelligence audits.
- **Key Technical Details:**
  - Carrier-grade virtual softphone HUD with interactive telephony controls: Ringing, Answer, Hold Music, Transfer, and DTMF PIN verification.
  - Telephony Finite State Machine (IDLE -> RINGING -> CONNECTED -> ON_HOLD -> TRANSFERRING -> WRAP_UP -> COMPLETED).
  - Autonomous CRM tool execution for live order tracking, address verification, and refund authorizations.
  - Automated post-call intelligence modal calculating CSAT scores, sentiment trajectories, and PII-redacted call summaries.
- **Tech Stack:** Next.js 16, React 19, Python 3.12+, FastAPI, WebSockets, Telephony FSM, CRM Tool Loop, Tailwind CSS, Docker
- **CV Bullet Point:**
  > *"Built CallPulse, an enterprise inbound telephony voice platform featuring a virtual softphone HUD, 7-state telephony FSM, real-time CRM tool execution, and automated post-call CSAT and sentiment audits."*

---

### 3. VoiceEval: Speech AI & MLOps Benchmarking Harness
- **Repository:** [`github.com/akmalkhaniub/voice-eval`](https://github.com/akmalkhaniub/voice-eval)
- **Architectural Role:** Automated Speech Model Evaluation, Quantization & Vendor Benchmarking Engine
- **Overview:** An enterprise MLOps platform evaluating speech models across Word Error Rate (WER), Character Error Rate (CER), Real-Time Factor (RTF), ONNX/TensorRT inference latency, and acoustic noise degradation curves.
- **Key Technical Details:**
  - Dynamic programming Levenshtein alignment visualizer with word-by-word diffs (Substitutions, Deletions, Insertions).
  - Acoustic noise degradation synthesizer benchmarking model resilience across SNR sweeps (30 dB down to 10 dB).
  - Model quantization benchmarking comparing FP32, INT8 Dynamic Quantization, and TensorRT engine speeds.
  - Automated generation of NVIDIA Triton Model Repository configurations (config.pbtxt).
- **Tech Stack:** Next.js 16, React 19, Python 3.12+, FastAPI, NumPy, ONNX Runtime, TensorRT, LibriSpeech, Docker
- **CV Bullet Point:**
  > *"Engineered VoiceEval, an enterprise speech AI evaluation harness benchmarking WER/CER, Real-Time Factor (RTF), and acoustic noise degradation curves across FP32, INT8, and TensorRT model pipelines."*

---

### 4. AvatarPilot AI: Interactive Conversational Avatar
- **Repository:** [`github.com/akmalkhaniub/avatarpilot-ai`](https://github.com/akmalkhaniub/avatarpilot-ai)
- **Architectural Role:** 30 FPS Neural Facial Expression & 12-Viseme Lip-Sync Conversational Avatar
- **Overview:** A real-time conversational video avatar engine rendering 30 FPS neural facial micro-expressions, 12-viseme lip-sync blendshapes, and sub-350ms door-to-door latency with instant barge-in interruption cutoff.
- **Key Technical Details:**
  - 30 FPS interactive avatar canvas with real-time phoneme-to-viseme mapping and procedural facial micro-expressions.
  - Full-duplex WebSockets with AudioWorklet 16kHz streaming and sub-350ms voice-to-video synchronization.
  - Continuous A/V drift monitor maintaining lip-sync synchronization within 15ms tolerance.
  - Instant barge-in cutoff cutting video rendering and speech synthesis when user begins speaking.
- **Tech Stack:** Python 3.14+, Next.js 16, React 19, FastAPI, WebSockets, Silero VAD v5, WebGL Canvas, Docker
- **CV Bullet Point:**
  > *"Architected AvatarPilot AI, an interactive video avatar engine rendering 30 FPS neural facial blendshapes and 12-viseme lip-sync with sub-350ms door-to-door latency and instant barge-in interruption cutoff."*

---

### 5. VisionCall AI: Multimodal Telemetry & AR Guidance
- **Repository:** [`github.com/akmalkhaniub/visioncall-ai`](https://github.com/akmalkhaniub/visioncall-ai)
- **Architectural Role:** Edge Computer Vision, Hardware Telemetry & Spoken AR Troubleshooting
- **Overview:** An enterprise multimodal customer engineering and field-support platform uniting real-time edge computer vision, bi-directional WebSockets, optical hardware telemetry, and zero-latency voice interaction with sub-millisecond AR overlays.
- **Key Technical Details:**
  - Real-time video frame inspection detecting hardware components, port statuses, and LED diagnostic indicators.
  - Spoken guidance coupled with sub-millisecond Augmented Reality (AR) bounding box overlays on live camera feeds.
  - Bi-directional WebSockets streaming synchronized 640x480 video frames and 16kHz audio.
- **Tech Stack:** Python 3.14+, Next.js 16, React 19, FastAPI, OpenCV, WebSockets, Web Audio API, Canvas AR Overlays
- **CV Bullet Point:**
  > *"Created VisionCall AI, a multimodal field-support platform coupling edge computer vision with conversational voice AI to provide real-time hardware telemetry and sub-millisecond AR diagnostic overlays."*

---

### 6. Telephony Bridge Go: Carrier Media Gateway
- **Repository:** [`github.com/akmalkhaniub/telephony-bridge-go`](https://github.com/akmalkhaniub/telephony-bridge-go)
- **Architectural Role:** High-Concurrency Carrier Media Gateway & Zero-Allocation Multiplexer in Go
- **Overview:** An ultra-high throughput carrier-grade audio media gateway in Go (Go 1.26+) bridging carrier VoIP telephony trunks (SIP / RTP over UDP) and WebRTC directly into downstream speech AI engines.
- **Key Technical Details:**
  - Zero-allocation memory pooling (sync.Pool) for G.711 160B and PCM 640B streaming audio buffers.
  - Sub-millisecond G.711 mu-law/A-law lookup transcoding with 2x linear upsampling (8kHz to 16kHz linear PCM).
  - Goroutine multiplexer handling thousands of concurrent RTP audio streams with lock-free atomic telemetry.
- **Tech Stack:** Go (Golang 1.26+), SIP / RTP over UDP, WebRTC, WebSockets, sync.Pool, G.711 Transcoder, Docker
- **CV Bullet Point:**
  > *"Engineered Telephony Bridge Go, a carrier-grade audio gateway in Go bridging SIP/RTP VoIP trunks to speech AI runtimes using zero-allocation memory pooling (sync.Pool) and G.711 transcoding."*

---

### 7. Audio DSP Rs: Zero-Allocation DSP & VAD Engine
- **Repository:** [`github.com/akmalkhaniub/audio-dsp-rs`](https://github.com/akmalkhaniub/audio-dsp-rs)
- **Architectural Role:** Lock-Free Ring Buffering, Audio Resampling & Sub-Microsecond VAD in Rust 2024
- **Overview:** An ultra-low latency, zero-allocation digital signal processing (DSP) and voice activity detection (VAD) engine engineered in Rust 2024. Designed as the high-speed audio pre-processing foundation for real-time speech AI pipelines.
- **Key Technical Details:**
  - Lock-free circular ring buffering and fractional audio resampling (48kHz/44.1kHz -> 16kHz linear PCM).
  - Sub-microsecond energy and zero-crossing rate speech endpointing with zero heap allocations on streaming hot paths.
  - Benchmark throughput exceeding 232 million samples/sec with release LTO optimization.
- **Tech Stack:** Rust (Edition 2024), SIMD, Circular Ring Buffers, Hann Window, Zero-Crossing Rate, Resampling, Docker
- **CV Bullet Point:**
  > *"Built Audio DSP Rs, an ultra-fast audio DSP engine in Rust processing 232M samples/sec with zero heap allocations on streaming hot paths, providing lock-free ring buffering and sub-microsecond VAD endpointing."*

---


## 🛠️ Section 2: Agentic Infrastructure, Multi-Agent Systems & Developer Platforms

### 8. Agent Fleet Orchestrator
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

### 9. Ops MCP Suite: Production Toolkit
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

### 10. Drizzle Sentinel MCP
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

### 11. Agent Toolchain Core
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

### 12. NEXUS Agent Platform
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

### 13. Google A2A Multi-Agent Protocol
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

### 14. Google ADK & Gemini Streaming Suite
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


## 🧠 Section 3: Applied AI Products, Multimodal Systems & Vertical MVPs

### 15. SpecForge: AI Requirements Platform
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

### 16. Sentinel: Autonomous QA & Bug Hunter
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

### 17. Multimodal Eval Harness
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

### 18. Enterprise Operations Agent
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

### 19. Procurement Intelligence Multi-Agent System
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

### 20. LeaseLogic AI: Lease Extraction Engine
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

### 21. ClaimPilot: Claims Adjudication Engine
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

### 22. IntakeRx: Clinical Triage & EHR Platform
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

### 23. UI-Scout AI: Autonomous Visual QA
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

### 24. AppLens AI: Browser Testing & CRO Audit
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

### 25. OpenMontage: Programmatic Video Pipeline
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

### 26. QuestionPaperAI: Assessment Engine
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

### 27. Cadence AI: Event Operations System
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


## 💻 Section 4: Cloud-Native, High-Concurrency & Systems Engineering

### 28. ApexLedger: Core Banking Double-Entry Engine
- **Repository:** [`github.com/akmalkhaniub/apex-ledger`](https://github.com/akmalkhaniub/apex-ledger)
- **Architectural Role:** Production-Grade Core Banking Double-Entry Ledger & Money Movement Engine in Go
- **Overview:** A production-grade, spec-driven core banking ledger and money-movement engine built in Go enforcing double-entry invariants, IETF Idempotency-Key guarantees, and deterministic concurrency controls.
- **Key Technical Details:**
  - Strict double-entry accounting invariant engine ensuring debits equal credits across all transactions.
  - IETF Idempotency-Key specification layer preventing duplicate disbursements under network retries.
  - Transaction state machine with PostgreSQL row-level locking (SELECT FOR UPDATE) and transactional outbox patterns.
  - OpenAPI 3.1 spec-driven routing with oapi-codegen.
- **Tech Stack:** Go 1.22+, Chi, OpenAPI 3.1, oapi-codegen, PostgreSQL, SQLC, Transactional Outbox, Docker
- **CV Bullet Point:**
  > *"Architected ApexLedger, a spec-driven core banking ledger in Go enforcing strict double-entry invariants (debits == credits), IETF idempotency guarantees, and PostgreSQL row-level locking."*

---

### 29. Enterprise Cloud-Native API Gateway
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

### 30. Go High-Concurrency Load Balancer
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

### 31. Go-Redis-KV: In-Memory Key-Value Store
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

### 32. Go Distributed Task Queue & DAG Engine
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

### 33. LogPulse-rs: CLI Log & Tail Latency Engine
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

### 34. py-fastfuzzy-rs: Rust Extension for Python
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

### 35. Django High-Throughput Async Payroll Engine
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

### 36. ScholarAssist Data Pipeline
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


## 🛡️ Section 5: The 17 Specialized Agentic Microservices (`AgenticApps` Monorepo)

### 37. Fintech Fraud Mitigator
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

### 38. Cloud Security Sentinel
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

### 39. Compliance & PII Sanitizer
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

### 40. Model Router Sentinel & Budget Guard
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

### 41. Feature Shippable Agent
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

### 42. LLM Benchmark & Hallucination Evaluator
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

### 43. Medical Intake Voice Nurse
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

### 44. Autonomous DevRel Agent
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

### 45. Agentic Customer Support
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

### 46. Real Estate Virtual Showings Coordinator
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

### 47. Service Dispatch Coordinator
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

### 48. Travel Concierge Agent
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

### 49. Scientific Research Sandbox
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

### 50. Revenue Recovery Auditor
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

### 51. Multi-Agent Debate Engine
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

### 52. Multimodal QA Agent
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

### 53. Enterprise Knowledge Swarm
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


## 🏥 Section 6: Domain AI, HealthTech, Web & Mobile Applications

### 54. MedEdge: Hybrid Clinical Assistant
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

### 55. Secure Healthcare Audit Vault
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

### 56. AI Care Agency Rota Manager
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

### 57. Socrates: Hybrid Socratic Tutor
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


## 📱 Section 6 Continued: Full-Stack Web, Gaming & Mobile Platforms

### 58. Studio OS: AI Film Operating System
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

### 59. RangMaster & RangMasterPro
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

### 60. CardGames Web Platform
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

### 61. LudoMaster Board Game
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

### 62. Cross-Platform Mobile Quiz Application
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

### 63. AgenticLife (FootprintOS)
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


## 🔬 Section 7: Architecture Showcases, Specialized Agents & Suites

### 64. Azure Enterprise Cloud Suite (.NET 8 & Kafka)
- **Repository:** [`github.com/akmalkhaniub/azure-enterprise-suite`](https://github.com/akmalkhaniub/azure-enterprise-suite)
- **Architectural Role:** Distributed Microservices, Serverless Pipelines & Enterprise RAG
- **Overview:** A complete enterprise cloud suite demonstrating distributed microservices, event-driven serverless architectures, and generative AI copilot systems built with C# (.NET 8), Apache Kafka, AKS, and Azure Cloud.
- **Key Technical Details:**
  - Cloud-native logistics microservices with Kafka event streaming, CQRS, MediatR, and YARP API Gateway.
  - Event-driven serverless document processing using Azure Functions (.NET 8 Isolated Worker), Cosmos DB, and SignalR.
  - Enterprise RAG system built with Microsoft Semantic Kernel and Azure OpenAI.
- **Tech Stack:** C# (.NET 8), Apache Kafka, Azure Kubernetes Service (AKS), YARP, Azure Functions, Cosmos DB, Semantic Kernel, Bicep
- **CV Bullet Point:**
  > *"Delivered the Azure Enterprise Cloud Suite featuring .NET 8 event-driven microservices on Kafka/AKS, serverless Azure Functions pipelines, and enterprise RAG with Microsoft Semantic Kernel."*

---

### 65. VentureDive Lead Architect Portfolio
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

### 66. Kaggle Competition Master
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

### 67. Python Interview Prep Suite
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

### 68. Object-Oriented Design Patterns Lab
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

### 69. BlogAgent: Autonomous Content Creation
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

### 70. YouTube Topic Intelligence Agent
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


## 🚀 Section 8: Newly Synced Flagship Platforms, FinTech Engines & Hackathon Systems (October 2026 Sync)

### 1. TrafficSentinel Suite: Ad-Tech IVT Investigator & MCP Platform
- **Repository:** [`github.com/akmalkhaniub/trafficsentinel-suite`](https://github.com/akmalkhaniub/trafficsentinel-suite)
- **Architectural Role:** Autonomous Invalid Traffic (IVT) Investigator, FastMCP Telemetry Server & PromptEval Studio
- **Overview:** An enterprise-grade monorepo combining an interactive clarifying investigator agent, an in-process DuckDB bidstream analytics FastMCP server, and a 50-scenario ground-truth evaluation harness catching prompt regressions in CI/CD.
- **Key Technical Details:**
  - Interactive Clarification Engine: Programmatic AmbiguityGate evaluating slot completeness (threshold >= 0.85) to pause and clarify underspecified queries before executing expensive queries (100% precision on benchmarks).
  - AdStream MCP Server: FastMCP server exposing high-throughput DuckDB telemetry queries over 500k+ Parquet bidstream records with strict 800-token context budgeting.
  - PromptEval Studio: 50-scenario golden evaluation suite benchmarking Clarification Trigger Rate (CTR), Tool Selection Accuracy (TSA), and Non-Overstatement.
  - Angular 21 SPA Dashboard: Modern Signal-based reactive frontend with interactive clarification pills, live DuckDB telemetry explorer, and side-by-side regression diff viewer.
  - Caught Production Regression (REG-2026-IVT-04): Proved automated CI quality gate blocking candidate prompts that collapse clarification behavior and guess parameters.
- **Tech Stack:** Angular 21, Python 3.11+, FastAPI, FastMCP, DuckDB, Claude Skills, Pydantic v2, Parquet, Pytest, CI/CD Gates
- **CV Bullet Point:**
  > *"Architected TrafficSentinel Suite, an enterprise AI Agent, FastMCP server, and evaluation platform for ad-tech trust & safety and IVT investigation. Built an Interactive Clarification Engine (100% CTR), an in-process DuckDB telemetry MCP surface with <800-token budgeting, and a 50-scenario eval harness that caught a tool-selection regression (REG-2026-IVT-04) in CI/CD."*

---

### 2. SawtOS: Carrier-Grade Real-Time LiveKit Voice, Telephony & Analytics Engine
- **Repository:** [`github.com/akmalkhaniub/sawt-os`](https://github.com/akmalkhaniub/sawt-os)
- **Architectural Role:** Dual-Engine Voice Router (Native S2S + Cascaded), LiveKit SIP Trunking & HIPAA Clinical ETL
- **Overview:** An enterprise-grade real-time conversational voice and carrier telephony platform for US and Gulf (Arabic/English) markets, uniting a Dual-Engine Voice Router, sub-4ms in-call pgvector RAG, post-call LLM-as-a-Judge QA, and Apache Airflow 3.0 clinical de-identification.
- **Key Technical Details:**
  - Dual-Engine Voice Router dynamically switching between Gemini 2.5 Flash Native Speech-to-Speech (Gulf Arabic nuance) and an ultra-fast cascaded pipeline (Silero VAD v5 + Deepgram Nova-3 + Groq Llama 3.3 70B + Cartesia Sonic 3.5) at ~285ms E2E latency.
  - Instant barge-in detection (<1.5ms Silero ONNX) tripping cancellation tokens to flush WebRTC audio playback buffers within 35ms.
  - LiveKit SIP Dispatcher v1.1+ with Twilio/Telnyx carrier reconciliation, DID routing (+1 US / +966 KSA / +971 UAE), and deterministic call FSM.
  - Sub-4ms in-call HNSW cosine RAG over PostgreSQL 17 pgvector, post-call LLM-as-a-Judge QA scoring via Langfuse OTel spans, and Airflow 3.0 HIPAA Safe Harbor ETL.
- **Tech Stack:** LiveKit Agents, LiveKit SIP, Python 3.12+, Next.js 16, PostgreSQL 17, pgvector, Airflow 3.0, Silero VAD, Deepgram Nova-3, Groq, Cartesia Sonic, HIPAA
- **CV Bullet Point:**
  > *"Architected SawtOS, a carrier-grade LiveKit voice and SIP telephony engine achieving 285ms E2E latency across native Speech-to-Speech (Gulf Arabic/English) and cascaded pipelines, with sub-4ms pgvector RAG, Langfuse LLM-as-a-Judge QA, and Airflow 3.0 HIPAA de-identification."*

---

### 3. OmniCast Studio: Autonomous Multimodal Research, Graph RAG & Broadcast Platform
- **Repository:** [`github.com/akmalkhaniub/omnicast-studio`](https://github.com/akmalkhaniub/omnicast-studio)
- **Architectural Role:** Interactive Concept Mind Maps, Dual-Host Podcasts, Remotion Video Studio & Full-Duplex Voice Chat
- **Overview:** An enterprise-grade, spec-driven multimodal research and broadcast studio (open-source NotebookLM alternative) that transforms dense documents, papers, and repos into interactive GraphDB mind maps, dual-host podcasts, Remotion videos, and interruptible real-time voice conversations.
- **Key Technical Details:**
  - Interactive Concept Mind Map canvas (@xyflow/react + ELKjs + Memgraph/Kùzu GraphDB) with 1-click source paragraph citation jumping.
  - Dual-host conversational podcast generator powered by Gemini 3.8 Flash and local Kokoro-82M ONNX / Cartesia Sonic TTS mastered to EBU R128 (-16 LUFS) via Rust SIMD DSP.
  - Full-duplex &#x27;Interrupt & Ask&#x27; voice mode via Web Audio API AudioWorklet and Gemini Multimodal Live WebSockets (<20ms barge-in cutoff).
  - Programmatic Remotion 4.x video studio rendering 16:9 presentation decks and 9:16 vertical Shorts alongside iTunes/Spotify RSS 2.0 syndication.
- **Tech Stack:** Next.js 16.3, React 19, FastAPI, Python 3.14, Strawberry GraphQL, MongoDB, GraphDB, Gemini Live API, Kokoro-82M ONNX, Remotion 4.x, AudioWorklet
- **CV Bullet Point:**
  > *"Engineered OmniCast Studio, a multimodal Graph RAG and broadcast platform combining React Flow knowledge graphs, EBU R128 mastered dual-host podcasts, Remotion 4.x programmatic video rendering, and sub-300ms interruptible AudioWorklet voice chat."*

---

### 4. OmniCard & FX: Virtual Card Issuing & Sub-10ms JIT Authorization Gateway
- **Repository:** [`github.com/akmalkhaniub/omnicard-fx`](https://github.com/akmalkhaniub/omnicard-fx)
- **Architectural Role:** Spec-Driven ISO 8583 Card Authorization, Multi-Currency FX Engine & Maker-Checker Governance in Go
- **Overview:** A high-performance, spec-driven virtual card issuing and Just-In-Time (JIT) transaction authorization gateway built in Go 1.22+, mirroring core issuing infrastructure at leading neobanks (Lithic, Stripe Issuing, Marqeta, Wise).
- **Key Technical Details:**
  - Contract-first OpenAPI 3.1 architecture governing Luhn PAN virtual card issuance, per-transaction/daily/monthly velocity limits, and MCC category controls.
  - Sub-10ms real-time JIT authorization pipeline evaluating card state, MCC rules, velocity caps, and atomic wallet holds with standardized ISO 8583 response codes (00, 51, 54, 57, 61).
  - Dynamic multi-currency FX engine providing guaranteed 60-second rate-locked quotes with configurable basis-point spread buffers for cross-currency settlement.
  - Maker-Checker dual-control compliance engine enforcing strict separation of duties (maker_id != checker_id) on high-value limit raises with immutable audit logs.
- **Tech Stack:** Go 1.22+, OpenAPI 3.1, ISO 8583, JIT Authorization, Multi-Currency FX, Maker-Checker, FinTech
- **CV Bullet Point:**
  > *"Engineered OmniCard & FX in Go 1.22+, a spec-driven virtual card issuing and ISO 8583 JIT authorization gateway achieving sub-10ms decision latency, 60-second rate-locked multi-currency FX conversion, and Maker-Checker governance."*

---

### 5. ReconMesh: High-Performance EOD 3-Way Financial Reconciliation Engine
- **Repository:** [`github.com/akmalkhaniub/recon-mesh`](https://github.com/akmalkhaniub/recon-mesh)
- **Architectural Role:** Sub-50ms 3-Way Ledger/Bank/Processor Matching & Automated Suspense Accounting in Go
- **Overview:** A spec-driven End-of-Day (EOD) 3-way financial reconciliation and break resolution engine built in Go 1.22+ that verifies transactional integrity across internal double-entry ledgers, bank statements (CAMT.053, BAI2, CSV), and payment processor feeds.
- **Key Technical Details:**
  - Multi-tier deterministic matching engine: Tier 1 exact 1-to-1 match, Tier 2 time-windowed heuristic token match, and Tier 3 batch aggregate settlement (Gross - Fees == Net Bank Payout).
  - Automated break classification isolating UNMATCHED_INTERNAL phantom entries, UNMATCHED_EXTERNAL bank wires/fees, and AMOUNT_MISMATCH FX/interchange slippage.
  - Automated double-entry suspense ledger generator (Assets:Suspense vs Liabilities:Reserve) keeping balance sheets balanced during break investigation.
  - High-throughput zero-allocation pipeline reconciling 10,000 multi-party transactions in under 50 milliseconds.
- **Tech Stack:** Go 1.22+, OpenAPI 3.1, CAMT.053 / BAI2, 3-Way Reconciliation, Suspense Accounting, Double-Entry Ledger, FinTech
- **CV Bullet Point:**
  > *"Built ReconMesh in Go 1.22+, an End-of-Day 3-way financial reconciliation engine across internal ledgers, CAMT.053/BAI2 bank feeds, and processor webhooks, reconciling 10,000 transactions in <50ms with automated suspense journal generation."*

---

### 6. IntentGuard: Autonomous AI Coding Control Plane & 1-Click Rollback Suite
- **Repository:** [`github.com/akmalkhaniub/intentguard`](https://github.com/akmalkhaniub/intentguard)
- **Architectural Role:** Inline Governance, Blast-Radius Circuit Breakers & Scope-Spill Rollbacks for Coding Agents
- **Overview:** An inline governance control plane and observability suite for autonomous coding agents (Google Antigravity, Claude Code, OpenAI Codex) providing real-time scope enforcement, thrashing circuit breakers, and 1-click surgical rollbacks across VS Code, CLI, and GitHub Actions.
- **Key Technical Details:**
  - 4 in-flight governance interventions: Semantic Scope Boundary (checks touched files against implementation_plan.md), Blast-Radius Circuit Breaker (halts >=3 hotspot loops or >25% file truncation), Context Poisoning Gateway, and Secret Shield.
  - Decoupled hexagonal architecture (@intentguard/core) serving 3 surfaces: VS Code/Cursor Cockpit extension, headless CLI (ig list/inspect/audit/rollback/compare), and GitHub Action PR Gatekeeper.
  - Time-Travel VCR player stepping through agent tool calls and Monaco side-by-side diffs with 1-click out-of-scope file revert (--spill-only).
  - Cross-agent hand-off exporter packaging clean session context and diffs between Antigravity, Claude Code, and OpenAI Codex.
- **Tech Stack:** TypeScript, VS Code Extension, Headless CLI, GitHub Actions, Monaco Diff, Agent Governance, Node.js
- **CV Bullet Point:**
  > *"Created IntentGuard, an inline governance control plane for autonomous coding agents (Claude Code, Antigravity, Codex) featuring blast-radius circuit breakers, semantic scope-spill detection, a VS Code VCR cockpit, headless CLI, and GitHub Action gatekeeper."*

---

### 77. StudioForge: Enterprise GenAI Diffusion Studio Turborepo
- **Repository:** [`github.com/akmalkhaniub/studioforge`](https://github.com/akmalkhaniub/studioforge)
- **Architectural Role:** Enterprise Image & Video Diffusion Pipeline with Zero-Allocation Transcoding
- **Overview:** An enterprise GenAI image & video generation studio suite engineered with Go 1.26, Next.js 16, Expo SDK 56, and Redis Streams, delivering zero-allocation ring buffers, warm-cache GPU affinity routing, dynamic admission backpressure, and zero-disk streaming AV1 transcoding.
- **Key Technical Details:**
  - Turborepo monorepo uniting Next.js 16 web studio, Expo SDK 56 mobile app, Go 1.26 media pipeline, and shared GraphQL codegen packages.
  - Zero-disk streaming transcoding engine via FFmpeg 7.x AV1 with dynamic admission backpressure and queue priority arbitration.
  - Warm-cache GPU worker affinity routing reducing cold-start diffusion model load overhead by 80%.
  - Real-time GraphQL subscriptions and AsyncAPI event bus over Redis 7.4 Streams for distributed generation state machine sync.
- **Tech Stack:** Turborepo, Go 1.26, Next.js 16, Expo SDK 56, Redis Streams, FFmpeg AV1, GraphQL, Three.js, Docker
- **CV Bullet Point:**
  > *"Architected StudioForge, an enterprise GenAI diffusion studio Turborepo (Go 1.26, Next.js 16, Expo SDK 56, Redis 7.4 Streams) featuring zero-allocation ring buffers, GPU affinity routing, and real-time streaming AV1 transcoding."*

---

### 78. PulseOps AI: Autonomous GPU Inference Fleet Triage & Incident Commander
- **Repository:** [`github.com/akmalkhaniub/pulseops-ai`](https://github.com/akmalkhaniub/pulseops-ai)
- **Architectural Role:** Real-Time Incident Commander & GPU Fleet Triage for High-Throughput GenAI Clusters
- **Overview:** An autonomous GPU inference cluster observability and incident triage platform engineered for ultra-scale GenAI infrastructure ($35M+ ARR scale), featuring sub-millisecond telemetry ingestion, zero-allocation memory pools, and live incident war rooms.
- **Key Technical Details:**
  - High-throughput Go 1.25 metric stream ingester with zero-allocation buffers (sync.Pool) handling 100K+ metrics/sec.
  - PostgreSQL 17 TimescaleDB hypertable partitioning for sub-second analytical queries across millions of GPU telemetry points.
  - Real-time incident war room with live multi-agent triage logs streaming via GraphQL Subscriptions to Web and Mobile.
  - Autonomous root cause isolation correlating NVLink degradation, thermal throttling, and VRAM memory fragmentation.
- **Tech Stack:** Go 1.25, TimescaleDB, PostgreSQL 17, Next.js 16, GraphQL, OpenTelemetry, Docker
- **CV Bullet Point:**
  > *"Architected PulseOps AI, an autonomous GPU inference fleet triage platform in Go 1.25 and TimescaleDB with zero-allocation buffers, handling 100K+ metrics/sec and streaming live incident mitigation trees via GraphQL Subscriptions."*

---

### 79. MediScribe AI: Clinical Multimodal Audio Processing & FHIR SOAP Platform
- **Repository:** [`github.com/akmalkhaniub/mediscribe-ai`](https://github.com/akmalkhaniub/mediscribe-ai)
- **Architectural Role:** Sub-Second Clinical Audio Slicing & FHIR-Compliant SOAP Encounter Generation
- **Overview:** A high-throughput clinical ambient scribe and multimodal processing platform executing sub-millisecond silence boundary slicing, parallel GPU Whisper v3 Turbo fan-out, and FHIR-compliant clinical SOAP note generation.
- **Key Technical Details:**
  - Low-latency audio chunking daemon in Go with FFmpeg silence boundary detection slicing encounters in under 5ms.
  - 60x parallel Whisper v3 Turbo fan-out architecture transcribing a 30-minute encounter in under 4 seconds.
  - Smith-Waterman overlap boundary alignment eliminating hallucinated boundary artifacts between chunk boundaries.
  - HIPAA-compliant, structured FHIR JSON output and reactive SOAP note review workspace with clinician audit trails.
- **Tech Stack:** Go 1.25, Whisper v3 Turbo, Next.js 16, Expo SDK 56, FFmpeg, FHIR, HIPAA, Docker
- **CV Bullet Point:**
  > *"Engineered MediScribe AI, a clinical audio processing platform achieving 60x parallel Whisper v3 Turbo fan-out (<4s for 30m encounter) with Smith-Waterman overlap alignment and HIPAA-compliant FHIR SOAP generation."*

---

### 80. CrawlPulse: Distributed High-Concurrency Web Scraping Architecture
- **Repository:** [`github.com/akmalkhaniub/crawlpulse-worker`](https://github.com/akmalkhaniub/crawlpulse-worker)
- **Architectural Role:** Enterprise Distributed Web Scraping, Proxy Arbitration & Ingestion Pipeline
- **Overview:** An enterprise-grade distributed web scraping engine comprising a NestJS API gateway, high-concurrency Go worker daemons, and Redis queue topology with Kubernetes HPA auto-scaling, handling high-volume page crawling with dynamic rate limiting.
- **Key Technical Details:**
  - Modular microservices architecture separating NestJS API ingest, Valkey/Redis task queue, and Go worker scrapers.
  - High-concurrency Go worker runtime converting complex HTML DOM trees to clean Markdown in sub-10ms.
  - Dynamic per-domain token bucket rate limiting, automated proxy rotation, and exponential backoff retry policies.
  - Kubernetes Horizontal Pod Autoscaler (HPA) scaling worker fleet based on queue backlog depth and latency SLAs.
- **Tech Stack:** Go, NestJS, Redis, Kubernetes, Docker, TypeScript, Markdown
- **CV Bullet Point:**
  > *"Architected CrawlPulse, an enterprise distributed web scraping engine featuring NestJS, high-concurrency Go workers, and Redis queue topology with Kubernetes HPA autoscaling and sub-10ms Markdown DOM conversion."*

---

### 81. CrisisHub: Distributed Emergency Dispatch & Case Management Platform
- **Repository:** [`github.com/akmalkhaniub/crisishub`](https://github.com/akmalkhaniub/crisishub)
- **Architectural Role:** Enterprise Crisis Response, Audit Trail & Incident Case Management Microservices
- **Overview:** A high-reliability emergency response and case management distributed platform engineered with Spring Boot, Keycloak OIDC/OAuth2 security, audit service streaming, and immutable incident event ledgers.
- **Key Technical Details:**
  - Domain-driven microservices architecture decoupling case management, audit event logging, and emergency dispatch.
  - Centralized Keycloak realm authentication with granular RBAC for first responders, dispatchers, and medical coordinators.
  - High-throughput asynchronous audit logging daemon capturing cryptographic SHA-256 state transitions for regulatory compliance.
  - Containerized multi-service deployment with Docker Compose, automated health probes, and PostgreSQL connection pooling.
- **Tech Stack:** Java 21, Spring Boot, Keycloak, PostgreSQL, Docker, Microservices, Maven
- **CV Bullet Point:**
  > *"Architected CrisisHub, an emergency dispatch and crisis case management microservices platform with Spring Boot, Keycloak OIDC RBAC, and immutable audit service streaming for mission-critical disaster response."*

---

### 82. GeoPulse: Real-Time Fleet & IoT Geospatial Telemetry Ingestion
- **Repository:** [`github.com/akmalkhaniub/geopulse`](https://github.com/akmalkhaniub/geopulse)
- **Architectural Role:** Sub-Second IoT Telemetry Gateway & Geofence Alerting Microservices
- **Overview:** A real-time IoT device telemetry and geospatial asset tracking platform featuring sub-second GPS coordinate ingestion, polygon geofence evaluation, and automated alert dispatch.
- **Key Technical Details:**
  - High-throughput ingestion service processing streaming GPS coordinates and sensor payloads from distributed hardware devices.
  - Sub-millisecond point-in-polygon geofencing engine triggering real-time enter/exit alerts across dynamic geographical boundaries.
  - Keycloak OAuth2 device authorization protecting device telemetry endpoints and management APIs.
  - Time-series geospatial queries optimized for trajectory replay and asset utilization analytics.
- **Tech Stack:** Go, Java, Keycloak, TimescaleDB, PostgreSQL, Docker, IoT, Geospatial
- **CV Bullet Point:**
  > *"Engineered GeoPulse, a real-time IoT fleet telemetry platform featuring high-concurrency coordinate ingestion, sub-millisecond point-in-polygon geofence evaluation, and Keycloak device authorization."*

---

### 83. VoxDive: Real-Time Conversational Voice Agent Over Video & Podcast Knowledge
- **Repository:** [`github.com/akmalkhaniub/voxdive`](https://github.com/akmalkhaniub/voxdive)
- **Architectural Role:** Full-Duplex Grounded Video/Audio Voice Agent with Timestamp Citation Seeking
- **Overview:** An interactive voice intelligence platform built for the AssemblyAI Voice Agent Hackathon that turns long-form videos, webinars, and podcasts into full-duplex conversational partners with spoken answers grounded in exact transcript timestamps.
- **Key Technical Details:**
  - Combines AssemblyAI asynchronous STT, speaker diarization, auto-chapters, and LeMUR (Claude reasoning) with real-time Voice Agent WebSockets.
  - Browser AudioWorklet circular ring buffers with instant playback halt flags on speech onset for zero-echo conversational barge-in.
  - Deterministic search_transcript tool calling that grounds every spoken response in verified transcript segments with click-to-seek video synchronization.
  - Sub-300ms turnaround latency with live latency HUD telemetry and a 20-assertion offline test suite.
- **Tech Stack:** AssemblyAI Voice Agent, LeMUR Claude, AudioWorklet, WebSockets, TypeScript, Node.js, Speaker Diarization
- **CV Bullet Point:**
  > *"Built VoxDive, a full-duplex voice agent over video and podcast archives using AssemblyAI STT, speaker diarization, LeMUR Claude tool calling, and Web Audio API AudioWorklet buffers for sub-300ms grounded spoken answers with timestamp citations."*

---

### 84. DispatchAgent.AI: Autonomous AWS Telephony Voice & Strands A2A Incident Response
- **Repository:** [`github.com/akmalkhaniub/dispatch-agent-ai`](https://github.com/akmalkhaniub/dispatch-agent-ai)
- **Architectural Role:** Outbound AWS Chime SIP Incident Paging, Spoken Command Triage & Multi-Agent ECS Rollback Swarm
- **Overview:** An autonomous P1 outage response system built for the AWS Cloud Development Series Agentic AI Hackathon that replaces silent push alerts with interactive outbound AWS Chime SIP phone calls and multi-agent remediation via the AWS Strands A2A protocol.
- **Key Technical Details:**
  - Places outbound phone calls via AWS Chime Voice Connector SIP trunking to brief on-call engineers and parse spoken natural-language remediation commands.
  - Coordinates a 4-agent swarm over the open AWS Strands Agent-to-Agent (A2A) protocol: TriageSupervisorAgent, TelephonyVoiceAgent, DevOpsRemediationAgent, and IncidentReporterAgent.
  - Executes automated canary traffic drains and Amazon ECS service rollbacks in seconds upon voice confirmation.
  - Synthesizes structured executive post-mortem Markdown logs with 100% unit test verification (7/7 test suite passing).
- **Tech Stack:** AWS Strands A2A, AWS Chime SIP, Amazon Bedrock, Claude 3.5 Sonnet, TypeScript, Amazon ECS, CloudWatch
- **CV Bullet Point:**
  > *"Architected DispatchAgent.AI, an autonomous incident commander integrating AWS Chime SIP voice trunking, Amazon Bedrock tool use, and the AWS Strands A2A multi-agent protocol to execute spoken-command ECS rollbacks and automated post-mortems."*

---

### 85. Antigravity Transcript & File Edit Visualizer: Agent Observability Dashboard
- **Repository:** [`github.com/akmalkhaniub/antigravity-transcript-viewer`](https://github.com/akmalkhaniub/antigravity-transcript-viewer)
- **Architectural Role:** Zero-Dependency Session Search, Mermaid Edit-Sequence Generator & Subagent Swarm Tracker
- **Overview:** A lightweight, zero-dependency observability dashboard and file modification visualizer for Google Antigravity AI agent sessions that parses multi-thousand-line JSONL trajectories into interactive timelines and Mermaid flowcharts.
- **Key Technical Details:**
  - Built 100% on Python&#x27;s standard library (http.server, sqlite3, json, pathlib) with zero external pip dependencies and instant desktop app mode launcher.
  - Indexes conversation_summaries.db and transcript.jsonl to render chronological file edit sequences ([NEW] -> [EDIT] -> [READ]) and automated Mermaid flowcharts.
  - In-app syntax-highlighted code reviewer with 1-click &#x27;Open in VS Code&#x27; (exact line jump) and &#x27;Reveal in File Explorer&#x27; OS hooks.
  - Subagent Swarm tracker inspecting invoke_subagent delegations, tool error distributions, universal drag-and-drop JSONL parsing, and secret-scrubbed trace export.
- **Tech Stack:** Python 3.12+, SQLite, Mermaid.js, HTML5 / CSS3, Zero-Dependency, Agent Observability, VS Code Hooks
- **CV Bullet Point:**
  > *"Developed Antigravity Transcript Visualizer, a zero-dependency Python observability dashboard indexing SQLite agent summaries and JSONL traces into Mermaid file-edit sequence diagrams, subagent swarm trees, and 1-click VS Code line jumpers."*

---

### 86. AgentCrawl: Autonomous Multi-Agent Web Crawler & Anti-Bot SPA Extractor
- **Repository:** [`github.com/akmalkhaniub/AgentCrawl`](https://github.com/akmalkhaniub/AgentCrawl)
- **Architectural Role:** Local-First CrewAI Scraper with JA4 TLS Impersonation, Selectolax C-Parser & Stealth Playwright
- **Overview:** A distributed, local-first multi-agent web crawling and structured data extraction platform engineered to bypass modern anti-bot WAFs (Cloudflare, Akamai, DataDome), hydrate dynamic SPAs, and enforce self-healing Pydantic v2 schemas.
- **Key Technical Details:**
  - 3-agent CrewAI pipeline: Reconnaissance Scout Agent (WAF/header probing), Stealth Browser Navigator Agent (interactive SPA hydration), and Data QA Validator Agent.
  - Low-level curl_cffi HTTP client spoofing Chrome JA3/JA4 TLS handshakes and HTTP/2 frame parameters alongside a selectolax C-engine HTML parser (30x faster than BS4).
  - Pluggable LLM router toggling seamlessly between $0 local GPU Ollama models (qwen2.5-coder, llama3.1) and Google Gemini 2.5 Flash.
  - SQLite WAL persistence with an automated Dead-Letter Queue (DLQ) capturing DOM dumps and stack traces for self-healing schema recovery.
- **Tech Stack:** Python 3.13, CrewAI, Playwright Stealth, curl_cffi (JA4 TLS), selectolax, Pydantic v2, SQLite WAL, Ollama / Gemini
- **CV Bullet Point:**
  > *"Architected AgentCrawl, an autonomous CrewAI web extraction platform combining curl_cffi JA4 TLS fingerprint spoofing, selectolax C-engine DOM parsing, stealth Playwright SPA navigation, and SQLite WAL Dead-Letter Queues."*

---

### 87. OmniMesh-ROCm: Enterprise Multi-Agent MCP Mesh on AMD Instinct MI300X
- **Repository:** [`github.com/akmalkhaniub/omnimesh-rocm`](https://github.com/akmalkhaniub/omnimesh-rocm)
- **Architectural Role:** High-Throughput Model Context Protocol (MCP) Swarm & FP8 vLLM-ROCm Inference Engine
- **Overview:** A high-performance Model Context Protocol (MCP) multi-agent orchestration engine built for the AMD Developer Hackathon (ACT III), optimized for AMD Instinct MI300X GPU accelerators and ROCm 6.2 high-throughput inference.
- **Key Technical Details:**
  - Dynamic MCP tool registry allowing autonomous subagent swarms to discover and invoke ROCm tensor auditors and AST grounding validators.
  - Optimized for AMD Instinct MI300X (ROCm 6.2) with FP8 quantized vLLM inference delivering 284.5 tokens/sec and 38.2ms Time-to-First-Token (TTFT).
  - Deterministic execution trace verifier asserting 100% AST and tool-call provenance across multi-agent delegations.
  - Strict TypeScript implementation with interactive telemetry dashboard and 100% passing offline test suite.
- **Tech Stack:** TypeScript, AMD ROCm 6.2, Instinct MI300X, Model Context Protocol, vLLM FP8, Multi-Agent Mesh
- **CV Bullet Point:**
  > *"Engineered OmniMesh-ROCm, an enterprise Model Context Protocol (MCP) multi-agent orchestration mesh optimized for AMD Instinct MI300X and ROCm 6.2 FP8 inference (284.5 tok/s, 38.2ms TTFT) with deterministic AST trace grounding."*

---

### 88. VultrSwarm-Agentic: Autonomous CloudOps & Multi-Agent Infrastructure Swarm
- **Repository:** [`github.com/akmalkhaniub/vultr-swarm-agentic`](https://github.com/akmalkhaniub/vultr-swarm-agentic)
- **Architectural Role:** Real-Time Cluster Anomaly Detection, Autonomous Instance Scaling & Serverless Worker Dispatch
- **Overview:** An autonomous multi-agent CloudOps infrastructure orchestrator built for the Vultr Agent Rush Hackathon that monitors compute clusters, detects CPU/memory anomalies, and dispatches serverless workers and instance resizing without human intervention.
- **Key Technical Details:**
  - Multi-agent coordination loop pairing a Telemetry Anomaly Detection Subagent with an Autonomous CloudOps Remediation Engine.
  - Automated Vultr compute actions including vertical instance resizing (vc2-8c-16gb) and horizontal serverless worker container spawning.
  - Immutable CloudOps audit log recording anomaly triggers, confidence scores, and remediation execution latencies.
  - Zero-dependency TypeScript architecture with real-time cluster health HUD and deterministic test suite.
- **Tech Stack:** TypeScript, Vultr Cloud API, Multi-Agent Swarm, CloudOps, Auto-Scaling, SRE Automation
- **CV Bullet Point:**
  > *"Built VultrSwarm-Agentic, an autonomous multi-agent CloudOps orchestrator that detects compute telemetry anomalies and executes automated Vultr instance scaling and serverless worker dispatch with immutable audit logging."*

---

### 89. CloudPulse AI: Autonomous AWS Well-Architected & FinOps Governance Agent
- **Repository:** [`github.com/akmalkhaniub/cloudpulse-ai`](https://github.com/akmalkhaniub/cloudpulse-ai)
- **Architectural Role:** Bedrock Converse API IaC Auditor, Graviton3 FinOps Modeler & Zero-Downtime Git Patch Synthesizer
- **Overview:** An autonomous cloud governance and FinOps engine built for the Amazon Developer Hackathon using the Amazon Bedrock Converse API to audit Terraform/OpenTofu HCL manifests against the AWS Well-Architected Framework and synthesize reviewable Git remediation diffs.
- **Key Technical Details:**
  - Built on the AWS Bedrock Converse API standard with Claude 3.5 Sonnet v2 cross-region inference profiles and strict JSON Schema tool calling (audit_iac_manifest, estimate_finops_savings, synthesize_remediation_diff).
  - AST-tolerant HCL lexer detecting unrestricted 0.0.0.0/0 SSH/RDP ingress, unencrypted storage volumes, and oversized x86 instances without requiring a live Terraform binary.
  - Projects annualized FinOps savings ($4,080/yr per cluster benchmarked) and AWS Graviton3 carbon offset reductions.
  - Synthesizes zero-downtime unified Git patches with a side-by-side diff viewer and companion sample IaC repository (cloudpulse-sample-iac).
- **Tech Stack:** Amazon Bedrock, Claude 3.5 Sonnet, Converse API, TypeScript, Terraform HCL, OpenTofu, FinOps
- **CV Bullet Point:**
  > *"Architected CloudPulse AI using the Amazon Bedrock Converse API and Claude 3.5 Sonnet to audit Terraform/OpenTofu manifests across Security, FinOps, and Sustainability pillars, identifying $4,080/yr cluster savings and generating unified Git remediation patches."*

---

### 90. Triage Inbox: Evidence-First Multi-Agent Maintainer Copilot for GitHub PRs
- **Repository:** [`github.com/akmalkhaniub/triage-inbox`](https://github.com/akmalkhaniub/triage-inbox)
- **Architectural Role:** Deterministic Git Diff & AST Grounded Release Note & Pull Request Auditor
- **Overview:** An evidence-first multi-agent system built for the micro1 AI Hackathon that audits software release notes and pull request reviews by grounding every single finding in physical Git commits, diffs, and AST changes before alerting maintainers.
- **Key Technical Details:**
  - Router Agent classifies incoming repository queue items and delegates to specialized auditors (Specialist G for Changelogs, Specialist E for PR Reviews).
  - Eliminates LLM hallucinations by requiring deterministic Git commit hash and line-level diff verification prior to surfacing findings.
  - Achieved 1.00 Precision (zero false alarms) vs 0.70 baseline and 0.87 Mean F1 score across live benchmark runs.
  - Multi-provider LLM routing (OpenAI, Anthropic, Groq, OpenRouter) with mandatory human-in-the-loop approval gates.
- **Tech Stack:** TypeScript, Python, Multi-Agent Swarm, Git Diff Grounding, AST Verification, OpenAI / Claude, CI Quality Gate
- **CV Bullet Point:**
  > *"Engineered Triage Inbox, an evidence-first multi-agent GitHub PR and release auditor that grounds every claim in physical Git diffs and AST changes, achieving 1.00 precision (zero false alarms) and 0.87 F1 vs 0.70 baseline."*

---

### 91. NexusGraph Enterprise: Hybrid GraphRAG Knowledge Mesh & Root-Cause Lineage
- **Repository:** [`github.com/akmalkhaniub/nexusgraph-enterprise`](https://github.com/akmalkhaniub/nexusgraph-enterprise)
- **Architectural Role:** Cross-Silo Enterprise Knowledge Graph with Weighted Reciprocal Rank Fusion (WRRF k=60)
- **Overview:** An enterprise Hybrid GraphRAG knowledge mesh built for the Galuxium Nexus V2 Hackathon that unifies fragmented SaaS silos (Jira tickets, GitHub PRs, Datadog APM traces, and Workday org graphs) to perform multi-hop causal root-cause investigation.
- **Key Technical Details:**
  - Typed enterprise knowledge graph connecting Incidents -> Affected Services -> Merged PRs -> Commit Authors across corporate data silos.
  - Dual-retrieval pipeline fusing dense cosine vector search with degree-constrained multi-hop breadth-first graph traversal via Weighted Reciprocal Rank Fusion (WRRF k=60).
  - Demonstrates 3-hop causal root-cause discovery from production outage alarm to offending pull request in under 45ms with 100% provenance verification.
  - TypeScript implementation with 5/5 passing unit assertions and zero hallucinated citations.
- **Tech Stack:** TypeScript, Hybrid GraphRAG, WRRF Fusion (k=60), Multi-Hop BFS, Vector Search, Knowledge Graph, Root-Cause Analysis
- **CV Bullet Point:**
  > *"Built NexusGraph Enterprise, a Hybrid GraphRAG engine uniting Jira, GitHub, and Datadog silos via Weighted Reciprocal Rank Fusion (WRRF k=60) of dense vector search and 3-hop graph traversal for sub-45ms root-cause lineage."*

---

### 92. TensorMesh RPA: Ultra-Low-Latency Visual Desktop Automation on H100 GPUs
- **Repository:** [`github.com/akmalkhaniub/tensormesh-rpa`](https://github.com/akmalkhaniub/tensormesh-rpa)
- **Architectural Role:** Sub-50ms TTFT Visual Grounding & Zero-Drift OS Desktop Automation via Nebius & NVIDIA NIM
- **Overview:** An autonomous OS-level Robotic Process Automation (RPA) platform powered by Nebius Token Factory and NVIDIA NIM on H100 SXM GPU clusters, grounding natural-language instructions into 1920x1080 screen coordinates for zero-drift GUI automation without APIs.
- **Key Technical Details:**
  - Dual-engine inference orchestrator running Meta-Llama-3.1-70B-Instruct on Nebius H100 80GB SXM with automatic failover to NVIDIA NIM (Llama-3.3-70B).
  - FP8 TensorRT-LLM quantization delivering sub-50ms Time-to-First-Token (TTFT) and 186.5 tokens/sec sustained throughput (>70% latency reduction vs FP16).
  - Visual Grounding Engine computing UI element centroids with strict spatial safety bounding boxes to prevent out-of-bounds OS clicks.
  - 100% passing test suite verifying coordinate grounding, failover routing, and multi-step desktop action sequences.
- **Tech Stack:** TypeScript, Nebius Token Factory, NVIDIA NIM, TensorRT-LLM FP8, H100 GPU, Llama 3.1 70B, Visual Grounding
- **CV Bullet Point:**
  > *"Engineered TensorMesh RPA, an OS-level visual desktop automation agent powered by Nebius Token Factory and NVIDIA NIM FP8 TensorRT-LLM on H100 GPUs, achieving sub-50ms TTFT and 186.5 tok/s with spatial boundary safety assertions."*

---

### 93. EdgeSentry: Edge Computer Vision Workplace Safety & Restricted Hazard Monitor
- **Repository:** [`github.com/akmalkhaniub/edgesentry-cv`](https://github.com/akmalkhaniub/edgesentry-cv)
- **Architectural Role:** 30+ FPS OpenCV ONNX Spatial Hazard Detection, HSV PPE Verification & AWS S3/SNS Alerting
- **Overview:** An industrial edge computer vision safety monitoring pipeline built for the OpenCV AI Competition 2026 (powered by AWS) that analyzes RTSP camera feeds at 30+ FPS to detect restricted danger-zone intrusions and PPE compliance violations.
- **Key Technical Details:**
  - Real-time edge detection using OpenCV cv2.dnn ONNX object detectors paired with HOG pedestrian fallback and pinhole camera depth estimation.
  - Polygonal hazard zone assertion via cv2.pointPolygonTest and high-visibility PPE vest inspection in HSV color space (cv2.inRange).
  - Temporal persistence debounce filter requiring multi-frame confirmation to eliminate false alarms from camera flicker or brief occlusions.
  - Automated incident snapshot dispatch to AWS S3 and real-time push alerting via Amazon SNS with full offline synthetic-frame test coverage.
- **Tech Stack:** Python 3.10+, OpenCV cv2.dnn, ONNX / YOLO, AWS S3 / SNS, Spatial Geometry, HSV PPE Inspection, Edge AI
- **CV Bullet Point:**
  > *"Developed EdgeSentry, a 30+ FPS edge computer vision workplace safety monitor using OpenCV cv2.dnn ONNX detection, pointPolygonTest spatial hazard checks, HSV PPE verification, temporal debounce filtering, and AWS S3/SNS alerting."*

---

### 94. Memorial Storyteller & Milestone Companion: Child-Safe Generative Video Platform
- **Repository:** [`github.com/akmalkhaniub/memorial-storyteller`](https://github.com/akmalkhaniub/memorial-storyteller)
- **Architectural Role:** Audio Denoising, Few-Shot Voice Cloning, Talking Portrait Animation & Guardian PIN Gate
- **Overview:** A child-safe generative AI mobile and backend platform enabling bereaved families to transform preserved WhatsApp voice notes and portrait photos into guardian-approved bedtime stories and milestone tribute videos.
- **Key Technical Details:**
  - 4-stage generative media pipeline: DeepFilterNet3 + Silero VAD audio restoration -> F5-TTS / ElevenLabs few-shot voice cloning -> LivePortrait / Hedra talking portrait animation -> FFmpeg 7 watermarking.
  - Mandatory Guardian Review Gate requiring parental biometric or 4-digit PIN approval before any synthesized video enters the child&#x27;s storybook player.
  - Audio SNR and harmonic clarity analyzer scoring noisy mobile recordings (.m4a, .ogg) prior to voice synthesis.
  - React Native (Expo SDK 52) mobile app paired with an asynchronous FastAPI / Pydantic v2 backend and encrypted S3/R2 media vault.
- **Tech Stack:** React Native, Expo SDK 52, FastAPI, Python 3.12+, DeepFilterNet3, F5-TTS / ElevenLabs, LivePortrait, FFmpeg 7, PostgreSQL
- **CV Bullet Point:**
  > *"Architected Memorial Storyteller, a child-safe generative audio/video platform combining DeepFilterNet3 speech enhancement, few-shot voice cloning, LivePortrait facial animation, and a PIN-protected Guardian Review Gate on Expo SDK 52 and FastAPI."*

---

### 95. Neuro-Symbolic ARC Solver: Program-Synthesis DSL Engine for ARC-AGI
- **Repository:** [`github.com/akmalkhaniub/arc-prize-solver-2026`](https://github.com/akmalkhaniub/arc-prize-solver-2026)
- **Architectural Role:** Zero-GPU Symbolic Program Synthesis & Exact-Match Grid Reasoning (91.7% Benchmark Solve Rate)
- **Overview:** A neuro-symbolic program-synthesis engine built for the Kaggle ARC Prize 2026 Code Competition that solves abstract visual reasoning tasks by searching compositions of pure NumPy Domain-Specific Language (DSL) grid transformations.
- **Key Technical Details:**
  - Rich NumPy DSL primitive library covering dihedral rotations, reflections, transpositions, gravity projection, flood-fill object extraction, periodic tiling, and bijective color re-mapping.
  - Depth-first iterative deepening program synthesizer with intermediate grid state hashing and pruning to eliminate redundant sub-trees.
  - Exact-match verification gate requiring 100% pixel identity across all demonstration pairs before emitting candidate test predictions.
  - Achieved a 91.7% solve rate (88/96 benchmark tasks) running purely on CPU with zero GPU dependency and valid Kaggle submission.json export.
- **Tech Stack:** Python 3.10+, NumPy DSL, Program Synthesis, ARC-AGI, Symbolic Search, Kaggle Competition
- **CV Bullet Point:**
  > *"Engineered a Neuro-Symbolic ARC-AGI Solver using pure NumPy DSL program synthesis and state-hashed depth-first search, achieving a 91.7% solve rate (88/96 benchmark tasks) with exact demonstration verification and zero GPU overhead."*

---

### 96. 3D Spatiotemporal Cell Tracker: Kalman-Assisted Hungarian Lineage Engine
- **Repository:** [`github.com/akmalkhaniub/biohub-cell-tracker`](https://github.com/akmalkhaniub/biohub-cell-tracker)
- **Architectural Role:** Anisotropic 3D Kalman Filtering, Hungarian Optimal Data Association & Mitosis Lineage Tracking
- **Overview:** A 3D developmental microscopy cell segmentation and spatiotemporal lineage tracking pipeline built for the CZ Biohub Kaggle Challenge, tracking dividing cells across volumetric time-lapses with zero ID switches.
- **Key Technical Details:**
  - 3D connected-component volumetric segmentation extracting anisotropic (z, y, x) cell centroids, bounding volumes, and intensity profiles.
  - Constant-velocity 6-state 3D Kalman Filter predicting inter-frame cellular motion trajectories across microscopy time steps.
  - Optimal global frame-to-frame assignment via the Hungarian algorithm (scipy.optimize.linear_sum_assignment) with gated Euclidean/anisotropic cost matrices.
  - Automated mitosis (cell division) parent-daughter lineage linker exporting standardized Cell Tracking Challenge (CTC res_track.txt) archives with 1.0 purity.
- **Tech Stack:** Python, SciPy Hungarian, 3D Kalman Filter, Volumetric Microscopy, CTC Lineage Format, Bioinformatics
- **CV Bullet Point:**
  > *"Built a 3D Spatiotemporal Cell Tracker for developmental microscopy using 6-state anisotropic Kalman filtering, Hungarian optimal data association, and automated mitosis lineage reconstruction, achieving 1.0 tracking purity and 0 ID switches."*

---

### 97. RSNA Knee Abnormality Detection: Multi-Sequence 2.5D Volumetric MRI Classifier
- **Repository:** [`github.com/akmalkhaniub/rsna-knee-classifier`](https://github.com/akmalkhaniub/rsna-knee-classifier)
- **Architectural Role:** Multi-Plane 2.5D ResNet-18 Volumetric MRI Fusion & Quadratic Weighted Kappa Calibration
- **Overview:** A multi-sequence volumetric knee MRI classification pipeline built for the RSNA Kaggle Competition to grade ACL tears, meniscal injuries, and cartilage defects across Sagittal, Coronal, and Axial planes.
- **Key Technical Details:**
  - Volumetric DICOM/NumPy preprocessing pipeline performing centre-of-mass slice selection, spatial resampling, and percentile z-score intensity normalization.
  - 2.5D multi-view ResNet-18 architecture fusing adjacent volumetric slices across Sagittal T2, Coronal PD, and Axial fat-suppressed MRI sequences.
  - End-to-end threshold calibration optimizing directly for the competition&#x27;s Quadratic Weighted Kappa (QWK) ordinal grading metric.
  - Deterministic inference pipeline outputting calibrated multi-class severity probabilities to Kaggle submission.csv.
- **Tech Stack:** Python, PyTorch, 2.5D ResNet-18, Volumetric MRI, DICOM Processing, Quadratic Weighted Kappa
- **CV Bullet Point:**
  > *"Developed a Multi-Sequence 2.5D Volumetric MRI Classifier in PyTorch for the RSNA Knee Abnormality Detection challenge, fusing Sagittal, Coronal, and Axial slices with Quadratic Weighted Kappa (QWK) threshold calibration."*

---

### 98. Kaggriculture MCTS: UCT Monte-Carlo Tree Search Digital-Twin Farming Agent
- **Repository:** [`github.com/akmalkhaniub/kaggriculture-mcts-agent`](https://github.com/akmalkhaniub/kaggriculture-mcts-agent)
- **Architectural Role:** Stochastic Forward-Model Agricultural Digital Twin & UCT Tree Search Policy Engine
- **Overview:** An autonomous agricultural planning agent built for the Kaggriculture Kaggle Simulation Competition that maximizes seasonal crop yield, revenue, and soil sustainability under stochastic weather and market dynamics.
- **Key Technical Details:**
  - Cloneable digital-twin forward simulation environment modeling soil moisture depletion, NPK nutrient balance, rainfall stochasticity, and crop growth stages.
  - Upper Confidence Bound for Trees (UCT) Monte-Carlo Tree Search (MCTS) planner evaluating multi-step irrigation, fertilization, and harvest policies.
  - Time-capped 40-iteration rollout horizon with domain-informed heuristic pruning to meet strict competition per-turn compute budgets.
  - Multi-objective reward shaping balancing net seasonal revenue against long-term soil health and water conservation penalties.
- **Tech Stack:** Python, MCTS UCT, Digital Twin, Stochastic Simulation, Sequential Decision AI, Kaggle
- **CV Bullet Point:**
  > *"Engineered Kaggriculture MCTS, an autonomous agricultural planning agent pairing a cloneable digital-twin crop simulator with Upper Confidence Bound for Trees (UCT) Monte-Carlo Tree Search to optimize yield under stochastic weather."*

---

### 99. Enterprise Procurement Agent: Multi-Agent Sourcing & ChromaDB RAG Workspace
- **Repository:** [`github.com/akmalkhaniub/enterprise-procurement-agent`](https://github.com/akmalkhaniub/enterprise-procurement-agent)
- **Architectural Role:** Autonomous Vendor Evaluation, Contract RAG & SQL Spend Analytics Dashboard
- **Overview:** A full-stack multi-agent enterprise procurement workspace combining a FastAPI backend, interactive Streamlit executive portal, LangChain agent orchestration, SQLite transactional spend analytics, and ChromaDB contract RAG.
- **Key Technical Details:**
  - Multi-agent procurement workflow coordinating vendor risk scoring, RFP clause comparison, and purchase order compliance checks.
  - Semantic vector retrieval over vendor master service agreements (MSAs) and SLA documents using ChromaDB embeddings.
  - Natural-language SQL spend analytics querying historical vendor pricing, delivery SLAs, and category budgets stored in SQLite.
  - Interactive Streamlit operations dashboard with real-time agent reasoning traces and downloadable audit reports.
- **Tech Stack:** Python, FastAPI, Streamlit, LangChain, ChromaDB RAG, SQLite, Procurement AI
- **CV Bullet Point:**
  > *"Built an Enterprise Procurement Agent workspace integrating FastAPI, LangChain, ChromaDB contract RAG, SQLite spend analytics, and a Streamlit operations portal to automate vendor evaluation and SLA compliance."*

---

### 100. HabitFlow Pro: Adaptive AI Habit Coach with Native RevenueCat Subscriptions
- **Repository:** [`github.com/akmalkhaniub/habitflow-pro`](https://github.com/akmalkhaniub/habitflow-pro)
- **Architectural Role:** Cross-Platform Expo / React Native Mobile App with Adaptive Coaching & In-App Entitlements
- **Overview:** A shipped cross-platform mobile application built for the RevenueCat Shipaton 2026 on Expo and React Native, featuring an adaptive habit intelligence engine, streak-shielding burnout defense, and native RevenueCat subscription paywalls.
- **Key Technical Details:**
  - Adaptive coaching engine analyzing completion velocity, time-of-day friction, and streak risk to recommend habit stacking and burnout recovery.
  - Native RevenueCat SDK (react-native-purchases) integration gating pro_access entitlements across Monthly, Annual, and Lifetime paywall offerings.
  - Abstracted purchase provider architecture toggling seamlessly between live App Store / Play Store billing and a deterministic simulator store for CI/CD.
  - Offline-first AsyncStorage state persistence with 36/36 unit tests passing across habit logic, entitlement gating, and coaching heuristics.
- **Tech Stack:** Expo, React Native, RevenueCat SDK, TypeScript, AsyncStorage, Mobile Paywalls, Vitest
- **CV Bullet Point:**
  > *"Shipped HabitFlow Pro for RevenueCat Shipaton 2026, a cross-platform Expo and React Native mobile app with an adaptive habit coaching engine, offline-first AsyncStorage sync, RevenueCat pro_access entitlement paywalls, and 36/36 passing unit tests."*

---

### 101. System Design Master Vault: Distributed Systems Knowledge Base & SM-2 Trainer
- **Repository:** [`github.com/akmalkhaniub/sysdesign-vault`](https://github.com/akmalkhaniub/sysdesign-vault)
- **Architectural Role:** Interactive Architecture Canvas, Time-Synced Transcript Search, SM-2 Flashcards & Obsidian Exporter
- **Overview:** An interactive full-stack distributed systems curriculum, spaced-repetition trainer, and architectural interview simulator built with Next.js 14 and FastAPI 2.0 Async.
- **Key Technical Details:**
  - Curated system design catalog covering Rate Limiters, Raft/Paxos Consensus, Consistent Hashing, Sharding, Kafka Queues, and API Gateways with Mermaid/Cytoscape canvases.
  - SuperMemo-2 (SM-2) spaced repetition engine computing dynamic easiness factors (EF) and optimal review intervals from user confidence ratings (0-5).
  - Time-synchronized video transcript parser and full-text chapter search engine powered by asynchronous SQLAlchemy and PostgreSQL/SQLite.
  - 1-click Obsidian Vault ZIP exporter generating cross-linked Markdown notes with YAML frontmatter, plus a 45-minute FAANG mock interview simulator.
- **Tech Stack:** Next.js 14, TypeScript, FastAPI, SQLAlchemy Async, PostgreSQL / SQLite, Mermaid.js, SM-2 Algorithm, Obsidian Export
- **CV Bullet Point:**
  > *"Architected System Design Master Vault, a full-stack distributed systems platform in Next.js 14 and FastAPI featuring time-synced transcript search, an SM-2 spaced repetition engine, interactive Mermaid canvases, and 1-click Obsidian vault export."*

---

### 102. OpenAI Codex Engineering Curriculum & Production Video Audition Suite
- **Repository:** [`github.com/akmalkhaniub/pluralsight-openai-codex-auditions`](https://github.com/akmalkhaniub/pluralsight-openai-codex-auditions)
- **Architectural Role:** 10 End-to-End Instructional Packages on Autonomous TDD Loops, MCP Servers, Custom Skills & AGENTS.md
- **Overview:** A comprehensive suite of 10 production-ready instructional engineering packages and working codebases demonstrating advanced software engineering workflows with the OpenAI Codex CLI and VS Code Extension.
- **Key Technical Details:**
  - 10 complete hands-on modules covering Autonomous TDD Loops, Custom Reusable Skills (.codex/skills), Visual Multi-File Refactoring, and Model Context Protocol (MCP) database inspection.
  - Deterministic agent governance patterns using hierarchical AGENTS.md rules to enforce package whitelists, error hierarchies, and pytest execution gates.
  - Automated AI Code Review workflows (&#x27;Who Reviews the AI?&#x27;) catching SQL injection, race conditions, and subtle regressions in AI-generated pull requests.
  - Includes working Python/FastAPI demo repositories, pytest verification suites, slide decks, and second-by-second narration scripts.
- **Tech Stack:** OpenAI Codex, Model Context Protocol, AGENTS.md, Python, FastAPI, Pytest, VS Code Extension
- **CV Bullet Point:**
  > *"Authored a 10-module OpenAI Codex Engineering Curriculum covering autonomous TDD loops, custom .codex/skills, live MCP database inspection, AGENTS.md governance invariants, and automated AI PR security code reviews."*

---

## 🎯 CV Update Strategy & Placement Guide

### Recommended Placement for Different Senior Job Roles:

#### 1. Targeting **Real-Time Voice AI / Speech Systems Engineer**:
- **Headline Projects:** **VoicePilot AI**, **CallPulse**, **VoiceEval**, **Telephony Bridge Go**, **Audio DSP Rs**
- **Emphasize:** Sub-300ms roundtrip audio latency, Silero VAD v5 ONNX barge-in cutoff (<20ms), carrier-grade SIP/RTP media gateways in Go, and 232M samples/s zero-allocation DSP in Rust.

#### 2. Targeting **Staff / Principal AI Engineer / AI Architect**:
- **Headline Projects:** **VoicePilot AI**, **Agent Fleet Orchestrator**, **Ops MCP Suite**, **SpecForge**, **Enterprise Cloud-Native API Gateway**
- **Emphasize:** Real-time multimodal streaming, multi-agent DAG orchestration, FastMCP / Model Context Protocol tooling, closed-loop AST verification, and prompt FinOps cost reductions (38–45%).

#### 3. Targeting **Senior Backend / Distributed Systems Engineer (Go / Rust / Python)**:
- **Headline Projects:** **ApexLedger**, **Telephony Bridge Go**, **Audio DSP Rs**, **Enterprise Cloud-Native API Gateway Platform**, **Go High-Concurrency Reverse Proxy**, **LogPulse-rs**
- **Emphasize:** Double-entry ledger invariants, zero-allocation memory pooling (`sync.Pool`), SIMD DSP processing, LuaJIT crypto validation, and sub-millisecond tail latencies.

---
*Master report updated on October 17, 2026 (102 Verified Systems). Maintained by Akmal Khan, PhD.*