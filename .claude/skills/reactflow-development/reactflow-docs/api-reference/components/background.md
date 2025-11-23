# The Background Component

The `<Background />` component provides convenient rendering of common backgrounds used in node-based user interfaces, offering three variants: lines, dots, and cross patterns.

## Overview

This component makes it straightforward to add patterned backgrounds to React Flow applications. It supports customization through various props to control appearance and behavior.

## Basic Usage

```jsx
import { ReactFlow, Background, BackgroundVariant } from '@xyflow/react';

export default function Flow() {
  return (
    <ReactFlow defaultNodes={[...]} defaultEdges={[...]}>
      <Background color="#ccc" variant={BackgroundVariant.Dots} />
    </ReactFlow>
  );
}
```

## Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `id` | string | - | Unique identifier when multiple backgrounds exist on a page |
| `color` | string | - | Pattern color |
| `bgColor` | string | - | Background color |
| `className` | string | - | Container class |
| `patternClassName` | string | - | Pattern class |
| `gap` | number \| [number, number] | 20 | Spacing between pattern elements; tuple allows independent x/y control |
| `size` | number | - | Dot radius or cross size; defaults to 1 or 6 respectively |
| `offset` | number \| [number, number] | 0 | Pattern offset |
| `lineWidth` | number | 1 | Stroke thickness |
| `variant` | BackgroundVariant | Dots | Pattern style |
| `style` | CSSProperties | - | Container styles |

## Layering Multiple Backgrounds

Create more complex patterns by stacking multiple `<Background />` components. This example demonstrates a grid with accent lines every 10th line:

```tsx
import { ReactFlow, Background, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export default function Flow() {
  return (
    <ReactFlow defaultNodes={[...]} defaultEdges={[...]}>
      <Background id="1" gap={10} color="#f1f1f1"
        variant={BackgroundVariant.Lines} />
      <Background id="2" gap={100} color="#ccc"
        variant={BackgroundVariant.Lines} />
    </ReactFlow>
  );
}
```

## Important Notes

- Each `<Background />` component requires a unique `id` prop when multiple instances appear on the same page
- The component integrates seamlessly within `<ReactFlow />` elements
