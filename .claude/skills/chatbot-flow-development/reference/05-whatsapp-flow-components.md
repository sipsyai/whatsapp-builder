# WhatsApp Flow Components Reference

Complete reference guide for all WhatsApp Flow components available in the chatbot builder.

## Table of Contents
- [Overview](#overview)
- [Text Components](#text-components)
- [Input Components](#input-components)
- [Interactive Components](#interactive-components)
- [Footer Component](#footer-component)
- [Component Limits](#component-limits)

---

## Overview

WhatsApp Flows use components as building blocks to create interactive forms within chatbot conversations. Each screen can contain up to 50 components. Components support both static and dynamic data binding.

### Dynamic Data Binding

All components support dynamic data references using the syntax:
- `${data.variableName}` - Reference data passed to screen
- `${form.fieldName}` - Reference form input values

---

## Text Components

Text components display non-interactive content to users.

### TextHeading

Top-level title of a screen.

```json
{
  "type": "TextHeading",
  "text": "Welcome to Our Service"
}
```

**Properties:**
- `type` (required): `"TextHeading"`
- `text` (required): String, max 80 characters. Supports `${data.text}`
- `visible`: Boolean, default `true`. Supports `${data.is_visible}`

### TextSubheading

Secondary heading below TextHeading.

```json
{
  "type": "TextSubheading",
  "text": "Please provide your details"
}
```

**Properties:**
- `type` (required): `"TextSubheading"`
- `text` (required): String, max 80 characters. Supports `${data.text}`
- `visible`: Boolean, default `true`. Supports `${data.is_visible}`

### TextBody

Main body text with formatting options.

```json
{
  "type": "TextBody",
  "text": "Complete the form to book your appointment",
  "font-weight": "normal",
  "markdown": true
}
```

**Properties:**
- `type` (required): `"TextBody"`
- `text` (required): String, max 4096 characters. Supports `${data.text}`
- `font-weight`: Enum `['normal', 'bold', 'italic', 'bold_italic']`. Supports `${data.font_weight}`
- `strikethrough`: Boolean. Supports `${data.strikethrough}`
- `markdown`: Boolean, default `false` (requires Flow JSON v5.1+)
- `visible`: Boolean, default `true`. Supports `${data.is_visible}`

**Markdown Support (v5.1+):**
```json
{
  "type": "TextBody",
  "markdown": true,
  "text": "This is **bold**, *italic*, and ~~strikethrough~~"
}
```

### TextCaption

Small caption text below components.

```json
{
  "type": "TextCaption",
  "text": "This information is required for verification"
}
```

**Properties:**
- `type` (required): `"TextCaption"`
- `text` (required): String, max 4096 characters. Supports `${data.text}`
- `font-weight`: Enum `['normal', 'bold', 'italic', 'bold_italic']`
- `strikethrough`: Boolean
- `markdown`: Boolean, default `false` (requires Flow JSON v5.1+)
- `visible`: Boolean, default `true`

---

## Input Components

Input components collect user data.

### TextInput

Single-line text input with validation.

```json
{
  "type": "TextInput",
  "name": "email",
  "label": "Email Address",
  "input-type": "email",
  "required": true,
  "helper-text": "We'll never share your email"
}
```

**Properties:**
- `type` (required): `"TextInput"`
- `name` (required): String, unique field identifier
- `label` (required): String, field label
- `input-type`: Enum (see Input Types below)
- `required`: Boolean, default `false`
- `enabled`: Boolean, default `true`. Supports `${data.enabled}`
- `helper-text`: String, helper text below input
- `min-chars`: Integer, minimum character length
- `max-chars`: Integer, maximum character length

**Input Types:**
- `text` - Plain text
- `number` - Numeric keyboard
- `email` - Email with validation
- `password` - Masked input
- `passcode` - Numeric PIN
- `phone` - Phone number format

**Example with Validation:**
```json
{
  "type": "TextInput",
  "name": "age",
  "label": "Age",
  "input-type": "number",
  "required": true,
  "min-chars": 1,
  "max-chars": 3
}
```

### TextArea

Multi-line text input for longer content.

```json
{
  "type": "TextArea",
  "name": "message",
  "label": "Your Message",
  "required": true,
  "max-length": 500,
  "helper-text": "Maximum 500 characters"
}
```

**Properties:**
- `type` (required): `"TextArea"`
- `name` (required): String, unique field identifier
- `label` (required): String, field label
- `required`: Boolean, default `false`
- `enabled`: Boolean, default `true`
- `max-length`: Integer, maximum character count
- `helper-text`: String

### DatePicker

Date selection component.

```json
{
  "type": "DatePicker",
  "name": "appointment_date",
  "label": "Preferred Date",
  "required": true,
  "min-date": "2025-01-01",
  "max-date": "2025-12-31"
}
```

**Properties:**
- `type` (required): `"DatePicker"`
- `name` (required): String, unique field identifier
- `label` (required): String, field label
- `required`: Boolean, default `false`
- `min-date`: String (ISO 8601 format: YYYY-MM-DD)
- `max-date`: String (ISO 8601 format: YYYY-MM-DD)
- `unavailable-dates`: Array of strings, dates to disable
- `helper-text`: String

**Example with Unavailable Dates:**
```json
{
  "type": "DatePicker",
  "name": "date",
  "label": "Select Date",
  "unavailable-dates": ["2025-01-01", "2025-12-25"]
}
```

---

## Interactive Components

Components for selecting options.

### Dropdown

Select one option from a list.

```json
{
  "type": "Dropdown",
  "name": "service_type",
  "label": "Service Type",
  "required": true,
  "data-source": [
    {"id": "consultation", "title": "Consultation"},
    {"id": "checkup", "title": "Regular Check-up"},
    {"id": "emergency", "title": "Emergency"}
  ]
}
```

**Properties:**
- `type` (required): `"Dropdown"`
- `name` (required): String, unique field identifier
- `label` (required): String, field label
- `required`: Boolean, default `false`
- `enabled`: Boolean, default `true`
- `data-source` (required): Array of objects with `id` and `title`
- `on-select-action`: Action object (navigate/data_exchange)

**Dynamic Data Source:**
```json
{
  "type": "Dropdown",
  "name": "category",
  "label": "Select Category",
  "data-source": "${data.categories}"
}
```

The `data.categories` should be an array like:
```json
[
  {"id": "cat1", "title": "Category 1"},
  {"id": "cat2", "title": "Category 2"}
]
```

**With On-Select Action:**
```json
{
  "type": "Dropdown",
  "name": "location",
  "label": "Location",
  "data-source": "${data.locations}",
  "on-select-action": {
    "name": "data_exchange",
    "payload": {
      "selected_location": "${form.location}"
    }
  }
}
```

### RadioButtonsGroup

Select one option from radio buttons.

```json
{
  "type": "RadioButtonsGroup",
  "name": "payment_method",
  "label": "Payment Method",
  "required": true,
  "data-source": [
    {"id": "card", "title": "Credit Card"},
    {"id": "cash", "title": "Cash"},
    {"id": "online", "title": "Online Payment"}
  ]
}
```

**Properties:**
- `type` (required): `"RadioButtonsGroup"`
- `name` (required): String, unique field identifier
- `label` (required): String, field label
- `required`: Boolean, default `false`
- `enabled`: Boolean, default `true`
- `data-source` (required): Array of objects with `id` and `title`
- `on-select-action`: Action object

### CheckboxGroup

Select multiple options from checkboxes.

```json
{
  "type": "CheckboxGroup",
  "name": "services",
  "label": "Select Services",
  "required": true,
  "min-selected-items": 1,
  "max-selected-items": 3,
  "data-source": [
    {"id": "haircut", "title": "Haircut"},
    {"id": "shave", "title": "Shave"},
    {"id": "facial", "title": "Facial"}
  ]
}
```

**Properties:**
- `type` (required): `"CheckboxGroup"`
- `name` (required): String, unique field identifier
- `label` (required): String, field label
- `required`: Boolean, default `false`
- `enabled`: Boolean, default `true`
- `data-source` (required): Array of objects with `id` and `title`
- `min-selected-items`: Integer, minimum selections required
- `max-selected-items`: Integer, maximum selections allowed
- `on-select-action`: Action object

---

## Footer Component

Footer component is **required** on every screen. It provides the primary action button.

### Navigate Footer

Navigate to another screen.

```json
{
  "type": "Footer",
  "label": "Next",
  "on-click-action": {
    "name": "navigate",
    "next": {
      "type": "screen",
      "name": "CONFIRMATION"
    },
    "payload": {
      "user_name": "${form.name}",
      "user_email": "${form.email}"
    }
  }
}
```

### Data Exchange Footer

Call endpoint for dynamic data.

```json
{
  "type": "Footer",
  "label": "Submit",
  "on-click-action": {
    "name": "data_exchange",
    "payload": {
      "form_data": "${form.name}",
      "form_email": "${form.email}"
    }
  }
}
```

### Complete Footer

Terminate the flow and return data.

```json
{
  "type": "Footer",
  "label": "Done",
  "on-click-action": {
    "name": "complete",
    "payload": {
      "booking_id": "${data.booking_id}",
      "status": "confirmed"
    }
  }
}
```

**Properties:**
- `type` (required): `"Footer"`
- `label` (required): String, button text (max 20 characters)
- `on-click-action` (required): Action object (navigate/data_exchange/complete)
- `enabled`: Boolean, default `true`. Supports `${data.enabled}`

---

## Component Limits

### Character Limits

| Component | Property | Limit |
|-----------|----------|-------|
| TextHeading | text | 80 characters |
| TextSubheading | text | 80 characters |
| TextBody | text | 4096 characters |
| TextCaption | text | 4096 characters |
| TextInput | label | 255 characters |
| TextArea | max-length | 65535 characters |
| Footer | label | 20 characters |

### General Limits

- **Max components per screen**: 50
- **Max screens per flow**: No hard limit, but recommended < 10 for UX
- **Dropdown/Radio/Checkbox data-source**: Max 200 items
- **CheckboxGroup max selections**: 200 items

### Validation Rules

1. **Empty values not accepted**: Text components must have non-empty text
2. **Unique field names**: All input components must have unique `name` attributes per screen
3. **Footer required**: Every screen must have exactly one Footer component
4. **Data source format**: Must be array of objects with `id` and `title` keys

---

## Best Practices

1. **Use appropriate input types**: Use `email` for emails, `number` for numbers to get proper keyboard
2. **Add helper text**: Provide context with `helper-text` for clarity
3. **Limit choices**: Keep dropdown/radio options under 10 for better UX
4. **Validate early**: Use `required` and `min-chars`/`max-chars` for client-side validation
5. **Group related fields**: Use logical screen grouping, don't cram too many fields
6. **Dynamic data**: Use `${data.variable}` for dynamic content from endpoints
7. **Consistent labels**: Use clear, concise labels under 20 characters

---

**Last Updated**: 2025-11-27
**Document Version**: 1.0
**Related**: See [06-whatsapp-flow-actions.md](./06-whatsapp-flow-actions.md) for action definitions
