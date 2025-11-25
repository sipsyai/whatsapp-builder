/**
 * Flow History Hook
 *
 * Generic hook for managing undo/redo history with a maximum history limit.
 * Implements the classic command pattern for state management.
 */

import { useState, useCallback } from 'react';

/**
 * Internal history state structure
 */
interface HistoryState<T> {
  past: T[]; // Previous states (undo stack)
  present: T; // Current state
  future: T[]; // Future states (redo stack)
}

/**
 * Return type for the useFlowHistory hook
 */
export interface UseFlowHistoryReturn<T> {
  state: T; // Current state
  push: (newState: T) => void; // Add new state to history
  undo: () => void; // Move backward in history
  redo: () => void; // Move forward in history
  clear: () => void; // Clear all history
  setPresent: (state: T) => void; // Update present without affecting history
  canUndo: boolean; // Whether undo is available
  canRedo: boolean; // Whether redo is available
  historySize: number; // Number of items in undo stack
}

/**
 * Hook for managing undo/redo history
 *
 * @param initialState - Initial state value
 * @param maxHistory - Maximum number of history entries to keep (default: 50)
 * @returns History management functions and state
 *
 * @example
 * ```tsx
 * const {
 *   state,
 *   push,
 *   undo,
 *   redo,
 *   canUndo,
 *   canRedo
 * } = useFlowHistory(initialFlowState, 100);
 *
 * // Update state and add to history
 * push(newFlowState);
 *
 * // Undo last change
 * if (canUndo) {
 *   undo();
 * }
 * ```
 */
export const useFlowHistory = <T>(
  initialState: T,
  maxHistory: number = 50
): UseFlowHistoryReturn<T> => {
  // Initialize history state
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  /**
   * Add a new state to history
   * - Current present becomes part of past
   * - New state becomes present
   * - Future is cleared (branching timeline)
   * - Maintains maxHistory limit
   */
  const push = useCallback(
    (newState: T) => {
      setHistory((prev) => {
        // Don't add if state hasn't changed
        if (prev.present === newState) {
          return prev;
        }

        // Add current present to past
        const newPast = [...prev.past, prev.present];

        // Limit history size by removing oldest entries
        if (newPast.length > maxHistory) {
          newPast.shift();
        }

        return {
          past: newPast,
          present: newState,
          future: [], // Clear future on new action (branching)
        };
      });
    },
    [maxHistory]
  );

  /**
   * Undo: Move backward in history
   * - Current present moves to future
   * - Last past entry becomes present
   */
  const undo = useCallback(() => {
    setHistory((prev) => {
      // No history to undo
      if (prev.past.length === 0) {
        return prev;
      }

      // Get the last past entry
      const newPast = [...prev.past];
      const newPresent = newPast.pop()!;

      return {
        past: newPast,
        present: newPresent,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  /**
   * Redo: Move forward in history
   * - Current present moves to past
   * - First future entry becomes present
   */
  const redo = useCallback(() => {
    setHistory((prev) => {
      // No future to redo
      if (prev.future.length === 0) {
        return prev;
      }

      // Get the first future entry
      const newFuture = [...prev.future];
      const newPresent = newFuture.shift()!;

      return {
        past: [...prev.past, prev.present],
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  /**
   * Clear all history
   * - Keeps current present
   * - Clears past and future
   */
  const clear = useCallback(() => {
    setHistory((prev) => ({
      past: [],
      present: prev.present,
      future: [],
    }));
  }, []);

  /**
   * Set present state directly without affecting history
   * Useful for external updates that shouldn't be undoable
   */
  const setPresent = useCallback((state: T) => {
    setHistory((prev) => ({
      ...prev,
      present: state,
    }));
  }, []);

  // Return the hook interface
  return {
    state: history.present,
    push,
    undo,
    redo,
    clear,
    setPresent,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    historySize: history.past.length,
  };
};
