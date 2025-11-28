/**
 * WhatsApp Flows Playground TypeScript Type Definitions
 *
 * Types for the Playground component that allows testing and previewing
 * WhatsApp Flows with an interactive editor and mobile preview.
 */

import type { BuilderScreen, BuilderComponent } from '../../../types/builder.types';

// ============================================================================
// Editor Mode
// ============================================================================

/**
 * Editor mode for the playground
 * - json: Edit raw Flow JSON
 * - form: Use visual form-based editor
 */
export type EditorMode = 'json' | 'form';

// ============================================================================
// Preview Settings
// ============================================================================

/**
 * Settings for the mobile preview
 */
export interface PreviewSettings {
  /**
   * Platform to simulate
   */
  platform: 'android' | 'ios';

  /**
   * Theme for the preview
   */
  theme: 'light' | 'dark';

  /**
   * Enable interactive mode (clickable components)
   */
  interactive: boolean;
}

// ============================================================================
// Content Library
// ============================================================================

/**
 * Category of components in the content library
 */
export interface ContentCategory {
  /**
   * Unique identifier for the category
   */
  id: string;

  /**
   * Display label for the category
   */
  label: string;

  /**
   * Material Symbol icon name
   */
  icon: string;

  /**
   * List of components in this category
   */
  items: ContentItem[];
}

/**
 * Individual component item in the content library
 */
export interface ContentItem {
  /**
   * Component type (TextHeading, TextInput, CheckboxGroup, etc.)
   */
  type: string;

  /**
   * Display name for the component
   */
  label: string;

  /**
   * Material Symbol icon name
   */
  icon: string;
}

// ============================================================================
// Component Editor Props
// ============================================================================

/**
 * Props for component editor forms
 * Generic interface that can be used for all component types
 */
export interface ComponentEditorProps {
  /**
   * The component being edited
   */
  component: BuilderComponent;

  /**
   * Callback when component properties change
   */
  onChange: (updates: Partial<BuilderComponent>) => void;

  /**
   * Callback when component should be deleted
   */
  onDelete: () => void;
}

// ============================================================================
// Playground State
// ============================================================================

/**
 * Complete state for the Playground component
 */
export interface PlaygroundState {
  /**
   * List of screens in the flow
   */
  screens: BuilderScreen[];

  /**
   * ID of the currently selected screen
   */
  selectedScreenId: string | null;

  /**
   * Index of the currently selected component in the selected screen
   */
  selectedComponentIndex: number | null;

  /**
   * ID of the component whose editor is expanded in the sidebar
   */
  expandedComponentId: string | null;

  /**
   * Current editor mode (JSON or form-based)
   */
  editorMode: EditorMode;

  /**
   * Whether the add content menu is open
   */
  addContentMenuOpen: boolean;

  /**
   * Settings for the mobile preview
   */
  previewSettings: PreviewSettings;
}

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default preview settings
 */
export const DEFAULT_PREVIEW_SETTINGS: PreviewSettings = {
  platform: 'android',
  theme: 'light',
  interactive: true,
};

/**
 * Default playground state
 */
export const DEFAULT_PLAYGROUND_STATE: PlaygroundState = {
  screens: [],
  selectedScreenId: null,
  selectedComponentIndex: null,
  expandedComponentId: null,
  editorMode: 'form',
  addContentMenuOpen: false,
  previewSettings: DEFAULT_PREVIEW_SETTINGS,
};

// Note: CONTENT_CATEGORIES and helper functions are defined in
// ../constants/contentCategories.ts to keep this file focused on types
