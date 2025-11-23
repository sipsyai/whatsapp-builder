# 6.2. Updating Data

The modification of existing database data is called updating. You can modify individual rows, entire tables, or specific subsets of rows, with each column updated independently while others remain unchanged.

## Basic Requirements

The UPDATE command requires three essential pieces of information:

1. The table and column name to modify
2. The new column value
3. Which row(s) to update

Since SQL typically lacks built-in unique row identifiers, you must specify conditions that rows must satisfy for updating. Primary keys enable reliable targeting of individual rows.

## Example Usage

A simple update example: "UPDATE products SET price = 10 WHERE price = 5;" This command changes all products priced at 5 to cost 10, affecting zero, one, or multiple rows without error.

## Command Structure

The UPDATE keyword precedes the table name (optionally schema-qualified). The SET keyword follows, introducing the column assignment with an equals sign and new value—which can be any scalar expression, not just constants.

To raise all product prices by 10%, you could write: "UPDATE products SET price = price * 1.10;" The expression can reference existing row values. Omitting the WHERE clause updates all table rows; including it restricts updates to matching rows.

The equals sign in SET represents assignment, while WHERE uses comparison—these don't create ambiguity. WHERE conditions can use various operators beyond equality tests and must evaluate to Boolean results.

## Multiple Column Updates

Update multiple columns by listing assignments in the SET clause: "UPDATE mytable SET a = 5, b = 3, c = 1 WHERE a > 0;"
