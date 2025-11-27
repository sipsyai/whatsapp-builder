# WhatsApp Flow Actions Reference

Complete reference guide for all action types available in WhatsApp Flows.

## Table of Contents
- [Overview](#overview)
- [Navigate Action](#navigate-action)
- [Data Exchange Action](#data-exchange-action)
- [Complete Action](#complete-action)
- [Action Context](#action-context)
- [Dynamic Data Binding](#dynamic-data-binding)
- [Best Practices](#best-practices)

---

## Overview

Actions define what happens when users interact with components in WhatsApp Flows. There are three main action types:

1. **navigate** - Transition to another screen
2. **data_exchange** - Call your endpoint for dynamic data
3. **complete** - Terminate the flow and return data

Actions are triggered by:
- `on-click-action` (Footer component)
- `on-select-action` (Dropdown, RadioButtonsGroup, CheckboxGroup)

---

## Navigate Action

Navigate action transitions the user to another screen within the flow.

### Basic Navigation

```json
{
  "name": "navigate",
  "next": {
    "type": "screen",
    "name": "NEXT_SCREEN"
  }
}
```

### Navigation with Payload

Pass data to the next screen using the payload object:

```json
{
  "name": "navigate",
  "next": {
    "type": "screen",
    "name": "CONFIRMATION"
  },
  "payload": {
    "user_name": "${form.name}",
    "user_email": "${form.email}",
    "selected_date": "${form.appointment_date}"
  }
}
```

**Properties:**
- `name` (required): `"navigate"`
- `next` (required): Object with `type: "screen"` and `name: "SCREEN_ID"`
- `payload` (optional): Object with key-value pairs to pass to next screen

### Example: Footer with Navigate

```json
{
  "type": "Footer",
  "label": "Continue",
  "on-click-action": {
    "name": "navigate",
    "next": {
      "type": "screen",
      "name": "DETAILS_SCREEN"
    },
    "payload": {
      "from_screen": "WELCOME",
      "timestamp": "${data.current_time}"
    }
  }
}
```

### Receiving Data on Target Screen

The target screen must define the data schema in its `data` property:

```json
{
  "id": "CONFIRMATION",
  "title": "Confirm Details",
  "data": {
    "user_name": {
      "type": "string",
      "__example__": "John Doe"
    },
    "user_email": {
      "type": "string",
      "__example__": "john@example.com"
    }
  },
  "layout": {
    "type": "SingleColumnLayout",
    "children": [
      {
        "type": "TextBody",
        "text": "Welcome ${data.user_name}"
      }
    ]
  }
}
```

---

## Data Exchange Action

Data exchange action calls your custom endpoint to fetch or process data. This enables dynamic dropdowns, validation, and server-side processing.

### Basic Data Exchange

```json
{
  "name": "data_exchange",
  "payload": {
    "user_input": "${form.category}"
  }
}
```

### Request Format

When data_exchange is triggered, WhatsApp sends a POST request to your endpoint URI:

```json
{
  "action": "data_exchange",
  "screen": "SCREEN_ID",
  "version": "7.2",
  "data": {
    "user_input": "selected_value"
  },
  "flow_token": "UNIQUE_TOKEN"
}
```

**Request Properties:**
- `action`: Always `"data_exchange"`
- `screen`: Current screen ID
- `version`: Flow JSON version
- `data`: Payload object you defined in the action
- `flow_token`: Unique identifier for the flow session

### Response Format

Your endpoint must respond with this structure:

```json
{
  "version": "7.2",
  "screen": "SCREEN_ID",
  "data": {
    "key1": "value1",
    "key2": ["array", "of", "values"]
  }
}
```

**Response Properties:**
- `version` (required): Must match request version
- `screen` (required): Screen ID to display (can be current or different screen)
- `data` (required): Object with data to pass to the screen

### Example: Dynamic Dropdown

**Dropdown with on-select-action:**
```json
{
  "type": "Dropdown",
  "name": "category",
  "label": "Select Category",
  "data-source": "${data.categories}",
  "on-select-action": {
    "name": "data_exchange",
    "payload": {
      "selected_category": "${form.category}"
    }
  }
}
```

**Endpoint Request:**
```json
{
  "action": "data_exchange",
  "screen": "PRODUCT_SCREEN",
  "version": "7.2",
  "data": {
    "selected_category": "electronics"
  },
  "flow_token": "abc123"
}
```

**Endpoint Response:**
```json
{
  "version": "7.2",
  "screen": "PRODUCT_SCREEN",
  "data": {
    "categories": [
      {"id": "electronics", "title": "Electronics"},
      {"id": "clothing", "title": "Clothing"}
    ],
    "products": [
      {"id": "prod1", "title": "Laptop", "price": "$999"},
      {"id": "prod2", "title": "Phone", "price": "$699"}
    ]
  }
}
```

### Example: Form Validation

**Footer with data_exchange for server validation:**
```json
{
  "type": "Footer",
  "label": "Validate",
  "on-click-action": {
    "name": "data_exchange",
    "payload": {
      "email": "${form.email}",
      "phone": "${form.phone}"
    }
  }
}
```

**Validation Response (Success):**
```json
{
  "version": "7.2",
  "screen": "CONFIRMATION_SCREEN",
  "data": {
    "validation_status": "success",
    "user_id": "12345"
  }
}
```

**Validation Response (Error):**
```json
{
  "version": "7.2",
  "screen": "FORM_SCREEN",
  "data": {
    "error_message": "Email already exists",
    "show_error": true
  }
}
```

---

## Complete Action

Complete action terminates the flow and returns data to your chatbot.

### Basic Complete

```json
{
  "name": "complete",
  "payload": {
    "status": "success"
  }
}
```

### Complete with Flow Data

```json
{
  "name": "complete",
  "payload": {
    "booking_id": "${data.booking_id}",
    "user_name": "${form.name}",
    "appointment_date": "${form.date}",
    "appointment_time": "${form.time}",
    "status": "confirmed"
  }
}
```

**Properties:**
- `name` (required): `"complete"`
- `payload` (required): Object with data to return to chatbot

### Example: Terminal Screen with Complete

```json
{
  "id": "SUCCESS_SCREEN",
  "title": "Booking Confirmed",
  "terminal": true,
  "success": true,
  "data": {
    "booking_id": {
      "type": "string",
      "__example__": "BK123456"
    }
  },
  "layout": {
    "type": "SingleColumnLayout",
    "children": [
      {
        "type": "TextHeading",
        "text": "Booking Confirmed!"
      },
      {
        "type": "TextBody",
        "text": "Your booking ID is: ${data.booking_id}"
      },
      {
        "type": "Footer",
        "label": "Done",
        "on-click-action": {
          "name": "complete",
          "payload": {
            "booking_id": "${data.booking_id}",
            "timestamp": "${data.timestamp}"
          }
        }
      }
    ]
  }
}
```

### Receiving Complete Data in ChatBot

When the flow completes, your webhook receives the payload:

**Webhook Payload:**
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "type": "interactive",
          "interactive": {
            "type": "nfm_reply",
            "nfm_reply": {
              "response_json": "{\"booking_id\":\"BK123456\",\"timestamp\":\"2025-11-27T10:00:00Z\"}"
            }
          }
        }]
      }
    }]
  }]
}
```

In the chatbot builder, store this in a variable:
```json
{
  "type": "whatsapp_flow",
  "data": {
    "flowOutputVariable": "booking_data"
  }
}
```

Access in subsequent nodes:
```
Your booking ID is {{booking_data.booking_id}}
```

---

## Action Context

### on-click-action

Used in Footer components only. Triggered when user clicks the footer button.

```json
{
  "type": "Footer",
  "label": "Submit",
  "on-click-action": {
    "name": "navigate|data_exchange|complete"
  }
}
```

### on-select-action

Used in Dropdown, RadioButtonsGroup, CheckboxGroup. Triggered when user selects an option.

```json
{
  "type": "Dropdown",
  "name": "location",
  "label": "Select Location",
  "data-source": "${data.locations}",
  "on-select-action": {
    "name": "data_exchange",
    "payload": {
      "location_id": "${form.location}"
    }
  }
}
```

**Note**: on-select-action typically uses `data_exchange` to fetch dependent data dynamically.

---

## Dynamic Data Binding

Actions support dynamic data binding to reference form values and screen data.

### Form References

Reference user input from the current screen:

```json
{
  "payload": {
    "name": "${form.name}",
    "email": "${form.email}",
    "selected_option": "${form.dropdown_field}"
  }
}
```

### Data References

Reference data passed to the screen:

```json
{
  "payload": {
    "user_id": "${data.user_id}",
    "session_token": "${data.token}"
  }
}
```

### Mixed References

Combine both form and data references:

```json
{
  "payload": {
    "user_input": "${form.message}",
    "user_id": "${data.user_id}",
    "static_value": "confirmed"
  }
}
```

### Nested Data Access

Access nested properties (if your endpoint returns nested objects):

```json
{
  "payload": {
    "user_name": "${data.user.name}",
    "user_email": "${data.user.email}"
  }
}
```

---

## Best Practices

### 1. Navigate Action

- **Use for screen transitions**: Navigate to show different forms or confirmation screens
- **Pass minimal data**: Only pass data needed by the target screen
- **Define data schema**: Always define the `data` property on target screens

### 2. Data Exchange Action

- **Use for dynamic content**: Fetch dropdown options, validate inputs, process forms
- **Keep responses fast**: Endpoint should respond within 10 seconds
- **Handle errors gracefully**: Return to the same screen with error messages
- **Use flow_token**: Track sessions on your server using flow_token
- **Validate on server**: Don't trust client-side validation alone

**Example Error Handling:**
```json
{
  "version": "7.2",
  "screen": "CURRENT_SCREEN",
  "data": {
    "error_message": "Invalid coupon code",
    "show_error": true,
    "error_field": "coupon"
  }
}
```

### 3. Complete Action

- **Use on terminal screens**: Mark screen with `"terminal": true` and `"success": true`
- **Return meaningful data**: Include IDs, timestamps, status for chatbot to use
- **One complete per flow**: Only one screen should have complete action

### 4. General Best Practices

- **Screen transitions**: navigate → navigate → data_exchange → complete
- **Minimize data_exchange calls**: Batch operations to reduce latency
- **Use static data when possible**: Hard-code options that don't change
- **Test with examples**: Use `__example__` in data schema for testing
- **Version consistency**: Always match version between request and response

### 5. Common Patterns

**Pattern 1: Multi-step form**
```
Screen 1 (Basic Info) → navigate → Screen 2 (Details) → navigate → Screen 3 (Review) → complete
```

**Pattern 2: Dynamic form with server validation**
```
Screen 1 (Form) → data_exchange (validate) → Screen 2 (Confirmation) → complete
```

**Pattern 3: Dependent dropdowns**
```
Screen 1:
  Dropdown 1 (Category) → on-select-action → data_exchange → updates Dropdown 2 (Sub-category)
```

---

## Error Handling

### Data Exchange Errors

If your endpoint fails or returns an error, WhatsApp will show a generic error. To provide better UX:

**Always return 200 OK with error data:**
```json
{
  "version": "7.2",
  "screen": "FORM_SCREEN",
  "data": {
    "error": true,
    "error_message": "Server temporarily unavailable. Please try again.",
    "retry_available": true
  }
}
```

Display error in the screen:
```json
{
  "type": "TextBody",
  "text": "${data.error_message}",
  "visible": "${data.error}"
}
```

### Timeout Handling

Data exchange has a 10-second timeout. If your endpoint is slow:
1. Optimize endpoint performance
2. Show loading states
3. Consider async processing with polling

---

**Last Updated**: 2025-11-27
**Document Version**: 1.0
**Related**:
- [05-whatsapp-flow-components.md](./05-whatsapp-flow-components.md) for component definitions
- [08-examples.md](./08-examples.md) for complete flow examples
