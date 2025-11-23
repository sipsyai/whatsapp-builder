import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppApiService } from '../whatsapp-api.service';
import { SendTextMessageDto } from '../../dto/requests/send-text-message.dto';
import { MessageResponse } from '../../interfaces/message.interface';
import { PhoneNumberUtil } from '../../utils/phone-number.util';

@Injectable()
export class TextMessageService {
  private readonly logger = new Logger(TextMessageService.name);

  constructor(private readonly apiService: WhatsAppApiService) {}

  /**
   * Send text message
   */
  async sendTextMessage(
    dto: SendTextMessageDto,
  ): Promise<MessageResponse> {
    this.logger.log(`Sending text message to ${dto.to}`);

    // Validate and format phone number
    if (!PhoneNumberUtil.isValid(dto.to)) {
      throw new Error(`Invalid phone number format: ${dto.to}`);
    }

    const formattedPhone = PhoneNumberUtil.format(dto.to);

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'text',
      text: {
        preview_url: dto.previewUrl ?? false,
        body: dto.text,
      },
    };

    return this.apiService.sendMessage(payload);
  }
}
