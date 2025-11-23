# WhatsApp Webhooks Module

This module handles incoming webhook requests from the WhatsApp Business API, including message receipts, status updates, and user interactions.

## Features

- **Webhook Verification**: GET endpoint for WhatsApp webhook setup and verification
- **Message Reception**: POST endpoint to receive incoming messages from users
- **Signature Verification**: HMAC-SHA256 signature verification for security
- **Message Parsing**: Comprehensive parsing of all WhatsApp message types
- **Automatic Storage**: Auto-create users, conversations, and store messages
- **Status Updates**: Handle message delivery and read receipts
- **Idempotency**: Prevent duplicate message processing

## Supported Message Types

The webhook handler supports all WhatsApp message types:

- **Text Messages**: Plain text with optional link preview
- **Image Messages**: Images with optional captions
- **Video Messages**: Videos with optional captions
- **Document Messages**: Files with filename and optional caption
- **Audio Messages**: Audio files and voice messages
- **Sticker Messages**: Static and animated stickers
- **Interactive Messages**:
  - Button replies
  - List replies
- **Location Messages**: Shared locations with coordinates
- **Contact Messages**: Shared contact cards

## Architecture

### DTOs (Data Transfer Objects)

#### `webhook-entry.dto.ts`
Defines the structure of incoming webhook payloads from WhatsApp:
- `WebhookPayloadDto`: Root webhook payload
- `WebhookEntryDto`: Entry object containing changes
- `WebhookChangeDto`: Change object with message/status data
- `WebhookValueDto`: Value object with messages, statuses, metadata
- `WebhookVerificationDto`: Verification request parameters

#### `parsed-message.dto.ts`
Internal DTOs for processed webhook data:
- `ParsedMessageDto`: Parsed message ready for database storage
- `ParsedStatusUpdateDto`: Parsed status update information

### Services

#### `webhook-signature.service.ts`
Handles webhook security and verification:

**Methods:**
- `verifySignature(signature, payload)`: Verify HMAC-SHA256 signature
- `verifySignatureOrThrow(signature, payload)`: Verify or throw exception
- `verifyToken(token)`: Verify webhook setup token

**Configuration Required:**
- `WHATSAPP_APP_SECRET`: Meta App Secret for signature verification
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`: Custom token for webhook setup

#### `webhook-parser.service.ts`
Parses WhatsApp webhook payloads into application DTOs:

**Methods:**
- `parseMessages(value)`: Parse incoming messages array
- `parseStatusUpdates(value)`: Parse status updates array
- `getMessagePreview(parsedMessage)`: Generate text preview for conversation

**Features:**
- Maps WhatsApp message types to internal MessageType enum
- Extracts message content based on type
- Handles interactive message responses
- Parses sender information from contacts array

#### `webhook-processor.service.ts`
Processes parsed webhook data and stores to database:

**Methods:**
- `processMessages(parsedMessages)`: Store incoming messages
- `processStatusUpdates(statusUpdates)`: Update message statuses
- `isMessageProcessed(whatsappMessageId)`: Check for duplicates

**Database Operations:**
- Find or create sender user by phone number
- Find or create recipient user (business account)
- Find or create conversation between users
- Store message with WhatsApp message ID for tracking
- Update conversation's last message and timestamp
- Update message status (sent, delivered, read)

### Controller

#### `webhooks.controller.ts`
Exposes webhook endpoints:

**GET /api/webhooks/whatsapp**
- Webhook verification during setup
- Validates `hub.mode`, `hub.verify_token`, and `hub.challenge`
- Returns challenge on success

**POST /api/webhooks/whatsapp**
- Receives webhook events from WhatsApp
- Verifies HMAC-SHA256 signature
- Processes messages and status updates
- Always returns 200 OK to acknowledge receipt

## Setup Guide

### 1. Configure Environment Variables

Add to your `.env` file:

```bash
# WhatsApp Webhook Configuration
WHATSAPP_APP_SECRET=your_app_secret_from_meta_dashboard
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_custom_verify_token_12345
```

**Where to find these:**

- **WHATSAPP_APP_SECRET**:
  1. Go to [Meta for Developers](https://developers.facebook.com/)
  2. Select your app
  3. Go to "Settings" > "Basic"
  4. Copy "App Secret"

- **WHATSAPP_WEBHOOK_VERIFY_TOKEN**:
  - This is a custom string you create
  - Use a random, secure string
  - You'll enter this in Meta dashboard during webhook setup

### 2. Deploy Your Webhook Endpoint

Your webhook needs to be publicly accessible:

**Option A: Production Deployment**
```bash
# Deploy to your production server
# Ensure endpoint is accessible at: https://yourdomain.com/api/webhooks/whatsapp
```

**Option B: Development with ngrok**
```bash
# Install ngrok
npm install -g ngrok

# Start your application
npm run start:dev

# In another terminal, create tunnel
ngrok http 3000

# Use the HTTPS URL provided (e.g., https://abc123.ngrok.io)
```

### 3. Configure Webhook in Meta Dashboard

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Select your WhatsApp Business app
3. Go to "WhatsApp" > "Configuration"
4. Click "Edit" next to "Webhook"
5. Enter your webhook URL:
   ```
   https://yourdomain.com/api/webhooks/whatsapp
   ```
   or for development:
   ```
   https://abc123.ngrok.io/api/webhooks/whatsapp
   ```
6. Enter your `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
7. Click "Verify and Save"

### 4. Subscribe to Webhook Fields

After verification, subscribe to these webhook fields:

- ✅ **messages** - Incoming messages from users
- ✅ **message_status** - Delivery and read receipts (optional)

Click "Manage" and toggle the fields you want to receive.

### 5. Test Your Webhook

Send a test message to your WhatsApp Business number:

```bash
# Watch your application logs
npm run start:dev

# You should see:
# [WebhooksController] Webhook payload received
# [WebhooksController] Processing 1 incoming message(s)
# [WebhookProcessorService] Message <id> processed successfully
```

## Webhook Payload Examples

### Incoming Text Message

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15551234567",
          "phone_number_id": "PHONE_NUMBER_ID"
        },
        "contacts": [{
          "profile": {
            "name": "John Doe"
          },
          "wa_id": "15559876543"
        }],
        "messages": [{
          "from": "15559876543",
          "id": "wamid.ABCxyz123==",
          "timestamp": "1699564800",
          "type": "text",
          "text": {
            "body": "Hello, I need help!"
          }
        }]
      },
      "field": "messages"
    }]
  }]
}
```

### Message Status Update

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15551234567",
          "phone_number_id": "PHONE_NUMBER_ID"
        },
        "statuses": [{
          "id": "wamid.ABCxyz123==",
          "status": "read",
          "timestamp": "1699564805",
          "recipient_id": "15559876543"
        }]
      },
      "field": "messages"
    }]
  }]
}
```

### Interactive Button Reply

```json
{
  "messages": [{
    "from": "15559876543",
    "id": "wamid.DEFabc456==",
    "timestamp": "1699564810",
    "type": "interactive",
    "interactive": {
      "type": "button_reply",
      "button_reply": {
        "id": "btn_yes",
        "title": "Yes"
      }
    }
  }]
}
```

## Database Schema

The webhook processor interacts with these entities:

### User Entity
```typescript
{
  id: string (UUID)
  phoneNumber: string (unique)
  name: string
  avatar: string (optional)
  createdAt: Date
  updatedAt: Date
}
```

### Conversation Entity
```typescript
{
  id: string (UUID)
  participants: User[] (many-to-many)
  messages: Message[]
  lastMessage: string
  lastMessageAt: Date
  createdAt: Date
  updatedAt: Date
}
```

### Message Entity
```typescript
{
  id: string (UUID)
  conversationId: string
  senderId: string
  type: MessageType (enum)
  content: {
    whatsappMessageId: string
    // ... type-specific fields
  }
  status: MessageStatus (sent | delivered | read)
  timestamp: Date
  createdAt: Date
  updatedAt: Date
}
```

## Message Content Structures

### Text Message
```typescript
{
  whatsappMessageId: string
  body: string
}
```

### Image/Video/Document Message
```typescript
{
  whatsappMessageId: string
  id: string              // Media ID from WhatsApp
  mimeType: string
  sha256: string
  caption?: string        // Optional caption
  filename?: string       // For documents only
}
```

### Interactive Button Reply
```typescript
{
  whatsappMessageId: string
  type: 'button_reply'
  buttonId: string
  buttonTitle: string
}
```

### Interactive List Reply
```typescript
{
  whatsappMessageId: string
  type: 'list_reply'
  listId: string
  listTitle: string
  listDescription?: string
}
```

## Error Handling

The webhook handler includes comprehensive error handling:

1. **Signature Verification Failures**: Returns 401 Unauthorized
2. **Invalid Payload Structure**: Returns 400 Bad Request
3. **Processing Errors**: Logged but doesn't fail entire request
4. **Duplicate Messages**: Detected and skipped via whatsappMessageId
5. **Database Errors**: Logged, processing continues for other messages

## Security Best Practices

1. **Always verify signatures** in production
2. **Use HTTPS** for webhook endpoint
3. **Keep App Secret secure** - never commit to version control
4. **Rotate tokens regularly**
5. **Monitor for suspicious activity** in logs
6. **Rate limit webhook endpoint** if needed
7. **Validate payload structure** before processing

## Logging

The webhook module provides detailed logging:

```typescript
// Verification
[WebhooksController] Webhook verification request received
[WebhooksController] Webhook verified successfully

// Incoming messages
[WebhooksController] Webhook payload received
[WebhooksController] Processing 1 incoming message(s)
[WebhookProcessorService] Processing message wamid.ABC... from 15559876543
[WebhookProcessorService] Creating new user: 15559876543
[WebhookProcessorService] Creating new conversation between <id1> and <id2>
[WebhookProcessorService] Message wamid.ABC... processed successfully

// Status updates
[WebhooksController] Processing 1 status update(s)
[WebhookProcessorService] Updated message wamid.ABC... status to read

// Errors
[WebhookProcessorService] Error processing message wamid.ABC...: <error>
[WebhookSignatureService] Webhook signature verification failed
```

## Testing

### Manual Testing with cURL

**Verify webhook (GET):**
```bash
curl "http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=your_custom_verify_token_12345&hub.challenge=test_challenge"
# Should return: test_challenge
```

**Send test message (POST):**
```bash
curl -X POST http://localhost:3000/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=<signature>" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "123",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "15551234567",
            "phone_number_id": "PHONE_ID"
          },
          "contacts": [{
            "profile": { "name": "Test User" },
            "wa_id": "15559876543"
          }],
          "messages": [{
            "from": "15559876543",
            "id": "wamid.test123",
            "timestamp": "1699564800",
            "type": "text",
            "text": { "body": "Test message" }
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

## Troubleshooting

### Webhook verification fails
- Check `WHATSAPP_WEBHOOK_VERIFY_TOKEN` matches Meta dashboard
- Ensure endpoint is publicly accessible
- Verify you're using HTTPS (required by WhatsApp)

### Signature verification fails
- Check `WHATSAPP_APP_SECRET` is correct
- Ensure raw body is available (check main.ts configuration)
- Verify header name is exactly `x-hub-signature-256`

### Messages not being stored
- Check database connection
- Verify entities are properly configured
- Check logs for error messages
- Ensure User, Conversation, Message entities exist

### Duplicate messages
- This is normal - webhook uses whatsappMessageId for idempotency
- Duplicates are automatically detected and skipped

## Related Modules

- **ConversationsModule**: Manages conversation entities
- **MessagesModule**: Handles message queries and storage
- **UsersModule**: Manages user entities
- **WhatsAppModule**: Sends outgoing messages

## API Reference

See [WhatsApp Webhooks Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks) for official Meta documentation.
