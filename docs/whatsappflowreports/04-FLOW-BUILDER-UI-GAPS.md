# Flow Builder UI Eksiklikleri Raporu

**Tarih:** 2025-11-28
**Oncelik:** KRITIK

---

## 1. Executive Summary

WhatsApp Builder projesinde backend API endpoint'lerinin cogu mevcut, ancak frontend UI'da bunlari kullanacak arayuzler eksik. Kritik islemler icin dogrudan veritabanina SQL sorgusu yazmak gerekiyor.

**Mevcut Durum:**
- Backend API: %80 tamamlandi
- Frontend UI: %50 tamamlandi
- **Ozellik Gap: %30**

---

## 2. KRITIK Eksiklikler (Manuel SQL Gerektiren)

### 2.1 WhatsApp Flow Node - Flow ID Secimi

**Sorun:**
- Chatbot builder'da WhatsApp Flow node'u eklendiginde, hangi Flow'un kullanilacagini secmek icin dropdown YOK
- flowId atamak icin direkt database SQL gerekiyor

**Session'da Yapilan:**
```sql
UPDATE chatbots
SET nodes = jsonb_set(nodes, '{4,data,whatsappFlowId}', '"1389912172544248"')
WHERE id = 'd8b41e27-3f8e-43ec-943f-f38c004f2f14';
```

**Gereken:**
```typescript
// ConfigWhatsAppFlow.tsx
<select value={selectedFlowId} onChange={handleFlowChange}>
  <option value="">-- Flow Seciniz --</option>
  {publishedFlows.map(flow => (
    <option key={flow.id} value={flow.whatsappFlowId}>
      {flow.name} ({flow.whatsappFlowId})
    </option>
  ))}
</select>
```

**Backend Destegi:** Var (`GET /api/flows/active`)
**Oncelik:** KRITIK

---

### 2.2 Data Source Konfigurasyonu

**Sorun:**
- Strapi API URL ve Token hardcoded (flow-endpoint.service.ts)
- Her API degisikligi kod degisikligi gerektiriyor

**Mevcut Kod (YANLIS):**
```typescript
private readonly strapiBaseUrl = 'https://gardenhausapi.sipsy.ai';
private readonly strapiToken = 'b1653f8a...';
```

**Gereken UI:**
- Settings > Data Sources sayfasi
- Data source ekleme/duzenleme modali
- Test connection butonu
- REST API node'da data source secimi

**Backend Destegi:** YOK - Yeni module gerekli
**Oncelik:** KRITIK

---

### 2.3 Flow Clone Ozelligi

**Sorun:**
- Mevcut Flow'u kopyalamak icin UI yok
- Benzer Flow'lar icin sifirdan baslamak gerekiyor

**Gereken:**
```typescript
// FlowsPage.tsx
<button onClick={() => handleClone(flow.id)}>
  Clone Flow
</button>

// Backend
POST /api/flows/:id/clone
Response: { id: "new-uuid", name: "Original-copy" }
```

**Backend Destegi:** YOK
**Oncelik:** YUKSEK

---

## 3. Flow Yonetimi Eksiklikleri

### 3.1 Flow JSON Duzenleme

| Islem | Backend | Frontend |
|-------|---------|----------|
| Flow JSON gorme | VAR | VAR (read-only pre tag) |
| Flow JSON duzenleme | VAR (PUT) | YOK |
| JSON syntax highlighting | - | YOK |
| JSON validation | - | YOK |

**Gereken:**
- Monaco Editor entegrasyonu
- Real-time validation
- Save/Cancel butonlari

### 3.2 Flow JSON Download

**Mevcut:** YOK
**Gereken:**
```typescript
const handleDownload = () => {
  const blob = new Blob([JSON.stringify(flow.flowJson, null, 2)]);
  const url = URL.createObjectURL(blob);
  // Download link...
};
```

### 3.3 Flow Deprecate UI

**Mevcut:** Sadece Delete butonu var
**Gereken:** Explicit Deprecate butonu

```typescript
{flow.status === 'PUBLISHED' && (
  <button onClick={() => handleDeprecate(flow.id)}>
    Deprecate
  </button>
)}
```

---

## 4. Chatbot Node Yonetimi Eksiklikleri

### 4.1 Node Partial Update

**Mevcut:**
- Tum chatbot'u guncelleme (`PUT /api/chatbots/:id`)
- Sadece bir node'un flowId'sini degistirmek icin tum nodes array'i gondermek gerekiyor

**Gereken:**
```typescript
// Backend
PATCH /api/chatbots/:id/nodes/:nodeId
Body: { whatsappFlowId: "new-id" }

// Frontend - Optimistic update
await chatbotsApi.updateNode(chatbotId, nodeId, { whatsappFlowId });
```

### 4.2 REST API Node - Data Source Picker

**Mevcut:**
- URL manuel girilir
- Auth header manuel girilir

**Gereken:**
```typescript
<select>
  <option value="">-- Custom URL --</option>
  {dataSources.map(ds => (
    <option key={ds.id} value={ds.id}>
      {ds.name} ({ds.baseUrl})
    </option>
  ))}
</select>
```

---

## 5. Debugging Araclari Eksiklikleri

### 5.1 Session Debug Panel

**Backend VAR:**
- `GET /api/chatbots/debug/contexts`
- `POST /api/chatbots/debug/contexts/:id/force-complete`

**Frontend YOK:**
- Variable inspector (inline edit)
- Force complete butonu
- Skip node butonu
- Stop session butonu

### 5.2 Execution Logs

**Backend YOK**
**Frontend YOK**

**Gereken:**
```typescript
interface ExecutionLog {
  sessionId: string;
  nodeId: string;
  eventType: 'node_enter' | 'api_call' | 'error';
  timestamp: Date;
  details: any;
}
```

### 5.3 Error Dashboard

**Mevcut:** Hatalar sadece console.log
**Gereken:**
- Hata listesi sayfasi
- Hata detaylari modal
- Hata istatistikleri (chart)

---

## 6. Canvas Iyilestirmeleri

| Ozellik | Durumu |
|---------|--------|
| Drag & Drop | VAR |
| Node connections | VAR |
| Auto-layout | VAR |
| Zoom/Pan | VAR |
| Minimap | YOK |
| Multi-select | YOK |
| Copy/Paste nodes | YOK |
| Undo/Redo | YOK |
| Node templates | YOK |

---

## 7. Karsilastirma: Industry Standard Flow Builders

### n8n, Zapier, Make.com ile Karsilastirma

| Ozellik | Bizde | Industri Standardi |
|---------|-------|--------------------|
| Flow selector dropdown | YOK | VAR |
| Data source config | YOK (hardcode) | VAR |
| Clone flow | YOK | VAR |
| JSON editor | YOK | VAR |
| Version history | YOK | VAR |
| Execution logs | YOK | VAR |
| Undo/Redo | YOK | VAR |
| Templates | YOK | VAR |

---

## 8. Hizli Kazanimlar (Quick Wins)

### 8.1 Flow Download JSON (30 dk)
```typescript
<button onClick={handleDownload}>Download JSON</button>
```

### 8.2 Copy Flow ID (15 dk)
```typescript
<button onClick={() => navigator.clipboard.writeText(flow.whatsappFlowId)}>
  Copy ID
</button>
```

### 8.3 Session Status Badge Colors (10 dk)
```typescript
const colors = {
  running: 'bg-green-600',
  waiting_input: 'bg-blue-600',
  completed: 'bg-gray-600',
  expired: 'bg-red-600',
};
```

---

## 9. Etkilenen Dosyalar

### Frontend

```
frontend/src/features/
├── flows/
│   └── components/
│       ├── FlowsPage.tsx (GUNCELLE - clone, deprecate butonlari)
│       ├── FlowDetailsModal.tsx (GUNCELLE - download, edit JSON)
│       └── FlowJsonEditor.tsx (YENI)
├── builder/
│   └── components/
│       ├── ConfigModals.tsx (GUNCELLE - Flow selector dropdown)
│       └── ConfigRestApi.tsx (GUNCELLE - data source picker)
├── sessions/
│   └── components/
│       └── SessionDebugPanel.tsx (YENI)
└── settings/
    └── components/
        └── DataSourcesPage.tsx (YENI)
```

### Backend

```
backend/src/modules/
├── flows/
│   ├── flows.controller.ts (GUNCELLE - clone, deprecate endpoints)
│   └── flows.service.ts (GUNCELLE)
├── chatbots/
│   ├── chatbots.controller.ts (GUNCELLE - node patch endpoint)
│   └── chatbots.service.ts (GUNCELLE)
└── data-sources/ (YENI MODULE)
    ├── data-sources.controller.ts
    ├── data-sources.service.ts
    └── entities/
        └── data-source.entity.ts
```

---

## 10. Sonuc

**Ana Sorunlar:**
1. WhatsApp Flow node'da Flow secimi yok -> Manuel SQL
2. Data source config UI yok -> Hardcode
3. Flow JSON editing yok
4. Debug tools UI'da yok

**Hedef:**
- Kullanici hicbir SQL yazmadan tum islemleri yapabilmeli
- External API config UI'dan yapilabilmeli
- Flow'lar clone/edit/download edilebilmeli

**Detayli UI Analizi:** `/docs/UI_FEATURE_GAPS_ANALYSIS.md`

