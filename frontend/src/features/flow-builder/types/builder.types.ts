/**
 * Flow Builder State TypeScript Type Definitions
 *
 * Types for the visual Flow Builder UI state and component instances.
 * These types represent the internal state of the builder, separate from the Flow JSON format.
 */

import type { Node, Edge } from '@xyflow/react';
import type {
  Component,
  FlowScreen,
  FlowJSON,
  Action,
} from './flow-json.types';

// ============================================================================
// Component Instance Types
// ============================================================================

/**
 * Base properties for all builder components
 */
export interface BaseBuilderComponent {
  id: string;
  type: Component['type'];
  label?: string;
  visible?: boolean;
}

/**
 * Extended component with builder-specific metadata
 */
export interface BuilderComponent extends BaseBuilderComponent {
  // Component configuration (maps to Flow JSON component properties)
  config: Partial<Component>;

  // UI metadata
  position?: {
    x: number;
    y: number;
  };

  // Validation state
  validation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };

  // Parent/child relationships for nested components (If, Switch)
  parentId?: string;
  children?: string[];
}

// ============================================================================
// Screen Types for Builder
// ============================================================================

/**
 * Builder screen extends Flow JSON screen with UI metadata
 */
export interface BuilderScreen extends Omit<FlowScreen, 'layout'> {
  // Components in this screen (flat list)
  components: BuilderComponent[];

  // UI state
  isExpanded?: boolean;
  position?: {
    x: number;
    y: number;
  };

  // Validation
  validation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };

  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// ReactFlow Node Data
// ============================================================================

/**
 * Data stored in ReactFlow nodes (screens)
 */
export interface ScreenNodeData extends Record<string, unknown> {
  screen: BuilderScreen;
  isTerminal?: boolean;
  hasFooter?: boolean;
  componentCount?: number;

  // For visual display
  label: string;
  description?: string;
}

/**
 * ReactFlow node type for screens
 */
export type ScreenNode = Node<ScreenNodeData>;

// ============================================================================
// ReactFlow Edge Data
// ============================================================================

/**
 * Data stored in ReactFlow edges (navigation between screens)
 */
export interface NavigationEdgeData extends Record<string, unknown> {
  action: Action;
  label?: string;

  // Source information
  sourceScreenId: string;
  sourceComponentId?: string; // Which component triggered this navigation

  // Visual styling
  animated?: boolean;
  color?: string;
}

/**
 * ReactFlow edge type for navigation
 */
export type NavigationEdge = Edge<NavigationEdgeData>;

// ============================================================================
// Selection State
// ============================================================================

export interface SelectionState {
  // Currently selected items
  selectedScreenId?: string;
  selectedComponentIds: string[];
  selectedEdgeIds: string[];

  // Multi-selection
  isMultiSelect: boolean;

  // Hover state
  hoveredScreenId?: string;
  hoveredComponentId?: string;
}

// ============================================================================
// Clipboard State
// ============================================================================

export interface ClipboardState {
  type: 'screen' | 'component' | 'components';
  data: BuilderScreen | BuilderComponent | BuilderComponent[];
  timestamp: number;
}

// ============================================================================
// History/Undo State
// ============================================================================

export interface HistoryEntry {
  timestamp: number;
  action: string;
  state: FlowBuilderState;
}

export interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  canUndo: boolean;
  canRedo: boolean;
}

// ============================================================================
// Validation Result
// ============================================================================

export interface ValidationError {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  path: string; // Path to the item (e.g., "screens.0.components.2")
  screenId?: string;
  componentId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  timestamp: number;
}

// ============================================================================
// Component Library
// ============================================================================

export interface ComponentTemplate {
  type: Component['type'];
  name: string;
  description: string;
  category: 'text' | 'input' | 'selection' | 'date' | 'media' | 'navigation' | 'conditional' | 'interactive';
  icon?: string;
  defaultConfig: Partial<Component>;
  previewImage?: string;

  // Constraints
  maxPerScreen?: number;
  requiresDataExchange?: boolean;
  supportedVersions: string[]; // Flow JSON versions that support this component
}

// ============================================================================
// Data Model Builder
// ============================================================================

export interface DataModelField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  defaultValue?: unknown;
  example?: unknown;

  // For arrays and objects
  items?: DataModelField[];
  properties?: Record<string, DataModelField>;

  // UI metadata
  description?: string;
}

export interface DataModel {
  screenId: string;
  fields: DataModelField[];
}

// ============================================================================
// Flow Builder State
// ============================================================================

export interface FlowBuilderState {
  // Flow metadata
  flowId: string;
  flowName: string;
  flowVersion: FlowJSON['version'];
  dataApiVersion?: '3.0';

  // Screens and navigation
  screens: BuilderScreen[];
  nodes: ScreenNode[];
  edges: NavigationEdge[];

  // Selection and interaction
  selection: SelectionState;

  // Clipboard
  clipboard?: ClipboardState;

  // History
  history: HistoryState;

  // Validation
  validation: ValidationResult;

  // Data models
  dataModels: Record<string, DataModel>; // Keyed by screenId

  // UI state
  ui: {
    // Canvas
    zoom: number;
    pan: { x: number; y: number };

    // Panels
    showPropertiesPanel: boolean;
    showComponentLibrary: boolean;
    showDataModelPanel: boolean;
    showValidationPanel: boolean;

    // Modes
    mode: 'design' | 'preview' | 'code';

    // View options
    showGrid: boolean;
    snapToGrid: boolean;
    showMinimap: boolean;
  };

  // Dirty state
  isDirty: boolean;
  lastSaved?: string;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;
}

// ============================================================================
// Builder Actions
// ============================================================================

export type BuilderAction =
  | { type: 'ADD_SCREEN'; payload: { screen: BuilderScreen } }
  | { type: 'UPDATE_SCREEN'; payload: { screenId: string; updates: Partial<BuilderScreen> } }
  | { type: 'DELETE_SCREEN'; payload: { screenId: string } }
  | { type: 'DUPLICATE_SCREEN'; payload: { screenId: string } }

  | { type: 'ADD_COMPONENT'; payload: { screenId: string; component: BuilderComponent } }
  | { type: 'UPDATE_COMPONENT'; payload: { screenId: string; componentId: string; updates: Partial<BuilderComponent> } }
  | { type: 'DELETE_COMPONENT'; payload: { screenId: string; componentId: string } }
  | { type: 'MOVE_COMPONENT'; payload: { screenId: string; componentId: string; targetIndex: number } }
  | { type: 'DUPLICATE_COMPONENT'; payload: { screenId: string; componentId: string } }

  | { type: 'ADD_EDGE'; payload: { edge: NavigationEdge } }
  | { type: 'UPDATE_EDGE'; payload: { edgeId: string; updates: Partial<NavigationEdge> } }
  | { type: 'DELETE_EDGE'; payload: { edgeId: string } }

  | { type: 'SELECT_SCREEN'; payload: { screenId: string } }
  | { type: 'SELECT_COMPONENT'; payload: { componentId: string; addToSelection?: boolean } }
  | { type: 'SELECT_EDGE'; payload: { edgeId: string } }
  | { type: 'CLEAR_SELECTION' }

  | { type: 'COPY'; payload: { type: 'screen' | 'component'; ids: string[] } }
  | { type: 'CUT'; payload: { type: 'screen' | 'component'; ids: string[] } }
  | { type: 'PASTE'; payload: { targetScreenId?: string } }

  | { type: 'UNDO' }
  | { type: 'REDO' }

  | { type: 'UPDATE_DATA_MODEL'; payload: { screenId: string; model: DataModel } }

  | { type: 'VALIDATE_FLOW' }
  | { type: 'SET_VALIDATION_RESULT'; payload: ValidationResult }

  | { type: 'UPDATE_UI'; payload: Partial<FlowBuilderState['ui']> }

  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'SAVE_FLOW' }
  | { type: 'LOAD_FLOW'; payload: { flow: FlowJSON } }

  | { type: 'EXPORT_JSON' }
  | { type: 'IMPORT_JSON'; payload: { json: FlowJSON } };

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a new empty screen
 */
export function createEmptyScreen(id: string): BuilderScreen {
  return {
    id,
    title: 'New Screen',
    components: [],
    terminal: false,
    validation: {
      isValid: true,
      errors: [],
      warnings: [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Create a new component instance
 */
export function createComponent(type: Component['type'], id: string): BuilderComponent {
  return {
    id,
    type,
    config: {},
    validation: {
      isValid: true,
      errors: [],
      warnings: [],
    },
  };
}

/**
 * Convert BuilderScreen to FlowScreen
 */
export function builderScreenToFlowScreen(screen: BuilderScreen): FlowScreen {
  return {
    id: screen.id,
    title: screen.title,
    data: screen.data,
    terminal: screen.terminal,
    layout: {
      type: 'SingleColumnLayout',
      children: screen.components.map(c => c.config as Component),
    },
    refresh_on_back: screen.refresh_on_back,
  };
}

/**
 * Convert FlowScreen to BuilderScreen
 */
export function flowScreenToBuilderScreen(screen: FlowScreen): BuilderScreen {
  const components: BuilderComponent[] = screen.layout.children.map((component, index) => ({
    id: `component-${screen.id}-${index}`,
    type: component.type,
    config: component,
    validation: {
      isValid: true,
      errors: [],
      warnings: [],
    },
  }));

  return {
    id: screen.id,
    title: screen.title,
    data: screen.data,
    terminal: screen.terminal,
    refresh_on_back: screen.refresh_on_back,
    components,
    validation: {
      isValid: true,
      errors: [],
      warnings: [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Convert FlowBuilderState to FlowJSON
 */
export function builderStateToFlowJSON(state: FlowBuilderState): FlowJSON {
  return {
    version: state.flowVersion,
    data_api_version: state.dataApiVersion,
    screens: state.screens.map(builderScreenToFlowScreen),
  };
}

/**
 * Convert FlowJSON to FlowBuilderState
 */
export function flowJSONToBuilderState(
  flowId: string,
  flowName: string,
  flowJSON: FlowJSON
): Partial<FlowBuilderState> {
  const screens = flowJSON.screens.map(flowScreenToBuilderScreen);

  const nodes: ScreenNode[] = screens.map((screen, index) => ({
    id: screen.id,
    type: 'screenNode',
    position: screen.position || { x: 100 + index * 300, y: 100 },
    data: {
      screen,
      isTerminal: screen.terminal,
      hasFooter: screen.components.some(c => c.type === 'Footer'),
      componentCount: screen.components.length,
      label: screen.title || screen.id,
    },
  }));

  return {
    flowId,
    flowName,
    flowVersion: flowJSON.version,
    dataApiVersion: flowJSON.data_api_version,
    screens,
    nodes,
    edges: [],
  };
}
