# eBPF Observability: Kernel-Level Packet Tracing & Socket Filtering

Traditionally, monitoring network traffic, profiling CPU usage, or debugging system call latencies required installing heavy user-space daemons, injecting sidecar proxies, or writing complex kernel modules. Sidecar proxies (like Envoy) inspect network packets by intercepting TCP connections, but this introduces additional CPU context switches and network latency.

The modern paradigm for Linux system observability, networking, and security is **eBPF (Extended Berkeley Packet Filter)**.

eBPF allows developers to run custom, sandboxed 64-bit RISC bytecode directly inside the Linux kernel at near-bare-metal execution speeds without modifying Linux kernel source code or loading dangerous Kernel Modules (LKMs).

By attaching eBPF programs to kernel probes (**kprobes**), user probes (**uprobes**), and network driver hooks (**XDP**), platform engineers achieve zero-overhead observability and kernel-level socket filtering.

This article details eBPF architecture, in-kernel verification, and BPF map data sharing.

---

## eBPF In-Kernel Execution Pipeline Architecture

How eBPF bytecode is verified, JIT-compiled, and executed inside Linux kernel hook points:

```mermaid
graph TD
  UserApp[User Space C / Python / Go Code] -->|1. Compile C to eBPF Bytecode| Bytecode[eBPF Bytecode File]
  Bytecode -->|2. bpf Syscall bpf_load| Verifier[In-Kernel Verifier]
  
  subgraph SG1_LinuxKernelSpace ["Linux Kernel Space Safety & JIT"]
    Verifier -->|3. Validate DAG & Memory Bounds| JIT[JIT Compiler: x86_64 / ARM64]
    JIT -->|4. Native Machine Code| Engine[eBPF Engine Execution Unit]
  end
  
  subgraph SG2_KernelProbeHook ["Kernel Probe Hook Points"]
    Engine -->|5a. Attach to kprobe: sys_enter_connect| Kprobe[Kernel Function Probes]
    Engine -->|5b. Attach to XDP / TC NIC Driver| XDP[eXpress Data Path XDP]
  end
  
  subgraph SG3_SharedKernelUser ["Shared Kernel-User Data Transfer"]
    Engine -->|6. Atomic Updates| BPFMap[(eBPF Maps: Hash / Ring Buffer)]
    BPFMap -.->|7. Read Telemetry Metrics| UserApp
  end
```

### Core eBPF Principles & Hooks
1. **In-Kernel Verifier**: Before eBPF bytecode is loaded, the kernel's static verifier analyzes all execution paths. It enforces safety constraints: guaranteeing no infinite loops, verifying array boundary memory access, and ensuring no uninitialized registers are read.
2. **JIT (Just-In-Time) Compiler**: Once verified, the JIT compiler translates the generic 64-bit eBPF bytecode into native host CPU instructions (`x86_64` or `ARM64`), executing at native C speed with zero interpreter overhead.
3. **Hook Attach Points**:
   * **kprobes / kretprobes**: Attach to entry/exit points of internal Linux kernel functions.
   * **uprobes / uretprobes**: Attach to user-space library functions (e.g. SSL/TLS read calls).
   * **XDP (eXpress Data Path)**: Attaches to the Network Interface Card (NIC) driver level, allowing packet filtering (`XDP_DROP` / `XDP_PASS`) *before* allocating kernel `sk_buff` socket buffers.
4. **eBPF Maps**: Key-value data structures shared between kernel space and user space, allowing eBPF programs to record counters, IP blacklists, and latency histograms without making system calls.

---

## Python Implementation: eBPF Packet Filter & Map Simulator

Here is a production-grade Python simulation of an eBPF Network Packet Filter and BPF Hash Map metric counter:

```python
import time
import random
from typing import Dict, Any, Tuple
from pydantic import BaseModel

class NetworkPacket(BaseModel):
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: str  # TCP, UDP, ICMP
    payload_len: int

class EBPFMapHashCounter:
    """
    Simulates a kernel-level eBPF Hash Map (BPF_MAP_TYPE_HASH)
    shared between kernel eBPF bytecode and user-space daemons.
    """
    def __init__(self):
        # Key: src_ip -> Value: (packet_count, byte_count)
        self.map_data: Dict[str, Tuple[int, int]] = {}

    def update_counter(self, ip: str, payload_len: int):
        count, bytes_cnt = self.map_data.get(ip, (0, 0))
        self.map_data[ip] = (count + 1, bytes_cnt + payload_len)

    def read_metrics(self) -> Dict[str, Tuple[int, int]]:
        return self.map_data.copy()

class EBPFProgramXDPFilter:
    """
    Simulates an eBPF XDP (eXpress Data Path) program loaded at NIC driver layer.
    Return Codes: XDP_PASS (allow), XDP_DROP (block)
    """
    def __init__(self, bpf_map: EBPFMapHashCounter, blocked_ips: set):
        self.bpf_map = bpf_map
        self.blocked_ips = blocked_ips

    def process_packet(self, packet: NetworkPacket) -> str:
        """
        Kernel-level packet inspection execution (Near Bare-Metal Speed).
        """
        # 1. Check IP Blacklist in Map
        if packet.src_ip in self.blocked_ips:
            print(f" 🚫 [eBPF XDP_DROP] Blocked Malicious Packet from '{packet.src_ip}:{packet.src_port}' at NIC Driver Layer!")
            return "XDP_DROP"

        # 2. Update In-Kernel BPF Map Metrics
        self.bpf_map.update_counter(packet.src_ip, packet.payload_len)
        print(f" ⚡ [eBPF XDP_PASS] Passed Packet from '{packet.src_ip}' ({packet.payload_len} bytes) -> Updated BPF Map.")
        return "XDP_PASS"

# Demonstration Execution
if __name__ == "__main__":
    bpf_map = EBPFMapHashCounter()
    blocked_subnet = {"192.168.1.100", "10.0.0.66"}
    xdp_filter = EBPFProgramXDPFilter(bpf_map, blocked_ips=blocked_subnet)

    print("🚀 Demonstrating eBPF Kernel Packet Filtering & Map Metrics...")
    print("=" * 75)

    # 1. Simulate Incoming Network Packets at NIC Driver Layer
    test_packets = [
        NetworkPacket(src_ip="203.0.113.15", dst_ip="10.0.0.1", src_port=54321, dst_port=443, protocol="TCP", payload_len=1420),
        NetworkPacket(src_ip="192.168.1.100", dst_ip="10.0.0.1", src_port=4001, dst_port=80, protocol="TCP", payload_len=500), # Blocked!
        NetworkPacket(src_ip="203.0.113.15", dst_ip="10.0.0.1", src_port=54322, dst_port=443, protocol="TCP", payload_len=800),
        NetworkPacket(src_ip="198.51.100.4", dst_ip="10.0.0.1", src_port=6000, dst_port=22, protocol="TCP", payload_len=120),
    ]

    for pkt in test_packets:
        xdp_filter.process_packet(pkt)

    # 2. User Space Daemon Reads eBPF Map Metrics (Zero Syscall Copy)
    print("\n📊 User-Space Daemon Reading eBPF Hash Map Telemetry:")
    metrics = bpf_map.read_metrics()
    for ip, (pkt_cnt, byte_cnt) in metrics.items():
        print(f"   • IP '{ip}': {pkt_cnt} Packets | Total Volume: {byte_cnt:,} bytes")
```

---

## eBPF Implementation Gotchas & Best Practices

When writing eBPF programs:

> [!IMPORTANT]
> **Keep eBPF Programs Compact and Fast**: eBPF programs run inside Linux kernel context on every packet or system call. Keep instruction paths short, avoid expensive loops, and complete execution within microseconds to prevent kernel latency regressions.

> [!CAUTION]
> **Account for Kernel Version Differences**: eBPF feature availability and kernel helper functions differ across Linux kernel releases (e.g., Linux 4.18 vs 5.15 vs 6.x). Use **CO-RE (Compile Once – Run Everywhere)** enabled by BTF (BPF Type Format) to ensure eBPF programs run portably across Linux kernel versions.

---

## Real-World Enterprise Impact
Platforms built on eBPF (such as **Cilium**, **Falco**, and **Pixie**) report:
* **Zero-Sidecar Service Mesh Efficiency**: Replacing heavy Envoy sidecar proxies with kernel-level eBPF socket routing reduces CPU overhead by up to $80\%$ and eliminates sidecar memory footprints.
* **Bare-Metal DDoS Defense**: Dropping malicious packets using XDP at the network driver layer allows single servers to drop millions of malicious packets per second without exhausting kernel CPU.
