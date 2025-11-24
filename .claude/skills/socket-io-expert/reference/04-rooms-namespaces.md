# Rooms and Namespaces

Guide for organizing clients with rooms and namespaces in Socket.IO.

## Rooms

Rooms are server-side channels that sockets can join and leave.

### Joining Rooms

```typescript
@SubscribeMessage('join-room')
async handleJoinRoom(
  @MessageBody() room: string,
  @ConnectedSocket() client: Socket,
) {
  await client.join(room);

  // Notify room members
  this.server.to(room).emit('user-joined', {
    userId: client.data.userId,
    room,
  });

  return { joined: room };
}
```

### Leaving Rooms

```typescript
@SubscribeMessage('leave-room')
async handleLeaveRoom(
  @MessageBody() room: string,
  @ConnectedSocket() client: Socket,
) {
  await client.leave(room);

  this.server.to(room).emit('user-left', {
    userId: client.data.userId,
  });
}
```

### Broadcasting to Rooms

```typescript
// Send to all clients in room
this.server.to('room-name').emit('message', data);

// Send to multiple rooms
this.server.to(['room1', 'room2']).emit('message', data);

// Send to room except sender
client.to('room-name').emit('message', data);
```

### Room Management

```typescript
// Get all sockets in room
const sockets = await this.server.in('room-name').fetchSockets();

// Get room count
const count = sockets.length;

// Get all rooms for a socket
const rooms = Array.from(client.rooms);

// Check if socket is in room
const isInRoom = client.rooms.has('room-name');
```

## Namespaces

Namespaces provide separate communication channels.

### Creating Namespaces

```typescript
// Chat namespace
@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: string) {
    this.server.emit('message', data);
  }
}

// Notifications namespace
@WebSocketGateway({ namespace: '/notifications' })
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  sendNotification(userId: string, data: any) {
    this.server.to(`user:${userId}`).emit('notification', data);
  }
}
```

### Client Connection

```typescript
// Connect to different namespaces
const chatSocket = io('http://localhost:3000/chat');
const notifSocket = io('http://localhost:3000/notifications');

chatSocket.on('message', (data) => {
  console.log('Chat:', data);
});

notifSocket.on('notification', (data) => {
  console.log('Notification:', data);
});
```

### Dynamic Namespaces

```typescript
// Server
@WebSocketGateway()
export class DynamicGateway implements OnGatewayInit {
  afterInit(server: Server) {
    const namespace = server.of(/^\/dynamic-\w+$/);

    namespace.on('connection', (socket) => {
      const namespaceName = socket.nsp.name;
      console.log(`Client connected to ${namespaceName}`);
    });
  }
}

// Client connects to dynamic namespace
const socket = io('http://localhost:3000/dynamic-123');
```

## Use Cases

### Chat Rooms

```typescript
@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway {
  @SubscribeMessage('join-chat')
  handleJoin(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`chat:${data.roomId}`);

    // Send room history
    const messages = this.getRecentMessages(data.roomId);
    client.emit('room-history', messages);
  }

  @SubscribeMessage('send-message')
  handleMessage(
    @MessageBody() data: { roomId: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(`chat:${data.roomId}`).emit('new-message', {
      from: client.data.userId,
      message: data.message,
    });
  }
}
```

### Private Channels

```typescript
// Auto-join user to their private room
handleConnection(client: Socket) {
  const userId = client.data.userId;
  client.join(`user:${userId}`);
}

// Send private notification
sendPrivateNotification(userId: string, notification: any) {
  this.server.to(`user:${userId}`).emit('notification', notification);
}
```

### Organization Isolation

```typescript
handleConnection(client: Socket) {
  const { userId, orgId } = client.data;

  // Join organization room
  client.join(`org:${orgId}`);

  // Join role-based rooms
  client.join(`org:${orgId}:${client.data.role}`);
}

// Broadcast to entire organization
broadcastToOrg(orgId: string, event: string, data: any) {
  this.server.to(`org:${orgId}`).emit(event, data);
}
```

## Best Practices

1. **Use consistent naming**: Prefix room names (`user:`, `org:`, `chat:`)
2. **Clean up on disconnect**: Remove users from tracking when they leave
3. **Validate room access**: Check permissions before joining rooms
4. **Use namespaces for features**: Separate chat, notifications, admin, etc.
5. **Document room structure**: Maintain clear documentation of room purposes
