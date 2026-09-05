# Consistent Hashing Algorithms: Jump Consistent Hash & Maglev Hash Routers

In large-scale distributed caching clusters (**Memcached**, **Redis Cluster**, **DynamoDB**, **Cassandra**), horizontal scaling requires partitioning millions of keys across hundreds of cache storage nodes.

If a cluster uses naive **Modulo Hashing** ($\text{node} = \text{hash}(\text{key}) \pmod N$), adding or removing a single cache node changes $N → N+1$.

This causes over **99% of all existing keys to remap to different nodes**, completely wiping out cluster cache hit rates and triggering massive database outages.

To solve key migration during cluster resizing, modern distributed routers utilize **Consistent Hashing**.

Pioneered by Karger et al. (Ring Hashing) and advanced by Google (**Jump Consistent Hash** and **Maglev Lookup Tables**), consistent hashing guarantees that scaling a cluster from $N$ to $N+1$ nodes remaps strictly $\frac{1}{N+1}$ of keys.

This article details Hash Rings with Virtual Nodes, Google's $O(1)$ memory Jump Hash, and Maglev load balancing lookup tables.

---

## Consistent Hashing & Maglev Router Architecture

How Hash Rings with Virtual Nodes and Google Jump Consistent Hash route keys to cluster nodes:

```mermaid
graph TD
  subgraph Ring-Based Consistent Hashing (2^32 Hash Space)
    Ring[Hash Ring: 0 .. 2^32-1] --> NodeA_v1[Node A - Vnode 1: Hash 1000]
    Ring --> NodeB_v1[Node B - Vnode 1: Hash 5000]
    Ring --> NodeA_v2[Node A - Vnode 2: Hash 9000]
    
    KeyHash["Key 'user_101' Hash = 4200"] -->|Walk Clockwise on Ring| NodeB_v1
  end
  
  subgraph Google Jump Consistent Hash (Zero Memory Storage)
    KeyID[64-Bit Key Hash] --> JumpAlgo[Jump Hash Loop: b = -1, j = 0]
    JumpAlgo -->|Pseudo-Random Probability Jumps| BucketResult[Calculated Target Bucket Index in O(ln N) Time!]
  end
```

### Core Consistent Hashing Algorithms
1. **Ring-Based Consistent Hashing (Karger et al.)**:
   * Hashes both cache nodes and data keys into a shared 32-bit circular space ($0$ to $2^{32}-1$).
   * A key is assigned to the first node whose position on the ring is greater than or equal to the key's hash position (walking clockwise).
   * **Virtual Nodes (Vnodes)**: To prevent hot spots caused by non-uniform node placement, each physical server is mapped to $256$ virtual positions on the ring (`nodeA#1`, `nodeA#2`, ..., `nodeA#256`).
2. **Google Jump Consistent Hash (Lamping & Veach)**:
   * Standard hash rings require storing millions of virtual nodes in memory ($O(N)$ space complexity) and executing binary searches ($O(\log N)$ time).
   * **Jump Consistent Hash** requires **zero memory storage ($O(1)$ space)** and computes target bucket assignments in $O(\ln N)$ time.
   * *Algorithm Logic*: Uses a pseudo-random number generator seeded by key hash to compute probabilistic "jumps" to higher bucket indices $j = \lfloor (b+1) / \text{random}() \rfloor$.
3. **Google Maglev Hash Routers**:
   * Used in Google's Maglev software load balancer to distribute packet streams across backend nodes.
   * Builds a fixed-size **Lookup Table** of size $M$ (where $M$ is a prime number much larger than node count $N$).
   * Each backend node generates a deterministic permutation array of lookup table slots. The table is filled iteratively from node permutations, achieving near-perfect load balance and minimal key movement during node churn.

---

## Python Implementation: Consistent Hash Ring & Google Jump Hash

Here is a production-grade Python implementation of Ring-Based Consistent Hashing (with Virtual Nodes) and Google Jump Consistent Hash:

```python
import hashlib
import bisect
from typing import Dict, List, Optional

class RingConsistentHash:
    """
    Simulates Classic Ring-Based Consistent Hashing with Virtual Nodes.
    """
    def __init__(self, num_vnodes: int = 100):
        self.num_vnodes = num_vnodes
        self.ring: List[int] = []                    # Sorted list of vnode hashes
        self.vnode_map: Dict[int, str] = {}          # {vnode_hash: physical_node_id}

    def _hash(self, key: str) -> int:
        return int(hashlib.md5(key.encode()).hexdigest(), 16) & 0xFFFFFFFF

    def add_node(self, node_id: str):
        print(f" ➕ Adding Physical Node '{node_id}' with {self.num_vnodes} Virtual Nodes...")
        for i in range(self.num_vnodes):
            vnode_key = f"{node_id}#vnode_{i}"
            vnode_hash = self._hash(vnode_key)
            self.vnode_map[vnode_hash] = node_id
            bisect.insort(self.ring, vnode_hash)

    def remove_node(self, node_id: str):
        print(f" ➖ Removing Physical Node '{node_id}' from Ring...")
        for i in range(self.num_vnodes):
            vnode_key = f"{node_id}#vnode_{i}"
            vnode_hash = self._hash(vnode_key)
            if vnode_hash in self.vnode_map:
                del self.vnode_map[vnode_hash]
                idx = bisect.bisect_left(self.ring, vnode_hash)
                if idx < len(self.ring) and self.ring[idx] == vnode_hash:
                    self.ring.pop(idx)

    def get_node(self, key: str) -> Optional[str]:
        if not self.ring:
            return None

        key_hash = self._hash(key)
        # Find first vnode hash >= key_hash (Clockwise Walk)
        idx = bisect.bisect_right(self.ring, key_hash)
        if idx == len(self.ring):
            idx = 0  # Wrap around to start of ring

        vnode_hash = self.ring[idx]
        return self.vnode_map[vnode_hash]

class GoogleJumpConsistentHash:
    """
    Implements Google Lamping & Veach Jump Consistent Hash Algorithm.
    Fast O(ln N) time, O(1) memory complexity!
    """
    @staticmethod
    def get_bucket(key_hash: int, num_buckets: int) -> int:
        """
        Calculates target bucket index for a 64-bit key hash across num_buckets.
        """
        b = -1
        j = 0
        key = key_hash & 0xFFFFFFFFFFFFFFFF

        while j < num_buckets:
            b = j
            key = (key * 2862933555777941757 + 1) & 0xFFFFFFFFFFFFFFFF
            # Floating point conversion of upper bits
            fp = ((key >> 33) + 1) / (2**31)
            j = int((b + 1) / fp)

        return b

# Demonstration Execution
if __name__ == "__main__":
    # 1. Ring-Based Consistent Hash Test
    ring_router = RingConsistentHash(num_vnodes=50)
    ring_router.add_node("Cache-Server-A")
    ring_router.add_node("Cache-Server-B")
    ring_router.add_node("Cache-Server-C")

    print("🚀 Demonstrating Consistent Hashing Routing Engines...")
    print("=" * 75)

    test_keys = [f"user_session_{i}" for i in range(5)]
    print("\n1. Ring Hash Key Routing:")
    initial_mappings = {}
    for k in test_keys:
        target_node = ring_router.get_node(k)
        initial_mappings[k] = target_node
        print(f"   • Key '{k}' -> Routed to [{target_node}]")

    # Add 4th Node to Cluster
    print("\n2. Scaling Cluster (Adding 'Cache-Server-D'):")
    ring_router.add_node("Cache-Server-D")

    remapped_count = 0
    for k in test_keys:
        new_target = ring_router.get_node(k)
        if new_target != initial_mappings[k]:
            remapped_count += 1
            print(f"   • Key '{k}' REMAPPED: [{initial_mappings[k]}] -> [{new_target}]")
        else:
            print(f"   • Key '{k}' UNCHANGED: [{new_target}]")

    print(f"\n 📊 Minimal Remapping: Only {remapped_count}/{len(test_keys)} keys moved after adding node!")

    # 3. Google Jump Hash Test
    print("\n3. Google Jump Consistent Hash Routing (O(1) Memory):")
    sample_hash = int(hashlib.sha256(b"user_session_42").hexdigest(), 16)
    
    bucket_10 = GoogleJumpConsistentHash.get_bucket(sample_hash, num_buckets=10)
    bucket_11 = GoogleJumpConsistentHash.get_bucket(sample_hash, num_buckets=11)
    
    print(f"   • Jump Hash for Key across 10 Buckets: Target Bucket = #{bucket_10}")
    print(f"   • Jump Hash for Key across 11 Buckets: Target Bucket = #{bucket_11}")
```

---

## Consistent Hashing Gotchas & Best Practices

When engineering distributed hash routers:

> [!IMPORTANT]
> **Use Sufficient Virtual Nodes (100–256 Vnodes/Node)**: In ring-based consistent hashing, placing only 1 virtual node per physical server produces severe load imbalance (some servers receive $3\times$ more keys than others). Using $100$ to $256$ vnodes guarantees load variance under $5\%$.

> [!CAUTION]
> **Jump Hash Requires Sequential Integer Bucket IDs**: Google Jump Consistent Hash requires buckets to be numbered sequentially from $0$ to $N-1$. If your cluster uses named node strings or experiences arbitrary node removals from the middle of the bucket list, use **Maglev Consistent Hashing** or **Ring Hashing** instead.

---

## Real-World Enterprise Impact
Consistent hashing deployment (such as in **Amazon DynamoDB**, **Apache Cassandra**, and **Google Maglev routers**) reports:
* **Over 90% Remapping Reduction**: Adding a 10th node to a 9-node cluster remaps only $10\%$ of cached keys, keeping $90\%$ of cache entries active and preventing database load spikes.
* **$O(1)$ Memory Routing**: Jump Consistent Hash routes billions of network requests using 0 bytes of hash ring memory storage.
