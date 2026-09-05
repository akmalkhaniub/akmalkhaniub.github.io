# FlashAttention Engine: Hardware-Aware Exact Attention & SRAM Tiling

In Transformer neural networks (such as GPT-4, Llama-3, and Claude), the core computational block is **Self-Attention**:

$$\text{Attention}(Q, K, V) = \text{Softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$

For long context windows (e.g., $32\text{K}$ to $128\text{K}$ tokens), computing standard attention encounters a severe performance wall.

Standard attention materializes an intermediate $N \times N$ attention matrix in GPU **High Bandwidth Memory (HBM)**. For $N=64,000$ tokens, storing the intermediate $64\text{K} \times 64\text{K}$ matrix consumes **$8\text{ GB}$ of VRAM per attention head**, causing GPU memory OOMs and severe memory bandwidth bottlenecks.

To eliminate this memory wall, Stanford researcher Tri Dao created **FlashAttention** and **FlashAttention-2**.

By reorganizing attention computations into **SRAM Tiling Blocks** and utilizing **Online Softmax Normalization**, FlashAttention computes *exact* attention without ever materializing the $N \times N$ matrix in HBM, speeding up training and inference by $2\times$ to $4\times$.

This article details GPU memory hierarchy, SRAM tiling, and online softmax algorithms.

---

## FlashAttention GPU Memory Hierarchy & Tiling Architecture

How FlashAttention loads blocks into high-speed GPU SRAM to avoid HBM memory bandwidth bottlenecks:

```mermaid
graph TD
  subgraph Slow GPU Memory: High Bandwidth Memory (HBM ~2 TB/sec)
    Q_HBM[Q Matrix: N x d]
    K_HBM[K Matrix: N x d]
    V_HBM[V Matrix: N x d]
  end
  
  subgraph Fast On-Chip GPU Cache: L1 SRAM (~19 TB/sec)
    Q_HBM -->|1. Stream Tile Block Br x d| Q_SRAM[Q Tile Block in SRAM]
    K_HBM -->|2. Stream Tile Block Bc x d| K_SRAM[K Tile Block in SRAM]
    V_HBM -->|3. Stream Tile Block Bc x d| V_SRAM[V Tile Block in SRAM]
    
    Q_SRAM & K_SRAM & V_SRAM -->|4. Compute Tile QK^T & Online Softmax| OnlineSoftmax[Online Softmax Incremental Accumulator]
  end
  
  OnlineSoftmax -->|5. Write Final Output Tile Block (N x d)| Out_HBM[Final Output O in HBM]
```

### Core FlashAttention Mechanics
1. **GPU Memory Hierarchy**: GPUs contain two primary memory tiers:
   * **High Bandwidth Memory (HBM)**: Large capacity ($80\text{ GB}$ on A100/H100), but relatively slow bandwidth ($\approx 2.0\text{ TB/sec}$).
   * **On-Chip SRAM (Shared Memory)**: Small capacity ($\approx 192\text{ KB}$ per Streaming Multiprocessor), but ultra-fast bandwidth ($\approx 19\text{ TB/sec}$).
2. **SRAM Tiling Blocks**: FlashAttention splits the input Query ($Q$), Key ($K$), and Value ($V$) matrices into small blocks of size $B_r \times d$ and $B_c \times d$ that fit inside the $192\text{ KB}$ SRAM cache.
3. **Online Softmax Normalization**: Standard Softmax requires scaling by the sum of exponentials across the *entire* row ($\sum e^{x_i}$). FlashAttention computes Softmax incrementally across tiles using **Online Softmax**:
   $$m_{\text{new}} = \max(m_{\text{old}}, m_{\text{tile}}), \quad d_{\text{new}} = d_{\text{old}} \cdot e^{m_{\text{old}} - m_{\text{new}}} + d_{\text{tile}} \cdot e^{m_{\text{tile}} - m_{\text{new}}}$$
   This allows multiplying the partial attention weights with Value matrix $V$ on the fly without storing intermediate attention scores in HBM!

---

## Python Implementation: Tiled Online Softmax FlashAttention Engine

Here is a production-grade Python simulation of the Tiled Online Softmax FlashAttention algorithm:

```python
import torch
import math
from typing import Tuple

def standard_attention(Q: torch.Tensor, K: torch.Tensor, V: torch.Tensor) -> torch.Tensor:
    """
    Standard Self-Attention: Materializes N x N attention matrix in memory.
    O(N^2) Memory Complexity!
    """
    d_k = Q.size(-1)
    scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(d_k)
    attn_weights = torch.softmax(scores, dim=-1)  # N x N matrix materialized!
    return torch.matmul(attn_weights, V)

def flash_attention_tiled_online_softmax(
    Q: torch.Tensor, K: torch.Tensor, V: torch.Tensor, block_size: int = 2
) -> torch.Tensor:
    """
    Simulates FlashAttention Tiled Online Softmax.
    O(N) Memory Complexity - No N x N matrix materialized!
    """
    N, d = Q.shape
    d_k = d
    scale = 1.0 / math.sqrt(d_k)

    O = torch.zeros_like(Q)
    l = torch.zeros(N, 1)  # Running sum of exponentials
    m = torch.full((N, 1), -float('inf'))  # Running row max

    # Divide into Block Tiles
    num_blocks_r = (N + block_size - 1) // block_size
    num_blocks_c = (N + block_size - 1) // block_size

    # Loop over Query Tiles (Loaded into SRAM)
    for i in range(num_blocks_r):
        q_start, q_end = i * block_size, min((i + 1) * block_size, N)
        Q_i = Q[q_start:q_end]  # Tile in SRAM
        
        m_i = m[q_start:q_end]
        l_i = l[q_start:q_end]
        O_i = O[q_start:q_end]

        # Loop over Key/Value Tiles (Loaded into SRAM)
        for j in range(num_blocks_c):
            k_start, k_end = j * block_size, min((j + 1) * block_size, N)
            K_j = K[k_start:k_end]
            V_j = V[k_start:k_end]

            # Compute Tile Scores S_ij = Q_i * K_j^T
            S_ij = torch.matmul(Q_i, K_j.transpose(-2, -1)) * scale

            # Online Softmax Scaling Step
            m_ij_row, _ = torch.max(S_ij, dim=-1, keepdim=True)
            m_new = torch.maximum(m_i, m_ij_row)

            P_ij = torch.exp(S_ij - m_new)
            l_ij = torch.sum(P_ij, dim=-1, keepdim=True)

            alpha = torch.exp(m_i - m_new)
            l_new = l_i * alpha + l_ij

            # Accumulate Output Tile: O_new = (O_old * l_old * alpha + P_ij * V_j) / l_new
            O_i = (O_i * l_i * alpha + torch.matmul(P_ij, V_j)) / l_new

            m_i = m_new
            l_i = l_new

        O[q_start:q_end] = O_i

    return O

# Demonstration Execution
if __name__ == "__main__":
    torch.manual_seed(42)
    N, d = 8, 4  # 8 tokens, 4-dim embedding

    Q = torch.randn(N, d)
    K = torch.randn(N, d)
    V = torch.randn(N, d)

    print("🚀 Demonstrating FlashAttention Tiled Online Softmax Engine...")
    print("=" * 75)

    # 1. Standard Attention Output
    out_standard = standard_attention(Q, K, V)

    # 2. FlashAttention Tiled Output
    out_flash = flash_attention_tiled_online_softmax(Q, K, V, block_size=2)

    # 3. Verify Exact Numerical Match
    max_diff = torch.max(torch.abs(out_standard - out_flash)).item()
    print(f"\n1. Standard Attention Output shape: {out_standard.shape}")
    print(f"2. FlashAttention Output shape:     {out_flash.shape}")
    print(f"3. Max Absolute Numerical Difference: {max_diff:.8f}")
    
    if max_diff < 1e-6:
        print(" SUCCESS: FlashAttention Tiled Online Softmax matches Standard Attention EXACTLY!")
```

---

## FlashAttention Gotchas & Best Practices

When integrating FlashAttention into LLM inference pipelines:

> [!IMPORTANT]
> **Use FP16 or BF16 Precision**: FlashAttention CUDA kernels are heavily optimized for Tensor Cores running `fp16` or `bf16` precision. Running `fp32` attention disables Tensor Core hardware acceleration.

> [!CAUTION]
> **Ensure Head Dimensions are Multiples of 8 or 16**: FlashAttention CUDA warp block loaders require head dimensions ($d_k$) to be powers of 2 (e.g., $d_k = 64, 128, 256$). Odd head dimensions (e.g. $d_k = 80$) fall back to slow non-tiled kernel execution paths.

---

## Real-World Enterprise Impact
Platforms adopting FlashAttention (such as **PyTorch 2.0 `sdpa`**, **vLLM**, and **Triton**) report:
* **$2\times$ to $4\times$ Faster Transformer Training**: Eliminating HBM read/write bottlenecks speeds up large-scale LLM training runs.
* **$10\times$ Memory Reduction for Long Contexts**: Enables processing $128\text{K}+$ token context windows on standard GPU clusters without OOM crashes.
