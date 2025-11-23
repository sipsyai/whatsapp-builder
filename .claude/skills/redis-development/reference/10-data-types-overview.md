# Redis Data Types Documentation

## Overview

Redis is a data structure server providing native data types to solve various problems from caching to queuing to event processing.

## Core Data Types

**Strings** - The most basic type, representing sequences of bytes. Commonly used for caching.

**Lists** - Ordered collections of strings sorted by insertion order, useful for queuing applications.

**Sets** - Unordered collections of unique strings offering O(1) add, remove, and existence testing operations.

**Hashes** - Record types modeled as field-value pairs, similar to dictionaries or maps in programming languages.

**Sorted Sets** - Collections of unique strings maintained in order by associated scores.

**Vector Sets** - Specialized types for high-dimensional vector data, optimizing machine learning and semantic search use cases via HNSW algorithm with cosine similarity.

**Streams** - Append-only log structures for recording events in order and processing them sequentially.

**Geospatial Indexes** - Enable location queries within geographic radius or bounding box parameters.

## Advanced Types

**Bitmaps** - Support bitwise operations on string values.

**Bitfields** - Efficiently encode multiple counters in single values with atomic operations.

**JSON** - Hierarchical structured data matching JSON format for importing, accessing, and querying.

## Probabilistic Data Types

- **HyperLogLog** - Cardinality estimates for large sets
- **Bloom Filters** - Element presence/absence checking
- **Cuckoo Filters** - Alternative to Bloom filters with different performance trade-offs
- **t-digest** - Percentile estimation from data streams
- **Top-K** - Ranking estimation within value streams
- **Count-min Sketch** - Frequency estimation for data points

## Time Series

Structures for storing and querying timestamped data points.

## Extension Options

1. Write custom server-side functions in Lua
2. Develop Redis modules using the modules API or community-supported options
