# Login/Authentication Implementation Plan

## Kullanıcı Tercihleri
- **Auth Type:** Email + Password (JWT)
- **Registration:** Sadece Admin (seed script ile ilk admin)
- **UI Style:** Branded (WhatsApp temalı, gradient, logo)
- **Token TTL:** 7 gün

## Mevcut Altyapı

### Backend
- NestJS 11, TypeORM, PostgreSQL
- User entity: `id`, `phoneNumber`, `name`, `avatar` (auth alanları YOK)
- WebSocket: 2 gateway (`/sessions`, `/messages`) - güvensiz query param auth
- Guards/Interceptors: YOK

### Frontend
- React 19 + Vite + Tailwind CSS
- React Router: YOK (state-based navigation)
- Auth Context: YOK
- API Client: Axios (interceptor YOK)

---

## Implementation Plan

### PHASE 1: Backend - Database & Entity

#### TODO 1: User Entity Güncelleme
**Agent:** `typeorm-expert`
**Dosyalar:**
- `backend/src/entities/user.entity.ts`

**Görevler:**
1. `email` alanı ekle (unique, nullable)
2. `password` alanı ekle (nullable, select: false)
3. `role` alanı ekle (enum: 'admin' | 'user', default: 'user')
4. `isActive` alanı ekle (boolean, default: true)
5. `lastLoginAt` alanı ekle (timestamp, nullable)

#### TODO 2: Database Migration
**Agent:** `typeorm-expert`
**Dosyalar:**
- `backend/src/migrations/{timestamp}-AddAuthFieldsToUser.ts`

**Görevler:**
1. Migration dosyası oluştur
2. `email`, `password`, `role`, `isActive`, `lastLoginAt` kolonlarını ekle
3. Email için unique index ekle

---

### PHASE 2: Backend - Auth Module

#### TODO 3: Auth Paketleri Kurulumu
**Agent:** `nestjs-expert`
**Komut:**
```bash
cd backend && npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt && npm install -D @types/passport-jwt @types/bcrypt
```

#### TODO 4: Auth DTOs
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/auth/dto/login.dto.ts`
- `backend/src/modules/auth/dto/auth-response.dto.ts`

**Görevler:**
1. LoginDto: email, password (class-validator)
2. AuthResponseDto: accessToken, user

#### TODO 5: JWT Strategy
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/auth/strategies/jwt.strategy.ts`

**Görevler:**
1. PassportStrategy extend et
2. JWT_SECRET env'den al
3. validate() metodunu implement et

#### TODO 6: Auth Guards & Decorators
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/auth/guards/jwt-auth.guard.ts`
- `backend/src/modules/auth/decorators/public.decorator.ts`
- `backend/src/modules/auth/decorators/current-user.decorator.ts`

**Görevler:**
1. JwtAuthGuard - @Public() decorator'ü kontrol et
2. @Public() decorator - metadata set et
3. @CurrentUser() decorator - request.user döndür

#### TODO 7: Auth Service
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/auth/auth.service.ts`

**Görevler:**
1. validateUser(email, password) - bcrypt compare
2. login(user) - JWT sign, lastLoginAt güncelle
3. hashPassword(password) - bcrypt hash

#### TODO 8: Auth Controller
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/auth/auth.controller.ts`

**Görevler:**
1. POST /api/auth/login - LoginDto → AuthResponseDto
2. GET /api/auth/me - @UseGuards(JwtAuthGuard) → User

#### TODO 9: Auth Module
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/auth/auth.module.ts`

**Görevler:**
1. JwtModule.registerAsync ile ConfigService kullan
2. PassportModule import et
3. AuthService, JwtStrategy export et

#### TODO 10: App Module Güncelleme
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/app.module.ts`

**Görevler:**
1. AuthModule import et
2. APP_GUARD olarak JwtAuthGuard ekle (global)

#### TODO 11: Public Endpoints İşaretleme
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/webhooks/webhooks.controller.ts`
- `backend/src/modules/health/health.controller.ts`
- `backend/src/modules/chatbots/chatbot-webhook.controller.ts`

**Görevler:**
1. Webhook endpoint'lerine @Public() ekle
2. Health check'e @Public() ekle
3. Chatbot webhook'larına @Public() ekle

---

### PHASE 3: Backend - WebSocket Auth

#### TODO 12: WebSocket JWT Auth
**Agent:** `socket-io-expert`
**Dosyalar:**
- `backend/src/modules/websocket/middleware/ws-auth.middleware.ts`

**Görevler:**
1. JwtService inject et
2. `socket.handshake.auth.token`'dan JWT al
3. Token'ı verify et
4. User bilgisini `socket.data.user`'a ata

#### TODO 13: Gateway'lerde Auth Kullanımı
**Agent:** `socket-io-expert`
**Dosyalar:**
- `backend/src/modules/websocket/session.gateway.ts`
- `backend/src/modules/websocket/messages.gateway.ts`

**Görevler:**
1. `getUserIdFromSocket()`'i `socket.data.user.id` kullanacak şekilde güncelle
2. Auth middleware'i afterInit'te uygula

---

### PHASE 4: Backend - Admin Seed

#### TODO 14: Admin Seed Script
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/scripts/seed-admin.ts`
- `backend/package.json` (script ekle)

**Görevler:**
1. Seed script oluştur
2. bcrypt ile password hash'le
3. Admin user oluştur (email: admin@whatsapp-builder.local)
4. `npm run seed:admin` script'i ekle

---

### PHASE 5: Frontend - Auth Infrastructure

#### TODO 15: Auth Types
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/auth/types.ts`

**Görevler:**
1. User interface (id, name, email, role)
2. LoginCredentials interface
3. AuthResponse interface

#### TODO 16: Auth API Service
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/auth/api.ts`

**Görevler:**
1. login(credentials) → AuthResponse
2. getProfile() → User
3. logout() (token temizle)

#### TODO 17: Auth Context
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/contexts/AuthContext.tsx`

**Görevler:**
1. AuthProvider component
2. useAuth hook
3. State: user, token, isAuthenticated, isLoading
4. Methods: login, logout
5. useEffect: token varsa profile fetch et

#### TODO 18: API Client Interceptor
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/api/client.ts`

**Görevler:**
1. Request interceptor: Authorization header ekle
2. Response interceptor: 401'de token temizle ve login'e yönlendir

---

### PHASE 6: Frontend - Login UI

#### TODO 19: Login Page Component
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/auth/components/LoginPage.tsx`

**Görevler:**
1. Branded tasarım (gradient arka plan, WhatsApp yeşili)
2. Logo/başlık alanı
3. Email input
4. Password input
5. Login button
6. Error mesajı gösterimi
7. Loading state

#### TODO 20: App.tsx Auth Entegrasyonu
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/App.tsx`
- `frontend/src/main.tsx`

**Görevler:**
1. AuthProvider ile wrap et
2. isAuthenticated kontrolü ekle
3. Login değilse LoginPage göster
4. Loading state için spinner

---

### PHASE 7: Frontend - WebSocket Auth

#### TODO 21: Socket Auth Güncelleme
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/api/socket.ts`
- `frontend/src/hooks/useWebSocket.ts`
- `frontend/src/hooks/useSessionSocket.ts`

**Görevler:**
1. Socket bağlantısında `auth: { token }` gönder
2. Token değiştiğinde socket'ı yeniden bağla
3. Connection error'da login'e yönlendir

---

### PHASE 8: Test & Finalize

#### TODO 22: Backend Build & Test
**Agent:** `manual`
**Komutlar:**
```bash
cd backend && npm run build
npm run migration:run
npm run seed:admin
npm run start:dev
```

#### TODO 23: Frontend Build & Test
**Agent:** `manual`
**Komutlar:**
```bash
cd frontend && npm run build
npm run dev
```

#### TODO 24: Integration Test
**Agent:** `manual`
**Görevler:**
1. Login flow test et
2. Protected endpoint'leri test et
3. WebSocket auth test et
4. Token expiration test et

---

## Agent Kullanım Özeti

| Agent | TODO'lar |
|-------|----------|
| typeorm-expert | 1, 2 |
| nestjs-expert | 3, 4, 5, 6, 7, 8, 9, 10, 11, 14 |
| socket-io-expert | 12, 13 |
| react-expert | 15, 16, 17, 18, 19, 20, 21 |
| manual | 22, 23, 24 |

## Paralel Çalıştırma Grupları

```
Grup 1 (Backend DB): TODO 1, 2 → Paralel
Grup 2 (Backend Auth): TODO 3 → Önce, sonra 4, 5, 6 → Paralel
Grup 3 (Backend Auth): TODO 7, 8, 9 → Paralel
Grup 4 (Backend Integration): TODO 10, 11 → Paralel
Grup 5 (WebSocket): TODO 12, 13 → Paralel
Grup 6 (Seed): TODO 14 → Tek başına
Grup 7 (Frontend Types/API): TODO 15, 16 → Paralel
Grup 8 (Frontend Core): TODO 17, 18 → Paralel
Grup 9 (Frontend UI): TODO 19, 20 → Paralel
Grup 10 (Frontend WS): TODO 21 → Tek başına
Grup 11 (Test): TODO 22, 23, 24 → Sıralı
```

## Environment Variables

```env
# Backend (.env)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRATION=7d

# Admin Seed
ADMIN_EMAIL=admin@whatsapp-builder.local
ADMIN_PASSWORD=ChangeThisPassword123!
```

## Güvenlik Checklist

- [x] Password bcrypt ile hash'leniyor (10 rounds)
- [x] JWT secret env'den alınıyor
- [x] Token 7 gün geçerli
- [x] Password select: false (response'da gelmez)
- [x] 401'de otomatik logout
- [x] WebSocket token-based auth
- [ ] Rate limiting (sonra eklenebilir)
- [ ] Refresh token (sonra eklenebilir)
