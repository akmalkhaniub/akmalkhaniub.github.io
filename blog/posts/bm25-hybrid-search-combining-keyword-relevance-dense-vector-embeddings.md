# BM25 & Hybrid Search: Combining Keyword Relevance with Dense Vector Embeddings

In modern Information Retrieval (IR), artificial intelligence teams faces a dilemma when choosing search algorithms:
1. **Dense Vector Search (Semantic)** excels at capturing deep conceptual meaning ("automobile" matches "car", "Python frameworks" matches "FastAPI"). However, it struggles with exact keyword lookups, stock keeping unit (SKU) part numbers, error codes (`ERR-9021`), or rare proper names.
2. **Sparse Keyword Search (Okapi BM25)** excels at exact keyword matching and rare term retrieval. However, it fails completely when queries and documents use different synonyms without exact word overlaps.

To achieve superior search quality, production search architectures (such as **Elasticsearch**, **Qdrant**, and **Weaviate**) combine sparse keyword retrieval with dense vector embeddings into **Hybrid Search**.

By fusing sparse BM25 scores with dense vector similarities using **Reciprocal Rank Fusion (RRF)**, hybrid search delivers both high semantic recall and precise keyword accuracy.

This article explores the Okapi BM25 formula and Reciprocal Rank Fusion algorithms.

---

## 📖 Hybrid Search & Reciprocal Rank Fusion Architecture

How a Hybrid Search Engine executes parallel Sparse + Dense queries and merges rank positions:

```mermaid
graph TD
  Query["User Search Query: 'FastAPI error ERR-401'"] --> SparseEngine[Sparse BM25 Keyword Search Engine]
  Query --> EmbeddingModel[Text Embedding Model: OpenAI / Cohere]
  
  EmbeddingModel -->|Dense Vector| DenseEngine[Dense Vector HNSW Search Engine]
  
  subgraph Parallel Retrieval Pipelines
    SparseEngine -->|Top-K Ranked Documents| SparseList["BM25 Ranked List: [Doc 12 (Rank 1), Doc 4 (Rank 2)]"]
    DenseEngine -->|Top-K Ranked Documents| DenseList["Dense Vector List: [Doc 88 (Rank 1), Doc 12 (Rank 2)]"]
  end
  
  subgraph Reciprocal Rank Fusion RRF Engine
    SparseList --> RRF[Reciprocal Rank Fusion Engine: Score = 1 / (60 + Rank)]
    DenseList --> RRF
  end
  
  RRF -->|Fused Score Calculation| FinalResults["Consolidated Hybrid Results: Doc 12 (Score: 0.0325)"]
```

### Core Search Formulas
1. **Okapi BM25 Term Weighting**: An evolution of TF-IDF. Computes document relevance by incorporating non-linear term frequency saturation ($k_1$) and document length normalization ($b$):
   $$\text{Score}(D, Q) = \sum_{i=1}^{n} \text{IDF}(q_i) \cdot \frac{f(q_i, D) \cdot (k_1 + 1)}{f(q_i, D) + k_1 \cdot \left(1 - b + b \cdot \frac{|D|}{\text{avgdl}}\right)}$$
   Where $k_1 \approx 1.2$ to $2.0$ and $b \approx 0.75$.
2. **Reciprocal Rank Fusion (RRF)**: Merging raw score outputs from BM25 (e.g. scores ranging $0$ to $25$) and Cosine Similarity (scores ranging $0.0$ to $1.0$) directly is problematic because their score distributions differ. RRF ignores raw score magnitudes and operates strictly on **rank positions** ($r(d)$):
   $$\text{RRF\_Score}(d) = \sum_{m \in M} \frac{1}{k + r_m(d)}$$
   Where $k$ is a smoothing constant (typically $k=60$).

---

## 🛠️ Python Implementation: BM25 & RRF Hybrid Search Engine

Here is a production-grade Python implementation of an Okapi BM25 Keyword Ranker, Dense Vector Simulator, and Reciprocal Rank Fusion Engine:

```python
import math
from typing import List, Dict, Tuple, Set
from pydantic import BaseModel

class Document(BaseModel):
    doc_id: str
    text: str
    vector: List[float]

class BM25Ranker:
    """
    Implements Okapi BM25 Keyword Search Scoring.
    """
    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.docs: Dict[str, Document] = {}
        self.doc_lengths: Dict[str, int] = {}
        self.avgdl: float = 0.0
        # term -> doc_id -> term_frequency
        self.tf: Dict[str, Dict[str, int]] = {}
        # term -> document_frequency
        self.df: Dict[str, int] = {}

    def fit(self, documents: List[Document]):
        total_length = 0
        for doc in documents:
            self.docs[doc.doc_id] = doc
            tokens = doc.text.lower().split()
            self.doc_lengths[doc.doc_id] = len(tokens)
            total_length += len(tokens)

            tf_dict: Dict[str, int] = {}
            for t in tokens:
                tf_dict[t] = tf_dict.get(t, 0) + 1
            
            for t, count in tf_dict.items():
                if t not in self.tf:
                    self.tf[t] = {}
                    self.df[t] = 0
                self.tf[t][doc.doc_id] = count
                self.df[t] += 1

        self.avgdl = total_length / len(documents) if documents else 0.0

    def search(self, query: str, top_k: int = 5) -> List[Tuple[str, float]]:
        query_tokens = query.lower().split()
        scores: Dict[str, float] = {}
        num_docs = len(self.docs)

        for token in query_tokens:
            if token not in self.df:
                continue
            
            # Compute Inverse Document Frequency (IDF)
            df_t = self.df[token]
            idf = math.log((num_docs - df_t + 0.5) / (df_t + 0.5) + 1.0)

            for doc_id, freq in self.tf[token].items():
                doc_len = self.doc_lengths[doc_id]
                # BM25 Term Weighting Formula
                numerator = freq * (self.k1 + 1.0)
                denominator = freq + self.k1 * (1.0 - self.b + self.b * (doc_len / self.avgdl))
                scores[doc_id] = scores.get(doc_id, 0.0) + (idf * (numerator / denominator))

        sorted_results = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_results[:top_k]

class ReciprocalRankFusion:
    """
    Fuses multiple ranked lists using Reciprocal Rank Fusion (RRF).
    """
    @staticmethod
    def fuse(ranked_lists: List[List[Tuple[str, float]]], k: int = 60) -> List[Tuple[str, float]]:
        rrf_scores: Dict[str, float] = {}

        for ranked_list in ranked_lists:
            for rank_idx, (doc_id, _) in enumerate(ranked_list):
                rank_pos = rank_idx + 1  # 1-based rank position
                score = 1.0 / (k + rank_pos)
                rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + score

        sorted_fused = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_fused

# Demonstration Execution
if __name__ == "__main__":
    docs = [
        Document(doc_id="doc-1", text="FastAPI high concurrency async worker architecture", vector=[0.9, 0.1, 0.0]),
        Document(doc_id="doc-2", text="Fixing database timeout error ERR-401 in Python", vector=[0.1, 0.8, 0.1]),
        Document(doc_id="doc-3", text="FastAPI authentication middleware error ERR-401 handler", vector=[0.8, 0.7, 0.1]),
    ]

    bm25 = BM25Ranker()
    bm25.fit(docs)

    print("🚀 Demonstrating BM25 & Hybrid Search Reciprocal Rank Fusion...")
    print("=" * 75)

    query_text = "FastAPI error ERR-401"
    
    # 1. Sparse BM25 Keyword Search
    bm25_results = bm25.search(query_text, top_k=3)
    print(f"\n1. Sparse BM25 Search Results for '{query_text}':")
    for doc_id, score in bm25_results:
        print(f"   • Document '{doc_id}' -> BM25 Score: {score:.4f}")

    # 2. Simulated Dense Vector Search Results (Ranked List)
    dense_vector_results = [("doc-3", 0.95), ("doc-1", 0.88), ("doc-2", 0.45)]
    print(f"\n2. Dense Vector Search Results (Cosine Similarity):")
    for doc_id, score in dense_vector_results:
        print(f"   • Document '{doc_id}' -> Cosine Sim: {score:.4f}")

    # 3. Fuse RRF Rankings
    fused_results = ReciprocalRankFusion.fuse([bm25_results, dense_vector_results], k=60)
    print(f"\n3. Reciprocal Rank Fusion (RRF) Hybrid Search Results:")
    for doc_id, rrf_score in fused_results:
        print(f"   • Document '{doc_id}' -> Fused RRF Score: {rrf_score:.6f}")
```

---

## 🚨 Hybrid Search Gotchas & Best Practices

When building hybrid search pipelines:

> [!IMPORTANT]
> **Use RRF Over Linear Alpha Score Weighting**: Trying to combine raw scores using linear weighting ($\alpha \cdot \text{BM25} + (1-\alpha) \cdot \text{Vector}$) requires normalizing unpredictable score bounds. Reciprocal Rank Fusion (RRF) operates purely on rank positions, making it robust against varying score distributions.

> [!CAUTION]
> **Preserve Exact Match Boosting**: For queries containing specialized identifiers (such as product UUIDs or email addresses), apply a high BM25 weight or filter constraint to ensure exact keyword hits are not diluted by dense vector semantic approximations.

---

## 📈 Real-World Enterprise Impact
Search platforms switching to BM25 + Vector Hybrid Search report:
* **30% Increase in Search Relevance (NDCG@10)**: Combining semantic understanding with exact term matching outperforms pure vector search on real-world search benchmarks.
* **100% Exact Match Accuracy for Product SKUs**: Hybrid search guarantees that users searching for exact part numbers receive exact catalog matches every time.
