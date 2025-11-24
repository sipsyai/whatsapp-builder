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

### 4. WhatsApp Flow Messages
**Service**: `InteractiveMessageService`
**File**: `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/services/message-types/interactive-message.service.ts`

WhatsApp Flows enable interactive forms with multiple screens, input validation, and data collection.

```typescript
async sendFlowMessage(dto: SendFlowMessageDto): Promise<MessageResponse> {
  const payload = {
    messaging_product: "whatsapp",
    to: dto.to,
    type: "interactive",
    interactive: {
      type: "flow",
      header: dto.headerText ? { type: "text", text: dto.headerText } : undefined,
      body: { text: dto.bodyText },
      footer: dto.footerText ? { text: dto.footerText } : undefined,
      action: {
        name: "flow",
        parameters: {
          flow_message_version: "3",
          flow_token: dto.flowToken,  // "{contextId}-{nodeId}" for tracking
          flow_id: dto.flowId,        // WhatsApp Flow ID from Meta
          flow_cta: dto.flowCta,      // Button text (e.g., "Fill Form")
          flow_action: dto.flowAction, // "navigate" or "data_exchange"
          mode: dto.mode,             // "draft" or "published"
        },
      },
    },
  };

  return await this.whatsappApi.sendMessage(payload);
}
```

**Flow Token Structure**:
- Format: `{conversationContextId}-{currentNodeId}`
- Purpose: Track which ChatBot context and node triggered the Flow
- Used to resume ChatBot execution after Flow completion

**Flow Modes**:
- **draft**: Test mode (requires preview URL from WhatsApp)
- **published**: Production mode (available to all users)

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
        parsed.interactiveType = msg.interactive.type;

        if (msg.interactive.type === 'button_reply') {
          parsed.text = msg.interactive.button_reply.title;
          parsed.buttonId = msg.interactive.button_reply.id;
        } else if (msg.interactive.type === 'list_reply') {
          parsed.text = msg.interactive.list_reply.title;
          parsed.listRowId = msg.interactive.list_reply.id;
        } else if (msg.interactive.type === 'nfm_reply') {
          // Flow response
          parsed.text = 'Flow Response';
          parsed.flowToken = msg.interactive.nfm_reply.response_json.flow_token;
          parsed.flowResponseData = msg.interactive.nfm_reply.response_json;
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
      // Handle Flow response separately
      if (msg.interactiveType === 'nfm_reply') {
        await this.processFlowResponse(conversation.id, msg);
      } else {
        await this.executionService.processUserResponse(
          conversation.id,
          msg.text,
          msg.buttonId,
          msg.listRowId,
        );
      }
    }
  }
}

async processFlowResponse(conversationId: string, msg: ParsedMessageDto): Promise<void> {
  // Parse flow_token: "{contextId}-{nodeId}"
  const [contextId, nodeId] = msg.flowToken.split('-');

  // Load conversation context
  const context = await this.contextRepo.findOne({
    where: { id: contextId },
    relations: ['chatbot'],
  });

  if (!context) {
    this.logger.error(`Context not found for flow_token: ${msg.flowToken}`);
    return;
  }

  // Save Flow response to context variables
  const flowOutputVariable = context.variables._currentFlowOutputVariable || 'flowData';
  context.variables[flowOutputVariable] = msg.flowResponseData;

  await this.contextRepo.save(context);

  // Resume ChatBot execution from next node
  await this.executionService.executeCurrentNode(context);
}
```

---

## Flow Endpoint

WhatsApp Flows support server-side endpoints for dynamic data exchange during user interactions.

### Flow Endpoint Controller
**File**: `/home/ali/whatsapp-builder/backend/src/modules/webhooks/flow-endpoint.controller.ts`

```typescript
@Controller('api/webhooks/flow-endpoint')
export class FlowEndpointController {
  @Post()
  async handleFlowWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature: string,
    @Body() body: any,
  ): Promise<any> {
    // 1. Verify signature
    await this.encryptionService.verifySignature(signature, req.rawBody);

    // 2. Decrypt request
    const decryptedRequest = await this.encryptionService.decryptRequest(
      body.encrypted_flow_data,
      body.encrypted_aes_key,
      body.initial_vector,
    );

    // 3. Process action
    const response = await this.flowEndpointService.handleAction(
      decryptedRequest.action,
      decryptedRequest.flow_token,
      decryptedRequest.data,
    );

    // 4. Encrypt response
    const encryptedResponse = await this.encryptionService.encryptResponse(
      response,
      body.encrypted_aes_key,
      body.initial_vector,
    );

    return {
      version: decryptedRequest.version,
      data: encryptedResponse.encryptedData,
      encrypted_flow_data_exchange_tag: encryptedResponse.tag,
    };
  }
}
```

### Flow Actions

**FlowEndpointService** handles different action types:

```typescript
async handleAction(action: string, flowToken: string, data: any): Promise<any> {
  switch (action) {
    case 'INIT':
      // Return first screen of Flow
      return {
        screen: 'WELCOME_SCREEN',
        data: {
          // Pre-populate fields if needed
        },
      };

    case 'data_exchange':
      // Process form submission
      // Validate data
      // Return next screen or completion
      return {
        screen: 'SUCCESS',
        data: {
          message: 'Form submitted successfully',
        },
      };

    case 'BACK':
      // Handle backward navigation
      return {
        screen: 'PREVIOUS_SCREEN',
        data: {},
      };

    case 'error_notification':
      // Log error from Flow
      this.logger.error('Flow error:', data);
      return {};

    case 'ping':
      // Health check
      return { version: '3.0' };

    default:
      throw new BadRequestException(`Unknown action: ${action}`);
  }
}
```

---

## Flow Encryption & Security

WhatsApp Flows use **RSA + AES encryption** for secure data exchange.

### Encryption Service
**File**: `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/services/flow-encryption.service.ts`

### Architecture
```
                    WhatsApp                          Your Server
                       │                                    │
                       │  1. Generate AES key              │
                       │  2. Encrypt request with AES      │
                       │  3. Encrypt AES key with RSA      │
                       │────────────────────────────────>  │
                       │                                    │
                       │                                 4. Decrypt AES key with RSA private key
                       │                                 5. Decrypt request with AES key
                       │                                 6. Process request
                       │                                 7. Encrypt response with same AES key
                       │  <────────────────────────────────│
                       │  8. Decrypt response with AES key │
```

### Decryption (Incoming Requests)

```typescript
async decryptRequest(
  encryptedFlowData: string,
  encryptedAesKey: string,
  initialVector: string,
): Promise<any> {
  // 1. Decrypt AES key using RSA private key
  const aesKeyBuffer = crypto.privateDecrypt(
    {
      key: this.privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(encryptedAesKey, 'base64'),
  );

  // 2. Decrypt request body using AES-128-GCM
  const decipher = crypto.createDecipheriv(
    'aes-128-gcm',
    aesKeyBuffer,
    Buffer.from(initialVector, 'base64'),
  );

  const encryptedBuffer = Buffer.from(encryptedFlowData, 'base64');
  const authTag = encryptedBuffer.slice(-16);  // Last 16 bytes
  const ciphertext = encryptedBuffer.slice(0, -16);

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString('utf-8'));
}
```

### Encryption (Outgoing Responses)

```typescript
async encryptResponse(
  response: any,
  encryptedAesKey: string,
  initialVector: string,
): Promise<{ encryptedData: string; tag: string }> {
  // 1. Decrypt AES key (same as above)
  const aesKeyBuffer = crypto.privateDecrypt(/* ... */);

  // 2. Encrypt response using AES-128-GCM
  const cipher = crypto.createCipheriv(
    'aes-128-gcm',
    aesKeyBuffer,
    Buffer.from(initialVector, 'base64'),
  );

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(response), 'utf-8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encryptedData: Buffer.concat([encrypted, authTag]).toString('base64'),
    tag: authTag.toString('base64'),
  };
}
```

### Signature Verification

```typescript
async verifySignature(signature: string, rawBody: Buffer): Promise<void> {
  const expectedSignature = crypto
    .createHmac('sha256', this.appSecret)
    .update(rawBody)
    .digest('hex');

  const receivedSignature = signature?.replace('sha256=', '');

  if (expectedSignature !== receivedSignature) {
    throw new UnauthorizedException('Invalid Flow endpoint signature');
  }
}
```

### RSA Key Pair Management

**Generate Keys**:
```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -pubout -out public.pem
```

**Environment Configuration**:
```bash
WHATSAPP_FLOW_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

**Upload Public Key to WhatsApp**:
- Navigate to WhatsApp Manager → Flows → Settings
- Upload `public.pem`
- WhatsApp will use this to encrypt AES keys

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
7. **Flow Management**: `FlowsModule` manages WhatsApp Flows lifecycle
8. **Flow Endpoint**: `FlowEndpointController` handles Flow data exchange
9. **Flow Encryption**: `FlowEncryptionService` handles RSA + AES encryption

### Message Flow
**Outbound**: ChatBot → WhatsAppMessageService → WhatsAppApiService → WhatsApp API
**Inbound**: WhatsApp → Webhook → WebhookProcessor → ChatBotExecution → Response

### Flow Execution Flow
**Send Flow**: ChatBot (WhatsAppFlowNode) → Generate flow_token → Send Flow message → Wait
**User Interaction**: User opens Flow → WhatsApp calls Flow Endpoint → Decrypt → Process → Encrypt → Return
**Flow Completion**: User submits → WhatsApp sends webhook → Parse flow_token → Extract data → Resume ChatBot

---

**Next**: See `07-project-structure.md` for complete directory organization.
