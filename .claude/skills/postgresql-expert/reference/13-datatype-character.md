# 8.3. Character Types

## Overview

PostgreSQL offers several character data types for storing string data. The primary types include `character varying`, `character`, and `text`.

## Main Character Types

| Type | Description |
|------|-------------|
| `character varying(n)` / `varchar(n)` | Variable-length strings up to n characters |
| `character(n)` / `char(n)` / `bpchar(n)` | Fixed-length, padded with spaces |
| `text` | Unlimited variable-length strings |

## Key Characteristics

**Character Varying and Character:**
Both store strings up to n characters in length. Attempting to store longer strings raises an error unless excess characters are spaces. With explicit casting, over-length values are truncated without error. Strings shorter than the declared length are padded with spaces in `character` but stored as-is in `character varying`.

**Text Type:**
PostgreSQL's native string type accepts unlimited length. While not part of the SQL standard, most built-in string functions use `text` as their default type.

**Length Specification:**
The length n must exceed zero and cannot surpass 10,485,760. Without a length specifier, `varchar` and `text` accept any length. The `bpchar` type without a specifier treats trailing spaces as insignificant.

## Storage and Performance

Short strings (up to 126 bytes) require 1 byte plus actual content. Longer strings use 4 bytes overhead. The system automatically compresses long strings; maximum storage capacity is approximately 1 GB.

"There is no performance difference among these three types, apart from increased storage space when using the blank-padded type" — `character(n)` typically performs slowest due to storage overhead.

## Character Set

The database character set determines storable characters. The null character (code zero) cannot be stored.
