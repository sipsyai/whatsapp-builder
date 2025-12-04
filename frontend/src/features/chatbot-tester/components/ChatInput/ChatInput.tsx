/**
 * ChatInput Component
 *
 * Main input container for the chatbot tester.
 * Renders the appropriate input type based on waitingInputType state.
 *
 * Input Types:
 * - text: Standard text input
 * - button: Button selection
 * - list: List selection
 * - flow: WhatsApp Flow JSON input
 */

import React, { useMemo } from 'react';
import { useTesterState, useTesterActions } from '../../context/TesterContext';
import { TextInput } from './TextInput';
import { ButtonResponseInput } from './ButtonResponseInput';
import { ListResponseInput } from './ListResponseInput';
import { FlowResponseInput } from './FlowResponseInput';

// ============================================================================
// Component
// ============================================================================

export const ChatInput: React.FC = () => {
  const state = useTesterState();
  const actions = useTesterActions();

  const {
    status,
    waitingInputType,
    waitingInputOptions,
    connectionStatus,
    isTyping,
  } = state;

  /**
   * Determine if input should be disabled
   */
  const isDisabled = useMemo(() => {
    return (
      status === 'paused' ||
      status === 'completed' ||
      status === 'stopped' ||
      status === 'error' ||
      status === 'idle' ||
      connectionStatus !== 'connected' ||
      isTyping
    );
  }, [status, connectionStatus, isTyping]);

  /**
   * Get status message for disabled state
   */
  const statusMessage = useMemo(() => {
    if (connectionStatus !== 'connected') {
      return { icon: 'warning', text: 'Not connected', color: 'text-yellow-500' };
    }
    if (status === 'paused') {
      return { icon: 'pause', text: 'Test paused', color: 'text-yellow-500' };
    }
    if (status === 'completed') {
      return { icon: 'check_circle', text: 'Test completed', color: 'text-green-500' };
    }
    if (status === 'stopped') {
      return { icon: 'error', text: 'Test stopped', color: 'text-gray-500' };
    }
    if (status === 'error') {
      return { icon: 'error', text: 'Error occurred', color: 'text-red-500' };
    }
    if (status === 'idle') {
      return { icon: 'info', text: 'Start a test to begin', color: 'text-gray-500' };
    }
    if (isTyping) {
      return { icon: null, text: 'Bot is typing...', color: 'text-gray-500' };
    }
    return null;
  }, [status, connectionStatus, isTyping]);

  /**
   * Render the appropriate input based on waitingInputType
   */
  const renderInput = () => {
    // Show status message when disabled
    if (statusMessage && isDisabled) {
      return (
        <div className="flex items-center justify-center gap-2 py-4">
          {statusMessage.icon && (
            <span className={`material-symbols-outlined text-xl ${statusMessage.color}`}>
              {statusMessage.icon}
            </span>
          )}
          <span className={`text-sm ${statusMessage.color}`}>
            {statusMessage.text}
          </span>
        </div>
      );
    }

    // Render based on waitingInputType
    switch (waitingInputType) {
      case 'button':
        if (waitingInputOptions?.buttons) {
          return (
            <ButtonResponseInput
              buttons={waitingInputOptions.buttons}
              onSelect={actions.selectButton}
              disabled={isDisabled}
            />
          );
        }
        break;

      case 'list':
        if (waitingInputOptions?.sections) {
          return (
            <ListResponseInput
              sections={waitingInputOptions.sections}
              listButtonText={waitingInputOptions.listButtonText}
              onSelect={actions.selectListItem}
              disabled={isDisabled}
            />
          );
        }
        break;

      case 'flow':
        return (
          <FlowResponseInput
            flowId={waitingInputOptions?.flowId}
            flowName={waitingInputOptions?.flowName}
            onComplete={actions.completeFlow}
            disabled={isDisabled}
          />
        );

      case 'text':
      default:
        return (
          <TextInput
            onSend={actions.sendTextMessage}
            disabled={isDisabled}
            placeholder={waitingInputOptions?.placeholder || 'Type a message...'}
            validation={waitingInputOptions?.validation}
          />
        );
    }

    // Fallback to text input
    return (
      <TextInput
        onSend={actions.sendTextMessage}
        disabled={isDisabled}
        placeholder={waitingInputOptions?.placeholder || 'Type a message...'}
        validation={waitingInputOptions?.validation}
      />
    );
  };

  return (
    <div
      className="
        sticky bottom-0
        w-full
        bg-gray-100 dark:bg-gray-900
        border-t border-gray-200 dark:border-gray-700
        px-4 py-3
        shadow-lg
      "
      role="form"
      aria-label="Chat input"
    >
      {/* Typing Indicator */}
      {isTyping && !isDisabled && (
        <div className="flex items-center gap-2 mb-2 px-2">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Bot is typing...
          </span>
        </div>
      )}

      {/* Input Area */}
      {renderInput()}
    </div>
  );
};

export default ChatInput;
