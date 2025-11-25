import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppApiService } from '../whatsapp-api.service';
import { SendFlowMessageDto } from '../../dto/requests/send-flow-message.dto';
import { MessageResponse } from '../../interfaces/message.interface';
import { PhoneNumberUtil } from '../../utils/phone-number.util';

@Injectable()
export class FlowMessageService {
  private readonly logger = new Logger(FlowMessageService.name);

  constructor(private readonly apiService: WhatsAppApiService) {}

  /**
   * Send Flow message
   */
  async sendFlowMessage(dto: SendFlowMessageDto): Promise<MessageResponse> {
    this.logger.log(`Sending Flow message to ${dto.to}`);

    // Validate and format phone number
    if (!PhoneNumberUtil.isValid(dto.to)) {
      throw new Error(`Invalid phone number format: ${dto.to}`);
    }

    const formattedPhone = PhoneNumberUtil.format(dto.to);

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'interactive',
      interactive: {
        type: 'flow',
        header: dto.header
          ? {
              type: 'text',
              text: dto.header,
            }
          : undefined,
        body: {
          text: dto.body,
        },
        footer: dto.footer
          ? {
              text: dto.footer,
            }
          : undefined,
        action: {
          name: 'flow',
          parameters: {
            flow_message_version: '3',
            flow_token: dto.flowToken || `FLOW_TOKEN_${Date.now()}`,
            flow_id: dto.flowId,
            flow_cta: dto.ctaText,
            flow_action: dto.mode || 'navigate',
            // flow_action_payload is optional - WhatsApp will show first screen automatically
            ...(dto.initialScreen && {
              flow_action_payload: {
                screen: dto.initialScreen,
                data: dto.initialData || {},
              },
            }),
          },
        },
      },
    };

    return this.apiService.sendMessage(payload);
  }
}
