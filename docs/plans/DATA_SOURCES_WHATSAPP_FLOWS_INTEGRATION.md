# Data Sources + WhatsApp Flows Entegrasyonu - Implementation Plan

## Kullanıcı Tercihleri
- **Playground**: Flow-level varsayılan + Component bazlı override
- **Öncelik**: Playground ve Chatbot paralel implementasyon
- **Cascading**: Evet, dependsOn desteği gerekli

## Mevcut Altyapı

### Backend
| Dosya | Durum | Açıklama |
|-------|-------|----------|
| `backend/src/entities/data-source.entity.ts` | ✅ Hazır | REST_API, STRAPI, GRAPHQL + Auth |
| `backend/src/entities/whatsapp-flow.entity.ts` | ✅ Hazır | dataSourceId relation mevcut |
| `backend/src/modules/data-sources/data-sources.service.ts` | ✅ Hazır | fetchData() generic metodu var |
| `backend/src/modules/webhooks/services/flow-endpoint.service.ts` | ⚠️ Kısmi | Hardcoded screen handler'lar, generic değil |
| `backend/src/modules/chatbots/services/chatbot-execution.service.ts` | ⚠️ Kısmi | Flow entity dataSource kullanılıyor ama node-level yok |
| `backend/src/modules/chatbots/dto/node-data.dto.ts` | ❌ Eksik | dataSourceId field yok |

### Frontend
| Dosya | Durum | Açıklama |
|-------|-------|----------|
| `frontend/src/features/data-sources/api.ts` | ✅ Hazır | getActiveDataSources() mevcut |
| `frontend/src/features/flow-builder/components/playground/modals/SaveFlowModal.tsx` | ⚠️ Güncellenmeli | DataSource seçimi yok |
| `frontend/src/features/flow-builder/components/playground/ContentEditor/editors/DropdownEditor.tsx` | ⚠️ Güncellenmeli | Sadece static options |
| `frontend/src/features/builder/components/ConfigModals.tsx` | ⚠️ Kısmi | data_exchange modunda DataSource var ama eksik |

---

## Implementation Plan

### PHASE 1: Backend Core (Paralel Çalışabilir)

#### TODO 1: ComponentDataSourceConfig DTO Oluştur
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/flows/dto/component-data-source-config.dto.ts` (YENİ)

**Görevler:**
1. ComponentDataSourceConfigDto class oluştur
2. Alanlar: componentName, dataSourceId, endpoint, dataKey, transformTo, dependsOn, filterParam
3. Validation decorator'ları ekle (@IsString, @IsUUID, @IsOptional, @ValidateNested)
4. Swagger ApiProperty decorator'ları ekle

#### TODO 2: CreateFlowFromPlaygroundDto Güncelle
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/flows/dto/create-flow-from-playground.dto.ts`

**Görevler:**
1. dataSourceId?: string field ekle (flow-level varsayılan)
2. dataSourceConfig?: ComponentDataSourceConfigDto[] field ekle
3. Type import ve ValidateNested decorator ekle

#### TODO 3: NodeDataDto'ya DataSource Alanları Ekle
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/chatbots/dto/node-data.dto.ts`

**Görevler:**
1. dataSourceId?: string field ekle
2. dataSourceEndpoint?: string field ekle
3. dataSourceDataKey?: string field ekle
4. Validation decorator'ları ekle

#### TODO 4: FlowsService.createFromPlayground Güncelle
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/flows/flows.service.ts`

**Görevler:**
1. dto.dataSourceId varsa flow entity'ye ata
2. dto.dataSourceConfig varsa metadata.dataSourceConfig olarak kaydet
3. data_api_version ve routing_model ekleme logic'i (dataSourceConfig varsa)

---

### PHASE 2: Backend Flow Endpoint Handler (Kritik)

#### TODO 5: FlowEndpointService Generic Handler
**Agent:** `nestjs-expert` + `whatsapp-flows-expert`
**Dosyalar:**
- `backend/src/modules/webhooks/services/flow-endpoint.service.ts`

**Görevler:**
1. handleDataExchange'i generic, config-driven yap
2. Flow metadata'dan dataSourceConfig yükle
3. Screen bazlı component config eşleştirmesi yap
4. dependsOn için filter parameter build et (cascading)
5. Strapi/REST_API response'u dropdown format'a dönüştür

#### TODO 6: handleInit Generic Data Fetch
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/webhooks/services/flow-endpoint.service.ts`

**Görevler:**
1. İlk ekran için dataSourceConfig'den veri çek
2. Birden fazla dropdown varsa paralel fetch yap
3. Screen.data format'ında response oluştur

---

### PHASE 3: Backend Chatbot Integration (Paralel)

#### TODO 7: ChatbotExecutionService Node-Level DataSource
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/chatbots/services/chatbot-execution.service.ts`

**Görevler:**
1. processWhatsAppFlowNode'da node.data.dataSourceId kontrol et
2. Node-level DataSource varsa fetchFlowInitialData'yı bu source ile çağır
3. dataSourceEndpoint ve dataSourceDataKey kullan
4. Fallback: Flow entity'deki dataSource kullan

---

### PHASE 4: Frontend Playground (Paralel)

#### TODO 8: DataSourceSelector Component Oluştur
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/flow-builder/components/playground/ContentEditor/DataSourceSelector.tsx` (YENİ)

**Görevler:**
1. Reusable component oluştur
2. Props: value, onChange, componentName, availableFields
3. Toggle: "Use Data Source" checkbox
4. DataSource dropdown (getActiveDataSources)
5. Endpoint input, DataKey input
6. Transform mapping (idField, titleField)
7. DependsOn selector (önceki field'lardan seç)

#### TODO 9: DropdownEditor'a DataSource Desteği Ekle
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/flow-builder/components/playground/ContentEditor/editors/DropdownEditor.tsx`

**Görevler:**
1. "Fill from Data Source" toggle ekle
2. Toggle ON ise DataSourceSelector göster
3. Toggle ON ise manual options gizle
4. Config'e useDataSource ve dataSourceConfig kaydet
5. data-source değerini "${data.xxx}" formatına çevir

#### TODO 10: RadioButtonsEditor'a DataSource Desteği Ekle
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/flow-builder/components/playground/ContentEditor/editors/RadioButtonsEditor.tsx`

**Görevler:**
1. DropdownEditor ile aynı pattern uygula
2. DataSourceSelector entegre et

#### TODO 11: SaveFlowModal'a Flow-Level DataSource Ekle
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/flow-builder/components/playground/modals/SaveFlowModal.tsx`

**Görevler:**
1. formData'ya dataSourceId ekle
2. getActiveDataSources() ile dropdown doldur
3. "Default Data Source (Optional)" section ekle
4. onSave'de dataSourceId dahil et

#### TODO 12: usePlaygroundState Hook Güncelle
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/flow-builder/components/playground/hooks/usePlaygroundState.ts`

**Görevler:**
1. dataSourceConfigs state ekle (Record<string, ComponentDataSourceConfig>)
2. setDataSourceConfig, getDataSourceConfig metodları ekle
3. getAllDataSourceConfigs() - save için tüm config'leri topla

#### TODO 13: FlowPlaygroundPage Save Handler Güncelle
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/flow-builder/FlowPlaygroundPage.tsx`
- `frontend/src/app/App.tsx`

**Görevler:**
1. onSave callback'e dataSourceId ve dataSourceConfig ekle
2. Screen.data oluşturma logic'i (dynamic binding)
3. data_api_version ve routing_model ekleme (dataSourceConfig varsa)

---

### PHASE 5: Frontend Chatbot ConfigModals (Paralel)

#### TODO 14: ConfigWhatsAppFlow DataSource Geliştir
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/builder/components/ConfigModals.tsx`

**Görevler:**
1. Her iki flow mode için DataSource seçimi aktif et (şu an sadece data_exchange'de)
2. DataSource endpoint input ekle
3. DataKey input ekle
4. "Test Connection" butonu ekle (opsiyonel)

---

### PHASE 6: Frontend API & Types

#### TODO 15: flows/api Type'larını Güncelle
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/flows/api/index.ts`

**Görevler:**
1. ComponentDataSourceConfig interface tanımla
2. CreateFlowFromPlaygroundDto'ya dataSourceId ve dataSourceConfig ekle
3. createFromPlayground metodunu güncelle

#### TODO 16: builder/types WHATSAPP_FLOW Alanlarını Güncelle
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/shared/types/index.ts`

**Görevler:**
1. NodeData'ya dataSourceId, dataSourceEndpoint, dataSourceDataKey ekle

---

### PHASE 7: Build & Test

#### TODO 17: Backend Build Test
**Agent:** Manuel
**Komutlar:**
```bash
cd backend && npm run build
```

#### TODO 18: Frontend Build Test
**Agent:** Manuel
**Komutlar:**
```bash
cd frontend && npm run build
```

#### TODO 19: Docker Deployment
**Agent:** Manuel
**Komutlar:**
```bash
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml up -d backend
docker logs whatsapp-backend --tail 30
```

---

### PHASE 8: Documentation

#### TODO 20: Reference Dokümantasyonu Oluştur
**Agent:** `project-architect`
**Dosyalar:**
- `.claude/skills/project-architect/reference/21-data-sources-whatsapp-flows-integration.md` (YENİ)

**Görevler:**
1. Özellik açıklaması
2. Backend/Frontend değişiklikler özeti
3. Kullanım örnekleri
4. API endpoint'leri

---

## Agent Kullanım Özeti

| Agent | TODO'lar |
|-------|----------|
| `nestjs-expert` | 1, 2, 3, 4, 5, 6, 7 |
| `whatsapp-flows-expert` | 5 (destek) |
| `react-expert` | 8, 9, 10, 11, 12, 13, 14, 15, 16 |
| `project-architect` | 20 |
| Manuel | 17, 18, 19 |

## Paralel Çalışma Grupları

```
GRUP 1 (Backend DTO): TODO 1, 2, 3 → Paralel
GRUP 2 (Backend Service): TODO 4, 5, 6 → Sıralı (4 → 5 → 6)
GRUP 3 (Backend Chatbot): TODO 7 → GRUP 2 bittikten sonra
GRUP 4 (Frontend Playground): TODO 8, 9, 10, 11, 12 → Paralel
GRUP 5 (Frontend Chatbot): TODO 14 → GRUP 4 ile paralel
GRUP 6 (Frontend State): TODO 13 → GRUP 4 bittikten sonra
GRUP 7 (Frontend Types): TODO 15, 16 → Paralel (başta yapılabilir)
GRUP 8 (Build): TODO 17, 18 → Paralel
GRUP 9 (Deploy): TODO 19 → GRUP 8 bittikten sonra
GRUP 10 (Docs): TODO 20 → En son
```

## Kritik Bağımlılıklar

1. **TODO 5 (FlowEndpointService)** en kritik - diğer tüm flow logic buna bağlı
2. **TODO 8 (DataSourceSelector)** frontend'de reusable component - TODO 9, 10, 14 buna bağlı
3. **TODO 12 (usePlaygroundState)** state management - TODO 13 buna bağlı

## Tahmini Süre

| Grup | Süre |
|------|------|
| Backend DTO (GRUP 1) | 1-2 saat |
| Backend Service (GRUP 2) | 3-4 saat |
| Backend Chatbot (GRUP 3) | 1-2 saat |
| Frontend Playground (GRUP 4) | 4-6 saat |
| Frontend Chatbot (GRUP 5) | 1-2 saat |
| Frontend State (GRUP 6) | 1-2 saat |
| Frontend Types (GRUP 7) | 30 dk |
| Build & Test | 1 saat |
| Deploy | 30 dk |
| Docs | 1 saat |

**Toplam: ~15-20 saat (2-3 gün)**
