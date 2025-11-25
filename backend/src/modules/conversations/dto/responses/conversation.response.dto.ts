import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Conversation, Message } from '../../interfaces/conversation.interface';
import { MessageResponseDto } from './message.response.dto';

/**
 * Response DTO for a single conversation
 */
export class ConversationResponseDto implements Conversation {
  @ApiProperty({ description: 'Unique conversation identifier', example: 'conv_abc123' })
  id: string;

  @ApiProperty({ description: 'Contact name', example: 'John Doe' })
  name: string;

  @ApiProperty({ description: 'Contact avatar URL', example: 'https://example.com/avatar.jpg' })
  avatar: string;

  @ApiProperty({ description: 'Preview of the last message', example: 'Hello, how can I help you?' })
  lastMessage: string;

  @ApiProperty({ description: 'Number of unread messages', example: 3 })
  unreadCount: number;

  @ApiProperty({ description: 'Timestamp of last activity', example: '2024-01-15T10:30:00.000Z' })
  timestamp: string;

  @ApiPropertyOptional({ description: 'Array of messages in the conversation', type: [MessageResponseDto] })
  messages?: Message[];

  constructor(partial: Partial<ConversationResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Response DTO for list of conversations
 */
export class ConversationsListResponseDto {
  @ApiProperty({ description: 'Array of conversations', type: [ConversationResponseDto] })
  conversations: ConversationResponseDto[];

  @ApiProperty({ description: 'Total number of conversations', example: 25 })
  total: number;

  constructor(conversations: ConversationResponseDto[], total: number) {
    this.conversations = conversations;
    this.total = total;
  }
}
