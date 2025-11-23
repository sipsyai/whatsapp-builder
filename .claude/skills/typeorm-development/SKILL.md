---
name: typeorm-development
description: Develops TypeScript applications using TypeORM ORM for database integration, entity management, relations, and queries with NestJS or standalone. Use when working with TypeORM, database entities, migrations, or when the user mentions TypeORM, ORM, database integration, or entity relationships.
---

# TypeORM Development

## Quick start

TypeORM is a TypeScript-first ORM supporting both DataMapper and ActiveRecord patterns. It works with MySQL, PostgreSQL, SQLite, MongoDB, and more.

**Basic entity example:**

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

    @Column({ default: true })
    isActive: boolean
}
```

## Core instructions

### NestJS Integration

Install dependencies:
```bash
npm install --save @nestjs/typeorm typeorm mysql2
```

Configure in AppModule:
```typescript
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [User],
      synchronize: true, // Never use in production
    }),
  ],
})
export class AppModule {}
```

### Repository Pattern

Register entities in module:
```typescript
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
```

Inject repository in service:
```typescript
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
```

### Entity Definition

**Primary columns:**
- `@PrimaryColumn()` - manual assignment
- `@PrimaryGeneratedColumn()` - auto-increment
- `@PrimaryGeneratedColumn("uuid")` - UUID generation

**Special columns:**
- `@CreateDateColumn()` - auto-set on insert
- `@UpdateDateColumn()` - auto-set on update
- `@DeleteDateColumn()` - soft delete timestamp
- `@VersionColumn()` - optimistic locking

**Column types:**
```typescript
@Column("varchar", { length: 200 })
name: string;

@Column({ type: "int", default: 0 })
age: number;

@Column({ nullable: true })
bio: string;

@Column("simple-array")
tags: string[];

@Column("simple-json")
metadata: { key: string; value: any };
```

### Relations

**One-to-Many:**
```typescript
@Entity()
export class User {
  @OneToMany(() => Photo, photo => photo.user)
  photos: Photo[];
}

@Entity()
export class Photo {
  @ManyToOne(() => User, user => user.photos)
  user: User;
}
```

**Many-to-Many:**
```typescript
@Entity()
export class Question {
  @ManyToMany(() => Category, category => category.questions, {
    cascade: true,
  })
  @JoinTable()
  categories: Category[];
}

@Entity()
export class Category {
  @ManyToMany(() => Question, question => question.categories)
  questions: Question[];
}
```

**Cascade options:**
- `cascade: true` - full cascades
- `cascade: ["insert"]` - only insert
- `cascade: ["update"]` - only update
- `cascade: ["insert", "update"]` - insert and update

### Transactions

Using QueryRunner:
```typescript
async createMany(users: User[]) {
  const queryRunner = this.dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    await queryRunner.manager.save(users[0]);
    await queryRunner.manager.save(users[1]);
    await queryRunner.commitTransaction();
  } catch (err) {
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
  }
}
```

Callback style:
```typescript
async createMany(users: User[]) {
  await this.dataSource.transaction(async manager => {
    await manager.save(users[0]);
    await manager.save(users[1]);
  });
}
```

### Query Building

```typescript
const users = await this.usersRepository
  .createQueryBuilder("user")
  .where("user.age > :age", { age: 18 })
  .andWhere("user.isActive = :active", { active: true })
  .orderBy("user.firstName", "ASC")
  .take(10)
  .getMany();
```

### Multiple Databases

```typescript
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'user_db_host',
      entities: [User],
    }),
    TypeOrmModule.forRoot({
      name: 'albumsConnection',
      type: 'postgres',
      host: 'album_db_host',
      entities: [Album],
    }),
  ],
})
export class AppModule {}
```

Inject specific connection:
```typescript
@Injectable()
export class AlbumsService {
  constructor(
    @InjectDataSource('albumsConnection')
    private dataSource: DataSource,
  ) {}
}
```

### Auto-load Entities

```typescript
TypeOrmModule.forRoot({
  ...
  autoLoadEntities: true,
})
```

Entities registered through `forFeature()` are automatically added to the entities array.

## Testing

Mock repositories for unit tests:
```typescript
import { getRepositoryToken } from '@nestjs/typeorm';

@Module({
  providers: [
    UsersService,
    {
      provide: getRepositoryToken(User),
      useValue: mockRepository,
    },
  ],
})
export class UsersModule {}
```

## Common patterns

**Enum columns:**
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
role: UserRole;
```

**Entity inheritance:**
```typescript
export abstract class Content {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;
}

@Entity()
export class Photo extends Content {
  @Column()
  size: string;
}
```

**Composite primary keys:**
```typescript
@Entity()
export class User {
  @PrimaryColumn()
  firstName: string;

  @PrimaryColumn()
  lastName: string;
}
```

## Best practices

- Never use `synchronize: true` in production
- Use transactions for multi-step operations
- Leverage cascade options carefully to avoid unintended saves
- Use `autoLoadEntities` to avoid manual entity registration
- Mock repositories in unit tests with `getRepositoryToken()`
- Use QueryRunner for complex transactions requiring full control
- Specify connection name for multiple database setups
- Use migrations for production schema changes

## Reference documentation

For detailed information, see:
- [NestJS Integration](reference/nestjs-integration.md) - Complete NestJS setup guide
- [Entity Management](reference/entities.md) - Entity decorators, columns, and options
- [Relations](reference/relations.md) - Relationship types and configuration
- [Advanced Features](reference/advanced.md) - Transactions, subscribers, migrations

## Common issues

**Issue:** `synchronize: true` deletes production data
**Solution:** Use migrations for production environments

**Issue:** Circular dependency between entities
**Solution:** Use arrow functions in relation decorators: `() => Photo`

**Issue:** Repository not found
**Solution:** Ensure entity is registered in `forFeature([Entity])`

**Issue:** Multiple connections override each other
**Solution:** Always name non-default connections: `name: 'connectionName'`
