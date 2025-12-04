import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ConversationContext, TestMetadata, NodeOutput } from '../../../entities/conversation-context.entity';
import { ChatBot } from '../../../entities/chatbot.entity';
import { User } from '../../../entities/user.entity';
import { Conversation } from '../../../entities/conversation.entity';
import { NodeDataType } from '../../chatbots/dto/node-data.dto';
import {
  StartTestSessionDto,
  SimulateMessageDto,
  TestSessionResponseDto,
  TestStateDto,
  TestSessionActionResponseDto,
  TestSessionStatus,
  TestMode,
  TestNodeOutputDto,
  SimulatedMessageDto,
  LoopDetectionStatsDto,
} from '../dto/test-session.dto';
import {
  LoopDetectionStats,
  LoopDetectionConfig,
} from '../interfaces/test-execution.interface';
import { TestExecutionAdapterService } from './test-execution-adapter.service';

/**
 * TestSessionService - Main orchestrator for test session lifecycle management
 *
 * Responsibilities:
 * - Create and manage test sessions (ConversationContext with isTestSession=true)
 * - Track test execution state including loop detection
 * - Handle pause/resume/stop operations
 * - Coordinate with TestExecutionAdapterService for actual node execution
 *
 * Note: This service manages the session lifecycle. Actual node execution
 * is delegated to TestExecutionAdapterService (to be implemented).
 */
@Injectable()
export class TestSessionService {
  private readonly logger = new Logger(TestSessionService.name);

  /**
   * In-memory store for test session state that isn't persisted to DB
   * Maps sessionId -> additional test state (messages, loop stats, paused state)
   */
  private testSessionState = new Map<string, {
    messages: SimulatedMessageDto[];
    loopStats: LoopDetectionStats;
    loopConfig: LoopDetectionConfig;
    isPaused: boolean;
  }>();

  constructor(
    @InjectRepository(ConversationContext)
    private readonly contextRepo: Repository<ConversationContext>,
    @InjectRepository(ChatBot)
    private readonly chatbotRepo: Repository<ChatBot>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => TestExecutionAdapterService))
    private readonly testExecutionAdapter: TestExecutionAdapterService,
  ) {}

  // ============================================
  // Public Methods
  // ============================================

  /**
   * Start a new test session for a chatbot
   *
   * @param dto - Start test session parameters
   * @param userId - ID of user initiating the test
   * @returns Test session response with initial state
   */
  async startTestSession(
    dto: StartTestSessionDto,
    userId: string,
  ): Promise<TestSessionResponseDto> {
    this.logger.log(`Starting test session for chatbot ${dto.chatbotId} by user ${userId}`);

    // Create query runner for transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validate chatbot exists
      const chatbot = await queryRunner.manager.findOne(ChatBot, {
        where: { id: dto.chatbotId },
      });

      if (!chatbot) {
        throw new NotFoundException(`Chatbot with ID ${dto.chatbotId} not found`);
      }

      // 2. Validate user exists
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // 3. Find START node
      const startNode = chatbot.nodes.find(
        (node) => node.type === 'start' || node.data?.type === NodeDataType.START,
      );

      if (!startNode) {
        throw new BadRequestException('Chatbot does not have a START node');
      }

      // 4. Create test conversation (virtual, not a real WhatsApp conversation)
      const testConversation = queryRunner.manager.create(Conversation, {
        id: uuidv4(),
        lastMessage: '[Test Session]',
        lastMessageAt: new Date(),
        isWindowOpen: true,
      });
      await queryRunner.manager.save(testConversation);

      // 5. Prepare test metadata
      const testMetadata: TestMetadata = {
        selectedUserId: userId,
        testPhoneNumber: dto.testPhoneNumber || '+905551234567',
        startedAt: new Date().toISOString(),
        testMode: dto.testMode || TestMode.SIMULATE,
        notes: dto.notes,
        userAgent: dto.userAgent,
      };

      // 6. Prepare initial variables
      const initialVariables: Record<string, any> = {
        customer_phone: dto.testPhoneNumber || '+905551234567',
        ...dto.initialVariables,
      };

      // 7. Create ConversationContext with isTestSession=true
      const context = queryRunner.manager.create(ConversationContext, {
        id: uuidv4(),
        conversationId: testConversation.id,
        chatbotId: chatbot.id,
        currentNodeId: startNode.id,
        variables: initialVariables,
        nodeHistory: [],
        nodeOutputs: {},
        isActive: true,
        status: 'running',
        isTestSession: true,
        testMetadata,
      });

      await queryRunner.manager.save(context);

      // 8. Initialize in-memory test state
      const loopConfig: LoopDetectionConfig = {
        maxNodeVisits: dto.maxNodeVisits || 10,
        maxTotalSteps: dto.maxTotalSteps || 100,
      };

      const loopStats: LoopDetectionStats = {
        nodeVisits: {},
        totalSteps: 0,
        loopDetected: false,
      };

      this.testSessionState.set(context.id, {
        messages: [],
        loopStats,
        loopConfig,
        isPaused: false,
      });

      // 9. Commit transaction
      await queryRunner.commitTransaction();

      this.logger.log(`Test session ${context.id} created successfully`);

      // 10. Build and return response with initial state
      const state = await this.buildTestState(context, chatbot);

      // 11. Start execution from START node asynchronously
      // Don't await - let it run in background and emit WebSocket events
      this.testExecutionAdapter.executeTestNode(context.id).catch(err => {
        this.logger.error(`Failed to execute test: ${err.message}`, err.stack);
      });

      return {
        success: true,
        message: 'Test session started successfully',
        sessionId: context.id,
        state,
      };

    } catch (error) {
      // Rollback on error
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to start test session: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Simulate a user response/message in the test session
   *
   * @param sessionId - Test session ID
   * @param dto - Simulated message data
   * @returns Updated test state
   */
  async simulateUserResponse(
    sessionId: string,
    dto: SimulateMessageDto,
  ): Promise<TestSessionResponseDto> {
    this.logger.log(`Simulating user response for session ${sessionId}: ${dto.message}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Load context
      const context = await this.loadTestContext(sessionId, queryRunner);

      // 2. Check if session is in a state that accepts input
      if (context.status !== 'waiting_input' && context.status !== 'waiting_flow') {
        throw new BadRequestException(
          `Session is not waiting for input. Current status: ${context.status}`,
        );
      }

      // 3. Check if session is paused
      const testState = this.testSessionState.get(sessionId);
      if (testState?.isPaused) {
        throw new ConflictException('Test session is paused. Resume before sending messages.');
      }

      // 4. Record the simulated incoming message
      if (testState) {
        testState.messages.push({
          id: uuidv4(),
          direction: 'incoming',
          type: dto.flowResponse ? 'flow_response' : 'text',
          content: dto.flowResponse || { text: dto.message },
          timestamp: new Date(),
          nodeId: context.currentNodeId,
        });
      }

      // 5. Handle different response types - delegate to TestExecutionAdapter
      await this.testExecutionAdapter.processTestResponse(sessionId, dto.message, {
        buttonId: dto.buttonId,
        listRowId: dto.listRowId,
        flowResponse: dto.flowResponse,
      });

      await queryRunner.commitTransaction();

      // 6. Return updated state
      const chatbot = await this.chatbotRepo.findOne({
        where: { id: context.chatbotId },
      });

      const state = await this.buildTestState(context, chatbot!);

      return {
        success: true,
        message: 'User response processed',
        sessionId,
        state,
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to simulate user response: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Pause a running test session
   *
   * @param sessionId - Test session ID to pause
   * @returns Action response with new status
   */
  async pauseTest(sessionId: string): Promise<TestSessionActionResponseDto> {
    this.logger.log(`Pausing test session ${sessionId}`);

    const context = await this.loadTestContext(sessionId);

    // Check if session can be paused
    if (!context.isActive) {
      throw new BadRequestException('Cannot pause an inactive session');
    }

    if (context.status === 'completed' || context.status === 'stopped') {
      throw new BadRequestException(`Cannot pause a ${context.status} session`);
    }

    // Update in-memory state
    const testState = this.testSessionState.get(sessionId);
    if (testState) {
      if (testState.isPaused) {
        throw new ConflictException('Session is already paused');
      }
      testState.isPaused = true;
    }

    this.logger.log(`Test session ${sessionId} paused`);

    return {
      success: true,
      message: 'Test session paused',
      sessionId,
      status: TestSessionStatus.PAUSED,
    };
  }

  /**
   * Resume a paused test session
   *
   * @param sessionId - Test session ID to resume
   * @returns Action response with new status
   */
  async resumeTest(sessionId: string): Promise<TestSessionActionResponseDto> {
    this.logger.log(`Resuming test session ${sessionId}`);

    const context = await this.loadTestContext(sessionId);

    // Check if session can be resumed
    if (!context.isActive) {
      throw new BadRequestException('Cannot resume an inactive session');
    }

    // Check in-memory state
    const testState = this.testSessionState.get(sessionId);
    if (!testState?.isPaused) {
      throw new BadRequestException('Session is not paused');
    }

    // Resume
    testState.isPaused = false;

    this.logger.log(`Test session ${sessionId} resumed`);

    // Map DB status to TestSessionStatus
    const status = this.mapDbStatusToTestStatus(context.status);

    return {
      success: true,
      message: 'Test session resumed',
      sessionId,
      status,
    };
  }

  /**
   * Stop a test session completely
   *
   * @param sessionId - Test session ID to stop
   * @returns Action response with stopped status
   */
  async stopTest(sessionId: string): Promise<TestSessionActionResponseDto> {
    this.logger.log(`Stopping test session ${sessionId}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const context = await this.loadTestContext(sessionId, queryRunner);

      if (!context.isActive) {
        throw new BadRequestException('Session is already inactive');
      }

      // Update context
      context.isActive = false;
      context.status = 'stopped';
      context.completedAt = new Date();
      context.completionReason = 'user_stopped';

      await queryRunner.manager.save(context);
      await queryRunner.commitTransaction();

      // Clean up in-memory state (but keep it for final state retrieval)
      const testState = this.testSessionState.get(sessionId);
      if (testState) {
        testState.isPaused = false;
      }

      this.logger.log(`Test session ${sessionId} stopped`);

      return {
        success: true,
        message: 'Test session stopped',
        sessionId,
        status: TestSessionStatus.STOPPED,
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to stop test session: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get the current state of a test session
   *
   * @param sessionId - Test session ID
   * @returns Current test state
   */
  async getTestState(sessionId: string): Promise<TestStateDto> {
    this.logger.log(`Getting state for test session ${sessionId}`);

    const context = await this.contextRepo.findOne({
      where: { id: sessionId, isTestSession: true },
      relations: ['chatbot'],
    });

    if (!context) {
      throw new NotFoundException(`Test session ${sessionId} not found`);
    }

    return this.buildTestState(context, context.chatbot);
  }

  // ============================================
  // Internal Helper Methods
  // ============================================

  /**
   * Load test context with validation
   */
  private async loadTestContext(
    sessionId: string,
    queryRunner?: QueryRunner,
  ): Promise<ConversationContext> {
    const manager = queryRunner?.manager || this.contextRepo.manager;

    const context = await manager.findOne(ConversationContext, {
      where: { id: sessionId, isTestSession: true },
      relations: ['chatbot'],
    });

    if (!context) {
      throw new NotFoundException(`Test session ${sessionId} not found`);
    }

    return context;
  }

  /**
   * Build TestStateDto from context and chatbot
   */
  private async buildTestState(
    context: ConversationContext,
    chatbot: ChatBot | null,
  ): Promise<TestStateDto> {
    const testState = this.testSessionState.get(context.id);

    // Get current node info
    let currentNodeLabel: string | null = null;
    let currentNodeType: string | null = null;

    if (chatbot && context.currentNodeId) {
      const currentNode = chatbot.nodes.find((n) => n.id === context.currentNodeId);
      if (currentNode) {
        currentNodeLabel = currentNode.data?.label || currentNode.id;
        currentNodeType = currentNode.type || currentNode.data?.type;
      }
    }

    // Convert nodeOutputs to array
    const nodeOutputsArray: TestNodeOutputDto[] = Object.values(context.nodeOutputs || {}).map(
      (output: NodeOutput) => ({
        nodeId: output.nodeId,
        nodeType: output.nodeType,
        nodeLabel: output.nodeLabel,
        executedAt: output.executedAt,
        success: output.success,
        duration: output.duration,
        data: output.data,
        error: output.error,
        statusCode: output.statusCode,
        userResponse: output.userResponse,
        buttonId: output.buttonId,
        listRowId: output.listRowId,
        flowResponse: output.flowResponse,
        outputVariable: output.outputVariable,
      }),
    );

    // Build loop stats
    const loopStats: LoopDetectionStatsDto = testState?.loopStats || {
      nodeVisits: {},
      totalSteps: 0,
      loopDetected: false,
    };

    // Map status considering paused state
    let status = this.mapDbStatusToTestStatus(context.status);
    if (testState?.isPaused && context.isActive) {
      status = TestSessionStatus.PAUSED;
    }

    return {
      sessionId: context.id,
      chatbotId: context.chatbotId,
      chatbotName: chatbot?.name || 'Unknown',
      status,
      currentNodeId: context.currentNodeId,
      currentNodeLabel,
      currentNodeType,
      variables: context.variables,
      nodeHistory: context.nodeHistory,
      nodeOutputs: nodeOutputsArray,
      messages: testState?.messages || [],
      loopStats,
      startedAt: context.createdAt,
      completedAt: context.completedAt,
      completionReason: context.completionReason,
      testMode: context.testMetadata?.testMode as TestMode || TestMode.SIMULATE,
      testPhoneNumber: context.testMetadata?.testPhoneNumber || '+905551234567',
    };
  }

  /**
   * Map database status string to TestSessionStatus enum
   */
  private mapDbStatusToTestStatus(
    dbStatus: string,
  ): TestSessionStatus {
    const statusMap: Record<string, TestSessionStatus> = {
      running: TestSessionStatus.RUNNING,
      waiting_input: TestSessionStatus.WAITING_INPUT,
      waiting_flow: TestSessionStatus.WAITING_FLOW,
      completed: TestSessionStatus.COMPLETED,
      expired: TestSessionStatus.COMPLETED,
      stopped: TestSessionStatus.STOPPED,
    };

    return statusMap[dbStatus] || TestSessionStatus.ERROR;
  }

  /**
   * Update loop detection stats after node execution
   * Called by TestExecutionAdapterService
   */
  updateLoopStats(
    sessionId: string,
    nodeId: string,
  ): { loopDetected: boolean; message?: string } {
    const testState = this.testSessionState.get(sessionId);

    if (!testState) {
      return { loopDetected: false };
    }

    const { loopStats, loopConfig } = testState;

    // Increment visit count for this node
    loopStats.nodeVisits[nodeId] = (loopStats.nodeVisits[nodeId] || 0) + 1;
    loopStats.totalSteps += 1;

    // Check for loop - max node visits exceeded
    if (loopStats.nodeVisits[nodeId] > loopConfig.maxNodeVisits) {
      loopStats.loopDetected = true;
      loopStats.loopDetails = {
        nodeId,
        visitCount: loopStats.nodeVisits[nodeId],
        message: `Node ${nodeId} visited ${loopStats.nodeVisits[nodeId]} times, exceeding max of ${loopConfig.maxNodeVisits}`,
      };

      this.logger.warn(`Loop detected in session ${sessionId}: ${loopStats.loopDetails.message}`);

      return {
        loopDetected: true,
        message: loopStats.loopDetails.message,
      };
    }

    // Check for loop - max total steps exceeded
    if (loopStats.totalSteps > loopConfig.maxTotalSteps) {
      loopStats.loopDetected = true;
      loopStats.loopDetails = {
        nodeId,
        visitCount: loopStats.totalSteps,
        message: `Total steps ${loopStats.totalSteps} exceeded max of ${loopConfig.maxTotalSteps}`,
      };

      this.logger.warn(`Loop detected in session ${sessionId}: ${loopStats.loopDetails.message}`);

      return {
        loopDetected: true,
        message: loopStats.loopDetails.message,
      };
    }

    return { loopDetected: false };
  }

  /**
   * Record a simulated outgoing message
   * Called by TestExecutionAdapterService when sending messages
   */
  recordOutgoingMessage(
    sessionId: string,
    message: Omit<SimulatedMessageDto, 'id' | 'direction' | 'timestamp'>,
  ): void {
    const testState = this.testSessionState.get(sessionId);

    if (testState) {
      testState.messages.push({
        id: uuidv4(),
        direction: 'outgoing',
        timestamp: new Date(),
        ...message,
      });
    }
  }

  /**
   * Check if a session is paused
   */
  isSessionPaused(sessionId: string): boolean {
    return this.testSessionState.get(sessionId)?.isPaused || false;
  }

  /**
   * Clean up test session state (call when session is completed/stopped)
   * Optionally keeps state for a period to allow final state retrieval
   */
  cleanupSessionState(sessionId: string, immediate = false): void {
    if (immediate) {
      this.testSessionState.delete(sessionId);
      this.logger.log(`Cleaned up state for session ${sessionId}`);
    } else {
      // Schedule cleanup after 5 minutes to allow state retrieval
      setTimeout(() => {
        this.testSessionState.delete(sessionId);
        this.logger.log(`Cleaned up state for session ${sessionId} (delayed)`);
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Get all active test sessions (for admin/debug)
   */
  async getActiveTestSessions(): Promise<TestStateDto[]> {
    const contexts = await this.contextRepo.find({
      where: { isTestSession: true, isActive: true },
      relations: ['chatbot'],
      order: { createdAt: 'DESC' },
    });

    return Promise.all(
      contexts.map((context) => this.buildTestState(context, context.chatbot)),
    );
  }
}
