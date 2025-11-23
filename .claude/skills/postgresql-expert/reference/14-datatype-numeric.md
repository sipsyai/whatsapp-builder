# 8.1. Numeric Types

PostgreSQL offers a variety of numeric data types designed for different storage requirements and precision levels.

## Overview

The system supports two-, four-, and eight-byte integers, four- and eight-byte floating-point numbers, and decimals with selectable precision. A comprehensive table details all available types, their storage sizes, and ranges.

## 8.1.1. Integer Types

Three integer types serve different needs:

- **smallint**: Uses 2 bytes, stores values from -32,768 to +32,767
- **integer**: Uses 4 bytes, optimal balance of range and performance (-2,147,483,648 to +2,147,483,647)
- **bigint**: Uses 8 bytes for large ranges (-9,223,372,036,854,775,808 to +9,223,372,036,854,775,807)

The `integer` type represents the standard choice for most applications, while `smallint` conserves space and `bigint` accommodates exceptionally large values.

## 8.1.2. Arbitrary Precision Numbers

The `numeric` type handles numbers with extensive digit counts, making it ideal for scenarios requiring exactness, such as monetary calculations.

**Key Concepts:**
- *Precision* represents the total count of significant digits
- *Scale* indicates decimal digits to the right of the decimal point

**Declaration syntax includes:**

```sql
NUMERIC(precision, scale)
NUMERIC(precision)
NUMERIC
```

An unconstrained `numeric` column accepts values up to implementation limits (131,072 digits before decimal, 16,383 after).

**Special values** include `Infinity`, `-Infinity`, and `NaN`, adapted from IEEE 754 standards. These must be quoted in SQL commands and are recognized case-insensitively.

## 8.1.3. Floating-Point Types

Two inexact, variable-precision types implement IEEE Standard 754:

- **real**: 4 bytes, range approximately 1E-37 to 1E+37, minimum 6 decimal digit precision
- **double precision**: 8 bytes, range approximately 1E-307 to 1E+308, minimum 15 digit precision

These types are suitable for scientific calculations but inappropriate for monetary amounts requiring exactness.

## 8.1.4. Serial Types

The `smallserial`, `serial`, and `bigserial` types provide autoincrementing columns:

- **serial**: Creates an integer autoincrementing column (range 1 to 2,147,483,647)
- **bigserial**: Creates an 8-byte autoincrementing column for larger identifier counts
- **smallserial**: Creates a 2-byte autoincrementing column

Internally, these notational conveniences generate sequences with default values and NOT NULL constraints.
