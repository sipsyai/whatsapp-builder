# Create with Playground Feature - WhatsApp Flow Creation

## Overview

The "Create with Playground" feature allows users to create WhatsApp Flows directly from the WhatsApp Flow Playground interface without needing to upload exported JSON files. This provides a streamlined workflow for creating flows from scratch or editing existing ones.

## Feature Summary

| Aspect | Details |
|--------|---------|
| Purpose | Create WhatsApp Flows interactively using Playground UI |
| User Flow | FlowsPage → Click "Create with Playground" → Design flow → Save with name + categories |
| Backend Endpoint | `POST /api/flows/from-playground` |
| Frontend Components | FlowPlaygroundPage (create/edit mode), SaveFlowModal |
| Categories | USER selects from WhatsApp Flow Categories during save |

## Architecture

### User Journey

```
FlowsPage
   |
   +-- Click "Create with Playground" button
   |
   v
App.tsx: setPlaygroundFlow(null), setView("playground")
   |
   v
FlowPlaygroundPage (mode: 'create', initialFlow: undefined)
   |
   +-- usePlaygroundState starts with empty flow
   |
   +-- User designs flow (screens, components, etc.)
   |
   +-- Click "Save" button
   |
   v
SaveFlowModal opens
   |
   +-- Enter flow name (required)
   +-- Select categories (min 1 required)
   +-- Click "Save"
   |
   v
App.tsx: onSave callback
   |
   +-- flowsApi.createFromPlayground({ name, categories, playgroundJson })
   +-- setView("flows")
   |
   v
FlowsPage (new flow appears in list with DRAFT status)
```

### Component Architecture

```
frontend/src/
├── features/
│   ├── flows/
│   │   ├── components/
│   │   │   └── FlowsPage.tsx              # "Create with Playground" button
│   │   └── api/
│   │       ├── index.ts                   # WhatsAppFlowCategory type
│   │       └── flowsApi.createFromPlayground()
│   │
│   └── flow-builder/
│       ├── FlowPlaygroundPage.tsx         # mode: 'create' | 'edit'
│       └── components/playground/modals/
│           └── SaveFlowModal.tsx          # Name + Categories form
│
└── app/
    └── App.tsx                            # State orchestration
```

## Implementation Details

### 1. FlowsPage - "Create with Playground" Button

**File**: `/frontend/src/features/flows/components/FlowsPage.tsx`

**Changes**:
- Added "Create with Playground" button in header (next to "Sync Flows")
- Button calls `onOpenPlayground(null)` to indicate create mode
- Updated `FlowsPageProps.onOpenPlayground` to accept `WhatsAppFlow | null`

**UI Location**: Header actions row, between "Sync Flows" and "Create Flow" buttons

```typescript
<button
  onClick={() => onOpenPlayground(null)}
  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
>
  <span className="material-symbols-outlined">science</span>
  Create with Playground
</button>
```

### 2. SaveFlowModal Component

**File**: `/frontend/src/features/flow-builder/components/playground/modals/SaveFlowModal.tsx`

**Purpose**: Collect flow name and categories before saving

**Features**:
- Flow name input (required)
- Category checkboxes (min 1 required)
- Client-side validation with error messages
- Auto-resets form when modal opens

**Props**:
```typescript
interface SaveFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; categories: string[] }) => void;
  initialName?: string;
}
```

**Validation Rules**:
- Name cannot be empty (trimmed)
- At least one category must be selected
- Shows red border on invalid fields
- Submit disabled until valid

**Categories** (from `WhatsAppFlowCategory` enum):
- SIGN_UP
- SIGN_IN
- APPOINTMENT_BOOKING
- LEAD_GENERATION
- CONTACT_US
- CUSTOMER_SUPPORT
- SURVEY
- OTHER

### 3. FlowPlaygroundPage - Create/Edit Mode

**File**: `/frontend/src/features/flow-builder/FlowPlaygroundPage.tsx`

**New Props**:
```typescript
interface FlowPlaygroundPageProps {
  flowId?: string;
  initialFlow?: {
    name: string;
    screens: BuilderScreen[];
    version?: FlowJSONVersion;
  };
  mode?: 'create' | 'edit';  // NEW - Determines save behavior
  onSave?: (flowData: {
    name: string;
    categories?: string[];
    screens: BuilderScreen[];
    version: FlowJSONVersion;
  }) => void;
  onBack?: () => void;
}
```

**Behavior by Mode**:

| Mode | Save Button Action | Modal Behavior |
|------|-------------------|----------------|
| `create` | Opens SaveFlowModal | Asks for name + categories |
| `edit` | Saves directly | No modal (uses existing name/categories) |

**Implementation**:
```typescript
const handleSave = useCallback(() => {
  if (mode === 'create') {
    setShowSaveModal(true); // Open modal to collect name + categories
  } else {
    // Edit mode: Save directly
    onSave?.({
      name: playground.flowName,
      screens: playground.screens,
      version: playground.flowVersion,
    });
  }
}, [mode, playground, onSave]);
```

### 4. App.tsx - State Management

**File**: `/frontend/src/app/App.tsx`

**State Changes**:
```typescript
const [playgroundFlow, setPlaygroundFlow] = useState<WhatsAppFlow | null>(null);
```

**Navigation Handler**:
```typescript
const handleOpenPlayground = (flow: WhatsAppFlow | null) => {
  setPlaygroundFlow(flow); // null = create mode, WhatsAppFlow = edit mode
  setView("playground");
};
```

**onSave Logic**:
```typescript
const handlePlaygroundSave = async (flowData) => {
  try {
    if (playgroundFlow === null) {
      // CREATE MODE
      await flowsApi.createFromPlayground({
        name: flowData.name,
        categories: flowData.categories,
        playgroundJson: generateFlowJSON(flowData.screens, flowData.version),
      });
    } else {
      // EDIT MODE
      await flowsApi.update(playgroundFlow.id, {
        flowJson: generateFlowJSON(flowData.screens, flowData.version),
      });
    }

    setView("flows"); // Navigate back to flows list
    setPlaygroundFlow(null); // Clear state
  } catch (error) {
    console.error('Failed to save flow:', error);
  }
};
```

**FlowPlaygroundPage Props**:
```typescript
<FlowPlaygroundPage
  mode={playgroundFlow === null ? 'create' : 'edit'}
  flowId={playgroundFlow?.id}
  initialFlow={playgroundFlow ? {
    name: playgroundFlow.name,
    screens: parseFlowJSON(playgroundFlow.flowJson),
    version: playgroundFlow.flowJson.version,
  } : undefined}
  onSave={handlePlaygroundSave}
  onBack={() => setView("flows")}
/>
```

## Backend Integration

### Endpoint: `POST /api/flows/from-playground`

**Controller**: `/backend/src/modules/flows/flows.controller.ts`

```typescript
@Post('from-playground')
@HttpCode(HttpStatus.CREATED)
@ApiOperation({
  summary: 'Create Flow from Playground JSON',
  description: 'Creates a WhatsApp Flow from exported Playground JSON. Automatically validates and normalizes the JSON structure.'
})
async createFromPlayground(@Body() dto: CreateFlowFromPlaygroundDto): Promise<WhatsAppFlow> {
  return this.flowsService.createFromPlayground(dto);
}
```

### DTO: CreateFlowFromPlaygroundDto

**File**: `/backend/src/modules/flows/dto/create-flow-from-playground.dto.ts`

**Fields**:
```typescript
class CreateFlowFromPlaygroundDto {
  playgroundJson: any;                      // Complete playground export JSON
  name?: string;                            // Optional - auto-generated from screens
  description?: string;                     // Optional
  categories: WhatsAppFlowCategory[];       // Required - at least 1
  endpointUri?: string;                     // Optional - custom endpoint
  autoPublish?: boolean;                    // Optional - default: false
}
```

### Service: FlowsService.createFromPlayground()

**File**: `/backend/src/modules/flows/flows.service.ts`

**Process**:
1. **Validate Playground JSON**: Check `version`, `screens` fields
2. **Normalize JSON**: Ensure required fields, preserve optional ones
3. **Generate Name**: From `dto.name` → first screen title → first screen ID → "Playground Flow"
4. **Create in WhatsApp API**: Call `whatsappFlowService.createFlow()`
5. **Upload Flow JSON**: Call `whatsappFlowService.updateFlowJson()` to upload JSON via assets endpoint
6. **Save to Database**: Store with metadata indicating playground source
7. **Auto-Publish** (if requested): Call `publish(flow.id)`

**Important Note on Flow JSON Upload**:
After creating the flow, the flow JSON must be uploaded separately using the assets endpoint (`/{flow_id}/assets`) with multipart/form-data. This is because Meta API does not accept flow_json in the standard create/update request body.

**Validation Logic**:
```typescript
validateAndNormalizePlaygroundJson(playgroundJson: any): any {
  if (!playgroundJson.version) {
    throw new BadRequestException('Playground JSON missing "version" field');
  }

  if (!Array.isArray(playgroundJson.screens) || playgroundJson.screens.length === 0) {
    throw new BadRequestException('Playground JSON must contain at least one screen');
  }

  return {
    version: playgroundJson.version,
    screens: playgroundJson.screens,
    data_api_version: playgroundJson.data_api_version || '3.0',
    routing_model: playgroundJson.routing_model || {},
    ...playgroundJson, // Preserve other fields
  };
}
```

**Name Generation**:
```typescript
generateFlowNameFromPlayground(flowJson: any): string | null {
  if (flowJson.screens?.[0]?.title) {
    return flowJson.screens[0].title;
  }

  if (flowJson.screens?.[0]?.id) {
    // Convert "WELCOME_SCREEN" → "Welcome Screen"
    return flowJson.screens[0].id
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

  return null;
}
```

**Metadata Tracking**:
```typescript
metadata: {
  source: 'playground',
  created_from_playground: true,
  playground_json_received: new Date().toISOString(),
}
```

## WhatsApp Flow Categories

**Backend**: `/backend/src/entities/whatsapp-flow.entity.ts`

**Frontend**: `/frontend/src/features/flows/api/index.ts`

**Enum Values**:
```typescript
enum WhatsAppFlowCategory {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  APPOINTMENT_BOOKING = 'APPOINTMENT_BOOKING',
  LEAD_GENERATION = 'LEAD_GENERATION',
  CONTACT_US = 'CONTACT_US',
  CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT',
  SURVEY = 'SURVEY',
  OTHER = 'OTHER',
}
```

**Usage**: Categories help WhatsApp organize and filter flows in their dashboard.

## Frontend API Client

**File**: `/frontend/src/features/flows/api/index.ts`

**New Method**:
```typescript
async createFromPlayground(data: {
  name: string;
  categories: WhatsAppFlowCategory[];
  playgroundJson: any;
  description?: string;
  endpointUri?: string;
  autoPublish?: boolean;
}): Promise<WhatsAppFlow> {
  const response = await apiClient.post('/api/flows/from-playground', data);
  return response.data;
}
```

## Validation & Error Handling

### Frontend Validation

**SaveFlowModal**:
- Name required (trimmed)
- At least 1 category required
- Shows inline error messages
- Submit button disabled while invalid

**FlowPlaygroundPage**:
- Validates screens before save (min 1 screen)
- Checks for valid component structure

### Backend Validation

**DTO Level** (class-validator):
- `@IsString()` for name
- `@IsArray()` and `@IsEnum(WhatsAppFlowCategory, { each: true })` for categories
- `@IsObject()` for playgroundJson

**Service Level**:
- Playground JSON structure validation
- **Deep Equality Check**: When validating with existing flow, compares JSON using `deepEqual()` helper
  - Ignores key ordering in objects
  - Recursively compares nested structures
  - Skips unnecessary Meta API updates if JSON semantically identical
- WhatsApp API error handling
- Database constraint validation

**Flow JSON Validation with Meta API**:
- Uses `flowsService.validateFlowJson()` method
- Efficient validation by checking deep equality before updating
- Returns validation_errors from Meta API
- For details, see [WhatsApp Integration - validateFlowJson](./06-whatsapp-integration.md#flowsservice-methods)

### Error Responses

**400 Bad Request**:
```json
{
  "statusCode": 400,
  "message": "Playground JSON missing required \"version\" field",
  "error": "Bad Request"
}
```

**400 Invalid Categories**:
```json
{
  "statusCode": 400,
  "message": "categories must be an array of valid WhatsAppFlowCategory values",
  "error": "Bad Request"
}
```

## Data Flow

### 1. Create Flow Request

```
User fills SaveFlowModal
  ↓
{ name: "My Flow", categories: ["OTHER"] }
  ↓
App.tsx: handlePlaygroundSave()
  ↓
flowsApi.createFromPlayground({
  name: "My Flow",
  categories: ["OTHER"],
  playgroundJson: {
    version: "7.2",
    screens: [...]
  }
})
  ↓
POST /api/flows/from-playground
  ↓
FlowsService.createFromPlayground()
  ├─ Validate JSON
  ├─ Create in WhatsApp API
  └─ Save to database
  ↓
Response: WhatsAppFlow entity
  ↓
Frontend: Navigate to FlowsPage
```

### 2. Database Storage

**Table**: `whatsapp_flows`

**Columns Used**:
- `id`: UUID (primary key)
- `whatsappFlowId`: WhatsApp API Flow ID
- `name`: User-provided name
- `description`: "Created from WhatsApp Flow Playground"
- `status`: DRAFT (initially)
- `categories`: JSONB array
- `flowJson`: JSONB (normalized playground JSON)
- `endpointUri`: Custom endpoint (if provided)
- `isActive`: true
- `metadata`: JSONB with `source: 'playground'`

**Example Record**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "whatsappFlowId": "123456789012345",
  "name": "Customer Survey",
  "description": "Created from WhatsApp Flow Playground",
  "status": "DRAFT",
  "categories": ["SURVEY"],
  "flowJson": {
    "version": "7.2",
    "screens": [...]
  },
  "metadata": {
    "source": "playground",
    "created_from_playground": true,
    "playground_json_received": "2025-11-28T10:30:00Z"
  },
  "createdAt": "2025-11-28T10:30:00Z",
  "updatedAt": "2025-11-28T10:30:00Z"
}
```

## UI/UX Details

### SaveFlowModal Design

**Layout**: Centered modal with backdrop blur effect

**Sections**:
1. **Header**: "Save Flow" title + close button
2. **Form**:
   - Flow Name input (autofocus)
   - Categories grid (2 columns)
3. **Footer**: Cancel + Save buttons

**Styling**:
- Dark theme (bg-surface)
- Purple accent for selected categories
- Red border for validation errors
- Material Symbols icons

**Accessibility**:
- Keyboard navigation (Tab, Enter, Esc)
- Focus management (autofocus on name input)
- Error announcements (ARIA)

### FlowsPage Button Placement

**Location**: Header row, between existing action buttons

**Button Style**:
- Purple background (distinguishes from green "Sync" button)
- "science" icon (beaker) - represents experimentation
- "Create with Playground" text

**Button Order**:
```
[Sync Flows] [Create with Playground] [Create Flow]
```

## Integration Points

### Existing Features

**FlowsPage** (existing):
- Already had "Create Flow" modal
- Already had "Edit in Playground" functionality
- New button complements existing flows

**FlowPlaygroundPage** (existing):
- Used for editing existing flows
- Now supports create mode via `mode` prop
- Reuses all existing playground components

**App.tsx** (existing):
- Already managed flow state for editing
- Extended to support `null` flow for create mode
- Reuses existing navigation logic

### New Features

**SaveFlowModal** (new):
- Standalone modal component
- Reusable for future flows
- Follows project modal patterns

**createFromPlayground API** (new):
- Dedicated endpoint for playground creation
- Different from standard create endpoint
- Handles playground JSON normalization

## Production Readiness

### Completed

- Full create flow implementation
- Modal validation and UX
- Backend DTO and service
- Error handling (client + server)
- WhatsApp API integration
- Database storage with metadata

### Future Enhancements

**Templates** (planned):
- Pre-built flow templates in SaveFlowModal
- Quick-start flows for common use cases

**Auto-Save** (planned):
- Local storage draft saving
- Prevent data loss on accidental close

**Bulk Import** (planned):
- Upload multiple playground JSON files
- Batch creation with preview

**JSON Editor** (planned):
- Advanced users can edit raw JSON
- Syntax highlighting and validation

## Testing Strategy

### Unit Tests

**SaveFlowModal**:
- Validation logic (name required, categories required)
- Form submission with valid data
- Form reset on open/close

**FlowsService.createFromPlayground()**:
- Playground JSON validation
- Name generation logic
- Metadata creation

### Integration Tests

**Create Flow E2E**:
1. Navigate to FlowsPage
2. Click "Create with Playground"
3. Add screens and components
4. Click Save → Enter name + categories
5. Verify flow appears in list
6. Verify flow has DRAFT status

**API Tests**:
- POST /api/flows/from-playground with valid JSON
- POST with missing categories (expect 400)
- POST with invalid playground JSON (expect 400)

## File Locations

### Frontend

**Components**:
- `/frontend/src/features/flows/components/FlowsPage.tsx` - Create button
- `/frontend/src/features/flow-builder/FlowPlaygroundPage.tsx` - Mode support
- `/frontend/src/features/flow-builder/components/playground/modals/SaveFlowModal.tsx` - Modal

**API**:
- `/frontend/src/features/flows/api/index.ts` - API client

**Types**:
- `/frontend/src/features/flows/api/index.ts` - WhatsAppFlowCategory type

### Backend

**Controller**:
- `/backend/src/modules/flows/flows.controller.ts` - Endpoint

**Service**:
- `/backend/src/modules/flows/flows.service.ts` - Business logic

**DTO**:
- `/backend/src/modules/flows/dto/create-flow-from-playground.dto.ts` - Validation

**Entity**:
- `/backend/src/entities/whatsapp-flow.entity.ts` - WhatsAppFlowCategory enum

## Comparison: Create vs Create with Playground

| Aspect | Create Flow (Modal) | Create with Playground |
|--------|-------------------|------------------------|
| Entry Point | Modal in FlowsPage | Button → Playground page |
| Design Tool | JSON editor in modal | Interactive playground UI |
| Preview | None | Real-time WhatsApp preview |
| Validation | Manual JSON validation | Visual validation |
| Components | Hand-written JSON | Drag & drop components |
| Learning Curve | High (requires JSON knowledge) | Low (visual WYSIWYG) |
| Use Case | Quick JSON import | Complex flow design |

## Summary

The "Create with Playground" feature provides a visual, user-friendly way to create WhatsApp Flows:

1. **User Experience**: Seamless integration with existing flows UI
2. **Backend**: Dedicated endpoint with validation and normalization
3. **Frontend**: Modal-driven flow name + category collection
4. **Data Flow**: Playground JSON → Validation → WhatsApp API → Database
5. **Production Ready**: Full error handling, validation, and persistence

**Key Innovation**: Unlike the standard create flow (which requires JSON), this feature leverages the interactive playground UI to make flow creation accessible to non-technical users.

---

**Related Documentation**:
- [Flow Builder Feature](./11-flow-builder-feature.md) - Playground architecture
- [WhatsApp Integration](./06-whatsapp-integration.md) - Flows API details
- [Frontend Architecture](./03-frontend-architecture.md) - Component patterns
- [Backend Architecture](./02-backend-architecture.md) - Flows module
