/**
 * Component Editors Index
 *
 * Exports all component editors and provides a helper function to get the
 * appropriate editor component based on the component type.
 */

import type { ComponentEditorProps } from '../../types/playground.types';
import { TextHeadingEditor } from './TextHeadingEditor';
import { TextInputEditor } from './TextInputEditor';
import { DropdownEditor } from './DropdownEditor';
import { RadioButtonsEditor } from './RadioButtonsEditor';
import { FooterEditor } from './FooterEditor';

// Export all editors
export { TextHeadingEditor } from './TextHeadingEditor';
export { TextInputEditor } from './TextInputEditor';
export { DropdownEditor } from './DropdownEditor';
export { RadioButtonsEditor } from './RadioButtonsEditor';
export { FooterEditor } from './FooterEditor';

/**
 * Map of component types to their corresponding editor components
 */
const EDITOR_MAP: Record<string, React.FC<ComponentEditorProps>> = {
  // Text components - all use TextHeadingEditor
  TextHeading: TextHeadingEditor,
  TextSubheading: TextHeadingEditor,
  TextBody: TextHeadingEditor,
  TextCaption: TextHeadingEditor,

  // Input components - use TextInputEditor
  TextInput: TextInputEditor,
  TextArea: TextInputEditor,

  // Dropdown component
  Dropdown: DropdownEditor,

  // Radio/Checkbox components - use RadioButtonsEditor
  RadioButtonsGroup: RadioButtonsEditor,
  CheckboxGroup: RadioButtonsEditor,

  // Footer component
  Footer: FooterEditor,
};

/**
 * Get the appropriate editor component for a given component type
 *
 * @param type - The component type (e.g., "TextHeading", "TextInput")
 * @returns The editor component or null if no editor is available
 *
 * @example
 * ```tsx
 * const Editor = getEditorForType('TextHeading');
 * if (Editor) {
 *   return <Editor component={component} onChange={handleChange} onDelete={handleDelete} />;
 * }
 * ```
 */
export function getEditorForType(type: string): React.FC<ComponentEditorProps> | null {
  return EDITOR_MAP[type] || null;
}

/**
 * Check if a component type has an available editor
 *
 * @param type - The component type
 * @returns True if an editor is available
 *
 * @example
 * ```tsx
 * if (hasEditor('TextInput')) {
 *   // Show inline editor
 * } else {
 *   // Show JSON editor fallback
 * }
 * ```
 */
export function hasEditor(type: string): boolean {
  return type in EDITOR_MAP;
}

/**
 * Get a list of all supported component types
 *
 * @returns Array of component type strings
 */
export function getSupportedComponentTypes(): string[] {
  return Object.keys(EDITOR_MAP);
}
