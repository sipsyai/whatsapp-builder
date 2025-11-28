/**
 * Flow Builder Hook
 *
 * Main hook for managing Flow Builder state, providing CRUD operations
 * for screens and components, selection management, and state getters.
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  BuilderScreen,
  BuilderComponent,
  FlowJSONVersion,
} from '../types';
import {
  createEmptyScreen,
} from '../types';

// ============================================================================
// Types
// ============================================================================

export interface UseFlowBuilderOptions {
  initialFlowId?: string;
  initialFlowName?: string;
  initialFlowVersion?: FlowJSONVersion;
  initialScreens?: BuilderScreen[];
}

export interface UseFlowBuilderReturn {
  // State
  flowId: string | null;
  flowName: string;
  flowVersion: FlowJSONVersion;
  screens: BuilderScreen[];
  selectedScreenId: string | null;
  selectedComponentId: string | null;
  selectedScreen: BuilderScreen | undefined;

  // Setters
  setFlowId: (id: string | null) => void;
  setFlowName: (name: string) => void;
  setFlowVersion: (version: FlowJSONVersion) => void;

  // Screen operations
  addScreen: (screen?: Partial<BuilderScreen>) => BuilderScreen;
  updateScreen: (screenId: string, updates: Partial<BuilderScreen>) => void;
  deleteScreen: (screenId: string) => void;
  duplicateScreen: (screenId: string) => BuilderScreen | null;

  // Component operations
  addComponent: (screenId: string, component: Partial<BuilderComponent>) => BuilderComponent | null;
  updateComponent: (screenId: string, componentId: string, updates: Partial<BuilderComponent>) => void;
  deleteComponent: (screenId: string, componentId: string) => void;
  duplicateComponent: (screenId: string, componentId: string) => BuilderComponent | null;
  reorderComponents: (screenId: string, newOrder: string[]) => void;

  // Selection
  selectScreen: (screenId: string | null) => void;
  selectComponent: (componentId: string | null) => void;

  // Getters
  getScreen: (screenId: string) => BuilderScreen | undefined;
  getComponent: (screenId: string, componentId: string) => BuilderComponent | undefined;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Main Flow Builder hook for managing flow state and operations
 */
export const useFlowBuilder = (options: UseFlowBuilderOptions = {}): UseFlowBuilderReturn => {
  const {
    initialFlowId,
    initialFlowName = 'New Flow',
    initialFlowVersion = '7.2',
    initialScreens = [],
  } = options;

  // ========================================================================
  // State
  // ========================================================================

  const [flowId, setFlowId] = useState<string | null>(initialFlowId ?? null);
  const [flowName, setFlowName] = useState<string>(initialFlowName);
  const [flowVersion, setFlowVersion] = useState<FlowJSONVersion>(initialFlowVersion);
  const [screens, setScreens] = useState<BuilderScreen[]>(initialScreens);
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  // ========================================================================
  // Computed State
  // ========================================================================

  const selectedScreen = useMemo(() => {
    return screens.find(s => s.id === selectedScreenId);
  }, [screens, selectedScreenId]);

  // ========================================================================
  // Screen Operations
  // ========================================================================

  /**
   * Add a new screen to the flow
   */
  const addScreen = useCallback((screen?: Partial<BuilderScreen>): BuilderScreen => {
    const screenId = screen?.id || `screen_${Date.now()}`;
    const newScreen: BuilderScreen = {
      ...createEmptyScreen(screenId),
      ...screen,
      id: screenId,
      updatedAt: new Date().toISOString(),
    };

    setScreens(prev => [...prev, newScreen]);
    setSelectedScreenId(screenId);
    setSelectedComponentId(null);

    return newScreen;
  }, []);

  /**
   * Update an existing screen
   */
  const updateScreen = useCallback((screenId: string, updates: Partial<BuilderScreen>): void => {
    setScreens(prev => prev.map(screen => {
      if (screen.id === screenId) {
        return {
          ...screen,
          ...updates,
          id: screenId, // Prevent ID from being changed
          updatedAt: new Date().toISOString(),
        };
      }
      return screen;
    }));
  }, []);

  /**
   * Delete a screen from the flow
   */
  const deleteScreen = useCallback((screenId: string): void => {
    setScreens(prev => prev.filter(screen => screen.id !== screenId));

    // Clear selection if deleted screen was selected
    if (selectedScreenId === screenId) {
      setSelectedScreenId(null);
      setSelectedComponentId(null);
    }
  }, [selectedScreenId]);

  /**
   * Duplicate an existing screen
   */
  const duplicateScreen = useCallback((screenId: string): BuilderScreen | null => {
    const screenToDuplicate = screens.find(s => s.id === screenId);
    if (!screenToDuplicate) {
      return null;
    }

    const newScreenId = `${screenId}_copy_${Date.now()}`;
    const duplicatedScreen: BuilderScreen = {
      ...screenToDuplicate,
      id: newScreenId,
      title: `${screenToDuplicate.title} (Copy)`,
      components: screenToDuplicate.components.map(component => ({
        ...component,
        id: `${component.id}_copy_${Date.now()}`,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setScreens(prev => [...prev, duplicatedScreen]);
    setSelectedScreenId(newScreenId);
    setSelectedComponentId(null);

    return duplicatedScreen;
  }, [screens]);

  // ========================================================================
  // Component Operations
  // ========================================================================

  /**
   * Add a component to a screen
   */
  const addComponent = useCallback((
    screenId: string,
    component: Partial<BuilderComponent>
  ): BuilderComponent | null => {
    const screen = screens.find(s => s.id === screenId);
    if (!screen) {
      return null;
    }

    const componentId = component.id || `component_${screenId}_${Date.now()}`;
    const newComponent: BuilderComponent = {
      id: componentId,
      type: component.type || 'TextBody',
      config: component.config || {},
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
      ...component,
    };

    setScreens(prev => prev.map(s => {
      if (s.id === screenId) {
        return {
          ...s,
          components: [...s.components, newComponent],
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    }));

    setSelectedComponentId(componentId);

    return newComponent;
  }, [screens]);

  /**
   * Update a component in a screen
   */
  const updateComponent = useCallback((
    screenId: string,
    componentId: string,
    updates: Partial<BuilderComponent>
  ): void => {
    setScreens(prev => prev.map(screen => {
      if (screen.id === screenId) {
        return {
          ...screen,
          components: screen.components.map(component => {
            if (component.id === componentId) {
              return {
                ...component,
                ...updates,
                id: componentId, // Prevent ID from being changed
              };
            }
            return component;
          }),
          updatedAt: new Date().toISOString(),
        };
      }
      return screen;
    }));
  }, []);

  /**
   * Delete a component from a screen
   */
  const deleteComponent = useCallback((screenId: string, componentId: string): void => {
    setScreens(prev => prev.map(screen => {
      if (screen.id === screenId) {
        return {
          ...screen,
          components: screen.components.filter(c => c.id !== componentId),
          updatedAt: new Date().toISOString(),
        };
      }
      return screen;
    }));

    // Clear selection if deleted component was selected
    if (selectedComponentId === componentId) {
      setSelectedComponentId(null);
    }
  }, [selectedComponentId]);

  /**
   * Duplicate a component within a screen
   */
  const duplicateComponent = useCallback((
    screenId: string,
    componentId: string
  ): BuilderComponent | null => {
    const screen = screens.find(s => s.id === screenId);
    if (!screen) {
      return null;
    }

    const componentToDuplicate = screen.components.find(c => c.id === componentId);
    if (!componentToDuplicate) {
      return null;
    }

    const newComponentId = `${componentId}_copy_${Date.now()}`;
    const duplicatedComponent: BuilderComponent = {
      ...componentToDuplicate,
      id: newComponentId,
      label: componentToDuplicate.label
        ? `${componentToDuplicate.label} (Copy)`
        : undefined,
    };

    setScreens(prev => prev.map(s => {
      if (s.id === screenId) {
        const componentIndex = s.components.findIndex(c => c.id === componentId);
        const newComponents = [...s.components];
        newComponents.splice(componentIndex + 1, 0, duplicatedComponent);

        return {
          ...s,
          components: newComponents,
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    }));

    setSelectedComponentId(newComponentId);

    return duplicatedComponent;
  }, [screens]);

  /**
   * Reorder components within a screen
   */
  const reorderComponents = useCallback((screenId: string, newOrder: string[]): void => {
    setScreens(prev => prev.map(screen => {
      if (screen.id === screenId) {
        const componentsMap = new Map(
          screen.components.map(c => [c.id, c])
        );

        const reorderedComponents = newOrder
          .map(id => componentsMap.get(id))
          .filter((c): c is BuilderComponent => c !== undefined);

        // Ensure all components are included (in case newOrder is incomplete)
        const includedIds = new Set(newOrder);
        const remainingComponents = screen.components.filter(
          c => !includedIds.has(c.id)
        );

        return {
          ...screen,
          components: [...reorderedComponents, ...remainingComponents],
          updatedAt: new Date().toISOString(),
        };
      }
      return screen;
    }));
  }, []);

  // ========================================================================
  // Selection Operations
  // ========================================================================

  /**
   * Select a screen
   */
  const selectScreen = useCallback((screenId: string | null): void => {
    setSelectedScreenId(screenId);
    setSelectedComponentId(null);
  }, []);

  /**
   * Select a component
   */
  const selectComponent = useCallback((componentId: string | null): void => {
    setSelectedComponentId(componentId);
  }, []);

  // ========================================================================
  // Getters
  // ========================================================================

  /**
   * Get a screen by ID
   */
  const getScreen = useCallback((screenId: string): BuilderScreen | undefined => {
    return screens.find(s => s.id === screenId);
  }, [screens]);

  /**
   * Get a component by screen ID and component ID
   */
  const getComponent = useCallback((
    screenId: string,
    componentId: string
  ): BuilderComponent | undefined => {
    const screen = screens.find(s => s.id === screenId);
    return screen?.components.find(c => c.id === componentId);
  }, [screens]);

  // ========================================================================
  // Return
  // ========================================================================

  return {
    // State
    flowId,
    flowName,
    flowVersion,
    screens,
    selectedScreenId,
    selectedComponentId,
    selectedScreen,

    // Setters
    setFlowId,
    setFlowName,
    setFlowVersion,

    // Screen operations
    addScreen,
    updateScreen,
    deleteScreen,
    duplicateScreen,

    // Component operations
    addComponent,
    updateComponent,
    deleteComponent,
    duplicateComponent,
    reorderComponents,

    // Selection
    selectScreen,
    selectComponent,

    // Getters
    getScreen,
    getComponent,
  };
};
