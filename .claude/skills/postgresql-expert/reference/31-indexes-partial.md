# 11.8. Partial Indexes

A partial index is constructed over a subset of a table, with the subset defined by a conditional expression (the _predicate_). The index only contains entries for rows satisfying this predicate.

## Primary Use Cases

**Excluding Common Values**

One major application involves avoiding indexing frequently occurring values. Since queries searching for common values (appearing in more than a few percent of rows) typically won't utilize an index anyway, excluding them reduces index size and accelerates both index-dependent queries and table updates.

For example, in a web server access log table, if most accesses come from your organization's IP range, you could create an index excluding that range:

```sql
CREATE INDEX access_log_client_ip_ix ON access_log (client_ip)
WHERE NOT (client_ip > inet '192.168.100.0' AND
           client_ip < inet '192.168.100.255');
```

**Excluding Uninteresting Values**

Partial indexes can filter out data your typical workload ignores. An example: for orders with both billed and unbilled records, where unbilled orders comprise a small portion yet receive frequent access:

```sql
CREATE INDEX orders_unbilled_index ON orders (order_nr)
    WHERE billed is not true;
```

**Enforcing Uniqueness on Subsets**

Partial unique indexes enforce uniqueness only among rows matching the predicate:

```sql
CREATE UNIQUE INDEX tests_success_constraint ON tests (subject, target)
    WHERE success;
```

## Important Limitations

PostgreSQL can only use a partial index when the query's `WHERE` clause mathematically implies the index predicate. The system recognizes simple inequality implications but otherwise requires exact matching. Parameterized queries don't work with partial indexes since parameter values aren't known at planning time.

## When NOT to Use Partial Indexes

Creating many non-overlapping partial indexes (one per category) is inefficient. A single multi-column index performs better. For truly large datasets, consider table partitioning instead, as the system better understands the relationships between partitioned tables and their indexes.
