---
name: code-and-benchmark-verifier
description: >-
  Validates, formats, and synthesizes production-grade, syntactically flawless code snippets
  and runnable micro-benchmark harnesses in TypeScript, Rust, Go, or Python. Eliminates
  toy/pseudocode examples and guarantees that all APIs, types, and directives match current LTS
  specifications (Next.js 16 'use cache', React 19 Action types, TypeScript 7). Enforces realistic
  error boundaries, memory management, and reproducible latency/throughput testing scripts.
---

# Code & Benchmark Verifier: Production Rigor & Empirical Proof

Engineering credibility hinges on the authenticity of code and data. When a senior systems architect reads a technical essay, they scrutinize the code blocks and benchmarks first. 

If a code snippet uses broken TypeScript types, relies on deprecated APIs, or invents fictional runtime functions, the entire essay is discredited. If an author claims a "90% latency reduction" without a reproducible benchmark harness, the claim is dismissed as marketing hype.

This skill ensures that every piece of code in the publication is **syntactically flawless, production-hardened, and empirically reproducible**.

---

## 🛠️ The 4 Core Responsibilities

### 1. Bleeding-Edge API & Type Correctness
* **No Deprecated Patterns**: Never write obsolete APIs (e.g., Next.js 14 `unstable_cache`, old React 18 `useEffect` data fetching, or outdated Babel AST nodes).
* **Strict Type Safety**: All TypeScript must be valid TypeScript 7 / React 19 code. Use real generic types, explicit return signatures, and exhaustive pattern matching.
* **Current Framework Idioms**: Use the modern standard directives (e.g., Next.js 16 `'use cache'`, `cacheLife()`, React 19 `useActionState`, Server Actions with cryptographically bound signatures).

### 2. Elimination of Toy / Pseudocode Examples
* **No "Foo / Bar / Baz"**: Replace academic toy variables with real-world enterprise domain models (e.g., `PaymentIntentSession`, `VectorSearchPartition`, `MultiRaftLogBatch`).
* **Realistic Error Handling**: Every production snippet must demonstrate defensive programming: connection timeouts, cancellation tokens (`AbortSignal`), structured logging, and fallback states.

### 3. Reproducible Micro-Benchmark Harnesses
Whenever an essay makes performance claims (e.g., *"reduced P99 latency by 45%"* or *"slashed V8 heap allocations"*), provide a standalone, runnable benchmark script:
* **Tools**: Node.js `performance.now()`, Autocannon, k6, or Rust criterion.
* **Warmup & P-Values**: Include a proper JVM/V8 JIT warmup phase (e.g., 10,000 iterations before recording) to prevent cold JIT bias.
* **System Metrics**: Report P50, P90, P99, and memory allocation deltas (`process.memoryUsage().heapUsed`).

### 4. Bytecode & AST Transformation Diffs
When explaining compilers or runtimes (React Compiler, Turbopack, SWC, Babel):
* Provide an explicit **Before vs After** code diff showing the un-memoized input TypeScript versus the lowered SSA / array-indexed cache bytecode emitted by the compiler.

---

## 📋 Pre-Flight Code Checklist

Before any code block is approved for publication:
- [ ] Compiles cleanly under the target language's latest stable compiler.
- [ ] Contains no fictional imports or untyped `any` wildcards.
- [ ] Demonstrates real-world error boundaries and edge-case handling.
- [ ] Benchmarks specify exact hardware, OS, and runtime flags (e.g. Node 24, V8 12.x).
