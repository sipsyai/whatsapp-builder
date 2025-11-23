# TypeORM Database Integration

## Setup

```typescript
// app.module.ts
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // Never true in production
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      logging: process.env.NODE_ENV === 'development',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }),
  ],
})
export class AppModule {}
```

## Entity Definition

```typescript
// user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, Index } from 'typeorm';

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Column({ type: 'enum', enum: ['user', 'admin'], default: 'user' })
  role: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Post, post => post.author)
  posts: Post[];

  @ManyToOne(() => Organization, org => org.users)
  organization: Organization;
}
```

## Relationships

### One-to-Many / Many-to-One

```typescript
@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @ManyToOne(() => User, user => user.posts, { onDelete: 'CASCADE' })
  author: User;

  @Column({ name: 'author_id' })
  authorId: number;
}

// Eager loading
@ManyToOne(() => User, user => user.posts, { eager: true })
author: User;
```

### Many-to-Many

```typescript
@Entity('users')
export class User {
  @ManyToMany(() => Role, role => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => User, user => user.roles)
  users: User[];
}
```

### One-to-One

```typescript
@Entity('users')
export class User {
  @OneToOne(() => Profile, profile => profile.user, { cascade: true })
  @JoinColumn()
  profile: Profile;
}

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  bio: string;

  @OneToOne(() => User, user => user.profile)
  user: User;
}
```

## Queries

### Basic Operations

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Find all
  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  // Find with conditions
  findActive(): Promise<User[]> {
    return this.usersRepository.find({
      where: { active: true },
      order: { createdAt: 'DESC' },
      take: 10,
      skip: 0,
    });
  }

  // Find one
  findOne(id: number): Promise<User> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['posts', 'organization'],
    });
  }

  // Find with relations
  findWithPosts(id: number): Promise<User> {
    return this.usersRepository.findOne({
      where: { id },
      relations: {
        posts: true,
        organization: {
          departments: true,
        },
      },
    });
  }

  // Create
  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  // Update
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    await this.usersRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  // Delete
  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }

  // Soft delete (requires @DeleteDateColumn)
  async softRemove(id: number): Promise<void> {
    await this.usersRepository.softDelete(id);
  }
}
```

### Advanced Queries

```typescript
// Query Builder
async findByEmailPattern(pattern: string): Promise<User[]> {
  return this.usersRepository
    .createQueryBuilder('user')
    .where('user.email LIKE :pattern', { pattern: `%${pattern}%` })
    .andWhere('user.active = :active', { active: true })
    .orderBy('user.createdAt', 'DESC')
    .take(20)
    .getMany();
}

// Complex joins
async findUsersWithPosts(): Promise<User[]> {
  return this.usersRepository
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.posts', 'post')
    .where('post.published = :published', { published: true })
    .getMany();
}

// Count and aggregation
async getUserStats(): Promise<any> {
  return this.usersRepository
    .createQueryBuilder('user')
    .select('user.role', 'role')
    .addSelect('COUNT(user.id)', 'count')
    .groupBy('user.role')
    .getRawMany();
}

// Raw SQL
async customQuery(): Promise<any> {
  return this.usersRepository.query(
    'SELECT * FROM users WHERE created_at > $1',
    [new Date('2024-01-01')],
  );
}
```

### Pagination

```typescript
async paginate(page: number, limit: number): Promise<PaginatedResult<User>> {
  const [items, total] = await this.usersRepository.findAndCount({
    take: limit,
    skip: (page - 1) * limit,
    order: { createdAt: 'DESC' },
  });

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
```

## Transactions

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
    private dataSource: DataSource,
  ) {}

  async createUserWithProfile(data: CreateUserWithProfileDto): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = queryRunner.manager.create(User, data.user);
      await queryRunner.manager.save(user);

      const profile = queryRunner.manager.create(Profile, {
        ...data.profile,
        userId: user.id,
      });
      await queryRunner.manager.save(profile);

      await queryRunner.commitTransaction();
      return user;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // Using transaction decorator
  @Transaction()
  async createWithTransaction(
    @TransactionManager() manager: EntityManager,
    data: CreateUserDto,
  ): Promise<User> {
    const user = manager.create(User, data);
    return manager.save(user);
  }
}
```

## Migrations

### Create Migration

```bash
npm run typeorm migration:create src/migrations/CreateUsersTable
```

### Migration File

```typescript
// 1234567890-CreateUsersTable.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsersTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
          },
          {
            name: 'first_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'last_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['user', 'admin'],
            default: "'user'",
          },
          {
            name: 'active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex('users', {
      columnNames: ['email'],
      isUnique: true,
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

### Run Migrations

```bash
npm run typeorm migration:run
npm run typeorm migration:revert
```

## Subscribers

```typescript
@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  listenTo() {
    return User;
  }

  beforeInsert(event: InsertEvent<User>) {
    console.log('Before User Insert:', event.entity);
  }

  afterInsert(event: InsertEvent<User>) {
    console.log('After User Insert:', event.entity);
  }

  beforeUpdate(event: UpdateEvent<User>) {
    console.log('Before User Update:', event.entity);
  }

  afterUpdate(event: UpdateEvent<User>) {
    console.log('After User Update:', event.entity);
  }
}
```

## Indexes

```typescript
@Entity('users')
@Index(['email', 'active']) // Composite index
@Index('IDX_USER_EMAIL', ['email']) // Named index
export class User {
  @Index()
  @Column()
  email: string;

  @Index({ unique: true })
  @Column()
  username: string;
}
```

## Soft Deletes

```typescript
@Entity('users')
export class User {
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}

// Usage
await this.usersRepository.softDelete(id);
await this.usersRepository.restore(id);

// Find including soft deleted
await this.usersRepository.find({ withDeleted: true });

// Find only soft deleted
await this.usersRepository
  .createQueryBuilder('user')
  .where('user.deletedAt IS NOT NULL')
  .withDeleted()
  .getMany();
```

## Best Practices

### Use Repositories in Modules

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User, Post])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

### Connection Pooling

```typescript
TypeOrmModule.forRoot({
  // ...
  extra: {
    max: 20, // Maximum number of connections
    min: 5,  // Minimum number of connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
})
```

### Database Seeding

```typescript
@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async seed() {
    const users = [
      { email: 'admin@example.com', role: 'admin' },
      { email: 'user@example.com', role: 'user' },
    ];

    for (const userData of users) {
      const exists = await this.usersRepository.findOne({
        where: { email: userData.email },
      });

      if (!exists) {
        const user = this.usersRepository.create(userData);
        await this.usersRepository.save(user);
      }
    }
  }
}
```

### Performance Tips

1. **Use select to limit columns**
```typescript
.find({ select: ['id', 'email'] })
```

2. **Index frequently queried columns**
```typescript
@Index()
@Column()
email: string;
```

3. **Use query builder for complex queries**
```typescript
.createQueryBuilder('user')
  .where('user.active = :active', { active: true })
  .getMany();
```

4. **Lazy load relations when possible**
```typescript
@ManyToOne(() => User, { lazy: true })
author: Promise<User>;
```

5. **Use pagination for large datasets**
```typescript
.findAndCount({ take: 20, skip: 0 })
```
