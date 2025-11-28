# PreviewPanel Components

This directory contains the components for the WhatsApp Flows Playground preview panel.

## Components

### PreviewSettings

A dropdown menu component for configuring preview settings.

**Props:**
```typescript
interface PreviewSettingsProps {
  settings: PreviewSettings;
  onSettingsChange: (settings: Partial<PreviewSettings>) => void;
}
```

**Features:**
- Platform toggle (iOS/Android) with icons
- Theme toggle (Light/Dark) with icons
- Interactive mode checkbox
- Dropdown menu with outside click detection
- Consistent styling with project theme
- Accessible with ARIA labels

**Usage:**
```tsx
import { PreviewSettings } from './PreviewPanel';

<PreviewSettings
  settings={previewSettings}
  onSettingsChange={(updates) => setPreviewSettings({ ...previewSettings, ...updates })}
/>
```

### CopyJsonButton

A button component for copying Flow JSON to clipboard.

**Props:**
```typescript
interface CopyJsonButtonProps {
  screens: BuilderScreen[];
  flowVersion?: FlowJSONVersion;
  onCopy?: () => void;
}
```

**Features:**
- Generates Flow JSON from BuilderScreens
- Copies formatted JSON to clipboard
- Visual feedback (icon changes to check, green color)
- Auto-resets after 2 seconds
- Error handling with console logging
- Default Flow JSON version: 7.2

**Flow JSON Format:**
```json
{
  "version": "7.2",
  "screens": [
    {
      "id": "SCREEN_ID",
      "title": "Screen Title",
      "terminal": false,
      "data": {},
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          { "type": "TextHeading", "text": "..." }
        ]
      }
    }
  ]
}
```

**Usage:**
```tsx
import { CopyJsonButton } from './PreviewPanel';

<CopyJsonButton
  screens={screens}
  flowVersion="7.2"
  onCopy={() => console.log('Copied!')}
/>
```

## Styling

Both components use:
- Tailwind CSS classes
- Material Symbols icons (settings, content_copy, check)
- Zinc color palette (800, 700, 600, 400)
- Primary color for active states
- Consistent hover and focus states

## File Structure

```
PreviewPanel/
├── PreviewSettings.tsx      # Settings dropdown component
├── CopyJsonButton.tsx        # Copy JSON button component
├── index.tsx                 # Export barrel file
├── PreviewPanel.example.tsx  # Usage example
└── README.md                 # This file
```

## Example

See `PreviewPanel.example.tsx` for a complete example of how to use both components together in a preview panel toolbar.
