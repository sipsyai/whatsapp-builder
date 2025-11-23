# Redis JSON Data Type Documentation

## Overview

Redis JSON provides JavaScript Object Notation (JSON) support for Redis, enabling storage, updates, and retrieval of JSON values as a native data type. It integrates seamlessly with the Redis Query Engine for indexing and querying JSON documents.

## Primary Features

- **Full JSON Standard Support**: Complete compatibility with JSON specifications
- **JSONPath Syntax**: Enables element selection and updates within documents using JSONPath expressions
- **Binary Tree Structure**: Documents stored as binary data in tree format for rapid sub-element access
- **Typed Atomic Operations**: All JSON value types support atomic operations

## Core Commands

### JSON.SET
Sets a Redis key with a JSON value. Accepts all JSON value types.

**Example**:
```
JSON.SET bike $ '"Hyperion"'
JSON.GET bike $
JSON.TYPE bike $
```

### String Operations
- `JSON.STRLEN`: Returns string length
- `JSON.STRAPPEND`: Appends text to strings

### Numeric Operations
- `JSON.NUMINCRBY`: Increments numeric values

### Array Operations
- `JSON.ARRAPPEND`: Adds elements to arrays
- `JSON.ARRINSERT`: Inserts elements at specific positions
- `JSON.ARRTRIM`: Trims arrays to specified ranges
- `JSON.ARRPOP`: Removes and returns array elements

### Object Operations
- `JSON.OBJLEN`: Returns object property count
- `JSON.OBJKEYS`: Lists object property names

## JSONPath Capabilities

The implementation supports advanced path expressions including:
- Wildcard selections (`*`)
- Array slicing (`[0:2]`)
- Recursive descent (`..`)
- Filter expressions with logical operators and regex matching

This enables complex queries across nested JSON structures for data retrieval and modification operations.
