# Custom Nodes in React Flow - Complete Guide

## Overview

React Flow enables developers to create custom nodes by building React components. This approach provides complete flexibility to render any content within nodes, from form inputs to charts and interactive elements.

## Core Concept

"A powerful feature of React Flow is the ability to create custom nodes. This gives you the flexibility to render anything you want within your nodes."

Custom nodes are automatically wrapped by React Flow in an interactive container that:
- Injects essential props (id, position, data)
- Provides selection and dragging functionality
- Manages handle connections

## Implementation Steps

### 1. Create the Component

Build a standard React component that receives node-related props:

```jsx
export function TextUpdaterNode(props) {
  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);

  return (
    <div className="text-updater-node">
      <div>
        <label htmlFor="text">Text:</label>
        <input id="text" name="text" onChange={onChange} className="nodrag" />
      </div>
    </div>
  );
}
```

**Key Detail:** The `nodrag` class prevents the input from triggering node dragging behavior.

### 2. Initialize nodeTypes Object

Define node type mappings outside your component to prevent unnecessary re-renders:

```jsx
const nodeTypes = {
  textUpdater: TextUpdaterNode,
};
```

### 3. Pass to ReactFlow

Provide the nodeTypes configuration:

```jsx
<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  fitView
/>
```

### 4. Reference in Node Definitions

Specify the type in your node data:

```jsx
const nodes = [
  {
    id: 'node-1',
    type: 'textUpdater',
    position: { x: 0, y: 0 },
    data: { value: 123 },
  },
];
```

## Best Practices

- "We generally recommend creating your own custom nodes rather than relying on built-in ones."
- Define `nodeTypes` as constants outside components
- Use the `nodrag` class on interactive elements to prevent interference with drag functionality
- Leverage the `data` object to pass and manage node-specific information

## Advanced Features

Custom nodes support:
- Multiple source and target handles
- Form inputs and user interactions
- Charts and data visualizations
- Complex nested components

## Related Resources

For adding connectivity between nodes, consult the Handles documentation to implement source and target handles on custom nodes.

---

**Kaynak**: [https://reactflow.dev/learn/customization/custom-nodes](https://reactflow.dev/learn/customization/custom-nodes)
**İndirilme Tarihi**: 23 Kasım 2025
