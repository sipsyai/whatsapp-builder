# <Controls />

The `<Controls />` component renders a compact panel featuring convenient buttons for viewport management, including zoom in/out, fit view, and lock interactivity controls.

## Import

```tsx
import { ReactFlow, Controls } from '@xyflow/react'

export default function Flow() {
  return (
    <ReactFlow nodes={[...]} edges={[...]}>
      <Controls />
    </ReactFlow>
  )
}
```

## Props

TypeScript users can reference the `ControlProps` type for this component.

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `showZoom` | `boolean` | `true` | Displays zoom in and out buttons that adjust viewport by a fixed increment |
| `showFitView` | `boolean` | `true` | Shows button to fit all nodes within viewport |
| `showInteractive` | `boolean` | `true` | Displays button for toggling interactivity/lock state |
| `fitViewOptions` | `FitViewOptionsBase<NodeType>` | — | Customizes fit view behavior with same options as fitView function |
| `onZoomIn` | `() => void` | — | Callback triggered alongside default zoom behavior when zoom in button clicked |
| `onZoomOut` | `() => void` | — | Callback triggered alongside default zoom behavior when zoom out button clicked |
| `onFitView` | `() => void` | — | Callback when fit view clicked; when omitted, viewport automatically adjusts to show all nodes |
| `onInteractiveChange` | `(interactiveStatus: boolean) => void` | — | Callback when lock button activated |
| `position` | `PanelPosition` | `PanelPosition.BottomLeft` | Controls panel placement |
| `style` | `CSSProperties` | — | Custom styles for container |
| `className` | `string` | — | CSS class for container |
| `aria-label` | `string` | `'React Flow controls'` | Accessibility label |
| `orientation` | `"horizontal" \| "vertical"` | `'vertical'` | Button layout direction |
| `children` | `ReactNode` | — | Additional content |

## Notes

To extend or customize controls functionality, utilize the [`<ControlButton />`](/api-reference/components/control-button) component for creating custom control buttons.
