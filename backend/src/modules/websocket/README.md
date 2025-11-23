# WebSocket Module

This module provides real-time communication capabilities for the WhatsApp Web Clone backend using Socket.IO.

## Features

- Real-time message delivery
- Message status updates (sent/delivered/read)
- Typing indicators
- User online/offline status
- Room-based communication (one room per conversation)
- WebSocket authentication middleware
- Comprehensive error handling

## Architecture

### Files Structure

```
websocket/
├── dto/
│   ├── message-received.dto.ts       # New message event DTO
│   ├── message-status.dto.ts         # Message status update DTO
│   ├── typing-indicator.dto.ts       # Typing indicator DTO
│   ├── join-conversation.dto.ts      # Join/leave conversation DTO
│   └── index.ts
├── filters/
│   └── ws-exception.filter.ts        # WebSocket error handler
├── middleware/
│   └── ws-auth.middleware.ts         # Authentication middleware
├── messages.gateway.ts               # Main WebSocket gateway
├── websocket.module.ts               # Module definition
├── index.ts
└── README.md
```

## Events

### Client -> Server Events

#### 1. `conversation:join`
Join a conversation room to receive real-time updates.

**Payload:**
```typescript
{
  conversationId: string;
}
```

**Response:**
```typescript
{
  event: 'conversation:joined',
  data: {
    conversationId: string,
    success: true
  }
}
```

#### 2. `conversation:leave`
Leave a conversation room.

**Payload:**
```typescript
{
  conversationId: string;
}
```

**Response:**
```typescript
{
  event: 'conversation:left',
  data: {
    conversationId: string,
    success: true
  }
}
```

#### 3. `typing:start`
Notify other participants that user is typing.

**Payload:**
```typescript
{
  conversationId: string;
  userId: string;
  isTyping: true;
}
```

#### 4. `typing:stop`
Notify other participants that user stopped typing.

**Payload:**
```typescript
{
  conversationId: string;
  userId: string;
  isTyping: false;
}
```

### Server -> Client Events

#### 1. `message:received`
Emitted when a new message is received in the conversation.

**Payload:**
```typescript
{
  messageId: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: any;
  status: MessageStatus;
  timestamp: Date;
  sender?: {
    id: string;
    name: string;
    phoneNumber: string;
    avatar?: string;
  };
}
```

#### 2. `message:status`
Emitted when a message status changes (sent -> delivered -> read).

**Payload:**
```typescript
{
  messageId: string;
  conversationId: string;
  status: MessageStatus;
  updatedAt: string;
}
```

#### 3. `typing:start`
Emitted when a user starts typing.

**Payload:**
```typescript
{
  conversationId: string;
  userId: string;
  isTyping: true;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}
```

#### 4. `typing:stop`
Emitted when a user stops typing.

**Payload:**
```typescript
{
  conversationId: string;
  userId: string;
  isTyping: false;
}
```

#### 5. `user:online`
Emitted when a user comes online.

**Payload:**
```typescript
{
  userId: string;
}
```

#### 6. `user:offline`
Emitted when a user goes offline.

**Payload:**
```typescript
{
  userId: string;
}
```

#### 7. `error`
Emitted when an error occurs.

**Payload:**
```typescript
{
  status: 'error';
  message: string;
  statusCode?: number;
  data?: any;
}
```

## Client Integration

### Connection

**Development Mode:**
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/messages', {
  query: {
    userId: 'user-id-here'
  }
});
```

**Production Mode (with JWT):**
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/messages', {
  auth: {
    token: 'jwt-token-here'
  }
});
```

### Example Usage

```typescript
import { io } from 'socket.io-client';

// Connect to WebSocket server
const socket = io('http://localhost:3000/messages', {
  query: { userId: 'user-123' }
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});

// Join a conversation
socket.emit('conversation:join', {
  conversationId: 'conversation-123'
});

// Listen for new messages
socket.on('message:received', (data) => {
  console.log('New message:', data);
  // Update UI with new message
});

// Listen for message status updates
socket.on('message:status', (data) => {
  console.log('Message status updated:', data);
  // Update message status in UI
});

// Listen for typing indicators
socket.on('typing:start', (data) => {
  console.log(`${data.userId} is typing...`);
  // Show typing indicator in UI
});

socket.on('typing:stop', (data) => {
  console.log(`${data.userId} stopped typing`);
  // Hide typing indicator in UI
});

// Send typing start event
const handleTyping = () => {
  socket.emit('typing:start', {
    conversationId: 'conversation-123',
    userId: 'user-123',
    isTyping: true
  });
};

// Send typing stop event (debounced)
const handleStopTyping = () => {
  socket.emit('typing:stop', {
    conversationId: 'conversation-123',
    userId: 'user-123',
    isTyping: false
  });
};

// Listen for user online/offline status
socket.on('user:online', (data) => {
  console.log(`User ${data.userId} is online`);
});

socket.on('user:offline', (data) => {
  console.log(`User ${data.userId} is offline`);
});

// Error handling
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

## Integration with Services

### MessagesService

The `MessagesService` automatically emits WebSocket events when:
- New messages are created (`message:received`)
- Message status is updated (`message:status`)
- Conversation is marked as read (multiple `message:status` events)

### ConversationsService

The `ConversationsService` provides methods for:
- Handling typing indicators (`handleTypingStart`, `handleTypingStop`)
- Checking user online status (`isUserOnline`)
- Getting all online users (`getOnlineUsers`)

## Authentication

### Development Mode

Currently, the module accepts `userId` from query parameters for development purposes.

```typescript
const socket = io('http://localhost:3000/messages', {
  query: { userId: 'user-123' }
});
```

### Production Mode (TODO)

For production, implement JWT authentication:

1. Install dependencies:
```bash
npm install @nestjs/jwt
```

2. Update `ws-auth.middleware.ts` to verify JWT tokens:
```typescript
const token = socket.handshake.auth.token;
const decoded = this.jwtService.verify(token);
socket.data.userId = decoded.userId;
```

3. Update client to send JWT token:
```typescript
const socket = io('http://localhost:3000/messages', {
  auth: { token: jwtToken }
});
```

## Error Handling

All WebSocket errors are caught by `WsExceptionFilter` and emitted to the client:

```typescript
socket.on('error', (error) => {
  console.error('Error:', error.message);
});
```

## Room Management

Each conversation has its own room (`conversation:{conversationId}`). Clients must join a conversation room to receive real-time updates for that conversation.

## Testing

### Using Socket.IO Client

```bash
npm install socket.io-client
```

```typescript
// test-websocket.ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/messages', {
  query: { userId: 'test-user' }
});

socket.on('connect', () => {
  console.log('Connected!');

  // Join conversation
  socket.emit('conversation:join', { conversationId: 'test-conv' });
});

socket.on('message:received', console.log);
socket.on('message:status', console.log);
socket.on('typing:start', console.log);
```

### Using Postman

1. Create a new WebSocket Request
2. Set URL: `ws://localhost:3000/messages?userId=test-user`
3. Connect and send events:
```json
{
  "event": "conversation:join",
  "data": {
    "conversationId": "test-conversation-id"
  }
}
```

## Environment Variables

Add to your `.env` file:

```env
FRONTEND_URL=http://localhost:3000
```

This is used for CORS configuration in the WebSocket gateway.

## Future Enhancements

- [ ] JWT authentication
- [ ] Rate limiting
- [ ] Redis adapter for horizontal scaling
- [ ] Message delivery receipts
- [ ] Voice call signaling
- [ ] Video call signaling
- [ ] Screen sharing support
- [ ] File transfer progress tracking
- [ ] Presence updates (last seen)
- [ ] Message reactions
- [ ] Message editing indicators
- [ ] Message deletion indicators
