# The Parts of Docker Nobody Explains (Until It Breaks in Production)

> [!NOTE]
> **📖 Article Overview**
> Docker tutorials get you from zero to a running container in 10 minutes. What they skip: why your containerised AI service crashes with `SIGKILL` instead of shutting down gracefully, why your CI builds take 8 minutes when they should take 30 seconds, why Node.js inside Docker runs as root and why that's a security incident waiting to happen, and why your `.dockerignore` file is silently being ignored. This article covers **7 Docker production blind spots** that only reveal themselves in real deployments — with Dockerfile fixes for Python (FastAPI/Uvicorn) and Node.js (Next.js/Hono) AI services.

---

## The Gap Between Docker Tutorials and Production Reality

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'primaryColor': '#06b6d4', 'primaryTextColor': '#f3f4f6', 'primaryBorderColor': '#22d3ee', 'lineColor': '#06b6d4', 'secondaryColor': '#111827', 'tertiaryColor': '#0f172a'}}}%%
flowchart LR
    subgraph SG1_TutorialDockerfile ["Tutorial Dockerfile"]
        T1[FROM python:3.11]
        T2[COPY . .]
        T3[RUN pip install -r requirements.txt]
        T4[CMD python app.py]
    end

    subgraph SG2_ProductionReality ["Production Reality"]
        P1[💥 PID 1 ignores SIGTERM]
        P2[💥 node_modules copied into image]
        P3[💥 pip cache busted on every build]
        P4[💥 Running as root user]
        P5[💥 Secrets baked into layers]
        P6[💥 No health check]
        P7[💥 Image is 2.4GB]
    end

    Tutorial Dockerfile --> Production Reality

    style P1 fill:#7f1d1d,stroke:#ef4444,stroke-width:2px
    style P2 fill:#7f1d1d,stroke:#ef4444,stroke-width:2px
    style P3 fill:#78350f,stroke:#f59e0b,stroke-width:2px
    style P4 fill:#7f1d1d,stroke:#ef4444,stroke-width:2px
    style P5 fill:#7f1d1d,stroke:#ef4444,stroke-width:2px
    style P6 fill:#78350f,stroke:#f59e0b,stroke-width:2px
    style P7 fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px
```

---

## Blind Spot 1: PID 1 and the SIGTERM That Never Arrives

**Symptom**: `docker stop` takes exactly 10 seconds before force-killing the container. Database connections are severed mid-transaction. BullMQ jobs are abandoned mid-execution. Your "graceful shutdown" code never runs.

**Root cause**: When you run `CMD python app.py`, Docker makes `python` PID 1. Linux only sends `SIGTERM` to PID 1. But `python` (and `node`, `uvicorn`, etc.) don't forward signals to child processes by default. After 10 seconds, Docker escalates to `SIGKILL` — no cleanup possible.

```dockerfile
# Python/Node becomes PID 1 — doesn't handle signals correctly
CMD ["python", "app.py"]
CMD ["node", "server.js"]

# Option A: Use exec form (not shell form) — this IS correct for single processes
# exec form runs the process as PID 1 directly, signals work
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# Option B: Use tini as a proper init process (handles zombie reaping too)
# Install in your Dockerfile:
RUN apt-get install -y tini
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# Option C: Use --init flag on docker run / compose
# docker run --init myimage
# compose.yml:
# init: true
```

```python
# Your FastAPI app must handle SIGTERM gracefully
import signal
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("[App] Starting up — connecting to DB and Redis")
    yield
    # Shutdown — runs when SIGTERM received
    print("[App] Shutting down — closing connections gracefully")
    # await redis_pool.aclose()
    # await db_pool.close()

app = FastAPI(lifespan=lifespan)
```

---

## Blind Spot 2: Layer Cache Busted by Wrong COPY Order

**Symptom**: Every CI build reinstalls all Python packages from scratch even when you only changed a single `.py` file. 8-minute builds instead of 30-second ones.

**Root cause**: Docker layer cache is invalidated when any file in a `COPY` command changes. If you `COPY . .` before `RUN pip install`, any code change invalidates the pip install layer.

```dockerfile
# COPY . . before pip install — any code change busts the cache
FROM python:3.11-slim
WORKDIR /app
COPY . .                          # ← Every file change invalidates next layer
RUN pip install -r requirements.txt  # ← Reinstalls everything every time

# Copy dependency files FIRST, install, THEN copy source code
FROM python:3.11-slim
WORKDIR /app

# Layer 1: Dependency manifest (rarely changes)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt  # ← Cached unless requirements.txt changes

# Layer 2: Source code (changes frequently — but above cache is preserved)
COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```dockerfile
# Same pattern for Node.js
FROM node:20-slim
WORKDIR /app

# Copy package files first
COPY package.json package-lock.json ./
RUN npm ci --omit=dev  # ← Cached unless package.json changes

# Then copy source
COPY . .
RUN npm run build

CMD ["node", "dist/server.js"]
```

---

## Blind Spot 3: Running as Root Is a Security Incident Waiting to Happen

**Symptom**: A dependency vulnerability or code execution bug inside your container gives attackers root access to the host in misconfigured environments.

**Root cause**: Docker containers run as `root` (UID 0) by default. If your container is ever compromised — through a vulnerable npm package, a deserialization exploit, or a path traversal — the attacker has root inside the container, which may translate to host root depending on Docker daemon configuration.

```dockerfile
# Running as root (Docker default)
FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
# docker inspect → "User": "" → runs as root

# Create and use a non-root user
FROM python:3.11-slim

# Create non-root user with no home directory and no shell
RUN groupadd --gid 1001 appgroup && \
    useradd --uid 1001 --gid 1001 --no-create-home --shell /bin/false appuser

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=appuser:appgroup . .  # ← Transfer ownership to appuser

USER appuser  # ← Switch to non-root before CMD

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Blind Spot 4: Secrets Baked Into Image Layers Are Permanent

**Symptom**: You delete the `ENV API_KEY=secret` line from your Dockerfile and rebuild. The secret is still retrievable from the old image layer with `docker history` or `docker save`.

**Root cause**: Docker image layers are immutable and cumulative. Even if you `RUN unset API_KEY` in a later layer, the secret exists in the earlier layer forever — visible to anyone who can pull the image.

```dockerfile
# Secret in ENV — permanent in image history
ENV ANTHROPIC_API_KEY="sk-ant-..."
ENV DATABASE_URL="postgresql://user:password@host/db"

# Secret in RUN — also permanent even if deleted later
RUN pip install -r requirements.txt --extra-index-url https://user:token@pypi.company.com/simple

# Never bake secrets — use runtime environment injection
# In production: pass via Docker secrets, Kubernetes secrets, or env at runtime
# docker run --env-file .env myimage
# docker run -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY myimage

# For build-time secrets (private PyPI, npm registries): use BuildKit secrets
# syntax=docker/dockerfile:1
FROM python:3.11-slim
RUN --mount=type=secret,id=pip_config,target=/root/.pip/pip.conf \
    pip install -r requirements.txt
# Build with: docker build --secret id=pip_config,src=pip.conf .
# Secret NEVER appears in any layer
```

---

## Blind Spot 5: Your `.dockerignore` Is Being Ignored

**Symptom**: Build context takes 45 seconds to send to Docker daemon. Your image contains `node_modules`, `.git`, `.env`, and your entire test dataset.

**Root cause**: `.dockerignore` only works if it's in the **build context directory** (where you run `docker build`). If you run `docker build` from a parent directory, or if the file has Windows line endings, it may be silently skipped.

```bash
# Check what's being sent to Docker daemon
docker build --no-cache . 2>&1 | head -5
# "Sending build context to Docker daemon  2.3GB"  ← Problem!

# Audit what's in your build context
docker build . -f /dev/null --progress=plain 2>&1 | grep "^#"
```

```plaintext
# .dockerignore — comprehensive for AI/Node.js projects
# Dependencies
node_modules/
.pnp
.pnp.js
__pycache__/
*.pyc
*.pyo
.venv/
venv/
env/

# Build outputs
.next/
dist/
build/
*.egg-info/

# Dev and test
.env
.env.local
.env.*.local
*.test.ts
*.spec.py
tests/
__tests__/

# Git and CI
.git/
.github/
.gitignore

# Large data files — keep out of image
data/
datasets/
*.csv
*.parquet
*.pkl
models/          # Local model weights — use volumes in production

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db
```

---

## Blind Spot 6: No HEALTHCHECK = Kubernetes Sends Traffic to Dead Containers

**Symptom**: Your pod is running (Kubernetes shows `Running` status) but returning 500 errors. Kubernetes keeps sending traffic because it doesn't know the app is broken.

```dockerfile
# No health check — orchestrators assume "running" = "healthy"
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# Add HEALTHCHECK so Docker/Kubernetes knows when the app is truly ready
HEALTHCHECK --interval=30s \
            --timeout=10s \
            --start-period=15s \
            --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
```

```python
# Add a lightweight /health endpoint to your FastAPI app
from fastapi import FastAPI
from fastapi.responses import JSONResponse
import asyncio

@app.get("/health")
async def health_check():
    """
    Lightweight health check — verifies app is responding.
    Optionally check DB/Redis connectivity for deeper probes.
    """
    checks = {"status": "ok", "service": "rag-api"}
    
    # Optional: check Redis
    try:
        await redis_client.ping()
        checks["redis"] = "ok"
    except Exception as e:
        checks["redis"] = f"error: {str(e)}"
        return JSONResponse(status_code=503, content=checks)
    
    return checks
```

---

## Blind Spot 7: Multi-Stage Builds — Shipping Dev Dependencies to Production

**Symptom**: Your Python or Node.js production image is 1.8GB. It contains pytest, mypy, eslint, TypeScript compiler, and test fixtures that have no business running in production.

```dockerfile
# Multi-stage build — lean production image
# Stage 1: Builder (has dev tools, compilers, test deps)
FROM node:20-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci                    # Install ALL deps including devDependencies

COPY . .
RUN npm run build             # Compile TypeScript, bundle, etc.
RUN npm run test              # Run tests AT BUILD TIME — fail fast

# Stage 2: Production runtime (only production artifacts)
FROM node:20-slim AS production
WORKDIR /app

# Copy ONLY the built output and production deps
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
RUN npm ci --omit=dev         # ← Only production dependencies

RUN groupadd --gid 1001 appgroup && \
    useradd --uid 1001 --gid 1001 --no-create-home --shell /bin/false appuser
USER appuser

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000
CMD ["node", "dist/server.js"]
# Result: ~180MB instead of 1.8GB
```

```dockerfile
# Multi-stage Python with UV package manager (fastest Python builds)
FROM python:3.11-slim AS builder
RUN pip install uv
WORKDIR /app
COPY requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

FROM python:3.11-slim AS production
WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --chown=1001:1001 . .

RUN useradd --uid 1001 --no-create-home --shell /bin/false appuser
USER appuser

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

---

## Conclusion & Key Takeaways

Docker's simplicity is a double-edged sword — it hides complexity that resurfaces as production incidents. The failures above follow a pattern: they're invisible in development (fast machine, no proxy, running as you) and catastrophic in production (slow CI, proxied, rootless Kubernetes).

- **Always use exec form `CMD ["executable", "arg"]`** — never shell form `CMD executable arg`. Exec form is PID 1, receives signals correctly, and is the only form that enables graceful shutdown.
- **Copy dependency manifests before source code** — this single change often cuts CI build times by 80% by preserving the package-install cache layer.
- **Never use ENV or RUN to handle secrets** — use Docker BuildKit `--mount=type=secret` for build-time secrets and runtime environment injection for application secrets.

---

### Research References & Resources
- **Docker Multi-Stage Builds**: [Use multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- **Docker BuildKit Secrets**: [Build secrets reference](https://docs.docker.com/build/building/secrets/)
- **tini Init Process**: [A tiny but valid init for containers](https://github.com/krallin/tini)
- **Docker Security Best Practices**: [Docker security guide](https://docs.docker.com/engine/security/)
