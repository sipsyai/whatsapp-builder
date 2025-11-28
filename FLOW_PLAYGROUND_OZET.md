# WhatsApp Flows Playground - Analiz Özeti

## Genel Bakış

WhatsApp Flows Playground, kullanıcıların görsel bir arayüzde drag-and-drop ile WhatsApp Flows oluşturmasını ve otomatik olarak Flow JSON v7.2 üretmesini sağlayacak bir özelliktir.

## 1. Flow JSON v7.2 Yapısı

### Temel Yapı
```json
{
  "version": "7.2",
  "data_api_version": "4.0",  // Endpoint kullanıyorsa zorunlu
  "routing_model": {           // Endpoint kullanıyorsa zorunlu
    "EKRAN_1": ["EKRAN_2"],
    "EKRAN_2": []
  },
  "screens": [...]             // Ekranlar dizisi
}
```

### Ekran Yapısı
```json
{
  "id": "EKRAN_ADI",           // Zorunlu: Benzersiz ID (BÜYÜK_HARF_SNAKE_CASE)
  "title": "Ekran Başlığı",    // Opsiyonel
  "terminal": false,           // Opsiyonel: Son ekran mı?
  "success": true,             // Opsiyonel: Başarılı sonuç mu?
  "data": {},                  // Opsiyonel: Dinamik veri modeli
  "layout": {                  // Zorunlu: Ekran düzeni
    "type": "SingleColumnLayout",
    "children": []             // Componentler
  }
}
```

## 2. Component Tipleri

### Metin Componentleri (Salt Okunur)

| Component | Açıklama | Zorunlu Alanlar |
|-----------|----------|-----------------|
| `TextHeading` | Büyük başlık | `type`, `text` |
| `TextSubheading` | Orta başlık | `type`, `text` |
| `TextBody` | Normal metin | `type`, `text` |
| `TextCaption` | Küçük açıklama | `type`, `text` |

**Örnek:**
```json
{
  "type": "TextHeading",
  "text": "Hoş Geldiniz",
  "visible": true
}
```

### Input Componentleri (Etkileşimli)

#### TextInput
```json
{
  "type": "TextInput",
  "name": "isim",              // Zorunlu: Form field adı
  "label": "Adınız",           // Zorunlu: Görünen etiket
  "required": true,            // Opsiyonel: Zorunlu mu?
  "input-type": "text",        // Opsiyonel: text, email, number, password
  "helper-text": "Ad soyad"   // Opsiyonel: Yardımcı metin
}
```

**Default Değerler:**
- `required`: false
- `input-type`: "text"
- `visible`: true

#### Dropdown
```json
{
  "type": "Dropdown",
  "name": "sehir",
  "label": "Şehir Seçin",
  "required": true,
  "data-source": [
    {"id": "istanbul", "title": "İstanbul"},
    {"id": "ankara", "title": "Ankara"}
  ]
}
```

**Default Değerler:**
- `required`: false
- `data-source`: []

#### RadioButtonsGroup
```json
{
  "type": "RadioButtonsGroup",
  "name": "cinsiyet",
  "label": "Cinsiyet",
  "required": true,
  "data-source": [
    {"id": "erkek", "title": "Erkek"},
    {"id": "kadin", "title": "Kadın"}
  ]
}
```

#### CheckboxGroup
```json
{
  "type": "CheckboxGroup",
  "name": "tercihler",
  "label": "Tercihleriniz",
  "data-source": [
    {"id": "email", "title": "E-posta"},
    {"id": "sms", "title": "SMS"}
  ],
  "init-value": []
}
```

#### DatePicker
```json
{
  "type": "DatePicker",
  "name": "randevu_tarihi",
  "label": "Tarih Seçin",
  "required": true,
  "min-date": "2024-01-01",
  "max-date": "2024-12-31"
}
```

#### OptIn
```json
{
  "type": "OptIn",
  "name": "sozlesme",
  "label": "Şartları kabul ediyorum",
  "required": true,
  "init-value": false
}
```

### Medya Componentleri

#### Image
```json
{
  "type": "Image",
  "src": "https://example.com/image.jpg",
  "scale-type": "contain",
  "width": 300,
  "height": 200
}
```

**Limitler:**
- Maksimum boyut: 300KB
- Desteklenen formatlar: JPG, PNG
- Base64 data URI desteklenir

### Navigasyon Componentleri

#### Footer
```json
{
  "type": "Footer",
  "label": "Devam Et",
  "on-click-action": {
    "name": "navigate",
    "next": {"type": "screen", "name": "SONRAKI_EKRAN"},
    "payload": {
      "isim": "${form.isim}"
    }
  }
}
```

**Önemli:**
- Terminal ekranlarda ZORUNLU
- Ekran başına SADECE BİR Footer olabilir
- Label eylem odaklı olmalı (fiil)

#### EmbeddedLink
```json
{
  "type": "EmbeddedLink",
  "text": "Daha fazla bilgi",
  "on-click-action": {
    "name": "open_url",
    "url": "https://example.com"
  }
}
```

### Koşullu Componentler

#### If
```json
{
  "type": "If",
  "condition": "`${form.yas} >= 18`",
  "then": [
    {"type": "TextBody", "text": "Reşitsiniz"}
  ],
  "else": [
    {"type": "TextBody", "text": "Reşit değilsiniz"}
  ]
}
```

#### Switch
```json
{
  "type": "Switch",
  "value": "${form.plan}",
  "cases": {
    "temel": [{"type": "TextBody", "text": "Temel plan seçildi"}],
    "premium": [{"type": "TextBody", "text": "Premium plan seçildi"}]
  },
  "default": [{"type": "TextBody", "text": "Plan seçilmedi"}]
}
```

## 3. Actionlar (Eylemler)

### navigate
Başka bir ekrana git (endpoint olmadan)

```json
{
  "name": "navigate",
  "next": {"type": "screen", "name": "ONAY_EKRANI"},
  "payload": {
    "isim": "${form.isim}",
    "email": "${form.email}"
  }
}
```

### complete
Flow'u tamamla ve webhook gönder

```json
{
  "name": "complete",
  "payload": {
    "randevu_id": "${data.randevu_id}",
    "tarih": "${form.tarih}"
  }
}
```

### data_exchange
Endpoint'e veri gönder ve sonraki ekranı al

```json
{
  "name": "data_exchange",
  "payload": {
    "hizmet_id": "${form.hizmet}",
    "tarih": "${form.randevu_tarihi}"
  }
}
```

### update_data
Ekran verisini güncelle (v6.0+)

```json
{
  "name": "update_data",
  "payload": {
    "sehirler": ["İstanbul", "Ankara"],
    "sehirler_gorunur": true
  }
}
```

### open_url
Harici URL aç (v6.0+)

```json
{
  "name": "open_url",
  "url": "https://example.com/sartlar"
}
```

## 4. Dinamik Referanslar

### Form Referansları
Kullanıcının girdiği veriye erişim:
```
${form.alan_adi}
```

### Data Referansları
Endpoint veya önceki ekrandan gelen veriye erişim:
```
${data.ozellik_adi}
```

### Global Referanslar (v4.0+)
Herhangi bir ekrandaki veriye erişim:
```
${screen.EKRAN_ADI.form.alan_adi}
${screen.EKRAN_ADI.data.ozellik_adi}
```

### İç İçe İfadeler (v6.0+)

```javascript
// Koşullu görünürlük
`${form.yas} >= 18`

// String birleştirme
`'Merhaba ' ${form.isim}`

// Matematiksel işlemler
`${data.fiyat} * ${form.adet}`

// Mantıksal operatörler
`${form.kabul} && ${form.abone}`

// Eşitlik kontrolü
`${form.ulke} == 'TR'`
```

## 5. Component → Flow JSON Dönüştürme Stratejisi

### Playground Component Modeli

```typescript
interface PlaygroundComponent {
  id: string;                        // React key için benzersiz ID
  type: ComponentType;               // Component tipi
  properties: ComponentProperties;   // Tipe özel özellikler
  position: { x: number; y: number }; // Canvas pozisyonu (Flow JSON'da yok)
}
```

### Dönüştürme Mantığı

```typescript
class FlowJSONGenerator {
  
  // Playground bileşenlerini Flow JSON'a çevir
  generateFlowJSON(screens: PlaygroundScreen[], hasEndpoint: boolean): FlowJSON {
    const flowJson: FlowJSON = {
      version: "7.2",
      screens: screens.map(screen => this.convertScreen(screen))
    };

    if (hasEndpoint) {
      flowJson.data_api_version = "4.0";
      flowJson.routing_model = this.generateRoutingModel(screens);
    }

    return flowJson;
  }

  // Playground ekranını Flow JSON ekranına çevir
  convertScreen(screen: PlaygroundScreen): Screen {
    return {
      id: screen.id,
      ...(screen.title && { title: screen.title }),
      ...(screen.terminal && { terminal: true }),
      ...(screen.success !== undefined && { success: screen.success }),
      ...(screen.dataModel && { data: screen.dataModel }),
      layout: {
        type: "SingleColumnLayout",
        children: screen.components.map(c => this.convertComponent(c))
      }
    };
  }

  // Component dönüştürme
  convertComponent(component: PlaygroundComponent): any {
    const base = { type: component.type };

    switch (component.type) {
      case "TextInput":
        return {
          ...base,
          name: component.properties.name,
          label: component.properties.label,
          ...(component.properties.required && { required: true }),
          ...(component.properties.inputType && { 
            "input-type": component.properties.inputType 
          })
        };

      case "Footer":
        return {
          ...base,
          label: component.properties.label,
          "on-click-action": component.properties.action
        };

      // Diğer componentler...
    }
  }

  // Routing model oluşturma
  generateRoutingModel(screens: PlaygroundScreen[]): RoutingModel {
    const model: RoutingModel = {};

    screens.forEach(screen => {
      const nextScreens = this.findNextScreens(screen);
      model[screen.id] = nextScreens;
    });

    return model;
  }
}
```

## 6. Default Değerler

### Component Default'ları

```typescript
const COMPONENT_DEFAULTS = {
  TextHeading: {
    text: "Başlık",
    visible: true
  },
  
  TextInput: {
    name: "alan_adi",
    label: "Alan Etiketi",
    required: false,
    "input-type": "text",
    visible: true
  },
  
  Dropdown: {
    name: "secim",
    label: "Bir seçenek seçin",
    required: false,
    "data-source": [
      { id: "secenek1", title: "Seçenek 1" },
      { id: "secenek2", title: "Seçenek 2" }
    ],
    visible: true
  },
  
  RadioButtonsGroup: {
    name: "tercih",
    label: "Birini seçin",
    required: false,
    "data-source": [
      { id: "evet", title: "Evet" },
      { id: "hayir", title: "Hayır" }
    ],
    visible: true
  },
  
  DatePicker: {
    name: "tarih",
    label: "Tarih seçin",
    required: false,
    visible: true
  },
  
  Footer: {
    label: "Devam Et",
    "on-click-action": {
      name: "navigate",
      next: { type: "screen", name: "SONRAKI_EKRAN" },
      payload: {}
    },
    enabled: true
  }
};
```

## 7. Validasyon Kuralları

### Yaygın Validasyonlar

```typescript
const VALIDATION_RULES = {
  TextInput: [
    {
      field: "name",
      rule: (v) => /^[a-z_][a-z0-9_]*$/i.test(v),
      message: "İsim geçerli bir tanımlayıcı olmalı (harf, rakam, alt çizgi)"
    },
    {
      field: "label",
      rule: (v) => v && v.length > 0,
      message: "Etiket zorunludur"
    }
  ],
  
  Dropdown: [
    {
      field: "data-source",
      rule: (v) => Array.isArray(v) && v.length > 0,
      message: "En az bir seçenek olmalı"
    },
    {
      field: "data-source",
      rule: (v) => {
        const ids = v.map(item => item.id);
        return ids.length === new Set(ids).size;
      },
      message: "Tüm seçenek ID'leri benzersiz olmalı"
    }
  ],
  
  Footer: [
    {
      field: "on-click-action",
      rule: (v) => v && ["navigate", "complete", "data_exchange"].includes(v.name),
      message: "Footer geçerli bir eylem içermeli"
    }
  ],
  
  DatePicker: [
    {
      field: "min-date",
      rule: (v, c) => {
        if (!v || !c["max-date"]) return true;
        return new Date(v) < new Date(c["max-date"]);
      },
      message: "min-date, max-date'ten önce olmalı"
    }
  ]
};
```

### Flow JSON Validasyonu

```typescript
function validateFlowJSON(flowJson: FlowJSON): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Version kontrolü
  if (flowJson.version !== "7.2") {
    errors.push("Geçersiz versiyon. 7.2 olmalı");
  }

  // 2. Ekran kontrolü
  if (!flowJson.screens || flowJson.screens.length === 0) {
    errors.push("Flow en az bir ekran içermeli");
  }

  // 3. Ekran ID'leri kontrolü
  const screenIds = flowJson.screens.map(s => s.id);
  const duplicates = screenIds.filter((id, i) => screenIds.indexOf(id) !== i);
  if (duplicates.length > 0) {
    errors.push(`Tekrar eden ekran ID'leri: ${duplicates.join(", ")}`);
  }

  // 4. Terminal ekran kontrolü
  const terminalScreens = flowJson.screens.filter(s => s.terminal);
  if (terminalScreens.length === 0) {
    errors.push("Flow en az bir terminal ekran içermeli");
  }

  // 5. Terminal ekranlarda Footer kontrolü
  terminalScreens.forEach(screen => {
    const hasFooter = screen.layout.children.some(c => c.type === "Footer");
    if (!hasFooter) {
      errors.push(`Terminal ekran ${screen.id} bir Footer içermeli`);
    }
  });

  // 6. Routing model kontrolü
  if (flowJson.data_api_version && !flowJson.routing_model) {
    errors.push("Endpoint kullanılıyorsa routing_model zorunludur");
  }

  // 7. Boyut kontrolü
  const size = JSON.stringify(flowJson).length;
  if (size > 10 * 1024 * 1024) {  // 10MB limit
    errors.push("Flow JSON 10MB limitini aşıyor");
  } else if (size > 5 * 1024 * 1024) {  // 5MB uyarı
    warnings.push("Flow JSON boyutu büyük (>5MB). Basitleştirmeyi düşünün.");
  }

  return { isValid: errors.length === 0, errors, warnings };
}
```

## 8. Ekran Navigasyon Mantığı

### Navigasyon Akışı

1. **Giriş Ekranı**: Gelen bağlantısı olmayan ilk ekran
2. **Ara Ekranlar**: Hem gelen hem giden bağlantısı olan ekranlar
3. **Terminal Ekranlar**: `terminal: true` olarak işaretlenmiş ekranlar

### Routing Model Oluşturma

```typescript
function generateRoutingModel(screens: Screen[]): RoutingModel {
  const model: RoutingModel = {};

  screens.forEach(screen => {
    // Ekrandaki tüm navigate action'ları bul
    const navigateActions = findNavigateActions(screen);
    const nextScreens = navigateActions.map(action => action.next.name);

    model[screen.id] = [...new Set(nextScreens)]; // Tekrarları kaldır
  });

  // Routing model'i doğrula
  validateRoutingModel(model, screens);

  return model;
}

function validateRoutingModel(model: RoutingModel, screens: Screen[]): void {
  const screenIds = screens.map(s => s.id);
  
  // Kontrol 1: Referans edilen tüm ekranlar var mı?
  Object.values(model).flat().forEach(targetScreen => {
    if (!screenIds.includes(targetScreen)) {
      throw new Error(`Bilinmeyen ekran referansı: ${targetScreen}`);
    }
  });

  // Kontrol 2: Tüm yollar terminal ekrana mı gidiyor?
  const entryScreen = findEntryScreen(model, screenIds);
  const reachableTerminals = findReachableTerminals(entryScreen, model);
  
  if (reachableTerminals.size === 0) {
    throw new Error("Terminal ekrana giden yol bulunamadı");
  }
}
```

## 9. Data Exchange Endpoint Entegrasyonu

### Endpoint Akışı

1. Kullanıcı Flow'u açar → `INIT` action endpoint'e gönderilir
2. Endpoint ilk ekran verisini döner
3. Kullanıcı etkileşir → `data_exchange` action form verisiyle gönderilir
4. Endpoint doğrular ve sonraki ekranı veya hatayı döner
5. Kullanıcı tamamlar → `complete` action webhook'a gönderilir (endpoint'e değil)

### Request/Response Yapısı

```typescript
// WhatsApp'tan endpoint'e gelen istek
interface EndpointRequest {
  version: "3.0";
  action: "INIT" | "data_exchange" | "BACK" | "ping";
  screen: string;
  data: any;
  flow_token: string;
}

// Endpoint'ten WhatsApp'a dönen yanıt
interface EndpointResponse {
  screen: string;
  data: {
    [key: string]: any;
    error_message?: string;  // Mevcut ekranda hata göster
  };
}
```

### Örnek Endpoint Handler

```typescript
async function handleFlowEndpoint(request: EndpointRequest): Promise<EndpointResponse> {
  const { action, screen, data } = request;

  // Sağlık kontrolü
  if (action === "ping") {
    return { data: { status: "active" } };
  }

  // Flow başlatma
  if (action === "INIT") {
    return {
      screen: "ILK_EKRAN",
      data: {
        hosgeldin_mesaji: "Hoş Geldiniz!",
        secenekler: await getSecenekler()
      }
    };
  }

  // Veri değişimi
  if (action === "data_exchange") {
    switch (screen) {
      case "ILK_EKRAN":
        // Girdiyi doğrula
        if (!data.secim) {
          return {
            screen: "ILK_EKRAN",
            data: {
              error_message: "Lütfen bir seçim yapın"
            }
          };
        }

        // Sonraki ekranı döndür
        return {
          screen: "IKINCI_EKRAN",
          data: {
            detaylar: await getDetaylar(data.secim)
          }
        };

      default:
        throw new Error(`Bilinmeyen ekran: ${screen}`);
    }
  }
}
```

## 10. Playground Uygulama Önerileri

### Component Paleti

```typescript
interface ComponentPaletteItem {
  category: "metin" | "girdi" | "medya" | "navigasyon" | "kosul";
  type: ComponentType;
  label: string;
  icon: string;
  description: string;
  defaultProperties: ComponentProperties;
}

const COMPONENT_PALETTE: ComponentPaletteItem[] = [
  {
    category: "metin",
    type: "TextHeading",
    label: "Başlık",
    icon: "IconH1",
    description: "Büyük başlık metni",
    defaultProperties: { text: "Başlık" }
  },
  {
    category: "girdi",
    type: "TextInput",
    label: "Metin Girişi",
    icon: "IconTextbox",
    description: "Tek satır metin girişi",
    defaultProperties: {
      name: "alan_adi",
      label: "Alan Etiketi",
      required: false
    }
  },
  {
    category: "girdi",
    type: "Dropdown",
    label: "Açılır Liste",
    icon: "IconChevronDown",
    description: "Listeden seçim yapma",
    defaultProperties: {
      name: "secim",
      label: "Bir seçenek seçin",
      "data-source": [
        { id: "secenek1", title: "Seçenek 1" },
        { id: "secenek2", title: "Seçenek 2" }
      ]
    }
  }
  // Diğer componentler...
];
```

### Özellik Editörü

```typescript
const PROPERTY_EDITORS: Record<ComponentType, PropertyEditorField[]> = {
  TextInput: [
    {
      key: "name",
      label: "Alan Adı",
      type: "text",
      required: true,
      help: "Bu alan için benzersiz tanımlayıcı"
    },
    {
      key: "label",
      label: "Etiket",
      type: "text",
      required: true,
      help: "Kullanıcıya gösterilen etiket"
    },
    {
      key: "required",
      label: "Zorunlu",
      type: "boolean",
      required: false
    },
    {
      key: "input-type",
      label: "Girdi Tipi",
      type: "select",
      required: false,
      options: ["text", "number", "email", "password"]
    }
  ]
};
```

### State Yönetimi

```typescript
interface PlaygroundState {
  screens: {
    [screenId: string]: {
      id: string;
      title: string;
      terminal: boolean;
      components: PlaygroundComponent[];
      connections: string[];  // Bağlı ekran ID'leri
    };
  };
  
  activeScreenId: string;
  hasEndpoint: boolean;
  endpointUri?: string;
  
  selectedComponentId?: string;
  isDragging: boolean;
}

// Redux actions
const actions = {
  addScreen: (screen: Screen) => {},
  deleteScreen: (screenId: string) => {},
  updateScreen: (screenId: string, updates: Partial<Screen>) => {},
  
  addComponent: (screenId: string, component: PlaygroundComponent) => {},
  deleteComponent: (screenId: string, componentId: string) => {},
  updateComponent: (screenId: string, componentId: string, properties: any) => {},
  
  connectScreens: (fromScreenId: string, toScreenId: string) => {},
  
  setEndpoint: (enabled: boolean, uri?: string) => {},
  
  generateFlowJSON: () => FlowJSON,
  importFlowJSON: (flowJson: FlowJSON) => {},
};
```

## 11. Uygulama Aşamaları

### Faz 1: Temel Componentler
- [x] TextHeading, TextBody
- [x] TextInput
- [x] Footer
- [x] Temel ekran yönetimi

### Faz 2: Girdi Componentleri
- [ ] Dropdown
- [ ] RadioButtonsGroup
- [ ] CheckboxGroup
- [ ] DatePicker

### Faz 3: Gelişmiş Özellikler
- [ ] Koşullu componentler (If/Switch)
- [ ] Dinamik referanslar
- [ ] Endpoint entegrasyonu

### Faz 4: Parlatma
- [ ] Image desteği
- [ ] Data source entegrasyonu
- [ ] Gelişmiş validasyon
- [ ] Preview modu

## 12. Mevcut Sistemle Entegrasyon

Playground mevcut Flow yönetimiyle entegre olmalı:

1. Flow JSON'ı `WhatsAppFlow.flowJson` alanına kaydet
2. Yayımlamak için `FlowsService.create()` kullan
3. Canlıya almak için `FlowsService.publish()` kullan
4. Test etmek için `FlowsService.getPreview()` kullan

### İlgili Dosyalar

**Backend:**
- `/backend/src/entities/whatsapp-flow.entity.ts` - Veritabanı şeması
- `/backend/src/modules/flows/flows.service.ts` - CRUD operasyonları

**Frontend (Oluşturulacak):**
- `/frontend/src/features/flows-playground/components/FlowPlayground.tsx`
- `/frontend/src/features/flows-playground/components/ComponentPalette.tsx`
- `/frontend/src/features/flows-playground/components/PropertyEditor.tsx`
- `/frontend/src/features/flows-playground/utils/flowJsonGenerator.ts`
- `/frontend/src/features/flows-playground/store/playgroundSlice.ts`

## Sonuç

Bu analiz, WhatsApp Flows Playground özelliğini uygulamak için gereken tüm bilgileri içermektedir. Component yapıları, default değerler, validasyon kuralları, navigasyon mantığı ve endpoint entegrasyonu detaylı olarak açıklanmıştır.

Playground kullanıcı dostu bir arayüzle Flow JSON v7.2 oluşturmayı sağlarken, arka planda güçlü validasyon ve dönüştürme mekanizmaları çalışacaktır.
