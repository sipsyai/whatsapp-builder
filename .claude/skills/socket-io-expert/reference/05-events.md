# Events

Event handling patterns and best practices for Socket.IO.

## Emitting Events

### From Server

```typescript
// To all clients
this.server.emit('event', data);

// To specific client
this.server.to(clientId).emit('event', data);

// To room
this.server.to('room-name').emit('event', data);

// To multiple rooms
this.server.to(['room1', 'room2']).emit('event', data);

// Volatile (drop if not ready)
this.server.volatile.emit('event', data);
```

### From Client

```typescript
// Emit event
socket.emit('event', data);

// Emit with callback
socket.emit('event', data, (response) => {
  console.log(response);
});

// Emit to specific room (server-side only)
socket.to('room-name').emit('event', data);
```

## Listening to Events

### Server-Side

```typescript
@SubscribeMessage('message')
handleMessage(
  @MessageBody() data: MessageDto,
  @ConnectedSocket() client: Socket,
) {
  // Handle message
  return { received: true };
}
```

### Client-Side

```typescript
// Listen to event
socket.on('event', (data) => {
  console.log(data);
});

// Listen once
socket.once('event', (data) => {
  console.log('This runs only once');
});

// Remove listener
socket.off('event');
socket.off('event', specificHandler);
```

## Built-in Events

### Connection Events

```typescript
// Server
socket.on('connection', (client) => {});
socket.on('disconnect', (reason) => {});

// Client
socket.on('connect', () => {});
socket.on('disconnect', (reason) => {});
socket.on('connect_error', (error) => {});
```

### Reconnection Events

```typescript
socket.on('reconnect', (attemptNumber) => {});
socket.on('reconnect_attempt', (attemptNumber) => {});
socket.on('reconnect_error', (error) => {});
socket.on('reconnect_failed', () => {});
```

## Acknowledgments

### Server Requesting Ack

```typescript
@SubscribeMessage('request')
handleRequest(): { status: string } {
  return { status: 'success' };
}
```

### Client Receiving Ack

```typescript
socket.emit('request', data, (response) => {
  console.log('Server responded:', response);
});
```

## Event Namespaces

Events are scoped to namespaces:

```typescript
// Different namespaces = isolated events
const chatSocket = io('/chat');
const notifSocket = io('/notifications');

chatSocket.on('message', handleChatMessage);
notifSocket.on('message', handleNotifMessage);
```

## Error Handling

```typescript
// Server
@SubscribeMessage('action')
handleAction(@MessageBody() data: any) {
  if (!data.valid) {
    throw new WsException('Invalid data');
  }
  return { success: true };
}

// Client
socket.on('exception', (error) => {
  console.error('Server error:', error);
});
```

## Wildcard Events

```typescript
// Listen to all events
socket.onAny((eventName, ...args) => {
  console.log(`Event ${eventName}:`, args);
});

// Remove wildcard listener
socket.offAny();
```

## Binary Events

```typescript
// Send binary data
const buffer = Buffer.from('binary data');
socket.emit('binary', buffer);

// Receive binary
socket.on('binary', (data) => {
  // data is Buffer
});
```
