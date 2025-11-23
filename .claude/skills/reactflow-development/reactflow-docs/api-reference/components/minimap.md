# `<MiniMap />`

The `<MiniMap />` component renders an overview of your flow, displaying each node as an SVG element and showing the current viewport position relative to the entire flow.

## Basic Usage

```jsx
import { ReactFlow, MiniMap } from '@xyflow/react';

export default function Flow() {
  return (
    <ReactFlow nodes={[...]} edges={[...]}>
      <MiniMap nodeStrokeWidth={3} />
    </ReactFlow>
  );
}
```

## Props

The component accepts TypeScript type `MiniMapProps`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `PanelPosition` | `BottomRight` | Minimap location on canvas |
| `onClick` | `(event, position) => void` | — | Callback when minimap is clicked |
| `nodeColor` | `string \| function` | `"#e2e2e2"` | Node fill color (accepts function for dynamic colors) |
| `nodeStrokeColor` | `string \| function` | `"transparent"` | Node stroke color |
| `nodeClassName` | `string \| function` | `""` | CSS classes for nodes |
| `nodeBorderRadius` | `number` | `5` | Node corner radius |
| `nodeStrokeWidth` | `number` | `2` | Node border width |
| `nodeComponent` | `ComponentType` | — | Custom SVG node component |
| `bgColor` | `string` | — | Background color |
| `maskColor` | `string` | `"rgba(240, 240, 240, 0.6)"` | Viewport mask overlay color |
| `maskStrokeColor` | `string` | `transparent` | Viewport mask border color |
| `maskStrokeWidth` | `number` | `1` | Viewport mask border width |
| `onNodeClick` | `(event, node) => void` | — | Callback for node clicks |
| `pannable` | `boolean` | `false` | Enable panning via drag |
| `zoomable` | `boolean` | `false` | Enable zooming via scroll |
| `ariaLabel` | `string \| null` | `"Mini Map"` | Accessibility label |
| `inversePan` | `boolean` | — | Invert pan direction |
| `zoomStep` | `number` | `10` | Zoom increment size |
| `offsetScale` | `number` | `5` | Viewport padding offset |

## Examples

### Interactive MiniMap

Enable user interaction by allowing panning and zooming:

```jsx
<ReactFlow nodes={[...]} edges={[...]}>
  <MiniMap pannable zoomable />
</ReactFlow>
```

### Custom Node Component

Pass a custom SVG component to render nodes differently:

```jsx
<MiniMap nodeComponent={MiniMapNode} />

function MiniMapNode({ x, y }) {
  return <circle cx={x} cy={y} r="50" />;
}
```

### Dynamic Node Coloring

Use a function to color nodes based on their type:

```jsx
<MiniMap nodeColor={nodeColor} />

function nodeColor(node) {
  switch (node.type) {
    case 'input':
      return '#6ede87';
    case 'output':
      return '#6865A5';
    default:
      return '#ff0072';
  }
}
```

## TypeScript

The component supports generic custom node types:

```tsx
<MiniMap<CustomNodeType> nodeColor={nodeColor} />
```
