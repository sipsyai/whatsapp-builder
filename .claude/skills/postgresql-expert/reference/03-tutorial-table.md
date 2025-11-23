# 2.3. Creating a New Table

## Overview

You can create a new table by specifying the table name, along with all column names and their types.

## Basic Example

```sql
CREATE TABLE weather (
    city            varchar(80),
    temp_lo         int,           -- low temperature
    temp_hi         int,           -- high temperature
    prcp            real,          -- precipitation
    date            date
);
```

## Key Syntax Rules

- Enter commands into `psql` with line breaks; the tool recognizes commands are incomplete until a semicolon is provided
- "White space (i.e., spaces, tabs, and newlines) can be used freely in SQL commands"
- Two dashes (`--`) introduce comments that extend to the end of the line
- Keywords and identifiers are case-insensitive unless identifiers are double-quoted

## Data Types

The documentation explains common PostgreSQL data types:

- `varchar(80)` — stores character strings up to 80 characters
- `int` — standard integer type
- `real` — single precision floating-point numbers
- `date` — date values

PostgreSQL supports standard SQL types including `smallint`, `double precision`, `char(N)`, `time`, `timestamp`, and `interval`, plus geometric types and customizable user-defined types.

## Example with PostgreSQL-Specific Types

```sql
CREATE TABLE cities (
    name            varchar(80),
    location        point
);
```

The `point` type is PostgreSQL-specific for storing geographical locations.

## Removing Tables

To remove a table, use: `DROP TABLE tablename;`
