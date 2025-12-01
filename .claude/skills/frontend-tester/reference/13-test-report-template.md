# Test Rapor Şablonu

Bu dosya frontend test raporları için standart şablonu içerir.

---

## Rapor Formatı

```markdown
# Frontend Test Raporu

**Tarih:** [YYYY-MM-DD HH:mm]
**Test Eden:** Claude Code (Playwright MCP)
**Ortam:** [URL - örn: http://localhost:5173]
**Browser:** [Chromium/Firefox/WebKit]

---

## Özet

| Metrik | Değer |
|--------|-------|
| Toplam Test | [X] |
| Başarılı | [X] |
| Başarısız | [X] |
| Atlanan | [X] |
| Başarı Oranı | [X%] |

---

## Test Durumu Özeti

| Sayfa | Toplam | Başarılı | Başarısız | Durum |
|-------|--------|----------|-----------|-------|
| Login | X | X | X | ✅/❌/⚠️ |
| ChatBots | X | X | X | ✅/❌/⚠️ |
| Builder | X | X | X | ✅/❌/⚠️ |
| ... | ... | ... | ... | ... |

---

## Sayfa Bazlı Sonuçlar

### 1. Login Sayfası
- **URL:** http://localhost:5173
- **Toplam Test:** X
- **Genel Durum:** ✅ BAŞARILI / ❌ BAŞARISIZ / ⚠️ KISMEN

| Test ID | Test Adı | Sonuç | Süre | Not |
|---------|----------|-------|------|-----|
| TEST-LOGIN-001 | Başarılı Giriş | ✅ | 1.2s | - |
| TEST-LOGIN-002 | Başarısız Giriş | ✅ | 0.8s | - |
| TEST-LOGIN-003 | Boş Form | ❌ | 0.5s | Validation çalışmadı |

### 2. ChatBots Sayfası
...

---

## Başarısız Testler (Detay)

### TEST-LOGIN-003: Boş Form Submit Engelleme
**Sayfa:** Login
**Beklenen:** Validation hataları gösterilmeli
**Gerçekleşen:** Form submit edildi, hata gösterilmedi
**Screenshot:** `screenshots/test-login-003-fail.png`
**Olası Sebep:** Required attribute eksik veya JS validation çalışmıyor
**Öneri:** Form validasyonunu kontrol et

### TEST-XXX-XXX: [Test Adı]
...

---

## Atlanan Testler

| Test ID | Sebep |
|---------|-------|
| TEST-SESSIONS-009 | WebSocket test edilemedi (backend kapalı) |
| ... | ... |

---

## Ekran Görüntüleri

| Dosya | Açıklama | İlgili Test |
|-------|----------|-------------|
| `screenshots/login-success.png` | Başarılı login sonrası dashboard | TEST-LOGIN-001 |
| `screenshots/builder-nodes.png` | Builder node ekleme | TEST-BUILDER-002 |
| `screenshots/test-login-003-fail.png` | Form validation hatası | TEST-BUILDER-003 |
| ... | ... | ... |

---

## Performance Metrikleri (Opsiyonel)

| Sayfa | Yükleme Süresi | LCP | FID |
|-------|----------------|-----|-----|
| Login | 0.8s | 1.2s | 50ms |
| ChatBots | 1.5s | 2.1s | 80ms |
| ... | ... | ... | ... |

---

## Console Hataları

| Sayfa | Hata Tipi | Mesaj |
|-------|-----------|-------|
| Builder | Error | "Cannot read property 'x' of undefined" |
| ... | ... | ... |

---

## Öneriler

### Kritik (Hemen Düzeltilmeli)
1. [Öneri açıklaması ve ilgili test]
2. ...

### Orta Öncelik
1. [Öneri]
2. ...

### Düşük Öncelik / İyileştirme
1. [Öneri]
2. ...

---

## Test Ortamı Bilgileri

- **Frontend URL:** http://localhost:5173
- **Backend URL:** http://localhost:3001
- **Test Zamanı:** [datetime]
- **Test Kullanıcısı:** test@example.com
- **Node Version:** vXX.XX.X
- **Browser:** Chromium 120

---

## Sonraki Adımlar

1. [ ] Başarısız testleri düzelt
2. [ ] Yeniden test çalıştır
3. [ ] Regression testlerini çalıştır

---

**Rapor Oluşturulma Tarihi:** [datetime]
**Claude Code Version:** [version]
```

---

## Durum İkonları

| İkon | Anlam |
|------|-------|
| ✅ | Başarılı (PASS) |
| ❌ | Başarısız (FAIL) |
| ⚠️ | Kısmen başarılı veya uyarı |
| ⏭️ | Atlandı (SKIP) |
| 🔄 | Devam ediyor |

---

## Rapor Örnekleri

### Minimal Rapor (Hızlı Özet)

```markdown
# Frontend Test Özeti - 2024-01-15

✅ 45/50 test başarılı (%90)

**Başarısız Testler:**
- TEST-LOGIN-003: Form validation
- TEST-BUILDER-008: Node silme
- TEST-FLOWS-005: Publish işlemi
- TEST-SESSIONS-009: WebSocket
- TEST-CHAT-004: Mesaj gönderme

📁 Detaylı rapor: test-report-2024-01-15.md
```

### Sayfa Odaklı Rapor

```markdown
# Login Sayfası Test Raporu

| Test | Sonuç |
|------|-------|
| Başarılı giriş | ✅ |
| Başarısız giriş | ✅ |
| Boş form | ❌ |
| Email validasyonu | ✅ |
| Loading state | ✅ |
| Token kayıt | ✅ |
| Redirect | ✅ |

**Başarı Oranı:** 6/7 (%86)
```

---

## Screenshot Naming Convention

```
screenshots/
├── {sayfa}-{durum}.png           # Genel sayfa screenshot'ları
│   ├── login-initial.png
│   ├── login-success.png
│   ├── chatbots-list.png
│   └── builder-with-nodes.png
│
├── {test-id}-{durum}.png         # Test-spesifik screenshot'lar
│   ├── test-login-001-pass.png
│   ├── test-login-003-fail.png
│   └── test-builder-002-pass.png
│
└── errors/                        # Hata screenshot'ları
    ├── error-login-validation.png
    └── error-builder-crash.png
```

---

## Rapor Dosya İsimlendirme

```
test-reports/
├── frontend-test-report-YYYY-MM-DD.md       # Günlük rapor
├── frontend-test-report-YYYY-MM-DD-HHmm.md  # Saat bazlı rapor
├── login-tests-YYYY-MM-DD.md                # Sayfa bazlı rapor
└── regression-report-YYYY-MM-DD.md          # Regression raporu
```
