# WebSocket Quick Start Guide

## For Frontend Developers

### 1. Install Socket.IO Client

```bash
npm install socket.io-client
```

### 2. Basic Connection

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/messages', {
  query: {
    userId: 'your-user-id'  // Replace with actual user ID
  }
});
```

### 3. Join a Conversation

```typescript
socket.on('connect', () => {
  socket.emit('conversation:join', {
    conversationId: 'conversation-id-here'
  });
});
```

### 4. Listen for Messages

```typescript
socket.on('message:received', (data) => {
  console.log('New message:', data);
  // Add message to your UI
});
```

### 5. Listen for Typing Indicators

```typescript
socket.on('typing:start', (data) => {
  console.log(`${data.userId} is typing...`);
  // Show typing indicator
});

socket.on('typing:stop', (data) => {
  // Hide typing indicator
});
```

### 6. Send Typing Indicators

```typescript
// When user starts typing
socket.emit('typing:start', {
  conversationId: 'conversation-id',
  userId: 'your-user-id',
  isTyping: true
});

// When user stops typing (after 2 seconds of no input)
socket.emit('typing:stop', {
  conversationId: 'conversation-id',
  userId: 'your-user-id',
  isTyping: false
});
```

### 7. Complete React Hook Example

```typescript
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

export function useChat(userId, conversationId) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000/messages', {
      query: { userId }
    });

    newSocket.on('connect', () => {
      newSocket.emit('conversation:join', { conversationId });
    });

    newSocket.on('message:received', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    newSocket.on('typing:start', () => {
      setIsTyping(true);
    });

    newSocket.on('typing:stop', () => {
      setIsTyping(false);
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [userId, conversationId]);

  const handleTyping = () => {
    socket?.emit('typing:start', {
      conversationId,
      userId,
      isTyping: true
    });

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = setTimeout(() => {
      socket?.emit('typing:stop', {
        conversationId,
        userId,
        isTyping: false
      });
    }, 2000);
  };

  return { messages, isTyping, handleTyping };
}
```

## For Backend Developers

### 1. Emit Events from Services

The WebSocket events are automatically emitted when you use the existing service methods:

```typescript
// In your controller or service
import { MessagesService } from '../messages/messages.service';

// This will automatically emit 'message:received' event
await this.messagesService.create({
  conversationId: 'conv-id',
  senderId: 'user-id',
  type: MessageType.TEXT,
  content: { text: 'Hello!' },
  status: MessageStatus.SENT
});

// This will automatically emit 'message:status' event
await this.messagesService.updateStatus(
  'message-id',
  MessageStatus.READ
);
```

### 2. Manual Event Emission

```typescript
import { MessagesGateway } from '../websocket/messages.gateway';

@Injectable()
export class YourService {
  constructor(
    private readonly messagesGateway: MessagesGateway
  ) {}

  async doSomething() {
    // Emit custom event
    this.messagesGateway.server.to('conversation:123').emit('custom:event', {
      data: 'your-data'
    });
  }
}
```

### 3. Check User Online Status

```typescript
import { ConversationsService } from '../conversations/conversations.service';

// Check if user is online
const isOnline = this.conversationsService.isUserOnline('user-id');

// Get all online users
const onlineUsers = this.conversationsService.getOnlineUsers();
```

## Event Reference

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `conversation:join` | `{ conversationId: string }` | Join a conversation room |
| `conversation:leave` | `{ conversationId: string }` | Leave a conversation room |
| `typing:start` | `{ conversationId: string, userId: string, isTyping: true }` | User started typing |
| `typing:stop` | `{ conversationId: string, userId: string, isTyping: false }` | User stopped typing |

### Server → Client

| Event | When | Payload |
|-------|------|---------|
| `message:received` | New message created | `MessageReceivedDto` |
| `message:status` | Message status updated | `MessageStatusDto` |
| `typing:start` | User starts typing | `TypingIndicatorDto` |
| `typing:stop` | User stops typing | `TypingIndicatorDto` |
| `user:online` | User connects | `{ userId: string }` |
| `user:offline` | User disconnects | `{ userId: string }` |
| `error` | Error occurs | `{ status: 'error', message: string }` |

## Testing

### Quick Test with cURL (WebSocket handshake)

```bash
curl -X GET "http://localhost:3000/socket.io/?EIO=4&transport=polling&userId=test-user"
```

### Test with Node.js

Create a file `test.js`:

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000/messages', {
  query: { userId: 'test-user' }
});

socket.on('connect', () => {
  console.log('Connected!');

  socket.emit('conversation:join', {
    conversationId: 'test-conv'
  });
});

socket.on('message:received', console.log);
socket.on('error', console.error);
```

Run: `node test.js`

## Common Issues

### 1. Connection Refused
- Check if backend is running on port 3000
- Verify CORS settings
- Check firewall

### 2. Events Not Received
- Make sure you joined the conversation room first
- Check event names (case-sensitive)
- Verify userId is correct

### 3. TypeScript Errors
- Install types: `npm install -D @types/socket.io-client`
- Import correctly: `import { io } from 'socket.io-client'`

## Next Steps

1. Read the full [README.md](./README.md) for complete documentation
2. Review the [test client example](./test-websocket-client.example.ts)
3. Check [WEBSOCKET_IMPLEMENTATION.md](../../WEBSOCKET_IMPLEMENTATION.md) for integration details
4. Implement JWT authentication for production (see README.md)

## Support

Having issues? Check:
1. Server logs: Look for WebSocket connection messages
2. Browser DevTools: Network tab → WS tab to see WebSocket frames
3. Enable debug mode: Add `debug: true` to socket.io client options
