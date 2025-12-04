/**
 * Chatbot Tester Context - Public API
 *
 * Exports all context-related types, components, and hooks
 * for the Chatbot Tester feature.
 */

// ============================================================================
// Context & Provider
// ============================================================================

export { TesterContext, testerReducer, useTesterContext, useTesterState, useTesterDispatch, useTesterActions } from './TesterContext';
export { TesterProvider, useTesterDispatchHelpers } from './TesterProvider';
export { default } from './TesterProvider';

// ============================================================================
// Types
// ============================================================================

export type {
  // State types
  TesterState,
  TestSessionStatus,
  ConnectionStatus,

  // Message types
  TestMessage,
  MessageType,
  InteractiveButton,
  InteractiveListRow,
  InteractiveListSection,
  InteractiveContent,
  FlowContent,

  // Log types
  LogEntry,
  LogEntryType,

  // Input types
  WaitingInputType,
  WaitingInputOptions,

  // Action types
  TesterAction,
  TesterActionCreators,
  TesterContextValue,
} from '../types/tester.types';

// ============================================================================
// Constants & Helpers
// ============================================================================

export {
  initialTesterState,
  generateId,
  createTestMessage,
  createLogEntry,
  canAcceptInput,
  canStartTest,
  canStopTest,
} from '../types/tester.types';
