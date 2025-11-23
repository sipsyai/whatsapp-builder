# Redis Commands Overview

## Command Organization

Redis commands are organized into **functional categories** accessible through a filterable commands reference. The documentation includes version-specific filtering (supporting Redis versions from 1.0 through 7.0).

## Major Command Categories

**Data Structure Commands:**
- **String**: SET, GET, APPEND, INCR, DECR, GETRANGE
- **Hash**: HSET, HGET, HDEL, HINCRBY, HGETALL, HSCAN
- **List**: LPUSH, RPUSH, LPOP, RPOP, LRANGE, LINDEX, LTRIM
- **Set**: SADD, SREM, SMEMBERS, SINTER, SUNION, SDIFF
- **Sorted Set**: ZADD, ZRANGE, ZREM, ZSCORE, ZRANK, ZINCRBY

**Specialized Data Structures:**
- Streams (XADD, XREAD, XGROUP)
- JSON operations (JSON.SET, JSON.GET, JSON.ARRAPPEND)
- Geospatial indices (GEOADD, GEODIST, GEOSEARCH)
- HyperLogLog (PFADD, PFCOUNT, PFMERGE)
- Time series (TS.ADD, TS.RANGE, TS.MGET)

**Administrative Commands:**
- Connection management (AUTH, HELLO, CLIENT commands)
- Server management (INFO, CONFIG, SHUTDOWN)
- Cluster operations (CLUSTER ADDSLOTS, CLUSTER NODES)
- Replication (REPLICAOF, PSYNC, SYNC)

Commands are marked as "Deprecated" when superseded by newer alternatives, guiding users toward current best practices.
