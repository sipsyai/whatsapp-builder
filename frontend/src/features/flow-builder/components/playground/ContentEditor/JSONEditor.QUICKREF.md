# JSONEditor Quick Reference

## Import
```typescript
import { JSONEditor } from '@/features/flow-builder/components/playground/ContentEditor';
```

## Basic Usage
```typescript
<JSONEditor
  screen={currentScreen}
  onUpdateScreen={handleUpdate}
/>
```

## Props
| Prop | Type | Required |
|------|------|----------|
| screen | BuilderScreen | ✅ |
| onUpdateScreen | (updates: Partial<BuilderScreen>) => void | ✅ |
| className | string | ❌ |

## Features
- 📝 Monaco Editor with JSON syntax highlighting
- 🔄 Two-way sync (Screen ↔ JSON)
- ✅ Real-time validation
- ⏱️ Debounced updates (500ms)
- 🎨 Format JSON
- 📋 Copy to clipboard
- 🌙 Dark theme (vs-dark)

## Keyboard Shortcuts (Monaco)
| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl + F | Find |
| Cmd/Ctrl + H | Replace |
| Alt + Shift + F | Format document |
| Cmd/Ctrl + / | Toggle comment |
| Cmd/Ctrl + D | Select next occurrence |

## JSON Structure
```json
{
  "id": "SCREEN_ID",
  "title": "Screen Title",
  "terminal": false,
  "data": {},
  "layout": {
    "type": "SingleColumnLayout",
    "children": [
      {
        "type": "TextHeading",
        "text": "Hello World"
      }
    ]
  }
}
```

## Example: Tab Integration
```typescript
<Tabs value={tab} onValueChange={setTab}>
  <TabsList>
    <TabsTrigger value="visual">Visual</TabsTrigger>
    <TabsTrigger value="json">JSON</TabsTrigger>
  </TabsList>
  <TabsContent value="json">
    <JSONEditor screen={screen} onUpdateScreen={handleUpdate} />
  </TabsContent>
</Tabs>
```

## Error States
| State | Display |
|-------|---------|
| Valid JSON | ✅ Green indicator at bottom |
| Invalid JSON | ❌ Red error banner with message |
| Parse error | Shows line number if available |

## Styling
```typescript
// Custom container class
<JSONEditor className="shadow-xl border-2" />

// Full height
<div className="h-96">
  <JSONEditor screen={screen} onUpdateScreen={handleUpdate} />
</div>
```

## Common Patterns

### Split View
```typescript
<div className="grid grid-cols-2 gap-4">
  <ComponentAccordion />
  <JSONEditor />
</div>
```

### Modal
```typescript
<Dialog>
  <DialogContent className="h-[80vh]">
    <JSONEditor screen={screen} onUpdateScreen={handleUpdate} />
  </DialogContent>
</Dialog>
```

### Multi-Screen
```typescript
const [screens, setScreens] = useState<BuilderScreen[]>([...]);
const [active, setActive] = useState(0);

<JSONEditor
  screen={screens[active]}
  onUpdateScreen={updates => {
    setScreens(prev => prev.map((s, i) =>
      i === active ? { ...s, ...updates } : s
    ));
  }}
/>
```

## Troubleshooting

### JSON not updating?
- Check if JSON is valid (no error banner)
- Wait 500ms for debounce
- Check browser console for errors

### Format button disabled?
- Fix JSON parse errors first
- Button is disabled when JSON is invalid

### Copy not working?
- Requires HTTPS or localhost
- Check clipboard permissions

## Files
- `JSONEditor.tsx` - Main component
- `JSONEditor.example.tsx` - Usage examples
- `JSONEditor.README.md` - Full documentation
- `JSONEditor.SUMMARY.md` - Implementation details
- `JSONEditor.QUICKREF.md` - This file

## See Also
- Full docs: `JSONEditor.README.md`
- Examples: `JSONEditor.example.tsx`
- Implementation: `JSONEditor.SUMMARY.md`
