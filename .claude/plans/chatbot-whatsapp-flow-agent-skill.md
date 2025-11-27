# Chatbot & WhatsApp Flow Builder - Agent & Skill Development Plan

## Executive Summary

Chatbot ve WhatsApp Flow oluşturmak için yeni agent ve skill geliştirme planı.

**Hedef:** Kullanıcıların doğal dilde chatbot ve WhatsApp Flow oluşturabilmesini sağlayan akıllı asistanlar.

---

## PHASE 1: Codebase Keşfi Sonuçları

### 1.1 Mevcut Agent/Skill Yapısı

| Özellik | Agent | Skill |
|---------|-------|-------|
| Format | Tek `.md` dosyası | Klasör (SKILL.md + reference/) |
| Uzunluk | 300-700 satır | 200-500 satır + N reference |
| Ton | Conversational ("I am...") | Reference-heavy |
| Kullanım | Doğrudan etkileşim | Knowledge base |

### 1.2 Chatbot Node Tipleri

| Node | Açıklama | Properties |
|------|----------|------------|
| `start` | Flow başlangıcı | label |
| `message` | Mesaj gönderme | content, messageType |
| `question` | Kullanıcı girişi | questionType (text/buttons/list), variable, buttons[], listSections[] |
| `condition` | Koşullu dallanma | conditionVar, conditionOp, conditionVal |
| `whatsapp_flow` | WA Flow entegrasyonu | whatsappFlowId, flowMode, flowCta |
| `rest_api` | API çağrısı | apiUrl, apiMethod, apiHeaders, apiBody, apiOutputVariable |

### 1.3 WhatsApp Flow Yapısı (v7.2)

- **Screens**: MAIN_MENU, DATETIME_SCREEN, SUCCESS, etc.
- **Components**: TextInput, Dropdown, RadioButtonsGroup, DatePicker, Footer
- **Actions**: navigate, data_exchange, complete
- **Data binding**: `${form.field}`, `${screen.SCREEN_ID.form.field}`, `${data.field}`

### 1.4 REST API Entegrasyonu

- Variable binding: `{{variable}}` syntax
- Response mapping: JSON path extraction
- Error handling: success/error branches
- Test endpoint: `/api/chatbots/test-rest-api`

---

## PHASE 2: Yaklaşım Analizi

### Seçenek A: Sadece Agent (Hızlı)

```
.claude/agents/chatbot-builder-expert.md (600 satır)
```

**Avantajlar:**
- Hızlı kurulum
- Tek dosyada tüm bilgi
- Kolay bakım

**Dezavantajlar:**
- Uzun dosya
- WhatsApp Flow ve Chatbot ayrımı yok

### Seçenek B: Sadece Skill (Organize)

```
.claude/skills/chatbot-flow-development/
├── SKILL.md
├── README.md
└── reference/
    ├── 01-chatbot-nodes.md
    ├── 02-whatsapp-flows.md
    └── ...
```

**Avantajlar:**
- Organize
- Modüler
- Ölçeklenebilir

**Dezavantajlar:**
- İlk kurulum uzun
- Conversational değil

### Seçenek C: Hybrid (Önerilen)

**2 Agent + 1 Skill:**

1. `chatbot-builder-expert.md` - Chatbot oluşturma agent'ı
2. `whatsapp-flow-builder-expert.md` - WhatsApp Flow oluşturma agent'ı
3. `chatbot-flow-development/` - Detaylı reference skill

**Avantajlar:**
- Spesifik agent'lar (daha iyi sonuç)
- Reference için skill
- Modüler ve ölçeklenebilir

---

## PHASE 3: Implementation Plan

### TODO 1: Chatbot Builder Agent

**Dosya:** `.claude/agents/chatbot-builder-expert.md`

**İçerik (~500 satır):**
- Node tipleri ve özellikleri
- Edge yapısı ve routing
- Variable binding
- Button/List question'lar
- Condition node kullanımı
- REST API node
- Örnek chatbot JSON'ları
- Best practices

**Kod Örnekleri:**
- Basit welcome flow
- Menu-based chatbot
- API entegrasyonlu chatbot
- Condition branching

### TODO 2: WhatsApp Flow Builder Agent

**Dosya:** `.claude/agents/whatsapp-flow-builder-expert.md`

**İçerik (~500 satır):**
- Flow JSON v7.2 yapısı
- Screen ve component tipleri
- Routing model
- Dynamic data binding
- Endpoint entegrasyonu
- Encryption (RSA/AES)
- Örnek flow JSON'ları
- Best practices

**Kod Örnekleri:**
- Simple form flow
- Appointment booking flow
- Dynamic dropdown flow
- Multi-screen flow

### TODO 3: Chatbot Flow Development Skill

**Klasör:** `.claude/skills/chatbot-flow-development/`

**Dosyalar:**
```
chatbot-flow-development/
├── SKILL.md (300 satır)
├── README.md (100 satır)
└── reference/
    ├── 01-chatbot-node-types.md
    ├── 02-chatbot-edge-routing.md
    ├── 03-chatbot-variables.md
    ├── 04-whatsapp-flow-screens.md
    ├── 05-whatsapp-flow-components.md
    ├── 06-whatsapp-flow-actions.md
    ├── 07-rest-api-integration.md
    ├── 08-best-practices.md
    └── 09-examples.md
```

---

## PHASE 4: Agent Yapısı Detayları

### chatbot-builder-expert.md Outline

```markdown
---
name: chatbot-builder-expert
description: Expert in building chatbot conversation flows with ReactFlow nodes,
  buttons, lists, conditions, and REST API integration. Use when creating chatbots,
  designing conversation flows, or debugging chatbot execution.
---

# Chatbot Builder Expert

I am your expert for building conversation flows in WhatsApp Builder.

## What I can help with

### 1. Flow Design
- Conversation flow architecture
- Node selection and placement
- Edge connections and routing
- User journey mapping

### 2. Node Types
[Detailed node documentation]

### 3. Variable Management
[Variable binding, {{}} syntax]

### 4. REST API Integration
[API node configuration]

## Project Architecture

I understand these files:
- backend/src/entities/chatbot.entity.ts
- backend/src/modules/chatbots/dto/
- backend/src/modules/chatbots/services/chatbot-execution.service.ts
- frontend/src/features/builder/
- frontend/src/features/nodes/

## Example Workflows

### Creating a Simple Chatbot
[Step-by-step guide]

### Creating a Menu-Based Chatbot
[Button routing example]

### API Integration Chatbot
[REST API node example]

## JSON Templates

### Basic Welcome Flow
[JSON template]

### Customer Support Bot
[JSON template]

## Best Practices
[Validation rules, limits, conventions]
```

### whatsapp-flow-builder-expert.md Outline

```markdown
---
name: whatsapp-flow-builder-expert
description: Expert in building WhatsApp Flows with screens, components,
  routing, and endpoint integration. Use when creating WhatsApp Flows,
  designing form flows, or implementing dynamic data exchange.
---

# WhatsApp Flow Builder Expert

I am your expert for building WhatsApp Flows in WhatsApp Builder.

## What I can help with

### 1. Flow JSON Structure
- v7.2 specification
- Screens and routing_model
- Components and layouts

### 2. Screen Types
[Screen documentation]

### 3. Component Types
[TextInput, Dropdown, RadioButtons, etc.]

### 4. Actions
[navigate, data_exchange, complete]

### 5. Dynamic Data
[${form.field}, ${data.field} binding]

### 6. Endpoint Integration
[Webhook implementation, encryption]

## Project Architecture

I understand these files:
- backend/src/modules/flows/
- backend/src/modules/webhooks/flow-endpoint.controller.ts
- backend/src/modules/whatsapp/services/flow-encryption.service.ts
- docs/whatsapp-flow-dynamic-calendar/

## Example Workflows

### Simple Form Flow
[Step-by-step guide]

### Appointment Booking Flow
[Dynamic data example]

## JSON Templates

### Contact Form Flow
[JSON template]

### Dynamic Selection Flow
[JSON template with endpoint]

## Best Practices
[Screen naming, validation, performance]
```

---

## PHASE 5: Dosya Oluşturma Sırası

1. **chatbot-builder-expert.md** - Ana chatbot agent
2. **whatsapp-flow-builder-expert.md** - WhatsApp Flow agent
3. **chatbot-flow-development/SKILL.md** - Skill ana dosyası
4. **chatbot-flow-development/README.md** - Skill overview
5. **chatbot-flow-development/reference/*.md** - Reference dosyaları

---

## PHASE 6: Kullanıcı Tercihleri (ONAYLANDI)

| Tercih | Seçim |
|--------|-------|
| **Agent Yapısı** | 2 Ayrı Agent |
| **Skill** | Evet, Reference Skill de lazım |
| **Dil** | İngilizce |
| **Örnekler** | Orta (Temel + API Integration + Condition) |

---

## Tahmini Çıktılar

| Dosya | Satır | Açıklama |
|-------|-------|----------|
| chatbot-builder-expert.md | ~500 | Chatbot agent |
| whatsapp-flow-builder-expert.md | ~500 | WA Flow agent |
| SKILL.md | ~300 | Skill ana dosyası |
| README.md | ~100 | Skill overview |
| reference/*.md | ~1500 | 9 reference dosyası |
| **TOPLAM** | **~2900** | |

---

## Final Implementation Plan

### Oluşturulacak Dosyalar:

```
.claude/
├── agents/
│   ├── chatbot-builder-expert.md      (~500 lines)
│   └── whatsapp-flow-builder-expert.md (~500 lines)
│
└── skills/
    └── chatbot-flow-development/
        ├── SKILL.md                    (~300 lines)
        ├── README.md                   (~100 lines)
        └── reference/
            ├── 01-chatbot-node-types.md
            ├── 02-chatbot-edge-routing.md
            ├── 03-chatbot-variables.md
            ├── 04-whatsapp-flow-screens.md
            ├── 05-whatsapp-flow-components.md
            ├── 06-whatsapp-flow-actions.md
            ├── 07-rest-api-integration.md
            └── 08-examples.md
```

### Dahil Edilecek Örnekler (Orta Seviye):

**Chatbot Örnekleri:**
1. Welcome Flow (Basit)
2. Menu-Based Bot (Buttons)
3. Customer Info Collection (Text + Condition)
4. API Integration Bot (REST API node)

**WhatsApp Flow Örnekleri:**
1. Simple Contact Form
2. Appointment Booking (Dynamic Data)
3. Survey Flow (RadioButtons + Dropdown)

### Execution Order:

1. `chatbot-builder-expert.md` oluştur
2. `whatsapp-flow-builder-expert.md` oluştur
3. `chatbot-flow-development/SKILL.md` oluştur
4. `chatbot-flow-development/README.md` oluştur
5. Reference dosyalarını oluştur (8 dosya)
6. Test et ve dokümante et
