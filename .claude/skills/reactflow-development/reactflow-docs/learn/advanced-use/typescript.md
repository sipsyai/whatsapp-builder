# Usage with TypeScript

React Flow is written in TypeScript to provide additional type safety. The library exports all necessary types for correctly typing data structures and functions passed to the React Flow component, with support for extending node and edge types.

## Basic Usage

Start with fundamental types needed for a simple implementation:

```typescript
import { useState, useCallback } from 'react';
import {
  ReactFlow,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type FitViewOptions,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  type OnNodeDrag,
  type DefaultEdgeOptions,
} from '@xyflow/react';

const initialNodes: Node[] = [
  { id: '1', data: { label: 'Node 1' }, position: { x: 5, y: 5 } },
  { id: '2', data: { label: 'Node 2' }, position: { x: 5, y: 100 } },
];

const initialEdges: Edge[] = [{ id: 'e1-2', source: '1', target: '2' }];

const fitViewOptions: FitViewOptions = { padding: 0.2 };

const defaultEdgeOptions: DefaultEdgeOptions = { animated: true };

const onNodeDrag: OnNodeDrag = (_, node) => {
  console.log('drag event', node.data);
};

function Flow() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  );
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeDrag={onNodeDrag}
      fitView
      fitViewOptions={fitViewOptions}
      defaultEdgeOptions={defaultEdgeOptions}
    />
  );
}
```

## Custom Nodes

### Multiple Custom Nodes

Pass a specific Node type as a generic to NodeProps:

```typescript
import type { Node, NodeProps } from '@xyflow/react';

type NumberNode = Node<{ number: number }, 'number'>;

export default function NumberNode({ data }: NodeProps<NumberNode>) {
  return <div>A special number: {data.number}</div>;
}
```

Use `type` declarations for separate node data definitions, not interfaces.

### Single Node with Multiple Types

For a component rendering different content based on node type:

```typescript
import type { Node, NodeProps } from '@xyflow/react';

type NumberNode = Node<{ number: number }, 'number'>;
type TextNode = Node<{ text: string }, 'text'>;

type AppNode = NumberNode | TextNode;

export default function CustomNode({ data }: NodeProps<AppNode>) {
  if (data.type === 'number') {
    return <div>A special number: {data.number}</div>;
  }
  return <div>A special text: {data.text}</div>;
}
```

## Custom Edges

Apply the same typing approach to custom edges:

```typescript
import { getStraightPath, BaseEdge, type EdgeProps, type Edge } from '@xyflow/react';

type CustomEdge = Edge<{ value: number }, 'custom'>;

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
}: EdgeProps<CustomEdge>) {
  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  return <BaseEdge id={id} path={edgePath} />;
}
```

## Advanced Usage

### Node and Edge Type Unions

Create union types combining all custom and built-in node/edge types:

```typescript
import type { BuiltInNode, BuiltInEdge } from '@xyflow/react';

import NumberNode from './NumberNode';
import TextNode from './TextNode';
import EditableEdge from './EditableEdge';

export type CustomNodeType = BuiltInNode | NumberNode | TextNode;
export type CustomEdgeType = BuiltInEdge | EditableEdge;
```

### Functions Passed to ReactFlow

Pass union types to callback functions for proper type narrowing:

```typescript
import { type OnNodeDrag } from '@xyflow/react';

const onNodeDrag: OnNodeDrag<CustomNodeType> = useCallback((_, node) => {
  if (node.type === 'number') {
    console.log('drag event', node.data.number);
  }
}, []);

const onNodesChange: OnNodesChange<CustomNodeType> = useCallback(
  (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
  [setNodes],
);
```

### Hooks

Type hook return values using custom unions:

```typescript
import { useReactFlow, useNodeConnections, useNodesData, useStore } from '@xyflow/react';

export default function FlowComponent() {
  const { getNodes, getEdges } = useReactFlow<CustomNodeType, CustomEdgeType>();

  const nodes = useStore((s: ReactFlowState<CustomNodeType>) => s.nodes);

  const connections = useNodeConnections({ handleType: 'target' });

  const nodesData = useNodesData<CustomNodeType>(connections?.[0].source);

  nodesData.forEach(({ type, data }) => {
    if (type === 'number') {
      console.log(data.number);
    }
  });
}
```

### Type Guards

Define type guard functions to filter specific node types:

```typescript
function isNumberNode(node: CustomNodeType): node is NumberNode {
  return node.type === 'number';
}

const numberNodes = nodes.filter(isNumberNode);
```
