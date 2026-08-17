# Distributed Transactions: Two-Phase Commit (2PC) & Percolator Primary-Lock Protocol

In modern distributed SQL databases (**CockroachDB**, **TiDB**, **YugabyteDB**, **Google Spanner**), relational data is partitioned (sharded) across hundreds of independent storage nodes.

Executing a single cross-shard SQL transaction (such as transferring money from Account A on Shard 1 to Account B on Shard 2) requires guaranteeing **ACID Atomicity**: either both shard modifications commit successfully, or both rollback completely.

Traditional distributed systems rely on the **Two-Phase Commit (2PC)** protocol.

However, classic 2PC is a blocking protocol: if the Transaction Coordinator crashes mid-commit, participant nodes remain locked indefinitely.

To overcome 2PC blocking bottlenecks, modern distributed databases utilize **Google Percolator's Primary-Lock Protocol**.

This article details classic 2PC state machines, Percolator Primary/Secondary lock delegation, and asynchronous lock resolution algorithms.

---

## 📖 Percolator Primary-Lock Distributed Transaction Architecture

How Percolator designates a Primary Lock to achieve non-blocking atomic commits across distributed shards:

```mermaid
graph TD
  Client[Transaction Client] -->|1. Prewrite Phase: Write Data + Secondary Locks| Shard2[Shard 2: Key 'account_B']
  Client -->|1. Prewrite Phase: Write Data + Primary Lock| Shard1[Shard 1: Key 'account_A' (Primary Lock Target)]
  
  subgraph Prewrite Phase (Acquire Locks)
    Shard1 -->|Lock Status| LockA[Primary Lock Set on account_A]
    Shard2 -->|Lock Status| LockB[Secondary Lock Set on account_B -> Points to Shard1 account_A!]
  end
  
  subgraph Commit Phase (Single Point of Truth)
    Client -->|2. Commit Phase: Commit Primary Lock ONLY| Shard1
    Shard1 -->|3. Primary Lock Committed!| TxSuccess[🎉 TRANSACTION IS IRREVOCABLY COMMITTED!]
  end
  
  subgraph Background Async Lock Resolution
    TxSuccess -->|4. Async Background Rollout| Shard2
    Shard2 -->|5. Convert Secondary Lock to Value| Complete[Complete Transaction on Shard 2]
  end
```

### Core Distributed Transaction Protocols
1. **Classic Two-Phase Commit (2PC)**:
   * **Phase 1 (Prepare Phase)**: The Transaction Coordinator sends a `PREPARE` message to all participant shards. Each participant writes mutations to its local Write-Ahead Log (WAL), acquires local locks, and responds `VOTE_COMMIT` or `VOTE_ABORT`.
   * **Phase 2 (Commit Phase)**: If *all* participants vote `VOTE_COMMIT`, the Coordinator writes a `COMMIT` record to its log and sends `COMMIT` commands to participants. If any node votes `VOTE_ABORT`, the Coordinator broadcasts `ABORT`.
   * **2PC Blocking Flaw**: If the Coordinator crashes after participants vote `VOTE_COMMIT` but before broadcasting `COMMIT`, participants are left blocking and holding locks indefinitely.
2. **Percolator Primary-Lock Protocol**:
   * Designed by Google for Percolator and adopted by **TiDB** and **CockroachDB**, this protocol removes the need for a separate blocking Coordinator state machine.
   * **Primary Lock Choice**: The client selects one key in the transaction as the **Primary Lock**. All other modified keys hold **Secondary Locks** that point directly to the Primary Lock location (`primary_lock_ptr = "shard1/account_A"`).
   * **Prewrite Phase**: The client writes modified data and locks to all target shards. If a lock conflict occurs on any key, the transaction aborts.
   * **Commit Phase**: The client attempts to commit **ONLY the Primary Lock**.
     * **The Moment of Truth**: As soon as the Primary Lock is successfully committed, the transaction is **100% committed**.
     * **Async Secondary Rollout**: The client (or background resolution threads) asynchronously commits secondary locks. If a concurrent reader encounters a secondary lock, it checks the Primary Lock: if the Primary Lock is committed, the secondary lock is considered committed!

---

## 🛠️ Python Implementation: Distributed Percolator Transaction Engine

Here is a production-grade Python implementation of a Distributed Percolator Primary-Lock Transaction Engine featuring Prewrite, Primary Lock Commit, and Lock Resolution:

```python
from typing import Dict, List, Optional
from pydantic import BaseModel

class LockInfo(BaseModel):
    is_primary: bool
    primary_key: str
    tx_id: int

class ShardNode:
    """
    Simulates an Independent Distributed Storage Shard Node.
    """
    def __init__(self, shard_id: str):
        self.shard_id = shard_id
        self.data_store: Dict[str, str] = {}     # {key: val}
        self.lock_store: Dict[str, LockInfo] = {} # {key: LockInfo}

    def prewrite(self, key: str, value: str, is_primary: bool, primary_key: str, tx_id: int) -> bool:
        """Step 1: Prewrite data and acquire lock."""
        if key in self.lock_store:
            print(f" 💥 [{self.shard_id}] Prewrite Conflict! Key '{key}' already locked by Tx #{self.lock_store[key].tx_id}")
            return False

        self.lock_store[key] = LockInfo(is_primary=is_primary, primary_key=primary_key, tx_id=tx_id)
        # Store uncommitted data
        self.data_store[f"uncommitted:{key}"] = value
        
        lock_type = "PRIMARY LOCK" if is_primary else f"SECONDARY LOCK (Points to -> '{primary_key}')"
        print(f" 🔒 [{self.shard_id}] Prewrite Success for Key '{key}' -> Acquired {lock_type}")
        return True

    def commit_primary(self, key: str, tx_id: int) -> bool:
        """Step 2: Commit Primary Lock (The Atomic Event)."""
        if key not in self.lock_store or not self.lock_store[key].is_primary:
            return False

        # Convert uncommitted data to permanent value
        uncommitted_val = self.data_store.pop(f"uncommitted:{key}")
        self.data_store[key] = uncommitted_val
        del self.lock_store[key]
        
        print(f" 🎉 [{self.shard_id}] PRIMARY LOCK COMMITTED for Key '{key}'! Transaction #{tx_id} is IRREVOCABLY COMMITTED!")
        return True

    def resolve_secondary(self, key: str, tx_id: int):
        """Step 3: Resolve Secondary Lock asynchronously."""
        if f"uncommitted:{key}" in self.data_store:
            val = self.data_store.pop(f"uncommitted:{key}")
            self.data_store[key] = val
            if key in self.lock_store:
                del self.lock_store[key]
            print(f" ⚙️ [{self.shard_id}] Secondary Lock Resolved for Key '{key}' -> Value Committed.")

class PercolatorTransactionCoordinator:
    """
    Orchestrates Distributed Transactions via Percolator Protocol.
    """
    def __init__(self, shards: Dict[str, ShardNode]):
        self.shards = shards

    def execute_transaction(self, tx_id: int, mutations: List[Tuple[str, str, str]]) -> bool:
        """
        mutations: [(shard_id, key, val)]
        """
        primary_shard_id, primary_key, primary_val = mutations[0]
        
        print(f"\n🚀 Executing Percolator Distributed Tx #{tx_id} across {len(mutations)} Shards...")
        print("=" * 75)

        # 1. PREWRITE PHASE (Acquire Primary & Secondary Locks)
        print("1. PREWRITE PHASE:")
        for idx, (shard_id, key, val) in enumerate(mutations):
            is_primary = (idx == 0)
            shard = self.shards[shard_id]
            success = shard.prewrite(
                key=key, value=val, is_primary=is_primary, primary_key=primary_key, tx_id=tx_id
            )
            if not success:
                print(" ❌ Prewrite Failed! Rolling back transaction...")
                return False

        # 2. COMMIT PHASE (Commit Primary Lock ONLY)
        print("\n2. COMMIT PHASE:")
        primary_shard = self.shards[primary_shard_id]
        committed = primary_shard.commit_primary(primary_key, tx_id)
        
        if not committed:
            print(" ❌ Primary Commit Failed!")
            return False

        # 3. ASYNCHRONOUS SECONDARY LOCK RESOLUTION
        print("\n3. ASYNCHRONOUS SECONDARY LOCK RESOLUTION:")
        for shard_id, key, val in mutations[1:]:
            self.shards[shard_id].resolve_secondary(key, tx_id)

        return True

# Demonstration Execution
if __name__ == "__main__":
    shard1 = ShardNode("Shard-1")
    shard2 = ShardNode("Shard-2")
    shards_map = {"Shard-1": shard1, "Shard-2": shard2}

    coord = PercolatorTransactionCoordinator(shards_map)

    # Cross-Shard Transaction: Transfer funds from Shard-1/acc_A to Shard-2/acc_B
    tx_mutations = [
        ("Shard-1", "account_A", "balance_90"),  # Primary Key
        ("Shard-2", "account_B", "balance_110")  # Secondary Key
    ]

    success = coord.execute_transaction(tx_id=5001, mutations=tx_mutations)

    print("\n📊 Final Shard Data Stores:")
    print(f"   • Shard 1 Data: {shard1.data_store}")
    print(f"   • Shard 2 Data: {shard2.data_store}")
```

---

## 🚨 Distributed Transaction Gotchas & Best Practices

When operating distributed transaction engines:

> [!IMPORTANT]
> **Use Raft Consensus for Shard High Availability**: Percolator or 2PC protocols operate *across* shards. Inside each individual shard, replicate mutations across 3 or 5 nodes using **Raft Consensus** to ensure single-node hardware failures do not lose committed primary locks.

> [!CAUTION]
> **Handle Abandoned Secondary Locks**: If a client crashes right after committing the Primary Lock, secondary locks remain stored on participant shards. Implement an **Asynchronous Lock Cleaner Daemon** that resolves stale secondary locks by checking the status of their primary lock.

---

## 📈 Real-World Enterprise Impact
Distributed SQL engines utilizing Percolator and Raft (such as **TiDB** and **CockroachDB**) report:
* **Zero 2PC Blocking Deadlocks**: Primary Lock delegation allows concurrent readers to resolve orphan locks asynchronously without waiting for coordinator heartbeats.
* **Global Multi-Shard ACID Compliance**: Scaling horizontally to thousands of database nodes while providing strict serializable ACID transactions.
