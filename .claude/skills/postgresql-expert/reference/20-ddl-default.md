# 5.2. Default Values

A column can be assigned a default value. When a new row is created without values specified for certain columns, those columns are populated with their respective default values. A data manipulation command can also explicitly request that a column be set to its default value.

## Default Behavior

"If no default value is declared explicitly, the default value is the null value." This typically represents unknown data.

## Syntax

In table definitions, default values appear after the column data type:

```sql
CREATE TABLE products (
    product_no integer,
    name text,
    price numeric DEFAULT 9.99
);
```

## Dynamic Default Values

Default values can be expressions that are evaluated when the default is inserted (not when the table is created). Common examples include:

- **Timestamp columns**: Use `CURRENT_TIMESTAMP` to automatically set the insertion time
- **Serial numbers**: Use `nextval()` to generate successive values from a sequence object

```sql
CREATE TABLE products (
    product_no integer DEFAULT nextval('products_product_no_seq'),
    ...
);
```

## SERIAL Shorthand

PostgreSQL provides a convenient `SERIAL` shorthand for generating sequential numbers:

```sql
CREATE TABLE products (
    product_no SERIAL,
    ...
);
```

This shorthand is further documented in the Serial Types section.
