import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../../entities/conversation.entity';
import { User } from '../../entities/user.entity';
import { MessagesGateway } from '../websocket/messages.gateway';
import { TypingIndicatorDto } from '../websocket/dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => MessagesGateway))
    private readonly messagesGateway: MessagesGateway,
  ) {}

  async findAll(): Promise<Conversation[]> {
    return await this.conversationRepository.find({
      relations: ['participants', 'messages'],
      order: { lastMessageAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
      relations: ['participants', 'messages'],
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    return conversation;
  }

  async create(participantIds: string[]): Promise<Conversation> {
    const participants = await this.userRepository.findByIds(participantIds);

    const conversation = this.conversationRepository.create({
      participants,
    });

    return await this.conversationRepository.save(conversation);
  }

  async updateLastMessage(
    id: string,
    lastMessage: string,
    lastMessageAt: Date,
  ): Promise<Conversation> {
    const conversation = await this.findOne(id);
    conversation.lastMessage = lastMessage;
    conversation.lastMessageAt = lastMessageAt;
    return await this.conversationRepository.save(conversation);
  }

  /**
   * Handle typing indicator events
   */
  async handleTypingStart(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    // Verify conversation exists
    await this.findOne(conversationId);

    // Get user info
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Emit typing start event
    const typingData: TypingIndicatorDto = {
      conversationId,
      userId,
      isTyping: true,
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
      },
    };

    this.messagesGateway.emitTypingIndicator(typingData);
  }

  async handleTypingStop(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    // Verify conversation exists
    await this.findOne(conversationId);

    // Emit typing stop event
    const typingData: TypingIndicatorDto = {
      conversationId,
      userId,
      isTyping: false,
    };

    this.messagesGateway.emitTypingIndicator(typingData);
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.messagesGateway.isUserOnline(userId);
  }

  /**
   * Get all online users
   */
  getOnlineUsers(): string[] {
    return this.messagesGateway.getOnlineUsers();
  }
}
