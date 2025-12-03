# Variable System (Auto-Naming)

## Overview

WhatsApp Builder uses an **automatic variable naming system**. Each node's output is automatically named based on its type and index in the flow order. Variables are displayed in a read-only badge and can be easily used in other nodes.

**Key Design Decisions:**
- **No Manual Input**: Manual variable input fields have been completely removed from all config modals
- **Automatic Naming**: Variables are auto-generated as `{nodeType}_{index}.{output}`
- **Flow-Order Indexing**: Indexes are calculated using topological sort (Kahn's algorithm)
- **Read-Only Display**: OutputVariableBadge component shows the generated name with copy functionality

## Architecture

### Frontend Components

```
frontend/src/features/builder/
├── components/
│   ├── OutputVariableBadge.tsx    # Auto variable display with outputs (NEW)
│   └── VariablePicker/
│       ├── index.tsx              # Exports
│       ├── types.ts               # TypeScript interfaces
│       ├── VariablePicker.tsx     # Main dropdown component
│       ├── VariableTree.tsx       # Tree view of node groups
│       ├── VariableTreeItem.tsx   # Single variable item (draggable)
│       └── VariableInput.tsx      # Input wrapper with picker button
├── hooks/
│   └── useAvailableVariables.ts   # Variable discovery with topological sort
└── utils/
    └── autoVariableNaming.ts      # Auto naming utilities
```

### Backend Components

```
backend/src/
├── entities/
│   └── conversation-context.entity.ts  # nodeOutputs JSONB column
└── modules/chatbots/
    ├── services/
    │   └── chatbot-execution.service.ts # Auto variable storage
    └── utils/
        └── auto-variable-naming.ts      # Auto naming utilities
```

## Auto-Generated Variable Format

| Node Type | Base Variable | Full Path Examples |
|-----------|---------------|-------------------|
| Question | `question_N` | `question_1.response` |
| REST API | `rest_api_N` | `rest_api_1.data`, `rest_api_1.error`, `rest_api_1.status` |
| WhatsApp Flow | `flow_N` | `flow_1.response` |
| Google Calendar | `calendar_N` | `calendar_1.result` |

### Node Type Normalization

The system normalizes node types for cleaner variable names:
- `question` -> `question`
- `rest_api` -> `rest_api`
- `whatsapp_flow` -> `flow` (shortened)
- `google_calendar` -> `calendar` (shortened)

### Index Calculation (Topological Sort)

- Index is calculated based on **topological sort** using Kahn's algorithm
- Nodes are ordered based on edge connections (flow direction)
- Each node type has its own counter starting at 1
- Example flow order: Start -> Question -> REST API -> Question
  - First question node = `question_1`
  - REST API node = `rest_api_1`
  - Second question node = `question_2`

## Usage

### OutputVariableBadge Component

The new `OutputVariableBadge` component displays the auto-generated variable name with all available outputs.

```tsx
import { OutputVariableBadge } from '@/features/builder/components/OutputVariableBadge';

<OutputVariableBadge
  nodeId={nodeId}
  nodeType={nodeType}
/>
```

**Features:**
- **Read-only Badge**: Displays auto-generated variable name (e.g., `question_1`)
- **Expandable Section**: Click to reveal all available outputs
- **Output List**: Shows each output with name, description, and data type icon
- **Copy Buttons**: One-click copy for each output path (copies `{{variable}}` syntax)
- **Data Type Icons**: Visual indicators for string, number, boolean, object, array

**Data Type Icons:**
| Type | Icon |
|------|------|
| string | `text_fields` |
| number | `numbers` |
| boolean | `toggle_on` |
| object | `data_object` |
| array | `data_array` |

### VariableInput Component

```tsx
import { VariableInput } from '@/features/builder/components/VariablePicker';

<VariableInput
  value={message}
  onChange={setMessage}
  placeholder="Enter message with {{variables}}"
  currentNodeId={nodeId}  // Exclude self from variable list
  multiline              // Optional: textarea mode
  rows={4}               // Optional: textarea rows
/>
```

### useAvailableVariables Hook

```tsx
import { useAvailableVariables } from '@/features/builder/hooks/useAvailableVariables';

const {
  nodeGroups,           // Variables grouped by node
  allVariables,         // Flat list of all variables
  searchVariables,      // Search function
  getNodeAutoVariable,  // Get auto variable info for a node
  isEmpty
} = useAvailableVariables({
  excludeNodeId: currentNodeId,  // Optional: exclude a node
  filterTypes: ['rest_api']      // Optional: filter by node types
});
```

## Variable Sources

| Node Type | Output | Description |
|-----------|--------|-------------|
| **Question** | `question_N.response` | User response text |
| **REST API** | `rest_api_N.data` | API response data |
| **REST API** | `rest_api_N.error` | Error message |
| **REST API** | `rest_api_N.status` | HTTP status code |
| **WhatsApp Flow** | `flow_N.response` | Flow form response |
| **Google Calendar** | `calendar_N.result` | Events or slots |
| **System** | `customer_phone` | Customer phone number |

## Node Output Tracking (Backend)

Each node execution stores output in `ConversationContext.nodeOutputs`:

```typescript
interface NodeOutput {
  nodeId: string;
  nodeType: string;
  nodeLabel?: string;
  executedAt: string;      // ISO date
  success: boolean;
  duration?: number;       // ms
  data?: any;              // Response data
  error?: string;          // Error message
  statusCode?: number;     // HTTP status (REST API)
  userResponse?: string;   // User input (Question)
  buttonId?: string;       // Selected button ID
  listRowId?: string;      // Selected list row ID
  flowResponse?: any;      // WhatsApp Flow response
  outputVariable?: string; // Auto variable name (e.g., question_1)
}
```

## Features

- **Automatic Naming**: No manual variable input required
- **Flow Order**: Variables indexed by topological sort
- **Read-only Badge**: Shows auto-generated name with copy functionality
- **Output Details**: Expandable list showing all available outputs
- **Dropdown Picker**: Click icon to select variables from other nodes
- **Drag & Drop**: Drag variables from picker to input
- **Search**: Filter variables by name or node label
- **VAR Badge**: Visual indicator when input contains variables

## Integrated Config Modals

All config modals have been updated to use the new auto-naming system:

| Modal | Changes | OutputVariableBadge Shows |
|-------|---------|--------------------------|
| **ConfigQuestion** | Removed manual `variable` input | `question_N.response` |
| **ConfigRestApi** | Removed `apiOutputVariable`, `apiErrorVariable` inputs | `rest_api_N.data`, `.error`, `.status` |
| **ConfigGoogleCalendar** | Removed manual output variable input | `calendar_N.result` |
| **ConfigWhatsAppFlow** | Removed `flowOutputVariable` input | `flow_N.response` |
| **ConfigCondition** | Variable dropdown uses auto-generated paths | N/A (uses VariablePicker) |
| **ConfigMessage** | Content textarea with VariableInput | N/A (uses VariablePicker) |

**Note:** Manual variable input fields have been completely removed from:
- `ConfigModals.tsx` (ConfigQuestion, ConfigWhatsAppFlow, ConfigCondition)
- `ConfigRestApi.tsx`
- `ConfigGoogleCalendar.tsx`

## Database Schema

```sql
-- conversation_contexts table
nodeOutputs JSONB NOT NULL DEFAULT '{}'

-- GIN index for efficient querying
CREATE INDEX idx_conversation_contexts_node_outputs
ON conversation_contexts USING GIN ("nodeOutputs");
```

## Auto Naming Utility Functions

### Frontend

```typescript
// frontend/src/features/builder/utils/autoVariableNaming.ts

// Generate base variable name
generateAutoVariableName('question', 1) // => 'question_1'
generateAutoVariableName('rest_api', 2) // => 'rest_api_2'

// Get full variable path
getFullVariablePath('question', 1, 'response') // => 'question_1.response'
getFullVariablePath('rest_api', 1, 'data') // => 'rest_api_1.data'

// Get available outputs for a node type
getNodeOutputs('rest_api') // => [{name: 'data', ...}, {name: 'error', ...}, ...]
```

### Backend

```typescript
// backend/src/modules/chatbots/utils/auto-variable-naming.ts

// Calculate node index based on execution history
calculateNodeIndex(nodes, nodeHistory, currentNodeId, 'question') // => 1

// Generate auto variable name
generateAutoVariableName('question', 1) // => 'question_1'

// Get full variable path
getFullVariablePath('question', 1, 'response') // => 'question_1.response'
```

## Backend Execution Changes

The `ChatBotExecutionService` has been updated to use auto-generated variables:

### processQuestionNode
```typescript
// Before: Manual variable from node.data.variable
context.variables[node.data.variable] = userResponse;

// After: Auto-generated variable
const nodeIndex = calculateNodeIndex(chatbot.nodes, context.nodeHistory, node.id, 'question');
const autoVarName = generateAutoVariableName('question', nodeIndex);
context.variables[`${autoVarName}.response`] = userResponse;
```

### processRestApiNode
```typescript
// Before: Manual variables from node.data
context.variables[node.data.apiOutputVariable] = result.data;
context.variables[node.data.apiErrorVariable] = result.error;

// After: Auto-generated variables
const nodeIndex = calculateNodeIndex(chatbot.nodes, context.nodeHistory, node.id, 'rest_api');
const autoVarName = generateAutoVariableName('rest_api', nodeIndex);
context.variables[`${autoVarName}.data`] = result.data;
context.variables[`${autoVarName}.error`] = result.error;
context.variables[`${autoVarName}.status`] = result.statusCode;
```

### processWhatsAppFlowNode
```typescript
// Before: Manual variable from node.data.flowOutputVariable
context.variables[node.data.flowOutputVariable] = flowResponse;

// After: Auto-generated variable
const nodeIndex = calculateNodeIndex(chatbot.nodes, context.nodeHistory, node.id, 'whatsapp_flow');
const autoVarName = generateAutoVariableName('whatsapp_flow', nodeIndex);
context.variables[`${autoVarName}.response`] = flowResponse;
```

### processGoogleCalendarNode
```typescript
// Before: Manual variable from node.data.outputVariable
context.variables[node.data.outputVariable] = calendarResult;

// After: Auto-generated variable
const nodeIndex = calculateNodeIndex(chatbot.nodes, context.nodeHistory, node.id, 'google_calendar');
const autoVarName = generateAutoVariableName('google_calendar', nodeIndex);
context.variables[`${autoVarName}.result`] = calendarResult;
```

## Migration Notes

### Breaking Changes
1. **NodeData Fields Deprecated**: The following fields are no longer used:
   - `variable` (Question node)
   - `apiOutputVariable`, `apiErrorVariable` (REST API node)
   - `flowOutputVariable` (WhatsApp Flow node)
   - `outputVariable` (Google Calendar node)

2. **Variable Reference Updates**: Existing chatbot flows that reference old variable names will need to be updated to use the new auto-generated format.

### Backward Compatibility
The system maintains some backward compatibility:
- Old node configurations with manual variable names are ignored
- Variables are always generated automatically based on flow position
- Legacy `variable` fields in NodeData are still present in type definitions but unused
