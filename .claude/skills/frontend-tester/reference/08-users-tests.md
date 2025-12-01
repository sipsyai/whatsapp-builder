# Users Sayfası Test Senaryoları

**URL:** http://localhost:5173/#users
**Önkoşul:** Giriş yapılmış olmalı
**Öncelik:** P2 - Orta

---

## Test Senaryoları

### TEST-USERS-001: Liste Yükleme
**Açıklama:** Kullanıcı listesi yüklenmeli

**Adımlar:**
1. `browser_navigate` → http://localhost:5173/#users
2. `browser_wait_for` → Tablo veya liste
3. `browser_snapshot` → Liste yapısını kontrol et

**Beklenen Sonuç:**
- Kullanıcılar tablo/liste olarak görünmeli
- Her kullanıcı için: email, name, role görünmeli
- Add User butonu görünmeli

---

### TEST-USERS-002: Kullanıcı Ekleme
**Açıklama:** Yeni kullanıcı eklenebilmeli

**Adımlar:**
1. `browser_snapshot` → Add User butonunu bul
2. `browser_click` → Add User
3. `browser_wait_for` → Modal açılması
4. `browser_snapshot` → Modal form
5. `browser_type` → Name gir
6. `browser_type` → Email gir
7. `browser_type` → Password gir
8. Role seç (dropdown)
9. `browser_click` → Create/Save butonuna tıkla
10. `browser_wait_for` → Toast notification
11. `browser_snapshot` → Yeni kullanıcı listede

**Beklenen Sonuç:**
- Modal açılmalı
- Kullanıcı oluşturulmalı
- Liste güncellenmeli

---

### TEST-USERS-003: Form Validasyonu
**Açıklama:** Form validasyonu çalışmalı

**Adımlar:**
1. Add User modal'ı aç
2. Boş form submit et
3. `browser_snapshot` → Validation hataları

**Beklenen Sonuç:**
- Required field hataları görünmeli
- Form submit edilmemeli

---

### TEST-USERS-004: Email Validasyonu
**Açıklama:** Invalid email kabul edilmemeli

**Adımlar:**
1. Add User modal'ı aç
2. `browser_type` → Invalid email (örn: "notanemail")
3. Diğer alanları doldur
4. Submit et
5. `browser_snapshot` → Email hatası

**Beklenen Sonuç:**
- Email format hatası gösterilmeli

---

### TEST-USERS-005: Kullanıcı Düzenleme
**Açıklama:** Mevcut kullanıcı düzenlenebilmeli

**Adımlar:**
1. Bir kullanıcının edit butonuna tıkla
2. `browser_wait_for` → Edit modal
3. `browser_snapshot` → Mevcut değerler
4. Bir değeri değiştir (örn: name)
5. `browser_click` → Save
6. `browser_wait_for` → Toast notification
7. `browser_snapshot` → Güncellenen değer

**Beklenen Sonuç:**
- Modal mevcut değerlerle açılmalı
- Değişiklikler kaydedilmeli
- Liste güncellenmeli

---

### TEST-USERS-006: Kullanıcı Silme
**Açıklama:** Kullanıcı silinebilmeli

**Adımlar:**
1. Bir kullanıcının delete butonuna tıkla
2. `browser_wait_for` → Confirm dialog
3. `browser_snapshot` → Confirm dialog
4. `browser_click` → Confirm
5. `browser_wait_for` → Toast notification
6. `browser_snapshot` → Kullanıcı silindi

**Beklenen Sonuç:**
- Confirm dialog gösterilmeli
- Kullanıcı listeden kaldırılmalı
- Success toast gösterilmeli

---

### TEST-USERS-007: Kendi Hesabını Silme Engelleme
**Açıklama:** Kullanıcı kendi hesabını silememeyi

**Adımlar:**
1. Giriş yapan kullanıcının satırını bul
2. Delete butonunu kontrol et

**Beklenen Sonuç:**
- Delete butonu disabled veya gizli olmalı
- Veya tıklandığında uyarı gösterilmeli

---

### TEST-USERS-008: Empty State
**Açıklama:** Kullanıcı yoksa (sadece current user) uygun görünüm

**Adımlar:**
1. `browser_snapshot` → Durumu kontrol et

**Beklenen Sonuç:**
- En az giriş yapan kullanıcı görünmeli
- Add User butonu görünmeli

---

## Sayfa Elementleri

```
- Header:
  - Sayfa başlığı
  - Add User button
- Users Table/List:
  - Column: Name
  - Column: Email
  - Column: Role
  - Column: Created At
  - Column: Actions (Edit, Delete)
- Add/Edit User Modal:
  - Name input
  - Email input
  - Password input (create only)
  - Role dropdown
  - Submit/Cancel buttons
- Confirm Delete Dialog
- Toast Notifications
```

---

## User Rolleri

| Role | Açıklama |
|------|----------|
| admin | Tüm yetkiler |
| user | Standart kullanıcı |

---

## Test Verileri

```json
{
  "newUser": {
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "testpassword123",
    "role": "user"
  },
  "invalidEmail": {
    "name": "Test",
    "email": "invalid-email",
    "password": "password"
  }
}
```
