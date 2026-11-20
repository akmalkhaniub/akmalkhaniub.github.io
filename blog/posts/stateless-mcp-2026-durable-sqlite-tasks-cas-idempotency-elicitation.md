# Stateless MCP (`2026-07-28`): Durable SQLite Tasks v2, Optimistic Concurrency CAS, Idempotency Keys & `input-required` Elicitation

Early Model Context Protocol (MCP) HTTP deployments relied on stateful server initialization (`initialize` + `Mcp-Session-Id`) backed by in-memory dictionaries [1]. Under Kubernetes horizontal autoscaling or non-sticky round-robin load balancers, the moment a client's `tools/call` lands on `replica-2` instead of `replica-1`, the server throws `SESSION_NOT_FOUND` and fractures the agent workflow [1, 2].

The **`2026-07-28` Stateless MCP specification (`SEP-2577`)** eliminates connection-pinned state by carrying per-request capabilities in `_meta`, delegating interactive human input to **`input-required` elicitation** (Form & URL modes), and persisting long-running operations as **durable Tasks v2** [1, 2]. Yet stateless scale introduces two classic distributed systems hazards: **duplicate task creation** under client retries and **lost-update races** during concurrent `tasks/update` / `tasks/cancel` calls [3, 4].

In **[MCP Studio Tasks (`mcp-studio-tasks`)](https://github.com/akmalkhaniub/mcp-studio-tasks)**, we pair a stateless multi-replica MCP server with **SQLite-persisted durable Tasks**, **idempotency-key deduplication**, **`expectedVersion` Optimistic Concurrency Control (CAS)**, **HMAC-signed opaque client state**, and **W3C `traceparent` `_meta` propagation** [1, 3, 5].

---

## 1. Stateless Replicas vs. Legacy Sticky Sessions (`SEP-2577`)

In [`src/mcp_studio_tasks/server.py`](https://github.com/akmalkhaniub/mcp-studio-tasks/blob/main/src/mcp_studio_tasks/server.py), `/mcp/legacy` preserves the `2024-11-05` in-memory `Mcp-Session-Id` table specifically to demonstrate load-balancer failure across instances, whereas `/mcp` executes purely from per-request `_meta.capabilities`, verified caller identity (`owner_sub`), and shared SQLite persistence:

```mermaid
flowchart TD
    Client["MCP Agent Client<br/>Round-Robin HTTP Load Balancer"] --> Router["Stateless vs Legacy Endpoint"]

    subgraph PartitionA["Partition A — Legacy Sticky Session 2024-11-05"]
        direction TB
        A1["initialize on replica-1<br/>Stores Mcp-Session-Id in RAM"] --> A2["Next RPC Hits replica-2<br/>In-Memory Session Missing"]
        A2 --> A3["Fails with SESSION_NOT_FOUND<br/>Breaks Horizontal Autoscaling"]
    end

    subgraph PartitionB["Partition B — Stateless 2026-07-28 + Durable SQLite"]
        direction TB
        B1["Per-Request _meta Capabilities<br/>Any Replica Serves RPC Safely"] --> B2["Idempotency-Key Deduplication<br/>Returns Existing taskId on Retry"]
        B2 --> B3["CAS expectedVersion Update<br/>Blocks Stale Race with Conflict"]
    end

    Router -->|Sticky Session| A1
    Router -->|Stateless Spec| B1

    style Client fill:#1e293b,stroke:#475569,color:#f8fafc
    style Router fill:#334155,stroke:#64748b,color:#f8fafc
    style A1 fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
    style A2 fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
    style A3 fill:#fecaca,stroke:#b91c1c,color:#7f1d1d
    style B1 fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    style B2 fill:#dcfce7,stroke:#16a34a,color:#14532d
    style B3 fill:#bbf7d0,stroke:#15803d,color:#14532d
```

---

## 2. Five Non-Negotiable State & Elicitation Invariants

1. **Handle $\neq$ Authorization (`INV-ADV-02`):** Presenting a valid `cart_id` or `taskId` never grants implicit access. Both `DurableCartStore` and `TaskManager` verify `row["owner_sub"] == caller_sub` before returning or mutating state, raising JSON-RPC `-32003` on cross-tenant access [1, 3].
2. **Untrusted Round-Trip State (`INV-ADV-03`):** Stateless pagination cursors (`OpaquePaginationState`) are serialized, authenticated with HMAC-SHA256 (`SignedOpaqueStateManager`), and validated via strict Pydantic `extra="forbid"` schemas with TTL expiry so tampered cursors fail closed.
3. **Secrets Never Enter Form Elicitation (`INV-ADV-04`):** `validate_form_schema_safety()` rejects form schemas containing keys such as `password`, `api_key`, `secret`, `token`, `card_number`, `cvv`, or `ssn`, requiring **URL-mode elicitation** (`mode="url"`) for out-of-band billing or credential entry [1].
4. **Idempotent Task Creation (`idx_mcp_tasks_idempotency`):** `create_task()` enforces a partial SQLite unique index over `(owner_sub, tool_name, idempotency_key)`. If an agent retries a timed-out `render_briefing_video` call on `replica-2`, the server returns the original `taskId` (`"deduplicated": true`) without spawning a second background worker [4].
5. **Optimistic Concurrency Control (`expectedVersion` CAS):** Every SQLite mutation increments `version = version + 1`. Passing `expectedVersion` in `tasks/update` or `tasks/cancel` executes an atomic `UPDATE ... WHERE task_id = ? AND version = ?`; stale writers receive JSON-RPC `-32009` (`TaskConflictError`) rather than overwriting a completed or cancelled task [3].

```python
with self._connect() as conn:
    if expected_version is not None:
        cur = conn.execute(
            """
            UPDATE mcp_tasks
            SET status = 'completed', progress = total, status_message = ?,
                elicitation_json = NULL, result_json = ?, version = version + 1, updated_at = ?
            WHERE task_id = ? AND version = ?
            """,
            (f"Completed at {quality}", json.dumps(final_res), time.time(), task_id, int(expected_version)),
        )
    else:
        cur = conn.execute(
            """
            UPDATE mcp_tasks
            SET status = 'completed', progress = total, status_message = ?,
                elicitation_json = NULL, result_json = ?, version = version + 1, updated_at = ?
            WHERE task_id = ?
            """,
            (f"Completed at {quality}", json.dumps(final_res), time.time(), task_id),
        )
    if cur.rowcount == 0:
        raise TaskConflictError(f"Optimistic concurrency conflict updating task '{task_id}'.")
    conn.commit()
```

---

## 3. Context-Aware Completions, Multimodal Content & W3C Trace Continuity

To bridge modern client UX without sacrificing server-side validation, `mcp-studio-tasks` exposes:

- **Context-Aware `completion/complete` (`REQ-ADV-04`):** Filters prompt arguments (`report_template`, `region`) dynamically for IDE/chat autocomplete while still enforcing strict server validation in `prompts/get` (preventing client-bypassed enumeration).
- **All 6 MCP Result Types:** `build_analytics_packet` returns `text`, `structuredContent`, PNG `image`, WAV `audio`, `resource_link`, and embedded `resource` blocks with explicit token-overhead accounting.
- **Stateless `_meta.traceparent` Continuity:** Every `/mcp` response echoes or initializes a W3C `traceparent` inside `_meta` alongside `serverInstance` and `protocolVersion`, preserving distributed trace lineage across `replica-1` and `replica-2` [5].

> [!TIP]
> Combining SQLite partial unique indexes (`WHERE idempotency_key IS NOT NULL`) with integer `version` Compare-And-Swap gives stateless MCP servers **exactly-once task semantics** with zero external Redis or distributed lock manager dependencies.

---

## 4. Micro-Benchmark & Verification Results

We benchmarked $N = 50$ cycles of durable task creation, idempotency-key deduplication across replicas, and CAS-versioned `tasks/update` in SQLite, alongside the full 13-test FastAPI/agent suite (`uv run pytest -v`):

| Operation / Verification Suite | Measured Result | Architectural Guarantee |
| :--- | :--- | :--- |
| **Durable SQLite Task Creation (`p50` / `p95`, $N = 50$)** | **`13.04 ms` / `17.39 ms`** | Persists `version = 1`, `owner_sub`, and `elicitation_json` |
| **Idempotency-Key Deduplicated Hit (`p50` / `p95`, $N = 50$)** | **`2.17 ms` / `6.82 ms`** | `6.0x` faster than duplicate insert; zero double-workers |
| **Versioned CAS `tasks/update` (`p50` / `p95`, $N = 50$)** | **`11.66 ms` / `18.26 ms`** | Rejects stale `expectedVersion` with JSON-RPC `-32009` |
| **Full Automated Test Suite (`uv run pytest -v`)** | **`13 / 13 PASSED` (`3.25 s`)** | Covers stateless replicas, CAS, elicitation, and chat E2E |

---

## References & Further Reading

1. Anthropic & Linux Foundation, *"Model Context Protocol (MCP) 2026-07-28 Stateless Specification (`SEP-2577`), Elicitation & Tasks v2,"* 2026.
2. M. Kleppmann, *"Designing Data-Intensive Applications: Linearizability, Compare-And-Set, and Idempotent Operations,"* O'Reilly Media, 2017.
3. H. T. Kung and J. T. Robinson, *"On Optimistic Methods for Concurrency Control,"* *ACM Transactions on Database Systems (TODS)*, vol. 6, no. 2, pp. 213–226, 1981.
4. Stripe Engineering, *"Designing Robust and Predictable APIs with Idempotency Keys,"* Stripe Engineering Blog, 2017–2025.
5. W3C Distributed Tracing Working Group, *"Trace Context Level 2 (`traceparent` / `tracestate`),"* W3C Recommendation, 2024.
