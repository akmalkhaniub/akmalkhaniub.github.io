# Multi-Raft Partitioning & Dynamic Group Rebalancing

A single Raft consensus group consists of $N$ nodes maintaining a single replicated log driven by a single Raft Leader.

While a single Raft group guarantees strong consistency, it creates a fundamental scalability bottleneck: **all write operations must pass through the single Raft Leader**. A single Raft leader cannot scale past the I/O and network bandwidth capacity of a single physical server (typically bottlenecked at $\approx 50,000$ transactions per second).

To scale distributed storage engines to petabytes of data and millions of transactions per second, modern distributed databases (**CockroachDB**, **TiKV**, **YugabyteDB**) utilize **Multi-Raft Architecture**.

Multi-Raft partitions the entire dataset into contiguous key ranges (called **Ranges** or **Shards**) and assigns each range to its own independent Raft consensus group.

This article details Multi-Raft architecture, range splitting, and dynamic replica rebalancing.

---

## 📖 Multi-Raft Architecture & Key-Range Routing Topology

How physical database nodes host hundreds of independent Raft consensus groups:

```mermaid
graph TD
  Client[Client SQL / KV Request] -->|1. Route Key 'user_88'| Router[Multi-Raft Range Router]
  
  Router -->|2. Key 'user_88' falls in Range 2 ['g', 'p')| Node1
  
  subgraph Physical Database Cluster (3 Nodes)
    subgraph Server Node 1
      R1_Leader[Range 1 Leader: 'a' - 'f']
      R2_Leader[Range 2 Leader: 'g' - 'p']
      R3_Follower[Range 3 Follower: 'q' - 'z']
    end
    
    subgraph Server Node 2
      R1_Follower[Range 1 Follower]
      R2_Follower2[Range 2 Follower]
      R3_Leader[Range 3 Leader]
    end
    
    subgraph Server Node 3
      R1_Follower2[Range 1 Follower]
      R2_Follower3[Range 2 Follower]
      R3_Follower2[Range 3 Follower]
    end
  end
  
  R2_Leader -->|3. AppendEntries to Raft Group 2| R2_Follower2 & R2_Follower3
```

### Core Multi-Raft Principles
1. **Contiguous Key-Range Partitioning**: Data is partitioned into ordered key ranges (e.g. Range 1: `["a", "f")`, Range 2: `["f", "m")`, Range 3: `["m", "z")`).
2. **Co-located Independent Raft Groups**: A single physical database server hosts multiple lightweight Raft state machine workers. Node 1 can act as the **Raft Leader** for Range 1 while simultaneously serving as a **Raft Follower** for Range 2 and Range 3.
3. **Automated Range Splitting**: When a Range grows beyond a size threshold (e.g., $64\text{ MB}$), the Range Leader executes a **Split Transaction**. The split command is logged to the Raft consensus log, partitioning the key range into two new independent Raft consensus groups (`Range 2a` and `Range 2b`).
4. **Dynamic Leader & Replica Rebalancing**: Background cluster orchestrators monitor CPU, memory, and disk usage across physical nodes. If Node 1 becomes a hotspot, the coordinator commands Range Leaders on Node 1 to execute **Leader Transfers** to under-utilized nodes in the cluster.

---

## 🛠️ Python Implementation: Multi-Raft Router & Range Split Engine

Here is a production-grade Python simulation of a Multi-Raft Range Router with automated Range Splitting and Leader Transfer balancing:

```python
import bisect
from typing import List, Dict, Optional, Tuple
from pydantic import BaseModel

class KeyRange(BaseModel):
    range_id: str
    start_key: str
    end_key: str
    raft_leader: str
    raft_followers: List[str]
    size_bytes: int = 0

class MultiRaftClusterRouter:
    """
    Simulates a Multi-Raft Range Router and Cluster Balancing Engine.
    """
    def __init__(self, physical_nodes: List[str]):
        self.physical_nodes = physical_nodes
        # Sorted boundary keys for binary search routing
        self.range_boundaries: List[str] = []
        # start_key -> KeyRange object
        self.ranges: Dict[str, KeyRange] = {}

    def initialize_initial_range(self, leader_node: str, follower_nodes: List[str]):
        """Creates the initial root Range covering the entire key space ["", chr(127))."""
        initial_range = KeyRange(
            range_id="range-1",
            start_key="",
            end_key=chr(127),
            raft_leader=leader_node,
            raft_followers=follower_nodes,
            size_bytes=0
        )
        self.ranges[""] = initial_range
        self.range_boundaries = [""]

    def route_key(self, key: str) -> KeyRange:
        """Routes any key to its governing Range via binary search O(log R)."""
        idx = bisect.bisect_right(self.range_boundaries, key) - 1
        start_k = self.range_boundaries[idx]
        return self.ranges[start_k]

    def write_key(self, key: str, value: str, payload_size: int = 100):
        target_range = self.route_key(key)
        print(f" 🔀 [Multi-Raft Router] Route '{key}' -> {target_range.range_id} [{target_range.start_key!r} - {target_range.end_key!r}) | Leader: {target_range.raft_leader}")

        # Simulate Range Growth
        target_range.size_bytes += payload_size

        # Check for Range Split Threshold (Simulated threshold: 300 bytes)
        if target_range.size_bytes >= 300:
            self._split_range(target_range, split_key=key)

    def _split_range(self, old_range: KeyRange, split_key: str):
        """Splits an overgrown Range into two independent Raft groups."""
        print(f"\n ✂️ [RANGE SPLIT] Overgrown {old_range.range_id} ({old_range.size_bytes} bytes). Splitting at key '{split_key}'...")

        # 1. Update Old Range boundary
        original_end = old_range.end_key
        old_range.end_key = split_key
        old_range.size_bytes = old_range.size_bytes // 2

        # 2. Create New Range for upper boundary
        new_range_id = f"range-{len(self.ranges) + 1}"
        new_range = KeyRange(
            range_id=new_range_id,
            start_key=split_key,
            end_key=original_end,
            raft_leader=self.physical_nodes[1 % len(self.physical_nodes)],  # Assign to node 2
            raft_followers=[self.physical_nodes[0], self.physical_nodes[2]],
            size_bytes=old_range.size_bytes
        )

        # 3. Register New Boundary in Router
        self.ranges[split_key] = new_range
        bisect.insort(self.range_boundaries, split_key)

        print(f"   ↳ {old_range.range_id} Updated: [{old_range.start_key!r} - {old_range.end_key!r})")
        print(f"   ↳ {new_range.range_id} Created: [{new_range.start_key!r} - {new_range.end_key!r}) | New Leader: {new_range.raft_leader}")

    def transfer_leader(self, range_id: str, new_leader: str):
        """Executes a Raft Leader Transfer to rebalance cluster load."""
        for start_k, r in self.ranges.items():
            if r.range_id == range_id:
                old_l = r.raft_leader
                r.raft_leader = new_leader
                print(f" 🔄 [Leader Transfer] {range_id}: Leader Transferred from {old_l} -> {new_leader}")
                return

# Demonstration Execution
if __name__ == "__main__":
    nodes = ["node-us-east-1", "node-us-east-2", "node-us-west-1"]
    cluster_router = MultiRaftClusterRouter(physical_nodes=nodes)
    cluster_router.initialize_initial_range(leader_node="node-us-east-1", follower_nodes=["node-us-east-2", "node-us-west-1"])

    print("🚀 Demonstrating Multi-Raft Range Partitioning & Splitting...")
    print("=" * 75)

    # 1. Ingest Keys into Multi-Raft Cluster
    keys_to_write = ["account_10", "customer_45", "customer_99", "order_200", "user_500"]

    for k in keys_to_write:
        cluster_router.write_key(key=k, value="sample_payload", payload_size=100)

    # 2. Perform Raft Leader Transfer for Load Balancing
    print("\n⚡ Rebalancing Cluster: Transferring Leadership for Range 2...")
    cluster_router.transfer_leader("range-2", new_leader="node-us-west-1")

    # 3. Verify Route Lookup after Splits
    print("\n🔍 Final Multi-Raft Route Lookups:")
    for k in ["account_10", "order_200"]:
        r = cluster_router.route_key(k)
        print(f"   • Key '{k}' -> {r.range_id} (Leader: {r.raft_leader})")
```

---

## 🚨 Multi-Raft Gotchas & Best Practices

When architecting Multi-Raft storage engines:

> [!IMPORTANT]
> **Enforce Co-located Atomic Range Splits**: A Range Split operation must be committed as a special internal entry inside the Range's own Raft log. This guarantees that all Followers in the Raft group execute the split atomically at the exact same log index.

> [!CAUTION]
> **Avoid Single-Node Hotspots with Hash Pre-partitioning**: If keys are inserted with monotonically increasing sequential IDs (`1, 2, 3, ...`), all new writes will hit the exact same tail Range, overwhelming a single Raft Leader. Use compound keys or hash prefixes (`hash(id)_id`) to distribute writes across distinct Raft groups.

---

## 📈 Real-World Enterprise Impact
Distributed databases utilizing Multi-Raft architecture (such as **TiKV** and **CockroachDB**) report:
* **Linear Horizontal Scalability**: Scaling write throughput linearly by adding physical server nodes, expanding beyond $1,000,000$ transactions per second.
* **Granular Failure Isolation**: A hardware crash on a single server node only impacts leadership for a fraction of ranges, which re-elect new leaders in under $300\text{ms}$ while the rest of the cluster operates uninterrupted.
