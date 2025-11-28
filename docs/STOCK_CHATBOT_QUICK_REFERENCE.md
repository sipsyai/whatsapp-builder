# 🚀 Stok Yönetimi Chatbot - Hızlı Referans

## 📋 Temel Bilgiler

### API Base Configuration
```
Base URL: https://gardenhausapi.sipsy.ai/api
Token: b1653f8a6740702305117a40d274b208ad2549f123f5ad712e5d9d1314379ebda123c95031d88645ca1225823ba62c6ad10371c8ce15ac605ee6ab17435f82f22f60e7164d4bbf11e018b3353dd239153d98a86008fca0ce74c3766eba0e0af3e17acc7fa4469e939b384146ec1bf0efca1f5f45cf07203be5b5f3f9703a67dd
Content-Type: application/json
Timeout: 30000ms
```

### Flow İstatistikleri
- **Toplam Node**: 54
- **Toplam Edge**: 71
- **API Endpoint**: 11
- **Variable**: 33

---

## 🎯 Ana Menü Yapısı

```
START → Welcome → Main Menu
                      ├─→ 📦 Stok Güncelle
                      ├─→ 💰 Fiyat Güncelle
                      └─→ ⚠️ Düşük Stok
```

---

## 📦 Stok Güncelleme Flow

### Adımlar
1. Kategorileri getir (GET /categories)
2. Kategori seç (Dynamic List)
3. Ürünleri getir (GET /products?category=X)
4. Ürün seç (Dynamic List)
5. Detay getir (GET /products/{id})
6. Mevcut stok göster
7. Yeni stok gir (Text Input)
8. Validasyon (>= 0)
9. Güncelle (PUT /products/{id})
10. Başarı mesajı

### Key Nodes
```
api-fetch-categories
  → q-select-category (dynamic: categories)
    → api-fetch-products-by-category
      → cond-check-products-empty
        → q-select-product (dynamic: products_by_category)
          → api-get-product-detail
            → msg-current-stock
              → q-new-stock
                → cond-validate-stock
                  → api-update-stock
                    → msg-stock-updated
```

### Key Variables
- `selected_category_slug` - Seçilen kategori
- `products_by_category` - Kategoriye ait ürünler
- `selected_product_id` - Seçilen ürün ID
- `product_detail` - Ürün detay objesi
- `new_stock_amount` - Yeni stok miktarı
- `update_result` - Güncelleme sonucu

### API Calls
```http
# 1. Get Categories
GET /api/categories

# 2. Get Products by Category
GET /api/products?filters[category][slug][$eq]={{selected_category_slug}}&populate=*

# 3. Get Product Detail
GET /api/products/{{selected_product_id}}?populate=*

# 4. Update Stock
PUT /api/products/{{selected_product_id}}
Body: {"data": {"stock": {{new_stock_amount}}}}
```

---

## 💰 Fiyat Güncelleme Flow

### Adımlar
1. Markaları getir (GET /brands)
2. Marka seç (Dynamic List)
3. Ürünleri getir (GET /products?brand=X)
4. Ürün seç (Dynamic List)
5. Detay getir (GET /products/{id})
6. Mevcut fiyat göster
7. Yeni fiyat gir (Text Input)
8. Validasyon (> 0)
9. Güncelle (PUT /products/{id})
10. Başarı mesajı

### Key Nodes
```
api-fetch-brands
  → q-select-brand (dynamic: brands)
    → api-fetch-products-by-brand
      → cond-check-brand-products-empty
        → q-select-brand-product (dynamic: products_by_brand)
          → api-get-brand-product-detail
            → msg-current-price
              → q-new-price
                → cond-validate-price
                  → api-update-price
                    → msg-price-updated
```

### Key Variables
- `selected_brand_slug` - Seçilen marka
- `products_by_brand` - Markaya ait ürünler
- `selected_brand_product_id` - Seçilen ürün ID
- `brand_product_detail` - Ürün detay objesi
- `new_price_amount` - Yeni fiyat
- `price_update_result` - Güncelleme sonucu

### API Calls
```http
# 1. Get Brands
GET /api/brands

# 2. Get Products by Brand
GET /api/products?filters[brand][slug][$eq]={{selected_brand_slug}}&populate=*

# 3. Get Product Detail
GET /api/products/{{selected_brand_product_id}}?populate=*

# 4. Update Price
PUT /api/products/{{selected_brand_product_id}}
Body: {"data": {"price": {{new_price_amount}}}}
```

---

## ⚠️ Düşük Stok Raporu Flow

### Adımlar
1. Düşük stok ürünleri getir (GET /products?stock<10)
2. Ürün varsa liste göster
3. Aksiyon seç (Güncelle / Menü)
4. Ürün seç (Dynamic List)
5. Detay getir (GET /products/{id})
6. Mevcut stok göster
7. Yeni stok gir (Text Input)
8. Güncelle (PUT /products/{id})
9. Başarı mesajı

### Key Nodes
```
api-fetch-low-stock
  → cond-check-low-stock-empty
    → msg-low-stock-list
      → q-low-stock-action
        → q-select-low-stock-product (dynamic: low_stock_products)
          → api-get-low-stock-detail
            → msg-low-stock-current
              → q-new-low-stock
                → api-update-low-stock
                  → msg-low-stock-updated
```

### Key Variables
- `low_stock_products` - Düşük stoklu ürünler (array)
- `low_stock_action` - Seçilen aksiyon
- `selected_low_stock_product_id` - Seçilen ürün ID
- `low_stock_detail` - Ürün detayı
- `new_low_stock_amount` - Yeni stok

### API Calls
```http
# 1. Get Low Stock Products
GET /api/products?filters[stock][$lt]=10&populate=*

# 2. Get Product Detail
GET /api/products/{{selected_low_stock_product_id}}?populate=*

# 3. Update Stock
PUT /api/products/{{selected_low_stock_product_id}}
Body: {"data": {"stock": {{new_low_stock_amount}}}}
```

---

## 🔀 Edge Routing Patterns

### Simple Sequential
```json
{
  "source": "msg-welcome",
  "target": "q-main-menu"
}
```

### Button Routing
```json
{
  "source": "q-main-menu",
  "target": "api-fetch-categories",
  "sourceHandle": "stock_update"
}
```

### API Success/Error Routing
```json
// Success
{
  "source": "api-fetch-categories",
  "target": "q-select-category",
  "sourceHandle": "success"
}

// Error
{
  "source": "api-fetch-categories",
  "target": "msg-categories-error",
  "sourceHandle": "error"
}
```

### Condition Routing
```json
// True
{
  "source": "cond-validate-stock",
  "target": "api-update-stock",
  "sourceHandle": "true"
}

// False
{
  "source": "cond-validate-stock",
  "target": "msg-invalid-stock",
  "sourceHandle": "false"
}
```

---

## 🛡️ Hata Yönetimi Patterns

### Pattern 1: API Error → Ana Menü
```
[API Node] --error--> [Error Message] --> [Ana Menü]
```

**Örnek**:
```
api-fetch-categories --error--> msg-categories-error --> q-main-menu
```

### Pattern 2: Validation Error → Retry
```
[Condition] --false--> [Error Message] --> [Input Question]
```

**Örnek**:
```
cond-validate-stock --false--> msg-invalid-stock --> q-new-stock
```

### Pattern 3: Empty Data → Ana Menü
```
[Condition] --false--> [Empty Message] --> [Ana Menü]
```

**Örnek**:
```
cond-check-products-empty --false--> msg-no-products --> q-main-menu
```

---

## 📝 Variable Replacement Cheat Sheet

### Basit Değişken
```
{{variable_name}}
→ "değer"
```

### Nested Object
```
{{object.property}}
→ {{product_detail.name}}
→ "Bahçe Hortumu 20m"
```

### Array Length
```
{{array.length}}
→ {{categories.length}}
→ "12"
```

### Multiple Variables
```
"{{product_detail.name}} - Fiyat: {{product_detail.price}} TL"
→ "Bahçe Hortumu 20m - Fiyat: 149.99 TL"
```

### API Request Body
```json
{
  "data": {
    "stock": {{new_stock_amount}}
  }
}
// new_stock_amount = 150
→ {"data": {"stock": 150}}
```

### URL Parameter
```
/api/products?filters[category][slug][$eq]={{selected_category_slug}}
// selected_category_slug = "bahce-ekipmanlari"
→ /api/products?filters[category][slug][$eq]=bahce-ekipmanlari
```

---

## 🎨 Dynamic List Configuration

### Template
```json
{
  "questionType": "list",
  "content": "Liste başlığı",
  "variable": "output_variable_name",
  "listButtonText": "Buton Text",
  "dynamicListSource": "api_response_variable",
  "dynamicLabelField": "name",
  "dynamicDescField": "description",
  "headerText": "Header",
  "footerText": "Footer {{variable.length}} item"
}
```

### Kategori Listesi Örneği
```json
{
  "questionType": "list",
  "content": "Kategori seçin:",
  "variable": "selected_category_slug",
  "listButtonText": "Kategori Seç",
  "dynamicListSource": "categories",
  "dynamicLabelField": "name",
  "dynamicDescField": "slug",
  "headerText": "Kategoriler",
  "footerText": "Toplam {{categories.length}} kategori"
}
```

### API Response Format
```json
{
  "data": [
    {
      "id": 1,
      "documentId": "abc123",
      "name": "Bahçe Ekipmanları",  // → dynamicLabelField
      "slug": "bahce-ekipmanlari"    // → dynamicDescField
    }
  ]
}
```

### Resulting WhatsApp List
```
[Kategori Seç] Button
  → Header: Kategoriler
  → Section 1:
    - Bahçe Ekipmanları
      bahce-ekipmanlari
    - Sulama Sistemleri
      sulama-sistemleri
  → Footer: Toplam 12 kategori
```

---

## ⚙️ Condition Node Operators

### Karşılaştırma Operatörleri
```
'eq', '==', 'equals'           → Eşit
'neq', '!=', 'not_equals'      → Eşit değil
'gt', '>', 'greater'           → Büyük
'lt', '<', 'less'              → Küçük
'gte', '>=', 'greater_or_equal'→ Büyük veya eşit
'lte', '<=', 'less_or_equal'   → Küçük veya eşit
'contains'                     → İçerir
'not_contains'                 → İçermez
```

### Örnekler

#### Stok Validasyonu
```json
{
  "conditionVar": "new_stock_amount",
  "conditionOp": "gte",
  "conditionVal": "0"
}
// True: new_stock_amount >= 0
```

#### Fiyat Validasyonu
```json
{
  "conditionVar": "new_price_amount",
  "conditionOp": "gt",
  "conditionVal": "0"
}
// True: new_price_amount > 0
```

#### Array Empty Check
```json
{
  "conditionVar": "products_by_category.length",
  "conditionOp": "gt",
  "conditionVal": "0"
}
// True: array has items
```

#### String Comparison
```json
{
  "conditionVar": "search_input",
  "conditionOp": "eq",
  "conditionVal": "menu"
}
// True: user typed "menu"
```

---

## 📊 API Response Path Examples

### Response Path Kullanımı

#### Tüm Data Objesi
```json
// Response
{
  "data": {
    "id": 1,
    "name": "Product"
  }
}

// apiResponsePath: "data"
// Result: { "id": 1, "name": "Product" }
```

#### Nested Array
```json
// Response
{
  "data": {
    "items": [
      { "id": 1, "name": "Item 1" }
    ],
    "total": 10
  }
}

// apiResponsePath: "data.items"
// Result: [{ "id": 1, "name": "Item 1" }]
```

#### Direct Array
```json
// Response
{
  "data": [
    { "id": 1, "name": "Category 1" }
  ]
}

// apiResponsePath: "data"
// Result: [{ "id": 1, "name": "Category 1" }]
```

---

## 🔧 Common Debugging Tips

### Problem: Dynamic list boş görünüyor
**Çözüm**:
1. API response'u kontrol et (success edge tetiklendi mi?)
2. `apiResponsePath` doğru mu?
3. Array variable adı doğru mu? (`dynamicListSource`)
4. Field names doğru mu? (`dynamicLabelField`, `dynamicDescField`)

### Problem: Variable replacement çalışmıyor
**Çözüm**:
1. Variable adı doğru yazıldı mı? Case-sensitive!
2. Variable daha önce set edildi mi?
3. Syntax doğru mu? `{{variable}}` (çift süslü parantez)
4. Nested path doğru mu? `{{object.property}}`

### Problem: Condition her zaman false dönüyor
**Çözüm**:
1. Variable type kontrolü (string vs number)
2. Operator doğru mu? (`'gt'` for numbers, `'eq'` for strings)
3. `conditionVal` formatı doğru mu? (string olarak "0")
4. Variable daha önce set edildi mi?

### Problem: API error edge tetikleniyor
**Çözüm**:
1. API endpoint doğru mu?
2. Authorization token geçerli mi?
3. Variable replacement URL'de doğru çalışıyor mu?
4. Request body JSON formatı doğru mu?
5. Network bağlantısı var mı?

### Problem: Update çalışmıyor
**Çözüm**:
1. PUT endpoint doğru mu? (`/api/products/{{documentId}}`)
2. Request body format: `{"data": {"field": value}}`
3. Authorization header var mı?
4. `documentId` doğru variable'dan geliyor mu?

---

## 📋 Testing Checklist

### Stok Güncelleme Flow
- [ ] Kategori listesi yükleniyor
- [ ] Kategori seçimi çalışıyor
- [ ] Ürün listesi yükleniyor
- [ ] Ürün seçimi çalışıyor
- [ ] Mevcut stok doğru gösteriliyor
- [ ] Pozitif sayı girişi çalışıyor
- [ ] Negatif sayı reddediliyor
- [ ] Güncelleme başarılı
- [ ] Hata durumu handle ediliyor

### Fiyat Güncelleme Flow
- [ ] Marka listesi yükleniyor
- [ ] Marka seçimi çalışıyor
- [ ] Ürün listesi yükleniyor
- [ ] Ürün seçimi çalışıyor
- [ ] Mevcut fiyat doğru gösteriliyor
- [ ] Pozitif fiyat girişi çalışıyor
- [ ] Sıfır/negatif fiyat reddediliyor
- [ ] Güncelleme başarılı
- [ ] Hata durumu handle ediliyor

### Düşük Stok Flow
- [ ] Düşük stok raporu yükleniyor
- [ ] Ürün yoksa bilgi mesajı gösteriliyor
- [ ] Ürün varsa liste gösteriliyor
- [ ] Ürün seçimi çalışıyor
- [ ] Detay doğru gösteriliyor
- [ ] Stok güncelleme çalışıyor

### Hata Senaryoları
- [ ] API timeout testi
- [ ] API 500 error testi
- [ ] Boş kategori testi
- [ ] Boş marka testi
- [ ] Invalid stock input testi
- [ ] Invalid price input testi
- [ ] Network error testi

---

## 🚀 Quick Deploy Steps

1. **JSON Import**
   ```bash
   # STOCK_MANAGEMENT_CHATBOT.json dosyasını kullan
   # Backend'e POST /api/chatbots endpoint'ine gönder
   ```

2. **Test Credentials**
   ```
   API URL: https://gardenhausapi.sipsy.ai/api
   Token: [Yukarıdaki token'ı kullan]
   ```

3. **Activate Chatbot**
   ```javascript
   // Set isActive: true
   PATCH /api/chatbots/{id}
   { "isActive": true }
   ```

4. **Test WhatsApp Number**
   - Herhangi bir mesaj gönder
   - "Hoşgeldin" mesajı gelmeli
   - Ana menü gösterilmeli

5. **Monitor**
   - Conversation logs
   - API call success rate
   - Error logs
   - User feedback

---

## 📞 Quick Reference Links

- **Full Guide**: STOCK_MANAGEMENT_CHATBOT_GUIDE.md
- **Flow JSON**: STOCK_MANAGEMENT_CHATBOT.json
- **API Docs**: STRAPI_API_DOCS.md
- **Node Types**: Chatbot Builder Skill

---

**Quick Reference Version**: 1.0.0
**Last Update**: 2025-11-27
**Status**: Ready to Deploy ✅
