# 7.2. Table Expressions

A table expression computes a table by processing a `FROM` clause, optionally followed by `WHERE`, `GROUP BY`, and `HAVING` clauses. These transformations work sequentially on data to produce a virtual table.

## 7.2.1. The FROM Clause

The `FROM` clause derives tables from one or more table references in a comma-separated list. Multiple table references create a Cartesian product (cross join).

### Joined Tables

Several join types are available:

**Cross Join**: Produces every possible row combination from two tables. Syntax: `T1 CROSS JOIN T2`

**Qualified Joins** (INNER, LEFT OUTER, RIGHT OUTER, FULL OUTER):
- `INNER JOIN`: Returns rows matching the join condition
- `LEFT OUTER JOIN`: Keeps all rows from the left table, adding nulls where no match exists
- `RIGHT OUTER JOIN`: Keeps all rows from the right table, adding nulls where needed
- `FULL OUTER JOIN`: Combines both outer join behaviors

Join conditions use `ON` (Boolean expressions), `USING` (matching column names), or `NATURAL` (implicit column matching).

### Table and Column Aliases

Temporary names enable clearer references: `FROM table_reference AS alias`. The `AS` keyword is optional.

### Subqueries

Derived tables in parentheses can be aliased: `FROM (SELECT ...) AS alias_name`. A `VALUES` list also works as a subquery source.

### Table Functions

Functions returning row sets appear in `FROM` clauses. Use `WITH ORDINALITY` to add row numbering. `UNNEST` expands arrays into columns.

### LATERAL Subqueries

The `LATERAL` keyword allows subqueries to reference preceding `FROM` items, enabling cross-references within the same query.

## 7.2.2. The WHERE Clause

Syntax: `WHERE search_condition`

Each row passes through a Boolean test; only matching rows remain. The clause typically references table columns but can include scalar subqueries and complex conditions.

## 7.2.3. GROUP BY and HAVING Clauses

`GROUP BY` combines rows sharing identical values in specified columns, enabling aggregate calculations. Columns in the select list must either appear in `GROUP BY` or be wrapped in aggregate functions.

`HAVING` filters grouped results—functioning like `WHERE` but for groups rather than individual rows.

## 7.2.4. GROUPING SETS, CUBE, and ROLLUP

These advanced constructs enable complex grouping:

- `GROUPING SETS`: Specifies multiple grouping configurations
- `ROLLUP`: Generates hierarchical grouping with all prefixes
- `CUBE`: Produces all possible subset combinations

## 7.2.5. Window Function Processing

Window functions evaluate after grouping and aggregation. They operate on either original rows (absent grouping) or group rows (with aggregation). Multiple functions with matching `PARTITION BY`/`ORDER BY` clauses share consistent ordering.
