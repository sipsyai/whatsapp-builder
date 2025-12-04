/**
 * TesterPanel Component
 *
 * Main container component for the Chatbot Tester.
 * Features:
 * - Fixed drawer panel on the right (n8n style)
 * - Resizable (min: 400px, max: 800px)
 * - Header with controls
 * - Split view: Chat (60%) / Variables+Timeline tabs (40%)
 * - Collapsible log panel at the bottom
 * - WebSocket integration for real-time test sessions
 */

import React, { useState, useCallback, useRef, useEffect, createContext, useContext } from 'react';
import { TesterProvider, useTesterState, useTesterContext } from '../../context';
import { TesterPanelHeader } from './TesterPanelHeader';
import { useTestSessionManager } from '../../hooks';

// ============================================================================
// Types
// ============================================================================

export interface TesterPanelProps {
  chatbotId: string;
  chatbotName: string;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'variables' | 'timeline';

// ============================================================================
// Session Manager Context
// ============================================================================

/**
 * Context to provide session manager actions to child components
 */
interface SessionManagerContextValue {
  startSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  sendMessage: (text: string, buttonId?: string, listRowId?: string) => Promise<void>;
}

const SessionManagerContext = createContext<SessionManagerContextValue | null>(null);

/**
 * Hook to access session manager actions
 */
export function useSessionManager(): SessionManagerContextValue {
  const context = useContext(SessionManagerContext);
  if (!context) {
    throw new Error('useSessionManager must be used within a SessionManagerProvider');
  }
  return context;
}

// ============================================================================
// Constants
// ============================================================================

const MIN_WIDTH = 400;
const MAX_WIDTH = 800;
const DEFAULT_WIDTH = 600;

// ============================================================================
// Inner Components
// ============================================================================

/**
 * Chat Window - Displays messages and handles user input
 */
const ChatWindow: React.FC = () => {
  const state = useTesterState();
  const { sendMessage } = useSessionManager();
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.messages]);

  // Can accept input when waiting for user input
  const canSendMessage = state.status === 'waiting_input' && !isSending;

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !canSendMessage) return;

    const messageText = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    try {
      await sendMessage(messageText);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Render message content based on type
  const renderMessageContent = (msg: typeof state.messages[0]) => {
    if (typeof msg.content === 'string') {
      return msg.content;
    }

    // Handle interactive messages
    if ('type' in msg.content) {
      const content = msg.content as { type: string; body?: string; header?: string };
      return (
        <div>
          {content.header && <div className="font-semibold mb-1">{content.header}</div>}
          {content.body && <div>{content.body}</div>}
        </div>
      );
    }

    return JSON.stringify(msg.content);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-700/50">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 border-b border-gray-700/50 rounded-t-lg">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-emerald-400 text-lg">
            chat
          </span>
        </div>
        <h4 className="font-medium text-gray-200 text-sm">Chat</h4>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
          {state.messages.length} messages
        </span>
        {state.isTyping && (
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <span className="animate-pulse">Bot is typing...</span>
          </span>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {state.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <span className="material-symbols-outlined text-4xl mb-2 text-gray-600">
              chat_bubble_outline
            </span>
            <p className="text-sm">No messages yet</p>
            <p className="text-xs text-gray-600 mt-1">
              Start the test to begin chatting
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {state.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isFromBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.isFromBot
                      ? 'bg-gray-800 text-gray-200 rounded-tl-none'
                      : 'bg-[#25d366] text-white rounded-tr-none'
                  }`}
                >
                  {renderMessageContent(msg)}
                  {msg.status === 'sending' && (
                    <span className="text-xs opacity-60 ml-2">sending...</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-gray-700/50 bg-gray-800/30">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              state.status === 'waiting_input'
                ? 'Type a message...'
                : state.status === 'idle'
                ? 'Start the test first...'
                : 'Waiting for bot...'
            }
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#25d366]/50 focus:border-[#25d366]/50 disabled:opacity-50"
            disabled={!canSendMessage}
          />
          <button
            onClick={handleSendMessage}
            className="p-2 rounded-lg bg-[#25d366] text-white hover:bg-[#22c55e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canSendMessage || !inputValue.trim()}
          >
            <span className="material-symbols-outlined text-xl">
              {isSending ? 'hourglass_empty' : 'send'}
            </span>
          </button>
        </div>
        {state.status === 'waiting_input' && state.waitingInputOptions?.buttons && (
          <div className="mt-2 flex flex-wrap gap-2">
            {state.waitingInputOptions.buttons.map((button) => (
              <button
                key={button.id}
                onClick={() => sendMessage(button.title, button.id)}
                className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-colors"
              >
                {button.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Variables Tab Content
 */
const VariablesTab: React.FC = () => {
  const state = useTesterState();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = async (key: string, value: unknown) => {
    try {
      await navigator.clipboard.writeText(
        typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
      );
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const variableEntries = Object.entries(state.variables);

  return (
    <div className="h-full overflow-y-auto p-3">
      {variableEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <span className="material-symbols-outlined text-3xl mb-2 text-gray-600">
            inventory_2
          </span>
          <p className="text-sm">No variables set</p>
        </div>
      ) : (
        <div className="space-y-2">
          {variableEntries.map(([key, value]) => (
            <div
              key={key}
              className="bg-gray-800/50 rounded-lg p-2.5 border border-gray-700/30 group hover:border-gray-600/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {key}
                </span>
                <button
                  onClick={() => copyToClipboard(key, value)}
                  className={`flex-shrink-0 p-1 rounded transition-all duration-200 ${
                    copiedKey === key
                      ? 'text-emerald-400 bg-emerald-500/20'
                      : 'text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 opacity-0 group-hover:opacity-100'
                  }`}
                  title="Copy value"
                >
                  <span className="material-symbols-outlined text-sm">
                    {copiedKey === key ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>
              <div className="mt-1.5 text-xs">
                {typeof value === 'object' ? (
                  <pre className="text-cyan-300/90 bg-gray-950 p-2 rounded overflow-x-auto border border-gray-800">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ) : (
                  <span className="text-gray-300">{String(value)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Timeline Tab Content
 */
const TimelineTab: React.FC = () => {
  const state = useTesterState();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'system':
        return { icon: 'settings', color: 'text-gray-400', bg: 'bg-gray-500/20' };
      case 'message':
        return { icon: 'chat', color: 'text-blue-400', bg: 'bg-blue-500/20' };
      case 'node':
        return { icon: 'account_tree', color: 'text-purple-400', bg: 'bg-purple-500/20' };
      case 'variable':
        return { icon: 'database', color: 'text-cyan-400', bg: 'bg-cyan-500/20' };
      case 'error':
        return { icon: 'error', color: 'text-red-400', bg: 'bg-red-500/20' };
      case 'warning':
        return { icon: 'warning', color: 'text-amber-400', bg: 'bg-amber-500/20' };
      default:
        return { icon: 'info', color: 'text-gray-400', bg: 'bg-gray-500/20' };
    }
  };

  return (
    <div className="h-full overflow-y-auto p-3">
      {state.logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <span className="material-symbols-outlined text-3xl mb-2 text-gray-600">
            timeline
          </span>
          <p className="text-sm">No events yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {state.logs.map((log, index) => {
            const config = getLogIcon(log.type);
            return (
              <div key={log.id} className="flex gap-2">
                {/* Timeline indicator */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${config.bg}`}
                  >
                    <span className={`material-symbols-outlined text-sm ${config.color}`}>
                      {config.icon}
                    </span>
                  </div>
                  {index < state.logs.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-700/50 mt-1" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/30">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-gray-300">{log.message}</p>
                      <span className="text-[10px] text-gray-500 whitespace-nowrap font-mono">
                        {formatTime(log.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * Log Panel (Collapsible)
 */
const LogPanel: React.FC<{ isExpanded: boolean; onToggle: () => void }> = ({
  isExpanded,
  onToggle,
}) => {
  const state = useTesterState();
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isExpanded && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.logs, isExpanded]);

  const getLogColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-amber-400';
      case 'system':
        return 'text-gray-400';
      case 'node':
        return 'text-purple-400';
      case 'variable':
        return 'text-cyan-400';
      default:
        return 'text-gray-300';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="border-t border-gray-700/50 bg-gray-900/90">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-gray-400 text-lg">
            terminal
          </span>
          <span className="text-sm font-medium text-gray-300">Logs</span>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
            {state.logs.length}
          </span>
          {state.error && (
            <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/30">
              Error
            </span>
          )}
        </div>
        <span
          className={`material-symbols-outlined text-gray-500 transition-transform duration-200 ${
            isExpanded ? '' : 'rotate-180'
          }`}
        >
          expand_more
        </span>
      </button>

      {/* Log content */}
      {isExpanded && (
        <div className="max-h-48 overflow-y-auto px-4 pb-3 font-mono text-xs">
          {state.logs.length === 0 ? (
            <p className="text-gray-500 py-2">No logs yet...</p>
          ) : (
            <div className="space-y-1">
              {state.logs.map((log) => (
                <div key={log.id} className="flex gap-2">
                  <span className="text-gray-600 flex-shrink-0">
                    [{formatTime(log.timestamp)}]
                  </span>
                  <span className={`uppercase text-[10px] font-semibold flex-shrink-0 ${getLogColor(log.type)}`}>
                    [{log.type}]
                  </span>
                  <span className={getLogColor(log.type)}>{log.message}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Session Manager Wrapper - Initializes and provides session manager to children
 */
const SessionManagerWrapper: React.FC<{
  chatbotId: string;
  children: React.ReactNode;
}> = ({ chatbotId, children }) => {
  const { dispatch } = useTesterContext();
  const sessionManager = useTestSessionManager(chatbotId, dispatch);

  const contextValue: SessionManagerContextValue = {
    startSession: sessionManager.startSession,
    stopSession: sessionManager.stopSession,
    pauseSession: sessionManager.pauseSession,
    resumeSession: sessionManager.resumeSession,
    sendMessage: sessionManager.sendMessage,
  };

  return (
    <SessionManagerContext.Provider value={contextValue}>
      {children}
    </SessionManagerContext.Provider>
  );
};

/**
 * Main Panel Content (uses context)
 */
const TesterPanelContent: React.FC<{
  chatbotId: string;
  chatbotName: string;
  onClose: () => void;
  width: number;
  onResizeStart: (e: React.MouseEvent) => void;
}> = ({ chatbotId, chatbotName, onClose, width, onResizeStart }) => {
  const [activeTab, setActiveTab] = useState<TabType>('variables');
  const [isLogExpanded, setIsLogExpanded] = useState(true);

  return (
    <SessionManagerWrapper chatbotId={chatbotId}>
      <div
        className="fixed top-0 right-0 h-full bg-gray-900 border-l border-gray-700/50 shadow-2xl flex flex-col z-50"
        style={{ width }}
      >
        {/* Resize handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-[#25d366]/50 transition-colors group"
          onMouseDown={onResizeStart}
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-gray-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Header */}
        <TesterPanelHeader chatbotName={chatbotName} onClose={onClose} />

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Chat (60%) */}
          <div className="w-[60%] p-3 border-r border-gray-700/30">
            <ChatWindow />
          </div>

          {/* Right: Variables/Timeline tabs (40%) */}
          <div className="w-[40%] flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-gray-700/50 bg-gray-800/30">
              <button
                onClick={() => setActiveTab('variables')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
                  activeTab === 'variables'
                    ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                }`}
              >
                <span className="material-symbols-outlined text-sm">database</span>
                Variables
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
                  activeTab === 'timeline'
                    ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                }`}
              >
                <span className="material-symbols-outlined text-sm">timeline</span>
                Timeline
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'variables' ? <VariablesTab /> : <TimelineTab />}
            </div>
          </div>
        </div>

        {/* Log panel */}
        <LogPanel
          isExpanded={isLogExpanded}
          onToggle={() => setIsLogExpanded(!isLogExpanded)}
        />
      </div>
    </SessionManagerWrapper>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const TesterPanel: React.FC<TesterPanelProps> = ({
  chatbotId,
  chatbotName,
  isOpen,
  onClose,
}) => {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  // Handle resize move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;

      const delta = startX.current - e.clientX;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Panel wrapped with Provider */}
      <TesterProvider chatbotId={chatbotId}>
        <TesterPanelContent
          chatbotId={chatbotId}
          chatbotName={chatbotName}
          onClose={onClose}
          width={width}
          onResizeStart={handleResizeStart}
        />
      </TesterProvider>
    </>
  );
};

export default TesterPanel;
