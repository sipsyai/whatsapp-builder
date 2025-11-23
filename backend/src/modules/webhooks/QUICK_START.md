# WhatsApp Webhooks - Quick Start Guide

## TL;DR

This module receives incoming WhatsApp messages and automatically stores them in your database.

## Setup in 5 Minutes

### 1. Configure Environment Variables

Add to `.env`:
```bash
WHATSAPP_APP_SECRET=your_app_secret_from_meta_dashboard
WHATSAPP_WEBHOOK_VERIFY_TOKEN=any_random_secure_string_you_choose
```

### 2. Deploy Your Endpoint

**Development (with ngrok):**
```bash
# Terminal 1: Start your app
npm run start:dev

# Terminal 2: Create public tunnel
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

**Production:**
Deploy to your server with HTTPS enabled.

### 3. Configure in Meta Dashboard

1. Go to https://developers.facebook.com/apps
2. Select your WhatsApp app
3. Navigate to: **WhatsApp > Configuration**
4. Click **Edit** next to Webhook
5. Enter:
   - **Callback URL**: `https://your-domain.com/api/webhooks/whatsapp`
   - **Verify Token**: Same value as `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
6. Click **Verify and Save**
7. Subscribe to webhook fields:
   - ✅ **messages**
   - ✅ **message_status** (optional)

### 4. Test It

Send a message to your WhatsApp Business number via the WhatsApp app.

**Check the logs:**
```bash
npm run start:dev

# You should see:
# [WebhooksController] Webhook payload received
# [WebhooksController] Processing 1 incoming message(s)
# [WebhookProcessorService] Message processed successfully
```

**Check the database:**
```sql
-- View created users
SELECT * FROM users ORDER BY "createdAt" DESC LIMIT 5;

-- View conversations
SELECT * FROM conversations ORDER BY "lastMessageAt" DESC LIMIT 5;

-- View messages
SELECT * FROM messages ORDER BY timestamp DESC LIMIT 10;
```

## What Happens Automatically

✅ **User Creation**: New users auto-created from phone numbers
✅ **Conversation Creation**: Conversations auto-created between sender and business
✅ **Message Storage**: All messages stored with proper content structure
✅ **Status Tracking**: Delivery and read receipts tracked
✅ **Duplicate Prevention**: Same message won't be stored twice

## Webhook Endpoints

### GET /api/webhooks/whatsapp
Verification endpoint for WhatsApp setup.

**Example:**
```bash
curl "http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=test"
# Returns: test
```

### POST /api/webhooks/whatsapp
Receives incoming messages and status updates.

**Headers:**
```
x-hub-signature-256: sha256=<signature>
Content-Type: application/json
```

## Supported Message Types

| Type | Description | Example |
|------|-------------|---------|
| Text | Plain text messages | "Hello, I need help!" |
| Image | Images with optional caption | JPG, PNG with caption |
| Video | Videos with optional caption | MP4 with caption |
| Document | Files with filename | PDF, DOCX, etc. |
| Audio | Audio files and voice messages | Voice notes, MP3 |
| Sticker | Stickers (static/animated) | WhatsApp stickers |
| Interactive | Button/List replies | User clicked a button |
| Location | Shared locations | GPS coordinates |
| Contacts | Shared contact cards | vCard format |

## Message Content Structure

Messages are stored with this structure:

```typescript
{
  id: "uuid",
  conversationId: "uuid",
  senderId: "uuid",
  type: "text" | "image" | "video" | "document" | "audio" | "sticker" | "interactive",
  content: {
    whatsappMessageId: "wamid.xxx...",  // WhatsApp's message ID
    // ... type-specific fields (body, caption, etc.)
  },
  status: "sent" | "delivered" | "read",
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Security

All webhook requests are verified using HMAC-SHA256 signature:

1. WhatsApp sends signature in `x-hub-signature-256` header
2. Server computes signature using `WHATSAPP_APP_SECRET`
3. Signatures compared using timing-safe comparison
4. Request rejected if signatures don't match (401 Unauthorized)

## Troubleshooting

### Verification Failed
```
Error: Invalid verification token
```
**Fix**: Check `WHATSAPP_WEBHOOK_VERIFY_TOKEN` matches Meta dashboard value

### Signature Verification Failed
```
Error: Invalid webhook signature
```
**Fixes:**
- Verify `WHATSAPP_APP_SECRET` is correct
- Check main.ts has `rawBody: true` configuration
- Ensure no middleware is modifying request body

### Messages Not Stored
**Check:**
1. Database connection is working
2. User, Conversation, Message entities exist
3. Logs for detailed error messages
4. Webhook is reaching your endpoint (check logs)

### Webhook Not Receiving Messages
**Check:**
1. Endpoint is publicly accessible (not localhost)
2. Using HTTPS (required by WhatsApp)
3. Subscribed to `messages` field in Meta dashboard
4. WhatsApp number is properly configured

## Environment Variables Reference

```bash
# Required for webhook functionality
WHATSAPP_APP_SECRET=              # From Meta App Dashboard > Settings > Basic
WHATSAPP_WEBHOOK_VERIFY_TOKEN=    # Custom secure token you create

# Optional but recommended
PORT=3000                          # Server port
```

## Logs to Watch

**Successful message processing:**
```
[WebhooksController] Webhook payload received
[WebhooksController] Processing 1 incoming message(s)
[WebhookParserService] Parsing 1 message(s)
[WebhookProcessorService] Processing message wamid.xxx from +1234567890
[WebhookProcessorService] Creating new user: +1234567890
[WebhookProcessorService] Creating new conversation between <id1> and <id2>
[WebhookProcessorService] Message wamid.xxx processed successfully
[WebhooksController] Successfully processed 1 message(s)
```

**Successful status update:**
```
[WebhooksController] Webhook payload received
[WebhooksController] Processing 1 status update(s)
[WebhookProcessorService] Updated message wamid.xxx status to read
```

## Testing Commands

**Test verification:**
```bash
curl "http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test_challenge"
```

**Test message (requires valid signature):**
```bash
curl -X POST http://localhost:3000/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=..." \
  -d @test-webhook-payload.json
```

## Next Steps

1. ✅ Webhook receiving messages
2. 🔄 Implement real-time UI updates (WebSocket)
3. 🔄 Add media download and storage
4. 🔄 Create automated responses
5. 🔄 Add message templates

## Need Help?

- **Full Documentation**: See `README.md` in this directory
- **Implementation Summary**: See `backend/WEBHOOKS_IMPLEMENTATION_SUMMARY.md`
- **WhatsApp Docs**: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
- **Message Types Guide**: See `README.md` for detailed content structures

## Example Webhook Payload

**Incoming text message:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15551234567",
          "phone_number_id": "PHONE_NUMBER_ID"
        },
        "contacts": [{
          "profile": { "name": "John Doe" },
          "wa_id": "15559876543"
        }],
        "messages": [{
          "from": "15559876543",
          "id": "wamid.HBgNMTU1NTk4NzY1NDMVAgARGBI5...",
          "timestamp": "1699564800",
          "type": "text",
          "text": {
            "body": "Hello! I need help with my order."
          }
        }]
      },
      "field": "messages"
    }]
  }]
}
```

## Architecture Overview

```
WhatsApp API
    ↓
POST /api/webhooks/whatsapp
    ↓
WebhooksController
    ↓
WebhookSignatureService (verify signature)
    ↓
WebhookParserService (parse messages)
    ↓
WebhookProcessorService (store in DB)
    ↓
Database (Users, Conversations, Messages)
```

## Success Checklist

- [ ] Environment variables configured
- [ ] Webhook endpoint publicly accessible via HTTPS
- [ ] Webhook configured in Meta Dashboard
- [ ] Subscribed to "messages" field
- [ ] Test message sent and received
- [ ] Message appears in database
- [ ] Logs show successful processing
- [ ] No errors in console

---

**You're all set!** 🎉

Send a message to your WhatsApp Business number and watch it appear in your database automatically.
