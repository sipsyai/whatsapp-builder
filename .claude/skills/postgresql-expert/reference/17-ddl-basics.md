# 5.1. Table Basics

A relational database table functions similarly to a paper table, consisting of rows and columns. The columns have fixed number and order, each with a name, while rows vary based on stored data. As noted in the documentation, "SQL does not make any guarantees about the order of the rows in a table."

## Data Types and Columns

Each column requires a specified data type that constrains acceptable values. The system supports built-in types including `integer` for whole numbers, `numeric` for fractional values, `text` for character strings, `date` for calendar dates, `time` for time-of-day values, and `timestamp` for combined date-time information.

## Creating Tables

Use the `CREATE TABLE` command to define a new table. The syntax requires specifying the table name, column names, and their corresponding data types:

```sql
CREATE TABLE products (
    product_no integer,
    name text,
    price numeric
);
```

Column lists are comma-separated and enclosed in parentheses.

## Column Limits

Tables can contain between 250 and 1600 columns depending on data types, though such designs are considered unusual and potentially problematic.

## Removing Tables

The `DROP TABLE` command removes unwanted tables. PostgreSQL also supports `DROP TABLE IF EXISTS` to prevent errors when dropping non-existent tables.

## Modifying Existing Tables

For changes to existing table structures, refer to section 5.7 on altering tables. Basic table creation enables data population; advanced features for integrity and security are covered in subsequent sections.
