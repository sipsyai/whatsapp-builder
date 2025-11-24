# Best Practices

Production-ready patterns and best practices for Socket.IO applications.

## Performance

### 1. Use Rooms Instead of Broadcasting

```typescript
// Bad: Broadcast to everyone
this.server.emit('update', data);

// Good: Send to specific room
this.server.to('interested-users').emit('update', data);
```

### 2. Implement Event Throttling

```typescript
// Client-side throttling
const emitThrottled = throttle((data) => {
  socket.emit('cursor-move', data);
}, 100);
```

### 3. Use Volatile Events for High-Frequency Updates

```typescript
// Drop messages if client is not ready
this.server.volatile.emit('tick', timestamp);
```

### 4. Clean Up Event Listeners

```typescript
useEffect(() => {
  if (!socket) return;

  socket.on('event', handler);

  // Always clean up
  return () => {
    socket.off('event', handler);
  };
}, [socket]);
```

## Security

### 1. Always Authenticate Connections

```typescript
async handleConnection(client: Socket) {
  try {
    await this.authenticate(client);
  } catch {
    client.disconnect();
  }
}
```

### 2. Validate All Input

```typescript
@SubscribeMessage('action')
@UsePipes(new ValidationPipe())
handleAction(@MessageBody() dto: ActionDto) {
  // DTO is validated
}
```

### 3. Configure CORS Properly

```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS.split(','),
    credentials: true,
  },
})
```

### 4. Implement Rate Limiting

```typescript
private requestCounts = new Map<string, number>();

@SubscribeMessage('action')
handleAction(@ConnectedSocket() client: Socket) {
  const count = this.requestCounts.get(client.id) || 0;

  if (count > 100) {
    throw new WsException('Rate limit exceeded');
  }

  this.requestCounts.set(client.id, count + 1);
}
```

## Architecture

### 1. Keep Gateways Thin

```typescript
// Bad: Business logic in gateway
@SubscribeMessage('create')
async handleCreate(@MessageBody() data: any) {
  const validated = await this.validate(data);
  const saved = await this.repository.save(validated);
  const enriched = await this.enrich(saved);
  return enriched;
}

// Good: Delegate to service
@SubscribeMessage('create')
async handleCreate(@MessageBody() data: CreateDto) {
  return this.service.create(data);
}
```

### 2. Use Dependency Injection

```typescript
@WebSocketGateway()
export class EventsGateway {
  constructor(
    private messagesService: MessagesService,
    private notificationsService: NotificationsService,
  ) {}
}
```

### 3. Separate Concerns with Namespaces

```typescript
// Separate gateways for different features
@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway { }

@WebSocketGateway({ namespace: '/notifications' })
export class NotificationsGateway { }

@WebSocketGateway({ namespace: '/admin' })
export class AdminGateway { }
```

## Error Handling

### 1. Handle Connection Errors

```typescript
handleConnection(client: Socket) {
  try {
    // Authentication and setup
  } catch (error) {
    this.logger.error(`Connection error: ${error.message}`);
    client.emit('error', { message: 'Connection failed' });
    client.disconnect();
  }
}
```

### 2. Use Try-Catch in Handlers

```typescript
@SubscribeMessage('action')
async handleAction(@MessageBody() data: any) {
  try {
    return await this.processAction(data);
  } catch (error) {
    this.logger.error(`Action failed: ${error.message}`);
    throw new WsException('Action processing failed');
  }
}
```

### 3. Emit Error Events to Client

```typescript
try {
  await this.dangerousOperation();
} catch (error) {
  client.emit('error', {
    code: error.code,
    message: error.message,
  });
}
```

## Testing

### 1. Test Gateways in Isolation

```typescript
describe('EventsGateway', () => {
  let gateway: EventsGateway;
  let mockService: jest.Mocked<EventsService>;

  beforeEach(async () => {
    mockService = {
      process: jest.fn(),
    } as any;

    const module = await Test.createTestingModule({
      providers: [
        EventsGateway,
        { provide: EventsService, useValue: mockService },
      ],
    }).compile();

    gateway = module.get(EventsGateway);
  });
});
```

### 2. Mock Socket Clients

```typescript
const mockClient = {
  id: 'test-id',
  data: { userId: 'user-1' },
  join: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
} as any;
```

## Monitoring

### 1. Log Important Events

```typescript
@WebSocketGateway()
export class MonitoredGateway {
  private logger = new Logger('MonitoredGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
```

### 2. Track Active Connections

```typescript
private activeConnections = new Map<string, Socket>();

handleConnection(client: Socket) {
  this.activeConnections.set(client.id, client);
  this.logger.log(`Total connections: ${this.activeConnections.size}`);
}

handleDisconnect(client: Socket) {
  this.activeConnections.delete(client.id);
}
```

### 3. Monitor Performance

```typescript
@SubscribeMessage('action')
async handleAction(@MessageBody() data: any) {
  const start = Date.now();

  try {
    const result = await this.processAction(data);
    const duration = Date.now() - start;

    if (duration > 1000) {
      this.logger.warn(`Slow action: ${duration}ms`);
    }

    return result;
  } catch (error) {
    this.logger.error(`Action failed after ${Date.now() - start}ms`);
    throw error;
  }
}
```

## Scalability

### 1. Use Redis Adapter for Multiple Servers

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

afterInit(server: Server) {
  const pubClient = createClient({ url: 'redis://localhost:6379' });
  const subClient = pubClient.duplicate();

  server.adapter(createAdapter(pubClient, subClient));
}
```

### 2. Implement Connection Pooling

```typescript
private maxConnectionsPerUser = 3;

handleConnection(client: Socket) {
  const userId = client.data.userId;
  const userSockets = this.getUserSockets(userId);

  if (userSockets.length >= this.maxConnectionsPerUser) {
    client.emit('error', { message: 'Connection limit reached' });
    client.disconnect();
  }
}
```

## Documentation

### 1. Document Events

```typescript
/**
 * Handles new message creation
 * @event send-message
 * @payload {room: string, message: string}
 * @returns {success: boolean, messageId: string}
 * @emits new-message - Broadcast to room members
 */
@SubscribeMessage('send-message')
handleMessage(@MessageBody() data: SendMessageDto) {
  // Implementation
}
```

### 2. Maintain Event Catalog

```markdown
## Events

### Client to Server
- `send-message` - Send a message to a room
- `join-room` - Join a chat room
- `leave-room` - Leave a chat room

### Server to Client
- `new-message` - New message in subscribed room
- `user-joined` - User joined room
- `user-left` - User left room
```

## Summary

- **Performance**: Use rooms, throttle events, clean up listeners
- **Security**: Authenticate, validate, configure CORS, rate limit
- **Architecture**: Thin gateways, DI, separate namespaces
- **Error Handling**: Try-catch, emit errors, log failures
- **Testing**: Isolate, mock, test handlers
- **Monitoring**: Log events, track connections, measure performance
- **Scalability**: Redis adapter, connection limits
- **Documentation**: Document events, maintain catalog
