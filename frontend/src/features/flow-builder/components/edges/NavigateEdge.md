# NavigateEdge Component

Enhanced custom ReactFlow edge component for WhatsApp Flow Builder that visualizes navigation between screens with action-specific styling, hover interactions, and delete functionality.

## Features

### 1. Action-Based Colors
Automatically determines edge color based on the action type:
- **navigate** (Blue): `#3b82f6` - Navigation to another screen
- **complete** (Green): `#22c55e` - Flow completion
- **data_exchange** (Purple): `#8b5cf6` - Data exchange with backend
- **Default** (Gray): `#71717a` - Unknown action types

### 2. Visual Styling
- **Animated dashed line**: `strokeDasharray: '5,5'` for visual movement indication
- **Bezier curve path**: Smooth bezier curves using ReactFlow's `getBezierPath`
- **Dynamic arrow markers**: Arrow color matches edge color (default, selected, hover)
- **Opacity control**: Reduced opacity (0.7) for animated edges
- **Smooth transitions**: 0.2s ease transitions for color and width changes

### 3. Interactive States
- **Default state**: Shows action color with standard stroke width (2px)
- **Selected state**: Primary color (#65C997) with increased width (3px)
- **Hover state**: Red color (#ef4444) with increased width (3px)
- **Wide hit area**: 20px transparent stroke for easier mouse interaction

### 4. Label Display
- Automatic label extraction from `data.label` or `data.action.name`
- Dynamic badge color matching action type
- Scale animation on hover (scale-105)
- Dark mode support with different background colors

### 5. Delete Functionality
- Delete button appears only on hover
- Scale animation (scale-110) when visible
- Confirms deletion on click
- Material Symbols icon integration

## Usage

### Basic Setup

```tsx
import { ReactFlow, type Edge } from '@xyflow/react';
import { NavigateEdge } from '@/features/flow-builder/components/edges';
import type { NavigationEdgeData } from '@/features/flow-builder/types';
import '@xyflow/react/dist/style.css';

// Register edge type
const edgeTypes = {
    navigate: NavigateEdge,
};

function FlowBuilder() {
    const edges: Edge<NavigationEdgeData>[] = [
        {
            id: 'edge-1',
            source: 'screen-1',
            target: 'screen-2',
            type: 'navigate',
            data: {
                action: {
                    name: 'navigate',
                    next: { type: 'screen', name: 'screen-2' },
                },
                label: 'Next',
                sourceScreenId: 'screen-1',
                animated: true,
            },
        },
    ];

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            edgeTypes={edgeTypes}
            fitView
        />
    );
}
```

### Advanced Example with All Action Types

```tsx
const edges: Edge<NavigationEdgeData>[] = [
    // Navigate action (Blue)
    {
        id: 'edge-1',
        source: 'welcome',
        target: 'form',
        type: 'navigate',
        data: {
            action: {
                name: 'navigate',
                next: { type: 'screen', name: 'form' },
                payload: { userId: '${data.user_id}' },
            },
            label: 'Start Form',
            sourceScreenId: 'welcome',
            animated: true,
        },
    },
    // Complete action (Green)
    {
        id: 'edge-2',
        source: 'confirmation',
        target: 'end',
        type: 'navigate',
        data: {
            action: {
                name: 'complete',
                payload: { formData: '${data.form}' },
            },
            label: 'Submit',
            sourceScreenId: 'confirmation',
        },
    },
    // Data exchange action (Purple)
    {
        id: 'edge-3',
        source: 'form',
        target: 'loading',
        type: 'navigate',
        data: {
            action: {
                name: 'data_exchange',
                payload: { action: 'validate_input' },
            },
            label: 'Validate',
            sourceScreenId: 'form',
            sourceComponentId: 'submit-button',
            animated: true,
        },
    },
    // Custom color override
    {
        id: 'edge-4',
        source: 'error',
        target: 'retry',
        type: 'navigate',
        data: {
            action: {
                name: 'navigate',
                next: { type: 'screen', name: 'retry' },
            },
            label: 'Try Again',
            sourceScreenId: 'error',
            color: '#f59e0b', // Custom orange color
        },
    },
];
```

## Props

Extends `EdgeProps<NavigationEdgeData>` from ReactFlow:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | Unique edge identifier |
| `sourceX` | `number` | Yes | Source X coordinate |
| `sourceY` | `number` | Yes | Source Y coordinate |
| `targetX` | `number` | Yes | Target X coordinate |
| `targetY` | `number` | Yes | Target Y coordinate |
| `sourcePosition` | `Position` | Yes | Source handle position |
| `targetPosition` | `Position` | Yes | Target handle position |
| `selected` | `boolean` | No | Edge selection state |
| `style` | `CSSProperties` | No | Custom styles |
| `markerEnd` | `string` | No | Arrow marker (auto-generated) |
| `data` | `NavigationEdgeData` | No | Edge data payload |

## NavigationEdgeData Type

```typescript
interface NavigationEdgeData {
    // Action definition (determines color)
    action: Action;

    // Optional custom label (defaults to action.name)
    label?: string;

    // Source identification
    sourceScreenId: string;
    sourceComponentId?: string; // Which component triggered navigation

    // Visual options
    animated?: boolean; // Reduces opacity to 0.7
    color?: string; // Override auto-color detection
}

type Action =
    | NavigateAction
    | CompleteAction
    | DataExchangeAction
    | UpdateDataAction
    | OpenUrlAction;
```

## Color System

### Automatic Color Detection

```tsx
const getActionColor = () => {
    switch (action.name) {
        case 'navigate':      return '#3b82f6'; // blue-500
        case 'complete':      return '#22c55e'; // green-500
        case 'data_exchange': return '#8b5cf6'; // purple-500
        default:              return '#71717a'; // zinc-500
    }
};
```

### Color Priority

1. **Hover**: Red (#ef4444) - Highest priority
2. **Selected**: Primary (#65C997) - Medium priority
3. **Custom**: `data.color` - If provided
4. **Action-based**: Automatic from action type
5. **Default**: Gray (#71717a) - Fallback

### Arrow Markers

Three arrow marker types are dynamically created:
- `arrow-default`: Matches action color
- `arrow-selected`: Primary color
- `arrow-hover`: Red color

## Styling

### Tailwind Classes Used
- Layout: `flex`, `items-center`, `justify-center`
- Spacing: `px-2`, `py-1`, `gap-4px`
- Typography: `text-xs`, `font-medium`
- Border: `rounded`, `rounded-full`, `border`, `shadow-sm`, `shadow-md`
- Colors: `bg-red-500`, `text-white`, `border-zinc-300`
- Dark mode: `dark:bg-[#193322]`, `dark:text-zinc-300`
- Transitions: `transition-all`, `duration-150`
- Transforms: `scale-105`, `scale-110`
- Opacity: `opacity-0`, `opacity-100`

### Custom Inline Styles
- Position: Absolute positioning for label
- Transform: Center alignment calculation
- Pointer events: Control interactivity
- Background color: Dynamic action colors
- Stroke: SVG path styling

## Component Structure

```
NavigateEdge
├── Invisible hover path
│   └── 20px transparent stroke for easy interaction
├── Visible animated edge (BaseEdge)
│   ├── Bezier path
│   ├── Dashed stroke (5,5)
│   ├── Dynamic color
│   └── Arrow marker
├── EdgeLabelRenderer
│   └── Label container
│       ├── Action label badge
│       │   ├── Dynamic background color
│       │   ├── Text content
│       │   └── Scale animation
│       └── Delete button
│           ├── Close icon
│           ├── Hover visibility
│           └── Click handler
└── SVG defs
    ├── arrow-default
    ├── arrow-selected
    └── arrow-hover
```

## Event Handlers

### Mouse Events
- `onMouseEnter`: Sets hover state to true
- `onMouseLeave`: Sets hover state to false
- `onClick`: Triggers edge deletion

### Edge Deletion
```tsx
const onEdgeDelete = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent edge selection
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
};
```

## Performance Optimizations

1. **React.memo**: Prevents unnecessary re-renders
2. **useReactFlow hook**: Direct access to edge state
3. **Conditional rendering**: Label only renders if present
4. **CSS transitions**: Hardware-accelerated animations
5. **Pointer events control**: Disabled when invisible

## Dependencies

```json
{
    "@xyflow/react": "^12.x",
    "react": "^18.x"
}
```

### Required Assets
- Material Symbols icons (for close icon)
- Tailwind CSS configuration
- Dark mode support

## Related Components

- **DeletableEdge**: Simple edge with delete functionality (in `/features/edges/`)
- **ScreenNode**: Custom node component for screens
- **FlowCanvas**: Main canvas component using this edge

## Migration from DeletableEdge

If migrating from `DeletableEdge.tsx`, key differences:

1. **Action-based colors**: Automatic color detection from action type
2. **Animated dash**: Always shows dashed line
3. **Enhanced label**: Colored badge instead of plain text
4. **Arrow markers**: Dynamic colors matching edge state
5. **Navigation data**: Uses `NavigationEdgeData` type

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (requires webkit prefix for some animations)

## Accessibility

- Keyboard navigation: Not directly keyboard accessible (ReactFlow limitation)
- Screen readers: Edge relationships announced via ReactFlow
- Color contrast: Meets WCAG AA standards
- Hover states: Clear visual feedback

## Known Issues

1. **Multiple marker definitions**: Each edge instance creates its own markers (minor performance impact)
2. **Z-index conflicts**: Labels may overlap with nodes on dense graphs
3. **Touch devices**: Delete button may be hard to trigger

## Future Enhancements

1. **Conditional rendering**: Show/hide edges based on screen state
2. **Payload tooltip**: Show payload details on label hover
3. **Animation controls**: Toggle dashed animation
4. **Keyboard shortcuts**: Delete with keyboard
5. **Custom markers**: Per-action marker styles

## Testing

```tsx
import { render } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { NavigateEdge } from './NavigateEdge';

describe('NavigateEdge', () => {
    it('renders with navigate action', () => {
        const props = {
            id: 'edge-1',
            sourceX: 0,
            sourceY: 0,
            targetX: 100,
            targetY: 100,
            data: {
                action: { name: 'navigate', next: { type: 'screen', name: 'test' } },
                sourceScreenId: 'test',
            },
        };

        render(
            <ReactFlowProvider>
                <svg>
                    <NavigateEdge {...props} />
                </svg>
            </ReactFlowProvider>
        );
    });
});
```

## Contributing

When modifying this component:
1. Maintain backward compatibility with existing flows
2. Update TypeScript types if data structure changes
3. Test all action types (navigate, complete, data_exchange)
4. Verify dark mode rendering
5. Check hover/selection state transitions
6. Update this documentation

## License

Part of WhatsApp Flow Builder - See project license.
