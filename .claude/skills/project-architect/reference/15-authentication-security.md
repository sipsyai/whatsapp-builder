# Authentication & Security - WhatsApp Builder

## Overview

JWT-based authentication with bcrypt password hashing and global route protection.

### Technology Stack
- **JWT**: @nestjs/jwt, passport-jwt
- **Password Hashing**: bcrypt (10 rounds)
- **Strategy**: Passport JWT Strategy
- **Token Storage**: localStorage (frontend)

---

## JWT Authentication

### Configuration
```typescript
// auth.module.ts
JwtModule.registerAsync({
  useFactory: (configService: ConfigService) => ({
    secret: configService.get<string>('JWT_SECRET'),
    signOptions: { expiresIn: '7d' },
  }),
  inject: [ConfigService],
})
```

### Token Payload
```typescript
interface JwtPayload {
  sub: string;    // User ID
  email: string;
  role: string;   // 'admin' | 'user'
  iat?: number;   // Issued at
  exp?: number;   // Expiration
}
```

### Token Lifecycle
1. User submits email/password via `POST /api/auth/login`
2. Backend validates credentials with bcrypt
3. Backend generates JWT token (7-day expiry)
4. Frontend stores token in localStorage
5. Frontend includes token in all API requests
6. Backend validates token on each request

---

## Backend Implementation

### AuthModule
**Path**: `/backend/src/modules/auth/`

**Files**:
- `auth.module.ts` - Module configuration
- `auth.service.ts` - Authentication logic
- `auth.controller.ts` - API endpoints
- `strategies/jwt.strategy.ts` - Passport strategy
- `guards/jwt-auth.guard.ts` - Global guard
- `decorators/public.decorator.ts` - Public endpoint decorator
- `decorators/current-user.decorator.ts` - User extraction decorator
- `dto/login.dto.ts`, `dto/auth-response.dto.ts` - DTOs

### API Endpoints

**POST /api/auth/login** (Public)
```typescript
Request: { email: string, password: string }
Response: {
  accessToken: string,
  expiresIn: 604800,
  user: { id, name, email, role }
}
```

**GET /api/auth/me** (Protected)
```typescript
Headers: Authorization: Bearer <token>
Response: { id, name, email, role, avatar, createdAt }
```

### Global Authentication Guard
```typescript
// app.module.ts
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
],
```

All endpoints protected by default. Use `@Public()` decorator to bypass.

### Public Endpoints
```typescript
@Public()
@Post('login')
async login(@Body() loginDto: LoginDto) {}
```

**Public Routes**:
- `POST /api/auth/login`
- `GET/POST /api/webhooks/whatsapp`
- `POST /api/webhooks/flow-endpoint`
- `GET /health/*`
- `POST /chatbot-webhook`

---

## Password Security

### Hashing
```typescript
import * as bcrypt from 'bcrypt';

// Hash password (registration/seed)
const hashedPassword = await bcrypt.hash(password, 10);

// Verify password (login)
const isValid = await bcrypt.compare(password, hashedPassword);
```

### Salt Rounds: 10
- Balance between security and performance
- ~100ms per hash on modern hardware

### Database Storage
```typescript
@Column({ nullable: true, length: 255, select: false })
password: string;
```
- `select: false` - Password excluded from default queries
- Explicit selection required: `{ select: ['id', 'email', 'password'] }`

---

## Frontend Implementation

### AuthContext
**Path**: `/frontend/src/contexts/AuthContext.tsx`

```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}
```

### Token Storage
```typescript
// Login
localStorage.setItem('token', response.accessToken);
localStorage.setItem('user', JSON.stringify(response.user));

// Logout
localStorage.removeItem('token');
localStorage.removeItem('user');
```

### Axios Interceptors
```typescript
// Request: Attach token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response: Handle 401
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## WebSocket Security

### JWT Validation Middleware
**Path**: `/backend/src/modules/websocket/middleware/ws-auth.middleware.ts`

```typescript
@Injectable()
export class WsAuthMiddleware {
  use(socket: Socket, next: (err?: Error) => void) {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication failed'));
    }

    const decoded = this.jwtService.verify<JwtPayload>(token);
    socket.data.userId = decoded.sub;
    socket.data.user = decoded;

    next();
  }
}
```

### Frontend Connection
```typescript
const token = localStorage.getItem('token');
const socket = io(`${WS_URL}/messages`, {
  auth: { token },
  transports: ['websocket', 'polling'],
});
```

---

## Role-Based Access Control

### User Roles
```typescript
export type UserRole = 'admin' | 'user';
```

### Current Implementation
- Role stored in JWT payload
- Role stored in database
- **Not enforced** - All authenticated users have full access

### Planned RBAC
```typescript
// Guard
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Delete('/api/chatbots/:id')
async remove() {}

// Decorator
export const Roles = (...roles: UserRole[]) =>
  SetMetadata('roles', roles);
```

---

## Security Best Practices

### Implemented
- JWT authentication with 7-day expiry
- bcrypt password hashing (10 rounds)
- Global authentication guard
- Password excluded from queries (select: false)
- WebSocket JWT validation
- CORS configuration
- Webhook signature verification (HMAC SHA256)

### TODO for Production
- [ ] Refresh token mechanism
- [ ] Token revocation (blacklist)
- [ ] Rate limiting on login
- [ ] RBAC enforcement
- [ ] Password complexity requirements
- [ ] Password reset flow
- [ ] Email verification
- [ ] HTTPS enforcement
- [ ] Helmet.js security headers
- [ ] CSRF protection

---

## Environment Variables

```bash
# Required
JWT_SECRET=your-super-secret-key-change-in-production

# Optional (defaults)
JWT_EXPIRATION=7d

# Admin seed (development)
ADMIN_EMAIL=admin@whatsapp-builder.local
ADMIN_PASSWORD=Admin123
ADMIN_NAME=Admin
```

**Security Notes**:
- Use strong, random JWT_SECRET (minimum 32 characters)
- Generate with: `openssl rand -base64 32`
- NEVER commit secrets to version control
- Use different secrets for dev/staging/prod

---

## Admin User Setup

### Seed Script
```bash
cd backend
npm run seed:admin
```

### Manual Creation (SQL)
```sql
INSERT INTO users (id, name, email, password, role, "isActive")
VALUES (
  gen_random_uuid(),
  'Admin',
  'admin@yourdomain.com',
  '$2b$10$...',  -- bcrypt hash
  'admin',
  true
);
```

### Default Credentials
- Email: `admin@whatsapp-builder.local`
- Password: `Admin123`

**IMPORTANT**: Change credentials in production!

---

## Testing Authentication

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@whatsapp-builder.local","password":"Admin123"}'
```

### Protected Endpoint
```bash
curl -X GET http://localhost:3000/api/chatbots \
  -H "Authorization: Bearer <token>"
```

### Invalid Token
```bash
curl -X GET http://localhost:3000/api/chatbots \
  -H "Authorization: Bearer invalid"
# Expected: 401 Unauthorized
```

---

## References

- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [Passport JWT](https://www.passportjs.org/packages/passport-jwt/)
- [bcrypt](https://www.npmjs.com/package/bcrypt)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**See Also**:
- [Backend Architecture](02-backend-architecture.md) - AuthModule details
- [Frontend Architecture](03-frontend-architecture.md) - AuthContext
- [Real-time System](05-real-time-system.md) - WebSocket authentication
- [Database Design](04-database-design.md) - User entity auth fields
