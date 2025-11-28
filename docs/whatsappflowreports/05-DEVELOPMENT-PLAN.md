# Gelistirme Plani

**Tarih:** 2025-11-28
**Durum:** Onay Bekliyor

---

## 1. Oncelik Siralaması

### KRITIK (Hemen Yapilmali)

| # | Gorev | Tur | Tahmini Sure | Durum |
|---|-------|-----|--------------|-------|
| 1 | Hardcoded Strapi credentials kaldir | Backend | 2 saat | ✅ TAMAMLANDI |
| 2 | WhatsApp Flow node - Flow selector dropdown | Frontend | 3 saat | ✅ TAMAMLANDI |
| 3 | FlowDataSource entity olustur | Backend | 4 saat | ✅ TAMAMLANDI |
| 4 | Data Sources API endpoints | Backend | 4 saat | ✅ TAMAMLANDI |
| 5 | Data Sources UI sayfasi | Frontend | 6 saat | ✅ TAMAMLANDI |

### YUKSEK (1 Hafta Icinde)

| # | Gorev | Tur | Tahmini Sure |
|---|-------|-----|--------------|
| 6 | Flow clone endpoint | Backend | 2 saat |
| 7 | Flow clone UI butonu | Frontend | 1 saat |
| 8 | Node partial update endpoint | Backend | 2 saat |
| 9 | Flow deprecate explicit endpoint | Backend | 1 saat |
| 10 | Flow deprecate UI butonu | Frontend | 1 saat |

### ORTA (2 Hafta Icinde)

| # | Gorev | Tur | Tahmini Sure |
|---|-------|-----|--------------|
| 11 | Flow JSON editor (Monaco) | Frontend | 4 saat |
| 12 | Flow JSON download | Frontend | 30 dk |
| 13 | Session debug panel | Frontend | 4 saat |
| 14 | flow_token parsing iyilestirmesi | Backend | 1 saat |
| 15 | Screen transition validation | Backend | 2 saat |

### DUSUK (1 Ay Icinde)

| # | Gorev | Tur | Tahmini Sure |
|---|-------|-----|--------------|
| 16 | FlowSession entity (debugging) | Backend | 3 saat |
| 17 | Execution logging system | Backend | 4 saat |
| 18 | Flow versioning | Backend + Frontend | 8 saat |
| 19 | Error handling iyilestirmesi | Backend | 2 saat |
| 20 | Logging standardizasyonu | Backend | 2 saat |

---

## 2. Phase 1: Kritik Duzeltmeler (2-3 Gun)

### 2.1 Hardcoded Degerleri Kaldir

**Dosya:** `backend/src/modules/webhooks/services/flow-endpoint.service.ts`

**Mevcut (YANLIS):**
```typescript
private readonly strapiBaseUrl = 'https://gardenhausapi.sipsy.ai';
private readonly strapiToken = 'b1653f8a...';
```

**Olmasi Gereken:**
```typescript
private get strapiBaseUrl(): string {
  return this.configService.get<string>('STRAPI_BASE_URL') || '';
}

private get strapiToken(): string {
  return this.configService.get<string>('STRAPI_TOKEN') || '';
}
```

**Ayni duzeltme yapilacak dosyalar:**
- `backend/src/modules/chatbots/services/chatbot-execution.service.ts`

### 2.2 Flow Selector Dropdown

**Dosya:** `frontend/src/features/builder/components/ConfigModals.tsx`

**Eklenecek:**
```typescript
// ConfigWhatsAppFlow component icine:
const [flows, setFlows] = useState<WhatsAppFlow[]>([]);

useEffect(() => {
  // GET /api/flows (PUBLISHED olanlar)
  flowsApi.getActive().then(setFlows);
}, []);

<select
  value={data.whatsappFlowId || ''}
  onChange={(e) => onChange({ ...data, whatsappFlowId: e.target.value })}
>
  <option value="">-- Flow Seciniz --</option>
  {flows.map(flow => (
    <option key={flow.id} value={flow.whatsappFlowId}>
      {flow.name}
    </option>
  ))}
</select>
```

---

## 3. Phase 2: Data Sources Module (1 Hafta)

### 3.1 Entity Olustur

**Dosya:** `backend/src/entities/data-source.entity.ts`

```typescript
@Entity('data_sources')
export class DataSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar' })
  type: 'strapi' | 'rest' | 'graphql';

  @Column()
  baseUrl: string;

  @Column({ type: 'varchar', nullable: true })
  authType: 'bearer' | 'api-key' | 'basic' | 'none';

  @Column({ type: 'text', nullable: true })
  authToken: string;

  @Column({ type: 'jsonb', nullable: true })
  headers: Record<string, string>;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 3.2 API Endpoints

```typescript
// data-sources.controller.ts

GET    /api/data-sources          // Listele
POST   /api/data-sources          // Olustur
GET    /api/data-sources/:id      // Detay
PUT    /api/data-sources/:id      // Guncelle
DELETE /api/data-sources/:id      // Sil
POST   /api/data-sources/:id/test // Baglanti test
```

### 3.3 Frontend Sayfasi

**Dosya:** `frontend/src/features/settings/components/DataSourcesPage.tsx`

- Data source listesi (tablo)
- Ekle/Duzenle modal
- Test connection butonu
- Aktif/Pasif toggle

---

## 4. Phase 3: Flow Yonetimi (1 Hafta)

### 4.1 Clone Endpoint

```typescript
// flows.controller.ts
@Post(':id/clone')
async clone(@Param('id') id: string): Promise<WhatsAppFlow> {
  return this.flowsService.clone(id);
}

// flows.service.ts
async clone(id: string): Promise<WhatsAppFlow> {
  const original = await this.findOne(id);
  const cloned = this.flowRepo.create({
    ...original,
    id: undefined,
    name: `${original.name} (copy)`,
    whatsappFlowId: undefined,
    status: 'DRAFT',
  });
  return this.flowRepo.save(cloned);
}
```

### 4.2 Deprecate Endpoint

```typescript
// flows.controller.ts
@Post(':id/deprecate')
async deprecate(@Param('id') id: string): Promise<WhatsAppFlow> {
  return this.flowsService.deprecate(id);
}
```

### 4.3 Node Partial Update

```typescript
// chatbots.controller.ts
@Patch(':id/nodes/:nodeId')
async updateNode(
  @Param('id') chatbotId: string,
  @Param('nodeId') nodeId: string,
  @Body() data: Partial<NodeDataDto>,
): Promise<Chatbot> {
  return this.chatbotsService.updateNodeData(chatbotId, nodeId, data);
}
```

---

## 5. Phase 4: UI Iyilestirmeleri (2 Hafta)

### 5.1 Flow JSON Editor

**Dependency:** `npm i @monaco-editor/react`

```typescript
// FlowJsonEditor.tsx
import Editor from '@monaco-editor/react';

<Editor
  height="500px"
  language="json"
  value={JSON.stringify(flowJson, null, 2)}
  onChange={(value) => setFlowJson(JSON.parse(value))}
  options={{
    minimap: { enabled: false },
    formatOnPaste: true,
  }}
/>
```

### 5.2 Session Debug Panel

```typescript
// SessionDebugPanel.tsx
interface Props {
  sessionId: string;
  context: ConversationContext;
}

// Features:
- Current node info
- Variable inspector (edit inline)
- Force complete button
- Skip node button
- Stop session button
```

---

## 6. Migrasyon Plani

### 6.1 Database Migrasyon

```bash
# Yeni entity'ler icin migration
npm run migration:generate -- -n CreateDataSources
npm run migration:generate -- -n CreateFlowSessions
npm run migration:run
```

### 6.2 Environment Variables

```env
# .env dosyasina ekle
STRAPI_BASE_URL=https://gardenhausapi.sipsy.ai
STRAPI_TOKEN=xxxx
```

---

## 7. Test Plani

### 7.1 Unit Tests

- [ ] DataSourcesService.create()
- [ ] DataSourcesService.testConnection()
- [ ] FlowsService.clone()
- [ ] FlowsService.deprecate()
- [ ] ChatbotsService.updateNodeData()

### 7.2 Integration Tests

- [ ] Data source CRUD via API
- [ ] Flow clone via API
- [ ] Node update via API

### 7.3 E2E Tests

- [ ] Data source ekleme UI
- [ ] Flow selector dropdown
- [ ] Flow clone UI
- [ ] Session debug panel

---

## 8. Basari Kriterleri

### MVP Hedefleri

- [ ] Kullanici SQL yazmadan Flow ID atayabiliyor
- [ ] Kullanici UI'dan Strapi API config yapabiliyor
- [ ] Kullanici Flow'u kopyalayabiliyor
- [ ] Hardcoded degerler yok

### Phase 2 Hedefleri

- [ ] Flow JSON UI'dan duzenlenebiliyor
- [ ] Session debug islemleri UI'dan yapiliyor
- [ ] Execution log'lar goruntulenebiliyor

---

## 9. Kaynaklar

### Ilgili Raporlar

- `01-SESSION-ANALYSIS.md` - Debugging session analizi
- `02-CODE-IMPROVEMENTS.md` - Kod iyilestirmeleri
- `03-WHATSAPP-FLOW-BUGS.md` - WhatsApp Flow bugları
- `04-FLOW-BUILDER-UI-GAPS.md` - UI eksiklikleri

### Detayli Analizler

- `/docs/UI_FEATURE_GAPS_ANALYSIS.md` - 915 satirlik detayli UI analizi
- `/docs/WHATSAPP_FLOWS_TEXT_BINDING_LIMITATIONS.md` - Text binding dokumantasyonu

---

## 10. Onay

Bu gelistirme plani asagidaki konulari kapsamaktadir:

1. **Kritik:** Hardcoded degerlerin kaldirilmasi
2. **Kritik:** Flow selector dropdown eklenmesi
3. **Kritik:** Data Sources module olusturulmasi
4. **Yuksek:** Flow clone/deprecate ozellikleri
5. **Orta:** UI iyilestirmeleri (JSON editor, debug panel)

**Toplam Tahmini Sure:** 45-50 saat (yaklasik 1-2 hafta)

---

**Hazirlayan:** Claude Code (AI Analysis)
**Onaylayan:** _____________
**Tarih:** 2025-11-28

