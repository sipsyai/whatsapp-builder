import { client } from './client';
import type { Conversation } from '../types/messages';

export class ConversationsService {
    /**
     * Get all conversations
     */
    static async getConversations(): Promise<Conversation[]> {
        const response = await client.get<Conversation[]>('/api/conversations');
        return response.data;
    }

    /**
     * Get a specific conversation
     */
    static async getConversation(conversationId: string): Promise<Conversation> {
        const response = await client.get<Conversation>(
            `/api/conversations/${conversationId}`
        );
        return response.data;
    }

    /**
     * Create a new conversation
     */
    static async createConversation(
        participantIds: string[]
    ): Promise<Conversation> {
        const response = await client.post<Conversation>('/api/conversations', {
            participantIds,
        });
        return response.data;
    }

    /**
     * Check 24-hour window status
     */
    static async checkWindowStatus(conversationId: string): Promise<{
        isOpen: boolean;
        remainingMinutes: number;
    }> {
        const conversation = await this.getConversation(conversationId);

        if (!conversation.lastCustomerMessageAt) {
            return { isOpen: false, remainingMinutes: 0 };
        }

        const now = new Date();
        const lastMessageTime = new Date(conversation.lastCustomerMessageAt);
        const elapsedMs = now.getTime() - lastMessageTime.getTime();
        const windowDurationMs = 24 * 60 * 60 * 1000; // 24 hours
        const remainingMs = Math.max(0, windowDurationMs - elapsedMs);
        const remainingMinutes = Math.floor(remainingMs / 1000 / 60);

        return {
            isOpen: conversation.isWindowOpen && remainingMs > 0,
            remainingMinutes,
        };
    }
}
