# Backend Architecture - WhatsApp Builder

## Overview

NestJS 11.x modular architecture with TypeScript, TypeORM, and Socket.IO.

### Principles
- Modular Design (10 feature modules)
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
├── entities/                       # 9 TypeORM entities
├── modules/                        # 10 feature modules
│   ├── chatbots/                   # Flow management & execution
│   ├── whatsapp/                   # WhatsApp API integration
│   ├── webhooks/                   # Webhook processing
│   ├── conversations/, messages/   # Conversation management
│   ├── websocket/                  # Socket.IO gateway
│   ├── flows/                      # WhatsApp Flows lifecycle
│   ├── data-sources/               # External API configuration
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
- `ChatBotsController`: 15 endpoints (CRUD, stats, toggle, restore, test-rest-api, export, import)
- `ChatBotWebhookController`: Legacy Flow webhook endpoints

**Key DTOs**:
- `CreateChatBotDto`, `UpdateChatBotDto`, `QueryChatBotsDto`
- `ChatBotNodeDto`, `ChatBotEdgeDto`, `NodeDataDto`
- `SessionDto`, `SessionDetailDto`, `MessageDto`
- `TestRestApiDto`: API configuration testing
- `ExportChatbotQueryDto`, `ExportedChatbotData`: Chatbot export with embedded flows
- `ImportChatbotBodyDto`, `ImportChatbotResponseDto`: Chatbot import with validation

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

**Key Features**:
- Import/Export: Backup, share, and migrate chatbots with embedded WhatsApp Flows
  - Export format: JSON with version control (v1.0)
  - Import validation: Structure check, duplicate name handling, flow dependency resolution
  - See: [Chatbot Import/Export Feature](19-chatbot-import-export.md)

**File Locations**:
- Controller: `chatbots.controller.ts`
- Service: `chatbots.service.ts` (export/import methods)
- Execution: `services/chatbot-execution.service.ts`, `services/rest-api-executor.service.ts`
- Session: `services/session-history.service.ts`
- DTOs: `dto/create-chatbot.dto.ts`, `dto/session.dto.ts`, `dto/test-rest-api.dto.ts`
- Import/Export: `dto/export-chatbot.dto.ts`, `dto/import-chatbot.dto.ts`

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
  - **Config-Driven Data Exchange** (NEW): Generic handler using `ComponentDataSourceConfigDto[]`
  - Loads `dataSourceConfig` from Flow metadata
  - Supports cascading dropdowns via `dependsOn` and `filterParam`
  - Fetches data from DataSource and transforms to WhatsApp dropdown format
  - Falls back to legacy hardcoded handler if no config found

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
- `createFromPlayground(dto)`: **NEW** - Create flow from Playground JSON with auto-validation
  - Validates playground JSON structure (version, screens)
  - Normalizes JSON format
  - Auto-generates flow name from first screen title/ID
  - Saves with metadata: `{ source: 'playground', created_from_playground: true }`
  - Optional auto-publish after creation
- `findAll()`, `getActiveFlows()`: List flows
- `update(id, dto)`: Update (resets to DRAFT)
- `publish(id)`: Publish to WhatsApp (status → PUBLISHED)
- `delete(id)`: Smart deletion (deprecate if PUBLISHED → delete from WhatsApp → delete local)
- `syncFromMeta()`: Sync flows from Meta API (create/update based on whatsappFlowId)

**Flow Lifecycle**: DRAFT → PUBLISHED → DEPRECATED → DELETED

**Controller**: `FlowsController`
- GET /, GET /active, POST /, POST /sync, **POST /from-playground**
- GET /:id, PUT /:id, POST /:id/publish, GET /:id/preview, DELETE /:id

**Key DTOs**:
- `CreateFlowDto`: Standard flow creation
- `CreateFlowFromPlaygroundDto`: **NEW** - Playground JSON with categories
  - `playgroundJson: any` - Complete playground export
  - `name?: string` - Optional (auto-generated)
  - `categories: WhatsAppFlowCategory[]` - Required (min 1)
  - `autoPublish?: boolean` - Optional (default: false)
  - `dataSourceId?: string` - Optional flow-level DataSource
  - `dataSourceConfig?: ComponentDataSourceConfigDto[]` - Component-level configs
- `UpdateFlowDto`: Partial updates
- `ComponentDataSourceConfigDto`: **NEW** - Per-component data source configuration
  - `componentName: string` - Component name in Flow JSON
  - `dataSourceId: string` - DataSource UUID
  - `endpoint: string` - API endpoint path
  - `dataKey: string` - Key to extract array from response
  - `transformTo: TransformToDto` - Field mapping (idField, titleField, descriptionField)
  - `dependsOn?: string` - For cascading dropdowns
  - `filterParam?: string` - Filter parameter for cascading

**WhatsApp Flow Categories**:
- SIGN_UP, SIGN_IN, APPOINTMENT_BOOKING
- LEAD_GENERATION, CONTACT_US, CUSTOMER_SUPPORT
- SURVEY, OTHER

**See**:
- [Create with Playground Feature](./20-create-with-playground-feature.md) for detailed documentation
- [Data Sources + WhatsApp Flows Integration](./21-data-sources-whatsapp-flows-integration.md) for cascading dropdowns

---

### 7. DataSourcesModule
**Path**: `/backend/src/modules/data-sources/`

**Entity**: DataSource

**Purpose**: Manage external API configurations dynamically, eliminating hardcoded credentials.

**Service**: `DataSourcesService`
- `create(dto)`: Create new data source with auth validation
- `findAll()`: List all data sources
- `findAllActive()`: List only active data sources
- `findOne(id)`: Get single data source
- `update(id, dto)`: Update with re-validation
- `delete(id)`: Delete data source
- `testConnection(id)`: Test connectivity and measure response time
- `fetchData(id, endpoint, options)`: Generic HTTP client for API calls
- `createAxiosClient(ds)`: Private - Create configured Axios instance with auth headers
- `validateAuthConfig(...)`: Private - Validate auth type and token requirements

**Data Source Types**:
- `REST_API`: Generic REST API
- `STRAPI`: Strapi CMS
- `GRAPHQL`: GraphQL endpoint

**Authentication Types**:
- `NONE`: No authentication
- `BEARER`: Bearer token (Authorization: Bearer {token})
- `API_KEY`: Custom header with API key
- `BASIC`: Basic auth (Authorization: Basic {base64})

**Controller**: `DataSourcesController`
- POST /api/data-sources - Create
- GET /api/data-sources - List all
- GET /api/data-sources/active - List active only
- GET /api/data-sources/:id - Get one
- PUT /api/data-sources/:id - Update
- DELETE /api/data-sources/:id - Delete
- POST /api/data-sources/:id/test - Test connection

**Integration Points**:
- `ChatBotExecutionService`: Uses DataSource for WhatsApp Flow data prefetching
- `FlowEndpointService`: Fetches dynamic data from DataSource for Flow INIT
- `WhatsAppFlow` entity: Has optional `dataSourceId` foreign key

**Key DTOs**:
- `CreateDataSourceDto`: Validation with @IsUrl, @IsEnum, conditional auth fields
- `UpdateDataSourceDto`: Partial update DTO
- `TestConnectionResult`: Connection test response with timing

**Security Notes**:
- Auth tokens stored in plain text (encryption recommended for production)
- Validation ensures auth token is required when auth type is not NONE
- For API_KEY type, authHeaderName is also required

**File Locations**:
- Entity: `entities/data-source.entity.ts`
- Service: `data-sources.service.ts`
- Controller: `data-sources.controller.ts`
- DTOs: `dto/create-data-source.dto.ts`, `dto/update-data-source.dto.ts`

**Migration Impact**:
- Removed hardcoded Strapi credentials from `FlowEndpointService` and `ChatBotExecutionService`
- Added fallback to environment variables (STRAPI_BASE_URL, STRAPI_TOKEN) if DataSource not found
- WhatsAppFlow entity updated with optional dataSourceId column

---

### 8. MediaModule & UsersModule

**MediaModule**: Media file uploads to WhatsApp API (`MediaService.uploadMedia()`)

**UsersModule**
**Path**: `/backend/src/modules/users/`

**Entity**: User

**Service**:
- `UsersService`: Enhanced CRUD with security and validation
  - `findAll()`: Get all users ordered by creation date (DESC)
  - `findOne(id)`: Get user by ID (throws NotFoundException)
  - `findByPhoneNumber(phoneNumber)`: Lookup by phone
  - `findByEmail(email)`: Lookup by email
  - `create(userData)`: Create user with uniqueness checks (phone + email)
  - `update(id, updateData)`: Update user with uniqueness validation
  - `delete(id, currentUserId)`: Delete user with self-deletion prevention

**Controller**:
- `UsersController`: 6 endpoints (all with Swagger documentation)
  - `GET /api/users` - Get all users
  - `GET /api/users/:id` - Get user by ID
  - `POST /api/users` - Create new user
  - `PUT /api/users/:id` - Full update (all fields)
  - `PATCH /api/users/:id` - Partial update (selected fields)
  - `DELETE /api/users/:id` - Delete user (with self-deletion check)

**DTOs**:
- `CreateUserDto`: phoneNumber (E.164, required), name (required), avatar (optional)
- `UpdateUserDto`: All fields optional (phoneNumber, name, email, avatar)
  - Email validation: `@IsEmail()` with format check
  - Phone validation: E.164 format regex
- `UserResponseDto`: API response format

**Security Features**:
1. **Self-Deletion Prevention** (403 Forbidden)
   - Backend: `if (id === currentUserId) throw ForbiddenException()`
   - Uses `@CurrentUser()` decorator to get JWT user info
2. **Email Uniqueness Validation**
   - Checked on create and update operations
   - Returns 409 Conflict if duplicate found
3. **Phone Number Uniqueness**
   - Enforced at database level (unique constraint)
   - Service layer validation with 409 Conflict response

**Error Responses**:
- 400: Invalid input (validation errors)
- 403: Self-deletion attempt
- 404: User not found
- 409: Duplicate phone number or email

**File Locations**:
- Controller: `users.controller.ts`
- Service: `users.service.ts`
- DTOs: `dto/create-user.dto.ts`, `dto/update-user.dto.ts`, `dto/user-response.dto.ts`

---

### 9. AuthModule
**Path**: `/backend/src/modules/auth/`

**Entities**: User (extended with auth fields)

**Services**:
- `AuthService`: Authentication logic
  - `validateUser(email, password)`: User credential validation
  - `login(LoginDto)`: JWT token generation & last login update
  - `getProfile(userId)`: Get user profile
  - `hashPassword(password)`: bcrypt hash generation (10 rounds)

- `JwtStrategy`: Passport JWT strategy
  - `validate(JwtPayload)`: Token validation & user lookup
  - Extract from: `Authorization: Bearer <token>`
  - Secret: `process.env.JWT_SECRET`
  - Expiration: 7 days

**Controllers**:
- `AuthController`: 2 endpoints
  - `POST /api/auth/login` - Login with email/password
  - `GET /api/auth/me` - Get current user profile (protected)

**Guards & Decorators**:
- `JwtAuthGuard`: Global guard for all endpoints (APP_GUARD)
- `@Public()`: Skip authentication for specific endpoints
- `@CurrentUser()`: Extract user from request

**DTOs**:
- `LoginDto`: { email, password }
- `AuthResponseDto`: { accessToken, expiresIn, user }

**Key Features**:
- bcrypt password hashing (10 rounds)
- JWT token generation (7 day expiry)
- Global authentication (all endpoints protected by default)
- Public endpoints: `/api/auth/login`, `/api/webhooks/*`, `/health/*`
- Role field in JWT payload (admin/user)
- Last login timestamp tracking

**File Locations**:
- Module: `auth.module.ts`
- Service: `auth.service.ts`
- Controller: `auth.controller.ts`
- Strategy: `strategies/jwt.strategy.ts`
- Guard: `guards/jwt-auth.guard.ts`
- Decorators: `decorators/public.decorator.ts`, `decorators/current-user.decorator.ts`

---

## Middleware & Guards

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

**JwtAuthGuard (APP_GUARD)**:
- Applied to ALL routes automatically
- Uses Passport JWT strategy
- Validates Bearer token from Authorization header
- Attaches user to `request.user`

**Public Endpoints (bypass auth)**:
- `@Public()` decorator applied to:
  - `POST /api/auth/login`
  - `GET/POST /api/webhooks/whatsapp`
  - `POST /api/webhooks/flow-endpoint`
  - `GET /health/*`
  - `POST /chatbot-webhook`

---

## Routing

```
/api
├── /auth                2 endpoints (login, me) - JWT authentication
├── /chatbots            15 endpoints (CRUD, stats, toggle, restore, stop, test-rest-api, export, import)
│   ├── GET /:id/export     Export chatbot as JSON with embedded flows
│   └── POST /import        Import chatbot from JSON file (multipart/form-data)
├── /flows               8 endpoints (CRUD, sync, publish, preview)
├── /conversations       4 endpoints (list, get, messages, send)
├── /users               4 endpoints
├── /media               1 endpoint (upload)
├── /webhooks
│   ├── /whatsapp       GET (verify), POST (receive) [public]
│   └── /flow-endpoint  POST (encrypted) [public]
└── /whatsapp-config    3 endpoints
```

**Note**: All endpoints require JWT authentication except those marked [public].

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

1. **9 Feature Modules**: Clear separation of concerns (including AuthModule)
2. **8 Entities**: TypeORM with UUID primary keys, JSONB columns
3. **JWT Authentication**: Global guard with @Public() bypass decorator
4. **Circular Dependencies**: Resolved with forwardRef()
5. **Real-time**: Socket.IO with JWT-authenticated connections
6. **Encryption**: RSA + AES for Flow data exchange
7. **Message Persistence**: All bot messages saved with WhatsApp IDs
8. **Dynamic Lists/Buttons**: Data-driven interactive messages with pagination
9. **REST API Integration**: Variable interpolation, nested paths, math expressions
10. **Session Tracking**: Enhanced message metadata for bot detection

---

**See Also**:
- [Database Design](04-database-design.md) - Entity schemas & relationships
- [Real-time System](05-real-time-system.md) - Socket.IO events
- [WhatsApp Integration](06-whatsapp-integration.md) - API details
- [Module Relationships](08-module-relationships.md) - Detailed dependency graph
