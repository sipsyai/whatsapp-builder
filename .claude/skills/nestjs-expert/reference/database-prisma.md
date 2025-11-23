# Prisma Database Integration

## Setup

### Installation

```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

### Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  firstName String?  @map("first_name")
  lastName  String?  @map("last_name")
  role      Role     @default(USER)
  active    Boolean  @default(true)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  posts         Post[]
  profile       Profile?
  organizations UserOrganization[]

  @@index([email])
  @@map("users")
}

model Post {
  id          Int      @id @default(autoincrement())
  title       String
  content     String?
  published   Boolean  @default(false)
  authorId    Int      @map("author_id")
  author      User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  categories PostCategory[]

  @@index([authorId])
  @@map("posts")
}

model Profile {
  id     Int     @id @default(autoincrement())
  bio    String?
  userId Int     @unique @map("user_id")
  user   User    @relation(fields: [userId], references: [id])

  @@map("profiles")
}

model Organization {
  id    Int    @id @default(autoincrement())
  name  String
  users UserOrganization[]

  @@map("organizations")
}

model UserOrganization {
  userId         Int          @map("user_id")
  organizationId Int          @map("organization_id")
  role           String
  user           User         @relation(fields: [userId], references: [id])
  organization   Organization @relation(fields: [organizationId], references: [id])

  @@id([userId, organizationId])
  @@map("user_organizations")
}

model Category {
  id    Int            @id @default(autoincrement())
  name  String
  posts PostCategory[]

  @@map("categories")
}

model PostCategory {
  postId     Int      @map("post_id")
  categoryId Int      @map("category_id")
  post       Post     @relation(fields: [postId], references: [id])
  category   Category @relation(fields: [categoryId], references: [id])

  @@id([postId, categoryId])
  @@map("post_categories")
}

enum Role {
  USER
  ADMIN
}
```

## NestJS Integration

### Module Setup

```typescript
// prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### Prisma Service

```typescript
// prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;

    const models = Reflect.ownKeys(this).filter(
      (key) => typeof key === 'string' && !key.startsWith('_'),
    );

    return Promise.all(models.map((modelKey) => this[modelKey].deleteMany()));
  }
}
```

### Using in Service

```typescript
// users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { skip?: number; take?: number }) {
    return this.prisma.user.findMany({
      skip: params?.skip,
      take: params?.take,
      where: { active: true },
      include: {
        profile: true,
        posts: {
          where: { published: true },
          take: 5,
        },
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        posts: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    return user;
  }

  async create(data: CreateUserDto) {
    return this.prisma.user.create({
      data,
      include: { profile: true },
    });
  }

  async update(id: number, data: UpdateUserDto) {
    await this.findOne(id); // Ensure exists

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Ensure exists

    return this.prisma.user.delete({
      where: { id },
    });
  }
}
```

## Queries

### Basic CRUD

```typescript
// Create
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    password: 'hashed',
    profile: {
      create: {
        bio: 'Software developer',
      },
    },
  },
});

// Read
const users = await prisma.user.findMany({
  where: { active: true },
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: 0,
});

// Update
const updated = await prisma.user.update({
  where: { id: 1 },
  data: { firstName: 'John' },
});

// Delete
await prisma.user.delete({
  where: { id: 1 },
});

// Upsert
const upserted = await prisma.user.upsert({
  where: { email: 'user@example.com' },
  update: { firstName: 'John' },
  create: {
    email: 'user@example.com',
    password: 'hashed',
  },
});
```

### Filtering

```typescript
// Simple filter
const users = await prisma.user.findMany({
  where: {
    email: 'user@example.com',
  },
});

// Multiple conditions (AND)
const users = await prisma.user.findMany({
  where: {
    active: true,
    role: 'ADMIN',
  },
});

// OR conditions
const users = await prisma.user.findMany({
  where: {
    OR: [
      { email: { contains: '@example.com' } },
      { role: 'ADMIN' },
    ],
  },
});

// NOT conditions
const users = await prisma.user.findMany({
  where: {
    NOT: {
      role: 'USER',
    },
  },
});

// Nested conditions
const users = await prisma.user.findMany({
  where: {
    posts: {
      some: {
        published: true,
      },
    },
  },
});

// In array
const users = await prisma.user.findMany({
  where: {
    role: { in: ['ADMIN', 'MODERATOR'] },
  },
});

// String operations
const users = await prisma.user.findMany({
  where: {
    email: {
      contains: 'example',
      startsWith: 'admin',
      endsWith: '.com',
    },
  },
});

// Number comparisons
const posts = await prisma.post.findMany({
  where: {
    authorId: { gt: 10, lte: 100 },
  },
});

// Date filters
const users = await prisma.user.findMany({
  where: {
    createdAt: {
      gte: new Date('2024-01-01'),
      lt: new Date('2024-12-31'),
    },
  },
});
```

### Relations

```typescript
// Include relations
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: true,
    profile: true,
  },
});

// Nested includes
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: {
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    },
  },
});

// Select specific fields
const user = await prisma.user.findUnique({
  where: { id: 1 },
  select: {
    id: true,
    email: true,
    posts: {
      select: {
        title: true,
        createdAt: true,
      },
    },
  },
});

// Filter related records
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: {
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    },
  },
});
```

### Aggregation

```typescript
// Count
const count = await prisma.user.count({
  where: { active: true },
});

// Aggregate
const stats = await prisma.user.aggregate({
  _count: { id: true },
  _avg: { id: true },
  _sum: { id: true },
  _min: { id: true },
  _max: { id: true },
});

// Group by
const usersByRole = await prisma.user.groupBy({
  by: ['role'],
  _count: { id: true },
  having: {
    id: {
      _count: { gt: 5 },
    },
  },
});
```

### Pagination

```typescript
async paginate(page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    this.prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.user.count(),
  ]);

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
// Sequential operations
async createUserWithPosts(data: CreateUserWithPostsDto) {
  return this.prisma.$transaction(async (prisma) => {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
      },
    });

    const posts = await Promise.all(
      data.posts.map((post) =>
        prisma.post.create({
          data: {
            ...post,
            authorId: user.id,
          },
        }),
      ),
    );

    return { user, posts };
  });
}

// Batch operations
async batchUpdate(ids: number[], data: Partial<User>) {
  return this.prisma.$transaction([
    this.prisma.user.updateMany({
      where: { id: { in: ids } },
      data,
    }),
    this.prisma.auditLog.create({
      data: {
        action: 'BATCH_UPDATE',
        count: ids.length,
      },
    }),
  ]);
}

// Interactive transactions
async transfer(fromId: number, toId: number, amount: number) {
  return this.prisma.$transaction(
    async (prisma) => {
      const from = await prisma.account.update({
        where: { id: fromId },
        data: { balance: { decrement: amount } },
      });

      if (from.balance < 0) {
        throw new Error('Insufficient funds');
      }

      const to = await prisma.account.update({
        where: { id: toId },
        data: { balance: { increment: amount } },
      });

      return { from, to };
    },
    {
      maxWait: 5000,
      timeout: 10000,
      isolationLevel: 'Serializable',
    },
  );
}
```

## Migrations

```bash
# Create migration
npx prisma migrate dev --name create_users_table

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# View migration status
npx prisma migrate status
```

## Seeding

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = [
    {
      email: 'admin@example.com',
      password: 'hashed_password',
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User',
    },
    {
      email: 'user@example.com',
      password: 'hashed_password',
      role: 'USER',
      firstName: 'Regular',
      lastName: 'User',
    },
  ];

  for (const userData of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
  }

  console.log('Database seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to package.json:
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Run: `npx prisma db seed`

## Raw Queries

```typescript
// Raw query
const users = await prisma.$queryRaw`
  SELECT * FROM users WHERE email LIKE ${`%${search}%`}
`;

// Raw execute
const result = await prisma.$executeRaw`
  UPDATE users SET active = false WHERE last_login < NOW() - INTERVAL '90 days'
`;

// Typed raw query
const users = await prisma.$queryRaw<User[]>`
  SELECT * FROM users WHERE role = ${role}
`;
```

## Middleware

```typescript
// prisma.service.ts
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();

    // Soft delete middleware
    this.$use(async (params, next) => {
      if (params.model === 'User') {
        if (params.action === 'delete') {
          params.action = 'update';
          params.args['data'] = { deletedAt: new Date() };
        }

        if (params.action === 'findUnique' || params.action === 'findFirst') {
          params.action = 'findFirst';
          params.args.where['deletedAt'] = null;
        }

        if (params.action === 'findMany') {
          if (params.args.where) {
            if (!params.args.where.deletedAt) {
              params.args.where['deletedAt'] = null;
            }
          } else {
            params.args['where'] = { deletedAt: null };
          }
        }
      }

      return next(params);
    });

    // Logging middleware
    this.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();

      console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);

      return result;
    });
  }
}
```

## Best Practices

### Connection Management

```typescript
// Use global instance
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      log: ['query', 'error', 'warn'],
      errorFormat: 'pretty',
    });
  }
}
```

### Error Handling

```typescript
import { Prisma } from '@prisma/client';

try {
  await this.prisma.user.create({ data });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (error.code === 'P2002') {
      throw new ConflictException('Email already exists');
    }
    // Foreign key constraint violation
    if (error.code === 'P2003') {
      throw new BadRequestException('Invalid reference');
    }
    // Record not found
    if (error.code === 'P2025') {
      throw new NotFoundException('Record not found');
    }
  }
  throw error;
}
```

### Type Safety

```typescript
import { User, Prisma } from '@prisma/client';

// Use generated types
type UserWithPosts = Prisma.UserGetPayload<{
  include: { posts: true };
}>;

// Use type helpers
type UserCreateInput = Prisma.UserCreateInput;
type UserWhereInput = Prisma.UserWhereInput;
```

### Performance

1. **Select only needed fields**
```typescript
const users = await prisma.user.findMany({
  select: { id: true, email: true },
});
```

2. **Use pagination**
```typescript
const users = await prisma.user.findMany({
  take: 20,
  skip: 0,
});
```

3. **Batch queries**
```typescript
const [users, posts] = await Promise.all([
  prisma.user.findMany(),
  prisma.post.findMany(),
]);
```

4. **Use indexes** (defined in schema)
```prisma
@@index([email])
@@index([authorId, createdAt])
```
