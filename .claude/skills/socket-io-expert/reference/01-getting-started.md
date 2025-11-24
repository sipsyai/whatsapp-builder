# Getting Started with Socket.IO

Quick start guide for Socket.IO installation and basic usage.

## Installation

### Server (NestJS)

```bash
npm install @nestjs/websockets @nestjs/platform-socket.io
npm install socket.io
```

### Client

```bash
npm install socket.io-client
```

## Basic Server Setup

```typescript
// events.gateway.ts
import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }
}
```

## Basic Client Setup

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected');
});

socket.emit('message', 'Hello');
```

## Core Concepts

### Events
- **Emit**: Send data from client to server or vice versa
- **Listen**: React to incoming events
- **Broadcast**: Send to all clients except sender

### Rooms
- Group clients together
- Send messages to specific groups
- Join/leave rooms dynamically

### Namespaces
- Separate communication channels
- Isolated event handlers
- Different connection endpoints

## Configuration Options

```typescript
const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  timeout: 10000,
});
```

## Next Steps

- Learn [NestJS Integration](./02-nestjs-integration.md)
- Implement [Authentication](./06-authentication.md)
- Explore [Client Integration](./08-client-integration.md)
