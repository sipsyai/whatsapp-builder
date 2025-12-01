# WhatsApp Chatbot Flow Implementation - Complete Documentation

**Tarih:** 24 Kasım 2024
**Versiyon:** 1.0
**Durum:** Backend Tamamlandı ✅ | Frontend İyileştirme Gerekli ⚠️

---

## 🤖 Related Claude Code Resources

For development assistance, use these specialized AI agents and skills:

### Agents

| Agent | Use For |
|-------|---------|
| **@chatbot-builder-expert** | Chatbot flow design, node configuration, variable system |
| **@whatsapp-flow-builder-expert** | WhatsApp Flow JSON, screens, components, endpoint integration |

### Skills

| Skill | Content |
|-------|---------|
| **chatbot-flow-development** | 8 comprehensive reference documents covering all node types, edge routing, variables, WhatsApp Flow screens/components/actions, REST API integration, and 7 complete examples |

### Quick Access

```bash
# In Claude Code:
@chatbot-builder-expert help me create a customer support bot
@whatsapp-flow-builder-expert design an appointment booking flow

# Reference files at:
.claude/skills/chatbot-flow-development/reference/
```

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Backend İmplementasyonu](#backend-implementasyonu)
3. [Frontend İhtiyaçları](#frontend-ihtiyaçları)
4. [API Dokümantasyonu](#api-dokümantasyonu)
5. [Test Senaryoları](#test-senaryoları)
6. [Örnek Flow Yapıları](#örnek-flow-yapıları)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Genel Bakış

WhatsApp Chatbot Builder sistemi, kullanıcıların görsel bir arayüzle (ReactFlow) chatbot akışları tasarlamasına ve bu akışların WhatsApp üzerinden gerçek zamanlı çalışmasına olanak tanır.

### Sistem Mimarisi

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   WhatsApp      │──────▶│  Ngrok Webhook   │──────▶│  Backend API    │
│   Business API  │◀──────│                  │◀──────│  (NestJS)       │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                                              │
                                                              │
                         ┌────────────────────────────────────┤
                         ▼                                    ▼
                  ┌──────────────┐                  ┌─────────────────┐
                  │  Flow Engine │                  │   PostgreSQL    │
                  │  Execution   │                  │   Database      │
                  └──────────────┘                  └─────────────────┘
                         ▲
                         │
                  ┌──────────────┐
                  │   Frontend   │
                  │  Flow Builder│
                  │  (ReactFlow) │
                  └──────────────┘
```

### Desteklenen Node Tipleri

| Node Tipi | Açıklama | Durumu |
|-----------|----------|--------|
| **START** | Flow başlangıç noktası | ✅ Backend |
| **MESSAGE** | Text mesaj gönderme | ✅ Backend |
| **QUESTION (text)** | Serbest cevap sorusu | ✅ Backend |
| **QUESTION (buttons)** | Interactive buton sorusu (max 3) | ✅ Backend |
| **QUESTION (list)** | Interactive liste sorusu | ✅ Backend |
| **CONDITION** | Koşullu dallanma | ✅ Backend |
| **WHATSAPP_FLOW** | WhatsApp Flows entegrasyonu | ✅ Backend + Frontend |

### WhatsApp Flow Node Hakkında

WhatsApp Flow node'u, ChatBot içinde interaktif WhatsApp Flows kullanmanızı sağlar. Flow'lar iki şekilde elde edilebilir:

1. **Yerel Oluşturma**: Flows sayfasından manuel olarak Flow JSON ile oluşturma
2. **Meta'dan Senkronize Etme**: "Sync from Meta" butonu ile Meta Business Manager'dan mevcut Flow'ları içe aktarma

**Sync from Meta Özelliği:**
- `POST /api/flows/sync` endpoint'i ile tüm Flow'lar Meta API'den çekilir
- Yeni Flow'lar oluşturulur, mevcut olanlar güncellenir
- Flow JSON içeriği otomatik olarak indirilir
- Senkronize edilen Flow'lar `metadata.synced_from_meta: true` ile işaretlenir

---

## 🔧 Backend İmplementasyonu

### 1. Interactive Message Service

**Dosya:** `backend/src/modules/whatsapp/services/message-types/interactive-message.service.ts`
**DTO:** `backend/src/modules/whatsapp/dto/requests/send-interactive-message.dto.ts`

#### Özellikler:
- ✅ Button message gönderimi (WhatsApp interactive button API)
- ✅ List message gönderimi (WhatsApp interactive list API)
- ✅ Header, body, footer desteği
- ✅ Telefon numarası validasyonu
- ✅ WhatsApp API format uyumlu payload generation

#### Metotlar:

```typescript
// Button mesajı gönderme
sendButtonMessage(dto: SendInteractiveButtonDto): Promise<MessageResponse>

// List mesajı gönderme
sendListMessage(dto: SendInteractiveListDto): Promise<MessageResponse>
```

#### DTO Yapısı:

```typescript
interface SendInteractiveButtonDto {
  to: string;                    // "905551234567"
  bodyText: string;              // Ana mesaj
  headerText?: string;           // Başlık (opsiyonel)
  footerText?: string;           // Alt yazı (opsiyonel)
  buttons: ButtonItem[];         // Max 3 buton
}

interface ButtonItem {
  id: string;                    // "btn-0", "btn-1"
  title: string;                 // Max 20 karakter
}

interface SendInteractiveListDto {
  to: string;
  bodyText: string;
  listButtonText: string;        // Liste açma butonu
  headerText?: string;
  footerText?: string;
  sections: SectionItem[];       // Max 10 section
}

interface SectionItem {
  title: string;                 // Max 24 karakter
  rows: RowItem[];               // Max 10 row per section
}

interface RowItem {
  id: string;                    // "row-1"
  title: string;                 // Max 24 karakter
  description?: string;          // Max 72 karakter
}
```

#### WhatsApp API Format:

**Button Mesajı:**
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "905551234567",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "header": { "type": "text", "text": "Header" },
    "body": { "text": "Question?" },
    "footer": { "text": "Footer" },
    "action": {
      "buttons": [
        { "type": "reply", "reply": { "id": "btn-0", "title": "Evet" } },
        { "type": "reply", "reply": { "id": "btn-1", "title": "Hayır" } }
      ]
    }
  }
}
```

**List Mesajı:**
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "905551234567",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "header": { "type": "text", "text": "Header" },
    "body": { "text": "Body" },
    "footer": { "text": "Footer" },
    "action": {
      "button": "Seçenekleri Gör",
      "sections": [
        {
          "title": "Kategori 1",
          "rows": [
            { "id": "row-1", "title": "Seçenek 1", "description": "Açıklama" }
          ]
        }
      ]
    }
  }
}
```

---

### 2. Conversation Context Entity

**Dosya:** `backend/src/entities/conversation-context.entity.ts`
**Migration:** `backend/src/migrations/1732459200000-CreateConversationContextTable.ts`

#### Entity Yapısı:

```typescript
@Entity('conversation_contexts')
export class ConversationContext {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  conversationId: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  conversation: Conversation;

  @Column({ type: 'uuid' })
  flowId: string;

  @ManyToOne(() => Flow, { onDelete: 'CASCADE' })
  flow: Flow;

  @Column({ type: 'varchar', length: 255 })
  currentNodeId: string;          // Kullanıcının bulunduğu node

  @Column({ type: 'jsonb', default: {} })
  variables: Record<string, any>; // Kullanıcı cevapları

  @Column({ type: 'jsonb', default: [] })
  nodeHistory: string[];          // Ziyaret edilen node'lar

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### Database Schema:

```sql
CREATE TABLE conversation_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversationId" UUID NOT NULL,
  "flowId" UUID NOT NULL,
  "currentNodeId" VARCHAR(255) NOT NULL,
  variables JSONB DEFAULT '{}',
  "nodeHistory" JSONB DEFAULT '[]',
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),

  CONSTRAINT fk_conversation_context_conversation
    FOREIGN KEY ("conversationId") REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversation_context_flow
    FOREIGN KEY ("flowId") REFERENCES flows(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_conversation_context_conversation ON conversation_contexts("conversationId");
CREATE INDEX idx_conversation_context_flow ON conversation_contexts("flowId");
CREATE INDEX idx_conversation_context_active ON conversation_contexts("isActive");
CREATE INDEX idx_conversation_context_conversation_active
  ON conversation_contexts("conversationId", "isActive");
```

#### Örnek Context Data:

```json
{
  "id": "uuid",
  "conversationId": "conv-uuid",
  "flowId": "flow-uuid",
  "currentNodeId": "node-3",
  "variables": {
    "name": "Ali",
    "age": "25",
    "likesPizza": "Evet"
  },
  "nodeHistory": ["node-1", "node-2", "node-3"],
  "isActive": true
}
```

---

### 3. Flow Execution Service

**Dosya:** `backend/src/modules/flows/services/flow-execution.service.ts`
**Satır Sayısı:** 615 satır

#### Core Metodlar:

##### 3.1 `startFlow(conversationId: string, phoneNumber: string)`

Flow'u başlatır ve ilk node'u execute eder.

```typescript
async startFlow(conversationId: string, phoneNumber: string): Promise<void>
```

**Akış:**
1. İlk aktif flow'u bul (`isActive: true`)
2. START node'u bul
3. ConversationContext oluştur
4. START node'u execute et

**Error Handling:**
- Flow bulunamazsa: `NotFoundException('No active flow found')`
- START node yoksa: `NotFoundException('START node not found')`

---

##### 3.2 `executeCurrentNode(contextId: string)`

Mevcut node'u çalıştırır.

```typescript
async executeCurrentNode(contextId: string): Promise<void>
```

**Node Type Routing:**
- `'start'` → `processStartNode()`
- `'message'` → `processMessageNode()`
- `'question'` → `processQuestionNode()`
- `'condition'` → `processConditionNode()`

---

##### 3.3 `processStartNode(context, node)`

START node'dan sonraki node'a geçer.

**Davranış:**
- Otomatik olarak sonraki node'a geçer
- Hiçbir mesaj göndermez
- Context.currentNodeId güncellenir

---

##### 3.4 `processMessageNode(context, node)`

Text mesaj gönderir ve sonraki node'a geçer.

**Akış:**
1. `node.data.content` içeriğini al
2. Variable replacement uygula: `{{varName}}` → değer
3. Recipient phone al
4. `TextMessageService.sendTextMessage()` çağır
5. Sonraki node'u bul ve execute et

**Örnek Node Data:**
```json
{
  "id": "node-2",
  "type": "message",
  "data": {
    "type": "message",
    "label": "Hoş Geldin Mesajı",
    "content": "Merhaba {{name}}! Sistemimize hoş geldiniz."
  }
}
```

---

##### 3.5 `processQuestionNode(context, node)`

Question node'u çalıştırır (text/buttons/list).

**Akış:**
1. Question type belirle: `node.data.questionType`
2. Variable replacement uygula
3. Recipient phone al
4. Type'a göre mesaj gönder:
   - `text` → TextMessageService
   - `buttons` → InteractiveMessageService.sendButtonMessage()
   - `list` → InteractiveMessageService.sendListMessage()
5. **WAIT** - Kullanıcı cevabı beklenir, sonraki node'a geçilmez

**Text Question:**
```json
{
  "id": "node-3",
  "type": "question",
  "data": {
    "type": "question",
    "questionType": "text",
    "content": "Adınız nedir?",
    "variable": "name"
  }
}
```

**Button Question:**
```json
{
  "id": "node-4",
  "type": "question",
  "data": {
    "type": "question",
    "questionType": "buttons",
    "content": "Pizza sever misiniz?",
    "variable": "likesPizza",
    "buttons": ["Evet", "Hayır", "Bazen"],
    "headerText": "Yemek Tercihi",
    "footerText": "Lütfen seçin"
  }
}
```

**List Question:**
```json
{
  "id": "node-5",
  "type": "question",
  "data": {
    "type": "question",
    "questionType": "list",
    "content": "Hangi şehirde yaşıyorsunuz?",
    "variable": "city",
    "listButtonText": "Şehir Seç",
    "listSections": [
      {
        "id": "marmara",
        "title": "Marmara Bölgesi",
        "rows": [
          { "id": "istanbul", "title": "İstanbul", "description": "Türkiye'nin en kalabalık şehri" },
          { "id": "ankara", "title": "Ankara", "description": "Başkent" }
        ]
      }
    ],
    "headerText": "Şehir Seçimi",
    "footerText": "Lütfen bir şehir seçin"
  }
}
```

---

##### 3.6 `processUserResponse(conversationId, userMessage, buttonId?, listRowId?)`

Kullanıcının cevabını işler ve flow'u ilerletir.

```typescript
async processUserResponse(
  conversationId: string,
  userMessage: string,
  buttonId?: string,
  listRowId?: string
): Promise<void>
```

**Akış:**
1. Aktif context'i yükle
2. Mevcut node'u al (QUESTION node olmalı)
3. Cevabı `context.variables[node.data.variable]` olarak kaydet
4. Mevcut node'u `nodeHistory`'e ekle
5. Sonraki node'u bul (edge routing)
6. Context.currentNodeId güncelle
7. Sonraki node'u execute et

**Button/List Routing:**
- Button tıklandığında: `buttonId` (örn: "btn-0", "btn-1")
- List seçildiğinde: `listRowId` (örn: "istanbul", "ankara")
- Bu ID'ler edge'in `sourceHandle` alanı ile eşleştirilir

**Örnek Edge Yapısı:**
```json
{
  "id": "edge-1",
  "source": "question-node",
  "target": "next-node",
  "sourceHandle": "btn-0"  // "Evet" butonuna özel edge
}
```

---

##### 3.7 `processConditionNode(context, node)`

Koşullu dallanma yapar.

**Desteklenen Operatörler:**
- `==`, `equals` - Eşitlik
- `!=`, `not_equals` - Eşitsizlik
- `>`, `greater` - Büyüktür
- `<`, `less` - Küçüktür
- `>=`, `greater_or_equal` - Büyük eşit
- `<=`, `less_or_equal` - Küçük eşit
- `contains` - İçerir
- `not_contains` - İçermez

**Örnek Condition Node:**
```json
{
  "id": "node-6",
  "type": "condition",
  "data": {
    "type": "condition",
    "conditionVar": "age",
    "conditionOp": "greater",
    "conditionVal": "18"
  }
}
```

**Edge Routing:**
- Koşul true → `sourceHandle: "true"` olan edge
- Koşul false → `sourceHandle: "false"` olan edge

```json
[
  { "id": "e1", "source": "condition-node", "target": "adult-path", "sourceHandle": "true" },
  { "id": "e2", "source": "condition-node", "target": "child-path", "sourceHandle": "false" }
]
```

---

##### 3.8 `replaceVariables(text: string, variables: Record<string, any>)`

Metindeki variable placeholder'larını değerlerle değiştirir.

```typescript
replaceVariables(text: string, variables: Record<string, any>): string
```

**Syntax:** `{{varName}}`

**Örnekler:**
```typescript
replaceVariables("Merhaba {{name}}!", { name: "Ali" })
// → "Merhaba Ali!"

replaceVariables("{{name}}, yaşınız {{age}}", { name: "Ali", age: 25 })
// → "Ali, yaşınız 25"

replaceVariables("Toplam: {{total}} TL", { total: 150.50 })
// → "Toplam: 150.5 TL"
```

**Bulunamayan Variable:**
- `{{unknown}}` → `{{unknown}}` (değiştirilmez)

---

##### 3.9 Helper Metodlar

```typescript
// Aktif context var mı kontrol et
hasActiveContext(conversationId: string): Promise<boolean>

// Context yükle
loadContext(conversationId: string): Promise<ConversationContext>

// Flow'u durdur
stopFlow(conversationId: string): Promise<void>

// Sonraki node'u bul
findNextNode(flow: Flow, currentNodeId: string, sourceHandle?: string): any

// Node ID'ye göre node bul
findNodeById(flow: Flow, nodeId: string): any

// Conversation'dan recipient phone al
getRecipientPhone(conversation: Conversation): Promise<string>
```

---

### 4. Webhook Integration

**Dosya:** `backend/src/modules/webhooks/services/webhook-processor.service.ts`

#### Güncelleme:

`processMessage()` metoduna flow execution eklendi.

**Akış:**
```
WhatsApp Message → Webhook → Parse → Database Save → Flow Execution
```

**Kod:**
```typescript
async processMessage(parsedMessage: ParsedMessageDto): Promise<void> {
  // ... mevcut kod (user, conversation, message kaydetme) ...

  // 🆕 FLOW EXECUTION
  try {
    await this.executeFlow(conversation, parsedMessage);
  } catch (error) {
    this.logger.error('Flow execution error:', error);
    // Hata olsa bile mesaj kaydedilmiş olur
  }
}

private async executeFlow(
  conversation: Conversation,
  parsedMessage: ParsedMessageDto,
): Promise<void> {
  // Aktif context var mı?
  const hasContext = await this.flowExecutionService.hasActiveContext(
    conversation.id
  );

  if (hasContext) {
    // Kullanıcı flow içinde, cevabını işle
    const buttonId = parsedMessage.content.buttonId;
    const listRowId = parsedMessage.content.listId;
    const messageText =
      parsedMessage.content.body ||
      parsedMessage.content.buttonTitle ||
      parsedMessage.content.listTitle ||
      parsedMessage.content.caption ||
      '';

    await this.flowExecutionService.processUserResponse(
      conversation.id,
      messageText,
      buttonId,
      listRowId,
    );
  } else {
    // Yeni conversation, flow başlat
    await this.flowExecutionService.startFlow(
      conversation.id,
      parsedMessage.sender.phoneNumber,
    );
  }
}
```

**Parsed Message Structure:**
```typescript
interface ParsedMessageDto {
  messageId: string;
  sender: {
    phoneNumber: string;
    name?: string;
  };
  content: {
    type: MessageType;          // 'text' | 'interactive' | 'image' | ...
    body?: string;              // Text content
    buttonId?: string;          // Button click
    buttonTitle?: string;       // Button text
    listId?: string;            // List selection
    listTitle?: string;         // List row title
    caption?: string;           // Media caption
    // ... other fields
  };
  timestamp: number;
}
```

---

### 5. Module Dependencies

#### `WhatsAppModule` Güncellemesi:
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([/* entities */]),
    ConfigModule,
  ],
  providers: [
    WhatsAppApiService,
    WhatsAppConfigService,
    WhatsAppMessageService,
    TextMessageService,
    InteractiveMessageService,  // 🆕 EKLENDI
  ],
  exports: [
    WhatsAppApiService,
    WhatsAppConfigService,
    WhatsAppMessageService,
    TextMessageService,         // 🆕 EXPORT EDİLDİ
    InteractiveMessageService,  // 🆕 EXPORT EDİLDİ
  ],
})
export class WhatsAppModule {}
```

#### `FlowsModule` Güncellemesi:
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Flow,
      ConversationContext,  // 🆕 EKLENDI
      Conversation,         // 🆕 EKLENDI
      User,                 // 🆕 EKLENDI
    ]),
    WhatsAppModule,         // 🆕 IMPORT EDİLDİ
  ],
  controllers: [FlowsController],
  providers: [
    FlowsService,
    FlowExecutionService,   // 🆕 EKLENDI
  ],
  exports: [
    FlowsService,
    FlowExecutionService,   // 🆕 EXPORT EDİLDİ
  ],
})
export class FlowsModule {}
```

#### `WebhooksModule` Güncellemesi:
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([/* entities */]),
    FlowsModule,            // 🆕 EKLENDI
  ],
  controllers: [WebhooksController],
  providers: [
    WebhooksService,
    WebhookParserService,
    WebhookProcessorService,
    WebhookSignatureService,
  ],
})
export class WebhooksModule {}
```

---

## 🎨 Frontend İhtiyaçları

### 1. Flow Builder İyileştirmeleri

#### 1.1 Question Node UI Güncellemeleri

**Dosya:** `frontend/src/features/nodes/QuestionNode.tsx`

**Mevcut Durum:**
- ✅ Text question desteği var
- ✅ Buttons desteği var (basit)
- ✅ List desteği var (basit)

**Yapılması Gerekenler:**

##### A. Button Node İyileştirmesi

```typescript
// Mevcut: Basit string array
buttons: string[]  // ["Option 1", "Option 2"]

// İhtiyaç: ID'li yapı
buttons: ButtonItem[]  // [{ id: "btn-0", title: "Option 1" }]
```

**Neden Gerekli:**
- Backend button ID'leri ile edge routing yapıyor
- Frontend'de button ekleme/silme sırasında ID'ler kaybolmamalı
- Edge'ler button ID'lerine göre oluşturulmalı

**Çözüm:**
```typescript
interface ButtonItem {
  id: string;      // "btn-0", "btn-1", "btn-2"
  title: string;   // "Evet"
}

// Node data
data.buttons = [
  { id: "btn-0", title: "Evet" },
  { id: "btn-1", title: "Hayır" },
  { id: "btn-2", title: "Belki" }
]
```

**UI Değişikliği:**
```tsx
// Button ekleme
const addButton = () => {
  const newButton: ButtonItem = {
    id: `btn-${buttons.length}`,  // Auto-generate ID
    title: ""
  };
  setButtons([...buttons, newButton]);
};

// Button silme
const removeButton = (index: number) => {
  const newButtons = buttons.filter((_, i) => i !== index);
  // Re-index IDs
  newButtons.forEach((btn, i) => {
    btn.id = `btn-${i}`;
  });
  setButtons(newButtons);
};

// Render
{buttons.map((button, index) => (
  <div key={button.id}>
    <input
      value={button.title}
      onChange={(e) => {
        const newButtons = [...buttons];
        newButtons[index].title = e.target.value;
        setButtons(newButtons);
      }}
      placeholder={`Button ${index + 1}`}
      maxLength={20}  // WhatsApp limit
    />
    <button onClick={() => removeButton(index)}>Sil</button>
  </div>
))}
```

---

##### B. List Node İyileştirmesi

**Mevcut Durum:**
```typescript
listSections: {
  id: string;
  title: string;
  rows: {
    id: string;
    title: string;
    description: string
  }[];
}[]
```

**İyileştirmeler:**

1. **Section Management UI:**
```tsx
// Section ekleme
const addSection = () => {
  const newSection = {
    id: `section-${sections.length}`,
    title: "",
    rows: []
  };
  setSections([...sections, newSection]);
};

// Row ekleme
const addRow = (sectionIndex: number) => {
  const newSections = [...sections];
  const newRow = {
    id: `row-${newSections[sectionIndex].rows.length}`,
    title: "",
    description: ""
  };
  newSections[sectionIndex].rows.push(newRow);
  setSections(newSections);
};
```

2. **Validation:**
```typescript
// Max limits
const MAX_SECTIONS = 10;
const MAX_ROWS_PER_SECTION = 10;
const MAX_SECTION_TITLE = 24;
const MAX_ROW_TITLE = 24;
const MAX_ROW_DESC = 72;

// Validation fonksiyonu
const validateList = () => {
  if (sections.length > MAX_SECTIONS) {
    return "Maksimum 10 section olabilir";
  }
  for (const section of sections) {
    if (section.rows.length > MAX_ROWS_PER_SECTION) {
      return "Her section'da maksimum 10 row olabilir";
    }
    if (section.title.length > MAX_SECTION_TITLE) {
      return "Section başlığı maksimum 24 karakter olabilir";
    }
    for (const row of section.rows) {
      if (row.title.length > MAX_ROW_TITLE) {
        return "Row başlığı maksimum 24 karakter olabilir";
      }
      if (row.description.length > MAX_ROW_DESC) {
        return "Row açıklaması maksimum 72 karakter olabilir";
      }
    }
  }
  return null;
};
```

3. **UI Component:**
```tsx
<div className="list-builder">
  <label>Liste Butonu Metni:</label>
  <input
    value={listButtonText}
    onChange={(e) => setListButtonText(e.target.value)}
    placeholder="Seçenekleri Gör"
    maxLength={20}
  />

  {sections.map((section, sectionIndex) => (
    <div key={section.id} className="section">
      <input
        value={section.title}
        onChange={(e) => updateSectionTitle(sectionIndex, e.target.value)}
        placeholder="Section Başlığı"
        maxLength={24}
      />

      {section.rows.map((row, rowIndex) => (
        <div key={row.id} className="row">
          <input
            value={row.title}
            onChange={(e) => updateRowTitle(sectionIndex, rowIndex, e.target.value)}
            placeholder="Row Başlığı"
            maxLength={24}
          />
          <input
            value={row.description}
            onChange={(e) => updateRowDesc(sectionIndex, rowIndex, e.target.value)}
            placeholder="Açıklama (opsiyonel)"
            maxLength={72}
          />
          <button onClick={() => removeRow(sectionIndex, rowIndex)}>Sil</button>
        </div>
      ))}

      <button
        onClick={() => addRow(sectionIndex)}
        disabled={section.rows.length >= MAX_ROWS_PER_SECTION}
      >
        Row Ekle
      </button>
      <button onClick={() => removeSection(sectionIndex)}>Section Sil</button>
    </div>
  ))}

  <button
    onClick={addSection}
    disabled={sections.length >= MAX_SECTIONS}
  >
    Section Ekle
  </button>
</div>
```

---

##### C. Header/Footer Desteği

Tüm Question tiplerinde header ve footer desteği eklenmeli:

```tsx
// Question Node içinde
<div className="question-metadata">
  <label>Header (Opsiyonel):</label>
  <input
    value={headerText}
    onChange={(e) => setHeaderText(e.target.value)}
    placeholder="Başlık metni"
    maxLength={60}
  />

  <label>Footer (Opsiyonel):</label>
  <input
    value={footerText}
    onChange={(e) => setFooterText(e.target.value)}
    placeholder="Alt yazı"
    maxLength={60}
  />
</div>
```

---

#### 1.2 Edge Creation İyileştirmesi

**Problem:**
- Question (buttons/list) node'larından çıkan edge'lerde sourceHandle belirlenmeli
- Her button/list row için ayrı edge oluşturulabilmeli

**Çözüm:**

##### A. Custom Handles

```tsx
// QuestionNode.tsx
import { Handle, Position } from 'reactflow';

// Button node için
{questionType === 'buttons' && buttons.map((button, index) => (
  <Handle
    key={button.id}
    type="source"
    position={Position.Right}
    id={button.id}  // "btn-0", "btn-1", "btn-2"
    style={{ top: `${30 + index * 30}%` }}
  />
))}

// List node için
{questionType === 'list' && sections.map(section =>
  section.rows.map(row => (
    <Handle
      key={row.id}
      type="source"
      position={Position.Right}
      id={row.id}  // "row-1", "row-2"
    />
  ))
)}

// Text question için (tek handle)
{questionType === 'text' && (
  <Handle
    type="source"
    position={Position.Right}
    id="output"
  />
)}
```

##### B. Edge Connection Handler

```typescript
// FlowBuilder.tsx
const onConnect = useCallback((params: Connection) => {
  const edge: Edge = {
    ...params,
    id: `edge-${edges.length}`,
    sourceHandle: params.sourceHandle,  // Button/Row ID kaydedilir
  };

  setEdges((eds) => addEdge(edge, eds));
}, [edges]);
```

##### C. Visual Edge Labels

```tsx
// Edge'lere label ekleme
const enhancedEdges = edges.map(edge => {
  if (edge.sourceHandle && edge.sourceHandle.startsWith('btn-')) {
    // Button node'dan çıkan edge
    const sourceNode = nodes.find(n => n.id === edge.source);
    if (sourceNode?.data?.buttons) {
      const buttonIndex = parseInt(edge.sourceHandle.split('-')[1]);
      const buttonTitle = sourceNode.data.buttons[buttonIndex]?.title;
      return {
        ...edge,
        label: buttonTitle,
        type: 'smoothstep',
        animated: true,
      };
    }
  }
  return edge;
});
```

---

#### 1.3 Flow Validation

**Dosya:** `frontend/src/features/builder/utils/flowValidation.ts`

```typescript
interface ValidationError {
  nodeId: string;
  message: string;
  severity: 'error' | 'warning';
}

export const validateFlow = (
  nodes: Node[],
  edges: Edge[]
): ValidationError[] => {
  const errors: ValidationError[] = [];

  // 1. START node kontrolü
  const startNodes = nodes.filter(n => n.data.type === 'start');
  if (startNodes.length === 0) {
    errors.push({
      nodeId: 'flow',
      message: 'Flow bir START node ile başlamalıdır',
      severity: 'error'
    });
  }
  if (startNodes.length > 1) {
    errors.push({
      nodeId: 'flow',
      message: 'Flow sadece bir START node içerebilir',
      severity: 'error'
    });
  }

  // 2. Her node'un output edge kontrolü (son node hariç)
  nodes.forEach(node => {
    const outgoingEdges = edges.filter(e => e.source === node.id);

    if (node.data.type === 'condition') {
      // Condition node 2 edge'e sahip olmalı (true/false)
      const trueEdge = outgoingEdges.find(e => e.sourceHandle === 'true');
      const falseEdge = outgoingEdges.find(e => e.sourceHandle === 'false');

      if (!trueEdge) {
        errors.push({
          nodeId: node.id,
          message: 'Condition node "true" çıkışına sahip olmalı',
          severity: 'error'
        });
      }
      if (!falseEdge) {
        errors.push({
          nodeId: node.id,
          message: 'Condition node "false" çıkışına sahip olmalı',
          severity: 'error'
        });
      }
    } else if (node.data.type === 'question' && node.data.questionType === 'buttons') {
      // Button question tüm buttonlar için edge'e sahip olmalı
      const buttons = node.data.buttons || [];
      buttons.forEach((button: ButtonItem, index: number) => {
        const buttonEdge = outgoingEdges.find(e => e.sourceHandle === button.id);
        if (!buttonEdge) {
          errors.push({
            nodeId: node.id,
            message: `"${button.title}" butonu için edge tanımlanmamış`,
            severity: 'warning'
          });
        }
      });
    }
  });

  // 3. Orphan node kontrolü (bağlantısız node'lar)
  nodes.forEach(node => {
    if (node.data.type === 'start') return;

    const hasIncoming = edges.some(e => e.target === node.id);
    if (!hasIncoming) {
      errors.push({
        nodeId: node.id,
        message: 'Bu node hiçbir node\'a bağlı değil',
        severity: 'warning'
      });
    }
  });

  // 4. Variable name kontrolü (Question node'lar için)
  nodes.forEach(node => {
    if (node.data.type === 'question') {
      if (!node.data.variable || node.data.variable.trim() === '') {
        errors.push({
          nodeId: node.id,
          message: 'Question node için variable adı belirtilmeli',
          severity: 'error'
        });
      }
    }
  });

  // 5. Button/List content kontrolü
  nodes.forEach(node => {
    if (node.data.type === 'question') {
      if (node.data.questionType === 'buttons') {
        const buttons = node.data.buttons || [];
        if (buttons.length === 0) {
          errors.push({
            nodeId: node.id,
            message: 'En az bir button tanımlanmalı',
            severity: 'error'
          });
        }
        if (buttons.length > 3) {
          errors.push({
            nodeId: node.id,
            message: 'Maksimum 3 button tanımlanabilir',
            severity: 'error'
          });
        }
        buttons.forEach((btn: ButtonItem, i: number) => {
          if (!btn.title || btn.title.trim() === '') {
            errors.push({
              nodeId: node.id,
              message: `Button ${i + 1} boş olamaz`,
              severity: 'error'
            });
          }
          if (btn.title.length > 20) {
            errors.push({
              nodeId: node.id,
              message: `Button ${i + 1} maksimum 20 karakter olabilir`,
              severity: 'error'
            });
          }
        });
      }

      if (node.data.questionType === 'list') {
        const sections = node.data.listSections || [];
        if (sections.length === 0) {
          errors.push({
            nodeId: node.id,
            message: 'En az bir section tanımlanmalı',
            severity: 'error'
          });
        }
        if (sections.length > 10) {
          errors.push({
            nodeId: node.id,
            message: 'Maksimum 10 section tanımlanabilir',
            severity: 'error'
          });
        }
      }
    }
  });

  return errors;
};
```

**UI'de kullanımı:**

```tsx
// FlowBuilder.tsx
const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

const handleSave = async () => {
  const errors = validateFlow(nodes, edges);

  if (errors.some(e => e.severity === 'error')) {
    setValidationErrors(errors);
    toast.error('Flow kaydedilemedi. Lütfen hataları düzeltin.');
    return;
  }

  if (errors.some(e => e.severity === 'warning')) {
    setValidationErrors(errors);
    // Uyarılar varsa kullanıcıya sor
    const confirmed = window.confirm(
      'Bazı uyarılar var. Yine de kaydetmek istiyor musunuz?'
    );
    if (!confirmed) return;
  }

  // Kaydet
  await saveFlow({ nodes, edges });
};

// Validation errors gösterimi
{validationErrors.length > 0 && (
  <div className="validation-panel">
    {validationErrors.map((error, i) => (
      <div key={i} className={`error-${error.severity}`}>
        <strong>{error.nodeId}:</strong> {error.message}
      </div>
    ))}
  </div>
)}
```

---

#### 1.4 Flow Testing UI

**Dosya:** `frontend/src/features/flows/components/FlowTester.tsx`

Test mode özelliği eklenerek flow'lar test edilebilir:

```tsx
import React, { useState } from 'react';
import { Node, Edge } from 'reactflow';

interface Message {
  id: string;
  role: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

export const FlowTester: React.FC<{
  flowId: string;
  nodes: Node[];
  edges: Edge[];
}> = ({ flowId, nodes, edges }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentNodeId, setCurrentNodeId] = useState<string>('');
  const [variables, setVariables] = useState<Record<string, any>>({});

  // Simulate flow execution
  const simulateExecution = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    switch (node.data.type) {
      case 'start':
        // Move to next node
        const nextNode = findNextNode(nodeId);
        if (nextNode) simulateExecution(nextNode.id);
        break;

      case 'message':
        // Add bot message
        const content = replaceVariables(node.data.content, variables);
        addBotMessage(content);

        // Auto-proceed to next
        const next = findNextNode(nodeId);
        if (next) {
          setTimeout(() => simulateExecution(next.id), 500);
        }
        break;

      case 'question':
        // Add bot message and wait for user response
        const questionContent = replaceVariables(node.data.content, variables);
        addBotMessage(questionContent);
        setCurrentNodeId(nodeId);

        // Show buttons if applicable
        if (node.data.questionType === 'buttons') {
          // Render buttons in UI
        }
        break;
    }
  };

  const handleUserResponse = (response: string, handleId?: string) => {
    addUserMessage(response);

    // Save to variables
    const currentNode = nodes.find(n => n.id === currentNodeId);
    if (currentNode?.data.variable) {
      setVariables({
        ...variables,
        [currentNode.data.variable]: response
      });
    }

    // Find next node
    const nextNode = findNextNode(currentNodeId, handleId);
    if (nextNode) {
      setTimeout(() => simulateExecution(nextNode.id), 300);
    }
  };

  const findNextNode = (sourceId: string, sourceHandle?: string) => {
    const edge = edges.find(e =>
      e.source === sourceId &&
      (!sourceHandle || e.sourceHandle === sourceHandle)
    );
    if (!edge) return null;
    return nodes.find(n => n.id === edge.target);
  };

  const replaceVariables = (text: string, vars: Record<string, any>) => {
    return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return vars[varName] ?? match;
    });
  };

  const addBotMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'bot',
      content,
      timestamp: new Date()
    }]);
  };

  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    }]);
  };

  const startTest = () => {
    setMessages([]);
    setVariables({});
    const startNode = nodes.find(n => n.data.type === 'start');
    if (startNode) {
      simulateExecution(startNode.id);
    }
  };

  const currentNode = nodes.find(n => n.id === currentNodeId);
  const isWaitingForResponse = currentNode?.data.type === 'question';

  return (
    <div className="flow-tester">
      <div className="tester-header">
        <h3>Flow Test Mode</h3>
        <button onClick={startTest}>Testi Başlat</button>
      </div>

      <div className="chat-window">
        {messages.map(msg => (
          <div key={msg.id} className={`message message-${msg.role}`}>
            <div className="message-content">{msg.content}</div>
            <div className="message-time">
              {msg.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {isWaitingForResponse && (
        <div className="response-area">
          {currentNode.data.questionType === 'buttons' && (
            <div className="button-group">
              {currentNode.data.buttons.map((btn: any) => (
                <button
                  key={btn.id}
                  onClick={() => handleUserResponse(btn.title, btn.id)}
                  className="test-button"
                >
                  {btn.title}
                </button>
              ))}
            </div>
          )}

          {currentNode.data.questionType === 'list' && (
            <select
              onChange={(e) => {
                const [rowId, rowTitle] = e.target.value.split('::');
                handleUserResponse(rowTitle, rowId);
              }}
              className="test-select"
            >
              <option value="">Seçin...</option>
              {currentNode.data.listSections?.map((section: any) =>
                section.rows.map((row: any) => (
                  <option key={row.id} value={`${row.id}::${row.title}`}>
                    {row.title}
                  </option>
                ))
              )}
            </select>
          )}

          {currentNode.data.questionType === 'text' && (
            <div className="text-input-group">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Cevabınızı yazın..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && inputText.trim()) {
                    handleUserResponse(inputText);
                    setInputText('');
                  }
                }}
              />
              <button
                onClick={() => {
                  if (inputText.trim()) {
                    handleUserResponse(inputText);
                    setInputText('');
                  }
                }}
              >
                Gönder
              </button>
            </div>
          )}
        </div>
      )}

      {/* Variables Panel */}
      {Object.keys(variables).length > 0 && (
        <div className="variables-panel">
          <h4>Variables:</h4>
          <pre>{JSON.stringify(variables, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
```

**Usage:**

```tsx
// FlowBuilder.tsx
const [testMode, setTestMode] = useState(false);

{testMode && (
  <FlowTester
    flowId={flowId}
    nodes={nodes}
    edges={edges}
  />
)}

<button onClick={() => setTestMode(!testMode)}>
  {testMode ? 'Edit Mode' : 'Test Mode'}
</button>
```

---

#### 1.5 Flow List Sayfası İyileştirmeleri

**Dosya:** `frontend/src/features/flows/pages/FlowListPage.tsx`

**Gerekli Özellikler:**

1. **Flow Activation Toggle:**
```tsx
const toggleFlowStatus = async (flowId: string, currentStatus: boolean) => {
  try {
    await api.patch(`/flows/${flowId}`, {
      isActive: !currentStatus
    });
    toast.success(`Flow ${!currentStatus ? 'aktif' : 'pasif'} edildi`);
    refetchFlows();
  } catch (error) {
    toast.error('Durum güncellenemedi');
  }
};

// UI
<Switch
  checked={flow.isActive}
  onChange={() => toggleFlowStatus(flow.id, flow.isActive)}
  label={flow.isActive ? 'Aktif' : 'Pasif'}
/>
```

2. **Active Flow Badge:**
```tsx
{flows.map(flow => (
  <div className="flow-card">
    <div className="flow-header">
      <h3>{flow.name}</h3>
      {flow.isActive && (
        <span className="badge badge-success">Aktif</span>
      )}
    </div>
    {/* ... rest */}
  </div>
))}
```

3. **Flow Statistics:**
```tsx
// Backend'den istatistik endpointi
GET /api/flows/:id/statistics

// Response:
{
  totalExecutions: 150,
  activeContexts: 12,
  completionRate: 0.85,
  averageCompletionTime: "5m 30s",
  mostCommonPath: ["start", "message-1", "question-1", "message-2"]
}

// Frontend UI
<div className="flow-stats">
  <div className="stat">
    <span className="stat-label">Toplam Çalışma:</span>
    <span className="stat-value">{stats.totalExecutions}</span>
  </div>
  <div className="stat">
    <span className="stat-label">Aktif Kullanıcı:</span>
    <span className="stat-value">{stats.activeContexts}</span>
  </div>
  <div className="stat">
    <span className="stat-label">Tamamlanma Oranı:</span>
    <span className="stat-value">{(stats.completionRate * 100).toFixed(0)}%</span>
  </div>
</div>
```

---

### 2. API Integration Güncellemeleri

**Dosya:** `frontend/src/services/api/flowsApi.ts`

```typescript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const flowsApi = {
  // Flow CRUD
  getFlows: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }) => {
    const response = await axios.get(`${API_BASE_URL}/flows`, { params });
    return response.data;
  },

  getFlow: async (id: string) => {
    const response = await axios.get(`${API_BASE_URL}/flows/${id}`);
    return response.data;
  },

  createFlow: async (data: {
    name: string;
    description?: string;
    nodes: any[];
    edges: any[];
    isActive?: boolean;
  }) => {
    const response = await axios.post(`${API_BASE_URL}/flows`, data);
    return response.data;
  },

  updateFlow: async (id: string, data: Partial<{
    name: string;
    description: string;
    nodes: any[];
    edges: any[];
    isActive: boolean;
  }>) => {
    const response = await axios.put(`${API_BASE_URL}/flows/${id}`, data);
    return response.data;
  },

  deleteFlow: async (id: string) => {
    const response = await axios.delete(`${API_BASE_URL}/flows/${id}`);
    return response.data;
  },

  // Flow activation
  activateFlow: async (id: string) => {
    const response = await axios.patch(`${API_BASE_URL}/flows/${id}`, {
      isActive: true
    });
    return response.data;
  },

  deactivateFlow: async (id: string) => {
    const response = await axios.patch(`${API_BASE_URL}/flows/${id}`, {
      isActive: false
    });
    return response.data;
  },

  // Flow statistics (backend'de implement edilmeli)
  getFlowStatistics: async (id: string) => {
    const response = await axios.get(`${API_BASE_URL}/flows/${id}/statistics`);
    return response.data;
  },

  // Active contexts (backend'de implement edilmeli)
  getActiveContexts: async (flowId: string) => {
    const response = await axios.get(`${API_BASE_URL}/flows/${flowId}/contexts`);
    return response.data;
  },
};
```

---

### 3. TypeScript Type Definitions

**Dosya:** `frontend/src/shared/types/flow.types.ts`

```typescript
export type NodeDataType = 'start' | 'message' | 'question' | 'condition';
export type QuestionType = 'text' | 'buttons' | 'list';

export interface ButtonItem {
  id: string;        // "btn-0", "btn-1", "btn-2"
  title: string;     // Max 20 chars
}

export interface RowItem {
  id: string;        // "row-1", "row-2"
  title: string;     // Max 24 chars
  description?: string; // Max 72 chars
}

export interface SectionItem {
  id: string;
  title: string;     // Max 24 chars
  rows: RowItem[];   // Max 10 rows
}

export interface NodeData {
  // Common
  label: string;
  type: NodeDataType;

  // Message node
  content?: string;
  messageType?: string;

  // Question node
  questionType?: QuestionType;
  variable?: string;              // Variable name to store answer
  headerText?: string;
  footerText?: string;

  // Question (text)
  // Uses only content field

  // Question (buttons)
  buttons?: ButtonItem[];         // Max 3 buttons

  // Question (list)
  listButtonText?: string;        // "Select an option"
  listSections?: SectionItem[];   // Max 10 sections

  // Condition node
  conditionVar?: string;          // Variable to check
  conditionOp?: string;           // Operator: ==, !=, >, <, etc.
  conditionVal?: string;          // Value to compare
}

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: NodeData;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;  // For button/list routing
  label?: string;
  type?: string;
  animated?: boolean;
}

export interface Flow {
  id: string;
  name: string;
  description?: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface FlowStatistics {
  totalExecutions: number;
  activeContexts: number;
  completionRate: number;
  averageCompletionTime: string;
  mostCommonPath: string[];
}

export interface ConversationContext {
  id: string;
  conversationId: string;
  flowId: string;
  currentNodeId: string;
  variables: Record<string, any>;
  nodeHistory: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

### 4. UI/UX İyileştirmeleri

#### 4.1 Node Color Coding

```css
/* Node types için renkler */
.node-start {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.node-message {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.node-question {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.node-condition {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
}

/* Question subtypes */
.node-question[data-question-type="text"] {
  border-left: 5px solid #00f2fe;
}

.node-question[data-question-type="buttons"] {
  border-left: 5px solid #4facfe;
}

.node-question[data-question-type="list"] {
  border-left: 5px solid #0575e6;
}
```

#### 4.2 Node Icons

```tsx
import {
  PlayIcon,
  ChatBubbleIcon,
  QuestionMarkCircleIcon,
  BranchIcon
} from '@heroicons/react/outline';

const getNodeIcon = (type: NodeDataType) => {
  switch (type) {
    case 'start':
      return <PlayIcon className="w-5 h-5" />;
    case 'message':
      return <ChatBubbleIcon className="w-5 h-5" />;
    case 'question':
      return <QuestionMarkCircleIcon className="w-5 h-5" />;
    case 'condition':
      return <BranchIcon className="w-5 h-5" />;
  }
};
```

#### 4.3 Responsive Canvas Controls

```tsx
import { Controls, MiniMap, Background } from 'reactflow';

<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  fitView
>
  <Background color="#aaa" gap={16} />
  <Controls />
  <MiniMap
    nodeColor={(node) => {
      switch (node.data.type) {
        case 'start': return '#667eea';
        case 'message': return '#f5576c';
        case 'question': return '#00f2fe';
        case 'condition': return '#fee140';
        default: return '#eee';
      }
    }}
  />
</ReactFlow>
```

---

### 5. Frontend Checklist

#### Zorunlu Özellikler ✅
- [ ] Button Node: ID-based button management
- [ ] List Node: Section ve row management UI
- [ ] Header/Footer input fields (tüm question types)
- [ ] Custom handles (button/list için)
- [ ] Edge sourceHandle yönetimi
- [ ] Flow validation (kaydetmeden önce)
- [ ] Flow activation toggle (list page)
- [ ] Active flow badge/indicator

#### İsteğe Bağlı Özellikler ⭐
- [ ] Flow test mode (simulator)
- [ ] Flow statistics dashboard
- [ ] Node templates (pre-defined flows)
- [ ] Variable autocomplete (content field'da)
- [ ] Drag & drop node palette
- [ ] Flow versioning
- [ ] Export/Import flow (JSON)
- [ ] Dark mode support

---

## 📡 API Dokümantasyonu

### Flow Endpoints

#### `POST /api/flows`
Flow oluşturur.

**Request Body:**
```json
{
  "name": "Müşteri Anket Flow'u",
  "description": "Müşteri memnuniyeti anketi",
  "nodes": [...],
  "edges": [...],
  "isActive": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Müşteri Anket Flow'u",
  "description": "Müşteri memnuniyeti anketi",
  "nodes": [...],
  "edges": [...],
  "isActive": true,
  "createdAt": "2024-11-24T10:00:00Z",
  "updatedAt": "2024-11-24T10:00:00Z"
}
```

---

#### `GET /api/flows`
Flow listesini döner.

**Query Parameters:**
- `page` (number): Sayfa numarası (default: 1)
- `limit` (number): Sayfa başına item (default: 10)
- `search` (string): Arama terimi
- `isActive` (boolean): Aktif flow filtreleme

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Flow 1",
      "isActive": true,
      "createdAt": "2024-11-24T10:00:00Z"
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

#### `GET /api/flows/:id`
Tek bir flow'u döner.

**Response:**
```json
{
  "id": "uuid",
  "name": "Flow Adı",
  "description": "Açıklama",
  "nodes": [
    {
      "id": "node-1",
      "type": "start",
      "data": { "type": "start", "label": "Başlangıç" }
    },
    {
      "id": "node-2",
      "type": "message",
      "data": {
        "type": "message",
        "label": "Hoş Geldiniz",
        "content": "Merhaba {{name}}!"
      }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "node-1",
      "target": "node-2"
    }
  ],
  "isActive": true,
  "createdAt": "2024-11-24T10:00:00Z",
  "updatedAt": "2024-11-24T10:00:00Z"
}
```

---

#### `PUT /api/flows/:id`
Flow'u günceller.

**Request Body:**
```json
{
  "name": "Güncellenmiş İsim",
  "description": "Yeni açıklama",
  "nodes": [...],
  "edges": [...],
  "isActive": false
}
```

---

#### `PATCH /api/flows/:id`
Flow'un belirli alanlarını günceller (partial update).

**Request Body:**
```json
{
  "isActive": true
}
```

---

#### `DELETE /api/flows/:id`
Flow'u siler (soft delete).

**Response:**
```json
{
  "message": "Flow deleted successfully"
}
```

---

### Webhook Endpoints

#### `GET /api/webhooks/whatsapp`
WhatsApp webhook verification.

**Query Parameters:**
- `hub.mode`: "subscribe"
- `hub.verify_token`: Verify token (env'den)
- `hub.challenge`: Challenge string

**Response:**
Challenge string (text/plain)

---

#### `POST /api/webhooks/whatsapp`
WhatsApp mesajlarını alır.

**Headers:**
- `X-Hub-Signature-256`: HMAC-SHA256 signature

**Request Body:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "...",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "messages": [{
          "from": "905551234567",
          "id": "wamid...",
          "timestamp": "1732446000",
          "type": "text",
          "text": {
            "body": "Merhaba"
          }
        }]
      }
    }]
  }]
}
```

**Response:**
```json
{
  "status": "ok"
}
```

---

### Context Endpoints (Geliştirilmeli)

#### `GET /api/contexts/:conversationId`
Conversation'ın aktif context'ini döner.

**Response:**
```json
{
  "id": "uuid",
  "conversationId": "conv-uuid",
  "flowId": "flow-uuid",
  "currentNodeId": "node-3",
  "variables": {
    "name": "Ali",
    "age": 25
  },
  "nodeHistory": ["node-1", "node-2", "node-3"],
  "isActive": true,
  "createdAt": "2024-11-24T10:00:00Z",
  "updatedAt": "2024-11-24T10:05:00Z"
}
```

---

#### `DELETE /api/contexts/:conversationId`
Conversation'ın aktif flow'unu durdurur.

**Response:**
```json
{
  "message": "Flow stopped successfully"
}
```

---

## 🧪 Test Senaryoları

### Test 1: Basit Message Flow

**Flow Yapısı:**
```
START → MESSAGE("Merhaba!") → END
```

**Beklenen Sonuç:**
1. Kullanıcı mesaj gönderir
2. Bot "Merhaba!" yanıtını gönderir
3. Flow biter

**Test Adımları:**
1. Flow'u oluştur ve aktif et
2. WhatsApp'tan herhangi bir mesaj gönder
3. Bot yanıtını kontrol et

**Database Kontrolü:**
```sql
SELECT * FROM conversation_contexts
WHERE "conversationId" = 'xxx' AND "isActive" = false;

SELECT variables FROM conversation_contexts WHERE id = 'xxx';
-- Expected: {}
```

---

### Test 2: Text Question Flow

**Flow Yapısı:**
```
START → MESSAGE("Merhaba!") → QUESTION(text: "Adınız?", var: "name")
      → MESSAGE("Teşekkürler {{name}}!") → END
```

**Beklenen Sonuç:**
1. Bot: "Merhaba!"
2. Bot: "Adınız?"
3. Kullanıcı: "Ali"
4. Bot: "Teşekkürler Ali!"

**Database Kontrolü:**
```sql
SELECT variables FROM conversation_contexts WHERE "conversationId" = 'xxx';
-- Expected: {"name": "Ali"}
```

---

### Test 3: Button Question Flow

**Flow Yapısı:**
```
START → QUESTION(buttons: ["Evet", "Hayır"], var: "answer")
      → MESSAGE("Cevabınız: {{answer}}") → END
```

**Beklenen Sonuç:**
1. Bot button mesajı gönderir
2. Kullanıcı "Evet" butonuna basar
3. Bot: "Cevabınız: Evet"

**WhatsApp Response:**
```json
{
  "interactive": {
    "type": "button_reply",
    "button_reply": {
      "id": "btn-0",
      "title": "Evet"
    }
  }
}
```

**Database Kontrolü:**
```sql
SELECT variables FROM conversation_contexts WHERE "conversationId" = 'xxx';
-- Expected: {"answer": "Evet"}
```

---

### Test 4: List Question Flow

**Flow Yapısı:**
```
START → QUESTION(list: sections, var: "city")
      → MESSAGE("Şehriniz: {{city}}") → END
```

**Beklenen Sonuç:**
1. Bot list mesajı gönderir
2. Kullanıcı "İstanbul" seçer
3. Bot: "Şehriniz: İstanbul"

**WhatsApp Response:**
```json
{
  "interactive": {
    "type": "list_reply",
    "list_reply": {
      "id": "istanbul",
      "title": "İstanbul",
      "description": "Türkiye'nin en kalabalık şehri"
    }
  }
}
```

---

### Test 5: Condition Flow

**Flow Yapısı:**
```
START → QUESTION(text: "Yaşınız?", var: "age")
      → CONDITION(age > 18)
         ├─ TRUE → MESSAGE("Yetişkinsiniz")
         └─ FALSE → MESSAGE("Çocuksunuz")
      → END
```

**Test Case 1: Yaş > 18**
- Kullanıcı: "25"
- Bot: "Yetişkinsiniz"

**Test Case 2: Yaş <= 18**
- Kullanıcı: "15"
- Bot: "Çocuksunuz"

---

### Test 6: Complex Multi-Question Flow

**Flow Yapısı:**
```
START
→ MESSAGE("Anketimize hoş geldiniz!")
→ QUESTION(text: "Adınız?", var: "name")
→ QUESTION(buttons: ["18-25", "26-35", "36+"], var: "age_range")
→ QUESTION(list: pizza_types, var: "favorite_pizza")
→ MESSAGE("Teşekkürler {{name}}! {{age_range}} yaş aralığındasınız ve en sevdiğiniz pizza {{favorite_pizza}}.")
→ END
```

**Beklenen Akış:**
1. Bot: "Anketimize hoş geldiniz!"
2. Bot: "Adınız?"
3. Kullanıcı: "Ali"
4. Bot: Button mesajı (18-25, 26-35, 36+)
5. Kullanıcı: "26-35" butonuna basar
6. Bot: List mesajı (Margherita, Pepperoni, Vegetarian)
7. Kullanıcı: "Pepperoni" seçer
8. Bot: "Teşekkürler Ali! 26-35 yaş aralığındasınız ve en sevdiğiniz pizza Pepperoni."

**Final Variables:**
```json
{
  "name": "Ali",
  "age_range": "26-35",
  "favorite_pizza": "Pepperoni"
}
```

---

## 📦 Örnek Flow Yapıları

### Örnek 1: Müşteri Destek Bot

```json
{
  "name": "Müşteri Destek",
  "nodes": [
    {
      "id": "start",
      "type": "start",
      "data": { "type": "start", "label": "Başla" }
    },
    {
      "id": "welcome",
      "type": "message",
      "data": {
        "type": "message",
        "label": "Hoş Geldiniz",
        "content": "Müşteri destek hattımıza hoş geldiniz!"
      }
    },
    {
      "id": "category",
      "type": "question",
      "data": {
        "type": "question",
        "questionType": "list",
        "content": "Hangi konuda yardım istersiniz?",
        "variable": "support_category",
        "listButtonText": "Kategori Seç",
        "listSections": [
          {
            "id": "technical",
            "title": "Teknik Destek",
            "rows": [
              { "id": "login", "title": "Giriş Sorunu", "description": "Hesabınıza giriş yapamıyorum" },
              { "id": "bug", "title": "Hata Bildirimi", "description": "Sistemde bir hata buldum" }
            ]
          },
          {
            "id": "billing",
            "title": "Fatura ve Ödeme",
            "rows": [
              { "id": "payment", "title": "Ödeme Sorunu", "description": "Ödeme işlemi gerçekleşmedi" },
              { "id": "invoice", "title": "Fatura İsteği", "description": "Fatura almak istiyorum" }
            ]
          }
        ]
      }
    },
    {
      "id": "response",
      "type": "message",
      "data": {
        "type": "message",
        "label": "Yanıt",
        "content": "{{support_category}} konusunda size yardımcı olacağız. Lütfen sorununuzu detaylı anlatın."
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "start", "target": "welcome" },
    { "id": "e2", "source": "welcome", "target": "category" },
    { "id": "e3", "source": "category", "target": "response", "sourceHandle": "login" },
    { "id": "e4", "source": "category", "target": "response", "sourceHandle": "bug" },
    { "id": "e5", "source": "category", "target": "response", "sourceHandle": "payment" },
    { "id": "e6", "source": "category", "target": "response", "sourceHandle": "invoice" }
  ]
}
```

---

### Örnek 2: Restoran Sipariş Bot

```json
{
  "name": "Restoran Sipariş",
  "nodes": [
    {
      "id": "start",
      "type": "start",
      "data": { "type": "start" }
    },
    {
      "id": "welcome",
      "type": "message",
      "data": {
        "type": "message",
        "content": "Restoranımıza hoş geldiniz! 🍕"
      }
    },
    {
      "id": "name",
      "type": "question",
      "data": {
        "type": "question",
        "questionType": "text",
        "content": "Adınız nedir?",
        "variable": "customer_name"
      }
    },
    {
      "id": "menu",
      "type": "question",
      "data": {
        "type": "question",
        "questionType": "list",
        "content": "Ne sipariş etmek istersiniz?",
        "variable": "order_item",
        "listButtonText": "Menü",
        "headerText": "Ana Menü",
        "listSections": [
          {
            "id": "pizza",
            "title": "Pizza",
            "rows": [
              { "id": "margherita", "title": "Margherita", "description": "65 TL" },
              { "id": "pepperoni", "title": "Pepperoni", "description": "75 TL" }
            ]
          },
          {
            "id": "pasta",
            "title": "Makarna",
            "rows": [
              { "id": "carbonara", "title": "Carbonara", "description": "55 TL" },
              { "id": "bolognese", "title": "Bolognese", "description": "60 TL" }
            ]
          }
        ]
      }
    },
    {
      "id": "quantity",
      "type": "question",
      "data": {
        "type": "question",
        "questionType": "buttons",
        "content": "Kaç porsiyon istersiniz?",
        "variable": "quantity",
        "buttons": [
          { "id": "btn-0", "title": "1" },
          { "id": "btn-1", "title": "2" },
          { "id": "btn-2", "title": "3+" }
        ]
      }
    },
    {
      "id": "confirm",
      "type": "question",
      "data": {
        "type": "question",
        "questionType": "buttons",
        "content": "{{customer_name}}, {{quantity}} porsiyon {{order_item}} siparişinizi onaylıyor musunuz?",
        "variable": "confirmation",
        "headerText": "Sipariş Özeti",
        "buttons": [
          { "id": "btn-0", "title": "Onayla" },
          { "id": "btn-1", "title": "İptal" }
        ]
      }
    },
    {
      "id": "success",
      "type": "message",
      "data": {
        "type": "message",
        "content": "Siparişiniz alındı! 30 dakika içinde hazır olacak. 🎉"
      }
    },
    {
      "id": "cancel",
      "type": "message",
      "data": {
        "type": "message",
        "content": "Sipariş iptal edildi. Tekrar görüşmek üzere!"
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "start", "target": "welcome" },
    { "id": "e2", "source": "welcome", "target": "name" },
    { "id": "e3", "source": "name", "target": "menu" },
    { "id": "e4", "source": "menu", "target": "quantity" },
    { "id": "e5", "source": "quantity", "target": "confirm" },
    { "id": "e6", "source": "confirm", "target": "success", "sourceHandle": "btn-0" },
    { "id": "e7", "source": "confirm", "target": "cancel", "sourceHandle": "btn-1" }
  ]
}
```

---

### Örnek 3: Randevu Sistemi

```json
{
  "name": "Randevu Alma",
  "nodes": [
    {
      "id": "start",
      "type": "start",
      "data": { "type": "start" }
    },
    {
      "id": "intro",
      "type": "message",
      "data": {
        "type": "message",
        "content": "Randevu sistemi. Randevu almak için aşağıdaki adımları takip edin."
      }
    },
    {
      "id": "name",
      "type": "question",
      "data": {
        "type": "question",
        "questionType": "text",
        "content": "Ad Soyad?",
        "variable": "patient_name"
      }
    },
    {
      "id": "phone",
      "type": "question",
      "data": {
        "type": "question",
        "questionType": "text",
        "content": "Telefon numaranız?",
        "variable": "phone"
      }
    },
    {
      "id": "department",
      "type": "question",
      "data": {
        "type": "question",
        "questionType": "list",
        "content": "Hangi bölüm için randevu almak istersiniz?",
        "variable": "department",
        "listButtonText": "Bölüm Seç",
        "listSections": [
          {
            "id": "general",
            "title": "Genel",
            "rows": [
              { "id": "dahiliye", "title": "Dahiliye" },
              { "id": "genel_cerrahi", "title": "Genel Cerrahi" }
            ]
          },
          {
            "id": "specialist",
            "title": "Uzman",
            "rows": [
              { "id": "kardiyoloji", "title": "Kardiyoloji" },
              { "id": "noroloji", "title": "Nöroloji" }
            ]
          }
        ]
      }
    },
    {
      "id": "date",
      "type": "question",
      "data": {
        "type": "question",
        "questionType": "buttons",
        "content": "Hangi tarih uygun?",
        "variable": "appointment_date",
        "buttons": [
          { "id": "btn-0", "title": "Bugün" },
          { "id": "btn-1", "title": "Yarın" },
          { "id": "btn-2", "title": "Diğer" }
        ]
      }
    },
    {
      "id": "confirm",
      "type": "message",
      "data": {
        "type": "message",
        "content": "{{patient_name}}, {{department}} bölümü için {{appointment_date}} tarihinde randevunuz oluşturuldu. Telefon: {{phone}}"
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "start", "target": "intro" },
    { "id": "e2", "source": "intro", "target": "name" },
    { "id": "e3", "source": "name", "target": "phone" },
    { "id": "e4", "source": "phone", "target": "department" },
    { "id": "e5", "source": "department", "target": "date" },
    { "id": "e6", "source": "date", "target": "confirm" }
  ]
}
```

---

## 🔍 Troubleshooting

### Problem 1: Flow Başlamıyor

**Belirti:**
- Kullanıcı mesaj gönderiyor ama bot yanıt vermiyor

**Kontrol Listesi:**
1. Flow aktif mi?
   ```sql
   SELECT * FROM flows WHERE "isActive" = true;
   ```

2. START node var mı?
   ```sql
   SELECT nodes FROM flows WHERE id = 'flow-uuid';
   -- Check if nodes array contains a node with type: "start"
   ```

3. Backend loglarını kontrol et:
   ```bash
   # Backend logs
   [FlowExecutionService] Starting flow...
   [FlowExecutionService] No active flow found  # ❌ Problem
   ```

4. Webhook çalışıyor mu?
   ```bash
   # Test webhook
   curl -X POST http://localhost:3000/api/webhooks/whatsapp \
     -H "Content-Type: application/json" \
     -d '{"test": "message"}'
   ```

**Çözüm:**
- Flow'u aktif et
- START node ekle
- Backend'i restart et

---

### Problem 2: Button Mesajı Gönderilmiyor

**Belirti:**
- Question (buttons) node'da hata alınıyor

**Kontrol Listesi:**
1. Button count kontrolü (max 3)
2. Button title uzunluğu (max 20 karakter)
3. InteractiveMessageService inject edilmiş mi?

**Log Örneği:**
```
[FlowExecutionService] Processing QUESTION node (buttons)...
[InteractiveMessageService] Sending button message...
Error: Button title exceeds 20 characters  # ❌
```

**Çözüm:**
```typescript
// Frontend validation
buttons.forEach(btn => {
  if (btn.title.length > 20) {
    throw new Error(`Button "${btn.title}" çok uzun (max 20 karakter)`);
  }
});
```

---

### Problem 3: Variable Replacement Çalışmıyor

**Belirti:**
- Mesajda `{{name}}` görünüyor, değiştirilmiyor

**Kontrol Listesi:**
1. Variable kaydedilmiş mi?
   ```sql
   SELECT variables FROM conversation_contexts WHERE "conversationId" = 'xxx';
   ```

2. Variable adı doğru mu?
   ```typescript
   // Question node'da
   variable: "name"  // ✅

   // Message node'da
   content: "Merhaba {{name}}!"  // ✅ Matches

   // Yanlış kullanım
   content: "Merhaba {{userName}}!"  // ❌ Variable name mismatch
   ```

3. replaceVariables fonksiyonu çağrılıyor mu?
   ```typescript
   // FlowExecutionService
   const content = this.replaceVariables(
     node.data.content,
     context.variables
   );
   ```

**Debug:**
```typescript
console.log('Variables:', context.variables);
console.log('Original:', node.data.content);
console.log('Replaced:', replacedContent);
```

---

### Problem 4: Edge Routing Çalışmıyor

**Belirti:**
- Button tıklanınca yanlış node'a gidiyor

**Kontrol Listesi:**
1. Edge sourceHandle doğru mu?
   ```json
   {
     "source": "question-node",
     "target": "yes-path",
     "sourceHandle": "btn-0"  // Button ID ile eşleşmeli
   }
   ```

2. Button ID'ler tutarlı mı?
   ```typescript
   // Question node data
   buttons: [
     { id: "btn-0", title: "Evet" },  // ✅
     { id: "btn-1", title: "Hayır" }
   ]

   // Edge
   { sourceHandle: "btn-0" }  // ✅ Matches
   ```

3. findNextNode fonksiyonunda sourceHandle kullanılıyor mu?
   ```typescript
   const edge = flow.edges.find(e =>
     e.source === currentNodeId &&
     e.sourceHandle === buttonId  // ✅ Check this
   );
   ```

---

### Problem 5: Context Birden Fazla Oluşuyor

**Belirti:**
- Aynı conversation için birden fazla aktif context

**Kontrol:**
```sql
SELECT * FROM conversation_contexts
WHERE "conversationId" = 'xxx' AND "isActive" = true;
-- Sadece 1 tane olmalı
```

**Çözüm:**
- Unique index ekle:
```sql
CREATE UNIQUE INDEX idx_conversation_context_unique_active
ON conversation_contexts("conversationId")
WHERE "isActive" = true;
```

- startFlow'da kontrol ekle:
```typescript
const existingContext = await this.contextRepository.findOne({
  where: {
    conversationId,
    isActive: true,
  },
});

if (existingContext) {
  throw new ConflictException('Active context already exists');
}
```

---

### Problem 6: Condition Node Çalışmıyor

**Belirti:**
- Koşul doğru olsa da yanlış path'e gidiyor

**Debug:**
```typescript
// FlowExecutionService.processConditionNode
console.log('Condition var:', conditionVar);
console.log('Variable value:', context.variables[conditionVar]);
console.log('Operator:', conditionOp);
console.log('Condition val:', conditionVal);
console.log('Result:', result);
```

**Yaygın Hatalar:**
```typescript
// ❌ String comparison for numbers
"25" > "8"  // false (string comparison)

// ✅ Convert to number
parseInt("25") > parseInt("8")  // true

// Backend'de kontrol et:
if (conditionOp === 'greater' || conditionOp === '>') {
  const val1 = parseFloat(varValue);
  const val2 = parseFloat(conditionVal);
  return val1 > val2;
}
```

---

## 📚 Kaynaklar

### WhatsApp API Docs
- [Interactive Messages](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages#interactive-messages)
- [Button Messages](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#interactive-object)
- [List Messages](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#list-messages)
- [Webhook Payloads](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples)

### ReactFlow
- [ReactFlow Docs](https://reactflow.dev/)
- [Custom Nodes](https://reactflow.dev/learn/customization/custom-nodes)
- [Handles](https://reactflow.dev/learn/customization/custom-nodes#handles)

### NestJS
- [NestJS Docs](https://docs.nestjs.com/)
- [TypeORM Integration](https://docs.nestjs.com/techniques/database)
- [Dependency Injection](https://docs.nestjs.com/fundamentals/custom-providers)

---

## 📝 Notlar

### Backend Tamamlandı ✅
- Interactive Message Service
- Conversation Context Entity
- Flow Execution Service (615 satır)
- Webhook Integration
- Variable Management
- Module Dependencies
- Database Migration
- Custom DTO Validation (IsStringOrNumber validator)
- Multi-Condition Groups (ConditionGroupDto)
- LIST/BUTTONS ID-based selection (kritik fix)

**Detayli Backend Dokumantasyonu:** [docs/chatbot-builder/07-backend-execution.md](chatbot-builder/07-backend-execution.md)

### Frontend Gerekli ⚠️
- Button/List Node UI iyileştirmeleri
- Custom handles
- Edge sourceHandle management
- Flow validation
- Test mode
- Flow activation toggle

### Gelecek Özellikler 🔮
- Flow analytics/statistics
- A/B testing
- Flow versioning
- Template library
- Multi-language support
- Scheduled messages
- Webhook event logging
- Error recovery mechanism

---

**Son Güncelleme:** 1 Aralık 2024
**Versiyon:** 1.0
**Yazar:** Backend Team
