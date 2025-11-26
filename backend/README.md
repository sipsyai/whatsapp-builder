# WhatsApp Builder - Backend

Backend service for WhatsApp Builder platform, built with NestJS, TypeORM, and PostgreSQL.

## Description

This backend provides a comprehensive API for managing WhatsApp chatbots, handling real-time conversations via Socket.IO, processing WhatsApp webhooks, and executing chatbot logic based on visual flow designs.

## Features

- **ChatBot Management**: Create, update, and manage chatbot flows with visual node-edge structures
- **Real-time Communication**: Socket.IO gateway for live message sync and typing indicators
- **WhatsApp Integration**: Full WhatsApp Business API integration with webhook processing
  - Interactive messages (buttons, lists)
  - Dynamic list and button generation
  - WhatsApp Flows integration
  - Media upload support
- **Conversation Management**: Track conversations, messages, and 24-hour messaging windows
  - Session tracking and monitoring
  - Conversation context management
  - Message metadata and history
- **Chatbot Execution**: State-based execution engine with variable storage and conditional logic
  - REST API node support
  - Dynamic content generation
  - Variable substitution
  - Conditional branching
- **Database Migrations**: TypeORM migrations for schema management
- **User Management**: Automatic user registration from WhatsApp contacts
- **API Documentation**: Comprehensive OpenAPI/Swagger documentation

## Technology Stack

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.7.x
- **Database**: PostgreSQL 14+
- **ORM**: TypeORM 0.3.x
- **Real-time**: Socket.IO 4.8.x
- **HTTP Client**: Axios 1.13.x

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: 18.x or higher
- **PostgreSQL**: 14.x or higher
- **npm**: 9.x or higher
- **WhatsApp Business API**: Access token and phone number ID
- **ngrok** (for development): For webhook tunnel

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=whatsapp_builder

# Application
PORT=3000
NODE_ENV=development

# WhatsApp Business API
WHATSAPP_API_TOKEN=your_whatsapp_api_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_API_VERSION=v21.0
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Optional: Logging
LOG_LEVEL=debug
```

See `.env.example` for a complete template.

## Installation

```bash
# Install dependencies
npm install
```

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Using psql
psql -U postgres
CREATE DATABASE whatsapp_builder;
```

### 2. Run Migrations

```bash
# Run all pending migrations
npm run migration:run

# Revert last migration (if needed)
npm run migration:revert

# Generate new migration
npm run migration:generate -- src/migrations/MigrationName
```

### Available Migrations

1. `CreateWhatsAppConfigTable` - WhatsApp Business API configuration storage
2. `AddWindowTrackingToConversation` - 24-hour messaging window tracking
3. `CreateConversationContextTable` - Chatbot execution state and variables
4. `CreateWhatsAppFlowsTable` - WhatsApp Flows entity and relationships
5. `AddExpiresAtToConversationContext` - Conversation context expiration tracking
6. `AddSessionHistoryFields` - Session history and metadata fields
7. `AddCascadeDeleteToMessageSender` - Cascade delete for message sender relationships
8. `RenameFlowsToChatBots` - Terminology migration from flows to chatbots

### Advanced Migration Commands

```bash
# Create empty migration (for custom SQL)
npm run migration:create -- src/migrations/CustomMigrationName

# Show migration status (requires manual typeorm CLI)
npx typeorm migration:show -d ormconfig.ts

# Drop entire schema (WARNING: destroys all data)
npx typeorm schema:drop -d ormconfig.ts
```

## Running the Application

### Development Mode

```bash
# Standard development mode
npm run start:dev

# Debug mode with inspector
npm run start:debug

# Production mode
npm run start:prod
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

### Build

```bash
# Build the application
npm run build
```

## Webhook Development

For local development, WhatsApp requires an HTTPS webhook URL. Use ngrok to create a tunnel:

```bash
# Terminal 1: Start the backend
npm run start:dev

# Terminal 2: Start ngrok tunnel
ngrok http 3000

# Copy the HTTPS URL and configure it in WhatsApp Business API dashboard
# Webhook URL: https://your-ngrok-url.ngrok.io/api/webhooks/whatsapp
# Verify Token: Use the value from WHATSAPP_VERIFY_TOKEN in .env
```

Alternatively, use the monorepo script:

```bash
# From project root
npm run webhook:start
```

## API Documentation

### Swagger UI (Recommended)

This project includes comprehensive OpenAPI/Swagger documentation for all API endpoints.

**Access Interactive Documentation:**
```
http://localhost:3000/api/docs
```

**Features:**
- Interactive testing - Test all endpoints directly from the browser
- Auto-generated - Documentation generated from TypeScript decorators
- Request/Response schemas - View all DTO structures and validation rules
- Example values - See example payloads for all endpoints
- Organized by tags - Endpoints grouped by feature (Chatbots, Flows, WhatsApp Config, etc.)

**Swagger Tags:**
| Tag | Description | Endpoints |
|-----|-------------|-----------|
| Chatbots | Chatbot management and configuration | 13 endpoints |
| Flows | WhatsApp Flow management and Meta sync | 8 endpoints |
| WhatsApp Config | WhatsApp Business API configuration | 4 endpoints |
| Flow Endpoint | WhatsApp Flow data exchange endpoint | 1 endpoint |
| Chatbot Webhook | Chatbot webhook for encrypted data exchange | 3 endpoints |

**OpenAPI Specification:**
```
http://localhost:3000/api/docs-json
```
This can be imported into tools like Postman, Insomnia, or used for API client generation.

---

### Base URL

```
http://localhost:3000/api
```

### Main Endpoints

#### ChatBots
- `GET /chatbots` - List all chatbots
- `POST /chatbots` - Create new chatbot
- `GET /chatbots/:id` - Get chatbot by ID
- `GET /chatbots/:id/stats` - Get chatbot statistics
- `PUT /chatbots/:id` - Update chatbot (full)
- `PATCH /chatbots/:id` - Update chatbot (partial)
- `DELETE /chatbots/:id` - Delete chatbot (hard delete)
- `DELETE /chatbots/:id/soft` - Soft delete chatbot
- `PATCH /chatbots/:id/status` - Update status
- `PATCH /chatbots/:id/toggle-active` - Toggle active state
- `PATCH /chatbots/:id/restore` - Restore soft-deleted chatbot
- `GET /chatbots/:id/sessions` - Get active sessions
- `POST /chatbots/:id/sessions/:sessionId/stop` - Stop active session

#### Conversations
- `GET /conversations` - List conversations
- `GET /conversations/:id` - Get conversation details
- `GET /conversations/:id/messages` - Get conversation messages
- `POST /conversations/:id/messages` - Send message

#### Users
- `GET /users` - List users
- `POST /users` - Create user
- `GET /users/:id` - Get user details
- `PUT /users/:id` - Update user

#### Webhooks
- `GET /webhooks/whatsapp` - Verify webhook (WhatsApp)
- `POST /webhooks/whatsapp` - Receive webhook events

#### WhatsApp Config
- `GET /whatsapp-config` - Get active configuration
- `POST /whatsapp-config` - Create configuration
- `PUT /whatsapp-config/:id` - Update configuration

#### Media
- `POST /media/upload` - Upload media file

#### Flows (WhatsApp Flows)
- `GET /flows` - List all WhatsApp Flows
- `POST /flows` - Create new flow
- `GET /flows/:id` - Get flow by ID
- `PUT /flows/:id` - Update flow
- `DELETE /flows/:id` - Delete flow
- `POST /flows/sync` - Sync flows from Meta API
- `POST /flows/:id/publish` - Publish flow to WhatsApp
- `POST /flows/:id/unpublish` - Unpublish flow

### WebSocket Events

Connect to `http://localhost:3000/messages` namespace.

**Server → Client Events:**
- `message:received` - New message received
- `message:sent` - Message sent successfully
- `message:delivered` - Message delivered to WhatsApp
- `message:read` - Message read by user
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `conversation:updated` - Conversation metadata updated

**Client → Server Events:**
- `typing:start` - Notify typing started
- `typing:stop` - Notify typing stopped

## Testing

```bash
# Unit tests
npm run test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Test coverage report
npm run test:cov

# End-to-end tests
npm run test:e2e

# Debug tests
npm run test:debug
```

## Code Quality

```bash
# Format code with Prettier
npm run format

# Lint and fix with ESLint
npm run lint
```

## Development Scripts

### WhatsApp Testing

```bash
# Test WhatsApp Flow publishing
npm run flow:publish

# Send test Flow message
npm run flow:send-test

# Send test text message
npm run test:send-text

# Test media upload
npm run test:media-upload
```

### Webhook Management

```bash
# Start webhook tunnel and backend
npm run webhook:start

# Stop webhook tunnel
npm run webhook:stop

# Get current webhook URL
npm run webhook:url
```

## Module Structure

```
backend/src/
├── app.module.ts           # Root module
├── main.ts                 # Application entry point
├── config/                 # Configuration modules
├── database/               # Database module
├── entities/               # TypeORM entities (8 entities)
│   ├── chatbot.entity.ts
│   ├── conversation.entity.ts
│   ├── conversation-context.entity.ts
│   ├── message.entity.ts
│   ├── user.entity.ts
│   ├── whatsapp-config.entity.ts
│   └── whatsapp-flow.entity.ts
├── modules/                # 9 feature modules
│   ├── chatbots/          # ChatBot management & execution engine
│   │   ├── controllers/
│   │   │   ├── chatbots.controller.ts
│   │   │   └── chatbot-webhook.controller.ts
│   │   ├── services/
│   │   │   ├── chatbots.service.ts
│   │   │   ├── chatbot-execution.service.ts
│   │   │   ├── rest-api-executor.service.ts
│   │   │   ├── session-history.service.ts
│   │   │   ├── appointment.service.ts
│   │   │   └── mock-calendar.service.ts
│   │   ├── dto/
│   │   └── chatbots.module.ts
│   ├── conversations/     # Conversation handling
│   ├── messages/          # Message management
│   ├── users/             # User management
│   ├── webhooks/          # Webhook processing
│   │   ├── controllers/
│   │   │   ├── webhooks.controller.ts
│   │   │   └── flow-endpoint.controller.ts
│   │   ├── services/
│   │   │   ├── webhook-processor.service.ts
│   │   │   ├── webhook-parser.service.ts
│   │   │   ├── webhook-signature.service.ts
│   │   │   └── flow-endpoint.service.ts
│   │   └── webhooks.module.ts
│   ├── websocket/         # Socket.IO gateway
│   │   ├── messages.gateway.ts
│   │   ├── filters/ws-exception.filter.ts
│   │   └── websocket.module.ts
│   ├── whatsapp/          # WhatsApp API integration
│   │   ├── services/
│   │   │   ├── whatsapp-api.service.ts
│   │   │   ├── whatsapp-config.service.ts
│   │   │   ├── whatsapp-message.service.ts
│   │   │   ├── whatsapp-flow.service.ts
│   │   │   ├── flow-encryption.service.ts
│   │   │   └── message-types/
│   │   │       ├── text-message.service.ts
│   │   │       └── interactive-message.service.ts
│   │   └── whatsapp.module.ts
│   ├── flows/             # WhatsApp Flows lifecycle
│   │   ├── flows.controller.ts
│   │   ├── flows.service.ts
│   │   └── flows.module.ts
│   └── media/             # Media upload
├── migrations/            # TypeORM migrations (6 migrations)
└── scripts/               # Development & testing scripts
    ├── whatsapp/
    └── media/
```

## Key Services

### ChatBotExecutionService
**Location**: `modules/chatbots/services/chatbot-execution.service.ts`

Executes chatbot logic based on node-edge flow structures:
- **Node Types**: Processes START, MESSAGE, QUESTION, CONDITION, WHATSAPP_FLOW, and REST_API nodes
- **State Management**: Manages conversation state via ConversationContext entity
- **Variable System**: Supports variable substitution with `{{variableName}}` syntax
- **Conditional Logic**: Multi-condition support with AND/OR operators
- **Message Persistence**: Saves all bot messages to database with WhatsApp message IDs
- **Dynamic Content**: REST API integration for data-driven messages
- **WhatsApp Flows**: Complex interactive experiences

**Execution Flow**:
```
startChatBot() → processStartNode() → processMessageNode() → processQuestionNode() → WAIT
                                                                        ↓
User responds → processUserResponse() → save to variables → executeCurrentNode() [resume]
```

### RestApiExecutorService
**Location**: `modules/chatbots/services/rest-api-executor.service.ts`

REST API execution with advanced variable interpolation:
- **HTTP Methods**: GET, POST, PUT, PATCH, DELETE
- **Variable Interpolation**: Replaces `{{variableName}}` in URL, headers, and body
- **Nested Paths**: Supports `data.user.name`, `items[0].title`
- **Math Expressions**: Evaluates `{{page + 1}}`, `{{count * 2}}`
- **Error Handling**: Captures errors in apiErrorVariable
- **Response Extraction**: Extracts data from specific JSON paths

### WebhookProcessorService
**Location**: `modules/webhooks/services/webhook-processor.service.ts`

Processes incoming WhatsApp webhook events:
- **Signature Verification**: HMAC SHA256 validation
- **Message Parsing**: Text, interactive buttons/lists, media, reactions, Flow completions
- **User Management**: Find or create user from WhatsApp contact
- **Conversation Tracking**: Find or create conversation
- **Message Persistence**: Save incoming messages to database
- **Real-time Events**: Emit Socket.IO events for live updates
- **Chatbot Trigger**: Execute chatbot logic based on message content
- **Flow Response Processing**: UUID-aware flow_token parsing (`{contextId}-{nodeId}`)

**Processing Pipeline**:
```
Webhook → Verify Signature → Parse → Find/Create User → Find/Create Conversation
  → Save Message → Emit Socket.IO → Execute ChatBot → Send Response → Emit Response Event
```

### WhatsAppMessageService
**Location**: `modules/whatsapp/services/whatsapp-message.service.ts`

Sends messages to WhatsApp Business API:
- **Text Messages**: Plain text with emoji support
- **Interactive Buttons**: Up to 3 buttons (20 char limit)
- **Interactive Lists**: Up to 10 rows per section (24/72 char limits)
- **Dynamic Lists/Buttons**: Data-driven generation from REST API responses
- **Media Messages**: Images, videos, documents, audio
- **Reactions**: Message reactions
- **WhatsApp Flows**: Complex interactive flows

**Related Services**:
- `TextMessageService`: Text message formatting
- `InteractiveMessageService`: Button/list generation with character validation

### WhatsAppFlowService
**Location**: `modules/whatsapp/services/whatsapp-flow.service.ts`

Manages WhatsApp Flow lifecycle:
- **Create**: Create flow in WhatsApp Business Manager
- **Update**: Modify flow JSON (resets to DRAFT status)
- **Publish**: Publish flow to production
- **Deprecate**: Mark flow as deprecated
- **Delete**: Smart deletion (deprecate if PUBLISHED → delete from WhatsApp → delete local)
- **Preview**: Generate preview URL for testing
- **Status Tracking**: DRAFT → PUBLISHED → DEPRECATED → DELETED

### FlowEncryptionService
**Location**: `modules/whatsapp/services/flow-encryption.service.ts`

Handles Flow webhook encryption/decryption:
- **Decryption**: RSA + AES-128-GCM decryption of incoming Flow data
- **Encryption**: Encrypt response data for Flow endpoint
- **Signature Verification**: Verify request signatures from WhatsApp
- **Key Management**: Public/private key pair handling

### SessionHistoryService
**Location**: `modules/chatbots/services/session-history.service.ts`

Tracks chatbot execution sessions:
- **Active Sessions**: Monitor running chatbot sessions
- **Session Details**: View node execution history
- **Message Metadata**: Enhanced message data with bot detection flags
- **Session Termination**: Stop active sessions

### MessagesGateway
**Location**: `modules/websocket/messages.gateway.ts`

Real-time WebSocket communication via Socket.IO:
- **Namespace**: `/messages`
- **User Tracking**: Map<userId, Set<socketId>> for multi-device support
- **Room Management**: Conversation-based rooms and session rooms
- **Connection Lifecycle**: Online/offline status broadcasting

**Server → Client Events**:
- `message:received`, `message:status`
- `user:online`, `user:offline`
- `session:message-sent`, `session:node-executed`, `session:status-changed`, `session:completed`

**Client → Server Events**:
- `conversation:join`, `conversation:leave`
- `typing:start`, `typing:stop`
- `session:join`, `session:leave`

## Architecture Highlights

### Modular Design (NestJS Best Practices)
- **9 Feature Modules**: Each module is self-contained with clear boundaries
- **Dependency Injection**: Constructor-based DI throughout the application
- **forwardRef() Pattern**: Circular dependencies resolved properly (ConversationsModule ↔ WebSocketModule)
- **Shared Entities**: TypeORM entities shared across modules via TypeOrmModule.forFeature()
- **Module Exports**: Services exported from modules for cross-module usage
- **Single Responsibility**: Each service has a single, well-defined purpose

### Database-Driven
- **TypeORM**: Type-safe database operations with repository pattern
- **Migration-based**: Schema management with versioned migrations
- **UUID Primary Keys**: All entities use UUID for better scalability
- **JSONB Columns**: Flexible data storage (nodes/edges, variables)
- **Entity Relationships**: Proper foreign keys and cascade operations
- **Connection Pooling**: Optimized database connection management

### Real-time Communication
- **Socket.IO Gateway**: Dedicated WebSocketModule with namespace isolation
- **Room-based Isolation**: Conversation and session rooms for targeted events
- **User Tracking**: Multi-device support with Map<userId, Set<socketId>>
- **Exception Filter**: Custom WebSocket exception filter for error handling
- **Optimistic UI**: Support for optimistic updates with status events

### WhatsApp Integration
- **Signature Verification**: HMAC SHA256 webhook signature validation
- **Message Types**: Support for all WhatsApp message types (text, interactive, media, flows)
- **24-hour Window**: Automatic tracking of messaging window
- **Flow Encryption**: RSA + AES-128-GCM encryption for Flow webhooks
- **Dynamic Content**: REST API integration for data-driven messages
- **Error Handling**: Comprehensive error handling and retry logic

### Dependency Injection Pattern
```typescript
// Example of proper NestJS DI pattern
@Injectable()
export class ChatBotExecutionService {
  constructor(
    @InjectRepository(ChatBot) private chatBotRepository: Repository<ChatBot>,
    @InjectRepository(ConversationContext) private contextRepository: Repository<ConversationContext>,
    private whatsappMessageService: WhatsAppMessageService,
    private restApiExecutorService: RestApiExecutorService,
    private readonly logger: Logger,
  ) {}
}
```

### Module Dependency Graph
```
AppModule
  ├─→ ConfigModule (global)
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

## Troubleshooting

### Database Connection Issues

```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U postgres -h localhost -d whatsapp_builder

# Check environment variables
cat .env | grep DB_
```

### Migration Errors

```bash
# Check migration status (using TypeORM CLI directly)
npx typeorm migration:show -d ormconfig.ts

# Revert last migration
npm run migration:revert

# Drop database and recreate (⚠️ destroys data)
npx typeorm schema:drop -d ormconfig.ts
npm run migration:run
```

### WhatsApp Webhook Issues

```bash
# Verify ngrok is running
curl http://localhost:4040/api/tunnels

# Test webhook endpoint
curl http://localhost:3000/api/webhooks/whatsapp?hub.verify_token=YOUR_TOKEN&hub.challenge=test

# Check webhook logs
# Logs appear in console with LOG_LEVEL=debug
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port in .env
PORT=3001
```

## Development Guidelines

### Creating a New Module (NestJS Best Practices)

```bash
# 1. Generate module, controller, and service
nest g module modules/my-feature
nest g controller modules/my-feature --no-spec  # Add --no-spec if you don't want test files
nest g service modules/my-feature --no-spec

# 2. Create DTOs directory
mkdir src/modules/my-feature/dto

# 3. Register TypeORM entities in the module
# Edit my-feature.module.ts:
```

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MyFeatureController } from './my-feature.controller';
import { MyFeatureService } from './my-feature.service';
import { MyFeatureEntity } from '../../entities/my-feature.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MyFeatureEntity]), // Register entity repository
  ],
  controllers: [MyFeatureController],
  providers: [MyFeatureService],
  exports: [MyFeatureService], // Export if other modules need this service
})
export class MyFeatureModule {}
```

**Best Practices:**
- Use constructor-based dependency injection
- Keep services focused on single responsibility
- Use DTOs for all request/response data
- Implement proper error handling with NestJS exceptions
- Add Swagger decorators for API documentation

### Creating DTOs with Validation

```typescript
// create-my-feature.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMyFeatureDto {
  @ApiProperty({ description: 'Feature name', example: 'My Feature' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Feature description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Priority level', minimum: 1, maximum: 10 })
  @IsNumber()
  @Min(1)
  @Max(10)
  priority: number;
}
```

**DTO Best Practices:**
- Use class-validator decorators for validation
- Add Swagger decorators (@ApiProperty, @ApiPropertyOptional)
- Create separate DTOs for create/update operations
- Use PartialType for update DTOs: `export class UpdateMyFeatureDto extends PartialType(CreateMyFeatureDto) {}`

### Creating a New Migration

```bash
# 1. Create or modify entities in src/entities/
# 2. Generate migration from entity changes
npm run migration:generate -- src/migrations/DescribeYourChanges

# 3. Review generated migration file
# 4. Run migration
npm run migration:run

# If migration fails, revert it
npm run migration:revert
```

**Migration Best Practices:**
- Use descriptive names (e.g., AddUserEmailVerification)
- Review generated SQL before running
- Test migrations on development database first
- Never modify existing migrations after deployment
- Use transactions for complex migrations

### Adding a New API Endpoint

**1. Create DTO** (`modules/[feature]/dto/`)
```typescript
export class CreateItemDto {
  @ApiProperty()
  @IsString()
  name: string;
}
```

**2. Add Controller Method**
```typescript
import { Controller, Post, Body, Get, Param, Patch, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('my-feature')
@Controller('my-feature')
export class MyFeatureController {
  constructor(private readonly myFeatureService: MyFeatureService) {}

  @Post()
  @ApiOperation({ summary: 'Create new item' })
  @ApiResponse({ status: 201, description: 'Item created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() createDto: CreateItemDto) {
    return this.myFeatureService.create(createDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get item by ID' })
  @ApiResponse({ status: 200, description: 'Item found' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.myFeatureService.findOne(id);
  }
}
```

**3. Implement Service Logic**
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MyFeatureService {
  constructor(
    @InjectRepository(MyFeatureEntity)
    private readonly repository: Repository<MyFeatureEntity>,
  ) {}

  async create(createDto: CreateItemDto): Promise<MyFeatureEntity> {
    const entity = this.repository.create(createDto);
    return this.repository.save(entity);
  }

  async findOne(id: string): Promise<MyFeatureEntity> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return entity;
  }
}
```

**4. Update Documentation**
- Add endpoint to API Documentation section in README
- Update Swagger tags if new feature
- Document any new environment variables

### Code Style Guidelines

**Follow NestJS Conventions:**
- Use decorators for configuration (@Injectable, @Controller, @Get, etc.)
- Implement proper error handling with HTTP exceptions
- Use ValidationPipe globally for DTO validation
- Leverage TypeScript types and interfaces
- Use async/await for asynchronous operations

**File Naming:**
- Controllers: `feature-name.controller.ts`
- Services: `feature-name.service.ts`
- DTOs: `create-feature.dto.ts`, `update-feature.dto.ts`
- Entities: `feature-name.entity.ts`
- Modules: `feature-name.module.ts`

### Testing Guidelines

```bash
# Unit test example
describe('MyFeatureService', () => {
  let service: MyFeatureService;
  let repository: Repository<MyFeatureEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyFeatureService,
        {
          provide: getRepositoryToken(MyFeatureEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MyFeatureService>(MyFeatureService);
    repository = module.get<Repository<MyFeatureEntity>>(getRepositoryToken(MyFeatureEntity));
  });

  it('should create an item', async () => {
    const dto = { name: 'Test' };
    const entity = { id: 'uuid', ...dto };

    jest.spyOn(repository, 'create').mockReturnValue(entity as any);
    jest.spyOn(repository, 'save').mockResolvedValue(entity as any);

    const result = await service.create(dto);
    expect(result).toEqual(entity);
  });
});
```

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Socket.IO Documentation](https://socket.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Project Documentation

For comprehensive documentation, see:

- [Project Overview](../.claude/skills/project-architect/reference/01-project-overview.md)
- [Backend Architecture](../.claude/skills/project-architect/reference/02-backend-architecture.md)
- [Database Design](../.claude/skills/project-architect/reference/04-database-design.md)
- [Development Guide](../.claude/skills/project-architect/reference/09-development-guide.md)

## License

This project is proprietary software. All rights reserved.

## Support

For issues, questions, or contributions, please contact the development team.
