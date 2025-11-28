# Component Editors

Inline editors for WhatsApp Flow components in the Playground.

## Overview

This directory contains form-based editors for different WhatsApp Flow component types. Each editor provides a clean, compact interface for editing component properties inline within the Playground UI.

## Available Editors

### 1. TextHeadingEditor
**Used for:** `TextHeading`, `TextSubheading`, `TextBody`, `TextCaption`

**Fields:**
- `text` - Text content (textarea)
- `font-weight` - Font weight (select) - Only for TextBody and TextCaption
  - normal
  - bold
  - italic
  - bold_italic

### 2. TextInputEditor
**Used for:** `TextInput`, `TextArea`

**Fields:**
- `label` - Input label (text)
- `name` - Field name (text, auto-generated from label)
- `required` - Required field (checkbox)
- `input-type` - Input type (select) - Only for TextInput
  - text
  - number
  - email
  - phone
  - password
  - passcode
- `helper-text` - Optional help text (text)

### 3. DropdownEditor
**Used for:** `Dropdown`

**Fields:**
- `label` - Dropdown label (text)
- `required` - Required field (checkbox)
- `data-source` - Options editor
  - Each option has: `id` (auto-generated), `title` (text)
  - Add/remove buttons for managing options

### 4. RadioButtonsEditor
**Used for:** `RadioButtonsGroup`, `CheckboxGroup`

**Fields:**
- `label` - Group label (text)
- `name` - Field name (text, auto-generated from label)
- `required` - Required field (checkbox)
- `min-selected-items` - Min selections (number) - Only for CheckboxGroup
- `max-selected-items` - Max selections (number) - Only for CheckboxGroup
- `data-source` - Options editor
  - Each option has: `id` (auto-generated), `title` (text)
  - Add/remove buttons for managing options

### 5. FooterEditor
**Used for:** `Footer`

**Fields:**
- `label` - Button text (text)
- `on-click-action.name` - Action type (select)
  - navigate - Navigate to another screen
  - complete - Complete the flow
  - data_exchange - Exchange data with endpoint
- `next.name` - Target screen ID (text) - Only for navigate action

## Usage

### Basic Usage

```tsx
import { getEditorForType } from './editors';

const MyComponent: React.FC = () => {
  const [component, setComponent] = useState<BuilderComponent>({
    id: 'comp_1',
    type: 'TextInput',
    config: {
      type: 'TextInput',
      label: 'Name',
      name: 'name',
      required: true,
    },
  });

  const handleChange = (updates: Partial<BuilderComponent>) => {
    setComponent({ ...component, ...updates });
  };

  const handleDelete = () => {
    // Handle component deletion
  };

  const Editor = getEditorForType(component.type);

  if (!Editor) {
    return <div>No editor available for {component.type}</div>;
  }

  return (
    <Editor
      component={component}
      onChange={handleChange}
      onDelete={handleDelete}
    />
  );
};
```

### Check if Editor Exists

```tsx
import { hasEditor } from './editors';

if (hasEditor('TextInput')) {
  // Show inline editor
} else {
  // Fallback to JSON editor
}
```

### Get All Supported Types

```tsx
import { getSupportedComponentTypes } from './editors';

const supportedTypes = getSupportedComponentTypes();
console.log(supportedTypes);
// ['TextHeading', 'TextSubheading', 'TextBody', 'TextCaption', 'TextInput', ...]
```

## Component Editor Props

All editors receive the same props interface:

```typescript
interface ComponentEditorProps {
  // The component being edited
  component: BuilderComponent;

  // Callback when component properties change
  onChange: (updates: Partial<BuilderComponent>) => void;

  // Callback when component should be deleted
  onDelete: () => void;
}
```

## Design Principles

### 1. Compact Layout
- Minimal spacing (`space-y-3`)
- Small text sizes (`text-sm`, `text-xs`)
- Efficient use of space

### 2. Dark Theme
- Background: `bg-zinc-900`
- Borders: `border-zinc-700`
- Labels: `text-zinc-400`
- Input text: `text-white`

### 3. Consistent Styling
- All inputs use same base classes
- Focus states with `focus:ring-2 focus:ring-primary/50`
- Hover states for interactive elements
- Material Symbols icons for actions

### 4. User Experience
- Auto-generation of field names from labels
- Inline validation feedback
- Clear visual hierarchy
- Helpful placeholder text
- Descriptive helper text

### 5. Type Safety
- Full TypeScript typing
- Type guards for conditional rendering
- Proper event typing
- Comprehensive interfaces

## Adding New Editors

To add a new editor:

1. Create the editor component file (e.g., `MyComponentEditor.tsx`)
2. Implement the `ComponentEditorProps` interface
3. Add styling consistent with existing editors
4. Export the editor in `index.ts`
5. Add to `EDITOR_MAP` in `index.ts`
6. Update this README

Example:

```tsx
// MyComponentEditor.tsx
import React from 'react';
import type { ComponentEditorProps } from '../../types/playground.types';
import type { MyComponent } from '../../../../types/flow-json.types';

export const MyComponentEditor: React.FC<ComponentEditorProps> = ({
  component,
  onChange,
  onDelete,
}) => {
  const config = component.config as MyComponent;

  // ... implementation

  return (
    <div className="space-y-3">
      {/* Editor UI */}
    </div>
  );
};
```

```typescript
// index.ts
import { MyComponentEditor } from './MyComponentEditor';

const EDITOR_MAP: Record<string, React.FC<ComponentEditorProps>> = {
  // ... existing editors
  MyComponent: MyComponentEditor,
};
```

## Features

### Auto-Generation
- Field names auto-generated from labels
- Option IDs auto-generated with timestamps
- Smart defaults for all fields

### Validation
- Required field indicators
- Input type constraints (min/max for numbers)
- Clear error states

### Interactive Options
- Add/remove options dynamically
- Reorder options (future)
- Duplicate options (future)

### Conditional Fields
- Show/hide fields based on component type
- Context-aware help text
- Type-specific options

## Future Enhancements

- [ ] Drag-and-drop reordering for options
- [ ] Rich text editor for text fields
- [ ] Variable picker for dynamic values
- [ ] Validation rules editor
- [ ] Copy/paste options between components
- [ ] Undo/redo for inline edits
- [ ] Keyboard shortcuts
- [ ] Accessibility improvements
