# WebSockets

## Setup

```bash
npm install @nestjs/websockets @nestjs/platform-socket.io
npm install @types/socket.io --save-dev
```

## Gateway Implementation

```typescript
// events.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/events',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private eventsService: EventsService) {}

  afterInit(server: Server) {
    console.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ): string {
    console.log('Received:', data);
    return 'Message received';
  }

  @SubscribeMessage('events')
  handleEvent(@MessageBody() data: any): any {
    return data;
  }

  // Emit to all clients
  broadcastMessage(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Emit to specific client
  sendToClient(clientId: string, event: string, data: any) {
    this.server.to(clientId).emit(event, data);
  }

  // Emit to room
  sendToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }
}
```

## Authentication

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection {
  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization;

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = this.jwtService.verify(token);
      client.data.user = payload;

      console.log(`Authenticated user ${payload.email} connected`);
    } catch (error) {
      console.log('Authentication error:', error.message);
      client.disconnect();
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('privateMessage')
  handlePrivateMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const user = client.data.user;
    console.log(`Message from ${user.email}:`, data);
    return { user, data };
  }
}

// ws-jwt.guard.ts
@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();

    try {
      const token = client.handshake.auth.token;
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

## Rooms

```typescript
@WebSocketGateway()
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(room);
    client.emit('joinedRoom', room);
    this.server.to(room).emit('userJoined', {
      userId: client.id,
      room,
    });
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(room);
    this.server.to(room).emit('userLeft', {
      userId: client.id,
      room,
    });
  }

  @SubscribeMessage('messageToRoom')
  handleMessageToRoom(
    @MessageBody() payload: { room: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(payload.room).emit('message', {
      userId: client.id,
      message: payload.message,
    });
  }
}
```

## Broadcast Events

```typescript
@Injectable()
export class NotificationsService {
  constructor(private eventsGateway: EventsGateway) {}

  async sendNotification(userId: string, notification: any) {
    // Send to specific user's socket
    this.eventsGateway.sendToClient(userId, 'notification', notification);
  }

  async broadcastToAll(event: string, data: any) {
    this.eventsGateway.broadcastMessage(event, data);
  }

  async sendToRoom(room: string, event: string, data: any) {
    this.eventsGateway.sendToRoom(room, event, data);
  }
}

// Usage in controller
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post('send')
  async sendNotification(@Body() dto: SendNotificationDto) {
    await this.notificationsService.sendNotification(dto.userId, dto.message);
    return { success: true };
  }
}
```

## Exception Filters

```typescript
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';

@Catch()
export class WebSocketExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: WsException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    const error = exception.getError();
    const details = error instanceof Object ? { ...error } : { message: error };

    client.emit('error', {
      id: client.id,
      rid: host.switchToWs().getData().rid,
      ...details,
    });
  }
}

// Apply to gateway
@UseFilters(new WebSocketExceptionFilter())
@WebSocketGateway()
export class EventsGateway {}
```

## Pipes

```typescript
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!value) {
      throw new WsException('Validation failed: No data provided');
    }

    // Add your validation logic
    if (typeof value !== 'object') {
      throw new WsException('Validation failed: Data must be an object');
    }

    return value;
  }
}

// Usage
@UsePipes(new WsValidationPipe())
@SubscribeMessage('createMessage')
handleCreateMessage(@MessageBody() data: CreateMessageDto) {
  return this.messagesService.create(data);
}
```

## Adapters

### Custom Adapter

```typescript
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

export class CustomSocketAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    return server;
  }
}

// main.ts
const app = await NestFactory.create(AppModule);
app.useWebSocketAdapter(new CustomSocketAdapter(app));
```

### Redis Adapter

```typescript
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}

// main.ts
const app = await NestFactory.create(AppModule);
const redisIoAdapter = new RedisIoAdapter(app);
await redisIoAdapter.connectToRedis();
app.useWebSocketAdapter(redisIoAdapter);
```

## Client Examples

### JavaScript/TypeScript Client

```typescript
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token',
  },
});

// Connect
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

// Listen for events
socket.on('message', (data) => {
  console.log('Received message:', data);
});

// Send event
socket.emit('message', 'Hello Server!');

// Join room
socket.emit('joinRoom', 'room1');

// Send to room
socket.emit('messageToRoom', {
  room: 'room1',
  message: 'Hello Room!',
});

// Disconnect
socket.on('disconnect', () => {
  console.log('Disconnected');
});

// Error handling
socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

### React Hook

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (url: string, token?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(url, {
      auth: { token },
    });

    socketInstance.on('connect', () => {
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.close();
    };
  }, [url, token]);

  return { socket, connected };
};

// Usage
function ChatComponent() {
  const { socket, connected } = useSocket('http://localhost:3000', token);

  useEffect(() => {
    if (!socket) return;

    socket.on('message', (data) => {
      console.log('Message:', data);
    });

    return () => {
      socket.off('message');
    };
  }, [socket]);

  const sendMessage = (message: string) => {
    socket?.emit('message', message);
  };

  return <div>{/* UI */}</div>;
}
```

## Namespaces

```typescript
@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway {}

@WebSocketGateway({ namespace: '/notifications' })
export class NotificationsGateway {}

// Client
const chatSocket = io('http://localhost:3000/chat');
const notificationSocket = io('http://localhost:3000/notifications');
```

## Middleware

```typescript
@WebSocketGateway()
export class EventsGateway implements OnGatewayInit {
  afterInit(server: Server) {
    server.use((socket: Socket, next) => {
      // Authentication middleware
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      try {
        // Verify token
        const payload = verifyToken(token);
        socket.data.user = payload;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    server.use((socket: Socket, next) => {
      // Logging middleware
      console.log(`Socket ${socket.id} attempting to connect`);
      next();
    });
  }
}
```

## Testing

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';

describe('EventsGateway', () => {
  let app: INestApplication;
  let socket: Socket;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [EventsGateway],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(3001);

    socket = io('http://localhost:3001', {
      transports: ['websocket'],
    });
  });

  afterAll(async () => {
    socket.close();
    await app.close();
  });

  it('should emit message event', (done) => {
    socket.emit('message', 'Hello');

    socket.on('message', (data) => {
      expect(data).toBe('Message received');
      done();
    });
  });

  it('should join room', (done) => {
    socket.emit('joinRoom', 'room1');

    socket.on('joinedRoom', (room) => {
      expect(room).toBe('room1');
      done();
    });
  });
});
```

## Performance Optimization

### Connection Pooling

```typescript
@WebSocketGateway({
  transports: ['websocket'],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  maxHttpBufferSize: 1e6, // 1MB
})
export class EventsGateway {}
```

### Message Compression

```typescript
@WebSocketGateway({
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3,
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024,
    },
    threshold: 1024,
  },
})
export class EventsGateway {}
```

## Best Practices

### Connection Management
- Always handle disconnect events
- Implement reconnection logic on client
- Use heartbeat/ping-pong to detect dead connections
- Clean up resources on disconnect

### Authentication
- Authenticate on connection
- Store user info in socket.data
- Validate tokens on sensitive operations
- Implement rate limiting

### Error Handling
- Use WebSocket exception filters
- Emit error events to clients
- Log errors for debugging
- Provide meaningful error messages

### Performance
- Use Redis adapter for horizontal scaling
- Implement message compression
- Limit room sizes
- Use namespaces to separate concerns

### Security
- Validate all incoming data
- Sanitize user inputs
- Use CORS properly
- Implement rate limiting
- Avoid exposing sensitive information
