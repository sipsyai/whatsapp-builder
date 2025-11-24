# Socket.IO Expert Skill

Expert assistance for building real-time applications with Socket.IO, NestJS WebSocket gateways, and modern frontend integrations.

## What This Skill Covers

### Core Topics
- **Socket.IO Setup** - Installation, configuration, and basic usage
- **NestJS Gateways** - WebSocket gateway implementation with decorators
- **Real-time Communication** - Event emission, broadcasting, and acknowledgments
- **Rooms & Namespaces** - Client organization and message targeting
- **Authentication** - JWT-based WebSocket authentication
- **Client Integration** - React hooks and frontend patterns
- **Production Patterns** - Performance, security, and best practices

### Use Cases
- Real-time chat applications
- Live notifications systems
- Collaborative editing tools
- Real-time dashboards
- Gaming servers
- Live streaming features
- IoT device communication

## Quick Reference

### Server (NestJS)

```typescript
@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: string) {
    this.server.emit('message', data);
  }
}
```

### Client (React)

```typescript
const socket = io('http://localhost:3000');

socket.on('message', (data) => {
  console.log(data);
});

socket.emit('message', 'Hello!');
```

## Documentation Structure

- **[SKILL.md](SKILL.md)** - Complete skill reference with examples
- **reference/** - Detailed topic-specific documentation
  - Getting started and installation
  - NestJS integration patterns
  - Gateway implementation
  - Rooms and namespaces
  - Event handling
  - Authentication strategies
  - Middleware patterns
  - Client-side integration
  - Production best practices

## When to Use This Skill

Use the Socket.IO Expert skill when:
- Building real-time features in NestJS applications
- Implementing WebSocket communication
- Creating chat or messaging systems
- Building live collaboration tools
- Implementing live notifications
- Working with `@nestjs/websockets` or `socket.io`
- Integrating Socket.IO with React or other frontends
- Troubleshooting WebSocket connection issues

## Key Features

### NestJS Integration
- Gateway decorators (@WebSocketGateway, @SubscribeMessage)
- Lifecycle hooks (OnGatewayInit, OnGatewayConnection)
- Dependency injection with services
- Integration with authentication guards
- Module configuration patterns

### Real-time Patterns
- Event-based communication
- Room-based messaging
- Namespace isolation
- Broadcast strategies
- Acknowledgment callbacks
- Typed events with TypeScript

### Security
- JWT authentication for WebSockets
- Handshake authentication
- Token validation
- CORS configuration
- Rate limiting
- Input validation with DTOs

### Client Integration
- React hooks for Socket.IO
- Connection management
- Event listener patterns
- Error handling
- Reconnection strategies
- TypeScript typing

## Example Workflows

### Implementing a Chat System
1. Create WebSocket gateway with authentication
2. Implement join/leave room handlers
3. Add message broadcasting logic
4. Create React component with socket hook
5. Handle connection states in UI
6. Implement message persistence
7. Add typing indicators
8. Test with multiple clients

### Adding Real-time Notifications
1. Create notifications namespace
2. Implement user-specific rooms
3. Add notification emission from services
4. Create React notification component
5. Handle notification state
6. Add sound/visual alerts
7. Implement notification history
8. Test notification delivery

## Related Skills

- **nestjs-expert** - For NestJS architecture and patterns
- **typeorm-development** - For persisting messages and data
- **react-expert** - For client-side implementation
- **postgresql-expert** - For message storage and queries

## Resources

### Official Documentation
- [Socket.IO Documentation](https://socket.io/docs/)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)

### Learning Path
1. Start with [reference/01-getting-started.md](reference/01-getting-started.md)
2. Learn NestJS integration: [reference/02-nestjs-integration.md](reference/02-nestjs-integration.md)
3. Implement authentication: [reference/06-authentication.md](reference/06-authentication.md)
4. Add client integration: [reference/08-client-integration.md](reference/08-client-integration.md)
5. Follow best practices: [reference/09-best-practices.md](reference/09-best-practices.md)

## Contributing

This skill is maintained as part of the project's development tools. Updates should reflect:
- Latest Socket.IO features
- NestJS WebSocket patterns
- Real-world project examples
- Production-tested best practices

---

**Version:** 1.0.0
**Last Updated:** 2024-11-24
**Maintainer:** Development Team
