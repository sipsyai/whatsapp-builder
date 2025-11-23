# 5.7. Modifying Tables

## Overview

When table structures need adjustment after creation or data population, PostgreSQL offers commands to modify existing tables without requiring recreation. This approach preserves data and maintains references from other database objects.

## Supported Modifications

You can perform the following operations:

- Add columns
- Remove columns
- Add constraints
- Remove constraints
- Modify default values
- Change column data types
- Rename columns
- Rename tables

All modifications use the `ALTER TABLE` command.

## Adding a Column

```sql
ALTER TABLE products ADD COLUMN description text;
```

New columns initially contain null values or specified defaults. A helpful feature: "Adding a column with a constant default value does not require each row of the table to be updated when the ALTER TABLE statement is executed."

You can also include constraints during column addition:

```sql
ALTER TABLE products ADD COLUMN description text CHECK (description <> '');
```

## Removing a Column

```sql
ALTER TABLE products DROP COLUMN description;
```

This eliminates all data and related constraints. If another table references this column via foreign key, use `CASCADE` to authorize dependent constraint removal:

```sql
ALTER TABLE products DROP COLUMN description CASCADE;
```

## Adding Constraints

```sql
ALTER TABLE products ADD CHECK (name <> '');
ALTER TABLE products ADD CONSTRAINT some_name UNIQUE (product_no);
ALTER TABLE products ADD FOREIGN KEY (product_group_id) REFERENCES product_groups;
```

For not-null constraints:

```sql
ALTER TABLE products ALTER COLUMN product_no SET NOT NULL;
```

## Removing Constraints

```sql
ALTER TABLE products DROP CONSTRAINT some_name;
```

For not-null constraints:

```sql
ALTER TABLE products ALTER COLUMN product_no DROP NOT NULL;
```

## Changing Default Values

```sql
ALTER TABLE products ALTER COLUMN price SET DEFAULT 7.77;
ALTER TABLE products ALTER COLUMN price DROP DEFAULT;
```

## Changing Data Types

```sql
ALTER TABLE products ALTER COLUMN price TYPE numeric(10,2);
```

For complex conversions, include a `USING` clause to specify value transformation logic.

## Renaming

**Column:**
```sql
ALTER TABLE products RENAME COLUMN product_no TO product_number;
```

**Table:**
```sql
ALTER TABLE products RENAME TO items;
```
