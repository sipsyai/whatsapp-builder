/**
 * WhatsApp Webhook Entry DTO
 * Represents the structure of incoming webhook payloads from WhatsApp
 */

export class WebhookValueDto {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: Array<{
    profile: {
      name: string;
    };
    wa_id: string;
  }>;
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
      type: 'button_reply' | 'list_reply';
      button_reply?: {
        id: string;
        title: string;
      };
      list_reply?: {
        id: string;
        title: string;
        description?: string;
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
  value: WebhookValueDto;
  field: string;
}

export class WebhookEntryDto {
  id: string;
  changes: WebhookChangeDto[];
}

export class WebhookPayloadDto {
  object: string;
  entry: WebhookEntryDto[];
}

export class WebhookVerificationDto {
  'hub.mode': string;
  'hub.verify_token': string;
  'hub.challenge': string;
}
