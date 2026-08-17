# Lock-Free Data Structures: Compare-And-Swap (CAS), ABA Problem & Hazard Pointers

In high-concurrency systems programming (**Linux Kernel**, **JVM**, **Rust Tokio**, **Database Storage Engines**), multi-threaded worker threads process millions of items per second.

Traditional **Mutual Exclusion Locks (Mutexes)** suffer from severe performance penalties:
* **Context Switching Overhead**: Blocking a thread requires an operating system context switch ($\approx 1\mu\text{s} - 3\mu\text{s}$).
* **Lock Convoying & Priority Inversion**: High-priority threads stall waiting for low-priority threads holding mutexes.

To achieve maximum concurrency without lock blocking, modern systems utilize **Lock-Free Data Structures**.

Powered by hardware **Compare-And-Swap (CAS)** atomic instructions, **Tagged Pointers**, and **Hazard Pointers**, lock-free algorithms guarantee system-wide progress even under intense thread contention.

This article details CAS primitives, the Treiber Stack algorithm, the ABA Problem, Tagged Pointers, and Hazard Pointer safe memory reclamation.

---

## 📖 Lock-Free Concurrency & The ABA Problem

How atomic Compare-And-Swap (CAS) instructions operate, the ABA problem vulnerability, and Hazard Pointer memory safety:

```mermaid
graph TD
  subgraph Compare-And-Swap (CAS) Loop
    ReadVal[1. Read Current Head Pointer A] --> PrepareNew[2. Construct New Node B -> next = A]
    PrepareNew --> CASCheck{"3. Execute Hardware CAS (Head, Expected=A, New=B)"}
    CASCheck -->|Success: Head updated to B| Done[🎉 Operation Complete!]
    CASCheck -->|Failure: Contention detected!| ReadVal
  end
  
  subgraph The ABA Problem Vulnerability
    T1[Thread 1 reads Head A] -.->|Thread 1 Suspended| T2[Thread 2 Pops A, Pops B, Pushes A back!]
    T2 -.-> T1Resume[Thread 1 Resumes: CAS sees Head is STILL A!]
    T1Resume -->|CAS Succeeds Unsafely!| CorruptedStack[🚨 STACK CORRUPTION! Node B was freed!]
  end
  
  subgraph Mitigation: Tagged Pointers & Hazard Pointers
    CorruptedStack -.-> Tagged[Tagged Pointer: Combine Pointer + Version Count]
    CorruptedStack -.-> Hazard[Hazard Pointers: Defer Free until HP Array clear]
  end
```

### Core Lock-Free Mechanics
1. **Compare-And-Swap (CAS) Primitive**:
   * Hardware atomic instruction (`lock cmpxchg` on x86, `LDAX/STLX` on ARM).
   * Atomically compares value at memory address $P$ with expected value $A$. If $P == A$, updates $P = B$ and returns `true`; otherwise returns `false`.
   * **Lock-Free Guarantee**: At least one thread succeeds in advancing progress on every CAS attempt.
2. **The Lock-Free Treiber Stack**:
   * *Push Operation*: Reads `head`. Creates `new_node->next = head`. Executes `CAS(head, expected=head, new=new_node)`. If CAS fails, retries loop.
   * *Pop Operation*: Reads `head`. Reads `next_node = head->next`. Executes `CAS(head, expected=head, new=next_node)`.
3. **The ABA Problem**:
   * Thread 1 reads `head = A`. Before executing CAS, Thread 1 is preempted.
   * Thread 2 pops `A`, pops `B`, and then pushes `A` back onto the stack (`A` is reused memory).
   * Thread 1 resumes and executes `CAS(head, A, B)`. CAS succeeds because memory location holds address `A`! But `A->next` now points to garbage or a freed node `B`!
   * *Solution 1: Tagged Pointers*: Pair the 64-bit pointer with a 64-bit version counter (`(pointer, version)`). Each mutation increments the version (`A:v1` $\to$ `B:v2` $\to$ `A:v3`). CAS checks both pointer and version.
4. **Hazard Pointers (Safe Memory Reclamation)**:
   * In garbage-collected languages (Java/Go), memory reclamation is automatic. In C/C++, deallocating a node popped by Thread 1 while Thread 2 is reading its `next` pointer causes a **Use-After-Free Crash**.
   * *Hazard Pointer Protocol*: Each reader thread publishes the address it is currently reading into a global **Hazard Pointer Array**. A thread popping a node defers calling `free()` until the node address is no longer listed in any thread's Hazard Pointer slot.

---

## 🛠️ Python Implementation: Lock-Free Treiber Stack & Hazard Pointers

Here is a production-grade Python implementation of a Lock-Free Treiber Stack with Tagged Pointers (ABA Mitigation) and a Hazard Pointer Memory Reclamation Engine:

```python
import time
from typing import List, Optional, Tuple
from pydantic import BaseModel

class TaggedPointer(BaseModel):
    node_id: Optional[str]
    version: int

class StackNode:
    def __init__(self, value: str):
        self.value = value
        self.next: Optional[TaggedPointer] = None

class HazardPointerArray:
    """
    Global Hazard Pointer Array for Safe Memory Reclamation.
    """
    def __init__(self, max_threads: int = 4):
        self.hazard_pointers: List[Optional[str]] = [None] * max_threads
        self.retired_list: List[str] = []

    def set_hazard_pointer(self, thread_id: int, node_id: Optional[str]):
        self.hazard_pointers[thread_id] = node_id

    def clear_hazard_pointer(self, thread_id: int):
        self.hazard_pointers[thread_id] = None

    def retire_node(self, node_id: str):
        """Defers reclamation of node until no active hazard pointers match it."""
        if node_id in self.hazard_pointers:
            print(f" ⏳ [Hazard Pointer Active] Node '{node_id}' still in use by another thread. Deferred reclamation!")
            self.retired_list.append(node_id)
        else:
            print(f" 🧹 [Safe Reclamation] Node '{node_id}' freed immediately! (Zero hazard pointers active)")

class LockFreeTreiberStack:
    """
    Simulates a Lock-Free Stack using CAS, Tagged Pointers, and Hazard Pointers.
    """
    def __init__(self, hp_array: HazardPointerArray):
        self.head = TaggedPointer(node_id=None, version=0)
        self.nodes: Dict[str, StackNode] = {}
        self.hp_array = hp_array

    def _atomic_cas_head(self, expected: TaggedPointer, new_node_id: Optional[str]) -> bool:
        """Simulates Atomic Hardware CAS instruction on Head TaggedPointer."""
        if self.head.node_id == expected.node_id and self.head.version == expected.version:
            self.head = TaggedPointer(node_id=new_node_id, version=expected.version + 1)
            return True
        return False

    def push(self, thread_id: int, value: str, node_id: str):
        """Lock-Free Push with CAS Retry Loop."""
        new_node = StackNode(value=value)
        self.nodes[node_id] = new_node

        while True:
            current_head = TaggedPointer(node_id=self.head.node_id, version=self.head.version)
            new_node.next = current_head

            print(f" 📥 [Thread #{thread_id} Push Attempt] Key '{value}' -> Head is '{current_head.node_id}' (v{current_head.version})")
            if self._atomic_cas_head(expected=current_head, new_node_id=node_id):
                print(f" 🎉 [Thread #{thread_id} Push Success] Stack Head updated to '{node_id}' (v{self.head.version})")
                break
            else:
                print(f" 🔄 [CAS Failed!] Head changed during execution. Retrying Push...")

    def pop(self, thread_id: int) -> Optional[str]:
        """Lock-Free Pop with Tagged Pointer & Hazard Pointer Protection."""
        while True:
            current_head = TaggedPointer(node_id=self.head.node_id, version=self.head.version)
            if not current_head.node_id:
                return None

            # 1. Publish Hazard Pointer to protect current_head from being freed
            self.hp_array.set_hazard_pointer(thread_id, current_head.node_id)

            # Re-check head after setting HP
            if self.head.node_id != current_head.node_id:
                self.hp_array.clear_hazard_pointer(thread_id)
                continue

            node = self.nodes[current_head.node_id]
            next_head = node.next

            # 2. Execute Atomic CAS
            next_node_id = next_head.node_id if next_head else None
            if self._atomic_cas_head(expected=current_head, new_node_id=next_node_id):
                self.hp_array.clear_hazard_pointer(thread_id)
                print(f" 📤 [Thread #{thread_id} Pop Success] Popped Node '{current_head.node_id}' (Value: '{node.value}')")
                
                # 3. Safely Retire Node via Hazard Pointer Check
                self.hp_array.retire_node(current_head.node_id)
                return node.value
            else:
                self.hp_array.clear_hazard_pointer(thread_id)
                print(f" 🔄 [CAS Failed!] Head changed during Pop. Retrying...")

# Demonstration Execution
if __name__ == "__main__":
    hp_system = HazardPointerArray(max_threads=2)
    stack = LockFreeTreiberStack(hp_array=hp_system)

    print("🚀 Demonstrating Lock-Free Treiber Stack & Hazard Pointers...")
    print("=" * 75)

    # 1. Thread 0 pushes Node A & Node B
    stack.push(thread_id=0, value="Data_A", node_id="node_A")
    stack.push(thread_id=0, value="Data_B", node_id="node_B")

    # 2. Thread 1 sets Hazard Pointer on Node B (simulating active reader)
    print("\n🔒 [Thread 1] Setting Hazard Pointer on 'node_B'...")
    hp_system.set_hazard_pointer(thread_id=1, node_id="node_B")

    # 3. Thread 0 pops Node B -> Triggers Deferred Hazard Pointer Reclamation!
    print("\n📤 [Thread 0] Popping Head Node:")
    stack.pop(thread_id=0)

    # 4. Thread 1 finishes reading and clears Hazard Pointer
    print("\n🔓 [Thread 1] Releasing Hazard Pointer on 'node_B'...")
    hp_system.clear_hazard_pointer(thread_id=1)
    hp_system.retire_node("node_B")
```

---

## 🚨 Lock-Free Concurrency Gotchas & Best Practices

When designing lock-free data structures:

> [!IMPORTANT]
> **Use Tagged Pointers for 128-bit CAS**: On 64-bit architectures (x86-64), use `cmpxchg16b` (128-bit CAS) to pair a 64-bit memory pointer with a 64-bit monotonically increasing integer version tag to prevent ABA corruption.

> [!CAUTION]
> **Beware of High CAS Contention Spin Loops**: Under extreme thread contention (100 threads executing CAS on a single head pointer), CPU core cache lines bounce back and forth constantly (**Cache Line Bouncing**). Use exponential backoff or fall back to a Lock-Free Elimination Array.

---

## 📈 Real-World Enterprise Impact
Lock-free algorithms (such as **Java ConcurrentLinkedQueue**, **Rust crossbeam**, and **Linux Kernel lockless Ring Buffers**) report:
* **Zero Thread Blocking**: Worker threads never enter OS sleep/wake cycles, eliminating context switch overhead.
* **Up to $5\times$ Higher Multi-Threaded Throughput**: Eliminating lock acquisition bottlenecks maximizes parallel CPU core execution efficiency.
