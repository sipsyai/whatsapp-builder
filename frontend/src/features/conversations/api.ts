import { client } from '../../api/client';

export interface Message {
    id: string;
    conversationId: string;
    content: string;
    role: 'user' | 'assistant' | 'system'; // Adjust based on backend
    createdAt: string;
    // Add other fields as needed
}

export interface Conversation {
    id: string;
    title?: string;
    name?: string; // Mapped from title or participants
    avatar?: string;
    lastMessage?: string;
    unreadCount?: number;
    messages?: Message[];
    createdAt: string;
    updatedAt: string;
    // Add other fields as needed
}

export const getConversations = async () => {
    const response = await client.get<Conversation[]>('/api/conversations');
    return response.data;
};

export const getConversation = async (id: string) => {
    const response = await client.get<Conversation>(`/api/conversations/${id}`);
    return response.data;
};

export const createConversation = async (data: Partial<Conversation>) => {
    const response = await client.post<Conversation>('/api/conversations', data);
    return response.data;
};

export const getMessages = async (conversationId: string) => {
    const response = await client.get<Message[]>(`/api/conversations/${conversationId}/messages`);
    return response.data;
};

export const sendMessage = async (conversationId: string, content: any) => {
    const response = await client.post<Message>(`/api/conversations/${conversationId}/messages`, content);
    return response.data;
};

export const markAsRead = async (conversationId: string) => {
    const response = await client.post(`/api/conversations/${conversationId}/messages/read`);
    return response.data;
};
