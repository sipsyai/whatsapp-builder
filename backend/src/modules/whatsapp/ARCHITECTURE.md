# WhatsApp Business Messaging API Integration Architecture

## Overview

This document provides a comprehensive analysis of the WhatsApp Business Messaging API integration in the whatsapp-builder project. The module follows a modular, service-oriented architecture with strong TypeScript typing, validation, and error handling.

**Module Path:** `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/`

---

## 1. API Client Setup and Authentication

### Core Service: `WhatsAppApiService`

**File:** `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/services/whatsapp-api.service.ts`

The `WhatsAppApiService` is the foundational API client that handles all HTTP communication with the WhatsApp Business API.

#### Authentication Configuration

The service uses a dual-configuration strategy:

1. **Database Configuration** (Primary)
   - Stored in `WhatsAppConfig` entity
   - Loaded on module initialization via `onModuleInit()`
   - Supports runtime reloading via `reloadConfiguration()`

2. **Environment Variables** (Fallback)
   - `WHATSAPP_ACCESS_TOKEN`: Bearer token for API authentication
   - `PHONE_NUMBER_ID`: WhatsApp Business phone number ID
   - `WABA_ID`: WhatsApp Business Account ID

```typescript
// Authentication initialization
constructor(
  private readonly configService: ConfigService,
  @InjectRepository(WhatsAppConfig)
  private readonly configRepository: Repository<WhatsAppConfig>,
) {
  this.apiVersion = this.configService.get<string>('whatsapp.apiVersion') || 'v18.0';
  this.baseUrl = this.configService.get<string>('whatsapp.baseUrl') ||
                 'https://graph.facebook.com';
  this.accessToken = this.configService.get<string>('whatsapp.accessToken') || '';
  this.phoneNumberId = this.configService.get<string>('whatsapp.phoneNumberId') || '';
}
```

#### Axios Instance Configuration

```typescript
private initializeAxiosInstance() {
  this.axiosInstance = axios.create({
    baseURL: `${this.baseUrl}/${this.apiVersion}`,  // https://graph.facebook.com/v18.0
    timeout: 30000,                                   // 30 second timeout
    headers: {
      Authorization: `Bearer ${this.accessToken}`,   // Bearer token auth
      'Content-Type': 'application/json',
    },
  });

  // Request logging interceptor
  this.axiosInstance.interceptors.request.use(
    (config) => {
      this.logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Error handling interceptor
  this.axiosInstance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => this.handleApiError(error),
  );
}
```

#### Key Features

- **Dynamic Configuration Reloading**: Configuration can be updated at runtime without restarting
- **Request/Response Interceptors**: Automatic logging and error handling
- **Generic HTTP Methods**: Abstracted `get()`, `post()`, `delete()` methods
- **Type-Safe Responses**: Supports TypeScript generics for response typing

#### Configuration Management Service

**File:** `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/services/whatsapp-config.service.ts`

This service manages configuration CRUD operations and includes connection testing:

```typescript
// Test WhatsApp API connection
async testConnection(
  phoneNumberId?: string,
  accessToken?: string,
): Promise<TestConnectionResponseDto> {
  // Tests credentials by fetching phone number details
  const response = await axios.get(
    `${baseUrl}/${apiVersion}/${testPhoneNumberId}`,
    {
      params: { fields: 'verified_name,display_phone_number' },
      headers: { Authorization: `Bearer ${testAccessToken}` },
      timeout: 10000,
    },
  );

  return {
    success: true,
    message: 'Connection successful',
    phoneNumber: response.data.display_phone_number,
    verifiedName: response.data.verified_name,
  };
}
```

---

## 2. Message Types Supported

### Message Orchestrator: `WhatsAppMessageService`

**File:** `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/services/whatsapp-message.service.ts`

This service acts as a facade/orchestrator for different message type services.

```typescript
@Injectable()
export class WhatsAppMessageService {
  constructor(
    private readonly flowMessageService: FlowMessageService,
    private readonly textMessageService: TextMessageService,
    private readonly interactiveMessageService: InteractiveMessageService,
  ) {}

  async sendFlowMessage(dto: SendFlowMessageDto): Promise<MessageResponse> {
    return this.flowMessageService.sendFlowMessage(dto);
  }

  async sendTextMessage(dto: SendTextMessageDto): Promise<MessageResponse> {
    return this.textMessageService.sendTextMessage(dto);
  }
}
```

### Supported Message Types

Based on the codebase analysis:

#### Currently Implemented

| Type | Service | DTO | Status |
|------|---------|-----|--------|
| Text | `TextMessageService` | `SendTextMessageDto` | ✅ Implemented |
| Flow | `FlowMessageService` | `SendFlowMessageDto` | ✅ Implemented |
| Interactive Buttons | `InteractiveMessageService` | `SendInteractiveButtonDto` | ✅ Implemented |
| Interactive Lists | `InteractiveMessageService` | `SendInteractiveListDto` | ✅ Implemented |

#### Defined in Enums (Not Yet Implemented)

**File:** `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/interfaces/message.interface.ts`

```typescript
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',          // Not implemented
  VIDEO = 'video',          // Not implemented
  AUDIO = 'audio',          // Not implemented
  DOCUMENT = 'document',    // Not implemented
  STICKER = 'sticker',      // Not implemented
  LOCATION = 'location',    // Not implemented
  CONTACTS = 'contacts',    // Not implemented
  INTERACTIVE = 'interactive',
  TEMPLATE = 'template',    // Not implemented
  REACTION = 'reaction',    // Not implemented
}

export enum InteractiveType {
  BUTTON = 'button',
  LIST = 'list',
  FLOW = 'flow',
  CTA_URL = 'cta_url',                         // Not implemented
  LOCATION_REQUEST_MESSAGE = 'location_request_message',  // Not implemented
}
```

---

## 3. Message Sending Services

### 3.1 Text Message Service

**File:** `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/services/message-types/text-message.service.ts`

```typescript
async sendTextMessage(dto: SendTextMessageDto): Promise<MessageResponse> {
  this.logger.log(`Sending text message to ${dto.to}`);

  // Validate and format phone number
  if (!PhoneNumberUtil.isValid(dto.to)) {
    throw new Error(`Invalid phone number format: ${dto.to}`);
  }

  const formattedPhone = PhoneNumberUtil.format(dto.to);

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'text',
    text: {
      preview_url: dto.previewUrl ?? false,  // Enable link previews
      body: dto.text,
    },
  };

  return this.apiService.sendMessage(payload);
}
```

**DTO:** `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/dto/requests/send-text-message.dto.ts`

```typescript
export class SendTextMessageDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsBoolean()
  @IsOptional()
  previewUrl?: boolean;
}
```

**Example Usage:**

```typescript
const response = await messageService.sendTextMessage({
  to: '905551234567',
  text: 'Hello from WhatsApp Business API!',
  previewUrl: true,
});
```

### 3.2 Flow Message Service

**File:** `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/services/message-types/flow-message.service.ts`

WhatsApp Flows are interactive, multi-screen experiences that can be embedded in chat messages.

```typescript
async sendFlowMessage(dto: SendFlowMessageDto): Promise<MessageResponse> {
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'interactive',
    interactive: {
      type: 'flow',
      header: dto.header ? { type: 'text', text: dto.header } : undefined,
      body: { text: dto.body },
      footer: dto.footer ? { text: dto.footer } : undefined,
      action: {
        name: 'flow',
        parameters: {
          flow_message_version: '3',
          flow_token: dto.flowToken || `FLOW_TOKEN_${Date.now()}`,
          flow_id: dto.flowId,
          flow_cta: dto.ctaText,
          flow_action: dto.mode || 'navigate',
          flow_action_payload: dto.initialScreen ? {
            screen: dto.initialScreen,
            data: dto.initialData || {},
          } : undefined,
        },
      },
    },
  };

  return this.apiService.sendMessage(payload);
}
```

**DTO:** `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/dto/requests/send-flow-message.dto.ts`

```typescript
export enum FlowMode {
  NAVIGATE = 'navigate',
  DATA_EXCHANGE = 'data_exchange',
}

export class SendFlowMessageDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  flowId: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString()
  @IsNotEmpty()
  ctaText: string;

  @IsString()
  @IsOptional()
  header?: string;

  @IsString()
  @IsOptional()
  footer?: string;

  @IsString()
  @IsOptional()
  flowToken?: string;

  @IsEnum(FlowMode)
  @IsOptional()
  mode?: FlowMode;

  @IsString()
  @IsOptional()
  initialScreen?: string;

  @IsObject()
  @IsOptional()
  initialData?: Record<string, any>;
}
```

**Example Usage:**

```typescript
const response = await messageService.sendFlowMessage({
  to: '905551234567',
  flowId: '123456789',
  header: 'Book Appointment',
  body: 'Schedule your appointment easily',
  footer: 'Available 24/7',
  ctaText: 'Start Booking',
  mode: FlowMode.NAVIGATE,
  initialScreen: 'WELCOME_SCREEN',
  initialData: { userId: '123' },
});
```

---

## 4. Interactive Message Implementation

### 4.1 Interactive Button Messages

**File:** `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/services/message-types/interactive-message.service.ts`

Supports up to 3 reply buttons per message.

```typescript
async sendButtonMessage(dto: SendInteractiveButtonDto): Promise<MessageResponse> {
  const interactive: any = {
    type: 'button',
    body: { text: dto.bodyText },
    action: {
      buttons: dto.buttons.map((button) => ({
        type: 'reply',
        reply: {
          id: button.id,
          title: button.title,  // Max 20 characters
        },
      })),
    },
  };

  // Add optional header (max 60 chars)
  if (dto.headerText) {
    interactive.header = { type: 'text', text: dto.headerText };
  }

  // Add optional footer (max 60 chars)
  if (dto.footerText) {
    interactive.footer = { text: dto.footerText };
  }

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'interactive',
    interactive,
  };

  return this.apiService.sendMessage(payload);
}
```

**DTO:** `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/dto/requests/send-interactive-message.dto.ts`

```typescript
export class ButtonItem {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20, { message: 'Button title cannot exceed 20 characters' })
  title: string;
}

export class SendInteractiveButtonDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  bodyText: string;

  @IsString()
  @IsOptional()
  @MaxLength(60, { message: 'Header text cannot exceed 60 characters' })
  headerText?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60, { message: 'Footer text cannot exceed 60 characters' })
  footerText?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ButtonItem)
  @ArrayMinSize(1, { message: 'Must have at least 1 button' })
  @ArrayMaxSize(3, { message: 'Cannot have more than 3 buttons' })
  buttons: ButtonItem[];
}
```

**Example Usage:**

```typescript
const response = await interactiveMessageService.sendButtonMessage({
  to: '905551234567',
  headerText: 'Order Status',
  bodyText: 'How would you like to proceed?',
  footerText: 'Reply within 24 hours',
  buttons: [
    { id: 'track', title: 'Track Order' },
    { id: 'cancel', title: 'Cancel Order' },
    { id: 'support', title: 'Contact Support' },
  ],
});
```

### 4.2 Interactive List Messages

Supports up to 10 sections, each with up to 10 rows (max 10 rows total across all sections).

```typescript
async sendListMessage(dto: SendInteractiveListDto): Promise<MessageResponse> {
  const interactive: any = {
    type: 'list',
    body: { text: dto.bodyText },
    action: {
      button: dto.listButtonText,  // Max 20 characters
      sections: dto.sections.map((section) => ({
        title: section.title,  // Max 24 characters
        rows: section.rows.map((row) => ({
          id: row.id,
          title: row.title,  // Max 24 characters
          ...(row.description && { description: row.description }),  // Max 72 chars
        })),
      })),
    },
  };

  // Add optional header and footer
  if (dto.headerText) {
    interactive.header = { type: 'text', text: dto.headerText };
  }
  if (dto.footerText) {
    interactive.footer = { text: dto.footerText };
  }

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'interactive',
    interactive,
  };

  return this.apiService.sendMessage(payload);
}
```

**DTO Validation:**

```typescript
export class RowItem {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(24, { message: 'Row title cannot exceed 24 characters' })
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(72, { message: 'Row description cannot exceed 72 characters' })
  description?: string;
}

export class SectionItem {
  @IsString()
  @IsNotEmpty()
  @MaxLength(24, { message: 'Section title cannot exceed 24 characters' })
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RowItem)
  @ArrayMinSize(1, { message: 'Section must have at least 1 row' })
  @ArrayMaxSize(10, { message: 'Section cannot have more than 10 rows' })
  rows: RowItem[];
}

export class SendInteractiveListDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  bodyText: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20, { message: 'List button text cannot exceed 20 characters' })
  listButtonText: string;

  @IsString()
  @IsOptional()
  @MaxLength(60, { message: 'Header text cannot exceed 60 characters' })
  headerText?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60, { message: 'Footer text cannot exceed 60 characters' })
  footerText?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionItem)
  @ArrayMinSize(1, { message: 'Must have at least 1 section' })
  @ArrayMaxSize(10, { message: 'Cannot have more than 10 sections' })
  sections: SectionItem[];
}
```

**Example Usage:**

```typescript
const response = await interactiveMessageService.sendListMessage({
  to: '905551234567',
  headerText: 'Restaurant Menu',
  bodyText: 'Choose your favorite dish',
  footerText: 'Delivery available',
  listButtonText: 'View Menu',
  sections: [
    {
      title: 'Main Courses',
      rows: [
        {
          id: 'pasta',
          title: 'Pasta Carbonara',
          description: 'Classic Italian creamy pasta',
        },
        {
          id: 'steak',
          title: 'Ribeye Steak',
          description: '300g premium beef',
        },
      ],
    },
    {
      title: 'Desserts',
      rows: [
        {
          id: 'tiramisu',
          title: 'Tiramisu',
          description: 'Italian coffee dessert',
        },
      ],
    },
  ],
});
```

---

## 5. Media Upload Handling

### Current Status: Not Implemented

Based on the codebase analysis, media message support (image, video, document, audio) is **not currently implemented** but is planned for future development.

**Evidence from README:**

```markdown
## Gelecek Geliştirmeler (Future Developments)

- [ ] Template message service
- [ ] Interactive message service (buttons, lists) ✅ NOW IMPLEMENTED
- [ ] Media message service (image, video, document)
- [ ] Webhook signature verification
- [ ] Rate limiting
```

### Expected Implementation Pattern

Based on the existing architecture, media messages would follow this pattern:

**Expected File:** `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/services/message-types/media-message.service.ts`

```typescript
// Expected implementation (not yet implemented)
export class MediaMessageService {
  async sendImageMessage(dto: SendImageMessageDto): Promise<MessageResponse> {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'image',
      image: {
        link: dto.imageUrl,  // OR id: mediaId for uploaded media
        caption: dto.caption,
      },
    };
    return this.apiService.sendMessage(payload);
  }

  async uploadMedia(file: Buffer, mimeType: string): Promise<{ id: string }> {
    // WhatsApp Media Upload API
    // POST /{phone-number-id}/media
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', mimeType);
    formData.append('messaging_product', 'whatsapp');

    return this.apiService.post(`/${phoneNumberId}/media`, formData);
  }
}
```

### WhatsApp Media Upload Process

1. **Upload media file** to WhatsApp servers
2. Receive **media ID**
3. **Send message** with media ID reference

**API Endpoints:**

- Upload: `POST /{phone-number-id}/media`
- Send: `POST /{phone-number-id}/messages` with media object

---

## 6. API Error Handling

### Error Handling Architecture

The module implements a three-layer error handling system:

#### Layer 1: Axios Response Interceptor

**File:** `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/services/whatsapp-api.service.ts`

```typescript
// Add response interceptor for error handling
this.axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => this.handleApiError(error),
);

private handleApiError(error: AxiosError): never {
  this.logger.error('WhatsApp API Error:', {
    status: error.response?.status,
    data: error.response?.data,
    url: error.config?.url,
  });

  const mappedError = ApiErrorMapper.mapError(error);
  throw new WhatsAppApiException(
    mappedError.message,
    mappedError.code,
    mappedError.statusCode,
    mappedError.details,
  );
}
```

#### Layer 2: Error Mapper

**File:** `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/utils/api-error-mapper.util.ts`

Maps WhatsApp API error codes to user-friendly messages:

```typescript
export class ApiErrorMapper {
  private static readonly ERROR_MAP: Record<number, string> = {
    131047: 'Re-engagement message required (24-hour window closed)',
    131026: 'Message undeliverable',
    131031: 'Rate limit exceeded',
    132000: 'Template paused due to quality issues',
    133016: 'Phone number not registered on WhatsApp',
    136000: 'Template does not exist',
    136001: 'Template is paused',
    136015: 'Template is disabled',
    80007: 'Rate limit hit',
    100: 'Invalid parameter',
    190: 'Access token has expired',
    368: 'Temporarily blocked for policies violations',
  };

  static mapError(error: AxiosError): MappedError {
    const responseData: any = error.response?.data;
    const errorCode = responseData?.error?.code;
    const errorMessage = responseData?.error?.message;

    const mappedMessage = errorCode
      ? this.ERROR_MAP[errorCode] || errorMessage
      : error.message;

    return {
      message: mappedMessage,
      code: errorCode?.toString() || 'UNKNOWN_ERROR',
      statusCode: this.mapHttpStatus(error.response?.status),
      details: responseData?.error,
    };
  }

  private static mapHttpStatus(status?: number): HttpStatus {
    if (!status) return HttpStatus.INTERNAL_SERVER_ERROR;
    if (status >= 500) return HttpStatus.SERVICE_UNAVAILABLE;
    if (status === 429) return HttpStatus.TOO_MANY_REQUESTS;
    if (status === 401 || status === 403) return HttpStatus.UNAUTHORIZED;
    if (status === 404) return HttpStatus.NOT_FOUND;
    return HttpStatus.BAD_REQUEST;
  }
}
```

#### Layer 3: Custom Exception

**File:** `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/exceptions/whatsapp-api.exception.ts`

```typescript
export class WhatsAppApiException extends HttpException {
  constructor(
    message: string,
    public readonly errorCode?: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: any,
  ) {
    super(
      {
        statusCode,
        message,
        errorCode,
        details,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }
}
```

### Error Handling Example

```typescript
try {
  await messageService.sendTextMessage({
    to: '905551234567',
    text: 'Hello',
  });
} catch (error) {
  if (error instanceof WhatsAppApiException) {
    console.error('WhatsApp Error:', error.message);
    console.error('Error Code:', error.errorCode);
    console.error('Status Code:', error.getStatus());
    console.error('Details:', error.details);

    // Handle specific errors
    if (error.errorCode === '131047') {
      // 24-hour window closed - send template message instead
    } else if (error.errorCode === '131031') {
      // Rate limit - implement retry with backoff
    }
  }
}
```

### Common WhatsApp API Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 131047 | Re-engagement required | 24-hour customer service window closed |
| 131026 | Message undeliverable | User's phone is offline or invalid |
| 131031 | Rate limit exceeded | Too many messages sent |
| 132000 | Template paused | Template quality issues |
| 133016 | Phone not registered | Recipient not on WhatsApp |
| 190 | Access token expired | Authentication token needs refresh |
| 368 | Temporarily blocked | Policy violations detected |

---

## 7. Rate Limiting Considerations

### Current Status: Not Implemented

Rate limiting is listed as a future development in the README:

```markdown
## Gelecek Geliştirmeler (Future Developments)
- [ ] Rate limiting
```

### WhatsApp API Rate Limits

While not explicitly handled in the code, WhatsApp enforces several rate limits:

#### Messaging Rate Limits

1. **Tier-based limits** (Business Verification Level):
   - Tier 1: 1,000 unique customers/24h
   - Tier 2: 10,000 unique customers/24h
   - Tier 3: 100,000 unique customers/24h
   - Unlimited: No limit

2. **Throughput limits**:
   - 80 messages/second
   - 1,000 messages/hour (varies by tier)

3. **Template message limits**:
   - Different from session messages
   - Based on quality rating

#### Current Error Handling

The `ApiErrorMapper` includes rate limit error codes:

```typescript
131031: 'Rate limit exceeded',
80007: 'Rate limit hit',
```

### Recommended Implementation

For production, implement:

1. **Request Queue with Throttling**
2. **Exponential Backoff Retry**
3. **Circuit Breaker Pattern**
4. **Redis-based Rate Limiter**

**Example Pattern:**

```typescript
// Future implementation suggestion
import { Throttle } from '@nestjs/throttler';

@Injectable()
export class WhatsAppMessageService {
  @Throttle(80, 1000)  // 80 requests per 1000ms
  async sendMessage(payload: any): Promise<MessageResponse> {
    // Implementation
  }
}
```

---

## 8. Phone Number Validation

### PhoneNumberUtil

**File:** `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/utils/phone-number.util.ts`

```typescript
export class PhoneNumberUtil {
  /**
   * Format phone number to E.164 format (without +)
   * Removes all non-digit characters and leading +
   */
  static format(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.replace(/^\+/, '');
  }

  /**
   * Validate phone number format
   * Basic validation: should be 10-15 digits
   */
  static isValid(phone: string): boolean {
    const cleaned = this.format(phone);
    return /^\d{10,15}$/.test(cleaned);
  }

  /**
   * Add country code if not present
   */
  static addCountryCode(
    phone: string,
    defaultCountryCode: string = '90',  // Default: Turkey
  ): string {
    const cleaned = this.format(phone);

    // If already has country code, return as is
    if (cleaned.length > 10) {
      return cleaned;
    }

    // Add default country code
    return defaultCountryCode + cleaned;
  }
}
```

**Usage in Services:**

```typescript
// Validate and format phone number
if (!PhoneNumberUtil.isValid(dto.to)) {
  throw new Error(`Invalid phone number format: ${dto.to}`);
}

const formattedPhone = PhoneNumberUtil.format(dto.to);
```

---

## 9. Flow Management

### WhatsAppFlowService

**File:** `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/services/whatsapp-flow.service.ts`

Manages WhatsApp Flows lifecycle: creation, publishing, health monitoring, and deletion.

```typescript
@Injectable()
export class WhatsAppFlowService {
  constructor(
    private readonly apiService: WhatsAppApiService,
    private readonly configService: ConfigService,
  ) {
    this.wabaId = this.configService.get<string>('whatsapp.wabaId') || '';
  }

  /**
   * Create a new Flow
   */
  async createFlow(dto: CreateFlowDto): Promise<FlowResponse> {
    const payload = {
      name: dto.name,
      categories: dto.categories,
      flow_json: JSON.stringify(dto.flowJson),
      endpoint_uri: dto.endpointUri ||
                    this.configService.get('whatsapp.flowEndpointUrl'),
    };

    return this.apiService.post<FlowResponse>(`/${this.wabaId}/flows`, payload);
  }

  /**
   * Publish a Flow (make it available for use)
   */
  async publishFlow(flowId: string): Promise<{ success: boolean }> {
    return this.apiService.post(`/${flowId}/publish`, {});
  }

  /**
   * Get Flow details with validation errors
   */
  async getFlow(flowId: string, fields?: string[]): Promise<FlowDetails> {
    const fieldsParam = fields?.join(',') || 'id,name,status,validation_errors';
    return this.apiService.get(`/${flowId}?fields=${fieldsParam}`);
  }

  /**
   * Get Flow health status for specific phone number
   */
  async getHealthStatus(flowId: string): Promise<FlowHealthStatus> {
    const phoneNumberId = this.apiService.getPhoneNumberId();
    const data = await this.apiService.get<any>(
      `/${flowId}?fields=health_status.phone_number(${phoneNumberId})`,
    );
    return data.health_status;
  }

  /**
   * Get preview URL for testing Flow in WhatsApp
   */
  async getPreviewUrl(flowId: string, invalidate = false): Promise<string> {
    const data = await this.apiService.get<any>(
      `/${flowId}?fields=preview.invalidate(${invalidate})`,
    );
    return data.preview?.preview_url;
  }

  /**
   * Update Flow JSON or metadata
   */
  async updateFlow(
    flowId: string,
    dto: Partial<CreateFlowDto>,
  ): Promise<FlowResponse> {
    const payload: any = {};
    if (dto.name) payload.name = dto.name;
    if (dto.categories) payload.categories = dto.categories;
    if (dto.flowJson) payload.flow_json = JSON.stringify(dto.flowJson);
    if (dto.endpointUri) payload.endpoint_uri = dto.endpointUri;

    return this.apiService.post<FlowResponse>(`/${flowId}`, payload);
  }

  /**
   * Delete a Flow
   */
  async deleteFlow(flowId: string): Promise<{ success: boolean }> {
    return this.apiService.delete(`/${flowId}`);
  }
}
```

### Flow Interfaces

**File:** `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/interfaces/flow.interface.ts`

```typescript
export interface FlowResponse {
  id: string;
  success?: boolean;
  validation_errors?: FlowValidationError[];
}

export interface FlowDetails {
  id: string;
  name: string;
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED' | 'BLOCKED' | 'THROTTLED';
  categories: string[];
  validation_errors?: FlowValidationError[];
  preview?: {
    preview_url: string;
    expires_at: string;
  };
  health_status?: FlowHealthStatus;
}

export interface FlowHealthStatus {
  can_send_message: 'AVAILABLE' | 'BLOCKED' | 'THROTTLED';
  entities?: FlowHealthEntity[];
}

export interface FlowHealthError {
  error_code: string;
  error_description: string;
  possible_solution?: string;
}
```

---

## 10. Module Configuration

### NestJS Module Setup

**File:** `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/whatsapp.module.ts`

```typescript
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([WhatsAppConfig])
  ],
  controllers: [
    WhatsAppConfigController
  ],
  providers: [
    WhatsAppApiService,
    WhatsAppFlowService,
    WhatsAppMessageService,
    WhatsAppConfigService,
    FlowMessageService,
    TextMessageService,
    InteractiveMessageService,
  ],
  exports: [
    WhatsAppApiService,
    WhatsAppFlowService,
    WhatsAppMessageService,
    WhatsAppConfigService,
    TextMessageService,
    InteractiveMessageService,
  ],
})
export class WhatsAppModule {}
```

---

## 11. Best Practices Implemented

### 1. Type Safety
- DTOs with class-validator decorators
- TypeScript interfaces for API responses
- Generic types for API methods

### 2. Validation
- Input validation via DTOs
- Phone number format validation
- Character limits enforced at DTO level

### 3. Logging
- Structured logging with NestJS Logger
- Request/response logging via interceptors
- Error logging with context

### 4. Error Handling
- Custom exception classes
- Error code mapping
- Detailed error context preservation

### 5. Configuration Management
- Database-first configuration
- Environment variable fallback
- Runtime configuration reloading

### 6. Service Modularity
- Single responsibility per service
- Message type services separated
- Orchestrator pattern for coordination

---

## 12. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      WhatsApp Module                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         WhatsAppMessageService (Orchestrator)        │  │
│  └────────────┬────────────┬────────────┬───────────────┘  │
│               │            │            │                    │
│               ▼            ▼            ▼                    │
│  ┌──────────────┐ ┌─────────────┐ ┌──────────────────┐    │
│  │TextMessage   │ │FlowMessage  │ │InteractiveMessage│    │
│  │Service       │ │Service      │ │Service           │    │
│  └──────┬───────┘ └──────┬──────┘ └────────┬─────────┘    │
│         │                │                  │                │
│         └────────────────┼──────────────────┘                │
│                          ▼                                    │
│            ┌──────────────────────────┐                      │
│            │  WhatsAppApiService      │                      │
│            │  (Base HTTP Client)      │                      │
│            └────────────┬─────────────┘                      │
│                         │                                     │
│         ┌───────────────┼───────────────┐                   │
│         │               │               │                    │
│         ▼               ▼               ▼                    │
│  ┌──────────┐   ┌─────────────┐  ┌──────────────┐         │
│  │Error     │   │Phone Number │  │Config        │         │
│  │Mapper    │   │Util         │  │Service       │         │
│  └──────────┘   └─────────────┘  └──────────────┘         │
│         │                                 │                  │
│         ▼                                 ▼                  │
│  ┌──────────────┐              ┌────────────────┐          │
│  │WhatsAppApi   │              │WhatsAppConfig  │          │
│  │Exception     │              │Entity (DB)     │          │
│  └──────────────┘              └────────────────┘          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │   WhatsApp Business API        │
         │   graph.facebook.com/v18.0     │
         └────────────────────────────────┘
```

---

## 13. Summary of Implementation Status

### ✅ Implemented Features

- API client with authentication
- Configuration management (DB + env)
- Text messages
- Flow messages
- Interactive button messages (up to 3 buttons)
- Interactive list messages (up to 10 sections)
- Flow lifecycle management (create, publish, update, delete)
- Flow health monitoring
- Phone number validation
- Error handling and mapping
- Logging and debugging
- Type-safe DTOs and interfaces

### ⏳ Planned Features (Not Yet Implemented)

- Template messages
- Media messages (image, video, document, audio, sticker)
- Location messages
- Contact messages
- Reaction messages
- CTA URL buttons
- Location request messages
- Media upload service
- Rate limiting
- Webhook signature verification
- Message builders (fluent API)
- Retry logic with exponential backoff
- Unit tests
- E2E tests

---

## 14. Key Files Reference

| File Path | Purpose |
|-----------|---------|
| `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/services/whatsapp-api.service.ts` | Base API client and authentication |
| `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/services/whatsapp-message.service.ts` | Message orchestrator |
| `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/services/message-types/text-message.service.ts` | Text message implementation |
| `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/services/message-types/flow-message.service.ts` | Flow message implementation |
| `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/services/message-types/interactive-message.service.ts` | Interactive messages (buttons, lists) |
| `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/services/whatsapp-flow.service.ts` | Flow management |
| `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/services/whatsapp-config.service.ts` | Configuration management |
| `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/utils/api-error-mapper.util.ts` | Error code mapping |
| `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/utils/phone-number.util.ts` | Phone number validation |
| `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/exceptions/whatsapp-api.exception.ts` | Custom exception class |
| `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/interfaces/message.interface.ts` | Message type definitions |
| `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/interfaces/flow.interface.ts` | Flow type definitions |
| `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/dto/requests/send-text-message.dto.ts` | Text message DTO |
| `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/dto/requests/send-flow-message.dto.ts` | Flow message DTO |
| `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/dto/requests/send-interactive-message.dto.ts` | Interactive message DTOs |
| `/home/ali/whatsapp-builder/backend/src/modules/whatsapp/whatsapp.module.ts` | NestJS module configuration |

---

## Conclusion

This WhatsApp Business Messaging API integration follows a well-architected, modular design with strong TypeScript typing, comprehensive error handling, and separation of concerns. The codebase is production-ready for the implemented features (text, flow, and interactive messages) and provides a solid foundation for extending with additional message types like media, templates, and reactions.

The architecture emphasizes:
- **Maintainability**: Clear service boundaries and single responsibility
- **Type Safety**: Full TypeScript coverage with DTOs and interfaces
- **Reliability**: Comprehensive error handling and logging
- **Scalability**: Modular design allows easy addition of new message types
- **Best Practices**: Follows NestJS conventions and patterns
