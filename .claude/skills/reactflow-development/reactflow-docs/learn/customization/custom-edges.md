# Custom Edges

Like custom nodes, React Flow's custom edges are just React components, allowing you to render anything along an edge. This guide demonstrates implementing a custom edge with additional controls. For comprehensive edge props reference, see the [Edge documentation](/api-reference/types/edge-props).

## A Basic Custom Edge

Edges render paths between connected nodes using SVG. The `<BaseEdge />` component typically handles this rendering. React Flow provides utility functions to calculate SVG paths:

- `getBezierPath`
- `getSimpleBezierPath`
- `getSmoothStepPath`
- `getStraightPath`

### Create the Component

Start by creating a React component called `CustomEdge` that renders the `<BaseEdge />` component with a calculated path:

```jsx
import { BaseEdge, getStraightPath } from '@xyflow/react';

export function CustomEdge({ id, sourceX, sourceY, targetX, targetY }) {
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
    </>
  );
}
```

### Create `edgeTypes`

Define an `edgeTypes` object mapping your custom edge type to the component:

```jsx
const edgeTypes = {
  'custom-edge': CustomEdge,
};
```

### Pass the `edgeTypes` Prop

Update the `<ReactFlow />` component to include your edge types:

```jsx
export function Flow() {
  return <ReactFlow edgeTypes={edgeTypes} />;
}
```

### Use the New Edge Type

Reference your custom edge in edge data by setting the `type` field:

```jsx
const initialEdges = [
  {
    id: 'e1',
    source: 'n1',
    target: 'n2',
    type: 'custom-edge',
  },
];
```

## Custom SVG Edge Paths

For non-standard shapes (sinusoidal edges, custom curves), you must create SVG paths manually. Path functions return strings passed to the `<BaseEdge />` component's `path` prop.

A simple straight path between points `(x1, y1)` and `(x2, y2)` looks like:

```jsx
M x1 y1 L x2 y2
```

### SVG Path Commands

- **M x1 y1**: Move To—relocates the current point to specified coordinates
- **L x1 y1**: Line To—draws a line from the current point to the target
- **Q x1 y1 x2 y2**: Quadratic Bezier Curve—creates a bezier curve with a control point

Start paths using the `M` command with `sourceX, sourceY`, then use `L` or `Q` commands to shape the path, ending at `targetX, targetY`. Visit the [SVG Path Editor](https://yqnn.github.io/svg-path-editor/) to experiment with path syntax.
