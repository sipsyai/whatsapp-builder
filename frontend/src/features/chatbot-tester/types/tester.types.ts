/**
 * Chatbot Tester TypeScript Type Definitions
 *
 * Types for the Chatbot Test system including state management,
 * messages, logs, and actions.
 */

// ============================================================================
// Test Session Status
// ============================================================================

/**
 * Represents the current status of a test session
 */
export type TestSessionStatus =
  | 'idle'           // Initial state, no test running
  | 'connecting'     // Connecting to WebSocket
  | 'running'        // Test is actively running
  | 'waiting_input'  // Waiting for user input (text, button, list)
  | 'waiting_flow'   // Waiting for WhatsApp Flow completion
  | 'paused'         // Test is paused
  | 'completed'      // Test completed successfully
  | 'stopped'        // Test was manually stopped
  | 'error';         // Test encountered an error

// ============================================================================
// Connection Status
// ============================================================================

/**
 * WebSocket connection status
 */
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

// ============================================================================
// Message Types
// ============================================================================

/**
 * Types of messages that can be sent/received
 */
export type MessageType = 'text' | 'interactive' | 'flow';

/**
 * Interactive message button
 */
export interface InteractiveButton {
  id: string;
  title: string;
  type?: 'reply' | 'url';
  url?: string;
}

/**
 * Interactive list row
 */
export interface InteractiveListRow {
  id: string;
  title: string;
  description?: string;
}

/**
 * Interactive list section
 */
export interface InteractiveListSection {
  title: string;
  rows: InteractiveListRow[];
}

/**
 * Interactive message content
 */
export interface InteractiveContent {
  type: 'buttons' | 'list';
  header?: string;
  body: string;
  footer?: string;
  buttons?: InteractiveButton[];
  listButtonText?: string;
  sections?: InteractiveListSection[];
}

/**
 * WhatsApp Flow content
 */
export interface FlowContent {
  flowId: string;
  flowName?: string;
  headerText?: string;
  bodyText: string;
  footerText?: string;
  ctaText: string;
  mode?: 'draft' | 'published';
}

/**
 * Test message representing a single message in the conversation
 */
export interface TestMessage {
  id: string;
  type: MessageType;
  content: string | InteractiveContent | FlowContent;
  isFromBot: boolean;
  timestamp: string;
  nodeId?: string;
  nodeName?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

// ============================================================================
// Log Entry Types
// ============================================================================

/**
 * Types of log entries
 */
export type LogEntryType =
  | 'system'    // System messages (start, stop, etc.)
  | 'message'   // Message sent/received
  | 'node'      // Node execution
  | 'variable'  // Variable set/updated
  | 'error'     // Error occurred
  | 'warning';  // Warning

/**
 * Log entry representing a single log item
 */
export interface LogEntry {
  id: string;
  type: LogEntryType;
  timestamp: Date;
  message: string;
  data?: Record<string, unknown>;
  nodeId?: string;
  nodeName?: string;
}

// ============================================================================
// Waiting Input Types
// ============================================================================

/**
 * Types of input the tester might be waiting for
 */
export type WaitingInputType = 'text' | 'button' | 'list' | 'flow' | null;

/**
 * Options for waiting input
 */
export interface WaitingInputOptions {
  buttons?: InteractiveButton[];
  sections?: InteractiveListSection[];
  listButtonText?: string;
  flowId?: string;
  flowName?: string;
  placeholder?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

// ============================================================================
// Tester State
// ============================================================================

/**
 * Complete state of the chatbot tester
 */
export interface TesterState {
  // Connection
  connectionStatus: ConnectionStatus;

  // Session info
  sessionId: string | null;
  chatbotId: string | null;
  selectedUserId: string | null;

  // Test status
  status: TestSessionStatus;

  // Messages
  messages: TestMessage[];

  // Variables
  variables: Record<string, unknown>;

  // Logs
  logs: LogEntry[];

  // Current execution state
  currentNodeId: string | null;
  currentNodeType: string | null;
  executedNodeIds: string[];

  // UI state
  isTyping: boolean;
  error: string | null;

  // Waiting input state
  waitingInputType: WaitingInputType;
  waitingInputOptions?: WaitingInputOptions;

  // Metadata
  startedAt?: string;
  endedAt?: string;
}

// ============================================================================
// Action Types
// ============================================================================

/**
 * All possible actions for the tester reducer
 */
export type TesterAction =
  // Connection actions
  | { type: 'CONNECT_START' }
  | { type: 'CONNECT_SUCCESS'; payload: { sessionId: string } }
  | { type: 'CONNECT_ERROR'; payload: { error: string } }
  | { type: 'DISCONNECT' }

  // Session actions
  | { type: 'SET_CHATBOT'; payload: { chatbotId: string } }
  | { type: 'SET_USER'; payload: { userId: string } }
  | { type: 'START_TEST' }
  | { type: 'PAUSE_TEST' }
  | { type: 'RESUME_TEST' }
  | { type: 'STOP_TEST' }
  | { type: 'RESET_TEST' }
  | { type: 'COMPLETE_TEST' }

  // Message actions
  | { type: 'ADD_MESSAGE'; payload: { message: TestMessage } }
  | { type: 'UPDATE_MESSAGE_STATUS'; payload: { messageId: string; status: TestMessage['status'] } }
  | { type: 'CLEAR_MESSAGES' }

  // Variable actions
  | { type: 'SET_VARIABLE'; payload: { key: string; value: unknown } }
  | { type: 'SET_VARIABLES'; payload: { variables: Record<string, unknown> } }
  | { type: 'CLEAR_VARIABLES' }

  // Log actions
  | { type: 'ADD_LOG'; payload: { log: Omit<LogEntry, 'id' | 'timestamp'> } }
  | { type: 'CLEAR_LOGS' }

  // Node execution actions
  | { type: 'SET_CURRENT_NODE'; payload: { nodeId: string; nodeType: string } }
  | { type: 'ADD_EXECUTED_NODE'; payload: { nodeId: string } }
  | { type: 'CLEAR_EXECUTED_NODES' }

  // Input waiting actions
  | { type: 'SET_WAITING_INPUT'; payload: { type: WaitingInputType; options?: WaitingInputOptions } }
  | { type: 'CLEAR_WAITING_INPUT' }

  // UI actions
  | { type: 'SET_TYPING'; payload: { isTyping: boolean } }
  | { type: 'SET_ERROR'; payload: { error: string | null } }
  | { type: 'CLEAR_ERROR' };

// ============================================================================
// Context Types
// ============================================================================

/**
 * Action creators interface for convenience functions
 */
export interface TesterActionCreators {
  // Connection
  connect: () => void;
  disconnect: () => void;

  // Session
  setChatbot: (chatbotId: string) => void;
  setUser: (userId: string) => void;
  startTest: () => void;
  pauseTest: () => void;
  resumeTest: () => void;
  stopTest: () => void;
  resetTest: () => void;

  // Messages
  sendTextMessage: (text: string) => void;
  selectButton: (buttonId: string, buttonTitle: string) => void;
  selectListItem: (itemId: string, itemTitle: string) => void;
  completeFlow: (flowId: string, data?: Record<string, unknown>) => void;

  // Logs
  addSystemLog: (message: string, data?: Record<string, unknown>) => void;
  addErrorLog: (message: string, data?: Record<string, unknown>) => void;
  addWarningLog: (message: string, data?: Record<string, unknown>) => void;
}

/**
 * Complete context value including state and actions
 */
export interface TesterContextValue {
  state: TesterState;
  dispatch: React.Dispatch<TesterAction>;
  actions: TesterActionCreators;
}

// ============================================================================
// Initial State
// ============================================================================

/**
 * Initial state for the tester
 */
export const initialTesterState: TesterState = {
  connectionStatus: 'disconnected',
  sessionId: null,
  chatbotId: null,
  selectedUserId: null,
  status: 'idle',
  messages: [],
  variables: {},
  logs: [],
  currentNodeId: null,
  currentNodeType: null,
  executedNodeIds: [],
  isTyping: false,
  error: null,
  waitingInputType: null,
  waitingInputOptions: undefined,
  startedAt: undefined,
  endedAt: undefined,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique ID for messages and logs
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a test message
 */
export function createTestMessage(
  type: MessageType,
  content: TestMessage['content'],
  isFromBot: boolean,
  nodeId?: string,
  nodeName?: string
): TestMessage {
  return {
    id: generateId('msg'),
    type,
    content,
    isFromBot,
    timestamp: new Date().toISOString(),
    nodeId,
    nodeName,
    status: isFromBot ? 'delivered' : 'sending',
  };
}

/**
 * Create a log entry
 */
export function createLogEntry(
  type: LogEntryType,
  message: string,
  data?: Record<string, unknown>,
  nodeId?: string,
  nodeName?: string
): LogEntry {
  return {
    id: generateId('log'),
    type,
    timestamp: new Date(),
    message,
    data,
    nodeId,
    nodeName,
  };
}

/**
 * Check if the tester is in a state where user input is allowed
 */
export function canAcceptInput(state: TesterState): boolean {
  return (
    state.status === 'waiting_input' ||
    state.status === 'waiting_flow'
  ) && state.connectionStatus === 'connected';
}

/**
 * Check if the test can be started
 */
export function canStartTest(state: TesterState): boolean {
  return (
    state.status === 'idle' ||
    state.status === 'completed' ||
    state.status === 'stopped' ||
    state.status === 'error'
  ) && state.chatbotId !== null;
}

/**
 * Check if the test can be stopped
 */
export function canStopTest(state: TesterState): boolean {
  return (
    state.status === 'running' ||
    state.status === 'waiting_input' ||
    state.status === 'waiting_flow' ||
    state.status === 'paused'
  );
}
