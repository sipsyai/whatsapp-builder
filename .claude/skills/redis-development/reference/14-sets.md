# Redis Sets Documentation

## Overview

A Redis set is an unordered collection of unique strings (members). Sets enable you to:

- **Track unique items** — Monitor distinct elements like unique IP addresses visiting a blog post
- **Represent relations** — Store user roles or group memberships
- **Perform set operations** — Execute intersection, union, and difference calculations efficiently

## Core Commands

**Adding and Removing Members:**
- `SADD` — Adds new members to a set
- `SREM` — Removes specified members from a set

**Membership Testing:**
- `SISMEMBER` — Tests whether a string belongs to a set
- `SMISMEMBER` — Tests multiple strings for set membership

**Set Cardinality:**
- `SCARD` — Returns the number of members in a set

**Set Operations:**
- `SINTER` — Returns common members across two or more sets (intersection)
- `SUNION` — Combines all members from multiple sets
- `SDIFF` — Returns members in the first set but not in others

**Retrieving Members:**
- `SMEMBERS` — Returns all members of a set
- `SPOP` — Removes and returns a random member
- `SRANDMEMBER` — Returns a random member without removing it

For a complete command reference, visit the [set commands list](https://redis.io/docs/latest/commands/?group=set).

## Practical Example

Store racing bike registrations by country:

```
SADD bikes:racing:france bike:1 bike:2 bike:3
SADD bikes:racing:usa bike:1 bike:4
```

Adding duplicate members returns 0 (already exists). Query intersections to find bikes racing in multiple countries, or use differences to identify region-specific entries.
