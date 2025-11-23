# WhatsApp Messaging API Expert Skill

Expert skill for WhatsApp Business Messaging API implementation, covering all message types, templates, interactive messages, and delivery management.

## What this skill does

Provides comprehensive guidance on:
- Sending all WhatsApp message types (text, media, interactive, templates)
- Implementing interactive messages (lists, buttons, CTA URLs)
- Managing templates and customer service windows
- Handling message delivery, reactions, and contextual replies
- Optimizing message quality and delivery rates

## When to use

Use this skill when:
- Implementing WhatsApp Business API messaging features
- Working with WhatsApp templates or interactive messages
- Troubleshooting message delivery issues
- Building WhatsApp chatbot or automation
- Integrating WhatsApp messaging into applications

## Skill structure

```
whatsapp-messaging-api-expert/
├── SKILL.md                                    # Main skill file with quick reference
├── README.md                                   # This file
└── reference/                                  # Complete API documentation
    ├── 00-sending-messages-guide.md           # Overview of all message types
    ├── template-messages.md                   # Marketing, utility, auth templates
    ├── interactive-list-messages.md           # Multi-option selection lists
    ├── interactive-reply-buttons-messages.md  # Quick reply buttons (max 3)
    ├── interactive-cta-url-messages.md        # URL action buttons
    ├── interactive-location-request-messages.md # Request user location
    ├── image-messages.md                      # Image with caption
    ├── video-messages.md                      # Video content
    ├── document-messages.md                   # PDF, DOC files
    ├── location-messages.md                   # Coordinates
    ├── address-messages.md                    # Delivery addresses
    ├── sticker-messages.md                    # Animated/static stickers
    ├── reaction-messages.md                   # Emoji reactions
    ├── product-and-carousel-messages.md       # Product catalogs
    ├── contextual-replies.md                  # Reply to specific messages
    ├── mark-message-as-read.md               # Read receipts
    └── typing-indicators.md                   # Typing status
```

## Quick examples

### Send template message
```json
POST /<PHONE_NUMBER_ID>/messages
{
  "messaging_product": "whatsapp",
  "to": "PHONE",
  "type": "template",
  "template": {
    "name": "hello_world",
    "language": {"code": "en_US"}
  }
}
```

### Send interactive list
```json
{
  "messaging_product": "whatsapp",
  "to": "PHONE",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "body": {"text": "Choose an option"},
    "action": {
      "button": "View Menu",
      "sections": [{
        "rows": [
          {"id": "1", "title": "Option 1"}
        ]
      }]
    }
  }
}
```

### Send image with caption
```json
{
  "messaging_product": "whatsapp",
  "to": "PHONE",
  "type": "image",
  "image": {
    "link": "https://example.com/image.jpg",
    "caption": "Check this out!"
  }
}
```

## Key concepts

- **24-hour window**: Most messages need open customer service window; templates don't
- **Message quality**: Based on user feedback (blocks, reports); affects sending limits
- **Templates**: Pre-approved messages for marketing, utility, or authentication
- **Interactive messages**: Lists, buttons, and CTAs for user engagement

## Installation

This skill is ready to use. The reference documentation contains complete API details for all message types.

## Documentation source

Documentation is from WhatsApp Business Messaging API official docs (Updated: Nov 2025).

## Related skills

- `whatsapp-flows-expert` - For WhatsApp Flows implementation
- `reactflow-development` - For building flow-based UIs (if visualizing message flows)

## Support

For WhatsApp API setup, credentials, and webhooks configuration, refer to WhatsApp Business API setup documentation.
