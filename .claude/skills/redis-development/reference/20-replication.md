# Redis Replication Documentation

## Overview

Redis replication enables high availability and failover through a leader-follower (master-replica) architecture. Replicas maintain exact copies of master instances and automatically reconnect when links break.

## Core Replication Mechanisms

The system operates through three main processes:

1. **Continuous Synchronization**: When well-connected, masters stream commands to replicas, replicating all dataset changes including client writes, key expirations, and evictions.

2. **Partial Resynchronization**: After disconnections, replicas attempt recovery by requesting only the missed command stream rather than a full dataset reload.

3. **Full Resynchronization**: When partial recovery isn't possible, the master creates an RDB snapshot, transfers it to the replica, then streams subsequent commands.

## Key Characteristics

Redis employs asynchronous replication by default—balancing low latency with high performance. Replicas acknowledge data receipt periodically. Masters can serve multiple replicas, which themselves can accept replica connections in cascading structures (since Redis 4.0, sub-replicas receive identical streams).

**Non-blocking operations**: Masters handle queries during replica synchronization. Replicas can serve queries using older datasets during initial sync, though they block briefly when loading new data.

## Configuration

Basic setup requires adding to the replica config:

```
replicaof 192.168.1.1 6379
```

Or execute `REPLICAOF` command at runtime. Diskless replication (sending RDB via network rather than disk) is available via `repl-diskless-sync` configuration.

## Replication IDs and Offsets

Each master holds a replication ID (pseudo-random identifier) and offset (incremented per byte sent). This pair uniquely identifies a dataset version. Promoted replicas retain their former master's ID as a secondary ID, enabling partial resync for old replicas without full data transfer.

## Critical Safety Considerations

**Persistence Requirements**: Masters with persistence disabled pose severe risks. If a master restarts without persisted data, replicas will replicate the empty dataset, causing complete data loss across the cluster.

**Read-Only Replicas**: Since Redis 2.6, replicas default to read-only mode. This prevents accidental writes that could cause master-replica inconsistency.

## Advanced Features

**Expiration Handling**: Replicas don't independently expire keys; masters propagate DEL commands. During Lua script execution, key expiration is frozen to ensure consistent results across instances.

**Conditional Writes**: The `WAIT` command allows clients to request synchronous replication, ensuring specified replica acknowledgments before returning. This reduces—but doesn't eliminate—write loss probability during failovers.

**Docker/NAT Configuration**: Use `replica-announce-ip` and `replica-announce-port` directives to override address discovery in containerized environments.
