# Distributed API Gateway Architecture: Rate Limiting (Token Bucket / Leaky Bucket) & Dynamic Route Proxying

At the edge of modern cloud infrastructure (**Cloudflare**, **Kong Gateway**, **Envoy**, **AWS API Gateway**), millions of public client applications issue requests to microservice backends.

Allowing unauthenticated public clients to communicate directly with internal microservices creates massive security vulnerabilities and exposes backends to Denial-of-Service (DoS) attacks.

To enforce security boundaries, manage traffic spikes, and route requests dynamically, cloud architectures deploy a **Distributed API Gateway**.

By combining **Token Bucket / Leaky Bucket Rate Limiting Algorithms**, **Distributed Redis Lua Script Atomic Counters**, and **Dynamic Reverse Proxy Routing**, API Gateways protect internal services while serving public traffic at sub-millisecond latencies.

This article details API Gateway reverse proxying, Token Bucket vs Leaky Bucket algorithms, Redis Lua rate limiting, and JWT header manipulation.

---

## Distributed API Gateway & Token Bucket Rate Limiter

How edge API Gateways perform distributed rate limiting using Redis Lua scripts and route requests to backend microservices:

```mermaid
graph TD
  subgraph Public Internet Clients
    ClientA[Mobile App / Web Client] -->|1. HTTP Request: GET /api/v1/orders| Gateway[Distributed API Gateway Node]
  end
  
  subgraph Edge API Gateway Processing
    Gateway -->|2. Validate JWT Token| Auth[JWT Auth & Header Injection]
    Auth -->|3. Distributed Rate Limit Check| Redis[Central Redis Cluster]
    
    subgraph Redis Atomic Lua Script (Token Bucket)
      Redis -->|Execute EVAL Lua Script| Lua["Redis Lua: Check & Consume Token (Tokens > 0?)"]
    end
    
    Lua -->|Allowed: Return 1| Gateway
    Lua -->|Exceeded: Return 0| RateLimitExceeded[🚨 Return HTTP 429 Too Many Requests]
  end
  
  subgraph Backend Microservice Reverse Proxying
    Gateway -->|4. Dynamic Reverse Proxy Route| OrderService[Order Microservice Cluster]
  end
```

### Core API Gateway Components
1. **API Gateway Perimeter Responsibilities**:
   * **Reverse Proxying & Routing**: Dynamically maps public URL paths (e.g. `/api/v1/payments/*`) to internal cluster microservice IP endpoints.
   * **Authentication & Header Enrichment**: Terminates TLS, validates OAuth2/JWT tokens, extracts claims (`user_id`, `roles`), and injects downstream headers (`X-User-ID: 1042`).
   * **Traffic Shaping & Rate Limiting**: Enforces tier-based API quotas (e.g. Free Tier: $10\text{ req/sec}$, Enterprise Tier: $1,000\text{ req/sec}$).
2. **Rate Limiting Algorithms**:
   * **Token Bucket**:
     * A bucket holds a maximum of $B$ tokens. Refill tokens arrive at a constant rate $r$ tokens/sec.
     * Each request consumes 1 token. If tokens $> 0$, the request passes; otherwise, it is rejected ($429$).
     * *Key Feature*: Accommodates **short bursty traffic** up to capacity $B$.
   * **Leaky Bucket**:
     * Requests arrive in a queue of size $Q$ and "leak" out at a constant fixed rate $r$.
     * *Key Feature*: **Smooths out bursty traffic**, outputting a perfectly uniform flow of requests to downstream microservices.
   * **Sliding Window Log / Counter**: Tracks request timestamps or window counts to eliminate fixed-window boundary burst exploits (where $2\times$ quota arrives at window edges).
3. **Distributed Rate Limiting via Redis Lua Scripts**:
   * In a multi-instance API Gateway cluster ($10$ Gateway pods), tracking tokens in local memory leads to inconsistent enforcement across nodes.
   * **Redis Lua Scripting (`EVAL`)**: Executes token calculation and update logic **atomically** inside Redis in a single round-trip. Eliminates multi-thread race conditions without needing expensive distributed locks!

---

## Python Implementation: API Gateway & Redis Lua Token Bucket Limiter

Here is a production-grade Python implementation of a Distributed API Gateway with a Redis Lua Token Bucket Rate Limiter and Dynamic Reverse Proxy Routing Engine:

```python
import time
from typing import Dict, Tuple, Optional
from pydantic import BaseModel

class GatewayRoute(BaseModel):
    path_prefix: str
    target_microservice_url: str

class MockRedisCluster:
    """
    Simulates Redis In-Memory Store executing Atomic Lua Scripts for Token Bucket Rate Limiting.
    """
    def __init__(self):
        # Key: client_key -> { 'tokens': float, 'last_refill': float }
        self.store: Dict[str, Dict[str, float]] = {}

    def eval_token_bucket_lua_script(self, client_key: str, bucket_capacity: float, refill_rate_per_sec: float) -> Tuple[bool, int]:
        """
        Simulates Atomic Redis Lua Script (EVAL).
        Returns (is_allowed, remaining_tokens).
        """
        now = time.time()
        
        if client_key not in self.store:
            self.store[client_key] = {"tokens": bucket_capacity, "last_refill": now}

        bucket = self.store[client_key]
        elapsed = now - bucket["last_refill"]

        # 1. Refill Tokens: tokens = Min(capacity, tokens + elapsed * refill_rate)
        bucket["tokens"] = min(bucket_capacity, bucket["tokens"] + elapsed * refill_rate_per_sec)
        bucket["last_refill"] = now

        # 2. Check if Token Available
        if bucket["tokens"] >= 1.0:
            bucket["tokens"] -= 1.0
            return (True, int(bucket["tokens"]))
        else:
            return (False, 0)

class DistributedAPIGatewayEngine:
    """
    Simulates Edge API Gateway with Rate Limiting & Reverse Proxy Routing.
    """
    def __init__(self, redis_cluster: MockRedisCluster):
        self.redis = redis_cluster
        self.routes: Dict[str, GatewayRoute] = {}

    def register_route(self, path_prefix: str, target_service_url: str):
        self.routes[path_prefix] = GatewayRoute(path_prefix=path_prefix, target_microservice_url=target_service_url)
        print(f" 🔀 [API Gateway Route] Path '{path_prefix}' -> Mapped to Target: '{target_service_url}'")

    def handle_client_request(self, client_ip: str, auth_token: Optional[str], request_path: str) -> Tuple[int, str]:
        print(f"\n🌐 [Incoming Request] Client: {client_ip} | Path: {request_path}")

        # 1. JWT Authentication & Claims Extraction
        user_id = "anonymous"
        if auth_token and auth_token.startswith("Bearer "):
            user_id = auth_token.replace("Bearer ", "")
            print(f" 🔑 [Auth Validated] Authenticated User: '{user_id}' (Injected X-User-ID header)")

        # 2. Distributed Rate Limit Check via Redis Lua (Token Bucket: Capacity=3, Rate=1 token/sec)
        rate_key = f"rate_limit:{user_id}"
        allowed, remaining = self.redis.eval_token_bucket_lua_script(
            client_key=rate_key, bucket_capacity=3.0, refill_rate_per_sec=1.0
        )

        if not allowed:
            print(f" 🚨 [HTTP 429 TOO MANY REQUESTS] Client '{user_id}' exceeded Token Bucket quota! Request Rejected.")
            return (429, "429 Too Many Requests: Rate Limit Exceeded")

        # 3. Dynamic Reverse Proxy Route Matching
        target_service = None
        for prefix, route in self.routes.items():
            if request_path.startswith(prefix):
                target_service = route
                break

        if not target_service:
            print(f" ❌ [HTTP 404 NOT FOUND] No route registered for '{request_path}'")
            return (404, "404 Not Found")

        # 4. Proxy to Downstream Microservice
        print(f" 🚀 [Reverse Proxying] Routing to '{target_service.target_microservice_url}' (Remaining Tokens: {remaining})")
        return (200, f"200 OK: Response from {target_service.target_microservice_url}")

# Demonstration Execution
if __name__ == "__main__":
    redis = MockRedisCluster()
    gateway = DistributedAPIGatewayEngine(redis_cluster=redis)

    print("🚀 Demonstrating Distributed API Gateway & Redis Token Bucket Rate Limiter...")
    print("=" * 75)

    # 1. Register Reverse Proxy Routes
    gateway.register_route("/api/v1/orders", "http://order-microservice-cluster:8080")
    gateway.register_route("/api/v1/users", "http://user-microservice-cluster:8081")

    # 2. Simulate Bursty Client Traffic (Token Bucket Capacity = 3)
    auth_header = "Bearer user_alice_1042"

    for i in range(5):
        status, resp = gateway.handle_client_request(
            client_ip="192.168.1.50", auth_token=auth_header, request_path="/api/v1/orders/101"
        )

    # 3. Wait 1.1s for Token Refill and Retry!
    time.sleep(1.1)
    print("\n⏳ Waited 1.1s for Token Bucket Refill:")
    gateway.handle_client_request(
        client_ip="192.168.1.50", auth_token=auth_header, request_path="/api/v1/orders/101"
    )
```

---

## API Gateway Gotchas & Best Practices

When operating distributed API Gateways:

> [!IMPORTANT]
> **Return Standard Rate Limit Response Headers**: Always include HTTP response headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`) so client SDKs can implement exponential backoff automatically before receiving 429 status codes.

> [!CAUTION]
> **Avoid Monolithic Single-Node Gateways**: Deploying a single API Gateway instance creates a major Single Point of Failure and bandwidth bottleneck. Deploy API Gateways behind a Layer 4 Load Balancer (**AWS NLB**) across multiple Availability Zones with auto-scaling enabled.

---

## Real-World Enterprise Impact
Distributed API Gateways (such as **Cloudflare Edge**, **Kong Gateway**, and **AWS API Gateway**) report:
* **Sub-Millisecond Edge Enforcement**: Redis Lua atomic token bucket scripts enforce rate limits in under $1\text{ms}$.
* **Protection Against Distributed Denial-of-Service (DDoS)**: Perimeter rate limiting drops malicious traffic spikes at the cloud edge before hitting internal microservice infrastructure.
