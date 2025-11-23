# Redis Strings Documentation

## Overview

Redis strings are the fundamental data type that stores sequences of bytes, encompassing text, serialized objects, and binary arrays. Since Redis keys are inherently strings, using the string type as a value creates string-to-string mappings, making them ideal for caching and other use cases.

## Basic Operations

### Setting and Getting Values

The primary commands for string manipulation are `SET` and `GET`:

```
SET bike:1 Deimos
GET bike:1
```

The `SET` command replaces any existing value at a key, even if it previously held a different data type. Values can be any binary data up to 512 MB in size.

### Conditional Setting

The `SET` command supports options for conditional operations:

- **NX flag**: Only set the value if the key doesn't exist
- **XX flag**: Only set the value if the key already exists

```
set bike:1 bike nx    # Fails if key exists
set bike:1 bike xx    # Only succeeds if key exists
```

### Multiple Key Operations

For reduced latency when working with multiple keys, Redis provides batch commands:

- **MSET**: Sets multiple key-value pairs simultaneously
- **MGET**: Retrieves values for multiple keys

```
mset bike:1 "Deimos" bike:2 "Ares" bike:3 "Vanth"
mget bike:1 bike:2 bike:3
```

## Strings as Counters

Strings support atomic increment operations useful for counting scenarios:

- **INCR**: Increments a value by 1
- **INCRBY**: Increments by a specified amount

```
set total_crashes 0
incr total_crashes      # Returns 1
incrby total_crashes 10 # Returns 11
```

These operations enable safe concurrent counting without race conditions, making them valuable for tracking metrics like page views or crash statistics.
