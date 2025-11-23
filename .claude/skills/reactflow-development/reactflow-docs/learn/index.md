# Quick Start

This guide will help you create a working React Flow application in just a few minutes. For a hands-on exploration without coding, visit the interactive [Playground](https://play.reactflow.dev/).

## Installation

### Create a New React Project

Start by setting up a fresh React project using Vite:

```bash
npm init vite my-react-flow-app -- --template react
```

Alternative package managers:
- **pnpm**: `pnpm create vite my-react-flow-app --template react`
- **yarn**: `yarn create vite my-react-flow-app --template react`
- **bun**: `bunx create-vite my-react-flow-app --template react`

### Add React Flow Package

Navigate into your project and install the React Flow library:

```bash
npm install @xyflow/react
```

Alternative commands:
- **pnpm**: `pnpm add @xyflow/react`
- **yarn**: `yarn add @xyflow/react`
- **bun**: `bun add @xyflow/react`

Then start your development server.

## Usage

Replace the contents of `App.jsx` with the following code:

```jsx
import { useState, useCallback } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  { id: 'n2', position: { x: 0, y: 100 }, data: { label: 'Node 2' } },
];
const initialEdges = [{ id: 'n1-n2', source: 'n1', target: 'n2' }];

export default function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback(
    (changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  const onConnect = useCallback(
    (params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      />
    </div>
  );
}
```

### Key Requirements

- **CSS Import**: The stylesheet must be imported for React Flow to function properly
- **Parent Dimensions**: The `<ReactFlow />` component requires a parent element with defined width and height

## Result

Your interactive flow diagram is now ready! 🎉

## Next Steps

- **[Core Concepts](/learn/concepts/terms-and-definitions)** – Understand fundamental React Flow principles
- **[Customization](/learn/customization/custom-nodes)** – Learn to create custom nodes and edges
- **[Examples](/examples)** – Explore pre-built demonstrations
- **[API Reference](/api-reference)** – Access complete documentation
- **[Discord Community](https://discord.gg/RVmnytFmGW)** – Connect with other developers
- **[Template Projects](https://github.com/xyflow/react-flow-example-apps)** – Use ready-made starting points
