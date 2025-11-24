# Real-time System - WhatsApp Builder

## Table of Contents
- [Overview](#overview)
- [Socket.IO Architecture](#socketio-architecture)
- [Backend Gateway](#backend-gateway)
- [Frontend Integration](#frontend-integration)
- [Event Types](#event-types)
- [Room Management](#room-management)
- [Connection Lifecycle](#connection-lifecycle)
- [Error Handling](#error-handling)

---

## Overview

The real-time system uses **Socket.IO 4.8.x** for bidirectional communication between the backend and frontend. It enables instant message delivery, status updates, and typing indicators without polling.

### Technology Stack
- **Backend**: @nestjs/websockets, @nestjs/platform-socket.io, socket.io 4.8.1
- **Frontend**: socket.io-client 4.8.1

### Architecture Pattern
- **Server**: NestJS WebSocket Gateway (`MessagesGateway`)
- **Client**: Custom React hook (`useWebSocket`)
- **Transport**: WebSocket with long-polling fallback
- **Namespace**: `/messages`
- **Rooms**: `conversation:{conversationId}`

---

## Socket.IO Architecture

### Connection Flow
```
Frontend                           Backend
   |                                  |
   | ---- connect(userId) -------> MessagesGateway
   |      (handshake.query)          |
   |                                  |
   | <--- connect (ACK) ------------  |
   |                                  |
   | ---- conversation:join -------> handleJoinConversation()
   |      { conversationId }          |
   |                                  |
   | <--- conversation:joined -----  |
   |                                  |
   |      [Server emits event]        |
   | <--- message:received ---------  | (to room)
   |                                  |
```

### Namespace Configuration
**Backend**: `/messages` namespace
**Frontend**: Connect to `http://localhost:3000/messages`

---

## Backend Gateway

### Gateway Setup
**File**: `/home/ali/whatsapp-builder/backend/src/modules/websocket/messages.gateway.ts`

```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/messages',
})
@UseFilters(new WsExceptionFilter())
@UsePipes(new ValidationPipe())
export class MessagesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private readonly userSockets = new Map<string, Set<string>>();

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    const userId = this.getUserIdFromSocket(client);

    if (!userId) {
      this.logger.warn(`Client ${client.id} connected without authentication`);
      client.disconnect();
      return;
    }

    // Track user sockets (one user can have multiple connections)
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);

    // Notify others user is online
    client.broadcast.emit('user:online', { userId });

    this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
  }

  handleDisconnect(client: Socket) {
    const userId = this.getUserIdFromSocket(client);

    if (userId) {
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);

        // If user has no more connections, mark as offline
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
          client.broadcast.emit('user:offline', { userId });
        }
      }
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private getUserIdFromSocket(client: Socket): string | null {
    // Extract from handshake query
    const userId = client.handshake.query.userId as string;

    // TODO: In production, decode JWT token
    // const token = client.handshake.auth.token;
    // const decoded = this.jwtService.verify(token);
    // return decoded.userId;

    return userId || null;
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }
}
```

---

## Event Types

### Client → Server Events

#### 1. conversation:join
**Purpose**: Join a conversation room to receive real-time updates
**Payload**: `{ conversationId: string }`
**Handler**:
```typescript
@SubscribeMessage('conversation:join')
handleJoinConversation(
  @MessageBody() data: JoinConversationDto,
  @ConnectedSocket() client: Socket,
) {
  const { conversationId } = data;
  const userId = this.getUserIdFromSocket(client);

  client.join(`conversation:${conversationId}`);
  this.logger.log(`User ${userId} joined conversation ${conversationId}`);

  return {
    event: 'conversation:joined',
    data: { conversationId, success: true },
  };
}
```

#### 2. conversation:leave
**Purpose**: Leave a conversation room
**Payload**: `{ conversationId: string }`

#### 3. typing:start
**Purpose**: Notify others user is typing
**Payload**: `{ conversationId: string }`
**Broadcast**: To all members of `conversation:{conversationId}` except sender

```typescript
@SubscribeMessage('typing:start')
handleTypingStart(
  @MessageBody() data: TypingIndicatorDto,
  @ConnectedSocket() client: Socket,
) {
  const userId = this.getUserIdFromSocket(client);
  const { conversationId } = data;

  client.to(`conversation:${conversationId}`).emit('typing:start', {
    conversationId,
    userId,
    isTyping: true,
  });
}
```

#### 4. typing:stop
**Purpose**: Notify others user stopped typing
**Payload**: `{ conversationId: string }`

---

### Server → Client Events

#### 1. message:received
**Purpose**: Notify clients of new message
**Payload**: `MessageReceivedDto`
**Trigger**: Called from `WebhookProcessorService` or `ConversationsService`

```typescript
emitMessageReceived(data: MessageReceivedDto) {
  const { conversationId } = data;

  this.server.to(`conversation:${conversationId}`).emit('message:received', data);

  this.logger.log(`Message ${data.messageId} emitted to conversation ${conversationId}`);
}
```

**Payload Structure**:
```typescript
interface MessageReceivedDto {
  conversationId: string;
  messageId: string;
  senderId: string;
  type: MessageType;
  content: any;
  status: MessageStatus;
  timestamp: string;
}
```

#### 2. message:status
**Purpose**: Update message status (sent → delivered → read)
**Payload**: `MessageStatusDto`

```typescript
interface MessageStatusDto {
  conversationId: string;
  messageId: string;
  status: 'sent' | 'delivered' | 'read';
}
```

#### 3. user:online / user:offline
**Purpose**: Notify when users connect/disconnect
**Payload**: `{ userId: string }`

---

## Frontend Integration

### Socket Client Setup
**File**: `/home/ali/whatsapp-builder/frontend/src/api/socket.ts`

```typescript
import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

// Connect to /messages namespace as expected by backend
export const socket = io(URL + '/messages', {
  autoConnect: false,
  transports: ['websocket'],
});
```

### Custom Hook: useWebSocket
**File**: `/home/ali/whatsapp-builder/frontend/src/hooks/useWebSocket.ts`

```typescript
interface UseWebSocketReturn {
  connected: boolean;
  newMessage: Message | null;
  messageStatusUpdate: {
    messageId: string;
    status: string;
  } | null;
}

export function useWebSocket(): UseWebSocketReturn {
  const [connected, setConnected] = useState(false);
  const [newMessage, setNewMessage] = useState<Message | null>(null);
  const [messageStatusUpdate, setMessageStatusUpdate] = useState<{
    messageId: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    socket.connect();

    // Connection events
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    // Message events
    socket.on('message:received', (data: any) => {
      console.log('New message received:', data);

      // Transform backend DTO to frontend Message type
      const message: Message = {
        id: data.messageId,
        conversationId: data.conversationId,
        senderId: data.senderId,
        type: data.type,
        content: data.content,
        status: data.status,
        timestamp: data.timestamp,
        createdAt: data.timestamp,
        updatedAt: data.timestamp,
      };

      setNewMessage(message);
    });

    socket.on('message:status', (data: { messageId: string; status: string }) => {
      console.log('Message status update:', data);
      setMessageStatusUpdate(data);
    });

    // Cleanup on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('message:received');
      socket.off('message:status');
      socket.disconnect();
    };
  }, []);

  return { connected, newMessage, messageStatusUpdate };
}
```

### Usage in Components
**File**: `/home/ali/whatsapp-builder/frontend/src/features/chat/ChatPage.tsx`

```typescript
const ChatPage = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { newMessage, messageStatusUpdate } = useWebSocket();

  // Handle new messages
  useEffect(() => {
    if (newMessage) {
      handleNewMessage(newMessage);
    }
  }, [newMessage]);

  // Handle status updates
  useEffect(() => {
    if (messageStatusUpdate) {
      handleMessageStatusUpdate(
        messageStatusUpdate.messageId,
        messageStatusUpdate.status
      );
    }
  }, [messageStatusUpdate]);

  const handleNewMessage = (message: Message) => {
    setConversations(prev => prev.map(c => {
      if (c.id === message.conversationId) {
        return {
          ...c,
          messages: [...(c.messages || []), message],
          lastMessage: extractMessagePreview(message),
          lastMessageAt: message.createdAt,
          unreadCount: c.id !== activeConversationId ? (c.unreadCount || 0) + 1 : 0
        };
      }
      return c;
    }));
  };

  const handleMessageStatusUpdate = (messageId: string, status: string) => {
    setConversations(prev => prev.map(c => ({
      ...c,
      messages: c.messages?.map(m =>
        m.id === messageId ? { ...m, status: status as any } : m
      ) || []
    })));
  };

  return (/* ... */);
};
```

---

## Room Management

### Joining a Room
```typescript
// Frontend
socket.emit('conversation:join', { conversationId: '123' });

// Backend handler
client.join(`conversation:${conversationId}`);
```

### Leaving a Room
```typescript
// Frontend
socket.emit('conversation:leave', { conversationId: '123' });

// Backend handler
client.leave(`conversation:${conversationId}`);
```

### Broadcasting to a Room
```typescript
// Backend: emit to all clients in room
this.server.to(`conversation:${conversationId}`).emit('message:received', data);

// Backend: emit to all EXCEPT sender
client.to(`conversation:${conversationId}`).emit('typing:start', data);
```

---

## Connection Lifecycle

### Connection Sequence
1. **Frontend**: Call `socket.connect()`
2. **Backend**: Receive connection in `handleConnection()`
3. **Backend**: Extract userId from handshake
4. **Backend**: Track user socket in `userSockets` map
5. **Backend**: Broadcast `user:online` event
6. **Frontend**: Receive `connect` event, update UI

### Disconnection Sequence
1. **Client**: Disconnect (network issue, tab close, etc.)
2. **Backend**: Receive disconnect in `handleDisconnect()`
3. **Backend**: Remove socket from `userSockets` map
4. **Backend**: If user has no more connections, broadcast `user:offline`

### Reconnection
Socket.IO automatically reconnects on network issues.

---

## Error Handling

### WebSocket Exception Filter
**File**: `/home/ali/whatsapp-builder/backend/src/modules/websocket/filters/ws-exception.filter.ts`

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

### Frontend Error Handling
```typescript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
  // Show error notification to user
});
```

---

## Summary

### Key Architectural Decisions
1. **Namespace Separation**: `/messages` namespace for chat-related events
2. **Room-based Broadcasting**: Conversation-specific rooms for targeted updates
3. **User Socket Tracking**: Support multiple connections per user
4. **Custom Hook**: Encapsulate WebSocket logic for reusability
5. **DTO Transformation**: Backend DTOs transformed to frontend types

### Event Flow Examples

**New Message Flow**:
```
WhatsApp → Webhook → WebhookProcessor → Gateway.emitMessageReceived()
  → Socket.IO → Frontend useWebSocket hook → ChatPage.handleNewMessage()
  → Update conversation state → UI re-renders
```

**Typing Indicator Flow**:
```
User types → ChatPage → socket.emit('typing:start')
  → Backend handleTypingStart() → Broadcast to room (except sender)
  → Other clients receive 'typing:start' → Show typing indicator
```

---

**Next**: See `06-whatsapp-integration.md` for WhatsApp API integration.
