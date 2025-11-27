import { client as apiClient } from '../../api/client';

export interface WhatsAppConfig {
    id?: string;
    phoneNumberId: string;
    businessAccountId: string;
    accessToken: string;
    webhookVerifyToken: string;
    appSecret?: string;
    backendUrl?: string;
    flowEndpointUrl?: string;
    apiVersion?: string;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface WhatsAppConfigResponse {
    id: string;
    phoneNumberId: string;
    businessAccountId: string;
    webhookVerifyToken: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface TestConnectionResponse {
    success: boolean;
    message: string;
    phoneNumber?: string;
    verifiedName?: string;
}

export interface WebhookUrlResponse {
    webhookUrl: string;
    verifyToken: string;
    flowEndpointUrl?: string;
}

export const whatsappConfigApi = {
    getConfig: async (): Promise<WhatsAppConfigResponse> => {
        const response = await apiClient.get('/api/whatsapp/config');
        return response.data;
    },

    saveConfig: async (config: Omit<WhatsAppConfig, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>): Promise<WhatsAppConfigResponse> => {
        const response = await apiClient.post('/api/whatsapp/config', config);
        return response.data;
    },

    testConnection: async (phoneNumberId?: string, accessToken?: string): Promise<TestConnectionResponse> => {
        const response = await apiClient.post('/api/whatsapp/config/test', {
            phoneNumberId,
            accessToken,
        });
        return response.data;
    },

    getWebhookUrl: async (): Promise<WebhookUrlResponse> => {
        const response = await apiClient.get('/api/whatsapp/config/webhook-url');
        return response.data;
    },
};
