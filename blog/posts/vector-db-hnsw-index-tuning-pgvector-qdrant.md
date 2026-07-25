# HNSW Index Tuning: Optimizing efSearch and M for High-Throughput Search

In vector retrieval applications, matching a user's query vector against millions of document vectors is computationally expensive. Running a full brute-force linear search (Flat index) guarantees 100% recall, but scales linearly ($O(N)$), degrading latency to hundreds of milliseconds in large datasets.

To achieve sub-10ms search times, production databases use **Approximate Nearest Neighbor (ANN)** search algorithms. The gold standard for ANN search is the **Hierarchical Navigable Small World (HNSW)** graph index. This article details HNSW's layered routing architecture and how to tune its parameters (`M`, `efConstruction`, and `efSearch`) in **pgvector** and **Qdrant** to balance search latency and recall accuracy.

---

## 📖 Under the Hood: HNSW's Layered Routing

HNSW organizes vectors into a multi-layered graph, mimicking a skip list:
* **Upper Layers**: Contain fewer nodes with longer-range links. Queries execute fast, high-level routing to quickly zoom in on the region of interest.
* **Lower Layers**: Contain denser links. Routing transitions downward to execute fine-grained, localized searches until it reaches the base layer (Layer 0), which contains all vectors.

```mermaid
graph TD
  subgraph Layer 2 (Express Layer)
    L2_A[Vector Entry] --> L2_B[Far Destination]
  end
  subgraph Layer 1 (Local Area Layer)
    L1_A[Vector Entry] --> L1_B[Mid Destination 1]
    L1_B --> L1_C[Mid Destination 2]
  end
  subgraph Layer 0 (Base Layer - All Vectors)
    L0_A[Vector Entry] --> L0_B[Node A]
    L0_B --> L0_C[Node B]
    L0_C --> L0_D[Node C]
  end
  L2_A --> L1_A
  L1_B --> L0_B
```

### The Core Tuning Knobs
* **`M`**: The maximum number of bidirectional link connections established for each new node added to the graph. 
  * *Impact*: Higher `M` values improve graph connectivity (improving recall on high-dimensional vectors) but increase memory consumption and index build times.
* **`efConstruction`**: The size of the dynamic candidate list evaluated during index creation.
  * *Impact*: Higher `efConstruction` values generate higher-quality graphs (better link choices) but slow down build times.
* **`efSearch`**: The size of the dynamic candidate list maintained during query execution.
  * *Impact*: Higher `efSearch` values increase search recall (accuracy) but increase latency as the query must traverse more paths. Unlike `M` and `efConstruction`, this is a **runtime** parameter.

---

## 🛠️ Tuning HNSW Indexes in Production

### 1. Optimizing pgvector in PostgreSQL
To create a high-performance HNSW index in PostgreSQL, use the `hnsw` index type and specify your `m` and `ef_construction` parameters during index definition:

```sql
-- 1. Create HNSW index with custom hyperparameters
-- Optimized for 1536-dimensional vectors (e.g. text-embedding-3-small)
CREATE INDEX CONCURRENTLY products_hnsw_idx 
ON products 
USING hnsw (embedding_vector vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 2. Configure runtime search boundary parameters
-- Set ef_search high inside active user sessions to guarantee high recall
SET hnsw.ef_search = 40;

-- Execute query
SELECT id, name, description
FROM products
ORDER BY embedding_vector <=> '[0.015, -0.024, ..., 0.087]'
LIMIT 10;
```

### 2. Configuring Qdrant Collections
In Qdrant, index parameters are configured when creating or updating collections. Here is a REST configuration payload to optimize a Qdrant collection for high-throughput querying:

```json
{
  "name": "enterprise_kb",
  "vectors": {
    "size": 1536,
    "distance": "Cosine"
  },
  "hnsw_config": {
    "m": 16,
    "ef_construct": 100,
    "full_scan_threshold": 10000,
    "max_elements_on_leaf": 512
  },
  "optimizers_config": {
    "default_segment_number": 2
  }
}
```

To run queries with optimized search bounds dynamically in Qdrant, pass the runtime parameter overrides in your query payload:

```json
{
  "vector": [0.015, -0.024, 0.087],
  "limit": 10,
  "params": {
    "hnsw_ef": 64,
    "exact": false
  }
}
```

---

## ⚖️ Recall vs. Latency Trade-offs

| Mode | `M` | `efConstruction` | `efSearch` | Latency (p99) | Recall Accuracy |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Ultra-Fast Search** | 8 | 32 | 16 | **<2ms** | ~85% |
| **Balanced Production** | 16 | 64 | 40 | **~5ms** | ~96% |
| **High Precision RAG** | 32 | 128 | 120 | **~15ms** | ~99.4% |

---

## ⚠️ Important Pitfalls in Index Configuration

Ensure your configurations avoid these performance bottlenecks:

> [!IMPORTANT]
> **Build Time Lockups**: Creating HNSW indexes on large tables (e.g. >10 million rows) is highly resource-intensive and can lock writes. Always specify `CREATE INDEX CONCURRENTLY` in PostgreSQL to ensure the database can continue handling client traffic during index generation.

> [!CAUTION]
> **Memory Allocation**: HNSW graphs are stored entirely in RAM to support fast lookup hops. An index configured with high `M` (e.g. 64) can easily occupy tens of gigabytes of RAM. Calculate index memory sizes before deploying to production servers.
