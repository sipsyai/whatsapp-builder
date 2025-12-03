# REST API Node - Postman Benzeri Özellikler

## Genel Bakış

REST API node, chatbot flow'larında harici API'lerle iletişim kurmak için kullanılır. Bu güncelleme ile Postman benzeri gelişmiş özellikler eklendi.

## Yeni Özellikler

### 1. HTTP Methods
- **GET** - Veri çekme (yeşil)
- **POST** - Veri oluşturma (mavi)
- **PUT** - Veri güncelleme (turuncu)
- **PATCH** - Kısmi güncelleme (sarı) - **YENİ**
- **DELETE** - Veri silme (kırmızı)

### 2. Content-Type Desteği
POST, PUT, PATCH metodları için:
- `application/json` (varsayılan)
- `application/x-www-form-urlencoded`
- `multipart/form-data`

### 3. Authentication Tab
**No Auth** - Authentication yok

**Bearer Token**
- Token değeri `{{variable}}` destekler
- Otomatik `Authorization: Bearer <token>` header'ı

**Basic Auth**
- Username/Password
- Backend'de Base64 encoding yapılır
- Otomatik `Authorization: Basic <base64>` header'ı

**API Key**
- Key name ve value
- Header veya Query parameter olarak eklenebilir

### 4. Query Parameters Tab
- URL'den ayrı key-value yönetimi
- Real-time URL preview
- `{{variable}}` desteği

### 5. Test Tab Zenginleştirmeleri
- Status code badge (renkli)
- Response time (ms)
- Response body (JSON formatted)
- Response headers görüntüleme
- Copy to clipboard

## Dosya Yapısı

### Backend
```
backend/src/modules/chatbots/
├── dto/
│   ├── node-data.dto.ts         # Auth alanları eklendi
│   └── test-rest-api.dto.ts     # PATCH, contentType, filter eklendi
├── services/
│   ├── rest-api-executor.service.ts    # Auth ve query params desteği
│   └── chatbot-execution.service.ts    # Yeni alanlar okunuyor
└── chatbots.controller.ts       # Test endpoint güncellendi
```

### Frontend
```
frontend/src/
├── features/builder/components/
│   └── ConfigRestApi.tsx        # 6 tab: Request, Auth, Params, Headers, Response, Test
├── features/nodes/RestApiNode/
│   └── RestApiNode.tsx          # PATCH rengi eklendi
└── shared/types/
    └── index.ts                 # Auth ve query params tipleri
```

## API Endpoint'leri

### Test REST API
```
POST /api/chatbots/test-rest-api
Body: {
  method: string,
  url: string,
  headers?: Record<string, string>,
  body?: string,
  contentType?: string,
  filterField?: string,
  filterValue?: string,
  testVariables?: Record<string, any>,
  responsePath?: string,
  timeout?: number
}
```

## Node Data Alanları

```typescript
// Request
apiUrl: string
apiMethod: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
apiBody: string
apiTimeout: number
apiContentType: 'application/json' | 'multipart/form-data' | 'application/x-www-form-urlencoded'

// Auth
apiAuthType: 'none' | 'bearer' | 'basic' | 'api_key'
apiAuthToken: string           // Bearer token
apiAuthUsername: string        // Basic auth
apiAuthPassword: string        // Basic auth
apiAuthKeyName: string         // API Key header name
apiAuthKeyValue: string        // API Key value
apiAuthKeyLocation: 'header' | 'query'

// Query Params
apiQueryParams: Record<string, string>

// Headers
apiHeaders: Record<string, string>

// Response (Auto-Generated)
apiResponsePath: string        // JSON path extraction (optional)
// NOT: apiOutputVariable ve apiErrorVariable artik DEPRECATED
// Cikis degiskenleri otomatik olusturulur: rest_api_N.data, rest_api_N.error, rest_api_N.status
```

### Otomatik Degisken Adlandirma (YENİ)

REST API node'unun cikis degiskenleri artik otomatik olarak olusturulur:

| Cikis | Format | Aciklama |
|-------|--------|----------|
| `rest_api_N.data` | object | API yanit verisi (JSON path uygulandiktan sonra) |
| `rest_api_N.error` | string | Hata mesaji (basarisiz durumda) |
| `rest_api_N.status` | number | HTTP durum kodu |

`N`, flow'daki bu REST API node'unun sirasi (topological sort ile belirlenir).

**Ornek:** Flow'daki 2. REST API node'u icin:
- `rest_api_2.data` - Yanit verisi
- `rest_api_2.error` - Hata mesaji
- `rest_api_2.status` - HTTP durum kodu

## Kullanım Örnekleri

### Bearer Token ile API Çağrısı
1. Auth tab'ında "Bearer Token" seç
2. Token alanına `{{auth_token}}` veya doğrudan token değeri gir
3. Request tab'ında URL'i ayarla
4. Test tab'ında "Run Test" ile dene

### Form-Data Gönderimi
1. Request tab'ında POST veya PUT seç
2. Content-Type olarak "multipart/form-data" seç
3. Body'ye JSON formatında key-value pairs gir: `{"name": "value"}`
4. Backend otomatik form-data'ya çevirir

### Query Parameters
1. Params tab'ında parametreleri ekle
2. URL preview'da birleşik URL'i gör
3. `{{variable}}` ile dinamik değerler kullan

### API Key ile Query Parameter
1. Auth tab'ında "API Key" seç
2. Key name olarak örn: `api_key` gir
3. Add to olarak "Query Params" seç
4. URL'e otomatik eklenir: `?api_key=value`

### Basic Auth ile POST
1. Auth tab'ında "Basic Auth" seç
2. Username ve Password gir
3. Request tab'ında POST seç, Content-Type: JSON
4. Body'ye JSON gir: `{"data": "value"}`
5. Backend Base64 encoding yapar

---

## Test Tab Kullanımı

### Status Badge Renkleri
| Status Code | Renk | Anlam |
|-------------|------|-------|
| 2xx | Yeşil | Başarılı |
| 3xx | Sarı | Yönlendirme |
| 4xx | Kırmızı | İstemci Hatası |
| 5xx | Kırmızı | Sunucu Hatası |

### Response Headers
- Headers sekmesine geçerek sunucu header'larını görebilirsiniz
- `content-type`, `x-request-id` gibi debug bilgileri içerir
- Rate limit header'larını (`x-ratelimit-*`) kontrol edebilirsiniz

### Copy Özelliği
- Response body'yi panoya kopyalar
- JSON formatında kopyalanır
- Başka araçlarda (Postman, IDE) test edebilirsiniz

---

## İlgili Dosyalar

| Kategori | Dosya | Açıklama |
|----------|-------|----------|
| Frontend Config | `/frontend/src/features/builder/components/ConfigRestApi.tsx` | 6 tab'lı yapılandırma modalı |
| Frontend Node | `/frontend/src/features/nodes/RestApiNode/RestApiNode.tsx` | Görsel node bileşeni |
| Frontend Types | `/frontend/src/shared/types/index.ts` | NodeData interface |
| Backend Service | `/backend/src/modules/chatbots/services/rest-api-executor.service.ts` | HTTP istemci servisi |
| Backend DTO | `/backend/src/modules/chatbots/dto/node-data.dto.ts` | Node veri yapısı |
| Test DTO | `/backend/src/modules/chatbots/dto/test-rest-api.dto.ts` | Test endpoint DTO |

---

## Versiyon Bilgisi

- **Eklendi**: v2.0.0 (REST API Node)
- **Güncellendi**: v2.1.0 (Postman benzeri özellikler)
- **Güncellendi**: v2.2.0 (Otomatik degisken adlandirma)
- **Son Güncelleme**: 2025-12-03

---

**Ayrıca Bakın**:
- [08-variable-system.md](./08-variable-system.md) - Otomatik degisken sistemi dokümantasyonu
- [13-rest-api-node-feature.md](./13-rest-api-node-feature.md) - Detaylı REST API Node dokümantasyonu
- [chatbot-flow-development/07-rest-api-integration.md](../../chatbot-flow-development/reference/07-rest-api-integration.md) - Chatbot entegrasyon rehberi
