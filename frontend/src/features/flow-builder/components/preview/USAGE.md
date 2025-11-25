# FlowPreview - Kullanım Kılavuzu

WhatsApp Flow Builder için oluşturulmuş interaktif preview container'ı.

## Dosya Yapısı

```
preview/
├── FlowPreview.tsx              # Ana container (navigation, form state yönetimi)
├── PhoneFrame.tsx               # iPhone 14 mock frame
├── ScreenPreview.tsx            # Tek screen render (header, body, footer)
├── FlowPreview.example.tsx      # Kullanım örnekleri
├── index.ts                     # Export dosyası
├── README.md                    # İngilizce dokümantasyon
├── USAGE.md                     # Bu dosya
└── renderers/                   # Component renderer'lar (önceden oluşturulmuş)
    ├── TextRenderers.tsx
    ├── InputRenderers.tsx
    ├── SelectionRenderers.tsx
    ├── ActionRenderers.tsx
    └── index.ts
```

## Oluşturulan Component'lar

### 1. FlowPreview (Ana Container)

**Özellikler:**
- Screen'ler arası navigation
- Form state management (tüm flow boyunca)
- Navigation history (geri butonu için)
- Reset functionality
- Debug panel (development mode)

**Props:**
```typescript
interface FlowPreviewProps {
  screens: BuilderScreen[];        // Flow içindeki tüm screen'ler
  currentScreenId: string;         // Aktif screen ID
  onNavigate: (screenId: string) => void;  // Screen değişikliği callback
  onComplete: (payload: any) => void;      // Flow tamamlandığında callback
}
```

**Kullanım:**
```tsx
import { FlowPreview } from '@/features/flow-builder/components/preview';

function MyFlowBuilder() {
  const [currentScreen, setCurrentScreen] = useState('WELCOME');

  return (
    <FlowPreview
      screens={myScreens}
      currentScreenId={currentScreen}
      onNavigate={setCurrentScreen}
      onComplete={(data) => {
        console.log('Flow completed with data:', data);
      }}
    />
  );
}
```

### 2. PhoneFrame (iPhone Mock)

**Özellikler:**
- iPhone 14 benzeri design
- Dynamic Island (notch)
- Status bar (time, battery, wifi, signal)
- Rounded corners (40px)
- Dark mode support
- Responsive (max-height: calc(100vh - 100px))

**Kullanım:**
```tsx
import { PhoneFrame } from '@/features/flow-builder/components/preview';

<PhoneFrame>
  {/* İçerik buraya */}
</PhoneFrame>
```

### 3. ScreenPreview (Screen Renderer)

**Özellikler:**
- WhatsApp yeşil header (back button, title, menu)
- Scrollable body (component'ları render eder)
- Fixed footer (Footer component varsa)
- Form data binding

**Kullanım:**
```tsx
import { ScreenPreview } from '@/features/flow-builder/components/preview';

<ScreenPreview
  screen={currentScreen}
  formData={formData}
  onFormDataChange={(field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }}
  onNavigate={(screenId, payload) => {}}
  onComplete={(payload) => {}}
/>
```

## Desteklenen Component'lar

Preview aşağıdaki WhatsApp Flow component'larını render edebilir:

### Text Components
- ✅ `TextHeading` - Büyük başlık
- ✅ `TextSubheading` - Orta başlık
- ✅ `TextBody` - Gövde metni (bold, italic, strikethrough)
- ✅ `TextCaption` - Küçük açıklama metni

### Input Components
- ✅ `TextInput` - Tek satır input (email, password, phone, etc.)
- ✅ `TextArea` - Çok satırlı input

### Selection Components
- ✅ `CheckboxGroup` - Çoklu seçim
- ✅ `RadioButtonsGroup` - Tek seçim
- ✅ `Dropdown` - Açılır menü
- ✅ `ChipsSelector` - Chip seçimi

### Action Components
- ✅ `Footer` - Alt buton (navigate, complete action)
- ✅ `OptIn` - Onay checkbox'ı
- ✅ `EmbeddedLink` - Tıklanabilir link

### Date Components
- ⚠️ `DatePicker` - Tarih seçimi (basit input olarak)
- ❌ `CalendarPicker` - Takvim (henüz yok)

### Media Components
- ⚠️ `Image` - Resim gösterimi (basit)
- ❌ `ImageCarousel` - Resim carousel (henüz yok)

### Conditional & Navigation
- ❌ `If` - Koşullu render (henüz yok)
- ❌ `Switch` - Switch case (henüz yok)
- ❌ `NavigationList` - Navigation listesi (henüz yok)

## Tema ve Renkler

### WhatsApp Yeşil
```css
/* Primary Green */
--whatsapp-green: #00a884;

/* Header Background */
background: #00a884;

/* Button Hover */
background: #00987a;

/* Button Active */
background: #008970;
```

### Light Mode
```css
/* Background */
--bg-main: #f3f4f6;
--bg-card: #ffffff;
--bg-input: #ffffff;

/* Text */
--text-primary: #111827;
--text-secondary: #6b7280;
```

### Dark Mode
```css
/* Background */
--bg-main: #0d1912;
--bg-card: #112217;
--bg-input: #193322;

/* Text */
--text-primary: #ffffff;
--text-secondary: #9ca3af;
```

## Form State Yönetimi

FlowPreview form state'i otomatik yönetir:

```typescript
// Form data structure
{
  "full_name": "Ali Veli",
  "email": "ali@example.com",
  "interests": ["tech", "sports"],  // CheckboxGroup
  "account_type": "personal",       // RadioButtonsGroup
  "country": "tr",                  // Dropdown
  "date_of_birth": "1990-01-01",   // DatePicker
  "terms_accepted": true            // OptIn
}
```

## Navigation Yönetimi

### Navigate Action
Footer button ile başka screen'e geçiş:

```tsx
{
  type: 'Footer',
  label: 'Devam Et',
  'on-click-action': {
    name: 'navigate',
    next: {
      type: 'screen',
      name: 'NEXT_SCREEN_ID'
    },
    payload: {
      // Opsiyonel: form data'ya eklenecek data
      previous_screen: 'CURRENT_SCREEN'
    }
  }
}
```

### Complete Action
Flow'u tamamla:

```tsx
{
  type: 'Footer',
  label: 'Tamamla',
  'on-click-action': {
    name: 'complete',
    payload: {
      // Opsiyonel: final payload
      completed_at: new Date().toISOString()
    }
  }
}
```

### Navigation History
FlowPreview geri butonunu destekler:
- Her navigation history'ye eklenir
- Back button bir önceki screen'e döner
- Reset button ilk screen'e döner

## Debug Panel

Development mode'da debug panel aktif:

```tsx
// .env
NODE_ENV=development
```

Debug panel gösterir:
- Current screen ID
- Navigation history (screen1 → screen2 → screen3)
- Form data (JSON format)

## Kullanım Örnekleri

### Örnek 1: Basit İki Screen Flow

```tsx
const screens = [
  {
    id: 'WELCOME',
    title: 'Hoş Geldiniz',
    components: [
      {
        id: 'h1',
        type: 'TextHeading',
        config: { text: 'Kayıt Olun' }
      },
      {
        id: 'input1',
        type: 'TextInput',
        config: {
          label: 'İsim',
          name: 'name',
          required: true
        }
      },
      {
        id: 'footer1',
        type: 'Footer',
        config: {
          label: 'Devam',
          'on-click-action': {
            name: 'navigate',
            next: { type: 'screen', name: 'COMPLETE' }
          }
        }
      }
    ]
  },
  {
    id: 'COMPLETE',
    title: 'Tamamlandı',
    terminal: true,
    components: [
      {
        id: 'h2',
        type: 'TextHeading',
        config: { text: 'Başarılı!' }
      },
      {
        id: 'footer2',
        type: 'Footer',
        config: {
          label: 'Bitir',
          'on-click-action': {
            name: 'complete',
            payload: {}
          }
        }
      }
    ]
  }
];
```

### Örnek 2: Checkbox ve Radio ile Form

```tsx
const surveyScreen = {
  id: 'SURVEY',
  title: 'Anket',
  components: [
    {
      id: 'q1',
      type: 'RadioButtonsGroup',
      config: {
        label: 'Memnuniyet düzeyiniz?',
        name: 'satisfaction',
        'data-source': [
          { id: 'very_satisfied', title: 'Çok Memnun' },
          { id: 'satisfied', title: 'Memnun' },
          { id: 'neutral', title: 'Kararsız' }
        ]
      }
    },
    {
      id: 'q2',
      type: 'CheckboxGroup',
      config: {
        label: 'İlgi alanlarınız',
        name: 'interests',
        'data-source': [
          { id: 'tech', title: 'Teknoloji' },
          { id: 'sports', title: 'Spor' },
          { id: 'art', title: 'Sanat' }
        ]
      }
    }
  ]
};
```

## Integration

FlowBuilder'a entegrasyon:

```tsx
// FlowBuilder component içinde
function FlowBuilder() {
  const [mode, setMode] = useState<'design' | 'preview'>('design');
  const [screens, setScreens] = useState<BuilderScreen[]>([]);
  const [currentScreen, setCurrentScreen] = useState('');

  return (
    <div className="flex h-screen">
      {/* Sol: Canvas/Editor */}
      <div className="flex-1">
        {mode === 'design' ? (
          <FlowCanvas screens={screens} />
        ) : (
          <FlowPreview
            screens={screens}
            currentScreenId={currentScreen}
            onNavigate={setCurrentScreen}
            onComplete={(data) => {
              console.log('Flow completed:', data);
              setMode('design');
            }}
          />
        )}
      </div>

      {/* Sağ: Properties Panel */}
      <div className="w-96">
        <ScreenEditor />
      </div>
    </div>
  );
}
```

## Tips & Best Practices

1. **Screen Order**: İlk screen ID'yi currentScreenId'ye verin
2. **Terminal Screens**: Complete action'lı screen'leri terminal olarak işaretleyin
3. **Validation**: Preview validation enforce etmez, sadece gösterir
4. **Dynamic Strings**: `${data.field}` syntax'ı evaluate edilmez, olduğu gibi gösterilir
5. **Form Reset**: Reset button hem navigation hem form data'yı resetler
6. **Mobile View**: PhoneFrame max-width 390px (iPhone 14)
7. **Dark Mode**: Parent container'a `dark` class ekleyin

## Bilinen Limitasyonlar

1. **Dynamic Strings**: Data binding çalışmaz (static preview)
2. **Data API**: Data exchange action'lar console'a log'lanır ama çalışmaz
3. **Conditional Rendering**: If/Switch component'ları desteklenmez
4. **Image Upload**: Sadece base64/URL gösterimi var, upload yok
5. **Validation**: Input validation visual olarak gösterilir ama enforce edilmez

## Troubleshooting

### Problem: Component görünmüyor
**Çözüm**: Component'in `visible` property'sini kontrol edin.

### Problem: Form data kayboldu
**Çözüm**: FlowPreview component'ı unmount oldu, state dışarıda tutun.

### Problem: Navigation çalışmıyor
**Çözüm**: Footer'da `on-click-action` doğru mu kontrol edin.

### Problem: Dark mode çalışmıyor
**Çözüm**: Parent container'a `dark` class ekleyin.

## Gelecek Geliştirmeler

- [ ] ImageCarousel component support
- [ ] CalendarPicker component support
- [ ] If/Switch conditional rendering
- [ ] NavigationList component
- [ ] Dynamic string evaluation (data binding)
- [ ] Real-time data exchange preview
- [ ] Validation enforcement
- [ ] Tablet/iPad frame option
- [ ] Custom theme support
- [ ] Export preview as image/video

## İletişim & Destek

Sorular veya öneriler için:
- GitHub Issues
- Project documentation
- Team Slack channel

---

**Not**: Bu preview component'ı development ve test amaçlıdır. Production'da gerçek WhatsApp Flow API kullanılmalıdır.
