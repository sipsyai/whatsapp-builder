import { client } from './client';
import type { Message } from '../types/messages';

export class MessagesService {
    /**
     * Get all messages for a conversation
     */
    static async getMessages(
        conversationId: string,
        limit = 50,
        before?: string
    ): Promise<Message[]> {
        const params = new URLSearchParams({
            limit: limit.toString(),
            ...(before && { before }),
        });

        const response = await client.get<Message[]>(
            `/api/conversations/${conversationId}/messages?${params}`
        );

        return response.data;
    }

    /**
     * Send a text message
     */
    static async sendTextMessage(
        conversationId: string,
        body: string
    ): Promise<Message> {
        const response = await client.post<Message>(
            `/api/conversations/${conversationId}/messages`,
            {
                type: 'text',
                content: { body },
            }
        );

        return response.data;
    }

    /**
     * Mark conversation as read
     */
    static async markAsRead(conversationId: string): Promise<void> {
        await client.post(
            `/api/conversations/${conversationId}/messages/read`
        );
    }

    /**
     * Download media file by ID
     */
    static async downloadMedia(mediaId: string): Promise<Blob> {
        const response = await client.get(`/api/whatsapp/media/${mediaId}`, {
            responseType: 'blob',
        });

        return response.data;
    }
}
