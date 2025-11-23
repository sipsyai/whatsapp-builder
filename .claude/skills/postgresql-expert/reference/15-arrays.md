# PostgreSQL 8.15: Arrays

PostgreSQL allows table columns to be defined as variable-length multidimensional arrays. Arrays can contain any built-in or user-defined base type, enum type, composite type, range type, or domain.

## Declaration of Array Types

Array types are declared by appending square brackets (`[]`) to the element type name. For example:

```sql
CREATE TABLE sal_emp (
    name            text,
    pay_by_quarter  integer[],
    schedule        text[][]
);
```

Size limits can be specified but are not enforced: `integer[3][3]` is documentation only. PostgreSQL treats all arrays of a particular element type as the same type, regardless of dimensions or size.

The SQL standard syntax using `ARRAY` keyword is also supported:
```sql
pay_by_quarter  integer ARRAY[4]
```

## Array Value Input

Array literals use curly braces with comma-separated values:

```sql
'{ val1, val2, ... }'
```

For multidimensional arrays:
```sql
'{{1,2,3},{4,5,6},{7,8,9}}'
```

Elements can be quoted if they contain special characters. `NULL` represents null values. The `ARRAY` constructor syntax is an alternative:

```sql
ARRAY[10000, 10000, 10000, 10000]
ARRAY[['meeting', 'lunch'], ['training', 'presentation']]
```

## Accessing Arrays

Single elements use bracket notation with one-based indexing by default:

```sql
SELECT name FROM sal_emp WHERE pay_by_quarter[1] <> pay_by_quarter[2];
```

Array slices use colon notation:
```sql
SELECT schedule[1:2][1:1] FROM sal_emp WHERE name = 'Bill';
```

Bounds can be omitted: `[:2][2:]` uses the array's limits.

Useful functions include:
- `array_dims()` - returns dimensions as text
- `array_upper()` and `array_lower()` - get dimension bounds
- `array_length()` - returns length of specified dimension
- `cardinality()` - total element count

## Modifying Arrays

Complete replacement:
```sql
UPDATE sal_emp SET pay_by_quarter = '{25000,25000,27000,27000}'
    WHERE name = 'Carol';
```

Single element update:
```sql
UPDATE sal_emp SET pay_by_quarter[4] = 15000 WHERE name = 'Bill';
```

Slice update:
```sql
UPDATE sal_emp SET pay_by_quarter[1:2] = '{27000,27000}' WHERE name = 'Carol';
```

Arrays can be enlarged by assigning beyond current bounds (one-dimensional only). Concatenation uses `||` operator:

```sql
SELECT ARRAY[1,2] || ARRAY[3,4];  -- {1,2,3,4}
```

Functions `array_prepend()`, `array_append()`, and `array_cat()` provide alternatives.

## Searching in Arrays

Use comparison operators:
```sql
SELECT * FROM sal_emp WHERE 10000 = ANY (pay_by_quarter);
SELECT * FROM sal_emp WHERE 10000 = ALL (pay_by_quarter);
```

The `&&` operator checks overlap with another array. Functions `array_position()` and `array_positions()` find element locations:

```sql
SELECT array_position(ARRAY['sun','mon','tue',...], 'mon');  -- returns 2
```

## Array Input/Output Syntax

Arrays display with curly braces and comma delimiters. Most types use commas; `box` type uses semicolons. Double quotes appear around elements with special characters, empty strings, or matching "NULL". Explicit bounds notation shows non-default lower bounds:

```sql
'[1:1][-2:-1][3:5]={{{1,2,3},{4,5,6}}}'
```

Whitespace around braces and items is ignored unless within quoted elements.
