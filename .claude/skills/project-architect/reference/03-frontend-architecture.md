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
```typescript
const handleSave = async () => {
  // Validate flow before saving
  const errors = validateFlow(nodes, edges);
  setValidationErrors(errors);

  const hasErrors = errors.some(e => e.severity === 'error');
  const hasWarnings = errors.some(e => e.severity === 'warning');

  if (hasErrors) {
    alert('Flow has validation errors. Please fix them before saving.');
    return;
  }

  // Proceed with save
};
```

**AI Integration**:
```typescript
const generateAIResponse = async () => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-thinking-exp-1219",
    contents: `Create a chatbot flow using React Flow structure. Request: "${aiPrompt}".
      Return JSON with "nodes" and "edges".`,
    config: {
      responseMimeType: "application/json",
    },
  });

  const result = JSON.parse(response.text);
  setNodes(result.nodes);
  setEdges(result.edges);
};
```

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
4. **ConditionNode**: Shows condition expression, two outputs (true/false)

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
