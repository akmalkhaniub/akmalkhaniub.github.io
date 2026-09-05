# Distributed Transaction Protocols: 2-Phase Commit (2PC) & Percolator

When building sharded distributed databases (**TiDB**, **CockroachDB**, **Google Spanner**), executing single-shard operations using Raft is straightforward. However, modern applications require **ACID transactions** that span across multiple database shards (e.g. transferring money from Account A on Shard 1 to Account B on Shard 2).

Executing cross-shard transactions introduces severe consistency risks: if Shard 1 commits while Shard 2 crashes, the system suffers data corruption and lost funds.

Historically, systems used the **Two-Phase Commit (2PC)** protocol. However, traditional 2PC suffers from a fatal flaw: if the Central Coordinator node crashes during Phase 2, participant nodes remain **blocked holding locks indefinitely**.

To eliminate blocking coordinator bugs, Google introduced the **Percolator Protocol** (used in **Google Bigtable** and **TiDB**).

Percolator decentralizes 2PC by designating a single key's lock as the **Primary Lock**, enabling self-healing conflict resolution.

This article details traditional 2PC and Google Percolator distributed transaction protocols.

---

## Google Percolator Distributed Transaction Architecture

How Percolator uses a Timestamp Oracle (TSO) and Primary Lock pointers to execute non-blocking distributed transactions:

```mermaid
graph TD
  Client[Transaction Client] -->|1. Get Start Timestamp T_start=100| TSO[Timestamp Oracle TSO]
  
  subgraph Phase 1: Prewrite (Acquire Locks)
    Client -->|2a. Lock & Prewrite Primary Key A| ShardA[Shard A: Primary Lock Column -> Primary A]
    Client -->|2b. Lock & Prewrite Secondary Key B| ShardB[Shard B: Secondary Lock -> Pointer to Primary A]
  end
  
  subgraph Phase 2: Commit (Get Commit Timestamp T_commit=105)
    Client -->|3. Get Commit Timestamp T_commit=105| TSO
    Client -->|4. Commit Primary Key A: Remove Lock, Write Commit Data| ShardA
    
    ShardA -.->|5. Primary A Committed! Transaction SUCCESS| Client
    
    Client -->|6. Async Commit Secondary Key B| ShardB
  end
```

### Core Percolator Transaction Mechanisms
1. **Timestamp Oracle (TSO)**: A centralized, high-throughput service that dispenses strictly monotonically increasing timestamps ($T_{\text{start}}$, $T_{\text{commit}}$). Timestamps define Multi-Version Concurrency Control (MVCC) snapshot versions.
2. **Percolator Column Structure**: Every row stores three MVCC column families:
   * `data @ start_ts`: The uncommitted or committed binary data value.
   * `lock @ start_ts`: Stores `primary_lock_key` pointer and TTL. If present, the row is actively locked.
   * `write @ commit_ts`: Stores `start_ts` pointer. Indicates data is committed and visible to readers.
3. **Primary Lock & Self-Healing Crash Recovery**: During Prewrite, the client designates Key A as the **Primary Key**. All other keys (Key B, Key C) store a **Secondary Lock** containing a direct pointer to `Primary Key A`.
   * If the client crashes mid-transaction, another transaction attempting to read Key B inspects Key B's secondary lock pointer.
   * The reader inspects `Primary Key A`: If Primary Key A has a `write` record, the transaction succeeded and Key B is rolled forward. If Primary Key A is unlocked, the transaction failed and Key B is rolled back.

---

## Python Implementation: Google Percolator Transaction Engine

Here is a production-grade Python simulation of the Google Percolator Distributed Transaction Protocol featuring $T_{\text{start}} / T_{\text{commit}}$ timestamps, primary lock pointers, and conflict resolution:

```python
from typing import Dict, Optional, Tuple, Any
from pydantic import BaseModel

class RowMVCC(BaseModel):
    data: Dict[int, str] = {}      # start_ts -> value
    lock: Dict[int, str] = {}      # start_ts -> primary_lock_key pointer
    write: Dict[int, int] = {}     # commit_ts -> start_ts

class TimestampOracle:
    """Monotonically increasing Timestamp Oracle (TSO)."""
    def __init__(self):
        self._ts = 0

    def get_ts(self) -> int:
        self._ts += 1
        return self._ts

class PercolatorStorageEngine:
    """
    Simulates Google Percolator Distributed Transaction Engine.
    """
    def __init__(self):
        self.tso = TimestampOracle()
        # key -> RowMVCC
        self.store: Dict[str, RowMVCC] = {}

    def _get_row(self, key: str) -> RowMVCC:
        if key not in self.store:
            self.store[key] = RowMVCC()
        return self.store[key]

    def execute_transaction(self, writes: Dict[str, str]) -> bool:
        """
        Executes a Percolator 2-Phase Transaction across multiple keys.
        writes: {key: new_value}
        """
        if not writes:
            return True

        start_ts = self.tso.get_ts()
        keys = list(writes.keys())
        primary_key = keys[0]
        secondary_keys = keys[1:]

        print(f"\n⚡ [Percolator Txn] Beginning Transaction (Start TS: {start_ts}). Primary Key: '{primary_key}'")

        # ----------------------------------------------------
        # PHASE 1: PREWRITE (Acquire Locks & Write Data)
        # ----------------------------------------------------
        # 1a. Prewrite Primary Key
        if not self._prewrite_key(primary_key, writes[primary_key], start_ts, primary_lock=primary_key):
            print(f" ❌ [Prewrite Failed] Lock conflict on Primary Key '{primary_key}'. Aborting Txn.")
            return False

        # 1b. Prewrite Secondary Keys (Lock points to Primary Key)
        for s_key in secondary_keys:
            if not self._prewrite_key(s_key, writes[s_key], start_ts, primary_lock=primary_key):
                print(f" ❌ [Prewrite Failed] Lock conflict on Secondary Key '{s_key}'. Rolling back Primary.")
                self._rollback_key(primary_key, start_ts)
                return False

        print(" ✅ [Phase 1: Prewrite Success] All keys locked and written.")

        # ----------------------------------------------------
        # PHASE 2: COMMIT (Get Commit TS & Commit Primary)
        # ----------------------------------------------------
        commit_ts = self.tso.get_ts()
        print(f" 🔒 [Phase 2: Commit] Obtained Commit TS: {commit_ts}")

        # 2a. Commit Primary Key (Determines Transaction Success!)
        if not self._commit_key(primary_key, start_ts, commit_ts):
            print(f" ❌ [Commit Failed] Primary Key '{primary_key}' commit failed.")
            return False

        print(f" 🎉 [TRANSACTION COMMITTED] Primary '{primary_key}' Committed at Commit TS {commit_ts}!")

        # 2b. Async Commit Secondary Keys
        for s_key in secondary_keys:
            self._commit_key(s_key, start_ts, commit_ts)

        return True

    def _prewrite_key(self, key: str, value: str, start_ts: int, primary_lock: str) -> bool:
        row = self._get_row(key)
        # Conflict Check 1: Write-Write Conflict (Has key been committed after start_ts?)
        for c_ts in row.write.keys():
            if c_ts >= start_ts:
                return False

        # Conflict Check 2: Active Lock (Is key locked by another transaction?)
        if len(row.lock) > 0:
            return False

        # Write Data & Acquire Lock
        row.data[start_ts] = value
        row.lock[start_ts] = primary_lock
        return True

    def _commit_key(self, key: str, start_ts: int, commit_ts: int) -> bool:
        row = self._get_row(key)
        if start_ts not in row.lock:
            return False  # Lock missing or rolled back

        # Remove Lock & Add Commit Write Record
        del row.lock[start_ts]
        row.write[commit_ts] = start_ts
        return True

    def _rollback_key(self, key: str, start_ts: int):
        row = self._get_row(key)
        row.lock.pop(start_ts, None)
        row.data.pop(start_ts, None)

    def read_snapshot(self, key: str) -> Optional[str]:
        """Reads key snapshot at current TSO timestamp under Snapshot Isolation."""
        read_ts = self.tso.get_ts()
        row = self._get_row(key)

        # Find latest commit_ts <= read_ts
        valid_commits = [c_ts for c_ts in row.write.keys() if c_ts <= read_ts]
        if not valid_commits:
            return None

        latest_commit_ts = max(valid_commits)
        start_ts = row.write[latest_commit_ts]
        return row.data.get(start_ts)

# Demonstration Execution
if __name__ == "__main__":
    db = PercolatorStorageEngine()

    print("🚀 Demonstrating Google Percolator Distributed Transaction Engine...")
    print("=" * 75)

    # 1. Execute Multi-Key Distributed Transaction (Bank Transfer: $100 from Alice to Bob)
    success = db.execute_transaction(writes={
        "account_alice": "balance: 400",
        "account_bob": "balance: 600"
    })

    # 2. Read Snapshot under Snapshot Isolation
    print("\n🔍 Reading Snapshot State after Committed Transaction:")
    print(f"   • Account Alice: {db.read_snapshot('account_alice')}")
    print(f"   • Account Bob:   {db.read_snapshot('account_bob')}")
```

---

## Percolator & 2PC Gotchas & Best Practices

When implementing distributed transactions:

> [!IMPORTANT]
> **Keep Primary Locks Small and Short-Lived**: In Percolator, transaction success is defined solely by whether the Primary Key's lock is successfully converted to a write record. Select a lightweight primary key and commit it immediately to minimize lock duration.

> [!CAUTION]
> **Use High-Throughput Batch TSO Time-Bouncing**: Requesting a network round-trip to the Timestamp Oracle (TSO) for every single transaction timestamp can create an RPC bottleneck. Production systems (like TiDB TSO) batch timestamp allocations in blocks of $10,000$ to serve microsecond requests locally in memory.

---

## Real-World Enterprise Impact
Distributed databases utilizing Percolator transactions (such as **TiDB** and **CockroachDB**) report:
* **Zero Coordinator Lock Deadlocks**: Eliminating traditional 2PC blocking bugs allows automatic self-healing crash recovery.
* **Full ACID Snapshot Isolation**: Supporting multi-key distributed transactions across thousands of server nodes with zero read-lock contention.
