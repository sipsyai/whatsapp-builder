# WhatsApp Flows Playground

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [File Structure](#file-structure)
5. [Core Components](#core-components)
6. [Hooks](#hooks)
7. [Types & Constants](#types--constants)
8. [Usage Examples](#usage-examples)
9. [API Reference](#api-reference)
10. [Integration Guide](#integration-guide)
11. [Best Practices](#best-practices)

---

## Overview

The WhatsApp Flows Playground is an interactive development environment for testing, building, and previewing WhatsApp Flows. It provides a 3-panel layout with screen management, visual/JSON editing modes, and real-time mobile preview capabilities.

### Key Features

- **3-Panel Layout**: Screens list, Content editor, and Live preview
- **Dual Editor Modes**: Form-based visual editor and Monaco JSON editor
- **Platform Preview**: iOS and Android phone frame simulation
- **Drag-and-Drop**: Component reordering with `@dnd-kit`
- **Real-time Validation**: Live error detection and warnings
- **Export Functionality**: Download Flow JSON for WhatsApp API
- **Theme Support**: Light and dark mode preview
- **Interactive Mode**: Test component interactions in preview

### Technology Stack

- **React 19.2.0**: UI components and state management
- **TypeScript 5.9**: Type safety and IntelliSense
- **@dnd-kit**: Drag-and-drop functionality
- **Monaco Editor**: Professional JSON editing
- **ReactFlow**: Flow builder integration

---

## Architecture

### Layout Structure

```
┌──────────────────────────────────────────────────────────────────┐
│ Header: Flow Name | Export | Save                                 │
├──────────┬─────────────────────────────┬─────────────────────────┤
│          │                             │                         │
│ Screens  │   Content Editor            │   Preview Panel         │
│ Panel    │                             │                         │
│ (w-60)   │   ┌──────────────────────┐  │  ┌─────────────────┐  │
│          │   │ Screen Title         │  │  │                 │  │
│ • Screen │   │ ─────────────────────│  │  │   Phone Frame   │  │
│   1      │   │ Components           │  │  │                 │  │
│          │   │   TextHeading        │  │  │   Screen        │  │
│ • Screen │   │   RadioButtons       │  │  │   Preview       │  │
│   2      │   │   Footer             │  │  │                 │  │
│          │   └──────────────────────┘  │  └─────────────────┘  │
│ [+ Add]  │                             │                         │
│          │   [JSON / Form Toggle]      │  [← Prev] 1/3 [Next →] │
│          │   [+ Add Content]           │                         │
└──────────┴─────────────────────────────┴─────────────────────────┘
```

### Component Hierarchy

```
FlowPlaygroundPage
├── usePlaygroundState (custom hook)
│   └── useFlowBuilder (base hook)
├── usePreviewSettings (custom hook)
│
├── Header
│   ├── Flow Name (editable)
│   ├── Export Button
│   └── Save Button
│
├── Mobile Tabs (< lg breakpoint)
│   ├── Screens Tab
│   ├── Editor Tab
│   └── Preview Tab
│
└── 3-Panel Layout
    ├── ScreensPanel (left)
    │   ├── ScreenListItem[]
    │   └── AddScreenButton
    │
    ├── ContentEditor (center)
    │   ├── Screen Title Editor
    │   ├── ComponentAccordion
    │   │   └── ComponentAccordionItem[]
    │   │       └── [Type]Editor (e.g., TextHeadingEditor)
    │   ├── AddContentMenu
    │   └── JSONEditor (when mode === 'json')
    │
    └── PreviewPanel (right)
        ├── PreviewSettings (platform, theme, interactive)
        ├── CopyJsonButton
        ├── PhoneFrame
        │   └── ScreenPreview
        └── Navigation Controls
```

---

## Features

### 1. Screen Management

**ScreensPanel** provides full CRUD operations for screens:

- **Add Screen**: Creates new empty screen with default template
- **Select Screen**: Switch between screens for editing
- **Delete Screen**: Remove screen with confirmation
- **Duplicate Screen**: Clone existing screen with all components

**Features:**
- Visual list with screen titles
- Active screen highlighting
- Screen count display
- Empty state with helpful prompt

### 2. Content Editor

#### Form-Based Editor

Visual editor with accordion-based component management:

**Component Accordion:**
- Drag-to-reorder components
- Expand/collapse individual components
- Preview text in headers (e.g., "TextHeading • Welcome to our store")
- Inline editing forms for each component type

**Available Editors:**
- `TextHeadingEditor` - Large headings
- `TextInputEditor` - Short answer fields
- `RadioButtonsEditor` - Single choice selections
- `DropdownEditor` - Dropdown selections
- `FooterEditor` - Navigation buttons
- *(More editors can be added)*

**Add Content Menu:**
- Categorized component library:
  - Text (Heading, Subheading, Body, Caption)
  - Media (Image)
  - Text Answer (TextInput, TextArea, DatePicker)
  - Selection (RadioButtons, CheckboxGroup, Dropdown, OptIn)
- Tab-based navigation
- One-click component insertion
- Menu opens upward to prevent overflow (bottom-full mb-2)
- Backdrop click to close

#### JSON Editor Mode

Professional Monaco Editor integration:

**Features:**
- Syntax highlighting
- Auto-formatting
- Real-time validation
- Parse error detection with line numbers
- Copy to clipboard
- 500ms debounced auto-save

**Editor Options:**
```typescript
{
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  wordWrap: 'on',
  formatOnPaste: true,
  formatOnType: true,
}
```

### 3. Preview Panel

Real-time WhatsApp Flow preview with mobile simulation:

**Phone Frame:**
- iOS and Android platform simulation
- Accurate dimensions and styling
- Status bar and home indicator

**Preview Settings:**
- Platform toggle (Android/iOS)
- Theme toggle (Light/Dark)
- Interactive mode toggle
- Settings persist to localStorage

**Navigation:**
- Previous/Next screen buttons
- Screen indicator (e.g., "Screen 2/5")
- Interactive component testing
- Form data state tracking

**Copy JSON:**
- One-click export
- Formatted Flow JSON
- Ready for WhatsApp API
- Success feedback

### 4. Drag-and-Drop

Component reordering powered by `@dnd-kit`:

**Configuration:**
```typescript
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5, // 5px movement required
    },
  }),
  useSensor(KeyboardSensor)
);
```

**Features:**
- Vertical list sorting strategy
- Visual drag indicators
- Collision detection
- Keyboard accessibility
- Auto-scroll during drag

**Important Note - ID Format:**
WhatsApp Flows API requires specific ID format for screens and components:
- IDs must use underscores (`_`) instead of hyphens (`-`)
- Example: `screen_123` not `screen-123`
- Format: `/^[a-zA-Z0-9_]+$/`
- This is enforced in `useFlowBuilder.ts` when creating screens/components

### 5. Validation

Real-time Flow validation:

**Validation Types:**
- JSON syntax errors
- Missing required fields
- Invalid component configurations
- Screen connectivity issues

**Display:**
- `ValidationPanel` component
- Error/warning badges
- Inline error messages
- Parse error line highlighting

### 6. Export & Save

**Export Flow JSON:**
```typescript
const flowJSON = {
  version: '7.2',
  data_api_version: '3.0',
  screens: screens.map(screen => ({
    id: screen.id,
    title: screen.title,
    terminal: screen.terminal,
    data: screen.data,
    layout: {
      type: 'SingleColumnLayout',
      children: screen.components.map(c => c.config),
    },
    refresh_on_back: screen.refresh_on_back,
  })),
};
```

**Save Flow:**
- Callback to parent component
- Includes flow name, screens, and version
- Async operation support
- Success/error feedback

---

## File Structure

```
frontend/src/features/flow-builder/
│
├── FlowPlaygroundPage.tsx                    # Main playground page
│
├── components/playground/
│   │
│   ├── hooks/
│   │   ├── usePlaygroundState.ts            # Playground state hook
│   │   ├── usePreviewSettings.ts            # Preview settings hook
│   │   └── index.ts                         # Hook exports
│   │
│   ├── types/
│   │   └── playground.types.ts              # TypeScript definitions
│   │
│   ├── constants/
│   │   └── contentCategories.ts             # Component library
│   │
│   ├── ScreensPanel/
│   │   ├── index.tsx                        # Main screens panel
│   │   ├── ScreenListItem.tsx               # Individual screen item
│   │   └── AddScreenButton.tsx              # Add screen button
│   │
│   ├── ContentEditor/
│   │   ├── index.tsx                        # Main editor container
│   │   ├── ComponentAccordion.tsx           # Accordion wrapper
│   │   ├── ComponentAccordionItem.tsx       # Sortable accordion item
│   │   ├── AddContentMenu.tsx               # Component library menu
│   │   ├── JSONEditor.tsx                   # Monaco JSON editor
│   │   ├── ValidationPanel.tsx              # Validation display
│   │   └── editors/
│   │       ├── index.ts                     # Editor exports
│   │       ├── TextHeadingEditor.tsx        # Text component editor
│   │       ├── TextInputEditor.tsx          # Input field editor
│   │       ├── RadioButtonsEditor.tsx       # Radio buttons editor
│   │       ├── DropdownEditor.tsx           # Dropdown editor
│   │       └── FooterEditor.tsx             # Footer button editor
│   │
│   └── PreviewPanel/
│       ├── index.tsx                        # Exports
│       ├── PreviewPanel.tsx                 # Main preview container
│       ├── PreviewSettings.tsx              # Settings popover
│       ├── CopyJsonButton.tsx               # Copy JSON button
│       └── PlatformPhoneFrame.tsx           # Phone frame wrapper
│
├── hooks/
│   └── useFlowBuilder.ts                    # Base flow builder hook
│
└── types/
    ├── builder.types.ts                      # Builder types
    └── flow-json.types.ts                    # Flow JSON types
```

---

## Core Components

### FlowPlaygroundPage

**Purpose:** Main playground container component

**Props:**
```typescript
interface FlowPlaygroundPageProps {
  flowId?: string;
  initialFlow?: {
    name: string;
    screens: BuilderScreen[];
    version?: FlowJSONVersion;
  };
  onSave?: (flowData: {
    name: string;
    screens: BuilderScreen[];
    version: FlowJSONVersion;
  }) => void;
  onBack?: () => void;
}
```

**State Management:**
- Uses `usePlaygroundState` for flow/screen/component operations
- Uses `usePreviewSettings` for preview configuration
- Local state for UI (saving, active tab)

**Responsive Behavior:**
- Desktop (≥ lg): 3-panel side-by-side layout
- Mobile (< lg): Tab-based single panel view

### ScreensPanel

**Purpose:** Screen list management sidebar

**Props:**
```typescript
interface ScreensPanelProps {
  screens: BuilderScreen[];
  selectedScreenId: string | null;
  onSelectScreen: (screenId: string) => void;
  onAddScreen: () => void;
  onDeleteScreen: (screenId: string) => void;
  onDuplicateScreen: (screenId: string) => void;
  className?: string;
}
```

**Features:**
- Screen list with selection state
- Add/delete/duplicate operations
- Empty state with helpful message
- Screen count display

### ContentEditor

**Purpose:** Component editing with form/JSON modes

**Props:**
```typescript
interface ContentEditorProps {
  screen: BuilderScreen | undefined;
  editorMode: EditorMode;
  expandedComponentId: string | null;
  onToggleEditorMode: () => void;
  onUpdateScreen: (updates: Partial<BuilderScreen>) => void;
  onAddComponent: (type: string) => void;
  onUpdateComponent: (componentId: string, updates: Partial<BuilderComponent>) => void;
  onDeleteComponent: (componentId: string) => void;
  onDuplicateComponent: (componentId: string) => void;
  onReorderComponents: (newOrder: string[]) => void;
  onExpandComponent: (componentId: string | null) => void;
  getComponentPreviewText: (component: BuilderComponent) => string;
  className?: string;
}
```

**Modes:**
- **Form Mode**: Visual accordion-based editing
- **JSON Mode**: Monaco editor with validation

### PreviewPanel

**Purpose:** Live WhatsApp Flow preview

**Props:**
```typescript
interface PreviewPanelProps {
  screens: BuilderScreen[];
  currentScreenId: string | null;
  previewSettings: PreviewSettings;
  onNavigate?: (screenId: string) => void;
  onSettingsChange?: (settings: Partial<PreviewSettings>) => void;
  onCopyJson?: () => void;
  className?: string;
}
```

**Features:**
- Phone frame with platform-specific styling
- Screen navigation (Previous/Next)
- Interactive component testing
- Form data state tracking

### ComponentAccordion

**Purpose:** Draggable, expandable component list

**Props:**
```typescript
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

**Implementation:**
```typescript
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext items={componentIds} strategy={verticalListSortingStrategy}>
    {components.map((component) => (
      <ComponentAccordionItem
        key={component.id}
        component={component}
        isExpanded={expandedComponentId === component.id}
        // ...
      />
    ))}
  </SortableContext>
</DndContext>
```

### AddContentMenu

**Purpose:** Component library with categorized items

**Props:**
```typescript
interface AddContentMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddComponent: (type: string) => void;
}
```

**Categories:**
1. **Text**: Heading, Subheading, Body, Caption
2. **Media**: Image
3. **Text Answer**: TextInput, TextArea, DatePicker
4. **Selection**: RadioButtons, CheckboxGroup, Dropdown, OptIn

### JSONEditor

**Purpose:** Monaco-based JSON editing with validation

**Props:**
```typescript
interface JSONEditorProps {
  screen: BuilderScreen;
  onUpdateScreen: (updates: Partial<BuilderScreen>) => void;
  className?: string;
}
```

**Features:**
- Two-way sync (Screen ↔ JSON)
- 500ms debounced updates
- Parse error display with line numbers
- Format and copy utilities

---

## Hooks

### usePlaygroundState

**Purpose:** Main playground state management hook

**Options:**
```typescript
interface UsePlaygroundStateOptions extends UseFlowBuilderOptions {
  initialEditorMode?: EditorMode; // 'form' | 'json'
}
```

**Returns:**
```typescript
interface UsePlaygroundStateReturn extends UseFlowBuilderReturn {
  // Additional playground state
  expandedComponentId: string | null;
  editorMode: EditorMode;
  addContentMenuOpen: boolean;

  // Additional playground actions
  setExpandedComponentId: (id: string | null) => void;
  toggleEditorMode: () => void;
  setEditorMode: (mode: EditorMode) => void;
  setAddContentMenuOpen: (open: boolean) => void;
  addComponentFromMenu: (type: string) => void;

  // Helper functions
  getComponentPreviewText: (component: BuilderComponent) => string;
}
```

**Usage Example:**
```typescript
const playground = usePlaygroundState({
  initialFlowName: 'My Flow',
  initialFlowVersion: '7.2',
  initialScreens: [],
  initialEditorMode: 'form',
});

// Add component from menu
playground.addComponentFromMenu('TextHeading');

// Toggle editor mode
playground.toggleEditorMode();

// Get preview text
const previewText = playground.getComponentPreviewText(component);
```

**Key Features:**
- Wraps `useFlowBuilder` with playground-specific state
- Auto-expands newly added components
- Generates preview text for accordion headers
- Manages editor mode (JSON vs Form)

### usePreviewSettings

**Purpose:** Preview configuration management with localStorage persistence

**Options:**
```typescript
interface UsePreviewSettingsOptions {
  persistKey?: string; // Default: 'whatsapp-playground-preview-settings'
}
```

**Returns:**
```typescript
interface UsePreviewSettingsReturn {
  settings: PreviewSettings;
  setPlatform: (platform: 'android' | 'ios') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleInteractive: () => void;
  resetSettings: () => void;
}
```

**Usage Example:**
```typescript
const preview = usePreviewSettings();

// Change platform
preview.setPlatform('ios');

// Change theme
preview.setTheme('dark');

// Toggle interactive mode
preview.toggleInteractive();

// Reset to defaults
preview.resetSettings();
```

**Persistence:**
- Automatically saves to localStorage
- Loads from localStorage on mount
- Validates stored data
- Graceful error handling

### useFlowBuilder

**Purpose:** Base flow builder hook (inherited by playground)

**Options:**
```typescript
interface UseFlowBuilderOptions {
  initialFlowId?: string;
  initialFlowName?: string;
  initialFlowVersion?: FlowJSONVersion;
  initialScreens?: BuilderScreen[];
}
```

**Returns:**
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

---

## Types & Constants

### Type Definitions

**EditorMode:**
```typescript
type EditorMode = 'json' | 'form';
```

**PreviewSettings:**
```typescript
interface PreviewSettings {
  platform: 'android' | 'ios';
  theme: 'light' | 'dark';
  interactive: boolean;
}

const DEFAULT_PREVIEW_SETTINGS: PreviewSettings = {
  platform: 'android',
  theme: 'light',
  interactive: true,
};
```

**ContentCategory:**
```typescript
interface ContentCategory {
  id: string;
  label: string;
  icon: string; // Material Symbol icon name
  items: ContentItem[];
}

interface ContentItem {
  type: string; // Component type
  label: string; // Display name
  icon: string; // Material Symbol icon name
}
```

**ComponentEditorProps:**
```typescript
interface ComponentEditorProps {
  component: BuilderComponent;
  onChange: (updates: Partial<BuilderComponent>) => void;
  onDelete: () => void;
}
```

### Content Categories

**CONTENT_CATEGORIES:**
```typescript
export const CONTENT_CATEGORIES: ContentCategory[] = [
  {
    id: 'text',
    label: 'Text',
    icon: 'text_fields',
    items: [
      { type: 'TextHeading', label: 'Large Heading', icon: 'title' },
      { type: 'TextSubheading', label: 'Small Heading', icon: 'format_size' },
      { type: 'TextCaption', label: 'Caption', icon: 'notes' },
      { type: 'TextBody', label: 'Body', icon: 'subject' },
    ],
  },
  {
    id: 'media',
    label: 'Media',
    icon: 'image',
    items: [
      { type: 'Image', label: 'Image', icon: 'image' },
    ],
  },
  {
    id: 'text-answer',
    label: 'Text Answer',
    icon: 'input',
    items: [
      { type: 'TextInput', label: 'Short Answer', icon: 'input' },
      { type: 'TextArea', label: 'Paragraph', icon: 'text_fields' },
      { type: 'DatePicker', label: 'Date picker', icon: 'calendar_today' },
    ],
  },
  {
    id: 'selection',
    label: 'Selection',
    icon: 'checklist',
    items: [
      { type: 'RadioButtonsGroup', label: 'Single Choice', icon: 'radio_button_checked' },
      { type: 'CheckboxGroup', label: 'Multiple Choice', icon: 'check_box' },
      { type: 'Dropdown', label: 'Dropdown', icon: 'arrow_drop_down_circle' },
      { type: 'OptIn', label: 'Opt-in', icon: 'check_circle' },
    ],
  },
];
```

**Default Component Values:**
```typescript
export const DEFAULT_COMPONENT_VALUES: Record<string, Record<string, unknown>> = {
  TextHeading: { text: 'Heading' },
  TextSubheading: { text: 'Subheading' },
  TextBody: { text: 'Body text' },
  TextCaption: { text: 'Caption' },
  Image: { src: '', alt: 'Image' },
  TextInput: { name: 'input_field', label: 'Input', required: false },
  TextArea: { name: 'textarea_field', label: 'Textarea', required: false },
  DatePicker: { name: 'date_field', label: 'Date' },
  RadioButtonsGroup: {
    name: 'radio_field',
    label: 'Choose one',
    required: true,
    'data-source': [  // NOTE: hyphenated property name, not camelCase
      { id: 'opt1', title: 'Option 1' },
      { id: 'opt2', title: 'Option 2' },
    ],
  },
  CheckboxGroup: {
    name: 'checkbox_field',
    label: 'Select all that apply',
    required: false,
    'data-source': [  // NOTE: hyphenated property name
      { id: 'opt1', title: 'Option 1' },
      { id: 'opt2', title: 'Option 2' },
    ],
  },
  Dropdown: {
    name: 'dropdown_field',
    label: 'Select an option',
    required: true,
    'data-source': [  // NOTE: hyphenated property name
      { id: 'opt1', title: 'Option 1' },
      { id: 'opt2', title: 'Option 2' },
    ],
  },
  // ... more defaults
};
```

**Helper Functions:**
```typescript
// Get default component configuration by type
export function getDefaultComponent(type: string): Record<string, unknown>;

// Get all component types
export function getAllComponentTypes(): string[];

// Get category for a component type
export function getCategoryForType(type: string): ContentCategory | undefined;

// Check if component type is valid
export function isValidComponentType(type: string): boolean;
```

---

## Usage Examples

### Basic Setup

```typescript
import { FlowPlaygroundPage } from '@/features/flow-builder/FlowPlaygroundPage';

function MyApp() {
  const handleSave = async (flowData) => {
    console.log('Saving flow:', flowData);
    // Save to backend API
    await api.flows.update(flowId, flowData);
  };

  const handleBack = () => {
    navigate('/flows');
  };

  return (
    <FlowPlaygroundPage
      flowId="flow-123"
      initialFlow={{
        name: 'Customer Survey',
        screens: [],
        version: '7.2',
      }}
      onSave={handleSave}
      onBack={handleBack}
    />
  );
}
```

### Loading Existing Flow

```typescript
function EditFlowPlayground({ flowId }: { flowId: string }) {
  const [flow, setFlow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFlow() {
      const data = await api.flows.getById(flowId);
      setFlow(data);
      setLoading(false);
    }
    loadFlow();
  }, [flowId]);

  if (loading) return <LoadingSpinner />;

  return (
    <FlowPlaygroundPage
      flowId={flow.id}
      initialFlow={{
        name: flow.name,
        screens: flow.screens,
        version: flow.version,
      }}
      onSave={async (flowData) => {
        await api.flows.update(flowId, flowData);
        toast.success('Flow saved successfully!');
      }}
      onBack={() => navigate('/flows')}
    />
  );
}
```

### Custom Component Editor

```typescript
// Create a custom editor for a new component type
import React from 'react';
import type { ComponentEditorProps } from '@/features/flow-builder/components/playground/types/playground.types';

export const CustomComponentEditor: React.FC<ComponentEditorProps> = ({
  component,
  onChange,
  onDelete,
}) => {
  const config = component.config as CustomComponentConfig;

  const handleChange = (field: string, value: any) => {
    onChange({
      config: {
        ...component.config,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Custom Component</h3>
        <button onClick={onDelete} className="...">
          Delete
        </button>
      </div>

      <div>
        <label>Field Label</label>
        <input
          value={config.label}
          onChange={(e) => handleChange('label', e.target.value)}
          className="..."
        />
      </div>

      {/* More fields... */}
    </div>
  );
};
```

### Programmatic Flow Creation

```typescript
function CreateFlowProgrammatically() {
  const playground = usePlaygroundState({
    initialFlowName: 'Generated Flow',
    initialFlowVersion: '7.2',
  });

  useEffect(() => {
    // Create first screen
    const screen1 = playground.addScreen({
      title: 'Welcome',
      terminal: false,
    });

    if (screen1) {
      // Add heading
      playground.addComponent(screen1.id, {
        type: 'TextHeading',
        config: { text: 'Welcome to our service!' },
      });

      // Add input
      playground.addComponent(screen1.id, {
        type: 'TextInput',
        config: {
          name: 'customer_name',
          label: 'Your name',
          required: true,
        },
      });

      // Add footer
      playground.addComponent(screen1.id, {
        type: 'Footer',
        config: {
          label: 'Continue',
          'on-click-action': {
            name: 'navigate',
            next: { type: 'screen', name: 'SCREEN_2' },
          },
        },
      });
    }

    // Create second screen
    const screen2 = playground.addScreen({
      title: 'Thank You',
      terminal: true,
    });

    if (screen2) {
      playground.addComponent(screen2.id, {
        type: 'TextHeading',
        config: { text: 'Thank you!' },
      });
    }

    // Select first screen
    playground.selectScreen(screen1.id);
  }, []);

  return <div>Flow created programmatically!</div>;
}
```

### Export Flow JSON

```typescript
function ExportFlowButton({ playground }: { playground: UsePlaygroundStateReturn }) {
  const handleExport = () => {
    const flowJSON = {
      version: playground.flowVersion,
      data_api_version: '3.0' as const,
      screens: playground.screens.map((screen) => ({
        id: screen.id,
        title: screen.title,
        terminal: screen.terminal,
        data: screen.data,
        layout: {
          type: 'SingleColumnLayout' as const,
          children: screen.components.map((c) => c.config),
        },
        refresh_on_back: screen.refresh_on_back,
      })),
    };

    // Download as file
    const json = JSON.stringify(flowJSON, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playground.flowName.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return <button onClick={handleExport}>Export Flow JSON</button>;
}
```

---

## API Reference

### FlowPlaygroundPage Component

```typescript
import { FlowPlaygroundPage } from '@/features/flow-builder/FlowPlaygroundPage';

<FlowPlaygroundPage
  flowId?: string
  initialFlow?: {
    name: string;
    screens: BuilderScreen[];
    version?: FlowJSONVersion;
  }
  onSave?: (flowData: {
    name: string;
    screens: BuilderScreen[];
    version: FlowJSONVersion;
  }) => void
  onBack?: () => void
/>
```

### usePlaygroundState Hook

```typescript
import { usePlaygroundState } from '@/features/flow-builder/components/playground/hooks';

const playground = usePlaygroundState({
  initialFlowId?: string,
  initialFlowName?: string,
  initialFlowVersion?: FlowJSONVersion,
  initialScreens?: BuilderScreen[],
  initialEditorMode?: 'json' | 'form',
});

// State
playground.flowId
playground.flowName
playground.flowVersion
playground.screens
playground.selectedScreenId
playground.selectedScreen
playground.expandedComponentId
playground.editorMode
playground.addContentMenuOpen

// Flow operations
playground.setFlowName(name: string)
playground.setFlowVersion(version: FlowJSONVersion)

// Screen operations
playground.addScreen(screen?: Partial<BuilderScreen>)
playground.updateScreen(screenId: string, updates: Partial<BuilderScreen>)
playground.deleteScreen(screenId: string)
playground.duplicateScreen(screenId: string)
playground.selectScreen(screenId: string | null)

// Component operations
playground.addComponent(screenId: string, component: Partial<BuilderComponent>)
playground.updateComponent(screenId: string, componentId: string, updates: Partial<BuilderComponent>)
playground.deleteComponent(screenId: string, componentId: string)
playground.duplicateComponent(screenId: string, componentId: string)
playground.reorderComponents(screenId: string, newOrder: string[])

// Playground-specific
playground.setExpandedComponentId(id: string | null)
playground.toggleEditorMode()
playground.setEditorMode(mode: 'json' | 'form')
playground.setAddContentMenuOpen(open: boolean)
playground.addComponentFromMenu(type: string)
playground.getComponentPreviewText(component: BuilderComponent)
```

### usePreviewSettings Hook

```typescript
import { usePreviewSettings } from '@/features/flow-builder/components/playground/hooks';

const preview = usePreviewSettings({
  persistKey?: string, // Default: 'whatsapp-playground-preview-settings'
});

// State
preview.settings.platform  // 'android' | 'ios'
preview.settings.theme     // 'light' | 'dark'
preview.settings.interactive  // boolean

// Actions
preview.setPlatform(platform: 'android' | 'ios')
preview.setTheme(theme: 'light' | 'dark')
preview.toggleInteractive()
preview.resetSettings()
```

### Content Categories API

```typescript
import {
  CONTENT_CATEGORIES,
  DEFAULT_COMPONENT_VALUES,
  getDefaultComponent,
  getAllComponentTypes,
  getCategoryForType,
  isValidComponentType,
} from '@/features/flow-builder/components/playground/constants/contentCategories';

// Get default config for a component type
const defaults = getDefaultComponent('TextHeading');
// Returns: { text: 'Heading' }

// Get all available component types
const types = getAllComponentTypes();
// Returns: ['TextHeading', 'TextSubheading', ...]

// Find category for a type
const category = getCategoryForType('RadioButtonsGroup');
// Returns: { id: 'selection', label: 'Selection', ... }

// Validate component type
const isValid = isValidComponentType('TextHeading');
// Returns: true
```

---

## Integration Guide

### Integrating with FlowsPage

The playground is already integrated with the `FlowsPage` component:

**FlowsPage.tsx:**
```typescript
import { FlowsPage } from '@/features/flows';

function App() {
  const [view, setView] = useState('flows');
  const [playgroundFlow, setPlaygroundFlow] = useState(null);

  return (
    <>
      {view === 'flows' && (
        <FlowsPage
          onOpenPlayground={(flow) => {
            setPlaygroundFlow(flow);
            setView('playground');
          }}
        />
      )}

      {view === 'playground' && playgroundFlow && (
        <FlowPlaygroundPage
          flowId={playgroundFlow.id}
          initialFlow={{
            name: playgroundFlow.name,
            screens: parseFlowJSON(playgroundFlow.flowJson),
            version: playgroundFlow.flowJson.version,
          }}
          onSave={async (flowData) => {
            await flowsApi.update(playgroundFlow.id, {
              name: flowData.name,
              flowJson: convertToFlowJSON(flowData),
            });
          }}
          onBack={() => {
            setPlaygroundFlow(null);
            setView('flows');
          }}
        />
      )}
    </>
  );
}
```

### Backend Integration

**Save Flow to Backend:**
```typescript
async function saveFlowToBackend(flowData: {
  name: string;
  screens: BuilderScreen[];
  version: FlowJSONVersion;
}) {
  const flowJSON = {
    version: flowData.version,
    data_api_version: '3.0',
    screens: flowData.screens.map((screen) => ({
      id: screen.id,
      title: screen.title,
      terminal: screen.terminal,
      data: screen.data || {},
      layout: {
        type: 'SingleColumnLayout',
        children: screen.components.map((c) => ({
          type: c.type,
          ...c.config,
        })),
      },
      refresh_on_back: screen.refresh_on_back,
    })),
  };

  const response = await fetch(`/api/flows/${flowId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: flowData.name,
      flowJson: flowJSON,
    }),
  });

  return response.json();
}
```

**Load Flow from Backend:**
```typescript
async function loadFlowFromBackend(flowId: string) {
  const response = await fetch(`/api/flows/${flowId}`);
  const flow = await response.json();

  // Convert Flow JSON to BuilderScreen[]
  const screens: BuilderScreen[] = flow.flowJson.screens.map((screen: any) => ({
    id: screen.id,
    title: screen.title,
    terminal: screen.terminal,
    data: screen.data || {},
    refresh_on_back: screen.refresh_on_back,
    components: (screen.layout.children || []).map((child: any, index: number) => ({
      id: `component-${index}`,
      type: child.type,
      config: { ...child },
      validation: { isValid: true, errors: [], warnings: [] },
    })),
  }));

  return {
    id: flow.id,
    name: flow.name,
    screens,
    version: flow.flowJson.version,
  };
}
```

### Adding New Component Editors

1. **Create Editor Component:**

```typescript
// frontend/src/features/flow-builder/components/playground/ContentEditor/editors/MyCustomEditor.tsx

import React from 'react';
import type { ComponentEditorProps } from '../../types/playground.types';
import type { MyCustomComponent } from '@/features/flow-builder/types/flow-json.types';

export const MyCustomEditor: React.FC<ComponentEditorProps> = ({
  component,
  onChange,
  onDelete,
}) => {
  const config = component.config as MyCustomComponent;

  const handleFieldChange = (field: string, value: any) => {
    onChange({
      config: {
        ...component.config,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">My Custom Component</h3>
        <button onClick={onDelete} className="...">
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>

      {/* Add your form fields here */}
      <div>
        <label className="block text-sm text-zinc-400 mb-1.5">Label</label>
        <input
          value={config.label}
          onChange={(e) => handleFieldChange('label', e.target.value)}
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg..."
        />
      </div>
    </div>
  );
};
```

2. **Export Editor:**

```typescript
// frontend/src/features/flow-builder/components/playground/ContentEditor/editors/index.ts

export { TextHeadingEditor } from './TextHeadingEditor';
export { TextInputEditor } from './TextInputEditor';
export { MyCustomEditor } from './MyCustomEditor'; // Add this
```

3. **Add to ComponentAccordionItem:**

```typescript
// frontend/src/features/flow-builder/components/playground/ContentEditor/ComponentAccordionItem.tsx

import { MyCustomEditor } from './editors';

// In the render logic:
{component.type === 'MyCustomComponent' && (
  <MyCustomEditor
    component={component}
    onChange={onUpdate}
    onDelete={onDelete}
  />
)}
```

4. **Add to Content Categories:**

```typescript
// frontend/src/features/flow-builder/components/playground/constants/contentCategories.ts

export const CONTENT_CATEGORIES: ContentCategory[] = [
  // ... existing categories
  {
    id: 'custom',
    label: 'Custom',
    icon: 'extension',
    items: [
      {
        type: 'MyCustomComponent',
        label: 'My Custom Component',
        icon: 'widgets',
      },
    ],
  },
];

export const DEFAULT_COMPONENT_VALUES: Record<string, Record<string, unknown>> = {
  // ... existing defaults
  MyCustomComponent: {
    label: 'Custom Label',
    value: '',
  },
};
```

---

## Best Practices

### State Management

**DO:**
- Use `usePlaygroundState` for all flow/screen/component operations
- Keep component editors stateless (controlled components)
- Use local state only for UI-specific concerns (e.g., accordion expansion)

**DON'T:**
- Directly mutate screen or component arrays
- Duplicate state between hooks and components
- Store derived state (use `useMemo` instead)

### Performance

**DO:**
- Use `useCallback` for event handlers passed to child components
- Use `useMemo` for expensive computations
- Debounce JSON editor updates (500ms recommended)
- Implement virtual scrolling for large component lists (if needed)

**DON'T:**
- Create inline functions in render methods
- Perform expensive operations in render
- Update state on every keystroke without debouncing

### Component Editors

**DO:**
- Follow the `ComponentEditorProps` interface
- Provide clear labels and placeholders
- Show validation errors inline
- Use consistent styling (match existing editors)

**DON'T:**
- Perform side effects outside of callbacks
- Assume component config structure (always validate)
- Hard-code values (use constants)

### Type Safety

**DO:**
- Define proper TypeScript types for all component configs
- Use type guards when accessing component properties
- Export types from a central location

**DON'T:**
- Use `any` type (use `unknown` and type narrowing)
- Cast types without validation
- Ignore TypeScript errors

### Validation

**DO:**
- Validate user input before updating state
- Show clear error messages
- Provide suggestions for fixing errors
- Validate on blur (not on every keystroke)

**DON'T:**
- Show validation errors before user interaction
- Block user input (show warnings instead)
- Use generic error messages

### Accessibility

**DO:**
- Use semantic HTML elements
- Provide `aria-label` for icon buttons
- Support keyboard navigation
- Maintain focus management

**DON'T:**
- Remove focus outlines without providing alternatives
- Use div/span for interactive elements
- Forget screen reader support

### Testing

**Recommended Test Coverage:**

```typescript
// Unit tests for hooks
describe('usePlaygroundState', () => {
  it('should add component from menu', () => {
    // Test component addition
  });

  it('should toggle editor mode', () => {
    // Test mode toggle
  });

  it('should generate correct preview text', () => {
    // Test preview text generation
  });
});

// Integration tests for components
describe('ComponentAccordion', () => {
  it('should reorder components on drag', () => {
    // Test drag-and-drop
  });

  it('should expand/collapse items', () => {
    // Test accordion behavior
  });
});

// E2E tests
describe('FlowPlaygroundPage', () => {
  it('should create and save flow', () => {
    // Test full flow creation workflow
  });

  it('should export valid Flow JSON', () => {
    // Test export functionality
  });
});
```

---

## Troubleshooting

### Common Issues

**1. Monaco Editor not loading:**
- Ensure `@monaco-editor/react` is installed
- Check that Monaco workers are configured in Vite config
- Verify no CSP violations in browser console

**2. Drag-and-drop not working:**
- Check `@dnd-kit/core` and `@dnd-kit/sortable` versions
- Verify sensors are configured correctly
- Ensure component IDs are unique and stable

**3. Preview not updating:**
- Check that `onFormDataChange` is called correctly
- Verify screen navigation callbacks are wired up
- Ensure preview settings are being passed down

**4. JSON Editor validation errors:**
- Check debounce timer (should be 500ms)
- Verify JSON parse error handling
- Ensure screen-to-JSON conversion is correct

**5. Component editors not showing:**
- Verify component type matches editor condition
- Check that editor is imported and exported
- Ensure ComponentAccordionItem includes the editor

### Debug Tips

**Enable Debug Mode:**
```typescript
const playground = usePlaygroundState({
  // ... options
});

// Log state changes
useEffect(() => {
  console.log('Playground state:', {
    screens: playground.screens,
    selectedScreenId: playground.selectedScreenId,
    editorMode: playground.editorMode,
  });
}, [playground.screens, playground.selectedScreenId, playground.editorMode]);
```

**Inspect Flow JSON:**
```typescript
// Add to browser console
window.inspectFlow = () => {
  console.log(JSON.stringify({
    version: playground.flowVersion,
    screens: playground.screens,
  }, null, 2));
};
```

**Check Component Structure:**
```typescript
// Log component config in editor
useEffect(() => {
  console.log('Component config:', component.config);
}, [component]);
```

---

## Future Enhancements

### Planned Features

1. **Undo/Redo System**
   - Command pattern implementation
   - History stack management
   - Keyboard shortcuts (Ctrl+Z, Ctrl+Y)

2. **Template Library**
   - Pre-built flow templates
   - Save custom templates
   - Import/export templates

3. **Collaboration Features**
   - Real-time multiplayer editing
   - Comments and annotations
   - Version history

4. **Advanced Preview**
   - Device frame selection (iPhone 15, Pixel 8, etc.)
   - Screenshot capture
   - Video recording
   - QR code for mobile testing

5. **AI-Powered Features**
   - Auto-complete for text fields
   - Flow suggestions
   - Error detection and fixes
   - Natural language flow generation

6. **Enhanced Validation**
   - Flow-wide validation
   - Navigation path analysis
   - Dead-end detection
   - Required field coverage

7. **Export Options**
   - Export to different Flow versions
   - Generate documentation
   - Create test cases
   - Export as TypeScript types

### Contributing

To contribute new features:

1. Review existing code structure
2. Follow established patterns and conventions
3. Add TypeScript types for all new code
4. Write unit tests for hooks and utilities
5. Update this documentation
6. Submit pull request with clear description

---

## Changelog

### v1.0.1 (2025-11-28)
- **Fix:** WhatsApp Flows ID format - Changed from hyphen to underscore
  - Screen IDs: `screen-123` → `screen_123`
  - Component IDs: `component-123` → `component_123`
  - Reason: WhatsApp Flows API only accepts alphanumeric + underscore
- **Fix:** data-source property name correction
  - Changed from camelCase `dataSource` to hyphenated `'data-source'`
  - Affects: RadioButtonsGroup, CheckboxGroup, Dropdown components
  - Ensures compliance with WhatsApp Flow JSON schema
- **Fix:** Default Flow template in FlowsPage
  - Added proper END screen (terminal: true, success: true)
  - Previous template only had START screen navigating to non-existent END
- **UX:** AddContentMenu improvement
  - Menu now opens upward (bottom-full mb-2) instead of downward
  - Prevents menu overflow on screens with limited vertical space

### v1.0.0 (2025-01-28)
- Initial implementation
- 3-panel layout (Screens, Editor, Preview)
- Form-based and JSON editor modes
- Component library with 10+ component types
- iOS/Android preview with phone frames
- Drag-and-drop component reordering
- Real-time validation
- Export Flow JSON
- localStorage persistence for preview settings
- Responsive design with mobile tabs

---

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [whatsapp-builder/issues](https://github.com/your-org/whatsapp-builder/issues)
- Documentation: [docs.example.com](https://docs.example.com)
- Discord: [discord.gg/example](https://discord.gg/example)

---

**Last Updated:** January 28, 2025
**Version:** 1.0.0
