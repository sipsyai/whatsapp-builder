/**
 * WhatsApp Flow Preview - Text Component Renderers
 *
 * Renders text components (TextHeading, TextSubheading, TextBody, TextCaption)
 * with WhatsApp-like styling for flow preview.
 */

import React from 'react';
import type { TextHeading, TextSubheading, TextBody, TextCaption } from '../../../types';

// ============================================================================
// Common Props Interface
// ============================================================================

interface BaseTextRendererProps {
  visible?: boolean | string;
}

// ============================================================================
// TextHeading Renderer
// ============================================================================

interface PreviewTextHeadingProps extends BaseTextRendererProps {
  component: TextHeading;
}

export const PreviewTextHeading: React.FC<PreviewTextHeadingProps> = ({ component, visible = true }) => {
  // Handle dynamic visibility
  const isVisible = typeof visible === 'string' ? true : visible;
  if (!isVisible || component.visible === false) return null;

  return (
    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
      {component.text}
    </h1>
  );
};

// ============================================================================
// TextSubheading Renderer
// ============================================================================

interface PreviewTextSubheadingProps extends BaseTextRendererProps {
  component: TextSubheading;
}

export const PreviewTextSubheading: React.FC<PreviewTextSubheadingProps> = ({ component, visible = true }) => {
  const isVisible = typeof visible === 'string' ? true : visible;
  if (!isVisible || component.visible === false) return null;

  return (
    <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">
      {component.text}
    </h2>
  );
};

// ============================================================================
// TextBody Renderer
// ============================================================================

interface PreviewTextBodyProps extends BaseTextRendererProps {
  component: TextBody;
}

export const PreviewTextBody: React.FC<PreviewTextBodyProps> = ({ component, visible = true }) => {
  const isVisible = typeof visible === 'string' ? true : visible;
  if (!isVisible || component.visible === false) return null;

  // Determine font styles
  const fontWeight = component['font-weight'] || 'normal';
  const strikethrough = component.strikethrough === true;

  let className = 'text-sm text-gray-700 dark:text-gray-300 mb-2 ';

  // Apply font weight
  if (fontWeight === 'bold') {
    className += 'font-bold ';
  } else if (fontWeight === 'italic') {
    className += 'italic ';
  } else if (fontWeight === 'bold_italic') {
    className += 'font-bold italic ';
  }

  // Apply strikethrough
  if (strikethrough) {
    className += 'line-through ';
  }

  return <p className={className.trim()}>{component.text}</p>;
};

// ============================================================================
// TextCaption Renderer
// ============================================================================

interface PreviewTextCaptionProps extends BaseTextRendererProps {
  component: TextCaption;
}

export const PreviewTextCaption: React.FC<PreviewTextCaptionProps> = ({ component, visible = true }) => {
  const isVisible = typeof visible === 'string' ? true : visible;
  if (!isVisible || component.visible === false) return null;

  const fontWeight = component['font-weight'] || 'normal';
  const strikethrough = component.strikethrough === true;

  let className = 'text-xs text-gray-500 dark:text-gray-400 mb-1 ';

  if (fontWeight === 'bold') {
    className += 'font-bold ';
  } else if (fontWeight === 'italic') {
    className += 'italic ';
  } else if (fontWeight === 'bold_italic') {
    className += 'font-bold italic ';
  }

  if (strikethrough) {
    className += 'line-through ';
  }

  return <p className={className.trim()}>{component.text}</p>;
};
