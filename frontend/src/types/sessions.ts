export type SessionStatus = 'running' | 'waiting_input' | 'waiting_flow' | 'completed' | 'expired' | 'stopped';

export interface ChatbotSession {
  id: string;
  conversationId: string;
  chatbotId: string;
  chatbotName: string;
  customerPhone: string;
  customerName: string;
  status: SessionStatus;
  currentNodeId: string;
  currentNodeLabel: string;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  nodeCount: number;
  messageCount: number;
  isActive: boolean;
}

export interface ChatbotSessionDetail extends ChatbotSession {
  nodeHistory: string[];
  variables: Record<string, any>;
  messages: SessionMessage[];
  flowData: {
    nodes: any[];
    edges: any[];
  };
  expiresAt: string | null;
  completionReason: string | null;
}

export interface SessionMessage {
  id: string;
  senderId: string;
  senderName?: string;
  senderPhone?: string;
  type: string;
  content: any;
  status: string;
  timestamp: string;
}

// WebSocket event payloads
export interface SessionStartedPayload {
  sessionId: string;
  conversationId: string;
  chatbotId: string;
  chatbotName: string;
  customerPhone: string;
  customerName: string;
  startedAt: string;
}

export interface SessionStatusPayload {
  sessionId: string;
  previousStatus: SessionStatus;
  newStatus: SessionStatus;
  currentNodeId: string;
  currentNodeLabel?: string;
  updatedAt: string;
}

export interface SessionCompletedPayload {
  sessionId: string;
  conversationId: string;
  completedAt: string;
  completionReason: string;
  totalNodes: number;
  totalMessages: number;
  duration: number;
}

export interface PaginatedSessions {
  data: ChatbotSession[];
  total: number;
  limit: number;
  offset: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
