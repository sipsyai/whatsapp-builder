# n8n Tarzı Variable System - Implementation Plan

## Kullanıcı Tercihleri
- **UI:** Sadece Dropdown (ikon ile açılan picker)
- **Drag & Drop:** Evet
- **Backend:** nodeOutputs alanı eklenecek
- **Entegrasyon:** Tüm config modal'lar

## Mevcut Altyapı
- ConfigCondition'da `availableVariables` useMemo örneği mevcut
- `{{variable}}` syntax backend'de destekleniyor
- ReactFlow context tüm builder'da erişilebilir

---

## Implementation Plan

### PHASE 1: Backend (nodeOutputs)

#### TODO 1: Migration - nodeOutputs kolonu
**Agent:** `postgresql-expert`
**Dosyalar:**
- `backend/src/migrations/XXXX-add-node-outputs.ts`

**Görevler:**
1. conversation_contexts tablosuna nodeOutputs JSONB kolonu ekle
2. Default değer: '{}'
3. GIN index ekle (performans için)

#### TODO 2: Entity Güncellemesi
**Agent:** `typeorm-expert`
**Dosyalar:**
- `backend/src/entities/conversation-context.entity.ts`

**Görevler:**
1. nodeOutputs alanını ekle (JSONB, default '{}')
2. NodeOutput interface tanımla
3. Type safety sağla

#### TODO 3: Execution Service Güncellemesi
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/chatbots/services/chatbot-execution.service.ts`

**Görevler:**
1. storeNodeOutput helper metodu ekle
2. Her node tipi için output kaydetme logic'i ekle:
   - Question: userResponse, buttonId, listRowId
   - REST API: statusCode, data, error, duration
   - Google Calendar: action, events/slots
   - WhatsApp Flow: flowResponse
3. Mevcut variable kaydetme logic'ini koru (backward compat)

---

### PHASE 2: Frontend Types

#### TODO 4: Variable Types
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/builder/components/VariablePicker/types.ts` (YENİ)

**Görevler:**
1. VariableInfo interface
2. NodeVariableGroup interface
3. VariablePickerProps interface

---

### PHASE 3: Frontend Hooks

#### TODO 5: useAvailableVariables Hook
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/builder/hooks/useAvailableVariables.ts` (YENİ)

**Görevler:**
1. useReactFlow ile node'ları al
2. Her node tipinden output variable'ları çıkar:
   - question: variable
   - rest_api: apiOutputVariable, apiErrorVariable
   - google_calendar: calendarOutputVariable
   - whatsapp_flow: flowOutputVariable
3. System variables ekle (customer_phone)
4. Node renk ve ikon mapping

---

### PHASE 4: VariablePicker Component

#### TODO 6: VariablePicker Ana Component
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/builder/components/VariablePicker/index.tsx` (YENİ)
- `frontend/src/features/builder/components/VariablePicker/VariablePicker.tsx` (YENİ)

**Görevler:**
1. Dropdown popup component
2. Search input
3. Tree-view node listesi
4. Click outside to close
5. ESC to close

#### TODO 7: VariableTree Component
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/builder/components/VariablePicker/VariableTree.tsx` (YENİ)
- `frontend/src/features/builder/components/VariablePicker/VariableTreeItem.tsx` (YENİ)

**Görevler:**
1. Expandable node grupları
2. Variable item'ları (draggable)
3. Data type ikonları
4. Node renk kodları

#### TODO 8: VariableInput Wrapper Component
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/builder/components/VariablePicker/VariableInput.tsx` (YENİ)

**Görevler:**
1. Input + picker button wrapper
2. Drag & drop support
3. {{variable}} badge gösterimi
4. currentNodeId prop ile self-exclude

---

### PHASE 5: Config Modal Entegrasyonları

#### TODO 9: ConfigMessage Entegrasyonu
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/builder/components/ConfigModals.tsx`

**Görevler:**
1. Content textarea'ya VariableInput entegre et

#### TODO 10: ConfigQuestion Entegrasyonu
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/builder/components/ConfigModals.tsx`

**Görevler:**
1. Content input'a VariableInput entegre et
2. Dynamic list source için picker button

#### TODO 11: ConfigRestApi Entegrasyonu
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/builder/components/ConfigRestApi.tsx`

**Görevler:**
1. URL input'a VariableInput
2. Query param values'a VariableInput
3. Header values'a VariableInput
4. Body textarea'ya VariableInput
5. Auth token input'a VariableInput

#### TODO 12: ConfigGoogleCalendar Entegrasyonu
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/builder/components/ConfigGoogleCalendar.tsx`

**Görevler:**
1. Date variable input'larına VariableInput
2. User variable input'a VariableInput

#### TODO 13: ConfigWhatsAppFlow Entegrasyonu
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/builder/components/ConfigModals.tsx`

**Görevler:**
1. Initial data JSON textarea'ya VariableInput

#### TODO 14: ConfigCondition Güncellemesi
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/builder/components/ConfigModals.tsx`

**Görevler:**
1. Mevcut dropdown'ı useAvailableVariables hook'u ile değiştir
2. Tüm node tiplerini destekle (sadece question değil)
3. Value input'a VariableInput

---

### PHASE 6: Build & Test

#### TODO 15: Build Test
**Agent:** `manuel`
**Görevler:**
1. Backend build: `cd backend && npm run build`
2. Frontend build: `cd frontend && npm run build`
3. Hataları düzelt

#### TODO 16: Manuel Test
**Agent:** `manuel`
**Görevler:**
1. Yeni chatbot oluştur
2. Question node ekle, variable tanımla
3. REST API node ekle, output variable tanımla
4. Message node'da variable picker'ı test et
5. Condition node'da yeni dropdown'ı test et
6. Drag & drop test et

---

### PHASE 7: Docker Deployment

#### TODO 17: Docker Build
**Agent:** `manuel`
**Komutlar:**
```bash
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml up -d backend
```

#### TODO 18: Migration Çalıştır
**Agent:** `manuel`
**Komutlar:**
```bash
docker compose -f docker-compose.prod.yml exec backend npm run migration:run
```

---

### PHASE 8: Documentation

#### TODO 19: Reference Dosyası
**Agent:** `project-architect`
**Dosyalar:**
- `.claude/skills/project-architect/reference/08-variable-system.md` (YENİ)

**Görevler:**
1. Yeni variable system dokümantasyonu
2. VariablePicker kullanım rehberi
3. useAvailableVariables hook API

---

## Agent Kullanım Özeti

| Agent | TODO'lar |
|-------|----------|
| postgresql-expert | 1 |
| typeorm-expert | 2 |
| nestjs-expert | 3 |
| react-expert | 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 |
| project-architect | 19 |

## Paralel Çalıştırma Planı

```
TODO 1, 2, 3 (Backend) → Sıralı (migration önce)
TODO 4, 5 (Types, Hook) → Paralel
TODO 6, 7, 8 (VariablePicker) → Sıralı (bağımlılık var)
TODO 9-14 (Config Entegrasyonları) → Paralel
TODO 15, 16 (Test) → Sıralı
TODO 17, 18 (Deploy) → Sıralı
TODO 19 (Docs) → Son
```

## Tahmini Süre
- Backend: 2-3 saat
- Frontend Hooks/Types: 1-2 saat
- VariablePicker Component: 3-4 saat
- Config Entegrasyonları: 2-3 saat
- Test & Deploy: 1-2 saat
- **Toplam: 9-14 saat**
