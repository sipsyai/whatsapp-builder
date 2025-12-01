# Flow Builder Sayfası Test Senaryoları

**URL:** http://localhost:5173/#flowBuilder
**Önkoşul:** Giriş yapılmış olmalı, Flow seçilmiş olmalı
**Öncelik:** P1 - Yüksek

---

## Sayfa Yapısı

Flow Builder 3 panel layout kullanır:
- **Sol Panel:** Component Palette
- **Orta Panel:** Flow Canvas (React Flow)
- **Sağ Panel:** Screen Editor + Flow Preview

---

## Test Senaryoları

### TEST-FLOWBUILDER-001: Screen Ekleme
**Açıklama:** Yeni screen eklenebilmeli

**Adımlar:**
1. `browser_navigate` → http://localhost:5173/#flowBuilder (flow seçili)
2. `browser_wait_for` → Sayfa yüklenmesi
3. `browser_snapshot` → "Add Screen" butonunu bul
4. `browser_click` → Add Screen butonuna tıkla
5. `browser_wait_for` → Yeni screen
6. `browser_snapshot` → Screen eklendiğini doğrula

**Beklenen Sonuç:**
- Yeni screen oluşmalı
- Screen listesinde görünmeli
- Canvas'ta yeni node görünmeli

---

### TEST-FLOWBUILDER-002: Component Ekleme (Palette'den)
**Açıklama:** Palette'den component eklenebilmeli

**Adımlar:**
1. `browser_snapshot` → Component palette'i bul (sol panel)
2. Bir component seç (örn: TextHeading)
3. `browser_click` → Component'e tıkla
4. `browser_wait_for` → Component eklenmesi
5. `browser_snapshot` → Component'in sağ panelde olduğunu doğrula

**Beklenen Sonuç:**
- Component screen'e eklenmeli
- Sağ panelde config görünmeli

---

### TEST-FLOWBUILDER-003: Component Sırası Değiştirme
**Açıklama:** Component'ler sürükle-bırak ile sıralanabilmeli

**Adımlar:**
1. Birden fazla component ekle
2. `browser_snapshot` → Component listesini bul
3. `browser_drag` → Bir component'i başka bir konuma sürükle
4. `browser_snapshot` → Yeni sırayı doğrula

**Beklenen Sonuç:**
- Component yeni konuma taşınmalı
- Diğer component'ler yer değiştirmeli

---

### TEST-FLOWBUILDER-004: Component Konfigürasyonu
**Açıklama:** Component ayarları yapılabilmeli

**Adımlar:**
1. Bir component seç (tıkla)
2. `browser_snapshot` → Config panelini kontrol et
3. Bir config değeri değiştir (örn: text içeriği)
4. `browser_snapshot` → Değişikliği doğrula

**Beklenen Sonuç:**
- Config panel görünmeli
- Değişiklikler uygulanmalı
- Preview güncellemeli

---

### TEST-FLOWBUILDER-005: Component Silme
**Açıklama:** Component silinebilmeli

**Adımlar:**
1. Bir component seç
2. Delete butonuna tıkla
3. `browser_snapshot` → Component silindiğini doğrula

**Beklenen Sonuç:**
- Component kaldırılmalı
- Diğer component'ler yerinde kalmalı

---

### TEST-FLOWBUILDER-006: Component Duplicate
**Açıklama:** Component kopyalanabilmeli

**Adımlar:**
1. Bir component seç
2. `browser_snapshot` → Duplicate butonunu bul
3. `browser_click` → Duplicate butonuna tıkla
4. `browser_snapshot` → Yeni component

**Beklenen Sonuç:**
- Aynı component bir daha eklenmeli
- Konfigürasyon kopyalanmalı

---

### TEST-FLOWBUILDER-007: Flow Kaydetme
**Açıklama:** Flow kaydedilebilmeli

**Adımlar:**
1. Birkaç değişiklik yap
2. `browser_snapshot` → Save butonunu bul
3. `browser_click` → Save butonuna tıkla
4. `browser_wait_for` → Toast notification
5. `browser_snapshot` → Başarı mesajı

**Beklenen Sonuç:**
- Flow kaydedilmeli
- Success toast gösterilmeli

---

### TEST-FLOWBUILDER-008: JSON Export
**Açıklama:** Flow JSON olarak export edilebilmeli

**Adımlar:**
1. `browser_snapshot` → Export butonunu bul
2. `browser_click` → Export butonuna tıkla
3. `browser_wait_for` → Download veya modal

**Beklenen Sonuç:**
- JSON dosyası indirilmeli
- Valid Flow JSON formatında olmalı

---

### TEST-FLOWBUILDER-009: Validation Panel
**Açıklama:** Validation hataları gösterilmeli

**Adımlar:**
1. Invalid bir flow oluştur (örn: boş required field)
2. `browser_snapshot` → Validation panel/banner kontrol et
3. Varsa validation butonuna tıkla

**Beklenen Sonuç:**
- Validation hataları listelenmeli
- Hatalı component'ler işaretlenmeli

---

### TEST-FLOWBUILDER-010: Screen Seçme
**Açıklama:** Farklı screen'ler seçilebilmeli

**Adımlar:**
1. Birden fazla screen oluştur
2. `browser_snapshot` → Screen listesini bul
3. `browser_click` → Farklı bir screen'e tıkla
4. `browser_snapshot` → Seçilen screen'in component'leri

**Beklenen Sonuç:**
- Screen seçimi değişmeli
- Sağ panel güncellemeli
- Canvas'ta seçili node vurgulanmalı

---

### TEST-FLOWBUILDER-011: Canvas Zoom/Pan
**Açıklama:** Canvas zoom ve pan yapılabilmeli

**Adımlar:**
1. `browser_snapshot` → Canvas kontrolleri
2. Zoom in/out butonlarına tıkla
3. Canvas'ı sürükle (pan)

**Beklenen Sonuç:**
- Zoom çalışmalı
- Pan çalışmalı
- Fit to view çalışmalı

---

### TEST-FLOWBUILDER-012: Screen Bağlama
**Açıklama:** Screen'ler birbirine bağlanabilmeli

**Adımlar:**
1. İki screen oluştur
2. Canvas'ta birinci screen'in output'unu ikincisinin input'una bağla
3. `browser_snapshot` → Edge oluştuğunu doğrula

**Beklenen Sonuç:**
- Edge oluşmalı
- Routing yapılandırılmalı

---

## Component Tipleri

| Component | Açıklama | Config Alanları |
|-----------|----------|-----------------|
| TextHeading | Başlık metni | text (max 60 char) |
| TextSubheading | Alt başlık | text (max 60 char) |
| TextBody | Gövde metni | text (max 80 char) |
| TextCaption | Küçük metin | text (max 80 char) |
| TextInput | Metin girişi | label, name, required, inputType |
| TextArea | Çok satırlı giriş | label, name, required |
| DatePicker | Tarih seçici | label, name, required |
| Dropdown | Açılır liste | label, name, dataSource, required |
| RadioButtons | Radyo butonları | label, name, dataSource, required |
| CheckboxGroup | Onay kutuları | label, name, dataSource, required |
| OptIn | Onay checkbox'ı | label, name, required |
| Image | Görsel | src, width, height, aspectRatio |
| EmbeddedLink | Gömülü link | text, url, onClickAction |
| Footer | Sayfa footer'ı | label, onClickAction, enabled |

---

## Sayfa Elementleri

```
- Left Panel: Component Palette
  - Basic: TextHeading, TextSubheading, TextBody, TextCaption
  - Inputs: TextInput, TextArea, DatePicker, Dropdown
  - Selections: RadioButtons, CheckboxGroup, OptIn
  - Media: Image, EmbeddedLink
  - Navigation: Footer

- Center Panel: Flow Canvas
  - Screen Nodes
  - Edges (connections)
  - Zoom controls
  - Minimap

- Right Panel: Screen Editor
  - Screen name
  - Component list (reorderable)
  - Component config accordion
  - Add component button

- Bottom Right: Preview Panel
  - Phone mockup (iOS/Android)
  - Theme toggle (light/dark)
```
