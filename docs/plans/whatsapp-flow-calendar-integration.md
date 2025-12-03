# WhatsApp Flow - Google Calendar Integration Plan

## Özet

Berber randevusu chatbotu için WhatsApp Flow'da dinamik olarak berber seçimine göre takvim eventlerinin çekilmesi ve görüntülenmesi.

## Kullanıcı Tercihleri

- **Yaklaşım:** Esnek (Generic) - IntegrationHandler framework ile gelecek entegrasyonlar için hazır
- **Frontend UI:** Metadata JSON - Mevcut metadata editörü ile manuel konfigürasyon
- **Berber Kaynağı:** Google Calendar Users - hasGoogleCalendar=true olan tüm kullanıcılar otomatik
- **Event Oluşturma:** Sadece Görüntüleme - Slot'ları göster, event oluşturma chatbot/manuel

---

## Mevcut Altyapı

### Backend
- **GoogleOAuthService** (`backend/src/modules/google-oauth/google-oauth.service.ts`)
  - `getAvailableSlotsOnly(userId, date, workStart, workEnd, slotDuration)` - WhatsApp dropdown formatında döndürür
  - `getCalendarEvents()`, `getTodayEvents()`, `getTomorrowEvents()`

- **FlowEndpointService** (`backend/src/modules/webhooks/services/flow-endpoint.service.ts`)
  - `handleInit()` ve `handleDataExchange()` metodları mevcut
  - `ComponentDataSourceConfigDto` ile config-driven data fetching var

- **Users API** (`backend/src/modules/users/users.controller.ts`)
  - `GET /api/users?hasGoogleCalendar=true` - Google Calendar bağlantısı olan kullanıcıları listeler

### Frontend
- **ConfigGoogleCalendar.tsx** - Calendar node config UI (pattern referansı)
- **ConfigModals.tsx** - WhatsApp Flow config modal (flowInitialData JSON textarea mevcut)

---

## Implementation Plan

### PHASE 1: Backend - Integration Handler Framework

#### TODO 1: Integration Types ve DTO'lar
**Agent:** `typeorm-expert`
**Dosyalar:**
- `backend/src/modules/flows/dto/integration-config.dto.ts` (YENİ)

**Görevler:**
1. `IntegrationType` enum oluştur (REST_API, GOOGLE_CALENDAR, OUTLOOK_CALENDAR, STRIPE_PAYMENTS, CUSTOM_WEBHOOK)
2. `IntegrationConfigDto` interface tanımla
3. `GoogleCalendarIntegrationConfig` extends interface
4. `FlowExecutionContext` interface tanımla
5. `TransformConfigDto` interface tanımla

```typescript
export enum IntegrationType {
  REST_API = 'rest_api',
  GOOGLE_CALENDAR = 'google_calendar',
  OUTLOOK_CALENDAR = 'outlook_calendar',
  STRIPE_PAYMENTS = 'stripe_payments',
  CUSTOM_WEBHOOK = 'custom_webhook',
}

export interface TransformConfigDto {
  idField: string;
  titleField: string;
  descriptionField?: string;
}

export interface IntegrationConfigDto {
  componentName: string;
  integrationType: IntegrationType;
  sourceType: 'owner' | 'static' | 'variable';
  sourceId?: string;
  sourceVariable?: string;
  action: string;
  params?: Record<string, any>;
  transformTo: TransformConfigDto;
  dependsOn?: string;
  filterParam?: string;
}

export interface GoogleCalendarIntegrationConfig extends IntegrationConfigDto {
  integrationType: IntegrationType.GOOGLE_CALENDAR;
  action: 'check_availability' | 'get_events' | 'get_today_events' | 'get_tomorrow_events' | 'list_calendar_users';
  params: {
    workingHoursStart?: string;
    workingHoursEnd?: string;
    slotDuration?: number;
    dateSource?: 'static' | 'variable';
    dateVariable?: string;
    staticDate?: string;
    maxResults?: number;
  };
}

export interface FlowExecutionContext {
  flowToken?: string;
  contextId?: string;
  nodeId?: string;
  chatbotUserId?: string;
}
```

---

#### TODO 2: Integration Handler Interface
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/webhooks/services/integration-handlers/integration-handler.interface.ts` (YENİ)

**Görevler:**
1. `IntegrationHandler` interface tanımla
2. `canHandle()` ve `fetchData()` metodları

```typescript
export interface IntegrationHandler {
  canHandle(config: IntegrationConfigDto): boolean;
  fetchData(
    config: IntegrationConfigDto,
    formData: Record<string, any>,
    context?: FlowExecutionContext
  ): Promise<{ id: string; title: string; description?: string; enabled?: boolean }[]>;
}
```

---

#### TODO 3: Google Calendar Integration Handler
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/webhooks/services/integration-handlers/google-calendar.handler.ts` (YENİ)

**Görevler:**
1. `GoogleCalendarIntegrationHandler` class oluştur
2. `canHandle()` - IntegrationType.GOOGLE_CALENDAR kontrolü
3. `fetchData()` - action'a göre routing
4. `resolveUserId()` - owner/static/variable source çözümleme
5. `resolveDate()` - static/variable date çözümleme
6. `list_calendar_users` action - hasGoogleCalendar=true kullanıcıları listele

```typescript
@Injectable()
export class GoogleCalendarIntegrationHandler implements IntegrationHandler {
  constructor(
    private readonly googleOAuthService: GoogleOAuthService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  canHandle(config: IntegrationConfigDto): boolean {
    return config.integrationType === IntegrationType.GOOGLE_CALENDAR;
  }

  async fetchData(
    config: IntegrationConfigDto,
    formData: Record<string, any>,
    context?: FlowExecutionContext
  ): Promise<{ id: string; title: string; enabled?: boolean }[]> {
    const calendarConfig = config as GoogleCalendarIntegrationConfig;

    // list_calendar_users için özel handler
    if (calendarConfig.action === 'list_calendar_users') {
      return this.listCalendarUsers(calendarConfig);
    }

    const userId = await this.resolveUserId(config, formData, context);
    if (!userId) {
      throw new Error('Could not resolve calendar user');
    }

    const targetDate = this.resolveDate(calendarConfig.params, formData);

    switch (calendarConfig.action) {
      case 'check_availability':
        return this.getAvailableSlots(userId, targetDate, calendarConfig.params);
      case 'get_events':
        return this.getEvents(userId, targetDate, calendarConfig.params);
      // ... diğer actions
    }
  }

  private async listCalendarUsers(config: GoogleCalendarIntegrationConfig) {
    const users = await this.userRepo
      .createQueryBuilder('user')
      .innerJoin('user_oauth_tokens', 'token', 'token.userId = user.id')
      .where('token.provider = :provider', { provider: 'google_calendar' })
      .andWhere('token.isActive = true')
      .select(['user.id', 'user.name', 'user.email'])
      .getMany();

    return users.map(u => ({
      id: u.id,
      title: u.name,
      description: u.email,
      enabled: true,
    }));
  }

  private async getAvailableSlots(userId: string, date: string, params: any) {
    const slots = await this.googleOAuthService.getAvailableSlotsOnly(
      userId,
      date,
      params?.workingHoursStart || '09:00',
      params?.workingHoursEnd || '18:00',
      params?.slotDuration || 60,
    );
    return slots;
  }
}
```

---

#### TODO 4: REST API Integration Handler (Mevcut DataSource Wrapper)
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/webhooks/services/integration-handlers/rest-api.handler.ts` (YENİ)

**Görevler:**
1. Mevcut `DataSourcesService` ve `fetchComponentData()` logic'ini wrap et
2. `canHandle()` - IntegrationType.REST_API kontrolü

---

#### TODO 5: Integration Handler Registry
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/webhooks/services/integration-handlers/integration-handler.registry.ts` (YENİ)

**Görevler:**
1. `IntegrationHandlerRegistry` service oluştur
2. Handler'ları DI ile inject et
3. `fetchComponentData()` - uygun handler'ı bul ve çağır

```typescript
@Injectable()
export class IntegrationHandlerRegistry {
  private handlers: IntegrationHandler[] = [];

  constructor(
    private readonly googleCalendarHandler: GoogleCalendarIntegrationHandler,
    private readonly restApiHandler: RestApiIntegrationHandler,
  ) {
    this.handlers = [googleCalendarHandler, restApiHandler];
  }

  async fetchComponentData(
    config: IntegrationConfigDto,
    formData: Record<string, any>,
    context?: FlowExecutionContext
  ): Promise<{ id: string; title: string; description?: string }[]> {
    const handler = this.handlers.find(h => h.canHandle(config));
    if (!handler) {
      throw new Error(`No handler found for: ${config.integrationType}`);
    }
    return handler.fetchData(config, formData, context);
  }
}
```

---

#### TODO 6: Integration Handlers Module
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/webhooks/services/integration-handlers/integration-handlers.module.ts` (YENİ)
- `backend/src/modules/webhooks/services/integration-handlers/index.ts` (YENİ)

**Görevler:**
1. Module oluştur ve export et
2. GoogleOAuthModule, TypeOrmModule imports
3. Handler'ları ve Registry'yi providers olarak ekle

---

### PHASE 2: Backend - Flow Endpoint Service Güncellemesi

#### TODO 7: WebhooksModule Güncellemesi
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/webhooks/webhooks.module.ts`

**Görevler:**
1. `GoogleOAuthModule` import et
2. `IntegrationHandlersModule` import et

---

#### TODO 8: FlowEndpointService - handleInit Güncellemesi
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/webhooks/services/flow-endpoint.service.ts`

**Görevler:**
1. `IntegrationHandlerRegistry` inject et
2. `handleInit` metoduna integrationConfigs desteği ekle
3. Initial configs (dependsOn olmayan) için data fetch et
4. `getChatbotOwnerUserId()` helper metodu ekle

```typescript
// handleInit içine eklenecek logic
const integrationConfigs = flowRecord?.metadata?.integrationConfigs as IntegrationConfigDto[] || [];

if (integrationConfigs.length > 0) {
  const initialConfigs = integrationConfigs.filter(c => !c.dependsOn);
  const screenData: Record<string, any> = { ...initialData };

  for (const config of initialConfigs) {
    const context: FlowExecutionContext = {
      flowToken: request.flow_token,
      contextId,
      nodeId,
      chatbotUserId: await this.getChatbotOwnerUserId(contextId),
    };

    try {
      const componentData = await this.integrationRegistry.fetchComponentData(
        config,
        {},
        context
      );
      screenData[config.componentName] = componentData;
    } catch (error) {
      this.logger.error(`Integration fetch failed: ${error.message}`);
      screenData[config.componentName] = [];
    }
  }

  return {
    screen: this.getInitialScreen(flowRecord),
    data: screenData,
  };
}
```

---

#### TODO 9: FlowEndpointService - handleDataExchange Güncellemesi
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/webhooks/services/flow-endpoint.service.ts`

**Görevler:**
1. `handleDataExchange` metoduna cascading integration desteği ekle
2. Submit edilen field'a bağlı config'leri bul
3. Bağlı config'ler için data fetch et

```typescript
// handleDataExchange içine eklenecek logic
const integrationConfigs = flowRecord?.metadata?.integrationConfigs as IntegrationConfigDto[] || [];

if (integrationConfigs.length > 0) {
  const submittedFields = Object.keys(data || {});
  const screenData: Record<string, any> = { ...data };
  let hasMatch = false;

  for (const fieldName of submittedFields) {
    const dependentConfigs = integrationConfigs.filter(c => c.dependsOn === fieldName);

    if (dependentConfigs.length > 0) {
      hasMatch = true;

      for (const config of dependentConfigs) {
        const context: FlowExecutionContext = {
          flowToken: flow_token,
          contextId,
          nodeId,
          chatbotUserId: await this.getChatbotOwnerUserId(contextId),
        };

        try {
          const componentData = await this.integrationRegistry.fetchComponentData(
            config,
            data,
            context
          );
          screenData[config.componentName] = componentData;
        } catch (error) {
          this.logger.error(`Integration fetch failed: ${error.message}`);
          screenData[config.componentName] = [];
          screenData.error_message = 'Veri yüklenemedi';
        }
      }
    }
  }

  if (hasMatch) {
    const nextScreen = this.findNextScreen(flowRecord, screen);
    return { screen: nextScreen || screen, data: screenData };
  }
}
```

---

### PHASE 3: Demo Flow JSON ve Documentation

#### TODO 10: Berber Randevusu WhatsApp Flow JSON
**Agent:** `whatsapp-flow-builder-expert`
**Dosyalar:**
- `docs/demo-flows/berber-randevu-flow.json` (YENİ)

**Görevler:**
1. 4 ekranlı flow oluştur: BERBER_SECIM → TARIH_SECIM → SAAT_SECIM → ONAY
2. Dynamic dropdown'lar için data-source binding
3. on-click-action ile data_exchange payload'ları

---

#### TODO 11: Integration Config Örneği
**Agent:** `whatsapp-flow-builder-expert`
**Dosyalar:**
- `docs/demo-flows/berber-randevu-integration-config.json` (YENİ)

**Görevler:**
1. 3 integrationConfig örneği:
   - `barbers`: list_calendar_users action
   - `available_dates`: REST API (opsiyonel, statik tarihler de kullanılabilir)
   - `available_slots`: check_availability action, dependsOn: selected_barber + selected_date

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

---

#### TODO 12: Dokümantasyon Güncellemesi
**Agent:** `project-architect`
**Dosyalar:**
- `docs/WHATSAPP_FLOW_INTEGRATIONS.md` (YENİ)
- `.claude/skills/project-architect/reference/XX-whatsapp-flow-integrations.md` (YENİ)

**Görevler:**
1. Integration framework dokümantasyonu
2. Supported integration types
3. Config syntax ve örnekler
4. Yeni integration ekleme rehberi

---

### PHASE 4: Build & Test

#### TODO 13: Backend Build Test
**Agent:** manuel
**Komutlar:**
```bash
cd backend && npm run build
```

#### TODO 14: Integration Test
**Agent:** manuel
**Görevler:**
1. Yeni bir WhatsApp Flow oluştur
2. Metadata'ya integrationConfigs ekle
3. Flow'u test et (berber listesi, slot çekme)

---

### PHASE 5: Docker Deployment

#### TODO 15: Docker Build
**Agent:** manuel
**Komutlar:**
```bash
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml up -d backend
docker logs whatsapp-backend --tail 50
```

---

## Agent Kullanım Özeti

| Agent | TODO'lar |
|-------|----------|
| typeorm-expert | 1 |
| nestjs-expert | 2, 3, 4, 5, 6, 7, 8, 9 |
| whatsapp-flow-builder-expert | 10, 11 |
| project-architect | 12 |
| manuel | 13, 14, 15 |

---

## Paralel Çalıştırma Grupları

```
TODO 1, 2 (DTO'lar, Interface) → Paralel
TODO 3, 4 (Handlers) → Paralel (TODO 1, 2'ye bağlı)
TODO 5, 6 (Registry, Module) → Paralel (TODO 3, 4'e bağlı)
TODO 7, 8, 9 (FlowEndpoint) → Sıralı (TODO 5, 6'ya bağlı)
TODO 10, 11 (Demo Flows) → Paralel (backend'den bağımsız)
TODO 12 (Docs) → En son
```

---

## Notlar

1. **Frontend UI değişikliği yok**: Metadata JSON editörü ile integrationConfigs manuel yazılacak
2. **Event oluşturma yok**: Bu fazda sadece slot görüntüleme, event oluşturma gelecek fazda
3. **Backward compatible**: Mevcut dataSourceConfig yapısı korunuyor
4. **Genişletilebilir**: Yeni integration type'lar kolayca eklenebilir

---

## Berber Randevusu Use Case Akışı

```
1. WhatsApp Flow açılır
   └─► INIT action tetiklenir
   └─► list_calendar_users → barbers dropdown'u dolar

2. Kullanıcı berber seçer
   └─► data_exchange: { selected_barber: "user-uuid" }
   └─► Sonraki ekrana geçiş (tarih seçimi - statik veya dinamik)

3. Kullanıcı tarih seçer
   └─► data_exchange: { selected_date: "2025-12-15" }
   └─► check_availability tetiklenir (dependsOn: selected_date)
   └─► available_slots dropdown'u dolar

4. Kullanıcı saat seçer
   └─► data_exchange: { selected_time: "14:30" }
   └─► ONAY ekranına geçiş

5. Flow tamamlanır
   └─► complete action
   └─► Chatbot'a response döner (flowOutputVariable)
```
