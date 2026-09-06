# Dynamic Kernel Tracing: Kprobes, Uprobes & Tracepoints in eBPF Observability

In production distributed systems, diagnosing performance anomalies, hidden latency spikes, or memory leaks using traditional debugging tools (`strace`, `gdb`, `lsof`) is impossible.

Tools like `strace` rely on the Linux `ptrace()` system call, which stops process execution on every system call entry and exit. This introduces a **$100\times$ to $500\times$ latency penalty**, making it far too dangerous to run against live production databases or web servers.

To achieve zero-overhead, production-safe system telemetry, Linux combines **eBPF** with three powerful tracing subsystems: **Kprobes**, **Uprobes**, and **Tracepoints**.

By dynamically instrumenting kernel C functions and user-space ELF binaries at runtime without modifying code or restarting processes, tools like **bpftrace** and **BCC** deliver deep runtime observability.

This article details Kprobe instruction patching, Uprobe user-space symbol tracking, and Kernel Tracepoint events.

---

## Linux Tracing Subsystems & eBPF Event Pipeline

How Kprobes, Uprobes, and Tracepoints capture telemetry events inside the kernel:

```mermaid
graph TD
  subgraph SG1_UserSpaceApplication ["User-Space Application (e.g. OpenSSL / MySQL)"]
    UserApp[User-Space Binary /lib/libssl.so] -->|1. Call SSL_write()| UprobeHook{Uprobe / Uretprobe Hook}
  end
  
  subgraph SG2_LinuxKernelSpace ["Linux Kernel Space"]
    Syscall[Syscall: sys_enter_openat] -->|2. Trigger Static Tracepoint| TracepointHook{Kernel Tracepoint Hook}
    KernelFunc[Kernel Function: tcp_v4_connect] -->|3. INT3 Breakpoint Trap| KprobeHook{Kprobe / Kretprobe Hook}
    
    UprobeHook & TracepointHook & KprobeHook -->|4. Fire Event| eBPFProg[eBPF Tracing Program]
  end
  
  subgraph SG3_TelemetryAggregationRing ["Telemetry Aggregation & Ring Buffers"]
    eBPFProg -->|5. Push Struct Event| BPF_RingBuf[BPF Ring Buffer: BPF_MAP_TYPE_RINGBUF]
    BPF_RingBuf -->|6. Zero-Copy Poll| BPFTraceDaemon[User-Space Observability Daemon / bpftrace]
  end
```

### Core Linux Tracing Mechanisms
1. **Kernel Probes (Kprobes & Kretprobes)**:
   * **Kprobes**: Dynamically instruments almost any kernel function entry point. When attached, the kernel replaces the target instruction with a breakpoint instruction (`INT 3` on x86). When hit, the CPU triggers a trap, executes the attached eBPF program with full access to function arguments (`pt_regs`), and resumes normal execution.
   * **Kretprobes**: Triggers on function return, allowing developers to measure execution duration ($\text{latency} = t_{\text{return}} - t_{\text{entry}}$) and inspect return values.
2. **User Probes (Uprobes & Uretprobes)**:
   * **Uprobes**: Extends dynamic tracing into user-space applications! By parsing ELF binary symbol tables (`.symtab`), Uprobes instrument C++, Go, Rust, or Node.js functions.
   * *Real-World Magic*: Attaching a Uprobe to `/usr/lib/libssl.so` at `SSL_write()` allows security teams to inspect un-encrypted HTTPS plain-text payloads in real time—without recompiling or restarting the application!
3. **Static Kernel Tracepoints**: Hardcoded macro instrumentation points (`TRACE_EVENT`) placed by kernel developers inside critical subsystems (e.g., `sched:sched_switch`, `net:netif_rx`). Unlike Kprobes (which can change between kernel minor versions), Tracepoints present a **stable API ABI** across Linux kernel releases.
4. **BPF Ring Buffer (`BPF_MAP_TYPE_RINGBUF`)**: A high-performance lockless ring buffer used by eBPF programs to stream telemetry events to user space. It replaces the older `BPF_MAP_TYPE_PERF_EVENT_ARRAY`, reducing memory overhead by sharing a single ring buffer across all CPU cores.

---

## Python Implementation: Kprobe & Uprobe Event Telemetry Dispatcher

Here is a production-grade Python implementation of a Kprobe and Uprobe Event Telemetry Dispatcher Engine:

```python
import time
from typing import Dict, List, Callable, Optional
from pydantic import BaseModel

class CPURegisters(BaseModel):
    rdi: int  # Arg 1 on x86_64
    rsi: int  # Arg 2
    rdx: int  # Arg 3
    rax: int  # Return Value

class TracingEvent(BaseModel):
    timestamp_ns: int
    pid: int
    probe_type: str  # "KPROBE", "UPROBE", "TRACEPOINT"
    symbol_name: str
    args: Dict[str, Any]

class KprobeUprobeTracingEngine:
    """
    Simulates eBPF Kprobe, Uprobe, and Tracepoint Telemetry Instrumentation.
    """
    def __init__(self):
        self.attached_probes: Dict[str, Tuple[str, Callable]] = {}  # {symbol: (type, handler)}
        self.ring_buffer: List[TracingEvent] = []

    def attach_kprobe(self, kernel_function: str, handler: Callable):
        self.attached_probes[kernel_function] = ("KPROBE", handler)
        print(f" ⚓ [Kprobe Attached] Intercepting Kernel Function: '{kernel_function}' via INT3 Breakpoint")

    def attach_uprobe(self, binary_path: str, user_symbol: str, handler: Callable):
        probe_key = f"{binary_path}:{user_symbol}"
        self.attached_probes[probe_key] = ("UPROBE", handler)
        print(f" ⚓ [Uprobe Attached] Instrumenting User-Space Symbol: '{user_symbol}' in '{binary_path}'")

    def trigger_event(self, symbol_key: str, pid: int, regs: CPURegisters):
        """Simulates CPU trapping into eBPF Probe handler upon instruction execution."""
        if symbol_key not in self.attached_probes:
            return

        probe_type, handler = self.attached_probes[symbol_key]
        event_data = handler(pid, regs)
        
        event = TracingEvent(
            timestamp_ns=time.time_ns(),
            pid=pid,
            probe_type=probe_type,
            symbol_name=symbol_key,
            args=event_data
        )
        self.ring_buffer.append(event)
        print(f" ⚡ [{probe_type} Fired] '{symbol_key}' (PID: {pid}) -> Captured Telemetry Event")

    def poll_ring_buffer(self) -> List[TracingEvent]:
        events = list(self.ring_buffer)
        self.ring_buffer.clear()
        return events

# Demonstration Execution
if __name__ == "__main__":
    engine = KprobeUprobeTracingEngine()

    # Define eBPF Handlers
    def handle_sys_openat(pid: int, regs: CPURegisters) -> Dict[str, Any]:
        # rsi points to filename string address
        return {"filename_ptr": hex(regs.rsi), "flags": regs.rdx}

    def handle_ssl_write(pid: int, regs: CPURegisters) -> Dict[str, Any]:
        # rsi points to buffer, rdx is buffer length
        return {"ssl_buf_ptr": hex(regs.rsi), "buf_len_bytes": regs.rdx}

    print("🚀 Demonstrating Dynamic Kprobes, Uprobes & eBPF Telemetry Engine...")
    print("=" * 75)

    # 1. Attach Probes
    engine.attach_kprobe(kernel_function="do_sys_openat", handler=handle_sys_openat)
    engine.attach_uprobe(binary_path="/lib/libssl.so", user_symbol="SSL_write", handler=handle_ssl_write)

    # 2. Simulate System Activity
    print("\n🌐 Simulating Kernel & User-Space System Calls:")
    mock_regs_open = CPURegisters(rdi=3, rsi=0x7fff5000, rdx=0, rax=0)
    engine.trigger_event("do_sys_openat", pid=1042, regs=mock_regs_open)

    mock_regs_ssl = CPURegisters(rdi=5, rsi=0x7fff8000, rdx=1024, rax=1024)
    engine.trigger_event("/lib/libssl.so:SSL_write", pid=2080, regs=mock_regs_ssl)

    # 3. Poll Telemetry Ring Buffer
    print("\n📊 Polling Telemetry Ring Buffer Events:")
    events = engine.poll_ring_buffer()
    for e in events:
        print(f"   • [{e.probe_type}] Symbol: '{e.symbol_name}' | PID: {e.pid} | Payload: {e.args}")
```

---

## Dynamic Tracing Gotchas & Best Practices

When deploying eBPF tracing programs:

> [!IMPORTANT]
> **Prefer Tracepoints over Kprobes for Production Stability**: Because Kprobes instrument internal kernel functions (`do_sys_openat`), kernel updates can rename or remove these functions across minor releases, breaking your tracing code. Static **Kernel Tracepoints** present guaranteed API compatibility across kernel releases.

> [!CAUTION]
> **Beware of Uprobe Function Inlining & Overhead**: Compiling C++ or Go code with aggressive inline optimization (`-O3`) removes function symbols, causing Uprobes to fail. Additionally, high-frequency Uprobes (called millions of times per second) incur context-switch overhead; use **BPF USDT (User Statically Defined Tracing)** for high-frequency user-space events.

---

## Real-World Enterprise Impact
Platforms adopting eBPF dynamic tracing (such as **Datadog**, **New Relic**, and **bpftrace**) report:
* **Zero Application Modifications**: Instrumenting user-space binaries (OpenSSL, MySQL) delivers deep APM observability without modifying source code or re-deploying containers.
* **Under 1% Performance Overhead**: Replacing `ptrace()` with in-kernel eBPF probes reduces profiling overhead from $500\times$ down to less than $1\%$.
