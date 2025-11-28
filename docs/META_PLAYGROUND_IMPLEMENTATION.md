# Meta WhatsApp Flows Playground - Implementation Analysis

**Document Version:** 1.0
**Date:** 2025-11-28
**Purpose:** Analysis of Meta's WhatsApp Flows Playground and implementation requirements for replicating it in WhatsApp Builder project

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Playground UI Structure](#playground-ui-structure)
3. [Content Categories & Components](#content-categories--components)
4. [Component Configuration Options](#component-configuration-options)
5. [Flow JSON Structure](#flow-json-structure)
6. [Implementation Requirements](#implementation-requirements)
7. [Comparison with Current Flow Builder](#comparison-with-current-flow-builder)
8. [Recommended Actions](#recommended-actions)

---

## Executive Summary

Meta's WhatsApp Flows Playground (https://developers.facebook.com/docs/whatsapp/flows/playground/) is a simplified visual editor for creating WhatsApp Flows. Unlike the full Flow Builder in WhatsApp Manager, the Playground focuses on quick prototyping with a streamlined UI.

**Key Characteristics:**
- **Three-panel layout:** Screens list, Edit content panel, iPhone preview
- **Accordion-based editing:** Components are edited inline via expandable sections
- **Hierarchical menus:** Content types organized in categories with subcategories
- **Real-time preview:** Changes reflected instantly in iPhone mockup
- **Export capability:** Copy Flow JSON to clipboard

**Current Project Status:**
Our WhatsApp Builder project (`/flowBuilder`) already has a more advanced Flow Builder with ReactFlow canvas, component palette, and screen-based editing. The Playground approach could be integrated as an alternative "Simple Mode" or used to enhance the existing builder's UX.

---

## Playground UI Structure

### 1. Screens Panel (Left)

```
+---------------------------+
|  Screens                  |
+---------------------------+
| ● Feedback 1 of 2    [×]  |
| ● Feedback 2 of 2    [×]  |
|                           |
| [+ Add new]               |
+---------------------------+
```

**Features:**
- List of screens with titles
- Delete button (×) per screen
- "+ Add new" button to create screens
- Click to select/navigate between screens

### 2. Edit Content Panel (Center)

```
+---------------------------+
|  Edit content             |
+---------------------------+
| ▼ Screen title            |
|   [Feedback 1 of 2____]   |
|                           |
| ▶ Small Heading · Would...|
| ▶ Single Choice · Choose..|
| ▶ Small Heading · How...  |
| ▶ Paragraph · Leave...    |
|                           |
| ▼ Button · Continue       |
|   [Continue_______]       |
|                           |
| [Add content]             |
+---------------------------+
```

**Features:**
- Accordion-style component list
- Each component shows: Type · Preview text
- Expand to edit properties
- "Add content" button opens category menu
- Drag to reorder (not implemented in Playground but could be added)

### 3. Preview Panel (Right)

```
+---------------------------+
| Preview        [Copy] [⚙] |
+---------------------------+
|  +---------------------+  |
|  |  iPhone Frame       |  |
|  |                     |  |
|  |  [WhatsApp Flow UI] |  |
|  |                     |  |
|  +---------------------+  |
+---------------------------+
```

**Features:**
- "Copy Flow JSON" button
- "Settings" button with options:
  - Interactive mode (toggle)
  - Platform: Android / iOS
  - Theme: Light / Dark
- iPhone-style frame with WhatsApp Flow preview
- Real-time updates as content is edited

---

## Content Categories & Components

### Add Content Menu Structure

```
[Text]          [Media]         [Text Answer]    [Selection]
├─ Large Heading ├─ Image        ├─ Short Answer  ├─ Single Choice
├─ Small Heading                 ├─ Paragraph     ├─ Multiple Choice
├─ Caption                       └─ Date picker   ├─ Dropdown
└─ Body                                           └─ Opt-in
```

### Component Type Mapping

| Playground Name | Flow JSON Component | Type Value |
|-----------------|---------------------|------------|
| **Text Category** |
| Large Heading | TextHeading | `TextHeading` |
| Small Heading | TextSubheading | `TextSubheading` |
| Caption | TextCaption | `TextCaption` |
| Body | TextBody | `TextBody` |
| **Media Category** |
| Image | Image | `Image` |
| **Text Answer Category** |
| Short Answer | TextInput | `TextInput` |
| Paragraph | TextArea | `TextArea` |
| Date picker | DatePicker | `DatePicker` |
| **Selection Category** |
| Single Choice | RadioButtonsGroup | `RadioButtonsGroup` |
| Multiple Choice | CheckboxGroup | `CheckboxGroup` |
| Dropdown | Dropdown | `Dropdown` |
| Opt-in | OptIn | `OptIn` |

### Components NOT in Playground (Advanced)

These components exist in Flow JSON but are not available in Playground:
- `RichText` - Advanced markdown text
- `EmbeddedLink` - Clickable links
- `CalendarPicker` - Full calendar view
- `NavigationList` - List navigation
- `ChipsSelector` - Chip-based selection
- `ImageCarousel` - Multiple images
- `If` - Conditional rendering
- `Switch` - Switch conditional
- `Form` - Form wrapper (implicit in v4.0+)
- `PhotoPicker` / `DocumentPicker` - Media upload

---

## Component Configuration Options

### Common Properties

All components share these properties:
```json
{
  "type": "ComponentType",
  "visible": "${data.is_visible}"  // Optional, default: true
}
```

### Text Components

**TextHeading / TextSubheading:**
```json
{
  "type": "TextHeading",
  "text": "Your heading text"
}
```
- Character limit: 80

**TextBody / TextCaption:**
```json
{
  "type": "TextBody",
  "text": "Your body text",
  "font-weight": "normal",       // bold, italic, bold_italic, normal
  "strikethrough": false,
  "markdown": false              // v5.1+
}
```
- Body character limit: 4096
- Caption character limit: 409

### Input Components

**TextInput:**
```json
{
  "type": "TextInput",
  "name": "field_name",
  "label": "Label text",
  "required": true,
  "input-type": "text",          // text, number, email, password, passcode, phone
  "min-chars": 1,
  "max-chars": 80,
  "helper-text": "Helper message",
  "pattern": "regex",            // v6.2+
  "init-value": "default"        // v4.0+
}
```

**TextArea:**
```json
{
  "type": "TextArea",
  "name": "field_name",
  "label": "Label text",
  "required": false,
  "max-length": 600,
  "helper-text": "Helper message"
}
```

**DatePicker:**
```json
{
  "type": "DatePicker",
  "name": "date_field",
  "label": "Select date",
  "min-date": "1577836800000",   // Unix timestamp
  "max-date": "1893456000000",
  "unavailable-dates": ["1640995200000"]
}
```

### Selection Components

**RadioButtonsGroup (Single Choice):**
```json
{
  "type": "RadioButtonsGroup",
  "name": "choice_field",
  "label": "Choose one",
  "required": true,
  "data-source": [
    { "id": "option_1", "title": "Yes" },
    { "id": "option_2", "title": "No" }
  ]
}
```

**Note:** Component IDs must use underscores (`_`) not hyphens (`-`)

**CheckboxGroup (Multiple Choice):**
```json
{
  "type": "CheckboxGroup",
  "name": "multi_field",
  "label": "Select all that apply",
  "required": false,
  "min-selected-items": 1,
  "max-selected-items": 3,
  "data-source": [
    { "id": "a", "title": "Option A" },
    { "id": "b", "title": "Option B" }
  ]
}
```

**Dropdown:**
```json
{
  "type": "Dropdown",
  "name": "dropdown_field",
  "label": "Select option",
  "required": true,
  "data-source": [
    { "id": "1", "title": "First" },
    { "id": "2", "title": "Second" }
  ]
}
```

**OptIn:**
```json
{
  "type": "OptIn",
  "name": "consent",
  "label": "I agree to terms",
  "required": true,
  "on-click-action": {
    "name": "navigate",
    "next": { "type": "screen", "name": "TERMS_SCREEN" },
    "payload": {}
  }
}
```

### Footer Component (Required on terminal screens)

```json
{
  "type": "Footer",
  "label": "Continue",
  "on-click-action": {
    "name": "navigate",          // navigate, data_exchange, complete
    "next": { "type": "screen", "name": "NEXT_SCREEN" },
    "payload": {
      "field_value": "${form.field_name}"
    }
  }
}
```

### Image Component

```json
{
  "type": "Image",
  "src": "data:image/png;base64,...",  // or "${data.image_url}"
  "width": 200,
  "height": 200,
  "scale-type": "contain",       // contain, cover
  "aspect-ratio": 1,
  "alt-text": "Description"
}
```

---

## Flow JSON Structure

### Minimal Flow JSON (v7.2)

```json
{
  "version": "7.2",
  "screens": [
    {
      "id": "START",
      "title": "Screen Title",
      "terminal": false,
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Welcome"
          },
          {
            "type": "Footer",
            "label": "Continue",
            "on-click-action": {
              "name": "navigate",
              "next": { "type": "screen", "name": "END" },
              "payload": {}
            }
          }
        ]
      }
    },
    {
      "id": "END",
      "title": "Complete",
      "terminal": true,
      "success": true,
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Thank you!"
          },
          {
            "type": "Footer",
            "label": "Done",
            "on-click-action": {
              "name": "complete",
              "payload": {}
            }
          }
        ]
      }
    }
  ]
}
```

**Important:** Every Flow must have at least one terminal screen (with `terminal: true`)

### Multi-Screen Flow with Data

```json
{
  "version": "7.2",
  "screens": [
    {
      "id": "FEEDBACK_SCREEN",
      "title": "Feedback",
      "data": {
        "question": {
          "type": "string",
          "__example__": "How was your experience?"
        }
      },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextSubheading",
            "text": "${data.question}"
          },
          {
            "type": "RadioButtonsGroup",
            "name": "rating",
            "label": "Rate us",
            "required": true,
            "data-source": [
              { "id": "good", "title": "Good" },
              { "id": "bad", "title": "Bad" }
            ]
          },
          {
            "type": "Footer",
            "label": "Submit",
            "on-click-action": {
              "name": "navigate",
              "next": { "type": "screen", "name": "THANK_YOU" },
              "payload": {
                "user_rating": "${form.rating}"
              }
            }
          }
        ]
      }
    },
    {
      "id": "THANK_YOU",
      "title": "Thank You",
      "terminal": true,
      "data": {
        "user_rating": {
          "type": "string",
          "__example__": "good"
        }
      },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Thank you for your feedback!"
          },
          {
            "type": "Footer",
            "label": "Close",
            "on-click-action": {
              "name": "complete",
              "payload": {
                "rating": "${data.user_rating}"
              }
            }
          }
        ]
      }
    }
  ]
}
```

### With Data Endpoint

```json
{
  "version": "7.2",
  "data_api_version": "3.0",
  "routing_model": {
    "INIT_SCREEN": ["RESULT_SCREEN"],
    "RESULT_SCREEN": []
  },
  "screens": [...]
}
```

---

## Implementation Requirements

### 1. Simple Mode Toggle

Add a "Simple Mode" / "Advanced Mode" toggle to the existing Flow Builder:

```tsx
// FlowBuilderPage.tsx
const [editorMode, setEditorMode] = useState<'simple' | 'advanced'>('advanced');

{editorMode === 'simple' ? (
  <PlaygroundStyleEditor />
) : (
  <ReactFlowCanvas />
)}
```

### 2. Playground-Style Editor Component

Create a new component that mimics Meta's Playground:

```
frontend/src/features/flow-builder/components/
├── PlaygroundEditor/
│   ├── index.tsx                 # Main container
│   ├── ScreensList.tsx           # Left panel - screens list
│   ├── ContentEditor.tsx         # Center panel - accordion editor
│   ├── ComponentAccordion.tsx    # Individual component editor
│   ├── AddContentMenu.tsx        # Category/component selection menu
│   ├── PreviewPanel.tsx          # Right panel - iPhone preview
│   └── PreviewSettings.tsx       # Theme/platform settings
```

### 3. Component Editor Forms

Each component type needs an edit form:

```tsx
// TextHeadingEditor.tsx
interface TextHeadingEditorProps {
  component: FlowComponent;
  onChange: (updated: FlowComponent) => void;
  onDelete: () => void;
}

const TextHeadingEditor: React.FC<TextHeadingEditorProps> = ({
  component, onChange, onDelete
}) => {
  return (
    <div className="space-y-3">
      <Input
        label="Text"
        value={component.text}
        onChange={(e) => onChange({ ...component, text: e.target.value })}
        maxLength={80}
      />
      <Button variant="ghost" onClick={onDelete}>Remove</Button>
    </div>
  );
};
```

### 4. Add Content Menu

Implement hierarchical menu with categories:

```tsx
// AddContentMenu.tsx
const contentCategories = [
  {
    id: 'text',
    label: 'Text',
    items: [
      { id: 'TextHeading', label: 'Large Heading' },
      { id: 'TextSubheading', label: 'Small Heading' },
      { id: 'TextCaption', label: 'Caption' },
      { id: 'TextBody', label: 'Body' },
    ]
  },
  {
    id: 'media',
    label: 'Media',
    items: [
      { id: 'Image', label: 'Image' },
    ]
  },
  {
    id: 'textAnswer',
    label: 'Text Answer',
    items: [
      { id: 'TextInput', label: 'Short Answer' },
      { id: 'TextArea', label: 'Paragraph' },
      { id: 'DatePicker', label: 'Date picker' },
    ]
  },
  {
    id: 'selection',
    label: 'Selection',
    items: [
      { id: 'RadioButtonsGroup', label: 'Single Choice' },
      { id: 'CheckboxGroup', label: 'Multiple Choice' },
      { id: 'Dropdown', label: 'Dropdown' },
      { id: 'OptIn', label: 'Opt-in' },
    ]
  }
];
```

### 5. iPhone Preview Component

Create a realistic iPhone frame with embedded Flow preview:

```tsx
// IPhonePreview.tsx
const IPhonePreview: React.FC<{ flowJson: FlowJSON; theme: 'light' | 'dark' }> = ({
  flowJson, theme
}) => {
  return (
    <div className="iphone-frame">
      <div className="iphone-notch" />
      <div className={`whatsapp-flow-preview ${theme}`}>
        <WhatsAppFlowRenderer
          flowJson={flowJson}
          interactive={true}
        />
      </div>
    </div>
  );
};
```

### 6. State Management

Use existing store or create Playground-specific state:

```tsx
interface PlaygroundState {
  screens: FlowScreen[];
  selectedScreenId: string | null;
  selectedComponentIndex: number | null;
  previewSettings: {
    platform: 'android' | 'ios';
    theme: 'light' | 'dark';
    interactive: boolean;
  };
}

// Actions
- addScreen()
- deleteScreen(id)
- selectScreen(id)
- addComponent(type, screenId)
- updateComponent(screenId, index, data)
- deleteComponent(screenId, index)
- reorderComponents(screenId, fromIndex, toIndex)
- generateFlowJSON(): FlowJSON
```

---

## Comparison with Current Flow Builder

| Feature | Current Flow Builder | Meta Playground | Recommendation |
|---------|---------------------|-----------------|----------------|
| **Layout** | ReactFlow canvas | Three-panel accordion | Keep both, add toggle |
| **Component Add** | Drag from palette | Click menu + subcategories | Implement menu as alternative |
| **Component Edit** | Right panel form | Inline accordion | Implement accordion option |
| **Screen Management** | Canvas nodes | Simple list | Keep both approaches |
| **Preview** | Static preview panel | Interactive iPhone | Enhance with settings |
| **Export** | Save to backend | Copy JSON | Add clipboard copy |
| **Complexity** | Full feature set | Simplified subset | Target beginners |

---

## Recommended Actions

### Phase 1: Quick Wins (1-2 days)

1. **Add "Copy Flow JSON" button** to existing preview panel
2. **Add platform/theme toggle** to preview settings
3. **Implement simplified component menu** with categories

### Phase 2: Playground Mode (3-5 days)

1. **Create PlaygroundEditor component** with three-panel layout
2. **Implement accordion-based component editing**
3. **Add screens list with add/delete functionality**
4. **Create iPhone frame CSS for preview**

### Phase 3: Integration (2-3 days)

1. **Add mode toggle** (Simple/Advanced) to Flow Builder
2. **Ensure state sync** between modes
3. **Add tooltips/help** for new users
4. **Test and polish UX**

### Phase 4: Enhancement (Optional)

1. **Add component templates** (common patterns)
2. **Implement drag-to-reorder** in accordion
3. **Add validation warnings** in simple mode
4. **Create onboarding flow** for first-time users

---

## Technical Notes

### Flow JSON Version

Current project uses **v7.2** which is the latest version. Playground also uses v7.2.

### Required Dependencies

The project already has all necessary dependencies:
- React 18+
- Tailwind CSS v4
- shadcn/ui components
- Lucide icons
- Existing Flow Builder infrastructure

### File Structure Recommendation

```
frontend/src/features/flow-builder/
├── FlowBuilderPage.tsx           # Main page with mode toggle
├── components/
│   ├── canvas/                   # Existing ReactFlow components
│   ├── playground/               # NEW: Playground mode components
│   │   ├── PlaygroundEditor.tsx
│   │   ├── ScreensList.tsx
│   │   ├── ContentEditor.tsx
│   │   ├── AddContentMenu.tsx
│   │   ├── PreviewPanel.tsx
│   │   └── editors/              # Component-specific editors
│   │       ├── TextHeadingEditor.tsx
│   │       ├── TextInputEditor.tsx
│   │       └── ...
│   └── shared/                   # Components used by both modes
│       ├── FlowPreview.tsx
│       └── ComponentIcon.tsx
├── hooks/
│   └── usePlaygroundState.ts     # Playground-specific state
└── utils/
    └── playgroundToFlowJson.ts   # Convert playground state to Flow JSON
```

---

## Conclusion

Meta's WhatsApp Flows Playground offers a streamlined approach to Flow creation that complements our existing advanced Flow Builder. By implementing a "Simple Mode" inspired by the Playground, we can:

1. **Lower the barrier to entry** for new users
2. **Provide faster prototyping** for simple flows
3. **Maintain advanced capabilities** for power users
4. **Align with Meta's official tooling** UX patterns

The implementation can be done incrementally, starting with UI enhancements to the existing builder and gradually adding the full Playground experience.
