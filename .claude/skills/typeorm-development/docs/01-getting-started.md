# TypeORM - Getting Started

**Tagline:** Code with Confidence. Query with Power.

## Overview

TypeORM is a TypeScript-first ORM that provides elegant, type-safe API for interacting with your database. It supports both DataMapper and ActiveRecord patterns, giving you the flexibility to choose what works best for your project.

## Key Features

### ⚙️ Flexible Patterns
Supports both DataMapper and ActiveRecord patterns, giving you the flexibility to choose what works best for your project.

### 📝 TypeScript First
Built from the ground up with TypeScript support, providing complete type safety for your database models.

### 🗄️ Multi-Database Support
Works with MySQL, PostgreSQL, MariaDB, SQLite, MS SQL Server, Oracle, MongoDB, and more.

### 🔍 Powerful QueryBuilder
Elegant syntax for building complex queries with joins, pagination, and caching.

### 🚀 Migrations & Schema
First-class support for database migrations with automatic generation.

### 🌐 Cross-Platform
Works in Node.js, browsers, mobile, and desktop applications.

## Elegant, Type-Safe API

TypeORM provides a beautiful, simple API for interacting with your database that takes full advantage of TypeScript's type system. Choose between DataMapper and ActiveRecord patterns - both are fully supported.

### Entity Definition Example

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    age: number
}
```

## Supported Databases

TypeORM supports a wide range of database systems:

- **MySQL**
- **PostgreSQL**
- **MariaDB**
- **SQLite**
- **MS SQL Server**
- **Oracle**
- **MongoDB**
- **CockroachDB**
- **SAP HANA**
- **Google Spanner**

## Works Everywhere

TypeORM runs in NodeJS, Browser, Cordova, Ionic, React Native, NativeScript, Expo, and Electron platforms.

- 🖥️ NodeJS
- 🌐 Browser
- 📱 Mobile
- ⚛️ React Native
- 🖼️ Electron

## Ready to Get Started?

TypeORM makes database interaction a breeze. Join thousands of developers who are already building better applications with TypeORM.

- [Read the Docs](https://typeorm.io/docs/getting-started)
- [Star on GitHub](https://github.com/typeorm/typeorm)
