# 2.4. Populating a Table With Rows

## INSERT Statement

The basic method for adding data to a table uses the `INSERT` statement. A simple example:

```sql
INSERT INTO weather VALUES ('San Francisco', 46, 50, 0.25, '1994-11-27');
```

String values require single quotes, while numeric values don't. The documentation notes that "the `date` type is actually quite flexible in what it accepts," though using unambiguous formats is recommended.

For coordinate data like points, provide the pair in the appropriate format:

```sql
INSERT INTO cities VALUES ('San Francisco', '(-194.0, 53.0)');
```

## Explicit Column Specification

Rather than relying on column order, you can specify columns explicitly:

```sql
INSERT INTO weather (city, temp_lo, temp_hi, prcp, date)
    VALUES ('San Francisco', 43, 57, 0.0, '1994-11-29');
```

This approach offers flexibility—columns can appear in any order, and you can omit columns that contain unknown values:

```sql
INSERT INTO weather (date, city, temp_hi, temp_lo)
    VALUES ('1994-11-29', 'Hayward', 54, 37);
```

## COPY for Bulk Loading

For loading large datasets from files, the `COPY` command offers better performance than multiple `INSERT` statements. The syntax is straightforward:

```sql
COPY weather FROM '/home/user/weather.txt';
```

Note that the file path must be accessible to the database server, not the client. Data should use tab-separated values, with `\N` representing NULL entries.
