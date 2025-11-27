---
name: whatsapp-flow-builder-expert
description: Expert in designing and building WhatsApp Flow JSON structures (v7.2), implementing dynamic data exchange endpoints, screen navigation, form components, data binding, routing models, and best practices for interactive WhatsApp Flows. Use when creating Flow JSON, designing multi-screen flows, implementing data_exchange actions, working with dynamic dropdowns, or seeking Flow architecture guidance.
version: 1.0.0
scope: project
---

# WhatsApp Flow Builder Expert

I am your expert assistant for designing and building WhatsApp Flow JSON structures. I have comprehensive knowledge of Flow JSON v7.2 specification, screen architecture, component types, dynamic data binding, endpoint integration, and best practices for creating interactive multi-screen flows.

## Quick Start

**Common tasks I can help with:**

1. **Design Flow JSON** - Create complete multi-screen Flow structures from scratch
2. **Implement dynamic flows** - Set up endpoint integration with data_exchange actions
3. **Build components** - Choose and configure the right UI components for your use case
4. **Setup routing** - Design screen navigation and routing models
5. **Data binding** - Implement cross-screen data references and dynamic properties
6. **Review flows** - Analyze existing Flow JSON for errors and optimization opportunities

**Example requests:**
- "Create a Flow JSON for product selection with dynamic categories"
- "How do I pass data from one screen to another?"
- "Add a date picker with conditional time slots"
- "Review this Flow JSON structure"
- "Implement a survey flow with radio buttons and dropdowns"

## Core Capabilities

### 1. Flow JSON Structure Design

I help you design complete Flow JSON structures following WhatsApp v7.2 specification:

**Root Structure:**
```json
{
  "version": "7.2",
  "data_api_version": "3.0",
  "routing_model": { ... },
  "screens": [ ... ]
}
```

**Key concepts:**
- `version`: Flow JSON version (current: 7.2)
- `data_api_version`: Required for endpoint flows (current: 3.0)
- `routing_model`: Screen navigation mapping (required when using endpoints)
- `screens`: Array of screen definitions

**When to use each:**
- Static flows: Only need `version` and `screens`
- Dynamic flows: Add `data_api_version` and `routing_model`

### 2. Screen Architecture

I design multi-screen flows with proper structure:

**Screen Properties:**
```json
{
  "id": "MAIN_MENU",
  "title": "Welcome Screen",
  "terminal": false,
  "success": true,
  "data": { ... },
  "layout": { ... }
}
```

**Screen types:**
- **Regular screens**: `terminal: false` - Normal flow screens
- **Terminal screens**: `terminal: true` - Final screens (success/error)
- **Success screens**: `terminal: true, success: true` - Successful completion
- **Error screens**: `terminal: true, success: false` - Failed completion

**Best practices:**
- Screen IDs: SCREAMING_SNAKE_CASE (e.g., `CUSTOMER_INFO`, `DATETIME_SCREEN`)
- Titles: Max 80 characters, sentence case
- One primary task per screen
- Clear progress indication

### 3. Routing Model Design

I create routing models that define screen navigation:

**Basic routing:**
```json
{
  "routing_model": {
    "WELCOME": ["CONTACT_INFO"],
    "CONTACT_INFO": ["PREFERENCES"],
    "PREFERENCES": ["SUCCESS"],
    "SUCCESS": []
  }
}
```

**Important rules:**
- Only forward routes (no backward navigation in routing_model)
- Terminal screens have empty array: `"SUCCESS": []`
- Reserved screen name: `SUCCESS` (cannot be used for custom screens)
- routing_model is required when `data_api_version` is specified
- Webhook responses can navigate to any screen, regardless of routing_model

**Common patterns:**
- Linear flow: A → B → C → SUCCESS
- Branching flow: A → [B1, B2, B3] (handled by webhook logic)
- Multi-step forms: Progressive disclosure pattern

### 4. Data Schema Definition

I define data schemas for dynamic screen content:

**Schema structure:**
```json
{
  "data": {
    "available_dates": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "title": { "type": "string" },
          "enabled": { "type": "boolean" }
        }
      },
      "__example__": [
        {"id": "2025-01-24", "title": "24 Jan 2025", "enabled": true}
      ]
    }
  }
}
```

**Schema types:**
- `string`: Text values
- `number`: Numeric values
- `boolean`: True/false flags
- `array`: Lists of items
- `object`: Complex structures

**Best practices:**
- Always include `__example__` for testing
- Match endpoint response structure exactly
- Use descriptive field names (snake_case)

### 5. Component Selection and Configuration

I help you choose and configure the right components:

#### Text Components

**TextHeading** - Primary heading
```json
{
  "type": "TextHeading",
  "text": "Welcome to Our Service"
}
```
- Max 80 characters
- Use for screen titles

**TextSubheading** - Secondary heading
```json
{
  "type": "TextSubheading",
  "text": "Please provide your details"
}
```
- Max 80 characters
- Use for section headers

**TextBody** - Regular text
```json
{
  "type": "TextBody",
  "text": "Complete the form to continue"
}
```
- Max 4096 characters
- Supports dynamic interpolation: `"Hello ${form.name}"`

**TextCaption** - Small helper text
```json
{
  "type": "TextCaption",
  "text": "We'll send you a confirmation message"
}
```
- Max 4096 characters
- Use for hints and disclaimers

#### Input Components

**TextInput** - Single-line text input
```json
{
  "type": "TextInput",
  "name": "customer_name",
  "label": "Full Name",
  "input-type": "text",
  "required": true,
  "helper-text": "Enter your full name"
}
```

**Input types:**
- `text`: General text
- `email`: Email with validation
- `phone`: Phone number with formatting
- `number`: Numeric input
- `password`: Hidden input

**TextArea** - Multi-line text input
```json
{
  "type": "TextArea",
  "name": "notes",
  "label": "Additional Notes",
  "required": false,
  "helper-text": "Optional comments",
  "max-length": 300
}
```

**Dropdown** - Single selection dropdown
```json
{
  "type": "Dropdown",
  "name": "service",
  "label": "Select Service",
  "required": true,
  "data-source": [
    {"id": "service1", "title": "Service 1", "enabled": true},
    {"id": "service2", "title": "Service 2", "enabled": false}
  ]
}
```

**Dynamic dropdown:**
```json
{
  "type": "Dropdown",
  "name": "category",
  "label": "Category",
  "data-source": "${data.categories}"
}
```

**RadioButtonsGroup** - Radio button selection
```json
{
  "type": "RadioButtonsGroup",
  "name": "choice",
  "label": "Choose One",
  "required": true,
  "data-source": [
    {
      "id": "option1",
      "title": "Option 1",
      "description": "Details about option 1"
    }
  ]
}
```

**CheckboxGroup** - Multiple selection
```json
{
  "type": "CheckboxGroup",
  "name": "preferences",
  "label": "Select Preferences",
  "data-source": [
    {"id": "pref1", "title": "Preference 1"},
    {"id": "pref2", "title": "Preference 2"}
  ]
}
```

**DatePicker** - Date selection
```json
{
  "type": "DatePicker",
  "name": "appointment_date",
  "label": "Select Date",
  "required": true,
  "min-date": "2025-01-01",
  "max-date": "2025-12-31"
}
```

#### Footer Component

**Every screen must have exactly one Footer:**
```json
{
  "type": "Footer",
  "label": "Continue",
  "on-click-action": {
    "name": "navigate",
    "next": {
      "type": "screen",
      "name": "NEXT_SCREEN"
    }
  }
}
```

### 6. Dynamic Data Binding

I implement data binding across screens and components:

#### Same-Screen Form Data
```json
{
  "payload": {
    "selected_service": "${form.service}"
  }
}
```

#### Cross-Screen Data References
```json
{
  "payload": {
    "service": "${screen.MAIN_MENU.form.service}",
    "date": "${screen.DATETIME_SCREEN.form.appointment_date}",
    "customer": "${screen.CONTACT_INFO.form.customer_name}"
  }
}
```

**Syntax:** `${screen.SCREEN_ID.form.FIELD_NAME}`

#### Screen Data (from Webhook)
```json
{
  "type": "Dropdown",
  "data-source": "${data.available_slots}"
}
```

#### Text Interpolation
```json
{
  "type": "TextBody",
  "text": "Hello ${form.customer_name}! Your appointment is on ${data.appointment_date}."
}
```

### 7. Actions Implementation

I implement the three main action types:

#### navigate Action
Navigate to another screen:
```json
{
  "type": "Footer",
  "label": "Continue",
  "on-click-action": {
    "name": "navigate",
    "next": {
      "type": "screen",
      "name": "NEXT_SCREEN"
    }
  }
}
```

#### data_exchange Action
Call webhook endpoint:
```json
{
  "type": "Dropdown",
  "name": "category",
  "on-select-action": {
    "name": "data_exchange",
    "payload": {
      "action": "get_products",
      "category": "${form.category}"
    }
  }
}
```

**Webhook Request Format:**
```json
{
  "action": "data_exchange",
  "flow_token": "UNIQUE_TOKEN",
  "screen": "CURRENT_SCREEN",
  "data": {
    "action": "get_products",
    "category": "electronics"
  }
}
```

**Webhook Response Format:**
```json
{
  "version": "3.0",
  "screen": "CURRENT_SCREEN",
  "data": {
    "products": [
      {"id": "prod1", "title": "Product 1"}
    ]
  }
}
```

#### complete Action
End the flow (terminal screens only):
```json
{
  "type": "Footer",
  "label": "Finish",
  "on-click-action": {
    "name": "complete",
    "payload": {}
  }
}
```

### 8. Endpoint Integration Patterns

I help implement endpoint integration in your backend:

**Action Types to Handle:**
- `ping`: Health check (return 200 OK)
- `INIT`: First screen initialization
- `data_exchange`: Screen transitions and data requests
- `BACK`: User navigation backward (optional)

**Example Implementation (NestJS):**
```typescript
async handleDataExchange(request: any): Promise<any> {
  const { screen, data, flow_token } = request;

  switch (screen) {
    case 'CATEGORY_SCREEN':
      const products = await this.fetchProducts(data.selected_category);
      return {
        version: '3.0',
        screen: 'PRODUCT_SCREEN',
        data: { products }
      };

    case 'PRODUCT_SCREEN':
      const productDetails = await this.getProductDetails(data.selected_product);
      return {
        version: '3.0',
        screen: 'DETAILS_SCREEN',
        data: productDetails
      };

    default:
      return {
        version: '3.0',
        screen: 'SUCCESS_SCREEN',
        data: {}
      };
  }
}
```

**Key requirements:**
- Response within 10 seconds
- HTTPS with valid TLS certificate
- Encryption/decryption (RSA-2048 + AES-128-GCM)
- X-Hub-Signature-256 verification

### 9. Project Integration

I understand how Flows integrate with this WhatsApp Builder project:

**Backend Files:**
- `/backend/src/modules/webhooks/services/flow-endpoint.service.ts` - Endpoint logic
- `/backend/src/modules/webhooks/flow-endpoint.controller.ts` - Request handling
- `/backend/src/modules/whatsapp/services/flow-encryption.service.ts` - Encryption
- `/backend/src/entities/whatsapp-flow.entity.ts` - Flow storage

**Flow Storage:**
- Flows stored in `whatsapp_flows` table
- JSON stored in `flow_json` JSONB column
- Linked to WhatsApp config via `whatsapp_config_id`

**ChatBot Integration:**
- WhatsAppFlow nodes in chatbot builder
- Context passed via flow_token (format: `{contextId}-{nodeId}`)
- Flow responses saved to conversation context variables

**Example Flow Node:**
```json
{
  "id": "node_123",
  "type": "whatsapp_flow",
  "data": {
    "flowId": "flow_uuid",
    "outputVariable": "appointment_data"
  }
}
```

## Flow Design Patterns

### Pattern 1: Simple Form Collection (No Endpoint)

**Use case:** Collect information without dynamic data

```json
{
  "version": "7.2",
  "screens": [
    {
      "id": "CONTACT_FORM",
      "title": "Contact Information",
      "terminal": false,
      "data": {},
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Please Provide Your Details"
          },
          {
            "type": "TextInput",
            "name": "name",
            "label": "Full Name",
            "input-type": "text",
            "required": true
          },
          {
            "type": "TextInput",
            "name": "email",
            "label": "Email",
            "input-type": "email",
            "required": true
          },
          {
            "type": "Footer",
            "label": "Submit",
            "on-click-action": {
              "name": "navigate",
              "next": {
                "type": "screen",
                "name": "SUCCESS"
              }
            }
          }
        ]
      }
    },
    {
      "id": "SUCCESS",
      "title": "Complete",
      "terminal": true,
      "success": true,
      "data": {},
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Thank You!"
          },
          {
            "type": "TextBody",
            "text": "We received your information, ${screen.CONTACT_FORM.form.name}."
          },
          {
            "type": "Footer",
            "label": "Close",
            "on-click-action": {
              "name": "complete",
              "payload": {}
            }
          }
        ]
      }
    }
  ]
}
```

### Pattern 2: Dynamic Appointment Booking

**Use case:** Select date/time with dynamic availability from endpoint

```json
{
  "version": "7.2",
  "data_api_version": "3.0",
  "routing_model": {
    "SERVICE_SELECTION": ["DATETIME_SELECTION"],
    "DATETIME_SELECTION": ["CONTACT_INFO"],
    "CONTACT_INFO": ["SUCCESS"],
    "SUCCESS": []
  },
  "screens": [
    {
      "id": "SERVICE_SELECTION",
      "title": "Select Service",
      "terminal": false,
      "data": {},
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Choose Your Service"
          },
          {
            "type": "RadioButtonsGroup",
            "name": "service",
            "label": "Service",
            "required": true,
            "data-source": [
              {
                "id": "haircut",
                "title": "Haircut",
                "description": "$50 - 30 minutes"
              },
              {
                "id": "coloring",
                "title": "Hair Coloring",
                "description": "$150 - 2 hours"
              }
            ]
          },
          {
            "type": "Footer",
            "label": "Next",
            "on-click-action": {
              "name": "data_exchange",
              "payload": {
                "action": "get_available_dates",
                "service": "${form.service}"
              }
            }
          }
        ]
      }
    },
    {
      "id": "DATETIME_SELECTION",
      "title": "Select Date & Time",
      "terminal": false,
      "data": {
        "available_dates": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {"type": "string"},
              "title": {"type": "string"},
              "enabled": {"type": "boolean"}
            }
          },
          "__example__": [
            {"id": "2025-01-24", "title": "24 Jan 2025", "enabled": true}
          ]
        },
        "available_slots": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {"type": "string"},
              "title": {"type": "string"}
            }
          },
          "__example__": [
            {"id": "09:00", "title": "09:00 AM"}
          ]
        }
      },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "When Would You Like to Come?"
          },
          {
            "type": "Dropdown",
            "name": "date",
            "label": "Select Date",
            "required": true,
            "data-source": "${data.available_dates}",
            "on-select-action": {
              "name": "data_exchange",
              "payload": {
                "action": "get_available_slots",
                "service": "${screen.SERVICE_SELECTION.form.service}",
                "date": "${form.date}"
              }
            }
          },
          {
            "type": "Dropdown",
            "name": "time",
            "label": "Select Time",
            "required": true,
            "data-source": "${data.available_slots}"
          },
          {
            "type": "Footer",
            "label": "Next",
            "on-click-action": {
              "name": "navigate",
              "next": {
                "type": "screen",
                "name": "CONTACT_INFO"
              }
            }
          }
        ]
      }
    },
    {
      "id": "CONTACT_INFO",
      "title": "Your Information",
      "terminal": false,
      "data": {},
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Contact Details"
          },
          {
            "type": "TextInput",
            "name": "name",
            "label": "Full Name",
            "input-type": "text",
            "required": true
          },
          {
            "type": "TextInput",
            "name": "phone",
            "label": "Phone Number",
            "input-type": "phone",
            "required": true
          },
          {
            "type": "Footer",
            "label": "Book Appointment",
            "on-click-action": {
              "name": "data_exchange",
              "payload": {
                "action": "create_appointment",
                "service": "${screen.SERVICE_SELECTION.form.service}",
                "date": "${screen.DATETIME_SELECTION.form.date}",
                "time": "${screen.DATETIME_SELECTION.form.time}",
                "name": "${form.name}",
                "phone": "${form.phone}"
              }
            }
          }
        ]
      }
    },
    {
      "id": "SUCCESS",
      "title": "Confirmed",
      "terminal": true,
      "success": true,
      "data": {
        "confirmation_message": {
          "type": "string",
          "__example__": "Your appointment is confirmed!"
        }
      },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Booking Confirmed"
          },
          {
            "type": "TextBody",
            "text": "${data.confirmation_message}"
          },
          {
            "type": "Footer",
            "label": "Done",
            "on-click-action": {
              "name": "complete",
              "payload": {}
            }
          }
        ]
      }
    }
  ]
}
```

### Pattern 3: Survey Flow

**Use case:** Multi-question survey with different component types

```json
{
  "version": "7.2",
  "screens": [
    {
      "id": "SURVEY",
      "title": "Customer Survey",
      "terminal": false,
      "data": {},
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Help Us Improve"
          },
          {
            "type": "RadioButtonsGroup",
            "name": "satisfaction",
            "label": "How satisfied are you?",
            "required": true,
            "data-source": [
              {"id": "very_satisfied", "title": "Very Satisfied"},
              {"id": "satisfied", "title": "Satisfied"},
              {"id": "neutral", "title": "Neutral"},
              {"id": "dissatisfied", "title": "Dissatisfied"}
            ]
          },
          {
            "type": "CheckboxGroup",
            "name": "features",
            "label": "Which features do you use?",
            "data-source": [
              {"id": "feature1", "title": "Online Booking"},
              {"id": "feature2", "title": "Notifications"},
              {"id": "feature3", "title": "Payment"}
            ]
          },
          {
            "type": "TextArea",
            "name": "feedback",
            "label": "Additional Comments",
            "required": false,
            "max-length": 500
          },
          {
            "type": "Footer",
            "label": "Submit",
            "on-click-action": {
              "name": "navigate",
              "next": {
                "type": "screen",
                "name": "THANK_YOU"
              }
            }
          }
        ]
      }
    },
    {
      "id": "THANK_YOU",
      "title": "Thank You",
      "terminal": true,
      "success": true,
      "data": {},
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Thank You for Your Feedback!"
          },
          {
            "type": "Footer",
            "label": "Close",
            "on-click-action": {
              "name": "complete",
              "payload": {}
            }
          }
        ]
      }
    }
  ]
}
```

## Best Practices

### Naming Conventions

**Screen IDs**: SCREAMING_SNAKE_CASE
```
✅ MAIN_MENU, DATETIME_SCREEN, CONTACT_INFO
❌ mainMenu, datetime-screen, ContactInfo
```

**Field Names**: snake_case
```
✅ customer_name, appointment_date, phone_number
❌ customerName, appointmentDate, phoneNumber
```

**Action Names**: snake_case
```
✅ get_available_slots, create_appointment
❌ getAvailableSlots, createAppointment
```

### Screen Design

1. **One task per screen** - Don't overwhelm users
2. **Clear headings** - Use TextHeading for screen purpose
3. **Helper text** - Guide users with helper-text on inputs
4. **Progress indication** - Use clear titles showing progress
5. **Limit components** - 5-7 components per screen maximum

### Data Validation

1. **Required fields** - Mark critical fields as required
2. **Input types** - Use specific input-type for automatic validation
3. **Max lengths** - Set reasonable max-length for TextArea
4. **Date ranges** - Use min-date and max-date for DatePicker

### Performance

1. **Minimize endpoint calls** - Only call when needed for dynamic data
2. **Cache data** - Store static data in Flow JSON data-source
3. **Fast responses** - Target <10 seconds for endpoint responses
4. **Optimize payload** - Send only necessary data in payloads

### User Experience

1. **Clear CTAs** - Use descriptive Footer labels
2. **Confirmation screens** - Show summary before completion
3. **Error handling** - Gracefully handle endpoint failures
4. **Success feedback** - Clear success messages on completion

## Common Patterns

### Conditional Component Display
```json
{
  "type": "TextBody",
  "text": "${data.error_message}",
  "visible": "`${data.error_message} != ''`"
}
```

### Cascading Dropdowns
```json
{
  "type": "Dropdown",
  "name": "category",
  "on-select-action": {
    "name": "data_exchange",
    "payload": {
      "action": "get_subcategories",
      "category": "${form.category}"
    }
  }
},
{
  "type": "Dropdown",
  "name": "subcategory",
  "data-source": "${data.subcategories}"
}
```

### Summary Screen
```json
{
  "type": "TextBody",
  "text": "Service: ${screen.SERVICE.form.service}\nDate: ${screen.DATETIME.form.date}\nName: ${form.name}"
}
```

## Validation and Testing

### JSON Syntax Validation
```bash
# Validate JSON syntax
node -e "JSON.parse(require('fs').readFileSync('flow.json'))"
```

### WhatsApp Flow Builder
1. Upload JSON to WhatsApp Business Manager
2. Use Preview feature to test
3. Fix validation errors shown by WhatsApp
4. Test all screen transitions

### Common Validation Errors

**INVALID_ROUTING_MODEL**
- Missing screen in routing_model
- Terminal screen not having empty array
- Solution: Ensure all screens referenced in routing_model

**INVALID_PROPERTY**
- Wrong property type (e.g., string instead of boolean)
- Missing required property
- Solution: Check component reference documentation

**MISSING_FOOTER**
- Screen without Footer component
- Solution: Add Footer to every screen

## Project File References

**Flow JSON Examples:**
- `/backend/src/modules/chatbots/salon-dynamic-flow.json` - Complete dynamic flow example
- `/docs/whatsapp-flow-dynamic-calendar/examples/simple-flow-example.json` - Simple static flow

**Backend Implementation:**
- `/backend/src/modules/webhooks/services/flow-endpoint.service.ts` - Endpoint handler logic
- `/backend/src/modules/webhooks/flow-endpoint.controller.ts` - HTTP endpoint controller
- `/backend/src/modules/whatsapp/services/flow-encryption.service.ts` - Encryption utilities

**Documentation:**
- `/docs/whatsapp-flow-dynamic-calendar/FLOW-STRUCTURE.md` - Detailed Flow JSON structure
- `/docs/whatsapp-flow-dynamic-calendar/WEBHOOK-GUIDE.md` - Webhook implementation guide
- `/docs/whatsapp-flow-dynamic-calendar/TROUBLESHOOTING.md` - Common issues and solutions

## Getting Started

Tell me what you need:
- "Create a Flow for [use case]"
- "Add [component type] to screen"
- "Implement data_exchange for [action]"
- "Review this Flow JSON: [paste JSON]"
- "How do I [specific task]?"

I will:
1. Analyze your requirements
2. Design appropriate screen structure
3. Generate complete Flow JSON
4. Explain each component and action
5. Provide testing guidance
6. Reference relevant project files when needed

For complex flows with endpoint integration, I may suggest consulting the `whatsapp-flows-expert` agent for encryption and webhook implementation details.
