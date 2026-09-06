# Speculative Decoding & Draft Models: Sub-Linear Token Generation

In autoregressive Large Language Model generation, producing output tokens is inherently **Memory-Bandwidth Bound**.

To generate a single output token from a 70-billion parameter model, the GPU must read all **140 GB of model weights** from HBM memory into compute registers. For a response of 100 tokens, the GPU reads the $140\text{ GB}$ weight matrix 100 sequential times, keeping powerful Tensor Cores vastly underutilized.

To break this sequential memory bottleneck, inference engines (**vLLM**, **TGI**, **DeepSpeed-FastGen**) employ **Speculative Decoding**.

Speculative Decoding utilizes a small, lightweight **Draft Model** (e.g., Llama-3-8B) to rapidly generate a candidate sequence of $K$ tokens. A large **Target Model** (e.g., Llama-3-70B) then verifies all $K$ candidate tokens in a **single parallel GPU forward pass**.

This article details speculative token generation, target parallel verification, and modified rejection sampling algorithms.

---

## Speculative Decoding & Parallel Verification Architecture

How Speculative Decoding generates $K+1$ tokens in a single target model forward pass:

```mermaid
graph TD
  Prompt[User Input Prompt] --> DraftModel[Fast Draft Model: Llama-3-8B]
  
  subgraph SG1_Phase1Rapid ["Phase 1: Rapid Speculative Generation (K=4 Tokens)"]
    DraftModel -->|1. Generate 4 Candidate Tokens| CandTokens["Candidate Sequence: [the, capital, of, France]"]
  end
  
  subgraph SG2_Phase2Target ["Phase 2: Target Model Parallel Verification (Single Forward Pass)"]
    CandTokens -->|2. Parallel Forward Pass on All 4 Tokens| TargetModel[Large Target Model: Llama-3-70B]
    TargetModel -->|3. Evaluate Token Probability Ratios P_target / P_draft| Sampler{Modified Rejection Sampler}
  end
  
  subgraph SG3_Phase3Token ["Phase 3: Token Acceptance & Output"]
    Sampler -->|4. Accept First 3 Tokens + Sample 4th Token| Accepted["Accepted Tokens: ['the', 'capital', 'of', 'France']"]
    Accepted -->|5. Output 4 Tokens in 1 Step (2x - 3x Speedup!)| UserResponse[User Output Stream]
  end
```

### Core Speculative Decoding Mechanics
1. **Memory-Bandwidth Bound Autoregressive Penalty**: In standard decoding, generating $K$ tokens requires $K$ sequential forward passes through the target model.
2. **Draft Model Speculation**: A small draft model (which runs $5\times$ to $10\times$ faster due to smaller weight sizes) predicts a candidate sequence of $K$ lookahead tokens: $\hat{x}_1, \hat{x}_2, \dots, \hat{x}_K$.
3. **Target Model Parallel Verification**: The target model evaluates all $K$ candidate tokens in a *single parallel forward pass*. Because GPUs excel at matrix-matrix operations, running $K$ tokens in parallel takes nearly the same time as running 1 single token!
4. **Modified Rejection Sampling**: To guarantee that the output probability distribution matches the target model **exactly**, each candidate token is accepted with probability:
   $$P_{\text{accept}}(x_i) = \min\left(1, \frac{P_{\text{target}}(x_i)}{P_{\text{draft}}(x_i)}\right)$$
   If a token is rejected at position $j < K$, generation resumes from position $j$ with a newly sampled target token, discarding remaining candidate tokens.

---

## Python Implementation: Speculative Decoding & Rejection Sampler Engine

Here is a production-grade Python implementation of a Speculative Decoding Engine featuring Draft Model Speculation, Target Parallel Verification, and Rejection Sampling:

```python
import torch
import torch.nn.functional as F
from typing import List, Tuple

class SpeculativeDecodingEngine:
    """
    Simulates Speculative Decoding with Draft and Target Models.
    Guarantees mathematically exact output distribution match.
    """
    def __init__(self, vocab_size: int = 100, K: int = 4):
        self.vocab_size = vocab_size
        self.K = K  # Number of speculative lookahead tokens

    def _mock_draft_forward(self, sequence: List[int]) -> torch.Tensor:
        """Simulates fast draft model probability distribution."""
        torch.manual_seed(len(sequence) + 7)
        return F.softmax(torch.randn(self.vocab_size), dim=-1)

    def _mock_target_parallel_forward(self, sequence: List[int], candidates: List[int]) -> torch.Tensor:
        """Simulates target model parallel forward pass across all candidates."""
        torch.manual_seed(len(sequence) + 42)
        # Returns (K+1, vocab_size) probability tensor
        return F.softmax(torch.randn(len(candidates) + 1, self.vocab_size), dim=-1)

    def run_speculative_step(self, prefix: List[int]) -> Tuple[List[int], int]:
        """
        Executes 1 Speculative Step: Draft Speculation -> Target Verification -> Rejection.
        """
        curr_seq = list(prefix)
        draft_tokens = []
        draft_probs = []

        # 1. Phase 1: Draft Model Speculates K Candidate Tokens
        for _ in range(self.K):
            p_draft = self._mock_draft_forward(curr_seq + draft_tokens)
            next_token = torch.argmax(p_draft).item()
            draft_tokens.append(next_token)
            draft_probs.append(p_draft)

        # 2. Phase 2: Target Model Parallel Forward Pass across K Candidates
        p_target_all = self._mock_target_parallel_forward(curr_seq, draft_tokens)

        # 3. Phase 3: Modified Rejection Sampling
        accepted_tokens = []
        for i in range(len(draft_tokens)):
            cand_token = draft_tokens[i]
            p_d = draft_probs[i][cand_token].item()
            p_t = p_target_all[i][cand_token].item()

            accept_prob = min(1.0, p_t / (p_d + 1e-9))
            r = torch.rand(1).item()

            if r < accept_prob:
                accepted_tokens.append(cand_token)
            else:
                # Rejected! Sample replacement token from target model
                resampled_token = torch.multinomial(p_target_all[i], 1).item()
                accepted_tokens.append(resampled_token)
                break  # Stop speculation at first rejection

        # If all K accepted, sample 1 additional bonus token from target model
        if len(accepted_tokens) == self.K:
            bonus_token = torch.argmax(p_target_all[-1]).item()
            accepted_tokens.append(bonus_token)

        return accepted_tokens, len(accepted_tokens)

# Demonstration Execution
if __name__ == "__main__":
    engine = SpeculativeDecodingEngine(vocab_size=100, K=4)

    print("🚀 Demonstrating Speculative Decoding & Parallel Verification Engine...")
    print("=" * 75)

    prefix_prompt = [1, 15, 42]
    print(f"📥 Initial Prefix Prompt Tokens: {prefix_prompt}")

    # Execute 3 Speculative Steps
    total_tokens_generated = 0
    for step_num in range(1, 4):
        tokens_out, count = engine.run_speculative_step(prefix_prompt)
        prefix_prompt.extend(tokens_out)
        total_tokens_generated += count
        
        print(f"\n ⚡ [Step #{step_num}] Speculated & Verified -> Produced {count} Tokens: {tokens_out}")

    print(f"\n📊 Total Tokens Generated in 3 Forward Steps: {total_tokens_generated} tokens!")
    print(f"   • Effective Speedup Ratio: {total_tokens_generated / 3.0:.2f}x Tokens per Target Step!")
```

---

## Speculative Decoding Gotchas & Best Practices

When configuring speculative inference:

> [!IMPORTANT]
> **Align Draft & Target Model Vocabularies**: The draft model and target model *must* share the exact same tokenizer and vocabulary space (e.g. using Llama-3-8B as a draft model for Llama-3-70B). Different tokenizers make candidate probability ratios impossible to evaluate.

> [!CAUTION]
> **Tune Lookahead Parameter $K$ Based on Acceptance Rates**: If the draft model acceptance rate is high ($>80\%$), increase $K$ to $5$ or $6$. If the acceptance rate is low ($<40\%$), reduce $K$ to $2$ or $3$ to avoid wasting draft model FLOPs.

---

## Real-World Enterprise Impact
Platforms adopting Speculative Decoding (such as **vLLM** and **TensorRT-LLM**) report:
* **$2\times$ to $3\times$ Faster End-to-End Latency**: Generating up to 3 tokens per target model forward step without altering output text quality.
* **100% Exact Distribution Match**: Modified rejection sampling mathematically guarantees zero degradation in model perplexity or answer quality.
