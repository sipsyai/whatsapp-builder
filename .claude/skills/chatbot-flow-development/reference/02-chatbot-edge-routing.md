# Chatbot Edge Routing Reference

This document explains how edges (connections) work in the WhatsApp Builder chatbot flow system, including routing logic for different node types.

## Overview

Edges connect nodes and determine the execution path through a chatbot flow. The routing mechanism uses **source handles** to determine which path to follow when multiple options exist.

## Edge Structure

### Basic Edge Schema

```typescript
interface Edge {
  id: string;              // Unique edge identifier
  source: string;          // Source node ID
  target: string;          // Target node ID
  sourceHandle?: string;   // Optional: which output handle to use
  targetHandle?: string;   // Optional: which input handle (usually null)
  type?: string;           // Edge type (e.g., "default", "smoothstep")
}
```

### Example Edge

```json
{
  "id": "edge-uuid-1",
  "source": "node-question-1",
  "target": "node-message-2",
  "sourceHandle": "btn_yes",
  "type": "smoothstep"
}
```

## Source Handle Routing

The `sourceHandle` property determines which output path from a node is taken. Different node types use different handle values.

### Routing Logic Priority

When finding the next node, the system follows this priority:

1. **Exact sourceHandle match**: Edge where `sourceHandle` equals specified value
2. **Default handle**: Edge with `sourceHandle: "default"` or `sourceHandle: null`
3. **No edge found**: Flow ends, chatbot marks context as completed

## Node-Specific Routing

### 1. START Node Routing

**Handles:** 1 output (no sourceHandle needed)

```json
{
  "source": "start-node-id",
  "target": "next-node-id",
  "sourceHandle": null
}
```

**Routing Logic:**
- START node always has single default edge
- No sourceHandle specification needed
- Always routes to the one connected node

**Diagram:**

```
┌──────────┐
│  START   │
└────┬─────┘
     │ (default)
     ↓
┌──────────┐
│ MESSAGE  │
└──────────┘
```

---

### 2. MESSAGE Node Routing

**Handles:** 1 output (no sourceHandle needed)

```json
{
  "source": "message-node-id",
  "target": "next-node-id",
  "sourceHandle": null
}
```

**Routing Logic:**
- MESSAGE node always has single default edge
- Automatically proceeds to next node after sending message
- No branching logic

**Diagram:**

```
┌──────────┐
│ MESSAGE  │
│ "Hello"  │
└────┬─────┘
     │ (default)
     ↓
┌──────────┐
│ QUESTION │
└──────────┘
```

---

### 3. QUESTION Node Routing

Question nodes have different routing based on question type.

#### 3.1. TEXT Question Routing

**Handles:** 1 output (no sourceHandle needed)

```json
{
  "source": "question-text-id",
  "target": "next-node-id",
  "sourceHandle": null
}
```

**Routing Logic:**
- Single default path regardless of user response
- User's text stored in variable
- Always follows default edge

**Diagram:**

```
┌──────────────┐
│  QUESTION    │
│  (text)      │
│ "Your name?" │
└──────┬───────┘
       │ (default)
       ↓
┌──────────────┐
│   MESSAGE    │
└──────────────┘
```

#### 3.2. BUTTONS Question Routing

**Handles:** 1 per button + 1 default

Each button creates a unique sourceHandle using its `id` property.

**Button Definition:**

```json
{
  "buttons": [
    { "id": "btn_yes", "title": "Yes" },
    { "id": "btn_no", "title": "No" },
    { "id": "btn_maybe", "title": "Maybe" }
  ]
}
```

**Edge Configuration:**

```json
[
  {
    "source": "question-buttons-id",
    "target": "confirm-message-id",
    "sourceHandle": "btn_yes"
  },
  {
    "source": "question-buttons-id",
    "target": "decline-message-id",
    "sourceHandle": "btn_no"
  },
  {
    "source": "question-buttons-id",
    "target": "unsure-message-id",
    "sourceHandle": "btn_maybe"
  },
  {
    "source": "question-buttons-id",
    "target": "default-message-id",
    "sourceHandle": "default"
  }
]
```

**Routing Logic:**

1. User clicks button with `id: "btn_yes"` → Routes to edge with `sourceHandle: "btn_yes"`
2. User types text instead of clicking → Routes to edge with `sourceHandle: "default"`
3. No matching handle found → Routes to default edge (no sourceHandle or "default")

**Diagram:**

```
                     ┌──────────────┐
            ┌───────→│  Confirm Msg │
            │        └──────────────┘
            │ btn_yes
┌───────────┴─────┐
│   QUESTION      │
│   (buttons)     │  btn_no
│ "Confirm?"      ├──────→┌──────────────┐
│                 │       │  Decline Msg │
│ [Yes] [No]      │       └──────────────┘
│ [Maybe]         │
└───────────┬─────┘
            │ btn_maybe
            └──────→┌──────────────┐
                    │  Unsure Msg  │
                    └──────────────┘

            (default) → If user types text
```

**Important Notes:**

- Button `id` must be unique and max 256 characters
- Button `title` is display text (max 20 chars), `id` is for routing
- Always provide a "default" edge for text input fallback
- If user types instead of clicking, system uses "default" handle

#### 3.3. LIST Question Routing

**Handles:** 1 per list row + 1 default

Each list row creates a unique sourceHandle using its `id` property.

**List Definition:**

```json
{
  "listSections": [
    {
      "title": "Services",
      "rows": [
        { "id": "svc_haircut", "title": "Haircut", "description": "30 min" },
        { "id": "svc_coloring", "title": "Coloring", "description": "90 min" },
        { "id": "svc_styling", "title": "Styling", "description": "45 min" }
      ]
    }
  ]
}
```

**Edge Configuration:**

```json
[
  {
    "source": "question-list-id",
    "target": "haircut-flow-id",
    "sourceHandle": "svc_haircut"
  },
  {
    "source": "question-list-id",
    "target": "coloring-flow-id",
    "sourceHandle": "svc_coloring"
  },
  {
    "source": "question-list-id",
    "target": "styling-flow-id",
    "sourceHandle": "svc_styling"
  },
  {
    "source": "question-list-id",
    "target": "default-message-id",
    "sourceHandle": "default"
  }
]
```

**Routing Logic:**

1. User selects row with `id: "svc_haircut"` → Routes to edge with `sourceHandle: "svc_haircut"`
2. User types text instead of selecting → Routes to edge with `sourceHandle: "default"`
3. No matching handle found → Routes to default edge

**Pagination Navigation:**

Dynamic lists with pagination add special navigation rows:

```json
{
  "rows": [
    { "id": "item_1", "title": "Item 1" },
    { "id": "item_2", "title": "Item 2" },
    // ... 6 more items
    { "id": "__PAGE_PREV__1", "title": "Onceki Sayfa", "description": "Sayfa 1/5" },
    { "id": "__PAGE_NEXT__3", "title": "Sonraki Sayfa", "description": "Sayfa 3/5" }
  ]
}
```

**Pagination Routing Logic:**

1. User selects `__PAGE_PREV__1` or `__PAGE_NEXT__3`
2. System detects special ID pattern: `__PAGE_(PREV|NEXT)__(\d+)`
3. Updates page variable: `context.variables[dynamicListSource + "_page"] = 1` or `3`
4. Re-executes CURRENT node (shows new page)
5. Does NOT move to next node
6. User response is NOT stored in variable

**Diagram:**

```
                     ┌──────────────┐
            ┌───────→│ Haircut Flow │
            │        └──────────────┘
            │ svc_haircut
┌───────────┴─────┐
│   QUESTION      │
│   (list)        │  svc_coloring
│ "Select Service"├──────→┌──────────────┐
│                 │       │ Coloring Flow│
│ [Haircut]       │       └──────────────┘
│ [Coloring]      │
│ [Styling]       │
└───────────┬─────┘
            │ svc_styling
            └──────→┌──────────────┐
                    │ Styling Flow │
                    └──────────────┘

            __PAGE_PREV__1 → Re-execute current node (page 1)
            __PAGE_NEXT__3 → Re-execute current node (page 3)
            (default) → If user types text
```

**Important Notes:**

- List row `id` must be unique and max 200 characters
- Row `title` max 24 chars, `description` max 72 chars
- Total rows across all sections: max 10 (WhatsApp limit)
- Pagination automatically manages 8 items + 2 navigation buttons
- Always provide "default" edge for text input fallback

---

### 4. CONDITION Node Routing

**Handles:** 2 outputs ("true", "false")

CONDITION nodes always have exactly two routing paths based on condition evaluation.

**Edge Configuration:**

```json
[
  {
    "source": "condition-node-id",
    "target": "adult-flow-id",
    "sourceHandle": "true"
  },
  {
    "source": "condition-node-id",
    "target": "minor-flow-id",
    "sourceHandle": "false"
  }
]
```

**Routing Logic:**

1. Evaluate condition: `variable operator value`
2. If result is `true` → Route to edge with `sourceHandle: "true"`
3. If result is `false` → Route to edge with `sourceHandle: "false"`
4. If no matching edge found → Flow ends

**Diagram:**

```
┌──────────────┐
│   QUESTION   │
│ "Your age?"  │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│  CONDITION   │
│ age >= 18    │
└──┬────────┬──┘
   │        │
true│        │false
   │        │
   ↓        ↓
┌────┐   ┌────┐
│Adult│   │Minor│
└────┘   └────┘
```

**Important Notes:**

- Both edges are typically required (true and false)
- If one path is missing, flow ends for that outcome
- sourceHandle must be exactly "true" or "false" (lowercase string)

---

### 5. WHATSAPP_FLOW Node Routing

**Handles:** 1 default + optional "error"

WHATSAPP_FLOW nodes typically have a single default path but can also handle errors.

**Normal Flow (Success):**

```json
{
  "source": "flow-node-id",
  "target": "confirmation-message-id",
  "sourceHandle": null
}
```

**With Error Handling:**

```json
[
  {
    "source": "flow-node-id",
    "target": "confirmation-message-id",
    "sourceHandle": null
  },
  {
    "source": "flow-node-id",
    "target": "error-message-id",
    "sourceHandle": "error"
  }
]
```

**Routing Logic:**

1. Flow sent successfully → Waits for completion
2. User completes flow → Routes to default edge (no sourceHandle)
3. Flow send fails → Routes to edge with `sourceHandle: "error"`
4. If no "error" edge → Routes to default edge
5. If no edge at all → Flow ends

**Diagram:**

```
┌──────────────┐
│ WHATSAPP_FLOW│
│ "Appointment"│
└──┬────────┬──┘
   │        │
default    error
(success)   │
   │        ↓
   │     ┌──────────────┐
   │     │ Error Message│
   │     └──────────────┘
   ↓
┌──────────────┐
│ Confirmation │
└──────────────┘
```

**Important Notes:**

- Default path is for successful flow completion
- Error path is for send failures (not user cancellation)
- User can cancel flow without triggering error path (timeout)

---

### 6. REST_API Node Routing

**Handles:** 2 outputs ("success", "error")

REST_API nodes always have two routing paths based on HTTP response status.

**Edge Configuration:**

```json
[
  {
    "source": "api-node-id",
    "target": "show-results-id",
    "sourceHandle": "success"
  },
  {
    "source": "api-node-id",
    "target": "error-message-id",
    "sourceHandle": "error"
  }
]
```

**Routing Logic:**

1. HTTP status 2xx (200-299) → Routes to edge with `sourceHandle: "success"`
2. HTTP status 4xx, 5xx, or network error → Routes to edge with `sourceHandle: "error"`
3. If no specific handle found → Routes to default edge (no sourceHandle)
4. If no edge at all → Flow ends

**Diagram:**

```
┌──────────────┐
│   REST_API   │
│ GET /products│
└──┬────────┬──┘
   │        │
success   error
(2xx)    (4xx/5xx)
   │        │
   ↓        ↓
┌────┐   ┌─────┐
│Show│   │Error│
│List│   │ Msg │
└────┘   └─────┘
```

**Important Notes:**

- Both paths should typically be defined
- Success path: HTTP 200-299
- Error path: HTTP 400-599 or network errors
- System variables `__last_api_status__` and `__last_api_error__` available for debugging

---

## Default Edge Fallback

All node types support a **default edge** as a fallback when no specific sourceHandle matches.

### Default Edge Definition

A default edge is one where:
- `sourceHandle` is `null`, or
- `sourceHandle` is `"default"`, or
- `sourceHandle` is `undefined`

### When Default is Used

1. **QUESTION (buttons):** User types text instead of clicking button
2. **QUESTION (list):** User types text instead of selecting from list
3. **REST_API:** No specific success/error edge defined
4. **WHATSAPP_FLOW:** No specific error edge defined

### Example

```json
{
  "source": "question-buttons-id",
  "target": "any-input-handler-id",
  "sourceHandle": "default"
}
```

**Scenario:**
- User is shown buttons: [Yes] [No] [Maybe]
- User types "I'm not sure" instead of clicking
- System routes to "default" edge

---

## Edge Finding Algorithm

The backend uses this algorithm to find the next node:

```typescript
function findNextNode(
  chatbot: ChatBot,
  currentNodeId: string,
  sourceHandle?: string
): Node | null {
  // Step 1: Try to find edge with specific sourceHandle
  let edge = chatbot.edges.find((e) => {
    if (e.source !== currentNodeId) return false;
    if (sourceHandle) {
      return e.sourceHandle === sourceHandle;
    }
    return true;
  });

  // Step 2: If not found and sourceHandle was specified, try default
  if (!edge && sourceHandle) {
    edge = chatbot.edges.find((e) => {
      if (e.source !== currentNodeId) return false;
      // Look for edge without sourceHandle or with "default"
      return !e.sourceHandle || e.sourceHandle === 'default';
    });
  }

  // Step 3: Return target node or null
  if (!edge) return null;
  return chatbot.nodes.find((n) => n.id === edge.target) || null;
}
```

**Priority Order:**
1. Exact `sourceHandle` match
2. Default edge (no sourceHandle or "default")
3. Return null (flow ends)

---

## Visual Edge Types

The frontend uses ReactFlow for visual rendering:

### Edge Type Options

```typescript
type EdgeType =
  | "default"       // Straight line
  | "smoothstep"    // Smooth curves
  | "step"          // Right angles
  | "straight"      // Direct line
  | "bezier";       // Bezier curve
```

**Common Usage:**

```json
{
  "type": "smoothstep",
  "animated": false
}
```

The visual type does not affect routing logic, only appearance in the builder.

---

## Multi-Path Routing Patterns

### Pattern 1: Button-Based Branching

```
QUESTION (buttons) ──btn_a──→ PATH A
                   ├─btn_b──→ PATH B
                   ├─btn_c──→ PATH C
                   └─default─→ PATH D
```

### Pattern 2: List-Based Selection

```
QUESTION (list) ──row_1──→ DETAIL 1
                ├─row_2──→ DETAIL 2
                ├─row_3──→ DETAIL 3
                └─default─→ SEARCH
```

### Pattern 3: Conditional Logic

```
CONDITION ──true──→ YES PATH
          └─false─→ NO PATH
```

### Pattern 4: API with Error Handling

```
REST_API ──success──→ PROCESS RESULT
         └─error────→ SHOW ERROR
```

### Pattern 5: Nested Conditions

```
CONDITION A ──true──→ CONDITION B ──true──→ RESULT 1
            │                     └─false─→ RESULT 2
            └─false─→ CONDITION C ──true──→ RESULT 3
                                  └─false─→ RESULT 4
```

---

## Connection Validation

The frontend validates edge connections before saving:

### Valid Connection Rules

1. **No cycles:** Cannot create circular references (A → B → A)
2. **Single START:** Only one START node per flow
3. **Type compatibility:** Source handle must match target node expectations
4. **No duplicate edges:** Cannot have multiple edges with same source + sourceHandle
5. **Required handles:** CONDITION must have both true/false, REST_API should have success/error

### ReactFlow Connection Validation

```typescript
const isValidConnection = (connection: Connection) => {
  const { source, target, sourceHandle } = connection;

  // Prevent self-loops
  if (source === target) return false;

  // Check for existing edge with same source and handle
  const duplicate = edges.find(
    (e) => e.source === source && e.sourceHandle === sourceHandle
  );
  if (duplicate) return false;

  // Additional custom validation...
  return true;
};
```

---

## Debugging Edge Routing

### Check Node History

Context object stores execution path:

```json
{
  "nodeHistory": [
    "start-node-id",
    "message-node-id",
    "question-node-id"
  ],
  "currentNodeId": "condition-node-id"
}
```

### Log Edge Traversal

Backend logs each edge traversal:

```
[ChatBotExecutionService] Finding next node from question-1 with handle: btn_yes
[ChatBotExecutionService] Found edge: edge-1 → target: message-2
[ChatBotExecutionService] Executing node message-2 of type message
```

### Common Issues

1. **No edge found:** Flow ends unexpectedly
   - Solution: Ensure all paths have edges

2. **Wrong path taken:** Unexpected routing
   - Solution: Check sourceHandle values match button/row IDs

3. **Default path not working:** User types but no response
   - Solution: Add edge with `sourceHandle: "default"`

4. **Condition always false:** Routing to wrong path
   - Solution: Check variable name and operator correctness

---

## Best Practices

1. **Always provide default edges** for QUESTION nodes to handle text input
2. **Use descriptive button/row IDs** for easier debugging (e.g., `btn_confirm`, `row_product_a`)
3. **Handle error paths** for REST_API and WHATSAPP_FLOW nodes
4. **Provide both true/false paths** for CONDITION nodes
5. **Avoid orphaned nodes** - ensure every node has at least one incoming edge (except START)
6. **Test all paths** - verify each button, list item, and condition branch
7. **Use consistent naming** - sourceHandle values should be clear and consistent
8. **Document complex routing** - add comments to explain multi-path logic

---

## Edge JSON Schema Reference

```typescript
interface Edge {
  id: string;                    // Unique identifier
  source: string;                // Source node UUID
  target: string;                // Target node UUID
  sourceHandle?: string | null;  // Output handle identifier
  targetHandle?: string | null;  // Input handle (usually null)
  type?: string;                 // Visual type (default, smoothstep, etc.)
  animated?: boolean;            // Visual animation flag
  style?: Record<string, any>;   // Custom CSS styles
  label?: string;                // Optional edge label
  data?: Record<string, any>;    // Custom edge data
}
```

### Complete Example

```json
{
  "id": "edge-uuid-123",
  "source": "question-node-uuid",
  "target": "message-node-uuid",
  "sourceHandle": "btn_yes",
  "targetHandle": null,
  "type": "smoothstep",
  "animated": false,
  "label": "User selected Yes"
}
```
