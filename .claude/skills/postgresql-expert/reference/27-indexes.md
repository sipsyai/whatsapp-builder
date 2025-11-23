# Chapter 11. Indexes

## Overview

Indexes serve as a fundamental tool for improving database performance. According to the documentation, "Indexes are a common way to enhance database performance. An index allows the database server to find and retrieve specific rows much faster than it could do without an index."

However, the resource notes an important caveat: while indexes improve query speed, they also introduce overhead to the overall database system, requiring thoughtful implementation strategy.

## Table of Contents

1. Introduction
2. Index Types
   - B-Tree
   - Hash
   - GiST
   - SP-GiST
   - GIN
   - BRIN
3. Multicolumn Indexes
4. Indexes and ORDER BY
5. Combining Multiple Indexes
6. Unique Indexes
7. Indexes on Expressions
8. Partial Indexes
9. Index-Only Scans and Covering Indexes
10. Operator Classes and Operator Families
11. Indexes and Collations
12. Examining Index Usage

This chapter provides comprehensive guidance on implementing and managing various index types within PostgreSQL 18.
