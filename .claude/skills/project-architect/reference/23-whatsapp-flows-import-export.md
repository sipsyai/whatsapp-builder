# WhatsApp Flows Import/Export Feature

## Overview

The WhatsApp Flows Import/Export feature allows users to backup, share, and migrate WhatsApp Flows between environments. This feature is similar to the Chatbot Import/Export feature but specifically designed for WhatsApp Flow JSON configurations.

**Feature Status**: Production Ready
**Module**: FlowsModule
**Version**: 1.0
**Added**: 2025-12-01

---

## API Endpoints

### Export Flow

```
GET /api/flows/:id/export
```

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `includeMetadata` | boolean | true | Include flow metadata in export |

**Headers Set by Backend**:
```
Content-Type: application/json
Content-Disposition: attachment; filename="flow-{name}-{timestamp}.json"
```

**Response**: `ExportFlowResponseDto` (JSON file download)

---

### Import Flow

```
POST /api/flows/import
```

**Content Type**: `multipart/form-data`

**Form Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | JSON file (max 5MB) |
| `name` | string | No | Override flow name |
| `createInMeta` | boolean | No | Create flow in Meta API (default: false) |

**Response**: `ImportFlowResponseDto`

---

## DTOs

### Export DTOs

**File**: `backend/src/modules/flows/dto/export-flow.dto.ts`

#### ExportFlowQueryDto

```typescript
export class ExportFlowQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeMetadata?: boolean = true;
}
```

#### ExportedFlowData (JSON Structure)

```typescript
export interface ExportedFlowData {
  version: string;              // Export format version ("1.0")
  exportedAt: string;           // ISO timestamp
  flow: {
    name: string;
    description?: string;
    status: string;             // "DRAFT" | "PUBLISHED" | "DEPRECATED" | etc.
    categories: string[];       // WhatsApp Flow categories
    flowJson: any;              // Complete WhatsApp Flow JSON
    endpointUri?: string;       // Flow endpoint URL
    isActive: boolean;
    metadata?: Record<string, any>;
  };
  dataSource?: {                // Optional linked data source
    id: string;
    name: string;
    type: string;
  };
}
```

---

### Import DTOs

**File**: `backend/src/modules/flows/dto/import-flow.dto.ts`

#### ImportFlowBodyDto

```typescript
export class ImportFlowBodyDto {
  @IsOptional()
  @IsString()
  name?: string;                    // Override flow name

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  createInMeta?: boolean = false;   // Create in Meta API
}
```

#### ImportFlowResponseDto

```typescript
export class ImportFlowResponseDto {
  success: boolean;
  message: string;
  flowId?: string;                  // Created flow UUID
  flowName?: string;                // Final name (may be renamed)
  importedAt: string;               // ISO timestamp
  warnings?: string[];              // Warning messages
  whatsappFlowId?: string;          // Meta Flow ID (if created in Meta)
}
```

---

## Export JSON Format

### Example Structure

```json
{
  "version": "1.0",
  "exportedAt": "2025-12-01T10:30:00.000Z",
  "flow": {
    "name": "Appointment Booking Flow",
    "description": "Collects user information for booking appointments",
    "status": "DRAFT",
    "categories": ["APPOINTMENT_BOOKING"],
    "flowJson": {
      "version": "3.0",
      "screens": [
        {
          "id": "WELCOME",
          "title": "Welcome",
          "data": {},
          "terminal": false,
          "layout": {
            "type": "SingleColumnLayout",
            "children": [
              {
                "type": "TextHeading",
                "text": "Book an Appointment"
              },
              {
                "type": "TextBody",
                "text": "Select your preferred date and time"
              },
              {
                "type": "DatePicker",
                "name": "appointment_date",
                "label": "Select Date"
              },
              {
                "type": "Footer",
                "label": "Continue",
                "on-click-action": {
                  "name": "navigate",
                  "next": {
                    "type": "screen",
                    "name": "CONFIRM"
                  }
                }
              }
            ]
          }
        },
        {
          "id": "CONFIRM",
          "title": "Confirm",
          "terminal": true,
          "data": {},
          "layout": {
            "type": "SingleColumnLayout",
            "children": [
              {
                "type": "TextHeading",
                "text": "Confirm Booking"
              },
              {
                "type": "Footer",
                "label": "Confirm",
                "on-click-action": {
                  "name": "complete",
                  "payload": {}
                }
              }
            ]
          }
        }
      ],
      "data_api_version": "3.0",
      "routing_model": {}
    },
    "endpointUri": "https://api.example.com/flow-endpoint",
    "isActive": true,
    "metadata": {
      "source": "playground",
      "created_from_playground": true
    }
  },
  "dataSource": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Appointments API",
    "type": "REST_API"
  }
}
```

---

## Backend Implementation

### Controller

**File**: `backend/src/modules/flows/flows.controller.ts`

#### Export Endpoint

```typescript
@Get(':id/export')
@ApiOperation({ summary: 'Export flow' })
@ApiParam({ name: 'id', description: 'Flow UUID' })
@ApiResponse({ status: 200, type: ExportFlowResponseDto })
async exportFlow(
  @Param('id') id: string,
  @Query() queryDto: ExportFlowQueryDto,
  @Res({ passthrough: true }) res: Response,
): Promise<ExportFlowResponseDto> {
  const result = await this.flowsService.exportFlow(id, queryDto);

  // Generate safe filename
  const safeName = result.flow.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  const filename = `flow-${safeName}-${Date.now()}.json`;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

  return result;
}
```

#### Import Endpoint

```typescript
@Post('import')
@HttpCode(HttpStatus.CREATED)
@UseInterceptors(FileInterceptor('file'))
@ApiConsumes('multipart/form-data')
@ApiOperation({ summary: 'Import flow' })
async importFlow(
  @UploadedFile() file: Express.Multer.File,
  @Body() bodyDto: ImportFlowBodyDto,
): Promise<ImportFlowResponseDto> {
  // Validate file exists
  if (!file) {
    throw new BadRequestException('No file uploaded');
  }

  // Validate MIME type (accept multiple types for browser compatibility)
  const validMimeTypes = ['application/json', 'text/plain', 'text/json', 'application/octet-stream'];
  const isValidMimeType = validMimeTypes.includes(file.mimetype);
  const hasJsonExtension = file.originalname?.toLowerCase().endsWith('.json');

  if (!isValidMimeType && !hasJsonExtension) {
    throw new BadRequestException('File must be a JSON file');
  }

  // Validate file size
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new PayloadTooLargeException('File size exceeds 5MB limit');
  }

  return this.flowsService.importFlow(file.buffer, bodyDto);
}
```

---

### Service Methods

**File**: `backend/src/modules/flows/flows.service.ts`

#### exportFlow()

```typescript
async exportFlow(id: string, options: ExportFlowQueryDto): Promise<ExportedFlowData> {
  // Find flow with optional data source relation
  const flow = await this.flowRepository.findOne({
    where: { id },
    relations: options.includeMetadata ? ['dataSource'] : [],
  });

  if (!flow) {
    throw new NotFoundException(`Flow with ID ${id} not found`);
  }

  // Build export structure
  const exportData: ExportedFlowData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    flow: {
      name: flow.name,
      description: flow.description,
      status: flow.status,
      categories: flow.categories || [],
      flowJson: flow.flowJson,
      endpointUri: flow.endpointUri,
      isActive: flow.isActive,
      metadata: flow.metadata,
    },
  };

  // Include data source info if present
  if (flow.dataSource) {
    exportData.dataSource = {
      id: flow.dataSource.id,
      name: flow.dataSource.name,
      type: flow.dataSource.type,
    };
  }

  return exportData;
}
```

#### importFlow()

```typescript
async importFlow(
  fileBuffer: Buffer,
  options: ImportFlowBodyDto,
): Promise<ImportFlowResponseDto> {
  const warnings: string[] = [];

  // Parse JSON
  let importedData: ExportedFlowData;
  try {
    const jsonContent = fileBuffer.toString('utf-8');
    importedData = JSON.parse(jsonContent);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new BadRequestException('Invalid JSON file format');
    }
    throw error;
  }

  // Validate structure
  if (!importedData.flow || !importedData.version) {
    throw new BadRequestException('Invalid export format: missing flow data or version');
  }

  // Version check
  if (importedData.version !== '1.0') {
    warnings.push(`Export version mismatch: expected 1.0, got ${importedData.version}`);
  }

  // Determine name
  const baseName = options.name || importedData.flow.name;
  const uniqueName = await this.generateUniqueName(baseName);

  if (uniqueName !== baseName) {
    warnings.push(`Name "${baseName}" already exists, renamed to "${uniqueName}"`);
  }

  // Create flow (local only by default)
  const flow = this.flowRepository.create({
    name: uniqueName,
    description: importedData.flow.description,
    status: 'DRAFT', // Always start as DRAFT
    categories: importedData.flow.categories || [],
    flowJson: importedData.flow.flowJson,
    endpointUri: importedData.flow.endpointUri,
    isActive: false, // Default to inactive
    metadata: {
      ...importedData.flow.metadata,
      imported_at: new Date().toISOString(),
      imported_from_version: importedData.version,
    },
  });

  // Handle data source association
  if (importedData.dataSource) {
    const dataSource = await this.dataSourceRepository.findOne({
      where: { id: importedData.dataSource.id },
    });

    if (dataSource) {
      flow.dataSource = dataSource;
    } else {
      warnings.push(`Data source "${importedData.dataSource.name}" not found, skipping association`);
    }
  }

  await this.flowRepository.save(flow);

  // Optionally create in Meta API
  let whatsappFlowId: string | undefined;
  if (options.createInMeta) {
    try {
      const metaFlow = await this.whatsAppFlowService.createFlow({
        name: uniqueName,
        categories: importedData.flow.categories,
      });
      whatsappFlowId = metaFlow.id;
      flow.whatsappFlowId = whatsappFlowId;
      await this.flowRepository.save(flow);
    } catch (error) {
      warnings.push(`Failed to create flow in Meta API: ${error.message}`);
    }
  }

  return {
    success: true,
    message: 'Flow imported successfully',
    flowId: flow.id,
    flowName: uniqueName,
    importedAt: new Date().toISOString(),
    warnings: warnings.length > 0 ? warnings : undefined,
    whatsappFlowId,
  };
}
```

---

## Frontend Implementation

### API Client

**File**: `frontend/src/features/flows/api/index.ts`

#### Types

```typescript
export interface ImportFlowResponse {
  success: boolean;
  message: string;
  flowId?: string;
  flowName?: string;
  importedAt: string;
  warnings?: string[];
  whatsappFlowId?: string;
}

export interface ImportFlowOptions {
  name?: string;
  createInMeta?: boolean;
}
```

#### Export Function

```typescript
// In flowsApi object
async exportFlow(id: string, includeMetadata: boolean = true): Promise<Blob> {
  const response = await client.get(`/api/flows/${id}/export`, {
    params: { includeMetadata },
    responseType: 'blob',
  });
  return response.data;
}

// Standalone export
export async function exportFlow(id: string, includeMetadata: boolean = true): Promise<Blob> {
  const response = await client.get(`/api/flows/${id}/export`, {
    params: { includeMetadata },
    responseType: 'blob',
  });
  return response.data;
}
```

#### Import Function

```typescript
// In flowsApi object
async importFlow(file: File, options?: ImportFlowOptions): Promise<ImportFlowResponse> {
  const formData = new FormData();
  formData.append('file', file);

  if (options?.name) {
    formData.append('name', options.name);
  }
  if (options?.createInMeta !== undefined) {
    formData.append('createInMeta', String(options.createInMeta));
  }

  // IMPORTANT: Set Content-Type to undefined to let browser set multipart/form-data with boundary
  const response = await client.post('/api/flows/import', formData, {
    headers: {
      'Content-Type': undefined,
    },
  });
  return response.data;
}

// Standalone export
export async function importFlow(file: File, options?: ImportFlowOptions): Promise<ImportFlowResponse> {
  const formData = new FormData();
  formData.append('file', file);

  if (options?.name) {
    formData.append('name', options.name);
  }
  if (options?.createInMeta !== undefined) {
    formData.append('createInMeta', String(options.createInMeta));
  }

  const response = await client.post('/api/flows/import', formData, {
    headers: {
      'Content-Type': undefined,
    },
  });
  return response.data;
}
```

---

### UI Components

**File**: `frontend/src/features/flows/components/FlowsPage.tsx`

The FlowsPage component includes:

1. **Export Button**: Per-flow export action in table/card view
2. **Import Button**: Header toolbar button for importing flows
3. **File Input**: Hidden file input for file selection
4. **Toast Notifications**: Success/error feedback

#### Export Handler

```typescript
const handleExport = async (flow: WhatsAppFlow) => {
  try {
    const blob = await flowsApi.exportFlow(flow.id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flow-${flow.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ message: 'Flow exported successfully', type: 'success' });
  } catch (error) {
    setToast({ message: 'Failed to export flow', type: 'error' });
  }
};
```

#### Import Handler

```typescript
const handleImport = async (file: File) => {
  if (!file.name.endsWith('.json')) {
    setToast({ message: 'Please select a JSON file', type: 'error' });
    return;
  }

  setImporting(true);
  try {
    const result = await flowsApi.importFlow(file);
    if (result.success) {
      setToast({
        message: `Flow "${result.flowName}" imported successfully`,
        type: 'success'
      });
      loadFlows(); // Refresh list
    } else {
      setToast({ message: result.message, type: 'error' });
    }
  } catch (error: any) {
    setToast({
      message: error.response?.data?.message || 'Failed to import flow',
      type: 'error'
    });
  } finally {
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }
};
```

---

## Use Cases

### 1. Backup Before Publishing

**Scenario**: Save flow state before publishing to Meta.

**Steps**:
1. Export flow: `GET /api/flows/:id/export`
2. Store JSON file locally
3. Publish flow to Meta
4. If issues arise, import backup

---

### 2. Share Flow Templates

**Scenario**: Share pre-built flow templates with team.

**Steps**:
1. Create template flow in builder
2. Export as JSON
3. Share via Git, email, or documentation
4. Team members import and customize

---

### 3. Environment Migration

**Scenario**: Move flows from development to production.

**Steps**:
1. Export from development: `GET /api/flows/:id/export`
2. Import to production: `POST /api/flows/import`
3. Optionally create in Meta API: `createInMeta: true`
4. Publish to make available in WhatsApp

---

### 4. Version Control

**Scenario**: Track flow changes over time.

**Steps**:
1. Export flow after each major change
2. Store in Git repository
3. Use commit messages to document changes
4. Compare JSON files to see differences

---

## Error Handling

### 400 Bad Request

| Error | Cause |
|-------|-------|
| No file uploaded | Missing file in request |
| File must be a JSON file | Invalid MIME type and extension |
| Invalid JSON file format | Malformed JSON |
| Invalid export format | Missing flow or version |

### 413 Payload Too Large

| Error | Cause |
|-------|-------|
| File size exceeds 5MB limit | File > 5MB |

### 404 Not Found

| Error | Cause |
|-------|-------|
| Flow not found | Invalid flow ID for export |

---

## Technical Notes

### MIME Type Handling

The backend accepts multiple MIME types for browser compatibility:
- `application/json`
- `text/plain`
- `text/json`
- `application/octet-stream`

Additionally, files with `.json` extension are accepted regardless of MIME type.

### Content-Type Header for Import

**Important**: When sending `multipart/form-data` with Axios, set `Content-Type` to `undefined` to let the browser automatically set the correct header with boundary:

```typescript
const response = await client.post('/api/flows/import', formData, {
    headers: {
        'Content-Type': undefined,
    },
});
```

### Flow Status on Import

Imported flows always start as `DRAFT` status, regardless of original status. This ensures:
- Imported flows don't accidentally become active
- Users must explicitly publish after reviewing
- Prevents conflicts with existing published flows

---

## File Locations Reference

### Backend

- **DTOs**:
  - `backend/src/modules/flows/dto/export-flow.dto.ts`
  - `backend/src/modules/flows/dto/import-flow.dto.ts`
- **Service**: `backend/src/modules/flows/flows.service.ts`
  - `exportFlow()` method
  - `importFlow()` method
- **Controller**: `backend/src/modules/flows/flows.controller.ts`
  - Export endpoint: `GET /api/flows/:id/export`
  - Import endpoint: `POST /api/flows/import`

### Frontend

- **API Client**: `frontend/src/features/flows/api/index.ts`
  - `flowsApi.exportFlow()`
  - `flowsApi.importFlow()`
  - `exportFlow()` standalone function
  - `importFlow()` standalone function
- **UI Components**: `frontend/src/features/flows/components/FlowsPage.tsx`

---

## See Also

- [Backend Architecture](02-backend-architecture.md) - FlowsModule details
- [Frontend Architecture](03-frontend-architecture.md) - Flows UI components
- [Flow Builder Feature](11-flow-builder-feature.md) - WhatsApp Flow builder
- [Chatbot Import/Export](19-chatbot-import-export.md) - Similar feature for chatbots
