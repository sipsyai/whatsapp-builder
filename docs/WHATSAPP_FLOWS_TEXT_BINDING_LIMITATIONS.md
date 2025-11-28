# WhatsApp Flows: Text Binding Kısıtlamaları ve Çözümleri

## Özet

Bu rapor, WhatsApp Flows v7.2 kullanılarak geliştirilen **Price Update Flow** uygulaması sırasında karşılaşılan text binding (metin bağlama) kısıtlamalarını ve bu kısıtlamaların çözümlerini detaylı olarak açıklamaktadır.

**Karşılaşılan Sorun:**
- `TextHeading` ve `TextBody` bileşenlerinde `${data.brand_name}` gibi dinamik veri bağlama söz dizimi kullanıldığında, değişken değeri yerine literal string olarak gösterildi (örn: "${data.brand_name}" yazısı aynen ekranda görüldü)
- Aynı Flow'da `Dropdown` bileşeni `data-source: "${data.brands}"` ile başarıyla çalıştı
- Sorunu çözmek için statik metin içeren yeni bir Flow oluşturmak zorunda kalındı

---

## 1. WhatsApp Flows Text Binding Mekanizması

### 1.1 Static (Statik) Properties

Statik özellikler bir kez ayarlanır ve asla değişmez.

```json
{
  "type": "TextHeading",
  "text": "Bu statik bir başlıktır"
}
```

### 1.2 Dynamic (Dinamik) Properties

Dinamik özellikler sunucu veya ekran verisine `${data.field}` veya `${form.field}` söz dizimi ile bağlanır.

```json
{
  "type": "TextHeading",
  "text": "${data.brand_name}"
}
```

**ÖNEMLİ KURAL:**
> "If you attempt to use the dynamic and static variant of the property together, you will get a compilation error."

Dinamik ve statik varyantları birlikte kullanamazsınız!

### 1.3 Nested Expressions (İç İçe İfadeler) - v6.0+

Nested expressions, dinamik ve statik içeriği birleştirmenizi sağlar ancak özel bir söz dizimi gerektirir:

**Backtick (\`) karakteri ile sarmalanmalıdır:**

```json
{
  "type": "TextBody",
  "text": "`'Marka: ' ${data.brand_name}`"
}
```

---

## 2. Karşılaşılan Sorunun Analizi

### 2.1 Hatalı Kullanım

**Size gönderilen veya kullandığınız muhtemel kod:**

```json
{
  "type": "TextHeading",
  "text": "${data.brand_name}"
}
```

**Sorun:** Bu söz dizimi teoride doğru olsa da, bazı durumlarda şu nedenlerle çalışmayabilir:

1. **Data Model Tanımlanmamış:** `data` bölümünde `brand_name` tanımlanmamış olabilir
2. **Endpoint Yanıtı Eksik:** Sunucu yanıtında `brand_name` alanı dönmüyor olabilir
3. **Flow JSON Versiyonu:** Eski versiyonlarda bazı bileşenler dinamik bağlamayı desteklemiyor
4. **Nested Expression Gereksinimi:** String birleştirme yapmak için backtick gerekiyor

### 2.2 Neden Dropdown Çalıştı?

```json
{
  "type": "Dropdown",
  "data-source": "${data.brands}"
}
```

**Çalışma Nedeni:**
- `Dropdown` bileşeninin `data-source` özelliği **her zaman dinamik** bir özelliktir
- Array veya object türü bekler
- Doğrudan `${data.field}` binding'ini destekler
- String concatenation gerektirmez

**Text Bileşenlerindeki Fark:**
- `TextHeading`, `TextBody` gibi bileşenlerin `text` özelliği **hem statik hem dinamik** olabilir
- String birleştirme yapılacaksa **nested expression** gerekir
- Sadece `${data.field}` kullanımı, eğer string concatenation yoksa çalışmalıdır

---

## 3. Hangi Bileşenler Dinamik Data Binding Destekler?

### 3.1 TAM Dinamik Binding Desteği Olan Bileşenler

| Bileşen | Dinamik Özellik | Kullanım | Versiyon |
|---------|----------------|----------|----------|
| **Dropdown** | `data-source` | `"${data.brands}"` | Tüm versiyonlar |
| **RadioButtonsGroup** | `data-source` | `"${data.options}"` | Tüm versiyonlar |
| **CheckboxGroup** | `data-source` | `"${data.items}"` | Tüm versiyonlar |
| **TextInput** | `label`, `helper-text`, `init-value`, `error-message` | `"${data.label}"` | v4.0+ |
| **TextArea** | `label`, `helper-text`, `init-value`, `error-message` | `"${data.label}"` | v4.0+ |
| **DatePicker** | `label`, `min-date`, `max-date`, `unavailable-dates` | `"${data.label}"` | Tüm versiyonlar |
| **Image** | `src`, `width`, `height`, `alt-text` | `"${data.image_url}"` | Tüm versiyonlar |
| **Footer** | `label`, `left-caption`, `center-caption`, `right-caption` | `"${data.button_text}"` | Tüm versiyonlar |

### 3.2 SINIRLI Dinamik Binding Desteği (Nested Expression Gerektirir)

| Bileşen | Dinamik Özellik | Basit Binding | String Concat | Versiyon |
|---------|----------------|---------------|---------------|----------|
| **TextHeading** | `text` | ✅ `"${data.text}"` | ⚠️ Backtick gerekli | Tüm versiyonlar |
| **TextSubheading** | `text` | ✅ `"${data.text}"` | ⚠️ Backtick gerekli | Tüm versiyonlar |
| **TextBody** | `text` | ✅ `"${data.text}"` | ⚠️ Backtick gerekli | Tüm versiyonlar |
| **TextCaption** | `text` | ✅ `"${data.text}"` | ⚠️ Backtick gerekli | Tüm versiyonlar |
| **RichText** | `text` | ✅ `"${data.text}"` | ✅ Markdown destekler | v5.1+ |

**Önemli Not:**
- ✅ **Basit Binding:** Sadece `"${data.field}"` kullanımı (string concatenation YOK)
- ⚠️ **String Concat:** `"Marka: " + ${data.brand}` gibi birleştirme yapmak için **backtick** gerekli

---

## 4. Text Bileşenlerinde Dinamik Veri Kullanımı

### 4.1 Doğru Kullanım Örnekleri

#### ✅ Örnek 1: Basit Dinamik Binding (Nested Expression Kullanmadan)

```json
{
  "id": "BRAND_SCREEN",
  "data": {
    "brand_name": {
      "type": "string",
      "__example__": "Nike"
    }
  },
  "layout": {
    "type": "SingleColumnLayout",
    "children": [
      {
        "type": "TextHeading",
        "text": "${data.brand_name}"
      }
    ]
  }
}
```

**Sonuç:** "Nike" görünür

#### ✅ Örnek 2: String Concatenation (Nested Expression ile)

```json
{
  "id": "BRAND_SCREEN",
  "data": {
    "brand_name": {
      "type": "string",
      "__example__": "Nike"
    },
    "price": {
      "type": "number",
      "__example__": 1500
    }
  },
  "layout": {
    "type": "SingleColumnLayout",
    "children": [
      {
        "type": "TextHeading",
        "text": "`'Marka: ' ${data.brand_name}`"
      },
      {
        "type": "TextBody",
        "text": "`'Fiyat: ' ${data.price} ' TL'`"
      }
    ]
  }
}
```

**Sonuç:**
- Başlık: "Marka: Nike"
- Gövde: "Fiyat: 1500 TL"

#### ✅ Örnek 3: Conditional Rendering (Koşullu Görüntüleme)

```json
{
  "type": "TextBody",
  "text": "`${data.price} >= 1000 ? 'Pahalı Ürün' : 'Normal Fiyat'`"
}
```

#### ✅ Örnek 4: Markdown Desteği (v5.1+)

```json
{
  "type": "TextBody",
  "markdown": true,
  "text": "${data.formatted_description}"
}
```

`formatted_description` sunucudan şu formatta gelebilir:
```
"**Bold text** and *italic text* with [link](https://example.com)"
```

### 4.2 Hatalı Kullanım Örnekleri

#### ❌ Hata 1: Static + Dynamic Karışımı

```json
{
  "type": "TextHeading",
  "text": "Marka: ${data.brand_name}"  // ❌ YANLIŞ!
}
```

**Sorun:** Backtick olmadan string concatenation yapılamaz

**Çözüm:**
```json
{
  "type": "TextHeading",
  "text": "`'Marka: ' ${data.brand_name}`"  // ✅ DOĞRU
}
```

#### ❌ Hata 2: Data Model Tanımlanmamış

```json
{
  "id": "SCREEN",
  "data": {},  // ❌ brand_name tanımlanmamış
  "layout": {
    "children": [
      {
        "type": "TextHeading",
        "text": "${data.brand_name}"  // ❌ Hata verecek
      }
    ]
  }
}
```

**Çözüm:**
```json
{
  "id": "SCREEN",
  "data": {
    "brand_name": {
      "type": "string",
      "__example__": "Default Brand"  // ✅ Tanımlanmalı
    }
  },
  "layout": {
    "children": [
      {
        "type": "TextHeading",
        "text": "${data.brand_name}"
      }
    ]
  }
}
```

---

## 5. Nested Expressions Kullanım Kılavuzu (v6.0+)

### 5.1 Söz Dizimi Kuralları

**Temel Format:**
```json
"property": "`expression`"
```

**Kurallar:**
1. İfade **backtick** (\`) ile başlar ve biter
2. String literals **tek tırnak** (') içinde yazılır
3. Dinamik değişkenler `${data.field}` veya `${form.field}` ile referans edilir
4. Boşluklarla string concatenation yapılır

### 5.2 Desteklenen Operatörler

#### String Concatenation (Birleştirme)

```json
// Basit birleştirme
"text": "`'Merhaba ' ${form.first_name}`"

// Çoklu birleştirme
"text": "`${form.first_name} ' ' ${form.last_name} ' yaşında ' ${form.age}`"
```

#### Equality Comparisons (Eşitlik Karşılaştırmaları)

```json
// String karşılaştırma
"visible": "`${form.country} == 'Turkey'`"

// Number karşılaştırma
"visible": "`${data.price} == 1500`"

// Boolean karşılaştırma
"visible": "`${form.accept_terms} != true`"
```

#### Math Comparisons (Matematiksel Karşılaştırmalar)

```json
"visible": "`${form.age} >= 18`"
"visible": "`${data.price} < 1000`"
"text": "`${form.age} > 18 ? 'Yetişkin' : 'Çocuk'`"
```

#### Logical Operations (Mantıksal İşlemler)

```json
"visible": "`${form.accept} && ${form.subscribe}`"
"visible": "`(${form.age} > 18) && ${form.accept}`"
"visible": "`(${form.first_name} != '') || (${form.last_name} != '')`"
```

#### Math Operations (Matematiksel İşlemler)

```json
"text": "`'Toplam: ' (${data.price} * ${form.quantity}) ' TL'`"
"text": "`'İndirimli Fiyat: ' (${data.price} - 100) ' TL'`"
"text": "`'Doğum Yılı: ' (2024 - ${form.age})`"
```

### 5.3 Backtick Karakterini String İçinde Kullanma

Eğer string içinde backtick karakteri kullanmanız gerekiyorsa, iki backslash ekleyin:

```json
{
  "type": "TextBody",
  "text": "`'This is Ana\\\`s house'`"
}
```

**Sonuç:** "This is Ana`s house"

---

## 6. Price Update Flow için Önerilen Çözümler

### 6.1 Çözüm 1: Nested Expressions Kullanımı (ÖNERİLEN)

```json
{
  "version": "7.2",
  "data_api_version": "4.0",
  "screens": [
    {
      "id": "PRICE_UPDATE_SCREEN",
      "title": "Fiyat Güncelleme",
      "data": {
        "brand_name": {
          "type": "string",
          "__example__": "Nike"
        },
        "current_price": {
          "type": "number",
          "__example__": 1500
        },
        "products": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {"type": "string"},
              "title": {"type": "string"}
            }
          },
          "__example__": [
            {"id": "1", "title": "Air Max 90"},
            {"id": "2", "title": "Air Force 1"}
          ]
        }
      },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "`'Marka: ' ${data.brand_name}`"
          },
          {
            "type": "TextBody",
            "text": "`'Mevcut Fiyat: ' ${data.current_price} ' TL'`"
          },
          {
            "type": "Dropdown",
            "name": "product",
            "label": "Ürün Seçin",
            "data-source": "${data.products}",
            "required": true
          },
          {
            "type": "TextInput",
            "name": "new_price",
            "label": "Yeni Fiyat (TL)",
            "input-type": "number",
            "required": true
          },
          {
            "type": "Footer",
            "label": "Fiyatı Güncelle",
            "on-click-action": {
              "name": "data_exchange",
              "payload": {
                "brand": "${data.brand_name}",
                "product_id": "${form.product}",
                "new_price": "${form.new_price}"
              }
            }
          }
        ]
      }
    }
  ]
}
```

### 6.2 Çözüm 2: RichText Bileşeni Kullanımı (v5.1+)

Eğer uzun, formatlanmış metinler gösterecekseniz:

```json
{
  "type": "RichText",
  "text": "${data.formatted_content}"
}
```

Sunucudan Markdown formatında veri gönderin:

```json
{
  "screen": "PRICE_UPDATE_SCREEN",
  "data": {
    "formatted_content": "# Fiyat Güncelleme\n\n**Marka:** Nike\n\n**Mevcut Fiyat:** 1500 TL\n\n*Lütfen yeni fiyatı girin.*"
  }
}
```

### 6.3 Çözüm 3: Sunucu Tarafında String Birleştirme

Eğer nested expressions kullanmak istemiyorsanız, sunucu tarafında hazır string gönderin:

**Flow JSON:**
```json
{
  "data": {
    "brand_info": {
      "type": "string",
      "__example__": "Marka: Nike"
    },
    "price_info": {
      "type": "string",
      "__example__": "Mevcut Fiyat: 1500 TL"
    }
  },
  "layout": {
    "children": [
      {
        "type": "TextHeading",
        "text": "${data.brand_info}"
      },
      {
        "type": "TextBody",
        "text": "${data.price_info}"
      }
    ]
  }
}
```

**Sunucu Yanıtı:**
```json
{
  "screen": "PRICE_UPDATE_SCREEN",
  "data": {
    "brand_info": "Marka: Nike",
    "price_info": "Mevcut Fiyat: 1500 TL"
  }
}
```

---

## 7. Yaygın Hatalar ve Çözümleri

### 7.1 Literal String Gösterme Sorunu

**Sorun:**
```json
{
  "type": "TextHeading",
  "text": "Marka: ${data.brand_name}"
}
```
**Görünen:** "Marka: ${data.brand_name}" (literal olarak)

**Çözüm:**
```json
{
  "type": "TextHeading",
  "text": "`'Marka: ' ${data.brand_name}`"
}
```

### 7.2 Undefined/Null Değerler

**Sorun:** Sunucu yanıtında alan eksik

**Çözüm:** Conditional rendering kullanın:
```json
{
  "type": "If",
  "condition": "${data.brand_name} != ''",
  "then": [
    {
      "type": "TextHeading",
      "text": "`'Marka: ' ${data.brand_name}`"
    }
  ],
  "else": [
    {
      "type": "TextHeading",
      "text": "Marka bilgisi yok"
    }
  ]
}
```

### 7.3 Data Model Eksikliği

**Sorun:** `data` bölümünde alan tanımlanmamış

**Doğru Kullanım:**
```json
{
  "id": "SCREEN",
  "data": {
    "brand_name": {
      "type": "string",
      "__example__": "Default"
    }
  }
}
```

### 7.4 Version Uyumsuzluğu

**Sorun:** Nested expressions v6.0+ gerektirir

**Çözüm:** Flow JSON versiyonunu kontrol edin:
```json
{
  "version": "7.2"  // v6.0+ olmalı
}
```

---

## 8. Debugging Checklist (Hata Ayıklama Kontrol Listesi)

Text binding çalışmıyorsa şunları kontrol edin:

- [ ] **Flow JSON Versiyonu:** Nested expressions için v6.0+ olmalı
- [ ] **Data Model Tanımı:** `data` bölümünde tüm alanlar tanımlanmış mı?
- [ ] **Example Değerleri:** Her alan için `__example__` belirtilmiş mi?
- [ ] **Backtick Kullanımı:** String concatenation için backtick var mı?
- [ ] **Tek Tırnak:** String literals tek tırnak (') içinde mi?
- [ ] **Sunucu Yanıtı:** Endpoint doğru data dönüyor mu?
- [ ] **Field Adları:** `${data.field_name}` ile data model eşleşiyor mu?
- [ ] **Operator Söz Dizimi:** Operatörler doğru kullanılmış mı?

---

## 9. Best Practices (En İyi Uygulamalar)

### 9.1 Tercih Sırası

1. **Basit Binding Tercih Edin:**
   ```json
   "text": "${data.message}"  // İlk seçenek
   ```

2. **Gerekirse Nested Expressions:**
   ```json
   "text": "`'Toplam: ' ${data.total} ' TL'`"  // İkinci seçenek
   ```

3. **Son Çare Sunucu Tarafı:**
   ```json
   // Sunucuda: "Toplam: 1500 TL" string'ini oluştur
   "text": "${data.formatted_total}"  // Üçüncü seçenek
   ```

### 9.2 Okunabilirlik

**Kötü:**
```json
"text": "`${form.first} ' ' ${form.last} ', ' ${data.city} ' - ' ${data.country} ', Age: ' ${form.age}`"
```

**İyi:**
```json
// Sunucuda birleştir
"text": "${data.user_info}"
// Veya RichText kullan
```

### 9.3 Error Handling

Her zaman fallback değerler sağlayın:

```json
{
  "type": "If",
  "condition": "`${data.brand_name} != ''`",
  "then": [
    {"type": "TextHeading", "text": "${data.brand_name}"}
  ],
  "else": [
    {"type": "TextHeading", "text": "Marka Belirtilmemiş"}
  ]
}
```

### 9.4 Performance

- Karmaşık nested expressions yerine sunucu tarafında hesaplama yapın
- RichText için uzun metinleri sunucudan hazır gönderin
- Global dynamic referencing kullanarak gereksiz data passing'den kaçının

---

## 10. Özetleyici Tablo: Text Binding Yetenekleri

| Bileşen | Basit Dynamic | String Concat | Conditional | Nested Expr | Markdown | Versiyon |
|---------|---------------|---------------|-------------|-------------|----------|----------|
| TextHeading | ✅ | ⚠️ Backtick | ⚠️ Backtick | v6.0+ | ❌ | Tümü |
| TextSubheading | ✅ | ⚠️ Backtick | ⚠️ Backtick | v6.0+ | ❌ | Tümü |
| TextBody | ✅ | ⚠️ Backtick | ⚠️ Backtick | v6.0+ | ✅ | v5.1+ |
| TextCaption | ✅ | ⚠️ Backtick | ⚠️ Backtick | v6.0+ | ✅ | v5.1+ |
| RichText | ✅ | ✅ Native | ✅ Native | v6.0+ | ✅ Full | v5.1+ |
| Dropdown | ✅ data-source | ❌ | ❌ | ❌ | ❌ | Tümü |
| TextInput | ✅ label/value | ⚠️ Backtick | ⚠️ Backtick | v6.0+ | ❌ | Tümü |
| Footer | ✅ label | ⚠️ Backtick | ⚠️ Backtick | v6.0+ | ❌ | Tümü |

**Açıklamalar:**
- ✅ = Tam destek
- ⚠️ = Kısıtlı destek (backtick gerekli)
- ❌ = Desteklenmiyor

---

## 11. Sonuç ve Tavsiyeler

### 11.1 Price Update Flow İçin Önerilen Yaklaşım

**Size önerimiz:**

1. **Flow JSON v7.2 kullanın** (zaten kullanıyorsunuz)
2. **Nested expressions** ile text bileşenlerinde dinamik içerik gösterin
3. **Dropdown için** mevcut `data-source` kullanımını devam ettirin
4. **Karmaşık formatlamalar** için RichText veya sunucu tarafı formatting tercih edin

**Örnek Uygulama:**

```json
{
  "version": "7.2",
  "data_api_version": "4.0",
  "screens": [
    {
      "id": "PRICE_UPDATE",
      "data": {
        "brand_name": {"type": "string", "__example__": "Nike"},
        "products": {
          "type": "array",
          "items": {"type": "object", "properties": {"id": {"type": "string"}, "title": {"type": "string"}}},
          "__example__": [{"id": "1", "title": "Air Max 90"}]
        }
      },
      "layout": {
        "children": [
          {
            "type": "TextHeading",
            "text": "`'Fiyat Güncelleme - ' ${data.brand_name}`"
          },
          {
            "type": "Dropdown",
            "name": "product",
            "label": "Ürün",
            "data-source": "${data.products}"
          },
          {
            "type": "TextInput",
            "name": "price",
            "label": "Yeni Fiyat",
            "input-type": "number"
          }
        ]
      }
    }
  ]
}
```

### 11.2 Genel Tavsiyeler

1. **Documentation'ı takip edin:** WhatsApp Flows hızlı gelişiyor, yeni özellikler eklenebilir
2. **Test edin:** Flow Builder'da preview yapın
3. **Basit tutun:** Karmaşık logic sunucu tarafında olmalı
4. **Version kontrolü:** Kullandığınız özelliklerin versiyonunu kontrol edin

---

## 12. Kaynaklar

- **WhatsApp Flows Documentation:** [Flow JSON Reference](https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson)
- **Nested Expressions:** Flow JSON v6.0+ (Mayıs 2024)
- **RichText Component:** Flow JSON v5.1+ (Mart 2024)
- **Project Documentation:** `/home/ali/whatsapp-builder/.claude/skills/whatsapp-flows-expert/`

---

**Rapor Tarihi:** 2025-11-28
**Proje:** WhatsApp Builder - Price Update Flow
**Flow Version:** 7.2
**Data API Version:** 4.0
