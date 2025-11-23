# WebSocket Implementation Summary

## Overview

This document provides a comprehensive overview of the WebSocket implementation for the WhatsApp Web Clone backend project. The implementation provides real-time communication capabilities using Socket.IO and NestJS.

## Packages Installed

```bash
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

## Files Created

### Directory Structure

```
backend/src/modules/websocket/
├── dto/
│   ├── message-received.dto.ts       # DTO for new message events
│   ├── message-status.dto.ts         # DTO for message status updates
│   ├── typing-indicator.dto.ts       # DTO for typing indicators
│   ├── join-conversation.dto.ts      # DTO for joining conversations
│   └── index.ts                      # Barrel export
├── filters/
│   └── ws-exception.filter.ts        # WebSocket error handler
├── middleware/
│   └── ws-auth.middleware.ts         # Authentication middleware
├── messages.gateway.ts               # Main WebSocket gateway
├── websocket.module.ts               # Module definition
├── index.ts                          # Barrel export
├── README.md                         # Complete documentation
└── test-websocket-client.example.ts  # Example test client
```

## Core Components

### 1. MessagesGateway (`messages.gateway.ts`)

The main WebSocket gateway that handles all real-time communication.

**Features:**
- Connection/disconnection handling
- User presence tracking (online/offline)
- Room-based communication (one room per conversation)
- Event handlers for client messages
- Methods to emit server-side events

**Client Events Handled:**
- `conversation:join` - Join a conversation room
- `conversation:leave` - Leave a conversation room
- `typing:start` - User started typing
- `typing:stop` - User stopped typing

**Server Events Emitted:**
- `message:received` - New message in conversation
- `message:status` - Message status update
- `typing:start` - User typing indicator
- `typing:stop` - User stopped typing
- `user:online` - User came online
- `user:offline` - User went offline
- `error` - Error occurred

### 2. DTOs (Data Transfer Objects)

#### MessageReceivedDto
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

#### MessageStatusDto
```typescript
{
  messageId: string;
  conversationId: string;
  status: MessageStatus;
  updatedAt: string;
}
```

#### TypingIndicatorDto
```typescript
{
  conversationId: string;
  userId: string;
  isTyping: boolean;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}
```

### 3. WsAuthMiddleware

Authentication middleware for WebSocket connections.

**Development Mode:**
- Accepts `userId` from query parameters
- Example: `io('http://localhost:3000/messages?userId=user-123')`

**Production Mode (TODO):**
- Should verify JWT tokens from `handshake.auth.token`
- Instructions provided in the middleware file

### 4. WsExceptionFilter

Global exception filter for WebSocket errors.

**Features:**
- Catches all WebSocket exceptions
- Formats error responses consistently
- Emits errors to clients
- Logs errors for debugging

## Integration with Existing Services

### ConversationsService

**Added Methods:**
```typescript
// Handle typing indicators
handleTypingStart(conversationId: string, userId: string): Promise<void>
handleTypingStop(conversationId: string, userId: string): Promise<void>

// User presence
isUserOnline(userId: string): boolean
getOnlineUsers(): string[]
```

**Dependencies Added:**
- Injected `MessagesGateway` using `forwardRef` to avoid circular dependencies

### MessagesService

**Modified Methods:**
```typescript
// Emits WebSocket event after creating message
create(messageData: Partial<Message>): Promise<Message>

// Emits WebSocket event after updating status
updateStatus(messageId: string, status: MessageStatus): Promise<Message>

// Emits WebSocket events for all updated messages
markConversationAsRead(conversationId: string): Promise<void>
```

**Private Helper Methods:**
```typescript
private emitMessageReceived(message: Message): Promise<void>
private emitMessageStatus(message: Message): void
```

**Dependencies Added:**
- Injected `MessagesGateway` using `forwardRef` to avoid circular dependencies

### AppModule

**Updated Imports:**
```typescript
import { WebSocketModule } from './modules/websocket/websocket.module';

@Module({
  imports: [
    // ... other modules
    WebSocketModule,
  ],
})
```

## Client-Side Integration

### React/Next.js Example

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket(userId: string, conversationId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('http://localhost:3000/messages', {
      query: { userId }
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');

      // Join conversation
      newSocket.emit('conversation:join', { conversationId });
    });

    // Listen for new messages
    newSocket.on('message:received', (data) => {
      setMessages(prev => [...prev, data]);
    });

    // Listen for typing indicators
    newSocket.on('typing:start', (data) => {
      setTypingUsers(prev => new Set([...prev, data.userId]));
    });

    newSocket.on('typing:stop', (data) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [userId, conversationId]);

  const sendTypingStart = () => {
    socket?.emit('typing:start', {
      conversationId,
      userId,
      isTyping: true
    });
  };

  const sendTypingStop = () => {
    socket?.emit('typing:stop', {
      conversationId,
      userId,
      isTyping: false
    });
  };

  return {
    socket,
    messages,
    typingUsers,
    sendTypingStart,
    sendTypingStop
  };
}
```

### Usage in Component

```tsx
function ChatComponent({ userId, conversationId }) {
  const { messages, typingUsers, sendTypingStart, sendTypingStop } =
    useWebSocket(userId, conversationId);

  const [inputValue, setInputValue] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleInputChange = (e) => {
    setInputValue(e.target.value);

    // Send typing start
    sendTypingStart();

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing stop after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop();
    }, 2000);
  };

  return (
    <div>
      {/* Messages */}
      {messages.map(msg => (
        <div key={msg.messageId}>{msg.content}</div>
      ))}

      {/* Typing indicator */}
      {typingUsers.size > 0 && (
        <div>Someone is typing...</div>
      )}

      {/* Input */}
      <input
        value={inputValue}
        onChange={handleInputChange}
        onBlur={sendTypingStop}
      />
    </div>
  );
}
```

## Testing

### Using the Example Test Client

1. Make sure the backend is running:
```bash
npm run start:dev
```

2. In another terminal, run the test client:
```bash
npm install socket.io-client  # If not already installed
ts-node -r tsconfig-paths/register src/modules/websocket/test-websocket-client.example.ts
```

### Using Postman

1. Create a new WebSocket request
2. URL: `ws://localhost:3000/messages?userId=test-user`
3. Connect
4. Send events:
```json
{
  "event": "conversation:join",
  "data": {
    "conversationId": "test-conversation-id"
  }
}
```

## Configuration

### Environment Variables

Add to `.env`:
```env
FRONTEND_URL=http://localhost:3000
```

### CORS Configuration

The WebSocket gateway is configured to accept connections from the frontend URL specified in the environment variable.

## Error Handling

All errors are caught and emitted to the client:

```typescript
socket.on('error', (error) => {
  console.error('Error:', error.message);
  // Handle error in UI
});
```

## Security Considerations

### Current Implementation (Development)
- Uses `userId` from query parameters
- No authentication required
- **NOT SUITABLE FOR PRODUCTION**

### Production Implementation (TODO)

1. **Install JWT dependencies:**
```bash
npm install @nestjs/jwt
```

2. **Update `ws-auth.middleware.ts`:**
```typescript
const token = socket.handshake.auth.token;
const decoded = this.jwtService.verify(token);
socket.data.userId = decoded.userId;
```

3. **Client-side update:**
```typescript
const socket = io('http://localhost:3000/messages', {
  auth: { token: jwtToken }
});
```

## Performance Considerations

### Current Setup
- In-memory user tracking (Map)
- Single server instance
- Suitable for development and small deployments

### Scaling (Future)

For production with multiple server instances:

1. **Install Redis adapter:**
```bash
npm install @socket.io/redis-adapter redis
```

2. **Update gateway:**
```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

// In afterInit
const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

this.server.adapter(createAdapter(pubClient, subClient));
```

## Future Enhancements

- [ ] JWT authentication
- [ ] Rate limiting
- [ ] Redis adapter for horizontal scaling
- [ ] Message delivery receipts
- [ ] Voice/video call signaling
- [ ] Screen sharing support
- [ ] File transfer progress tracking
- [ ] Presence updates (last seen)
- [ ] Message reactions
- [ ] Message editing indicators
- [ ] Message deletion indicators
- [ ] End-to-end encryption

## Troubleshooting

### Connection Issues

**Client can't connect:**
- Check if backend is running
- Verify CORS configuration
- Check firewall settings
- Verify URL and port

**Authentication failures:**
- Check userId is being sent
- Verify middleware is working
- Check logs for errors

### Events Not Received

**Messages not appearing:**
- Verify client joined conversation room
- Check if event names match
- Verify server is emitting events
- Check network tab for WebSocket frames

### Performance Issues

**High latency:**
- Check network connection
- Monitor server resources
- Consider using Redis adapter
- Implement connection pooling

## Support

For issues or questions:
1. Check the README.md in the websocket module
2. Review the example test client
3. Check server logs
4. Enable WebSocket debugging:
```typescript
// Client-side
const socket = io(url, {
  transports: ['websocket'],
  upgrade: false,
  debug: true
});
```

## Conclusion

This WebSocket implementation provides a solid foundation for real-time communication in the WhatsApp Web Clone application. It includes:

- ✅ Real-time message delivery
- ✅ Message status updates
- ✅ Typing indicators
- ✅ User presence tracking
- ✅ Room-based communication
- ✅ Comprehensive error handling
- ✅ Integration with existing services
- ✅ Example client implementation
- ✅ Complete documentation

The implementation is ready for development use and can be enhanced with JWT authentication and Redis adapter for production deployment.
