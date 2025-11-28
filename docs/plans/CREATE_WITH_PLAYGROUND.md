# Create with Playground - Implementation Plan

## Kullanıcı Tercihleri
- **Template:** Hayır, doğrudan boş Playground aç
- **Kaydetme:** İsim + Kategoriler
- **Güvenlik:** Basit tutulsun (unsaved changes uyarısı yok)

## Mevcut Altyapı
- FlowsPage'de "Create Flow" butonu modal açıyor
- Playground'a mevcut flow ile gidilebiliyor (`onOpenPlayground`)
- Backend'de `POST /api/flows` endpoint'i mevcut
- `useFlowBuilder` hook'u boş flow ile başlayabiliyor

## Implementation Plan

### TODO 1: FlowsPage.tsx - Interface Güncellemesi
**Agent:** `react-expert`
**Dosya:** `/home/ali/whatsapp-builder/frontend/src/features/flows/components/FlowsPage.tsx`

**Görevler:**
1. `FlowsPageProps` interface'inde `onOpenPlayground` tipini güncelle: `(flow: WhatsAppFlow | null) => void`
2. Header bölümüne "Create with Playground" butonu ekle (satır 104-129 arası)
3. Buton tıklandığında `onOpenPlayground(null)` çağrılsın

---

### TODO 2: App.tsx - Playground Create Mode Desteği
**Agent:** `react-expert`
**Dosya:** `/home/ali/whatsapp-builder/frontend/src/app/App.tsx`

**Görevler:**
1. `playgroundFlow` state'ini `WhatsAppFlow | null` tipine güncelle
2. `onOpenPlayground` callback'ini null değer alacak şekilde güncelle
3. Playground render koşulunu güncelle (`playgroundFlow &&` yerine `view === "playground"`)
4. `initialFlow` prop'unu null flow durumunda undefined gönder

---

### TODO 3: SaveFlowModal Komponenti Oluştur
**Agent:** `react-expert`
**Dosya:** `/home/ali/whatsapp-builder/frontend/src/features/flow-builder/components/playground/modals/SaveFlowModal.tsx`

**Görevler:**
1. Modal komponenti oluştur:
   - Flow adı input (zorunlu)
   - Kategoriler seçimi (en az 1 zorunlu, checkbox/multi-select)
2. Validation: İsim boş olamaz, en az 1 kategori seçilmeli
3. Submit callback: `onSave({ name, categories })`
4. Cancel callback: `onClose()`

---

### TODO 4: FlowPlaygroundPage - Create Mode Entegrasyonu
**Agent:** `react-expert`
**Dosya:** `/home/ali/whatsapp-builder/frontend/src/features/flow-builder/FlowPlaygroundPage.tsx`

**Görevler:**
1. `mode: 'create' | 'edit'` prop'u ekle (default: 'edit')
2. Create mode'da Save butonuna tıklandığında SaveFlowModal aç
3. Modal onaylandığında `onSave` callback'ini çağır (name, categories ile)
4. Export/index.ts dosyasından SaveFlowModal'ı export et

---

### TODO 5: App.tsx - onSave Logic Güncellemesi
**Agent:** `react-expert`
**Dosya:** `/home/ali/whatsapp-builder/frontend/src/app/App.tsx`

**Görevler:**
1. `onSave` callback'ini güncelle:
   - `playgroundFlow === null` ise `flowsApi.create()` çağır
   - `playgroundFlow !== null` ise `flowsApi.update()` çağır
2. Create durumunda kategorileri modal'dan al
3. Başarılı kayıt sonrası FlowsPage'e dön

---

### TODO 6: WhatsApp Flow Categories Enum/Type
**Agent:** `react-expert`
**Dosya:** `/home/ali/whatsapp-builder/frontend/src/features/flow-builder/types/flow.types.ts` (veya mevcut types dosyası)

**Görevler:**
1. `WhatsAppFlowCategory` enum'unu frontend'e ekle (backend'deki ile aynı)
2. SaveFlowModal'da kullanılacak kategori listesi

---

## Agent Kullanım Özeti

| Agent | TODO'lar |
|-------|----------|
| react-expert | 1, 2, 3, 4, 5, 6 |

## Paralel Çalıştırma Stratejisi

```
TODO 1, 2 (FlowsPage, App.tsx interface) → Paralel
TODO 3 (SaveFlowModal) → Bağımsız, paralel
TODO 6 (Types) → Bağımsız, paralel
---
TODO 4 (FlowPlaygroundPage) → TODO 3'e bağlı
TODO 5 (App.tsx onSave) → TODO 3, 4'e bağlı
```

## Akış Diyagramı

```
FlowsPage
    |
    +-- "Create with Playground" buton tıkla
    |
    v
App.tsx: setPlaygroundFlow(null), setView("playground")
    |
    v
FlowPlaygroundPage (mode: 'create', initialFlow: undefined)
    |
    +-- useFlowBuilder boş flow ile başlar
    |
    +-- Kullanıcı flow oluşturur
    |
    +-- "Save" buton tıkla
    |        |
    v        v
SaveFlowModal açılır
    |
    +-- İsim gir
    +-- Kategorileri seç
    +-- "Save" tıkla
    |
    v
App.tsx: onSave callback
    |
    +-- flowsApi.create({ name, categories, flowJson })
    +-- setView("flows")
    |
    v
FlowsPage (yeni flow listede görünür)
```

## Notlar

- Backend değişikliği gerekmiyor - mevcut `POST /api/flows` endpoint'i yeterli
- Şema değişikliği gerekmiyor - `flowJson` kolonu JSONB, Playground JSON'u saklar
- Template desteği gelecekte eklenebilir (şimdilik kapsam dışı)
- Auto-save gelecekte eklenebilir (şimdilik kapsam dışı)
