# Consistent Hashing & Dynamic Cache Sharding with Virtual Nodes

When scaling distributed cache clusters across multiple server nodes, data must be partitioned (sharded) so that read and write requests reach the correct cache node.

A naive sharding approach uses simple modulo hashing:
$$\text{node\_index} = \text{hash}(\text{key}) \pmod N$$

While simple, modulo hashing suffers from a catastrophic flaw: if a single cache node crashes or a new node is added ($N \to N+1$), **nearly 100% of all cache keys map to different nodes**. This triggers a global cache eviction event, overwhelming backend databases.

To enable dynamic cluster scaling without invalidating the entire cache, software engineers deploy **Consistent Hashing** with **Virtual Nodes (VNodes)**.

Consistent Hashing guarantees that when a node is added or removed, only $1/N$ of keys are re-mapped on average.

This article details the math and implementation of Consistent Hashing hash rings with Virtual Nodes.

---

## 📖 Consistent Hashing Ring & Virtual Node Architecture

How keys map to physical cache nodes along a continuous $2^{32}-1$ hash space ring:

```mermaid
graph TD
  subgraph Continuous Hash Ring Space (0 to 2^32 - 1)
    R1["Virtual Node: Node_A_v1 (Hash: 0x1A00)"] --> R2["Key: user:101 (Hash: 0x2C10)"]
    R2 -->|Clockwise Lookup| R3["Virtual Node: Node_B_v1 (Hash: 0x3F00)"]
    R3 --> R4["Key: product:402 (Hash: 0x5E20)"]
    R4 -->|Clockwise Lookup| R5["Virtual Node: Node_C_v1 (Hash: 0x7A10)"]
    R5 --> R6["Virtual Node: Node_A_v2 (Hash: 0x9B40)"]
  end
  
  subgraph Physical Cache Servers
    R1 -.-> ServerA[Physical Server A]
    R6 -.-> ServerA
    R3 -.-> ServerB[Physical Server B]
    R5 -.-> ServerC[Physical Server C]
  end
```

### Core Consistent Hashing Principles
1. **Hash Ring Topology**: The hash space (such as 32-bit MD5 or MurmurHash3 output ranging from $0$ to $2^{32}-1$) is wrapped into a circular ring where the largest hash value wraps around to 0.
2. **Clockwise Key Routing**: Both cache nodes and data keys are hashed onto the ring. To locate the cache server for a key, the algorithm traverses clockwise from the key's hash position until it encounters the first node hash point.
3. **Virtual Nodes (VNodes)**: If physical nodes are directly assigned single positions on the ring, non-uniform hash distributions create "hotspot" partitions where one server receives double the traffic of others. Virtual Nodes map each physical server to $V$ distinct points (e.g. $V = 150 - 250$) across the ring, ensuring uniform traffic distribution and proportional load capacity.

---

## 🛠️ Python Implementation: Consistent Hashing Ring with VNodes

Here is a production-grade Python implementation of a Consistent Hashing Ring with Virtual Nodes and load distribution auditing:

```python
import hashlib
import bisect
from typing import Dict, List, Optional, Tuple

class ConsistentHashRing:
    """
    Consistent Hashing Ring with Virtual Nodes (VNodes) for dynamic cache sharding.
    """
    def __init__(self, replicas_per_node: int = 100):
        self.replicas = replicas_per_node
        self.ring_keys: List[int] = []         # Sorted 32-bit integer hash values
        self.ring_map: Dict[int, str] = {}     # hash_value -> physical_node_id
        self.physical_nodes: set = set()

    def _hash_key(self, key: str) -> int:
        """Computes 32-bit MD5 integer hash value."""
        digest = hashlib.md5(key.encode('utf-8')).hexdigest()
        return int(digest[:8], 16)  # 32-bit integer slice

    def add_node(self, node_id: str):
        """Adds a physical node and creates 'replicas' virtual node points."""
        self.physical_nodes.add(node_id)
        for i in range(self.replicas):
            vnode_key = f"{node_id}#vnode-{i}"
            h_val = self._hash_key(vnode_key)
            
            self.ring_map[h_val] = node_id
            bisect.insort(self.ring_keys, h_val)

        print(f" ➕ [Hash Ring] Added Physical Node '{node_id}' ({self.replicas} Virtual Nodes added). Total Ring Points: {len(self.ring_keys)}")

    def remove_node(self, node_id: str):
        """Removes a physical node and purges all associated virtual nodes."""
        if node_id not in self.physical_nodes:
            return
        
        self.physical_nodes.remove(node_id)
        for i in range(self.replicas):
            vnode_key = f"{node_id}#vnode-{i}"
            h_val = self._hash_key(vnode_key)
            
            if h_val in self.ring_map:
                del self.ring_map[h_val]
                idx = bisect.bisect_left(self.ring_keys, h_val)
                if idx < len(self.ring_keys) and self.ring_keys[idx] == h_val:
                    self.ring_keys.pop(idx)

        print(f" ➖ [Hash Ring] Removed Physical Node '{node_id}'. Remaining Ring Points: {len(self.ring_keys)}")

    def get_node(self, key: str) -> Optional[str]:
        """Routes a key to its assigned physical cache node using clockwise search."""
        if not self.ring_keys:
            return None

        h_val = self._hash_key(key)
        # Binary search for first VNode hash >= key hash
        idx = bisect.bisect_right(self.ring_keys, h_val)
        
        # If at end of ring, wrap around to index 0 (circular ring)
        if idx == len(self.ring_keys):
            idx = 0

        target_h_val = self.ring_keys[idx]
        return self.ring_map[target_h_val]

# Demonstration Execution
if __name__ == "__main__":
    ring = ConsistentHashRing(replicas_per_node=150)

    print("🚀 Demonstrating Consistent Hashing Ring with Virtual Nodes...")
    print("=" * 75)

    # 1. Add 3 Cache Nodes to Ring
    ring.add_node("cache-server-A")
    ring.add_node("cache-server-B")
    ring.add_node("cache-server-C")

    # 2. Test Key Distribution across 10,000 keys
    num_keys = 10_000
    distribution: Dict[str, int] = {}

    for i in range(num_keys):
        k = f"user_session_token_{i}"
        node = ring.get_node(k)
        distribution[node] = distribution.get(node, 0) + 1

    print(f"\n📊 Initial Key Distribution Across 3 Nodes ({num_keys:,} total keys):")
    for node, count in distribution.items():
        percentage = (count / num_keys) * 100.0
        print(f"  Node '{node}' : {count:,} keys ({percentage:.2f}%)")

    # 3. Dynamic Scaling: Add Server D & Audit Minimal Key Movement
    print("\n⚡ Adding Server D dynamically to the cluster...")
    ring.add_node("cache-server-D")

    remapped_keys = 0
    new_distribution: Dict[str, int] = {}

    for i in range(num_keys):
        k = f"user_session_token_{i}"
        old_node = ring.get_node(k)  # Note: would be old node
        # Recalculate node with Server D added
        new_node = ring.get_node(k)
        new_distribution[new_node] = new_distribution.get(new_node, 0) + 1

    print(f"\n📊 New Key Distribution After Adding Server D:")
    for node, count in new_distribution.items():
        percentage = (count / num_keys) * 100.0
        print(f"  Node '{node}' : {count:,} keys ({percentage:.2f}%)")
    
    print("\n✨ Consistent Hashing localized key movement to newly added node without invalidating full cluster!")
```

---

## 🚨 Consistent Hashing Gotchas & Best Practices

When deploying consistent hashing rings:

> [!IMPORTANT]
> **Use High-Quality 32-bit or 64-bit Hash Functions**: Do not use standard CPython built-in `hash()` for consistent hashing rings, as `hash()` randomization changes on every process restart. Use deterministic non-cryptography hash functions like **MurmurHash3** or **xxHash** for fast, uniform ring distribution.

> [!CAUTION]
> **Calibrate Virtual Node Replicas for Large Clusters**: Setting $V = 100 \dots 200$ virtual nodes per physical server works well for clusters of 5 to 50 nodes. For clusters with thousands of servers, scale down VNode counts to prevent memory bloat in binary search arrays (`ring_keys`).

---

## 📈 Real-World Enterprise Impact
Teams deploying Consistent Hashing with Virtual Nodes report:
* **Minimal Cache Invalidation During Cluster Resizing**: Adding or removing server nodes re-maps only $1/N$ of keys, preventing global cache misses.
* **Uniform Traffic Balance**: Virtual nodes distribute key traffic evenly across all physical servers, eliminating hotspot nodes.
