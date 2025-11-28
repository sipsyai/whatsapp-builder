# Kod Gelistirme Raporu

**Tarih:** 2025-11-28
**Oncelik:** KRITIK

---

## 1. KRITIK - Hardcoded Degerler

### 1.1 flow-endpoint.service.ts (ACIL)

**Dosya:** `backend/src/modules/webhooks/services/flow-endpoint.service.ts`

```typescript
// MEVCUT KOD (YANLIS) - Satir 16-17
private readonly strapiBaseUrl = 'https://gardenhausapi.sipsy.ai';
private readonly strapiToken = 'b1653f8a6740702305117a40d274b208ad2549f123f5ad712e5d9d1314379ebda123c95031d88645ca1225823ba62c6ad10371c8ce15ac605ee6ab17435f82f22f60e7164d4bbf11e018b3353dd239153d98a86008fca0ce74c3766eba0e0af3e17acc7fa4469e939b384146ec1bf0efca1f5f45cf07203be5b5f3f9703a67dd';
```

**COZUM:**
```typescript
// OLMASI GEREKEN
private get strapiBaseUrl(): string {
  return this.configService.get<string>('STRAPI_BASE_URL') || '';
}

private get strapiToken(): string {
  return this.configService.get<string>('STRAPI_TOKEN') || '';
}
```

**DAHA IYI COZUM:**
- Flow-specific data source konfigurasyonu icin yeni bir entity olustur
- Her Flow'un kendi data source ayarlari olsun
- UI'dan konfigura edilebilir olsun

### 1.2 chatbot-execution.service.ts

**Dosya:** `backend/src/modules/chatbots/services/chatbot-execution.service.ts`

```typescript
// MEVCUT KOD (YANLIS) - Satir ~500
private readonly strapiBaseUrl = 'https://gardenhausapi.sipsy.ai';
private readonly strapiToken = 'b1653f8a...';
```

**Ayni duzeltme gerekli.**

---

## 2. YUKSEK - Eksik API Endpoint'leri

### 2.1 Flow Data Source Konfigurasyonu

**MEVCUT DURUM:** Yok

**GEREKEN ENDPOINT'LER:**

```typescript
// flows.controller.ts'e eklenmeli

@Post(':id/data-sources')
@ApiOperation({ summary: 'Add data source to Flow' })
async addDataSource(
  @Param('id') id: string,
  @Body() dto: CreateFlowDataSourceDto
): Promise<FlowDataSource> {
  // Strapi, REST API, GraphQL, etc.
}

@Get(':id/data-sources')
@ApiOperation({ summary: 'Get Flow data sources' })
async getDataSources(@Param('id') id: string): Promise<FlowDataSource[]> {}

@Put(':id/data-sources/:sourceId')
@ApiOperation({ summary: 'Update Flow data source' })
async updateDataSource(
  @Param('id') id: string,
  @Param('sourceId') sourceId: string,
  @Body() dto: UpdateFlowDataSourceDto
): Promise<FlowDataSource> {}

@Delete(':id/data-sources/:sourceId')
@ApiOperation({ summary: 'Delete Flow data source' })
async deleteDataSource(
  @Param('id') id: string,
  @Param('sourceId') sourceId: string
): Promise<void> {}
```

### 2.2 Chatbot Node Guncelleme

**MEVCUT DURUM:** Sadece tam chatbot update var

**GEREKEN ENDPOINT:**

```typescript
// chatbots.controller.ts'e eklenmeli

@Patch(':id/nodes/:nodeId')
@ApiOperation({ summary: 'Update specific node in chatbot' })
async updateNode(
  @Param('id') chatbotId: string,
  @Param('nodeId') nodeId: string,
  @Body() dto: UpdateNodeDto
): Promise<ChatbotNode> {}

@Patch(':id/nodes/:nodeId/flow-config')
@ApiOperation({ summary: 'Update Flow configuration for a node' })
async updateNodeFlowConfig(
  @Param('id') chatbotId: string,
  @Param('nodeId') nodeId: string,
  @Body() dto: UpdateFlowConfigDto
): Promise<ChatbotNode> {}
```

### 2.3 Flow Debugging Endpoint'leri

**MEVCUT DURUM:** Yok

**GEREKEN ENDPOINT'LER:**

```typescript
// flows.controller.ts'e eklenmeli

@Get(':id/validate')
@ApiOperation({ summary: 'Validate Flow JSON against WhatsApp schema' })
async validateFlow(@Param('id') id: string): Promise<ValidationResult> {}

@Get(':id/test-endpoint')
@ApiOperation({ summary: 'Test Flow endpoint connectivity' })
async testEndpoint(@Param('id') id: string): Promise<EndpointTestResult> {}

@Get(':id/sessions')
@ApiOperation({ summary: 'Get active Flow sessions for debugging' })
async getFlowSessions(@Param('id') id: string): Promise<FlowSession[]> {}
```

---

## 3. YUKSEK - Hatali Kod Duzeltmeleri

### 3.1 flow_token Parsing

**Dosya:** `chatbot-execution.service.ts`

```typescript
// ESKI (HATALI)
const parts = flowToken.split('-');
if (parts.length < 10) { // YANLIS - 10 degil 6 olmali
  return;
}

// DUZELTILDI AMA DAHA IYI OLABILIR
if (parts.length < 6) {
  return;
}

// IDEAL COZUM - Regex ile validation
const FLOW_TOKEN_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-.+$/i;
if (!FLOW_TOKEN_REGEX.test(flowToken)) {
  this.logger.error(`Invalid flow_token format: ${flowToken}`);
  return;
}

const uuidLength = 36; // UUID length with dashes
const contextId = flowToken.substring(0, uuidLength);
const nodeId = flowToken.substring(uuidLength + 1);
```

### 3.2 Screen Name Validation

**MEVCUT DURUM:** Backend herhangi bir screen name donebilir, validation yok

**GEREKEN:**

```typescript
// flow-endpoint.service.ts'e eklenmeli

private async validateScreenTransition(
  flowId: string,
  currentScreen: string,
  nextScreen: string
): Promise<boolean> {
  const flowJson = await this.getFlowJson(flowId);
  const routingModel = flowJson.routing_model;

  const allowedScreens = routingModel[currentScreen] || [];
  if (!allowedScreens.includes(nextScreen)) {
    this.logger.error(
      `Invalid screen transition: ${currentScreen} -> ${nextScreen}. ` +
      `Allowed: ${allowedScreens.join(', ')}`
    );
    return false;
  }
  return true;
}
```

---

## 4. ORTA - Yeni Entity'ler

### 4.1 FlowDataSource Entity

```typescript
// backend/src/entities/flow-data-source.entity.ts

@Entity('flow_data_sources')
export class FlowDataSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  flowId: string;

  @ManyToOne(() => WhatsAppFlow)
  flow: WhatsAppFlow;

  @Column()
  name: string; // "strapi", "custom_api", etc.

  @Column({ type: 'enum', enum: ['STRAPI', 'REST_API', 'GRAPHQL', 'DATABASE'] })
  type: DataSourceType;

  @Column()
  baseUrl: string;

  @Column({ nullable: true })
  authType: 'BEARER' | 'API_KEY' | 'BASIC' | 'NONE';

  @Column({ nullable: true, type: 'text' })
  authToken: string; // Encrypted

  @Column({ type: 'jsonb', nullable: true })
  headers: Record<string, string>;

  @Column({ type: 'jsonb', nullable: true })
  mappings: DataSourceMapping[]; // Screen -> API endpoint mappings

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 4.2 FlowSession Entity (Debugging icin)

```typescript
// backend/src/entities/flow-session.entity.ts

@Entity('flow_sessions')
export class FlowSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  flowToken: string;

  @Column()
  flowId: string;

  @Column({ nullable: true })
  contextId: string;

  @Column()
  phoneNumber: string;

  @Column({ type: 'enum', enum: ['ACTIVE', 'COMPLETED', 'ERROR', 'TIMEOUT'] })
  status: FlowSessionStatus;

  @Column({ type: 'jsonb' })
  screenHistory: { screen: string; timestamp: Date; data: any }[];

  @Column({ type: 'jsonb', nullable: true })
  lastError: { message: string; screen: string; timestamp: Date };

  @CreateDateColumn()
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;
}
```

---

## 5. ORTA - Eksik Validation

### 5.1 Flow JSON Validation

**MEVCUT DURUM:** Flow JSON validation sadece WhatsApp API'ye gonderildiginde yapiliyor

**GEREKEN:**

```typescript
// backend/src/modules/flows/services/flow-validation.service.ts

@Injectable()
export class FlowValidationService {
  validateFlowJson(json: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Required fields
    if (!json.version) errors.push('Missing version');
    if (!json.screens?.length) errors.push('No screens defined');
    if (!json.routing_model) errors.push('Missing routing_model');

    // 2. Screen validation
    for (const screen of json.screens) {
      // Check data definitions have __example__
      if (screen.data) {
        for (const [key, def] of Object.entries(screen.data)) {
          if (!def.__example__) {
            warnings.push(`Screen ${screen.id}: Missing __example__ for ${key}`);
          }
        }
      }

      // Check routing_model includes this screen
      if (!json.routing_model[screen.id] && !screen.terminal) {
        errors.push(`Screen ${screen.id} not in routing_model`);
      }
    }

    // 3. Data binding validation
    const dataBindings = this.extractDataBindings(json);
    for (const binding of dataBindings) {
      if (!this.isValidBinding(binding, json)) {
        errors.push(`Invalid data binding: ${binding}`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
```

### 5.2 Strapi Connection Validation

```typescript
// Strapi baglantisi test endpoint'i

@Get('data-sources/:id/test')
async testDataSource(@Param('id') id: string): Promise<TestResult> {
  const dataSource = await this.dataSourceRepo.findOne({ where: { id } });

  try {
    const response = await fetch(`${dataSource.baseUrl}/api`, {
      headers: { Authorization: `Bearer ${dataSource.authToken}` }
    });

    return {
      success: response.ok,
      statusCode: response.status,
      latency: /* measure */,
      message: response.ok ? 'Connection successful' : await response.text()
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}
```

---

## 6. DUSUK - Kod Kalitesi

### 6.1 Error Handling

```typescript
// MEVCUT (ZAYIF)
try {
  const products = await this.fetchProducts();
} catch (error) {
  this.logger.error(`Failed: ${error.message}`);
  return { screen: 'ERROR_SCREEN', data: {} };
}

// OLMASI GEREKEN
try {
  const products = await this.fetchProducts();
} catch (error) {
  this.logger.error(`Failed to fetch products`, {
    error: error.message,
    stack: error.stack,
    flowToken: request.flow_token,
    screen: request.screen
  });

  // Kullaniciya anlamli hata mesaji
  return {
    screen: request.screen, // Ayni ekranda kal
    data: {
      error_message: this.getUserFriendlyError(error)
    }
  };
}
```

### 6.2 Logging Standardizasyonu

```typescript
// Tum Flow islemleri icin standard log format
interface FlowLogContext {
  flowId: string;
  flowToken: string;
  screen: string;
  action: 'INIT' | 'data_exchange' | 'BACK';
  phoneNumber?: string;
  duration?: number;
}

this.logger.log('Flow request processed', {
  ...context,
  responseScreen: response.screen,
  duration: Date.now() - startTime
});
```

---

## 7. Oncelik Siralaması

| Oncelik | Kategori | Islem | Tahmini Sure |
|---------|----------|-------|--------------|
| 1 | KRITIK | Hardcoded degerleri ConfigService'e tasi | 2 saat |
| 2 | KRITIK | FlowDataSource entity olustur | 4 saat |
| 3 | YUKSEK | Flow data source API endpoint'leri | 4 saat |
| 4 | YUKSEK | Chatbot node update endpoint'i | 2 saat |
| 5 | YUKSEK | flow_token parsing duzeltmesi | 1 saat |
| 6 | ORTA | Screen transition validation | 2 saat |
| 7 | ORTA | FlowSession entity (debugging) | 3 saat |
| 8 | ORTA | Flow JSON validation service | 3 saat |
| 9 | DUSUK | Error handling iyilestirmesi | 2 saat |
| 10 | DUSUK | Logging standardizasyonu | 2 saat |

**Toplam Tahmini Sure:** 25 saat (yaklasik 3-4 gun)

---

## 8. Etkilenen Dosyalar

```
backend/src/
├── entities/
│   ├── flow-data-source.entity.ts (YENİ)
│   ├── flow-session.entity.ts (YENİ)
│   └── whatsapp-flow.entity.ts (GUNCELLE - relation ekle)
├── modules/
│   ├── flows/
│   │   ├── flows.controller.ts (GUNCELLE - yeni endpoint'ler)
│   │   ├── flows.service.ts (GUNCELLE)
│   │   ├── dto/
│   │   │   ├── create-flow-data-source.dto.ts (YENİ)
│   │   │   └── update-flow-data-source.dto.ts (YENİ)
│   │   └── services/
│   │       ├── flow-data-source.service.ts (YENİ)
│   │       └── flow-validation.service.ts (YENİ)
│   ├── chatbots/
│   │   ├── chatbots.controller.ts (GUNCELLE - node update endpoint)
│   │   └── services/
│   │       └── chatbot-execution.service.ts (GUNCELLE - hardcoded degerler)
│   └── webhooks/
│       └── services/
│           └── flow-endpoint.service.ts (GUNCELLE - hardcoded degerler, validation)
└── migrations/
    ├── xxx-create-flow-data-sources.ts (YENİ)
    └── xxx-create-flow-sessions.ts (YENİ)
```
