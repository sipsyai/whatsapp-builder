# Frontend Architecture - WhatsApp Builder

## Overview

React 19.2.x SPA with Vite, feature-based organization, and real-time Socket.IO integration.

### Principles
1. Feature-based Organization (not by type)
2. Component Composition
3. Type Safety (TypeScript strict mode)
4. Real-time First (Socket.IO)
5. Declarative UI (React hooks)
6. Optimistic Updates

### Structure
```
frontend/src/
├── app/                    # App.tsx (routing), main.tsx
├── features/               # Feature modules
│   ├── builder/            # ChatBot flow builder (ReactFlow)
│   ├── flow-builder/       # WhatsApp Flow visual builder
│   ├── chat/               # Conversation UI
│   ├── chatbots/           # Chatbot list/management
│   ├── conversations/      # Conversation list
│   ├── flows/              # WhatsApp Flows management
│   ├── sessions/           # Session tracking
│   ├── nodes/              # Custom ReactFlow nodes (5 types)
│   ├── edges/              # Custom ReactFlow edges
│   ├── users/, settings/, landing/
├── api/                    # Axios clients, Socket.IO
├── hooks/                  # useWebSocket, useFlowValidation
├── shared/                 # Reusable components, types
└── vite.config.ts          # Vite configuration
```

---

## Technology Stack

### Core
- React 19.2.0, TypeScript 5.9.x, Vite 7.x (Rolldown)
- CSS with CSS Variables for theming

### Flow Builder
- @xyflow/react 12.3.5 (ReactFlow v12)
- dagre 0.8.5 (auto-layout algorithm)

### Communication
- socket.io-client 4.8.1
- Axios 1.13.2

### AI
- @google/genai 1.30.0 (Gemini API for AI-generated flows)

---

## Core Type Definitions

**File**: `/frontend/src/shared/types/index.ts`

### Condition Types
```typescript
interface Condition {
    id: string;           // "cond-0", "cond-1"
    variable: string;     // Variable from Question nodes
    operator: string;     // ==, !=, >, <, >=, <=, contains, not_contains
    value: string;
}

interface ConditionGroup {
    conditions: Condition[];           // Max 5 conditions
    logicalOperator: 'AND' | 'OR';
}
```

### Node Data Types
```typescript
interface NodeData {
    label: string;
    type?: NodeDataType;  // "start" | "message" | "question" | "condition" | "whatsapp_flow" | "rest_api"
    content?: string;
    variable?: string;

    // Condition Node
    conditionGroup?: ConditionGroup;          // New multi-condition
    conditionVar/Op/Val?: string;             // Legacy single condition

    // Question Node
    questionType?: "text" | "buttons" | "list";
    headerText?, footerText?: string;
    buttons?: ButtonItem[];                    // Max 3
    listButtonText?: string;
    listSections?: SectionItem[];              // Max 10

    // Dynamic Lists/Buttons
    dynamicListSource?, dynamicButtonsSource?: string;
    dynamicLabelField?, dynamicDescField?: string;

    // WhatsApp Flow Node
    whatsappFlowId?: string;
    flowCta?, flowMode?, flowOutputVariable?: string;

    // REST API Node
    apiUrl?, apiMethod?, apiBody?: string;
    apiHeaders?: Record<string, string>;
    apiOutputVariable?, apiResponsePath?, apiErrorVariable?: string;
    apiTimeout?: number;

    // Component callbacks
    onConfig?, onDelete?: () => void;
}
```

### Interactive Message Types
```typescript
interface ButtonItem {
    id: string;      // Frontend: "btn_0", Backend fallback: "btn-0"
    title: string;   // Max 20 chars
}

interface RowItem {
    id: string;          // "row-0"
    title: string;       // Max 24 chars
    description?: string; // Max 72 chars
}

interface SectionItem {
    id: string;          // "section-0"
    title: string;       // Max 24 chars
    rows: RowItem[];     // Max 10
}
```

**WhatsApp Limits**: Buttons (max 3, 20 chars), Lists (max 10 rows/section, 24/72 char titles/desc)

---

## Application Structure

### Root Component: App.tsx
**File**: `/frontend/src/app/App.tsx`

**Routing**: State-based (no React Router)
```typescript
const [view, setView] = useState<ExtendedViewState>("chatbots");
const [selectedChatBot, setSelectedChatBot] = useState<ChatBot | null>(null);

<ReactFlowProvider>
  {view !== "landing" && <SideBar currentView={view} onNavigate={setView} />}
  {view === "landing" && <LandingPage />}
  {view === "builder" && <BuilderPage initialFlow={selectedChatBot} />}
  {view === "chat" && <ChatPage />}
  {view === "chatbots" && <ChatBotsListPage onLoadChatBot={...} />}
  {/* ... */}
</ReactFlowProvider>
```

---

## Key Features

### 1. Flow Builder
**Path**: `/frontend/src/features/builder/`

**Components**:
- `BuilderPage.tsx`: Main canvas, drag-and-drop, validation, AI generation, auto-layout
- `ConfigModals.tsx`: Node configuration modals
- `QuestionTypeModal.tsx`: Interactive message type selector
- `FlowTester.tsx`: In-app flow testing

**Utils**:
- `flowValidation.ts`: Validates nodes/edges (checks START node, dead ends, disconnected nodes)
- `autoLayout.ts`: Dagre-based layout with 4 directions (TB, LR, BT, RL)

**Key Features**:
- **5 Node Types**: Start, Message, Question, Condition, WhatsAppFlow, RestApi
- **Validation**: Real-time error panel, pre-save validation
- **AI Generation**: Gemini-powered flow from natural language prompt
- **Auto Layout**: Dagre algorithm with configurable spacing and direction
- **Dynamic Interactions**: Data-driven buttons/lists from variables or API responses
- **Multi-Condition Logic**: Up to 5 conditions with AND/OR operators

**File Paths**:
- Builder: `features/builder/components/BuilderPage.tsx`
- Config: `features/builder/components/ConfigModals.tsx`
- Validation: `features/builder/utils/flowValidation.ts`
- Auto-layout: `features/builder/utils/autoLayout.ts`

### 2. Custom Nodes
**Path**: `/frontend/src/features/nodes/`

**5 Node Types**:
1. **StartNode**: Entry point (blue circle)
2. **MessageNode**: Send text message (blue box)
3. **QuestionNode**: Interactive message (green box) - text/buttons/list
4. **ConditionNode**: Branch logic (yellow diamond) - multi-condition with AND/OR
5. **WhatsAppFlowNode**: Native WhatsApp Flow (purple box)
6. **RestApiNode**: **NEW** - REST API integration (orange box)

**Common Features**:
- Delete button (top-right "×")
- Config button (click node)
- Custom handles (connection points)
- Node-specific icons

**File Pattern**: `features/nodes/[NodeType]/[NodeType].tsx`

### 3. Chat Interface
**Path**: `/frontend/src/features/chat/`

**Components**:
- `ChatPage.tsx`: Main chat UI with conversation list & message window
- `ConversationList.tsx`: List of conversations with last message preview
- `ChatWindow.tsx`: Message display, input, typing indicator
- `MessageBubble.tsx`: Renders different message types (text, interactive, flow)

**Real-time Features**:
- Socket.IO connection for instant message updates
- Typing indicators
- Online/offline status
- Optimistic UI updates
- Message status (sent/delivered/read)

**File Paths**:
- Main: `features/chat/ChatPage.tsx`
- Window: `features/chat/components/ChatWindow.tsx`
- Bubble: `features/chat/components/MessageBubble.tsx`

### 4. Session Tracking
**Path**: `/frontend/src/features/sessions/`

**Components**:
- `SessionsPage.tsx`: List of all chatbot sessions
- `SessionDetailModal.tsx`: Detailed session view with messages & flow visualization

**Features**:
- Real-time session updates via Socket.IO
- Session status (active/completed)
- Message timeline with bot/user distinction
- Current node indicator
- Session duration

**Socket.IO Events**:
- `session:join`, `session:leave`
- `session:message-sent`, `session:node-executed`
- `session:status-changed`, `session:completed`

**File Paths**:
- List: `features/sessions/SessionsPage.tsx`
- Detail: `features/sessions/components/SessionDetailModal.tsx`

### 5. WhatsApp Flows Management
**Path**: `/frontend/src/features/flows/`

**Components**:
- `FlowsPage.tsx`: List of WhatsApp Flows
- `CreateFlowModal.tsx`: Create new Flow
- `FlowPreviewModal.tsx`: Preview Flow in WhatsApp sandbox

**Features**:
- Create, update, delete Flows
- Publish/deprecate lifecycle management
- **Sync from Meta**: Import flows from Meta/Facebook API
- Preview URL generation
- Flow JSON editor

**File Paths**:
- List: `features/flows/FlowsPage.tsx`
- Create: `features/flows/components/CreateFlowModal.tsx`

### 6. Flow Builder (WhatsApp Flows)
**Path**: `/frontend/src/features/flow-builder/`

**Purpose**: Visual builder for WhatsApp Flows (separate from ChatBot builder)

**Status**: Under development

---

## State Management

### Patterns Used
1. **Local State**: `useState` for component-specific state
2. **Prop Drilling**: Parent manages state, children notify via callbacks
3. **ReactFlow Context**: Global ReactFlow state via `ReactFlowProvider`
4. **No Global Store**: Redux/Zustand not needed for MVP

### Example: BuilderPage State
```typescript
const [nodes, setNodes, onNodesChange] = useNodesState([]);
const [edges, setEdges, onEdgesChange] = useEdgesState([]);
const [validationErrors, setValidationErrors] = useState<string[]>([]);
const [selectedNode, setSelectedNode] = useState<Node | null>(null);
```

---

## Real-time Integration

### Socket.IO Setup
**File**: `/frontend/src/api/socket.ts`

```typescript
export const socket = io('http://localhost:3000/messages', {
  query: { userId: BUSINESS_USER_ID },
  transports: ['websocket'],
});
```

### useWebSocket Hook
**File**: `/frontend/src/hooks/useWebSocket.ts`

**Features**:
- Auto-connect/disconnect on mount/unmount
- Event subscription management
- Duplicate message prevention
- Connection status tracking

**Usage**:
```typescript
const { isConnected, emit } = useWebSocket({
  onMessageReceived: (msg) => { /* ... */ },
  onMessageStatus: (status) => { /* ... */ },
  onUserOnline: (userId) => { /* ... */ },
});
```

**Events**:
- **Received**: message:received, message:status, user:online/offline
- **Emitted**: conversation:join, typing:start/stop, session:join

---

## API Layer

### HTTP Client
**File**: `/frontend/src/api/client.ts`

```typescript
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});
```

### Service Pattern
**Example**: `api/chatbots.service.ts`
```typescript
export const ChatBotsService = {
  getAll: (params?) => apiClient.get('/api/chatbots', { params }),
  getById: (id) => apiClient.get(`/api/chatbots/${id}`),
  create: (data) => apiClient.post('/api/chatbots', data),
  update: (id, data) => apiClient.put(`/api/chatbots/${id}`, data),
  delete: (id) => apiClient.delete(`/api/chatbots/${id}`),
  updateStatus: (id, status) => apiClient.patch(`/api/chatbots/${id}/status`, { status }),
  testRestApi: (config) => apiClient.post('/api/chatbots/test-rest-api', config),
};
```

### Available Services
- `chatbots.service.ts`: ChatBot CRUD
- `flows.service.ts`: WhatsApp Flows CRUD, publish, sync
- `conversations.service.ts`: Conversations & messages
- `users.service.ts`: User management
- `whatsapp-config.service.ts`: WhatsApp config

**File Paths**: `/frontend/src/api/*.service.ts`

---

## Custom Hooks

### useFlowValidation
**Purpose**: Validate ReactFlow nodes & edges

**Returns**: `{ errors: string[], validateFlow: () => boolean }`

**Checks**:
- START node exists & unique
- No disconnected nodes
- No dead ends (except END markers)
- Node data validation (required fields)

### useWebSocket
**Purpose**: Socket.IO connection management

**Returns**: `{ isConnected: boolean, emit: (event, data) => void }`

**File**: `/frontend/src/hooks/useWebSocket.ts`

---

## Component Patterns

### Modal Pattern
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: T) => void;
  data?: T;
}
```

### List + Detail Pattern
```typescript
// Parent manages selection
const [selectedItem, setSelectedItem] = useState<T | null>(null);

<ListView onSelect={setSelectedItem} />
{selectedItem && <DetailView item={selectedItem} onClose={() => setSelectedItem(null)} />}
```

### Optimistic Update Pattern
```typescript
// 1. Update UI immediately
const optimisticMessage = { id: tempId, ...newMessage, status: 'sending' };
setMessages(prev => [...prev, optimisticMessage]);

// 2. Send to server
const result = await api.sendMessage(newMessage);

// 3. Replace with server response
setMessages(prev => prev.map(m => m.id === tempId ? result : m));
```

---

## Build & Development

### Vite Configuration
**File**: `/frontend/vite.config.ts`

**Key Settings**:
- Rolldown builder (faster than Rollup)
- React plugin with Fast Refresh
- Proxy API requests to backend (dev mode)
- Environment variable handling (`VITE_*`)

### Scripts
```bash
npm run dev        # Dev server (port 5173)
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # ESLint check
```

### Environment Variables
```bash
VITE_API_URL=http://localhost:3000          # Backend URL
VITE_BUSINESS_USER_ID=uuid                  # Bot user ID
VITE_GEMINI_API_KEY=your_key                # AI generation
```

---

## File Organization Best Practices

### Feature Module Structure
```
features/[feature-name]/
├── components/              # Feature-specific components
│   ├── [Feature]Page.tsx   # Main page component
│   └── [Component].tsx     # Sub-components
├── utils/                   # Feature-specific utilities
├── types/                   # Feature-specific types
└── index.ts                 # Public exports
```

### Shared vs Feature-Specific
- **Shared**: Used by 3+ features → `src/shared/`
- **Feature-Specific**: Used within 1 feature → `features/[name]/`

---

## Key Architectural Decisions

1. **No React Router**: Simple state-based routing for MVP
2. **Feature-based Organization**: Scalability & maintainability
3. **Local State Management**: No Redux/Zustand needed
4. **ReactFlow for Flow Builder**: Mature library with excellent DX
5. **Socket.IO for Real-time**: Bidirectional, room-based messaging
6. **Optimistic Updates**: Better UX with server reconciliation
7. **TypeScript Strict Mode**: Type safety from day one
8. **Vite + Rolldown**: Fastest dev/build experience

---

## Summary

### Component Count
- **Pages**: 8 (Landing, Builder, Chat, ChatBots, Flows, Sessions, Users, Settings)
- **Custom Nodes**: 6 (Start, Message, Question, Condition, WhatsAppFlow, RestApi)
- **Modals**: 10+ (Config, Create, Preview, Detail)

### Lines of Code (approx)
- BuilderPage: ~800 lines
- ChatPage: ~400 lines
- Custom Nodes: ~150 lines each
- Shared Types: ~200 lines

### Performance
- React 19 Concurrent Features (automatic batching)
- Memoization with `useMemo`, `useCallback`
- Code splitting (dynamic imports)
- Optimistic UI updates

---

**See Also**:
- [Backend Architecture](02-backend-architecture.md) - API endpoints
- [Real-time System](05-real-time-system.md) - Socket.IO events
- [Project Structure](07-project-structure.md) - Full file tree
- [Auto Layout Feature](14-chatbot-builder-auto-layout.md) - Dagre implementation
