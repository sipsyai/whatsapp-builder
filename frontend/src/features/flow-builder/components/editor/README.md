# Flow Builder Editor Components

This directory contains the editor components for the WhatsApp Flow Builder, including the screen editor and component list with drag-and-drop functionality.

## Components

### ScreenEditor

The main editor panel for editing screen properties and managing components.

**Features:**
- Edit screen ID (with lock/unlock functionality)
- Edit screen title
- Toggle terminal screen status
- Toggle Data API usage
- Display screen metadata (created/updated timestamps)
- Show validation errors
- Integrate ComponentList for component management

**Props:**
```typescript
interface ScreenEditorProps {
  screen: BuilderScreen;
  onUpdateScreen: (updates: Partial<BuilderScreen>) => void;
  onAddComponent: () => void;
  onReorderComponents: (newOrder: BuilderComponent[]) => void;
  onEditComponent: (componentId: string) => void;
  onDeleteComponent: (componentId: string) => void;
  onDuplicateComponent: (componentId: string) => void;
}
```

**Example:**
```tsx
import { ScreenEditor } from './editor';

<ScreenEditor
  screen={selectedScreen}
  onUpdateScreen={(updates) => updateScreen(screenId, updates)}
  onAddComponent={() => openComponentLibrary()}
  onReorderComponents={(newOrder) => reorderComponents(screenId, newOrder)}
  onEditComponent={(id) => openComponentEditor(id)}
  onDeleteComponent={(id) => deleteComponent(screenId, id)}
  onDuplicateComponent={(id) => duplicateComponent(screenId, id)}
/>
```

### ComponentList

A drag-and-drop sortable list of components using @dnd-kit.

**Features:**
- Drag and drop to reorder components
- Component type icons
- Component labels and type display
- Validation error indicators
- Visibility indicators (hidden components)
- Action buttons: Edit, Delete, Duplicate
- Empty state with helpful message

**Props:**
```typescript
interface ComponentListProps {
  components: BuilderComponent[];
  onReorder: (newOrder: BuilderComponent[]) => void;
  onEditComponent: (id: string) => void;
  onDeleteComponent: (id: string) => void;
  onDuplicateComponent: (id: string) => void;
}
```

**Example:**
```tsx
import { ComponentList } from './editor';

<ComponentList
  components={screenComponents}
  onReorder={(newOrder) => updateComponentOrder(newOrder)}
  onEditComponent={(id) => openComponentEditor(id)}
  onDeleteComponent={(id) => deleteComponent(id)}
  onDuplicateComponent={(id) => duplicateComponent(id)}
/>
```

## Dependencies

### Required Packages

- `@dnd-kit/core` - Core drag-and-drop functionality
- `@dnd-kit/sortable` - Sortable list support
- `@dnd-kit/utilities` - Utility functions for transformations

### Installed via:
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Styling

All components use:
- Tailwind CSS for styling
- Dark mode support via `dark:` variants
- Material Symbols icons (outlined variant)
- Consistent color scheme with the rest of the application

### Color Scheme

**Light Mode:**
- Background: `bg-white`, `bg-zinc-50`
- Text: `text-zinc-900`, `text-zinc-600`, `text-zinc-500`
- Borders: `border-zinc-200`, `border-zinc-300`

**Dark Mode:**
- Background: `dark:bg-[#112217]`, `dark:bg-[#193322]`, `dark:bg-[#0d1912]`
- Text: `dark:text-white`, `dark:text-zinc-400`, `dark:text-zinc-500`
- Borders: `dark:border-white/10`, `dark:border-white/20`

## Icon Mapping

The ComponentList automatically maps component types to appropriate Material Symbols icons:

| Component Type | Icon |
|---------------|------|
| TextHeading | `title` |
| TextSubheading | `subtitles` |
| TextBody | `notes` |
| TextCaption | `description` |
| TextInput | `input` |
| TextArea | `text_fields` |
| CheckboxGroup | `check_box` |
| RadioButtonsGroup | `radio_button_checked` |
| Dropdown | `arrow_drop_down_circle` |
| ChipsSelector | `label` |
| DatePicker | `calendar_today` |
| CalendarPicker | `calendar_month` |
| Image | `image` |
| ImageCarousel | `view_carousel` |
| NavigationList | `list` |
| Footer | `touch_app` |
| OptIn | `check_circle` |
| EmbeddedLink | `link` |
| If | `alt_route` |
| Switch | `switch_access_shortcut` |

## Usage Examples

See the example files for detailed usage:

- `ScreenEditor.example.tsx` - Complete examples of ScreenEditor usage
- `ComponentList.example.tsx` - Complete examples of ComponentList usage

### Quick Start

```tsx
import { ScreenEditor } from '@/features/flow-builder/components/editor';
import { BuilderScreen } from '@/features/flow-builder/types';

function FlowBuilderApp() {
  const [selectedScreen, setSelectedScreen] = useState<BuilderScreen | null>(null);

  if (!selectedScreen) {
    return <div>Select a screen to edit</div>;
  }

  return (
    <div className="h-screen flex">
      {/* Canvas on the left */}
      <div className="flex-1">
        <FlowCanvas />
      </div>

      {/* Editor on the right */}
      <div className="w-96">
        <ScreenEditor
          screen={selectedScreen}
          onUpdateScreen={(updates) => {
            // Update screen in your state management
            dispatch({ type: 'UPDATE_SCREEN', payload: { ...selectedScreen, ...updates } });
          }}
          onAddComponent={() => {
            // Open component library or add new component
            dispatch({ type: 'OPEN_COMPONENT_LIBRARY' });
          }}
          onReorderComponents={(newOrder) => {
            // Update component order
            dispatch({ type: 'REORDER_COMPONENTS', payload: newOrder });
          }}
          onEditComponent={(id) => {
            // Open component editor
            dispatch({ type: 'SELECT_COMPONENT', payload: id });
          }}
          onDeleteComponent={(id) => {
            // Delete component
            dispatch({ type: 'DELETE_COMPONENT', payload: id });
          }}
          onDuplicateComponent={(id) => {
            // Duplicate component
            dispatch({ type: 'DUPLICATE_COMPONENT', payload: id });
          }}
        />
      </div>
    </div>
  );
}
```

## Accessibility

Both components include proper accessibility features:

- **Keyboard Navigation**: Full keyboard support for drag-and-drop
- **ARIA Labels**: All interactive elements have descriptive labels
- **Focus Management**: Proper focus indicators and management
- **Screen Reader Support**: Semantic HTML and ARIA attributes

### Keyboard Shortcuts

**ComponentList:**
- `Space/Enter` - Start/end dragging
- `Arrow Keys` - Move component while dragging
- `Escape` - Cancel drag operation
- `Tab` - Navigate between action buttons

## Testing

The components can be tested using React Testing Library:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentList } from './ComponentList';

test('renders component list with components', () => {
  const components = [
    { id: '1', type: 'TextHeading', label: 'Test' },
  ];

  render(
    <ComponentList
      components={components}
      onReorder={jest.fn()}
      onEditComponent={jest.fn()}
      onDeleteComponent={jest.fn()}
      onDuplicateComponent={jest.fn()}
    />
  );

  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

## Performance Considerations

### ComponentList

- Uses `useMemo` to memoize component IDs
- Implements pointer sensor with activation constraint (5px threshold)
- Minimal re-renders during drag operations

### ScreenEditor

- Uses `useCallback` for all event handlers
- Controlled inputs for optimal performance
- Conditional rendering for validation errors

## Troubleshooting

### Drag and Drop Not Working

1. Ensure @dnd-kit packages are installed
2. Check that component IDs are unique and stable
3. Verify pointer events are not disabled on parent elements

### Styling Issues

1. Ensure Tailwind CSS is properly configured
2. Check that Material Symbols font is loaded
3. Verify dark mode class is applied to root element

### TypeScript Errors

1. Ensure all type definitions are imported from `../../types`
2. Check that BuilderComponent and BuilderScreen types match your usage
3. Verify Action types are properly defined in flow-json.types.ts
