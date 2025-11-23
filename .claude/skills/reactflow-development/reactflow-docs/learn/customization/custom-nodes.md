# Custom Nodes

A powerful feature of React Flow is the ability to create custom nodes. This gives you flexibility to render anything you want within your nodes. We generally recommend creating your own custom nodes rather than relying on built-in ones. With custom nodes, you can add as many source and target handles as you like—or even embed form inputs, charts, and other interactive elements.

In this section, we'll walk through creating a custom node featuring an input field that updates text elsewhere in your application.

## Implementing a Custom Node

To create a custom node, all you need to do is create a React component. React Flow will automatically wrap it in an interactive container that injects essential props like the node's id, position, and data, and provides functionality for selection, dragging, and connecting handles.

### Create the Component

Let's dive into an example by creating a custom node called `TextUpdaterNode`. For this, we've added a simple input field with a change handler.

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

### Initialize nodeTypes

You can add a new node type to React Flow by adding it to the `nodeTypes` prop. Define `nodeTypes` outside of the component to prevent re-renderings.

```jsx
const nodeTypes = {
  textUpdater: TextUpdaterNode,
};
```

### Pass nodeTypes to React Flow

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

### Update Node Definitions

After defining your new node type, you can use it by specifying the `type` property on your node definition:

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

## Full Code Example

To enable your custom node to connect with other nodes, check out the Handles page to learn how to add source and target handles.
