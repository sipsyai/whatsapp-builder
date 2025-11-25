# FlowCanvas Component

The `FlowCanvas` component is the main canvas for the WhatsApp Flow Builder. It provides a visual, node-based interface for creating and editing WhatsApp Flows using ReactFlow.

## Features

- **ReactFlow Integration**: Built on @xyflow/react v12.3.5
- **Custom Nodes**: ScreenNode component for WhatsApp Flow screens
- **Custom Edges**: NavigateEdge component for screen navigation
- **Drag & Drop**: Support for dropping new screens onto the canvas
- **Connection Validation**: Prevents invalid connections (self-connections, duplicate connections)
- **MiniMap**: Overview of the entire flow in bottom-right corner
- **Controls**: Zoom in/out and fit view controls
- **Dark Mode**: Full dark mode support matching the project theme

## Usage

```tsx
import { FlowCanvas } from '@/features/flow-builder/components';
import { useNodesState, useEdgesState } from '@xyflow/react';

function FlowBuilderPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const handleNodeClick = (event, node) => {
    console.log('Node clicked:', node);
  };

  const handleEdgeClick = (event, edge) => {
    console.log('Edge clicked:', edge);
  };

  const handleDrop = (screen, position) => {
    // Create a new node for the dropped screen
    const newNode = {
      id: screen.id,
      type: 'screen',
      position,
      data: {
        screen,
        isTerminal: screen.terminal,
        hasFooter: screen.components.some(c => c.type === 'Footer'),
        componentCount: screen.components.length,
        label: screen.title || screen.id,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div className="h-screen w-full">
      <FlowCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onDrop={handleDrop}
      />
    </div>
  );
}
```

## Props

### FlowCanvasProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `nodes` | `Node<ScreenNodeData>[]` | Yes | Array of ReactFlow nodes representing screens |
| `edges` | `Edge<NavigationEdgeData>[]` | Yes | Array of ReactFlow edges representing navigation |
| `onNodesChange` | `OnNodesChange` | Yes | Handler for node changes (position, selection, etc.) |
| `onEdgesChange` | `OnEdgesChange` | Yes | Handler for edge changes (add, remove, etc.) |
| `onNodeClick` | `(event, node) => void` | No | Handler for node click events |
| `onEdgeClick` | `(event, edge) => void` | No | Handler for edge click events |
| `onDrop` | `(screen, position) => void` | No | Handler for drag & drop of new screens |

## ScreenNode

Custom node component for WhatsApp Flow screens.

### Features
- Visual distinction for terminal screens (green border)
- Component count indicator
- Footer indicator
- Data model indicator
- Validation error display
- Input/output handles for connections

### Node Data Structure

```typescript
interface ScreenNodeData {
  screen: BuilderScreen;
  isTerminal?: boolean;
  hasFooter?: boolean;
  componentCount?: number;
  label: string;
  description?: string;
}
```

## NavigateEdge

Custom edge component for screen navigation.

### Features
- Color coding by action type:
  - Navigate: Blue (#3b82f6)
  - Complete: Green (#22c55e)
  - Data Exchange: Purple (#8b5cf6)
- Hover state (red color)
- Selection state (primary color)
- Label display
- Animated option

### Edge Data Structure

```typescript
interface NavigationEdgeData {
  action: Action;
  label?: string;
  sourceScreenId: string;
  sourceComponentId?: string;
  animated?: boolean;
  color?: string;
}
```

## Connection Validation

The canvas automatically validates connections:

1. **No self-connections**: A screen cannot connect to itself
2. **No connections to start screen**: Prevents connecting to screens with ID starting with "start"
3. **No duplicate connections**: Prevents multiple edges with same source, target, and handle

## Keyboard Shortcuts

- **Delete/Backspace**: Delete selected nodes and edges
- **Control/Meta**: Multi-selection mode
- **Shift**: Selection mode

## Styling

The canvas uses Tailwind CSS with dark mode support:
- Light mode: `bg-zinc-50`
- Dark mode: `bg-[#0a160e]`

Background pattern uses dots with 20px gap and zinc-500 color.

## Integration with Chatbot Builder

This FlowCanvas is specifically designed for WhatsApp Flow Builder but follows similar patterns to the existing chatbot builder in `frontend/src/features/builder/components/BuilderPage.tsx`.

Key differences:
- Screens instead of chatbot nodes (message, question, condition)
- WhatsApp Flow JSON structure
- Component-based screens with layout
- Data model support per screen
