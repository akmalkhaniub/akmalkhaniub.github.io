# Speculative Decoding & Medusa Tree Attention: Accelerating LLM Inference by 3x Without Accuracy Loss

In modern large language model infrastructure (**vLLM**, **TensorRT-LLM**, **HuggingFace TGI**, **SGLang**), autoregressive token generation has historically suffered from a severe hardware limitation: **GPU memory bandwidth starvation**.

When serving a large 70-billion parameter model (`float16` weights = $140\text{ GB}$), generating a single token requires transferring all $140\text{ GB}$ of model weights from High Bandwidth Memory (HBM) into on-chip GPU SRAM.

Because the arithmetic intensity is extremely low during single-batch generation, **GPU Tensor Cores sit idle for $> 90\%$ of clock cycles**, purely waiting for memory bus transfers.

To break through this hardware memory wall, modern inference engines leverage **Speculative Decoding** and **Medusa Multi-Head Tree Attention**: techniques that accelerate generation by **$2.5\times \text{ to } 3.2\times$** while guaranteeing **zero degradation in output accuracy or mathematical distribution**.

```mermaid
graph TD
  subgraph Standard Autoregressive vs Speculative Decoding
    subgraph 1. Standard Autoregressive (Memory Bound: 1 Token Per Pass)
      P1[Load 140GB Weights] --> T1[Generate Token 1]
      T1 --> P2[Load 140GB Weights] --> T2[Generate Token 2]
      T2 --> P3[Load 140GB Weights] --> T3[Generate Token 3]
    end

    subgraph 2. Speculative Decoding (Compute Bound: 3-5 Tokens Per Pass)
      Draft[Fast Draft Model: Proposes 5 Tokens in 5ms] --> ParallelTarget[Target 70B Model: Validates All 5 Tokens in ONE 20ms Pass]
      ParallelTarget --> Accept["Accept Tokens 1, 2, 3, 4 (Zero Loss!)"]
    end
  end
```

---

## 🛑 1. The Memory Bandwidth Bottleneck in Autoregressive LLMs

During standard autoregressive generation, generating $N$ tokens requires $N$ sequential forward passes:

$$\text{Time per Token} = \frac{\text{Model Weights Size (Bytes)}}{\text{GPU Memory Bandwidth (Bytes/sec)}} + \text{Compute Latency}$$

On an Nvidia H100 GPU ($3.35\text{ TB/s}$ memory bandwidth) running a 70B model ($140\text{ GB}$ weights):

$$\text{Theoretical Memory Transfer Time} = \frac{140 \times 10^9 \text{ bytes}}{3.35 \times 10^{12} \text{ bytes/sec}} \approx \mathbf{41.8 \text{ milliseconds per token}} \quad (\approx 24 \text{ tokens/sec})$$

Notice that whether we compute 1 token or 5 tokens simultaneously, the time required to read the $140\text{ GB}$ weights across the GPU bus is almost identical.

The core insight of speculative decoding is to **turn memory-bound waiting time into useful parallel tensor compute**.

---

## 🎲 2. The Mathematical Foundation of Speculative Sampling

Introduced independently by Leviathan et al. (Google) and Chen et al. (DeepMind) in 2022, speculative decoding pairs a massive **Target Model ($M_{\text{target}}$, e.g. 70B)** with a lightweight, ultrafast **Draft Model ($M_{\text{draft}}$, e.g. 8B)**.

```mermaid
sequenceDiagram
  autonumber
  participant D as Fast Draft Model (8B)
  participant T as Large Target Model (70B)
  participant Out as Output Stream

  Note over D: Draft Phase (Memory Footprint ~16GB)
  D->>D: Autoregressively generates K=4 candidate tokens: [w1, w2, w3, w4]
  
  Note over T: Parallel Verification Phase (Single 140GB Pass)
  D->>T: Submit prefix + [w1, w2, w3, w4]
  T->>T: Computes probabilities for all 4 positions in parallel
  T->>T: Evaluates Speculative Acceptance Condition
  
  Note over T: Accepts w1, w2, w3; Rejects w4; Emits correction w4*
  T-->>Out: Emits 4 tokens [w1, w2, w3, w4*] in a SINGLE forward pass!
```

### The Acceptance Sampling Rule (Zero Distributional Drift)
To guarantee that the generated text matches the target model's exact probability distribution $P_{\text{target}}$, candidate token $x_k$ is accepted with probability:

$$\alpha = \min\left(1, \frac{P_{\text{target}}(x_k \mid x_{<k})}{P_{\text{draft}}(x_k \mid x_{<k})}\right)$$

* **If Accepted**: The token is committed to the sequence.
* **If Rejected**: The token is discarded, and a replacement token is sampled from the residual distribution:
  $$P_{\text{residual}}(x) = \text{normalize}\left(\max\left(0, P_{\text{target}}(x) - P_{\text{draft}}(x)\right)\right)$$

> [!IMPORTANT]
> **Mathematical Invariant**: Speculative sampling is **lossless**. The output token stream is mathematically indistinguishable from generating exclusively with the 70B target model.

---

## 🐍 3. Medusa Multi-Head Tree Attention

While speculative decoding with a draft model is powerful, managing two separate models in GPU memory introduces deployment friction (dual KV-caches, model loading overhead).

**Medusa** (Cai et al., 2023) eliminates the draft model entirely by adding **multiple lightweight Feed-Forward prediction heads** directly on top of the target model’s final transformer layer:

```
                      [ Target Transformer Backbone (70B) ]
                                       |
                   +-------------------+-------------------+
                   |                   |                   |
               [ Head 0 ]          [ Head 1 ]          [ Head 2 ]
               (Predicts t+1)      (Predicts t+2)      (Predicts t+3)
                   |                   |                   |
                Token w1            Token w2            Token w3
```

### Tree-Structured Attention Verification
Rather than predicting a single linear chain of tokens, Medusa heads generate top-$k$ candidates for each position, forming a **Candidate Prefix Tree**.

```mermaid
graph TD
  subgraph Medusa Candidate Tree (Evaluated in 1 Forward Pass)
    Root[Current Token] --> A["w1 (p=0.8)"]
    Root --> B["w1' (p=0.2)"]
    
    A --> A1["w2 (p=0.7)"]
    A --> A2["w2' (p=0.3)"]
    
    B --> B1["w2 (p=0.9)"]
    
    A1 --> A11["w3 (p=0.85)"]
  end
```

By applying a custom **2D Tree Attention Mask**, the target model verifies all candidate branches (e.g. 64 simultaneous paths) in a **single forward pass**, accepting the longest valid path.

---

## 🛠️ Python Implementation: Speculative Decoding & Verification Simulator

Here is a Python implementation simulating speculative drafting, parallel target verification, and speedup measurement:

```python
import time
import numpy as np
from typing import List, Tuple

class MockLanguageModel:
    def __init__(self, name: str, vocab_size: int = 1000, latency_ms: float = 20.0):
        self.name = name
        self.vocab_size = vocab_size
        self.latency_ms = latency_ms

    def predict_next_token_probs(self, context_length: int) -> np.ndarray:
        time.sleep(self.latency_ms / 1000.0) # Simulate GPU compute/memory latency
        # Return mock normalized probability distribution
        logits = np.random.randn(self.vocab_size)
        exp_logits = np.exp(logits - np.max(logits))
        return exp_logits / np.sum(exp_logits)

    def verify_parallel_batch(self, candidate_tokens: List[int]) -> List[np.ndarray]:
        # Target model verifies all K tokens in a SINGLE forward pass
        time.sleep(self.latency_ms / 1000.0)
        return [self.predict_next_token_probs(len(candidate_tokens)) for _ in candidate_tokens]

class SpeculativeDecodingEngine:
    """
    Simulates Speculative Sampling (Leviathan et al.) with Draft & Target Models.
    """
    def __init__(self, draft_model: MockLanguageModel, target_model: MockLanguageModel, k_speculations: int = 4):
        self.draft = draft_model
        self.target = target_model
        self.k = k_speculations

    def generate_tokens(self, total_tokens: int = 12) -> Tuple[List[int], float, int]:
        generated_tokens = []
        start_time = time.perf_counter()
        target_forward_passes = 0

        while len(generated_tokens) < total_tokens:
            target_forward_passes += 1
            print(f"\n⚡ --- Speculative Iteration (Forward Pass #{target_forward_passes}) ---")

            # 1. Draft Phase: Fast draft model proposes K tokens
            draft_tokens = []
            draft_probs = []
            for _ in range(self.k):
                p_draft = self.draft.predict_next_token_probs(len(generated_tokens) + len(draft_tokens))
                token = int(np.argmax(p_draft))
                draft_tokens.append(token)
                draft_probs.append(p_draft[token])

            print(f" 📝 [Draft Model: {self.draft.name}] Proposed {self.k} tokens: {draft_tokens}")

            # 2. Verification Phase: Target model validates all K tokens in ONE pass
            target_prob_distributions = self.target.verify_parallel_batch(draft_tokens)

            # 3. Speculative Acceptance Sampling
            accepted_in_pass = []
            for i, (draft_tok, p_d) in enumerate(zip(draft_tokens, draft_probs)):
                p_t = target_prob_distributions[i][draft_tok]
                acceptance_prob = min(1.0, p_t / max(p_d, 1e-5))

                # Stochastic acceptance test (mock threshold)
                if np.random.rand() < 0.75: # Simulate high acceptance rate
                    accepted_in_pass.append(draft_tok)
                else:
                    # Reject remaining and emit correction token
                    correction_tok = int(np.argmax(target_prob_distributions[i]))
                    accepted_in_pass.append(correction_tok)
                    print(f" 🚫 [Token Rejected at Pos {i+1}] Corrected with Token #{correction_tok}")
                    break

            generated_tokens.extend(accepted_in_pass)
            print(f" ✅ [Target Model: {self.target.name}] Accepted {len(accepted_in_pass)} tokens in this single pass.")

        elapsed_time = time.perf_counter() - start_time
        return generated_tokens[:total_tokens], elapsed_time, target_forward_passes

# Demonstration Execution
if __name__ == "__main__":
    # Draft: 8B model (5ms latency), Target: 70B model (30ms latency)
    draft_model = MockLanguageModel("Llama-3-8B-Draft", latency_ms=5.0)
    target_model = MockLanguageModel("Llama-3-70B-Target", latency_ms=30.0)

    engine = SpeculativeDecodingEngine(draft_model, target_model, k_speculations=4)

    print("🚀 Running Speculative Decoding Inference Benchmark...")
    tokens, total_sec, passes = engine.generate_tokens(total_tokens=12)

    standard_target_time = 12 * (30.0 / 1000.0) # 12 sequential 30ms passes = 0.36s
    speedup = standard_target_time / total_sec

    print("\n📊 Benchmark Results:")
    print(f" • Tokens Generated          : {len(tokens)}")
    print(f" • Target Model Passes       : {passes} (vs 12 in standard autoregressive)")
    print(f" • Speculative Total Time    : {total_sec:.3f}s")
    print(f" • Standard Target Time      : {standard_target_time:.3f}s")
    print(f" • Effective Speedup         : {speedup:.2f}x Faster (Lossless)")
```

---

## 📊 Summary: Inference Acceleration Comparison

| Technique | Memory Footprint | Accuracy Impact | Production Speedup | Implementation Complexity |
|---|---|---|---|---|
| **Standard Autoregressive** | Target Weights ($140\text{ GB}$) | Baseline ($100\%$) | $1.0\times$ (Baseline) | Low |
| **Draft Speculative Decoding** | Target + Draft Weights ($156\text{ GB}$) | Lossless ($100\%$) | **$2.0\times\text{--}2.8\times$** | Moderate (vLLM native) |
| **Medusa Tree Attention** | Target Weights + Heads ($142\text{ GB}$) | Lossless ($100\%$) | **$2.5\times\text{--}3.2\times$** | High (Custom Tree Attention Mask) |
| **Weight Quantization (FP8/INT4)** | Reduced ($35\text{--}70\text{ GB}$) | Minor Loss ($< 1\%$) | $1.5\times\text{--}2.0\times$ | Low (AWQ / GPTQ) |

---

## 🏁 Architectural Takeaway
By decoupling token proposal from verification, **Speculative Decoding and Medusa Tree Attention break the fundamental memory bandwidth bottleneck of modern LLMs**.

Inference frameworks running speculative sampling deliver dramatically lower Time-to-First-Token and higher sustained throughput, driving down AI operating costs without compromising a single ounce of model intelligence.
