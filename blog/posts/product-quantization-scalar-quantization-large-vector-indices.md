# Product Quantization (PQ) & Scalar Quantization (SQ) for Large Vector Indices

Storing raw vectors in memory becomes cost-prohibitive at scale. For example, a dataset of 100 million vectors with 1536 dimensions stored as 32-bit floating points (FP32) requires approximately 614 GB of raw RAM—excluding HNSW graph indices, which double that memory footprint.

To scale search systems efficiently, vector databases implement lossy compression techniques like **Scalar Quantization (SQ)** and **Product Quantization (PQ)**.

By converting floating-point vectors into compact quantized representations, databases can compress indices by up to 95%, trading a small drop in search accuracy for massive hardware cost savings.

This article details the mechanics of SQ and PQ compression algorithms.

---

## Product Quantization Compression Flow

Product Quantization splits vectors into sub-spaces and encodes them using codebook cluster IDs:

```mermaid
graph TD
  A[Raw Vector: 1024-dim FP32 - 4096 Bytes] --> B[Split into 8 Sub-Vectors of 128-dim]
  
  subgraph SG1_ProductQuantizationEncoding ["Product Quantization Encoding"]
    B --> C[Sub-Vector 1]
    B --> D[Sub-Vector 8]
    
    C -->|Assign Closest Centroid ID| E[Centroid 42: 1 Byte]
    D -->|Assign Closest Centroid ID| F[Centroid 192: 1 Byte]
  end
  
  E --> G[Quantized Vector: 8 Bytes total - 99.8% Compression]
  F --> G
```

### Quantization Strategies
1. **Scalar Quantization (SQ8)**: Standardizes and clips float values to fit within a dynamic range of 256 values, mapping them to 8-bit integers (`INT8`). This cuts memory consumption by 75% while maintaining high recall (often $>98\%$).
2. **Product Quantization (PQ)**: Segments vectors into $M$ sub-vectors. For each sub-space, a K-Means clustering algorithm is run to build a **codebook** of 256 centroids. Each sub-vector is then replaced with its closest 1-byte centroid ID.
3. **Asymmetric Distance Computation (ADC)**: When searching, the query vector is kept in raw FP32 format. Distance is computed directly against the database's compressed codebook tables, saving CPU cycles by avoiding full decompression runs.

---

## Python Implementation: Product Quantization Encoder

Here is a production-grade Python implementation of a Product Quantization encoder. It segments high-dimensional vectors, assigns them to simulated codebook centroids, and executes asymmetric distance calculations:

```python
import numpy as np
from typing import List, Dict, Tuple
from pydantic import BaseModel

class CodebookCentroids(BaseModel):
    subspace_index: int
    centroids: List[List[float]]

class ProductQuantizer:
    """
    Compresses vectors using Product Quantization (PQ) and performs
    Asymmetric Distance Computation (ADC) search ranking.
    """
    def __init__(self, num_subspaces: int = 4, centroids_per_subspace: int = 16):
        self.m = num_subspaces
        self.k = centroids_per_subspace
        self.codebooks: Dict[int, np.ndarray] = {}

    def fit_codebooks(self, training_vectors: np.ndarray):
        """
        Fits codebook centroids across vector sub-spaces using K-Means.
        """
        n, dim = training_vectors.shape
        sub_dim = dim // self.m
        
        for i in range(self.m):
            subspace_data = training_vectors[:, i * sub_dim : (i + 1) * sub_dim]
            # Simulate K-Means clustering centroid training
            # In production, use scipy.cluster.vq.kmeans or FAISS
            random_indices = np.random.choice(n, self.k, replace=False)
            self.codebooks[i] = subspace_data[random_indices]

    def encode(self, vector: np.ndarray) -> np.ndarray:
        """
        Compresses a raw vector into a sequence of centroid indices (1 byte per subspace).
        """
        dim = vector.shape[0]
        sub_dim = dim // self.m
        code = np.zeros(self.m, dtype=np.uint8)

        for i in range(self.m):
            sub_vec = vector[i * sub_dim : (i + 1) * sub_dim]
            centroids = self.codebooks[i]
            # Find closest centroid index by Euclidean distance
            distances = np.linalg.norm(centroids - sub_vec, axis=1)
            code[i] = np.argmin(distances)

        return code

    def compute_asymmetric_distance(self, raw_query: np.ndarray, compressed_code: np.ndarray) -> float:
        """
        Performs Asymmetric Distance Computation (ADC): Query is raw, target is compressed.
        """
        dim = raw_query.shape[0]
        sub_dim = dim // self.m
        total_dist_sq = 0.0

        for i in range(self.m):
            sub_query = raw_query[i * sub_dim : (i + 1) * sub_dim]
            centroid = self.codebooks[i][compressed_code[i]]
            total_dist_sq += np.sum((sub_query - centroid) ** 2)

        return float(np.sqrt(total_dist_sq))

# Demonstration Execution
if __name__ == "__main__":
    np.random.seed(42)

    # 1. Initialize dataset with 128-dimensional vectors
    dataset = np.random.randn(500, 128)
    query_vector = np.random.randn(128)

    # Instantiate PQ with 8 sub-spaces (each sub-vector has dimension 16)
    pq = ProductQuantizer(num_subspaces=8, centroids_per_subspace=16)
    pq.fit_codebooks(dataset)

    # 2. Encode target vectors
    target_vec = dataset[0]
    compressed = pq.encode(target_vec)
    
    # 3. Calculate distance comparison
    exact_dist = np.linalg.norm(target_vec - query_vector)
    adc_dist = pq.compute_asymmetric_distance(query_vector, compressed)

    print("📊 Product Quantization Evaluation Summary:")
    print("=" * 75)
    print(f" Raw Vector Size       : {target_vec.nbytes} Bytes (128 floats)")
    print(f" Quantized Vector Size : {compressed.nbytes} Bytes (8 uint8 codes)")
    print(f" Compression Ratio     : {target_vec.nbytes / compressed.nbytes:.1f}x")
    print(f" Exact L2 Distance     : {exact_dist:.4f}")
    print(f" Asymmetric Distance   : {adc_dist:.4f}")
    print(f" Approximation Error   : {abs(exact_dist - adc_dist):.4f}")
```

---

## Quantization Gotchas & Guardrails

When configuring vector compression:

> [!IMPORTANT]
> **Use representative training data for K-Means**: Product Quantization relies on pre-calculating codebook centroids. If your training dataset does not represent the query distribution (e.g. training on financial data but querying medical documents), your centroids will be poorly aligned, causing a significant drop in search recall.

> [!CAUTION]
> **Avoid SQ8 on highly non-uniform distributions**: Scalar Quantization maps float values to a uniform grid. If your vector dimensions contain extreme outliers or highly non-uniform cluster densities, SQ8 will introduce massive rounding distortions. Use Product Quantization (PQ) instead, as it dynamically adapts to multi-dimensional densities.

---

## Real-World Enterprise Impact
Teams deploying quantized index partitions report:
* **90% Infrastructure Cost Reductions**: Compressing vector indices enables hosting a 1-billion vector dataset on a fraction of the hardware, avoiding massive RAM costs.
* **Stable Sub-10ms Query Latencies**: Smaller memory footprint increases CPU L3 cache hits, accelerating asymmetric lookup speed.
