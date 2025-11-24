# Project Structure - WhatsApp Builder

## Complete Directory Tree

```
whatsapp-builder/
├── README.md
├── WEBHOOK_QUICKSTART.md
├── package.json                      # Root monorepo scripts
├── scripts/                          # Development scripts
│   ├── start-webhook-dev.sh
│   ├── stop-webhook.sh
│   └── get-webhook-url.sh
│
├── backend/                          # NestJS backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── ormconfig.ts                  # TypeORM configuration
│   ├── .env                          # Environment variables
│   ├── src/
│   │   ├── main.ts                   # Application entry point
│   │   ├── app.module.ts             # Root module
│   │   ├── app.controller.ts
│   │   ├── app.service.ts
│   │   │
│   │   ├── config/                   # Configuration
│   │   │   ├── config.module.ts
│   │   │   └── database.config.ts
│   │   │
│   │   ├── database/                 # Database module
│   │   │   └── database.module.ts
│   │   │
│   │   ├── entities/                 # TypeORM entities
│   │   │   ├── user.entity.ts
│   │   │   ├── chatbot.entity.ts
│   │   │   ├── conversation.entity.ts
│   │   │   ├── conversation-context.entity.ts
│   │   │   ├── message.entity.ts
│   │   │   └── whatsapp-config.entity.ts
│   │   │
│   │   ├── migrations/               # Database migrations
│   │   │   ├── 1732402800000-CreateWhatsAppConfigTable.ts
│   │   │   ├── 1732459200000-CreateConversationContextTable.ts
│   │   │   └── 1763984202000-RenameFlowsToChatBots.ts
│   │   │
│   │   └── modules/                  # Feature modules
│   │       │
│   │       ├── chatbots/             # ChatBot management
│   │       │   ├── chatbots.module.ts
│   │       │   ├── chatbots.controller.ts
│   │       │   ├── chatbots.service.ts
│   │       │   ├── chatbot-webhook.controller.ts
│   │       │   ├── appointment.service.ts
│   │       │   ├── mock-calendar.service.ts
│   │       │   ├── dto/
│   │       │   │   ├── create-chatbot.dto.ts
│   │       │   │   ├── update-chatbot.dto.ts
│   │       │   │   ├── query-chatbots.dto.ts
│   │       │   │   ├── chatbot-node.dto.ts
│   │       │   │   ├── chatbot-edge.dto.ts
│   │       │   │   ├── node-data.dto.ts
│   │       │   │   ├── node-position.dto.ts
│   │       │   │   └── list-section.dto.ts
│   │       │   └── services/
│   │       │       └── chatbot-execution.service.ts
│   │       │
│   │       ├── conversations/        # Conversation management
│   │       │   ├── conversations.module.ts
│   │       │   ├── conversations.controller.ts
│   │       │   ├── conversations.service.ts
│   │       │   └── dto/
│   │       │       ├── requests/
│   │       │       │   ├── get-messages.dto.ts
│   │       │       │   └── send-message.dto.ts
│   │       │       └── responses/
│   │       │           ├── conversation.response.dto.ts
│   │       │           ├── message.response.dto.ts
│   │       │           └── success.response.dto.ts
│   │       │
│   │       ├── media/                # Media upload
│   │       │   ├── media.module.ts
│   │       │   ├── media.controller.ts
│   │       │   ├── media.service.ts
│   │       │   └── dto/
│   │       │       └── upload-media.dto.ts
│   │       │
│   │       ├── messages/             # Message CRUD
│   │       │   ├── messages.module.ts
│   │       │   ├── messages.controller.ts
│   │       │   └── messages.service.ts
│   │       │
│   │       ├── users/                # User management
│   │       │   ├── users.module.ts
│   │       │   ├── users.controller.ts
│   │       │   └── users.service.ts
│   │       │
│   │       ├── webhooks/             # WhatsApp webhooks
│   │       │   ├── webhooks.module.ts
│   │       │   ├── webhooks.controller.ts
│   │       │   ├── dto/
│   │       │   │   ├── index.ts
│   │       │   │   ├── parsed-message.dto.ts
│   │       │   │   └── webhook-entry.dto.ts
│   │       │   └── services/
│   │       │       ├── index.ts
│   │       │       ├── webhook-parser.service.ts
│   │       │       ├── webhook-processor.service.ts
│   │       │       └── webhook-signature.service.ts
│   │       │
│   │       ├── websocket/            # Socket.IO gateway
│   │       │   ├── websocket.module.ts
│   │       │   ├── messages.gateway.ts
│   │       │   ├── dto/
│   │       │   │   ├── index.ts
│   │       │   │   ├── join-conversation.dto.ts
│   │       │   │   ├── message-received.dto.ts
│   │       │   │   ├── message-status.dto.ts
│   │       │   │   └── typing-indicator.dto.ts
│   │       │   ├── filters/
│   │       │   │   └── ws-exception.filter.ts
│   │       │   └── middleware/
│   │       │       └── ws-auth.middleware.ts
│   │       │
│   │       └── whatsapp/             # WhatsApp API integration
│   │           ├── whatsapp.module.ts
│   │           ├── whatsapp-config.controller.ts
│   │           ├── dto/
│   │           │   └── requests/
│   │           │       ├── create-flow.dto.ts
│   │           │       ├── send-flow-message.dto.ts
│   │           │       ├── send-interactive-message.dto.ts
│   │           │       ├── send-text-message.dto.ts
│   │           │       └── whatsapp-config.dto.ts
│   │           ├── interfaces/
│   │           │   └── message.interface.ts
│   │           └── services/
│   │               ├── whatsapp-api.service.ts
│   │               ├── whatsapp-config.service.ts
│   │               ├── whatsapp-flow.service.ts
│   │               ├── whatsapp-message.service.ts
│   │               └── message-types/
│   │                   ├── flow-message.service.ts
│   │                   ├── interactive-message.service.ts
│   │                   └── text-message.service.ts
│   │
│   └── test/                         # E2E tests
│       ├── app.e2e-spec.ts
│       └── jest-e2e.json
│
└── frontend/                         # React frontend
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    ├── public/
    └── src/
        ├── main.tsx                  # Entry point
        │
        ├── app/                      # Root application
        │   ├── App.tsx
        │   ├── App.css
        │   └── main.tsx
        │
        ├── api/                      # API clients
        │   ├── client.ts             # Axios instance
        │   ├── socket.ts             # Socket.IO client
        │   ├── conversations.service.ts
        │   └── messages.service.ts
        │
        ├── features/                 # Feature modules
        │   │
        │   ├── builder/              # Flow builder
        │   │   ├── components/
        │   │   │   ├── BuilderPage.tsx
        │   │   │   ├── ConfigModals.tsx
        │   │   │   ├── QuestionTypeModal.tsx
        │   │   │   └── FlowTester.tsx
        │   │   ├── utils/
        │   │   │   └── flowValidation.ts
        │   │   └── index.ts
        │   │
        │   ├── chat/                 # Conversation UI
        │   │   ├── ChatPage.tsx
        │   │   ├── mockData.ts
        │   │   └── components/
        │   │       ├── Sidebar.tsx
        │   │       ├── ChatWindow.tsx
        │   │       ├── MessageBubble.tsx
        │   │       └── messages/
        │   │           ├── ImageMessage.tsx
        │   │           ├── VideoMessage.tsx
        │   │           └── ReactionMessage.tsx
        │   │
        │   ├── chatbots/             # ChatBot list
        │   │   ├── api.ts
        │   │   ├── components/
        │   │   │   └── ChatBotsListPage.tsx
        │   │   └── index.ts
        │   │
        │   ├── conversations/        # Conversation list
        │   │   └── api.ts
        │   │
        │   ├── nodes/                # ReactFlow custom nodes
        │   │   ├── StartNode/
        │   │   │   ├── StartNode.tsx
        │   │   │   └── index.ts
        │   │   ├── MessageNode/
        │   │   │   ├── MessageNode.tsx
        │   │   │   └── index.ts
        │   │   ├── QuestionNode/
        │   │   │   ├── QuestionNode.tsx
        │   │   │   └── index.ts
        │   │   ├── ConditionNode/
        │   │   │   ├── ConditionNode.tsx
        │   │   │   └── index.ts
        │   │   └── index.ts
        │   │
        │   ├── users/                # User management
        │   │   ├── api.ts
        │   │   └── components/
        │   │       └── UsersPage.tsx
        │   │
        │   ├── settings/             # App settings
        │   │   ├── api.ts
        │   │   └── WhatsappConfigPage.tsx
        │   │
        │   └── landing/              # Landing page
        │       └── components/
        │           └── LandingPage.tsx
        │
        ├── shared/                   # Shared code
        │   ├── components/           # Reusable UI components
        │   │   └── SideBar.tsx
        │   └── types/                # Shared TypeScript types
        │       └── index.ts
        │
        ├── hooks/                    # Custom React hooks
        │   └── useWebSocket.ts
        │
        ├── types/                    # TypeScript type definitions
        │   └── messages.ts
        │
        ├── utils/                    # Utility functions
        │
        └── styles/                   # Global styles
            └── index.css
```

## Key Directories Explained

### Backend
- **`/src/entities`**: TypeORM entities (database schema)
- **`/src/migrations`**: Database migration files (timestamp-based)
- **`/src/modules`**: Feature modules (chatbots, conversations, webhooks, etc.)
- **`/src/config`**: Application configuration (database, environment)

### Frontend
- **`/src/app`**: Root application component and routing
- **`/src/features`**: Feature modules (builder, chat, chatbots, nodes)
- **`/src/api`**: HTTP and WebSocket client setup
- **`/src/hooks`**: Custom React hooks
- **`/src/shared`**: Shared components and types

### Root
- **`/scripts`**: Development scripts (ngrok webhook setup)
- **`/docs`**: Documentation files
- **`.claude/`**: Claude AI skill configurations

---

## File Naming Conventions

### Backend
- **Entities**: `*.entity.ts` (e.g., `user.entity.ts`)
- **Controllers**: `*.controller.ts` (e.g., `chatbots.controller.ts`)
- **Services**: `*.service.ts` (e.g., `chatbots.service.ts`)
- **DTOs**: `*.dto.ts` (e.g., `create-chatbot.dto.ts`)
- **Modules**: `*.module.ts` (e.g., `chatbots.module.ts`)
- **Migrations**: `{timestamp}-{Name}.ts`

### Frontend
- **Pages**: `*Page.tsx` (e.g., `ChatPage.tsx`, `BuilderPage.tsx`)
- **Components**: PascalCase (e.g., `MessageBubble.tsx`, `Sidebar.tsx`)
- **API**: `api.ts` or `*.service.ts`
- **Hooks**: `use*.ts` (e.g., `useWebSocket.ts`)
- **Types**: `*.ts` (e.g., `messages.ts`)

---

## Import Path Patterns

### Backend (TypeORM paths configured)
```typescript
// Absolute imports
import { ChatBot } from '../../entities/chatbot.entity';
import { ChatBotsService } from './chatbots.service';
import { CreateChatBotDto } from './dto/create-chatbot.dto';
```

### Frontend (Relative imports)
```typescript
// Feature-local imports
import { BuilderPage } from './components/BuilderPage';

// Cross-feature imports
import { getChatBots } from '../../chatbots/api';

// Shared imports
import type { ViewState } from '../../shared/types';

// API imports
import { client } from '../../api/client';
import { socket } from '../../api/socket';
```

---

**Next**: See `08-module-relationships.md` for dependency graph and data flow.
