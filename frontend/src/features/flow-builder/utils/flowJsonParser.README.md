# Flow JSON Parser

Converts WhatsApp Flow JSON format to Flow Builder internal state with automatic screen layout.

## Overview

The Flow JSON Parser transforms WhatsApp Flow JSON (the official format) into the Flow Builder's internal representation, which separates screens and components into a more workable structure optimized for visual editing.

### Key Features

- **Complete Parsing**: Converts all Flow JSON screens and components to Builder format
- **Auto-Layout**: Automatically positions screens on the canvas using a hierarchical layout algorithm
- **Navigation Extraction**: Identifies all navigation paths from various component types
- **Validation**: Validates Flow JSON structure before parsing
- **Statistics**: Provides detailed statistics about the parsed flow
- **Type-Safe**: Full TypeScript support with comprehensive type definitions

## Usage

### Basic Parsing

```typescript
import { parseFlowJSON, isValidFlowJSON } from './flowJsonParser';
import type { FlowJSON } from '../types/flow-json.types';

const flowJson: FlowJSON = {
  version: '7.2',
  data_api_version: '3.0',
  screens: [
    // ... your screens
  ],
};

// Validate first
if (!isValidFlowJSON(flowJson)) {
  throw new Error('Invalid Flow JSON');
}

// Parse
const result = parseFlowJSON(flowJson, 'My Flow');

// Access parsed data
console.log('Screens:', result.screens);
console.log('Edges:', result.edges);
console.log('Version:', result.flowVersion);
```

### Parse Result Structure

```typescript
interface ParseResult {
  screens: BuilderScreen[];      // Converted screens with positions
  edges: NavigationEdge[];       // All navigation connections
  flowName?: string;             // Optional flow name
  flowVersion: FlowJSONVersion;  // Flow JSON version
  dataApiVersion?: '3.0';        // Data API version
}
```

## API Reference

### Main Functions

#### `parseFlowJSON(flowJson, flowName?)`

Parses WhatsApp Flow JSON into Builder state.

**Parameters:**
- `flowJson: FlowJSON` - The Flow JSON object to parse
- `flowName?: string` - Optional name for the flow (defaults to "Untitled Flow")

**Returns:** `ParseResult`

**Example:**
```typescript
const result = parseFlowJSON(myFlowJson, 'Customer Onboarding');
```

---

#### `flowScreenToBuilderScreen(screen, position)`

Converts a single Flow JSON screen to Builder screen format.

**Parameters:**
- `screen: FlowScreen` - Flow JSON screen
- `position: XYPosition` - Screen position on canvas `{ x: number, y: number }`

**Returns:** `BuilderScreen`

**Example:**
```typescript
const builderScreen = flowScreenToBuilderScreen(
  flowJson.screens[0],
  { x: 100, y: 100 }
);
```

---

#### `flowComponentToBuilderComponent(component, screenId, index)`

Converts a Flow JSON component to Builder component format.

**Parameters:**
- `component: Component` - Flow JSON component
- `screenId: string` - Parent screen ID
- `index: number` - Component index in screen

**Returns:** `BuilderComponent`

**Example:**
```typescript
const builderComponent = flowComponentToBuilderComponent(
  component,
  'WELCOME_SCREEN',
  0
);
```

---

#### `calculateScreenPositions(screens, edges)`

Calculates optimal positions for all screens using hierarchical layout.

**Parameters:**
- `screens: FlowScreen[]` - Array of Flow JSON screens
- `edges: NavigationEdgeInfo[]` - Array of navigation edges

**Returns:** `Map<string, XYPosition>`

**Algorithm:**
- Level 0: Entry screen (first screen or screen with no parents)
- Level 1: Screens directly reachable from entry
- Level 2+: Subsequent levels based on navigation depth
- Screens at the same level are vertically centered

---

#### `extractNavigationEdges(screens)`

Extracts all navigation edges from Flow JSON screens.

Scans all components recursively for navigation actions:
- Footer components
- EmbeddedLink components
- OptIn components
- NavigationList items
- Conditional components (If/Switch branches)

**Parameters:**
- `screens: FlowScreen[]` - Array of Flow JSON screens

**Returns:** `NavigationEdgeInfo[]`

---

### Utility Functions

#### `isValidFlowJSON(flowJson)`

Validates if the provided object is a valid Flow JSON structure.

**Parameters:**
- `flowJson: unknown` - Object to validate

**Returns:** `boolean`

**Example:**
```typescript
if (!isValidFlowJSON(data)) {
  console.error('Invalid Flow JSON structure');
  return;
}
```

---

#### `getFlowStatistics(parseResult)`

Generates detailed statistics about the parsed flow.

**Parameters:**
- `parseResult: ParseResult` - Result from `parseFlowJSON`

**Returns:**
```typescript
{
  totalScreens: number;
  totalEdges: number;
  totalComponents: number;
  componentsByType: Record<string, number>;
  terminalScreens: number;
  entryScreen: string;
  version: FlowJSONVersion;
}
```

**Example:**
```typescript
const stats = getFlowStatistics(result);
console.log(`Flow has ${stats.totalScreens} screens`);
console.log(`Component breakdown:`, stats.componentsByType);
```

---

#### `createNavigationEdge(edgeInfo, index)`

Creates a ReactFlow navigation edge from edge information.

**Parameters:**
- `edgeInfo: NavigationEdgeInfo` - Edge information
- `index: number` - Edge index for unique ID generation

**Returns:** `NavigationEdge`

## Auto-Layout Algorithm

The parser includes a hierarchical auto-layout algorithm that positions screens intelligently based on their navigation relationships.

### Algorithm Steps

1. **Graph Construction**: Build a directed graph of screen relationships
2. **Level Assignment**: Use BFS to assign depth levels starting from entry screen
3. **Horizontal Positioning**: Position screens horizontally based on their level
4. **Vertical Positioning**: Center screens vertically within their level

### Layout Configuration

```typescript
const SCREEN_WIDTH = 300;
const SCREEN_HEIGHT = 200;
const HORIZONTAL_SPACING = 150;  // Space between levels
const VERTICAL_SPACING = 100;    // Space between screens in same level
const INITIAL_X = 100;
const INITIAL_Y = 100;
```

### Layout Behavior

- **Entry Screen**: First screen or screen with no incoming edges
- **Level Grouping**: Screens at same navigation depth are grouped
- **Vertical Centering**: Screens in each level are vertically centered
- **Disconnected Screens**: Assigned to level 0

## Navigation Extraction

The parser automatically extracts navigation edges from multiple component types:

### Supported Components

#### Footer
```typescript
{
  type: 'Footer',
  label: 'Continue',
  'on-click-action': {
    name: 'navigate',
    next: { type: 'screen', name: 'NEXT_SCREEN' }
  }
}
```

#### EmbeddedLink
```typescript
{
  type: 'EmbeddedLink',
  text: 'Learn More',
  'on-click-action': {
    name: 'navigate',
    next: { type: 'screen', name: 'INFO' }
  }
}
```

#### OptIn
```typescript
{
  type: 'OptIn',
  label: 'Agree',
  'on-click-action': {
    name: 'navigate',
    next: { type: 'screen', name: 'TERMS' }
  }
}
```

#### NavigationList
```typescript
{
  type: 'NavigationList',
  'list-items': [
    {
      'main-content': { title: 'Products' },
      'on-click-action': {
        name: 'navigate',
        next: { type: 'screen', name: 'PRODUCTS' }
      }
    }
  ]
}
```

#### Conditional Components (If/Switch)
Navigation is extracted from all branches:
```typescript
{
  type: 'If',
  condition: '${data.isLoggedIn}',
  then: [
    // Navigation extracted from here
  ],
  else: [
    // And from here
  ]
}
```

## Examples

### Example 1: Simple Two-Screen Flow

```typescript
const simpleFlow: FlowJSON = {
  version: '7.2',
  screens: [
    {
      id: 'WELCOME',
      title: 'Welcome',
      layout: {
        type: 'SingleColumnLayout',
        children: [
          {
            type: 'TextHeading',
            text: 'Welcome!',
          },
          {
            type: 'Footer',
            label: 'Continue',
            'on-click-action': {
              name: 'navigate',
              next: { type: 'screen', name: 'FORM' },
            },
          },
        ],
      },
    },
    {
      id: 'FORM',
      title: 'Form',
      terminal: true,
      layout: {
        type: 'SingleColumnLayout',
        children: [
          {
            type: 'TextInput',
            label: 'Name',
            name: 'name',
          },
          {
            type: 'Footer',
            label: 'Submit',
            'on-click-action': { name: 'complete' },
          },
        ],
      },
    },
  ],
};

const result = parseFlowJSON(simpleFlow, 'Welcome Flow');
// Result: 2 screens, 1 edge (WELCOME -> FORM)
```

### Example 2: Multi-Path Flow

```typescript
const multiPathFlow: FlowJSON = {
  version: '7.2',
  screens: [
    {
      id: 'MENU',
      title: 'Menu',
      layout: {
        type: 'SingleColumnLayout',
        children: [
          {
            type: 'NavigationList',
            name: 'menu',
            'list-items': [
              {
                'main-content': { title: 'Option A' },
                'on-click-action': {
                  name: 'navigate',
                  next: { type: 'screen', name: 'SCREEN_A' },
                },
              },
              {
                'main-content': { title: 'Option B' },
                'on-click-action': {
                  name: 'navigate',
                  next: { type: 'screen', name: 'SCREEN_B' },
                },
              },
            ],
          },
        ],
      },
    },
    {
      id: 'SCREEN_A',
      title: 'Screen A',
      terminal: true,
      layout: { type: 'SingleColumnLayout', children: [] },
    },
    {
      id: 'SCREEN_B',
      title: 'Screen B',
      terminal: true,
      layout: { type: 'SingleColumnLayout', children: [] },
    },
  ],
};

const result = parseFlowJSON(multiPathFlow, 'Multi-Path Flow');
// Result: 3 screens, 2 edges (MENU -> SCREEN_A, MENU -> SCREEN_B)
// Auto-layout:
//   Level 0: MENU (x: 100)
//   Level 1: SCREEN_A, SCREEN_B (x: 550, vertically stacked)
```

### Example 3: Statistics Analysis

```typescript
const result = parseFlowJSON(myFlowJson, 'My Flow');
const stats = getFlowStatistics(result);

console.log(`
  Flow: ${result.flowName} (v${stats.version})
  Screens: ${stats.totalScreens} (${stats.terminalScreens} terminal)
  Navigation: ${stats.totalEdges} edges
  Components: ${stats.totalComponents} total
  Entry: ${stats.entryScreen}
`);

// Component breakdown
Object.entries(stats.componentsByType).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});
```

## Type Definitions

### BuilderScreen

```typescript
interface BuilderScreen {
  id: string;
  title?: string;
  data?: ScreenData;
  terminal?: boolean;
  refresh_on_back?: boolean;
  components: BuilderComponent[];
  position?: { x: number; y: number };
  validation?: ValidationResult;
  createdAt?: string;
  updatedAt?: string;
}
```

### BuilderComponent

```typescript
interface BuilderComponent {
  id: string;
  type: Component['type'];
  config: Partial<Component>;
  position?: { x: number; y: number };
  validation?: ValidationResult;
  parentId?: string;
  children?: string[];
}
```

### NavigationEdge

```typescript
interface NavigationEdge extends Edge {
  id: string;
  source: string;
  target: string;
  type: string;
  animated?: boolean;
  data: {
    action: NavigateAction;
    label?: string;
    sourceScreenId: string;
    sourceComponentId?: string;
    animated?: boolean;
  };
}
```

## Best Practices

### 1. Always Validate

```typescript
if (!isValidFlowJSON(data)) {
  throw new Error('Invalid Flow JSON');
}
```

### 2. Handle Edge Cases

```typescript
const result = parseFlowJSON(flowJson);

// Check for disconnected screens
if (result.screens.some(s => !s.position)) {
  console.warn('Some screens have no position');
}

// Verify entry screen
const entryScreen = result.screens[0];
if (!entryScreen) {
  throw new Error('No entry screen found');
}
```

### 3. Use Statistics for Validation

```typescript
const stats = getFlowStatistics(result);

if (stats.terminalScreens === 0) {
  console.warn('No terminal screens - flow may not complete');
}

if (stats.totalEdges === 0) {
  console.warn('No navigation edges - isolated screens');
}
```

### 4. Inspect Auto-Layout Results

```typescript
result.screens.forEach(screen => {
  console.log(`${screen.id}: (${screen.position?.x}, ${screen.position?.y})`);
});
```

## Performance

- **Small Flows** (1-10 screens): < 1ms
- **Medium Flows** (10-50 screens): < 10ms
- **Large Flows** (50-100 screens): < 50ms
- **Extra Large Flows** (100+ screens): < 200ms

The parser uses efficient algorithms:
- BFS for level assignment: O(V + E)
- Map-based lookups: O(1)
- Single-pass component scanning: O(C)

Where V = screens, E = edges, C = total components.

## Error Handling

```typescript
try {
  if (!isValidFlowJSON(data)) {
    throw new Error('Invalid structure');
  }

  const result = parseFlowJSON(data as FlowJSON, 'My Flow');

  // Check for issues
  if (result.screens.length === 0) {
    throw new Error('No screens parsed');
  }

} catch (error) {
  console.error('Parse error:', error);
  // Handle error appropriately
}
```

## Integration with Flow Builder

```typescript
// In your Flow Builder component
import { parseFlowJSON } from './utils/flowJsonParser';

function loadFlowFromJSON(json: FlowJSON) {
  const result = parseFlowJSON(json, 'Imported Flow');

  // Update builder state
  setScreens(result.screens);
  setEdges(result.edges);
  setFlowVersion(result.flowVersion);

  // Initialize ReactFlow
  const nodes = result.screens.map(screen => ({
    id: screen.id,
    type: 'screenNode',
    position: screen.position || { x: 0, y: 0 },
    data: {
      screen,
      label: screen.title || screen.id,
      isTerminal: screen.terminal,
      componentCount: screen.components.length,
    },
  }));

  setNodes(nodes);
}
```

## Related

- [Flow JSON Types](../types/flow-json.types.ts) - WhatsApp Flow JSON type definitions
- [Builder Types](../types/builder.types.ts) - Flow Builder internal types
- [Flow JSON Generator](./flowJsonGenerator.ts) - Convert Builder state back to Flow JSON
- [Examples](./flowJsonParser.example.ts) - Comprehensive usage examples
