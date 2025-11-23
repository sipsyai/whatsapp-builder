# <ReactFlowProvider />

The `<ReactFlowProvider />` component is a context provider enabling access to a flow's internal state outside the `<ReactFlow />` component. Many React Flow hooks depend on this wrapper to function properly.

## Overview

This provider component makes it possible for child components to utilize React Flow's internal state through hooks like `useNodes()`, `useEdges()`, and others.

## Basic Usage

```tsx
import { ReactFlow, ReactFlowProvider, useNodes } from '@xyflow/react'

export default function Flow() {
  return (
    <ReactFlowProvider>
      <ReactFlow nodes={...} edges={...} />
      <Sidebar />
    </ReactFlowProvider>
  )
}

function Sidebar() {
  // This hook only works within a ReactFlowProvider
  const nodes = useNodes()

  return (
    <aside>
      {nodes.map((node) => (
        <div key={node.id}>
          Node {node.id} - x: {node.position.x.toFixed(2)},
          y: {node.position.y.toFixed(2)}
        </div>
      ))}
    </aside>
  )
}
```

## Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `initialNodes` | `Node[]` | — | Nodes used to initialize the flow (non-dynamic) |
| `initialEdges` | `Edge[]` | — | Edges used to initialize the flow (non-dynamic) |
| `defaultNodes` | `Node[]` | — | Alternative nodes initialization prop |
| `defaultEdges` | `Edge[]` | — | Alternative edges initialization prop |
| `initialWidth` | `number` | — | Initial width for server-side fitView support |
| `initialHeight` | `number` | — | Initial height for server-side fitView support |
| `fitView` | `boolean` | — | Auto-zooms and pans to fit initial nodes |
| `initialFitViewOptions` | `FitViewOptionsBase` | — | Customizes fitView behavior |
| `initialMinZoom` | `number` | — | Initial minimum zoom level |
| `initialMaxZoom` | `number` | — | Initial maximum zoom level |
| `nodeOrigin` | `NodeOrigin` | `[0, 0]` | Node origin point for positioning |
| `nodeExtent` | `CoordinateExtent` | — | Boundary constraints for node placement |
| `children` | `ReactNode` | — | Child components |

## Important Notes

- **Router Integration:** Place `<ReactFlowProvider />` *outside* your router if you need flow state to persist across route changes.
- **Multiple Flows:** Each flow on the same page requires its own separate `<ReactFlowProvider />` instance.
