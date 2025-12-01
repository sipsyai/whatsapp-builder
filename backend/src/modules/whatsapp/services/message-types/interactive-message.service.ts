import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppApiService } from '../whatsapp-api.service';
import {
  SendInteractiveButtonDto,
  SendInteractiveListDto,
} from '../../dto/requests/send-interactive-message.dto';
import { MessageResponse } from '../../interfaces/message.interface';
import { PhoneNumberUtil } from '../../utils/phone-number.util';

@Injectable()
export class InteractiveMessageService {
  private readonly logger = new Logger(InteractiveMessageService.name);

  constructor(private readonly apiService: WhatsAppApiService) {}

  /**
   * Send interactive button message
   * Supports up to 3 buttons with a header, body, and footer
   */
  async sendButtonMessage(
    dto: SendInteractiveButtonDto,
  ): Promise<{ response: MessageResponse; content: any }> {
    this.logger.log(`Sending button message to ${dto.to}`);

    // Validate and format phone number
    if (!PhoneNumberUtil.isValid(dto.to)) {
      throw new Error(`Invalid phone number format: ${dto.to}`);
    }

    const formattedPhone = PhoneNumberUtil.format(dto.to);

    // Build interactive object
    const interactive: any = {
      type: 'button',
      body: {
        text: dto.bodyText,
      },
      action: {
        buttons: dto.buttons.map((button, index) => ({
          type: 'reply',
          reply: {
            id: button.id ?? `btn_${index}`,
            title: button.title,
          },
        })),
      },
    };

    // Add optional header
    if (dto.headerText) {
      interactive.header = {
        type: 'text',
        text: dto.headerText,
      };
    }

    // Add optional footer
    if (dto.footerText) {
      interactive.footer = {
        text: dto.footerText,
      };
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'interactive',
      interactive,
    };

    const response = await this.apiService.sendMessage(payload);

    return {
      response,
      content: interactive,
    };
  }

  /**
   * Send interactive list message
   * Supports up to 10 sections, each with up to 10 rows
   */
  async sendListMessage(
    dto: SendInteractiveListDto,
  ): Promise<{ response: MessageResponse; content: any }> {
    this.logger.log(`Sending list message to ${dto.to}`);

    // Validate and format phone number
    if (!PhoneNumberUtil.isValid(dto.to)) {
      throw new Error(`Invalid phone number format: ${dto.to}`);
    }

    const formattedPhone = PhoneNumberUtil.format(dto.to);

    // Build interactive object
    const interactive: any = {
      type: 'list',
      body: {
        text: dto.bodyText,
      },
      action: {
        button: dto.listButtonText,
        sections: dto.sections.map((section, sectionIndex) => ({
          title: section.title,
          rows: section.rows.map((row, rowIndex) => ({
            id: row.id ?? `row_${sectionIndex}_${rowIndex}`,
            title: row.title,
            ...(row.description && { description: row.description }),
          })),
        })),
      },
    };

    // Add optional header
    if (dto.headerText) {
      interactive.header = {
        type: 'text',
        text: dto.headerText,
      };
    }

    // Add optional footer
    if (dto.footerText) {
      interactive.footer = {
        text: dto.footerText,
      };
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'interactive',
      interactive,
    };

    const response = await this.apiService.sendMessage(payload);

    return {
      response,
      content: interactive,
    };
  }
}
