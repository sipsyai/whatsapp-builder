# 5.5. Constraints

Constraints limit the type and values of data that can be stored in tables. They enforce data integrity by raising errors when users attempt to insert or update data that violates defined rules.

## 5.5.1. Check Constraints

Check constraints allow you to specify that a column's value must satisfy a Boolean expression. For example:

```sql
CREATE TABLE products (
    product_no integer,
    name text,
    price numeric CHECK (price > 0)
);
```

You can name constraints explicitly using the `CONSTRAINT` keyword for clarity in error messages. Check constraints can reference multiple columns as table constraints:

```sql
CREATE TABLE products (
    product_no integer,
    name text,
    price numeric CHECK (price > 0),
    discounted_price numeric CHECK (discounted_price > 0),
    CHECK (price > discounted_price)
);
```

A check constraint is satisfied if the expression evaluates to true or null. Note: "PostgreSQL does not support `CHECK` constraints that reference table data other than the new or updated row being checked."

## 5.5.2. Not-Null Constraints

A not-null constraint ensures a column cannot contain null values:

```sql
CREATE TABLE products (
    product_no integer NOT NULL,
    name text NOT NULL,
    price numeric
);
```

A column can have at most one explicit not-null constraint. The inverse `NULL` constraint selects default behavior allowing nulls and is not standard SQL.

## 5.5.3. Unique Constraints

Unique constraints ensure data in a column or group of columns is unique across all table rows:

```sql
CREATE TABLE products (
    product_no integer UNIQUE,
    name text,
    price numeric
);
```

For multiple columns:

```sql
CREATE TABLE example (
    a integer,
    b integer,
    c integer,
    UNIQUE (a, c)
);
```

By default, two null values are not considered equal. Use `NULLS NOT DISTINCT` to treat nulls as equal for uniqueness purposes.

## 5.5.4. Primary Keys

A primary key constraint identifies rows uniquely and requires values to be both unique and not null:

```sql
CREATE TABLE products (
    product_no integer PRIMARY KEY,
    name text,
    price numeric
);
```

Multiple columns can form a composite primary key:

```sql
CREATE TABLE example (
    a integer,
    b integer,
    c integer,
    PRIMARY KEY (a, c)
);
```

A table can have at most one primary key. Adding a primary key automatically creates a unique B-tree index.

## 5.5.5. Foreign Keys

Foreign key constraints ensure values in a column match values in another table's row, maintaining referential integrity:

```sql
CREATE TABLE orders (
    order_id integer PRIMARY KEY,
    product_no integer REFERENCES products (product_no),
    quantity integer
);
```

If a column list is omitted, the referenced table's primary key is used. Foreign keys can reference multiple columns and support self-referential relationships.

**Deletion and Update Actions:**

- `ON DELETE NO ACTION` (default): Disallows deletion if referenced rows exist
- `ON DELETE RESTRICT`: Stricter; prevents deletion of referenced rows without deferral
- `ON DELETE CASCADE`: Automatically deletes referencing rows when referenced row is deleted
- `ON DELETE SET NULL`: Sets referencing columns to null when referenced row is deleted
- `ON DELETE SET DEFAULT`: Sets referencing columns to default values when referenced row is deleted

Similar `ON UPDATE` actions exist. Column lists can be specified for `SET NULL` and `SET DEFAULT` actions.

By default, a referencing row satisfies the constraint if any referencing column is null. Use `MATCH FULL` to require all referencing columns to be null to escape the constraint.

## 5.5.6. Exclusion Constraints

Exclusion constraints ensure that when any two rows are compared on specified columns using specified operators, at least one comparison returns false or null:

```sql
CREATE TABLE circles (
    c circle,
    EXCLUDE USING gist (c WITH &&)
);
```

These automatically create an index of the specified type.
