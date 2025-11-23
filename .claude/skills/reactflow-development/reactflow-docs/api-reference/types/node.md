# Node

The `Node` type represents everything React Flow needs to know about a given node. Many of these properties can be manipulated by React Flow or by you, but some such as `width` and `height` should be considered read-only.

## Fields

| Name | Type | Default |
|------|------|---------|
| `id` | `string` | Unique id of a node. |
| `position` | `XYPosition` | Position of a node on the pane. |
| `data` | `NodeData` | Arbitrary data passed to a node. |
| `sourcePosition` | `Position` | Controls source position for default, source, target nodeType. |
| `targetPosition` | `Position` | Controls target position for default, source, target nodeType. |
| `hidden` | `boolean` | Whether the node should be visible on the canvas. |
| `selected` | `boolean` | Selection state of the node. |
| `dragging` | `boolean` | Whether the node is currently being dragged. |
| `draggable` | `boolean` | Whether the node can be dragged. |
| `selectable` | `boolean` | Whether the node can be selected. |
| `connectable` | `boolean` | Whether the node can form connections. |
| `deletable` | `boolean` | Whether the node can be deleted. |
| `dragHandle` | `string` | Class name for drag handle elements. |
| `width` | `number` | Node width (read-only). |
| `height` | `number` | Node height (read-only). |
| `initialWidth` | `number` | Initial node width. |
| `initialHeight` | `number` | Initial node height. |
| `parentId` | `string` | Parent node id for sub-flows. |
| `zIndex` | `number` | Stacking order. |
| `extent` | `CoordinateExtent \| "parent" \| null` | Movement boundary constraints. |
| `expandParent` | `boolean` | Auto-expand parent when dragged to edge. |
| `ariaLabel` | `string` | Accessibility label. |
| `origin` | `NodeOrigin` | Node origin relative to position. |
| `handles` | `NodeHandle[]` | Connection handles. |
| `measured` | `{ width?: number; height?: number; }` | Measured dimensions. |
| `type` | `string` | Node type from nodeTypes. |
| `style` | `CSSProperties` | Inline styles. |
| `className` | `string` | CSS class name. |
| `resizing` | `boolean` | Whether node is being resized. |
| `focusable` | `boolean` | Whether node can receive focus. |
| `ariaRole` | `AriaRole` | ARIA role for accessibility. |
| `domAttributes` | `HTMLAttributes` | Custom DOM attributes. |

## Default Node Types

You can create React Flow's default nodes by setting the `type` property to:

- `"default"`
- `"input"`
- `"output"`
- `"group"`

Without a `type` property, React Flow defaults to `"default"` with both input and output ports. These default nodes remain available even when you override `nodeTypes`, unless you directly override them.

## Notes

- Do not set `width` or `height` directly. React Flow calculates these internally. Use `style` or `className` properties to control node sizing with CSS.
