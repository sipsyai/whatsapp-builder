# Hooks

React Flow provides a comprehensive set of hooks for managing state and interactions within your flow applications.

## Available Hooks

### useConnection()

Returns the current connection during an active connection interaction. Useful for conditionally styling handles based on connection validity.

[Read more](/api-reference/hooks/use-connection)

### useEdges()

Retrieves the current array of edges. Components using this hook re-render whenever edges change.

[Read more](/api-reference/hooks/use-edges)

### useEdgesState()

Simplifies prototyping controlled flows by managing node and edge state externally, similar to React's `useState` with helper callbacks.

[Read more](/api-reference/hooks/use-edges-state)

### useHandleConnections()

Obtains an array of edges connected to a specific handle, re-rendering on edge changes.

[Read more](/api-reference/hooks/use-handle-connections)

### useInternalNode()

Returns the internal node object for a given node ID.

[Read more](/api-reference/hooks/use-internal-node)

### useKeyPress()

Monitors specific key codes and indicates whether they're currently pressed.

[Read more](/api-reference/hooks/use-key-press)

### useNodeConnections()

Provides connected edges for a node, re-rendering on edge modifications.

[Read more](/api-reference/hooks/use-node-connections)

### useNodeId()

Accesses the ID of the current node without drilling props through component trees.

[Read more](/api-reference/hooks/use-node-id)

### useNodes()

Retrieves the current nodes array. Re-renders on any node change, selection, or movement.

[Read more](/api-reference/hooks/use-nodes)

### useNodesData()

Subscribes to data changes for a specific node.

[Read more](/api-reference/hooks/use-nodes-data)

### useNodesInitialized()

Indicates whether all nodes have been measured and dimensioned.

[Read more](/api-reference/hooks/use-nodes-initialized)

### useNodesState()

Enables controlled flow state management externally with helper callbacks.

[Read more](/api-reference/hooks/use-nodes-state)

### useOnSelectionChange()

Listens for node and edge selection changes with a callback function.

[Read more](/api-reference/hooks/use-on-selection-change)

### useOnViewportChange()

Monitors viewport changes including panning and zooming with callbacks for start, change, and end phases.

[Read more](/api-reference/hooks/use-on-viewport-change)

### useReactFlow()

Returns a ReactFlowInstance for updating nodes/edges, manipulating the viewport, and querying flow state.

[Read more](/api-reference/hooks/use-react-flow)

### useStore()

Subscribes to internal React Flow state changes via Zustand.

[Read more](/api-reference/hooks/use-store)

### useStoreApi()

Provides direct store access for on-demand state queries and action dispatching.

[Read more](/api-reference/hooks/use-store-api)

### useUpdateNodeInternals()

Updates internal node dimensions when programmatically adding/removing handles or changing positions.

[Read more](/api-reference/hooks/use-update-node-internals)

### useViewport()

Conveniently reads current viewport state, re-rendering on viewport changes.

[Read more](/api-reference/hooks/use-viewport)

---

*Last updated: November 5, 2025*
