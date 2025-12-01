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
├── contexts/               # React contexts (AuthContext)
├── features/               # Feature modules
│   ├── auth/               # Login page, auth API, types
│   ├── builder/            # ChatBot flow builder (ReactFlow)
│   ├── flow-builder/       # WhatsApp Flow visual builder
│   ├── chat/               # Conversation UI
│   ├── chatbots/           # Chatbot list/management
│   ├── conversations/      # Conversation list
│   ├── flows/              # WhatsApp Flows management
│   ├── data-sources/       # External API configuration
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
- Tailwind CSS v4

### Styling & Theming
- **Dark Mode Only**: Application exclusively uses dark mode (no light mode support)
  - WhatsApp-inspired color scheme
  - All `dark:` Tailwind prefixes removed (default is dark)
  - Custom CSS variables for consistent theming
  - Optimized for low-light messaging environments
- No `darkMode: "class"` in Tailwind config
- Global dark styles defined in `index.css`

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

## Authentication

### AuthContext
**File**: `/frontend/src/contexts/AuthContext.tsx`

**State**:
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

**Methods**:
- `login(credentials)`: Authenticate & store token in localStorage
- `logout()`: Clear token & user, redirect to login
- Token verification on mount via `GET /api/auth/me`

**Usage**:
```typescript
const { user, isAuthenticated, login, logout } = useAuth();
```

### Auth Feature
**Path**: `/frontend/src/features/auth/`

**Components**:
- `LoginPage.tsx`: WhatsApp-themed login form with email/password

**API** (`api.ts`):
```typescript
export const authApi = {
  login(credentials: LoginCredentials): Promise<AuthResponse>,
  getProfile(): Promise<User>,
  logout(): void, // Clear localStorage
};
```

**Types** (`types.ts`):
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  expiresIn: number; // 604800 (7 days)
  user: User;
}
```

### Protected Routes (App.tsx)
```typescript
function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AppRouter />;
}
```

### Axios Interceptor
**File**: `/frontend/src/api/client.ts`

```typescript
// Request: Attach token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response: Handle 401
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
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
- **Create with Playground**: Visual flow creation via Playground UI
- Publish/deprecate lifecycle management
- **Sync from Meta**: Import flows from Meta/Facebook API
- Preview URL generation
- Flow JSON editor
- **Import/Export**: Backup, share, and migrate flows as JSON files

**Import/Export Feature** (NEW - 2025-12-01):
- **Export**: Download flow configuration as JSON file
  - Includes flow JSON, categories, status, endpoint, metadata
  - Optionally includes linked DataSource info
  - Generates timestamped filename
- **Import**: Upload JSON file to create new flow
  - Validates JSON structure and version
  - Auto-generates unique name if duplicate
  - Optionally creates flow in Meta API
  - Shows warnings for missing DataSources

**Create with Playground**:
- Button in FlowsPage header opens FlowPlaygroundPage in create mode
- SaveFlowModal collects flow name + categories (min 1)
- Creates flow via `POST /api/flows/from-playground`
- Supports WhatsApp Flow Categories: SIGN_UP, SIGN_IN, APPOINTMENT_BOOKING, etc.

**File Paths**:
- List: `features/flows/FlowsPage.tsx`
- Create: `features/flows/components/CreateFlowModal.tsx`
- Save Modal: `features/flow-builder/components/playground/modals/SaveFlowModal.tsx`
- API Client: `features/flows/api/index.ts`

### 6. Flow Builder (WhatsApp Flows)
**Path**: `/frontend/src/features/flow-builder/`

**Purpose**: Visual builder for WhatsApp Flows (separate from ChatBot builder)

**Components**:
- `FlowBuilderPage.tsx`: Full visual builder with canvas
- `FlowPlaygroundPage.tsx`: Interactive playground UI for flow testing/creation

**FlowPlaygroundPage Features**:
- **Mode Support**: `'create'` for new flows, `'edit'` for existing flows
- **Create Mode**: Opens SaveFlowModal to collect name + categories before saving
- **Edit Mode**: Saves directly without modal (uses existing metadata)
- Real-time WhatsApp preview with iPhone frame
- 3-panel layout: Screens → Editor → Preview
- **Navigate Action Screen Dropdown**: **NEW** - When Navigate action is selected in Footer editor, displays dropdown with all available screens from the current flow

**State Management**:
- `usePlaygroundState`: Manages screens, components, selection
- `usePreviewSettings`: Preview configuration
- `mode` prop determines save behavior

**File Paths**:
- Playground: `features/flow-builder/FlowPlaygroundPage.tsx`
- Save Modal: `features/flow-builder/components/playground/modals/SaveFlowModal.tsx`
- Hooks: `features/flow-builder/components/playground/hooks/`
- DataSource Selector: `features/flow-builder/components/playground/ContentEditor/DataSourceSelector.tsx`
- Dropdown Editor: `features/flow-builder/components/playground/ContentEditor/editors/DropdownEditor.tsx`
- Footer Editor: `features/flow-builder/components/playground/ContentEditor/editors/FooterEditor.tsx`

**FooterEditor Component Enhancements**:
- **Navigate Action Screen Selection**: When user selects "navigate" action for a footer button:
  - Automatically displays a "Target Screen" dropdown
  - Dropdown is populated with all screen IDs from the current flow (`Object.keys(screens)`)
  - Selected screen ID is stored in `button.navigate.navigate.next`
  - Provides user-friendly screen selection instead of manual ID entry
  - Improves UX and reduces errors in screen navigation configuration

**Data Source Integration in Playground**:
- **DataSourceSelector Component** (NEW): Enables per-dropdown data source configuration
  - Displays "Fill from Data Source" toggle
  - Data Source selection dropdown
  - Endpoint, dataKey, transform field configuration
  - Cascading support via dependsOn + filterParam
- **DropdownEditor Enhancement**: Integrates DataSourceSelector
  - When enabled: Sets `data-source` to dynamic binding (`${data.componentName}`)
  - Stores config in `__dataSourceConfig` for export
  - When disabled: Manual static options

### 7. User Management
**Path**: `/frontend/src/features/users/`

**Components**:
- `UsersPage.tsx`: Main user management interface with table view
- `api.ts`: User API service functions

**Features**:
- **Full CRUD Operations**:
  - Create new users via modal form
  - Edit existing users with pre-filled modal
  - Delete users with confirmation dialog
  - View all users in sortable table
- **Form Validation**:
  - Client-side validation (name required, email format)
  - Real-time error messages with red border on invalid fields
  - Error clearing as user types
  - Submit button disabled when validation fails
- **Security**:
  - Self-deletion prevention (multi-layer)
  - Delete button disabled for current user
  - Frontend JavaScript check prevents API calls
  - Tooltip explains why delete is disabled
  - Backend validation returns 403 Forbidden
- **UI/UX**:
  - User avatar circles (first letter of name/email)
  - Edit/delete action buttons with hover effects
  - Modal forms with backdrop blur effect
  - Inline error messages below form fields
  - Loading states and error handling
  - Dark mode optimized with WhatsApp color scheme

**State Management**:
```typescript
- users: User[]                    // List of all users
- loading: boolean                 // Loading state
- error: string | null            // Error message
- showModal: boolean              // Create user modal visibility
- showEditModal: boolean          // Edit user modal visibility
- editingUser: User | null        // User being edited
- validationErrors: {             // Form validation errors
    name?: string,
    email?: string
  }
```

**API Service Functions**:
- `getUsers()`: Fetch all users (GET /api/users)
- `createUser(data)`: Create user (POST /api/users)
- `updateUser(id, data)`: Update user (PATCH /api/users/:id)
- `deleteUser(id)`: Delete user (DELETE /api/users/:id)

**Validation Logic**:
```typescript
// Name validation
if (!name.trim()) {
  errors.name = 'Name is required';
}

// Email validation
if (!email.trim()) {
  errors.email = 'Email is required';
} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  errors.email = 'Please enter a valid email address';
}
```

**Security Implementation**:
```typescript
// Self-deletion check
const handleDelete = async (id: string) => {
  if (currentUser && currentUser.id === id) {
    alert('You cannot delete your own account');
    return;
  }
  // ... deletion logic
};

// Disabled delete button
<button
  disabled={currentUser?.id === user.id}
  onClick={() => handleDelete(user.id)}
>
```

**File Paths**:
- Main page: `features/users/components/UsersPage.tsx`
- API service: `features/users/api.ts`

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
  exportChatbot: (id, includeFlows) => apiClient.get(`/api/chatbots/${id}/export`, {
    params: { includeFlows },
    responseType: 'blob'
  }),
  importChatbot: (file, options) => apiClient.post('/api/chatbots/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};
```

### Available Services
- `chatbots.service.ts`: ChatBot CRUD, import/export
- `flows.service.ts`: WhatsApp Flows CRUD, publish, sync, createFromPlayground, **import/export**
- `conversations.service.ts`: Conversations & messages
- `users.service.ts`: User management
- `whatsapp-config.service.ts`: WhatsApp config

**New API Methods**:
```typescript
// flows.service.ts - Create from Playground
flowsApi.createFromPlayground({
  name: string,
  categories: WhatsAppFlowCategory[],
  playgroundJson: any,
  description?: string,
  endpointUri?: string,
  autoPublish?: boolean,
  dataSourceId?: string,
  dataSourceConfig?: ComponentDataSourceConfig[]
}): Promise<WhatsAppFlow>

// flows.service.ts - Validate Flow JSON
flowsApi.validate({
  flowJson: any,
  flowId?: string,
  name?: string
}): Promise<FlowValidationResult>

// flows.service.ts - Export Flow (NEW)
flowsApi.exportFlow(id: string, includeMetadata?: boolean): Promise<Blob>

// flows.service.ts - Import Flow (NEW)
flowsApi.importFlow(file: File, options?: {
  name?: string,
  createInMeta?: boolean
}): Promise<ImportFlowResponse>
```

**Import/Export Types** (NEW):
```typescript
interface ImportFlowResponse {
  success: boolean;
  message: string;
  flowId?: string;
  flowName?: string;
  importedAt: string;
  warnings?: string[];
  whatsappFlowId?: string;
}
```

**IMPORTANT - Content-Type for File Uploads**:
When uploading files via FormData, set `Content-Type` to `undefined` to let the browser automatically set the correct `multipart/form-data` header with boundary:
```typescript
const response = await client.post('/api/flows/import', formData, {
  headers: { 'Content-Type': undefined }
});
```

**Component Data Source Config Type** (NEW):
```typescript
interface ComponentDataSourceConfig {
  componentName: string;    // Component name in Flow JSON
  dataSourceId: string;     // DataSource UUID
  endpoint: string;         // API endpoint path
  dataKey: string;          // Key to extract array
  transformTo: {
    idField: string;        // Field for dropdown ID
    titleField: string;     // Field for dropdown title
    descriptionField?: string;
  };
  dependsOn?: string;       // For cascading (parent field name)
  filterParam?: string;     // Filter parameter for cascading
}
```

**File Paths**: `/frontend/src/api/*.service.ts` or `/frontend/src/features/*/api/`

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

## DataSources Feature

**Path**: `/frontend/src/features/data-sources/`

**Purpose**: UI for managing external API configurations (replaces hardcoded credentials).

### Components

**DataSourcesPage.tsx** - Main management page
- **Table View**: List all data sources with name, type, URL, auth type, status
- **Create/Edit Modal**: Form for adding/updating data sources
- **Delete Confirmation**: Warn before deletion
- **Test Connection**: Real-time connection testing with response time
- **Test Custom Endpoint**: **NEW** - Inline expandable panel for endpoint testing

**TestConnectionPanel.tsx** - **NEW** - Inline endpoint testing component
- **Method Selector**: HTTP method dropdown (GET/POST/PUT/PATCH/DELETE)
- **Endpoint Input**: Path input with placeholder
- **Body Editor**: JSON textarea for POST/PUT/PATCH requests
- **Response Display**: Formatted JSON with syntax highlighting
- **Status Indicators**: Success/error icons, status code, response time

### API Client

**File**: `api.ts`

**Types**:
```typescript
type DataSourceType = 'REST_API' | 'STRAPI' | 'GRAPHQL';
type AuthType = 'NONE' | 'BEARER' | 'API_KEY' | 'BASIC';

interface DataSource {
  id: string;
  name: string;
  description?: string;
  type: DataSourceType;
  baseUrl: string;
  authType: AuthType;
  authToken?: string;
  authHeaderName?: string;
  isActive: boolean;
  timeout?: number;
  createdAt: string;
  updatedAt: string;
}
```

**Functions**:
- `getAll()`: Fetch all data sources
- `getActiveDataSources()`: Fetch only active sources
- `create(dto)`: Create new data source
- `update(id, dto)`: Update existing
- `delete(id)`: Delete data source
- `testConnection(id)`: Test connectivity
- `testEndpoint(id, request)`: **NEW** - Test custom endpoint with method/params/body

### UI Features

**Form Fields**:
- Name (text, required)
- Description (textarea, optional)
- Type (select: REST_API, STRAPI, GRAPHQL)
- Base URL (text with URL validation)
- Auth Type (select: NONE, BEARER, API_KEY, BASIC)
- Auth Token (password field, conditional on auth type)
- Auth Header Name (text, required for API_KEY)
- Timeout (number, default 30000ms)
- Is Active (toggle switch)

**Conditional Logic**:
- Auth token field shown only if auth type is not NONE
- Auth header name required only for API_KEY type
- Form validation prevents submission if required fields empty

**Test Connection**:
- Button per row in table
- Loading spinner during test
- Toast notification with result (success/error)
- Shows response time on success

**Test Custom Endpoint (NEW)**:
- "Test Endpoint" button per row
- Inline expandable panel below row
- Method selector (GET/POST/PUT/PATCH/DELETE)
- Endpoint path input field
- Conditional body field (for POST/PUT/PATCH)
- JSON validation for request body
- Test button with loading state
- Inline result display:
  - Success/error icon
  - HTTP status code
  - Response time in ms
  - Formatted JSON response or error message

### Integration with Builder

**ConfigWhatsAppFlow Modal** (in builder/ConfigModals.tsx):
- **Flow Selector**: Dropdown of published WhatsApp Flows
- **Manual Flow ID**: Text input for override
- **DataSource Selector**: Dropdown of active data sources
- Selected data source saved to node's `dataSourceId` field
- DataSource linked to WhatsApp Flow for dynamic data fetching

### Navigation

**Sidebar**: Added "Data Sources" menu item with storage icon
**Route**: `/data-sources` → DataSourcesPage component

### Styling

- Dark theme matching WhatsApp Builder design
- Green accent color for primary actions
- Responsive table layout
- Material Symbols icons
- Tailwind CSS v4

### Usage Flow

1. Navigate to Data Sources page
2. Click "Add Data Source"
3. Fill form (name, type, URL, auth)
4. Click "Save"
5. Test connection to verify
6. Use in WhatsApp Flow node configuration

### File Structure
```
frontend/src/features/data-sources/
├── components/
│   └── DataSourcesPage.tsx      # Main page component
├── api.ts                        # API client & types
├── index.ts                      # Public exports
└── README.md                     # Feature documentation
```

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
- **Pages**: 9 (Landing, Builder, Chat, ChatBots, Flows, DataSources, Sessions, Users, Settings)
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
