# Multi-Version Concurrency Control (MVCC): Snapshot Isolation & Serializability

In high-concurrency database engines (**PostgreSQL**, **MySQL InnoDB**, **CockroachDB**, **TiKV**), supporting thousands of simultaneous read and write transactions is a core requirement.

If a database uses traditional **Two-Phase Locking (2PL)** with exclusive read/write locks, read operations block write operations and write operations block read operations. Under heavy traffic, transaction queues stall, causing severe lock contention and connection timeouts.

To eliminate read/write lock contention, modern relational and distributed storage engines implement **Multi-Version Concurrency Control (MVCC)**.

The core promise of MVCC is simple: **"Readers Never Block Writers, and Writers Never Block Readers."**

Instead of overwriting rows in-place, MVCC maintains multiple immutable versions of each data tuple tagged with transaction commit timestamps.

This article details tuple versioning (`xmin`/`xmax`), Read Snapshots, Snapshot Isolation (SI), and Write Skew anomalies.

---

## 📖 MVCC Tuple Versioning & Read Snapshot Architecture

How MVCC maintains tuple version chains to provide consistent Read Snapshots without locking:

```mermaid
graph TD
  subgraph Tuple Version Chain in Storage (Row: 'account_101')
    V1["Version 1: Balance=$100 (xmin: 100, xmax: 105)"] --> V2["Version 2: Balance=$150 (xmin: 105, xmax: inf)"]
  end
  
  subgraph Concurrent Transaction Read Snapshots
    TxA["Tx A (Start TxID: 102) Read Query"] -->|Visits Chain: Sees xmin 100 <= 102 < xmax 105| V1
    TxB["Tx B (Start TxID: 110) Read Query"] -->|Visits Chain: Sees xmin 105 <= 110 < inf| V2
  end
  
  subgraph Snapshot Isolation Visibility Check
    TxA -.->|Reads Immutable Historical Snapshot| ReadA[Balance = $100 (Zero Locking!)]
    TxB -.->|Reads Latest Committed Snapshot| ReadB[Balance = $150]
  end
```

### Core MVCC Concepts
1. **Tuple Versioning (`xmin` / `xmax`)**: Every row modification (`UPDATE` or `DELETE`) creates a new tuple version rather than mutating existing disk bytes. Each tuple header stores metadata fields:
   * `xmin`: The Transaction ID (TxID) that created/inserted this tuple version.
   * `xmax`: The Transaction ID that deleted or superseded this tuple version ($0$ or $\infty$ if currently active).
2. **Read Snapshots**: When a transaction begins under **Snapshot Isolation**, the database captures a Read Snapshot containing the list of active (uncommitted) transactions and the highest committed TxID.
   * *Visibility Rule*: A tuple version is visible to Transaction $T_{\text{read}}$ if `xmin` was committed *before* $T_{\text{read}}$ started AND `xmax` is either unassigned or was deleted *after* $T_{\text{read}}$ started.
3. **Snapshot Isolation (SI)**: Guarantees that all reads within a transaction observe a completely consistent snapshot of the database corresponding to a single point in time. Concurrent updates to unrelated rows never interfere with read queries.
4. **Write-Write Conflict Detection**: If two concurrent transactions attempt to `UPDATE` or `DELETE` the exact same row version simultaneously, the second transaction is blocked or aborted with a `40001 Serialization Failure` ("Could not serialize access due to concurrent update").
5. **Write Skew Anomalies & SSI**: Snapshot Isolation prevents Dirty Reads, Non-Repeatable Reads, and Phantom Reads. However, it allows **Write Skew**: two transactions read overlapping data sets, make decisions based on those reads, and update disjoint data sets—violating global invariants. **Serializable Snapshot Isolation (SSI)** tracks `SIREAD` lock graphs to detect dependency cycles and abort conflicting transactions.

---

## 🛠️ Python Implementation: MVCC Storage Engine with Read Snapshots

Here is a production-grade Python implementation of an MVCC Storage Engine featuring Tuple Versioning, Read Snapshots, and Write-Write Conflict Detection:

```python
from typing import Dict, List, Optional
from pydantic import BaseModel

class TupleVersion(BaseModel):
    xmin: int                 # Transaction ID that created this version
    xmax: Optional[int] = None # Transaction ID that deleted/superseded this version
    data: Dict[str, str]       # Row values

class Snapshot(BaseModel):
    tx_id: int
    active_tx_ids: List[int]   # Uncommitted transactions at start time

class MVCCStorageEngine:
    """
    Simulates a Multi-Version Concurrency Control (MVCC) Relational Storage Engine.
    """
    def __init__(self):
        self.global_tx_counter = 100
        self.active_transactions: set = set()
        self.version_store: Dict[str, List[TupleVersion]] = {} # {row_key: [TupleVersion]}

    def begin_transaction(self) -> Snapshot:
        self.global_tx_counter += 1
        tx_id = self.global_tx_counter
        snapshot = Snapshot(tx_id=tx_id, active_tx_ids=list(self.active_transactions))
        self.active_transactions.add(tx_id)
        print(f" 🎬 [Tx #{tx_id} BEGIN] Snapshot Captured (Active Uncommitted Txs: {snapshot.active_tx_ids})")
        return snapshot

    def commit_transaction(self, snapshot: Snapshot):
        self.active_transactions.remove(snapshot.tx_id)
        print(f" ✅ [Tx #{snapshot.tx_id} COMMIT] Successfully committed mutations.")

    def put(self, snapshot: Snapshot, row_key: str, data: Dict[str, str]):
        """Inserts or Updates a row by appending a new TupleVersion."""
        if row_key not in self.version_store:
            self.version_store[row_key] = []

        versions = self.version_store[row_key]

        # Check Write-Write Conflict
        for v in versions:
            if v.xmax is None:
                if v.xmin in snapshot.active_tx_ids or v.xmin > snapshot.tx_id:
                    print(f" 💥 [Write-Write Conflict!] Tx #{snapshot.tx_id} attempted to overwrite key '{row_key}' modified by uncommitted Tx #{v.xmin}!")
                    raise RuntimeError("40001 Serialization Failure: Concurrent Update")
                # Mark previous version as superseded by current TxID
                v.xmax = snapshot.tx_id

        # Append new version
        new_version = TupleVersion(xmin=snapshot.tx_id, xmax=None, data=data)
        versions.append(new_version)
        print(f" 📥 [Tx #{snapshot.tx_id} PUT] Created new version for Key '{row_key}' (xmin: {snapshot.tx_id}) -> Data: {data}")

    def get(self, snapshot: Snapshot, row_key: str) -> Optional[Dict[str, str]]:
        """Reads row version visible to snapshot (Zero Locks!)."""
        if row_key not in self.version_store:
            return None

        for v in reversed(self.version_store[row_key]):
            # Visibility Check Logic
            # 1. xmin must be committed before snapshot start
            xmin_visible = (v.xmin <= snapshot.tx_id) and (v.xmin not in snapshot.active_tx_ids)
            
            # 2. xmax must be either unassigned, uncommitted, or deleted AFTER snapshot start
            xmax_visible = (v.xmax is None) or (v.xmax > snapshot.tx_id) or (v.xmax in snapshot.active_tx_ids)

            if xmin_visible and xmax_visible:
                print(f" 👁️ [Tx #{snapshot.tx_id} GET] Read Version (xmin: {v.xmin}, xmax: {v.xmax}) for Key '{row_key}' -> Data: {v.data}")
                return v.data

        return None

# Demonstration Execution
if __name__ == "__main__":
    engine = MVCCStorageEngine()

    print("🚀 Demonstrating MVCC Tuple Versioning & Snapshot Isolation...")
    print("=" * 75)

    # 1. Initial State: Insert Account Balance = $100
    tx1 = engine.begin_transaction()
    engine.put(tx1, "acc_101", {"balance": "100"})
    engine.commit_transaction(tx1)

    # 2. Tx A starts (TxID 102)
    txA = engine.begin_transaction()

    # 3. Tx B starts (TxID 103) & Updates Balance to $150
    txB = engine.begin_transaction()
    engine.put(txB, "acc_101", {"balance": "150"})
    engine.commit_transaction(txB)

    # 4. Tx A Reads Account Balance -> Still sees $100 because Tx B committed after Tx A started!
    print("\n🔍 Evaluating Concurrent Read Snapshots:")
    valA = engine.get(txA, "acc_101")
    print(f"   • Tx A (Started TxID #102) Reads Balance: ${valA['balance']} (Zero Read Locks!)")

    # 5. New Tx C starts & Reads Latest State
    txC = engine.begin_transaction()
    valC = engine.get(txC, "acc_101")
    print(f"   • Tx C (Started TxID #104) Reads Balance: ${valC['balance']}")

    engine.commit_transaction(txA)
    engine.commit_transaction(txC)
```

---

## 🚨 MVCC Gotchas & Best Practices

When operating MVCC databases:

> [!IMPORTANT]
> **Run Vacuum / Garbage Collection Regularly**: MVCC creates dead tuple versions on every `UPDATE` and `DELETE`. In PostgreSQL, un-vacuumed dead tuples cause severe table bloat and slow down index scans (**Autovacuum tuning** is critical).

> [!CAUTION]
> **Prevent Transaction ID (TxID) Wraparound**: Standard 32-bit transaction IDs wrap around after 2 billion transactions. Databases execute background freeze operations (`VACUUM FREEZE`) to convert old `xmin` tags into frozen initial transactions (`FrozenTransactionId`).

---

## 📈 Real-World Enterprise Impact
Databases utilizing MVCC (such as **PostgreSQL**, **MySQL InnoDB**, and **CockroachDB**) report:
* **Over $10\times$ Higher Read Throughput**: Readers executing long analytical queries never block short concurrent write transactions.
* **Consistently Fast Snapshot Backups**: Taking database snapshots requires zero table locks, allowing online backups during peak production traffic.
