# Component Palette

The Component Palette is a sidebar component that displays all available WhatsApp Flow components organized by category. Users can drag components onto the canvas or click to add them.

## Features

- **Categorized Components**: All 21 WhatsApp Flow components organized into 7 categories
- **Drag & Drop**: Drag components from the palette onto the canvas
- **Click to Add**: Quick add via + button
- **Search**: Filter components by name, type, or description
- **Collapsible Categories**: Expand/collapse categories with accordion behavior
- **Tooltips**: Hover to see detailed component information
- **Dark Mode**: Full dark mode support matching the project theme
- **Icons**: Material Symbols icons for all components

## Components

### ComponentPalette

Main sidebar component that displays the component library.

**Props:**
- `onAddComponent?: (componentType: Component['type']) => void` - Callback when user clicks + button to add a component
- `className?: string` - Additional CSS classes

**Example Usage:**

```tsx
import { ComponentPalette } from '@/features/flow-builder/components/palette';

function FlowBuilderPage() {
  const handleAddComponent = (componentType: Component['type']) => {
    // Add component to the current screen
    console.log('Adding component:', componentType);
  };

  return (
    <div className="flex h-screen">
      <ComponentPalette onAddComponent={handleAddComponent} />

      {/* Your canvas/main content */}
      <main className="flex-1">
        {/* Flow canvas */}
      </main>
    </div>
  );
}
```

### DraggableComponent

Individual component item in the palette. Handles drag & drop functionality.

**Props:**
- `component: ComponentDefinition` - Component metadata (type, name, icon, description, category)
- `onAddClick?: (componentType: Component['type']) => void` - Callback for + button click

## Categories

### 1. Text (5 components)
- **TextHeading**: Top level title (80 chars max)
- **TextSubheading**: Section subheading (80 chars max)
- **TextBody**: Body text with markdown (4096 chars max)
- **TextCaption**: Small caption text (409 chars max)
- **RichText**: Rich formatted text with full markdown

### 2. Input (2 components)
- **TextInput**: Single line text input
- **TextArea**: Multi-line text input (600 chars max)

### 3. Selection (4 components)
- **Dropdown**: Single selection dropdown (1-200 options)
- **RadioButtonsGroup**: Single selection from list (1-20 options)
- **CheckboxGroup**: Multiple selection from list (1-20 options)
- **ChipsSelector**: Multiple selection with chips (2-20 options)

### 4. Date (2 components)
- **DatePicker**: Single date selection
- **CalendarPicker**: Single or range date selection

### 5. Media (2 components)
- **Image**: Display image (max 3 per screen)
- **ImageCarousel**: Slide through images (1-3 images)

### 6. Navigation (3 components)
- **Footer**: CTA button (max 1 per screen)
- **EmbeddedLink**: Clickable link (max 2 per screen)
- **NavigationList**: List of navigation items (1-20 items)

### 7. Control (3 components)
- **If**: Conditional rendering
- **Switch**: Multi-branch conditional
- **OptIn**: Consent checkbox (max 5 per screen)

## Drag & Drop Implementation

The palette uses the HTML5 Drag and Drop API. Components set their type in the dataTransfer:

```tsx
const handleDragStart = (event: React.DragEvent) => {
  event.dataTransfer.setData('application/whatsapp-flow-component', componentType);
  event.dataTransfer.effectAllowed = 'copy';
};
```

On your canvas, handle the drop:

```tsx
const handleDrop = (event: React.DragEvent) => {
  event.preventDefault();
  const componentType = event.dataTransfer.getData('application/whatsapp-flow-component');

  if (componentType) {
    // Add component to canvas at drop position
    addComponentToScreen(componentType, { x: event.clientX, y: event.clientY });
  }
};

const handleDragOver = (event: React.DragEvent) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
};

<div
  onDrop={handleDrop}
  onDragOver={handleDragOver}
  className="canvas"
>
  {/* Your canvas content */}
</div>
```

## Styling

The palette uses Tailwind CSS with the project's custom theme:

- **Width**: `w-72` (288px)
- **Background**: `bg-background-light dark:bg-background-dark`
- **Border**: `border-zinc-200 dark:border-[#23482f]`
- **Primary Color**: `text-primary` (green theme)

## Search Functionality

The search feature filters components in real-time by:
- Component name
- Component type
- Component description

When searching:
- All categories auto-expand
- Empty state shown if no matches
- Clear button appears to reset search

## Accessibility

- Semantic HTML structure
- Keyboard navigation support for buttons
- ARIA labels on interactive elements
- Clear focus states
- Tooltips with component descriptions

## Icon Mapping

Each category and component has a Material Symbols icon:

| Category   | Icon                 |
|------------|----------------------|
| Text       | `text_fields`        |
| Input      | `edit`               |
| Selection  | `ballot`             |
| Date       | `event`              |
| Media      | `photo_library`      |
| Navigation | `navigation`         |
| Control    | `settings_suggest`   |

See component definitions in `ComponentPalette.tsx` for individual component icons.

## Integration with BuilderPage

To integrate with the existing BuilderPage structure:

```tsx
import { ComponentPalette } from '@/features/flow-builder/components/palette';

export const FlowBuilderPage = () => {
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);

  const handleAddComponent = (componentType: Component['type']) => {
    if (!selectedScreenId) {
      alert('Please select a screen first');
      return;
    }

    // Create new component instance
    const newComponent: BuilderComponent = {
      id: crypto.randomUUID(),
      type: componentType,
      config: {
        type: componentType,
        // Add default config based on component type
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
    };

    // Add to selected screen
    addComponentToScreen(selectedScreenId, newComponent);
  };

  return (
    <div className="flex h-screen">
      <ComponentPalette onAddComponent={handleAddComponent} />

      <main className="flex-1">
        {/* ReactFlow canvas or screen builder */}
      </main>

      {/* Properties panel */}
    </div>
  );
};
```

## Future Enhancements

Potential improvements:
- Component templates/presets
- Recently used components section
- Favorites/bookmarks
- Component preview on hover
- Custom component library support
- Keyboard shortcuts for quick add
- Drag preview customization
- Component validation hints
