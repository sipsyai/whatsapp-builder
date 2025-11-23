export interface MessageResponse {
  messaging_product: 'whatsapp';
  contacts: Contact[];
  messages: MessageInfo[];
}

export interface Contact {
  input: string;
  wa_id: string;
}

export interface MessageInfo {
  id: string;
  message_status?: 'accepted' | 'sent' | 'delivered' | 'read' | 'failed';
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  STICKER = 'sticker',
  LOCATION = 'location',
  CONTACTS = 'contacts',
  INTERACTIVE = 'interactive',
  TEMPLATE = 'template',
  REACTION = 'reaction',
}

export enum InteractiveType {
  BUTTON = 'button',
  LIST = 'list',
  FLOW = 'flow',
  CTA_URL = 'cta_url',
  LOCATION_REQUEST_MESSAGE = 'location_request_message',
}
