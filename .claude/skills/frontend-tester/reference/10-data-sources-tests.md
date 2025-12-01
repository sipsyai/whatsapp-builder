# Data Sources Sayfası Test Senaryoları

**URL:** http://localhost:5173/#data-sources
**Önkoşul:** Giriş yapılmış olmalı
**Öncelik:** P1 - Yüksek

---

## Sayfa Yapısı

Data Sources sayfası 2 panel layout kullanır:
- **Sol Panel:** Data Source listesi
- **Sağ Panel:** Seçili data source'un connection'ları

---

## Test Senaryoları

### TEST-DATASOURCES-001: Liste Yükleme
**Açıklama:** Data source listesi yüklenmeli

**Adımlar:**
1. `browser_navigate` → http://localhost:5173/#data-sources
2. `browser_wait_for` → Liste veya empty state
3. `browser_snapshot` → Liste yapısını kontrol et

**Beklenen Sonuç:**
- Data source kartları sol panelde görünmeli
- Her kart: name, type, base URL göstermeli
- Add Data Source butonu görünmeli

---

### TEST-DATASOURCES-002: Data Source Ekleme
**Açıklama:** Yeni data source eklenebilmeli

**Adımlar:**
1. `browser_snapshot` → Add Data Source butonunu bul
2. `browser_click` → Add Data Source
3. `browser_wait_for` → Modal açılması
4. `browser_snapshot` → Modal form
5. `browser_type` → Name gir
6. `browser_type` → Base URL gir
7. Auth Type seç
8. Auth bilgilerini gir (type'a göre)
9. `browser_click` → Create/Save
10. `browser_wait_for` → Toast notification
11. `browser_snapshot` → Yeni data source listede

**Beklenen Sonuç:**
- Modal açılmalı
- Data source oluşturulmalı
- Liste güncellenmeli

---

### TEST-DATASOURCES-003: Form Validasyonu
**Açıklama:** Form validasyonu çalışmalı

**Adımlar:**
1. Add Data Source modal'ı aç
2. Boş form submit et
3. `browser_snapshot` → Validation hataları

**Beklenen Sonuç:**
- Required field hataları görünmeli
- Form submit edilmemeli

---

### TEST-DATASOURCES-004: URL Validasyonu
**Açıklama:** Invalid URL kabul edilmemeli

**Adımlar:**
1. Add modal'ı aç
2. `browser_type` → Invalid URL (örn: "not-a-url")
3. Diğer alanları doldur
4. Submit et
5. `browser_snapshot` → URL hatası

**Beklenen Sonuç:**
- URL format hatası gösterilmeli

---

### TEST-DATASOURCES-005: Auth Type Değişikliği
**Açıklama:** Auth type'a göre form dinamik değişmeli

**Adımlar:**
1. Add modal'ı aç
2. `browser_snapshot` → Auth Type dropdown
3. Her auth type için:
   - `browser_click` → Auth Type seç
   - `browser_snapshot` → İlgili alanları kontrol et

**Beklenen Sonuçlar:**
- **None:** Ek alan yok
- **Bearer Token:** Token input görünmeli
- **API Key:** Key name ve value inputları görünmeli
- **Basic Auth:** Username ve password inputları görünmeli

---

### TEST-DATASOURCES-006: Data Source Düzenleme
**Açıklama:** Mevcut data source düzenlenebilmeli

**Adımlar:**
1. Bir data source kartındaki edit butonuna tıkla
2. `browser_wait_for` → Edit modal
3. `browser_snapshot` → Mevcut değerler
4. Bir değeri değiştir
5. `browser_click` → Save
6. `browser_wait_for` → Toast notification
7. `browser_snapshot` → Güncellenen değer

**Beklenen Sonuç:**
- Modal mevcut değerlerle açılmalı
- Değişiklikler kaydedilmeli
- Liste güncellenmeli

---

### TEST-DATASOURCES-007: Data Source Silme
**Açıklama:** Data source silinebilmeli

**Adımlar:**
1. Bir data source kartındaki delete butonuna tıkla
2. `browser_wait_for` → Confirm dialog
3. `browser_click` → Confirm
4. `browser_wait_for` → Toast notification
5. `browser_snapshot` → Data source silindi

**Beklenen Sonuç:**
- Confirm dialog gösterilmeli
- Data source listeden kaldırılmalı
- Success toast gösterilmeli

---

### TEST-DATASOURCES-008: Connection Test
**Açıklama:** Data source bağlantısı test edilebilmeli

**Adımlar:**
1. Bir data source seç
2. `browser_snapshot` → Test Connection butonunu bul
3. `browser_click` → Test Connection
4. `browser_wait_for` → Test sonucu
5. `browser_snapshot` → Başarı/hata mesajı

**Beklenen Sonuç:**
- Loading indicator gösterilmeli
- Test sonucu gösterilmeli

---

### TEST-DATASOURCES-009: Data Source Seçme
**Açıklama:** Data source seçilebilmeli

**Adımlar:**
1. Bir data source kartına tıkla
2. `browser_snapshot` → Sağ panel güncellendi

**Beklenen Sonuç:**
- Kart seçili olarak işaretlenmeli
- Sağ panelde connection'lar görünmeli

---

### TEST-DATASOURCES-010: Connection Yönetimi
**Açıklama:** Data source connection'ları yönetilebilmeli

**Adımlar:**
1. Bir data source seç
2. `browser_snapshot` → Connection listesi (sağ panel)
3. Varsa connection detaylarını kontrol et

**Beklenen Sonuç:**
- Connection'lar listelenmeli
- Her connection için: name, endpoint, method görünmeli

---

### TEST-DATASOURCES-011: Empty State
**Açıklama:** Data source yoksa empty state gösterilmeli

**Adımlar:**
1. Tüm data source'ları sil (veya yoksa)
2. `browser_snapshot` → Empty state

**Beklenen Sonuç:**
- "No data sources" mesajı görünmeli
- Add Data Source butonu görünmeli

---

### TEST-DATASOURCES-012: Custom Endpoint Testing
**Açıklama:** Custom endpoint test edilebilmeli

**Adımlar:**
1. Bir data source seç
2. `browser_snapshot` → Test endpoint bölümünü bul
3. Endpoint path gir
4. Method seç (GET/POST/etc.)
5. `browser_click` → Test butonuna tıkla
6. `browser_wait_for` → Response
7. `browser_snapshot` → Response görüntüle

**Beklenen Sonuç:**
- Endpoint çağrısı yapılmalı
- Response JSON olarak gösterilmeli

---

## Sayfa Elementleri

```
- Left Panel: Data Source List
  - Add Data Source button
  - Data Source Cards:
    - Name
    - Type icon
    - Base URL
    - Actions (Edit, Delete, Test)

- Right Panel: Connection Details
  - Selected data source info
  - Connection list
  - Test Endpoint section:
    - Endpoint path input
    - Method dropdown
    - Headers (optional)
    - Body (optional)
    - Test button
    - Response viewer

- Modal: Add/Edit Data Source
  - Name input
  - Base URL input
  - Auth Type dropdown
  - Auth fields (dynamic)
  - Headers (key-value pairs)
  - Save/Cancel buttons

- Confirm Delete Dialog
- Toast Notifications
```

---

## Auth Types

| Type | Alanlar |
|------|---------|
| None | - |
| Bearer Token | Token |
| API Key | Key Name, Key Value, Location (header/query) |
| Basic Auth | Username, Password |

---

## Test Verileri

```json
{
  "newDataSource": {
    "name": "Test API",
    "baseUrl": "https://api.example.com",
    "authType": "bearer",
    "token": "test_token_123"
  },
  "apiKeyDataSource": {
    "name": "API Key Test",
    "baseUrl": "https://api.example.com",
    "authType": "apiKey",
    "keyName": "X-API-Key",
    "keyValue": "my_api_key",
    "keyLocation": "header"
  }
}
```
