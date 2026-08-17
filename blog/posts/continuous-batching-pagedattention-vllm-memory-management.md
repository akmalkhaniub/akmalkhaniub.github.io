# Continuous Batching & PagedAttention: vLLM Memory Management Architecture

Deploying Large Language Models (LLMs like Llama-3, Mistral, and Claude) in high-throughput production environments introduces a critical bottleneck: **GPU Memory Allocation for the Key-Value (KV) Cache**.

During autoregressive generation, LLMs store previous token attention Key and Value vectors in GPU VRAM (the KV Cache) to avoid recomputing past tokens.

In traditional serving frameworks (such as standard Hugging Face Transformers), allocating contiguous GPU VRAM for maximum output sequence lengths results in **60% to 80% VRAM waste** due to internal and external memory fragmentation.

To solve this GPU memory crisis, researchers at UC Berkeley created **PagedAttention** and **vLLM**.

By adapting virtual memory paging principles from operating systems to GPU VRAM, PagedAttention eliminates memory fragmentation and increases serving throughput by up to $4\times$.

This article details PagedAttention block tables and iteration-level continuous batching.

---

## 📖 PagedAttention Virtual Memory & Continuous Batching Architecture

How vLLM maps logical sequence tokens to non-contiguous physical GPU VRAM memory blocks:

```mermaid
graph TD
  subgraph Client Requests & Logical Token Streams
    Req1["Request 1: Token Stream (Logical Tokens 0..31)"]
    Req2["Request 2: Token Stream (Logical Tokens 0..15)"]
  end
  
  subgraph PagedAttention Block Table Mapper
    Req1 -->|Logical Block 0 (Tokens 0..15)| BlockTable1[Block Table: Logical 0 -> Physical Block #7]
    Req1 -->|Logical Block 1 (Tokens 16..31)| BlockTable1_2[Block Table: Logical 1 -> Physical Block #2]
    
    Req2 -->|Logical Block 0 (Tokens 0..15)| BlockTable2[Block Table: Logical 0 -> Physical Block #9]
  end
  
  subgraph Physical GPU VRAM Memory Pool (Non-Contiguous Pages)
    BlockTable1 --> PhysBlock7[Physical GPU Block #7 (16 Key/Value Vectors)]
    BlockTable1_2 --> PhysBlock2[Physical GPU Block #2 (16 Key/Value Vectors)]
    BlockTable2 --> PhysBlock9[Physical GPU Block #9 (16 Key/Value Vectors)]
  end
```

### Core PagedAttention Mechanics
1. **Virtual Memory Block Tables**: PagedAttention divides the KV cache into fixed-capacity physical memory blocks (e.g. each block holds KV vectors for $16$ tokens). Physical blocks do not need to be contiguous in GPU VRAM. A **Block Table** maintains a mapping from logical sequence token positions to physical GPU block IDs.
2. **Zero External Memory Fragmentation**: Because physical memory is allocated on-demand in fixed 16-token page blocks, external memory fragmentation is reduced to zero, and internal fragmentation is limited to at most one page block per request.
3. **Iteration-Level Continuous Batching**: Traditional serving batches requests statically at the HTTP request level. **Continuous Batching** operates at the *iteration level*. At every forward pass step:
   * Requests that reach their end-of-sequence (`<eos>`) token immediately drop out of the batch and release their KV physical blocks back to the free memory pool.
   * New incoming HTTP requests are immediately inserted into the active batch without waiting for previous requests to complete generation.

---

## 🛠️ Python Implementation: PagedAttention Block Manager & Scheduler Engine

Here is a production-grade Python implementation of a PagedAttention Block Table Manager and Continuous Batching Scheduler Engine:

```python
import math
from typing import List, Dict, Optional, Tuple
from pydantic import BaseModel

class PhysicalGPUBlock(BaseModel):
    block_id: int
    capacity: int = 16
    ref_count: int = 0

class SequenceRequest(BaseModel):
    request_id: str
    prompt_tokens: List[int]
    generated_tokens: List[int] = []
    max_tokens: int = 32
    block_table: List[int] = []
    is_finished: bool = False

class PagedAttentionBlockManager:
    """
    Manages non-contiguous GPU VRAM physical block allocation.
    """
    def __init__(self, num_gpu_blocks: int = 8, block_size: int = 16):
        self.block_size = block_size
        self.free_blocks: List[int] = list(range(num_gpu_blocks))
        self.gpu_blocks: Dict[int, PhysicalGPUBlock] = {
            bid: PhysicalGPUBlock(block_id=bid, capacity=block_size) for bid in self.free_blocks
        }

    def allocate_block((self) -> Optional[int]:
        if not self.free_blocks:
            return None  # Out of VRAM blocks!
        bid = self.free_blocks.pop(0)
        self.gpu_blocks[bid].ref_count = 1
        return bid

    def free_sequence_blocks(self, block_ids: List[int]):
        for bid in block_ids:
            if bid in self.gpu_blocks:
                self.gpu_blocks[bid].ref_count = 0
                self.free_blocks.append(bid)
        print(f" 🧹 [VRAM Manager] Freed Physical Blocks: {block_ids} | Remaining Free Blocks: {len(self.free_blocks)}")

class vLLMContinuousBatchScheduler:
    """
    Simulates vLLM Iteration-Level Continuous Batching Scheduler.
    """
    def __init__(self, block_manager: PagedAttentionBlockManager):
        self.block_manager = block_manager
        self.waiting_queue: List[SequenceRequest] = []
        self.running_batch: List[SequenceRequest] = []

    def add_request(self, req: SequenceRequest):
        self.waiting_queue.append(req)

    def schedule_iteration(self):
        """Schedules iteration step, adding new requests and freeing finished ones."""
        # 1. Admit new requests from waiting queue if blocks available
        while self.waiting_queue:
            req = self.waiting_queue[0]
            needed_blocks = math.ceil(len(req.prompt_tokens) / self.block_manager.block_size)
            
            allocated = []
            for _ in range(needed_blocks):
                bid = self.block_manager.allocate_block()
                if bid is not None:
                    allocated.append(bid)
                else:
                    break

            if len(allocated) == needed_blocks:
                req.block_table.extend(allocated)
                self.running_batch.append(self.waiting_queue.pop(0))
                print(f" 🚀 [Scheduler] Admitted '{req.request_id}' to Running Batch | Allocated Blocks: {allocated}")
            else:
                # Rollback allocation if partial
                self.block_manager.free_sequence_blocks(allocated)
                break

        # 2. Simulate forward pass generation step for running batch
        finished_requests = []
        print(f"\n ⚡ [Forward Pass Step] Executing continuous batch iteration ({len(self.running_batch)} requests active)...")

        for req in self.running_batch:
            next_token = 1000 + len(req.generated_tokens)
            req.generated_tokens.append(next_token)

            if len(req.generated_tokens) >= req.max_tokens:
                req.is_finished = True
                finished_requests.append(req)

        # 3. Clean up finished requests
        for freq in finished_requests:
            self.running_batch.remove(freq)
            self.block_manager.free_sequence_blocks(freq.block_table)
            print(f" ✅ [Request Complete] '{freq.request_id}' generated {len(freq.generated_tokens)} tokens.")

# Demonstration Execution
if __name__ == "__main__":
    vram_mgr = PagedAttentionBlockManager(num_gpu_blocks=6, block_size=16)
    scheduler = vLLMContinuousBatchScheduler(vram_mgr)

    print("🚀 Demonstrating PagedAttention & Continuous Batching Architecture...")
    print("=" * 75)

    # 1. Submit 3 Incoming HTTP Requests
    scheduler.add_request(SequenceRequest(request_id="req-user-1", prompt_tokens=list(range(20)), max_tokens=5))
    scheduler.add_request(SequenceRequest(request_id="req-user-2", prompt_tokens=list(range(10)), max_tokens=3))

    # 2. Run Continuous Batch Iterations
    for step in range(1, 6):
        print(f"\n--- Iteration Step #{step} ---")
        scheduler.schedule_iteration()
```

---

## 🚨 LLM Serving Engine Gotchas & Best Practices

When deploying high-throughput LLM inference infrastructure:

> [!IMPORTANT]
> **Optimize Page Block Size**: Setting the PagedAttention block size too small (e.g. 2 tokens) increases CPU block table lookup overhead. Setting it too large (e.g. 128 tokens) increases internal memory fragmentation. Set the default block size to **16 or 32 tokens** for optimal performance.

> [!CAUTION]
> **Enable Prefix Caching for Shared System Prompts**: Multi-tenant LLM applications (such as agents or code assistants) share long system prompts. Enable **vLLM Automatic Prefix Caching (APC)** to share physical KV cache blocks across multiple user requests, eliminating redundant prompt prefill computation.

---

## 📈 Real-World Enterprise Impact
Platforms adopting PagedAttention and continuous batching (such as **vLLM** and **TGI**) report:
* **$3.8\times$ Throughput Increase**: Serving $4\times$ more user requests per GPU node compared to traditional static batching.
* **Over 80% Reduction in GPU Memory Waste**: Eliminating external fragmentation allows maxing out GPU compute utilization cleanly.
