# WhatsApp Flows Quick Reference

Quick reference for common Flow JSON patterns, endpoint implementations, and troubleshooting.

## Flow JSON Patterns

### Basic Flow Structure

```json
{
  "version": "7.2",
  "screens": [
    {
      "id": "SCREEN_NAME",
      "title": "Screen Title",
      "terminal": false,
      "data": {},
      "layout": {
        "type": "SingleColumnLayout",
        "children": []
      }
    }
  ]
}
```

### Flow with Endpoint

```json
{
  "version": "7.2",
  "data_api_version": "4.0",
  "routing_model": {
    "FIRST_SCREEN": ["SECOND_SCREEN"],
    "SECOND_SCREEN": []
  },
  "screens": [...]
}
```

### Screen with Form Components

```json
{
  "id": "FORM_SCREEN",
  "title": "Enter Details",
  "layout": {
    "type": "SingleColumnLayout",
    "children": [
      {
        "type": "TextInput",
        "name": "user_name",
        "label": "Your Name",
        "required": true,
        "input-type": "text"
      },
      {
        "type": "DatePicker",
        "name": "appointment_date",
        "label": "Select Date",
        "required": true
      },
      {
        "type": "Footer",
        "label": "Continue",
        "on-click-action": {
          "name": "navigate",
          "next": {"type": "screen", "name": "CONFIRMATION"},
          "payload": {
            "name": "${form.user_name}",
            "date": "${form.appointment_date}"
          }
        }
      }
    ]
  }
}
```

### Terminal Screen

```json
{
  "id": "SUCCESS_SCREEN",
  "title": "Confirmed",
  "terminal": true,
  "success": true,
  "data": {
    "confirmation_message": {
      "type": "string",
      "__example__": "Your booking is confirmed"
    }
  },
  "layout": {
    "type": "SingleColumnLayout",
    "children": [
      {
        "type": "TextHeading",
        "text": "${data.confirmation_message}"
      },
      {
        "type": "Footer",
        "label": "Done",
        "on-click-action": {
          "name": "complete",
          "payload": {
            "booking_id": "${data.booking_id}"
          }
        }
      }
    ]
  }
}
```

## Common Components

### Text Components

```json
{"type": "TextHeading", "text": "Heading Text"}
{"type": "TextSubheading", "text": "Subheading"}
{"type": "TextBody", "text": "Body text"}
{"type": "TextCaption", "text": "Caption text"}
```

### Input Components

```json
// Text Input
{
  "type": "TextInput",
  "name": "field_name",
  "label": "Label",
  "required": true,
  "input-type": "text",  // text, number, email, password, passcode
  "helper-text": "Optional helper text"
}

// Text Area
{
  "type": "TextArea",
  "name": "description",
  "label": "Description",
  "required": false,
  "max-length": 500
}

// Dropdown
{
  "type": "Dropdown",
  "name": "selection",
  "label": "Choose option",
  "required": true,
  "data-source": [
    {"id": "opt1", "title": "Option 1"},
    {"id": "opt2", "title": "Option 2"}
  ]
}

// Radio Buttons
{
  "type": "RadioButtonsGroup",
  "name": "choice",
  "label": "Select one",
  "required": true,
  "data-source": [
    {"id": "yes", "title": "Yes"},
    {"id": "no", "title": "No"}
  ]
}

// Checkbox Group
{
  "type": "CheckboxGroup",
  "name": "preferences",
  "label": "Select all that apply",
  "data-source": [
    {"id": "email", "title": "Email"},
    {"id": "sms", "title": "SMS"}
  ]
}

// Date Picker
{
  "type": "DatePicker",
  "name": "date",
  "label": "Select Date",
  "required": true,
  "min-date": "2024-01-01",
  "max-date": "2024-12-31"
}
```

### Actions

```json
// Navigate Action
{
  "name": "navigate",
  "next": {"type": "screen", "name": "NEXT_SCREEN"},
  "payload": {
    "field": "${form.field_name}"
  }
}

// Complete Action
{
  "name": "complete",
  "payload": {
    "result": "${data.result}"
  }
}

// Data Exchange Action
{
  "name": "data_exchange",
  "payload": {
    "user_input": "${form.user_input}"
  }
}

// Update Data Action (v6.0+)
{
  "name": "update_data",
  "payload": {
    "field_to_update": "${data.new_value}"
  }
}

// Open URL Action (v6.0+)
{
  "name": "open_url",
  "url": "https://example.com/terms"
}
```

## Dynamic Properties

### Form References
```json
"${form.field_name}"
```

### Data References
```json
"${data.property_name}"
```

### Global References (v4.0+)
```json
"${screen.SCREEN_NAME.form.field_name}"
"${screen.SCREEN_NAME.data.property_name}"
```

### Nested Expressions (v6.0+)
```json
// Conditional
"visible": "`${form.age} >= 18`"

// String concatenation
"text": "`'Hello ' ${form.name}`"

// Math operations
"text": "`'Total: ' ${data.price} * ${form.quantity}`"

// Equality
"visible": "`${form.country} == 'US'`"
```

## Endpoint Patterns

### Request Payload Structure

```json
{
  "version": "3.0",
  "action": "INIT",  // or "data_exchange", "BACK"
  "screen": "SCREEN_NAME",
  "data": {
    "field1": "value1"
  },
  "flow_token": "your-flow-token"
}
```

### Response Formats

**Next Screen Response:**
```json
{
  "screen": "NEXT_SCREEN",
  "data": {
    "property1": "value1",
    "property2": "value2"
  }
}
```

**Error Response:**
```json
{
  "screen": "CURRENT_SCREEN",
  "data": {
    "error_message": "Please correct the errors and try again"
  }
}
```

**Success Response:**
```json
{
  "screen": "SUCCESS",
  "data": {
    "extension_message_response": {
      "params": {
        "flow_token": "your-flow-token",
        "result_id": "12345"
      }
    }
  }
}
```

**Health Check Response:**
```json
{
  "data": {
    "status": "active"
  }
}
```

## Common Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| INVALID_PROPERTY | Unknown property in Flow JSON | Check component documentation for valid properties |
| REQUIRED_PROPERTY_MISSING | Required property not set | Add the missing required property |
| INVALID_ROUTING_MODEL | Routing model validation failed | Verify routing rules and screen references |
| UNKNOWN_SCREEN | Screen referenced doesn't exist | Check screen IDs in routing and navigation |
| INVALID_DATA_TYPE | Property has wrong data type | Match data type to component requirements |
| ENCRYPTION_ERROR | Decryption failed | Check private key and encryption implementation |
| TIMEOUT | Endpoint didn't respond in 10s | Optimize endpoint performance |

## Best Practices Checklist

### Flow Design
- [ ] Flow completes in under 5 minutes
- [ ] One task per screen
- [ ] Clear, action-oriented CTAs
- [ ] Progress indicators for multi-step flows
- [ ] Summary screen before completion
- [ ] Error messages include resolution steps

### Technical
- [ ] Flow JSON version specified
- [ ] data_api_version set if using endpoint
- [ ] Routing model defined for endpoint flows
- [ ] Terminal screens have Footer component
- [ ] Sensitive fields marked in sensitive array
- [ ] Endpoint responds within 10 seconds
- [ ] Proper encryption/decryption implemented
- [ ] X-Hub-Signature-256 validated

### UX/UI
- [ ] Sentence case for titles and CTAs
- [ ] Helper text for complex inputs
- [ ] Appropriate input types (date picker for dates, etc.)
- [ ] Logical form field ordering
- [ ] Optional fields marked as optional
- [ ] Confirmation before final submission

## Testing Checklist

- [ ] Flow JSON validates in Builder
- [ ] All screen transitions work
- [ ] Form validation works correctly
- [ ] Error states display properly
- [ ] Dynamic data populates correctly
- [ ] Endpoint encryption/decryption works
- [ ] Health check endpoint responds
- [ ] Flow completion sends webhook

## Common Implementation Tasks

### 1. Create Simple Flow (No Endpoint)

1. Define screens with id, title, layout
2. Add components to layout children
3. Use navigate actions with payload
4. Mark final screen as terminal: true
5. Use complete action on terminal screen

### 2. Add Endpoint to Flow

1. Generate RSA key pair
2. Upload public key via API
3. Add data_api_version to Flow JSON
4. Define routing_model
5. Implement endpoint with encryption
6. Use data_exchange actions
7. Set endpoint URL in Flow configuration

### 3. Implement Dynamic Forms

1. Define data model in screen
2. Use ${data.field} for dynamic values
3. Bind form inputs with name property
4. Reference form values as ${form.field}
5. Pass data via action payloads

### 4. Add Conditional Logic

1. Use If component for conditionals
2. Use Switch component for multiple cases
3. Set visible property on components
4. Use nested expressions (v6.0+)

## Resource Paths

**Documentation Location:**
```
C:/Users/Ali/Documents/Projects/skill-creator-agent/whatsapp-flows-docs/
```

**Key Files:**
- Flow_JSON_-_WhatsApp_Flows.md - Complete Flow JSON spec
- Implementing_Endpoints_for_Flows_-_WhatsApp_Flows.md - Endpoint guide
- Error_Codes_-_WhatsApp_Flows.md - All error codes
- Best_Practices_-_WhatsApp_Flows.md - Design guidelines
