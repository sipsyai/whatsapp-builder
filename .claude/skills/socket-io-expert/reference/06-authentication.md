# Authentication

Complete guide for securing WebSocket connections with authentication and authorization.

## JWT Authentication

### Server-Side Implementation

```typescript
import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AuthenticatedGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger('AuthenticatedGateway');

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.error(`No token provided for client ${client.id}`);
        client.emit('error', { message: 'No authentication token provided' });
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      // Store user information in socket data
      client.data.userId = payload.sub;
      client.data.email = payload.email;
      client.data.roles = payload.roles || [];

      // Join user-specific room for targeted messages
      await client.join(`user:${payload.sub}`);

      this.logger.log(`User ${payload.email} authenticated (${client.id})`);

      // Send successful connection event
      client.emit('authenticated', {
        userId: payload.sub,
        email: payload.email,
      });
    } catch (error) {
      this.logger.error(`Authentication failed for ${client.id}: ${error.message}`);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    this.logger.log(`User ${userId} disconnected (${client.id})`);
  }
}
```

### Client-Side (React)

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useAuthenticatedSocket(url: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setError('No authentication token found');
      return;
    }

    const socketInstance = io(url, {
      auth: {
        token,
      },
    });

    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socketInstance.on('authenticated', (data) => {
      console.log('Authenticated:', data);
      setIsAuthenticated(true);
      setError(null);
    });

    socketInstance.on('error', (err) => {
      console.error('Socket error:', err);
      setError(err.message);
      setIsAuthenticated(false);
    });

    socketInstance.on('disconnect', () => {
      setIsAuthenticated(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [url]);

  return { socket, isAuthenticated, error };
}
```

## Authentication Middleware

### Custom Middleware Approach

```typescript
// ws-auth.middleware.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthMiddleware {
  constructor(private jwtService: JwtService) {}

  async use(socket: Socket, next: (err?: Error) => void) {
    try {
      const token = this.extractToken(socket);

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = await this.jwtService.verifyAsync(token);

      // Attach user data to socket
      socket.data.user = {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles,
      };

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  }

  private extractToken(socket: Socket): string | null {
    return (
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.replace('Bearer ', '') ||
      null
    );
  }
}

// Apply in gateway
@WebSocketGateway()
export class EventsGateway implements OnGatewayInit {
  constructor(private wsAuthMiddleware: WsAuthMiddleware) {}

  afterInit(server: Server) {
    // Apply middleware to all connections
    server.use((socket, next) => {
      this.wsAuthMiddleware.use(socket, next);
    });

    this.logger.log('Authentication middleware applied');
  }
}
```

## Role-Based Authorization

### Authorization Guard

```typescript
// roles.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());

    if (!requiredRoles) {
      return true;
    }

    const client = context.switchToWs().getClient();
    const user = client.data.user;

    if (!user) {
      throw new WsException('User not authenticated');
    }

    const hasRole = requiredRoles.some((role) => user.roles?.includes(role));

    if (!hasRole) {
      throw new WsException('Insufficient permissions');
    }

    return true;
  }
}

// Roles decorator
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Usage in gateway
@WebSocketGateway()
export class AdminGateway {
  @SubscribeMessage('admin-action')
  @UseGuards(RolesGuard)
  @Roles('admin')
  handleAdminAction(@MessageBody() data: any) {
    // Only admins can execute this
  }
}
```

## Token Refresh

### Handling Token Expiration

```typescript
// Server-side: Token refresh endpoint
@Post('refresh')
async refresh(@Body() dto: RefreshTokenDto) {
  const newTokens = await this.authService.refreshTokens(dto.refreshToken);
  return newTokens;
}

// Client-side: Reconnect with new token
useEffect(() => {
  if (!socket) return;

  socket.on('token-expired', async () => {
    try {
      // Get new token
      const response = await axios.post('/api/auth/refresh', {
        refreshToken: localStorage.getItem('refreshToken'),
      });

      const { accessToken } = response.data;
      localStorage.setItem('accessToken', accessToken);

      // Reconnect with new token
      socket.auth = { token: accessToken };
      socket.connect();
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Redirect to login
      window.location.href = '/login';
    }
  });
}, [socket]);
```

## User-Specific Rooms

### Automatic Room Assignment

```typescript
async handleConnection(client: Socket) {
  try {
    // Authenticate
    const token = client.handshake.auth.token;
    const payload = await this.jwtService.verifyAsync(token);
    const userId = payload.sub;

    client.data.userId = userId;

    // Join user-specific room
    await client.join(`user:${userId}`);

    // Join role-based rooms
    const roles = payload.roles || [];
    for (const role of roles) {
      await client.join(`role:${role}`);
    }

    // Join organization room if applicable
    if (payload.orgId) {
      await client.join(`org:${payload.orgId}`);
    }

    this.logger.log(`User ${userId} joined rooms:`, Array.from(client.rooms));
  } catch (error) {
    client.disconnect();
  }
}

// Send message to specific user
sendToUser(userId: string, event: string, data: any) {
  this.server.to(`user:${userId}`).emit(event, data);
}

// Send to all users with specific role
sendToRole(role: string, event: string, data: any) {
  this.server.to(`role:${role}`).emit(event, data);
}

// Send to organization
sendToOrg(orgId: string, event: string, data: any) {
  this.server.to(`org:${orgId}`).emit(event, data);
}
```

## Query Parameters Authentication

### Using Query Params

```typescript
// Server-side
async handleConnection(client: Socket) {
  try {
    // Extract from query parameters
    const token = client.handshake.query.token as string;

    if (!token) {
      throw new Error('No token in query');
    }

    const payload = await this.jwtService.verifyAsync(token);
    client.data.userId = payload.sub;

    // Rest of authentication logic
  } catch (error) {
    client.disconnect();
  }
}

// Client-side
const socket = io('http://localhost:3000', {
  query: {
    token: localStorage.getItem('accessToken'),
  },
});
```

## Cookie-Based Authentication

### Using HTTP Cookies

```typescript
// Server-side
import * as cookieParser from 'cookie-parser';

// In main.ts
app.use(cookieParser());

// In gateway
async handleConnection(client: Socket) {
  try {
    // Extract cookie from handshake
    const cookies = client.handshake.headers.cookie;
    const token = this.extractTokenFromCookie(cookies);

    if (!token) {
      throw new Error('No auth cookie');
    }

    const payload = await this.jwtService.verifyAsync(token);
    client.data.userId = payload.sub;
  } catch (error) {
    client.disconnect();
  }
}

private extractTokenFromCookie(cookieString: string): string | null {
  if (!cookieString) return null;

  const cookies = cookieString.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});

  return cookies['auth_token'] || null;
}

// Client-side (automatic with credentials)
const socket = io('http://localhost:3000', {
  withCredentials: true,
});
```

## API Key Authentication

### For Server-to-Server

```typescript
@WebSocketGateway()
export class ApiGateway implements OnGatewayConnection {
  private validApiKeys = new Set([
    process.env.API_KEY_1,
    process.env.API_KEY_2,
  ]);

  handleConnection(client: Socket) {
    const apiKey = client.handshake.auth.apiKey;

    if (!apiKey || !this.validApiKeys.has(apiKey)) {
      this.logger.error(`Invalid API key from ${client.id}`);
      client.disconnect();
      return;
    }

    client.data.isApiClient = true;
    this.logger.log(`API client connected: ${client.id}`);
  }
}

// Client with API key
const socket = io('http://localhost:3000', {
  auth: {
    apiKey: process.env.API_KEY,
  },
});
```

## Custom Authentication Strategy

### Implementing Custom Auth

```typescript
interface AuthPayload {
  sessionId: string;
  userId: string;
  deviceId: string;
}

@Injectable()
export class CustomAuthService {
  constructor(
    private sessionsService: SessionsService,
    private usersService: UsersService,
  ) {}

  async validateConnection(sessionId: string, deviceId: string): Promise<AuthPayload | null> {
    const session = await this.sessionsService.findActive(sessionId);

    if (!session || session.deviceId !== deviceId) {
      return null;
    }

    return {
      sessionId,
      userId: session.userId,
      deviceId,
    };
  }
}

@WebSocketGateway()
export class CustomAuthGateway implements OnGatewayConnection {
  constructor(private customAuthService: CustomAuthService) {}

  async handleConnection(client: Socket) {
    try {
      const { sessionId, deviceId } = client.handshake.auth;

      const authPayload = await this.customAuthService.validateConnection(
        sessionId,
        deviceId,
      );

      if (!authPayload) {
        throw new Error('Invalid session');
      }

      client.data.auth = authPayload;
      await client.join(`user:${authPayload.userId}`);

      this.logger.log(`Custom auth successful for user ${authPayload.userId}`);
    } catch (error) {
      client.disconnect();
    }
  }
}
```

## Security Best Practices

### 1. Always Disconnect Unauthenticated Clients

```typescript
async handleConnection(client: Socket) {
  try {
    await this.authenticate(client);
  } catch (error) {
    this.logger.error(`Auth failed: ${error.message}`);
    client.emit('error', { message: 'Authentication required' });
    client.disconnect();
    return;
  }
}
```

### 2. Validate Tokens on Every Connection

```typescript
async handleConnection(client: Socket) {
  // Never trust client-stored data
  // Always verify token with secret
  const payload = await this.jwtService.verifyAsync(token, {
    secret: process.env.JWT_SECRET,
  });

  // Check if user still exists and is active
  const user = await this.usersService.findById(payload.sub);
  if (!user || !user.isActive) {
    client.disconnect();
    return;
  }
}
```

### 3. Implement Rate Limiting

```typescript
private connectionAttempts = new Map<string, number[]>();

async handleConnection(client: Socket) {
  const ip = client.handshake.address;
  const now = Date.now();

  // Get recent attempts
  const attempts = this.connectionAttempts.get(ip) || [];
  const recentAttempts = attempts.filter(time => now - time < 60000); // Last minute

  if (recentAttempts.length > 10) {
    this.logger.warn(`Rate limit exceeded for IP: ${ip}`);
    client.disconnect();
    return;
  }

  recentAttempts.push(now);
  this.connectionAttempts.set(ip, recentAttempts);

  // Continue with authentication
}
```

### 4. Use Secure Token Storage

```typescript
// Client-side: Never log tokens
console.log('Connecting...'); // Good
console.log('Token:', token); // Bad!

// Use secure storage
localStorage.setItem('accessToken', token); // OK for short-lived tokens
// For sensitive apps, use httpOnly cookies instead

// Clear tokens on logout
socket.on('logout', () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  socket.disconnect();
});
```

### 5. Implement Session Management

```typescript
private activeSessions = new Map<string, Set<string>>(); // userId -> Set<socketId>

async handleConnection(client: Socket) {
  const userId = client.data.userId;

  // Track active sessions
  if (!this.activeSessions.has(userId)) {
    this.activeSessions.set(userId, new Set());
  }

  this.activeSessions.get(userId).add(client.id);

  // Limit concurrent sessions
  const sessions = this.activeSessions.get(userId);
  if (sessions.size > 5) {
    // Disconnect oldest session
    const [oldestId] = sessions;
    const oldestSocket = this.server.sockets.sockets.get(oldestId);
    oldestSocket?.disconnect();
  }
}

handleDisconnect(client: Socket) {
  const userId = client.data.userId;
  this.activeSessions.get(userId)?.delete(client.id);
}
```

## Testing Authentication

```typescript
describe('Authentication', () => {
  let gateway: AuthenticatedGateway;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthenticatedGateway,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<AuthenticatedGateway>(AuthenticatedGateway);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should authenticate valid token', async () => {
    const mockClient = {
      id: 'client-1',
      handshake: { auth: { token: 'valid-token' } },
      data: {},
      join: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
      sub: 'user-1',
      email: 'user@example.com',
    });

    await gateway.handleConnection(mockClient);

    expect(mockClient.data.userId).toBe('user-1');
    expect(mockClient.join).toHaveBeenCalledWith('user:user-1');
    expect(mockClient.disconnect).not.toHaveBeenCalled();
  });

  it('should disconnect on invalid token', async () => {
    const mockClient = {
      id: 'client-1',
      handshake: { auth: { token: 'invalid' } },
      emit: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error('Invalid'));

    await gateway.handleConnection(mockClient);

    expect(mockClient.disconnect).toHaveBeenCalled();
  });
});
```
