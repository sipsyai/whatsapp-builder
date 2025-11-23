# 8.14. JSON Types

## Overview

PostgreSQL supports two JSON data types for storing JSON (JavaScript Object Notation) data as specified in RFC 7159: `json` and `jsonb`. Additionally, PostgreSQL provides the `jsonpath` data type for efficient JSON querying.

## Key Differences: json vs jsonb

The `json` type preserves the exact input text, including whitespace and key ordering, requiring reprocessing on each query execution. The `jsonb` type stores data in decomposed binary format, making it "significantly faster to process, since no reparsing is needed." While `jsonb` input is slower due to conversion overhead, it supports indexing and doesn't preserve insignificant whitespace or object key order.

## JSON Primitive Types and PostgreSQL Mapping

| JSON Type | PostgreSQL Type | Notes |
|-----------|-----------------|-------|
| string | text | `\u0000` disallowed |
| number | numeric | `NaN` and `infinity` disallowed |
| boolean | boolean | Only lowercase `true`/`false` accepted |
| null | (none) | SQL `NULL` is different |

## Input and Output Syntax

Valid JSON expressions include scalars, arrays, and objects:

```sql
SELECT '5'::json;
SELECT '[1, 2, "foo", null]'::json;
SELECT '{"bar": "baz", "balance": 7.77}'::json;
```

## jsonb Containment and Existence

The `@>` operator tests whether one document contains another. The `?` operator checks if a string appears as an object key or array element at the top level.

## jsonb Indexing

GIN indexes support efficient searching with two operator classes:
- Default `jsonb_ops`: supports `?`, `?|`, `?&`, `@>`, `@?`, `@@`
- `jsonb_path_ops`: supports `@>`, `@?`, `@@` with better performance for containment queries

## jsonb Subscripting

Array-style subscripting extracts and modifies elements:

```sql
SELECT ('{"a": 1}'::jsonb)['a'];
UPDATE table_name SET jsonb_field['key'] = '1';
```

## jsonpath Type

The `jsonpath` type implements the SQL/JSON path language using JavaScript conventions:
- Dot (`.`) for member access
- Square brackets (`[]`) for array access
- Zero-based array indexing

Path expressions can include literals, variables, accessor operators, and filter expressions for querying JSON data efficiently.
