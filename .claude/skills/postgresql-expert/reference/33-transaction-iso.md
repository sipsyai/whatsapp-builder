# 13.2. Transaction Isolation

## Overview

PostgreSQL implements four SQL standard transaction isolation levels, though only three distinct isolation levels exist internally. The standard defines isolation by prohibited phenomena resulting from concurrent transaction interactions.

## Prohibited Phenomena

- **Dirty read**: Reading uncommitted data from concurrent transactions
- **Nonrepeatable read**: Re-reading data that has been modified by another committed transaction
- **Phantom read**: Re-executing a query and finding a different set of rows
- **Serialization anomaly**: Transaction results inconsistent with any serial execution order

## Isolation Levels Implemented

### Read Committed (Default)

This is PostgreSQL's default level. Queries see only data committed before execution began. Key characteristics:

- Each command takes a new snapshot including all committed transactions
- "A `SELECT` query sees a snapshot of the database as of the instant the query begins to run"
- Successive SELECT commands in the same transaction may see different data
- Suitable for simple operations but not complex queries with multiple conditions

### Repeatable Read

Provides stronger guarantees than the SQL standard requires:

- "A query in a repeatable read transaction sees a snapshot as of the start of the first non-transaction-control statement"
- All queries within a transaction see consistent data
- Prevents dirty reads, nonrepeatable reads, and phantom reads
- Applications must handle serialization failures with retries
- Uses Snapshot Isolation technique

### Serializable

The strictest isolation level:

- Emulates serial transaction execution
- Monitoring detects conditions causing serialization anomalies
- Uses predicate locking without blocking
- Applications must be prepared to retry transactions
- Implemented via Serializable Snapshot Isolation technique

## Setting Isolation Level

Use the `SET TRANSACTION` command to specify the desired isolation level for a transaction.
