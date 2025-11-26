# REST API Node Feature - WhatsApp Builder

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Implementation Details](#implementation-details)
- [User Interface](#user-interface)
- [Execution Flow](#execution-flow)
- [Use Cases](#use-cases)
- [API Reference](#api-reference)

---

## Overview

The REST API Node is a powerful feature that enables chatbot flows to interact with external APIs, allowing seamless integration with third-party services, databases, and custom backends. This feature bridges the gap between WhatsApp conversations and external systems, enabling dynamic, data-driven chatbot experiences.

### Key Capabilities
- **HTTP Methods**: Full support for GET, POST, PUT, DELETE
- **Variable Interpolation**: Dynamic URL, headers, and body using `{{variableName}}` syntax
- **JSON Path Extraction**: Extract specific data from nested API responses
- **Dual Branching**: Success and error output handles for robust flow control
- **Live Testing**: Test API calls within the builder before deployment
- **Timeout Control**: Configurable request timeout (default: 30 seconds)

### Version Information
- **Added In**: Version 2.0.0
- **Status**: Production-ready
- **Node Type**: `rest_api`

---

## Architecture

### Component Structure

```
backend/
└── src/modules/chatbots/
    ├── dto/
    │   ├── node-data.dto.ts          # REST_API enum and fields
    │   └── test-rest-api.dto.ts      # Test endpoint DTO
    ├── services/
    │   ├── chatbot-execution.service.ts     # processRestApiNode()
    │   └── rest-api-executor.service.ts     # API execution logic
    ├── chatbots.controller.ts        # /test-rest-api endpoint
    └── chatbots.module.ts            # Module configuration

frontend/
└── src/
    ├── shared/types/index.ts         # NodeData type with REST API fields
    ├── features/
    │   ├── nodes/RestApiNode/
    │   │   ├── RestApiNode.tsx       # Node component
    │   │   └── index.ts
    │   └── builder/components/
    │       └── ConfigRestApi.tsx     # 4-tab configuration modal
```

### Data Flow

```
User configures REST API node in builder
  ↓
Frontend: ConfigRestApi.tsx saves configuration
  ↓
Backend: ChatBot saved with REST_API node data
  ↓
User reaches REST API node during conversation
  ↓
Backend: processRestApiNode() triggered
  ↓
RestApiExecutorService.execute()
  ├─> Replace {{variables}} in URL, headers, body
  ├─> Make HTTP request
  └─> Return RestApiResult (success/error)
  ↓
On Success:
  ├─> Extract data using JSON path (if configured)
  ├─> Store in apiOutputVariable
  └─> Follow success handle to next node
  ↓
On Error:
  ├─> Store error message in apiErrorVariable
  └─> Follow error handle to error handling node
```

---

## Implementation Details

### Backend Implementation

#### 1. NodeDataDto Extensions

**File**: `/home/ali/whatsapp-builder/backend/src/modules/chatbots/dto/node-data.dto.ts`

```typescript
export enum NodeDataType {
  START = 'start',
  MESSAGE = 'message',
  QUESTION = 'question',
  CONDITION = 'condition',
  WHATSAPP_FLOW = 'whatsapp_flow',
  REST_API = 'rest_api',  // NEW
}

export class NodeDataDto {
  // ... existing fields ...

  // REST API Fields
  @ApiPropertyOptional({ description: 'REST API URL (supports {{variable}})' })
  @IsOptional()
  @IsString()
  apiUrl?: string;

  @ApiPropertyOptional({ description: 'HTTP Method', enum: ['GET', 'POST', 'PUT', 'DELETE'] })
  @IsOptional()
  @IsString()
  apiMethod?: string;

  @ApiPropertyOptional({ description: 'Request headers' })
  @IsOptional()
  apiHeaders?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Request body (JSON string)' })
  @IsOptional()
  @IsString()
  apiBody?: string;

  @ApiPropertyOptional({ description: 'Variable to store response' })
  @IsOptional()
  @IsString()
  apiOutputVariable?: string;

  @ApiPropertyOptional({ description: 'JSON path to extract (e.g., "data")' })
  @IsOptional()
  @IsString()
  apiResponsePath?: string;

  @ApiPropertyOptional({ description: 'Variable to store error' })
  @IsOptional()
  @IsString()
  apiErrorVariable?: string;

  @ApiPropertyOptional({ description: 'Request timeout in ms' })
  @IsOptional()
  apiTimeout?: number;
}
```

#### 2. RestApiExecutorService

**File**: `/home/ali/whatsapp-builder/backend/src/modules/chatbots/services/rest-api-executor.service.ts`

**Key Methods**:

```typescript
@Injectable()
export class RestApiExecutorService {
  /**
   * Replace {{variable}} in string
   */
  replaceVariables(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? String(variables[varName]) : match;
    });
  }

  /**
   * Extract value using dot notation path (e.g., "data.items[0].name")
   */
  extractByPath(obj: any, path: string): any {
    if (!path) return obj;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      // Handle array notation like "items[0]"
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        current = current[arrayMatch[1]]?.[parseInt(arrayMatch[2])];
      } else {
        current = current[part];
      }
    }
    return current;
  }

  /**
   * Execute REST API call with variable replacement
   */
  async execute(
    config: {
      url: string;
      method: string;
      headers?: Record<string, string>;
      body?: string;
      timeout?: number;
      responsePath?: string;
    },
    variables: Record<string, any>,
  ): Promise<RestApiResult> {
    const startTime = Date.now();

    // Replace variables in URL, headers, and body
    const url = this.replaceVariables(config.url, variables);
    const headers: Record<string, string> = {};
    if (config.headers) {
      for (const [key, value] of Object.entries(config.headers)) {
        headers[key] = this.replaceVariables(value, variables);
      }
    }

    let body: any;
    if (config.body) {
      const bodyStr = this.replaceVariables(config.body, variables);
      try {
        body = JSON.parse(bodyStr);
      } catch {
        body = bodyStr;
      }
    }

    try {
      const response = await axios({
        method: config.method.toLowerCase() as any,
        url,
        headers,
        data: body,
        timeout: config.timeout || 30000,
      });

      const responseTime = Date.now() - startTime;

      // Extract data using path if specified
      let resultData = response.data;
      if (config.responsePath) {
        resultData = this.extractByPath(response.data, config.responsePath);
      }

      return {
        success: true,
        data: resultData,
        statusCode: response.status,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status,
        responseTime,
      };
    }
  }
}
```

**Result Interface**:
```typescript
export interface RestApiResult {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
  responseTime?: number;
}
```

#### 3. ChatBotExecutionService Integration

**File**: `/home/ali/whatsapp-builder/backend/src/modules/chatbots/services/chatbot-execution.service.ts`

```typescript
async processRestApiNode(
  context: ConversationContext,
  node: any,
): Promise<void> {
  try {
    const { apiUrl, apiMethod, apiHeaders, apiBody, apiTimeout, apiResponsePath } = node.data;

    if (!apiUrl) {
      throw new Error('API URL is required');
    }

    // Execute API call
    const result = await this.restApiExecutor.execute(
      {
        url: apiUrl,
        method: apiMethod || 'GET',
        headers: apiHeaders,
        body: apiBody,
        timeout: apiTimeout,
        responsePath: apiResponsePath,
      },
      context.variables,
    );

    // Store result in context variables
    if (result.success) {
      if (node.data.apiOutputVariable) {
        context.variables[node.data.apiOutputVariable] = result.data;
      }
      // Follow success handle
      const nextNode = this.findNextNode(context.chatBot, node.id, 'success');
      if (nextNode) {
        context.currentNodeId = nextNode.id;
        await this.contextRepo.save(context);
        await this.executeCurrentNode(context.id);
      }
    } else {
      if (node.data.apiErrorVariable) {
        context.variables[node.data.apiErrorVariable] = result.error;
      }
      // Follow error handle
      const errorNode = this.findNextNode(context.chatBot, node.id, 'error');
      if (errorNode) {
        context.currentNodeId = errorNode.id;
        await this.contextRepo.save(context);
        await this.executeCurrentNode(context.id);
      }
    }
  } catch (error) {
    this.logger.error(`REST API node error: ${error.message}`);
    // Store error and follow error handle
    if (node.data.apiErrorVariable) {
      context.variables[node.data.apiErrorVariable] = error.message;
    }
    const errorNode = this.findNextNode(context.chatBot, node.id, 'error');
    if (errorNode) {
      context.currentNodeId = errorNode.id;
      await this.contextRepo.save(context);
      await this.executeCurrentNode(context.id);
    }
  }
}
```

#### 4. Test Endpoint

**File**: `/home/ali/whatsapp-builder/backend/src/modules/chatbots/chatbots.controller.ts`

```typescript
@Post('test-rest-api')
@ApiOperation({ summary: 'Test REST API configuration' })
@ApiBody({ type: TestRestApiDto })
async testRestApi(@Body() dto: TestRestApiDto) {
  return await this.restApiExecutor.execute(
    {
      url: dto.url,
      method: dto.method,
      headers: dto.headers,
      body: dto.body,
      responsePath: dto.responsePath,
      timeout: dto.timeout,
    },
    {}, // No variables for testing
  );
}
```

**TestRestApiDto**:
```typescript
export class TestRestApiDto {
  @IsString()
  url: string;

  @IsString()
  method: string;

  @IsOptional()
  headers?: Record<string, string>;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  responsePath?: string;

  @IsOptional()
  timeout?: number;
}
```

### Frontend Implementation

#### 1. RestApiNode Component

**File**: `/home/ali/whatsapp-builder/frontend/src/features/nodes/RestApiNode/RestApiNode.tsx`

```typescript
export const RestApiNode = ({ data }: NodeProps) => {
  const getMethodColor = (method: string) => {
    const colors = {
      GET: '#10B981',
      POST: '#3B82F6',
      PUT: '#F59E0B',
      DELETE: '#EF4444',
    };
    return colors[method] || '#06B6D4';
  };

  const truncateUrl = (url: string, maxLength: number) => {
    return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
  };

  return (
    <div className="node-wrapper rest-api-node">
      <Handle type="target" position={Position.Top} />

      <div className="node-content">
        <div className="node-icon" style={{ backgroundColor: '#06B6D4' }}>
          <span className="material-symbols-outlined">api</span>
        </div>
        <div className="node-label">{data.label || 'REST API'}</div>

        <div className="node-details">
          {data.apiMethod && (
            <span
              className="method-badge"
              style={{
                backgroundColor: getMethodColor(data.apiMethod),
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
              }}
            >
              {data.apiMethod}
            </span>
          )}
          {data.apiUrl && (
            <div className="api-url" title={data.apiUrl} style={{ fontSize: '11px', color: '#666' }}>
              {truncateUrl(data.apiUrl, 30)}
            </div>
          )}
          {data.apiOutputVariable && (
            <div className="output-var" style={{ fontSize: '10px', color: '#888' }}>
              → {data.apiOutputVariable}
            </div>
          )}
        </div>
      </div>

      <div className="node-actions">
        <button onClick={() => data.onConfig?.()}>
          <span className="material-symbols-outlined">edit</span>
        </button>
        <button onClick={() => data.onDelete?.()}>
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>

      {/* Success handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="success"
        style={{ background: '#10B981' }}
      />

      {/* Error handle (right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="error"
        style={{ background: '#EF4444', top: '70%' }}
      />
    </div>
  );
};
```

#### 2. ConfigRestApi Modal

**File**: `/home/ali/whatsapp-builder/frontend/src/features/builder/components/ConfigRestApi.tsx`

**See detailed implementation in**: `03-frontend-architecture.md` (RestApiNode Component section)

**Tab Structure**:
1. **Request Tab**: Method, URL, Body, Timeout
2. **Headers Tab**: Dynamic key-value header list
3. **Response Tab**: Output variable, JSON path, Error variable
4. **Test Tab**: Live API testing with result display

---

## User Interface

### Node Appearance

**Visual Characteristics**:
- **Color**: Cyan (#06B6D4) background for icon
- **Icon**: "api" Material Symbol
- **Badge**: HTTP method with color coding
  - GET: Green (#10B981)
  - POST: Blue (#3B82F6)
  - PUT: Orange (#F59E0B)
  - DELETE: Red (#EF4444)
- **URL Display**: Truncated to 30 characters with ellipsis
- **Output Variable**: Displayed as "→ variable_name"

**Handles**:
- **Input Handle**: Top (cyan)
- **Success Handle**: Bottom (green, #10B981)
- **Error Handle**: Right side at 70% height (red, #EF4444)

### Configuration Modal

**Modal Dimensions**:
- Width: max-w-2xl (768px)
- Height: Full viewport height
- Position: Slides in from right with backdrop blur

**Tab Icons**:
- Request: `send`
- Headers: `code`
- Response: `output`
- Test: `play_arrow`

**Dark Mode Support**:
- Full dark theme compatibility
- Border colors: `dark:border-white/10`
- Background: `dark:bg-[#102216]`
- Text: `dark:text-white`

---

## Execution Flow

### Chatbot Runtime Execution

```
1. User message reaches REST API node
   ↓
2. ChatBotExecutionService.processRestApiNode()
   ↓
3. Extract node configuration (apiUrl, apiMethod, etc.)
   ↓
4. Call RestApiExecutorService.execute()
   ↓
5. Variable interpolation:
   - Replace {{variable}} in URL
   - Replace {{variable}} in headers
   - Replace {{variable}} in body
   ↓
6. Make HTTP request with Axios
   ↓
7. Success Path:
   - Extract data using JSON path (if configured)
   - Store in context.variables[apiOutputVariable]
   - Find next node via "success" handle
   - Execute next node
   ↓
8. Error Path:
   - Store error message in context.variables[apiErrorVariable]
   - Find next node via "error" handle
   - Execute error handling node
```

### Variable Interpolation Example

**Configuration**:
```json
{
  "apiUrl": "https://api.example.com/users/{{userId}}/orders",
  "apiMethod": "GET",
  "apiHeaders": {
    "Authorization": "Bearer {{authToken}}"
  }
}
```

**Context Variables**:
```json
{
  "userId": "12345",
  "authToken": "abc123xyz"
}
```

**Executed Request**:
```
GET https://api.example.com/users/12345/orders
Headers:
  Authorization: Bearer abc123xyz
```

### JSON Path Extraction Example

**API Response**:
```json
{
  "status": "success",
  "data": {
    "items": [
      { "id": 1, "name": "Product A", "price": 29.99 },
      { "id": 2, "name": "Product B", "price": 49.99 }
    ],
    "total": 2
  }
}
```

**JSON Path**: `data.items[0].name`

**Extracted Value**: `"Product A"`

**Stored In**: `context.variables[apiOutputVariable]`

---

## Use Cases

### 1. Product Catalog Integration

**Scenario**: Fetch product list from e-commerce API

**Configuration**:
- URL: `https://shop.example.com/api/products?category={{category}}`
- Method: GET
- Response Path: `data.products`
- Output Variable: `productList`

**Flow**:
```
Question Node: "What category?"
  ↓ (user: "electronics")
REST API Node: Fetch products
  ↓ success
Message Node: "Here are products: {{productList}}"
```

### 2. User Authentication

**Scenario**: Validate user credentials

**Configuration**:
- URL: `https://auth.example.com/api/validate`
- Method: POST
- Body: `{"email": "{{email}}", "password": "{{password}}"}`
- Output Variable: `authResult`
- Error Variable: `authError`

**Flow**:
```
Question Node: "Enter email"
  ↓
Question Node: "Enter password"
  ↓
REST API Node: Validate credentials
  ├─ success → Message: "Welcome {{authResult.name}}"
  └─ error → Message: "Login failed: {{authError}}"
```

### 3. Inventory Check

**Scenario**: Check product availability

**Configuration**:
- URL: `https://inventory.example.com/api/stock/{{productId}}`
- Method: GET
- Response Path: `data.quantity`
- Output Variable: `stockQty`

**Flow**:
```
Question Node: "Which product?"
  ↓
REST API Node: Check stock
  ↓
Condition Node: stockQty > 0
  ├─ true → Message: "In stock ({{stockQty}} available)"
  └─ false → Message: "Out of stock"
```

### 4. CRM Integration

**Scenario**: Create lead in CRM

**Configuration**:
- URL: `https://crm.example.com/api/leads`
- Method: POST
- Body: `{"name": "{{customerName}}", "phone": "{{customerPhone}}", "interest": "{{interest}}"}`
- Output Variable: `leadId`

**Flow**:
```
Question Node: "Your name?"
  ↓
Question Node: "Your phone?"
  ↓
Question Node: "Interested in?"
  ↓
REST API Node: Create lead
  ↓ success
Message Node: "Lead created! ID: {{leadId}}"
```

### 5. Real-time Data

**Scenario**: Fetch weather information

**Configuration**:
- URL: `https://api.weather.com/v1/current?city={{city}}&apikey={{apiKey}}`
- Method: GET
- Response Path: `current.temp`
- Output Variable: `temperature`

**Flow**:
```
Question Node: "Which city?"
  ↓
REST API Node: Fetch weather
  ↓ success
Message Node: "Temperature in {{city}}: {{temperature}}°C"
```

---

## API Reference

### Backend Endpoints

#### POST /api/chatbots/test-rest-api

Test REST API configuration before saving.

**Request Body**:
```typescript
{
  url: string;              // API endpoint
  method: string;           // HTTP method (GET, POST, PUT, DELETE)
  headers?: Record<string, string>;  // Optional headers
  body?: string;            // Optional request body (JSON string)
  responsePath?: string;    // Optional JSON path
  timeout?: number;         // Optional timeout (ms)
}
```

**Response**:
```typescript
{
  success: boolean;
  data?: any;               // Response data (if success)
  error?: string;           // Error message (if failed)
  statusCode?: number;      // HTTP status code
  responseTime?: number;    // Request duration (ms)
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/chatbots/test-rest-api \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.example.com/data",
    "method": "GET",
    "responsePath": "data"
  }'
```

**Response**:
```json
{
  "success": true,
  "data": [...],
  "statusCode": 200,
  "responseTime": 245
}
```

### NodeData Interface

**TypeScript Type**:
```typescript
interface NodeData {
  // ... other fields ...

  // REST API Node fields
  apiUrl?: string;
  apiMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  apiHeaders?: Record<string, string>;
  apiBody?: string;
  apiOutputVariable?: string;
  apiResponsePath?: string;
  apiErrorVariable?: string;
  apiTimeout?: number;
}
```

### RestApiResult Interface

**TypeScript Type**:
```typescript
interface RestApiResult {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
  responseTime?: number;
}
```

---

## Best Practices

### Security

1. **Never expose API keys in chatbot configuration**
   - Use backend environment variables
   - Implement API key proxy endpoints

2. **Validate external API responses**
   - Check response structure before extraction
   - Handle unexpected data formats gracefully

3. **Set appropriate timeouts**
   - Default: 30 seconds
   - Adjust based on expected response time
   - Avoid blocking chatbot for too long

### Error Handling

1. **Always provide error branches**
   - Connect error handle to user-friendly error message
   - Log errors for debugging

2. **Store error details**
   - Use `apiErrorVariable` to store error messages
   - Display helpful error messages to users

3. **Implement fallback flows**
   - Provide alternative paths when API fails
   - Don't leave users stuck in the flow

### Performance

1. **Cache API responses when possible**
   - Use conversation context variables
   - Avoid redundant API calls

2. **Optimize JSON path extraction**
   - Extract only necessary data
   - Use specific paths instead of returning entire response

3. **Monitor response times**
   - Check `responseTime` in test results
   - Optimize slow endpoints

### Variable Management

1. **Use descriptive variable names**
   - `productDetails` instead of `data`
   - `authToken` instead of `token`

2. **Clean up unused variables**
   - Remove temporary variables after use
   - Avoid variable namespace pollution

3. **Document variable structure**
   - Add comments in chatbot description
   - Specify expected data format

---

## Troubleshooting

### Common Issues

**1. Variables not being replaced**
- **Symptom**: URL contains `{{variable}}` literally
- **Cause**: Variable name doesn't match context variables
- **Solution**: Check variable spelling and case sensitivity

**2. JSON path extraction fails**
- **Symptom**: `apiOutputVariable` is undefined
- **Cause**: Incorrect path or missing data
- **Solution**: Test with actual API response, verify path syntax

**3. API call timeout**
- **Symptom**: Error after 30 seconds
- **Cause**: API is slow or unreachable
- **Solution**: Increase timeout or optimize API endpoint

**4. CORS errors during testing**
- **Symptom**: Test fails with CORS error
- **Cause**: API doesn't allow requests from backend
- **Solution**: Configure API to allow backend origin, or use proxy

**5. Empty response data**
- **Symptom**: `data` is null or undefined
- **Cause**: API returns empty response or error
- **Solution**: Check API endpoint, verify response structure

### Debugging Tips

1. **Use Test Tab extensively**
   - Test configuration before saving
   - Verify response structure
   - Check response time

2. **Log variable values**
   - Add Message nodes to display variable contents
   - Verify variable interpolation

3. **Check conversation context**
   - Use Sessions page to inspect context variables
   - Verify API response storage

4. **Review backend logs**
   - Check NestJS logs for API errors
   - Verify request details

---

## Future Enhancements

### Planned Features

1. **Authentication Presets**
   - OAuth 2.0 support
   - API key management
   - JWT token handling

2. **Response Transformation**
   - Custom data mapping
   - Array filtering
   - Data aggregation

3. **Request Retry Logic**
   - Automatic retries on failure
   - Exponential backoff
   - Max retry configuration

4. **Webhook Support**
   - Async API calls
   - Webhook response handling
   - Long-running operations

5. **API Mocking**
   - Mock responses for testing
   - Simulate different scenarios
   - No external dependencies

6. **Rate Limiting**
   - Prevent API abuse
   - Queue requests
   - Throttle calls per conversation

7. **Response Caching**
   - Cache API responses
   - TTL configuration
   - Cache invalidation

8. **GraphQL Support**
   - GraphQL query builder
   - Variable injection
   - Response mapping

---

## References

### Internal Documentation
- Backend Architecture: `02-backend-architecture.md`
- Frontend Architecture: `03-frontend-architecture.md`
- Project Overview: `01-project-overview.md`

### Related Features
- Condition Node: Branching logic
- Question Node: User input collection
- Variable System: Data storage and interpolation

### External Resources
- [Axios Documentation](https://axios-http.com/)
- [JSON Path Syntax](https://goessner.net/articles/JsonPath/)
- [REST API Best Practices](https://restfulapi.net/)

---

**Last Updated**: 2025-11-26
**Document Version**: 1.0
**Maintainer**: Project Architecture Team
