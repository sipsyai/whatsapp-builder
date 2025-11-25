/**
 * WhatsApp Flow Preview - Action Component Renderers
 *
 * Renders action components (Footer, OptIn, EmbeddedLink) with WhatsApp-like styling.
 * Handles user interactions and action dispatching.
 */

import React, { useCallback } from 'react';
import type { Footer, OptIn, EmbeddedLink } from '../../../types';

// ============================================================================
// Common Props Interface
// ============================================================================

interface BaseActionRendererProps {
  onAction?: (actionName: string, payload?: unknown) => void;
  visible?: boolean | string;
}

// ============================================================================
// Footer Renderer (CTA Button)
// ============================================================================

interface PreviewFooterProps extends BaseActionRendererProps {
  component: Footer;
}

export const PreviewFooter: React.FC<PreviewFooterProps> = ({ component, onAction, visible = true }) => {
  const isVisible = typeof visible === 'string' ? true : visible;
  if (!isVisible) return null;

  const handleClick = useCallback(() => {
    if (onAction) {
      onAction(component['on-click-action'].name, component['on-click-action'].payload);
    }
  }, [onAction, component]);

  const isEnabled = component.enabled !== false;
  const leftCaption = component['left-caption'];
  const centerCaption = component['center-caption'];
  const rightCaption = component['right-caption'];

  return (
    <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 mt-6">
      {/* Captions */}
      {(leftCaption || centerCaption || rightCaption) && (
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span>{leftCaption}</span>
          <span>{centerCaption}</span>
          <span>{rightCaption}</span>
        </div>
      )}

      {/* CTA Button - WhatsApp Green */}
      <button
        type="button"
        onClick={handleClick}
        disabled={!isEnabled}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
          isEnabled
            ? 'bg-green-500 hover:bg-green-600 active:bg-green-700 shadow-md hover:shadow-lg'
            : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-50'
        }`}
      >
        {component.label}
      </button>
    </div>
  );
};

// ============================================================================
// OptIn Renderer (Checkbox with Label)
// ============================================================================

interface PreviewOptInProps extends BaseActionRendererProps {
  component: OptIn;
  value?: boolean;
  onChange?: (name: string, value: boolean) => void;
}

export const PreviewOptIn: React.FC<PreviewOptInProps> = ({
  component,
  value = false,
  onChange,
  onAction,
  visible = true,
}) => {
  const isVisible = typeof visible === 'string' ? true : visible;
  if (!isVisible || component.visible === false) return null;

  const handleChange = useCallback(
    (checked: boolean) => {
      if (onChange) {
        onChange(component.name, checked);
      }

      // Trigger on-select or on-unselect action
      if (onAction && component['on-select-action'] && checked) {
        onAction(component['on-select-action'].name, component['on-select-action'].payload);
      } else if (onAction && component['on-unselect-action'] && !checked) {
        onAction(component['on-unselect-action'].name, component['on-unselect-action'].payload);
      }
    },
    [onChange, onAction, component]
  );

  const handleLabelClick = useCallback(() => {
    // If on-click-action exists, trigger it
    if (onAction && component['on-click-action']) {
      onAction(component['on-click-action'].name);
    }
  }, [onAction, component]);

  const isRequired = component.required === true;
  const isChecked = value !== undefined ? value : component['init-value'] === true;

  return (
    <div className="mb-4">
      <label className="flex items-start cursor-pointer group">
        {/* Checkbox */}
        <input
          type="checkbox"
          name={component.name}
          checked={isChecked}
          required={isRequired}
          onChange={(e) => handleChange(e.target.checked)}
          className="mt-1 w-4 h-4 text-green-500 focus:ring-green-500 border-gray-300 rounded"
        />

        {/* Label with optional link */}
        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
          {component['on-click-action'] ? (
            <button
              type="button"
              onClick={handleLabelClick}
              className="text-blue-500 hover:text-blue-600 underline"
            >
              {component.label}
            </button>
          ) : (
            component.label
          )}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </span>
      </label>
    </div>
  );
};

// ============================================================================
// EmbeddedLink Renderer
// ============================================================================

interface PreviewEmbeddedLinkProps extends BaseActionRendererProps {
  component: EmbeddedLink;
}

export const PreviewEmbeddedLink: React.FC<PreviewEmbeddedLinkProps> = ({
  component,
  onAction,
  visible = true,
}) => {
  const isVisible = typeof visible === 'string' ? true : visible;
  if (!isVisible || component.visible === false) return null;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (onAction) {
        onAction(component['on-click-action'].name, component['on-click-action'].payload);
      }
    },
    [onAction, component]
  );

  const actionName = component['on-click-action'].name;
  const isExternalLink = actionName === 'open_url';

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={handleClick}
        className="text-blue-500 hover:text-blue-600 hover:underline text-sm font-medium transition-colors inline-flex items-center gap-1"
      >
        {component.text}
        {isExternalLink && (
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        )}
      </button>
    </div>
  );
};
