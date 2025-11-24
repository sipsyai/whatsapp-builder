# Middleware

WebSocket middleware patterns for Socket.IO in NestJS.

## Gateway Middleware

Apply middleware to all connections:

```typescript
@WebSocketGateway()
export class EventsGateway implements OnGatewayInit {
  afterInit(server: Server) {
    server.use((socket, next) => {
      // Middleware logic
      console.log('Middleware executed');
      next();
    });
  }
}
```

## Authentication Middleware

```typescript
@Injectable()
export class WsAuthMiddleware {
  constructor(private jwtService: JwtService) {}

  async use(socket: Socket, next: (err?: Error) => void) {
    try {
      const token = socket.handshake.auth.token;
      const payload = await this.jwtService.verifyAsync(token);

      socket.data.user = payload;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  }
}

// Apply in gateway
@WebSocketGateway()
export class AuthGateway implements OnGatewayInit {
  constructor(private authMiddleware: WsAuthMiddleware) {}

  afterInit(server: Server) {
    server.use((socket, next) => {
      this.authMiddleware.use(socket, next);
    });
  }
}
```

## Logging Middleware

```typescript
afterInit(server: Server) {
  server.use((socket, next) => {
    const start = Date.now();

    console.log(`[WS] Connection attempt from ${socket.handshake.address}`);

    socket.on('disconnect', () => {
      const duration = Date.now() - start;
      console.log(`[WS] Client ${socket.id} disconnected after ${duration}ms`);
    });

    next();
  });
}
```

## Rate Limiting Middleware

```typescript
afterInit(server: Server) {
  const connections = new Map<string, number>();

  server.use((socket, next) => {
    const ip = socket.handshake.address;
    const count = connections.get(ip) || 0;

    if (count > 10) {
      return next(new Error('Rate limit exceeded'));
    }

    connections.set(ip, count + 1);

    socket.on('disconnect', () => {
      connections.set(ip, (connections.get(ip) || 1) - 1);
    });

    next();
  });
}
```

## Validation Middleware

```typescript
afterInit(server: Server) {
  server.use((socket, next) => {
    const { apiVersion, clientType } = socket.handshake.query;

    if (!apiVersion || !clientType) {
      return next(new Error('Missing required headers'));
    }

    if (apiVersion !== 'v1') {
      return next(new Error('Unsupported API version'));
    }

    socket.data.clientType = clientType;
    next();
  });
}
```

## Error Handling

```typescript
afterInit(server: Server) {
  server.use((socket, next) => {
    try {
      // Middleware logic
      next();
    } catch (error) {
      console.error('Middleware error:', error);
      next(new Error('Internal error'));
    }
  });

  // Handle middleware errors
  server.on('connection', (socket) => {
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });
}
```

## Chaining Middleware

```typescript
afterInit(server: Server) {
  // Authentication
  server.use((socket, next) => {
    this.authMiddleware.use(socket, next);
  });

  // Authorization
  server.use((socket, next) => {
    if (!socket.data.user?.roles?.includes('user')) {
      return next(new Error('Unauthorized'));
    }
    next();
  });

  // Logging
  server.use((socket, next) => {
    this.loggingMiddleware.use(socket, next);
  });
}
```

## Per-Namespace Middleware

```typescript
@WebSocketGateway({ namespace: '/admin' })
export class AdminGateway implements OnGatewayInit {
  afterInit(server: Server) {
    // Only applies to /admin namespace
    server.use((socket, next) => {
      if (!socket.data.user?.isAdmin) {
        return next(new Error('Admin only'));
      }
      next();
    });
  }
}
```

## Testing Middleware

```typescript
describe('WsAuthMiddleware', () => {
  let middleware: WsAuthMiddleware;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn() } as any;
    middleware = new WsAuthMiddleware(jwtService);
  });

  it('should authenticate valid token', async () => {
    const socket = {
      handshake: { auth: { token: 'valid' } },
      data: {},
    } as any;

    const next = jest.fn();

    jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({ sub: 'user-1' });

    await middleware.use(socket, next);

    expect(socket.data.user).toEqual({ sub: 'user-1' });
    expect(next).toHaveBeenCalledWith();
  });

  it('should reject invalid token', async () => {
    const socket = {
      handshake: { auth: { token: 'invalid' } },
    } as any;

    const next = jest.fn();

    jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error());

    await middleware.use(socket, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
```
