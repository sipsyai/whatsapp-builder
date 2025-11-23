import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Message, MessageStatus } from '../../entities/message.entity';
import { MessagesGateway } from '../websocket/messages.gateway';
import { MessageReceivedDto, MessageStatusDto } from '../websocket/dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @Inject(forwardRef(() => MessagesGateway))
    private readonly messagesGateway: MessagesGateway,
  ) {}

  async findByConversation(
    conversationId: string,
    limit: number = 50,
    before?: string,
  ): Promise<Message[]> {
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId })
      .leftJoinAndSelect('message.sender', 'sender')
      .orderBy('message.timestamp', 'DESC')
      .limit(limit);

    if (before) {
      queryBuilder.andWhere('message.timestamp < :before', { before });
    }

    return await queryBuilder.getMany();
  }

  async create(messageData: Partial<Message>): Promise<Message> {
    const message = this.messageRepository.create({
      ...messageData,
      timestamp: messageData.timestamp || new Date(),
    });
    const savedMessage = await this.messageRepository.save(message);

    // Emit WebSocket event for new message
    await this.emitMessageReceived(savedMessage);

    return savedMessage;
  }

  async updateStatus(
    messageId: string,
    status: MessageStatus,
  ): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    message.status = status;
    const updatedMessage = await this.messageRepository.save(message);

    // Emit WebSocket event for status update
    this.emitMessageStatus(updatedMessage);

    return updatedMessage;
  }

  async markConversationAsRead(conversationId: string): Promise<void> {
    await this.messageRepository.update(
      { conversationId, status: MessageStatus.DELIVERED },
      { status: MessageStatus.READ },
    );

    // Emit WebSocket event for read status
    // Note: This updates multiple messages, so we emit a generic event
    const messages = await this.messageRepository.find({
      where: { conversationId, status: MessageStatus.READ },
    });

    messages.forEach((message) => {
      this.emitMessageStatus(message);
    });
  }

  /**
   * Emit message received event via WebSocket
   */
  private async emitMessageReceived(message: Message): Promise<void> {
    // Load sender information if not already loaded
    const messageWithSender = await this.messageRepository.findOne({
      where: { id: message.id },
      relations: ['sender'],
    });

    if (!messageWithSender) {
      return;
    }

    const messageData: MessageReceivedDto = {
      messageId: messageWithSender.id,
      conversationId: messageWithSender.conversationId,
      senderId: messageWithSender.senderId,
      type: messageWithSender.type,
      content: messageWithSender.content,
      status: messageWithSender.status,
      timestamp: messageWithSender.timestamp,
      sender: messageWithSender.sender
        ? {
            id: messageWithSender.sender.id,
            name: messageWithSender.sender.name,
            phoneNumber: messageWithSender.sender.phoneNumber,
            avatar: messageWithSender.sender.avatar,
          }
        : undefined,
    };

    this.messagesGateway.emitMessageReceived(messageData);
  }

  /**
   * Emit message status update event via WebSocket
   */
  private emitMessageStatus(message: Message): void {
    const statusData: MessageStatusDto = {
      messageId: message.id,
      conversationId: message.conversationId,
      status: message.status,
      updatedAt: message.updatedAt.toISOString(),
    };

    this.messagesGateway.emitMessageStatus(statusData);
  }
}
