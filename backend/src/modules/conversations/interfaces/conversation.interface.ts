/**
 * Message status enum
 */
export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

/**
 * Message type enum
 */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  STICKER = 'sticker',
  INTERACTIVE = 'interactive',
}

/**
 * Message sender enum
 */
export enum MessageSender {
  ME = 'me',
  THEM = 'them',
}

/**
 * Interactive message content structure
 */
export interface InteractiveMessageContent {
  header?: {
    text: string;
  };
  body: {
    text: string;
  };
  footer?: {
    text: string;
  };
  action: {
    buttons?: Array<{
      id: string;
      title: string;
    }>;
    sections?: Array<{
      title: string;
      rows: Array<{
        id: string;
        title: string;
        description?: string;
      }>;
    }>;
  };
}

/**
 * Image message content structure
 */
export interface ImageMessageContent {
  url: string;
  caption?: string;
}

/**
 * Document message content structure
 */
export interface DocumentMessageContent {
  fileName: string;
  fileSize: string;
  url: string;
}

/**
 * Message content type (union of all possible content types)
 */
export type MessageContent =
  | string
  | ImageMessageContent
  | DocumentMessageContent
  | InteractiveMessageContent;

/**
 * Message interface
 */
export interface Message {
  id: string;
  sender: MessageSender;
  type: MessageType;
  content: MessageContent;
  timestamp: string;
  status: MessageStatus;
}

/**
 * Conversation interface
 */
export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  unreadCount: number;
  timestamp: string;
  messages?: Message[];
}
