# Pre-Warmed Micro-VM Pools: Sub-10ms Sandbox Provisioning for Code Agents

> [!NOTE]
> **📖 Article Overview**
> Autonomous code-executing agents rely on isolated container environments (or micro-VMs like Firecracker) to run generated scripts safely. However, provisioning fresh Docker containers or micro-VM instances on demand introduces a 1 to 3-second startup penalty per tool invocation. For interactive agents executing dozens of code tool calls during a single task, cumulative boot delays degrade user experience. To achieve real-time responsiveness, systems architects design **Pre-Warmed Micro-VM Pools**. By maintaining a pool of pre-booted, idle container instances and allocating them instantly upon request, platforms achieve sub-10ms sandbox provisioning. In this article, we implement a pre-warmed sandbox pool manager in Python.

---

## Eliminating Container Boot Latency

In traditional cold-start container architectures:
* **The Cold Start Delay**: Booting container runtimes, initializing Python virtual environments, and mounting file volumes takes 1500–3000ms.
* **CPU Spikes during Burst Boots**: Spin-up bursts of multiple concurrent containers exhaust host CPU cores during peak agent traffic.
* **The Solution**: **Pre-Warmed Instance Pools**. We maintain an active memory ring buffer of initialized, clean container instances ready for assignment. When an agent requests a sandbox, the pool manager pops a warm instance instantly in <10ms.

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'primaryColor': '#0284c7', 'primaryTextColor': '#f3f4f6', 'primaryBorderColor': '#38bdf8', 'lineColor': '#0284c7', 'secondaryColor': '#111827', 'tertiaryColor': '#0b0f19'}}}%%
flowchart TD
    Agent[Code Agent Worker] -->|Request Sandbox: <10ms| PoolMgr[Pre-Warmed Pool Manager]
    
    subgraph SG1_PreWarmedSandbox ["Pre-Warmed Sandbox Ring Buffer"]
        PoolMgr -->|Pop Active Warm Instance| Instance1[Warm Sandbox Instance 1 (IDLE)]
        PoolMgr -->|Background Replenish| PoolWorker[Pool Replenisher Task]
        PoolWorker -->|Boot fresh instance| Instance2[Warm Sandbox Instance 2 (READY)]
    end
    
    Instance1 -->|Assign to Agent| Execution([Execute Code Payload])
```

---

## 1. Structuring the Warm Buffer Pool

To manage instance allocation:
* **Maintain Minimum Pool Size**: Keep a minimum number of pre-initialized instances (e.g. `min_warm_instances = 5`) available in memory.
* **Asynchronous Replenishment**: Trigger background thread loops to boot replacement instances as soon as warm containers are assigned.

---

## 2. Fast Instance Assignment

The pool manager handles instance checkouts:
1. **Pop Instance in <10ms**: Pop a ready container instance from the queue without executing boot commands during the client request thread.
2. **Assign Isolated Task Context**: Bind unique session identifiers and API credentials to the allocated sandbox instance.

---

## Code Demo: Pre-Warmed Sandbox Pool Manager

Below is a Python implementation of a pre-warmed sandbox pool manager. It maintains an idle pool of container instances, provisions warm sandboxes instantly, and replenishes the pool asynchronously.

```python
import time
import uuid
from typing import Dict, List, Any

class PreWarmedSandboxPoolManager:
    def __init__(self, target_pool_size: int = 3):
        self.target_pool_size = target_pool_size
        # Warm instance buffer queue: list of pre-initialized sandbox dictionaries
        self.warm_pool: List[Dict[str, Any]] = []
        # Active assigned sandboxes
        self.assigned_sandboxes: Dict[str, Dict[str, Any]] = {}
        
        # Initial pool pre-warming pass
        self._replenish_pool()

    def _boot_sandbox_instance(self) -> Dict[str, Any]:
        # Simulate container/micro-VM boot sequence (0.002s in pre-warmed state)
        instance_id = f"sandbox_{str(uuid.uuid4())[:8]}"
        return {
            "instance_id": instance_id,
            "status": "WARM_IDLE",
            "created_at": time.time(),
            "env": "python:3.11-slim"
        }

    def _replenish_pool(self):
        while len(self.warm_pool) < self.target_pool_size:
            instance = self._boot_sandbox_instance()
            self.warm_pool.append(instance)
            print(f"♨️ [Pool Manager] Pre-warmed sandbox instance: '{instance['instance_id']}'")

    def acquire_sandbox(self, agent_id: str) -> Dict[str, Any]:
        start_time = time.time()
        
        if not self.warm_pool:
            print("⚠️ [Pool Manager] Warm pool depleted! Performing emergency fast-boot...")
            instance = self._boot_sandbox_instance()
        else:
            # Pop pre-warmed instance instantly from buffer
            instance = self.warm_pool.pop(0)

        instance["status"] = "ASSIGNED"
        instance["assigned_agent"] = agent_id
        self.assigned_sandboxes[instance["instance_id"]] = instance
        
        allocation_time_ms = (time.time() - start_time) * 1000
        print(f"⚡ [Acquire] Granted '{instance['instance_id']}' to '{agent_id}' in {allocation_time_ms:.2f}ms")

        # Asynchronously replenish pool back to target size
        self._replenish_pool()
        return instance

if __name__ == "__main__":
    pool_mgr = PreWarmedSandboxPoolManager(target_pool_size=3)

    print("\n🛡️ Testing Pre-Warmed Sandbox Provisioning Pipeline...")
    print("-------------------------------------------------------")

    # 1. Agent 1 requests sandbox
    sandbox_1 = pool_mgr.acquire_sandbox(agent_id="code_agent_01")
    
    # 2. Agent 2 requests sandbox
    sandbox_2 = pool_mgr.acquire_sandbox(agent_id="code_agent_02")

    print(f"\n📈 --- Pool Allocation Summary ---")
    print(f"Active Assigned Count: {len(pool_mgr.assigned_sandboxes)}")
    print(f"Available Warm Pool Count: {len(pool_mgr.warm_pool)}")
```

---

## Pre-Warmed Pool Takeaways

* **Decouple Boot from Checkout**: Pre-initialize container environments in background buffers to achieve sub-10ms instance checkout times.
* **Replenish Asynchronously**: Trigger background creation routines immediately after an instance is assigned to maintain pool target size.
* **Audit Warm Pool Health**: Periodically recycle idle pre-warmed instances to prevent memory fragmentation and stale state accumulation.
