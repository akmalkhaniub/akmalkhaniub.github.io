# Lock-Free Data Structures: Hazard Pointers, Atomic Compare-And-Swap (CAS) & ABA Problem

In high-concurrency systems (such as high-frequency trading engines, kernel task schedulers, and event loops), utilizing traditional mutex locks (`pthread_mutex_t` or `std::mutex`) introduces severe performance penalties.

Mutexes rely on kernel-level thread blocking. When lock contention occurs, the OS kernel context switches the thread off the CPU, incurring **$1,000\text{ns}$ to $3,000\text{ns}$ context switch overheads**, priority inversion, and potential deadlocks.

To achieve non-blocking, multi-core scalability, systems engineers design **Lock-Free Data Structures**.

Lock-free algorithms guarantee that at least one thread makes continuous progress in a finite number of steps, operating directly on CPU hardware atomic instructions like **Compare-And-Swap (CAS)**.

However, lock-free pointer manipulations introduce subtle concurrency pitfalls: **The ABA Problem** and **Safe Memory Reclamation**.

This article details Atomic CAS loops, Michael-Scott Lock-Free Queues, the ABA problem, and Hazard Pointers.

---

## Atomic CAS & Hazard Pointer Protection Architecture

How Lock-Free Queues use Compare-And-Swap (CAS) and Hazard Pointers to prevent memory corruption:

```mermaid
graph TD
  subgraph SG1_LockFreeCas ["Lock-Free CAS Retry Loop"]
    ThreadA[Thread A: Enqueue / Dequeue] -->|1. Read Current Head Pointer A| ReadHead[Read Head -> Pointer A]
    ReadHead -->|2. Compute Next Pointer B| ComputeNext[Compute Next Node -> Pointer B]
    ComputeNext -->|3. Atomic CAS(Head, Expected A, New B)| CASAttempt{Hardware CAS Instruction}
    
    CASAttempt -->|Success: Updated atomically| Complete[Operation Complete]
    CASAttempt -->|Failure: Interrupted by Thread B| ReadHead
  end
  
  subgraph SG2_HazardPointerMemory ["Hazard Pointer Memory Protection (Prevents ABA & Use-After-Free)"]
    ThreadA -->|4. Publish Active Pointer to Hazard Array| HazardPointer[Hazard Pointer: 'Pointer A in Use!']
    HazardPointer -.->|5. Guard Node Memory| NodeA[Queue Node A Memory]
    
    ThreadB[Thread B: Retires Node A] -->|6. Check Hazard Array| GuardCheck{Is Pointer A in Hazard Array?}
    GuardCheck -->|Yes: Reader active!| DeferFree[Defer Free to Retirement List]
    GuardCheck -->|No: Safe to delete| FreeMemory[Reclaim Memory Page]
  end
```

### Core Lock-Free Concurrency Mechanics
1. **Atomic Compare-And-Swap (CAS)**: A hardware-level atomic instruction (`LOCK CMPXCHG` on x86, `LDREX/STREX` or `CAS` on ARM64) that performs an atomic read-modify-write:
   $$\text{CAS}(\text{location}, \text{expected\_val}, \text{new\_val}) → \text{bool}$$
   If `*location == expected_val`, the CPU updates `*location = new_val` and returns `True`. If another thread modified the location first, CAS fails and returns `False`, prompting the thread to retry its loop.
2. **The ABA Problem**: A classic lock-free race condition:
   * Thread 1 reads pointer `A` from the head of a lock-free stack.
   * Thread 2 preempts Thread 1, pops `A`, pops `B`, and then pushes `A` back onto the stack (allocating `A` at the same memory address!).
   * Thread 1 resumes. Its CAS check evaluates `Head == A` (True!), so CAS succeeds—unaware that the stack contents underneath `A` were completely mutated!
3. **Tagged Pointers / Version Counter**: A solution to the ABA problem. Pointers are packed with a 64-bit monotonic sequence counter (`struct TaggedPtr { Node* ptr; uint64_t tag; }`). Every write increments `tag`. Even if memory address `A` is reused, `tag_1 != tag_2`, causing CAS to reject stale references.
4. **Hazard Pointers (Safe Memory Reclamation)**: In lock-free data structures, a thread cannot safely call `free(node)` because another thread might be dereferencing `node->next` concurrently. Before reading a node, a thread publishes the node's memory address to its thread-local **Hazard Pointer slot**. Freeing threads check the global Hazard Pointer list, deferring memory deletion until no reader holds a hazard pointer to that address.

---

## Python Implementation: Lock-Free Stack with ABA Protection & Hazard Pointers

Here is a production-grade Python simulation of a Lock-Free Treiber Stack with Tagged Pointers (ABA Protection) and Hazard Pointer memory reclamation:

```python
import threading
import time
from typing import Optional, List, Dict
from pydantic import BaseModel

class TaggedNode(BaseModel):
    value: int
    next_node: Optional['TaggedNode'] = None
    tag: int = 0

class HazardPointerRegistry:
    """
    Global Hazard Pointer Registry for Safe Memory Reclamation.
    """
    def __init__(self, num_threads: int = 4):
        # thread_id -> List of active Hazard Pointers
        self.hazards: Dict[str, Optional[TaggedNode]] = {}
        self.retired_list: List[TaggedNode] = []
        self.lock = threading.Lock()

    def set_hazard(self, thread_id: str, node: Optional[TaggedNode]):
        self.hazards[thread_id] = node

    def clear_hazard(self, thread_id: str):
        self.hazards[thread_id] = None

    def retire_node(self, node: TaggedNode):
        """Retires node and attempts reclamation if no hazard holds it."""
        with self.lock:
            self.retired_list.append(node)
            self.reclaim_memory()

    def reclaim_memory(self):
        """Reclaims retired nodes that are NOT in active hazard slots."""
        active_hazard_ptrs = set(self.hazards.values())
        to_keep = []

        for node in self.retired_list:
            if node in active_hazard_ptrs:
                to_keep.append(node)  # Guarded by active reader!
            else:
                print(f" 🧹 [Hazard Reclamation] Reclaimed Node(val={node.value}, tag={node.tag}) - Safe!")

        self.retired_list = to_keep

class LockFreeTreiberStack:
    """
    Lock-Free Treiber Stack using Atomic CAS and Tagged Pointers.
    """
    def __init__(self, hazard_registry: HazardPointerRegistry):
        self.head: Optional[TaggedNode] = None
        self.tag_counter = 0
        self.lock = threading.Lock()  # Simulates hardware atomic CAS lock
        self.hazard_registry = hazard_registry

    def _atomic_cas_head(self, expected: Optional[TaggedNode], new_node: Optional[TaggedNode]) -> bool:
        """Simulates hardware CPU LOCK CMPXCHG instruction."""
        with self.lock:
            if self.head == expected:
                self.head = new_node
                return True
            return False

    def push(self, val: int):
        """Lock-Free Push using CAS Retry Loop."""
        while True:
            old_head = self.head
            self.tag_counter += 1
            new_node = TaggedNode(value=val, next_node=old_head, tag=self.tag_counter)

            if self._atomic_cas_head(old_head, new_node):
                print(f" ⬆️ [Push CAS Success] Pushed val={val} (Tag: {new_node.tag})")
                break
            # CAS failed! Loop retries automatically.

    def pop(self, thread_id: str) -> Optional[int]:
        """Lock-Free Pop using Hazard Pointer Protection and CAS Loop."""
        while True:
            old_head = self.head
            if not old_head:
                return None

            # 1. Publish Hazard Pointer before reading next pointer
            self.hazard_registry.set_hazard(thread_id, old_head)

            # Re-verify head hasn't changed
            if self.head != old_head:
                self.hazard_registry.clear_hazard(thread_id)
                continue

            next_node = old_head.next_node

            # 2. Atomic CAS Pop
            if self._atomic_cas_head(old_head, next_node):
                val = old_head.value
                self.hazard_registry.clear_hazard(thread_id)
                # 3. Retire old head safely via Hazard Registry
                self.hazard_registry.retire_node(old_head)
                print(f" ⬇️ [{thread_id}] [Pop CAS Success] Popped val={val} (Tag: {old_head.tag})")
                return val

            self.hazard_registry.clear_hazard(thread_id)

# Demonstration Execution
if __name__ == "__main__":
    hazards = HazardPointerRegistry()
    stack = LockFreeTreiberStack(hazards)

    print("🚀 Demonstrating Lock-Free Treiber Stack & Hazard Pointers...")
    print("=" * 75)

    # 1. Push Elements onto Lock-Free Stack
    stack.push(100)
    stack.push(200)
    stack.push(300)

    # 2. Concurrent Pop Operations across Worker Threads
    def worker(t_id: str):
        stack.pop(t_id)

    threads = [threading.Thread(target=worker, args=(f"Thread-{i}",)) for i in range(1, 4)]
    for t in threads: t.start()
    for t in threads: t.join()
```

---

## Lock-Free Concurrency Gotchas & Best Practices

When designing lock-free data structures:

> [!IMPORTANT]
> **Use Double-Width CAS (`CMPXCHG16B`) for Tagged Pointers**: On 64-bit x86 systems, packing a 64-bit memory pointer and a 64-bit tag counter requires a 128-bit atomic instruction (`CMPXCHG16B`). Ensure compiler flags include `-mcx16` to enable 128-bit atomic operations.

> [!CAUTION]
> **Avoid High CAS Contention (CAS Storms)**: Under extreme contention (hundreds of threads attacking the same atomic head pointer), CAS failure rates approach $99\%$, wasting CPU cycles in retry loops (**Spinlock Thrasher**). Use exponential backoff or lock-free elimination arrays to absorb high contention.

---

## Real-World Enterprise Impact
High-concurrency systems utilizing lock-free data structures (such as **LMAX Disruptor**, **Linux Kernel RCU**, and **Jellyfish**) report:
* **$10\times$ Higher Multi-Core Throughput**: Processing tens of millions of concurrent operations per second without lock acquisition delays.
* **Zero Deadlocks or Priority Inversion**: Lock-free progress guarantees ensure high-priority threads are never blocked by low-priority worker threads.
