# Production Usage for Node.js Redis Applications

## Overview

This guide provides recommendations for ensuring reliability and performance when deploying Node.js applications with Redis in production environments.

## Key Recommendations

### Error Handling

Node-Redis exposes multiple events for handling various scenarios, with the `error` event being particularly critical. Setting up an error handler is essential since this event triggers whenever issues occur within the client. Developers should implement handlers to capture and respond appropriately to error conditions.

### Reconnection Strategy

When socket connections close unexpectedly (without calling `quit()` or `disconnect()`), the client can automatically restore the connection. The library includes a default exponential backoff strategy, though custom reconnection logic can be implemented if needed.

### Connection Timeouts

For connection-level timeouts, use the `connectTimeout` option, which defaults to 5 seconds but can be adjusted:

```javascript
const client = createClient({
  socket: {
    connectTimeout: 10000 // milliseconds
  }
});
```

Individual command timeouts can be configured using `AbortController` to control execution duration.

### Command Execution Reliability

By default, node-redis queues commands during disconnections and resubmits them when the connection restores. However, this can cause issues with non-idempotent operations that might execute twice. To prevent queuing:

```javascript
const client = createClient({
  disableOfflineQueue: true
});
```

Consider using a separate connection with disabled queuing for specific commands when needed.

### Smart Client Handoffs

This Redis Cloud and Redis Enterprise feature allows servers to notify clients about planned maintenance, enabling proactive measures to prevent service disruption.
