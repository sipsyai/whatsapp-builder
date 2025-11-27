# Claude Code - WhatsApp Builder Development Guide

This project uses Claude Code with specialized agents and skills for efficient development.

---

## Quick Start

### Using Agents

Agents are task-focused AI experts. Invoke them directly in chat:

```
@chatbot-builder-expert create a welcome flow with menu buttons
@whatsapp-flow-builder-expert design an appointment booking form
@project-architect what modules would be affected by adding notifications?
```

**Available Agents:** 13 specialized agents
- See full list: `.claude/agents/README.md`

### Using Skills

Skills are comprehensive knowledge bases. They're referenced automatically when relevant:

```
# Skills are activated based on context
# For chatbot/flow development, chatbot-flow-development skill provides:
- Node type documentation
- Variable system reference
- WhatsApp Flow component specs
- Example flows
```

**Available Skills:** 11 skill packages
- See full list: `.claude/skills/README.md`

---

## Development Workflows

### Creating a New Chatbot

1. **Design Phase**
   ```
   @chatbot-builder-expert help me design a customer support flow
   ```

2. **Implementation**
   - Agent provides JSON structure for nodes and edges
   - Includes variable definitions and routing logic

3. **Integration**
   - REST API node configuration
   - WhatsApp Flow integration if needed

### Creating a WhatsApp Flow

1. **Design Phase**
   ```
   @whatsapp-flow-builder-expert create a multi-screen booking form
   ```

2. **Implementation**
   - Agent provides Flow JSON v7.2 structure
   - Screen layouts and component configuration

3. **Deployment**
   - Endpoint integration setup
   - Encryption configuration

### Architecture Questions

```
@project-architect analyze the session management module
@project-architect what's the best approach for adding webhooks?
```

---

## Key Agents for This Project

| Task | Agent | Description |
|------|-------|-------------|
| Build chatbots | `@chatbot-builder-expert` | Flow design, nodes, routing |
| Build WhatsApp Flows | `@whatsapp-flow-builder-expert` | JSON structure, screens, components |
| Backend code | `@nestjs-expert` | Controllers, services, modules |
| Database work | `@typeorm-expert` | Entities, migrations, queries |
| Frontend code | `@react-expert` | Components, hooks, state |
| Architecture | `@project-architect` | Module structure, feature planning |

---

## Key Skills for This Project

| Skill | Use For |
|-------|---------|
| `chatbot-flow-development` | Chatbot nodes, edges, variables, WhatsApp Flow JSON |
| `project-architect` | Project structure, module relationships, tech stack |
| `whatsapp-flows-expert` | WhatsApp Flows API, encryption, endpoints |
| `whatsapp-messaging-api-expert` | Sending messages, templates, interactive elements |

---

## Project Structure

```
whatsapp-builder/
├── backend/                 # NestJS backend
│   ├── src/
│   │   ├── entities/        # TypeORM entities
│   │   └── modules/         # Feature modules
│   └── ...
├── frontend/                # React frontend
│   ├── src/
│   │   ├── features/        # Feature folders
│   │   │   ├── builder/     # Chatbot flow builder
│   │   │   ├── flows/       # WhatsApp Flows management
│   │   │   └── sessions/    # Session management
│   │   └── ...
│   └── ...
├── docs/                    # Project documentation
├── .claude/                 # Claude Code configuration
│   ├── agents/              # 13 AI agents
│   ├── skills/              # 11 skill packages
│   └── plans/               # Feature planning docs
└── CLAUDE.md                # Project-wide instructions
```

---

## Planning New Features

For complex features, use the feature planning workflow:

1. **Start Planning**
   ```
   @project-architect I want to add real-time notifications
   ```

2. **Create Plan Document**
   - Plans stored in `.claude/plans/`
   - Follow `docs/FEATURE_PLANNING_PROMPT.md` methodology

3. **Implementation**
   - Use specialized agents for each area
   - Reference skills for detailed documentation

---

## Related Files

- **CLAUDE.md** - Project-wide Claude Code instructions
- **agents/README.md** - Agent documentation
- **skills/README.md** - Skill documentation
- **docs/** - Project documentation

---

*Last updated: November 2025*
