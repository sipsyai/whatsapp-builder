---
name: chatbot-flow-development
description: Comprehensive skill for building chatbots and WhatsApp Flows in WhatsApp Builder. Covers node types, flow design, REST API integration, and WhatsApp Flow JSON structure.
version: 1.0.0
scope: project
tags:
  - chatbot
  - whatsapp
  - flow
  - reactflow
degree_of_freedom: high
---

# Chatbot Flow Development

Expert guidance for building conversational chatbots and interactive WhatsApp Flows in the WhatsApp Builder platform. This skill provides deep knowledge of node-based conversation design, WhatsApp Flow JSON structure, REST API integration, and dynamic variable management.

## Quick Start

WhatsApp Builder enables you to create two types of interactive experiences:

1. **Chatbot Flows** - Node-based conversation trees using ReactFlow
   - Text messages, questions, conditional branches
   - REST API calls for external data
   - Variable-driven dynamic content

2. **WhatsApp Flows** - Native WhatsApp interactive forms (v7.2)
   - Multi-screen forms with input components
   - Data validation and collection
   - Integration with chatbot flows

Both systems work together seamlessly: chatbots can trigger WhatsApp Flows, and Flow responses can feed back into chatbot variables.

## Core Capabilities

### 1. Chatbot Design - Node-Based Conversation Flows

Build conversation flows using 7 specialized node types:

**Start Node** - Entry point for every flow
- Single node per chatbot
- No configuration needed
- Connects to first interaction

**Message Node** - Send text messages
- Supports variable interpolation: `Hello {{name}}!`
- Markdown formatting (bold, italic)
- Can include multiple messages in sequence

**Question Node** - Collect user input
- Interactive buttons (up to 10)
- List selections (up to 10 sections × 10 items)
- Free text responses
- Store answers in variables

**Condition Node** - Branch based on logic
- Compare variables: `{{age}} > 18`
- String matching: `{{city}} == "Istanbul"`
- Multiple conditions with true/false paths
- JavaScript-like expressions

**REST API Node** - External integrations
- GET, POST, PUT, DELETE, PATCH methods
- Headers and authentication
- Request body with variable injection
- Response mapping to variables

**WhatsApp Flow Node** - Trigger native flows
- Link to WhatsApp Flow JSON
- Pass variables as initial data
- Receive form responses
- Continue chatbot after completion

**Google Calendar Node** - Calendar integration
- Connect to Google Calendar via OAuth
- Fetch events (today, tomorrow, date range)
- Check availability and get free slots
- Support multiple calendar users (owner, static, variable)
- Store results in chatbot variables
- Working hours and slot duration configuration
- Success/error routing for error handling

### 2. WhatsApp Flows - Interactive Form Flows

Create native WhatsApp forms using Flow JSON (v7.2):

**Screen-Based Architecture**
- Multiple screens per flow
- Screen-to-screen navigation
- Data persistence across screens
- Terminal screens for completion

**Component Library**
- TextInput: Single/multi-line text entry
- TextArea: Large text blocks
- Dropdown: Select from options
- RadioButtonsGroup: Single choice
- CheckboxGroup: Multiple choices
- DatePicker: Date selection
- OptIn: Consent checkboxes
- Footer: Action buttons
- Image: Visual content
- TextHeading, TextSubheading, TextBody: Typography

**Data Management**
- Form variables for input storage
- Data validation rules
- Dynamic content with `${variable}` syntax
- Initial data from chatbot context

**Actions and Navigation**
- navigate: Move between screens
- update_data: Modify form state
- complete: Finish flow (terminal)
- open_url: External links

### 3. REST API Integration

Connect to external services and databases:

**Request Configuration**
- URL with variable interpolation
- HTTP method selection
- Custom headers (Authorization, Content-Type)
- Request body (JSON with variables)

**Response Handling**
- JSONPath extraction: `$.data.items[0].name`
- Map response fields to chatbot variables
- Error handling with fallback paths
- Array iteration support

**Use Cases**
- User authentication
- Database lookups
- CRM integration
- Payment processing
- Appointment booking
- Product catalogs

### Google Calendar Integration

Connect to Google Calendar for appointment and scheduling:

**Calendar Actions**
- `get_today_events`: Fetch today's calendar events
- `get_tomorrow_events`: Fetch tomorrow's calendar events
- `get_events`: Fetch events for a specific date or date range
- `check_availability`: Calculate available time slots

**Calendar User Sources**
- `owner`: Use chatbot owner's connected Google Calendar
- `static`: Select a specific user with Google Calendar connected
- `variable`: Get user ID from a chatbot variable (e.g., selected_stylist_id)

**Availability Configuration**
- Working hours start/end (e.g., 09:00 - 18:00)
- Slot duration (15, 30, 45, 60, 90, 120 minutes)
- Output format: full response or slots_only (for lists)

**Use Cases**
- Appointment booking with real-time availability
- Staff/stylist calendar management
- Meeting room scheduling
- Service provider availability checks
- Multi-person scheduling

### 4. Variable Management - AUTOMATIC NAMING SYSTEM

Variables are now AUTO-GENERATED - no manual naming required:

**Automatic Variable Format**
- Format: `{nodeType}_{index}.{output}`
- Index based on topological sort (flow order)
- Each node type has its own counter

**Auto-Generated Variable Names**
| Node Type | Variable | Available Outputs |
|-----------|----------|-------------------|
| Question | `question_1` | `.response` |
| REST API | `rest_api_1` | `.data`, `.error`, `.status` |
| WhatsApp Flow | `flow_1` | `.response` |
| Google Calendar | `calendar_1` | `.result` |

**Examples**
- First Question: `{{question_1.response}}`
- Second Question: `{{question_2.response}}`
- First API call: `{{rest_api_1.data}}`, `{{rest_api_1.error}}`, `{{rest_api_1.status}}`
- First Calendar: `{{calendar_1.result}}`
- First Flow: `{{flow_1.response}}`

**Built-in System Variables**
- `{{customer_phone}}`: Customer's phone number

**Variable Scoping**
- Stored in conversation context (`nodeOutputs` JSONB)
- Persist across conversation
- Accessible in all nodes
- Can be updated/overwritten

**Interpolation Syntax**
- Messages: `Hello! You entered: {{question_1.response}}`
- Conditions: `{{question_1.response}} >= 18`
- API URLs: `https://api.example.com/users/{{question_1.response}}`
- API Bodies: `{"email": "{{question_1.response}}", "data": "{{rest_api_1.data}}"}`

**UI Components**
- **OutputVariableBadge**: Shows auto-generated variable name in config modals
- **VariablePicker**: Dropdown to select variables from other nodes
- **VariableInput**: Text input with variable picker button

## When to Use This Skill

Invoke this skill when you need to:

**Building Chatbots**
- Design conversation flows
- Add interactive questions
- Implement branching logic
- Integrate external APIs
- Create dynamic content

**Creating WhatsApp Flows**
- Design multi-step forms
- Configure input components
- Set up validation rules
- Handle screen navigation
- Map data to chatbot

**Integrating Systems**
- Connect to REST APIs
- Process API responses
- Handle authentication
- Map external data

**Designing UX**
- Optimize conversation paths
- Reduce user friction
- Handle error cases
- Improve engagement

**Troubleshooting**
- Debug flow execution
- Fix variable issues
- Resolve API errors
- Validate Flow JSON

## Reference Documentation

For detailed technical information, see:

### Chatbot System
- **[reference/01-chatbot-node-types.md](reference/01-chatbot-node-types.md)** - Complete node type reference with configuration options, examples, and best practices
- **[reference/02-chatbot-edge-routing.md](reference/02-chatbot-edge-routing.md)** - Edge types, routing rules, connection validation, and flow control
- **[reference/03-chatbot-variables.md](reference/03-chatbot-variables.md)** - Variable system, scoping, interpolation syntax, and data types

### WhatsApp Flow System
- **[reference/04-whatsapp-flow-screens.md](reference/04-whatsapp-flow-screens.md)** - Screen structure, types (regular/terminal), navigation, and layout
- **[reference/05-whatsapp-flow-components.md](reference/05-whatsapp-flow-components.md)** - All component types, properties, validation, and examples
- **[reference/06-whatsapp-flow-actions.md](reference/06-whatsapp-flow-actions.md)** - Actions (navigate, update_data, complete), triggers, and patterns

### Integration
- **[reference/07-rest-api-integration.md](reference/07-rest-api-integration.md)** - API configuration, authentication, response mapping, error handling
- **[reference/08-examples.md](reference/08-examples.md)** - Complete working examples: appointment booking, lead generation, support ticket, e-commerce
- **[reference/09-google-calendar-integration.md](reference/09-google-calendar-integration.md)** - Google Calendar node configuration, OAuth setup, availability checking

## Best Practices

### Chatbot Design

**1. Start Simple**
- Begin with linear flow
- Add branches incrementally
- Test each path thoroughly

**2. Clear Communication**
- Use conversational language
- Keep messages concise
- Provide clear options

**3. Error Handling**
- Always have fallback paths
- Handle API failures gracefully
- Provide retry options

**4. Variable Naming**
- Use descriptive names: `customer_email` not `e`
- Follow snake_case convention
- Document custom variables

**5. Testing**
- Test all conversation paths
- Verify variable values
- Test API integrations
- Check edge cases

### WhatsApp Flow Design

**1. Screen Organization**
- One task per screen
- Logical progression
- Clear navigation

**2. Form Validation**
- Validate on input
- Clear error messages
- Required field indicators

**3. User Experience**
- Minimize screens
- Pre-fill known data
- Show progress indicators

**4. Data Mapping**
- Map all form fields
- Validate data types
- Handle missing data

**5. Terminal Screens**
- Always have success screen
- Provide error screens
- Clear next steps

### API Integration

**1. Authentication**
- Use environment variables for secrets
- Implement token refresh
- Handle auth failures

**2. Error Handling**
- Check response status
- Parse error messages
- Provide user feedback

**3. Data Validation**
- Validate API responses
- Handle missing fields
- Type checking

**4. Performance**
- Cache responses when appropriate
- Implement timeouts
- Handle rate limits

**5. Security**
- Never expose secrets in URLs
- Use HTTPS only
- Validate all inputs

## Common Patterns

### Pattern 1: Lead Qualification Flow

```
START
  ↓
Message: "Welcome! Let's find the right product for you."
  ↓
Question: "What's your budget range?"
  → Buttons: "Under $100", "$100-500", "Over $500"
  ↓
Condition: Check budget
  → If "Over $500": Show premium products
  → If "$100-500": Show mid-range products
  → If "Under $100": Show budget products
  ↓
WhatsApp Flow: Product Selection Form
  ↓
REST API: Submit lead to CRM
  ↓
Message: "Thank you! We'll contact you soon."
```

### Pattern 2: Appointment Booking (with Google Calendar)

```
START
  ↓
Question: "What service do you need?"
  → List: Services from API
  ↓
Question: "Which date would you like?"
  → Text input (YYYY-MM-DD format)
  ↓
Google Calendar: Check Availability
  → calendarUserSource: owner
  → calendarDateVariable: selected_date
  → calendarOutputFormat: slots_only
  → calendarOutputVariable: available_slots
  ↓ success
Question: "Select your preferred time:"
  → Dynamic List from available_slots
  ↓
Question: "Confirm booking?"
  → Buttons: "Confirm", "Cancel"
  ↓
Condition: Check confirmation
  → If "Confirm": Create booking
  → If "Cancel": Restart flow
  ↓
REST API: POST /bookings
  ↓
Message: "Booked! Confirmation: {{booking_id}}"
```

### Pattern 2b: Multi-Stylist Appointment (Dynamic Calendar User)

```
START
  ↓
REST API: GET /api/users?hasGoogleCalendar=true
  → Store in stylists variable
  ↓
Question: "Select a stylist:"
  → Dynamic List from stylists
  → Store in selected_stylist_id
  ↓
Question: "Which date?"
  → Text input
  ↓
Google Calendar: Check Availability
  → calendarUserSource: variable
  → calendarUserVariable: selected_stylist_id
  → calendarDateVariable: appointment_date
  → calendarOutputFormat: slots_only
  ↓ success
Question: "Available slots for your stylist:"
  → Dynamic List from stylist_slots
  ↓ error
Message: "Sorry, this stylist hasn't connected their calendar yet."
```

### Pattern 3: Support Ticket

```
START
  ↓
Message: "I'll help you create a support ticket."
  ↓
WhatsApp Flow: Ticket Details Form
  → Fields: Category, Priority, Description
  ↓
REST API: POST /tickets
  ↓
Condition: Check API success
  → If success: Show confirmation
  → If error: Show error message
  ↓
Message: "Ticket created: {{ticket_id}}"
```

## Implementation Guidelines

### Building a New Chatbot

1. **Plan the Flow**
   - Map user journey
   - Identify decision points
   - List required data

2. **Create Nodes**
   - Start with Start node
   - Add Message nodes for communication
   - Add Question nodes for input
   - Add Condition nodes for branching

3. **Connect Edges**
   - Link nodes logically
   - Ensure all paths lead somewhere
   - No orphaned nodes

4. **Add Variables**
   - Capture user inputs
   - Store API responses
   - Use in dynamic content

5. **Test Thoroughly**
   - Test happy path
   - Test error cases
   - Verify variables

### Creating a WhatsApp Flow

1. **Design Screens**
   - Sketch form structure
   - Define data fields
   - Plan navigation

2. **Build JSON**
   - Create screen objects
   - Add components
   - Configure actions

3. **Validate Structure**
   - Check JSON syntax
   - Verify data bindings
   - Test navigation

4. **Integrate with Chatbot**
   - Add WhatsApp Flow node
   - Map initial data
   - Handle response data

5. **Test End-to-End**
   - Test all screens
   - Verify data flow
   - Check completion

## Troubleshooting Guide

### Chatbot Issues

**Flow not executing**
- Check Start node exists
- Verify edge connections
- Check node configuration

**Variables not working**
- Verify variable name spelling
- Check variable scope
- Ensure proper interpolation syntax

**Conditions not branching**
- Check condition syntax
- Verify variable values
- Test both paths

### WhatsApp Flow Issues

**Flow not loading**
- Validate JSON structure
- Check screen IDs
- Verify version (7.2)

**Components not showing**
- Check required properties
- Verify data bindings
- Check component types

**Navigation not working**
- Verify screen IDs match
- Check action configuration
- Ensure Footer has actions

### API Issues

**API calls failing**
- Check URL and method
- Verify authentication
- Check request format

**Response not mapping**
- Verify JSONPath syntax
- Check response structure
- Test with sample data

### Google Calendar Issues

**Calendar node returns error**
- Verify chatbot has an owner (userId)
- Check user has connected Google Calendar via OAuth
- Token may have expired - user needs to reconnect

**"NO_USER" error**
- calendarUserSource is 'owner' but chatbot has no owner
- calendarUserSource is 'variable' but variable is empty
- Solution: Set chatbot owner or use 'static' with explicit user ID

**Calendar slots not appearing in list**
- Use `calendarOutputFormat: 'slots_only'` for list-compatible format
- All slots might be busy - check calendar for that date
- Verify working hours configuration

**Wrong user's calendar being read**
- Check calendarUserSource setting
- If using 'variable', verify the variable contains correct user ID
- Debug variable value before calendar node execution

**How to get users with Google Calendar connected**
- Use API: `GET /api/users?hasGoogleCalendar=true`
- This returns only users who have completed Google OAuth flow

## Related Skills

For specialized assistance, use:

- **[reactflow-development](../reactflow-development/SKILL.md)** - ReactFlow-specific implementation, custom nodes, hook usage
- **[whatsapp-messaging-api-expert](../whatsapp-messaging-api-expert/SKILL.md)** - WhatsApp API message sending, templates, media
- **[whatsapp-flows-expert](../whatsapp-flows-expert/SKILL.md)** - WhatsApp Flow JSON structure, encryption, endpoints
- **[nestjs-expert](../nestjs-expert/SKILL.md)** - Backend service implementation
- **[react-expert](../react-expert/SKILL.md)** - Frontend component development

## Additional Resources

### External Documentation
- WhatsApp Flows API: https://developers.facebook.com/docs/whatsapp/flows
- ReactFlow Docs: https://reactflow.dev/
- JSONPath Syntax: https://goessner.net/articles/JsonPath/

### Project Documentation
- Backend Architecture: `/home/ali/whatsapp-builder/.claude/skills/project-architect/reference/02-backend-architecture.md`
- Frontend Architecture: `/home/ali/whatsapp-builder/.claude/skills/project-architect/reference/03-frontend-architecture.md`
- WhatsApp Integration: `/home/ali/whatsapp-builder/.claude/skills/project-architect/reference/06-whatsapp-integration.md`

## Getting Help

When asking for help, provide:
- What you're trying to build
- Current flow structure (if applicable)
- Error messages or unexpected behavior
- Relevant code/JSON snippets

Example: "I'm building an appointment booking flow. The REST API call to get available slots works, but I can't pass the selected date from the WhatsApp Flow back to the chatbot. Here's my Flow JSON..."

This skill will help you understand the system, suggest best practices, and guide you through implementation.
