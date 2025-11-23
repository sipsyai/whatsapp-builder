# 13.3. Explicit Locking

## Overview

PostgreSQL provides multiple lock modes to manage concurrent access to table data. These mechanisms are particularly useful when MVCC doesn't deliver the desired concurrency behavior. Most PostgreSQL commands automatically acquire appropriate locks to prevent incompatible modifications during execution.

## 13.3.1. Table-Level Locks

PostgreSQL implements eight distinct table-level lock modes with varying conflict characteristics:

**ACCESS SHARE** - The least restrictive mode, acquired by `SELECT` statements and other read-only queries. This conflicts only with `ACCESS EXCLUSIVE`.

**ROW SHARE** - Applied by `SELECT` statements using `FOR UPDATE`, `FOR NO KEY UPDATE`, `FOR SHARE`, or `FOR KEY SHARE` clauses. Conflicts with `EXCLUSIVE` and `ACCESS EXCLUSIVE` modes.

**ROW EXCLUSIVE** - Obtained by data-modifying commands like `UPDATE`, `DELETE`, `INSERT`, and `MERGE`. Conflicts with multiple modes including `SHARE`, `SHARE ROW EXCLUSIVE`, `EXCLUSIVE`, and `ACCESS EXCLUSIVE`.

**SHARE UPDATE EXCLUSIVE** - Protects against concurrent schema modifications and `VACUUM` operations. Acquired by `VACUUM`, `ANALYZE`, `CREATE INDEX CONCURRENTLY`, and related commands.

**SHARE** - Prevents concurrent data changes. Used by `CREATE INDEX` without the `CONCURRENTLY` option.

**SHARE ROW EXCLUSIVE** - Protects against data modifications and is self-exclusive, allowing only one session to hold it simultaneously. Acquired by `CREATE TRIGGER` and certain `ALTER TABLE` variants.

**EXCLUSIVE** - Permits only concurrent `ACCESS SHARE` locks, meaning read operations can proceed alongside it. Used by `REFRESH MATERIALIZED VIEW CONCURRENTLY`.

**ACCESS EXCLUSIVE** - The most restrictive mode, blocking all other lock types. Acquired by `DROP TABLE`, `TRUNCATE`, `REINDEX`, `CLUSTER`, `VACUUM FULL`, and other structural operations.

## 13.3.2. Row-Level Locks

Row-level locks provide finer-grained control over concurrent access to specific rows:

**FOR UPDATE** - Locks rows retrieved by `SELECT` for modification, preventing other transactions from updating, deleting, or locking the same rows until the transaction completes.

**FOR NO KEY UPDATE** - A weaker variant that doesn't block `SELECT FOR KEY SHARE` commands on the same rows.

**FOR SHARE** - Acquires a shared lock rather than exclusive, blocking `UPDATE` and `DELETE` but permitting `SELECT FOR SHARE` and `SELECT FOR KEY SHARE`.

**FOR KEY SHARE** - The weakest row-level lock, blocking only `DELETE` and `UPDATE` operations that modify key values, not other updates.

## 13.3.3. Page-Level Locks

PostgreSQL employs page-level share/exclusive locks to manage read/write access to table pages in the shared buffer pool. These locks release immediately after row operations and typically don't require application-level attention.

## 13.3.4. Deadlocks

Explicit locking increases deadlock risk when multiple transactions need conflicting locks. PostgreSQL automatically detects and resolves deadlocks by aborting one transaction, allowing others to proceed. The best prevention strategy involves acquiring locks in consistent order across all application code.

## 13.3.5. Advisory Locks

Advisory locks enable application-defined locking semantics independent of PostgreSQL's enforcement mechanism. They're valuable for emulating pessimistic locking strategies. Available at both session and transaction levels, advisory locks are faster than flag-based alternatives and automatically cleaned up at session end.
