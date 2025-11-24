# Database Design - WhatsApp Builder

## Table of Contents
- [Overview](#overview)
- [Database Schema](#database-schema)
- [Entity Relationships](#entity-relationships)
- [TypeORM Entities](#typeorm-entities)
- [PostgreSQL-Specific Features](#postgresql-specific-features)
- [Migrations](#migrations)
- [Query Patterns](#query-patterns)
- [Optimization Strategies](#optimization-strategies)

---

## Overview

The database layer uses **PostgreSQL 14+** with **TypeORM 0.3.x** as the ORM. The schema is designed to support:
- Multi-user conversations
- Complex chatbot flows with execution state
- Real-time message tracking
- WhatsApp Business API integration
- Flexible metadata storage

### Technology Stack
- **Database**: PostgreSQL 14+ (production-ready RDBMS)
- **ORM**: TypeORM 0.3.27
- **Migration Tool**: TypeORM CLI
- **Connection Pooling**: pg-pool (via pg driver)

### Configuration
**File**: `/home/ali/whatsapp-builder/backend/ormconfig.ts`

```typescript
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'whatsapp_builder',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false,  // Use migrations in production
  logging: process.env.DB_LOGGING === 'true',
});
```

---

## Database Schema

### Entity-Relationship Diagram (ERD)

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (UUID) PK    │
│ phoneNumber     │
│ name            │
│ avatar          │
│ createdAt       │
│ updatedAt       │
└────────┬────────┘
         │ 1
         │
         │ M
         ▼
┌─────────────────────────┐         ┌──────────────────┐
│  conversation_          │    M:N  │  conversations   │
│  participants           │◄────────┤──────────────────│
│─────────────────────────│         │ id (UUID) PK     │
│ conversationId FK       │         │ lastMessage      │
│ userId FK               │         │ lastMessageAt    │
└─────────────────────────┘         │ isWindowOpen     │
                                    │ createdAt        │
                                    │ updatedAt        │
                                    └────────┬─────────┘
                                             │ 1
                                             │
                                             │ M
                                             ▼
                      ┌──────────────────────────────────┐
                      │       messages                    │
                      │──────────────────────────────────│
                      │ id (UUID) PK                     │
                      │ conversationId FK (CASCADE)      │
                      │ senderId FK                      │
                      │ type ENUM                        │
                      │ content JSONB                    │
                      │ status ENUM                      │
                      │ timestamp                        │
                      │ createdAt                        │
                      │ updatedAt                        │
                      └──────────────────────────────────┘

┌──────────────────┐
│    chatbots      │
│──────────────────│
│ id (UUID) PK     │
│ name             │
│ description      │
│ nodes JSONB      │
│ edges JSONB      │
│ isActive         │
│ status ENUM      │
│ metadata JSONB   │
│ createdAt        │
│ updatedAt        │
└────────┬─────────┘
         │ 1
         │
         │ M
         ▼
┌─────────────────────────────┐
│  conversation_contexts      │
│─────────────────────────────│
│ id (UUID) PK                │
│ conversationId FK (CASCADE) │
│ chatbotId FK (CASCADE)      │
│ currentNodeId               │
│ variables JSONB             │
│ nodeHistory JSONB           │
│ isActive                    │
│ createdAt                   │
│ updatedAt                   │
└─────────────────────────────┘

┌──────────────────────┐
│  whatsapp_config     │
│──────────────────────│
│ id (UUID) PK         │
│ phoneNumberId        │
│ businessAccountId    │
│ accessToken          │
│ webhookVerifyToken   │
│ appSecret            │
│ isActive             │
│ createdAt            │
│ updatedAt            │
└──────────────────────┘
```

---

## Entity Relationships

### 1. users ↔ conversations (Many-to-Many)
**Junction Table**: `conversation_participants`

```sql
CREATE TABLE conversation_participants (
  conversationId UUID REFERENCES conversations(id),
  userId UUID REFERENCES users(id),
  PRIMARY KEY (conversationId, userId)
);
```

**Use Case**: Multi-participant conversations (group chats support)

### 2. conversations ↔ messages (One-to-Many)
**Foreign Key**: `messages.conversationId → conversations.id`
**Cascade**: ON DELETE CASCADE (delete messages when conversation deleted)

### 3. users ↔ messages (One-to-Many)
**Foreign Key**: `messages.senderId → users.id`

### 4. chatbots ↔ conversation_contexts (One-to-Many)
**Foreign Key**: `conversation_contexts.chatbotId → chatbots.id`
**Cascade**: ON DELETE CASCADE (delete contexts when chatbot deleted)

### 5. conversations ↔ conversation_contexts (One-to-Many)
**Foreign Key**: `conversation_contexts.conversationId → conversations.id`
**Cascade**: ON DELETE CASCADE (delete contexts when conversation deleted)

---

## TypeORM Entities

### User Entity
**File**: `/home/ali/whatsapp-builder/backend/src/entities/user.entity.ts`

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, unique: true })
  phoneNumber: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 500, nullable: true })
  avatar?: string;

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
```

---

### ChatBot Entity
**File**: `/home/ali/whatsapp-builder/backend/src/entities/chatbot.entity.ts`

```typescript
export enum ChatBotStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DRAFT = 'draft',
}

@Entity('chatbots')
export class ChatBot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', default: [] })
  nodes: any[];  // ReactFlow node structure

  @Column({ type: 'jsonb', default: [] })
  edges: any[];  // ReactFlow edge structure

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: ChatBotStatus,
    default: ChatBotStatus.ACTIVE,
  })
  status: ChatBotStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
```

**Key Design Decisions**:
- **JSONB for nodes/edges**: Flexible storage for ReactFlow graph structure
- **isActive + status**: Two-layer control (isActive for runtime, status for lifecycle)
- **metadata**: Extensible field for future features

---

### Conversation Entity
**File**: `/home/ali/whatsapp-builder/backend/src/entities/conversation.entity.ts`

```typescript
@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'conversation_participants',
    joinColumn: { name: 'conversationId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  participants: User[];

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  @Column({ nullable: true, length: 1000 })
  lastMessage: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastMessageAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastCustomerMessageAt: Date;

  @Column({ type: 'boolean', default: true })
  isWindowOpen: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  /**
   * Check if the 24-hour messaging window is still open
   */
  canSendSessionMessage(): boolean {
    if (!this.lastCustomerMessageAt) return false;
    const now = new Date();
    const diff = now.getTime() - this.lastCustomerMessageAt.getTime();
    return diff < 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }
}
```

**Business Logic**:
- **lastCustomerMessageAt**: Tracks WhatsApp's 24-hour messaging window
- **canSendSessionMessage()**: Method to check if free-form messages can be sent

---

### Message Entity
**File**: `/home/ali/whatsapp-builder/backend/src/entities/message.entity.ts`

```typescript
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  STICKER = 'sticker',
  INTERACTIVE = 'interactive',
  REACTION = 'reaction',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  conversationId: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column({ type: 'uuid' })
  senderId: string;

  @ManyToOne(() => User, (user) => user.sentMessages)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Column({ type: 'jsonb' })
  content: any;  // Flexible message content

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENT,
  })
  status: MessageStatus;

  @Column({ type: 'timestamp with time zone' })
  timestamp: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
```

**Content Structure Examples**:
```typescript
// Text message
content: { body: "Hello, world!" }

// Image message
content: { url: "https://...", caption: "Check this out" }

// Interactive button reply
content: { buttonId: "btn-1", title: "Yes" }

// Interactive list reply
content: { listRowId: "row-1", title: "Option 1" }
```

---

### ConversationContext Entity
**File**: `/home/ali/whatsapp-builder/backend/src/entities/conversation-context.entity.ts`

```typescript
@Entity('conversation_contexts')
export class ConversationContext {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  conversationId: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column({ type: 'uuid' })
  chatbotId: string;

  @ManyToOne(() => ChatBot, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chatbotId' })
  chatbot: ChatBot;

  @Column({ length: 255 })
  currentNodeId: string;  // Current ReactFlow node ID

  @Column({ type: 'jsonb', default: {} })
  variables: Record<string, any>;  // User responses, form data

  @Column({ type: 'jsonb', default: [] })
  nodeHistory: string[];  // Traversal history for debugging

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
```

**Usage**:
- **variables**: Store user responses (e.g., `{ name: "John", age: "25" }`)
- **nodeHistory**: Track conversation path for analytics
- **currentNodeId**: Resume conversation from correct node

---

### WhatsAppConfig Entity
**File**: `/home/ali/whatsapp-builder/backend/src/entities/whatsapp-config.entity.ts`

```typescript
@Entity('whatsapp_config')
export class WhatsAppConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  phoneNumberId: string;

  @Column({ length: 255 })
  businessAccountId: string;

  @Column({ type: 'text' })
  accessToken: string;

  @Column({ length: 255 })
  webhookVerifyToken: string;

  @Column({ type: 'text', nullable: true })
  appSecret?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
```

**Constraint**: Only one active config allowed (enforced by partial unique index)

---

## PostgreSQL-Specific Features

### 1. UUID Primary Keys
**Benefit**: Globally unique, no server-side ID generation bottleneck

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);
```

**TypeORM**:
```typescript
@PrimaryGeneratedColumn('uuid')
id: string;
```

### 2. JSONB Columns
**Use Cases**:
1. **nodes/edges**: ReactFlow graph structure (flexible schema)
2. **content**: Variable message payloads
3. **variables**: Chatbot execution state
4. **metadata**: Extensible additional fields

**Advantages**:
- **Indexable**: Can create GIN indexes for fast JSONB queries
- **Queryable**: Support for `->>`, `@>`, `?` operators
- **Flexible**: No schema migrations for new fields

**Example Queries**:
```sql
-- Find chatbots with specific node type
SELECT * FROM chatbots
WHERE nodes @> '[{"type": "question"}]';

-- Extract node count
SELECT name, jsonb_array_length(nodes) as node_count
FROM chatbots;
```

### 3. ENUM Types
**Benefit**: Strict type checking at database level

```sql
CREATE TYPE "message_type" AS ENUM (
  'text', 'image', 'video', 'document', 'audio', 'sticker', 'interactive', 'reaction'
);

CREATE TYPE "message_status" AS ENUM ('sent', 'delivered', 'read');
CREATE TYPE "chatbot_status" AS ENUM ('active', 'archived', 'draft');
```

### 4. TIMESTAMP WITH TIME ZONE
**Benefit**: Timezone-aware timestamps for international users

```sql
CREATE TABLE messages (
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ...
);
```

### 5. CASCADE Deletes
**Benefit**: Automatic cleanup of related records

```sql
ALTER TABLE messages
ADD CONSTRAINT fk_conversation
FOREIGN KEY (conversationId)
REFERENCES conversations(id)
ON DELETE CASCADE;
```

**Effect**: When conversation deleted, all messages automatically deleted

---

## Migrations

### Migration Workflow
1. **Create Migration**: `npm run migration:generate -- src/migrations/MigrationName`
2. **Review Migration**: Check generated SQL in `up()` and `down()` methods
3. **Run Migration**: `npm run migration:run`
4. **Revert Migration**: `npm run migration:revert`

### Example Migration: CreateConversationContextTable
**File**: `/home/ali/whatsapp-builder/backend/src/migrations/1732459200000-CreateConversationContextTable.ts`

```typescript
export class CreateConversationContextTable1732459200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'conversation_contexts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'conversationId',
            type: 'uuid',
          },
          {
            name: 'chatbotId',
            type: 'uuid',
          },
          {
            name: 'currentNodeId',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'variables',
            type: 'jsonb',
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'nodeHistory',
            type: 'jsonb',
            default: "'[]'",
            isNullable: false,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp with time zone',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'conversation_contexts',
      new TableForeignKey({
        columnNames: ['conversationId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'conversations',
        onDelete: 'CASCADE',
        name: 'fk_conversation_context_conversation',
      })
    );

    await queryRunner.createForeignKey(
      'conversation_contexts',
      new TableForeignKey({
        columnNames: ['chatbotId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'chatbots',
        onDelete: 'CASCADE',
        name: 'fk_conversation_context_chatbot',
      })
    );

    // Create indexes
    await queryRunner.createIndex(
      'conversation_contexts',
      new TableIndex({
        name: 'idx_conversation_context_conversation',
        columnNames: ['conversationId'],
      })
    );

    await queryRunner.createIndex(
      'conversation_contexts',
      new TableIndex({
        name: 'idx_conversation_context_chatbot',
        columnNames: ['chatbotId'],
      })
    );

    await queryRunner.createIndex(
      'conversation_contexts',
      new TableIndex({
        name: 'idx_conversation_context_active',
        columnNames: ['isActive'],
      })
    );

    // Composite index for common query pattern
    await queryRunner.createIndex(
      'conversation_contexts',
      new TableIndex({
        name: 'idx_conversation_context_conversation_active',
        columnNames: ['conversationId', 'isActive'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('conversation_contexts', 'idx_conversation_context_conversation_active');
    await queryRunner.dropIndex('conversation_contexts', 'idx_conversation_context_active');
    await queryRunner.dropIndex('conversation_contexts', 'idx_conversation_context_chatbot');
    await queryRunner.dropIndex('conversation_contexts', 'idx_conversation_context_conversation');
    await queryRunner.dropForeignKey('conversation_contexts', 'fk_conversation_context_chatbot');
    await queryRunner.dropForeignKey('conversation_contexts', 'fk_conversation_context_conversation');
    await queryRunner.dropTable('conversation_contexts');
  }
}
```

**Best Practices Observed**:
1. **Explicit Names**: Named foreign keys and indexes for debugging
2. **Composite Index**: `(conversationId, isActive)` covers common query pattern
3. **Reversible**: Proper `down()` method for rollback

---

## Query Patterns

### 1. Find Active Context for Conversation
```typescript
const context = await contextRepo.findOne({
  where: { conversationId, isActive: true },
  relations: ['conversation', 'chatbot'],
});
```

**Generated SQL**:
```sql
SELECT * FROM conversation_contexts
WHERE conversationId = $1 AND isActive = true;
```

**Index Used**: `idx_conversation_context_conversation_active`

### 2. Get Conversation with Participants
```typescript
const conversation = await conversationRepo.findOne({
  where: { id },
  relations: ['participants', 'messages'],
});
```

**Generated SQL**:
```sql
SELECT c.*, u.*, m.*
FROM conversations c
LEFT JOIN conversation_participants cp ON c.id = cp.conversationId
LEFT JOIN users u ON u.id = cp.userId
LEFT JOIN messages m ON m.conversationId = c.id
WHERE c.id = $1;
```

**N+1 Problem**: Consider using `QueryBuilder` with explicit joins

### 3. Get Messages with Pagination
```typescript
const messages = await messageRepo
  .createQueryBuilder('message')
  .where('message.conversationId = :conversationId', { conversationId })
  .orderBy('message.timestamp', 'ASC')
  .skip(offset)
  .take(limit)
  .getMany();
```

**Index Needed**: `idx_messages_conversationId_timestamp`

---

## Optimization Strategies

### Missing Indexes
```sql
-- Messages table
CREATE INDEX idx_messages_conversationId_timestamp
  ON messages(conversationId, timestamp DESC);

-- Chatbots table (partial index)
CREATE INDEX idx_chatbots_active_created
  ON chatbots(isActive, createdAt ASC)
  WHERE isActive = true;

-- Conversations table
CREATE INDEX idx_conversations_lastMessageAt_desc
  ON conversations(lastMessageAt DESC NULLS LAST);
```

### GIN Indexes for JSONB
```sql
-- Enable fast JSONB queries
CREATE INDEX idx_chatbots_nodes_gin ON chatbots USING GIN(nodes);
CREATE INDEX idx_messages_content_gin ON messages USING GIN(content);
```

### Connection Pooling
**File**: `/home/ali/whatsapp-builder/backend/src/config/database.config.ts`

```typescript
extra: {
  max: 10,                      // Max 10 concurrent connections
  idleTimeoutMillis: 30000,     // Release idle connections after 30s
  connectionTimeoutMillis: 2000 // Fail if no connection available after 2s
}
```

**Recommendation**: Increase `max` to 20-50 for production

---

## Summary

### Schema Overview
- **7 tables**: users, chatbots, conversations, messages, conversation_contexts, whatsapp_config, conversation_participants
- **5 JSONB columns**: Flexible data storage
- **3 ENUM types**: Strict type enforcement
- **8 foreign keys**: Referential integrity with CASCADE
- **12+ indexes**: Performance optimization

### Key Design Patterns
1. **UUID Primary Keys**: Globally unique, distributed-friendly
2. **JSONB for Flexibility**: ReactFlow graphs, message payloads, execution state
3. **ENUM for Safety**: Type-checked status values
4. **CASCADE Deletes**: Automatic cleanup
5. **Composite Indexes**: Optimize common query patterns
6. **Partial Indexes**: Smaller, targeted indexes for specific queries

### Future Improvements
1. Add indexes on `messages(conversationId, timestamp)`
2. Implement GIN indexes for JSONB querying
3. Plan message table partitioning (when > 50M rows)
4. Add triggers for `lastMessageAt` updates
5. Optimize N+1 queries with ARRAY_AGG or raw SQL

---

**Next**: See `05-real-time-system.md` for Socket.IO architecture.
