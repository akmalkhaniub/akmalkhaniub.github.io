# Multi-Tenant RAG: Secure Vector Search Isolation in Production Systems

> [!NOTE]
> **📖 Article Overview**
> Multi-tenant applications must guarantee that customer data remains strictly isolated. In Retrieval-Augmented Generation (RAG) pipelines, a failure in data isolation can lead to a disastrous breach where Tenant A's private documents are retrieved to answer a query by Tenant B. This article explores two major vector isolation paradigms — metadata filtering vs. namespace segregation — and shows you how to implement bulletproof multi-tenant isolation in `pgvector` using PostgreSQL Row-Level Security (RLS) and custom session contexts.

---

## The Threat of Vector Data Leaks

In standard SQL applications, we isolate tenant records using `WHERE tenant_id = ?` clauses. When moving to vector databases, developers often perform a similarity search (like cosine distance) and assume they can filter out other tenants afterward. 

This post-query filtering is a massive security hazard. If the top-K nearest neighbors are all occupied by Tenant B's documents, Tenant A's query will return zero matching records of their own, even if relevant records exist deeper in the index. Pre-query metadata filtering fixes this, but if developers forget to pass the filter block in a single API call, the database returns cross-tenant data.

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'primaryColor': '#a855f7', 'primaryTextColor': '#f3f4f6', 'primaryBorderColor': '#c084fc', 'lineColor': '#a855f7', 'secondaryColor': '#111827', 'tertiaryColor': '#0b0f19'}}}%%
sequenceDiagram
    participant Client as Tenant API Client
    participant App as RAG Backend Engine
    participant DB as PostgreSQL (pgvector + RLS)

    Client->>App: Query: "What is our Q2 revenue?" (JWT context: tenant_id = 99)
    App->>DB: Begin Transaction
    App->>DB: SET LOCAL app.current_tenant_id = 99
    Note over DB: Enforce Row-Level Security Policy
    App->>DB: SELECT content FROM documents ORDER BY embedding <=> query_vector LIMIT 5
    Note over DB: DB automatically filters indexes matching tenant_id = 99
    DB-->>App: Return isolated matching documents
    App->>DB: Commit Transaction
    App-->>Client: Generate LLM Answer
```

---

## Metadata Filtering vs. PostgreSQL Row-Level Security (RLS)

| Feature | Metadata Filtering (No RLS) | PostgreSQL Row-Level Security (RLS) |
| :--- | :--- | :--- |
| **Enforcement Layer** | Application-level (developer must write query filters) | Database-level (enforced automatically by engine) |
| **Security Risk** | High (accidental omission bypasses checks) | Extremely Low (impossible to bypass if configured) |
| **Performance** | Fast, but suffers if metadata cardinality is high | Native, utilizes underlying index partitioning |
| **Maintainability** | Must be added to every query in code | Defined once in the database schema |

PostgreSQL RLS ensures that even if you write `SELECT * FROM documents`, the engine automatically appends the tenant isolation filter behind the scenes based on the database session parameters.

---

## Step 1: Database Schema Setup with pgvector & RLS

Below is the database migration script. We enable the `vector` extension, create a `documents` table containing our vector columns, enable RLS, and declare an isolation policy based on a session config variable: `app.current_tenant_id`.

```sql
-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the multi-tenant documents table
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536) NOT NULL -- For OpenAI or similar 1536-dim embeddings
);

-- Enable Row-Level Security (RLS) on the table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create a policy: Only allow rows where tenant_id matches the session variable
CREATE POLICY tenant_isolation_policy ON documents
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::integer);

-- Create an HNSW index on the embeddings column for fast similarity search
CREATE INDEX ON documents 
USING hnsw (embedding vector_cosine_ops);
```

### How the policy works:
* `current_setting('app.current_tenant_id', true)` reads a temporary configuration variable that we set inside the database transaction.
* `USING (tenant_id = ...)` prevents any user session from reading, updating, or deleting records that do not match the assigned `tenant_id`.

---

## Step 2: Querying the Isolated Database in Python

Here is how you execute a secure multi-tenant RAG search query. We establish a database session, set the local transaction context, and then call our vector distance operators.

```python
import os
import psycopg2
from psycopg2.extras import RealDictCursor

# Get DB Connection string
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/rag_db")

def query_tenant_documents(tenant_id: int, query_vector: list[float], limit: int = 5):
    connection = psycopg2.connect(DATABASE_URL)
    try:
        with connection:
            with connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # 1. SET THE SESSION TENANT CONTEXT
                # This variable is isolated to this specific transaction/connection block
                cursor.execute("SET LOCAL app.current_tenant_id = %s;", (tenant_id,))
                
                # 2. PERFORM VECTOR SEARCH
                # The RLS policy will automatically intercept and filter this search
                search_query = """
                    SELECT id, title, content, (embedding <=> %s::vector) as distance
                    FROM documents
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s;
                """
                cursor.execute(search_query, (query_vector, query_vector, limit))
                results = cursor.fetchall()
                return results
    finally:
        connection.close()

# Example Usage
if __name__ == "__main__":
    # Simulated 1536-dimension query vector
    mock_vector = [0.015] * 1536
    
    # Run query for Tenant 99
    # Will NEVER return results belonging to Tenant 100, even if they are closer
    matching_docs = query_tenant_documents(tenant_id=99, query_vector=mock_vector)
    for doc in matching_docs:
        print(f"ID: {doc['id']}, Title: {doc['title']}, Distance: {doc['distance']:.4f}")
```

### Why `SET LOCAL` is used:
We use `SET LOCAL` instead of `SET` inside the transaction. `SET LOCAL` ensures that the variable is automatically cleared as soon as the transaction commits or aborts. This prevents connection pooling libraries (like PgBouncer) from accidentally bleeding the tenant ID into a subsequent request handled by the same recycled TCP connection.

---

## 🏁 Conclusion & Takeaways

To secure enterprise RAG search engines:
* [ ] **Enforce isolation at the database level**: Never rely solely on application filters or post-query filtering.
* [ ] **Leverage PostgreSQL RLS**: Enable RLS on all vector tables and tie access control to a session configuration variable.
* [ ] **Use transaction-scoped variables**: Always use `SET LOCAL` instead of global settings to prevent connection-pool state leakage.
* [ ] **Test with multi-tenant asserts**: Write integration tests that attempt to fetch nearest neighbors for Tenant A while placing high-similarity vectors belonging to Tenant B in the database.
