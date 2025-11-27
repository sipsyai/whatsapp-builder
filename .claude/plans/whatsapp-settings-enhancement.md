# WhatsApp Settings Enhancement - Implementation Plan

## Kullanıcı Talebi
WhatsApp Webhook ve Flow Endpoint konfigürasyonlarını Settings UI'dan yönetilebilir hale getirmek.

## Mevcut Durum
- Settings sayfası %70 tamamlanmış
- Backend'de appSecret var ama UI'da gösterilmiyor
- backendUrl, flowEndpointUrl, apiVersion alanları eksik

## Eklenecek Alanlar

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `appSecret` | password | Hayır | Webhook signature doğrulaması (UI'da gösterilecek) |
| `backendUrl` | text | Hayır | Webhook URL oluşturmak için base URL |
| `flowEndpointUrl` | text | Hayır | WhatsApp Flows için endpoint |
| `apiVersion` | select | Hayır | Graph API versiyonu (v18.0, v20.0, v21.0) |

## Yeni UI Yapısı

```
┌─────────────────────────────────────────────────┐
│  WhatsApp Configuration                         │
├─────────────────────────────────────────────────┤
│  📱 API Credentials                             │
│  ├─ Phone Number ID *                           │
│  ├─ Business Account ID *                       │
│  ├─ System User Access Token * (password)       │
│  └─ App Secret (password)                       │
├─────────────────────────────────────────────────┤
│  🔗 Webhook Configuration                       │
│  ├─ Backend URL                                 │
│  ├─ Webhook Callback URL (read-only) [Copy]     │
│  ├─ Flow Endpoint URL (read-only) [Copy]        │
│  └─ Verify Token *                              │
├─────────────────────────────────────────────────┤
│  ⚙️ Advanced Settings                           │
│  └─ API Version (dropdown: v18.0, v20.0, v21.0) │
├─────────────────────────────────────────────────┤
│  [Test Connection]  [Save Configuration]        │
└─────────────────────────────────────────────────┘
```

---

## Implementation Plan

### PHASE 1: Backend Database (Paralel)

#### TODO 1: Migration Oluşturma
**Agent:** `typeorm-expert`
**Dosyalar:**
- `backend/src/migrations/{timestamp}-AddConfigUrlsToWhatsAppConfig.ts`

**Görevler:**
1. Migration dosyası oluştur (timestamp: şu anki zaman)
2. `backend_url` column ekle (varchar 500, nullable)
3. `flow_endpoint_url` column ekle (varchar 500, nullable)
4. `api_version` column ekle (varchar 20, default 'v20.0')
5. down() metodunu yaz (rollback için)

#### TODO 2: Entity Güncelleme
**Agent:** `typeorm-expert`
**Dosyalar:**
- `backend/src/entities/whatsapp-config.entity.ts`

**Görevler:**
1. `backendUrl` property ekle (varchar 500, nullable)
2. `flowEndpointUrl` property ekle (varchar 500, nullable)
3. `apiVersion` property ekle (varchar 20, default 'v20.0')
4. Column naming convention'a uy (snake_case)

---

### PHASE 2: Backend API (Paralel)

#### TODO 3: DTO Güncelleme
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/whatsapp/dto/requests/whatsapp-config.dto.ts`

**Görevler:**
1. CreateWhatsAppConfigDto'ya yeni alanlar ekle:
   - backendUrl (optional, @IsUrl)
   - flowEndpointUrl (optional, @IsUrl)
   - apiVersion (optional, enum validation)
2. WhatsAppConfigResponseDto'ya yeni alanlar ekle
3. Swagger documentation ekle (@ApiPropertyOptional)

#### TODO 4: Service Güncelleme
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/whatsapp/services/whatsapp-config.service.ts`

**Görevler:**
1. `saveConfig()` metodunu güncelle - yeni alanları kaydet
2. `mapToResponseDto()` metodunu güncelle - yeni alanları dahil et
3. `getWebhookUrl()` metodunu güncelle - backendUrl'den dinamik URL oluştur
4. Flow endpoint URL'i de response'a ekle

#### TODO 5: Controller Güncelleme (Opsiyonel)
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/whatsapp/whatsapp-config.controller.ts`

**Görevler:**
1. Swagger documentation güncelle (gerekirse)
2. Response DTO type'larını kontrol et

---

### PHASE 3: Frontend (Sıralı)

#### TODO 6: API Types Güncelleme
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/settings/api.ts`

**Görevler:**
1. WhatsAppConfig interface'ine yeni alanlar ekle:
   - backendUrl?: string
   - flowEndpointUrl?: string
   - apiVersion?: string
2. WhatsAppConfigResponse interface güncelle
3. WebhookUrlResponse'a flowEndpointUrl ekle

#### TODO 7: UI Component Güncelleme
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/settings/WhatsappConfigPage.tsx`

**Görevler:**
1. Form state'e yeni alanları ekle
2. **API Credentials Section:**
   - App Secret input ekle (password type)
3. **Webhook Configuration Section:**
   - Backend URL input ekle
   - Flow Endpoint URL (read-only + copy) ekle
4. **Advanced Settings Section (yeni):**
   - API Version dropdown ekle (v18.0, v20.0, v21.0)
5. Section başlıklarını Material Icons ile güzelleştir
6. Helper text'ler ekle (her alana açıklama)

---

### PHASE 4: Migration & Test

#### TODO 8: Migration Çalıştırma
**Agent:** `manuel`
**Komutlar:**
```bash
cd backend && npm run migration:run
```

#### TODO 9: Build & Test
**Agent:** `manuel`
**Komutlar:**
```bash
# Backend build
cd backend && npm run build

# Frontend build
cd frontend && npm run build

# Test (manuel)
# 1. Settings sayfasını aç
# 2. Tüm alanları doldur
# 3. Save et
# 4. Sayfayı yenile - veriler geldi mi kontrol et
# 5. Test Connection çalışıyor mu kontrol et
```

---

## Agent Kullanım Özeti

| Agent | TODO'lar | Öncelik |
|-------|----------|---------|
| `typeorm-expert` | 1, 2 | PHASE 1 (Paralel) |
| `nestjs-expert` | 3, 4, 5 | PHASE 2 (Paralel) |
| `react-expert` | 6, 7 | PHASE 3 (Sıralı) |
| `manuel` | 8, 9 | PHASE 4 |

---

## Paralel Çalıştırma Stratejisi

```
PHASE 1: [TODO 1, TODO 2] → Paralel (bağımsız)
         ↓
PHASE 2: [TODO 3, TODO 4, TODO 5] → Paralel (bağımsız)
         ↓
PHASE 3: [TODO 6] → [TODO 7] → Sıralı (bağımlı)
         ↓
PHASE 4: [TODO 8] → [TODO 9] → Sıralı (bağımlı)
```

---

## Dosya Değişiklikleri Özeti

### Backend (5 dosya)
1. `migrations/{timestamp}-AddConfigUrlsToWhatsAppConfig.ts` (YENİ)
2. `entities/whatsapp-config.entity.ts` (GÜNCELLE)
3. `modules/whatsapp/dto/requests/whatsapp-config.dto.ts` (GÜNCELLE)
4. `modules/whatsapp/services/whatsapp-config.service.ts` (GÜNCELLE)
5. `modules/whatsapp/whatsapp-config.controller.ts` (GÜNCELLE - opsiyonel)

### Frontend (2 dosya)
1. `features/settings/api.ts` (GÜNCELLE)
2. `features/settings/WhatsappConfigPage.tsx` (GÜNCELLE)

---

## Risk ve Dikkat Edilecekler

1. **Migration**: Mevcut data kaybı riski yok (nullable alanlar)
2. **Backward Compatibility**: ENV variables fallback korunacak
3. **Security**: appSecret maskeleme (response'ta)
4. **Validation**: URL format validation (backend + frontend)

---

## Tahmini Süre

- PHASE 1: ~15 dakika
- PHASE 2: ~20 dakika
- PHASE 3: ~30 dakika
- PHASE 4: ~10 dakika
- **Toplam: ~1.5 saat**
