import { Controller, Get, Post, Body, Param, Query, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessagesService } from './messages.service';
import { MessageStatus } from '../../entities/message.entity';
import { Conversation } from '../../entities/conversation.entity';
import { User } from '../../entities/user.entity';
import { WhatsAppMessageService } from '../whatsapp/services/whatsapp-message.service';

@Controller('api/conversations/:conversationId/messages')
export class MessagesController {
  private readonly logger = new Logger(MessagesController.name);

  constructor(
    private readonly messagesService: MessagesService,
    private readonly whatsappMessageService: WhatsAppMessageService,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Get()
  findByConversation(
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
  ) {
    return this.messagesService.findByConversation(
      conversationId,
      limit,
      before,
    );
  }

  @Post()
  async create(
    @Param('conversationId') conversationId: string,
    @Body() messageData: any,
  ) {
    // Fetch conversation with participants to determine sender
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${conversationId} not found`);
    }

    if (!conversation.participants || conversation.participants.length === 0) {
      throw new BadRequestException('Conversation has no participants');
    }

    // Find the business user (the one with name "Business")
    let businessUser = conversation.participants.find(p => p.name === 'Business');

    if (!businessUser) {
      // If no user named "Business", use the first participant as fallback
      businessUser = conversation.participants[0];
    }

    // Find the customer (recipient) - the one who is NOT the business user
    const customer = conversation.participants.find(p => p.id !== businessUser.id);

    if (!customer) {
      throw new BadRequestException('Could not identify customer in conversation');
    }

    // Create message in database with the business user as sender
    const savedMessage = await this.messagesService.create({
      ...messageData,
      conversationId,
      senderId: businessUser.id,
    });

    // Send message to WhatsApp if it's a text message
    if (messageData.type === 'text' && messageData.content?.body) {
      try {
        this.logger.log(`Sending message to WhatsApp: ${customer.phoneNumber}`);

        await this.whatsappMessageService.sendTextMessage({
          to: customer.phoneNumber,
          text: messageData.content.body,
        });

        this.logger.log(`Message sent successfully to ${customer.phoneNumber}`);
      } catch (error) {
        this.logger.error(`Failed to send WhatsApp message: ${error.message}`, error.stack);
        // Don't throw error - message is already saved in database
        // The error is logged but we return the saved message
      }
    }

    return savedMessage;
  }

  @Post('read')
  markAsRead(@Param('conversationId') conversationId: string) {
    return this.messagesService.markConversationAsRead(conversationId);
  }
}
