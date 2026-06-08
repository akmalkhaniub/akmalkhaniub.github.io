# Context Engineering: Building Secure & Structured Gates for LLMs

> ### 📖 Article Overview
> * **What this article is about:** This article introduces Context Engineering and the Model Context Protocol (MCP) as a method to provide LLMs with precise, secure, and structured access to real-time data and tools.
> * **Why it matters:** It directly addresses the "Lost in the Middle" phenomenon, improving LLM accuracy, reducing latency, and cutting API costs, while significantly enhancing the security of AI applications.
> * **What we synthesized:** We explored the architectural patterns and practical Python implementations using `FastMCP` and `ops-mcp-suite` to create secure, efficient, and cost-effective AI tool gates.

In the era of Generative AI, context is the primary constraint.

While Large Language Models (LLMs) are equipped with massive parametric knowledge, they are blind to real-time environments, local codebases, live production databases, and cloud infrastructure. The traditional solution has been to write custom wrapper scripts, compile text prompts, or feed entire database schemas into the context window.

This brute-force approach leads to what engineers call the **"Lost in the Middle"** phenomenon: when an LLM is overloaded with unstructured context, its retrieval accuracy drops, token latency skyrockets, and API billing increases exponentially.

**Context Engineering** is the discipline of building secure, structured, and dynamic gates that feed LLMs exactly what they need—and nothing more—at the precise moment they need it.

This article explores how to implement Context Engineering using the **Model Context Protocol (MCP)**, drawing architectural patterns from [ops-mcp-suite](https://github.com/akmalkhaniub/ops-mcp-suite)—a collection of 6 production-grade MCP servers served via a unified FastAPI gateway.

---

## 🛠️ The Architecture: Unified Tool Gates

Instead of hardcoding APIs for your AI agents, the Model Context Protocol standardizes client-server communication. A client (such as Claude Desktop or a custom LangGraph agent) queries an MCP server to discover what resources and tools are available, executing them via a structured JSON-RPC schema.

In the `ops-mcp-suite` architecture, a unified **FastAPI Gateway** acts as a secure proxy, routing tool calls from agent networks to specialized local and remote MCP microservices.

```mermaid
graph TD
    A[AI Agent / LLM Client] -->|1. JSON-RPC Request| B[FastAPI Gateway Proxy]
    B -->|2. Route DevOps Call| C[DevOps MCP Server]
    B -->|2. Route DB Call| D[DBOps MCP Server]
    B -->|2. Route Secrets Call| E[Secrets MCP Server]
    
    C -->|Docker API| F[(Local Containers)]
    D -->|SQL Alchemy| G[(PostgreSQL / MySQL)]
    E -->|Fernet Cryptography| H[(Secure Environment Keyring)]
```

---

## 1. Defining Tools in Python with FastMCP

Building an MCP server is straightforward using modern Python toolkits like `FastMCP`. FastMCP uses Python type hints and docstrings to automatically generate the tool schemas that are sent to the LLM. The LLM reads the docstring to understand *when* and *how* to invoke the tool.

Here is an example showing how `devops_mcp.py` exposes Docker container log inspection to an LLM:

```python
# devops_mcp.py
from mcp.server.fastmcp import FastMCP
import docker

# Initialize the MCP server
mcp = FastMCP("DevOps Server")
docker_client = docker.from_env()

@mcp.tool()
def get_container_logs(container_name: str, limit: int = 50) -> str:
    """
    Retrieve the latest console logs from a specified Docker container.
    Use this when debugging application failures or verifying startup states.
    """
    try:
        container = docker_client.containers.get(container_name)
        logs = container.logs(tail=limit, stdout=True, stderr=True)
        return logs.decode('utf-8')
    except docker.errors.NotFound:
        return f"Error: Container '{container_name}' was not found on this host."
    except Exception as exc:
        return f"Failed to fetch logs: {str(exc)}"
```

When the LLM receives this tool schema, it sees `get_container_logs` as a function with parameters `container_name` (string) and `limit` (integer). If the user asks *"Why is the auth service crashing?"*, the LLM automatically invokes this tool with `container_name="auth-service-1"`.

---

## 2. Preventing Prompt Injection: Strict Input Gating

In Context Engineering, security is just as important as data delivery. If you give an LLM a tool that runs shell commands (e.g., `subprocess.run(command)`), you open your system to **Prompt Injection Attacks**. An adversarial prompt could instruct the model to run `rm -rf /` or leak environment files.

To prevent this, we construct **Strict Input Gates**. We never expose open text fields for execution. Instead, we enforce strict type checking, use enums for valid actions, and sanitize inputs before they hit the filesystem or shell.

Here is an example of secure query gating from `dbops_mcp.py`:

```python
# dbops_mcp.py
import re
from sqlalchemy import create_engine, text

# Strict regex to only allow alphanumeric database names
DB_NAME_RE = re.compile(r"^[a-zA-Z0-9_]+$")

@mcp.tool()
def inspect_database_schema(db_name: str, table_name: str) -> str:
    """
    Retrieve column definitions and keys for a specific table.
    Enforces strict input validation to prevent SQL injection.
    """
    if not DB_NAME_RE.match(db_name) or not DB_NAME_RE.match(table_name):
        return "Security Error: Invalid characters in database or table name."
        
    engine = create_engine(f"postgresql://user:pass@localhost:5432/{db_name}")
    
    # Use parameterized SQL queries - never string concatenation
    query = text("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = :table;
    """)
    
    try:
        with engine.connect() as conn:
            result = conn.execute(query, {"table": table_name}).fetchall()
            schema_details = [f"{row[0]} ({row[1]}) - Nullable: {row[2]}" for row in result]
            return "\n".join(schema_details) if schema_details else "No columns found."
    except Exception as exc:
        return f"Database error: {str(exc)}"
```

---

## 3. Cryptographic Keyrings: Protecting LLM Context

When tool calls require API keys or administrative access, storing them in plain text inside the agent's memory is a massive vulnerability.

In `secrets_mcp.py`, we implement a context keyring using **Fernet symmetric encryption** (`cryptography` library). The LLM can request credentials by providing a secure key name. The MCP server decrypts the credential in-memory, signs the request, and performs the API call without ever exposing the raw secret key to the LLM's chat history.

```python
# secrets_mcp.py
from cryptography.fernet import Fernet
import os

# Encryption key stored outside the workspace environment
ENCRYPTION_KEY = os.getenv("MCP_FERNET_KEY")
cipher_suite = Fernet(ENCRYPTION_KEY.encode())

@mcp.tool()
def decrypt_service_key(encrypted_token: str) -> str:
    """
    Decrypts a system token to execute an internal service request.
    The decrypted result is processed inside the tool and is never returned to the user chat.
    """
    try:
        decrypted_text = cipher_suite.decrypt(encrypted_token.encode()).decode()
        # Perform service call inside the tool block...
        # response = api_call_with_token(decrypted_text)
        return "Internal service request executed successfully."
    except Exception:
        return "Decryption failed. Invalid credential signature."
```

---

## Key Takeaways for Context Engineers

1. **Keep it Small**: Do not dump raw datasets into prompts. Write specialized tools that let the LLM request summaries, tails, or specific rows.
2. **Lock it Down**: Enforce strict parameters, parameter enums, and parameter schemas. Treat every LLM-generated argument as untrusted user input.
3. **Audit Everything**: Implement logging on your MCP gateway. Log the raw JSON-RPC queries, the tool results, and the token counts.

By designing strict, secure, and minimal context interfaces with the Model Context Protocol, we build AI applications that are safer, faster, and significantly cheaper to run.

*The full source code of the gateway and servers is available in the public [ops-mcp-suite](https://github.com/akmalkhaniub/ops-mcp-suite) repository.*

---

## 🏁 Conclusion & Key Takeaways

Context Engineering, powered by the Model Context Protocol, offers a robust framework for building intelligent and secure AI applications.
1. **Precision Context Delivery:** Instead of overwhelming LLMs with raw data, MCP advocates for specialized tools that deliver only the necessary, summarized, or specific information, optimizing retrieval and reducing costs.
2. **Robust Security Gating:** Critical for preventing prompt injection, Context Engineering emphasizes strict input validation, type checking, and parameterized queries, ensuring LLM interactions remain secure and controlled.
3. **Secure Credential Management:** MCP servers can manage sensitive credentials through cryptographic keyrings, allowing LLMs to trigger actions requiring secrets without ever exposing the raw keys to the model's context or chat history.

*Takeaway: By meticulously engineering the context provided to LLMs, we unlock their full potential while maintaining control, security, and efficiency.*