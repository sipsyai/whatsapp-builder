# Redis Pub/Sub Documentation

## Overview

Redis Pub/Sub (Publish/Subscribe) implements a messaging pattern where senders (publishers) send messages to channels without knowledge of which receivers (subscribers) will consume them. Subscribers express interest in one or more channels and receive only messages relevant to their subscriptions.

## Core Commands

### SUBSCRIBE
Subscribes the client to one or more channels. The client enters a "subscribed" state and will receive messages published to these channels.

```
SUBSCRIBE channel1 channel2
```

### PUBLISH
Publishes a message to a channel. Returns the number of subscribers that received the message.

```
PUBLISH channel1 "Hello World"
```

### PSUBSCRIBE
Subscribes to channels matching a pattern using glob-style patterns (* and ? wildcards).

```
PSUBSCRIBE news.*
```

This subscribes to all channels starting with "news."

### UNSUBSCRIBE
Unsubscribes from specified channels. If no channel is specified, unsubscribes from all channels.

```
UNSUBSCRIBE channel1
```

### PUNSUBSCRIBE
Unsubscribes from channel patterns.

## Additional Commands

- **PUBSUB CHANNELS**: Lists currently active channels
- **PUBSUB NUMSUB**: Returns subscriber count for specified channels
- **PUBSUB NUMPAT**: Returns count of pattern subscriptions

## Key Characteristics

- **Fire and Forget**: Messages are not persisted. If no subscribers are listening, the message is lost
- **Push-Based**: Subscribers receive messages as they are published
- **Decoupling**: Publishers and subscribers don't need to know about each other
- **Pattern Matching**: Supports wildcard subscriptions for flexible channel matching

## Important Considerations

- Clients in subscribed state cannot execute regular commands (except subscription-related commands)
- Messages are delivered to all subscribers immediately
- No message history or replay capability
- Not suitable for reliable message queuing (use Streams instead)

## Use Cases

- Real-time notifications and alerts
- Chat applications
- Broadcasting updates to multiple clients
- Event distribution systems
- Live dashboards and monitoring

## Sharded Pub/Sub (Redis 7.0+)

Redis 7.0 introduced sharded Pub/Sub for use in cluster mode, where channels are bound to cluster slots for better scalability.
