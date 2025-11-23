---
name: postgresql-expert
description: Expert guidance on PostgreSQL database management, SQL queries, data types, indexes, transactions, and optimization. Use when working with PostgreSQL databases, writing SQL queries, designing schemas, or troubleshooting performance issues.
---

# PostgreSQL Expert

Expert-level PostgreSQL database management and SQL development. Covers database design, query optimization, data types, indexing strategies, transactions, and advanced features.

## Quick Start

### Core Topics

**Tutorial & Basics**
- Database fundamentals and SQL language
- Table creation, data manipulation (INSERT, UPDATE, DELETE)
- Querying with SELECT, joins, and aggregate functions
- See [reference/01-tutorial.md](reference/01-tutorial.md)

**Data Types**
- Numeric, character, temporal, and specialized types
- JSON/JSONB for document storage
- UUIDs, arrays, and custom types
- See [reference/09-datatype.md](reference/09-datatype.md) through [reference/15-arrays.md](reference/15-arrays.md)

**Schema Design (DDL)**
- Table creation with constraints (PRIMARY KEY, FOREIGN KEY, CHECK, UNIQUE)
- Identity columns and auto-increment patterns
- Default values and ALTER TABLE operations
- Schema management and namespaces
- See [reference/16-ddl.md](reference/16-ddl.md) through [reference/22-ddl-schemas.md](reference/22-ddl-schemas.md)

**Query Optimization**
- Table expressions, LIMIT/OFFSET, and CTEs (WITH queries)
- Index types (B-Tree, Hash, GiST, GIN, BRIN)
- Multicolumn, unique, and partial indexes
- See [reference/23-queries.md](reference/23-queries.md) through [reference/31-indexes-partial.md](reference/31-indexes-partial.md)

**Concurrency & Transactions**
- MVCC (Multi-Version Concurrency Control)
- Transaction isolation levels (Read Committed, Repeatable Read, Serializable)
- Explicit locking strategies
- See [reference/32-mvcc.md](reference/32-mvcc.md) through [reference/34-explicit-locking.md](reference/34-explicit-locking.md)

**Data Manipulation (DML)**
- INSERT with ON CONFLICT (upserts)
- UPDATE operations
- DELETE operations
- RETURNING clause for modified data
- See [reference/35-dml-insert.md](reference/35-dml-insert.md) through [reference/38-dml-returning.md](reference/38-dml-returning.md)

## Common Workflows

### Create Optimized Table

```sql
-- Create table with constraints and indexes
CREATE TABLE users (
    user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    CHECK (char_length(username) >= 3)
);

-- Add indexes for common queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created ON users(created_at DESC);
CREATE INDEX idx_users_metadata ON users USING GIN(metadata);
```

### Complex Query with CTEs

```sql
-- Use WITH for readable complex queries
WITH active_users AS (
    SELECT user_id, email
    FROM users
    WHERE last_login > CURRENT_DATE - INTERVAL '30 days'
),
user_stats AS (
    SELECT user_id, COUNT(*) as order_count
    FROM orders
    WHERE user_id IN (SELECT user_id FROM active_users)
    GROUP BY user_id
)
SELECT u.email, s.order_count
FROM active_users u
JOIN user_stats s USING (user_id)
WHERE s.order_count > 5
ORDER BY s.order_count DESC;
```

### Upsert Pattern

```sql
-- INSERT with ON CONFLICT for upsert
INSERT INTO inventory (product_id, quantity)
VALUES (101, 50)
ON CONFLICT (product_id)
DO UPDATE SET
    quantity = inventory.quantity + EXCLUDED.quantity,
    updated_at = CURRENT_TIMESTAMP
RETURNING *;
```

### Transaction with Isolation

```sql
-- Use appropriate isolation level
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;

UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;

COMMIT;
```

## Data Type Selection Guide

**Integers**
- `SMALLINT` (-32768 to 32767)
- `INTEGER` (-2B to 2B)
- `BIGINT` (-9 quintillion to 9 quintillion)
- Use `GENERATED ALWAYS AS IDENTITY` for auto-increment

**Text**
- `VARCHAR(n)` for limited length
- `TEXT` for unlimited length (no performance penalty)

**Temporal**
- `DATE` for dates only
- `TIMESTAMP WITH TIME ZONE` for datetime (recommended)
- `INTERVAL` for durations

**Specialized**
- `JSONB` for document storage (binary, indexed)
- `UUID` for distributed unique identifiers
- `ARRAY` for lists (e.g., `INTEGER[]`)

See [reference/09-datatype.md](reference/09-datatype.md) for complete data type documentation.

## Index Strategy

**When to Index**
- Primary keys (automatic)
- Foreign keys (manual)
- Columns in WHERE clauses
- Columns in JOIN conditions
- Columns in ORDER BY

**Index Types**
- **B-Tree** (default): Equality, range queries, sorting
- **Hash**: Only equality (=)
- **GIN**: JSON, arrays, full-text search
- **GiST**: Geometric data, nearest-neighbor
- **BRIN**: Very large tables with natural ordering

**Partial Indexes**
```sql
-- Index only relevant rows
CREATE INDEX idx_active_orders
ON orders(created_at)
WHERE status = 'active';
```

See [reference/27-indexes.md](reference/27-indexes.md) through [reference/31-indexes-partial.md](reference/31-indexes-partial.md).

## JSON Operations

```sql
-- Store and query JSON
CREATE TABLE events (
    event_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    data JSONB NOT NULL
);

-- Query JSON fields
SELECT data->>'user_id' as user_id
FROM events
WHERE data @> '{"type": "login"}';

-- Index JSON fields
CREATE INDEX idx_events_type ON events((data->>'type'));
CREATE INDEX idx_events_data ON events USING GIN(data);
```

See [reference/10-datatype-json.md](reference/10-datatype-json.md) for JSON documentation.

## Transaction Isolation Levels

**Read Committed** (default)
- Sees committed changes from other transactions
- No dirty reads
- Suitable for most applications

**Repeatable Read**
- Consistent snapshot throughout transaction
- No phantom reads within snapshot
- Use for reports and consistency-critical operations

**Serializable**
- Full isolation, as if transactions ran sequentially
- May require retry logic for conflicts
- Use for financial transactions

See [reference/33-transaction-iso.md](reference/33-transaction-iso.md) for detailed isolation behavior.

## Schema Management

```sql
-- Create schema for organization
CREATE SCHEMA sales;
CREATE SCHEMA products;

-- Create table in schema
CREATE TABLE sales.orders (
    order_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id BIGINT NOT NULL,
    amount NUMERIC(10,2) NOT NULL
);

-- Set search path
SET search_path TO sales, public;
```

See [reference/22-ddl-schemas.md](reference/22-ddl-schemas.md) for schema documentation.

## Best Practices

**Schema Design**
- Use `BIGINT` for primary keys in high-volume tables
- Always use `TIMESTAMP WITH TIME ZONE` over `TIMESTAMP`
- Prefer `TEXT` over `VARCHAR` unless length constraint needed
- Use `GENERATED ALWAYS AS IDENTITY` over `SERIAL`

**Indexing**
- Index foreign keys manually
- Use partial indexes for subset queries
- Avoid over-indexing (each index adds write overhead)
- Monitor index usage with `pg_stat_user_indexes`

**Queries**
- Use CTEs (WITH) for complex queries
- Prefer `EXISTS` over `COUNT(*)` for existence checks
- Use `LIMIT` for pagination
- Add indexes for ORDER BY columns

**Transactions**
- Keep transactions short
- Use appropriate isolation level
- Handle serialization failures with retry logic
- Use `RETURNING` to get modified data

**Data Types**
- Use `JSONB` over `JSON` (binary, faster, indexable)
- Use `UUID` for distributed systems
- Use appropriate numeric precision to avoid overflow

## Reference Documentation

**Getting Started**
- [Tutorial Introduction](reference/01-tutorial.md)
- [Starting PostgreSQL](reference/02-tutorial-start.md)
- [Creating Tables](reference/03-tutorial-table.md)
- [Populating Data](reference/04-tutorial-populate.md)
- [Basic Queries](reference/05-tutorial-select.md)
- [Joins](reference/06-tutorial-join.md)
- [Foreign Keys](reference/07-tutorial-fk.md)
- [Transactions](reference/08-tutorial-transactions.md)

**Data Types**
- [Data Type Overview](reference/09-datatype.md)
- [JSON/JSONB](reference/10-datatype-json.md)
- [UUID](reference/11-datatype-uuid.md)
- [Date/Time](reference/12-datatype-datetime.md)
- [Character Types](reference/13-datatype-character.md)
- [Numeric Types](reference/14-datatype-numeric.md)
- [Arrays](reference/15-arrays.md)

**DDL (Schema)**
- [DDL Overview](reference/16-ddl.md)
- [Table Basics](reference/17-ddl-basics.md)
- [Constraints](reference/18-ddl-constraints.md)
- [Identity Columns](reference/19-ddl-identity-columns.md)
- [Default Values](reference/20-ddl-default.md)
- [ALTER TABLE](reference/21-ddl-alter.md)
- [Schemas](reference/22-ddl-schemas.md)

**Queries**
- [Query Overview](reference/23-queries.md)
- [Table Expressions](reference/24-queries-table-expressions.md)
- [LIMIT and OFFSET](reference/25-queries-limit.md)
- [WITH Queries (CTEs)](reference/26-queries-with.md)

**Indexes**
- [Index Overview](reference/27-indexes.md)
- [Index Types](reference/28-indexes-types.md)
- [Multicolumn Indexes](reference/29-indexes-multicolumn.md)
- [Unique Indexes](reference/30-indexes-unique.md)
- [Partial Indexes](reference/31-indexes-partial.md)

**Concurrency**
- [MVCC](reference/32-mvcc.md)
- [Transaction Isolation](reference/33-transaction-iso.md)
- [Explicit Locking](reference/34-explicit-locking.md)

**DML (Data Manipulation)**
- [INSERT](reference/35-dml-insert.md)
- [UPDATE](reference/36-dml-update.md)
- [DELETE](reference/37-dml-delete.md)
- [RETURNING](reference/38-dml-returning.md)

## Version Information

Documentation based on PostgreSQL 18.1. Compatible with PostgreSQL 14, 15, 16, 17, and 18.
