const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api`;

// Types
export type WhatsAppFlow = {
  id: string;
  whatsappFlowId?: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED' | 'THROTTLED' | 'BLOCKED';
  categories: string[];
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
  categories: string[];
  flowJson: any;
  endpointUri?: string;
};

export type UpdateFlowDto = {
  name?: string;
  description?: string;
  categories?: string[];
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
    const response = await fetch(`${API_BASE_URL}/flows`);
    if (!response.ok) throw new Error('Failed to fetch flows');
    return response.json();
  },

  // Get active Flows (for ChatBot node selection)
  async getActive(): Promise<WhatsAppFlow[]> {
    const response = await fetch(`${API_BASE_URL}/flows/active`);
    if (!response.ok) throw new Error('Failed to fetch active flows');
    return response.json();
  },

  // Get Flow by ID
  async getById(id: string): Promise<WhatsAppFlow> {
    const response = await fetch(`${API_BASE_URL}/flows/${id}`);
    if (!response.ok) throw new Error('Failed to fetch flow');
    return response.json();
  },

  // Create a new Flow
  async create(data: CreateFlowDto): Promise<WhatsAppFlow> {
    const response = await fetch(`${API_BASE_URL}/flows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create flow');
    return response.json();
  },

  // Update Flow
  async update(id: string, data: UpdateFlowDto): Promise<WhatsAppFlow> {
    const response = await fetch(`${API_BASE_URL}/flows/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update flow');
    return response.json();
  },

  // Publish Flow
  async publish(id: string): Promise<WhatsAppFlow> {
    const response = await fetch(`${API_BASE_URL}/flows/${id}/publish`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to publish flow');
    return response.json();
  },

  // Get Flow preview URL
  async getPreview(id: string, invalidate = false): Promise<string> {
    const response = await fetch(
      `${API_BASE_URL}/flows/${id}/preview?invalidate=${invalidate}`,
    );
    if (!response.ok) throw new Error('Failed to get preview');
    const data = await response.json();
    return data.previewUrl;
  },

  // Delete Flow
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/flows/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete flow');
  },

  // Sync flows from Meta/Facebook API
  async syncFromMeta(): Promise<SyncResult> {
    const response = await fetch(`${API_BASE_URL}/flows/sync`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to sync flows from Meta');
    return response.json();
  },
};
