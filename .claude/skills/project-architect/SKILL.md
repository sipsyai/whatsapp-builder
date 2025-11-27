# Project Architect - WhatsApp Builder

```yaml
name: project-architect
description: WhatsApp Builder projesinin kapsamlı teknoloji stack dökümantasyonu ve mimari rehberi. Tüm backend (NestJS, TypeORM, PostgreSQL), frontend (React, ReactFlow), real-time (Socket.IO) ve WhatsApp entegrasyonlarını içerir. Yeni geliştirici onboarding'i, mimari kararlar, özellik planlama ve proje yapısını anlama için kullan.
version: 1.0.0
author: Project Documentation System
tags:
  - architecture
  - full-stack
  - documentation
  - onboarding
  - project-structure
  - whatsapp-builder
  - nestjs
  - react
  - typescript
degree_of_freedom: high
```

## Production

**Live Application**: https://whatsapp.sipsy.ai

The production instance runs on Docker Compose with:
- Single container deployment (Frontend + Backend)
- PostgreSQL database with persistent storage
- Cloudflare Tunnel for secure HTTPS access
- JWT Authentication
- Real-time session tracking via WebSocket
- UI-based WhatsApp configuration (no .env editing required)
- Dark mode optimized UI

## Core Responsibilities

WhatsApp Builder projesinin kapsamlı mimarisini dökümante etme ve mimari rehberlik sağlama. Tüm teknoloji stack'inin nasıl çalıştığını, modüllerin nasıl etkileşime girdiğini ve best practice'lerin ne olduğunu bilme.

### Primary Tasks

1. **Proje Dökümantasyonu** - Tüm teknolojilerin gerçek kullanımını dökümante etme
2. **Mimari Rehberlik** - Yeni özellikler için mimari kararlar alma
3. **Onboarding** - Yeni geliştiricilere proje yapısını açıklama
4. **Agent Orchestration** - Doğru specialized agent'ı yönlendirme
5. **Cross-Cutting Concerns** - Authentication, logging, error handling gibi konular

## Technology Stack Overview

### Backend Stack
| Technology | Version | Purpose |
|-----------|---------|---------|
| NestJS | 11.0.1 | Progressive Node.js framework |
| TypeScript | 5.7.3 | Type-safe development |
| TypeORM | 0.3.27 | ORM for database operations |
| PostgreSQL | 14+ | Primary database |
| Socket.IO | 4.8.1 | WebSocket communication |
| Axios | 1.13.2 | WhatsApp API HTTP client |

### Frontend Stack
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2.0 | UI library |
| TypeScript | 5.9.3 | Type-safe development |
| ReactFlow | 12.3.5 | Visual flow builder |
| Socket.IO Client | 4.8.1 | WebSocket client |
| Vite | 7.2.5 | Build tool |
| Google GenAI | 1.30.0 | AI flow generation |

### Database
| Component | Details |
|-----------|---------|
| Tables | 7 (users, chatbots, conversations, messages, conversation_contexts, whatsapp_config, conversation_participants) |
| Migrations | 4 applied migrations |
| Indexing | Foreign keys, composite, partial unique |
| Special Features | JSONB columns, enums, cascade deletes |

## Quick Start Patterns

### Backend Module Structure

```typescript
// Typical NestJS module structure in this project
backend/src/modules/[feature]/
├── [feature].controller.ts    // REST endpoints
├── [feature].service.ts        // Business logic
├── [feature].module.ts         // Module definition
├── dto/                        // Data Transfer Objects
│   ├── create-[feature].dto.ts
│   └── update-[feature].dto.ts
└── services/                   // Additional services
    └── [specific].service.ts
```

### Frontend Feature Structure

```typescript
// Feature-based organization
frontend/src/features/[feature]/
├── [Feature]Page.tsx          // Main page component
├── components/                 // Feature-specific components
│   ├── ComponentA.tsx
│   └── ComponentB.tsx
├── api.ts                      // API calls for this feature
└── types.ts                    // Type definitions (if needed)
```

### Entity Relationship Pattern

```typescript
// Example: Conversation entity
@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToMany(() => User)
  @JoinTable({ name: 'conversation_participants' })
  participants: User[];

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  // WhatsApp 24-hour window tracking
  @Column({ type: 'timestamp with time zone', nullable: true })
  lastCustomerMessageAt: Date;

  canSendSessionMessage(): boolean {
    if (!this.lastCustomerMessageAt) return false;
    const diff = Date.now() - this.lastCustomerMessageAt.getTime();
    return diff < 24 * 60 * 60 * 1000;
  }
}
```

## Core Instructions

### When to Use This Skill

Use this skill when you need to:
- Understand overall project architecture
- Plan a new feature across multiple layers
- Make architectural decisions
- Onboard a new developer
- Understand module relationships
- Find where specific functionality is implemented
- Decide which specialized agent to call

### How This Skill Works

This skill acts as an **orchestrator** and **knowledge base**:

1. **Knowledge Base**: I know the entire project structure
2. **Orchestrator**: I call specialized agents for implementation details
3. **Guide**: I provide step-by-step plans for changes
4. **Advisor**: I recommend best practices based on existing patterns

### Architecture Decision Flow

```
User Request
    ↓
Analyze Impact
    ├─ Which modules affected?
    ├─ Which layers need changes?
    ├─ Integration points?
    └─ Potential issues?
    ↓
Create Plan
    ├─ Backend changes
    ├─ Frontend changes
    ├─ Database changes
    └─ Configuration changes
    ↓
Agent Assignment
    ├─ nestjs-expert for services
    ├─ react-expert for components
    ├─ typeorm-expert for entities
    └─ socket-io-expert for real-time
    ↓
Implementation Guidance
```

## Project Structure

### Backend Modules

**Feature Modules** (`backend/src/modules/`):
1. **chatbots** - Chatbot CRUD and flow execution
   - Controllers: ChatBotsController, ChatBotWebhookController
   - Services: ChatBotsService, ChatBotExecutionService, AppointmentService
   - Key: State machine pattern for flow execution

2. **conversations** - Conversation management
   - Service: ConversationsService
   - Features: Online status, typing indicators
   - Integration: WebSocket gateway

3. **messages** - Message CRUD and WhatsApp sending
   - Controller: MessagesController
   - Service: MessagesService
   - Integration: WhatsApp API, WebSocket

4. **users** - User management
   - Controller: UsersController (GET, POST, PUT, PATCH, DELETE /api/users)
   - Service: UsersService
   - DTOs: CreateUserDto, UpdateUserDto, UserResponseDto
   - Features:
     - Full CRUD operations with Swagger documentation
     - Self-deletion prevention (multi-layer: frontend + backend)
     - Form validation (name required, email format with regex)
     - Email uniqueness validation (409 Conflict on duplicates)
     - Phone number uniqueness validation
     - Partial updates via PATCH endpoint
   - Security:
     - Users cannot delete their own account (403 Forbidden)
     - Frontend disables delete button for current user
     - Backend validates currentUserId !== targetUserId
     - JWT-based authentication with @CurrentUser() decorator
   - Pattern: Enhanced CRUD with multi-layer security and validation

5. **webhooks** - WhatsApp webhook handling
   - Controller: WebhooksController
   - Services: WebhookSignatureService, WebhookParserService, WebhookProcessorService
   - Security: HMAC SHA256 signature verification

6. **websocket** - Real-time communication
   - Gateway: MessagesGateway
   - Namespace: `/messages`
   - Features: Rooms, typing indicators, online status

7. **whatsapp** - WhatsApp Business API integration
   - Services: WhatsAppMessageService, TextMessageService, InteractiveMessageService, FlowMessageService
   - Pattern: Service per message type

8. **media** - Media file handling
   - Service: MediaService
   - Purpose: WhatsApp media upload

**Core Modules** (`backend/src/`):
- **config** - Environment configuration
- **database** - TypeORM setup
- **entities** - Database entities (7 total)
- **migrations** - Schema migrations (4 total)

### Frontend Features

**Feature Modules** (`frontend/src/features/`):
1. **builder** - ReactFlow flow builder
   - BuilderPage.tsx: Main editor
   - ConfigModals.tsx: Node configuration
   - FlowTester.tsx: Flow simulation
   - utils/flowValidation.ts: Validation logic

2. **chat** - Real-time chat interface
   - ChatPage.tsx: Main chat UI
   - Sidebar.tsx: Conversation list
   - ChatWindow.tsx: Message display
   - MessageBubble.tsx: Message rendering

3. **chatbots** - Chatbot management
   - ChatBotsListPage.tsx: List view
   - api.ts: CRUD operations
   - Filtering, sorting, search

4. **nodes** - Custom ReactFlow nodes
   - StartNode: Flow entry
   - MessageNode: Send message
   - QuestionNode: Interactive questions
   - ConditionNode: Conditional branching

5. **sessions** - Session tracking and management
   - SessionsListPage: List view with search, filters, export
   - SessionDetailPage: Session detail with conversation log
   - SessionCard: Session preview card with delete option
   - ConversationLog: Message history with bot/user differentiation
   - SessionTimeline: Visual event timeline
   - VariablesPanel: Session context variables display
   - Features: URL deep linking, CSV/JSON export, date filtering

6. **users** - User management interface
   - UsersPage.tsx: User list with table view
   - api.ts: User API service (getUsers, createUser, updateUser, deleteUser)
   - Features:
     - Create new users via modal form
     - Edit existing users with pre-filled modal
     - Delete users with confirmation dialog
     - Real-time form validation with error messages
   - Form Validation:
     - Name: Required field (client-side)
     - Email: Required + format validation using regex
     - Error messages clear when user types
     - Submit button disabled when validation fails
   - Security:
     - Self-deletion prevention (multi-layer protection)
     - Disabled delete button for current user
     - Frontend JavaScript check prevents self-deletion
     - Tooltip explains why delete is disabled
     - useAuth() hook provides current user context
   - UI Components:
     - User avatar circles (shows first letter of name/email)
     - Action buttons (edit/delete) with hover effects
     - Modal forms with backdrop blur
     - Red border on invalid form fields
     - Inline error messages
   - Visual Design:
     - Dark mode optimized
     - WhatsApp-inspired color scheme
     - Responsive table layout
     - Smooth transitions and hover states

7. **settings** - Application settings management
   - WhatsappConfigPage.tsx: WhatsApp API configuration UI
   - Features:
     - Three-section layout (API Credentials, Webhook Config, Advanced Settings)
     - UI-based configuration (no .env editing)
     - Automatic webhook URL generation
     - API version selector (v18.0 - v24.0)
     - Masked sensitive fields (App Secret, Tokens)
     - Backend URL and Flow Endpoint URL management
   - See: `.claude/skills/project-architect/reference/17-whatsapp-settings-enhancement.md`

8. **conversations**, **landing** - Supporting features

**Shared Code** (`frontend/src/`):
- **api/** - API clients and services
- **hooks/** - Custom React hooks (useWebSocket)
- **shared/** - Shared components and types
- **types/** - TypeScript type definitions
- **utils/** - Utility functions

## Database Architecture

### Entities

1. **User** - Platform users (customers + business)
   - Fields: id, phoneNumber (unique), name, avatar
   - Relations: sentMessages (OneToMany)

2. **ChatBot** - Flow definitions
   - Fields: id, name, description, nodes (JSONB), edges (JSONB), isActive, status
   - Pattern: JSONB for ReactFlow graph

3. **Conversation** - Chat sessions
   - Fields: id, lastMessage, lastMessageAt, lastCustomerMessageAt, isWindowOpen
   - Relations: participants (ManyToMany), messages (OneToMany)
   - Business logic: canSendSessionMessage()

4. **ConversationContext** - Chatbot execution state
   - Fields: id, conversationId, chatbotId, currentNodeId, variables (JSONB), nodeHistory (JSONB), isActive
   - Pattern: State machine context

5. **Message** - Chat messages
   - Fields: id, conversationId, senderId, type (enum), content (JSONB), status (enum), timestamp
   - Pattern: Polymorphic content via JSONB

6. **WhatsAppConfig** - API configuration
   - Fields: id, phoneNumberId, accessToken, webhookVerifyToken, appSecret, backendUrl, flowEndpointUrl, apiVersion, isActive
   - Security: Sensitive data storage
   - UI Management: All fields configurable via `/settings/whatsapp-config`

### Relationships

```
User ─1:N→ Message
User ─N:M→ Conversation (via conversation_participants)
Conversation ─1:N→ Message
Conversation ─1:1→ ConversationContext (active)
ChatBot ─1:N→ ConversationContext
```

## Real-Time Architecture

### Socket.IO Setup

**Backend** (`backend/src/modules/websocket/messages.gateway.ts`):
- Namespace: `/messages`
- CORS: Frontend URL
- Auth: Query param (dev), JWT planned (prod)
- Lifecycle: OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect

**Events (Client → Server)**:
- `conversation:join` - Join room
- `conversation:leave` - Leave room
- `typing:start` - Start typing
- `typing:stop` - Stop typing

**Events (Server → Client)**:
- `message:received` - New message
- `message:status` - Status update
- `user:online` - User connected
- `user:offline` - User disconnected

**Frontend** (`frontend/src/hooks/useWebSocket.ts`):
- Custom hook for Socket.IO
- State: connected, newMessage, messageStatusUpdate
- Auto-connect on mount
- Event listeners with cleanup

### Room Pattern

```typescript
// Conversation-based rooms
room: `conversation:${conversationId}`

// Emit to room (excluding sender)
client.to(room).emit('event', data);

// Emit to room (including sender)
server.to(room).emit('event', data);
```

## WhatsApp Integration

### Message Types

**Implemented:**
- Text messages
- Interactive button messages (max 3)
- Interactive list messages (max 10 sections)
- Flow messages (planned expansion)

**Planned:**
- Media messages (image, video, audio, document)
- Template messages
- Location/Contact messages

### Webhook Flow

```
WhatsApp → POST /api/webhooks/whatsapp
    ↓
WebhooksController.handleWebhook()
    ↓ Verify X-Hub-Signature-256
WebhookProcessorService.processMessages()
    ↓ Parse & validate
MessagesService.create()
    ↓ Save to database
MessagesGateway.emit('message:received')
    ↓ Socket.IO broadcast
Frontend receives and renders
    ↓
ChatBotExecutionService.processUserResponse()
    ↓ Execute chatbot flow
```

### 24-Hour Window Tracking

WhatsApp allows free-form messages only within 24 hours of customer's last message:

```typescript
// In Conversation entity
canSendSessionMessage(): boolean {
  if (!this.lastCustomerMessageAt) return false;
  const diff = Date.now() - this.lastCustomerMessageAt.getTime();
  return diff < 24 * 60 * 60 * 1000;
}

// Updated in WebhookProcessor when customer messages
conversation.lastCustomerMessageAt = message.timestamp;
conversation.isWindowOpen = true;
```

## Chatbot Flow Execution

### Node Types

1. **START**: Entry point, auto-proceeds
2. **MESSAGE**: Send text, auto-proceeds
3. **QUESTION**: Send interactive message, waits for response
4. **CONDITION**: Evaluate expression, routes to true/false

### Execution Pattern

```typescript
// State machine pattern
executeCurrentNode(contextId) {
  const context = await this.findContext(contextId);
  const node = this.findNode(context.currentNodeId);

  switch (node.type) {
    case 'start':
      await this.processStartNode(context, node);
      break;
    case 'message':
      await this.processMessageNode(context, node);
      break;
    case 'question':
      await this.processQuestionNode(context, node);
      break; // Waits for user response
    case 'condition':
      await this.processConditionNode(context, node);
      break;
  }
}
```

### Variable System

```typescript
// Template replacement
content: "Hello {{name}}, your appointment is {{time}}"

// Stored in ConversationContext.variables
{ name: "John", time: "2024-01-15 14:00" }

// Replaced at runtime
replaceVariables(text, variables) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) =>
    variables[varName] ?? match
  );
}
```

## Best Practices Observed

### Backend

1. **Modular Design**: Feature-based modules
2. **Dependency Injection**: Constructor injection
3. **Repository Pattern**: TypeORM repositories
4. **DTO Validation**: class-validator decorators
5. **Error Handling**: HTTP exceptions + filters
6. **Logging**: NestJS Logger in every service
7. **Migrations**: Schema versioning
8. **Type Safety**: Full TypeScript coverage

### Frontend

1. **Feature-Sliced Design**: Domain-driven structure
2. **Hooks-Only**: No class components
3. **Custom Hooks**: Reusable logic (useWebSocket)
4. **Type Safety**: Comprehensive TypeScript
5. **Optimistic Updates**: Immediate UI feedback
6. **Validation**: Flow validation before save
7. **Service Pattern**: API abstraction
8. **Memoization**: useMemo/useCallback

### Database

1. **UUID Primary Keys**: Distributed-friendly
2. **JSONB for Flexibility**: ReactFlow graphs
3. **Enum Types**: Type-safe constants
4. **Timestamps with Timezone**: Global app
5. **Cascade Deletes**: Data integrity
6. **Partial Indexes**: Unique constraints
7. **Migration-Based**: Production-safe

## Development Workflow

### Setup

```bash
# Clone repository
git clone [repository-url]

# Backend setup
cd backend
npm install
cp .env.example .env  # Configure environment
npm run migration:run
npm run start:dev

# Frontend setup
cd ../frontend
npm install
cp .env.example .env  # Configure environment
npm run dev
```

### Common Scripts

**Backend:**
```bash
npm run start:dev         # Development server
npm run migration:generate  # Generate migration
npm run migration:run     # Apply migrations
npm run migration:revert  # Rollback migration
npm run build             # Production build
```

**Frontend:**
```bash
npm run dev               # Development server
npm run build             # Production build
npm run preview           # Preview build
```

### Environment Variables

**Backend (.env):**
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=whatsapp_builder

# WhatsApp credentials can be configured via UI at /settings/whatsapp-config
# Or via environment variables (optional):
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=...
WHATSAPP_APP_SECRET=...

PORT=3000
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
VITE_GOOGLE_GENAI_API_KEY=...
```

## Common Use Cases

### Use Case 1: Add New Message Type

**Scenario**: Support video messages

**Steps**:
1. **Database**: Message entity already supports (JSONB content)
2. **Backend**:
   - Create `VideoMessageService` in `whatsapp/services/message-types/`
   - Add to `WhatsAppMessageService`
   - Update `WebhookParserService` for video parsing
3. **Frontend**:
   - Add `VideoMessageBubble` component
   - Update `MessageBubble` to render video
   - Add video upload to `ChatWindow`
4. **Agents to call**:
   - whatsapp-messaging-api-expert: WhatsApp video API
   - react-expert: Video upload component
   - nestjs-expert: Service implementation

### Use Case 2: Add Authentication

**Scenario**: Implement JWT authentication

**Steps**:
1. **Backend**:
   - Create `auth` module (controller, service, module)
   - Implement `JwtStrategy` with Passport
   - Create `JwtAuthGuard`
   - Apply guards to controllers
   - Update WebSocket authentication
2. **Frontend**:
   - Add login page
   - Store JWT in localStorage
   - Add Authorization header to API client
   - Handle token refresh
3. **Agents to call**:
   - nestjs-expert: Auth module setup
   - socket-io-expert: WebSocket auth
   - react-expert: Login UI

### Use Case 3: Add Full-Text Search

**Scenario**: Search messages by content

**Steps**:
1. **Database**:
   - Create GIN index on message content
   - Add search query method
2. **Backend**:
   - Add search endpoint to `MessagesController`
   - Implement search in `MessagesService` with QueryBuilder
3. **Frontend**:
   - Add search input to ChatPage
   - Call search API
   - Highlight results
4. **Agents to call**:
   - postgresql-expert: Full-text search setup
   - typeorm-expert: QueryBuilder implementation
   - react-expert: Search UI

## Related Skills

### Backend Development
- **[NestJS Expert](../nestjs-expert/SKILL.md)** - NestJS patterns and best practices
- **[TypeORM Development](../typeorm-development/SKILL.md)** - Entity design and queries
- **[PostgreSQL Expert](../postgresql-expert/SKILL.md)** - Database optimization
- **[Socket.IO Expert](../socket-io-expert/SKILL.md)** - Real-time features

### Frontend Development
- **[React Expert](../react-expert/SKILL.md)** - React patterns and hooks
- **[ReactFlow Development](../reactflow-development/SKILL.md)** - Flow builder

### Integration
- **[WhatsApp Messaging API Expert](../whatsapp-messaging-api-expert/SKILL.md)** - WhatsApp API integration

## Documentation References

For detailed documentation, see:
→ **[reference/](reference/)** - Comprehensive reference documentation

### Reference Files
1. [01-project-overview.md](reference/01-project-overview.md) - Project introduction
2. [02-backend-architecture.md](reference/02-backend-architecture.md) - Backend deep dive
3. [03-frontend-architecture.md](reference/03-frontend-architecture.md) - Frontend deep dive
4. [04-database-design.md](reference/04-database-design.md) - Database schema
5. [05-real-time-system.md](reference/05-real-time-system.md) - Socket.IO architecture
6. [06-whatsapp-integration.md](reference/06-whatsapp-integration.md) - WhatsApp API
7. [07-project-structure.md](reference/07-project-structure.md) - Directory layout
8. [08-module-relationships.md](reference/08-module-relationships.md) - Dependencies
9. [09-development-guide.md](reference/09-development-guide.md) - Dev workflow
10. [10-deployment-architecture.md](reference/10-deployment-architecture.md) - Production setup
11. [11-flow-builder-feature.md](reference/11-flow-builder-feature.md) - WhatsApp Flow Builder
12. [12-session-tracking-feature.md](reference/12-session-tracking-feature.md) - Session tracking with search, export, deletion
13. [13-rest-api-node-feature.md](reference/13-rest-api-node-feature.md) - REST API node integration
14. [14-chatbot-builder-auto-layout.md](reference/14-chatbot-builder-auto-layout.md) - Auto layout system
15. [15-authentication-security.md](reference/15-authentication-security.md) - JWT authentication and security
16. [16-users-management-feature.md](reference/16-users-management-feature.md) - User management with security features
17. [17-whatsapp-settings-enhancement.md](reference/17-whatsapp-settings-enhancement.md) - WhatsApp settings UI enhancement

## Summary

This skill provides comprehensive knowledge of the WhatsApp Builder project architecture. Use it as a starting point for understanding the project, planning changes, making architectural decisions, and determining which specialized agents to call for implementation details.

**Key Strengths**:
- Modular, maintainable architecture
- Type-safe throughout (TypeScript)
- Production-ready patterns
- Real-time capabilities
- Flexible data structures (JSONB)
- Comprehensive validation

**Completed Enhancements**:
- ✅ Authentication (JWT) - Implemented with login page and token-based access
- ✅ API documentation (Swagger) - Available at /api/docs
- ✅ Session management features - Search, export, deletion, deep linking
- ✅ User management - CRUD operations with security features and form validation

**Areas for Future Enhancement**:
- Rate limiting
- Structured logging (ELK stack)
- Comprehensive testing (E2E, unit)
- WebSocket scaling (Redis adapter)
- Multi-tenant support
