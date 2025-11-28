import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ConversationContext } from '../../../entities/conversation-context.entity';
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
  ) {}

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

    // Create conversation context
    const context = this.contextRepo.create({
      conversationId,
      chatbotId: chatbot.id,
      currentNodeId: startNode.id,
      variables: {},
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
   * Process CONDITION node - evaluate condition and route accordingly
   */
  private async processConditionNode(
    context: ConversationContext,
    node: any,
  ): Promise<void> {
    this.logger.log(`Processing CONDITION node ${node.id}`);

    const conditionVar = node.data?.conditionVar;
    const conditionOp = node.data?.conditionOp;
    const conditionVal = node.data?.conditionVal;

    // Get variable value
    const varValue = context.variables[conditionVar];

    // Evaluate condition
    let conditionResult = false;

    switch (conditionOp) {
      case '==':
      case 'eq':
      case 'equals':
        conditionResult = String(varValue) === String(conditionVal);
        break;
      case '!=':
      case 'neq':
      case 'not_equals':
        conditionResult = String(varValue) !== String(conditionVal);
        break;
      case 'contains':
        conditionResult = String(varValue).toLowerCase().includes(String(conditionVal).toLowerCase());
        break;
      case 'not_contains':
        conditionResult = !String(varValue).toLowerCase().includes(String(conditionVal).toLowerCase());
        break;
      case '>':
      case 'gt':
      case 'greater':
        conditionResult = Number(varValue) > Number(conditionVal);
        break;
      case '<':
      case 'lt':
      case 'less':
        conditionResult = Number(varValue) < Number(conditionVal);
        break;
      case '>=':
      case 'gte':
      case 'greater_or_equal':
        conditionResult = Number(varValue) >= Number(conditionVal);
        break;
      case '<=':
      case 'lte':
      case 'less_or_equal':
        conditionResult = Number(varValue) <= Number(conditionVal);
        break;
      default:
        this.logger.error(`Unknown condition operator: ${conditionOp}`);
        conditionResult = false;
    }

    this.logger.log(
      `Condition evaluation: ${conditionVar} ${conditionOp} ${conditionVal} = ${conditionResult}`,
    );

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

    // If flow has an active data source, fetch dynamic initial data
    if (flow.dataSource && flow.dataSource.isActive) {
      this.logger.log(
        `Flow has active data source: ${flow.dataSource.name} - fetching initial data`,
      );

      try {
        const dynamicData = await this.fetchFlowInitialData(
          flow.dataSource,
          flow.metadata?.dataSourceConfig,
        );

        this.logger.log(`Fetched ${dynamicData.length} items for Flow initial data`);

        // Merge dynamic data into initial data
        // The key name can be configured in flow.metadata.dataSourceConfig.dataKey or default to 'brands'
        const dataKey = flow.metadata?.dataSourceConfig?.dataKey || 'brands';
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

    const { apiUrl, apiMethod, apiHeaders, apiBody, apiOutputVariable, apiResponsePath, apiErrorVariable, apiTimeout } = node.data || {};

    if (!apiUrl) {
      this.logger.error('REST API URL not specified');
      throw new Error('REST API URL is required');
    }

    const result = await this.restApiExecutor.execute(
      {
        url: apiUrl,
        method: apiMethod || 'GET',
        headers: apiHeaders,
        body: apiBody,
        timeout: apiTimeout,
        responsePath: apiResponsePath,
      },
      context.variables,
    );

    // Store result in variables
    if (result.success) {
      if (apiOutputVariable) {
        context.variables[apiOutputVariable] = result.data;
      }
      context.variables['__last_api_status__'] = result.statusCode;
    } else {
      if (apiErrorVariable) {
        context.variables[apiErrorVariable] = result.error;
      }
      context.variables['__last_api_error__'] = result.error;
    }

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

    // Save Flow response to variables
    const outputVariable = context.variables['__awaiting_flow_response__'];
    if (outputVariable) {
      context.variables[outputVariable] = flowResponse;
      delete context.variables['__awaiting_flow_response__'];

      this.logger.log(
        `Saved Flow response to variable '${outputVariable}': ${JSON.stringify(flowResponse)}`,
      );
    }

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

    // Get the variable name to save response
    const variable =
      context.variables['__awaiting_variable__'] || currentNode.data?.variable;

    if (!variable) {
      this.logger.warn('No variable defined for this question node');
      return;
    }

    // Save user response to variables
    context.variables[variable] = userMessage;
    delete context.variables['__awaiting_variable__'];

    this.logger.log(`Saved response to variable ${variable}: ${userMessage}`);

    // Add current node to history
    context.nodeHistory.push(context.currentNodeId);

    // Determine which edge to follow based on question type
    let sourceHandle: string | undefined;

    const questionType = currentNode.data?.questionType;

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
            delete context.variables[variable];

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
}
// trigger recompile Wed Nov 26 15:11:12 UTC 2025
