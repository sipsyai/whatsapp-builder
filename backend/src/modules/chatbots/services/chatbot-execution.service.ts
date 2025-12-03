import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ConversationContext, NodeOutput } from '../../../entities/conversation-context.entity';
import { ChatBot } from '../../../entities/chatbot.entity';
import { Conversation } from '../../../entities/conversation.entity';
import { User } from '../../../entities/user.entity';
import { Message, MessageType, MessageStatus } from '../../../entities/message.entity';
import { TextMessageService } from '../../whatsapp/services/message-types/text-message.service';
import { InteractiveMessageService } from '../../whatsapp/services/message-types/interactive-message.service';
import { FlowMessageService } from '../../whatsapp/services/message-types/flow-message.service';
import { FlowMode } from '../../whatsapp/dto/requests/send-flow-message.dto';
import { MessagesService } from '../../messages/messages.service';
import { NodeDataType, QuestionType } from '../dto/node-data.dto';
import { WhatsAppFlow, WhatsAppFlowStatus } from '../../../entities/whatsapp-flow.entity';
import { DataSource } from '../../../entities/data-source.entity';
import { SessionHistoryService } from './session-history.service';
import { SessionGateway } from '../../websocket/session.gateway';
import { RestApiExecutorService } from './rest-api-executor.service';
import { DataSourcesService } from '../../data-sources/data-sources.service';
import { GoogleOAuthService } from '../../google-oauth/google-oauth.service';
import {
  calculateNodeIndex,
  generateAutoVariableName,
  getFullVariablePath,
} from '../utils/auto-variable-naming';

@Injectable()
export class ChatBotExecutionService {
  private readonly logger = new Logger(ChatBotExecutionService.name);

  constructor(
    @InjectRepository(ConversationContext)
    private readonly contextRepo: Repository<ConversationContext>,
    @InjectRepository(ChatBot)
    private readonly chatbotRepo: Repository<ChatBot>,
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(WhatsAppFlow)
    private readonly flowRepo: Repository<WhatsAppFlow>,
    private readonly textMessageService: TextMessageService,
    private readonly interactiveMessageService: InteractiveMessageService,
    private readonly flowMessageService: FlowMessageService,
    private readonly messagesService: MessagesService,
    private readonly sessionHistoryService: SessionHistoryService,
    private readonly sessionGateway: SessionGateway,
    private readonly restApiExecutor: RestApiExecutorService,
    private readonly dataSourcesService: DataSourcesService,
    private readonly configService: ConfigService,
    private readonly googleOAuthService: GoogleOAuthService,
  ) {}

  /**
   * Store node output in context for tracking execution results
   */
  private async storeNodeOutput(
    context: ConversationContext,
    nodeId: string,
    nodeType: string,
    nodeLabel: string,
    output: Partial<NodeOutput>,
  ): Promise<void> {
    context.nodeOutputs[nodeId] = {
      nodeId,
      nodeType,
      nodeLabel,
      executedAt: new Date().toISOString(),
      success: true,
      ...output,
    };
  }

  /**
   * Start chatbot execution for a new conversation
   */
  async startChatBot(
    conversationId: string,
    phoneNumber: string,
  ): Promise<void> {
    this.logger.log(
      `Starting chatbot for conversation ${conversationId}, phone: ${phoneNumber}`,
    );

    // Find first active chatbot
    const chatbot = await this.chatbotRepo.findOne({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });

    if (!chatbot) {
      throw new NotFoundException('No active chatbot found');
    }

    this.logger.debug(`Found chatbot ${chatbot.id}, nodes: ${JSON.stringify(chatbot.nodes)}`);

    // Find START node
    const startNode = chatbot.nodes.find(
      (node) => node.type === 'start' || node.data?.type === NodeDataType.START,
    );

    this.logger.debug(`START node search result: ${startNode ? startNode.id : 'NOT FOUND'}`);

    if (!startNode) {
      this.logger.error(`Failed to find START node. Chatbot nodes: ${JSON.stringify(chatbot.nodes)}`);
      throw new NotFoundException('START node not found in chatbot');
    }

    this.logger.log(`Found chatbot ${chatbot.id} with START node ${startNode.id}`);

    // Prepare initial variables with customer phone and OAuth tokens
    const initialVariables: Record<string, any> = {
      customer_phone: phoneNumber,
    };

    // Try to inject Google OAuth token if chatbot has an owner
    if (chatbot.userId) {
      try {
        const googleAccessToken = await this.googleOAuthService.getValidAccessToken(chatbot.userId);
        if (googleAccessToken) {
          initialVariables['google_access_token'] = googleAccessToken;
          this.logger.log(`Injected Google OAuth token for chatbot owner ${chatbot.userId}`);
        }
      } catch (error) {
        this.logger.debug(`No Google OAuth token available for user ${chatbot.userId}: ${error.message}`);
        // Not an error - user may not have connected Google Calendar
      }
    }

    // Create conversation context
    const context = this.contextRepo.create({
      conversationId,
      chatbotId: chatbot.id,
      currentNodeId: startNode.id,
      variables: initialVariables,
      nodeHistory: [],
      isActive: true,
      status: 'running',
    });

    await this.contextRepo.save(context);

    this.logger.log(`Created context ${context.id}, executing START node`);

    // Get customer user details for session event
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (conversation && conversation.participants && conversation.participants.length > 0) {
      const customerUser = conversation.participants[0];

      // Emit session:started event
      this.sessionGateway.emitSessionStarted({
        sessionId: context.id,
        conversationId,
        chatbotId: chatbot.id,
        chatbotName: chatbot.name,
        customerPhone: phoneNumber,
        customerName: customerUser.name || phoneNumber,
        startedAt: context.createdAt,
      });
    }

    // Execute START node
    await this.executeCurrentNode(context.id);
  }

  /**
   * Execute the current node based on context
   */
  async executeCurrentNode(contextId: string): Promise<void> {
    this.logger.log(`Executing current node for context ${contextId}`);

    // Load context with relations
    const context = await this.contextRepo.findOne({
      where: { id: contextId, isActive: true },
      relations: ['conversation', 'chatbot'],
    });

    if (!context) {
      throw new NotFoundException('Active context not found');
    }

    // Get current node
    const currentNode = this.findNodeById(
      context.chatbot,
      context.currentNodeId,
    );

    if (!currentNode) {
      this.logger.warn(
        `No current node found for context ${contextId}. ChatBot ended.`,
      );
      // Mark context as inactive and completed - chatbot has ended
      const previousStatus = context.status;
      context.isActive = false;
      context.status = 'completed';
      context.completedAt = new Date();
      context.completionReason = 'flow_completed';
      await this.contextRepo.save(context);

      // Emit session:status-changed event
      this.sessionGateway.emitSessionStatusChanged({
        sessionId: context.id,
        previousStatus,
        newStatus: 'completed',
        currentNodeId: context.currentNodeId,
        updatedAt: new Date(),
      });

      // Emit session:completed event
      const duration = context.completedAt.getTime() - context.createdAt.getTime();
      const totalNodes = context.nodeHistory.length;
      this.sessionGateway.emitSessionCompleted({
        sessionId: context.id,
        conversationId: context.conversationId,
        completedAt: context.completedAt,
        completionReason: 'flow_completed',
        totalNodes,
        totalMessages: 0, // TODO: Count from session history
        duration,
      });

      return;
    }

    // Check node type - can be at root level or in data object
    const nodeType = currentNode.type || currentNode.data?.type;

    this.logger.log(
      `Executing node ${currentNode.id} of type ${nodeType}`,
    );

    // Route to appropriate handler based on node type

    switch (nodeType) {
      case NodeDataType.START:
        await this.processStartNode(context, currentNode);
        break;
      case NodeDataType.MESSAGE:
        await this.processMessageNode(context, currentNode);
        break;
      case NodeDataType.QUESTION:
        await this.processQuestionNode(context, currentNode);
        break;
      case NodeDataType.CONDITION:
        await this.processConditionNode(context, currentNode);
        break;
      case NodeDataType.WHATSAPP_FLOW:
        await this.processWhatsAppFlowNode(context, currentNode);
        break;
      case NodeDataType.REST_API:
        await this.processRestApiNode(context, currentNode);
        break;
      case NodeDataType.GOOGLE_CALENDAR:
        await this.processGoogleCalendarNode(context, currentNode);
        break;
      default:
        this.logger.error(`Unknown node type: ${nodeType}`);
        throw new Error(`Unknown node type: ${nodeType}`);
    }
  }

  /**
   * Process START node - just move to next node
   */
  private async processStartNode(
    context: ConversationContext,
    node: any,
  ): Promise<void> {
    this.logger.log(`Processing START node ${node.id}`);

    // Find next node
    const nextNode = this.findNextNode(context.chatbot, node.id);

    if (!nextNode) {
      this.logger.warn('No next node after START. ChatBot ended.');
      const previousStatus = context.status;
      context.isActive = false;
      context.status = 'completed';
      context.completedAt = new Date();
      context.completionReason = 'flow_completed';
      await this.contextRepo.save(context);

      // Emit session:status-changed event
      this.sessionGateway.emitSessionStatusChanged({
        sessionId: context.id,
        previousStatus,
        newStatus: 'completed',
        currentNodeId: context.currentNodeId,
        updatedAt: new Date(),
      });

      // Emit session:completed event
      const duration = context.completedAt.getTime() - context.createdAt.getTime();
      const totalNodes = context.nodeHistory.length;
      this.sessionGateway.emitSessionCompleted({
        sessionId: context.id,
        conversationId: context.conversationId,
        completedAt: context.completedAt,
        completionReason: 'flow_completed',
        totalNodes,
        totalMessages: 0,
        duration,
      });

      return;
    }

    // Update context to next node
    context.currentNodeId = nextNode.id;
    context.nodeHistory.push(node.id);
    context.status = 'running';
    await this.contextRepo.save(context);

    // Execute next node recursively
    await this.executeCurrentNode(context.id);
  }

  /**
   * Process MESSAGE node - send text message and move to next
   */
  private async processMessageNode(
    context: ConversationContext,
    node: any,
  ): Promise<void> {
    this.logger.log(`Processing MESSAGE node ${node.id}`);

    const content = node.data?.content || '';

    // Apply variable replacement
    const message = this.replaceVariables(content, context.variables);

    // Get recipient phone number
    const recipientPhone = await this.getRecipientPhone(context.conversation);

    // Send text message
    try {
      const textResult = await this.textMessageService.sendTextMessage({
        to: recipientPhone,
        text: message,
      });

      // Save text message to database
      const businessUser = await this.getBusinessUser(context.conversation);
      await this.messagesService.create({
        conversationId: context.conversation.id,
        senderId: businessUser.id,
        type: MessageType.TEXT,
        content: {
          whatsappMessageId: textResult.messages?.[0]?.id,
          body: message,
        },
        status: MessageStatus.SENT,
        timestamp: new Date(),
      });

      this.logger.log(`Sent message to ${recipientPhone}: ${message}`);
    } catch (error) {
      this.logger.error(
        `Failed to send message to ${recipientPhone}: ${error.message}`,
        error.stack,
      );
      throw error;
    }

    // Find next node
    const nextNode = this.findNextNode(context.chatbot, node.id);

    if (!nextNode) {
      this.logger.log('No next node after MESSAGE. ChatBot ended.');
      const previousStatus = context.status;
      context.isActive = false;
      context.status = 'completed';
      context.completedAt = new Date();
      context.completionReason = 'flow_completed';
      context.nodeHistory.push(node.id);
      await this.contextRepo.save(context);

      // Emit session:status-changed event
      this.sessionGateway.emitSessionStatusChanged({
        sessionId: context.id,
        previousStatus,
        newStatus: 'completed',
        currentNodeId: context.currentNodeId,
        updatedAt: new Date(),
      });

      // Emit session:completed event
      const duration = context.completedAt.getTime() - context.createdAt.getTime();
      const totalNodes = context.nodeHistory.length;
      this.sessionGateway.emitSessionCompleted({
        sessionId: context.id,
        conversationId: context.conversationId,
        completedAt: context.completedAt,
        completionReason: 'flow_completed',
        totalNodes,
        totalMessages: 0,
        duration,
      });

      return;
    }

    // Update context to next node
    context.currentNodeId = nextNode.id;
    context.nodeHistory.push(node.id);
    context.status = 'running';
    await this.contextRepo.save(context);

    // Execute next node recursively
    await this.executeCurrentNode(context.id);
  }

  /**
   * Process QUESTION node - send interactive or text message and WAIT for response
   */
  private async processQuestionNode(
    context: ConversationContext,
    node: any,
  ): Promise<void> {
    this.logger.log(`Processing QUESTION node ${node.id}`);

    const content = node.data?.content || '';
    const questionType = node.data?.questionType;
    const variable = node.data?.variable;

    // Apply variable replacement
    const message = this.replaceVariables(content, context.variables);

    // Get recipient phone number
    const recipientPhone = await this.getRecipientPhone(context.conversation);

    try {
      // Route based on question type
      switch (questionType) {
        case QuestionType.TEXT:
          // Send plain text message, user will respond freely
          const textQuestionResult = await this.textMessageService.sendTextMessage({
            to: recipientPhone,
            text: message,
          });

          // Save text question to database
          const textBusinessUser = await this.getBusinessUser(context.conversation);
          await this.messagesService.create({
            conversationId: context.conversation.id,
            senderId: textBusinessUser.id,
            type: MessageType.TEXT,
            content: {
              whatsappMessageId: textQuestionResult.messages?.[0]?.id,
              body: message,
            },
            status: MessageStatus.SENT,
            timestamp: new Date(),
          });

          this.logger.log(`Sent text question to ${recipientPhone}`);
          break;

        case QuestionType.BUTTONS:
          let buttonItems;

          // Check for dynamic buttons source
          if (node.data?.dynamicButtonsSource) {
            const dynamicData = context.variables[node.data.dynamicButtonsSource];
            buttonItems = this.transformArrayToButtons(
              dynamicData,
              node.data?.dynamicLabelField
            );
          } else {
            // Static buttons
            const buttons = node.data?.buttons || [];
            buttonItems = buttons.map((button: any, index: number) => ({
              id: button.id || `btn-${index}`,
              title: (typeof button === 'string' ? button : button.title).substring(0, 20),
            }));
          }

          if (buttonItems.length === 0) {
            this.logger.warn('No items for buttons, falling back to text input');
            const fallbackResult = await this.textMessageService.sendTextMessage({
              to: recipientPhone,
              text: message + '\n\n(Lütfen seçiminizi yazarak belirtin)',
            });

            // Save text message to database
            const fallbackBusinessUser = await this.getBusinessUser(context.conversation);
            await this.messagesService.create({
              conversationId: context.conversation.id,
              senderId: fallbackBusinessUser.id,
              type: MessageType.TEXT,
              content: {
                whatsappMessageId: fallbackResult.messages?.[0]?.id,
                body: message + '\n\n(Lütfen seçiminizi yazarak belirtin)',
              },
              status: MessageStatus.SENT,
              timestamp: new Date(),
            });
          } else {
            const buttonResult = await this.interactiveMessageService.sendButtonMessage({
              to: recipientPhone,
              bodyText: message,
              headerText: node.data?.headerText,
              footerText: node.data?.footerText,
              buttons: buttonItems,
            });

            // Save button message to database
            const businessUser = await this.getBusinessUser(context.conversation);
            await this.messagesService.create({
              conversationId: context.conversation.id,
              senderId: businessUser.id,
              type: MessageType.INTERACTIVE,
              content: {
                whatsappMessageId: buttonResult.response.messages[0].id,
                ...buttonResult.content,
              },
              status: MessageStatus.SENT,
              timestamp: new Date(),
            });

            this.logger.log(`Sent button question to ${recipientPhone}`);
          }
          break;

        case QuestionType.LIST:
          let sections;

          // Check for dynamic list source
          if (node.data?.dynamicListSource) {
            const dynamicData = context.variables[node.data.dynamicListSource];
            // Get current page from context variables (default to 1)
            const pageVarName = `${node.data.dynamicListSource}_page`;
            const currentPage = context.variables[pageVarName] || 1;

            this.logger.log(`Dynamic list: source=${node.data.dynamicListSource}, page=${currentPage}, dataLength=${Array.isArray(dynamicData) ? dynamicData.length : 'not array'}`);

            sections = this.transformArrayToListSections(
              dynamicData,
              node.data?.dynamicLabelField,  // optional: which field to use for title
              node.data?.dynamicDescField,   // optional: which field to use for description
              currentPage,                    // current page number
              9                               // items per page (9 to leave room for navigation)
            );

            this.logger.debug(`List sections for page ${currentPage}: ${JSON.stringify(sections)}`);
          } else {
            // Static list sections
            const listSections = node.data?.listSections || [];
            sections = listSections.map((section: any) => ({
              title: section.title.substring(0, 24),
              rows: section.rows.map((row: any) => ({
                id: row.id,
                title: row.title.substring(0, 24),
                description: row.description?.substring(0, 72),
              })),
            }));
          }

          if (sections.length === 0 || sections[0].rows.length === 0) {
            this.logger.warn('No items for interactive list, falling back to text input');
            // Fallback to text input if no items
            const fallbackListResult = await this.textMessageService.sendTextMessage({
              to: recipientPhone,
              text: message + '\n\n(Lütfen seçiminizi yazarak belirtin)',
            });

            // Save text message to database
            const fallbackListBusinessUser = await this.getBusinessUser(context.conversation);
            await this.messagesService.create({
              conversationId: context.conversation.id,
              senderId: fallbackListBusinessUser.id,
              type: MessageType.TEXT,
              content: {
                whatsappMessageId: fallbackListResult.messages?.[0]?.id,
                body: message + '\n\n(Lütfen seçiminizi yazarak belirtin)',
              },
              status: MessageStatus.SENT,
              timestamp: new Date(),
            });
          } else {
            const listResult = await this.interactiveMessageService.sendListMessage({
              to: recipientPhone,
              bodyText: message,
              headerText: node.data?.headerText,
              footerText: node.data?.footerText,
              listButtonText: node.data?.listButtonText || 'Seçin',
              sections,
            });

            // Save list message to database
            const businessUserForList = await this.getBusinessUser(context.conversation);
            await this.messagesService.create({
              conversationId: context.conversation.id,
              senderId: businessUserForList.id,
              type: MessageType.INTERACTIVE,
              content: {
                whatsappMessageId: listResult.response.messages[0].id,
                ...listResult.content,
              },
              status: MessageStatus.SENT,
              timestamp: new Date(),
            });

            this.logger.log(`Sent list question to ${recipientPhone}`);
          }
          break;

        default:
          this.logger.error(`Unknown question type: ${questionType}`);
          throw new Error(`Unknown question type: ${questionType}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to send question to ${recipientPhone}: ${error.message}`,
        error.stack,
      );
      throw error;
    }

    // DO NOT move to next node - wait for user response
    // Save the variable name for later use when response arrives
    context.variables['__awaiting_variable__'] = variable;
    const previousStatus = context.status;
    context.status = 'waiting_input';
    await this.contextRepo.save(context);

    // Emit session:status-changed event
    this.sessionGateway.emitSessionStatusChanged({
      sessionId: context.id,
      previousStatus,
      newStatus: 'waiting_input',
      currentNodeId: context.currentNodeId,
      currentNodeLabel: node.data?.label || `Question: ${questionType}`,
      updatedAt: new Date(),
    });

    this.logger.log(
      `Waiting for user response to save in variable: ${variable}`,
    );
  }

  /**
   * Evaluate a single condition against context variables
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
        this.logger.error(`Unknown condition operator: ${conditionOp}`);
        return false;
    }
  }

  /**
   * Evaluate a condition group with multiple conditions and AND/OR logic
   */
  private evaluateConditionGroup(
    variables: Record<string, any>,
    conditionGroup: { conditions: Array<{ variable: string; operator: string; value: string }>; logicalOperator: 'AND' | 'OR' },
  ): boolean {
    const { conditions, logicalOperator } = conditionGroup;

    if (!conditions || conditions.length === 0) {
      this.logger.warn('Condition group has no conditions, defaulting to false');
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

  /**
   * Process CONDITION node - evaluate condition and route accordingly
   */
  private async processConditionNode(
    context: ConversationContext,
    node: any,
  ): Promise<void> {
    this.logger.log(`Processing CONDITION node ${node.id}`);

    let conditionResult = false;
    const conditionGroup = node.data?.conditionGroup;

    // Check if using condition group (multi-condition) or single condition
    if (conditionGroup && conditionGroup.conditions?.length > 0) {
      // Multi-condition evaluation with AND/OR logic
      conditionResult = this.evaluateConditionGroup(context.variables, conditionGroup);
      this.logger.log(
        `Condition group evaluation (${conditionGroup.logicalOperator}): ${conditionGroup.conditions.length} conditions = ${conditionResult}`,
      );
    } else {
      // Legacy single condition evaluation
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
        this.logger.log(
          `Condition evaluation: ${conditionVar} ${conditionOp} ${conditionVal} = ${conditionResult}`,
        );
      } else {
        this.logger.warn('No valid condition configured, defaulting to false');
      }
    }

    // Find next node based on condition result
    const sourceHandle = conditionResult ? 'true' : 'false';
    const nextNode = this.findNextNode(context.chatbot, node.id, sourceHandle);

    if (!nextNode) {
      this.logger.warn(
        `No next node after CONDITION (${sourceHandle}). ChatBot ended.`,
      );
      const previousStatus = context.status;
      context.isActive = false;
      context.status = 'completed';
      context.completedAt = new Date();
      context.completionReason = 'flow_completed';
      context.nodeHistory.push(node.id);
      await this.contextRepo.save(context);

      // Emit session:status-changed event
      this.sessionGateway.emitSessionStatusChanged({
        sessionId: context.id,
        previousStatus,
        newStatus: 'completed',
        currentNodeId: context.currentNodeId,
        updatedAt: new Date(),
      });

      // Emit session:completed event
      const duration = context.completedAt.getTime() - context.createdAt.getTime();
      const totalNodes = context.nodeHistory.length;
      this.sessionGateway.emitSessionCompleted({
        sessionId: context.id,
        conversationId: context.conversationId,
        completedAt: context.completedAt,
        completionReason: 'flow_completed',
        totalNodes,
        totalMessages: 0,
        duration,
      });

      return;
    }

    // Update context to next node
    context.currentNodeId = nextNode.id;
    context.nodeHistory.push(node.id);
    context.status = 'running';
    await this.contextRepo.save(context);

    // Execute next node recursively
    await this.executeCurrentNode(context.id);
  }

  /**
   * Get data source configuration by ID or fallback to environment config
   */
  private async getDataSourceConfig(
    dataSourceId?: string,
  ): Promise<{ baseUrl: string; token: string } | null> {
    if (dataSourceId) {
      try {
        const dataSource = await this.dataSourcesService.findOne(dataSourceId);
        if (dataSource && dataSource.isActive) {
          return {
            baseUrl: dataSource.baseUrl,
            token: dataSource.authToken || '',
          };
        }
      } catch (error) {
        this.logger.warn(`DataSource ${dataSourceId} not found: ${error.message}`);
      }
    }

    // Fallback to config service
    const baseUrl = this.configService.get<string>('STRAPI_BASE_URL');
    const token = this.configService.get<string>('STRAPI_TOKEN');
    if (baseUrl && token) {
      return { baseUrl, token };
    }

    return null;
  }

  /**
   * Fetch initial data from data source for WhatsApp Flow
   */
  private async fetchFlowInitialData(
    dataSource: DataSource,
    config?: any,
  ): Promise<any> {
    const endpoint = config?.endpoint || '/api/brands';
    try {
      const response = await fetch(`${dataSource.baseUrl}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${dataSource.authToken}`,
          ...(dataSource.headers || {}),
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Transform to dropdown format for WhatsApp Flow
      return (data.data || []).map((item: any) => ({
        id: item.name || item.id?.toString(),
        title: item.name,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch from data source: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch brands from external API for Flow initial data (backward compatibility)
   * @deprecated Use fetchFlowInitialData with DataSource instead
   */
  private async fetchBrandsFromStrapi(config: {
    baseUrl: string;
    token: string;
  }): Promise<{ id: string; title: string }[]> {
    try {
      const response = await fetch(`${config.baseUrl}/api/brands`, {
        headers: {
          Authorization: `Bearer ${config.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Transform response to Flow dropdown format
      return (data.data || []).map((brand: any) => ({
        id: brand.name || brand.id?.toString(),
        title: brand.name,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch brands: ${error.message}`);
      return [];
    }
  }

  /**
   * Process WHATSAPP_FLOW node - send WhatsApp Flow and WAIT for completion
   */
  private async processWhatsAppFlowNode(
    context: ConversationContext,
    node: any,
  ): Promise<void> {
    this.logger.log(`Processing WHATSAPP_FLOW node ${node.id}`);

    const flowId = node.data?.whatsappFlowId;
    const flowMode = (node.data?.flowMode || FlowMode.NAVIGATE) as FlowMode;
    const flowCta = node.data?.flowCta || 'Start';
    const flowOutputVariable = node.data?.flowOutputVariable;

    if (!flowId) {
      this.logger.error('WhatsApp Flow ID not specified in node data');
      throw new Error('WhatsApp Flow ID required');
    }

    // Load Flow from database with dataSource relation
    const flow = await this.flowRepo.findOne({
      where: { whatsappFlowId: flowId },
      relations: ['dataSource'],
    });

    if (!flow) {
      this.logger.error(`WhatsApp Flow with Meta ID ${flowId} not found`);
      throw new NotFoundException(`WhatsApp Flow ${flowId} not found`);
    }

    // Get recipient phone number
    const recipientPhone = await this.getRecipientPhone(context.conversation);

    // Prepare initial data with variable replacement
    let initialData = node.data?.flowInitialData || {};
    if (typeof initialData === 'object') {
      initialData = JSON.parse(
        this.replaceVariables(JSON.stringify(initialData), context.variables),
      );
    }

    // Get initial screen from node config
    let initialScreen = node.data?.flowInitialScreen;

    // Determine DataSource: Node-level takes priority over Flow entity
    let dataSourceForFlow: DataSource | null = null;
    let endpointForFlow: string | undefined;
    let dataKeyForFlow: string | undefined;

    if (node.data?.dataSourceId) {
      // Node-level DataSource specified
      try {
        dataSourceForFlow = await this.dataSourcesService.findOne(node.data.dataSourceId);
        endpointForFlow = node.data.dataSourceEndpoint;
        dataKeyForFlow = node.data.dataSourceDataKey;
        this.logger.log(
          `Using node-level DataSource: ${dataSourceForFlow?.name || node.data.dataSourceId}`,
        );
      } catch (error) {
        this.logger.warn(
          `Node-level DataSource ${node.data.dataSourceId} not found: ${error.message}`,
        );
      }
    }

    // Fallback to Flow entity DataSource if node-level not specified or not found
    if (!dataSourceForFlow && flow.dataSource && flow.dataSource.isActive) {
      dataSourceForFlow = flow.dataSource;
      this.logger.log(
        `Using Flow entity DataSource (fallback): ${flow.dataSource.name}`,
      );
    }

    // If we have an active DataSource, fetch dynamic initial data
    if (dataSourceForFlow && dataSourceForFlow.isActive) {
      this.logger.log(
        `Fetching initial data from DataSource: ${dataSourceForFlow.name}`,
      );

      try {
        const dynamicData = await this.fetchFlowInitialData(
          dataSourceForFlow,
          {
            endpoint: endpointForFlow || flow.metadata?.dataSourceConfig?.endpoint,
            dataKey: dataKeyForFlow || flow.metadata?.dataSourceConfig?.dataKey || 'brands',
          },
        );

        this.logger.log(`Fetched ${dynamicData.length} items for Flow initial data`);

        // Merge dynamic data into initial data
        // Use node-level dataKey, then flow metadata dataKey, then default 'brands'
        const dataKey = dataKeyForFlow || flow.metadata?.dataSourceConfig?.dataKey || 'brands';
        initialData = { ...initialData, [dataKey]: dynamicData };

        // Use initial screen from metadata if specified
        if (flow.metadata?.dataSourceConfig?.initialScreen && !initialScreen) {
          initialScreen = flow.metadata.dataSourceConfig.initialScreen;
        }
      } catch (error) {
        this.logger.error(
          `Failed to fetch initial data from data source: ${error.message}`,
        );
        // Continue without dynamic data - don't fail the entire flow
      }
    }

    // Create flow_token: {contextId}-{nodeId}
    const flowToken = `${context.id}-${node.id}`;

    try {
      // Send Flow message - use flowBodyText (new) or content (legacy) for body text
      const bodyContent =
        node.data?.flowBodyText ||
        node.data?.content ||
        'Please complete this form';
      const message = this.replaceVariables(bodyContent, context.variables);

      // Use flowHeaderText/flowFooterText (new) or headerText/footerText (legacy)
      const headerText = node.data?.flowHeaderText || node.data?.headerText;
      const footerText = node.data?.flowFooterText || node.data?.footerText;

      this.logger.debug(`Sending Flow with initialScreen: ${initialScreen}, initialData keys: ${Object.keys(initialData).join(', ')}`);

      const flowResult = await this.flowMessageService.sendFlowMessage({
        to: recipientPhone,
        flowId: flow.whatsappFlowId!, // Non-null: we query by whatsappFlowId so it exists
        body: message,
        ctaText: flowCta,
        header: headerText,
        footer: footerText,
        flowToken,
        mode: flowMode,
        initialScreen,
        initialData,
        isDraft: flow.status === WhatsAppFlowStatus.DRAFT,
      });

      // Save Flow message to database
      const businessUser = await this.getBusinessUser(context.conversation);
      await this.messagesService.create({
        conversationId: context.conversation.id,
        senderId: businessUser.id,
        type: MessageType.INTERACTIVE,
        content: {
          whatsappMessageId: flowResult.messages?.[0]?.id,
          type: 'flow',
          body: { text: message },
          header: headerText ? { type: 'text', text: headerText } : undefined,
          footer: footerText ? { text: footerText } : undefined,
          action: {
            name: 'flow',
            parameters: {
              flow_id: flow.whatsappFlowId,
              flow_cta: flowCta,
            },
          },
        },
        status: MessageStatus.SENT,
        timestamp: new Date(),
      });

      this.logger.log(
        `Sent WhatsApp Flow ${flow.whatsappFlowId} to ${recipientPhone}`,
      );

      // DO NOT move to next node - wait for Flow completion
      // Save the output variable name for later use when Flow completes
      if (flowOutputVariable) {
        context.variables['__awaiting_flow_response__'] = flowOutputVariable;
      }

      // Set timeout: 10 minutes for Flow completion
      const FLOW_TIMEOUT_MINUTES = 10;
      context.expiresAt = new Date(
        Date.now() + FLOW_TIMEOUT_MINUTES * 60 * 1000,
      );
      const previousStatus = context.status;
      context.status = 'waiting_flow';
      await this.contextRepo.save(context);

      // Emit session:status-changed event
      this.sessionGateway.emitSessionStatusChanged({
        sessionId: context.id,
        previousStatus,
        newStatus: 'waiting_flow',
        currentNodeId: context.currentNodeId,
        currentNodeLabel: node.data?.label || `WhatsApp Flow: ${flow.name}`,
        updatedAt: new Date(),
      });

      this.logger.log(
        `Waiting for Flow completion. Timeout at: ${context.expiresAt.toISOString()}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send Flow to ${recipientPhone}: ${error.message}`,
        error.stack,
      );

      // Set error variable for error node to use
      context.variables['api_error'] = error.message;
      context.variables['__last_api_error__'] = error.message;
      context.nodeHistory.push(node.id);

      // Find next node via error edge first, then fallback to default
      let nextNode = this.findNextNode(context.chatbot, node.id, 'error');
      if (!nextNode) {
        nextNode = this.findNextNode(context.chatbot, node.id);
      }

      if (nextNode) {
        this.logger.warn(
          `Flow send failed, moving to ${nextNode.id} via ${nextNode === this.findNextNode(context.chatbot, node.id, 'error') ? 'error' : 'default'} path`,
        );
        context.currentNodeId = nextNode.id;
        context.status = 'running';
        await this.contextRepo.save(context);
        await this.executeCurrentNode(context.id);
      } else {
        this.logger.warn('Flow send failed and no next node, ending chatbot');
        context.isActive = false;
        context.status = 'completed';
        context.completedAt = new Date();
        context.completionReason = 'flow_error';
        await this.contextRepo.save(context);
      }
    }
  }

  /**
   * Process REST_API node - make HTTP request and store response
   */
  private async processRestApiNode(
    context: ConversationContext,
    node: any,
  ): Promise<void> {
    this.logger.log(`Processing REST_API node ${node.id}`);

    const {
      apiUrl, apiMethod, apiHeaders, apiBody, apiOutputVariable, apiResponsePath,
      apiErrorVariable, apiTimeout, apiContentType, apiFilterField, apiFilterValue,
      // Yeni alanlar
      apiQueryParams, apiAuthType, apiAuthToken, apiAuthUsername, apiAuthPassword,
      apiAuthKeyName, apiAuthKeyValue, apiAuthKeyLocation
    } = node.data || {};

    if (!apiUrl) {
      this.logger.error('REST API URL not specified');
      throw new Error('REST API URL is required');
    }

    // Refresh Google OAuth token if needed before API call
    // This ensures the token is fresh for long-running chatbot sessions
    await this.refreshGoogleTokenIfNeeded(context);

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
        // Auth parametreleri
        authType: apiAuthType,
        authToken: apiAuthToken,
        authUsername: apiAuthUsername,
        authPassword: apiAuthPassword,
        authKeyName: apiAuthKeyName,
        authKeyValue: apiAuthKeyValue,
        authKeyLocation: apiAuthKeyLocation,
        // Query params
        queryParams: apiQueryParams,
      },
      context.variables,
    );

    // Calculate auto variable name
    const nodeIndex = calculateNodeIndex(
      context.chatbot.nodes,
      context.nodeHistory,
      node.id,
      'rest_api',
    );
    const autoVarName = generateAutoVariableName('rest_api', nodeIndex);

    // Store result in variables using auto-generated names
    context.variables[getFullVariablePath('rest_api', nodeIndex, 'data')] = result.data;
    context.variables[getFullVariablePath('rest_api', nodeIndex, 'status')] = result.statusCode;
    context.variables[getFullVariablePath('rest_api', nodeIndex, 'error')] = result.error || null;
    context.variables['__last_api_status__'] = result.statusCode;

    if (!result.success) {
      context.variables['__last_api_error__'] = result.error;
    }

    this.logger.log(`REST API saved to auto variable ${autoVarName}: data=${typeof result.data === 'string' ? result.data.substring(0, 50) : JSON.stringify(result.data).substring(0, 100)}`);

    // Store node output for REST API node
    await this.storeNodeOutput(context, node.id, 'rest_api', node.data?.label || 'REST API', {
      success: result.success,
      statusCode: result.statusCode,
      data: result.data,
      error: result.error,
      duration: result.responseTime,
      outputVariable: autoVarName,
    });

    // Add to history
    context.nodeHistory.push(node.id);

    // Find next node based on success/error
    const sourceHandle = result.success ? 'success' : 'error';
    let nextNode = this.findNextNode(context.chatbot, node.id, sourceHandle);

    // Fallback to default edge if no specific handle found
    if (!nextNode) {
      nextNode = this.findNextNode(context.chatbot, node.id);
    }

    if (!nextNode) {
      this.logger.log('No next node after REST_API. ChatBot ended.');
      const previousStatus = context.status;
      context.isActive = false;
      context.status = 'completed';
      context.completedAt = new Date();
      context.completionReason = result.success ? 'flow_completed' : 'api_error';
      await this.contextRepo.save(context);

      // Emit completion events
      this.sessionGateway.emitSessionStatusChanged({
        sessionId: context.id,
        previousStatus,
        newStatus: 'completed',
        currentNodeId: context.currentNodeId,
        updatedAt: new Date(),
      });

      this.sessionGateway.emitSessionCompleted({
        sessionId: context.id,
        conversationId: context.conversationId,
        completedAt: context.completedAt,
        completionReason: context.completionReason,
        totalNodes: context.nodeHistory.length,
        totalMessages: 0,
        duration: context.completedAt.getTime() - context.createdAt.getTime(),
      });
      return;
    }

    context.currentNodeId = nextNode.id;
    context.status = 'running';
    await this.contextRepo.save(context);

    // Continue to next node
    await this.executeCurrentNode(context.id);
  }

  /**
   * Process GOOGLE_CALENDAR node - fetch calendar data based on action type
   * Supports: get_today_events, get_tomorrow_events, get_events, check_availability
   *
   * User Selection:
   * - calendarUserSource: 'owner' | 'static' | 'variable'
   *   - 'owner': Use chatbot owner's calendar (default, backward compatible)
   *   - 'static': Use specific user ID from calendarUserId
   *   - 'variable': Get user ID from variable specified in calendarUserVariable
   */
  private async processGoogleCalendarNode(
    context: ConversationContext,
    node: any,
  ): Promise<void> {
    this.logger.log(`Processing GOOGLE_CALENDAR node ${node.id}`);

    const {
      // Action type - defaults to check_availability for backward compatibility
      calendarAction = 'check_availability',

      // User/Calendar Owner Selection
      calendarUserSource = 'owner',  // 'owner' | 'static' | 'variable'
      calendarUserId,                // if 'static' - specific user ID
      calendarUserVariable,          // if 'variable' - variable name containing user ID

      // For get_events action - date range (with calendar prefix for frontend compatibility)
      calendarDateSource: dateSource,
      calendarDateVariable: dateVariable,
      calendarStaticDate: staticDate,
      calendarEndDateSource: endDateSource,
      calendarEndDateVariable: endDateVariable,
      calendarStaticEndDate: staticEndDate,

      // For check_availability action (with calendar prefix for frontend compatibility)
      calendarWorkingHoursStart: workStart = '09:00',
      calendarWorkingHoursEnd: workEnd = '18:00',
      calendarSlotDuration: slotDuration = 60,
      calendarOutputFormat: outputFormat = 'full',

      // Common (with calendar prefix for frontend compatibility)
      calendarMaxResults: maxResults = 50,
    } = node.data || {};

    // Calculate auto variable name for calendar node
    const calNodeIndex = calculateNodeIndex(
      context.chatbot.nodes,
      context.nodeHistory,
      node.id,
      'google_calendar',
    );
    const autoVarName = generateAutoVariableName('google_calendar', calNodeIndex);
    const autoVarPath = getFullVariablePath('google_calendar', calNodeIndex, 'result');

    // Get chatbot for owner reference
    const chatbot = context.chatbot || await this.chatbotRepo.findOne({
      where: { id: context.chatbotId },
    });

    // Determine which user's calendar to read based on calendarUserSource
    let targetUserId: string | undefined;

    switch (calendarUserSource) {
      case 'owner':
        // Use chatbot owner's calendar (default/backward compatible behavior)
        targetUserId = chatbot?.userId;
        break;

      case 'static':
        // Use specific user ID from node config
        targetUserId = calendarUserId;
        break;

      case 'variable':
        // Get user ID from variable
        if (calendarUserVariable) {
          targetUserId = context.variables[calendarUserVariable];
        }
        break;

      default:
        // Fallback to owner for unknown source types
        targetUserId = chatbot?.userId;
        this.logger.warn(`Unknown calendarUserSource: ${calendarUserSource}, falling back to owner`);
    }

    // Validate that we have a target user
    if (!targetUserId) {
      const errorMessage = calendarUserSource === 'owner'
        ? 'Calendar not configured - chatbot has no owner'
        : calendarUserSource === 'static'
          ? 'Calendar user ID not specified in node configuration'
          : `Calendar user variable '${calendarUserVariable}' is empty or not set`;

      this.logger.warn(`No calendar user specified: ${errorMessage}`);
      context.variables[autoVarPath] = {
        error: true,
        message: errorMessage,
        code: 'NO_USER',
        source: calendarUserSource,
      };
      await this.storeNodeOutput(context, node.id, 'google_calendar', node.data?.label || 'Google Calendar', {
        success: false,
        error: errorMessage,
        outputVariable: autoVarName,
      });
      await this.moveToNextNode(context, node);
      return;
    }

    this.logger.log(`Processing calendar action: ${calendarAction} for user ${targetUserId} (source: ${calendarUserSource})`);

    try {
      let result: any;

      switch (calendarAction) {
        case 'get_today_events':
          result = await this.googleOAuthService.getTodayEvents(targetUserId);
          this.logger.log(`Fetched ${result.events?.length || 0} events for today`);
          break;

        case 'get_tomorrow_events':
          result = await this.googleOAuthService.getTomorrowEvents(targetUserId);
          this.logger.log(`Fetched ${result.events?.length || 0} events for tomorrow`);
          break;

        case 'get_events':
          // Get date range from variables or static values
          const startDate = this.resolveDateValue(context.variables, dateSource, dateVariable, staticDate);
          const endDate = this.resolveDateValue(context.variables, endDateSource, endDateVariable, staticEndDate);

          if (!startDate) {
            this.logger.warn('Start date not specified for get_events action');
            context.variables[autoVarPath] = {
              error: true,
              message: 'Start date is required for get_events action',
              code: 'MISSING_DATE',
            };
            await this.storeNodeOutput(context, node.id, 'google_calendar', node.data?.label || 'Google Calendar', {
              success: false,
              error: 'Start date is required for get_events action',
              outputVariable: autoVarName,
            });
            await this.moveToNextNode(context, node);
            return;
          }

          // Validate date format
          if (!this.isValidDateFormat(startDate)) {
            this.logger.warn(`Invalid start date format: ${startDate}`);
            const invalidStartDateError = `Invalid start date format: ${startDate}. Expected YYYY-MM-DD`;
            context.variables[autoVarPath] = {
              error: true,
              message: invalidStartDateError,
              code: 'INVALID_DATE',
            };
            await this.storeNodeOutput(context, node.id, 'google_calendar', node.data?.label || 'Google Calendar', {
              success: false,
              error: invalidStartDateError,
              outputVariable: autoVarName,
            });
            await this.moveToNextNode(context, node);
            return;
          }

          // Build time range
          const timeMin = new Date(`${startDate}T00:00:00`).toISOString();
          let timeMax: string;

          if (endDate && this.isValidDateFormat(endDate)) {
            timeMax = new Date(`${endDate}T23:59:59`).toISOString();
          } else {
            // Default to end of start date if no end date specified
            timeMax = new Date(`${startDate}T23:59:59`).toISOString();
          }

          result = await this.googleOAuthService.getCalendarEvents(
            targetUserId,
            timeMin,
            timeMax,
            maxResults,
          );
          this.logger.log(`Fetched ${result.events?.length || 0} events from ${startDate} to ${endDate || startDate}`);
          break;

        case 'check_availability':
        default:
          // Original availability checking logic
          const targetDate = this.resolveDateValue(context.variables, dateSource, dateVariable, staticDate)
            || new Date().toISOString().split('T')[0];

          if (!this.isValidDateFormat(targetDate)) {
            this.logger.warn(`Invalid date format: ${targetDate}`);
            const invalidDateError = `Invalid date format: ${targetDate}. Expected YYYY-MM-DD`;
            context.variables[autoVarPath] = {
              error: true,
              message: invalidDateError,
              code: 'INVALID_DATE',
            };
            await this.storeNodeOutput(context, node.id, 'google_calendar', node.data?.label || 'Google Calendar', {
              success: false,
              error: invalidDateError,
              outputVariable: autoVarName,
            });
            await this.moveToNextNode(context, node);
            return;
          }

          this.logger.log(`Fetching availability for ${targetDate}`);

          if (outputFormat === 'slots_only') {
            result = await this.googleOAuthService.getAvailableSlotsOnly(
              targetUserId,
              targetDate,
              workStart,
              workEnd,
              slotDuration,
            );
            this.logger.log(`Found ${result.length} available slots for ${targetDate}`);
          } else {
            result = await this.googleOAuthService.getAvailableSlots(
              targetUserId,
              targetDate,
              workStart,
              workEnd,
              slotDuration,
            );
            this.logger.log(
              `Availability for ${targetDate}: ${result.availableSlots}/${result.totalSlots} slots available`,
            );
          }
          break;
      }

      // Store result in auto-generated output variable
      context.variables[autoVarPath] = result;

      // Store node output for Google Calendar node (success)
      await this.storeNodeOutput(context, node.id, 'google_calendar', node.data?.label || 'Google Calendar', {
        success: true,
        data: result,
        outputVariable: autoVarName,
      });
    } catch (error) {
      this.logger.error(`Failed to execute calendar action '${calendarAction}' for user ${targetUserId}: ${error.message}`);

      // Store error in auto-generated output variable so flow can handle it
      context.variables[autoVarPath] = {
        error: true,
        message: error.message || `Failed to execute calendar action: ${calendarAction}`,
        code: error.name === 'UnauthorizedException' ? 'NOT_CONNECTED' : 'FETCH_ERROR',
        action: calendarAction,
        userId: targetUserId,
        userSource: calendarUserSource,
      };

      // Store node output for Google Calendar node (error)
      await this.storeNodeOutput(context, node.id, 'google_calendar', node.data?.label || 'Google Calendar', {
        success: false,
        error: error.message,
        outputVariable: autoVarName,
      });
    }

    // Move to next node
    await this.moveToNextNode(context, node);
  }

  /**
   * Resolve a date value from variable or static source
   */
  private resolveDateValue(
    variables: Record<string, any>,
    source?: string,
    variableName?: string,
    staticValue?: string,
  ): string | null {
    if (source === 'variable' && variableName) {
      const value = variables[variableName];
      return value ? String(value) : null;
    }
    if (source === 'static' && staticValue) {
      return staticValue;
    }
    // Fallback: check if staticValue exists even without source specified
    if (staticValue) {
      return staticValue;
    }
    return null;
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  private isValidDateFormat(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(date);
  }

  /**
   * Helper method to move to the next node after processing
   */
  private async moveToNextNode(
    context: ConversationContext,
    node: any,
  ): Promise<void> {
    // Add current node to history
    context.nodeHistory.push(node.id);

    // Find next node
    const nextNode = this.findNextNode(context.chatbot, node.id);

    if (!nextNode) {
      this.logger.log(`No next node after ${node.data?.type || node.type}. ChatBot ended.`);
      const previousStatus = context.status;
      context.isActive = false;
      context.status = 'completed';
      context.completedAt = new Date();
      context.completionReason = 'flow_completed';
      await this.contextRepo.save(context);

      // Emit session:status-changed event
      this.sessionGateway.emitSessionStatusChanged({
        sessionId: context.id,
        previousStatus,
        newStatus: 'completed',
        currentNodeId: context.currentNodeId,
        updatedAt: new Date(),
      });

      // Emit session:completed event
      const duration = context.completedAt.getTime() - context.createdAt.getTime();
      const totalNodes = context.nodeHistory.length;
      this.sessionGateway.emitSessionCompleted({
        sessionId: context.id,
        conversationId: context.conversationId,
        completedAt: context.completedAt,
        completionReason: 'flow_completed',
        totalNodes,
        totalMessages: 0,
        duration,
      });

      return;
    }

    // Update context to next node
    context.currentNodeId = nextNode.id;
    context.status = 'running';
    await this.contextRepo.save(context);

    // Execute next node recursively
    await this.executeCurrentNode(context.id);
  }

  /**
   * Process Flow completion response
   * Called when Flow completes (from webhook or Flow endpoint)
   */
  async processFlowResponse(
    flowToken: string,
    flowResponse: any,
  ): Promise<void> {
    this.logger.log(`Processing Flow response for token: ${flowToken}`);

    // Parse flow_token: {contextId}-{nodeId}
    // UUID format: 8-4-4-4-12 characters = 5 parts when split by '-'
    // nodeId can be any string (e.g., "price-flow", "stock-update-node")
    const parts = flowToken.split('-');
    if (parts.length < 6) {
      this.logger.error(`Invalid flow_token format: ${flowToken}, expected at least 6 parts but got ${parts.length}`);
      return;
    }

    const contextId = parts.slice(0, 5).join('-'); // First 5 parts = contextId UUID
    const nodeId = parts.slice(5).join('-'); // Remaining parts = nodeId (can contain dashes)

    this.logger.log(`Parsed flow_token - contextId: ${contextId}, nodeId: ${nodeId}`);

    // Load context
    const context = await this.contextRepo.findOne({
      where: { id: contextId, isActive: true },
      relations: ['conversation', 'chatbot'],
    });

    if (!context) {
      this.logger.warn(`Context ${contextId} not found or inactive`);
      return;
    }

    // Calculate auto variable name for WhatsApp Flow node
    const flowNodeIndex = calculateNodeIndex(
      context.chatbot.nodes,
      context.nodeHistory,
      nodeId,
      'whatsapp_flow',
    );
    const autoVarName = generateAutoVariableName('whatsapp_flow', flowNodeIndex);
    const autoVarPath = getFullVariablePath('whatsapp_flow', flowNodeIndex, 'response');

    // Save Flow response using auto-generated variable
    context.variables[autoVarPath] = flowResponse;
    delete context.variables['__awaiting_flow_response__'];

    this.logger.log(
      `Saved Flow response to auto variable '${autoVarPath}': ${JSON.stringify(flowResponse)}`,
    );

    // Get node info for storeNodeOutput
    const flowNode = this.findNodeById(context.chatbot, nodeId);

    // Store node output for WhatsApp Flow node
    await this.storeNodeOutput(context, nodeId, 'whatsapp_flow', flowNode?.data?.label || 'WhatsApp Flow', {
      flowResponse: flowResponse,
      outputVariable: autoVarName,
    });

    // Add node to history
    context.nodeHistory.push(nodeId);

    // Find next node
    const nextNode = this.findNextNode(context.chatbot, nodeId);

    if (!nextNode) {
      this.logger.log('No next node after Flow. ChatBot ended.');
      const previousStatus = context.status;
      context.isActive = false;
      context.status = 'completed';
      context.completedAt = new Date();
      context.completionReason = 'flow_completed';
      await this.contextRepo.save(context);

      // Emit session:status-changed event
      this.sessionGateway.emitSessionStatusChanged({
        sessionId: context.id,
        previousStatus,
        newStatus: 'completed',
        currentNodeId: context.currentNodeId,
        updatedAt: new Date(),
      });

      // Emit session:completed event
      const duration = context.completedAt.getTime() - context.createdAt.getTime();
      const totalNodes = context.nodeHistory.length;
      this.sessionGateway.emitSessionCompleted({
        sessionId: context.id,
        conversationId: context.conversationId,
        completedAt: context.completedAt,
        completionReason: 'flow_completed',
        totalNodes,
        totalMessages: 0,
        duration,
      });

      return;
    }

    // Update context to next node
    const previousStatus = context.status;
    context.currentNodeId = nextNode.id;
    context.status = 'running';
    await this.contextRepo.save(context);

    // Emit session:status-changed event (back to running)
    this.sessionGateway.emitSessionStatusChanged({
      sessionId: context.id,
      previousStatus,
      newStatus: 'running',
      currentNodeId: context.currentNodeId,
      updatedAt: new Date(),
    });

    // Execute next node
    this.logger.log(`Moving to next node: ${nextNode.id}`);
    await this.executeCurrentNode(context.id);
  }

  /**
   * Process user response to a QUESTION node
   */
  async processUserResponse(
    conversationId: string,
    userMessage: string,
    buttonId?: string,
    listRowId?: string,
  ): Promise<void> {
    this.logger.log(
      `Processing user response for conversation ${conversationId}: ${userMessage}`,
    );

    // Load active context
    const context = await this.contextRepo.findOne({
      where: { conversationId, isActive: true },
      relations: ['conversation', 'chatbot'],
    });

    if (!context) {
      this.logger.warn(
        `No active context found for conversation ${conversationId}`,
      );
      return;
    }

    // Get current node (should be QUESTION node)
    const currentNode = this.findNodeById(
      context.chatbot,
      context.currentNodeId,
    );

    if (!currentNode || currentNode.data?.type !== NodeDataType.QUESTION) {
      this.logger.warn(
        `Current node is not a QUESTION node. Cannot process response.`,
      );
      return;
    }

    // Calculate auto variable name for question node
    const nodeIndex = calculateNodeIndex(
      context.chatbot.nodes,
      context.nodeHistory,
      currentNode.id,
      'question',
    );
    const autoVarName = generateAutoVariableName('question', nodeIndex);
    const autoVarPath = getFullVariablePath('question', nodeIndex, 'response');

    // Save user response to variables
    // For LIST questions, save the row ID instead of the display text
    // For BUTTONS questions, save the button ID instead of the display text
    const questionType = currentNode.data?.questionType;
    let valueToSave = userMessage;

    if (questionType === QuestionType.LIST && listRowId) {
      valueToSave = listRowId;
    } else if (questionType === QuestionType.BUTTONS && buttonId) {
      valueToSave = buttonId;
    }

    // Store using auto-generated variable name
    context.variables[autoVarPath] = valueToSave;
    delete context.variables['__awaiting_variable__'];

    this.logger.log(`Saved response to auto variable ${autoVarPath}: ${valueToSave}`);

    // Store node output for question node
    await this.storeNodeOutput(context, currentNode.id, 'question', currentNode.data?.label || 'Question', {
      userResponse: valueToSave,
      buttonId: buttonId,
      listRowId: listRowId,
      outputVariable: autoVarName,
    });

    // Add current node to history
    context.nodeHistory.push(context.currentNodeId);

    // Determine which edge to follow based on question type
    let sourceHandle: string | undefined;

    // questionType already declared above, reuse it
    if (questionType === QuestionType.BUTTONS) {
      if (buttonId) {
        // User clicked a button - use the button ID
        sourceHandle = buttonId;
      } else {
        // User typed text instead of clicking button - use default
        sourceHandle = 'default';
        this.logger.log('User typed text instead of clicking button, using default handle');
      }
    } else if (questionType === QuestionType.LIST) {
      if (listRowId) {
        this.logger.log(`LIST selection received - listRowId: "${listRowId}"`);

        // Check if this is a pagination navigation selection
        const pageMatch = listRowId.match(/^__PAGE_(PREV|NEXT)__(\d+)$/);
        this.logger.log(`Page match result: ${pageMatch ? JSON.stringify(pageMatch) : 'null'}`);

        if (pageMatch) {
          const newPage = parseInt(pageMatch[2]);
          const dynamicListSource = currentNode.data?.dynamicListSource;

          if (dynamicListSource) {
            // Update page variable and re-execute current node (show new page)
            const pageVarName = `${dynamicListSource}_page`;
            context.variables[pageVarName] = newPage;

            // Don't save user message as variable value, and don't move to next node
            delete context.variables[autoVarPath];

            this.logger.log(`Pagination: navigating to page ${newPage} for ${dynamicListSource}`);

            // Save context and re-execute current node
            await this.contextRepo.save(context);
            await this.executeCurrentNode(context.id);
            return;
          }
        }

        // User selected from list - use the row ID
        sourceHandle = listRowId;
      } else {
        // User typed text instead of selecting from list - use default
        sourceHandle = 'default';
        this.logger.log('User typed text instead of selecting from list, using default handle');
      }
    }

    // Find next node
    const nextNode = this.findNextNode(
      context.chatbot,
      context.currentNodeId,
      sourceHandle,
    );

    if (!nextNode) {
      this.logger.log('No next node after user response. ChatBot ended.');
      const previousStatus = context.status;
      context.isActive = false;
      context.status = 'completed';
      context.completedAt = new Date();
      context.completionReason = 'flow_completed';
      await this.contextRepo.save(context);

      // Emit session:status-changed event
      this.sessionGateway.emitSessionStatusChanged({
        sessionId: context.id,
        previousStatus,
        newStatus: 'completed',
        currentNodeId: context.currentNodeId,
        updatedAt: new Date(),
      });

      // Emit session:completed event
      const duration = context.completedAt.getTime() - context.createdAt.getTime();
      const totalNodes = context.nodeHistory.length;
      this.sessionGateway.emitSessionCompleted({
        sessionId: context.id,
        conversationId: context.conversationId,
        completedAt: context.completedAt,
        completionReason: 'flow_completed',
        totalNodes,
        totalMessages: 0,
        duration,
      });

      return;
    }

    // Update context to next node
    const previousStatus = context.status;
    context.currentNodeId = nextNode.id;
    context.status = 'running';
    await this.contextRepo.save(context);

    // Emit session:status-changed event (back to running)
    this.sessionGateway.emitSessionStatusChanged({
      sessionId: context.id,
      previousStatus,
      newStatus: 'running',
      currentNodeId: context.currentNodeId,
      updatedAt: new Date(),
    });

    // Execute next node
    await this.executeCurrentNode(context.id);
  }

  /**
   * Find next node via edges
   */
  private findNextNode(
    chatbot: ChatBot,
    currentNodeId: string,
    sourceHandle?: string,
  ): any {
    // Find edge where source matches current node
    let edge = chatbot.edges.find((e) => {
      if (e.source !== currentNodeId) return false;

      // If sourceHandle is specified, match it too
      if (sourceHandle) {
        return e.sourceHandle === sourceHandle;
      }

      return true;
    });

    // If no edge found with specific sourceHandle, try finding a default/fallback edge
    if (!edge && sourceHandle) {
      this.logger.log(
        `No edge found with sourceHandle ${sourceHandle}, looking for default edge`,
      );
      edge = chatbot.edges.find((e) => {
        if (e.source !== currentNodeId) return false;
        // Look for edge without sourceHandle (default) or with sourceHandle='default'
        return !e.sourceHandle || e.sourceHandle === 'default';
      });
    }

    if (!edge) {
      this.logger.log(
        `No edge found from node ${currentNodeId}${sourceHandle ? ` with handle ${sourceHandle}` : ''}`,
      );
      return null;
    }

    // Find target node
    const targetNode = chatbot.nodes.find((n) => n.id === edge.target);

    if (!targetNode) {
      this.logger.error(`Target node ${edge.target} not found in chatbot`);
      return null;
    }

    return targetNode;
  }

  /**
   * Transform array data to WhatsApp list sections format with pagination
   * @param data - Array of items to display
   * @param labelField - Field name to use as title
   * @param descField - Field name to use as description
   * @param page - Current page number (1-based), default 1
   * @param itemsPerPage - Items per page (max 9 to leave room for navigation), default 9
   * @returns Array with sections including navigation options if needed
   */
  private transformArrayToListSections(
    data: any[],
    labelField?: string,
    descField?: string,
    page: number = 1,
    baseItemsPerPage: number = 9
  ): any[] {
    if (!Array.isArray(data)) {
      this.logger.warn('Dynamic list source is not an array');
      return [];
    }

    const totalItems = data.length;

    // WhatsApp limit: max 10 rows total across all sections
    // Calculate how many nav buttons we'll need for each page position
    // First page: only "next" (1 nav) -> 9 items
    // Middle pages: "prev" + "next" (2 nav) -> 8 items
    // Last page: only "prev" (1 nav) -> 9 items

    // For simplicity, use 8 items per page to always have room for 2 nav buttons
    const itemsPerPage = 8;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    // Get items for current page
    const pageItems = data.slice(startIndex, endIndex);

    const rows = pageItems.map((item, index) => {
      // Support for different object shapes
      const label = (labelField && item[labelField]) || item.name || item.title || item.label || `Item ${index + 1}`;
      const desc = descField ? item[descField] : (item.description || '');
      const id = item.id?.toString() || item.slug || label;

      return {
        id: id.substring(0, 200),
        title: String(label).substring(0, 24),
        description: desc ? String(desc).substring(0, 72) : undefined,
      };
    });

    // Add navigation options if there are multiple pages
    if (totalPages > 1) {
      // Add navigation rows directly to the items section (all in one section)
      // This ensures total rows <= 10 (8 items + 2 nav max)

      // Add "Previous Page" if not on first page
      if (currentPage > 1) {
        rows.push({
          id: `__PAGE_PREV__${currentPage - 1}`,
          title: `Onceki Sayfa`,
          description: `Sayfa ${currentPage - 1}/${totalPages}`,
        });
      }

      // Add "Next Page" if not on last page
      if (currentPage < totalPages) {
        rows.push({
          id: `__PAGE_NEXT__${currentPage + 1}`,
          title: `Sonraki Sayfa`,
          description: `Sayfa ${currentPage + 1}/${totalPages}`,
        });
      }

      return [{
        title: `Sayfa ${currentPage}/${totalPages}`,
        rows,
      }];
    }

    return [{
      title: 'Seçenekler',
      rows,
    }];
  }

  /**
   * Transform array data to WhatsApp buttons format
   */
  private transformArrayToButtons(data: any[], labelField?: string): any[] {
    if (!Array.isArray(data)) {
      this.logger.warn('Dynamic buttons source is not an array');
      return [];
    }

    return data.slice(0, 3).map((item, index) => {
      const label = (labelField && item[labelField]) || item.name || item.title || item.label || `Option ${index + 1}`;
      const id = item.id?.toString() || item.slug || `btn-${index}`;

      return {
        id: id.substring(0, 256),
        title: String(label).substring(0, 20),
      };
    });
  }

  /**
   * Replace variables in text with values from context
   * Supports nested paths like {{product.name}} and {{product.stock}}
   */
  private replaceVariables(
    text: string,
    variables: Record<string, any>,
  ): string {
    return text.replace(/\{\{([\w.]+)\}\}/g, (match, varPath) => {
      const value = this.getNestedValue(variables, varPath);
      if (value === undefined || value === null) {
        return match;
      }
      // Handle arrays and objects - format them nicely
      if (Array.isArray(value)) {
        return this.formatArrayForDisplay(value);
      }
      if (typeof value === 'object') {
        return this.formatObjectForDisplay(value);
      }
      return String(value);
    });
  }

  /**
   * Get nested value from object using dot notation
   * e.g., getNestedValue({product: {name: 'Test'}}, 'product.name') => 'Test'
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
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
   * Format an array for display in WhatsApp messages
   */
  private formatArrayForDisplay(arr: any[]): string {
    if (arr.length === 0) return '(boş liste)';

    // Check if items have common display properties
    const firstItem = arr[0];
    if (typeof firstItem === 'object' && firstItem !== null) {
      // Try to find name, title, or label property
      const displayProp = ['name', 'title', 'label', 'displayName', 'sku', 'id'].find(
        prop => firstItem[prop] !== undefined
      );

      if (displayProp) {
        return arr.map((item, i) => {
          const name = item[displayProp];
          // Include additional useful info if available
          const extras: string[] = [];
          if (item.description) extras.push(item.description);
          if (item.price) extras.push(`${item.price} TL`);
          if (item.stock !== undefined) extras.push(`Stok: ${item.stock}`);

          const extraInfo = extras.length > 0 ? ` - ${extras.join(', ')}` : '';
          return `${i + 1}. ${name}${extraInfo}`;
        }).join('\n');
      }
    }

    // Simple array of primitives
    if (typeof firstItem !== 'object') {
      return arr.map((item, i) => `${i + 1}. ${item}`).join('\n');
    }

    // Fallback: JSON but formatted
    return arr.map((item, i) => `${i + 1}. ${JSON.stringify(item)}`).join('\n');
  }

  /**
   * Format an object for display in WhatsApp messages
   */
  private formatObjectForDisplay(obj: any): string {
    if (obj === null) return '(boş)';

    // If it has a name or title, use that primarily
    if (obj.name || obj.title) {
      const name = obj.name || obj.title;
      const extras: string[] = [];
      if (obj.description) extras.push(obj.description);
      if (obj.price) extras.push(`${obj.price} TL`);
      if (obj.stock !== undefined) extras.push(`Stok: ${obj.stock}`);

      return extras.length > 0 ? `${name}\n${extras.join('\n')}` : name;
    }

    // Format as key-value pairs
    const entries = Object.entries(obj)
      .filter(([key]) => !key.startsWith('_') && !key.startsWith('__'))
      .slice(0, 10); // Limit to prevent overly long messages

    if (entries.length === 0) return '(boş obje)';

    return entries.map(([key, value]) => {
      const displayValue = typeof value === 'object' ? JSON.stringify(value) : value;
      return `${key}: ${displayValue}`;
    }).join('\n');
  }

  /**
   * Load context by conversation ID
   */
  async loadContext(conversationId: string): Promise<ConversationContext> {
    const context = await this.contextRepo.findOne({
      where: { conversationId, isActive: true },
      relations: ['conversation', 'chatbot'],
    });

    if (!context) {
      throw new NotFoundException(
        `Active context not found for conversation ${conversationId}`,
      );
    }

    return context;
  }

  /**
   * Get recipient phone number from conversation
   */
  private async getRecipientPhone(conversation: Conversation): Promise<string> {
    // Load conversation with participants if not loaded
    if (!conversation.participants) {
      const loadedConversation = await this.conversationRepo.findOne({
        where: { id: conversation.id },
        relations: ['participants'],
      });

      if (!loadedConversation) {
        throw new NotFoundException('Conversation not found');
      }

      conversation = loadedConversation;
    }

    // Find the customer (non-system user)
    // Assuming the customer is the participant
    const customer = conversation.participants.find((p) => p);

    if (!customer) {
      throw new NotFoundException('No recipient found in conversation');
    }

    return customer.phoneNumber;
  }

  /**
   * Get business user from conversation
   */
  private async getBusinessUser(conversation: Conversation): Promise<User> {
    // Load conversation with participants if not loaded
    if (!conversation.participants) {
      const loadedConversation = await this.conversationRepo.findOne({
        where: { id: conversation.id },
        relations: ['participants'],
      });

      if (!loadedConversation) {
        throw new NotFoundException('Conversation not found');
      }

      conversation = loadedConversation;
    }

    if (!conversation.participants || conversation.participants.length === 0) {
      throw new NotFoundException('Conversation has no participants');
    }

    // Find the business user (the one with name "Business")
    let businessUser = conversation.participants.find((p) => p.name === 'Business');

    if (!businessUser) {
      // If no user named "Business", use the first participant as fallback
      businessUser = conversation.participants[0];
    }

    return businessUser;
  }

  /**
   * Find node by ID in chatbot
   */
  private findNodeById(chatbot: ChatBot, nodeId: string): any {
    return chatbot.nodes.find((n) => n.id === nodeId);
  }

  /**
   * Check if conversation has active context
   */
  async hasActiveContext(conversationId: string): Promise<boolean> {
    const count = await this.contextRepo.count({
      where: { conversationId, isActive: true },
    });

    return count > 0;
  }

  /**
   * Stop chatbot execution for a conversation
   */
  async stopChatBot(conversationId: string): Promise<void> {
    this.logger.log(`Stopping chatbot for conversation ${conversationId}`);

    // First get the active context to emit events
    const context = await this.contextRepo.findOne({
      where: { conversationId, isActive: true },
    });

    if (context) {
      const previousStatus = context.status;

      await this.contextRepo.update(
        { conversationId, isActive: true },
        {
          isActive: false,
          status: 'stopped',
          completedAt: new Date(),
          completionReason: 'user_stopped',
        },
      );

      // Reload to get updated values
      const updatedContext = await this.contextRepo.findOne({
        where: { id: context.id },
      });

      if (updatedContext) {
        // Emit session:status-changed event
        this.sessionGateway.emitSessionStatusChanged({
          sessionId: updatedContext.id,
          previousStatus,
          newStatus: 'stopped',
          currentNodeId: updatedContext.currentNodeId,
          updatedAt: new Date(),
        });

        // Emit session:completed event
        const duration = updatedContext.completedAt!.getTime() - updatedContext.createdAt.getTime();
        const totalNodes = updatedContext.nodeHistory.length;
        this.sessionGateway.emitSessionCompleted({
          sessionId: updatedContext.id,
          conversationId: updatedContext.conversationId,
          completedAt: updatedContext.completedAt!,
          completionReason: 'user_stopped',
          totalNodes,
          totalMessages: 0,
          duration,
        });
      }
    }
  }

  /**
   * Skip current node (for stuck flows or user request)
   * Returns true if skip was successful, false if nothing to skip
   */
  async skipCurrentNode(conversationId: string): Promise<boolean> {
    this.logger.log(`Attempting to skip current node for conversation ${conversationId}`);

    const context = await this.contextRepo.findOne({
      where: { conversationId, isActive: true },
      relations: ['conversation', 'chatbot'],
    });

    if (!context) {
      this.logger.warn(`No active context found for conversation ${conversationId}`);
      return false;
    }

    // Get current node to check if it's skippable
    const currentNode = this.findNodeById(context.chatbot, context.currentNodeId);
    const nodeType = currentNode?.type || currentNode?.data?.type;

    this.logger.log(`Current node type: ${nodeType}, id: ${context.currentNodeId}`);

    // Check if context is waiting for flow or question response
    const isWaitingForFlow = !!context.variables['__awaiting_flow_response__'];
    const isWaitingForQuestion = !!context.variables['__awaiting_variable__'];

    // Allow skip if:
    // 1. Waiting for flow/question response, OR
    // 2. Current node is WHATSAPP_FLOW or QUESTION (even if waiting state not set - for stuck cases)
    const isSkippableNodeType = [
      NodeDataType.WHATSAPP_FLOW,
      NodeDataType.QUESTION,
    ].includes(nodeType);

    if (!isWaitingForFlow && !isWaitingForQuestion && !isSkippableNodeType) {
      this.logger.warn(
        `Context is not waiting and node type ${nodeType} is not skippable`,
      );
      return false;
    }

    this.logger.log(
      `Skipping node - waitingForFlow: ${isWaitingForFlow}, waitingForQuestion: ${isWaitingForQuestion}, skippableType: ${isSkippableNodeType}`,
    );

    // Clear waiting states
    delete context.variables['__awaiting_flow_response__'];
    delete context.variables['__awaiting_variable__'];
    context.expiresAt = null;

    // Add current node to history
    context.nodeHistory.push(context.currentNodeId);

    // Find next node (use default path first, then any path)
    let nextNode = this.findNextNode(context.chatbot, context.currentNodeId, 'default');

    if (!nextNode) {
      // Try without specific handle
      nextNode = this.findNextNode(context.chatbot, context.currentNodeId);
    }

    if (!nextNode) {
      this.logger.log('No next node after skip, ending chatbot');
      const previousStatus = context.status;
      context.isActive = false;
      context.status = 'completed';
      context.completedAt = new Date();
      context.completionReason = 'flow_completed';
      await this.contextRepo.save(context);

      // Emit session:status-changed event
      this.sessionGateway.emitSessionStatusChanged({
        sessionId: context.id,
        previousStatus,
        newStatus: 'completed',
        currentNodeId: context.currentNodeId,
        updatedAt: new Date(),
      });

      // Emit session:completed event
      const duration = context.completedAt.getTime() - context.createdAt.getTime();
      const totalNodes = context.nodeHistory.length;
      this.sessionGateway.emitSessionCompleted({
        sessionId: context.id,
        conversationId: context.conversationId,
        completedAt: context.completedAt,
        completionReason: 'flow_completed',
        totalNodes,
        totalMessages: 0,
        duration,
      });

      return true;
    }

    const previousStatus = context.status;
    context.currentNodeId = nextNode.id;
    context.status = 'running';
    await this.contextRepo.save(context);

    // Emit session:status-changed event (back to running)
    this.sessionGateway.emitSessionStatusChanged({
      sessionId: context.id,
      previousStatus,
      newStatus: 'running',
      currentNodeId: context.currentNodeId,
      updatedAt: new Date(),
    });

    this.logger.log(`Skipped to next node: ${context.currentNodeId}`);

    // Execute next node
    await this.executeCurrentNode(context.id);

    return true;
  }

  /**
   * Get active context for a conversation (for debugging)
   */
  async getActiveContext(conversationId: string): Promise<ConversationContext | null> {
    return this.contextRepo.findOne({
      where: { conversationId, isActive: true },
      relations: ['chatbot'],
    });
  }

  /**
   * Get all active contexts (for debugging/admin)
   */
  async getAllActiveContexts(): Promise<any[]> {
    const contexts = await this.contextRepo.find({
      where: { isActive: true },
      relations: ['chatbot'],
    });

    return contexts.map((ctx) => ({
      id: ctx.id,
      conversationId: ctx.conversationId,
      chatbotName: ctx.chatbot?.name,
      currentNodeId: ctx.currentNodeId,
      isWaitingForFlow: !!ctx.variables['__awaiting_flow_response__'],
      isWaitingForQuestion: !!ctx.variables['__awaiting_variable__'],
      expiresAt: ctx.expiresAt,
      isExpired: ctx.expiresAt ? new Date() > ctx.expiresAt : false,
      createdAt: ctx.createdAt,
      updatedAt: ctx.updatedAt,
      ageMinutes: Math.floor((Date.now() - ctx.updatedAt.getTime()) / 60000),
    }));
  }

  /**
   * Force complete a context (for admin/debug)
   */
  async forceCompleteContext(contextId: string): Promise<void> {
    const context = await this.contextRepo.findOne({
      where: { id: contextId },
      relations: ['chatbot', 'conversation'],
    });

    if (!context) {
      throw new NotFoundException('Context not found');
    }

    // Clear waiting states
    delete context.variables['__awaiting_flow_response__'];
    delete context.variables['__awaiting_variable__'];
    context.expiresAt = null;

    // Move to next node or deactivate
    const nextNode = this.findNextNode(context.chatbot, context.currentNodeId);

    if (nextNode) {
      context.nodeHistory.push(context.currentNodeId);
      context.currentNodeId = nextNode.id;
      context.status = 'running';
      await this.contextRepo.save(context);
      await this.executeCurrentNode(context.id);
    } else {
      context.isActive = false;
      context.status = 'completed';
      context.completedAt = new Date();
      context.completionReason = 'flow_completed';
      await this.contextRepo.save(context);
    }
  }

  /**
   * Refresh Google OAuth token if needed and update context variables
   * This ensures the token is always fresh for API calls
   */
  private async refreshGoogleTokenIfNeeded(context: ConversationContext): Promise<void> {
    // Only refresh if we have a google_access_token variable
    if (!context.variables['google_access_token']) {
      return;
    }

    // Get chatbot to find owner
    const chatbot = context.chatbot || await this.chatbotRepo.findOne({
      where: { id: context.chatbotId },
    });

    if (!chatbot?.userId) {
      return;
    }

    try {
      // getValidAccessToken will refresh the token if expired
      const freshToken = await this.googleOAuthService.getValidAccessToken(chatbot.userId);
      if (freshToken && freshToken !== context.variables['google_access_token']) {
        context.variables['google_access_token'] = freshToken;
        await this.contextRepo.save(context);
        this.logger.debug(`Refreshed Google OAuth token for context ${context.id}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to refresh Google OAuth token: ${error.message}`);
      // Remove the stale token to prevent API errors
      delete context.variables['google_access_token'];
      await this.contextRepo.save(context);
    }
  }
}
