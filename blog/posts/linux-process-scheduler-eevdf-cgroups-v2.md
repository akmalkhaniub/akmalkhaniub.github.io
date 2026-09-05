# Linux Process Scheduler Internals: EEVDF (Earliest Eligible Virtual Deadline First) & Cgroups v2

In high-concurrency cloud environments running thousands of Docker/Kubernetes container workloads on a single physical host, the Linux kernel CPU scheduler is the ultimate arbiter of system latency and fairness.

For over 15 years, Linux relied on the **Completely Fair Scheduler (CFS)**. While CFS ensured proportional CPU distribution over long time windows, it struggled with **latency-sensitive tasks**: interactive or real-time tasks could be delayed by CPU-bound batch tasks until their $vruntime$ caught up.

To solve CFS latency deficiencies, Linux kernel 6.6 replaced CFS with **EEVDF (Earliest Eligible Virtual Deadline First)**, authored by Peter Zijlstra based on Peter Shenoy's seminal 1995 research.

Combined with **Cgroups v2** unified resource hierarchies, EEVDF delivers deterministic CPU latency guarantees for containerized workloads.

This article details EEVDF virtual deadline math, lag eligibility, and Cgroups v2 resource limit enforcement.

---

## EEVDF Scheduling & Cgroups v2 Architecture

How the EEVDF scheduler selects tasks based on Lag Eligibility and Virtual Deadlines:

```mermaid
graph TD
  subgraph Kubernetes Container Pods (Cgroups v2 Limits)
    PodA[Container A: cpu.max = 200ms/100ms] --> RunQueue[Linux CPU RunQueue (Red-Black Tree)]
    PodB[Container B: Latency-Sensitive API] --> RunQueue
  end
  
  subgraph EEVDF Scheduler Selection Engine (Kernel 6.6+)
    RunQueue -->|1. Calculate Virtual Time V & Lag| LagCheck{Is Task Lag >= 0? Eligible Check}
    
    LagCheck -->|No: Lag < 0 Over-allocated| Ineligible[Task Ineligible: Wait for V to advance]
    LagCheck -->|Yes: Lag >= 0 Eligible| EligibleSet[Eligible Tasks Candidate Pool]
    
    EligibleSet -->|2. Sort by Virtual Deadline: V_i = vruntime + q / weight| EarliestDeadline[Pick Task with Earliest Virtual Deadline!]
  end
  
  subgraph CPU Execution Context
    EarliestDeadline -->|3. Dispatch Time Slice q| CPUCore[Physical CPU Core Execution]
  end
```

### Core EEVDF & Cgroups v2 Principles
1. **Virtual Runtime ($vruntime$) & Lag**: The scheduler maintains a monotonic system virtual time $V$. A task's **Lag** represents the difference between the CPU time the task *should* have received versus what it *actually* consumed:
   $$\text{Lag}_i = V - vruntime_i$$
   * If $\text{Lag}_i > 0$: The task has been **under-served** (it consumed less than its fair share).
   * If $\text{Lag}_i < 0$: The task has been **over-served** (it consumed more than its fair share).
2. **Eligibility Criteria**: A task is defined as **Eligible** to run if and only if its $\text{Lag}_i \ge 0$. Ineligible tasks ($\text{Lag}_i < 0$) are barred from CPU selection until system time $V$ advances.
3. **Virtual Deadline ($V_i$) Selection**: Among all *eligible* tasks, EEVDF selects the task with the **Earliest Virtual Deadline**:
   $$V_i = vruntime_i + \frac{q}{w_i}$$
   where $q$ is the requested latency time slice (slice request) and $w_i$ is the task's weight (nice value). Short-slice interactive tasks obtain earlier deadlines, pre-empting long-slice batch processes instantly!
4. **Cgroups v2 Unified Hierarchy**: Cgroups v2 replaces the fragmented, multi-hierarchy architecture of Cgroups v1 with a single unified tree. Resource limits (`cpu.max`, `memory.max`, `io.max`) are enforced at process group boundaries. Hard quota enforcement (`cpu.max = 50000 100000`) throttles containers exceeding their allotted $50\text{ms}$ per $100\text{ms}$ period.

---

## Python Implementation: EEVDF Scheduler & Cgroup Quota Simulator

Here is a production-grade Python implementation of an EEVDF CPU Process Scheduler and Cgroups v2 Quota Controller Simulator:

```python
from typing import List, Dict, Optional
from pydantic import BaseModel

class EEVDFTask(BaseModel):
    name: str
    weight: float        # Nice weight (e.g. 1.0 = Normal, 2.0 = High Priority)
    requested_slice: float # Requested time slice latency q (ms)
    vruntime: float = 0.0
    lag: float = 0.0
    virtual_deadline: float = 0.0
    cpu_used_total: float = 0.0

class CgroupV2CpuController:
    """
    Simulates Cgroups v2 cpu.max Hard Quota Enforcement.
    """
    def __init__(self, quota_ms: float, period_ms: float = 100.0):
        self.quota_ms = quota_ms
        self.period_ms = period_ms
        self.used_in_period = 0.0

    def check_throttled(self, requested_ms: float) -> bool:
        if self.used_in_period + requested_ms > self.quota_ms:
            return True  # THROTTLED!
        return False

    def consume(self, ms: float):
        self.used_in_period += ms

    def reset_period(self):
        self.used_in_period = 0.0

class EEVDFSchedulerEngine:
    """
    Simulates Linux Kernel 6.6+ EEVDF CPU Process Scheduler.
    """
    def __init__(self):
        self.tasks: List[EEVDFTask] = []
        self.system_virtual_time = 0.0

    def add_task(self, task: EEVDFTask):
        self.tasks.append(task)

    def schedule_next_task(self, cgroup: CgroupV2CpuController) -> Optional[EEVDFTask]:
        if not self.tasks:
            return None

        # 1. Update Lags & Virtual Deadlines for all tasks
        eligible_tasks = []
        print(f"\n ⚙️ [EEVDF Scheduler] System Virtual Time V = {self.system_virtual_time:.2f} ms")

        for t in self.tasks:
            t.lag = self.system_virtual_time - t.vruntime
            t.virtual_deadline = t.vruntime + (t.requested_slice / t.weight)
            
            is_eligible = t.lag >= 0.0
            eligible_str = "Eligible" if is_eligible else "INELIGIBLE"
            print(f"   • Task '{t.name:18s}' | Lag: {t.lag:6.2f} | Deadline: {t.virtual_deadline:6.2f} | [{eligible_str}]")

            if is_eligible:
                eligible_tasks.append(t)

        if not eligible_tasks:
            print(" ⚠️ No eligible tasks! Advancing System Virtual Time V...")
            self.system_virtual_time += 1.0
            return self.schedule_next_task(cgroup)

        # 2. Pick Eligible Task with EARLIEST Virtual Deadline
        eligible_tasks.sort(key=lambda x: x.virtual_deadline)
        selected = eligible_tasks[0]

        # 3. Check Cgroups v2 Quota Throttling
        if cgroup.check_throttled(selected.requested_slice):
            print(f" 🚫 [Cgroups v2 Throttled] Task '{selected.name}' exceeded quota ({cgroup.used_in_period}/{cgroup.quota_ms} ms)!")
            return None

        # 4. Dispatch CPU Time Slice
        slice_executed = selected.requested_slice
        cgroup.consume(slice_executed)
        selected.vruntime += (slice_executed / selected.weight)
        selected.cpu_used_total += slice_executed
        
        # Advance System Virtual Time V
        total_weight = sum(t.weight for t in self.tasks)
        self.system_virtual_time += (slice_executed / total_weight)

        print(f" ⚡ [CPU Execution] Dispatched CPU to Task '{selected.name}' for {slice_executed:.1f}ms slice!")
        return selected

# Demonstration Execution
if __name__ == "__main__":
    scheduler = EEVDFSchedulerEngine()
    cgroup = CgroupV2CpuController(quota_ms=30.0, period_ms=100.0) # 30ms quota per 100ms

    # Add 2 Tasks: Batch Task vs Interactive API Task
    scheduler.add_task(EEVDFTask(name="Batch-Worker", weight=1.0, requested_slice=10.0))
    scheduler.add_task(EEVDFTask(name="Interactive-API", weight=1.0, requested_slice=2.0)) # Short slice -> Earlier deadline!

    print("🚀 Demonstrating Linux Kernel EEVDF Scheduler & Cgroups v2...")
    print("=" * 75)

    # Simulate 4 Scheduling Cycles
    for cycle in range(1, 5):
        print(f"\n--- Cycle #{cycle} ---")
        scheduled = scheduler.schedule_next_task(cgroup)

    print(f"\n📊 Cgroups v2 Quota Usage: {cgroup.used_in_period}/{cgroup.quota_ms} ms consumed.")
```

---

## Scheduler & Cgroup Gotchas & Best Practices

When configuring Linux process scheduling:

> [!IMPORTANT]
> **Use Cgroups v2 Single Hierarchy Exclusively**: Docker and Kubernetes environments should disable Cgroups v1 legacy controllers (`systemd.unified_cgroup_hierarchy=1`). Cgroups v2 eliminates deadlock conditions and memory accounting leaks present in v1.

> [!CAUTION]
> **Beware of Severe CPU Throttling Spikes**: Setting overly restrictive `cpu.max` limits (e.g., $10\text{ms}$ quota per $100\text{ms}$ period) causes container processes to be throttled for the remaining $90\text{ms}$ of every period, spiking p99 API latencies to over $100\text{ms}$. Use **CPU Burst** (`cpu.cfs_burst_us`) to absorb short traffic spikes.

---

## Real-World Enterprise Impact
Upgrading to Linux kernel 6.6+ EEVDF and Cgroups v2 (such as **Fedora**, **Ubuntu 24.04**, and **AWS Bottlerocket**) reports:
* **Over 50% Reduction in Tail Latency for Interactive Services**: Earliest Virtual Deadline sorting allows audio, video, and HTTP API workloads to pre-empt batch background processing instantly.
* **Deterministic Container Resource Isolation**: Cgroups v2 memory and CPU controllers prevent noisy neighbor containers from crashing co-located mission-critical services.
