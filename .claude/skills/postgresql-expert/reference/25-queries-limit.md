# 7.6. LIMIT and OFFSET

## Overview

The `LIMIT` and `OFFSET` clauses allow you to retrieve a subset of rows from a query result:

```sql
SELECT select_list
    FROM table_expression
    [ ORDER BY ... ]
    [ LIMIT { count | ALL } ]
    [ OFFSET start ]
```

## LIMIT Clause

When you specify a limit count, the query returns no more than that many rows (though it may return fewer if the query produces fewer results). Using `LIMIT ALL` or passing a NULL argument is equivalent to omitting the `LIMIT` clause entirely.

## OFFSET Clause

The `OFFSET` clause directs the database to skip a specified number of rows before returning results. `OFFSET 0` and omitting the clause have the same effect, as does passing a NULL argument.

## Combined Usage

When both clauses are present, the system first skips the rows specified by `OFFSET`, then returns the number of rows specified by `LIMIT`.

## Important Considerations

**Order Matters**: Always use an `ORDER BY` clause with `LIMIT` to ensure consistent, predictable results. "Without explicit ordering, you will get an unpredictable subset of the query's rows."

**Performance**: Large `OFFSET` values can be inefficient since the database must still compute all skipped rows internally.

**Query Plans**: Different `LIMIT`/`OFFSET` values may produce different execution plans, potentially yielding different row orders unless `ORDER BY` enforces a specific sequence.
