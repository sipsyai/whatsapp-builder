# WhatsApp Flow JSON Yapısı

Bu dokümantasyon, `salon-dynamic-flow.json` dosyasının detaylı yapısını açıklar.

---

## 📋 İçindekiler

1. [Temel Yapı](#temel-yapı)
2. [Routing Model](#routing-model)
3. [Screen Yapısı](#screen-yapısı)
4. [Dynamic Data Binding](#dynamic-data-binding)
5. [Actions](#actions)
6. [Component Types](#component-types)

---

## 1. Temel Yapı

```json
{
  "version": "7.2",
  "data_api_version": "3.0",
  "routing_model": { ... },
  "screens": [ ... ]
}
```

### version

WhatsApp Flow JSON versiyonu. Desteklenen versiyon: **7.2**

### data_api_version

Endpoint entegrasyonu için gerekli. Dynamic Flow'lar için: **3.0**

**Not**: `data_api_version` kullanılıyorsa `routing_model` **zorunludur**.

---

## 2. Routing Model

Routing model, ekranlar arası geçişleri tanımlar.

```json
{
  "routing_model": {
    "MAIN_MENU": ["DATETIME_SCREEN"],
    "DATETIME_SCREEN": ["CUSTOMER_INFO"],
    "CUSTOMER_INFO": ["SUCCESS"],
    "SUCCESS": []
  }
}
```

### Kurallar

1. **Sadece forward route**: Geri dönüş yolları belirtilemez
   ```json
   ❌ "DATETIME_SCREEN": ["CUSTOMER_INFO", "MAIN_MENU"]  // Yanlış
   ✅ "DATETIME_SCREEN": ["CUSTOMER_INFO"]               // Doğru
   ```

2. **Terminal screen**: Boş array ile gösterilir
   ```json
   "SUCCESS": []
   ```

3. **Webhook navigation**: `data_exchange` action'ı routing_model'e bağlı değildir
   ```typescript
   // Webhook response ile istediğin screen'e yönlendirebilirsin
   return {
     version: '3.0',
     screen: 'SUCCESS',  // routing_model'de tanımlı olmasa bile
     data: { ... }
   };
   ```

---

## 3. Screen Yapısı

Her screen 4 ana bölümden oluşur:

```json
{
  "id": "MAIN_MENU",
  "title": "Kuaför Randevusu",
  "terminal": false,
  "data": { ... },
  "layout": { ... }
}
```

### 3.1. Screen Properties

#### id
- Unique identifier
- Büyük harfler ve alt çizgi önerilir
- Örnek: `MAIN_MENU`, `DATETIME_SCREEN`

#### title
- Ekran başlığı (kullanıcıya gösterilir)
- Max 80 karakter

#### terminal
- `true`: Final screen (tamamlama veya hata)
- `false`: Normal screen

#### success (optional)
- Terminal screen'lerde kullanılır
- `true`: Başarılı tamamlama
- `false`: Hata/iptal

### 3.2. Data Schema

Screen'e gönderilecek dinamik verinin yapısı:

```json
{
  "data": {
    "available_dates": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "title": { "type": "string" },
          "enabled": { "type": "boolean" }
        }
      },
      "__example__": [
        {"id": "2025-01-24", "title": "24 Ocak Cuma", "enabled": true}
      ]
    }
  }
}
```

**Kullanım**:
```json
{
  "type": "Dropdown",
  "data-source": "${data.available_dates}"
}
```

### 3.3. Layout

```json
{
  "layout": {
    "type": "SingleColumnLayout",
    "children": [
      { "type": "TextHeading", "text": "Hoş Geldiniz!" },
      { "type": "Dropdown", "name": "stylist", ... }
    ]
  }
}
```

---

## 4. Dynamic Data Binding

### 4.1. Form Data

Aynı screen içindeki form verisi:

```json
{
  "type": "Dropdown",
  "name": "stylist",
  "on-select-action": {
    "payload": {
      "stylist": "${form.stylist}"  // Aynı screen
    }
  }
}
```

### 4.2. Cross-Screen Data

Önceki screen'lerdeki form verisi:

```json
{
  "payload": {
    "service": "${screen.MAIN_MENU.form.service}",
    "stylist": "${screen.MAIN_MENU.form.stylist}",
    "date": "${screen.DATETIME_SCREEN.form.appointment_date}"
  }
}
```

**Syntax**: `${screen.SCREEN_ID.form.FIELD_NAME}`

### 4.3. Screen Data

Webhook'tan gelen data:

```json
{
  "type": "Dropdown",
  "data-source": "${data.available_slots}"
}
```

Webhook response:
```json
{
  "version": "3.0",
  "screen": "DATETIME_SCREEN",
  "data": {
    "available_slots": [
      {"id": "10:00", "title": "10:00", "enabled": true}
    ]
  }
}
```

### 4.4. Text Interpolation

```json
{
  "type": "TextBody",
  "text": "Merhaba ${form.customer_name}! ${data.appointment_date} tarihinde randevunuz var."
}
```

---

## 5. Actions

### 5.1. navigate

Başka bir screen'e geç:

```json
{
  "type": "Footer",
  "label": "Devam",
  "on-click-action": {
    "name": "navigate",
    "next": {
      "type": "screen",
      "name": "DATETIME_SCREEN"
    }
  }
}
```

### 5.2. data_exchange

Webhook'a request gönder:

```json
{
  "type": "Dropdown",
  "name": "stylist",
  "on-select-action": {
    "name": "data_exchange",
    "payload": {
      "action": "get_stylist_info",
      "stylist": "${form.stylist}",
      "service": "${form.service}"
    }
  }
}
```

**Webhook Request**:
```json
{
  "action": "data_exchange",
  "flow_token": "TEST_TOKEN_1234567890",
  "screen": "MAIN_MENU",
  "data": {
    "action": "get_stylist_info",
    "stylist": "ali",
    "service": "haircut"
  }
}
```

**Webhook Response**:
```json
{
  "version": "3.0",
  "screen": "MAIN_MENU",
  "data": {
    "available_dates": [ ... ]
  }
}
```

### 5.3. complete

Flow'u tamamla (success terminal screen'de):

```json
{
  "type": "Footer",
  "label": "Tamam",
  "on-click-action": {
    "name": "complete",
    "payload": {}
  }
}
```

---

## 6. Component Types

### 6.1. Text Components

#### TextHeading
```json
{
  "type": "TextHeading",
  "text": "Hoş Geldiniz! 💇‍♀️"
}
```
- En büyük başlık
- Max 80 karakter

#### TextSubheading
```json
{
  "type": "TextSubheading",
  "text": "Hangi Hizmeti Almak İstersiniz?"
}
```
- Orta boy başlık
- Max 80 karakter

#### TextBody
```json
{
  "type": "TextBody",
  "text": "Randevu oluşturmak için aşağıdaki bilgileri doldurun."
}
```
- Normal metin
- Max 4096 karakter

#### TextCaption
```json
{
  "type": "TextCaption",
  "text": "Randevu saatinden önce size hatırlatma mesajı göndereceğiz."
}
```
- Küçük metin (açıklama)
- Max 4096 karakter

### 6.2. Input Components

#### TextInput
```json
{
  "type": "TextInput",
  "name": "customer_name",
  "label": "Adınız Soyadınız",
  "input-type": "text",
  "required": true,
  "helper-text": "Tam adınızı girin"
}
```

**input-type options**:
- `text`: Normal metin
- `email`: Email validation
- `phone`: Telefon numarası
- `number`: Sadece rakam
- `password`: Şifreli input

#### TextArea
```json
{
  "type": "TextArea",
  "name": "notes",
  "label": "Özel Notlar (Opsiyonel)",
  "required": false,
  "helper-text": "Varsa özel isteklerinizi yazın",
  "max-length": 300
}
```

#### Dropdown
```json
{
  "type": "Dropdown",
  "name": "stylist",
  "label": "Kuaför Seçin",
  "required": true,
  "data-source": [
    {"id": "ali", "title": "Ali Bey"},
    {"id": "ayse", "title": "Ayşe Hanım"}
  ]
}
```

**Dynamic data-source**:
```json
{
  "type": "Dropdown",
  "name": "appointment_date",
  "label": "Randevu Tarihi",
  "data-source": "${data.available_dates}"
}
```

#### RadioButtonsGroup
```json
{
  "type": "RadioButtonsGroup",
  "name": "service",
  "label": "Hizmet Seçin",
  "required": true,
  "data-source": [
    {
      "id": "haircut",
      "title": "Saç Kesimi",
      "description": "150 TL - 30 dakika"
    },
    {
      "id": "coloring",
      "title": "Saç Boyama",
      "description": "500 TL - 2 saat"
    }
  ]
}
```

#### CheckboxGroup
```json
{
  "type": "CheckboxGroup",
  "name": "services",
  "label": "Hizmetler",
  "data-source": [
    {"id": "haircut", "title": "Saç Kesimi"},
    {"id": "beard", "title": "Sakal Traşı"}
  ]
}
```

#### DatePicker
```json
{
  "type": "DatePicker",
  "name": "appointment_date",
  "label": "Tarih Seçin",
  "required": true,
  "min-date": "2025-01-01",
  "max-date": "2025-12-31"
}
```

### 6.3. Footer

Her screen'de bir Footer olmalı:

```json
{
  "type": "Footer",
  "label": "Devam",
  "on-click-action": {
    "name": "navigate",
    "next": {
      "type": "screen",
      "name": "NEXT_SCREEN"
    }
  }
}
```

---

## 7. Örnek: Tam Screen

```json
{
  "id": "DATETIME_SCREEN",
  "title": "Tarih ve Saat",
  "terminal": false,
  "data": {
    "available_dates": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string"},
          "title": {"type": "string"},
          "enabled": {"type": "boolean"}
        }
      }
    },
    "available_slots": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string"},
          "title": {"type": "string"},
          "enabled": {"type": "boolean"}
        }
      }
    }
  },
  "layout": {
    "type": "SingleColumnLayout",
    "children": [
      {
        "type": "TextHeading",
        "text": "Ne Zaman?"
      },
      {
        "type": "Dropdown",
        "name": "appointment_date",
        "label": "Randevu Tarihi",
        "required": true,
        "data-source": "${data.available_dates}",
        "on-select-action": {
          "name": "data_exchange",
          "payload": {
            "action": "get_available_slots",
            "stylist": "${screen.MAIN_MENU.form.stylist}",
            "date": "${form.appointment_date}",
            "service": "${screen.MAIN_MENU.form.service}"
          }
        }
      },
      {
        "type": "Dropdown",
        "name": "appointment_time",
        "label": "Randevu Saati",
        "required": true,
        "data-source": "${data.available_slots}"
      },
      {
        "type": "Footer",
        "label": "Devam",
        "on-click-action": {
          "name": "navigate",
          "next": {
            "type": "screen",
            "name": "CUSTOMER_INFO"
          }
        }
      }
    ]
  }
}
```

---

## 8. Best Practices

### 8.1. Naming Conventions

- **Screen IDs**: SCREAMING_SNAKE_CASE
  ```
  ✅ MAIN_MENU, DATETIME_SCREEN, CUSTOMER_INFO
  ❌ mainMenu, datetime-screen, CustomerInfo
  ```

- **Field Names**: snake_case
  ```
  ✅ customer_name, appointment_date, appointment_time
  ❌ customerName, appointmentDate, AppointmentTime
  ```

- **Action Names**: snake_case
  ```
  ✅ get_available_slots, create_appointment
  ❌ getAvailableSlots, createAppointment
  ```

### 8.2. Data Schema

Her dynamic data için schema tanımla:

```json
{
  "data": {
    "field_name": {
      "type": "array",
      "items": { ... },
      "__example__": [ ... ]
    }
  }
}
```

`__example__` development sırasında yardımcı olur.

### 8.3. Validation

- Tüm required field'ları `"required": true` yap
- `helper-text` ile kullanıcıya yardımcı ol
- `input-type` ile otomatik validation ekle

### 8.4. User Experience

- **Progress indicator**: Her screen'in title'ı net olmalı
- **Helper text**: Her input'a açıklama ekle
- **Error handling**: Webhook'ta hata olursa kullanıcıya göster

```json
// Hata durumu
{
  "version": "3.0",
  "screen": "DATETIME_SCREEN",
  "data": {
    "error_message": "Bu tarihte müsait saat yok"
  }
}
```

```json
// Screen'de error göster
{
  "type": "TextBody",
  "text": "${data.error_message}",
  "visible": "${data.error_message != ''}"
}
```

---

## 9. Validation ve Testing

### 9.1. JSON Syntax

```bash
# JSON syntax kontrolü
node -e "console.log(JSON.parse(require('fs').readFileSync('salon-dynamic-flow.json')))"
```

### 9.2. WhatsApp Validation

Flow oluştururken WhatsApp validation yapar:

```json
{
  "validation_errors": [
    {
      "error": "INVALID_PROPERTY_TYPE",
      "message": "Expected property 'enabled' to be of type 'boolean'",
      "path": "screens[1].layout.children[2].enabled"
    }
  ]
}
```

### 9.3. Manual Testing

1. Preview URL kullan (WhatsApp Business Manager)
2. Test mesajı gönder (`mode: 'draft'`)
3. Tüm senaryoları test et

---

## 📚 Referanslar

- [WhatsApp Flows Documentation](https://developers.facebook.com/docs/whatsapp/flows)
- [Flow JSON Reference](https://developers.facebook.com/docs/whatsapp/flows/reference)
- [Component Catalog](https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson#components)

---

**Hazırlayan**: Claude Code
**Tarih**: 23 Kasım 2025
**Flow Version**: 7.2
