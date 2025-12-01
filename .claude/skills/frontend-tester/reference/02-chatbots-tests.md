# ChatBots List Sayfası Test Senaryoları

**URL:** http://localhost:5173/#chatbots
**Önkoşul:** Giriş yapılmış olmalı
**Öncelik:** P1 - Yüksek

---

## Test Senaryoları

### TEST-CHATBOTS-001: Liste Yükleme
**Açıklama:** ChatBot listesi doğru şekilde yüklenmeli

**Adımlar:**
1. `browser_navigate` → http://localhost:5173/#chatbots
2. `browser_wait_for` → Chatbot kartları veya empty state
3. `browser_snapshot` → Liste yapısını kontrol et

**Beklenen Sonuç:**
- Chatbot kartları grid layout'ta görünmeli
- Stats kartları görünmeli (toplam chatbot, node, edge sayıları)
- Search bar görünmeli
- Filter dropdown görünmeli

---

### TEST-CHATBOTS-002: Arama Fonksiyonu
**Açıklama:** Chatbot'lar isimlerine göre aranabilmeli

**Adımlar:**
1. Sayfa yüklendikten sonra `browser_snapshot`
2. Search input'u bul
3. `browser_type` → Arama terimini yaz
4. `browser_wait_for` → time: 500 (debounce için)
5. `browser_snapshot` → Filtrelenmiş sonuçları kontrol et

**Beklenen Sonuç:**
- Arama terimine uyan chatbot'lar listelenmeli
- Uymayan chatbot'lar gizlenmeli

---

### TEST-CHATBOTS-003: Filter Değişikliği
**Açıklama:** Filter dropdown çalışmalı

**Adımlar:**
1. `browser_snapshot` → Filter dropdown'ı bul
2. `browser_click` → Filter dropdown'a tıkla
3. `browser_snapshot` → Seçenekleri gör (All/Active/Archived)
4. `browser_click` → "Active" seçeneğine tıkla
5. `browser_wait_for` → time: 500
6. `browser_snapshot` → Filtrelenmiş sonuçları kontrol et

**Beklenen Sonuç:**
- Sadece aktif chatbot'lar listelenmeli
- Filter badge güncellenmeli

---

### TEST-CHATBOTS-004: Chatbot Toggle (Active/Inactive)
**Açıklama:** Chatbot aktif/inaktif yapılabilmeli

**Adımlar:**
1. `browser_snapshot` → İlk chatbot kartını bul
2. Toggle switch'i bul
3. `browser_click` → Toggle'a tıkla
4. `browser_wait_for` → Toast notification veya durum değişikliği
5. `browser_snapshot` → Yeni durumu doğrula

**Beklenen Sonuç:**
- Toggle durumu değişmeli
- Toast notification gösterilmeli
- API çağrısı yapılmalı

---

### TEST-CHATBOTS-005: Chatbot Silme
**Açıklama:** Chatbot silinebilmeli (soft delete)

**Adımlar:**
1. `browser_snapshot` → İlk chatbot kartını bul
2. Sil butonunu bul (trash icon)
3. `browser_click` → Sil butonuna tıkla
4. `browser_wait_for` → Confirm dialog
5. `browser_snapshot` → Dialog'u doğrula
6. `browser_click` → Confirm butonuna tıkla
7. `browser_wait_for` → Toast notification
8. `browser_snapshot` → Chatbot'un listeden kaldırıldığını doğrula

**Beklenen Sonuç:**
- Confirm dialog gösterilmeli
- Chatbot listeden kaldırılmalı
- Success toast gösterilmeli

---

### TEST-CHATBOTS-006: Chatbot Export
**Açıklama:** Chatbot JSON olarak export edilebilmeli

**Adımlar:**
1. `browser_snapshot` → İlk chatbot kartını bul
2. Export butonunu bul
3. `browser_click` → Export butonuna tıkla
4. `browser_wait_for` → Download başlaması veya toast

**Beklenen Sonuç:**
- JSON dosyası indirilmeli
- Dosya adı chatbot ismini içermeli

---

### TEST-CHATBOTS-007: Chatbot Import
**Açıklama:** JSON dosyasından chatbot import edilebilmeli

**Adımlar:**
1. `browser_snapshot` → Import butonunu bul
2. `browser_click` → Import butonuna tıkla
3. `browser_file_upload` → JSON dosyası yükle
4. `browser_wait_for` → Import işlemi tamamlanması
5. `browser_snapshot` → Yeni chatbot'un listede olduğunu doğrula

**Beklenen Sonuç:**
- Chatbot başarıyla import edilmeli
- Success toast gösterilmeli
- Yeni chatbot listede görünmeli

---

### TEST-CHATBOTS-008: Pagination
**Açıklama:** Sayfalama çalışmalı

**Adımlar:**
1. `browser_snapshot` → Pagination kontrollerini bul
2. Sonraki sayfa butonuna tıkla
3. `browser_wait_for` → Yeni sayfa yüklenmesi
4. `browser_snapshot` → Farklı chatbot'ların listelendiğini doğrula

**Beklenen Sonuç:**
- Sayfa numarası değişmeli
- Farklı chatbot'lar listelenmeli
- URL güncellenmeli (query param)

---

### TEST-CHATBOTS-009: Empty State
**Açıklama:** Chatbot yoksa empty state gösterilmeli

**Adımlar:**
1. Tüm chatbot'ları sil veya filtrele (sonuç yok)
2. `browser_snapshot` → Empty state kontrolü

**Beklenen Sonuç:**
- "No chatbots found" mesajı görünmeli
- Create butonu görünmeli

---

### TEST-CHATBOTS-010: Create New ChatBot Butonu
**Açıklama:** Yeni chatbot oluşturma butonu çalışmalı

**Adımlar:**
1. `browser_snapshot` → Create butonu bul
2. `browser_click` → Create butonuna tıkla
3. `browser_wait_for` → Builder sayfası veya modal
4. `browser_snapshot` → Yeni durum

**Beklenen Sonuç:**
- Builder sayfasına yönlendirilmeli
- Yeni (boş) flow açılmalı

---

### TEST-CHATBOTS-011: Chatbot Düzenleme
**Açıklama:** Mevcut chatbot düzenlenebilmeli

**Adımlar:**
1. `browser_snapshot` → İlk chatbot kartını bul
2. Edit butonunu veya kartın kendisine tıkla
3. `browser_wait_for` → Builder sayfası
4. `browser_snapshot` → Flow'un yüklendiğini doğrula

**Beklenen Sonuç:**
- Builder sayfasına yönlendirilmeli
- Mevcut flow yüklenmeli
- Node'lar ve edge'ler görünmeli

---

## Sayfa Elementleri

```
- Stats Cards: Toplam chatbot, node, edge sayıları
- Search Bar: Arama inputu
- Filter Dropdown: All/Active/Archived
- Create Button: Yeni chatbot oluştur
- Import Button: JSON import
- Chatbot Cards: Grid layout
  - Card: Chatbot adı, açıklama, node/edge sayısı
  - Toggle: Active/Inactive
  - Edit Button: Düzenle
  - Export Button: JSON export
  - Delete Button: Sil
- Pagination: Sayfa kontrolü
- Toast Notifications: İşlem bildirimleri
```

---

## Test Verileri

```json
{
  "searchTerm": "test",
  "importFile": "chatbot-export.json",
  "filters": ["all", "active", "archived"]
}
```
