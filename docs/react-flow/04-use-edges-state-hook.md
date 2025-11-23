# useEdgesState() Hook Documentation

## Overview

The `useEdgesState()` hook simplifies state management for controlled flows by allowing developers to manage edge state outside the ReactFlowInstance. It functions similarly to React's `useState` hook but includes a helpful state-update callback.

## Function Signature

```typescript
useEdgesState(initialEdges: EdgeType[]): [
  edges: EdgeType[],
  setEdges: Dispatch<SetStateAction<EdgeType[]>>,
  onEdgesChange: OnEdgesChange<EdgeType>
]
```

## Parameters

| Name | Type | Default |
|------|------|---------|
| `initialEdges` | `EdgeType[]` | Required |

## Return Values

The hook returns a tuple containing three elements:

1. **edges**: The current array of edges suitable for passing directly to the `<ReactFlow />` component's edges prop, or for manipulation before rendering.

2. **setEdges**: A state setter function accepting either a new edge array or a callback function that receives the current array and returns the updated version—matching React's `useState` behavior.

3. **onEdgesChange**: A callback handler that accepts an array of `EdgeChanges` and updates the edges state accordingly. Pass this directly to the ReactFlow component's `onEdgesChange` prop.

## Usage Example

```jsx
import { ReactFlow, useNodesState, useEdgesState } from '@xyflow/react';

const initialNodes = [];
const initialEdges = [];

export default function Flow() {
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

The hook accepts a generic type parameter for custom edge types:

```typescript
const edges = useEdgesState<CustomEdgeType>();
```

Refer to the TypeScript guide for details on defining custom edge type unions.

## Implementation Notes

- **Purpose**: Designed to simplify prototyping and make documentation clearer
- **Production Use**: While acceptable for production, consider using more robust state management solutions like Zustand for complex applications
- **State Updates**: The `onEdgesChange` callback automatically handles edge modifications based on user interactions

## Related Resources

- [useEdges() Hook](/api-reference/hooks/use-edges)
- [useHandleConnections() Hook](/api-reference/hooks/use-handle-connections)
- [Edge Type Documentation](/api-reference/types/edge)

---

**Kaynak**: [https://reactflow.dev/api-reference/hooks/use-edges-state](https://reactflow.dev/api-reference/hooks/use-edges-state)
**İndirilme Tarihi**: 23 Kasım 2025
