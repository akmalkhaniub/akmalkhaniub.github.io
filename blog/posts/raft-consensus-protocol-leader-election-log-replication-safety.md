# Raft Consensus Protocol: Leader Election, Log Replication & Safety Proofs

In fault-tolerant distributed systems, multiple independent nodes must agree on a single sequence of state transitions despite network partitions, packet loss, and node crashes. This challenge is known as **Distributed Consensus**.

While **Paxos** was historically the standard consensus algorithm, its complex dual-phase mechanisms made it notoriously difficult to implement correctly in production.

In 2014, Diego Ongaro and John Ousterhout introduced **Raft**—a consensus algorithm explicitly designed for understandability, decomposed into three distinct sub-problems: **Leader Election**, **Log Replication**, and **Safety**.

Today, Raft powers core infrastructure databases including **etcd** (Kubernetes state store), **HashiCorp Consul**, **CockroachDB**, and **TiKV**.

This article explores the internal state machines, RPC mechanics, and safety invariants of the Raft Consensus Protocol.

---

## 📖 Raft Node State Transitions & Log Replication Architecture

How Raft nodes transition between Follower, Candidate, and Leader roles while replicating log entries:

```mermaid
graph TD
  subgraph Raft Node State Machine
    Follower[Follower State] -->|1. Election Timeout Elapses| Candidate[Candidate State]
    Candidate -->|2. Wins Majority Quorum Votes| Leader[Leader State]
    Candidate -->|3. Discovers Higher Term / New Leader| Follower
    Leader -->|4. Discovers Higher Term Peer| Follower
  end
  
  subgraph Log Replication Pipeline (Term T)
    Leader -->|5. AppendEntries RPC: Entry + prevLogIndex| F1[Follower Node 1]
    Leader -->|5. AppendEntries RPC: Entry + prevLogIndex| F2[Follower Node 2]
    
    F1 -->|6. Log Match Validated -> Ack| Leader
    F2 -->|6. Log Match Validated -> Ack| Leader
    
    Leader -->|7. Majority Acknowledged -> Advance commitIndex| StateMachine[State Machine Execution]
  end
```

### Core Raft Protocol Mechanics
1. **Monotonically Increasing Terms**: Time is divided into arbitrary terms identified by sequential integers (`Term 1`, `Term 2`). Terms act as a logical clock, allowing nodes to detect stale leaders or outdated candidates.
2. **Leader Election & Quorum**: Nodes begin as Followers. If a Follower receives no heartbeats before its randomized election timer ($150\text{ms} - 300\text{ms}$) expires, it increments its term, transitions to Candidate, and broadcasts `RequestVote` RPCs. A Candidate becomes Leader upon receiving votes from a majority of nodes ($\lfloor N/2 \rfloor + 1$).
3. **Log Matching Property**: When a Leader receives a client write request, it appends the command to its local log and sends `AppendEntries` RPCs to all Followers. If two logs contain an entry with the same index and term, they are identical in all entries up through that index.
4. **Raft Safety Invariants**:
   * **Election Safety**: At most one leader can be elected per term.
   * **Leader Append-Only**: A leader never overwrites or truncates its own log entries.
   * **Leader Completeness**: If a log entry is committed in a given term, that entry will be present in the logs of the leaders for all higher-numbered terms.

---

## 🛠️ Python Implementation: Raft Node State Machine & Log Engine

Here is a production-grade Python simulation of a Raft Consensus Node featuring term management, leader election voting, and log matching checks:

```python
import time
import random
from typing import List, Dict, Optional, Tuple
from pydantic import BaseModel

class LogEntry(BaseModel):
    index: int
    term: int
    command: str

class RequestVoteArgs(BaseModel):
    term: int
    candidate_id: str
    last_log_index: int
    last_log_term: int

class RequestVoteReply(BaseModel):
    term: int
    vote_granted: bool

class AppendEntriesArgs(BaseModel):
    term: int
    leader_id: str
    prev_log_index: int
    prev_log_term: int
    entries: List[LogEntry]
    leader_commit: int

class AppendEntriesReply(BaseModel):
    term: int
    success: bool

class RaftNode:
    """
    Simulates a Raft Consensus Node State Machine.
    States: 'FOLLOWER', 'CANDIDATE', 'LEADER'
    """
    def __init__(self, node_id: str, cluster_nodes: List[str]):
        self.node_id = node_id
        self.cluster_nodes = cluster_nodes
        self.current_term = 0
        self.voted_for: Optional[str] = None
        self.state = "FOLLOWER"
        self.log: List[LogEntry] = [LogEntry(index=0, term=0, command="NOOP")]  # 1-indexed sentinel
        self.commit_index = 0
        self.last_applied = 0

    def handle_request_vote(self, args: RequestVoteArgs) -> RequestVoteReply:
        """Processes an incoming RequestVote RPC from a Candidate."""
        # 1. Reject if Candidate Term is outdated
        if args.term < self.current_term:
            return RequestVoteReply(term=self.current_term, vote_granted=False)

        # 2. Update Term if Candidate has a higher term
        if args.term > self.current_term:
            self.current_term = args.term
            self.state = "FOLLOWER"
            self.voted_for = None

        # 3. Check Leader Completeness (Candidate's log must be at least as up-to-date as receiver's)
        last_log = self.log[-1]
        log_ok = (args.last_log_term > last_log.term) or \
                 (args.last_log_term == last_log.term and args.last_log_index >= last_log.index)

        vote_granted = False
        if (self.voted_for is None or self.voted_for == args.candidate_id) and log_ok:
            self.voted_for = args.candidate_id
            vote_granted = True
            print(f" 🗳️ [Node '{self.node_id}'] Voted FOR Candidate '{args.candidate_id}' in Term {self.current_term}")

        return RequestVoteReply(term=self.current_term, vote_granted=vote_granted)

    def handle_append_entries(self, args: AppendEntriesArgs) -> AppendEntriesReply:
        """Processes an incoming AppendEntries RPC (Heartbeat or Log Replication)."""
        # 1. Reply false if Leader Term is less than current_term
        if args.term < self.current_term:
            return AppendEntriesReply(term=self.current_term, success=False)

        # 2. Recognize Leader and Update Term
        if args.term >= self.current_term:
            self.current_term = args.term
            self.state = "FOLLOWER"
            self.voted_for = None

        # 3. Consistency Check: Does log contain entry at prev_log_index matching prev_log_term?
        if args.prev_log_index >= len(self.log) or self.log[args.prev_log_index].term != args.prev_log_term:
            print(f" ⚠️ [Node '{self.node_id}'] AppendEntries Failed: Log Consistency Check Failed at Index {args.prev_log_index}")
            return AppendEntriesReply(term=self.current_term, success=False)

        # 4. Append new entries (truncating conflicting follower log if necessary)
        self.log = self.log[: args.prev_log_index + 1] + args.entries

        # 5. Advance Commit Index
        if args.leader_commit > self.commit_index:
            self.commit_index = min(args.leader_commit, len(self.log) - 1)
            print(f" ⚙️ [Node '{self.node_id}'] Advanced Commit Index to {self.commit_index}")

        return AppendEntriesReply(term=self.current_term, success=True)

# Demonstration Execution
if __name__ == "__main__":
    cluster = ["node-1", "node-2", "node-3"]
    follower = RaftNode(node_id="node-2", cluster_nodes=cluster)

    print("🚀 Demonstrating Raft Consensus Node Mechanics & Log Matching...")
    print("=" * 75)

    # 1. Candidate requests vote from Follower in Term 1
    vote_req = RequestVoteArgs(term=1, candidate_id="node-1", last_log_index=0, last_log_term=0)
    vote_reply = follower.handle_request_vote(vote_req)
    print(f" Vote Reply from 'node-2': Term={vote_reply.term}, Granted={vote_reply.vote_granted}")

    # 2. Leader sends initial Heartbeat AppendEntries
    heartbeat_args = AppendEntriesArgs(
        term=1, leader_id="node-1", prev_log_index=0, prev_log_term=0, entries=[], leader_commit=0
    )
    heartbeat_reply = follower.handle_append_entries(heartbeat_args)
    print(f" Heartbeat Reply from 'node-2': Success={heartbeat_reply.success}")

    # 3. Leader Replicates a New State Machine Command
    new_entry = LogEntry(index=1, term=1, command="SET balance=500")
    replicate_args = AppendEntriesArgs(
        term=1, leader_id="node-1", prev_log_index=0, prev_log_term=0, entries=[new_entry], leader_commit=1
    )
    replicate_reply = follower.handle_append_entries(replicate_args)
    print(f" Log Replication Reply: Success={replicate_reply.success} | Follower Log Len: {len(follower.log)}")
```

---

## 🚨 Raft Implementation Gotchas & Best Practices

When building Raft-based consensus clusters:

> [!IMPORTANT]
> **Randomize Election Timers**: If all nodes use identical election timeouts ($200\text{ms}$), multiple followers will trigger candidate elections simultaneously, splitting votes evenly and causing election deadlocks. Randomizing timeouts between $150\text{ms}$ and $300\text{ms}$ ensures one node times out first and wins the election.

> [!CAUTION]
> **Never Commit Entries from Previous Terms Directly**: A Raft leader cannot determine that an entry from a *previous* term is committed just by counting replicas. A leader must only commit entries from its *current* term by replicating them to a majority.

---

## 📈 Real-World Enterprise Impact
Distributed key-value engines powered by Raft (such as **etcd**) report:
* **Zero Data Loss under Node Failures**: Surviving node crashes automatically without losing committed state transitions.
* **Continuous 99.999% Availability**: Electing a new leader in under $300\text{ms}$ during hardware failures ensures seamless client request handling.
