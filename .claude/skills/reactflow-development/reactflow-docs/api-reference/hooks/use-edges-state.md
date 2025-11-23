# useEdgesState()

[Source on GitHub](https://github.com/xyflow/xyflow/blob/main/packages/react/src/hooks/useNodesEdgesState.ts)

This hook streamlines prototyping by letting you manage node and edge state outside the `ReactFlowInstance`. Think of it as React's `useState` with an extra helper callback built in.

## Basic Usage

```jsx
import { ReactFlow, useNodesState, useEdgesState } from '@xyflow/react';

const initialNodes = [];
const initialEdges = [];

export default function () {
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

## Signature

**Parameters:**
- `initialEdges`: `EdgeType[]`

**Returns:**
- `edges`: Current array of edges to pass to the `edges` prop
- `setEdges`: Function to update edges (accepts new array or callback)
- `onEdgesChange`: Callback that processes `EdgeChanges` and updates state

## TypeScript

This hook accepts a generic type argument for custom edge types:

```tsx
const edges = useEdgesState<CustomEdgeType>();
```

See the [TypeScript guide](/learn/advanced-use/typescript#nodetype-edgetype-unions) for more details.

## Notes

While suitable for production, this hook was designed primarily for prototyping and clearer documentation examples. For sophisticated state management, consider alternatives like Zustand.
