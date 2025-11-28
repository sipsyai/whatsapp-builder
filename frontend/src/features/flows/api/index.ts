import { client } from '../../../api/client';

// WhatsApp Flow Category Type (matches backend)
export const WhatsAppFlowCategory = {
  SIGN_UP: 'SIGN_UP',
  SIGN_IN: 'SIGN_IN',
  APPOINTMENT_BOOKING: 'APPOINTMENT_BOOKING',
  LEAD_GENERATION: 'LEAD_GENERATION',
  CONTACT_US: 'CONTACT_US',
  CUSTOMER_SUPPORT: 'CUSTOMER_SUPPORT',
  SURVEY: 'SURVEY',
  OTHER: 'OTHER',
} as const;

export type WhatsAppFlowCategory = typeof WhatsAppFlowCategory[keyof typeof WhatsAppFlowCategory];

// WhatsApp Flow Category Labels (for UI display)
export const WHATSAPP_FLOW_CATEGORY_LABELS: Record<WhatsAppFlowCategory, string> = {
  [WhatsAppFlowCategory.SIGN_UP]: 'Sign Up',
  [WhatsAppFlowCategory.SIGN_IN]: 'Sign In',
  [WhatsAppFlowCategory.APPOINTMENT_BOOKING]: 'Appointment Booking',
  [WhatsAppFlowCategory.LEAD_GENERATION]: 'Lead Generation',
  [WhatsAppFlowCategory.CONTACT_US]: 'Contact Us',
  [WhatsAppFlowCategory.CUSTOMER_SUPPORT]: 'Customer Support',
  [WhatsAppFlowCategory.SURVEY]: 'Survey',
  [WhatsAppFlowCategory.OTHER]: 'Other',
};

// Types
export type WhatsAppFlow = {
  id: string;
  whatsappFlowId?: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED' | 'THROTTLED' | 'BLOCKED';
  categories: WhatsAppFlowCategory[];
  flowJson: any;
  endpointUri?: string;
  previewUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateFlowDto = {
  name: string;
  description?: string;
  categories: WhatsAppFlowCategory[];
  flowJson: any;
  endpointUri?: string;
};

export type UpdateFlowDto = {
  name?: string;
  description?: string;
  categories?: WhatsAppFlowCategory[];
  flowJson?: any;
  endpointUri?: string;
  isActive?: boolean;
};

export type SyncResult = {
  created: number;
  updated: number;
  unchanged: number;
  total: number;
  flows: WhatsAppFlow[];
};

export const flowsApi = {
  // Get all Flows
  async getAll(): Promise<WhatsAppFlow[]> {
    const response = await client.get('/api/flows');
    return response.data;
  },

  // Get active Flows (for ChatBot node selection)
  async getActive(): Promise<WhatsAppFlow[]> {
    const response = await client.get('/api/flows/active');
    return response.data;
  },

  // Get Flow by ID
  async getById(id: string): Promise<WhatsAppFlow> {
    const response = await client.get(`/api/flows/${id}`);
    return response.data;
  },

  // Create a new Flow
  async create(data: CreateFlowDto): Promise<WhatsAppFlow> {
    const response = await client.post('/api/flows', data);
    return response.data;
  },

  // Update Flow
  async update(id: string, data: UpdateFlowDto): Promise<WhatsAppFlow> {
    const response = await client.put(`/api/flows/${id}`, data);
    return response.data;
  },

  // Publish Flow
  async publish(id: string): Promise<WhatsAppFlow> {
    const response = await client.post(`/api/flows/${id}/publish`);
    return response.data;
  },

  // Get Flow preview URL
  async getPreview(id: string, invalidate = false): Promise<string> {
    const response = await client.get(`/api/flows/${id}/preview?invalidate=${invalidate}`);
    return response.data.previewUrl;
  },

  // Delete Flow
  async delete(id: string): Promise<void> {
    await client.delete(`/api/flows/${id}`);
  },

  // Sync flows from Meta/Facebook API
  async syncFromMeta(): Promise<SyncResult> {
    const response = await client.post('/api/flows/sync');
    return response.data;
  },
};
