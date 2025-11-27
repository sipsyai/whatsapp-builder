import { useEffect, useState } from 'react';
import { SessionsService } from '../../../api/sessions.service';
import { useSessionSocket } from '../../../hooks/useSessionSocket';
import { sessionSocket } from '../../../api/socket';
import type { ChatbotSessionDetail, SessionMessage } from '../../../types/sessions';
import { ConversationLog } from './ConversationLog';
import { VariablesPanel } from './VariablesPanel';
import { SessionTimeline } from './SessionTimeline';

interface SessionDetailPageProps {
  sessionId: string;
  onBack: () => void;
}

export const SessionDetailPage = ({ sessionId, onBack }: SessionDetailPageProps) => {
  const [session, setSession] = useState<ChatbotSessionDetail | null>(null);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { connected, joinSession, leaveSession } = useSessionSocket();

  // Fetch session details on mount
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch session details and messages in parallel
        const [sessionData, messagesData] = await Promise.all([
          SessionsService.getSession(sessionId),
          SessionsService.getSessionMessages(sessionId),
        ]);

        setSession(sessionData);
        setMessages(messagesData);
      } catch (err: any) {
        console.error('Failed to fetch session data:', err);
        setError(err.message || 'Failed to load session details');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId]);

  // Join session WebSocket room for real-time updates
  useEffect(() => {
    if (connected && sessionId) {
      joinSession(sessionId);

      return () => {
        leaveSession(sessionId);
      };
    }
  }, [connected, sessionId, joinSession, leaveSession]);

  // Listen for real-time message updates
  useEffect(() => {
    if (!connected) return;

    const handleMessageSent = (data: any) => {
      if (data.sessionId === sessionId) {
        // Add new message to the list
        setMessages((prev) => [
          ...prev,
          {
            id: data.messageId || `msg-${Date.now()}`,
            senderId: data.senderId,
            senderName: data.senderName,
            senderPhone: data.senderPhone,
            isFromBot: data.isFromBot,
            type: data.type,
            content: data.content,
            status: data.status || 'sent',
            timestamp: data.timestamp,
          },
        ]);
      }
    };

    const handleNodeExecuted = (data: any) => {
      if (data.sessionId === sessionId && session) {
        // Update session with new node info
        setSession((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            currentNodeId: data.nodeId,
            currentNodeLabel: data.nodeLabel,
            nodeHistory: [...prev.nodeHistory, data.nodeLabel],
            nodeCount: prev.nodeCount + 1,
          };
        });
      }
    };

    const handleStatusChanged = (data: any) => {
      if (data.sessionId === sessionId && session) {
        setSession((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: data.newStatus,
            currentNodeId: data.currentNodeId,
            currentNodeLabel: data.currentNodeLabel || prev.currentNodeLabel,
            isActive: !['completed', 'expired', 'stopped'].includes(data.newStatus),
            updatedAt: data.updatedAt,
          };
        });
      }
    };

    const handleSessionCompleted = (data: any) => {
      if (data.sessionId === sessionId && session) {
        setSession((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: 'completed',
            completedAt: data.completedAt,
            completionReason: data.completionReason,
            nodeCount: data.totalNodes,
            messageCount: data.totalMessages,
            isActive: false,
          };
        });
      }
    };

    // Subscribe to session events
    sessionSocket.on('session:message-sent', handleMessageSent);
    sessionSocket.on('session:node-executed', handleNodeExecuted);
    sessionSocket.on('session:status-changed', handleStatusChanged);
    sessionSocket.on('session:completed', handleSessionCompleted);

    return () => {
      sessionSocket.off('session:message-sent', handleMessageSent);
      sessionSocket.off('session:node-executed', handleNodeExecuted);
      sessionSocket.off('session:status-changed', handleStatusChanged);
      sessionSocket.off('session:completed', handleSessionCompleted);
    };
  }, [connected, sessionId, session]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'waiting_input':
        return 'bg-yellow-100 text-yellow-800';
      case 'waiting_flow':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      case 'stopped':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatusLabel = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleStopSession = async () => {
    if (!session || !session.isActive) return;

    if (confirm('Are you sure you want to stop this session?')) {
      try {
        await SessionsService.stopSession(sessionId);
        // The WebSocket will update the session status automatically
      } catch (err: any) {
        console.error('Failed to stop session:', err);
        alert('Failed to stop session: ' + (err.message || 'Unknown error'));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-red-500 text-5xl">error</span>
          <p className="text-gray-900 font-medium">
            {error || 'Session not found'}
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>

            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-600">
                    person
                  </span>
                  <h1 className="text-xl font-bold text-gray-900">
                    {session.customerName}
                  </h1>
                </div>
                <span className="text-sm text-gray-500">
                  {session.customerPhone}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-gray-500">
                    smart_toy
                  </span>
                  <span className="text-sm text-gray-600">
                    {session.chatbotName}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(session.status)}`}>
                  {formatStatusLabel(session.status)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Session stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-gray-600">
                <span className="material-symbols-outlined text-sm">chat</span>
                <span>{session.messageCount} messages</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <span className="material-symbols-outlined text-sm">account_tree</span>
                <span>{session.nodeCount} nodes</span>
              </div>
            </div>

            {/* Stop button */}
            {session.isActive && (
              <button
                onClick={handleStopSession}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">stop_circle</span>
                Stop Session
              </button>
            )}
          </div>
        </div>

        {/* Current node info */}
        {session.currentNodeLabel && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-purple-600 text-sm">
              location_on
            </span>
            <span className="text-gray-600">Current Node:</span>
            <span className="font-medium text-gray-900">
              {session.currentNodeLabel}
            </span>
          </div>
        )}
      </div>

      {/* Main content - Split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left side - Conversation Log (60%) */}
        <div className="w-[60%] border-r border-gray-700">
          <ConversationLog messages={messages} isActive={session.isActive} />
        </div>

        {/* Right side - Timeline & Variables (40%) */}
        <div className="w-[40%] flex flex-col overflow-hidden">
          {/* Session Timeline (upper) */}
          <div className="flex-1 min-h-0 p-4 pb-2">
            <SessionTimeline messages={messages} session={session} />
          </div>

          {/* Variables Panel (lower) */}
          <div className="p-4 pt-2">
            <VariablesPanel variables={session.variables} />
          </div>
        </div>
      </div>
    </div>
  );
};
