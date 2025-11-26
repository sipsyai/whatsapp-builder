# Backend Architecture - WhatsApp Builder

## Overview

NestJS 11.x modular architecture with TypeScript, TypeORM, and Socket.IO.

### Principles
- Modular Design (9 feature modules)
- Single Responsibility
- Dependency Injection
- Type Safety (strict mode)
- DTO Validation (class-validator)
- Repository Pattern (TypeORM)

### Structure
```
backend/src/
├── main.ts, app.module.ts          # Bootstrap & root module
├── config/, database/              # Configuration & DB setup
├── entities/                       # 8 TypeORM entities
├── modules/                        # 9 feature modules
│   ├── chatbots/                   # Flow management & execution
│   ├── whatsapp/                   # WhatsApp API integration
│   ├── webhooks/                   # Webhook processing
│   ├── conversations/, messages/   # Conversation management
│   ├── websocket/                  # Socket.IO gateway
│   ├── flows/                      # WhatsApp Flows lifecycle
│   ├── media/, users/              # Media upload & user management
└── migrations/                     # TypeORM migrations
```

---

## Core Modules

### 1. ChatBotsModule
**Path**: `/backend/src/modules/chatbots/`

**Entities**: ChatBot, ConversationContext, Conversation, User, WhatsAppFlow

**Services**:
- `ChatBotsService`: CRUD operations (create, findAll, findOne, update, remove, updateStatus)
- `ChatBotExecutionService`: Flow execution engine
  - Node processors: Start, Message, Question, Condition, WhatsAppFlow, RestApi
  - State management via ConversationContext
  - Variable system (`{{varName}}` replacement)
  - **Message Persistence**: Saves all bot messages to DB with WhatsApp message IDs
- `RestApiExecutorService`: **NEW** - REST API execution with variable interpolation
  - Nested path support (`data.user.name`)
  - Array indexing (`items[0].title`)
  - Math expressions (`{{page + 1}}`)
- `SessionHistoryService`: Session tracking with enhanced message metadata
- `AppointmentService`, `MockCalendarService`: Domain logic

**Controllers**:
- `ChatBotsController`: 13 endpoints (CRUD, stats, toggle, restore, test-rest-api)
- `ChatBotWebhookController`: Legacy Flow webhook endpoints

**Key DTOs**:
- `CreateChatBotDto`, `UpdateChatBotDto`, `QueryChatBotsDto`
- `ChatBotNodeDto`, `ChatBotEdgeDto`, `NodeDataDto`
- `SessionDto`, `SessionDetailDto`, `MessageDto`
- `TestRestApiDto`: API configuration testing

**Node Types & Data Fields**:
- **MESSAGE**: content
- **QUESTION**: questionType (text/buttons/list), buttons, listSections, headerText, footerText, variable
  - **Dynamic Lists/Buttons**: dynamicListSource, dynamicButtonsSource, dynamicLabelField, dynamicDescField
- **CONDITION**: conditionGroup (multi-condition with AND/OR), legacy fields (conditionVar/Op/Val)
- **WHATSAPP_FLOW**: whatsappFlowId, flowMode, flowCta, flowOutputVariable
- **REST_API**: apiUrl, apiMethod, apiHeaders, apiBody, apiOutputVariable, apiResponsePath, apiErrorVariable, apiTimeout

**Execution Flow**:
```
startChatBot() → processStartNode() → processMessageNode() → processQuestionNode() → WAIT
                                                                        ↓
User responds → processUserResponse() → save to variables → executeCurrentNode() [resume]
```

**File Locations**:
- Controller: `chatbots.controller.ts`
- Services: `services/chatbot-execution.service.ts`, `services/rest-api-executor.service.ts`, `services/session-history.service.ts`
- DTOs: `dto/create-chatbot.dto.ts`, `dto/session.dto.ts`, `dto/test-rest-api.dto.ts`

---

### 2. WhatsAppModule
**Path**: `/backend/src/modules/whatsapp/`

**Entities**: WhatsAppConfig, WhatsAppFlow

**Services**:
- `WhatsAppApiService`: HTTP client for WhatsApp Cloud API (sendMessage, uploadMedia, getMediaUrl)
- `WhatsAppConfigService`: Active config management (getActiveConfig, create, update)
- `TextMessageService`: Text message sending
- `InteractiveMessageService`: Buttons (max 3), Lists (max 10 rows)
- `WhatsAppMessageService`: Orchestrator routing to message type services
- `WhatsAppFlowService`: Flow lifecycle (create, update, publish, deprecate, delete, getDetails, getPreviewUrl)
- `FlowEncryptionService`: RSA + AES-128-GCM encryption for Flow webhooks (decryptRequest, encryptResponse, verifySignature)

**Character Limits**:
- Button title: 20 chars
- List section title: 24 chars
- List row title: 24 chars
- List row description: 72 chars

**File Locations**:
- API service: `services/whatsapp-api.service.ts`
- Message services: `services/message-types/`
- Flow service: `services/whatsapp-flow.service.ts`
- Encryption: `services/flow-encryption.service.ts`

---

### 3. WebhooksModule
**Path**: `/backend/src/modules/webhooks/`

**Dependencies**: ChatBotsModule, WhatsAppModule, WebSocketModule (forwardRef)

**Services**:
- `WebhookSignatureService`: HMAC SHA256 verification
- `WebhookParserService`: Parse messages (text, interactive buttons/lists, **nfm_reply** Flow completion, media, reactions)
- `WebhookProcessorService`: Business logic orchestrator
  - Find/create user & conversation
  - Save message to DB
  - Emit Socket.IO event
  - Execute chatbot logic
  - **Flow response processing**: UUID-aware flow_token parsing (`{contextId}-{nodeId}`)
- `FlowEndpointService`: Flow webhook actions (INIT, data_exchange, BACK, error_notification, ping)

**Controllers**:
- `WebhooksController`: GET /verify (Meta verification), POST (receive webhooks)
- `FlowEndpointController`: POST /flow-endpoint (encrypted Flow data exchange)

**Processing Pipeline**:
```
Webhook → Verify Signature → Parse → Find/Create User → Find/Create Conversation
  → Save Message → Emit Socket.IO → Execute ChatBot → Send Response → Emit Response Event
```

**File Locations**:
- Controllers: `webhooks.controller.ts`, `flow-endpoint.controller.ts`
- Services: `services/webhook-processor.service.ts`, `services/webhook-parser.service.ts`

---

### 4. ConversationsModule
**Path**: `/backend/src/modules/conversations/`

**Entities**: Conversation, User

**Service**: `ConversationsService`
- `findAll()`: List with participants, messages (order by lastMessageAt DESC)
- `findOne(id)`: Get with participants
- `getMessages(conversationId, dto)`: Paginated messages (skip/take)
- `sendMessage(dto)`: Create message → save → emit Socket.IO → send WhatsApp → update status

**Controller**: `ConversationsController`
- GET / - List
- GET /:id - Get
- GET /:id/messages - Messages
- POST /:id/messages - Send

---

### 5. WebSocketModule
**Path**: `/backend/src/modules/websocket/`

**Gateway**: `MessagesGateway`
- Namespace: `/messages`
- CORS: Frontend URL
- User tracking: `Map<userId, Set<socketId>>`

**Client → Server Events**:
- `conversation:join`, `conversation:leave`
- `typing:start`, `typing:stop`
- `session:join`, `session:leave`

**Server → Client Events**:
- `message:received`, `message:status`
- `user:online`, `user:offline`
- `session:message-sent`, `session:node-executed`, `session:status-changed`, `session:completed`

**Connection Lifecycle**:
```
Connect (userId) → Track user → Broadcast user:online
Join conversation → client.join(`conversation:${id}`)
Emit to room → server.to(`conversation:${id}`).emit()
Disconnect → Remove from tracking → Broadcast user:offline
```

**File Location**: `messages.gateway.ts`

---

### 6. FlowsModule
**Path**: `/backend/src/modules/flows/`

**Entity**: WhatsAppFlow

**Service**: `FlowsService`
- `create(dto)`: Create & publish to WhatsApp
- `findAll()`, `getActiveFlows()`: List flows
- `update(id, dto)`: Update (resets to DRAFT)
- `publish(id)`: Publish to WhatsApp (status → PUBLISHED)
- `delete(id)`: Smart deletion (deprecate if PUBLISHED → delete from WhatsApp → delete local)
- `syncFromMeta()`: **NEW** - Sync flows from Meta API (create/update based on whatsappFlowId)

**Flow Lifecycle**: DRAFT → PUBLISHED → DEPRECATED → DELETED

**Controller**: `FlowsController`
- GET /, GET /active, POST /, POST /sync
- GET /:id, PUT /:id, POST /:id/publish, GET /:id/preview, DELETE /:id

---

### 7. MediaModule & UsersModule
**MediaModule**: Media file uploads to WhatsApp API (`MediaService.uploadMedia()`)
**UsersModule**: Basic user CRUD

---

## Routing

```
/api
├── /chatbots            13 endpoints (CRUD, stats, toggle, restore, stop, test-rest-api)
├── /flows               8 endpoints (CRUD, sync, publish, preview)
├── /conversations       4 endpoints (list, get, messages, send)
├── /users               4 endpoints
├── /media               1 endpoint (upload)
├── /webhooks
│   ├── /whatsapp       GET (verify), POST (receive)
│   └── /flow-endpoint  POST (encrypted)
└── /whatsapp-config    3 endpoints
```

---

## Dependency Injection

### Module Imports Pattern
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([Entity1, Entity2]),  // Repositories
    OtherModule,                                     // Exported services
    forwardRef(() => CircularModule),               // Circular deps
  ],
  providers: [Service1],
  exports: [Service1],                              // Available to importers
})
```

### Circular Dependencies (forwardRef)
- ConversationsModule ↔ WebSocketModule
- WebhooksModule ↔ WebSocketModule
- MessagesModule ↔ WebSocketModule

---

## Error Handling

### HTTP Exceptions
```typescript
throw new NotFoundException('ChatBot not found');         // 404
throw new BadRequestException('Invalid payload');         // 400
throw new UnauthorizedException('Invalid signature');     // 401
```

### WebSocket Exception Filter
**File**: `filters/ws-exception.filter.ts`
Emits error events to clients with message & timestamp.

---

## Configuration

### Environment Variables (.env)
```bash
# Database
DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_LOGGING

# Application
PORT=3000
FRONTEND_URL=http://localhost:5173

# WhatsApp API
WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN
WHATSAPP_WEBHOOK_VERIFY_TOKEN, WHATSAPP_APP_SECRET
```

### ConfigModule
```typescript
ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })
```

Usage: `configService.get('WHATSAPP_PHONE_NUMBER_ID')`

---

## API Documentation (Swagger)

**URL**: `http://localhost:3000/api/docs`
**JSON**: `http://localhost:3000/api/docs-json`

**Coverage**:
- 5 Controllers documented
- 29+ endpoints
- 18 DTOs with 100+ fields
- 9 feature tags

**Decorators**: `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()`, `@ApiParam()`, `@ApiBody()`, `@ApiProperty()`

---

## Module Dependency Graph

```
AppModule
  ├─→ ConfigModule
  ├─→ DatabaseModule
  ├─→ WhatsAppModule
  │     └─→ TypeOrmModule.forFeature([WhatsAppConfig, WhatsAppFlow])
  ├─→ ChatBotsModule
  │     ├─→ WhatsAppModule
  │     └─→ TypeOrmModule.forFeature([ChatBot, ConversationContext, Conversation, User, WhatsAppFlow])
  ├─→ FlowsModule
  │     ├─→ WhatsAppModule
  │     └─→ TypeOrmModule.forFeature([WhatsAppFlow])
  ├─→ ConversationsModule ↔ WebSocketModule (forwardRef)
  ├─→ WebhooksModule
  │     ├─→ ChatBotsModule
  │     ├─→ WhatsAppModule
  │     └─→ WebSocketModule (forwardRef)
  ├─→ MessagesModule, MediaModule, UsersModule
```

---

## Key Takeaways

1. **9 Feature Modules**: Clear separation of concerns
2. **8 Entities**: TypeORM with UUID primary keys, JSONB columns
3. **Circular Dependencies**: Resolved with forwardRef()
4. **Real-time**: Socket.IO with room-based messaging
5. **Encryption**: RSA + AES for Flow data exchange
6. **Message Persistence**: All bot messages saved with WhatsApp IDs
7. **Dynamic Lists/Buttons**: Data-driven interactive messages with pagination
8. **REST API Integration**: Variable interpolation, nested paths, math expressions
9. **Session Tracking**: Enhanced message metadata for bot detection

---

**See Also**:
- [Database Design](04-database-design.md) - Entity schemas & relationships
- [Real-time System](05-real-time-system.md) - Socket.IO events
- [WhatsApp Integration](06-whatsapp-integration.md) - API details
- [Module Relationships](08-module-relationships.md) - Detailed dependency graph
