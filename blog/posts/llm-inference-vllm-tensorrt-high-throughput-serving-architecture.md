# vLLM & TensorRT-LLM: High-Throughput Serving Architecture

Deploying self-hosted Small Language Models (SLMs) and open-weights foundation models (such as Llama 3, Mistral, or Qwen) in enterprise agent production environments requires specialized inference engineering. 

If developers deploy LLMs using standard PyTorch loops or basic HuggingFace pipelines, GPU hardware utilization frequently hovers at a miserable **15–20%**. Naive HTTP servers stall under concurrent load because static batching forces fast short-response requests to wait for slow long-generation requests to finish.

To achieve maximum throughput (thousands of tokens per second per GPU node), high-scale engineering teams utilize dedicated inference serving engines like **vLLM** and NVIDIA **TensorRT-LLM**.

This article analyzes the underlying architecture of high-throughput LLM serving engines and demonstrates how to benchmark multi-tenant inference workloads.

---

## Continuous Batching vs. Static Batching Architecture

The core breakthrough in modern LLM serving is **Continuous Batching** (also known as iteration-level or dynamic batching):

```mermaid
graph TD
  subgraph Traditional Static Batching (High Latency)
    A[Request 1: 50 Tokens] --> B[Static Batch 1]
    C[Request 2: 500 Tokens] --> B
    B --> D[GPU Processing Loop]
    D -->|Request 1 Finishes Early| E[GPU Idle Seats Wasted Waiting for Request 2]
  end
  
  subgraph Continuous Batching vLLM / TensorRT-LLM
    F[Request 1: Token 1..50] --> G[Dynamic Iteration Scheduler]
    H[Request 2: Token 1..500] --> G
    I[New Request 3 Arrives] --> G
    G -->|Every Generation Step| J[Inject New Request Instantly Into Open Slot]
    J --> K[100% GPU Compute Utilization]
  end
```

### Key Architectural Pillars
1. **Iteration-Level Scheduling**: Instead of operating on fixed batch boundaries, the engine schedules inference at every individual token generation step. As soon as Request 1 generates its end-of-sequence token (`<EOS>`), Request 3 is immediately inserted into that open memory slot without pausing the GPU pipeline.
2. **CUDA Graph Execution**: Launching individual CUDA kernels from Python introduces CPU-GPU synchronization overhead. High-throughput engines capture repetitive model execution graphs into compiled **CUDA Graphs**, executing entire forward passes with zero CPU launch latency.
3. **Tensor Parallelism (TP) & Pipeline Parallelism (PP)**: For large models that exceed single GPU VRAM, TensorRT-LLM and vLLM split matrix multiplications across GPUs using NCCL inter-GPU communication primitives.

---

## Python Implementation: Async vLLM Engine Benchmark Client

Here is a production Python implementation using `vLLM`'s async engine API (`AsyncLLMEngine`) to benchmark concurrent token generation throughput and request latency:

```python
import asyncio
import time
from typing import List
from pydantic import BaseModel
from vllm.engine.arg_utils import AsyncEngineArgs
from vllm.engine.async_llm_engine import AsyncLLMEngine
from vllm.sampling_params import SamplingParams

class BenchmarkMetrics(BaseModel):
    total_requests: int
    total_tokens_generated: int
    total_elapsed_time_sec: float
    tokens_per_second: float
    avg_latency_per_request_sec: float

class HighThroughputInferenceServer:
    """
    Asynchronous LLM Engine wrapper using vLLM for high-concurrency agent workloads.
    """
    def __init__(self, model_name: str = "Qwen/Qwen2.5-7B-Instruct"):
        print(f"⚙️ [vLLM Engine] Initializing model '{model_name}' with PagedAttention...")
        engine_args = AsyncEngineArgs(
            model=model_name,
            tensor_parallel_size=1,
            gpu_memory_utilization=0.90,
            max_num_batched_tokens=8192,
            max_num_seqs=256,
            trust_remote_code=True
        )
        self.engine = AsyncLLMEngine.from_engine_args(engine_args)

    async def generate_response(self, request_id: str, prompt: str) -> int:
        """
        Submits a prompt to the AsyncLLMEngine and streams output until completion.
        """
        sampling_params = SamplingParams(
            temperature=0.7,
            max_tokens=256,
            top_p=0.95
        )
        
        results_generator = self.engine.generate(prompt, sampling_params, request_id)
        tokens_count = 0
        
        async for request_output in results_generator:
            # Get count of generated tokens in current output snapshot
            if request_output.outputs:
                tokens_count = len(request_output.outputs[0].token_ids)

        return tokens_count

    async def run_concurrent_benchmark(self, prompts: List[str]) -> BenchmarkMetrics:
        """
        Executes a batch of concurrent prompts and calculates throughput metrics.
        """
        print(f"🔥 [Benchmark] Dispatching {len(prompts)} concurrent requests to engine...")
        start_time = time.perf_counter()

        tasks = [
            self.generate_response(f"req-{idx}", prompt)
            for idx, prompt in enumerate(prompts)
        ]
        
        token_counts = await asyncio.gather(*tasks)
        end_time = time.perf_counter()

        total_elapsed = end_time - start_time
        total_tokens = sum(token_counts)

        return BenchmarkMetrics(
            total_requests=len(prompts),
            total_tokens_generated=total_tokens,
            total_elapsed_time_sec=total_elapsed,
            tokens_per_second=total_tokens / total_elapsed,
            avg_latency_per_request_sec=total_elapsed / len(prompts)
        )

# Demonstration Execution
if __name__ == "__main__":
    # Simulated multi-tenant prompts
    test_prompts = [
        f"Generate a Python function to process data chunk #{i}"
        for i in range(50)
    ]

    async def demo():
        # Note: Requires GPU environment with vllm installed
        server = HighThroughputInferenceServer()
        metrics = await server.run_concurrent_benchmark(test_prompts)
        print("\n📊 Benchmark Results:")
        print(metrics.model_dump_json(indent=2))

    # asyncio.run(demo())
```

---

## Important Serving Performance Guardrails

When configuring LLM inference engines for production:

> [!IMPORTANT]
> **Set `gpu_memory_utilization` to 0.90–0.95**: Allocate 90–95% of GPU VRAM to the inference engine. vLLM uses this reserved VRAM block to allocate dynamic PagedAttention KV-cache blocks, preventing out-of-memory crashes.

> [!CAUTION]
> **Avoid Request Queue Head-of-Line Blocking**: Ensure `max_num_seqs` (maximum concurrent sequences) is tuned to your GPU VRAM size. Over-subscribing max sequences forces requests to swap KV-cache blocks to CPU RAM, causing catastrophic latency spikes.

---

## Real-World Enterprise Impact
Teams deploying vLLM and TensorRT-LLM report:
* **4x–8x Higher Token Throughput**: Continuous batching increases GPU token generation throughput from 350 tok/s to 2,400+ tok/s on an NVIDIA H100.
* **60% Reduction in Serving Infrastructure Costs**: Consolidating multi-tenant agent workloads onto high-throughput inference engines drastically reduces total GPU node counts.
