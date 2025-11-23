# 11.3. Multicolumn Indexes

An index can be defined on more than one column of a table. For example, with a table structure like:

```sql
CREATE TABLE test2 (
  major int,
  minor int,
  name varchar
);
```

If you frequently run queries filtering on multiple columns, you might create a multicolumn index:

```sql
CREATE INDEX test2_mm_idx ON test2 (major, minor);
```

## Supported Index Types

Only B-tree, GiST, GIN, and BRIN index types support multiple-key-column indexes. Indexes can contain "up to 32 columns, including INCLUDE columns."

## B-tree Index Behavior

A multicolumn B-tree index works most efficiently when query conditions constrain the leading (leftmost) columns. Equality constraints on leading columns, combined with inequality constraints on the first unconstrained column, effectively limit the index scan portion.

B-tree indexes can apply skip scan optimization, allowing them to "apply every column constraint when navigating through the index via repeated index searches" even when earlier columns lack equality constraints.

## GiST, GIN, and BRIN Indexes

- **GiST indexes**: Most effective when the first column has many distinct values
- **GIN indexes**: Search effectiveness remains consistent regardless of which columns are queried
- **BRIN indexes**: Like GIN, effectiveness is uniform across different column combinations

## Best Practices

"Multicolumn indexes should be used sparingly." Single-column indexes typically provide sufficient performance while saving space. Indexes exceeding three columns rarely prove beneficial unless table usage patterns are highly specialized.
