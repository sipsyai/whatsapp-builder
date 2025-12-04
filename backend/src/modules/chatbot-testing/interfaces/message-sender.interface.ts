import { SendTextMessageDto } from '../../whatsapp/dto/requests/send-text-message.dto';
import {
  SendInteractiveButtonDto,
  SendInteractiveListDto,
} from '../../whatsapp/dto/requests/send-interactive-message.dto';
import { SendFlowMessageDto } from '../../whatsapp/dto/requests/send-flow-message.dto';
import { MessageResponse } from '../../whatsapp/interfaces/message.interface';

/**
 * Interface for message sending abstraction
 * Allows swapping between real WhatsApp API and mock implementations for testing
 */
export interface IMessageSender {
  /**
   * Send a text message
   */
  sendTextMessage(dto: SendTextMessageDto): Promise<MessageResponse>;

  /**
   * Send an interactive button message
   */
  sendInteractiveButtonMessage(
    dto: SendInteractiveButtonDto,
  ): Promise<MessageResponse>;

  /**
   * Send an interactive list message
   */
  sendInteractiveListMessage(
    dto: SendInteractiveListDto,
  ): Promise<MessageResponse>;

  /**
   * Send a WhatsApp Flow message
   */
  sendFlowMessage(dto: SendFlowMessageDto): Promise<MessageResponse>;
}

/**
 * Injection token for IMessageSender
 * Used for dependency injection to swap implementations
 */
export const MESSAGE_SENDER_TOKEN = Symbol('MESSAGE_SENDER');
