import { Controller, Get, Post, Body, Param, Query, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessagesService } from './messages.service';
import { MessageStatus } from '../../entities/message.entity';
import { Conversation } from '../../entities/conversation.entity';
import { User } from '../../entities/user.entity';
import { WhatsAppMessageService } from '../whatsapp/services/whatsapp-message.service';
import { SendMessageDto } from '../conversations/dto/requests/send-message.dto';
import { MessageResponseDto, MessagesListResponseDto } from '../conversations/dto/responses/message.response.dto';

@ApiTags('Messages')
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
  @ApiOperation({
    summary: 'Get messages for a conversation',
    description: 'Retrieves messages from a conversation with optional pagination',
  })
  @ApiParam({ name: 'conversationId', description: 'Conversation UUID', type: 'string' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of messages to return', example: 50 })
  @ApiQuery({ name: 'before', required: false, description: 'Message ID to fetch messages before (for pagination)' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully', type: MessagesListResponseDto })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
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
  @ApiOperation({
    summary: 'Send a message',
    description: 'Sends a message in a conversation. The message is saved to the database and sent via WhatsApp.',
  })
  @ApiParam({ name: 'conversationId', description: 'Conversation UUID', type: 'string' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({ status: 201, description: 'Message sent successfully', type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid message data or no participants in conversation' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async create(
    @Param('conversationId') conversationId: string,
    @Body() messageData: SendMessageDto,
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
  @ApiOperation({
    summary: 'Mark messages as read',
    description: 'Marks all messages in a conversation as read',
  })
  @ApiParam({ name: 'conversationId', description: 'Conversation UUID', type: 'string' })
  @ApiResponse({ status: 201, description: 'Messages marked as read successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  markAsRead(@Param('conversationId') conversationId: string) {
    return this.messagesService.markConversationAsRead(conversationId);
  }
}
