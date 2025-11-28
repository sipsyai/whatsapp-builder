/**
 * WhatsApp Flows Playground - Content Categories
 *
 * Content categories and default values based on Meta's WhatsApp Flows Playground
 * Organizes components into 4 main categories: Text, Media, Text Answer, and Selection
 */

import type { ContentCategory } from '../types/playground.types';

/**
 * Content categories matching Meta Playground structure
 *
 * 1. Text - Display content (headings, body, captions)
 * 2. Media - Images and visual content
 * 3. Text Answer - Text input fields and date pickers
 * 4. Selection - Radio buttons, checkboxes, dropdowns, opt-in
 * 5. Navigation - Footer buttons for form navigation
 */
export const CONTENT_CATEGORIES: ContentCategory[] = [
  {
    id: 'text',
    label: 'Text',
    icon: 'text_fields',
    items: [
      {
        type: 'TextHeading',
        label: 'Large Heading',
        icon: 'title',
      },
      {
        type: 'TextSubheading',
        label: 'Small Heading',
        icon: 'format_size',
      },
      {
        type: 'TextCaption',
        label: 'Caption',
        icon: 'notes',
      },
      {
        type: 'TextBody',
        label: 'Body',
        icon: 'subject',
      },
    ],
  },
  {
    id: 'media',
    label: 'Media',
    icon: 'image',
    items: [
      {
        type: 'Image',
        label: 'Image',
        icon: 'image',
      },
    ],
  },
  {
    id: 'text-answer',
    label: 'Text Answer',
    icon: 'input',
    items: [
      {
        type: 'TextInput',
        label: 'Short Answer',
        icon: 'input',
      },
      {
        type: 'TextArea',
        label: 'Paragraph',
        icon: 'text_fields',
      },
      {
        type: 'DatePicker',
        label: 'Date picker',
        icon: 'calendar_today',
      },
    ],
  },
  {
    id: 'selection',
    label: 'Selection',
    icon: 'checklist',
    items: [
      {
        type: 'RadioButtonsGroup',
        label: 'Single Choice',
        icon: 'radio_button_checked',
      },
      {
        type: 'CheckboxGroup',
        label: 'Multiple Choice',
        icon: 'check_box',
      },
      {
        type: 'Dropdown',
        label: 'Dropdown',
        icon: 'arrow_drop_down_circle',
      },
      {
        type: 'OptIn',
        label: 'Opt-in',
        icon: 'check_circle',
      },
    ],
  },
  {
    id: 'navigation',
    label: 'Navigation',
    icon: 'touch_app',
    items: [
      {
        type: 'Footer',
        label: 'Button',
        icon: 'smart_button',
      },
    ],
  },
];

/**
 * Default component values for each component type
 *
 * These values are used when creating new components in the playground
 * to provide sensible defaults for testing and development
 */
export const DEFAULT_COMPONENT_VALUES: Record<string, Record<string, unknown>> = {
  // Text Components
  TextHeading: {
    text: 'Heading',
  },
  TextSubheading: {
    text: 'Subheading',
  },
  TextBody: {
    text: 'Body text',
  },
  TextCaption: {
    text: 'Caption',
  },

  // Media Components
  Image: {
    src: '',
    alt: 'Image',
  },

  // Input Components
  TextInput: {
    name: 'input_field',
    label: 'Input',
    required: false,
  },
  TextArea: {
    name: 'textarea_field',
    label: 'Textarea',
    required: false,
  },
  DatePicker: {
    name: 'date_field',
    label: 'Date',
  },

  // Selection Components
  RadioButtonsGroup: {
    name: 'radio_field',
    label: 'Choose one',
    required: true,
    'data-source': [
      { id: 'opt1', title: 'Option 1' },
      { id: 'opt2', title: 'Option 2' },
    ],
  },
  CheckboxGroup: {
    name: 'checkbox_field',
    label: 'Select all',
    'data-source': [
      { id: 'opt1', title: 'Option 1' },
    ],
  },
  Dropdown: {
    name: 'dropdown_field',
    label: 'Select',
    'data-source': [
      { id: 'opt1', title: 'Option 1' },
    ],
  },
  OptIn: {
    name: 'consent',
    label: 'I agree',
    required: true,
  },

  // Navigation Components
  Footer: {
    label: 'Continue',
  },
};

/**
 * Get default component configuration by type
 *
 * @param type - Component type (e.g., 'TextHeading', 'RadioButtonsGroup')
 * @returns Default component configuration object
 *
 * @example
 * ```ts
 * const defaults = getDefaultComponent('TextHeading');
 * // Returns: { text: 'Heading' }
 *
 * const radioDefaults = getDefaultComponent('RadioButtonsGroup');
 * // Returns: { name: 'radio_field', label: 'Choose one', required: true, 'data-source': [...] }
 * ```
 */
export function getDefaultComponent(type: string): Record<string, unknown> {
  return DEFAULT_COMPONENT_VALUES[type] || {};
}

/**
 * Get all component types from categories
 *
 * @returns Array of all available component types
 *
 * @example
 * ```ts
 * const types = getAllComponentTypes();
 * // Returns: ['TextHeading', 'TextSubheading', 'TextCaption', ...]
 * ```
 */
export function getAllComponentTypes(): string[] {
  return CONTENT_CATEGORIES.flatMap(category =>
    category.items.map(item => item.type)
  );
}

/**
 * Get category for a specific component type
 *
 * @param type - Component type
 * @returns Category containing the component, or undefined if not found
 *
 * @example
 * ```ts
 * const category = getCategoryForType('TextHeading');
 * // Returns: { id: 'text', label: 'Text', icon: 'text_fields', items: [...] }
 * ```
 */
export function getCategoryForType(type: string): ContentCategory | undefined {
  return CONTENT_CATEGORIES.find(category =>
    category.items.some(item => item.type === type)
  );
}

/**
 * Check if a component type is valid
 *
 * @param type - Component type to validate
 * @returns True if the type exists in any category
 *
 * @example
 * ```ts
 * isValidComponentType('TextHeading'); // true
 * isValidComponentType('InvalidType'); // false
 * ```
 */
export function isValidComponentType(type: string): boolean {
  return getAllComponentTypes().includes(type);
}
