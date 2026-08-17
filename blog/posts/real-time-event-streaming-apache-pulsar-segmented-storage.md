# Real-Time Event Streaming Storage: Apache Pulsar Segmented Architecture & Tiered Storage

In enterprise messaging and event-driven architectures, event streaming brokers serve as the central nervous system for real-time data pipelines.

For over a decade, **Apache Kafka** set the standard for partition-based distributed log storage.

However, traditional monolithic streaming brokers couple compute and storage onto the same physical node.

When a Kafka partition grows to terabytes in size, scaling out the cluster or rebalancing topic partitions requires physically copying hundreds of gigabytes of historical log files across network links, causing severe CPU and disk I/O bottlenecks.

To eliminate data-copying rebalance penalties, next-generation streaming systems—led by **Apache Pulsar** and **WarpStream**—utilize a **Decoupled Segmented Architecture**.

By separating stateless serve brokers from a distributed ledger storage layer (**Apache BookKeeper**) and automatically offloading cold log segments to cloud object storage (**S3/GCS**), Pulsar delivers infinite event retention and instant horizontal scaling.

This article details Pulsar's stateless broker layer, BookKeeper ledger segments, quorum writes, and cloud tiered storage offloading.

---

## 📖 Apache Pulsar Decoupled Segmented Architecture

How Pulsar separates stateless serve brokers from Apache BookKeeper ledger segments and S3 Tiered Storage:

```mermaid
graph TD
  subgraph Client Producers & Consumers
    Prod[Event Producer] -->|Publish Event| Broker1[Stateless Pulsar Broker 1]
    Cons[Event Consumer] <--|Subscribe / Read| Broker2[Stateless Pulsar Broker 2]
  end
  
  subgraph Stateless Broker Layer (Zero Local Disk Storage)
    Broker1 -.->|Serves Pub/Sub Traffic| Broker2
  end
  
  subgraph Segment-Centric Storage Layer (Apache BookKeeper)
    Broker1 -->|1. Quorum Write (Ensemble=3, Write=3, Ack=2)| Seg1[Ledger Segment 1: Bookie Node A]
    Broker1 -->|1. Quorum Write| Seg2[Ledger Segment 1: Bookie Node B]
    Broker1 -->|1. Quorum Write| Seg3[Ledger Segment 1: Bookie Node C]
  end
  
  subgraph Cloud Object Tiered Storage (Infinite Retention)
    Seg1 -->|2. Offload Sealed Cold Ledger Segments| S3[Cloud Object Storage: AWS S3 / GCS]
    Broker2 -->|3. Transparent Historical Read| S3
  end
```

### Core Segmented Streaming Mechanics
1. **Coupled vs Decoupled Streaming Architectures**:
   * *Monolithic (Kafka)*: Topic partitions are monolithic files mapped directly to physical broker disks. Scaling requires re-replicating whole partition logs across nodes.
   * *Decoupled (Pulsar)*: Brokers are completely **stateless**. Topics are broken down into logical **Ledger Segments**. Adding a new broker requires zero data migration; the new broker begins serving topic pub/sub requests instantly.
2. **Apache BookKeeper Ledger Segments**:
   * A topic partition consists of an ordered sequence of immutable **Ledger Segments**.
   * When a ledger segment reaches a size threshold (e.g. $1\text{ GB}$) or time limit (e.g. $1\text{ hour}$), it is sealed, and a new segment is opened.
   * **Quorum Writes (E/W/A Configuration)**:
     * *Ensemble Size ($E$)*: Number of Bookies assigned to store segments for a ledger.
     * *Write Quorum ($W$)*: Number of Bookies to which a entry is written in parallel.
     * *Ack Quorum ($A$)*: Number of Bookie acknowledgments required before confirming success to the producer ($A \le W$).
3. **Seamless Cloud Object Tiered Storage**:
   * In traditional streaming systems, retaining months of historical log data on expensive local NVMe SSDs is cost-prohibitive.
   * Pulsar's **Tiered Storage Offloader** automatically copies sealed, historical BookKeeper ledger segments to cheap cloud object storage (**AWS S3**, **Google Cloud Storage**).
   * *Transparent Catch-Up Reads*: When a consumer reads historical data from 6 months ago, the stateless broker transparently streams data directly from S3 without consuming local Bookie disk space!

---

## 🛠️ Python Implementation: Segmented Ledger Storage & Tiered Offloader

Here is a production-grade Python implementation of a Segmented Ledger Event Storage Engine featuring Quorum Writes and Cloud Tiered Storage Offloading:

```python
import time
from typing import Dict, List, Optional
from pydantic import BaseModel

class LedgerEntry(BaseModel):
    entry_id: int
    data: str
    timestamp: float

class LedgerSegment(BaseModel):
    segment_id: int
    is_sealed: bool = False
    entries: List[LedgerEntry] = []
    offloaded_to_s3: bool = False

class SegmentedLedgerStorageEngine:
    """
    Simulates Apache Pulsar Decoupled Ledger Segment Storage & Tiered Offloading.
    """
    def __init__(self, segment_max_entries: int = 3):
        self.segment_max_entries = segment_max_entries
        self.active_segment_id = 1
        self.segments: Dict[int, LedgerSegment] = {
            1: LedgerSegment(segment_id=1)
        }
        self.s3_object_store: Dict[str, List[LedgerEntry]] = {} # Cloud Storage

    def write_entry(self, data: str) -> Tuple[int, int]:
        """Writes entry to current active BookKeeper ledger segment."""
        active_seg = self.segments[self.active_segment_id]

        if len(active_seg.entries) >= self.segment_max_entries:
            # Seal active segment and roll new segment
            active_seg.is_sealed = True
            print(f" 🔒 [Ledger Segment Sealed] Segment #{active_seg.segment_id} reached capacity ({self.segment_max_entries} entries).")
            
            self.active_segment_id += 1
            active_seg = LedgerSegment(segment_id=self.active_segment_id)
            self.segments[self.active_segment_id] = active_seg

        entry_id = len(active_seg.entries) + 1
        entry = LedgerEntry(entry_id=entry_id, data=data, timestamp=time.time())
        active_seg.entries.append(entry)

        print(f" 📥 [BookKeeper Write] Segment #{active_seg.segment_id} | Entry #{entry_id} -> Data: '{data}'")
        return (active_seg.segment_id, entry_id)

    def offload_sealed_segments_to_s3(self):
        """Asynchronously offloads sealed ledger segments to Cloud Object Storage (S3)."""
        print("\n☁️ [Tiered Storage Offloader] Scanning for sealed ledger segments...")
        for seg_id, seg in self.segments.items():
            if seg.is_sealed and not seg.offloaded_to_s3:
                s3_key = f"s3://my-pulsar-bucket/ledger_segment_{seg_id}.log"
                self.s3_object_store[s3_key] = list(seg.entries)
                seg.offloaded_to_s3 = True
                
                # Clear local entries to free Bookie SSD space
                local_count = len(seg.entries)
                seg.entries = []
                print(f" 🚀 [Offloaded to S3] Segment #{seg_id} ({local_count} entries) -> Uploaded to '{s3_key}'. Freed local SSD memory!")

    def read_historical_entry(self, segment_id: int, entry_id: int) -> Optional[str]:
        """Reads historical entry transparently from local Bookie SSD OR S3 Tiered Storage."""
        if segment_id not in self.segments:
            return None

        seg = self.segments[segment_id]
        
        # 1. Read from Local Bookie SSD if available
        if seg.entries:
            for e in seg.entries:
                if e.entry_id == entry_id:
                    print(f" 🎯 [Read - Local SSD] Segment #{segment_id} Entry #{entry_id} -> Data: '{e.data}'")
                    return e.data

        # 2. Transparent Read from S3 Cloud Storage
        if seg.offloaded_to_s3:
            s3_key = f"s3://my-pulsar-bucket/ledger_segment_{segment_id}.log"
            s3_entries = self.s3_object_store.get(s3_key, [])
            for e in s3_entries:
                if e.entry_id == entry_id:
                    print(f" 🌐 [Read - S3 Object Storage] Segment #{segment_id} Entry #{entry_id} -> Data: '{e.data}' (Transparent Catch-Up Read!)")
                    return e.data

        return None

# Demonstration Execution
if __name__ == "__main__":
    storage = SegmentedLedgerStorageEngine(segment_max_entries=3)

    print("🚀 Demonstrating Apache Pulsar Decoupled Segmented Storage & S3 Offloading...")
    print("=" * 75)

    # 1. Write 5 Entries (Triggers Segment 1 Sealing & Segment 2 Creation)
    storage.write_entry("Click_Event_101")
    storage.write_entry("Click_Event_102")
    storage.write_entry("Click_Event_103")
    storage.write_entry("Click_Event_104")  # Segment 1 Seals!
    storage.write_entry("Click_Event_105")

    # 2. Trigger Tiered Storage Offloader to S3
    storage.offload_sealed_segments_to_s3()

    # 3. Read Historical Data from Offloaded Segment 1 (Transparent S3 Read)
    print("\n🔍 Executing Catch-Up Reader Query for Historical Segment #1:")
    storage.read_historical_entry(segment_id=1, entry_id=2)
```

---

## 🚨 Segmented Streaming Gotchas & Best Practices

When deploying decoupled event streaming:

> [!IMPORTANT]
> **Configure S3 Multipart Uploads for Offloading**: When offloading large sealed segments ($1\text{ GB}$) to AWS S3, use parallel multipart uploads with MD5 checksum verification to ensure high network throughput and data integrity.

> [!CAUTION]
> **Do Not Over-Allocate BookKeeper Ensemble Sizes**: Setting `Ensemble=10, Write=3, Ack=2` creates excessive coordination overhead across Bookie nodes. A standard production configuration is `Ensemble=3, Write=3, Ack=2` for optimal durability and write latency.

---

## 📈 Real-World Enterprise Impact
Decoupled streaming architectures (such as **Apache Pulsar**, **Splunk DSP**, and **WarpStream**) report:
* **Zero-Rebalance Scaling**: Adding or removing storage nodes takes seconds without re-replicating terabytes of historical partition logs across the network.
* **Over $80\%$ Reduction in Storage Costs**: Automatically tiering historical event logs to S3 object storage slashes cluster storage infrastructure expenses compared to holding all logs on local NVMe SSDs.
