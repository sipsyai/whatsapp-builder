# REST API Node Feature - WhatsApp Builder

## Overview

Enables chatbot flows to call external REST APIs for data-driven conversations.

### Capabilities
- **HTTP Methods**: GET, POST, PUT, DELETE
- **Variable Interpolation**:
  - Simple: `{{variableName}}`
  - Nested: `{{user.profile.email}}`
  - Array access: `{{items[0].name}}`
  - Math expressions: `{{page + 1}}`, `{{count * 2}}`
- **JSON Path Extraction**: Extract nested data (`data.items[0].name`)
- **Dual Branching**: Success/error output handles
- **Live Testing**: Test API config in builder
- **Timeout**: Configurable (default 30s)

**Added**: Version 2.0.0
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
  apiUrl: string;                   // API endpoint (supports {{vars}})
  apiMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  apiHeaders?: Record<string, string>;  // Custom headers
  apiBody?: string;                 // JSON body (POST/PUT)
  apiOutputVariable: string;        // Variable to store success response
  apiResponsePath?: string;         // JSON path extraction (e.g., "data.items")
  apiErrorVariable?: string;        // Variable to store error message
  apiTimeout?: number;              // Timeout in ms (default: 30000)
}
```

### Execution Result
```typescript
interface RestApiResult {
  success: boolean;
  data?: any;           // Extracted response data
  error?: string;       // Error message
  statusCode?: number;  // HTTP status
  responseTime?: number; // Request duration (ms)
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

  if (result.success) {
    context.variables[node.data.apiOutputVariable] = result.data;
    await this.continueToNextNode(node.id, 'success', context);
  } else {
    if (node.data.apiErrorVariable) {
      context.variables[node.data.apiErrorVariable] = result.error;
    }
    await this.continueToNextNode(node.id, 'error', context);
  }
}
```

---

## Frontend UI

### ConfigRestApi Modal
**File**: `/frontend/src/features/builder/components/ConfigModals.tsx`

**Fields**:
1. **Node Label** (text input)
2. **HTTP Method** (dropdown: GET, POST, PUT, DELETE)
3. **API URL** (text input with variable hint)
4. **Headers** (key-value pairs)
5. **Body** (textarea, JSON, shown for POST/PUT)
6. **Response Path** (text input, optional)
7. **Success Variable** (text input)
8. **Error Variable** (text input, optional)
9. **Timeout** (number input, ms)

**Features**:
- **Test Button**: Sends request with current config
- **Variable Hints**: Shows available variables
- **JSON Validation**: For body field
- **Response Preview**: Shows test result

### RestApiNode Component
**File**: `/frontend/src/features/nodes/RestApiNode/RestApiNode.tsx`

**Visual**:
- Orange box
- API endpoint icon
- Method badge (GET/POST/PUT/DELETE)
- Success handle (right, green)
- Error handle (bottom, red)

---

## Use Cases

### 1. Fetch Product Catalog
```typescript
apiUrl: "https://api.shop.com/products?category={{selectedCategory}}"
apiMethod: "GET"
apiResponsePath: "data.products"
apiOutputVariable: "productList"
```

Then use `productList` in Question node with dynamic list:
```typescript
dynamicListSource: "productList"
dynamicLabelField: "name"
dynamicDescField: "description"
```

### 2. Create Order
```typescript
apiUrl: "https://api.shop.com/orders"
apiMethod: "POST"
apiHeaders: { "Authorization": "Bearer {{apiToken}}" }
apiBody: '{"productId": "{{selectedProduct}}", "quantity": 1}'
apiResponsePath: "data.orderId"
apiOutputVariable: "orderId"
```

### 3. Validate User Input
```typescript
apiUrl: "https://api.example.com/validate/email?email={{userEmail}}"
apiMethod: "GET"
apiResponsePath: "isValid"
apiOutputVariable: "emailValid"
```

Then use Condition node:
```typescript
conditionVar: "emailValid"
conditionOp: "=="
conditionVal: "true"
```

### 4. Pagination
```typescript
// First page
apiUrl: "https://api.example.com/items?page={{currentPage}}&limit=10"
apiMethod: "GET"
apiResponsePath: "data.items"
apiOutputVariable: "items"

// Next page button increments currentPage
// Use math expression: {{currentPage + 1}}
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
  "responsePath": "data.user.name",
  "timeout": 5000
}
```

**Response**:
```json
{
  "success": true,
  "data": "John Doe",
  "statusCode": 200,
  "responseTime": 234
}
```

**Frontend Integration**:
- Test button in ConfigRestApi modal
- Shows loading state during test
- Displays result or error
- Validates before saving

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
// In chatbot flow:
apiErrorVariable: "apiError"

// Then in Message node:
content: "Error: {{apiError}}"
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
- ✅ Full HTTP method support
- ✅ Advanced variable interpolation with math
- ✅ Nested JSON path extraction
- ✅ Success/error branching
- ✅ Live testing in builder
- ✅ Configurable timeout

### Integration Points
- **ChatBot Execution**: `processRestApiNode()` in flow
- **Frontend Builder**: Visual node + config modal
- **Test Endpoint**: Real-time API testing

### File Locations
- Service: `/backend/src/modules/chatbots/services/rest-api-executor.service.ts`
- Execution: `/backend/src/modules/chatbots/services/chatbot-execution.service.ts:processRestApiNode()`
- Node: `/frontend/src/features/nodes/RestApiNode/RestApiNode.tsx`
- Config: `/frontend/src/features/builder/components/ConfigModals.tsx:ConfigRestApi`

---

**See Also**:
- [Backend Architecture](02-backend-architecture.md#1-chatbotsmodule) - ChatBot execution engine
- [Frontend Architecture](03-frontend-architecture.md#2-custom-nodes) - Custom node patterns
- [Dynamic Lists Feature](02-backend-architecture.md#processquestionnode) - Using API data in interactive messages
