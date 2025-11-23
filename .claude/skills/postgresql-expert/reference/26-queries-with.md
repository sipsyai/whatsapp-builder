# 7.8. WITH Queries (Common Table Expressions)

## Overview

The `WITH` clause enables creation of auxiliary statements for use in larger queries. These Common Table Expressions (CTEs) function as temporary tables existing only for a single query. Each auxiliary statement can be a `SELECT`, `INSERT`, `UPDATE`, `DELETE`, or `MERGE` statement.

## SELECT in WITH

The primary benefit of `SELECT` in `WITH` is decomposing complex queries into simpler, more readable parts. Rather than nesting multiple sub-selects, developers can define named intermediate results and reference them sequentially.

## Recursive Queries

The `RECURSIVE` modifier transforms `WITH` from syntactic convenience into a powerful feature enabling self-referential queries. A recursive `WITH` query consists of a non-recursive term followed by `UNION` or `UNION ALL`, then a recursive term.

**Execution Process:**
1. Evaluate the non-recursive term, placing results in a working table
2. Repeatedly evaluate the recursive term using the working table's contents, continuing until no new rows are produced

### Search Order

For tree traversals, results can be ordered depth-first or breadth-first by computing an ordering column. PostgreSQL provides built-in `SEARCH DEPTH FIRST BY` and `SEARCH BREADTH FIRST BY` syntax to automatically generate ordering columns.

### Cycle Detection

Recursive queries risk infinite loops if cycles exist in the data. The `CYCLE` clause provides built-in syntax for detecting cycles: "CYCLE id SET is_cycle USING path" automatically tracks visited nodes and prevents re-processing.

## CTE Materialization

By default, non-recursive, side-effect-free `WITH` queries referenced once are folded into parent queries for optimization. The `MATERIALIZED` keyword forces separate calculation, while `NOT MATERIALIZED` forces merging into the parent query. This choice affects performance when queries reference temporary results multiple times.

## Data-Modifying Statements in WITH

Data-modifying statements (`INSERT`, `UPDATE`, `DELETE`, `MERGE`) can appear in `WITH` clauses, typically using `RETURNING` to produce temporary tables for subsequent operations. These statements execute exactly once, completely, regardless of whether their output is fully consumed.

**Important constraints:**
- Recursive self-references in data-modifying statements are prohibited
- All sub-statements execute concurrently with identical snapshots
- Updating the same row twice in one statement is unsupported
