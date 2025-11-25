import { ApiProperty } from '@nestjs/swagger';
import type { MessageContent } from '../../interfaces/conversation.interface';
import {
  Message,
  MessageSender,
  MessageStatus,
  MessageType,
} from '../../interfaces/conversation.interface';

/**
 * Response DTO for a single message
 */
export class MessageResponseDto implements Message {
  @ApiProperty({ description: 'Unique message identifier', example: 'msg_abc123' })
  id: string;

  @ApiProperty({
    description: 'Message sender (me = business, them = customer)',
    enum: ['me', 'them'],
    example: 'them',
  })
  sender: MessageSender;

  @ApiProperty({
    description: 'Type of message',
    enum: ['text', 'image', 'video', 'document', 'audio', 'sticker', 'interactive'],
    example: 'text',
  })
  type: MessageType;

  @ApiProperty({
    description: 'Message content (structure varies by type)',
    example: { body: 'Hello!' },
  })
  content: MessageContent;

  @ApiProperty({ description: 'Message timestamp in ISO format', example: '2024-01-15T10:30:00.000Z' })
  timestamp: string;

  @ApiProperty({
    description: 'Message delivery status',
    enum: ['sent', 'delivered', 'read'],
    example: 'delivered',
  })
  status: MessageStatus;

  constructor(partial: Partial<MessageResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Response DTO for list of messages
 */
export class MessagesListResponseDto {
  @ApiProperty({ description: 'Array of messages', type: [MessageResponseDto] })
  messages: MessageResponseDto[];

  @ApiProperty({ description: 'Total number of messages in conversation', example: 150 })
  total: number;

  @ApiProperty({ description: 'Whether there are more messages to load', example: true })
  hasMore: boolean;

  constructor(messages: MessageResponseDto[], total: number, hasMore: boolean) {
    this.messages = messages;
    this.total = total;
    this.hasMore = hasMore;
  }
}
