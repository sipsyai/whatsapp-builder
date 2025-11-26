# WhatsApp Builder - Frontend

Modern React-based frontend application for WhatsApp chatbot builder with visual flow designer.

## Description

The frontend provides an intuitive interface for designing, managing, and monitoring WhatsApp chatbots. Built with React 19 and ReactFlow, it offers a powerful drag-and-drop flow builder, AI-powered flow generation, and real-time session tracking.

## Features

### Flow Builder
- **Visual Drag-and-Drop Interface**
  - Powered by ReactFlow (@xyflow/react)
  - Custom node types with rich configuration
  - Edge validation and connection rules
  - Real-time preview and validation

- **Auto Layout System**
  - Dagre algorithm integration
  - Multiple layout directions (TB, LR, BT, RL)
  - Customizable node spacing
  - One-click layout organization

- **AI-Powered Generation**
  - Google Gemini integration
  - Natural language flow creation
  - Smart node suggestions
  - Context-aware recommendations

- **Node Types**
  - Start Node: Entry point for conversations
  - Message Node: Send text messages
  - Question Node: Ask questions with button/list responses
  - Condition Node: Branching logic based on variables
  - WhatsApp Flow Node: Integrate Meta WhatsApp Flows
  - REST API Node: Fetch data from external APIs

### WhatsApp Flows
- Visual WhatsApp Flow builder
- JSON schema editor
- Real-time validation
- Meta API synchronization
- Flow publishing and preview
- Export/Import functionality

### Session Management
- Real-time session monitoring
- Active/completed session views
- Conversation logs with metadata
- Session timeline visualization
- Variable state tracking
- Session control (stop/resume)

### Real-time Features
- Socket.IO integration
- Live message updates
- Typing indicators
- Online/offline status
- Optimistic UI updates

## Technology Stack

### Core
- **React** 19.2.0 - UI framework
- **TypeScript** 5.9 - Type safety
- **Vite** 7.2.5 - Build tool (Rolldown variant)

### Flow Builder
- **@xyflow/react** 12.3.5 - Visual flow editor
- **Dagre** 0.8.5 - Graph layout algorithm
- **@dnd-kit/core** 6.3.1 - Drag and drop utilities

### Communication
- **Socket.IO Client** 4.8.1 - Real-time messaging
- **Axios** 1.13.2 - HTTP client

### AI Integration
- **@google/genai** 1.30.0 - Google Gemini API

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Backend server running on http://localhost:3000

## Installation

```bash
# Install dependencies
npm install
```

## Environment Variables

Create a `.env` file in the frontend directory:

```bash
# Backend API URL
VITE_API_URL=http://localhost:3000

# WebSocket URL
VITE_WS_URL=http://localhost:3000

# Google Gemini API Key (optional, for AI features)
VITE_GEMINI_API_KEY=your_gemini_api_key
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

The development server will start on `http://localhost:5173`.

## Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── api/               # API client and service layer
│   │   ├── client.ts      # Axios instance
│   │   └── services/      # API service modules
│   │       ├── chatbots.ts
│   │       ├── conversations.ts
│   │       ├── flows.ts
│   │       └── users.ts
│   ├── features/          # Feature-based modules
│   │   ├── builder/       # Flow builder
│   │   │   ├── components/
│   │   │   │   ├── BuilderPage.tsx
│   │   │   │   ├── FlowCanvas.tsx
│   │   │   │   └── NodePalette.tsx
│   │   │   └── utils/
│   │   │       ├── autoLayout.ts
│   │   │       └── validation.ts
│   │   ├── chat/          # Chat interface
│   │   ├── chatbots/      # Chatbot management
│   │   ├── conversations/ # Conversation views
│   │   ├── edges/         # Custom edge components
│   │   ├── flows/         # WhatsApp Flow builder
│   │   ├── landing/       # Landing page
│   │   ├── nodes/         # Custom node components
│   │   │   ├── StartNode/
│   │   │   ├── MessageNode/
│   │   │   ├── QuestionNode/
│   │   │   ├── ConditionNode/
│   │   │   ├── WhatsAppFlowNode/
│   │   │   └── RestApiNode/
│   │   ├── sessions/      # Session tracking
│   │   └── settings/      # Settings pages
│   ├── hooks/             # Custom React hooks
│   │   ├── useWebSocket.ts
│   │   └── useFlowValidation.ts
│   ├── types/             # TypeScript type definitions
│   │   ├── chatbot.ts
│   │   ├── conversation.ts
│   │   ├── message.ts
│   │   └── node.ts
│   ├── utils/             # Utility functions
│   ├── App.tsx            # Root component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Key Components

### BuilderPage
Main flow builder interface with drag-and-drop functionality, auto layout, and AI generation.

**Location:** `/src/features/builder/components/BuilderPage.tsx`

**Features:**
- Node palette for adding new nodes
- Canvas with zoom/pan controls
- Auto layout with direction selection
- AI-powered flow generation
- Save/load flows
- Real-time validation

### Custom Nodes

#### StartNode
Entry point for chatbot conversations.

**Location:** `/src/features/nodes/StartNode/StartNode.tsx`

#### MessageNode
Sends text messages to users.

**Location:** `/src/features/nodes/MessageNode/MessageNode.tsx`

**Configuration:**
- Message text with variable substitution
- Delay before sending

#### QuestionNode
Asks questions with interactive responses.

**Location:** `/src/features/nodes/QuestionNode/QuestionNode.tsx`

**Configuration:**
- Question text
- Response type (buttons/list)
- Options with labels and values

#### ConditionNode
Implements branching logic based on variables.

**Location:** `/src/features/nodes/ConditionNode/ConditionNode.tsx`

**Configuration:**
- Variable to evaluate
- Conditions with operators (equals, contains, greater than, etc.)
- Multiple output edges for different conditions

#### WhatsAppFlowNode
Integrates Meta WhatsApp Flows.

**Location:** `/src/features/nodes/WhatsAppFlowNode/WhatsAppFlowNode.tsx`

**Configuration:**
- Flow selection from synced flows
- CTA button text
- Variable mapping for flow data

#### RestApiNode
Fetches data from external APIs.

**Location:** `/src/features/nodes/RestApiNode/RestApiNode.tsx`

**Configuration:**
- HTTP method (GET, POST, PUT, DELETE)
- API endpoint URL
- Headers and body
- Response variable storage

### Auto Layout System

The auto layout feature uses Dagre algorithm to automatically organize nodes.

**Location:** `/src/features/builder/utils/autoLayout.ts`

**Function:**
```typescript
getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  options?: LayoutOptions
): { nodes: Node[]; edges: Edge[] }
```

**Options:**
- `direction`: 'TB' | 'LR' | 'BT' | 'RL'
- `nodeWidth`: Custom node width
- `nodeHeight`: Custom node height
- `rankSeparation`: Vertical spacing between ranks
- `nodeSeparation`: Horizontal spacing between nodes

**Usage:**
```typescript
const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
  nodes,
  edges,
  { direction: 'TB', rankSeparation: 150 }
);
```

### WebSocket Integration

Real-time communication using Socket.IO.

**Location:** `/src/hooks/useWebSocket.ts`

**Hook:**
```typescript
const {
  socket,
  isConnected,
  sendMessage,
  joinRoom,
  leaveRoom
} = useWebSocket(userId);
```

**Events:**
- `message:received` - New message
- `message:sent` - Message sent confirmation
- `message:delivered` - Delivery status
- `message:read` - Read receipt
- `typing:start` - User typing
- `typing:stop` - User stopped typing

## API Integration

### ChatBots Service

```typescript
import { ChatBotsService } from '@/api/services/chatbots';

// Get all chatbots
const chatbots = await ChatBotsService.getAll();

// Get single chatbot
const chatbot = await ChatBotsService.getById(id);

// Create chatbot
const newChatbot = await ChatBotsService.create({
  name: 'My Bot',
  description: 'Bot description',
  nodes: [],
  edges: []
});

// Update chatbot
const updated = await ChatBotsService.update(id, {
  nodes: updatedNodes,
  edges: updatedEdges
});

// Toggle active status
await ChatBotsService.toggleActive(id);
```

### Conversations Service

```typescript
import { ConversationsService } from '@/api/services/conversations';

// Get all conversations
const conversations = await ConversationsService.getAll();

// Get conversation messages
const messages = await ConversationsService.getMessages(conversationId);

// Send message
await ConversationsService.sendMessage(conversationId, {
  content: 'Hello!',
  type: 'text'
});
```

### Flows Service

```typescript
import { FlowsService } from '@/api/services/flows';

// Get all flows
const flows = await FlowsService.getAll();

// Sync from Meta
await FlowsService.syncFromMeta();

// Publish flow
await FlowsService.publish(flowId);
```

## Development Guidelines

### Adding a New Node Type

1. Create node component in `/src/features/nodes/[NodeType]/`
2. Define node data interface in `/src/types/node.ts`
3. Register node type in BuilderPage
4. Add node to palette configuration
5. Implement configuration panel
6. Add validation rules

Example:
```typescript
// src/features/nodes/CustomNode/CustomNode.tsx
import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

const CustomNode = memo(({ data, id }: NodeProps) => {
  return (
    <div className="custom-node">
      <Handle type="target" position={Position.Top} />
      <div className="node-content">
        {/* Node UI */}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

export default CustomNode;
```

### Adding a New Feature

1. Create feature directory in `/src/features/[feature-name]/`
2. Structure: components, hooks, utils, types
3. Add API service if needed
4. Update routing in App.tsx
5. Add navigation menu item

### State Management

This project uses React hooks and context for state management. No external state management library is required.

**Global State:**
- WebSocket connection (useWebSocket hook)
- User authentication (planned)
- Theme settings (planned)

**Local State:**
- Component state with useState
- Form state with controlled components
- Flow state in BuilderPage

## Performance Optimization

### ReactFlow Optimization
- Memoized node and edge components
- Lazy loading for complex nodes
- Viewport optimization
- Connection line memoization

### API Optimization
- Axios interceptors for auth
- Request caching (planned)
- Debounced auto-save
- Optimistic UI updates

### Bundle Optimization
- Vite code splitting
- Tree shaking
- Dynamic imports for routes
- Asset optimization

## Troubleshooting

### Development Server Issues

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try different port
npm run dev -- --port 5174
```

### WebSocket Connection Issues

```bash
# Check backend is running
curl http://localhost:3000/health

# Verify WebSocket namespace
# Should be http://localhost:3000/messages

# Check browser console for errors
# Look for CORS or connection refused errors
```

### Build Errors

```bash
# Type check
npx tsc --noEmit

# Build with detailed output
npm run build -- --debug

# Preview build locally
npm run preview
```

### ReactFlow Issues

```bash
# If nodes/edges not rendering:
# 1. Check node types are registered
# 2. Verify node IDs are unique
# 3. Check edge source/target exist
# 4. Verify position is set for nodes
```

## Testing

```bash
# Run tests (when implemented)
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Resources

- [React Documentation](https://react.dev)
- [ReactFlow Documentation](https://reactflow.dev)
- [Vite Documentation](https://vite.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)
- [Dagre Wiki](https://github.com/dagrejs/dagre/wiki)
- [Google Gemini API](https://ai.google.dev/)

## Project Documentation

For comprehensive documentation, see:

- [Project Overview](../.claude/skills/project-architect/reference/01-project-overview.md)
- [Frontend Architecture](../.claude/skills/project-architect/reference/03-frontend-architecture.md)
- [Development Guide](../.claude/skills/project-architect/reference/09-development-guide.md)

## Contributing

1. Follow React and TypeScript best practices
2. Use functional components with hooks
3. Write meaningful component names
4. Keep components small and focused
5. Add TypeScript types for all props and data
6. Use CSS modules for component styles
7. Document complex logic with comments

## License

This project is proprietary software. All rights reserved.

## Support

For issues, questions, or contributions, please contact the development team.
