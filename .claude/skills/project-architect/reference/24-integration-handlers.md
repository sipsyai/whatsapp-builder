# Integration Handlers - WhatsApp Flow Dynamic Data System

## Genel Bakis

Integration Handler sistemi, WhatsApp Flow'lardaki dropdown component'leri icin dinamik veri cekmek amaciyla tasarlanmis bir Strategy Pattern implementasyonudur. Bu sistem, farkli veri kaynaklarindan (Google Calendar, REST API, vb.) veri cekip WhatsApp Flow formatina donusturmeyi saglar.

## Mimari Yapi

```
WhatsApp Flow Request (data_exchange action)
        |
        v
FlowEndpointService.handleDataExchange()
        |
        v
IntegrationHandlerRegistry.fetchComponentData()
        |
        +---> GoogleCalendarIntegrationHandler
        |          - list_calendar_users
        |          - check_availability
        |          - get_events
        |          - get_today_events
        |          - get_tomorrow_events
        |
        +---> RestApiIntegrationHandler
        |          - DataSource based API calls
        |          - Variable interpolation
        |          - Dynamic endpoint building
        |
        +---> (Gelecek: OutlookCalendarHandler, StripeHandler, vb.)
        |
        v
IntegrationDataItem[] (id, title, description, enabled)
        |
        v
WhatsApp Flow Response (dropdown data)
```

## Dosya Yapisi

```
backend/src/modules/
├── flows/dto/
│   └── integration-config.dto.ts          # DTO tanimlari ve enum'lar
│       - IntegrationType enum
│       - IntegrationConfigDto (base)
│       - GoogleCalendarIntegrationConfigDto
│       - GoogleCalendarParamsDto
│       - TransformConfigDto
│       - FlowExecutionContextDto
│
└── webhooks/services/
    ├── flow-endpoint.service.ts           # Ana endpoint handler
    │
    └── integration-handlers/
        ├── index.ts                        # Barrel export
        ├── integration-handler.interface.ts    # Handler interface + IntegrationDataItem
        ├── integration-handler.registry.ts     # Handler registry + IntegrationError
        ├── integration-handlers.module.ts      # NestJS module
        ├── google-calendar.handler.ts          # Google Calendar handler
        └── rest-api.handler.ts                 # REST API handler
```

---

## IntegrationType Enum

```typescript
export enum IntegrationType {
  REST_API = 'rest_api',
  GOOGLE_CALENDAR = 'google_calendar',
  OUTLOOK_CALENDAR = 'outlook_calendar',     // Planlanmis
  STRIPE_PAYMENTS = 'stripe_payments',       // Planlanmis
  CUSTOM_WEBHOOK = 'custom_webhook',         // Planlanmis
}
```

---

## IntegrationConfigDto Yapisi

### Base Configuration

```typescript
export class IntegrationConfigDto {
  // WhatsApp Flow dropdown component adi
  // Flow JSON'daki data-source="${data.componentName}" ile eslesmelidir
  componentName: string;

  // Integration tipi (rest_api, google_calendar, vb.)
  integrationType: IntegrationType;

  // Veri kaynagi tipi
  // 'owner': Chatbot sahibinin verileri (context.chatbotUserId)
  // 'static': Sabit bir ID ile belirlenen kaynak (sourceId)
  // 'variable': Form data'dan alinan degisken (sourceVariable)
  sourceType: 'owner' | 'static' | 'variable';

  // Static source icin kaynak ID
  sourceId?: string;

  // Variable source icin degisken adi
  sourceVariable?: string;

  // Yapilacak islem (integration tipine gore degisir)
  action: string;

  // Action'a ozel parametreler
  params?: Record<string, any>;

  // Sonuc donusumu konfigurasyonu
  transformTo: TransformConfigDto;

  // Cascading dropdown icin bagimlilik
  dependsOn?: string;

  // Opsiyonel filter parametresi adi
  filterParam?: string;
}
```

### TransformConfigDto

```typescript
export class TransformConfigDto {
  idField: string;        // Dropdown'da id olarak kullanilacak alan
  titleField: string;     // Dropdown'da gorunecek baslik alani
  descriptionField?: string; // Opsiyonel aciklama alani
}
```

### GoogleCalendarParamsDto

```typescript
export class GoogleCalendarParamsDto {
  workingHoursStart?: string;  // "HH:mm" format, default: "09:00"
  workingHoursEnd?: string;    // "HH:mm" format, default: "18:00"
  slotDuration?: number;       // dakika, default: 60
  dateSource?: 'static' | 'variable';
  dateVariable?: string;       // dateSource='variable' icin
  staticDate?: string;         // "YYYY-MM-DD" format
  maxResults?: number;         // get_events icin, default: 50
}
```

### FlowExecutionContextDto

```typescript
export class FlowExecutionContextDto {
  flowToken?: string;       // WhatsApp Flow token
  contextId?: string;       // Conversation context ID
  nodeId?: string;          // Chatbot node ID
  chatbotUserId?: string;   // Chatbot sahibinin user ID'si (sourceType='owner' icin)
}
```

---

## Handler Interface

### IntegrationHandler

```typescript
export interface IntegrationHandler {
  /**
   * Bu handler'in verilen konfigurasyonu isleyip isleyemeyecegini belirler.
   */
  canHandle(config: IntegrationConfigDto): boolean;

  /**
   * Harici kaynaktan veri ceker ve WhatsApp Flow dropdown formatina donusturur.
   */
  fetchData(
    config: IntegrationConfigDto,
    formData: Record<string, any>,
    context?: FlowExecutionContextDto,
  ): Promise<IntegrationDataItem[]>;
}
```

### IntegrationDataItem

```typescript
export interface IntegrationDataItem {
  id: string;           // Dropdown seciminde donen deger
  title: string;        // Kullaniciya gosterilen baslik
  description?: string; // Opsiyonel aciklama metni
  enabled?: boolean;    // Bu secenek secilebilir mi (default: true)
}
```

---

## Google Calendar Handler

**Dosya:** `backend/src/modules/webhooks/services/integration-handlers/google-calendar.handler.ts`

### Desteklenen Action'lar

| Action | Aciklama | Source Type | Gerekli Parametreler |
|--------|----------|-------------|---------------------|
| `list_calendar_users` | Google Calendar baglantisi olan kullanicilari listeler | Herhangi | - |
| `check_availability` | Belirli bir tarih icin musait saatleri getirir | owner/static/variable | workingHoursStart, workingHoursEnd, slotDuration, dateSource |
| `get_events` | Belirli tarih icin takvim etkinliklerini getirir | owner/static/variable | dateSource, maxResults (opsiyonel) |
| `get_today_events` | Bugunun etkinliklerini getirir | owner/static/variable | - |
| `get_tomorrow_events` | Yarinin etkinliklerini getirir | owner/static/variable | - |

### Ornek Konfigurasyon: list_calendar_users

```json
{
  "componentName": "barbers",
  "integrationType": "google_calendar",
  "sourceType": "static",
  "action": "list_calendar_users",
  "transformTo": {
    "idField": "id",
    "titleField": "title",
    "descriptionField": "description"
  }
}
```

### Ornek Konfigurasyon: check_availability

```json
{
  "componentName": "available_slots",
  "integrationType": "google_calendar",
  "sourceType": "variable",
  "sourceVariable": "selected_barber",
  "action": "check_availability",
  "params": {
    "workingHoursStart": "09:00",
    "workingHoursEnd": "20:00",
    "slotDuration": 30,
    "dateSource": "variable",
    "dateVariable": "selected_date"
  },
  "dependsOn": "selected_date",
  "transformTo": {
    "idField": "id",
    "titleField": "title"
  }
}
```

### User ID Cozumleme

Handler, sourceType'a gore user ID'yi cozer:

1. **owner**: `context.chatbotUserId` kullanir (chatbot sahibinin takvimi)
2. **static**: `config.sourceId` kullanir (belirli bir kullanici)
3. **variable**: `formData[config.sourceVariable]` kullanir (form'dan alinan)

### Tarih Cozumleme

Handler, params.dateSource'a gore tarihi cozer:

1. **static**: `params.staticDate` kullanir
2. **variable**: `formData[params.dateVariable]` kullanir
3. **default**: Bugunun tarihini kullanir

---

## REST API Handler

**Dosya:** `backend/src/modules/webhooks/services/integration-handlers/rest-api.handler.ts`

### Ozellikler

- **DataSource Entegrasyonu**: Mevcut DataSource entity'leri ile calisir
- **Variable Interpolation**: `${variable_name}` syntax ile degisken degistirme
- **Auth Destegi**: Bearer, API Key, Basic Auth (DataSource uzerinden)
- **Query Parameters**: URL parametreleri otomatik ekleme
- **Body Template**: POST istekleri icin body sablonu
- **Nested Data Extraction**: Dot notation ile ic ice veri ayristirma (dataKey)

### RestApiParams

```typescript
interface RestApiParams {
  dataSourceId?: string;              // DataSource ID (auth, baseUrl icin)
  endpoint?: string;                  // API endpoint (${var} destekli)
  method?: 'GET' | 'POST';           // HTTP method, default: GET
  queryParams?: Record<string, any>; // URL parametreleri
  bodyTemplate?: Record<string, any>; // POST body template
  dataKey?: string;                  // Response'dan array path, default: 'data'
}
```

### Ornek Konfigurasyon: Sehir Listesi

```json
{
  "componentName": "city_dropdown",
  "integrationType": "rest_api",
  "sourceType": "static",
  "action": "fetch",
  "params": {
    "dataSourceId": "uuid-of-datasource",
    "endpoint": "/api/cities?country=${selected_country}",
    "method": "GET",
    "dataKey": "data.cities"
  },
  "dependsOn": "selected_country",
  "transformTo": {
    "idField": "id",
    "titleField": "name",
    "descriptionField": "region"
  }
}
```

### Variable Interpolation

Endpoint, queryParams ve bodyTemplate icinde `${field_name}` syntax'i desteklenir:

```typescript
// endpoint: '/api/cities/${country}'
// formData: { country: 'TR' }
// Sonuc: '/api/cities/TR'

// Nested degiskenler de desteklenir:
// endpoint: '/api/users/${user.profile.id}'
// formData: { user: { profile: { id: '123' } } }
// Sonuc: '/api/users/123'
```

### DataSource Auth Types

```typescript
enum AuthType {
  NONE = 'none',
  BEARER = 'bearer',    // Authorization: Bearer {token}
  API_KEY = 'api_key',  // X-API-Key: {token} veya custom header
  BASIC = 'basic',      // Authorization: Basic {base64}
}
```

---

## IntegrationHandlerRegistry

**Dosya:** `backend/src/modules/webhooks/services/integration-handlers/integration-handler.registry.ts`

Registry, handler'lari yonetir ve uygun handler'i bularak veri ceker.

### Metodlar

```typescript
@Injectable()
export class IntegrationHandlerRegistry {
  /**
   * Verilen konfigurasyon icin uygun handler'i bulur ve veri ceker.
   * @throws {IntegrationError} Uygun handler bulunamazsa
   */
  async fetchComponentData(
    config: IntegrationConfigDto,
    formData: Record<string, any>,
    context?: FlowExecutionContextDto,
  ): Promise<IntegrationDataItem[]>;

  /**
   * Belirli bir integration tipi icin handler kayitli mi kontrol eder.
   */
  hasHandler(integrationType: string): boolean;

  /**
   * Desteklenen integration tiplerini dondurur.
   */
  getSupportedIntegrationTypes(): string[];

  /**
   * Kayitli handler sayisini dondurur.
   */
  getHandlerCount(): number;
}
```

### IntegrationError

```typescript
export class IntegrationError extends Error {
  constructor(
    message: string,
    public readonly integrationType: string,
    public readonly componentName: string,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'IntegrationError';
  }
}
```

---

## NestJS Module Yapisi

**Dosya:** `backend/src/modules/webhooks/services/integration-handlers/integration-handlers.module.ts`

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserOAuthToken]),
    HttpModule,
    GoogleOAuthModule,
    DataSourcesModule,
  ],
  providers: [
    GoogleCalendarIntegrationHandler,
    RestApiIntegrationHandler,
    IntegrationHandlerRegistry,
  ],
  exports: [
    IntegrationHandlerRegistry,
    GoogleCalendarIntegrationHandler,
    RestApiIntegrationHandler,
  ],
})
export class IntegrationHandlersModule {}
```

### WebhooksModule Entegrasyonu

```typescript
// backend/src/modules/webhooks/webhooks.module.ts
@Module({
  imports: [
    // ... diger imports
    IntegrationHandlersModule,  // <-- Integration handler sistemi
  ],
  providers: [
    FlowEndpointService,
    // ...
  ],
})
export class WebhooksModule {}
```

---

## FlowEndpointService Kullanimi

**Dosya:** `backend/src/modules/webhooks/services/flow-endpoint.service.ts`

FlowEndpointService, WhatsApp Flow data_exchange action'larini islerken IntegrationHandlerRegistry'yi kullanir:

```typescript
@Injectable()
export class FlowEndpointService {
  constructor(
    private readonly handlerRegistry: IntegrationHandlerRegistry,
    // ... diger dependencies
  ) {}

  async handleDataExchange(
    flowToken: string,
    action: string,
    screen: string,
    data: Record<string, any>,
    flow: WhatsAppFlow,
  ) {
    // Integration configs'i metadata'dan al
    const integrationConfigs = flow.metadata?.integrationConfigs || [];

    // Her bir config icin veri cek
    const responseData: Record<string, any> = {};

    for (const config of integrationConfigs) {
      // Dependency check (cascading dropdown)
      if (config.dependsOn && !data[config.dependsOn]) {
        continue; // Bagimliligin degeri yoksa atla
      }

      const context: FlowExecutionContextDto = {
        flowToken,
        chatbotUserId: flow.userId, // owner sourceType icin
      };

      try {
        const items = await this.handlerRegistry.fetchComponentData(
          config,
          data,
          context,
        );
        responseData[config.componentName] = items;
      } catch (error) {
        this.logger.error(`Integration failed: ${error.message}`);
        responseData[config.componentName] = [];
      }
    }

    return { screen, data: responseData };
  }
}
```

---

## Frontend: Integration Config UI

**Dosya:** `frontend/src/features/flow-builder/components/playground/modals/SaveFlowModal.tsx`

### IntegrationConfig Interface (Frontend)

```typescript
export interface IntegrationConfig {
  componentName: string;
  integrationType: 'google_calendar' | 'rest_api';
  sourceType: 'owner' | 'static' | 'variable';
  sourceVariable?: string;
  sourceId?: string;
  action: string;
  params?: Record<string, unknown>;
  dependsOn?: string;
  transformTo: {
    idField: string;
    titleField: string;
    descriptionField?: string;
  };
}
```

### UI Ozellikleri

1. **Collapsible Section**: Integration Configs bolumu acilip kapatilabilir
2. **JSON Editor**: Textarea ile JSON formatinda konfigurasyon
3. **Validation**: componentName, integrationType ve transformTo alanlarini dogrular
4. **Error Display**: Hata durumunda bolum otomatik acilir ve hata mesaji gosterilir
5. **Example Template**: Ornek konfigurasyon gosterimi
6. **ARIA Attributes**: Erisimlilik icin aria-expanded, aria-controls, role="alert"

### Form Validation

```typescript
// Validation rules:
// 1. JSON format gecerli olmali
// 2. Array olmali
// 3. Her item icin:
//    - componentName zorunlu
//    - integrationType: 'google_calendar' veya 'rest_api' olmali
//    - transformTo.idField ve titleField zorunlu
```

---

## Yeni Handler Ekleme Rehberi

### Adim 1: IntegrationType Enum'a Ekle

```typescript
// backend/src/modules/flows/dto/integration-config.dto.ts
export enum IntegrationType {
  // ... mevcut tipler
  HUBSPOT_CRM = 'hubspot_crm',  // Yeni tip
}
```

### Adim 2: Handler Class Olustur

```typescript
// backend/src/modules/webhooks/services/integration-handlers/hubspot.handler.ts
import { Injectable, Logger } from '@nestjs/common';
import {
  IntegrationHandler,
  IntegrationDataItem,
} from './integration-handler.interface';
import {
  IntegrationConfigDto,
  IntegrationType,
  FlowExecutionContextDto,
} from '../../../flows/dto/integration-config.dto';

@Injectable()
export class HubSpotIntegrationHandler implements IntegrationHandler {
  private readonly logger = new Logger(HubSpotIntegrationHandler.name);

  canHandle(config: IntegrationConfigDto): boolean {
    return config.integrationType === IntegrationType.HUBSPOT_CRM;
  }

  async fetchData(
    config: IntegrationConfigDto,
    formData: Record<string, any>,
    context?: FlowExecutionContextDto,
  ): Promise<IntegrationDataItem[]> {
    this.logger.debug(`Fetching HubSpot data: action=${config.action}`);

    switch (config.action) {
      case 'list_contacts':
        return this.listContacts(config);
      case 'list_deals':
        return this.listDeals(config, formData);
      default:
        this.logger.warn(`Unknown HubSpot action: ${config.action}`);
        return [];
    }
  }

  private async listContacts(config: IntegrationConfigDto): Promise<IntegrationDataItem[]> {
    // HubSpot API implementation
    return [];
  }

  private async listDeals(
    config: IntegrationConfigDto,
    formData: Record<string, any>,
  ): Promise<IntegrationDataItem[]> {
    // HubSpot API implementation
    return [];
  }
}
```

### Adim 3: Module'e Ekle

```typescript
// backend/src/modules/webhooks/services/integration-handlers/integration-handlers.module.ts
import { HubSpotIntegrationHandler } from './hubspot.handler';

@Module({
  imports: [/* ... */],
  providers: [
    GoogleCalendarIntegrationHandler,
    RestApiIntegrationHandler,
    HubSpotIntegrationHandler,  // <-- Ekle
    IntegrationHandlerRegistry,
  ],
  exports: [
    IntegrationHandlerRegistry,
    GoogleCalendarIntegrationHandler,
    RestApiIntegrationHandler,
    HubSpotIntegrationHandler,  // <-- Ekle
  ],
})
export class IntegrationHandlersModule {}
```

### Adim 4: Registry'ye Inject Et

```typescript
// backend/src/modules/webhooks/services/integration-handlers/integration-handler.registry.ts
@Injectable()
export class IntegrationHandlerRegistry implements OnModuleInit {
  constructor(
    private readonly googleCalendarHandler: GoogleCalendarIntegrationHandler,
    private readonly restApiHandler: RestApiIntegrationHandler,
    private readonly hubspotHandler: HubSpotIntegrationHandler,  // <-- Ekle
  ) {
    this.handlers = [
      this.googleCalendarHandler,
      this.restApiHandler,
      this.hubspotHandler,  // <-- Ekle
    ];
  }
}
```

### Adim 5: Frontend'i Guncelle

```typescript
// frontend/src/features/flow-builder/components/playground/modals/SaveFlowModal.tsx
export interface IntegrationConfig {
  // ...
  integrationType: 'google_calendar' | 'rest_api' | 'hubspot_crm';  // <-- Ekle
}

// Validation'a ekle:
if (!['google_calendar', 'rest_api', 'hubspot_crm'].includes(item.integrationType)) {
  // ...
}
```

---

## Best Practices

### 1. Component Isimlendirmesi

Component adlari, Flow JSON'daki data binding ile uyumlu olmalidir:

```json
// Flow JSON'da:
{ "data-source": "${data.barbers}" }

// Integration Config'de:
{ "componentName": "barbers" }
```

### 2. Cascading Dropdown'lar

Bagimli dropdown'lar icin `dependsOn` kullaniN:

```json
{
  "componentName": "available_slots",
  "dependsOn": "selected_date",
  "sourceType": "variable",
  "sourceVariable": "selected_barber"
}
```

### 3. Hata Toleransi

Handler'lar hata durumunda bos dizi dondurmeli, akisi kirmamalidir:

```typescript
try {
  const data = await this.fetchFromExternalApi();
  return data;
} catch (error) {
  this.logger.error(`Fetch failed: ${error.message}`);
  return []; // Bos dizi don, akis devam etsin
}
```

### 4. Loglama

Her handler, islemleri detayli loglamalidir:

```typescript
this.logger.debug(`Fetching data: action=${config.action}, sourceType=${config.sourceType}`);
this.logger.debug(`Found ${results.length} items`);
this.logger.error(`Failed to fetch: ${error.message}`, error.stack);
```

### 5. Timeout Yonetimi

WhatsApp Flow endpoint'leri icin maksimum 10 saniye timeout:

```typescript
const requestConfig: AxiosRequestConfig = {
  timeout: Math.min(dataSource?.timeout || 10000, 10000), // Max 10 sec
  // ...
};
```

---

## Hata Senaryolari

| Hata | Aciklama | Cozum |
|------|----------|-------|
| `No handler found for integration type` | IntegrationType icin handler kayitli degil | IntegrationType enum ve handler registration kontrol edin |
| `Could not resolve calendar user` | User ID cozulemedi | sourceType, sourceId/sourceVariable degerleri kontrol edin |
| `Token expired` | OAuth token'i suresi dolmus | Kullanicinin tekrar baglanti kurmasini saglayin |
| `DataSource not found` | REST API icin DataSource bulunamadi | dataSourceId'nin gecerli oldugunu kontrol edin |
| `Variable not found in form data` | Degisken formData'da yok | dependsOn ve sourceVariable degerlerini kontrol edin |

---

## Ilgili Dokumanlar

- [docs/WHATSAPP_FLOW_INTEGRATIONS.md](../../../../docs/WHATSAPP_FLOW_INTEGRATIONS.md) - Kullanici dokumantasyonu
- [22-data-source-connections.md](./22-data-source-connections.md) - DataSource entity ve baglantilari
- [21-data-sources-whatsapp-flows-integration.md](./21-data-sources-whatsapp-flows-integration.md) - WhatsApp Flows ile DataSource entegrasyonu
- [06-whatsapp-integration.md](./06-whatsapp-integration.md) - WhatsApp API entegrasyonu
