# DataSources Feature - Reference Documentation

**Created:** 2025-11-28
**Status:** Production Ready
**Version:** 1.0.0

---

## Overview

The DataSources feature provides a complete solution for managing external API configurations dynamically through the UI, eliminating the need for hardcoded credentials in the codebase. This feature allows administrators to configure REST APIs, Strapi CMS instances, and GraphQL endpoints that can be used by WhatsApp Flows and REST API nodes in chatbot flows.

### Problem Statement

Before this feature was implemented, API credentials were hardcoded in service files:

```typescript
// OLD - Hardcoded (REMOVED)
private readonly strapiBaseUrl = 'http://192.168.1.18:1337';
private readonly strapiToken = 'd3a4028ba0d5f00b572132d037ada86fef5a735be...';
```

This approach had several critical issues:
- Security risk: Credentials committed to version control
- Inflexibility: Required code changes and redeployment to update credentials
- No multi-environment support
- No UI for non-technical users to manage APIs

### Solution

The DataSources feature provides:
- Secure storage of API credentials in the database
- UI-based CRUD operations for data sources
- Connection testing functionality
- Integration with WhatsApp Flows and Chatbot execution
- Support for multiple authentication types
- Flexible configuration options

---

## Architecture

### Entity Relationship Diagram

```
┌──────────────────┐
│   DataSource     │
│ ──────────────── │
│ id (UUID)        │
│ name             │
│ description      │
│ type (ENUM)      │◄──────┐
│ baseUrl          │       │
│ authType (ENUM)  │       │ ManyToOne
│ authToken        │       │ (nullable)
│ authHeaderName   │       │
│ headers (JSONB)  │       │
│ config (JSONB)   │       │
│ isActive         │       │
│ timeout          │       │
│ createdAt        │       │
│ updatedAt        │       │
└──────────────────┘       │
                           │
                   ┌───────┴───────────┐
                   │  WhatsAppFlow     │
                   │ ───────────────── │
                   │ id                │
                   │ name              │
                   │ whatsappFlowId    │
                   │ dataSourceId      │─────► Foreign Key
                   │ flowJson          │
                   │ status            │
                   │ ...               │
                   └───────────────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────┐      ┌──────────────────────┐    │
│  │ DataSourcesPage      │      │ ConfigWhatsAppFlow   │    │
│  │ ──────────────────   │      │ ──────────────────   │    │
│  │ - List data sources  │      │ - Flow selector      │    │
│  │ - Create/Edit modal  │      │ - DataSource picker  │    │
│  │ - Delete confirm     │      │ - Save to node       │    │
│  │ - Test connection    │      └──────────┬───────────┘    │
│  └──────────┬───────────┘                 │                │
│             │                              │                │
│             │  ┌───────────────────────────┴─────┐          │
│             │  │   dataSourcesApi                │          │
│             │  │   ───────────────────────────   │          │
│             └──┤   - getAll()                    │          │
│                │   - getActiveDataSources()      │          │
│                │   - create()                    │          │
│                │   - update()                    │          │
│                │   - delete()                    │          │
│                │   - testConnection()            │          │
│                └────────────┬────────────────────┘          │
└─────────────────────────────┼───────────────────────────────┘
                              │ HTTP
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  DataSourcesController                               │  │
│  │  ──────────────────────────────────────────────────  │  │
│  │  POST   /api/data-sources          - Create         │  │
│  │  GET    /api/data-sources          - List all       │  │
│  │  GET    /api/data-sources/active   - List active    │  │
│  │  GET    /api/data-sources/:id      - Get one        │  │
│  │  PUT    /api/data-sources/:id      - Update         │  │
│  │  DELETE /api/data-sources/:id      - Delete         │  │
│  │  POST   /api/data-sources/:id/test - Test conn.     │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  DataSourcesService                                  │  │
│  │  ──────────────────────────────────────────────────  │  │
│  │  + create(dto): DataSource                          │  │
│  │  + findAll(): DataSource[]                          │  │
│  │  + findAllActive(): DataSource[]                    │  │
│  │  + findOne(id): DataSource                          │  │
│  │  + update(id, dto): DataSource                      │  │
│  │  + delete(id): {success: boolean}                   │  │
│  │  + testConnection(id): TestConnectionResult         │  │
│  │  + fetchData(id, endpoint, options): any            │  │
│  │  - createAxiosClient(ds): AxiosInstance             │  │
│  │  - validateAuthConfig(...)                          │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                  │
│         ┌────────────────┼────────────────┐                │
│         │                │                │                │
│         ▼                ▼                ▼                │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ Flow       │  │ Chatbot      │  │ Webhook         │   │
│  │ Endpoint   │  │ Execution    │  │ Processor       │   │
│  │ Service    │  │ Service      │  │ Service         │   │
│  └────────────┘  └──────────────┘  └─────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend Implementation

### 1. DataSource Entity

**File:** `backend/src/entities/data-source.entity.ts`

```typescript
export enum DataSourceType {
  REST_API = 'REST_API',
  STRAPI = 'STRAPI',
  GRAPHQL = 'GRAPHQL',
}

export enum AuthType {
  NONE = 'NONE',
  BEARER = 'BEARER',
  API_KEY = 'API_KEY',
  BASIC = 'BASIC',
}

@Entity('data_sources')
export class DataSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: DataSourceType })
  type: DataSourceType;

  @Column({ length: 500, name: 'base_url' })
  baseUrl: string;

  @Column({ type: 'enum', enum: AuthType, default: AuthType.NONE })
  authType: AuthType;

  @Column({ type: 'text', nullable: true, name: 'auth_token' })
  authToken: string;

  @Column({ length: 100, nullable: true, name: 'auth_header_name' })
  authHeaderName: string;

  @Column({ type: 'jsonb', nullable: true })
  headers: Record<string, string>;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'integer', nullable: true })
  timeout: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
```

**Field Details:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Primary key |
| `name` | String(255) | Yes | Human-readable name |
| `description` | Text | No | Optional description |
| `type` | Enum | Yes | REST_API, STRAPI, or GRAPHQL |
| `baseUrl` | String(500) | Yes | Base URL of the API |
| `authType` | Enum | Yes | Authentication method |
| `authToken` | Text | Conditional | Token/password for auth |
| `authHeaderName` | String(100) | No | Custom header name for API_KEY |
| `headers` | JSONB | No | Additional HTTP headers |
| `config` | JSONB | No | Type-specific configuration |
| `isActive` | Boolean | Yes | Whether source is enabled |
| `timeout` | Integer | No | Request timeout in ms |

### 2. WhatsAppFlow Entity Update

**File:** `backend/src/entities/whatsapp-flow.entity.ts`

**Added Fields:**

```typescript
@Column({ type: 'uuid', name: 'data_source_id', nullable: true })
dataSourceId?: string;

@ManyToOne(() => DataSource, { nullable: true, onDelete: 'SET NULL' })
@JoinColumn({ name: 'data_source_id' })
dataSource?: DataSource;
```

**Notes:**
- `onDelete: 'SET NULL'` ensures flows don't break when a data source is deleted
- The relationship is optional (nullable: true)
- Legacy flows without data sources continue to work

### 3. DataSourcesService

**File:** `backend/src/modules/data-sources/data-sources.service.ts`

**Key Methods:**

#### 3.1 CRUD Operations

```typescript
// Create a new data source
async create(createDto: CreateDataSourceDto): Promise<DataSource>

// Get all data sources
async findAll(): Promise<DataSource[]>

// Get only active data sources
async findAllActive(): Promise<DataSource[]>

// Get one data source by ID
async findOne(id: string): Promise<DataSource>

// Update a data source
async update(id: string, updateDto: UpdateDataSourceDto): Promise<DataSource>

// Delete a data source
async delete(id: string): Promise<{ success: boolean }>
```

#### 3.2 Connection Testing

```typescript
async testConnection(id: string): Promise<TestConnectionResult>

interface TestConnectionResult {
  success: boolean;
  message: string;
  responseTime?: number;
  statusCode?: number;
  error?: string;
}
```

**Implementation Details:**
- Tests vary by data source type:
  - **STRAPI:** Hits `/api` endpoint
  - **REST_API:** Hits root `/` endpoint
  - **GRAPHQL:** Hits configured endpoint
- Accepts status codes < 500 as valid
- Returns response time in milliseconds
- Captures and returns error messages

#### 3.3 Data Fetching

```typescript
async fetchData(
  id: string,
  endpoint: string,
  options: RequestOptions = {},
): Promise<any>

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
}
```

**Features:**
- Generic HTTP client for all data sources
- Automatic authentication header injection
- Custom timeout support
- Error handling with proper HTTP status codes
- Logging for debugging

#### 3.4 Axios Client Factory

```typescript
private createAxiosClient(dataSource: DataSource): AxiosInstance
```

**Authentication Handling:**

| Auth Type | Header Format | Example |
|-----------|---------------|---------|
| `NONE` | (none) | - |
| `BEARER` | `Authorization: Bearer {token}` | `Bearer abc123` |
| `API_KEY` | `{customHeader}: {token}` | `X-API-Key: abc123` |
| `BASIC` | `Authorization: Basic {token}` | `Basic dXNlcjpwYXNz` |

**Notes:**
- For `API_KEY`, `authHeaderName` defaults to `X-API-Key` if not provided
- For `BASIC`, `authToken` should be base64-encoded `username:password`
- Custom headers from `dataSource.headers` are merged

#### 3.5 Validation

```typescript
private validateAuthConfig(
  authType: AuthType,
  authToken?: string,
  authHeaderName?: string,
): void
```

**Validation Rules:**
- `NONE`: No token required
- `BEARER`: Token required
- `API_KEY`: Token AND header name required
- `BASIC`: Token required (base64 encoded)

### 4. DataSourcesController

**File:** `backend/src/modules/data-sources/data-sources.controller.ts`

**API Endpoints:**

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/data-sources` | Create | CreateDataSourceDto | DataSource |
| GET | `/api/data-sources` | List all | - | DataSource[] |
| GET | `/api/data-sources/active` | List active | - | DataSource[] |
| GET | `/api/data-sources/:id` | Get one | - | DataSource |
| PUT | `/api/data-sources/:id` | Update | UpdateDataSourceDto | DataSource |
| DELETE | `/api/data-sources/:id` | Delete | - | {success: boolean} |
| POST | `/api/data-sources/:id/test` | Test connection | - | TestConnectionResult |

**Swagger Documentation:**
- All endpoints are documented with `@ApiOperation`
- Request/response schemas with `@ApiBody` and `@ApiResponse`
- Parameter descriptions with `@ApiParam`
- Example values in DTO decorators

### 5. Integration with Existing Services

#### 5.1 ChatBotExecutionService

**File:** `backend/src/modules/chatbots/services/chatbot-execution.service.ts`

**Changes Made:**

```typescript
// BEFORE (Hardcoded)
private readonly strapiBaseUrl = 'http://192.168.1.18:1337';
private readonly strapiToken = 'd3a4028ba0d5f00b572132d037ada86fef5a735be...';

// AFTER (Dynamic)
constructor(
  // ... other dependencies
  private readonly dataSourcesService: DataSourcesService,
  private readonly configService: ConfigService,
) {}

private async getDataSourceConfig(
  dataSourceId?: string,
): Promise<{ baseUrl: string; token: string } | null> {
  if (dataSourceId) {
    try {
      const dataSource = await this.dataSourcesService.findOne(dataSourceId);
      if (dataSource && dataSource.isActive) {
        return {
          baseUrl: dataSource.baseUrl,
          token: dataSource.authToken || '',
        };
      }
    } catch (error) {
      this.logger.warn(`DataSource ${dataSourceId} not found: ${error.message}`);
    }
  }

  // Fallback to environment variables
  const baseUrl = this.configService.get<string>('STRAPI_BASE_URL');
  const token = this.configService.get<string>('STRAPI_TOKEN');
  if (baseUrl && token) {
    return { baseUrl, token };
  }

  return null;
}
```

**Features:**
- Primary: Use DataSource from WhatsAppFlow
- Fallback: Environment variables (STRAPI_BASE_URL, STRAPI_TOKEN)
- Graceful degradation: Logs warnings if data source not found
- Removed hardcoded Flow ID check

#### 5.2 FlowEndpointService

**File:** `backend/src/modules/webhooks/services/flow-endpoint.service.ts`

**Changes Made:**

```typescript
// BEFORE (Hardcoded)
private readonly strapiBaseUrl = 'http://192.168.1.18:1337';
private readonly strapiToken = 'd3a4028ba0d5f00b572132d037ada86fef5a735be...';

// AFTER (Dynamic)
constructor(
  @InjectRepository(ConversationContext)
  private readonly contextRepo: Repository<ConversationContext>,
  @InjectRepository(WhatsAppFlow)
  private readonly flowRepo: Repository<WhatsAppFlow>,
  private readonly configService: ConfigService,
  private readonly dataSourcesService: DataSourcesService,
) {}
```

**Flow Token Parsing Enhancement:**

```typescript
// Improved parsing to extract context ID and node ID
if (flow_token && flow_token.includes('-')) {
  const parts = flow_token.split('-');
  // UUID format: 8-4-4-4-12 = 5 parts when split by '-'
  // flow_token format: {contextId}-{nodeId}
  if (parts.length >= 6) {
    contextId = parts.slice(0, 5).join('-');
    nodeId = parts.slice(5).join('-');
  }

  // Load context and flow configuration
  const context = await this.contextRepo.findOne({
    where: { id: contextId },
    relations: ['chatbot'],
  });

  // Find WhatsApp Flow node to get flow ID
  const flowNode = context.chatbot.nodes?.find(n => n.id === nodeId);
  if (flowNode?.data?.whatsappFlowId) {
    const flow = await this.flowRepo.findOne({
      where: { whatsappFlowId: flowNode.data.whatsappFlowId },
    });
    if (flow) {
      dataSourceId = flow.dataSourceId || null;
    }
  }
}

// Get data source configuration
const dsConfig = await this.getDataSourceConfig(dataSourceId);
```

**Key Improvements:**
- Proper UUID parsing from flow_token
- Loads WhatsAppFlow entity to get dataSourceId
- Uses DataSourcesService for API calls
- Maintains backward compatibility

---

## Frontend Implementation

### 1. DataSources Page

**File:** `frontend/src/features/data-sources/components/DataSourcesPage.tsx`

**Features:**
- List view with table layout
- Create/Edit modal dialog
- Delete confirmation dialog
- Test connection button with real-time feedback
- Form validation
- Loading states
- Error handling

**UI Components:**

```typescript
// Main page structure
DataSourcesPage
├── Header with "Add Data Source" button
├── DataSourcesTable
│   ├── Name column
│   ├── Type badge (REST_API | STRAPI | GRAPHQL)
│   ├── Base URL
│   ├── Auth Type badge
│   ├── Active/Inactive toggle
│   └── Actions (Edit | Delete | Test)
├── CreateEditModal
│   ├── Form fields with validation
│   ├── Conditional auth fields
│   └── Save/Cancel buttons
└── DeleteConfirmDialog
```

**Form Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Name | Text | Yes | Max 255 chars |
| Description | Textarea | No | - |
| Type | Select | Yes | Enum values |
| Base URL | Text | Yes | Valid URL format |
| Auth Type | Select | Yes | Enum values |
| Auth Token | Password | Conditional | Required if auth not NONE |
| Auth Header | Text | Conditional | Required for API_KEY |
| Timeout | Number | No | Min 1000ms |
| Is Active | Toggle | Yes | Boolean |

**Conditional Logic:**

```typescript
// Auth token field visibility
authType !== 'NONE' → Show auth token field (required)

// Auth header name field visibility
authType === 'API_KEY' → Show auth header name field (required)

// Test connection button state
isActive && hasValidUrl → Enable test button
```

**Test Connection Flow:**

```typescript
1. User clicks "Test" button
2. Button shows loading spinner
3. POST /api/data-sources/:id/test
4. Response:
   ✓ Success → Green toast with response time
   ✗ Failure → Red toast with error message
5. Button returns to normal state
```

### 2. API Client

**File:** `frontend/src/features/data-sources/api.ts`

**Type Definitions:**

```typescript
export type DataSourceType = 'REST_API' | 'STRAPI' | 'GRAPHQL';
export type AuthType = 'NONE' | 'BEARER' | 'API_KEY' | 'BASIC';

export interface DataSource {
  id: string;
  name: string;
  description?: string;
  type: DataSourceType;
  baseUrl: string;
  authType: AuthType;
  authToken?: string;
  authHeaderName?: string;
  headers?: Record<string, string>;
  config?: Record<string, any>;
  isActive: boolean;
  timeout?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDataSourceDto {
  name: string;
  description?: string;
  type: DataSourceType;
  baseUrl: string;
  authType: AuthType;
  authToken?: string;
  authHeaderName?: string;
  headers?: Record<string, string>;
  config?: Record<string, any>;
  isActive?: boolean;
  timeout?: number;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  responseTime?: number;
  statusCode?: number;
  error?: string;
}
```

**API Functions:**

```typescript
export const dataSourcesApi = {
  getAll: () => Promise<DataSource[]>
  getActiveDataSources: () => Promise<DataSource[]>
  getOne: (id: string) => Promise<DataSource>
  create: (dto: CreateDataSourceDto) => Promise<DataSource>
  update: (id: string, dto: Partial<CreateDataSourceDto>) => Promise<DataSource>
  delete: (id: string) => Promise<{success: boolean}>
  testConnection: (id: string) => Promise<TestConnectionResult>
}
```

### 3. ConfigWhatsAppFlow Enhancement

**File:** `frontend/src/features/builder/components/ConfigModals.tsx`

**Added Features:**

```typescript
// New state variables
const [flows, setFlows] = useState<WhatsAppFlow[]>([]);
const [dataSources, setDataSources] = useState<DataSource[]>([]);
const [selectedFlowId, setSelectedFlowId] = useState('');
const [selectedDataSourceId, setSelectedDataSourceId] = useState('');
const [manualFlowId, setManualFlowId] = useState(''); // Manual override

// Load data on mount
useEffect(() => {
  flowsApi.getActive().then(setFlows);
  getActiveDataSources().then(setDataSources);
}, []);
```

**UI Enhancements:**

1. **Flow Selector Dropdown:**
   - Loads active/published flows
   - Shows flow name and WhatsApp Flow ID
   - Manual Flow ID input for override
   - Selected flow preview card

2. **DataSource Selector:**
   - Dropdown of active data sources
   - Shows name and type
   - Optional field
   - Linked to WhatsApp Flow

3. **Save Behavior:**

```typescript
const handleSave = () => {
  const finalFlowId = manualFlowId.trim() || selectedFlowId;

  if (!finalFlowId) {
    alert("Please select a WhatsApp Flow or enter a Flow ID manually");
    return;
  }

  onSave({
    ...data,
    label,
    whatsappFlowId: finalFlowId,
    dataSourceId: selectedDataSourceId || undefined,
    flowCta,
    flowMode,
    flowBodyText: bodyText,
    flowHeaderText: headerText,
    // ...
  });
};
```

### 4. Navigation Integration

**File:** `frontend/src/shared/components/SideBar.tsx`

**Added Menu Item:**

```typescript
<NavLink to="/data-sources">
  <span className="material-symbols-outlined">storage</span>
  <span>Data Sources</span>
</NavLink>
```

**File:** `frontend/src/app/App.tsx`

**Added Route:**

```typescript
<Route path="/data-sources" element={<DataSourcesPage />} />
```

---

## Database Schema

### Migration: Create DataSources Table

**File:** `backend/src/migrations/XXXXXX-CreateDataSources.ts`

```sql
CREATE TABLE data_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('REST_API', 'STRAPI', 'GRAPHQL')),
  base_url VARCHAR(500) NOT NULL,
  auth_type VARCHAR(50) NOT NULL DEFAULT 'NONE'
    CHECK (auth_type IN ('NONE', 'BEARER', 'API_KEY', 'BASIC')),
  auth_token TEXT,
  auth_header_name VARCHAR(100),
  headers JSONB,
  config JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  timeout INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_data_sources_type ON data_sources(type);
CREATE INDEX idx_data_sources_is_active ON data_sources(is_active);
CREATE INDEX idx_data_sources_created_at ON data_sources(created_at DESC);
```

### Migration: Add DataSource to WhatsAppFlow

**File:** `backend/src/migrations/XXXXXX-AddDataSourceToWhatsAppFlow.ts`

```sql
ALTER TABLE whatsapp_flows
ADD COLUMN data_source_id UUID;

ALTER TABLE whatsapp_flows
ADD CONSTRAINT fk_whatsapp_flows_data_source
FOREIGN KEY (data_source_id)
REFERENCES data_sources(id)
ON DELETE SET NULL;

CREATE INDEX idx_whatsapp_flows_data_source_id
ON whatsapp_flows(data_source_id);
```

**Notes:**
- `ON DELETE SET NULL` prevents breaking flows when data source is deleted
- Index on `data_source_id` for efficient joins

---

## Usage Examples

### Creating a Strapi Data Source

**Via UI:**

1. Navigate to "Data Sources" in sidebar
2. Click "Add Data Source"
3. Fill in form:
   - Name: "Production Strapi CMS"
   - Type: STRAPI
   - Base URL: https://api.example.com
   - Auth Type: BEARER
   - Auth Token: paste-your-token-here
   - Timeout: 30000
   - Is Active: ON
4. Click "Save"
5. Click "Test" to verify connection

**Via API (Swagger):**

```bash
curl -X POST http://localhost:3000/api/data-sources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Strapi CMS",
    "type": "STRAPI",
    "baseUrl": "https://api.example.com",
    "authType": "BEARER",
    "authToken": "your-secret-token",
    "isActive": true,
    "timeout": 30000
  }'
```

### Assigning DataSource to WhatsApp Flow

**Via UI:**

1. Open Flow Builder
2. Add or edit WhatsApp Flow node
3. In ConfigWhatsAppFlow modal:
   - Select WhatsApp Flow from dropdown (or enter manually)
   - Select Data Source from dropdown
   - Configure other flow settings
4. Click "Save"

**Via API:**

```bash
curl -X PUT http://localhost:3000/api/flows/{flowId} \
  -H "Content-Type: application/json" \
  -d '{
    "dataSourceId": "uuid-of-data-source"
  }'
```

### Fetching Data from DataSource

**In Service:**

```typescript
// ChatBotExecutionService or FlowEndpointService
const dsConfig = await this.getDataSourceConfig(dataSourceId);

if (dsConfig) {
  const response = await fetch(`${dsConfig.baseUrl}/api/brands`, {
    headers: {
      'Authorization': `Bearer ${dsConfig.token}`,
    },
  });

  const data = await response.json();
  // Process data...
}
```

**Using DataSourcesService:**

```typescript
const data = await this.dataSourcesService.fetchData(
  dataSourceId,
  '/api/products',
  {
    method: 'GET',
    params: { category: 'electronics' },
  }
);
```

---

## Migration Guide

### From Hardcoded Credentials to DataSources

**Step 1: Create DataSource via UI**

1. Go to Data Sources page
2. Create new data source with your current credentials
3. Test connection
4. Copy the DataSource ID

**Step 2: Update WhatsApp Flows**

1. Open Flows management page (or use API)
2. For each flow that needs the data source:
   ```bash
   curl -X PUT http://localhost:3000/api/flows/{flowId} \
     -H "Content-Type: application/json" \
     -d '{"dataSourceId": "copied-datasource-id"}'
   ```

**Step 3: Update Environment Variables (Optional Fallback)**

Add to `.env`:

```env
STRAPI_BASE_URL=https://api.example.com
STRAPI_TOKEN=your-token
```

**Step 4: Remove Hardcoded Credentials**

This has already been done in the latest codebase. No action needed.

**Step 5: Verify**

1. Test WhatsApp Flow node in chatbot
2. Check logs for successful API calls
3. Verify data is fetched from data source

---

## Security Considerations

### 1. Credential Storage

- **Database:** Auth tokens stored in plain text in PostgreSQL
- **Recommendation:** Use encryption at rest for production databases
- **Future Enhancement:** Implement secrets manager integration (AWS Secrets Manager, HashiCorp Vault)

### 2. API Access

- **Current:** No authentication on DataSources API
- **TODO:** Add JWT authentication guards
- **TODO:** Role-based access control (only admins can manage data sources)

### 3. Sensitive Data Exposure

- **API Response:** Auth tokens are returned in API responses
- **Frontend:** Tokens visible in network tab
- **Recommendation:** Mask tokens in responses (show only last 4 chars)
- **Implementation:**

```typescript
// In DataSource entity, add transform
@Transform(({ value }) => value ? '***' + value.slice(-4) : null)
authToken: string;
```

### 4. Connection Testing

- **Current:** Anyone can test connection if they have data source ID
- **Risk:** Could be used to probe internal networks
- **Mitigation:** Add rate limiting on test endpoint

---

## Best Practices

### 1. Naming Conventions

- Use descriptive names: "Production Strapi CMS" not "Strapi 1"
- Include environment: "Staging GraphQL API", "Dev REST API"
- Add purpose: "Product Catalog API", "Inventory Management"

### 2. Configuration

- Set reasonable timeouts (default: 30000ms)
- Use custom headers for API versioning
- Store type-specific config in `config` field

Example config for Strapi:

```json
{
  "apiVersion": "v1",
  "collection": "brands",
  "populate": ["*"]
}
```

### 3. Active/Inactive Toggle

- Mark as inactive instead of deleting (for audit trail)
- Inactive sources won't be used by flows
- Can reactivate later with same configuration

### 4. Testing

- Always test connection after creating/updating
- Test before deploying flows to production
- Monitor response times for performance

---

## Troubleshooting

### Issue: "Data source not found"

**Symptoms:** Flow execution fails with data source not found error

**Solutions:**
1. Verify data source ID in WhatsAppFlow entity
2. Check if data source is active
3. Verify data source hasn't been deleted
4. Check database foreign key constraint

### Issue: "Connection test fails"

**Symptoms:** Test connection returns 4xx or 5xx error

**Solutions:**
1. Verify base URL is correct (include protocol: https://)
2. Check auth token is valid and not expired
3. Verify auth type matches API requirements
4. Check network connectivity (firewall, VPN)
5. Review API logs for detailed error

### Issue: "Auth token not working"

**Symptoms:** API calls return 401 Unauthorized

**Solutions:**
1. For BEARER: Ensure token doesn't include "Bearer " prefix
2. For API_KEY: Verify header name matches API expectation
3. For BASIC: Ensure token is base64 encoded "username:password"
4. Check token hasn't expired
5. Regenerate token in source system

### Issue: "Flow doesn't use new data source"

**Symptoms:** Flow still uses old/hardcoded data

**Solutions:**
1. Verify `dataSourceId` is set on WhatsAppFlow entity
2. Clear backend cache/restart server
3. Check logs for fallback to environment variables
4. Verify flow node has `whatsappFlowId` set
5. Ensure flow is published

---

## Future Enhancements

### 1. Secrets Management Integration

```typescript
// Proposed: Integrate with AWS Secrets Manager
private async getAuthToken(secretArn: string): Promise<string> {
  const client = new SecretsManagerClient();
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretArn })
  );
  return response.SecretString;
}
```

### 2. OAuth2 Support

```typescript
export enum AuthType {
  // ... existing
  OAUTH2 = 'OAUTH2',
}

// New fields in DataSource
@Column({ type: 'text', nullable: true })
oauthClientId?: string;

@Column({ type: 'text', nullable: true })
oauthClientSecret?: string;

@Column({ type: 'text', nullable: true })
oauthTokenUrl?: string;
```

### 3. Response Caching

```typescript
// Cache API responses for performance
private readonly cache = new Map<string, CacheEntry>();

async fetchData(id: string, endpoint: string, options: RequestOptions) {
  const cacheKey = `${id}:${endpoint}`;
  const cached = this.cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 60000) {
    return cached.data;
  }

  const data = await this.actualFetch(id, endpoint, options);
  this.cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}
```

### 4. Audit Logging

```typescript
// Track data source usage
@Entity('data_source_audit')
export class DataSourceAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  dataSourceId: string;

  @Column()
  action: 'CREATED' | 'UPDATED' | 'DELETED' | 'TESTED' | 'FETCHED';

  @Column()
  userId: string;

  @Column({ type: 'jsonb' })
  details: any;

  @CreateDateColumn()
  timestamp: Date;
}
```

### 5. Multiple DataSources per Flow

```typescript
// Allow flows to use multiple data sources
@ManyToMany(() => DataSource)
@JoinTable({ name: 'whatsapp_flow_data_sources' })
dataSources: DataSource[];
```

---

## Performance Considerations

### 1. Database Queries

- Data sources are cached in memory during flow execution
- Use `findAllActive()` to reduce query results
- Index on `isActive` and `type` columns

### 2. HTTP Requests

- Configure appropriate timeouts
- Use connection pooling in Axios
- Implement retry logic for transient failures

### 3. Frontend

- Load data sources only when needed (lazy loading)
- Cache active data sources in component state
- Debounce test connection button

---

## Testing

### Unit Tests

**DataSourcesService:**

```typescript
describe('DataSourcesService', () => {
  it('should create a data source', async () => {
    const dto = {
      name: 'Test API',
      type: DataSourceType.REST_API,
      baseUrl: 'https://api.test.com',
      authType: AuthType.BEARER,
      authToken: 'test-token',
    };

    const result = await service.create(dto);
    expect(result.id).toBeDefined();
    expect(result.name).toBe('Test API');
  });

  it('should validate auth config', async () => {
    const dto = {
      name: 'Test',
      type: DataSourceType.REST_API,
      baseUrl: 'https://api.test.com',
      authType: AuthType.BEARER,
      // Missing authToken
    };

    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
  });

  it('should test connection successfully', async () => {
    // Mock axios response
    jest.spyOn(axios, 'create').mockReturnValue({
      get: jest.fn().mockResolvedValue({ status: 200 }),
    });

    const result = await service.testConnection('ds-id');
    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
  });
});
```

### Integration Tests

```typescript
describe('DataSources API', () => {
  it('POST /api/data-sources should create', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/data-sources')
      .send({
        name: 'Integration Test API',
        type: 'REST_API',
        baseUrl: 'https://api.test.com',
        authType: 'NONE',
      })
      .expect(201);

    expect(response.body.id).toBeDefined();
  });
});
```

### E2E Tests

```typescript
describe('DataSources UI', () => {
  it('should create a data source via UI', async () => {
    // 1. Navigate to Data Sources page
    await page.goto('/data-sources');

    // 2. Click Add button
    await page.click('[data-testid="add-data-source"]');

    // 3. Fill form
    await page.fill('[name="name"]', 'Test DS');
    await page.selectOption('[name="type"]', 'REST_API');
    await page.fill('[name="baseUrl"]', 'https://api.test.com');

    // 4. Submit
    await page.click('[data-testid="save"]');

    // 5. Verify in table
    await expect(page.locator('text=Test DS')).toBeVisible();
  });
});
```

---

## Related Documentation

- **02-backend-architecture.md** - Backend module structure
- **03-frontend-architecture.md** - Frontend features
- **04-database-design.md** - Database schema
- **06-whatsapp-integration.md** - WhatsApp API integration
- **08-module-relationships.md** - Module dependencies
- **11-flow-builder-feature.md** - WhatsApp Flow builder
- **DATASOURCE_IMPLEMENTATION_PLAN.md** - Implementation plan

---

## Changelog

### v1.0.0 - 2025-11-28

- Initial release
- DataSource entity and CRUD API
- WhatsAppFlow integration
- UI for data source management
- Connection testing
- Integration with ChatBotExecution and FlowEndpoint services
- Removed hardcoded credentials
- Added fallback to environment variables

---

**Documentation Status:** Complete
**Implementation Status:** Production Ready
**Test Coverage:** Partial (unit tests needed)
**Security Review:** Pending
