# PreviewPanel Implementation Summary

## Overview

The PreviewPanel is the main container component for displaying WhatsApp Flow previews in the Playground. It integrates the phone frame, screen preview, navigation controls, and settings UI into a cohesive preview experience.

## File Structure

```
PreviewPanel/
├── PreviewPanel.tsx           # Main preview panel component
├── PreviewSettings.tsx         # Settings dropdown component
├── CopyJsonButton.tsx          # Copy JSON button component
├── PlatformPhoneFrame.tsx      # Platform-specific phone frame
├── index.tsx                   # Export barrel file
├── PreviewPanel.example.tsx    # Usage example
├── README.md                   # Component documentation
└── IMPLEMENTATION.md           # This file
```

## Component: PreviewPanel.tsx

### Location
```
/home/ali/whatsapp-builder/frontend/src/features/flow-builder/components/playground/PreviewPanel/PreviewPanel.tsx
```

### Props Interface

```typescript
export interface PreviewPanelProps {
  screens: BuilderScreen[];                    // All screens in the flow
  currentScreenId: string | null;              // ID of current screen
  previewSettings: PreviewSettingsType;        // Preview configuration
  onNavigate?: (screenId: string) => void;     // Screen navigation callback
  onSettingsChange?: (settings: Partial<PreviewSettingsType>) => void;  // Settings callback
  onCopyJson?: () => void;                     // Copy JSON callback (optional)
  className?: string;                          // Optional container class
}
```

### Key Features

#### 1. Three-Panel Layout

```
┌─────────────────────────────────────────┐
│ Header                                  │ ← Title + Settings + Copy JSON
├─────────────────────────────────────────┤
│                                         │
│           Phone Frame                   │ ← Preview Area (scrollable)
│                                         │
├─────────────────────────────────────────┤
│ Footer                                  │ ← Navigation Controls
└─────────────────────────────────────────┘
```

#### 2. Header Section

**Components:**
- Title: "Preview"
- `PreviewSettings` component (dropdown)
- `CopyJsonButton` component

**Behavior:**
- Settings only shown if `onSettingsChange` callback provided
- Copy button always shown, uses `CopyJsonButton` component

#### 3. Preview Area

**Features:**
- Scrollable container (`overflow-auto`)
- Contains `PhoneFrame` component
- Renders `ScreenPreview` with current screen
- Manages form data state internally
- Handles interactive preview navigation

**State Management:**
```typescript
const [formData, setFormData] = useState<Record<string, any>>({});
```

Form data persists across user interactions within the preview, allowing:
- Form input testing
- Multi-screen data flow
- Realistic user experience

#### 4. Navigation Footer

**Controls:**
- Previous Button (disabled on first screen)
- Screen Indicator ("Screen X / Y")
- Next Button (disabled on last screen)

**Navigation Types:**

1. **Manual Navigation** (Previous/Next buttons)
   - Sequential movement through screen list
   - Independent of flow logic
   - Updates via `onNavigate` callback

2. **Interactive Navigation** (from preview components)
   - Triggered by Footer buttons, actions, etc.
   - Follows flow's navigation rules
   - Can pass payload data between screens
   - Merges payload into form data

### State & Memoization

```typescript
// Current screen index calculation (memoized)
const currentScreenIndex = useMemo(() => {
  if (!currentScreenId) return -1;
  return screens.findIndex((s) => s.id === currentScreenId);
}, [screens, currentScreenId]);

// Current screen (memoized)
const currentScreen = useMemo(() => {
  if (currentScreenIndex === -1) return null;
  return screens[currentScreenIndex];
}, [screens, currentScreenIndex]);

// Navigation boundaries
const canGoPrevious = currentScreenIndex > 0;
const canGoNext = currentScreenIndex < screens.length - 1;
```

### Event Handlers

#### Form Data Changes
```typescript
const handleFormDataChange = useCallback((field: string, value: any) => {
  setFormData((prev) => ({
    ...prev,
    [field]: value,
  }));
}, []);
```

#### Previous/Next Navigation
```typescript
const handlePrevious = useCallback(() => {
  if (canGoPrevious && onNavigate) {
    const previousScreen = screens[currentScreenIndex - 1];
    onNavigate(previousScreen.id);
  }
}, [canGoPrevious, onNavigate, screens, currentScreenIndex]);
```

#### Interactive Navigation
```typescript
const handleNavigateFromPreview = useCallback(
  (screenId: string, payload?: any) => {
    // Merge payload into form data
    if (payload) {
      setFormData((prev) => ({ ...prev, ...payload }));
    }

    // Navigate to screen
    if (onNavigate) {
      onNavigate(screenId);
    }
  },
  [onNavigate]
);
```

#### Flow Completion
```typescript
const handleComplete = useCallback((payload: any) => {
  console.log('Flow completed with payload:', payload);
  // TODO: Show completion dialog or callback
}, []);
```

### Empty States

#### No Screens
```tsx
<div className="text-center space-y-4 px-6">
  <div className="text-6xl">📱</div>
  <div className="space-y-2">
    <h3 className="text-lg font-medium text-white">No screens to preview</h3>
    <p className="text-sm text-zinc-400 max-w-sm">
      Add a screen to your flow to see the preview here...
    </p>
  </div>
</div>
```

#### Screen Not Found
```tsx
<div className="text-center space-y-4 px-6">
  <div className="text-6xl">⚠️</div>
  <div className="space-y-2">
    <h3 className="text-lg font-medium text-white">Screen not found</h3>
    <p className="text-sm text-zinc-400 max-w-sm">
      The selected screen could not be found...
    </p>
  </div>
</div>
```

## Integration with Existing Components

### PhoneFrame
```typescript
import { PhoneFrame } from '../../preview/PhoneFrame';
```

**Purpose:** iPhone-style mock frame with:
- Dynamic Island notch
- Status bar (time, signal, battery)
- Rounded corners (40px radius)
- Proper aspect ratio (390/844)

### ScreenPreview
```typescript
import { ScreenPreview } from '../../preview/ScreenPreview';
```

**Purpose:** Renders individual screen with:
- WhatsApp-themed UI
- Interactive components
- Form state management
- Navigation handling

**Props passed:**
```typescript
<ScreenPreview
  screen={currentScreen}
  formData={formData}
  onFormDataChange={handleFormDataChange}
  onNavigate={handleNavigateFromPreview}
  onComplete={handleComplete}
/>
```

### PreviewSettings
```typescript
import { PreviewSettings } from './PreviewSettings';
```

**Purpose:** Dropdown menu for:
- Platform selection (iOS/Android)
- Theme toggle (Light/Dark)
- Interactive mode toggle

### CopyJsonButton
```typescript
import { CopyJsonButton } from './CopyJsonButton';
```

**Purpose:** Button that:
- Generates Flow JSON from BuilderScreens
- Copies to clipboard
- Shows visual feedback (check icon, green color)

## Usage Example

```tsx
import { PreviewPanel } from './components/playground/PreviewPanel';
import { useState } from 'react';
import type { BuilderScreen, PreviewSettings } from './types';

function PlaygroundPage() {
  const [screens, setScreens] = useState<BuilderScreen[]>([
    { id: 'WELCOME', title: 'Welcome', components: [...], ... },
    { id: 'FORM', title: 'Form', components: [...], ... },
  ]);

  const [currentScreenId, setCurrentScreenId] = useState<string>('WELCOME');

  const [previewSettings, setPreviewSettings] = useState<PreviewSettings>({
    platform: 'android',
    theme: 'light',
    interactive: true,
  });

  const handleCopyJson = () => {
    console.log('JSON copied!');
  };

  return (
    <div className="h-screen">
      <PreviewPanel
        screens={screens}
        currentScreenId={currentScreenId}
        previewSettings={previewSettings}
        onNavigate={setCurrentScreenId}
        onSettingsChange={(updates) =>
          setPreviewSettings((prev) => ({ ...prev, ...updates }))
        }
        onCopyJson={handleCopyJson}
      />
    </div>
  );
}
```

## Styling

### Color Palette
- Background: `bg-zinc-900`
- Headers/Footers: `bg-[#112217]` (dark green)
- Borders: `border-zinc-700`
- Text: `text-white`, `text-zinc-300`, `text-zinc-400`
- Buttons: `bg-zinc-800`, `hover:bg-zinc-700`

### Layout Classes
- Container: `h-full flex flex-col`
- Header: `flex-shrink-0 border-b`
- Preview Area: `flex-1 overflow-auto`
- Footer: `flex-shrink-0 border-t`

### Icons (Material Symbols)
- `content_copy` - Copy JSON button
- `settings` - Settings dropdown
- `arrow_back` - Previous button
- `arrow_forward` - Next button

## TypeScript Types

```typescript
import type { BuilderScreen } from '../../../types/builder.types';
import type { PreviewSettings as PreviewSettingsType } from '../types/playground.types';

// BuilderScreen
interface BuilderScreen {
  id: string;
  title: string;
  components: BuilderComponent[];
  terminal: boolean;
  data?: Record<string, any>;
  // ... other fields
}

// PreviewSettings
interface PreviewSettings {
  platform: 'android' | 'ios';
  theme: 'light' | 'dark';
  interactive: boolean;
}
```

## Exports

**index.tsx:**
```typescript
export { PreviewPanel } from './PreviewPanel';
export type { PreviewPanelProps } from './PreviewPanel';
export { PreviewSettings } from './PreviewSettings';
export { CopyJsonButton } from './CopyJsonButton';
```

## Future Enhancements

### 1. Platform-Specific Frame
Currently uses default `PhoneFrame`. Could use `PlatformPhoneFrame` to show:
- Android-style frame when `platform === 'android'`
- iOS-style frame when `platform === 'ios'`
- Different status bars, notches, etc.

### 2. Completion Callback
Add optional `onComplete` prop:
```typescript
onComplete?: (payload: any) => void;
```

Could show:
- Success dialog
- Final payload data
- Options to reset or export

### 3. Keyboard Shortcuts
- Left/Right arrows for navigation
- R for reset
- C for copy JSON
- S for settings

### 4. Screen Zoom
Add zoom controls for the preview area:
- Fit to screen
- 100%
- 125%
- 150%

### 5. Responsive Layout
Improve mobile/tablet experience:
- Collapsible header/footer
- Touch-friendly buttons
- Better phone frame sizing

## Testing Checklist

- [ ] Empty state shows when no screens
- [ ] Error state shows when screen not found
- [ ] Previous button disabled on first screen
- [ ] Next button disabled on last screen
- [ ] Screen indicator shows correct position (X / Y)
- [ ] Navigation callbacks called with correct screen IDs
- [ ] Form data persists across interactions
- [ ] Interactive navigation works (Footer buttons)
- [ ] Copy JSON button works
- [ ] Settings dropdown works (if implemented)
- [ ] Scrolling works in preview area
- [ ] PhoneFrame renders correctly
- [ ] ScreenPreview renders components correctly

## Related Files

- `/home/ali/whatsapp-builder/frontend/src/features/flow-builder/components/preview/PhoneFrame.tsx`
- `/home/ali/whatsapp-builder/frontend/src/features/flow-builder/components/preview/ScreenPreview.tsx`
- `/home/ali/whatsapp-builder/frontend/src/features/flow-builder/types/builder.types.ts`
- `/home/ali/whatsapp-builder/frontend/src/features/flow-builder/components/playground/types/playground.types.ts`
