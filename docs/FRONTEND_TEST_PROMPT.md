# Frontend Test Prompt

Bu prompt, frontend testlerini Playwright MCP üzerinden sistematik şekilde yapmak için kullanılır.

---

## Kullanım

Frontend testi yapmak istediğinde şu formatı kullan:

```
Frontend testlerini çalıştır. @docs/FRONTEND_TEST_PROMPT.md
```

veya belirli sayfalar için:

```
[Sayfa adı] testlerini çalıştır. @docs/FRONTEND_TEST_PROMPT.md
```

---

## Test Süreci

### PHASE 1: Ortam Hazırlığı

1. **Backend Kontrolü** - Backend'in çalıştığından emin ol
2. **Frontend Kontrolü** - Frontend'in çalıştığından emin ol
3. **Test Kullanıcısı** - Test için gerekli kullanıcı bilgileri hazır olsun

```bash
# Production ortamı
curl https://whatsapp.sipsy.ai

# Test kullanıcısı
Email: admin@whatsapp-builder.local
Password: Admin123!
```

### PHASE 2: Test Çalıştırma

Playwright MCP araçlarını kullanarak testleri çalıştır:

1. `mcp__playwright__browser_navigate` - Sayfaya git
2. `mcp__playwright__browser_snapshot` - Sayfa yapısını al
3. `mcp__playwright__browser_click` - Tıklama yap
4. `mcp__playwright__browser_type` - Metin gir
5. `mcp__playwright__browser_wait_for` - Bekleme yap
6. `mcp__playwright__browser_take_screenshot` - Ekran görüntüsü al

### PHASE 3: Raporlama

Test sonuçlarını standart formatta raporla (aşağıdaki şablonu kullan).

---

## Test Edilecek Sayfalar

### 1. Login Sayfası
- **URL:** https://whatsapp.sipsy.ai
- **Önkoşul:** Çıkış yapılmış olmalı
- **Test Senaryoları:**
  - [ ] Başarılı giriş (doğru email/şifre)
  - [ ] Başarısız giriş (yanlış şifre)
  - [ ] Boş form submit engelleme
  - [ ] Loading state görüntüleme
  - [ ] Error mesajı görüntüleme
  - [ ] Token localStorage'a kayıt

### 2. ChatBots List Sayfası
- **URL:** https://whatsapp.sipsy.ai/#chatbots
- **Önkoşul:** Giriş yapılmış olmalı
- **Test Senaryoları:**
  - [ ] Chatbot listesi yükleme
  - [ ] Arama fonksiyonu (debounce)
  - [ ] Filter değişikliği (All/Active/Archived)
  - [ ] Chatbot aktif/inaktif toggle
  - [ ] Chatbot silme (confirm dialog)
  - [ ] Chatbot export (JSON download)
  - [ ] Chatbot import (dosya yükleme)
  - [ ] Pagination çalışması
  - [ ] Empty state gösterimi
  - [ ] "Create New ChatBot" butonu

### 3. ChatBot Builder Sayfası
- **URL:** https://whatsapp.sipsy.ai/#builder
- **Önkoşul:** Giriş yapılmış olmalı
- **Test Senaryoları:**
  - [ ] Yeni flow oluşturma (Create New)
  - [ ] Node ekleme (sidebar'dan tıklama)
  - [ ] Node sürükle-bırak (drag & drop)
  - [ ] Node bağlama (edge oluşturma)
  - [ ] Node konfigürasyonu (modal açılma)
  - [ ] Node silme
  - [ ] Edge silme
  - [ ] Flow kaydetme
  - [ ] Flow güncelleme
  - [ ] Validation panel çalışması
  - [ ] Auto layout
  - [ ] Test mode açma/kapama

### 4. WhatsApp Flows Sayfası
- **URL:** https://whatsapp.sipsy.ai/#flows
- **Önkoşul:** Giriş yapılmış olmalı
- **Test Senaryoları:**
  - [ ] Flow listesi yükleme
  - [ ] Flow oluşturma (modal)
  - [ ] Flow JSON validasyonu
  - [ ] Kategori seçimi
  - [ ] Flow yayınlama (publish)
  - [ ] Flow silme
  - [ ] Meta'dan senkronizasyon
  - [ ] Flow detay modal
  - [ ] Status badge gösterimi
  - [ ] Empty state

### 5. Flow Builder Sayfası
- **URL:** https://whatsapp.sipsy.ai/#flowBuilder
- **Önkoşul:** Flow seçilmiş olmalı
- **Test Senaryoları:**
  - [ ] Screen ekleme
  - [ ] Component ekleme (palette'den)
  - [ ] Component sırası değiştirme
  - [ ] Component konfigürasyonu
  - [ ] Component silme
  - [ ] Component duplicate
  - [ ] Flow kaydetme
  - [ ] JSON export
  - [ ] Validation panel

### 6. Flow Playground Sayfası
- **URL:** https://whatsapp.sipsy.ai/#playground
- **Önkoşul:** Giriş yapılmış olmalı
- **Test Senaryoları:**
  - [ ] Screen ekleme
  - [ ] Screen silme
  - [ ] Screen duplicate
  - [ ] Component ekleme (menu)
  - [ ] Component konfigürasyonu
  - [ ] Component silme
  - [ ] Component sırası değiştirme
  - [ ] Meta API validation
  - [ ] Flow kaydetme (create mode)
  - [ ] Flow kaydetme (edit mode)
  - [ ] JSON export
  - [ ] Preview platform değişikliği
  - [ ] Preview tema değişikliği

### 7. Sessions List Sayfası
- **URL:** https://whatsapp.sipsy.ai/#sessions
- **Önkoşul:** Giriş yapılmış olmalı
- **Test Senaryoları:**
  - [ ] Session listesi yükleme
  - [ ] Tab değişikliği (Active/Completed)
  - [ ] Arama fonksiyonu
  - [ ] Chatbot filter
  - [ ] Tarih filter
  - [ ] Session silme
  - [ ] CSV export
  - [ ] JSON export
  - [ ] Pagination
  - [ ] Empty state

### 8. Session Detail Sayfası
- **URL:** https://whatsapp.sipsy.ai/#sessions/:sessionId
- **Önkoşul:** Session seçilmiş olmalı
- **Test Senaryoları:**
  - [ ] Session detay yükleme
  - [ ] Mesaj listesi yükleme
  - [ ] Session durdurma (aktif ise)
  - [ ] Timeline gösterimi
  - [ ] Variables panel
  - [ ] Status badge
  - [ ] Geri dönme

### 9. Users Sayfası
- **URL:** https://whatsapp.sipsy.ai/#users
- **Önkoşul:** Giriş yapılmış olmalı
- **Test Senaryoları:**
  - [ ] Kullanıcı listesi yükleme
  - [ ] Kullanıcı ekleme (form validasyonu)
  - [ ] Kullanıcı düzenleme
  - [ ] Kullanıcı silme (confirm dialog)
  - [ ] Kendi hesabını silme engelleme
  - [ ] Email validasyonu
  - [ ] Empty state

### 10. WhatsApp Settings Sayfası
- **URL:** https://whatsapp.sipsy.ai/#settings
- **Önkoşul:** Giriş yapılmış olmalı
- **Test Senaryoları:**
  - [ ] Konfigürasyonu yükleme
  - [ ] Konfigürasyonu kaydetme
  - [ ] Bağlantı testi (başarılı)
  - [ ] Bağlantı testi (başarısız)
  - [ ] Webhook URL gösterimi
  - [ ] URL kopyalama
  - [ ] Loading/saving states
  - [ ] Error handling

### 11. Data Sources Sayfası
- **URL:** https://whatsapp.sipsy.ai/#data-sources
- **Önkoşul:** Giriş yapılmış olmalı
- **Test Senaryoları:**
  - [ ] Data source listesi yükleme
  - [ ] Data source ekleme (form validasyonu)
  - [ ] Data source düzenleme
  - [ ] Data source silme
  - [ ] Connection test
  - [ ] URL validasyonu
  - [ ] Auth type'a göre dinamik form
  - [ ] Connection yönetimi

### 12. Chat Sayfası
- **URL:** https://whatsapp.sipsy.ai/#chat
- **Önkoşul:** Giriş yapılmış olmalı
- **Test Senaryoları:**
  - [ ] Conversation listesi yükleme
  - [ ] Conversation seçme
  - [ ] Mesaj listesi yükleme
  - [ ] Mesaj gönderme
  - [ ] Okundu olarak işaretleme
  - [ ] Empty state

### 13. Landing Page
- **URL:** https://whatsapp.sipsy.ai/#landing
- **Önkoşul:** Giriş yapılmış olmalı
- **Test Senaryoları:**
  - [ ] Landing sayfası yükleme
  - [ ] Modal açılma
  - [ ] Input çalışması
  - [ ] Builder'a geçiş

### 14. Sidebar Navigation
- **URL:** Tüm sayfalar
- **Önkoşul:** Giriş yapılmış olmalı
- **Test Senaryoları:**
  - [ ] Tüm menü itemları görünür
  - [ ] Active state doğru gösteriliyor
  - [ ] Navigation çalışıyor (her item için)

---

## Test Öncelikleri

| Öncelik | Sayfalar | Açıklama |
|---------|----------|----------|
| **P0 - Kritik** | Login, Builder, Flow Kaydetme | Uygulamanın temel işlevleri |
| **P1 - Yüksek** | ChatBots CRUD, Flows CRUD, Settings, Data Sources | Ana özellikler |
| **P2 - Orta** | Users, Sessions, Chat, Playground | İkincil özellikler |
| **P3 - Düşük** | Landing, Sidebar | Yardımcı özellikler |

---

## Test Rapor Şablonu

Test tamamlandığında aşağıdaki formatı kullan:

```markdown
# Frontend Test Raporu

**Tarih:** YYYY-MM-DD HH:mm
**Test Eden:** Claude Code (Playwright MCP)
**Ortam:** https://whatsapp.sipsy.ai

## Özet

| Metrik | Değer |
|--------|-------|
| Toplam Test | XX |
| Başarılı | XX |
| Başarısız | XX |
| Atlanan | XX |
| Başarı Oranı | XX% |

## Sayfa Bazlı Sonuçlar

### [Sayfa Adı]
- **URL:** [url]
- **Durum:** ✅ BAŞARILI / ❌ BAŞARISIZ / ⚠️ KISMEN

| Test | Sonuç | Not |
|------|-------|-----|
| Test adı | ✅/❌ | Varsa not |

### Başarısız Testler

| Sayfa | Test | Hata |
|-------|------|------|
| Sayfa adı | Test adı | Hata detayı |

### Ekran Görüntüleri

- `screenshot-1.png` - [Açıklama]
- `screenshot-2.png` - [Açıklama]

## Öneriler

1. [Öneri 1]
2. [Öneri 2]
```

---

## Playwright MCP Kullanım Örnekleri

### Sayfa Navigasyonu
```
mcp__playwright__browser_navigate → url: "https://whatsapp.sipsy.ai"
mcp__playwright__browser_snapshot → sayfa yapısını al
```

### Form Doldurma
```
mcp__playwright__browser_type → ref: "E123", text: "test@example.com"
mcp__playwright__browser_type → ref: "E456", text: "password123"
mcp__playwright__browser_click → ref: "E789", element: "Login button"
```

### Bekleme
```
mcp__playwright__browser_wait_for → text: "Welcome"
mcp__playwright__browser_wait_for → time: 2
```

### Screenshot
```
mcp__playwright__browser_take_screenshot → filename: "login-test.png"
```

---

## Önemli Notlar

1. **Her test sonunda snapshot al** - Durumu doğrulamak için
2. **Hata durumunda screenshot al** - Debug için
3. **Bekleme süreleri ekle** - Async işlemler için
4. **Test verilerini temizle** - Bir sonraki test için

---

## Referanslar

- Skill: `.claude/skills/frontend-tester/`
- Agent: `.claude/agents/frontend-tester.md`
- Rapor Şablonu: Bu döküman içinde
