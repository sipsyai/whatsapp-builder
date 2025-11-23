# React Flow Background Component Guide

## Overview

The `<Background />` component provides convenient rendering of different background pattern types commonly used in node-based UIs. It supports three variants: `lines`, `dots`, and `cross`.

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

## Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | — | "When multiple backgrounds are present on the page, each one should have a unique id." |
| `color` | `string` | — | Defines the pattern's color |
| `bgColor` | `string` | — | Sets the background container color |
| `className` | `string` | — | CSS class for the container element |
| `patternClassName` | `string` | — | CSS class applied to the pattern itself |
| `gap` | `number \| [number, number]` | `20` | Controls spacing between pattern elements; tuple allows independent x/y control |
| `size` | `number` | 1 (lines) or 6 (dots/cross) | Pattern element radius or size |
| `offset` | `number \| [number, number]` | `0` | Pattern positioning offset |
| `lineWidth` | `number` | `1` | Stroke thickness for pattern rendering |
| `variant` | `BackgroundVariant` | `BackgroundVariant.Dots` | Pattern style selection |
| `style` | `CSSProperties` | — | Inline styles for the container |

## Pattern Variants

- **Dots**: Circular dot pattern
- **Lines**: Linear grid pattern
- **Cross**: Crosshatch pattern

## Advanced Techniques

### Layering Multiple Backgrounds

Create visually interesting effects by combining multiple `<Background />` components with different configurations:

```tsx
<ReactFlow defaultNodes={[...]} defaultEdges={[...]}>
  <Background
    id="1"
    gap={10}
    color="#f1f1f1"
    variant={BackgroundVariant.Lines}
  />
  <Background
    id="2"
    gap={100}
    color="#ccc"
    variant={BackgroundVariant.Lines}
  />
</ReactFlow>
```

This approach enables creating grid patterns where accent lines appear at intervals (every 10th line in the example above).

## Important Notes

- **Unique IDs Required**: When using multiple background instances, each must have a distinct `id` prop to prevent rendering conflicts
- The gap property accepts either single values or tuples for independent horizontal/vertical spacing control

---

**Kaynak**: [https://reactflow.dev/api-reference/components/background](https://reactflow.dev/api-reference/components/background)
**İndirilme Tarihi**: 23 Kasım 2025
