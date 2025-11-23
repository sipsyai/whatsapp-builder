export interface WhatsAppApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: WhatsAppApiError;
}

export interface WhatsAppApiError {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  error_user_title?: string;
  error_user_msg?: string;
  fbtrace_id: string;
}

export interface MessageStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
}
