# Chatbot Variables Reference - AUTOMATIC NAMING SYSTEM

This document provides comprehensive documentation for the **automatic variable naming system** in the WhatsApp Builder chatbot flow.

## Overview

Variables are now **AUTO-GENERATED** based on node type and execution order. The system automatically creates variable names in the format `{nodeType}_{index}.{output}`, eliminating the need for manual variable configuration.

**Key Changes:**
- NO manual variable input in config modals
- Variables are automatically named: `question_1.response`, `rest_api_1.data`, etc.
- Index calculated using topological sort (flow order)
- OutputVariableBadge component displays auto-generated names
- Each node type has its own counter

Variables enable:

- Storing user responses (auto-stored as `question_N.response`)
- Passing data between nodes
- Dynamic message content
- Conditional logic evaluation
- API request/response handling (auto-stored as `rest_api_N.data`)
- Flow state management

## Variable Storage

Variables are stored in the **Conversation Context** object using the new **nodeOutputs** system:

```typescript
interface ConversationContext {
  id: string;
  conversationId: string;
  chatbotId: string;
  currentNodeId: string;
  nodeOutputs: Record<string, NodeOutput>;  // <-- Auto-generated variables stored here
  nodeHistory: string[];
  isActive: boolean;
  status: string;
  // ... other fields
}

interface NodeOutput {
  nodeId: string;
  nodeType: string;
  nodeLabel?: string;
  executedAt: string;
  success: boolean;
  duration?: number;
  data?: any;              // API response data
  error?: string;          // Error message
  statusCode?: number;     // HTTP status code
  userResponse?: string;   // Question response
  flowResponse?: any;      // WhatsApp Flow response
  outputVariable?: string; // Auto variable name (e.g., question_1)
}
```

### Variable Scope

- **Conversation-scoped:** Variables persist throughout the entire conversation
- **Context-bound:** Each conversation has its own variable namespace
- **Persistent:** Variables remain available until conversation ends
- **Auto-named:** Each output has a unique auto-generated name
- **Mutable:** Can be overwritten by subsequent executions of the same node

---

## Auto-Generated Variable Names

The system automatically generates variable names based on node type and execution order:

| Node Type | Base Name | Available Outputs | Example |
|-----------|-----------|-------------------|---------|
| Question | `question_N` | `.response` | `question_1.response` |
| REST API | `rest_api_N` | `.data`, `.error`, `.status` | `rest_api_1.data` |
| WhatsApp Flow | `flow_N` | `.response` | `flow_1.response` |
| Google Calendar | `calendar_N` | `.result` | `calendar_1.result` |

### Index Calculation

- Index `N` is calculated using **topological sort** (flow order)
- Each node type maintains its own counter
- First Question node in flow = `question_1`, second = `question_2`
- First REST API node in flow = `rest_api_1`, second = `rest_api_2`

---

## UI Components for Variables

### OutputVariableBadge Component

Displays auto-generated variable names in node configuration modals.

**Features:**
- Shows base variable name (e.g., `question_1`, `rest_api_1`)
- Expandable to show all available outputs
- Copy button for each output path
- Data type icons (string, number, object, array)

**Appears in:**
- Question node config: Shows `question_N.response`
- REST API node config: Shows `.data`, `.error`, `.status`
- WhatsApp Flow node config: Shows `flow_N.response`
- Google Calendar node config: Shows `calendar_N.result`

### VariablePicker Component

Dropdown picker to select variables from other nodes.

**Features:**
- Groups variables by node type
- Shows node labels for easy identification
- Displays all available outputs per node
- Search/filter functionality
- Drag & drop support

**Used in:**
- Message content input
- Condition variable selection
- API URL and body inputs
- Calendar date variable selection

### VariableInput Component

Text input with integrated variable picker button.

**Features:**
- Shows "VAR" badge when input contains variables
- Click button to open variable picker
- Insert variables at cursor position
- Supports multiline mode (textarea)

---

## Setting Variables

Variables are automatically set by node execution:

### 1. QUESTION Node Variables

QUESTION nodes automatically store user responses with NO manual configuration.

**Configuration (NO variable property):**

```json
{
  "type": "question",
  "data": {
    "content": "What is your name?",
    "questionType": "text"
  }
}
```

**User Response:** "John Doe"

**Result in Context:**

```json
{
  "nodeOutputs": {
    "node-uuid-123": {
      "nodeId": "node-uuid-123",
      "nodeType": "question",
      "outputVariable": "question_1",
      "userResponse": "John Doe",
      "executedAt": "2025-12-03T10:00:00Z",
      "success": true
    }
  }
}
```

**Access via:** `{{question_1.response}}` → "John Doe"

**Button Question (NO variable property):**

```json
{
  "type": "question",
  "data": {
    "questionType": "buttons",
    "buttons": [
      { "id": "btn_yes", "title": "Yes" },
      { "id": "btn_no", "title": "No" }
    ]
  }
}
```

**User clicks "Yes" button**

**Result:**

```json
{
  "nodeOutputs": {
    "node-uuid-456": {
      "nodeId": "node-uuid-456",
      "nodeType": "question",
      "outputVariable": "question_2",
      "userResponse": "Yes",
      "buttonId": "btn_yes",
      "executedAt": "2025-12-03T10:01:00Z",
      "success": true
    }
  }
}
```

**Access via:** `{{question_2.response}}` → "Yes"

### 2. REST_API Node Variables

REST_API nodes automatically store responses with THREE outputs (NO manual configuration).

**Configuration (NO apiOutputVariable property):**

```json
{
  "type": "rest_api",
  "data": {
    "apiUrl": "http://api.example.com/products",
    "apiMethod": "GET",
    "apiResponsePath": "data"
  }
}
```

**API Response:**

```json
{
  "status": "success",
  "data": [
    { "id": "1", "name": "Laptop", "price": 1500 },
    { "id": "2", "name": "Phone", "price": 800 }
  ]
}
```

**Result in Context:**

```json
{
  "nodeOutputs": {
    "node-uuid-789": {
      "nodeId": "node-uuid-789",
      "nodeType": "rest_api",
      "outputVariable": "rest_api_1",
      "data": [
        { "id": "1", "name": "Laptop", "price": 1500 },
        { "id": "2", "name": "Phone", "price": 800 }
      ],
      "statusCode": 200,
      "executedAt": "2025-12-03T10:02:00Z",
      "success": true
    }
  }
}
```

**Access via:**
- `{{rest_api_1.data}}` → Array of products (after JSONPath extraction)
- `{{rest_api_1.status}}` → 200
- `{{rest_api_1.error}}` → null (no error)

### 3. WHATSAPP_FLOW Node Variables

WHATSAPP_FLOW nodes automatically store flow completion data (NO manual configuration).

**Configuration (NO flowOutputVariable property):**

```json
{
  "type": "whatsapp_flow",
  "data": {
    "whatsappFlowId": "123456789",
    "flowMode": "data_exchange",
    "flowCta": "Book Now"
  }
}
```

**Flow Completion Data:**

```json
{
  "screen.BOOKING.form.date": "2025-11-30",
  "screen.BOOKING.form.time": "14:00",
  "screen.BOOKING.form.service": "haircut"
}
```

**Result in Context:**

```json
{
  "nodeOutputs": {
    "node-uuid-abc": {
      "nodeId": "node-uuid-abc",
      "nodeType": "whatsapp_flow",
      "outputVariable": "flow_1",
      "flowResponse": {
        "screen.BOOKING.form.date": "2025-11-30",
        "screen.BOOKING.form.time": "14:00",
        "screen.BOOKING.form.service": "haircut"
      },
      "executedAt": "2025-12-03T10:03:00Z",
      "success": true
    }
  }
}
```

**Access via:**
- `{{flow_1.response}}` → Entire flow response object
- `{{flow_1.response.screen.BOOKING.form.date}}` → "2025-11-30"

### 4. GOOGLE_CALENDAR Node Variables

GOOGLE_CALENDAR nodes automatically store calendar data (NO manual configuration).

**Configuration (NO calendarOutputVariable property):**

```json
{
  "type": "google_calendar",
  "data": {
    "calendarAction": "check_availability",
    "calendarUserSource": "owner",
    "calendarDateSource": "variable",
    "calendarDateVariable": "question_1.response",
    "calendarWorkingHoursStart": "09:00",
    "calendarWorkingHoursEnd": "18:00",
    "calendarSlotDuration": 30,
    "calendarOutputFormat": "slots_only"
  }
}
```

**Calendar Result:**

```json
[
  { "title": "09:00 - 09:30", "value": "09:00" },
  { "title": "10:00 - 10:30", "value": "10:00" },
  { "title": "14:00 - 14:30", "value": "14:00" }
]
```

**Result in Context:**

```json
{
  "nodeOutputs": {
    "node-uuid-xyz": {
      "nodeId": "node-uuid-xyz",
      "nodeType": "google_calendar",
      "outputVariable": "calendar_1",
      "data": [
        { "title": "09:00 - 09:30", "value": "09:00" },
        { "title": "10:00 - 10:30", "value": "10:00" },
        { "title": "14:00 - 14:30", "value": "14:00" }
      ],
      "executedAt": "2025-12-03T10:04:00Z",
      "success": true
    }
  }
}
```

**Access via:**
- `{{calendar_1.result}}` → Array of available slots
- `{{calendar_1.result[0].title}}` → "09:00 - 09:30"

---

## Using Variables

Variables can be used in multiple places throughout the flow.

### 1. Variable Replacement in Messages

**Syntax:** `{{auto_variable_name.output}}`

MESSAGE and QUESTION nodes support variable replacement using auto-generated variable names:

**Example:**

```json
{
  "type": "message",
  "data": {
    "content": "Hello {{question_1.response}}! Your order number is {{question_2.response}}."
  }
}
```

**Context:**

```json
{
  "nodeOutputs": {
    "node-1": {
      "outputVariable": "question_1",
      "userResponse": "John"
    },
    "node-2": {
      "outputVariable": "question_2",
      "userResponse": "12345"
    }
  }
}
```

**Sent Message:**

```
Hello John! Your order number is 12345.
```

### 2. Nested Property Access

**Syntax:** `{{auto_variable.output.property}}`

Access nested object properties from auto-generated variables:

**Example:**

```json
{
  "type": "message",
  "data": {
    "content": "Product: {{rest_api_1.data.name}}\nPrice: {{rest_api_1.data.price}} TL\nStock: {{rest_api_1.data.stock}}"
  }
}
```

**Context:**

```json
{
  "nodeOutputs": {
    "api-node-1": {
      "outputVariable": "rest_api_1",
      "data": {
        "name": "Laptop",
        "price": 1500,
        "stock": 5
      }
    }
  }
}
```

**Sent Message:**

```
Product: Laptop
Price: 1500 TL
Stock: 5
```

### 3. Array Access

**Syntax:** `{{auto_variable.output[index].property}}`

Access array elements from auto-generated variables:

**Example:**

```json
{
  "type": "message",
  "data": {
    "content": "First item: {{rest_api_1.data[0].name}}\nSecond item: {{rest_api_1.data[1].name}}"
  }
}
```

**Context:**

```json
{
  "nodeOutputs": {
    "api-node-1": {
      "outputVariable": "rest_api_1",
      "data": [
        { "name": "Product A", "price": 100 },
        { "name": "Product B", "price": 200 }
      ]
    }
  }
}
```

**Sent Message:**

```
First item: Product A
Second item: Product B
```

### 4. Array Display

Arrays are automatically formatted for display:

**Example:**

```json
{
  "type": "message",
  "data": {
    "content": "Available products:\n{{products}}"
  }
}
```

**Context:**

```json
{
  "variables": {
    "products": [
      { "name": "Laptop", "price": 1500 },
      { "name": "Phone", "price": 800 },
      { "name": "Tablet", "price": 500 }
    ]
  }
}
```

**Sent Message:**

```
Available products:
1. Laptop - 1500 TL
2. Phone - 800 TL
3. Tablet - 500 TL
```

**Auto-Detection Fields:**
- Display: `name`, `title`, `label`, `displayName`, `sku`, `id`
- Extras: `description`, `price`, `stock`

### 5. Object Display

Objects are formatted as key-value pairs:

**Example:**

```json
{
  "type": "message",
  "data": {
    "content": "User Info:\n{{user}}"
  }
}
```

**Context:**

```json
{
  "variables": {
    "user": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+905551234567"
    }
  }
}
```

**Sent Message:**

```
User Info:
name: John Doe
email: john@example.com
phone: +905551234567
```

---

## Variables in Conditions

CONDITION nodes evaluate auto-generated variables to determine flow routing.

**Example:**

```json
{
  "type": "condition",
  "data": {
    "conditionVar": "question_1.response",
    "conditionOp": "gte",
    "conditionVal": "18"
  }
}
```

**Context:**

```json
{
  "nodeOutputs": {
    "question-node-1": {
      "outputVariable": "question_1",
      "userResponse": "25"
    }
  }
}
```

**Evaluation:** `25 >= 18` → `true` → Routes to "true" edge

**Supported Operators:**

| Operator | Variable Type | Example |
|----------|---------------|---------|
| `eq`, `==` | Any | `status eq active` |
| `ne`, `!=` | Any | `status ne pending` |
| `gt`, `>` | Number | `age gt 18` |
| `lt`, `<` | Number | `price lt 100` |
| `gte`, `>=` | Number | `stock gte 5` |
| `lte`, `<=` | Number | `score lte 50` |
| `contains` | String | `message contains hello` |
| `not_contains` | String | `status not_contains error` |

---

## Variables in REST API Nodes

REST_API nodes support variable replacement in multiple places.

### URL Parameters

```json
{
  "type": "rest_api",
  "data": {
    "apiUrl": "http://api.example.com/users/{{user_id}}/orders?status={{order_status}}"
  }
}
```

**Context:**

```json
{
  "variables": {
    "user_id": "12345",
    "order_status": "completed"
  }
}
```

**Actual URL:**

```
http://api.example.com/users/12345/orders?status=completed
```

### Headers

```json
{
  "type": "rest_api",
  "data": {
    "apiHeaders": {
      "Authorization": "Bearer {{access_token}}",
      "X-User-ID": "{{user_id}}"
    }
  }
}
```

**Context:**

```json
{
  "variables": {
    "access_token": "abc123xyz",
    "user_id": "12345"
  }
}
```

**Actual Headers:**

```
Authorization: Bearer abc123xyz
X-User-ID: 12345
```

### Request Body

```json
{
  "type": "rest_api",
  "data": {
    "apiBody": "{\"user_id\": \"{{user_id}}\", \"product_id\": \"{{product_id}}\", \"quantity\": {{quantity}}}"
  }
}
```

**Context:**

```json
{
  "variables": {
    "user_id": "12345",
    "product_id": "prod_001",
    "quantity": "3"
  }
}
```

**Actual Body:**

```json
{
  "user_id": "12345",
  "product_id": "prod_001",
  "quantity": 3
}
```

### Math Expressions

Simple math operations are supported in body:

```json
{
  "apiBody": "{\"total\": {{price}} * {{quantity}}, \"tax\": {{price}} * 0.18}"
}
```

**Context:**

```json
{
  "variables": {
    "price": "100",
    "quantity": "2"
  }
}
```

**Actual Body:**

```json
{
  "total": 200,
  "tax": 18
}
```

---

## Variables in WhatsApp Flow Nodes

WHATSAPP_FLOW nodes can pass variables as initial data.

**Example:**

```json
{
  "type": "whatsapp_flow",
  "data": {
    "flowInitialData": {
      "user_id": "{{user_id}}",
      "user_name": "{{user_name}}",
      "preselected_date": "{{preferred_date}}",
      "available_services": "{{services}}"
    }
  }
}
```

**Context:**

```json
{
  "variables": {
    "user_id": "12345",
    "user_name": "John Doe",
    "preferred_date": "2025-11-30",
    "services": ["haircut", "coloring", "styling"]
  }
}
```

**Flow Receives:**

```json
{
  "user_id": "12345",
  "user_name": "John Doe",
  "preselected_date": "2025-11-30",
  "available_services": ["haircut", "coloring", "styling"]
}
```

The flow can use this data to pre-fill forms or customize screens.

---

## System Variables

The chatbot system uses special variables for internal state management. These start with double underscores `__`.

### 1. `__awaiting_variable__`

**Purpose:** Track which variable name a QUESTION node is waiting to populate.

**Set By:** QUESTION node before waiting for response

**Cleared By:** After user response is received

**Example:**

```json
{
  "variables": {
    "__awaiting_variable__": "user_name"
  }
}
```

When user responds, the system:
1. Reads `__awaiting_variable__` → "user_name"
2. Stores response in `variables.user_name`
3. Deletes `__awaiting_variable__`

### 2. `__awaiting_flow_response__`

**Purpose:** Track which variable name a WHATSAPP_FLOW node will store response in.

**Set By:** WHATSAPP_FLOW node before waiting for completion

**Cleared By:** After flow completes

**Example:**

```json
{
  "variables": {
    "__awaiting_flow_response__": "appointment_data"
  }
}
```

When flow completes, the system:
1. Reads `__awaiting_flow_response__` → "appointment_data"
2. Stores flow response in `variables.appointment_data`
3. Deletes `__awaiting_flow_response__`

### 3. `__last_api_status__`

**Purpose:** Store the HTTP status code of the last REST_API call.

**Set By:** REST_API node after request completes

**Type:** Number

**Example:**

```json
{
  "variables": {
    "__last_api_status__": 200
  }
}
```

**Usage in CONDITION:**

```json
{
  "conditionVar": "__last_api_status__",
  "conditionOp": "eq",
  "conditionVal": "200"
}
```

### 4. `__last_api_error__`

**Purpose:** Store error message if REST_API or WHATSAPP_FLOW fails.

**Set By:** REST_API or WHATSAPP_FLOW node on error

**Type:** String

**Example:**

```json
{
  "variables": {
    "__last_api_error__": "Connection timeout after 30000ms"
  }
}
```

**Usage in MESSAGE:**

```json
{
  "content": "An error occurred: {{__last_api_error__}}"
}
```

### 5. Pagination Variables

**Purpose:** Track current page for dynamic lists.

**Format:** `{dynamicListSource}_page`

**Set By:** System during list pagination navigation

**Type:** Number

**Example:**

```json
{
  "variables": {
    "categories_page": 2
  }
}
```

When user selects "Sonraki Sayfa" (next page) from a dynamic list with `dynamicListSource: "categories"`, the system sets `categories_page = 3`.

---

## Variable Replacement Algorithm

The system uses this algorithm to replace variables in text:

```typescript
function replaceVariables(
  text: string,
  variables: Record<string, any>
): string {
  return text.replace(/\{\{([\w.]+)\}\}/g, (match, varPath) => {
    const value = getNestedValue(variables, varPath);

    if (value === undefined || value === null) {
      return match; // Keep placeholder if not found
    }

    // Format arrays
    if (Array.isArray(value)) {
      return formatArrayForDisplay(value);
    }

    // Format objects
    if (typeof value === 'object') {
      return formatObjectForDisplay(value);
    }

    // Convert to string
    return String(value);
  });
}
```

### Nested Value Resolution

```typescript
function getNestedValue(obj: Record<string, any>, path: string): any {
  const parts = path.split('.');
  let current: any = obj;

  for (const part of parts) {
    if (current === undefined || current === null) {
      return undefined;
    }

    // Handle array notation: items[0]
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayName, index] = arrayMatch;
      current = current[arrayName]?.[parseInt(index)];
    } else {
      current = current[part];
    }
  }

  return current;
}
```

**Examples:**

| Path | Variables | Result |
|------|-----------|--------|
| `user_name` | `{user_name: "John"}` | `"John"` |
| `user.name` | `{user: {name: "John"}}` | `"John"` |
| `items[0].name` | `{items: [{name: "A"}]}` | `"A"` |
| `product.price` | `{product: {price: 100}}` | `"100"` |
| `missing_var` | `{}` | `"{{missing_var}}"` |

---

## Dynamic Lists and Buttons

Auto-generated variables can be used to generate lists and buttons dynamically.

### Dynamic Buttons

**Configuration (uses auto-generated variable as source):**

```json
{
  "type": "question",
  "questionType": "buttons",
  "dynamicButtonsSource": "rest_api_1.data",
  "dynamicLabelField": "name"
}
```

**Context:**

```json
{
  "nodeOutputs": {
    "api-node-1": {
      "outputVariable": "rest_api_1",
      "data": [
        { "id": "opt_1", "name": "Option One" },
        { "id": "opt_2", "name": "Option Two" },
        { "id": "opt_3", "name": "Option Three" }
      ]
    }
  }
}
```

**Generated Buttons:**

```json
[
  { "id": "opt_1", "title": "Option One" },
  { "id": "opt_2", "title": "Option Two" },
  { "id": "opt_3", "title": "Option Three" }
]
```

**Max 3 buttons** - Only first 3 items from array are used.

### Dynamic Lists

**Configuration (uses auto-generated variable as source):**

```json
{
  "type": "question",
  "questionType": "list",
  "dynamicListSource": "rest_api_1.data",
  "dynamicLabelField": "name",
  "dynamicDescField": "description"
}
```

**Context:**

```json
{
  "nodeOutputs": {
    "api-node-1": {
      "outputVariable": "rest_api_1",
      "data": [
        { "id": "prod_1", "name": "Laptop", "description": "High-performance", "price": 1500 },
        { "id": "prod_2", "name": "Phone", "description": "Latest model", "price": 800 },
        { "id": "prod_3", "name": "Tablet", "description": "Portable", "price": 500 }
      ]
    }
  }
}
```

**Generated List:**

```json
{
  "sections": [
    {
      "title": "Seçenekler",
      "rows": [
        { "id": "prod_1", "title": "Laptop", "description": "High-performance" },
        { "id": "prod_2", "title": "Phone", "description": "Latest model" },
        { "id": "prod_3", "title": "Tablet", "description": "Portable" }
      ]
    }
  ]
}
```

**Field Fallbacks:**
- Label: `dynamicLabelField` → `name` → `title` → `label` → `"Item N"`
- Description: `dynamicDescField` → `description` → empty
- ID: `id` → `slug` → label value

---

## Variable Data Types

Variables can store any JSON-serializable data type:

### Primitives

```json
{
  "variables": {
    "user_name": "John Doe",           // string
    "user_age": 25,                     // number
    "is_premium": true,                 // boolean
    "coupon_code": null                 // null
  }
}
```

### Objects

```json
{
  "variables": {
    "user": {
      "id": "12345",
      "name": "John Doe",
      "email": "john@example.com",
      "address": {
        "city": "Istanbul",
        "country": "Turkey"
      }
    }
  }
}
```

### Arrays

```json
{
  "variables": {
    "cart_items": [
      { "id": "1", "name": "Laptop", "quantity": 1 },
      { "id": "2", "name": "Mouse", "quantity": 2 }
    ],
    "tags": ["electronics", "computers", "accessories"]
  }
}
```

### Complex Nested Structures

```json
{
  "variables": {
    "order": {
      "id": "ORD-12345",
      "customer": {
        "name": "John Doe",
        "phone": "+905551234567"
      },
      "items": [
        {
          "product": { "id": "1", "name": "Laptop" },
          "quantity": 1,
          "price": 1500
        }
      ],
      "total": 1500,
      "status": "pending"
    }
  }
}
```

---

## Variable Best Practices

### 1. Naming Conventions

**Use snake_case:**
```
✓ user_name
✓ order_id
✓ selected_product
✗ userName
✗ OrderID
✗ selected-product
```

**Be descriptive:**
```
✓ appointment_date
✓ selected_service
✓ customer_phone
✗ date
✗ service
✗ phone
```

### 2. Avoid Reserved Names

Don't use system variable names:
```
✗ __awaiting_variable__
✗ __awaiting_flow_response__
✗ __last_api_status__
✗ __last_api_error__
```

### 3. Initialize Variables

Before using variables in conditions, ensure they exist:

```
QUESTION → stores user_age
CONDITION → checks user_age (safe)

vs.

CONDITION → checks user_age (undefined!)
```

### 4. Handle Missing Variables

In messages, provide fallbacks:

```json
{
  "content": "Hello {{user_name}}! Your order {{order_id}} is ready."
}
```

If variables missing, result:
```
Hello {{user_name}}! Your order {{order_id}} is ready.
```

Better approach - validate first:

```
QUESTION → user_name
QUESTION → order_id
MESSAGE → Use variables (safe)
```

### 5. Variable Scope Awareness

Variables persist throughout conversation:

```
QUESTION → stores user_name
MESSAGE → uses user_name (works)
... 50 nodes later ...
MESSAGE → uses user_name (still works)
```

But they don't persist across conversations:

```
Conversation 1: user_name = "John"
Conversation 2: user_name = undefined (new context)
```

### 6. Type Consistency

Maintain consistent types for variables:

```json
// Good
{ "user_age": "25" }
{ "user_age": "30" }

// Bad
{ "user_age": "25" }
{ "user_age": 25 }  // Changed from string to number
```

Conditions may behave unexpectedly with type changes.

---

## Debugging Variables

### View Context Variables

Backend service logs context:

```typescript
this.logger.debug(`Context variables: ${JSON.stringify(context.variables)}`);
```

### Check Variable Replacement

Test variable replacement:

```
Original: "Hello {{user_name}}, your order {{order_id}} is ready"
Variables: { user_name: "John", order_id: "12345" }
Result: "Hello John, your order 12345 is ready"
```

### Condition Evaluation Logs

```
[ChatBotExecutionService] Condition evaluation: user_age gte 18 = true
[ChatBotExecutionService] Variable value: user_age = 25
```

### Common Issues

1. **Variable not found:** `{{user_name}}` remains unchanged
   - Solution: Ensure QUESTION node sets the variable first

2. **Nested path fails:** `{{user.name}}` doesn't work
   - Solution: Check object structure in context.variables

3. **Array access fails:** `{{items[0]}}` doesn't work
   - Solution: Ensure array exists and has elements

4. **Type mismatch in condition:** `age gt 18` always false
   - Solution: Check if age is stored as string vs number

---

## Variable Lifecycle

```
1. Conversation starts
   └─ context.variables = {}

2. START node executes
   └─ context.variables = {} (no change)

3. QUESTION node asks for name
   └─ context.variables = { __awaiting_variable__: "user_name" }

4. User responds "John"
   └─ context.variables = { user_name: "John" }

5. REST_API fetches data
   └─ context.variables = { user_name: "John", products: [...] }

6. CONDITION checks user_age
   └─ context.variables = { user_name: "John", products: [...], user_age: "25" }

7. MESSAGE uses variables
   └─ context.variables (unchanged, just used for replacement)

8. WHATSAPP_FLOW waits
   └─ context.variables = { ..., __awaiting_flow_response__: "form_data" }

9. Flow completes
   └─ context.variables = { ..., form_data: { date: "2025-11-30" } }

10. Conversation ends
    └─ context.variables persisted in database
```

---

## Variable Persistence

Variables are stored in PostgreSQL JSONB column:

```sql
SELECT
  id,
  conversation_id,
  variables
FROM conversation_contexts
WHERE is_active = true;
```

**Result:**

```
id                  | conversation_id     | variables
--------------------|---------------------|------------------------
uuid-123            | conv-uuid-456       | {"user_name": "John", "user_age": "25"}
```

Variables persist until:
- Conversation ends (context.isActive = false)
- Context is manually cleared
- Database is cleared

---

## Advanced Patterns

### Pattern 1: Variable Accumulation

Collect multiple pieces of information:

```
QUESTION (name) → stores user_name
QUESTION (email) → stores user_email
QUESTION (phone) → stores user_phone
REST_API → POST { name: {{user_name}}, email: {{user_email}}, phone: {{user_phone}} }
```

### Pattern 2: API Chain

Use API response in next API call:

```
REST_API 1 (Get Categories) → stores categories
QUESTION (Select Category) → stores selected_category
REST_API 2 (Get Products) → URL: /categories/{{selected_category}}/products
```

### Pattern 3: Conditional Variable Check

Validate variable before use:

```
QUESTION (Age) → stores user_age
CONDITION (user_age != "") → true path
  └─ CONDITION (user_age >= 18) → age validation
```

### Pattern 4: Variable Transformation

Use REST API to transform data:

```
QUESTION (Phone) → stores phone_raw
REST_API (Format Phone) → POST { phone: {{phone_raw}} } → stores phone_formatted
MESSAGE → "Your number: {{phone_formatted}}"
```

---

This completes the variable system reference. Variables are the backbone of dynamic chatbot flows, enabling data collection, processing, and conditional logic.
