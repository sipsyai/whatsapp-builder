# Strapi API WhatsApp Flow Entegrasyonu

Bu dokümantasyon, Strapi API ile entegre çalışan 3 WhatsApp Flow'un detaylı yapısını, backend handler implementasyonunu ve kullanım örneklerini içerir.

## 📋 İçindekiler

1. [Flow Özeti](#flow-özeti)
2. [Flow 1: Stok Yönetimi](#flow-1-stok-yönetimi)
3. [Flow 2: Fiyat Güncelleme](#flow-2-fiyat-güncelleme)
4. [Flow 3: Düşük Stok Raporu](#flow-3-düşük-stok-raporu)
5. [Backend Implementasyonu](#backend-implementasyonu)
6. [Strapi API Entegrasyonu](#strapi-api-entegrasyonu)
7. [Test Senaryoları](#test-senaryoları)

---

## Flow Özeti

### Dosya Konumları

```
backend/src/modules/chatbots/
├── stock-management-flow.json       # Stok Yönetimi Flow
├── price-update-flow.json           # Fiyat Güncelleme Flow
└── low-stock-report-flow.json       # Düşük Stok Raporu Flow

backend/src/modules/webhooks/services/
└── flow-endpoint-handlers.service.ts # Tüm flow handler'ları
```

### Strapi API Bilgileri

- **Base URL:** `https://gardenhausapi.sipsy.ai/api`
- **Entities:** Products, Brands, Categories
- **Auth:** Bearer Token (STRAPI_TOKEN environment variable)

---

## Flow 1: Stok Yönetimi

### 📊 Genel Bakış

Kategoriye göre ürün seçimi yaparak stok güncelleme işlemi yapar.

### Ekran Akışı

```
CATEGORY_SCREEN → PRODUCT_SCREEN → STOCK_INFO_SCREEN → CONFIRM_SCREEN → SUCCESS_SCREEN
                                                                      → ERROR_SCREEN
```

### Ekran Detayları

#### 1. CATEGORY_SCREEN (İlk Ekran)

**Amaç:** Kategori seçimi yapılır

**Dinamik Veri:**
```json
{
  "categories": [
    { "id": "masalar", "title": "Masalar", "enabled": true },
    { "id": "sandalyeler", "title": "Sandalyeler", "enabled": true }
  ]
}
```

**Strapi API Call:**
```http
GET /api/categories
Authorization: Bearer {STRAPI_TOKEN}
```

**data_exchange Payload:**
```json
{
  "action": "get_products_by_category",
  "category": "${form.selected_category}"
}
```

#### 2. PRODUCT_SCREEN

**Amaç:** Seçilen kategorideki ürünleri listeler

**Dinamik Veri:**
```json
{
  "products": [
    { "id": "prod001", "title": "Premium Bahçe Sandalyesi - Stok: 50", "enabled": true }
  ]
}
```

**Strapi API Call:**
```http
GET /api/products?filters[category][slug][$eq]=sandalyeler&pagination[pageSize]=100&populate=*
```

**data_exchange Payload:**
```json
{
  "action": "get_product_stock_info",
  "product_id": "${form.selected_product}"
}
```

#### 3. STOCK_INFO_SCREEN

**Amaç:** Mevcut stok bilgisini gösterir ve yeni stok girişi alır

**Dinamik Veri:**
```json
{
  "product_name": "Premium Bahçe Sandalyesi",
  "product_sku": "GH-CHAIR-001",
  "current_stock": "50"
}
```

**Strapi API Call:**
```http
GET /api/products/{documentId}?populate=*
```

**Form Alanları:**
- `new_stock` (number, required) - Yeni stok miktarı
- `update_notes` (textarea, optional) - Güncelleme notları

#### 4. CONFIRM_SCREEN

**Amaç:** Kullanıcı onayı alır

**Görüntülenen Bilgiler:**
- Ürün adı ve SKU
- Mevcut stok
- Yeni stok

**data_exchange Payload:**
```json
{
  "action": "update_stock",
  "product_id": "${screen.PRODUCT_SCREEN.form.selected_product}",
  "new_stock": "${screen.STOCK_INFO_SCREEN.form.new_stock}",
  "notes": "${screen.STOCK_INFO_SCREEN.form.update_notes}"
}
```

**Strapi API Call:**
```http
PUT /api/products/{documentId}
Content-Type: application/json
Authorization: Bearer {STRAPI_TOKEN}

{
  "data": {
    "stock": 75
  }
}
```

#### 5. SUCCESS_SCREEN (Terminal)

**Amaç:** Başarı mesajı gösterir

**Dinamik Veri:**
```json
{
  "success_message": "Stok başarıyla güncellendi!",
  "product_name": "Premium Bahçe Sandalyesi",
  "old_stock": "50",
  "new_stock": "75"
}
```

#### 6. ERROR_SCREEN (Terminal)

**Amaç:** Hata durumunda mesaj gösterir

**Dinamik Veri:**
```json
{
  "error_message": "Stok güncellenirken bir hata oluştu: {error_detail}"
}
```

---

## Flow 2: Fiyat Güncelleme

### 📊 Genel Bakış

Markaya göre ürün seçimi yaparak fiyat ve indirim güncelleme işlemi yapar.

### Ekran Akışı

```
BRAND_SCREEN → PRODUCT_SCREEN → PRICE_INFO_SCREEN → DISCOUNT_SCREEN → CONFIRM_SCREEN → SUCCESS_SCREEN
                                                                                     → ERROR_SCREEN
```

### Ekran Detayları

#### 1. BRAND_SCREEN (İlk Ekran)

**Amaç:** Marka seçimi yapılır

**Dinamik Veri:**
```json
{
  "brands": [
    { "id": "garden-pro", "title": "Garden Pro", "enabled": true },
    { "id": "nature-living", "title": "Nature Living", "enabled": true }
  ]
}
```

**Strapi API Call:**
```http
GET /api/brands
Authorization: Bearer {STRAPI_TOKEN}
```

**data_exchange Payload:**
```json
{
  "action": "get_products_by_brand",
  "brand": "${form.selected_brand}"
}
```

#### 2. PRODUCT_SCREEN

**Amaç:** Seçilen markaya ait ürünleri listeler

**Dinamik Veri:**
```json
{
  "brand_name": "Garden Pro",
  "products": [
    { "id": "prod001", "title": "Premium Bahçe Sandalyesi - 2,499.99 TL", "enabled": true }
  ]
}
```

**Strapi API Call:**
```http
GET /api/products?filters[brand][name][$eq]=Garden%20Pro&pagination[pageSize]=100&populate=*
```

**data_exchange Payload:**
```json
{
  "action": "get_product_price_info",
  "product_id": "${form.selected_product}"
}
```

#### 3. PRICE_INFO_SCREEN

**Amaç:** Mevcut fiyat bilgilerini gösterir ve yeni fiyat girişi alır

**Dinamik Veri:**
```json
{
  "product_name": "Premium Bahçe Sandalyesi",
  "product_sku": "GH-CHAIR-001",
  "current_price": "2,499.99 TL",
  "original_price": "2,999.99 TL",
  "current_discount": "17%"
}
```

**Strapi API Call:**
```http
GET /api/products/{documentId}?populate=*
```

**Form Alanları:**
- `new_price` (number, required) - Yeni satış fiyatı
- `new_original_price` (number, optional) - Yeni orijinal fiyat (indirim için)

**data_exchange Payload:**
```json
{
  "action": "calculate_discount",
  "product_id": "${screen.PRODUCT_SCREEN.form.selected_product}",
  "new_price": "${form.new_price}",
  "new_original_price": "${form.new_original_price}"
}
```

#### 4. DISCOUNT_SCREEN

**Amaç:** Hesaplanan indirim bilgilerini gösterir

**Dinamik Veri:**
```json
{
  "calculated_discount": "25%",
  "price_difference": "750.00 TL"
}
```

**Hesaplama Formülü:**
```typescript
discountPercent = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
priceDifference = originalPrice - salePrice;
```

#### 5. CONFIRM_SCREEN

**Amaç:** Kullanıcı onayı alır

**Görüntülenen Bilgiler:**
- Ürün adı ve SKU
- Eski fiyat
- Yeni fiyat
- Yeni indirim oranı

**data_exchange Payload:**
```json
{
  "action": "update_price",
  "product_id": "${screen.PRODUCT_SCREEN.form.selected_product}",
  "new_price": "${screen.PRICE_INFO_SCREEN.form.new_price}",
  "new_original_price": "${screen.PRICE_INFO_SCREEN.form.new_original_price}",
  "discount_percent": "${screen.DISCOUNT_SCREEN.data.calculated_discount}"
}
```

**Strapi API Call:**
```http
PUT /api/products/{documentId}
Content-Type: application/json
Authorization: Bearer {STRAPI_TOKEN}

{
  "data": {
    "price": 1999.99,
    "originalPrice": 2499.99,
    "discountPercent": 20
  }
}
```

#### 6. SUCCESS_SCREEN (Terminal)

**Amaç:** Başarı mesajı gösterir

**Dinamik Veri:**
```json
{
  "success_message": "Fiyat başarıyla güncellendi!",
  "product_name": "Premium Bahçe Sandalyesi",
  "old_price": "2,499.99 TL",
  "new_price": "1,999.99 TL",
  "discount_percent": "25%"
}
```

---

## Flow 3: Düşük Stok Raporu

### 📊 Genel Bakış

Stok eşik değerini belirleyerek düşük stoklu ürünleri listeler ve stok güncelleme veya sipariş oluşturma aksiyonu alır.

### Ekran Akışı

```
FILTER_SCREEN → REPORT_SCREEN → ACTION_SCREEN → STOCK_UPDATE_SCREEN → SUCCESS_SCREEN
                                              → ORDER_SCREEN → SUCCESS_SCREEN
                                                            → ERROR_SCREEN
```

### Ekran Detayları

#### 1. FILTER_SCREEN (İlk Ekran)

**Amaç:** Filtreleme kriterleri belirlenir

**Form Alanları:**
- `stock_threshold` (number, required) - Minimum stok eşiği (default: 10)
- `sort_by` (radio, required) - Sıralama tercihi
  - `stock_asc` - En Az Stok
  - `stock_desc` - En Çok Stok
  - `name_asc` - İsme Göre (A-Z)

**data_exchange Payload:**
```json
{
  "action": "get_low_stock_products",
  "threshold": "${form.stock_threshold}",
  "sort_by": "${form.sort_by}"
}
```

**Strapi API Call:**
```http
GET /api/products?filters[stock][$lte]=10&sort=stock:asc&pagination[pageSize]=100&populate=*
```

#### 2. REPORT_SCREEN

**Amaç:** Düşük stoklu ürünleri listeler

**Dinamik Veri:**
```json
{
  "total_products": "12",
  "low_stock_products": [
    { "id": "prod001", "title": "Premium Sandalye - Stok: 5", "enabled": true },
    { "id": "prod002", "title": "Bahçe Masası - Stok: 8", "enabled": true }
  ]
}
```

**data_exchange Payload:**
```json
{
  "action": "get_product_details",
  "product_id": "${form.selected_product}"
}
```

#### 3. ACTION_SCREEN

**Amaç:** Aksiyon türü seçilir (Stok Güncelle / Sipariş Oluştur)

**Dinamik Veri:**
```json
{
  "product_name": "Premium Bahçe Sandalyesi",
  "product_sku": "GH-CHAIR-001",
  "current_stock": "5",
  "product_price": "2,499.99 TL"
}
```

**Form Alanları:**
- `action_type` (radio, required)
  - `update_stock` - Stok Güncelle
  - `create_order` - Sipariş Oluştur

**data_exchange Payload:**
```json
{
  "action": "route_action",
  "action_type": "${form.action_type}",
  "product_id": "${screen.REPORT_SCREEN.form.selected_product}"
}
```

#### 4A. STOCK_UPDATE_SCREEN (Stok Güncelleme Seçilirse)

**Amaç:** Yeni stok miktarı girilir

**Form Alanları:**
- `new_stock` (number, required) - Yeni stok miktarı
- `update_reason` (textarea, optional) - Güncelleme nedeni

**data_exchange Payload:**
```json
{
  "action": "update_stock",
  "product_id": "${screen.REPORT_SCREEN.form.selected_product}",
  "new_stock": "${form.new_stock}",
  "reason": "${form.update_reason}"
}
```

**Strapi API Call:**
```http
PUT /api/products/{documentId}
Content-Type: application/json
Authorization: Bearer {STRAPI_TOKEN}

{
  "data": {
    "stock": 50
  }
}
```

#### 4B. ORDER_SCREEN (Sipariş Oluştur Seçilirse)

**Amaç:** Sipariş bilgileri girilir

**Form Alanları:**
- `order_quantity` (number, required) - Sipariş miktarı
- `order_priority` (dropdown, required) - Öncelik
  - `urgent` - Acil
  - `high` - Yüksek
  - `normal` - Normal
  - `low` - Düşük
- `order_notes` (textarea, optional) - Sipariş notları

**data_exchange Payload:**
```json
{
  "action": "create_order",
  "product_id": "${screen.REPORT_SCREEN.form.selected_product}",
  "quantity": "${form.order_quantity}",
  "priority": "${form.order_priority}",
  "notes": "${form.order_notes}"
}
```

**Not:** Bu aksiyon için sipariş oluşturma logic'i ihtiyaca göre implement edilmelidir.

#### 5. SUCCESS_SCREEN (Terminal)

**Amaç:** Başarı mesajı gösterir

**Dinamik Veri:**
```json
{
  "success_message": "İşlem başarıyla tamamlandı!",
  "action_details": "Stok güncellendi: 5 → 50"
}
```

veya

```json
{
  "success_message": "Sipariş talebi oluşturuldu!",
  "action_details": "Miktar: 100 adet\nÖncelik: Acil\nNotlar: Mağaza açılışı için"
}
```

---

## Backend Implementasyonu

### Service Yapısı

**Dosya:** `backend/src/modules/webhooks/services/flow-endpoint-handlers.service.ts`

#### Ana Metodlar

```typescript
class FlowEndpointHandlersService {
  // INIT Handler - Flow başlangıcı
  async handleInit(request: any): Promise<any>

  // DATA_EXCHANGE Router - Ana router
  async handleDataExchange(request: any): Promise<any>

  // BACK Handler
  async handleBack(request: any): Promise<any>

  // Flow Type Detection
  private detectFlowType(screen: string, flow_token?: string): string

  // ===== STOCK MANAGEMENT =====
  private async handleInitStockManagement(): Promise<any>
  private async handleStockManagementDataExchange(request: any): Promise<any>

  // ===== PRICE UPDATE =====
  private async handleInitPriceUpdate(): Promise<any>
  private async handlePriceUpdateDataExchange(request: any): Promise<any>

  // ===== LOW STOCK REPORT =====
  private async handleInitLowStockReport(): Promise<any>
  private async handleLowStockReportDataExchange(request: any): Promise<any>

  // ===== STRAPI API HELPERS =====
  private async fetchCategoriesFromStrapi()
  private async fetchBrandsFromStrapi()
  private async fetchProductsByCategory(categorySlug: string)
  private async fetchProductsByBrand(brandName: string)
  private async fetchLowStockProducts(threshold: number, sortBy: string)
  private async fetchProductDetails(productId: string)
  private async updateProductStock(productId: string, newStock: number)
  private async updateProductPrice(productId: string, newPrice: number, originalPrice?: number, discountPercent?: number)

  // ===== UTILITIES =====
  private formatPrice(price: number): string
  private calculateDiscountPercent(originalPrice: number, salePrice: number): number
}
```

### Flow Type Detection

Service, ekran adlarına göre otomatik flow tipi tespit eder:

```typescript
private detectFlowType(screen: string, flow_token?: string): string {
  // Stock Management screens
  if (['CATEGORY_SCREEN', 'STOCK_INFO_SCREEN', 'STOCK_UPDATE_SCREEN'].includes(screen)) {
    return 'stock_management';
  }

  // Price Update screens
  if (['BRAND_SCREEN', 'PRICE_INFO_SCREEN', 'DISCOUNT_SCREEN'].includes(screen)) {
    return 'price_update';
  }

  // Low Stock Report screens
  if (['FILTER_SCREEN', 'REPORT_SCREEN', 'ACTION_SCREEN', 'ORDER_SCREEN'].includes(screen)) {
    return 'low_stock_report';
  }

  // Default to price_update
  return 'price_update';
}
```

### Environment Variables

`.env` dosyasına eklenecek:

```env
STRAPI_BASE_URL=https://gardenhausapi.sipsy.ai/api
STRAPI_TOKEN=b1653f8a6740702305117a40d274b208ad2549f123f5ad712e5d9d1314379ebda123c95031d88645ca1225823ba62c6ad10371c8ce15ac605ee6ab17435f82f22f60e7164d4bbf11e018b3353dd239153d98a86008fca0ce74c3766eba0e0af3e17acc7fa4469e939b384146ec1bf0efca1f5f45cf07203be5b5f3f9703a67dd
```

---

## Strapi API Entegrasyonu

### Authentication

Tüm API çağrılarında Bearer Token kullanılır:

```typescript
headers: {
  'Authorization': `Bearer ${this.strapiToken}`,
  'Content-Type': 'application/json'
}
```

### API Endpoint'leri ve Kullanımları

#### 1. Kategorileri Getir

```http
GET /api/categories
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "documentId": "cat001",
      "name": "Masalar",
      "slug": "masalar",
      "icon": "table"
    }
  ]
}
```

#### 2. Markaları Getir

```http
GET /api/brands
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "documentId": "brand001",
      "name": "Garden Pro",
      "slug": "garden-pro"
    }
  ]
}
```

#### 3. Kategoriye Göre Ürün Listesi

```http
GET /api/products?filters[category][slug][$eq]=sandalyeler&pagination[pageSize]=100&populate=*
Authorization: Bearer {token}
```

#### 4. Markaya Göre Ürün Listesi

```http
GET /api/products?filters[brand][name][$eq]=Garden%20Pro&pagination[pageSize]=100&populate=*
Authorization: Bearer {token}
```

#### 5. Düşük Stoklu Ürünler

```http
GET /api/products?filters[stock][$lte]=10&sort=stock:asc&pagination[pageSize]=100&populate=*
Authorization: Bearer {token}
```

#### 6. Tek Ürün Detayı

```http
GET /api/products/{documentId}?populate=*
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "documentId": "prod001",
    "name": "Premium Bahçe Sandalyesi",
    "sku": "GH-CHAIR-001",
    "price": 2499.99,
    "originalPrice": 2999.99,
    "discountPercent": 17,
    "stock": 50
  }
}
```

#### 7. Stok Güncelle

```http
PUT /api/products/{documentId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "data": {
    "stock": 75
  }
}
```

#### 8. Fiyat Güncelle

```http
PUT /api/products/{documentId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "data": {
    "price": 1999.99,
    "originalPrice": 2499.99,
    "discountPercent": 20
  }
}
```

### Error Handling

```typescript
try {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Strapi API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
} catch (error) {
  this.logger.error(`API call failed: ${error.message}`);
  return {
    screen: 'ERROR_SCREEN',
    data: {
      error_message: `API hatası: ${error.message}`
    }
  };
}
```

---

## Test Senaryoları

### Test 1: Stok Yönetimi - Başarılı Güncelleme

**Adımlar:**
1. Flow aç
2. Kategori seç: "Sandalyeler"
3. Ürün seç: "Premium Bahçe Sandalyesi"
4. Yeni stok gir: 100
5. Onayla

**Beklenen Sonuç:**
- SUCCESS_SCREEN görüntülenir
- Strapi'de stok 100 olarak güncellenir
- "Stok başarıyla güncellendi!" mesajı gösterilir

### Test 2: Fiyat Güncelleme - İndirimli Fiyat

**Adımlar:**
1. Flow aç
2. Marka seç: "Garden Pro"
3. Ürün seç: "Premium Bahçe Sandalyesi"
4. Yeni fiyat: 1999
5. Orijinal fiyat: 2499
6. İndirim hesapla
7. Onayla

**Beklenen Sonuç:**
- DISCOUNT_SCREEN'de "20%" indirim gösterilir
- SUCCESS_SCREEN görüntülenir
- Strapi'de price=1999, originalPrice=2499, discountPercent=20 olarak güncellenir

### Test 3: Düşük Stok Raporu - Sipariş Oluşturma

**Adımlar:**
1. Flow aç
2. Eşik değer: 20
3. Sıralama: "En Az Stok"
4. Raporu getir
5. Ürün seç
6. Aksiyon: "Sipariş Oluştur"
7. Miktar: 50
8. Öncelik: "Acil"
9. Sipariş oluştur

**Beklenen Sonuç:**
- SUCCESS_SCREEN görüntülenir
- "Sipariş talebi oluşturuldu!" mesajı gösterilir
- Backend'de sipariş log'u oluşturulur

### Test 4: Error Handling - API Hatası

**Senaryo:** Strapi API erişilemiyor

**Beklenen Sonuç:**
- ERROR_SCREEN görüntülenir
- Anlamlı hata mesajı gösterilir
- Backend'de error log kaydedilir

---

## Deployment Checklist

- [ ] Environment variables (.env) ayarlandı mı?
- [ ] Strapi API token geçerli mi?
- [ ] Flow JSON'ları doğru klasöre upload edildi mi?
- [ ] Backend service register edildi mi?
- [ ] Encryption ayarları yapıldı mı?
- [ ] Webhook endpoint public olarak erişilebilir mi?
- [ ] SSL sertifikası geçerli mi?
- [ ] Test senaryoları çalıştırıldı mı?

---

## Troubleshooting

### Problem: Dropdown'lar boş geliyor

**Çözüm:**
- Strapi API erişimini kontrol edin
- Bearer token'ın geçerli olduğundan emin olun
- Backend log'larında API hatalarını kontrol edin

### Problem: Güncelleme başarısız oluyor

**Çözüm:**
- Strapi'de write permission'ları kontrol edin
- documentId'nin doğru olduğundan emin olun
- PUT request body formatını kontrol edin

### Problem: Flow açılmıyor

**Çözüm:**
- Flow JSON syntax'ını validate edin
- routing_model'in doğru olduğunu kontrol edin
- Encryption setup'ını kontrol edin

---

## Sonuç

Bu 3 WhatsApp Flow, production-ready olarak tasarlanmış ve Strapi API ile tam entegre çalışmaktadır. Her flow, error handling, validation ve user experience best practice'lerini takip eder.

**Önemli Notlar:**
- Tüm flowlar WhatsApp Flow JSON v7.2 spesifikasyonuna uygundur
- data_api_version 3.0 kullanılmaktadır
- Tüm ekranlar mobile-first tasarlanmıştır
- Form validasyonları client-side ve server-side yapılmaktadır
