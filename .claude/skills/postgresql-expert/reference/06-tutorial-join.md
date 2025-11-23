# 2.6. Joins Between Tables

## Overview

Queries can access multiple tables simultaneously through join operations. These queries combine rows from different tables based on specified conditions.

## Basic JOIN Syntax

The fundamental join operation compares columns across tables:

```sql
SELECT * FROM weather JOIN cities ON city = name;
```

This retrieves weather records paired with their corresponding city information where the `city` column matches the `name` column.

## Key Observations

When executing joins, duplicate column names appear in results since columns from both tables are concatenated. To avoid redundancy, explicitly specify desired columns:

```sql
SELECT city, temp_lo, temp_hi, prcp, date, location
    FROM weather JOIN cities ON city = name;
```

## Column Qualification

When tables share identical column names, qualify references with table names:

```sql
SELECT weather.city, weather.temp_lo, weather.temp_hi,
       weather.prcp, weather.date, cities.location
    FROM weather JOIN cities ON weather.city = cities.name;
```

Best practice dictates qualifying all columns in join queries to prevent failures if duplicate names are added later.

## Legacy Syntax

The older implicit join syntax achieves identical results:

```sql
SELECT * FROM weather, cities WHERE city = name;
```

The explicit `JOIN`/`ON` syntax clarifies join conditions more effectively than embedding them in `WHERE` clauses.

## OUTER JOINs

Inner joins exclude unmatched rows. Left outer joins preserve all left-table rows:

```sql
SELECT * FROM weather LEFT OUTER JOIN cities ON weather.city = cities.name;
```

Unmatched right-table columns display null values.

## Self-Joins

Tables can join against themselves using aliases to distinguish sides:

```sql
SELECT w1.city, w1.temp_lo AS low, w1.temp_hi AS high,
       w2.city, w2.temp_lo AS low, w2.temp_hi AS high
    FROM weather w1 JOIN weather w2
        ON w1.temp_lo < w2.temp_lo AND w1.temp_hi > w2.temp_hi;
```

Aliases simplify typing and are frequently used in practice.
