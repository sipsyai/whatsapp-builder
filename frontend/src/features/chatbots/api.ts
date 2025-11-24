import { client } from '../../api/client';

export const ChatBotStatus = {
    ACTIVE: 'active',
    ARCHIVED: 'archived',
    DRAFT: 'draft',
} as const;

export type ChatBotStatus = typeof ChatBotStatus[keyof typeof ChatBotStatus];

export interface ChatBot {
    id: string;
    name: string;
    description?: string;
    nodes: any[];
    edges: any[];
    isActive: boolean;
    status: ChatBotStatus;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface ChatBotStats {
    nodeCount: number;
    edgeCount: number;
    nodeTypes: Record<string, number>;
}

export interface QueryChatBotsParams {
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'name' | 'createdAt' | 'updatedAt';
    sortOrder?: 'ASC' | 'DESC';
    isActive?: boolean;
    status?: ChatBotStatus;
}

export const getChatBots = async (params?: QueryChatBotsParams) => {
    const queryString = params ? '?' + new URLSearchParams(
        Object.entries(params)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
    ).toString() : '';

    const response = await client.get<{ data: ChatBot[], total: number, limit: number, offset: number }>(`/api/chatbots${queryString}`);
    // Backend returns {data: ChatBot[], total, limit, offset}, extract just the data array
    return response.data.data || [];
};

export const getChatBot = async (id: string) => {
    const response = await client.get<ChatBot>(`/api/chatbots/${id}`);
    return response.data;
};

export const createChatBot = async (data: Partial<ChatBot>) => {
    const response = await client.post<ChatBot>('/api/chatbots', data);
    return response.data;
};

export const updateChatBot = async (id: string, data: Partial<ChatBot>) => {
    const response = await client.put<ChatBot>(`/api/chatbots/${id}`, data);
    return response.data;
};

export const deleteChatBot = async (id: string) => {
    const response = await client.delete(`/api/chatbots/${id}`);
    return response.data;
};

export const getChatBotStats = async (id: string) => {
    const response = await client.get<ChatBotStats>(`/api/chatbots/${id}/stats`);
    return response.data;
};

export const softDeleteChatBot = async (id: string) => {
    const response = await client.delete(`/api/chatbots/${id}/soft`);
    return response.data;
};

export const restoreChatBot = async (id: string) => {
    const response = await client.patch(`/api/chatbots/${id}/restore`);
    return response.data;
};

export const toggleActiveChatBot = async (id: string) => {
    const response = await client.patch<ChatBot>(`/api/chatbots/${id}/toggle-active`);
    return response.data;
};
