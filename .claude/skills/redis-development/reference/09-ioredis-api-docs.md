# ioredis API Documentation

## Classes

The library provides three main classes:

### Redis ⇐ EventEmitter

A Redis client that connects to a single Redis server instance.

**Constructor: `new Redis([port], [host], [options])`**

Creates a Redis instance with configurable connection parameters. The port defaults to 6379 and host to "localhost". Accepts various options including:

- `path`: Local domain socket path
- `password`: Authentication credential
- `db`: Database index (default: 0)
- `keepAlive`: TCP KeepAlive delay in milliseconds
- `connectionName`: Named connection identifier
- `lazyConnect`: Defer connection until first command
- `keyPrefix`: Prepend prefix to all keys
- `stringNumbers`: Return numbers as strings for big number handling

**Key Methods:**

- `connect([callback])`: Establishes connection, returns Promise
- `disconnect()`: Closes connection immediately
- `duplicate()`: Creates new instance with same configuration
- `monitor([callback])`: Listens to all server requests in real time
- `defineCommand(name, definition)`: Creates custom Lua-based commands

### Cluster ⇐ EventEmitter

Manages connections across a Redis Cluster deployment.

**Constructor: `new Cluster(startupNodes, options)`**

Initializes cluster client with array of startup nodes. Configuration options include:

- `scaleReads`: Route reads to "master", "slave", or "all" nodes
- `maxRedirections`: Maximum redirects per command (default: 16)
- `retryDelayOnFailover`: Milliseconds between retry attempts on failure
- `slotsRefreshTimeout`: Timeout for slot refresh operations

**Key Methods:**

- `connect()`: Establishes cluster connection
- `disconnect([reconnect])`: Closes all node connections
- `quit([callback])`: Graceful shutdown, returns Promise
- `nodes([role])`: Returns array of Redis nodes by role designation

### Commander

Base class providing command execution interface for Redis and Cluster.

**Methods:**

- `getBuiltinCommands()`: Returns supported command list
- `createBuiltinCommand(commandName)`: Instantiates built-in command
- `defineCommand(name, definition)`: Registers custom Lua-scripted commands
