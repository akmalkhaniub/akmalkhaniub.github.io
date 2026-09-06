# Compaction Strategies: Size-Tiered vs Leveled Compaction in RocksDB & Cassandra

In Log-Structured Merge-Tree (LSM-Tree) databases (**RocksDB**, **LevelDB**, **Apache Cassandra**), flushing in-memory MemTables creates a continuous stream of immutable **Sorted String Table (SSTable)** files on disk.

Over time, this accumulation introduces severe performance penalties:
1. **Read Amplification**: A single point lookup (`GET user_101`) may require searching across dozens of un-compacted SSTables on disk.
2. **Space Amplification**: Duplicate updates and obsolete deletion tombstones waste valuable disk space.

To bound Read Amplification and reclaim storage space, LSM storage engines run continuous background **Compaction Threads**.

Compaction reads multiple SSTables, performs an **$N$-Way Merge-Sort**, purges superseded keys and expired tombstones, and writes consolidated SSTables back to disk.

This article details Size-Tiered Compaction (STCS), Leveled Compaction (LCS), and $N$-Way priority queue merge-sorting algorithms.

---

## Leveled Compaction & N-Way Merge Architecture

How Leveled Compaction (LCS) organizes SSTables into non-overlapping exponential levels:

```mermaid
graph TD
  subgraph SG1_Level0Overlapping ["Level 0 (Overlapping Key Ranges from Flushes)"]
    L0_1[SST File 1: Keys 'a'..'z'] --- L0_2[SST File 2: Keys 'c'..'m']
  end
  
  subgraph SG2_Level1Max ["Level 1 (Max 10MB, Strict Non-Overlapping Ranges)"]
    L1_1[SST File 3: Keys 'a'..'g'] --- L1_2[SST File 4: Keys 'h'..'p'] --- L1_3[SST File 5: Keys 'q'..'z']
  end
  
  subgraph SG3_CompactionPriorityQueue ["Compaction Priority Queue Engine"]
    L0_1 & L0_2 -->|1. N-Way Merge-Sort Stream| PriorityQueue[Heap Priority Queue: Stream K-V Pairs]
    PriorityQueue -->|2. Purge Obsolete Keys & Tombstones| L1_1 & L1_2 & L1_3
  end
  
  subgraph SG4_Level2Max ["Level 2 (Max 100MB, Non-Overlapping Ranges)"]
    L1_3 -->|3. Level 1 Overflow (>10MB)| L2_1[SST File 6: Keys 'a'..'m']
  end
```

### Core Compaction Strategies
1. **Size-Tiered Compaction Strategy (STCS)**:
   * *Mechanics*: Groups SSTables into tiers based on file size. When $N$ SSTables of similar size accumulate (e.g. four $64\text{ MB}$ files), STCS merges them into a single $256\text{ MB}$ file.
   * *Trade-offs*: Low Write Amplification (fastest writes), but **High Space Amplification**. Merging large files requires keeping up to $50\%$ free disk headroom to store temporary intermediate files during compaction!
2. **Leveled Compaction Strategy (LCS)**:
   * *Mechanics*: Organizes disk storage into discrete levels ($L_0, L_1, L_2, \dots, L_k$). Level target capacities grow exponentially (e.g. $L_1 = 10\text{ MB}$, $L_2 = 100\text{ MB}$, $L_3 = 1\text{ GB}$).
   * *Key Feature*: Except for $L_0$ (which contains raw MemTable flushes), **SSTables within the same level are guaranteed to have zero overlapping key ranges**.
   * *Trade-offs*: Higher Write Amplification (more CPU/disk writes), but **Minimal Read Amplification**. Searching for a key requires inspecting at most **one SSTable per level** ($O(L)$ disk reads total!).
3. **$N$-Way Priority Queue Merge-Sort**: Merging multiple sorted SSTable streams is implemented using a Min-Heap Priority Queue. The heap tracks the current head element of each SSTable iterator, emitting keys in strict lexicographical order while deduplicating older versions.

---

## Python Implementation: N-Way Merge-Sort Compaction Engine

Here is a production-grade Python implementation of an $N$-Way Priority Queue Merge-Sort Compaction Engine for Leveled SSTables:

```python
import heapq
from typing import List, Dict, Tuple, Optional
from pydantic import BaseModel

TOMBSTONE = "__DELETED__"

class KeyValue(BaseModel):
    key: str
    value: str
    sstable_id: int

class SSTableIterator:
    """
    Iterator over an SSTable file's key-value entries.
    """
    def __init__(self, sstable_id: int, records: List[Tuple[str, str]]):
        self.sstable_id = sstable_id
        self.records = records
        self.index = 0

    def has_next(self) -> bool:
        return self.index < len(self.records)

    def next(self) -> KeyValue:
        k, v = self.records[self.index]
        self.index += 1
        return KeyValue(key=k, value=v, sstable_id=self.sstable_id)

class LeveledCompactionEngine:
    """
    Executes N-Way Heap Priority Queue Merge-Sort Compaction across SSTables.
    """
    @staticmethod
    def compact_sstables(input_sstables: List[SSTableIterator], max_level_purge: bool = False) -> List[Tuple[str, str]]:
        print(f" 🧹 [Compaction Engine] Merging {len(input_sstables)} SSTables via N-Way Priority Queue Heap...")
        print("=" * 75)

        # Min-Heap Priority Queue tracking (key, sstable_id, value, iterator)
        min_heap: List[Tuple[str, int, str, SSTableIterator]] = []

        # Populate initial heap state
        for it in input_sstables:
            if it.has_next():
                kv = it.next()
                heapq.heappush(min_heap, (kv.key, kv.sstable_id, kv.value, it))

        compacted_records: List[Tuple[str, str]] = []
        last_seen_key: Optional[str] = None

        while min_heap:
            key, sst_id, val, it = heapq.heappop(min_heap)

            # Advance iterator for popped SSTable
            if it.has_next():
                next_kv = it.next()
                heapq.heappush(min_heap, (next_kv.key, next_kv.sstable_id, next_kv.value, it))

            # Deduplicate Keys (popping newer sstable_id first if keys match)
            if key == last_seen_key:
                print(f"   • Skipping Obsolete Key Version: '{key}' -> Value: '{val}' (SSTable #{sst_id})")
                continue

            last_seen_key = key

            # Purge Tombstones during final max-level compaction
            if val == TOMBSTONE and max_level_purge:
                print(f" 🗑️ [Purging Tombstone] Evicted Tombstone for Key: '{key}'")
                continue

            compacted_records.append((key, val))
            print(f" 💾 [Compacted Stream] Emitted Key: '{key}' -> Value: '{val}' (SSTable #{sst_id})")

        print(f"\n ✅ Compaction Complete! Consolidated into {len(compacted_records)} clean key-value entries.")
        return compacted_records

# Demonstration Execution
if __name__ == "__main__":
    # Simulate 3 SSTables with overlapping keys and tombstones
    # Newer SSTables have lower sstable_id in priority sorting
    sst0 = SSTableIterator(sstable_id=0, records=[
        ("apple", "v3_latest"),
        ("banana", TOMBSTONE),  # Tombstone update
        ("elderberry", "v1")
    ])
    
    sst1 = SSTableIterator(sstable_id=1, records=[
        ("apple", "v2_old"),
        ("cherry", "v1"),
        ("date", "v1")
    ])
    
    sst2 = SSTableIterator(sstable_id=2, records=[
        ("apple", "v1_oldest"),
        ("banana", "v1_old"),
        ("fig", "v1")
    ])

    engine = LeveledCompactionEngine()
    result = engine.compact_sstables([sst0, sst1, sst2], max_level_purge=True)

    print("\n📊 Final Compacted Level 1 SSTable Payload:")
    for k, v in result:
        print(f"   • Key: '{k:12s}' | Value: '{v}'")
```

---

## Compaction Gotchas & Best Practices

When tuning LSM compaction strategies:

> [!IMPORTANT]
> **Throttle Compaction I/O Bandwidth in Production**: Background compaction threads read and write massive amounts of data to disk. Un-throttled compaction can saturate SSD I/O bandwidth, causing latency spikes for live user read/write queries. Limit compaction throughput (e.g., `max_bytes_for_level_base` in RocksDB).

> [!CAUTION]
> **Avoid Universal Compaction for Mixed Workloads**: Universal/Size-Tiered Compaction is optimized for 100% write-heavy workloads. Utilizing STCS for read-heavy workloads leads to severe Read Amplification penalties.

---

## Real-World Enterprise Impact
Storage engines employing Leveled Compaction (such as **RocksDB** and **CockroachDB**) report:
* **Over 70% Reduction in Space Amplification**: Purging obsolete key versions keeps disk utilization within $1.1\times$ to $1.2\times$ of raw data size.
* **Predictable p99 Read Latencies**: Guaranteeing non-overlapping key ranges bounds point lookups to a fixed number of disk files per query.
