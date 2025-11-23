# Redis Persistence Documentation

## Overview

Redis provides multiple persistence options for writing data to durable storage:

- **RDB (Redis Database)**: Point-in-time snapshots at specified intervals
- **AOF (Append Only File)**: Logs every write operation for replay on restart
- **No persistence**: Disabled for caching scenarios
- **RDB + AOF**: Combined approach for both strategies

## RDB Snapshots

### Advantages

RDB excels at creating compact, single-file backups ideal for disaster recovery. The parent process forks a child to handle disk I/O, maximizing performance. Restarts with large datasets complete faster than AOF, and the format supports partial resynchronizations after failovers.

### Disadvantages

RDB struggles with minimizing data loss—typically 5+ minutes of writes could vanish if Redis crashes unexpectedly. Frequent forking during persistence can cause brief service interruptions, particularly with large datasets.

## Append-Only File

### Advantages

AOF provides superior durability with configurable fsync policies (always, every second, or never). The append-only format prevents corruption issues during power outages. Redis automatically rewrites oversized logs without interrupting service. The human-readable format allows manual recovery from accidental operations like `FLUSHALL`.

### Disadvantages

AOF files typically exceed RDB sizes for equivalent datasets. Performance depends on fsync configuration, though "every second" remains competitive. Pre-7.0 versions consumed additional memory during rewrites and wrote commands twice to disk.

## Recommendations

Combining both methods provides PostgreSQL-comparable durability. Standalone RDB works for scenarios tolerating minutes of data loss. While some use AOF exclusively, regular RDB snapshots support backups, faster restarts, and protection against AOF engine bugs.
