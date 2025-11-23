# 6.4. Returning Data from Modified Rows

## Overview

The `RETURNING` clause is an optional feature available with `INSERT`, `UPDATE`, `DELETE`, and `MERGE` commands that retrieves data from modified rows without requiring a separate database query. This capability is particularly valuable when identifying modified rows would be difficult through other means.

## RETURNING Clause Content

The `RETURNING` clause accepts the same expressions as a `SELECT` statement's output list. It can reference columns from the target table or include value expressions. The shorthand `RETURNING *` selects all columns from the target table in their original order.

## Usage by Command Type

**INSERT**: By default, `RETURNING` provides the newly inserted row data. This is especially useful with computed default values. A common example involves serial columns:

```sql
CREATE TABLE users (firstname text, lastname text, id serial primary key);
INSERT INTO users (firstname, lastname) VALUES ('Joe', 'Cool') RETURNING id;
```

**UPDATE**: The clause returns the new content of modified rows. Example:

```sql
UPDATE products SET price = price * 1.10
  WHERE price <= 99.99
  RETURNING name, price AS new_price;
```

**DELETE**: Returns the deleted row's content:

```sql
DELETE FROM products
  WHERE obsoletion_date = 'today'
  RETURNING *;
```

**MERGE**: Provides source row data plus inserted, updated, or deleted target row content. Qualifying the return list avoids duplicate columns.

## Old and New Values

Commands support explicitly returning both old and new row content using `old` and `new` qualifiers:

```sql
UPDATE products SET price = price * 1.10
  WHERE price <= 99.99
  RETURNING name, old.price, new.price, new.price - old.price AS price_change;
```

Old values are typically `NULL` for inserts; new values are `NULL` for deletes. However, exceptions exist, such as `INSERT ... ON CONFLICT DO UPDATE` scenarios.

## Trigger Interaction

When triggers exist on the target table, `RETURNING` reflects modifications made by those triggers, enabling inspection of trigger-computed columns.
