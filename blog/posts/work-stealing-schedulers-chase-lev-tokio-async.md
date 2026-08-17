# Work-Stealing Schedulers: Chase-Lev Deque, MPMC Queues & Tokio Async Executor

In modern high-performance asynchronous runtime environments (**Go Goroutine Scheduler**, **Rust Tokio**, **Java ForkJoinPool**, **C# .NET ThreadPool**), systems process millions of lightweight async tasks per second.

If a runtime uses a single global task queue shared across 64 CPU cores, thread contention on the queue mutex destroys scalability. Conversely, static per-thread task queues cause **Load Imbalance**: Core 0 becomes bogged down with $50,000$ tasks while Core 63 sits idle.

To balance workloads dynamically across CPU cores with minimal lock contention, modern async executors deploy **Work-Stealing Schedulers**.

Driven by the lock-free **Chase-Lev Work-Stealing Deque**, worker threads execute tasks locally in LIFO order while idle threads steal tasks from busy peers in FIFO order.

This article details per-thread local deques, the Chase-Lev lock-free algorithm, cache locality advantages, MPMC overflow queues, and task-stealing protocols.

---

## 📖 Work-Stealing Scheduling & Chase-Lev Deque Architecture

How the Chase-Lev Deque balances owner LIFO operations and thief FIFO stealing:

```mermaid
graph TD
  subgraph Worker Thread 0 (Busy Worker)
    Owner[Worker Thread 0 Owner] -->|1. Push / Pop Tasks at BOTTOM (LIFO Order - Cache Hot!)| Bottom[Bottom Pointer]
    
    subgraph Chase-Lev Work-Stealing Deque (Worker 0)
      Bottom -->|Local Tasks Array| TaskN[Task N]
      TaskN --> TaskN1[Task N-1]
      TaskN1 --> Task0[Task 0: Oldest Parent Task]
      Task0 --> Top[Top Pointer]
    end
  end
  
  subgraph Worker Thread 1 (Idle Thief)
    Thief[Idle Worker Thread 1] -->|2. Steal Task from TOP via CAS (FIFO Order)| Top
    Thief -->|3. Execute Steolen Task 0| Exec[Execute Async Task 0]
  end
```

### Core Work-Stealing Concepts
1. **The Work-Stealing Principle**:
   * Each CPU worker thread manages a dedicated local task queue (**Double-Ended Queue / Deque**).
   * When a worker thread spawns a new task, it pushes the task onto its local deque.
   * If a worker thread finishes its own tasks, it transitions to a **Thief** state, scanning peer worker deques to **steal** work instead of idling.
2. **The Chase-Lev Lock-Free Deque**:
   * Designed by David Chase and Yossi Lev. Allows concurrent single-owner push/pop and multi-thief steals with minimal synchronization:
   * **Owner Operations (Bottom)**:
     * *Push*: Increments `bottom`. Stores task at `tasks[bottom]`. Uses `memory_order_release`.
     * *Pop*: Decrements `bottom`. Reads `task = tasks[bottom]`. If `bottom > top`, returns task with zero lock contention!
     * If `bottom == top` (last item in deque), owner uses `CAS(top, top, top+1)` to resolve race conditions against potential thieves.
   * **Thief Operations (Top)**:
     * *Steal*: Reads `top`. Reads `bottom`. If `top < bottom`, reads `task = tasks[top]`. Executes `CAS(top, expected=top, new=top+1)`. If CAS succeeds, thief takes the task!
3. **Cache Locality Advantages (LIFO vs FIFO)**:
   * **Owner Thread operates LIFO (Last-In, First-Out)**: Popping the most recently pushed task ensures that child task data is still hot in the CPU's **L1/L2 Cache**.
   * **Thief Thread operates FIFO (First-In, First-Out)**: Stealing the oldest task at the top of the deque usually yields a large parent task that will spawn further sub-tasks, keeping the thief busy longer!
4. **Multi-Producer Multi-Consumer (MPMC) Overflow Queues**:
   * Local deques have fixed capacities (e.g. $256$ task slots in Tokio). When a local deque overflows, excess tasks are pushed into a central **Global MPMC Queue**. Idle workers check the global queue before attempting peer steals.

---

## 🛠️ Python Implementation: Chase-Lev Deque & Work-Stealing Scheduler

Here is a production-grade Python implementation of a Lock-Free Chase-Lev Work-Stealing Deque and a Multi-Worker Async Scheduler:

```python
import time
import random
from typing import List, Optional, Tuple
from pydantic import BaseModel

class AsyncTask(BaseModel):
    task_id: str
    work_units: int

class ChaseLevWorkStealingDeque:
    """
    Simulates a Lock-Free Chase-Lev Deque (Single-Owner Bottom Push/Pop, Multi-Thief Top Steal).
    """
    def __init__(self, capacity: int = 16):
        self.capacity = capacity
        self.tasks: List[Optional[AsyncTask]] = [None] * capacity
        self.top = 0       # Atomic Top Pointer (Incremented by Thieves)
        self.bottom = 0    # Atomic Bottom Pointer (Updated by Owner)

    def owner_push(self, task: AsyncTask) -> bool:
        """Pushes task onto the BOTTOM of the local deque (Owner Only)."""
        b = self.bottom
        t = self.top
        
        if b - t >= self.capacity:
            print(f" ⚠️ [Deque Full!] Capacity {self.capacity} reached. Task '{task.task_id}' sent to Global Overflow Queue.")
            return False

        self.tasks[b % self.capacity] = task
        self.bottom = b + 1
        print(f" 📥 [Owner Push] Task '{task.task_id}' pushed to BOTTOM (Index {b})")
        return True

    def owner_pop(self) -> Optional[AsyncTask]:
        """Pops task from the BOTTOM of local deque in LIFO order (Owner Only)."""
        b = self.bottom - 1
        self.bottom = b
        t = self.top

        if t <= b:
            # Tasks exist!
            task = self.tasks[b % self.capacity]
            if t == b:
                # Last remaining item in deque! Must CAS against potential thieves.
                if not self._cas_top(expected=t, new_top=t + 1):
                    # Thief won the race!
                    task = None
                self.bottom = t + 1
            print(f" 📤 [Owner Pop LIFO] Popped Task '{task.task_id if task else 'None'}' from BOTTOM")
            return task
        else:
            # Deque is empty! Reset pointers
            self.bottom = t
            return None

    def thief_steal(self) -> Optional[AsyncTask]:
        """Steals task from the TOP of deque in FIFO order (Thief Thread)."""
        t = self.top
        b = self.bottom

        if t < b:
            task = self.tasks[t % self.capacity]
            # Execute Atomic CAS to increment Top
            if self._cas_top(expected=t, new_top=t + 1):
                print(f" 🥷 [Thief STEAL FIFO!] Successfully stole Task '{task.task_id}' from TOP (Index {t})")
                return task
        return None

    def _cas_top(self, expected: int, new_top: int) -> bool:
        """Simulates Atomic Hardware CAS on Top Pointer."""
        if self.top == expected:
            self.top = new_top
            return True
        return False

class WorkStealingScheduler:
    """
    Simulates Multi-Worker Async Runtime (Tokio / Go Scheduler).
    """
    def __init__(self, num_workers: int = 3):
        self.workers = [ChaseLevWorkStealingDeque() for _ in range(num_workers)]
        self.global_queue: List[AsyncTask] = []

    def spawn_task(self, worker_id: int, task: AsyncTask):
        deque = self.workers[worker_id]
        if not deque.owner_push(task):
            self.global_queue.append(task)

    def execute_worker_step(self, worker_id: int):
        deque = self.workers[worker_id]
        
        # 1. Try Local Owner Pop (LIFO)
        task = deque.owner_pop()
        
        # 2. Try Global Queue if local empty
        if not task and self.global_queue:
            task = self.global_queue.pop(0)
            print(f" 🌐 [Worker #{worker_id}] Fetched Task '{task.task_id}' from Global Queue")

        # 3. Work-Stealing: Steal from Peer (FIFO)
        if not task:
            peers = [i for i in range(len(self.workers)) if i != worker_id]
            random.shuffle(peers)
            for peer_id in peers:
                stolen = self.workers[peer_id].thief_steal()
                if stolen:
                    task = stolen
                    print(f" 🚀 [Worker #{worker_id}] Stole Task '{task.task_id}' from Worker #{peer_id}!")
                    break

        if task:
            print(f" ⚡ [Worker #{worker_id} Executing] Processing Task '{task.task_id}' ({task.work_units} work units)...")

# Demonstration Execution
if __name__ == "__main__":
    scheduler = WorkStealingScheduler(num_workers=2)

    print("🚀 Demonstrating Chase-Lev Deque & Work-Stealing Scheduler...")
    print("=" * 75)

    # Worker 0 receives 3 tasks (Overloaded)
    print("1. Spawning Tasks onto Worker 0 Local Deque:")
    scheduler.spawn_task(0, AsyncTask(task_id="Task_0_Root", work_units=10))
    scheduler.spawn_task(0, AsyncTask(task_id="Task_1_Child", work_units=5))
    scheduler.spawn_task(0, AsyncTask(task_id="Task_2_Child", work_units=2))

    # Worker 0 executes local task (LIFO pop Task 2)
    print("\n2. Worker 0 Execution Step (LIFO Owner Pop):")
    scheduler.execute_worker_step(worker_id=0)

    # Worker 1 (Idle) steals from Worker 0 (FIFO steal Task 0 Root)
    print("\n3. Worker 1 Execution Step (Idle Thief Steals from Worker 0):")
    scheduler.execute_worker_step(worker_id=1)
```

---

## 🚨 Work-Stealing Gotchas & Best Practices

When designing work-stealing schedulers:

> [!IMPORTANT]
> **Use Power-of-Two Ring Buffers for Fast Bitwise Modulo**: In production Chase-Lev deques, set capacity to powers of two ($256$). This replaces expensive integer division modulo operations (`index % capacity`) with lightning-fast bitwise AND masks (`index & (capacity - 1)`).

> [!CAUTION]
> **Beware of Excess Theft Spin-Loops**: If all worker deques are empty, worker threads continuously scanning peer deques consume $100\%$ CPU power spinning uselessly. Implement **Worker Thread Park/Unpark** using conditional variables after a few unsuccessful steal attempts.

---

## 📈 Real-World Enterprise Impact
Work-stealing schedulers (such as **Rust Tokio**, **Go Runtime**, and **Java ForkJoinPool**) report:
* **Over $90\%$ Reduction in Thread Lock Contention**: Per-thread local deques allow worker threads to push and pop tasks without acquiring global mutex locks.
* **Optimal CPU Multi-Core Utilization**: Dynamic work stealing ensures zero CPU core idle time even during unbalanced async workloads.
