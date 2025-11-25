import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Brackets } from 'typeorm';
import { ConversationContext } from '../../../entities/conversation-context.entity';
import { Message } from '../../../entities/message.entity';
import { ChatBot } from '../../../entities/chatbot.entity';
import { Conversation } from '../../../entities/conversation.entity';
import { User } from '../../../entities/user.entity';
import {
  QuerySessionsDto,
  SessionFilter,
  SessionStatus,
  SessionSortField,
  ChatbotSessionDto,
  ChatbotSessionDetailDto,
  PaginatedSessionsDto,
  MessageDto,
} from '../dto/session.dto';

@Injectable()
export class SessionHistoryService {
  private readonly logger = new Logger(SessionHistoryService.name);

  constructor(
    @InjectRepository(ConversationContext)
    private readonly contextRepository: Repository<ConversationContext>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(ChatBot)
    private readonly chatbotRepository: Repository<ChatBot>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get paginated sessions with filtering and sorting
   */
  async getSessions(
    query: QuerySessionsDto,
  ): Promise<PaginatedSessionsDto> {
    try {
      const {
        status = SessionFilter.ALL,
        chatbotId,
        conversationId,
        search,
        limit = 20,
        offset = 0,
        sortBy = SessionSortField.STARTED_AT,
        sortOrder = 'DESC',
        startDate,
        endDate,
      } = query;

      // Build the base query
      const queryBuilder = this.contextRepository
        .createQueryBuilder('context')
        .leftJoinAndSelect('context.chatbot', 'chatbot')
        .leftJoinAndSelect('context.conversation', 'conversation')
        .leftJoinAndSelect('conversation.participants', 'participants');

      // Apply status filter
      if (status === SessionFilter.ACTIVE) {
        queryBuilder.andWhere('context.isActive = :isActive', {
          isActive: true,
        });
      } else if (status === SessionFilter.COMPLETED) {
        queryBuilder.andWhere('context.isActive = :isActive', {
          isActive: false,
        });
      }

      // Apply chatbot filter
      if (chatbotId) {
        queryBuilder.andWhere('context.chatbotId = :chatbotId', {
          chatbotId,
        });
      }

      // Apply conversation filter
      if (conversationId) {
        queryBuilder.andWhere('context.conversationId = :conversationId', {
          conversationId,
        });
      }

      // Apply search filter (search in customer name or phone)
      if (search) {
        queryBuilder.andWhere(
          new Brackets((qb) => {
            qb.where('participants.name ILIKE :search', {
              search: `%${search}%`,
            }).orWhere('participants.phoneNumber ILIKE :search', {
              search: `%${search}%`,
            });
          }),
        );
      }

      // Apply date range filters
      if (startDate) {
        queryBuilder.andWhere('context.createdAt >= :startDate', {
          startDate,
        });
      }
      if (endDate) {
        queryBuilder.andWhere('context.createdAt <= :endDate', { endDate });
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply sorting
      const sortField =
        sortBy === SessionSortField.STARTED_AT
          ? 'context.createdAt'
          : 'context.updatedAt';
      queryBuilder.orderBy(sortField, sortOrder);

      // Apply pagination
      queryBuilder.skip(offset).take(limit);

      // Execute query
      const contexts = await queryBuilder.getMany();

      // Get message counts for each session
      const sessionsWithCounts = await Promise.all(
        contexts.map(async (context) => {
          const messageCount = await this.getSessionMessageCount(context);
          return this.mapToSessionDto(context, messageCount);
        }),
      );

      return {
        data: sessionsWithCounts,
        total,
        limit,
        offset,
        hasNext: offset + limit < total,
        hasPrevious: offset > 0,
      };
    } catch (error) {
      this.logger.error('Error getting sessions', error.stack);
      throw new InternalServerErrorException('Failed to retrieve sessions');
    }
  }

  /**
   * Get all active sessions
   */
  async getActiveSessions(): Promise<ChatbotSessionDto[]> {
    try {
      const contexts = await this.contextRepository
        .createQueryBuilder('context')
        .leftJoinAndSelect('context.chatbot', 'chatbot')
        .leftJoinAndSelect('context.conversation', 'conversation')
        .leftJoinAndSelect('conversation.participants', 'participants')
        .where('context.isActive = :isActive', { isActive: true })
        .orderBy('context.updatedAt', 'DESC')
        .getMany();

      const sessionsWithCounts = await Promise.all(
        contexts.map(async (context) => {
          const messageCount = await this.getSessionMessageCount(context);
          return this.mapToSessionDto(context, messageCount);
        }),
      );

      return sessionsWithCounts;
    } catch (error) {
      this.logger.error('Error getting active sessions', error.stack);
      throw new InternalServerErrorException(
        'Failed to retrieve active sessions',
      );
    }
  }

  /**
   * Get completed sessions with limit
   */
  async getCompletedSessions(limit: number = 50): Promise<ChatbotSessionDto[]> {
    try {
      const contexts = await this.contextRepository
        .createQueryBuilder('context')
        .leftJoinAndSelect('context.chatbot', 'chatbot')
        .leftJoinAndSelect('context.conversation', 'conversation')
        .leftJoinAndSelect('conversation.participants', 'participants')
        .where('context.isActive = :isActive', { isActive: false })
        .andWhere('context.completedAt IS NOT NULL')
        .orderBy('context.completedAt', 'DESC')
        .limit(limit)
        .getMany();

      const sessionsWithCounts = await Promise.all(
        contexts.map(async (context) => {
          const messageCount = await this.getSessionMessageCount(context);
          return this.mapToSessionDto(context, messageCount);
        }),
      );

      return sessionsWithCounts;
    } catch (error) {
      this.logger.error('Error getting completed sessions', error.stack);
      throw new InternalServerErrorException(
        'Failed to retrieve completed sessions',
      );
    }
  }

  /**
   * Get detailed information about a specific session
   */
  async getSessionDetail(sessionId: string): Promise<ChatbotSessionDetailDto> {
    try {
      const context = await this.contextRepository
        .createQueryBuilder('context')
        .leftJoinAndSelect('context.chatbot', 'chatbot')
        .leftJoinAndSelect('context.conversation', 'conversation')
        .leftJoinAndSelect('conversation.participants', 'participants')
        .where('context.id = :sessionId', { sessionId })
        .getOne();

      if (!context) {
        throw new NotFoundException(`Session with ID ${sessionId} not found`);
      }

      // Get messages for this session
      const messages = await this.getSessionMessages(sessionId);

      // Get message count
      const messageCount = await this.getSessionMessageCount(context);

      // Get customer info
      const customer = this.extractCustomerInfo(
        context.conversation.participants,
      );

      // Get current node label
      const currentNodeLabel = this.getNodeLabel(
        context.chatbot.nodes,
        context.currentNodeId,
      );

      return {
        id: context.id,
        conversationId: context.conversationId,
        chatbotId: context.chatbotId,
        chatbotName: context.chatbot.name,
        customerPhone: customer.phone,
        customerName: customer.name,
        status: context.status as SessionStatus,
        currentNodeId: context.currentNodeId,
        currentNodeLabel,
        startedAt: context.createdAt,
        updatedAt: context.updatedAt,
        completedAt: context.completedAt,
        nodeCount: context.nodeHistory?.length || 0,
        messageCount,
        isActive: context.isActive,
        nodeHistory: context.nodeHistory,
        variables: context.variables,
        messages,
        flowData: {
          nodes: context.chatbot.nodes,
          edges: context.chatbot.edges,
        },
        expiresAt: context.expiresAt,
        completionReason: context.completionReason,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error getting session detail', error.stack);
      throw new InternalServerErrorException(
        'Failed to retrieve session detail',
      );
    }
  }

  /**
   * Get messages for a specific session
   */
  async getSessionMessages(sessionId: string): Promise<MessageDto[]> {
    try {
      const context = await this.contextRepository.findOne({
        where: { id: sessionId },
        relations: ['conversation', 'conversation.participants'],
      });

      if (!context) {
        throw new NotFoundException(`Session with ID ${sessionId} not found`);
      }

      // Business user'ı bul (bot mesajlarını tanımlamak için)
      const businessUser = context.conversation?.participants?.find(
        (p) => p.name === 'Business',
      );

      // İlk mesajı yakalamak için 1 saniye buffer ekle
      const sessionStartBuffer = new Date(
        context.createdAt.getTime() - 1000,
      );

      // Build query to get messages within session timeframe
      const queryBuilder = this.messageRepository
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.sender', 'sender')
        .where('message.conversationId = :conversationId', {
          conversationId: context.conversationId,
        })
        .andWhere('message.timestamp >= :startTime', {
          startTime: sessionStartBuffer,
        });

      // If session is completed, filter by completion time
      if (context.completedAt) {
        queryBuilder.andWhere('message.timestamp <= :endTime', {
          endTime: context.completedAt,
        });
      }

      queryBuilder.orderBy('message.timestamp', 'ASC');

      const messages = await queryBuilder.getMany();

      return messages.map((message) => ({
        id: message.id,
        senderId: message.senderId,
        senderPhone: message.sender?.phoneNumber,
        senderName: message.sender?.name,
        isFromBot: businessUser ? message.senderId === businessUser.id : false,
        type: message.type,
        content: message.content,
        status: message.status,
        timestamp: message.timestamp,
        createdAt: message.createdAt,
      }));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error getting session messages', error.stack);
      throw new InternalServerErrorException(
        'Failed to retrieve session messages',
      );
    }
  }

  /**
   * Update session status
   */
  async updateSessionStatus(
    contextId: string,
    status: string,
    reason?: string,
  ): Promise<ConversationContext> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const context = await queryRunner.manager.findOne(ConversationContext, {
        where: { id: contextId },
      });

      if (!context) {
        throw new NotFoundException(
          `Context with ID ${contextId} not found`,
        );
      }

      // Update status
      context.status = status as any;

      // If status indicates completion, set completedAt and isActive
      const completionStatuses = ['completed', 'expired', 'stopped'];
      if (completionStatuses.includes(status)) {
        context.isActive = false;
        context.completedAt = new Date();
        if (reason) {
          context.completionReason = reason;
        }
      }

      const updatedContext = await queryRunner.manager.save(context);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Updated context ${contextId} status to ${status}${reason ? ` with reason: ${reason}` : ''}`,
      );

      return updatedContext;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error updating session status', error.stack);
      throw new InternalServerErrorException(
        'Failed to update session status',
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Helper: Get message count for a session
   */
  private async getSessionMessageCount(
    context: ConversationContext,
  ): Promise<number> {
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', {
        conversationId: context.conversationId,
      })
      .andWhere('message.timestamp >= :startTime', {
        startTime: context.createdAt,
      });

    if (context.completedAt) {
      queryBuilder.andWhere('message.timestamp <= :endTime', {
        endTime: context.completedAt,
      });
    }

    return await queryBuilder.getCount();
  }

  /**
   * Helper: Map context to session DTO
   */
  private mapToSessionDto(
    context: ConversationContext,
    messageCount: number,
  ): ChatbotSessionDto {
    const customer = this.extractCustomerInfo(
      context.conversation?.participants || [],
    );

    const currentNodeLabel = this.getNodeLabel(
      context.chatbot?.nodes || [],
      context.currentNodeId,
    );

    return {
      id: context.id,
      conversationId: context.conversationId,
      chatbotId: context.chatbotId,
      chatbotName: context.chatbot?.name || 'Unknown',
      customerPhone: customer.phone,
      customerName: customer.name,
      status: context.status as SessionStatus,
      currentNodeId: context.currentNodeId,
      currentNodeLabel,
      startedAt: context.createdAt,
      updatedAt: context.updatedAt,
      completedAt: context.completedAt,
      nodeCount: context.nodeHistory?.length || 0,
      messageCount,
      isActive: context.isActive,
    };
  }

  /**
   * Helper: Extract customer info from participants
   */
  private extractCustomerInfo(participants: User[]): {
    phone: string;
    name: string;
  } {
    // Assuming the first participant is the customer
    // You may need to adjust this logic based on your business rules
    const customer = participants?.[0] || {
      phoneNumber: 'unknown',
      name: 'Unknown Customer',
    };

    return {
      phone: customer.phoneNumber,
      name: customer.name,
    };
  }

  /**
   * Helper: Get node label from chatbot nodes
   */
  private getNodeLabel(chatbotNodes: any[], nodeId: string): string {
    if (!chatbotNodes || !nodeId) {
      return 'Unknown Node';
    }

    const node = chatbotNodes.find((n) => n.id === nodeId);
    if (node) {
      // Try to get label from various possible fields
      return (
        node.data?.label ||
        node.data?.name ||
        node.data?.title ||
        node.type ||
        nodeId
      );
    }

    return nodeId;
  }
}
