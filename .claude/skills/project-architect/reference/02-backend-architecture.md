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
│   ├── whatsapp-config.entity.ts
│   └── whatsapp-flow.entity.ts
├── modules/                      # Feature modules
│   ├── chatbots/
│   ├── conversations/
│   ├── flows/
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
    FlowsModule,           // WhatsApp Flows management
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
    TypeOrmModule.forFeature([ChatBot, ConversationContext, Conversation, User, WhatsAppFlow]),
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
- **Message Persistence**: Saves all outgoing messages to database via MessagesService
- **Node Handlers**:
  - `processStartNode()`: Entry point, moves to next node
  - `processMessageNode()`: Sends text message, **saves to database**, moves to next
    - Saves with `type: MessageType.TEXT`
    - Stores WhatsApp message ID in `content.whatsappMessageId`
  - `processQuestionNode()`: Sends interactive message, **saves to database**, **waits** for response
    - Saves with `type: MessageType.INTERACTIVE`
    - Stores WhatsApp message ID in `content.whatsappMessageId`
    - **Button Data Format (Backward Compatible)**:
      - Supports both legacy `string[]` format and new `ButtonItemDto[]` format
      - Button processing logic:
        ```typescript
        const buttonItems = buttons.map((button: any, index: number) => ({
          id: button.id || `btn-${index}`,  // Use existing ID or generate fallback
          title: (typeof button === 'string' ? button : button.title).substring(0, 20),
        }));
        ```
      - Automatically converts strings to `{ id: 'btn-{index}', title: 'text' }`
      - Preserves custom IDs from frontend when available
  - `processConditionNode()`: Evaluates condition, branches accordingly
    - **Current Implementation**: Supports legacy single-condition format (`conditionVar`, `conditionOp`, `conditionVal`)
    - **Frontend Compatibility**: Frontend saves both legacy and new formats for backward compatibility
    - **Future Enhancement**: Add support for `conditionGroup` with multiple conditions and AND/OR logic
    - **Supported Operators**: `==`, `!=`, `>`, `<`, `>=`, `<=`, `contains`, `not_contains`
  - `processWhatsAppFlowNode()`: Sends WhatsApp Flow message, **saves to database**, **waits** for response
    - Loads Flow from database by `whatsappFlowId`
    - Generates `flow_token` containing `{contextId}-{nodeId}` for tracking
    - Sends interactive Flow message via WhatsApp API
    - **Saves Flow message** with detailed content: `{ whatsappMessageId, type: 'flow', body, header, footer, action }`
    - Waits for user to complete Flow and webhook to process response
  - `processFlowResponse()`: Handles Flow completion webhook
    - **UUID-aware flow_token parsing**: Splits token into 5+5 parts for UUID format
    - Logs contextId and nodeId after parsing for debugging
    - Saves Flow response data to context variables
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
  @Post('conversations/:conversationId/stop')  // Stop active chatbot execution
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
- `NodeDataDto`: type, content, variable, questionType, buttons, whatsappFlowId, flowMode, flowCta, flowOutputVariable, etc.
  - **WHATSAPP_FLOW type fields**: whatsappFlowId (UUID), flowMode ('draft'|'published'), flowCta (string), flowOutputVariable (string)

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
    TypeOrmModule.forFeature([WhatsAppConfig, WhatsAppFlow]),
  ],
  providers: [
    WhatsAppApiService,            // Low-level HTTP client
    WhatsAppConfigService,         // Config management
    WhatsAppFlowService,           // WhatsApp Flows API operations
    WhatsAppMessageService,        // Message orchestrator
    TextMessageService,            // Text messages
    InteractiveMessageService,     // Buttons, lists, Flow messages
    FlowEncryptionService,         // Flow data encryption/decryption
  ],
  exports: [
    WhatsAppApiService,
    WhatsAppMessageService,
    WhatsAppConfigService,
    WhatsAppFlowService,
    TextMessageService,
    InteractiveMessageService,
    FlowEncryptionService,
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
- `sendInteractiveMessage(dto)`
- Future: template messages, media messages, etc.

**WhatsAppFlowService** (`services/whatsapp-flow.service.ts`)
- **WhatsApp Flows API Client**: Manages Flow lifecycle on WhatsApp servers
- `createFlow(dto)`: Create Flow via WhatsApp API
- `updateFlow(flowId, dto)`: Update Flow JSON and metadata
- `publishFlow(flowId)`: Publish Flow (makes it available for use)
- `deprecateFlow(flowId)`: Deprecate Flow (required before deletion if PUBLISHED)
- `deleteFlow(flowId)`: Delete Flow from WhatsApp
- `getFlowDetails(flowId)`: Retrieve Flow information
- `getPreviewUrl(flowId, invalidate)`: Get preview URL for testing
- **Error Handling**: Catches and logs WhatsApp API errors
- **Flow Status Lifecycle**: DRAFT → PUBLISHED → DEPRECATED → DELETED

**FlowEncryptionService** (`services/flow-encryption.service.ts`)
- **RSA + AES Encryption**: Secure Flow data exchange
- `decryptRequest(encryptedBody, encryptedAesKey, iv)`: Decrypt incoming Flow webhook
  - Uses RSA private key to decrypt AES key
  - Uses AES-128-GCM to decrypt request body
- `encryptResponse(response, encryptedAesKey, iv)`: Encrypt outgoing Flow response
  - Reuses same AES key and IV from request
  - Returns encrypted response body and authentication tag
- `verifySignature(signature, body)`: Verify X-Hub-Signature-256 header
- **Key Management**: Loads RSA private key from environment variable

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
    TypeOrmModule.forFeature([Message, Conversation, User, ConversationContext]),
    ChatBotsModule,              // For chatbot execution
    WhatsAppModule,              // For FlowEncryptionService
    forwardRef(() => WebSocketModule),  // Circular dependency resolution
  ],
  controllers: [
    WebhooksController,          // Main WhatsApp webhook endpoint
    FlowEndpointController,      // Flow webhook endpoint
  ],
  providers: [
    WebhookSignatureService,     // Signature verification
    WebhookParserService,        // Payload parsing
    WebhookProcessorService,     // Business logic
    FlowEndpointService,         // Flow webhook processing
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
- `parseInteractiveContent()`: Parse interactive message content including **nfm_reply** (WhatsApp Flow completion)
- `getMessagePreview()`: Generate preview text (returns '📋 Flow completed' for nfm_reply)
- **Handles Multiple Types**:
  - Text messages
  - Interactive button/list replies
  - **Interactive nfm_reply** (Native Flow Message Reply - WhatsApp Flow completion)
  - Media messages (image, video, document, audio)
  - Reactions
  - System messages

**nfm_reply Parsing**:
```typescript
// When interactive.type === 'nfm_reply'
const responseData = JSON.parse(msg.interactive.nfm_reply.response_json);
parsed.interactiveType = 'nfm_reply';
parsed.flowToken = responseData.flow_token;
parsed.flowResponseData = responseData;  // Full data including all form fields
```

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

    // 6. Process Flow response
    if (msg.type === 'interactive' && msg.interactiveType === 'nfm_reply') {
      await this.processFlowResponse(conversation.id, msg);
    }
  }
}

async processFlowResponse(conversationId: string, msg: ParsedMessageDto): Promise<void> {
  // Parse flow_token with UUID-aware logic: "{contextId}-{nodeId}"
  // Both contextId and nodeId are UUIDs (format: 8-4-4-4-12 = 5 parts each)
  const parts = msg.flowToken.split('-');
  if (parts.length < 10) {
    throw new Error('Invalid flow_token format');
  }
  const contextId = parts.slice(0, 5).join('-');  // First UUID (5 parts)
  const nodeId = parts.slice(5).join('-');         // Second UUID (5 parts)

  this.logger.log(`Parsed flow_token - contextId: ${contextId}, nodeId: ${nodeId}`);

  // Load conversation context
  const context = await this.contextRepo.findOne({ where: { id: contextId } });

  // Remove flow_token from response data before saving
  const cleanedData = { ...msg.flowResponseData };
  delete cleanedData.flow_token;

  // Save Flow response to context variables
  context.variables[context.currentFlowOutputVariable] = cleanedData;
  await this.contextRepo.save(context);

  // Resume ChatBot execution
  await this.executionService.processFlowResponse(msg.flowToken, cleanedData);
}
```

**FlowEndpointService** (`services/flow-endpoint.service.ts`)
- **Flow Webhook Handler**: Processes Flow interactions
- `handleAction(action, flowToken, data)`: Routes Flow actions
  - **INIT**: Return first screen of Flow
  - **data_exchange**: Process form submission, validate data
  - **BACK**: Handle backward navigation
  - **error_notification**: Log Flow errors
  - **ping**: Health check response
- **Response Building**: Constructs Flow JSON responses
- **Data Validation**: Validates user input based on Flow schema

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

#### Controllers

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

**FlowEndpointController** (`flow-endpoint.controller.ts`)
```typescript
@Controller('api/webhooks/flow-endpoint')
export class FlowEndpointController {
  @Post()
  async handleFlowWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature: string,
    @Body() body: any,
  ): Promise<any> {
    // 1. Verify signature
    // 2. Decrypt request (RSA + AES)
    // 3. Process action (INIT, data_exchange, BACK, etc.)
    // 4. Build response
    // 5. Encrypt response
    // 6. Return encrypted response
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

### 8. FlowsModule
**File**: `/home/ali/whatsapp-builder/backend/src/modules/flows/flows.module.ts`

#### Purpose
Manages WhatsApp Flows lifecycle: creation, updates, publishing, and deletion. Provides integration with WhatsApp Cloud API for Flow management.

#### Module Configuration
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([WhatsAppFlow]),
    WhatsAppModule,  // For WhatsAppFlowService
  ],
  controllers: [FlowsController],
  providers: [FlowsService],
  exports: [FlowsService],
})
```

#### Key Service

**FlowsService** (`flows.service.ts`)
- `create(dto)`: Create Flow and publish to WhatsApp API
- `findAll()`: List all Flows
- `getActiveFlows()`: Get published Flows for ChatBot node selection
- `findOne(id)`: Get Flow by ID
- `update(id, dto)`: Update Flow (resets to DRAFT status)
- `publish(id)`: Publish Flow to WhatsApp (status → PUBLISHED)
- `getPreview(id, invalidate)`: Get preview URL from WhatsApp
- `delete(id)`: Delete Flow with automatic deprecation for PUBLISHED flows
  - **Smart Deletion Logic**:
    1. If Flow status is PUBLISHED, deprecate it first (WhatsApp requirement)
    2. Update local status to DEPRECATED
    3. Attempt deletion from WhatsApp API
    4. Delete from local database
    5. Graceful error handling: continues with local deletion even if WhatsApp API fails
  - **Logging**: Comprehensive logging at each step for troubleshooting
  - **Error Handling**: Catches deprecation/deletion errors, logs warnings, but continues with local cleanup
- `syncFromMeta()`: **NEW** - Sync all flows from Meta/Facebook API
  - Fetches flows with pagination support via `WhatsAppFlowService.fetchAllFlows()`
  - Downloads flow JSON content from Meta assets via `WhatsAppFlowService.getFlowJson()`
  - Creates new flows or updates existing ones based on `whatsappFlowId`
  - Returns `SyncResult` with statistics (created/updated/unchanged/total)
  - **Private Methods**:
    - `syncSingleFlow(metaFlow)`: Process single flow from Meta
    - `isFlowChanged(existingFlow, metaFlow)`: Detect if flow needs update
    - `mapCategories(categories)`: Map Meta categories to enum

**SyncResult Interface**:
```typescript
interface SyncResult {
  created: number;    // Newly created flows
  updated: number;    // Updated existing flows
  unchanged: number;  // Flows with no changes
  total: number;      // Total flows fetched from Meta
  flows: WhatsAppFlow[];  // All synced flow records
}
```

**Flow Lifecycle**:
```
Create → DRAFT → Publish → PUBLISHED → Update → DRAFT → Re-publish → PUBLISHED
                              ↓
                          Deprecate → DEPRECATED → Delete

Sync from Meta → Creates/Updates local records with synced_from_meta: true
```

#### Controller

**FlowsController** (`flows.controller.ts`)
```typescript
@Controller('api/flows')
export class FlowsController {
  @Get()                    // List all flows
  @Get('active')            // List published flows only
  @Post()                   // Create flow
  @Post('sync')             // NEW - Sync from Meta API
  @Get(':id')               // Get flow by ID
  @Put(':id')               // Update flow
  @Post(':id/publish')      // Publish to WhatsApp
  @Get(':id/preview')       // Get preview URL
  @Delete(':id')            // Delete flow
}
```

#### DTOs
- `CreateFlowDto`: name, description, categories, flowJson, endpointUri
- `UpdateFlowDto`: Partial update of Flow fields

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
│   ├── PATCH  /:id/restore    Restore soft-deleted chatbot
│   └── POST   /conversations/:conversationId/stop  Stop active chatbot
│
├── /flows
│   ├── GET    /               List flows
│   ├── GET    /active         List published flows
│   ├── POST   /               Create flow
│   ├── GET    /:id            Get flow
│   ├── PUT    /:id            Update flow
│   ├── POST   /:id/publish    Publish flow
│   ├── GET    /:id/preview    Get preview URL
│   └── DELETE /:id            Delete flow
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
│   ├── /whatsapp
│   │   ├── GET  /             Verify webhook
│   │   └── POST /             Receive webhook
│   └── /flow-endpoint
│       └── POST /             Flow webhook
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

## API Documentation

### Swagger/OpenAPI Integration

The backend includes comprehensive Swagger/OpenAPI documentation accessible at:
```
http://localhost:3000/api/docs
```

#### Setup Location
**File**: `/home/ali/whatsapp-builder/backend/src/main.ts`

#### Documentation Coverage

| Component | Files Documented | Coverage |
|-----------|------------------|----------|
| Controllers | 5 | 29+ endpoints |
| DTOs | 18 | 100+ fields |
| Tags | 9 | Organized by feature |

#### Documented Controllers

1. **ChatBotsController** - 13 endpoints (CRUD, stats, toggle, restore)
2. **FlowsController** - 8 endpoints (Meta sync, publish, preview)
3. **WhatsAppConfigController** - 4 endpoints (config CRUD, test connection)
4. **FlowEndpointController** - 1 endpoint (encrypted data exchange)
5. **ChatBotWebhookController** - 3 endpoints (RSA key, data exchange)

#### Swagger Decorators Used

**Controller Level:**
- `@ApiTags()` - Group endpoints by feature

**Endpoint Level:**
- `@ApiOperation({ summary, description })` - Endpoint documentation
- `@ApiResponse()` - Status code and response descriptions
- `@ApiParam()` - Path parameter documentation
- `@ApiBody()` - Request body schema

**DTO Level:**
- `@ApiProperty()` - Required field documentation with examples
- `@ApiPropertyOptional()` - Optional field documentation

#### OpenAPI Spec Export

```
http://localhost:3000/api/docs-json
```

Use cases: Postman import, API client generation, contract testing.

---

## Summary

### Module Dependency Graph
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
  │     ├─→ WhatsAppModule (for WhatsAppFlowService)
  │     └─→ TypeOrmModule.forFeature([WhatsAppFlow])
  ├─→ ConversationsModule
  │     └─→ WebSocketModule (forwardRef)
  ├─→ WebSocketModule
  │     └─→ ConversationsModule (forwardRef)
  ├─→ WebhooksModule
  │     ├─→ ChatBotsModule
  │     ├─→ WhatsAppModule (for FlowEncryptionService)
  │     └─→ WebSocketModule (forwardRef)
  ├─→ MessagesModule
  ├─→ MediaModule
  └─→ UsersModule
```

### Key Takeaways
1. **Modular Architecture**: Clear separation of concerns with 9 feature modules
2. **Type Safety**: Full TypeScript coverage with DTOs and validation
3. **Dependency Injection**: Loose coupling through NestJS IoC container
4. **Real-time**: Socket.IO integration for live updates
5. **Error Handling**: Consistent exception handling with NestJS filters
6. **Circular Dependencies**: Resolved with `forwardRef()`
7. **Database Access**: Repository pattern via TypeORM
8. **External APIs**: Abstracted through dedicated services (WhatsApp, Flows)
9. **Encryption**: RSA + AES encryption for secure Flow data exchange

---

**Next**: See `03-frontend-architecture.md` for frontend deep-dive.
