# WhatsApp Flow Builder Feature - Architecture & Implementation

## Overview

The Flow Builder is a comprehensive visual editor for creating WhatsApp Flows (WhatsApp's native interactive forms/flows). This is separate from the ChatBot Builder, which creates conversation flows.

## Feature Comparison

| Aspect | ChatBot Builder | Flow Builder |
|--------|----------------|--------------|
| Purpose | Conversation flows | WhatsApp interactive forms |
| Output | ChatBot nodes/edges | WhatsApp Flow JSON |
| API Target | Internal ChatBot execution | WhatsApp Flows API |
| Components | Start, Message, Question, Condition, WhatsAppFlow | WhatsApp native components (TextInput, Dropdown, Footer, etc.) |
| Layout | Free-form node canvas | Screen-based with component list |
| Use Case | Multi-turn conversations | Single-screen or multi-screen forms |

## Architecture

### Directory Structure

```
frontend/src/features/flow-builder/
├── FlowBuilderPage.tsx               # Main builder page
├── components/
│   ├── canvas/
│   │   ├── FlowCanvas.tsx            # Main ReactFlow canvas
│   │   ├── ScreenNode.tsx            # Custom screen node
│   │   └── useFlowCanvas.ts          # Canvas state management
│   ├── palette/
│   │   ├── ComponentPalette.tsx      # Component palette sidebar
│   │   └── DraggableComponent.tsx    # Draggable component items
│   ├── editor/
│   │   ├── ScreenEditor.tsx          # Screen property editor
│   │   ├── ComponentList.tsx         # Component list with DnD
│   │   └── ComponentConfigModals.tsx # Component configuration
│   ├── preview/
│   │   ├── FlowPreview.tsx           # Interactive flow preview
│   │   ├── PhoneFrame.tsx            # iPhone frame wrapper
│   │   ├── ScreenPreview.tsx         # Screen rendering
│   │   └── renderers/                # Component renderers
│   │       ├── TextRenderers.tsx
│   │       ├── InputRenderers.tsx
│   │       ├── SelectionRenderers.tsx
│   │       └── ActionRenderers.tsx
│   └── validation/
│       └── ValidationPanel.tsx       # Validation error display
├── constants/
│   ├── character-limits.ts           # WhatsApp API character limits
│   ├── data-source-limits.ts         # Component count limits
│   └── component-defaults.ts         # Default component values
├── hooks/
│   ├── useFlowBuilder.ts             # Main state management
│   ├── useFlowValidation.ts          # Validation logic
│   └── useFlowHistory.ts             # Undo/redo support
├── utils/
│   ├── flowJsonGenerator.ts          # Builder → WhatsApp Flow JSON
│   ├── flowJsonParser.ts             # WhatsApp Flow JSON → Builder
│   └── validation-rules.ts           # Validation rule engine
├── types/
│   ├── flow-json.types.ts            # WhatsApp Flow JSON types
│   └── builder.types.ts              # Builder-specific types
└── README.md
```

### Key Components

1. **FlowBuilderPage**: Main orchestrator
2. **ComponentPalette**: Drag source for components
3. **FlowCanvas**: Visual screen layout (ReactFlow)
4. **ScreenEditor**: Property and component editor
5. **FlowPreview**: Interactive preview
6. **ValidationPanel**: Real-time error display

### Data Flow

```
User Action
  ↓
FlowBuilderPage (state)
  ↓
useFlowBuilder hook
  ├─ Manage screens[]
  ├─ Manage selectedScreen
  └─ Provide CRUD operations
  ↓
useFlowCanvas hook
  ├─ Sync with ReactFlow
  └─ Render screen nodes
  ↓
Components (Palette, Editor, Preview)
  ↓
Transform (flowJsonGenerator)
  ↓
Save to API (flowsApi.update)
```

### Dependencies

#### New Packages
- `@dnd-kit/core`: ^6.3.1 - Core drag & drop primitives
- `@dnd-kit/sortable`: ^10.0.0 - Sortable list functionality
- `@dnd-kit/utilities`: ^3.2.2 - Utility functions

#### Existing Packages
- `@xyflow/react`: ^12.3.5 - Canvas visualization
- `react`: ^19.2.0 - Core framework

## Integration Points

### 1. App.tsx Integration

**New State**:
- `selectedFlow`: Stores flow being edited
- View state extended: `"flowBuilder"`

**Navigation**:
```typescript
FlowsPage → onEditInBuilder → App.tsx sets selectedFlow → navigates to flowBuilder
FlowBuilderPage → onSave → API update → App.tsx → navigates back to flows
```

### 2. Flows API Integration

**Used Endpoints**:
- `GET /api/flows/:id` - Load flow for editing
- `PUT /api/flows/:id` - Save edited flow
- `GET /api/flows/active` - Load flows for selection (in ConfigModal)

### 3. Database Schema

**Relevant Tables**:
- `whatsapp_flows` table stores Flow JSON in `flow_json` JSONB column
- Flow Builder reads/writes to this column

## Validation System

### Validation Rules

The validation system ensures WhatsApp Flow JSON compliance:

1. **Character Limits**: Per-field character count validation
2. **Data Source Limits**: Min/max options for dropdowns, lists, etc.
3. **Screen Rules**: Max 50 components, single footer, terminal screen requirements
4. **Component Rules**: Required fields, format validation
5. **Flow Rules**: At least one screen, navigation connectivity

### Validation Error Types

```typescript
enum ValidationErrorType {
  CHARACTER_LIMIT = 'CHARACTER_LIMIT',
  DATA_SOURCE_LIMIT = 'DATA_SOURCE_LIMIT',
  MAX_COMPONENTS = 'MAX_COMPONENTS',
  SINGLE_FOOTER = 'SINGLE_FOOTER',
  TERMINAL_FOOTER_REQUIRED = 'TERMINAL_FOOTER_REQUIRED',
  NAVIGATION_LIST_ON_TERMINAL = 'NAVIGATION_LIST_ON_TERMINAL',
  IF_FOOTER_BOTH_BRANCHES = 'IF_FOOTER_BOTH_BRANCHES',
  IF_NESTED_LIMIT = 'IF_NESTED_LIMIT',
  EMPTY_VALUE = 'EMPTY_VALUE',
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
}
```

### Character Limits (WhatsApp API)

| Component | Field | Max Characters |
|-----------|-------|----------------|
| TextHeading | text | 80 |
| TextSubheading | text | 80 |
| TextBody | text | 4096 |
| TextCaption | text | 4096 |
| TextInput | label | 20 |
| TextInput | helper-text | 80 |
| TextArea | label | 20 |
| Dropdown | label | 20 |
| Footer | label | 35 |

### Data Source Limits

| Component | Min | Max |
|-----------|-----|-----|
| Dropdown | 1 | 200 |
| RadioButtonsGroup | 1 | 20 |
| CheckboxGroup | 1 | 20 |
| ChipsSelector | 2 | 30 |
| NavigationList | 2 | 10 |

## Component System

### Component Categories

1. **Text Components**:
   - TextHeading, TextSubheading, TextBody, TextCaption, RichText

2. **Input Components**:
   - TextInput, TextArea

3. **Selection Components**:
   - Dropdown, RadioButtonsGroup, CheckboxGroup, ChipsSelector

4. **Date Components**:
   - DatePicker, CalendarPicker

5. **Media Components**:
   - Image, ImageCarousel

6. **Navigation Components**:
   - NavigationList

7. **Action Components**:
   - Footer, OptIn, EmbeddedLink

8. **Control Components**:
   - If, Switch

### Component Defaults

Each component type has predefined defaults in `component-defaults.ts`:

```typescript
export const COMPONENT_DEFAULTS = {
  TextInput: {
    type: 'TextInput',
    label: '',
    name: '',
    inputType: 'text',
    required: false,
    visible: true,
    maxChars: '80',
  },
  // ... 20+ more component types
};
```

## State Management

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

  // Screen operations
  addScreen: (screen?: Partial<BuilderScreen>) => BuilderScreen;
  updateScreen: (screenId: string, updates: Partial<BuilderScreen>) => void;
  deleteScreen: (screenId: string) => void;

  // Component operations
  addComponent: (screenId: string, component: Partial<BuilderComponent>) => BuilderComponent | null;
  updateComponent: (screenId: string, componentId: string, updates: Partial<BuilderComponent>) => void;
  deleteComponent: (screenId: string, componentId: string) => void;
  reorderComponents: (screenId: string, newOrder: string[]) => void;

  // Selection
  selectScreen: (screenId: string | null) => void;
  selectComponent: (componentId: string | null) => void;
}
```

### useFlowCanvas Hook

Manages ReactFlow state, syncs with builder screens.

## File Structure Details

### Constants

- `character-limits.ts`: Per-field character limits
- `data-source-limits.ts`: Min/max counts for dropdowns, lists
- `component-defaults.ts`: Default values for all component types

### Utils

- `flowJsonGenerator.ts`: Builder → WhatsApp Flow JSON
- `flowJsonParser.ts`: WhatsApp Flow JSON → Builder
- `validation-rules.ts`: Validation rule implementations

### Types

- `flow-json.types.ts`: WhatsApp API types (Screen, Component, Layout)
- `builder.types.ts`: Internal builder types (BuilderScreen, BuilderComponent)

## Data Transformation

### Builder Format → Flow JSON

```typescript
// flowJsonGenerator.ts
export function builderScreenToFlowScreen(screen: BuilderScreen): Screen {
  return {
    id: screen.id,
    title: screen.title,
    terminal: screen.terminal,
    data: screen.data || {},
    layout: {
      type: 'SingleColumnLayout',
      children: screen.components.map(comp => componentToFlowJson(comp))
    }
  };
}
```

### Flow JSON → Builder Format

```typescript
// flowJsonParser.ts
export function parseFlowJSON(flowJSON: FlowJSON): BuilderScreen[] {
  return flowJSON.screens.map(screen => ({
    id: screen.id,
    title: screen.title,
    terminal: screen.terminal || false,
    data: screen.data || {},
    components: extractComponentsFromLayout(screen.layout),
    validation: { isValid: true, errors: [], warnings: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}
```

## UI Layout

```
┌────────────┬───────────────────────────────┬──────────────────┐
│ Component  │      Flow Canvas              │ Screen Editor    │
│ Palette    │   (ReactFlow Visual Editor)   │                  │
│            │                               │ - Properties     │
│ [Search]   │   [Screen Nodes]              │ - Components     │
│            │                               │                  │
│ Categories │   [Add Screen +]              ├──────────────────┤
│ - Text     │                               │ Flow Preview     │
│ - Input    │                               │ (iPhone Frame)   │
│ - ...      │                               │                  │
└────────────┴───────────────────────────────┴──────────────────┘
```

## Production Readiness

### Completed
- Full drag & drop support
- Real-time validation
- Character/data source limit enforcement
- Screen and component CRUD operations
- Preview functionality
- Dark mode support
- Export/Import Flow JSON
- Integration with Flows API

### TODO
- Undo/Redo implementation (hook exists)
- Keyboard shortcuts
- Copy/paste screens
- Component templates
- AI-assisted generation
- Collaborative editing

## Performance Considerations

- **Memoization**: Heavy use of `useMemo` and `useCallback`
- **Lazy Loading**: Example files excluded from build
- **Efficient Updates**: Immutable state updates

## Testing Strategy

- Unit tests for validation rules
- Integration tests for data transformation
- E2E tests for builder flows (recommended)

## Deployment Notes

- No new environment variables required
- New npm packages need installation (`npm install`)
- No database migrations needed (uses existing `flow_json` column)
- Compatible with existing Flows API

---

**Related Documentation**:
- [03-frontend-architecture.md](./03-frontend-architecture.md) - Frontend details
- [06-whatsapp-integration.md](./06-whatsapp-integration.md) - WhatsApp Flows API
- Frontend README: `/home/ali/whatsapp-builder/frontend/src/features/flow-builder/README.md`
