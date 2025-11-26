# ChatBots Module

This module handles chatbot flow creation, execution, and management for WhatsApp conversations.

## Features

- **Flow Builder**: Create complex chatbot flows with ReactFlow-compatible nodes and edges
- **Flow Execution**: State machine pattern for executing chatbot conversations
- **Context Management**: Track conversation state, variables, and node history
- **Timeout Handling**: Automatic cleanup of expired contexts (10-minute timeout for WhatsApp Flows)
- **Skip Commands**: User-initiated flow skipping with multi-language support
- **Debug Tools**: Admin endpoints for troubleshooting and monitoring

## Supported Node Types

### 1. Start Node
- Entry point for chatbot flows
- Triggers when conversation starts

### 2. Message Node
- Send text messages to users
- Supports variable interpolation

### 3. Question Node
- Ask users for input
- Wait for response with timeout
- Store response in variables

### 4. Interactive Node
- Send buttons or lists
- Capture user selection

### 5. WhatsApp Flow Node
- Trigger WhatsApp Flow experience
- 10-minute timeout for completion
- Capture Flow response data

### 6. Condition Node
- Branch flow based on variable values
- Multiple comparison operators
- Default path support

### 7. REST API Node
- Make external API calls (GET, POST, PUT, DELETE)
- Dynamic URL and body with variable substitution
- Custom headers support
- Store response in variables
- Automatic JSON parsing

## Architecture

### Entities

#### ChatBot Entity
- `id`: UUID primary key
- `name`: Bot name
- `description`: Bot description
- `nodes`: JSONB array of ReactFlow nodes
- `edges`: JSONB array of ReactFlow edges
- `isActive`: Boolean (only one can be active)
- `status`: active | draft | archived
- `metadata`: Additional configuration

#### ConversationContext Entity
- `id`: UUID primary key
- `conversationId`: FK to Conversation
- `chatbotId`: FK to ChatBot
- `currentNodeId`: Current executing node
- `variables`: JSONB object for storing user data
- `nodeHistory`: Array of visited node IDs
- `isActive`: Context status
- `expiresAt`: Timeout timestamp (nullable)

### Services

#### ChatBotsService
- CRUD operations for chatbots
- Flow validation
- Statistics (node count, edge count, node types)
- Toggle active chatbot

#### ChatBotExecutionService
- **Flow Execution**:
  - `startChatBot(conversationId)` - Initialize flow
  - `processUserResponse(conversationId, message, buttonId?, listRowId?)` - Handle user input
  - `executeCurrentNode(contextId)` - Execute current node in state machine
  - `stopChatBot(conversationId)` - End chatbot session

- **Timeout Management**:
  - `skipCurrentNode(conversationId)` - Skip stuck flows
  - `forceCompleteContext(contextId)` - Admin force complete

- **Debug Methods**:
  - `getActiveContext(conversationId)` - Get active context
  - `getAllActiveContexts()` - List all active contexts with age/expiration

#### ContextCleanupService
- **Scheduled Cleanup**:
  - `@Cron(CronExpression.EVERY_MINUTE)` - Runs every minute
  - Finds contexts where `isActive=true AND expiresAt < NOW`
  - Deactivates expired contexts
  - Clears waiting states

- **Manual Operations**:
  - `forceCleanup()` - Trigger cleanup manually
  - `getContextStats()` - Get context statistics

### Integration with Other Modules

```
WebhookProcessor -> processUserResponse()
                |
ChatBotExecutionService
  |
  +-> WhatsAppMessageService (send messages)
  +-> MessagesService (store messages)
  +-> MessagesGateway (emit Socket.IO events)
```

## Flow Execution State Machine

```
START node
  |
Execute node based on type
  |
  +-> MESSAGE: Send & move to next
  +-> QUESTION: Send & wait for response
  +-> INTERACTIVE: Send buttons/list & wait
  +-> WHATSAPP_FLOW: Send Flow & wait (10min timeout)
  +-> CONDITION: Evaluate & branch
  +-> API: Call API & move to next
  |
Find next node via edges
  |
Repeat until no next node
  |
END (deactivate context)
```

## Timeout & Expiration

### WhatsApp Flow Timeout
- When Flow node executes:
  ```typescript
  context.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  context.variables['__awaiting_flow_response__'] = outputVariableName;
  ```
- If Flow completes -> `expiresAt` cleared, flow continues
- If 10 minutes pass -> Cron job deactivates context

### Cleanup Mechanism
```typescript
// Runs every minute
@Cron(CronExpression.EVERY_MINUTE)
async cleanupExpiredContexts() {
  const expiredContexts = await contextRepo.find({
    where: {
      isActive: true,
      expiresAt: LessThan(new Date())
    }
  });

  for (const context of expiredContexts) {
    context.isActive = false;
    context.expiresAt = null;
    delete context.variables['__awaiting_flow_response__'];
    delete context.variables['__awaiting_variable__'];
    await save(context);
  }
}
```

## Skip Commands

Users can send these commands to skip stuck flows:
- English: `skip`, `cancel`
- Turkish: `iptal`, `atla`, `vazgec`, `vazgec`

**Behavior:**
1. Webhook receives skip command
2. Check if active context exists
3. If yes -> Call `skipCurrentNode()`
   - Clear waiting states
   - Move to next node (default path preferred)
   - Continue execution
4. If no -> Ignore command

**Safety:**
- Only works on Flow and Question nodes
- Requires active context
- Won't skip non-waiting nodes

## Debug Endpoints

All debug endpoints are under `/api/chatbots/debug/`:

### GET /debug/contexts
List all active contexts with details:
```json
[
  {
    "id": "ctx-uuid",
    "conversationId": "conv-uuid",
    "chatbotName": "Support Bot",
    "currentNodeId": "node-123",
    "isWaitingForFlow": true,
    "isWaitingForQuestion": false,
    "expiresAt": "2024-01-15T10:40:00Z",
    "isExpired": false,
    "ageMinutes": 5
  }
]
```

### GET /debug/contexts/stats
Get context statistics:
```json
{
  "activeContexts": 12,
  "expiredContexts": 3,
  "waitingForFlow": 5,
  "waitingForQuestion": 2
}
```

### POST /debug/contexts/:contextId/force-complete
Force complete a stuck context (admin only).

### POST /debug/cleanup
Manually trigger cleanup job.

### POST /conversations/:conversationId/skip
Skip current node for a conversation.

## API Examples

### Create ChatBot
```bash
POST /api/chatbots
{
  "name": "Support Bot",
  "description": "Customer support chatbot",
  "nodes": [...],
  "edges": [...]
}
```

### Activate ChatBot
```bash
POST /api/chatbots/:id/toggle-active
```

### Stop ChatBot for Conversation
```bash
POST /api/chatbots/conversations/:conversationId/stop
```

### Skip Current Node
```bash
POST /api/chatbots/conversations/:conversationId/skip
```

## Database Migration

Run migration to add `expiresAt` column:

```bash
npm run migration:run
```

Migration creates:
- `expiresAt` column (timestamp with time zone, nullable)
- Partial index: `IDX_conversation_context_expires_at`

## Troubleshooting

### Context Stuck After Flow
- Check if `expiresAt` is set
- Verify cron job is running (check logs for "Found X expired context(s)")
- Manually trigger cleanup: `POST /debug/cleanup`

### Skip Command Not Working
- Ensure context is active
- Verify node type is Flow or Question
- Check if waiting state exists (`__awaiting_flow_response__` or `__awaiting_variable__`)

### Cron Job Not Running
- Verify `ScheduleModule.forRoot()` in AppModule
- Check NestJS logs for cron execution
- Ensure `@nestjs/schedule` package is installed

## Related Modules

- **WebhooksModule**: Receives WhatsApp messages, triggers flow execution
- **WhatsAppModule**: Sends WhatsApp messages (text, interactive, flows)
- **MessagesModule**: Stores message history
- **ConversationsModule**: Manages conversation entities

## Future Enhancements

1. **Configurable Timeouts**
   - Per-node timeout configuration
   - Question node timeout support

2. **Retry Logic**
   - Retry failed WhatsApp API calls
   - Exponential backoff

3. **Flow Analytics**
   - Track node completion rates
   - Identify bottleneck nodes
   - User drop-off analysis

4. **Advanced Skip**
   - Skip to specific node
   - Return to previous node

5. **Scheduled Flows**
   - Trigger flows at specific times
   - Recurring message campaigns
