# Chapter 13. Concurrency Control

## Overview

This section addresses how PostgreSQL manages simultaneous access to data by multiple sessions. The primary objectives are to enable efficient concurrent access while preserving database integrity.

## Chapter Contents

The chapter is organized into the following sections:

- **13.1. Introduction** - Foundation concepts for understanding concurrency
- **13.2. Transaction Isolation** - Details on isolation levels including Read Committed, Repeatable Read, and Serializable modes
- **13.3. Explicit Locking** - Coverage of table-level, row-level, and page-level locking mechanisms, plus deadlock handling and advisory locks
- **13.4. Data Consistency Checks at the Application Level** - Strategies for enforcing consistency through serializable transactions and explicit blocking locks
- **13.5. Serialization Failure Handling** - Managing serialization errors
- **13.6. Caveats** - Important considerations and limitations
- **13.7. Locking and Indexes** - Interaction between locking mechanisms and index structures

## Key Purpose

As stated in the documentation: "This chapter describes the behavior of the PostgreSQL database system when two or more sessions try to access the same data at the same time." Every database application developer should understand these concurrency control principles to build robust systems.
