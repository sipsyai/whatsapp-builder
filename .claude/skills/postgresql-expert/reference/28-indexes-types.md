# 11.2. Index Types

PostgreSQL provides several index types, each utilizing different algorithms suited to specific query patterns. The default index type is B-tree, created via the standard `CREATE INDEX` command. Other types require the `USING` keyword syntax.

## 11.2.1. B-Tree

B-tree indexes excel at handling equality and range queries on sortable data. They support operators like `<`, `<=`, `=`, `>=`, and `>`, as well as equivalent constructs such as `BETWEEN` and `IN`. These indexes also work with `IS NULL` and `IS NOT NULL` conditions.

Pattern matching with `LIKE` and `~` operators is possible when patterns are anchored to the string's beginning. B-tree indexes can additionally retrieve data in sorted order, though this isn't always faster than scanning and sorting.

## 11.2.2. Hash

Hash indexes store 32-bit hash codes derived from indexed column values, limiting their utility to simple equality comparisons using the `=` operator.

## 11.2.3. GiST

GiST indexes function as an infrastructure supporting multiple indexing strategies. The standard PostgreSQL distribution includes GiST operator classes for geometric data types, enabling operators like `<<`, `&<`, `@>`, and `<@`. These indexes also support nearest-neighbor searches for finding closest matches.

## 11.2.4. SP-GiST

Similar to GiST, SP-GiST provides infrastructure for diverse search implementations, including quadtrees, k-d trees, and radix trees. The standard distribution includes operator classes for two-dimensional points and supports nearest-neighbor searching capabilities.

## 11.2.5. GIN

GIN indexes are "inverted indexes" designed for multi-component values like arrays. They maintain separate entries for component values, efficiently handling presence-testing queries. Standard GIN operator classes for arrays support operators including `<@`, `@>`, `=`, and `&&`.

## 11.2.6. BRIN

BRIN (Block Range INdexes) store value summaries across consecutive physical block ranges. They're most effective for columns with values correlated to physical row ordering. For linearly sorted data types, these indexes track minimum and maximum values per block range, supporting range operators.
