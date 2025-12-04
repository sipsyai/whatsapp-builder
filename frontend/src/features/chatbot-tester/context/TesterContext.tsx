/**
 * Tester Context
 *
 * React Context for the Chatbot Tester state management.
 * Uses useReducer pattern for predictable state updates.
 */

import { createContext, useContext } from 'react';
import type {
  TesterState,
  TesterAction,
  TesterContextValue,
  LogEntry,
} from '../types/tester.types';
import { generateId } from '../types/tester.types';

// ============================================================================
// Context
// ============================================================================

/**
 * Tester Context - provides state and dispatch to the component tree
 */
export const TesterContext = createContext<TesterContextValue | null>(null);

TesterContext.displayName = 'TesterContext';

// ============================================================================
// Reducer
// ============================================================================

/**
 * Tester reducer - handles all state transitions
 */
export function testerReducer(
  state: TesterState,
  action: TesterAction
): TesterState {
  switch (action.type) {
    // ========================================
    // Connection Actions
    // ========================================
    case 'CONNECT_START':
      return {
        ...state,
        connectionStatus: 'connecting',
        error: null,
      };

    case 'CONNECT_SUCCESS':
      return {
        ...state,
        connectionStatus: 'connected',
        sessionId: action.payload.sessionId,
        error: null,
        logs: [
          ...state.logs,
          createLogEntryInternal('system', 'Connected to test server'),
        ],
      };

    case 'CONNECT_ERROR':
      return {
        ...state,
        connectionStatus: 'error',
        error: action.payload.error,
        status: 'error',
        logs: [
          ...state.logs,
          createLogEntryInternal('error', `Connection error: ${action.payload.error}`),
        ],
      };

    case 'DISCONNECT':
      return {
        ...state,
        connectionStatus: 'disconnected',
        sessionId: null,
        status: state.status === 'running' ? 'stopped' : state.status,
        logs: [
          ...state.logs,
          createLogEntryInternal('system', 'Disconnected from test server'),
        ],
      };

    // ========================================
    // Session Actions
    // ========================================
    case 'SET_CHATBOT':
      return {
        ...state,
        chatbotId: action.payload.chatbotId,
      };

    case 'SET_USER':
      return {
        ...state,
        selectedUserId: action.payload.userId,
      };

    case 'START_TEST':
      return {
        ...state,
        status: 'running',
        messages: [],
        variables: {},
        logs: [
          createLogEntryInternal('system', 'Test started'),
        ],
        currentNodeId: null,
        currentNodeType: null,
        executedNodeIds: [],
        error: null,
        waitingInputType: null,
        waitingInputOptions: undefined,
        startedAt: new Date().toISOString(),
        endedAt: undefined,
      };

    case 'PAUSE_TEST':
      return {
        ...state,
        status: 'paused',
        logs: [
          ...state.logs,
          createLogEntryInternal('system', 'Test paused'),
        ],
      };

    case 'RESUME_TEST':
      return {
        ...state,
        status: 'running',
        logs: [
          ...state.logs,
          createLogEntryInternal('system', 'Test resumed'),
        ],
      };

    case 'STOP_TEST':
      return {
        ...state,
        status: 'stopped',
        waitingInputType: null,
        waitingInputOptions: undefined,
        isTyping: false,
        endedAt: new Date().toISOString(),
        logs: [
          ...state.logs,
          createLogEntryInternal('system', 'Test stopped'),
        ],
      };

    case 'RESET_TEST':
      return {
        ...state,
        status: 'idle',
        messages: [],
        variables: {},
        logs: [],
        currentNodeId: null,
        currentNodeType: null,
        executedNodeIds: [],
        error: null,
        waitingInputType: null,
        waitingInputOptions: undefined,
        isTyping: false,
        startedAt: undefined,
        endedAt: undefined,
      };

    case 'COMPLETE_TEST':
      return {
        ...state,
        status: 'completed',
        waitingInputType: null,
        waitingInputOptions: undefined,
        isTyping: false,
        endedAt: new Date().toISOString(),
        logs: [
          ...state.logs,
          createLogEntryInternal('system', 'Test completed'),
        ],
      };

    // ========================================
    // Message Actions
    // ========================================
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload.message],
      };

    case 'UPDATE_MESSAGE_STATUS':
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === action.payload.messageId
            ? { ...msg, status: action.payload.status }
            : msg
        ),
      };

    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
      };

    // ========================================
    // Variable Actions
    // ========================================
    case 'SET_VARIABLE':
      return {
        ...state,
        variables: {
          ...state.variables,
          [action.payload.key]: action.payload.value,
        },
        logs: [
          ...state.logs,
          createLogEntryInternal(
            'variable',
            `Variable set: ${action.payload.key} = ${JSON.stringify(action.payload.value)}`
          ),
        ],
      };

    case 'SET_VARIABLES':
      return {
        ...state,
        variables: {
          ...state.variables,
          ...action.payload.variables,
        },
        logs: [
          ...state.logs,
          createLogEntryInternal(
            'variable',
            `Variables updated: ${Object.keys(action.payload.variables).join(', ')}`
          ),
        ],
      };

    case 'CLEAR_VARIABLES':
      return {
        ...state,
        variables: {},
      };

    // ========================================
    // Log Actions
    // ========================================
    case 'ADD_LOG':
      return {
        ...state,
        logs: [
          ...state.logs,
          {
            id: generateId('log'),
            timestamp: new Date(),
            ...action.payload.log,
          },
        ],
      };

    case 'CLEAR_LOGS':
      return {
        ...state,
        logs: [],
      };

    // ========================================
    // Node Execution Actions
    // ========================================
    case 'SET_CURRENT_NODE':
      return {
        ...state,
        currentNodeId: action.payload.nodeId,
        currentNodeType: action.payload.nodeType,
        logs: [
          ...state.logs,
          createLogEntryInternal(
            'node',
            `Executing node: ${action.payload.nodeType}`,
            undefined,
            action.payload.nodeId
          ),
        ],
      };

    case 'ADD_EXECUTED_NODE':
      return {
        ...state,
        executedNodeIds: state.executedNodeIds.includes(action.payload.nodeId)
          ? state.executedNodeIds
          : [...state.executedNodeIds, action.payload.nodeId],
      };

    case 'CLEAR_EXECUTED_NODES':
      return {
        ...state,
        executedNodeIds: [],
      };

    // ========================================
    // Input Waiting Actions
    // ========================================
    case 'SET_WAITING_INPUT':
      return {
        ...state,
        status: action.payload.type === 'flow' ? 'waiting_flow' : 'waiting_input',
        waitingInputType: action.payload.type,
        waitingInputOptions: action.payload.options,
        isTyping: false,
      };

    case 'CLEAR_WAITING_INPUT':
      return {
        ...state,
        status: 'running',
        waitingInputType: null,
        waitingInputOptions: undefined,
      };

    // ========================================
    // UI Actions
    // ========================================
    case 'SET_TYPING':
      return {
        ...state,
        isTyping: action.payload.isTyping,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload.error,
        status: action.payload.error ? 'error' : state.status,
        logs: action.payload.error
          ? [
              ...state.logs,
              createLogEntryInternal('error', action.payload.error),
            ]
          : state.logs,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Internal helper to create log entries within the reducer
 */
function createLogEntryInternal(
  type: LogEntry['type'],
  message: string,
  data?: Record<string, unknown>,
  nodeId?: string
): LogEntry {
  return {
    id: generateId('log'),
    type,
    timestamp: new Date(),
    message,
    data,
    nodeId,
  };
}

// ============================================================================
// Custom Hook
// ============================================================================

/**
 * Hook to access the Tester context
 * @throws Error if used outside of TesterProvider
 */
export function useTesterContext(): TesterContextValue {
  const context = useContext(TesterContext);

  if (!context) {
    throw new Error(
      'useTesterContext must be used within a TesterProvider. ' +
      'Wrap your component tree with <TesterProvider>.'
    );
  }

  return context;
}

// ============================================================================
// Selector Hooks
// ============================================================================

/**
 * Hook to get only the tester state (for components that don't need dispatch)
 */
export function useTesterState(): TesterState {
  const { state } = useTesterContext();
  return state;
}

/**
 * Hook to get only the dispatch function
 */
export function useTesterDispatch(): React.Dispatch<TesterAction> {
  const { dispatch } = useTesterContext();
  return dispatch;
}

/**
 * Hook to get only the action creators
 */
export function useTesterActions() {
  const { actions } = useTesterContext();
  return actions;
}
