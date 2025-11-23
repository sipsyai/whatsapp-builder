# Chapter 8. Data Types

PostgreSQL offers an extensive collection of native data types that users can leverage. Users also have the ability to define custom types using the `CREATE TYPE` command.

## Overview

The database system provides comprehensive built-in general-purpose data types. Many alternatives and historical names are available as aliases for backward compatibility, though some deprecated or internal-only types exist that aren't documented here.

## Data Type Categories

The platform supports the following major categories:

**Numeric Types**: Including integers of various sizes (smallint, integer, bigint), serial/autoincrementing types, arbitrary precision decimal numbers, and floating-point values.

**Monetary and Character Types**: Currency amounts alongside fixed and variable-length character strings.

**Temporal Types**: Date, time, timestamp, and interval types with optional timezone support.

**Geometric Types**: Points, lines, line segments, boxes, paths, polygons, and circles for plane geometry.

**Network Types**: IPv4/IPv6 addresses (inet, cidr) and MAC address formats.

**Advanced Types**: Boolean values, bit strings, JSON (both text and binary formats), UUID identifiers, XML data, text search types, ranges, arrays, composite types, and domain types.

## Key Characteristic

"Each data type has an external representation determined by its input and output functions." Some built-in types feature multiple possible input formats, particularly date/time types, while others maintain straightforward external representations.
