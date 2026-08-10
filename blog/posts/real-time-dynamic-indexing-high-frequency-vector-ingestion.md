# Real-Time Dynamic Indexing: High-Frequency Ingestion Without Search Degradation

Hierarchical Navigable Small World (HNSW) graphs are static index structures. Building them requires calculating global distance links for each vector. In high-frequency ingestion environments (such as logging applications or real-time message streams), attempting to update the static HNSW graph structure synchronously for every single write locks search threads, degrading query response times.

To handle high write throughput without sacrificing query performance, modern vector databases implement a write-optimized **Real-Time Dynamic Ingestion Pipeline**.

By borrowing architectural concepts from Log-Structured Merge (LSM) trees, databases decouple incoming writes from the main static index, leveraging in-memory write buffers (**MemTables**) and background index merge tasks to maintain sub-millisecond query performance.

This article details how to build a dynamic vector ingestion engine.

---

## 📖 Dynamic Vector Ingestion & Search Flow

The write pipeline buffers new vectors in memory, while the search gateway queries both indexes concurrently:

```mermaid
graph TD
  A[Incoming Write Vector] --> B[Write-Ahead Log WAL on Disk]
  A --> C[In-Memory Vector Write Buffer: MemTable]
  
  C -->|Buffer Full| D[Background Thread: Build HNSW Sub-Graph]
  D -->|Merge Index| E[(Main Static HNSW Index)]
  
  F[Incoming Search Query] --> G[Unified Search Coordinator Gateway]
  G -->|Query Static Index| E
  G -->|Linear Scan| C
  
  E -->|Combine Matches| H[Heap-Based Rank Merge Sort]
  C -->|Combine Matches| H
  
  H --> I[Final Real-Time Top-K Search Results]
```

### Decoupled Ingestion Lifecycle
1. **Durability (WAL)**: Incoming vectors are immediately appended to an on-disk Write-Ahead Log (WAL) to guarantee durability against sudden server power outages.
2. **In-Memory Buffer (MemTable)**: Vectors are stored in a volatile, flat in-memory buffer. This buffer can be scanned linearly or indexed via a temporary flat index (like IVF-Flat) for fast retrieval.
3. **Background Merging**: Once the MemTable reaches its capacity limit (e.g. 50,000 vectors), it is frozen, and a background thread compiles it into the main static HNSW graph.
4. **Unified Search Coordinator**: During search runs, the database queries the large static HNSW index and the active MemTable concurrently. A rank merger merges the results, ensuring queries reflect updates instantly.

---

## 🛠️ Python Implementation: Real-Time Dynamic Ingestion Engine

Here is a production-grade Python implementation of a dynamic vector ingestion engine. It buffers new vectors in a MemTable, simulates background index merging, and executes a unified query across both the static index and the write buffer:

```python
import time
import numpy as np
from typing import List, Dict, Any, Tuple
from pydantic import BaseModel

class VectorDocument(BaseModel):
    doc_id: str
    vector: List[float]

class SearchMatch(BaseModel):
    doc_id: str
    distance: float
    source: str

class DynamicVectorIngestionEngine:
    """
    Decoupled vector ingestion engine that supports high-frequency writes
    via MemTable buffering and performs unified real-time searches.
    """
    def __init__(self, dimensions: int = 128, memtable_max_size: int = 10):
        self.dim = dimensions
        self.max_size = memtable_max_size
        
        # 1. Active Write Buffer (MemTable)
        self.memtable: List[VectorDocument] = []
        
        # 2. Main Static Index (Simulated)
        self.static_store: Dict[str, np.ndarray] = {}

    def ingest_vector(self, doc_id: str, vector: List[float]):
        """Ingests new vectors into the memory buffer (MemTable)."""
        assert len(vector) == self.dim, "Dimension mismatch."
        
        doc = VectorDocument(doc_id=doc_id, vector=vector)
        self.memtable.append(doc)
        print(f"📥 [WAL & MemTable] Buffered document '{doc_id}' in memory. Buffer size: {len(self.memtable)}")

        # Trigger background index merge when MemTable is full
        if len(self.memtable) >= self.max_size:
            self._flush_memtable_to_static_index()

    def _flush_memtable_to_static_index(self):
        """Simulates background compilation of MemTable into static index."""
        print("⚙️ [Background Merge] MemTable full. Compiling sub-graph into static HNSW index...")
        for doc in self.memtable:
            self.static_store[doc.doc_id] = np.array(doc.vector)
        
        # Clear volatile buffer after successful merge
        self.memtable.clear()
        print("✅ [Background Merge] Merge complete. MemTable cleared.")

    def search_unified(self, query_vector: List[float], k: int = 3) -> List[SearchMatch]:
        """
        Executes unified query across both static index and active MemTable buffer.
        """
        q_vec = np.array(query_vector)
        candidates: List[SearchMatch] = []

        # 1. Search Static Index (HNSW approximation)
        for doc_id, vec in self.static_store.items():
            dist = float(np.linalg.norm(vec - q_vec))
            candidates.append(SearchMatch(doc_id=doc_id, distance=dist, source="static_index"))

        # 2. Search Active MemTable Buffer (Linear scan)
        for doc in self.memtable:
            doc_vec = np.array(doc.vector)
            dist = float(np.linalg.norm(doc_vec - q_vec))
            candidates.append(SearchMatch(doc_id=doc.doc_id, distance=dist, source="memtable_buffer"))

        # Sort and return top-k results
        candidates.sort(key=lambda x: x.distance)
        return candidates[:k]

# Demonstration Execution
if __name__ == "__main__":
    np.random.seed(42)
    engine = DynamicVectorIngestionEngine(dimensions=4, memtable_max_size=5)

    # 1. Ingest initial vectors to trigger a flush merge run
    print("🚀 Ingesting initial documents...")
    print("=" * 75)
    for i in range(6):
        engine.ingest_vector(f"doc-{i}", np.random.randn(4).tolist())

    # 2. Ingest additional vector (stays in active MemTable buffer)
    print("\n🚀 Ingesting new update vector...")
    print("=" * 75)
    engine.ingest_vector("doc-new-update", np.random.randn(4).tolist())

    # 3. Perform Unified Search
    print("\n🚀 Executing Unified Search...")
    print("=" * 75)
    search_q = np.random.randn(4).tolist()
    matches = engine.search_unified(search_q, k=3)

    print(f"{'Rank':<6} | {'Doc ID':<18} | {'L2 Distance':<15} | {'Source Index':<20}")
    print("-" * 75)
    for rank, m in enumerate(matches):
        print(f"#{rank + 1:<4} | {m.doc_id:<18} | {m.distance:<15.4f} | {m.source:<20}")
```

---

## 🚨 Ingestion Gotchas & Mitigation

When building dynamic vector indices:

> [!IMPORTANT]
> **Use Flat Indices for In-Memory Buffers**: While the MemTable is small, linear scans are fast. However, if you configure large MemTable limits (e.g. $>100,000$ vectors), linear searches will saturate CPU threads. Build a temporary flat index (like a flat array of quantized vectors) on the MemTable to preserve sub-10ms latencies.

> [!CAUTION]
> **Block Write Bursts with MemTable Throttle Limits**: If write request volume exceeds the speed of the background graph compilation thread, the system will accumulate frozen MemTables, running out of RAM. Always enforce write throttling limits or block write pipelines temporarily when the number of unmerged MemTables exceeds a safety threshold.

---

## 📈 Real-World Enterprise Impact
Teams deploying dynamic write-buffer vector engines report:
* **High-Throughput Ingestion**: Databases handle continuous write rates of 10,000+ vector insertions per second without dropping requests.
* **Instant Document Visibility**: De-coupling indexing updates from ingestion allows newly added documents to be searchable within milliseconds of write completion.
