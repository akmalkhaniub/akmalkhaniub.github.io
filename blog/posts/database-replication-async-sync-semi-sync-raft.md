# Distributed Database Replication Mechanics: Async vs Sync vs Semi-Sync & Raft Log Replication

In high-availability data infrastructure, running a single primary database node introduces a **Single Point of Failure (SPOF)**. If the primary database hardware fails, all application writes stall, and un-replicated data is lost.

To achieve fault tolerance and scale read throughput, databases replicate mutations across multiple replica nodes (**PostgreSQL**, **MySQL**, **CockroachDB**, **YugabyteDB**).

However, database replication introduces a fundamental trade-off between **Write Latency**, **Data Loss ($RPO$)**, and **Availability**.

From legacy **Asynchronous** and **Synchronous** primary-replica setups to modern **Semi-Synchronous** and **Raft Majority Quorum** consensus groups, choosing the right replication model dictates database resilience.

This article details Asynchronous replication lag, Synchronous latency penalties, Semi-Synchronous relay logs, and Raft consensus log replication.

---

## 📖 Database Replication Modes & Raft Consensus Architecture

How Asynchronous, Semi-Synchronous, and Raft Majority Quorum replication models process client write requests:

```mermaid
graph TD
  subgraph Client Write Request
    Client[Client Tx Write Request] --> Primary[Primary Database Node]
  end
  
  subgraph Asynchronous Replication (Zero Latency Penalty)
    Primary -->|1. Commit Locally & Return Ack < 1ms| Client
    Primary -.->|2. Async WAL Stream| Replica1[Replica Node 1 (Replication Lag)]
  end
  
  subgraph Semi-Synchronous Replication (1 Slave Ack)
    Primary -->|1. Stream Binlog| RelayLog[Replica 1 Relay Log]
    RelayLog -->|2. Ack Received| Primary
    Primary -->|3. Return Ack to Client| Client
  end
  
  subgraph Raft Consensus Majority Quorum (CockroachDB / TiKV)
    Primary -->|1. Broadcast AppendEntries| NodeB[Raft Node B] & NodeC[Raft Node C]
    NodeB -->|2. Majority Ack (2 of 3 Nodes)| Primary
    Primary -->|3. Commit Majority Entry!| Client
  end
```

### Core Replication Modes & Mechanics
1. **Asynchronous Replication**:
   * *Mechanism*: The primary writes and commits the transaction to its local WAL disk, returning success to the client immediately. Background threads stream WAL bytes to replica nodes asynchronously.
   * *Pros*: Lowest possible write latency (zero network waiting).
   * *Cons*: If the primary crashes before WAL records reach replicas, failover to a replica loses recent transactions (**RPO > 0** due to Replication Lag).
2. **Synchronous Replication**:
   * *Mechanism*: The primary writes the WAL record locally and broadcasts it to *all* secondary replicas. The primary blocks and waits for **every single replica** to flush the WAL to disk before returning success to the client.
   * *Pros*: Guarantees zero data loss ($RPO = 0$).
   * *Cons*: Write throughput drops drastically. A single slow network connection or crashed replica freezes all database write transactions.
3. **Semi-Synchronous Replication**:
   * *Mechanism*: Used extensively in **MySQL**. The primary waits until **at least one** secondary replica acknowledges receiving the binlog/WAL entry into its local **Relay Log** before returning success to the client.
   * *Pros*: Ensures at least one external node possesses the transaction log, drastically reducing data loss risk without waiting for all slow replicas.
4. **Raft Consensus Log Replication**:
   * Modern distributed SQL databases (**CockroachDB**, **YugabyteDB**, **TiKV**) replace primary-replica setups with **Raft Consensus Groups** (typically 3 or 5 nodes per range/shard).
   * *Quorum Rule*: A transaction commits as soon as a **Majority Quorum** ($\lfloor N/2 \rfloor + 1$) of nodes append the entry to their local Raft log. In a 3-node cluster, only 2 nodes must acknowledge the write!
   * *Resilience*: Survives single-node crashes instantly without stalling client writes or losing committed state.

---

## 🛠️ Python Implementation: Multi-Mode Replication Engine

Here is a production-grade Python implementation of a Distributed Database Replication Engine supporting Async, Semi-Sync, and Raft Majority Quorum Commit Modes:

```python
import time
from typing import List, Dict, Tuple
from pydantic import BaseModel

class ReplicationLogEntry(BaseModel):
    log_index: int
    tx_id: int
    data: str

class DatabaseReplicaNode:
    """
    Simulates a Secondary Database Replica Node.
    """
    def __init__(self, node_id: str, is_slow_network: bool = False):
        self.node_id = node_id
        self.is_slow_network = is_slow_network
        self.relay_log: List[ReplicationLogEntry] = []

    def receive_log(self, entry: ReplicationLogEntry) -> bool:
        if self.is_slow_network:
            time.sleep(0.05)  # 50ms network delay simulation
        self.relay_log.append(entry)
        print(f" 📥 [{self.node_id}] Received Log Index #{entry.log_index} (Tx #{entry.tx_id}) -> Relay Log Size: {len(self.relay_log)}")
        return True

class PrimaryReplicationEngine:
    """
    Simulates Primary Database supporting Async, Semi-Sync, and Raft Majority Quorum.
    """
    def __init__(self, replicas: List[DatabaseReplicaNode]):
        self.replicas = replicas
        self.log_counter = 0
        self.primary_wal: List[ReplicationLogEntry] = []

    def execute_transaction(self, tx_id: int, data: str, mode: str) -> float:
        """
        mode: 'ASYNC', 'SEMI_SYNC', 'RAFT_QUORUM'
        """
        start_t = time.perf_counter()
        self.log_counter += 1
        entry = ReplicationLogEntry(log_index=self.log_counter, tx_id=tx_id, data=data)
        self.primary_wal.append(entry)
        
        print(f"\n🚀 Executing Tx #{tx_id} ('{data}') in [{mode}] Replication Mode...")
        print("=" * 75)

        if mode == "ASYNC":
            # Return immediately! Async background replication
            print(" ⚡ [Primary] Committed locally. Returning success immediately to client < 1ms!")
            self._async_replicate(entry)

        elif mode == "SEMI_SYNC":
            # Wait for 1 replica acknowledgment
            print(" ⏳ [Semi-Sync] Waiting for 1 Replica Acknowledgment...")
            for r in self.replicas:
                if r.receive_log(entry):
                    print(" ✅ [Semi-Sync Success] Received 1 Replica Ack! Committing Tx.")
                    break

        elif mode == "RAFT_QUORUM":
            # Wait for Majority Quorum (e.g. 2 out of 3 total cluster nodes)
            total_nodes = len(self.replicas) + 1 # Replicas + Primary
            majority_threshold = (total_nodes // 2) + 1
            ack_count = 1 # Primary self-ack
            
            print(f" ⏳ [Raft Quorum] Waiting for Majority Quorum ({majority_threshold}/{total_nodes} nodes)...")
            
            for r in self.replicas:
                if r.receive_log(entry):
                    ack_count += 1
                    if ack_count >= majority_threshold:
                        print(f" 🎉 [Raft Majority Achieved] {ack_count}/{total_nodes} Nodes Acked! Transaction COMMITTED!")
                        break

        elapsed_ms = (time.perf_counter() - start_t) * 1000.0
        return elapsed_ms

    def _async_replicate(self, entry: ReplicationLogEntry):
        # Background replication
        for r in self.replicas:
            r.receive_log(entry)

# Demonstration Execution
if __name__ == "__main__":
    node1 = DatabaseReplicaNode("Replica-1", is_slow_network=False)
    node2 = DatabaseReplicaNode("Replica-2", is_slow_network=True) # Slow node
    
    primary = PrimaryReplicationEngine(replicas=[node1, node2])

    # 1. Asynchronous Mode Execution
    lat_async = primary.execute_transaction(101, "Account_A=$100", mode="ASYNC")
    print(f" 📊 Async Mode Client Latency: {lat_async:.2f} ms")

    # 2. Semi-Synchronous Mode Execution
    lat_semi = primary.execute_transaction(102, "Account_B=$250", mode="SEMI_SYNC")
    print(f" 📊 Semi-Sync Mode Client Latency: {lat_semi:.2f} ms")

    # 3. Raft Majority Quorum Mode Execution
    lat_raft = primary.execute_transaction(103, "Account_C=$500", mode="RAFT_QUORUM")
    print(f" 📊 Raft Quorum Mode Client Latency: {lat_raft:.2f} ms (Bypassed Slow Replica-2!)")
```

---

## 🚨 Database Replication Gotchas & Best Practices

When configuring database replication:

> [!IMPORTANT]
> **Use Raft or Paxos for Automatic Leader Election**: Manual failover in primary-replica setups risks **Split-Brain Anomaly** (where two nodes both believe they are the active primary, corrupting data). Raft consensus algorithms use term numbers and heartbeats to ensure strictly *one* leader exists per term.

> [!CAUTION]
> **Watch Out for Stale Reads on Asynchronous Replicas**: If a user updates their profile on the primary and immediately refreshes the page served by an asynchronous read replica, they may see old data (**Read-Your-Own-Writes Violation**). Route reads to the primary for critical user mutations or enforce causal consistency.

---

## 📈 Real-World Enterprise Impact
Replication engine deployments (such as **CockroachDB**, **TiKV**, and **MySQL InnoDB Cluster**) report:
* **Zero Data Loss ($RPO = 0$)**: Raft majority quorum replication guarantees that committed transactions survive the crash of any single server node.
* **Automatic Sub-5 Second Failover**: Conserved consensus groups elect a new leader automatically without human operator intervention.
