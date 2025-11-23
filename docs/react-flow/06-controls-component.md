# React Flow Controls Component

## Overview

The `<Controls />` component renders a small panel containing convenient buttons for viewport manipulation within a React Flow diagram.

## Core Functionality

"The Controls component renders a small panel that contains convenient buttons to zoom in, zoom out, fit the view, and lock the viewport."

## Basic Usage

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

## Props Reference

For TypeScript users, the component exports a `ControlProps` type.

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `showZoom` | `boolean` | `true` | Toggle visibility of zoom in/out buttons that adjust viewport zoom by fixed increments |
| `showFitView` | `boolean` | `true` | Toggle visibility of fit view button; adjusts viewport so all nodes are visible |
| `showInteractive` | `boolean` | `true` | Toggle visibility of the interactivity lock button |
| `fitViewOptions` | `FitViewOptionsBase<NodeType>` | — | Customize fit view behavior using same options as `fitView()` function |
| `onZoomIn` | `() => void` | — | Callback executed alongside default zoom behavior when zoom in button is clicked |
| `onZoomOut` | `() => void` | — | Callback executed alongside default zoom behavior when zoom out button is clicked |
| `onFitView` | `() => void` | — | Callback when fit view button is clicked; when omitted, default viewport adjustment occurs |
| `onInteractiveChange` | `(status: boolean) => void` | — | Callback triggered when the lock button is clicked |
| `position` | `PanelPosition` | `BottomLeft` | Determines control panel placement on canvas |
| `style` | `CSSProperties` | — | Inline styles applied to container element |
| `className` | `string` | — | CSS class applied to container |
| `aria-label` | `string` | `'React Flow controls'` | Accessibility label for the control panel |
| `orientation` | `"horizontal" \| "vertical"` | `"vertical"` | Layout direction of control buttons |
| `children` | `ReactNode` | — | Custom content within the control panel |

## Customization

To extend or customize the controls, utilize the `<ControlButton />` component for individual button control.

## Key Integration Notes

- The component works within a `<ReactFlow />` wrapper
- All callback props are optional and execute *in addition to* default behaviors
- Position anchoring uses `PanelPosition` enum values
- Fit view behavior can be customized without replacing the entire component

---

**Kaynak**: [https://reactflow.dev/api-reference/components/controls](https://reactflow.dev/api-reference/components/controls)
**İndirilme Tarihi**: 23 Kasım 2025
