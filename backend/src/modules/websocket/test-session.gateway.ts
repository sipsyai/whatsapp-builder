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
import { Logger, UseFilters, UsePipes, ValidationPipe, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { WsExceptionFilter } from './filters/ws-exception.filter';
import { TestSessionService } from '../chatbot-testing/services/test-session.service';

// ============================================
// INTERFACES & TYPES
// ============================================

export interface TestMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  messageType: 'text' | 'interactive' | 'flow' | 'media';
  nodeId?: string;
  timestamp: Date;
}

export interface NodeExecution {
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  enteredAt: Date;
  exitedAt?: Date;
  duration?: number;
  result?: 'success' | 'error' | 'skipped';
  error?: string;
}

export interface TestSessionState {
  testSessionId: string;
  chatbotId: string;
  chatbotName: string;
  userId: string;
  status: 'initializing' | 'running' | 'paused' | 'waiting_input' | 'completed' | 'error';
  currentNodeId: string | null;
  currentNodeLabel: string | null;
  variables: Record<string, any>;
  messages: TestMessage[];
  executionHistory: NodeExecution[];
  createdAt: Date;
  lastActivityAt: Date;
  completionReason?: string;
}

// ============================================
// DTOs
// ============================================

interface StartTestDto {
  chatbotId: string;
  initialVariables?: Record<string, any>;
  config?: {
    simulateDelay?: boolean;
    delayMs?: number;
  };
}

interface SendMessageDto {
  testSessionId: string;
  message: string;
  messageType?: 'text' | 'interactive' | 'flow';
}

interface SetVariableDto {
  testSessionId: string;
  key: string;
  value: any;
}

interface TestSessionActionDto {
  testSessionId: string;
}

interface RejoinTestDto {
  testSessionId: string;
  lastEventId?: string;
}

// ============================================
// GATEWAY
// ============================================

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/test-sessions',
})
@UseFilters(new WsExceptionFilter())
@UsePipes(new ValidationPipe())
export class TestSessionGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TestSessionGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => TestSessionService))
    private readonly testSessionService: TestSessionService,
  ) {}

  // State management
  private readonly testSessions = new Map<string, TestSessionState>();
  private readonly userSockets = new Map<string, Set<string>>(); // userId -> socketIds
  private readonly socketToUser = new Map<string, string>(); // socketId -> userId

  // Event history for reconnection (limited buffer)
  private readonly eventHistory = new Map<string, Array<{ id: string; event: string; data: any; timestamp: Date }>>();
  private readonly MAX_EVENT_HISTORY = 100;

  // Rate limiting (simple in-memory, use Redis in production)
  private readonly rateLimits = new Map<string, { count: number; resetAt: number }>();

  // ============================================
  // LIFECYCLE HOOKS
  // ============================================

  afterInit(server: Server) {
    this.logger.log('Test Session WebSocket Gateway initialized');

    // Cleanup old sessions periodically (every 5 minutes)
    setInterval(() => this.cleanupStaleSessions(), 5 * 60 * 1000);
  }

  handleConnection(client: Socket) {
    const userId = this.getUserIdFromSocket(client);

    if (!userId) {
      this.logger.warn(`Client ${client.id} connected without authentication`);
      client.emit('test:error', { error: 'Authentication required', code: 'AUTH_REQUIRED' });
      client.disconnect();
      return;
    }

    this.logger.log(`Client connected: ${client.id} (User: ${userId})`);

    // Track user socket
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);
    this.socketToUser.set(client.id, userId);

    // Join user-specific room
    client.join(`user:${userId}:tests`);

    // Notify client of successful connection
    client.emit('test:connected', { userId });
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketToUser.get(client.id);

    if (userId) {
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }
      this.socketToUser.delete(client.id);
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ============================================
  // TEST SESSION MANAGEMENT
  // ============================================

  @SubscribeMessage('test:start')
  async handleStartTest(
    @MessageBody() data: StartTestDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketToUser.get(client.id);

    if (!userId) {
      return { event: 'test:error', data: { error: 'Not authenticated' } };
    }

    // Rate limiting check
    if (!this.checkRateLimit(`${userId}:test:start`, 10, 60000)) {
      return { event: 'test:error', data: { error: 'Rate limit exceeded', code: 'RATE_LIMITED' } };
    }

    // TODO: Validate chatbot exists and user has access
    // const chatbot = await this.chatbotsService.findOne(data.chatbotId);

    const testSessionId = this.generateTestSessionId();

    // Initialize session state
    const sessionState: TestSessionState = {
      testSessionId,
      chatbotId: data.chatbotId,
      chatbotName: 'Test Chatbot', // TODO: Get from service
      userId,
      status: 'initializing',
      currentNodeId: null,
      currentNodeLabel: null,
      variables: data.initialVariables || {},
      messages: [],
      executionHistory: [],
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };

    this.testSessions.set(testSessionId, sessionState);
    this.eventHistory.set(testSessionId, []);

    // Join test session room
    await client.join(`test:session:${testSessionId}`);

    // Emit started event
    const startedData = {
      testSessionId,
      chatbotId: data.chatbotId,
      chatbotName: sessionState.chatbotName,
      startedAt: sessionState.createdAt,
    };

    this.emitToSession(testSessionId, 'test:started', startedData);

    // TODO: Start chatbot execution from start node
    // await this.chatbotExecutionService.startTest(testSessionId, data.chatbotId);

    this.logger.log(`Test session started: ${testSessionId} (User: ${userId}, Chatbot: ${data.chatbotId})`);

    return { event: 'test:started', data: startedData };
  }

  @SubscribeMessage('test:send-message')
  async handleSendMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketToUser.get(client.id);
    const session = this.testSessions.get(data.testSessionId);

    if (!session) {
      return { event: 'test:error', data: { error: 'Session not found' } };
    }

    if (session.userId !== userId) {
      return { event: 'test:error', data: { error: 'Not authorized for this session' } };
    }

    // Rate limiting
    if (!this.checkRateLimit(`${userId}:test:send-message`, 30, 60000)) {
      return { event: 'test:error', data: { error: 'Rate limit exceeded' } };
    }

    if (session.status !== 'waiting_input' && session.status !== 'running') {
      return { event: 'test:error', data: { error: 'Session not accepting input', status: session.status } };
    }

    // Create message
    const message: TestMessage = {
      id: this.generateMessageId(),
      direction: 'inbound',
      content: data.message,
      messageType: data.messageType || 'text',
      timestamp: new Date(),
    };

    // Update session
    session.messages.push(message);
    session.lastActivityAt = new Date();
    session.status = 'running';

    // Emit message received
    this.emitToSession(data.testSessionId, 'test:message-received', {
      testSessionId: data.testSessionId,
      message,
    });

    // TODO: Process message through chatbot engine
    // await this.chatbotExecutionService.processMessage(data.testSessionId, message);

    this.logger.log(`Message sent in test session ${data.testSessionId}: ${data.message.substring(0, 50)}...`);

    return { event: 'test:message-sent', data: { messageId: message.id } };
  }

  @SubscribeMessage('test:set-variable')
  handleSetVariable(
    @MessageBody() data: SetVariableDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketToUser.get(client.id);
    const session = this.testSessions.get(data.testSessionId);

    if (!session || session.userId !== userId) {
      return { event: 'test:error', data: { error: 'Session not found or not authorized' } };
    }

    // Rate limiting
    if (!this.checkRateLimit(`${userId}:test:set-variable`, 60, 60000)) {
      return { event: 'test:error', data: { error: 'Rate limit exceeded' } };
    }

    const oldValue = session.variables[data.key];
    session.variables[data.key] = data.value;
    session.lastActivityAt = new Date();

    // Emit variable changed
    this.emitToSession(data.testSessionId, 'test:variable-changed', {
      testSessionId: data.testSessionId,
      key: data.key,
      oldValue,
      newValue: data.value,
      source: 'manual',
    });

    return { event: 'test:variable-set', data: { key: data.key, value: data.value } };
  }

  @SubscribeMessage('test:pause')
  handlePauseTest(
    @MessageBody() data: TestSessionActionDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketToUser.get(client.id);
    const session = this.testSessions.get(data.testSessionId);

    if (!session || session.userId !== userId) {
      return { event: 'test:error', data: { error: 'Session not found or not authorized' } };
    }

    if (session.status !== 'running' && session.status !== 'waiting_input') {
      return { event: 'test:error', data: { error: 'Cannot pause session in current state' } };
    }

    session.status = 'paused';
    session.lastActivityAt = new Date();

    this.emitToSession(data.testSessionId, 'test:paused', {
      testSessionId: data.testSessionId,
      atNodeId: session.currentNodeId,
    });

    return { event: 'test:paused', data: { success: true } };
  }

  @SubscribeMessage('test:resume')
  handleResumeTest(
    @MessageBody() data: TestSessionActionDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketToUser.get(client.id);
    const session = this.testSessions.get(data.testSessionId);

    if (!session || session.userId !== userId) {
      return { event: 'test:error', data: { error: 'Session not found or not authorized' } };
    }

    if (session.status !== 'paused') {
      return { event: 'test:error', data: { error: 'Session is not paused' } };
    }

    session.status = 'running';
    session.lastActivityAt = new Date();

    this.emitToSession(data.testSessionId, 'test:resumed', {
      testSessionId: data.testSessionId,
    });

    // TODO: Continue chatbot execution
    // await this.chatbotExecutionService.resume(data.testSessionId);

    return { event: 'test:resumed', data: { success: true } };
  }

  @SubscribeMessage('test:stop')
  handleStopTest(
    @MessageBody() data: TestSessionActionDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketToUser.get(client.id);
    const session = this.testSessions.get(data.testSessionId);

    if (!session || session.userId !== userId) {
      return { event: 'test:error', data: { error: 'Session not found or not authorized' } };
    }

    this.completeSession(data.testSessionId, 'user_stopped');

    return { event: 'test:stopped', data: { success: true } };
  }

  @SubscribeMessage('test:reset')
  async handleResetTest(
    @MessageBody() data: TestSessionActionDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketToUser.get(client.id);
    const session = this.testSessions.get(data.testSessionId);

    if (!session || session.userId !== userId) {
      return { event: 'test:error', data: { error: 'Session not found or not authorized' } };
    }

    // Rate limiting
    if (!this.checkRateLimit(`${userId}:test:reset`, 5, 60000)) {
      return { event: 'test:error', data: { error: 'Rate limit exceeded' } };
    }

    // Reset session state
    session.status = 'initializing';
    session.currentNodeId = null;
    session.currentNodeLabel = null;
    session.variables = {};
    session.messages = [];
    session.executionHistory = [];
    session.lastActivityAt = new Date();
    session.completionReason = undefined;

    // Clear event history
    this.eventHistory.set(data.testSessionId, []);

    this.emitToSession(data.testSessionId, 'test:reset', {
      testSessionId: data.testSessionId,
    });

    // TODO: Restart chatbot from beginning
    // await this.chatbotExecutionService.restart(data.testSessionId);

    this.logger.log(`Test session reset: ${data.testSessionId}`);

    return { event: 'test:reset', data: { success: true } };
  }

  // ============================================
  // ROOM MANAGEMENT
  // ============================================

  @SubscribeMessage('test:join')
  async handleJoinTest(
    @MessageBody() data: TestSessionActionDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketToUser.get(client.id);

    if (!userId) {
      return { event: 'test:error', data: { error: 'Not authenticated' } };
    }

    try {
      // Look up session from TestSessionService (which uses DB)
      const sessionState = await this.testSessionService.getTestState(data.testSessionId);

      // Store in local map for tracking WebSocket-specific state
      // This allows the gateway to track active connections and emit events
      if (!this.testSessions.has(data.testSessionId)) {
        this.testSessions.set(data.testSessionId, {
          testSessionId: sessionState.sessionId,
          chatbotId: sessionState.chatbotId,
          chatbotName: sessionState.chatbotName,
          userId, // Track which user joined via WebSocket
          status: sessionState.status as any,
          currentNodeId: sessionState.currentNodeId,
          currentNodeLabel: sessionState.currentNodeLabel || null,
          variables: sessionState.variables,
          messages: sessionState.messages.map(msg => ({
            id: msg.id,
            direction: msg.direction === 'incoming' ? 'inbound' : 'outbound',
            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
            messageType: msg.type as any,
            nodeId: msg.nodeId,
            timestamp: msg.timestamp,
          })),
          executionHistory: sessionState.nodeOutputs.map(output => ({
            nodeId: output.nodeId,
            nodeType: output.nodeType,
            nodeLabel: output.nodeLabel || output.nodeId,
            enteredAt: new Date(output.executedAt),
            exitedAt: new Date(output.executedAt),
            duration: output.duration,
            result: output.success ? 'success' : 'error',
            error: output.error,
          })),
          createdAt: sessionState.startedAt,
          lastActivityAt: new Date(),
        });
        this.eventHistory.set(data.testSessionId, []);
      }

      // Join test session room
      await client.join(`test:session:${data.testSessionId}`);

      // Send current state from the service
      client.emit('test:state-recovery', {
        testSessionId: data.testSessionId,
        state: {
          status: sessionState.status,
          currentNodeId: sessionState.currentNodeId,
          currentNodeLabel: sessionState.currentNodeLabel,
        },
        messages: sessionState.messages,
        variables: sessionState.variables,
        executionHistory: sessionState.nodeOutputs.slice(-20),
      });

      this.logger.log(`Client ${client.id} joined test session ${data.testSessionId}`);

      return { event: 'test:joined', data: { testSessionId: data.testSessionId, success: true } };
    } catch (error) {
      this.logger.warn(`Failed to join test session ${data.testSessionId}: ${error.message}`);
      return { event: 'test:error', data: { error: 'Session not found' } };
    }
  }

  @SubscribeMessage('test:leave')
  async handleLeaveTest(
    @MessageBody() data: TestSessionActionDto,
    @ConnectedSocket() client: Socket,
  ) {
    await client.leave(`test:session:${data.testSessionId}`);
    await client.leave(`test:session:${data.testSessionId}:execution`);
    await client.leave(`test:session:${data.testSessionId}:variables`);

    return { event: 'test:left', data: { testSessionId: data.testSessionId, success: true } };
  }

  @SubscribeMessage('test:rejoin')
  async handleRejoinTest(
    @MessageBody() data: RejoinTestDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketToUser.get(client.id);

    if (!userId) {
      return { event: 'test:error', data: { error: 'Not authenticated' } };
    }

    try {
      // Look up session from TestSessionService (which uses DB)
      const sessionState = await this.testSessionService.getTestState(data.testSessionId);

      // Update local map with fresh state from service
      if (this.testSessions.has(data.testSessionId)) {
        const localSession = this.testSessions.get(data.testSessionId)!;
        localSession.status = sessionState.status as any;
        localSession.currentNodeId = sessionState.currentNodeId;
        localSession.currentNodeLabel = sessionState.currentNodeLabel || null;
        localSession.variables = sessionState.variables;
        localSession.lastActivityAt = new Date();
      } else {
        // Initialize local tracking if not present
        this.testSessions.set(data.testSessionId, {
          testSessionId: sessionState.sessionId,
          chatbotId: sessionState.chatbotId,
          chatbotName: sessionState.chatbotName,
          userId,
          status: sessionState.status as any,
          currentNodeId: sessionState.currentNodeId,
          currentNodeLabel: sessionState.currentNodeLabel || null,
          variables: sessionState.variables,
          messages: sessionState.messages.map(msg => ({
            id: msg.id,
            direction: msg.direction === 'incoming' ? 'inbound' : 'outbound',
            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
            messageType: msg.type as any,
            nodeId: msg.nodeId,
            timestamp: msg.timestamp,
          })),
          executionHistory: sessionState.nodeOutputs.map(output => ({
            nodeId: output.nodeId,
            nodeType: output.nodeType,
            nodeLabel: output.nodeLabel || output.nodeId,
            enteredAt: new Date(output.executedAt),
            exitedAt: new Date(output.executedAt),
            duration: output.duration,
            result: output.success ? 'success' : 'error',
            error: output.error,
          })),
          createdAt: sessionState.startedAt,
          lastActivityAt: new Date(),
        });
        this.eventHistory.set(data.testSessionId, []);
      }

      // Rejoin room
      await client.join(`test:session:${data.testSessionId}`);

      // Get missed events from local event history
      const missedEvents = this.getMissedEvents(data.testSessionId, data.lastEventId);

      // Send state recovery using fresh data from service
      client.emit('test:state-recovery', {
        testSessionId: data.testSessionId,
        state: {
          status: sessionState.status,
          currentNodeId: sessionState.currentNodeId,
          currentNodeLabel: sessionState.currentNodeLabel,
          waitingForInput: sessionState.status === 'waiting_input',
        },
        messages: sessionState.messages.slice(-50),
        variables: sessionState.variables,
        executionHistory: sessionState.nodeOutputs.slice(-20),
        missedEvents,
      });

      this.logger.log(`Client rejoined test session: ${data.testSessionId}`);

      return { event: 'test:rejoined', data: { success: true, missedEventsCount: missedEvents.length } };
    } catch (error) {
      this.logger.warn(`Failed to rejoin test session ${data.testSessionId}: ${error.message}`);
      return { event: 'test:error', data: { error: 'Session not found or expired' } };
    }
  }

  @SubscribeMessage('test:subscribe-execution')
  async handleSubscribeExecution(
    @MessageBody() data: TestSessionActionDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketToUser.get(client.id);
    const session = this.testSessions.get(data.testSessionId);

    if (!session || session.userId !== userId) {
      return { event: 'test:error', data: { error: 'Not authorized' } };
    }

    await client.join(`test:session:${data.testSessionId}:execution`);
    return { event: 'test:subscribed-execution', data: { success: true } };
  }

  @SubscribeMessage('test:subscribe-variables')
  async handleSubscribeVariables(
    @MessageBody() data: TestSessionActionDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.socketToUser.get(client.id);
    const session = this.testSessions.get(data.testSessionId);

    if (!session || session.userId !== userId) {
      return { event: 'test:error', data: { error: 'Not authorized' } };
    }

    await client.join(`test:session:${data.testSessionId}:variables`);

    // Send current variables snapshot
    client.emit('test:variables-snapshot', {
      testSessionId: data.testSessionId,
      variables: session.variables,
      timestamp: new Date(),
    });

    return { event: 'test:subscribed-variables', data: { success: true } };
  }

  // ============================================
  // PUBLIC EMIT METHODS (Called by services)
  // ============================================

  /**
   * Emit when bot sends response message(s)
   */
  emitBotResponse(testSessionId: string, messages: Array<{ content: string; type: string }>, nodeId: string) {
    const session = this.testSessions.get(testSessionId);
    if (!session) return;

    const testMessages: TestMessage[] = messages.map(msg => ({
      id: this.generateMessageId(),
      direction: 'outbound',
      content: msg.content,
      messageType: msg.type as any,
      nodeId,
      timestamp: new Date(),
    }));

    session.messages.push(...testMessages);
    session.lastActivityAt = new Date();

    this.emitToSession(testSessionId, 'test:bot-response', {
      testSessionId,
      messages: testMessages,
      nodeId,
      timestamp: new Date(),
    });
  }

  /**
   * Emit when entering a node
   */
  emitNodeEntered(testSessionId: string, nodeId: string, nodeType: string, nodeLabel: string) {
    const session = this.testSessions.get(testSessionId);
    if (!session) return;

    session.currentNodeId = nodeId;
    session.currentNodeLabel = nodeLabel;
    session.lastActivityAt = new Date();

    const execution: NodeExecution = {
      nodeId,
      nodeType,
      nodeLabel,
      enteredAt: new Date(),
    };
    session.executionHistory.push(execution);

    this.emitToSession(testSessionId, 'test:node-entered', {
      testSessionId,
      nodeId,
      nodeType,
      nodeLabel,
    });

    // Also emit to execution subscribers
    this.server.to(`test:session:${testSessionId}:execution`).emit('test:node-entered', {
      testSessionId,
      nodeId,
      nodeType,
      nodeLabel,
    });
  }

  /**
   * Emit when node execution completes
   */
  emitNodeExecuted(testSessionId: string, nodeId: string, result: 'success' | 'error' | 'skipped', duration: number, error?: string) {
    const session = this.testSessions.get(testSessionId);
    if (!session) return;

    // Update execution history
    const execution = session.executionHistory.find(e => e.nodeId === nodeId && !e.exitedAt);
    if (execution) {
      execution.exitedAt = new Date();
      execution.duration = duration;
      execution.result = result;
      execution.error = error;
    }

    session.lastActivityAt = new Date();

    this.server.to(`test:session:${testSessionId}:execution`).emit('test:node-executed', {
      testSessionId,
      nodeId,
      result,
      duration,
      error,
    });
  }

  /**
   * Emit when exiting a node
   */
  emitNodeExited(testSessionId: string, nodeId: string, nextNodeId: string | null) {
    this.server.to(`test:session:${testSessionId}:execution`).emit('test:node-exited', {
      testSessionId,
      nodeId,
      nextNodeId,
    });
  }

  /**
   * Emit when a variable changes
   */
  emitVariableChanged(testSessionId: string, key: string, oldValue: any, newValue: any, source: 'node' | 'api' | 'flow') {
    const session = this.testSessions.get(testSessionId);
    if (!session) return;

    session.variables[key] = newValue;
    session.lastActivityAt = new Date();

    const payload = {
      testSessionId,
      key,
      oldValue,
      newValue,
      source,
    };

    // Emit to main session room
    this.emitToSession(testSessionId, 'test:variable-changed', payload);

    // Also emit to variable subscribers
    this.server.to(`test:session:${testSessionId}:variables`).emit('test:variable-changed', payload);
  }

  /**
   * Emit when waiting for user input
   */
  emitWaitingInput(testSessionId: string, nodeId: string, prompt: string, inputType: 'text' | 'button' | 'list' | 'flow') {
    const session = this.testSessions.get(testSessionId);
    if (!session) return;

    session.status = 'waiting_input';
    session.lastActivityAt = new Date();

    this.emitToSession(testSessionId, 'test:waiting-input', {
      testSessionId,
      nodeId,
      prompt,
      inputType,
    });
  }

  /**
   * Emit when WhatsApp Flow is sent
   */
  emitFlowSent(testSessionId: string, flowId: string, flowData: any) {
    this.emitToSession(testSessionId, 'test:flow-sent', {
      testSessionId,
      flowId,
      flowData,
    });
  }

  /**
   * Emit when WhatsApp Flow response is received
   */
  emitFlowResponse(testSessionId: string, flowId: string, responseData: any) {
    this.emitToSession(testSessionId, 'test:flow-response', {
      testSessionId,
      flowId,
      responseData,
    });
  }

  /**
   * Emit error
   */
  emitError(testSessionId: string, error: string, nodeId?: string, recoverable: boolean = true) {
    const session = this.testSessions.get(testSessionId);
    if (session && !recoverable) {
      session.status = 'error';
    }

    this.emitToSession(testSessionId, 'test:error', {
      testSessionId,
      error,
      nodeId,
      recoverable,
    });
  }

  /**
   * Complete test session
   */
  completeSession(testSessionId: string, reason: string) {
    const session = this.testSessions.get(testSessionId);
    if (!session) return;

    session.status = 'completed';
    session.completionReason = reason;
    session.lastActivityAt = new Date();

    const duration = new Date().getTime() - session.createdAt.getTime();

    const summary = {
      totalMessages: session.messages.length,
      inboundMessages: session.messages.filter(m => m.direction === 'inbound').length,
      outboundMessages: session.messages.filter(m => m.direction === 'outbound').length,
      nodesExecuted: session.executionHistory.length,
      variablesSet: Object.keys(session.variables).length,
    };

    this.emitToSession(testSessionId, 'test:completed', {
      testSessionId,
      reason,
      summary,
      duration,
    });

    this.logger.log(`Test session completed: ${testSessionId} (Reason: ${reason}, Duration: ${duration}ms)`);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private emitToSession(testSessionId: string, event: string, data: any) {
    // Emit to room
    this.server.to(`test:session:${testSessionId}`).emit(event, data);

    // Store in event history for reconnection recovery
    const history = this.eventHistory.get(testSessionId);
    if (history) {
      history.push({
        id: this.generateEventId(),
        event,
        data,
        timestamp: new Date(),
      });

      // Keep history limited
      if (history.length > this.MAX_EVENT_HISTORY) {
        history.shift();
      }
    }
  }

  private getMissedEvents(testSessionId: string, lastEventId?: string): Array<{ event: string; data: any }> {
    const history = this.eventHistory.get(testSessionId);
    if (!history || !lastEventId) return [];

    const lastIndex = history.findIndex(e => e.id === lastEventId);
    if (lastIndex === -1) return history.map(e => ({ event: e.event, data: e.data }));

    return history.slice(lastIndex + 1).map(e => ({ event: e.event, data: e.data }));
  }

  private getUserIdFromSocket(client: Socket): string | null {
    // Try auth token first
    const token = client.handshake.auth?.token;
    if (token) {
      try {
        const decoded = this.jwtService.verify(token);
        // JWT payload uses 'sub' for user ID
        return decoded.sub || decoded.userId || null;
      } catch (error) {
        this.logger.warn(`Invalid JWT token: ${error.message}`);
      }
    }

    // Fallback to query param for development
    const userId = client.handshake.query.userId as string;
    return userId || null;
  }

  private checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const limit = this.rateLimits.get(key);

    if (!limit || now > limit.resetAt) {
      this.rateLimits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    if (limit.count >= maxRequests) {
      return false;
    }

    limit.count++;
    return true;
  }

  private cleanupStaleSessions() {
    const now = Date.now();
    const staleThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [sessionId, session] of this.testSessions.entries()) {
      if (now - session.lastActivityAt.getTime() > staleThreshold) {
        if (session.status !== 'completed') {
          this.completeSession(sessionId, 'session_timeout');
        }
        this.testSessions.delete(sessionId);
        this.eventHistory.delete(sessionId);
        this.logger.log(`Cleaned up stale test session: ${sessionId}`);
      }
    }
  }

  private generateTestSessionId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // ============================================
  // UTILITY GETTERS
  // ============================================

  getTestSession(testSessionId: string): TestSessionState | undefined {
    return this.testSessions.get(testSessionId);
  }

  getUserTestSessions(userId: string): TestSessionState[] {
    return Array.from(this.testSessions.values()).filter(s => s.userId === userId);
  }

  getActiveTestSessionsCount(): number {
    return Array.from(this.testSessions.values()).filter(
      s => s.status !== 'completed' && s.status !== 'error'
    ).length;
  }
}
