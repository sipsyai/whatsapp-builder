/**
 * FlowResponseInput Component
 *
 * Simple form for submitting WhatsApp Flow data.
 * Used when waitingInputType is 'flow'.
 */

import React, { useState, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

interface FlowResponseInputProps {
  /**
   * Flow ID
   */
  flowId?: string;
  /**
   * Flow name for display
   */
  flowName?: string;
  /**
   * Callback when flow is completed
   */
  onComplete: (flowId: string, data?: Record<string, unknown>) => void;
  /**
   * Whether the input is disabled
   */
  disabled?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const FlowResponseInput: React.FC<FlowResponseInputProps> = ({
  flowId = 'unknown',
  flowName,
  onComplete,
  disabled = false,
}) => {
  const [jsonInput, setJsonInput] = useState('{\n  \n}');
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * Handle JSON input change
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setJsonInput(e.target.value);
      if (error) {
        setError(null);
      }
    },
    [error]
  );

  /**
   * Validate and parse JSON
   */
  const parseJson = useCallback(
    (input: string): Record<string, unknown> | null => {
      const trimmed = input.trim();

      // Allow empty input as empty object
      if (!trimmed || trimmed === '{}' || trimmed === '{\n  \n}') {
        return {};
      }

      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          setError('Input must be a JSON object');
          return null;
        }
        return parsed as Record<string, unknown>;
      } catch (e) {
        setError('Invalid JSON format');
        return null;
      }
    },
    []
  );

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(() => {
    if (disabled) return;

    const data = parseJson(jsonInput);
    if (data === null) return;

    onComplete(flowId, Object.keys(data).length > 0 ? data : undefined);
  }, [jsonInput, flowId, onComplete, disabled, parseJson]);

  /**
   * Handle skip (complete without data)
   */
  const handleSkip = useCallback(() => {
    if (disabled) return;
    onComplete(flowId);
  }, [flowId, onComplete, disabled]);

  return (
    <div className="flex flex-col gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xl text-blue-500">data_object</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            WhatsApp Flow Response
          </span>
        </div>
        {flowName && (
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
            {flowName}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Enter the flow response data as JSON, or skip to continue without data.
      </p>

      {/* JSON Input */}
      <div
        className={`
          relative transition-all duration-200
          ${isExpanded ? 'min-h-[200px]' : 'min-h-[100px]'}
        `}
      >
        <textarea
          value={jsonInput}
          onChange={handleChange}
          onFocus={() => setIsExpanded(true)}
          onBlur={() => setIsExpanded(false)}
          disabled={disabled}
          placeholder='{\n  "field": "value"\n}'
          className={`
            w-full h-full min-h-[inherit]
            px-3 py-2
            font-mono text-sm
            bg-white dark:bg-gray-900
            border rounded-lg
            resize-y
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 dark:disabled:bg-gray-800
            disabled:cursor-not-allowed disabled:opacity-60
            ${error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100'
            }
          `}
          aria-label="Flow response JSON"
          aria-invalid={!!error}
          aria-describedby={error ? 'flow-error' : undefined}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div
          id="flow-error"
          className="flex items-center gap-1.5 text-xs text-red-500"
          role="alert"
        >
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleSkip}
          disabled={disabled}
          className={`
            px-4 py-2
            text-sm font-medium
            text-gray-600 dark:text-gray-400
            bg-gray-200 dark:bg-gray-700
            rounded-lg
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
            ${disabled
              ? 'cursor-not-allowed opacity-60'
              : 'hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer'
            }
          `}
        >
          Skip
        </button>
        <button
          onClick={handleSubmit}
          disabled={disabled}
          className={`
            flex items-center gap-2
            px-4 py-2
            text-sm font-medium
            text-white
            bg-blue-500
            rounded-lg
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${disabled
              ? 'cursor-not-allowed opacity-60'
              : 'hover:bg-blue-600 cursor-pointer'
            }
          `}
        >
          <span className="material-symbols-outlined text-base">send</span>
          Submit
        </button>
      </div>
    </div>
  );
};

export default FlowResponseInput;
