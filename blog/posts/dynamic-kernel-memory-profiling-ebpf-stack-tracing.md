# Dynamic Kernel Memory Profiling: eBPF Memory Leaks, Stack Tracing & Allocation Profiling

In high-concurrency production systems (**Linux Kernel Modules**, **Database Engines**, **High-Frequency Trading Nodes**, **Kubernetes Agents**), memory leaks are nightmarish bugs.

A slow memory leak of $10\text{ KB}$ per second can run undetected for days before triggering catastrophic Out-Of-Memory (OOM) host crashes.

Traditional memory debugging tools—such as **Valgrind** or **AddressSanitizer (ASan)**—impose severe overhead penalties ($10\times$ to $50\times$ CPU slowdown and $2\times$ RAM bloat), rendering them unusable in production environments.

To profile memory allocations in real-time with **near-zero overhead ($< 1\%$)**, modern Linux systems engineering utilizes **eBPF (Extended Berkeley Packet Filter)**.

By attaching **eBPF Kprobes** to kernel allocators (`kmalloc`/`kfree`) and **Uprobes** to userspace allocators (`malloc`/`free`), eBPF dynamically records memory call stacks without restarting applications or modifying source code.

This article details eBPF probe instrumentation, `BPF_MAP_TYPE_HASH` allocation tracking, kernel stack unwinding (`BPF_MAP_TYPE_STACK_TRACE`), and memory leak flamegraph generation.

---

## eBPF Memory Profiling Architecture & Probe Hooks

How eBPF attaches kprobes and uprobes to record heap allocations and generate memory leak stack traces:

```mermaid
graph TD
  subgraph Production Userspace & Kernel Space
    App[User Application / Kernel Module] -->|1. Memory Alloc: malloc(size)| AllocHook["uprobe:libc.so:malloc / kprobe:kmalloc"]
    App -->|2. Memory Free: free(ptr)| FreeHook["uprobe:libc.so:free / kprobe:kfree"]
  end
  
  subgraph eBPF In-Kernel Tracing Map Pipeline
    AllocHook -->|3. Record Pointer + Call Stack ID| AllocMap["eBPF Hash Map: { ptr -> alloc_info_t }"]
    AllocHook -->|4. Capture Stack Unwind| StackMap["eBPF Stack Trace Map: { stack_id -> [IP1, IP2, IP3] }"]
    
    FreeHook -->|5. Delete Pointer Entry| AllocMap
  end
  
  subgraph Memory Leak Detection & Flamegraphs
    AllocMap -->|6. Scan Remaining Entries (Un-freed!)| LeakDetector[BCC memleak Engine]
    LeakDetector --> Flamegraph["🔥 Memory Leak Flamegraph Output"]
  end
```

### Core eBPF Memory Profiling Mechanics
1. **Zero-Overhead Probe Instrumentation**:
   * **`uprobes` (User Probes)**: Instrument userspace memory allocators inside `libc.so` (`malloc`, `calloc`, `realloc`, `free`).
   * **`kprobes` (Kernel Probes)**: Instrument kernel memory allocators inside the Linux kernel (`kmalloc`, `kfree`, `kmem_cache_alloc`).
   * *Dynamic Attachment*: Probes are patched into running memory instructions dynamically at runtime without needing application recompilation.
2. **`BPF_MAP_TYPE_HASH` Allocation Tracking**:
   * When an allocation probe fires (`malloc`), the eBPF program extracts the returned pointer address and writes an entry into a high-speed kernel hash map:
     $$\text{Key}: \text{Memory Address (uint64\_t)} \longrightarrow \text{Value}: \langle \text{size}, \text{pid}, \text{stack\_id}, \text{timestamp} \rangle$$
   * When the matching deallocation probe fires (`free`), the eBPF program deletes the key from the map.
3. **`BPF_MAP_TYPE_STACK_TRACE` Unwinding**:
   * Capturing text stack traces inside kernel probes is too slow.
   * Instead, eBPF uses `bpf_get_stackid()` to unwind the CPU instruction pointer (`IP`) stack frame addresses, hashing the backtrace into a 32-bit `stack_id` stored in a specialized `BPF_MAP_TYPE_STACK_TRACE` table.
4. **Memory Leak Detection & Flamegraph Generation**:
   * At the end of a profiling session (e.g. after 10 minutes), any entries remaining in the `BPF_MAP_TYPE_HASH` table represent **active un-freed memory allocations**.
   * By correlating `stack_id` values with symbol tables (`/proc/kallsyms` or ELF DWARF symbols), tools like BCC `memleak` pinpoint the exact line of C++/Rust source code leaking memory.

---

## Python Implementation: eBPF Memory Leak Tracker Simulator

Here is a production-grade Python implementation of an eBPF Memory Leak Tracker and Call Stack Trace Profiler Simulator:

```python
import time
from typing import Dict, List, Optional
from pydantic import BaseModel

class AllocInfo(BaseModel):
    ptr_address: int
    size_bytes: int
    pid: int
    timestamp: float
    stack_id: int

class eBPFMemoryProfilerEngine:
    """
    Simulates eBPF Memory Leak Profiling (BCC memleak tool).
    Instruments uprobes/kprobes and maps stack traces.
    """
    def __init__(self):
        # BPF_MAP_TYPE_HASH: { ptr_address -> AllocInfo }
        self.bpf_alloc_map: Dict[int, AllocInfo] = {}
        # BPF_MAP_TYPE_STACK_TRACE: { stack_id -> List[str] }
        self.bpf_stack_map: Dict[int, List[str]] = {}
        self.next_stack_id = 100

    def capture_stack_trace(self, stack_frames: List[str]) -> int:
        """Simulates bpf_get_stackid() kernel stack unwinding."""
        stack_id = self.next_stack_id
        self.next_stack_id += 1
        self.bpf_stack_map[stack_id] = stack_frames
        return stack_id

    def on_malloc_probe(self, pid: int, ptr_address: int, size_bytes: int, stack_frames: List[str]):
        """uprobe:libc.so:malloc entry hook."""
        stack_id = self.capture_stack_trace(stack_frames)
        info = AllocInfo(
            ptr_address=ptr_address, size_bytes=size_bytes, pid=pid, timestamp=time.time(), stack_id=stack_id
        )
        self.bpf_alloc_map[ptr_address] = info
        print(f" 📥 [eBPF uprobe:malloc] PID #{pid} -> Alloc 0x{ptr_address:X} ({size_bytes}B) [StackID #{stack_id}]")

    def on_free_probe(self, pid: int, ptr_address: int):
        """uprobe:libc.so:free entry hook."""
        if ptr_address in self.bpf_alloc_map:
            del self.bpf_alloc_map[ptr_address]
            print(f" 🗑️ [eBPF uprobe:free] PID #{pid} -> Freed 0x{ptr_address:X} (Removed from BPF Map)")
        else:
            print(f" ⚠️ [eBPF WARNING] Double-Free or Untracked Free at 0x{ptr_address:X}!")

    def generate_memory_leak_report(self):
        """Scans BPF Hash Map for remaining un-freed allocations."""
        print("\n🔍 --- [eBPF Memory Leak Detection Report] ---")
        if not self.bpf_alloc_map:
            print(" 🎉 Zero Memory Leaks Detected! All allocations were freed successfully.")
            return

        total_leaked_bytes = sum(info.size_bytes for info in self.bpf_alloc_map.values())
        print(f" 🚨 FOUND {len(self.bpf_alloc_map)} UN-FREED LEAKS! Total Leaked Memory: {total_leaked_bytes} Bytes\n")

        # Group by Stack Trace ID
        leaks_by_stack: Dict[int, List[AllocInfo]] = {}
        for info in self.bpf_alloc_map.values():
            leaks_by_stack.setdefault(info.stack_id, []).append(info)

        for stack_id, leaks in leaks_by_stack.items():
            stack_frames = self.bpf_stack_map[stack_id]
            subtotal_bytes = sum(l.size_bytes for l in leaks)
            print(f" 🔥 StackID #{stack_id} Leaked {len(leaks)} objects ({subtotal_bytes} Bytes):")
            for frame in stack_frames:
                print(f"     -> {frame}")
            print()

# Demonstration Execution
if __name__ == "__main__":
    ebpf = eBPFMemoryProfilerEngine()

    print("🚀 Demonstrating Dynamic Kernel Memory Profiling via eBPF...")
    print("=" * 75)

    # 1. Simulate Normal Application Allocation & Free
    frames_normal = ["main() at main.cpp:42", "process_request() at server.cpp:108", "malloc()"]
    ebpf.on_malloc_probe(pid=2048, ptr_address=0x7FFF0010, size_bytes=1024, stack_frames=frames_normal)
    ebpf.on_free_probe(pid=2048, ptr_address=0x7FFF0010)

    # 2. Simulate Leaked Allocation (Missing free!)
    frames_leaked = ["main() at main.cpp:42", "handle_connection() at net.cpp:215", "parse_json_headers() at parser.cpp:88", "malloc()"]
    ebpf.on_malloc_probe(pid=2048, ptr_address=0x7FFF0090, size_bytes=4096, stack_frames=frames_leaked)
    ebpf.on_malloc_probe(pid=2048, ptr_address=0x7FFF0120, size_bytes=4096, stack_frames=frames_leaked)

    # 3. Generate Memory Leak Profiling Report
    ebpf.generate_memory_leak_report()
```

---

## eBPF Memory Profiling Gotchas & Best Practices

When deploying eBPF memory profiling in production:

> [!IMPORTANT]
> **Use Kernel ORC Unwinder or Compile with `-fno-omit-frame-pointer`**: Standard x86 binaries omit frame pointers to gain extra CPU registers, breaking eBPF stack unwinding. Compile C++/Rust code with `-fno-omit-frame-pointer` or use modern ORC kernel stack unwinding.

> [!CAUTION]
> **Beware of Uprobe Overhead in High-Frequency Allocation Loops**: Attaching uprobes to micro-functions called millions of times per second adds kernel trap context-switch overhead ($\approx 200\text{ns}$ per probe). Filter uprobes by minimum size threshold (`memleak -m 1024`).

---

## Real-World Enterprise Impact
eBPF memory profiling tools (such as **BCC `memleak`**, **bpftrace**, and **Parca**) report:
* **Near-Zero Production Overhead ($< 1\%$)**: Replaces Valgrind's $50\times$ slowdown with non-intrusive in-kernel eBPF probe execution.
* **Instant Root Cause Pinpointing**: Hashing stack backtraces directly in BPF maps allows engineers to identify exact line-of-code memory leaks in live production clusters.
