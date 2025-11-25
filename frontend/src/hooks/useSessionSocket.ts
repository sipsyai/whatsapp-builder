import { useEffect, useState, useCallback } from 'react';
import { sessionSocket } from '../api/socket';
import type {
  ChatbotSession,
  SessionStartedPayload,
  SessionStatusPayload,
  SessionCompletedPayload,
} from '../types/sessions';

interface UseSessionSocketReturn {
  connected: boolean;
  activeSessions: Map<string, ChatbotSession>;
  sessionStarted: SessionStartedPayload | null;
  sessionStatusChanged: SessionStatusPayload | null;
  sessionCompleted: SessionCompletedPayload | null;
  subscribeToSessions: () => void;
  unsubscribeFromSessions: () => void;
  joinSession: (sessionId: string) => void;
  leaveSession: (sessionId: string) => void;
}

export function useSessionSocket(): UseSessionSocketReturn {
  const [connected, setConnected] = useState(false);
  const [activeSessions, setActiveSessions] = useState<Map<string, ChatbotSession>>(new Map());
  const [sessionStarted, setSessionStarted] = useState<SessionStartedPayload | null>(null);
  const [sessionStatusChanged, setSessionStatusChanged] = useState<SessionStatusPayload | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState<SessionCompletedPayload | null>(null);

  // Subscribe to all session updates
  const subscribeToSessions = useCallback(() => {
    if (connected) {
      console.log('Subscribing to all session updates');
      sessionSocket.emit('sessions:subscribe');
    }
  }, [connected]);

  // Unsubscribe from all session updates
  const unsubscribeFromSessions = useCallback(() => {
    if (connected) {
      console.log('Unsubscribing from all session updates');
      sessionSocket.emit('sessions:unsubscribe');
    }
  }, [connected]);

  // Join a specific session room for detailed updates
  const joinSession = useCallback((sessionId: string) => {
    if (connected) {
      console.log('Joining session:', sessionId);
      sessionSocket.emit('session:join', { sessionId });
    }
  }, [connected]);

  // Leave a specific session room
  const leaveSession = useCallback((sessionId: string) => {
    if (connected) {
      console.log('Leaving session:', sessionId);
      sessionSocket.emit('session:leave', { sessionId });
    }
  }, [connected]);

  useEffect(() => {
    // Connect to WebSocket
    sessionSocket.connect();

    // Connection events
    sessionSocket.on('connect', () => {
      console.log('Session WebSocket connected');
      setConnected(true);
    });

    sessionSocket.on('disconnect', () => {
      console.log('Session WebSocket disconnected');
      setConnected(false);
      setActiveSessions(new Map());
    });

    sessionSocket.on('connect_error', (error) => {
      console.error('Session WebSocket connection error:', error);
    });

    // Session lifecycle events
    sessionSocket.on('session:started', (data: SessionStartedPayload) => {
      console.log('Session started:', data);
      setSessionStarted(data);

      // Add to active sessions
      setActiveSessions((prev) => {
        const updated = new Map(prev);
        updated.set(data.sessionId, {
          id: data.sessionId,
          conversationId: data.conversationId,
          chatbotId: data.chatbotId,
          chatbotName: data.chatbotName,
          customerPhone: data.customerPhone,
          customerName: data.customerName,
          status: 'running',
          currentNodeId: '',
          currentNodeLabel: '',
          startedAt: data.startedAt,
          updatedAt: data.startedAt,
          completedAt: null,
          nodeCount: 0,
          messageCount: 0,
          isActive: true,
        });
        return updated;
      });
    });

    sessionSocket.on('session:status-changed', (data: SessionStatusPayload) => {
      console.log('Session status changed:', data);
      setSessionStatusChanged(data);

      // Update session in active sessions
      setActiveSessions((prev) => {
        const updated = new Map(prev);
        const session = updated.get(data.sessionId);
        if (session) {
          updated.set(data.sessionId, {
            ...session,
            status: data.newStatus,
            currentNodeId: data.currentNodeId,
            currentNodeLabel: data.currentNodeLabel || session.currentNodeLabel,
            updatedAt: data.updatedAt,
            isActive: !['completed', 'expired', 'stopped'].includes(data.newStatus),
          });
        }
        return updated;
      });
    });

    sessionSocket.on('session:completed', (data: SessionCompletedPayload) => {
      console.log('Session completed:', data);
      setSessionCompleted(data);

      // Remove from active sessions or mark as completed
      setActiveSessions((prev) => {
        const updated = new Map(prev);
        const session = updated.get(data.sessionId);
        if (session) {
          updated.set(data.sessionId, {
            ...session,
            status: 'completed',
            completedAt: data.completedAt,
            updatedAt: data.completedAt,
            nodeCount: data.totalNodes,
            messageCount: data.totalMessages,
            isActive: false,
          });
        }
        return updated;
      });
    });

    // Node execution events (optional - for real-time flow visualization)
    sessionSocket.on('session:node-executed', (data: any) => {
      console.log('Node executed:', data);
      // Update session node count and current node
      setActiveSessions((prev) => {
        const updated = new Map(prev);
        const session = updated.get(data.sessionId);
        if (session) {
          updated.set(data.sessionId, {
            ...session,
            currentNodeId: data.nodeId,
            currentNodeLabel: data.nodeLabel,
            nodeCount: session.nodeCount + 1,
            updatedAt: data.executedAt,
          });
        }
        return updated;
      });
    });

    // Message events (optional - for real-time message count)
    sessionSocket.on('session:message-sent', (data: any) => {
      console.log('Message sent in session:', data);
      setActiveSessions((prev) => {
        const updated = new Map(prev);
        const session = updated.get(data.sessionId);
        if (session) {
          updated.set(data.sessionId, {
            ...session,
            messageCount: session.messageCount + 1,
            updatedAt: data.timestamp,
          });
        }
        return updated;
      });
    });

    // Error events
    sessionSocket.on('session:error', (data: any) => {
      console.error('Session error:', data);
    });

    // Cleanup
    return () => {
      sessionSocket.off('connect');
      sessionSocket.off('disconnect');
      sessionSocket.off('connect_error');
      sessionSocket.off('session:started');
      sessionSocket.off('session:status-changed');
      sessionSocket.off('session:completed');
      sessionSocket.off('session:node-executed');
      sessionSocket.off('session:message-sent');
      sessionSocket.off('session:error');
      sessionSocket.disconnect();
    };
  }, []);

  return {
    connected,
    activeSessions,
    sessionStarted,
    sessionStatusChanged,
    sessionCompleted,
    subscribeToSessions,
    unsubscribeFromSessions,
    joinSession,
    leaveSession,
  };
}
