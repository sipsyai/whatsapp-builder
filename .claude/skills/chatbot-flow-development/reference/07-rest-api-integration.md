# REST API Integration in Chatbots

Complete guide for integrating external REST APIs within chatbot flows using the REST_API node.

## Table of Contents
- [Overview](#overview)
- [Node Configuration](#node-configuration)
- [Authentication](#authentication)
- [Query Parameters](#query-parameters)
- [Content Types](#content-types)
- [Variable Replacement](#variable-replacement)
- [Response Handling](#response-handling)
- [Error Handling](#error-handling)
- [Testing REST APIs](#testing-rest-apis)
- [Common Patterns](#common-patterns)
- [Best Practices](#best-practices)

---

## Overview

The REST_API node enables chatbots to call external HTTP APIs during conversation flows. This allows:
- Fetching dynamic data (products, appointments, weather, etc.)
- Submitting user inputs to external systems
- Validating data against databases
- Triggering webhooks and integrations

**Key Features:**
- Supports GET, POST, PUT, PATCH, DELETE methods
- Multiple content types: JSON, Form-Data, URL-Encoded
- Authentication options: Bearer Token, Basic Auth, API Key
- Query Parameters tab with URL preview
- Variable interpolation in URL, headers, and body using `{{variable}}` syntax
- JSON path extraction from responses (e.g., `data.items[0].name`)
- Dual output handles (success/error) for flow branching
- Math expressions in templates (e.g., `{{page + 1}}`)
- Enhanced test interface with status badges and response headers
- Configurable timeout (default: 30 seconds)

---

## Node Configuration

### Basic REST_API Node Structure

```json
{
  "id": "rest_api_1",
  "type": "rest_api",
  "data": {
    "type": "rest_api",
    "label": "Fetch Products",
    "apiUrl": "https://api.example.com/products",
    "apiMethod": "GET",
    "apiHeaders": {},
    "apiBody": "",
    "apiOutputVariable": "products",
    "apiResponsePath": "data",
    "apiErrorVariable": "api_error",
    "apiTimeout": 30000
  }
}
```

### Configuration Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `apiUrl` | String | Yes | Full URL with protocol (http/https). Supports `{{variable}}` |
| `apiMethod` | String | No | HTTP method: GET, POST, PUT, PATCH, DELETE (default: GET) |
| `apiContentType` | String | No | Content-Type for POST/PUT/PATCH: `application/json`, `multipart/form-data`, `application/x-www-form-urlencoded` |
| `apiHeaders` | Object | No | Key-value pairs for request headers. Supports `{{variable}}` |
| `apiBody` | String | No | Request body (JSON string). Supports `{{variable}}` |
| `apiQueryParams` | Object | No | Key-value pairs for query parameters |
| `apiOutputVariable` | String | No | Variable name to store successful response |
| `apiResponsePath` | String | No | JSON path to extract from response (e.g., "data.items") |
| `apiErrorVariable` | String | No | Variable name to store error message |
| `apiTimeout` | Number | No | Request timeout in milliseconds (default: 30000) |
| `apiAuthType` | String | No | Authentication type: `none`, `bearer`, `basic`, `api_key` |
| `apiAuthToken` | String | No | Bearer token value (supports `{{variable}}`) |
| `apiAuthUsername` | String | No | Basic auth username |
| `apiAuthPassword` | String | No | Basic auth password |
| `apiAuthKeyName` | String | No | API key header/param name (default: X-API-Key) |
| `apiAuthKeyValue` | String | No | API key value |
| `apiAuthKeyLocation` | String | No | Where to add API key: `header` or `query` |

---

## Authentication

The REST_API node supports multiple authentication methods configured via the Auth tab.

### No Auth
Default setting. No authentication headers are added.

### Bearer Token
```json
{
  "apiAuthType": "bearer",
  "apiAuthToken": "your-token-here"
}
```
Automatically adds: `Authorization: Bearer <token>`

Supports variables: `"apiAuthToken": "{{auth_token}}"`

### Basic Auth
```json
{
  "apiAuthType": "basic",
  "apiAuthUsername": "user",
  "apiAuthPassword": "pass"
}
```
Backend encodes credentials as Base64 and adds: `Authorization: Basic <base64>`

### API Key
```json
{
  "apiAuthType": "api_key",
  "apiAuthKeyName": "X-API-Key",
  "apiAuthKeyValue": "your-api-key",
  "apiAuthKeyLocation": "header"
}
```

Location options:
- `header`: Adds as HTTP header (e.g., `X-API-Key: value`)
- `query`: Adds to URL query string (e.g., `?X-API-Key=value`)

---

## Query Parameters

Manage query parameters separately from the URL using the Params tab.

### Configuration
```json
{
  "apiUrl": "https://api.example.com/items",
  "apiQueryParams": {
    "page": "1",
    "limit": "10",
    "filter": "{{filter_value}}"
  }
}
```

**Features:**
- Real-time URL preview in the UI
- Supports `{{variable}}` syntax
- Cleaner than embedding params in URL
- API Key can be automatically added to query params

### URL Preview Example
Base URL: `https://api.example.com/items`
Query Params: `page=1`, `limit=10`
Preview: `https://api.example.com/items?page=1&limit=10`

---

## Content Types

For POST, PUT, and PATCH methods, you can select the Content-Type.

### application/json (Default)
```json
{
  "apiContentType": "application/json",
  "apiBody": "{\"name\": \"{{user_name}}\", \"email\": \"{{user_email}}\"}"
}
```

### application/x-www-form-urlencoded
```json
{
  "apiContentType": "application/x-www-form-urlencoded",
  "apiBody": "{\"field1\": \"value1\", \"field2\": \"value2\"}"
}
```
Body is provided as JSON but converted to URL-encoded format by the backend.

### multipart/form-data
```json
{
  "apiContentType": "multipart/form-data",
  "apiBody": "{\"file_name\": \"document.pdf\", \"data\": \"{{file_data}}\"}"
}
```
Body is provided as JSON but converted to form-data format by the backend.

---

## Variable Replacement

The REST_API node supports dynamic variable replacement using `{{variableName}}` syntax.

### URL Variable Replacement

**Example: Dynamic User ID**
```json
{
  "apiUrl": "https://api.example.com/users/{{user_id}}/profile",
  "apiMethod": "GET"
}
```

If `user_id = "12345"`, the actual request URL becomes:
```
https://api.example.com/users/12345/profile
```

**Example: Query Parameters**
```json
{
  "apiUrl": "https://api.example.com/search?q={{query}}&page={{page}}&limit=10"
}
```

If `query = "laptop"` and `page = "2"`:
```
https://api.example.com/search?q=laptop&page=2&limit=10
```

### Header Variable Replacement

**Example: Dynamic Authorization**
```json
{
  "apiHeaders": {
    "Authorization": "Bearer {{auth_token}}",
    "X-User-ID": "{{user_id}}",
    "Content-Type": "application/json"
  }
}
```

### Body Variable Replacement

**Example: JSON Body with Variables**
```json
{
  "apiMethod": "POST",
  "apiBody": "{\"name\": \"{{user_name}}\", \"email\": \"{{user_email}}\", \"product_id\": \"{{selected_product}}\"}"
}
```

If `user_name = "John Doe"`, `user_email = "john@example.com"`, `selected_product = "PROD123"`:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "product_id": "PROD123"
}
```

### Nested Variable Access

Access nested properties using dot notation:

```json
{
  "apiUrl": "https://api.example.com/orders/{{user.id}}/items/{{cart.selected_item.id}}"
}
```

If variables:
```json
{
  "user": {"id": "123", "name": "John"},
  "cart": {"selected_item": {"id": "456"}}
}
```

Result:
```
https://api.example.com/orders/123/items/456
```

### Array Index Access

Access array elements using bracket notation:

```json
{
  "apiUrl": "https://api.example.com/products/{{products[0].id}}"
}
```

### Math Expressions

Perform simple arithmetic in templates:

```json
{
  "apiUrl": "https://api.example.com/products?page={{page + 1}}"
}
```

If `page = "5"`:
```
https://api.example.com/products?page=6
```

**Supported Operations:**
- Addition: `{{a + b}}`
- Subtraction: `{{a - b}}` (returns max(0, a-b) to prevent negative values)
- Multiplication: `{{a * b}}`
- Division: `{{a / b}}` (returns 0 if b is 0)

---

## Response Handling

### Storing Full Response

If `apiOutputVariable` is set without `apiResponsePath`, the entire response is stored:

**API Response:**
```json
{
  "status": "success",
  "data": {
    "items": [{"id": 1, "name": "Product 1"}]
  }
}
```

**Node Configuration:**
```json
{
  "apiOutputVariable": "api_result"
}
```

**Result:** `api_result` contains the full response object.

### Extracting with Response Path

Use `apiResponsePath` to extract specific parts of the response.

**API Response:**
```json
{
  "status": "success",
  "data": {
    "categories": [
      {"id": "cat1", "name": "Electronics"},
      {"id": "cat2", "name": "Clothing"}
    ]
  }
}
```

**Node Configuration:**
```json
{
  "apiOutputVariable": "categories",
  "apiResponsePath": "data.categories"
}
```

**Result:** `categories` contains:
```json
[
  {"id": "cat1", "name": "Electronics"},
  {"id": "cat2", "name": "Clothing"}
]
```

### Complex Path Extraction

**API Response:**
```json
{
  "result": {
    "user": {
      "profile": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  }
}
```

**Path:** `result.user.profile.name`

**Result:** `"John Doe"`

### Array Element Extraction

**API Response:**
```json
{
  "data": {
    "orders": [
      {"id": "ORD1", "total": 100},
      {"id": "ORD2", "total": 200}
    ]
  }
}
```

**Path:** `data.orders[0].id`

**Result:** `"ORD1"`

---

## Error Handling

### Success and Error Branches

The REST_API node has two output handles:
- **success** (green): Triggered when API call succeeds (HTTP 2xx)
- **error** (red): Triggered when API call fails (HTTP 4xx, 5xx, timeout, network error)

**Flow Structure:**
```
[REST_API Node]
  ├─ success → [Show Results Message]
  └─ error   → [Show Error Message]
```

### Error Variables

When an API call fails, error information is stored in variables:

**Configured Error Variable:**
```json
{
  "apiErrorVariable": "api_error"
}
```

**Automatic Variables:**
- `{{api_error}}` - Error message (if apiErrorVariable is set)
- `{{__last_api_error__}}` - Always contains last error message
- `{{__last_api_status__}}` - Last HTTP status code (on success only)

### Example: Error Handling Flow

**REST_API Node:**
```json
{
  "apiUrl": "https://api.example.com/validate",
  "apiMethod": "POST",
  "apiBody": "{\"email\": \"{{user_email}}\"}",
  "apiOutputVariable": "validation_result",
  "apiErrorVariable": "validation_error"
}
```

**Error Message Node:**
```json
{
  "type": "message",
  "data": {
    "content": "Sorry, we couldn't validate your email: {{validation_error}}\n\nPlease try again."
  }
}
```

### Common Error Scenarios

| Error Type | Status Code | Example |
|------------|-------------|---------|
| Not Found | 404 | Resource doesn't exist |
| Unauthorized | 401 | Invalid API key |
| Bad Request | 400 | Invalid input data |
| Server Error | 500 | API internal error |
| Timeout | - | Request took > timeout ms |
| Network Error | - | Connection failed |

---

## Testing REST APIs

### Test Endpoint

The backend provides a test endpoint to verify API configurations before deploying:

**Endpoint:** `POST /api/chatbots/test-rest-api`

**Request Body:**
```json
{
  "url": "https://api.example.com/products",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer test-token"
  },
  "body": "",
  "contentType": "application/json",
  "testVariables": {
    "user_id": "123",
    "category": "electronics"
  },
  "responsePath": "data.items",
  "timeout": 30000
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": [...extracted data...],
  "statusCode": 200,
  "responseTime": 234,
  "responseHeaders": {
    "content-type": "application/json",
    "x-request-id": "abc123"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Request failed with status code 404",
  "statusCode": 404,
  "responseTime": 123
}
```

### Enhanced Test UI (Postman-Like)

The Test tab in the ConfigRestApi modal provides:

1. **Run Test Button**: Execute the API request with current configuration
2. **Status Badge**: Color-coded status display
   - Green: 2xx success responses
   - Yellow: 3xx redirect responses
   - Red: 4xx/5xx error responses
3. **Response Time**: Shows request duration in milliseconds
4. **Body/Headers Toggle**: Switch between response body and headers view
5. **Copy Button**: Copy response to clipboard
6. **JSON Formatting**: Pretty-printed JSON response

### Testing Workflow

1. **Configure the REST_API node** in the builder (Request, Auth, Params tabs)
2. **Switch to Test tab**
3. **Click "Run Test"** button
4. **Review response**:
   - Check status badge color
   - Verify response data
   - Inspect headers if needed
5. **Adjust configuration** if needed
6. **Save and deploy**

---

## Common Patterns

### Pattern 1: Fetch List of Items

**Use Case:** Get product categories from API

```json
{
  "id": "fetch_categories",
  "type": "rest_api",
  "data": {
    "label": "Fetch Categories",
    "apiUrl": "https://api.example.com/categories",
    "apiMethod": "GET",
    "apiOutputVariable": "categories",
    "apiResponsePath": "data"
  }
}
```

**Next Node (Question with Dynamic List):**
```json
{
  "type": "question",
  "data": {
    "questionType": "list",
    "content": "Select a category:",
    "variable": "selected_category",
    "dynamicListSource": "categories",
    "dynamicLabelField": "name"
  }
}
```

### Pattern 2: Submit Form Data

**Use Case:** Create a new order

```json
{
  "id": "create_order",
  "type": "rest_api",
  "data": {
    "label": "Create Order",
    "apiUrl": "https://api.example.com/orders",
    "apiMethod": "POST",
    "apiHeaders": {
      "Content-Type": "application/json",
      "Authorization": "Bearer {{auth_token}}"
    },
    "apiBody": "{\"user_id\": \"{{user_id}}\", \"items\": {{cart_items}}, \"total\": {{cart_total}}}",
    "apiOutputVariable": "order_result",
    "apiResponsePath": "data.order_id",
    "apiErrorVariable": "order_error"
  }
}
```

**Success Message:**
```json
{
  "type": "message",
  "data": {
    "content": "Order created successfully! Your order ID is: {{order_result}}"
  }
}
```

### Pattern 3: Paginated Data Fetching

**Use Case:** Fetch products with pagination

```json
{
  "id": "fetch_products_page",
  "type": "rest_api",
  "data": {
    "label": "Fetch Products",
    "apiUrl": "https://api.example.com/products?page={{current_page}}&limit=10",
    "apiMethod": "GET",
    "apiOutputVariable": "products",
    "apiResponsePath": "data.items"
  }
}
```

**Initialize page number in a previous MESSAGE node:**
Set `current_page = 1` initially, then increment using math expressions.

### Pattern 4: Authentication Flow

**Use Case:** Login and get token

**Step 1: Login Request**
```json
{
  "id": "login_api",
  "type": "rest_api",
  "data": {
    "label": "Login",
    "apiUrl": "https://api.example.com/auth/login",
    "apiMethod": "POST",
    "apiHeaders": {
      "Content-Type": "application/json"
    },
    "apiBody": "{\"username\": \"{{username}}\", \"password\": \"{{password}}\"}",
    "apiOutputVariable": "auth_token",
    "apiResponsePath": "data.token",
    "apiErrorVariable": "login_error"
  }
}
```

**Step 2: Use Token in Subsequent Requests**
```json
{
  "apiHeaders": {
    "Authorization": "Bearer {{auth_token}}"
  }
}
```

### Pattern 5: Data Validation

**Use Case:** Check if email exists

```json
{
  "id": "check_email",
  "type": "rest_api",
  "data": {
    "label": "Validate Email",
    "apiUrl": "https://api.example.com/users/check-email?email={{user_email}}",
    "apiMethod": "GET",
    "apiOutputVariable": "email_valid",
    "apiResponsePath": "data.exists"
  }
}
```

**Condition Node:**
```json
{
  "type": "condition",
  "data": {
    "conditionVar": "email_valid",
    "conditionOp": "eq",
    "conditionVal": "false"
  }
}
```
- True → Continue registration
- False → Email already exists message

---

## Best Practices

### 1. URL Construction

- **Always use full URLs** with protocol: `https://api.example.com/path`
- **Avoid hardcoding sensitive data**: Use variables for API keys/tokens
- **Encode special characters**: Ensure URL-safe characters in dynamic values
- **Use query parameters wisely**: Prefer path parameters for IDs, query for filters

### 2. Headers Management

- **Set Content-Type** for POST/PUT: `"Content-Type": "application/json"`
- **Use Bearer tokens** for auth: `"Authorization": "Bearer {{token}}"`
- **Don't hardcode credentials**: Always use variables for sensitive headers

### 3. Body Construction

- **Validate JSON syntax**: Ensure proper quotes and escaping
- **Use double quotes**: JSON requires double quotes, not single
- **Escape quotes in strings**: Use `\"` inside JSON strings
- **Test with sample data**: Use test endpoint before deploying

**Bad:**
```json
"apiBody": "{'name': '{{user_name}}'}"  // Single quotes - WRONG
```

**Good:**
```json
"apiBody": "{\"name\": \"{{user_name}}\"}"
```

### 4. Response Path Extraction

- **Start simple**: Test without path first, then add path
- **Handle missing data**: Provide default values in subsequent nodes
- **Log responses**: Use error handling to debug path issues
- **Use array indexing carefully**: Ensure arrays have elements before accessing

### 5. Error Handling

- **Always connect error handle**: Never leave error handle unconnected
- **Provide user-friendly messages**: Don't expose technical errors
- **Log errors for debugging**: Store in variables for analysis
- **Implement retry logic**: Consider retry patterns for transient failures

**Example Error Message:**
```
We're having trouble connecting to our server. Please try again in a few moments.
```

Instead of:
```
Error 500: Internal server error at line 234
```

### 6. Performance

- **Set appropriate timeouts**: Default 30s, reduce for quick APIs
- **Cache responses**: Store frequently used data to reduce calls
- **Avoid sequential API calls**: Batch operations when possible
- **Use pagination**: Don't fetch large datasets in one call

### 7. Security

- **Never log sensitive data**: Avoid logging passwords, tokens in error messages
- **Use HTTPS only**: Always use secure connections
- **Validate responses**: Don't trust API responses blindly
- **Implement rate limiting**: Respect API rate limits

### 8. Variable Naming

- **Use descriptive names**: `user_profile` instead of `data1`
- **Follow conventions**: Use snake_case for variable names
- **Prefix API variables**: Consider `api_products`, `api_error` for clarity
- **Avoid conflicts**: Don't override built-in variables like `__last_api_error__`

---

## Troubleshooting

### Issue: Variables Not Replaced

**Problem:** URL shows `{{user_id}}` instead of actual value

**Solution:**
1. Ensure variable exists in context (set in previous nodes)
2. Check variable name spelling (case-sensitive)
3. Verify variable is available at this point in flow

### Issue: JSON Parse Error in Body

**Problem:** API returns "Invalid JSON" error

**Solution:**
1. Validate JSON syntax: Use JSON validator
2. Ensure proper escaping: `\"` for quotes
3. Check variable types: Numbers don't need quotes in JSON

### Issue: Response Path Returns Undefined

**Problem:** `apiOutputVariable` is undefined after successful call

**Solution:**
1. Log full response (remove path temporarily)
2. Verify path syntax: Use dot notation correctly
3. Check for array vs object: Use `[0]` for arrays
4. Handle optional fields: Check if path exists in response

### Issue: Timeout Errors

**Problem:** API call times out

**Solution:**
1. Increase `apiTimeout` value
2. Optimize API endpoint performance
3. Check network connectivity
4. Consider async pattern with webhooks

### Issue: CORS Errors (Development)

**Problem:** Browser blocks API calls

**Solution:**
- REST_API node executes on backend, not affected by CORS
- If testing in browser, use backend test endpoint instead

---

**Last Updated**: 2025-12-03
**Document Version**: 2.0
**Related**:
- [08-examples.md](./08-examples.md) for complete chatbot examples
- Backend: `/backend/src/modules/chatbots/services/rest-api-executor.service.ts`
- Frontend: `/frontend/src/features/builder/components/ConfigRestApi.tsx`
- Test Endpoint: `POST /api/chatbots/test-rest-api`
- Types: `/frontend/src/shared/types/index.ts`
