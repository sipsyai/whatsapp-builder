# Caching

## Cache Manager Setup

```bash
npm install @nestjs/cache-manager cache-manager
```

```typescript
// app.module.ts
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 60, // seconds
      max: 100, // maximum number of items in cache
    }),
  ],
})
export class AppModule {}
```

## Basic Usage

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private usersRepository: UsersRepository,
  ) {}

  async findOne(id: number): Promise<User> {
    const cacheKey = `user:${id}`;

    // Try to get from cache
    const cached = await this.cacheManager.get<User>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const user = await this.usersRepository.findOne(id);

    // Store in cache
    await this.cacheManager.set(cacheKey, user, 300); // 5 minutes

    return user;
  }

  async update(id: number, data: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.update(id, data);

    // Invalidate cache
    await this.cacheManager.del(`user:${id}`);

    return user;
  }

  async clearUserCache(id: number): Promise<void> {
    await this.cacheManager.del(`user:${id}`);
  }

  async clearAllCache(): Promise<void> {
    await this.cacheManager.reset();
  }
}
```

## Cache Interceptor

```typescript
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

@Controller('users')
@UseInterceptors(CacheInterceptor)
export class UsersController {
  constructor(private usersService: UsersService) {}

  // Cache with default TTL
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // Custom cache key and TTL
  @Get(':id')
  @CacheKey('custom_user_key')
  @CacheTTL(30)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  // Exclude from caching
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}

// Apply globally
app.useGlobalInterceptors(new CacheInterceptor());
```

## Custom Cache Key

```typescript
import { CacheInterceptor, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const { httpAdapter } = this.httpAdapterHost;

    // Include query parameters in cache key
    const queryString = httpAdapter.getRequestUrl(request).split('?')[1] || '';
    const userId = request.user?.id || 'anonymous';

    return `${userId}:${httpAdapter.getRequestUrl(request)}?${queryString}`;
  }
}
```

## Redis Cache Store

```bash
npm install cache-manager-redis-store
npm install @types/cache-manager-redis-store --save-dev
```

```typescript
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT, 10),
          },
          password: process.env.REDIS_PASSWORD,
          ttl: 60,
        }),
      }),
    }),
  ],
})
export class AppModule {}
```

## Redis Store with IoRedis

```bash
npm install ioredis
npm install cache-manager-ioredis
```

```typescript
import { redisStore } from 'cache-manager-ioredis-yet';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const store = await redisStore({
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT, 10),
          password: process.env.REDIS_PASSWORD,
          db: 0,
          ttl: 60 * 1000, // milliseconds
        });

        return { store };
      },
    }),
  ],
})
export class AppModule {}
```

## Multiple Cache Stores

```typescript
import { CacheModule, CacheModuleOptions } from '@nestjs/cache-manager';

@Module({
  imports: [
    // Default cache (memory)
    CacheModule.register({
      isGlobal: true,
    }),
  ],
  providers: [
    // Redis cache for specific use case
    {
      provide: 'REDIS_CACHE',
      useFactory: async () => {
        const store = await redisStore({
          host: 'localhost',
          port: 6379,
        });
        return { store };
      },
    },
  ],
})
export class AppModule {}

// Usage
@Injectable()
export class UsersService {
  constructor(
    @Inject(CACHE_MANAGER) private memoryCache: Cache,
    @Inject('REDIS_CACHE') private redisCache: Cache,
  ) {}

  async findOne(id: number): Promise<User> {
    // Check memory cache first (faster)
    let user = await this.memoryCache.get<User>(`user:${id}`);
    if (user) return user;

    // Check Redis cache
    user = await this.redisCache.get<User>(`user:${id}`);
    if (user) {
      // Store in memory cache
      await this.memoryCache.set(`user:${id}`, user, 60);
      return user;
    }

    // Fetch from database
    user = await this.usersRepository.findOne(id);

    // Store in both caches
    await Promise.all([
      this.memoryCache.set(`user:${id}`, user, 60),
      this.redisCache.set(`user:${id}`, user, 300),
    ]);

    return user;
  }
}
```

## Cache-Aside Pattern

```typescript
@Injectable()
export class ProductsService {
  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private productsRepository: ProductsRepository,
  ) {}

  async findAll(filters?: any): Promise<Product[]> {
    const cacheKey = `products:${JSON.stringify(filters || {})}`;

    // Try cache
    const cached = await this.cache.get<Product[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Load from database
    const products = await this.productsRepository.findAll(filters);

    // Store in cache
    await this.cache.set(cacheKey, products, 600); // 10 minutes

    return products;
  }

  async update(id: number, data: UpdateProductDto): Promise<Product> {
    const product = await this.productsRepository.update(id, data);

    // Invalidate related caches
    await this.invalidateProductCaches(id);

    return product;
  }

  private async invalidateProductCaches(id: number): Promise<void> {
    const patterns = [
      `product:${id}`,
      'products:*', // Invalidate all product list caches
    ];

    await Promise.all(patterns.map((pattern) => this.cache.del(pattern)));
  }
}
```

## Cache Warming

```typescript
@Injectable()
export class CacheWarmerService {
  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private usersService: UsersService,
    private productsService: ProductsService,
  ) {}

  async warmCache(): Promise<void> {
    console.log('Starting cache warming...');

    // Warm user cache
    const users = await this.usersService.findAll();
    await Promise.all(
      users.map((user) => this.cache.set(`user:${user.id}`, user, 3600)),
    );

    // Warm product cache
    const products = await this.productsService.findAll();
    await this.cache.set('products:all', products, 3600);

    console.log('Cache warming complete');
  }

  @Cron('0 0 * * *') // Daily at midnight
  async scheduledCacheWarming() {
    await this.warmCache();
  }
}
```

## Cache Tags

```typescript
@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async setWithTags(key: string, value: any, tags: string[], ttl?: number) {
    // Store the value
    await this.cache.set(key, value, ttl);

    // Associate tags
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const keys = (await this.cache.get<string[]>(tagKey)) || [];
      keys.push(key);
      await this.cache.set(tagKey, keys);
    }
  }

  async invalidateByTag(tag: string) {
    const tagKey = `tag:${tag}`;
    const keys = (await this.cache.get<string[]>(tagKey)) || [];

    // Delete all keys with this tag
    await Promise.all(keys.map((key) => this.cache.del(key)));

    // Delete the tag itself
    await this.cache.del(tagKey);
  }
}

// Usage
await cacheService.setWithTags('user:1', user, ['users', 'user:1'], 300);
await cacheService.invalidateByTag('users'); // Invalidates all users
```

## Conditional Caching

```typescript
@Injectable()
export class SmartCacheInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const key = this.getCacheKey(context);

    // Don't cache POST, PUT, DELETE requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Don't cache authenticated requests
    if (request.headers.authorization) {
      return next.handle();
    }

    // Try cache
    const cached = await this.cache.get(key);
    if (cached) {
      return of(cached);
    }

    // Execute and cache
    return next.handle().pipe(
      tap(async (data) => {
        await this.cache.set(key, data, this.getTTL(context));
      }),
    );
  }

  private getCacheKey(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest();
    return `${request.method}:${request.url}`;
  }

  private getTTL(context: ExecutionContext): number {
    // Different TTL for different endpoints
    const handler = context.getHandler();
    const ttlMetadata = Reflect.getMetadata('cache_ttl', handler);
    return ttlMetadata || 60;
  }
}
```

## Cache Metrics

```typescript
@Injectable()
export class CacheMetricsService {
  private hits = 0;
  private misses = 0;

  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.cache.get<T>(key);

    if (value !== undefined) {
      this.hits++;
    } else {
      this.misses++;
    }

    return value;
  }

  getHitRate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : this.hits / total;
  }

  getMetrics() {
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: this.getHitRate(),
    };
  }

  resetMetrics() {
    this.hits = 0;
    this.misses = 0;
  }
}

@Controller('cache')
export class CacheController {
  constructor(private metricsService: CacheMetricsService) {}

  @Get('metrics')
  getMetrics() {
    return this.metricsService.getMetrics();
  }
}
```

## Distributed Caching with Redis Pub/Sub

```typescript
@Injectable()
export class DistributedCacheService {
  private redisClient: Redis;
  private subscriber: Redis;

  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {
    this.redisClient = new Redis(process.env.REDIS_URL);
    this.subscriber = new Redis(process.env.REDIS_URL);

    this.subscriber.subscribe('cache:invalidate');
    this.subscriber.on('message', (channel, message) => {
      if (channel === 'cache:invalidate') {
        this.cache.del(message);
      }
    });
  }

  async set(key: string, value: any, ttl?: number) {
    await this.cache.set(key, value, ttl);
  }

  async invalidate(key: string) {
    // Delete from local cache
    await this.cache.del(key);

    // Notify other instances
    await this.redisClient.publish('cache:invalidate', key);
  }
}
```

## Best Practices

### Cache Key Design
- Use consistent naming conventions
- Include version in keys when needed
- Use hierarchical keys: `entity:id:field`
- Keep keys short but descriptive

### TTL Strategy
- Set appropriate TTL based on data volatility
- Use longer TTL for static data
- Use shorter TTL for frequently changing data
- Consider cache warming for critical data

### Invalidation
- Invalidate on write operations
- Use cache tags for related data
- Implement cache versioning
- Monitor cache hit rates

### Performance
- Use in-memory cache for hot data
- Use Redis for shared cache across instances
- Implement cache warming for predictable access patterns
- Monitor cache size and eviction rates

### Error Handling
- Always have fallback to database
- Log cache errors separately
- Don't let cache failures break application
- Implement circuit breakers for cache operations
