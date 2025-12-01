# ChatBot Builder Sayfası Test Senaryoları

**URL:** http://localhost:5173/#builder
**Önkoşul:** Giriş yapılmış olmalı
**Öncelik:** P0 - Kritik

---

## Test Senaryoları

### TEST-BUILDER-001: Yeni Flow Oluşturma
**Açıklama:** Boş canvas ile yeni flow başlatılabilmeli

**Adımlar:**
1. `browser_navigate` → http://localhost:5173/#builder
2. `browser_wait_for` → Canvas yüklenmesi
3. `browser_snapshot` → Canvas ve sidebar kontrolü

**Beklenen Sonuç:**
- Boş canvas görünmeli
- START node görünmeli
- Sidebar'da node tipleri görünmeli
- Flow name inputu boş olmalı

---

### TEST-BUILDER-002: Node Ekleme (Sidebar'dan Tıklama)
**Açıklama:** Sidebar'dan node tipi seçilerek node eklenebilmeli

**Adımlar:**
1. `browser_snapshot` → Sidebar'daki node butonlarını bul
2. `browser_click` → "Message" node butonuna tıkla
3. `browser_wait_for` → Node eklenmesi
4. `browser_snapshot` → Yeni node'un canvas'ta olduğunu doğrula

**Beklenen Sonuç:**
- MESSAGE node canvas'a eklenmeli
- Node seçili durumda olmalı
- Config modal açılmalı (veya sağ panel aktif)

---

### TEST-BUILDER-003: Node Ekleme (Tüm Tipler)
**Açıklama:** Tüm node tipleri eklenebilmeli

**Adımlar:**
Her node tipi için:
1. `browser_click` → Node butonuna tıkla
2. `browser_snapshot` → Node eklendiğini doğrula

**Test Edilecek Node Tipleri:**
- MESSAGE
- QUESTION
- CONDITION
- WHATSAPP_FLOW
- REST_API

**Beklenen Sonuç:**
- Her tip node eklenebilmeli
- Her node kendi ikonuyla görünmeli

---

### TEST-BUILDER-004: Node Bağlama (Edge Oluşturma)
**Açıklama:** İki node arasında edge oluşturulabilmeli

**Adımlar:**
1. İki node ekle (MESSAGE, QUESTION)
2. `browser_snapshot` → Handle noktalarını bul
3. İlk node'un output handle'ından ikinci node'un input handle'ına sürükle
   - `browser_drag` → startRef: output handle, endRef: input handle
4. `browser_snapshot` → Edge'in oluştuğunu doğrula

**Beklenen Sonuç:**
- Edge iki node arasında görünmeli
- Edge seçilebilir olmalı

---

### TEST-BUILDER-005: Node Konfigürasyonu (MESSAGE)
**Açıklama:** MESSAGE node konfigürasyonu yapılabilmeli

**Adımlar:**
1. MESSAGE node'a çift tıkla veya config butonuna tıkla
2. `browser_wait_for` → Config modal/panel
3. `browser_snapshot` → Config formunu kontrol et
4. `browser_type` → Mesaj içeriğini yaz
5. `browser_click` → Save/Apply butonuna tıkla
6. `browser_snapshot` → Node'un güncellendiğini doğrula

**Beklenen Sonuç:**
- Config modal/panel açılmalı
- Mesaj tipi seçilebilmeli (text, image, video, etc.)
- Mesaj içeriği girilebilmeli
- Değişiklikler kaydedilmeli

---

### TEST-BUILDER-006: Node Konfigürasyonu (QUESTION)
**Açıklama:** QUESTION node konfigürasyonu yapılabilmeli

**Adımlar:**
1. QUESTION node'a çift tıkla
2. `browser_snapshot` → Config formunu kontrol et
3. Question type seç (text/buttons/list)
4. Soru metnini yaz
5. Eğer buttons/list ise seçenekleri ekle
6. Variable name belirle
7. Save

**Beklenen Sonuç:**
- Question type seçilebilmeli
- Seçenekler eklenebilmeli
- Variable mapping yapılabilmeli

---

### TEST-BUILDER-007: Node Konfigürasyonu (CONDITION)
**Açıklama:** CONDITION node konfigürasyonu yapılabilmeli

**Adımlar:**
1. CONDITION node'a çift tıkla
2. `browser_snapshot` → Config formunu kontrol et
3. Variable seç
4. Operator seç (equals, contains, greater, etc.)
5. Karşılaştırma değerini gir
6. Save

**Beklenen Sonuç:**
- Variable listesi görünmeli
- Operator seçilebilmeli
- Condition kaydedilmeli

---

### TEST-BUILDER-008: Node Silme
**Açıklama:** Node silinebilmeli

**Adımlar:**
1. `browser_snapshot` → Bir node bul
2. Node'u seç (tıkla)
3. Delete tuşuna bas veya sil butonuna tıkla
4. `browser_snapshot` → Node'un silindiğini doğrula

**Beklenen Sonuç:**
- Node canvas'tan kaldırılmalı
- Bağlı edge'ler de kaldırılmalı

---

### TEST-BUILDER-009: Edge Silme
**Açıklama:** Edge silinebilmeli

**Adımlar:**
1. `browser_snapshot` → Bir edge bul
2. Edge'i seç (tıkla)
3. Delete tuşuna bas veya sil butonuna tıkla
4. `browser_snapshot` → Edge'in silindiğini doğrula

**Beklenen Sonuç:**
- Edge kaldırılmalı
- Node'lar yerinde kalmalı

---

### TEST-BUILDER-010: Flow Kaydetme (Yeni)
**Açıklama:** Yeni flow kaydedilebilmeli

**Adımlar:**
1. Flow name inputuna isim yaz
2. Birkaç node ve edge ekle
3. Save butonuna tıkla
4. `browser_wait_for` → Toast notification veya success
5. `browser_snapshot` → Kayıt başarılı

**Beklenen Sonuç:**
- Flow kaydedilmeli
- Success toast gösterilmeli
- Flow ID oluşmalı

---

### TEST-BUILDER-011: Flow Güncelleme
**Açıklama:** Mevcut flow güncellenebilmeli

**Adımlar:**
1. ChatBots listesinden bir chatbot seç
2. Builder'da flow yüklensin
3. Bir node ekle veya değiştir
4. Save butonuna tıkla
5. `browser_wait_for` → Toast notification

**Beklenen Sonuç:**
- Değişiklikler kaydedilmeli
- Success toast gösterilmeli

---

### TEST-BUILDER-012: Validation Panel
**Açıklama:** Flow validasyonu çalışmalı

**Adımlar:**
1. Invalid bir flow oluştur (örn: node'lar bağlı değil)
2. `browser_snapshot` → Validation panel/badge kontrol et
3. Validation butonuna tıkla
4. `browser_snapshot` → Hataları listele

**Beklenen Sonuç:**
- Validation hataları listelenmeli
- Hatalı node'lar işaretlenmeli

---

### TEST-BUILDER-013: Auto Layout
**Açıklama:** Auto layout çalışmalı

**Adımlar:**
1. Birkaç node ekle (dağınık)
2. Auto layout dropdown'ı aç
3. Bir layout seçeneği seç (horizontal/vertical)
4. `browser_snapshot` → Node'ların yeniden düzenlendiğini doğrula

**Beklenen Sonuç:**
- Node'lar düzenli hale gelmeli
- Edge'ler korunmalı

---

### TEST-BUILDER-014: Test Mode
**Açıklama:** Test mode açılıp kapatılabilmeli

**Adımlar:**
1. Test butonuna tıkla
2. `browser_wait_for` → Test panel açılması
3. `browser_snapshot` → Test panel kontrolü
4. Test panel'i kapat

**Beklenen Sonuç:**
- Test panel açılmalı
- Flow simülasyonu yapılabilmeli
- Panel kapatılabilmeli

---

### TEST-BUILDER-015: Connection Validation
**Açıklama:** Geçersiz bağlantılar engelleneli

**Adımlar:**
1. Node'u kendi kendine bağlamaya çalış (self-loop)
2. `browser_snapshot` → Bağlantının engellenmesi

**Beklenen Sonuç:**
- Self-loop engelleneli
- START node silinememeli
- START node'a input bağlanamamalı

---

## Sayfa Elementleri

```
- Canvas: React Flow canvas
- Sidebar: Node palette
  - MESSAGE button
  - QUESTION button
  - CONDITION button
  - WHATSAPP_FLOW button
  - REST_API button
- Top Bar:
  - Flow name input
  - Description input
  - Save button
  - New button
  - Auto layout dropdown
  - Test button
  - Validation badge
- Node Config Modal/Panel
- Validation Panel
- AI Build Modal (Gemini)
```

---

## Node Tipleri

| Tip | Açıklama | Config Alanları |
|-----|----------|-----------------|
| START | Başlangıç node'u | (sabit) |
| MESSAGE | Mesaj gönder | type, content, buttons |
| QUESTION | Soru sor | type, question, variable, options |
| CONDITION | Koşul kontrolü | variable, operator, value |
| WHATSAPP_FLOW | WhatsApp Flow çağır | flowId |
| REST_API | API çağrısı | url, method, headers, body |
