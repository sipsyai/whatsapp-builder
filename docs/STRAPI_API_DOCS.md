# Gardenhaus Strapi API Dokümantasyonu

**Base URL:** `http://localhost:1337/api`
**Production URL:** `https://gardenhausapi.sipsy.ai/api`
**STRAPI Token:** "b1653f8a6740702305117a40d274b208ad2549f123f5ad712e5d9d1314379ebda123c95031d88645ca1225823ba62c6ad10371c8ce15ac605ee6ab17435f82f22f60e7164d4bbf11e018b3353dd239153d98a86008fca0ce74c3766eba0e0af3e17acc7fa4469e939b384146ec1bf0efca1f5f45cf07203be5b5f3f9703a67dd"
**Strapi Version:** 5.31.2

---

## Genel Bilgiler

### Authentication
Public endpoint'ler (products, brands, categories, colors, features) authentication gerektirmez.
Admin işlemleri için JWT token gereklidir.

### Response Format
```json
{
  "data": { ... },
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 4,
      "total": 100
    }
  }
}
```

### Pagination Parameters
| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `pagination[page]` | 1 | - | Sayfa numarası |
| `pagination[pageSize]` | 25 | 500 | Sayfa başına öğe |
| `pagination[withCount]` | true | - | Toplam sayı dahil et |

### Populate (İlişkili Verileri Getir)
```
?populate=*                           # Tüm ilişkileri getir
?populate[0]=brand&populate[1]=images # Belirli ilişkileri getir
?populate=brand,category,images       # Virgülle ayrılmış
```

### Filtering
```
?filters[name][$eq]=Garden Chair      # Tam eşleşme
?filters[price][$gte]=100             # Büyük eşit
?filters[price][$lte]=500             # Küçük eşit
?filters[name][$contains]=chair       # İçerir
?filters[isNew][$eq]=true             # Boolean filtre
?filters[category][slug][$eq]=masa    # İlişki filtresi
```

### Sorting
```
?sort=price:asc                       # Fiyata göre artan
?sort=price:desc                      # Fiyata göre azalan
?sort[0]=price:asc&sort[1]=name:asc   # Çoklu sıralama
```

---

## 1. PRODUCT (Ürün) API

### 1.1 Tüm Ürünleri Listele
```http
GET /api/products
```

**Query Parameters:**
```http
GET /api/products?populate=images,brand,category,colors,features&pagination[page]=1&pagination[pageSize]=10
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "documentId": "abc123xyz",
      "name": "Premium Bahçe Sandalyesi",
      "slug": "premium-bahce-sandalyesi",
      "sku": "GH-CHAIR-001",
      "description": "<p>Yüksek kaliteli bahçe sandalyesi...</p>",
      "price": 2499.99,
      "originalPrice": 2999.99,
      "discountPercent": 17,
      "stock": 50,
      "weight": 8.5,
      "width": 60,
      "depth": 65,
      "height": 90,
      "material": "Tik Ağacı",
      "isNew": true,
      "isFeatured": true,
      "showInSlider": true,
      "sliderSubtitle": "Yeni Sezon",
      "sliderDescription": "Doğal tik ağacından üretilmiş...",
      "sliderButtonText": "Detayları Görün",
      "sliderOrder": 1,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T14:45:00.000Z",
      "publishedAt": "2024-01-15T12:00:00.000Z",
      "brand": {
        "id": 1,
        "documentId": "brand123",
        "name": "Garden Pro",
        "slug": "garden-pro"
      },
      "category": {
        "id": 2,
        "documentId": "cat456",
        "name": "Sandalyeler",
        "slug": "sandalyeler"
      },
      "colors": [
        {
          "id": 1,
          "documentId": "color789",
          "name": "Doğal Kahve",
          "hexCode": "#8B4513"
        }
      ],
      "features": [
        {
          "id": 1,
          "documentId": "feat001",
          "name": "Su Geçirmez"
        },
        {
          "id": 2,
          "documentId": "feat002",
          "name": "UV Dayanıklı"
        }
      ],
      "images": [
        {
          "id": 10,
          "documentId": "img001",
          "name": "sandalye-1.jpg",
          "url": "/uploads/sandalye_1_abc123.jpg",
          "formats": {
            "thumbnail": {
              "url": "/uploads/thumbnail_sandalye_1_abc123.jpg",
              "width": 156,
              "height": 156
            },
            "small": {
              "url": "/uploads/small_sandalye_1_abc123.jpg",
              "width": 500,
              "height": 500
            },
            "medium": {
              "url": "/uploads/medium_sandalye_1_abc123.jpg",
              "width": 750,
              "height": 750
            },
            "large": {
              "url": "/uploads/large_sandalye_1_abc123.jpg",
              "width": 1000,
              "height": 1000
            }
          }
        }
      ]
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "pageCount": 5,
      "total": 47
    }
  }
}
```

### 1.2 Filtrelenmiş Ürün Listesi

**Kategoriye Göre:**
```http
GET /api/products?filters[category][slug][$eq]=sandalyeler&populate=*
```

**Markaya Göre:**
```http
GET /api/products?filters[brand][slug][$eq]=garden-pro&populate=*
```

**Öne Çıkan Ürünler:**
```http
GET /api/products?filters[isFeatured][$eq]=true&populate=images,brand
```

**Yeni Ürünler:**
```http
GET /api/products?filters[isNew][$eq]=true&populate=*
```

**Slider Ürünleri:**
```http
GET /api/products?filters[showInSlider][$eq]=true&sort=sliderOrder:asc&populate=images,brand,category
```

**Fiyat Aralığı:**
```http
GET /api/products?filters[price][$gte]=1000&filters[price][$lte]=5000&populate=*
```

**Stokta Olanlar:**
```http
GET /api/products?filters[stock][$gt]=0&populate=*
```

### 1.3 Tek Ürün Getir (documentId ile)
```http
GET /api/products/:documentId
```

**Örnek:**
```http
GET /api/products/abc123xyz?populate=images,brand,category,colors,features
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "documentId": "abc123xyz",
    "name": "Premium Bahçe Sandalyesi",
    "slug": "premium-bahce-sandalyesi",
    "sku": "GH-CHAIR-001",
    "description": "<p>Yüksek kaliteli bahçe sandalyesi...</p>",
    "price": 2499.99,
    "originalPrice": 2999.99,
    "discountPercent": 17,
    "stock": 50,
    "weight": 8.5,
    "width": 60,
    "depth": 65,
    "height": 90,
    "material": "Tik Ağacı",
    "isNew": true,
    "isFeatured": true,
    "brand": { ... },
    "category": { ... },
    "colors": [ ... ],
    "features": [ ... ],
    "images": [ ... ]
  },
  "meta": {}
}
```

### 1.4 Slug ile Ürün Getir
```http
GET /api/products?filters[slug][$eq]=premium-bahce-sandalyesi&populate=*
```

### 1.5 Yeni Ürün Oluştur (Admin)
```http
POST /api/products
Content-Type: application/json
Authorization: Bearer <admin-jwt-token>
```

**Request Body:**
```json
{
  "data": {
    "name": "Lüks Bahçe Masası",
    "sku": "GH-TABLE-002",
    "description": "<p>6 kişilik geniş bahçe masası. Tik ağacından üretilmiştir.</p>",
    "price": 4999.99,
    "originalPrice": 5999.99,
    "discountPercent": 17,
    "stock": 25,
    "weight": 35.0,
    "width": 180,
    "depth": 100,
    "height": 75,
    "material": "Tik Ağacı",
    "isNew": true,
    "isFeatured": false,
    "showInSlider": false,
    "sliderOrder": 0,
    "brand": "brand123",
    "category": "cat789",
    "colors": ["color001", "color002"],
    "features": ["feat001", "feat003", "feat005"]
  }
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": 48,
    "documentId": "newprod789",
    "name": "Lüks Bahçe Masası",
    "slug": "luks-bahce-masasi",
    "sku": "GH-TABLE-002",
    "description": "<p>6 kişilik geniş bahçe masası...</p>",
    "price": 4999.99,
    "originalPrice": 5999.99,
    "discountPercent": 17,
    "stock": 25,
    "weight": 35.0,
    "width": 180,
    "depth": 100,
    "height": 75,
    "material": "Tik Ağacı",
    "isNew": true,
    "isFeatured": false,
    "showInSlider": false,
    "sliderOrder": 0,
    "createdAt": "2024-01-25T09:00:00.000Z",
    "updatedAt": "2024-01-25T09:00:00.000Z",
    "publishedAt": null
  },
  "meta": {}
}
```

### 1.6 Ürün Güncelle (Admin)
```http
PUT /api/products/:documentId
Content-Type: application/json
Authorization: Bearer <admin-jwt-token>
```

**Örnek - Fiyat ve Stok Güncelleme:**
```http
PUT /api/products/newprod789
```

```json
{
  "data": {
    "price": 4499.99,
    "stock": 30,
    "isFeatured": true
  }
}
```

**Örnek - Slider'a Ekleme:**
```json
{
  "data": {
    "showInSlider": true,
    "sliderSubtitle": "Özel Fırsat",
    "sliderDescription": "Bu ay özel %25 indirim!",
    "sliderButtonText": "Hemen Al",
    "sliderOrder": 2
  }
}
```

**Örnek - İlişkileri Güncelleme:**
```json
{
  "data": {
    "colors": ["color001", "color003", "color007"],
    "features": ["feat001", "feat002"],
    "category": "cat456"
  }
}
```

### 1.7 Ürün Sil (Admin)
```http
DELETE /api/products/:documentId
Authorization: Bearer <admin-jwt-token>
```

**Örnek:**
```http
DELETE /api/products/newprod789
```

**Response (200 OK):**
```json
{
  "data": {
    "id": 48,
    "documentId": "newprod789",
    "name": "Lüks Bahçe Masası",
    ...
  },
  "meta": {}
}
```

### 1.8 Ürüne Görsel Yükleme (Admin)

**Adım 1 - Dosya Yükle:**
```http
POST /api/upload
Content-Type: multipart/form-data
Authorization: Bearer <admin-jwt-token>
```

Form Data:
```
files: [sandalye.jpg]  (binary)
```

**Response:**
```json
[
  {
    "id": 25,
    "documentId": "img025",
    "name": "sandalye.jpg",
    "url": "/uploads/sandalye_abc123.jpg",
    "mime": "image/jpeg",
    "size": 245.67,
    "width": 1200,
    "height": 1200,
    "formats": { ... }
  }
]
```

**Adım 2 - Görseli Ürüne Bağla:**
```http
PUT /api/products/abc123xyz
```

```json
{
  "data": {
    "images": ["img025", "img026", "img027"]
  }
}
```

---

## 2. BRAND (Marka) API

### 2.1 Tüm Markaları Listele
```http
GET /api/brands?populate=logo,products
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "documentId": "brand001",
      "name": "Garden Pro",
      "slug": "garden-pro",
      "description": "Premium bahçe mobilyaları üreticisi",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z",
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "logo": {
        "id": 5,
        "documentId": "logo001",
        "name": "garden-pro-logo.png",
        "url": "/uploads/garden_pro_logo.png",
        "formats": {
          "thumbnail": {
            "url": "/uploads/thumbnail_garden_pro_logo.png"
          }
        }
      },
      "products": [
        {
          "id": 1,
          "documentId": "prod001",
          "name": "Premium Bahçe Sandalyesi"
        },
        {
          "id": 5,
          "documentId": "prod005",
          "name": "Bahçe Salıncağı"
        }
      ]
    },
    {
      "id": 2,
      "documentId": "brand002",
      "name": "Nature Living",
      "slug": "nature-living",
      "description": "Doğal malzemelerle üretim",
      "logo": { ... },
      "products": [ ... ]
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 5
    }
  }
}
```

### 2.2 Tek Marka Getir
```http
GET /api/brands/:documentId?populate=logo,products
```

**Örnek:**
```http
GET /api/brands/brand001?populate=logo,products
```

### 2.3 Slug ile Marka Getir
```http
GET /api/brands?filters[slug][$eq]=garden-pro&populate=logo
```

### 2.4 Yeni Marka Oluştur (Admin)
```http
POST /api/brands
Content-Type: application/json
Authorization: Bearer <admin-jwt-token>
```

**Request Body:**
```json
{
  "data": {
    "name": "EcoGarden",
    "description": "Çevre dostu bahçe ürünleri. Geri dönüştürülmüş malzemeler kullanılır."
  }
}
```

**Response:**
```json
{
  "data": {
    "id": 6,
    "documentId": "brand006",
    "name": "EcoGarden",
    "slug": "ecogarden",
    "description": "Çevre dostu bahçe ürünleri...",
    "createdAt": "2024-01-25T10:00:00.000Z",
    "updatedAt": "2024-01-25T10:00:00.000Z",
    "publishedAt": null
  },
  "meta": {}
}
```

### 2.5 Marka Güncelle (Admin)
```http
PUT /api/brands/:documentId
Content-Type: application/json
Authorization: Bearer <admin-jwt-token>
```

```json
{
  "data": {
    "description": "Güncellenmiş marka açıklaması",
    "logo": "logo007"
  }
}
```

### 2.6 Marka Sil (Admin)
```http
DELETE /api/brands/:documentId
Authorization: Bearer <admin-jwt-token>
```

---

## 3. CATEGORY (Kategori) API

### 3.1 Tüm Kategorileri Listele
```http
GET /api/categories?populate=products
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
      "icon": "table",
      "description": "Bahçe ve teras masaları",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-10T08:00:00.000Z",
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "products": [
        {
          "id": 2,
          "documentId": "prod002",
          "name": "6 Kişilik Bahçe Masası"
        }
      ]
    },
    {
      "id": 2,
      "documentId": "cat002",
      "name": "Sandalyeler",
      "slug": "sandalyeler",
      "icon": "chair",
      "description": "Bahçe sandalyeleri ve koltuklar",
      "products": [ ... ]
    },
    {
      "id": 3,
      "documentId": "cat003",
      "name": "Şemsiyeler",
      "slug": "semsiyeler",
      "icon": "umbrella",
      "description": "Güneş şemsiyeleri ve tente sistemleri",
      "products": [ ... ]
    }
  ],
  "meta": { ... }
}
```

### 3.2 Tek Kategori Getir
```http
GET /api/categories/:documentId?populate=products
```

### 3.3 Yeni Kategori Oluştur (Admin)
```http
POST /api/categories
Content-Type: application/json
Authorization: Bearer <admin-jwt-token>
```

```json
{
  "data": {
    "name": "Bahçe Aydınlatma",
    "icon": "lightbulb",
    "description": "Solar ve elektrikli bahçe aydınlatma ürünleri"
  }
}
```

### 3.4 Kategori Güncelle (Admin)
```http
PUT /api/categories/:documentId
Content-Type: application/json
Authorization: Bearer <admin-jwt-token>
```

```json
{
  "data": {
    "name": "Bahçe & Teras Aydınlatma",
    "description": "Güncellenmiş açıklama"
  }
}
```

### 3.5 Kategori Sil (Admin)
```http
DELETE /api/categories/:documentId
Authorization: Bearer <admin-jwt-token>
```

---

## 4. COLOR (Renk) API

### 4.1 Tüm Renkleri Listele
```http
GET /api/colors
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "documentId": "color001",
      "name": "Doğal Kahve",
      "hexCode": "#8B4513",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "publishedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "documentId": "color002",
      "name": "Antrasit",
      "hexCode": "#36454F",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "publishedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 3,
      "documentId": "color003",
      "name": "Beyaz",
      "hexCode": "#FFFFFF"
    },
    {
      "id": 4,
      "documentId": "color004",
      "name": "Siyah",
      "hexCode": "#000000"
    },
    {
      "id": 5,
      "documentId": "color005",
      "name": "Gri",
      "hexCode": "#808080"
    }
  ],
  "meta": { ... }
}
```

### 4.2 Tek Renk Getir
```http
GET /api/colors/:documentId
```

### 4.3 Yeni Renk Oluştur (Admin)
```http
POST /api/colors
Content-Type: application/json
Authorization: Bearer <admin-jwt-token>
```

```json
{
  "data": {
    "name": "Yeşil",
    "hexCode": "#228B22"
  }
}
```

### 4.4 Renk Güncelle (Admin)
```http
PUT /api/colors/:documentId
Content-Type: application/json
Authorization: Bearer <admin-jwt-token>
```

```json
{
  "data": {
    "name": "Orman Yeşili",
    "hexCode": "#228B22"
  }
}
```

### 4.5 Renk Sil (Admin)
```http
DELETE /api/colors/:documentId
Authorization: Bearer <admin-jwt-token>
```

---

## 5. FEATURE (Özellik) API

### 5.1 Tüm Özellikleri Listele
```http
GET /api/features
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "documentId": "feat001",
      "name": "Su Geçirmez",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "publishedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "documentId": "feat002",
      "name": "UV Dayanıklı"
    },
    {
      "id": 3,
      "documentId": "feat003",
      "name": "Katlanabilir"
    },
    {
      "id": 4,
      "documentId": "feat004",
      "name": "Ayarlanabilir"
    },
    {
      "id": 5,
      "documentId": "feat005",
      "name": "Kolay Temizlenebilir"
    },
    {
      "id": 6,
      "documentId": "feat006",
      "name": "Paslanmaz"
    }
  ],
  "meta": { ... }
}
```

### 5.2 Tek Özellik Getir
```http
GET /api/features/:documentId
```

### 5.3 Yeni Özellik Oluştur (Admin)
```http
POST /api/features
Content-Type: application/json
Authorization: Bearer <admin-jwt-token>
```

```json
{
  "data": {
    "name": "Rüzgar Dayanıklı"
  }
}
```

### 5.4 Özellik Güncelle (Admin)
```http
PUT /api/features/:documentId
Content-Type: application/json
Authorization: Bearer <admin-jwt-token>
```

```json
{
  "data": {
    "name": "Yüksek Rüzgar Dayanıklı"
  }
}
```

### 5.5 Özellik Sil (Admin)
```http
DELETE /api/features/:documentId
Authorization: Bearer <admin-jwt-token>
```

---

## 6. ORDER (Sipariş) API

### 6.1 Tüm Siparişleri Listele (Admin)
```http
GET /api/orders?sort=createdAt:desc
Authorization: Bearer <admin-jwt-token>
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "documentId": "order001",
      "orderNumber": "GH-20240125-001",
      "customerName": "Ahmet Yılmaz",
      "customerEmail": "ahmet@example.com",
      "customerPhone": "+905551234567",
      "customerAddress": "Atatürk Cad. No:123 Daire:5",
      "customerCity": "İstanbul",
      "items": [
        {
          "productId": "prod001",
          "name": "Premium Bahçe Sandalyesi",
          "quantity": 4,
          "price": 2499.99,
          "total": 9999.96
        },
        {
          "productId": "prod002",
          "name": "6 Kişilik Bahçe Masası",
          "quantity": 1,
          "price": 4999.99,
          "total": 4999.99
        }
      ],
      "subtotal": 14999.95,
      "shipping": 0,
      "total": 14999.95,
      "paymentMethod": "credit_card",
      "paymentStatus": "paid",
      "orderStatus": "processing",
      "iyzicoToken": "iyzico_token_abc123",
      "notes": "Lütfen kapıya bırakın",
      "createdAt": "2024-01-25T14:30:00.000Z",
      "updatedAt": "2024-01-25T14:35:00.000Z",
      "publishedAt": "2024-01-25T14:30:00.000Z"
    }
  ],
  "meta": { ... }
}
```

### 6.2 Filtrelenmiş Sipariş Listesi (Admin)

**Ödeme Durumuna Göre:**
```http
GET /api/orders?filters[paymentStatus][$eq]=paid
GET /api/orders?filters[paymentStatus][$eq]=pending
GET /api/orders?filters[paymentStatus][$eq]=failed
```

**Sipariş Durumuna Göre:**
```http
GET /api/orders?filters[orderStatus][$eq]=pending
GET /api/orders?filters[orderStatus][$eq]=processing
GET /api/orders?filters[orderStatus][$eq]=shipped
GET /api/orders?filters[orderStatus][$eq]=delivered
GET /api/orders?filters[orderStatus][$eq]=cancelled
```

**Tarih Aralığına Göre:**
```http
GET /api/orders?filters[createdAt][$gte]=2024-01-01&filters[createdAt][$lte]=2024-01-31
```

**Müşteri Email'ine Göre:**
```http
GET /api/orders?filters[customerEmail][$eq]=ahmet@example.com
```

### 6.3 Tek Sipariş Getir (Admin)
```http
GET /api/orders/:documentId
Authorization: Bearer <admin-jwt-token>
```

### 6.4 Sipariş Numarası ile Getir (Admin)
```http
GET /api/orders?filters[orderNumber][$eq]=GH-20240125-001
Authorization: Bearer <admin-jwt-token>
```

### 6.5 Yeni Sipariş Oluştur

> Not: Siparişler genellikle Payment API üzerinden oluşturulur. Manuel oluşturma sadece admin için.

```http
POST /api/orders
Content-Type: application/json
Authorization: Bearer <admin-jwt-token>
```

```json
{
  "data": {
    "orderNumber": "GH-20240125-002",
    "customerName": "Mehmet Demir",
    "customerEmail": "mehmet@example.com",
    "customerPhone": "+905559876543",
    "customerAddress": "İnönü Cad. No:456 Kat:3",
    "customerCity": "Ankara",
    "items": [
      {
        "productId": "prod005",
        "name": "Bahçe Salıncağı",
        "quantity": 1,
        "price": 7999.99,
        "total": 7999.99
      }
    ],
    "subtotal": 7999.99,
    "shipping": 250.00,
    "total": 8249.99,
    "paymentMethod": "bank_transfer",
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "notes": "Hafta sonu teslimat"
  }
}
```

### 6.6 Sipariş Durumu Güncelle (Admin)
```http
PUT /api/orders/:documentId
Content-Type: application/json
Authorization: Bearer <admin-jwt-token>
```

**Sipariş Kargoya Verildi:**
```json
{
  "data": {
    "orderStatus": "shipped",
    "notes": "Kargo takip no: 123456789"
  }
}
```

**Sipariş Teslim Edildi:**
```json
{
  "data": {
    "orderStatus": "delivered"
  }
}
```

**Sipariş İptal:**
```json
{
  "data": {
    "orderStatus": "cancelled",
    "paymentStatus": "refunded",
    "notes": "Müşteri talebi ile iptal edildi"
  }
}
```

### 6.7 Sipariş Sil (Admin)
```http
DELETE /api/orders/:documentId
Authorization: Bearer <admin-jwt-token>
```

---

## 7. PAYMENT (Ödeme) API

### 7.1 Ödeme Başlat
```http
POST /api/payment/init
Content-Type: application/json
```

**Request Body:**
```json
{
  "items": [
    {
      "documentId": "prod001",
      "quantity": 2
    },
    {
      "documentId": "prod005",
      "quantity": 1
    }
  ],
  "customer": {
    "name": "Ayşe Kaya",
    "email": "ayse@example.com",
    "phone": "+905551112233",
    "address": "Cumhuriyet Mah. Bahçe Sok. No:12",
    "city": "İzmir"
  },
  "notes": "Zile basın, köpek havlar ama ısırmaz"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "checkoutFormContent": "<script src=\"https://www.iyzico.com/form.js\">...</script>",
  "conversationId": "conv_123456789",
  "orderNumber": "GH-20240125-003"
}
```

**Response (400 Bad Request - Stok Yetersiz):**
```json
{
  "error": {
    "message": "Yetersiz stok: Premium Bahçe Sandalyesi (Mevcut: 3, İstenen: 5)"
  }
}
```

**Response (400 Bad Request - Ürün Bulunamadı):**
```json
{
  "error": {
    "message": "Ürün bulunamadı: invalidDocId123"
  }
}
```

### 7.2 Ödeme Callback (iyzico tarafından çağrılır)
```http
POST /api/payment/callback
Content-Type: application/json
```

**Request Body (iyzico'dan gelen):**
```json
{
  "token": "iyzico_checkout_token_xyz789",
  "conversationId": "conv_123456789"
}
```

**Response (Başarılı):**
```json
{
  "success": true,
  "orderNumber": "GH-20240125-003",
  "message": "Ödeme başarıyla tamamlandı"
}
```

**Response (Başarısız):**
```json
{
  "success": false,
  "message": "Ödeme başarısız: Kart limiti yetersiz"
}
```

### 7.3 Sipariş Durumu Sorgula
```http
GET /api/payment/order/:orderNumber
```

**Örnek:**
```http
GET /api/payment/order/GH-20240125-003
```

**Response:**
```json
{
  "success": true,
  "order": {
    "orderNumber": "GH-20240125-003",
    "orderStatus": "processing",
    "paymentStatus": "paid",
    "total": 12999.97,
    "createdAt": "2024-01-25T15:00:00.000Z"
  }
}
```

**Response (Sipariş Bulunamadı):**
```json
{
  "success": false,
  "message": "Sipariş bulunamadı"
}
```

---

## 8. MEDIA (Dosya) API

### 8.1 Dosya Yükle
```http
POST /api/upload
Content-Type: multipart/form-data
Authorization: Bearer <admin-jwt-token>
```

**Form Data:**
```
files: [file1.jpg, file2.png]  (binary array)
```

**Response:**
```json
[
  {
    "id": 30,
    "documentId": "media030",
    "name": "file1.jpg",
    "alternativeText": null,
    "caption": null,
    "width": 1200,
    "height": 800,
    "formats": {
      "thumbnail": {
        "name": "thumbnail_file1.jpg",
        "hash": "thumbnail_file1_abc123",
        "ext": ".jpg",
        "mime": "image/jpeg",
        "width": 234,
        "height": 156,
        "size": 12.5,
        "url": "/uploads/thumbnail_file1_abc123.jpg"
      },
      "small": {
        "url": "/uploads/small_file1_abc123.jpg",
        "width": 500,
        "height": 333
      },
      "medium": {
        "url": "/uploads/medium_file1_abc123.jpg",
        "width": 750,
        "height": 500
      },
      "large": {
        "url": "/uploads/large_file1_abc123.jpg",
        "width": 1000,
        "height": 667
      }
    },
    "hash": "file1_abc123",
    "ext": ".jpg",
    "mime": "image/jpeg",
    "size": 245.67,
    "url": "/uploads/file1_abc123.jpg",
    "previewUrl": null,
    "provider": "local",
    "createdAt": "2024-01-25T16:00:00.000Z",
    "updatedAt": "2024-01-25T16:00:00.000Z"
  }
]
```

### 8.2 Dosyaları Listele
```http
GET /api/upload/files
Authorization: Bearer <admin-jwt-token>
```

### 8.3 Tek Dosya Getir
```http
GET /api/upload/files/:id
Authorization: Bearer <admin-jwt-token>
```

### 8.4 Dosya Sil
```http
DELETE /api/upload/files/:id
Authorization: Bearer <admin-jwt-token>
```

---

## 9. AUTHENTICATION (Kimlik Doğrulama)

### 9.1 Admin Login
```http
POST /admin/login
Content-Type: application/json
```

```json
{
  "email": "admin@gardenhaus.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@gardenhaus.com",
      "firstname": "Admin",
      "lastname": "User"
    }
  }
}
```

### 9.2 Token Kullanımı
Tüm admin endpoint'lerinde header'a ekleyin:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 10. PUBLISH (Yayınlama) İşlemleri

Strapi 5'te draft/publish özelliği olan content type'lar için:

### 10.1 Draft Oluştur
```http
POST /api/products
```
(publishedAt göndermezseniz draft olarak oluşur)

### 10.2 Yayınla
```http
POST /api/products/:documentId/actions/publish
Authorization: Bearer <admin-jwt-token>
```

### 10.3 Yayından Kaldır (Unpublish)
```http
POST /api/products/:documentId/actions/unpublish
Authorization: Bearer <admin-jwt-token>
```

---

## 11. ÖRNEK KULLANIM SENARYOLARI

### Senaryo 1: Ana Sayfa Yükleme
```javascript
// Slider ürünlerini getir
const sliderProducts = await fetch('/api/products?filters[showInSlider][$eq]=true&sort=sliderOrder:asc&populate=images,brand,category');

// Öne çıkan ürünleri getir
const featuredProducts = await fetch('/api/products?filters[isFeatured][$eq]=true&populate=images,brand&pagination[limit]=8');

// Tüm kategorileri getir
const categories = await fetch('/api/categories');

// Tüm markaları getir
const brands = await fetch('/api/brands?populate=logo');
```

### Senaryo 2: Kategori Sayfası
```javascript
// Kategorideki ürünleri getir
const products = await fetch('/api/products?filters[category][slug][$eq]=sandalyeler&populate=images,brand,colors&sort=price:asc&pagination[page]=1&pagination[pageSize]=12');

// Filtreleme seçenekleri için
const colors = await fetch('/api/colors');
const features = await fetch('/api/features');
const brands = await fetch('/api/brands');
```

### Senaryo 3: Ürün Detay Sayfası
```javascript
// Ürün detayını getir
const product = await fetch('/api/products?filters[slug][$eq]=premium-bahce-sandalyesi&populate=images,brand,category,colors,features');

// Benzer ürünleri getir (aynı kategori)
const similarProducts = await fetch('/api/products?filters[category][slug][$eq]=sandalyeler&filters[slug][$ne]=premium-bahce-sandalyesi&populate=images&pagination[limit]=4');
```

### Senaryo 4: Checkout İşlemi
```javascript
// 1. Ödeme başlat
const paymentInit = await fetch('/api/payment/init', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [
      { documentId: 'prod001', quantity: 2 },
      { documentId: 'prod005', quantity: 1 }
    ],
    customer: {
      name: 'Ahmet Yılmaz',
      email: 'ahmet@example.com',
      phone: '+905551234567',
      address: 'Atatürk Cad. No:123',
      city: 'İstanbul'
    }
  })
});

// 2. iyzico form'unu göster
document.getElementById('payment-container').innerHTML = paymentInit.checkoutFormContent;

// 3. Ödeme sonrası durumu kontrol et
const orderStatus = await fetch(`/api/payment/order/${paymentInit.orderNumber}`);
```

---

## 12. HATA KODLARI

| HTTP Kodu | Anlam | Açıklama |
|-----------|-------|----------|
| 200 | OK | İşlem başarılı |
| 201 | Created | Kayıt oluşturuldu |
| 400 | Bad Request | Geçersiz istek (eksik/hatalı veri) |
| 401 | Unauthorized | Kimlik doğrulama gerekli |
| 403 | Forbidden | Yetkisiz erişim |
| 404 | Not Found | Kayıt bulunamadı |
| 500 | Internal Server Error | Sunucu hatası |

**Örnek Hata Response:**
```json
{
  "data": null,
  "error": {
    "status": 400,
    "name": "ValidationError",
    "message": "Missing required fields",
    "details": {
      "errors": [
        {
          "path": ["name"],
          "message": "name is a required field"
        }
      ]
    }
  }
}
```

---

## 13. RATE LIMITING & BEST PRACTICES

1. **Pagination Kullanın:** Büyük listeler için her zaman pagination kullanın
2. **Populate Seçici Olun:** Sadece ihtiyacınız olan ilişkileri populate edin
3. **Cache:** Sık değişmeyen veriler için client-side cache kullanın
4. **Batch İşlemler:** Birden fazla kayıt için tek istek gönderin (varsa)
5. **Error Handling:** Tüm API çağrılarında hata yönetimi yapın

---

**Son Güncelleme:** 2024-01-25
**Strapi Sürümü:** 5.31.2
**API Sürümü:** v1
