/**
 * ChatWindow Component
 *
 * WhatsApp-style chat interface for the chatbot tester.
 * Displays messages, typing indicator, and handles auto-scrolling.
 */

import { useRef, useEffect, useCallback } from 'react';
import { useTesterContext } from '../../context/TesterContext';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

interface ChatWindowProps {
  /** Show node info badges on bot messages */
  showNodeInfo?: boolean;
  /** Custom class name for the container */
  className?: string;
  /** Custom empty state message */
  emptyStateMessage?: string;
}

/**
 * Custom hook for auto-scrolling to bottom when messages change
 */
function useAutoScroll(
  messagesContainerRef: React.RefObject<HTMLDivElement | null>,
  dependencies: unknown[]
) {
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}

/**
 * Empty state component
 */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500">
      <span className="material-symbols-outlined text-6xl mb-4 opacity-50">
        chat_bubble_outline
      </span>
      <p className="text-sm text-center px-4">{message}</p>
    </div>
  );
}

/**
 * Connection status indicator
 */
function ConnectionStatus({
  status,
}: {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
}) {
  const statusConfig = {
    disconnected: {
      color: 'bg-gray-500',
      text: 'Disconnected',
      icon: 'cloud_off',
    },
    connecting: {
      color: 'bg-yellow-500',
      text: 'Connecting...',
      icon: 'sync',
    },
    connected: {
      color: 'bg-emerald-500',
      text: 'Connected',
      icon: 'cloud_done',
    },
    error: {
      color: 'bg-red-500',
      text: 'Connection Error',
      icon: 'error',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-full">
      <span className={`w-2 h-2 rounded-full ${config.color} ${status === 'connecting' ? 'animate-pulse' : ''}`} />
      <span className="material-symbols-outlined text-sm text-gray-400">
        {config.icon}
      </span>
      <span className="text-xs text-gray-400">{config.text}</span>
    </div>
  );
}

/**
 * Test session status badge
 */
function SessionStatusBadge({
  status,
}: {
  status: string;
}) {
  const statusConfig: Record<string, { color: string; text: string }> = {
    idle: { color: 'text-gray-400', text: 'Ready' },
    connecting: { color: 'text-yellow-400', text: 'Connecting' },
    running: { color: 'text-emerald-400', text: 'Running' },
    waiting_input: { color: 'text-blue-400', text: 'Waiting for input' },
    waiting_flow: { color: 'text-purple-400', text: 'Waiting for flow' },
    paused: { color: 'text-yellow-400', text: 'Paused' },
    completed: { color: 'text-emerald-400', text: 'Completed' },
    stopped: { color: 'text-gray-400', text: 'Stopped' },
    error: { color: 'text-red-400', text: 'Error' },
  };

  const config = statusConfig[status] || statusConfig.idle;

  return (
    <span className={`text-xs font-medium ${config.color}`}>
      {config.text}
    </span>
  );
}

/**
 * ChatWindow - Main component
 */
export function ChatWindow({
  showNodeInfo = false,
  className = '',
  emptyStateMessage = 'Start the test to see messages here',
}: ChatWindowProps) {
  const { state, actions } = useTesterContext();
  const { messages, isTyping, connectionStatus, status } = state;

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages change or typing indicator appears
  useAutoScroll(messagesContainerRef, [messages, isTyping]);

  // Handle button click
  const handleButtonClick = useCallback(
    (buttonId: string, buttonTitle: string) => {
      actions.selectButton(buttonId, buttonTitle);
    },
    [actions]
  );

  // Handle list item selection
  const handleListItemSelect = useCallback(
    (itemId: string, itemTitle: string) => {
      actions.selectListItem(itemId, itemTitle);
    },
    [actions]
  );

  // Handle flow start
  const handleFlowStart = useCallback(
    (flowId: string) => {
      actions.completeFlow(flowId);
    },
    [actions]
  );

  return (
    <div className={`flex flex-col h-full bg-[#0b141a] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-700">
        <div className="flex items-center gap-3">
          {/* Bot avatar */}
          <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-xl">
              smart_toy
            </span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-100">Chatbot Tester</h3>
            <SessionStatusBadge status={status} />
          </div>
        </div>

        {/* Connection status */}
        <ConnectionStatus status={connectionStatus} />
      </div>

      {/* Messages container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {messages.length === 0 ? (
          <EmptyState message={emptyStateMessage} />
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                showNodeInfo={showNodeInfo}
                onButtonClick={handleButtonClick}
                onListItemSelect={handleListItemSelect}
                onFlowStart={handleFlowStart}
              />
            ))}

            {/* Typing indicator */}
            {isTyping && <TypingIndicator />}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Status bar (optional - shows when test is not running) */}
      {(status === 'completed' || status === 'stopped' || status === 'error') && (
        <div className="px-4 py-2 bg-gray-800/50 border-t border-gray-700">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            {status === 'completed' && (
              <>
                <span className="material-symbols-outlined text-emerald-400">
                  check_circle
                </span>
                <span>Test completed successfully</span>
              </>
            )}
            {status === 'stopped' && (
              <>
                <span className="material-symbols-outlined text-yellow-400">
                  stop_circle
                </span>
                <span>Test stopped</span>
              </>
            )}
            {status === 'error' && (
              <>
                <span className="material-symbols-outlined text-red-400">
                  error
                </span>
                <span>Test encountered an error</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatWindow;
