# Backend Architecture - WhatsApp Builder

## Table of Contents
- [Overview](#overview)
- [Application Structure](#application-structure)
- [Module Deep Dive](#module-deep-dive)
- [Controllers & Routing](#controllers--routing)
- [Services & Business Logic](#services--business-logic)
- [DTOs & Validation](#dtos--validation)
- [Dependency Injection](#dependency-injection)
- [Error Handling](#error-handling)

---

## Overview

The backend is built with **NestJS 11.x**, following a modular architecture pattern with clear separation of concerns. The application uses TypeScript for type safety and leverages NestJS's dependency injection system for loose coupling and testability.

### Key Architectural Principles
- **Modular Design**: Each feature is encapsulated in its own module
- **Single Responsibility**: Each service has one clear purpose
- **Dependency Injection**: Loose coupling through IoC container
- **Type Safety**: Full TypeScript coverage with strict mode
- **DTO Validation**: All inputs validated with class-validator
- **Repository Pattern**: Database access abstracted through TypeORM repositories

### File Structure
```
backend/src/
├── app.module.ts                 # Root module
├── main.ts                       # Application bootstrap
├── config/                       # Configuration modules
│   ├── config.module.ts
│   └── database.config.ts
├── database/                     # Database setup
│   └── database.module.ts
├── entities/                     # TypeORM entities
│   ├── chatbot.entity.ts
│   ├── conversation.entity.ts
│   ├── conversation-context.entity.ts
│   ├── message.entity.ts
│   ├── user.entity.ts
│   └── whatsapp-config.entity.ts
├── modules/                      # Feature modules
│   ├── chatbots/
│   ├── conversations/
│   ├── media/
│   ├── messages/
│   ├── users/
│   ├── webhooks/
│   ├── websocket/
│   └── whatsapp/
├── migrations/                   # TypeORM migrations
└── scripts/                      # Utility scripts
```

---

## Application Structure

### Application Bootstrap
**File**: `/home/ali/whatsapp-builder/backend/src/main.ts`

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body for webhook signature verification
  });

  app.enableCors(); // Enable CORS for frontend communication

  // Configure JSON body parser with raw body support
  app.use(json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf; // Store raw body for webhook signature verification
    },
  }));

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
```

**Key Features**:
- **Raw Body Support**: Required for WhatsApp webhook signature verification
- **CORS Enabled**: Allows frontend to make cross-origin requests
- **Custom Body Parser**: Captures raw request body before JSON parsing

### Root Module
**File**: `/home/ali/whatsapp-builder/backend/src/app.module.ts`

```typescript
@Module({
  imports: [
    ConfigModule,          // Environment configuration
    DatabaseModule,        // TypeORM connection
    WhatsAppModule,        // WhatsApp API integration
    ChatBotsModule,        // Chatbot management & execution
    MediaModule,           // Media upload/retrieval
    UsersModule,           // User management
    ConversationsModule,   // Conversation management
    MessagesModule,        // Message CRUD
    WebSocketModule,       // Socket.IO gateway
    WebhooksModule,        // Webhook processing
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

**Module Order**: Modules are imported in dependency order to prevent circular dependencies.

---

## Module Deep Dive

### 1. ChatBotsModule
**File**: `/home/ali/whatsapp-builder/backend/src/modules/chatbots/chatbots.module.ts`

#### Purpose
Manages chatbot flows (formerly called "flows") and executes conversation logic based on node graphs.

#### Module Configuration
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([ChatBot, ConversationContext, Conversation, User]),
    WhatsAppModule,  // For sending messages
  ],
  controllers: [
    ChatBotsController,        // CRUD operations
    ChatBotWebhookController,  // Webhook endpoints
  ],
  providers: [
    ChatBotsService,           // Main CRUD service
    ChatBotExecutionService,   // Flow execution engine
    AppointmentService,        // Domain-specific logic
    MockCalendarService,       // Mock calendar integration
  ],
  exports: [ChatBotExecutionService],
})
```

#### Key Services

**ChatBotsService** (`chatbots.service.ts`)
- `create(dto)`: Create new chatbot with nodes/edges
- `findAll(query)`: List chatbots with filtering (status, active)
- `findOne(id)`: Get chatbot by ID
- `update(id, dto)`: Update chatbot nodes/edges/metadata
- `remove(id)`: Soft delete (set inactive)
- `updateStatus(id, status)`: Change chatbot status (active/archived/draft)

**ChatBotExecutionService** (`services/chatbot-execution.service.ts`)
- **Core Execution Engine**: Interprets chatbot nodes and edges
- **State Management**: Maintains conversation context with variables
- **Node Handlers**:
  - `processStartNode()`: Entry point, moves to next node
  - `processMessageNode()`: Sends text message, moves to next
  - `processQuestionNode()`: Sends interactive message, **waits** for response
  - `processConditionNode()`: Evaluates condition, branches accordingly
- **Flow Navigation**: `findNextNode(chatbot, nodeId, sourceHandle)` - traverses edges
- **Variable System**: `replaceVariables(text, variables)` - replaces `{{varName}}` syntax

**Execution Flow Example**:
```typescript
// User sends first message
await startChatBot(conversationId, phoneNumber);
  → Find START node
  → Create ConversationContext
  → executeCurrentNode() [recursive]
    → processStartNode() → move to next
    → processMessageNode() → send message → move to next
    → processQuestionNode() → send interactive message → WAIT

// User responds
await processUserResponse(conversationId, userMessage);
  → Load context
  → Save response to variables
  → Find next node via edge (based on button/list selection)
  → executeCurrentNode() [resume recursion]
```

#### Controllers

**ChatBotsController** (`chatbots.controller.ts`)
```typescript
@Controller('api/chatbots')
@UseInterceptors(ClassSerializerInterceptor)
export class ChatBotsController {
  @Post()                    // Create chatbot
  @Get()                     // List chatbots with query filters
  @Get(':id')                // Get chatbot by ID
  @Put(':id')                // Update chatbot
  @Delete(':id')             // Delete (soft) chatbot
  @Patch(':id/status')       // Update status
}
```

**ChatBotWebhookController** (`chatbot-webhook.controller.ts`)
- Legacy controller for WhatsApp Flow webhook endpoints
- Handles Flow data exchange protocol
- Response encryption/decryption

#### DTOs
- `CreateChatBotDto`: name, description, nodes, edges, metadata
- `UpdateChatBotDto`: Partial update
- `QueryChatBotsDto`: status?, isActive?
- `ChatBotNodeDto`: id, type, position, data
- `ChatBotEdgeDto`: id, source, target, sourceHandle, targetHandle
- `NodeDataDto`: type, content, variable, questionType, buttons, etc.

---

### 2. WhatsAppModule
**File**: `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/whatsapp.module.ts`

#### Purpose
Encapsulates all WhatsApp Business API interactions, providing a clean interface for sending messages.

#### Module Configuration
```typescript
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([WhatsAppConfig]),
  ],
  providers: [
    WhatsAppApiService,            // Low-level HTTP client
    WhatsAppConfigService,         // Config management
    WhatsAppFlowService,           // Flow message handling
    WhatsAppMessageService,        // Message orchestrator
    TextMessageService,            // Text messages
    InteractiveMessageService,     // Buttons, lists
    FlowMessageService,            // Flow messages
  ],
  exports: [
    WhatsAppApiService,
    WhatsAppMessageService,
    WhatsAppConfigService,
    TextMessageService,
    InteractiveMessageService,
  ],
})
```

#### Key Services

**WhatsAppApiService** (`services/whatsapp-api.service.ts`)
- **HTTP Client Wrapper**: Axios-based client for WhatsApp API
- `sendMessage(payload)`: POST to `/{phone_number_id}/messages`
- `uploadMedia(file)`: POST to `/{phone_number_id}/media`
- `getMediaUrl(mediaId)`: GET media URL
- **Error Handling**: Catches WhatsApp API errors, logs details

**WhatsAppConfigService** (`services/whatsapp-config.service.ts`)
- `getActiveConfig()`: Retrieve active WhatsApp configuration
- `create(dto)`: Save new configuration
- `update(id, dto)`: Update configuration
- **Database Constraint**: Only one active config allowed (partial unique index)

**TextMessageService** (`services/message-types/text-message.service.ts`)
```typescript
async sendTextMessage(dto: SendTextMessageDto): Promise<MessageResponse> {
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: dto.to,
    type: "text",
    text: {
      preview_url: dto.previewUrl || false,
      body: dto.text,
    },
  };

  return await this.whatsappApi.sendMessage(payload);
}
```

**InteractiveMessageService** (`services/message-types/interactive-message.service.ts`)
- `sendButtonMessage(dto)`: Send up to 3 reply buttons
- `sendListMessage(dto)`: Send list with sections (up to 10 rows per section)
- **Validation**: Enforces WhatsApp character limits
  - Button title: max 20 chars
  - List section title: max 24 chars
  - List row title: max 24 chars
  - List row description: max 72 chars

**WhatsAppMessageService** (`services/whatsapp-message.service.ts`)
- **Orchestrator**: Routes to appropriate message type service
- `sendTextMessage(dto)`
- `sendFlowMessage(dto)`
- Future: template messages, media messages, etc.

---

### 3. WebhooksModule
**File**: `/home/ali/whatsapp-builder/backend/src/modules/webhooks/webhooks.module.ts`

#### Purpose
Receives and processes incoming WhatsApp webhooks for messages and status updates.

#### Module Configuration
```typescript
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Message, Conversation, User]),
    ChatBotsModule,              // For chatbot execution
    forwardRef(() => WebSocketModule),  // Circular dependency resolution
  ],
  providers: [
    WebhookSignatureService,     // Signature verification
    WebhookParserService,        // Payload parsing
    WebhookProcessorService,     // Business logic
  ],
})
```

#### Key Services

**WebhookSignatureService** (`services/webhook-signature.service.ts`)
```typescript
verifySignatureOrThrow(signature: string, rawBody: Buffer): void {
  const expectedSignature = crypto
    .createHmac('sha256', this.appSecret)
    .update(rawBody)
    .digest('hex');

  if (signature !== `sha256=${expectedSignature}`) {
    throw new UnauthorizedException('Invalid webhook signature');
  }
}
```

**WebhookParserService** (`services/webhook-parser.service.ts`)
- `parseMessages(value)`: Extract messages from webhook payload
- `parseStatusUpdates(value)`: Extract status updates (sent/delivered/read)
- **Handles Multiple Types**:
  - Text messages
  - Interactive button/list replies
  - Media messages (image, video, document, audio)
  - Reactions
  - System messages

**WebhookProcessorService** (`services/webhook-processor.service.ts`)
```typescript
async processMessages(messages: ParsedMessageDto[]): Promise<void> {
  for (const msg of messages) {
    // 1. Find or create user
    const user = await this.findOrCreateUser(msg.from, msg.profile);

    // 2. Find or create conversation
    const conversation = await this.findOrCreateConversation(user);

    // 3. Save message to database
    const savedMessage = await this.saveMessage(conversation, user, msg);

    // 4. Emit real-time event
    this.gateway.emitMessageReceived({
      conversationId: conversation.id,
      messageId: savedMessage.id,
      // ... message data
    });

    // 5. Process chatbot response
    if (msg.type === 'text' || msg.type === 'interactive') {
      await this.executionService.processUserResponse(
        conversation.id,
        msg.text,
        msg.buttonId,
        msg.listRowId,
      );
    }
  }
}
```

**Processing Pipeline**:
```
Webhook Received
  → Verify Signature
  → Parse Payload
  → Find/Create User
  → Find/Create Conversation
  → Save Message
  → Emit Socket.IO Event
  → Execute Chatbot Logic
  → Send Response
  → Emit Response Event
```

#### Controller

**WebhooksController** (`webhooks.controller.ts`)
```typescript
@Controller('api/webhooks/whatsapp')
export class WebhooksController {
  // Webhook verification (Meta requires this)
  @Get()
  verifyWebhook(@Query() query: WebhookVerificationDto): string {
    // Verify hub.verify_token matches configured token
    // Return hub.challenge
  }

  // Receive webhooks
  @Post()
  async receiveWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature: string,
    @Body() payload: WebhookPayloadDto,
  ): Promise<{ success: boolean }> {
    // Always return 200 OK immediately
  }
}
```

---

### 4. ConversationsModule
**File**: `/home/ali/whatsapp-builder/backend/src/modules/conversations/conversations.module.ts`

#### Purpose
Manages conversations and provides message CRUD operations with real-time sync.

#### Module Configuration
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, User]),
    forwardRef(() => WebSocketModule),  // Circular dependency
  ],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
```

#### Key Service

**ConversationsService** (`conversations.service.ts`)
```typescript
// Conversations
async findAll(): Promise<Conversation[]> {
  return await this.conversationRepo.find({
    relations: ['participants', 'messages'],
    order: { lastMessageAt: 'DESC' },
  });
}

async findOne(id: string): Promise<Conversation> {
  return await this.conversationRepo.findOne({
    where: { id },
    relations: ['participants'],
  });
}

// Messages
async getMessages(conversationId: string, dto: GetMessagesDto) {
  const query = this.messageRepo
    .createQueryBuilder('message')
    .where('message.conversationId = :conversationId', { conversationId })
    .orderBy('message.timestamp', 'ASC')
    .skip(dto.skip || 0)
    .take(dto.take || 50);

  return await query.getMany();
}

async sendMessage(dto: SendMessageDto): Promise<Message> {
  // 1. Validate conversation exists
  // 2. Create optimistic message (status: 'sent')
  // 3. Save to database
  // 4. Emit real-time event
  // 5. Send via WhatsApp API
  // 6. Update message status on delivery

  return savedMessage;
}
```

**Real-time Integration**:
```typescript
// After saving message
this.gateway.emitMessageReceived({
  conversationId: message.conversationId,
  messageId: message.id,
  senderId: message.senderId,
  type: message.type,
  content: message.content,
  status: message.status,
  timestamp: message.timestamp,
});
```

#### Controller

**ConversationsController** (`conversations.controller.ts`)
```typescript
@Controller('api/conversations')
export class ConversationsController {
  @Get()                    // List all conversations
  @Get(':id')               // Get conversation by ID
  @Get(':id/messages')      // Get messages (paginated)
  @Post(':id/messages')     // Send message
}
```

---

### 5. WebSocketModule
**File**: `/home/ali/whatsapp-builder/backend/src/modules/websocket/websocket.module.ts`

#### Purpose
Provides real-time bidirectional communication using Socket.IO.

#### Module Configuration
```typescript
@Module({
  imports: [
    forwardRef(() => ConversationsModule),
    forwardRef(() => MessagesModule),
  ],
  providers: [MessagesGateway, WsAuthMiddleware],
  exports: [MessagesGateway],
})
```

#### Key Gateway

**MessagesGateway** (`messages.gateway.ts`)
```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/messages',  // Socket connects to: /messages
})
export class MessagesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  private readonly userSockets = new Map<string, Set<string>>();

  // Connection lifecycle
  handleConnection(client: Socket) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) {
      client.disconnect();
      return;
    }

    // Track user sockets
    this.userSockets.get(userId)!.add(client.id);

    // Notify others
    client.broadcast.emit('user:online', { userId });
  }

  handleDisconnect(client: Socket) {
    // Remove from tracking
    // Emit user:offline if no more connections
  }

  // Client → Server events
  @SubscribeMessage('conversation:join')
  handleJoinConversation(data: JoinConversationDto, client: Socket) {
    client.join(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(data: TypingIndicatorDto, client: Socket) {
    client.to(`conversation:${data.conversationId}`)
          .emit('typing:start', { ...data });
  }

  // Server → Client events (called from services)
  emitMessageReceived(data: MessageReceivedDto) {
    this.server
        .to(`conversation:${data.conversationId}`)
        .emit('message:received', data);
  }

  emitMessageStatus(data: MessageStatusDto) {
    this.server
        .to(`conversation:${data.conversationId}`)
        .emit('message:status', data);
  }
}
```

**Event Flow**:
```
Client Side                           Server Side
  |                                      |
  | ---- connect (userId) ------------> |
  | <--- user:online (broadcast) ------ |
  |                                      |
  | ---- conversation:join(id) -------> |
  | <--- conversation:joined ---------- |
  |                                      |
  |      [User sends message]           |
  | <--- message:received ------------- | (emitted from service)
  |                                      |
  | ---- typing:start ----------------> |
  | <--- typing:start (to room) ------- | (broadcast to others)
```

---

### 6. MediaModule
**File**: `/home/ali/whatsapp-builder/backend/src/modules/media/media.module.ts`

#### Purpose
Handles media file uploads to WhatsApp API.

#### Service
**MediaService** (`media.service.ts`)
```typescript
async uploadMedia(file: Express.Multer.File): Promise<UploadMediaResponseDto> {
  const formData = new FormData();
  formData.append('file', file.buffer, file.originalname);
  formData.append('type', file.mimetype);
  formData.append('messaging_product', 'whatsapp');

  const response = await this.whatsappApi.uploadMedia(formData);

  return {
    id: response.id,        // WhatsApp media ID
    url: null,              // URL retrieved separately
  };
}
```

#### Controller
```typescript
@Controller('api/media')
export class MediaController {
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(@UploadedFile() file: Express.Multer.File) {
    return await this.mediaService.uploadMedia(file);
  }
}
```

---

### 7. UsersModule & MessagesModule

**UsersModule**: Basic CRUD for user management
**MessagesModule**: Legacy message management (being consolidated into ConversationsModule)

---

## Controllers & Routing

### Routing Structure
```
/api
├── /chatbots
│   ├── GET    /               List chatbots
│   ├── POST   /               Create chatbot
│   ├── GET    /:id            Get chatbot
│   ├── GET    /:id/stats      Get chatbot statistics
│   ├── PUT    /:id            Update chatbot (full)
│   ├── PATCH  /:id            Update chatbot (partial)
│   ├── DELETE /:id            Delete chatbot (hard delete)
│   ├── DELETE /:id/soft       Soft delete chatbot
│   ├── PATCH  /:id/status     Update status
│   ├── PATCH  /:id/toggle-active  Toggle active state
│   └── PATCH  /:id/restore    Restore soft-deleted chatbot
│
├── /conversations
│   ├── GET    /               List conversations
│   ├── GET    /:id            Get conversation
│   ├── GET    /:id/messages   Get messages
│   └── POST   /:id/messages   Send message
│
├── /users
│   ├── GET    /               List users
│   ├── POST   /               Create user
│   ├── GET    /:id            Get user
│   └── PUT    /:id            Update user
│
├── /media
│   └── POST   /upload         Upload media
│
├── /webhooks
│   └── /whatsapp
│       ├── GET  /             Verify webhook
│       └── POST /             Receive webhook
│
└── /whatsapp-config
    ├── GET    /               Get config
    ├── POST   /               Create config
    └── PUT    /:id            Update config
```

### Controller Best Practices

**Validation with DTOs**:
```typescript
@Post()
async create(@Body() createDto: CreateChatBotDto) {
  // DTO automatically validated by class-validator
  return await this.service.create(createDto);
}
```

**Error Handling**:
```typescript
@Get(':id')
async findOne(@Param('id') id: string) {
  const chatbot = await this.service.findOne(id);

  if (!chatbot) {
    throw new NotFoundException(`ChatBot with ID ${id} not found`);
  }

  return chatbot;
}
```

---

## Services & Business Logic

### Service Layer Responsibilities
1. **Business Logic**: Core domain logic and workflows
2. **Data Access**: Repository interaction via TypeORM
3. **External APIs**: WhatsApp API, third-party integrations
4. **Real-time Events**: Emit Socket.IO events
5. **Transaction Management**: Database transactions for multi-step operations

### Service Patterns

**Repository Injection**:
```typescript
@Injectable()
export class ChatBotsService {
  constructor(
    @InjectRepository(ChatBot)
    private readonly chatbotRepo: Repository<ChatBot>,
  ) {}
}
```

**Service Composition**:
```typescript
@Injectable()
export class WebhookProcessorService {
  constructor(
    private readonly conversationRepo: Repository<Conversation>,
    private readonly executionService: ChatBotExecutionService,
    private readonly gateway: MessagesGateway,
  ) {}
}
```

---

## DTOs & Validation

### DTO Pattern
All request/response data uses DTOs validated with `class-validator`:

```typescript
import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateChatBotDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  nodes?: any[];

  @IsArray()
  @IsOptional()
  edges?: any[];
}
```

### Nested Validation
```typescript
export class ChatBotNodeDto {
  @IsString()
  id: string;

  @IsString()
  type: string;

  @ValidateNested()
  @Type(() => NodePositionDto)
  position: NodePositionDto;

  @ValidateNested()
  @Type(() => NodeDataDto)
  data: NodeDataDto;
}
```

---

## Dependency Injection

### Module Imports
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([Entity1, Entity2]),  // Repository injection
    OtherModule,                                     // Import other module's exports
  ],
  providers: [Service1, Service2],                  // Available in this module
  exports: [Service1],                              // Available to importing modules
})
```

### Circular Dependencies
**Problem**: ConversationsModule needs WebSocketModule, WebSocketModule needs ConversationsModule

**Solution**: `forwardRef()`
```typescript
@Module({
  imports: [
    forwardRef(() => WebSocketModule),
  ],
})
export class ConversationsModule {}

@Module({
  imports: [
    forwardRef(() => ConversationsModule),
  ],
})
export class WebSocketModule {}
```

---

## Error Handling

### Global Exception Filter
NestJS automatically catches exceptions and returns appropriate HTTP responses:

```typescript
throw new NotFoundException('ChatBot not found');
// → HTTP 404 { statusCode: 404, message: 'ChatBot not found' }

throw new BadRequestException('Invalid payload');
// → HTTP 400 { statusCode: 400, message: 'Invalid payload' }

throw new UnauthorizedException('Invalid signature');
// → HTTP 401 { statusCode: 401, message: 'Invalid signature' }
```

### Custom Exception Filters
**WebSocket Exception Filter** (`filters/ws-exception.filter.ts`):
```typescript
@Catch()
export class WsExceptionFilter implements WsExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();

    client.emit('error', {
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Service-Level Error Handling
```typescript
async processUserResponse(conversationId: string, message: string) {
  try {
    // Business logic
  } catch (error) {
    this.logger.error(
      `Failed to process response: ${error.message}`,
      error.stack,
    );
    throw error;  // Re-throw for controller to handle
  }
}
```

---

## Configuration Management

### Environment Variables
**File**: `/home/ali/whatsapp-builder/backend/.env`

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=whatsapp_builder
DB_LOGGING=false

# Application
PORT=3000
FRONTEND_URL=http://localhost:5173

# WhatsApp API
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token
WHATSAPP_APP_SECRET=your_app_secret
```

### ConfigModule
```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,          // Available in all modules
      envFilePath: '.env',     // Load from .env file
    }),
  ],
})
```

### Using Configuration
```typescript
@Injectable()
export class WhatsAppApiService {
  constructor(private readonly configService: ConfigService) {
    this.baseUrl = `https://graph.facebook.com/v18.0/${this.configService.get('WHATSAPP_PHONE_NUMBER_ID')}`;
  }
}
```

---

## Summary

### Module Dependency Graph
```
AppModule
  ├─→ ConfigModule
  ├─→ DatabaseModule
  ├─→ WhatsAppModule
  ├─→ ChatBotsModule
  │     └─→ WhatsAppModule
  ├─→ ConversationsModule
  │     └─→ WebSocketModule (forwardRef)
  ├─→ WebSocketModule
  │     └─→ ConversationsModule (forwardRef)
  ├─→ WebhooksModule
  │     ├─→ ChatBotsModule
  │     └─→ WebSocketModule (forwardRef)
  ├─→ MessagesModule
  ├─→ MediaModule
  └─→ UsersModule
```

### Key Takeaways
1. **Modular Architecture**: Clear separation of concerns with 8 feature modules
2. **Type Safety**: Full TypeScript coverage with DTOs and validation
3. **Dependency Injection**: Loose coupling through NestJS IoC container
4. **Real-time**: Socket.IO integration for live updates
5. **Error Handling**: Consistent exception handling with NestJS filters
6. **Circular Dependencies**: Resolved with `forwardRef()`
7. **Database Access**: Repository pattern via TypeORM
8. **External APIs**: Abstracted through dedicated services

---

**Next**: See `03-frontend-architecture.md` for frontend deep-dive.
