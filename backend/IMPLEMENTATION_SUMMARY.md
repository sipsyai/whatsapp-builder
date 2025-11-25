# Database Implementation Summary

This document summarizes the PostgreSQL and TypeORM implementation for the WhatsApp Web Clone backend.

## What Was Implemented

### 1. Dependencies Installed
- `@nestjs/typeorm` - NestJS integration with TypeORM
- `typeorm` - TypeORM ORM framework
- `pg` - PostgreSQL driver
- `@nestjs/schedule` - Task scheduling and cron job support

### 2. Database Configuration

**File: `src/config/database.config.ts`**
- Async configuration using ConfigService
- Environment-based settings
- Connection pooling configuration
- Auto-loading of entities

**File: `src/database/database.module.ts`**
- Database module for centralized configuration
- Imports ConfigModule for environment variables

**File: `ormconfig.ts`**
- TypeORM CLI configuration for migrations
- Supports dotenv for environment variables

### 3. Entities Created

#### User Entity (`src/entities/user.entity.ts`)
- UUID primary key
- Phone number (unique)
- Name and avatar
- Timestamps (createdAt, updatedAt)
- One-to-Many relationship with Messages

#### Conversation Entity (`src/entities/conversation.entity.ts`)
- UUID primary key
- Many-to-Many relationship with Users (participants)
- One-to-Many relationship with Messages
- Last message tracking
- Timestamps

#### Message Entity (`src/entities/message.entity.ts`)
- UUID primary key
- Enum for message type (text, image, video, etc.)
- Enum for message status (sent, delivered, read)
- JSONB content field for flexible data
- Foreign keys to Conversation and User
- Timestamps

#### Flow Entity (`src/entities/flow.entity.ts`)
- UUID primary key for React Flow builder
- Name
- JSONB arrays for nodes and edges
- Timestamps

### 4. Modules Created

#### Users Module
- Full CRUD operations
- Find by phone number
- Conflict checking for duplicates
- Endpoints: GET/POST/PUT/DELETE /api/users

#### Conversations Module
- Create conversations with participants
- Fetch with relations
- Update last message tracking
- Endpoints: GET/POST /api/conversations

#### Messages Module
- Pagination support
- Filter by conversation
- Update message status
- Mark conversation as read
- Endpoints: GET/POST /api/conversations/:id/messages

#### Flows Module (Updated)
- Migrated from in-memory to database
- Full CRUD operations
- DTOs for validation
- Endpoints: GET/POST/PUT/DELETE /flows

### 5. Configuration Files

- `.env.example` - Environment variable template
- `DATABASE_SETUP.md` - Comprehensive setup guide
- `ormconfig.ts` - Migration configuration
- Migration scripts in package.json

### 5. ChatBot Flow Execution (NEW)

#### Context Expiration System
- **Purpose**: Prevent hanging contexts from stuck flows or unresponsive users
- **Mechanism**: Cron job runs every minute to deactivate expired contexts
- **Timeout Values**: WhatsApp Flows: 10 minutes
- **Database**: Partial index on `expiresAt` for efficient cleanup queries

#### Skip Command Support
- **User Commands**: skip, cancel, iptal, atla, vazgec, vazgec
- **Behavior**:
  - Active context -> Skip current waiting node
  - No active context -> Ignore command
- **Safety**: Skip only works on Flow/Question nodes

#### Debug Endpoints
- `GET /api/chatbots/debug/contexts` - List all active contexts
- `GET /api/chatbots/debug/contexts/stats` - Context statistics
- `POST /api/chatbots/debug/contexts/:contextId/force-complete` - Force complete
- `POST /api/chatbots/debug/cleanup` - Manual cleanup trigger
- `POST /api/chatbots/conversations/:conversationId/skip` - Skip current node

#### ConversationContext Entity (Updated)
- UUID primary key
- UUID for ConversationId and ChatBotId
- `currentNodeId` for tracking flow position
- JSONB for variables and nodeHistory
- `isActive` boolean
- **NEW**: `expiresAt` timestamp with time zone (nullable)
  - Set when Flow node executes (10 min timeout)
  - Cleared when Flow completes or context ends
  - Used by cleanup cron job
- Timestamps (createdAt, updatedAt)

#### Migration: AddExpiresAtToConversationContext
**File**: `1732560000000-AddExpiresAtToConversationContext.ts`

**Changes**:
1. Adds `expiresAt` column (timestamp with time zone, nullable)
2. Creates partial index for efficient cleanup:
   ```sql
   CREATE INDEX IDX_conversation_context_expires_at
   ON conversation_contexts (expiresAt)
   WHERE expiresAt IS NOT NULL AND isActive = true
   ```

## Architecture Decisions

1. **UUID Primary Keys** - Better security and scalability
2. **JSONB for Flexible Data** - Message content and Flow data
3. **Timestamp with Time Zone** - Proper timezone handling
4. **Cascade Deletes** - Maintain referential integrity
5. **Repository Pattern** - Clean separation of concerns
6. **Scheduled Cleanup** - Automatic context timeout handling via cron jobs

## Next Steps

1. Create PostgreSQL database
2. Configure .env file
3. Run migrations
4. Start development server

See DATABASE_SETUP.md for detailed instructions.
