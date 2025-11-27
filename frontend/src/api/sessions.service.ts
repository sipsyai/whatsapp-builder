import { client } from './client';
import type { ChatbotSession, ChatbotSessionDetail, PaginatedSessions, SessionMessage } from '../types/sessions';

export interface SessionQueryParams {
  status?: 'active' | 'completed' | 'all';
  chatbotId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'startedAt' | 'updatedAt';
  sortOrder?: 'ASC' | 'DESC';
}

export class SessionsService {
  /**
   * Get paginated list of chatbot sessions with optional filters
   */
  static async getSessions(params?: SessionQueryParams): Promise<PaginatedSessions> {
    const response = await client.get<PaginatedSessions>('/api/chatbot-sessions', {
      params: {
        status: params?.status,
        chatbotId: params?.chatbotId,
        search: params?.search,
        startDate: params?.startDate,
        endDate: params?.endDate,
        limit: params?.limit,
        offset: params?.offset,
        sortBy: params?.sortBy,
        sortOrder: params?.sortOrder,
      },
    });
    return response.data;
  }

  /**
   * Get all currently active sessions
   */
  static async getActiveSessions(): Promise<ChatbotSession[]> {
    const response = await client.get<ChatbotSession[]>('/api/chatbot-sessions/active');
    return response.data;
  }

  /**
   * Get detailed information about a specific session
   */
  static async getSession(id: string): Promise<ChatbotSessionDetail> {
    const response = await client.get<ChatbotSessionDetail>(`/api/chatbot-sessions/${id}`);
    return response.data;
  }

  /**
   * Get all messages for a specific session
   */
  static async getSessionMessages(id: string): Promise<SessionMessage[]> {
    const response = await client.get<SessionMessage[]>(`/api/chatbot-sessions/${id}/messages`);
    return response.data;
  }

  /**
   * Get paginated sessions for a specific chatbot
   */
  static async getSessionsByChatbot(
    chatbotId: string,
    params?: SessionQueryParams
  ): Promise<PaginatedSessions> {
    const response = await client.get<PaginatedSessions>(`/api/chatbot-sessions/chatbot/${chatbotId}`, {
      params: {
        status: params?.status,
        limit: params?.limit,
        offset: params?.offset,
        sortBy: params?.sortBy,
        sortOrder: params?.sortOrder,
      },
    });
    return response.data;
  }

  /**
   * Stop a running chatbot session
   */
  static async stopSession(id: string): Promise<void> {
    await client.post(`/api/chatbot-sessions/${id}/stop`);
  }

  /**
   * Delete a completed chatbot session
   */
  static async deleteSession(id: string): Promise<void> {
    await client.delete(`/api/chatbot-sessions/${id}`);
  }
}
