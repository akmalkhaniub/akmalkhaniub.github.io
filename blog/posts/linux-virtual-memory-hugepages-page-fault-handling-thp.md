# Linux Virtual Memory Architecture: HugePages, Page Fault Handling & THP

In high-performance database storage engines (such as PostgreSQL, Redis, MongoDB, and RocksDB) running on modern Linux servers with terabytes of RAM, CPU performance is heavily influenced by **Linux Virtual Memory Management**.

By default, the Linux kernel divides physical memory into **4 KB Page Frames**.

To translate a virtual memory address used by an application to a physical RAM address, the CPU Memory Management Unit (MMU) traverses a 4-level page table hierarchy (PGD → PUD → PMD → PTE).

For an application utilizing $512\text{ GB}$ of RAM, the Linux kernel must track over **134 million page table entries**, consuming over $1\text{ GB}$ of RAM just for page tables!

This causes severe **Translation Lookaside Buffer (TLB) Cache Thrashing**, where the CPU spends up to $20\%$ of its clock cycles resolving virtual memory page faults.

This article details Linux virtual memory page translation, Explicit HugePages, and Transparent Huge Pages (THP).

---

## Linux Virtual Memory Translation & HugePages Architecture

How 4-Level Page Table Translation works and how HugePages reduce TLB cache misses by 512x:

```mermaid
graph TD
  VirtualAddr[Virtual Memory Address: 0x7FFF80001000] --> MMU[CPU Memory Management Unit]
  
  subgraph CPU Cache Hardware
    MMU -->|1. Check TLB Hardware Cache| TLB{TLB Cache Hit?}
    TLB -->|Hit (sub-1ns)| PhysicalRAM[Physical RAM Address]
  end
  
  subgraph 4-Level Page Table Walk (TLB Miss Penalty ~10-20ns)
    TLB -.->|Miss: Traverse Page Hierarchy| PGD[1. Page Global Directory: PGD]
    PGD --> PUD[2. Page Upper Directory: PUD]
    PUD --> PMD[3. Page Middle Directory: PMD]
    PMD --> PTE[4. Page Table Entry: PTE (4KB Page)]
    PTE --> PhysicalRAM
  end
  
  subgraph HugePages Optimization (2MB Pages)
    PMD -.->|HugePage Bit Set| HugePageRAM[Physical 2MB HugePage Frame]
    HugePageRAM -->|Reduces TLB Entries by 512x!| PhysicalRAM
  end
```

### Core Virtual Memory Principles
1. **Virtual-to-Physical Address Translation**: Applications operate entirely within virtual address spaces. The hardware Memory Management Unit (MMU) translates virtual addresses to physical RAM addresses using page tables.
2. **Translation Lookaside Buffer (TLB)**: A small, high-speed CPU hardware cache (typically 1,500 entries) that stores recent virtual-to-physical page address mappings. A TLB hit resolves in $<1\text{ns}$, while a TLB miss forces a 4-level page table memory walk taking $15\text{ns}$ to $30\text{ns}$.
3. **Explicit HugePages (2 MB / 1 GB)**: Increases page size from $4\text{ KB}$ to $2\text{ MB}$ (or $1\text{ GB}$). A single $2\text{ MB}$ HugePage entry covers the same memory range as 512 standard $4\text{ KB}$ pages, reducing total page table entries and TLB cache misses by **$512\times$**.
4. **Transparent Huge Pages (THP) & `khugepaged`**: An OS kernel thread (`khugepaged`) that attempts to automatically collapse contiguous $4\text{ KB}$ pages into $2\text{ MB}$ HugePages in the background. However, `khugepaged` triggers synchronous memory defragmentation and allocation locks, causing **unpredictable $200\text{ms}$ to $1,000\text{ms}$ latency spikes** in databases!

---

## Python Implementation: Virtual Memory Page Table & TLB Simulator

Here is a production-grade Python simulation of a 4-Level Virtual Memory Page Table Translator comparing 4KB Standard Pages vs 2MB HugePages:

```python
import random
from typing import Dict, Tuple, Optional
from pydantic import BaseModel

class TLBCacheEntry(BaseModel):
    virtual_page_num: int
    physical_frame_num: int

class VirtualMemorySimulator:
    """
    Simulates Linux MMU Page Table Walk and TLB Cache Performance.
    Compares 4KB Standard Pages vs 2MB HugePages.
    """
    def __init__(self, tlb_size: int = 64):
        self.tlb_size = tlb_size
        self.tlb: Dict[int, int] = {}  # vpn -> pfn
        self.page_table_4kb: Dict[int, int] = {}  # vpn_4kb -> pfn
        self.page_table_2mb: Dict[int, int] = {}  # vpn_2mb -> pfn

    def populate_memory(self, total_ram_bytes: int):
        """Populates page tables for 4KB vs 2MB page configurations."""
        num_4kb_pages = total_ram_bytes // 4096
        num_2mb_pages = total_ram_bytes // (2 * 1024 * 1024)

        for vpn in range(num_4kb_pages):
            self.page_table_4kb[vpn] = vpn + 0x1000

        for vpn in range(num_2mb_pages):
            self.page_table_2mb[vpn] = vpn + 0x2000

        print(f" 💾 [Page Table Setup] Total RAM: {total_ram_bytes / (1024**2):.0f} MB")
        print(f"   • 4KB Config: Requiring {num_4kb_pages:,} Page Table Entries ({len(self.page_table_4kb) * 8 / 1024:.1f} KB Page Table Size)")
        print(f"   • 2MB Config: Requiring {num_2mb_pages:,} Page Table Entries ({len(self.page_table_2mb) * 8 / 1024:.1f} KB Page Table Size - 512x Smaller!)")

    def access_memory_4kb(self, virtual_addresses: List[int]) -> Tuple[int, int]:
        """Simulates memory access with 4KB pages and tracks TLB hits/misses."""
        self.tlb.clear()
        hits, misses = 0, 0

        for addr in virtual_addresses:
            vpn = addr // 4096
            if vpn in self.tlb:
                hits += 1
            else:
                misses += 1
                # Page table walk miss penalty + update TLB (LRU eviction)
                if len(self.tlb) >= self.tlb_size:
                    self.tlb.pop(next(iter(self.tlb)))
                self.tlb[vpn] = self.page_table_4kb.get(vpn, 0)
        return hits, misses

    def access_memory_2mb(self, virtual_addresses: List[int]) -> Tuple[int, int]:
        """Simulates memory access with 2MB HugePages and tracks TLB hits/misses."""
        self.tlb.clear()
        hits, misses = 0, 0
        huge_page_size = 2 * 1024 * 1024

        for addr in virtual_addresses:
            vpn = addr // huge_page_size
            if vpn in self.tlb:
                hits += 1
            else:
                misses += 1
                if len(self.tlb) >= self.tlb_size:
                    self.tlb.pop(next(iter(self.tlb)))
                self.tlb[vpn] = self.page_table_2mb.get(vpn, 0)
        return hits, misses

# Demonstration Execution
if __name__ == "__main__":
    sim = VirtualMemorySimulator(tlb_size=16)

    print("🚀 Demonstrating Linux Virtual Memory & HugePages Architecture...")
    print("=" * 75)

    # Populate 128 MB Virtual Memory Space
    ram_size = 128 * 1024 * 1024
    sim.populate_memory(ram_size)

    # Generate 1,000 random memory access addresses across 64 MB heap range
    random.seed(42)
    access_addresses = [random.randint(0, 64 * 1024 * 1024) for _ in range(1000)]

    # Run Benchmark for 4KB vs 2MB
    hits_4k, miss_4k = sim.access_memory_4kb(access_addresses)
    hits_2m, miss_2m = sim.access_memory_2mb(access_addresses)

    print(f"\n📊 Benchmark Memory Access Results (1,000 requests, TLB Capacity=16 entries):")
    print(f"   • 4KB Pages: {hits_4k} TLB Hits | {miss_4k} TLB Misses ({miss_4k/1000*100:.1f}% Miss Rate)")
    print(f"   • 2MB Pages: {hits_2m} TLB Hits | {miss_2m} TLB Misses ({miss_2m/1000*100:.1f}% Miss Rate - Dramatically Lower Hits Penalty!)")
```

---

## Linux Memory Architecture Gotchas & Best Practices

When operating Linux production servers:

> [!IMPORTANT]
> **Disable Transparent Huge Pages (THP) for Databases**: Always disable THP on Redis, MongoDB, PostgreSQL, and Elasticsearch servers by executing `echo never > /sys/kernel/mm/transparent_hugepage/enabled`. This prevents `khugepaged` background compaction latencies.

> [!CAUTION]
> **Use Explicit HugePages via `hugetlbfs`**: For latency-critical applications (like DPDK networking or Oracle/PostgreSQL shared buffers), allocate Explicit HugePages at boot time via sysctl (`vm.nr_hugepages = 1024`) and mount them via `hugetlbfs`.

---

## Real-World Enterprise Impact
Systems optimizing Linux virtual memory and HugePages report:
* **Over 15% CPU Performance Boost**: Reducing TLB cache misses allows CPU cores to execute application instructions without stalling on page table walks.
* **Elimination of 500ms Database Latency Spikes**: Disabling Transparent Huge Pages (THP) eliminates periodic allocation locks in Redis and MongoDB clusters.
