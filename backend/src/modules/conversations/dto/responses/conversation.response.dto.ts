import { Conversation, Message } from '../../interfaces/conversation.interface';

/**
 * Response DTO for a single conversation
 */
export class ConversationResponseDto implements Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  unreadCount: number;
  timestamp: string;
  messages?: Message[];

  constructor(partial: Partial<ConversationResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Response DTO for list of conversations
 */
export class ConversationsListResponseDto {
  conversations: ConversationResponseDto[];
  total: number;

  constructor(conversations: ConversationResponseDto[], total: number) {
    this.conversations = conversations;
    this.total = total;
  }
}
