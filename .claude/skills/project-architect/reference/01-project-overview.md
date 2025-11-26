# Project Overview - WhatsApp Builder

## Table of Contents
- [Introduction](#introduction)
- [Project Goals](#project-goals)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Project Statistics](#project-statistics)

---

## Introduction

**WhatsApp Builder** is a comprehensive chatbot platform that enables visual flow design and automated conversation management for WhatsApp Business API. The platform combines a powerful visual flow builder with real-time conversation handling, providing a complete solution for building, deploying, and managing WhatsApp chatbots.

### Core Value Proposition
- **Visual Flow Design**: Drag-and-drop interface using ReactFlow for creating conversation flows
- **Real-time Communication**: Socket.IO-powered live messaging and status updates
- **WhatsApp Integration**: Native integration with WhatsApp Business API for message delivery
- **Conversation Management**: Complete conversation tracking with 24-hour messaging window support
- **Stateful Execution**: Context-aware chatbot execution with variable storage and conditional branching

---

## Project Goals

### Primary Objectives
1. **Democratize Chatbot Creation**: Enable non-technical users to build sophisticated WhatsApp chatbots through visual interface
2. **Enterprise-Grade Reliability**: Provide production-ready infrastructure with proper error handling, logging, and monitoring
3. **Real-time User Experience**: Deliver instant updates for message delivery, status changes, and typing indicators
4. **Scalable Architecture**: Support growth from prototype to production with thousands of concurrent conversations

### Technical Goals
- Modular, maintainable codebase with clear separation of concerns
- Type-safe development with TypeScript across frontend and backend
- Database-driven architecture with proper migrations and schema management
- Webhook-based integration with WhatsApp Business API
- Comprehensive API layer for future mobile app or third-party integrations

---

## Key Features

### 1. Visual Flow Builder
**Location**: `/frontend/src/features/builder/`

- **Drag-and-Drop Interface**: ReactFlow-powered canvas for creating conversation flows
- **Custom Node Types**:
  - `START`: Entry point for conversation flows
  - `MESSAGE`: Send text messages to users
  - `QUESTION`: Collect user input (text, buttons, lists)
  - `CONDITION`: Branch based on variable values
  - `WHATSAPP_FLOW`: Send interactive WhatsApp Flows (forms)
  - `REST_API`: Execute external API calls within chatbot flow - **NEW**
- **Real-time Validation**: Instant feedback on flow structure and node configurations
- **Flow Testing**: Built-in test interface to simulate conversations before deployment

### 2. Real-time Conversation Management
**Location**: `/frontend/src/features/chat/`, `/backend/src/modules/websocket/`

- **Live Message Sync**: Real-time message delivery via Socket.IO
- **Optimistic Updates**: Instant UI feedback with server reconciliation
- **Message Status Tracking**: `sent` → `delivered` → `read` status flow
- **Typing Indicators**: Show when users are composing messages
- **24-Hour Window Tracking**: Visual indicators for WhatsApp's messaging window

### 3. WhatsApp Business API Integration
**Location**: `/backend/src/modules/whatsapp/`

- **Multiple Message Types**:
  - Text messages
  - Interactive buttons
  - Interactive lists
  - Media messages (images, videos, documents, audio)
  - Reactions
  - Stickers
- **Webhook Processing**: Secure webhook handling with signature verification
- **Message Delivery**: Reliable message queuing and retry logic
- **Flow Messages**: Support for WhatsApp Flows (interactive forms)

### 4. Chatbot Execution Engine
**Location**: `/backend/src/modules/chatbots/services/chatbot-execution.service.ts`

- **State Management**: Per-conversation execution context with variable storage
- **Flow Traversal**: Graph-based navigation through conversation nodes
- **Variable Substitution**: Dynamic content with `{{variableName}}` syntax
- **Conditional Logic**: Branch conversations based on user responses
- **REST API Integration**: Call external APIs within chatbot flows
  - Supports GET, POST, PUT, DELETE methods
  - Variable interpolation in URL, headers, and body
  - JSON path extraction from responses (supports nested paths and array indexing)
  - Success/error branching with dual output handles
  - Math expressions in templates (e.g., `{{page + 1}}`)
- **Dynamic Lists and Buttons**: Data-driven interactive messages
  - Dynamic list generation from API responses or variables
  - Dynamic button generation with automatic pagination
  - Field mapping for labels and descriptions
  - Page navigation with Next/Previous buttons
  - Variable-based content population
- **Node History**: Track conversation path for debugging and analytics

### 5. WhatsApp Flows Management
**Location**: `/frontend/src/features/flows/`, `/backend/src/modules/flows/`

- **Flow Lifecycle Management**: Create, update, publish, and delete WhatsApp Flows
- **Interactive Forms**: Build multi-screen forms with validation and data collection
- **Encryption Support**: RSA + AES encryption for secure data exchange
- **Flow Endpoint**: Server-side endpoint for dynamic data exchange during interactions
- **ChatBot Integration**: Use Flows as nodes within conversation flows
- **Preview & Testing**: Test Flows before publishing to production

### 6. User & Conversation Management
**Location**: `/backend/src/modules/users/`, `/backend/src/modules/conversations/`

- **User Registry**: Automatic user creation from WhatsApp contacts
- **Conversation Threading**: Group messages by conversation with participant tracking
- **Message History**: Complete audit trail of all messages
- **Multi-participant Support**: Ready for group conversations (M2M relationships)

---

## Technology Stack

### Backend
**Framework**: NestJS 11.x
- **Language**: TypeScript 5.7.x
- **Runtime**: Node.js 18+
- **Architecture**: Modular, dependency injection-based

**Database**: PostgreSQL 14+
- **ORM**: TypeORM 0.3.x
- **Features Used**:
  - UUID primary keys with `gen_random_uuid()`
  - JSONB columns for flexible schema storage
  - ENUM types for status tracking
  - `TIMESTAMP WITH TIME ZONE` for timezone-aware timestamps
  - Foreign keys with CASCADE deletes
  - Composite and partial indexes

**Real-time**: Socket.IO 4.8.x
- **Namespace**: `/messages`
- **Features**: Rooms, broadcast, user online tracking

**HTTP Client**: Axios 1.13.x
- WhatsApp API communication
- Multipart form data for media uploads

**Validation**: class-validator + class-transformer
- DTO validation for all endpoints
- Type-safe request/response handling

### Frontend
**Framework**: React 19.2.x
- **Language**: TypeScript 5.9.x
- **Build Tool**: Vite 7.x (using Rolldown)
- **UI Library**: Custom components with native CSS

**Flow Builder**: @xyflow/react 12.3.x (ReactFlow)
- Custom node components
- Edge validation
- Auto-layout support

**State Management**: React hooks + context
- Local component state
- Shared state via context
- Real-time sync with Socket.IO

**HTTP Client**: Axios 1.13.x
- API communication
- Request/response interceptors

**Real-time**: socket.io-client 4.8.x
- WebSocket connection management
- Event-based message handling

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint 9.x
- **Formatting**: Prettier 3.x
- **Testing**: Jest 30.x
- **API Testing**: Supertest 7.x
- **Tunneling**: ngrok (for webhook development)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Flow Builder │  │ Chat UI      │  │ Conversation │      │
│  │ (ReactFlow)  │  │ (Real-time)  │  │ Management   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│  ┌──────▼──────────────────┴──────────────────┘               │
│  │ Flows Management (WhatsApp Flows UI)       │               │
│  └──────┬──────────────────────────────────────┘               │
│         │                                                      │
│                     HTTP + WebSocket                          │
└────────────────────────────┼──────────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────┐
│                         BACKEND                               │
│                            │                                  │
│  ┌─────────────────────────▼─────────────────────────────┐   │
│  │              NestJS Application                       │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │   │
│  │  │ ChatBots │  │ Messages │  │ Webhooks │           │   │
│  │  │ Module   │  │ Gateway  │  │ Module   │           │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘           │   │
│  │       │             │             │                   │   │
│  │  ┌────▼─────────────▼─────────────▼───────┐         │   │
│  │  │     Conversations & Messages Module     │         │   │
│  │  └────┬────────────────────────────────────┘         │   │
│  │       │                                              │   │
│  │  ┌────▼────────────────────────────┐                │   │
│  │  │      Database Layer (TypeORM)   │                │   │
│  │  └────┬────────────────────────────┘                │   │
│  └───────┼──────────────────────────────────────────────┘   │
│          │                                                   │
│  ┌───────▼────────────────────┐                             │
│  │   PostgreSQL Database      │                             │
│  │   - users                  │                             │
│  │   - chatbots               │                             │
│  │   - conversations          │                             │
│  │   - messages               │                             │
│  │   - conversation_contexts  │                             │
│  │   - whatsapp_config        │                             │
│  │   - whatsapp_flows         │                             │
│  └────────────────────────────┘                             │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   │ HTTP API Calls
                   │
┌──────────────────▼──────────────────┐
│   WhatsApp Business API             │
│   - Send Messages                   │
│   - Receive Webhooks                │
│   - Media Upload                    │
└─────────────────────────────────────┘
```

### Request Flow Examples

#### 1. User Sends Message to Chatbot
```
WhatsApp → Webhook → WebhooksController → WebhookProcessorService
  → ConversationsService (save message) → ChatBotExecutionService (process node)
  → WhatsAppMessageService (send response) → WhatsApp API
  → MessagesGateway (emit to frontend) → Frontend (update UI)
```

#### 2. Admin Creates Flow
```
Frontend Builder → HTTP POST /api/chatbots → ChatBotsController
  → ChatBotsService → TypeORM → PostgreSQL (save nodes/edges JSONB)
```

#### 3. Real-time Message Sync
```
Backend (message received) → MessagesGateway.emitMessageReceived()
  → Socket.IO → Frontend useWebSocket hook → Update conversation state
```

---

## Project Statistics

### Codebase Metrics
- **Backend Files**: ~60+ TypeScript files
- **Frontend Files**: ~45+ TypeScript/TSX files
- **Database Entities**: 8 main entities
- **API Endpoints**: ~40+ REST endpoints
- **Socket.IO Events**: 8 real-time events
- **Custom Node Types**: 5 ReactFlow node components

### Module Breakdown

#### Backend Modules
1. **ChatBotsModule** - Flow management and execution engine
2. **ConversationsModule** - Conversation and message management
3. **MessagesModule** - Message CRUD operations
4. **WebhooksModule** - WhatsApp webhook processing
5. **WebSocketModule** - Real-time communication gateway
6. **WhatsAppModule** - WhatsApp API integration
7. **FlowsModule** - WhatsApp Flows lifecycle management
8. **MediaModule** - Media upload and retrieval
9. **UsersModule** - User management

#### Frontend Features
1. **Builder** - Flow builder interface
2. **Chat** - Conversation UI
3. **ChatBots** - Chatbot list and management
4. **Flows** - WhatsApp Flows management UI
5. **Conversations** - Conversation list
6. **Nodes** - Custom ReactFlow node components (including WhatsAppFlowNode)
7. **Users** - User management interface

### Database Schema
- **Tables**: 8 core tables (users, chatbots, conversations, messages, conversation_contexts, whatsapp_config, whatsapp_flows, conversation_participants)
- **Junction Tables**: 1 (conversation_participants)
- **JSONB Columns**: 8 columns for flexible data (nodes, edges, content, variables, metadata, flowJson, categories)
- **Indexes**: ~15 indexes (composite, partial, single-column)
- **Foreign Keys**: 8 relationships with CASCADE
- **Migrations**: 12+ migration files

---

## Development Workflow

### Local Development Setup
1. **Prerequisites**: Node.js 18+, PostgreSQL 14+, ngrok
2. **Installation**: `npm run install:all` (installs backend + frontend)
3. **Database**: `npm run migration:run` (run TypeORM migrations)
4. **Development**: `npm run webhook:start` (starts backend + ngrok)
5. **Frontend**: `npm run frontend:dev` (starts Vite dev server)

### Deployment Considerations
- **Environment Variables**: Required for WhatsApp API credentials, database connection
- **Database Migrations**: Must run before application start
- **Webhook URL**: Must be HTTPS (ngrok for dev, reverse proxy for prod)
- **Connection Pooling**: Configure based on expected load
- **Logging**: Structured logging with NestJS Logger
- **Error Handling**: Global exception filters for consistent error responses

---

## Next Steps for Developers

### Onboarding Checklist
1. Read this overview to understand project goals and architecture
2. Review `/home/ali/whatsapp-builder/.claude/skills/project-architect/reference/02-backend-architecture.md` for backend deep-dive
3. Review `/home/ali/whatsapp-builder/.claude/skills/project-architect/reference/03-frontend-architecture.md` for frontend details
4. Study `/home/ali/whatsapp-builder/.claude/skills/project-architect/reference/04-database-design.md` for database schema
5. Understand `/home/ali/whatsapp-builder/.claude/skills/project-architect/reference/05-real-time-system.md` for Socket.IO implementation
6. Review `/home/ali/whatsapp-builder/.claude/skills/project-architect/reference/06-whatsapp-integration.md` for WhatsApp API integration
7. Follow `/home/ali/whatsapp-builder/.claude/skills/project-architect/reference/09-development-guide.md` for local setup

### Common Development Tasks
- **Add New Node Type**: Create component in `/frontend/src/features/nodes/`, add handler in `chatbot-execution.service.ts`
  - Example: REST API Node (see `13-rest-api-node-feature.md`)
- **Add WhatsApp Message Type**: Create service in `/backend/src/modules/whatsapp/services/message-types/`
- **Add API Endpoint**: Create controller method with DTO validation
  - Example: `/api/chatbots/test-rest-api` for REST API testing
- **Add Database Column**: Create TypeORM migration, update entity
- **Add Real-time Event**: Add event handler in `messages.gateway.ts`, emit in service

---

## References

### Internal Documentation
- Backend Architecture: `02-backend-architecture.md`
- Frontend Architecture: `03-frontend-architecture.md`
- Database Design: `04-database-design.md`
- Real-time System: `05-real-time-system.md`
- WhatsApp Integration: `06-whatsapp-integration.md`
- Project Structure: `07-project-structure.md`
- Module Relationships: `08-module-relationships.md`
- Development Guide: `09-development-guide.md`
- Deployment Architecture: `10-deployment-architecture.md`

### External Documentation
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [NestJS Documentation](https://docs.nestjs.com)
- [ReactFlow Documentation](https://reactflow.dev)
- [TypeORM Documentation](https://typeorm.io)
- [Socket.IO Documentation](https://socket.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Last Updated**: 2025-11-26
**Document Version**: 1.1
**Maintainer**: Project Architecture Team
