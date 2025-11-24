import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationContext } from '../../../entities/conversation-context.entity';
import { ChatBot } from '../../../entities/chatbot.entity';
import { Conversation } from '../../../entities/conversation.entity';
import { User } from '../../../entities/user.entity';
import { TextMessageService } from '../../whatsapp/services/message-types/text-message.service';
import { InteractiveMessageService } from '../../whatsapp/services/message-types/interactive-message.service';
import { NodeDataType, QuestionType } from '../dto/node-data.dto';

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
    private readonly textMessageService: TextMessageService,
    private readonly interactiveMessageService: InteractiveMessageService,
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
    });

    await this.contextRepo.save(context);

    this.logger.log(`Created context ${context.id}, executing START node`);

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
      // Mark context as inactive - chatbot has ended
      context.isActive = false;
      await this.contextRepo.save(context);
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
      context.isActive = false;
      await this.contextRepo.save(context);
      return;
    }

    // Update context to next node
    context.currentNodeId = nextNode.id;
    context.nodeHistory.push(node.id);
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
      await this.textMessageService.sendTextMessage({
        to: recipientPhone,
        text: message,
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
      context.isActive = false;
      context.nodeHistory.push(node.id);
      await this.contextRepo.save(context);
      return;
    }

    // Update context to next node
    context.currentNodeId = nextNode.id;
    context.nodeHistory.push(node.id);
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
          await this.textMessageService.sendTextMessage({
            to: recipientPhone,
            text: message,
          });
          this.logger.log(`Sent text question to ${recipientPhone}`);
          break;

        case QuestionType.BUTTONS:
          // Send button message
          const buttons = node.data?.buttons || [];
          const buttonItems = buttons.map((buttonText: string, index: number) => ({
            id: `btn-${index}`,
            title: buttonText.substring(0, 20), // Max 20 chars
          }));

          await this.interactiveMessageService.sendButtonMessage({
            to: recipientPhone,
            bodyText: message,
            headerText: node.data?.headerText,
            footerText: node.data?.footerText,
            buttons: buttonItems,
          });

          this.logger.log(`Sent button question to ${recipientPhone}`);
          break;

        case QuestionType.LIST:
          // Send list message
          const listSections = node.data?.listSections || [];
          const sections = listSections.map((section: any) => ({
            title: section.title.substring(0, 24), // Max 24 chars
            rows: section.rows.map((row: any) => ({
              id: row.id,
              title: row.title.substring(0, 24),
              description: row.description?.substring(0, 72), // Max 72 chars
            })),
          }));

          await this.interactiveMessageService.sendListMessage({
            to: recipientPhone,
            bodyText: message,
            listButtonText: node.data?.listButtonText || 'Choose',
            headerText: node.data?.headerText,
            footerText: node.data?.footerText,
            sections,
          });

          this.logger.log(`Sent list question to ${recipientPhone}`);
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
    await this.contextRepo.save(context);

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
      case 'equals':
        conditionResult = String(varValue) === String(conditionVal);
        break;
      case '!=':
      case 'not_equals':
        conditionResult = String(varValue) !== String(conditionVal);
        break;
      case 'contains':
        conditionResult = String(varValue).includes(String(conditionVal));
        break;
      case 'not_contains':
        conditionResult = !String(varValue).includes(String(conditionVal));
        break;
      case '>':
      case 'greater':
        conditionResult = Number(varValue) > Number(conditionVal);
        break;
      case '<':
      case 'less':
        conditionResult = Number(varValue) < Number(conditionVal);
        break;
      case '>=':
      case 'greater_or_equal':
        conditionResult = Number(varValue) >= Number(conditionVal);
        break;
      case '<=':
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
      context.isActive = false;
      context.nodeHistory.push(node.id);
      await this.contextRepo.save(context);
      return;
    }

    // Update context to next node
    context.currentNodeId = nextNode.id;
    context.nodeHistory.push(node.id);
    await this.contextRepo.save(context);

    // Execute next node recursively
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

    if (questionType === QuestionType.BUTTONS && buttonId) {
      // For buttons, use the button ID (btn-0, btn-1, etc.)
      sourceHandle = buttonId;
    } else if (questionType === QuestionType.LIST && listRowId) {
      // For list, use the row ID
      sourceHandle = listRowId;
    }

    // Find next node
    const nextNode = this.findNextNode(
      context.chatbot,
      context.currentNodeId,
      sourceHandle,
    );

    if (!nextNode) {
      this.logger.log('No next node after user response. ChatBot ended.');
      context.isActive = false;
      await this.contextRepo.save(context);
      return;
    }

    // Update context to next node
    context.currentNodeId = nextNode.id;
    await this.contextRepo.save(context);

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
   * Replace variables in text with values from context
   */
  private replaceVariables(
    text: string,
    variables: Record<string, any>,
  ): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      const value = variables[varName];
      return value !== undefined ? String(value) : match;
    });
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

    await this.contextRepo.update(
      { conversationId, isActive: true },
      { isActive: false },
    );
  }
}
