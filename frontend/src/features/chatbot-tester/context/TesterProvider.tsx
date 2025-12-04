/**
 * Tester Provider
 *
 * Provider component that wraps the application with Tester context.
 * Includes memoized action creators for optimal performance.
 */

import React, { useReducer, useMemo, useCallback } from 'react';
import { TesterContext, testerReducer } from './TesterContext';
import {
  initialTesterState,
  createTestMessage,
  type TesterState,
  type TesterContextValue,
  type TesterActionCreators,
  type WaitingInputType,
  type WaitingInputOptions,
} from '../types/tester.types';

// ============================================================================
// Provider Props
// ============================================================================

interface TesterProviderProps {
  children: React.ReactNode;
  /**
   * Optional initial state override (useful for testing)
   */
  initialState?: Partial<TesterState>;
  /**
   * Optional chatbot ID to initialize with
   */
  chatbotId?: string;
}

// ============================================================================
// Provider Component
// ============================================================================

/**
 * TesterProvider - provides state and actions to the component tree
 */
export const TesterProvider: React.FC<TesterProviderProps> = ({
  children,
  initialState,
  chatbotId,
}) => {
  // Merge initial state with any overrides
  const mergedInitialState: TesterState = useMemo(
    () => ({
      ...initialTesterState,
      ...initialState,
      chatbotId: chatbotId ?? initialState?.chatbotId ?? null,
    }),
    // Only compute on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [state, dispatch] = useReducer(testerReducer, mergedInitialState);

  // ========================================
  // Action Creators
  // ========================================

  /**
   * Connect to the test server
   */
  const connect = useCallback(() => {
    dispatch({ type: 'CONNECT_START' });
    // Note: Actual WebSocket connection logic will be handled by a separate hook
  }, []);

  /**
   * Disconnect from the test server
   */
  const disconnect = useCallback(() => {
    dispatch({ type: 'DISCONNECT' });
  }, []);

  /**
   * Set the chatbot to test
   */
  const setChatbot = useCallback((chatbotId: string) => {
    dispatch({ type: 'SET_CHATBOT', payload: { chatbotId } });
  }, []);

  /**
   * Set the user for the test session
   */
  const setUser = useCallback((userId: string) => {
    dispatch({ type: 'SET_USER', payload: { userId } });
  }, []);

  /**
   * Start the test
   */
  const startTest = useCallback(() => {
    dispatch({ type: 'START_TEST' });
  }, []);

  /**
   * Pause the test
   */
  const pauseTest = useCallback(() => {
    dispatch({ type: 'PAUSE_TEST' });
  }, []);

  /**
   * Resume the test
   */
  const resumeTest = useCallback(() => {
    dispatch({ type: 'RESUME_TEST' });
  }, []);

  /**
   * Stop the test
   */
  const stopTest = useCallback(() => {
    dispatch({ type: 'STOP_TEST' });
  }, []);

  /**
   * Reset the test
   */
  const resetTest = useCallback(() => {
    dispatch({ type: 'RESET_TEST' });
  }, []);

  /**
   * Send a text message from the user
   */
  const sendTextMessage = useCallback((text: string) => {
    const message = createTestMessage('text', text, false);
    dispatch({ type: 'ADD_MESSAGE', payload: { message } });
    dispatch({ type: 'CLEAR_WAITING_INPUT' });
    dispatch({
      type: 'ADD_LOG',
      payload: {
        log: {
          type: 'message',
          message: `User sent: "${text}"`,
        },
      },
    });
  }, []);

  /**
   * Select a button from an interactive message
   */
  const selectButton = useCallback((buttonId: string, buttonTitle: string) => {
    const message = createTestMessage('text', buttonTitle, false);
    dispatch({ type: 'ADD_MESSAGE', payload: { message } });
    dispatch({ type: 'CLEAR_WAITING_INPUT' });
    dispatch({
      type: 'ADD_LOG',
      payload: {
        log: {
          type: 'message',
          message: `User selected button: "${buttonTitle}" (${buttonId})`,
        },
      },
    });
  }, []);

  /**
   * Select an item from an interactive list
   */
  const selectListItem = useCallback((itemId: string, itemTitle: string) => {
    const message = createTestMessage('text', itemTitle, false);
    dispatch({ type: 'ADD_MESSAGE', payload: { message } });
    dispatch({ type: 'CLEAR_WAITING_INPUT' });
    dispatch({
      type: 'ADD_LOG',
      payload: {
        log: {
          type: 'message',
          message: `User selected list item: "${itemTitle}" (${itemId})`,
        },
      },
    });
  }, []);

  /**
   * Complete a WhatsApp Flow
   */
  const completeFlow = useCallback(
    (flowId: string, data?: Record<string, unknown>) => {
      dispatch({ type: 'CLEAR_WAITING_INPUT' });
      dispatch({
        type: 'ADD_LOG',
        payload: {
          log: {
            type: 'message',
            message: `User completed flow: ${flowId}`,
            data,
          },
        },
      });
      if (data) {
        dispatch({ type: 'SET_VARIABLES', payload: { variables: data } });
      }
    },
    []
  );

  /**
   * Add a system log entry
   */
  const addSystemLog = useCallback(
    (message: string, data?: Record<string, unknown>) => {
      dispatch({
        type: 'ADD_LOG',
        payload: {
          log: { type: 'system', message, data },
        },
      });
    },
    []
  );

  /**
   * Add an error log entry
   */
  const addErrorLog = useCallback(
    (message: string, data?: Record<string, unknown>) => {
      dispatch({
        type: 'ADD_LOG',
        payload: {
          log: { type: 'error', message, data },
        },
      });
    },
    []
  );

  /**
   * Add a warning log entry
   */
  const addWarningLog = useCallback(
    (message: string, data?: Record<string, unknown>) => {
      dispatch({
        type: 'ADD_LOG',
        payload: {
          log: { type: 'warning', message, data },
        },
      });
    },
    []
  );

  // ========================================
  // Memoized Action Creators Object
  // ========================================

  const actions: TesterActionCreators = useMemo(
    () => ({
      connect,
      disconnect,
      setChatbot,
      setUser,
      startTest,
      pauseTest,
      resumeTest,
      stopTest,
      resetTest,
      sendTextMessage,
      selectButton,
      selectListItem,
      completeFlow,
      addSystemLog,
      addErrorLog,
      addWarningLog,
    }),
    [
      connect,
      disconnect,
      setChatbot,
      setUser,
      startTest,
      pauseTest,
      resumeTest,
      stopTest,
      resetTest,
      sendTextMessage,
      selectButton,
      selectListItem,
      completeFlow,
      addSystemLog,
      addErrorLog,
      addWarningLog,
    ]
  );

  // ========================================
  // Context Value
  // ========================================

  const contextValue: TesterContextValue = useMemo(
    () => ({
      state,
      dispatch,
      actions,
    }),
    [state, actions]
  );

  return (
    <TesterContext.Provider value={contextValue}>
      {children}
    </TesterContext.Provider>
  );
};

// ============================================================================
// Additional Action Dispatch Helpers
// ============================================================================

/**
 * Helper hook for dispatching common actions with additional parameters
 * Use this when you need more control over dispatching actions
 */
export function useTesterDispatchHelpers() {
  const { dispatch } = React.useContext(TesterContext)!;

  const addBotMessage = useCallback(
    (
      content: string,
      nodeId?: string,
      nodeName?: string
    ) => {
      const message = createTestMessage('text', content, true, nodeId, nodeName);
      dispatch({ type: 'ADD_MESSAGE', payload: { message } });
    },
    [dispatch]
  );

  const addInteractiveMessage = useCallback(
    (
      content: {
        type: 'buttons' | 'list';
        header?: string;
        body: string;
        footer?: string;
        buttons?: Array<{ id: string; title: string }>;
        listButtonText?: string;
        sections?: Array<{
          title: string;
          rows: Array<{ id: string; title: string; description?: string }>;
        }>;
      },
      nodeId?: string,
      nodeName?: string
    ) => {
      const message = createTestMessage('interactive', content, true, nodeId, nodeName);
      dispatch({ type: 'ADD_MESSAGE', payload: { message } });
    },
    [dispatch]
  );

  const addFlowMessage = useCallback(
    (
      content: {
        flowId: string;
        flowName?: string;
        headerText?: string;
        bodyText: string;
        footerText?: string;
        ctaText: string;
      },
      nodeId?: string,
      nodeName?: string
    ) => {
      const message = createTestMessage('flow', content, true, nodeId, nodeName);
      dispatch({ type: 'ADD_MESSAGE', payload: { message } });
    },
    [dispatch]
  );

  const setWaitingForInput = useCallback(
    (type: WaitingInputType, options?: WaitingInputOptions) => {
      dispatch({ type: 'SET_WAITING_INPUT', payload: { type, options } });
    },
    [dispatch]
  );

  const setCurrentNode = useCallback(
    (nodeId: string, nodeType: string) => {
      dispatch({ type: 'SET_CURRENT_NODE', payload: { nodeId, nodeType } });
      dispatch({ type: 'ADD_EXECUTED_NODE', payload: { nodeId } });
    },
    [dispatch]
  );

  const setVariable = useCallback(
    (key: string, value: unknown) => {
      dispatch({ type: 'SET_VARIABLE', payload: { key, value } });
    },
    [dispatch]
  );

  const completeTest = useCallback(() => {
    dispatch({ type: 'COMPLETE_TEST' });
  }, [dispatch]);

  const setError = useCallback(
    (error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: { error } });
    },
    [dispatch]
  );

  const setTyping = useCallback(
    (isTyping: boolean) => {
      dispatch({ type: 'SET_TYPING', payload: { isTyping } });
    },
    [dispatch]
  );

  return {
    addBotMessage,
    addInteractiveMessage,
    addFlowMessage,
    setWaitingForInput,
    setCurrentNode,
    setVariable,
    completeTest,
    setError,
    setTyping,
  };
}

// ============================================================================
// Default Export
// ============================================================================

export default TesterProvider;
