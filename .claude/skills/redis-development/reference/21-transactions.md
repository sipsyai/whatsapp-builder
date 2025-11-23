# Redis Transactions Documentation

## Overview

Redis transactions allow executing a group of commands in a single, atomic operation. All commands in a transaction are serialized and executed sequentially, ensuring no other client commands are executed during the transaction.

## Key Commands

### MULTI
Marks the start of a transaction block. Subsequent commands are queued and executed together when EXEC is called.

```
MULTI
SET key1 "value1"
SET key2 "value2"
EXEC
```

### EXEC
Executes all commands in the transaction queue. Returns an array of replies, one for each command.

### DISCARD
Flushes the transaction queue and exits transaction mode. None of the queued commands are executed.

### WATCH
Provides optimistic locking by monitoring one or more keys. If any watched key is modified before EXEC, the transaction is aborted.

```
WATCH mykey
val = GET mykey
val = val + 1
MULTI
SET mykey $val
EXEC
```

## Important Characteristics

- **All or Nothing Execution**: Commands are either all executed or none are (if EXEC is not called)
- **Atomic**: No other client requests are served during transaction execution
- **No Rollback**: Redis does not support rollbacks. If a command fails during execution, the remaining commands still execute
- **Errors**: Syntax errors during queueing prevent EXEC from running; runtime errors during EXEC do not stop other commands

## Use Cases

- Incrementing counters atomically
- Updating multiple related keys together
- Ensuring consistency when multiple keys need to be modified
- Implementing check-and-set operations with WATCH

## Limitations

- Cannot make decisions based on return values within a transaction
- All commands must be known before starting the transaction
- Watched keys must be known before entering MULTI
