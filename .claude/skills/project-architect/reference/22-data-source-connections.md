# DataSourceConnection Feature

## Overview

DataSourceConnection introduces a hierarchical two-level system for managing external API integrations:

- **DataSource (Parent)**: Application-level configuration (baseUrl, authentication)
- **DataSourceConnection (Child)**: Individual API endpoints with method, dataKey, transform config, and chaining support

This architecture enables reusable endpoint definitions, cascading dropdowns for WhatsApp Flows, and better organization of API integrations.

---

## Architecture

### Entity Hierarchy

```
DataSource (Parent)
├── id, name, description
├── type (REST_API | STRAPI | GRAPHQL)
├── baseUrl, authType, authToken
├── headers, timeout, isActive
│
└── DataSourceConnection[] (Children)
    ├── id, name, description
    ├── endpoint, method (GET|POST|PUT|PATCH|DELETE)
    ├── defaultParams, defaultBody
    ├── dataKey, transformConfig
    ├── dependsOnConnectionId, paramMapping
    └── isActive
```

### Database Schema

**Table: `data_source_connections`**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| name | VARCHAR(255) | Connection name |
| description | TEXT | Optional description |
| data_source_id | UUID (FK) | Reference to parent DataSource |
| endpoint | VARCHAR(500) | API endpoint path (e.g., `/api/products`) |
| method | ENUM | HTTP method (GET, POST, PUT, PATCH, DELETE) |
| default_params | JSONB | Default query parameters |
| default_body | JSONB | Default request body |
| data_key | VARCHAR(255) | Path to extract data from response |
| transform_config | JSONB | Field mapping configuration |
| depends_on_connection_id | UUID (FK, nullable) | Reference to parent connection |
| param_mapping | JSONB | JSONPath mappings for chaining |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Update timestamp |

**Indexes:**
- `idx_data_source_connections_data_source` - On `data_source_id`
- `idx_data_source_connections_active` - On `is_active`

**Foreign Keys:**
- `fk_data_source_connection_data_source` - CASCADE delete with parent
- `fk_data_source_connection_depends_on` - SET NULL on dependency delete

---

## API Endpoints

### Connection CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/data-sources/:dataSourceId/connections` | Create connection |
| GET | `/api/data-sources/:dataSourceId/connections` | Get all connections for DS |
| GET | `/api/data-sources/:dataSourceId/connections/active` | Get active connections |
| GET | `/api/data-sources/connections/:connectionId` | Get single connection |
| PUT | `/api/data-sources/connections/:connectionId` | Update connection |
| DELETE | `/api/data-sources/connections/:connectionId` | Delete connection |

### Connection Execution

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/data-sources/connections/:connectionId/execute` | Execute with optional params/body |
| POST | `/api/data-sources/connections/:connectionId/execute-chain` | Execute with context data for chaining |

### Grouped Connections (for selectors)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/data-sources/connections/grouped/active` | Get active connections grouped by DataSource |

---

## Backend Implementation

### Entity: DataSourceConnection

```typescript
// backend/src/entities/data-source-connection.entity.ts

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

@Entity('data_source_connections')
export class DataSourceConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', name: 'data_source_id' })
  dataSourceId: string;

  @ManyToOne(() => DataSource, (ds) => ds.connections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'data_source_id' })
  dataSource: DataSource;

  @Column({ length: 500 })
  endpoint: string;

  @Column({ type: 'enum', enum: HttpMethod, default: HttpMethod.GET })
  method: HttpMethod;

  @Column({ type: 'jsonb', nullable: true, name: 'default_params' })
  defaultParams: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true, name: 'default_body' })
  defaultBody: any;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'data_key' })
  dataKey: string;

  @Column({ type: 'jsonb', nullable: true, name: 'transform_config' })
  transformConfig: {
    idField: string;
    titleField: string;
    descriptionField?: string;
  };

  @Column({ type: 'uuid', nullable: true, name: 'depends_on_connection_id' })
  dependsOnConnectionId: string;

  @ManyToOne(() => DataSourceConnection, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'depends_on_connection_id' })
  dependsOnConnection: DataSourceConnection;

  @Column({ type: 'jsonb', nullable: true, name: 'param_mapping' })
  paramMapping: Record<string, string>;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt: Date;
}
```

### Service Methods

```typescript
// backend/src/modules/data-sources/data-sources.service.ts

// Connection CRUD
async createConnection(dataSourceId: string, dto: CreateConnectionDto): Promise<DataSourceConnection>
async findConnections(dataSourceId: string): Promise<DataSourceConnection[]>
async findActiveConnections(dataSourceId: string): Promise<DataSourceConnection[]>
async findConnection(connectionId: string): Promise<DataSourceConnection>
async updateConnection(connectionId: string, dto: UpdateConnectionDto): Promise<DataSourceConnection>
async deleteConnection(connectionId: string): Promise<{ success: boolean }>

// Execution
async executeConnection(connectionId: string, params?: Record<string, any>, body?: any): Promise<any>
async executeChainedConnection(connectionId: string, contextData?: Record<string, any>): Promise<any>

// Grouped for selectors
async findAllActiveConnectionsGrouped(): Promise<{ dataSource: {...}, connections: DataSourceConnection[] }[]>
```

### DTOs

**CreateConnectionDto:**
```typescript
export class CreateConnectionDto {
  @IsString() @IsNotEmpty() @MaxLength(255)
  name: string;

  @IsOptional() @IsString()
  description?: string;

  @IsString() @IsNotEmpty() @MaxLength(500)
  endpoint: string;

  @IsOptional() @IsEnum(HttpMethod)
  method?: HttpMethod;

  @IsOptional() @IsObject()
  defaultParams?: Record<string, any>;

  @IsOptional()
  defaultBody?: any;

  @IsOptional() @IsString() @MaxLength(255)
  dataKey?: string;

  @IsOptional() @ValidateNested() @Type(() => TransformConfigDto)
  transformConfig?: TransformConfigDto;

  @IsOptional() @IsUUID()
  dependsOnConnectionId?: string;

  @IsOptional() @IsObject()
  paramMapping?: Record<string, string>;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
```

---

## Frontend Implementation

### Type Definitions

```typescript
// frontend/src/features/data-sources/types.ts

export interface DataSourceConnection {
  id: string;
  dataSourceId: string;
  name: string;
  description?: string;
  endpoint: string;
  method: HttpMethod;
  defaultParams?: Record<string, any>;
  defaultBody?: any;
  dataKey?: string;
  transformConfig?: TransformConfig;
  dependsOnConnectionId?: string;
  dependsOnConnection?: DataSourceConnection;
  paramMapping?: Record<string, string>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransformConfig {
  idField: string;
  titleField: string;
  descriptionField?: string;
}

export interface GroupedConnections {
  dataSource: { id: string; name: string; type: string; baseUrl: string; };
  connections: DataSourceConnection[];
}
```

### API Client

```typescript
// frontend/src/features/data-sources/api.ts

export const connectionApi = {
  getByDataSource: async (dataSourceId: string): Promise<DataSourceConnection[]> => {...},
  getActiveByDataSource: async (dataSourceId: string): Promise<DataSourceConnection[]> => {...},
  getById: async (connectionId: string): Promise<DataSourceConnection> => {...},
  create: async (dataSourceId: string, data: CreateConnectionDto): Promise<DataSourceConnection> => {...},
  update: async (connectionId: string, data: UpdateConnectionDto): Promise<DataSourceConnection> => {...},
  delete: async (connectionId: string): Promise<void> => {...},
  execute: async (connectionId: string, request?: TestConnectionRequest): Promise<TestConnectionResponse> => {...},
  executeChain: async (connectionId: string, contextData?: Record<string, any>): Promise<any> => {...},
  getAllActiveGrouped: async (): Promise<GroupedConnections[]> => {...},
};
```

### UI Components

#### DataSourcesPage (Two-Panel Layout)

```
+---------------------------+-------------------------------------------+
|    Left Panel (1/3)       |           Right Panel (2/3)               |
+---------------------------+-------------------------------------------+
| Data Sources              | Connections                               |
| [+ Add]                   | Strapi CMS - 3 connections                |
|                           | [+ Add Connection]                        |
| [x] Strapi CMS           |                                           |
|     STRAPI | BEARER       | +---------------------------------------+ |
|     https://cms.example.. | | Get Products              [Active]    | |
|     [Test] [Edit] [Del]   | | GET /api/products                     | |
|                           | | dataKey: data | Transform | Chained   | |
| [ ] Local REST            | | [Expand] [Test] [Edit] [Delete]       | |
|     REST_API | API_KEY    | +---------------------------------------+ |
|     http://localhost:3000 |                                           |
|     [Test] [Edit] [Del]   | +---------------------------------------+ |
|                           | | Get Brands                [Active]    | |
|                           | | GET /api/brands                       | |
|                           | | dataKey: data | Transform             | |
|                           | | [Expand] [Test] [Edit] [Delete]       | |
|                           | +---------------------------------------+ |
+---------------------------+-------------------------------------------+
```

#### Component Files

| Component | Path | Description |
|-----------|------|-------------|
| DataSourcesPage | `frontend/src/features/data-sources/components/DataSourcesPage.tsx` | Main two-panel layout |
| DataSourceCard | `frontend/src/features/data-sources/components/DataSourceCard.tsx` | Card for DataSource in left panel |
| ConnectionList | `frontend/src/features/data-sources/components/ConnectionList.tsx` | Right panel connection list with inline form |
| ConnectionForm | `frontend/src/features/data-sources/components/ConnectionForm.tsx` | Modal form for create/edit |
| ConnectionTestPanel | `frontend/src/features/data-sources/components/ConnectionTestPanel.tsx` | Expandable test panel |

---

## Chaining System

### Concept

Connections can depend on other connections to create cascading dropdowns. For example:
- **Brands Connection** (independent) - Returns list of brands
- **Products Connection** (chained to Brands) - Returns products filtered by selected brand

### Configuration

```typescript
// Products connection with chaining
{
  name: "Get Products by Brand",
  endpoint: "/api/products",
  method: "GET",
  dataKey: "data",
  transformConfig: {
    idField: "documentId",
    titleField: "name",
    descriptionField: "description"
  },
  dependsOnConnectionId: "uuid-of-brands-connection",
  paramMapping: {
    "filters[brand][slug][$eq]": "$.slug",
    "filters[category][$eq]": "$.category"
  }
}
```

### JSONPath Resolution

When `executeChainedConnection` is called with context data:

```typescript
// Context data (selected item from parent connection)
const contextData = {
  id: "1",
  slug: "apple",
  name: "Apple",
  category: "electronics"
};

// paramMapping resolution:
// "filters[brand][slug][$eq]": "$.slug" -> "apple"
// "filters[category][$eq]": "$.category" -> "electronics"

// Final request:
// GET /api/products?filters[brand][slug][$eq]=apple&filters[category][$eq]=electronics
```

---

## WhatsApp Flow Integration

### DataSourceSelector Component

The updated `DataSourceSelector` now selects Connections instead of raw endpoints:

```typescript
// frontend/src/features/flow-builder/components/playground/ContentEditor/DataSourceSelector.tsx

interface DataSourceSelectorProps {
  value?: ComponentDataSourceConfig;
  onChange: (config: ComponentDataSourceConfig | undefined) => void;
  componentName: string;
  availableFields?: string[]; // For dependsOn selection
}
```

### Usage in DropdownEditor

```tsx
<DataSourceSelector
  value={dataSourceConfig}
  onChange={handleDataSourceChange}
  componentName="selected_product"
  availableFields={['selected_brand', 'selected_category']}
/>
```

### Generated Config

When a connection is selected, the component generates:

```typescript
{
  componentName: "selected_product",
  connectionId: "products-connection-uuid",
  dataSourceId: "strapi-datasource-uuid",
  endpoint: "/api/products",
  dataKey: "data",
  transformTo: {
    idField: "documentId",
    titleField: "name",
    descriptionField: "description"
  },
  dependsOn: "selected_brand", // Only if connection is chained
  filterParam: "filters[brand][slug][$eq]"
}
```

---

## Migration

### Migration File

```typescript
// backend/src/migrations/1732800000000-CreateDataSourceConnectionsTable.ts

export class CreateDataSourceConnectionsTable1732800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create http_method_enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE http_method_enum AS ENUM ('GET', 'POST', 'PUT', 'PATCH', 'DELETE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create table with all columns
    await queryRunner.createTable(new Table({
      name: 'data_source_connections',
      columns: [/* ... all columns ... */]
    }), true);

    // Create foreign keys
    await queryRunner.createForeignKey('data_source_connections',
      new TableForeignKey({
        columnNames: ['data_source_id'],
        referencedTableName: 'data_sources',
        onDelete: 'CASCADE'
      })
    );

    // Create indexes
    await queryRunner.createIndex('data_source_connections',
      new TableIndex({ columnNames: ['data_source_id'] })
    );
  }
}
```

### Running Migration

```bash
cd backend
npm run migration:run
```

---

## Usage Examples

### 1. Creating a Connection via API

```bash
POST /api/data-sources/ds-uuid-here/connections
Content-Type: application/json

{
  "name": "Get Products",
  "endpoint": "/api/products",
  "method": "GET",
  "dataKey": "data",
  "transformConfig": {
    "idField": "documentId",
    "titleField": "name",
    "descriptionField": "description"
  },
  "defaultParams": {
    "populate": "*",
    "pagination[limit]": 100
  },
  "isActive": true
}
```

### 2. Creating a Chained Connection

```bash
POST /api/data-sources/ds-uuid-here/connections
Content-Type: application/json

{
  "name": "Get Products by Brand",
  "endpoint": "/api/products",
  "method": "GET",
  "dataKey": "data",
  "transformConfig": {
    "idField": "documentId",
    "titleField": "name"
  },
  "dependsOnConnectionId": "brands-connection-uuid",
  "paramMapping": {
    "filters[brand][slug][$eq]": "$.slug"
  }
}
```

### 3. Executing a Chained Connection

```bash
POST /api/data-sources/connections/products-conn-uuid/execute-chain
Content-Type: application/json

{
  "contextData": {
    "id": "1",
    "slug": "apple",
    "name": "Apple Inc"
  }
}
```

---

## File Reference

### Backend Files

| File | Description |
|------|-------------|
| `backend/src/entities/data-source-connection.entity.ts` | TypeORM entity definition |
| `backend/src/entities/data-source.entity.ts` | Updated with `connections` relation |
| `backend/src/modules/data-sources/dto/create-connection.dto.ts` | Create DTO with validation |
| `backend/src/modules/data-sources/dto/update-connection.dto.ts` | Update DTO (partial) |
| `backend/src/modules/data-sources/data-sources.service.ts` | Service with connection methods |
| `backend/src/modules/data-sources/data-sources.controller.ts` | Controller with 9 new routes |
| `backend/src/migrations/1732800000000-CreateDataSourceConnectionsTable.ts` | Database migration |

### Frontend Files

| File | Description |
|------|-------------|
| `frontend/src/features/data-sources/types.ts` | TypeScript type definitions |
| `frontend/src/features/data-sources/api.ts` | API client with `connectionApi` |
| `frontend/src/features/data-sources/components/DataSourcesPage.tsx` | Main two-panel layout |
| `frontend/src/features/data-sources/components/DataSourceCard.tsx` | DataSource card component |
| `frontend/src/features/data-sources/components/ConnectionList.tsx` | Connection list with CRUD |
| `frontend/src/features/data-sources/components/ConnectionForm.tsx` | Create/edit modal form |
| `frontend/src/features/data-sources/components/ConnectionTestPanel.tsx` | Test panel component |
| `frontend/src/features/flow-builder/components/playground/ContentEditor/DataSourceSelector.tsx` | Updated selector |

---

## Related Documentation

- [Data Sources + WhatsApp Flows Integration](./21-data-sources-whatsapp-flows-integration.md)
- [WhatsApp Integration](./06-whatsapp-integration.md)
- [Backend Architecture](./02-backend-architecture.md)
- [Frontend Architecture](./03-frontend-architecture.md)
- [Database Design](./04-database-design.md)
