# WhatsApp Flow Builder

Visual builder for creating and editing WhatsApp Flows using a drag-and-drop interface with ReactFlow.

## Overview

The Flow Builder provides a comprehensive interface for building WhatsApp Flows with:

- **3-Panel Layout**: Component Palette, Flow Canvas, and Property Editor
- **Visual Editing**: Drag & drop screens and components
- **Real-time Preview**: Interactive preview of the flow
- **Validation**: Built-in validation with error reporting
- **Dark Mode**: Full dark mode support

## Project Structure

```
flow-builder/
├── FlowBuilderPage.tsx          # Main builder page component
├── components/
│   ├── canvas/                  # ReactFlow canvas components
│   │   ├── FlowCanvas.tsx       # Main canvas component
│   │   └── useFlowCanvas.ts     # Canvas state management hook
│   ├── palette/                 # Component palette sidebar
│   │   └── ComponentPalette.tsx # Draggable component list
│   ├── editor/                  # Property editors
│   │   └── ScreenEditor.tsx     # Screen property editor
│   ├── preview/                 # Flow preview
│   │   └── FlowPreview.tsx      # Interactive flow preview
│   └── validation/              # Validation panel
│       └── ValidationPanel.tsx  # Validation errors display
├── hooks/
│   └── useFlowBuilder.ts        # Main state management hook
├── types/
│   ├── flow-json.types.ts       # WhatsApp Flow JSON types
│   └── builder.types.ts         # Builder-specific types
└── utils/
    └── validation.ts            # Flow validation utilities
```

## Usage

### Basic Usage

```tsx
import { FlowBuilderPage } from '@/features/flow-builder';

function App() {
  const handleSave = (flowJson: FlowJSON) => {
    // Save flow to backend
    console.log('Saving flow:', flowJson);
  };

  return (
    <FlowBuilderPage
      onSave={handleSave}
      onBack={() => console.log('Go back')}
    />
  );
}
```

### Editing Existing Flow

```tsx
import { FlowBuilderPage } from '@/features/flow-builder';

function EditFlow({ flowId, flowData }) {
  const handleSave = (flowJson: FlowJSON) => {
    // Update existing flow
    updateFlow(flowId, flowJson);
  };

  return (
    <FlowBuilderPage
      initialFlowId={flowId}
      initialFlowData={flowData}
      onSave={handleSave}
    />
  );
}
```

## Features

### 1. Component Palette (Left Panel)

- Browse all WhatsApp Flow components
- Organized by categories:
  - Text (Heading, Subheading, Body, Caption, RichText)
  - Input (TextInput, TextArea)
  - Selection (Dropdown, Radio, Checkbox, Chips)
  - Date (DatePicker, CalendarPicker)
  - Media (Image, ImageCarousel)
  - Navigation (Footer, EmbeddedLink, NavigationList)
  - Control (If, Switch, OptIn)
- Search functionality
- Drag & drop or click to add

### 2. Flow Canvas (Center)

- Visual flow editing with ReactFlow
- Screen nodes with connections
- Drag to reposition screens
- Connect screens with edges
- Zoom and pan controls
- Mini-map for navigation

### 3. Property Editor (Right Panel - Top)

- Edit selected screen properties:
  - Screen ID
  - Screen Title
  - Terminal flag
  - Data API toggle
- Component management:
  - Add components
  - Reorder components (drag & drop)
  - Edit component properties
  - Delete components
  - Duplicate components
- Real-time validation errors

### 4. Flow Preview (Right Panel - Bottom)

- Interactive preview in iPhone frame
- Navigate between screens
- Test form inputs
- Preview navigation flows
- Reset to beginning

### 5. Validation Panel (Overlay)

- Real-time validation
- Error and warning categorization
- Click to navigate to errors
- Detailed error messages
- Severity indicators

### 6. Toolbar Actions

- **Flow Name**: Edit flow name inline
- **Undo/Redo**: History navigation (TODO)
- **Validate**: Run validation checks
- **Export JSON**: Download flow as JSON
- **Save**: Save flow to backend

## Component Architecture

### State Management

The builder uses a hook-based architecture:

```tsx
// Main state management
const flowBuilder = useFlowBuilder({
  initialFlowId,
  initialFlowName,
  initialScreens,
});

// Canvas state management
const canvas = useFlowCanvas({
  screens: flowBuilder.screens,
  onScreenUpdate: flowBuilder.updateScreen,
  onScreenSelect: flowBuilder.selectScreen,
});
```

### Data Flow

```
FlowBuilderPage
├── useFlowBuilder (state)
│   ├── screens[]
│   ├── selectedScreen
│   └── operations (add, update, delete)
│
├── useFlowCanvas (ReactFlow)
│   ├── nodes[]
│   ├── edges[]
│   └── sync with screens
│
└── Components
    ├── ComponentPalette → addComponent()
    ├── FlowCanvas → selectScreen()
    ├── ScreenEditor → updateScreen()
    ├── FlowPreview → navigate()
    └── ValidationPanel → validate()
```

## Layout Structure

```
┌──────────────┬─────────────────────────────┬──────────────────┐
│              │         Header              │                  │
│              │  [Name] [Actions] [Save]    │                  │
├──────────────┼─────────────────────────────┼──────────────────┤
│ Component    │                             │ Screen Editor    │
│ Palette      │      FlowCanvas             │                  │
│ (w-72)       │    (ReactFlow)              │ - Properties     │
│              │                             │ - Components     │
│ [Search]     │    [Screen Nodes]           │                  │
│              │                             ├──────────────────┤
│ Categories:  │    [Add Screen +]           │ Flow Preview     │
│ - Text       │                             │                  │
│ - Input      │                             │ (iPhone Frame)   │
│ - Selection  │                             │                  │
│ - ...        │                             │                  │
│              │                             │                  │
└──────────────┴─────────────────────────────┴──────────────────┘
                                             └──────────────────┘
                                             Validation Panel
                                             (Overlay - bottom right)
```

## Styling

- **Framework**: Tailwind CSS
- **Dark Mode**: Full dark mode support with `dark:` classes
- **Colors**:
  - Primary: `#65C997` (green)
  - Background Light: `#ffffff`
  - Background Dark: `#112217`
  - Border Dark: `#23482f`

## Dependencies

- `@xyflow/react`: ReactFlow for visual flow editing
- `react`: React 18+
- `tailwindcss`: Styling

## Future Enhancements

- [ ] Component editor modals
- [ ] Undo/Redo functionality
- [ ] Keyboard shortcuts
- [ ] Copy/paste screens
- [ ] Template library
- [ ] Export to PNG/PDF
- [ ] Collaborative editing
- [ ] Version history
- [ ] Flow testing mode
- [ ] AI-assisted flow generation

## API Reference

### FlowBuilderPage Props

```typescript
interface FlowBuilderPageProps {
  initialFlowId?: string;
  initialFlowData?: FlowJSON;
  onSave?: (flowJson: FlowJSON) => void;
  onBack?: () => void;
}
```

### useFlowBuilder Hook

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

## Contributing

When adding new features:

1. Follow the existing component structure
2. Add TypeScript types for all props
3. Include JSDoc comments
4. Support dark mode
5. Add validation where needed
6. Update this README

## License

MIT
