# Register Allocation Algorithms: Graph Coloring, Linear Scan & Liveness Analysis

In the final stages of a compiler backend (such as **LLVM CodeGen**, **GCC**, or **Cranelift**), the compiler must translate Intermediate Representation (IR) instructions into native CPU assembly.

Compiler IR operates on an **unlimited abstraction of virtual registers** (`v0, v1, v2, ... v999`).

However, physical CPU hardware possesses a small, fixed number of physical registers—for example, x86_64 provides only **16 general-purpose registers** (`RAX`, `RBX`, `RCX`, `RDX`, `RSI`, `RDI`, `R8`–`R15`).

Mapping an arbitrary number of virtual registers onto $K$ physical CPU registers without data corruption is the task of **Register Allocation**.

If physical registers are exhausted, the compiler must **Spill** values to slow RAM stack frames (`MOV [RBP-8], RAX`).

This article details Liveness Analysis, Chaitin-Briggs Graph Coloring, and Linear Scan Register Allocation.

---

## 📖 Register Allocation & Live Range Interference Architecture

How compiler backends compute variable liveness intervals and allocate physical CPU registers:

```mermaid
graph TD
  subgraph Compiler IR & Liveness Analysis
    IR[IR Code Sequence: v0, v1, v2, v3] --> Liveness[Liveness Analysis: Compute Live Intervals]
    Liveness --> Intervals["Live Intervals: v0=[1..4], v1=[2..6], v2=[3..5], v3=[7..9]"]
  end
  
  subgraph Register Allocator Algorithm (Linear Scan / Graph Coloring)
    Intervals --> Allocator{Are Free CPU Registers Available?}
    
    Allocator -->|Yes: Assign Register| RegAssign["v0 -> RAX, v1 -> RBX, v2 -> RCX"]
    Allocator -->|No: Register Exhaustion!| Spill[Register Spiller: Spill longest interval v1 to RAM Stack [RBP-8]]
  end
  
  subgraph Final Target Machine Code
    RegAssign & Spill --> Assembly[Native Assembly Code: MOV RAX, 10; MOV [RBP-8], RBX]
  end
```

### Core Register Allocation Principles
1. **Liveness Analysis**: Computes the exact instruction range `[start, end]` where each virtual register is "live" (from its first definition statement until its final usage statement).
2. **Interference Graphs & Chaitin-Briggs Graph Coloring**:
   * Two virtual registers **interfere** if their live intervals overlap in time (they cannot share the same physical register).
   * The compiler constructs an **Interference Graph** where nodes represent virtual registers and edges represent interference.
   * Register allocation is mapped to **K-Graph Coloring**: finding a valid node coloring using $K$ colors (where $K$ = number of physical CPU registers).
3. **Linear Scan Register Allocation**: Graph coloring is $O(N^3)$ and too slow for fast JIT compilers. **Linear Scan** sorts live intervals by start point and processes them in a single $O(N)$ sweep. If an interval starts after an active interval ends, physical registers are freed and reassigned immediately.
4. **Register Spilling**: When $K$ physical registers are occupied and a new overlapping interval arrives, the allocator must **spill** one variable to the CPU stack frame. Cost heuristics select the variable with the lowest dynamic execution weight (e.g. spilling variables outside loop bodies rather than inside tight loops).

---

## 🛠️ Python Implementation: Linear Scan Register Allocator Engine

Here is a production-grade Python implementation of a Linear Scan Register Allocator featuring Liveness Analysis and Register Spilling:

```python
from typing import List, Dict, Tuple, Optional
from pydantic import BaseModel

class LiveInterval(BaseModel):
    var_name: str
    start_inst: int
    end_inst: int
    assigned_reg: Optional[str] = None
    is_spilled: bool = False

class LinearScanRegisterAllocator:
    """
    Implements Poletto & Sarkar Linear Scan Register Allocation.
    """
    def __init__(self, physical_registers: List[str]):
        self.physical_registers = list(physical_registers)
        self.free_registers = list(physical_registers)
        self.active_intervals: List[LiveInterval] = []

    def allocate_registers(self, intervals: List[LiveInterval]) -> List[LiveInterval]:
        """
        Executes single-pass O(N) Linear Scan Register Allocation.
        """
        # 1. Sort intervals by start instruction
        sorted_intervals = sorted(intervals, key=lambda x: x.start_inst)
        
        print(f" 🚀 Starting Linear Scan Register Allocation ({len(self.physical_registers)} Physical Registers: {self.physical_registers})...")
        print("=" * 75)

        for interval in sorted_intervals:
            # 2. Expire old active intervals whose end_inst < current start_inst
            self._expire_old_intervals(interval.start_inst)

            # 3. Check physical register availability
            if len(self.active_intervals) == len(self.physical_registers):
                # No registers free -> Spill interval with furthest end instruction!
                self._spill_at_interval(interval)
            else:
                # Assign free physical register
                reg = self.free_registers.pop(0)
                interval.assigned_reg = reg
                self.active_intervals.append(interval)
                # Keep active list sorted by end_inst
                self.active_intervals.sort(key=lambda x: x.end_inst)
                print(f" ⚡ [Allocated] Variable '{interval.var_name}' (Live: [{interval.start_inst}..{interval.end_inst}]) -> Assigned Register '{reg}'")

        return sorted_intervals

    def _expire_old_intervals(self, current_start: int):
        """Frees physical registers of expired intervals."""
        remaining_active = []
        for active in self.active_intervals:
            if active.end_inst < current_start:
                # Active interval has expired! Return register to pool
                self.free_registers.append(active.assigned_reg)
                print(f" 🧹 [Expired] Variable '{active.var_name}' ended at inst #{active.end_inst}. Reclaimed '{active.assigned_reg}'.")
            else:
                remaining_active.append(active)
        self.active_intervals = remaining_active

    def _spill_at_interval(self, current_interval: LiveInterval):
        """Spills candidate interval with furthest end instruction to stack."""
        candidate = self.active_intervals[-1]
        
        if candidate.end_inst > current_interval.end_inst:
            # Candidate active interval ends later than current -> Spill candidate!
            current_interval.assigned_reg = candidate.assigned_reg
            candidate.assigned_reg = None
            candidate.is_spilled = True
            
            print(f" 💾 [Register Spill] Spilled Variable '{candidate.var_name}' to RAM Stack Frame! Assigned '{current_interval.assigned_reg}' to '{current_interval.var_name}'.")
            
            self.active_intervals.pop()
            self.active_intervals.append(current_interval)
            self.active_intervals.sort(key=lambda x: x.end_inst)
        else:
            # Current interval has longer range -> Spill current interval!
            current_interval.is_spilled = True
            print(f" 💾 [Register Spill] Spilled Current Variable '{current_interval.var_name}' directly to RAM Stack Frame!")

# Demonstration Execution
if __name__ == "__main__":
    # Define 3 Physical Registers: RAX, RBX, RCX
    allocator = LinearScanRegisterAllocator(physical_registers=["RAX", "RBX", "RCX"])

    # Define 5 Virtual Variables with overlapping live ranges
    sample_intervals = [
        LiveInterval(var_name="v0", start_inst=1, end_inst=4),
        LiveInterval(var_name="v1", start_inst=2, end_inst=9),  # Long range -> Spill candidate
        LiveInterval(var_name="v2", start_inst=3, end_inst=5),
        LiveInterval(var_name="v3", start_inst=4, end_inst=6),
        LiveInterval(var_name="v4", start_inst=7, end_inst=10),
    ]

    result = allocator.allocate_registers(sample_intervals)

    print("\n📊 Final Register Allocation & Spill Table:")
    for i in result:
        loc = f"Register [{i.assigned_reg}]" if i.assigned_reg else "RAM Stack [RBP - 8]"
        print(f"   • {i.var_name:8s} (Live: [{i.start_inst:02d}..{i.end_inst:02d}]) -> Location: {loc}")
```

---

## 🚨 Register Allocation Gotchas & Best Practices

When engineering compiler backends:

> [!IMPORTANT]
> **Account for Calling Convention Register Constraints**: Hard-wired calling conventions (e.g. System V AMD64 ABI) mandate that functions pass arguments in specific physical registers (`RDI`, `RSI`, `RDX`, `RCX`, `R8`, `R9`). Pre-color argument variables with fixed physical registers before running general allocation algorithms.

> [!CAUTION]
> **Preserve Callee-Saved Registers**: On x86_64, registers `RBX`, `RBP`, `R12`–`R15` are **Callee-Saved**. If a function modifies these physical registers, it *must* push their original values onto the stack during the function prologue and pop them back during the epilogue.

---

## 📈 Real-World Enterprise Impact
Compiler backends using Linear Scan and Graph Coloring (such as **LLVM** and **V8 TurboFan**) report:
* **Over 25% CPU Execution Speedup**: Keeping high-frequency loop variables inside physical CPU registers avoids slow RAM stack memory reads (`MOV EAX, [RBP-8]`).
* **Microsecond JIT Compilation Latencies**: Linear Scan allocation allows JIT compilers (V8) to emit optimized machine code in a single fast pass.
