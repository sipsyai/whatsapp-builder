# Data Sources + WhatsApp Flows Integration

## Overview

This feature enables dynamic data population in WhatsApp Flows using external APIs (Strapi, REST, GraphQL) through the DataSources system. It supports cascading dropdowns where selecting one option filters another dropdown's options.

> **Note:** This document describes the original component-level configuration system. For the newer hierarchical **DataSourceConnection** system that provides reusable endpoint definitions and improved chaining, see [DataSourceConnection Feature](./22-data-source-connections.md).

## Feature Summary

| Aspect | Details |
|--------|---------|
| Purpose | Dynamic dropdown population from external APIs |
| Key Feature | Cascading dropdowns (e.g., Brand -> Product) |
| Frontend | DataSourceSelector component in Playground |
| Backend | FlowEndpointService config-driven data exchange |
| Storage | ComponentDataSourceConfigDto[] in Flow metadata |
| **New (v2)** | DataSourceConnection entities for reusable endpoints |

## Features

### 1. Playground'da Data Source Entegrasyonu

#### Flow-Level Data Source Seçimi
- SaveFlowModal'da varsayılan Data Source seçilebilir
- Bu seçim tüm flow için geçerli olur
- Component'lar bu varsayılanı override edebilir

#### Component-Level Data Source Konfigürasyonu
- DropdownEditor'da "Fill from Data Source" toggle'ı
- Her component için ayrı endpoint ve transform konfigürasyonu
- Cascading dropdown desteği (dependsOn)

### 2. Chatbot'ta WHATSAPP_FLOW Node Entegrasyonu

#### Node-Level Data Source
- Her WHATSAPP_FLOW node'una Data Source bağlanabilir
- Endpoint ve DataKey konfigürasyonu
- Node-level config, Flow entity config'inden öncelikli

### 3. Generic Data Exchange Handler

FlowEndpointService artık config-driven çalışıyor:
- metadata.dataSourceConfig'e göre veri çekme
- Cascading için dependsOn ve filterParam desteği
- Strapi/REST API response'u dropdown formatına dönüştürme

## Teknik Detaylar

### Backend Dosyaları

| Dosya | Açıklama |
|-------|----------|
| `backend/src/modules/flows/dto/component-data-source-config.dto.ts` | ComponentDataSourceConfig ve TransformTo DTO'ları |
| `backend/src/modules/flows/dto/create-flow-from-playground.dto.ts` | dataSourceId ve dataSourceConfig alanları |
| `backend/src/modules/chatbots/dto/node-data.dto.ts` | WHATSAPP_FLOW için dataSourceId, endpoint, dataKey |
| `backend/src/modules/flows/flows.service.ts` | createFromPlayground'da config kaydetme |
| `backend/src/modules/webhooks/services/flow-endpoint.service.ts` | Generic data_exchange handler |
| `backend/src/modules/chatbots/services/chatbot-execution.service.ts` | Node-level DataSource desteği |

### Frontend Dosyaları

| Dosya | Açıklama |
|-------|----------|
| `frontend/src/features/flow-builder/components/playground/ContentEditor/DataSourceSelector.tsx` | Reusable Data Source seçim component'ı |
| `frontend/src/features/flow-builder/components/playground/ContentEditor/editors/DropdownEditor.tsx` | DataSource toggle ve entegrasyon |
| `frontend/src/features/flow-builder/components/playground/modals/SaveFlowModal.tsx` | Flow-level DataSource seçimi |
| `frontend/src/features/builder/components/ConfigModals.tsx` | Chatbot WHATSAPP_FLOW konfigürasyonu |
| `frontend/src/features/flows/api/index.ts` | ComponentDataSourceConfig type tanımları |
| `frontend/src/shared/types/index.ts` | NodeData'da DataSource alanları |

## Kullanım Örnekleri

### 1. Playground'da Dropdown için Data Source

```typescript
// Flow metadata'da dataSourceConfig
{
  dataSourceConfig: [
    {
      componentName: "selected_brand",
      dataSourceId: "uuid-of-strapi",
      endpoint: "/api/brands",
      dataKey: "data",
      transformTo: {
        idField: "slug",
        titleField: "name"
      }
    }
  ]
}
```

### 2. Cascading Dropdown

```typescript
// Ürünler, seçilen markaya göre filtrelenir
{
  componentName: "selected_product",
  dataSourceId: "uuid-of-strapi",
  endpoint: "/api/products",
  dataKey: "data",
  transformTo: {
    idField: "documentId",
    titleField: "name",
    descriptionField: "description"
  },
  dependsOn: "selected_brand",
  filterParam: "filters[brand][name][$eq]"
}
```

### 3. Chatbot WHATSAPP_FLOW Node

```typescript
// Node konfigürasyonu
{
  whatsappFlowId: "flow-uuid",
  dataSourceId: "strapi-uuid",
  dataSourceEndpoint: "/api/products",
  dataSourceDataKey: "data"
}
```

## Akış Diyagramı

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Playground    │     │    Chatbot      │     │   WhatsApp      │
│   Flow Create   │     │  WHATSAPP_FLOW  │     │   Flow Open     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FlowEndpointService                          │
│  - getFlowDataSourceConfig()                                    │
│  - fetchComponentData()                                         │
│  - handleInit / handleDataExchange                              │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DataSourcesService                           │
│  - fetchData(dataSourceId, endpoint, options)                   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External API (Strapi, REST)                  │
│  - GET /api/brands                                              │
│  - GET /api/products?filters[brand][name][$eq]=Nike             │
└─────────────────────────────────────────────────────────────────┘
```

## API Değişiklikleri

### POST /api/flows/from-playground

Yeni alanlar:
- `dataSourceId?: string` - Flow-level varsayılan Data Source
- `dataSourceConfig?: ComponentDataSourceConfigDto[]` - Component bazlı konfigürasyonlar

### WhatsApp Flow Metadata

```typescript
interface FlowMetadata {
  source: 'playground';
  created_from_playground: boolean;
  playground_json_received: string;
  dataSourceConfig?: ComponentDataSourceConfigDto[];
}
```

## Important Notes

1. **Priority Order**: Node-level > Flow entity-level > Environment variable
2. **Fallback**: Legacy hardcoded behavior runs if no config found
3. **Cascading**: dependsOn requires filterParam
4. **Transform**: idField and titleField required, descriptionField optional

---

## Runtime Data Exchange Flow

### INIT Action (Flow Opens)

```
1. WhatsApp sends INIT action to /api/webhooks/flow-endpoint
2. FlowEndpointService.handleInit() called
3. Load Flow from database with metadata
4. Check metadata.dataSourceConfig for component configs
5. Find configs without dependsOn (initial data)
6. For each config:
   a. Load DataSource entity
   b. Call DataSourcesService.fetchData(endpoint)
   c. Extract array using dataKey
   d. Transform to { id, title } format
7. Return first screen with populated data
```

### data_exchange Action (User Submits)

```
1. WhatsApp sends data_exchange with { screen, data }
2. FlowEndpointService.handleDataExchange() called
3. Get submitted field names from data
4. For each submitted field:
   a. Find configs where dependsOn === fieldName
   b. Fetch data with filter: params[filterParam] = data[fieldName]
   c. Add to screenData
5. Determine next screen from flowJson
6. Return next screen with filtered data
```

---

## ComponentDataSourceConfigDto Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| componentName | string | Yes | Dropdown component name in Flow JSON |
| dataSourceId | UUID | Yes | DataSource entity ID |
| endpoint | string | Yes | API endpoint path (e.g., "/api/brands") |
| dataKey | string | Yes | Path to array in response (e.g., "data" or "data.items") |
| transformTo.idField | string | Yes | Field name for dropdown ID |
| transformTo.titleField | string | Yes | Field name for dropdown title |
| transformTo.descriptionField | string | No | Field name for description |
| dependsOn | string | No | Parent field name for cascading |
| filterParam | string | No | Filter parameter for API (e.g., "filters[brand][$eq]") |

---

## Strapi v4/v5 Filter Examples

| Use Case | filterParam Value |
|----------|-------------------|
| Filter by name field | `filters[brand][name][$eq]` |
| Filter by ID | `filters[brand][id][$eq]` |
| Filter by relation | `filters[category][slug][$eq]` |
| Contains search | `filters[name][$contains]` |

---

## Error Handling

### DataSource Not Found
- Log warning, return empty array
- Flow continues with empty dropdown

### API Fetch Error
- Log error with message
- Return empty array (graceful degradation)

### No Config Found
- Falls back to legacy hardcoded Strapi handler
- Uses STRAPI_BASE_URL and STRAPI_TOKEN env vars

---

## Future Enhancements

1. **Multi-Select Dropdown Support** - Transform to checkbox format
2. **Conditional Visibility** - Show/hide based on selections
3. **Data Caching** - Cache API responses
4. **Real-time Preview** - Show dynamic data in Playground
5. ~~**Connection Testing** - Validate config before save~~ (Implemented in DataSourceConnection)

---

## DataSourceConnection System (v2)

The newer **DataSourceConnection** feature provides a hierarchical two-level system:

### Key Improvements

| Aspect | Original (v1) | DataSourceConnection (v2) |
|--------|---------------|---------------------------|
| Endpoint Config | Inline per component | Reusable Connection entities |
| Chaining | `dependsOn` + `filterParam` | `dependsOnConnectionId` + JSONPath `paramMapping` |
| Testing | None | Execute endpoint with test panel |
| UI | Scattered in modal | Dedicated two-panel management page |
| Storage | Flow metadata JSONB | Separate database table |

### Migration Path

The new system is **additive** - both approaches work:

1. **Legacy:** `dataSourceConfig[]` in Flow metadata continues to work
2. **New:** DataSourceSelector now uses `connectionId` to reference reusable connections

### Architecture

```
DataSource (Parent)
├── baseUrl, authType, authToken
└── DataSourceConnection[] (Children)
    ├── endpoint, method
    ├── dataKey, transformConfig
    └── dependsOnConnectionId, paramMapping (JSONPath)
```

### New API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/data-sources/:dsId/connections` | Create connection |
| GET | `/api/data-sources/:dsId/connections` | List connections |
| GET | `/api/data-sources/connections/:id` | Get connection |
| PUT | `/api/data-sources/connections/:id` | Update connection |
| DELETE | `/api/data-sources/connections/:id` | Delete connection |
| POST | `/api/data-sources/connections/:id/execute` | Execute connection |
| POST | `/api/data-sources/connections/:id/execute-chain` | Execute with context |
| GET | `/api/data-sources/connections/grouped/active` | Grouped for selectors |

### Full Documentation

See [DataSourceConnection Feature](./22-data-source-connections.md) for complete details on:
- Entity schema and relationships
- Chaining with JSONPath
- Frontend UI components
- Migration guide
- Usage examples

---

**Related Documentation**:
- [DataSourceConnection Feature](./22-data-source-connections.md) - **New hierarchical system**
- [Create with Playground Feature](./20-create-with-playground-feature.md)
- [WhatsApp Integration](./06-whatsapp-integration.md)
- [Backend Architecture](./02-backend-architecture.md) - DataSourcesModule
- [Frontend Architecture](./03-frontend-architecture.md) - DataSources Feature
