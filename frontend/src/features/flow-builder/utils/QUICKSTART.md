# Flow JSON Parser - Quick Start

## Import

```typescript
import { parseFlowJSON, getFlowStatistics } from './utils/flowJsonParser';
import type { FlowJSON } from '../types/flow-json.types';
```

## Basic Usage

```typescript
// 1. Validate (optional but recommended)
if (!isValidFlowJSON(data)) {
  throw new Error('Invalid Flow JSON');
}

// 2. Parse
const result = parseFlowJSON(data, 'My Flow Name');

// 3. Use the parsed data
const { screens, edges, flowVersion } = result;
```

## What You Get

```typescript
result = {
  screens: [
    {
      id: 'SCREEN_1',
      title: 'Screen Title',
      components: [...],
      position: { x: 100, y: 100 },  // Auto-calculated!
      terminal: false,
      validation: { isValid: true, errors: [], warnings: [] }
    }
  ],
  edges: [
    {
      id: 'edge-SCREEN_1-SCREEN_2-0',
      source: 'SCREEN_1',
      target: 'SCREEN_2',
      data: {
        action: { name: 'navigate', ... },
        label: 'Continue',
        sourceComponentId: 'component-SCREEN_1-2'
      }
    }
  ],
  flowName: 'My Flow Name',
  flowVersion: '7.2'
}
```

## Integration with ReactFlow

```typescript
// Convert screens to ReactFlow nodes
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

// Use edges directly
const edges = result.edges;

// Set in ReactFlow
setNodes(nodes);
setEdges(edges);
```

## Get Statistics

```typescript
const stats = getFlowStatistics(result);

console.log(`
  Total Screens: ${stats.totalScreens}
  Total Edges: ${stats.totalEdges}
  Total Components: ${stats.totalComponents}
  Entry Screen: ${stats.entryScreen}
  Version: ${stats.version}
`);

// Component breakdown
Object.entries(stats.componentsByType).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});
```

## Common Patterns

### Load from file

```typescript
const handleFileUpload = async (file: File) => {
  const text = await file.text();
  const flowJson = JSON.parse(text) as FlowJSON;

  if (!isValidFlowJSON(flowJson)) {
    alert('Invalid Flow JSON file');
    return;
  }

  const result = parseFlowJSON(flowJson, file.name);
  loadIntoBuilder(result);
};
```

### Load from API

```typescript
const loadFlowFromAPI = async (flowId: string) => {
  const response = await fetch(`/api/flows/${flowId}`);
  const flowJson = await response.json();

  const result = parseFlowJSON(flowJson, 'API Flow');
  loadIntoBuilder(result);
};
```

### Validate before parsing

```typescript
const safeParseFlow = (data: unknown) => {
  if (!isValidFlowJSON(data)) {
    return {
      success: false,
      error: 'Invalid Flow JSON structure'
    };
  }

  try {
    const result = parseFlowJSON(data, 'Imported Flow');
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Parse error'
    };
  }
};
```

## Auto-Layout Configuration

The parser automatically positions screens. To customize:

```typescript
// Edit these constants in flowJsonParser.ts:
const SCREEN_WIDTH = 300;
const SCREEN_HEIGHT = 200;
const HORIZONTAL_SPACING = 150;  // Between levels
const VERTICAL_SPACING = 100;    // Between screens in same level
const INITIAL_X = 100;
const INITIAL_Y = 100;
```

## Navigation Extraction

The parser automatically extracts navigation from:
- Footer components with navigate action
- EmbeddedLink components with navigate action
- OptIn components with navigate action
- NavigationList items with navigate action
- If component branches (then/else)
- Switch component cases

All extracted edges are available in `result.edges`.

## Error Handling

```typescript
try {
  if (!isValidFlowJSON(data)) {
    throw new Error('Invalid structure');
  }

  const result = parseFlowJSON(data as FlowJSON, 'My Flow');

  if (result.screens.length === 0) {
    throw new Error('No screens found');
  }

  loadIntoBuilder(result);

} catch (error) {
  console.error('Parse error:', error);
  showErrorToUser(error);
}
```

## Examples

See `flowJsonParser.example.ts` for:
- Simple two-screen flow
- Complex multi-path flow
- Conditional navigation flow
- Individual component parsing
- Statistics analysis

## Full Documentation

See `flowJsonParser.README.md` for complete documentation.

## File Locations

```
frontend/src/features/flow-builder/utils/
├── flowJsonParser.ts           ← Main implementation
├── flowJsonParser.example.ts   ← Usage examples
├── flowJsonParser.README.md    ← Full documentation
└── QUICKSTART.md              ← This file
```
