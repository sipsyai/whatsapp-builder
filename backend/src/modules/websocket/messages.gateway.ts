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
  MessageReceivedDto,
  MessageStatusDto,
  TypingIndicatorDto,
  JoinConversationDto,
} from './dto';
import { WsExceptionFilter } from './filters/ws-exception.filter';

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
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private readonly userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

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

    this.logger.log(`Client connected: ${client.id} (User: ${userId})`);

    // Track user socket
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);

    // Notify user is online
    client.broadcast.emit('user:online', { userId });
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

  /**
   * Join a conversation room
   */
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

  /**
   * Leave a conversation room
   */
  @SubscribeMessage('conversation:leave')
  handleLeaveConversation(
    @MessageBody() data: JoinConversationDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { conversationId } = data;
    const userId = this.getUserIdFromSocket(client);

    client.leave(`conversation:${conversationId}`);
    this.logger.log(`User ${userId} left conversation ${conversationId}`);

    return {
      event: 'conversation:left',
      data: { conversationId, success: true },
    };
  }

  /**
   * Handle typing start event
   */
  @SubscribeMessage('typing:start')
  handleTypingStart(
    @MessageBody() data: TypingIndicatorDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    const { conversationId } = data;

    // Broadcast to others in the conversation
    client.to(`conversation:${conversationId}`).emit('typing:start', {
      conversationId,
      userId,
      isTyping: true,
    });

    this.logger.debug(`User ${userId} started typing in ${conversationId}`);
  }

  /**
   * Handle typing stop event
   */
  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @MessageBody() data: TypingIndicatorDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    const { conversationId } = data;

    // Broadcast to others in the conversation
    client.to(`conversation:${conversationId}`).emit('typing:stop', {
      conversationId,
      userId,
      isTyping: false,
    });

    this.logger.debug(`User ${userId} stopped typing in ${conversationId}`);
  }

  /**
   * Emit new message to conversation participants
   */
  emitMessageReceived(data: MessageReceivedDto) {
    const { conversationId } = data;

    this.server.to(`conversation:${conversationId}`).emit('message:received', data);

    this.logger.log(`Message ${data.messageId} emitted to conversation ${conversationId}`);
  }

  /**
   * Emit message status update to conversation participants
   */
  emitMessageStatus(data: MessageStatusDto) {
    const { conversationId } = data;

    this.server.to(`conversation:${conversationId}`).emit('message:status', data);

    this.logger.debug(`Message status update for ${data.messageId}: ${data.status}`);
  }

  /**
   * Emit typing indicator to conversation participants
   */
  emitTypingIndicator(data: TypingIndicatorDto) {
    const { conversationId, isTyping } = data;
    const event = isTyping ? 'typing:start' : 'typing:stop';

    this.server.to(`conversation:${conversationId}`).emit(event, data);
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
}
