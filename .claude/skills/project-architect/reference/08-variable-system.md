# Variable System (n8n Style)

## Overview

WhatsApp Builder artık n8n tarzı otomatik değişken sistemi kullanıyor. Her node'un output'u otomatik olarak takip edilir ve diğer node'larda dropdown ile kolayca seçilebilir.

## Architecture

### Frontend Components

```
frontend/src/features/builder/
├── components/
│   └── VariablePicker/
│       ├── index.tsx           # Exports
│       ├── types.ts            # TypeScript interfaces
│       ├── VariablePicker.tsx  # Main dropdown component
│       ├── VariableTree.tsx    # Tree view of node groups
│       ├── VariableTreeItem.tsx # Single variable item (draggable)
│       └── VariableInput.tsx   # Input wrapper with picker button
└── hooks/
    └── useAvailableVariables.ts # Variable discovery hook
```

### Backend Changes

```
backend/src/
├── entities/
│   └── conversation-context.entity.ts  # Added nodeOutputs JSONB column
└── modules/chatbots/services/
    └── chatbot-execution.service.ts    # Added storeNodeOutput() method
```

## Usage

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

const { nodeGroups, allVariables, searchVariables, isEmpty } = useAvailableVariables({
  excludeNodeId: currentNodeId,  // Optional: exclude a node
  filterTypes: ['rest_api']      // Optional: filter by node types
});
```

## Variable Sources

| Node Type | Output Variables |
|-----------|------------------|
| **Question** | `variable` - User response |
| **REST API** | `apiOutputVariable` - Response data, `apiErrorVariable` - Error message |
| **Google Calendar** | `calendarOutputVariable` - Events/slots |
| **WhatsApp Flow** | `flowOutputVariable` - Flow response |
| **System** | `customer_phone` - Customer phone number |

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
  outputVariable?: string; // Variable name where output is stored
}
```

## Features

- **Dropdown Picker**: Click the `data_object` icon to open variable picker
- **Search**: Filter variables by name or node label
- **Drag & Drop**: Drag variables from picker to input
- **VAR Badge**: Visual indicator when input contains variables
- **Tree View**: Variables grouped by source node with icons
- **Type Icons**: Different icons for string, object, array types

## Integrated Config Modals

- ConfigMessage - content textarea
- ConfigQuestion - body text
- ConfigRestApi - URL, body, headers, auth token, query params
- ConfigGoogleCalendar - date variables, user variable
- ConfigWhatsAppFlow - initial data JSON
- ConfigCondition - variable dropdown (all node types now supported)

## Database Schema

```sql
-- conversation_contexts table
nodeOutputs JSONB NOT NULL DEFAULT '{}'

-- GIN index for efficient querying
CREATE INDEX idx_conversation_contexts_node_outputs
ON conversation_contexts USING GIN ("nodeOutputs");
```
