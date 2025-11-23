# Redis Hashes Documentation

## Overview

Redis hashes function as record types structured as field-value pair collections. They're useful for representing basic objects and organizing grouped counters.

## Core Concepts

"Redis hashes are record types structured as collections of field-value pairs. You can use hashes to represent basic objects and to store groupings of counters, among other things."

Hashes have no practical field limits beyond available memory, making them versatile for various application needs.

## Key Commands

**Setting and Retrieving Data:**
- `HSET` - Establishes multiple hash fields simultaneously
- `HGET` - Obtains a single field value
- `HMGET` - Retrieves multiple field values as an array
- `HGETALL` - Returns all fields and their values

**Numeric Operations:**
- `HINCRBY` - Increments a field's numeric value by a specified amount

## Example Use Case

The documentation demonstrates storing bike information:
- Model: "Deimos"
- Brand: "Ergonom"
- Type: "Enduro bikes"
- Price: 4972

This data can be incrementally modified using `HINCRBY` to adjust prices or track statistics like ride counts and crash occurrences.

## Language Support

Examples are provided for multiple languages including Python, Node.js, Java (sync/async/reactive), Go, C#, PHP, and Rust (sync/async variants).
