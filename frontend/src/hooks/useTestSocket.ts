import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// ============================================
// TYPES
// ============================================

export interface TestMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  messageType: 'text' | 'interactive' | 'flow' | 'media';
  nodeId?: string;
  timestamp: Date;
}

export interface NodeExecution {
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  enteredAt: Date;
  exitedAt?: Date;
  duration?: number;
  result?: 'success' | 'error' | 'skipped';
  error?: string;
}

export interface TestSessionState {
  status: 'initializing' | 'running' | 'paused' | 'waiting_input' | 'completed' | 'error';
  currentNodeId: string | null;
  currentNodeLabel: string | null;
  waitingForInput?: boolean;
}

export interface VariableChange {
  key: string;
  oldValue: any;
  newValue: any;
  source: 'manual' | 'node' | 'api' | 'flow';
  timestamp: Date;
}

export interface TestCompletionSummary {
  totalMessages: number;
  inboundMessages: number;
  outboundMessages: number;
  nodesExecuted: number;
  variablesSet: number;
}

export interface UseTestSocketOptions {
  autoConnect?: boolean;
  onError?: (error: string) => void;
  onCompleted?: (reason: string, summary: TestCompletionSummary) => void;
}

export interface UseTestSocketReturn {
  // Connection state
  isConnected: boolean;
  isAuthenticated: boolean;
  connectionError: string | null;

  // Test session state
  testSessionId: string | null;
  sessionState: TestSessionState | null;
  messages: TestMessage[];
  variables: Record<string, any>;
  executionHistory: NodeExecution[];
  variableChanges: VariableChange[];

  // Actions
  connect: () => void;
  disconnect: () => void;
  startTest: (chatbotId: string, initialVariables?: Record<string, any>) => Promise<string | null>;
  sendMessage: (message: string, messageType?: 'text' | 'interactive' | 'flow') => void;
  setVariable: (key: string, value: any) => void;
  pauseTest: () => void;
  resumeTest: () => void;
  stopTest: () => void;
  resetTest: () => void;

  // Subscription helpers
  subscribeToExecution: () => void;
  subscribeToVariables: () => void;

  // State helpers
  clearMessages: () => void;
  clearVariables: () => void;
}

// ============================================
// HOOK
// ============================================

const WS_URL = import.meta.env.VITE_WS_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:3000');

export function useTestSocket(options: UseTestSocketOptions = {}): UseTestSocketReturn {
  const { autoConnect = false, onError, onCompleted } = options;

  // Socket ref
  const socketRef = useRef<Socket | null>(null);
  const lastEventIdRef = useRef<string | null>(null);

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Session state
  const [testSessionId, setTestSessionId] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<TestSessionState | null>(null);
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [executionHistory, setExecutionHistory] = useState<NodeExecution[]>([]);
  const [variableChanges, setVariableChanges] = useState<VariableChange[]>([]);

  // Was connected before (for reconnection)
  const wasConnectedRef = useRef(false);

  // ============================================
  // SOCKET INITIALIZATION
  // ============================================

  const initializeSocket = useCallback(() => {
    if (socketRef.current?.connected) return socketRef.current;

    const token = localStorage.getItem('token');

    const socket = io(`${WS_URL}/test-sessions`, {
      autoConnect: false,
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;
    return socket;
  }, []);

  // ============================================
  // EVENT HANDLERS
  // ============================================

  useEffect(() => {
    const socket = initializeSocket();

    // Connection events
    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);

      // Rejoin session if we were connected before
      if (wasConnectedRef.current && testSessionId) {
        socket.emit('test:rejoin', {
          testSessionId,
          lastEventId: lastEventIdRef.current
        });
      }

      wasConnectedRef.current = true;
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server disconnected us, likely auth issue
        setIsAuthenticated(false);
      }
    });

    socket.on('connect_error', (error) => {
      setConnectionError(error.message);
      if (error.message.includes('Authentication')) {
        setIsAuthenticated(false);
      }
    });

    socket.on('test:connected', () => {
      setIsAuthenticated(true);
    });

    socket.on('test:error', (data: { error: string; code?: string }) => {
      onError?.(data.error);
      if (data.code === 'AUTH_REQUIRED') {
        setIsAuthenticated(false);
      }
    });

    // Session events
    socket.on('test:started', (data) => {
      setTestSessionId(data.testSessionId);
      setSessionState({
        status: 'initializing',
        currentNodeId: null,
        currentNodeLabel: null,
      });
    });

    socket.on('test:state-recovery', (data) => {
      setSessionState(data.state);
      setMessages(data.messages || []);
      setVariables(data.variables || {});
      setExecutionHistory(data.executionHistory || []);

      // Process missed events
      if (data.missedEvents) {
        data.missedEvents.forEach((evt: { event: string; data: any }) => {
          socket.emit(evt.event, evt.data);
        });
      }
    });

    // Message events
    socket.on('test:message-received', (data) => {
      setMessages(prev => [...prev, data.message]);
    });

    socket.on('test:bot-response', (data) => {
      setMessages(prev => [...prev, ...data.messages]);
    });

    // Node execution events
    socket.on('test:node-entered', (data) => {
      setSessionState(prev => prev ? {
        ...prev,
        status: 'running',
        currentNodeId: data.nodeId,
        currentNodeLabel: data.nodeLabel,
        waitingForInput: false,
      } : null);

      setExecutionHistory(prev => [...prev, {
        nodeId: data.nodeId,
        nodeType: data.nodeType,
        nodeLabel: data.nodeLabel,
        enteredAt: new Date(),
      }]);
    });

    socket.on('test:node-executed', (data) => {
      setExecutionHistory(prev => prev.map(exec =>
        exec.nodeId === data.nodeId && !exec.exitedAt
          ? { ...exec, exitedAt: new Date(), duration: data.duration, result: data.result, error: data.error }
          : exec
      ));
    });

    socket.on('test:waiting-input', (_data) => {
      setSessionState(prev => prev ? {
        ...prev,
        status: 'waiting_input',
        waitingForInput: true,
      } : null);
    });

    // Variable events
    socket.on('test:variable-changed', (data) => {
      setVariables(prev => ({ ...prev, [data.key]: data.newValue }));
      setVariableChanges(prev => [...prev, {
        key: data.key,
        oldValue: data.oldValue,
        newValue: data.newValue,
        source: data.source,
        timestamp: new Date(),
      }]);
    });

    socket.on('test:variables-snapshot', (data) => {
      setVariables(data.variables);
    });

    // Control events
    socket.on('test:paused', () => {
      setSessionState(prev => prev ? { ...prev, status: 'paused' } : null);
    });

    socket.on('test:resumed', () => {
      setSessionState(prev => prev ? { ...prev, status: 'running' } : null);
    });

    socket.on('test:reset', () => {
      setMessages([]);
      setVariables({});
      setExecutionHistory([]);
      setVariableChanges([]);
      setSessionState({
        status: 'initializing',
        currentNodeId: null,
        currentNodeLabel: null,
      });
    });

    socket.on('test:completed', (data) => {
      setSessionState(prev => prev ? { ...prev, status: 'completed' } : null);
      onCompleted?.(data.reason, data.summary);
    });

    // Auto connect if option is set
    if (autoConnect) {
      socket.connect();
    }

    // Cleanup
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('test:connected');
      socket.off('test:error');
      socket.off('test:started');
      socket.off('test:state-recovery');
      socket.off('test:message-received');
      socket.off('test:bot-response');
      socket.off('test:node-entered');
      socket.off('test:node-executed');
      socket.off('test:waiting-input');
      socket.off('test:variable-changed');
      socket.off('test:variables-snapshot');
      socket.off('test:paused');
      socket.off('test:resumed');
      socket.off('test:reset');
      socket.off('test:completed');
    };
  }, [initializeSocket, autoConnect, testSessionId, onError, onCompleted]);

  // ============================================
  // ACTIONS
  // ============================================

  const connect = useCallback(() => {
    const socket = socketRef.current || initializeSocket();
    if (!socket.connected) {
      socket.connect();
    }
  }, [initializeSocket]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    setTestSessionId(null);
    setSessionState(null);
    setMessages([]);
    setVariables({});
    setExecutionHistory([]);
    setVariableChanges([]);
    wasConnectedRef.current = false;
  }, []);

  const startTest = useCallback(async (
    chatbotId: string,
    initialVariables?: Record<string, any>
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!socketRef.current?.connected) {
        onError?.('Not connected');
        resolve(null);
        return;
      }

      // Clear previous state
      setMessages([]);
      setVariables(initialVariables || {});
      setExecutionHistory([]);
      setVariableChanges([]);

      socketRef.current.emit('test:start', { chatbotId, initialVariables }, (response: any) => {
        if (response.event === 'test:started') {
          resolve(response.data.testSessionId);
        } else {
          onError?.(response.data?.error || 'Failed to start test');
          resolve(null);
        }
      });
    });
  }, [onError]);

  const sendMessage = useCallback((message: string, messageType: 'text' | 'interactive' | 'flow' = 'text') => {
    if (!socketRef.current?.connected || !testSessionId) return;

    socketRef.current.emit('test:send-message', {
      testSessionId,
      message,
      messageType
    });
  }, [testSessionId]);

  const setVariable = useCallback((key: string, value: any) => {
    if (!socketRef.current?.connected || !testSessionId) return;

    socketRef.current.emit('test:set-variable', {
      testSessionId,
      key,
      value
    });
  }, [testSessionId]);

  const pauseTest = useCallback(() => {
    if (!socketRef.current?.connected || !testSessionId) return;
    socketRef.current.emit('test:pause', { testSessionId });
  }, [testSessionId]);

  const resumeTest = useCallback(() => {
    if (!socketRef.current?.connected || !testSessionId) return;
    socketRef.current.emit('test:resume', { testSessionId });
  }, [testSessionId]);

  const stopTest = useCallback(() => {
    if (!socketRef.current?.connected || !testSessionId) return;
    socketRef.current.emit('test:stop', { testSessionId });
  }, [testSessionId]);

  const resetTest = useCallback(() => {
    if (!socketRef.current?.connected || !testSessionId) return;
    socketRef.current.emit('test:reset', { testSessionId });
  }, [testSessionId]);

  const subscribeToExecution = useCallback(() => {
    if (!socketRef.current?.connected || !testSessionId) return;
    socketRef.current.emit('test:subscribe-execution', { testSessionId });
  }, [testSessionId]);

  const subscribeToVariables = useCallback(() => {
    if (!socketRef.current?.connected || !testSessionId) return;
    socketRef.current.emit('test:subscribe-variables', { testSessionId });
  }, [testSessionId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const clearVariables = useCallback(() => {
    setVariables({});
    setVariableChanges([]);
  }, []);

  // ============================================
  // RETURN
  // ============================================

  return {
    // Connection state
    isConnected,
    isAuthenticated,
    connectionError,

    // Test session state
    testSessionId,
    sessionState,
    messages,
    variables,
    executionHistory,
    variableChanges,

    // Actions
    connect,
    disconnect,
    startTest,
    sendMessage,
    setVariable,
    pauseTest,
    resumeTest,
    stopTest,
    resetTest,

    // Subscription helpers
    subscribeToExecution,
    subscribeToVariables,

    // State helpers
    clearMessages,
    clearVariables,
  };
}
