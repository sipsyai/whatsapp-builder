# Entity Management

## Basic Entity

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
    isActive: boolean
}
```

## Entity Registration

Register in DataSource:
```typescript
const myDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    entities: [User],
})
```

Or load from directory:
```typescript
entities: ["entity/*.js"]
```

Custom table name:
```typescript
@Entity("my_users")
export class User {
    // ...
}
```

## Primary Columns

### Manual assignment:
```typescript
@PrimaryColumn()
id: number
```

### Auto-increment:
```typescript
@PrimaryGeneratedColumn()
id: number
```

### UUID:
```typescript
@PrimaryGeneratedColumn("uuid")
id: string
```

### Composite primary keys:
```typescript
@Entity()
export class User {
    @PrimaryColumn()
    firstName: string

    @PrimaryColumn()
    lastName: string
}
```

## Special Columns

**Create date:**
```typescript
@CreateDateColumn()
createdAt: Date
```

**Update date:**
```typescript
@UpdateDateColumn()
updatedAt: Date
```

**Delete date (soft delete):**
```typescript
@DeleteDateColumn()
deletedAt: Date
```

**Version (optimistic locking):**
```typescript
@VersionColumn()
version: number
```

## Column Types

Basic syntax:
```typescript
@Column("int")
age: number

// Or
@Column({ type: "int" })
age: number
```

With options:
```typescript
@Column("varchar", { length: 200 })
name: string

@Column({ type: "varchar", length: 200 })
name: string
```

## Column Options

```typescript
@Column({
    type: "varchar",
    length: 150,
    unique: true,
    nullable: false,
    default: "guest",
    select: true,
    comment: "User's full name",
})
name: string
```

Common options:
- `type` - Column type
- `name` - Database column name
- `length` - Column length
- `nullable` - NULL or NOT NULL (default: false)
- `default` - Default value
- `unique` - Unique constraint
- `select` - Include in queries (default: true)
- `comment` - Column comment
- `precision` - Decimal precision
- `scale` - Decimal scale
- `unsigned` - Unsigned numeric (MySQL)

## Enum Columns

Using TypeScript enum:
```typescript
export enum UserRole {
    ADMIN = "admin",
    EDITOR = "editor",
    GUEST = "guest",
}

@Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.GUEST,
})
role: UserRole
```

Using array:
```typescript
@Column({
    type: "enum",
    enum: ["admin", "editor", "guest"],
    default: "guest"
})
role: string
```

## Simple Array

Stores array as comma-separated string:
```typescript
@Column("simple-array")
tags: string[]

// Stores as: "tag1,tag2,tag3"
```

Note: Values cannot contain commas.

## Simple JSON

Stores object as JSON string:
```typescript
@Column("simple-json")
profile: { name: string; nickname: string }

// Stores as: {"name":"John","nickname":"Malkovich"}
```

## Generated Values

```typescript
@Column()
@Generated("uuid")
uuid: string

@Column()
@Generated("increment")
sequence: number
```

## Spatial Columns

For geographic data (MySQL, PostgreSQL, SQL Server):

```typescript
@Column("point")
location: string

// Usage
entity.location = "POINT(1 1)"

@Column("linestring")
path: string

entity.path = "LINESTRING(0 0,1 1,2 2)"
```

## Vector Columns

For embeddings and ML applications (PostgreSQL, SQL Server, SAP HANA):

```typescript
@Column("vector", { length: 3 })
embedding: number[] | Buffer

// PostgreSQL similarity search
const results = await dataSource.query(
    `SELECT id FROM post ORDER BY embedding <-> $1 LIMIT 5`,
    ["[1,2,3]"]
)
```

## Entity Inheritance

Reduce duplication with base classes:

```typescript
export abstract class Content {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    description: string
}

@Entity()
export class Photo extends Content {
    @Column()
    size: string
}

@Entity()
export class Question extends Content {
    @Column()
    answersCount: number
}
```

All columns from parent entities are inherited.

## Tree Entities

### Adjacency list:
```typescript
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from "typeorm"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne(type => Category, category => category.children)
    parent: Category

    @OneToMany(type => Category, category => category.parent)
    children: Category[]
}
```

### Closure table:
```typescript
import { Entity, Tree, Column, PrimaryGeneratedColumn, TreeChildren, TreeParent } from "typeorm"

@Entity()
@Tree("closure-table")
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @TreeChildren()
    children: Category[]

    @TreeParent()
    parent: Category
}
```

## Finding Entities

By primary key:
```typescript
const person = await dataSource.manager.findOneBy(Person, { id: 1 })

// Or with repository
const person = await dataSource.getRepository(Person).findOneBy({ id: 1 })
```

Composite keys:
```typescript
const user = await dataSource.manager.findOneBy(User, {
    firstName: "Timber",
    lastName: "Saw",
})
```

## Entity Options

Constructor arguments must be optional:
```typescript
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    // Constructor with optional parameters
    constructor(name?: string) {
        if (name) {
            this.name = name
        }
    }
}
```

TypeORM creates entity instances when loading from database without calling the constructor.
