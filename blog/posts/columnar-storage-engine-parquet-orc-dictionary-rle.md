# Columnar Storage Engine Internals: Parquet, ORC, Dictionary Encoding & Run-Length Encoding (RLE)

In high-throughput Analytical OLAP (Online Analytical Processing) workloads (**Snowflake**, **ClickHouse**, **Apache Spark**, **DuckDB**, **Google BigQuery**), applications process petabytes of historical data.

Traditional relational databases store data in a **Row-Oriented Layout** (PostgreSQL, MySQL), where all attributes of a single row are stored contiguously on disk.

If an analytical query executes `SELECT country, SUM(revenue) FROM sales`, a row-oriented database must read **100% of all disk bytes** across all 100 table columns just to inspect 2 attributes.

To eliminate wasteful disk I/O, modern analytical storage engines utilize a **Columnar Storage Layout** (**Apache Parquet**, **Apache ORC**).

By storing each column contiguously in dedicated memory buffers and compressing values using **Dictionary Encoding** and **Run-Length Encoding (RLE)**, columnar engines achieve up to **$10\times$ data compression** and **$100\times$ faster query execution**.

This article details Parquet/ORC file layouts, Dictionary Encoding, RLE compression, SIMD bit-packing, and Predicate Pushdown index pruning.

---

## Columnar Storage File Architecture & Compression Techniques

How Apache Parquet organizes Row Groups, Column Chunks, and RLE Dictionary Encoding:

```mermaid
graph TD
  subgraph SG1_RowOrientedVs ["Row-Oriented vs Columnar Memory Layout"]
    RowLayout["Row-Oriented (PostgreSQL): [Row0: id, country, rev] [Row1: id, country, rev]"]
    ColLayout["Columnar (Parquet): [Country Col: US, US, CA...] [Revenue Col: 100, 200, 150...]"]
  end
  
  subgraph SG2_ApacheParquetFile ["Apache Parquet File Structure (128 MB Row Groups)"]
    ColLayout --> RowGroup1[Row Group 1: 1,000,000 Rows]
    RowGroup1 --> ColChunk1[Column Chunk: 'Country' Data]
    RowGroup1 --> ColChunk2[Column Chunk: 'Revenue' Data]
    
    ColChunk1 --> DictPage[Dictionary Page: 0='US', 1='CA', 2='DE']
    ColChunk1 --> DataPage[RLE Data Page: (3, id=0), (2, id=1)]
  end
  
  subgraph SG3_QueryExecutionProjection ["Query Execution: Projection & Predicate Pushdown"]
    DataPage -->|1. Min/Max Statistics Check: Skip Group if max < 200| Pruning[Row Group Pruned!]
    DataPage -->|2. SIMD Vector Execution| SIMD[Execute SUM directly on Compressed Array!]
  end
```

### Core Columnar Storage Concepts
1. **Row-Oriented vs Columnar Data Layout**:
   * *Row-Oriented*: `[R0_C0, R0_C1, R0_C2], [R1_C0, R1_C1, R1_C2]`. Ideal for OLTP transactional point lookups and single-row inserts (`INSERT INTO users`).
   * *Columnar*: `[R0_C0, R1_C0, R2_C0], [R0_C1, R1_C1, R2_C1]`. Ideal for OLAP analytics scans. Reading column `C1` skips 100% of memory bytes allocated to `C0` and `C2` (**Projection Pushdown**).
2. **Apache Parquet File Structure**:
   * **Row Groups**: Horizontal partitioning of data into large chunks ($128\text{ MB}$ to $512\text{ MB}$), containing roughly $1,000,000$ rows each.
   * **Column Chunks**: Vertical division of a Row Group containing data for a single column.
   * **Pages**: Column chunks are further subdivided into $1\text{ MB}$ Data Pages and Dictionary Pages.
3. **Dictionary Encoding**:
   * Replaces repeated string or categorical values (e.g. `"United States"`, `"California"`) with compact $1\text{-byte}$ or $2\text{-byte}$ integer Dictionary IDs (`0`, `1`, `2`).
   * Reduces memory footprint by up to $90\%$ for low-cardinality columns.
4. **Run-Length Encoding (RLE) & Bit-Packing**:
   * Compresses consecutive identical values into `(count, value)` tuples. For example, a column containing `["US", "US", "US", "US", "US"]` (Dictionary ID `0`) is compressed into a single 2-byte pair: `(count=5, id=0)`.
   * **Operating on Compressed Data**: Modern query engines (**DuckDB**, **ClickHouse**) execute aggregations directly over RLE dictionary arrays without decompressing values back to raw strings, leveraging CPU SIMD vector registers!
5. **Predicate Pushdown (Min/Max Index Pruning)**:
   * Every Column Chunk footer stores pre-computed metadata statistics: `min_value`, `max_value`, and `null_count`.
   * If a query specifies `WHERE revenue > 1000`, and a Row Group's metadata reports `max_value = 500`, the query engine **skips reading the entire 128 MB Row Group from disk** without opening a single data page!

---

## Python Implementation: Columnar Storage Engine with RLE & Predicate Pushdown

Here is a production-grade Python implementation of a Columnar File Storage Engine featuring Dictionary Encoding, Run-Length Encoding (RLE), and Predicate Pushdown:

```python
from typing import Dict, List, Tuple, Any, Optional
from pydantic import BaseModel

class ColumnChunkMetadata(BaseModel):
    column_name: str
    min_value: Any
    max_value: Any
    num_values: int

class CompressedColumnChunk(BaseModel):
    metadata: ColumnChunkMetadata
    dictionary: List[str]               # Dictionary Page: [id -> raw_str]
    rle_data: List[Tuple[int, int]]     # Data Page RLE: [(count, dict_id)]

class ColumnarStorageEngine:
    """
    Simulates Apache Parquet Columnar File Layout with RLE & Predicate Pushdown.
    """
    def __init__(self):
        self.column_chunks: Dict[str, CompressedColumnChunk] = {}

    def write_column(self, col_name: str, raw_values: List[str]):
        """Encodes column into Dictionary + RLE compressed pages."""
        if not raw_values:
            return

        # 1. Build Dictionary Page
        dictionary: List[str] = []
        dict_map: Dict[str, int] = {}
        for val in raw_values:
            if val not in dict_map:
                dict_map[val] = len(dictionary)
                dictionary.append(val)

        # 2. Convert to Dictionary IDs
        encoded_ids = [dict_map[v] for v in raw_values]

        # 3. Perform Run-Length Encoding (RLE)
        rle_data: List[Tuple[int, int]] = []
        current_id = encoded_ids[0]
        current_count = 0

        for dict_id in encoded_ids:
            if dict_id == current_id:
                current_count += 1
            else:
                rle_data.append((current_count, current_id))
                current_id = dict_id
                current_count = 1
        rle_data.append((current_count, current_id))

        # 4. Generate Min/Max Metadata Index
        min_val = min(raw_values)
        max_val = max(raw_values)
        meta = ColumnChunkMetadata(
            column_name=col_name, min_value=min_val, max_value=max_val, num_values=len(raw_values)
        )

        self.column_chunks[col_name] = CompressedColumnChunk(
            metadata=meta, dictionary=dictionary, rle_data=rle_data
        )

        raw_size = sum(len(v) for v in raw_values)
        comp_size = len(dictionary) * 8 + len(rle_data) * 4
        print(f" 📥 [Columnar Write] Column '{col_name}' ({len(raw_values)} rows) -> Raw Size: {raw_size}B | Compressed Size: {comp_size}B (Compression Ratio: {raw_size/comp_size:.1f}x)")

    def query_filter_scan(self, col_name: str, filter_equals: str) -> Optional[int]:
        """
        Executes Vectorized Scan with Predicate Pushdown Pruning.
        """
        if col_name not in self.column_chunks:
            return None

        chunk = self.column_chunks[col_name]
        meta = chunk.metadata

        print(f"\n🔍 Querying Column '{col_name}' WHERE {col_name} == '{filter_equals}'")

        # 1. PREDICATE PUSHDOWN INDEX CHECK
        if filter_equals < meta.min_value or filter_equals > meta.max_value:
            print(f" 🛑 [PREDICATE PUSHDOWN PRUNED!] Target '{filter_equals}' outside Min/Max bounds [{meta.min_value} .. {meta.max_value}]. Skipped disk scan!")
            return 0

        print(f" ⚡ [Metadata Check Passed] Target within bounds [{meta.min_value} .. {meta.max_value}]. Scanning RLE pages...")

        # 2. VECTORIZED RLE SCAN
        if filter_equals not in chunk.dictionary:
            print(" 🛑 Value not present in Dictionary! Zero matches.")
            return 0

        target_dict_id = chunk.dictionary.index(filter_equals)
        match_count = 0

        # Scan RLE tuples directly without full decompression!
        for count, dict_id in chunk.rle_data:
            if dict_id == target_dict_id:
                match_count += count

        print(f" 🎉 [Scan Complete] Found {match_count} matching rows directly in compressed RLE stream!")
        return match_count

# Demonstration Execution
if __name__ == "__main__":
    storage = ColumnarStorageEngine()

    print("🚀 Demonstrating Parquet/ORC Columnar Storage & RLE Compression...")
    print("=" * 75)

    # Low-cardinality country data (100 rows with repeating runs)
    country_data = ["United States"] * 40 + ["Canada"] * 30 + ["Germany"] * 30

    # Write column data
    storage.write_column("country", country_data)

    # Query 1: Valid Target within Range
    storage.query_filter_scan("country", filter_equals="Canada")

    # Query 2: Target Outside Min/Max Bounds (Triggers Predicate Pushdown Pruning!)
    storage.query_filter_scan("country", filter_equals="Zambia")
```

---

## Columnar Storage Gotchas & Best Practices

When building columnar data systems:

> [!IMPORTANT]
> **Sort Data by High-Cardinality Columns Before Writing**: Sorting your dataset by key columns (`ORDER BY country, date`) groups identical values together in long contiguous runs, maximizing RLE compression ratios and improving Min/Max index pruning efficiency.

> [!CAUTION]
> **Avoid Small Row Groups**: Creating small Parquet files with tiny Row Groups (e.g. $1\text{ MB}$ row groups containing $5,000$ rows) ruins columnar compression performance and overloads object storage metadata catalog APIs (**Small File Problem**). Aim for $128\text{ MB} - 512\text{ MB}$ row groups.

---

## Real-World Enterprise Impact
Columnar storage deployments (such as **Apache Parquet**, **Snowflake**, **ClickHouse**, and **DuckDB**) report:
* **Over $90\%$ Disk Space Savings**: Combining dictionary encoding, RLE compression, and Snappy/ZSTD compression slashes petabyte storage footprints.
* **$100\times$ Faster Analytical Queries**: Reading only required columns and pruning irrelevant row groups via Predicate Pushdown accelerates analytical SQL scans by orders of magnitude.
