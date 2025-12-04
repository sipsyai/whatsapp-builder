/**
 * ButtonResponseInput Component
 *
 * Renders interactive buttons for WhatsApp button responses.
 * Used when waitingInputType is 'button'.
 */

import React, { useCallback } from 'react';
import type { InteractiveButton } from '../../types/tester.types';

// ============================================================================
// Types
// ============================================================================

interface ButtonResponseInputProps {
  /**
   * List of buttons to display
   */
  buttons: InteractiveButton[];
  /**
   * Callback when a button is selected
   */
  onSelect: (buttonId: string, buttonTitle: string) => void;
  /**
   * Whether the buttons are disabled
   */
  disabled?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const ButtonResponseInput: React.FC<ButtonResponseInputProps> = ({
  buttons,
  onSelect,
  disabled = false,
}) => {
  /**
   * Handle button click
   */
  const handleClick = useCallback(
    (button: InteractiveButton) => {
      if (disabled) return;

      // Handle URL buttons differently
      if (button.type === 'url' && button.url) {
        window.open(button.url, '_blank', 'noopener,noreferrer');
        return;
      }

      onSelect(button.id, button.title);
    },
    [onSelect, disabled]
  );

  if (!buttons || buttons.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 px-2">
      {/* Header */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Select a response
      </p>

      {/* Button List */}
      <div className="flex flex-wrap gap-2 justify-center">
        {buttons.map((button) => (
          <button
            key={button.id}
            onClick={() => handleClick(button)}
            disabled={disabled}
            className={`
              px-4 py-2.5
              min-w-[100px] max-w-[200px]
              rounded-full
              text-sm font-medium
              border-2 border-green-500
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
              ${disabled
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 border-gray-300 cursor-not-allowed'
                : 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white cursor-pointer'
              }
            `}
            aria-label={`Select ${button.title}`}
          >
            {/* URL indicator */}
            {button.type === 'url' && (
              <span className="mr-1.5 inline-block">
                <svg
                  className="w-3.5 h-3.5 inline-block"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </span>
            )}
            {button.title}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ButtonResponseInput;
