import { MessageType } from '../../../entities/message.entity';

/**
 * Parsed Message DTO
 * Represents a parsed WhatsApp message ready to be stored in the database
 */
export class ParsedMessageDto {
  whatsappMessageId: string;
  senderPhoneNumber: string;
  senderName: string;
  recipientPhoneNumber: string;
  type: MessageType;
  content: any;
  timestamp: Date;
  contextMessageId?: string;
}

/**
 * Parsed Status Update DTO
 * Represents a message status update from WhatsApp
 */
export class ParsedStatusUpdateDto {
  whatsappMessageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
  recipientPhoneNumber: string;
  error?: {
    code: number;
    title: string;
    message?: string;
    details?: string;
  };
}
