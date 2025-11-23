# Redis Lists Documentation

## Overview

Redis lists are linked lists containing string values. They serve two primary purposes:

- "Implement stacks and queues"
- "Build queue management for background worker systems"

## Basic Commands

The documentation covers essential list operations:

- **LPUSH/RPUSH**: Add elements to the head or tail respectively
- **LPOP/RPOP**: Remove and return elements from head or tail
- **LLEN**: "returns the length of a list"
- **LMOVE**: "atomically moves elements from one list to another"
- **LRANGE**: Extract a range of elements
- **LTRIM**: "reduces a list to the specified range of elements"

## Blocking Operations

For asynchronous workflows:

- **BLPOP**: "removes and returns an element from the head of a list. If the list is empty, the command blocks until an element becomes available or until the specified timeout is reached"
- **BLMOVE**: Atomically moves elements while blocking when the source is empty

## Use Cases

The examples demonstrate two common patterns:

**Queue Implementation (FIFO)**: Elements pushed left and popped right maintain first-in-first-out ordering

**Stack Implementation (LIFO)**: Pushing and popping from the same end creates last-in-first-out behavior

The documentation includes practical code samples across multiple programming languages including Python, Node.js, Java, Go, C#, and PHP to illustrate these concepts.
