# GraphQL

## Setup

### Installation

```bash
npm install @nestjs/graphql @nestjs/apollo @apollo/server graphql
```

### Code First Approach

```typescript
// app.module.ts
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      context: ({ req }) => ({ req }),
    }),
  ],
})
export class AppModule {}
```

### Schema First Approach

```typescript
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: ['./**/*.graphql'],
      definitions: {
        path: join(process.cwd(), 'src/graphql.ts'),
        outputAs: 'class',
      },
    }),
  ],
})
export class AppModule {}
```

## Object Types (Code First)

```typescript
// user.model.ts
import { ObjectType, Field, Int, ID } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  id: number;

  @Field()
  email: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field(() => String)
  role: string;

  @Field()
  active: boolean;

  @Field(() => [Post], { nullable: 'items' })
  posts: Post[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class Post {
  @Field(() => ID)
  id: number;

  @Field()
  title: string;

  @Field({ nullable: true })
  content?: string;

  @Field()
  published: boolean;

  @Field(() => User)
  author: User;

  @Field(() => Int)
  authorId: number;

  @Field()
  createdAt: Date;
}
```

## Input Types

```typescript
// create-user.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, MinLength } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(8)
  password: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;
}

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  active?: boolean;
}
```

## Resolvers

```typescript
// users.resolver.ts
import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private usersService: UsersService,
    private postsService: PostsService,
  ) {}

  @Query(() => [User], { name: 'users' })
  async findAll() {
    return this.usersService.findAll();
  }

  @Query(() => User, { name: 'user' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  @UseGuards(GqlAuthGuard)
  async createUser(@Args('input') input: CreateUserInput) {
    return this.usersService.create(input);
  }

  @Mutation(() => User)
  @UseGuards(GqlAuthGuard)
  async updateUser(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateUserInput,
  ) {
    return this.usersService.update(id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deleteUser(@Args('id', { type: () => Int }) id: number) {
    await this.usersService.remove(id);
    return true;
  }

  // Field resolver
  @ResolveField(() => [Post])
  async posts(@Parent() user: User) {
    return this.postsService.findByAuthor(user.id);
  }

  // Computed field
  @ResolveField(() => String)
  async fullName(@Parent() user: User) {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }
}
```

## Queries and Mutations

### Basic Queries

```graphql
# Get all users
query {
  users {
    id
    email
    firstName
    lastName
  }
}

# Get single user
query {
  user(id: 1) {
    id
    email
    posts {
      id
      title
    }
  }
}

# With variables
query GetUser($id: Int!) {
  user(id: $id) {
    id
    email
    fullName
  }
}
```

### Mutations

```graphql
# Create user
mutation {
  createUser(input: {
    email: "user@example.com"
    password: "password123"
    firstName: "John"
    lastName: "Doe"
  }) {
    id
    email
  }
}

# Update user
mutation {
  updateUser(id: 1, input: {
    firstName: "Jane"
  }) {
    id
    firstName
  }
}

# Delete user
mutation {
  deleteUser(id: 1)
}
```

## Authentication

### Guard

```typescript
// gql-auth.guard.ts
import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
```

### Current User Decorator

```typescript
// current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user;
  },
);

// Usage
@Mutation(() => Post)
@UseGuards(GqlAuthGuard)
async createPost(
  @Args('input') input: CreatePostInput,
  @CurrentUser() user: User,
) {
  return this.postsService.create({ ...input, authorId: user.id });
}
```

### Login Mutation

```typescript
@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field(() => User)
  user: User;
}

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    return this.authService.login({ email, password });
  }

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser() user: User) {
    return user;
  }
}
```

## Subscriptions

### Setup

```typescript
// app.module.ts
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: true,
  installSubscriptionHandlers: true,
  subscriptions: {
    'graphql-ws': true,
    'subscriptions-transport-ws': true,
  },
}),
```

### Implementation

```typescript
import { Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';

const pubSub = new PubSub();

@Resolver(() => Post)
export class PostsResolver {
  @Mutation(() => Post)
  async createPost(@Args('input') input: CreatePostInput) {
    const post = await this.postsService.create(input);
    pubSub.publish('postCreated', { postCreated: post });
    return post;
  }

  @Subscription(() => Post)
  postCreated() {
    return pubSub.asyncIterator('postCreated');
  }

  @Subscription(() => Post, {
    filter: (payload, variables) => {
      return payload.postUpdated.authorId === variables.authorId;
    },
  })
  postUpdated(@Args('authorId', { type: () => Int }) authorId: number) {
    return pubSub.asyncIterator('postUpdated');
  }
}
```

### Client Usage

```graphql
subscription {
  postCreated {
    id
    title
    author {
      email
    }
  }
}

subscription OnPostUpdated($authorId: Int!) {
  postUpdated(authorId: $authorId) {
    id
    title
    content
  }
}
```

## DataLoader (N+1 Prevention)

```typescript
import * as DataLoader from 'dataloader';

@Injectable()
export class UsersLoader {
  constructor(private usersService: UsersService) {}

  createLoader() {
    return new DataLoader<number, User>(async (ids: number[]) => {
      const users = await this.usersService.findByIds(ids);
      const usersMap = new Map(users.map(user => [user.id, user]));
      return ids.map(id => usersMap.get(id));
    });
  }
}

// In resolver
@ResolveField(() => User)
async author(@Parent() post: Post, @Context() context) {
  return context.loaders.users.load(post.authorId);
}

// Add to context
GraphQLModule.forRoot({
  context: ({ req }) => ({
    req,
    loaders: {
      users: usersLoader.createLoader(),
    },
  }),
}),
```

## Pagination

### Offset-based

```typescript
@InputType()
export class PaginationArgs {
  @Field(() => Int, { defaultValue: 0 })
  skip: number = 0;

  @Field(() => Int, { defaultValue: 10 })
  take: number = 10;
}

@ObjectType()
export class PaginatedUsers {
  @Field(() => [User])
  items: User[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  totalPages: number;
}

@Query(() => PaginatedUsers)
async users(@Args() pagination: PaginationArgs) {
  return this.usersService.paginate(pagination);
}
```

### Cursor-based (Relay)

```typescript
import { ConnectionArgs, ConnectionType, Edge } from '@nestjs/graphql';

@ObjectType()
export class UserEdge extends Edge(User) {
  @Field(() => String)
  cursor: string;

  @Field(() => User)
  node: User;
}

@ObjectType()
export class UserConnection extends ConnectionType(User, UserEdge) {
  @Field(() => [UserEdge])
  edges: UserEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;
}

@Query(() => UserConnection)
async users(@Args() args: ConnectionArgs) {
  return this.usersService.findConnection(args);
}
```

## Field Middleware

```typescript
import { FieldMiddleware, MiddlewareContext, NextFn } from '@nestjs/graphql';

export const loggerMiddleware: FieldMiddleware = async (
  ctx: MiddlewareContext,
  next: NextFn,
) => {
  const value = await next();
  console.log(`Field ${ctx.info.fieldName} resolved to:`, value);
  return value;
};

// Apply to field
@Field({ middleware: [loggerMiddleware] })
email: string;
```

## Complexity Analysis

```typescript
import { QueryComplexityPlugin } from './query-complexity.plugin';

@Module({
  imports: [
    GraphQLModule.forRoot({
      autoSchemaFile: true,
      plugins: [new QueryComplexityPlugin(20)],
    }),
  ],
})

// query-complexity.plugin.ts
import { Plugin } from '@nestjs/apollo';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import {
  ApolloServerPlugin,
  GraphQLRequestListener,
} from '@apollo/server';
import { GraphQLError } from 'graphql';
import {
  fieldExtensionsEstimator,
  getComplexity,
  simpleEstimator,
} from 'graphql-query-complexity';

@Plugin()
export class QueryComplexityPlugin implements ApolloServerPlugin {
  constructor(
    private gqlSchemaHost: GraphQLSchemaHost,
    private maxComplexity: number = 20,
  ) {}

  async requestDidStart(): Promise<GraphQLRequestListener<any>> {
    const { schema } = this.gqlSchemaHost;

    return {
      async didResolveOperation({ request, document }) {
        const complexity = getComplexity({
          schema,
          operationName: request.operationName,
          query: document,
          variables: request.variables,
          estimators: [
            fieldExtensionsEstimator(),
            simpleEstimator({ defaultComplexity: 1 }),
          ],
        });

        if (complexity > this.maxComplexity) {
          throw new GraphQLError(
            `Query too complex: ${complexity}. Maximum allowed: ${this.maxComplexity}`,
          );
        }
      },
    };
  }
}
```

## Directives

```typescript
// uppercase.directive.ts
import { SchemaDirectiveVisitor } from '@graphql-tools/utils';
import { defaultFieldResolver, GraphQLField } from 'graphql';

export class UpperCaseDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: GraphQLField<any, any>) {
    const { resolve = defaultFieldResolver } = field;

    field.resolve = async function (...args) {
      const result = await resolve.apply(this, args);
      if (typeof result === 'string') {
        return result.toUpperCase();
      }
      return result;
    };
  }
}

// Usage in schema
@Directive('@uppercase')
@Field()
name: string;
```

## Error Handling

```typescript
import { GraphQLError } from 'graphql';

@Mutation(() => User)
async createUser(@Args('input') input: CreateUserInput) {
  try {
    return await this.usersService.create(input);
  } catch (error) {
    throw new GraphQLError('Failed to create user', {
      extensions: {
        code: 'USER_CREATION_FAILED',
        originalError: error.message,
      },
    });
  }
}

// Global exception filter
@Catch()
export class GraphQLExceptionFilter implements ExceptionFilter {
  catch(exception: any) {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      return new GraphQLError(exception.message, {
        extensions: {
          code: status,
          response,
        },
      });
    }

    return exception;
  }
}
```

## Testing

```typescript
describe('UsersResolver', () => {
  let resolver: UsersResolver;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersResolver,
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<UsersResolver>(UsersResolver);
    service = module.get<UsersService>(UsersService);
  });

  describe('users', () => {
    it('should return an array of users', async () => {
      const users = [{ id: 1, email: 'test@example.com' }];
      jest.spyOn(service, 'findAll').mockResolvedValue(users as User[]);

      expect(await resolver.findAll()).toBe(users);
    });
  });
});
```

## Best Practices

### Schema Design
- Keep types focused and cohesive
- Use input types for mutations
- Implement pagination for lists
- Use nullable fields appropriately
- Version your API with field deprecation

### Performance
- Implement DataLoader for N+1 prevention
- Use field-level resolvers wisely
- Limit query depth and complexity
- Cache frequently accessed data
- Use query batching

### Security
- Implement authentication and authorization
- Validate all inputs
- Limit query complexity
- Rate limit requests
- Sanitize user inputs

### Error Handling
- Return meaningful error messages
- Use custom error codes
- Don't expose sensitive information
- Log errors for debugging
- Implement global error handling
