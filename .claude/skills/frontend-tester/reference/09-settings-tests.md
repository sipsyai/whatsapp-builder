# WhatsApp Settings Sayfası Test Senaryoları

**URL:** http://localhost:5173/#settings
**Önkoşul:** Giriş yapılmış olmalı
**Öncelik:** P1 - Yüksek

---

## Test Senaryoları

### TEST-SETTINGS-001: Konfigürasyon Yükleme
**Açıklama:** Mevcut konfigürasyon yüklenmeli

**Adımlar:**
1. `browser_navigate` → http://localhost:5173/#settings
2. `browser_wait_for` → Form yüklenmesi
3. `browser_snapshot` → Form alanlarını kontrol et

**Beklenen Sonuç:**
- API Credentials bölümü görünmeli
- Webhook Configuration bölümü görünmeli
- Mevcut değerler form'da görünmeli (eğer varsa)

---

### TEST-SETTINGS-002: API Credentials Kaydetme
**Açıklama:** API credential'ları kaydedilebilmeli

**Adımlar:**
1. `browser_snapshot` → API Credentials formunu bul
2. `browser_type` → Phone Number ID gir
3. `browser_type` → Business Account ID gir
4. `browser_type` → Access Token gir
5. `browser_type` → App Secret gir
6. `browser_click` → Save butonuna tıkla
7. `browser_wait_for` → Toast notification
8. `browser_snapshot` → Success mesajı

**Beklenen Sonuç:**
- Değerler kaydedilmeli
- Success toast gösterilmeli

---

### TEST-SETTINGS-003: Bağlantı Testi (Başarılı)
**Açıklama:** WhatsApp API bağlantısı test edilebilmeli

**Adımlar:**
1. Valid credential'lar kaydet
2. `browser_snapshot` → Test Connection butonunu bul
3. `browser_click` → Test Connection
4. `browser_wait_for` → Test sonucu
5. `browser_snapshot` → Başarı mesajı

**Beklenen Sonuç:**
- Loading indicator gösterilmeli
- Başarılı bağlantı mesajı gösterilmeli

---

### TEST-SETTINGS-004: Bağlantı Testi (Başarısız)
**Açıklama:** Invalid credential'lar için hata gösterilmeli

**Adımlar:**
1. Invalid credential'lar gir
2. Save et
3. `browser_click` → Test Connection
4. `browser_wait_for` → Test sonucu
5. `browser_snapshot` → Hata mesajı

**Beklenen Sonuç:**
- Hata mesajı gösterilmeli
- API response detayları (opsiyonel)

---

### TEST-SETTINGS-005: Webhook URL Gösterimi
**Açıklama:** Webhook URL doğru gösterilmeli

**Adımlar:**
1. `browser_snapshot` → Webhook Configuration bölümünü bul
2. Webhook URL alanını kontrol et

**Beklenen Sonuç:**
- Webhook URL görünmeli
- URL backend URL'ini içermeli
- Copy button görünmeli

---

### TEST-SETTINGS-006: URL Kopyalama (Webhook)
**Açıklama:** Webhook URL kopyalanabilmeli

**Adımlar:**
1. `browser_snapshot` → Copy butonunu bul
2. `browser_click` → Webhook URL copy button
3. `browser_wait_for` → Toast notification
4. `browser_snapshot` → "Copied" mesajı

**Beklenen Sonuç:**
- URL clipboard'a kopyalanmalı
- Success toast gösterilmeli

---

### TEST-SETTINGS-007: URL Kopyalama (Flow Endpoint)
**Açıklama:** Flow Endpoint URL kopyalanabilmeli

**Adımlar:**
1. `browser_snapshot` → Flow Endpoint URL bölümünü bul
2. `browser_click` → Copy button
3. `browser_wait_for` → Toast notification

**Beklenen Sonuç:**
- URL clipboard'a kopyalanmalı
- Success toast gösterilmeli

---

### TEST-SETTINGS-008: Loading State
**Açıklama:** Kaydetme sırasında loading gösterilmeli

**Adımlar:**
1. Bir değeri değiştir
2. Save butonuna tıkla
3. `browser_snapshot` → Hemen (loading state)

**Beklenen Sonuç:**
- Save butonu disabled olmalı
- Loading indicator görünmeli

---

### TEST-SETTINGS-009: Advanced Settings
**Açıklama:** Advanced settings erişilebilir olmalı

**Adımlar:**
1. `browser_snapshot` → Advanced Settings bölümünü bul
2. API Version alanını kontrol et

**Beklenen Sonuç:**
- API Version dropdown görünmeli
- Mevcut versiyon seçili olmalı

---

### TEST-SETTINGS-010: Form Validasyonu
**Açıklama:** Required alanlar validate edilmeli

**Adımlar:**
1. Tüm alanları temizle
2. Save butonuna tıkla
3. `browser_snapshot` → Validation hataları

**Beklenen Sonuç:**
- Required field hataları gösterilmeli
- Form submit edilmemeli

---

## Sayfa Elementleri

```
- API Credentials Section:
  - Phone Number ID input
  - Business Account ID input
  - Access Token input (password type)
  - App Secret input (password type)

- Webhook Configuration Section:
  - Backend URL (read-only, info)
  - Webhook URL (read-only + copy button)
  - Flow Endpoint URL (read-only + copy button)
  - Verify Token (read-only + copy button)

- Advanced Settings Section:
  - API Version dropdown

- Action Buttons:
  - Save Configuration button
  - Test Connection button

- Toast Notifications
```

---

## Form Alanları

| Alan | Tip | Required | Açıklama |
|------|-----|----------|----------|
| Phone Number ID | text | ✓ | WhatsApp Phone Number ID |
| Business Account ID | text | ✓ | WhatsApp Business Account ID |
| Access Token | password | ✓ | Meta Access Token |
| App Secret | password | ✓ | Meta App Secret |
| API Version | dropdown | ✓ | Graph API versiyonu (v18.0, v19.0, etc.) |

---

## Test Verileri

```json
{
  "validConfig": {
    "phoneNumberId": "123456789012345",
    "businessAccountId": "987654321098765",
    "accessToken": "EAAxxxxx...",
    "appSecret": "abc123...",
    "apiVersion": "v21.0"
  },
  "invalidConfig": {
    "phoneNumberId": "",
    "accessToken": "invalid_token"
  }
}
```

---

## Güvenlik Notları

- Access Token ve App Secret password tipinde input olmalı
- Değerler maskeli gösterilmeli
- Kopyalama işlemi için confirmation olabilir
