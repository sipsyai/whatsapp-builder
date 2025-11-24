# PostgreSQL Database Architecture - WhatsApp Builder

## 1. Database Schema Structure

### Connection Configuration
**File:** `/home/ali/whatsapp-builder/backend/src/config/database.config.ts`

```typescript
extra: {
  max: 10,                      // Connection pool size
  idleTimeoutMillis: 30000,     // 30s idle timeout
  connectionTimeoutMillis: 2000, // 2s connection timeout
}
```

**PostgreSQL Feature:** Connection pooling via `pg` driver with pg-pool. Pool exhaustion can stall requests; monitor `max` connections against concurrent NestJS request load.

---

### Table Schema Overview

#### 1. **users** (Base entity)
```typescript
@Entity('users')
{
  id: UUID (PK, gen_random_uuid())
  phoneNumber: VARCHAR(20) UNIQUE
  name: VARCHAR(100)
  avatar: VARCHAR(500) nullable
  createdAt: TIMESTAMP WITH TIME ZONE
  updatedAt: TIMESTAMP WITH TIME ZONE
}
```

**PostgreSQL Feature:** Uses native UUID type with `gen_random_uuid()` default. `TIMESTAMP WITH TIME ZONE` ensures timezone-aware timestamps for international WhatsApp conversations.

---

#### 2. **chatbots** (formerly "flows")
```typescript
@Entity('chatbots')
{
  id: UUID (PK, gen_random_uuid())
  name: VARCHAR(255)
  description: TEXT nullable
  nodes: JSONB (default: [])
  edges: JSONB (default: [])
  isActive: BOOLEAN (default: true)
  status: ENUM (active|archived|draft)
  metadata: JSONB nullable
  createdAt: TIMESTAMP WITH TIME ZONE
  updatedAt: TIMESTAMP WITH TIME ZONE
}
```

**PostgreSQL Features:**
- **JSONB:** Stores ReactFlow graph structure (nodes/edges). JSONB supports indexing & querying.
- **ENUM:** `ChatBotStatus` enum type for strict status values
- **TEXT vs VARCHAR:** Description uses TEXT (no length limit) vs fixed-length VARCHAR for name

**Migration:** `/home/ali/whatsapp-builder/backend/src/migrations/1763984202000-RenameFlowsToChatBots.ts`
- Uses `ALTER TABLE` to rename table and constraint references
- Demonstrates safe refactoring with DROP CONSTRAINT IF EXISTS pattern

---

#### 3. **conversations** (Many-to-many with users)
```typescript
@Entity('conversations')
{
  id: UUID (PK, gen_random_uuid())
  participants: User[] (M2M via conversation_participants junction table)
  messages: Message[] (1:N inverse)
  lastMessage: VARCHAR(1000) nullable
  lastMessageAt: TIMESTAMP WITH TIME ZONE nullable
  lastCustomerMessageAt: TIMESTAMP WITH TIME ZONE nullable
  isWindowOpen: BOOLEAN (default: true)
  createdAt: TIMESTAMP WITH TIME ZONE
  updatedAt: TIMESTAMP WITH TIME ZONE
}
```

**PostgreSQL Features:**
- **M2M JoinTable:** TypeORM creates junction table `conversation_participants`
- **24-hour Window Tracking:** `lastCustomerMessageAt` supports WhatsApp's 24-hour messaging window business logic

**Business Logic (entity):**
```typescript
canSendSessionMessage(): boolean {
  if (!this.lastCustomerMessageAt) return false;
  const now = new Date();
  const diff = now.getTime() - this.lastCustomerMessageAt.getTime();
  return diff < 24 * 60 * 60 * 1000; // 24h in ms
}
```

This should be computed/cached via a database trigger or materialized view for high-volume scenarios.

---

#### 4. **messages** (Transactional, high-volume table)
```typescript
@Entity('messages')
{
  id: UUID (PK, gen_random_uuid())
  conversationId: UUID (FK -> conversations.id, CASCADE)
  senderId: UUID (FK -> users.id)
  type: ENUM (text|image|video|document|audio|sticker|interactive|reaction)
  content: JSONB (message payload)
  status: ENUM (sent|delivered|read)
  timestamp: TIMESTAMP WITH TIME ZONE
  createdAt: TIMESTAMP WITH TIME ZONE
  updatedAt: TIMESTAMP WITH TIME ZONE
}
```

**PostgreSQL Features:**
- **JSONB content:** Stores variable message payloads (text, media URLs, interactive buttons, etc.)
- **ENUM types:** Strict message types and status tracking
- **Cascade DELETE:** Deleting conversation auto-deletes messages
- **Multiple timestamps:** `timestamp` (message send time) vs `createdAt` (DB insert time)

**Index Opportunity:** Missing index on `(conversationId, timestamp DESC)` for message fetching. Migration doesn't create indexes on this table.

---

#### 5. **conversation_contexts** (Chatbot execution state)
```typescript
@Entity('conversation_contexts')
{
  id: UUID (PK, gen_random_uuid())
  conversationId: UUID (FK -> conversations.id, CASCADE)
  chatbotId: UUID (FK -> chatbots.id, CASCADE)
  currentNodeId: VARCHAR(255) (ReactFlow node ID)
  variables: JSONB (default: {})
  nodeHistory: JSONB (default: [])
  isActive: BOOLEAN (default: true)
  createdAt: TIMESTAMP WITH TIME ZONE
  updatedAt: TIMESTAMP WITH TIME ZONE
}
```

**PostgreSQL Features:**
- **JSONB variables/nodeHistory:** Stores chatbot execution state (form fields, traversal history)

**Indexes (created in migration):**
```sql
idx_conversation_context_conversation          -- single column
idx_conversation_context_flow                  -- single column (now chatbot)
idx_conversation_context_active                -- isActive boolean
idx_conversation_context_conversation_active   -- composite (conversationId, isActive)
```

This composite index is excellent for the query: "Get active context for conversation X"

---

#### 6. **whatsapp_config** (Single-row configuration)
```typescript
@Entity('whatsapp_config')
{
  id: UUID (PK, gen_random_uuid())
  phoneNumberId: VARCHAR(255)
  businessAccountId: VARCHAR(255)
  accessToken: TEXT
  webhookVerifyToken: VARCHAR(255)
  appSecret: TEXT nullable
  isActive: BOOLEAN (default: true)
  createdAt: TIMESTAMP WITH TIME ZONE
  updatedAt: TIMESTAMP WITH TIME ZONE
}
```

**PostgreSQL Features:**
- **Partial Unique Index (migration 1732402800000):**
```sql
CREATE UNIQUE INDEX idx_whatsapp_config_active
  ON whatsapp_config(is_active)
  WHERE is_active = true;
```

This enforces only one active config via database constraint, not application logic. Prevents race conditions.

---

## 2. PostgreSQL-Specific Features Analysis

### A. JSONB Usage (Strengths & Weaknesses)

**Current Use Cases:**
1. **Flow nodes/edges:** `chatbots.nodes`, `chatbots.edges` (ReactFlow graph structure)
2. **Message content:** `messages.content` (variable payload structure)
3. **Chatbot state:** `conversation_contexts.variables`, `conversation_contexts.nodeHistory`
4. **Metadata:** `chatbots.metadata` (flexible additional fields)

**Strengths:**
- Flexible schema for graph/tree structures without multiple tables
- Supports nested queries: `SELECT data->>'type' FROM messages WHERE data @> '{"type":"text"}'`
- GIN indexing for JSONB is not implemented (see Optimization section)

**Weaknesses:**
```typescript
// From chatbot-execution.service.ts:41-43
const chatbot = await this.chatbotRepo.findOne({
  where: { isActive: true },
  order: { createdAt: 'ASC' },
});

// TypeORM loads entire JSONB columns even if only querying metadata
// SELECT * FROM chatbots WHERE isActive = true ORDER BY createdAt ASC
// Pulls 20KB JSONB into memory for every chatbot
```

No JSONB-specific querying used; entire objects loaded. Consider creating computed columns or separate tables if filtering on JSONB keys becomes common.

---

### B. ENUM Types

**Defined Enums:**
```typescript
// message.entity.ts
enum MessageType { TEXT, IMAGE, VIDEO, DOCUMENT, AUDIO, STICKER, INTERACTIVE, REACTION }
enum MessageStatus { SENT, DELIVERED, READ }

// chatbot.entity.ts / flow.entity.ts
enum ChatBotStatus { ACTIVE, ARCHIVED, DRAFT }
enum FlowStatus { ACTIVE, ARCHIVED, DRAFT }
```

**PostgreSQL Constraint:** Creates actual enum types:
```sql
CREATE TYPE "message_type" AS ENUM ('text', 'image', 'video', ...);
CREATE TYPE "message_status" AS ENUM ('sent', 'delivered', 'read');
```

**Best Practice Observed:** Strict enums prevent invalid states at the database layer.

---

### C. Timestamps with Time Zone

**Consistent Use:**
```typescript
@CreateDateColumn({ type: 'timestamp with time zone' })
createdAt: Date;

@UpdateDateColumn({ type: 'timestamp with time zone' })
updatedAt: Date;
```

All timestamps use `TIMESTAMP WITH TIME ZONE` (alias `TIMESTAMPTZ`). This is correct for:
- International messaging (WhatsApp spans timezones)
- Business logic on timestamps (24h window uses client's local time implicitly)

**Recommendation:** Explicitly document timezone expectations. Currently `canSendSessionMessage()` uses JavaScript `Date.getTime()` which assumes client-side timezone context.

---

### D. UUID Primary Keys

**Implementation:**
```typescript
@PrimaryGeneratedColumn('uuid')
id: string;
```

**PostgreSQL:** Uses `gen_random_uuid()` function (v13+).

**Trade-offs:**
- Pros: Globally unique, no server-side ID generation bottleneck, distributed ID generation
- Cons: Index fragmentation (UUIDs random, not sequential like BIGINT), slower B-tree searches than BIGINT

**For WhatsApp Builder:** UUID is appropriate because:
1. No high-frequency ID generation contention
2. Frontend UUID generation possible (not done, but feasible)
3. Multi-region architecture ready

---

## 3. Query Optimization Strategies

### A. Current Query Patterns (from service code)

**Conversation Fetch (High-volume):**
```typescript
// conversations.service.ts:20-24
async findAll(): Promise<Conversation[]> {
  return await this.conversationRepository.find({
    relations: ['participants', 'messages'],
    order: { lastMessageAt: 'DESC' },
  });
}
```

**Generated SQL (unoptimized):**
```sql
SELECT c.* FROM conversations c
LEFT JOIN conversation_participants cp ON c.id = cp.conversationId
LEFT JOIN users u ON u.id = cp.userId
LEFT JOIN messages m ON m.conversationId = c.id
ORDER BY c.lastMessageAt DESC;
-- N+1 problem: 1 query fetches conversations, then N queries fetch relations
```

**PostgreSQL Optimization:**
```sql
-- Use LEFT JOIN with DISTINCT ON to avoid cartesian explosion
SELECT DISTINCT ON (c.id) c.*, cp.id as participant_id, u.id as user_id
FROM conversations c
LEFT JOIN conversation_participants cp ON c.id = cp.conversationId
LEFT JOIN users u ON u.id = cp.userId
ORDER BY c.id, c.lastMessageAt DESC;

-- Or use window functions to avoid duplicate rows
SELECT c.*,
  ARRAY_AGG(DISTINCT u.id) as participant_ids
FROM conversations c
LEFT JOIN conversation_participants cp ON c.id = cp.conversationId
LEFT JOIN users u ON u.id = cp.userId
GROUP BY c.id
ORDER BY c.lastMessageAt DESC;
```

**Index Recommendation:**
```sql
CREATE INDEX idx_conversations_lastMessageAt_desc
  ON conversations(lastMessageAt DESC NULLS LAST);
```

---

### B. Chatbot Execution Query

```typescript
// chatbot-execution.service.ts:41-44
const chatbot = await this.chatbotRepo.findOne({
  where: { isActive: true },
  order: { createdAt: 'ASC' },
});
```

**Current Index:** No index on `(isActive, createdAt)`. Migration doesn't create any indexes on chatbots table.

**PostgreSQL Optimization:**
```sql
CREATE INDEX idx_chatbots_active_created
  ON chatbots(isActive, createdAt ASC)
  WHERE isActive = true;  -- Partial index
```

Partial index is superior because:
- Smaller index size (only ~1-2 active chatbots typically)
- Query planner automatically uses it for `WHERE isActive = true`

---

### C. Conversation Context Lookup (Chatbot State)

```typescript
// chatbot-execution.service.ts: implicit query
const context = await this.contextRepo.find({
  where: {
    conversationId: conversationId,
    isActive: true
  }
});
```

**Excellent Index Coverage:**
```sql
-- From migration 1732459200000
idx_conversation_context_conversation_active -- (conversationId, isActive)
```

This composite index perfectly covers the query. The order `(conversationId, isActive)` is optimal for:
```sql
SELECT * FROM conversation_contexts
WHERE conversationId = $1 AND isActive = true;
```

---

## 4. Connection Pooling Configuration

**From `/home/ali/whatsapp-builder/backend/src/config/database.config.ts`:**

```typescript
extra: {
  max: 10,                      // Max 10 concurrent connections
  idleTimeoutMillis: 30000,     // Release idle connections after 30s
  connectionTimeoutMillis: 2000, // Fail if no connection available after 2s
}
```

**PostgreSQL Context:**

| Parameter | Current | Recommendation | Rationale |
|-----------|---------|-----------------|-----------|
| **max** | 10 | 20-50 | NestJS request concurrency often > 10. Monitor during load testing. |
| **idleTimeoutMillis** | 30000 | 30000-60000 | Good. Prevents "idle in transaction" state. |
| **connectionTimeoutMillis** | 2000 | 2000-5000 | Low risk of connection starvation with current load. Monitor for spikes. |

**PostgreSQL Server-Side Check:**
```sql
-- Verify pool size doesn't exceed server max_connections
SHOW max_connections;  -- Default 100

-- Monitor active connections
SELECT datname, count(*) FROM pg_stat_activity
GROUP BY datname ORDER BY count DESC;
```

---

## 5. Best Practices Observed

### Strengths

1. **Synchronize: false**
   ```typescript
   synchronize: false,  // Use migrations, not auto-sync
   ```
   Excellent practice. Auto-sync is dangerous in production.

2. **Explicit Migrations**
   - Timestamp-based migration names: `1732402800000-CreateWhatsAppConfigTable.ts`
   - Proper up/down methods for reversibility
   - Creates foreign keys explicitly in migrations (not entity decorators)

3. **Cascade Deletes**
   ```typescript
   @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
   ```
   Messages deleted when conversation deleted. Prevents orphaned data.

4. **Partial Index Constraint**
   ```sql
   CREATE UNIQUE INDEX idx_whatsapp_config_active
     ON whatsapp_config(is_active)
     WHERE is_active = true;
   ```
   Enforces single active config without application logic.

---

### Gaps & Improvements

| Issue | Impact | Solution |
|-------|--------|----------|
| **No indexes on messages table** | Slow message pagination | Add `idx_messages_conversationId_timestamp` |
| **No indexes on chatbots table** | Slow chatbot queries | Add partial index on `(isActive, createdAt)` |
| **No JSONB indexes (GIN)** | JSONB filtering slow | Add `CREATE INDEX idx_nodes_gin ON chatbots USING GIN(nodes)` if querying nodes |
| **N+1 problem in findAll()** | Memory spike with many conversations | Use raw SQL with ARRAY_AGG or implement cursor-based pagination |
| **Missing foreign key indexes** | Foreign key lookups slow | PostgreSQL auto-creates these for defined FKs |
| **No partitioning** | Row count grows unbounded | Plan message table partitioning by conversationId or date if > 100M rows |

---

## 6. Migration Best Practices Demonstrated

### Example: CreateConversationContextTable Migration

**File:** `/home/ali/whatsapp-builder/backend/src/migrations/1732459200000-CreateConversationContextTable.ts`

**Excellent Patterns:**
```typescript
// 1. Explicit UUID with gen_random_uuid() default
{
  name: 'id',
  type: 'uuid',
  isPrimary: true,
  default: 'gen_random_uuid()',
}

// 2. JSONB with proper defaults
{
  name: 'variables',
  type: 'jsonb',
  default: "'{}'",  // String literal for migration
  isNullable: false,
}

// 3. Explicit foreign key creation with constraints
new TableForeignKey({
  columnNames: ['conversationId'],
  referencedColumnNames: ['id'],
  referencedTableName: 'conversations',
  onDelete: 'CASCADE',
  name: 'fk_conversation_context_conversation',
})

// 4. Composite index for optimal query coverage
new TableIndex({
  name: 'idx_conversation_context_conversation_active',
  columnNames: ['conversationId', 'isActive'],
})

// 5. Proper cleanup in down() method
await queryRunner.dropIndex(...);
await queryRunner.dropForeignKey(...);
await queryRunner.dropTable(...);
```

---

## 7. Data Growth & Scaling Considerations

### Current Schema Metrics

| Table | Row Growth | Size Concern | Recommendation |
|-------|-----------|--------------|-----------------|
| **users** | Slow (WhatsApp contacts) | < 100K | No action needed |
| **chatbots** | Very slow (manual creation) | < 10K | No action needed |
| **conversations** | Moderate (active conversations) | < 1M possible | Monitor; add archival strategy |
| **messages** | Fast (high-volume transactions) | > 100M likely | **Partition by conversationId or date** |
| **conversation_contexts** | Moderate (1 per active conversation) | < 1M | No action needed |

### Message Table Partitioning Strategy

When messages exceed 50M rows, partition by conversation:

```sql
-- Create partitioned table (PostgreSQL 11+)
CREATE TABLE messages_partitioned (
  -- same columns as messages
  PARTITION BY HASH (conversationId)
) PARTITION BY HASH (conversationId);

CREATE TABLE messages_p0 PARTITION OF messages_partitioned
  FOR VALUES WITH (modulus 8, remainder 0);
-- ... more partitions

-- Migrate data, swap tables
```

Benefits:
- Indexes smaller per partition
- Vacuum operations faster
- Parallel query execution

---

## 8. Performance Monitoring Queries

```sql
-- 1. Find slow tables by size
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 2. Find unused indexes
SELECT schemaname, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(relid) DESC;

-- 3. Monitor table bloat
SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 4. Check connection pool usage
SELECT datname, usename, state, count(*)
FROM pg_stat_activity
GROUP BY datname, usename, state;
```

---

## Summary: PostgreSQL Features Used

| Feature | Usage | File |
|---------|-------|------|
| **UUID Type** | Primary keys across all tables | All `.entity.ts` |
| **JSONB** | Flow structure, message payload, chatbot state | `chatbot.entity.ts`, `message.entity.ts`, `conversation-context.entity.ts` |
| **ENUM Types** | Message types, statuses, flow status | `message.entity.ts`, `chatbot.entity.ts` |
| **TIMESTAMP WITH TIME ZONE** | Timezone-aware timestamps | All entities |
| **Foreign Keys with CASCADE** | Referential integrity | `message.entity.ts`, `conversation-context.entity.ts` |
| **Partial Unique Index** | Single active WhatsApp config constraint | `CreateWhatsAppConfigTable` migration |
| **Composite Index** | Conversation context lookup optimization | `CreateConversationContextTable` migration |
| **gen_random_uuid()** | UUID generation | All migrations |

---

## Recommendations for Project Architect Skill

1. **Add missing indexes:** Messages table needs composite index on `(conversationId, timestamp)`
2. **Implement GIN indexes:** If JSONB node querying becomes common, add `USING GIN` indexes
3. **Monitor connection pool:** Increase `max` from 10 to 20-30 if performance tests show connection timeouts
4. **Plan message partitioning:** Before messages > 50M rows, implement hash or range partitioning
5. **Optimize N+1 queries:** Use ARRAY_AGG or raw SQL for conversation fetches with participants
6. **Add triggers for timestamps:** Track `lastMessageAt` with database trigger instead of application logic
7. **Validate timezone handling:** Document whether WhatsApp timestamps are UTC or user-local
