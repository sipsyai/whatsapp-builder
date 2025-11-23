# useNodesState() Hook Documentation

## Overview

The `useNodesState()` hook simplifies prototyping controlled flows by managing node state externally from the `ReactFlowInstance`. It functions similarly to React's `useState` but includes an additional helper callback.

## Basic Signature

```typescript
useNodesState(initialNodes: NodeType[]): [
  nodes: NodeType[],
  setNodes: Dispatch<SetStateAction<NodeType[]>>,
  onNodesChange: OnNodesChange<NodeType>
]
```

## Parameters

| Name | Type | Default |
|------|------|---------|
| `initialNodes` | `NodeType[]` | Required |

## Return Values

The hook returns a tuple containing three elements:

1. **nodes** - The current array of nodes. Pass this to your `<ReactFlow />` component's `nodes` prop, or manipulate it first for layouting operations.

2. **setNodes** - A state setter function accepting either a new node array or a callback receiving the current array and returning an updated one. Mirrors React's `useState` behavior.

3. **onNodesChange** - A callback handler that processes `NodeChange` arrays and updates state accordingly. Typically passed directly to `<ReactFlow />`'s `onNodesChange` prop.

## Usage Example

```jsx
import { ReactFlow, useNodesState, useEdgesState } from '@xyflow/react';

const initialNodes = [];
const initialEdges = [];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
    />
  );
}
```

## TypeScript Support

The hook accepts a generic type parameter for custom node types:

```typescript
const nodes = useNodesState<CustomNodeType>();
```

For details on custom node typing, consult the TypeScript guide section on node/edge type unions.

## Important Notes

- **Purpose**: Created to streamline prototyping and documentation clarity
- **Production Use**: While acceptable for production, consider more sophisticated solutions like Zustand for complex state management scenarios
- **Integration**: Seamlessly works with the existing `<ReactFlow />` component ecosystem

---

**Kaynak**: [https://reactflow.dev/api-reference/hooks/use-nodes-state](https://reactflow.dev/api-reference/hooks/use-nodes-state)
**İndirilme Tarihi**: 23 Kasım 2025
