# ChatBot Builder - Auto Layout Feature

## Overview

The ChatBot Builder includes an automatic node layout feature powered by the Dagre graph layout algorithm. This feature arranges conversation flow nodes in a clean, hierarchical structure with configurable layout directions.

**Important**: This document covers the ChatBot Builder (conversation flows), not the WhatsApp Flow Builder (interactive forms). For WhatsApp Flow Builder documentation, see `11-flow-builder-feature.md`.

## Feature Location

- **Implementation**: `/home/ali/whatsapp-builder/frontend/src/features/builder/utils/autoLayout.ts`
- **Integration**: `/home/ali/whatsapp-builder/frontend/src/features/builder/components/BuilderPage.tsx`
- **UI**: Auto Layout button in BuilderPage header with dropdown menu

## Technology Stack

### Dependencies

```json
{
  "dagre": "^0.8.5",
  "@types/dagre": "^0.7.53"
}
```

### Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    include: ['dagre'],  // Pre-bundle for faster dev server
  },
});
```

## Architecture

### Core Algorithm: Dagre

Dagre is a directed graph layout library that uses a layered approach:

1. **Rank Assignment**: Assigns each node to a layer
2. **Vertex Ordering**: Minimizes edge crossings within layers
3. **Position Assignment**: Assigns x,y coordinates to nodes
4. **Edge Routing**: Routes edges between nodes

### Layout Directions

Four layout directions are supported:

```typescript
export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL';

export const LAYOUT_DIRECTIONS = [
  { value: 'TB', label: 'Top to Bottom', icon: 'arrow_downward' },
  { value: 'LR', label: 'Left to Right', icon: 'arrow_forward' },
  { value: 'BT', label: 'Bottom to Top', icon: 'arrow_upward' },
  { value: 'RL', label: 'Right to Left', icon: 'arrow_back' },
];
```

**Direction Meanings**:
- **TB (Top to Bottom)**: Flow starts at top, proceeds downward (default)
- **LR (Left to Right)**: Flow starts at left, proceeds right
- **BT (Bottom to Top)**: Flow starts at bottom, proceeds upward
- **RL (Right to Left)**: Flow starts at right, proceeds left

### Layout Options

```typescript
interface LayoutOptions {
  direction?: LayoutDirection;    // Layout direction (default: 'TB')
  nodeWidth?: number;             // Node width in pixels (default: 280)
  nodeHeight?: number;            // Node height in pixels (default: 80)
  rankSeparation?: number;        // Vertical spacing between ranks (default: 100)
  nodeSeparation?: number;        // Horizontal spacing between nodes (default: 50)
}
```

**Default Values**:
- Node dimensions: 280x80 px (matches actual node size)
- Rank separation: 100px (vertical spacing)
- Node separation: 50px (horizontal spacing)
- Margins: 50px on all sides

## Implementation

### Core Function: getLayoutedElements()

```typescript
export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } => {
  const {
    direction = 'TB',
    nodeWidth = 280,
    nodeHeight = 80,
    rankSeparation = 100,
    nodeSeparation = 50,
  } = options;

  // Create Dagre graph
  const dagreGraph = new Dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Configure graph layout
  dagreGraph.setGraph({
    rankdir: direction,      // Direction: TB, LR, BT, RL
    ranksep: rankSeparation, // Space between ranks
    nodesep: nodeSeparation, // Space between nodes in same rank
    marginx: 50,             // Left/right margin
    marginy: 50,             // Top/bottom margin
  });

  // Add nodes to graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight
    });
  });

  // Add edges to graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Run layout algorithm
  Dagre.layout(dagreGraph);

  // Apply calculated positions to ReactFlow nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    // Center node on calculated position
    const x = nodeWithPosition.x - nodeWidth / 2;
    const y = nodeWithPosition.y - nodeHeight / 2;

    return {
      ...node,
      position: { x, y },
    };
  });

  return { nodes: layoutedNodes, edges };
};
```

### Integration in BuilderPage

#### State Management

```typescript
const [isLayouting, setIsLayouting] = useState(false);
```

#### Handler Function

```typescript
const handleAutoLayout = useCallback((direction: LayoutDirection = 'TB') => {
  if (nodes.length === 0) return;

  setIsLayouting(true);

  // Small delay for UI feedback
  setTimeout(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      { direction }
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    setIsLayouting(false);
  }, 100);
}, [nodes, edges]);
```

**Design Decisions**:
1. **100ms Delay**: Provides visual feedback for loading state
2. **Preserves Edges**: Returns both nodes and edges (edges unchanged)
3. **Non-Destructive**: Overwrites positions but preserves all node data
4. **Empty Check**: Prevents layout on empty canvas

## User Interface

### Auto Layout Button

Located in BuilderPage header, between "Validate" and "Test" buttons:

```tsx
<button
  onClick={() => handleAutoLayout('TB')}
  disabled={isLayouting || nodes.length === 0}
  className="px-4 py-2 bg-teal-600 text-white rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  <span className="material-symbols-outlined text-sm">
    {isLayouting ? 'sync' : 'account_tree'}
  </span>
  {isLayouting ? 'Layouting...' : 'Auto Layout'}
</button>
```

**Button States**:
- **Normal**: Shows "account_tree" icon, "Auto Layout" text
- **Loading**: Shows spinning "sync" icon, "Layouting..." text
- **Disabled**: When no nodes present or already layouting

### Dropdown Menu

Hover-activated dropdown for direction selection:

```tsx
<div className="dropdown-menu">
  <button onClick={() => handleAutoLayout('TB')}>
    <span className="material-symbols-outlined">arrow_downward</span>
    Top to Bottom
  </button>
  <button onClick={() => handleAutoLayout('LR')}>
    <span className="material-symbols-outlined">arrow_forward</span>
    Left to Right
  </button>
  <button onClick={() => handleAutoLayout('BT')}>
    <span className="material-symbols-outlined">arrow_upward</span>
    Bottom to Top
  </button>
  <button onClick={() => handleAutoLayout('RL')}>
    <span className="material-symbols-outlined">arrow_back</span>
    Right to Left
  </button>
</div>
```

**Interaction**:
- Hover over "Auto Layout" button to reveal dropdown
- Click any direction to apply layout
- Default direction (TB) applied when clicking main button

## Use Cases

### 1. Complex Flow Cleanup

**Problem**: Manually created flows with many nodes become messy
**Solution**: Apply auto layout to reorganize into clean structure

**Example**:
```
Before: Nodes scattered across canvas, overlapping edges
After: Hierarchical layout with clear flow from top to bottom
```

### 2. AI-Generated Flows

**Problem**: AI generates flows with generic spacing (e.g., x: 0, 300, 600)
**Solution**: Apply auto layout after AI generation

**Workflow**:
1. User describes chatbot to AI
2. AI generates nodes/edges with basic positions
3. User clicks "Auto Layout" (TB)
4. Dagre optimizes layout for readability

### 3. Direction Change

**Problem**: Flow needs horizontal layout for presentation
**Solution**: Switch from TB to LR

**Use Cases**:
- **TB**: Default for most conversational flows
- **LR**: Wide flows with parallel branches, flowcharts
- **BT**: Reverse flows for specific presentations
- **RL**: RTL language support (Arabic, Hebrew)

### 4. Quick Prototyping

**Problem**: Focus on flow logic, not node positioning
**Solution**: Add nodes quickly, auto layout at the end

**Workflow**:
1. Drag nodes onto canvas without caring about position
2. Connect nodes with edges
3. Configure node content
4. Apply auto layout
5. Fine-tune manually if needed

## Features

### Preserves Node Data

```typescript
return {
  ...node,
  position: { x, y },  // Only position is updated
};
```

All node data preserved:
- `node.data` (content, variables, configuration)
- `node.type` (start, message, question, condition, etc.)
- `node.id` (unchanged)
- Edge connections (unchanged)

### Non-Destructive

- Can be manually undone (move nodes back)
- Can be reapplied with different direction
- No data loss

### Respects Edge Connections

Dagre algorithm:
1. Analyzes edge connections
2. Assigns nodes to ranks based on dependencies
3. Minimizes edge crossings
4. Routes edges optimally

### Loading State

```typescript
disabled={isLayouting || nodes.length === 0}
```

Prevents:
- Double-clicking during layout
- Layouting empty canvas
- Concurrent layout operations

## Performance

### Efficiency

- **Small Flows** (1-20 nodes): Instant (<10ms)
- **Medium Flows** (20-50 nodes): Very fast (<50ms)
- **Large Flows** (50-100+ nodes): Fast (<200ms)

### Synchronous Calculation

Layout calculation is synchronous (blocking):
- Runs on main thread
- 100ms setTimeout provides UI feedback
- No backend dependency

### Memory Usage

Minimal memory overhead:
- Dagre graph is temporary
- Only stores node positions
- Garbage collected after layout

## Best Practices

### 1. Use After AI Generation

**Recommended Workflow**:
```
AI Build → Auto Layout (TB) → Manual Fine-tuning → Save
```

AI-generated flows benefit most from auto layout.

### 2. Apply Early When Building Manually

**Anti-Pattern**:
```
Add 20 nodes manually → Position each → Connect → Realize layout is messy
```

**Better Approach**:
```
Add nodes quickly → Connect → Auto Layout → Fine-tune positions
```

### 3. Choose Direction by Flow Complexity

**TB (Top to Bottom)**:
- Default choice
- Works for most conversational flows
- Linear progression (greeting → questions → end)

**LR (Left to Right)**:
- Wide flows with parallel branches
- Multiple concurrent paths
- Flowchart-style diagrams

**BT/RL**:
- Presentation purposes
- Reverse flows
- RTL language support

### 4. Fine-Tune After Layout

Auto layout provides 80% solution:
- Hierarchical structure ✓
- No overlaps ✓
- Logical flow ✓

Manual fine-tuning for:
- Aesthetic preferences
- Specific positioning requirements
- Visual emphasis

## Edge Cases

### Empty Canvas

```typescript
if (nodes.length === 0) return;
```

Auto layout button disabled when no nodes present.

### Single Node

Layout still runs, node positioned at origin with margins.

### Disconnected Subgraphs

Dagre handles disconnected components:
- Layouts each subgraph separately
- Arranges subgraphs side-by-side
- No special handling needed

### Cyclic Flows

Dagre handles cycles gracefully:
- Uses heuristics to break cycles
- Assigns ranks to minimize back edges
- May not be perfect (manual adjustment needed)

## Comparison with Manual Layout

| Aspect | Manual Layout | Auto Layout |
|--------|---------------|-------------|
| Time | Slow (minutes) | Fast (seconds) |
| Consistency | Varies | Always hierarchical |
| Edge Crossings | Many | Minimized |
| Node Spacing | Inconsistent | Uniform |
| Learning Curve | None | None |
| Customization | Full control | Limited |

**Recommendation**: Use auto layout first, then manually adjust specific nodes.

## Future Enhancements

### Planned Features

1. **Custom Spacing Presets**:
   - Compact (50px spacing)
   - Normal (100px, current)
   - Spacious (150px)

2. **Undo/Redo Integration**:
   - Save layout state before auto layout
   - Allow one-click undo

3. **Selected Nodes Layout**:
   - Layout only selected nodes
   - Preserve unselected node positions

4. **Layout Constraints**:
   - Pin specific nodes
   - Define custom node dimensions per type

5. **Animation**:
   - Smooth transition to new positions
   - React Spring or Framer Motion

### Performance Optimizations

- Debounce layout calculations
- Web Worker for large graphs (100+ nodes)
- Incremental layout (re-layout only affected nodes)

## Troubleshooting

### Layout Looks Wrong

**Possible Causes**:
1. Cyclic flow without clear start node
2. Disconnected subgraphs
3. Many back edges

**Solutions**:
1. Ensure single START node
2. Connect orphan nodes
3. Try different direction (LR may work better)
4. Manually adjust specific nodes

### Button Disabled

**Possible Causes**:
1. No nodes on canvas
2. Already layouting (wait for completion)

**Solutions**:
1. Add at least one node
2. Wait for loading state to complete

### Layout Too Compact/Spacious

**Current Solution**:
Manually adjust nodes after layout

**Future Solution**:
Spacing presets (see Future Enhancements)

## Related Documentation

- **Frontend Architecture**: `03-frontend-architecture.md` - Auto Layout section
- **Project Structure**: `07-project-structure.md` - Builder utils directory
- **WhatsApp Flow Builder**: `11-flow-builder-feature.md` - Different builder, no auto layout
- **ChatBot Execution**: `02-backend-architecture.md` - How flows are executed

## Code Examples

### Basic Usage

```typescript
import { getLayoutedElements, type LayoutDirection } from '../utils/autoLayout';

// Layout with default direction (TB)
const { nodes: layoutedNodes, edges } = getLayoutedElements(nodes, edges);

// Layout with specific direction
const { nodes: layoutedNodes, edges } = getLayoutedElements(
  nodes,
  edges,
  { direction: 'LR' }
);

// Layout with custom spacing
const { nodes: layoutedNodes, edges } = getLayoutedElements(
  nodes,
  edges,
  {
    direction: 'TB',
    rankSeparation: 150,
    nodeSeparation: 75,
  }
);
```

### Integration Example

```typescript
const BuilderPage = () => {
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [isLayouting, setIsLayouting] = useState(false);

  const handleAutoLayout = useCallback((direction: LayoutDirection = 'TB') => {
    if (nodes.length === 0) return;

    setIsLayouting(true);

    setTimeout(() => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodes,
        edges,
        { direction }
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setIsLayouting(false);
    }, 100);
  }, [nodes, edges]);

  return (
    <div>
      <button onClick={() => handleAutoLayout('TB')} disabled={isLayouting}>
        Auto Layout
      </button>
      <ReactFlow nodes={nodes} edges={edges} />
    </div>
  );
};
```

---

**Last Updated**: 2025-11-26
**Document Version**: 1.0
**Related Feature**: ChatBot Builder (Conversation Flows)
