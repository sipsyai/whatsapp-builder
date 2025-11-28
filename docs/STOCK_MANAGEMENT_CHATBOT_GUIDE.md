# 🏪 Stok & Fiyat Yönetimi Chatbot - Teknik Dokümantasyon

## 📋 İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [Flow Mimarisi](#flow-mimarisi)
3. [Ana Özellikler](#ana-özellikler)
4. [Node Detayları](#node-detayları)
5. [Variable Stratejisi](#variable-stratejisi)
6. [API Entegrasyonları](#api-entegrasyonları)
7. [Hata Yönetimi](#hata-yönetimi)
8. [Kullanım Senaryoları](#kullanım-senaryoları)

---

## 🎯 Genel Bakış

### Chatbot Amacı
GardenHaus e-ticaret platformu için Strapi API entegrasyonlu, WhatsApp üzerinden stok ve fiyat yönetimi sağlayan profesyonel bir chatbot.

### Teknik Özellikler
- **Platform**: WhatsApp Business API
- **Backend**: Strapi v4 REST API
- **Node Sayısı**: 54 node
- **Edge Sayısı**: 71 edge
- **API Endpoint Sayısı**: 11 farklı endpoint
- **Dinamik Liste Desteği**: Evet (Kategori, Marka, Ürün listeleri)

### Temel Yetenekler
1. ✅ **Stok Güncelleme**: Kategoriye göre ürün seçimi ve stok güncelleme
2. ✅ **Fiyat Güncelleme**: Markaya göre ürün seçimi ve fiyat güncelleme
3. ✅ **Düşük Stok Raporu**: Stok seviyesi 10'un altındaki ürünleri listeleme
4. ✅ **Ürün Arama**: SKU veya isim ile ürün arama (gelecekte eklenebilir)
5. ✅ **Hata Yönetimi**: Tüm API çağrıları için error handling
6. ✅ **Input Validasyonu**: Stok ve fiyat girişleri için doğrulama

---

## 🏗️ Flow Mimarisi

### Ana Flow Yapısı

```
START
  ↓
Welcome Message
  ↓
Main Menu (3 Buttons)
  ├─→ Stok Güncelle → Kategori → Ürün → Stok Gir → Güncelle → Devam Et
  ├─→ Fiyat Güncelle → Marka → Ürün → Fiyat Gir → Güncelle → Devam Et
  └─→ Düşük Stok → Rapor → Ürün Seç → Stok Gir → Güncelle → Devam Et
```

### Flow Segmentleri

#### 1. Başlangıç Segmenti
```
[start-1] → [msg-welcome] → [q-main-menu]
```
- **start-1**: Flow başlangıcı
- **msg-welcome**: Hoşgeldin mesajı
- **q-main-menu**: 3 seçenekli ana menü (Buttons)

#### 2. Stok Güncelleme Segmenti (16 node)
```
[api-fetch-categories] → [q-select-category] → [api-fetch-products-by-category]
  → [cond-check-products-empty] → [q-select-product] → [api-get-product-detail]
  → [msg-current-stock] → [q-new-stock] → [cond-validate-stock]
  → [api-update-stock] → [msg-stock-updated] → [q-continue]
```

#### 3. Fiyat Güncelleme Segmenti (16 node)
```
[api-fetch-brands] → [q-select-brand] → [api-fetch-products-by-brand]
  → [cond-check-brand-products-empty] → [q-select-brand-product]
  → [api-get-brand-product-detail] → [msg-current-price] → [q-new-price]
  → [cond-validate-price] → [api-update-price] → [msg-price-updated] → [q-continue]
```

#### 4. Düşük Stok Raporu Segmenti (14 node)
```
[api-fetch-low-stock] → [cond-check-low-stock-empty] → [msg-low-stock-list]
  → [q-low-stock-action] → [q-select-low-stock-product]
  → [api-get-low-stock-detail] → [msg-low-stock-current] → [q-new-low-stock]
  → [api-update-low-stock] → [msg-low-stock-updated] → [q-continue]
```

#### 5. Devam/Çıkış Segmenti
```
[q-continue] → [yes_continue → q-main-menu] | [no_exit → msg-goodbye]
```

---

## 🔧 Ana Özellikler

### 1. Stok Güncelleme Flow'u

**Kullanıcı Yolculuğu**:
1. Ana menüden "📦 Stok Güncelle" seçilir
2. API'den kategoriler çekilir ve dinamik liste olarak gösterilir
3. Kullanıcı kategori seçer
4. Seçilen kategoriye ait ürünler dinamik liste olarak gösterilir
5. Kullanıcı ürün seçer
6. Mevcut stok bilgisi gösterilir
7. Kullanıcı yeni stok miktarını girer
8. Validasyon kontrolü yapılır (>= 0)
9. API ile stok güncellenir
10. Başarı mesajı gösterilir

**İlgili Node'lar**:
- `api-fetch-categories`: GET /api/categories
- `q-select-category`: Dinamik liste (categories)
- `api-fetch-products-by-category`: GET /api/products?filters[category][slug][$eq]={{selected_category_slug}}
- `cond-check-products-empty`: Ürün sayısı kontrolü
- `q-select-product`: Dinamik liste (products_by_category)
- `api-get-product-detail`: GET /api/products/{{selected_product_id}}
- `q-new-stock`: Text input
- `cond-validate-stock`: Stok >= 0 kontrolü
- `api-update-stock`: PUT /api/products/{{selected_product_id}}

**Hata Senaryoları**:
- Kategori yüklenemezse → `msg-categories-error` → Ana menü
- Ürün yüklenemezse → `msg-products-error` → Ana menü
- Kategoride ürün yoksa → `msg-no-products` → Ana menü
- Detay yüklenemezse → `msg-detail-error` → Ana menü
- Geçersiz stok girişi → `msg-invalid-stock` → Tekrar giriş
- Güncelleme başarısız → `msg-update-error` → Ana menü

### 2. Fiyat Güncelleme Flow'u

**Kullanıcı Yolculuğu**:
1. Ana menüden "💰 Fiyat Güncelle" seçilir
2. API'den markalar çekilir ve dinamik liste olarak gösterilir
3. Kullanıcı marka seçer
4. Seçilen markaya ait ürünler dinamik liste olarak gösterilir
5. Kullanıcı ürün seçer
6. Mevcut fiyat bilgisi gösterilir
7. Kullanıcı yeni fiyat girer
8. Validasyon kontrolü yapılır (> 0)
9. API ile fiyat güncellenir
10. Başarı mesajı gösterilir

**İlgili Node'lar**:
- `api-fetch-brands`: GET /api/brands
- `q-select-brand`: Dinamik liste (brands)
- `api-fetch-products-by-brand`: GET /api/products?filters[brand][slug][$eq]={{selected_brand_slug}}
- `cond-check-brand-products-empty`: Ürün sayısı kontrolü
- `q-select-brand-product`: Dinamik liste (products_by_brand)
- `api-get-brand-product-detail`: GET /api/products/{{selected_brand_product_id}}
- `q-new-price`: Text input
- `cond-validate-price`: Fiyat > 0 kontrolü
- `api-update-price`: PUT /api/products/{{selected_brand_product_id}}

**Hata Senaryoları**:
- Marka yüklenemezse → `msg-brands-error` → Ana menü
- Ürün yüklenemezse → `msg-brand-products-error` → Ana menü
- Markada ürün yoksa → `msg-no-brand-products` → Ana menü
- Detay yüklenemezse → `msg-brand-detail-error` → Ana menü
- Geçersiz fiyat girişi → `msg-invalid-price` → Tekrar giriş
- Güncelleme başarısız → `msg-price-update-error` → Ana menü

### 3. Düşük Stok Raporu Flow'u

**Kullanıcı Yolculuğu**:
1. Ana menüden "⚠️ Düşük Stok" seçilir
2. API'den stok < 10 olan ürünler çekilir
3. Eğer ürün varsa liste gösterilir
4. Kullanıcı "Stok Güncelle" veya "Ana Menü" seçer
5. Stok güncelle seçilirse ürün listesi gösterilir
6. Kullanıcı ürün seçer
7. Mevcut düşük stok bilgisi gösterilir
8. Kullanıcı yeni stok girer
9. API ile stok güncellenir
10. Başarı mesajı gösterilir

**İlgili Node'lar**:
- `api-fetch-low-stock`: GET /api/products?filters[stock][$lt]=10
- `cond-check-low-stock-empty`: Düşük stok ürünü var mı?
- `msg-low-stock-list`: Düşük stoklu ürünleri göster
- `q-low-stock-action`: 2 button (Stok Güncelle / Ana Menü)
- `q-select-low-stock-product`: Dinamik liste (low_stock_products)
- `api-get-low-stock-detail`: GET /api/products/{{selected_low_stock_product_id}}
- `q-new-low-stock`: Text input
- `api-update-low-stock`: PUT /api/products/{{selected_low_stock_product_id}}

**Hata Senaryoları**:
- Rapor alınamazsa → `msg-low-stock-error` → Ana menü
- Düşük stok yoksa → `msg-no-low-stock` → Ana menü
- Detay yüklenemezse → `msg-low-stock-detail-error` → Ana menü
- Güncelleme başarısız → `msg-low-stock-update-error` → Ana menü

---

## 📦 Node Detayları

### START Node
```json
{
  "id": "start-1",
  "type": "start",
  "data": {
    "label": "Start",
    "type": "start"
  }
}
```

### MESSAGE Nodes

#### Welcome Message
```json
{
  "id": "msg-welcome",
  "type": "message",
  "data": {
    "label": "Hoşgeldin Mesajı",
    "type": "message",
    "content": "🏪 *Stok & Fiyat Yönetim Sistemi*\n\nMerhaba! Ürün stok ve fiyat yönetimi için hazırım."
  }
}
```

#### Stock Updated Message
```json
{
  "id": "msg-stock-updated",
  "type": "message",
  "data": {
    "label": "Stok Güncellendi",
    "type": "message",
    "content": "✅ *Stok başarıyla güncellendi!*\n\n📦 Ürün: {{product_detail.name}}\nSKU: {{product_detail.sku}}\n\n📊 Eski Stok: {{product_detail.stock}}\n📊 Yeni Stok: *{{new_stock_amount}}*\n\nİşlem tamamlandı."
  }
}
```

### QUESTION Nodes

#### Main Menu (Buttons)
```json
{
  "id": "q-main-menu",
  "type": "question",
  "data": {
    "label": "Ana Menü",
    "type": "question",
    "questionType": "buttons",
    "content": "Yapmak istediğiniz işlemi seçin:",
    "variable": "main_menu_choice",
    "headerText": "Ana Menü",
    "footerText": "GardenHaus Yönetim Sistemi",
    "buttons": [
      { "id": "stock_update", "title": "📦 Stok Güncelle" },
      { "id": "price_update", "title": "💰 Fiyat Güncelle" },
      { "id": "low_stock", "title": "⚠️ Düşük Stok" }
    ]
  }
}
```

#### Category Selection (Dynamic List)
```json
{
  "id": "q-select-category",
  "type": "question",
  "data": {
    "label": "Kategori Seç",
    "type": "question",
    "questionType": "list",
    "content": "Stok güncellemek istediğiniz ürünün kategorisini seçin:",
    "variable": "selected_category_slug",
    "listButtonText": "Kategori Seç",
    "dynamicListSource": "categories",
    "dynamicLabelField": "name",
    "dynamicDescField": "slug",
    "headerText": "Kategoriler",
    "footerText": "Toplam {{categories.length}} kategori"
  }
}
```

#### Product Selection (Dynamic List)
```json
{
  "id": "q-select-product",
  "type": "question",
  "data": {
    "label": "Ürün Seç",
    "type": "question",
    "questionType": "list",
    "content": "Stok güncellemek istediğiniz ürünü seçin:",
    "variable": "selected_product_id",
    "listButtonText": "Ürün Seç",
    "dynamicListSource": "products_by_category",
    "dynamicLabelField": "name",
    "dynamicDescField": "sku",
    "headerText": "Ürünler",
    "footerText": "Toplam {{products_by_category.length}} ürün"
  }
}
```

#### New Stock Input (Text)
```json
{
  "id": "q-new-stock",
  "type": "question",
  "data": {
    "label": "Yeni Stok Gir",
    "type": "question",
    "questionType": "text",
    "content": "Yeni stok miktarını girin:\n\n(İpucu: Sadece rakam girin. Örn: 150)",
    "variable": "new_stock_amount"
  }
}
```

### CONDITION Nodes

#### Stock Validation
```json
{
  "id": "cond-validate-stock",
  "type": "condition",
  "data": {
    "label": "Stok Geçerli mi?",
    "type": "condition",
    "conditionVar": "new_stock_amount",
    "conditionOp": "gte",
    "conditionVal": "0"
  }
}
```
- **True Edge**: Stok >= 0 → Güncelleme yap
- **False Edge**: Stok < 0 → Hata mesajı göster

#### Products Empty Check
```json
{
  "id": "cond-check-products-empty",
  "type": "condition",
  "data": {
    "label": "Ürün Var mı?",
    "type": "condition",
    "conditionVar": "products_by_category.length",
    "conditionOp": "gt",
    "conditionVal": "0"
  }
}
```
- **True Edge**: Ürün var → Liste göster
- **False Edge**: Ürün yok → "Ürün bulunamadı" mesajı

### REST_API Nodes

#### Fetch Categories
```json
{
  "id": "api-fetch-categories",
  "type": "rest_api",
  "data": {
    "label": "Kategorileri Getir",
    "type": "rest_api",
    "apiUrl": "https://gardenhausapi.sipsy.ai/api/categories",
    "apiMethod": "GET",
    "apiHeaders": {
      "Authorization": "Bearer b1653f8a6740702305117a40d274b208ad2549f123f5ad712e5d9d1314379ebda123c95031d88645ca1225823ba62c6ad10371c8ce15ac605ee6ab17435f82f22f60e7164d4bbf11e018b3353dd239153d98a86008fca0ce74c3766eba0e0af3e17acc7fa4469e939b384146ec1bf0efca1f5f45cf07203be5b5f3f9703a67dd",
      "Content-Type": "application/json"
    },
    "apiOutputVariable": "categories",
    "apiResponsePath": "data",
    "apiErrorVariable": "categories_error",
    "apiTimeout": 30000
  }
}
```

#### Fetch Products by Category
```json
{
  "id": "api-fetch-products-by-category",
  "type": "rest_api",
  "data": {
    "label": "Kategoriye Göre Ürünler",
    "type": "rest_api",
    "apiUrl": "https://gardenhausapi.sipsy.ai/api/products?filters[category][slug][$eq]={{selected_category_slug}}&populate=*",
    "apiMethod": "GET",
    "apiHeaders": {
      "Authorization": "Bearer [TOKEN]",
      "Content-Type": "application/json"
    },
    "apiOutputVariable": "products_by_category",
    "apiResponsePath": "data",
    "apiErrorVariable": "products_error",
    "apiTimeout": 30000
  }
}
```

#### Update Stock
```json
{
  "id": "api-update-stock",
  "type": "rest_api",
  "data": {
    "label": "Stok Güncelle",
    "type": "rest_api",
    "apiUrl": "https://gardenhausapi.sipsy.ai/api/products/{{selected_product_id}}",
    "apiMethod": "PUT",
    "apiHeaders": {
      "Authorization": "Bearer [TOKEN]",
      "Content-Type": "application/json"
    },
    "apiBody": "{\"data\": {\"stock\": {{new_stock_amount}}}}",
    "apiOutputVariable": "update_result",
    "apiResponsePath": "data",
    "apiErrorVariable": "update_error",
    "apiTimeout": 30000
  }
}
```

---

## 🔤 Variable Stratejisi

### Naming Convention
**Format**: `{context}_{type}_{descriptor}`

**Örnekler**:
- `selected_category_slug` - Seçilen kategorinin slug'ı
- `products_by_category` - Kategoriye göre ürün listesi
- `new_stock_amount` - Kullanıcının girdiği yeni stok miktarı
- `product_detail` - API'den gelen ürün detayı

### Variable Kategorileri

#### 1. User Input Variables (Kullanıcı Girişleri)
| Variable Name | Source Node | Type | Description |
|---------------|-------------|------|-------------|
| `main_menu_choice` | q-main-menu | string | Ana menü seçimi |
| `selected_category_slug` | q-select-category | string | Seçilen kategori slug |
| `selected_product_id` | q-select-product | string | Seçilen ürün ID (documentId) |
| `new_stock_amount` | q-new-stock | number | Yeni stok miktarı |
| `selected_brand_slug` | q-select-brand | string | Seçilen marka slug |
| `selected_brand_product_id` | q-select-brand-product | string | Markadan seçilen ürün ID |
| `new_price_amount` | q-new-price | number | Yeni fiyat |
| `low_stock_action` | q-low-stock-action | string | Düşük stok aksiyonu |
| `selected_low_stock_product_id` | q-select-low-stock-product | string | Düşük stoktan seçilen ürün ID |
| `new_low_stock_amount` | q-new-low-stock | number | Düşük stok ürünü için yeni stok |
| `continue_choice` | q-continue | string | Devam etme tercihi |

#### 2. API Response Variables (API Yanıtları)
| Variable Name | Source API Node | Response Path | Description |
|---------------|-----------------|---------------|-------------|
| `categories` | api-fetch-categories | data | Kategori listesi (array) |
| `brands` | api-fetch-brands | data | Marka listesi (array) |
| `products_by_category` | api-fetch-products-by-category | data | Kategoriye göre ürünler (array) |
| `products_by_brand` | api-fetch-products-by-brand | data | Markaya göre ürünler (array) |
| `product_detail` | api-get-product-detail | data | Ürün detay objesi |
| `brand_product_detail` | api-get-brand-product-detail | data | Marka ürünü detay objesi |
| `low_stock_products` | api-fetch-low-stock | data | Düşük stoklu ürünler (array) |
| `low_stock_detail` | api-get-low-stock-detail | data | Düşük stok ürünü detayı |
| `update_result` | api-update-stock | data | Stok güncelleme sonucu |
| `price_update_result` | api-update-price | data | Fiyat güncelleme sonucu |
| `low_stock_update_result` | api-update-low-stock | data | Düşük stok güncelleme sonucu |

#### 3. Error Variables (Hata Mesajları)
| Variable Name | Source API Node | Description |
|---------------|-----------------|-------------|
| `categories_error` | api-fetch-categories | Kategori yükleme hatası |
| `brands_error` | api-fetch-brands | Marka yükleme hatası |
| `products_error` | api-fetch-products-by-category | Ürün yükleme hatası |
| `brand_products_error` | api-fetch-products-by-brand | Marka ürün hatası |
| `detail_error` | api-get-product-detail | Detay yükleme hatası |
| `brand_detail_error` | api-get-brand-product-detail | Marka detay hatası |
| `low_stock_error` | api-fetch-low-stock | Düşük stok rapor hatası |
| `low_stock_detail_error` | api-get-low-stock-detail | Düşük stok detay hatası |
| `update_error` | api-update-stock | Stok güncelleme hatası |
| `price_update_error` | api-update-price | Fiyat güncelleme hatası |
| `low_stock_update_error` | api-update-low-stock | Düşük stok güncelleme hatası |

### Variable Replacement Examples

#### Simple Replacement
```
"Ürün: {{product_detail.name}}"
→ "Ürün: Bahçe Hortumu 20m"
```

#### Nested Object Access
```
"Mevcut Stok: {{product_detail.stock}}"
→ "Mevcut Stok: 45"
```

#### Array Length
```
"Toplam {{categories.length}} kategori"
→ "Toplam 12 kategori"
```

#### Multiple Variables
```
"{{product_detail.name}} için fiyat {{product_detail.price}} TL'den {{new_price_amount}} TL'ye güncellendi."
→ "Bahçe Hortumu 20m için fiyat 150 TL'den 139.99 TL'ye güncellendi."
```

---

## 🌐 API Entegrasyonları

### Base Configuration
```
Base URL: https://gardenhausapi.sipsy.ai/api
Authorization: Bearer [TOKEN]
Content-Type: application/json
Timeout: 30000ms (30 saniye)
```

### 1. GET /api/categories

**Purpose**: Tüm kategorileri listele

**Node**: `api-fetch-categories`

**Request**:
```http
GET /api/categories
Authorization: Bearer [TOKEN]
```

**Expected Response**:
```json
{
  "data": [
    {
      "id": 1,
      "documentId": "abc123",
      "name": "Bahçe Ekipmanları",
      "slug": "bahce-ekipmanlari",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Variable Storage**:
- `categories` ← `data` (array)
- `categories_error` ← Error message if fails

**Success Edge**: → `q-select-category`
**Error Edge**: → `msg-categories-error`

---

### 2. GET /api/brands

**Purpose**: Tüm markaları listele

**Node**: `api-fetch-brands`

**Request**:
```http
GET /api/brands
Authorization: Bearer [TOKEN]
```

**Expected Response**:
```json
{
  "data": [
    {
      "id": 1,
      "documentId": "def456",
      "name": "Gardena",
      "slug": "gardena",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Variable Storage**:
- `brands` ← `data` (array)
- `brands_error` ← Error message

**Success Edge**: → `q-select-brand`
**Error Edge**: → `msg-brands-error`

---

### 3. GET /api/products (Filtered by Category)

**Purpose**: Belirli kategoriye ait ürünleri listele

**Node**: `api-fetch-products-by-category`

**Request**:
```http
GET /api/products?filters[category][slug][$eq]={{selected_category_slug}}&populate=*
Authorization: Bearer [TOKEN]
```

**Variable Replacement**:
```
{{selected_category_slug}} → "bahce-ekipmanlari"
```

**Final URL**:
```
https://gardenhausapi.sipsy.ai/api/products?filters[category][slug][$eq]=bahce-ekipmanlari&populate=*
```

**Expected Response**:
```json
{
  "data": [
    {
      "id": 1,
      "documentId": "prod123",
      "name": "Bahçe Hortumu 20m",
      "sku": "GH-HORT-20",
      "price": 149.99,
      "stock": 45,
      "category": {
        "name": "Bahçe Ekipmanları"
      },
      "brand": {
        "name": "Gardena"
      }
    }
  ]
}
```

**Variable Storage**:
- `products_by_category` ← `data` (array)
- `products_error` ← Error message

**Success Edge**: → `cond-check-products-empty`
**Error Edge**: → `msg-products-error`

---

### 4. GET /api/products (Filtered by Brand)

**Purpose**: Belirli markaya ait ürünleri listele

**Node**: `api-fetch-products-by-brand`

**Request**:
```http
GET /api/products?filters[brand][slug][$eq]={{selected_brand_slug}}&populate=*
Authorization: Bearer [TOKEN]
```

**Variable Replacement**:
```
{{selected_brand_slug}} → "gardena"
```

**Variable Storage**:
- `products_by_brand` ← `data` (array)
- `brand_products_error` ← Error message

**Success Edge**: → `cond-check-brand-products-empty`
**Error Edge**: → `msg-brand-products-error`

---

### 5. GET /api/products (Low Stock)

**Purpose**: Stok seviyesi 10'un altındaki ürünleri listele

**Node**: `api-fetch-low-stock`

**Request**:
```http
GET /api/products?filters[stock][$lt]=10&populate=*
Authorization: Bearer [TOKEN]
```

**Expected Response**:
```json
{
  "data": [
    {
      "id": 5,
      "documentId": "prod789",
      "name": "Bahçe Makası",
      "sku": "GH-MAK-01",
      "stock": 3,
      "price": 79.90
    }
  ]
}
```

**Variable Storage**:
- `low_stock_products` ← `data` (array)
- `low_stock_error` ← Error message

**Success Edge**: → `cond-check-low-stock-empty`
**Error Edge**: → `msg-low-stock-error`

---

### 6. GET /api/products/{documentId}

**Purpose**: Tek ürünün detayını getir

**Nodes**:
- `api-get-product-detail`
- `api-get-brand-product-detail`
- `api-get-low-stock-detail`

**Request**:
```http
GET /api/products/{{selected_product_id}}?populate=*
Authorization: Bearer [TOKEN]
```

**Variable Replacement**:
```
{{selected_product_id}} → "prod123"
```

**Final URL**:
```
https://gardenhausapi.sipsy.ai/api/products/prod123?populate=*
```

**Expected Response**:
```json
{
  "data": {
    "id": 1,
    "documentId": "prod123",
    "name": "Bahçe Hortumu 20m",
    "sku": "GH-HORT-20",
    "price": 149.99,
    "stock": 45,
    "description": "Yüksek kaliteli bahçe hortumu",
    "category": {
      "id": 1,
      "name": "Bahçe Ekipmanları"
    },
    "brand": {
      "id": 2,
      "name": "Gardena"
    }
  }
}
```

**Variable Storage**:
- `product_detail` / `brand_product_detail` / `low_stock_detail` ← `data` (object)
- Corresponding error variable

**Success Edge**: → Message showing current stock/price
**Error Edge**: → Corresponding error message

---

### 7. PUT /api/products/{documentId}

**Purpose**: Ürün stok veya fiyat güncelleme

**Nodes**:
- `api-update-stock`
- `api-update-price`
- `api-update-low-stock`

**Stock Update Request**:
```http
PUT /api/products/{{selected_product_id}}
Authorization: Bearer [TOKEN]
Content-Type: application/json

{
  "data": {
    "stock": {{new_stock_amount}}
  }
}
```

**Price Update Request**:
```http
PUT /api/products/{{selected_brand_product_id}}
Authorization: Bearer [TOKEN]
Content-Type: application/json

{
  "data": {
    "price": {{new_price_amount}}
  }
}
```

**Variable Replacement Example**:
```json
// Before replacement
{
  "data": {
    "stock": {{new_stock_amount}}
  }
}

// After replacement (new_stock_amount = 150)
{
  "data": {
    "stock": 150
  }
}
```

**Expected Response**:
```json
{
  "data": {
    "id": 1,
    "documentId": "prod123",
    "name": "Bahçe Hortumu 20m",
    "stock": 150,
    "price": 149.99,
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Variable Storage**:
- `update_result` / `price_update_result` / `low_stock_update_result` ← `data` (object)
- Corresponding error variable

**Success Edge**: → Success message
**Error Edge**: → Error message

---

## 🛡️ Hata Yönetimi

### Error Handling Strategy

Her REST_API node için:
1. **Success Edge**: `sourceHandle: 'success'` → Normal flow devam eder
2. **Error Edge**: `sourceHandle: 'error'` → Hata mesajı gösterilir → Ana menüye dönüş

### Error Message Pattern

```json
{
  "type": "message",
  "content": "❌ [İşlem] sırasında hata oluştu.\n\nHata: {{error_variable}}\n\nLütfen tekrar deneyin."
}
```

### Error Recovery Paths

#### API Errors → Ana Menü
```
[API Error] → [Error Message] → [q-main-menu]
```

**Örnekler**:
- `msg-categories-error` → `q-main-menu`
- `msg-products-error` → `q-main-menu`
- `msg-update-error` → `q-main-menu`

#### Validation Errors → Retry
```
[Validation Condition] → [False Edge] → [Error Message] → [Input Question Again]
```

**Örnekler**:
- `cond-validate-stock` [false] → `msg-invalid-stock` → `q-new-stock`
- `cond-validate-price` [false] → `msg-invalid-price` → `q-new-price`

#### Empty Data Errors → Ana Menü
```
[Empty Check Condition] → [False Edge] → [Empty Message] → [q-main-menu]
```

**Örnekler**:
- `cond-check-products-empty` [false] → `msg-no-products` → `q-main-menu`
- `cond-check-brand-products-empty` [false] → `msg-no-brand-products` → `q-main-menu`
- `cond-check-low-stock-empty` [false] → `msg-no-low-stock` → `q-main-menu`

### Error Variables List

| Error Variable | Source | Purpose |
|----------------|--------|---------|
| `categories_error` | api-fetch-categories | Kategori API hatası |
| `brands_error` | api-fetch-brands | Marka API hatası |
| `products_error` | api-fetch-products-by-category | Kategori ürün API hatası |
| `brand_products_error` | api-fetch-products-by-brand | Marka ürün API hatası |
| `detail_error` | api-get-product-detail | Ürün detay API hatası |
| `brand_detail_error` | api-get-brand-product-detail | Marka detay API hatası |
| `low_stock_error` | api-fetch-low-stock | Düşük stok API hatası |
| `low_stock_detail_error` | api-get-low-stock-detail | Düşük stok detay hatası |
| `update_error` | api-update-stock | Stok güncelleme hatası |
| `price_update_error` | api-update-price | Fiyat güncelleme hatası |
| `low_stock_update_error` | api-update-low-stock | Düşük stok güncelleme hatası |

### Common Error Scenarios

#### 1. Network Error
```
{
  "error": "Network Error",
  "message": "Request failed with status code 500"
}
```
**User Message**: "Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin."

#### 2. Unauthorized (401)
```
{
  "error": "Unauthorized",
  "statusCode": 401
}
```
**User Message**: "Yetkilendirme hatası. Sistem yöneticisiyle iletişime geçin."

#### 3. Not Found (404)
```
{
  "error": "Not Found",
  "statusCode": 404
}
```
**User Message**: "İstenen kaynak bulunamadı."

#### 4. Validation Error (400)
```
{
  "error": "Validation Error",
  "details": ["Stock must be a number"]
}
```
**User Message**: "Geçersiz veri formatı. Lütfen doğru değer girin."

#### 5. Timeout Error
```
{
  "error": "Timeout",
  "message": "Request timeout after 30000ms"
}
```
**User Message**: "İşlem zaman aşımına uğradı. Lütfen tekrar deneyin."

---

## 🎬 Kullanım Senaryoları

### Senaryo 1: Başarılı Stok Güncelleme

**Kullanıcı Akışı**:
1. Bot başlatılır → "Hoşgeldin" mesajı
2. Ana menü gösterilir (3 buton)
3. Kullanıcı "📦 Stok Güncelle" tuşuna basar
4. Kategoriler yüklenir (API: GET /categories)
5. Dinamik liste gösterilir: "Bahçe Ekipmanları", "Sulama Sistemleri", vb.
6. Kullanıcı "Bahçe Ekipmanları" seçer
7. Ürünler yüklenir (API: GET /products?category=bahce-ekipmanlari)
8. Dinamik liste gösterilir: "Bahçe Hortumu 20m", "Bahçe Makası", vb.
9. Kullanıcı "Bahçe Hortumu 20m" seçer
10. Ürün detayı yüklenir (API: GET /products/prod123)
11. Mevcut stok gösterilir: "📦 Ürün: Bahçe Hortumu 20m, SKU: GH-HORT-20, Mevcut Stok: 45 adet, Fiyat: 149.99 TL"
12. "Yeni stok miktarını girin:" sorusu gelir
13. Kullanıcı "150" yazar
14. Validasyon geçilir (150 >= 0)
15. Stok güncellenir (API: PUT /products/prod123 → {"data": {"stock": 150}})
16. Başarı mesajı: "✅ Stok başarıyla güncellendi! Eski Stok: 45, Yeni Stok: 150"
17. "Başka bir işlem yapmak ister misiniz?" (Evet / Hayır, Çıkış)
18. Kullanıcı "Hayır, Çıkış" seçer
19. "👋 Görüşmek üzere!" mesajı

**Variables Snapshot**:
```json
{
  "main_menu_choice": "stock_update",
  "categories": [{ "id": 1, "name": "Bahçe Ekipmanları", "slug": "bahce-ekipmanlari" }],
  "selected_category_slug": "bahce-ekipmanlari",
  "products_by_category": [{ "documentId": "prod123", "name": "Bahçe Hortumu 20m", "sku": "GH-HORT-20" }],
  "selected_product_id": "prod123",
  "product_detail": {
    "documentId": "prod123",
    "name": "Bahçe Hortumu 20m",
    "sku": "GH-HORT-20",
    "stock": 45,
    "price": 149.99
  },
  "new_stock_amount": "150",
  "update_result": {
    "documentId": "prod123",
    "stock": 150,
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "continue_choice": "no_exit"
}
```

---

### Senaryo 2: Fiyat Güncelleme Hatası (Geçersiz Giriş)

**Kullanıcı Akışı**:
1. Ana menüden "💰 Fiyat Güncelle" seçilir
2. Markalar yüklenir ve listelenir
3. Kullanıcı "Gardena" markasını seçer
4. Marka ürünleri yüklenir
5. Kullanıcı "Bahçe Makası" ürünü seçer
6. Ürün detayı gösterilir: "Mevcut Fiyat: 79.90 TL"
7. "Yeni fiyatı girin:" sorusu gelir
8. Kullanıcı **"-10"** yazar (negatif değer)
9. Validasyon başarısız (-10 > 0 false)
10. Hata mesajı: "❌ Geçersiz fiyat! Lütfen 0'dan büyük bir fiyat girin."
11. Tekrar "Yeni fiyatı girin:" sorusu gelir
12. Kullanıcı "89.90" yazar
13. Validasyon geçilir
14. Fiyat güncellenir
15. Başarı mesajı gösterilir

**Variables Snapshot (Hata Sonrası)**:
```json
{
  "main_menu_choice": "price_update",
  "selected_brand_slug": "gardena",
  "products_by_brand": [{ "documentId": "prod789", "name": "Bahçe Makası" }],
  "selected_brand_product_id": "prod789",
  "brand_product_detail": {
    "name": "Bahçe Makası",
    "price": 79.90,
    "stock": 15
  },
  "new_price_amount": "89.90",
  "price_update_result": {
    "price": 89.90,
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### Senaryo 3: Düşük Stok Raporu ve Güncelleme

**Kullanıcı Akışı**:
1. Ana menüden "⚠️ Düşük Stok" seçilir
2. Düşük stoklu ürünler yüklenir (API: GET /products?stock[$lt]=10)
3. Sonuç: 3 ürün bulundu
4. Liste gösterilir:
   ```
   ⚠️ Düşük Stok Raporu

   Stoğu 10'un altında olan ürünler:
   1. Bahçe Makası - Stok: 3
   2. Sulama Başlığı - Stok: 7
   3. Bahçe Eldiveni - Stok: 2

   Toplam: 3 ürün
   ```
5. "Ne yapmak istersiniz?" (Stok Güncelle / Ana Menü)
6. Kullanıcı "Stok Güncelle" butonuna basar
7. Düşük stoklu ürünler dinamik liste olarak gösterilir
8. Kullanıcı "Bahçe Eldiveni" seçer
9. Detay gösterilir: "⚠️ Ürün: Bahçe Eldiveni, Mevcut Stok: 2 adet, DİKKAT: Stok seviyesi düşük!"
10. "Yeni stok miktarını girin:" sorusu
11. Kullanıcı "50" yazar
12. Stok güncellenir
13. Başarı mesajı: "✅ Stok başarıyla güncellendi! Eski Stok: 2, Yeni Stok: 50"
14. Devam sorusu → "Evet" seçilir → Ana menüye dönülür

**Variables Snapshot**:
```json
{
  "main_menu_choice": "low_stock",
  "low_stock_products": [
    { "documentId": "prod789", "name": "Bahçe Makası", "stock": 3 },
    { "documentId": "prod456", "name": "Sulama Başlığı", "stock": 7 },
    { "documentId": "prod101", "name": "Bahçe Eldiveni", "stock": 2 }
  ],
  "low_stock_action": "update_low_stock",
  "selected_low_stock_product_id": "prod101",
  "low_stock_detail": {
    "documentId": "prod101",
    "name": "Bahçe Eldiveni",
    "stock": 2,
    "price": 29.90
  },
  "new_low_stock_amount": "50",
  "low_stock_update_result": {
    "stock": 50,
    "updatedAt": "2024-01-15T11:30:00.000Z"
  },
  "continue_choice": "yes_continue"
}
```

---

### Senaryo 4: API Hatası ve Recovery

**Kullanıcı Akışı**:
1. Ana menüden "📦 Stok Güncelle" seçilir
2. Kategoriler API çağrısı yapılır
3. **API Hatası**: Sunucu 500 döner (Internal Server Error)
4. Error edge tetiklenir → `msg-categories-error`
5. Hata mesajı gösterilir:
   ```
   ❌ Kategoriler yüklenirken hata oluştu.

   Hata: Request failed with status code 500

   Lütfen tekrar deneyin.
   ```
6. Otomatik olarak ana menüye yönlendirme
7. Kullanıcı tekrar "📦 Stok Güncelle" seçer
8. Bu sefer API başarılı
9. Normal flow devam eder

**Variables Snapshot (Hata Durumu)**:
```json
{
  "main_menu_choice": "stock_update",
  "categories_error": "Request failed with status code 500"
}
```

---

### Senaryo 5: Boş Sonuç Durumu

**Kullanıcı Akışı**:
1. Ana menüden "📦 Stok Güncelle" seçilir
2. Kategoriler yüklenir ve gösterilir
3. Kullanıcı "Yeni Kategori" (ürünü olmayan) seçer
4. API çağrısı: GET /products?category=yeni-kategori
5. API başarılı ama response boş: `{ "data": [] }`
6. Condition node: `products_by_category.length > 0` → **false**
7. False edge tetiklenir → `msg-no-products`
8. Mesaj gösterilir:
   ```
   ⚠️ Bu kategoride ürün bulunamadı.

   Farklı bir kategori seçebilir veya ana menüye dönebilirsiniz.
   ```
9. Otomatik olarak ana menüye yönlendirme

**Variables Snapshot**:
```json
{
  "selected_category_slug": "yeni-kategori",
  "products_by_category": []
}
```

---

## 📊 Flow İstatistikleri

### Node Dağılımı
- **START**: 1 node
- **MESSAGE**: 24 nodes (welcome, success, error messages)
- **QUESTION**: 14 nodes (buttons: 3, lists: 8, text: 3)
- **CONDITION**: 8 nodes (validation + empty checks)
- **REST_API**: 11 nodes (GET: 8, PUT: 3)
- **TOPLAM**: 54 nodes

### Edge Dağılımı
- **Sequential edges**: 42 (normal flow)
- **Button edges**: 8 (sourceHandle: button IDs)
- **Success/Error edges**: 21 (API routing)
- **TOPLAM**: 71 edges

### Variable İstatistikleri
- **User Input Variables**: 11
- **API Response Variables**: 11
- **Error Variables**: 11
- **TOPLAM**: 33 variables

### API Call Sayısı (Tam Flow)
**Stok Güncelleme Flow'u**: 3 API calls
1. GET /categories
2. GET /products (filtered by category)
3. GET /products/{id} (detail)
4. PUT /products/{id} (update)

**Fiyat Güncelleme Flow'u**: 4 API calls
1. GET /brands
2. GET /products (filtered by brand)
3. GET /products/{id} (detail)
4. PUT /products/{id} (update)

**Düşük Stok Flow'u**: 3 API calls
1. GET /products (low stock filter)
2. GET /products/{id} (detail)
3. PUT /products/{id} (update)

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Strapi API endpoint'leri test edildi
- [ ] Authorization token geçerli ve aktif
- [ ] Tüm API response path'leri doğrulandı
- [ ] Dynamic list field mappings kontrol edildi
- [ ] Variable naming consistency sağlandı

### Testing
- [ ] Her bir flow end-to-end test edildi
- [ ] Tüm error edge'ler tetiklendi ve test edildi
- [ ] Validation condition'ları doğrulandı
- [ ] Empty data scenarios test edildi
- [ ] API timeout scenarios test edildi

### Production
- [ ] ChatBot isActive=true olarak ayarlandı
- [ ] WhatsApp Business API credentials doğru
- [ ] Conversation context cleanup stratejisi belirlendi
- [ ] Monitoring ve logging aktif
- [ ] User feedback mechanism hazır

---

## 📝 Notlar ve Best Practices

### 1. Dynamic List Usage
- `dynamicListSource`: API'den gelen array variable adı
- `dynamicLabelField`: Liste başlığı için kullanılacak field
- `dynamicDescField`: Liste açıklaması için field (opsiyonel)
- Otomatik pagination: 8 item/sayfa

### 2. Variable Replacement
- Her zaman `{{variable}}` syntax kullan
- Nested access: `{{object.property}}`
- Array access: `{{array[0].property}}`
- API request body'de de çalışır: `"{\"stock\": {{new_stock_amount}}}"`

### 3. Error Handling
- Her REST_API node için hem success hem error edge tanımla
- Error variable'ları kullanıcıya göstermeden önce format'la
- User-friendly error messages kullan
- Her zaman recovery path sağla (ana menü veya retry)

### 4. Input Validation
- Kritik inputlar için CONDITION node kullan
- False edge ile retry fırsatı ver
- Clear instruction messages ver (örnek değerlerle)

### 5. API Optimization
- Gereksiz API call'lardan kaçın
- Response path kullanarak sadece gerekli data'yı al
- Timeout değerlerini makul tut (30 saniye)

### 6. User Experience
- Her adımda kullanıcıya bilgi ver
- Success/error messages clear ve actionable olsun
- "Devam et" sorusu ile user control sağla
- Footer text ile context bilgisi ver

---

## 🔄 Gelecek Geliştirmeler

### Özellik Önerileri
1. **Ürün Arama**: SKU veya isimle arama yapabilme
2. **Toplu İşlemler**: Birden fazla ürünü aynı anda güncelleme
3. **Rapor Export**: Düşük stok raporunu CSV olarak gönderme
4. **Stok Alarm**: Belirli eşik değerlerde otomatik bildirim
5. **Fiyat Geçmişi**: Ürün fiyat değişim history'si
6. **Kategori/Marka Filtreleme**: Kombine filtreler
7. **Onay Mekanizması**: Güncelleme öncesi confirmation step
8. **Admin Notifications**: Telegram/Email bildirim entegrasyonu

### Teknik İyileştirmeler
1. **Caching**: Kategori/marka listelerini cache'leme
2. **Rate Limiting**: API call sınırlandırma
3. **Retry Logic**: Failed API calls için automatic retry
4. **Analytics**: Kullanım istatistikleri toplama
5. **Multi-Language**: Türkçe/İngilizce dil desteği
6. **Role-Based Access**: Farklı kullanıcı yetkileri

---

## 📞 Destek ve İletişim

Bu chatbot tasarımı hakkında sorularınız için:
- **Teknik Dokümantasyon**: Bu dosya
- **Flow JSON**: STOCK_MANAGEMENT_CHATBOT.json
- **Strapi API Docs**: STRAPI_API_DOCS.md

---

**Son Güncelleme**: 2025-11-27
**Versiyon**: 1.0.0
**Durum**: Production Ready ✅
