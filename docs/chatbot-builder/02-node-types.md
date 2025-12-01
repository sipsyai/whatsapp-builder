# Node Types

Chatbot Builder'da kullanabileceğiniz 6 farklı node tipi bulunmaktadır. Her node tipi farklı bir işlev sunar ve çeşitli yapılandırma seçeneklerine sahiptir.

## Node Listesi

Sidebar'daki **NODES** bölümünden tüm node tiplerini görebilir ve canvas'a ekleyebilirsiniz.

![Sidebar Nodes](images/04-sidebar-nodes.png)

---

## 1. Start Node

**Amaç**: Flow'un başlangıç noktasıdır. Her akışta yalnızca bir Start Node bulunur.

| Özellik | Değer |
|---------|-------|
| **Type** | `start` |
| **Renk** | Yeşil |
| **Handles** | Yalnızca çıkış (sağ taraf) |
| **Silinebilir** | Hayır |
| **Yapılandırma** | Yok |

Start Node otomatik olarak oluşturulur ve silinemez. Akışınızın ilk node'u buraya bağlanmalıdır.

---

## 2. Message Node

**Amaç**: Kullanıcıya metin mesajı gönderir.

| Özellik | Değer |
|---------|-------|
| **Type** | `message` |
| **Renk** | Mavi |
| **Handles** | Giriş (sol) + Çıkış (sağ) |
| **Icon** | 💬 chat |

### Message Node Yapılandırması

![Message Config Modal](images/06-message-config-modal.png)

| Alan | Açıklama |
|------|----------|
| **Content** | Gönderilecek mesaj metni |

**Kullanım Örneği**: Hoş geldiniz mesajı, bilgilendirme, veda mesajı

---

## 3. Question Node

**Amaç**: Kullanıcıdan girdi alır. Üç farklı alt tipi vardır.

| Özellik | Değer |
|---------|-------|
| **Type** | `question` |
| **Renk** | Turuncu |
| **Handles** | Giriş (sol) + Dinamik çıkışlar |
| **Icon** | ❓ help |

### Question Type Seçimi

Question Node eklerken önce soru tipini seçmeniz gerekir:

![Question Type Modal](images/07-question-type-modal.png)

### 3.1 Text Question

Kullanıcıdan serbest metin girdisi alır.

| Özellik | Değer |
|---------|-------|
| **Handles** | Tek çıkış |
| **Variable** | Cevabı kaydetmek için değişken adı |

### 3.2 Buttons Question

WhatsApp Interactive Buttons formatında seçenekler sunar.

![Buttons Question Config](images/08-buttons-question-config.png)

| Alan | Açıklama |
|------|----------|
| **Header Text** | (Opsiyonel) Başlık metni |
| **Body Text** | (Zorunlu) Soru metni |
| **Footer Text** | (Opsiyonel) Alt bilgi |
| **Buttons** | Maksimum 3 buton (WhatsApp limiti) |
| **Variable Name** | Seçilen butonu kaydetmek için değişken |

**Handles**: Her buton için ayrı çıkış + Default handle

### 3.3 List Question

WhatsApp Interactive List formatında seçenekler sunar.

| Alan | Açıklama |
|------|----------|
| **Sections** | Liste bölümleri |
| **Rows** | Her bölümdeki seçenekler (max 10) |
| **Variable Name** | Seçilen öğeyi kaydetmek için değişken |

---

## 4. Condition Node

**Amaç**: Koşullu dallanma sağlar. Bir değişkenin değerine göre akışı yönlendirir.

| Özellik | Değer |
|---------|-------|
| **Type** | `condition` |
| **Renk** | Mor |
| **Handles** | Giriş (sol) + True/False çıkışları |
| **Icon** | 🔀 call_split |

### Condition Node Yapılandırması

![Condition Config Modal](images/10-condition-config-modal.png)

| Alan | Açıklama |
|------|----------|
| **Label** | Node etiketi |
| **Variable** | Kontrol edilecek değişken |
| **Operator** | Karşılaştırma operatörü |
| **Value** | Karşılaştırılacak değer |

### Kullanılabilir Operatörler

| Operatör | Açıklama |
|----------|----------|
| `==` | Eşit |
| `!=` | Eşit değil |
| `>` | Büyük |
| `<` | Küçük |
| `>=` | Büyük veya eşit |
| `<=` | Küçük veya eşit |
| `contains` | İçerir |
| `does not contain` | İçermez |

### Multi-Condition Support (Condition Groups)

Condition node artik coklu kosul gruplarini desteklemektedir. Birden fazla kosulu AND veya OR ile birlestirerek karmasik mantik kurabilirsiniz.

```json
{
  "conditionGroup": {
    "conditions": [
      { "id": "c1", "variable": "age", "operator": "gt", "value": "18" },
      { "id": "c2", "variable": "country", "operator": "eq", "value": "TR" }
    ],
    "logicalOperator": "AND"
  }
}
```

Detaylar icin [Backend Execution Details](07-backend-execution.md) dokumanina bakin.

**Onemli**: Condition Node'dan once en az bir Question Node olmali ve variable tanimlanmis olmalidir.

### BUTTONS/LIST Selection Davranisi

BUTTONS veya LIST sorularinda kullanici secim yaptiginda, backend **ID** degerini kaydeder (title degil). Bu sayede condition kontrollerinde ID karsilastirmasi yapilabilir.

Ornek: Kullanici "Berber Randevu" butonuna tikladiginda `selected_service` variable'ina `"berber"` (button ID) kaydedilir, `"Berber Randevu"` degil.

---

## 5. WhatsApp Flow Node

**Amaç**: Meta WhatsApp Flows tetikler. Form toplama, anket gibi interaktif deneyimler sunar.

| Özellik | Değer |
|---------|-------|
| **Type** | `whatsapp_flow` |
| **Renk** | Yeşil gradient |
| **Handles** | Giriş (sol) + Çıkış (sağ) |
| **Icon** | ✅ check_box |

### WhatsApp Flow Node Yapılandırması

| Alan | Açıklama |
|------|----------|
| **Flow ID** | Meta Flow ID |
| **CTA Text** | Call-to-action buton metni |
| **Mode** | `draft` veya `published` |

---

## 6. REST API Node

**Amaç**: Harici API'lere HTTP istekleri gönderir.

| Özellik | Değer |
|---------|-------|
| **Type** | `rest_api` |
| **Renk** | Cyan-mavi gradient |
| **Handles** | Giriş (sol) + Success/Error çıkışları |
| **Icon** | 🔗 api |

### REST API Node Yapılandırması

REST API Node 4 sekmeden oluşur:

#### Request Tab

![REST API Request](images/11-rest-api-config-modal.png)

| Alan | Açıklama |
|------|----------|
| **Label** | Node etiketi |
| **HTTP Method** | GET, POST, PUT, DELETE |
| **URL** | API endpoint (`{{variable}}` desteği) |
| **Timeout** | İstek zaman aşımı (ms) |

#### Headers Tab

![REST API Headers](images/12-rest-api-headers-tab.png)

| Alan | Açıklama |
|------|----------|
| **Header Key** | HTTP header adı |
| **Header Value** | HTTP header değeri |
| **Add Header** | Yeni header ekleme |

#### Response Tab

![REST API Response](images/13-rest-api-response-tab.png)

| Alan | Açıklama |
|------|----------|
| **Output Variable** | Başarılı yanıtı kaydetme değişkeni |
| **JSON Path** | Yanıttan veri çıkarma (ör: `data.items[0].name`) |
| **Error Variable** | Hata mesajını kaydetme değişkeni |

#### Test Tab

API isteğini test etme arayüzü.

---

## Node İşlemleri

Her node'un üzerinde iki işlem butonu bulunur:

| Buton | İşlem |
|-------|-------|
| **⚙️ Settings** | Node yapılandırma modalını açar |
| **🗑️ Delete** | Node'u siler |

---

## Canvas Üzerinde Node'lar

Tüm node'lar canvas üzerinde görsel olarak bağlanabilir:

![Canvas All Nodes](images/14-canvas-all-nodes.png)

