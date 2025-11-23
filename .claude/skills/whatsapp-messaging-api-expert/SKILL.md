---
name: whatsapp-messaging-api-expert
description: Expert in WhatsApp Business Messaging API for sending text, media, templates, interactive messages, reactions, and managing message delivery. Use when working with WhatsApp Business API, sending messages, templates, interactive buttons/lists, or implementing WhatsApp messaging features.
---

# WhatsApp Messaging API Expert

## Quick start

Send a text message:
```json
POST /<PHONE_NUMBER_ID>/messages
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "RECIPIENT_PHONE",
  "type": "text",
  "text": {
    "body": "Your message here"
  }
}
```

## Core capabilities

### Message types available

**Text & Media**:
- Text messages with optional preview URLs
- Image messages with captions
- Video messages with thumbnails
- Document messages (PDF, DOC, etc.)
- Audio messages
- Sticker messages

**Interactive messages**:
- Interactive list messages (up to 10 sections, 10 rows total)
- Interactive reply buttons (up to 3 buttons)
- Interactive CTA URL buttons
- Interactive location request messages

**Specialized messages**:
- Template messages (marketing, utility, authentication)
- Location messages (latitude/longitude)
- Address messages (request delivery address)
- Contact messages (vCard format)
- Reaction messages (emoji reactions)
- Product and carousel messages

**Message features**:
- Contextual replies (reply to specific messages)
- Mark messages as read
- Typing indicators

### Common patterns

**Send template message**:
```json
{
  "messaging_product": "whatsapp",
  "to": "RECIPIENT_PHONE",
  "type": "template",
  "template": {
    "name": "template_name",
    "language": {
      "code": "en_US"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {"type": "text", "text": "value"}
        ]
      }
    ]
  }
}
```

**Send interactive list**:
```json
{
  "messaging_product": "whatsapp",
  "to": "RECIPIENT_PHONE",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "header": {"type": "text", "text": "Header"},
    "body": {"text": "Choose an option"},
    "footer": {"text": "Footer text"},
    "action": {
      "button": "View Options",
      "sections": [
        {
          "title": "Section 1",
          "rows": [
            {
              "id": "option_1",
              "title": "Option 1",
              "description": "Description"
            }
          ]
        }
      ]
    }
  }
}
```

**Send interactive reply buttons**:
```json
{
  "messaging_product": "whatsapp",
  "to": "RECIPIENT_PHONE",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": {"text": "Choose an action"},
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": {
            "id": "btn_1",
            "title": "Button 1"
          }
        }
      ]
    }
  }
}
```

## Key concepts

### 24-hour customer service window
- Most messages require an open customer service window
- Window opens when user messages you
- Template messages can be sent anytime (no window required)

### Message quality
- Based on user feedback (blocks, reports, mutes)
- Calculated over past 7 days
- Affects sending limits and template quality

### Best practices
1. Use templates for proactive outreach
2. Keep messages relevant and valuable
3. Avoid spam-like behavior
4. Respect user preferences
5. Handle opt-outs properly

## Detailed documentation

For comprehensive API details, see reference documentation:

- [Sending messages overview](reference/00-sending-messages-guide.md) - Complete guide to message types
- [Template messages](reference/template-messages.md) - Marketing, utility, authentication templates
- [Interactive list messages](reference/interactive-list-messages.md) - Multi-option selection lists
- [Interactive reply buttons](reference/interactive-reply-buttons-messages.md) - Quick reply buttons (max 3)
- [Interactive CTA URL](reference/interactive-cta-url-messages.md) - URL action buttons
- [Interactive location request](reference/interactive-location-request-messages.md) - Request user location
- [Image messages](reference/image-messages.md) - Send images with captions
- [Video messages](reference/video-messages.md) - Send video content
- [Document messages](reference/document-messages.md) - Send PDF, DOC files
- [Location messages](reference/location-messages.md) - Send coordinates
- [Address messages](reference/address-messages.md) - Request delivery addresses
- [Sticker messages](reference/sticker-messages.md) - Send animated/static stickers
- [Reaction messages](reference/reaction-messages.md) - React with emojis
- [Product and carousel](reference/product-and-carousel-messages.md) - Product catalogs
- [Contextual replies](reference/contextual-replies.md) - Reply to specific messages
- [Mark as read](reference/mark-message-as-read.md) - Read receipts
- [Typing indicators](reference/typing-indicators.md) - Show typing status

## Common tasks

### Send media with caption
1. Check file size limits (images: 5MB, videos: 16MB, documents: 100MB)
2. Upload media or use URL
3. Include caption in payload

### Create interactive experience
1. Choose interaction type (list, buttons, CTA)
2. Keep button/row titles under character limits
3. Handle webhook responses for user selections

### Handle message failures
1. Check error codes in response
2. Verify phone number format (E.164)
3. Ensure templates are approved
4. Verify customer service window status

### Optimize message delivery
1. Use templates for first contact
2. Monitor message quality score
3. Handle rate limits gracefully
4. Implement retry logic with exponential backoff

## API endpoints

**Send message**: `POST /<PHONE_NUMBER_ID>/messages`
**Headers**:
- `Authorization: Bearer <ACCESS_TOKEN>`
- `Content-Type: application/json`

**Base URL**: `https://graph.facebook.com/<API_VERSION>`

## Error handling

Common error codes:
- `131047`: Re-engagement message required (24h window closed)
- `131026`: Message undeliverable (user blocked/deleted account)
- `131031`: Rate limit exceeded
- `132000`: Template paused (low quality score)
- `133016`: Phone number not registered

## Limits and quotas

- Interactive list: Max 10 sections, 10 rows total
- Interactive buttons: Max 3 buttons
- Button title: Max 20 characters
- List row title: Max 24 characters
- Message body: Max 4096 characters (varies by type)
- Header: Optional, format varies by message type
- Footer: Optional, max 60 characters

## Next steps

1. Review [sending messages guide](reference/00-sending-messages-guide.md) for complete message type overview
2. Understand template approval process
3. Implement webhook handling for user responses
4. Set up message quality monitoring
5. Test with WhatsApp Business API test numbers
