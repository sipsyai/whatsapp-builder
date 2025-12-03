# REST API Node Feature - WhatsApp Builder

## Overview

Enables chatbot flows to call external REST APIs for data-driven conversations. The REST API node now includes Postman-like features for a comprehensive API testing and configuration experience.

### Capabilities
- **HTTP Methods**: GET, POST, PUT, PATCH, DELETE
- **Content-Type Support**: JSON, Form-Data, URL-Encoded
- **Authentication**: Bearer Token, Basic Auth, API Key (Header/Query)
- **Query Parameters**: Dedicated tab with URL preview
- **Variable Interpolation**:
  - Simple: `{{variableName}}`
  - Nested: `{{user.profile.email}}`
  - Array access: `{{items[0].name}}`
  - Math expressions: `{{page + 1}}`, `{{count * 2}}`
- **JSON Path Extraction**: Extract nested data (`data.items[0].name`)
- **Dual Branching**: Success/error output handles
- **Live Testing**: Enhanced test UI with status badges, response headers, copy functionality
- **Timeout**: Configurable (default 30s)

**Added**: Version 2.0.0
**Enhanced**: Version 2.1.0 (Postman-like features)
**Node Type**: `rest_api`

---

## Architecture

### Backend Components
```
/backend/src/modules/chatbots/
├── services/
│   ├── chatbot-execution.service.ts  # processRestApiNode()
│   └── rest-api-executor.service.ts  # HTTP client & interpolation
├── dto/
│   ├── node-data.dto.ts              # REST_API fields
│   └── test-rest-api.dto.ts          # Test endpoint DTO
└── chatbots.controller.ts            # POST /test-rest-api
```

### Frontend Components
```
/frontend/src/features/
├── nodes/RestApiNode/RestApiNode.tsx      # Visual node
└── builder/components/ConfigModals.tsx    # ConfigRestApi modal
```

**Files**:
- Backend Service: `/backend/src/modules/chatbots/services/rest-api-executor.service.ts`
- Frontend Node: `/frontend/src/features/nodes/RestApiNode/RestApiNode.tsx`
- Config Modal: `/frontend/src/features/builder/components/ConfigModals.tsx` (ConfigRestApi component)

---

## Data Structure

### NodeData Fields (REST_API type)
```typescript
interface NodeData {
  type: 'rest_api';
  label: string;                    // Node display name

  // Request Configuration
  apiUrl: string;                   // API endpoint (supports {{vars}})
  apiMethod: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  apiHeaders?: Record<string, string>;  // Custom headers
  apiBody?: string;                 // Request body (POST/PUT/PATCH)
  apiTimeout?: number;              // Timeout in ms (default: 30000)
  apiContentType?: 'application/json' | 'multipart/form-data' | 'application/x-www-form-urlencoded';

  // Query Parameters
  apiQueryParams?: Record<string, string>;  // Key-value query params

  // Authentication
  apiAuthType?: 'none' | 'bearer' | 'basic' | 'api_key';
  apiAuthToken?: string;            // Bearer token value
  apiAuthUsername?: string;         // Basic auth username
  apiAuthPassword?: string;         // Basic auth password
  apiAuthKeyName?: string;          // API key header/param name
  apiAuthKeyValue?: string;         // API key value
  apiAuthKeyLocation?: 'header' | 'query';  // Where to add API key

  // Response Configuration (AUTO-GENERATED - Read Only)
  // NOTE: Output variables are now auto-generated based on flow order
  // Manual apiOutputVariable and apiErrorVariable fields are DEPRECATED
  apiResponsePath?: string;         // JSON path extraction (e.g., "data.items")
}
```

### Auto-Generated Output Variables

Output variables are automatically generated based on node position in the flow:

| Output | Variable Format | Description |
|--------|-----------------|-------------|
| Success Data | `rest_api_N.data` | API response data (after JSON path extraction if configured) |
| Error Message | `rest_api_N.error` | Error message if request failed |
| Status Code | `rest_api_N.status` | HTTP status code (number) |

Where `N` is the 1-based index of this REST API node in the flow (determined by topological sort).

**Example:** If this is the 2nd REST API node in the flow:
- `rest_api_2.data` - Response data
- `rest_api_2.error` - Error message
- `rest_api_2.status` - HTTP status code

### Execution Result
```typescript
interface RestApiResult {
  success: boolean;
  data?: any;               // Extracted response data
  error?: string;           // Error message
  statusCode?: number;      // HTTP status
  responseTime?: number;    // Request duration (ms)
  responseHeaders?: Record<string, string>;  // Response headers (test mode)
}
```

---

## Variable Interpolation

### RestApiExecutorService.replaceVariables()

**Supported Patterns**:
```typescript
// Simple variable
{{userName}} → "John"

// Nested path
{{user.profile.email}} → "john@example.com"

// Array access
{{items[0].title}} → "First Item"

// Math expressions
{{page + 1}} → 3 (if page=2)
{{count * 2}} → 20 (if count=10)
{{index - 1}} → 4 (if index=5)
```

**Implementation**: Uses regex and `eval()` for math (sandboxed to variables only)

**Used In**:
- URL: `https://api.example.com/users/{{userId}}/posts`
- Headers: `Authorization: Bearer {{accessToken}}`
- Body: `{"page": {{page + 1}}, "email": "{{user.email}}"}`

---

## JSON Path Extraction

### RestApiExecutorService.extractByPath()

**Examples**:
```typescript
// Response: { data: { user: { name: "John" } } }
apiResponsePath: "data.user.name"
→ Stored: "John"

// Response: { items: [{ id: 1, title: "First" }] }
apiResponsePath: "items[0].title"
→ Stored: "First"

// Response: { result: { list: [10, 20, 30] } }
apiResponsePath: "result.list[1]"
→ Stored: 20
```

**Supports**:
- Nested objects: `data.user.profile`
- Array indexing: `items[0]`
- Combined: `data.items[0].nested.value`

---

## Execution Flow

### ChatBot Flow Execution
```
1. User reaches REST API node
   ↓
2. ChatBotExecutionService.executeCurrentNode()
   ↓
3. processRestApiNode()
   ↓
4. RestApiExecutorService.execute(config, variables)
   ↓
5. Replace variables in URL, headers, body
   ↓
6. Make HTTP request (Axios)
   ↓
7. Extract data via JSON path (if specified)
   ↓
8. Save result to context variable
   ↓
9. Branch based on success/error
   ↓
10. Continue to next node
```

### Code Flow
**File**: `/backend/src/modules/chatbots/services/chatbot-execution.service.ts`

```typescript
private async processRestApiNode(node, context, chatbot) {
  const config = {
    url: node.data.apiUrl,
    method: node.data.apiMethod,
    headers: node.data.apiHeaders,
    body: node.data.apiBody,
    responsePath: node.data.apiResponsePath,
    timeout: node.data.apiTimeout || 30000,
  };

  const result = await this.restApiExecutor.execute(config, context.variables);

  // Auto-generate variable name based on flow position
  const nodeIndex = calculateNodeIndex(
    chatbot.nodes,
    context.nodeHistory,
    node.id,
    'rest_api'
  );
  const autoVarName = generateAutoVariableName('rest_api', nodeIndex);

  // Store results in auto-generated variables
  context.variables[`${autoVarName}.data`] = result.data;
  context.variables[`${autoVarName}.error`] = result.error || null;
  context.variables[`${autoVarName}.status`] = result.statusCode;

  if (result.success) {
    await this.continueToNextNode(node.id, 'success', context);
  } else {
    await this.continueToNextNode(node.id, 'error', context);
  }
}
```

**Note:** The old `apiOutputVariable` and `apiErrorVariable` fields are deprecated. Variables are now auto-generated as `rest_api_N.data`, `rest_api_N.error`, and `rest_api_N.status`.

---

## Frontend UI

### ConfigRestApi Modal (Postman-Like Interface)
**File**: `/frontend/src/features/builder/components/ConfigRestApi.tsx`

The ConfigRestApi modal now features a 6-tab interface similar to Postman:

#### Tab 1: Request
- **Label**: Node display name
- **HTTP Method**: GET, POST, PUT, PATCH, DELETE (color-coded buttons)
- **URL**: API endpoint with `{{variable}}` support
- **Content-Type** (POST/PUT/PATCH only): JSON, Form-Data, URL-Encoded
- **Body** (POST/PUT/PATCH only): Request body textarea
- **Timeout**: Request timeout in milliseconds

#### Tab 2: Auth
Authentication type selector with dynamic UI:
- **No Auth**: No authentication
- **Bearer Token**: Token input with variable support
- **Basic Auth**: Username/Password fields
- **API Key**: Key name, value, and location (Header/Query)

#### Tab 3: Params
- Query parameter key-value editor
- Add/Remove parameter buttons
- Real-time URL preview showing final URL

#### Tab 4: Headers
- Custom header key-value editor
- Auto-generated headers display (Content-Type, Authorization)
- Add/Remove header buttons

#### Tab 5: Response
- **Output Variables (Auto-generated)**: Shows `OutputVariableBadge` with:
  - `rest_api_N.data` - API response data
  - `rest_api_N.error` - Error message if failed
  - `rest_api_N.status` - HTTP status code
- **JSON Path**: Optional path extraction (e.g., "data.items")
- **Note**: Manual output/error variable inputs have been removed

#### Tab 6: Test
- **Run Test Button**: Execute API request
- **Status Badge**: Color-coded (green 2xx, yellow 3xx, red 4xx/5xx)
- **Response Time**: Request duration in ms
- **Response Body**: JSON formatted with copy button
- **Response Headers**: Collapsible header list

### RestApiNode Component
**File**: `/frontend/src/features/nodes/RestApiNode/RestApiNode.tsx`

**Visual**:
- Cyan-blue gradient background
- API endpoint icon
- Method badge with colors:
  - GET: Green
  - POST: Blue
  - PUT: Orange
  - PATCH: Yellow
  - DELETE: Red
- Success handle (right, green)
- Error handle (bottom, red)

---

## Use Cases

### 1. Fetch Product Catalog
```typescript
apiUrl: "https://api.shop.com/products?category={{selectedCategory}}"
apiMethod: "GET"
apiResponsePath: "data.products"
// Output: rest_api_1.data (auto-generated)
```

Then use `rest_api_1.data` in Question node with dynamic list:
```typescript
dynamicListSource: "rest_api_1.data"
dynamicLabelField: "name"
dynamicDescField: "description"
```

### 2. Create Order (with Bearer Auth)
```typescript
apiUrl: "https://api.shop.com/orders"
apiMethod: "POST"
apiContentType: "application/json"
apiAuthType: "bearer"
apiAuthToken: "{{apiToken}}"
apiBody: '{"productId": "{{selectedProduct}}", "quantity": 1}'
apiResponsePath: "data.orderId"
// Output: rest_api_1.data contains orderId (auto-generated)
```

### 3. Validate User Input
```typescript
apiUrl: "https://api.example.com/validate/email?email={{userEmail}}"
apiMethod: "GET"
apiResponsePath: "isValid"
// Output: rest_api_1.data contains isValid boolean (auto-generated)
```

Then use Condition node with auto-generated variable:
```typescript
conditionVar: "rest_api_1.data"  // Auto-generated variable path
conditionOp: "=="
conditionVal: "true"
```

### 4. Pagination (with Query Params)
```typescript
// First page - using dedicated query params
apiUrl: "https://api.example.com/items"
apiMethod: "GET"
apiQueryParams: { "page": "{{currentPage}}", "limit": "10" }
apiResponsePath: "data.items"
// Output: rest_api_1.data contains items array (auto-generated)

// Next page button increments currentPage
// Use math expression: {{currentPage + 1}}
```

### 5. Form Data Submission
```typescript
apiUrl: "https://api.example.com/upload"
apiMethod: "POST"
apiContentType: "multipart/form-data"
apiBody: '{"file_name": "{{fileName}}", "data": "{{fileData}}"}'
// Output: rest_api_1.data contains upload result (auto-generated)
```

### 6. API Key Authentication
```typescript
apiUrl: "https://api.weather.com/current"
apiMethod: "GET"
apiAuthType: "api_key"
apiAuthKeyName: "X-API-Key"
apiAuthKeyValue: "{{weatherApiKey}}"
apiAuthKeyLocation: "header"
apiQueryParams: { "city": "{{userCity}}" }
// Output: rest_api_1.data contains weather data (auto-generated)
```

### 7. Basic Auth with PATCH
```typescript
apiUrl: "https://api.example.com/users/{{userId}}"
apiMethod: "PATCH"
apiContentType: "application/json"
apiAuthType: "basic"
apiAuthUsername: "{{serviceUser}}"
apiAuthPassword: "{{servicePassword}}"
apiBody: '{"status": "verified"}'
// Output: rest_api_1.data contains update result (auto-generated)
```

---

## Testing

### Test Endpoint
**Route**: `POST /api/chatbots/test-rest-api`
**Controller**: `ChatBotsController.testRestApi()`

**Request**:
```json
{
  "url": "https://api.example.com/users/123",
  "method": "GET",
  "headers": { "Authorization": "Bearer token" },
  "body": null,
  "contentType": "application/json",
  "responsePath": "data.user.name",
  "timeout": 5000,
  "testVariables": { "page": "1", "limit": "10" }
}
```

**Response**:
```json
{
  "success": true,
  "data": "John Doe",
  "statusCode": 200,
  "responseTime": 234,
  "responseHeaders": {
    "content-type": "application/json",
    "x-request-id": "abc123"
  }
}
```

**Frontend Integration**:
- Test button in ConfigRestApi modal (Tab 6)
- Shows loading state with spinner during test
- Status badge with color coding:
  - Green: 2xx success
  - Yellow: 3xx redirect
  - Red: 4xx/5xx errors
- Response time display in milliseconds
- Body/Headers toggle tabs
- Copy to clipboard functionality
- JSON formatted response preview

---

## Error Handling

### Common Errors
1. **Network Error**: Connection refused, timeout
2. **HTTP Error**: 4xx, 5xx status codes
3. **JSON Parse Error**: Invalid response body
4. **Path Extraction Error**: Invalid JSON path

### Error Handling Strategy
```typescript
try {
  const response = await axios.request(config);
  const data = extractByPath(response.data, responsePath);
  return { success: true, data, statusCode: response.status };
} catch (error) {
  return {
    success: false,
    error: error.response?.data?.message || error.message,
    statusCode: error.response?.status
  };
}
```

### Error Variable Usage
```typescript
// Auto-generated error variable (no manual configuration needed):
// rest_api_N.error is automatically available

// Then in Message node, use auto-generated variable:
content: "Error: {{rest_api_1.error}}"
```

---

## Security Considerations

### Current Implementation
- ✅ Request timeout prevents hanging
- ✅ Error messages sanitized
- ✅ Variable interpolation sandboxed
- ⚠️ No API key encryption in DB
- ⚠️ No request rate limiting

### Recommendations
1. **API Key Management**: Encrypt sensitive headers in database
2. **Rate Limiting**: Prevent API abuse (Redis-based)
3. **Allowed Domains**: Whitelist allowed API endpoints
4. **Request Logging**: Log all API calls for audit
5. **Response Size Limit**: Prevent memory exhaustion

---

## Performance Optimization

### Current
- Axios with timeout
- Single request per node
- No caching

### Recommendations
1. **Response Caching**: Cache GET requests with TTL
2. **Connection Pooling**: Reuse HTTP connections
3. **Concurrent Requests**: Parallel API calls when possible
4. **Retry Logic**: Exponential backoff for failed requests

---

## Summary

### Key Features
- Full HTTP method support (GET, POST, PUT, PATCH, DELETE)
- Content-Type selection (JSON, Form-Data, URL-Encoded)
- Authentication options (Bearer, Basic, API Key)
- Query Parameters with URL preview
- Advanced variable interpolation with math
- Nested JSON path extraction
- Success/error branching
- Enhanced live testing with response headers
- Configurable timeout
- **Auto-generated output variables** (NEW)

### New in Version 2.1.0 (Postman-Like Features)
- 6-tab configuration interface
- PATCH HTTP method support
- Content-Type selector for POST/PUT/PATCH
- Auth Tab with Bearer Token, Basic Auth, API Key
- Query Parameters Tab with real-time URL preview
- Test Tab with status badges, response headers, copy functionality

### New in Version 2.2.0 (Auto Variable Naming)
- Output variables auto-generated as `rest_api_N.data`, `.error`, `.status`
- Manual `apiOutputVariable` and `apiErrorVariable` fields deprecated
- `OutputVariableBadge` component shows all available outputs
- Index calculated using topological sort (Kahn's algorithm)
- Copy buttons for easy variable reference

### Integration Points
- **ChatBot Execution**: `processRestApiNode()` in flow
- **Frontend Builder**: Visual node + 6-tab config modal
- **Test Endpoint**: Real-time API testing with headers
- **Variable System**: Auto-naming utilities in both frontend and backend

### File Locations
- Service: `/backend/src/modules/chatbots/services/rest-api-executor.service.ts`
- Execution: `/backend/src/modules/chatbots/services/chatbot-execution.service.ts:processRestApiNode()`
- Node: `/frontend/src/features/nodes/RestApiNode/RestApiNode.tsx`
- Config: `/frontend/src/features/builder/components/ConfigRestApi.tsx`
- Types: `/frontend/src/shared/types/index.ts`
- DTO: `/backend/src/modules/chatbots/dto/node-data.dto.ts`
- Test DTO: `/backend/src/modules/chatbots/dto/test-rest-api.dto.ts`
- Auto Variable Utils (Frontend): `/frontend/src/features/builder/utils/autoVariableNaming.ts`
- Auto Variable Utils (Backend): `/backend/src/modules/chatbots/utils/auto-variable-naming.ts`
- OutputVariableBadge: `/frontend/src/features/builder/components/OutputVariableBadge.tsx`

---

**See Also**:
- [Variable System](08-variable-system.md) - Auto-naming system documentation
- [Backend Architecture](02-backend-architecture.md#1-chatbotsmodule) - ChatBot execution engine
- [Frontend Architecture](03-frontend-architecture.md#2-custom-nodes) - Custom node patterns
- [Dynamic Lists Feature](02-backend-architecture.md#processquestionnode) - Using API data in interactive messages
- [REST API Postman Features](08-rest-api-postman-features.md) - Detailed Postman-like features documentation
