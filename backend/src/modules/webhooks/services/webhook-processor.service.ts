import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageStatus } from '../../../entities/message.entity';
import { Conversation } from '../../../entities/conversation.entity';
import { User } from '../../../entities/user.entity';
import { ParsedMessageDto, ParsedStatusUpdateDto } from '../dto/parsed-message.dto';
import { WebhookParserService } from './webhook-parser.service';

/**
 * Webhook Processor Service
 * Processes parsed webhook data and stores it in the database
 */
@Injectable()
export class WebhookProcessorService {
  private readonly logger = new Logger(WebhookProcessorService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly parserService: WebhookParserService,
  ) {}

  /**
   * Process and store incoming messages
   * @param parsedMessages - Array of parsed messages from webhook
   */
  async processMessages(parsedMessages: ParsedMessageDto[]): Promise<void> {
    for (const parsedMessage of parsedMessages) {
      try {
        await this.processMessage(parsedMessage);
      } catch (error) {
        this.logger.error(
          `Error processing message ${parsedMessage.whatsappMessageId}: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  /**
   * Process a single incoming message
   */
  private async processMessage(parsedMessage: ParsedMessageDto): Promise<void> {
    this.logger.log(`Processing message ${parsedMessage.whatsappMessageId} from ${parsedMessage.senderPhoneNumber}`);

    // 1. Find or create the sender user
    const sender = await this.findOrCreateUser(
      parsedMessage.senderPhoneNumber,
      parsedMessage.senderName,
    );

    // 2. Find or create the recipient user (business account)
    const recipient = await this.findOrCreateUser(
      parsedMessage.recipientPhoneNumber,
      'Business',
    );

    // 3. Find or create conversation between sender and recipient
    const conversation = await this.findOrCreateConversation(sender.id, recipient.id);

    // 4. Check if message already exists (idempotency)
    const existingMessage = await this.messageRepository.findOne({
      where: { content: { whatsappMessageId: parsedMessage.whatsappMessageId } },
    });

    if (existingMessage) {
      this.logger.debug(`Message ${parsedMessage.whatsappMessageId} already exists, skipping`);
      return;
    }

    // 5. Store the message content with WhatsApp message ID for tracking
    const messageContent = {
      ...parsedMessage.content,
      whatsappMessageId: parsedMessage.whatsappMessageId,
    };

    // Add context if this is a reply
    if (parsedMessage.contextMessageId) {
      messageContent.contextMessageId = parsedMessage.contextMessageId;
    }

    // 6. Create and save the message
    const message = this.messageRepository.create({
      conversationId: conversation.id,
      senderId: sender.id,
      type: parsedMessage.type,
      content: messageContent,
      status: MessageStatus.DELIVERED, // Incoming messages are already delivered
      timestamp: parsedMessage.timestamp,
    });

    await this.messageRepository.save(message);

    // 7. Update conversation's last message and 24-hour window tracking
    const messagePreview = this.parserService.getMessagePreview(parsedMessage);
    conversation.lastMessage = messagePreview;
    conversation.lastMessageAt = parsedMessage.timestamp;

    // Update 24-hour window tracking
    // If message is from customer (not business), update lastCustomerMessageAt
    if (sender.id !== recipient.id && sender.phoneNumber === parsedMessage.senderPhoneNumber) {
      conversation.lastCustomerMessageAt = parsedMessage.timestamp;
      conversation.isWindowOpen = true;
      this.logger.debug(`24-hour window opened for conversation ${conversation.id}`);
    }

    // Check and update window status based on time
    if (conversation.lastCustomerMessageAt) {
      const windowOpen = conversation.canSendSessionMessage();
      if (conversation.isWindowOpen !== windowOpen) {
        conversation.isWindowOpen = windowOpen;
        this.logger.debug(
          `24-hour window ${windowOpen ? 'opened' : 'closed'} for conversation ${conversation.id}`
        );
      }
    }

    await this.conversationRepository.save(conversation);

    this.logger.log(`Message ${parsedMessage.whatsappMessageId} processed successfully`);
  }

  /**
   * Process status updates for sent messages
   * @param statusUpdates - Array of parsed status updates
   */
  async processStatusUpdates(statusUpdates: ParsedStatusUpdateDto[]): Promise<void> {
    for (const statusUpdate of statusUpdates) {
      try {
        await this.processStatusUpdate(statusUpdate);
      } catch (error) {
        this.logger.error(
          `Error processing status update ${statusUpdate.whatsappMessageId}: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  /**
   * Process a single status update
   */
  private async processStatusUpdate(statusUpdate: ParsedStatusUpdateDto): Promise<void> {
    this.logger.log(`Processing status update ${statusUpdate.whatsappMessageId}: ${statusUpdate.status}`);

    // Find the message by WhatsApp message ID
    const message = await this.messageRepository.findOne({
      where: { content: { whatsappMessageId: statusUpdate.whatsappMessageId } },
    });

    if (!message) {
      this.logger.warn(`Message ${statusUpdate.whatsappMessageId} not found for status update`);
      return;
    }

    // Map WhatsApp status to our MessageStatus enum
    const statusMap: Record<string, MessageStatus> = {
      sent: MessageStatus.SENT,
      delivered: MessageStatus.DELIVERED,
      read: MessageStatus.READ,
    };

    const newStatus = statusMap[statusUpdate.status];

    if (newStatus) {
      message.status = newStatus;

      // If there's an error, add it to the message content
      if (statusUpdate.error) {
        message.content = {
          ...message.content,
          error: statusUpdate.error,
        };
      }

      await this.messageRepository.save(message);
      this.logger.log(`Updated message ${statusUpdate.whatsappMessageId} status to ${newStatus}`);
    } else if (statusUpdate.status === 'failed') {
      // Handle failed status
      message.content = {
        ...message.content,
        failed: true,
        error: statusUpdate.error,
      };
      await this.messageRepository.save(message);
      this.logger.warn(`Message ${statusUpdate.whatsappMessageId} failed: ${statusUpdate.error?.message}`);
    }
  }

  /**
   * Find or create a user by phone number
   */
  private async findOrCreateUser(phoneNumber: string, name: string): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { phoneNumber },
    });

    if (!user) {
      this.logger.log(`Creating new user: ${phoneNumber}`);
      user = this.userRepository.create({
        phoneNumber,
        name,
      });
      user = await this.userRepository.save(user);
    }

    return user;
  }

  /**
   * Find or create a conversation between two users
   */
  private async findOrCreateConversation(user1Id: string, user2Id: string): Promise<Conversation> {
    // Try to find existing conversation with both users
    const existingConversation = await this.conversationRepository
      .createQueryBuilder('conversation')
      .innerJoin('conversation.participants', 'participant1', 'participant1.id = :user1Id', { user1Id })
      .innerJoin('conversation.participants', 'participant2', 'participant2.id = :user2Id', { user2Id })
      .getOne();

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    this.logger.log(`Creating new conversation between ${user1Id} and ${user2Id}`);

    const user1 = await this.userRepository.findOne({ where: { id: user1Id } });
    const user2 = await this.userRepository.findOne({ where: { id: user2Id } });

    if (!user1 || !user2) {
      throw new Error('Users not found for conversation creation');
    }

    const conversation = this.conversationRepository.create();
    conversation.participants = [user1, user2];

    return await this.conversationRepository.save(conversation);
  }

  /**
   * Check if a message has already been processed (for idempotency)
   */
  async isMessageProcessed(whatsappMessageId: string): Promise<boolean> {
    const message = await this.messageRepository.findOne({
      where: { content: { whatsappMessageId } },
    });

    return !!message;
  }
}
