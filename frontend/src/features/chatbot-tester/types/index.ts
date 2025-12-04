/**
 * Chatbot Tester Types - Public API
 *
 * Re-exports all types from tester.types.ts and existing types
 */

// ============================================================================
// Tester State & Context Types (New)
// ============================================================================

export * from './tester.types';

// ============================================================================
// Socket Events & Legacy Types (Existing)
// ============================================================================

export type MessageSender = 'user' | 'bot' | 'system';

// Re-export MessageType from tester.types to avoid conflict
// Note: Use the one from tester.types.ts which has more specific types

export interface NodeExecutionResult {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: 'success' | 'error' | 'skipped';
  executionTime: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

export interface TestSessionState {
  sessionId: string | null;
  chatbotId: string | null;
  status: 'idle' | 'connecting' | 'active' | 'waiting-input' | 'completed' | 'error';
  messages: TestMessage[];
  variables: Record<string, unknown>;
  executedNodes: NodeExecutionResult[];
  currentNodeId: string | null;
  waitingInput?: {
    type: 'text' | 'button' | 'list' | 'location' | 'media';
    options?: {
      buttons?: Array<{ id: string; title: string }>;
      listSections?: Array<{
        title: string;
        rows: Array<{ id: string; title: string; description?: string }>;
      }>;
    };
  };
  error: string | null;
  completionReason?: string;
  summary?: {
    totalNodes: number;
    executedNodes: number;
    totalMessages: number;
    duration: number;
  };
}

export interface TesterSocketEvents {
  // Client -> Server events
  'test:join': { sessionId: string };
  'test:leave': { sessionId: string };
  'test:send-message': {
    sessionId: string;
    message: string;
    buttonId?: string;
    listRowId?: string;
  };

  // Server -> Client events
  'test:started': {
    sessionId: string;
    chatbotId: string;
    chatbotName: string;
  };
  'test:message': TestMessage;
  'test:node-executed': NodeExecutionResult;
  'test:variables-updated': {
    sessionId: string;
    variables: Record<string, unknown>;
  };
  'test:waiting-input': {
    sessionId: string;
    inputType: 'text' | 'button' | 'list' | 'location' | 'media';
    options?: {
      buttons?: Array<{ id: string; title: string }>;
      listSections?: Array<{
        title: string;
        rows: Array<{ id: string; title: string; description?: string }>;
      }>;
    };
  };
  'test:completed': {
    sessionId: string;
    reason: 'flow-ended' | 'user-ended' | 'timeout' | 'error';
    summary: {
      totalNodes: number;
      executedNodes: number;
      totalMessages: number;
      duration: number;
    };
  };
  'test:error': {
    sessionId: string;
    error: string;
    nodeId?: string;
  };
}

// Import for type reference
import type { TestMessage } from './tester.types';
