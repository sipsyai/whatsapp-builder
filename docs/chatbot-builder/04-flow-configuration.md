# Flow Configuration

Bu bölümde node yapılandırma modallarını ve akış ayarlarını detaylı olarak inceleyeceğiz.

## Node Yapılandırma Modalları

Her node'un **⚙️ Settings** butonuna tıklayarak yapılandırma modalını açabilirsiniz.

---

## Message Node Yapılandırması

En basit yapılandırmaya sahip node tipidir.

![Message Config](images/06-message-config-modal.png)

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| **Content** | Textarea | Evet | Gönderilecek mesaj metni |

### Örnek Kullanım

```
Merhaba! Sipsy'ye hoş geldiniz.
Size nasıl yardımcı olabilirim?
```

**Variable Kullanımı**: Mesaj içinde `{{variable_name}}` formatında değişkenler kullanabilirsiniz.

---

## Question Node Yapılandırması

### Question Type Seçimi

![Question Type Modal](images/07-question-type-modal.png)

| Tip | Açıklama | Max Seçenek |
|-----|----------|-------------|
| **Question** | Serbest metin girdisi | - |
| **Buttons** | Buton seçenekleri | 3 |
| **List** | Liste seçenekleri | 10 |

### Buttons Question Yapılandırması

![Buttons Config](images/08-buttons-question-config.png)

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| **Header Text** | Text | Hayır | Başlık metni |
| **Body Text** | Textarea | Evet | Ana soru metni |
| **Footer Text** | Text | Hayır | Alt bilgi metni |
| **Buttons** | Array | Evet | Buton listesi (max 3) |
| **Variable Name** | Text | Evet | Cevap değişkeni |

**Buton Ekleme:**
1. "New Button Label" alanına buton metnini yazın
2. **Add** butonuna tıklayın
3. Maksimum 20 karakter, 3 buton

**Buton Silme:**
Her butonun yanındaki 🗑️ ikonuna tıklayın

### Dynamic Handles

Buttons ve List tiplerinde her seçenek için ayrı çıkış handle'ı oluşturulur:

- **Yes** → Yes handle
- **No** → No handle
- **Default** → Varsayılan handle (eşleşme olmazsa)

---

## Condition Node Yapılandırması

![Condition Config](images/10-condition-config-modal.png)

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| **Label** | Text | Evet | Node etiketi |
| **Variable** | Dropdown | Evet | Kontrol edilecek değişken |
| **Operator** | Dropdown | Evet | Karşılaştırma operatörü |
| **Value** | Text | Hayır | Karşılaştırılacak değer |

### Operatör Listesi

| Operatör | Sembol | Açıklama |
|----------|--------|----------|
| Equal To | `==` | Değerler eşitse true |
| Not Equal To | `!=` | Değerler farklıysa true |
| Greater Than | `>` | Sol değer büyükse true |
| Less Than | `<` | Sol değer küçükse true |
| Greater Than or Equal | `>=` | Sol değer büyük veya eşitse true |
| Less Than or Equal | `<=` | Sol değer küçük veya eşitse true |
| Contains | - | Metin içeriyorsa true |
| Does Not Contain | - | Metin içermiyorsa true |

### Condition Preview

Modal'ın alt kısmında koşulun önizlemesi gösterilir:

```
user_choice Equal To (==) "Yes"
```

### Önemli Notlar

- Variables, önceki Question node'larından gelir
- Question node'larda **Variable Name** tanımlanmış olmalıdır
- String karşılaştırmaları büyük/küçük harf duyarlıdır

---

## REST API Node Yapılandırması

### Request Tab

![REST API Request](images/11-rest-api-config-modal.png)

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| **Label** | Text | Evet | Node etiketi |
| **HTTP Method** | Button Group | Evet | GET/POST/PUT/DELETE |
| **URL** | Text | Evet | API endpoint URL |
| **Timeout** | Number | Hayır | Zaman aşımı (varsayılan: 30000ms) |

**Dynamic URL**: URL içinde `{{variable}}` kullanabilirsiniz:
```
https://api.example.com/users/{{user_id}}
```

### Headers Tab

![REST API Headers](images/12-rest-api-headers-tab.png)

Authentication veya özel header'lar ekleyin:

| Örnek Key | Örnek Value |
|-----------|-------------|
| Authorization | Bearer {{token}} |
| Content-Type | application/json |
| X-API-Key | your-api-key |

### Response Tab

![REST API Response](images/13-rest-api-response-tab.png)

| Alan | Tip | Açıklama |
|------|-----|----------|
| **Output Variable** | Text | Başarılı yanıt değişkeni |
| **JSON Path** | Text | Veri çıkarma yolu |
| **Error Variable** | Text | Hata mesajı değişkeni |

**JSON Path Örnekleri:**

| Path | Açıklama |
|------|----------|
| `data` | Root data objesi |
| `data.items` | Items array'i |
| `data.items[0].name` | İlk öğenin adı |
| `meta.total` | Meta toplam değeri |

### Test Tab

API isteğini test ederek yanıtı önizleyin.

---

## WhatsApp Flow Node Yapılandırması

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| **Flow ID** | Text | Evet | Meta WhatsApp Flow ID |
| **CTA Text** | Text | Evet | Buton metni |
| **Mode** | Dropdown | Evet | draft/published |

---

## Yapılandırma Modal İşlemleri

Her modal'da iki ana buton bulunur:

| Buton | İşlev |
|-------|-------|
| **Cancel** | Değişiklikleri iptal et |
| **Save** | Değişiklikleri kaydet |

**Önemli**: Save butonu, tüm zorunlu alanlar doldurulana kadar devre dışı kalabilir.

