import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationContext } from '../../../entities/conversation-context.entity';
import { ChatBot } from '../../../entities/chatbot.entity';
import { ChatBotExecutionService } from '../../chatbots/services/chatbot-execution.service';
import { RestApiExecutorService } from '../../chatbots/services/rest-api-executor.service';
import { TestSessionGateway } from '../../websocket/test-session.gateway';
import { TestSessionService } from './test-session.service';
import { NodeDataType } from '../../chatbots/dto/node-data.dto';
import {
  calculateNodeIndex,
  generateAutoVariableName,
  getFullVariablePath,
} from '../../chatbots/utils/auto-variable-naming';
import { v4 as uuidv4 } from 'uuid';
import {
  LoopDetectionStats,
  LoopDetectionConfig,
  TestNodeExecutionResult,
  TestExecutionState,
  StartTestOptions,
  ProcessTestResponseOptions,
} from '../interfaces/test-execution.interface';

/**
 * Default loop detection configuration
 */
const DEFAULT_LOOP_DETECTION_CONFIG: LoopDetectionConfig = {
  maxNodeVisits: 10,
  maxTotalSteps: 100,
};

/**
 * TestExecutionAdapterService
 *
 * Wraps ChatBotExecutionService to provide test-specific functionality:
 * - Loop detection to prevent infinite loops
 * - WebSocket events for real-time UI updates
 * - Test context management without sending real WhatsApp messages
 *
 * Uses composition pattern - does NOT modify the original ChatBotExecutionService
 */
@Injectable()
export class TestExecutionAdapterService {
  private readonly logger = new Logger(TestExecutionAdapterService.name);

  /**
   * In-memory loop detection stats per context
   * Key: contextId, Value: LoopDetectionStats
   */
  private readonly loopStats = new Map<string, LoopDetectionStats>();

  /**
   * Loop detection configuration per context
   * Key: contextId, Value: LoopDetectionConfig
   */
  private readonly loopConfigs = new Map<string, LoopDetectionConfig>();

  constructor(
    @InjectRepository(ConversationContext)
    private readonly contextRepo: Repository<ConversationContext>,
    @InjectRepository(ChatBot)
    private readonly chatbotRepo: Repository<ChatBot>,
    @Inject(forwardRef(() => ChatBotExecutionService))
    private readonly chatbotExecutionService: ChatBotExecutionService,
    @Inject(forwardRef(() => TestSessionGateway))
    private readonly testSessionGateway: TestSessionGateway,
    @Inject(forwardRef(() => TestSessionService))
    private readonly testSessionService: TestSessionService,
    private readonly restApiExecutor: RestApiExecutorService,
  ) {}

  // ============================================
  // LOOP DETECTION METHODS
  // ============================================

  /**
   * Initialize loop detection for a test context
   */
  private initializeLoopDetection(
    contextId: string,
    config?: Partial<LoopDetectionConfig>,
  ): void {
    const fullConfig: LoopDetectionConfig = {
      ...DEFAULT_LOOP_DETECTION_CONFIG,
      ...config,
    };

    this.loopConfigs.set(contextId, fullConfig);
    this.loopStats.set(contextId, {
      nodeVisits: {},
      totalSteps: 0,
      loopDetected: false,
    });

    this.logger.debug(
      `Initialized loop detection for context ${contextId}: maxNodeVisits=${fullConfig.maxNodeVisits}, maxTotalSteps=${fullConfig.maxTotalSteps}`,
    );
  }

  /**
   * Record a node visit and check for loops
   * Returns true if loop detected (should stop execution)
   */
  private recordNodeVisit(contextId: string, nodeId: string): boolean {
    const stats = this.loopStats.get(contextId);
    const config = this.loopConfigs.get(contextId);

    if (!stats || !config) {
      this.logger.warn(`Loop detection not initialized for context ${contextId}`);
      return false;
    }

    // Increment total steps
    stats.totalSteps++;

    // Increment node visit count
    stats.nodeVisits[nodeId] = (stats.nodeVisits[nodeId] || 0) + 1;

    this.logger.debug(
      `Node visit recorded: ${nodeId} (visit #${stats.nodeVisits[nodeId]}, total steps: ${stats.totalSteps})`,
    );

    // Check for max total steps exceeded
    if (stats.totalSteps >= config.maxTotalSteps) {
      stats.loopDetected = true;
      stats.loopDetails = {
        nodeId,
        visitCount: stats.nodeVisits[nodeId],
        message: `Maximum total steps (${config.maxTotalSteps}) exceeded`,
      };
      this.logger.warn(
        `Loop detected in context ${contextId}: ${stats.loopDetails.message}`,
      );
      return true;
    }

    // Check for max node visits exceeded
    if (stats.nodeVisits[nodeId] >= config.maxNodeVisits) {
      stats.loopDetected = true;
      stats.loopDetails = {
        nodeId,
        visitCount: stats.nodeVisits[nodeId],
        message: `Node ${nodeId} visited ${stats.nodeVisits[nodeId]} times (max: ${config.maxNodeVisits})`,
      };
      this.logger.warn(
        `Loop detected in context ${contextId}: ${stats.loopDetails.message}`,
      );
      return true;
    }

    return false;
  }

  /**
   * Get loop detection stats for a context
   */
  getLoopStats(contextId: string): LoopDetectionStats | null {
    return this.loopStats.get(contextId) || null;
  }

  /**
   * Clean up loop detection data for a context
   */
  private cleanupLoopDetection(contextId: string): void {
    this.loopStats.delete(contextId);
    this.loopConfigs.delete(contextId);
  }

  // ============================================
  // TEST EXECUTION METHODS
  // ============================================

  /**
   * Start a new test execution for a chatbot
   *
   * Creates a test context and begins execution from the START node.
   * Does NOT send real WhatsApp messages - uses test simulation mode.
   *
   * @param chatbotId - ID of the chatbot to test
   * @param userId - ID of the user running the test
   * @param options - Optional configuration
   * @returns The created test context ID
   */
  async startTestExecution(
    chatbotId: string,
    userId: string,
    options?: StartTestOptions,
  ): Promise<string> {
    this.logger.log(`Starting test execution for chatbot ${chatbotId} by user ${userId}`);

    // Find chatbot
    const chatbot = await this.chatbotRepo.findOne({
      where: { id: chatbotId },
    });

    if (!chatbot) {
      throw new NotFoundException(`Chatbot ${chatbotId} not found`);
    }

    // Find START node
    const startNode = chatbot.nodes.find(
      (node) => node.type === 'start' || node.data?.type === NodeDataType.START,
    );

    if (!startNode) {
      throw new NotFoundException('START node not found in chatbot');
    }

    this.logger.log(`Found START node ${startNode.id} for chatbot ${chatbotId}`);

    // Create test conversation context
    const testPhoneNumber = `test_${Date.now()}`;
    const context = this.contextRepo.create({
      conversationId: `test_conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      chatbotId: chatbot.id,
      currentNodeId: startNode.id,
      variables: {
        customer_phone: testPhoneNumber,
        __test_mode__: true,
        ...(options?.initialVariables || {}),
      },
      nodeHistory: [],
      nodeOutputs: {},
      isActive: true,
      status: 'running',
      isTestSession: true,
      testMetadata: {
        selectedUserId: userId,
        testPhoneNumber,
        startedAt: new Date().toISOString(),
        testMode: 'simulate',
      },
    });

    await this.contextRepo.save(context);

    this.logger.log(`Created test context ${context.id}`);

    // Initialize loop detection
    this.initializeLoopDetection(context.id, options?.loopDetectionConfig);

    // Note: test:started event should be emitted by the controller/caller
    // The TestSessionGateway manages its own session state

    // Start execution from START node
    await this.executeTestNode(context.id);

    return context.id;
  }

  /**
   * Execute the current node in test mode
   *
   * This is the main execution loop that:
   * 1. Checks for loop detection
   * 2. Emits WebSocket events for each node
   * 3. Delegates to appropriate node handler
   * 4. Continues to next node or waits for input
   */
  async executeTestNode(contextId: string): Promise<TestNodeExecutionResult | null> {
    const startTime = Date.now();

    // Load context
    const context = await this.contextRepo.findOne({
      where: { id: contextId, isActive: true },
      relations: ['chatbot'],
    });

    if (!context) {
      this.logger.warn(`Test context ${contextId} not found or inactive`);
      return null;
    }

    // Get current node
    const currentNode = context.chatbot.nodes.find(
      (n) => n.id === context.currentNodeId,
    );

    if (!currentNode) {
      this.logger.log(`No current node found for context ${contextId}, test completed`);
      await this.completeTestExecution(contextId, 'flow_completed');
      return {
        success: true,
        nodeId: context.currentNodeId,
        nodeType: 'unknown',
        duration: Date.now() - startTime,
        nextNodeId: null,
      };
    }

    const nodeType = currentNode.type || currentNode.data?.type;
    const nodeLabel = currentNode.data?.label || `${nodeType} Node`;

    this.logger.log(`Executing test node ${currentNode.id} (${nodeType})`);

    // Check for loops BEFORE executing
    const loopDetected = this.recordNodeVisit(contextId, currentNode.id);

    if (loopDetected) {
      const stats = this.loopStats.get(contextId);
      this.logger.warn(`Loop detected at node ${currentNode.id}, stopping execution`);

      // Emit loop detected event
      this.testSessionGateway.emitError(
        contextId,
        `Loop detected: ${stats?.loopDetails?.message}`,
        currentNode.id,
        false,
      );

      // Complete with loop_detected reason
      await this.completeTestExecution(contextId, 'loop_detected');

      return {
        success: false,
        nodeId: currentNode.id,
        nodeType,
        nodeLabel,
        duration: Date.now() - startTime,
        error: stats?.loopDetails?.message,
        loopDetected: true,
      };
    }

    // Emit node:entered event
    this.testSessionGateway.emitNodeEntered(
      contextId,
      currentNode.id,
      nodeType,
      nodeLabel,
    );

    try {
      // Execute node based on type
      // For test mode, we simulate message sending instead of actual WhatsApp API calls
      const result = await this.executeNodeByType(context, currentNode);

      const duration = Date.now() - startTime;

      // Emit node:executed event
      this.testSessionGateway.emitNodeExecuted(
        contextId,
        currentNode.id,
        result.success ? 'success' : 'error',
        duration,
        result.error,
      );

      // If node completed and has next node, continue execution
      if (result.success && result.nextNodeId && !result.waitingForInput) {
        // Emit node:exited event
        this.testSessionGateway.emitNodeExited(
          contextId,
          currentNode.id,
          result.nextNodeId,
        );

        // Continue to next node
        return this.executeTestNode(contextId);
      }

      return {
        success: result.success,
        nodeId: currentNode.id,
        nodeType,
        nodeLabel,
        duration,
        error: result.error,
        output: result.output,
        nextNodeId: result.nextNodeId,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error(
        `Error executing test node ${currentNode.id}: ${error.message}`,
        error.stack,
      );

      // Emit error event
      this.testSessionGateway.emitError(contextId, error.message, currentNode.id, true);

      // Emit node:executed with error
      this.testSessionGateway.emitNodeExecuted(
        contextId,
        currentNode.id,
        'error',
        duration,
        error.message,
      );

      return {
        success: false,
        nodeId: currentNode.id,
        nodeType,
        nodeLabel,
        duration,
        error: error.message,
      };
    }
  }

  /**
   * Execute a specific node type
   * Returns execution result with next node info
   */
  private async executeNodeByType(
    context: ConversationContext,
    node: any,
  ): Promise<{
    success: boolean;
    error?: string;
    output?: any;
    nextNodeId?: string | null;
    waitingForInput?: boolean;
  }> {
    const nodeType = node.type || node.data?.type;

    switch (nodeType) {
      case NodeDataType.START:
        return this.executeStartNode(context, node);

      case NodeDataType.MESSAGE:
        return this.executeMessageNode(context, node);

      case NodeDataType.QUESTION:
        return this.executeQuestionNode(context, node);

      case NodeDataType.CONDITION:
        return this.executeConditionNode(context, node);

      case NodeDataType.REST_API:
        return this.executeRestApiNode(context, node);

      case NodeDataType.WHATSAPP_FLOW:
        return this.executeWhatsAppFlowNode(context, node);

      case NodeDataType.GOOGLE_CALENDAR:
        return this.executeGoogleCalendarNode(context, node);

      default:
        this.logger.warn(`Unknown node type in test: ${nodeType}`);
        return {
          success: false,
          error: `Unknown node type: ${nodeType}`,
        };
    }
  }

  /**
   * Execute START node in test mode
   */
  private async executeStartNode(
    context: ConversationContext,
    node: any,
  ): Promise<{ success: boolean; nextNodeId?: string | null }> {
    this.logger.log(`Test: Executing START node ${node.id}`);

    const nextNode = this.findNextNode(context.chatbot, node.id);

    // Update context
    context.nodeHistory.push(node.id);
    if (nextNode) {
      context.currentNodeId = nextNode.id;
    }
    await this.contextRepo.save(context);

    return {
      success: true,
      nextNodeId: nextNode?.id || null,
    };
  }

  /**
   * Execute MESSAGE node in test mode
   * Simulates sending message without actual WhatsApp API call
   */
  private async executeMessageNode(
    context: ConversationContext,
    node: any,
  ): Promise<{ success: boolean; output?: any; nextNodeId?: string | null }> {
    this.logger.log(`Test: Executing MESSAGE node ${node.id}`);

    const content = node.data?.content || '';
    const message = this.replaceVariables(content, context.variables);

    // Add message to TestSessionService state (for state recovery)
    this.testSessionService.addMessage(context.id, {
      id: uuidv4(),
      direction: 'outgoing',
      type: 'text',
      content: message,
      timestamp: new Date(),
      nodeId: node.id,
    });

    // Emit simulated bot response via WebSocket
    this.testSessionGateway.emitBotResponse(
      context.id,
      [{ content: message, type: 'text' }],
      node.id,
    );

    const nextNode = this.findNextNode(context.chatbot, node.id);

    // Update context
    context.nodeHistory.push(node.id);
    if (nextNode) {
      context.currentNodeId = nextNode.id;
    }
    await this.contextRepo.save(context);

    return {
      success: true,
      output: { message },
      nextNodeId: nextNode?.id || null,
    };
  }

  /**
   * Execute QUESTION node in test mode
   * Sends question and waits for user input
   */
  private async executeQuestionNode(
    context: ConversationContext,
    node: any,
  ): Promise<{
    success: boolean;
    output?: any;
    nextNodeId?: string | null;
    waitingForInput?: boolean;
  }> {
    this.logger.log(`Test: Executing QUESTION node ${node.id}`);

    const content = node.data?.content || '';
    const questionType = node.data?.questionType || 'text';
    const message = this.replaceVariables(content, context.variables);

    // Determine message type based on question type
    let msgType: 'text' | 'interactive' = 'text';
    let additionalContent: any = {};

    if (questionType === 'buttons') {
      msgType = 'interactive';
      additionalContent = {
        buttons: node.data?.buttons || [],
      };
    } else if (questionType === 'list') {
      msgType = 'interactive';
      additionalContent = {
        listSections: node.data?.listSections || [],
      };
    }

    // Add message to TestSessionService state (for state recovery)
    this.testSessionService.addMessage(context.id, {
      id: uuidv4(),
      direction: 'outgoing',
      type: msgType,
      content: msgType === 'interactive' ? { text: message, ...additionalContent } : message,
      timestamp: new Date(),
      nodeId: node.id,
    });

    // Emit simulated bot response via WebSocket
    this.testSessionGateway.emitBotResponse(
      context.id,
      [{ content: message, type: msgType, ...additionalContent }],
      node.id,
    );

    // Emit waiting for input
    this.testSessionGateway.emitWaitingInput(
      context.id,
      node.id,
      message,
      questionType === 'buttons' ? 'button' : questionType === 'list' ? 'list' : 'text',
    );

    // Update context to waiting state
    context.variables['__awaiting_variable__'] = node.data?.variable;
    context.status = 'waiting_input';
    await this.contextRepo.save(context);

    return {
      success: true,
      output: { message, questionType },
      waitingForInput: true,
    };
  }

  /**
   * Execute CONDITION node in test mode
   */
  private async executeConditionNode(
    context: ConversationContext,
    node: any,
  ): Promise<{ success: boolean; output?: any; nextNodeId?: string | null }> {
    this.logger.log(`Test: Executing CONDITION node ${node.id}`);

    // Evaluate condition
    let conditionResult = false;
    const conditionGroup = node.data?.conditionGroup;

    if (conditionGroup && conditionGroup.conditions?.length > 0) {
      conditionResult = this.evaluateConditionGroup(context.variables, conditionGroup);
    } else {
      // Legacy single condition
      const conditionVar = node.data?.conditionVar;
      const conditionOp = node.data?.conditionOp;
      const conditionVal = node.data?.conditionVal;

      if (conditionVar && conditionOp) {
        conditionResult = this.evaluateSingleCondition(
          context.variables,
          conditionVar,
          conditionOp,
          conditionVal,
        );
      }
    }

    // Find next node based on condition result
    const sourceHandle = conditionResult ? 'true' : 'false';
    const nextNode = this.findNextNode(context.chatbot, node.id, sourceHandle);

    // Emit variable change for condition result
    this.testSessionGateway.emitVariableChanged(
      context.id,
      `__condition_${node.id}__`,
      undefined,
      conditionResult,
      'node',
    );

    // Update context
    context.nodeHistory.push(node.id);
    if (nextNode) {
      context.currentNodeId = nextNode.id;
    }
    await this.contextRepo.save(context);

    return {
      success: true,
      output: { conditionResult, sourceHandle },
      nextNodeId: nextNode?.id || null,
    };
  }

  /**
   * Execute REST_API node in test mode
   * Actually makes the API call (can be useful for testing)
   */
  private async executeRestApiNode(
    context: ConversationContext,
    node: any,
  ): Promise<{ success: boolean; output?: any; nextNodeId?: string | null }> {
    this.logger.log(`Test: Executing REST_API node ${node.id}`);

    const {
      apiUrl, apiMethod, apiHeaders, apiBody, apiResponsePath,
      apiTimeout, apiContentType, apiFilterField, apiFilterValue,
      apiQueryParams, apiAuthType, apiAuthToken, apiAuthUsername, apiAuthPassword,
      apiAuthKeyName, apiAuthKeyValue, apiAuthKeyLocation
    } = node.data || {};

    if (!apiUrl) {
      this.logger.error('REST API URL not specified');
      // Find error edge
      const errorNode = this.findNextNode(context.chatbot, node.id, 'error');
      const nextNode = errorNode || this.findNextNode(context.chatbot, node.id);

      context.nodeHistory.push(node.id);
      if (nextNode) {
        context.currentNodeId = nextNode.id;
      }
      await this.contextRepo.save(context);

      return {
        success: false,
        output: { error: 'REST API URL is required' },
        nextNodeId: nextNode?.id || null,
      };
    }

    // Actually execute the REST API call
    const result = await this.restApiExecutor.execute(
      {
        url: apiUrl,
        method: apiMethod || 'GET',
        headers: apiHeaders,
        body: apiBody,
        timeout: apiTimeout,
        responsePath: apiResponsePath,
        contentType: apiContentType,
        filterField: apiFilterField,
        filterValue: apiFilterValue,
        authType: apiAuthType,
        authToken: apiAuthToken,
        authUsername: apiAuthUsername,
        authPassword: apiAuthPassword,
        authKeyName: apiAuthKeyName,
        authKeyValue: apiAuthKeyValue,
        authKeyLocation: apiAuthKeyLocation,
        queryParams: apiQueryParams,
      },
      context.variables,
    );

    // Calculate auto variable name (like production)
    const nodeIndex = calculateNodeIndex(
      context.chatbot.nodes,
      context.nodeHistory,
      node.id,
      'rest_api',
    );
    const autoVarName = generateAutoVariableName('rest_api', nodeIndex);

    // Store variables (like production)
    const dataVarPath = getFullVariablePath('rest_api', nodeIndex, 'data');
    const statusVarPath = getFullVariablePath('rest_api', nodeIndex, 'status');
    const errorVarPath = getFullVariablePath('rest_api', nodeIndex, 'error');

    // Store in context
    context.variables[dataVarPath] = result.data;
    context.variables[statusVarPath] = result.statusCode;
    context.variables[errorVarPath] = result.error || null;
    context.variables['__last_api_status__'] = result.statusCode;

    if (!result.success) {
      context.variables['__last_api_error__'] = result.error;
    }

    this.logger.log(`Test: REST API saved to ${autoVarName}: ${typeof result.data === 'string' ? result.data.substring(0, 50) : JSON.stringify(result.data).substring(0, 100)}`);

    // Emit variable changes via WebSocket (key, oldValue, newValue, source)
    this.testSessionGateway.emitVariableChanged(context.id, dataVarPath, undefined, result.data, 'api');
    this.testSessionGateway.emitVariableChanged(context.id, statusVarPath, undefined, result.statusCode, 'api');
    this.testSessionGateway.emitVariableChanged(context.id, errorVarPath, undefined, result.error || null, 'api');

    // Find next node based on success/error
    const sourceHandle = result.success ? 'success' : 'error';
    let nextNode = this.findNextNode(context.chatbot, node.id, sourceHandle);

    // Fallback to default edge if no specific handle found
    if (!nextNode) {
      nextNode = this.findNextNode(context.chatbot, node.id);
    }

    // Update context
    context.nodeHistory.push(node.id);
    if (nextNode) {
      context.currentNodeId = nextNode.id;
    }
    await this.contextRepo.save(context);

    return {
      success: result.success,
      output: {
        data: result.data,
        statusCode: result.statusCode,
        error: result.error,
        responseTime: result.responseTime,
        outputVariable: autoVarName,
      },
      nextNodeId: nextNode?.id || null,
    };
  }

  /**
   * Execute WHATSAPP_FLOW node in test mode
   */
  private async executeWhatsAppFlowNode(
    context: ConversationContext,
    node: any,
  ): Promise<{
    success: boolean;
    output?: any;
    nextNodeId?: string | null;
    waitingForInput?: boolean;
  }> {
    this.logger.log(`Test: Executing WHATSAPP_FLOW node ${node.id}`);

    const flowId = node.data?.whatsappFlowId;

    // Emit flow sent event
    this.testSessionGateway.emitFlowSent(context.id, flowId, {
      flowCta: node.data?.flowCta,
      bodyText: node.data?.flowBodyText || node.data?.content,
    });

    // Emit waiting for flow response
    this.testSessionGateway.emitWaitingInput(
      context.id,
      node.id,
      'Waiting for WhatsApp Flow response',
      'flow',
    );

    // Update context to waiting state
    context.variables['__awaiting_flow_response__'] = node.data?.flowOutputVariable;
    context.status = 'waiting_flow';
    await this.contextRepo.save(context);

    return {
      success: true,
      output: { flowId },
      waitingForInput: true,
    };
  }

  /**
   * Execute GOOGLE_CALENDAR node in test mode
   */
  private async executeGoogleCalendarNode(
    context: ConversationContext,
    node: any,
  ): Promise<{ success: boolean; output?: any; nextNodeId?: string | null }> {
    this.logger.log(`Test: Executing GOOGLE_CALENDAR node ${node.id}`);

    // For test mode, return mock calendar data
    const mockOutput = {
      skipped: true,
      reason: 'Test mode - Google Calendar call simulated',
      mockData: {
        availableSlots: [
          { start: '09:00', end: '10:00' },
          { start: '14:00', end: '15:00' },
        ],
      },
    };

    const nextNode = this.findNextNode(context.chatbot, node.id);

    // Update context
    context.nodeHistory.push(node.id);
    if (nextNode) {
      context.currentNodeId = nextNode.id;
    }
    await this.contextRepo.save(context);

    return {
      success: true,
      output: mockOutput,
      nextNodeId: nextNode?.id || null,
    };
  }

  // ============================================
  // RESPONSE PROCESSING
  // ============================================

  /**
   * Process a test response (user input in test mode)
   *
   * @param contextId - Test context ID
   * @param message - User's message text
   * @param options - Additional options (buttonId, listRowId, flowResponse)
   */
  async processTestResponse(
    contextId: string,
    message: string,
    options?: ProcessTestResponseOptions,
  ): Promise<TestNodeExecutionResult | null> {
    this.logger.log(`Processing test response for context ${contextId}: ${message}`);

    // Load context
    const context = await this.contextRepo.findOne({
      where: { id: contextId, isActive: true },
      relations: ['chatbot'],
    });

    if (!context) {
      this.logger.warn(`Test context ${contextId} not found or inactive`);
      return null;
    }

    // Check if context is waiting for input
    if (context.status !== 'waiting_input' && context.status !== 'waiting_flow') {
      this.logger.warn(`Test context ${contextId} is not waiting for input (status: ${context.status})`);
      return null;
    }

    // Get current node
    const currentNode = context.chatbot.nodes.find(
      (n) => n.id === context.currentNodeId,
    );

    if (!currentNode) {
      this.logger.warn(`Current node not found for context ${contextId}`);
      return null;
    }

    const startTime = Date.now();

    // Handle flow response
    if (context.status === 'waiting_flow' && options?.flowResponse) {
      return this.processFlowResponse(context, currentNode, options.flowResponse, startTime);
    }

    // Handle question response
    return this.processQuestionResponse(context, currentNode, message, options, startTime);
  }

  /**
   * Process a question response
   */
  private async processQuestionResponse(
    context: ConversationContext,
    currentNode: any,
    message: string,
    options: ProcessTestResponseOptions | undefined,
    startTime: number,
  ): Promise<TestNodeExecutionResult> {
    const nodeType = currentNode.type || currentNode.data?.type;
    const nodeLabel = currentNode.data?.label || `${nodeType} Node`;
    const questionType = currentNode.data?.questionType;

    // Determine value to save
    let valueToSave = message;
    if (questionType === 'list' && options?.listRowId) {
      valueToSave = options.listRowId;
    } else if (questionType === 'buttons' && options?.buttonId) {
      valueToSave = options.buttonId;
    }

    // Save to variable
    const variableName = context.variables['__awaiting_variable__'];
    if (variableName) {
      const oldValue = context.variables[variableName];
      context.variables[variableName] = valueToSave;
      delete context.variables['__awaiting_variable__'];

      // Emit variable change
      this.testSessionGateway.emitVariableChanged(
        context.id,
        variableName,
        oldValue,
        valueToSave,
        'node',
      );
    }

    // Find next node based on response
    let sourceHandle: string | undefined;
    if (questionType === 'buttons' && options?.buttonId) {
      sourceHandle = options.buttonId;
    } else if (questionType === 'list' && options?.listRowId) {
      sourceHandle = options.listRowId;
    }

    let nextNode = this.findNextNode(context.chatbot, currentNode.id, sourceHandle);
    if (!nextNode && sourceHandle) {
      // Try default edge
      nextNode = this.findNextNode(context.chatbot, currentNode.id, 'default');
    }
    if (!nextNode) {
      nextNode = this.findNextNode(context.chatbot, currentNode.id);
    }

    // Update context
    context.nodeHistory.push(currentNode.id);
    if (nextNode) {
      context.currentNodeId = nextNode.id;
    }
    context.status = 'running';
    await this.contextRepo.save(context);

    const duration = Date.now() - startTime;

    // Emit node executed
    this.testSessionGateway.emitNodeExecuted(
      context.id,
      currentNode.id,
      'success',
      duration,
    );

    // If there's a next node, continue execution
    if (nextNode) {
      this.testSessionGateway.emitNodeExited(context.id, currentNode.id, nextNode.id);
      return this.executeTestNode(context.id) as Promise<TestNodeExecutionResult>;
    }

    // No next node - test completed
    await this.completeTestExecution(context.id, 'flow_completed');

    return {
      success: true,
      nodeId: currentNode.id,
      nodeType,
      nodeLabel,
      duration,
      output: { userResponse: valueToSave },
      nextNodeId: null,
    };
  }

  /**
   * Process a WhatsApp Flow response
   */
  private async processFlowResponse(
    context: ConversationContext,
    currentNode: any,
    flowResponse: any,
    startTime: number,
  ): Promise<TestNodeExecutionResult> {
    const nodeType = currentNode.type || currentNode.data?.type;
    const nodeLabel = currentNode.data?.label || `${nodeType} Node`;

    // Save flow response
    const variableName = context.variables['__awaiting_flow_response__'];
    if (variableName) {
      const oldValue = context.variables[variableName];
      context.variables[variableName] = flowResponse;
      delete context.variables['__awaiting_flow_response__'];

      // Emit variable change
      this.testSessionGateway.emitVariableChanged(
        context.id,
        variableName,
        oldValue,
        flowResponse,
        'flow',
      );
    }

    // Emit flow response event
    this.testSessionGateway.emitFlowResponse(
      context.id,
      currentNode.data?.whatsappFlowId,
      flowResponse,
    );

    // Find next node
    const nextNode = this.findNextNode(context.chatbot, currentNode.id);

    // Update context
    context.nodeHistory.push(currentNode.id);
    if (nextNode) {
      context.currentNodeId = nextNode.id;
    }
    context.status = 'running';
    await this.contextRepo.save(context);

    const duration = Date.now() - startTime;

    // Emit node executed
    this.testSessionGateway.emitNodeExecuted(
      context.id,
      currentNode.id,
      'success',
      duration,
    );

    // If there's a next node, continue execution
    if (nextNode) {
      this.testSessionGateway.emitNodeExited(context.id, currentNode.id, nextNode.id);
      return this.executeTestNode(context.id) as Promise<TestNodeExecutionResult>;
    }

    // No next node - test completed
    await this.completeTestExecution(context.id, 'flow_completed');

    return {
      success: true,
      nodeId: currentNode.id,
      nodeType,
      nodeLabel,
      duration,
      output: { flowResponse },
      nextNodeId: null,
    };
  }

  // ============================================
  // TEST MANAGEMENT
  // ============================================

  /**
   * Complete a test execution
   */
  async completeTestExecution(
    contextId: string,
    reason: string,
  ): Promise<void> {
    this.logger.log(`Completing test execution ${contextId}: ${reason}`);

    const context = await this.contextRepo.findOne({
      where: { id: contextId },
    });

    if (context) {
      context.isActive = false;
      context.status = 'completed';
      context.completedAt = new Date();
      context.completionReason = reason;
      await this.contextRepo.save(context);
    }

    // Emit completed event
    this.testSessionGateway.completeSession(contextId, reason);

    // Cleanup loop detection data
    this.cleanupLoopDetection(contextId);
  }

  /**
   * Stop a test execution
   */
  async stopTestExecution(contextId: string): Promise<void> {
    await this.completeTestExecution(contextId, 'user_stopped');
  }

  /**
   * Get test execution state
   */
  async getTestExecutionState(contextId: string): Promise<TestExecutionState | null> {
    const context = await this.contextRepo.findOne({
      where: { id: contextId },
      relations: ['chatbot'],
    });

    if (!context) {
      return null;
    }

    const loopStats = this.loopStats.get(contextId) || {
      nodeVisits: {},
      totalSteps: 0,
      loopDetected: false,
    };

    return {
      contextId: context.id,
      chatbotId: context.chatbotId,
      status: context.status as any,
      currentNodeId: context.currentNodeId,
      variables: context.variables,
      nodeHistory: context.nodeHistory,
      loopStats,
      startedAt: context.createdAt,
      completedAt: context.completedAt || undefined,
      completionReason: context.completionReason || undefined,
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Find next node via edges
   */
  private findNextNode(
    chatbot: ChatBot,
    currentNodeId: string,
    sourceHandle?: string,
  ): any {
    let edge = chatbot.edges.find((e) => {
      if (e.source !== currentNodeId) return false;
      if (sourceHandle) {
        return e.sourceHandle === sourceHandle;
      }
      return true;
    });

    // Fallback to default edge if specific handle not found
    if (!edge && sourceHandle) {
      edge = chatbot.edges.find((e) => {
        if (e.source !== currentNodeId) return false;
        return !e.sourceHandle || e.sourceHandle === 'default';
      });
    }

    if (!edge) {
      return null;
    }

    return chatbot.nodes.find((n) => n.id === edge.target);
  }

  /**
   * Replace variables in text
   * Supports:
   * - Simple: {{variable}}
   * - Nested: {{product.name}}
   * - Array access: {{rest_api_1.data[0]}}
   * - Array + nested: {{rest_api_1.data[0].name}}
   */
  private replaceVariables(
    text: string,
    variables: Record<string, any>,
  ): string {
    // Updated regex to support array notation: [\w.\[\]]+
    return text.replace(/\{\{([\w.\[\]]+)\}\}/g, (match, varPath) => {
      const value = this.getNestedValue(variables, varPath);
      if (value === undefined || value === null) {
        return match;
      }
      // Handle arrays and objects - stringify them
      if (Array.isArray(value) || typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
    });
  }

  /**
   * Get nested value from object using dot notation
   * e.g., getNestedValue({product: {name: 'Test'}}, 'product.name') => 'Test'
   * Also supports flat keys like 'rest_api_1.data' stored directly in variables
   * And array notation like 'rest_api_1.data[0].name'
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    // First, try flat key lookup (for auto-generated variables like 'rest_api_1.data')
    if (obj[path] !== undefined) {
      return obj[path];
    }

    // Check if path contains array notation with more parts after it
    // e.g., 'rest_api_1.data[0].name' -> try 'rest_api_1.data' first, then '[0].name'
    const arrayAccessMatch = path.match(/^([\w.]+)\[(\d+)\](.*)$/);
    if (arrayAccessMatch) {
      const [, basePath, indexStr, remainder] = arrayAccessMatch;
      const index = parseInt(indexStr);

      // Get the base value (might be a flat key like 'rest_api_1.data')
      let baseValue = obj[basePath];
      if (baseValue === undefined) {
        // Try nested lookup for base path
        baseValue = this.getNestedValueSimple(obj, basePath);
      }

      if (Array.isArray(baseValue) && baseValue[index] !== undefined) {
        const arrayElement = baseValue[index];
        // If there's more path after the array access
        if (remainder && remainder.startsWith('.')) {
          const remainingPath = remainder.substring(1); // Remove leading dot
          return this.getNestedValueSimple(arrayElement, remainingPath);
        }
        return arrayElement;
      }
      return undefined;
    }

    // Standard nested path lookup
    return this.getNestedValueSimple(obj, path);
  }

  /**
   * Simple nested value lookup without flat key support
   */
  private getNestedValueSimple(obj: any, path: string): any {
    const parts = path.split('.');
    let current: any = obj;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      // Handle array index notation like items[0]
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        current = current[arrayMatch[1]]?.[parseInt(arrayMatch[2])];
      } else {
        current = current[part];
      }
    }

    return current;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateSingleCondition(
    variables: Record<string, any>,
    conditionVar: string,
    conditionOp: string,
    conditionVal: string,
  ): boolean {
    const varValue = variables[conditionVar];

    switch (conditionOp) {
      case '==':
      case 'eq':
      case 'equals':
        return String(varValue) === String(conditionVal);
      case '!=':
      case 'neq':
      case 'not_equals':
        return String(varValue) !== String(conditionVal);
      case 'contains':
        return String(varValue).toLowerCase().includes(String(conditionVal).toLowerCase());
      case 'not_contains':
        return !String(varValue).toLowerCase().includes(String(conditionVal).toLowerCase());
      case '>':
      case 'gt':
      case 'greater':
        return Number(varValue) > Number(conditionVal);
      case '<':
      case 'lt':
      case 'less':
        return Number(varValue) < Number(conditionVal);
      case '>=':
      case 'gte':
      case 'greater_or_equal':
        return Number(varValue) >= Number(conditionVal);
      case '<=':
      case 'lte':
      case 'less_or_equal':
        return Number(varValue) <= Number(conditionVal);
      case 'is_empty':
        return varValue === undefined || varValue === null || varValue === '';
      case 'is_not_empty':
        return varValue !== undefined && varValue !== null && varValue !== '';
      default:
        return false;
    }
  }

  /**
   * Evaluate a condition group with AND/OR logic
   */
  private evaluateConditionGroup(
    variables: Record<string, any>,
    conditionGroup: {
      conditions: Array<{ variable: string; operator: string; value: string }>;
      logicalOperator: 'AND' | 'OR';
    },
  ): boolean {
    const { conditions, logicalOperator } = conditionGroup;

    if (!conditions || conditions.length === 0) {
      return false;
    }

    const results = conditions.map((condition) =>
      this.evaluateSingleCondition(
        variables,
        condition.variable,
        condition.operator,
        condition.value,
      ),
    );

    if (logicalOperator === 'AND') {
      return results.every((result) => result);
    } else {
      return results.some((result) => result);
    }
  }
}
