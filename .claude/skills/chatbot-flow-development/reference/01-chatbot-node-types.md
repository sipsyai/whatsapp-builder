# Chatbot Node Types Reference

This document provides comprehensive documentation for all node types available in the WhatsApp Builder chatbot flow system.

## Overview

The chatbot flow system supports **6 node types** that can be connected to create conversational flows:

1. **START** - Flow entry point
2. **MESSAGE** - Send text messages
3. **QUESTION** - Collect user input (text, buttons, lists)
4. **CONDITION** - Branch based on variable conditions
5. **WHATSAPP_FLOW** - Launch WhatsApp Forms/Flows
6. **REST_API** - Make HTTP requests to external APIs

## Node Type Enum

```typescript
enum NodeDataType {
  START = 'start',
  MESSAGE = 'message',
  QUESTION = 'question',
  CONDITION = 'condition',
  WHATSAPP_FLOW = 'whatsapp_flow',
  REST_API = 'rest_api',
}
```

---

## 1. START Node

**Purpose:** Entry point for every chatbot flow. Every flow must have exactly one START node.

**Behavior:**
- Does not send any message to the user
- Immediately executes the next connected node
- Cannot have incoming connections
- Must have exactly one outgoing connection

**Node Structure:**

```json
{
  "id": "node-uuid-1",
  "type": "start",
  "data": {
    "type": "start",
    "label": "Start"
  },
  "position": { "x": 100, "y": 100 }
}
```

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique node identifier (UUID) |
| `type` | string | Yes | Must be "start" |
| `data.type` | enum | Yes | NodeDataType.START |
| `data.label` | string | Yes | Display label (typically "Start") |

**Execution Flow:**
1. Bot loads START node when conversation begins
2. START node is added to `nodeHistory`
3. Immediately moves to next connected node
4. Recursive execution continues

**Common Patterns:**
- Always the first node in a flow
- Typically connected to a MESSAGE or QUESTION node
- No configuration UI needed

---

## 2. MESSAGE Node

**Purpose:** Send a one-way text message to the user without expecting a response.

**Behavior:**
- Sends text message via WhatsApp Text API
- Supports variable replacement with `{{variable}}` syntax
- Automatically moves to next node after sending
- Does not wait for user response

**Node Structure:**

```json
{
  "id": "node-uuid-2",
  "type": "message",
  "data": {
    "type": "message",
    "label": "Welcome Message",
    "content": "Hello {{user.name}}! Welcome to our service.",
    "messageType": "text"
  },
  "position": { "x": 300, "y": 100 }
}
```

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `data.label` | string | Yes | Display name in builder |
| `data.content` | string | Yes | Message text to send |
| `data.messageType` | string | No | Always "text" (future: image, document) |

**Variable Replacement:**

Messages support dynamic content using `{{variableName}}` syntax:

```json
{
  "content": "Hello {{user_name}}! Your order #{{order_id}} is ready."
}
```

Variables are replaced from the conversation context before sending. If a variable is not found, the placeholder remains unchanged.

**Nested Variable Access:**

```json
{
  "content": "Product: {{product.name}}, Price: {{product.price}} TL"
}
```

**Array Access:**

```json
{
  "content": "First item: {{items[0].name}}"
}
```

**Execution Flow:**
1. Load message content from node data
2. Replace all `{{variables}}` with values from context
3. Send text message via WhatsApp API
4. Save message to database
5. Move to next connected node (no waiting)

**Common Patterns:**
- Welcome messages after START
- Confirmation messages after user actions
- Information delivery before QUESTION nodes

---

## 3. QUESTION Node

**Purpose:** Collect user input with three different interaction types: free text, buttons, or interactive lists.

**Behavior:**
- Sends a message and **WAITS** for user response
- User response is stored in specified variable
- Supports three question types: TEXT, BUTTONS, LIST
- Context status changes to `waiting_input`
- Execution pauses until user responds

**Question Types Enum:**

```typescript
enum QuestionType {
  TEXT = 'text',      // Free text input
  BUTTONS = 'buttons', // Up to 3 buttons
  LIST = 'list',      // Interactive list with sections
}
```

### 3.1. TEXT Question

**Purpose:** Allow free-form text input from user.

**Node Structure:**

```json
{
  "id": "node-uuid-3",
  "type": "question",
  "data": {
    "type": "question",
    "label": "Ask Name",
    "content": "What is your name?",
    "questionType": "text",
    "variable": "user_name"
  }
}
```

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `data.content` | string | Yes | Question text |
| `data.questionType` | enum | Yes | "text" |
| `data.variable` | string | Yes | Variable name to store response |
| `data.headerText` | string | No | Not used for text questions |
| `data.footerText` | string | No | Not used for text questions |

**Behavior:**
- Sends plain text message via WhatsApp
- User can reply with any text
- Response stored in `context.variables[variable]`
- Moves to next node after response received

### 3.2. BUTTONS Question

**Purpose:** Present up to 3 buttons for user selection.

**Node Structure:**

```json
{
  "id": "node-uuid-4",
  "type": "question",
  "data": {
    "type": "question",
    "label": "Select Service",
    "content": "Which service do you need?",
    "questionType": "buttons",
    "variable": "selected_service",
    "headerText": "Service Selection",
    "footerText": "Choose one option",
    "buttons": [
      { "id": "btn_haircut", "title": "Haircut" },
      { "id": "btn_coloring", "title": "Hair Coloring" },
      { "id": "btn_styling", "title": "Styling" }
    ]
  }
}
```

**Button Item Structure:**

```typescript
interface ButtonItem {
  id: string;      // Unique ID (max 256 chars)
  title: string;   // Display text (max 20 chars)
}
```

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `data.buttons` | ButtonItem[] | Yes | Array of 1-3 buttons |
| `data.headerText` | string | No | Optional header (max 60 chars) |
| `data.footerText` | string | No | Optional footer (max 60 chars) |

**Routing:**
- Each button creates a sourceHandle with `id` value
- Edge `sourceHandle` must match button `id` to route correctly
- Example: Button with `id: "btn_haircut"` → Edge with `sourceHandle: "btn_haircut"`

**Dynamic Buttons:**

Buttons can be generated from a variable containing an array:

```json
{
  "data": {
    "questionType": "buttons",
    "variable": "selected_category",
    "dynamicButtonsSource": "categories",
    "dynamicLabelField": "name"
  }
}
```

If `context.variables.categories = [{id: "1", name: "Electronics"}, {id: "2", name: "Books"}]`, buttons are auto-generated.

### 3.3. LIST Question

**Purpose:** Present multiple options organized in sections with up to 10 total rows.

**Node Structure:**

```json
{
  "id": "node-uuid-5",
  "type": "question",
  "data": {
    "type": "question",
    "label": "Select Product",
    "content": "Choose a product from our catalog",
    "questionType": "list",
    "variable": "selected_product",
    "listButtonText": "View Products",
    "headerText": "Product Catalog",
    "footerText": "Tap to see options",
    "listSections": [
      {
        "title": "Electronics",
        "rows": [
          {
            "id": "prod_laptop",
            "title": "Laptop",
            "description": "High-performance laptop"
          },
          {
            "id": "prod_phone",
            "title": "Smartphone",
            "description": "Latest model"
          }
        ]
      },
      {
        "title": "Books",
        "rows": [
          {
            "id": "prod_book1",
            "title": "The Great Novel",
            "description": "Bestseller"
          }
        ]
      }
    ]
  }
}
```

**List Section Structure:**

```typescript
interface ListSection {
  title: string;      // Section title (max 24 chars)
  rows: ListRow[];    // 1-10 rows total across all sections
}

interface ListRow {
  id: string;         // Unique ID (max 200 chars)
  title: string;      // Display title (max 24 chars)
  description?: string; // Optional description (max 72 chars)
}
```

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `data.listSections` | ListSection[] | Yes | Array of sections |
| `data.listButtonText` | string | Yes | Button text to open list (max 20 chars) |
| `data.headerText` | string | No | Optional header |
| `data.footerText` | string | No | Optional footer |

**Routing:**
- Each row creates a sourceHandle with `id` value
- Edge `sourceHandle` must match row `id`
- Example: Row with `id: "prod_laptop"` → Edge with `sourceHandle: "prod_laptop"`

**Dynamic Lists with Pagination:**

Lists can be generated from variables and support pagination:

```json
{
  "data": {
    "questionType": "list",
    "variable": "selected_item",
    "dynamicListSource": "items",
    "dynamicLabelField": "name",
    "dynamicDescField": "description"
  }
}
```

- Shows 8 items per page (leaves room for navigation)
- Automatically adds "Onceki Sayfa" and "Sonraki Sayfa" buttons
- Page state stored in `context.variables[dynamicListSource + "_page"]`
- Navigation buttons have special IDs: `__PAGE_PREV__2`, `__PAGE_NEXT__3`

**Fallback Behavior:**

If `buttons` array is empty or `listSections` have no rows, the system automatically falls back to text input with a message: "(Lütfen seçiminizi yazarak belirtin)".

---

## 4. CONDITION Node

**Purpose:** Branch flow execution based on variable value comparisons.

**Behavior:**
- Evaluates a condition: `variable operator value`
- Routes to "true" or "false" path based on result
- Does not send any message
- Executes immediately (no waiting)

**Node Structure:**

```json
{
  "id": "node-uuid-6",
  "type": "condition",
  "data": {
    "type": "condition",
    "label": "Check Age",
    "conditionVar": "user_age",
    "conditionOp": "gte",
    "conditionVal": "18"
  }
}
```

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `data.conditionVar` | string | Yes | Variable name to check |
| `data.conditionOp` | string | Yes | Comparison operator |
| `data.conditionVal` | string | Yes | Value to compare against |

**Supported Operators:**

| Operator | Aliases | Description | Example |
|----------|---------|-------------|---------|
| `eq` | `==`, `equals` | Equal to | `age eq 18` |
| `ne` | `!=`, `not_equals` | Not equal to | `status ne active` |
| `gt` | `>`, `greater` | Greater than | `price gt 100` |
| `lt` | `<`, `less` | Less than | `stock lt 5` |
| `gte` | `>=`, `greater_or_equal` | Greater than or equal | `age gte 18` |
| `lte` | `<=`, `less_or_equal` | Less than or equal | `score lte 50` |
| `contains` | - | String contains (case-insensitive) | `message contains hello` |
| `not_contains` | - | String does not contain | `status not_contains pending` |

**Type Coercion:**
- String comparisons: `eq`, `ne`, `contains`, `not_contains`
- Numeric comparisons: `gt`, `lt`, `gte`, `lte` (values converted to Number)
- Case-insensitive: `contains`, `not_contains`

**Routing:**
- Always has two outgoing paths
- True path: Edge with `sourceHandle: "true"`
- False path: Edge with `sourceHandle: "false"`

**Example Conditions:**

```json
// Check if user is adult
{ "conditionVar": "age", "conditionOp": "gte", "conditionVal": "18" }

// Check if product in stock
{ "conditionVar": "stock", "conditionOp": "gt", "conditionVal": "0" }

// Check if user said yes
{ "conditionVar": "response", "conditionOp": "contains", "conditionVal": "yes" }
```

---

## 5. WHATSAPP_FLOW Node

**Purpose:** Launch a WhatsApp Flow (interactive form) and wait for completion.

**Behavior:**
- Sends WhatsApp Flow message with CTA button
- Context status changes to `waiting_flow`
- Execution pauses until user completes flow
- Flow response stored in specified variable
- 10-minute timeout for flow completion

**Node Structure:**

```json
{
  "id": "node-uuid-7",
  "type": "whatsapp_flow",
  "data": {
    "type": "whatsapp_flow",
    "label": "Appointment Form",
    "whatsappFlowId": "836194732500069",
    "flowMode": "data_exchange",
    "flowCta": "Book Now",
    "flowBodyText": "Please complete the appointment form",
    "flowHeaderText": "Salon Appointment",
    "flowFooterText": "Takes 2 minutes",
    "flowInitialScreen": "WELCOME",
    "flowInitialData": {
      "user_id": "{{user_id}}",
      "preselected_date": "{{preferred_date}}"
    },
    "flowOutputVariable": "appointment_data"
  }
}
```

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `data.whatsappFlowId` | string | Yes | WhatsApp Flow ID from Meta |
| `data.flowMode` | enum | No | "navigate" or "data_exchange" (default: "navigate") |
| `data.flowCta` | string | No | Button text (max 20 chars, default: "Start") |
| `data.flowBodyText` | string | No | Message body text |
| `data.flowHeaderText` | string | No | Optional header |
| `data.flowFooterText` | string | No | Optional footer |
| `data.flowInitialScreen` | string | No | Starting screen ID |
| `data.flowInitialData` | object | No | Initial data passed to flow |
| `data.flowOutputVariable` | string | No | Variable to store flow response |

**Flow Modes:**

- **navigate:** User browses through flow screens, no data returned
- **data_exchange:** Flow collects data and returns it on completion

**Initial Data:**

Supports variable replacement in JSON:

```json
{
  "flowInitialData": {
    "user_name": "{{user_name}}",
    "phone": "{{phone_number}}",
    "items": "{{cart_items}}"
  }
}
```

**Flow Token:**

System generates a flow token: `{contextId}-{nodeId}` to track flow completion.

**Execution Flow:**
1. Load flow from database by `whatsappFlowId`
2. Replace variables in `flowInitialData`
3. Send flow message via WhatsApp API
4. Save `flowOutputVariable` name to `context.variables.__awaiting_flow_response__`
5. Set `context.expiresAt` to 10 minutes from now
6. Set `context.status = "waiting_flow"`
7. Wait for flow completion webhook
8. Store flow response in `flowOutputVariable`
9. Move to next node

**Error Handling:**

If flow send fails:
- Error stored in `context.variables.__last_api_error__`
- Routes to edge with `sourceHandle: "error"` if exists
- Otherwise routes to default edge
- If no edge, chatbot ends

---

## 6. REST_API Node

**Purpose:** Make HTTP requests to external APIs and store responses.

**Behavior:**
- Makes HTTP request (GET, POST, PUT, DELETE)
- Supports variable replacement in URL, headers, and body
- Stores response in specified variable
- Routes to "success" or "error" path based on HTTP status
- Executes immediately (no waiting)

**Node Structure:**

```json
{
  "id": "node-uuid-8",
  "type": "rest_api",
  "data": {
    "type": "rest_api",
    "label": "Fetch Products",
    "apiUrl": "http://192.168.1.18:1337/api/products?category={{category}}",
    "apiMethod": "GET",
    "apiHeaders": {
      "Authorization": "Bearer {{api_token}}",
      "Content-Type": "application/json"
    },
    "apiBody": "",
    "apiOutputVariable": "products",
    "apiResponsePath": "data",
    "apiErrorVariable": "api_error",
    "apiTimeout": 30000
  }
}
```

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `data.apiUrl` | string | Yes | Full URL (supports {{variables}}) |
| `data.apiMethod` | enum | No | GET, POST, PUT, DELETE (default: GET) |
| `data.apiHeaders` | object | No | Request headers (supports {{variables}}) |
| `data.apiBody` | string | No | Request body JSON string |
| `data.apiOutputVariable` | string | No | Variable to store response |
| `data.apiResponsePath` | string | No | JSON path to extract (e.g., "data") |
| `data.apiErrorVariable` | string | No | Variable to store error message |
| `data.apiTimeout` | number | No | Timeout in ms (default: 30000) |

**Variable Replacement:**

All fields support `{{variable}}` syntax:

```json
{
  "apiUrl": "https://api.example.com/users/{{user_id}}/orders",
  "apiHeaders": {
    "Authorization": "Bearer {{access_token}}"
  },
  "apiBody": "{\"product_id\": \"{{product_id}}\", \"quantity\": {{quantity}}}"
}
```

**Response Path Extraction:**

If API returns:

```json
{
  "status": "success",
  "data": [
    { "id": "1", "name": "Product A" },
    { "id": "2", "name": "Product B" }
  ]
}
```

With `apiResponsePath: "data"`, only the array is stored in the variable.

**Math Expressions in Body:**

The API body supports basic math operations:

```json
{
  "apiBody": "{\"total\": {{price}} * {{quantity}}}"
}
```

**Routing:**

- Success path: Edge with `sourceHandle: "success"`
- Error path: Edge with `sourceHandle: "error"`
- If no specific handle, uses default edge

**System Variables:**

After execution, these are set:

- `__last_api_status__`: HTTP status code (200, 404, 500, etc.)
- `__last_api_error__`: Error message if request failed

**Execution Flow:**
1. Replace variables in URL, headers, body
2. Make HTTP request with timeout
3. If successful:
   - Extract response using `apiResponsePath`
   - Store in `apiOutputVariable`
   - Set `__last_api_status__`
   - Route to "success" path
4. If error:
   - Store error in `apiErrorVariable`
   - Set `__last_api_error__`
   - Route to "error" path
5. Move to next connected node

**Common Patterns:**
- Fetch data before showing dynamic lists
- POST user responses to external systems
- Validate user input via external APIs
- Check stock availability before proceeding

---

## Node Connections

All nodes (except START) have:
- **Input handle (target):** Left side, accepts incoming edges
- **Output handles (source):** Right side, one or more based on node type

**Handle Summary:**

| Node Type | Input | Output Handles |
|-----------|-------|----------------|
| START | No | 1 (default) |
| MESSAGE | Yes | 1 (default) |
| QUESTION (text) | Yes | 1 (default) |
| QUESTION (buttons) | Yes | 1 per button + "default" |
| QUESTION (list) | Yes | 1 per row + "default" |
| CONDITION | Yes | 2 ("true", "false") |
| WHATSAPP_FLOW | Yes | 1 (default) + optional "error" |
| REST_API | Yes | 2 ("success", "error") |

---

## Common Configuration Patterns

### Welcome Flow

```
START → MESSAGE (Welcome) → QUESTION (Ask Name) → MESSAGE (Thank You)
```

### Conditional Routing

```
QUESTION (Age) → CONDITION (age >= 18)
  ├─ true → MESSAGE (Adult Content)
  └─ false → MESSAGE (Sorry, Adult Only)
```

### API Integration

```
QUESTION (Category) → REST_API (Fetch Products)
  ├─ success → QUESTION (Select Product)
  └─ error → MESSAGE (Error Occurred)
```

### Form Collection

```
MESSAGE (Welcome) → WHATSAPP_FLOW (Appointment Form) → MESSAGE (Confirmation)
```

### Dynamic Lists

```
REST_API (Get Categories) → QUESTION (Select Category, dynamic list) → REST_API (Get Products)
```

---

## Best Practices

1. **Always start with START node:** Every flow must have exactly one START node
2. **Variable naming:** Use snake_case for consistency (e.g., `user_name`, `selected_product`)
3. **Message content:** Keep under 1000 characters for WhatsApp compatibility
4. **Button titles:** Max 20 characters
5. **List titles:** Max 24 characters
6. **List descriptions:** Max 72 characters
7. **Error handling:** Always provide "error" paths for REST_API and WHATSAPP_FLOW nodes
8. **Timeout awareness:** WhatsApp Flow has 10-minute timeout, plan accordingly
9. **Variable validation:** Use CONDITION nodes to validate user input before API calls
10. **Default routing:** Always provide a "default" edge for QUESTION nodes in case user types instead of clicking

---

## Debugging Tips

- Check `context.variables` for stored values
- Review `context.nodeHistory` to see execution path
- Monitor `context.status` for waiting states
- System variables (`__awaiting_variable__`, `__awaiting_flow_response__`) indicate waiting states
- `__last_api_status__` and `__last_api_error__` help debug REST_API nodes
