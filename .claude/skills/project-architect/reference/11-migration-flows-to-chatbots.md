# Migration Guide: Flows → ChatBots

## Table of Contents
- [Overview](#overview)
- [Migration History](#migration-history)
- [Current State](#current-state)
- [Database Migration](#database-migration)
- [Entity System](#entity-system)
- [API Changes](#api-changes)
- [Frontend Changes](#frontend-changes)
- [Upgrade Path](#upgrade-path)

---

## Overview

The WhatsApp Builder project underwent a terminology refactoring from **"Flows"** to **"ChatBots"** to better reflect the platform's purpose and functionality. This document explains the migration, current coexistence of legacy code, and provides guidance for developers.

### Why the Change?

**Before (Flows)**:
- Module name: `FlowsModule`
- Entity: `Flow`
- API endpoints: `/api/flows/*`
- Frontend feature: `features/flows/`

**After (ChatBots)**:
- Module name: `ChatBotsModule`
- Entity: `ChatBot`
- API endpoints: `/api/chatbots/*`
- Frontend feature: `features/chatbots/`

**Rationale**: The term "chatbot" is more descriptive and user-friendly than "flow". While flows represent the visual design, chatbots represent the complete interactive agent.

---

## Migration History

### Migration Timeline

| Date | Event | Files Affected |
|------|-------|----------------|
| 2025-01-03 | Database migration created | `1763984202000-RenameFlowsToChatBots.ts` |
| 2025-01-03 | Backend module renamed | `modules/chatbots/` created |
| 2025-01-03 | New entity created | `chatbot.entity.ts` added |
| 2025-01-03 | API endpoints updated | Controller routes changed |
| 2025-01-03 | Frontend feature added | `features/chatbots/` created |
| 2025-11-24 | Documentation updated | This migration guide created |

---

## Current State

### Dual Entity System

**IMPORTANT**: Both entity files currently exist in the codebase:

1. **`backend/src/entities/chatbot.entity.ts`** ✓ **ACTIVE**
   - Used by all application code
   - Maps to `chatbots` database table
   - Full TypeORM entity with relations

2. **`backend/src/entities/flow.entity.ts`** ⚠️ **LEGACY**
   - Retained for backward compatibility
   - NOT actively used in application
   - May be removed in future version

### Frontend Dual Feature System

**IMPORTANT**: Both frontend features exist:

1. **`frontend/src/features/chatbots/`** ✓ **ACTIVE**
   - Current API client (`/api/chatbots`)
   - Used in production code
   - Full CRUD operations

2. **`frontend/src/features/flows/`** ⚠️ **LEGACY**
   - Old API client (`/flows` - endpoints don't exist)
   - NOT actively used
   - Candidates for removal

---

## Database Migration

### Migration File
**Location**: `/home/ali/whatsapp-builder/backend/src/migrations/1763984202000-RenameFlowsToChatBots.ts`

### What It Does

```typescript
export class RenameFlowsToChatBots1763984202000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Rename table
    await queryRunner.renameTable('flows', 'chatbots');

    // 2. Rename foreign key column in conversation_contexts
    await queryRunner.renameColumn(
      'conversation_contexts',
      'flowId',
      'chatbotId'
    );

    // 3. Update foreign key constraint name
    await queryRunner.query(`
      ALTER TABLE "conversation_contexts"
      RENAME CONSTRAINT "FK_conversation_contexts_flow"
      TO "FK_conversation_contexts_chatbot"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse all changes
    await queryRunner.renameTable('chatbots', 'flows');
    await queryRunner.renameColumn(
      'conversation_contexts',
      'chatbotId',
      'flowId'
    );
    await queryRunner.query(`
      ALTER TABLE "conversation_contexts"
      RENAME CONSTRAINT "FK_conversation_contexts_chatbot"
      TO "FK_conversation_contexts_flow"
    `);
  }
}
```

### Migration Impact

**Tables Affected**:
1. `flows` → `chatbots` (renamed)
2. `conversation_contexts` (foreign key column renamed)

**Data Preserved**:
- ✓ All chatbot data preserved
- ✓ All relationships maintained
- ✓ No data loss
- ✓ Zero downtime (with proper deployment)

**Schema Changes**:
| Before | After |
|--------|-------|
| `flows` table | `chatbots` table |
| `conversation_contexts.flowId` | `conversation_contexts.chatbotId` |
| FK constraint: `FK_conversation_contexts_flow` | FK constraint: `FK_conversation_contexts_chatbot` |

---

## Entity System

### Active Entity: ChatBot

**File**: `/home/ali/whatsapp-builder/backend/src/entities/chatbot.entity.ts`

```typescript
@Entity('chatbots')
export class ChatBot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  nodes: ChatBotNode[];

  @Column({ type: 'jsonb' })
  edges: ChatBotEdge[];

  @Column({
    type: 'enum',
    enum: ChatBotStatus,
    default: ChatBotStatus.DRAFT,
  })
  status: ChatBotStatus;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => ConversationContext, context => context.chatbot)
  contexts: ConversationContext[];
}
```

### Legacy Entity: Flow

**File**: `/home/ali/whatsapp-builder/backend/src/entities/flow.entity.ts`

**Status**: ⚠️ **Legacy - Do NOT use in new code**

This file exists for backward compatibility but is NOT actively used. All references have been updated to use `ChatBot` entity.

**Recommendation**: This file can be safely deleted once all team members have pulled the latest changes.

---

## API Changes

### Endpoint Mapping

| Old Endpoint (Deprecated) | New Endpoint (Active) | Status |
|---------------------------|----------------------|--------|
| `GET /api/flows` | `GET /api/chatbots` | ✓ Migrated |
| `POST /api/flows` | `POST /api/chatbots` | ✓ Migrated |
| `GET /api/flows/:id` | `GET /api/chatbots/:id` | ✓ Migrated |
| `PUT /api/flows/:id` | `PUT /api/chatbots/:id` | ✓ Migrated |
| `DELETE /api/flows/:id` | `DELETE /api/chatbots/:id` | ✓ Migrated |
| `PATCH /api/flows/:id/status` | `PATCH /api/chatbots/:id/status` | ✓ Migrated |
| N/A | `GET /api/chatbots/:id/stats` | ✓ New |
| N/A | `PATCH /api/chatbots/:id` | ✓ New |
| N/A | `PATCH /api/chatbots/:id/toggle-active` | ✓ New |
| N/A | `PATCH /api/chatbots/:id/restore` | ✓ New |
| N/A | `DELETE /api/chatbots/:id/soft` | ✓ New |

### Breaking Changes

**⚠️ IMPORTANT**: Old endpoints (`/api/flows/*`) NO LONGER EXIST.

Any client code using old endpoints will receive **404 Not Found** errors.

### DTO Changes

| Old DTO | New DTO | Status |
|---------|---------|--------|
| `CreateFlowDto` | `CreateChatBotDto` | ✓ Renamed |
| `UpdateFlowDto` | `UpdateChatBotDto` | ✓ Renamed |
| `QueryFlowsDto` | `QueryChatBotsDto` | ✓ Renamed |
| `FlowNodeDto` | `ChatBotNodeDto` | ✓ Renamed |
| `FlowEdgeDto` | `ChatBotEdgeDto` | ✓ Renamed |

**Note**: DTO structure remains identical; only names changed.

---

## Frontend Changes

### API Client Migration

**Old Client** (⚠️ Deprecated):
```typescript
// frontend/src/features/flows/api.ts
export const getFlows = async () => {
  const response = await client.get<{ data: Flow[] }>('/flows');
  return response.data.data;
};
```

**New Client** (✓ Active):
```typescript
// frontend/src/features/chatbots/api.ts
export const getChatBots = async () => {
  const response = await client.get<{ data: ChatBot[] }>('/api/chatbots');
  return response.data.data;
};
```

### Type Definitions

**Old Types** (⚠️ Deprecated):
```typescript
interface Flow {
  id: string;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}
```

**New Types** (✓ Active):
```typescript
interface ChatBot {
  id: string;
  name: string;
  nodes: ChatBotNode[];
  edges: ChatBotEdge[];
}
```

### Component Updates

All components now reference `ChatBot` instead of `Flow`:

- ✓ `ChatBotsListPage.tsx` (was `FlowsListPage.tsx`)
- ✓ Uses `chatbots` feature module
- ✓ Calls `/api/chatbots` endpoints

---

## Upgrade Path

### For Existing Installations

If you have an existing installation with "flows" terminology:

#### Step 1: Pull Latest Code
```bash
git pull origin main
```

#### Step 2: Install Dependencies
```bash
npm run install:all
```

#### Step 3: Run Database Migration
```bash
cd backend
npm run migration:run
```

**What happens**:
- `flows` table renamed to `chatbots`
- Foreign keys updated
- Data preserved

#### Step 4: Restart Backend
```bash
npm run start:dev
```

#### Step 5: Clear Frontend Cache
```bash
cd frontend
rm -rf node_modules/.vite
npm run dev
```

### Verification Checklist

After migration, verify:

- [ ] Backend starts without errors
- [ ] Database has `chatbots` table (not `flows`)
- [ ] `conversation_contexts` has `chatbotId` column
- [ ] API endpoints respond at `/api/chatbots`
- [ ] Frontend loads chatbot list
- [ ] Can create new chatbot
- [ ] Can edit existing chatbot
- [ ] Chatbot execution works

---

## Developer Guidelines

### For New Features

**DO**:
- ✓ Use `ChatBot` entity
- ✓ Reference `/api/chatbots` endpoints
- ✓ Use `chatbots` module
- ✓ Use `features/chatbots/` frontend code

**DON'T**:
- ✗ Reference `Flow` entity
- ✗ Use `/api/flows` endpoints
- ✗ Import from `flows` modules
- ✗ Use `features/flows/` code

### Code Review Checklist

When reviewing PRs, check for:

- [ ] No references to `Flow` entity (use `ChatBot`)
- [ ] No `/api/flows` endpoints (use `/api/chatbots`)
- [ ] No imports from `flows` modules
- [ ] Proper use of updated terminology in comments
- [ ] Documentation uses "chatbot" terminology

### Search & Replace Patterns

If you find legacy code, use these patterns:

| Find | Replace |
|------|---------|
| `/api/flows` | `/api/chatbots` |
| `FlowsModule` | `ChatBotsModule` |
| `FlowsService` | `ChatBotsService` |
| `Flow` (entity) | `ChatBot` |
| `flow.entity` | `chatbot.entity` |
| `CreateFlowDto` | `CreateChatBotDto` |

**⚠️ CAUTION**: Do NOT replace:
- "flow" in ReactFlow context (e.g., `useNodesState`)
- "flow" in WhatsApp Flows context (e.g., `WhatsAppFlowService`)
- "flow" in data flow diagrams (e.g., "message flow")

---

## Troubleshooting

### Common Issues

#### Issue 1: "Table 'flows' does not exist"

**Cause**: Migration not run
**Solution**:
```bash
cd backend
npm run migration:run
```

#### Issue 2: "Cannot find module 'flows'"

**Cause**: Legacy import statement
**Solution**: Update import to use `chatbots`:
```typescript
// Before
import { Flow } from '../flows';

// After
import { ChatBot } from '../chatbots';
```

#### Issue 3: "404 Not Found on /api/flows"

**Cause**: Using old API endpoint
**Solution**: Update to `/api/chatbots`:
```typescript
// Before
await client.get('/api/flows');

// After
await client.get('/api/chatbots');
```

#### Issue 4: "Property 'flowId' does not exist"

**Cause**: Old entity reference
**Solution**: Update to `chatbotId`:
```typescript
// Before
context.flowId

// After
context.chatbotId
```

---

## Future Cleanup

### Candidates for Removal

Once migration is complete and stable, consider removing:

1. **Legacy Entity File**
   - `/backend/src/entities/flow.entity.ts`
   - ⚠️ Only remove after confirming no dependencies

2. **Legacy Frontend Feature**
   - `/frontend/src/features/flows/`
   - ⚠️ Verify not used before deletion

3. **Backup Files**
   - `/backend/src/app.module.ts.backup`
   - Contains old `FlowsModule` reference

### Cleanup Checklist

Before removing legacy code:

- [ ] Grep codebase for any remaining references
- [ ] Check all imports in IDE
- [ ] Run full test suite
- [ ] Verify production deployment works
- [ ] Get team approval

---

## References

### Related Documentation
- [Backend Architecture](02-backend-architecture.md) - Updated module structure
- [Database Design](04-database-design.md) - Entity relationships
- [API Documentation](02-backend-architecture.md#controllers--routing) - Endpoint reference

### Migration File Location
```
/home/ali/whatsapp-builder/backend/src/migrations/1763984202000-RenameFlowsToChatBots.ts
```

---

**Last Updated**: 2025-11-24
**Document Version**: 1.0
**Author**: Project Architecture Team
