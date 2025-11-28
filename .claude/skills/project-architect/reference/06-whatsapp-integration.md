# WhatsApp Integration - WhatsApp Builder

## Overview

WhatsApp Business API v18.0 integration for sending/receiving messages and managing Flows.

### Capabilities
- Send text, interactive (buttons/lists), Flow messages
- Receive messages via webhooks
- Message status tracking (sent → delivered → read)
- 24-hour messaging window management
- WhatsApp Flows lifecycle (create, publish, deprecate, delete)

### API Endpoints
- **Messages**: `https://graph.facebook.com/v18.0/{phone_number_id}/messages`
- **Flows**: `https://graph.facebook.com/v18.0/{business_account_id}/flows`
- **Media**: `https://graph.facebook.com/v18.0/{phone_number_id}/media`

---

## Configuration

### WhatsAppConfig Entity
**File**: `/backend/src/entities/whatsapp-config.entity.ts`

**Fields**:
- `phoneNumberId` - WhatsApp phone number ID
- `businessAccountId` - Business account ID
- `accessToken` - Graph API access token
- `webhookVerifyToken` - Webhook verification token
- `appSecret` - For signature verification (HMAC SHA256)
- `isActive` - Only one config active (partial unique index)

### Environment Variables
```bash
WHATSAPP_PHONE_NUMBER_ID=xxx
WHATSAPP_ACCESS_TOKEN=xxx
WHATSAPP_WEBHOOK_VERIFY_TOKEN=xxx
WHATSAPP_APP_SECRET=xxx
```

---

## Message Types

### 1. Text Messages
**Service**: `TextMessageService`
**File**: `/backend/src/modules/whatsapp/services/message-types/text-message.service.ts`

**Payload**:
```typescript
{
  messaging_product: "whatsapp",
  to: "1234567890",  // No + prefix
  type: "text",
  text: { body: "Hello", preview_url: false }
}
```

### 2. Interactive Button Messages
**Service**: `InteractiveMessageService`

**Limits**:
- Max 3 buttons
- Button title: max 20 characters
- Button ID: max 256 characters

**Payload**:
```typescript
{
  messaging_product: "whatsapp",
  to: "1234567890",
  type: "interactive",
  interactive: {
    type: "button",
    body: { text: "Choose an option" },
    action: {
      buttons: [
        { type: "reply", reply: { id: "btn_0", title: "Option 1" } }
      ]
    }
  }
}
```

### 3. Interactive List Messages
**Limits**:
- Max 10 sections
- Max 10 rows per section
- Section title: max 24 chars
- Row title: max 24 chars
- Row description: max 72 chars

**Payload**:
```typescript
{
  type: "interactive",
  interactive: {
    type: "list",
    body: { text: "Select an option" },
    action: {
      button: "View Options",
      sections: [{
        title: "Section 1",
        rows: [{ id: "row_0", title: "Row 1", description: "..." }]
      }]
    }
  }
}
```

### 4. WhatsApp Flow Messages
**Service**: `InteractiveMessageService.sendFlowMessage()`

**Payload**:
```typescript
{
  type: "interactive",
  interactive: {
    type: "flow",
    header: { type: "text", text: "Book Appointment" },
    body: { text: "Fill the form" },
    footer: { text: "Powered by ChatBot" },
    action: {
      name: "flow",
      parameters: {
        flow_message_version: "3",
        flow_token: "{contextId}-{nodeId}",  // For tracking
        flow_id: "123456789",  // WhatsApp Flow ID
        flow_cta: "Book Now",
        flow_action: "navigate",  // or "data_exchange"
        mode: "published"  // or "draft"
      }
    }
  }
}
```

**Flow Response**: Received via webhook when user completes Flow

---

## WhatsApp Flows API

### Flow Lifecycle
```
Create (DRAFT) → Publish (PUBLISHED) → Deprecate (DEPRECATED) → Delete
```

### FlowsService Methods
**File**: `/backend/src/modules/flows/flows.service.ts`

- `create(dto)`: Create Flow on WhatsApp
- `createFromPlayground(dto)`: **NEW** - Create Flow from Playground JSON with auto-validation
- `update(id, dto)`: Update Flow (resets to DRAFT)
- `publish(id)`: Publish Flow (PUBLISHED status)
- `delete(id)`: Smart deletion (deprecates if PUBLISHED first)
- `getPreview(id)`: Get preview URL for testing
- `syncFromMeta()`: Import flows from Meta API
- `validateFlowJson(dto)`: **NEW** - Smart validation with deep equality check

**validateFlowJson Method Details**:
This method intelligently validates Flow JSON with Meta API while avoiding unnecessary updates:

**Validation Process**:
1. **With Existing Flow** (flowId provided):
   - Fetches current flow details from Meta API
   - Downloads existing flow_json from Meta CDN
   - Performs deep equality comparison (ignores key ordering)
   - If JSON unchanged: Skips update, returns existing validation_errors
   - If JSON changed: Updates via assets endpoint, returns new validation_errors

2. **Without Existing Flow** (no flowId):
   - Creates temporary flow on Meta API
   - Uploads flow_json via assets endpoint
   - Gets validation_errors from Meta
   - Deletes temporary flow
   - Returns validation results

**Deep Equality Comparison**:
- Uses custom `deepEqual()` helper function
- Ignores key ordering in objects
- Recursively compares nested structures
- Prevents unnecessary API calls when JSON is semantically identical

**Response Format**:
```typescript
interface FlowValidationResult {
  isValid: boolean;
  validationErrors: ValidationError[];
  flowId?: string;
  message?: string;
}
```

**Example**:
```typescript
// Validate with existing flow (efficient)
const result = await flowsService.validateFlowJson({
  flowJson: myFlowJson,
  flowId: 'existing-flow-id',
  name: 'My Flow'
});

// Validate without existing flow (creates temp flow)
const result = await flowsService.validateFlowJson({
  flowJson: myFlowJson,
  name: 'My Flow'
});
```

### WhatsAppFlowService (API Client)
**File**: `/backend/src/modules/whatsapp/services/whatsapp-flow.service.ts`

**Methods**:
- `createFlow(dto)`: POST to Meta API
- `updateFlow(flowId, dto)`: POST to update endpoint
- `updateFlowJson(flowId, flowJson)`: **NEW** - POST to `/{flow_id}/assets` endpoint with multipart/form-data
- `publishFlow(flowId)`: POST to publish endpoint
- `deprecateFlow(flowId)`: POST to deprecate
- `deleteFlow(flowId)`: DELETE from Meta
- `getFlowDetails(flowId)`: GET flow metadata
- `getPreviewUrl(flowId)`: GET preview URL
- `fetchAllFlows()`: GET all flows with pagination
- `getFlowJson(assetUrl)`: Download flow JSON from Meta CDN

**Important Note on Flow JSON Updates**:
Meta API does **NOT** accept flow_json updates via standard JSON body on the flow update endpoint. Attempting to update flow_json in the body will result in a "No properties to update" error.

**Correct Method for Flow JSON Updates**:
Use the `updateFlowJson(flowId, flowJson)` method which:
1. Creates a multipart/form-data payload using the `form-data` package
2. Adds fields: `name='flow.json'`, `asset_type='FLOW_JSON'`, `file=<json_buffer>`
3. POSTs to `/{flow_id}/assets` endpoint (not the main flow update endpoint)
4. Returns the updated flow with validation_errors from Meta

**Example**:
```typescript
// ❌ WRONG - This will fail with "No properties to update"
await this.whatsappFlowService.updateFlow(flowId, { flow_json: newJson });

// ✅ CORRECT - Use assets endpoint with multipart/form-data
await this.whatsappFlowService.updateFlowJson(flowId, newJson);
```

### Flow JSON Structure
```typescript
{
  version: "3.0",
  screens: [{
    id: "START",
    title: "Form",
    data: {},
    layout: {
      type: "SingleColumnLayout",
      children: [{ type: "TextInput", name: "field1", label: "Name" }]
    }
  }]
}
```

### Flow Webhook Endpoint
**Path**: `/api/webhooks/flow-endpoint`
**Controller**: `FlowEndpointController`
**Service**: `FlowEndpointService`

**Actions**:
- `INIT`: Return first screen
- `data_exchange`: Process form submission
- `BACK`: Handle back navigation
- `ping`: Health check
- `error_notification`: Log errors

**Encryption**: RSA + AES-128-GCM (see FlowEncryptionService)

**DataSource Integration**: FlowEndpointService uses DataSources for dynamic data fetching

### DataSource Integration in Flows

**Purpose**: WhatsApp Flows can fetch dynamic data from external APIs (Strapi, REST, GraphQL) during INIT and data_exchange actions.

**Two Approaches**:
1. **Flow-Level DataSource** (Legacy): Single `dataSourceId` for entire flow
2. **Component-Level Config** (NEW): Per-dropdown configuration via `ComponentDataSourceConfigDto[]`

**Component-Level Configuration** (Recommended):

```typescript
// ComponentDataSourceConfigDto stored in flow.metadata.dataSourceConfig
const dataSourceConfigs = [
  {
    componentName: 'selected_brand',
    dataSourceId: 'uuid-of-datasource',
    endpoint: '/api/brands',
    dataKey: 'data',
    transformTo: { idField: 'name', titleField: 'name' }
  },
  {
    componentName: 'selected_product',
    dataSourceId: 'uuid-of-datasource',
    endpoint: '/api/products',
    dataKey: 'data',
    transformTo: { idField: 'documentId', titleField: 'name' },
    dependsOn: 'selected_brand',  // Cascading dropdown
    filterParam: 'filters[brand][name][$eq]'  // Strapi filter
  }
];
```

**Config-Driven Data Exchange Flow**:
```
1. INIT Action:
   - Load dataSourceConfig from Flow.metadata
   - Find configs without dependsOn (initial data)
   - Fetch data using DataSourcesService
   - Transform to dropdown format
   - Return first screen with data

2. data_exchange Action:
   - Check submitted field names
   - Find configs where dependsOn matches submitted field
   - Fetch cascading data with filter
   - Return next screen with new dropdown options
```

**Implementation** (FlowEndpointService):

```typescript
// Config-driven approach
private async fetchComponentData(
  config: ComponentDataSourceConfigDto,
  formData: Record<string, any>
): Promise<{ id: string; title: string }[]> {
  // Build filter params for cascading
  const params = {};
  if (config.dependsOn && config.filterParam && formData[config.dependsOn]) {
    params[config.filterParam] = formData[config.dependsOn];
  }

  // Fetch from DataSource
  const response = await this.dataSourcesService.fetchData(
    config.dataSourceId,
    config.endpoint,
    { params }
  );

  // Extract array using dataKey
  const dataArray = this.extractDataArray(response, config.dataKey);

  // Transform to dropdown format
  return dataArray.map(item => ({
    id: String(item[config.transformTo.idField]),
    title: String(item[config.transformTo.titleField])
  }));
}
```

**Fallback Mechanism**:
1. Primary: Component-level config from flow.metadata.dataSourceConfig
2. Secondary: Flow-level DataSource from WhatsAppFlow.dataSourceId
3. Fallback: Environment variables (STRAPI_BASE_URL, STRAPI_TOKEN)
4. Graceful degradation: Empty data if none available

**Benefits**:
- No hardcoded credentials in code
- UI-based configuration via Playground
- Cascading dropdown support (brand -> product -> details)
- Per-component data source selection
- Reusable DataSources across multiple flows
- Multiple environment support (dev, staging, prod)

**See**: [Data Sources + WhatsApp Flows Integration](./21-data-sources-whatsapp-flows-integration.md) for complete documentation

---

## Webhook Processing

### Webhook Flow
```
WhatsApp → POST /api/webhooks/whatsapp → Verify Signature → Parse → Process
```

### WebhooksController
**File**: `/backend/src/modules/webhooks/webhooks.controller.ts`

**Endpoints**:
- `GET /api/webhooks/whatsapp` - Verification (Meta requirement)
  - Returns `hub.challenge` if `hub.verify_token` matches
- `POST /api/webhooks/whatsapp` - Receive webhooks
  - Verify X-Hub-Signature-256 header
  - Parse payload
  - Always return 200 OK immediately

### Webhook Signature Verification
**Service**: `WebhookSignatureService`

```typescript
verifySignatureOrThrow(signature: string, rawBody: Buffer): void {
  const expected = crypto
    .createHmac('sha256', this.appSecret)
    .update(rawBody)
    .digest('hex');

  if (signature !== `sha256=${expected}`) {
    throw new UnauthorizedException('Invalid signature');
  }
}
```

### Webhook Payload Parsing
**Service**: `WebhookParserService`

**Message Types Parsed**:
- `text` - Text messages
- `interactive` - Button/list/Flow replies
  - `button_reply` - Button click
  - `list_reply` - List selection
  - `nfm_reply` - **Flow completion** (Native Flow Message Reply)
- `image`, `video`, `document`, `audio` - Media
- `reaction` - Emoji reactions
- `system` - System messages

**nfm_reply Parsing**:
```typescript
const responseData = JSON.parse(msg.interactive.nfm_reply.response_json);
parsed.interactiveType = 'nfm_reply';
parsed.flowToken = responseData.flow_token;  // "{contextId}-{nodeId}"
parsed.flowResponseData = responseData;       // All form fields
```

### Webhook Processing
**Service**: `WebhookProcessorService`

**Pipeline**:
1. Find/create user (by phone number)
2. Find/create conversation
3. Save message to database
4. Emit Socket.IO event (`message:received`)
5. Execute chatbot logic (if text/interactive)
6. Process Flow response (if nfm_reply)

**Flow Response Processing**:
```typescript
// Parse flow_token: "{contextId}-{nodeId}" (both UUIDs)
const parts = flowToken.split('-');
const contextId = parts.slice(0, 5).join('-');  // First UUID (5 parts)
const nodeId = parts.slice(5).join('-');        // Second UUID (5 parts)

// Load context and save Flow data to variables
context.variables[context.currentFlowOutputVariable] = cleanedData;
await contextRepo.save(context);

// Resume ChatBot execution
await executionService.processFlowResponse(flowToken, cleanedData);
```

---

## Message Sending

### WhatsAppMessageService (Orchestrator)
**File**: `/backend/src/modules/whatsapp/services/whatsapp-message.service.ts`

**Methods**:
- `sendTextMessage(dto)`
- `sendInteractiveMessage(dto)` - Routes to button/list/flow

**Usage in ChatBot Execution**:
```typescript
// Send message and get WhatsApp message ID
const result = await this.whatsappMessageService.sendTextMessage({
  to: phoneNumber,
  text: content
});

// Save message to database with WhatsApp ID
await this.messagesService.create({
  conversationId,
  senderId: BUSINESS_USER_ID,
  type: MessageType.TEXT,
  content: {
    text: content,
    whatsappMessageId: result.messages[0].id  // wamid.xxx
  },
  status: 'sent',
  timestamp: new Date()
});
```

### Message Response
```typescript
interface MessageResponse {
  messaging_product: "whatsapp";
  contacts: [{ input: string; wa_id: string }];
  messages: [{ id: string }];  // WhatsApp message ID (wamid.xxx)
}
```

---

## Error Handling

### WhatsApp API Errors
**Common Errors**:
- `100` - Invalid parameter
- `131031` - Message undeliverable (user blocked/invalid number)
- `131026` - Message expired (outside 24-hour window)
- `131047` - Re-engagement message required
- `130429` - Rate limit exceeded

**Handling**:
```typescript
try {
  await this.whatsappApi.sendMessage(payload);
} catch (error) {
  this.logger.error(`WhatsApp API error: ${error.response?.data?.error?.message}`);
  throw new BadRequestException(error.response?.data?.error?.message);
}
```

### 24-Hour Window Tracking
**Field**: `conversations.isWindowOpen` (boolean)

**Logic**:
- Set to `true` when user sends inbound message
- Set to `false` after 24 hours
- Outside window: Only template messages allowed

---

## Character Limits

### Interactive Messages
| Field | Limit |
|-------|-------|
| Button title | 20 chars |
| Button ID | 256 chars |
| List button text | 20 chars |
| List section title | 24 chars |
| List row title | 24 chars |
| List row description | 72 chars |
| Text message | 4096 chars |
| Header text | 60 chars |
| Footer text | 60 chars |

### Quantity Limits
- Buttons: max 3 per message
- List sections: max 10
- List rows: max 10 per section
- Total list rows: max 100

---

## Production Considerations

### Security
- ✅ Webhook signature verification (HMAC SHA256)
- ✅ Environment variable storage for secrets
- ⚠️ Access token encryption recommended (currently plain text in DB)
- ✅ Raw body capture for signature verification

### Rate Limiting
**WhatsApp Cloud API**:
- 80 messages per second per phone number
- 1000 messages per second per business account
- Higher limits available on request

**Implementation**: None (rely on WhatsApp API rate limits)
**Recommended**: Add application-level rate limiting with Redis

### Monitoring
**Current**:
- NestJS Logger for all API calls
- Error logging with stack traces

**Recommended**:
- Structured logging (Winston/Pino)
- APM (Application Performance Monitoring)
- Webhook delivery monitoring
- Message delivery rate tracking

---

## Create with Playground Feature

### Overview
Users can create WhatsApp Flows directly from the Playground UI without uploading JSON files.

### Endpoint
**POST /api/flows/from-playground**

**Request**:
```typescript
{
  playgroundJson: any;                      // Complete playground export JSON
  name?: string;                            // Optional - auto-generated if missing
  description?: string;                     // Optional
  categories: WhatsAppFlowCategory[];       // Required - at least 1 category
  endpointUri?: string;                     // Optional
  autoPublish?: boolean;                    // Optional - default: false
}
```

**Process**:
1. Validate playground JSON (version, screens)
2. Normalize JSON structure
3. Generate flow name (from DTO → first screen title → first screen ID → "Playground Flow")
4. Create in WhatsApp API
5. Save to database with metadata (`source: 'playground'`)
6. Auto-publish if requested

**Frontend Flow**:
```
FlowsPage → "Create with Playground" button
  → FlowPlaygroundPage (mode: 'create')
  → Design flow
  → Click Save → SaveFlowModal
  → Enter name + select categories
  → POST /api/flows/from-playground
  → Navigate back to FlowsPage
```

**See**: [Create with Playground Feature](./20-create-with-playground-feature.md) for detailed documentation

---

## Summary

### Integration Points
1. **Send Messages**: Via WhatsAppMessageService → WhatsAppApiService
2. **Receive Messages**: Webhooks → WebhookProcessorService → ChatBotExecutionService
3. **Flows**: FlowsService ↔ WhatsAppFlowService ↔ Meta API
4. **Flow Webhooks**: FlowEndpointController → FlowEndpointService (encrypted)
5. **Playground Creation**: FlowsPage → FlowPlaygroundPage → POST /api/flows/from-playground

### Key Services
- `WhatsAppApiService`: HTTP client wrapper
- `TextMessageService`, `InteractiveMessageService`: Message type handlers
- `WhatsAppFlowService`: Flow lifecycle API client
- `FlowEncryptionService`: RSA + AES encryption
- `WebhookProcessorService`: Webhook orchestrator

### File Locations
- API services: `/backend/src/modules/whatsapp/services/`
- Webhook services: `/backend/src/modules/webhooks/services/`
- Flow services: `/backend/src/modules/flows/`
- Entities: `/backend/src/entities/whatsapp-config.entity.ts`, `whatsapp-flow.entity.ts`

---

**See Also**:
- [whatsapp-messaging-api-expert](../skills/whatsapp-messaging-api-expert/) - Detailed API examples
- [whatsapp-flows-expert](../skills/whatsapp-flows-expert/) - Flow development guide
- [Backend Architecture](02-backend-architecture.md) - Module details
- [Webhook Processing](#webhook-processing) - Message handling flow
