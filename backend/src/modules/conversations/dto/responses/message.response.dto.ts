import {
  Message,
  MessageContent,
  MessageSender,
  MessageStatus,
  MessageType,
} from '../../interfaces/conversation.interface';

/**
 * Response DTO for a single message
 */
export class MessageResponseDto implements Message {
  id: string;
  sender: MessageSender;
  type: MessageType;
  content: MessageContent;
  timestamp: string;
  status: MessageStatus;

  constructor(partial: Partial<MessageResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Response DTO for list of messages
 */
export class MessagesListResponseDto {
  messages: MessageResponseDto[];
  total: number;
  hasMore: boolean;

  constructor(messages: MessageResponseDto[], total: number, hasMore: boolean) {
    this.messages = messages;
    this.total = total;
    this.hasMore = hasMore;
  }
}
