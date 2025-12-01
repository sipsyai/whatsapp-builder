# Chatbot Import/Export Feature

## Overview

The Chatbot Import/Export feature allows users to backup, share, and migrate chatbots between environments. This feature supports exporting chatbot configurations as JSON files with optional embedded WhatsApp Flows and importing them back with duplicate name handling and dependency resolution.

**Feature Status**: Production Ready
**Module**: ChatBotsModule
**Version**: 1.0

---

## Backend Architecture

### DTOs

#### 1. Export DTOs

**File**: `backend/src/modules/chatbots/dto/export-chatbot.dto.ts`

**ExportChatbotQueryDto** (Query parameters for export endpoint):
```typescript
{
  includeFlows?: boolean;      // Default: true - Include referenced WhatsApp Flows
  includeMetadata?: boolean;   // Default: true - Include chatbot metadata
  version?: string;            // Default: "1.0" - Export format version
}
```

**ExportedChatbotData** (JSON structure):
```typescript
{
  version: string;             // Export format version (currently "1.0")
  exportedAt: string;          // ISO timestamp of export
  chatbot: {
    name: string;
    description?: string;
    nodes: any[];              // ReactFlow nodes array
    edges: any[];              // ReactFlow edges array
    isActive: boolean;
    status: ChatBotStatus;     // "draft" | "active" | "archived"
    metadata?: Record<string, any>;
  };
  whatsappFlows?: ExportedWhatsAppFlow[];  // Optional embedded flows
}
```

**ExportedWhatsAppFlow** (Embedded Flow structure):
```typescript
{
  whatsappFlowId?: string;     // Meta Flow ID
  name: string;
  description?: string;
  status: WhatsAppFlowStatus;  // "DRAFT" | "PUBLISHED" | "DEPRECATED"
  categories: WhatsAppFlowCategory[];
  flowJson: any;               // WhatsApp Flow JSON schema
  endpointUri?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}
```

#### 2. Import DTOs

**File**: `backend/src/modules/chatbots/dto/import-chatbot.dto.ts`

**ImportChatbotBodyDto** (Multipart form data):
```typescript
{
  name?: string;              // Override chatbot name (optional)
  setActive?: boolean;        // Default: false - Set chatbot as active after import
  importFlows?: boolean;      // Default: true - Import embedded WhatsApp Flows
}
```

**ImportChatbotResponseDto**:
```typescript
{
  success: boolean;
  message: string;
  chatbotId?: string;         // Created chatbot UUID
  chatbotName?: string;       // Final name (may be renamed if duplicate)
  importedAt: string;         // ISO timestamp
  warnings?: string[];        // Array of warning messages
  importedFlowsCount?: number; // Number of flows imported
}
```

---

### Service Methods

**File**: `backend/src/modules/chatbots/chatbots.service.ts`

#### exportChatbot()

```typescript
async exportChatbot(
  id: string,
  options: ExportChatbotQueryDto
): Promise<ExportedChatbotData>
```

**Purpose**: Export a chatbot configuration with optional embedded WhatsApp Flows.

**Process**:
1. Find chatbot by ID (throws NotFoundException if not found)
2. Create export data structure with version and timestamp
3. Include metadata if `options.includeMetadata !== false`
4. If `options.includeFlows !== false`:
   - Extract WhatsApp Flow IDs from nodes (type: `whatsapp_flow`)
   - Query database for referenced flows
   - Embed full flow data in export

**Returns**: Complete export data structure ready for JSON download.

**Example Flow ID Extraction**:
```typescript
// From nodes like:
{
  type: "whatsapp_flow",
  data: { whatsappFlowId: "123456789" }
}
```

---

#### importChatbot()

```typescript
async importChatbot(
  fileBuffer: Buffer,
  options: ImportChatbotBodyDto
): Promise<ImportChatbotResponseDto>
```

**Purpose**: Import a chatbot from exported JSON file with validation and dependency resolution.

**Process**:
1. **Parse JSON**: Convert buffer to string and parse
2. **Validate Structure**: Check for required fields (chatbot, version)
3. **Version Check**: Warn if version mismatch (current: "1.0")
4. **Name Handling**:
   - Use `options.name` if provided, else use imported name
   - Generate unique name with suffix if duplicate exists
5. **Validate Nodes/Edges**: Ensure arrays are valid
6. **Flow Resolution**:
   - Extract referenced Flow IDs from nodes
   - Check which flows exist in database
   - Import embedded flows if `options.importFlows !== false` and not already existing
   - Warn about missing flows (no embedded data)
7. **Create Chatbot**: Create new chatbot with validated data
8. **Update Metadata**: Apply metadata if present
9. **Activate**: Toggle active if `options.setActive === true`
10. **Return Response**: Success/failure with warnings

**Error Handling**:
- `400 Bad Request`: Invalid JSON, missing required fields, invalid structure
- `413 Payload Too Large`: File exceeds 5MB limit
- Graceful degradation: Imports chatbot even if flows are missing (with warnings)

**Example Response**:
```json
{
  "success": true,
  "message": "Chatbot imported successfully",
  "chatbotId": "550e8400-e29b-41d4-a716-446655440000",
  "chatbotName": "Customer Support Bot (Copy)",
  "importedAt": "2025-11-28T10:30:00.000Z",
  "warnings": ["Missing WhatsApp Flows: 987654321"],
  "importedFlowsCount": 2
}
```

---

### Helper Methods

#### extractWhatsAppFlowIds()

```typescript
private extractWhatsAppFlowIds(nodes: any[]): string[]
```

**Purpose**: Extract unique WhatsApp Flow IDs from chatbot nodes.

**Logic**:
- Iterates through nodes
- Finds nodes with `type === 'whatsapp_flow'`
- Extracts `node.data.whatsappFlowId`
- Removes duplicates using Set

---

#### generateUniqueName()

```typescript
private async generateUniqueName(baseName: string): Promise<string>
```

**Purpose**: Generate a unique chatbot name by appending suffix if duplicate exists.

**Algorithm**:
```
1. Start with baseName
2. Check if name exists in database
3. If not exists → return name
4. If exists:
   - suffix = 1 → "Name (Copy)"
   - suffix = 2 → "Name (Copy 2)"
   - suffix = 3 → "Name (Copy 3)"
   ... and so on
5. Loop until unique name found
```

**Examples**:
- "Support Bot" → "Support Bot (Copy)" → "Support Bot (Copy 2)"

---

#### validateImportStructure()

```typescript
private validateImportStructure(data: any): void
```

**Purpose**: Validate top-level import data structure.

**Checks**:
- `data.chatbot` exists
- `data.version` exists

**Throws**: `BadRequestException` if validation fails.

---

#### validateChatbotStructure()

```typescript
private validateChatbotStructure(chatbot: any): void
```

**Purpose**: Validate chatbot nodes and edges structure.

**Checks**:
- `chatbot.nodes` is an array
- `chatbot.edges` is an array

**Throws**: `BadRequestException` if validation fails.

---

### Controller Endpoints

**File**: `backend/src/modules/chatbots/chatbots.controller.ts`

#### Export Endpoint

```
GET /api/chatbots/:id/export
```

**Query Parameters**: `ExportChatbotQueryDto`
- `includeFlows` (boolean, default: true)
- `includeMetadata` (boolean, default: true)
- `version` (string, default: "1.0")

**Headers Set**:
```typescript
Content-Type: application/json
Content-Disposition: attachment; filename="chatbot-{name}-{timestamp}.json"
```

**Filename Format**: `chatbot-customer-support-bot-1732790400000.json`

**Swagger Documentation**:
- Summary: "Export chatbot"
- Description: "Exports a chatbot configuration as JSON file"
- Response 200: ExportChatbotResponseDto
- Response 404: Chatbot not found

---

#### Import Endpoint

```
POST /api/chatbots/import
```

**Content Type**: `multipart/form-data`

**Form Fields**:
- `file` (required): JSON file (max 5MB)
- `name` (optional): Override chatbot name
- `setActive` (optional): Set active after import

**Validation**:
1. File exists
2. MIME type is `application/json`
3. File size ≤ 5MB

**Error Responses**:
- `400 Bad Request`: No file, invalid JSON, invalid MIME type, invalid structure
- `413 Payload Too Large`: File size > 5MB

**Swagger Documentation**:
- Summary: "Import chatbot"
- Description: "Imports a chatbot from a JSON file"
- Response 201: ImportChatbotResponseDto
- Response 400/413: Validation errors

---

## Frontend Implementation

### API Client

**File**: `frontend/src/features/chatbots/api.ts`

#### exportChatbot()

```typescript
export const exportChatbot = async (
  id: string,
  includeFlows: boolean = true
): Promise<Blob>
```

**Usage**:
```typescript
const blob = await exportChatbot(chatbotId);
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'chatbot-export.json';
a.click();
URL.revokeObjectURL(url);
```

**Parameters**:
- `responseType: 'blob'` - Get file as Blob for download

---

#### importChatbot()

```typescript
export const importChatbot = async (
  file: File,
  options?: { name?: string; setActive?: boolean }
): Promise<{
  success: boolean;
  message: string;
  chatbotId?: string;
  chatbotName?: string;
  warnings?: string[];
}>
```

**Usage**:
```typescript
const result = await importChatbot(file, {
  name: "My Custom Name",  // Optional
  setActive: true         // Optional
});

if (result.success) {
  console.log(`Imported: ${result.chatbotName}`);
  console.log(`ID: ${result.chatbotId}`);
  if (result.warnings) {
    console.warn(result.warnings);
  }
}
```

**Headers**: `Content-Type: multipart/form-data` (automatically set by Axios)

---

### UI Components

**File**: `frontend/src/features/chatbots/components/ChatBotsListPage.tsx`

#### Export Button

**Location**: Each chatbot card in list view

**Icon**: Green download icon (↓)

**Handler**:
```typescript
const handleExport = async (chatbot: ChatBot) => {
  try {
    const blob = await exportChatbot(chatbot.id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chatbot.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ message: 'Chatbot exported successfully', type: 'success' });
  } catch (error) {
    setToast({ message: 'Failed to export chatbot', type: 'error' });
  }
};
```

**Filename**: Generates slug from chatbot name + timestamp
- Example: `customer-support-bot-1732790400000.json`

---

#### Import Button

**Location**: Header toolbar (next to "Create New Chatbot")

**Icon**: Upload icon (↑)

**Implementation**:
1. Hidden `<input type="file" accept=".json" />`
2. Click triggers file input
3. File selection triggers import

**Handler**:
```typescript
const handleImportFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validate file type
  if (!file.name.endsWith('.json')) {
    setToast({ message: 'Please select a JSON file', type: 'error' });
    return;
  }

  setImporting(true);
  try {
    const result = await importChatbot(file);
    if (result.success) {
      setToast({
        message: `Chatbot "${result.chatbotName}" imported successfully`,
        type: 'success'
      });
      loadChatBots(); // Refresh list
    } else {
      setToast({ message: result.message, type: 'error' });
    }
  } catch (error: any) {
    setToast({
      message: error.response?.data?.message || 'Failed to import chatbot',
      type: 'error'
    });
  } finally {
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }
};
```

**States**:
- `importing: boolean` - Loading state for import process
- `fileInputRef: React.RefObject<HTMLInputElement>` - Reference to hidden input

---

## Export JSON Format

### Example Structure

```json
{
  "version": "1.0",
  "exportedAt": "2025-11-28T10:30:00.000Z",
  "chatbot": {
    "name": "Customer Support Bot",
    "description": "Handles customer inquiries and support requests",
    "nodes": [
      {
        "id": "start",
        "type": "start",
        "position": { "x": 0, "y": 0 },
        "data": { "label": "Start" }
      },
      {
        "id": "msg1",
        "type": "message",
        "position": { "x": 200, "y": 0 },
        "data": { "content": "Welcome to support!" }
      },
      {
        "id": "flow1",
        "type": "whatsapp_flow",
        "position": { "x": 400, "y": 0 },
        "data": {
          "whatsappFlowId": "123456789",
          "flowMode": "published",
          "flowCta": "Start Support Flow"
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "start",
        "target": "msg1"
      },
      {
        "id": "e2",
        "source": "msg1",
        "target": "flow1"
      }
    ],
    "isActive": false,
    "status": "draft",
    "metadata": {
      "category": "support",
      "tags": ["customer-service", "automated"]
    }
  },
  "whatsappFlows": [
    {
      "whatsappFlowId": "123456789",
      "name": "Support Intake Flow",
      "description": "Collects customer information for support ticket",
      "status": "PUBLISHED",
      "categories": ["SIGN_IN", "OTHER"],
      "flowJson": {
        "version": "5.0",
        "screens": [
          {
            "id": "WELCOME",
            "title": "Support Request",
            "data": {},
            "layout": {
              "type": "SingleColumnLayout",
              "children": [
                {
                  "type": "TextHeading",
                  "text": "How can we help?"
                }
              ]
            }
          }
        ]
      },
      "endpointUri": "https://api.example.com/whatsapp/flow-endpoint",
      "isActive": true,
      "metadata": {
        "createdBy": "admin",
        "version": 2
      }
    }
  ]
}
```

---

## Use Cases

### 1. Backup and Restore

**Scenario**: Backup chatbot before making major changes.

**Steps**:
1. Export chatbot with flows: `GET /api/chatbots/:id/export?includeFlows=true`
2. Make changes to original chatbot
3. If needed, import backup: `POST /api/chatbots/import`
4. Delete broken chatbot, restore backup

**Result**: Safe experimentation with rollback capability.

---

### 2. Migrate Between Environments

**Scenario**: Move chatbot from staging to production.

**Steps**:
1. Export from staging: `GET /api/chatbots/:id/export?includeFlows=true`
2. Download JSON file
3. Import to production: `POST /api/chatbots/import` (file upload)
4. Review warnings (missing flows)
5. Manually publish WhatsApp Flows if needed
6. Activate chatbot: `setActive: true`

**Considerations**:
- WhatsApp Flows must be published to Meta in both environments
- `whatsappFlowId` must match between environments (or flows won't link)

---

### 3. Template Sharing

**Scenario**: Share chatbot template with team or community.

**Steps**:
1. Export template chatbot with flows
2. Share JSON file via Git, email, or file share
3. Team member imports JSON
4. Chatbot is created with unique name (e.g., "Template (Copy)")

**Result**: Easy chatbot replication and sharing.

---

### 4. Version Control

**Scenario**: Track chatbot changes over time.

**Steps**:
1. Export chatbot after each major change
2. Store JSON files in version control (Git)
3. Use commit messages to document changes
4. Diff JSON files to see what changed

**Result**: Full audit trail of chatbot evolution.

---

## Technical Details

### WhatsApp Flow Embedding Logic

**When to Embed**:
- `includeFlows=true` in export query
- Chatbot has nodes with `type: "whatsapp_flow"`
- Referenced flows exist in database

**What Gets Embedded**:
- Full flow JSON schema (ready to import)
- Flow metadata (name, description, categories)
- Flow status and settings

**Import Behavior**:
- Only imports flows that don't already exist (by `whatsappFlowId`)
- Skips existing flows (avoids duplicates)
- Warns if referenced flows are missing (not embedded or not in DB)

**Example Scenario**:
1. Chatbot A references Flow X (ID: 123)
2. Export Chatbot A → Flow X is embedded
3. Import to new environment → Flow X is created
4. Import again → Flow X already exists, skip creation

---

### Duplicate Name Handling

**Algorithm**: `generateUniqueName(baseName)`

```
Input: "Support Bot"
Check database: EXISTS
→ Try: "Support Bot (Copy)"
Check database: EXISTS
→ Try: "Support Bot (Copy 2)"
Check database: NOT EXISTS
→ Return: "Support Bot (Copy 2)"
```

**Database Query**:
```typescript
const existing = await this.chatbotRepository.findOne({
  where: { name },
  select: ['id'],  // Minimal select for performance
});
```

**Performance**: O(n) where n = number of duplicates (typically 1-3)

---

### File Size Limit

**Limit**: 5 MB (5,242,880 bytes)

**Rationale**:
- Typical chatbot: 10-100 KB
- With embedded flows: 100-500 KB
- 5MB allows for very complex chatbots with multiple flows

**Enforcement**:
```typescript
const maxSize = 5 * 1024 * 1024;
if (file.size > maxSize) {
  throw new PayloadTooLargeException('File size exceeds 5MB limit');
}
```

**Error Response**: `413 Payload Too Large`

---

## Error Scenarios

### 1. Invalid JSON

**Cause**: Corrupted file, not valid JSON

**Error**: `400 Bad Request - Invalid JSON file format`

**Code**:
```typescript
try {
  const importedData = JSON.parse(jsonContent);
} catch (error) {
  if (error instanceof SyntaxError) {
    throw new BadRequestException('Invalid JSON file format');
  }
}
```

---

### 2. Missing Required Fields

**Cause**: Export format mismatch, manual edit

**Error**: `400 Bad Request - Invalid export format: missing chatbot data`

**Validation**:
```typescript
if (!data.chatbot || !data.version) {
  throw new BadRequestException('Invalid export format');
}
```

---

### 3. Invalid Nodes/Edges

**Cause**: Nodes or edges not an array

**Error**: `400 Bad Request - Invalid chatbot: missing or invalid nodes array`

**Validation**:
```typescript
if (!chatbot.nodes || !Array.isArray(chatbot.nodes)) {
  throw new BadRequestException('Invalid chatbot: missing or invalid nodes array');
}
```

---

### 4. Missing WhatsApp Flows

**Cause**: Referenced flows not embedded and not in database

**Behavior**: Import succeeds with warning

**Warning**: `Missing WhatsApp Flows: 123456789, 987654321`

**Result**:
- Chatbot is created
- WhatsApp Flow nodes exist but are "broken" (flow not found)
- User must manually create or publish flows

---

### 5. File Too Large

**Cause**: File > 5MB

**Error**: `413 Payload Too Large - File size exceeds 5MB limit`

**Solution**: Remove embedded flows or split chatbot into smaller parts

---

## Best Practices

### For Developers

1. **Always Include Flows in Export**:
   - Use `includeFlows=true` (default) when exporting
   - Ensures complete chatbot portability

2. **Validate Imports**:
   - Check `result.warnings` array
   - Alert user if flows are missing

3. **Handle Errors Gracefully**:
   - Show user-friendly error messages
   - Don't expose stack traces to UI

4. **Clean Up File Inputs**:
   - Reset file input after import: `fileInputRef.current.value = ''`
   - Prevents re-import of same file

5. **Use Optimistic UI**:
   - Show loading state during import
   - Refresh chatbot list after successful import

---

### For Users

1. **Backup Before Changes**:
   - Export chatbot before major edits
   - Keep export files organized by date

2. **Review Warnings**:
   - After import, check for missing flows
   - Manually create or publish missing flows

3. **Use Descriptive Names**:
   - Name exported files clearly: `support-bot-v2-2025-11-28.json`
   - Include version or date in filename

4. **Test After Import**:
   - Don't activate imported chatbot immediately
   - Test flow execution before going live

5. **Version Control**:
   - Store export files in Git for team collaboration
   - Track changes over time

---

## Integration Points

### Database Tables

- **chatbots**: Source for export, destination for import
- **whatsapp_flows**: Embedded in export if referenced, created on import

### Related Services

- `ChatBotsService.findOne()`: Used by export to get chatbot
- `ChatBotsService.create()`: Used by import to create chatbot
- `WhatsAppFlowRepository`: Query and create flows

### Related Entities

- `ChatBot`: Main entity for export/import
- `WhatsAppFlow`: Optionally embedded in export

---

## Future Enhancements

### Planned Features

1. **Batch Export**:
   - Export multiple chatbots at once
   - Endpoint: `POST /api/chatbots/export-batch`
   - Body: `{ chatbotIds: string[] }`

2. **Import Preview**:
   - Validate import without creating chatbot
   - Endpoint: `POST /api/chatbots/import/preview`
   - Returns: `ImportValidationResult`

3. **Export to Git**:
   - Auto-commit exports to Git repository
   - Integrate with GitHub/GitLab API

4. **Import from URL**:
   - Import chatbot from public URL
   - Body: `{ url: string }`

5. **Incremental Import**:
   - Update existing chatbot instead of creating new one
   - Match by chatbot name or custom ID

6. **Export Compression**:
   - Gzip JSON for smaller file sizes
   - Headers: `Content-Encoding: gzip`

---

## Testing Recommendations

### Unit Tests

1. `extractWhatsAppFlowIds()`: Test with various node structures
2. `generateUniqueName()`: Test duplicate scenarios
3. `validateImportStructure()`: Test invalid inputs
4. `validateChatbotStructure()`: Test malformed chatbots

### Integration Tests

1. **Export → Import Roundtrip**:
   - Export chatbot → Import → Compare structures
2. **Missing Flows**:
   - Export chatbot with flows → Delete flows → Import → Verify warnings
3. **Duplicate Names**:
   - Import same chatbot twice → Verify name suffixes

### E2E Tests

1. **UI Export Flow**:
   - Click export → Verify file download → Verify JSON structure
2. **UI Import Flow**:
   - Upload JSON → Verify success message → Verify chatbot in list
3. **Error Handling**:
   - Upload invalid JSON → Verify error message

---

## Bug Fixes (2025-12-01)

### 1. Axios Content-Type Header Fix

**Problem**: The Axios client default `Content-Type: application/json` header was interfering with FormData uploads, preventing proper `multipart/form-data` boundary generation.

**Solution**: Set `Content-Type` to `undefined` in import requests to let the browser/Axios automatically set the correct header with boundary.

**File**: `frontend/src/features/chatbots/api.ts`

```typescript
const response = await client.post('/api/chatbots/import', formData, {
    headers: {
        'Content-Type': undefined,  // Let browser set multipart/form-data with boundary
    },
});
```

---

### 2. Stale Closure Fix (loadChatBotsRef Pattern)

**Problem**: The `processImportFile` callback captured the `loadChatBots` function at creation time, causing stale closure issues when called after state changes.

**Solution**: Use a ref pattern to always access the latest `loadChatBots` function.

**File**: `frontend/src/features/chatbots/components/ChatBotsListPage.tsx`

```typescript
// Use ref to store loadChatBots to avoid stale closure
const loadChatBotsRef = useRef(loadChatBots);
useEffect(() => {
    loadChatBotsRef.current = loadChatBots;
});

// In processImportFile callback:
loadChatBotsRef.current();  // Always calls latest version
```

---

### 3. Double Trigger Fix (isProcessingRef Pattern)

**Problem**: File selection could trigger both native DOM events and React synthetic events, causing duplicate import attempts.

**Solution**: Use a processing flag ref to prevent concurrent execution.

**File**: `frontend/src/features/chatbots/components/ChatBotsListPage.tsx`

```typescript
const isProcessingRef = useRef(false);

const processImportFile = useCallback(async (file: File) => {
    // Prevent double execution from both native and React events
    if (isProcessingRef.current) {
        return;
    }
    isProcessingRef.current = true;

    try {
        // ... import logic
    } finally {
        isProcessingRef.current = false;
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
}, []);
```

---

### 4. Backend MIME Type Validation Enhancement

**Problem**: Some browsers send different MIME types for JSON files (e.g., `application/octet-stream`, `text/plain`).

**Solution**: Accept multiple MIME types and also check file extension as fallback.

**File**: `backend/src/modules/chatbots/chatbots.controller.ts`

```typescript
const validMimeTypes = ['application/json', 'text/plain', 'text/json', 'application/octet-stream'];
const isValidMimeType = validMimeTypes.includes(file.mimetype);
const hasJsonExtension = file.originalname?.toLowerCase().endsWith('.json');

if (!isValidMimeType && !hasJsonExtension) {
    throw new BadRequestException('File must be a JSON file');
}
```

---

### 5. Native Event Listener for Playwright Compatibility

**Problem**: Playwright's `browser_file_upload` tool doesn't always trigger React's synthetic `onChange` event.

**Solution**: Add a native DOM event listener alongside React's handler.

**File**: `frontend/src/features/chatbots/components/ChatBotsListPage.tsx`

```typescript
// Native change event listener for Playwright compatibility
useEffect(() => {
    const input = fileInputRef.current;
    if (!input) return;

    const handleNativeChange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
            processImportFile(file);
        }
    };

    input.addEventListener('change', handleNativeChange);
    return () => input.removeEventListener('change', handleNativeChange);
}, [processImportFile]);
```

---

## File Locations Reference

### Backend

- **DTOs**:
  - `backend/src/modules/chatbots/dto/export-chatbot.dto.ts`
  - `backend/src/modules/chatbots/dto/import-chatbot.dto.ts`
- **Service**: `backend/src/modules/chatbots/chatbots.service.ts`
  - `exportChatbot()` (line 224)
  - `importChatbot()` (line 277)
  - `extractWhatsAppFlowIds()` (line 391)
  - `validateImportStructure()` (line 406)
  - `validateChatbotStructure()` (line 418)
  - `generateUniqueName()` (line 452)
- **Controller**: `backend/src/modules/chatbots/chatbots.controller.ts`
  - Export endpoint (line 145-172)
  - Import endpoint (line 63-118)

### Frontend

- **API Client**: `frontend/src/features/chatbots/api.ts`
  - `exportChatbot()` (line 93)
  - `importChatbot()` (line 102)
- **UI Components**: `frontend/src/features/chatbots/components/ChatBotsListPage.tsx`
  - `handleExport()` (line 107)
  - `handleImportClick()` (line 122)
  - `processImportFile()` (line 136)
  - `handleFileChange()` (line 191)
  - Native event listener (line 173-187)

---

## See Also

- [Backend Architecture](02-backend-architecture.md) - ChatBotsModule details
- [Frontend Architecture](03-frontend-architecture.md) - Chatbot UI components
- [Database Design](04-database-design.md) - ChatBot and WhatsAppFlow entities
- [WhatsApp Integration](06-whatsapp-integration.md) - WhatsApp Flow lifecycle
