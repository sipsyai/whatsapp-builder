# Ortak Test Senaryoları

Bu dosya sidebar, navigation ve tüm sayfalarda ortak olan test senaryolarını içerir.

---

## Sidebar Navigation Testleri

**URL:** Tüm sayfalar (giriş yapılmış)
**Öncelik:** P3 - Düşük

### TEST-SIDEBAR-001: Sidebar Görünürlüğü
**Açıklama:** Sidebar tüm sayfalarda görünmeli

**Adımlar:**
1. Herhangi bir sayfaya git
2. `browser_snapshot` → Sidebar'ı kontrol et

**Beklenen Sonuç:**
- Sidebar sol tarafta görünmeli
- Logo görünmeli
- Menü itemları görünmeli

---

### TEST-SIDEBAR-002: Menü Itemları Görünürlüğü
**Açıklama:** Tüm menü itemları görünmeli

**Adımlar:**
1. `browser_snapshot` → Sidebar menü

**Beklenen Sonuç:**
Tüm menü itemları görünmeli:
- My Chatbots
- Builder
- Sessions
- Chat
- Users
- WhatsApp Flows
- Data Sources
- Settings

---

### TEST-SIDEBAR-003: Active State
**Açıklama:** Aktif sayfa menüde işaretlenmeli

**Adımlar:**
Her sayfa için:
1. `browser_navigate` → Sayfaya git
2. `browser_snapshot` → İlgili menü itemını kontrol et

**Beklenen Sonuç:**
- Aktif sayfa farklı style'da (highlight, background, vs.)
- Diğer itemlar normal style'da

---

### TEST-SIDEBAR-004: Navigation Çalışması
**Açıklama:** Menü itemlarına tıklayınca ilgili sayfaya gitmeli

**Adımlar:**
Her menü item için:
1. `browser_click` → Menü item'a tıkla
2. `browser_wait_for` → Sayfa yüklenmesi
3. `browser_snapshot` → Doğru sayfa yüklendi

**Beklenen Sonuçlar:**
| Menü Item | URL |
|-----------|-----|
| My Chatbots | #chatbots |
| Builder | #builder |
| Sessions | #sessions |
| Chat | #chat |
| Users | #users |
| WhatsApp Flows | #flows |
| Data Sources | #data-sources |
| Settings | #settings |

---

## Landing Page Testleri

**URL:** http://localhost:5173/#landing
**Öncelik:** P3 - Düşük

### TEST-LANDING-001: Sayfa Yükleme
**Açıklama:** Landing sayfası yüklenmeli

**Adımlar:**
1. `browser_navigate` → http://localhost:5173/#landing
2. `browser_wait_for` → Sayfa yüklenmesi
3. `browser_snapshot` → Sayfa yapısı

**Beklenen Sonuç:**
- Welcome/hero section görünmeli
- Create Bot butonu görünmeli

---

### TEST-LANDING-002: Create Bot Modal
**Açıklama:** Create bot modal açılmalı

**Adımlar:**
1. `browser_snapshot` → Create Bot butonunu bul
2. `browser_click` → Create Bot
3. `browser_wait_for` → Modal açılması
4. `browser_snapshot` → Modal içeriği

**Beklenen Sonuç:**
- Modal açılmalı
- Chatbot name input görünmeli
- Create/Cancel butonları görünmeli

---

### TEST-LANDING-003: Builder'a Geçiş
**Açıklama:** Chatbot oluşturulunca builder'a gitmeli

**Adımlar:**
1. Create Bot modal'ı aç
2. `browser_type` → Chatbot name gir
3. `browser_click` → Create
4. `browser_wait_for` → Builder sayfası
5. `browser_snapshot` → Builder yüklendi

**Beklenen Sonuç:**
- Builder sayfasına yönlendirilmeli
- Yeni chatbot ile açılmalı

---

## Logout Testi

### TEST-AUTH-LOGOUT: Çıkış Yapma
**Açıklama:** Kullanıcı çıkış yapabilmeli

**Adımlar:**
1. `browser_snapshot` → User menu veya logout butonunu bul
2. `browser_click` → Logout
3. `browser_wait_for` → Login sayfası
4. `browser_snapshot` → Login form

**Beklenen Sonuç:**
- Login sayfasına yönlendirilmeli
- Token localStorage'dan silinmeli
- Protected sayfalara erişilememeli

---

## Protected Routes Testi

### TEST-AUTH-PROTECTED: Korumalı Sayfa Erişimi
**Açıklama:** Giriş yapmadan korumalı sayfalara erişilememeli

**Adımlar:**
1. Logout yap (veya temiz browser)
2. `browser_navigate` → http://localhost:5173/#chatbots
3. `browser_snapshot` → Login sayfası

**Beklenen Sonuç:**
- Login sayfasına yönlendirilmeli
- Korumalı sayfa görünmemeli

---

## Toast Notification Testleri

### TEST-TOAST-SUCCESS: Başarı Toast
**Açıklama:** Başarılı işlemlerde success toast gösterilmeli

**Adımlar:**
1. Başarılı bir işlem yap (örn: save)
2. `browser_snapshot` → Toast notification

**Beklenen Sonuç:**
- Yeşil success toast görünmeli
- ~3 saniye sonra kaybolmalı

---

### TEST-TOAST-ERROR: Hata Toast
**Açıklama:** Hatalı işlemlerde error toast gösterilmeli

**Adımlar:**
1. Hatalı bir işlem yap
2. `browser_snapshot` → Toast notification

**Beklenen Sonuç:**
- Kırmızı error toast görünmeli
- Hata mesajı açıklayıcı olmalı

---

## Loading State Testleri

### TEST-LOADING-SPINNER: Loading Spinner
**Açıklama:** Yükleme sırasında spinner gösterilmeli

**Adımlar:**
1. Veri yükleyen bir sayfaya git
2. `browser_snapshot` → Hemen (loading state)

**Beklenen Sonuç:**
- Loading spinner görünmeli
- Veya skeleton loading görünmeli

---

## Responsive Testleri

### TEST-RESPONSIVE-MOBILE: Mobil Görünüm
**Açıklama:** Mobil boyutta düzgün görünmeli

**Adımlar:**
1. `browser_resize` → width: 375, height: 667 (iPhone SE)
2. `browser_snapshot` → Sayfa yapısı
3. Temel işlevleri test et

**Beklenen Sonuç:**
- Sayfa responsive olmalı
- Hamburger menü görünmeli (sidebar yerine)
- İçerik okunabilir olmalı

---

### TEST-RESPONSIVE-TABLET: Tablet Görünüm
**Açıklama:** Tablet boyutta düzgün görünmeli

**Adımlar:**
1. `browser_resize` → width: 768, height: 1024 (iPad)
2. `browser_snapshot` → Sayfa yapısı

**Beklenen Sonuç:**
- Sayfa responsive olmalı
- Sidebar görünebilir veya collapse olmalı

---

## Error Handling Testleri

### TEST-ERROR-API: API Hatası
**Açıklama:** API hatası durumunda uygun mesaj gösterilmeli

**Adımlar:**
1. Network'ü kes veya backend'i durdur
2. Veri yükleyen bir sayfaya git
3. `browser_snapshot` → Hata durumu

**Beklenen Sonuç:**
- Error message görünmeli
- Retry butonu olabilir

---

### TEST-ERROR-404: Geçersiz Route
**Açıklama:** Geçersiz route'ta uygun davranış

**Adımlar:**
1. `browser_navigate` → http://localhost:5173/#invalid-route
2. `browser_snapshot` → Sayfa durumu

**Beklenen Sonuç:**
- 404 sayfası veya default sayfaya yönlendirme

---

## Keyboard Navigation

### TEST-KEYBOARD-TAB: Tab Navigation
**Açıklama:** Tab tuşu ile elementler arası geçiş

**Adımlar:**
1. Bir form sayfasına git
2. `browser_press_key` → Tab (birkaç kez)
3. `browser_snapshot` → Focus durumu

**Beklenen Sonuç:**
- Tab ile inputlar arası geçiş çalışmalı
- Focus görünür olmalı

---

## Sidebar Elementleri

```
- Logo
- Menu Items:
  - My Chatbots (smart_toy icon)
  - Builder (account_tree icon)
  - Sessions (history icon)
  - Chat (chat icon)
  - Users (group icon)
  - WhatsApp Flows (check_box icon)
  - Data Sources (database icon)
  - Settings (settings icon)
- User info (optional)
- Logout button (optional)
```

---

## URL Mapping

| Hash | Sayfa |
|------|-------|
| (empty) / #chatbots | My Chatbots |
| #builder | ChatBot Builder |
| #sessions | Sessions List |
| #sessions/:id | Session Detail |
| #chat | Chat |
| #users | Users |
| #flows | WhatsApp Flows |
| #flowBuilder | Flow Builder |
| #playground | Flow Playground |
| #data-sources | Data Sources |
| #settings | WhatsApp Settings |
| #landing | Landing Page |
