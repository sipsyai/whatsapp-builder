# React Flow `<ReactFlow />` Component API Reference

## Overview

The `<ReactFlow />` component serves as the central element of React Flow applications. It renders nodes and edges, manages user interactions, and can operate as either a controlled or uncontrolled component.

## Component Structure

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

---

## Common Props

Essential properties for typical React Flow implementations:

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `nodes` | `Node[]` | `[]` | Array of nodes in controlled flows |
| `edges` | `Edge[]` | `[]` | Array of edges in controlled flows |
| `defaultNodes` | `Node[]` | — | Initial nodes for uncontrolled flows |
| `defaultEdges` | `Edge[]` | — | Initial edges for uncontrolled flows |
| `width` | `number` | — | Fixed flow width |
| `height` | `number` | — | Fixed flow height |
| `nodeTypes` | `NodeTypes` | Built-in types | Custom node type mappings |
| `edgeTypes` | `EdgeTypes` | Built-in types | Custom edge type mappings |
| `nodeOrigin` | `NodeOrigin` | `[0, 0]` | Node position origin point |
| `nodeDragThreshold` | `number` | `1` | Pixels required to initiate drag |
| `connectionDragThreshold` | `number` | `1` | Pixels to start connection line |
| `paneClickDistance` | `number` | `0` | Pan trigger distance |
| `nodeClickDistance` | `number` | `0` | Node selection distance |
| `autoPanOnNodeFocus` | `boolean` | `true` | Auto-pan when node gains focus |
| `colorMode` | `ColorMode` | `'light'` | Visual theme setting |

---

## Viewport Props

Control viewport positioning, zoom, and bounds:

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `defaultViewport` | `Viewport` | `{x:0, y:0, zoom:1}` | Initial position and zoom |
| `viewport` | `Viewport` | — | Controlled viewport state |
| `onViewportChange` | `Function` | — | Update handler for viewport changes |
| `fitView` | `boolean` | — | Auto-fit nodes on load |
| `fitViewOptions` | `FitViewOptions` | — | Customization for fitView behavior |
| `minZoom` | `number` | `0.5` | Minimum zoom level |
| `maxZoom` | `number` | `2` | Maximum zoom level |
| `snapToGrid` | `boolean` | — | Enable grid snapping |
| `snapGrid` | `SnapGrid` | — | Grid dimensions when enabled |
| `onlyRenderVisibleElements` | `boolean` | `false` | Performance optimization flag |
| `translateExtent` | `CoordinateExtent` | Infinite | Pan boundary constraints |
| `nodeExtent` | `CoordinateExtent` | — | Node placement boundaries |
| `preventScrolling` | `boolean` | `true` | Block page scrolling over flow |
| `attributionPosition` | `PanelPosition` | `'bottom-right'` | Attribution location |

---

## Edge Props

Configure edge rendering and behavior:

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `elevateEdgesOnSelect` | `boolean` | `false` | Raise z-index when selected |
| `defaultMarkerColor` | `string \| null` | `'#b1b1b7'` | Edge marker coloring |
| `defaultEdgeOptions` | `DefaultEdgeOptions` | — | Apply defaults to new edges |
| `reconnectRadius` | `number` | `10` | Reconnection trigger radius |
| `edgesReconnectable` | `boolean` | `true` | Allow edge reconnection |

---

## Event Handlers

### General Events

| Event | Type | Triggered When |
|-------|------|----------------|
| `onError` | `OnError` | React Flow encounters an error |
| `onInit` | `Function` | Viewport initializes |
| `onDelete` | `OnDelete` | Nodes or edges are deleted |
| `onBeforeDelete` | `OnBeforeDelete` | Before deletion (can abort/modify) |

### Node Events

| Event | Type | Triggered When |
|-------|------|----------------|
| `onNodeClick` | `NodeMouseHandler` | User clicks a node |
| `onNodeDoubleClick` | `NodeMouseHandler` | User double-clicks a node |
| `onNodeDragStart` | `OnNodeDrag` | Node drag begins |
| `onNodeDrag` | `OnNodeDrag` | Node is being dragged |
| `onNodeDragStop` | `OnNodeDrag` | Node drag ends |
| `onNodeMouseEnter` | `NodeMouseHandler` | Cursor enters node |
| `onNodeMouseMove` | `NodeMouseHandler` | Cursor moves over node |
| `onNodeMouseLeave` | `NodeMouseHandler` | Cursor leaves node |
| `onNodeContextMenu` | `NodeMouseHandler` | Right-click on node |
| `onNodesDelete` | `OnNodesDelete` | Node deletion occurs |
| `onNodesChange` | `OnNodesChange` | Node state changes (controlled) |

### Edge Events

| Event | Type | Triggered When |
|-------|------|----------------|
| `onEdgeClick` | `Function` | User clicks an edge |
| `onEdgeDoubleClick` | `EdgeMouseHandler` | User double-clicks edge |
| `onEdgeMouseEnter` | `EdgeMouseHandler` | Cursor enters edge |
| `onEdgeMouseMove` | `EdgeMouseHandler` | Cursor moves over edge |
| `onEdgeMouseLeave` | `EdgeMouseHandler` | Cursor leaves edge |
| `onEdgeContextMenu` | `EdgeMouseHandler` | Right-click on edge |
| `onReconnect` | `OnReconnect` | Edge source/target changes |
| `onReconnectStart` | `Function` | Reconnection drag begins |
| `onReconnectEnd` | `Function` | Reconnection drag ends |
| `onEdgesDelete` | `OnEdgesDelete` | Edge deletion occurs |
| `onEdgesChange` | `OnEdgesChange` | Edge state changes (controlled) |

### Connection Events

| Event | Type | Triggered When |
|-------|------|----------------|
| `onConnect` | `OnConnect` | Two nodes are connected |
| `onConnectStart` | `OnConnectStart` | Connection line drag begins |
| `onConnectEnd` | `OnConnectEnd` | Connection drag ends |
| `onClickConnectStart` | `OnConnectStart` | Click-based connection starts |
| `onClickConnectEnd` | `OnConnectEnd` | Click-based connection ends |
| `isValidConnection` | `IsValidConnection` | Validates new connections |

### Pane Events

| Event | Type | Triggered When |
|-------|------|----------------|
| `onMove` | `OnMove` | User pans or zooms |
| `onMoveStart` | `OnMove` | Pan/zoom movement begins |
| `onMoveEnd` | `OnMove` | Pan/zoom movement ends |
| `onPaneClick` | `Function` | User clicks pane background |
| `onPaneContextMenu` | `Function` | Right-click on pane |
| `onPaneScroll` | `Function` | User scrolls over pane |
| `onPaneMouseMove` | `Function` | Cursor moves over pane |
| `onPaneMouseEnter` | `Function` | Cursor enters pane |
| `onPaneMouseLeave` | `Function` | Cursor leaves pane |

### Selection Events

| Event | Type | Triggered When |
|-------|------|----------------|
| `onSelectionChange` | `OnSelectionChangeFunc` | Selected elements change |
| `onSelectionDragStart` | `SelectionDragHandler` | Selection box drag begins |
| `onSelectionDrag` | `SelectionDragHandler` | Selection box is dragged |
| `onSelectionDragStop` | `SelectionDragHandler` | Selection box drag ends |
| `onSelectionStart` | `Function` | Selection interaction begins |
| `onSelectionEnd` | `Function` | Selection interaction ends |
| `onSelectionContextMenu` | `Function` | Right-click selected elements |

---

## Interaction Props

Control user interaction behaviors:

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `nodesDraggable` | `boolean` | `true` | Enable node dragging globally |
| `nodesConnectable` | `boolean` | `true` | Enable connections globally |
| `nodesFocusable` | `boolean` | `true` | Enable Tab/Enter focus on nodes |
| `edgesFocusable` | `boolean` | `true` | Enable Tab/Enter focus on edges |
| `elementsSelectable` | `boolean` | `true` | Allow element selection |
| `autoPanOnConnect` | `boolean` | `true` | Auto-pan during connection creation |
| `autoPanOnNodeDrag` | `boolean` | `true` | Auto-pan during node dragging |
| `autoPanSpeed` | `number` | `15` | Auto-pan velocity |
| `panOnDrag` | `boolean \| number[]` | `true` | Drag-to-pan; array specifies mouse buttons |
| `selectionOnDrag` | `boolean` | `false` | Draw selection box without key press |
| `selectionMode` | `SelectionMode` | `'full'` | Partial or full node selection |
| `panOnScroll` | `boolean` | `false` | Scroll wheel pans viewport |
| `panOnScrollSpeed` | `number` | `0.5` | Scroll pan velocity |
| `panOnScrollMode` | `PanOnScrollMode` | `'free'` | Pan direction constraints |
| `zoomOnScroll` | `boolean` | `true` | Scroll wheel zooms |
| `zoomOnPinch` | `boolean` | `true` | Touch pinch zooms |
| `zoomOnDoubleClick` | `boolean` | `true` | Double-click zooms |
| `selectNodesOnDrag` | `boolean` | `true` | Select nodes while dragging |
| `elevateNodesOnSelect` | `boolean` | `true` | Raise z-index when selected |
| `connectOnClick` | `boolean` | `true` | Click handles to connect |
| `connectionMode` | `ConnectionMode` | `'strict'` | Source-to-target or loose mode |

---

## Connection Line Props

Customize the visual connection line:

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `connectionLineStyle` | `CSSProperties` | — | Inline styles for line |
| `connectionLineType` | `ConnectionLineType` | `Bezier` | Path rendering style |
| `connectionRadius` | `number` | `20` | Handle snap radius |
| `connectionLineComponent` | `ConnectionLineComponent` | — | Custom line renderer |
| `connectionLineContainerStyle` | `CSSProperties` | — | Container styling |

---

## Keyboard Props

Configure keyboard shortcuts (pass `null` to disable):

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `deleteKeyCode` | `KeyCode \| null` | `'Backspace'` | Delete selected elements |
| `selectionKeyCode` | `KeyCode \| null` | `'Shift'` | Draw selection box |
| `multiSelectionKeyCode` | `KeyCode \| null` | Platform-dependent | Multi-select with clicks |
| `zoomActivationKeyCode` | `KeyCode \| null` | Platform-dependent | Zoom while held |
| `panActivationKeyCode` | `KeyCode \| null` | `'Space'` | Pan while held |
| `disableKeyboardA11y` | `boolean` | `false` | Disable keyboard accessibility |

---

## Style Props

Configure CSS class names for interaction control:

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `noPanClassName` | `string` | `"nopan"` | Prevent viewport panning |
| `noDragClassName` | `string` | `"nodrag"` | Prevent node dragging |
| `noWheelClassName` | `string` | `"nowheel"` | Prevent scroll zooming |

---

## Important Notes

- **Event Handler Safety**: Define handlers outside components or use `useCallback` to prevent infinite re-renders
- **Export**: Component props are exported as `ReactFlowProps` type
- **Attribution**: A small attribution link renders in the corner by default; removal requires documentation review
- **Performance**: `onlyRenderVisibleElements` adds overhead but improves performance with large node counts

---

**Kaynak**: [https://reactflow.dev/api-reference/react-flow](https://reactflow.dev/api-reference/react-flow)
**İndirilme Tarihi**: 23 Kasım 2025
