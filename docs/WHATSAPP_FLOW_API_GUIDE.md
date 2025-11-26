# WhatsApp Flow API - Complete Developer Guide

This comprehensive guide documents the WhatsApp Flow API implementation in the whatsapp-builder project, including all endpoints, DTOs, Flow JSON structure, and practical examples.

## Table of Contents

1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [Data Transfer Objects (DTOs)](#data-transfer-objects-dtos)
4. [Entity Structure](#entity-structure)
5. [Flow JSON Structure](#flow-json-structure)
6. [API Usage Examples](#api-usage-examples)
7. [Flow Categories](#flow-categories)
8. [Flow Status Lifecycle](#flow-status-lifecycle)
9. [Frontend Integration](#frontend-integration)
10. [Best Practices](#best-practices)

---

## Overview

The WhatsApp Flow API allows you to create, manage, and publish interactive WhatsApp Flows - multi-screen form experiences that run natively inside WhatsApp. The API handles both local database storage and synchronization with Meta's WhatsApp Business API.

**Base URL:** `http://localhost:3000/api/flows`

**Key Features:**
- Create and manage WhatsApp Flows
- Publish/deprecate flows to WhatsApp API
- Get preview URLs for testing
- Sync flows from Meta API
- Full CRUD operations with validation

---

## API Endpoints

### 1. Get All Flows

Retrieves all WhatsApp Flows from the local database.

**Endpoint:** `GET /api/flows`

**Response:**
```json
[
  {
    "id": "uuid",
    "whatsappFlowId": "123456789",
    "name": "Appointment Booking",
    "description": "Book your appointment",
    "status": "PUBLISHED",
    "categories": ["APPOINTMENT_BOOKING"],
    "flowJson": { "version": "3.0", "screens": [...] },
    "endpointUri": "https://api.example.com/flow-endpoint",
    "previewUrl": "https://wa.me/...",
    "isActive": true,
    "metadata": {},
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  }
]
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/flows
```

---

### 2. Get Active Flows

Retrieves only active and published flows (used for ChatBot node selection).

**Endpoint:** `GET /api/flows/active`

**Query Filters:**
- `status = 'PUBLISHED'`
- `isActive = true`

**Response:** Same structure as Get All Flows, but filtered.

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/flows/active
```

---

### 3. Get Flow by ID

Retrieves a specific flow by its UUID.

**Endpoint:** `GET /api/flows/:id`

**Path Parameters:**
- `id` (string, required) - Flow UUID

**Response:** Single flow object

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/flows/550e8400-e29b-41d4-a716-446655440000
```

**Error Responses:**
- `404 Not Found` - Flow does not exist

---

### 4. Create Flow

Creates a new WhatsApp Flow and publishes it to the WhatsApp API.

**Endpoint:** `POST /api/flows`

**Request Body (CreateFlowDto):**
```json
{
  "name": "Appointment Booking Flow",
  "description": "Book appointments easily",
  "categories": ["APPOINTMENT_BOOKING"],
  "flowJson": {
    "version": "3.0",
    "screens": [
      {
        "id": "WELCOME",
        "title": "Welcome",
        "layout": {
          "type": "SingleColumnLayout",
          "children": [
            {
              "type": "TextHeading",
              "text": "Book Your Appointment"
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
        "title": "Appointment Form",
        "terminal": true,
        "layout": {
          "type": "SingleColumnLayout",
          "children": [
            {
              "type": "TextInput",
              "name": "full_name",
              "label": "Full Name",
              "required": true
            },
            {
              "type": "DatePicker",
              "name": "appointment_date",
              "label": "Select Date"
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
  },
  "endpointUri": "https://api.example.com/flow-endpoint"
}
```

**Response:**
```json
{
  "id": "uuid",
  "whatsappFlowId": "123456789",
  "name": "Appointment Booking Flow",
  "status": "DRAFT",
  "categories": ["APPOINTMENT_BOOKING"],
  "flowJson": { ... },
  "endpointUri": "https://api.example.com/flow-endpoint",
  "isActive": true,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/flows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Appointment Booking Flow",
    "description": "Book appointments easily",
    "categories": ["APPOINTMENT_BOOKING"],
    "flowJson": {
      "version": "3.0",
      "screens": [...]
    },
    "endpointUri": "https://api.example.com/flow-endpoint"
  }'
```

**Error Responses:**
- `400 Bad Request` - Invalid input data (validation errors)
- `500 Internal Server Error` - WhatsApp API error

---

### 5. Update Flow

Updates an existing flow. After updating, the flow status reverts to DRAFT.

**Endpoint:** `PUT /api/flows/:id`

**Path Parameters:**
- `id` (string, required) - Flow UUID

**Request Body (UpdateFlowDto):**
```json
{
  "name": "Updated Flow Name",
  "description": "Updated description",
  "categories": ["LEAD_GENERATION"],
  "flowJson": {
    "version": "3.0",
    "screens": [...]
  },
  "endpointUri": "https://api.example.com/new-endpoint",
  "isActive": false
}
```

**Note:** All fields are optional. Only provided fields will be updated.

**Response:** Updated flow object

**cURL Example:**
```bash
curl -X PUT http://localhost:3000/api/flows/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Flow Name",
    "isActive": true
  }'
```

**Behavior:**
- If flow has `whatsappFlowId`, updates both local DB and WhatsApp API
- After WhatsApp API update, status changes to `DRAFT`
- You must republish after updating

**Error Responses:**
- `404 Not Found` - Flow does not exist
- `400 Bad Request` - Invalid update data

---

### 6. Publish Flow

Publishes a draft flow to WhatsApp, making it available for use.

**Endpoint:** `POST /api/flows/:id/publish`

**Path Parameters:**
- `id` (string, required) - Flow UUID

**Response:**
```json
{
  "id": "uuid",
  "whatsappFlowId": "123456789",
  "status": "PUBLISHED",
  "previewUrl": "https://wa.me/...",
  ...
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/flows/550e8400-e29b-41d4-a716-446655440000/publish
```

**Behavior:**
1. Calls WhatsApp API to publish the flow
2. Updates local status to `PUBLISHED`
3. Fetches and stores preview URL

**Error Responses:**
- `404 Not Found` - Flow does not exist
- `400 Bad Request` - Flow has validation errors or cannot be published
- `500 Internal Server Error` - WhatsApp API error

---

### 7. Get Flow Preview URL

Retrieves a preview URL to test the flow in WhatsApp.

**Endpoint:** `GET /api/flows/:id/preview`

**Path Parameters:**
- `id` (string, required) - Flow UUID

**Query Parameters:**
- `invalidate` (boolean, optional) - Set to `true` to invalidate cached preview URL

**Response:**
```json
{
  "previewUrl": "https://wa.me/qr/..."
}
```

**cURL Example:**
```bash
# Get cached preview URL
curl -X GET http://localhost:3000/api/flows/550e8400-e29b-41d4-a716-446655440000/preview

# Get new preview URL (invalidate cache)
curl -X GET "http://localhost:3000/api/flows/550e8400-e29b-41d4-a716-446655440000/preview?invalidate=true"
```

**Error Responses:**
- `404 Not Found` - Flow does not exist
- `400 Bad Request` - Flow has not been published yet

---

### 8. Delete Flow

Deletes a flow. If published, it will be deprecated first, then deleted.

**Endpoint:** `DELETE /api/flows/:id`

**Path Parameters:**
- `id` (string, required) - Flow UUID

**Response:** `204 No Content` (empty body)

**cURL Example:**
```bash
curl -X DELETE http://localhost:3000/api/flows/550e8400-e29b-41d4-a716-446655440000
```

**Behavior:**
1. If `status = 'PUBLISHED'`, deprecates the flow first
2. Deletes from WhatsApp API
3. Deletes from local database

**Error Responses:**
- `404 Not Found` - Flow does not exist

---

### 9. Sync Flows from Meta

Fetches all flows from WhatsApp Business Account and syncs with local database.

**Endpoint:** `POST /api/flows/sync`

**Response:**
```json
{
  "created": 5,
  "updated": 3,
  "unchanged": 2,
  "total": 10,
  "flows": [...]
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/flows/sync
```

**Behavior:**
1. Fetches all flows from Meta/Facebook API
2. For each flow:
   - If exists locally: checks for updates
   - If new: creates local record
   - Downloads flow JSON content
3. Returns sync statistics

**Use Cases:**
- Initial setup (import existing flows)
- Recovery after database loss
- Sync changes made in WhatsApp Manager

**Error Responses:**
- `500 Internal Server Error` - Meta API connection error

---

## Data Transfer Objects (DTOs)

### CreateFlowDto

**File:** `backend/src/modules/flows/dto/create-flow.dto.ts`

```typescript
{
  name: string;                      // Required, max 255 chars
  description?: string;              // Optional
  categories: WhatsAppFlowCategory[]; // Required, array of enum values
  flowJson: any;                     // Required, Flow JSON object
  endpointUri?: string;              // Optional, max 500 chars
}
```

**Validation:**
- `name`: Required, non-empty string
- `categories`: Required, array of valid enum values
- `flowJson`: Required, object
- `endpointUri`: Optional, valid URL string

**Example:**
```json
{
  "name": "Lead Generation Form",
  "description": "Capture lead information",
  "categories": ["LEAD_GENERATION"],
  "flowJson": { "version": "3.0", "screens": [...] },
  "endpointUri": "https://api.example.com/leads"
}
```

---

### UpdateFlowDto

**File:** `backend/src/modules/flows/dto/update-flow.dto.ts`

```typescript
{
  name?: string;                     // Optional
  description?: string;              // Optional
  categories?: WhatsAppFlowCategory[]; // Optional
  flowJson?: any;                    // Optional
  endpointUri?: string;              // Optional
  isActive?: boolean;                // Optional
}
```

**Note:** All fields are optional. Only provide fields you want to update.

**Example:**
```json
{
  "name": "Updated Form Name",
  "isActive": true
}
```

---

## Entity Structure

### WhatsAppFlow Entity

**File:** `backend/src/entities/whatsapp-flow.entity.ts`

**Database Table:** `whatsapp_flows`

```typescript
{
  id: string;                        // UUID (primary key)
  whatsappFlowId?: string;           // Flow ID from WhatsApp API (unique)
  name: string;                      // Flow name (max 255 chars)
  description?: string;              // Optional description
  status: WhatsAppFlowStatus;        // Enum: DRAFT, PUBLISHED, DEPRECATED, THROTTLED, BLOCKED
  categories: WhatsAppFlowCategory[]; // Array of enum values (stored as JSONB)
  flowJson: any;                     // Complete Flow JSON (JSONB)
  endpointUri?: string;              // Optional endpoint URL (max 500 chars)
  previewUrl?: string;               // Preview URL from WhatsApp
  isActive: boolean;                 // Local active flag (default: true)
  metadata?: Record<string, any>;    // Additional metadata (JSONB)
  createdAt: Date;                   // Auto-generated
  updatedAt: Date;                   // Auto-updated
}
```

**Indexes:**
- Primary key: `id` (UUID)
- Unique: `whatsappFlowId`

---

## Flow JSON Structure

### Overview

WhatsApp Flow JSON defines the complete user experience with screens, components, and actions.

**Supported Versions:** `2.1`, `3.0`, `4.0`, `5.0`, `5.1`, `6.0`, `6.1`, `6.2`, `6.3`, `7.0`, `7.1`, `7.2`

**Current Recommended:** `3.0`

### Root Structure

```typescript
{
  version: "3.0",                    // Required
  data_api_version?: "3.0",          // Optional (if using data exchange)
  routing_model?: {...},             // Optional (auto-generated or custom)
  screens: [...]                     // Required (array of screens)
}
```

---

### Screen Structure

```typescript
{
  id: string;                        // Required, unique screen ID (uppercase recommended)
  title?: string;                    // Optional, screen title
  terminal?: boolean;                // Optional, marks end state (requires Footer)
  refresh_on_back?: boolean;         // Optional, v3.0+ feature
  data?: ScreenData;                 // Optional, dynamic data model
  layout: Layout;                    // Required, screen layout
}
```

**Example Screen:**
```json
{
  "id": "WELCOME",
  "title": "Welcome Screen",
  "terminal": false,
  "layout": {
    "type": "SingleColumnLayout",
    "children": [...]
  }
}
```

---

### Layout Types

Currently only one layout type is supported:

**SingleColumnLayout:**
```typescript
{
  type: "SingleColumnLayout";
  children: Component[];             // Array of components
}
```

---

### Components

#### Text Components

**TextHeading:**
```json
{
  "type": "TextHeading",
  "text": "Welcome to Our Service",
  "visible": true
}
```

**TextSubheading:**
```json
{
  "type": "TextSubheading",
  "text": "Please fill in your details"
}
```

**TextBody:**
```json
{
  "type": "TextBody",
  "text": "This is body text",
  "font-weight": "bold",
  "markdown": true
}
```

**TextCaption:**
```json
{
  "type": "TextCaption",
  "text": "Small caption text"
}
```

---

#### Input Components

**TextInput:**
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
  "init-value": "",
  "error-message": "Name is required"
}
```

**Input Types:**
- `text` - General text
- `number` - Numeric input
- `email` - Email address
- `password` - Password (masked)
- `passcode` - Short PIN code
- `phone` - Phone number

**TextArea:**
```json
{
  "type": "TextArea",
  "name": "comments",
  "label": "Additional Comments",
  "required": false,
  "max-length": "500",
  "helper-text": "Optional comments"
}
```

---

#### Selection Components

**CheckboxGroup:**
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
      "title": "Service 2"
    }
  ]
}
```

**RadioButtonsGroup:**
```json
{
  "type": "RadioButtonsGroup",
  "name": "payment_method",
  "label": "Payment Method",
  "required": true,
  "data-source": [
    { "id": "card", "title": "Credit Card" },
    { "id": "cash", "title": "Cash" }
  ]
}
```

**Dropdown:**
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

#### Date Components

**DatePicker:**
```json
{
  "type": "DatePicker",
  "name": "appointment_date",
  "label": "Appointment Date",
  "min-date": "2025-01-15",
  "max-date": "2025-12-31",
  "unavailable-dates": ["2025-01-20", "2025-02-14"],
  "helper-text": "Select your preferred date"
}
```

**CalendarPicker:**
```json
{
  "type": "CalendarPicker",
  "name": "booking_dates",
  "label": "Select Dates",
  "mode": "range",
  "min-date": "2025-01-15",
  "max-date": "2025-12-31",
  "include-days": ["Mon", "Tue", "Wed", "Thu", "Fri"],
  "min-days": 2,
  "max-days": 7
}
```

---

#### Action Components

**Footer (Required on terminal screens):**
```json
{
  "type": "Footer",
  "label": "Submit",
  "left-caption": "Optional left text",
  "center-caption": "Optional center text",
  "right-caption": "Optional right text",
  "enabled": true,
  "on-click-action": {
    "name": "complete"
  }
}
```

**OptIn (Checkbox with action):**
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

**EmbeddedLink:**
```json
{
  "type": "EmbeddedLink",
  "text": "Learn more",
  "on-click-action": {
    "name": "open_url",
    "payload": {
      "url": "https://example.com/info"
    }
  }
}
```

---

### Actions

**Navigate Action:**
```json
{
  "name": "navigate",
  "next": {
    "type": "screen",
    "name": "NEXT_SCREEN"
  },
  "payload": {
    "custom_data": "value"
  }
}
```

**Complete Action:**
```json
{
  "name": "complete",
  "payload": {
    "result": "success"
  }
}
```

**Data Exchange Action:**
```json
{
  "name": "data_exchange",
  "payload": {
    "data_to_send": "value"
  }
}
```

**Update Data Action:**
```json
{
  "name": "update_data",
  "payload": {
    "field_name": "new_value"
  }
}
```

**Open URL Action:**
```json
{
  "name": "open_url",
  "payload": {
    "url": "https://example.com"
  }
}
```

---

### Complete Flow JSON Example

```json
{
  "version": "3.0",
  "screens": [
    {
      "id": "WELCOME",
      "title": "Welcome",
      "terminal": false,
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Appointment Booking"
          },
          {
            "type": "TextBody",
            "text": "Book your appointment in just a few steps"
          },
          {
            "type": "Footer",
            "label": "Start",
            "on-click-action": {
              "name": "navigate",
              "next": {
                "type": "screen",
                "name": "DETAILS"
              }
            }
          }
        ]
      }
    },
    {
      "id": "DETAILS",
      "title": "Your Details",
      "terminal": false,
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextSubheading",
            "text": "Personal Information"
          },
          {
            "type": "TextInput",
            "name": "full_name",
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
            "type": "TextInput",
            "name": "phone",
            "label": "Phone Number",
            "input-type": "phone",
            "required": true
          },
          {
            "type": "Footer",
            "label": "Next",
            "on-click-action": {
              "name": "navigate",
              "next": {
                "type": "screen",
                "name": "APPOINTMENT"
              }
            }
          }
        ]
      }
    },
    {
      "id": "APPOINTMENT",
      "title": "Select Appointment",
      "terminal": true,
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "DatePicker",
            "name": "appointment_date",
            "label": "Select Date",
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

## API Usage Examples

### Example 1: Create and Publish a Simple Flow

```bash
# Step 1: Create the flow
FLOW_ID=$(curl -s -X POST http://localhost:3000/api/flows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Contact Form",
    "description": "Simple contact form",
    "categories": ["CONTACT_US"],
    "flowJson": {
      "version": "3.0",
      "screens": [
        {
          "id": "CONTACT",
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
                "type": "TextInput",
                "name": "name",
                "label": "Your Name",
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
                "label": "Message",
                "required": true,
                "max-length": "500"
              },
              {
                "type": "Footer",
                "label": "Send",
                "on-click-action": {
                  "name": "complete"
                }
              }
            ]
          }
        }
      ]
    }
  }' | jq -r '.id')

echo "Created flow: $FLOW_ID"

# Step 2: Publish the flow
curl -X POST http://localhost:3000/api/flows/$FLOW_ID/publish

# Step 3: Get preview URL
curl -X GET http://localhost:3000/api/flows/$FLOW_ID/preview
```

---

### Example 2: Update an Existing Flow

```bash
FLOW_ID="550e8400-e29b-41d4-a716-446655440000"

# Update flow name and description
curl -X PUT http://localhost:3000/api/flows/$FLOW_ID \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Contact Form",
    "description": "Enhanced contact form with validation"
  }'

# Republish after update
curl -X POST http://localhost:3000/api/flows/$FLOW_ID/publish
```

---

### Example 3: Sync Flows from Meta

```bash
# Sync all flows from WhatsApp Business Account
curl -X POST http://localhost:3000/api/flows/sync | jq

# Output:
# {
#   "created": 3,
#   "updated": 1,
#   "unchanged": 2,
#   "total": 6,
#   "flows": [...]
# }
```

---

### Example 4: Get Active Flows for Chatbot

```bash
# Get only published and active flows
curl -X GET http://localhost:3000/api/flows/active | jq
```

---

### Example 5: Delete a Flow

```bash
FLOW_ID="550e8400-e29b-41d4-a716-446655440000"

# Delete flow (will deprecate if published)
curl -X DELETE http://localhost:3000/api/flows/$FLOW_ID
```

---

## Flow Categories

**Enum:** `WhatsAppFlowCategory`

**Available Categories:**
- `SIGN_UP` - User registration
- `SIGN_IN` - User login
- `APPOINTMENT_BOOKING` - Schedule appointments
- `LEAD_GENERATION` - Capture leads
- `CONTACT_US` - Contact forms
- `CUSTOMER_SUPPORT` - Support requests
- `SURVEY` - Surveys and feedback
- `OTHER` - General purpose

**Usage in DTO:**
```json
{
  "categories": ["APPOINTMENT_BOOKING", "LEAD_GENERATION"]
}
```

---

## Flow Status Lifecycle

**Enum:** `WhatsAppFlowStatus`

```
DRAFT → PUBLISHED → DEPRECATED
         ↑            ↓
         └─ (update) ─┘
```

**Status Values:**

1. **DRAFT** - Initial state, not yet published
   - Editable
   - Not visible to users
   - Cannot be used in messages

2. **PUBLISHED** - Live and available
   - Active in WhatsApp
   - Can be sent to users
   - Immutable (requires new version for changes)

3. **DEPRECATED** - Marked for removal
   - Required step before deletion
   - No longer available for new messages
   - Existing instances still work

4. **THROTTLED** - Rate limited by WhatsApp
   - Automatic status from WhatsApp API
   - Indicates performance issues

5. **BLOCKED** - Blocked by WhatsApp
   - Automatic status from WhatsApp API
   - Indicates policy violations

**Lifecycle Operations:**

```typescript
// Create flow -> status = DRAFT
POST /api/flows

// Publish flow -> status = PUBLISHED
POST /api/flows/:id/publish

// Update published flow -> status = DRAFT (requires republish)
PUT /api/flows/:id

// Delete published flow:
//   1. Backend automatically deprecates -> status = DEPRECATED
//   2. Then deletes from WhatsApp and database
DELETE /api/flows/:id
```

---

## Frontend Integration

### Frontend API Client

**File:** `frontend/src/features/flows/api/index.ts`

```typescript
import { flowsApi } from '@/features/flows/api';

// Get all flows
const flows = await flowsApi.getAll();

// Get active flows
const activeFlows = await flowsApi.getActive();

// Get flow by ID
const flow = await flowsApi.getById(flowId);

// Create flow
const newFlow = await flowsApi.create({
  name: "My Flow",
  categories: ["APPOINTMENT_BOOKING"],
  flowJson: { version: "3.0", screens: [...] }
});

// Update flow
const updated = await flowsApi.update(flowId, {
  name: "Updated Name"
});

// Publish flow
const published = await flowsApi.publish(flowId);

// Get preview URL
const previewUrl = await flowsApi.getPreview(flowId);

// Delete flow
await flowsApi.delete(flowId);

// Sync from Meta
const syncResult = await flowsApi.syncFromMeta();
```

---

### React Example Component

```typescript
import { useState, useEffect } from 'react';
import { flowsApi, WhatsAppFlow } from '@/features/flows/api';

export function FlowsList() {
  const [flows, setFlows] = useState<WhatsAppFlow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFlows() {
      try {
        const data = await flowsApi.getAll();
        setFlows(data);
      } catch (error) {
        console.error('Failed to load flows:', error);
      } finally {
        setLoading(false);
      }
    }
    loadFlows();
  }, []);

  async function handlePublish(flowId: string) {
    try {
      const published = await flowsApi.publish(flowId);
      setFlows(flows.map(f => f.id === flowId ? published : f));
      alert('Flow published successfully!');
    } catch (error) {
      alert('Failed to publish flow');
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>WhatsApp Flows</h1>
      {flows.map(flow => (
        <div key={flow.id}>
          <h3>{flow.name}</h3>
          <p>Status: {flow.status}</p>
          {flow.status === 'DRAFT' && (
            <button onClick={() => handlePublish(flow.id)}>
              Publish
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Best Practices

### 1. Flow Creation

- Always validate Flow JSON before creating
- Use descriptive screen IDs (UPPERCASE_SNAKE_CASE)
- Include terminal screens with Footer components
- Set appropriate categories for discoverability

### 2. Flow Updates

- Remember: updating a published flow changes status to DRAFT
- Always republish after updates
- Test preview URL before going live
- Consider creating a new flow version instead of updating production flows

### 3. Flow JSON Structure

- Use Flow JSON version `3.0` for best compatibility
- Keep screen count reasonable (max 10 screens recommended)
- Use data exchange actions for dynamic content
- Validate all required fields
- Set appropriate character limits

### 4. Component Limits

**Per Screen:**
- Maximum 50 components
- Maximum 10 data source items in selection components
- TextInput max-chars: 200
- TextArea max-length: 1000

**Character Limits:**
- TextHeading: 80 chars
- TextBody: 4096 chars
- Button label: 20 chars
- DataSource title: 30 chars

### 5. Error Handling

```typescript
try {
  await flowsApi.create(flowData);
} catch (error) {
  if (error.response?.status === 400) {
    // Validation error
    console.error('Invalid flow data:', error.response.data);
  } else if (error.response?.status === 500) {
    // WhatsApp API error
    console.error('WhatsApp API error:', error.message);
  }
}
```

### 6. Testing Flows

1. Create flow as DRAFT
2. Publish to get preview URL
3. Test preview URL in WhatsApp
4. Verify all actions and navigation
5. Test data submission
6. Only then mark as active for production

### 7. Sync Strategy

- Run sync on initial setup
- Schedule periodic syncs (daily/weekly)
- Sync after manual changes in WhatsApp Manager
- Handle conflicts: Meta API is source of truth

### 8. Performance

- Minimize Flow JSON size (target < 100KB)
- Use data exchange for dynamic lists
- Lazy load component data when possible
- Cache preview URLs

---

## Related Documentation

- **WhatsApp Flows Expert Skill:** `.claude/skills/whatsapp-flows-expert/SKILL.md`
- **Flow Builder Feature:** `.claude/skills/project-architect/reference/11-flow-builder-feature.md`
- **Flow JSON Types:** `frontend/src/features/flow-builder/types/flow-json.types.ts`
- **WhatsApp Integration:** `.claude/skills/project-architect/reference/06-whatsapp-integration.md`

---

## Summary

The WhatsApp Flow API provides comprehensive control over WhatsApp Flows with:

- **9 REST endpoints** for full CRUD operations
- **2 DTOs** (CreateFlowDto, UpdateFlowDto) with validation
- **Complete Flow JSON v3.0 support** with TypeScript types
- **Automatic sync** with WhatsApp Business API
- **Frontend integration** via React API client
- **Lifecycle management** (DRAFT → PUBLISHED → DEPRECATED)

**Quick Start:**
1. Create flow: `POST /api/flows`
2. Publish: `POST /api/flows/:id/publish`
3. Get preview: `GET /api/flows/:id/preview`
4. Test in WhatsApp
5. Use in chatbot: Reference via `whatsappFlowId`

For detailed Flow JSON structure and component documentation, see the WhatsApp Flows Expert skill documentation.
