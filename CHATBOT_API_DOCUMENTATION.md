# ChatBot API Documentation

Complete documentation for creating and managing chatbots via the WhatsApp Builder API.

## Table of Contents

1. [Overview](#overview)
2. [Base Configuration](#base-configuration)
3. [API Endpoints](#api-endpoints)
4. [ChatBot Structure](#chatbot-structure)
5. [Node Types](#node-types)
6. [Edge Structure](#edge-structure)
7. [Sessions & Execution](#sessions--execution)
8. [Complete Examples](#complete-examples)

---

## Overview

The ChatBot API allows you to create, manage, and execute conversational flows through WhatsApp. Chatbots are built using a node-based flow system where:

- **Nodes** represent individual steps (messages, questions, conditions, etc.)
- **Edges** connect nodes to define the conversation flow
- **Sessions** track active chatbot conversations with users
- **Context** stores variables and state during execution

---

## Base Configuration

**Backend Base URL**: `http://localhost:3000`

**API Prefix**: All chatbot endpoints start with `/api/chatbots`

**Request Headers**:
```
Content-Type: application/json
```

Note: Currently, there is no authentication implemented. This will be added in future versions.

---

## API Endpoints

### 1. Create ChatBot

Creates a new chatbot with nodes and edges configuration.

**Endpoint**: `POST /api/chatbots`

**Request Body**:
```typescript
{
  "name": string,              // Required: ChatBot name
  "description"?: string,      // Optional: Description
  "nodes"?: ChatBotNodeDto[],  // Optional: Array of nodes
  "edges"?: ChatBotEdgeDto[]   // Optional: Array of edges
}
```

**Response**: `201 Created`
```json
{
  "id": "uuid",
  "name": "Customer Support Bot",
  "description": "Handles customer inquiries",
  "nodes": [...],
  "edges": [...],
  "isActive": true,
  "status": "active",
  "metadata": null,
  "createdAt": "2025-11-26T10:00:00Z",
  "updatedAt": "2025-11-26T10:00:00Z"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/api/chatbots \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Welcome Bot",
    "description": "Simple welcome chatbot",
    "nodes": [
      {
        "id": "node_1",
        "type": "start",
        "position": { "x": 250, "y": 0 },
        "data": {
          "label": "Start",
          "type": "start"
        }
      }
    ],
    "edges": []
  }'
```

---

### 2. Get All ChatBots

Retrieves all chatbots with optional filtering and pagination.

**Endpoint**: `GET /api/chatbots`

**Query Parameters**:
- `search` (string): Search term to filter by name or description
- `limit` (number): Items per page (default: 50)
- `offset` (number): Number of items to skip (default: 0)
- `sortBy` (enum): Field to sort by (`name`, `createdAt`, `updatedAt`)
- `sortOrder` (enum): Sort order (`ASC`, `DESC`)
- `isActive` (boolean): Filter by active status
- `status` (enum): Filter by status (`active`, `archived`, `draft`)

**Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Support Bot",
      "description": "...",
      "nodes": [...],
      "edges": [...],
      "isActive": true,
      "status": "active",
      "createdAt": "2025-11-26T10:00:00Z",
      "updatedAt": "2025-11-26T10:00:00Z"
    }
  ],
  "total": 10,
  "limit": 50,
  "offset": 0
}
```

**cURL Example**:
```bash
curl "http://localhost:3000/api/chatbots?limit=10&sortBy=createdAt&sortOrder=DESC&isActive=true"
```

---

### 3. Get ChatBot by ID

Retrieves a specific chatbot by its UUID.

**Endpoint**: `GET /api/chatbots/:id`

**Path Parameters**:
- `id` (uuid): ChatBot UUID

**Response**: `200 OK` (ChatBot object)

**cURL Example**:
```bash
curl http://localhost:3000/api/chatbots/123e4567-e89b-12d3-a456-426614174000
```

---

### 4. Get ChatBot Statistics

Returns usage statistics for a specific chatbot.

**Endpoint**: `GET /api/chatbots/:id/stats`

**Response**: `200 OK`
```json
{
  "nodeCount": 8,
  "edgeCount": 7,
  "nodeTypes": {
    "start": 1,
    "message": 3,
    "question": 3,
    "condition": 1
  }
}
```

**cURL Example**:
```bash
curl http://localhost:3000/api/chatbots/123e4567-e89b-12d3-a456-426614174000/stats
```

---

### 5. Update ChatBot (Full)

Fully updates a chatbot configuration.

**Endpoint**: `PUT /api/chatbots/:id`

**Request Body**: Same as Create (UpdateChatBotDto)

**Response**: `200 OK` (Updated ChatBot object)

**cURL Example**:
```bash
curl -X PUT http://localhost:3000/api/chatbots/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Bot Name",
    "nodes": [...],
    "edges": [...]
  }'
```

---

### 6. Partial Update ChatBot

Partially updates specific fields of a chatbot.

**Endpoint**: `PATCH /api/chatbots/:id`

**Request Body**: Any subset of UpdateChatBotDto
```typescript
{
  "name"?: string,
  "description"?: string,
  "nodes"?: ChatBotNodeDto[],
  "edges"?: ChatBotEdgeDto[],
  "isActive"?: boolean
}
```

**Response**: `200 OK` (Updated ChatBot object)

**cURL Example**:
```bash
curl -X PATCH http://localhost:3000/api/chatbots/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{"name": "New Name"}'
```

---

### 7. Toggle Active Status

Activates this chatbot and deactivates all others (single active bot pattern).

**Endpoint**: `PATCH /api/chatbots/:id/toggle-active`

**Response**: `200 OK` (Updated ChatBot object with `isActive: true`)

**cURL Example**:
```bash
curl -X PATCH http://localhost:3000/api/chatbots/123e4567-e89b-12d3-a456-426614174000/toggle-active
```

---

### 8. Soft Delete ChatBot

Archives a chatbot without permanent deletion.

**Endpoint**: `DELETE /api/chatbots/:id/soft`

**Response**: `200 OK`
```json
{
  "id": "uuid",
  "isActive": false,
  "status": "archived",
  ...
}
```

**cURL Example**:
```bash
curl -X DELETE http://localhost:3000/api/chatbots/123e4567-e89b-12d3-a456-426614174000/soft
```

---

### 9. Restore Archived ChatBot

Restores a previously archived chatbot to active status.

**Endpoint**: `PATCH /api/chatbots/:id/restore`

**Response**: `200 OK` (Restored ChatBot with `status: "active"`)

**cURL Example**:
```bash
curl -X PATCH http://localhost:3000/api/chatbots/123e4567-e89b-12d3-a456-426614174000/restore
```

---

### 10. Delete ChatBot Permanently

Permanently deletes a chatbot from the system.

**Endpoint**: `DELETE /api/chatbots/:id`

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "ChatBot with ID {id} has been deleted"
}
```

**cURL Example**:
```bash
curl -X DELETE http://localhost:3000/api/chatbots/123e4567-e89b-12d3-a456-426614174000
```

---

### 11. Stop ChatBot Execution

Stops an active chatbot session for a specific conversation.

**Endpoint**: `POST /api/chatbots/conversations/:conversationId/stop`

**Response**: `200 OK`
```json
{
  "message": "Chatbot stopped successfully",
  "conversationId": "uuid"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/api/chatbots/conversations/123e4567-e89b-12d3-a456-426614174000/stop
```

---

### 12. Debug: Get All Active Contexts

Returns all active conversation contexts for debugging.

**Endpoint**: `GET /api/chatbots/debug/contexts`

**Response**: Array of ConversationContext objects

---

### 13. Debug: Get Context Statistics

Returns statistics about active and expired contexts.

**Endpoint**: `GET /api/chatbots/debug/contexts/stats`

**Response**: Context statistics object

---

### 14. Debug: Force Cleanup

Manually triggers cleanup of expired contexts.

**Endpoint**: `POST /api/chatbots/debug/cleanup`

**Response**: `200 OK`
```json
{
  "message": "Cleanup completed",
  "cleanedCount": 5
}
```

---

## ChatBot Structure

### ChatBot Entity

```typescript
{
  id: string;                    // UUID primary key
  name: string;                  // ChatBot name (max 255 chars)
  description?: string;          // Optional description (text)
  nodes: ChatBotNodeDto[];       // Array of flow nodes (JSONB)
  edges: ChatBotEdgeDto[];       // Array of connecting edges (JSONB)
  isActive: boolean;             // Active status (default: true)
  status: ChatBotStatus;         // active | archived | draft
  metadata?: Record<string, any>; // Optional metadata (JSONB)
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

### ChatBot Node DTO

```typescript
{
  id: string;                    // Unique node identifier
  type: NodeType;                // Node type enum (see below)
  position: {                    // Canvas position
    x: number;
    y: number;
  };
  data: NodeDataDto;             // Node-specific configuration
}
```

### ChatBot Edge DTO

```typescript
{
  source: string;                // Source node ID
  target: string;                // Target node ID
  sourceHandle?: string;         // Optional: "true" or "false" for condition nodes
}
```

---

## Node Types

There are 5 node types in the system:

### 1. START Node

Entry point of the chatbot flow. Every chatbot must have exactly one START node.

**Type**: `start`

**Data Structure**:
```typescript
{
  label: string;                 // Display label (e.g., "Start")
  type: "start";                 // Node type
}
```

**Example**:
```json
{
  "id": "node_start",
  "type": "start",
  "position": { "x": 250, "y": 0 },
  "data": {
    "label": "Start",
    "type": "start"
  }
}
```

**Execution**: Automatically proceeds to the next connected node.

---

### 2. MESSAGE Node

Sends a text message to the user without expecting a response.

**Type**: `message`

**Data Structure**:
```typescript
{
  label: string;                 // Display label
  type: "message";
  messageType: string;           // "text" (currently only text supported)
  content: string;               // Message text to send
}
```

**Example**:
```json
{
  "id": "node_welcome",
  "type": "message",
  "position": { "x": 250, "y": 100 },
  "data": {
    "label": "Welcome Message",
    "type": "message",
    "messageType": "text",
    "content": "Welcome to our service! How can I help you today?"
  }
}
```

**Execution**: Sends the message via WhatsApp and immediately proceeds to next node.

---

### 3. QUESTION Node

Asks the user a question and waits for their response. Supports 3 question types.

**Type**: `question`

**Base Data Structure**:
```typescript
{
  label: string;                 // Display label
  type: "question";
  questionType: QuestionType;    // "text" | "buttons" | "list"
  content: string;               // Question text
  variable: string;              // Variable name to store response
  headerText?: string;           // Optional header (buttons/list)
  footerText?: string;           // Optional footer (buttons/list)
  mediaHeader?: boolean;         // Include media in header (default: false)
}
```

#### 3.1 Text Question

Collects free-form text input from the user.

**Example**:
```json
{
  "id": "node_ask_name",
  "type": "question",
  "position": { "x": 250, "y": 200 },
  "data": {
    "label": "Ask Name",
    "type": "question",
    "questionType": "text",
    "content": "What is your name?",
    "variable": "user_name"
  }
}
```

**User Response**: Any text message. Stored in `context.variables.user_name`.

---

#### 3.2 Buttons Question

Presents up to 3 buttons for the user to select.

**Additional Fields**:
```typescript
{
  buttons: ButtonItemDto[];      // Max 3 buttons
}

// ButtonItemDto
{
  id: string;                    // Unique button ID
  title: string;                 // Button text (max 20 chars)
}
```

**Example**:
```json
{
  "id": "node_main_menu",
  "type": "question",
  "position": { "x": 250, "y": 220 },
  "data": {
    "label": "Main Menu",
    "type": "question",
    "questionType": "buttons",
    "content": "Please select an option:",
    "headerText": "Support Menu",
    "footerText": "WhatsApp Builder v1.0",
    "buttons": [
      { "id": "btn_tech", "title": "Technical Support" },
      { "id": "btn_price", "title": "Pricing Info" },
      { "id": "btn_other", "title": "Other" }
    ],
    "variable": "menu_selection"
  }
}
```

**User Response**: Button title (e.g., "Technical Support"). Stored in variable.

---

#### 3.3 List Question

Presents a list menu with sections and rows (better for 4+ options).

**Additional Fields**:
```typescript
{
  listButtonText: string;        // Button to open list (e.g., "View Options")
  listSections: ListSectionDto[]; // Array of sections
}

// ListSectionDto
{
  id: string;                    // Section ID
  title: string;                 // Section header
  rows: ListRowDto[];            // Section rows
}

// ListRowDto
{
  id: string;                    // Row ID
  title: string;                 // Row title
  description: string;           // Row description
}
```

**Example**:
```json
{
  "id": "node_service_list",
  "type": "question",
  "position": { "x": 400, "y": 500 },
  "data": {
    "label": "Service List",
    "type": "question",
    "questionType": "list",
    "content": "Which service would you like to know about?",
    "headerText": "Our Services",
    "footerText": "Select for details",
    "listButtonText": "View Services",
    "listSections": [
      {
        "id": "section_plans",
        "title": "Plans",
        "rows": [
          {
            "id": "row_starter",
            "title": "Starter Plan",
            "description": "Ideal for small businesses"
          },
          {
            "id": "row_pro",
            "title": "Pro Plan",
            "description": "For medium businesses"
          }
        ]
      },
      {
        "id": "section_addons",
        "title": "Add-ons",
        "rows": [
          {
            "id": "row_integration",
            "title": "API Integration",
            "description": "Connect with your systems"
          }
        ]
      }
    ],
    "variable": "service_selection"
  }
}
```

**User Response**: Row title (e.g., "Starter Plan"). Stored in variable.

---

### 4. CONDITION Node

Evaluates a condition and branches to different paths based on the result.

**Type**: `condition`

**Data Structure**:
```typescript
{
  label: string;                 // Display label
  type: "condition";
  conditionVar: string;          // Variable name to check
  conditionOp: string;           // Operator: "eq" | "ne" | "gt" | "lt" | "contains"
  conditionVal: string;          // Value to compare against
}
```

**Operators**:
- `eq`: Equals (case-insensitive)
- `ne`: Not equals
- `gt`: Greater than (numeric)
- `lt`: Less than (numeric)
- `contains`: Contains substring (case-insensitive)

**Example**:
```json
{
  "id": "node_check_selection",
  "type": "condition",
  "position": { "x": 250, "y": 380 },
  "data": {
    "label": "Check Selection",
    "type": "condition",
    "conditionVar": "menu_selection",
    "conditionOp": "eq",
    "conditionVal": "Technical Support"
  }
}
```

**Edge Routing**:
Condition nodes require two edges with different `sourceHandle` values:
- `sourceHandle: "true"` - Path when condition is true
- `sourceHandle: "false"` - Path when condition is false

**Example Edges**:
```json
[
  {
    "source": "node_check_selection",
    "target": "node_tech_support",
    "sourceHandle": "true"
  },
  {
    "source": "node_check_selection",
    "target": "node_other_help",
    "sourceHandle": "false"
  }
]
```

---

### 5. WHATSAPP_FLOW Node

Sends a WhatsApp Flow message (Meta's interactive form feature).

**Type**: `whatsapp_flow`

**Data Structure**:
```typescript
{
  label: string;                 // Display label
  type: "whatsapp_flow";
  whatsappFlowId: string;        // Flow ID from Meta
  flowMode?: string;             // "navigate" | "data_exchange" (default: "data_exchange")
  flowCta: string;               // Call-to-action button text (max 20 chars)
  flowBodyText: string;          // Flow message body
  flowHeaderText?: string;       // Optional header
  flowFooterText?: string;       // Optional footer
  flowInitialScreen?: string;    // Starting screen ID
  flowInitialData?: any;         // Initial data to pass to flow
  flowOutputVariable?: string;   // Variable to store flow response
}
```

**Example**:
```json
{
  "id": "node_appointment_flow",
  "type": "whatsapp_flow",
  "position": { "x": 250, "y": 300 },
  "data": {
    "label": "Book Appointment",
    "type": "whatsapp_flow",
    "whatsappFlowId": "1234567890",
    "flowMode": "data_exchange",
    "flowCta": "Book Now",
    "flowBodyText": "Please complete the appointment booking form",
    "flowHeaderText": "Appointment Booking",
    "flowFooterText": "Takes about 2 minutes",
    "flowInitialScreen": "WELCOME_SCREEN",
    "flowInitialData": { "user_id": "{{user_id}}" },
    "flowOutputVariable": "appointment_data"
  }
}
```

**Execution**: Sends the flow message and waits for user to complete the flow. Response is stored in the specified output variable.

---

## Edge Structure

Edges define the flow between nodes.

### Basic Edge

```typescript
{
  source: string;                // Source node ID
  target: string;                // Target node ID
}
```

**Example**:
```json
{
  "source": "node_start",
  "target": "node_welcome"
}
```

### Conditional Edge

For CONDITION nodes, use `sourceHandle` to specify which path:

```typescript
{
  source: string;                // Condition node ID
  target: string;                // Target node ID
  sourceHandle: "true" | "false" // Branch to take
}
```

**Example**:
```json
[
  {
    "source": "node_check_age",
    "target": "node_adult_path",
    "sourceHandle": "true"
  },
  {
    "source": "node_check_age",
    "target": "node_minor_path",
    "sourceHandle": "false"
  }
]
```

---

## Sessions & Execution

### How Chatbot Execution Works

1. **Trigger**: When a user sends a message to WhatsApp, the webhook creates a `Conversation`
2. **Start**: If no active session exists, `ChatBotExecutionService.startChatBot()` is called
3. **Context Creation**: A `ConversationContext` (session) is created with:
   - `conversationId`: Links to the WhatsApp conversation
   - `chatbotId`: The active chatbot
   - `currentNodeId`: Current position in flow (starts at START node)
   - `variables`: Object storing all collected data
   - `nodeHistory`: Array of visited node IDs
   - `status`: Session status (running, waiting_input, etc.)
4. **Execution Loop**: The system executes nodes sequentially based on edges
5. **User Input**: For QUESTION nodes, execution pauses until user responds
6. **Completion**: When no next node exists, session status changes to `completed`

### Session Entity (ConversationContext)

```typescript
{
  id: string;                    // Session UUID
  conversationId: string;        // WhatsApp conversation ID
  chatbotId: string;             // ChatBot being executed
  currentNodeId: string;         // Current node in flow
  variables: Record<string, any>; // Collected data from questions
  nodeHistory: string[];         // Array of visited node IDs
  isActive: boolean;             // Active flag
  status: SessionStatus;         // Session status (see below)
  expiresAt: Date | null;        // Expiration timestamp
  completedAt: Date | null;      // Completion timestamp
  completionReason: string | null; // Reason for completion
  createdAt: Date;               // Start timestamp
  updatedAt: Date;               // Last update timestamp
}
```

### Session Status Values

- `running`: Session actively executing nodes
- `waiting_input`: Waiting for user response to a QUESTION
- `waiting_flow`: Waiting for user to complete a WhatsApp Flow
- `completed`: Session finished successfully
- `expired`: Session expired (timeout)
- `stopped`: Manually stopped by user/admin

### Session API Endpoints

#### Get All Sessions

**Endpoint**: `GET /api/chatbot-sessions`

**Query Parameters**:
- `status`: Filter by status
- `chatbotId`: Filter by chatbot UUID
- `limit`: Items per page (default: 20)
- `offset`: Pagination offset
- `sortBy`: Field to sort by (createdAt, updatedAt, completedAt)
- `sortOrder`: ASC or DESC

**Response**:
```json
{
  "data": [...sessions],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

#### Get Active Sessions

**Endpoint**: `GET /api/chatbot-sessions/active`

**Response**: Array of currently active sessions

#### Get Sessions by ChatBot

**Endpoint**: `GET /api/chatbot-sessions/chatbot/:chatbotId`

**Response**: Paginated sessions for specific chatbot

#### Get Session Details

**Endpoint**: `GET /api/chatbot-sessions/:id`

**Response**: Detailed session with context and variables

#### Get Session Messages

**Endpoint**: `GET /api/chatbot-sessions/:id/messages`

**Response**: All messages associated with the session

#### Stop Session

**Endpoint**: `POST /api/chatbot-sessions/:id/stop`

**Response**: Updated session with status `stopped`

---

## Complete Examples

### Example 1: Simple Welcome Bot

A basic chatbot that greets users and asks for their name.

```json
{
  "name": "Simple Welcome Bot",
  "description": "Greets users and collects their name",
  "nodes": [
    {
      "id": "start_1",
      "type": "start",
      "position": { "x": 250, "y": 0 },
      "data": {
        "label": "Start",
        "type": "start"
      }
    },
    {
      "id": "message_1",
      "type": "message",
      "position": { "x": 250, "y": 100 },
      "data": {
        "label": "Welcome",
        "type": "message",
        "messageType": "text",
        "content": "Welcome to WhatsApp Builder! 👋"
      }
    },
    {
      "id": "question_1",
      "type": "question",
      "position": { "x": 250, "y": 220 },
      "data": {
        "label": "Ask Name",
        "type": "question",
        "questionType": "text",
        "content": "What's your name?",
        "variable": "user_name"
      }
    },
    {
      "id": "message_2",
      "type": "message",
      "position": { "x": 250, "y": 340 },
      "data": {
        "label": "Personalized Thank You",
        "type": "message",
        "messageType": "text",
        "content": "Nice to meet you, {{user_name}}! 🎉"
      }
    }
  ],
  "edges": [
    { "source": "start_1", "target": "message_1" },
    { "source": "message_1", "target": "question_1" },
    { "source": "question_1", "target": "message_2" }
  ]
}
```

**cURL**:
```bash
curl -X POST http://localhost:3000/api/chatbots \
  -H "Content-Type: application/json" \
  -d @simple-welcome-bot.json
```

---

### Example 2: Support Bot with Buttons & Conditions

Advanced bot with button menus and conditional routing.

```json
{
  "name": "Customer Support Bot",
  "description": "Handles customer inquiries with interactive buttons and conditional logic",
  "nodes": [
    {
      "id": "node_start",
      "type": "start",
      "position": { "x": 250, "y": 0 },
      "data": {
        "label": "Start",
        "type": "start"
      }
    },
    {
      "id": "node_welcome",
      "type": "message",
      "position": { "x": 250, "y": 100 },
      "data": {
        "label": "Welcome Message",
        "type": "message",
        "messageType": "text",
        "content": "Hello! Welcome to our support center. 👋"
      }
    },
    {
      "id": "node_main_menu",
      "type": "question",
      "position": { "x": 250, "y": 220 },
      "data": {
        "label": "Main Menu",
        "type": "question",
        "questionType": "buttons",
        "content": "How can we help you today?",
        "headerText": "Support Menu",
        "footerText": "Select an option below",
        "buttons": [
          { "id": "btn_tech", "title": "Technical Support" },
          { "id": "btn_billing", "title": "Billing" },
          { "id": "btn_general", "title": "General Inquiry" }
        ],
        "variable": "support_type"
      }
    },
    {
      "id": "node_check_type",
      "type": "condition",
      "position": { "x": 250, "y": 380 },
      "data": {
        "label": "Check Support Type",
        "type": "condition",
        "conditionVar": "support_type",
        "conditionOp": "eq",
        "conditionVal": "Technical Support"
      }
    },
    {
      "id": "node_tech_response",
      "type": "message",
      "position": { "x": 100, "y": 500 },
      "data": {
        "label": "Tech Support Response",
        "type": "message",
        "messageType": "text",
        "content": "Our technical team will assist you shortly. Please describe your issue."
      }
    },
    {
      "id": "node_other_response",
      "type": "message",
      "position": { "x": 400, "y": 500 },
      "data": {
        "label": "Other Response",
        "type": "message",
        "messageType": "text",
        "content": "Thank you for contacting us. An agent will be with you soon."
      }
    }
  ],
  "edges": [
    { "source": "node_start", "target": "node_welcome" },
    { "source": "node_welcome", "target": "node_main_menu" },
    { "source": "node_main_menu", "target": "node_check_type" },
    { "source": "node_check_type", "target": "node_tech_response", "sourceHandle": "true" },
    { "source": "node_check_type", "target": "node_other_response", "sourceHandle": "false" }
  ]
}
```

---

### Example 3: Service Selection with List

Bot using list menus for better organization of options.

```json
{
  "name": "Service Selection Bot",
  "description": "Presents service options using WhatsApp list menus",
  "nodes": [
    {
      "id": "start_1",
      "type": "start",
      "position": { "x": 250, "y": 0 },
      "data": {
        "label": "Start",
        "type": "start"
      }
    },
    {
      "id": "msg_1",
      "type": "message",
      "position": { "x": 250, "y": 100 },
      "data": {
        "label": "Greeting",
        "type": "message",
        "messageType": "text",
        "content": "Welcome to our service catalog! 🎯"
      }
    },
    {
      "id": "list_1",
      "type": "question",
      "position": { "x": 250, "y": 220 },
      "data": {
        "label": "Service List",
        "type": "question",
        "questionType": "list",
        "content": "Which service interests you?",
        "headerText": "Our Services",
        "footerText": "Tap to view all options",
        "listButtonText": "View Services",
        "listSections": [
          {
            "id": "section_plans",
            "title": "Subscription Plans",
            "rows": [
              {
                "id": "row_starter",
                "title": "Starter Plan",
                "description": "Perfect for individuals - $9/month"
              },
              {
                "id": "row_pro",
                "title": "Pro Plan",
                "description": "For teams - $29/month"
              },
              {
                "id": "row_enterprise",
                "title": "Enterprise",
                "description": "Custom solutions - Contact us"
              }
            ]
          },
          {
            "id": "section_addons",
            "title": "Add-on Services",
            "rows": [
              {
                "id": "row_support",
                "title": "Priority Support",
                "description": "24/7 dedicated support - $99/month"
              },
              {
                "id": "row_training",
                "title": "Training",
                "description": "Team onboarding sessions"
              }
            ]
          }
        ],
        "variable": "selected_service"
      }
    },
    {
      "id": "msg_2",
      "type": "message",
      "position": { "x": 250, "y": 380 },
      "data": {
        "label": "Confirmation",
        "type": "message",
        "messageType": "text",
        "content": "Great choice! You selected: {{selected_service}}. Our team will send you more details shortly."
      }
    }
  ],
  "edges": [
    { "source": "start_1", "target": "msg_1" },
    { "source": "msg_1", "target": "list_1" },
    { "source": "list_1", "target": "msg_2" }
  ]
}
```

---

### Example 4: Multi-Condition Flow

Complex bot with multiple conditions and branching paths.

```json
{
  "name": "Age Verification Bot",
  "description": "Collects age and routes based on multiple conditions",
  "nodes": [
    {
      "id": "start",
      "type": "start",
      "position": { "x": 250, "y": 0 },
      "data": { "label": "Start", "type": "start" }
    },
    {
      "id": "ask_age",
      "type": "question",
      "position": { "x": 250, "y": 100 },
      "data": {
        "label": "Ask Age",
        "type": "question",
        "questionType": "text",
        "content": "Please enter your age:",
        "variable": "user_age"
      }
    },
    {
      "id": "check_adult",
      "type": "condition",
      "position": { "x": 250, "y": 220 },
      "data": {
        "label": "Check if Adult",
        "type": "condition",
        "conditionVar": "user_age",
        "conditionOp": "gt",
        "conditionVal": "17"
      }
    },
    {
      "id": "check_senior",
      "type": "condition",
      "position": { "x": 400, "y": 340 },
      "data": {
        "label": "Check if Senior",
        "type": "condition",
        "conditionVar": "user_age",
        "conditionOp": "gt",
        "conditionVal": "64"
      }
    },
    {
      "id": "minor_msg",
      "type": "message",
      "position": { "x": 100, "y": 340 },
      "data": {
        "label": "Minor Message",
        "type": "message",
        "messageType": "text",
        "content": "You must be 18 or older to continue."
      }
    },
    {
      "id": "adult_msg",
      "type": "message",
      "position": { "x": 250, "y": 460 },
      "data": {
        "label": "Adult Message",
        "type": "message",
        "messageType": "text",
        "content": "Welcome! You qualify for our standard services."
      }
    },
    {
      "id": "senior_msg",
      "type": "message",
      "position": { "x": 550, "y": 460 },
      "data": {
        "label": "Senior Message",
        "type": "message",
        "messageType": "text",
        "content": "Welcome! You qualify for our senior discount program! 🎉"
      }
    }
  ],
  "edges": [
    { "source": "start", "target": "ask_age" },
    { "source": "ask_age", "target": "check_adult" },
    { "source": "check_adult", "target": "minor_msg", "sourceHandle": "false" },
    { "source": "check_adult", "target": "check_senior", "sourceHandle": "true" },
    { "source": "check_senior", "target": "adult_msg", "sourceHandle": "false" },
    { "source": "check_senior", "target": "senior_msg", "sourceHandle": "true" }
  ]
}
```

---

## Important Notes

### Flow Design Best Practices

1. **Start Node**: Every chatbot MUST have exactly one START node
2. **Node IDs**: Must be unique within a chatbot
3. **Variables**: Use descriptive names (e.g., `user_name`, `selected_option`)
4. **Variable Interpolation**: Use `{{variable_name}}` in message content to insert variable values
5. **Condition Nodes**: Must have exactly 2 outgoing edges (true/false)
6. **Button Limits**: WhatsApp allows max 3 buttons
7. **Button Text Length**: Max 20 characters per button
8. **List Sections**: Organize related options into sections for better UX
9. **Flow Completion**: Flows end when there's no next node (ensure intentional endpoints)

### Active ChatBot Pattern

The system uses a "single active chatbot" pattern:
- Only ONE chatbot can be active (`isActive: true`) at a time
- Use `PATCH /api/chatbots/:id/toggle-active` to switch active bots
- This endpoint automatically deactivates all other bots
- Incoming WhatsApp messages trigger the currently active chatbot

### Sessions & Cleanup

- Sessions expire after 24 hours of inactivity (WhatsApp messaging window)
- Expired sessions are automatically cleaned up via cron job
- Use `/api/chatbot-sessions/:id/stop` to manually stop stuck sessions
- Debug endpoints help monitor and troubleshoot active contexts

### Variable Storage

Variables are stored in `ConversationContext.variables` as key-value pairs:
```json
{
  "user_name": "John Doe",
  "menu_selection": "Technical Support",
  "user_age": "25",
  "service_selection": "Pro Plan"
}
```

All values are stored as strings. Use condition operators (`gt`, `lt`) for numeric comparisons.

### Error Handling

- Invalid node references will cause execution to stop
- Missing START node prevents chatbot from starting
- Validation errors return `400 Bad Request` with details
- Not found errors return `404 Not Found`

---

## Quick Reference

### Node Types Summary

| Type | Purpose | Waits for User? |
|------|---------|-----------------|
| `start` | Entry point | No |
| `message` | Send text message | No |
| `question` (text) | Collect free text | Yes |
| `question` (buttons) | Present 1-3 buttons | Yes |
| `question` (list) | Present multi-section list | Yes |
| `condition` | Evaluate and branch | No |
| `whatsapp_flow` | Send WhatsApp Flow | Yes |

### Condition Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equals (case-insensitive) | `"age" eq "25"` |
| `ne` | Not equals | `"status" ne "pending"` |
| `gt` | Greater than | `"age" gt "17"` |
| `lt` | Less than | `"price" lt "100"` |
| `contains` | Contains substring | `"message" contains "help"` |

### HTTP Status Codes

- `200 OK`: Successful GET/PUT/PATCH/DELETE
- `201 Created`: Successful POST (create)
- `400 Bad Request`: Validation error
- `404 Not Found`: Resource not found

---

## Support & Resources

- Backend Source: `/home/ali/whatsapp-builder/backend/src/modules/chatbots/`
- Entity Definitions: `/home/ali/whatsapp-builder/backend/src/entities/`
- DTO Schemas: `/home/ali/whatsapp-builder/backend/src/modules/chatbots/dto/`

For more information on WhatsApp Flow integration, see the `whatsapp_flow` node documentation above and Meta's official WhatsApp Flows API documentation.

---

**Last Updated**: 2025-11-26
