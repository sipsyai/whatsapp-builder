# Flow Playground Sayfası Test Senaryoları

**URL:** http://localhost:5173/#playground
**Önkoşul:** Giriş yapılmış olmalı
**Öncelik:** P2 - Orta

---

## Sayfa Yapısı

Flow Playground 3 panel layout kullanır:
- **Sol Panel:** Screens listesi
- **Orta Panel:** Content Editor (component düzenleme)
- **Sağ Panel:** Preview (telefon mockup)

---

## Test Senaryoları

### TEST-PLAYGROUND-001: Screen Ekleme
**Açıklama:** Yeni screen eklenebilmeli

**Adımlar:**
1. `browser_navigate` → http://localhost:5173/#playground
2. `browser_wait_for` → Sayfa yüklenmesi
3. `browser_snapshot` → "Add Screen" butonunu bul
4. `browser_click` → Add Screen
5. `browser_snapshot` → Yeni screen eklendi

**Beklenen Sonuç:**
- Yeni screen sol panelde görünmeli
- Screen seçili durumda olmalı
- İsim düzenlenebilir olmalı

---

### TEST-PLAYGROUND-002: Screen Silme
**Açıklama:** Screen silinebilmeli

**Adımlar:**
1. Bir screen seç
2. `browser_snapshot` → Delete butonunu bul
3. `browser_click` → Delete butonuna tıkla
4. `browser_snapshot` → Screen silindi

**Beklenen Sonuç:**
- Screen listeden kaldırılmalı
- Başka screen seçilmeli (veya empty state)

---

### TEST-PLAYGROUND-003: Screen Duplicate
**Açıklama:** Screen kopyalanabilmeli

**Adımlar:**
1. Component'li bir screen seç
2. `browser_snapshot` → Duplicate butonunu bul
3. `browser_click` → Duplicate
4. `browser_snapshot` → Yeni screen

**Beklenen Sonuç:**
- Screen kopyalanmalı
- Tüm component'ler kopyalanmalı
- İsim "(Copy)" suffix'li olmalı

---

### TEST-PLAYGROUND-004: Component Ekleme (Menu)
**Açıklama:** Component menüsünden ekleme yapılabilmeli

**Adımlar:**
1. Bir screen seç
2. `browser_snapshot` → "Add Component" butonunu bul
3. `browser_click` → Add Component
4. `browser_wait_for` → Component menüsü
5. `browser_snapshot` → Menü seçenekleri
6. Bir component seç (örn: TextHeading)
7. `browser_snapshot` → Component eklendi

**Beklenen Sonuç:**
- Menü açılmalı
- Component kategorileri görünmeli
- Seçilen component eklenmeli

---

### TEST-PLAYGROUND-005: Component Konfigürasyonu (Accordion)
**Açıklama:** Component accordion ile yapılandırılabilmeli

**Adımlar:**
1. Bir component ekle
2. `browser_snapshot` → Accordion header'ı bul
3. `browser_click` → Accordion'u aç
4. `browser_snapshot` → Config form
5. Bir değer değiştir
6. `browser_snapshot` → Preview güncellemesi

**Beklenen Sonuç:**
- Accordion açılmalı
- Config alanları görünmeli
- Değişiklikler preview'da görünmeli

---

### TEST-PLAYGROUND-006: Component Silme
**Açıklama:** Component silinebilmeli

**Adımlar:**
1. Bir component accordion'unda delete butonunu bul
2. `browser_click` → Delete
3. `browser_snapshot` → Component silindi

**Beklenen Sonuç:**
- Component kaldırılmalı
- Preview güncellemeli

---

### TEST-PLAYGROUND-007: Component Sırası Değiştirme
**Açıklama:** Component'ler sürüklenebilmeli

**Adımlar:**
1. Birden fazla component ekle
2. `browser_drag` → Bir component'i yukarı/aşağı taşı
3. `browser_snapshot` → Yeni sıra

**Beklenen Sonuç:**
- Component yeni konumda
- Preview güncellemeli

---

### TEST-PLAYGROUND-008: Meta API Validation
**Açıklama:** Meta API ile validation yapılabilmeli

**Adımlar:**
1. Valid bir flow oluştur
2. `browser_snapshot` → Validate butonunu bul
3. `browser_click` → Validate
4. `browser_wait_for` → Validation sonucu
5. `browser_snapshot` → Sonuç (success/error)

**Beklenen Sonuç:**
- Validation API'ye istek gitmeli
- Sonuç gösterilmeli
- Hatalar varsa listelenmeli

---

### TEST-PLAYGROUND-009: Flow Kaydetme (Create Mode)
**Açıklama:** Yeni flow kaydedilebilmeli

**Adımlar:**
1. Birkaç screen ve component ekle
2. `browser_snapshot` → Save butonunu bul
3. `browser_click` → Save
4. `browser_wait_for` → Save modal
5. `browser_type` → Flow name gir
6. Kategori seç
7. `browser_click` → Save confirm
8. `browser_wait_for` → Success toast

**Beklenen Sonuç:**
- Save modal açılmalı
- Flow kaydedilmeli
- Flows listesine yönlendirilmeli

---

### TEST-PLAYGROUND-010: Flow Kaydetme (Edit Mode)
**Açıklama:** Mevcut flow güncellenebilmeli

**Adımlar:**
1. Bir flow'u edit için aç
2. Değişiklikler yap
3. `browser_click` → Save
4. `browser_wait_for` → Success toast

**Beklenen Sonuç:**
- Değişiklikler kaydedilmeli
- Sayfada kalmalı

---

### TEST-PLAYGROUND-011: JSON Export
**Açıklama:** Flow JSON olarak export edilebilmeli

**Adımlar:**
1. Valid bir flow oluştur
2. `browser_snapshot` → Export butonunu bul
3. `browser_click` → Export
4. `browser_wait_for` → Download

**Beklenen Sonuç:**
- JSON dosyası indirilmeli
- Valid WhatsApp Flow JSON formatında

---

### TEST-PLAYGROUND-012: Preview Platform Değişikliği
**Açıklama:** iOS/Android preview seçilebilmeli

**Adımlar:**
1. `browser_snapshot` → Platform toggle bul
2. `browser_click` → Farklı platform seç
3. `browser_snapshot` → Preview değişti

**Beklenen Sonuç:**
- Platform değişmeli
- Telefon mockup değişmeli

---

### TEST-PLAYGROUND-013: Preview Tema Değişikliği
**Açıklama:** Light/Dark tema seçilebilmeli

**Adımlar:**
1. `browser_snapshot` → Theme toggle bul
2. `browser_click` → Dark theme
3. `browser_snapshot` → Preview değişti

**Beklenen Sonuç:**
- Tema değişmeli
- Preview renkleri değişmeli

---

### TEST-PLAYGROUND-014: Mobile Responsive Tabs
**Açıklama:** Mobil görünümde tab'lar çalışmalı

**Adımlar:**
1. `browser_resize` → width: 768 (mobile)
2. `browser_snapshot` → Tab bar görünümü
3. Tab'lar arasında geçiş yap

**Beklenen Sonuç:**
- 3 tab görünmeli: Screens, Editor, Preview
- Tab değişimi çalışmalı

---

## Sayfa Elementleri

```
- Left Panel: Screens Panel
  - Add Screen button
  - Screen list
    - Screen card
      - Name (editable)
      - Drag handle
      - Actions (duplicate, delete)

- Center Panel: Content Editor
  - Screen title
  - Component list (accordions)
    - Component accordion
      - Header (name, type icon)
      - Actions (up, down, duplicate, delete)
      - Config form
  - Add Component button
  - Validation banner

- Right Panel: Preview
  - Phone mockup
  - Platform toggle (iOS/Android)
  - Theme toggle (light/dark)
  - Navigation controls
```

---

## Component Categories

```
Basic:
  - TextHeading
  - TextSubheading
  - TextBody
  - TextCaption

Inputs:
  - TextInput
  - TextArea
  - DatePicker
  - Dropdown

Selections:
  - RadioButtons
  - CheckboxGroup
  - OptIn

Media:
  - Image
  - EmbeddedLink

Navigation:
  - Footer
```
