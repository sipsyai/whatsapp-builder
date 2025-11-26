# WhatsApp Flow API - Quick Reference

Fast reference guide for the most common Flow API operations.

## Base URL

```
http://localhost:3000/api/flows
```

---

## Quick Command Reference

### 1. List All Flows

```bash
curl http://localhost:3000/api/flows | jq
```

### 2. Get Active Flows Only

```bash
curl http://localhost:3000/api/flows/active | jq
```

### 3. Get Specific Flow

```bash
curl http://localhost:3000/api/flows/FLOW_UUID | jq
```

### 4. Create New Flow

```bash
curl -X POST http://localhost:3000/api/flows \
  -H "Content-Type: application/json" \
  -d @flow-data.json | jq
```

**flow-data.json:**
```json
{
  "name": "My Flow",
  "description": "Flow description",
  "categories": ["APPOINTMENT_BOOKING"],
  "flowJson": {
    "version": "3.0",
    "screens": [...]
  }
}
```

### 5. Update Flow

```bash
curl -X PUT http://localhost:3000/api/flows/FLOW_UUID \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}' | jq
```

### 6. Publish Flow

```bash
curl -X POST http://localhost:3000/api/flows/FLOW_UUID/publish | jq
```

### 7. Get Preview URL

```bash
curl http://localhost:3000/api/flows/FLOW_UUID/preview | jq -r '.previewUrl'
```

### 8. Delete Flow

```bash
curl -X DELETE http://localhost:3000/api/flows/FLOW_UUID
```

### 9. Sync from WhatsApp

```bash
curl -X POST http://localhost:3000/api/flows/sync | jq
```

---

## Minimal Flow JSON Examples

### Single Screen Contact Form

```json
{
  "version": "3.0",
  "screens": [
    {
      "id": "CONTACT",
      "terminal": true,
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Contact Us"
          },
          {
            "type": "TextInput",
            "name": "name",
            "label": "Name",
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
            "type": "TextArea",
            "name": "message",
            "label": "Message"
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

### Multi-Screen Appointment Booking

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
            "text": "Book Appointment"
          },
          {
            "type": "Footer",
            "label": "Start",
            "on-click-action": {
              "name": "navigate",
              "next": { "type": "screen", "name": "FORM" }
            }
          }
        ]
      }
    },
    {
      "id": "FORM",
      "terminal": true,
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextInput",
            "name": "name",
            "label": "Full Name",
            "required": true
          },
          {
            "type": "DatePicker",
            "name": "date",
            "label": "Date"
          },
          {
            "type": "RadioButtonsGroup",
            "name": "time",
            "label": "Time Slot",
            "data-source": [
              { "id": "morning", "title": "9 AM - 12 PM" },
              { "id": "afternoon", "title": "1 PM - 5 PM" }
            ]
          },
          {
            "type": "Footer",
            "label": "Book",
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

## Common Component Templates

### Text Input

```json
{
  "type": "TextInput",
  "name": "field_name",
  "label": "Label Text",
  "input-type": "text",
  "required": true,
  "min-chars": "2",
  "max-chars": "50",
  "helper-text": "Helper text"
}
```

**Input Types:** `text`, `number`, `email`, `password`, `passcode`, `phone`

---

### Dropdown Selection

```json
{
  "type": "Dropdown",
  "label": "Select Option",
  "required": true,
  "data-source": [
    { "id": "opt1", "title": "Option 1" },
    { "id": "opt2", "title": "Option 2" },
    { "id": "opt3", "title": "Option 3" }
  ]
}
```

---

### Date Picker

```json
{
  "type": "DatePicker",
  "name": "selected_date",
  "label": "Choose Date",
  "min-date": "2025-01-15",
  "max-date": "2025-12-31",
  "unavailable-dates": ["2025-01-20"]
}
```

---

### Checkbox Group

```json
{
  "type": "CheckboxGroup",
  "name": "preferences",
  "label": "Select Preferences",
  "min-selected-items": 1,
  "max-selected-items": 3,
  "data-source": [
    { "id": "pref1", "title": "Preference 1" },
    { "id": "pref2", "title": "Preference 2" }
  ]
}
```

---

### Footer (Required on terminal screen)

```json
{
  "type": "Footer",
  "label": "Submit",
  "on-click-action": {
    "name": "complete"
  }
}
```

---

## Common Actions

### Navigate to Another Screen

```json
{
  "name": "navigate",
  "next": {
    "type": "screen",
    "name": "TARGET_SCREEN_ID"
  }
}
```

### Complete Flow

```json
{
  "name": "complete",
  "payload": {
    "status": "success"
  }
}
```

### Open URL

```json
{
  "name": "open_url",
  "payload": {
    "url": "https://example.com"
  }
}
```

### Data Exchange (Dynamic Data)

```json
{
  "name": "data_exchange",
  "payload": {
    "action": "fetch_data"
  }
}
```

---

## Flow Categories

Use one or more:

- `SIGN_UP`
- `SIGN_IN`
- `APPOINTMENT_BOOKING`
- `LEAD_GENERATION`
- `CONTACT_US`
- `CUSTOMER_SUPPORT`
- `SURVEY`
- `OTHER`

**Example:**
```json
{
  "categories": ["APPOINTMENT_BOOKING", "CUSTOMER_SUPPORT"]
}
```

---

## Flow Status

- **DRAFT** - Editable, not published
- **PUBLISHED** - Live, immutable
- **DEPRECATED** - Marked for deletion
- **THROTTLED** - Rate limited (auto from WhatsApp)
- **BLOCKED** - Policy violation (auto from WhatsApp)

---

## Complete Workflow Example

### Create, Publish, and Test

```bash
#!/bin/bash

# 1. Create flow
FLOW_RESPONSE=$(curl -s -X POST http://localhost:3000/api/flows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Flow",
    "categories": ["CONTACT_US"],
    "flowJson": {
      "version": "3.0",
      "screens": [
        {
          "id": "MAIN",
          "terminal": true,
          "layout": {
            "type": "SingleColumnLayout",
            "children": [
              {
                "type": "TextHeading",
                "text": "Hello World"
              },
              {
                "type": "TextInput",
                "name": "name",
                "label": "Your Name",
                "required": true
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
  }')

FLOW_ID=$(echo $FLOW_RESPONSE | jq -r '.id')
echo "Created flow: $FLOW_ID"

# 2. Publish flow
echo "Publishing flow..."
curl -s -X POST http://localhost:3000/api/flows/$FLOW_ID/publish | jq

# 3. Get preview URL
echo "Getting preview URL..."
PREVIEW_URL=$(curl -s http://localhost:3000/api/flows/$FLOW_ID/preview | jq -r '.previewUrl')
echo "Preview URL: $PREVIEW_URL"

# 4. Show flow details
echo "Flow details:"
curl -s http://localhost:3000/api/flows/$FLOW_ID | jq '{
  id,
  name,
  status,
  categories,
  previewUrl,
  isActive
}'
```

---

## Error Handling

### Common Errors

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Flow {id} not found",
  "error": "Not Found"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "WhatsApp API error: ...",
  "error": "Internal Server Error"
}
```

---

## Character Limits

| Field | Limit |
|-------|-------|
| TextHeading.text | 80 |
| TextBody.text | 4096 |
| TextInput.label | 50 |
| TextInput.max-chars | 200 |
| TextArea.max-length | 1000 |
| Footer.label | 20 |
| DataSource.title | 30 |
| DataSource.description | 120 |

---

## Testing Checklist

- [ ] Flow JSON validates successfully
- [ ] All required fields are present
- [ ] Terminal screen has Footer component
- [ ] Character limits respected
- [ ] Navigation logic is correct
- [ ] Flow publishes without errors
- [ ] Preview URL works in WhatsApp
- [ ] All input fields work as expected
- [ ] Submit action completes flow
- [ ] Data is captured correctly

---

## Useful jq Queries

### List flow names and statuses
```bash
curl -s http://localhost:3000/api/flows | jq '.[] | {name, status, isActive}'
```

### Get only published flows
```bash
curl -s http://localhost:3000/api/flows | jq '.[] | select(.status == "PUBLISHED")'
```

### Extract flow IDs
```bash
curl -s http://localhost:3000/api/flows | jq -r '.[].id'
```

### Count flows by status
```bash
curl -s http://localhost:3000/api/flows | jq 'group_by(.status) | map({status: .[0].status, count: length})'
```

---

## Environment Variables

Required for Flow API to work:

```env
# WhatsApp Business Account ID
WABA_ID=your_waba_id

# WhatsApp Access Token
WHATSAPP_ACCESS_TOKEN=your_access_token

# Phone Number ID
PHONE_NUMBER_ID=your_phone_number_id

# Optional: Default Flow Endpoint URL
FLOW_ENDPOINT_URL=https://api.example.com/flow-endpoint
```

---

## Related Files

- **Controller:** `backend/src/modules/flows/flows.controller.ts`
- **Service:** `backend/src/modules/flows/flows.service.ts`
- **Entity:** `backend/src/entities/whatsapp-flow.entity.ts`
- **DTOs:** `backend/src/modules/flows/dto/`
- **Frontend API:** `frontend/src/features/flows/api/index.ts`
- **Type Definitions:** `frontend/src/features/flow-builder/types/flow-json.types.ts`

---

## Quick Tips

1. **Always validate Flow JSON** before creating
2. **Test with preview URL** before production
3. **Republish after every update** (status goes to DRAFT)
4. **Use sync endpoint** to import existing flows
5. **Set isActive=false** for flows in development
6. **Use descriptive screen IDs** (UPPERCASE_SNAKE_CASE)
7. **Keep flows under 100KB** for best performance
8. **Mark end screens as terminal=true**
9. **Footer component is required** on terminal screens
10. **Use appropriate categories** for discoverability

---

## Need More Help?

- **Full Guide:** `docs/WHATSAPP_FLOW_API_GUIDE.md`
- **Flow JSON Spec:** `frontend/src/features/flow-builder/types/flow-json.types.ts`
- **WhatsApp Flows Expert:** `.claude/skills/whatsapp-flows-expert/`
- **Project Architecture:** `.claude/skills/project-architect/reference/11-flow-builder-feature.md`
