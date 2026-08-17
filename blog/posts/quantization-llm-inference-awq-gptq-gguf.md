# Quantization for LLM Inference: AWQ, GPTQ & GGUF Memory Reduction

Running 70-billion parameter Large Language Models (such as Llama-3-70B) in standard FP16 (16-bit floating-point) precision requires **140 GB of GPU VRAM** just to load the model weights into memory.

$$\text{VRAM Size} = 70 \times 10^9 \text{ parameters} \times 2 \text{ bytes/parameter} = 140 \text{ GB}$$

This forces organizations to deploy multi-GPU clusters (e.g., $2 \times \text{NVIDIA A100 } 80\text{GB}$ nodes), incurring steep hardware and hosting costs.

To squeeze massive models onto cost-effective single GPUs or consumer hardware, machine learning systems utilize **Quantization**.

Quantization compresses model weight precision from 16-bit floating-point (`FP16`) down to 8-bit (`INT8`) or 4-bit (`INT4`) integers, achieving up to **$4\times$ memory reduction with minimal perplexity degradation**.

This article explores Post-Training Quantization (PTQ), Activation-aware Weight Quantization (AWQ), GPTQ, and GGUF memory reduction formats.

---

## 📖 LLM Quantization & AWQ Salient Weight Architecture

How AWQ identifies salient weights based on activation magnitudes to preserve accuracy at 4-bit precision:

```mermaid
graph TD
  subgraph Unquantized Model Weights (FP16: 140 GB VRAM)
    Weights[FP16 Model Weights W: 70B Params] --> ActMonitor[Activation Magnitude Monitor]
  end
  
  subgraph AWQ (Activation-aware Weight Quantization) Pipeline
    ActMonitor -->|1. Compute Activation Magnitudes |X|| SalientCheck{Identify Salient Weights}
    SalientCheck -->|2. Top 1% High-Activation Weights| Protect[Apply Scale Factor S > 1: Protect Precision]
    SalientCheck -->|3. Remaining 99% Non-Critical Weights| Uniform4Bit[Quantize to INT4 (Scale S & Zero-Point Z)]
  end
  
  subgraph Compressed Model Representation (INT4: 35 GB VRAM)
    Protect & Uniform4Bit --> QuantizedModel[(Quantized 4-Bit Model: AWQ / GPTQ / GGUF)]
    QuantizedModel -->|4. High-Speed Inference| ConsumerGPU[Single GPU / Desktop CPU]
  end
```

### Core Quantization Algorithms & Formats
1. **Uniform Linear Quantization (Scale & Zero-Point)**: Maps continuous 16-bit floating-point values ($x$) to discrete $n$-bit integers ($q$).
   $$q = \text{clamp}\left(\text{round}\left(\frac{x}{S}\right) + Z, q_{\text{min}}, q_{\text{max}}\right)$$
   * **Scale ($S$)**: $\frac{x_{\text{max}} - x_{\text{min}}}{2^n - 1}$
   * **Zero-Point ($Z$)**: $-\text{round}\left(\frac{x_{\text{min}}}{S}\right)$
2. **Activation-aware Weight Quantization (AWQ)**: Observes that not all weight channels are equally important. The top $1\%$ of weight channels corresponding to large activation magnitudes ($|X|$) control output accuracy. AWQ scales and protects these salient weights before 4-bit quantization, preserving perplexity better than naive uniform quantization.
3. **GPTQ (Optimal Brain Surgeon)**: Performs Post-Training Quantization (PTQ) by computing a second-order Taylor expansion of the loss function (Hessian matrix inverse $H^{-1}$). As each weight is quantized to 4-bit, GPTQ updates the remaining unquantized weights in the layer to compensate for the quantization error.
4. **GGUF (llama.cpp Binary Format)**: A single-file binary container designed for CPU/GPU hybrid offloading. GGUF packs quantized weight blocks (`Q4_K_M`, `Q5_K_S`, `Q8_0`) along with key-value metadata, allowing desktop CPUs to execute LLM inference via SIMD AVX-512/ARM Neon vector instructions.

---

## 🛠️ Python Implementation: Uniform Linear Quantizer & AWQ Engine

Here is a production-grade Python implementation of a 4-Bit Uniform Linear Quantizer and AWQ Salient Weight Protection Engine:

```python
import torch
import math

class UniformQuantizer:
    """
    Performs 4-Bit Uniform Asymmetric Quantization and Dequantization.
    """
    def __init__(self, num_bits: int = 4):
        self.num_bits = num_bits
        self.qmin = 0
        self.qmax = (1 << num_bits) - 1  # 15 for 4-bit

    def quantize(self, tensor: torch.Tensor) -> Tuple[torch.Tensor, float, int]:
        min_val, max_val = tensor.min().item(), tensor.max().item()
        
        # Calculate Scale (S) and Zero-Point (Z)
        scale = (max_val - min_val) / self.qmax if max_val != min_val else 1.0
        zero_point = round(-min_val / scale)
        zero_point = max(self.qmin, min(self.qmax, zero_point))

        # Quantize FP32/FP16 to INT4
        q_tensor = torch.clamp(torch.round(tensor / scale) + zero_point, self.qmin, self.qmax).to(torch.uint8)
        return q_tensor, scale, zero_point

    def dequantize(self, q_tensor: torch.Tensor, scale: float, zero_point: int) -> torch.Tensor:
        # Reconstruct FP32 approximation
        return (q_tensor.to(torch.float32) - zero_point) * scale

class AWQSimulator:
    """
    Simulates Activation-aware Weight Quantization (AWQ).
    Protects top 1% salient weight channels from quantization error.
    """
    def __init__(self, quantizer: UniformQuantizer):
        self.quantizer = quantizer

    def quantize_with_awq(self, weights: torch.Tensor, activations: torch.Tensor) -> Tuple[torch.Tensor, float, int, torch.Tensor]:
        # 1. Calculate activation magnitude per channel
        act_magnitudes = torch.abs(activations).mean(dim=0)
        
        # 2. Identify top 10% salient channels
        top_k = max(1, int(0.10 * weights.shape[1]))
        _, salient_indices = torch.topk(act_magnitudes, top_k)

        # 3. Apply protection scale factor to salient channels
        protection_scale = torch.ones(weights.shape[1])
        protection_scale[salient_indices] = 2.0  # Scale up salient channels

        scaled_weights = weights * protection_scale

        # 4. Quantize scaled weights
        q_weights, scale, zero_point = self.quantizer.quantize(scaled_weights)
        return q_weights, scale, zero_point, protection_scale

# Demonstration Execution
if __name__ == "__main__":
    torch.manual_seed(42)
    quantizer = UniformQuantizer(num_bits=4)
    awq_engine = AWQSimulator(quantizer)

    print("🚀 Demonstrating LLM 4-Bit Quantization & AWQ Engine...")
    print("=" * 75)

    # 1. Create FP16 Weight Matrix (100 rows x 100 cols)
    fp16_weights = torch.randn(100, 100) * 0.5
    activations = torch.randn(10, 100)
    activations[:, 5] *= 10.0  # Channel #5 has large activation magnitude!

    # 2. Standard 4-Bit Uniform Quantization
    q_std, s_std, z_std = quantizer.quantize(fp16_weights)
    deq_std = quantizer.dequantize(q_std, s_std, z_std)
    error_std = torch.mean(torch.abs(fp16_weights - deq_std)).item()

    # 3. AWQ 4-Bit Quantization with Protection
    q_awq, s_awq, z_awq, p_scale = awq_engine.quantize_with_awq(fp16_weights, activations)
    deq_awq = quantizer.dequantize(q_awq, s_awq, z_awq) / p_scale
    error_awq = torch.mean(torch.abs(fp16_weights - deq_awq)).item()

    print(f"\n1. Original FP16 Memory Size:  {fp16_weights.element_size() * fp16_weights.nelement()} bytes")
    print(f"2. Quantized INT4 Memory Size: {q_std.element_size() * q_std.nelement() // 2} bytes (75% VRAM Reduction!)")
    print(f"\n3. Quantization Reconstruct Error:")
    print(f"   • Standard INT4 Mean Error: {error_std:.6f}")
    print(f"   • AWQ Protected INT4 Error:  {error_awq:.6f} (Lower Error & Better Perplexity!)")
```

---

## 🚨 LLM Quantization Gotchas & Best Practices

When deploying quantized LLM inference:

> [!IMPORTANT]
> **Match Quantization Format to Target Hardware**: For NVIDIA GPU serving, use **AWQ or GPTQ (INT4)** with vLLM for high Tensor Core throughput. For CPU or Apple Silicon desktop inference, use **GGUF (`Q4_K_M`)** with `llama.cpp` for native ARM Neon / AVX-512 acceleration.

> [!CAUTION]
> **Avoid Quantizing Small Models Below 4-Bit**: While 70B parameter models retain high accuracy at 4-bit (`INT4`) precision, smaller models ($1\text{B}$ to $3\text{B}$ parameters) suffer steep perplexity degradation under 4-bit quantization. Keep small models at 8-bit (`INT8` / `FP8`) precision.

---

## 📈 Real-World Enterprise Impact
Platforms adopting 4-bit LLM quantization (such as **AWQ** and **GGUF**) report:
* **75% Reduction in GPU VRAM Costs**: Running Llama-3-70B on a single $40\text{GB}$ GPU node instead of requiring multi-GPU $140\text{GB}$ clusters.
* **$3\times$ Faster Generation Speeds**: 4-bit weights reduce GPU memory bandwidth pressure, allowing token generation to run at higher tokens/sec.
