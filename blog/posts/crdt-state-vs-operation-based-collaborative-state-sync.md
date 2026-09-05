# Conflict-Free Replicated Data Types (CRDTs): State-Based vs Operation-Based CRDTs & Collaborative Real-Time State Sync

In modern local-first and collaborative applications (**Figma**, **Notion**, **Linear**, **Apple Notes**, **Yjs**, **Automerge**), users edit documents concurrently across web browsers, desktop apps, and offline mobile devices.

Building real-time collaborative software using traditional central locking leads to unresponsive UI lag and data loss when clients lose internet connectivity.

While **Operational Transformation (OT)** (used in legacy Google Docs) required a centralized server to order edit operations, modern decentralized systems rely on **Conflict-Free Replicated Data Types (CRDTs)**.

By structuring data structures around **Bounded Semi-Lattice Mathematics**, CRDTs allow peer-to-peer nodes to mutate local state independently and merge concurrent edits deterministically without a central server.

This article details State-based (CvRDT) semi-lattices, Operation-based (CmRDT) causal broadcasts, LWW-Element-Set resolution, PN-Counters, and collaborative sequence editing.

---

## CRDT Architecture & Bounded Semi-Lattice Merging

How State-Based CRDTs (CvRDT) use mathematical join semi-lattices to achieve deterministic convergence:

```mermaid
graph TD
  subgraph Peer-to-Peer Concurrent Edits
    PeerA[Client A: Increments Counter +5] --> StateA["Local State A: {P: [5, 0], N: [0, 0]}"]
    PeerB[Client B: Decrements Counter -2] --> StateB["Local State B: {P: [0, 0], N: [0, 2]}"]
  end
  
  subgraph Network Sync & Semi-Lattice Join Merge (⊔)
    StateA & StateB -->|Transmit Full State over Network| MergeEngine["CvRDT Monotonic Merge Function (⊔)"]
  end
  
  subgraph Deterministic Convergence
    MergeEngine -->|Max Vector Compute| ConvergedState["Merged State: {P: [5, 0], N: [0, 2]} -> Final Value = +3"]
    ConvergedState -->|Zero Central Server!| PeerA & PeerB
  end
```

### Core CRDT Mathematical Mechanics
1. **State-Based CRDTs (CvRDT - Convergent Replicated Data Types)**:
   * Replicas synchronize by periodically transmitting their full local state payloads to peer nodes over the network.
   * **Bounded Semi-Lattice Algebra**: For any two replica states $A$ and $B$, the merge function $\sqcup$ (Least Upper Bound / Join) must satisfy three mathematical properties:
     * **Commutativity**: $A \sqcup B = B \sqcup A$ (Order of receipt does not matter).
     * **Associativity**: $(A \sqcup B) \sqcup C = A \sqcup (B \sqcup C)$ (Grouping of messages does not matter).
     * **Idempotency**: $A \sqcup A = A$ (Duplicate messages have zero side-effects).
   * *Guarantee*: Even if network packets arrive out-of-order or duplicate, all peer nodes converge to the exact same state deterministically!
2. **Operation-Based CRDTs (CmRDT - Commutative Replicated Data Types)**:
   * Replicas synchronize by transmitting micro-operation payloads (e.g. `insert(pos=4.5, char='X')`) over the network.
   * Requires significantly lower network bandwidth than CvRDTs, but requires an underlying **Causal Broadcast Middleware** (guaranteeing that dependent operations arrive before child operations).
3. **Common CRDT Data Structures**:
   * **PN-Counter (Positive-Negative Counter)**: Maintains two vector clocks per node: $P$ (tracks increments) and $N$ (tracks decrements). Merging computes element-wise maximums:
     $$P_{\text{merged}}[i] = \max(P_A[i], P_B[i]), \quad N_{\text{merged}}[i] = \max(N_A[i], N_B[i])$$
   * **LWW-Element-Set (Last-Write-Wins Element Set)**: Manages dynamic sets (adding/removing items). Uses physical or Hybrid Logical Clock (HLC) timestamps to resolve conflicts when an element is added and deleted concurrently.
   * **Sequence CRDTs (RGA / YATA / Fractional Indexing)**: Used in real-time collaborative text editors (Yjs / Automerge) to insert characters into ordered lists without index displacement collisions.

---

## Python Implementation: State-Based (CvRDT) PN-Counter & LWW-Set Engine

Here is a production-grade Python implementation of a State-Based (CvRDT) PN-Counter and LWW-Element-Set Engine Simulator:

```python
import time
from typing import Dict, Set, Tuple
from pydantic import BaseModel

class LWWSetItem(BaseModel):
    value: str
    timestamp: float

class CvRDTStateEngine:
    """
    Simulates State-Based (CvRDT) PN-Counter & LWW-Element-Set.
    Demonstrates Bounded Semi-Lattice Monotonic Merging (Commutative, Associative, Idempotent).
    """
    def __init__(self, node_id: str):
        self.node_id = node_id
        # PN-Counter State: { node_id -> positive_count }, { node_id -> negative_count }
        self.p_vector: Dict[str, int] = {}
        self.n_vector: Dict[str, int] = {}
        # LWW-Element-Set: add_set { val -> LWWSetItem }, remove_set { val -> LWWSetItem }
        self.add_set: Dict[str, LWWSetItem] = {}
        self.remove_set: Dict[str, LWWSetItem] = {}

    def increment(self, val: int = 1):
        self.p_vector[self.node_id] = self.p_vector.get(self.node_id, 0) + val
        print(f" ➕ [{self.node_id}] Incremented PN-Counter by +{val}")

    def decrement(self, val: int = 1):
        self.n_vector[self.node_id] = self.n_vector.get(self.node_id, 0) + val
        print(f" ➖ [{self.node_id}] Decremented PN-Counter by -{val}")

    def value_pn_counter(self) -> int:
        total_p = sum(self.p_vector.values())
        total_n = sum(self.n_vector.values())
        return total_p - total_n

    def lww_add_element(self, element: str):
        item = LWWSetItem(value=element, timestamp=time.time())
        self.add_set[element] = item
        print(f" 📥 [{self.node_id}] LWW-Set Added '{element}' at t={item.timestamp:.4f}")

    def lww_remove_element(self, element: str):
        item = LWWSetItem(value=element, timestamp=time.time())
        self.remove_set[element] = item
        print(f" 🗑️ [{self.node_id}] LWW-Set Removed '{element}' at t={item.timestamp:.4f}")

    def get_lww_set_values(self) -> Set[str]:
        """Resolves LWW-Element-Set membership (Add ts >= Remove ts)."""
        active = set()
        all_keys = set(self.add_set.keys()) | set(self.remove_set.keys())
        for k in all_keys:
            add_ts = self.add_set[k].timestamp if k in self.add_set else -1.0
            rem_ts = self.remove_set[k].timestamp if k in self.remove_set else -1.0
            if add_ts >= rem_ts and add_ts > 0:
                active.add(k)
        return active

    def merge_state(self, remote_engine: 'CvRDTStateEngine'):
        """
        CvRDT Monotonic Join Merge Function (⊔):
        Satisfies Commutativity, Associativity, Idempotency!
        """
        print(f"\n🔄 [CvRDT Semi-Lattice Merge ⊔] Merging Node '{remote_engine.node_id}' -> Node '{self.node_id}'...")

        # 1. Merge PN-Counter Vectors (Element-wise max)
        for nid, count in remote_engine.p_vector.items():
            self.p_vector[nid] = max(self.p_vector.get(nid, 0), count)
        for nid, count in remote_engine.n_vector.items():
            self.n_vector[nid] = max(self.n_vector.get(nid, 0), count)

        # 2. Merge LWW Add Set
        for k, remote_item in remote_engine.add_set.items():
            if k not in self.add_set or remote_item.timestamp > self.add_set[k].timestamp:
                self.add_set[k] = remote_item

        # 3. Merge LWW Remove Set
        for k, remote_item in remote_engine.remove_set.items():
            if k not in self.remove_set or remote_item.timestamp > self.remove_set[k].timestamp:
                self.remove_set[k] = remote_item

        print(" ✅ [Merge Complete] States Converged Monotonically!")

# Demonstration Execution
if __name__ == "__main__":
    node_a = CvRDTStateEngine(node_id="client_node_A")
    node_b = CvRDTStateEngine(node_id="client_node_B")

    print("🚀 Demonstrating State-Based CRDT (CvRDT) Monotonic Join Merging...")
    print("=" * 75)

    # 1. Concurrent Edits on Node A & Node B (Offline)
    node_a.increment(val=10)
    node_a.lww_add_element("document_title.docx")

    node_b.decrement(val=3)
    node_b.lww_add_element("document_title.docx")
    time.sleep(0.01)
    node_b.lww_remove_element("document_title.docx") # Deletes file slightly later

    print(f"\n📊 Pre-Merge Node A PN-Counter Value: {node_a.value_pn_counter()}")
    print(f"📊 Pre-Merge Node B PN-Counter Value: {node_b.value_pn_counter()}")

    # 2. Transmit State & Execute CvRDT Join Merge (⊔)
    node_a.merge_state(node_b)

    # 3. Verify Deterministic Convergence
    print(f"\n 🎉 Converged PN-Counter Value: {node_a.value_pn_counter()} (10 - 3 = 7)")
    print(f" 🎉 Converged LWW-Set Active Items: {node_a.get_lww_set_values()} (Correctly Deleted via LWW!)")
```

---

## CRDT Gotchas & Best Practices

When building collaborative local-first applications:

> [!IMPORTANT]
> **Use Fractional Indexing or Sequence CRDTs (Yjs / Automerge) for Collaborative Text**: Never attempt to build text editors with simple array indices. Use fractional indexing or Yjs YATA structures to maintain deterministic character insertion order without string offset collisions.

> [!CAUTION]
> **Beware of CvRDT State Payload Memory Garbage Collection**: State-Based CRDTs grow monotonically as items are added and deleted (retaining tombstones). Periodically compact tombstone entries using stable vector clock garbage collection to prevent memory bloat.

---

## Real-World Enterprise Impact
Conflict-Free Replicated Data Types (in **Figma**, **Notion**, **Linear**, **Apple Notes**, and **Redis CRDTs**) report:
* **$100\%$ Offline Availability**: Peer-to-peer clients mutate local state instantly without waiting for network round-trips or central server lock approvals.
* **Deterministic Real-Time Sync Convergence**: Bounded semi-lattice join operations guarantee zero data loss during multi-user concurrent document edits.
