import { Injectable, Logger } from '@nestjs/common';
import { MessageType } from '../../../entities/message.entity';
import { WebhookValueDto } from '../dto/webhook-entry.dto';
import { ParsedMessageDto, ParsedStatusUpdateDto } from '../dto/parsed-message.dto';

/**
 * Webhook Parser Service
 * Parses incoming WhatsApp webhook payloads into application-friendly DTOs
 */
@Injectable()
export class WebhookParserService {
  private readonly logger = new Logger(WebhookParserService.name);

  /**
   * Parse incoming messages from WhatsApp webhook
   * @param value - The webhook value object containing messages
   * @returns Array of parsed messages
   */
  parseMessages(value: WebhookValueDto): ParsedMessageDto[] {
    if (!value.messages || value.messages.length === 0) {
      return [];
    }

    const parsedMessages: ParsedMessageDto[] = [];

    for (const message of value.messages) {
      try {
        const parsedMessage = this.parseMessage(message, value);
        parsedMessages.push(parsedMessage);
      } catch (error) {
        this.logger.error(
          `Error parsing message ${message.id}: ${error.message}`,
          error.stack,
        );
      }
    }

    return parsedMessages;
  }

  /**
   * Parse a single message
   */
  private parseMessage(message: any, value: WebhookValueDto): ParsedMessageDto {
    // Get sender info from contacts array if available
    const senderName = value.contacts?.find((c) => c.wa_id === message.from)?.profile?.name ||
                       message.from;

    const parsedMessage: ParsedMessageDto = {
      whatsappMessageId: message.id,
      senderPhoneNumber: message.from,
      senderName: senderName,
      recipientPhoneNumber: value.metadata.display_phone_number,
      type: this.mapMessageType(message.type),
      content: this.parseMessageContent(message),
      timestamp: new Date(parseInt(message.timestamp) * 1000),
      contextMessageId: message.context?.id,
    };

    return parsedMessage;
  }

  /**
   * Map WhatsApp message type to application MessageType enum
   */
  private mapMessageType(whatsappType: string): MessageType {
    const typeMap: Record<string, MessageType> = {
      text: MessageType.TEXT,
      image: MessageType.IMAGE,
      video: MessageType.VIDEO,
      document: MessageType.DOCUMENT,
      audio: MessageType.AUDIO,
      sticker: MessageType.STICKER,
      interactive: MessageType.INTERACTIVE,
      button: MessageType.INTERACTIVE,
      reaction: MessageType.REACTION,
    };

    return typeMap[whatsappType] || MessageType.TEXT;
  }

  /**
   * Parse message content based on message type
   */
  private parseMessageContent(message: any): any {
    switch (message.type) {
      case 'text':
        return {
          body: message.text?.body || '',
        };

      case 'image':
        return {
          id: message.image?.id,
          url: message.image?.link,
          mimeType: message.image?.mime_type,
          sha256: message.image?.sha256,
          caption: message.image?.caption,
        };

      case 'video':
        return {
          id: message.video?.id,
          url: message.video?.link,
          mimeType: message.video?.mime_type,
          sha256: message.video?.sha256,
          caption: message.video?.caption,
        };

      case 'document':
        return {
          id: message.document?.id,
          url: message.document?.link,
          mimeType: message.document?.mime_type,
          sha256: message.document?.sha256,
          filename: message.document?.filename,
          caption: message.document?.caption,
        };

      case 'audio':
        return {
          id: message.audio?.id,
          url: message.audio?.link,
          mimeType: message.audio?.mime_type,
          sha256: message.audio?.sha256,
          voice: message.audio?.voice || false,
        };

      case 'sticker':
        return {
          id: message.sticker?.id,
          url: message.sticker?.link,
          mimeType: message.sticker?.mime_type,
          sha256: message.sticker?.sha256,
          animated: message.sticker?.animated || false,
        };

      case 'reaction':
        return {
          messageId: message.reaction?.message_id,
          emoji: message.reaction?.emoji,
        };

      case 'interactive':
        return this.parseInteractiveContent(message.interactive);

      case 'button':
        return {
          text: message.button?.text,
          payload: message.button?.payload,
        };

      case 'location':
        return {
          latitude: message.location?.latitude,
          longitude: message.location?.longitude,
          name: message.location?.name,
          address: message.location?.address,
        };

      case 'contacts':
        return {
          contacts: message.contacts,
        };

      default:
        this.logger.warn(`Unknown message type: ${message.type}`);
        return { raw: message };
    }
  }

  /**
   * Parse interactive message content
   */
  private parseInteractiveContent(interactive: any): any {
    if (!interactive) {
      return {};
    }

    if (interactive.type === 'button_reply') {
      return {
        type: 'button_reply',
        buttonId: interactive.button_reply?.id,
        buttonTitle: interactive.button_reply?.title,
      };
    }

    if (interactive.type === 'list_reply') {
      return {
        type: 'list_reply',
        listId: interactive.list_reply?.id,
        listTitle: interactive.list_reply?.title,
        listDescription: interactive.list_reply?.description,
      };
    }

    // Handle WhatsApp Flow completion response (nfm_reply = Native Flow Message Reply)
    if (interactive.type === 'nfm_reply') {
      let responseData = {};
      try {
        responseData = JSON.parse(interactive.nfm_reply?.response_json || '{}');
      } catch (e) {
        this.logger.warn('Failed to parse nfm_reply response_json');
      }

      return {
        type: 'nfm_reply',
        flowToken: responseData['flow_token'],
        responseData,
        body: interactive.nfm_reply?.body,
      };
    }

    return interactive;
  }

  /**
   * Parse status updates from WhatsApp webhook
   * @param value - The webhook value object containing statuses
   * @returns Array of parsed status updates
   */
  parseStatusUpdates(value: WebhookValueDto): ParsedStatusUpdateDto[] {
    if (!value.statuses || value.statuses.length === 0) {
      return [];
    }

    const parsedStatuses: ParsedStatusUpdateDto[] = [];

    for (const status of value.statuses) {
      try {
        const parsedStatus: ParsedStatusUpdateDto = {
          whatsappMessageId: status.id,
          status: status.status,
          timestamp: new Date(parseInt(status.timestamp) * 1000),
          recipientPhoneNumber: status.recipient_id,
        };

        // Add error information if status is failed
        if (status.status === 'failed' && status.errors && status.errors.length > 0) {
          const error = status.errors[0];
          parsedStatus.error = {
            code: error.code,
            title: error.title,
            message: error.message,
            details: error.error_data?.details,
          };
        }

        parsedStatuses.push(parsedStatus);
      } catch (error) {
        this.logger.error(
          `Error parsing status update ${status.id}: ${error.message}`,
          error.stack,
        );
      }
    }

    return parsedStatuses;
  }

  /**
   * Extract text preview from message content for conversation lastMessage
   * @param parsedMessage - The parsed message
   * @returns A text preview of the message
   */
  getMessagePreview(parsedMessage: ParsedMessageDto): string {
    switch (parsedMessage.type) {
      case MessageType.TEXT:
        return parsedMessage.content?.body || '';

      case MessageType.IMAGE:
        return parsedMessage.content?.caption || '📷 Image';

      case MessageType.VIDEO:
        return parsedMessage.content?.caption || '🎥 Video';

      case MessageType.DOCUMENT:
        return parsedMessage.content?.filename || '📄 Document';

      case MessageType.AUDIO:
        return parsedMessage.content?.voice ? '🎤 Voice message' : '🔊 Audio';

      case MessageType.STICKER:
        return '🎨 Sticker';

      case MessageType.REACTION:
        return parsedMessage.content?.emoji
          ? `${parsedMessage.content.emoji} Reaction`
          : '👍 Reaction';

      case MessageType.INTERACTIVE:
        if (parsedMessage.content?.type === 'button_reply') {
          return `Selected: ${parsedMessage.content.buttonTitle}`;
        }
        if (parsedMessage.content?.type === 'list_reply') {
          return `Selected: ${parsedMessage.content.listTitle}`;
        }
        if (parsedMessage.content?.type === 'nfm_reply') {
          return '📋 Flow completed';
        }
        return 'Interactive response';

      default:
        return 'Message';
    }
  }
}
