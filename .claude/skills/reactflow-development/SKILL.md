---
name: reactflow-development
description: Develop node-based UIs with ReactFlow, create custom nodes and edges, implement hooks, handle interactions. Use when working with ReactFlow, diagrams, node-based editors, interactive flows, or visual graph interfaces.
---

# ReactFlow Development

Expert guidance for building node-based UIs and interactive diagrams with ReactFlow (@xyflow/react).

## Quick start

**Installation:**
```bash
npm install @xyflow/react
```

**Basic setup:**
```jsx
import { ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

function App() {
  const nodes = [
    { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  ];

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow nodes={nodes} />
    </div>
  );
}
```

## Documentation sources

All information comes from local documentation in `reactflow-docs/`:

- **API Reference**: `reactflow-docs/api-reference/` (components, hooks, types)
- **Learning guides**: `reactflow-docs/learn/` (customization, advanced usage)
- **Examples**: `reactflow-docs/examples/`

**Always read relevant documentation files before answering questions.**

## Core instructions

### Answer workflow

1. **Identify topic**: Determine what the user needs (API reference, customization, examples, etc.)

2. **Read documentation**:
   - For API questions → Read from `reactflow-docs/api-reference/`
   - For customization → Read from `reactflow-docs/learn/customization/`
   - For TypeScript → Read from `reactflow-docs/learn/advanced-use/typescript.md`
   - For examples → Read from `reactflow-docs/examples/`

3. **Provide answer**:
   - Include code examples from documentation
   - Reference file paths (e.g., `reactflow-docs/api-reference/react-flow.md:23`)
   - Be specific and concise

### Common tasks

**Creating custom nodes:**
Read `reactflow-docs/learn/customization/custom-nodes.md` and provide examples.

**Creating custom edges:**
Read `reactflow-docs/learn/customization/custom-edges.md` and provide examples.

**Using hooks:**
Check `reactflow-docs/api-reference/hooks/` for specific hooks:
- `use-nodes-state.md` - Node state management
- `use-edges-state.md` - Edge state management

**Component reference:**
Check `reactflow-docs/api-reference/components/` for:
- Background, Controls, Minimap components
- ReactFlowProvider usage

**TypeScript support:**
Read `reactflow-docs/learn/advanced-use/typescript.md` for type definitions.

## Key concepts

**Required setup:**
- Import CSS: `import '@xyflow/react/dist/style.css'`
- Parent must have width/height defined
- Use controlled or uncontrolled mode (nodes/edges or defaultNodes/defaultEdges)

**State management:**
- Controlled: Manage nodes/edges with useState + onChange handlers
- Uncontrolled: Use defaultNodes/defaultEdges
- Use `applyNodeChanges` and `applyEdgeChanges` helpers

**Common props:**
- `nodes`, `edges` - Display elements
- `onNodesChange`, `onEdgesChange` - State updates
- `onConnect` - Handle new connections
- `nodeTypes`, `edgeTypes` - Custom components
- `fitView` - Auto-fit on load

## Response pattern

When answering:

1. Read relevant documentation files
2. Provide direct code examples
3. Include file references for complex topics
4. Keep explanations concise

**Example response:**
```
For custom nodes, create a React component and register it:

[code example from custom-nodes.md]

See reactflow-docs/learn/customization/custom-nodes.md for complete guide.
```

## File organization

```
reactflow-docs/
├── index.md (overview)
├── learn/
│   ├── index.md (quick start)
│   ├── customization/
│   │   ├── custom-nodes.md
│   │   └── custom-edges.md
│   └── advanced-use/
│       └── typescript.md
├── api-reference/
│   ├── react-flow.md (main component)
│   ├── react-flow-provider.md
│   ├── hooks/
│   │   ├── use-nodes-state.md
│   │   └── use-edges-state.md
│   ├── components/
│   │   ├── background.md
│   │   ├── controls.md
│   │   └── minimap.md
│   └── types/
│       ├── index.md
│       └── node.md
└── examples/
    ├── index.md
    └── nodes/
        └── custom-node.md
```

## Best practices

- Always import the CSS file
- Use `useCallback` for event handlers to prevent re-renders
- Define node/edge types outside components
- Use `fitView` for initial viewport setup
- Validate connections with `isValidConnection` prop
- Use TypeScript for better type safety

## Common patterns

**Controlled flow with hooks:**
```jsx
const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
const onConnect = useCallback(
  (params) => setEdges((eds) => addEdge(params, eds)),
  []
);
```

**Custom node types:**
```jsx
const nodeTypes = {
  custom: CustomNode,
  special: SpecialNode,
};

<ReactFlow nodeTypes={nodeTypes} ... />
```

**Plugin components:**
```jsx
<ReactFlow ...>
  <Background />
  <Controls />
  <MiniMap />
</ReactFlow>
```

## When to read documentation

- User asks about specific API → Read corresponding file in `api-reference/`
- User wants examples → Read from `examples/`
- User needs customization → Read from `learn/customization/`
- General questions → Start with `index.md` or `learn/index.md`

## Notes

- ReactFlow is MIT licensed with 33.8K GitHub stars
- Package name: `@xyflow/react`
- Maintained by xyflow team in Berlin
- Used by Stripe, Zapier, Retool, Railway

**Always verify information by reading the documentation files before responding.**
