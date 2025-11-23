# Node-Redis README

**node-redis** is a modern, high-performance Redis client for Node.js.

## Installation

Start a Redis instance via Docker:
```bash
docker run -p 6379:6379 -d redis:8.0-rc1
```

Install the package:
```bash
npm install redis
```

## Packages

The "redis" package includes all modules. Individual packages are available:

| Package | Purpose |
|---------|---------|
| `@redis/client` | Base clients (RedisClient, RedisCluster, etc.) |
| `@redis/bloom` | Redis Bloom probabilistic commands |
| `@redis/json` | Redis JSON data type commands |
| `@redis/search` | RediSearch query commands |
| `@redis/time-series` | Redis Time-Series commands |
| `@redis/entraid` | Microsoft Entra ID authentication |

> For object mapping, see [redis-om-node](https://github.com/redis/redis-om-node)

## Basic Usage

```typescript
import { createClient } from "redis";

const client = await createClient()
 .on("error", (err) => console.log("Redis Client Error", err))
 .connect();

await client.set("key", "value");
const value = await client.get("key");
client.destroy();
```

Connect to a different host/port using a connection string:
```typescript
createClient({
 url: "redis://alice:foobared@awesome.redis.server:6380",
});
```

Check connection status with `client.isReady` (boolean) or `client.isOpen`.

## Redis Commands

All standard Redis commands are supported with both raw names ("HSET") and camelCase variants ("hSet"):

```typescript
// Raw Redis commands
await client.HSET("key", "field", "value");
await client.HGETALL("key");

// Friendly JavaScript commands
await client.hSet("key", "field", "value");
await client.hGetAll("key");
```

Modifiers use JavaScript objects:
```typescript
await client.set("key", "value", {
 EX: 10,
 NX: true,
});
```

Responses are automatically transformed into useful structures:
```typescript
await client.hGetAll("key"); // { field1: 'value1', field2: 'value2' }
await client.hVals("key"); // ['value1', 'value2']
```

### Unsupported Commands

Use `.sendCommand()` for commands not yet supported:
```typescript
await client.sendCommand(["SET", "key", "value", "NX"]); // 'OK'
await client.sendCommand(["HGETALL", "key"]); // ['key1', 'field1', 'key2', 'field2']
```

## Transactions

Use `.multi()` to start a transaction, chain commands, then `.exec()`:

```typescript
const [setKeyReply, otherKeyValue] = await client
 .multi()
 .set("key", "value")
 .get("another-key")
 .exec(); // ['OK', 'another-value']
```

Watch keys with `.watch()` to abort if they change.

## Blocking Commands & Pools

In v5, connection pool logic is extracted into `RedisClientPool`:

```typescript
const pool = await createClientPool()
 .on("error", (err) => console.error(err))
 .connect();

await pool.ping();
```

## Pub/Sub

See the [Pub/Sub overview](https://github.com/redis/node-redis/blob/master/docs/pub-sub.md).

## Scan Iterator

Use async iterators with `SCAN` results:

```typescript
for await (const keys of client.scanIterator()) {
 console.log(keys, await client.mGet(keys));
}
```

Works with `hScanIterator()`, `sScanIterator()`, and `zScanIterator()`. Configure with options:

```typescript
client.scanIterator({
 TYPE: "string",
 MATCH: "pattern*",
 COUNT: 100,
});
```

## Disconnecting

The `QUIT` command is deprecated (Redis 7.2+). Use `.close()` instead. `.disconnect()` is now `.destroy()`:

```typescript
client.destroy();
```

## Client-Side Caching

Enable with RESP3:

```typescript
const client = createClient({
 RESP: 3,
 clientSideCache: {
  ttl: 0,
  maxEntries: 0,
  evictPolicy: "LRU"
 }
});
```

See [V5 documentation](https://github.com/redis/node-redis/blob/master/docs/v5.md#client-side-caching) for details.

## Auto-Pipelining

Requests in the same tick are automatically pipelined:

```typescript
await Promise.all([
 client.set("key1", "value1"),
 client.sAdd("set", "member"),
]);
```

## Programmability

See the [Programmability overview](https://github.com/redis/node-redis/blob/master/docs/programmability.md).

## Clustering

Refer to the [Clustering Guide](https://github.com/redis/node-redis/blob/master/docs/clustering.md).

## Events

The client is a Node.js EventEmitter:

| Event | When | Arguments |
|-------|------|-----------|
| `connect` | Initiating connection | None |
| `ready` | Client ready to use | None |
| `end` | Connection closed | None |
| `error` | Error occurred | `(error: Error)` |
| `reconnecting` | Attempting reconnection | None |
| `sharded-channel-moved` | [Details](https://github.com/redis/node-redis/blob/master/docs/pub-sub.md#sharded-channel-moved-event) | See link |
| `invalidate` | Key invalidated (with tracking) | `(key: RedisItem \| null)` |

⚠️ You **MUST** listen to `error` events—unhandled errors will crash the process.

## Supported Redis Versions

See [Supported Redis Versions](https://github.com/redis/node-redis/blob/master/SUPPORTED_REDIS_VERSIONS.md).

## Migration Guides

- [V3 to V4](https://github.com/redis/node-redis/blob/master/docs/v3-to-v4.md)
- [V4 to V5](https://github.com/redis/node-redis/blob/master/docs/v4-to-v5.md)
- [V5](https://github.com/redis/node-redis/blob/master/docs/v5.md)

## Contributing

See the [contributing guide](https://github.com/redis/node-redis/blob/master/CONTRIBUTING.md).
