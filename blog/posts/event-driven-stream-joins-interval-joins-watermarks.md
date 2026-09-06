# Event-Driven Stream Joins: Interval Joins, Temporal Tables & Watermark Alignment

In real-time event-driven architectures (e-commerce order processing, real-time ad attribution, high-frequency trading), combining information from two independent event streams is a fundamental requirement.

For example, an analytics system must join an `AdClick` event stream with a `Purchase` event stream to calculate conversion attribution.

However, joining two unbounded streams ($A \bowtie B$) in a distributed engine (**Apache Flink**, **Kafka Streams**, **Spark Streaming**) presents a major challenge.

If a stream engine attempts to join streams without time bounds, it must retain the **entire infinite history** of both streams in memory, causing out-of-memory crashes.

To bound state memory consumption, real-time stream engines utilize **Interval Joins**, **Temporal Table Joins**, and **Watermark Alignment**.

This article details relative interval boundaries ($[t - \tau_1, t + \tau_2]$), temporal state lookup versions, and state eviction mechanisms.

---

## Stream-Stream Interval Join & Watermark Architecture

How Interval Joins restrict state retention to relative time windows $[t - 5\text{min}, t + 10\text{min}]$:

```mermaid
graph TD
  subgraph SG1_UnboundedInputStream ["Unbounded Input Stream A (AdClick Stream)"]
    ClickStream[AdClick Event: click_id=101, timestamp=10:00] -->|KeyBy click_id| JoinOp[Stateful Stream Interval Join Operator]
  end
  
  subgraph SG2_UnboundedInputStream ["Unbounded Input Stream B (Purchase Stream)"]
    PurchaseStream[Purchase Event: click_id=101, timestamp=10:04] -->|KeyBy click_id| JoinOp
  end
  
  subgraph SG3_IntervalJoinState ["Interval Join State Retention Window [-1min, +10min]"]
    JoinOp <-->|Check State: 10:00 - 1min <= 10:04 <= 10:00 + 10min| StateA[(Stream A State Buffer)]
    JoinOp <-->|Match Found!| StateB[(Stream B State Buffer)]
  end
  
  subgraph SG4_WatermarkStatePurging ["Watermark State Purging Engine"]
    Watermark[Watermark Advances to 10:15] -->|Purge Old Events <= 10:05| EvictState[🗑️ Purge Expired Stream States from RocksDB]
    JoinOp -->|Emit Joined Event| Output[Joined Stream: AdClick + Purchase Matched Payload!]
  end
```

### Core Stream Join Mechanics
1. **The Unbounded Join Memory Dilemma**: In relational SQL databases, a `JOIN` operates on finite static tables. In stream processing, events arrive continuously forever. Without time boundaries, the join state grows infinitely ($O(\infty)$ memory).
2. **Interval Joins (Relative Time Bounding)**:
   * Joins events from Stream A with events from Stream B if and only if Stream B's event timestamp $t_B$ falls within a relative time window surrounding Stream A's event timestamp $t_A$:
     $$t_A - \tau_{\text{lower}} \le t_B \le t_A + \tau_{\text{upper}}$$
   * *Example*: Join an `OrderPlaced` event at $10:00$ with a `PaymentReceived` event arriving between $09:59$ ($\tau_{\text{lower}} = 1\text{ min}$) and $10:10$ ($\tau_{\text{upper}} = 10\text{ min}$).
   * *State Purging*: Once the stream **Watermark** advances past $t_A + \tau_{\text{upper}}$, the stream engine safely purges $t_A$ from the local state backend (RocksDB), keeping memory consumption strictly bounded!
3. **Temporal Table Joins (Point-in-Time Dimension Joins)**:
   * Joins a fast-moving fact event stream (`Transactions`) with a slowly-changing dimension stream (`CurrencyExchangeRates`).
   * A Temporal Table tracks historical version changes of the dimension data. When processing a transaction at timestamp $10:05:22$, the join operator queries the dimension state as it existed at *that exact historical millisecond*, ensuring deterministic point-in-time joins even during out-of-order event replay.
4. **Watermark Alignment & Stream Skew**:
   * If Stream A is processing events at $10:10$ while Stream B lags behind at $09:55$ due to network delays, the join operator experiences **Stream Skew**.
   * Flink aligns stream watermarks by tracking $\min(\text{Watermark}_A, \text{Watermark}_B)$. State purging is held until the slowest input stream's watermark advances past the upper interval boundary.

---

## Python Implementation: Real-Time Interval Stream Join Engine

Here is a production-grade Python implementation of a Real-Time Interval Stream Join Engine featuring State Buffering, Match Evaluation, and Watermark State Purging:

```python
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel

class StreamEvent(BaseModel):
    join_key: str
    stream_name: str
    event_timestamp: float
    payload: Dict[str, str]

class IntervalStreamJoinEngine:
    """
    Simulates Apache Flink / Kafka Streams Interval Join (A join B on A.t - lower <= B.t <= A.t + upper).
    """
    def __init__(self, lower_bound_sec: float, upper_bound_sec: float):
        self.lower_bound = lower_bound_sec  # e.g., 60.0 (1 min before)
        self.upper_bound = upper_bound_sec  # e.g., 600.0 (10 min after)
        
        # Embedded State Buffers: {join_key: [StreamEvent]}
        self.buffer_A: Dict[str, List[StreamEvent]] = {}
        self.buffer_B: Dict[str, List[StreamEvent]] = {}
        self.current_watermark = 0.0

    def process_event_A(self, event: StreamEvent) -> List[Tuple[StreamEvent, StreamEvent]]:
        """Processes event from Stream A and matches against Stream B state buffer."""
        matched_pairs = []
        key = event.join_key

        if key not in self.buffer_A:
            self.buffer_A[key] = []
        self.buffer_A[key].append(event)

        # Match against buffered events in Stream B
        if key in self.buffer_B:
            for event_b in self.buffer_B[key]:
                # Check Interval Condition: t_A - lower <= t_B <= t_A + upper
                if (event.event_timestamp - self.lower_bound) <= event_b.event_timestamp <= (event.event_timestamp + self.upper_bound):
                    matched_pairs.append((event, event_b))
                    print(f" 🎉 [INTERVAL JOIN MATCH] Stream A ({event.payload}) <---> Stream B ({event_b.payload})")

        return matched_pairs

    def process_event_B(self, event: StreamEvent) -> List[Tuple[StreamEvent, StreamEvent]]:
        """Processes event from Stream B and matches against Stream A state buffer."""
        matched_pairs = []
        key = event.join_key

        if key not in self.buffer_B:
            self.buffer_B[key] = []
        self.buffer_B[key].append(event)

        # Match against buffered events in Stream A
        if key in self.buffer_A:
            for event_a in self.buffer_A[key]:
                # Check Interval Condition: t_A - lower <= t_B <= t_A + upper
                if (event_a.event_timestamp - self.lower_bound) <= event.event_timestamp <= (event_a.event_timestamp + self.upper_bound):
                    matched_pairs.append((event_a, event))
                    print(f" 🎉 [INTERVAL JOIN MATCH] Stream A ({event_a.payload}) <---> Stream B ({event.payload})")

        return matched_pairs

    def advance_watermark(self, new_watermark: float):
        """Purges old events from state buffers that can no longer match future events."""
        self.current_watermark = new_watermark
        print(f"\n 🌊 [Watermark Advanced] Current Watermark: {self.current_watermark:.1f}s -> Purging Expired States...")

        # Purge Stream A events where t_A + upper_bound < watermark
        for key in list(self.buffer_A.keys()):
            self.buffer_A[key] = [e for e in self.buffer_A[key] if (e.event_timestamp + self.upper_bound) >= self.current_watermark]
            if not self.buffer_A[key]:
                del self.buffer_A[key]

        # Purge Stream B events where t_B + lower_bound < watermark
        for key in list(self.buffer_B.keys()):
            self.buffer_B[key] = [e for e in self.buffer_B[key] if (e.event_timestamp + self.lower_bound) >= self.current_watermark]
            if not self.buffer_B[key]:
                del self.buffer_B[key]

        print(" 🗑️ [State Purge Complete] Expired state removed from memory.")

# Demonstration Execution
if __name__ == "__main__":
    # Interval Join Window: -10s to +30s
    join_engine = IntervalStreamJoinEngine(lower_bound_sec=10.0, upper_bound_sec=30.0)

    print("🚀 Demonstrating Real-Time Event-Driven Interval Stream Joins...")
    print("=" * 75)

    # 1. AdClick Event arrives at t=100s (Stream A)
    click_evt = StreamEvent(
        join_key="click_999", stream_name="AdClick", event_timestamp=100.0, payload={"ad_id": "campaign_banner"}
    )
    join_engine.process_event_A(click_evt)

    # 2. Purchase Event arrives at t=115s (Stream B) -> Within [100 - 10, 100 + 30] interval!
    purchase_evt = StreamEvent(
        join_key="click_999", stream_name="Purchase", event_timestamp=115.0, payload={"amount": "$120"}
    )
    join_engine.process_event_B(purchase_evt)

    # 3. Advance Watermark to t=150s -> Triggers State Purge!
    join_engine.advance_watermark(new_watermark=150.0)
```

---

## Stream Join Gotchas & Best Practices

When building stream join pipelines:

> [!IMPORTANT]
> **Key By High-Cardinality Join Keys**: Ensure that input streams are partitioned using `keyBy(join_key)` before entering the join operator. This distributes join state evenly across worker task slots, avoiding single-node memory bottlenecks.

> [!CAUTION]
> **Beware of Out-of-Order Watermark Drops**: If an event arrives with a timestamp older than the current stream watermark, default stream engines drop the event without passing it to the join operator (**Late Data Loss**). Configure **Allowed Lateness** or side-outputs to capture late-arriving join events.

---

## Real-World Enterprise Impact
Stream join architectures (such as **Flink SQL**, **Kafka Streams**, and **Spark Structured Streaming**) report:
* **Sub-Second Ad Conversion Attribution**: Matching millions of mobile ad clicks with real-time in-app purchases as events stream through the system.
* **Bounded RocksDB Memory Growth**: Interval boundaries and watermark state purging prevent memory bloat, allowing stream joins to run continuously for years without manual intervention.
