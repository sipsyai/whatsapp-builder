# ContentEditor Components

Component accordion for editing WhatsApp Flow components in the Playground.

## Components

### ComponentAccordion

Container component that manages a list of draggable, expandable component items.

**Features:**
- Drag-to-reorder using @dnd-kit
- Expand/collapse animation
- Empty state handling

**Props:**
```tsx
interface ComponentAccordionProps {
  components: BuilderComponent[];
  expandedComponentId: string | null;
  onExpandComponent: (componentId: string | null) => void;
  onUpdateComponent: (componentId: string, updates: Partial<BuilderComponent>) => void;
  onDeleteComponent: (componentId: string) => void;
  onDuplicateComponent: (componentId: string) => void;
  onReorderComponents: (newOrder: string[]) => void;
  getPreviewText: (component: BuilderComponent) => string;
}
```

### ComponentAccordionItem

Individual accordion item for a single component.

**Layout (collapsed):**
```
[≡] [Icon] Component Type · Preview text... [▼] [⋮]
```

**Layout (expanded):**
```
[≡] [Icon] Component Type · Preview text... [▲] [⋮]
+----------------------------------------+
|  Inline editor form (placeholder)      |
+----------------------------------------+
```

**Features:**
- Drag handle (≡) for reordering
- Component type icon from content categories
- Component type label and preview text
- Expand/collapse toggle
- More menu with delete and duplicate actions
- Smooth transition animation
- Placeholder for inline editor form

**Props:**
```tsx
interface ComponentAccordionItemProps {
  component: BuilderComponent;
  isExpanded: boolean;
  previewText: string;
  onToggle: () => void;
  onUpdate: (updates: Partial<BuilderComponent>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}
```

## Usage Example

```tsx
import { useState } from 'react';
import { ComponentAccordion } from './ContentEditor';
import type { BuilderComponent } from '../../types/builder.types';

function PlaygroundEditor() {
  const [components, setComponents] = useState<BuilderComponent[]>([
    {
      id: 'comp1',
      type: 'TextHeading',
      config: { text: 'Welcome' },
      validation: { isValid: true, errors: [], warnings: [] },
    },
    {
      id: 'comp2',
      type: 'TextInput',
      config: { name: 'email', label: 'Email Address' },
      validation: { isValid: true, errors: [], warnings: [] },
    },
  ]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleReorder = (newOrder: string[]) => {
    const reordered = newOrder.map(id =>
      components.find(c => c.id === id)!
    );
    setComponents(reordered);
  };

  const handleUpdate = (id: string, updates: Partial<BuilderComponent>) => {
    setComponents(prev =>
      prev.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  };

  const handleDelete = (id: string) => {
    setComponents(prev => prev.filter(c => c.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const handleDuplicate = (id: string) => {
    const original = components.find(c => c.id === id);
    if (!original) return;

    const duplicate = {
      ...original,
      id: `comp${Date.now()}`,
    };

    const index = components.findIndex(c => c.id === id);
    setComponents(prev => [
      ...prev.slice(0, index + 1),
      duplicate,
      ...prev.slice(index + 1),
    ]);
  };

  const getPreviewText = (component: BuilderComponent): string => {
    const config = component.config as any;
    return config.text || config.label || config.name || '';
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Components</h2>
      <ComponentAccordion
        components={components}
        expandedComponentId={expandedId}
        onExpandComponent={setExpandedId}
        onUpdateComponent={handleUpdate}
        onDeleteComponent={handleDelete}
        onDuplicateComponent={handleDuplicate}
        onReorderComponents={handleReorder}
        getPreviewText={getPreviewText}
      />
    </div>
  );
}
```

## Styling

Components use Tailwind CSS with the project's design system:

- **Collapsed state**: `bg-zinc-800`, `hover:bg-zinc-700`
- **Expanded state**: `bg-zinc-800/50`, `border-l-2 border-primary`
- **Transitions**: `max-height` and `opacity` with 200ms duration
- **Icons**: Material Symbols (outlined variant)

## Icons Used

- `drag_indicator` - Drag handle
- `expand_more` / `expand_less` - Expand/collapse toggle
- `more_vert` - More menu
- `delete` - Delete action
- `content_copy` - Duplicate action
- `edit_note` - Editor placeholder
- `widgets` - Empty state / fallback icon

Component type icons are sourced from `CONTENT_CATEGORIES` in `../constants/contentCategories.ts`.

## Future Enhancements

- [ ] Implement actual inline editor forms for each component type
- [ ] Add validation error display in accordion items
- [ ] Add keyboard shortcuts (e.g., Delete key to remove)
- [ ] Add component search/filter
- [ ] Add component grouping by type
- [ ] Add bulk actions (delete multiple, reorder groups)
