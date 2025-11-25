/**
 * Flow JSON Generator
 *
 * Converts Flow Builder state to WhatsApp Flow JSON format.
 * This utility handles the transformation of BuilderScreen and BuilderComponent
 * instances into valid WhatsApp Flow JSON structure.
 */

import type {
  FlowJSON,
  FlowScreen,
  FlowJSONVersion,
  Component,
  Layout,
  SingleColumnLayout,
  Action,
  NavigateAction,
  CompleteAction,
  DataExchangeAction,
  UpdateDataAction,
  OpenUrlAction,
  ScreenData,
} from '../types/flow-json.types';

import type {
  BuilderScreen,
  BuilderComponent,
  NavigationEdge,
} from '../types/builder.types';

import type { Edge } from '@xyflow/react';

// ============================================================================
// Generator Options
// ============================================================================

export interface GeneratorOptions {
  /**
   * Target Flow JSON version
   * @default '7.2'
   */
  version?: FlowJSONVersion;

  /**
   * Data API version (required if any screen uses data_exchange action)
   * @default '3.0'
   */
  dataApiVersion?: '3.0';

  /**
   * Whether to include routing_model in output
   * @default false
   */
  includeRoutingModel?: boolean;

  /**
   * Whether to remove undefined/null values from output
   * @default true
   */
  cleanOutput?: boolean;

  /**
   * Whether to include screen positions as metadata (non-standard extension)
   * @default false
   */
  includeMetadata?: boolean;
}

// ============================================================================
// Main Generator Function
// ============================================================================

/**
 * Generate WhatsApp Flow JSON from Builder state
 *
 * @param screens - Array of builder screens
 * @param edges - Array of ReactFlow edges (for routing model)
 * @param options - Generator options
 * @returns Complete Flow JSON structure
 *
 * @example
 * ```typescript
 * const flowJSON = generateFlowJSON(screens, edges, {
 *   version: '7.2',
 *   dataApiVersion: '3.0',
 *   includeRoutingModel: true,
 * });
 * ```
 */
export function generateFlowJSON(
  screens: BuilderScreen[],
  edges: Edge[] | NavigationEdge[] = [],
  options: GeneratorOptions = {}
): FlowJSON {
  const {
    version = '7.2',
    dataApiVersion = '3.0',
    includeRoutingModel = false,
    cleanOutput = true,
  } = options;

  // Convert screens to Flow JSON format
  const flowScreens = screens.map(screen => builderScreenToFlowScreen(screen, options));

  // Build base Flow JSON
  const flowJSON: FlowJSON = {
    version,
    data_api_version: dataApiVersion,
    screens: flowScreens,
  };

  // Add routing model if requested
  if (includeRoutingModel) {
    flowJSON.routing_model = generateRoutingModel(screens, edges);
  }

  // Clean output if requested
  if (cleanOutput) {
    return cleanJSON(flowJSON);
  }

  return flowJSON;
}

// ============================================================================
// Screen Conversion
// ============================================================================

/**
 * Convert BuilderScreen to FlowScreen
 *
 * @param screen - Builder screen instance
 * @param options - Generator options
 * @returns Flow JSON screen structure
 */
export function builderScreenToFlowScreen(
  screen: BuilderScreen,
  options: GeneratorOptions = {}
): FlowScreen {
  const { cleanOutput = true } = options;

  // Build layout from components
  const layout = buildLayout(screen.components, options);

  // Build screen data model
  const screenData = buildScreenData(screen);

  const flowScreen: FlowScreen = {
    id: screen.id,
    title: screen.title,
    terminal: screen.terminal || false,
    layout,
  };

  // Add optional properties
  if (screenData && Object.keys(screenData).length > 0) {
    flowScreen.data = screenData;
  }

  if (screen.refresh_on_back) {
    flowScreen.refresh_on_back = true;
  }

  // Clean if requested
  return cleanOutput ? cleanJSON(flowScreen) : flowScreen;
}

/**
 * Build layout from components
 */
function buildLayout(
  components: BuilderComponent[],
  options: GeneratorOptions = {}
): Layout {
  // Convert each component
  const flowComponents = components
    .filter(comp => {
      // Filter out invisible components if they have visible: false
      if (comp.visible === false) {
        return false;
      }
      return true;
    })
    .map(comp => builderComponentToFlowComponent(comp, options));

  const layout: SingleColumnLayout = {
    type: 'SingleColumnLayout',
    children: flowComponents,
  };

  return layout;
}

/**
 * Build screen data model from screen data property
 */
function buildScreenData(screen: BuilderScreen): ScreenData | undefined {
  if (!screen.data || Object.keys(screen.data).length === 0) {
    return undefined;
  }

  return screen.data;
}

// ============================================================================
// Component Conversion
// ============================================================================

/**
 * Convert BuilderComponent to Flow JSON Component
 *
 * @param component - Builder component instance
 * @param options - Generator options
 * @returns Flow JSON component structure
 */
export function builderComponentToFlowComponent(
  component: BuilderComponent,
  options: GeneratorOptions = {}
): Component {
  const { cleanOutput = true } = options;

  // Start with the config which should already be in the right format
  const flowComponent = {
    type: component.type,
    ...component.config,
  } as Component;

  // Clean if requested
  return cleanOutput ? cleanJSON(flowComponent) : flowComponent;
}

// ============================================================================
// Routing Model Generation
// ============================================================================

/**
 * Generate routing model from screens and edges
 *
 * The routing model maps screen IDs to their possible next screens.
 * This is optional but can be useful for validation and visualization.
 *
 * @param screens - Array of builder screens
 * @param edges - Array of navigation edges
 * @returns Routing model object
 *
 * @example
 * ```typescript
 * {
 *   "WELCOME": ["QUESTIONS", "SUCCESS"],
 *   "QUESTIONS": ["SUCCESS"]
 * }
 * ```
 */
export function generateRoutingModel(
  screens: BuilderScreen[],
  edges: Edge[] | NavigationEdge[]
): Record<string, string[]> {
  const routingModel: Record<string, string[]> = {};

  // Initialize all screens in routing model
  screens.forEach(screen => {
    routingModel[screen.id] = [];
  });

  // Build routing from edges
  edges.forEach(edge => {
    const sourceScreenId = edge.source;
    const targetScreenId = edge.target;

    if (routingModel[sourceScreenId]) {
      // Add target if not already present
      if (!routingModel[sourceScreenId].includes(targetScreenId)) {
        routingModel[sourceScreenId].push(targetScreenId);
      }
    } else {
      routingModel[sourceScreenId] = [targetScreenId];
    }
  });

  // Also extract routing from component actions
  screens.forEach(screen => {
    screen.components.forEach(component => {
      const actions = extractActionsFromComponent(component);

      actions.forEach(action => {
        if (isNavigateAction(action)) {
          const targetScreenId = action.next.name;

          if (routingModel[screen.id]) {
            if (!routingModel[screen.id].includes(targetScreenId)) {
              routingModel[screen.id].push(targetScreenId);
            }
          } else {
            routingModel[screen.id] = [targetScreenId];
          }
        }
      });
    });
  });

  return routingModel;
}

/**
 * Extract all actions from a component
 */
function extractActionsFromComponent(component: BuilderComponent): Action[] {
  const actions: Action[] = [];
  const config = component.config;

  // Check common action properties
  if ('on-click-action' in config && config['on-click-action']) {
    actions.push(config['on-click-action'] as Action);
  }

  if ('on-select-action' in config && config['on-select-action']) {
    actions.push(config['on-select-action'] as Action);
  }

  if ('on-unselect-action' in config && config['on-unselect-action']) {
    actions.push(config['on-unselect-action'] as Action);
  }

  // For conditional components (If, Switch), recursively check children
  if (component.type === 'If' && 'then' in config && config.then) {
    const thenComponents = config.then as Component[];
    thenComponents.forEach(child => {
      // Recursively extract actions from nested components
      const childActions = extractActionsFromConfig(child);
      actions.push(...childActions);
    });

    if ('else' in config && config.else) {
      const elseComponents = config.else as Component[];
      elseComponents.forEach(child => {
        const childActions = extractActionsFromConfig(child);
        actions.push(...childActions);
      });
    }
  }

  if (component.type === 'Switch' && 'cases' in config && config.cases) {
    const cases = config.cases as Record<string, Component[]>;
    Object.values(cases).forEach(caseComponents => {
      caseComponents.forEach(child => {
        const childActions = extractActionsFromConfig(child);
        actions.push(...childActions);
      });
    });
  }

  return actions;
}

/**
 * Extract actions from a component config object
 */
function extractActionsFromConfig(config: Partial<Component>): Action[] {
  const actions: Action[] = [];

  if ('on-click-action' in config && config['on-click-action']) {
    actions.push(config['on-click-action'] as Action);
  }

  if ('on-select-action' in config && config['on-select-action']) {
    actions.push(config['on-select-action'] as Action);
  }

  if ('on-unselect-action' in config && config['on-unselect-action']) {
    actions.push(config['on-unselect-action'] as Action);
  }

  return actions;
}

// ============================================================================
// Action Type Guards
// ============================================================================

function isNavigateAction(action: Action): action is NavigateAction {
  return action.name === 'navigate';
}

function isCompleteAction(action: Action): action is CompleteAction {
  return action.name === 'complete';
}

function isDataExchangeAction(action: Action): action is DataExchangeAction {
  return action.name === 'data_exchange';
}

function isUpdateDataAction(action: Action): action is UpdateDataAction {
  return action.name === 'update_data';
}

function isOpenUrlAction(action: Action): action is OpenUrlAction {
  return action.name === 'open_url';
}

// ============================================================================
// JSON Cleaning Utilities
// ============================================================================

/**
 * Deep clean JSON object by removing undefined, null, and empty values
 *
 * @param obj - Object to clean
 * @returns Cleaned object
 */
export function cleanJSON<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .map(item => cleanJSON(item))
      .filter(item => item !== undefined && item !== null) as T;
  }

  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};

    Object.keys(obj).forEach(key => {
      const value = (obj as Record<string, unknown>)[key];

      // Skip undefined and null
      if (value === undefined || value === null) {
        return;
      }

      // Skip empty arrays
      if (Array.isArray(value) && value.length === 0) {
        return;
      }

      // Skip empty objects
      if (
        typeof value === 'object' &&
        !Array.isArray(value) &&
        Object.keys(value).length === 0
      ) {
        return;
      }

      // Recursively clean nested objects
      cleaned[key] = cleanJSON(value);
    });

    return cleaned as T;
  }

  return obj;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate that generated Flow JSON is structurally correct
 *
 * @param flowJSON - Generated Flow JSON
 * @returns Array of validation errors (empty if valid)
 */
export function validateGeneratedJSON(flowJSON: FlowJSON): string[] {
  const errors: string[] = [];

  // Check required fields
  if (!flowJSON.version) {
    errors.push('Flow JSON must have a version');
  }

  if (!flowJSON.screens || flowJSON.screens.length === 0) {
    errors.push('Flow JSON must have at least one screen');
  }

  // Validate each screen
  flowJSON.screens?.forEach((screen, index) => {
    if (!screen.id) {
      errors.push(`Screen ${index} is missing an id`);
    }

    if (!screen.layout) {
      errors.push(`Screen ${screen.id || index} is missing a layout`);
    }

    if (!screen.layout?.children || screen.layout.children.length === 0) {
      errors.push(`Screen ${screen.id || index} has no components`);
    }

    // Check for terminal screens
    if (screen.terminal) {
      const hasFooter = screen.layout?.children?.some(c => c.type === 'Footer');
      if (!hasFooter) {
        errors.push(`Terminal screen ${screen.id} should have a Footer component`);
      }
    }
  });

  // Check for at least one terminal screen
  const hasTerminalScreen = flowJSON.screens?.some(s => s.terminal);
  if (!hasTerminalScreen) {
    errors.push('Flow should have at least one terminal screen');
  }

  // Validate routing model if present
  if (flowJSON.routing_model) {
    const screenIds = flowJSON.screens?.map(s => s.id) || [];

    Object.entries(flowJSON.routing_model).forEach(([sourceId, targets]) => {
      if (!screenIds.includes(sourceId)) {
        errors.push(`Routing model references unknown screen: ${sourceId}`);
      }

      if (Array.isArray(targets)) {
        targets.forEach(targetId => {
          if (typeof targetId === 'string' && !screenIds.includes(targetId)) {
            errors.push(`Routing model references unknown target screen: ${targetId}`);
          }
        });
      }
    });
  }

  return errors;
}

// ============================================================================
// Export Utilities
// ============================================================================

/**
 * Export Flow JSON as formatted string
 *
 * @param flowJSON - Flow JSON object
 * @param indent - Indentation spaces (default: 2)
 * @returns Formatted JSON string
 */
export function exportFlowJSON(flowJSON: FlowJSON, indent: number = 2): string {
  return JSON.stringify(flowJSON, null, indent);
}

/**
 * Export Flow JSON as minified string
 *
 * @param flowJSON - Flow JSON object
 * @returns Minified JSON string
 */
export function exportFlowJSONMinified(flowJSON: FlowJSON): string {
  return JSON.stringify(flowJSON);
}

/**
 * Calculate Flow JSON size in bytes
 *
 * @param flowJSON - Flow JSON object
 * @returns Size in bytes
 */
export function calculateFlowJSONSize(flowJSON: FlowJSON): number {
  const jsonString = JSON.stringify(flowJSON);
  return new Blob([jsonString]).size;
}

/**
 * Check if Flow JSON exceeds size limit (10 MB)
 *
 * @param flowJSON - Flow JSON object
 * @returns true if within limit, false otherwise
 */
export function isFlowJSONWithinSizeLimit(flowJSON: FlowJSON): boolean {
  const size = calculateFlowJSONSize(flowJSON);
  const maxSize = 10 * 1024 * 1024; // 10 MB
  return size <= maxSize;
}

// ============================================================================
// Helper Exports for Testing
// ============================================================================

export {
  isNavigateAction,
  isCompleteAction,
  isDataExchangeAction,
  isUpdateDataAction,
  isOpenUrlAction,
  extractActionsFromComponent,
  extractActionsFromConfig,
};
