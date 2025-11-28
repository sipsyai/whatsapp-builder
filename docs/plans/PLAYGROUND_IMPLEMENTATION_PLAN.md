# WhatsApp Flows Playground - Implementation Plan

**Tarih:** 2025-11-28
**Tahmini Süre:** 8-13 gün
**Durum:** Planning

---

## Kullanıcı Tercihleri

- **Yaklaşım:** UX-focused (Meta Playground benzeri)
- **Editor:** JSON Editor + Form Editor (Toggle ile geçiş)
- **Entegrasyon:** Ayrı sayfa (FlowPlaygroundPage)

---

## Mevcut Altyapı

### Reuse Edilebilir Component'ler

| Component | Kaynak | Kullanım |
|-----------|--------|----------|
| `PhoneFrame` | `flow-builder/components/preview/PhoneFrame.tsx` | Preview panel |
| `FlowPreview` | `flow-builder/components/preview/FlowPreview.tsx` | Preview rendering |
| `ScreenPreview` | `flow-builder/components/preview/ScreenPreview.tsx` | Screen rendering |
| `useFlowBuilder` | `flow-builder/hooks/useFlowBuilder.ts` | State management |
| Component Renderers | `flow-builder/components/preview/renderers/*` | Component preview |

### Mevcut Pattern'ler

- **State Management:** Custom React hooks (useFlowBuilder)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Icons:** Material Symbols (Google Fonts)
- **DnD:** dnd-kit library

---

## Implementation Plan

### PHASE 1: Foundation & Types

#### TODO 1: TypeScript Types
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/flow-builder/components/playground/types/playground.types.ts`

**Görevler:**
1. PlaygroundScreen interface tanımla
2. PlaygroundComponent interface tanımla
3. PreviewSettings interface tanımla
4. EditorMode type ('json' | 'form') tanımla
5. ContentCategory ve ContentItem types tanımla

#### TODO 2: Content Categories Constants
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/flow-builder/components/playground/constants/contentCategories.ts`

**Görevler:**
1. CONTENT_CATEGORIES array oluştur (Text, Media, Text Answer, Selection)
2. Her kategori için items tanımla (component type, label, icon)
3. Component default values tanımla
4. getDefaultComponent helper function

---

### PHASE 2: State Management

#### TODO 3: usePlaygroundState Hook
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/flow-builder/components/playground/hooks/usePlaygroundState.ts`

**Görevler:**
1. useFlowBuilder hook'u wrap et
2. expandedComponentId state ekle
3. addContentMenuOpen state ekle
4. editorMode state ('json' | 'form') ekle
5. addComponentFromMenu helper function
6. Component expand/collapse logic

#### TODO 4: usePreviewSettings Hook
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/flow-builder/components/playground/hooks/usePreviewSettings.ts`

**Görevler:**
1. platform state ('android' | 'ios')
2. theme state ('light' | 'dark')
3. interactive state (boolean)
4. LocalStorage persistence
5. Setter functions

---

### PHASE 3: Layout & Screens Panel

#### TODO 5: PlaygroundPage Ana Component
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/flow-builder/FlowPlaygroundPage.tsx`

**Görevler:**
1. 3-panel layout (ScreensPanel, ContentEditor, PreviewPanel)
2. Header (flow name, save, export, close buttons)
3. usePlaygroundState integration
4. Responsive layout (lg: 3-panel, mobile: tabs)

#### TODO 6: ScreensPanel Component
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/flow-builder/components/playground/ScreensPanel/index.tsx`
- `frontend/src/features/flow-builder/components/playground/ScreensPanel/ScreenListItem.tsx`
- `frontend/src/features/flow-builder/components/playground/ScreensPanel/AddScreenButton.tsx`

**Görevler:**
1. Screen listesi (click to select)
2. Delete button per screen
3. Add new screen button
4. Active screen highlight
5. Screen count indicator

---

### PHASE 4: Content Editor (Form Mode)

#### TODO 7: ContentEditor Container
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/flow-builder/components/playground/ContentEditor/index.tsx`

**Görevler:**
1. Editor mode toggle (JSON/Form)
2. Screen title editor
3. Component accordion list
4. Add content button
5. Conditional rendering (JSON vs Form)

#### TODO 8: ComponentAccordion
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/flow-builder/components/playground/ContentEditor/ComponentAccordion.tsx`
- `frontend/src/features/flow-builder/components/playground/ContentEditor/ComponentAccordionItem.tsx`

**Görevler:**
1. Accordion container with animation
2. Component preview (collapsed: type + text)
3. Expand/collapse toggle
4. Delete/duplicate buttons
5. dnd-kit drag handle

#### TODO 9: Component Inline Editors
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/flow-builder/components/playground/ContentEditor/editors/TextHeadingEditor.tsx`
- `frontend/src/features/flow-builder/components/playground/ContentEditor/editors/TextInputEditor.tsx`
- `frontend/src/features/flow-builder/components/playground/ContentEditor/editors/DropdownEditor.tsx`
- `frontend/src/features/flow-builder/components/playground/ContentEditor/editors/RadioButtonsEditor.tsx`
- `frontend/src/features/flow-builder/components/playground/ContentEditor/editors/FooterEditor.tsx`
- `frontend/src/features/flow-builder/components/playground/ContentEditor/editors/index.ts`

**Görevler:**
1. Her component type için inline form
2. Mevcut ConfigModal form'larından adapt et
3. onChange handler ile real-time update
4. Validation feedback
5. Options editor (Dropdown, Radio için)

#### TODO 10: AddContentMenu
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/flow-builder/components/playground/ContentEditor/AddContentMenu.tsx`

**Görevler:**
1. Popover/dropdown trigger button
2. Category tabs (Text, Media, Text Answer, Selection)
3. Component items per category
4. Click to add component
5. Auto-expand new component

---

### PHASE 5: Content Editor (JSON Mode)

#### TODO 11: JSON Editor Integration
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/flow-builder/components/playground/ContentEditor/JSONEditor.tsx`

**Görevler:**
1. Monaco editor integration (@monaco-editor/react)
2. JSON syntax highlighting
3. Real-time validation
4. Error markers
5. Format/prettify button
6. Two-way sync (JSON ↔ BuilderScreen)

#### TODO 12: Validation Panel
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/flow-builder/components/playground/ContentEditor/ValidationPanel.tsx`

**Görevler:**
1. Error/warning list
2. Click to navigate to error line
3. Collapsible panel
4. Error count badge

---

### PHASE 6: Preview Panel

#### TODO 13: PreviewPanel Container
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/flow-builder/components/playground/PreviewPanel/index.tsx`

**Görevler:**
1. Preview header (Copy JSON, Settings)
2. Phone frame container
3. Screen navigation controls
4. Settings dropdown

#### TODO 14: PlatformPhoneFrame
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/flow-builder/components/playground/PreviewPanel/PlatformPhoneFrame.tsx`

**Görevler:**
1. iPhone frame (Dynamic Island style)
2. Android frame (punch-hole camera)
3. Theme support (light/dark)
4. Scale for small screens

#### TODO 15: PreviewSettings Dropdown
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/flow-builder/components/playground/PreviewPanel/PreviewSettings.tsx`

**Görevler:**
1. Platform toggle (Android/iOS)
2. Theme toggle (Light/Dark)
3. Interactive mode toggle
4. Dropdown UI with icons

#### TODO 16: CopyJsonButton
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/flow-builder/components/playground/PreviewPanel/CopyJsonButton.tsx`

**Görevler:**
1. Clipboard API integration
2. Copy success feedback (toast/icon change)
3. JSON formatting
4. Flow JSON generation

---

### PHASE 7: Navigation & Integration

#### TODO 17: App.tsx Route Integration
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/app/App.tsx`

**Görevler:**
1. 'playground' view state ekle
2. FlowPlaygroundPage render logic
3. playgroundFlowId state
4. handleOpenPlayground function

#### TODO 18: FlowsPage Integration
**Agent:** `react-expert`
**Dosyalar:**
- `frontend/src/features/flows/components/FlowsPage.tsx`

**Görevler:**
1. "Open in Playground" action button
2. Flow card dropdown menu update
3. onOpenPlayground callback
4. New flow in Playground option

---

### PHASE 8: Polish & Testing

#### TODO 19: Responsive Design
**Agent:** `react-expert`
**Dosyalar:**
- Tüm playground component'leri

**Görevler:**
1. Mobile tab-based layout
2. Breakpoint testing (768px, 1024px, 1280px)
3. Phone frame scaling
4. Touch-friendly interactions

#### TODO 20: Accessibility & UX
**Agent:** `react-expert`
**Dosyalar:**
- Tüm playground component'leri

**Görevler:**
1. Keyboard navigation
2. ARIA labels
3. Focus management
4. Loading states
5. Error handling
6. Animations (accordion, menu)

---

### PHASE 9: Dependencies

#### TODO 21: Install Monaco Editor
**Agent:** `manuel`
**Komut:**
```bash
cd frontend && npm install @monaco-editor/react
```

---

## Dosya Yapısı

```
frontend/src/features/flow-builder/
├── FlowBuilderPage.tsx              # Mevcut (değişmez)
├── FlowPlaygroundPage.tsx           # YENİ - Ana playground sayfası
├── components/
│   ├── playground/                  # YENİ klasör
│   │   ├── types/
│   │   │   └── playground.types.ts
│   │   ├── constants/
│   │   │   └── contentCategories.ts
│   │   ├── hooks/
│   │   │   ├── usePlaygroundState.ts
│   │   │   └── usePreviewSettings.ts
│   │   ├── ScreensPanel/
│   │   │   ├── index.tsx
│   │   │   ├── ScreenListItem.tsx
│   │   │   └── AddScreenButton.tsx
│   │   ├── ContentEditor/
│   │   │   ├── index.tsx
│   │   │   ├── ComponentAccordion.tsx
│   │   │   ├── ComponentAccordionItem.tsx
│   │   │   ├── AddContentMenu.tsx
│   │   │   ├── JSONEditor.tsx
│   │   │   ├── ValidationPanel.tsx
│   │   │   └── editors/
│   │   │       ├── index.ts
│   │   │       ├── TextHeadingEditor.tsx
│   │   │       ├── TextInputEditor.tsx
│   │   │       ├── DropdownEditor.tsx
│   │   │       ├── RadioButtonsEditor.tsx
│   │   │       └── FooterEditor.tsx
│   │   └── PreviewPanel/
│   │       ├── index.tsx
│   │       ├── PlatformPhoneFrame.tsx
│   │       ├── PreviewSettings.tsx
│   │       └── CopyJsonButton.tsx
│   └── ...existing components...
└── hooks/
    └── useFlowBuilder.ts            # Mevcut (kullanılacak)
```

---

## Agent Kullanım Özeti

| Agent | TODO'lar |
|-------|----------|
| react-expert | 1-10, 13-20 |
| manuel | 11, 21 |

---

## Paralel Çalıştırma Stratejisi

```
TODO 1, 2 (Types, Constants) → Paralel
↓
TODO 3, 4 (Hooks) → Paralel
↓
TODO 5, 6 (Layout, Screens) → Paralel
↓
TODO 7, 8, 9, 10 (Form Editor) → Sıralı (bağımlılık)
↓
TODO 11, 12 (JSON Editor) → Paralel
↓
TODO 13, 14, 15, 16 (Preview) → Paralel
↓
TODO 17, 18 (Integration) → Paralel
↓
TODO 19, 20 (Polish) → Paralel
↓
TODO 21 (Dependencies) → İlk başta
```

---

## Zaman Tahmini

| Phase | Süre | TODO'lar |
|-------|------|----------|
| Foundation | 1 gün | 1, 2, 21 |
| State Management | 1 gün | 3, 4 |
| Layout & Screens | 1 gün | 5, 6 |
| Form Editor | 2-3 gün | 7, 8, 9, 10 |
| JSON Editor | 1-2 gün | 11, 12 |
| Preview | 1-2 gün | 13, 14, 15, 16 |
| Integration | 1 gün | 17, 18 |
| Polish | 1-2 gün | 19, 20 |

**Toplam:** 9-14 gün

---

## Başarı Kriterleri

1. ✅ 3-panel layout (Screens, Editor, Preview)
2. ✅ JSON ve Form editor toggle
3. ✅ Accordion-based component editing
4. ✅ Add Content menu (4 kategori)
5. ✅ Real-time preview
6. ✅ Copy Flow JSON
7. ✅ Platform/Theme toggle
8. ✅ Responsive design
9. ✅ FlowsPage'den erişim
