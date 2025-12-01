# Login Sayfası Test Senaryoları

**URL:** http://localhost:5173
**Önkoşul:** Çıkış yapılmış olmalı (localStorage temiz)
**Öncelik:** P0 - Kritik

---

## Test Senaryoları

### TEST-LOGIN-001: Başarılı Giriş
**Açıklama:** Doğru email ve şifre ile giriş yapılabilmeli

**Adımlar:**
1. `browser_navigate` → http://localhost:5173
2. `browser_snapshot` → Email ve password inputlarını bul
3. `browser_type` → Email alanına "test@example.com" yaz
4. `browser_type` → Password alanına "password123" yaz
5. `browser_click` → Login butonuna tıkla
6. `browser_wait_for` → "My Chatbots" veya dashboard elementi
7. `browser_snapshot` → Dashboard yüklendiğini doğrula

**Beklenen Sonuç:**
- Dashboard sayfasına yönlendirilmeli
- localStorage'da token olmalı
- URL #chatbots olmalı

**Doğrulama:**
```javascript
localStorage.getItem('token') !== null
window.location.hash === '#chatbots' || window.location.hash === ''
```

---

### TEST-LOGIN-002: Başarısız Giriş (Yanlış Şifre)
**Açıklama:** Yanlış şifre ile giriş yapılamamalı

**Adımlar:**
1. `browser_navigate` → http://localhost:5173
2. `browser_snapshot` → Form elementlerini bul
3. `browser_type` → Email alanına "test@example.com" yaz
4. `browser_type` → Password alanına "wrongpassword" yaz
5. `browser_click` → Login butonuna tıkla
6. `browser_wait_for` → Error mesajı bekle
7. `browser_snapshot` → Hata mesajını doğrula

**Beklenen Sonuç:**
- Login sayfasında kalmalı
- Error mesajı görünmeli
- localStorage'da token olmamalı

---

### TEST-LOGIN-003: Boş Form Submit Engelleme
**Açıklama:** Boş form submit edilememeli

**Adımlar:**
1. `browser_navigate` → http://localhost:5173
2. `browser_snapshot` → Login butonunu bul
3. `browser_click` → Login butonuna tıkla (formları boş bırak)
4. `browser_snapshot` → Validation hatalarını kontrol et

**Beklenen Sonuç:**
- Form submit edilmemeli
- Validation hataları görünmeli
- "required" uyarıları görünmeli

---

### TEST-LOGIN-004: Email Validasyonu
**Açıklama:** Geçersiz email formatı kabul edilmemeli

**Adımlar:**
1. `browser_navigate` → http://localhost:5173
2. `browser_snapshot` → Email inputunu bul
3. `browser_type` → Email alanına "invalid-email" yaz
4. `browser_type` → Password alanına "password123" yaz
5. `browser_click` → Login butonuna tıkla
6. `browser_snapshot` → Validation hatasını kontrol et

**Beklenen Sonuç:**
- Email formatı hatası görünmeli
- Form submit edilmemeli

---

### TEST-LOGIN-005: Loading State
**Açıklama:** Login işlemi sırasında loading gösterilmeli

**Adımlar:**
1. `browser_navigate` → http://localhost:5173
2. `browser_snapshot` → Form elementlerini bul
3. `browser_type` → Email alanına "test@example.com" yaz
4. `browser_type` → Password alanına "password123" yaz
5. `browser_click` → Login butonuna tıkla
6. `browser_snapshot` → Hemen snapshot al (loading state)

**Beklenen Sonuç:**
- Login butonu disabled olmalı
- Loading spinner veya "Loading..." text görünmeli

---

### TEST-LOGIN-006: Token Persistence
**Açıklama:** Token localStorage'a kaydedilmeli

**Adımlar:**
1. Başarılı login yap (TEST-LOGIN-001)
2. `browser_evaluate` → `localStorage.getItem('token')`
3. Token değerini kontrol et

**Beklenen Sonuç:**
- Token null olmamalı
- Token geçerli JWT formatında olmalı

---

### TEST-LOGIN-007: Redirect After Login
**Açıklama:** Login sonrası doğru sayfaya yönlendirilmeli

**Adımlar:**
1. `browser_navigate` → http://localhost:5173
2. Başarılı login yap
3. `browser_snapshot` → Sayfa yapısını kontrol et

**Beklenen Sonuç:**
- My Chatbots sayfası yüklenmeli
- Sidebar görünmeli
- User bilgisi görünmeli

---

## Test Verileri

```json
{
  "validUser": {
    "email": "test@example.com",
    "password": "password123"
  },
  "invalidUser": {
    "email": "test@example.com",
    "password": "wrongpassword"
  },
  "invalidEmail": {
    "email": "not-an-email",
    "password": "password123"
  }
}
```

---

## Cleanup

Test sonrası yapılması gerekenler:
1. Logout yap (eğer login başarılı olduysa)
2. localStorage temizle
3. Cookies temizle (varsa)

```javascript
// Cleanup script
localStorage.clear();
sessionStorage.clear();
```
