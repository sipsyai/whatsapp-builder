# Redis Streams Documentation

## Overview

Redis Streams is an append-only log data structure that enables event sourcing and message queue patterns. Each entry in a stream has a unique ID and contains field-value pairs.

## Main Use Cases

- **Event Sourcing**: Record and replay events in order
- **Message Queues**: Build reliable message processing systems
- **Real-time Analytics**: Process data streams in real-time
- **Activity Feeds**: Track user activities and timelines

## Key Commands

### XADD
Adds a new entry to a stream with an auto-generated or specified ID.

### XREAD
Reads entries from one or more streams, optionally blocking until new data arrives.

### XRANGE
Returns entries within a specified ID range.

### XLEN
Returns the number of entries in a stream.

### Consumer Groups
Streams support consumer groups for distributed message processing, allowing multiple consumers to process different messages from the same stream without duplicates.

- **XGROUP CREATE**: Creates a consumer group
- **XREADGROUP**: Reads entries as part of a consumer group
- **XACK**: Acknowledges processed entries

## Note

This is a simplified summary. The full Streams documentation is extensive and covers advanced topics like claiming pending entries, stream trimming, and detailed consumer group management.
