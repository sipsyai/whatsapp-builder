---
name: redis-development
description: Expert assistance for developing with Redis including node-redis and ioredis clients, data types (strings, hashes, lists, sets, sorted sets, JSON, streams), commands, connection management, production patterns, caching strategies, and best practices. Use when working with Redis databases, implementing caching, building real-time applications, or seeking Redis architectural guidance.
version: 1.0.0
author: Skill Development Agent
tags:
  - redis
  - nodejs
  - caching
  - database
  - data-structures
  - nosql
degree_of_freedom: high
---

# Redis Development Expert

## Core Responsibilities

You are an expert Redis developer. Help users build production-ready applications using Redis with Node.js clients (node-redis and ioredis), implement optimal data structures, and follow Redis best practices.

### Primary Tasks

1. **Generate Redis code** - Create connection logic, queries, and data operations using node-redis or ioredis
2. **Design data models** - Recommend optimal Redis data structures for specific use cases
3. **Implement features** - Build caching strategies, session management, rate limiting, pub/sub systems, queues
4. **Debug issues** - Diagnose and resolve Redis connection, performance, and data consistency problems
5. **Explain concepts** - Clarify Redis patterns, commands, data types, and architectural principles

## Quick Start Patterns

### node-redis Client

```javascript
import { createClient } from 'redis';

// Basic connection
const client = createClient({
  url: 'redis://localhost:6379'
});

client.on('error', err => console.log('Redis Client Error', err));
await client.connect();

// String operations
await client.set('key', 'value');
const value = await client.get('key');

// Hash operations
await client.hSet('user:1001', {
  name: 'John Doe',
  email: '[email protected]',
  age: 30
});

const user = await client.hGetAll('user:1001');

// Expiration
await client.setEx('session:xyz', 3600, 'session-data');

// Disconnect
await client.quit();
```

### ioredis Client

```javascript
import Redis from 'ioredis';

// Basic connection
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// Pipeline for batch operations
const pipeline = redis.pipeline();
pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
pipeline.get('key1');
await pipeline.exec();

// Transaction
const multi = redis.multi();
multi.incr('counter');
multi.expire('counter', 3600);
await multi.exec();

// Pub/Sub
const subscriber = new Redis();
await subscriber.subscribe('notifications');
subscriber.on('message', (channel, message) => {
  console.log(`Received: ${message}`);
});

const publisher = new Redis();
await publisher.publish('notifications', 'Hello World');

// Disconnect
await redis.quit();
```

## Data Types and Patterns

### Strings

Use for simple key-value storage, counters, caching:

```javascript
// Simple set/get
await client.set('user:name', 'John');
const name = await client.get('user:name');

// Increment counter
await client.incr('page:views');
await client.incrBy('score', 10);

// Set with expiration
await client.setEx('otp:12345', 300, '123456'); // 5 minutes

// Set if not exists (distributed lock)
const acquired = await client.setNX('lock:resource', 'token');
if (acquired) {
  // Do work
  await client.del('lock:resource');
}

// Get multiple keys
const values = await client.mGet(['key1', 'key2', 'key3']);
```

### Hashes

Use for objects with multiple fields:

```javascript
// Set multiple fields
await client.hSet('product:1001', {
  name: 'Laptop',
  price: 999.99,
  stock: 50,
  category: 'electronics'
});

// Get all fields
const product = await client.hGetAll('product:1001');

// Get specific fields
const price = await client.hGet('product:1001', 'price');
const fields = await client.hmGet('product:1001', ['name', 'price']);

// Increment field
await client.hIncrBy('product:1001', 'stock', -1);

// Check field exists
const exists = await client.hExists('product:1001', 'discount');

// Get all field names
const fields = await client.hKeys('product:1001');
```

### Lists

Use for queues, timelines, activity feeds:

```javascript
// Push to list (queue)
await client.lPush('queue:tasks', 'task1');
await client.rPush('queue:tasks', 'task2');

// Pop from list
const task = await client.lPop('queue:tasks');
const lastTask = await client.rPop('queue:tasks');

// Blocking pop (wait for items)
const item = await client.blPop('queue:tasks', 10); // 10 second timeout

// Get range
const recent = await client.lRange('timeline:user:1', 0, 9); // First 10 items

// Trim list (keep only recent items)
await client.lTrim('timeline:user:1', 0, 99); // Keep 100 most recent

// List length
const count = await client.lLen('queue:tasks');

// Activity feed pattern
await client.lPush('feed:user:1', JSON.stringify({
  action: 'posted',
  timestamp: Date.now()
}));
await client.lTrim('feed:user:1', 0, 99); // Keep last 100 activities
```

### Sets

Use for unique collections, tags, relationships:

```javascript
// Add members
await client.sAdd('tags:article:1', ['nodejs', 'redis', 'database']);

// Remove member
await client.sRem('tags:article:1', 'database');

// Check membership
const isMember = await client.sIsMember('tags:article:1', 'nodejs');

// Get all members
const tags = await client.sMembers('tags:article:1');

// Count members
const count = await client.sCard('tags:article:1');

// Random member
const randomTag = await client.sRandMember('tags:article:1');

// Set operations
await client.sInter(['tags:article:1', 'tags:article:2']); // Intersection
await client.sUnion(['tags:article:1', 'tags:article:2']); // Union
await client.sDiff(['tags:article:1', 'tags:article:2']); // Difference

// Followers pattern
await client.sAdd('followers:user:1', 'user:2');
await client.sAdd('following:user:2', 'user:1');
const mutualFollowers = await client.sInter(['followers:user:1', 'following:user:1']);
```

### Sorted Sets

Use for leaderboards, rankings, time-series:

```javascript
// Add members with scores
await client.zAdd('leaderboard', [
  { score: 1000, value: 'player1' },
  { score: 850, value: 'player2' },
  { score: 920, value: 'player3' }
]);

// Get rank (0-based)
const rank = await client.zRank('leaderboard', 'player1');

// Get score
const score = await client.zScore('leaderboard', 'player1');

// Increment score
await client.zIncrBy('leaderboard', 10, 'player1');

// Get top N (descending)
const top10 = await client.zRevRange('leaderboard', 0, 9);
const top10WithScores = await client.zRevRangeWithScores('leaderboard', 0, 9);

// Get by score range
const highScorers = await client.zRangeByScore('leaderboard', 900, '+inf');

// Count in score range
const count = await client.zCount('leaderboard', 800, 1000);

// Remove by rank
await client.zRemRangeByRank('leaderboard', 100, -1); // Keep top 100

// Time-series pattern (using timestamps as scores)
const timestamp = Date.now();
await client.zAdd('events:user:1', { score: timestamp, value: JSON.stringify(event) });
// Get events from last hour
const hourAgo = Date.now() - 3600000;
const recentEvents = await client.zRangeByScore('events:user:1', hourAgo, '+inf');
```

### JSON

Use for complex nested objects (requires RedisJSON module):

```javascript
// Set JSON document
await client.json.set('user:2001', '$', {
  name: 'Alice',
  email: '[email protected]',
  address: {
    city: 'New York',
    country: 'USA'
  },
  orders: [101, 102, 103]
});

// Get entire document
const user = await client.json.get('user:2001');

// Get specific path
const city = await client.json.get('user:2001', { path: '$.address.city' });

// Update nested field
await client.json.set('user:2001', '$.address.city', '"Los Angeles"');

// Array operations
await client.json.arrAppend('user:2001', '$.orders', 104);
await client.json.arrLen('user:2001', '$.orders');
```

### Streams

Use for event logs, message queues, real-time data:

```javascript
// Add to stream
const messageId = await client.xAdd('events', '*', {
  action: 'user_login',
  userId: '1001',
  timestamp: Date.now().toString()
});

// Read from stream
const messages = await client.xRead({ key: 'events', id: '0' }, { COUNT: 10 });

// Consumer groups
await client.xGroupCreate('events', 'processors', '0', { MKSTREAM: true });

// Read as consumer
const entries = await client.xReadGroup('processors', 'consumer1',
  { key: 'events', id: '>' }, { COUNT: 5 });

// Acknowledge message
await client.xAck('events', 'processors', messageId);

// Get stream info
const info = await client.xInfoStream('events');
```

## Connection Management

### Connection Pooling with ioredis

```javascript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('ready', () => console.log('Redis ready'));
redis.on('error', (err) => console.error('Redis error:', err));
redis.on('close', () => console.log('Redis connection closed'));
redis.on('reconnecting', () => console.log('Redis reconnecting'));
```

### Cluster Configuration

```javascript
import { Cluster } from 'ioredis';

const cluster = new Cluster([
  { host: '127.0.0.1', port: 7000 },
  { host: '127.0.0.1', port: 7001 },
  { host: '127.0.0.1', port: 7002 }
], {
  redisOptions: {
    password: process.env.REDIS_PASSWORD
  },
  clusterRetryStrategy: (times) => Math.min(100 * times, 2000),
  enableReadyCheck: true,
  maxRedirections: 16
});
```

### Sentinel Configuration

```javascript
const redis = new Redis({
  sentinels: [
    { host: 'sentinel1', port: 26379 },
    { host: 'sentinel2', port: 26379 },
    { host: 'sentinel3', port: 26379 }
  ],
  name: 'mymaster',
  password: process.env.REDIS_PASSWORD
});
```

## Production Patterns

### Caching Strategy

```javascript
class CacheService {
  constructor(redis) {
    this.redis = redis;
    this.defaultTTL = 3600; // 1 hour
  }

  async get(key) {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key, value, ttl = this.defaultTTL) {
    await this.redis.setEx(key, ttl, JSON.stringify(value));
  }

  async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
    const cached = await this.get(key);
    if (cached) return cached;

    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }

  async invalidate(pattern) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Cache aside pattern
  async cacheAside(key, fetchFn, ttl = this.defaultTTL) {
    return this.getOrSet(key, fetchFn, ttl);
  }

  // Write-through pattern
  async writeThrough(key, value, saveFn, ttl = this.defaultTTL) {
    await saveFn(value);
    await this.set(key, value, ttl);
  }
}
```

### Rate Limiting

```javascript
class RateLimiter {
  constructor(redis) {
    this.redis = redis;
  }

  // Fixed window
  async checkRateLimit(userId, maxRequests, windowSeconds) {
    const key = `rate:${userId}:${Math.floor(Date.now() / 1000 / windowSeconds)}`;
    const requests = await this.redis.incr(key);

    if (requests === 1) {
      await this.redis.expire(key, windowSeconds);
    }

    return requests <= maxRequests;
  }

  // Sliding window
  async checkSlidingWindow(userId, maxRequests, windowSeconds) {
    const key = `rate:sliding:${userId}`;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    // Remove old entries
    await this.redis.zRemRangeByScore(key, 0, windowStart);

    // Count current entries
    const count = await this.redis.zCard(key);

    if (count < maxRequests) {
      await this.redis.zAdd(key, { score: now, value: `${now}` });
      await this.redis.expire(key, windowSeconds);
      return true;
    }

    return false;
  }

  // Token bucket
  async consumeToken(userId, refillRate, capacity) {
    const key = `token:${userId}`;
    const script = `
      local tokens = tonumber(redis.call('get', KEYS[1]))
      local last_refill = tonumber(redis.call('get', KEYS[2]))
      local now = tonumber(ARGV[1])
      local rate = tonumber(ARGV[2])
      local capacity = tonumber(ARGV[3])

      if tokens == nil then
        tokens = capacity
        last_refill = now
      else
        local elapsed = now - last_refill
        local refill = math.floor(elapsed * rate)
        tokens = math.min(capacity, tokens + refill)
        last_refill = now
      end

      if tokens > 0 then
        tokens = tokens - 1
        redis.call('set', KEYS[1], tokens)
        redis.call('set', KEYS[2], last_refill)
        return 1
      else
        return 0
      end
    `;

    const result = await this.redis.eval(script, 2,
      key, `${key}:refill`,
      Date.now(), refillRate, capacity
    );

    return result === 1;
  }
}
```

### Session Management

```javascript
class SessionManager {
  constructor(redis) {
    this.redis = redis;
    this.sessionTTL = 86400; // 24 hours
  }

  async createSession(userId, sessionData) {
    const sessionId = crypto.randomUUID();
    const key = `session:${sessionId}`;

    await this.redis.hSet(key, {
      userId,
      ...sessionData,
      createdAt: Date.now()
    });
    await this.redis.expire(key, this.sessionTTL);

    // Track user sessions
    await this.redis.sAdd(`user:${userId}:sessions`, sessionId);

    return sessionId;
  }

  async getSession(sessionId) {
    const key = `session:${sessionId}`;
    const session = await this.redis.hGetAll(key);

    if (Object.keys(session).length === 0) {
      return null;
    }

    // Extend TTL on access
    await this.redis.expire(key, this.sessionTTL);

    return session;
  }

  async updateSession(sessionId, data) {
    const key = `session:${sessionId}`;
    await this.redis.hSet(key, data);
    await this.redis.expire(key, this.sessionTTL);
  }

  async destroySession(sessionId) {
    const session = await this.getSession(sessionId);
    if (!session) return;

    await this.redis.del(`session:${sessionId}`);
    await this.redis.sRem(`user:${session.userId}:sessions`, sessionId);
  }

  async destroyUserSessions(userId) {
    const sessions = await this.redis.sMembers(`user:${userId}:sessions`);
    const pipeline = this.redis.pipeline();

    sessions.forEach(sessionId => {
      pipeline.del(`session:${sessionId}`);
    });
    pipeline.del(`user:${userId}:sessions`);

    await pipeline.exec();
  }
}
```

### Distributed Lock

```javascript
class DistributedLock {
  constructor(redis) {
    this.redis = redis;
  }

  async acquire(resource, ttl = 10000) {
    const token = crypto.randomUUID();
    const key = `lock:${resource}`;

    const acquired = await this.redis.set(key, token, 'PX', ttl, 'NX');
    return acquired ? token : null;
  }

  async release(resource, token) {
    const key = `lock:${resource}`;

    // Lua script to ensure we only delete our own lock
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    const result = await this.redis.eval(script, 1, key, token);
    return result === 1;
  }

  async withLock(resource, callback, ttl = 10000) {
    const token = await this.acquire(resource, ttl);

    if (!token) {
      throw new Error(`Failed to acquire lock: ${resource}`);
    }

    try {
      return await callback();
    } finally {
      await this.release(resource, token);
    }
  }
}
```

### Pub/Sub Pattern

```javascript
class PubSubService {
  constructor(redis) {
    this.publisher = redis;
    this.subscriber = redis.duplicate();
    this.handlers = new Map();
  }

  async subscribe(channel, handler) {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, []);
      await this.subscriber.subscribe(channel);
    }

    this.handlers.get(channel).push(handler);

    this.subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        const handlers = this.handlers.get(channel) || [];
        handlers.forEach(h => h(message));
      }
    });
  }

  async publish(channel, message) {
    const serialized = typeof message === 'string'
      ? message
      : JSON.stringify(message);

    await this.publisher.publish(channel, serialized);
  }

  async unsubscribe(channel) {
    await this.subscriber.unsubscribe(channel);
    this.handlers.delete(channel);
  }

  // Pattern-based subscription
  async psubscribe(pattern, handler) {
    await this.subscriber.psubscribe(pattern);

    this.subscriber.on('pmessage', (pat, channel, message) => {
      if (pat === pattern) {
        handler(channel, message);
      }
    });
  }
}
```

## Best Practices

### Key Naming Conventions
- Use colons for namespacing: `user:1001`, `session:abc123`
- Be descriptive: `cart:user:1001`, `order:2024:11:1001`
- Use consistent patterns: `{resource}:{id}`, `{resource}:{action}:{id}`
- Avoid spaces and special characters

### Performance Optimization
- Use pipelining for batch operations
- Use MGET/MSET for multiple keys
- Use SCAN instead of KEYS in production
- Set appropriate TTLs to prevent memory bloat
- Monitor memory usage with INFO command
- Use connection pooling
- Implement circuit breakers for resilience

### Error Handling

```javascript
async function robustRedisOperation(redis, operation) {
  const maxRetries = 3;
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation(redis);
    } catch (error) {
      lastError = error;

      // Don't retry on specific errors
      if (error.message.includes('WRONGTYPE') ||
          error.message.includes('SYNTAX')) {
        throw error;
      }

      // Exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, i) * 100)
      );
    }
  }

  throw lastError;
}
```

### Memory Management
- Use maxmemory configuration
- Set eviction policy (allkeys-lru, volatile-lru, etc.)
- Monitor memory fragmentation
- Use appropriate data structures (hashes for objects vs multiple keys)
- Compress large values before storing

### Security
- Use AUTH for password protection
- Enable TLS/SSL for encryption
- Use ACLs for user permissions (Redis 6+)
- Restrict dangerous commands (FLUSHALL, CONFIG)
- Implement network security (firewall, VPC)
- Rotate passwords regularly

## Common Patterns

### Cache-Aside (Lazy Loading)
1. Check cache first
2. If miss, fetch from database
3. Store in cache
4. Return data

### Write-Through
1. Write to cache
2. Write to database
3. Return success

### Write-Behind (Write-Back)
1. Write to cache
2. Return success
3. Asynchronously write to database

### Read-Through
Cache handles database reads automatically

## Troubleshooting

### Connection Issues
- Check Redis server is running: `redis-cli ping`
- Verify host/port configuration
- Check firewall rules
- Verify authentication credentials
- Check connection pool settings

### Performance Issues
- Monitor slow queries: `SLOWLOG GET 10`
- Check memory usage: `INFO memory`
- Monitor key eviction: `INFO stats`
- Use `MONITOR` carefully (impacts performance)
- Check network latency

### Data Issues
- Verify key exists: `EXISTS key`
- Check key type: `TYPE key`
- Inspect TTL: `TTL key`
- Use `SCAN` to find keys by pattern

## Reference Documentation

For detailed data type specifications, see:
→ **[reference/data-types.md](reference/data-types.md)**

For Node.js client comparisons and advanced features, see:
→ **[reference/nodejs-clients.md](reference/nodejs-clients.md)**

For production deployment and operations, see:
→ **[reference/production.md](reference/production.md)**

## Summary

You are a Redis expert who generates production-ready code, explains concepts clearly, debugs issues effectively, and recommends best practices. Always follow Redis conventions, choose appropriate data structures, implement proper error handling, and design for scalability and performance.
