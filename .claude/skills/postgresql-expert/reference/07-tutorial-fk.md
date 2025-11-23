# 3.3. Foreign Keys

## Overview

The documentation explains how to maintain referential integrity in PostgreSQL databases. When you have related tables like `weather` and `cities`, you want to ensure that every weather record references an existing city.

## Problem Statement

Without foreign keys, developers would need to manually check the `cities` table before inserting `weather` records. This manual approach is problematic and inconvenient. PostgreSQL handles this automatically through foreign key constraints.

## Implementation Example

The `cities` table uses a primary key on the city name:

```sql
CREATE TABLE cities (
        name     varchar(80) primary key,
        location point
);
```

The `weather` table references this with a foreign key constraint:

```sql
CREATE TABLE weather (
        city      varchar(80) references cities(name),
        temp_lo   int,
        temp_hi   int,
        prcp      real,
        date      date
);
```

## Constraint Behavior

When attempting to insert invalid data, PostgreSQL rejects it with an error message indicating the foreign key constraint violation and explaining which key value doesn't exist in the referenced table.

## Further Learning

The documentation notes that foreign key behavior can be customized for specific application needs, with detailed information available in Chapter 5 of the PostgreSQL manual. Proper use of foreign keys significantly improves database application quality.
