/**
 * WhatsApp Flow Preview Component Renderers
 *
 * Central export point and component type to renderer mapping.
 * Maps WhatsApp Flow component types to their preview renderer components.
 */

import React from 'react';
import type { Component } from '../../../types';

// Import all renderers
import {
  PreviewTextHeading,
  PreviewTextSubheading,
  PreviewTextBody,
  PreviewTextCaption,
} from './TextRenderers';

import { PreviewTextInput, PreviewTextArea } from './InputRenderers';

import {
  PreviewDropdown,
  PreviewRadioButtonsGroup,
  PreviewCheckboxGroup,
  PreviewChipsSelector,
} from './SelectionRenderers';

import { PreviewFooter, PreviewOptIn, PreviewEmbeddedLink } from './ActionRenderers';

// ============================================================================
// Re-export all renderer components
// ============================================================================

// Text Renderers
export { PreviewTextHeading, PreviewTextSubheading, PreviewTextBody, PreviewTextCaption };

// Input Renderers
export { PreviewTextInput, PreviewTextArea };

// Selection Renderers
export { PreviewDropdown, PreviewRadioButtonsGroup, PreviewCheckboxGroup, PreviewChipsSelector };

// Action Renderers
export { PreviewFooter, PreviewOptIn, PreviewEmbeddedLink };

// ============================================================================
// Component Type to Renderer Mapping
// ============================================================================

/**
 * Maps a WhatsApp Flow component type to its corresponding renderer component.
 * This enables dynamic rendering of components based on their type.
 */
export const COMPONENT_RENDERER_MAP: Record<
  string,
  React.ComponentType<{ component: Component; [key: string]: unknown }>
> = {
  // Text Components
  TextHeading: PreviewTextHeading as React.ComponentType<{ component: Component; [key: string]: unknown }>,
  TextSubheading: PreviewTextSubheading as React.ComponentType<{ component: Component; [key: string]: unknown }>,
  TextBody: PreviewTextBody as React.ComponentType<{ component: Component; [key: string]: unknown }>,
  TextCaption: PreviewTextCaption as React.ComponentType<{ component: Component; [key: string]: unknown }>,

  // Input Components
  TextInput: PreviewTextInput as React.ComponentType<{ component: Component; [key: string]: unknown }>,
  TextArea: PreviewTextArea as React.ComponentType<{ component: Component; [key: string]: unknown }>,

  // Selection Components
  Dropdown: PreviewDropdown as React.ComponentType<{ component: Component; [key: string]: unknown }>,
  RadioButtonsGroup: PreviewRadioButtonsGroup as React.ComponentType<{ component: Component; [key: string]: unknown }>,
  CheckboxGroup: PreviewCheckboxGroup as React.ComponentType<{ component: Component; [key: string]: unknown }>,
  ChipsSelector: PreviewChipsSelector as React.ComponentType<{ component: Component; [key: string]: unknown }>,

  // Action Components
  Footer: PreviewFooter as React.ComponentType<{ component: Component; [key: string]: unknown }>,
  OptIn: PreviewOptIn as React.ComponentType<{ component: Component; [key: string]: unknown }>,
  EmbeddedLink: PreviewEmbeddedLink as React.ComponentType<{ component: Component; [key: string]: unknown }>,
};

// ============================================================================
// Renderer Lookup Function
// ============================================================================

/**
 * Gets the renderer component for a given WhatsApp Flow component type.
 *
 * @param componentType - The type of the component (e.g., 'TextHeading', 'TextInput')
 * @returns The renderer component or null if not found
 *
 * @example
 * ```typescript
 * const RendererComponent = getRendererForComponent('TextHeading');
 * if (RendererComponent) {
 *   return <RendererComponent component={component} {...props} />;
 * }
 * ```
 */
export function getRendererForComponent(
  componentType: string
): React.ComponentType<{ component: Component; [key: string]: unknown }> | null {
  return COMPONENT_RENDERER_MAP[componentType] || null;
}

// ============================================================================
// Component Categories
// ============================================================================

/**
 * Categorizes component types for easier filtering and organization.
 */
export const COMPONENT_CATEGORIES = {
  text: ['TextHeading', 'TextSubheading', 'TextBody', 'TextCaption', 'RichText'],
  input: ['TextInput', 'TextArea'],
  selection: ['Dropdown', 'RadioButtonsGroup', 'CheckboxGroup', 'ChipsSelector'],
  date: ['DatePicker', 'CalendarPicker'],
  action: ['Footer', 'OptIn', 'EmbeddedLink'],
  media: ['Image', 'ImageCarousel'],
  navigation: ['NavigationList'],
  conditional: ['If', 'Switch'],
} as const;

/**
 * Checks if a component type belongs to a specific category.
 *
 * @param componentType - The type of the component
 * @param category - The category to check against
 * @returns True if the component belongs to the category
 */
export function isComponentInCategory(
  componentType: string,
  category: keyof typeof COMPONENT_CATEGORIES
): boolean {
  return COMPONENT_CATEGORIES[category].includes(componentType as never);
}

/**
 * Gets the category of a component type.
 *
 * @param componentType - The type of the component
 * @returns The category name or null if not found
 */
export function getComponentCategory(componentType: string): keyof typeof COMPONENT_CATEGORIES | null {
  for (const [category, types] of Object.entries(COMPONENT_CATEGORIES)) {
    if (types.includes(componentType as never)) {
      return category as keyof typeof COMPONENT_CATEGORIES;
    }
  }
  return null;
}

// ============================================================================
// Supported Component Types
// ============================================================================

/**
 * List of all component types that have preview renderers.
 */
export const SUPPORTED_COMPONENT_TYPES = Object.keys(COMPONENT_RENDERER_MAP);

/**
 * Checks if a component type has a preview renderer.
 *
 * @param componentType - The type of the component
 * @returns True if a renderer exists for this component type
 */
export function hasRenderer(componentType: string): boolean {
  return componentType in COMPONENT_RENDERER_MAP;
}
