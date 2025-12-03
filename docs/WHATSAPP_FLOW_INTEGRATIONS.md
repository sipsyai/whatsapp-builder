# WhatsApp Flow Integrations

Bu dokuman, WhatsApp Flow'larda dinamik veri cekmek icin kullanilan Integration Handler framework'unu aciklar.

## Genel Bakis

WhatsApp Flow'lar, kullanicilarin interaktif formlar araciligiyla veri girmesini saglar. Bazi durumlarda, dropdown'lar ve diger secim alanlari icin dinamik veri cekmek gerekir. Integration Handler framework'u, farkli veri kaynaklarindan (Google Calendar, REST API, vb.) veri cekip WhatsApp Flow formatina donusturmeyi saglar.

### Mimari Yapi

```
WhatsApp Flow Request
        |
        v
FlowEndpointService
        |
        v
IntegrationHandlerRegistry
        |
        +---> GoogleCalendarIntegrationHandler
        |
        +---> RestApiIntegrationHandler
        |
        +---> (Gelecek: OutlookCalendarHandler, StripeHandler, vb.)
        |
        v
WhatsApp Flow Response (dropdown data)
```

### Dosya Yapisi

```
backend/src/modules/
├── flows/dto/
│   └── integration-config.dto.ts          # DTO tanimlari ve enum'lar
│
└── webhooks/services/
    ├── flow-endpoint.service.ts           # Ana endpoint handler
    │
    └── integration-handlers/
        ├── index.ts                       # Barrel export
        ├── integration-handler.interface.ts   # Handler interface
        ├── integration-handler.registry.ts    # Handler registry
        ├── integration-handlers.module.ts     # NestJS module
        ├── google-calendar.handler.ts         # Google Calendar handler
        └── rest-api.handler.ts                # REST API handler
```

---

## Desteklenen Integration Tipleri

### 1. GOOGLE_CALENDAR

Google Calendar entegrasyonu, kullanicilarin takvimlerinden etkinlik ve musaitlik bilgilerini ceker.

#### Desteklenen Action'lar

| Action | Aciklama | Gerekli Parametreler |
|--------|----------|---------------------|
| `list_calendar_users` | Google Calendar baglantisi olan kullanicilari listeler | - |
| `check_availability` | Belirli bir tarih icin musait saatleri getirir | `workingHoursStart`, `workingHoursEnd`, `slotDuration`, date source |
| `get_events` | Takvim etkinliklerini getirir | date source, `maxResults` (opsiyonel) |
| `get_today_events` | Bugunun etkinliklerini getirir | - |
| `get_tomorrow_events` | Yarinin etkinliklerini getirir | - |

#### Ornek Konfigurasyon: Berber Listesi

```json
{
  "componentName": "barber_list",
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

#### Ornek Konfigurasyon: Musait Saatler

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

### 2. REST_API

Harici REST API'lerden veri cekmek icin kullanilir. Mevcut DataSource entity'leri ile entegre calisir.

#### Ozellikler

- DataSource entity uzerinden kimlik dogrulama (Bearer, API Key, Basic Auth)
- Degisken interpolasyonu (`${variable_name}` syntax)
- Cascading dropdown desteği (`dependsOn` ile)
- Dot notation ile nested veri ayristirma (`dataKey`)

#### Ornek Konfigurasyon: Sehir Listesi

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

---

## Integration Config Yapisi

### IntegrationConfigDto

Tum integration tipleri icin temel konfigurasyon yapisi.

```typescript
interface IntegrationConfigDto {
  // WhatsApp Flow dropdown component adi
  // Bu ad, Flow JSON'daki data binding ile eslesmelidir
  componentName: string;

  // Integration tipi
  // Degerler: 'rest_api' | 'google_calendar' | 'outlook_calendar' | 'stripe_payments' | 'custom_webhook'
  integrationType: string;

  // Veri kaynagi tipi
  // 'owner': Chatbot sahibinin verileri
  // 'static': Sabit bir ID ile belirlenen kaynak
  // 'variable': Form data'dan alinan degisken
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
  transformTo: {
    idField: string;       // Dropdown'da id olarak kullanilacak alan
    titleField: string;    // Dropdown'da gorunecek baslik alani
    descriptionField?: string; // Opsiyonel aciklama alani
  };

  // Cascading dropdown icin bagimlilik
  // Bu config, belirtilen field submit edildiginde calisir
  dependsOn?: string;

  // Opsiyonel filter parametresi adi
  filterParam?: string;
}
```

### GoogleCalendarParamsDto

Google Calendar action'lari icin ozel parametreler.

```typescript
interface GoogleCalendarParamsDto {
  // Calisma saatleri baslangici (format: "HH:mm")
  workingHoursStart?: string;  // default: "09:00"

  // Calisma saatleri bitisi (format: "HH:mm")
  workingHoursEnd?: string;    // default: "18:00"

  // Slot suresi (dakika)
  slotDuration?: number;       // default: 60

  // Tarih kaynagi
  // 'static': Sabit tarih
  // 'variable': Form data'dan alinan degisken
  dateSource?: 'static' | 'variable';

  // Variable date source icin degisken adi
  dateVariable?: string;

  // Static date source icin tarih (format: "YYYY-MM-DD")
  staticDate?: string;

  // Maksimum sonuc sayisi (get_events icin)
  maxResults?: number;         // default: 50
}
```

### FlowExecutionContextDto

Handler'lara iletilen calisma zamani bilgileri.

```typescript
interface FlowExecutionContextDto {
  // WhatsApp Flow token
  flowToken?: string;

  // Conversation context ID
  contextId?: string;

  // Chatbot node ID
  nodeId?: string;

  // Chatbot sahibinin user ID'si
  chatbotUserId?: string;
}
```

---

## Kullanim Ornegi: Berber Randevusu

Asagida, 3 adimli bir berber randevu akisi icin integration konfigurasyonu yer almaktadir.

### Senaryo

1. Kullanici WhatsApp Flow'u acar
2. Google Calendar baglantisi olan berberler listelenir
3. Kullanici bir berber secer
4. Kullanici bir tarih secer
5. Secilen berber ve tarihe gore musait saatler listelenir
6. Kullanici bir saat secer ve randevuyu onaylar

### Integration Configs

```json
{
  "integrationConfigs": [
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
    },
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
  ]
}
```

### Akis Diyagrami

```
                    INIT Action
                         |
                         v
            +------------------------+
            |   list_calendar_users  |
            |   (barbers dropdown)   |
            +------------------------+
                         |
                         v
                Kullanici berber secer
                         |
                         v
            +------------------------+
            |   TARIH_SECIM ekrani   |
            |   (statik veya dinamik)|
            +------------------------+
                         |
                         v
                Kullanici tarih secer
                         |
                         v
            +------------------------+
            |   check_availability   |
            |  (available_slots)     |
            |  dependsOn: selected_  |
            |  date                  |
            +------------------------+
                         |
                         v
               Kullanici saat secer
                         |
                         v
            +------------------------+
            |      ONAY ekrani       |
            |   (ozet + onay butonu) |
            +------------------------+
                         |
                         v
                 Flow tamamlandi
```

---

## Flow Metadata'ya Ekleme

Integration konfigurasyonu, WhatsApp Flow entity'sinin `metadata` alanina eklenir.

### Adim 1: WhatsApp Flow Olusturun

Frontend'de WhatsApp Flows sayfasindan yeni bir flow olusturun.

### Adim 2: Flow JSON'i Tasarlayin

WhatsApp Flow Builder veya Playground ile flow JSON'inizi tasarlayin. Dropdown component'lerine data binding ekleyin:

```json
{
  "type": "Dropdown",
  "label": "Berber Secin",
  "name": "selected_barber",
  "data-source": "${data.barbers}",
  "required": true
}
```

### Adim 3: Metadata'ya Integration Configs Ekleyin

Flow detay sayfasinda veya API uzerinden metadata'yi guncelleyin:

```json
{
  "metadata": {
    "integrationConfigs": [
      {
        "componentName": "barbers",
        "integrationType": "google_calendar",
        "sourceType": "static",
        "action": "list_calendar_users",
        "transformTo": {
          "idField": "id",
          "titleField": "title"
        }
      }
    ]
  }
}
```

### Adim 4: Flow'u Publish Edin

Flow'u WhatsApp'a publish edin ve test edin.

---

## Yeni Integration Ekleme Rehberi

Yeni bir integration tipi eklemek icin asagidaki adimlari izleyin:

### Adim 1: IntegrationType Enum'a Yeni Tip Ekleyin

```typescript
// backend/src/modules/flows/dto/integration-config.dto.ts

export enum IntegrationType {
  REST_API = 'rest_api',
  GOOGLE_CALENDAR = 'google_calendar',
  OUTLOOK_CALENDAR = 'outlook_calendar',
  STRIPE_PAYMENTS = 'stripe_payments',
  CUSTOM_WEBHOOK = 'custom_webhook',
  // Yeni tip ekleyin:
  HUBSPOT_CRM = 'hubspot_crm',
}
```

### Adim 2: Handler Class Olusturun

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

    // Action'a gore routing
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
    // HubSpot API cagirisi
    // ...
    return [];
  }

  private async listDeals(
    config: IntegrationConfigDto,
    formData: Record<string, any>,
  ): Promise<IntegrationDataItem[]> {
    // HubSpot API cagirisi
    // ...
    return [];
  }
}
```

### Adim 3: Handler'i Module'e Ekleyin

```typescript
// backend/src/modules/webhooks/services/integration-handlers/integration-handlers.module.ts

import { Module } from '@nestjs/common';
import { GoogleCalendarIntegrationHandler } from './google-calendar.handler';
import { RestApiIntegrationHandler } from './rest-api.handler';
import { HubSpotIntegrationHandler } from './hubspot.handler';  // <-- Ekleyin
import { IntegrationHandlerRegistry } from './integration-handler.registry';

@Module({
  imports: [/* gerekli module'ler */],
  providers: [
    GoogleCalendarIntegrationHandler,
    RestApiIntegrationHandler,
    HubSpotIntegrationHandler,  // <-- Ekleyin
    IntegrationHandlerRegistry,
  ],
  exports: [
    IntegrationHandlerRegistry,
    GoogleCalendarIntegrationHandler,
    RestApiIntegrationHandler,
    HubSpotIntegrationHandler,  // <-- Ekleyin
  ],
})
export class IntegrationHandlersModule {}
```

### Adim 4: Registry Constructor'ina Inject Edin

```typescript
// backend/src/modules/webhooks/services/integration-handlers/integration-handler.registry.ts

@Injectable()
export class IntegrationHandlerRegistry implements OnModuleInit {
  private readonly handlers: IntegrationHandler[] = [];

  constructor(
    private readonly googleCalendarHandler: GoogleCalendarIntegrationHandler,
    private readonly restApiHandler: RestApiIntegrationHandler,
    private readonly hubspotHandler: HubSpotIntegrationHandler,  // <-- Ekleyin
  ) {
    this.handlers = [
      this.googleCalendarHandler,
      this.restApiHandler,
      this.hubspotHandler,  // <-- Ekleyin
    ];
  }

  // ... diger metodlar
}
```

### Adim 5: index.ts'e Export Ekleyin

```typescript
// backend/src/modules/webhooks/services/integration-handlers/index.ts

export * from './integration-handler.interface';
export * from './integration-handler.registry';
export * from './integration-handlers.module';
export * from './google-calendar.handler';
export * from './rest-api.handler';
export * from './hubspot.handler';  // <-- Ekleyin
```

---

## Handler Interface Detaylari

### IntegrationHandler Interface

```typescript
/**
 * Integration handler'lar bu interface'i implement etmelidir.
 */
export interface IntegrationHandler {
  /**
   * Bu handler'in verilen konfigurasyonu isleyip isleyemeyecegini belirler.
   * Registry, uygun handler'i bulmak icin bu metodu kullanir.
   *
   * @param config - Integration konfigurasyonu
   * @returns Handler bu config'i isleyebiliyorsa true
   */
  canHandle(config: IntegrationConfigDto): boolean;

  /**
   * Harici kaynaktan veri ceker ve WhatsApp Flow dropdown formatina donusturur.
   *
   * @param config - Integration konfigurasyonu (sourceType, action, params, vb.)
   * @param formData - WhatsApp Flow'dan gelen form verileri
   * @param context - Calisma zamani bilgileri (flowToken, contextId, chatbotUserId)
   * @returns Dropdown icin formatlanmis veri dizisi
   */
  fetchData(
    config: IntegrationConfigDto,
    formData: Record<string, any>,
    context?: FlowExecutionContextDto,
  ): Promise<IntegrationDataItem[]>;
}

/**
 * WhatsApp Flow dropdown component'i icin formatlanmis veri.
 */
export interface IntegrationDataItem {
  /** Dropdown seciminde donen deger */
  id: string;

  /** Kullaniciya gosterilen baslik */
  title: string;

  /** Opsiyonel aciklama metni */
  description?: string;

  /** Bu secenek secilebilir mi (default: true) */
  enabled?: boolean;
}
```

### IntegrationHandlerRegistry

```typescript
/**
 * Integration handler'larin merkezi kayit ve yonetim servisi.
 */
@Injectable()
export class IntegrationHandlerRegistry {
  /**
   * Verilen konfigurasyon icin uygun handler'i bulur ve veri ceker.
   *
   * @param config - Integration konfigurasyonu
   * @param formData - Form verileri
   * @param context - Calisma zamani bilgileri
   * @returns Dropdown verisi
   * @throws {IntegrationError} Uygun handler bulunamazsa veya veri cekme basarisiz olursa
   */
  async fetchComponentData(
    config: IntegrationConfigDto,
    formData: Record<string, any>,
    context?: FlowExecutionContextDto,
  ): Promise<IntegrationDataItem[]>;

  /**
   * Belirli bir integration tipi icin handler kayitli mi kontrol eder.
   *
   * @param integrationType - Kontrol edilecek integration tipi
   * @returns Handler varsa true
   */
  hasHandler(integrationType: string): boolean;

  /**
   * Desteklenen integration tiplerini dondurur.
   *
   * @returns Desteklenen integration tipleri dizisi
   */
  getSupportedIntegrationTypes(): string[];
}
```

---

## Hata Yonetimi

### IntegrationError

Handler'lar ve registry, hatalari `IntegrationError` class'i ile raporlar.

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

### Yaygin Hata Senaryolari

| Hata | Aciklama | Cozum |
|------|----------|-------|
| `No handler found` | Integration tipi icin handler kayitli degil | IntegrationType enum'unu ve handler registration'i kontrol edin |
| `Could not resolve calendar user` | Kullanici ID'si cozulemedi | sourceType ve sourceVariable/sourceId degerlerini kontrol edin |
| `Token expired` | OAuth token'i suresi dolmus | Kullanicinin tekrar baglanti kurmasini saglayIn |
| `DataSource not found` | REST API icin DataSource bulunamadi | dataSourceId'nin gecerli oldugunu kontrol edin |

---

## Best Practices

### 1. Component Isimlendirmesi

Component adlari, Flow JSON'daki data binding ile uyumlu olmalidir:

```json
// Flow JSON'da:
"data-source": "${data.barbers}"

// Integration Config'de:
"componentName": "barbers"
```

### 2. Cascading Dropdown'lar

Bagimli dropdown'lar icin `dependsOn` kullaniN:

```json
{
  "componentName": "cities",
  "dependsOn": "selected_country",
  "filterParam": "country_id"
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
```

---

## Ilgili Dokumanlar

- [WhatsApp Flow API Guide](./WHATSAPP_FLOW_API_GUIDE.md)
- [Flow JSON Schema](./FLOW_JSON_SCHEMA.md)
- [WhatsApp Flows Integration](./WHATSAPP_FLOWS_INTEGRATION.md)
- [Google OAuth Verification Guide](./GOOGLE_OAUTH_VERIFICATION_GUIDE.md)

---

## Sonraki Adimlar (Roadmap)

### Planlanmis Integration Tipleri

- [ ] **Outlook Calendar** - Microsoft 365 takvim entegrasyonu
- [ ] **Stripe Payments** - Odeme bilgileri ve abonelik yonetimi
- [ ] **HubSpot CRM** - Musteri ve firma verileri
- [ ] **Shopify** - Urun ve siparis verileri
- [ ] **Custom Webhook** - Ozel endpoint cagirisi

### Planlanmis Ozellikler

- [x] Frontend UI ile integration konfigurasyonu (SaveFlowModal)
- [ ] Gorsel integration konfigurasyonu (form-based UI)
- [ ] Integration test endpoint'i
- [ ] Caching layer (performans iyilestirmesi)
- [ ] Rate limiting
- [ ] Integration analytics ve monitoring

---

## Frontend Integration Config UI

WhatsApp Flow Playground'da flow kaydedilirken Integration Configs belirtilebilir.

**Dosya:** `frontend/src/features/flow-builder/components/playground/modals/SaveFlowModal.tsx`

### Kullanim

1. Flow Playground'da "Save" butonuna tiklayin
2. "Integration Configs" bolumunu aciniz (collapsible)
3. JSON formatinda integration konfigurasyonlarini girin
4. Validasyondan gecerse flow kaydedilir

### IntegrationConfig Interface

```typescript
interface IntegrationConfig {
  componentName: string;                          // Zorunlu
  integrationType: 'google_calendar' | 'rest_api'; // Zorunlu
  sourceType: 'owner' | 'static' | 'variable';
  sourceVariable?: string;
  sourceId?: string;
  action: string;
  params?: Record<string, unknown>;
  dependsOn?: string;
  transformTo: {                                   // Zorunlu
    idField: string;
    titleField: string;
    descriptionField?: string;
  };
}
```

### Validation Kurallari

SaveFlowModal, asagidaki validation'lari uygular:

1. **JSON Format**: Gecerli JSON olmali
2. **Array Check**: Root element array olmali
3. **componentName**: Her item icin zorunlu
4. **integrationType**: `google_calendar` veya `rest_api` olmali
5. **transformTo**: `idField` ve `titleField` zorunlu

### Ornek Kullanim

```json
[
  {
    "componentName": "barbers",
    "integrationType": "google_calendar",
    "sourceType": "static",
    "action": "list_calendar_users",
    "transformTo": { "idField": "id", "titleField": "title" }
  },
  {
    "componentName": "time_slots",
    "integrationType": "google_calendar",
    "sourceType": "variable",
    "sourceVariable": "selected_barber",
    "action": "check_availability",
    "params": {
      "workingHoursStart": "09:00",
      "workingHoursEnd": "18:00",
      "slotDuration": 30,
      "dateSource": "variable",
      "dateVariable": "selected_date"
    },
    "dependsOn": "selected_date",
    "transformTo": { "idField": "id", "titleField": "title" }
  }
]
```

### UI Ozellikleri

- **Collapsible Section**: Varsayilan olarak kapali, tiklayarak acilin
- **Error Auto-Expand**: Validasyon hatasi varsa bolum otomatik acilir
- **Example Template**: "View example config" ile ornek gosterimi
- **ARIA Accessibility**: `aria-expanded`, `aria-controls`, `role="alert"` destegi
- **Toast Notifications**: Basarili/basarisiz islemler icin bildirim

---

## REST API Executor Iyilestirmeleri

REST API node'u ve handler'i icin ek ozellikler eklenmistir.

**Dosya:** `backend/src/modules/chatbots/services/rest-api-executor.service.ts`

### apiContentType Destegi

Farkli content type'lari desteklenir:

```typescript
type ContentType = 'application/json' | 'multipart/form-data' | 'application/x-www-form-urlencoded';
```

### apiFilterField/apiFilterValue

Array response'larini filtrelemek icin:

```typescript
// Konfigurasyon:
{
  "apiFilterField": "status",
  "apiFilterValue": "active"
}

// Response'tan sadece status='active' olanlari filtreler
```

### Array Notation Destegi

Nested array degerlerine erismek icin:

```typescript
// data[0].id syntax'i desteklenir
const value = extractValue(data, 'items[0].name');
```

### Sensitive Data Masking

Log'larda hassas veriler maskelenir:

```typescript
// Headers loglanirken:
// Authorization: Bearer ****
// X-API-Key: ****
```

### Timeout Limiti

WhatsApp Flow endpoint'leri icin maksimum 10 saniye timeout uygulanir:

```typescript
timeout: Math.min(configuredTimeout, 10000)
```

---

## Flow Endpoint Iyilestirmeleri

**Dosya:** `backend/src/modules/webhooks/services/flow-endpoint.service.ts`

### routing_model Validation

Flow JSON'daki routing_model destegi:

```json
{
  "screens": [...],
  "routing_model": {
    "SCREEN_1": ["SCREEN_2", "SCREEN_3"],
    "SCREEN_2": ["SUCCESS"]
  }
}
```

### findNextScreen Mantigi

Bir sonraki ekrani belirlemek icin:

1. routing_model varsa, current screen'den gidilebilecek ekranlari kontrol et
2. routing_model yoksa, Flow JSON'dan siradaki ekrani bul
3. Gecersiz gecis varsa hata dondur

### Error Notification Handler

WhatsApp'tan gelen hata bildirimleri icin:

```typescript
if (action === 'error') {
  this.logger.error(`Flow error: ${JSON.stringify(data)}`);
  // Error handling logic
}
```

### BACK Action ve refresh_on_back

Kullanici geri donduğunde verinin yenilenmesi:

```typescript
if (action === 'BACK' && currentScreen.refresh_on_back) {
  // Integration configs'i tekrar calistir
  await this.fetchIntegrationData(configs, formData, context);
}
```

### N+1 Query Optimizasyonu

Flow entity'sini cekterken relations eager load edilir:

```typescript
const flow = await this.flowsRepository.findOne({
  where: { id: flowId },
  relations: ['dataSource', 'user'],  // Eager load
});
```
