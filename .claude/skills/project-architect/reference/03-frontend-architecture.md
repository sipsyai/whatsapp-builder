# Frontend Architecture - WhatsApp Builder

## Table of Contents
- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Application Structure](#application-structure)
- [Feature-Based Organization](#feature-based-organization)
- [State Management](#state-management)
- [Real-time Integration](#real-time-integration)
- [API Layer](#api-layer)
- [Custom Hooks](#custom-hooks)
- [Component Patterns](#component-patterns)

---

## Overview

The frontend is a **React 19.2.x** single-page application (SPA) built with **Vite** for ultra-fast development and optimized production builds. The architecture follows a **feature-based** organization pattern, where each feature is self-contained with its own components, API clients, and types.

### Core Architectural Principles
1. **Feature-based Organization**: Group by feature (builder, chat, chatbots) not by type (components/, hooks/)
2. **Component Composition**: Small, reusable components composed into larger features
3. **Type Safety**: Full TypeScript coverage with strict type checking
4. **Real-time First**: Socket.IO integration for instant updates
5. **Declarative UI**: React hooks for state management and side effects
6. **Optimistic Updates**: Instant UI feedback with server reconciliation

### Project Structure
```
frontend/src/
├── app/                          # Root application
│   ├── App.tsx                   # Main app component (routing logic)
│   ├── App.css                   # Global app styles
│   └── main.tsx                  # Entry point
├── features/                     # Feature modules
│   ├── builder/                  # Flow builder
│   ├── chat/                     # Conversation UI
│   ├── chatbots/                 # Chatbot list/management
│   ├── conversations/            # Conversation list
│   ├── nodes/                    # ReactFlow custom nodes
│   ├── users/                    # User management
│   ├── settings/                 # App settings
│   └── landing/                  # Landing page
├── shared/                       # Shared code
│   ├── components/               # Reusable UI components
│   └── types/                    # Shared TypeScript types
├── api/                          # API clients
│   ├── client.ts                 # Axios instance
│   ├── socket.ts                 # Socket.IO client
│   ├── conversations.service.ts
│   └── messages.service.ts
├── hooks/                        # Custom React hooks
│   └── useWebSocket.ts
├── types/                        # TypeScript type definitions
│   └── messages.ts
├── shared/                       # Shared code
│   ├── components/               # Reusable UI components
│   └── types/                    # Shared TypeScript types
│       └── index.ts              # Core type definitions
├── utils/                        # Utility functions
├── styles/                       # Global styles
└── vite.config.ts                # Vite configuration
```

---

## Technology Stack

### Core Framework
- **React**: 19.2.0 (with Concurrent Features)
- **TypeScript**: 5.9.x
- **Vite**: 7.x (using Rolldown for faster builds)

### UI & Styling
- **CSS**: Native CSS with CSS Variables for theming
- **Icons**: Material Symbols (Google Fonts)
- **Animations**: CSS transitions and animations

### Flow Builder
- **@xyflow/react**: 12.3.5 (ReactFlow v12)
  - Custom node types
  - Edge validation
  - Drag-and-drop interface
  - Auto-layout support

### State Management
- **React Hooks**: useState, useEffect, useCallback, useMemo
- **Context API**: For shared state (minimal usage)
- **Local State**: Component-level state preferred

### Real-time Communication
- **socket.io-client**: 4.8.1
  - WebSocket connection
  - Room-based messaging
  - Event-driven architecture

### HTTP Client
- **Axios**: 1.13.2
  - Request/response interceptors
  - Centralized error handling

### AI Integration
- **@google/genai**: 1.30.0
  - Gemini API for AI-generated flows

---

## Shared Type Definitions

### Core Types
**File**: `/home/ali/whatsapp-builder/frontend/src/shared/types/index.ts`

The shared types file defines the core data structures used throughout the application, ensuring type safety and consistency across all components.

#### Condition Types

```typescript
export interface Condition {
    id: string;          // Unique identifier for the condition
    variable: string;    // Variable name to check (from Question nodes)
    operator: string;    // Comparison operator (==, !=, >, <, >=, <=, contains, not_contains)
    value: string;       // Value to compare against
}

export interface ConditionGroup {
    conditions: Condition[];           // Array of conditions to evaluate
    logicalOperator: 'AND' | 'OR';    // How to combine multiple conditions
}
```

**Usage**:
- Used by Condition nodes in the flow builder
- Stored in `NodeData.conditionGroup` field
- Enables complex multi-condition logic with AND/OR operators
- Maximum 5 conditions per group

#### Node Data Types

```typescript
export interface NodeData {
    label: string;                    // Display label for the node
    type?: NodeDataType;              // Logical type: "start" | "message" | "question" | "condition" | "whatsapp_flow"
    content?: string;                 // Message content or question text
    variable?: string;                // Variable name to store user response (Question nodes)

    // Condition Node - New Structure
    conditionGroup?: ConditionGroup;  // Multiple conditions with AND/OR logic

    // Condition Node - Legacy Structure (backward compatibility)
    conditionVar?: string;            // Single condition variable
    conditionOp?: string;             // Single condition operator
    conditionVal?: string;            // Single condition value

    // Question Node Types
    questionType?: "text" | "buttons" | "list";
    headerText?: string;              // Optional header (buttons/list)
    footerText?: string;              // Optional footer (buttons/list)
    buttons?: ButtonItem[];           // Button options (max 3)
    listButtonText?: string;          // List trigger button text
    listSections?: SectionItem[];     // List sections (max 10)

    // WhatsApp Flow Node Fields
    whatsappFlowId?: string;          // UUID of the Flow from flows table
    flowCta?: string;                 // CTA button text (e.g., "Book Appointment")
    flowMode?: string;                // 'draft' | 'published' - Flow mode
    flowOutputVariable?: string;      // Variable name to store Flow response data

    // Component callbacks
    onConfig?: () => void;            // Open configuration modal
    onDelete?: () => void;            // Delete node
}
```

**Key Design Decisions**:
1. **Dual Condition Format**: Supports both legacy (`conditionVar/Op/Val`) and new (`conditionGroup`) formats for backward compatibility
2. **Optional Fields**: Most fields are optional to support different node types
3. **Type Safety**: TypeScript ensures all components use consistent data structures
4. **Extensibility**: Easy to add new fields without breaking existing code

#### Interactive Message Types

```typescript
export interface ButtonItem {
    id: string;      // Unique ID: "btn-0", "btn-1", "btn-2"
    title: string;   // Button text (max 20 chars for WhatsApp API)
}

export interface RowItem {
    id: string;          // Unique ID: "row-0", "row-1", etc.
    title: string;       // Row title (max 24 chars)
    description?: string; // Optional description (max 72 chars)
}

export interface SectionItem {
    id: string;          // Unique ID: "section-0", etc.
    title: string;       // Section title (max 24 chars)
    rows: RowItem[];     // Row items (max 10 per section)
}
```

**WhatsApp API Constraints**:
- Button titles: max 20 characters, max 3 buttons
- List section titles: max 24 characters, max 10 sections
- List row titles: max 24 characters, max 10 rows per section
- List row descriptions: max 72 characters

---

## Application Structure

### Root Component: App.tsx
**File**: `/home/ali/whatsapp-builder/frontend/src/app/App.tsx`

The root component manages application routing using local state (no React Router).

```typescript
const App = () => {
  // View state management (manual routing)
  const [view, setView] = useState<ExtendedViewState>("chatbots");
  const [selectedChatBot, setSelectedChatBot] = useState<ChatBot | null>(null);

  return (
    <ReactFlowProvider> {/* Global ReactFlow context */}
      <div className="h-screen flex overflow-hidden">
        {/* Sidebar - shown on all pages except landing */}
        {view !== "landing" && (
          <SideBar
            currentView={view}
            onNavigate={(newView) => setView(newView)}
          />
        )}

        {/* Route to different pages based on view state */}
        <div className="flex-1 overflow-hidden">
          {view === "landing" && <LandingPage onStart={() => setView("chatbots")} />}
          {view === "builder" && <BuilderPage
            initialFlow={selectedChatBot}
            onFlowSaved={() => {/* ... */}}
          />}
          {view === "chat" && <ChatPage onBack={() => setView("builder")} />}
          {view === "chatbots" && <ChatBotsListPage
            onLoadChatBot={(chatbot) => {
              setSelectedChatBot(chatbot);
              setView("builder");
            }}
          />}
          {view === "users" && <UsersPage />}
          {view === "settings" && <WhatsappConfigPage />}
        </div>
      </div>
    </ReactFlowProvider>
  );
};
```

**Key Design Decisions**:
- **No React Router**: Simple state-based routing for MVP
- **ReactFlowProvider**: Wraps entire app for ReactFlow context
- **Sidebar Navigation**: Persistent navigation component
- **Callback Props**: Parent manages state, children notify via callbacks

---

## Feature-Based Organization

### Feature: Builder (Flow Builder)
**Location**: `/home/ali/whatsapp-builder/frontend/src/features/builder/`

#### Structure
```
builder/
├── components/
│   ├── BuilderPage.tsx          # Main builder interface
│   ├── ConfigModals.tsx         # Node configuration modals
│   ├── QuestionTypeModal.tsx    # Question type selector
│   └── FlowTester.tsx           # In-app flow testing
├── utils/
│   └── flowValidation.ts        # Flow validation logic
└── index.ts                     # Public exports
```

#### BuilderPage Component
**File**: `/home/ali/whatsapp-builder/frontend/src/features/builder/components/BuilderPage.tsx`

**Responsibilities**:
1. **ReactFlow Canvas Management**: Nodes, edges, connections
2. **Drag-and-Drop**: Node creation from sidebar
3. **Node Configuration**: Modal-based editing
4. **Flow Validation**: Real-time validation with error panel
5. **AI Generation**: Gemini-powered flow generation
6. **Backend Integration**: Save/load flows via API

#### ConfigCondition Component
**File**: `/home/ali/whatsapp-builder/frontend/src/features/builder/components/ConfigModals.tsx`

The `ConfigCondition` component provides a comprehensive interface for configuring conditional branching logic in chatbot flows. It supports multiple conditions with AND/OR logical operators, enabling complex decision trees.

**Key Features**:

1. **Multiple Conditions Support** (up to 5 conditions):
   - Add multiple conditions to create complex logic
   - Each condition can check a different variable
   - Minimum 1 condition required, maximum 5

2. **8 Comparison Operators**:
   - `==` - Equal To
   - `!=` - Not Equal To
   - `>` - Greater Than
   - `<` - Less Than
   - `>=` - Greater Than or Equal
   - `<=` - Less Than or Equal
   - `contains` - Contains substring
   - `not_contains` - Does Not Contain substring

3. **Logical Operators**:
   - `AND` - All conditions must be true
   - `OR` - At least one condition must be true
   - Applied between all conditions in the group

4. **Variable Discovery**:
   - Automatically scans all Question nodes in the flow
   - Extracts variable names for use in conditions
   - Displays warning if no variables are available
   - Dropdown selection for easy variable picking

5. **Real-time Preview**:
   - Shows human-readable condition logic
   - Format: `variable operator "value" AND/OR variable operator "value"`
   - Updates as conditions are modified

6. **Backward Compatibility**:
   - Supports legacy single-condition format (`conditionVar`, `conditionOp`, `conditionVal`)
   - Automatically migrates legacy data to new structure on edit
   - Saves both old and new formats for compatibility

**Data Structure**:
```typescript
interface Condition {
    id: string;           // Unique ID: "cond-0", "cond-1", etc.
    variable: string;     // Variable name from Question node
    operator: string;     // One of 8 operators
    value: string;        // Comparison value
}

interface ConditionGroup {
    conditions: Condition[];           // Array of conditions
    logicalOperator: 'AND' | 'OR';    // How to combine conditions
}

// Stored in NodeData as:
interface NodeData {
    // ... other fields
    conditionGroup?: ConditionGroup;   // New structure
    // Legacy fields (for backward compatibility):
    conditionVar?: string;
    conditionOp?: string;
    conditionVal?: string;
}
```

**State Management**:
```typescript
const [conditions, setConditions] = useState<Condition[]>(initConditions());
const [logicalOperator, setLogicalOperator] = useState<'AND' | 'OR'>('AND');
const [label, setLabel] = useState(data.label || "Condition");
```

**Initialization Logic**:
```typescript
const initConditions = (): Condition[] => {
    // 1. Check if new structure exists
    if (data.conditionGroup && data.conditionGroup.conditions.length > 0) {
        return data.conditionGroup.conditions;
    }
    // 2. Migrate legacy structure
    if (data.conditionVar) {
        return [{
            id: 'cond-0',
            variable: data.conditionVar,
            operator: data.conditionOp || '==',
            value: data.conditionVal || ''
        }];
    }
    // 3. Default empty condition
    return [{
        id: 'cond-0',
        variable: availableVariables[0] || '',
        operator: '==',
        value: ''
    }];
};
```

**Variable Discovery**:
```typescript
const availableVariables = useMemo(() => {
    const nodes = reactFlowInstance.getNodes();
    const vars: string[] = [];

    nodes.forEach(node => {
        if (node.type === 'question' && node.data?.variable) {
            vars.push(node.data.variable as string);
        }
    });

    return vars;
}, [reactFlowInstance]);
```

**Validation**:
```typescript
const handleSave = () => {
    // Ensure all conditions have required fields
    const isValid = conditions.every(c => c.variable && c.operator && c.value);
    if (!isValid) {
        alert("Please fill all condition fields");
        return;
    }

    const conditionGroup: ConditionGroup = {
        conditions,
        logicalOperator
    };

    onSave({
        ...data,
        label,
        conditionGroup,
        // Keep legacy fields for backward compatibility
        conditionVar: conditions[0]?.variable,
        conditionOp: conditions[0]?.operator,
        conditionVal: conditions[0]?.value,
    });
    onClose();
};
```

**Preview Generation**:
```typescript
const previewText = useMemo(() => {
    if (conditions.length === 0) return "No conditions defined";

    return conditions.map((cond, idx) => {
        const op = operators.find(o => o.value === cond.operator)?.label || cond.operator;
        const condText = `${cond.variable} ${op} "${cond.value}"`;

        if (idx === conditions.length - 1) return condText;
        return `${condText} ${logicalOperator}`;
    }).join(' ');
}, [conditions, logicalOperator]);
```

**UI Features**:
- **Dark Theme Support**: Fully styled for dark mode
- **Add/Remove Conditions**: Dynamic condition management with clear affordances
- **Dropdown Selectors**: For variables and operators
- **Text Inputs**: For comparison values
- **Preview Panel**: Shows complete logic expression
- **Validation Warnings**: Alerts when no variables are available
- **Disabled States**: Prevents adding conditions beyond limits

**User Workflow**:
1. Click on Condition node in builder
2. Modal opens with existing conditions or default
3. Select variable from dropdown (populated from Question nodes)
4. Select comparison operator
5. Enter comparison value
6. Add more conditions if needed (up to 5)
7. Choose AND/OR logical operator
8. Preview shows complete logic
9. Save applies configuration to node

**Example Use Cases**:
```typescript
// Simple condition (legacy format supported)
age > "18"

// Multiple conditions with AND
age > "18" AND country == "USA"

// Multiple conditions with OR
status == "premium" OR status == "gold"

// Complex string matching
email contains "@company.com" AND role != "guest"
```

**State Management**:
```typescript
// Flow state
const [currentFlowId, setCurrentFlowId] = useState<string | null>(null);
const [currentFlowName, setCurrentFlowName] = useState("My Chatbot");
const [nodes, setNodes, onNodesChange] = useNodesState<Node>([/* initial START node */]);
const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

// UI state
const [configNode, setConfigNode] = useState<Node | null>(null);
const [testMode, setTestMode] = useState(false);
const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

// ReactFlow instance
const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
```

**Key Functions**:
- `onDrop()`: Handle node drop from sidebar to canvas
- `onNodeClick()`: Open configuration modal
- `updateNodeData()`: Update node data from modal
- `deleteNode()`: Remove node and connected edges
- `handleSave()`: Validate and save flow to backend
- `generateAIResponse()`: Generate flow from AI prompt

**Validation System**:

The builder includes a comprehensive flow validation system that checks for structural integrity, node configuration completeness, and WhatsApp API compliance before saving.

**Implementation Location**: `/home/ali/whatsapp-builder/frontend/src/features/builder/utils/flowValidation.ts`

**Validation Trigger Points**:
1. **Manual Validation**: "Validate" button in header
2. **Pre-Save Validation**: Automatically runs before saving flow
3. **Real-time Feedback**: Validation panel shows errors/warnings

**Validation Flow**:
```typescript
const handleSave = async () => {
  // 1. Validate flow before saving
  const errors = validateFlow(nodes, edges);
  setValidationErrors(errors);

  // 2. Check error severity
  const hasErrors = errors.some(e => e.severity === 'error');
  const hasWarnings = errors.some(e => e.severity === 'warning');

  // 3. Block save if errors found
  if (hasErrors) {
    setShowValidationPanel(true);
    alert('Flow has validation errors. Please fix them before saving.');
    return;
  }

  // 4. Warn but allow save if only warnings
  if (hasWarnings) {
    setShowValidationPanel(true);
    const confirmed = window.confirm(
      'There are some warnings in your flow. Do you want to continue saving?'
    );
    if (!confirmed) return;
  }

  // 5. Proceed with save
  await saveChatBot(payload);
};
```

**Validation Rules** (7 Categories):

### 1. START Node Validation
```typescript
// Rule: Exactly one START node required
const startNodes = nodes.filter(n => n.type === 'start');

if (startNodes.length === 0) {
  errors.push({
    nodeId: 'flow',
    message: 'Flow must start with a START node',
    severity: 'error'
  });
}

if (startNodes.length > 1) {
  errors.push({
    nodeId: 'flow',
    message: 'Flow can only have one START node',
    severity: 'error'
  });
}
```

### 2. Condition Node Output Validation
```typescript
// Rule: Condition nodes must have both TRUE and FALSE outputs
if (node.type === 'condition') {
  const trueEdge = outgoingEdges.find(e => e.sourceHandle === 'true');
  const falseEdge = outgoingEdges.find(e => e.sourceHandle === 'false');

  if (!trueEdge) {
    errors.push({
      nodeId: node.id,
      message: 'Condition node must have a "true" output',
      severity: 'error'
    });
  }

  if (!falseEdge) {
    errors.push({
      nodeId: node.id,
      message: 'Condition node must have a "false" output',
      severity: 'error'
    });
  }
}
```

### 3. Button Question Edge Validation
```typescript
// Rule: Each button should have a corresponding edge (warning only)
if (node.type === 'question' && node.data.questionType === 'buttons') {
  const buttons = node.data.buttons || [];

  buttons.forEach((button: ButtonItem) => {
    const buttonEdge = outgoingEdges.find(e => e.sourceHandle === button.id);
    if (!buttonEdge) {
      errors.push({
        nodeId: node.id,
        message: `No edge defined for button "${button.title}"`,
        severity: 'warning'
      });
    }
  });
}
```

### 4. Orphan Node Detection
```typescript
// Rule: All nodes (except START) must have incoming connections
nodes.forEach(node => {
  if (node.type === 'start') return;

  const hasIncoming = edges.some(e => e.target === node.id);
  if (!hasIncoming) {
    errors.push({
      nodeId: node.id,
      message: 'This node is not connected to any other node',
      severity: 'warning'
    });
  }
});
```

### 5. Question Variable Validation
```typescript
// Rule: Question nodes must have a variable name for storing user input
if (node.type === 'question') {
  const variable = node.data.variable as string | undefined;
  if (!variable || variable.trim() === '') {
    errors.push({
      nodeId: node.id,
      message: 'Question node must have a variable name',
      severity: 'error'
    });
  }
}
```

### 6. Button/List Content Validation (WhatsApp API Limits)
```typescript
// Button validation
if (node.data.questionType === 'buttons') {
  const buttons = node.data.buttons || [];

  // At least 1 button required
  if (buttons.length === 0) {
    errors.push({
      nodeId: node.id,
      message: 'At least one button must be defined',
      severity: 'error'
    });
  }

  // Maximum 3 buttons (WhatsApp API limit)
  if (buttons.length > 3) {
    errors.push({
      nodeId: node.id,
      message: 'Maximum 3 buttons can be defined',
      severity: 'error'
    });
  }

  // Button text validation
  buttons.forEach((btn: ButtonItem, i: number) => {
    if (!btn.title || btn.title.trim() === '') {
      errors.push({
        nodeId: node.id,
        message: `Button ${i + 1} cannot be empty`,
        severity: 'error'
      });
    }

    // WhatsApp API: button title max 20 characters
    if (btn.title && btn.title.length > 20) {
      errors.push({
        nodeId: node.id,
        message: `Button ${i + 1} can have maximum 20 characters`,
        severity: 'error'
      });
    }
  });
}

// List validation
if (node.data.questionType === 'list') {
  const sections = node.data.listSections || [];

  // At least 1 section required
  if (sections.length === 0) {
    errors.push({
      nodeId: node.id,
      message: 'At least one section must be defined',
      severity: 'error'
    });
  }

  // Maximum 10 sections (WhatsApp API limit)
  if (sections.length > 10) {
    errors.push({
      nodeId: node.id,
      message: 'Maximum 10 sections can be defined',
      severity: 'error'
    });
  }

  // Section validation
  sections.forEach((section: SectionItem, sectionIndex: number) => {
    // Section title required
    if (!section.title || section.title.trim() === '') {
      errors.push({
        nodeId: node.id,
        message: `Section ${sectionIndex + 1} must have a title`,
        severity: 'error'
      });
    }

    // WhatsApp API: section title max 24 characters
    if (section.title && section.title.length > 24) {
      errors.push({
        nodeId: node.id,
        message: `Section ${sectionIndex + 1} title can have maximum 24 characters`,
        severity: 'error'
      });
    }

    const rows = section.rows || [];

    // At least 1 row required per section
    if (rows.length === 0) {
      errors.push({
        nodeId: node.id,
        message: `Section ${sectionIndex + 1} must have at least one row`,
        severity: 'error'
      });
    }

    // Maximum 10 rows per section (WhatsApp API limit)
    if (rows.length > 10) {
      errors.push({
        nodeId: node.id,
        message: `Section ${sectionIndex + 1} can have maximum 10 rows`,
        severity: 'error'
      });
    }

    // Row validation
    rows.forEach((row, rowIndex) => {
      // Row title required
      if (!row.title || row.title.trim() === '') {
        errors.push({
          nodeId: node.id,
          message: `Section ${sectionIndex + 1}, Row ${rowIndex + 1} must have a title`,
          severity: 'error'
        });
      }

      // WhatsApp API: row title max 24 characters
      if (row.title && row.title.length > 24) {
        errors.push({
          nodeId: node.id,
          message: `Section ${sectionIndex + 1}, Row ${rowIndex + 1} title can have maximum 24 characters`,
          severity: 'error'
        });
      }

      // WhatsApp API: row description max 72 characters
      if (row.description && row.description.length > 72) {
        errors.push({
          nodeId: node.id,
          message: `Section ${sectionIndex + 1}, Row ${rowIndex + 1} description can have maximum 72 characters`,
          severity: 'error'
        });
      }
    });
  });
}
```

### 7. Message Content Validation
```typescript
// Rule: Message nodes must have content
if (node.type === 'message') {
  const content = node.data.content as string | undefined;
  if (!content || content.trim() === '') {
    errors.push({
      nodeId: node.id,
      message: 'Message node must have content',
      severity: 'error'
    });
  }
}
```

### 8. Condition Configuration Validation
```typescript
// Rule: Condition nodes must have complete configuration
if (node.type === 'condition') {
  // Check new structure first
  const conditionGroup = node.data.conditionGroup as ConditionGroup | undefined;

  if (conditionGroup && conditionGroup.conditions.length > 0) {
    // Validate each condition in the group
    conditionGroup.conditions.forEach((cond, idx) => {
      if (!cond.variable || cond.variable.trim() === '') {
        errors.push({
          nodeId: node.id,
          message: `Condition ${idx + 1}: Must have a variable to check`,
          severity: 'error'
        });
      }

      if (!cond.operator) {
        errors.push({
          nodeId: node.id,
          message: `Condition ${idx + 1}: Must have an operator`,
          severity: 'error'
        });
      }

      if (cond.value === undefined || cond.value === null || cond.value === '') {
        errors.push({
          nodeId: node.id,
          message: `Condition ${idx + 1}: Must have a value to compare`,
          severity: 'warning'
        });
      }
    });
  } else {
    // Fallback to legacy structure for backward compatibility
    const conditionVar = node.data.conditionVar as string | undefined;
    const conditionOp = node.data.conditionOp as string | undefined;
    const conditionVal = node.data.conditionVal as string | undefined;

    if (!conditionVar || conditionVar.trim() === '') {
      errors.push({
        nodeId: node.id,
        message: 'Condition node must have a variable to check',
        severity: 'error'
      });
    }

    if (!conditionOp) {
      errors.push({
        nodeId: node.id,
        message: 'Condition node must have an operator',
        severity: 'error'
      });
    }

    if (conditionVal === undefined || conditionVal === null || conditionVal === '') {
      errors.push({
        nodeId: node.id,
        message: 'Condition node must have a value to compare',
        severity: 'warning'
      });
    }
  }
}
```

**Validation Error Types**:

```typescript
export interface ValidationError {
  nodeId: string;        // Node ID or 'flow' for flow-level errors
  message: string;       // Human-readable error message
  severity: 'error' | 'warning';  // Error blocks save, warning allows save
}
```

**Error Severity Guidelines**:
- **error**: Critical issues that break flow execution (missing required fields, API violations)
- **warning**: Non-critical issues that may affect UX (disconnected buttons, orphan nodes)

**Validation UI**:
```typescript
// Validation panel (bottom-right overlay)
{showValidationPanel && validationErrors.length > 0 && (
  <div className="validation-panel">
    <h3>Validation Issues</h3>
    <div className="errors-list">
      {validationErrors.map((error, index) => (
        <div className={`error-item ${error.severity}`}>
          <span className="icon">{error.severity === 'error' ? 'error' : 'warning'}</span>
          <p>{error.message}</p>
          <p className="node-id">Node: {error.nodeId.slice(0, 8)}</p>
        </div>
      ))}
    </div>
    <div className="summary">
      {validationErrors.filter(e => e.severity === 'error').length} errors,
      {validationErrors.filter(e => e.severity === 'warning').length} warnings
    </div>
  </div>
)}
```

**WhatsApp API Compliance**:
All validation rules align with WhatsApp Business API limitations:
- Button titles: max 20 characters, max 3 buttons
- List section titles: max 24 characters, max 10 sections
- List row titles: max 24 characters, max 10 rows per section
- List row descriptions: max 72 characters

**Best Practices**:
1. Run validation before every save
2. Fix all errors before deployment
3. Review warnings for UX improvements
4. Test flows in Test Mode after validation passes

**AI Integration**:

The builder includes an AI-powered flow generation feature using Google Gemini API. Users can describe their chatbot in natural language, and the AI generates a complete flow structure with nodes and edges.

**Implementation Location**: `/home/ali/whatsapp-builder/frontend/src/features/builder/components/BuilderPage.tsx` (lines 216-262)

**API Configuration**:
```typescript
// Environment variable required: VITE_API_KEY
const apiKey = import.meta.env.VITE_API_KEY;
const ai = new GoogleGenAI({ apiKey });
```

**Model Configuration**:
- **Model**: `gemini-2.0-flash-thinking-exp-1219`
- **Response Format**: JSON with structured nodes and edges
- **Input**: Natural language description of chatbot flow
- **Output**: Complete ReactFlow-compatible graph structure

**Generation Flow**:
```typescript
const generateAIResponse = async () => {
  if (!aiPrompt) return;
  setIsGenerating(true);

  try {
    // 1. Check API key
    const apiKey = import.meta.env.VITE_API_KEY;
    if (!apiKey) {
      alert("Please set VITE_API_KEY in .env file");
      return;
    }

    // 2. Initialize Gemini client
    const ai = new GoogleGenAI({ apiKey });

    // 3. Generate flow from prompt
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-thinking-exp-1219",
      contents: `Create a chatbot flow using React Flow structure. Request: "${aiPrompt}".
        Return JSON with "nodes" and "edges".
        Node types: "start", "message", "question" (w/ questionType: "text"|"buttons"), "condition".
        Coordinates should be spaced out (e.g. x: 0, 300, 600).`,
      config: {
        responseMimeType: "application/json",
      },
    });

    // 4. Parse and apply result
    const text = response.text;
    if (text) {
      const result = JSON.parse(text);
      if (result.nodes) {
        // Map AI nodes to internal structure
        const mappedNodes = result.nodes.map((n: any) => ({
          ...n,
          data: { ...n.data, onConfig: () => {} } // handlers re-attached in render
        }));
        setNodes(mappedNodes);
        if (result.edges) setEdges(result.edges);
        setShowAIModal(false);
      }
    }
  } catch (e) {
    console.error(e);
    alert("Error generating flow.");
  } finally {
    setIsGenerating(false);
  }
};
```

**User Interface**:
```typescript
// AI Build button in header
<button onClick={() => setShowAIModal(true)} className="...">
  <span className="material-symbols-outlined">auto_awesome</span> AI Build
</button>

// Modal dialog
{showAIModal && (
  <div className="modal-overlay">
    <textarea
      placeholder="Describe your bot flow..."
      value={aiPrompt}
      onChange={(e) => setAiPrompt(e.target.value)}
    />
    <button onClick={generateAIResponse} disabled={isGenerating}>
      {isGenerating ? "Thinking..." : "Generate"}
    </button>
  </div>
)}
```

**Expected Output Format**:
```json
{
  "nodes": [
    {
      "id": "start-1",
      "type": "start",
      "position": { "x": 0, "y": 0 },
      "data": { "label": "Start Flow" }
    },
    {
      "id": "msg-1",
      "type": "message",
      "position": { "x": 300, "y": 0 },
      "data": {
        "label": "Welcome Message",
        "content": "Welcome to our chatbot!"
      }
    },
    {
      "id": "q-1",
      "type": "question",
      "position": { "x": 600, "y": 0 },
      "data": {
        "label": "User Choice",
        "questionType": "buttons",
        "content": "What would you like to do?",
        "variable": "user_choice",
        "buttons": ["Option 1", "Option 2"]
      }
    }
  ],
  "edges": [
    { "source": "start-1", "target": "msg-1" },
    { "source": "msg-1", "target": "q-1" }
  ]
}
```

**Prompt Engineering**:
The prompt explicitly specifies:
- **Structure**: ReactFlow-compatible JSON format
- **Node Types**: start, message, question (with questionType), condition
- **Layout**: Spaced coordinates for visual clarity
- **Data Requirements**: Each node type's required fields

**Use Cases**:
1. **Rapid Prototyping**: Quickly generate flow structure from description
2. **Template Generation**: Create common flow patterns (FAQs, booking, support)
3. **Learning Tool**: See how flows are structured
4. **Starting Point**: Generate base flow, then customize in editor

**Limitations**:
- Requires valid VITE_API_KEY environment variable
- Network dependency on Google Gemini API
- Generated flows may need manual refinement
- Character limits on prompt length
- No validation of generated output (done after generation)

**Error Handling**:
```typescript
// Missing API key
if (!apiKey) {
  alert("Please set VITE_API_KEY in .env file");
  return;
}

// API/network errors
catch (e) {
  console.error(e);
  alert("Error generating flow.");
}
```

**Security Considerations**:
- API key stored in environment variable (not committed)
- Client-side API calls (key exposed to browser)
- For production: Consider server-side proxy for API key protection

---

### Feature: Chat (Conversation UI)
**Location**: `/home/ali/whatsapp-builder/frontend/src/features/chat/`

#### Structure
```
chat/
├── components/
│   ├── Sidebar.tsx              # Conversation list
│   ├── ChatWindow.tsx           # Message display + input
│   ├── MessageBubble.tsx        # Individual message component
│   └── messages/
│       ├── ImageMessage.tsx
│       ├── VideoMessage.tsx
│       └── ReactionMessage.tsx
├── ChatPage.tsx                 # Main chat container
└── mockData.ts                  # Dev mock data
```

#### ChatPage Component
**File**: `/home/ali/whatsapp-builder/frontend/src/features/chat/ChatPage.tsx`

**Responsibilities**:
1. **Load Conversations**: Fetch from API on mount
2. **Real-time Sync**: Listen for new messages via Socket.IO
3. **Conversation Selection**: Join/leave Socket.IO rooms
4. **Send Messages**: Optimistic updates + API call
5. **Status Updates**: Update message status (sent → delivered → read)

**State Management**:
```typescript
const [conversations, setConversations] = useState<Conversation[]>([]);
const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

// Use WebSocket hook for real-time events
const { newMessage, messageStatusUpdate } = useWebSocket();
```

**Real-time Message Handling**:
```typescript
// Handle new messages from WebSocket
useEffect(() => {
  if (newMessage) {
    handleNewMessage(newMessage);
  }
}, [newMessage]);

const handleNewMessage = (message: Message) => {
  setConversations(prev => prev.map(c => {
    if (c.id === message.conversationId) {
      // Check for duplicates
      if (c.messages?.some(m => m.id === message.id)) return c;

      return {
        ...c,
        messages: [...(c.messages || []), message],
        lastMessage: extractMessagePreview(message),
        lastMessageAt: message.createdAt,
        unreadCount: c.id !== activeConversationId ? (c.unreadCount || 0) + 1 : 0
      };
    }
    return c;
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
};
```

**Optimistic Updates**:
```typescript
const handleSendMessage = async (content: any) => {
  if (!activeConversationId) return;

  try {
    // Send message and immediately add it to the UI
    const sentMessage = await MessagesService.sendTextMessage(activeConversationId, content);

    // Optimistically add the message to the conversation
    setConversations(prev => prev.map(c => {
      if (c.id === activeConversationId) {
        // Check for duplicates
        if (c.messages?.some(m => m.id === sentMessage.id)) return c;

        return {
          ...c,
          messages: [...(c.messages || []), sentMessage],
          lastMessage: content,
          lastMessageAt: sentMessage.createdAt,
        };
      }
      return c;
    }));
  } catch (error) {
    console.error("Failed to send message:", error);
    alert("Failed to send message");
  }
};
```

**Socket.IO Room Management**:
```typescript
const handleSelectConversation = async (id: string) => {
  // Leave previous conversation room
  if (activeConversationId) {
    socket.emit('conversation:leave', { conversationId: activeConversationId });
  }

  setActiveConversationId(id);

  // Join new conversation room for real-time updates
  socket.emit('conversation:join', { conversationId: id });

  // Load messages
  const messages = await MessagesService.getMessages(id);
  setConversations(prev => prev.map(c =>
    c.id === id ? { ...c, messages, unreadCount: 0 } : c
  ));
};
```

---

### Feature: ChatBots (List & Management)
**Location**: `/home/ali/whatsapp-builder/frontend/src/features/chatbots/`

#### Structure
```
chatbots/
├── components/
│   └── ChatBotsListPage.tsx     # List view with cards
├── api.ts                       # ChatBot API client
└── index.ts
```

#### ChatBotsListPage Component
**Responsibilities**:
1. **List Chatbots**: Fetch and display all chatbots
2. **Status Filter**: Filter by active/archived/draft
3. **Search**: Client-side search by name
4. **Actions**: Edit, delete, toggle active status
5. **Navigation**: Open builder with selected chatbot

**Key Features**:
- **Card-based UI**: Each chatbot displayed as a card
- **Status Badges**: Visual indicators for active/archived/draft
- **Inline Actions**: Edit, delete, toggle active buttons
- **Loading States**: Skeleton loaders during fetch

---

### Feature: Flows (WhatsApp Flows Management)
**Location**: `/home/ali/whatsapp-builder/frontend/src/features/flows/`

#### Structure
```
flows/
├── components/
│   └── FlowsPage.tsx            # Flows management UI
├── api/
│   └── index.ts                 # Flows API client
└── index.ts                     # Public exports
```

#### FlowsPage Component
**File**: `/home/ali/whatsapp-builder/frontend/src/features/flows/components/FlowsPage.tsx`

**Responsibilities**:
1. **Flow Lifecycle Management**: Create, list, update, publish, and delete WhatsApp Flows
2. **Flow JSON Editor**: Modal-based interface with syntax-highlighted JSON editor
3. **Publishing**: Publish Flows to WhatsApp Cloud API
4. **Preview**: Get preview URLs for testing Flows before publishing
5. **Status Tracking**: Display Flow status (DRAFT, PUBLISHED, DEPRECATED, etc.)
6. **Category Management**: Support for 8 WhatsApp Flow categories (SIGN_UP, APPOINTMENT_BOOKING, etc.)

**UI/UX Highlights**:
- **Modern Card Layout**: Responsive grid (1-3 columns) with gradient headers
- **Status Badges**: Color-coded badges (green=PUBLISHED, gray=DRAFT, red=DEPRECATED)
- **Hover Interactions**: Action buttons appear on card hover with smooth transitions
- **Dark Theme Support**: Full dark mode compatibility
- **Empty State**: Beautiful empty state with CTA to create first Flow
- **Modal Workflows**: Separate modals for creation and viewing details

**State Management**:
```typescript
const FlowsPage = () => {
  const [flows, setFlows] = useState<WhatsAppFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<WhatsAppFlow | null>(null);

  // Load flows on mount
  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    try {
      setLoading(true);
      const data = await flowsApi.getAll();
      setFlows(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
};
```

**Flow Card Component**:
```typescript
// Each flow rendered as a card with:
<div className="flow-card">
  {/* Gradient header with status badge and action buttons */}
  <div className="flow-header">
    <span className="status-badge">{flow.status}</span>
    <div className="action-buttons">
      {flow.status === 'DRAFT' && <PublishButton />}
      {flow.previewUrl && <PreviewButton />}
      <DeleteButton />
    </div>
  </div>

  {/* Flow info */}
  <div className="flow-info">
    <h3>{flow.name}</h3>
    <p>{flow.description}</p>
    <div className="categories">
      {flow.categories.map(cat => (
        <span className="category-badge">{cat}</span>
      ))}
    </div>
    <button onClick={() => setSelectedFlow(flow)}>View Details</button>
  </div>
</div>
```

**CreateFlowModal Component**:
```typescript
// Modal with comprehensive form
const CreateFlowModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categories: [],
    flowJson: JSON.stringify(EXAMPLE_FLOW_JSON, null, 2),
    endpointUri: '',
  });
  const [errors, setErrors] = useState({});

  // Validation
  const validateForm = () => {
    - Name required
    - Valid JSON required (parsed to verify)
    - At least one category required
  };

  // 8 WhatsApp Flow Categories
  const categories = [
    'SIGN_UP', 'SIGN_IN', 'APPOINTMENT_BOOKING',
    'LEAD_GENERATION', 'CONTACT_US', 'CUSTOMER_SUPPORT',
    'SURVEY', 'OTHER'
  ];

  // Form fields:
  - Name input (required)
  - Description textarea
  - Category checkboxes (grid layout, min 1)
  - Endpoint URI input (optional)
  - Flow JSON textarea (15 rows, monospace font, required)

  // Submit creates Flow via API
  const handleSubmit = async () => {
    await flowsApi.create(formData);
    onSuccess();
  };
};
```

**FlowDetailsModal Component**:
```typescript
// Read-only modal showing complete Flow details
const FlowDetailsModal = ({ flow, onClose }) => {
  return (
    <div className="modal">
      <h2>{flow.name}</h2>
      <div className="details">
        <div>Status: <StatusBadge status={flow.status} /></div>
        <div>Description: {flow.description}</div>
        <div>Categories: {flow.categories.map(...)}</div>
        <div>WhatsApp Flow ID: {flow.whatsappFlowId}</div>
        <div>Endpoint URI: {flow.endpointUri}</div>
        <div>Created: {flow.createdAt}</div>
        <div>Updated: {flow.updatedAt}</div>
      </div>
    </div>
  );
};
```

**Flow Operations**:
```typescript
// Publish Flow
const handlePublish = async (flowId: string) => {
  try {
    await flowsApi.publish(flowId);
    await loadFlows(); // Refresh to show updated status
  } catch (err) {
    setError(err.message);
  }
};

// Preview Flow
const handlePreview = async (flowId: string) => {
  try {
    const { previewUrl } = await flowsApi.getPreview(flowId);
    window.open(previewUrl, '_blank'); // Opens WhatsApp preview in new tab
  } catch (err) {
    setError(err.message);
  }
};

// Delete Flow (backend handles deprecation automatically)
const handleDelete = async (flowId: string) => {
  if (!confirm('Are you sure?')) return;

  try {
    await flowsApi.delete(flowId); // Backend deprecates if PUBLISHED
    await loadFlows();
  } catch (err) {
    setError(err.message);
  }
};

// Sync from Meta API (NEW)
const handleSyncFromMeta = async () => {
  setSyncing(true);
  try {
    const result = await flowsApi.syncFromMeta();
    setSyncResult(result);
    await loadFlows(); // Refresh list with synced flows
  } catch (err) {
    setError(err.message);
  } finally {
    setSyncing(false);
  }
};
```

**Sync Result Display (NEW)**:
```typescript
// After sync, display summary banner
{syncResult && (
  <div className="sync-result-banner">
    <span className="success-icon">✓</span>
    <span>Sync completed: {syncResult.total} flows found</span>
    <span>{syncResult.created} created, {syncResult.updated} updated, {syncResult.unchanged} unchanged</span>
    <button onClick={() => setSyncResult(null)}>×</button>
  </div>
)}
```

**API Client**:
```typescript
// flows/api/index.ts
export const flowsApi = {
  getAll: () => axios.get('/api/flows'),
  getActive: () => axios.get('/api/flows/active'),
  create: (data) => axios.post('/api/flows', data),
  update: (id, data) => axios.put(`/api/flows/${id}`, data),
  publish: (id) => axios.post(`/api/flows/${id}/publish`),
  getPreview: (id, invalidate = false) =>
    axios.get(`/api/flows/${id}/preview`, { params: { invalidate } }),
  delete: (id) => axios.delete(`/api/flows/${id}`),
  syncFromMeta: () => axios.post('/api/flows/sync'),  // NEW
};

// SyncResult Type (NEW)
export type SyncResult = {
  created: number;
  updated: number;
  unchanged: number;
  total: number;
  flows: WhatsAppFlow[];
};
```

---

### Feature: Nodes (Custom ReactFlow Nodes)
**Location**: `/home/ali/whatsapp-builder/frontend/src/features/nodes/`

#### Structure
```
nodes/
├── StartNode/
│   ├── StartNode.tsx
│   └── index.ts
├── MessageNode/
│   ├── MessageNode.tsx
│   └── index.ts
├── QuestionNode/
│   ├── QuestionNode.tsx
│   └── index.ts
├── ConditionNode/
│   ├── ConditionNode.tsx
│   └── index.ts
├── WhatsAppFlowNode/
│   ├── WhatsAppFlowNode.tsx
│   ├── ConfigModal.tsx          # Flow selection and configuration
│   └── index.ts
└── index.ts                     # Export all node types
```

#### Node Component Pattern
All custom nodes follow the same pattern:

```typescript
import { Handle, Position, NodeProps } from '@xyflow/react';

export const MessageNode = ({ data }: NodeProps) => {
  return (
    <div className="node-wrapper message-node">
      {/* Input handle (target) */}
      <Handle type="target" position={Position.Top} />

      {/* Node content */}
      <div className="node-content">
        <div className="node-icon">
          <span className="material-symbols-outlined">chat</span>
        </div>
        <div className="node-label">{data.label || 'Message'}</div>
        <div className="node-preview">{data.content || 'No content'}</div>
      </div>

      {/* Action buttons */}
      <div className="node-actions">
        <button onClick={() => data.onConfig?.()}>
          <span className="material-symbols-outlined">edit</span>
        </button>
        <button onClick={() => data.onDelete?.()}>
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>

      {/* Output handle (source) */}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
```

**Node Types**:
1. **StartNode**: Entry point, single output
2. **MessageNode**: Displays message content, single output
3. **QuestionNode**: Shows question type (text/buttons/list), multiple outputs for buttons/lists
4. **ConditionNode**: Shows condition expression(s) with AND/OR logic, two outputs (true/false)
   - Supports multiple conditions (up to 5)
   - Displays human-readable preview of logic
   - Shows logical operator (AND/OR) between conditions
5. **WhatsAppFlowNode**: Sends interactive WhatsApp Flow, single output
   - Green-themed node for visual distinction
   - Displays Flow name, CTA button text, and mode (draft/published)
   - Configuration modal for Flow selection and settings

**Handle Configuration**:
```typescript
// Question node with button handles
<Handle type="source" position={Position.Bottom} id="default" />
{data.questionType === 'buttons' && data.buttons?.map((btn, idx) => (
  <Handle
    type="source"
    position={Position.Right}
    id={`btn-${idx}`}
    style={{ top: `${50 + (idx * 30)}px` }}
  />
))}
```

#### WhatsAppFlowNode Component
**File**: `/home/ali/whatsapp-builder/frontend/src/features/nodes/WhatsAppFlowNode/WhatsAppFlowNode.tsx`

The WhatsAppFlowNode is a specialized node type that enables sending interactive WhatsApp Flows as part of a chatbot conversation. It integrates with the Flows Management feature to provide a seamless experience for flow-based interactions.

**Visual Design**:
- **Green Theme**: Distinct green color (#10B981) to differentiate from other nodes
- **Icon**: "article" Material Symbol icon
- **Compact Display**: Shows Flow name, CTA, and mode in a concise format

**Component Structure**:
```typescript
export const WhatsAppFlowNode = ({ data }: NodeProps) => {
  return (
    <div className="node-wrapper whatsapp-flow-node">
      <Handle type="target" position={Position.Top} />

      <div className="node-content">
        <div className="node-icon" style={{ backgroundColor: '#10B981' }}>
          <span className="material-symbols-outlined">article</span>
        </div>
        <div className="node-label">{data.label || 'WhatsApp Flow'}</div>

        {/* Display Flow details */}
        <div className="node-details">
          {data.flowName && <div className="flow-name">{data.flowName}</div>}
          {data.flowCta && <div className="flow-cta">CTA: {data.flowCta}</div>}
          {data.flowMode && (
            <span className={`flow-mode ${data.flowMode}`}>
              {data.flowMode.toUpperCase()}
            </span>
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

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
```

**Configuration Modal**:
The ConfigModal component provides an interface for:
1. **Flow Selection**: Dropdown to select from published Flows
2. **CTA Text**: Button text shown to user (e.g., "Fill Form")
3. **Flow Mode**: Choose between 'draft' (testing) or 'published' (production)
4. **Output Variable**: Variable name to store Flow response data

```typescript
interface FlowNodeConfigProps {
  nodeId: string;
  data: NodeData;
  onSave: (config: Partial<NodeData>) => void;
  onClose: () => void;
}

const ConfigModal = ({ data, onSave, onClose }: FlowNodeConfigProps) => {
  const [flows, setFlows] = useState<WhatsAppFlow[]>([]);
  const [selectedFlowId, setSelectedFlowId] = useState(data.whatsappFlowId);
  const [flowCta, setFlowCta] = useState(data.flowCta || 'Fill Form');
  const [flowMode, setFlowMode] = useState<'draft' | 'published'>(data.flowMode || 'published');
  const [outputVariable, setOutputVariable] = useState(data.flowOutputVariable || 'flowData');

  useEffect(() => {
    // Load active (published) flows
    flowsApi.getActive().then(setFlows);
  }, []);

  const handleSave = () => {
    const selectedFlow = flows.find(f => f.id === selectedFlowId);
    onSave({
      whatsappFlowId: selectedFlowId,
      flowName: selectedFlow?.name,
      flowCta,
      flowMode,
      flowOutputVariable: outputVariable,
    });
    onClose();
  };

  return (
    <div className="config-modal">
      <h3>Configure WhatsApp Flow</h3>

      <div className="form-group">
        <label>Select Flow</label>
        <select value={selectedFlowId} onChange={(e) => setSelectedFlowId(e.target.value)}>
          <option value="">-- Select a Flow --</option>
          {flows.map(flow => (
            <option key={flow.id} value={flow.id}>{flow.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Button Text (CTA)</label>
        <input
          type="text"
          value={flowCta}
          onChange={(e) => setFlowCta(e.target.value)}
          placeholder="e.g., Fill Form"
        />
      </div>

      <div className="form-group">
        <label>Flow Mode</label>
        <select value={flowMode} onChange={(e) => setFlowMode(e.target.value as any)}>
          <option value="draft">Draft (Testing)</option>
          <option value="published">Published (Production)</option>
        </select>
      </div>

      <div className="form-group">
        <label>Output Variable Name</label>
        <input
          type="text"
          value={outputVariable}
          onChange={(e) => setOutputVariable(e.target.value)}
          placeholder="e.g., flowData"
        />
        <small>Variable name to store Flow response in conversation context</small>
      </div>

      <div className="modal-actions">
        <button onClick={handleSave}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};
```

**NodeData Interface Extension**:
```typescript
interface NodeData {
  // ... existing fields ...

  // WhatsApp Flow Node fields
  whatsappFlowId?: string;           // UUID of Flow from database
  flowName?: string;                 // Display name
  flowCta?: string;                  // Button text
  flowMode?: 'draft' | 'published';  // Testing vs production
  flowOutputVariable?: string;        // Variable to store response
}
```

**Integration with ChatBot Execution**:
When a user reaches a WhatsAppFlowNode:
1. Backend loads Flow from database using `whatsappFlowId`
2. Generates `flow_token` containing `{contextId}-{nodeId}`
3. Sends Flow message to user via WhatsApp API
4. Waits for user to complete Flow
5. WhatsApp sends webhook with Flow response
6. Backend extracts response data and saves to `flowOutputVariable`
7. Resumes chatbot execution from next node

---

### Feature: Edges (Custom ReactFlow Edges)
**Location**: `/home/ali/whatsapp-builder/frontend/src/features/edges/`

#### Structure
```
edges/
├── DeletableEdge.tsx          # Deletable edge component with hover effects
└── index.ts                   # Export
```

#### DeletableEdge Component
**File**: `/home/ali/whatsapp-builder/frontend/src/features/edges/DeletableEdge.tsx`

Custom edge component with hover interactions and delete functionality.

**Features**:
- **Hover Effect**: Changes color to red (#ef4444) and increases stroke width on hover
- **Delete Button**: Shows centered button on edge path when hovered
- **Interaction Area**: Invisible wider path (20px) for easier hovering
- **Smooth Transitions**: CSS transitions for color and stroke-width changes
- **Dark Theme Support**: Compatible with dark mode

**Component Structure**:
```typescript
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath, useReactFlow } from '@xyflow/react';

export const DeletableEdge = ({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style
}: EdgeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { setEdges } = useReactFlow();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  });

  const onEdgeDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  return (
    <>
      {/* Invisible wider path for easier hover detection */}
      <path
        d={edgePath}
        strokeWidth={20}
        stroke="transparent"
        fill="none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Visible edge with hover effect */}
      <BaseEdge
        path={edgePath}
        style={{
          ...style,
          stroke: isHovered ? '#ef4444' : '#b1b1b7',
          strokeWidth: isHovered ? 3 : 2,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
      />

      {/* Delete button at edge center (visible on hover) */}
      {isHovered && (
        <EdgeLabelRenderer>
          <button
            onClick={onEdgeDelete}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="edge-delete-button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
```

#### Usage in BuilderPage

**Edge Types Registration**:
```typescript
import { DeletableEdge } from "../../edges";

const edgeTypes = {
  deletable: DeletableEdge,
};
```

**ReactFlow Configuration**:
```typescript
<ReactFlow
  nodes={nodes}
  edges={edges}
  edgeTypes={edgeTypes}
  defaultEdgeOptions={{ type: 'deletable' }}
  // ... other props
/>
```

**Edge Data Transformation**:
- **On Load**: Loaded edges from API automatically get `type: 'deletable'` added
- **AI Generated**: AI-generated edges are mapped to add `type: 'deletable'`
- **New Connections**: Default edge options ensure new edges use deletable type

```typescript
// When loading chatbot from API
const edgesWithType = chatbot.edges.map(edge => ({
  ...edge,
  type: 'deletable',
}));
setEdges(edgesWithType);

// When AI generates flow
if (result.edges) {
  const aiEdges = result.edges.map(edge => ({
    ...edge,
    type: 'deletable',
  }));
  setEdges(aiEdges);
}
```

---

## State Management

### Local Component State
**Primary pattern**: Each component manages its own state using `useState`.

```typescript
const [conversations, setConversations] = useState<Conversation[]>([]);
const [loading, setLoading] = useState(true);
```

### Derived State
**Use `useMemo` for computed values**:

```typescript
const activeConversation = useMemo(() =>
  conversations.find((c) => c.id === activeConversationId),
  [conversations, activeConversationId]
);
```

### Callback Optimization
**Use `useCallback` for event handlers**:

```typescript
const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
  if (node.type !== 'start') {
    setConfigNode(node);
  }
}, []);
```

### Memoized Props
**Use `useMemo` to prevent unnecessary re-renders**:

```typescript
const nodesWithHandler = useMemo(() => {
  return nodes.map(n => ({
    ...n,
    data: {
      ...n.data,
      onConfig: () => setConfigNode(n),
      onDelete: () => deleteNode(n.id)
    }
  }));
}, [nodes, deleteNode]);
```

### State Update Patterns
**Immutable updates with spread operator**:

```typescript
// Update array item
setConversations(prev => prev.map(c =>
  c.id === id ? { ...c, messages: newMessages } : c
));

// Add array item
setMessages(prev => [...prev, newMessage]);

// Update object
setNode(prev => ({ ...prev, data: { ...prev.data, content: newContent } }));
```

---

## Real-time Integration

### Socket.IO Client Setup
**File**: `/home/ali/whatsapp-builder/frontend/src/api/socket.ts`

```typescript
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const socket = io(`${SOCKET_URL}/messages`, {
  autoConnect: false,
  query: {
    userId: 'user-123',  // TODO: Get from auth context
  },
});
```

### Custom WebSocket Hook
**File**: `/home/ali/whatsapp-builder/frontend/src/hooks/useWebSocket.ts`

```typescript
export function useWebSocket(): UseWebSocketReturn {
  const [connected, setConnected] = useState(false);
  const [newMessage, setNewMessage] = useState<Message | null>(null);
  const [messageStatusUpdate, setMessageStatusUpdate] = useState<{
    messageId: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    socket.connect();

    // Connection events
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    // Message events
    socket.on('message:received', (data: any) => {
      // Transform backend DTO to frontend Message type
      const message: Message = {
        id: data.messageId,
        conversationId: data.conversationId,
        senderId: data.senderId,
        type: data.type,
        content: data.content,
        status: data.status,
        timestamp: data.timestamp,
        createdAt: data.timestamp,
        updatedAt: data.timestamp,
      };

      setNewMessage(message);
    });

    socket.on('message:status', (data) => {
      setMessageStatusUpdate(data);
    });

    // Cleanup
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('message:received');
      socket.off('message:status');
      socket.disconnect();
    };
  }, []);

  return { connected, newMessage, messageStatusUpdate };
}
```

### Usage in Components
```typescript
const { newMessage, messageStatusUpdate } = useWebSocket();

// React to new messages
useEffect(() => {
  if (newMessage) {
    handleNewMessage(newMessage);
  }
}, [newMessage]);

// React to status updates
useEffect(() => {
  if (messageStatusUpdate) {
    handleMessageStatusUpdate(messageStatusUpdate.messageId, messageStatusUpdate.status);
  }
}, [messageStatusUpdate]);
```

---

## API Layer

### HTTP Client
**File**: `/home/ali/whatsapp-builder/frontend/src/api/client.ts`

```typescript
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);
```

### API Service Pattern
**File**: `/home/ali/whatsapp-builder/frontend/src/features/chatbots/api.ts`

```typescript
export const getChatBots = async (params?: QueryChatBotsParams) => {
  const queryString = params ? '?' + new URLSearchParams(
    Object.entries(params)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString() : '';

  const response = await client.get<{ data: ChatBot[], total: number }>
    (`/api/chatbots${queryString}`);

  return response.data.data || [];
};

export const createChatBot = async (data: Partial<ChatBot>) => {
  const response = await client.post<ChatBot>('/api/chatbots', data);
  return response.data;
};

export const updateChatBot = async (id: string, data: Partial<ChatBot>) => {
  const response = await client.put<ChatBot>(`/api/chatbots/${id}`, data);
  return response.data;
};
```

---

## Custom Hooks

### useWebSocket
**Purpose**: Manage Socket.IO connection and events
**Returns**: `{ connected, newMessage, messageStatusUpdate }`

### Usage Patterns
```typescript
// In ChatPage
const { newMessage, messageStatusUpdate } = useWebSocket();

useEffect(() => {
  if (newMessage) {
    // Add message to conversation
  }
}, [newMessage]);
```

---

## Component Patterns

### Controlled Components
```typescript
<input
  type="text"
  value={flowName}
  onChange={(e) => setFlowName(e.target.value)}
/>
```

### Callback Props
```typescript
interface Props {
  onSave: (data: any) => void;
  onCancel: () => void;
}

<button onClick={() => onSave(formData)}>Save</button>
```

### Conditional Rendering
```typescript
{loading ? (
  <LoadingSpinner />
) : (
  <ConversationList conversations={conversations} />
)}
```

### List Rendering
```typescript
{conversations.map(conversation => (
  <ConversationCard
    key={conversation.id}
    conversation={conversation}
  />
))}
```

---

## Summary

### Key Architectural Patterns
1. **Feature-based Organization**: Self-contained feature modules
2. **Component Composition**: Small, focused components
3. **Hooks for Logic**: useState, useEffect, useCallback, useMemo
4. **Type Safety**: Full TypeScript coverage
5. **Optimistic UI**: Instant feedback with server reconciliation
6. **Real-time Sync**: Socket.IO for live updates
7. **Centralized API**: Service layer for HTTP requests

### Performance Optimizations
- `useCallback` for event handlers
- `useMemo` for derived state
- `React.memo` for expensive components (where needed)
- Lazy loading for routes (future improvement)
- Code splitting with Vite

### Future Improvements
- Add React Router for cleaner routing
- Implement auth context for user management
- Add Redux/Zustand for complex global state
- Implement infinite scroll for message lists
- Add PWA support for offline capabilities

---

**Next**: See `04-database-design.md` for database architecture.
