# Advanced Features

## Transactions

### Using QueryRunner

Full control over transaction:

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

### Callback Style

Simpler transaction approach:

```typescript
async createMany(users: User[]) {
  await this.dataSource.transaction(async manager => {
    await manager.save(users[0]);
    await manager.save(users[1]);
  });
}
```

Automatic rollback on error, commit on success.

### Best Practices

- Use QueryRunner for complex transactions requiring precise control
- Use callback style for simple transactions
- Always release QueryRunner in finally block
- Consider using QueryRunnerFactory for easier testing

## Subscribers

Listen to entity events:

```typescript
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { User } from './user.entity';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return User;
  }

  beforeInsert(event: InsertEvent<User>) {
    console.log(`BEFORE USER INSERTED:`, event.entity);
  }

  afterInsert(event: InsertEvent<User>) {
    console.log(`AFTER USER INSERTED:`, event.entity);
  }

  beforeUpdate(event: UpdateEvent<User>) {
    console.log(`BEFORE USER UPDATED:`, event.entity);
  }

  afterUpdate(event: UpdateEvent<User>) {
    console.log(`AFTER USER UPDATED:`, event.entity);
  }
}
```

Add to module providers:
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, UserSubscriber],
  controllers: [UsersController],
})
export class UsersModule {}
```

Note: Subscribers cannot be request-scoped.

## Migrations

Migrations provide version control for database schema.

### Generate Migration

```bash
npm run typeorm migration:generate -- -n UserMigration
```

### Run Migrations

```bash
npm run typeorm migration:run
```

### Revert Migration

```bash
npm run typeorm migration:revert
```

### Manual Migration

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class UserMigration1234567890 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE user (
                id INT PRIMARY KEY AUTO_INCREMENT,
                firstName VARCHAR(255),
                lastName VARCHAR(255)
            )
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE user`);
    }
}
```

Note: Migrations are maintained by TypeORM CLI, separate from Nest application. Dependency injection not available.

## Query Builder

Build complex queries:

```typescript
const users = await userRepository
  .createQueryBuilder("user")
  .where("user.age > :age", { age: 18 })
  .andWhere("user.isActive = :active", { active: true })
  .orderBy("user.firstName", "ASC")
  .skip(10)
  .take(20)
  .getMany();
```

### Joins

```typescript
const users = await userRepository
  .createQueryBuilder("user")
  .leftJoinAndSelect("user.photos", "photo")
  .where("photo.isPublished = :published", { published: true })
  .getMany();
```

### Subqueries

```typescript
const posts = await postRepository
  .createQueryBuilder("post")
  .where(qb => {
    const subQuery = qb
      .subQuery()
      .select("user.name")
      .from(User, "user")
      .where("user.registered = :registered")
      .getQuery();
    return "post.title IN " + subQuery;
  })
  .setParameter("registered", true)
  .getMany();
```

### Pagination

```typescript
const [users, total] = await userRepository
  .createQueryBuilder("user")
  .skip(20)
  .take(10)
  .getManyAndCount();
```

### Raw Queries

```typescript
const users = await userRepository.query(
  `SELECT * FROM users WHERE age > ?`,
  [18]
);
```

## Indices

Create database indices:

```typescript
@Entity()
@Index(["firstName", "lastName"])
@Index("IDX_NAME", ["firstName", "lastName"], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Index()
  @Column()
  firstName: string

  @Index()
  @Column()
  lastName: string
}
```

## Listeners

Entity-level lifecycle hooks:

```typescript
@Entity()
export class User {
  @BeforeInsert()
  hashPassword() {
    this.password = bcrypt.hashSync(this.password, 10);
  }

  @AfterLoad()
  computeFullName() {
    this.fullName = `${this.firstName} ${this.lastName}`;
  }

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }
}
```

Available hooks:
- `@BeforeInsert`, `@AfterInsert`
- `@BeforeUpdate`, `@AfterUpdate`
- `@BeforeRemove`, `@AfterRemove`
- `@AfterLoad`

## View Entities

Create database views:

```typescript
@ViewEntity({
  expression: (dataSource: DataSource) =>
    dataSource
      .createQueryBuilder()
      .select("user.id", "id")
      .addSelect("user.firstName", "firstName")
      .addSelect("user.lastName", "lastName")
      .from(User, "user")
      .where("user.isActive = :active", { active: true })
})
export class ActiveUser {
  @ViewColumn()
  id: number

  @ViewColumn()
  firstName: string

  @ViewColumn()
  lastName: string
}
```

## Custom Repository

Extend repository with custom methods:

```typescript
@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findByName(firstName: string, lastName: string) {
    return this.createQueryBuilder("user")
      .where("user.firstName = :firstName", { firstName })
      .andWhere("user.lastName = :lastName", { lastName })
      .getMany();
  }
}
```

## Database-Specific Features

### MySQL-specific:
```typescript
@Column({
  type: "varchar",
  length: 255,
  charset: "utf8mb4",
  collation: "utf8mb4_unicode_ci"
})
name: string
```

### PostgreSQL-specific:
```typescript
@Column("hstore")
metadata: object

@Column({ type: "varchar", array: true })
tags: string[]
```

### MongoDB-specific:
```typescript
@Entity()
export class User {
  @ObjectIdColumn()
  id: ObjectId

  @Column()
  firstName: string
}
```

## Connection Pooling

Configure connection pool:

```typescript
TypeOrmModule.forRoot({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'root',
  database: 'test',
  entities: [],
  extra: {
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
  }
})
```

## Caching

Enable query result caching:

```typescript
TypeOrmModule.forRoot({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'test',
  cache: {
    type: "redis",
    options: {
      host: "localhost",
      port: 6379
    }
  }
})
```

Use in queries:
```typescript
const users = await userRepository
  .createQueryBuilder("user")
  .where("user.isActive = :active", { active: true })
  .cache(true)
  .getMany();
```

## Logging

Enable query logging:

```typescript
TypeOrmModule.forRoot({
  type: 'mysql',
  logging: true, // or ["query", "error", "schema"]
  logger: "advanced-console" // or "simple-console", "file", "debug"
})
```

## Performance Tips

- Use `select` in find options to load only needed columns
- Leverage indices on frequently queried columns
- Use pagination for large result sets
- Prefer QueryBuilder over find options for complex queries
- Use eager loading sparingly
- Enable connection pooling
- Use caching for read-heavy operations
- Avoid N+1 queries with proper joins
- Use transactions for multi-step operations
- Profile queries in production
