# WhatsApp Flow Screens Reference

This document provides comprehensive documentation for WhatsApp Flow screen structure and configuration in the WhatsApp Builder system.

## Overview

WhatsApp Flows are interactive forms that users complete within the WhatsApp conversation. Flows consist of multiple **screens** that guide users through data collection processes.

### Key Concepts

- **Screen:** A single page/view in the flow
- **Terminal Screen:** The final screen that completes the flow
- **Layout:** The visual structure and components within a screen
- **Data Schema:** The structure of data collected by the screen
- **Routing Model:** Navigation rules between screens

---

## Flow JSON Structure

### Top-Level Structure

```json
{
  "version": "7.2",
  "screens": [
    { /* screen 1 */ },
    { /* screen 2 */ },
    { /* screen 3 */ }
  ]
}
```

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `version` | string | Yes | Flow JSON version (currently "7.2") |
| `screens` | Screen[] | Yes | Array of screen definitions |

---

## Screen Structure

### Basic Screen Schema

```typescript
interface Screen {
  id: string;                    // Screen identifier (SCREAMING_SNAKE_CASE)
  title: string;                 // Screen title shown to user
  terminal: boolean;             // Is this the final screen?
  success?: boolean;             // Terminal screen succeeded? (terminal only)
  data: Record<string, DataField>; // Data schema for this screen
  layout: Layout;                // Visual layout and components
  refresh_on_back?: boolean;     // Refresh when user navigates back
}
```

### Complete Screen Example

```json
{
  "id": "WELCOME_SCREEN",
  "title": "Welcome",
  "terminal": false,
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
        "type": "TextHeading",
        "text": "Welcome to Our Service"
      },
      {
        "type": "TextInput",
        "name": "user_name",
        "label": "Your Name",
        "input-type": "text",
        "required": true
      },
      {
        "type": "TextInput",
        "name": "user_email",
        "label": "Your Email",
        "input-type": "email",
        "required": true
      },
      {
        "type": "Footer",
        "label": "Continue",
        "on-click-action": {
          "name": "navigate",
          "next": {
            "type": "screen",
            "name": "CONFIRMATION_SCREEN"
          }
        }
      }
    ]
  }
}
```

---

## Screen ID Naming

Screen IDs must follow **SCREAMING_SNAKE_CASE** convention:

### Valid Examples

```
✓ WELCOME_SCREEN
✓ USER_INFO
✓ APPOINTMENT_BOOKING
✓ PAYMENT_DETAILS
✓ SUCCESS_SCREEN
✓ ERROR_SCREEN
```

### Invalid Examples

```
✗ welcome_screen (lowercase)
✗ WelcomeScreen (PascalCase)
✗ welcomeScreen (camelCase)
✗ welcome-screen (kebab-case)
✗ Welcome Screen (spaces)
```

### Best Practices

1. **Descriptive names:** Clearly indicate screen purpose
   - `BRAND_SELECTION` better than `SCREEN_1`
   - `BOOKING_CONFIRMATION` better than `CONFIRM`

2. **Consistent suffixes:**
   - `_SCREEN` for main screens: `WELCOME_SCREEN`, `BOOKING_SCREEN`
   - `_FORM` for data entry: `USER_INFO_FORM`, `ADDRESS_FORM`
   - `_CONFIRMATION` for confirmations: `ORDER_CONFIRMATION`
   - `_SUCCESS` for success terminals: `BOOKING_SUCCESS`
   - `_ERROR` for error terminals: `BOOKING_ERROR`

3. **Logical grouping:**
   - `APPOINTMENT_SELECT_DATE`
   - `APPOINTMENT_SELECT_TIME`
   - `APPOINTMENT_SELECT_SERVICE`
   - `APPOINTMENT_CONFIRMATION`

---

## Screen Properties

### 1. `terminal` Property

Indicates whether this is the final screen in the flow.

**Non-Terminal Screen (intermediate):**

```json
{
  "id": "USER_INFO",
  "terminal": false,
  "layout": {
    "children": [
      /* ... */,
      {
        "type": "Footer",
        "label": "Next",
        "on-click-action": {
          "name": "navigate",
          "next": { "type": "screen", "name": "CONFIRMATION" }
        }
      }
    ]
  }
}
```

**Terminal Screen (final):**

```json
{
  "id": "SUCCESS",
  "terminal": true,
  "success": true,
  "layout": {
    "children": [
      /* ... */,
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
```

**Key Differences:**

| Property | Non-Terminal | Terminal |
|----------|--------------|----------|
| `terminal` | `false` | `true` |
| `success` | Not present | `true` or `false` |
| Footer action | `navigate` | `complete` |
| Next screen | Required | Not applicable |

### 2. `success` Property

Only used on terminal screens. Indicates success or failure outcome.

**Success Terminal:**

```json
{
  "id": "BOOKING_SUCCESS",
  "terminal": true,
  "success": true,
  "layout": {
    "children": [
      {
        "type": "TextHeading",
        "text": "Booking Confirmed!"
      },
      {
        "type": "TextBody",
        "text": "Your appointment has been successfully booked."
      },
      {
        "type": "Footer",
        "label": "Close",
        "on-click-action": {
          "name": "complete",
          "payload": {
            "status": "success",
            "booking_id": "${data.booking_id}"
          }
        }
      }
    ]
  }
}
```

**Error Terminal:**

```json
{
  "id": "BOOKING_ERROR",
  "terminal": true,
  "success": false,
  "layout": {
    "children": [
      {
        "type": "TextHeading",
        "text": "Booking Failed"
      },
      {
        "type": "TextBody",
        "text": "Sorry, we couldn't process your booking. Please try again."
      },
      {
        "type": "Footer",
        "label": "Close",
        "on-click-action": {
          "name": "complete",
          "payload": {
            "status": "error",
            "error_message": "${data.error_message}"
          }
        }
      }
    ]
  }
}
```

### 3. `title` Property

Screen title displayed at the top of the flow interface.

**Guidelines:**
- Keep concise (1-4 words)
- Use title case: "Book Appointment", not "BOOK APPOINTMENT"
- Be descriptive: "Select Service" vs "Select"
- Max length: ~50 characters (no hard limit, but keep readable)

**Examples:**

```json
{ "title": "Welcome" }
{ "title": "Select Date" }
{ "title": "Payment Details" }
{ "title": "Order Confirmation" }
```

---

## Data Schema

The `data` property defines the structure and validation for data collected or used by the screen.

### Data Field Types

```typescript
interface DataField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  __example__: any;              // Example value for testing
  items?: DataField;             // For arrays: type of array elements
  properties?: Record<string, DataField>; // For objects: nested structure
}
```

### String Fields

```json
{
  "data": {
    "user_name": {
      "type": "string",
      "__example__": "John Doe"
    },
    "user_email": {
      "type": "string",
      "__example__": "john@example.com"
    },
    "phone_number": {
      "type": "string",
      "__example__": "+905551234567"
    }
  }
}
```

### Number Fields

```json
{
  "data": {
    "quantity": {
      "type": "number",
      "__example__": 2
    },
    "price": {
      "type": "number",
      "__example__": 1500.50
    }
  }
}
```

### Boolean Fields

```json
{
  "data": {
    "accept_terms": {
      "type": "boolean",
      "__example__": true
    },
    "newsletter_opt_in": {
      "type": "boolean",
      "__example__": false
    }
  }
}
```

### Array Fields

**Simple Array:**

```json
{
  "data": {
    "selected_tags": {
      "type": "array",
      "items": {
        "type": "string",
        "__example__": "electronics"
      },
      "__example__": ["electronics", "gadgets"]
    }
  }
}
```

**Array of Objects:**

```json
{
  "data": {
    "cart_items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "product_id": {
            "type": "string",
            "__example__": "prod_123"
          },
          "quantity": {
            "type": "number",
            "__example__": 1
          },
          "price": {
            "type": "number",
            "__example__": 99.99
          }
        }
      },
      "__example__": [
        {
          "product_id": "prod_123",
          "quantity": 1,
          "price": 99.99
        }
      ]
    }
  }
}
```

### Object Fields

```json
{
  "data": {
    "user_address": {
      "type": "object",
      "properties": {
        "street": {
          "type": "string",
          "__example__": "123 Main St"
        },
        "city": {
          "type": "string",
          "__example__": "Istanbul"
        },
        "zip_code": {
          "type": "string",
          "__example__": "34000"
        }
      },
      "__example__": {
        "street": "123 Main St",
        "city": "Istanbul",
        "zip_code": "34000"
      }
    }
  }
}
```

### The `__example__` Property

**Purpose:** Provide sample data for testing and validation.

**Rules:**
1. Must be present for all data fields
2. Must match the declared `type`
3. Used by WhatsApp for flow validation
4. Not shown to users, only for testing

**Examples:**

```json
// String
{ "type": "string", "__example__": "Sample Text" }

// Number
{ "type": "number", "__example__": 42 }

// Boolean
{ "type": "boolean", "__example__": true }

// Array
{ "type": "array", "items": {...}, "__example__": ["item1", "item2"] }

// Object
{
  "type": "object",
  "properties": {...},
  "__example__": { "key": "value" }
}
```

### Initial Data Injection

Data can be pre-populated when launching the flow:

**Chatbot Node Configuration:**

```json
{
  "type": "whatsapp_flow",
  "data": {
    "flowInitialData": {
      "user_id": "{{user_id}}",
      "user_name": "{{user_name}}",
      "preselected_date": "{{preferred_date}}"
    }
  }
}
```

**Flow Data Schema:**

```json
{
  "data": {
    "user_id": {
      "type": "string",
      "__example__": "12345"
    },
    "user_name": {
      "type": "string",
      "__example__": "John Doe"
    },
    "preselected_date": {
      "type": "string",
      "__example__": "2025-11-30"
    }
  }
}
```

When flow launches, these fields are pre-filled with values from chatbot context.

---

## Layout Structure

The `layout` property defines the visual components and their arrangement.

### SingleColumnLayout

The most common layout type:

```json
{
  "layout": {
    "type": "SingleColumnLayout",
    "children": [
      /* Components */
    ]
  }
}
```

**Children Order:**
1. Header components (TextHeading, Image)
2. Body components (TextBody, TextInput, etc.)
3. Footer component (always last)

### Common Components

#### 1. TextHeading

Main heading text:

```json
{
  "type": "TextHeading",
  "text": "Welcome to Our Service"
}
```

#### 2. TextBody

Body text / instructions:

```json
{
  "type": "TextBody",
  "text": "Please fill in your details below to continue."
}
```

**With Dynamic Data:**

```json
{
  "type": "TextBody",
  "text": "Hello ${data.user_name}, your appointment is on ${data.appointment_date}."
}
```

#### 3. TextInput

Single-line text input:

```json
{
  "type": "TextInput",
  "name": "user_name",
  "label": "Your Name",
  "input-type": "text",
  "required": true,
  "helper-text": "Enter your full name"
}
```

**Input Types:**
- `text`: General text
- `email`: Email validation
- `number`: Numeric input
- `phone`: Phone number
- `password`: Hidden text

#### 4. TextArea

Multi-line text input:

```json
{
  "type": "TextArea",
  "name": "comments",
  "label": "Additional Comments",
  "required": false,
  "helper-text": "Optional feedback"
}
```

#### 5. RadioButtonsGroup

Single selection from options:

```json
{
  "type": "RadioButtonsGroup",
  "name": "service_type",
  "label": "Select Service",
  "required": true,
  "data-source": [
    {
      "id": "haircut",
      "title": "Haircut"
    },
    {
      "id": "coloring",
      "title": "Hair Coloring"
    },
    {
      "id": "styling",
      "title": "Styling"
    }
  ]
}
```

**Dynamic Data Source:**

```json
{
  "type": "RadioButtonsGroup",
  "name": "selected_brand",
  "label": "Choose Brand",
  "required": true,
  "data-source": "${data.brands}"
}
```

If `data.brands` is an array from initial data, it populates options dynamically.

#### 6. CheckboxGroup

Multiple selections:

```json
{
  "type": "CheckboxGroup",
  "name": "selected_features",
  "label": "Select Features",
  "required": false,
  "data-source": [
    { "id": "feature_a", "title": "Feature A" },
    { "id": "feature_b", "title": "Feature B" },
    { "id": "feature_c", "title": "Feature C" }
  ]
}
```

#### 7. Dropdown

Dropdown selection:

```json
{
  "type": "Dropdown",
  "name": "country",
  "label": "Select Country",
  "required": true,
  "data-source": [
    { "id": "TR", "title": "Turkey" },
    { "id": "US", "title": "United States" },
    { "id": "UK", "title": "United Kingdom" }
  ]
}
```

#### 8. DatePicker

Date selection:

```json
{
  "type": "DatePicker",
  "name": "appointment_date",
  "label": "Select Date",
  "required": true,
  "min-date": "2025-11-27",
  "max-date": "2025-12-31"
}
```

#### 9. Footer

Navigation button (required, always last):

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

**Complete Action (terminal screens):**

```json
{
  "type": "Footer",
  "label": "Submit",
  "on-click-action": {
    "name": "complete",
    "payload": {
      "user_name": "${form.user_name}",
      "user_email": "${form.user_email}",
      "selected_service": "${form.service_type}"
    }
  }
}
```

---

## Navigation and Routing

### Navigate Action

Used on non-terminal screens to move to next screen:

```json
{
  "on-click-action": {
    "name": "navigate",
    "next": {
      "type": "screen",
      "name": "TARGET_SCREEN"
    }
  }
}
```

**Rules:**
- Target screen must exist in `screens` array
- Screen ID must match exactly (case-sensitive)
- Cannot navigate to same screen (infinite loop)

### Complete Action

Used on terminal screens to finish flow:

```json
{
  "on-click-action": {
    "name": "complete",
    "payload": {
      "status": "success",
      "form_data": {
        "user_name": "${form.user_name}",
        "user_email": "${form.user_email}"
      }
    }
  }
}
```

**Payload:**
- Can be any JSON structure
- Supports data references: `${form.field_name}`, `${data.field_name}`
- Sent back to chatbot via webhook
- Stored in flow output variable

### Data References

Access form and data values in layout components:

**Syntax:**
- `${form.field_name}` - Form input value
- `${data.field_name}` - Data field value
- `${screen.SCREEN_ID.form.field_name}` - Form value from another screen

**Example:**

```json
{
  "type": "TextBody",
  "text": "Hello ${form.user_name}, you selected ${form.service_type} on ${form.appointment_date}."
}
```

If user entered:
- `user_name`: "John Doe"
- `service_type`: "Haircut"
- `appointment_date`: "2025-11-30"

Result:
```
Hello John Doe, you selected Haircut on 2025-11-30.
```

---

## Terminal vs Non-Terminal Screens

### Non-Terminal Screen Pattern

```json
{
  "id": "USER_INFO",
  "title": "Your Information",
  "terminal": false,
  "data": {
    "user_name": {
      "type": "string",
      "__example__": "John Doe"
    }
  },
  "layout": {
    "type": "SingleColumnLayout",
    "children": [
      {
        "type": "TextHeading",
        "text": "Enter Your Details"
      },
      {
        "type": "TextInput",
        "name": "user_name",
        "label": "Name",
        "required": true
      },
      {
        "type": "Footer",
        "label": "Next",
        "on-click-action": {
          "name": "navigate",
          "next": {
            "type": "screen",
            "name": "CONFIRMATION"
          }
        }
      }
    ]
  }
}
```

**Characteristics:**
- `terminal: false`
- No `success` property
- Footer uses `navigate` action
- Requires `next.name` pointing to another screen

### Terminal Screen Pattern (Success)

```json
{
  "id": "SUCCESS",
  "title": "Completed",
  "terminal": true,
  "success": true,
  "data": {
    "confirmation_id": {
      "type": "string",
      "__example__": "CONF-12345"
    }
  },
  "layout": {
    "type": "SingleColumnLayout",
    "children": [
      {
        "type": "TextHeading",
        "text": "Success!"
      },
      {
        "type": "TextBody",
        "text": "Your booking has been confirmed. Confirmation ID: ${data.confirmation_id}"
      },
      {
        "type": "Footer",
        "label": "Done",
        "on-click-action": {
          "name": "complete",
          "payload": {
            "status": "success",
            "confirmation_id": "${data.confirmation_id}",
            "user_name": "${screen.USER_INFO.form.user_name}"
          }
        }
      }
    ]
  }
}
```

**Characteristics:**
- `terminal: true`
- `success: true`
- Footer uses `complete` action
- Payload contains final data to send back

### Terminal Screen Pattern (Error)

```json
{
  "id": "ERROR",
  "title": "Error",
  "terminal": true,
  "success": false,
  "data": {
    "error_message": {
      "type": "string",
      "__example__": "Slot not available"
    }
  },
  "layout": {
    "type": "SingleColumnLayout",
    "children": [
      {
        "type": "TextHeading",
        "text": "Something Went Wrong"
      },
      {
        "type": "TextBody",
        "text": "Error: ${data.error_message}"
      },
      {
        "type": "Footer",
        "label": "Close",
        "on-click-action": {
          "name": "complete",
          "payload": {
            "status": "error",
            "error": "${data.error_message}"
          }
        }
      }
    ]
  }
}
```

**Characteristics:**
- `terminal: true`
- `success: false`
- Used for error states
- Payload indicates failure

---

## Routing Model

### data_exchange Mode

Requires backend endpoint for dynamic data and validation.

**Example with endpoint:**

```json
{
  "routing_model": {
    "BRAND_SCREEN": ["GET_CATEGORIES", "ERROR"]
  }
}
```

**Flow:**
1. User fills form on BRAND_SCREEN
2. Clicks "Next" → Triggers data exchange request to endpoint
3. Endpoint returns: `{ "screen": "GET_CATEGORIES", "data": {...} }`
4. Flow navigates to GET_CATEGORIES with new data

**Endpoint Response:**

```json
{
  "version": "3.0",
  "screen": "GET_CATEGORIES",
  "data": {
    "categories": [
      { "id": "cat_1", "title": "Category 1" },
      { "id": "cat_2", "title": "Category 2" }
    ]
  }
}
```

Or error:

```json
{
  "version": "3.0",
  "screen": "ERROR",
  "data": {
    "error_message": "Selected brand is not available"
  }
}
```

### navigate Mode

Simple client-side navigation without endpoint.

**Example:**

```json
{
  "routing_model": {}
}
```

All navigation defined in screen Footer actions.

---

## Complete Flow Example

### Simple Two-Screen Flow

```json
{
  "version": "7.2",
  "screens": [
    {
      "id": "WELCOME",
      "title": "Welcome",
      "terminal": false,
      "data": {
        "user_name": {
          "type": "string",
          "__example__": "John Doe"
        }
      },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Welcome!"
          },
          {
            "type": "TextBody",
            "text": "Please enter your name to continue."
          },
          {
            "type": "TextInput",
            "name": "user_name",
            "label": "Your Name",
            "input-type": "text",
            "required": true
          },
          {
            "type": "Footer",
            "label": "Continue",
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
      "title": "Thank You",
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
            "text": "Hello ${screen.WELCOME.form.user_name}, your submission is complete."
          },
          {
            "type": "Footer",
            "label": "Done",
            "on-click-action": {
              "name": "complete",
              "payload": {
                "user_name": "${screen.WELCOME.form.user_name}"
              }
            }
          }
        ]
      }
    }
  ]
}
```

---

## Best Practices

### 1. Screen Organization

**Logical flow:**
```
WELCOME → USER_INFO → SERVICE_SELECTION → DATE_SELECTION → CONFIRMATION → SUCCESS
```

**Clear naming:**
- Use descriptive IDs: `APPOINTMENT_BOOKING` not `SCREEN_2`
- Group related screens: `PAYMENT_INFO`, `PAYMENT_CONFIRMATION`

### 2. Data Schema Design

**Define all fields:**
```json
{
  "data": {
    "field1": { "type": "string", "__example__": "value" },
    "field2": { "type": "number", "__example__": 42 }
  }
}
```

**Use proper types:**
- Numbers for quantities, prices
- Strings for names, IDs
- Booleans for flags
- Arrays for lists

### 3. Terminal Screen Patterns

**Always have success terminal:**
```json
{ "id": "SUCCESS", "terminal": true, "success": true }
```

**Optional error terminal:**
```json
{ "id": "ERROR", "terminal": true, "success": false }
```

### 4. Layout Component Order

```json
{
  "children": [
    /* 1. Header */
    { "type": "TextHeading" },

    /* 2. Body text */
    { "type": "TextBody" },

    /* 3. Inputs */
    { "type": "TextInput" },
    { "type": "RadioButtonsGroup" },

    /* 4. Footer (always last) */
    { "type": "Footer" }
  ]
}
```

### 5. Validation

**Required fields:**
```json
{ "type": "TextInput", "required": true }
```

**Input types:**
```json
{ "input-type": "email" }  // Validates email format
{ "input-type": "number" }  // Only accepts numbers
```

### 6. Error Handling

**Provide error screen:**
```json
{
  "id": "ERROR",
  "terminal": true,
  "success": false,
  "layout": {
    "children": [
      {
        "type": "TextHeading",
        "text": "Error"
      },
      {
        "type": "TextBody",
        "text": "${data.error_message}"
      },
      {
        "type": "Footer",
        "label": "Close",
        "on-click-action": {
          "name": "complete",
          "payload": { "status": "error" }
        }
      }
    ]
  }
}
```

---

## Debugging Flows

### Common Issues

**1. Screen not found:**
```
Error: Screen "NEXTSTEP" not found
```
Solution: Check screen ID spelling and case.

**2. Missing __example__:**
```
Validation error: data.field1 missing __example__
```
Solution: Add `"__example__"` to all data fields.

**3. Invalid data type:**
```
Type mismatch: expected number, got string
```
Solution: Check data schema types match actual values.

**4. Footer action error:**
```
Invalid action: navigate to undefined screen
```
Solution: Ensure target screen exists.

### Testing Flows

**1. Test in WhatsApp Flow Builder:**
- Use test mode with example data
- Validate all navigation paths
- Check data references work

**2. Test with Chatbot:**
- Send flow via WHATSAPP_FLOW node
- Complete flow with real data
- Verify payload received correctly

**3. Check Payload:**
```json
{
  "status": "success",
  "user_name": "John Doe",
  "service": "haircut",
  "date": "2025-11-30"
}
```

---

This completes the WhatsApp Flow screens reference. Flows are powerful tools for collecting structured data within WhatsApp conversations.
