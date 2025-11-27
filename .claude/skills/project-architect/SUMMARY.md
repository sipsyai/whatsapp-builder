# WhatsApp Builder - Project Summary

## Proje Özeti

WhatsApp Builder, WhatsApp Business API üzerinden görsel akış bazlı chatbot'lar oluşturmanızı sağlayan bir full-stack TypeScript uygulamasıdır.

### Temel İstatistikler

- **Toplam Kod Satırı:** ~15,000+ satır (backend + frontend)
- **Backend Modüller:** 9 feature module (including AuthModule)
- **Frontend Features:** 8+ feature module (including auth)
- **Database Tables:** 7 tablo
- **Custom ReactFlow Nodes:** 4 tip
- **API Endpoints:** 30+ REST endpoint
- **WebSocket Events:** 8 event type
- **Migrations:** 4 applied migration

### Teknoloji Stack

**Backend (NestJS):**
- NestJS 11.0.1 - Progressive framework
- TypeORM 0.3.27 - ORM
- PostgreSQL 14+ - Database
- Socket.IO 4.8.1 - WebSocket
- Axios 1.13.2 - HTTP client

**Frontend (React):**
- React 19.2.0 - UI library
- ReactFlow 12.3.5 - Visual editor
- Socket.IO Client 4.8.1 - WebSocket
- Vite 7.2.5 - Build tool
- Google GenAI 1.30.0 - AI generation

### Mimari Yaklaşım

**Backend:**
- Modular architecture (feature-based)
- Repository pattern
- Service layer
- DTO validation
- Migration-based schema
- Event-driven (WebSocket)

**Frontend:**
- Feature-sliced design
- Hooks-only (no classes)
- Custom hooks (useWebSocket)
- Service pattern (API abstraction)
- Optimistic updates
- Type-safe throughout

**Database:**
- UUID primary keys
- JSONB for flexibility
- Enum types
- Partial unique indexes
- Cascade deletes
- Migration control

### Temel Özellikler

1. **Visual Flow Builder**
   - ReactFlow tabanlı drag-and-drop editor
   - 4 node tipi (Start, Message, Question, Condition)
   - Real-time validation
   - AI-powered generation (Google Gemini)

2. **Real-Time Chat**
   - Socket.IO WebSocket
   - Room-based messaging
   - Typing indicators
   - Online/offline status
   - Message delivery tracking

3. **Chatbot Execution**
   - State machine pattern
   - Variable storage & templating
   - Conditional branching
   - Flow history tracking
   - Multi-step conversations

4. **WhatsApp Integration**
   - Text, Button, List messages
   - Webhook handling (HMAC verified)
   - 24-hour window tracking
   - Error mapping
   - Idempotency

### Modül Yapısı

**Backend Modules:**
1. `auth` - JWT authentication & authorization
2. `chatbots` - Flow management & execution
3. `conversations` - Chat sessions
4. `messages` - Message CRUD & sending
5. `users` - User management
6. `webhooks` - WhatsApp webhook processing
7. `websocket` - Real-time gateway
8. `whatsapp` - WhatsApp API client
9. `media` - File handling

**Frontend Features:**
1. `builder` - Visual flow editor
2. `chat` - Chat interface
3. `chatbots` - Bot management
4. `nodes` - Custom ReactFlow nodes
5. `users`, `settings`, `conversations`, `flows`, `landing`

### Data Flow

**Incoming Message:**
```
WhatsApp → Webhook → Parse → Validate → Save → WebSocket → Frontend
                                     ↓
                              Execute Chatbot Flow
                                     ↓
                              Send Response → WhatsApp
```

**Outgoing Message:**
```
Frontend → API → Service → WhatsApp API
                    ↓
                Save to DB
                    ↓
                WebSocket Emit → Frontend
```

### Entity İlişkileri

```
User ─1:N→ Message
User ─N:M→ Conversation (via conversation_participants)
Conversation ─1:N→ Message
Conversation ─1:1→ ConversationContext (active)
ChatBot ─1:N→ ConversationContext
```

### Önemli Dosyalar

**Backend:**
- `backend/src/modules/chatbots/services/chatbot-execution.service.ts` - Akış motoru
- `backend/src/modules/webhooks/services/webhook-processor.service.ts` - Webhook işleme
- `backend/src/modules/websocket/messages.gateway.ts` - WebSocket gateway
- `backend/src/modules/whatsapp/services/whatsapp-message.service.ts` - WhatsApp client

**Frontend:**
- `frontend/src/features/builder/components/BuilderPage.tsx` - Flow editor
- `frontend/src/features/chat/ChatPage.tsx` - Chat interface
- `frontend/src/hooks/useWebSocket.ts` - WebSocket hook
- `frontend/src/features/nodes/` - Custom node implementations

### Best Practices

**Uygulanmış:**
- ✓ TypeScript type safety
- ✓ Input validation (class-validator)
- ✓ Migration-based schema
- ✓ Modular architecture
- ✓ Error handling
- ✓ Webhook signature verification
- ✓ Optimistic UI updates
- ✓ Connection pooling
- ✓ JWT authentication (global guard)
- ✓ bcrypt password hashing
- ✓ WebSocket JWT validation
- ✓ Role-based user model

**Geliştirilmeli:**
- ⚠️ Rate limiting
- ⚠️ Structured logging
- ⚠️ Redis adapter (WebSocket scaling)
- ⚠️ Comprehensive testing
- ⚠️ RBAC enforcement (roles defined but not enforced)

### Production Readiness

**Status:** %90 hazır

**Tamamlanan:**
- ✓ JWT Authentication (login, protected routes)
- ✓ Password hashing (bcrypt)
- ✓ WebSocket authentication
- ✓ Global auth guard

**Eksikler:**
1. Rate limiting
2. Monitoring & logging
3. Horizontal scaling (Redis)
4. CI/CD pipeline
5. Test coverage
6. RBAC enforcement

### Geliştirme İş Akışı

```bash
# Development
npm run start:dev   # Backend
npm run dev         # Frontend

# Database
npm run migration:generate  # Generate migration
npm run migration:run       # Apply migrations

# Build
npm run build       # Production build

# Test
npm run test        # Unit tests
npm run test:e2e    # E2E tests
```

### Deployment Architecture (Planned)

```
Load Balancer
    ↓
Frontend (Static hosting)
    ↓
Backend (NestJS instances × N)
    ↓
├─> PostgreSQL (Primary + Replicas)
├─> Redis (WebSocket adapter)
└─> WhatsApp API
```

### Key Metrics (Development)

- **Build Time:** ~5s (frontend), ~10s (backend)
- **Cold Start:** ~2s (backend)
- **Hot Reload:** <1s (both)
- **DB Queries:** <50ms avg
- **WebSocket Latency:** <100ms
- **API Response:** <200ms avg

### Documentation Structure

```
.claude/skills/project-architect/
├── README.md               # This file (quick reference)
├── SKILL.md                # Complete skill definition
├── SUMMARY.md              # Project summary
└── reference/              # Detailed documentation
    ├── 01-project-overview.md
    ├── 02-backend-architecture.md
    ├── 03-frontend-architecture.md
    ├── 04-database-design.md
    ├── 05-real-time-system.md
    ├── 06-whatsapp-integration.md
    ├── 07-project-structure.md
    ├── 08-module-relationships.md
    ├── 09-development-guide.md
    └── 10-deployment-architecture.md
```

### Next Steps

**For New Developers:**
1. Read README.md
2. Setup development environment
3. Read relevant reference docs
4. Make first contribution

**For Architecture Changes:**
1. Consult project-architect agent
2. Review affected modules
3. Create plan with specialized agents
4. Implement & document

**For Production Deployment:**
1. Complete authentication
2. Add rate limiting
3. Setup monitoring
4. Configure Redis adapter
5. Write deployment docs
6. Setup CI/CD

---

**Version:** 1.0.0
**Created:** 2025-01-24
**Maintained By:** Project Documentation System
