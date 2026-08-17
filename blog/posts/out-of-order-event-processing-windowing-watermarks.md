# Out-of-Order Event Processing: Tumbling, Sliding & Session Windows with Allowed Lateness

In distributed systems, physical network latency, mobile offline mode, and IoT device reconnections cause event streams to arrive **out-of-order**.

For example, a mobile gaming app registers a user purchase at $12:00:00$ PM (Event Time). Due to cellular disconnectivity in a tunnel, the event is uploaded to the cloud server at $12:05:00$ PM (Processing Time).

If a real-time stream engine aggregates data based on server wall-clock time (**Processing Time**), financial metrics and analytics reports become completely inaccurate.

To compute deterministic results despite network delays, modern stream engines (**Apache Flink**, **Apache Beam**, **Google Cloud Dataflow**) process data strictly in **Event Time** using **Watermarks**, **Windowing**, and **Allowed Lateness**.

This article details Event Time notions, Bounded-Out-Of-Orderness Watermarks, Tumbling/Sliding/Session window evaluation, and late-data side-outputs.

---

## 📖 Event Time & Watermark Architecture

How Watermarks track Event Time progress and trigger window computations despite out-of-order arrivals:

```mermaid
graph TD
  subgraph Real-World Out-of-Order Event Arrival (Event Time)
    E1["Event 1 (t=10:00)"] --> Broker[Kafka Stream Topic]
    E3["Event 3 (t=10:04)"] --> Broker
    E2["Event 2 (t=10:02 - Out-of-Order!)"] --> Broker
  end
  
  subgraph Watermark Generator (Bounded Out-of-Orderness: 2 mins)
    Broker -->|Generate Watermark: W = Max(t) - 2 mins| WMEngine[Watermark Generator Node]
    WMEngine -->|Emit WM: W(10:02)| StreamDAG[Stream Operator Window Processor]
  end
  
  subgraph Window Evaluation & Late Data Handling
    StreamDAG -->|Evaluate Window [10:00 .. 10:05]| WindowResult[Calculate 5-Min Aggregate]
    StreamDAG -->|Check Late Event (t < Current Watermark)| LateCheck{Is Event Timestamp < W(10:02)?}
    
    LateCheck -->|No: On-Time| NormalEval[Process in Window State]
    LateCheck -->|Yes: LATE DATA!| SideOutput[🚨 Emit to Allowed Lateness Side-Output Stream]
  end
```

### Core Time & Windowing Concepts
1. **The Three Notions of Time**:
   * **Event Time**: The timestamp embedded inside the record when the event originally occurred at the source device (e.g. mobile sensor). *Guarantees deterministic, reproducible results during backfills!*
   * **Ingestion Time**: The timestamp assigned when the event enters the central message broker (Kafka/Pulsar).
   * **Processing Time**: The local CPU system clock timestamp of the machine executing the stream transformation. *Lowest latency, but non-deterministic!*
2. **Watermarks (Bounded-Out-Of-Orderness)**:
   * A **Watermark** is a control signal flowing through the stream DAG asserting: *"No further records with Event Time $t \le \text{Watermark}$ will arrive."*
   * **Bounded-Out-Of-Orderness Heuristic**:
     $$\text{Watermark}(t) = \max(\text{EventTime}_{\text{seen}}) - \Delta_{\text{max\_lateness}}$$
     If the maximum expected network delay is $10\text{ seconds}$, a watermark lags behind the highest observed event time by $10\text{s}$.
3. **Window Types**:
   * **Tumbling Windows**: Fixed-size, contiguous, non-overlapping time buckets (e.g., $[12:00, 12:05)$, $[12:05, 12:10)$). Every event belongs to exactly one window.
   * **Sliding Windows**: Fixed-size, overlapping time buckets (e.g., a $10$-minute window that slides every $1$ minute). An event with $t=12:03$ belongs to 10 overlapping windows!
   * **Session Windows**: Dynamic, gap-based windows defined by periods of user inactivity (e.g., close session if no events arrive for $15\text{ minutes}$).
4. **Allowed Lateness & Side-Outputs**:
   * What happens when an extremely late event arrives with $t < \text{Watermark}$ after the target window has already closed and emitted its final result?
   * Stream engines provide **Allowed Lateness**: the window state is retained in RocksDB for an extra grace period (e.g., $1\text{ hour}$). Late events update the window result and re-emit an updated output. Events arriving *after* allowed lateness are routed to a **Side-Output Stream** for manual reconciliation.

---

## 🛠️ Python Implementation: Event Time Watermark & Session Window Engine

Here is a production-grade Python implementation of an Event Time Watermark Generator and Session Windowing Engine featuring Late Data Side-Outputs:

```python
from typing import Dict, List, Optional
from pydantic import BaseModel

class SensorEvent(BaseModel):
    user_id: str
    event_time: float      # Event Timestamp (sec)
    value: float

class SessionWindow(BaseModel):
    user_id: str
    start_time: float
    end_time: float
    events: List[SensorEvent]

class EventTimeWatermarkEngine:
    """
    Simulates Apache Flink Bounded-Out-Of-Orderness Watermark & Session Window Evaluator.
    """
    def __init__(self, max_lateness_sec: float = 5.0, session_inactivity_gap_sec: float = 10.0):
        self.max_lateness = max_lateness_sec
        self.inactivity_gap = session_inactivity_gap_sec
        self.max_observed_event_time = 0.0
        self.current_watermark = 0.0
        
        # Active Sessions per User: {user_id: [SessionWindow]}
        self.active_sessions: Dict[str, List[SessionWindow]] = {}
        self.side_output_late_events: List[SensorEvent] = []

    def process_event(self, event: SensorEvent):
        print(f" 📥 [Incoming Event] User '{event.user_id}' | EventTime: {event.event_time:.1f}s | Value: {event.value}")

        # 1. Update Max Observed Event Time & Advance Watermark
        if event.event_time > self.max_observed_event_time:
            self.max_observed_event_time = event.event_time
            self.current_watermark = self.max_observed_event_time - self.max_lateness
            print(f" 🌊 [Watermark Advanced] Current Watermark W = {self.current_watermark:.1f}s (Max Event Time seen: {self.max_observed_event_time:.1f}s)")

        # 2. Check if Event is LATE (Timestamp < Current Watermark)
        if event.event_time < self.current_watermark:
            print(f" 🚨 [LATE EVENT DETECTED!] Timestamp {event.event_time:.1f}s < Watermark {self.current_watermark:.1f}s! Routing to Side-Output.")
            self.side_output_late_events.append(event)
            return

        # 3. Add to Session Window
        self._add_to_session_window(event)

    def _add_to_session_window(self, event: SensorEvent):
        user_id = event.user_id
        if user_id not in self.active_sessions:
            self.active_sessions[user_id] = []

        user_sessions = self.active_sessions[user_id]
        
        # Try to merge event into an existing session window within inactivity gap
        merged = False
        for session in user_sessions:
            if (event.event_time >= session.start_time - self.inactivity_gap) and (event.event_time <= session.end_time + self.inactivity_gap):
                session.events.append(event)
                session.start_time = min(session.start_time, event.event_time)
                session.end_time = max(session.end_time, event.event_time)
                merged = True
                print(f" 🔄 [Session Merged] User '{user_id}' Session Window updated: [{session.start_time:.1f}s .. {session.end_time:.1f}s] ({len(session.events)} events)")
                break

        if not merged:
            new_session = SessionWindow(
                user_id=user_id, start_time=event.event_time, end_time=event.event_time, events=[event]
            )
            user_sessions.append(new_session)
            print(f" 🆕 [New Session Created] User '{user_id}' Session Window: [{event.event_time:.1f}s .. {event.event_time:.1f}s]")

# Demonstration Execution
if __name__ == "__main__":
    # Max expected out-of-order lateness = 5.0s, Session gap = 10.0s
    engine = EventTimeWatermarkEngine(max_lateness_sec=5.0, session_inactivity_gap_sec=10.0)

    print("🚀 Demonstrating Event Time Watermarks & Session Window Processing...")
    print("=" * 75)

    # 1. Normal On-Time Events
    engine.process_event(SensorEvent(user_id="user_A", event_time=100.0, value=10.0))
    engine.process_event(SensorEvent(user_id="user_A", event_time=104.0, value=15.0)) # Merges into Session A

    # 2. Out-of-Order Event arrives (t=102.0s arrives after t=104.0s)
    print("\n1. Out-of-Order Arrival (t=102s arrives after t=104s):")
    engine.process_event(SensorEvent(user_id="user_A", event_time=102.0, value=12.0)) # Merges successfully!

    # 3. High Event arrives, pushing Watermark to 120.0s - 5.0s = 115.0s
    print("\n2. High Event advances Watermark to W(115.0s):")
    engine.process_event(SensorEvent(user_id="user_B", event_time=120.0, value=50.0))

    # 4. Extremely Late Event arrives (t=101.0s < W=115.0s) -> Trigger Side Output!
    print("\n3. Extremely Late Event Arrival (t=101s < W=115s):")
    engine.process_event(SensorEvent(user_id="user_A", event_time=101.0, value=99.0))

    print(f"\n📊 Side-Output Stream (Late Records Captured): {len(engine.side_output_late_events)} events")
```

---

## 🚨 Windowing & Watermark Gotchas & Best Practices

When configuring Event Time processing:

> [!IMPORTANT]
> **Account for Idle Stream Partitions**: If one Kafka topic partition stops receiving data, its watermark will stop advancing, blocking downstream window evaluation across the entire cluster (**Idle Watermark Timeout**). Configure `WatermarkStrategy.withIdleness(Duration.ofMinutes(1))` to mark idle partitions automatically.

> [!CAUTION]
> **Do Not Set Max Lateness Too High**: Setting `max_lateness` to 1 hour forces stateful operators to retain window state in memory for an extra hour before emitting results, increasing RocksDB state storage requirements and delaying downstream alerts.

---

## 📈 Real-World Enterprise Impact
Event Time streaming architectures (such as **Apache Flink**, **Google Cloud Dataflow**, and **Apache Beam**) report:
* **100% Deterministic Financial Analytics**: Achieving identical aggregation results during historical data replaying and real-time streaming despite network delays.
* **Resilience to Mobile Disconnects**: Seamlessly absorbing out-of-order telemetry from millions of connected vehicle sensors and mobile apps without data corruption.
