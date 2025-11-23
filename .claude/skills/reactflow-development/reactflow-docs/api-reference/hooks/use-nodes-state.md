# useNodesState()

[Source on GitHub](https://github.com/xyflow/xyflow/blob/main/packages/react/src/hooks/useNodesEdgesState.ts)

This hook simplifies prototyping of controlled flows by managing node and edge state externally from the `ReactFlowInstance`. It functions similarly to React's `useState` hook but includes an additional helper callback.

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
- `initialNodes`: `NodeType[]`

**Returns:**
- `nodes`: The current array of nodes
- `setNodes`: A function to update nodes (accepts new array or callback)
- `onNodesChange`: A callback for handling node changes to pass to `<ReactFlow />`

## TypeScript

This hook accepts a generic type argument for custom node types:

```tsx
const nodes = useNodesState<CustomNodeType>();
```

Refer to the [TypeScript guide](/learn/advanced-use/typescript#nodetype-edgetype-unions) for more details.

## Notes

- Created primarily for easier prototyping and clearer documentation examples
- Acceptable for production use, though more sophisticated state management solutions like Zustand may be preferable for complex applications
