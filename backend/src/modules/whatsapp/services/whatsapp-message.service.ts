import { Injectable, Logger } from '@nestjs/common';
import { FlowMessageService } from './message-types/flow-message.service';
import { TextMessageService } from './message-types/text-message.service';
import { SendFlowMessageDto } from '../dto/requests/send-flow-message.dto';
import { SendTextMessageDto } from '../dto/requests/send-text-message.dto';
import { MessageResponse } from '../interfaces/message.interface';

/**
 * WhatsApp Message Service - Orchestrator for different message types
 */
@Injectable()
export class WhatsAppMessageService {
  private readonly logger = new Logger(WhatsAppMessageService.name);

  constructor(
    private readonly flowMessageService: FlowMessageService,
    private readonly textMessageService: TextMessageService,
  ) {}

  /**
   * Send Flow message
   */
  async sendFlowMessage(dto: SendFlowMessageDto): Promise<MessageResponse> {
    return this.flowMessageService.sendFlowMessage(dto);
  }

  /**
   * Send text message
   */
  async sendTextMessage(dto: SendTextMessageDto): Promise<MessageResponse> {
    return this.textMessageService.sendTextMessage(dto);
  }

  // Add more message types as needed
  // async sendTemplateMessage(dto: SendTemplateMessageDto): Promise<MessageResponse>
  // async sendInteractiveMessage(dto: SendInteractiveMessageDto): Promise<MessageResponse>
  // async sendMediaMessage(dto: SendMediaMessageDto): Promise<MessageResponse>
}
