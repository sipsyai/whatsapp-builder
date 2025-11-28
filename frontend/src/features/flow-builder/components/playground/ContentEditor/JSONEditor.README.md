# JSONEditor Component

Monaco Editor-based JSON editing component for WhatsApp Flow screens in the Playground.

## Overview

The JSONEditor provides a powerful code editing experience for viewing and modifying WhatsApp Flow screen data in JSON format. It features:

- **Monaco Editor Integration**: Full-featured code editor with syntax highlighting
- **Two-way Sync**: Automatic synchronization between visual UI and JSON representation
- **Real-time Validation**: Instant feedback on JSON parsing errors
- **Debounced Updates**: Performance-optimized with 500ms debounce
- **Format & Copy Utilities**: Built-in JSON formatting and clipboard support

## Installation

The component uses `@monaco-editor/react`, which is already included in the project dependencies.

```bash
npm install @monaco-editor/react
```

## Basic Usage

```tsx
import { JSONEditor } from './components/playground/ContentEditor';
import type { BuilderScreen } from './types/builder.types';

function MyComponent() {
  const [screen, setScreen] = useState<BuilderScreen>({
    id: 'WELCOME',
    title: 'Welcome Screen',
    terminal: false,
    components: [],
    validation: { isValid: true, errors: [], warnings: [] },
  });

  const handleUpdateScreen = (updates: Partial<BuilderScreen>) => {
    setScreen(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="h-96">
      <JSONEditor
        screen={screen}
        onUpdateScreen={handleUpdateScreen}
      />
    </div>
  );
}
```

## Props

### JSONEditorProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `screen` | `BuilderScreen` | Yes | The screen to edit in JSON format |
| `onUpdateScreen` | `(updates: Partial<BuilderScreen>) => void` | Yes | Callback when JSON is updated |
| `className` | `string` | No | Additional CSS classes for the container |

## Features

### 1. Two-way Synchronization

The editor maintains sync between the screen object and JSON representation:

**Screen → JSON**: When the screen prop changes (by ID), the JSON is automatically updated.

**JSON → Screen**: When user edits JSON, changes are debounced (500ms) and converted back to screen updates.

### 2. JSON Validation

The component validates JSON in real-time:

- **Valid JSON**: Shows green indicator at bottom
- **Invalid JSON**: Shows error banner with message and line number
- **Auto-recovery**: Keeps previous valid state if JSON becomes invalid

### 3. Editor Features

Built on Monaco Editor with optimized settings:

```typescript
{
  minimap: { enabled: false },      // No minimap for cleaner UI
  fontSize: 14,                     // Readable font size
  lineNumbers: 'on',                // Show line numbers
  scrollBeyondLastLine: false,      // Compact scrolling
  automaticLayout: true,            // Auto-resize
  tabSize: 2,                       // 2-space indentation
  wordWrap: 'on',                   // Wrap long lines
  formatOnPaste: true,              // Auto-format on paste
  formatOnType: true,               // Auto-format while typing
}
```

### 4. Toolbar Actions

**Format Button**:
- Prettifies JSON with proper indentation
- Disabled when JSON is invalid
- Uses 2-space indentation

**Copy Button**:
- Copies current JSON to clipboard
- Shows "Copied" confirmation for 2 seconds
- Works even with invalid JSON

## Data Conversion

### Screen to JSON

Converts `BuilderScreen` to WhatsApp Flow JSON structure:

```typescript
{
  id: "SCREEN_ID",
  title: "Screen Title",
  terminal: false,
  data: { ...screenData },
  layout: {
    type: "SingleColumnLayout",
    children: [
      { type: "TextHeading", text: "..." },
      { type: "TextInput", name: "...", ... }
    ]
  }
}
```

### JSON to Screen

Parses JSON back into `BuilderScreen` format:

- Preserves existing component IDs when possible
- Generates new IDs for new components
- Maintains component validation state
- Handles missing/optional fields gracefully

## Styling

The component uses Tailwind CSS classes and follows the dark theme:

```tsx
<JSONEditor
  screen={screen}
  onUpdateScreen={handleUpdate}
  className="shadow-xl border-2 border-blue-500"
/>
```

### Color Scheme

- Background: `bg-zinc-800` (toolbar), `vs-dark` theme (editor)
- Borders: `border-zinc-700`
- Valid state: `bg-green-900/10`, `text-green-400`
- Error state: `bg-red-900/20`, `text-red-400`

## Performance Optimization

### Debouncing

JSON → Screen updates are debounced with 500ms delay to prevent:
- Excessive re-renders during typing
- Performance issues with large screens
- Unnecessary validation runs

### Cleanup

The component properly cleans up:
- Debounce timers on unmount
- Event listeners
- Monaco editor instances

## Error Handling

### Parse Errors

When JSON parsing fails:

1. Error message is displayed in red banner
2. Line number is extracted and shown (if available)
3. Screen is NOT updated (keeps previous valid state)
4. Format button is disabled
5. User can continue editing to fix the error

### Recovery

The component is resilient to errors:

```typescript
try {
  const parsed = JSON.parse(value);
  const updates = jsonToScreen(parsed, screen);
  onUpdateScreen(updates);
} catch (error) {
  // Show error, keep current state
  setParseError(error.message);
}
```

## Integration Examples

### With Playground Tabs

```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="visual">Visual</TabsTrigger>
    <TabsTrigger value="json">JSON</TabsTrigger>
  </TabsList>

  <TabsContent value="visual">
    <ComponentAccordion screen={screen} />
  </TabsContent>

  <TabsContent value="json">
    <JSONEditor screen={screen} onUpdateScreen={handleUpdate} />
  </TabsContent>
</Tabs>
```

### Split View

```tsx
<div className="grid grid-cols-2 gap-4 h-full">
  <div>
    <h3>Visual Editor</h3>
    <ComponentAccordion screen={screen} />
  </div>

  <div>
    <h3>JSON Editor</h3>
    <JSONEditor screen={screen} onUpdateScreen={handleUpdate} />
  </div>
</div>
```

### Full Screen Modal

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-5xl h-[80vh]">
    <DialogHeader>
      <DialogTitle>Edit JSON - {screen.title}</DialogTitle>
    </DialogHeader>
    <div className="flex-1 min-h-0">
      <JSONEditor screen={screen} onUpdateScreen={handleUpdate} />
    </div>
  </DialogContent>
</Dialog>
```

## Technical Details

### Component Structure

```
JSONEditor
├── Toolbar
│   ├── Title (code icon + "JSON Editor")
│   └── Actions
│       ├── Format Button
│       └── Copy Button
├── Monaco Editor (flex-1)
│   └── JSON content with syntax highlighting
└── Status Bar (conditional)
    ├── Error Display (if parseError)
    └── Valid Indicator (if no error)
```

### State Management

```typescript
const [jsonValue, setJsonValue] = useState<string>('');
const [parseError, setParseError] = useState<string | null>(null);
const [parseErrorLine, setParseErrorLine] = useState<number | null>(null);
const [isCopied, setIsCopied] = useState(false);
const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
```

### Lifecycle

1. **Mount**: Initialize JSON from screen
2. **Screen ID Change**: Re-initialize JSON (screen switched)
3. **User Edit**: Update jsonValue → debounce → parse → update screen
4. **Unmount**: Clear debounce timer

## Accessibility

- All buttons have `title` attributes for tooltips
- Material Symbols icons provide visual cues
- Error messages include line numbers for screen readers
- Proper ARIA roles from Monaco Editor

## Browser Compatibility

Monaco Editor supports:
- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions

## Known Limitations

1. **Component IDs**: New components get generated IDs, not user-defined
2. **Validation State**: Component validation is reset to valid on JSON updates
3. **Single Screen**: Edits one screen at a time (not multi-screen JSON)
4. **Layout Type**: Always uses `SingleColumnLayout` (WhatsApp Flows standard)

## Troubleshooting

### JSON not updating screen

Check:
- Is JSON valid? (look for error banner)
- Is debounce timer still pending? (wait 500ms)
- Are component types recognized?

### Format button disabled

The Format button is disabled when JSON is invalid. Fix parse errors first.

### Copy not working

Clipboard API requires HTTPS or localhost. Check browser console for permissions.

## Future Enhancements

Possible improvements:

- [ ] Schema validation (beyond JSON parsing)
- [ ] Auto-complete for component types
- [ ] Inline error markers in editor
- [ ] Diff view (show changes)
- [ ] Import/export JSON files
- [ ] Custom themes (light mode)
- [ ] Keyboard shortcuts (Cmd+S to save)

## Related Components

- `ComponentAccordion`: Visual component editor
- `FlowPlaygroundPage`: Parent container
- `BuilderScreen`: Type definition

## See Also

- [Monaco Editor Documentation](https://microsoft.github.io/monaco-editor/)
- [WhatsApp Flows JSON Spec](https://developers.facebook.com/docs/whatsapp/flows)
- [JSONEditor.example.tsx](./JSONEditor.example.tsx) - Usage examples
