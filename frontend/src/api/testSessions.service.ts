/**
 * Test Sessions API Service
 *
 * HTTP API endpoints for chatbot test sessions.
 */

import { client } from './client';

// ============================================================================
// Types
// ============================================================================

export interface StartTestSessionRequest {
  chatbotId: string;
}

export interface StartTestSessionResponse {
  success: boolean;
  message?: string;
  sessionId?: string;
  state?: {
    sessionId: string;
    chatbotId: string;
    chatbotName: string;
    status: string;
    currentNodeId: string | null;
    variables: Record<string, unknown>;
    nodeHistory: string[];
  };
}

export interface SendMessageRequest {
  message: string;
  buttonId?: string;
  listRowId?: string;
}

export interface SendMessageResponse {
  messageId: string;
  status: 'sent' | 'delivered';
}

export interface TestSessionResponse {
  id: string;
  chatbotId: string;
  chatbotName: string;
  status: 'active' | 'paused' | 'completed' | 'error';
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API Methods
// ============================================================================

/**
 * Start a new test session for a chatbot
 */
export async function startTestSession(
  data: StartTestSessionRequest
): Promise<StartTestSessionResponse> {
  const response = await client.post<StartTestSessionResponse>(
    '/api/test-sessions',
    data
  );
  return response.data;
}

/**
 * Send a message in a test session
 */
export async function sendTestSessionMessage(
  sessionId: string,
  data: SendMessageRequest
): Promise<SendMessageResponse> {
  const response = await client.post<SendMessageResponse>(
    `/api/test-sessions/${sessionId}/message`,
    data
  );
  return response.data;
}

/**
 * Pause a test session
 */
export async function pauseTestSession(
  sessionId: string
): Promise<TestSessionResponse> {
  const response = await client.post<TestSessionResponse>(
    `/api/test-sessions/${sessionId}/pause`
  );
  return response.data;
}

/**
 * Resume a paused test session
 */
export async function resumeTestSession(
  sessionId: string
): Promise<TestSessionResponse> {
  const response = await client.post<TestSessionResponse>(
    `/api/test-sessions/${sessionId}/resume`
  );
  return response.data;
}

/**
 * Stop a test session
 */
export async function stopTestSession(
  sessionId: string
): Promise<TestSessionResponse> {
  const response = await client.post<TestSessionResponse>(
    `/api/test-sessions/${sessionId}/stop`
  );
  return response.data;
}

/**
 * Get a test session by ID
 */
export async function getTestSession(
  sessionId: string
): Promise<TestSessionResponse> {
  const response = await client.get<TestSessionResponse>(
    `/api/test-sessions/${sessionId}`
  );
  return response.data;
}
