# B-Tree Index Internals: B+Trees, Page Splitting, Latch Crabbing & Write Amplification

In relational storage engines (**PostgreSQL btree**, **MySQL InnoDB**, **SQLite**, **Oracle**), **B+Trees** are the foundational data structure driving primary keys and secondary indexes.

Unlike standard in-memory binary search trees (AVL, Red-Black), B+Trees are specifically engineered for **block-oriented disk and NVMe storage**.

With a high branching factor $B$ (typically hundreds of keys per $8\text{ KB}$ page), a B+Tree can index billions of rows with a tree height of only $3$ or $4$ disk seeks.

However, supporting concurrent read/write transactions at high throughput requires managing complex physical page layouts (**Slotted-Page Architecture**), handling **Page Splitting**, and preventing concurrency deadlocks via **Latch Crabbing (Lock Coupling)**.

This article details B+Tree slotted page layouts, Page Splitting algorithms, Latch Crabbing concurrency protocols, and Write Amplification mitigation.

---

## 📖 B+Tree Page Layout & Latch Crabbing Architecture

How Slotted-Page layouts organize tuples inside $8\text{ KB}$ disk blocks and how Latch Crabbing lock coupling navigates concurrent trees:

```mermaid
graph TD
  subgraph Slotted-Page Disk Block Layout (8 KB Fixed Size)
    Header[Page Header: LSN, Slot Count, Free Space Pointer] --> SlotArray[Slot Array: Slot 0 Offset, Slot 1 Offset...]
    SlotArray --> FreeSpace[<-- Free Space Gap -->]
    FreeSpace --> TupleData[Tuple 1 Data | Tuple 0 Data (Grows Backwards)]
  end
  
  subgraph Latch Crabbing Concurrency Protocol (Lock Coupling)
    ReadOp[Read Request: Key = 42] -->|1. Acquire Read Latch| Root[Root Node Page 0]
    Root -->|2. Read Child Page P1 Pointer| Child[Internal Node Page P1]
    Child -->|3. Acquire Read Latch on P1 FIRST| ChildLatch[Child Latch Held]
    ChildLatch -->|4. Safe! Release Read Latch on Root| ReleaseRoot[Release Parent Latch]
    ReleaseRoot -->|5. Traverse to Leaf Page| Leaf[Leaf Page P9: Return Value]
  end
```

### Core B+Tree Mechanics
1. **B+Tree vs Classic B-Tree Structural Difference**:
   * *B-Tree*: Stores data key-value records in both internal nodes and leaf nodes.
   * *B+Tree*: Stores actual data tuples (or row pointers) **exclusively in leaf nodes**. Internal nodes store only search key routers. Leaf nodes are linked together via a doubly-linked list (`prev_page_id`, `next_page_id`), allowing sequential range scans (`WHERE age >= 21 AND age <= 30`) to traverse leaves horizontally without re-traversing parent nodes.
2. **Slotted-Page Architecture**:
   * Fixed-size disk blocks ($8\text{ KB}$ in PostgreSQL, $16\text{ KB}$ in InnoDB) cannot assume fixed-width tuples.
   * *Slot Array*: An array of 2-byte offsets growing forward from the page header.
   * *Tuple Data*: Variable-length row byte arrays growing backward from the end of the page.
   * *De-fragmentation*: Deleting a row simply marks its slot offset as empty. When free space becomes fragmented, the storage engine executes a page compaction routine.
3. **Page Splitting & Write Amplification**:
   * When an insertion targets a leaf page that lacks free space, the page splits $50/50$ into two sibling pages. A middle key is promoted to the parent node.
   * *Write Amplification*: Inserting a single $100\text{-byte}$ row into a full page forces the engine to rewrite an entire $8\text{ KB}$ or $16\text{ KB}$ page to disk, causing high disk write amplification.
4. **Latch Crabbing (Lock Coupling)**:
   * To prevent thread race conditions without locking the entire tree:
   * *Read Traversal*: A thread acquires a Read Latch on child node $C$ *before* releasing the Read Latch on parent node $P$.
   * *Write Traversal*: A thread acquires a Write Latch on parent node $P$. If child $C$ is **Safe** (has space for insertion without splitting), the thread releases the Write Latch on $P$ and all ancestors.

---

## 🛠️ Python Implementation: Slotted-Page B+Tree & Latch Crabbing Engine

Here is a production-grade Python implementation of a Slotted-Page B+Tree Node Layout and Latch Crabbing Traversal Engine:

```python
import struct
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel

class SlottedPage:
    """
    Simulates a 512-Byte Disk Block with Slotted-Page Architecture.
    """
    PAGE_SIZE = 512
    HEADER_SIZE = 12  # LSN (8B), SlotCount (2B), FreeSpaceOffset (2B)

    def __init__(self, page_id: int):
        self.page_id = page_id
        self.lsn = 0
        self.slot_offsets: List[int] = []
        self.data_bytes = bytearray(self.PAGE_SIZE)
        self.free_space_offset = self.PAGE_SIZE  # Grows backward from end of page

    def insert_tuple(self, key_id: int, payload: str) -> bool:
        """Inserts variable-length tuple into Slotted Page layout."""
        encoded_data = f"{key_id}:{payload}".encode("utf-8")
        data_len = len(encoded_data)
        needed_space = 2 + data_len  # 2 bytes for slot offset + data bytes
        
        current_free_space = self.free_space_offset - (self.HEADER_SIZE + len(self.slot_offsets) * 2)

        if needed_space > current_free_space:
            print(f" ⚠️ [Page #{self.page_id} Full!] Free Space ({current_free_space}B) < Needed ({needed_space}B). Triggers Page Split!")
            return False

        # Write tuple data at end of page
        self.free_space_offset -= data_len
        self.data_bytes[self.free_space_offset : self.free_space_offset + data_len] = encoded_data

        # Add slot offset pointer
        self.slot_offsets.append(self.free_space_offset)
        print(f" 📥 [Page #{self.page_id} Insert] Key '{key_id}' written at offset {self.free_space_offset} (Total Slots: {len(self.slot_offsets)})")
        return True

class BPlusTreeNode:
    def __init__(self, node_id: int, is_leaf: bool = False):
        self.node_id = node_id
        self.is_leaf = is_leaf
        self.keys: List[int] = []
        self.children: List['BPlusTreeNode'] = [] # Internal Node Pointers
        self.slotted_page = SlottedPage(page_id=node_id)
        self.next_leaf: Optional['BPlusTreeNode'] = None
        self.is_latched: bool = False

class BPlusTreeEngine:
    """
    Simulates B+Tree Traversal with Latch Crabbing Concurrency Protocol.
    """
    def __init__(self):
        self.root = BPlusTreeNode(node_id=0, is_leaf=True)
        self.node_counter = 0

    def search_latch_crabbing(self, search_key: int) -> BPlusTreeNode:
        """
        Executes Latch Crabbing Read Traversal (Acquire Child Latch -> Release Parent Latch).
        """
        curr = self.root
        curr.is_latched = True
        print(f" 🔒 [Latch Crabbing] Acquired Read Latch on Root Node #{curr.node_id}")

        while not curr.is_leaf:
            # Find target child index
            idx = 0
            while idx < len(curr.keys) and search_key >= curr.keys[idx]:
                idx += 1
            
            child = curr.children[idx]
            
            # Latch Crabbing Lock Coupling Step:
            # 1. Acquire Latch on Child FIRST
            child.is_latched = True
            print(f" 🔒 [Latch Crabbing] Acquired Read Latch on Child Node #{child.node_id}")
            
            # 2. Release Latch on Parent
            curr.is_latched = False
            print(f" 🔓 [Latch Crabbing] Released Read Latch on Parent Node #{curr.node_id}")
            
            curr = child

        print(f" 🎯 [Latch Crabbing Success] Arrived at Target Leaf Node #{curr.node_id} for Key {search_key}!")
        return curr

# Demonstration Execution
if __name__ == "__main__":
    # Initialize B+Tree
    tree = BPlusTreeEngine()

    print("🚀 Demonstrating B+Tree Slotted-Page Layout & Latch Crabbing...")
    print("=" * 75)

    # 1. Test Slotted Page Allocations
    page = SlottedPage(page_id=101)
    page.insert_tuple(1001, "Alice_User_Record")
    page.insert_tuple(1002, "Bob_User_Record")

    # 2. Construct Mock B+Tree Hierarchy for Latch Crabbing
    root_node = BPlusTreeNode(node_id=0, is_leaf=False)
    leaf1 = BPlusTreeNode(node_id=1, is_leaf=True)
    leaf2 = BPlusTreeNode(node_id=2, is_leaf=True)

    root_node.keys = [50]
    root_node.children = [leaf1, leaf2]
    tree.root = root_node

    # 3. Execute Latch Crabbing Search
    print("\n🔍 Executing Latch Crabbing Search for Key = 75:")
    target_leaf = tree.search_latch_crabbing(search_key=75)
```

---

## 🚨 B+Tree Storage Gotchas & Best Practices

When tuning B+Tree indexes:

> [!IMPORTANT]
> **Use Fillfactor for Update-Heavy Tables**: In PostgreSQL, setting `FILLFACTOR = 80` on B+Tree indexes leaves $20\%$ empty space on leaf pages during creation. This space absorbs future `UPDATE` row additions without triggering immediate costly Page Splits.

> [!CAUTION]
> **Beware of Index Bloat on Random UUID Primary Keys**: Inserting random 128-bit UUIDs as primary keys causes random B+Tree leaf insertions, forcing constant page splits across the entire index tree (**Index Fragmentation**). Use sequential UUIDs (UUIDv7) or auto-incrementing integers.

---

## 📈 Real-World Enterprise Impact
Storage engines deploying B+Tree slotted pages and latch crabbing (such as **PostgreSQL**, **MySQL InnoDB**, and **SQLite**) report:
* **$O(\log_B N)$ Lightning-Fast Point Lookups**: Reading keys from a billion-row table in under $4$ physical disk block seeks.
* **Deadlock-Free Concurrent Index Operations**: Latch crabbing lock coupling enables thousands of concurrent threads to traverse and modify index pages simultaneously.
