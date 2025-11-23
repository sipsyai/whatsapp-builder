# ioredis - Redis Client for Node.js

## Overview

ioredis is a robust, performance-focused, and full-featured Redis client library for Node.js. It supports Redis >= 2.6.12 and is fully compatible with Redis 7.x.

> "A robust, performance-focused and full-featured Redis client for Node.js"

## Key Features

- **Full-featured support** including Cluster, Sentinel, Streams, Pipelining, Lua scripting, Redis Functions, and Pub/Sub with binary message support
- **High performance** optimized for speed
- **Developer-friendly API** supporting both Node.js callbacks and native promises
- **Data transformation** for command arguments and replies
- **Transparent key prefixing** capabilities
- **Lua scripting abstraction** allowing custom command definitions
- **Binary data support** for non-text content
- **TLS encryption** support
- **Offline queue** and ready state checking
- **ES6 type support** including Map and Set
- **GEO commands** for geographic operations
- **Redis ACL support** for access control
- **Sophisticated error handling**
- **NAT mapping** support
- **Autopipelining** functionality
- **100% TypeScript** with official type declarations

## Version Information

| Version | Branch | Node.js | Redis |
|---------|--------|---------|-------|
| 5.x.x (latest) | main | >= 12 | 2.6.12 ~ latest |
| 4.x.x | v4 | >= 8 | 2.6.12 ~ 7 |

## Installation

```bash
npm install ioredis
```

## Quick Start

### Basic Connection

Create a Redis instance with default settings (connects to 127.0.0.1:6379):

```javascript
const Redis = require("ioredis");
const redis = new Redis();
```

### Custom Connection Options

```javascript
new Redis(6380); // Port only
new Redis(6379, "192.168.1.1"); // Port and host
new Redis("/tmp/redis.sock"); // Unix socket
new Redis({
  port: 6379,
  host: "127.0.0.1",
  username: "default",
  password: "my-top-secret",
  db: 0
});
```

### URI Connection String

```javascript
new Redis("redis://:authpassword@127.0.0.1:6380/4");
new Redis("redis://username:authpassword@127.0.0.1:6380/4");
```

## Command Examples

### Basic Operations

The library supports both callback and promise-based patterns:

```javascript
redis.set("mykey", "value");
redis.get("mykey", (err, result) => {
  if (err) console.error(err);
  else console.log(result);
});

// Promise style
await redis.get("mykey");
```

### Sorted Sets

```javascript
redis.zadd("sortedSet", 1, "one", 2, "dos", 3, "three");
await redis.zrange("sortedSet", 0, 2, "WITHSCORES");
```

### Key Expiration

Set keys with automatic expiration:

```javascript
redis.set("key", "data", "EX", 60); // Expires in 60 seconds
```

### Binary Data

```javascript
redis.set("foo", Buffer.from([0x62, 0x75, 0x66]));
```

## Pub/Sub Pattern

Create separate connections for publishers and subscribers:

```javascript
// Publisher
const pub = new Redis();
pub.publish("my-channel", JSON.stringify({message: "hello"}));

// Subscriber
const sub = new Redis();
sub.subscribe("my-channel", (err, count) => {
  if (err) console.error("Failed to subscribe");
});
sub.on("message", (channel, message) => {
  console.log(`Received from ${channel}`);
});
```

## Streams Support

Consume stream messages using XREAD:

```javascript
const results = await redis.xread("BLOCK", 0, "STREAMS", "mystream", "$");
const [key, messages] = results[0];
messages.forEach(message => console.log(message));
```

## Project Status

"ioredis is a stable project and maintenance is done on a best-effort basis for relevant issues." For new projects, the maintainers recommend node-redis as the actively maintained alternative supporting latest Redis features.

## Resources

- **API Documentation**: https://redis.github.io/ioredis/
- **Changelog**: CHANGELOG.md in repository
- **Examples**: See examples/ folder for TTL, Strings, Hashes, Lists, Sets, Sorted Sets, Streams, and Redis Modules
