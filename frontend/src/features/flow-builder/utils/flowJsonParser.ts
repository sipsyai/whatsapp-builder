/**
 * Flow JSON Parser
 *
 * Converts WhatsApp Flow JSON format to Flow Builder internal state.
 * Includes auto-layout algorithm for positioning screens on the canvas.
 */

import type { XYPosition } from '@xyflow/react';
import type {
  FlowJSON,
  FlowScreen,
  Component,
  Footer,
  NavigateAction,
  FlowJSONVersion,
  EmbeddedLink,
  OptIn,
  NavigationList,
  If,
} from '../types/flow-json.types';
import { isNavigateAction } from '../types/flow-json.types';
import type {
  BuilderScreen,
  BuilderComponent,
  NavigationEdge,
} from '../types/builder.types';

// ============================================================================
// Constants
// ============================================================================

const SCREEN_WIDTH = 300;
const SCREEN_HEIGHT = 200;
const HORIZONTAL_SPACING = 150;
const VERTICAL_SPACING = 100;
const INITIAL_X = 100;
const INITIAL_Y = 100;

// ============================================================================
// Types
// ============================================================================

export interface ParseResult {
  screens: BuilderScreen[];
  edges: NavigationEdge[];
  flowName?: string;
  flowVersion: FlowJSONVersion;
  dataApiVersion?: '3.0';
}

interface NavigationEdgeInfo {
  sourceScreenId: string;
  targetScreenId: string;
  sourceComponentId?: string;
  action: NavigateAction;
  label?: string;
}

interface ScreenGraphNode {
  screenId: string;
  level: number;
  children: string[];
  parents: string[];
}

// ============================================================================
// Main Parser Function
// ============================================================================

/**
 * Parse WhatsApp Flow JSON into Builder state
 *
 * @param flowJson - WhatsApp Flow JSON object
 * @param flowName - Optional flow name (defaults to "Untitled Flow")
 * @returns ParseResult with screens and edges
 */
export function parseFlowJSON(
  flowJson: FlowJSON,
  flowName?: string
): ParseResult {
  // 1. Extract all navigation edges first (needed for layout)
  const navigationEdges = extractNavigationEdges(flowJson.screens);

  // 2. Calculate screen positions using auto-layout
  const screenPositions = calculateScreenPositions(
    flowJson.screens,
    navigationEdges
  );

  // 3. Convert Flow screens to Builder screens
  const screens = flowJson.screens.map((flowScreen) =>
    flowScreenToBuilderScreen(
      flowScreen,
      screenPositions.get(flowScreen.id) || { x: INITIAL_X, y: INITIAL_Y }
    )
  );

  // 4. Convert navigation info to ReactFlow edges
  const edges = navigationEdges.map((edgeInfo, index) =>
    createNavigationEdge(edgeInfo, index)
  );

  return {
    screens,
    edges,
    flowName: flowName || 'Untitled Flow',
    flowVersion: flowJson.version,
    dataApiVersion: flowJson.data_api_version,
  };
}

// ============================================================================
// Screen Conversion
// ============================================================================

/**
 * Convert Flow JSON screen to Builder screen
 *
 * @param screen - Flow JSON screen
 * @param position - Screen position on canvas
 * @returns Builder screen
 */
export function flowScreenToBuilderScreen(
  screen: FlowScreen,
  position: XYPosition
): BuilderScreen {
  const components: BuilderComponent[] = screen.layout.children.map(
    (component, index) => flowComponentToBuilderComponent(component, screen.id, index)
  );

  return {
    id: screen.id,
    title: screen.title,
    data: screen.data,
    terminal: screen.terminal,
    refresh_on_back: screen.refresh_on_back,
    components,
    position,
    validation: {
      isValid: true,
      errors: [],
      warnings: [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Component Conversion
// ============================================================================

/**
 * Convert Flow JSON component to Builder component
 *
 * @param component - Flow JSON component
 * @param screenId - Parent screen ID
 * @param index - Component index in screen
 * @returns Builder component
 */
export function flowComponentToBuilderComponent(
  component: Component,
  screenId: string,
  index: number
): BuilderComponent {
  const id = `component-${screenId}-${index}`;

  return {
    id,
    type: component.type,
    config: component,
    validation: {
      isValid: true,
      errors: [],
      warnings: [],
    },
  };
}

// ============================================================================
// Navigation Edge Extraction
// ============================================================================

/**
 * Extract all navigation edges from Flow JSON screens
 *
 * Scans all components for navigation actions (Footer, EmbeddedLink, OptIn, NavigationList)
 *
 * @param screens - Flow JSON screens
 * @returns Array of navigation edge information
 */
export function extractNavigationEdges(
  screens: FlowScreen[]
): NavigationEdgeInfo[] {
  const edges: NavigationEdgeInfo[] = [];

  for (const screen of screens) {
    const components = screen.layout.children;

    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      const componentId = `component-${screen.id}-${i}`;

      // Extract from different component types
      extractFromComponent(component, screen.id, componentId, edges);
    }
  }

  return edges;
}

/**
 * Extract navigation from a component (recursive for conditional components)
 */
function extractFromComponent(
  component: Component,
  screenId: string,
  componentId: string,
  edges: NavigationEdgeInfo[]
): void {
  switch (component.type) {
    case 'Footer':
      extractFromFooter(component, screenId, componentId, edges);
      break;

    case 'EmbeddedLink':
      extractFromEmbeddedLink(component, screenId, componentId, edges);
      break;

    case 'OptIn':
      extractFromOptIn(component, screenId, componentId, edges);
      break;

    case 'NavigationList':
      extractFromNavigationList(component, screenId, componentId, edges);
      break;

    case 'If':
      extractFromIfComponent(component, screenId, edges);
      break;

    case 'Switch':
      extractFromSwitchComponent(component, screenId, edges);
      break;

    default:
      // Other components don't have navigation
      break;
  }
}

/**
 * Extract navigation from Footer component
 */
function extractFromFooter(
  footer: Footer,
  screenId: string,
  componentId: string,
  edges: NavigationEdgeInfo[]
): void {
  if (isNavigateAction(footer['on-click-action'])) {
    edges.push({
      sourceScreenId: screenId,
      targetScreenId: footer['on-click-action'].next.name,
      sourceComponentId: componentId,
      action: footer['on-click-action'],
      label: typeof footer.label === 'string' ? footer.label : undefined,
    });
  }
}

/**
 * Extract navigation from EmbeddedLink component
 */
function extractFromEmbeddedLink(
  link: EmbeddedLink,
  screenId: string,
  componentId: string,
  edges: NavigationEdgeInfo[]
): void {
  if (isNavigateAction(link['on-click-action'])) {
    edges.push({
      sourceScreenId: screenId,
      targetScreenId: link['on-click-action'].next.name,
      sourceComponentId: componentId,
      action: link['on-click-action'],
      label: typeof link.text === 'string' ? link.text : undefined,
    });
  }
}

/**
 * Extract navigation from OptIn component
 */
function extractFromOptIn(
  optIn: OptIn,
  screenId: string,
  componentId: string,
  edges: NavigationEdgeInfo[]
): void {
  if (optIn['on-click-action'] && isNavigateAction(optIn['on-click-action'])) {
    edges.push({
      sourceScreenId: screenId,
      targetScreenId: optIn['on-click-action'].next.name,
      sourceComponentId: componentId,
      action: optIn['on-click-action'],
      label: typeof optIn.label === 'string' ? optIn.label : undefined,
    });
  }
}

/**
 * Extract navigation from NavigationList component
 */
function extractFromNavigationList(
  list: NavigationList,
  screenId: string,
  componentId: string,
  edges: NavigationEdgeInfo[]
): void {
  // NavigationList can have list-level on-click-action
  if (list['on-click-action'] && isNavigateAction(list['on-click-action'])) {
    edges.push({
      sourceScreenId: screenId,
      targetScreenId: list['on-click-action'].next.name,
      sourceComponentId: componentId,
      action: list['on-click-action'],
      label: typeof list.label === 'string' ? list.label : undefined,
    });
  }

  // Also check individual list items if not dynamic
  if (Array.isArray(list['list-items'])) {
    for (const item of list['list-items']) {
      if (item['on-click-action'] && isNavigateAction(item['on-click-action'])) {
        edges.push({
          sourceScreenId: screenId,
          targetScreenId: item['on-click-action'].next.name,
          sourceComponentId: componentId,
          action: item['on-click-action'],
          label: item['main-content'].title,
        });
      }
    }
  }
}

/**
 * Extract navigation from If conditional component (recursive)
 */
function extractFromIfComponent(
  ifComponent: If,
  screenId: string,
  edges: NavigationEdgeInfo[]
): void {
  // Process 'then' branch
  for (const component of ifComponent.then) {
    extractFromComponent(component, screenId, `${screenId}-if-then`, edges);
  }

  // Process 'else' branch if exists
  if (ifComponent.else) {
    for (const component of ifComponent.else) {
      extractFromComponent(component, screenId, `${screenId}-if-else`, edges);
    }
  }
}

/**
 * Extract navigation from Switch conditional component (recursive)
 */
function extractFromSwitchComponent(
  switchComponent: Component & { type: 'Switch' },
  screenId: string,
  edges: NavigationEdgeInfo[]
): void {
  // Process all case branches
  for (const [caseValue, components] of Object.entries(switchComponent.cases)) {
    for (const component of components) {
      extractFromComponent(
        component as Component,
        screenId,
        `${screenId}-switch-${caseValue}`,
        edges
      );
    }
  }
}

// ============================================================================
// Auto-Layout Algorithm
// ============================================================================

/**
 * Calculate optimal positions for all screens using hierarchical layout
 *
 * Uses a level-based approach:
 * - Level 0: Entry screen (first screen)
 * - Level 1: Screens reachable from entry screen
 * - Level 2: Screens reachable from level 1, etc.
 *
 * @param screens - Flow JSON screens
 * @param edges - Navigation edges
 * @returns Map of screen ID to position
 */
export function calculateScreenPositions(
  screens: FlowScreen[],
  edges: NavigationEdgeInfo[]
): Map<string, XYPosition> {
  const positions = new Map<string, XYPosition>();

  if (screens.length === 0) {
    return positions;
  }

  // Build graph structure
  const graph = buildScreenGraph(screens, edges);

  // Assign levels using BFS from entry screen
  const levels = assignLevels(screens, graph);

  // Group screens by level
  const screensByLevel = new Map<number, string[]>();
  const levelEntries = Array.from(levels.entries());
  for (const [screenId, level] of levelEntries) {
    if (!screensByLevel.has(level)) {
      screensByLevel.set(level, []);
    }
    screensByLevel.get(level)!.push(screenId);
  }

  // Calculate positions for each level
  const levelValues = Array.from(levels.values());
  const maxLevel = levelValues.length > 0 ? Math.max(...levelValues) : 0;
  for (let level = 0; level <= maxLevel; level++) {
    const screensInLevel = screensByLevel.get(level) || [];
    const levelX = INITIAL_X + level * (SCREEN_WIDTH + HORIZONTAL_SPACING);

    // Center screens vertically in their level
    const totalHeight =
      screensInLevel.length * SCREEN_HEIGHT +
      (screensInLevel.length - 1) * VERTICAL_SPACING;
    const startY = INITIAL_Y + Math.max(0, (500 - totalHeight) / 2);

    screensInLevel.forEach((screenId, index) => {
      const y = startY + index * (SCREEN_HEIGHT + VERTICAL_SPACING);
      positions.set(screenId, { x: levelX, y });
    });
  }

  return positions;
}

/**
 * Build screen graph structure
 */
function buildScreenGraph(
  screens: FlowScreen[],
  edges: NavigationEdgeInfo[]
): Map<string, ScreenGraphNode> {
  const graph = new Map<string, ScreenGraphNode>();

  // Initialize nodes
  for (const screen of screens) {
    graph.set(screen.id, {
      screenId: screen.id,
      level: -1,
      children: [],
      parents: [],
    });
  }

  // Add edges
  for (const edge of edges) {
    const sourceNode = graph.get(edge.sourceScreenId);
    const targetNode = graph.get(edge.targetScreenId);

    if (sourceNode && targetNode) {
      if (!sourceNode.children.includes(edge.targetScreenId)) {
        sourceNode.children.push(edge.targetScreenId);
      }
      if (!targetNode.parents.includes(edge.sourceScreenId)) {
        targetNode.parents.push(edge.sourceScreenId);
      }
    }
  }

  return graph;
}

/**
 * Assign levels to screens using BFS
 */
function assignLevels(
  screens: FlowScreen[],
  graph: Map<string, ScreenGraphNode>
): Map<string, number> {
  const levels = new Map<string, number>();

  if (screens.length === 0) {
    return levels;
  }

  // Entry screen is the first screen (or screen with no parents)
  let entryScreenId = screens[0].id;

  // Find screen with no parents (true entry point)
  const graphEntries = Array.from(graph.entries());
  for (const [screenId, node] of graphEntries) {
    if (node.parents.length === 0) {
      entryScreenId = screenId;
      break;
    }
  }

  // BFS to assign levels
  const queue: Array<{ screenId: string; level: number }> = [
    { screenId: entryScreenId, level: 0 },
  ];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { screenId, level } = queue.shift()!;

    if (visited.has(screenId)) {
      continue;
    }

    visited.add(screenId);
    levels.set(screenId, level);

    const node = graph.get(screenId);
    if (node) {
      for (const childId of node.children) {
        if (!visited.has(childId)) {
          queue.push({ screenId: childId, level: level + 1 });
        }
      }
    }
  }

  // Handle disconnected screens (assign them to level 0)
  for (const screen of screens) {
    if (!levels.has(screen.id)) {
      levels.set(screen.id, 0);
    }
  }

  return levels;
}

// ============================================================================
// Edge Creation
// ============================================================================

/**
 * Create ReactFlow navigation edge from edge info
 *
 * @param edgeInfo - Navigation edge information
 * @param index - Edge index (for unique ID)
 * @returns ReactFlow navigation edge
 */
export function createNavigationEdge(
  edgeInfo: NavigationEdgeInfo,
  index: number
): NavigationEdge {
  const edgeId = `edge-${edgeInfo.sourceScreenId}-${edgeInfo.targetScreenId}-${index}`;

  return {
    id: edgeId,
    source: edgeInfo.sourceScreenId,
    target: edgeInfo.targetScreenId,
    type: 'default',
    animated: true,
    data: {
      action: edgeInfo.action,
      label: edgeInfo.label,
      sourceScreenId: edgeInfo.sourceScreenId,
      sourceComponentId: edgeInfo.sourceComponentId,
      animated: true,
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if Flow JSON is valid
 *
 * @param flowJson - Flow JSON object
 * @returns true if valid, false otherwise
 */
export function isValidFlowJSON(flowJson: unknown): flowJson is FlowJSON {
  if (!flowJson || typeof flowJson !== 'object') {
    return false;
  }

  const json = flowJson as Partial<FlowJSON>;

  return (
    typeof json.version === 'string' &&
    Array.isArray(json.screens) &&
    json.screens.length > 0
  );
}

/**
 * Get statistics about the parsed flow
 *
 * @param parseResult - Parse result
 * @returns Flow statistics
 */
export function getFlowStatistics(parseResult: ParseResult) {
  const totalScreens = parseResult.screens.length;
  const totalEdges = parseResult.edges.length;
  const totalComponents = parseResult.screens.reduce(
    (sum, screen) => sum + screen.components.length,
    0
  );

  const componentsByType = new Map<string, number>();
  for (const screen of parseResult.screens) {
    for (const component of screen.components) {
      const count = componentsByType.get(component.type) || 0;
      componentsByType.set(component.type, count + 1);
    }
  }

  const terminalScreens = parseResult.screens.filter(
    (screen) => screen.terminal
  ).length;

  return {
    totalScreens,
    totalEdges,
    totalComponents,
    componentsByType: Object.fromEntries(componentsByType),
    terminalScreens,
    entryScreen: parseResult.screens[0]?.id,
    version: parseResult.flowVersion,
  };
}
