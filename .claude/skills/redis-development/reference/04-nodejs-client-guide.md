# node-redis Guide (JavaScript)

## Overview

The node-redis library enables JavaScript/Node.js developers to connect applications to Redis databases. It provides both basic connectivity and advanced features like vector search and JSON querying.

## Installation

Install the package via npm:

```
npm install redis
```

## Basic Connection and Usage

### Simple Connect Example

To connect to a Redis instance running on localhost at port 6379:

```javascript
import { createClient } from 'redis';

const client = createClient();
client.on('error', err => console.log('Redis Client Error', err));
await client.connect();
```

### String Operations

Store and retrieve simple string values:

```javascript
await client.set('key', 'value');
const value = await client.get('key');
console.log(value); // >>> value
```

### Hash Operations

Store and retrieve structured data using hashes:

```javascript
await client.hSet('user-session:123', {
    name: 'John',
    surname: 'Smith',
    company: 'Redis',
    age: 29
})

let userSession = await client.hGetAll('user-session:123');
console.log(JSON.stringify(userSession, null, 2));
```

## Connection Configuration

For non-default hosts or ports, use a connection URI: `redis[s]://[[username][:password]@][host][:port][/db-number]`

```javascript
createClient({
  url: 'redis://alice:[email protected]:6380'
});
```

## Connection Status

Check connection status with `client.isReady` (returns boolean) or `client.isOpen` for socket status.

## Closing Connections

Cleanly terminate connections using:

```javascript
await client.quit();
```

## Additional Resources

The official node-redis website and GitHub repository provide expanded examples and detailed connection configuration options for advanced use cases.
