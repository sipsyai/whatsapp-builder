---
name: frontend-tester
description: Frontend testing skill for WhatsApp Builder using Playwright MCP. Provides systematic UI testing for all pages with standardized reporting. Use when running frontend tests, verifying UI functionality, or generating test reports.
version: 1.0.0
scope: project
tags:
  - testing
  - playwright
  - e2e
  - frontend
  - ui-testing
degree_of_freedom: high
---

# Frontend Tester Skill

WhatsApp Builder frontend uygulaması için Playwright MCP tabanlı sistematik UI test skill'i.

## Hızlı Başlangıç

### Tüm Testleri Çalıştır
```
Frontend testlerini çalıştır
```

### Belirli Sayfa Testi
```
Login sayfası testlerini çalıştır
ChatBots listesi testlerini çalıştır
Builder testlerini çalıştır
```

### Kritik Testler (P0)
```
Sadece kritik testleri çalıştır (P0)
```

---

## Test Edilebilecek Sayfalar

| # | Sayfa | URL | Öncelik |
|---|-------|-----|---------|
| 1 | Login | / | P0 |
| 2 | ChatBots List | #chatbots | P1 |
| 3 | ChatBot Builder | #builder | P0 |
| 4 | WhatsApp Flows | #flows | P1 |
| 5 | Flow Builder | #flowBuilder | P1 |
| 6 | Flow Playground | #playground | P2 |
| 7 | Sessions List | #sessions | P1 |
| 8 | Session Detail | #sessions/:id | P2 |
| 9 | Users | #users | P2 |
| 10 | WhatsApp Settings | #settings | P1 |
| 11 | Data Sources | #data-sources | P1 |
| 12 | Chat | #chat | P2 |
| 13 | Landing Page | #landing | P3 |
| 14 | Sidebar Navigation | (tüm sayfalar) | P3 |

---

## Playwright MCP Araçları

### Navigasyon
- `mcp__playwright__browser_navigate` - Sayfaya git
- `mcp__playwright__browser_navigate_back` - Geri git
- `mcp__playwright__browser_tabs` - Tab yönetimi

### Sayfa Analizi
- `mcp__playwright__browser_snapshot` - Accessibility snapshot (element ref'leri için)
- `mcp__playwright__browser_take_screenshot` - Ekran görüntüsü al
- `mcp__playwright__browser_console_messages` - Console logları

### Etkileşim
- `mcp__playwright__browser_click` - Tıklama
- `mcp__playwright__browser_type` - Metin girişi
- `mcp__playwright__browser_fill_form` - Form doldurma
- `mcp__playwright__browser_select_option` - Dropdown seçimi
- `mcp__playwright__browser_hover` - Hover
- `mcp__playwright__browser_drag` - Sürükle-bırak
- `mcp__playwright__browser_press_key` - Klavye tuşu

### Bekleme
- `mcp__playwright__browser_wait_for` - Text/element bekleme

### Gelişmiş
- `mcp__playwright__browser_evaluate` - JavaScript çalıştır
- `mcp__playwright__browser_file_upload` - Dosya yükle
- `mcp__playwright__browser_network_requests` - Network istekleri

---

## Test Akışı

### 1. Ortam Kontrolü
```
1. Backend çalışıyor mu kontrol et (curl http://localhost:3001/health)
2. Frontend çalışıyor mu kontrol et
3. Test kullanıcı bilgilerini hazırla
```

### 2. Test Çalıştırma
```
1. browser_navigate ile sayfaya git
2. browser_snapshot ile element ref'lerini al
3. Test senaryolarını sırayla uygula
4. Her adımda snapshot al (doğrulama için)
5. Hata durumunda screenshot al
```

### 3. Raporlama
```
1. Test sonuçlarını topla
2. Markdown formatında rapor oluştur
3. Screenshot'ları referans göster
```

---

## Reference Dosyaları

Detaylı test senaryoları için reference dosyalarına bak:

| Dosya | İçerik |
|-------|--------|
| `01-login-tests.md` | Login sayfası test senaryoları |
| `02-chatbots-tests.md` | ChatBots list test senaryoları |
| `03-builder-tests.md` | ChatBot Builder test senaryoları |
| `04-flows-tests.md` | WhatsApp Flows test senaryoları |
| `05-flow-builder-tests.md` | Flow Builder test senaryoları |
| `06-playground-tests.md` | Flow Playground test senaryoları |
| `07-sessions-tests.md` | Sessions test senaryoları |
| `08-users-tests.md` | Users test senaryoları |
| `09-settings-tests.md` | Settings test senaryoları |
| `10-data-sources-tests.md` | Data Sources test senaryoları |
| `11-chat-tests.md` | Chat test senaryoları |
| `12-common-tests.md` | Ortak testler (sidebar, navigation) |
| `13-test-report-template.md` | Rapor şablonu |
| `14-test-data.md` | Test verileri |

---

## Test Öncelikleri

### P0 - Kritik (Mutlaka Test Edilmeli)
- Login/Logout akışı
- ChatBot Builder - node oluşturma ve bağlama
- Flow kaydetme
- Session real-time updates

### P1 - Yüksek
- ChatBots CRUD işlemleri
- Flows CRUD işlemleri
- WhatsApp Settings
- Data Sources CRUD

### P2 - Orta
- Users CRUD
- Sessions filtreleme ve export
- Chat mesajlaşma
- Flow Playground

### P3 - Düşük
- Landing page
- Sidebar navigation

---

## Best Practices

1. **Snapshot First** - Her işlemden önce snapshot al
2. **Wait for Load** - Sayfa yüklenmesini bekle
3. **Screenshot on Fail** - Hata durumunda screenshot al
4. **Clean State** - Her test temiz state ile başlamalı
5. **Verify Actions** - Her action sonrası doğrulama yap

---

## Hata Çözümleri

### Element Bulunamadı
```
1. browser_snapshot ile güncel ref'leri al
2. Doğru ref'i kullan
3. wait_for ile elementin yüklenmesini bekle
```

### Timeout
```
1. wait_for süresini artır
2. Network isteklerini kontrol et
3. Console hataları kontrol et
```

### Form Submit Çalışmıyor
```
1. Required field'ları kontrol et
2. Validation hatalarını kontrol et
3. Button disabled state'ini kontrol et
```

---

## İlgili Kaynaklar

- Test Dökümanı: `docs/FRONTEND_TEST_PROMPT.md`
- Agent: `.claude/agents/frontend-tester.md`
- Playwright MCP: MCP tools with `mcp__playwright__` prefix
