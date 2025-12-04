/**
 * useTestSessionManager Hook
 *
 * Manages the complete test session lifecycle:
 * - HTTP API calls for starting/stopping/pausing/resuming sessions
 * - WebSocket connection for real-time events
 * - Integrates with TesterContext for state updates
 */

import { useCallback, useEffect, useRef } from 'react';
import {
  startTestSession,
  stopTestSession,
  pauseTestSession,
  resumeTestSession,
  sendTestSessionMessage,
} from '../../../api/testSessions.service';
import {
  testSessionSocket,
  connect as connectSocket,
  disconnect as disconnectSocket,
  joinTestSession,
  leaveTestSession,
  sendTestMessage,
} from '../../../api/testSocket';
import type { TestMessage } from '../types';

export interface UseTestSessionManagerOptions {
  chatbotId: string;
  dispatch: React.Dispatch<any>;
}

export interface UseTestSessionManagerReturn {
  /** Start a new test session */
  startSession: () => Promise<void>;
  /** Stop the current test session */
  stopSession: () => Promise<void>;
  /** Pause the current test session */
  pauseSession: () => Promise<void>;
  /** Resume the current test session */
  resumeSession: () => Promise<void>;
  /** Send a message in the current test session */
  sendMessage: (text: string, buttonId?: string, listRowId?: string) => Promise<void>;
  /** Whether there's an active session */
  isSessionActive: boolean;
}

/**
 * Hook to manage test session lifecycle with API and WebSocket integration
 */
export function useTestSessionManager(
  chatbotId: string,
  dispatch: React.Dispatch<any>
): UseTestSessionManagerReturn {
  // Current session ID ref
  const sessionIdRef = useRef<string | null>(null);
  const isSessionActiveRef = useRef(false);

  // Note: We use dispatch directly for state updates since this hook
  // is initialized with the dispatch from TesterContext

  // =========================================================================
  // WebSocket Event Handlers
  // =========================================================================

  useEffect(() => {
    // Connection events
    const handleConnect = () => {
      console.log('[TestSession] Socket connected');
      dispatch({ type: 'CONNECT_SUCCESS', payload: { sessionId: sessionIdRef.current || '' } });
    };

    const handleDisconnect = () => {
      console.log('[TestSession] Socket disconnected');
      dispatch({ type: 'DISCONNECT' });
    };

    const handleConnectError = (error: Error) => {
      console.error('[TestSession] Connection error:', error.message);
      dispatch({ type: 'CONNECT_ERROR', payload: { error: error.message } });
    };

    // Test session events
    const handleTestStarted = (data: { sessionId: string; chatbotId: string; chatbotName: string }) => {
      console.log('[TestSession] Test started:', data);
      sessionIdRef.current = data.sessionId;
      isSessionActiveRef.current = true;
      dispatch({ type: 'START_TEST' });
      dispatch({
        type: 'ADD_LOG',
        payload: {
          log: {
            type: 'system',
            message: `Test started for chatbot: ${data.chatbotName}`,
          },
        },
      });
    };

    const handleBotResponse = (data: {
      testSessionId: string;
      messages: Array<{
        id: string;
        direction: string;
        content: string;
        messageType: string;
        nodeId?: string;
        timestamp: Date;
      }>;
      nodeId: string;
      timestamp: Date;
    }) => {
      console.log('[TestSession] Bot response:', data);

      // Process each message from the bot
      if (data.messages && Array.isArray(data.messages)) {
        for (const msg of data.messages) {
          const testMessage: TestMessage = {
            id: msg.id,
            type: msg.messageType === 'interactive' ? 'interactive' : 'text',
            content: msg.content,
            isFromBot: true,
            timestamp: new Date(msg.timestamp).toISOString(),
            status: 'delivered',
          };
          dispatch({ type: 'ADD_MESSAGE', payload: { message: testMessage } });
        }
      }

      dispatch({ type: 'SET_TYPING', payload: { isTyping: false } });
    };

    const handleNodeEntered = (data: { nodeId: string; nodeType: string; nodeName: string }) => {
      console.log('[TestSession] Node entered:', data);
      dispatch({ type: 'SET_CURRENT_NODE', payload: { nodeId: data.nodeId, nodeType: data.nodeType } });
    };

    const handleNodeExecuted = (data: { nodeId: string; nodeType: string; nodeName: string; status: string }) => {
      console.log('[TestSession] Node executed:', data);
      dispatch({ type: 'ADD_EXECUTED_NODE', payload: { nodeId: data.nodeId } });
      dispatch({
        type: 'ADD_LOG',
        payload: {
          log: {
            type: 'node',
            message: `Node executed: ${data.nodeName || data.nodeType}`,
            nodeId: data.nodeId,
          },
        },
      });
    };

    const handleVariableChanged = (data: { sessionId: string; key: string; value: unknown }) => {
      console.log('[TestSession] Variable changed:', data);
      dispatch({ type: 'SET_VARIABLE', payload: { key: data.key, value: data.value } });
    };

    const handleVariablesUpdated = (data: { sessionId: string; variables: Record<string, unknown> }) => {
      console.log('[TestSession] Variables updated:', data);
      dispatch({ type: 'SET_VARIABLES', payload: { variables: data.variables } });
    };

    const handleWaitingInput = (data: {
      sessionId: string;
      inputType: 'text' | 'button' | 'list' | 'location' | 'media';
      options?: {
        buttons?: Array<{ id: string; title: string }>;
        listSections?: Array<{ title: string; rows: Array<{ id: string; title: string; description?: string }> }>;
      };
    }) => {
      console.log('[TestSession] Waiting for input:', data);

      // Map input type to our waiting type
      const waitingType = data.inputType as 'text' | 'button' | 'list';

      dispatch({
        type: 'SET_WAITING_INPUT',
        payload: {
          type: waitingType,
          options: {
            buttons: data.options?.buttons,
            sections: data.options?.listSections,
          },
        },
      });
    };

    const handleTestCompleted = (data: {
      sessionId: string;
      reason: 'flow-ended' | 'user-ended' | 'timeout' | 'error';
      summary: { totalNodes: number; executedNodes: number; totalMessages: number; duration: number };
    }) => {
      console.log('[TestSession] Test completed:', data);
      isSessionActiveRef.current = false;
      dispatch({ type: 'COMPLETE_TEST' });
      dispatch({
        type: 'ADD_LOG',
        payload: {
          log: {
            type: 'system',
            message: `Test completed: ${data.reason}. Executed ${data.summary.executedNodes}/${data.summary.totalNodes} nodes in ${data.summary.duration}ms`,
          },
        },
      });
    };

    const handleTestError = (data: { sessionId: string; error: string; nodeId?: string }) => {
      console.error('[TestSession] Test error:', data);
      dispatch({ type: 'SET_ERROR', payload: { error: data.error } });
      dispatch({
        type: 'ADD_LOG',
        payload: {
          log: {
            type: 'error',
            message: data.error,
            nodeId: data.nodeId,
          },
        },
      });
    };

    // State recovery handler - called when client joins session room
    const handleStateRecovery = (data: {
      testSessionId: string;
      state: {
        status: string;
        currentNodeId: string | null;
        currentNodeLabel: string | null;
        waitingForInput?: boolean;
      };
      messages: Array<{
        id: string;
        direction: 'incoming' | 'outgoing';
        content: string | Record<string, unknown>;
        type: string;
        nodeId?: string;
        timestamp: Date;
      }>;
      variables: Record<string, unknown>;
      executionHistory: Array<{
        nodeId: string;
        nodeType: string;
        nodeLabel?: string;
      }>;
    }) => {
      console.log('[TestSession] State recovery received:', data);

      // Set variables
      if (data.variables && Object.keys(data.variables).length > 0) {
        dispatch({ type: 'SET_VARIABLES', payload: { variables: data.variables } });
      }

      // Set current node
      if (data.state.currentNodeId) {
        dispatch({
          type: 'SET_CURRENT_NODE',
          payload: { nodeId: data.state.currentNodeId, nodeType: '' },
        });
      }

      // Add messages to chat
      if (data.messages && data.messages.length > 0) {
        for (const msg of data.messages) {
          const testMessage: TestMessage = {
            id: msg.id,
            type: msg.type === 'interactive' ? 'interactive' : 'text',
            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
            isFromBot: msg.direction === 'outgoing',
            timestamp: new Date(msg.timestamp).toISOString(),
            status: 'delivered',
          };
          dispatch({ type: 'ADD_MESSAGE', payload: { message: testMessage } });
        }
      }

      // Add executed nodes
      if (data.executionHistory && data.executionHistory.length > 0) {
        for (const node of data.executionHistory) {
          dispatch({ type: 'ADD_EXECUTED_NODE', payload: { nodeId: node.nodeId } });
        }
      }

      // Check if waiting for input based on status
      if (data.state.status === 'waiting_input' || data.state.waitingForInput) {
        dispatch({
          type: 'SET_WAITING_INPUT',
          payload: {
            type: 'text',
            options: {},
          },
        });
      }

      dispatch({
        type: 'ADD_LOG',
        payload: {
          log: {
            type: 'system',
            message: `State recovered: ${data.messages?.length || 0} messages, ${Object.keys(data.variables || {}).length} variables`,
          },
        },
      });
    };

    // Register event listeners
    testSessionSocket.on('connect', handleConnect);
    testSessionSocket.on('disconnect', handleDisconnect);
    testSessionSocket.on('connect_error', handleConnectError);
    testSessionSocket.on('test:started', handleTestStarted);
    testSessionSocket.on('test:bot-response', handleBotResponse);
    testSessionSocket.on('test:node-entered', handleNodeEntered);
    testSessionSocket.on('test:node-executed', handleNodeExecuted);
    testSessionSocket.on('test:variable-changed', handleVariableChanged);
    testSessionSocket.on('test:variables-updated', handleVariablesUpdated);
    testSessionSocket.on('test:waiting-input', handleWaitingInput);
    testSessionSocket.on('test:completed', handleTestCompleted);
    testSessionSocket.on('test:error', handleTestError);
    testSessionSocket.on('test:state-recovery', handleStateRecovery);

    // Cleanup
    return () => {
      testSessionSocket.off('connect', handleConnect);
      testSessionSocket.off('disconnect', handleDisconnect);
      testSessionSocket.off('connect_error', handleConnectError);
      testSessionSocket.off('test:started', handleTestStarted);
      testSessionSocket.off('test:bot-response', handleBotResponse);
      testSessionSocket.off('test:node-entered', handleNodeEntered);
      testSessionSocket.off('test:node-executed', handleNodeExecuted);
      testSessionSocket.off('test:variable-changed', handleVariableChanged);
      testSessionSocket.off('test:variables-updated', handleVariablesUpdated);
      testSessionSocket.off('test:waiting-input', handleWaitingInput);
      testSessionSocket.off('test:completed', handleTestCompleted);
      testSessionSocket.off('test:error', handleTestError);
      testSessionSocket.off('test:state-recovery', handleStateRecovery);

      // Disconnect and leave session on unmount
      if (sessionIdRef.current) {
        leaveTestSession(sessionIdRef.current);
      }
      disconnectSocket();
    };
  }, [dispatch]);

  // =========================================================================
  // API Actions
  // =========================================================================

  /**
   * Start a new test session
   */
  const startSession = useCallback(async () => {
    try {
      dispatch({ type: 'CONNECT_START' });

      // 1. Connect to WebSocket
      connectSocket();

      // 2. Call API to start test session
      const response = await startTestSession({ chatbotId });

      console.log('[TestSession] Session started via API:', response);

      // 3. Store session ID (backend returns 'sessionId' not 'id')
      const sessionId = response.sessionId;
      if (!sessionId) {
        throw new Error('No sessionId returned from API');
      }
      sessionIdRef.current = sessionId;
      isSessionActiveRef.current = true;

      // 4. Join the WebSocket room
      joinTestSession(sessionId);

      // 5. Update state
      dispatch({ type: 'CONNECT_SUCCESS', payload: { sessionId } });
      dispatch({ type: 'START_TEST' });
      dispatch({
        type: 'ADD_LOG',
        payload: {
          log: {
            type: 'system',
            message: `Test session started: ${sessionId}`,
          },
        },
      });
    } catch (error) {
      console.error('[TestSession] Failed to start session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start test session';
      dispatch({ type: 'CONNECT_ERROR', payload: { error: errorMessage } });
      dispatch({ type: 'SET_ERROR', payload: { error: errorMessage } });
    }
  }, [chatbotId, dispatch]);

  /**
   * Stop the current test session
   */
  const stopSession = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) {
      console.warn('[TestSession] No active session to stop');
      return;
    }

    try {
      // 1. Call API to stop session
      await stopTestSession(sessionId);

      console.log('[TestSession] Session stopped via API');

      // 2. Leave WebSocket room
      leaveTestSession(sessionId);

      // 3. Disconnect socket
      disconnectSocket();

      // 4. Update state
      dispatch({ type: 'STOP_TEST' });
      dispatch({ type: 'DISCONNECT' });

      // 5. Clear refs
      sessionIdRef.current = null;
      isSessionActiveRef.current = false;
    } catch (error) {
      console.error('[TestSession] Failed to stop session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop test session';
      dispatch({ type: 'SET_ERROR', payload: { error: errorMessage } });
    }
  }, [dispatch]);

  /**
   * Pause the current test session
   */
  const pauseSession = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) {
      console.warn('[TestSession] No active session to pause');
      return;
    }

    try {
      await pauseTestSession(sessionId);
      console.log('[TestSession] Session paused via API');
      dispatch({ type: 'PAUSE_TEST' });
    } catch (error) {
      console.error('[TestSession] Failed to pause session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to pause test session';
      dispatch({ type: 'SET_ERROR', payload: { error: errorMessage } });
    }
  }, [dispatch]);

  /**
   * Resume the current test session
   */
  const resumeSession = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) {
      console.warn('[TestSession] No active session to resume');
      return;
    }

    try {
      await resumeTestSession(sessionId);
      console.log('[TestSession] Session resumed via API');
      dispatch({ type: 'RESUME_TEST' });
    } catch (error) {
      console.error('[TestSession] Failed to resume session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to resume test session';
      dispatch({ type: 'SET_ERROR', payload: { error: errorMessage } });
    }
  }, [dispatch]);

  /**
   * Send a message in the current test session
   */
  const sendMessage = useCallback(async (
    text: string,
    buttonId?: string,
    listRowId?: string
  ) => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) {
      console.warn('[TestSession] No active session to send message');
      return;
    }

    try {
      // 1. Clear waiting input state
      dispatch({ type: 'CLEAR_WAITING_INPUT' });

      // 2. Add user message to UI
      const userMessage: TestMessage = {
        id: `msg_${Date.now()}`,
        type: 'text',
        content: text,
        isFromBot: false,
        timestamp: new Date().toISOString(),
        status: 'sending',
      };
      dispatch({ type: 'ADD_MESSAGE', payload: { message: userMessage } });

      // 3. Show typing indicator
      dispatch({ type: 'SET_TYPING', payload: { isTyping: true } });

      // 4. Send via WebSocket for real-time (preferred) and HTTP as backup
      sendTestMessage(sessionId, text, buttonId, listRowId);

      // Also call HTTP API to ensure message is persisted
      await sendTestSessionMessage(sessionId, {
        message: text,
        buttonId,
        listRowId,
      });

      // 5. Update message status
      dispatch({
        type: 'UPDATE_MESSAGE_STATUS',
        payload: { messageId: userMessage.id, status: 'sent' },
      });

      // 6. Log the message
      dispatch({
        type: 'ADD_LOG',
        payload: {
          log: {
            type: 'message',
            message: `User sent: "${text}"`,
          },
        },
      });
    } catch (error) {
      console.error('[TestSession] Failed to send message:', error);
      dispatch({ type: 'SET_TYPING', payload: { isTyping: false } });
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      dispatch({ type: 'SET_ERROR', payload: { error: errorMessage } });
    }
  }, [dispatch]);

  return {
    startSession,
    stopSession,
    pauseSession,
    resumeSession,
    sendMessage,
    isSessionActive: isSessionActiveRef.current,
  };
}
