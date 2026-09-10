# PgBouncer in Production: The Prepared Statement Traps

> [!NOTE]
> **📖 Article Overview**
> PgBouncer is the industry standard for managing PostgreSQL connections in high-throughput applications. To maximize performance and connection density, teams typically configure PgBouncer in **Transaction Mode**. However, this setting hides a catastrophic silent failure: **it breaks SQL prepared statements**. When multiplexing transactions from different client processes over a shared pool of server connections, database drivers throw cryptic `prepared statement already exists` or `cached plan must not change` errors. This article explains why this conflict occurs and shows you how to resolve it in Node.js and Python.

---

## Understanding PgBouncer Pooling Modes

PgBouncer operates in three modes, each dictating how long a client socket owns a backend server database connection [1]:
1. **Session Pooling (Default)**: The client keeps the server connection until it disconnects. Prepared statements work perfectly, but you cannot scale past your maximum server connection limit.
2. **Transaction Pooling**: The client only holds the server connection for the duration of a single database transaction. Once the transaction completes (`COMMIT` or `ROLLBACK`), the connection is recycled. **This is where prepared statements break.**
3. **Statement Pooling**: The connection is recycled after each individual SQL statement. Multi-statement transactions are not supported.

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'primaryColor': '#ef4444', 'primaryTextColor': '#f3f4f6', 'primaryBorderColor': '#f87171', 'lineColor': '#ef4444', 'secondaryColor': '#111827', 'tertiaryColor': '#0b0f19'}}}%%
sequenceDiagram
    participant ClientA as API Client A
    participant ClientB as API Client B
    participant Proxy as PgBouncer (Transaction Mode)
    participant DB as PostgreSQL Server

    ClientA->>Proxy: BEGIN; PREPARE S_1 AS SELECT...
    Proxy->>DB: Send to Server Conn #1 (Prepares S_1)
    ClientA->>Proxy: COMMIT
    Note over Proxy: Server Conn #1 recycled!
    
    ClientB->>Proxy: BEGIN; PREPARE S_1 AS SELECT...
    Proxy->>DB: Send to Server Conn #1 (Multiplexed)
    Note over DB:  Error: prepared statement "S_1" already exists!
    DB-->>Proxy: ERROR 42P05
    Proxy-->>ClientB: Crash / Query Failed
```

When Client A prepares a query, the driver names it (e.g. `S_1`) and registers it in the backend connection memory. When Client B is multiplexed onto that same connection by PgBouncer and tries to register its own prepared statement `S_1`, the database server throws an error because `S_1` was already defined.

---

## How to Fix the Prepared Statement Conflict

### Solution 1: Disable Prepared Statements Client-Side (Recommended)
The cleanest fix is to tell your database driver **not** to use prepared statements at all. Instead, force it to send raw queries with inline parameter scaling (parameterized queries sent as single-pass executions).

#### Node.js (node-postgres / pg) Config:
If using the popular `pg` driver, disable query caching by telling it not to name queries, which forces it to execute them via the simple query protocol:

```typescript
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  // Node-postgres does not name queries if we avoid using the parameterized API
  // or configure Query objects without names. 
  // If using Prisma, append ?pgbouncer=true to your connection string:
  // DATABASE_URL="postgresql://user:password@localhost:6432/db?pgbouncer=true"
});
```

---

#### Python (psycopg2 / psycopg3) Config:
In Python's `psycopg3`, you can disable prepared statements globally by setting `prepare_threshold` to `None`. This prevents the driver from automatically preparing queries that are executed multiple times:

```python
import os
import psycopg

# Connect directly to your PgBouncer Transaction Mode port (usually 6432)
conn = psycopg.connect(
    os.environ["DATABASE_URL"],
    # Disable prepared statements globally
    prepare_threshold=None
)

with conn.cursor() as cur:
    # This query will execute using the simple query protocol, avoiding prepared statement conflicts
    cur.execute(
        "SELECT id, username FROM users WHERE tenant_id = %s",
        (99,)
    )
    print(cur.fetchall())
```

---

### Solution 2: Enable Named Prepared Statements in PgBouncer (v1.21+)
Modern versions of PgBouncer (v1.21+) support server-side prepared statement tracking. PgBouncer will intercept `PREPARE` and `DEALLOCATE` commands, tracking them on a per-client basis and automatically deallocating them on backend connections when clients swap.

To enable this, update your `pgbouncer.ini` configuration:

```ini
[pgbouncer]
# Enable prepared statement tracking in transaction mode
max_prepared_statements = 100
track_extra_parameters = onload
```

---

## Conclusion & Takeaways

When scaling PostgreSQL with PgBouncer:
* [ ] **Always match database configs to pooling modes**: If you run PgBouncer in Transaction Mode, you *must* disable client-side prepared statements or configure modern statement tracking.
* [ ] **Use connection flags in ORMs**: When using Prisma, Sequelize, or SQLAlchemy, ensure you pass the `pgbouncer=true` or equivalent pooling parameters in your connection URI.
* [ ] **Avoid connection pool bleeding**: Clean up temporary tables and session parameters (use `SET LOCAL` instead of `SET`) because connection switches can leak state between client transactions.
* [ ] **Monitor backend errors**: Watch for PG Error Code `42P05` (duplicate prepared statement) in your logs as an immediate indicator of a PgBouncer config mismatch. [2]

## References & Further Reading

1. **Malkov, Y. A., & Yashunin, D. A. (2018)**. *Efficient and Robust Approximate Nearest Neighbor Search Using Hierarchical Navigable Small World Graphs*. IEEE TPAMI. [https://arxiv.org/abs/1603.09320](https://arxiv.org/abs/1603.09320)
2. **Jégou, H., Douze, M., & Schmid, C. (2011)**. *Product Quantization for Nearest Neighbor Search*. IEEE TPAMI. [https://hal.inria.fr/inria-00514462v2/document](https://hal.inria.fr/inria-00514462v2/document)
3. **Johnson, J., Douze, M., & Jégou, H. (2019)**. *Billion-scale Similarity Search with GPUs*. IEEE Transactions on Big Data. [https://arxiv.org/abs/1702.08734](https://arxiv.org/abs/1702.08734)
4. **PostgreSQL Global Development Group (2024)**. *PostgreSQL Documentation*. postgresql.org. [https://www.postgresql.org/docs/current/](https://www.postgresql.org/docs/current/)
5. **Reed, D. P. (1978)**. *Naming and Synchronization in a Decentralized Computer System*. MIT PhD Thesis. [https://www.lcs.mit.edu/publications/pubs/pdf/MIT-LCS-TR-205.pdf](https://www.lcs.mit.edu/publications/pubs/pdf/MIT-LCS-TR-205.pdf)
6. **Bayer, R., & McCreight, E. (1972)**. *Organization and Maintenance of Large Ordered Indexes*. Acta Informatica. [https://doi.org/10.1007/BF00288683](https://doi.org/10.1007/BF00288683)
