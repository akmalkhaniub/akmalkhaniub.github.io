---
# The Model Context Protocol: Building a Secure Database Runner Server

> ### 📖 Article Overview
> * **What this article is about:** This article introduces the Model Context Protocol (MCP) as a solution for standardized AI tool integration and demonstrates building a secure PostgreSQL database runner server using its TypeScript SDK.
> * **Why it matters:** MCP eliminates the need for custom API wrappers and model-specific tool definitions, significantly streamlining AI application development, improving modularity, and enhancing security for tool execution.
> * **What we synthesized:** We reviewed MCP's client-server architecture, walked through a practical TypeScript implementation for a secure database tool, and highlighted critical security best practices for deploying such services.

---
In the early days of building AI applications, developers wrote custom API wrappers for every new tool they integrated. If you wanted an LLM to read files, search the web, and run SQL queries, you had to write custom glue code to translate the model's text outputs into specific API calls.

If you swapped models (e.g., from GPT-4 to Claude 3.5), you often had to rewrite your tool definitions and parsing logic from scratch.

This modularity challenge is now solved by the **Model Context Protocol (MCP)**. Released by Anthropic in late 2024, MCP acts as the **USB-C standard for AI tooling**. It standardizes how client hosts (like Cursor, Claude Desktop, or custom developer portals) connect to servers that expose data resources and executable tools.

This article reviews the MCP architecture and walks through building a secure, custom database runner server using the **official TypeScript SDK**, as modeled in my repository [ops-mcp-suite](https://github.com/akmalkhaniub/ops-mcp-suite).

---

## The Model Context Protocol Architecture

MCP operates on a clean **Client-Server model** over standardized communication channels (Standard Input/Output or Server-Sent Events). The LLM engine is decoupled from tool execution, meaning the model never runs raw system commands directly; instead, it issues structured JSON-RPC requests to the local MCP server.

```mermaid
graph LR
    subgraph ClientHost [MCP Client: Cursor / Claude Desktop / Custom App]
        User[User Interface] -->|Prompt query| ModelEngine[LLM Engine]
    end

    subgraph Router [MCP Protocol Layer / JSON-RPC]
        ModelEngine -->|1. List Tools| MCPClient[MCP Client SDK]
        MCPClient -->|2. callTool: query_database| MCPServer[MCP Server SDK]
    end

    subgraph Services [MCP Server Layer]
        MCPServer -->|3. Query database| DB[(PostgreSQL Database)]
        MCPServer -->|3. Fetch log files| FS[Filesystem Logs]
        MCPServer -->|3. Fetch git commits| Git[GitHub API]
    end

    style ClientHost fill:#f8fafc,stroke:#64748b,stroke-width:2px
    style Router fill:#ecfeff,stroke:#0ea5e9,stroke-width:2px
    style Services fill:#fffbeb,stroke:#d97706,stroke-width:2px
```

1. **Protocol Negotiation**: Upon startup, the Client handshake queries the Server to inspect available `resources` (static files or databases), `tools` (dynamic executable actions), and `prompts` (pre-defined instruction templates).
2. **Dynamic Invocation**: When the LLM decides it needs database access to answer a prompt, the Client intercepts the function call and fires a standard `tools/call` JSON-RPC request containing query arguments.
3. **Execution & Return**: The local MCP server runs the query securely, serializes the rows, and sends a text payload back. The Client feeds this text context into the LLM context window to generate the final response.

---

## Building a PostgreSQL MCP Server in TypeScript

Here is a complete, executable MCP server designed to expose a secure SQL query tool. This server connects to PostgreSQL, parses tool calls, and returns query results in the standardized JSON format expected by MCP clients.

### 1. Project Dependencies Configuration
```json
{
  "name": "db-mcp-server",
  "version": "1.0.0",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.1",
    "pg": "^8.11.3"
  }
}
```

### 2. Main Server Code
```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { Client } from "pg";

const pgClient = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/mydb"
});

// 1. Initialize MCP Server metadata
const mcpServer = new Server(
  { name: "postgres-tool-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// 2. Register available tools
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "run_read_query",
        description: "Executes a SELECT query on the PostgreSQL database. Only read queries are allowed.",
        inputSchema: {
          type: "object",
          properties: {
            sql: { type: "string", description: "The SELECT statement to run" }
          },
          required: ["sql"]
        }
      }
    ]
  };
});

// 3. Handle tool execution requests
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name !== "run_read_query") {
    throw new Error(`Tool ${name} not found`);
  }

  const sql = String(args?.sql);

  // Security Gate: Block write commands
  const upperSql = sql.toUpperCase().trim();
  if (!upperSql.startsWith("SELECT") || upperSql.includes("INSERT") || upperSql.includes("DELETE") || upperSql.includes("DROP")) {
    return {
      content: [{ type: "text", text: "Security Error: Only SELECT queries are permitted." }],
      isError: true
    };
  }

  try {
    const result = await pgClient.query(sql);
    return {
      content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }]
    };
  } catch (err: any) {
    return {
      content: [{ type: "text", text: `Database Error: ${err.message}` }],
      isError: true
    };
  }
});

// 4. Start the server using Standard Input/Output transport
async function start() {
  await pgClient.connect();
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error("Postgres MCP Server running on stdio");
}

start().catch(console.error);
```

---

## Security: Hardening your Tool Gates

Exposing tools to an LLM introduces prompt injection vectors. An attacker can write queries designed to extract secrets or alter schemas. Follow these security rules:
* **Least Privilege Database Credentials**: Always connect the MCP server using a read-only database user account. Restrict write/update permissions to block data mutation.
* **SQL Query Sanitization**: Validate the SQL commands within the MCP server code, checking against an allowlist of statements before executing them.
* **Network Isolation**: Run MCP servers in sandboxed container environments (like Docker) with minimal internet access to prevent outbound command-and-control requests if a model is compromised.

---

## Conclusion & Key Takeaways

The Model Context Protocol (MCP) marks a significant advancement in AI application development by standardizing how large language models interact with external tools and data.
1. **Standardized Tooling for AI:** MCP acts as a universal interface, akin to USB-C, for AI models to securely access and execute external tools and resources, eliminating the previous need for custom, model-specific API wrappers and parsing logic. This standardization greatly simplifies the integration of diverse tools like databases, file systems, and external APIs into AI applications, making them more modular and interoperable across different LLM engines.
2. **Secure Client-Server Decoupling:** MCP's client-server architecture ensures that LLMs never directly execute system commands, instead issuing structured JSON-RPC requests to a local server responsible for secure tool execution. This decoupling enhances security by isolating the LLM from direct system access and allows for robust validation and sanitization of tool inputs, as demonstrated by the PostgreSQL server's SQL query gate.
3. **Practical Implementation with Robust Security:** Building an MCP server, as shown with the TypeScript PostgreSQL example, is straightforward, but requires diligent security measures to prevent prompt injection and unauthorized access. Implementing least privilege database credentials, rigorous SQL query sanitization, and network isolation within sandboxed environments are crucial steps to harden MCP-enabled tools against potential vulnerabilities.

*Takeaway: MCP empowers developers to build more secure, modular, and interoperable AI applications by providing a standardized protocol for tool interaction.*

---

## References & Further Reading

* **Model Context Protocol Specification**: [Anthropic Model Context Protocol Documentation](https://modelcontextprotocol.io). Protocol specifications, SDK repositories, and quickstart guides.
* **Prompt Injection Risks in Tool Callers**: *Not What You Expected: Prompt Injections on LLM APIs and Tool Environments*. Analyzes vulnerabilities in automated tool execution.

*To review the full list of our production-grade MCP services, browse our public [ops-mcp-suite](https://github.com/akmalkhaniub/ops-mcp-suite) repository.*