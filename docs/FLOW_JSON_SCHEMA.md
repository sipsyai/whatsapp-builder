# WhatsApp Flow JSON Schema Reference

Complete reference for WhatsApp Flow JSON v3.0 structure and validation rules.

## Table of Contents

1. [Root Structure](#root-structure)
2. [Screen Structure](#screen-structure)
3. [Layout Types](#layout-types)
4. [Component Reference](#component-reference)
5. [Action Types](#action-types)
6. [Data Types](#data-types)
7. [Validation Rules](#validation-rules)
8. [Complete Examples](#complete-examples)

---

## Root Structure

### FlowJSON

```typescript
{
  version: FlowJSONVersion;              // Required
  name?: string;                         // Optional, UI only
  data_api_version?: "3.0";              // Optional, required if using data exchange
  routing_model?: Record<string, unknown>; // Optional, auto-generated
  screens: FlowScreen[];                 // Required, min 1 screen
}
```

### Supported Versions

- `"2.1"` - Legacy
- `"3.0"` - Current recommended
- `"4.0"`, `"5.0"`, `"5.1"` - Enhanced features
- `"6.0"`, `"6.1"`, `"6.2"`, `"6.3"` - Advanced features
- `"7.0"`, `"7.1"`, `"7.2"` - Latest features

**Recommended:** Use `"3.0"` for maximum compatibility.

---

## Screen Structure

### FlowScreen

```typescript
{
  id: string;                            // Required, unique, UPPERCASE recommended
  title?: string;                        // Optional, screen title
  terminal?: boolean;                    // Optional, marks end screen (requires Footer)
  refresh_on_back?: boolean;             // Optional, v3.0+
  data?: ScreenData;                     // Optional, dynamic data model
  layout: Layout;                        // Required
}
```

### Screen Rules

1. **ID Requirements:**
   - Must be unique within flow
   - Cannot use reserved word: `SUCCESS`
   - Recommended format: `UPPERCASE_SNAKE_CASE`
   - Examples: `WELCOME`, `USER_DETAILS`, `CONFIRMATION`

2. **Terminal Screens:**
   - Must include a `Footer` component
   - Marks the end of the flow
   - Multiple terminal screens allowed
   - At least one terminal screen required

3. **Navigation:**
   - Screens must be reachable from initial screen
   - No orphaned screens
   - Circular navigation is allowed

---

## Layout Types

### SingleColumnLayout

Currently the only supported layout type.

```typescript
{
  type: "SingleColumnLayout";
  children: Component[];                 // Array of components
}
```

**Rules:**
- Maximum 50 components per screen
- Components rendered in order
- All components stack vertically

---

## Component Reference

### Text Components

#### TextHeading

```typescript
{
  type: "TextHeading";
  text: string | DynamicString;          // Max 80 chars
  visible?: boolean | DynamicBoolean;    // Optional, default: true
}
```

**Example:**
```json
{
  "type": "TextHeading",
  "text": "Welcome to Our Service"
}
```

---

#### TextSubheading

```typescript
{
  type: "TextSubheading";
  text: string | DynamicString;          // Max 120 chars
  visible?: boolean | DynamicBoolean;
}
```

**Example:**
```json
{
  "type": "TextSubheading",
  "text": "Please provide your information"
}
```

---

#### TextBody

```typescript
{
  type: "TextBody";
  text: string | DynamicString;          // Max 4096 chars
  "font-weight"?: "bold" | "italic" | "bold_italic" | "normal";
  strikethrough?: boolean | DynamicBoolean;
  visible?: boolean | DynamicBoolean;
  markdown?: boolean;                    // v5.1+
}
```

**Example:**
```json
{
  "type": "TextBody",
  "text": "This is **bold** and *italic* text",
  "markdown": true,
  "font-weight": "normal"
}
```

---

#### TextCaption

```typescript
{
  type: "TextCaption";
  text: string | DynamicString;          // Max 4096 chars
  "font-weight"?: "bold" | "italic" | "bold_italic" | "normal";
  strikethrough?: boolean | DynamicBoolean;
  visible?: boolean | DynamicBoolean;
  markdown?: boolean;                    // v5.1+
}
```

---

### Input Components

#### TextInput

```typescript
{
  type: "TextInput";
  name: string;                          // Required, unique field name
  label: string | DynamicString;         // Required, max 50 chars
  "label-variant"?: "large";             // v7.0+
  "input-type"?: InputType;              // Optional, default: "text"
  pattern?: string;                      // v6.2+, regex pattern
  required?: boolean | DynamicBoolean;   // Optional, default: false
  "min-chars"?: string | number;         // Optional
  "max-chars"?: string | number;         // Optional, max 200
  "helper-text"?: string | DynamicString; // Optional
  visible?: boolean | DynamicBoolean;
  "init-value"?: string | DynamicString; // v4.0+
  "error-message"?: string | DynamicString; // v4.0+
}
```

**InputType Values:**
- `"text"` - General text
- `"number"` - Numeric input
- `"email"` - Email address
- `"password"` - Masked password
- `"passcode"` - Short PIN code
- `"phone"` - Phone number

**Example:**
```json
{
  "type": "TextInput",
  "name": "full_name",
  "label": "Full Name",
  "input-type": "text",
  "required": true,
  "min-chars": "2",
  "max-chars": "50",
  "helper-text": "Enter your full legal name",
  "error-message": "Name must be between 2-50 characters"
}
```

---

#### TextArea

```typescript
{
  type: "TextArea";
  name: string;                          // Required, unique
  label: string | DynamicString;         // Required
  "label-variant"?: "large";             // v7.0+
  required?: boolean | DynamicBoolean;
  "max-length"?: string | number;        // Max 1000
  "helper-text"?: string | DynamicString;
  enabled?: boolean | DynamicBoolean;
  visible?: boolean | DynamicBoolean;
  "init-value"?: string | DynamicString; // v4.0+
  "error-message"?: string | DynamicString; // v4.0+
}
```

**Example:**
```json
{
  "type": "TextArea",
  "name": "comments",
  "label": "Additional Comments",
  "max-length": "500",
  "helper-text": "Optional - max 500 characters"
}
```

---

### Selection Components

#### CheckboxGroup

```typescript
{
  type: "CheckboxGroup";
  name: string;                          // Required, unique
  label: string | DynamicString;         // Required
  "data-source": DataSourceItem[] | DynamicString; // Required
  "min-selected-items"?: number | string;
  "max-selected-items"?: number | string;
  enabled?: boolean | DynamicBoolean;
  required?: boolean | DynamicBoolean;
  visible?: boolean | DynamicBoolean;
  "on-select-action"?: DataExchangeAction | UpdateDataAction;
  "on-unselect-action"?: UpdateDataAction; // v6.0+
  description?: string | DynamicString;   // v4.0+
  "init-value"?: string[] | DynamicString; // v4.0+
  "error-message"?: string | DynamicString; // v4.0+
  "media-size"?: "regular" | "large";     // v5.0+
}
```

**Example:**
```json
{
  "type": "CheckboxGroup",
  "name": "services",
  "label": "Select Services",
  "required": true,
  "min-selected-items": 1,
  "max-selected-items": 3,
  "data-source": [
    {
      "id": "service1",
      "title": "Service 1",
      "description": "Description of service 1"
    },
    {
      "id": "service2",
      "title": "Service 2",
      "description": "Description of service 2"
    }
  ]
}
```

---

#### RadioButtonsGroup

```typescript
{
  type: "RadioButtonsGroup";
  name: string;                          // Required, unique
  label: string | DynamicString;         // Required
  "data-source": DataSourceItem[] | DynamicString; // Required
  enabled?: boolean | DynamicBoolean;
  required?: boolean | DynamicBoolean;
  visible?: boolean | DynamicBoolean;
  "on-select-action"?: DataExchangeAction | UpdateDataAction;
  "on-unselect-action"?: UpdateDataAction; // v6.0+
  description?: string | DynamicString;   // v4.0+
  "init-value"?: string[] | DynamicString; // v4.0+
  "error-message"?: string | DynamicString; // v4.0+
  "media-size"?: "regular" | "large";     // v5.0+
}
```

**Example:**
```json
{
  "type": "RadioButtonsGroup",
  "name": "payment_method",
  "label": "Payment Method",
  "required": true,
  "data-source": [
    { "id": "card", "title": "Credit Card" },
    { "id": "cash", "title": "Cash" },
    { "id": "bank", "title": "Bank Transfer" }
  ]
}
```

---

#### Dropdown

```typescript
{
  type: "Dropdown";
  label: string | DynamicString;         // Required
  "data-source": DataSourceItem[] | DynamicString; // Required
  required?: boolean | DynamicBoolean;
  enabled?: boolean | DynamicBoolean;
  visible?: boolean | DynamicBoolean;
  "on-select-action"?: DataExchangeAction | UpdateDataAction;
  "on-unselect-action"?: UpdateDataAction; // v6.0+
  "init-value"?: string | DynamicString;
  "error-message"?: string | DynamicString;
}
```

**Example:**
```json
{
  "type": "Dropdown",
  "label": "Select Country",
  "required": true,
  "data-source": [
    { "id": "us", "title": "United States" },
    { "id": "tr", "title": "Turkey" },
    { "id": "uk", "title": "United Kingdom" }
  ]
}
```

---

#### ChipsSelector

```typescript
{
  type: "ChipsSelector";
  name: string;                          // Required, unique
  label: string | DynamicString;         // Required
  "data-source": DataSourceItem[] | DynamicString; // Required
  "min-selected-items"?: number | string;
  "max-selected-items"?: number | string;
  enabled?: boolean | DynamicBoolean;
  required?: boolean | DynamicBoolean;
  visible?: boolean | DynamicBoolean;
  description?: string | DynamicString;
  "init-value"?: string[] | DynamicString;
  "error-message"?: string | DynamicString;
  "on-select-action"?: DataExchangeAction | UpdateDataAction; // v7.1+
  "on-unselect-action"?: UpdateDataAction; // v7.1+
}
```

---

#### DataSourceItem

```typescript
{
  id: string;                            // Required, unique within data-source
  title: string;                         // Required, max 30 chars
  description?: string;                  // Optional, max 120 chars
  metadata?: string;                     // Optional
  enabled?: boolean;                     // Optional, default: true
  image?: string;                        // v5.0+, base64 encoded
  "alt-text"?: string;                   // v5.0+
  color?: string;                        // v5.0+, 6-digit hex (#RRGGBB)
  "on-select-action"?: UpdateDataAction; // v6.0+
  "on-unselect-action"?: UpdateDataAction; // v6.0+
}
```

**Example:**
```json
{
  "id": "option1",
  "title": "Option 1",
  "description": "This is option 1",
  "enabled": true
}
```

---

### Date Components

#### DatePicker

```typescript
{
  type: "DatePicker";
  name: string;                          // Required, unique
  label: string | DynamicString;         // Required
  "min-date"?: string | DynamicString;   // v5.0+ format: "YYYY-MM-DD"
  "max-date"?: string | DynamicString;   // v5.0+ format: "YYYY-MM-DD"
  "unavailable-dates"?: string[] | DynamicString; // ["YYYY-MM-DD", ...]
  visible?: boolean | DynamicBoolean;
  "helper-text"?: string | DynamicString;
  enabled?: boolean | DynamicBoolean;
  "on-select-action"?: DataExchangeAction;
  "init-value"?: string | DynamicString; // v4.0+
  "error-message"?: string | DynamicString; // v4.0+
}
```

**Example:**
```json
{
  "type": "DatePicker",
  "name": "appointment_date",
  "label": "Select Date",
  "min-date": "2025-01-15",
  "max-date": "2025-12-31",
  "unavailable-dates": ["2025-01-20", "2025-02-14"],
  "helper-text": "Select your preferred appointment date"
}
```

---

#### CalendarPicker

```typescript
{
  type: "CalendarPicker";
  name: string;                          // Required, unique
  label: string | DynamicString;         // Required
  title?: string | DynamicString;        // Only when mode='range'
  description?: string | DynamicString;  // Only when mode='range'
  "helper-text"?: string | DynamicString;
  required?: boolean | DynamicBoolean;
  visible?: boolean | DynamicBoolean;
  enabled?: boolean | DynamicBoolean;
  mode?: "single" | "range";             // Default: "single"
  "min-date"?: string | DynamicString;   // "YYYY-MM-DD"
  "max-date"?: string | DynamicString;   // "YYYY-MM-DD"
  "unavailable-dates"?: string[] | DynamicString;
  "include-days"?: DayOfWeek[];          // Filter by weekdays
  "min-days"?: number | string;          // Only in range mode
  "max-days"?: number | string;          // Only in range mode
  "on-select-action"?: DataExchangeAction;
  "init-value"?: string | DynamicString;
  "error-message"?: string | DynamicString;
}
```

**DayOfWeek:** `"Mon"` | `"Tue"` | `"Wed"` | `"Thu"` | `"Fri"` | `"Sat"` | `"Sun"`

**Example:**
```json
{
  "type": "CalendarPicker",
  "name": "booking_dates",
  "label": "Select Booking Period",
  "mode": "range",
  "min-date": "2025-01-15",
  "max-date": "2025-12-31",
  "include-days": ["Mon", "Tue", "Wed", "Thu", "Fri"],
  "min-days": 2,
  "max-days": 7
}
```

---

### Action Components

#### Footer

**Required on terminal screens.**

```typescript
{
  type: "Footer";
  label: string | DynamicString;         // Required, max 20 chars
  "left-caption"?: string | DynamicString;
  "center-caption"?: string | DynamicString;
  "right-caption"?: string | DynamicString;
  enabled?: boolean | DynamicBoolean;
  "on-click-action": Action;             // Required
}
```

**Example:**
```json
{
  "type": "Footer",
  "label": "Submit",
  "left-caption": "Step 3 of 3",
  "enabled": true,
  "on-click-action": {
    "name": "complete"
  }
}
```

---

#### OptIn

```typescript
{
  type: "OptIn";
  name: string;                          // Required, unique
  label: string | DynamicString;         // Required
  required?: boolean | DynamicBoolean;
  "on-click-action"?: DataExchangeAction | NavigateAction | OpenUrlAction; // v6.0+
  "on-select-action"?: UpdateDataAction; // v6.0+
  "on-unselect-action"?: UpdateDataAction; // v6.0+
  visible?: boolean | DynamicBoolean;
  "init-value"?: boolean | DynamicBoolean; // v4.0+
}
```

**Example:**
```json
{
  "type": "OptIn",
  "name": "terms_accepted",
  "label": "I accept the terms and conditions",
  "required": true,
  "on-click-action": {
    "name": "open_url",
    "payload": {
      "url": "https://example.com/terms"
    }
  }
}
```

---

#### EmbeddedLink

```typescript
{
  type: "EmbeddedLink";
  text: string | DynamicString;          // Required
  "on-click-action": DataExchangeAction | NavigateAction | OpenUrlAction; // Required
  visible?: boolean | DynamicBoolean;
}
```

**Example:**
```json
{
  "type": "EmbeddedLink",
  "text": "Learn more about our services",
  "on-click-action": {
    "name": "open_url",
    "payload": {
      "url": "https://example.com/info"
    }
  }
}
```

---

### Media Components

#### Image

```typescript
{
  type: "Image";
  src: string | DynamicString;           // Required, base64 encoded
  width?: number | string;
  height?: number | string;
  "scale-type"?: "cover" | "contain";
  "aspect-ratio"?: number | string;
  "alt-text"?: string | DynamicString;
}
```

**Example:**
```json
{
  "type": "Image",
  "src": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "alt-text": "Company Logo",
  "scale-type": "contain",
  "aspect-ratio": 1.5
}
```

---

#### ImageCarousel

```typescript
{
  type: "ImageCarousel";
  images: ImageItem[] | DynamicString;   // Required
  "aspect-ratio"?: "4:3" | "16:9";
  "scale-type"?: "contain" | "cover";
}

interface ImageItem {
  src: string;                           // Base64 encoded
  "alt-text": string;
}
```

**Example:**
```json
{
  "type": "ImageCarousel",
  "aspect-ratio": "16:9",
  "scale-type": "cover",
  "images": [
    {
      "src": "data:image/png;base64,iVBORw0...",
      "alt-text": "Image 1"
    },
    {
      "src": "data:image/png;base64,iVBORw0...",
      "alt-text": "Image 2"
    }
  ]
}
```

---

## Action Types

### NavigateAction

Navigate to another screen.

```typescript
{
  name: "navigate";
  next: {
    type: "screen";
    name: string;                        // Target screen ID
  };
  payload?: Record<string, unknown>;
}
```

**Example:**
```json
{
  "name": "navigate",
  "next": {
    "type": "screen",
    "name": "DETAILS_SCREEN"
  },
  "payload": {
    "from": "welcome"
  }
}
```

---

### CompleteAction

End the flow and return data.

```typescript
{
  name: "complete";
  payload?: Record<string, unknown>;
}
```

**Example:**
```json
{
  "name": "complete",
  "payload": {
    "status": "success",
    "timestamp": "${data.timestamp}"
  }
}
```

---

### DataExchangeAction

Communicate with backend endpoint for dynamic data.

```typescript
{
  name: "data_exchange";
  payload?: Record<string, unknown>;
}
```

**Example:**
```json
{
  "name": "data_exchange",
  "payload": {
    "action": "fetch_available_slots",
    "date": "${data.selected_date}"
  }
}
```

---

### UpdateDataAction

Update screen data without backend call.

```typescript
{
  name: "update_data";
  payload: Record<string, unknown>;      // Required
}
```

**Example:**
```json
{
  "name": "update_data",
  "payload": {
    "total_price": "${data.quantity * data.unit_price}"
  }
}
```

---

### OpenUrlAction

Open external URL (v6.0+).

```typescript
{
  name: "open_url";
  payload: {
    url: string;                         // Required
  };
}
```

**Example:**
```json
{
  "name": "open_url",
  "payload": {
    "url": "https://example.com/help"
  }
}
```

---

## Data Types

### Dynamic Strings

Reference screen data:

```typescript
"${data.field_name}"                     // Reference field value
"${data.user.name}"                      // Nested object access
"${data.items[0].title}"                 // Array access
```

**Example:**
```json
{
  "type": "TextBody",
  "text": "Hello ${data.full_name}, your appointment is on ${data.appointment_date}"
}
```

---

### Screen Data Model

Define data schema for dynamic content:

```typescript
{
  "data": {
    "field_name": {
      "type": "string" | "number" | "boolean" | "array" | "object",
      "__example__": "example value"
    }
  }
}
```

**Example:**
```json
{
  "id": "RESULTS",
  "data": {
    "results": {
      "type": "array",
      "__example__": [
        { "id": "1", "title": "Item 1" },
        { "id": "2", "title": "Item 2" }
      ],
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "title": { "type": "string" }
        }
      }
    }
  },
  "layout": {
    "type": "SingleColumnLayout",
    "children": [
      {
        "type": "RadioButtonsGroup",
        "name": "selected_result",
        "label": "Select Result",
        "data-source": "${data.results}"
      }
    ]
  }
}
```

---

## Validation Rules

### Global Rules

1. **Version:** Must be a valid Flow JSON version string
2. **Screens:** At least one screen required
3. **Terminal:** At least one terminal screen required
4. **Screen IDs:** Must be unique within flow
5. **Navigation:** All screens must be reachable
6. **Footer:** Required on all terminal screens

---

### Component Rules

1. **Name Uniqueness:** All component `name` fields must be unique within screen
2. **Required Fields:** All required fields must be present
3. **Character Limits:** Enforced on all text fields
4. **Data Source:** Max 10 items in selection components
5. **Date Format:** Must be "YYYY-MM-DD" (v5.0+)
6. **Actions:** Must be valid action type

---

### Character Limits

| Field | Max Length |
|-------|-----------|
| TextHeading.text | 80 |
| TextSubheading.text | 120 |
| TextBody.text | 4096 |
| TextCaption.text | 4096 |
| TextInput.label | 50 |
| TextInput.max-chars | 200 |
| TextArea.max-length | 1000 |
| Footer.label | 20 |
| DataSourceItem.title | 30 |
| DataSourceItem.description | 120 |

---

### Count Limits

| Item | Max Count |
|------|-----------|
| Screens per flow | Unlimited (recommended: < 10) |
| Components per screen | 50 |
| Data source items | 10 |
| CheckboxGroup selected items | 10 |
| ImageCarousel images | 10 |

---

## Complete Examples

### Example 1: Single Screen Form

```json
{
  "version": "3.0",
  "screens": [
    {
      "id": "CONTACT_FORM",
      "title": "Contact Us",
      "terminal": true,
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Get in Touch"
          },
          {
            "type": "TextBody",
            "text": "We'd love to hear from you"
          },
          {
            "type": "TextInput",
            "name": "full_name",
            "label": "Full Name",
            "input-type": "text",
            "required": true,
            "min-chars": "2",
            "max-chars": "50"
          },
          {
            "type": "TextInput",
            "name": "email",
            "label": "Email",
            "input-type": "email",
            "required": true
          },
          {
            "type": "TextInput",
            "name": "phone",
            "label": "Phone Number",
            "input-type": "phone"
          },
          {
            "type": "TextArea",
            "name": "message",
            "label": "Your Message",
            "required": true,
            "max-length": "500"
          },
          {
            "type": "OptIn",
            "name": "newsletter",
            "label": "Subscribe to newsletter"
          },
          {
            "type": "Footer",
            "label": "Submit",
            "on-click-action": {
              "name": "complete"
            }
          }
        ]
      }
    }
  ]
}
```

---

### Example 2: Multi-Screen Booking Flow

```json
{
  "version": "3.0",
  "screens": [
    {
      "id": "WELCOME",
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Appointment Booking"
          },
          {
            "type": "TextBody",
            "text": "Book your appointment in 3 easy steps"
          },
          {
            "type": "Footer",
            "label": "Get Started",
            "on-click-action": {
              "name": "navigate",
              "next": { "type": "screen", "name": "PERSONAL_INFO" }
            }
          }
        ]
      }
    },
    {
      "id": "PERSONAL_INFO",
      "title": "Your Information",
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextSubheading",
            "text": "Step 1: Personal Details"
          },
          {
            "type": "TextInput",
            "name": "full_name",
            "label": "Full Name",
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
            "type": "TextInput",
            "name": "phone",
            "label": "Phone",
            "input-type": "phone",
            "required": true
          },
          {
            "type": "Footer",
            "label": "Next",
            "left-caption": "Step 1 of 3",
            "on-click-action": {
              "name": "navigate",
              "next": { "type": "screen", "name": "SELECT_SERVICE" }
            }
          }
        ]
      }
    },
    {
      "id": "SELECT_SERVICE",
      "title": "Select Service",
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextSubheading",
            "text": "Step 2: Choose Service"
          },
          {
            "type": "RadioButtonsGroup",
            "name": "service_type",
            "label": "Service Type",
            "required": true,
            "data-source": [
              {
                "id": "consultation",
                "title": "Consultation",
                "description": "30 minutes - $50"
              },
              {
                "id": "treatment",
                "title": "Treatment",
                "description": "60 minutes - $100"
              },
              {
                "id": "followup",
                "title": "Follow-up",
                "description": "15 minutes - $25"
              }
            ]
          },
          {
            "type": "Footer",
            "label": "Next",
            "left-caption": "Step 2 of 3",
            "on-click-action": {
              "name": "navigate",
              "next": { "type": "screen", "name": "SELECT_DATETIME" }
            }
          }
        ]
      }
    },
    {
      "id": "SELECT_DATETIME",
      "title": "Select Date & Time",
      "terminal": true,
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextSubheading",
            "text": "Step 3: Pick Date & Time"
          },
          {
            "type": "DatePicker",
            "name": "appointment_date",
            "label": "Appointment Date",
            "min-date": "2025-01-15",
            "max-date": "2025-12-31"
          },
          {
            "type": "RadioButtonsGroup",
            "name": "time_slot",
            "label": "Time Slot",
            "required": true,
            "data-source": [
              { "id": "morning", "title": "9:00 AM - 12:00 PM" },
              { "id": "afternoon", "title": "1:00 PM - 5:00 PM" },
              { "id": "evening", "title": "6:00 PM - 9:00 PM" }
            ]
          },
          {
            "type": "TextArea",
            "name": "notes",
            "label": "Additional Notes",
            "max-length": "500"
          },
          {
            "type": "Footer",
            "label": "Book Appointment",
            "left-caption": "Step 3 of 3",
            "on-click-action": {
              "name": "complete"
            }
          }
        ]
      }
    }
  ]
}
```

---

### Example 3: Dynamic Data Exchange

```json
{
  "version": "3.0",
  "data_api_version": "3.0",
  "screens": [
    {
      "id": "SELECT_DATE",
      "data": {
        "available_slots": {
          "type": "array",
          "__example__": [
            { "id": "slot1", "title": "9:00 AM" },
            { "id": "slot2", "title": "10:00 AM" }
          ]
        }
      },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "DatePicker",
            "name": "date",
            "label": "Select Date",
            "on-select-action": {
              "name": "data_exchange",
              "payload": {
                "action": "fetch_slots"
              }
            }
          },
          {
            "type": "RadioButtonsGroup",
            "name": "time_slot",
            "label": "Available Times",
            "data-source": "${data.available_slots}"
          },
          {
            "type": "Footer",
            "label": "Next",
            "on-click-action": {
              "name": "navigate",
              "next": { "type": "screen", "name": "CONFIRM" }
            }
          }
        ]
      }
    },
    {
      "id": "CONFIRM",
      "terminal": true,
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextBody",
            "text": "Appointment: ${data.date} at ${data.time_slot}"
          },
          {
            "type": "Footer",
            "label": "Confirm",
            "on-click-action": {
              "name": "complete"
            }
          }
        ]
      }
    }
  ]
}
```

---

## Validation Checklist

Before publishing a flow, verify:

- [ ] Version is set and valid
- [ ] At least one screen exists
- [ ] All screen IDs are unique
- [ ] At least one terminal screen exists
- [ ] All terminal screens have Footer component
- [ ] All component names are unique within screens
- [ ] All required fields are present
- [ ] Character limits are respected
- [ ] Date formats are "YYYY-MM-DD" (if using v5.0+)
- [ ] Data source items ≤ 10
- [ ] Navigation paths are valid
- [ ] All referenced screen IDs exist
- [ ] Dynamic data references are correct

---

## Related Documentation

- **API Guide:** `docs/WHATSAPP_FLOW_API_GUIDE.md`
- **Quick Reference:** `docs/FLOW_API_QUICK_REFERENCE.md`
- **TypeScript Types:** `frontend/src/features/flow-builder/types/flow-json.types.ts`
- **WhatsApp Official Docs:** [Flow JSON Reference](https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson)
