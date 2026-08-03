# KV-Cache Optimization & PagedAttention for Long-Context Agents

In long-running autonomous agent applications, subagents frequently process large context windows (32K to 128K tokens) containing codebase ASTs, retrieved RAG documents, and historical tool execution trajectories.

While model weight memory remains constant during generation, **Key-Value (KV) cache memory grows dynamically with context length**. For a 70B parameter model operating at a 64K context window, storing FP16 KV-cache tensors for a single request can consume upwards of **16 GB of VRAM**.

Under traditional PyTorch allocation schemes, engines pre-allocated contiguous memory blocks for the maximum possible sequence length. This caused up to **60% to 80% VRAM memory waste** due to internal and external fragmentation.

To solve this memory bottleneck, high-performance systems use **PagedAttention** and **KV-Cache Quantization**.

This article details how PagedAttention virtual memory mapping works and how to optimize KV-cache memory footprints for long-context agent swarms.

---

## 📖 PagedAttention Virtual Memory Architecture

PagedAttention adapts classic Operating System virtual memory paging to GPU VRAM management:

```mermaid
graph TD
  subgraph Virtual Context Pages (Logical Sequence)
    A[Logical Block 0: Tokens 0..15]
    B[Logical Block 1: Tokens 16..31]
    C[Logical Block 2: Tokens 32..47]
  end
  
  subgraph Block Table Page Map
    D[Logical 0 ➔ Physical Block #7]
    E[Logical 1 ➔ Physical Block #3]
    F[Logical 2 ➔ Physical Block #12]
  end
  
  subgraph Non-Contiguous Physical GPU VRAM Blocks
    G[Physical Block #3: VRAM Addr 0x3A00]
    H[Physical Block #7: VRAM Addr 0x1F00]
    I[Physical Block #12: VRAM Addr 0x8C00]
  end
  
  A --> D --> H
  B --> E --> G
  C --> F --> I
```

### Key KV-Cache Optimization Principles
1. **Virtual Block Mapping**: KV tensors are divided into fixed-size physical blocks (e.g. 16 tokens per block). Physical blocks do not need to be contiguous in VRAM. The engine dynamically allocates new 16-token physical blocks as the model generates text.
2. **Zero Memory Waste**: Because physical blocks are allocated on-demand in small 16-token chunks, internal fragmentation drops to **less than 4%** (only occurring in the final incomplete block of a sequence).
3. **Prefix Caching & Prompt Sharing**: When 20 worker subagents share the exact same 4,000-token system prompt and tool definitions, PagedAttention shares the pre-computed physical KV-cache blocks across all 20 requests using copy-on-write reference counting.

---

## 🛠️ Python Implementation: Paged KV-Cache Virtual Memory Simulator

Here is a production Python implementation of a Paged KV-Cache Memory Allocator simulating logical-to-physical block mapping, prefix cache sharing, and VRAM fragmentation metrics:

```python
import math
from typing import Dict, List, Optional, Set
from pydantic import BaseModel

class PhysicalBlock(BaseModel):
    block_id: int
    ref_count: int = 0
    is_allocated: bool = False
    prefix_hash: Optional[str] = None

class LogicalBlockTable(BaseModel):
    request_id: str
    logical_to_physical_map: List[int]

class PagedKVCacheAllocator:
    """
    Simulates Operating System style virtual-to-physical PagedAttention allocation
    for LLM KV-Cache management.
    """
    def __init__(self, total_physical_blocks: int = 100, block_size_tokens: int = 16):
        self.block_size = block_size_tokens
        self.physical_blocks: Dict[int, PhysicalBlock] = {
            i: PhysicalBlock(block_id=i) for i in range(total_physical_blocks)
        }
        self.free_block_ids: List[int] = list(range(total_physical_blocks))
        self.prefix_hash_map: Dict[str, int] = {}  # Hash -> Physical Block ID for Prefix Caching

    def allocate_sequence(self, request_id: str, prompt_tokens: int, prompt_prefix_hash: Optional[str] = None) -> LogicalBlockTable:
        """
        Allocates physical memory blocks on-demand for an incoming sequence.
        Utilizes Prefix Caching if prompt_prefix_hash is already cached.
        """
        num_blocks_needed = math.ceil(prompt_tokens / self.block_size)
        allocated_physical_ids = []

        # Step 1: Check Prefix Cache hit for system prompt sharing
        if prompt_prefix_hash and prompt_prefix_hash in self.prefix_hash_map:
            cached_block_id = self.prefix_hash_map[prompt_prefix_hash]
            block = self.physical_blocks[cached_block_id]
            block.ref_count += 1
            allocated_physical_ids.append(cached_block_id)
            num_blocks_needed -= 1
            print(f"🎯 [Prefix Cache HIT] Shared Physical Block #{cached_block_id} for request '{request_id}' (Ref Count: {block.ref_count})")

        # Step 2: Allocate remaining physical blocks on-demand
        for _ in range(num_blocks_needed):
            if not self.free_block_ids:
                raise MemoryError("Out of GPU VRAM Physical KV-Cache Blocks!")
            
            block_id = self.free_block_ids.pop(0)
            block = self.physical_blocks[block_id]
            block.is_allocated = True
            block.ref_count = 1
            
            if prompt_prefix_hash and len(allocated_physical_ids) == 0:
                block.prefix_hash = prompt_prefix_hash
                self.prefix_hash_map[prompt_prefix_hash] = block_id

            allocated_physical_ids.append(block_id)

        print(f"✅ [Allocated Sequence '{request_id}'] Tokens: {prompt_tokens} -> Physical Blocks: {allocated_physical_ids}")
        return LogicalBlockTable(request_id=request_id, logical_to_physical_map=allocated_physical_ids)

    def free_sequence(self, table: LogicalBlockTable):
        """
        Frees physical memory blocks when a request completes, decrementing ref counts.
        """
        for block_id in table.logical_to_physical_map:
            block = self.physical_blocks[block_id]
            block.ref_count -= 1
            
            if block.ref_count == 0:
                block.is_allocated = False
                if block.prefix_hash and block.prefix_hash in self.prefix_hash_map:
                    del self.prefix_hash_map[block.prefix_hash]
                block.prefix_hash = None
                self.free_block_ids.append(block_id)
                
        print(f"🧹 [Freed Sequence '{table.request_id}'] Returned blocks to free pool. Free blocks left: {len(self.free_block_ids)}")

# Demonstration Execution
if __name__ == "__main__":
    allocator = PagedKVCacheAllocator(total_physical_blocks=20, block_size_tokens=16)

    # 1. Allocate Request A (Shared System Prompt + Context)
    system_prompt_hash = "sha256_system_prompt_v1"
    req_a = allocator.allocate_sequence("req-subagent-1", prompt_tokens=48, prompt_prefix_hash=system_prompt_hash)

    # 2. Allocate Request B (Reuses Shared System Prompt via Prefix Caching)
    req_b = allocator.allocate_sequence("req-subagent-2", prompt_tokens=32, prompt_prefix_hash=system_prompt_hash)

    # 3. Free Request A
    allocator.free_sequence(req_a)

    # 4. Free Request B
    allocator.free_sequence(req_b)
```

---

## ⚠️ Important KV-Cache Optimization Guardrails

When configuring KV-cache settings for long-context workloads:

> [!IMPORTANT]
> **Enable INT8/FP8 KV-Cache Quantization**: Quantizing KV-cache tensors from FP16 to FP8 or INT8 cuts memory footprint per token by **50%**. This effectively doubles your maximum supported context length (e.g. from 32K to 64K tokens) on the same GPU.

> [!CAUTION]
> **Tune `block_size` for Sequence Lengths**: Setting `block_size` too small (e.g. 8 tokens) increases block table lookup overhead in CUDA kernels. Setting it too large (e.g. 128 tokens) increases internal memory waste in the final block. A `block_size` of 16 or 32 tokens provides the optimal empirical balance.

---

## 📈 Real-World Enterprise Impact
Teams adopting PagedAttention and KV-Cache Quantization report:
* **96% Reduction in VRAM Memory Waste**: Eliminating static pre-allocation drops KV memory waste from 80% down to under 4%.
* **3x Higher Subagent Concurrency**: Prefix caching allows dozens of subagent workers to share system prompt KV blocks, tripling active concurrent sessions per GPU.
