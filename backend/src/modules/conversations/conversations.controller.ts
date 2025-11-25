import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { ConversationResponseDto, ConversationsListResponseDto } from './dto/responses/conversation.response.dto';

@ApiTags('Conversations')
@Controller('api/conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all conversations',
    description: 'Retrieves all conversations with last message preview and unread count',
  })
  @ApiResponse({ status: 200, description: 'Conversations retrieved successfully', type: ConversationsListResponseDto })
  findAll() {
    return this.conversationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get conversation by ID',
    description: 'Retrieves a specific conversation with its details',
  })
  @ApiParam({ name: 'id', description: 'Conversation UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Conversation retrieved successfully', type: ConversationResponseDto })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new conversation',
    description: 'Creates a new conversation with specified participants',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        participantIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of user UUIDs to include in the conversation',
          example: ['user_abc123', 'user_def456'],
        },
      },
      required: ['participantIds'],
    },
  })
  @ApiResponse({ status: 201, description: 'Conversation created successfully', type: ConversationResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid participant IDs' })
  create(@Body('participantIds') participantIds: string[]) {
    return this.conversationsService.create(participantIds);
  }
}
