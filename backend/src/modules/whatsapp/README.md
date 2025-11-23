# WhatsApp Module

Bu modül, WhatsApp Business Messaging API ile entegrasyon için yapısal ve ölçeklenebilir bir çözüm sunar.

## Özellikler

- ✅ **Modüler Yapı**: Her mesaj tipi için ayrı servisler
- ✅ **Type Safety**: TypeScript DTOs ve interfaces
- ✅ **Error Handling**: Custom exception handling ve error mapping
- ✅ **Configuration Management**: Centralized config service
- ✅ **Logging**: Structured logging ile detaylı log kayıtları
- ✅ **Validation**: DTO validation ile input validation

## Klasör Yapısı

```
whatsapp/
├── services/                    # Core services
│   ├── whatsapp-api.service.ts    # Base API client
│   ├── whatsapp-flow.service.ts   # Flow yönetimi
│   ├── whatsapp-message.service.ts # Message orchestrator
│   └── message-types/             # Message type services
│       ├── flow-message.service.ts
│       └── text-message.service.ts
├── dto/                         # Data Transfer Objects
│   └── requests/
│       ├── create-flow.dto.ts
│       ├── send-flow-message.dto.ts
│       └── send-text-message.dto.ts
├── interfaces/                  # TypeScript interfaces
│   ├── flow.interface.ts
│   ├── message.interface.ts
│   └── whatsapp-api.interface.ts
├── exceptions/                  # Custom exceptions
│   └── whatsapp-api.exception.ts
├── utils/                       # Utilities
│   ├── api-error-mapper.util.ts
│   └── phone-number.util.ts
└── whatsapp.module.ts
```

## Kullanım

### 1. Flow Yönetimi

```typescript
import { WhatsAppFlowService } from './modules/whatsapp/services/whatsapp-flow.service';

// Flow oluştur
const flow = await flowService.createFlow({
  name: 'My Flow',
  categories: ['APPOINTMENT_BOOKING'],
  flowJson: flowJsonObject,
});

// Flow'u publish et
await flowService.publishFlow(flow.id);

// Health status kontrol et
const health = await flowService.getHealthStatus(flow.id);

// Preview URL al
const previewUrl = await flowService.getPreviewUrl(flow.id);
```

### 2. Mesaj Gönderme

```typescript
import { WhatsAppMessageService } from './modules/whatsapp/services/whatsapp-message.service';

// Flow mesajı gönder
const response = await messageService.sendFlowMessage({
  to: '905551234567',
  flowId: 'FLOW_ID',
  header: 'Header Text',
  body: 'Body text',
  footer: 'Footer text',
  ctaText: 'Action Button',
  mode: 'navigate',
  initialScreen: 'START',
});

// Text mesajı gönder
const textResponse = await messageService.sendTextMessage({
  to: '905551234567',
  text: 'Hello World!',
  previewUrl: true,
});
```

### 3. Script Kullanımı

```bash
# Flow publish et
npm run flow:publish

# Test mesajı gönder
npm run flow:send-test -- --to=905551234567

# Flow ID ile test mesajı gönder
npm run flow:send-test -- --flow-id=FLOW_ID --to=905551234567
```

## Hata Yönetimi

WhatsApp API hataları otomatik olarak map edilir ve anlamlı hata mesajları döner:

```typescript
try {
  await messageService.sendFlowMessage(dto);
} catch (error) {
  if (error instanceof WhatsAppApiException) {
    console.error('WhatsApp Error:', error.message);
    console.error('Error Code:', error.errorCode);
    console.error('Details:', error.details);
  }
}
```

## Environment Variables

`.env` dosyasında aşağıdaki değişkenleri tanımlayın:

```env
WHATSAPP_ACCESS_TOKEN=your_token
PHONE_NUMBER_ID=your_phone_id
WABA_ID=your_waba_id
WEBHOOK_VERIFY_TOKEN=your_verify_token
FLOW_ENDPOINT_URL=https://your-domain.com/flow-webhook
```

## Best Practices

1. **Phone Number Formatting**: `PhoneNumberUtil.format()` kullanın
2. **Error Handling**: Try-catch blokları ile hataları yakalayın
3. **Type Safety**: DTO'ları kullanın, `any` type'dan kaçının
4. **Logging**: Service içindeki logger'ları kullanın
5. **Configuration**: Environment variables'ları doğrudan kullanmayın, ConfigService kullanın

## Gelecek Geliştirmeler

- [ ] Template message service
- [ ] Interactive message service (buttons, lists)
- [ ] Media message service (image, video, document)
- [ ] Webhook signature verification
- [ ] Rate limiting
- [ ] Message builders (fluent API)
- [ ] Retry logic
- [ ] Unit tests
- [ ] E2E tests
