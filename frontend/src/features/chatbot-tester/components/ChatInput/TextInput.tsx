/**
 * TextInput Component
 *
 * WhatsApp-style text input with send button.
 * Handles Enter keypress for message submission.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

interface TextInputProps {
  /**
   * Callback when user sends a message
   */
  onSend: (text: string) => void;
  /**
   * Whether the input is disabled
   */
  disabled?: boolean;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Validation options
   */
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

// ============================================================================
// Component
// ============================================================================

export const TextInput: React.FC<TextInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
  validation,
}) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  /**
   * Validate input value
   */
  const validateInput = useCallback(
    (text: string): boolean => {
      if (!validation) return true;

      if (validation.minLength && text.length < validation.minLength) {
        setError(`Minimum ${validation.minLength} characters required`);
        return false;
      }

      if (validation.maxLength && text.length > validation.maxLength) {
        setError(`Maximum ${validation.maxLength} characters allowed`);
        return false;
      }

      if (validation.pattern) {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(text)) {
          setError('Invalid format');
          return false;
        }
      }

      setError(null);
      return true;
    },
    [validation]
  );

  /**
   * Handle input change
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      // Check max length while typing
      if (validation?.maxLength && newValue.length > validation.maxLength) {
        return;
      }

      setValue(newValue);

      // Clear error while typing
      if (error) {
        setError(null);
      }
    },
    [error, validation?.maxLength]
  );

  /**
   * Handle send action
   */
  const handleSend = useCallback(() => {
    const trimmedValue = value.trim();

    if (!trimmedValue) return;

    if (!validateInput(trimmedValue)) return;

    onSend(trimmedValue);
    setValue('');
    setError(null);
  }, [value, onSend, validateInput]);

  /**
   * Handle keypress (Enter to send)
   */
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {/* Input Field */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            placeholder={placeholder}
            className={`
              w-full px-4 py-3
              bg-white dark:bg-gray-800
              border rounded-full
              text-sm text-gray-900 dark:text-gray-100
              placeholder-gray-500 dark:placeholder-gray-400
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
              disabled:bg-gray-100 dark:disabled:bg-gray-700
              disabled:cursor-not-allowed disabled:opacity-60
              ${error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600'
              }
            `}
            aria-label="Message input"
            aria-invalid={!!error}
            aria-describedby={error ? 'input-error' : undefined}
          />

          {/* Character count for maxLength */}
          {validation?.maxLength && value.length > 0 && (
            <span className="absolute right-12 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {value.length}/{validation.maxLength}
            </span>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`
            flex items-center justify-center
            w-11 h-11 rounded-full
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
            ${canSend
              ? 'bg-green-500 hover:bg-green-600 text-white cursor-pointer'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }
          `}
          aria-label="Send message"
        >
          <span className="material-symbols-outlined text-xl">send</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <p
          id="input-error"
          className="text-xs text-red-500 px-4"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default TextInput;
