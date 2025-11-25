/**
 * WhatsApp Webhook Entry DTO
 * Represents the structure of incoming webhook payloads from WhatsApp
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class WebhookMetadataDto {
  @ApiProperty({ description: 'Display phone number', example: '+1234567890' })
  display_phone_number: string;

  @ApiProperty({ description: 'Phone number ID from Meta', example: '123456789012345' })
  phone_number_id: string;
}

export class WebhookValueDto {
  @ApiProperty({ description: 'Messaging product identifier', example: 'whatsapp' })
  messaging_product: string;

  @ApiProperty({ description: 'Webhook metadata', type: WebhookMetadataDto })
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  @ApiPropertyOptional({
    description: 'Contact information of the sender',
    example: [{ profile: { name: 'John Doe' }, wa_id: '905321234567' }],
  })
  contacts?: Array<{
    profile: {
      name: string;
    };
    wa_id: string;
  }>;

  @ApiPropertyOptional({
    description: 'Array of incoming messages with type-specific content (text, image, video, document, audio, sticker, interactive, button, location, contacts)',
    example: [{ from: '905321234567', id: 'wamid.xxx', timestamp: '1699999999', type: 'text', text: { body: 'Hello!' } }],
  })
  messages?: Array<{
    from: string;
    id: string;
    timestamp: string;
    type: 'text' | 'image' | 'video' | 'document' | 'audio' | 'sticker' | 'interactive' | 'button' | 'location' | 'contacts';
    text?: {
      body: string;
    };
    image?: {
      id: string;
      mime_type: string;
      sha256: string;
      caption?: string;
    };
    video?: {
      id: string;
      mime_type: string;
      sha256: string;
      caption?: string;
    };
    document?: {
      id: string;
      mime_type: string;
      sha256: string;
      filename: string;
      caption?: string;
    };
    audio?: {
      id: string;
      mime_type: string;
      sha256: string;
      voice?: boolean;
    };
    sticker?: {
      id: string;
      mime_type: string;
      sha256: string;
      animated?: boolean;
    };
    interactive?: {
      type: 'button_reply' | 'list_reply' | 'nfm_reply';
      button_reply?: {
        id: string;
        title: string;
      };
      list_reply?: {
        id: string;
        title: string;
        description?: string;
      };
      nfm_reply?: {
        response_json: string;
        body?: string;
        name?: string;
      };
    };
    button?: {
      text: string;
      payload: string;
    };
    location?: {
      latitude: number;
      longitude: number;
      name?: string;
      address?: string;
    };
    contacts?: Array<{
      name: {
        formatted_name: string;
        first_name?: string;
        last_name?: string;
      };
      phones?: Array<{
        phone: string;
        type?: string;
      }>;
      emails?: Array<{
        email: string;
        type?: string;
      }>;
    }>;
    context?: {
      from: string;
      id: string;
    };
  }>;

  @ApiPropertyOptional({
    description: 'Message delivery status updates (sent, delivered, read, failed)',
    example: [{ id: 'wamid.xxx', status: 'delivered', timestamp: '1699999999', recipient_id: '905321234567' }],
  })
  statuses?: Array<{
    id: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: string;
    recipient_id: string;
    conversation?: {
      id: string;
      origin: {
        type: string;
      };
    };
    pricing?: {
      billable: boolean;
      pricing_model: string;
      category: string;
    };
    errors?: Array<{
      code: number;
      title: string;
      message?: string;
      error_data?: {
        details: string;
      };
    }>;
  }>;

  @ApiPropertyOptional({
    description: 'Error information if webhook delivery failed',
    example: [{ code: 131047, title: 'Re-engagement message', message: 'Message failed to send' }],
  })
  errors?: Array<{
    code: number;
    title: string;
    message?: string;
    error_data?: {
      details: string;
    };
  }>;
}

export class WebhookChangeDto {
  @ApiProperty({ description: 'Webhook value containing message/status data', type: WebhookValueDto })
  value: WebhookValueDto;

  @ApiProperty({ description: 'Field that triggered the webhook', example: 'messages' })
  field: string;
}

export class WebhookEntryDto {
  @ApiProperty({ description: 'WhatsApp Business Account ID', example: '123456789012345' })
  id: string;

  @ApiProperty({ description: 'Array of webhook changes', type: [WebhookChangeDto] })
  changes: WebhookChangeDto[];
}

export class WebhookPayloadDto {
  @ApiProperty({ description: 'Object type (always "whatsapp_business_account")', example: 'whatsapp_business_account' })
  object: string;

  @ApiProperty({ description: 'Array of webhook entries', type: [WebhookEntryDto] })
  entry: WebhookEntryDto[];
}

export class WebhookVerificationDto {
  @ApiProperty({ description: 'Webhook verification mode', example: 'subscribe' })
  'hub.mode': string;

  @ApiProperty({ description: 'Verification token to validate', example: 'my_verify_token' })
  'hub.verify_token': string;

  @ApiProperty({ description: 'Challenge string to return on successful verification', example: '1234567890' })
  'hub.challenge': string;
}
