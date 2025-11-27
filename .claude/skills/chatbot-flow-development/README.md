# Chatbot Flow Development Skill

## Overview

This skill provides comprehensive knowledge for building conversational chatbots and interactive WhatsApp Flows in the WhatsApp Builder platform. It serves as a complete reference guide for developers creating node-based conversation flows, designing WhatsApp Flow JSON structures, integrating REST APIs, and managing dynamic variables.

## What This Skill Covers

### Chatbot System
- **6 Node Types**: Start, Message, Question, Condition, REST API, WhatsApp Flow
- **Edge Routing**: Connection rules, validation, branching logic
- **Variable System**: Built-in variables, custom variables, interpolation syntax
- **Flow Execution**: State machine pattern, context management

### WhatsApp Flow System
- **Flow JSON v7.2**: Official WhatsApp Flow specification
- **Screen Architecture**: Regular screens, terminal screens, navigation
- **10+ Components**: Input fields, dropdowns, checkboxes, date pickers
- **Actions**: navigate, update_data, complete, open_url
- **Data Binding**: Variable interpolation, form state management

### Integration
- **REST API**: Request configuration, response mapping, error handling
- **Chatbot ↔ Flow**: Data passing, response handling
- **External Systems**: CRM, databases, authentication services

### Best Practices
- Conversation design patterns
- User experience optimization
- Error handling strategies
- Testing methodologies

## Quick Reference

### Chatbot Node Types

| Node Type | Purpose | Configuration |
|-----------|---------|---------------|
| **start** | Flow entry point | None required |
| **message** | Send text message | Text with {{variables}} |
| **question** | Get user input | Question + buttons/list + variable |
| **condition** | Branch logic | Expression + true/false paths |
| **whatsapp_flow** | Trigger WA Flow | Flow ID + initial data |
| **rest_api** | External API call | URL, method, headers, body, mapping |

### WhatsApp Flow Components

| Component | Use Case | Key Properties |
|-----------|----------|----------------|
| **TextInput** | Single-line text entry | label, name, required, input-type |
| **TextArea** | Multi-line text | label, name, required, max-length |
| **Dropdown** | Select from options | label, name, data-source |
| **RadioButtonsGroup** | Single choice | label, name, data-source |
| **CheckboxGroup** | Multiple choices | label, name, data-source |
| **DatePicker** | Date selection | label, name, min-date, max-date |
| **OptIn** | Consent checkbox | label, name, required |
| **Footer** | Action buttons | label, on-click-action |

### Variable Interpolation

**In Messages:**
```
Hello {{user_name}}! Your order {{order_id}} is ready.
```

**In Conditions:**
```
{{age}} >= 18 && {{country}} == "Turkey"
```

**In API URLs:**
```
https://api.example.com/users/{{user_id}}/orders
```

**In WhatsApp Flows:**
```json
"label": "Welcome ${user_name}",
"value": "${email}"
```

### REST API JSONPath Examples

**Extract single value:**
```
$.data.user.email
```

**Extract array item:**
```
$.items[0].name
```

**Extract nested value:**
```
$.response.data.results[0].id
```

## When to Use This Skill

Use the **chatbot-flow-development** skill when you need:

### Deep Reference Documentation
- Complete node type specifications
- WhatsApp Flow JSON structure reference
- Component property lists
- Action configuration details

### Code Examples and Templates
- Working chatbot flow patterns
- Complete WhatsApp Flow JSON examples
- API integration examples
- Common conversation patterns

### Best Practices Guidance
- Conversation design principles
- UX optimization strategies
- Error handling patterns
- Testing approaches

### Troubleshooting Help
- Flow execution debugging
- Variable interpolation issues
- API integration problems
- WhatsApp Flow validation errors

### Implementation Planning
- Architecture decisions
- Flow design strategies
- Integration patterns
- Data modeling

## Directory Structure

```
chatbot-flow-development/
├── SKILL.md                              # Main skill file (this document)
├── README.md                             # Skill overview and quick reference
└── reference/                            # Detailed reference documentation
    ├── 01-chatbot-node-types.md         # Complete node type reference
    ├── 02-chatbot-edge-routing.md       # Edge types and routing rules
    ├── 03-chatbot-variables.md          # Variable system and interpolation
    ├── 04-whatsapp-flow-screens.md      # Screen structure and navigation
    ├── 05-whatsapp-flow-components.md   # All component types and properties
    ├── 06-whatsapp-flow-actions.md      # Actions and event handling
    ├── 07-rest-api-integration.md       # API integration patterns
    └── 08-examples.md                   # Complete working examples
```

## How to Use

### For Building Chatbots

1. **Start with SKILL.md** - Understand core concepts and patterns
2. **Reference 01-chatbot-node-types.md** - Configure each node type
3. **Reference 02-chatbot-edge-routing.md** - Connect nodes properly
4. **Reference 03-chatbot-variables.md** - Implement dynamic content
5. **Reference 08-examples.md** - See complete working examples

### For Building WhatsApp Flows

1. **Start with SKILL.md** - Understand Flow architecture
2. **Reference 04-whatsapp-flow-screens.md** - Design screen structure
3. **Reference 05-whatsapp-flow-components.md** - Add form components
4. **Reference 06-whatsapp-flow-actions.md** - Configure navigation and actions
5. **Reference 08-examples.md** - Copy working Flow JSON templates

### For API Integration

1. **Reference 07-rest-api-integration.md** - Configure API nodes
2. **Reference 03-chatbot-variables.md** - Map response data to variables
3. **Reference 08-examples.md** - See API integration patterns

## Common Use Cases

### 1. Lead Generation Flow
- Collect contact information
- Qualify leads with questions
- Submit to CRM via API
- **See**: reference/08-examples.md - Lead Generation Example

### 2. Appointment Booking
- Show available time slots
- Collect booking details with WhatsApp Flow
- Create appointment via API
- Send confirmation
- **See**: reference/08-examples.md - Appointment Booking Example

### 3. Customer Support
- Categorize issue with questions
- Create support ticket via API
- Provide ticket number
- **See**: reference/08-examples.md - Support Ticket Example

### 4. E-commerce Product Browse
- Show product catalog
- Collect preferences
- Filter products with conditions
- Process order with WhatsApp Flow
- **See**: reference/08-examples.md - E-commerce Example

## Quick Start Templates

### Simple Question → Message Flow

```
START
  ↓
Question: "What's your name?"
  Variable: user_name
  ↓
Message: "Nice to meet you, {{user_name}}!"
```

### Branching Condition Flow

```
START
  ↓
Question: "Are you 18 or older?"
  Buttons: "Yes", "No"
  Variable: is_adult
  ↓
Condition: {{is_adult}} == "Yes"
  → True: Message "Welcome to our service!"
  → False: Message "Sorry, you must be 18+"
```

### API Integration Flow

```
START
  ↓
Question: "Enter your email"
  Variable: email
  ↓
REST API: GET https://api.example.com/users?email={{email}}
  Map: $.data.name → user_name
  ↓
Message: "Welcome back, {{user_name}}!"
```

## Tips for Success

### Chatbot Design
- Keep conversation paths under 10 nodes for simplicity
- Always provide a way to restart or go back
- Test every possible path thoroughly
- Use clear, conversational language

### WhatsApp Flow Design
- Limit to 3-5 screens maximum
- Group related fields on same screen
- Always include terminal success screen
- Pre-fill data when possible

### Variable Management
- Use descriptive variable names
- Document custom variables
- Validate user input
- Handle missing/invalid data

### API Integration
- Always handle errors
- Implement timeouts
- Validate responses
- Use secure authentication

## Related Resources

### Other Skills
- **reactflow-development** - For ReactFlow implementation
- **whatsapp-messaging-api-expert** - For message sending
- **whatsapp-flows-expert** - For Flow API details
- **nestjs-expert** - For backend services
- **project-architect** - For overall architecture

### External Documentation
- [WhatsApp Flows Official Docs](https://developers.facebook.com/docs/whatsapp/flows)
- [ReactFlow Documentation](https://reactflow.dev/)
- [JSONPath Syntax Guide](https://goessner.net/articles/JsonPath/)

### Project Documentation
- Backend architecture reference
- Frontend architecture reference
- Database design reference
- Real-time system reference

## Getting Help

When you need assistance, describe:
1. **What you're building** - Type of flow, business goal
2. **Where you're stuck** - Specific node, configuration, or concept
3. **What you've tried** - Previous attempts, error messages
4. **Expected vs actual** - What should happen vs what is happening

Example request:
> "I'm building a lead generation chatbot. I have a WhatsApp Flow that collects user details (name, email, phone). The Flow completes successfully, but I can't access the form data in the next chatbot Message node. How do I map the Flow response to chatbot variables?"

## Version Information

- **Skill Version**: 1.0.0
- **WhatsApp Flow Version**: 7.2
- **Compatible with**: WhatsApp Builder v1.x
- **Last Updated**: 2025-11-27

## Contributing

This skill is part of the WhatsApp Builder project. For improvements or corrections, update the reference documentation in the `reference/` directory.
