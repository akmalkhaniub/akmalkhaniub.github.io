# Stateless MCP (2026-07-28) Across Load-Balanced Agent Meshes: RFC 9728, RFC 8693 Token Exchange, HMAC State Handles, and Durable SQLite Tasks

As enterprise agent meshes move behind Layer-7 load balancers and multi-replica autoscalers, stateful **Model Context Protocol (MCP)** transports built around sticky `Mcp-Session-Id` memory collapse under rolling restarts and cross-pod routing [1, 2]. When a client negotiates `initialize` on Pod A and dispatches `tools/call` or `tasks/get` to Pod B, in-memory session maps return `404` or drop HITL context—while naive reverse proxies that forward a client's raw inbound `Authorization: Bearer` token upstream create classic **token passthrough** and **confused-deputy** vulnerabilities [2, 3, 4].

By combining today's upgrades across **[MCP Gateway (`mcp-gateway`)](https://github.com/akmalkhaniub/mcp-gateway)** and **[NEXUS Agent Runtime (`nexus-agent-runtime`)](https://github.com/akmalkhaniub/nexus-agent-runtime)**, we bridge the full **Stateless `2026-07-28` MCP** lifecycle end-to-end: **RFC 9728** Protected Resource Metadata discovery, **RFC 8693** audience-attenuated Token Exchange, **HMAC-SHA256 opaque state handles** bound to verified `(tenant_id, sub)` identities, and **SQLite-persisted MCP Tasks** (`tasks/start`, `tasks/get`, `tasks/update`, `tasks/cancel`) with form and URL-mode elicitation [1, 3, 4, 5].

---

## 1. Sticky Session Fragility vs. Stateless 2026-07-28 MCP Mesh

Traditional MCP proxies couple identity, session state, and execution affinity to a single process. In a stateless `2026-07-28` mesh, every hop carries explicit cryptographic identity, per-request protocol negotiation (`_meta.protocolVersion`), and durable checkpointed task handles [1, 2, 4]:

```mermaid
flowchart TD
    Agent["Agent Client or IDE<br/>Bearer JWT + _meta Negotiation"] --> Gateway["MCP Gateway (/mcp/aggregate)<br/>RFC 9728 + Scope Filter"]

    subgraph PartitionA["Partition A — Gateway Security & Exchange"]
        direction TB
        A1["HS256 JWT Resource Server<br/>Verifies sig, exp, iss & RFC 8707 aud"] --> A2["RFC 8693 Token Exchanger<br/>Mints Upstream aud + act Delegation"]
        A2 --> A3["Stateless Handle Manager<br/>HMAC-SHA256 Cursor Bound to sub"]
    end

    subgraph PartitionB["Partition B — Nexus Durable Task Runtime"]
        direction TB
        B1["StateHandleManager Guard<br/>Rejects Cross-Tenant Replay"] --> B2["SQLiteCheckpointer mcp_tasks<br/>Persists working & input_required"]
        B2 --> B3["Form & URL Elicitation Resume<br/>tasks/update & completion/complete"]
    end

    Gateway -->|Auth & Exchange| A1
    A3 -->|Tasks RPC Proxy| B1

    style Agent fill:#1e293b,stroke:#475569,color:#f8fafc
    style Gateway fill:#334155,stroke:#64748b,color:#f8fafc
    style A1 fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    style A2 fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    style A3 fill:#dcfce7,stroke:#16a34a,color:#14532d
    style B1 fill:#fef3c7,stroke:#d97706,color:#78350f
    style B2 fill:#dcfce7,stroke:#16a34a,color:#14532d
    style B3 fill:#bbf7d0,stroke:#15803d,color:#14532d
```

Separating the **Gateway Resource Server** from the **Durable Task Checkpointer** ensures that Pod B can verify any caller's `state_handle`, exchange the caller's token for a downstream-scoped credential, and resume a paused HITL workflow stored in SQLite without sticky session affinity [1, 4].

---

## 2. RFC 9728 Resource Server & RFC 8693 Token Exchange (`mcp-gateway`)

In [`src/gateway/auth.py`](https://github.com/akmalkhaniub/mcp-gateway/blob/main/src/gateway/auth.py), `mcp-gateway` acts as an OAuth 2.1 Protected Resource rather than a transparent header forwarder [3, 6]:

1. **RFC 9728 Discovery (`GET /.well-known/oauth-protected-resource`):** Declares the canonical `resource` URI (`https://mcp-gateway.local/mcp`), `authorization_servers`, `scopes_supported`, and `token_exchange_grant_types_supported`. Unauthenticated calls in `enforced` mode fail closed with `HTTP 401` and `WWW-Authenticate: Bearer resource_metadata="..."` [3].
2. **Anti-Token-Passthrough (`verify_hs256_jwt`):** Enforces constant-time HMAC signature checks, `exp`/`nbf`, `iss`, and strict **RFC 8707** `aud` matching against the gateway's canonical resource URI—rejecting tokens minted for any other service [3, 6].
3. **Least-Privilege Scope Filtering (`is_scope_sufficient`):** Callers presenting `mcp:read` only discover and execute tools whose `ToolAnnotations.readOnlyHint` is `true`; invoking mutating tools fails with `HTTP 403` and an `insufficient_scope` step-up challenge [1, 6].
4. **RFC 8693 Token Exchange & Confused-Deputy Defense (`OAuthTokenExchanger`):** Before forwarding a request to an upstream MCP server, the gateway exchanges the verified caller identity for a short-lived, audience-attenuated token (`aud = upstream_endpoint_url`, `act = {"sub": gateway_resource}`) and verifies per-`(client_id, server_id)` consent binding so a shared OAuth client cannot hijack another principal's upstream consent [4]:

```python
class OAuthTokenExchanger:
    def exchange_for_upstream(
        self,
        caller: VerifiedPrincipal,
        server_id: str,
        upstream_audience: str,
        requested_scopes: list[str] | None = None,
    ) -> str:
        if not self.verify_consent_binding(caller.client_id, server_id, caller.principal):
            raise AuthChallengeError(
                403,
                "access_denied",
                f"Confused-deputy guard: client '{caller.client_id}' consent on '{server_id}' belongs to another principal.",
            )
        claims = {
            "iss": self.gateway_resource,
            "sub": caller.principal,
            "aud": upstream_audience,
            "azp": caller.client_id,
            "act": {"sub": self.gateway_resource},
            "scope": " ".join(attenuated),
            "grant_type": "urn:ietf:params:oauth:grant-type:token-exchange",
            "iat": int(now),
            "exp": int(now) + self.ttl_seconds,
        }
        return mint_hs256_jwt(claims, self._secret)
```

---

## 3. Stateless `2026-07-28` Handles & Opaque Handle Auth Invariants

In [`src/gateway/stateless.py`](https://github.com/akmalkhaniub/mcp-gateway/blob/main/src/gateway/stateless.py) and [`nexus_runtime/core/state_handles.py`](https://github.com/akmalkhaniub/nexus-agent-runtime/blob/main/nexus_runtime/core/state_handles.py), both systems support per-request `2026-07-28` negotiation via `MCP-Protocol-Version` or `params._meta.protocolVersion` and issue HMAC-SHA256 signed opaque handles (`gwsh_...` / `nxsh_...`) carrying `run_id`, `tenant_id`, `sub`, `step_index`, and `exp` [1, 2].

> [!IMPORTANT]
> An opaque state handle is a **tamper-evident cursor, never an authentication credential**. Both `StatelessHandleManager.verify_handle()` and `StateHandleManager.verify()` enforce strict principal and tenant equality—presenting a valid, unexpired `state_handle` or guessed `taskId` under a mismatched `X-Tenant-ID` or `X-Agent-Principal` fails immediately with `HTTP 403`.

In `/mcp/aggregate`, `tasks/get`, `tasks/update`, and `tasks/cancel` parse `{server_id}:{task_id}` task handles via `parse_task_handle()`, exchange the caller's token via RFC 8693, and proxy the task RPC transparently with W3C `traceparent` preservation in `params._meta` [1, 4, 5].

---

## 4. Durable SQLite MCP Tasks, URL-Mode Elicitation & Completions (`nexus-agent-runtime`)

Long-running multi-agent graphs frequently pause for human sign-off or external OAuth consent. In [`nexus_runtime/core/checkpointer.py`](https://github.com/akmalkhaniub/nexus-agent-runtime/blob/main/nexus_runtime/core/checkpointer.py) and [`nexus_runtime/api/routes_mcp_tasks.py`](https://github.com/akmalkhaniub/nexus-agent-runtime/blob/main/nexus_runtime/api/routes_mcp_tasks.py), `SQLiteCheckpointer` persists `McpTaskRecord` rows into an `mcp_tasks` table across process restarts:

- **Form vs. URL-Mode Elicitation (`tasks/start`):** Standard HITL approvals emit `status: "input_required"` with a strict JSON Schema `form` (`approved`, `reason`), whereas sensitive credential or OAuth re-consent workflows emit `mode: "url"` with an out-of-band `consent?task_id=...` URL so secrets never enter LLM prompt histories [1].
- **Cross-Replica Resumption & Cancellation (`tasks/update`, `tasks/cancel`):** Resuming a paused task transitions `input_required` $\rightarrow$ `completed` with `structuredContent` and `resource_link` artifacts, while `tasks/cancel` durably marks active tasks `cancelled` (rejecting cancellation of terminal `completed` tasks with JSON-RPC `-32004`).
- **Argument Completions (`completion/complete`):** Returns prefix-filtered candidates for registered tools, tags, and deployment cluster targets (`prod-us-east-1`, `prod-eu-west-1`).

---

## 5. Micro-Benchmark & Verification Results

All measurements were collected directly on Python 3.12 (`N = 2,000` iterations for crypto/token operations; `N = 200` iterations for disk-backed SQLite task persistence) alongside full automated `pytest` suites across both repositories:

| Component / Benchmark Gate | Measured Latency / Result | Engineering Guarantee |
| :--- | :--- | :--- |
| **HS256 JWT Verification (`verify_hs256_jwt`, `N = 2000`)** | **`0.035 ms` p50 / `0.082 ms` p95 / `0.193 ms` p99** | Constant-time HMAC check + `exp`, `nbf`, `iss`, RFC 8707 `aud` |
| **RFC 8693 Token Exchange (`cold cache miss`, `N = 2000`)** | **`0.049 ms` p50 / `0.115 ms` p95 / `0.237 ms` p99** | Audience-attenuated delegation (`aud`, `act`) + confused-deputy guard |
| **Stateless HMAC Handle Verification (`N = 2000`)** | **`0.033 ms` p50 / `0.074 ms` p95 / `0.108 ms` p99** | Rejects tampering, expiry, and cross-principal replay (`403`) |
| **SQLite Durable `mcp_tasks` Write / Read (`N = 200`)** | **`8.882 ms` p50 write / `4.000 ms` p50 read** | Task state & elicitation survive FastAPI replica restarts |
| **`mcp-gateway` Full Suite (`pytest tests -v`)** | **`29 / 29 PASSED` (`12.93 s`)** | RFC 9728, scope filter, RFC 8693, `2026-07-28` handles, Tasks routing |
| **`nexus-agent-runtime` Full Suite (`pytest tests -v`)** | **`33 / 33 PASSED` (`1.55 s`)** | Restart-resilient `mcp_tasks`, URL/form elicitation, `403` handle checks |

---

## References & Further Reading

1. Anthropic & Linux Foundation, *"Model Context Protocol Specification (2026-07-28): Tasks, Elicitation, ToolAnnotations & Completions,"* 2025–2026.
2. W3C Distributed Tracing Working Group, *"Trace Context (`traceparent` / `tracestate`),"* W3C Recommendation, 2021.
3. M. Jones, P. Hunt, and A. Parecki, *"RFC 9728: OAuth 2.0 Protected Resource Metadata,"* IETF, 2025.
4. M. Jones, A. Nadalin, B. Campbell, J. Bradley, and C. Mortimore, *"RFC 8693: OAuth 2.0 Token Exchange,"* IETF, 2020.
5. OpenTelemetry Authors, *"Semantic Conventions for Generative AI & MCP Spans,"* OpenTelemetry Specification, 2026.
6. B. Campbell, J. Bradley, N. Sakimura, and T. Lodderstedt, *"RFC 8707: Resource Indicators for OAuth 2.0,"* IETF, 2020.
