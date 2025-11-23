# 6.3. Deleting Data

## Overview

PostgreSQL allows you to remove unwanted data from tables using the DELETE command. Like INSERT operations, deletions work only with complete rows—you cannot delete individual columns. Rows can only be removed by specifying conditions they must match.

## Basic Syntax

The DELETE command works similarly to UPDATE. To remove rows meeting specific criteria:

```sql
DELETE FROM products WHERE price = 10;
```

This removes all products with a price of 10.

## Deleting All Rows

You can delete an entire table's contents with:

```sql
DELETE FROM products;
```

⚠️ **Warning:** This removes every row in the table. Use with caution.

## Key Points

- Rows cannot be addressed individually without conditions
- You can remove all rows matching a condition
- If the table has a primary key, you can target exact rows
- The entire row is deleted—partial row deletion is not possible
