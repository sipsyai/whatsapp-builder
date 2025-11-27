# WhatsApp Builder - Claude Code Skills

Comprehensive knowledge bases for WhatsApp Builder development.

## What are Skills?

Skills are organized reference documentation that Claude Code uses automatically when relevant topics come up. Each skill contains:
- **SKILL.md** - Main skill definition and quick reference
- **README.md** - Overview and usage guide
- **reference/** - Detailed documentation files

---

## Available Skills

### Project-Specific

| Skill | Description | Topics |
|-------|-------------|--------|
| **chatbot-flow-development** | Complete chatbot & WhatsApp Flow guide | Node types, edge routing, variables, screens, components, actions, examples |
| **project-architect** | WhatsApp Builder architecture | Module structure, tech stack, relationships, feature planning |

### Technology Stack

| Skill | Description | Topics |
|-------|-------------|--------|
| **nestjs-expert** | NestJS framework | Controllers, services, modules, guards, pipes |
| **typeorm-development** | TypeORM ORM | Entities, relations, migrations, queries |
| **postgresql-expert** | PostgreSQL database | SQL, schema design, indexes, optimization |
| **redis-development** | Redis cache & queues | Data types, commands, patterns, pub/sub |
| **react-expert** | React development | Components, hooks, state, performance |
| **reactflow-development** | ReactFlow visual builder | Nodes, edges, interactions, custom elements |
| **socket-io-expert** | Socket.IO real-time | Gateways, rooms, events, namespaces |

### WhatsApp Integration

| Skill | Description | Topics |
|-------|-------------|--------|
| **whatsapp-flows-expert** | WhatsApp Flows API | Flow JSON, screens, components, encryption |
| **whatsapp-messaging-api-expert** | WhatsApp Business API | Messages, templates, interactive elements |

---

## Skill Details

### chatbot-flow-development (NEW)

Complete guide for building chatbots and WhatsApp Flows.

**Reference Files:**
| File | Content |
|------|---------|
| `01-chatbot-node-types.md` | All 6 node types with properties and examples |
| `02-chatbot-edge-routing.md` | Edge connections, routing logic, branching |
| `03-chatbot-variables.md` | Variable system, scopes, binding syntax |
| `04-whatsapp-flow-screens.md` | Screen types, layouts, navigation |
| `05-whatsapp-flow-components.md` | All component types with properties |
| `06-whatsapp-flow-actions.md` | Actions, data_exchange, complete flow |
| `07-rest-api-integration.md` | API calls, response mapping, error handling |
| `08-examples.md` | 7 complete flow examples |

**Covers:**
- Chatbot node types (START, MESSAGE, QUESTION, CONDITION, WHATSAPP_FLOW, REST_API)
- WhatsApp Flow JSON v7.2 specification
- Variable binding and dynamic content
- REST API integration patterns
- Best practices and validation

### project-architect

WhatsApp Builder architecture and structure knowledge.

**Reference Files:**
| File | Content |
|------|---------|
| `01-executive-summary.md` | Project overview and goals |
| `02-technology-stack.md` | All technologies used |
| `03-project-structure.md` | Directory layout and organization |
| `04-backend-architecture.md` | NestJS modules and services |
| `05-frontend-architecture.md` | React components and features |
| `06-database-schema.md` | Entity relationships |
| `07-authentication.md` | JWT auth flow |
| `08-websocket-integration.md` | Real-time communication |
| `09-whatsapp-integration.md` | WhatsApp API integration |
| And more... | 17+ reference documents |

---

## Directory Structure

```
.claude/skills/
├── README.md (this file)
├── chatbot-flow-development/          # NEW
│   ├── SKILL.md
│   ├── README.md
│   └── reference/
│       ├── 01-chatbot-node-types.md
│       ├── 02-chatbot-edge-routing.md
│       ├── 03-chatbot-variables.md
│       ├── 04-whatsapp-flow-screens.md
│       ├── 05-whatsapp-flow-components.md
│       ├── 06-whatsapp-flow-actions.md
│       ├── 07-rest-api-integration.md
│       └── 08-examples.md
├── project-architect/
│   ├── SKILL.md
│   └── reference/ (17 files)
├── nestjs-expert/
├── typeorm-development/
├── postgresql-expert/
├── redis-development/
├── react-expert/
├── reactflow-development/
├── socket-io-expert/
├── whatsapp-flows-expert/
└── whatsapp-messaging-api-expert/
```

---

## Related Resources

- **Agents**: See `.claude/agents/README.md` for interactive AI assistants
- **Plans**: Feature planning documents in `.claude/plans/`
- **Documentation**: Project docs in `docs/`

---

*Last updated: November 2025*
