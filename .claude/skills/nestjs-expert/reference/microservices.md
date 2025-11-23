# Microservices

## TCP Transport

### Setup

```typescript
// main.ts (microservice)
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 3001,
    },
  });
  await app.listen();
}
bootstrap();
```

### Client Setup

```typescript
// app.module.ts
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3001,
        },
      },
    ]),
  ],
})
export class AppModule {}
```

### Message Patterns

```typescript
// users.controller.ts (microservice)
@Controller()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @MessagePattern({ cmd: 'get_user' })
  async getUser(@Payload() id: number) {
    return this.usersService.findOne(id);
  }

  @MessagePattern({ cmd: 'create_user' })
  async createUser(@Payload() data: CreateUserDto) {
    return this.usersService.create(data);
  }

  @EventPattern('user_created')
  async handleUserCreated(@Payload() data: any) {
    console.log('User created:', data);
  }
}

// Calling from API gateway
@Injectable()
export class UsersService {
  constructor(@Inject('USER_SERVICE') private client: ClientProxy) {}

  async getUser(id: number) {
    return this.client.send({ cmd: 'get_user' }, id).toPromise();
  }

  async createUser(data: CreateUserDto) {
    return this.client.send({ cmd: 'create_user' }, data).toPromise();
  }

  emitUserCreated(data: any) {
    this.client.emit('user_created', data);
  }
}
```

## Redis Transport

### Setup

```bash
npm install ioredis
```

```typescript
// Microservice
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.REDIS,
  options: {
    host: 'localhost',
    port: 6379,
  },
});

// Client
ClientsModule.register([
  {
    name: 'REDIS_SERVICE',
    transport: Transport.REDIS,
    options: {
      host: 'localhost',
      port: 6379,
    },
  },
]),
```

## RabbitMQ Transport

### Setup

```bash
npm install amqplib amqp-connection-manager
```

```typescript
// Microservice
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://localhost:5672'],
    queue: 'users_queue',
    queueOptions: {
      durable: false,
    },
  },
});

// Client
ClientsModule.register([
  {
    name: 'RMQ_SERVICE',
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'users_queue',
      queueOptions: {
        durable: false,
      },
    },
  },
]),
```

### Pub/Sub Pattern

```typescript
// Publisher
@Injectable()
export class EventsService {
  constructor(@Inject('RMQ_SERVICE') private client: ClientProxy) {}

  async publishEvent(pattern: string, data: any) {
    return this.client.emit(pattern, data);
  }
}

// Subscriber
@Controller()
export class EventsController {
  @EventPattern('order_created')
  async handleOrderCreated(@Payload() data: OrderCreatedEvent) {
    console.log('Order created:', data);
    // Process the event
  }

  @EventPattern('payment_processed')
  async handlePaymentProcessed(@Payload() data: PaymentEvent) {
    console.log('Payment processed:', data);
  }
}
```

## Kafka Transport

### Setup

```bash
npm install kafkajs
```

```typescript
// Microservice
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'users-service',
      brokers: ['localhost:9092'],
    },
    consumer: {
      groupId: 'users-consumer',
    },
  },
});

// Client
ClientsModule.register([
  {
    name: 'KAFKA_SERVICE',
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'api-gateway',
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'api-gateway-consumer',
      },
    },
  },
]),
```

### Usage

```typescript
@Controller()
export class UsersController {
  @MessagePattern('users.create')
  async createUser(@Payload() message: KafkaMessage) {
    const data = JSON.parse(message.value.toString());
    return this.usersService.create(data);
  }

  @EventPattern('users.updated')
  async handleUserUpdated(@Payload() message: KafkaMessage) {
    const data = JSON.parse(message.value.toString());
    console.log('User updated:', data);
  }
}
```

## gRPC Transport

### Setup

```bash
npm install @grpc/grpc-js @grpc/proto-loader
```

### Proto File

```proto
// users.proto
syntax = "proto3";

package users;

service UsersService {
  rpc FindOne (FindOneRequest) returns (User) {}
  rpc FindAll (FindAllRequest) returns (UsersResponse) {}
  rpc Create (CreateUserRequest) returns (User) {}
}

message FindOneRequest {
  int32 id = 1;
}

message FindAllRequest {
  int32 page = 1;
  int32 limit = 2;
}

message User {
  int32 id = 1;
  string email = 2;
  string firstName = 3;
  string lastName = 4;
}

message UsersResponse {
  repeated User users = 1;
  int32 total = 2;
}

message CreateUserRequest {
  string email = 1;
  string password = 2;
  string firstName = 3;
  string lastName = 4;
}
```

### Microservice

```typescript
// main.ts
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.GRPC,
  options: {
    package: 'users',
    protoPath: join(__dirname, '../proto/users.proto'),
    url: '0.0.0.0:5000',
  },
});

// users.controller.ts
@Controller()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @GrpcMethod('UsersService', 'FindOne')
  async findOne(data: FindOneRequest): Promise<User> {
    return this.usersService.findOne(data.id);
  }

  @GrpcMethod('UsersService', 'FindAll')
  async findAll(data: FindAllRequest): Promise<UsersResponse> {
    const users = await this.usersService.findAll(data);
    return {
      users,
      total: users.length,
    };
  }

  @GrpcMethod('UsersService', 'Create')
  async create(data: CreateUserRequest): Promise<User> {
    return this.usersService.create(data);
  }
}
```

### Client

```typescript
// app.module.ts
ClientsModule.register([
  {
    name: 'USERS_PACKAGE',
    transport: Transport.GRPC,
    options: {
      package: 'users',
      protoPath: join(__dirname, '../proto/users.proto'),
      url: 'localhost:5000',
    },
  },
]),

// users.service.ts
@Injectable()
export class UsersService implements OnModuleInit {
  private usersService: any;

  constructor(@Inject('USERS_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.usersService = this.client.getService<any>('UsersService');
  }

  findOne(id: number): Observable<User> {
    return this.usersService.findOne({ id });
  }

  findAll(page: number, limit: number): Observable<UsersResponse> {
    return this.usersService.findAll({ page, limit });
  }

  create(data: CreateUserDto): Observable<User> {
    return this.usersService.create(data);
  }
}
```

## Hybrid Applications

```typescript
// main.ts - API Gateway with microservice
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Connect to microservices
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { port: 3001 },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: { host: 'localhost', port: 6379 },
  });

  await app.startAllMicroservices();
  await app.listen(3000);
}
bootstrap();
```

## Exception Handling

```typescript
import { RpcException } from '@nestjs/microservices';

@Controller()
export class UsersController {
  @MessagePattern({ cmd: 'get_user' })
  async getUser(@Payload() id: number) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new RpcException(`User #${id} not found`);
    }
    return user;
  }
}

// Exception filter
@Catch(RpcException)
export class RpcExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
    return throwError(() => exception.getError());
  }
}

// Apply globally
app.useGlobalFilters(new RpcExceptionFilter());
```

## Request Context

```typescript
@Controller()
export class UsersController {
  @MessagePattern({ cmd: 'get_user' })
  async getUser(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    // Manual acknowledgment
    channel.ack(originalMsg);

    return this.usersService.findOne(data.id);
  }
}
```

## Interceptors

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const pattern = context.switchToRpc().getData();

    return next.handle().pipe(
      tap(() => {
        console.log(`Pattern: ${JSON.stringify(pattern)}, Time: ${Date.now() - now}ms`);
      }),
    );
  }
}

// Apply
@UseInterceptors(LoggingInterceptor)
@MessagePattern({ cmd: 'get_user' })
async getUser(@Payload() id: number) {}
```

## Saga Pattern

```typescript
@Injectable()
export class OrderSaga {
  constructor(
    @Inject('ORDERS_SERVICE') private ordersClient: ClientProxy,
    @Inject('PAYMENTS_SERVICE') private paymentsClient: ClientProxy,
    @Inject('INVENTORY_SERVICE') private inventoryClient: ClientProxy,
  ) {}

  async createOrder(orderData: CreateOrderDto) {
    let order: any;
    let payment: any;
    let inventory: any;

    try {
      // Step 1: Create order
      order = await this.ordersClient
        .send({ cmd: 'create_order' }, orderData)
        .toPromise();

      // Step 2: Reserve inventory
      inventory = await this.inventoryClient
        .send({ cmd: 'reserve_inventory' }, {
          orderId: order.id,
          items: orderData.items,
        })
        .toPromise();

      // Step 3: Process payment
      payment = await this.paymentsClient
        .send({ cmd: 'process_payment' }, {
          orderId: order.id,
          amount: order.total,
        })
        .toPromise();

      // Confirm order
      await this.ordersClient
        .send({ cmd: 'confirm_order' }, order.id)
        .toPromise();

      return order;
    } catch (error) {
      // Compensate
      if (payment) {
        await this.paymentsClient.send({ cmd: 'refund' }, payment.id).toPromise();
      }
      if (inventory) {
        await this.inventoryClient
          .send({ cmd: 'release_inventory' }, inventory.id)
          .toPromise();
      }
      if (order) {
        await this.ordersClient.send({ cmd: 'cancel_order' }, order.id).toPromise();
      }

      throw error;
    }
  }
}
```

## Circuit Breaker

```typescript
import * as CircuitBreaker from 'opossum';

@Injectable()
export class ResilientUsersService {
  private breaker: CircuitBreaker;

  constructor(@Inject('USER_SERVICE') private client: ClientProxy) {
    this.breaker = new CircuitBreaker(
      async (id: number) => {
        return this.client.send({ cmd: 'get_user' }, id).toPromise();
      },
      {
        timeout: 3000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
      },
    );

    this.breaker.fallback(() => ({
      id: -1,
      email: 'unavailable@example.com',
      firstName: 'Service',
      lastName: 'Unavailable',
    }));

    this.breaker.on('open', () => console.log('Circuit breaker opened'));
    this.breaker.on('halfOpen', () => console.log('Circuit breaker half-open'));
    this.breaker.on('close', () => console.log('Circuit breaker closed'));
  }

  async getUser(id: number) {
    return this.breaker.fire(id);
  }
}
```

## Best Practices

### Service Communication
- Use events for fire-and-forget operations
- Use request-response for synchronous operations
- Implement timeouts for all external calls
- Use circuit breakers for resilience

### Error Handling
- Always handle RpcExceptions
- Implement retry logic for transient failures
- Use dead letter queues for failed messages
- Log all errors with context

### Performance
- Use message batching when possible
- Implement caching at the gateway level
- Monitor queue depths and latencies
- Use load balancing for scalability

### Security
- Authenticate microservice communications
- Encrypt sensitive data in messages
- Validate all incoming messages
- Use API keys or JWT tokens between services
