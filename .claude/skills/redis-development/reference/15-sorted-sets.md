# Redis Sorted Sets Documentation

## Overview

A Redis sorted set is a collection of unique strings (members) ordered by an associated score. When multiple strings share the same score, they are ordered lexicographically.

## Common Use Cases

- **Leaderboards**: Maintain ordered lists of highest scores in games or competitions
- **Rate limiters**: Build sliding-window rate limiters to control API requests

## Data Structure Characteristics

Sorted sets combine features of both sets and hashes:
- Like sets: composed of unique, non-repeating string elements
- Like hashes: each element associates with a floating-point value (the score)
- Elements maintain sorted order based on the data structure itself, not on-demand

## Ordering Rules

Elements are ordered by these criteria:
1. If scores differ, higher scores rank higher
2. If scores match, elements are ordered lexicographically by their string value
3. Strings cannot be equal since sorted sets contain only unique elements

## Basic Operations

**Adding Elements**: Use `ZADD` to add members with scores (similar to `SADD` but with an additional score parameter).

**Retrieving Ranges**:
- `ZRANGE` returns elements from lowest to highest score
- `ZREVRANGE` returns elements from highest to lowest score
- Add `WITHSCORES` to include score values in results

**Querying by Score**: `ZRANGEBYSCORE` retrieves elements within a specified score range.

**Removing Elements**: `ZREM` removes specific members; `ZREMRANGEBYSCORE` removes ranges by score.

**Rankings**: `ZRANK` and `ZREVRANK` return a member's position in the sorted set.

**Lexicographic Queries**: `ZRANGEBYLEX` retrieves elements within alphabetical ranges when scores are equal.

**Score Updates**: `ZINCRBY` adjusts a member's score by a specified amount.

## Implementation Note

Sorted sets use a dual-structure design with both a skip list and hash table, providing O(log(N)) insertion complexity while maintaining pre-sorted order for retrieval.
