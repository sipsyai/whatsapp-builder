import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  SessionStartedDto,
  SessionStatusDto,
  SessionCompletedDto,
  JoinSessionDto,
} from './dto';
import { WsExceptionFilter } from './filters/ws-exception.filter';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/sessions',
})
@UseFilters(new WsExceptionFilter())
@UsePipes(new ValidationPipe())
export class SessionGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SessionGateway.name);
  private readonly userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

  afterInit(server: Server) {
    this.logger.log('Session WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    const userId = this.getUserIdFromSocket(client) || `anonymous-${client.id}`;

    if (!client.handshake.query.userId) {
      this.logger.warn(`Client ${client.id} connected without authentication (using anonymous mode)`);
    }

    this.logger.log(`Client connected: ${client.id} (User: ${userId})`);

    // Track user socket
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);

    // Store userId on socket for later use
    (client as any).userId = userId;
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId || this.getUserIdFromSocket(client);

    if (userId) {
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);

        // If user has no more connections, remove from map
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Subscribe to all session updates
   * Client joins 'sessions' room to receive all session events
   */
  @SubscribeMessage('sessions:subscribe')
  handleSubscribeSessions(@ConnectedSocket() client: Socket) {
    const userId = (client as any).userId || 'anonymous';

    client.join('sessions');
    this.logger.log(`User ${userId} subscribed to all session updates`);

    return {
      event: 'sessions:subscribed',
      data: { success: true },
    };
  }

  /**
   * Unsubscribe from all session updates
   */
  @SubscribeMessage('sessions:unsubscribe')
  handleUnsubscribeSessions(@ConnectedSocket() client: Socket) {
    const userId = (client as any).userId || 'anonymous';

    client.leave('sessions');
    this.logger.log(`User ${userId} unsubscribed from session updates`);

    return {
      event: 'sessions:unsubscribed',
      data: { success: true },
    };
  }

  /**
   * Join a specific session room
   * Client joins 'session:{sessionId}' room to receive updates for a specific session
   */
  @SubscribeMessage('session:join')
  handleJoinSession(
    @MessageBody() data: JoinSessionDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { sessionId } = data;
    const userId = (client as any).userId || 'anonymous';

    client.join(`session:${sessionId}`);
    this.logger.log(`User ${userId} joined session ${sessionId}`);

    return {
      event: 'session:joined',
      data: { sessionId, success: true },
    };
  }

  /**
   * Leave a specific session room
   */
  @SubscribeMessage('session:leave')
  handleLeaveSession(
    @MessageBody() data: JoinSessionDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { sessionId } = data;
    const userId = (client as any).userId || 'anonymous';

    client.leave(`session:${sessionId}`);
    this.logger.log(`User ${userId} left session ${sessionId}`);

    return {
      event: 'session:left',
      data: { sessionId, success: true },
    };
  }

  /**
   * Emit session started event
   * Broadcasts to 'sessions' room (all subscribers)
   */
  emitSessionStarted(data: SessionStartedDto) {
    const { sessionId } = data;

    this.server.to('sessions').emit('session:started', data);

    this.logger.log(
      `Session started event emitted for session ${sessionId} (Chatbot: ${data.chatbotName})`,
    );
  }

  /**
   * Emit session status changed event
   * Broadcasts to both 'sessions' room and specific 'session:{sessionId}' room
   */
  emitSessionStatusChanged(data: SessionStatusDto) {
    const { sessionId, previousStatus, newStatus } = data;

    // Emit to general sessions room
    this.server.to('sessions').emit('session:status-changed', data);

    // Emit to specific session room
    this.server.to(`session:${sessionId}`).emit('session:status-changed', data);

    this.logger.log(
      `Session status changed for ${sessionId}: ${previousStatus} -> ${newStatus}`,
    );
  }

  /**
   * Emit session completed event
   * Broadcasts to both 'sessions' room and specific 'session:{sessionId}' room
   */
  emitSessionCompleted(data: SessionCompletedDto) {
    const { sessionId, completionReason, duration } = data;

    // Emit to general sessions room
    this.server.to('sessions').emit('session:completed', data);

    // Emit to specific session room
    this.server.to(`session:${sessionId}`).emit('session:completed', data);

    this.logger.log(
      `Session completed event emitted for session ${sessionId} (Reason: ${completionReason}, Duration: ${duration}ms)`,
    );
  }

  /**
   * Get user ID from socket authentication
   * In production, this should extract from JWT token
   */
  private getUserIdFromSocket(client: Socket): string | null {
    // For development: extract from handshake query
    // In production: decode JWT token from handshake.auth.token
    const userId = client.handshake.query.userId as string;

    // TODO: Implement proper JWT validation
    // const token = client.handshake.auth.token;
    // const decoded = this.jwtService.verify(token);
    // return decoded.userId;

    return userId || null;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  /**
   * Get all online users
   */
  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  /**
   * Get count of clients subscribed to sessions
   */
  getSessionsSubscriberCount(): number {
    const room = this.server.of('/sessions').adapter.rooms.get('sessions');
    return room ? room.size : 0;
  }

  /**
   * Get count of clients subscribed to a specific session
   */
  getSessionSubscriberCount(sessionId: string): number {
    const room = this.server.of('/sessions').adapter.rooms.get(`session:${sessionId}`);
    return room ? room.size : 0;
  }
}
