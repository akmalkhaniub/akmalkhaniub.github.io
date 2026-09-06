# Write-Ahead Log (WAL) Internals: LSN (Log Sequence Number), ARIES Recovery & Group Commit

In relational and key-value database engines (**PostgreSQL**, **MySQL InnoDB**, **SQLite**, **CockroachDB**), ensuring **ACID Durability** means committed data must survive operating system crashes, hardware failure, and sudden power loss.

Writing random database data pages ($8\text{ KB}$ or $16\text{ KB}$ blocks) directly to disk on every transaction is far too slow and unsafe: a power outage mid-page write corrupts disk sectors (**Torn Pages**).

To guarantee durability with high performance, storage engines rely on a **Write-Ahead Log (WAL)** (also known as the Redo Log).

By enforcing the **WAL Protocol**—writing sequential append-only log records before modifying dirty memory pages—and applying the **ARIES Recovery Protocol**, databases restore perfect consistency after unexpected crashes.

This article details Log Sequence Numbers (LSN), ARIES 3-phase recovery (Analysis, Redo, Undo), and Group Commit throughput optimization.

---

## WAL & ARIES Crash Recovery Architecture

How the ARIES recovery protocol restores database state following a crash:

```mermaid
graph TD
  subgraph SG1_PreCrashDatabase ["Pre-Crash Database Execution"]
    Tx[Transaction Mutation] -->|1. Append WAL Record| WALBuffer[In-Memory WAL Buffer]
    WALBuffer -->|2. fsync() Group Commit| WALDisk[Append-Only WAL Disk File]
    WALDisk -->|3. Flush Dirty Page to Disk| DataPages[Database Data Pages]
  end
  
  subgraph SG2_UnexpectedDatabaseCrash ["Unexpected Database Crash & Restart"]
    WALDisk -->|4. Read Last Checkpoint LSN| Analysis[Phase 1: Analysis Phase]
    Analysis -->|Rebuild ATT & DPT Tables| Redo[Phase 2: Redo Phase - Repeat History]
    
    Redo -->|Replay Log Forward: page.lsn < record.lsn| RestoredState[Restored Crash Instant State]
    RestoredState --> Undo[Phase 3: Undo Phase - Rollback Uncommitted]
    
    Undo -->|Write CLR Records| ActiveDB[🎉 Database Ready for Production!]
  end
```

### Core WAL & ARIES Principles
1. **The Write-Ahead Logging (WAL) Protocol**:
   * *Rule 1*: An uncommitted transaction's dirty data page can *never* be written to disk until the corresponding WAL record describing the modification is flushed to persistent storage.
   * *Rule 2*: A transaction is NOT considered committed until its `COMMIT` WAL record is successfully written and `fsync()` confirmed on disk.
2. **Log Sequence Numbers (LSN)**:
   * Every WAL record is assigned a 64-bit **Log Sequence Number (LSN)** representing the exact byte offset in the WAL stream.
   * Every data page header stores `page.lsn` (the LSN of the last WAL record that modified the page).
   * *LSN Rule*: A page write to disk is allowed if and only if `page.lsn <= flushed_wal_lsn`.
3. **ARIES Recovery Algorithm (Mohan et al.)**:
   * **Phase 1: Analysis Phase**: Scans the WAL forward from the most recent Checkpoint record. Reconstructs the **Active Transaction Table (ATT)** (uncommitted transactions at crash time) and the **Dirty Page Table (DPT)**.
   * **Phase 2: Redo Phase ("Repeating History")**: Scans the WAL forward from the minimum `RecLSN` in the DPT. Replays all logged modifications for both committed and uncommitted transactions, restoring the database to the exact state at the crash instant.
   * **Phase 3: Undo Phase**: Scans the WAL backward to roll back all uncommitted transactions in the ATT. For every undone action, ARIES writes a **Compensation Log Record (CLR)** to ensure recovery is idempotent even if repeated crashes occur during recovery!
4. **Group Commit Optimization**: Executing a disk `fsync()` for every individual single-row transaction caps throughput at the physical drive's IOPS limit ($\approx 500\text{ fsyncs/sec}$ on HDD or $10,000$ on NVMe). **Group Commit** holds flushing threads for a microsecond window, batching hundreds of concurrent transaction commits into a single combined `fsync()` call!

---

## Python Implementation: WAL Storage Engine & ARIES Recovery Engine

Here is a production-grade Python implementation of a Write-Ahead Log (WAL) Storage Engine featuring Group Commit and ARIES 3-Phase Crash Recovery:

```python
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel

class WALRecord(BaseModel):
    lsn: int
    tx_id: int
    type: str  # 'START', 'UPDATE', 'COMMIT', 'ABORT', 'CLR'
    page_id: Optional[str] = None
    old_val: Optional[str] = None
    new_val: Optional[str] = None

class DataPage(BaseModel):
    page_id: str
    content: str
    page_lsn: int = 0

class WriteAheadLogStorageEngine:
    """
    Simulates a Relational Database Engine with WAL, Group Commit, and ARIES Recovery.
    """
    def __init__(self):
        self.global_lsn = 0
        self.flushed_lsn = 0
        self.wal_disk: List[WALRecord] = []          # Durable WAL Log File
        self.wal_buffer: List[WALRecord] = []        # In-Memory WAL Buffer
        self.buffer_pool: Dict[str, DataPage] = {}   # In-Memory Data Pages
        self.disk_pages: Dict[str, DataPage] = {}    # Data Pages on Disk

    def _append_wal(self, tx_id: int, rec_type: str, page_id: Optional[str] = None, old_val: Optional[str] = None, new_val: Optional[str] = None) -> int:
        self.global_lsn += 16  # Advance LSN by 16 byte offset
        record = WALRecord(lsn=self.global_lsn, tx_id=tx_id, type=rec_type, page_id=page_id, old_val=old_val, new_val=new_val)
        self.wal_buffer.append(record)
        return self.global_lsn

    def group_commit(self):
        """Simulates Group Commit: Batch flushing WAL buffer to disk via fsync()."""
        if not self.wal_buffer:
            return

        batch_count = len(self.wal_buffer)
        self.wal_disk.extend(self.wal_buffer)
        self.flushed_lsn = self.wal_buffer[-1].lsn
        self.wal_buffer.clear()
        print(f" 💾 [Group Commit fsync()] Flushed {batch_count} WAL Records to Disk! (Flushed LSN: {self.flushed_lsn})")

    def update_page(self, tx_id: int, page_id: str, new_content: str):
        """Modifies a data page under WAL Protocol."""
        if page_id not in self.buffer_pool:
            old_content = self.disk_pages.get(page_id, DataPage(page_id=page_id, content="") process).content
            self.buffer_pool[page_id] = DataPage(page_id=page_id, content=old_content)

        old_val = self.buffer_pool[page_id].content
        
        # 1. Write WAL Record FIRST
        rec_lsn = self._append_wal(tx_id, "UPDATE", page_id=page_id, old_val=old_val, new_val=new_content)
        
        # 2. Modify Dirty Page in Memory
        self.buffer_pool[page_id].content = new_content
        self.buffer_pool[page_id].page_lsn = rec_lsn
        print(f" ✏️ [Tx #{tx_id} Update] Page '{page_id}' modified in RAM (page.lsn={rec_lsn}) -> New Val: '{new_content}'")

    def commit_transaction(self, tx_id: int):
        self._append_wal(tx_id, "COMMIT")
        self.group_commit()
        print(f" ✅ [Tx #{tx_id} COMMITTED]")

    def simulate_crash_and_aries_recovery(self):
        """Simulates ARIES 3-Phase Recovery (Analysis, Redo, Undo)."""
        print("\n💥 [CRASH OCCURRED!] Volatile Memory RAM Lost. Initiating ARIES Recovery...")
        print("=" * 75)
        self.buffer_pool.clear()  # RAM Wiped!

        # ----------------------------------------------------
        # Phase 1: ANALYSIS PHASE
        # ----------------------------------------------------
        print("1. ARIES PHASE 1: ANALYSIS PHASE")
        active_transactions = set()
        for rec in self.wal_disk:
            if rec.type == "START":
                active_transactions.add(rec.tx_id)
            elif rec.type in ("COMMIT", "ABORT"):
                active_transactions.discard(rec.tx_id)

        print(f"   • Active Uncommitted Transactions at Crash Instant: {list(active_transactions)}")

        # ----------------------------------------------------
        # Phase 2: REDO PHASE (Repeating History)
        # ----------------------------------------------------
        print("\n2. ARIES PHASE 2: REDO PHASE (Repeating History)")
        for rec in self.wal_disk:
            if rec.type == "UPDATE" and rec.page_id:
                disk_page = self.disk_pages.get(rec.page_id, DataPage(page_id=rec.page_id, content=""))
                # Redo if page on disk is older than WAL record
                if disk_page.page_lsn < rec.lsn:
                    disk_page.content = rec.new_val
                    disk_page.page_lsn = rec.lsn
                    self.disk_pages[rec.page_id] = disk_page
                    print(f"   • [Redo Replayed] Page '{rec.page_id}' restored to LSN #{rec.lsn} -> '{rec.new_val}'")

        # ----------------------------------------------------
        # Phase 3: UNDO PHASE (Rollback Uncommitted Txs)
        # ----------------------------------------------------
        print("\n3. ARIES PHASE 3: UNDO PHASE (Rolling Back Uncommitted Txs)")
        for rec in reversed(self.wal_disk):
            if rec.tx_id in active_transactions and rec.type == "UPDATE" and rec.page_id:
                disk_page = self.disk_pages[rec.page_id]
                disk_page.content = rec.old_val
                self.disk_pages[rec.page_id] = disk_page
                
                # Write Compensation Log Record (CLR)
                clr_lsn = self._append_wal(rec.tx_id, "CLR", page_id=rec.page_id, new_val=rec.old_val)
                print(f"   • [Undo Reverted] Tx #{rec.tx_id} Page '{rec.page_id}' rolled back to '{rec.old_val}' (Logged CLR LSN #{clr_lsn})")

        print("\n 🎉 [ARIES Recovery Complete] Database is 100% Consistent!")

# Demonstration Execution
if __name__ == "__main__":
    db = WriteAheadLogStorageEngine()

    print("🚀 Demonstrating WAL Mechanics & ARIES Recovery Engine...")
    print("=" * 75)

    # Tx 101 Starts & Commits
    db._append_wal(101, "START")
    db.update_page(101, "page_A", "Account_A=$500")
    db.commit_transaction(101)

    # Tx 102 Starts but CRASHES BEFORE COMMIT!
    db._append_wal(102, "START")
    db.update_page(102, "page_B", "Account_B=$9999")
    # Group Commit flushes WAL to disk before crash
    db.group_commit()

    # Trigger Crash and ARIES Recovery!
    db.simulate_crash_and_aries_recovery()

    print(f"\n📊 Recovered Disk Data Pages: {db.disk_pages['page_A'].content}, {db.disk_pages['page_B'].content}")
```

---

## WAL & Recovery Gotchas & Best Practices

When tuning WAL and crash recovery:

> [!IMPORTANT]
> **Tune Group Commit Delay Microseconds**: Setting group commit delays (`commit_delay = 100` $\mu\text{s}$) allows concurrent threads to batch commits together, increasing write throughput by up to $10\times$ under heavy parallel client connections.

> [!CAUTION]
> **Beware of Double-Write Buffer Issues on Ext4/XFS**: Standard operating system filesystems do not guarantee atomic $16\text{ KB}$ page writes. Use a **Doublewrite Buffer** (InnoDB `innodb_doublewrite`) or full page writes after checkpoints to protect against disk Torn Pages.

---

## Real-World Enterprise Impact
Storage engines deploying WAL and ARIES recovery (such as **PostgreSQL**, **MySQL InnoDB**, and **SQLite**) report:
* **Zero Data Corruption During Sudden Power Loss**: ARIES Redo/Undo phases restore database consistency in seconds after abrupt crashes.
* **$10\times$ Higher Transaction Write Throughput**: Group Commit converts random disk page writes into sequential, high-speed WAL append streams.
