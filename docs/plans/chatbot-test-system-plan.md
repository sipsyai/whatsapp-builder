# Chatbot Test System - Implementation Plan

## Kullanıcı Tercihleri
- **UI:** Builder içinde sağda drawer panel (n8n tarzı)
- **Real-time:** Evet (WebSocket)
- **Mock Data:** Hayır - gerçek API'ler kullanılacak
- **Database:** Mevcut `conversation_contexts` tablosuna `isTestSession` flag

## Mevcut Altyapı (Agent Analizi)

### Backend
- `ChatBotExecutionService` - 2590 satır, 7 node tipi desteği
- `SessionHistoryService` - Session CRUD
- `SessionGateway` - `/sessions` namespace WebSocket
- `ConversationContext` entity - State, variables, nodeOutputs

### Frontend
- `FlowTester.tsx` - Mevcut frontend-only test (değiştirilecek)
- `ConversationLog`, `VariablesPanel`, `SessionTimeline` - Reuse edilecek
- `@dnd-kit` - Zaten kurulu
- `useSessionSocket` - WebSocket altyapısı mevcut

---

## Implementation Plan

### PHASE 1: Backend - Database & Entity

#### TODO 1: Migration - isTestSession Flag
**Agent:** `typeorm-expert`
**Dosyalar:**
- `backend/src/migrations/XXXXXX-AddTestSessionFields.ts`
- `backend/src/entities/conversation-context.entity.ts`

**Görevler:**
1. `isTestSession: boolean DEFAULT false` column ekle
2. `testMetadata: jsonb` column ekle (nullable)
3. Partial index oluştur: `WHERE isTestSession = true`
4. Composite index: `chatbotId, status, createdAt WHERE isTestSession = false`
5. Entity'yi güncelle

---

### PHASE 2: Backend - Services

#### TODO 2: IMessageSender Interface & MockWhatsAppService
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/chatbot-testing/interfaces/message-sender.interface.ts`
- `backend/src/modules/chatbot-testing/services/mock-whatsapp.service.ts`

**Görevler:**
1. `IMessageSender` interface tanımla (sendTextMessage, sendInteractiveMessage, sendFlowMessage)
2. `MockWhatsAppService` oluştur - DB'ye yazar, WhatsApp'a göndermez
3. WebSocket event emit et (test:message)

#### TODO 3: TestSessionService
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/chatbot-testing/services/test-session.service.ts`
- `backend/src/modules/chatbot-testing/dto/test-session.dto.ts`

**Görevler:**
1. `startTestSession()` - Test session başlat
2. `simulateUserResponse()` - Kullanıcı yanıtı simüle et
3. `pauseTest()`, `resumeTest()`, `stopTest()` - Kontrol metodları
4. `getTestState()` - Mevcut durumu getir
5. Transaction yönetimi (QueryRunner)

#### TODO 4: TestExecutionAdapterService
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/chatbot-testing/services/test-execution-adapter.service.ts`

**Görevler:**
1. `ChatBotExecutionService`'i wrap et (composition)
2. Message gönderimi için MockWhatsAppService kullan
3. Loop detection ekle (maxNodeVisits: 10, maxTotalSteps: 100)
4. Checkpoint kaydetme mantığı

---

### PHASE 3: Backend - Controller & WebSocket

#### TODO 5: ChatbotTestingController
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/chatbot-testing/chatbot-testing.controller.ts`

**Görevler:**
1. `POST /test-sessions` - Test başlat
2. `POST /test-sessions/:id/message` - Mesaj gönder
3. `POST /test-sessions/:id/pause` - Duraklat
4. `POST /test-sessions/:id/resume` - Devam et
5. `POST /test-sessions/:id/stop` - Durdur
6. `GET /test-sessions/:id/state` - Durum getir

#### TODO 6: TestSessionGateway
**Agent:** `socket-io-expert`
**Dosyalar:**
- `backend/src/modules/chatbot-testing/gateways/test-session.gateway.ts`
- `backend/src/modules/websocket/dto/test-session.dto.ts`

**Görevler:**
1. `/test-sessions` namespace oluştur
2. Client->Server events: `test:start`, `test:send-message`, `test:pause`, `test:resume`, `test:stop`
3. Server->Client events: `test:started`, `test:message`, `test:node-executed`, `test:waiting-input`, `test:variables-updated`, `test:completed`
4. Room yapısı: `test:session:{id}`
5. State recovery (reconnection)

#### TODO 7: ChatbotTestingModule
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/chatbot-testing/chatbot-testing.module.ts`
- `backend/src/app.module.ts`

**Görevler:**
1. Module oluştur ve tüm provider'ları register et
2. Factory provider ile MESSAGE_SENDER_TOKEN
3. AppModule'e import ekle

---

### PHASE 4: Frontend - Context & Hooks

#### TODO 8: TesterContext & Reducer
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/chatbot-tester/context/TesterContext.tsx`
- `frontend/src/features/chatbot-tester/context/TesterProvider.tsx`
- `frontend/src/features/chatbot-tester/types/tester.types.ts`

**Görevler:**
1. `TesterState` interface tanımla
2. `TesterAction` union type
3. `testerReducer` function
4. `TesterProvider` component
5. `useTester` hook

#### TODO 9: useTesterSocket Hook
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/chatbot-tester/hooks/useTesterSocket.ts`
- `frontend/src/features/chatbot-tester/hooks/useTesterSocketEvents.ts`

**Görevler:**
1. Socket.IO connection yönetimi
2. Event handlers (message, node-executed, variables-updated, etc.)
3. Reconnection ve state recovery
4. Message queue (offline)

---

### PHASE 5: Frontend - Components

#### TODO 10: TesterPanel (Ana Container)
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/chatbot-tester/components/TesterPanel/TesterPanel.tsx`
- `frontend/src/features/chatbot-tester/components/TesterPanel/TesterPanelHeader.tsx`

**Görevler:**
1. Resizable drawer panel (sağda)
2. Header: Başlık, kontrol butonları, close
3. Split view: Chat (sol) + Variables/Timeline (sağ)
4. Collapsible log panel (alt)

#### TODO 11: ChatWindow & MessageBubble
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/chatbot-tester/components/ChatWindow/ChatWindow.tsx`
- `frontend/src/features/chatbot-tester/components/ChatWindow/MessageBubble.tsx`
- `frontend/src/features/chatbot-tester/components/ChatWindow/TypingIndicator.tsx`

**Görevler:**
1. WhatsApp benzeri chat UI
2. Bot vs User mesaj stilleri
3. Interactive message render (buttons, list)
4. Typing indicator
5. Auto-scroll

#### TODO 12: ChatInput & Response Handlers
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/chatbot-tester/components/ChatInput/ChatInput.tsx`
- `frontend/src/features/chatbot-tester/components/ChatInput/ButtonResponseInput.tsx`
- `frontend/src/features/chatbot-tester/components/ChatInput/ListResponseInput.tsx`

**Görevler:**
1. Text input field
2. Button seçimi UI
3. List item seçimi UI
4. WhatsApp Flow form simülasyonu (gerçek data ile)

#### TODO 13: VariablePickerPanel (Drag & Drop)
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/chatbot-tester/components/VariablePicker/VariablePickerPanel.tsx`
- `frontend/src/features/chatbot-tester/components/VariablePicker/DraggableVariable.tsx`

**Görevler:**
1. n8n tarzı variable tree view
2. Search/filter
3. @dnd-kit ile drag & drop
4. Nested object expand/collapse
5. Copy to clipboard

#### TODO 14: JsonTreeViewer & LogViewer
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/chatbot-tester/components/JsonTreeViewer/JsonTreeViewer.tsx`
- `frontend/src/features/chatbot-tester/components/LogViewer/LogViewer.tsx`
- `frontend/src/features/chatbot-tester/components/LogViewer/LogEntry.tsx`

**Görevler:**
1. Custom JSON tree viewer (expand/collapse, copy)
2. Execution log listesi
3. Log entry styling (success, error, warning, info)
4. Timestamp ve node bilgisi

#### TODO 15: UserSelector
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/chatbot-tester/components/UserSelector/UserSelector.tsx`

**Görevler:**
1. Mevcut kullanıcıları listele (dropdown)
2. Search/filter
3. Kullanıcı bilgisi göster (telefon, isim)
4. Seçim callback

---

### PHASE 6: ReactFlow Entegrasyonu

#### TODO 16: useTestExecution Hook
**Agent:** `reactflow-expert`
**Dosyalar:**
- `frontend/src/features/builder/hooks/useTestExecution.ts`

**Görevler:**
1. `ExecutionState` interface
2. Node enhancement (testState data)
3. Edge enhancement (animated, executed)
4. `setCurrentNode()`, `completeNode()` metodları

#### TODO 17: Test Mode Styling
**Agent:** `reactflow-expert`
**Dosyalar:**
- `frontend/src/features/builder/styles/test-mode.css`
- Custom node güncellemeleri (MessageNode, QuestionNode, etc.)

**Görevler:**
1. `.node-current`, `.node-executed`, `.node-pending` CSS
2. Pulse animation
3. Execution badge (Running, Completed checkmark)
4. Opacity/grayscale for pending

#### TODO 18: AnimatedTestEdge
**Agent:** `reactflow-expert`
**Dosyalar:**
- `frontend/src/features/builder/components/AnimatedTestEdge.tsx`

**Görevler:**
1. SVG animateMotion ile flow particle
2. Executed edge styling (green, solid)
3. Pending edge styling (gray, dashed)
4. Execution order badge

#### TODO 19: TestProgressMiniMap
**Agent:** `reactflow-expert`
**Dosyalar:**
- `frontend/src/features/builder/components/TestProgressMiniMap.tsx`

**Görevler:**
1. Dynamic nodeColor based on execution state
2. Progress bar overlay
3. Current node indicator (pulse)
4. Completed node checkmark

---

### PHASE 7: Integration

#### TODO 20: BuilderPage Integration
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/builder/components/BuilderPage.tsx`

**Görevler:**
1. Test mode state toggle
2. TesterPanel entegrasyonu
3. Test mode ReactFlow props (nodesDraggable: false, etc.)
4. Test mode panel toggle button

---

### PHASE 8: Build & Test

#### TODO 21: Build Test
**Agent:** Manuel
**Görevler:**
1. Backend build: `cd backend && npm run build`
2. Frontend build: `cd frontend && npm run build`
3. TypeScript errors düzelt
4. Lint errors düzelt

---

### PHASE 9: Docker Deployment

#### TODO 22: Docker Deploy
**Agent:** Manuel
**Görevler:**
1. `docker compose -f docker-compose.prod.yml build backend`
2. `docker compose -f docker-compose.prod.yml up -d backend`
3. Migration: `docker compose exec backend npm run migration:run`
4. Health check ve log kontrolü
5. https://whatsapp.sipsy.ai test

---

## Agent Kullanım Özeti

| Agent | TODO'lar |
|-------|----------|
| typeorm-expert | 1 |
| nestjs-expert | 2, 3, 4, 5, 7 |
| socket-io-expert | 6 |
| react-expert | 8, 9, 10, 11, 12, 13, 14, 15, 20 |
| reactflow-expert | 16, 17, 18, 19 |
| Manuel | 21, 22 |

---

## Paralel Çalıştırma Grupları

```
Grup 1: TODO 1 (Migration/Entity)
   ↓
Grup 2: TODO 2, 3, 4 (Services) - Paralel
   ↓
Grup 3: TODO 5, 6, 7 (Controller, WebSocket, Module) - Paralel
   ↓
Grup 4: TODO 8, 9 (Context, Hooks) - Paralel
   ↓
Grup 5: TODO 10, 11, 12, 13, 14, 15 (Components) - Paralel
   ↓
Grup 6: TODO 16, 17, 18, 19 (ReactFlow) - Paralel
   ↓
Grup 7: TODO 20 (Integration)
   ↓
Grup 8: TODO 21, 22 (Build & Deploy)
```

---

## Notlar

1. **Mock Data Yok**: WhatsApp Flow completion için gerçek form data kullanılacak
2. **Gerçek API**: REST_API node'ları gerçek endpoint'lere istek atacak
3. **Loop Detection**: Infinite loop koruması aktif (max 10 ziyaret, max 100 adım)
4. **Checkpoint**: Auto-checkpoint özelliği sonraki fazda eklenebilir
