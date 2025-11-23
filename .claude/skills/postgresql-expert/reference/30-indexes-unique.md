# 11.6. Unique Indexes

Indexes can enforce column value uniqueness or combined uniqueness across multiple columns using this syntax:

```
CREATE UNIQUE INDEX name ON table (column [, ...]) [ NULLS [ NOT ] DISTINCT ];
```

## Key Features

**Index Type Limitation**
Only B-tree indexes support the unique constraint declaration.

**Null Handling**
By default, null values in unique columns are treated as distinct from each other, permitting multiple nulls. The `NULLS NOT DISTINCT` clause changes this behavior to treat nulls as equivalent values.

**Multi-column Indexes**
A unique index spanning multiple columns only rejects duplicate rows when all indexed columns match identically across records.

## Automatic Index Creation

PostgreSQL automatically generates unique indexes when you define unique constraints or primary keys. These automatically-created indexes enforce the constraints and cover the relevant columns, eliminating the need for manual index creation on unique columns.

> "There's no need to manually create indexes on unique columns; doing so would just duplicate the automatically-created index."
