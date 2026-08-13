# B+ Tree Index Engineering: Page Layouts, Buffer Pools & Slotted Pages

Relational database management systems (RDBMS) like **PostgreSQL**, **MySQL (InnoDB)**, and **SQLite** have relied on **B+ Trees** as their core storage engine representation for over four decades. Unlike standard binary search trees, B+ Trees are self-balancing, high-fanout $N$-ary trees specifically optimized for block-based disk storage hardware.

In a B+ Tree, all actual table records reside exclusively in doubly-linked **leaf nodes**, while **internal nodes** hold only routing keys.

To manage disk pages in memory without exhausting RAM or triggering operating system page faults, storage engines deploy a **Buffer Pool Manager** operating over **Slotted Page** binary disk layouts.

This article explores the low-level disk page layouts, buffer pool eviction strategies, and node split mechanics of B+ Tree engines.

---

## 📖 Slotted Page Layout & B+ Tree Architecture

The binary memory layout of an 8KB/16KB slotted page and leaf node linkage:

```mermaid
graph TD
  subgraph Slotted Page Binary Layout (8KB / 16KB Page)
    A[Page Header: LSN, Slot Count, Free Space Offset] --> B[Slot Array: Offset & Length Pointers]
    B -->|Unused Free Space Window| C[Tuple Data Storage: Grows Bottom-Up]
  end
  
  subgraph B+ Tree Index Hierarchy
    D[Root Node: Internal Routing Keys] --> E[Child Node 1: Internal]
    D --> F[Child Node 2: Internal]
    
    E --> G[Leaf Page 101: Data Records]
    E --> H[Leaf Page 102: Data Records]
    F --> I[Leaf Page 103: Data Records]
    
    G <-->|Doubly-Linked Range Scan| H
    H <-->|Doubly-Linked Range Scan| I
  end
```

### Core B+ Tree Engineering Primitives
1. **Slotted-Page Architecture**: Disk pages are divided into fixed sizes (e.g. 8KB in Postgres, 16KB in InnoDB). The slot array grows from the top down (storing 2-byte tuple offsets), while tuple bytes are written from the bottom up. This design allows variable-length records to be inserted or deleted without re-organizing the entire page file.
2. **Buffer Pool Manager**: Intercepts page requests from the execution engine. If a requested `page_id` is in the buffer pool frame array, it pins the page in RAM. If missing (cache miss), it fetches the page from disk, evicting cold "dirty" pages using **LRU-K** or **Clock-Sweep** algorithms.
3. **Latch Crabbing**: To allow concurrent thread queries without corruption, threads traverse the B+ Tree using latch crabbing: acquiring a read/write latch on a child node before releasing the latch on its parent.

---

## 🛠️ Python Implementation: Slotted Page & Buffer Pool Engine

Here is a production-grade Python simulation of a Slotted Page data layout and LRU Buffer Pool Manager:

```python
import struct
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel

class SlottedPage:
    """
    Simulates a fixed 512-byte slotted page layout.
    Slot array grows top-down (index 0..N), tuple data grows bottom-up (512..0).
    """
    PAGE_SIZE = 512

    def __init__(self, page_id: int):
        self.page_id = page_id
        self.header_size = 8  # 4-byte LSN, 2-byte slot_count, 2-byte free_space_pointer
        self.slot_count = 0
        self.free_space_pointer = self.PAGE_SIZE  # Starts at bottom of page
        self.slots: List[Tuple[int, int]] = []    # [(offset, length)]
        self.tuples: Dict[int, str] = {}           # slot_index -> tuple_data

    def insert_tuple(self, tuple_data: str) -> Optional[int]:
        data_bytes = tuple_data.encode('utf-8')
        needed_space = 4 + len(data_bytes)  # 4 bytes for slot entry + data length
        
        current_free_bytes = self.free_space_pointer - (self.header_size + self.slot_count * 4)
        if needed_space > current_free_bytes:
            print(f" ⚠️ [Page #{self.page_id}] Out of free space! Needed {needed_space}B, available {current_free_bytes}B.")
            return None

        # Write data bottom-up
        self.free_space_pointer -= len(data_bytes)
        slot_index = self.slot_count
        self.slots.append((self.free_space_pointer, len(data_bytes)))
        self.tuples[slot_index] = tuple_data
        self.slot_count += 1

        print(f" 📄 [Page #{self.page_id}] Inserted Tuple '{tuple_data}' at Slot {slot_index} (Free Space: {self.free_space_pointer}B)")
        return slot_index

class BufferPoolManager:
    """
    Manages fixed-capacity page frames in RAM using LRU eviction.
    """
    def __init__(self, capacity_frames: int = 2):
        self.capacity = capacity_frames
        self.frames: Dict[int, SlottedPage] = {}
        self.lru_order: List[int] = []

    def fetch_page(self, page_id: int, disk_pages: Dict[int, SlottedPage]) -> SlottedPage:
        # 1. Buffer Pool Hit
        if page_id in self.frames:
            self.lru_order.remove(page_id)
            self.lru_order.append(page_id)
            print(f" 🎯 [Buffer Pool Hit] Page #{page_id} served from RAM frame.")
            return self.frames[page_id]

        # 2. Buffer Pool Miss -> Evict LRU if at capacity
        print(f" 💾 [Buffer Pool Miss] Fetching Page #{page_id} from disk...")
        if len(self.frames) >= self.capacity:
            evicted_id = self.lru_order.pop(0)
            del self.frames[evicted_id]
            print(f" ♻️ [LRU Eviction] Evicted Page #{evicted_id} from RAM to make room.")

        # Load page into frame
        page = disk_pages[page_id]
        self.frames[page_id] = page
        self.lru_order.append(page_id)
        return page

# Demonstration Execution
if __name__ == "__main__":
    # Create 3 disk pages
    disk_storage = {
        101: SlottedPage(101),
        102: SlottedPage(102),
        103: SlottedPage(103)
    }

    # Populate slotted tuples
    disk_storage[101].insert_tuple("order_id: 8891, amt: 45.00")
    disk_storage[101].insert_tuple("order_id: 8892, amt: 120.50")
    disk_storage[102].insert_tuple("order_id: 8893, amt: 300.00")

    # Initialize Buffer Pool Manager with 2-frame RAM limit
    bpm = BufferPoolManager(capacity_frames=2)

    print("\n🚀 Testing Buffer Pool Fetch & LRU Evictions...")
    print("=" * 75)

    bpm.fetch_page(101, disk_storage)
    bpm.fetch_page(102, disk_storage)
    bpm.fetch_page(101, disk_storage)  # Hit, moves 101 to MRU
    bpm.fetch_page(103, disk_storage)  # Miss, evicts 102 (LRU)
```

---

## 🚨 B+ Tree Production Gotchas & Mitigation

When configuring B+ Tree storage engines:

> [!IMPORTANT]
> **Mitigate Page Fragmentation with Vacuum / Defrag**: Deleting tuples from slotted pages leaves empty holes in the slot array. Over time, pages suffer from internal fragmentation. Relational engines run background vacuum processes (like Postgres `VACUUM`) to compact tuples bottom-up and reclaim contiguous free space.

> [!CAUTION]
> **Avoid Unindexed Random Insertions on Sequential Primary Keys**: Inserting UUIDs or random hashes as primary keys causes random B+ Tree node splits across arbitrary pages, causing severe page fill-factor degradation (down to 50% utilization). Use monotonically increasing IDs (Auto-Increment or TSID) to keep insertions at the rightmost leaf node.

---

## 📈 Real-World Enterprise Impact
Teams leveraging B+ Tree index optimizations report:
* **Sub-Millisecond Single-Key Lookups**: High fanout internal nodes enable reaching target leaf tuples in 3 to 4 page hops across multi-gigabyte tables.
* **Efficient Range Scans**: Doubly-linked leaf nodes allow executing SQL range queries (`WHERE id BETWEEN 100 AND 500`) without traversing root index nodes repeatedly.
