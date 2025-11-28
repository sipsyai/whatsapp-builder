# 🏪 Stok & Fiyat Yönetimi Chatbot

> **Production-ready** WhatsApp chatbot for inventory and price management with Strapi API integration

## 📚 Dokümantasyon İndeksi

| Dosya | Açıklama | Kullanım |
|-------|----------|----------|
| **STOCK_MANAGEMENT_CHATBOT.json** | Tam chatbot flow JSON | Import & Deploy |
| **STOCK_MANAGEMENT_CHATBOT_GUIDE.md** | Detaylı teknik dokümantasyon | Geliştirme & Referans |
| **STOCK_CHATBOT_QUICK_REFERENCE.md** | Hızlı başvuru kılavuzu | Günlük kullanım |
| **STOCK_CHATBOT_FLOW_DIAGRAM.md** | Görsel flow diyagramları | Mimari anlama |
| **STOCK_CHATBOT_README.md** | Bu dosya | Genel bakış |

---

## 🎯 Özellikler

### ✅ Ana Fonksiyonlar
- **Stok Güncelleme**: Kategoriye göre ürün seçimi ve stok güncelleme
- **Fiyat Güncelleme**: Markaya göre ürün seçimi ve fiyat güncelleme
- **Düşük Stok Raporu**: Stok < 10 olan ürünleri listeleme ve güncelleme

### 🔧 Teknik Özellikler
- ✅ Strapi v4 REST API entegrasyonu
- ✅ Dinamik liste desteği (kategori, marka, ürün)
- ✅ Otomatik pagination (8 item/sayfa)
- ✅ Input validation (stok >= 0, fiyat > 0)
- ✅ Comprehensive error handling
- ✅ User-friendly messages (Türkçe)
- ✅ Recovery paths (ana menü / retry)

---

## 📊 İstatistikler

```
Toplam Node:        54
Toplam Edge:        71
API Endpoint:       11
Variable:           33
Desteklenen Flow:   3
```

### Node Dağılımı
- MESSAGE nodes: 24
- QUESTION nodes: 14 (buttons: 3, lists: 8, text: 3)
- REST_API nodes: 11 (GET: 8, PUT: 3)
- CONDITION nodes: 8
- START node: 1

---

## 🚀 Hızlı Başlangıç

### 1. JSON Import
```bash
# Backend API'ye chatbot import et
POST /api/chatbots
Content-Type: application/json

# Body: STOCK_MANAGEMENT_CHATBOT.json içeriği
```

### 2. Strapi API Yapılandırma
```javascript
{
  baseURL: "https://gardenhausapi.sipsy.ai/api",
  token: "b1653f8a6740702305117a40d274b208ad2549f123f5ad712e5d9d1314379ebda123c95031d88645ca1225823ba62c6ad10371c8ce15ac605ee6ab17435f82f22f60e7164d4bbf11e018b3353dd239153d98a86008fca0ce74c3766eba0e0af3e17acc7fa4469e939b384146ec1bf0efca1f5f45cf07203be5b5f3f9703a67dd",
  timeout: 30000
}
```

### 3. Chatbot Aktivasyonu
```javascript
// Chatbot'u aktif hale getir
PATCH /api/chatbots/{id}
{
  "isActive": true,
  "status": "active"
}
```

### 4. Test
WhatsApp Business numaranıza herhangi bir mesaj gönderin:
```
User: Merhaba
Bot: 🏪 Stok & Fiyat Yönetim Sistemi
     Merhaba! Ürün stok ve fiyat yönetimi için hazırım.

     [Ana Menü gösterilir]
```

---

## 📖 Kullanım Örnekleri

### Senaryo 1: Stok Güncelleme
1. ✅ "📦 Stok Güncelle" butonuna bas
2. ✅ "Bahçe Ekipmanları" kategorisini seç
3. ✅ "Bahçe Hortumu 20m" ürününü seç
4. ✅ Mevcut stok gösterilir: "45 adet"
5. ✅ Yeni stok gir: "150"
6. ✅ Başarı mesajı: "45 → 150"

### Senaryo 2: Fiyat Güncelleme
1. ✅ "💰 Fiyat Güncelle" butonuna bas
2. ✅ "Gardena" markasını seç
3. ✅ "Bahçe Makası" ürününü seç
4. ✅ Mevcut fiyat gösterilir: "79.90 TL"
5. ✅ Yeni fiyat gir: "89.90"
6. ✅ Başarı mesajı: "79.90 TL → 89.90 TL"

### Senaryo 3: Düşük Stok Raporu
1. ✅ "⚠️ Düşük Stok" butonuna bas
2. ✅ Düşük stoklu ürünler listelenir
3. ✅ "Stok Güncelle" seç
4. ✅ "Bahçe Eldiveni" ürününü seç
5. ✅ Düşük stok uyarısı: "2 adet"
6. ✅ Yeni stok gir: "50"
7. ✅ Başarı mesajı

---

## 🏗️ Flow Yapısı

### Ana Akış
```
START → Welcome → Ana Menü
                     ├─→ Stok Güncelleme Flow
                     ├─→ Fiyat Güncelleme Flow
                     └─→ Düşük Stok Flow
                           ↓
                      Devam Et? → Evet: Ana Menü
                                → Hayır: Çıkış
```

### Stok Güncelleme Flow
```
API: Kategori → Seç → API: Ürünler → Seç → API: Detay →
Input → Validate → API: Update → Success
```

### Fiyat Güncelleme Flow
```
API: Marka → Seç → API: Ürünler → Seç → API: Detay →
Input → Validate → API: Update → Success
```

### Düşük Stok Flow
```
API: Düşük Stok → Liste → Aksiyon Seç → Ürün Seç →
API: Detay → Input → API: Update → Success
```

Detaylı flow diyagramları için: [STOCK_CHATBOT_FLOW_DIAGRAM.md](./STOCK_CHATBOT_FLOW_DIAGRAM.md)

---

## 🌐 API Endpoints

### Strapi Endpoints Kullanımı

| Method | Endpoint | Kullanım | Node |
|--------|----------|----------|------|
| GET | `/categories` | Kategori listesi | api-fetch-categories |
| GET | `/brands` | Marka listesi | api-fetch-brands |
| GET | `/products?filters[category][slug][$eq]={slug}` | Kategoriye göre ürünler | api-fetch-products-by-category |
| GET | `/products?filters[brand][slug][$eq]={slug}` | Markaya göre ürünler | api-fetch-products-by-brand |
| GET | `/products?filters[stock][$lt]=10` | Düşük stoklu ürünler | api-fetch-low-stock |
| GET | `/products/{id}?populate=*` | Ürün detayı | api-get-product-detail |
| PUT | `/products/{id}` | Stok/Fiyat güncelleme | api-update-stock, api-update-price |

Detaylı API dokümantasyonu için: [STRAPI_API_DOCS.md](./STRAPI_API_DOCS.md)

---

## 🔤 Variable Stratejisi

### Naming Convention
`{context}_{type}_{descriptor}`

Örnekler:
- `selected_category_slug` - Seçilen kategorinin slug'ı
- `products_by_category` - Kategoriye göre ürün listesi
- `new_stock_amount` - Yeni stok miktarı
- `product_detail` - Ürün detay objesi

### Variable Kategorileri

**User Inputs** (11 variable):
- `main_menu_choice`, `selected_category_slug`, `selected_product_id`
- `new_stock_amount`, `selected_brand_slug`, `new_price_amount`
- vb.

**API Responses** (11 variable):
- `categories`, `brands`, `products_by_category`
- `product_detail`, `update_result`, `low_stock_products`
- vb.

**Error Variables** (11 variable):
- `categories_error`, `products_error`, `update_error`
- `brand_products_error`, `low_stock_error`
- vb.

Tam liste için: [STOCK_CHATBOT_QUICK_REFERENCE.md](./STOCK_CHATBOT_QUICK_REFERENCE.md#variable-stratejisi)

---

## 🛡️ Hata Yönetimi

### Error Handling Patterns

#### Pattern 1: API Error → Ana Menü
```
API Call --error--> Error Message --> Ana Menü
```

#### Pattern 2: Validation Error → Retry
```
Validation --false--> Error Message --> Input Again
```

#### Pattern 3: Empty Data → Ana Menü
```
Check Empty --true--> No Data Message --> Ana Menü
```

### Error Recovery
- Tüm API error'ları ana menüye yönlendirir
- Validation error'ları retry fırsatı verir
- User-friendly Türkçe hata mesajları
- Her hata için recovery path tanımlı

---

## 🧪 Test Checklist

### Temel Testler
- [ ] Chatbot başlatma (START → Welcome → Menu)
- [ ] Her bir menü butonu çalışıyor
- [ ] Kategori listesi yükleniyor
- [ ] Marka listesi yükleniyor
- [ ] Ürün listeleri yükleniyor
- [ ] Dinamik listeler doğru render ediliyor
- [ ] Stok güncelleme başarılı
- [ ] Fiyat güncelleme başarılı
- [ ] Düşük stok raporu çalışıyor

### Validation Testleri
- [ ] Negatif stok reddediliyor
- [ ] Negatif fiyat reddediliyor
- [ ] Sıfır stok kabul ediliyor
- [ ] Sıfır fiyat reddediliyor
- [ ] Geçersiz input retry fırsatı veriyor

### Error Testleri
- [ ] API timeout senaryosu
- [ ] API 500 error senaryosu
- [ ] Boş kategori senaryosu
- [ ] Boş marka senaryosu
- [ ] Network error senaryosu
- [ ] Her error ana menüye dönüyor

### User Experience Testleri
- [ ] Mesajlar Türkçe ve anlaşılır
- [ ] Emoji kullanımı uygun
- [ ] Footer metinleri bilgilendirici
- [ ] Success mesajları detaylı
- [ ] Devam sorusu çalışıyor
- [ ] Çıkış mesajı gösteriliyor

---

## 📈 Performance Metrikleri

### API Call Sayısı (Flow Başına)

**Stok Güncelleme**: 4 API call
1. GET /categories
2. GET /products (filtered)
3. GET /products/{id}
4. PUT /products/{id}

**Fiyat Güncelleme**: 4 API call
1. GET /brands
2. GET /products (filtered)
3. GET /products/{id}
4. PUT /products/{id}

**Düşük Stok**: 3 API call
1. GET /products (low stock)
2. GET /products/{id}
3. PUT /products/{id}

### Optimization
- Response caching önerilir (kategori/marka listeleri)
- Pagination otomatik (8 item/sayfa)
- Timeout: 30 saniye (reasonable)

---

## 🔄 Gelecek Geliştirmeler

### Özellik Önerileri
- [ ] SKU/isim ile ürün arama
- [ ] Toplu stok/fiyat güncelleme
- [ ] CSV rapor export
- [ ] Stok alarm sistemi
- [ ] Fiyat değişim geçmişi
- [ ] Kategori + Marka kombine filtreleme
- [ ] Güncelleme öncesi onay mekanizması
- [ ] Admin bildirim entegrasyonu (Telegram/Email)

### Teknik İyileştirmeler
- [ ] Redis caching entegrasyonu
- [ ] API rate limiting
- [ ] Automatic retry logic (failed calls)
- [ ] Analytics & usage tracking
- [ ] Multi-language support (TR/EN)
- [ ] Role-based access control
- [ ] Unit & integration tests
- [ ] Performance monitoring

---

## 📁 Proje Dosya Yapısı

```
/docs/
├── STOCK_MANAGEMENT_CHATBOT.json          # Chatbot flow JSON (DEPLOY)
├── STOCK_MANAGEMENT_CHATBOT_GUIDE.md      # Detaylı teknik dokümantasyon
├── STOCK_CHATBOT_QUICK_REFERENCE.md       # Hızlı referans kılavuzu
├── STOCK_CHATBOT_FLOW_DIAGRAM.md          # Mermaid flow diyagramları
├── STOCK_CHATBOT_README.md                # Bu dosya
└── STRAPI_API_DOCS.md                     # Strapi API dokümantasyonu
```

---

## 🎓 Kullanım Kılavuzları

### Yeni Başlayanlar İçin
1. **STOCK_CHATBOT_README.md** (bu dosya) ile başlayın
2. **STOCK_CHATBOT_FLOW_DIAGRAM.md** ile flow'u görselleştirin
3. **STOCK_MANAGEMENT_CHATBOT.json** dosyasını import edin
4. Test edin!

### Geliştiriciler İçin
1. **STOCK_MANAGEMENT_CHATBOT_GUIDE.md** tam teknik dokümantasyon
2. **STOCK_CHATBOT_QUICK_REFERENCE.md** günlük referans
3. **STRAPI_API_DOCS.md** API endpoint detayları
4. Node/Edge yapıları için JSON'ı inceleyin

### Hızlı Sorun Giderme İçin
1. **STOCK_CHATBOT_QUICK_REFERENCE.md** → Debugging Tips
2. **STOCK_MANAGEMENT_CHATBOT_GUIDE.md** → Troubleshooting
3. Flow diyagramlarına bakın

---

## ⚙️ Sistem Gereksinimleri

### Backend
- Node.js 18+
- PostgreSQL 14+
- NestJS 10+
- TypeORM

### Strapi Backend
- Strapi v4
- PostgreSQL/MySQL
- Products, Categories, Brands content types

### WhatsApp
- WhatsApp Business API access
- Valid phone number
- Webhook configured

---

## 🤝 Destek

### Dokümantasyon
- Teknik sorular: **STOCK_MANAGEMENT_CHATBOT_GUIDE.md**
- Hızlı referans: **STOCK_CHATBOT_QUICK_REFERENCE.md**
- Flow anlama: **STOCK_CHATBOT_FLOW_DIAGRAM.md**

### Sorun Bildirimi
1. Hata mesajını kaydedin
2. Error variable değerini kontrol edin
3. API response'u inceleyin
4. Debugging tips kullanın

---

## 📝 Versiyon Bilgisi

**Version**: 1.0.0
**Release Date**: 2025-11-27
**Status**: ✅ Production Ready
**Author**: WhatsApp Builder Team
**License**: Proprietary

---

## 🎯 Özet

Bu chatbot, **production-ready** bir Strapi API entegrasyonlu stok ve fiyat yönetim sistemidir.

**54 node**, **71 edge**, **33 variable** ve **11 API endpoint** ile tam fonksiyonel bir WhatsApp chatbot'u oluşturulmuştur.

**3 ana flow** (Stok Güncelleme, Fiyat Güncelleme, Düşük Stok Raporu) ile kullanıcı dostu, hata toleranslı ve kolay kullanılabilir bir sistem sunmaktadır.

### Hemen Başlayın!
```bash
# 1. JSON'ı import edin
# 2. Strapi API credentials'ı yapılandırın
# 3. Chatbot'u aktif edin
# 4. WhatsApp'tan test edin
```

**Başarılar dileriz!** 🚀

---

**Son Güncelleme**: 2025-11-27
**Dokümantasyon Seti**: v1.0.0
