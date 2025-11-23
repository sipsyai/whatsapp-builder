# 3.4. Transactions

## Overview

Transactions form a cornerstone concept for database systems. They bundle multiple operations into a single atomic unit where either all steps execute successfully or none take effect at all. Intermediate states remain invisible to concurrent transactions, and system failures prevent partial updates from affecting the database.

## The Banking Example

Consider a bank database tracking customer account balances and branch totals. To transfer $100 from Alice to Bob requires four separate UPDATE statements:

- Debit Alice's account
- Adjust Alice's branch total
- Credit Bob's account
- Adjust Bob's branch total

Without transactions, a system failure could leave Bob credited without debiting Alice, creating serious problems. Grouping these updates provides atomicity—"either happens completely or not at all."

## Transaction Implementation in PostgreSQL

In PostgreSQL, transactions are established with `BEGIN` and `COMMIT` commands. If errors occur mid-transaction, `ROLLBACK` cancels all updates. Notably, PostgreSQL treats each SQL statement as transactional, automatically wrapping individual statements with implicit BEGIN/COMMIT if no explicit transaction block exists.

## Savepoints for Granular Control

Savepoints enable selective rollback of transaction portions while preserving earlier changes. After defining a savepoint with `SAVEPOINT`, you can revert to it using `ROLLBACK TO`. This mechanism allows correcting mistakes without abandoning the entire transaction.

The bank example demonstrates this: after crediting the wrong account, savepoints let you undo just that credit and apply it correctly instead.
