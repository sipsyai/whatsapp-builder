import { useCallback, useReducer } from 'react';
import type {
    TestMessage,
    NodeExecutionResult,
    TestSessionState,
} from '../types';
import { useTesterSocket } from './useTesterSocket';
import type { UseTesterSocketOptions } from './useTesterSocket';

// Action types for reducer
type TesterAction =
    | { type: 'RESET' }
    | { type: 'SET_CONNECTING' }
    | { type: 'SET_CONNECTED'; sessionId: string; chatbotId: string }
    | { type: 'SET_DISCONNECTED' }
    | { type: 'ADD_MESSAGE'; message: TestMessage }
    | { type: 'ADD_NODE_EXECUTION'; result: NodeExecutionResult }
    | { type: 'UPDATE_VARIABLES'; variables: Record<string, unknown> }
    | {
          type: 'SET_WAITING_INPUT';
          inputType: 'text' | 'button' | 'list' | 'location' | 'media';
          options?: TestSessionState['waitingInput'];
      }
    | { type: 'CLEAR_WAITING_INPUT' }
    | {
          type: 'SET_COMPLETED';
          reason: string;
          summary: TestSessionState['summary'];
      }
    | { type: 'SET_ERROR'; error: string };

// Initial state
const initialState: TestSessionState = {
    sessionId: null,
    chatbotId: null,
    status: 'idle',
    messages: [],
    variables: {},
    executedNodes: [],
    currentNodeId: null,
    waitingInput: undefined,
    error: null,
    completionReason: undefined,
    summary: undefined,
};

// Reducer function
function testerReducer(state: TestSessionState, action: TesterAction): TestSessionState {
    switch (action.type) {
        case 'RESET':
            return initialState;

        case 'SET_CONNECTING':
            return {
                ...state,
                status: 'connecting',
                error: null,
            };

        case 'SET_CONNECTED':
            return {
                ...state,
                sessionId: action.sessionId,
                chatbotId: action.chatbotId,
                status: 'active',
                error: null,
            };

        case 'SET_DISCONNECTED':
            return {
                ...state,
                status: 'idle',
            };

        case 'ADD_MESSAGE':
            return {
                ...state,
                messages: [...state.messages, action.message],
                // Clear waiting input when user sends a message
                waitingInput: !action.message.isFromBot ? undefined : state.waitingInput,
                status: !action.message.isFromBot ? 'active' : state.status,
            };

        case 'ADD_NODE_EXECUTION':
            return {
                ...state,
                executedNodes: [...state.executedNodes, action.result],
                currentNodeId: action.result.nodeId,
            };

        case 'UPDATE_VARIABLES':
            return {
                ...state,
                variables: { ...state.variables, ...action.variables },
            };

        case 'SET_WAITING_INPUT':
            return {
                ...state,
                status: 'waiting-input',
                waitingInput: {
                    type: action.inputType,
                    options: action.options?.options,
                },
            };

        case 'CLEAR_WAITING_INPUT':
            return {
                ...state,
                status: 'active',
                waitingInput: undefined,
            };

        case 'SET_COMPLETED':
            return {
                ...state,
                status: 'completed',
                completionReason: action.reason,
                summary: action.summary,
                waitingInput: undefined,
            };

        case 'SET_ERROR':
            return {
                ...state,
                status: 'error',
                error: action.error,
            };

        default:
            return state;
    }
}

export interface UseTesterSocketEventsOptions {
    /** Called when session starts */
    onSessionStart?: (sessionId: string) => void;
    /** Called when session ends */
    onSessionEnd?: (reason: string) => void;
    /** Called when an error occurs */
    onError?: (error: string) => void;
}

export interface UseTesterSocketEventsReturn {
    /** Current session state */
    state: TestSessionState;
    /** Dispatch function for manual state updates */
    dispatch: React.Dispatch<TesterAction>;
    /** Socket connection status */
    isConnected: boolean;
    /** Start a new test session */
    startSession: (sessionId: string) => void;
    /** End the current test session */
    endSession: () => void;
    /** Send a text message */
    sendTextMessage: (text: string) => void;
    /** Send a button click response */
    sendButtonResponse: (buttonId: string) => void;
    /** Send a list selection response */
    sendListResponse: (rowId: string) => void;
    /** Reset the session state */
    reset: () => void;
}

export function useTesterSocketEvents(
    options: UseTesterSocketEventsOptions = {}
): UseTesterSocketEventsReturn {
    const [state, dispatch] = useReducer(testerReducer, initialState);

    // Socket event handlers that dispatch to reducer
    const socketOptions: UseTesterSocketOptions = {
        onStarted: useCallback((sessionId: string, chatbotId: string) => {
            dispatch({ type: 'SET_CONNECTED', sessionId, chatbotId });
            options.onSessionStart?.(sessionId);
        }, [options]),

        onMessage: useCallback((message: TestMessage) => {
            dispatch({ type: 'ADD_MESSAGE', message });
        }, []),

        onNodeExecuted: useCallback((_nodeId: string, result: NodeExecutionResult) => {
            dispatch({ type: 'ADD_NODE_EXECUTION', result });
        }, []),

        onVariablesUpdated: useCallback((variables: Record<string, unknown>) => {
            dispatch({ type: 'UPDATE_VARIABLES', variables });
        }, []),

        onWaitingInput: useCallback((
            inputType: 'text' | 'button' | 'list' | 'location' | 'media',
            inputOptions?: {
                buttons?: Array<{ id: string; title: string }>;
                listSections?: Array<{
                    title: string;
                    rows: Array<{ id: string; title: string; description?: string }>;
                }>;
            }
        ) => {
            dispatch({
                type: 'SET_WAITING_INPUT',
                inputType,
                options: inputOptions ? { type: inputType, options: inputOptions } : undefined,
            });
        }, []),

        onCompleted: useCallback((
            reason: 'flow-ended' | 'user-ended' | 'timeout' | 'error',
            summary: {
                totalNodes: number;
                executedNodes: number;
                totalMessages: number;
                duration: number;
            }
        ) => {
            dispatch({ type: 'SET_COMPLETED', reason, summary });
            options.onSessionEnd?.(reason);
        }, [options]),

        onError: useCallback((error: string) => {
            dispatch({ type: 'SET_ERROR', error });
            options.onError?.(error);
        }, [options]),

        onConnectionChange: useCallback((connected: boolean) => {
            if (!connected && state.status === 'active') {
                dispatch({ type: 'SET_DISCONNECTED' });
            }
        }, [state.status]),
    };

    const {
        isConnected,
        connect,
        disconnect,
        joinSession,
        leaveSession,
        sendMessage,
        currentSessionId,
    } = useTesterSocket(socketOptions);

    // High-level actions
    const startSession = useCallback((sessionId: string) => {
        dispatch({ type: 'RESET' });
        dispatch({ type: 'SET_CONNECTING' });
        connect();
        joinSession(sessionId);
    }, [connect, joinSession]);

    const endSession = useCallback(() => {
        if (currentSessionId) {
            leaveSession(currentSessionId);
        }
        disconnect();
        dispatch({ type: 'SET_DISCONNECTED' });
    }, [currentSessionId, leaveSession, disconnect]);

    const sendTextMessage = useCallback((text: string) => {
        if (!currentSessionId) return;

        // Optimistically add user message
        const userMessage: TestMessage = {
            id: `msg-${Date.now()}`,
            isFromBot: false,
            type: 'text',
            content: text,
            timestamp: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_MESSAGE', message: userMessage });
        dispatch({ type: 'CLEAR_WAITING_INPUT' });

        sendMessage(currentSessionId, text);
    }, [currentSessionId, sendMessage]);

    const sendButtonResponse = useCallback((buttonId: string) => {
        if (!currentSessionId) return;

        // Find button title from waiting input options
        const buttonTitle = state.waitingInput?.options?.buttons?.find(
            b => b.id === buttonId
        )?.title || buttonId;

        // Optimistically add user message
        const userMessage: TestMessage = {
            id: `msg-${Date.now()}`,
            isFromBot: false,
            type: 'interactive',
            content: buttonTitle,
            timestamp: new Date().toISOString(),
            nodeId: buttonId,
        };
        dispatch({ type: 'ADD_MESSAGE', message: userMessage });
        dispatch({ type: 'CLEAR_WAITING_INPUT' });

        sendMessage(currentSessionId, buttonTitle, buttonId);
    }, [currentSessionId, sendMessage, state.waitingInput]);

    const sendListResponse = useCallback((rowId: string) => {
        if (!currentSessionId) return;

        // Find row title from waiting input options
        let rowTitle = rowId;
        state.waitingInput?.options?.listSections?.forEach(section => {
            const row = section.rows.find(r => r.id === rowId);
            if (row) {
                rowTitle = row.title;
            }
        });

        // Optimistically add user message
        const userMessage: TestMessage = {
            id: `msg-${Date.now()}`,
            isFromBot: false,
            type: 'interactive',
            content: rowTitle,
            timestamp: new Date().toISOString(),
            nodeId: rowId,
        };
        dispatch({ type: 'ADD_MESSAGE', message: userMessage });
        dispatch({ type: 'CLEAR_WAITING_INPUT' });

        sendMessage(currentSessionId, rowTitle, undefined, rowId);
    }, [currentSessionId, sendMessage, state.waitingInput]);

    const reset = useCallback(() => {
        if (currentSessionId) {
            leaveSession(currentSessionId);
        }
        dispatch({ type: 'RESET' });
    }, [currentSessionId, leaveSession]);

    return {
        state,
        dispatch,
        isConnected,
        startSession,
        endSession,
        sendTextMessage,
        sendButtonResponse,
        sendListResponse,
        reset,
    };
}
