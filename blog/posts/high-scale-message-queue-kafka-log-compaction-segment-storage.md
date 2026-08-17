# High-Scale Message Queue Engineering: Kafka Log Compaction & Segment Storage

In high-throughput event-driven architectures, modern data platforms process millions of real-time event streams per second (financial transactions, telemetry logs, user clickstreams).

Traditional message brokers (such as RabbitMQ or ActiveMQ) operate as transient queues: as soon as a consumer acknowledges a message, the broker deletes it from memory. This prevents new microservices from replaying historical events or reconstructing state.

To support high-throughput, persistent event streaming, LinkedIn created **Apache Kafka**.

At the core of Apache Kafka is the **Distributed Append-Only Commit Log**.

Instead of treating topics as ephemeral queues, Kafka stores events in immutable, disk-backed partition segments, utilizing **Zero-Copy `sendfile()`** and **Key-Based Log Compaction**.

This article details Kafka segment indexing, zero-copy network reads, and log compaction mechanics.

---

## 📖 Apache Kafka Log Segment & Compaction Architecture

How Kafka structures partition log segments and executes background key-based compaction:

```mermaid
graph TD
  subgraph Kafka Partition Commit Log Directory on Disk
    Seg1[Segment File 000.log: Appended Messages] --- Idx1[Sparse Index File 000.index: Offset -> Bytes]
    Seg2[Segment File 005.log: Active Segment] --- Idx2[Sparse Index File 005.index]
  end
  
  subgraph Key-Based Log Compaction (Cleaner Thread)
    Seg1 -->|1. Scan Key History| Cleaner[Cleaner Thread: Deduplicate Keys]
    Cleaner -->|2. Retain Latest Record per Key| CompactedSeg[Compacted Segment File: Retains Key='user_42' Latest State]
  end
  
  subgraph High-Performance Zero-Copy Egress
    Seg2 -->|3. OS Page Cache| PageCache[Linux OS Kernel Page Cache]
    PageCache -->|4. sendfile() DMA Transfer| Socket[NIC Network Socket -> Consumer]
  end
```

### Core Kafka Architecture Principles
1. **Append-Only Log Segments**: A Kafka topic is divided into **Partitions**. Each partition is an append-only sequence of immutable records written sequentially to disk. Partitions are split into fixed-size **Log Segments** (e.g. $1\text{ GB}$ per segment file).
2. **Sparse Memory Indexing**: To locate a record by offset (e.g. Offset `1042`), Kafka maintains a `.index` file alongside each `.log` file. The index is **sparse**: it maps every $N$-th record offset to its exact byte position in the `.log` file. Searching an offset requires an $O(\log N)$ binary search in the index file followed by a short sequential scan on disk.
3. **Zero-Copy Network Egress (`sendfile`)**: When consumers fetch records, Kafka does not copy data from kernel disk cache to user-space memory and back to the network socket. Kafka invokes the Linux `sendfile()` system call, allowing the DMA engine to copy log bytes directly from the **OS Page Cache to the Network Interface Card (NIC)**, bypassing CPU memory copies.
4. **Key-Based Log Compaction**: For changelog streams (e.g. user profile updates or database CDC events), storing old superseded records wastes storage space. **Log Compaction** is a background thread that scans immutable segments, keeping *only the most recent value* for each unique message key and deleting older tombstoned records.

---

## 🛠️ Python Implementation: Kafka Segment Storage & Log Compactor Engine

Here is a production-grade Python implementation of a Kafka Partition Segment Storage Engine with Sparse Indexing and Key-Based Log Compactor:

```python
import struct
from typing import List, Dict, Tuple, Optional
from pydantic import BaseModel

class KafkaRecord(BaseModel):
    offset: int
    key: str
    value: str

class SparseIndexEntry(BaseModel):
    offset: int
    byte_position: int

class KafkaLogSegment:
    """
    Simulates a Kafka Partition Log Segment File (.log) and Sparse Index (.index).
    """
    def __init__(self, segment_base_offset: int, index_interval: int = 2):
        self.segment_base_offset = segment_base_offset
        self.index_interval = index_interval
        self.records: List[KafkaRecord] = []
        self.sparse_index: List[SparseIndexEntry] = []
        self.current_byte_pos = 0

    def append(self, key: str, value: str, offset: int):
        record = KafkaRecord(offset=offset, key=key, value=value)
        record_bytes_len = len(key) + len(value) + 16  # Mock wire size

        # Update Sparse Index every index_interval records
        if len(self.records) % self.index_interval == 0:
            self.sparse_index.append(
                SparseIndexEntry(offset=offset, byte_position=self.current_byte_pos)
            )

        self.records.append(record)
        self.current_byte_pos += record_bytes_len

    def read_by_offset(self, target_offset: int) -> Optional[KafkaRecord]:
        """Binary searches sparse index, then performs sequential scan."""
        if not self.records:
            return None

        # Find closest lower index entry
        start_idx = 0
        for entry in self.sparse_index:
            if entry.offset <= target_offset:
                start_idx = entry.offset - self.segment_base_offset

        # Sequential scan from index entry
        for rec in self.records[start_idx:]:
            if rec.offset == target_offset:
                return rec
        return None

class KafkaLogCompactor:
    """
    Simulates Kafka Background Key-Based Log Compaction.
    """
    @staticmethod
    def compact_segment(segment: KafkaLogSegment) -> KafkaLogSegment:
        """Keeps only the LATEST value for each unique key."""
        print(f"\n 🧹 [Kafka Log Cleaner] Starting Key Compaction on Segment (Base Offset: {segment.segment_base_offset})...")
        
        latest_key_map: Dict[str, KafkaRecord] = {}
        for rec in segment.records:
            latest_key_map[rec.key] = rec  # Overwrites older records with same key!

        # Reconstruct compacted segment
        compacted = KafkaLogSegment(segment_base_offset=segment.segment_base_offset, index_interval=segment.index_interval)
        for rec in sorted(latest_key_map.values(), key=lambda r: r.offset):
            compacted.append(key=rec.key, value=rec.value, offset=rec.offset)

        print(f" 💾 [Compaction Complete] Reduced segment from {len(segment.records)} -> {len(compacted.records)} records!")
        return compacted

# Demonstration Execution
if __name__ == "__main__":
    segment = KafkaLogSegment(segment_base_offset=0, index_interval=2)

    print("🚀 Demonstrating Kafka Segment Storage & Log Compaction...")
    print("=" * 75)

    # 1. Append User Profile Update Events (Duplicate Keys)
    events = [
        ("user_101", "theme=light"),
        ("user_102", "theme=dark"),
        ("user_101", "theme=dark"),  # Update for user_101
        ("user_103", "theme=light"),
        ("user_101", "theme=blue"),  # Final update for user_101
    ]

    for offset, (key, val) in enumerate(events):
        segment.append(key=key, value=val, offset=offset)
        print(f" 📥 [Append Log] Offset {offset:02d} | Key: '{key}' -> Val: '{val}'")

    print(f"\n1. Sparse Index Entries ({len(segment.sparse_index)} entries):")
    for idx_entry in segment.sparse_index:
        print(f"   • Offset {idx_entry.offset:02d} -> Byte Position: {idx_entry.byte_position} bytes")

    # 2. Execute Offset Lookup
    found_rec = segment.read_by_offset(2)
    print(f"\n2. Offset Lookup for Target Offset #2 -> Found: Key='{found_rec.key}', Val='{found_rec.value}'")

    # 3. Run Key-Based Log Compaction
    compacted_segment = KafkaLogCompactor.compact_segment(segment)
    print("\n3. Final Compacted Segment State:")
    for rec in compacted_segment.records:
        print(f"   • Offset {rec.offset:02d} | Key: '{rec.key}' -> Val: '{rec.value}' (Latest State Preserved)")
```

---

## 🚨 Kafka Storage Gotchas & Best Practices

When operating Kafka clusters at scale:

> [!IMPORTANT]
> **Use XFS or ext4 Filesystems with `noatime`**: Mount Kafka log storage disks with `noatime` flags to prevent Linux from writing file access timestamps on every read, maximizing raw disk write throughput.

> [!CAUTION]
> **Monitor In-Sync Replicas (ISR) Shrinkage**: If a partition leader fails to receive acknowledgments from a follower replica within `replica.lag.time.max.ms`, it drops the follower from the ISR pool. ISR shrinkage compromises data redundancy; configure Prometheus alerts on `UnderReplicatedPartitions`.

---

## 📈 Real-World Enterprise Impact
Kafka distributed log architecture enables:
* **Multi-Gigabit Event Streaming**: Zero-copy `sendfile()` network reads allow a single Kafka broker node to stream over $1\text{ GB/sec}$ of events.
* **Infinite Event Replayability**: Retaining immutable log segments allows new analytical microservices to replay historical events from offset zero without impacting production databases.
