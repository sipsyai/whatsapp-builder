/**
 * WhatsApp Flow Preview - Input Component Renderers
 *
 * Renders text input components (TextInput, TextArea) with WhatsApp-like styling.
 * Handles form state, validation, and user interactions.
 */

import React, { useCallback } from 'react';
import type { TextInput, TextArea } from '../../../types';

// ============================================================================
// Common Props Interface
// ============================================================================

interface BaseInputRendererProps {
  value?: string;
  onChange?: (name: string, value: string) => void;
  visible?: boolean | string;
  error?: string;
}

// ============================================================================
// TextInput Renderer
// ============================================================================

interface PreviewTextInputProps extends BaseInputRendererProps {
  component: TextInput;
}

export const PreviewTextInput: React.FC<PreviewTextInputProps> = ({
  component,
  value = '',
  onChange,
  visible = true,
  error,
}) => {
  const isVisible = typeof visible === 'string' ? true : visible;
  if (!isVisible || component.visible === false) return null;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(component.name, e.target.value);
      }
    },
    [onChange, component.name]
  );

  const inputType = component['input-type'] || 'text';
  const isRequired = component.required === true;
  const minChars = component['min-chars'];
  const maxChars = component['max-chars'];
  const helperText = component['helper-text'];
  const errorMessage = error || component['error-message'];
  const labelVariant = component['label-variant'];
  const initValue = value || component['init-value'] || '';

  return (
    <div className="mb-4">
      {/* Label */}
      <label
        htmlFor={component.name}
        className={`block mb-2 ${
          labelVariant === 'large' ? 'text-base font-semibold' : 'text-sm font-medium'
        } text-gray-300`}
      >
        {component.label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input Field */}
      <input
        id={component.name}
        name={component.name}
        type={inputType}
        value={initValue}
        onChange={handleChange}
        required={isRequired}
        minLength={typeof minChars === 'string' ? undefined : minChars}
        maxLength={typeof maxChars === 'string' ? undefined : maxChars}
        pattern={component.pattern}
        className={`w-full px-3 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 ${
          errorMessage
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-600 focus:ring-green-500 focus:border-green-500'
        } bg-gray-800 text-white placeholder-gray-400`}
        placeholder={helperText}
      />

      {/* Helper Text or Error Message */}
      {errorMessage ? (
        <p className="mt-1 text-xs text-red-500">{errorMessage}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-gray-400">{helperText}</p>
      ) : null}

      {/* Character Count */}
      {maxChars && (
        <p className="mt-1 text-xs text-gray-400 text-right">
          {initValue.length}/{maxChars}
        </p>
      )}
    </div>
  );
};

// ============================================================================
// TextArea Renderer
// ============================================================================

interface PreviewTextAreaProps extends BaseInputRendererProps {
  component: TextArea;
}

export const PreviewTextArea: React.FC<PreviewTextAreaProps> = ({
  component,
  value = '',
  onChange,
  visible = true,
  error,
}) => {
  const isVisible = typeof visible === 'string' ? true : visible;
  if (!isVisible || component.visible === false) return null;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange) {
        onChange(component.name, e.target.value);
      }
    },
    [onChange, component.name]
  );

  const isRequired = component.required === true;
  const isEnabled = component.enabled !== false;
  const maxLength = component['max-length'];
  const helperText = component['helper-text'];
  const errorMessage = error || component['error-message'];
  const labelVariant = component['label-variant'];
  const initValue = value || component['init-value'] || '';

  return (
    <div className="mb-4">
      {/* Label */}
      <label
        htmlFor={component.name}
        className={`block mb-2 ${
          labelVariant === 'large' ? 'text-base font-semibold' : 'text-sm font-medium'
        } text-gray-300`}
      >
        {component.label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* TextArea Field */}
      <textarea
        id={component.name}
        name={component.name}
        value={initValue}
        onChange={handleChange}
        required={isRequired}
        disabled={!isEnabled}
        maxLength={typeof maxLength === 'string' ? undefined : parseInt(maxLength || '0', 10)}
        rows={4}
        className={`w-full px-3 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 resize-none ${
          errorMessage
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-600 focus:ring-green-500 focus:border-green-500'
        } bg-gray-800 text-white placeholder-gray-400 ${
          !isEnabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        placeholder={helperText}
      />

      {/* Helper Text or Error Message */}
      {errorMessage ? (
        <p className="mt-1 text-xs text-red-500">{errorMessage}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-gray-400">{helperText}</p>
      ) : null}

      {/* Character Count */}
      {maxLength && (
        <p className="mt-1 text-xs text-gray-400 text-right">
          {initValue.length}/{maxLength}
        </p>
      )}
    </div>
  );
};
