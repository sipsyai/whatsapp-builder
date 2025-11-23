# <ReactFlow />

The `<ReactFlow />` component serves as the core of any React Flow application, handling node and edge rendering, user interactions, and optional state management for uncontrolled flows.

## Overview

This component accepts numerous props organized into logical groups. Most props are optional, making it flexible for various use cases.

Basic usage:
```tsx
import { ReactFlow } from '@xyflow/react'

export default function Flow() {
  return <ReactFlow
    nodes={...}
    edges={...}
    onNodesChange={...}
  />
}
```

## Common Props

**Essential configuration options:**

- `nodes` - Array of Node objects to display (controlled)
- `edges` - Array of Edge objects to display (controlled)
- `defaultNodes` - Initial nodes for uncontrolled flows
- `defaultEdges` - Initial edges for uncontrolled flows
- `width` / `height` - Fixed dimensions for the container
- `nodeTypes` - Custom node component mappings
- `edgeTypes` - Custom edge component mappings
- `nodeOrigin` - Point of reference for node positioning
- `autoPanOnNodeFocus` - Auto-pan when nodes receive focus (default: true)

## Viewport Props

**Control viewport behavior and display:**

- `defaultViewport` - Initial position and zoom level
- `viewport` - Controlled viewport state
- `onViewportChange` - Handler for viewport updates
- `fitView` - Auto-fit all nodes on load
- `minZoom` / `maxZoom` - Zoom boundaries
- `snapToGrid` - Enable grid snapping for nodes
- `translateExtent` - Boundary limits for panning
- `nodeExtent` - Boundary limits for node placement
- `preventScrolling` - Block page scrolling over flow (default: true)

## Edge Props

**Customize edge rendering and behavior:**

- `elevateEdgesOnSelect` - Raise selected edges to top layer
- `defaultMarkerColor` - Color for edge arrow markers
- `defaultEdgeOptions` - Defaults applied to all new edges
- `edgesReconnectable` - Allow edge source/target reconnection
- `reconnectRadius` - Activation radius for edge reconnection

## Event Handlers

### General Events

- `onError` - Handle React Flow errors
- `onInit` - Called when viewport initializes
- `onDelete` - Fired when elements are deleted
- `onBeforeDelete` - Pre-deletion hook to allow/modify deletions

### Node Events

- `onNodeClick` / `onNodeDoubleClick` - Click handlers
- `onNodeDragStart` / `onNodeDrag` / `onNodeDragStop` - Drag lifecycle
- `onNodeMouseEnter` / `onNodeMouseMove` / `onNodeMouseLeave` - Mouse tracking
- `onNodeContextMenu` - Right-click handler
- `onNodesDelete` - When nodes are removed
- `onNodesChange` - State updates for controlled flows

### Edge Events

- `onEdgeClick` / `onEdgeDoubleClick` - Click handlers
- `onEdgeMouseEnter` / `onEdgeMouseMove` / `onEdgeMouseLeave` - Mouse tracking
- `onEdgeContextMenu` - Right-click handler
- `onReconnect` - When edge endpoints are reconnected
- `onEdgesDelete` - When edges are removed
- `onEdgesChange` - State updates for controlled flows

### Connection Events

- `onConnect` - New connection created
- `onConnectStart` / `onConnectEnd` - Connection lifecycle
- `isValidConnection` - Validate new connections before creation

### Pane Events

- `onMove` / `onMoveStart` / `onMoveEnd` - Pan/zoom tracking
- `onPaneClick` / `onPaneContextMenu` - Canvas interaction
- `onPaneScroll` / `onPaneMouseMove` / `onPaneMouseEnter` / `onPaneMouseLeave` - Pane mouse events

### Selection Events

- `onSelectionChange` - Selection state updates
- `onSelectionDragStart` / `onSelectionDrag` / `onSelectionDragStop` - Bulk node dragging

## Interaction Props

**User interaction settings:**

- `nodesDraggable` - Enable/disable node movement (default: true)
- `nodesConnectable` - Enable/disable connections (default: true)
- `nodesFocusable` / `edgesFocusable` - Tab navigation support
- `elementsSelectable` - Click-to-select elements (default: true)
- `autoPanOnConnect` - Pan during connection creation
- `autoPanOnNodeDrag` - Pan during node dragging
- `panOnDrag` - Click-drag to pan viewport (default: true)
- `selectionOnDrag` - Create selection box without modifier key
- `panOnScroll` - Scroll to pan (default: false)
- `zoomOnScroll` / `zoomOnPinch` / `zoomOnDoubleClick` - Zoom triggers
- `connectOnClick` - Click handles to create connections (default: true)
- `connectionMode` - "strict" (source→target only) or "loose"

## Connection Line Props

**Configure the preview line while connecting:**

- `connectionLineType` - Path style (Bezier, Straight, etc.)
- `connectionLineStyle` - CSS styling
- `connectionLineComponent` - Custom line renderer
- `connectionRadius` - Activation radius for connections

## Keyboard Props

**Customize keyboard shortcuts (pass `null` to disable):**

- `deleteKeyCode` - Delete selected elements (default: "Backspace")
- `selectionKeyCode` - Draw selection box (default: "Shift")
- `multiSelectionKeyCode` - Multi-select with click (default: "Meta"/"Control")
- `zoomActivationKeyCode` - Zoom while key held (default: "Meta"/"Control")
- `panActivationKeyCode` - Pan while key held (default: "Space")
- `disableKeyboardA11y` - Disable keyboard accessibility

## Style Props

**Configure interaction class names:**

- `noPanClassName` - Prevent panning on element (default: "nopan")
- `noDragClassName` - Prevent node dragging (default: "nodrag")
- `noWheelClassName` - Prevent scroll zooming (default: "nowheel")

## Important Notes

- Event handlers should be defined outside components or wrapped with `useCallback` to prevent infinite re-renders
- Component props are exported as `ReactFlowProps` type
- Attribution can be customized via the `attributionPosition` prop
