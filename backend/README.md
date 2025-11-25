# WhatsApp Builder - Backend

Backend service for WhatsApp Builder platform, built with NestJS, TypeORM, and PostgreSQL.

## Description

This backend provides a comprehensive API for managing WhatsApp chatbots, handling real-time conversations via Socket.IO, processing WhatsApp webhooks, and executing chatbot logic based on visual flow designs.

## Features

- **ChatBot Management**: Create, update, and manage chatbot flows with visual node-edge structures
- **Real-time Communication**: Socket.IO gateway for live message sync and typing indicators
- **WhatsApp Integration**: Full WhatsApp Business API integration with webhook processing
- **Conversation Management**: Track conversations, messages, and 24-hour messaging windows
- **Chatbot Execution**: State-based execution engine with variable storage and conditional logic
- **Database Migrations**: TypeORM migrations for schema management
- **User Management**: Automatic user registration from WhatsApp contacts

## Technology Stack

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.7.x
- **Database**: PostgreSQL 14+
- **ORM**: TypeORM 0.3.x
- **Real-time**: Socket.IO 4.8.x
- **HTTP Client**: Axios 1.13.x

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: 18.x or higher
- **PostgreSQL**: 14.x or higher
- **npm**: 9.x or higher
- **WhatsApp Business API**: Access token and phone number ID
- **ngrok** (for development): For webhook tunnel

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=whatsapp_builder

# Application
PORT=3000
NODE_ENV=development

# WhatsApp Business API
WHATSAPP_API_TOKEN=your_whatsapp_api_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_API_VERSION=v21.0
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Optional: Logging
LOG_LEVEL=debug
```

See `.env.example` for a complete template.

## Installation

```bash
# Install dependencies
npm install
```

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Using psql
psql -U postgres
CREATE DATABASE whatsapp_builder;
```

### 2. Run Migrations

```bash
# Run all pending migrations
npm run migration:run

# Revert last migration (if needed)
npm run migration:revert

# Generate new migration
npm run migration:generate -- src/migrations/MigrationName
```

### Available Migrations

- `CreateWhatsAppConfigTable` - WhatsApp configuration storage
- `CreateConversationContextTable` - Chatbot execution context
- `RenameFlowsToChatBots` - Terminology migration from flows to chatbots

## Running the Application

### Development Mode

```bash
# Standard development mode
npm run start:dev

# With watch mode (auto-restart on changes)
npm run start:dev
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

### Production Mode

```bash
# Build the application
npm run build

# Run production build
npm run start:prod
```

## Webhook Development

For local development, WhatsApp requires an HTTPS webhook URL. Use ngrok to create a tunnel:

```bash
# Terminal 1: Start the backend
npm run start:dev

# Terminal 2: Start ngrok tunnel
ngrok http 3000

# Copy the HTTPS URL and configure it in WhatsApp Business API dashboard
# Webhook URL: https://your-ngrok-url.ngrok.io/api/webhooks/whatsapp
# Verify Token: Use the value from WHATSAPP_VERIFY_TOKEN in .env
```

Alternatively, use the monorepo script:

```bash
# From project root
npm run webhook:start
```

## API Documentation

### Swagger UI (Recommended)

This project includes comprehensive OpenAPI/Swagger documentation for all API endpoints.

**Access Interactive Documentation:**
```
http://localhost:3000/api/docs
```

**Features:**
- Interactive testing - Test all endpoints directly from the browser
- Auto-generated - Documentation generated from TypeScript decorators
- Request/Response schemas - View all DTO structures and validation rules
- Example values - See example payloads for all endpoints
- Organized by tags - Endpoints grouped by feature (Chatbots, Flows, WhatsApp Config, etc.)

**Swagger Tags:**
| Tag | Description | Endpoints |
|-----|-------------|-----------|
| Chatbots | Chatbot management and configuration | 13 endpoints |
| Flows | WhatsApp Flow management and Meta sync | 8 endpoints |
| WhatsApp Config | WhatsApp Business API configuration | 4 endpoints |
| Flow Endpoint | WhatsApp Flow data exchange endpoint | 1 endpoint |
| Chatbot Webhook | Chatbot webhook for encrypted data exchange | 3 endpoints |

**OpenAPI Specification:**
```
http://localhost:3000/api/docs-json
```
This can be imported into tools like Postman, Insomnia, or used for API client generation.

---

### Base URL

```
http://localhost:3000/api
```

### Main Endpoints

#### ChatBots
- `GET /chatbots` - List all chatbots
- `POST /chatbots` - Create new chatbot
- `GET /chatbots/:id` - Get chatbot by ID
- `GET /chatbots/:id/stats` - Get chatbot statistics
- `PUT /chatbots/:id` - Update chatbot (full)
- `PATCH /chatbots/:id` - Update chatbot (partial)
- `DELETE /chatbots/:id` - Delete chatbot (hard delete)
- `DELETE /chatbots/:id/soft` - Soft delete chatbot
- `PATCH /chatbots/:id/status` - Update status
- `PATCH /chatbots/:id/toggle-active` - Toggle active state
- `PATCH /chatbots/:id/restore` - Restore soft-deleted chatbot

#### Conversations
- `GET /conversations` - List conversations
- `GET /conversations/:id` - Get conversation details
- `GET /conversations/:id/messages` - Get conversation messages
- `POST /conversations/:id/messages` - Send message

#### Users
- `GET /users` - List users
- `POST /users` - Create user
- `GET /users/:id` - Get user details
- `PUT /users/:id` - Update user

#### Webhooks
- `GET /webhooks/whatsapp` - Verify webhook (WhatsApp)
- `POST /webhooks/whatsapp` - Receive webhook events

#### WhatsApp Config
- `GET /whatsapp-config` - Get active configuration
- `POST /whatsapp-config` - Create configuration
- `PUT /whatsapp-config/:id` - Update configuration

#### Media
- `POST /media/upload` - Upload media file

### WebSocket Events

Connect to `http://localhost:3000/messages` namespace.

**Server → Client Events:**
- `message:received` - New message received
- `message:sent` - Message sent successfully
- `message:delivered` - Message delivered to WhatsApp
- `message:read` - Message read by user
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `conversation:updated` - Conversation metadata updated

**Client → Server Events:**
- `typing:start` - Notify typing started
- `typing:stop` - Notify typing stopped

## Testing

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## Module Structure

```
backend/src/
├── app.module.ts           # Root module
├── main.ts                 # Application entry point
├── config/                 # Configuration modules
├── database/               # Database module
├── entities/               # TypeORM entities
│   ├── chatbot.entity.ts
│   ├── conversation.entity.ts
│   ├── message.entity.ts
│   ├── user.entity.ts
│   ├── conversation-context.entity.ts
│   └── whatsapp-config.entity.ts
├── modules/
│   ├── chatbots/          # ChatBot management
│   ├── conversations/     # Conversation handling
│   ├── messages/          # Message management
│   ├── users/             # User management
│   ├── webhooks/          # Webhook processing
│   ├── websocket/         # Socket.IO gateway
│   ├── whatsapp/          # WhatsApp API integration
│   └── media/             # Media upload
└── migrations/            # TypeORM migrations
```

## Key Services

### ChatBotExecutionService
Executes chatbot logic based on node-edge flow structures:
- Processes START, MESSAGE, QUESTION, and CONDITION nodes
- Manages conversation state and variables
- Handles conditional branching
- Supports variable substitution with `{{variableName}}`

### WebhookProcessorService
Processes incoming WhatsApp webhook events:
- Validates webhook signatures
- Handles message events (text, interactive, media)
- Triggers chatbot execution
- Emits real-time events via Socket.IO

### WhatsAppMessageService
Sends messages to WhatsApp Business API:
- Text messages
- Interactive buttons and lists
- Media messages (images, videos, documents, audio)
- Reactions and stickers
- WhatsApp Flows

### MessagesGateway
Real-time WebSocket communication:
- Broadcasts message updates
- Manages user connections and rooms
- Emits typing indicators
- Provides online/offline status

## Architecture Highlights

### Modular Design
- Each feature module is self-contained
- Dependency injection for loose coupling
- Shared entities and services

### Database-Driven
- TypeORM for type-safe database operations
- Migration-based schema management
- UUID primary keys
- JSONB columns for flexible data (nodes/edges)

### Real-time Communication
- Socket.IO for bidirectional communication
- Room-based message isolation
- Optimistic UI updates support

### WhatsApp Integration
- Webhook signature verification
- Retry logic for message delivery
- Support for all WhatsApp message types
- 24-hour messaging window tracking

## Troubleshooting

### Database Connection Issues

```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U postgres -h localhost -d whatsapp_builder

# Check environment variables
cat .env | grep DB_
```

### Migration Errors

```bash
# Check migration status
npm run migration:show

# Revert last migration
npm run migration:revert

# Drop database and recreate (⚠️ destroys data)
npm run schema:drop
npm run migration:run
```

### WhatsApp Webhook Issues

```bash
# Verify ngrok is running
curl http://localhost:4040/api/tunnels

# Test webhook endpoint
curl http://localhost:3000/api/webhooks/whatsapp?hub.verify_token=YOUR_TOKEN&hub.challenge=test

# Check webhook logs
# Logs appear in console with LOG_LEVEL=debug
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port in .env
PORT=3001
```

## Development Guidelines

### Creating a New Module

```bash
# Generate module, controller, and service
nest g module modules/my-feature
nest g controller modules/my-feature
nest g service modules/my-feature
```

### Creating a New Migration

```bash
# Make changes to entities, then generate migration
npm run migration:generate -- src/migrations/DescribeYourChanges
npm run migration:run
```

### Adding a New API Endpoint

1. Create DTO in `modules/[feature]/dto/`
2. Add controller method with validation decorators
3. Implement service logic
4. Update this README's API documentation

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Socket.IO Documentation](https://socket.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Project Documentation

For comprehensive documentation, see:

- [Project Overview](../.claude/skills/project-architect/reference/01-project-overview.md)
- [Backend Architecture](../.claude/skills/project-architect/reference/02-backend-architecture.md)
- [Database Design](../.claude/skills/project-architect/reference/04-database-design.md)
- [Development Guide](../.claude/skills/project-architect/reference/09-development-guide.md)

## License

This project is proprietary software. All rights reserved.

## Support

For issues, questions, or contributions, please contact the development team.
