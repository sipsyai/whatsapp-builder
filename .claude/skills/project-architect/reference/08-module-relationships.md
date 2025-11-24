# Module Relationships - WhatsApp Builder

## Module Dependency Graph

```
AppModule
  ├─→ ConfigModule (global)
  ├─→ DatabaseModule
  │     └─→ TypeOrmModule (PostgreSQL connection)
  │
  ├─→ WhatsAppModule
  │     ├─→ ConfigModule
  │     └─→ TypeOrmModule.forFeature([WhatsAppConfig])
  │
  ├─→ ChatBotsModule
  │     ├─→ TypeOrmModule.forFeature([ChatBot, ConversationContext, Conversation, User])
  │     └─→ WhatsAppModule (imports for message sending)
  │
  ├─→ ConversationsModule
  │     ├─→ TypeOrmModule.forFeature([Conversation, User])
  │     └─→ WebSocketModule (forwardRef - circular)
  │
  ├─→ WebSocketModule
  │     ├─→ ConversationsModule (forwardRef - circular)
  │     └─→ MessagesModule (forwardRef - circular)
  │
  ├─→ WebhooksModule
  │     ├─→ ConfigModule
  │     ├─→ TypeOrmModule.forFeature([Message, Conversation, User])
  │     ├─→ ChatBotsModule (imports ChatBotExecutionService)
  │     └─→ WebSocketModule (forwardRef - circular)
  │
  ├─→ MessagesModule
  │     ├─→ TypeOrmModule.forFeature([Message])
  │     └─→ WebSocketModule (forwardRef - circular)
  │
  ├─→ MediaModule
  │     └─→ WhatsAppModule (for media upload)
  │
  └─→ UsersModule
        └─→ TypeOrmModule.forFeature([User])
```

## Circular Dependencies

### 1. ConversationsModule ↔ WebSocketModule
**Reason**:
- `ConversationsModule` needs `MessagesGateway` to emit real-time events
- `WebSocketModule` needs `ConversationsService` for data access

**Solution**: `forwardRef()`
```typescript
// conversations.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, User]),
    forwardRef(() => WebSocketModule),
  ],
  exports: [ConversationsService],
})
export class ConversationsModule {}

// websocket.module.ts
@Module({
  imports: [
    forwardRef(() => ConversationsModule),
  ],
  exports: [MessagesGateway],
})
export class WebSocketModule {}
```

### 2. WebhooksModule ↔ WebSocketModule
**Reason**:
- `WebhooksModule` needs `MessagesGateway` to emit new messages
- Potential future: `WebSocketModule` might need webhook services

**Solution**: `forwardRef()` in WebhooksModule

### 3. MessagesModule ↔ WebSocketModule
**Reason**: Similar to ConversationsModule relationship

---

## Data Flow Diagrams

### 1. Message Receive Flow (WhatsApp → User)
```
WhatsApp Cloud API
  ↓ (Webhook POST)
WebhooksController.receiveWebhook()
  ↓
WebhookSignatureService.verifySignature()
  ↓
WebhookParserService.parseMessages()
  ↓
WebhookProcessorService.processMessages()
  ├─→ UsersRepository.findOrCreate()
  ├─→ ConversationsRepository.findOrCreate()
  ├─→ MessagesRepository.save()
  ├─→ MessagesGateway.emitMessageReceived()
  └─→ ChatBotExecutionService.processUserResponse()
        ├─→ ConversationContextRepository.findOne()
        ├─→ ChatBotRepository.findOne()
        ├─→ Execute node logic
        ├─→ WhatsAppMessageService.sendTextMessage()
        │     └─→ WhatsAppApiService.sendMessage()
        └─→ ConversationContextRepository.save()
```

### 2. Message Send Flow (User → WhatsApp)
```
Frontend ChatWindow
  ↓ (HTTP POST)
ConversationsController.sendMessage()
  ↓
ConversationsService.sendMessage()
  ├─→ MessagesRepository.save() (optimistic)
  ├─→ MessagesGateway.emitMessageReceived() (real-time update)
  └─→ WhatsAppMessageService.sendTextMessage()
        ├─→ WhatsAppApiService.sendMessage()
        └─→ [WhatsApp API responds]
              └─→ Update message status
                    └─→ MessagesGateway.emitMessageStatus()
```

### 3. ChatBot Execution Flow
```
User Message
  ↓
ChatBotExecutionService.processUserResponse()
  ├─→ Load ConversationContext
  │     └─→ ConversationContextRepository.findOne()
  │
  ├─→ Load ChatBot (nodes/edges)
  │     └─→ ChatBotRepository.findOne()
  │
  ├─→ Save user response to variables
  │     └─→ context.variables[varName] = userMessage
  │
  ├─→ Find next node (via edges)
  │     └─→ findNextNode(chatbot, nodeId, sourceHandle)
  │
  └─→ Execute next node
        ├─→ processMessageNode() → send message → recurse
        ├─→ processQuestionNode() → send interactive → WAIT
        └─→ processConditionNode() → evaluate → branch
```

### 4. Real-time Event Flow
```
Backend Service
  ↓
MessagesGateway.emitMessageReceived(data)
  ↓
Socket.IO Server
  ├─→ server.to(`conversation:${conversationId}`).emit('message:received', data)
  │
  ↓ (WebSocket transport)
Frontend Socket.IO Client
  ↓
useWebSocket Hook
  ├─→ socket.on('message:received', callback)
  │     └─→ Transform DTO to Message type
  │           └─→ setNewMessage(message)
  │
  ↓ (useEffect dependency)
ChatPage Component
  └─→ handleNewMessage(newMessage)
        └─→ setConversations(updated)
              └─→ Re-render UI
```

---

## Service Dependencies

### ChatBotExecutionService
**Dependencies**:
- `ConversationContextRepository` - Load/save execution state
- `ChatBotRepository` - Load chatbot structure
- `ConversationRepository` - Get conversation details
- `UserRepository` - Get user/recipient info
- `TextMessageService` - Send text messages
- `InteractiveMessageService` - Send interactive messages

**Used By**:
- `WebhookProcessorService` - Process user responses
- `ChatBotWebhookController` - Handle chatbot webhooks

### WebhookProcessorService
**Dependencies**:
- `MessageRepository` - Save messages
- `ConversationRepository` - Find/create conversations
- `UserRepository` - Find/create users
- `ChatBotExecutionService` - Execute chatbot logic
- `MessagesGateway` - Emit real-time events

**Used By**:
- `WebhooksController` - Process webhook payloads

### WhatsAppMessageService
**Dependencies**:
- `TextMessageService` - Send text
- `InteractiveMessageService` - Send interactive
- `FlowMessageService` - Send flows

**Used By**:
- `ChatBotExecutionService` - Send chatbot responses
- `ConversationsService` - Send user messages

### MessagesGateway
**Dependencies**: None (standalone gateway)

**Used By**:
- `WebhookProcessorService` - Emit message received
- `ConversationsService` - Emit message sent
- Any service needing real-time notifications

---

## Repository Usage Matrix

| Repository | Used By Modules |
|------------|----------------|
| `UserRepository` | UsersModule, WebhooksModule, ConversationsModule, ChatBotsModule |
| `ChatBotRepository` | ChatBotsModule, WebhooksModule |
| `ConversationRepository` | ConversationsModule, WebhooksModule, ChatBotsModule |
| `ConversationContextRepository` | ChatBotsModule, WebhooksModule |
| `MessageRepository` | MessagesModule, ConversationsModule, WebhooksModule |
| `WhatsAppConfigRepository` | WhatsAppModule |

---

## API Endpoint Dependencies

### ChatBots Endpoints
- `POST /api/chatbots` → ChatBotsService → ChatBotRepository
- `GET /api/chatbots` → ChatBotsService → ChatBotRepository
- `PUT /api/chatbots/:id` → ChatBotsService → ChatBotRepository

### Conversations Endpoints
- `GET /api/conversations` → ConversationsService → ConversationRepository, MessageRepository
- `POST /api/conversations/:id/messages` → ConversationsService → WhatsAppMessageService → WhatsAppApiService

### Webhooks Endpoints
- `POST /api/webhooks/whatsapp` → WebhookProcessorService → Multiple repositories + ChatBotExecutionService

---

## Frontend → Backend Mapping

### Flow Builder
**Frontend**: `BuilderPage` → `features/chatbots/api.ts`
**Backend**: `ChatBotsController` → `ChatBotsService` → `ChatBotRepository`

### Chat UI
**Frontend**: `ChatPage` → `api/conversations.service.ts` + `useWebSocket`
**Backend**: `ConversationsController` + `MessagesGateway`

### Real-time
**Frontend**: `useWebSocket` hook → Socket.IO client
**Backend**: `MessagesGateway` → Socket.IO server

---

## Summary

### Module Interaction Patterns
1. **Repository Pattern**: Services inject repositories via `@InjectRepository()`
2. **Service Composition**: Services inject other services via constructor
3. **Gateway Integration**: Services inject `MessagesGateway` for real-time events
4. **Circular Dependencies**: Resolved with `forwardRef()`

### Data Flow Patterns
1. **Request → Service → Repository → Database**
2. **Database → Service → Gateway → WebSocket → Frontend**
3. **Frontend → HTTP → Controller → Service → External API**

### Key Integration Points
- **Webhooks ↔ ChatBot Execution**: Process user responses
- **Services ↔ WebSocket Gateway**: Real-time notifications
- **ChatBot Execution ↔ WhatsApp API**: Send responses
- **Frontend ↔ Backend**: HTTP + WebSocket

---

**Next**: See `09-development-guide.md` for setup instructions.
