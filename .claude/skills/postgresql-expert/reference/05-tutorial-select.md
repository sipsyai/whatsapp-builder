# 2.5. Querying a Table

## Overview

Data retrieval from tables uses the SQL `SELECT` statement, which comprises three main components: a select list (columns to return), a table list (source tables), and optional qualifications (row restrictions).

## Basic Selection

The simplest query retrieves all rows and columns using the wildcard:

```sql
SELECT * FROM weather;
```

This is equivalent to explicitly naming each column. The asterisk represents "all columns."

## Column Expressions

You can compute derived values in the select list:

```sql
SELECT city, (temp_hi+temp_lo)/2 AS temp_avg, date FROM weather;
```

The `AS` clause renames output columns and is optional.

## Filtering Results

The `WHERE` clause filters rows based on Boolean expressions using `AND`, `OR`, and `NOT` operators:

```sql
SELECT * FROM weather WHERE city = 'San Francisco' AND prcp > 0.0;
```

## Sorting Output

The `ORDER BY` clause arranges results in sorted order:

```sql
SELECT * FROM weather ORDER BY city, temp_lo;
```

Multiple columns ensure consistent ordering.

## Removing Duplicates

The `DISTINCT` keyword eliminates duplicate rows:

```sql
SELECT DISTINCT city FROM weather ORDER BY city;
```

Using `DISTINCT` with `ORDER BY` guarantees consistent, ordered results.
