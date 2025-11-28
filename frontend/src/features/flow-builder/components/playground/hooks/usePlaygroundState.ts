/**
 * WhatsApp Flows Playground State Hook
 *
 * Wraps the useFlowBuilder hook and adds playground-specific state management
 * for the interactive Flow testing and preview environment.
 *
 * This hook extends the base Flow Builder functionality with:
 * - Accordion expansion state for component editors
 * - Editor mode switching (JSON vs Form)
 * - Add content menu state
 * - Component preview text generation
 * - Auto-expansion when adding new components
 */

import { useState, useCallback } from 'react';
import { useFlowBuilder, type UseFlowBuilderOptions, type UseFlowBuilderReturn } from '../../../hooks/useFlowBuilder';
import type { EditorMode } from '../types/playground.types';
import { getDefaultComponent } from '../constants/contentCategories';
import type { BuilderComponent } from '../../../types/builder.types';

// ============================================================================
// Types
// ============================================================================

export interface UsePlaygroundStateOptions extends UseFlowBuilderOptions {
  /**
   * Initial editor mode
   * @default 'form'
   */
  initialEditorMode?: EditorMode;
}

export interface UsePlaygroundStateReturn extends UseFlowBuilderReturn {
  // Additional playground state
  expandedComponentId: string | null;
  editorMode: EditorMode;
  addContentMenuOpen: boolean;

  // Additional playground actions
  setExpandedComponentId: (id: string | null) => void;
  toggleEditorMode: () => void;
  setEditorMode: (mode: EditorMode) => void;
  setAddContentMenuOpen: (open: boolean) => void;
  addComponentFromMenu: (type: string) => void;

  // Helper functions
  getComponentPreviewText: (component: BuilderComponent) => string;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Playground state hook - wraps useFlowBuilder with playground-specific features
 *
 * @param options - Configuration options including all useFlowBuilder options
 * @returns Playground state and actions
 *
 * @example
 * ```tsx
 * const {
 *   // Flow Builder state
 *   screens,
 *   selectedScreenId,
 *   selectedScreen,
 *   addComponent,
 *   updateComponent,
 *
 *   // Playground state
 *   expandedComponentId,
 *   editorMode,
 *   addContentMenuOpen,
 *
 *   // Playground actions
 *   setExpandedComponentId,
 *   toggleEditorMode,
 *   addComponentFromMenu,
 *   getComponentPreviewText,
 * } = usePlaygroundState({
 *   initialFlowName: 'My Flow',
 *   initialEditorMode: 'form',
 * });
 * ```
 */
export const usePlaygroundState = (
  options: UsePlaygroundStateOptions = {}
): UsePlaygroundStateReturn => {
  const {
    initialEditorMode = 'form',
    ...flowBuilderOptions
  } = options;

  // ========================================================================
  // Use Flow Builder Hook
  // ========================================================================

  const flowBuilderState = useFlowBuilder(flowBuilderOptions);

  // ========================================================================
  // Playground-Specific State
  // ========================================================================

  const [expandedComponentId, setExpandedComponentId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>(initialEditorMode);
  const [addContentMenuOpen, setAddContentMenuOpen] = useState<boolean>(false);

  // ========================================================================
  // Playground Actions
  // ========================================================================

  /**
   * Toggle between JSON and Form editor modes
   */
  const toggleEditorMode = useCallback(() => {
    setEditorMode(prev => prev === 'json' ? 'form' : 'json');
  }, []);

  /**
   * Add a component from the content library menu
   * Creates the component with default values and auto-expands it in the editor
   *
   * @param type - Component type (e.g., 'TextHeading', 'RadioButtonsGroup')
   */
  const addComponentFromMenu = useCallback((type: string) => {
    // Ensure we have a selected screen
    if (!flowBuilderState.selectedScreenId) {
      console.warn('Cannot add component: no screen selected');
      return;
    }

    // Get default configuration for this component type
    const defaultConfig = getDefaultComponent(type);

    // Create the component
    const newComponent = flowBuilderState.addComponent(
      flowBuilderState.selectedScreenId,
      {
        type: type as BuilderComponent['type'],
        config: defaultConfig,
      }
    );

    // Auto-expand the newly created component in the accordion
    if (newComponent) {
      setExpandedComponentId(newComponent.id);
    }

    // Close the add content menu
    setAddContentMenuOpen(false);
  }, [flowBuilderState]);

  // ========================================================================
  // Helper Functions
  // ========================================================================

  /**
   * Get preview text for a component to display in the accordion
   * Returns a short, descriptive text based on component type and content
   *
   * @param component - The component to get preview text for
   * @returns Short preview text (1-2 lines)
   *
   * @example
   * ```tsx
   * getComponentPreviewText({
   *   type: 'TextHeading',
   *   config: { text: 'Welcome to our store' }
   * });
   * // Returns: "Welcome to our store"
   *
   * getComponentPreviewText({
   *   type: 'RadioButtonsGroup',
   *   config: { label: 'Choose size', 'data-source': [...] }
   * });
   * // Returns: "Choose size"
   * ```
   */
  const getComponentPreviewText = useCallback((component: BuilderComponent): string => {
    const config = component.config;

    // Text components - show the text content
    if ('text' in config && typeof config.text === 'string') {
      const text = config.text;
      return text.length > 50 ? `${text.substring(0, 47)}...` : text;
    }

    // Input components - show the label
    if ('label' in config && typeof config.label === 'string') {
      return config.label;
    }

    // Image component - show alt text or filename
    if (component.type === 'Image') {
      if ('alt' in config && typeof config.alt === 'string') {
        return config.alt;
      }
      if ('src' in config && typeof config.src === 'string') {
        const src = config.src;
        const filename = src.split('/').pop() || src;
        return filename.length > 30 ? `${filename.substring(0, 27)}...` : filename;
      }
      return 'Image';
    }

    // Date picker - show label or name
    if (component.type === 'DatePicker') {
      if ('label' in config && typeof config.label === 'string') {
        return config.label;
      }
      if ('name' in config && typeof config.name === 'string') {
        return config.name;
      }
      return 'Date picker';
    }

    // Selection components - show label and option count
    if (component.type === 'RadioButtonsGroup' ||
        component.type === 'CheckboxGroup' ||
        component.type === 'Dropdown') {
      const label = ('label' in config && typeof config.label === 'string')
        ? config.label
        : component.type;

      // Check for both 'data-source' (correct) and 'dataSource' (legacy) for backwards compatibility
      const configAny = config as Record<string, unknown>;
      const dataSource = configAny['data-source'] || configAny['dataSource'];
      const optionCount = Array.isArray(dataSource) ? dataSource.length : 0;

      return optionCount > 0 ? `${label} (${optionCount} options)` : label;
    }

    // Footer - show button text
    if (component.type === 'Footer') {
      if ('label' in config && typeof config.label === 'string') {
        return config.label;
      }
      return 'Button';
    }

    // OptIn - show label
    if (component.type === 'OptIn') {
      if ('label' in config && typeof config.label === 'string') {
        return config.label;
      }
      return 'Opt-in';
    }

    // Default - return component type as fallback
    return component.type;
  }, []);

  // ========================================================================
  // Return Combined State
  // ========================================================================

  return {
    // All Flow Builder state and actions
    ...flowBuilderState,

    // Playground-specific state
    expandedComponentId,
    editorMode,
    addContentMenuOpen,

    // Playground-specific actions
    setExpandedComponentId,
    toggleEditorMode,
    setEditorMode,
    setAddContentMenuOpen,
    addComponentFromMenu,

    // Helper functions
    getComponentPreviewText,
  };
};
