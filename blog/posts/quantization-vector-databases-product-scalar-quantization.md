# Quantization in Vector Databases: Product Quantization (PQ) & Scalar Quantization (SQ)

Storing and searching billion-scale vector collections presents a formidable RAM infrastructure bottleneck.

Each $1536$-dimensional vector embedding represented as 32-bit single-precision floating-point numbers (`float32`) consumes $6,144$ bytes ($1536 \times 4$ bytes). Storing 100 million uncompressed vectors requires **$614.4$ GB of high-speed RAM**—excluding graph index overhead!

At scale, keeping raw floating-point vectors in memory becomes financially unviable.

To reduce RAM consumption by up to $64\times$ while maintaining high search accuracy, vector database engines (**Faiss**, **Milvus**, **Qdrant**, **Pinecone**) utilize **Vector Quantization**.

Quantization techniques—such as **Scalar Quantization (SQ8)** and **Product Quantization (PQ)**—compress continuous float32 vectors into compact integer byte codes.

This article explores the mathematical mechanics of SQ8, Product Quantization, and Asymmetric Distance Computation (ADC).

---

## Product Quantization (PQ) Sub-Vector Decomposition Architecture

How Product Quantization splits high-dimensional vectors into sub-vectors and encodes them into byte codes:

```mermaid
graph TD
  subgraph SG1_RawFloat32Vector ["Raw Float32 Vector (D = 1536 dims, 6144 bytes)"]
    V[Raw Vector: 1536 float32 values] -->|1. Decompose into M=8 Sub-vectors| SV1[Sub-vector 1: 192 dims]
    V --> SV2[Sub-vector 2: 192 dims]
    V --> SV8[Sub-vector 8: 192 dims]
  end
  
  subgraph SG2_SubSpaceK ["Sub-space K-Means Codebooks (256 Centroids per Sub-space)"]
    SV1 -->|2. Find Nearest Centroid| CB1[Codebook 1: Centroid ID #42]
    SV2 -->|2. Find Nearest Centroid| CB2[Codebook 2: Centroid ID #189]
    SV8 -->|2. Find Nearest Centroid| CB8[Codebook 8: Centroid ID #7]
  end
  
  subgraph SG3_CompressedByteCode ["Compressed Byte Code Output (8 bytes total! 99.87% Memory Savings)"]
    CB1 & CB2 & CB8 -->|3. Assemble Byte Code| Quantized[Quantized Byte Array: [42, 189, ..., 7]]
  end
```

### Core Quantization Techniques
1. **Scalar Quantization (SQ8)**: Quantizes each individual 32-bit float component $v_i$ independently into an 8-bit unsigned integer ($int8$). It computes the global minimum ($\min$) and maximum ($\max$) across vector dimensions:
   $$\tilde{v}_i = \text{round}\left(255 \cdot \frac{v_i - \min}{\max - \min}\right)$$
   SQ8 reduces RAM consumption by **$4\times$** (from $6,144$ bytes down to $1,536$ bytes per $1536$-dim vector) with virtually zero loss in recall.
2. **Product Quantization (PQ)**: Decomposes a $D$-dimensional space into $M$ orthogonal sub-spaces of dimension $d^* = D / M$. For each sub-space, a $k$-means clustering algorithm learns $K=256$ centroids. Each sub-vector is replaced by the 1-byte integer ID ($0$ to $255$) of its nearest centroid. PQ reduces RAM consumption by up to **$64\times$**!
3. **Asymmetric Distance Computation (ADC)**: During query processing, the user query vector remains unquantized (`float32`). The search engine precomputes a $M \times 256$ Look-Up Table (LUT) containing distances between the query's sub-vectors and all 256 centroids per codebook. Asymmetric distance to any quantized database item is then calculated by summing $M$ array lookups, executing in nanoseconds.

---

## Python Implementation: SQ8 & Product Quantization Engine

Here is a production-grade Python implementation of Scalar Quantization (SQ8), Product Quantization (PQ), and Asymmetric Distance Computation (ADC):

```python
import math
from typing import List, Tuple
from pydantic import BaseModel

class SQ8Quantizer:
    """
    Scalar Quantizer (SQ8): Maps float32 values to uint8 (0-255).
    """
    def __init__(self, min_val: float = -1.0, max_val: float = 1.0):
        self.min_val = min_val
        self.max_val = max_val

    def quantize(self, vector: List[float]) -> bytes:
        buf = bytearray()
        scale = 255.0 / (self.max_val - self.min_val)
        for val in vector:
            clamped = max(self.min_val, min(self.max_val, val))
            q_val = int(round((clamped - self.min_val) * scale))
            buf.append(q_val)
        return bytes(buf)

    def dequantize(self, q_bytes: bytes) -> List[float]:
        scale = (self.max_val - self.min_val) / 255.0
        return [self.min_val + (b * scale) for b in q_bytes]

class ProductQuantizerEngine:
    """
    Product Quantizer (PQ) with Asymmetric Distance Computation (ADC).
    """
    def __init__(self, vector_dim: int = 8, M: int = 2, K: int = 4):
        self.vector_dim = vector_dim
        self.M = M                           # Number of sub-vectors
        self.d_star = vector_dim // M        # Dimensions per sub-vector
        self.K = K                           # Number of centroids per codebook
        # M codebooks: sub_space_idx -> centroid_idx -> sub_vector
        self.codebooks: List[List[List[float]]] = []
        self._initialize_dummy_codebooks()

    def _initialize_dummy_codebooks(self):
        """Simulates pre-trained K-Means centroids for demonstration."""
        for m in range(self.M):
            centroids = []
            for k in range(self.K):
                # Generate synthetic centroid sub-vectors
                centroid = [round((k + 1) * 0.2 + (m * 0.1), 2) for _ in range(self.d_star)]
                centroids.append(centroid)
            self.codebooks.append(centroids)

    def _find_nearest_centroid(self, sub_vector: List[float], sub_space_idx: int) -> int:
        best_k = 0
        min_dist = float('inf')
        for k, centroid in enumerate(self.codebooks[sub_space_idx]):
            dist = sum((a - b) ** 2 for a, b in zip(sub_vector, centroid))
            if dist < min_dist:
                min_dist = dist
                best_k = k
        return best_k

    def encode(self, vector: List[float]) -> bytes:
        """Encodes vector into M byte-code centroid IDs."""
        byte_codes = bytearray()
        for m in range(self.M):
            sub_vec = vector[m * self.d_star : (m + 1) * self.d_star]
            c_id = self._find_nearest_centroid(sub_vec, m)
            byte_codes.append(c_id)
        return bytes(byte_codes)

    def compute_adc_distance(self, query_vector: List[float], byte_codes: bytes) -> float:
        """
        Asymmetric Distance Computation (ADC) using precomputed Look-Up Table (LUT).
        """
        # 1. Precompute Distance Look-Up Table (LUT) for Query Vector
        # lut[m][k] = Squared L2 Distance from query sub-vector m to centroid k
        lut: List[List[float]] = []
        for m in range(self.M):
            q_sub = query_vector[m * self.d_star : (m + 1) * self.d_star]
            m_distances = []
            for k in range(self.K):
                centroid = self.codebooks[m][k]
                d = sum((a - b) ** 2 for a, b in zip(q_sub, centroid))
                m_distances.append(d)
            lut.append(m_distances)

        # 2. Fast ADC sum using M table lookups
        adc_dist = sum(lut[m][code] for m, code in enumerate(byte_codes))
        return adc_dist

# Demonstration Execution
if __name__ == "__main__":
    print("🚀 Demonstrating Scalar Quantization (SQ8) & Product Quantization (PQ)...")
    print("=" * 75)

    # 1. Test Scalar Quantization (SQ8)
    sq8 = SQ8Quantizer(min_val=-1.0, max_val=1.0)
    raw_vector = [0.85, -0.42, 0.05, 0.99, -0.88, 0.12, 0.33, -0.01]
    
    sq8_bytes = sq8.quantize(raw_vector)
    dequantized_v = sq8.dequantize(sq8_bytes)

    print(f"\n1. Scalar Quantization (SQ8) Results:")
    print(f"   • Raw Float32 Size:   {len(raw_vector) * 4} bytes")
    print(f"   • Quantized SQ8 Size: {len(sq8_bytes)} bytes  (4x Memory Reduction!)")
    print(f"   • Quantized Bytes:    {list(sq8_bytes)}")
    print(f"   • Reconstruction Err: {sum(abs(a - b) for a, b in zip(raw_vector, dequantized_v)) / len(raw_vector):.6f}")

    # 2. Test Product Quantization (PQ) & Asymmetric Distance Computation (ADC)
    pq = ProductQuantizerEngine(vector_dim=8, M=2, K=4)
    pq_codes = pq.encode(raw_vector)
    
    # Compute ADC Distance against query vector
    query_vector = [0.80, -0.40, 0.00, 0.90, -0.80, 0.10, 0.30, 0.00]
    adc_dist = pq.compute_adc_distance(query_vector, pq_codes)

    print(f"\n2. Product Quantization (PQ) & ADC Results:")
    print(f"   • Raw Float32 Size:   {len(raw_vector) * 4} bytes")
    print(f"   • Quantized PQ Size:  {len(pq_codes)} bytes  (16x Memory Reduction!)")
    print(f"   • PQ Centroid IDs:    {list(pq_codes)}")
    print(f"   • ADC Distance:       {adc_dist:.6f}")
```

---

## Vector Quantization Gotchas & Best Practices

When configuring vector database quantization:

> [!IMPORTANT]
> **Use Asymmetric Distance Computation (ADC) Over Symmetric**: In Symmetric Distance Computation (SDC), both database vectors and query vectors are quantized. In Asymmetric Distance Computation (ADC), the query vector is kept unquantized. ADC yields significantly higher search recall with negligible computational difference.

> [!CAUTION]
> **Re-rank Top Results using Uncompressed Storage**: Product Quantization (PQ) introduces quantization noise. To achieve maximum accuracy, use PQ or SQ8 to rapidly fetch top-200 candidates, then re-rank the top-200 using uncompressed raw float32 vectors stored on NVMe storage.

---

## Real-World Enterprise Impact
Vector database deployments utilizing Product Quantization report:
* **Over 90% RAM Cost Reduction**: Compressing 100M float32 vectors from $614\text{ GB}$ down to $25\text{ GB}$ allows hosting billion-scale vector indexes on modest single-node servers.
* **$5\times$ Faster Query Latencies**: Smaller byte code sizes fit entirely within CPU L3 cache lines, eliminating RAM bus memory bandwidth bottlenecks during SIMD matrix evaluations.
