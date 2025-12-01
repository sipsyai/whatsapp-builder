# Sessions Sayfası Test Senaryoları

**URL:** http://localhost:5173/#sessions
**Önkoşul:** Giriş yapılmış olmalı
**Öncelik:** P1 - Yüksek

---

## Test Senaryoları

### TEST-SESSIONS-001: Liste Yükleme
**Açıklama:** Session listesi yüklenmeli

**Adımlar:**
1. `browser_navigate` → http://localhost:5173/#sessions
2. `browser_wait_for` → Session kartları veya empty state
3. `browser_snapshot` → Liste yapısını kontrol et

**Beklenen Sonuç:**
- Session kartları grid layout'ta görünmeli
- Stats kartları görünmeli (active, completed, total)
- Tab navigation görünmeli (Active/Completed)
- Search bar görünmeli

---

### TEST-SESSIONS-002: Tab Değişikliği
**Açıklama:** Active/Completed tab'ları çalışmalı

**Adımlar:**
1. `browser_snapshot` → Tab bar'ı bul
2. `browser_click` → "Completed" tab'ına tıkla
3. `browser_wait_for` → Liste güncellenmesi
4. `browser_snapshot` → Completed session'lar görünmeli

**Beklenen Sonuç:**
- Tab aktif olarak işaretlenmeli
- Liste ilgili session'ları göstermeli

---

### TEST-SESSIONS-003: Arama Fonksiyonu
**Açıklama:** Session'lar aranabilmeli

**Adımlar:**
1. `browser_snapshot` → Search input'u bul
2. `browser_type` → Müşteri adı veya telefon numarası
3. `browser_wait_for` → time: 500 (debounce)
4. `browser_snapshot` → Filtrelenmiş sonuçlar

**Beklenen Sonuç:**
- Arama terimine uyan session'lar listelenmeli
- Uymayan session'lar gizlenmeli

---

### TEST-SESSIONS-004: Chatbot Filter
**Açıklama:** Chatbot'a göre filtreleme yapılabilmeli

**Adımlar:**
1. `browser_snapshot` → Chatbot filter dropdown'ı bul
2. `browser_click` → Dropdown'a tıkla
3. `browser_snapshot` → Chatbot listesi
4. Bir chatbot seç
5. `browser_wait_for` → Filtreleme
6. `browser_snapshot` → Filtrelenmiş session'lar

**Beklenen Sonuç:**
- Seçilen chatbot'un session'ları listelenmeli
- Filter badge güncellenmeli

---

### TEST-SESSIONS-005: Tarih Filter
**Açıklama:** Tarih aralığına göre filtreleme yapılabilmeli

**Adımlar:**
1. `browser_snapshot` → Date range picker'ı bul
2. Başlangıç ve bitiş tarihi seç
3. `browser_wait_for` → Filtreleme
4. `browser_snapshot` → Filtrelenmiş session'lar

**Beklenen Sonuç:**
- Seçilen tarih aralığındaki session'lar listelenmeli

---

### TEST-SESSIONS-006: Session Silme
**Açıklama:** Session silinebilmeli

**Adımlar:**
1. Bir session kartındaki delete butonunu bul
2. `browser_click` → Delete
3. `browser_wait_for` → Confirm dialog
4. `browser_click` → Confirm
5. `browser_wait_for` → Toast notification
6. `browser_snapshot` → Session silindi

**Beklenen Sonuç:**
- Confirm dialog gösterilmeli
- Session silinmeli
- Success toast gösterilmeli

---

### TEST-SESSIONS-007: CSV Export
**Açıklama:** Session'lar CSV olarak export edilebilmeli

**Adımlar:**
1. `browser_snapshot` → Export menu'yü bul
2. `browser_click` → Export butonuna tıkla
3. `browser_snapshot` → Export seçenekleri
4. `browser_click` → "CSV" seçeneğine tıkla
5. `browser_wait_for` → Download

**Beklenen Sonuç:**
- CSV dosyası indirilmeli
- Dosya session verilerini içermeli

---

### TEST-SESSIONS-008: JSON Export
**Açıklama:** Session'lar JSON olarak export edilebilmeli

**Adımlar:**
1. Export menu'yü aç
2. `browser_click` → "JSON" seçeneğine tıkla
3. `browser_wait_for` → Download

**Beklenen Sonuç:**
- JSON dosyası indirilmeli
- Dosya session verilerini içermeli

---

### TEST-SESSIONS-009: WebSocket Real-time Updates
**Açıklama:** Yeni session'lar real-time görünmeli

**Adımlar:**
1. Sayfa yüklü durumda bekle
2. Backend'den yeni session oluştur (API veya WhatsApp)
3. `browser_wait_for` → Yeni session kartı
4. `browser_snapshot` → Yeni session görünüyor

**Beklenen Sonuç:**
- Sayfa refresh olmadan yeni session görünmeli
- Stats kartları güncelenmeli

---

### TEST-SESSIONS-010: Pagination
**Açıklama:** Sayfalama çalışmalı

**Adımlar:**
1. `browser_snapshot` → Pagination kontrollerini bul
2. Sonraki sayfa butonuna tıkla
3. `browser_wait_for` → Yeni sayfa
4. `browser_snapshot` → Farklı session'lar

**Beklenen Sonuç:**
- Sayfa değişmeli
- Farklı session'lar listelenmeli

---

### TEST-SESSIONS-011: Empty State
**Açıklama:** Session yoksa empty state gösterilmeli

**Adımlar:**
1. Filtreleri sıkılaştır (sonuç yok)
2. `browser_snapshot` → Empty state

**Beklenen Sonuç:**
- "No sessions found" mesajı görünmeli
- Filter temizleme önerisi olabilir

---

### TEST-SESSIONS-012: Session Detay Görüntüleme
**Açıklama:** Session detayına gidilebilmeli

**Adımlar:**
1. Bir session kartına tıkla
2. `browser_wait_for` → Detay sayfası
3. `browser_snapshot` → Session detay sayfası

**Beklenen Sonuç:**
- Session detay sayfasına yönlendirilmeli
- URL #sessions/:id formatında olmalı

---

## Session Detail Sayfası

**URL:** http://localhost:5173/#sessions/:sessionId

### TEST-SESSIONDETAIL-001: Detay Yükleme
**Açıklama:** Session detayları yüklenmeli

**Adımlar:**
1. `browser_navigate` → http://localhost:5173/#sessions/:id
2. `browser_wait_for` → Detay içeriği
3. `browser_snapshot` → Sayfa yapısı

**Beklenen Sonuç:**
- Müşteri bilgisi görünmeli
- Chatbot bilgisi görünmeli
- Status badge görünmeli
- Conversation log görünmeli

---

### TEST-SESSIONDETAIL-002: Mesaj Listesi
**Açıklama:** Mesaj geçmişi görüntülenmeli

**Adımlar:**
1. Detay sayfasında mesaj bölümünü bul
2. `browser_snapshot` → Mesaj listesi

**Beklenen Sonuç:**
- Tüm mesajlar kronolojik sırada görünmeli
- Gelen ve giden mesajlar farklı stilde
- Timestamp görünmeli

---

### TEST-SESSIONDETAIL-003: Session Durdurma
**Açıklama:** Aktif session durdurulabilmeli

**Adımlar:**
1. Aktif bir session detayına git
2. `browser_snapshot` → Stop Session butonunu bul
3. `browser_click` → Stop Session
4. `browser_wait_for` → Status değişikliği
5. `browser_snapshot` → Session durdu

**Beklenen Sonuç:**
- Session status "completed" olmalı
- Stop butonu kaybolmalı

---

### TEST-SESSIONDETAIL-004: Timeline Gösterimi
**Açıklama:** Session timeline görüntülenmeli

**Adımlar:**
1. `browser_snapshot` → Timeline bölümünü bul

**Beklenen Sonuç:**
- Session event'leri timeline'da görünmeli
- Başlangıç, node geçişleri, bitiş

---

### TEST-SESSIONDETAIL-005: Variables Panel
**Açıklama:** Session variables görüntülenmeli

**Adımlar:**
1. `browser_snapshot` → Variables panel'i bul

**Beklenen Sonuç:**
- Toplanan değişkenler görünmeli
- Key-value formatında

---

### TEST-SESSIONDETAIL-006: Geri Dönme
**Açıklama:** Sessions listesine geri dönülebilmeli

**Adımlar:**
1. Back butonuna tıkla
2. `browser_wait_for` → Sessions list
3. `browser_snapshot` → Liste sayfası

**Beklenen Sonuç:**
- Sessions listesine dönülmeli
- URL #sessions olmalı

---

## Sayfa Elementleri

### Sessions List Page
```
- Stats Cards:
  - Active sessions
  - Completed today
  - Total sessions
- Tab Navigation: Active | Completed
- Filters:
  - Search input
  - Chatbot dropdown
  - Date range picker
- Export menu (CSV/JSON)
- Session Cards Grid:
  - Customer info
  - Chatbot name
  - Status badge
  - Created date
  - Actions (view, delete)
- Pagination
```

### Session Detail Page
```
- Header:
  - Customer info
  - Chatbot name
  - Status badge
  - Stop Session button (if active)
  - Back button
- Conversation Log:
  - Message bubbles
  - Timestamps
- Timeline Panel
- Variables Panel
```

---

## Session Durumları

| Status | Açıklama | Renk |
|--------|----------|------|
| active | Devam ediyor | Yeşil |
| waiting | Kullanıcı yanıtı bekleniyor | Sarı |
| completed | Tamamlandı | Gri |
| error | Hata oluştu | Kırmızı |
