# WhatsApp Builder - Claude Code Agents

Specialized AI agents for WhatsApp Builder development.

## Quick Usage

Invoke any agent by name in Claude Code chat:
```
@chatbot-builder-expert help me design a customer support flow
@whatsapp-flow-builder-expert create an appointment booking flow
```

---

## Available Agents

### Chatbot & Flow Development

| Agent | Description | Use When |
|-------|-------------|----------|
| **chatbot-builder-expert** | Expert in building chatbot conversation flows | Creating chatbots, designing flows, debugging execution |
| **whatsapp-flow-builder-expert** | Expert in WhatsApp Flow JSON structure | Creating WhatsApp Flows, form design, endpoint integration |

### Backend Development

| Agent | Description | Use When |
|-------|-------------|----------|
| **nestjs-expert** | NestJS framework expert | Controllers, services, modules, guards, interceptors |
| **typeorm-expert** | TypeORM & database expert | Entities, migrations, relations, queries |
| **postgresql-expert** | PostgreSQL database expert | SQL queries, schema design, optimization |
| **redis-expert** | Redis caching & queues | Caching strategies, pub/sub, connection management |
| **bullmq-expert** | BullMQ job queue expert | Background jobs, workers, scheduling |

### Frontend Development

| Agent | Description | Use When |
|-------|-------------|----------|
| **react-expert** | React development expert | Components, hooks, state management, performance |
| **reactflow-expert** | ReactFlow integration expert | Node-based UIs, custom nodes/edges, interactions |
| **frontend-tester** | Playwright MCP testing expert | UI testing, E2E tests, test reports, automation |

### Integration & Communication

| Agent | Description | Use When |
|-------|-------------|----------|
| **whatsapp-messaging-api-expert** | WhatsApp Business API expert | Sending messages, templates, interactive messages |
| **whatsapp-flows-expert** | WhatsApp Flows API expert | Flow JSON structure, encryption, endpoint setup |
| **socket-io-expert** | Socket.IO real-time expert | WebSocket gateways, rooms, events |

### Architecture

| Agent | Description | Use When |
|-------|-------------|----------|
| **project-architect** | WhatsApp Builder architecture expert | Feature planning, cross-cutting concerns, onboarding |

---

## Agent Details

### chatbot-builder-expert (NEW)

Expert in building chatbot conversation flows with ReactFlow nodes.

**Capabilities:**
- All 6 node types: START, MESSAGE, QUESTION, CONDITION, WHATSAPP_FLOW, REST_API
- Edge routing and connection logic
- Variable system (`{{variable}}` syntax)
- Button and list question configuration
- REST API integration with dynamic responses
- Best practices and validation rules

**Example Usage:**
```
@chatbot-builder-expert create a menu-based customer support bot with API integration
```

### whatsapp-flow-builder-expert (NEW)

Expert in building WhatsApp Flows with screens, components, and endpoint integration.

**Capabilities:**
- Flow JSON v7.2 specification
- Screen types and layouts
- All component types (TextInput, Dropdown, RadioButtons, DatePicker, etc.)
- Actions (navigate, data_exchange, complete)
- Dynamic data binding (`${form.field}`, `${data.field}`)
- Endpoint encryption (RSA/AES)
- Validation and deployment

**Example Usage:**
```
@whatsapp-flow-builder-expert design a multi-screen appointment booking flow
```

### frontend-tester (NEW)

Frontend testing expert using Playwright MCP.

**Capabilities:**
- Systematic UI testing for all 14 pages
- Playwright MCP tool orchestration
- Standard test report generation
- Priority-based testing (P0-P3)
- Screenshot capture for failures
- Test data management

**Example Usage:**
```
@frontend-tester run login page tests
@frontend-tester run all critical tests (P0)
@frontend-tester generate test report for ChatBots page
```

### project-architect

Comprehensive WhatsApp Builder architecture expert.

**Capabilities:**
- Full technology stack knowledge (NestJS, React, TypeORM, PostgreSQL, Socket.IO)
- Module relationships and dependencies
- Feature planning methodology
- Cross-cutting concerns (auth, logging, validation)
- Onboarding guidance

**Example Usage:**
```
@project-architect analyze the impact of adding a new notification system
```

---

## Related Resources

- **Skills**: See `.claude/skills/README.md` for comprehensive knowledge bases
- **Plans**: Feature planning documents in `.claude/plans/`
- **Documentation**: Project docs in `docs/`

---

## File Locations

All agent files are located in `.claude/agents/`:

```
.claude/agents/
├── README.md (this file)
├── chatbot-builder-expert.md      # Chatbot flow builder
├── whatsapp-flow-builder-expert.md # WhatsApp Flow builder
├── frontend-tester.md             # NEW - Playwright MCP testing
├── bullmq-expert.md
├── nestjs-expert.md
├── postgresql-expert.md
├── project-architect.md
├── react-expert.md
├── reactflow-expert.md
├── redis-expert.md
├── socket-io-expert.md
├── typeorm-expert.md
├── whatsapp-flows-expert.md
└── whatsapp-messaging-api-expert.md
```

---

*Last updated: November 2025*
