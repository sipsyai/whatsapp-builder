# Strapi Stok Yönetimi & Fiyat Güncelleme Chatbot - Implementation Plan

## Executive Summary

Gardenhaus Strapi API ile entegre çalışan, WhatsApp üzerinden stok yönetimi ve fiyat güncelleme yapabilen bir chatbot sistemi.

---

## Kullanıcı Tercihleri ✅

- **UI Yaklaşımı**: [x] WhatsApp Flow + Chatbot Menü
  - Ana menü chatbot ile (buttons)
  - Stok/Fiyat güncelleme işlemleri WhatsApp Flow ile
- **Özellikler (V1)**:
  - [x] Stok Güncelleme
  - [x] Fiyat Güncelleme
  - [ ] Düşük Stok Raporu (V2'de)
- **Strapi URL**: Production (`https://gardenhausapi.sipsy.ai/api`)

---

## Mevcut Altyapı Analizi

### Strapi API (Gardenhaus)
- **Base URL**: `https://gardenhausapi.sipsy.ai/api`
- **Token**: Environment variable olarak saklanacak
- **Endpoints**:
  - `GET /api/categories` - Kategoriler
  - `GET /api/brands` - Markalar
  - `GET /api/products?filters[category][slug][$eq]={slug}` - Kategoriye göre ürünler
  - `GET /api/products?filters[brand][slug][$eq]={slug}` - Markaya göre ürünler
  - `GET /api/products?filters[stock][$lt]=10` - Düşük stoklu ürünler
  - `GET /api/products/{documentId}?populate=*` - Ürün detayı
  - `PUT /api/products/{documentId}` - Ürün güncelle

### Mevcut Chatbot Altyapısı
- ✅ REST_API node tam implementasyonlu (variable replacement, error handling)
- ✅ WhatsApp Flow node çalışıyor (data_exchange desteği)
- ✅ Dynamic list desteği (dynamicListSource, pagination)
- ✅ Condition node (multi-condition, AND/OR)
- ⚠️ Strapi credentials hardcoded → Environment variable'a taşınacak

### Mevcut WhatsApp Flow Altyapısı
- ✅ Flow endpoint controller (`/api/webhooks/flow-endpoint`)
- ✅ Encryption/decryption (RSA + AES)
- ✅ Data exchange handling
- ✅ Fiyat güncelleme flow örneği mevcut (Flow ID: 836194732500069)

---

## Implementation Plan

### PHASE 1: Backend Infrastructure (Öncelik: Yüksek)

#### TODO 1: Environment Configuration
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/.env`
- `backend/src/config/strapi.config.ts`

**Görevler:**
1. `.env` dosyasına Strapi credentials ekle
2. ConfigModule ile strapi config oluştur
3. Hardcoded token'ları environment variable'a taşı

```env
# .env
STRAPI_BASE_URL=https://gardenhausapi.sipsy.ai/api
STRAPI_TOKEN=b1653f8a6740702305...
```

---

#### TODO 2: Strapi Integration Service
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/strapi/strapi.module.ts`
- `backend/src/modules/strapi/strapi.service.ts`
- `backend/src/modules/strapi/dto/strapi-product.dto.ts`

**Görevler:**
1. StrapiModule oluştur
2. StrapiService oluştur (centralized API calls)
3. DTO'lar oluştur (Product, Category, Brand)
4. Error handling ve retry logic ekle
5. Caching desteği (opsiyonel)

```typescript
// strapi.service.ts
@Injectable()
export class StrapiService {
  async getCategories(): Promise<Category[]>
  async getBrands(): Promise<Brand[]>
  async getProductsByCategory(slug: string): Promise<Product[]>
  async getProductsByBrand(slug: string): Promise<Product[]>
  async getLowStockProducts(threshold: number): Promise<Product[]>
  async getProduct(documentId: string): Promise<Product>
  async updateProductStock(documentId: string, stock: number): Promise<Product>
  async updateProductPrice(documentId: string, price: number, originalPrice?: number): Promise<Product>
}
```

---

#### TODO 3: Flow Endpoint Handlers Update
**Agent:** `nestjs-expert`
**Dosyalar:**
- `backend/src/modules/webhooks/services/flow-endpoint.service.ts`

**Görevler:**
1. StrapiService inject et
2. Stock Management flow handlers ekle
3. Price Update flow handlers güncelle
4. Low Stock Report flow handlers ekle
5. Flow type auto-detection implement et

---

### PHASE 2: WhatsApp Flows (Öncelik: Yüksek)

#### TODO 4: Stock Management Flow JSON
**Agent:** `whatsapp-flow-builder-expert`
**Dosyalar:**
- `backend/src/modules/chatbots/flows/stock-management-flow.json`

**Screens:**
1. `CATEGORY_SCREEN` - Kategori seçimi (dropdown)
2. `PRODUCT_SCREEN` - Ürün seçimi (dropdown)
3. `STOCK_INFO_SCREEN` - Mevcut stok + yeni stok input
4. `CONFIRM_SCREEN` - Onay
5. `SUCCESS_SCREEN` - Başarı (terminal)
6. `ERROR_SCREEN` - Hata (terminal)

---

#### TODO 5: Price Update Flow JSON
**Agent:** `whatsapp-flow-builder-expert`
**Dosyalar:**
- `backend/src/modules/chatbots/flows/price-update-flow.json`

**Screens:**
1. `BRAND_SCREEN` - Marka seçimi
2. `PRODUCT_SCREEN` - Ürün seçimi
3. `PRICE_INFO_SCREEN` - Mevcut fiyat + yeni fiyat input
4. `DISCOUNT_SCREEN` - İndirim hesaplama
5. `CONFIRM_SCREEN` - Onay
6. `SUCCESS_SCREEN` - Başarı (terminal)

---

#### TODO 6: Low Stock Report Flow JSON (V2 - DEFERRED)
**Agent:** `whatsapp-flow-builder-expert`
**Durum:** V2'de implement edilecek

---

### PHASE 3: Chatbot Flow (Öncelik: Orta)

#### TODO 7: Stock Management Chatbot Flow
**Agent:** `chatbot-builder-expert`
**Dosyalar:**
- `backend/src/modules/chatbots/flows/stock-management-chatbot.json`

**Node Yapısı:**
```
START
  ↓
MESSAGE (Hoşgeldin)
  ↓
QUESTION (Buttons) - Ana Menü
  ├─ "Stok Güncelle" → Stok Flow
  ├─ "Fiyat Güncelle" → Fiyat Flow
  └─ "Düşük Stok" → Rapor Flow
```

**Toplam:** ~55 node, ~75 edge

---

#### TODO 8: WhatsApp Flow Registration
**Agent:** `nestjs-expert`
**Dosyalar:**
- Database: `whatsapp_flows` tablosu

**Görevler:**
1. Flow JSON'ları Meta'ya publish et
2. Database'e kaydet (WhatsAppFlow entity)
3. Chatbot builder'da seçilebilir hale getir

---

### PHASE 4: Frontend (Öncelik: Düşük - Opsiyonel)

#### TODO 9: Strapi Config UI
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/settings/StrapiSettings.tsx`

**Görevler:**
1. Strapi base URL input
2. Strapi token input (encrypted)
3. Connection test butonu
4. WhatsAppConfig entity'ye strapi fields ekle

---

### PHASE 5: Testing & Deployment

#### TODO 10: Backend Build & Test
**Görevler:**
1. `npm run build` - TypeScript compile
2. Unit tests (Strapi service)
3. Integration tests (Flow handlers)

#### TODO 11: Docker Deployment
**Görevler:**
```bash
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml up -d backend
docker logs whatsapp-backend --tail 50
```

#### TODO 12: WhatsApp Flow Publish
**Görevler:**
1. Meta Business Manager'da flow'ları oluştur
2. Flow JSON'ları upload et
3. Test ve publish

---

## Agent Kullanım Özeti

| Agent | TODO'lar |
|-------|----------|
| `nestjs-expert` | 1, 2, 3, 8 |
| `whatsapp-flow-builder-expert` | 4, 5, 6 |
| `chatbot-builder-expert` | 7 |
| `react-expert` | 9 (opsiyonel) |

---

## Paralel Çalıştırma Planı

```
PHASE 1 (Paralel):
├─ TODO 1 (Config) ─────────────┐
├─ TODO 2 (Strapi Service) ─────┼─► PHASE 2'ye geç
└─ TODO 3 (Flow Handlers) ──────┘

PHASE 2 (Paralel):
├─ TODO 4 (Stock Flow JSON) ────┐
├─ TODO 5 (Price Flow JSON) ────┼─► PHASE 3'e geç
└─ TODO 6 (Low Stock Flow) ─────┘

PHASE 3:
└─ TODO 7 (Chatbot Flow) ───────► PHASE 4'e geç

PHASE 4 (Paralel):
├─ TODO 8 (Flow Registration)
└─ TODO 9 (Frontend UI - opsiyonel)

PHASE 5 (Sequential):
└─ TODO 10 → TODO 11 → TODO 12
```

---

## Dosya Yapısı (Final)

```
backend/
├── src/
│   ├── config/
│   │   └── strapi.config.ts (NEW)
│   ├── modules/
│   │   ├── strapi/ (NEW)
│   │   │   ├── strapi.module.ts
│   │   │   ├── strapi.service.ts
│   │   │   └── dto/
│   │   │       ├── strapi-product.dto.ts
│   │   │       ├── strapi-category.dto.ts
│   │   │       └── strapi-brand.dto.ts
│   │   ├── chatbots/
│   │   │   └── flows/ (NEW)
│   │   │       ├── stock-management-flow.json
│   │   │       ├── price-update-flow.json
│   │   │       ├── low-stock-report-flow.json
│   │   │       └── stock-management-chatbot.json
│   │   └── webhooks/
│   │       └── services/
│   │           └── flow-endpoint.service.ts (UPDATED)
│   └── .env (UPDATED)
│
frontend/
└── src/
    └── features/
        └── settings/
            └── StrapiSettings.tsx (NEW - opsiyonel)
```

---

## Risk ve Mitigasyon

| Risk | Olasılık | Etki | Mitigasyon |
|------|----------|------|------------|
| Strapi API timeout | Orta | Yüksek | Retry logic + cache |
| WhatsApp Flow reject | Düşük | Yüksek | JSON validation önceden |
| Concurrent updates | Düşük | Orta | Optimistic locking |
| Token expiry | Orta | Yüksek | Token refresh mechanism |

---

## Başarı Kriterleri

- [ ] Kategorilerden ürün seçip stok güncelleyebilme
- [ ] Markalardan ürün seçip fiyat güncelleyebilme
- [ ] Düşük stoklu ürünleri listeleyebilme
- [ ] WhatsApp Flow'lar başarıyla çalışıyor
- [ ] Chatbot flow başarıyla çalışıyor
- [ ] Error handling düzgün çalışıyor
- [ ] Production'da deploy edilmiş

---

## Notlar

1. **Strapi Token**: Production'da environment variable kullanılacak
2. **WhatsApp Flow Publish**: Meta Business Manager'dan manuel yapılacak
3. **Caching**: Redis ile opsiyonel olarak eklenebilir
4. **Bulk Update**: V2'de eklenebilir

---

**Plan Oluşturulma Tarihi:** 2025-11-27
**Tahmini Süre:** 2-3 gün (paralel çalışma ile)
**Öncelik:** Yüksek
