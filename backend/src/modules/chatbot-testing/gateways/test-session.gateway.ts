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
  JoinTestSessionDto,
  LeaveTestSessionDto,
  SendTestMessageDto,
  TestStartedEventDto,
  BotResponseEventDto,
  NodeEnteredEventDto,
  NodeExecutedEventDto,
  NodeExitedEventDto,
  VariableChangedEventDto,
  WaitingInputEventDto,
  FlowSentEventDto,
  FlowResponseEventDto,
  TestCompletedEventDto,
  TestPausedEventDto,
  TestResumedEventDto,
  TestErrorEventDto,
} from './dto/test-gateway.dto';

// ============================================
// GATEWAY
// ============================================

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/test-sessions',
})
@UsePipes(new ValidationPipe())
export class TestSessionGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TestSessionGateway.name);

  // Track connected clients per session
  private readonly sessionClients = new Map<string, Set<string>>(); // sessionId -> Set of socketIds
  private readonly socketToUser = new Map<string, string>(); // socketId -> userId

  // ============================================
  // LIFECYCLE HOOKS
  // ============================================

  afterInit(server: Server) {
    this.logger.log('TestSession WebSocket Gateway initialized on namespace /test-sessions');
  }

  handleConnection(client: Socket) {
    const userId = this.getUserIdFromSocket(client);

    if (!userId) {
      this.logger.warn(`Client ${client.id} connected without authentication`);
      // Allow connection but track as anonymous
    }

    this.logger.log(`Client connected: ${client.id} (User: ${userId || 'anonymous'})`);

    if (userId) {
      this.socketToUser.set(client.id, userId);
    }

    // Emit connection success
    client.emit('test:connected', {
      socketId: client.id,
      userId: userId || 'anonymous',
      timestamp: new Date(),
    });
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketToUser.get(client.id);

    // Remove from all session rooms tracking
    this.sessionClients.forEach((clients, sessionId) => {
      if (clients.has(client.id)) {
        clients.delete(client.id);
        this.logger.debug(`Removed client ${client.id} from session ${sessionId}`);

        // If no more clients in session, cleanup
        if (clients.size === 0) {
          this.sessionClients.delete(sessionId);
        }
      }
    });

    this.socketToUser.delete(client.id);

    this.logger.log(`Client disconnected: ${client.id} (User: ${userId || 'anonymous'})`);
  }

  // ============================================
  // CLIENT -> SERVER EVENT HANDLERS
  // ============================================

  /**
   * Join a test session room
   * Room format: test:session:{sessionId}
   */
  @SubscribeMessage('test:join')
  async handleJoin(
    @MessageBody() data: JoinTestSessionDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { sessionId } = data;
    const userId = this.socketToUser.get(client.id) || 'anonymous';
    const roomName = this.getRoomName(sessionId);

    // Join the room
    await client.join(roomName);

    // Track client in session
    if (!this.sessionClients.has(sessionId)) {
      this.sessionClients.set(sessionId, new Set());
    }
    this.sessionClients.get(sessionId)!.add(client.id);

    this.logger.log(`User ${userId} joined test session room: ${roomName}`);

    return {
      event: 'test:joined',
      data: {
        sessionId,
        success: true,
        timestamp: new Date(),
      },
    };
  }

  /**
   * Leave a test session room
   */
  @SubscribeMessage('test:leave')
  async handleLeave(
    @MessageBody() data: LeaveTestSessionDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { sessionId } = data;
    const userId = this.socketToUser.get(client.id) || 'anonymous';
    const roomName = this.getRoomName(sessionId);

    // Leave the room
    await client.leave(roomName);

    // Remove from tracking
    const clients = this.sessionClients.get(sessionId);
    if (clients) {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.sessionClients.delete(sessionId);
      }
    }

    this.logger.log(`User ${userId} left test session room: ${roomName}`);

    return {
      event: 'test:left',
      data: {
        sessionId,
        success: true,
        timestamp: new Date(),
      },
    };
  }

  /**
   * Send a message in test session (user input)
   */
  @SubscribeMessage('test:send-message')
  async handleSendMessage(
    @MessageBody() data: SendTestMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { sessionId, message, buttonId, listRowId, flowResponse } = data;
    const userId = this.socketToUser.get(client.id) || 'anonymous';

    this.logger.log(
      `User ${userId} sent message in session ${sessionId}: ${message.substring(0, 50)}...`,
    );

    // Emit message received to the room (including sender for confirmation)
    const roomName = this.getRoomName(sessionId);
    this.server.to(roomName).emit('test:message-received', {
      sessionId,
      message,
      buttonId,
      listRowId,
      flowResponse,
      userId,
      timestamp: new Date(),
    });

    return {
      event: 'test:message-sent',
      data: {
        sessionId,
        success: true,
        timestamp: new Date(),
      },
    };
  }

  // ============================================
  // SERVER -> CLIENT EMIT METHODS
  // ============================================

  /**
   * Emit when test session starts
   */
  emitTestStarted(sessionId: string, data: Omit<TestStartedEventDto, 'sessionId'>) {
    const roomName = this.getRoomName(sessionId);

    const payload: TestStartedEventDto = {
      sessionId,
      ...data,
    };

    this.server.to(roomName).emit('test:started', payload);

    this.logger.log(
      `Test started event emitted for session ${sessionId} (Chatbot: ${data.chatbotName})`,
    );
  }

  /**
   * Emit bot response message
   */
  emitBotResponse(sessionId: string, message: BotResponseEventDto['message']) {
    const roomName = this.getRoomName(sessionId);

    const payload: BotResponseEventDto = {
      sessionId,
      message,
    };

    this.server.to(roomName).emit('test:bot-response', payload);

    this.logger.debug(`Bot response emitted for session ${sessionId}`);
  }

  /**
   * Emit when entering a node
   */
  emitNodeEntered(sessionId: string, nodeId: string, nodeType: string, nodeLabel?: string) {
    const roomName = this.getRoomName(sessionId);

    const payload: NodeEnteredEventDto = {
      sessionId,
      nodeId,
      nodeType,
      nodeLabel,
      timestamp: new Date(),
    };

    this.server.to(roomName).emit('test:node-entered', payload);

    this.logger.debug(`Node entered: ${nodeId} (${nodeType}) in session ${sessionId}`);
  }

  /**
   * Emit when node execution completes
   */
  emitNodeExecuted(sessionId: string, nodeId: string, result: NodeExecutedEventDto['result']) {
    const roomName = this.getRoomName(sessionId);

    const payload: NodeExecutedEventDto = {
      sessionId,
      nodeId,
      result,
    };

    this.server.to(roomName).emit('test:node-executed', payload);

    this.logger.debug(
      `Node executed: ${nodeId} (success: ${result.success}) in session ${sessionId}`,
    );
  }

  /**
   * Emit when exiting a node
   */
  emitNodeExited(sessionId: string, nodeId: string, nextNodeId?: string | null) {
    const roomName = this.getRoomName(sessionId);

    const payload: NodeExitedEventDto = {
      sessionId,
      nodeId,
      nextNodeId,
    };

    this.server.to(roomName).emit('test:node-exited', payload);

    this.logger.debug(`Node exited: ${nodeId} -> ${nextNodeId || 'end'} in session ${sessionId}`);
  }

  /**
   * Emit when a variable changes
   */
  emitVariableChanged(
    sessionId: string,
    variableName: string,
    newValue: any,
    oldValue?: any,
    source?: 'node' | 'api' | 'flow' | 'manual',
  ) {
    const roomName = this.getRoomName(sessionId);

    const payload: VariableChangedEventDto = {
      sessionId,
      variableName,
      oldValue,
      newValue,
      source,
    };

    this.server.to(roomName).emit('test:variable-changed', payload);

    this.logger.debug(`Variable changed: ${variableName} in session ${sessionId}`);
  }

  /**
   * Emit when waiting for user input
   */
  emitWaitingInput(
    sessionId: string,
    inputType: WaitingInputEventDto['inputType'],
    options?: WaitingInputEventDto['options'],
  ) {
    const roomName = this.getRoomName(sessionId);

    const payload: WaitingInputEventDto = {
      sessionId,
      inputType,
      options,
    };

    this.server.to(roomName).emit('test:waiting-input', payload);

    this.logger.debug(`Waiting for ${inputType} input in session ${sessionId}`);
  }

  /**
   * Emit when WhatsApp Flow is sent
   */
  emitFlowSent(sessionId: string, flowId: string, flowData?: any) {
    const roomName = this.getRoomName(sessionId);

    const payload: FlowSentEventDto = {
      sessionId,
      flowId,
      flowData,
    };

    this.server.to(roomName).emit('test:flow-sent', payload);

    this.logger.debug(`Flow sent: ${flowId} in session ${sessionId}`);
  }

  /**
   * Emit when WhatsApp Flow response is received
   */
  emitFlowResponse(sessionId: string, flowId: string, flowData: Record<string, any>) {
    const roomName = this.getRoomName(sessionId);

    const payload: FlowResponseEventDto = {
      sessionId,
      flowId,
      flowData,
    };

    this.server.to(roomName).emit('test:flow-response', payload);

    this.logger.debug(`Flow response received: ${flowId} in session ${sessionId}`);
  }

  /**
   * Emit when test session completes
   */
  emitTestCompleted(
    sessionId: string,
    reason: TestCompletedEventDto['reason'],
    summary: TestCompletedEventDto['summary'],
  ) {
    const roomName = this.getRoomName(sessionId);

    const payload: TestCompletedEventDto = {
      sessionId,
      reason,
      summary,
    };

    this.server.to(roomName).emit('test:completed', payload);

    this.logger.log(
      `Test completed for session ${sessionId} (Reason: ${reason}, Duration: ${summary.duration}ms)`,
    );
  }

  /**
   * Emit when test session is paused
   */
  emitTestPaused(sessionId: string, atNodeId?: string | null) {
    const roomName = this.getRoomName(sessionId);

    const payload: TestPausedEventDto = {
      sessionId,
      atNodeId,
    };

    this.server.to(roomName).emit('test:paused', payload);

    this.logger.debug(`Test paused at node ${atNodeId || 'unknown'} in session ${sessionId}`);
  }

  /**
   * Emit when test session is resumed
   */
  emitTestResumed(sessionId: string) {
    const roomName = this.getRoomName(sessionId);

    const payload: TestResumedEventDto = {
      sessionId,
    };

    this.server.to(roomName).emit('test:resumed', payload);

    this.logger.debug(`Test resumed in session ${sessionId}`);
  }

  /**
   * Emit error in test session
   */
  emitError(sessionId: string, error: string, nodeId?: string, recoverable: boolean = true) {
    const roomName = this.getRoomName(sessionId);

    const payload: TestErrorEventDto = {
      sessionId,
      error,
      nodeId,
      recoverable,
    };

    this.server.to(roomName).emit('test:error', payload);

    this.logger.error(`Error in session ${sessionId}: ${error}`);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Get room name for a session
   */
  private getRoomName(sessionId: string): string {
    return `test:session:${sessionId}`;
  }

  /**
   * Get user ID from socket authentication
   */
  private getUserIdFromSocket(client: Socket): string | null {
    // Try auth token first
    const token = client.handshake.auth?.token;
    if (token) {
      // TODO: Validate JWT and extract userId
      // const decoded = this.jwtService.verify(token);
      // return decoded.userId;
    }

    // Fallback to query param for development
    const userId = client.handshake.query.userId as string;
    return userId || null;
  }

  // ============================================
  // UTILITY GETTERS
  // ============================================

  /**
   * Get number of clients connected to a session
   */
  getSessionClientCount(sessionId: string): number {
    return this.sessionClients.get(sessionId)?.size || 0;
  }

  /**
   * Check if a session has any connected clients
   */
  hasConnectedClients(sessionId: string): boolean {
    return this.getSessionClientCount(sessionId) > 0;
  }

  /**
   * Get all active session IDs
   */
  getActiveSessionIds(): string[] {
    return Array.from(this.sessionClients.keys());
  }

  /**
   * Get total connected client count
   */
  getTotalConnectedClients(): number {
    return this.socketToUser.size;
  }
}
