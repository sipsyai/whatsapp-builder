# Database Design - WhatsApp Builder

## Overview

PostgreSQL 14+ with TypeORM 0.3.27, migration-based schema management.

### Tech Stack
- PostgreSQL 14+ (RDBMS)
- TypeORM 0.3.27 (ORM)
- pg-pool (connection pooling)

### Config
**File**: `/backend/ormconfig.ts`

```typescript
synchronize: false  // Use migrations in production
logging: process.env.DB_LOGGING === 'true'
```

---

## Database Schema

### ERD Summary
```
users (1) ←→ (M) conversation_participants ←→ (M) conversations
users (1) ←→ (M) messages
conversations (1) ←→ (M) messages
conversations (1) ←→ (1) conversation_contexts
chatbots (1) ←→ (M) conversation_contexts

Data Sources Hierarchy:
- data_sources (1) ←→ (M) data_source_connections (CASCADE)
- data_source_connections (1) ←→ (M) data_source_connections (self-ref, SET NULL)
- data_sources (1) ←→ (M) whatsapp_flows (optional, SET NULL)

Standalone:
- whatsapp_config (singleton via partial unique index)
- whatsapp_flows (referenced in chatbot nodes via JSONB)
```

---

## Entities (9 Tables)

### 1. users
**File**: `/backend/src/entities/user.entity.ts`

**Fields**:
- `id` (UUID, PK)
- `phoneNumber` (unique, nullable)
- `name`, `avatar` (nullable)
- `email` (unique, nullable) - **NEW: for authentication**
- `password` (nullable, select: false) - **NEW: bcrypt hashed**
- `role` ('admin' | 'user')
- `isActive` (boolean, default: true) - **NEW: account status**
- `lastLoginAt` (timestamp, nullable) - **NEW: last login tracking**
- Timestamps: `createdAt`, `updatedAt`

**Authentication Notes**:
- `password` has `select: false` - excluded from queries by default
- Must explicitly select: `{ select: ['id', 'email', 'password'] }`
- Password hashed with bcrypt (10 rounds)
- `isActive: false` prevents login

**Relationships**:
- `sentMessages` (1:M → Message)
- `conversations` (M:N via conversation_participants)

**Migration**: `1764000000000-AddAuthFieldsToUser.ts`

### 2. conversations
**File**: `/backend/src/entities/conversation.entity.ts`

**Fields**:
- `id` (UUID, PK)
- `lastMessage`, `lastMessageAt` (nullable)
- `isWindowOpen` (24-hour WhatsApp window tracking)
- Timestamps

**Relationships**:
- `participants` (M:N → User)
- `messages` (1:M → Message, CASCADE)
- `context` (1:1 → ConversationContext, CASCADE)

### 3. messages
**File**: `/backend/src/entities/message.entity.ts`

**Fields**:
- `id` (UUID, PK)
- `conversationId` (FK → conversations, CASCADE)
- `senderId` (FK → users)
- `type` (ENUM: TEXT, INTERACTIVE, IMAGE, etc.)
- `content` (JSONB) - flexible structure per type
- `status` (ENUM: sent, delivered, read, failed)
- `timestamp` (Date)

**Content Examples**:
```typescript
// TEXT
{ text: "Hello" }

// INTERACTIVE (buttons)
{ type: "button", body: "Choose:", buttons: [{id, title}] }

// INTERACTIVE (list)
{ type: "list", body: "Select:", button: "View", sections: [{title, rows}] }

// INTERACTIVE (Flow)
{ type: "flow", whatsappFlowId: "uuid", whatsappMessageId: "wamid.xxx" }
```

**Indexes**: `conversationId`, `senderId`, `timestamp`

### 4. chatbots
**File**: `/backend/src/entities/chatbot.entity.ts`

**Fields**:
- `id` (UUID, PK)
- `name`, `description`
- `nodes` (JSONB) - ReactFlow nodes array
- `edges` (JSONB) - ReactFlow edges array
- `isActive` (boolean)
- `status` (ENUM: draft, active, archived)
- `metadata` (JSONB)

**Indexes**: `isActive`, `status`

### 5. conversation_contexts
**File**: `/backend/src/entities/conversation-context.entity.ts`

**Fields**:
- `id` (UUID, PK)
- `conversationId` (FK, CASCADE)
- `chatbotId` (FK, CASCADE)
- `currentNodeId` (string) - active node in flow
- `currentFlowOutputVariable` (string) - for Flow nodes
- `variables` (JSONB) - `{varName: value}` pairs
- `nodeHistory` (JSONB) - `[{nodeId, timestamp}]`
- `isActive` (boolean)

**Purpose**: Maintains chatbot execution state per conversation

### 6. whatsapp_config
**File**: `/backend/src/entities/whatsapp-config.entity.ts`

**Fields**:
- `id` (UUID, PK)
- `phoneNumberId`, `businessAccountId`
- `accessToken` (encrypted recommended)
- `webhookVerifyToken`, `appSecret`
- `isActive` (boolean)

**Constraint**: Partial unique index on `isActive` WHERE `isActive = true` (only one active config)

### 7. whatsapp_flows
**File**: `/backend/src/entities/whatsapp-flow.entity.ts`

**Fields**:
- `id` (UUID, PK)
- `whatsappFlowId` (string) - Meta API Flow ID
- `name`, `description`
- `status` (ENUM: DRAFT, PUBLISHED, DEPRECATED)
- `categories` (JSONB)
- `flowJson` (JSONB) - WhatsApp Flow JSON schema
- `endpointUri` (string)
- `previewUrl` (nullable)
- `syncedFromMeta` (boolean) - **NEW**
- `metadata` (JSONB)
- `dataSourceId` (UUID, FK, nullable) - **NEW** - References data_sources.id

**Indexes**: `whatsappFlowId` (unique), `status`, `dataSourceId`

**Relations**:
- `dataSource` (ManyToOne → DataSource, nullable, onDelete: SET NULL)

---

### 8. data_sources
**File**: `/backend/src/entities/data-source.entity.ts`

**Purpose**: Store external API configurations (Strapi, REST API, GraphQL) to eliminate hardcoded credentials.

**Fields**:
- `id` (UUID, PK)
- `name` (string, 255) - Human-readable name
- `description` (text, nullable)
- `type` (ENUM: REST_API, STRAPI, GRAPHQL)
- `baseUrl` (string, 500) - API base URL
- `authType` (ENUM: NONE, BEARER, API_KEY, BASIC) - Default: NONE
- `authToken` (text, nullable) - Token/password for authentication
- `authHeaderName` (string, 100, nullable) - Custom header name for API_KEY auth
- `headers` (JSONB, nullable) - Additional HTTP headers
- `config` (JSONB, nullable) - Type-specific configuration
- `isActive` (boolean) - Default: true
- `timeout` (integer, nullable) - Request timeout in milliseconds
- `createdAt`, `updatedAt` (timestamps)

**Indexes**: `type`, `isActive`, `createdAt DESC`

**Relations**:
- `whatsappFlows` (OneToMany → WhatsAppFlow, via whatsapp_flows.dataSourceId)

**Validation Rules**:
- If `authType` is not NONE, `authToken` is required
- If `authType` is API_KEY, `authHeaderName` is required
- `baseUrl` must be valid URL format

**Security Notes**:
- Auth tokens stored in plain text (encryption recommended for production)
- No authentication on API endpoints yet (TODO: add JWT guards)

---

### 9. data_source_connections
**File**: `/backend/src/entities/data-source-connection.entity.ts`

**Purpose**: Store reusable API endpoint configurations for cascading/dependent dropdowns in WhatsApp Flows.

**Fields**:
- `id` (UUID, PK)
- `name` (string, 255) - Human-readable connection name
- `description` (text, nullable)
- `dataSourceId` (FK → data_sources, CASCADE) - Parent data source
- `endpoint` (string, 500) - API path like '/api/products'
- `method` (ENUM: GET, POST, PUT, PATCH, DELETE) - Default: GET
- `defaultParams` (JSONB, nullable) - Default query parameters
- `defaultBody` (JSONB, nullable) - Default request body for POST/PUT
- `dataKey` (string, 255, nullable) - Path to data in response (e.g., 'data.items')
- `transformConfig` (JSONB, nullable) - Field mappings: `{ idField, titleField, descriptionField? }`
- `dependsOnConnectionId` (FK → data_source_connections, SET NULL, nullable) - For cascading dropdowns
- `paramMapping` (JSONB, nullable) - JSONPath mappings like `{ "filters[brand]": "$.selectedBrand" }`
- `isActive` (boolean) - Default: true
- `createdAt`, `updatedAt` (timestamps)

**Relationships**:
- `dataSource` (ManyToOne → DataSource, CASCADE on delete)
- `dependsOnConnection` (ManyToOne → self, SET NULL on delete) - For chained connections

**Use Cases**:
- Cascading dropdown: Brand → Products (dependsOnConnection links them)
- Reusable API endpoints without hardcoding in Flow JSON
- Dynamic data binding in WhatsApp Flow components

**Migration**: `1732800000000-CreateDataSourceConnectionsTable.ts`

---

## Relationships

### Many-to-Many: users ↔ conversations
**Junction**: `conversation_participants` (conversationId, userId)

### One-to-Many with CASCADE
- `conversations.messages` → DELETE conversation deletes all messages
- `conversations.context` → DELETE conversation deletes context
- `chatbots.contexts` → DELETE chatbot deletes all contexts

### Soft Reference (JSONB)
- `chatbots.nodes[].data.whatsappFlowId` → `whatsapp_flows.id`
- No FK constraint (allows Flow deletion without breaking chatbots)

### Optional Foreign Key
- `whatsapp_flows.dataSourceId` → `data_sources.id` (nullable, onDelete: SET NULL)
- Allows flows to work without data source or continue working if data source is deleted

---

## PostgreSQL Features

### 1. JSONB Columns
**Advantages**:
- Flexible schema (ReactFlow nodes/edges, message content)
- Query support (`@>`, `->`, `->>`)
- Indexable (GIN indexes)

**Used In**:
- `chatbots.nodes`, `chatbots.edges`, `chatbots.metadata`
- `messages.content`
- `conversation_contexts.variables`, `conversation_contexts.nodeHistory`
- `whatsapp_flows.categories`, `whatsapp_flows.flowJson`
- `data_sources.headers`, `data_sources.config`

### 2. ENUM Types
```sql
CREATE TYPE message_type AS ENUM ('TEXT', 'INTERACTIVE', 'IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'STICKER', 'LOCATION', 'REACTION');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read', 'failed');
CREATE TYPE chatbot_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE flow_status AS ENUM ('DRAFT', 'PUBLISHED', 'DEPRECATED');
CREATE TYPE user_role AS ENUM ('customer', 'business', 'admin');
```

### 3. Partial Unique Index
```sql
CREATE UNIQUE INDEX idx_whatsapp_config_active
ON whatsapp_config (isActive)
WHERE isActive = true;
```
**Effect**: Only one row can have `isActive = true`

### 4. UUID Primary Keys
**All tables use UUIDs** (generated via `uuid_generate_v4()`)

**Advantages**:
- Globally unique
- No sequential ID guessing
- Distributed system friendly

---

## Migrations

### Migration Files
**Path**: `/backend/src/migrations/`

**Applied Migrations**:
1. `1701234567890-InitialSchema.ts` - Create all tables
2. `1701234567891-AddWhatsAppFlows.ts` - Add whatsapp_flows table
3. `1701234567892-AddSessionTracking.ts` - Add session fields
4. `1701234567893-AddFlowSync.ts` - Add syncedFromMeta field
5. `1764000000000-AddAuthFieldsToUser.ts` - Add email, password, role, isActive, lastLoginAt
6. `1732800000000-CreateDataSourceConnectionsTable.ts` - Add data_source_connections table for cascading dropdowns

### Commands
```bash
npm run migration:generate -- -n MigrationName  # Generate migration
npm run migration:run                            # Apply pending migrations
npm run migration:revert                         # Rollback last migration
npm run migration:show                           # Show migration status
```

### Migration Config
**File**: `backend/ormconfig.ts`
```typescript
migrations: ['src/migrations/*{.ts,.js}'],
migrationsRun: true,  // Auto-run on app start (optional)
```

---

## Query Patterns

### Common Queries

**Find conversation with participants**:
```typescript
await conversationRepo.findOne({
  where: { id },
  relations: ['participants', 'messages'],
});
```

**Find messages with pagination**:
```typescript
await messageRepo.createQueryBuilder('message')
  .where('message.conversationId = :conversationId', { conversationId })
  .orderBy('message.timestamp', 'ASC')
  .skip(offset)
  .take(limit)
  .getMany();
```

**Find active chatbot execution context**:
```typescript
await contextRepo.findOne({
  where: {
    conversationId,
    isActive: true
  },
  relations: ['chatbot'],
});
```

**Query JSONB field**:
```typescript
// Find chatbots with specific node type
await chatbotRepo.createQueryBuilder('chatbot')
  .where("chatbot.nodes @> :nodeFilter", {
    nodeFilter: JSON.stringify([{ type: 'question' }])
  })
  .getMany();
```

---

## Optimization Strategies

### 1. Indexes
**Existing**:
- `messages(conversationId, timestamp)` - Message retrieval
- `conversation_contexts(conversationId, isActive)` - Active context lookup
- `chatbots(isActive, status)` - List filtering
- `whatsapp_flows(whatsappFlowId)` - Flow lookup

**Recommended (future)**:
- GIN index on `chatbots.nodes` for JSONB queries
- GIN index on `messages.content` for search

### 2. Connection Pooling
**pg-pool** handles connection management (max 20 connections default)

### 3. Cascade Deletes
- Reduce orphaned records
- Maintain referential integrity
- Automatic cleanup

### 4. JSONB vs Normalized
**JSONB Used For**:
- ReactFlow graph data (nodes/edges) - structure varies
- Message content - type-specific fields
- Variables - dynamic key-value pairs

**Normalized Used For**:
- Core entities (users, conversations)
- Frequently queried fields
- Foreign key relationships

---

## Data Integrity

### Constraints
1. **NOT NULL**: All primary keys, foreign keys, core fields
2. **UNIQUE**: `users.phoneNumber`, `whatsapp_config.isActive` (partial)
3. **CHECK**: `isActive IN (true, false)`
4. **FK CASCADE**: Safe deletion propagation

### Validation
**Application Layer**:
- DTOs with class-validator
- Business logic in services
- Pre-save hooks in entities

**Database Layer**:
- ENUM constraints
- Foreign key constraints
- Unique constraints

---

## Migration Strategy

### Development
```bash
npm run migration:generate -- -n AddNewFeature
npm run migration:run
```

### Production
```bash
# 1. Backup database
pg_dump whatsapp_builder > backup.sql

# 2. Run migrations
npm run migration:run

# 3. Verify
npm run migration:show
```

### Rollback
```bash
npm run migration:revert  # Rolls back last migration
```

---

## Summary

### Key Design Decisions
1. **UUID PKs**: Distributed-friendly, secure
2. **JSONB**: Flexible schema for dynamic data
3. **ENUMs**: Type-safe status fields
4. **Cascade Deletes**: Clean orphan management
5. **Partial Unique Index**: Singleton pattern for config
6. **Migration-based**: Production-safe schema changes
7. **No Sync**: `synchronize: false` prevents accidental schema changes

### Schema Stats
- **Tables**: 8 (+ 1 junction table)
- **Entities**: 9 TypeORM entities
- **Relationships**: 8 (2 M:N, 5 1:M, 1 self-referential)
- **Migrations**: 6 applied (including data_source_connections)
- **Indexes**: 10+ (including unique constraints on email)

---

**See Also**:
- [Backend Architecture](02-backend-architecture.md) - Service layer & repositories
- [Module Relationships](08-module-relationships.md) - Entity usage matrix
