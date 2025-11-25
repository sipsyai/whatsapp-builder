# Flow Preview Components

Interactive WhatsApp Flow preview components with iPhone frame and component rendering.

## Overview

The FlowPreview container provides a fully interactive preview of WhatsApp Flows within a realistic iPhone mock frame. It includes:

- iPhone 14-style frame with notch and status bar
- WhatsApp-themed UI with green accent colors
- Form state management across screens
- Screen navigation with history
- Dark mode support
- All WhatsApp Flow component types

## Components

### FlowPreview (Main Container)

The main preview container that manages flow state and navigation.

```tsx
import { FlowPreview } from '@/features/flow-builder/components/preview';

<FlowPreview
  screens={screens}
  currentScreenId="WELCOME"
  onNavigate={(screenId) => console.log('Navigate to:', screenId)}
  onComplete={(payload) => console.log('Completed:', payload)}
/>
```

**Props:**
- `screens: BuilderScreen[]` - Array of screens in the flow
- `currentScreenId: string` - ID of the currently displayed screen
- `onNavigate: (screenId: string) => void` - Callback when navigating to another screen
- `onComplete: (payload: any) => void` - Callback when flow is completed

**Features:**
- Form data persistence across screens
- Navigation history with back button
- Reset button to restart flow
- Debug panel (in development mode)

### PhoneFrame

iPhone 14-style mock frame for preview.

```tsx
import { PhoneFrame } from '@/features/flow-builder/components/preview';

<PhoneFrame>
  {/* Your content here */}
</PhoneFrame>
```

**Features:**
- Dynamic Island notch
- Status bar with time, signal, wifi, battery icons
- Rounded corners (40px radius)
- Responsive sizing with max-height
- Dark mode support
- Safe area padding

### ScreenPreview

Renders a single screen with all its components.

```tsx
import { ScreenPreview } from '@/features/flow-builder/components/preview';

<ScreenPreview
  screen={screen}
  formData={formData}
  onFormDataChange={(field, value) => console.log(field, value)}
  onNavigate={(screenId, payload) => {}}
  onComplete={(payload) => {}}
/>
```

**Features:**
- WhatsApp-themed header with back button
- Scrollable body content
- Fixed footer (if present)
- Component rendering with proper styling

## Supported Components

All WhatsApp Flow JSON v7.2 components are supported:

### Text Components
- `TextHeading` - Large heading text
- `TextSubheading` - Medium heading text
- `TextBody` - Body text with font-weight and strikethrough support
- `TextCaption` - Small caption text
- `RichText` - Rich formatted text (not yet implemented)

### Input Components
- `TextInput` - Single line text input with validation
- `TextArea` - Multi-line text input

### Selection Components
- `CheckboxGroup` - Multiple selection checkboxes
- `RadioButtonsGroup` - Single selection radio buttons
- `Dropdown` - Dropdown select menu

### Date Components
- `DatePicker` - Date selection input
- `CalendarPicker` - Calendar date picker (not yet implemented)

### Interactive Components
- `Footer` - Fixed bottom action button
- `OptIn` - Checkbox for opt-in consent
- `EmbeddedLink` - Clickable link (not yet implemented)

### Media Components
- `Image` - Image display
- `ImageCarousel` - Image carousel (not yet implemented)

### Navigation Components
- `NavigationList` - List of navigation items (not yet implemented)

### Conditional Components
- `If` - Conditional rendering (not yet implemented)
- `Switch` - Switch case rendering (not yet implemented)

## Styling

The preview uses WhatsApp's official color palette:

### Light Mode
- Primary: `#00a884` (WhatsApp green)
- Background: `#f3f4f6` (Light gray)
- Text: `#111827` (Dark gray)

### Dark Mode
- Primary: `#00a884` (WhatsApp green)
- Background: `#0d1912` (Dark green-black)
- Text: `#ffffff` (White)

## Examples

See `FlowPreview.example.tsx` for complete working examples:

### Basic Example
```tsx
import { FlowPreviewExample } from './FlowPreview.example';

// Shows a simple two-screen flow with inputs and navigation
<FlowPreviewExample />
```

### Advanced Example
```tsx
import { AdvancedFlowPreviewExample } from './FlowPreview.example';

// Shows signup flow with radio buttons and dropdowns
<AdvancedFlowPreviewExample />
```

### Dark Mode Example
```tsx
import { DarkModeFlowPreviewExample } from './FlowPreview.example';

// Shows survey flow in dark mode
<DarkModeFlowPreviewExample />
```

## Form State Management

Form data is automatically managed by FlowPreview:

1. User input is stored in `formData` state
2. Data persists across screen navigation
3. Data is passed to `onComplete` callback
4. Data can be merged with navigation payloads

```tsx
// Example form data structure
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "interests": ["tech", "sports"],
  "notifications_opt_in": true
}
```

## Navigation

Navigation is handled automatically:

1. Footer buttons with `navigate` action navigate to specified screen
2. Navigation history is tracked for back button
3. Back button navigates to previous screen
4. Reset button returns to first screen

```tsx
// Footer configuration for navigation
{
  type: 'Footer',
  label: 'Continue',
  'on-click-action': {
    name: 'navigate',
    next: {
      type: 'screen',
      name: 'NEXT_SCREEN'
    },
    payload: { /* optional data */ }
  }
}
```

## Completion

Flow completion is triggered by Footer with `complete` action:

```tsx
// Footer configuration for completion
{
  type: 'Footer',
  label: 'Submit',
  'on-click-action': {
    name: 'complete',
    payload: { /* optional data */ }
  }
}
```

The `onComplete` callback receives all form data merged with the completion payload.

## Development

### Debug Mode

In development mode, a debug panel is available showing:
- Current screen ID
- Navigation history
- Current form data (JSON)

Toggle the panel by clicking "Debug Info" at the bottom of the preview.

### Adding New Component Renderers

To add a new component type renderer:

1. Add case to `ComponentRenderer` switch in `ScreenPreview.tsx`
2. Create renderer function (e.g., `MyComponentRenderer`)
3. Implement UI with WhatsApp styling
4. Handle form data if applicable

Example:
```tsx
case 'MyComponent':
  return (
    <MyComponentRenderer
      config={config}
      value={formData[config.name] || ''}
      onChange={(value) => onFormDataChange(config.name, value)}
    />
  );

function MyComponentRenderer({ config, value, onChange }) {
  return (
    <div className="space-y-1.5">
      {/* Component UI */}
    </div>
  );
}
```

## File Structure

```
preview/
├── FlowPreview.tsx           # Main container
├── PhoneFrame.tsx            # iPhone frame
├── ScreenPreview.tsx         # Screen renderer with all component types
├── FlowPreview.example.tsx   # Usage examples
├── index.ts                  # Exports
└── README.md                 # This file
```

## Integration

To integrate FlowPreview into your Flow Builder:

```tsx
import { FlowPreview } from '@/features/flow-builder/components/preview';
import { useFlowBuilder } from '@/features/flow-builder/hooks';

function FlowBuilder() {
  const { screens, currentScreen, navigateToScreen } = useFlowBuilder();

  return (
    <div className="flex">
      {/* Left: Canvas/Editor */}
      <div className="flex-1">
        {/* Your editor UI */}
      </div>

      {/* Right: Preview */}
      <div className="w-[500px]">
        <FlowPreview
          screens={screens}
          currentScreenId={currentScreen.id}
          onNavigate={navigateToScreen}
          onComplete={(payload) => {
            console.log('Flow completed:', payload);
            // Handle completion
          }}
        />
      </div>
    </div>
  );
}
```

## Dependencies

- React 18+
- Tailwind CSS
- Material Symbols (for icons)
- TypeScript

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Notes

- Phone frame uses CSS transforms and may not render perfectly on all browsers
- Status bar time updates every minute
- Form validation is not enforced (validation is for display only)
- Dynamic strings (e.g., `${data.field}`) are not evaluated (shown as-is)
