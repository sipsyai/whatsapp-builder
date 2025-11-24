# WhatsApp Integration - WhatsApp Builder

## Table of Contents
- [Overview](#overview)
- [WhatsApp Business API Setup](#whatsapp-business-api-setup)
- [Message Types](#message-types)
- [Webhook Processing](#webhook-processing)
- [Message Sending](#message-sending)
- [Error Handling](#error-handling)

---

## Overview

Integration with WhatsApp Business API enables:
- Sending text, interactive, and media messages
- Receiving user messages via webhooks
- Message status tracking (sent → delivered → read)
- 24-hour messaging window management

### API Version
**Graph API**: v18.0
**Base URL**: `https://graph.facebook.com/v18.0/{phone_number_id}/messages`

---

## WhatsApp Business API Setup

### Configuration Storage
**Entity**: `WhatsAppConfig`
**File**: `/home/ali/whatsapp-builder/backend/src/entities/whatsapp-config.entity.ts`

```typescript
@Entity('whatsapp_config')
export class WhatsAppConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  phoneNumberId: string;  // WhatsApp phone number ID

  @Column({ length: 255 })
  businessAccountId: string;  // WhatsApp Business Account ID

  @Column({ type: 'text' })
  accessToken: string;  // Graph API access token

  @Column({ length: 255 })
  webhookVerifyToken: string;  // Webhook verification token

  @Column({ type: 'text', nullable: true })
  appSecret?: string;  // App secret for signature verification

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
```

### Environment Variables
```bash
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token
WHATSAPP_APP_SECRET=your_app_secret
```

---

## Message Types

### 1. Text Messages
**Service**: `TextMessageService`
**File**: `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/services/message-types/text-message.service.ts`

```typescript
async sendTextMessage(dto: SendTextMessageDto): Promise<MessageResponse> {
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: dto.to,  // Phone number: "1234567890"
    type: "text",
    text: {
      preview_url: dto.previewUrl || false,
      body: dto.text,
    },
  };

  return await this.whatsappApi.sendMessage(payload);
}
```

### 2. Interactive Button Messages
**Service**: `InteractiveMessageService`

```typescript
async sendButtonMessage(dto: SendButtonMessageDto): Promise<MessageResponse> {
  const payload = {
    messaging_product: "whatsapp",
    to: dto.to,
    type: "interactive",
    interactive: {
      type: "button",
      header: dto.headerText ? { type: "text", text: dto.headerText } : undefined,
      body: { text: dto.bodyText },
      footer: dto.footerText ? { text: dto.footerText } : undefined,
      action: {
        buttons: dto.buttons.map(btn => ({
          type: "reply",
          reply: {
            id: btn.id,
            title: btn.title.substring(0, 20),  // Max 20 chars
          },
        })),
      },
    },
  };

  return await this.whatsappApi.sendMessage(payload);
}
```

**Constraints**:
- Max 3 buttons per message
- Button title: max 20 characters
- Button ID: max 256 characters

### 3. Interactive List Messages
```typescript
async sendListMessage(dto: SendListMessageDto): Promise<MessageResponse> {
  const payload = {
    messaging_product: "whatsapp",
    to: dto.to,
    type: "interactive",
    interactive: {
      type: "list",
      header: dto.headerText ? { type: "text", text: dto.headerText } : undefined,
      body: { text: dto.bodyText },
      footer: dto.footerText ? { text: dto.footerText } : undefined,
      action: {
        button: dto.listButtonText,  // "View Options"
        sections: dto.sections.map(section => ({
          title: section.title.substring(0, 24),  // Max 24 chars
          rows: section.rows.map(row => ({
            id: row.id,
            title: row.title.substring(0, 24),
            description: row.description?.substring(0, 72),  // Max 72 chars
          })),
        })),
      },
    },
  };

  return await this.whatsappApi.sendMessage(payload);
}
```

**Constraints**:
- Max 10 sections
- Max 10 rows per section
- Section title: max 24 characters
- Row title: max 24 characters
- Row description: max 72 characters

---

## Webhook Processing

### Webhook Endpoint
**File**: `/home/ali/whatsapp-builder/backend/src/modules/webhooks/webhooks.controller.ts`

```typescript
@Controller('api/webhooks/whatsapp')
export class WebhooksController {
  // Verification (GET)
  @Get()
  verifyWebhook(@Query() query: WebhookVerificationDto): string {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode !== 'subscribe' || !this.signatureService.verifyToken(token)) {
      throw new BadRequestException('Invalid verification');
    }

    return challenge;
  }

  // Receive webhooks (POST)
  @Post()
  async receiveWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature: string,
    @Body() payload: WebhookPayloadDto,
  ): Promise<{ success: boolean }> {
    // 1. Verify signature
    this.signatureService.verifySignatureOrThrow(signature, req.rawBody);

    // 2. Process each entry
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        await this.processChange(change.value);
      }
    }

    // 3. Always return 200 OK
    return { success: true };
  }
}
```

### Signature Verification
**File**: `/home/ali/whatsapp-builder/backend/src/modules/webhooks/services/webhook-signature.service.ts`

```typescript
verifySignatureOrThrow(signature: string, rawBody: Buffer): void {
  const expectedSignature = crypto
    .createHmac('sha256', this.appSecret)
    .update(rawBody)
    .digest('hex');

  const receivedSignature = signature?.replace('sha256=', '');

  if (expectedSignature !== receivedSignature) {
    throw new UnauthorizedException('Invalid webhook signature');
  }
}
```

### Message Parsing
**File**: `/home/ali/whatsapp-builder/backend/src/modules/webhooks/services/webhook-parser.service.ts`

```typescript
parseMessages(value: any): ParsedMessageDto[] {
  const messages: ParsedMessageDto[] = [];

  for (const msg of value.messages || []) {
    const parsed: ParsedMessageDto = {
      id: msg.id,
      from: msg.from,  // Phone number
      timestamp: msg.timestamp,
      type: msg.type,
      profile: value.contacts?.[0]?.profile,
    };

    // Parse based on message type
    switch (msg.type) {
      case 'text':
        parsed.text = msg.text.body;
        break;

      case 'interactive':
        if (msg.interactive.type === 'button_reply') {
          parsed.text = msg.interactive.button_reply.title;
          parsed.buttonId = msg.interactive.button_reply.id;
        } else if (msg.interactive.type === 'list_reply') {
          parsed.text = msg.interactive.list_reply.title;
          parsed.listRowId = msg.interactive.list_reply.id;
        }
        break;

      case 'image':
      case 'video':
      case 'document':
      case 'audio':
        parsed.mediaId = msg[msg.type].id;
        parsed.mimeType = msg[msg.type].mime_type;
        parsed.caption = msg[msg.type].caption;
        break;
    }

    messages.push(parsed);
  }

  return messages;
}
```

### Processing Pipeline
**File**: `/home/ali/whatsapp-builder/backend/src/modules/webhooks/services/webhook-processor.service.ts`

```typescript
async processMessages(messages: ParsedMessageDto[]): Promise<void> {
  for (const msg of messages) {
    // 1. Find or create user
    const user = await this.findOrCreateUser(msg.from, msg.profile);

    // 2. Find or create conversation
    const conversation = await this.findOrCreateConversation(user);

    // 3. Save message
    const savedMessage = await this.saveMessage(conversation, user, msg);

    // 4. Emit real-time event
    this.gateway.emitMessageReceived({
      conversationId: conversation.id,
      messageId: savedMessage.id,
      senderId: user.id,
      type: savedMessage.type,
      content: savedMessage.content,
      status: savedMessage.status,
      timestamp: savedMessage.timestamp.toISOString(),
    });

    // 5. Execute chatbot logic
    if (msg.type === 'text' || msg.type === 'interactive') {
      await this.executionService.processUserResponse(
        conversation.id,
        msg.text,
        msg.buttonId,
        msg.listRowId,
      );
    }
  }
}
```

---

## Message Sending

### WhatsAppApiService
**File**: `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/services/whatsapp-api.service.ts`

```typescript
@Injectable()
export class WhatsAppApiService {
  private readonly baseUrl: string;
  private readonly accessToken: string;

  constructor(private readonly configService: WhatsAppConfigService) {
    const config = this.configService.getActiveConfig();
    this.baseUrl = `https://graph.facebook.com/v18.0/${config.phoneNumberId}`;
    this.accessToken = config.accessToken;
  }

  async sendMessage(payload: any): Promise<MessageResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        messageId: response.data.messages[0].id,
        status: 'sent',
      };
    } catch (error) {
      this.logger.error('WhatsApp API error:', error.response?.data);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  async uploadMedia(formData: FormData): Promise<{ id: string }> {
    const response = await axios.post(
      `${this.baseUrl}/media`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          ...formData.getHeaders(),
        },
      }
    );

    return { id: response.data.id };
  }
}
```

---

## Error Handling

### Common WhatsApp API Errors

#### 1. Rate Limiting (Error Code: 4)
```json
{
  "error": {
    "message": "Message failed to send because there were too many messages sent from this phone number in a short period of time.",
    "type": "OAuthException",
    "code": 4
  }
}
```

**Solution**: Implement exponential backoff and retry logic

#### 2. Invalid Phone Number (Error Code: 131051)
```json
{
  "error": {
    "message": "Unsupported phone number",
    "type": "OAuthException",
    "code": 131051
  }
}
```

**Solution**: Validate phone numbers before sending

#### 3. 24-Hour Window Expired (Error Code: 131047)
```json
{
  "error": {
    "message": "Re-engagement message was not sent because more than 24 hours have passed since the customer last replied to this number.",
    "type": "OAuthException",
    "code": 131047
  }
}
```

**Solution**: Use Message Templates for messages outside 24-hour window

### Error Handling Strategy
```typescript
try {
  await this.whatsappApi.sendMessage(payload);
} catch (error) {
  if (error.response?.data?.error?.code === 131047) {
    // 24-hour window expired - use template
    await this.sendTemplateMessage(/* ... */);
  } else if (error.response?.data?.error?.code === 4) {
    // Rate limited - retry with backoff
    await this.retryWithBackoff(/* ... */);
  } else {
    // Log and re-throw
    this.logger.error('WhatsApp send failed:', error);
    throw error;
  }
}
```

---

## Summary

### Integration Points
1. **Configuration**: `WhatsAppConfig` entity stores credentials
2. **Message Sending**: `WhatsAppApiService` handles HTTP requests
3. **Webhook Processing**: `WebhooksModule` receives and processes webhooks
4. **Signature Verification**: `WebhookSignatureService` validates webhook authenticity
5. **Message Parsing**: `WebhookParserService` transforms webhook payloads
6. **Chatbot Execution**: `ChatBotExecutionService` processes user responses

### Message Flow
**Outbound**: ChatBot → WhatsAppMessageService → WhatsAppApiService → WhatsApp API
**Inbound**: WhatsApp → Webhook → WebhookProcessor → ChatBotExecution → Response

---

**Next**: See `07-project-structure.md` for complete directory organization.
