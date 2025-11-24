# Gateways

NestJS WebSocket gateway patterns and implementation guide.

## Gateway Decorators

### @WebSocketGateway

Configure the gateway:

```typescript
@WebSocketGateway({
  namespace: '/events',
  cors: { origin: '*' },
})
export class EventsGateway {}
```

### @WebSocketServer

Inject the Socket.IO server:

```typescript
@WebSocketServer()
server: Server;
```

### @SubscribeMessage

Handle specific events:

```typescript
@SubscribeMessage('message')
handleMessage(@MessageBody() data: string) {
  return { response: 'Message received' };
}
```

## Lifecycle Hooks

```typescript
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  afterInit(server: Server) {
    // Called once on initialization
  }

  handleConnection(client: Socket) {
    // Called for each new connection
  }

  handleDisconnect(client: Socket) {
    // Called when client disconnects
  }
}
```

## Parameter Decorators

### @MessageBody

Extract event payload:

```typescript
@SubscribeMessage('update')
handleUpdate(@MessageBody() data: UpdateDto) {
  // data contains the payload
}
```

### @ConnectedSocket

Access the socket instance:

```typescript
@SubscribeMessage('action')
handleAction(@ConnectedSocket() client: Socket) {
  console.log(`Action from ${client.id}`);
}
```

## Response Patterns

### Direct Return

```typescript
@SubscribeMessage('request')
handleRequest(): { data: string } {
  return { data: 'response' };
}
```

### Observable

```typescript
@SubscribeMessage('stream')
handleStream(): Observable<any> {
  return interval(1000).pipe(
    map(n => ({ tick: n })),
    take(10),
  );
}
```

### Promise

```typescript
@SubscribeMessage('async')
async handleAsync(): Promise<any> {
  const data = await this.service.getData();
  return { data };
}
```

## Broadcasting

```typescript
@WebSocketGateway()
export class BroadcastGateway {
  @WebSocketServer()
  server: Server;

  // Broadcast to all
  broadcastAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Broadcast to room
  broadcastToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  // Broadcast except sender
  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.broadcast.emit('message', data);
  }
}
```

## Using Services

```typescript
@WebSocketGateway()
export class MessagesGateway {
  constructor(
    private messagesService: MessagesService,
    private usersService: UsersService,
  ) {}

  @SubscribeMessage('create-message')
  async handleCreate(
    @MessageBody() dto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.messagesService.create({
      ...dto,
      userId: client.data.userId,
    });

    this.server.to(dto.room).emit('new-message', message);
    return { success: true, message };
  }
}
```

## Multiple Gateways

```typescript
// Chat gateway
@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway {}

// Notifications gateway
@WebSocketGateway({ namespace: '/notifications' })
export class NotificationsGateway {}

// Module
@Module({
  providers: [ChatGateway, NotificationsGateway],
})
export class WebSocketModule {}
```
