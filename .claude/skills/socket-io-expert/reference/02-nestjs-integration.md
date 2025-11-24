# NestJS Integration

Complete guide for integrating Socket.IO with NestJS using the @nestjs/websockets module.

## Installation

```bash
npm install @nestjs/websockets @nestjs/platform-socket.io
npm install socket.io
npm install @types/socket.io --save-dev
```

## Basic Gateway

### Creating a Gateway

```typescript
// events.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('EventsGateway');

  // Called once when gateway is initialized
  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  // Called when client connects
  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  // Called when client disconnects
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Handle incoming events
  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ): string {
    this.logger.log(`Message from ${client.id}: ${data}`);
    return `Echo: ${data}`;
  }
}
```

### Module Configuration

```typescript
// events.module.ts
import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@Module({
  providers: [EventsGateway],
  exports: [EventsGateway], // Export if other modules need to emit events
})
export class EventsModule {}
```

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { EventsModule } from './events/events.module';

@Module({
  imports: [EventsModule],
})
export class AppModule {}
```

## Gateway Configuration

### Full Configuration Options

```typescript
@WebSocketGateway({
  // Namespace (default is '/')
  namespace: '/chat',

  // CORS configuration
  cors: {
    origin: ['http://localhost:3000', 'https://app.example.com'],
    credentials: true,
  },

  // Socket.IO path (default is '/socket.io')
  path: '/socket.io',

  // Allowed transports
  transports: ['websocket', 'polling'],

  // Connection timeout
  pingTimeout: 60000,
  pingInterval: 25000,

  // Server options
  serveClient: false,

  // Adapter for scaling (Redis, etc.)
  // adapter: redisAdapter,
})
export class ConfiguredGateway {
  // Gateway implementation
}
```

## Lifecycle Hooks

### OnGatewayInit

Called once when the gateway is initialized:

```typescript
afterInit(server: Server) {
  this.logger.log('Gateway initialized');

  // Set up middleware
  server.use((socket, next) => {
    // Middleware logic
    next();
  });

  // Configure adapter
  // server.adapter(redisAdapter({ host: 'localhost', port: 6379 }));
}
```

### OnGatewayConnection

Called for each new client connection:

```typescript
async handleConnection(client: Socket, ...args: any[]) {
  const { sockets } = this.server.sockets;

  this.logger.log(`Client id: ${client.id} connected`);
  this.logger.debug(`Number of connected clients: ${sockets.size}`);

  // Access handshake data
  const { token } = client.handshake.auth;
  const userAgent = client.handshake.headers['user-agent'];

  // Store client-specific data
  client.data.userId = await this.getUserIdFromToken(token);

  // Join default rooms
  client.join('general');
}
```

### OnGatewayDisconnect

Called when client disconnects:

```typescript
handleDisconnect(client: Socket) {
  this.logger.log(`Client disconnected: ${client.id}`);

  // Cleanup client data
  const userId = client.data.userId;

  // Notify others
  this.server.emit('user-disconnected', { userId });

  // Remove from tracking
  this.activeUsers.delete(client.id);
}
```

## Event Handlers

### Subscribe to Messages

```typescript
@SubscribeMessage('chat-message')
handleChatMessage(
  @MessageBody() data: { room: string; message: string },
  @ConnectedSocket() client: Socket,
) {
  // Emit to room
  this.server.to(data.room).emit('new-message', {
    from: client.data.userId,
    message: data.message,
    timestamp: new Date(),
  });

  // Return acknowledgment
  return {
    success: true,
    messageId: this.generateMessageId(),
  };
}
```

### Multiple Event Handlers

```typescript
@SubscribeMessage('join-room')
handleJoinRoom(
  @MessageBody() room: string,
  @ConnectedSocket() client: Socket,
) {
  client.join(room);
  return { joined: room };
}

@SubscribeMessage('leave-room')
handleLeaveRoom(
  @MessageBody() room: string,
  @ConnectedSocket() client: Socket,
) {
  client.leave(room);
  return { left: room };
}

@SubscribeMessage('get-users')
async handleGetUsers(@MessageBody() room: string) {
  const sockets = await this.server.in(room).fetchSockets();
  return sockets.map(s => s.data.userId);
}
```

## Dependency Injection

### Injecting Services

```typescript
import { Injectable } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';
import { UsersService } from '../users/users.service';

@WebSocketGateway()
export class ChatGateway {
  constructor(
    private messagesService: MessagesService,
    private usersService: UsersService,
  ) {}

  @SubscribeMessage('send-message')
  async handleMessage(
    @MessageBody() data: { content: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Use injected services
    const user = await this.usersService.findById(client.data.userId);
    const message = await this.messagesService.create({
      userId: user.id,
      content: data.content,
    });

    this.server.emit('new-message', message);
    return { success: true, message };
  }
}
```

### Using Gateway in Services

Export gateway from module to use in services:

```typescript
// events.module.ts
@Module({
  providers: [EventsGateway],
  exports: [EventsGateway], // Export for use in other modules
})
export class EventsModule {}

// notifications.service.ts
@Injectable()
export class NotificationsService {
  constructor(private eventsGateway: EventsGateway) {}

  async sendNotification(userId: string, notification: any) {
    // Use gateway from service
    this.eventsGateway.server
      .to(`user:${userId}`)
      .emit('notification', notification);

    // Save to database
    await this.saveNotification(userId, notification);
  }
}
```

## Validation with DTOs

### Using Class-Validator

```typescript
// dto/send-message.dto.ts
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  message: string;

  @IsString()
  @IsNotEmpty()
  room: string;
}

// Gateway with validation
import { UsePipes, ValidationPipe } from '@nestjs/common';

@WebSocketGateway()
export class ChatGateway {
  @SubscribeMessage('send-message')
  @UsePipes(new ValidationPipe())
  handleMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    // data is validated
    this.server.to(data.room).emit('new-message', {
      message: data.message,
      from: client.id,
    });
  }
}
```

## Guards and Interceptors

### Using Guards

```typescript
// ws-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const data = context.switchToWs().getData();

    // Check authentication
    if (!client.data.userId) {
      throw new WsException('Unauthorized');
    }

    return true;
  }
}

// Apply guard to handler
@SubscribeMessage('protected-action')
@UseGuards(WsAuthGuard)
handleProtectedAction(@MessageBody() data: any) {
  // Only authenticated users reach here
}
```

### Using Interceptors

```typescript
// ws-logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class WsLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const client = context.switchToWs().getClient();
    const data = context.switchToWs().getData();
    const pattern = context.switchToWs().getPattern();

    console.log(`[WS] ${pattern} from ${client.id}`);

    return next.handle().pipe(
      tap((response) => {
        console.log(`[WS] Response:`, response);
      }),
    );
  }
}

// Apply interceptor
@SubscribeMessage('action')
@UseInterceptors(WsLoggingInterceptor)
handleAction(@MessageBody() data: any) {
  return { success: true };
}
```

## Exception Handling

### WebSocket Exceptions

```typescript
import { WsException } from '@nestjs/websockets';

@SubscribeMessage('action')
handleAction(@MessageBody() data: any) {
  if (!data.required) {
    throw new WsException('Required field missing');
  }

  try {
    return this.processAction(data);
  } catch (error) {
    throw new WsException({
      message: 'Action failed',
      error: error.message,
    });
  }
}
```

### Custom Exception Filter

```typescript
// ws-exception.filter.ts
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';

@Catch(WsException)
export class WsExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: WsException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();
    const error = exception.getError();

    client.emit('error', {
      message: typeof error === 'string' ? error : error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

// Apply filter
@UseFilters(new WsExceptionFilter())
@SubscribeMessage('action')
handleAction() {
  // Handler implementation
}
```

## Testing

### Unit Testing Gateways

```typescript
// events.gateway.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { EventsGateway } from './events.gateway';
import { Socket } from 'socket.io';

describe('EventsGateway', () => {
  let gateway: EventsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsGateway],
    }).compile();

    gateway = module.get<EventsGateway>(EventsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleMessage', () => {
    it('should emit message to all clients', () => {
      const mockClient = {
        id: 'test-client',
        data: {},
      } as Socket;

      const mockServer = {
        emit: jest.fn(),
      };

      gateway.server = mockServer as any;

      const result = gateway.handleMessage('test message', mockClient);

      expect(mockServer.emit).toHaveBeenCalledWith(
        'message',
        expect.objectContaining({
          message: 'test message',
        }),
      );
    });
  });
});
```

## Best Practices

### 1. Keep Gateways Thin
Move business logic to services:

```typescript
@WebSocketGateway()
export class ChatGateway {
  constructor(
    private chatService: ChatService, // Business logic here
  ) {}

  @SubscribeMessage('send-message')
  async handleMessage(@MessageBody() data: SendMessageDto) {
    // Gateway just coordinates
    const message = await this.chatService.createMessage(data);
    this.chatService.broadcastMessage(message);
    return { success: true };
  }
}
```

### 2. Use Proper Error Handling
Always handle errors gracefully:

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

### 3. Clean Up on Disconnect
Always clean up resources:

```typescript
handleDisconnect(client: Socket) {
  // Remove from active users
  this.activeUsers.delete(client.id);

  // Leave all rooms
  const rooms = Array.from(client.rooms);
  rooms.forEach(room => {
    client.leave(room);
  });

  // Notify others
  this.server.emit('user-left', client.data.userId);
}
```

### 4. Use TypeScript Types
Leverage type safety:

```typescript
interface ServerToClientEvents {
  'new-message': (message: Message) => void;
  'user-joined': (user: User) => void;
}

interface ClientToServerEvents {
  'send-message': (data: SendMessageDto) => void;
}

@WebSocketGateway()
export class TypedGateway {
  @WebSocketServer()
  server: Server<ClientToServerEvents, ServerToClientEvents>;
}
```

## Common Patterns

### Broadcast to All Except Sender

```typescript
@SubscribeMessage('user-typing')
handleTyping(
  @MessageBody() data: { room: string },
  @ConnectedSocket() client: Socket,
) {
  client.to(data.room).emit('user-typing', {
    userId: client.data.userId,
  });
}
```

### Private Messaging

```typescript
@SubscribeMessage('private-message')
async handlePrivateMessage(
  @MessageBody() data: { to: string; message: string },
  @ConnectedSocket() client: Socket,
) {
  const recipientSocket = await this.findSocketByUserId(data.to);

  if (recipientSocket) {
    recipientSocket.emit('private-message', {
      from: client.data.userId,
      message: data.message,
    });
  }
}
```

### Presence Tracking

```typescript
private onlineUsers = new Map<string, string>(); // socketId -> userId

handleConnection(client: Socket) {
  const userId = client.data.userId;
  this.onlineUsers.set(client.id, userId);

  this.server.emit('user-online', { userId });
}

handleDisconnect(client: Socket) {
  const userId = this.onlineUsers.get(client.id);
  this.onlineUsers.delete(client.id);

  this.server.emit('user-offline', { userId });
}
```
