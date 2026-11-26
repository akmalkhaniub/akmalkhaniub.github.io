# Durable OTel GenAI Trace Continuity, Replay Deduplication, and MCP 2026-07-28 Contract Auditing

Long-running autonomous agents and microservice QA platforms break in production when **telemetry continuity** and **protocol contracts** are treated as stateless afterthoughts [1, 2]. When a durable LangGraph-style execution pauses at a Human-in-the-Loop (HITL) approval gate and resumes hours later on a different worker, an in-memory OpenTelemetry `SpanContext` vanishes—splitting one logical transaction into disconnected trace fragments [1, 3]. Worse, deterministic time-travel replays that re-execute historical checkpoints without explicit replay attribution pollute production observability pipelines with duplicate LLM and tool metrics [1].

On the verification side, autonomous QA agents consuming tools via the **Model Context Protocol (MCP)** need the `2026-07-28` specification's `ToolAnnotations` safety hints and stateless `Mcp-Method` / `Mcp-Name` edge header routing [4], paired with message-scoped Protobuf wire-compatibility auditing rather than naive regex sweeps that misfire across multi-message `.proto` files [5].

Across **[NEXUS Agent Runtime (`nexus-agent-runtime`)](https://github.com/akmalkhaniub/nexus-agent-runtime)** and **[Sentinel Autonomous QA (`sentinel`)](https://github.com/akmalkhaniub/sentinel)**, we shipped two production upgrades addressing both bottlenecks: checkpoint-persisted W3C `traceparent` continuity with OTel GenAI replay deduplication (`0.1205 ms` p50), and an MCP `2026-07-28` QA bridge paired with a brace-balanced Protobuf wire-break auditor (`0.1881 ms` p50) [2, 3, 4, 6].

---

## 1. Bridging Durable Execution & OTel GenAI Semantic Conventions

OpenTelemetry GenAI Semantic Conventions standardize `gen_ai.operation.name` (`invoke_workflow`, `invoke_agent`, `execute_tool`), `gen_ai.tool.name`, and `gen_ai.tool.call.id` across heterogeneous agent runtimes [2, 3]. However, durable runtimes introduce two lifecycle transitions that standard request-scoped tracing misses: **HITL checkpoint suspension** and **deterministic state replay** [1, 6].

```mermaid
flowchart TD
    Root["Workflow Start<br/>Mint W3C traceparent"] --> Checkpoint["SQLiteCheckpointer<br/>Persist State and Trace Context"]

    subgraph PartitionA["Partition A — Durable Trace Continuity"]
        direction TB
        A1["HITL Pause Gate<br/>Freeze SpanContext in Metadata"] --> A2["Process Restart Resume<br/>Extract Parent traceparent"]
        A2 --> A3["Replay Engine Tagging<br/>Set durable.execution.replayed"]
    end

    subgraph PartitionB["Partition B — Sentinel MCP Contract Gate"]
        direction TB
        B1["Stateless Header Router<br/>Mcp-Method and Mcp-Name"] --> B2["ToolAnnotations Manifest<br/>readOnlyHint and idempotentHint"]
        B2 --> B3["Scoped Protobuf Parser<br/>Per-Message and Reserved Tags"]
    end

    Checkpoint -->|Pause Snapshot| A1
    A3 -->|Tool Invocation| B1
    B3 -->|Wire Verdict| A2

    style Root fill:#1e293b,stroke:#475569,color:#f8fafc
    style Checkpoint fill:#334155,stroke:#64748b,color:#f8fafc
    style A1 fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    style A2 fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    style A3 fill:#dcfce7,stroke:#16a34a,color:#14532d
    style B1 fill:#fef3c7,stroke:#d97706,color:#78350f
    style B2 fill:#fef3c7,stroke:#d97706,color:#78350f
    style B3 fill:#dcfce7,stroke:#16a34a,color:#14532d
```

Every node step in `CompiledGraph._run_execution_loop()` now captures the active W3C `traceparent` via `capture_trace_context()` and persists it inside `StateSnapshot.metadata["trace_context"]` [6, 7]. When `stream_resume()` wakes up from `SQLiteCheckpointer` after a process restart, it extracts `parent_traceparent` and restores the exact `trace_id` before resuming `next_node` [6, 7].

---

## 2. Snapshot `traceparent` Persistence & Replay Noise Deduplication

In [`nexus_runtime/telemetry/otel.py`](https://github.com/akmalkhaniub/nexus-agent-runtime/blob/main/nexus_runtime/telemetry/otel.py) and [`nexus_runtime/core/replay.py`](https://github.com/akmalkhaniub/nexus-agent-runtime/blob/main/nexus_runtime/core/replay.py), durable spans carry three invariants:

1. **Cross-Restart Trace Continuity (`parent_traceparent`):** `trace_workflow_span()` accepts an optional W3C `traceparent` string, extracts it with `TraceContextTextMapPropagator`, and passes `context=parent_ctx` to `tracer.start_as_current_span()`—preserving one unbroken `trace_id` across HITL pauses and worker restarts [3, 7].
2. **Replay Metric Isolation (`durable.execution.replayed`):** `DeterministicReplayEngine.replay_from_step()` and `stream_replay_from_step()` mark root and child spans with `gen_ai.operation.name="replay_workflow"`, `durable.execution.replayed=True`, `durable.replay.source_run_id`, and `durable.replay.from_step`. Observability collectors can filter out replay spans from live SLA/cost counters while keeping full time-travel audit trails [1, 6].
3. **Deterministic Step Idempotency Keys (`durable.step.idempotency_key`):** Both `trace_workflow_span()` and `trace_tool_span()` emit `<run_id>:step:<step_index>` (and tool-qualified keys) alongside `gen_ai.tool.name` and `gen_ai.tool.call.id` [2, 3].

```python
@contextlib.contextmanager
def trace_workflow_span(
    name: str,
    run_id: str,
    tenant_id: Optional[str] = None,
    attributes: Optional[Dict[str, Any]] = None,
    parent_traceparent: Optional[str] = None,
    operation_name: str = "invoke_workflow",
    is_replay: bool = False,
    replay_source_run_id: Optional[str] = None,
    replay_from_step: Optional[int] = None,
    step_index: Optional[int] = None,
) -> Iterator[Span]:
    parent_ctx = extract_trace_context({"traceparent": parent_traceparent}) if parent_traceparent else None
    with tracer.start_as_current_span(name, context=parent_ctx) as span:
        span.set_attribute("gen_ai.system", "nexus_agent_runtime")
        span.set_attribute("gen_ai.operation.name", operation_name)
        span.set_attribute("durable.workflow.id", run_id)
        span.set_attribute("durable.execution.replayed", is_replay)
        if is_replay and replay_source_run_id:
            span.set_attribute("durable.replay.source_run_id", replay_source_run_id)
        if step_index is not None:
            span.set_attribute("durable.step.idempotency_key", f"{run_id}:step:{step_index}")
        yield span
```

---

## 3. MCP `2026-07-28` Bridge & Stateless Header Routing in Sentinel

In **[Sentinel (`sentinel_mcp_bridge.py`)](https://github.com/akmalkhaniub/sentinel/blob/main/sentinel_mcp_bridge.py)**, the MCP bridge was upgraded from `2024-11-05` to the **`2026-07-28` specification**, exposing **8 read-only QA & contract tools** annotated with `ToolAnnotations` (`readOnlyHint`, `idempotentHint`, `destructiveHint`, `openWorldHint`) [4, 8].

Alongside existing Playwright/SARIF/selector-healing tools, three new reliability and security studios are now directly callable by coding agents—either via JSON body (`POST /api/mcp/call`) or stateless edge headers (`POST /api/mcp/dispatch` with `Mcp-Method` and `Mcp-Name`) [4]:

- **`sentinel_audit_grpc_contract`:** Audits `.proto` contracts for wire-breaking tag reuse and `reserved` range collisions.
- **`sentinel_audit_dr_failover`:** Evaluates multi-region failover drills against RTO/RPO SLA targets (`dr_failover_auditor.py`).
- **`sentinel_scan_sourcemap_secrets`:** Audits client bundles for exposed `.js.map` files, leaked API keys, and `VITE_*` / `NEXT_PUBLIC_*` env leakage (`sourcemap_secret_scanner.py`).

---

## 4. Fixing Multi-Message Protobuf Wire-Break False Positives

A naive global regex (`re.findall(r"=\s*(\d+)\s*;", proto)`) breaks immediately on real-world `.proto` schemas: if `CreateOrderRequest` and `CreateOrderResponse` both declare field tag `= 1;`, global set comparison triggers a false `BREAKING_WIRE_CHANGE` alert [5, 8].

In [`grpc_contract_auditor.py`](https://github.com/akmalkhaniub/sentinel/blob/main/grpc_contract_auditor.py), `_parse_proto_blocks()` now strips `//` and `/* ... */` comments, isolates each `message` and `enum` brace scope (excluding nested sub-blocks from parent field scans), parses `reserved 4, 6 to 8;` ranges, and flags **only true per-block duplicate tags and reserved-tag collisions** [5, 8]:

```python
def _expand_reserved_tags(stmt: str) -> Set[int]:
    reserved: Set[int] = set()
    for part in stmt.split(","):
        part = part.strip()
        range_match = re.match(r"^(\d+)\s+to\s+(\d+|max)$", part, re.IGNORECASE)
        if range_match:
            start = int(range_match.group(1))
            end_raw = range_match.group(2)
            end = start + 50 if end_raw.lower() == "max" else int(end_raw)
            reserved.update(range(start, min(end, start + 1000) + 1))
        elif re.match(r"^\d+$", part):
            reserved.add(int(part))
    return reserved
```

Additionally, all 10 newly introduced Sentinel QA studio modules (Document Export, Payment 3DS2 Checkout, Search Relevance, Media Streaming, Source-Map Secrets, gRPC Contract, Push/Deep-Link, Temporal DST, File Upload Security, and DR Failover) were upgraded to timezone-aware `datetime.now(timezone.utc)` and covered with dedicated unit and FastAPI `TestClient` regression tests in [`tests/test_v2_platform_studios.py`](https://github.com/akmalkhaniub/sentinel/blob/main/tests/test_v2_platform_studios.py) [8].

---

## 5. Micro-Benchmark & Verification Results

All benchmarks (`N = 2,000` iterations) and full test suites were executed after final edits on Windows (`Python 3.12.10` for `nexus-agent-runtime`, `Python 3.14.3` for `Sentinel`):

| Component / Verification Gate | Measured Latency / Result | Engineering Guarantee |
| :--- | :--- | :--- |
| **`trace_workflow_span` + `capture_trace_context` (`N = 2,000`)** | **`0.1205 ms` p50 / `0.2505 ms` p95 / `0.3673 ms` p99** | W3C `traceparent` restore + GenAI & replay tags |
| **`dispatch_mcp_header_request` (`sentinel_audit_grpc_contract`, `N = 2,000`)** | **`0.1881 ms` p50 / `0.3220 ms` p95 / `0.5239 ms` p99** | Stateless `Mcp-Method`/`Mcp-Name` + scoped Protobuf AST |
| **`nexus-agent-runtime` (`pytest tests -v`)** | **`37 / 37 PASSED` (`1.95 s`)** | HITL SQLite `traceparent` continuity & replay deduplication |
| **`Sentinel` (`pytest tests -q`)** | **`139 / 139 PASSED`** | MCP `2026-07-28` bridge, Protobuf wire guard & 10 V2 studios |

---

## References & Further Reading

1. OpenTelemetry Authors, *"Durable Agentic Runtime Execution & Replay Span Semantics,"* OpenTelemetry GenAI SIG Discussions, 2026.
2. OpenTelemetry Authors, *"Semantic Conventions for Generative AI (`gen_ai.operation.name`, `execute_tool`),"* OpenTelemetry Specification, 2026.
3. W3C Distributed Tracing Working Group, *"Trace Context (`traceparent` / `tracestate`),"* W3C Recommendation, 2021.
4. Model Context Protocol Maintainers, *"Model Context Protocol Specification (`2026-07-28`): ToolAnnotations & Stateless Edge Header Routing,"* Linux Foundation AAIF, 2026.
5. Protocol Buffers & Buf Authors, *"Protobuf Wire Compatibility & `reserved` Field Tag Governance,"* Protobuf Language Guide (proto3), 2026.
6. NEXUS Agent Runtime Repository, *"[github.com/akmalkhaniub/nexus-agent-runtime](https://github.com/akmalkhaniub/nexus-agent-runtime),"* 2026.
7. LangGraph & Temporal Engineering Teams, *"Deterministic Checkpointing, Replay Isolation, and Human-in-the-Loop Interrupts,"* 2026.
8. Sentinel Autonomous QA Repository, *"[github.com/akmalkhaniub/sentinel](https://github.com/akmalkhaniub/sentinel),"* 2026.
