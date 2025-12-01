# WhatsApp Flows Sayfası Test Senaryoları

**URL:** http://localhost:5173/#flows
**Önkoşul:** Giriş yapılmış olmalı
**Öncelik:** P1 - Yüksek

---

## Test Senaryoları

### TEST-FLOWS-001: Liste Yükleme
**Açıklama:** WhatsApp Flows listesi yüklenmeli

**Adımlar:**
1. `browser_navigate` → http://localhost:5173/#flows
2. `browser_wait_for` → Flow kartları veya empty state
3. `browser_snapshot` → Liste yapısını kontrol et

**Beklenen Sonuç:**
- Flow kartları grid layout'ta görünmeli
- Her kart: name, status, kategori göstermeli
- Create Flow butonu görünmeli
- Sync from Meta butonu görünmeli

---

### TEST-FLOWS-002: Flow Oluşturma (Modal)
**Açıklama:** Yeni flow modal ile oluşturulabilmeli

**Adımlar:**
1. `browser_snapshot` → Create Flow butonunu bul
2. `browser_click` → Create Flow butonuna tıkla
3. `browser_wait_for` → Modal açılması
4. `browser_snapshot` → Modal formunu kontrol et
5. `browser_type` → Flow name gir
6. Flow JSON gir veya bırak (minimal valid JSON)
7. Kategori seç
8. `browser_click` → Create butonuna tıkla
9. `browser_wait_for` → Success toast veya modal kapanması
10. `browser_snapshot` → Yeni flow listede

**Beklenen Sonuç:**
- Modal açılmalı
- Form validasyonu çalışmalı
- Flow oluşturulmalı
- Liste güncellenmeli

---

### TEST-FLOWS-003: Flow JSON Validasyonu
**Açıklama:** Invalid JSON kabul edilmemeli

**Adımlar:**
1. Create Flow modal'ı aç
2. Invalid JSON gir (örn: `{invalid}`)
3. Create butonuna tıkla
4. `browser_snapshot` → Validation hatası

**Beklenen Sonuç:**
- Validation hatası gösterilmeli
- Flow oluşturulmamalı

---

### TEST-FLOWS-004: Kategori Seçimi
**Açıklama:** Flow kategorisi seçilebilmeli

**Adımlar:**
1. Create Flow modal'ı aç
2. `browser_snapshot` → Kategori dropdown'ını bul
3. `browser_click` → Dropdown'a tıkla
4. `browser_snapshot` → Kategorileri listele
5. Bir kategori seç

**Beklenen Sonuç:**
- Kategoriler listelenmeli
- Seçim yapılabilmeli

**Kategoriler:**
- SIGN_UP
- SIGN_IN
- APPOINTMENT_BOOKING
- LEAD_GENERATION
- SHOPPING
- CONTACT_US
- CUSTOMER_SUPPORT
- SURVEY
- OTHER

---

### TEST-FLOWS-005: Flow Yayınlama (Publish)
**Açıklama:** Draft flow yayınlanabilmeli

**Adımlar:**
1. Draft durumunda bir flow bul
2. `browser_snapshot` → Publish butonunu bul
3. `browser_click` → Publish butonuna tıkla
4. `browser_wait_for` → Confirmation dialog veya doğrudan işlem
5. `browser_snapshot` → Status değişikliği

**Beklenen Sonuç:**
- Flow status "PUBLISHED" olmalı
- Status badge güncellenmeli

---

### TEST-FLOWS-006: Flow Silme
**Açıklama:** Flow silinebilmeli

**Adımlar:**
1. Bir flow kartı bul
2. Delete butonuna tıkla
3. `browser_wait_for` → Confirm dialog
4. `browser_click` → Confirm
5. `browser_wait_for` → Toast notification
6. `browser_snapshot` → Flow listeden kaldırıldı

**Beklenen Sonuç:**
- Confirm dialog gösterilmeli
- Flow silinmeli
- Liste güncellenmeli

---

### TEST-FLOWS-007: Meta'dan Senkronizasyon
**Açıklama:** Meta'dan flow'lar senkronize edilebilmeli

**Adımlar:**
1. `browser_snapshot` → Sync from Meta butonunu bul
2. `browser_click` → Sync butonuna tıkla
3. `browser_wait_for` → Loading ve sonuç
4. `browser_snapshot` → Yeni/güncellenen flow'lar

**Beklenen Sonuç:**
- Loading indicator gösterilmeli
- Senkronizasyon tamamlanmalı
- Yeni flow'lar listelenmeli (varsa)

---

### TEST-FLOWS-008: Flow Detay Modal
**Açıklama:** Flow detayları görüntülenebilmeli

**Adımlar:**
1. Bir flow kartına tıkla
2. `browser_wait_for` → Detail modal
3. `browser_snapshot` → Modal içeriği

**Beklenen Sonuç:**
- Flow JSON görünmeli
- Metadata görünmeli
- Edit/Preview butonları görünmeli

---

### TEST-FLOWS-009: Status Badge
**Açıklama:** Flow status badge'leri doğru görünmeli

**Adımlar:**
1. `browser_snapshot` → Tüm flow kartlarını kontrol et

**Beklenen Sonuçlar:**
- DRAFT: Sarı/turuncu badge
- PUBLISHED: Yeşil badge
- DEPRECATED: Gri badge
- BLOCKED: Kırmızı badge
- THROTTLED: Turuncu badge

---

### TEST-FLOWS-010: Empty State
**Açıklama:** Flow yoksa empty state gösterilmeli

**Adımlar:**
1. Tüm flow'ları sil (veya yoksa kontrol et)
2. `browser_snapshot` → Empty state

**Beklenen Sonuç:**
- "No flows found" mesajı
- Create Flow butonu

---

### TEST-FLOWS-011: Create with Playground
**Açıklama:** Playground ile flow oluşturulabilmeli

**Adımlar:**
1. `browser_snapshot` → "Create with Playground" butonunu bul
2. `browser_click` → Butona tıkla
3. `browser_wait_for` → Playground sayfası
4. `browser_snapshot` → Playground yüklendi

**Beklenen Sonuç:**
- Playground sayfasına yönlendirilmeli
- Boş flow ile başlanmalı

---

### TEST-FLOWS-012: Flow Builder'da Düzenleme
**Açıklama:** Flow Builder'da düzenleme yapılabilmeli

**Adımlar:**
1. Bir flow kartındaki "Edit in Builder" butonuna tıkla
2. `browser_wait_for` → Flow Builder sayfası
3. `browser_snapshot` → Builder yüklendi

**Beklenen Sonuç:**
- Flow Builder sayfasına yönlendirilmeli
- Mevcut flow yüklenmeli

---

## Sayfa Elementleri

```
- Header:
  - Sayfa başlığı
  - Create Flow button
  - Create with Playground button
  - Sync from Meta button
- Flow Cards Grid:
  - Flow Card:
    - Name
    - Status badge
    - Category
    - Created date
    - Actions (Edit, Publish, Delete)
- Create Flow Modal:
  - Name input
  - JSON editor
  - Category dropdown
  - Create/Cancel buttons
- Detail Modal:
  - Flow JSON viewer
  - Metadata
  - Action buttons
```

---

## Flow Durumları

| Status | Açıklama | Renk |
|--------|----------|------|
| DRAFT | Henüz yayınlanmamış | Sarı |
| PUBLISHED | Aktif, kullanılabilir | Yeşil |
| DEPRECATED | Kullanımdan kaldırılmış | Gri |
| BLOCKED | Meta tarafından engellenmiş | Kırmızı |
| THROTTLED | Rate limited | Turuncu |
