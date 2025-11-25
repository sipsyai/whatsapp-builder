# Flow Builder Hooks

React hooks for managing WhatsApp Flow Builder state and operations.

## Overview

The hooks in this directory provide a complete state management solution for the Flow Builder UI, handling screens, components, selection, and various CRUD operations with full TypeScript type safety.

## Main Hook: `useFlowBuilder`

The primary hook for managing Flow Builder state.

### Features

- **Flow Metadata Management**: Flow ID, name, and version
- **Screen CRUD Operations**: Add, update, delete, duplicate screens
- **Component CRUD Operations**: Add, update, delete, duplicate, reorder components
- **Selection Management**: Track selected screens and components
- **Type Safety**: Full TypeScript typing with inference
- **Immutable Updates**: All state updates follow immutable patterns
- **Automatic Timestamps**: Created/updated timestamps managed automatically

### Basic Usage

```tsx
import { useFlowBuilder } from './hooks';

function FlowBuilderComponent() {
  const {
    flowName,
    screens,
    selectedScreen,
    addScreen,
    addComponent,
  } = useFlowBuilder({
    initialFlowName: 'My Flow',
    initialFlowVersion: '7.2',
  });

  const handleAddScreen = () => {
    const screen = addScreen({
      title: 'Welcome Screen',
    });
    console.log('Added:', screen);
  };

  return (
    <div>
      <h1>{flowName}</h1>
      <button onClick={handleAddScreen}>Add Screen</button>
      {/* ... */}
    </div>
  );
}
```

## API Reference

### Options

```typescript
interface UseFlowBuilderOptions {
  initialFlowId?: string;
  initialFlowName?: string;
  initialFlowVersion?: FlowJSONVersion;
  initialScreens?: BuilderScreen[];
}
```

### Return Value

```typescript
interface UseFlowBuilderReturn {
  // State
  flowId: string | null;
  flowName: string;
  flowVersion: FlowJSONVersion;
  screens: BuilderScreen[];
  selectedScreenId: string | null;
  selectedComponentId: string | null;
  selectedScreen: BuilderScreen | undefined;

  // Setters
  setFlowId: (id: string | null) => void;
  setFlowName: (name: string) => void;
  setFlowVersion: (version: FlowJSONVersion) => void;

  // Screen operations
  addScreen: (screen?: Partial<BuilderScreen>) => BuilderScreen;
  updateScreen: (screenId: string, updates: Partial<BuilderScreen>) => void;
  deleteScreen: (screenId: string) => void;
  duplicateScreen: (screenId: string) => BuilderScreen | null;

  // Component operations
  addComponent: (screenId: string, component: Partial<BuilderComponent>) => BuilderComponent | null;
  updateComponent: (screenId: string, componentId: string, updates: Partial<BuilderComponent>) => void;
  deleteComponent: (screenId: string, componentId: string) => void;
  duplicateComponent: (screenId: string, componentId: string) => BuilderComponent | null;
  reorderComponents: (screenId: string, newOrder: string[]) => void;

  // Selection
  selectScreen: (screenId: string | null) => void;
  selectComponent: (componentId: string | null) => void;

  // Getters
  getScreen: (screenId: string) => BuilderScreen | undefined;
  getComponent: (screenId: string, componentId: string) => BuilderComponent | undefined;
}
```

## Screen Operations

### Add Screen

```tsx
const newScreen = addScreen({
  title: 'Welcome',
  terminal: false,
});
```

Creates a new screen with automatic ID generation and timestamps. Returns the created screen.

### Update Screen

```tsx
updateScreen('screen-123', {
  title: 'Updated Title',
  terminal: true,
});
```

Updates existing screen properties. ID cannot be changed. Automatically updates `updatedAt` timestamp.

### Delete Screen

```tsx
deleteScreen('screen-123');
```

Removes screen from flow. Automatically clears selection if deleted screen was selected.

### Duplicate Screen

```tsx
const duplicatedScreen = duplicateScreen('screen-123');
```

Creates a copy of the screen with new IDs for the screen and all its components. Returns the duplicated screen or null if source doesn't exist.

## Component Operations

### Add Component

```tsx
const component = addComponent('screen-123', {
  type: 'TextBody',
  config: {
    type: 'TextBody',
    text: 'Hello World',
  },
});
```

Adds a component to a screen. Returns the created component or null if screen doesn't exist.

### Update Component

```tsx
updateComponent('screen-123', 'component-456', {
  label: 'Updated Label',
  config: {
    text: 'Updated text',
  },
});
```

Updates component properties. Config is shallow merged. ID cannot be changed.

### Delete Component

```tsx
deleteComponent('screen-123', 'component-456');
```

Removes component from screen. Automatically clears selection if deleted component was selected.

### Duplicate Component

```tsx
const duplicated = duplicateComponent('screen-123', 'component-456');
```

Creates a copy of the component with a new ID, inserted after the original. Returns the duplicated component or null if not found.

### Reorder Components

```tsx
// Move component to new position
const newOrder = ['component-3', 'component-1', 'component-2'];
reorderComponents('screen-123', newOrder);
```

Reorders components within a screen. Provide array of component IDs in desired order. Components not in the array are appended at the end.

## Selection Management

### Select Screen

```tsx
selectScreen('screen-123');
selectScreen(null); // Clear selection
```

Sets the selected screen. Automatically clears component selection.

### Select Component

```tsx
selectComponent('component-456');
selectComponent(null); // Clear selection
```

Sets the selected component within the currently selected screen.

## Getters

### Get Screen

```tsx
const screen = getScreen('screen-123');
if (screen) {
  console.log(screen.title);
}
```

Returns screen by ID or undefined if not found.

### Get Component

```tsx
const component = getComponent('screen-123', 'component-456');
if (component) {
  console.log(component.type);
}
```

Returns component by screen ID and component ID or undefined if not found.

## Examples

See `useFlowBuilder.example.tsx` for complete working examples including:

1. Basic Flow Builder Setup
2. Screen Management
3. Component Management
4. Component Reordering
5. Complete Flow Builder with All Features

## Type Safety

All operations are fully typed with TypeScript:

```tsx
// Type inference works automatically
const { addScreen, screens } = useFlowBuilder();

// screens is typed as BuilderScreen[]
const firstScreen = screens[0];
firstScreen.title; // Type: string
firstScreen.components; // Type: BuilderComponent[]

// Function arguments are typed
addScreen({
  title: 'Valid', // OK
  invalidProp: 'test', // TypeScript error
});
```

## Best Practices

1. **Use the hook at the top level**: Keep the hook in a parent component and pass down needed functions via props or context

2. **Batch operations when possible**: If you need to add multiple components, do it in sequence within the same render cycle

3. **Check return values**: Operations like `addComponent` and `duplicateScreen` return null if they fail - always check

4. **Use getters for safe access**: Use `getScreen` and `getComponent` instead of direct array manipulation

5. **Leverage automatic selection**: When adding or duplicating, selection is automatically updated to the new item

6. **Preserve immutability**: All state updates are immutable - never modify returned objects directly

## Performance Considerations

- Operations use `useCallback` to prevent unnecessary re-renders
- Selection state uses `useMemo` for computed values
- All operations are O(n) or better for typical flow sizes
- Consider memoizing child components that receive builder functions as props

## Integration with Other Hooks

This hook is designed to work with other Flow Builder hooks:

- **useFlowValidation**: For validating flow structure
- **useFlowExport**: For exporting to WhatsApp Flow JSON
- **useFlowHistory**: For undo/redo functionality
- **useFlowSync**: For synchronizing with backend

## Testing

```tsx
import { renderHook, act } from '@testing-library/react';
import { useFlowBuilder } from './useFlowBuilder';

test('adds screen correctly', () => {
  const { result } = renderHook(() => useFlowBuilder());

  act(() => {
    const screen = result.current.addScreen({
      title: 'Test Screen',
    });

    expect(screen.title).toBe('Test Screen');
    expect(result.current.screens).toHaveLength(1);
  });
});
```

## License

This code is part of the WhatsApp Flow Builder project.
