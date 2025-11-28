# 📊 Stok & Fiyat Yönetimi Chatbot - Flow Diyagramları

## 🎯 Ana Flow Yapısı

```mermaid
graph TD
    START([START]) --> WELCOME[Welcome Message]
    WELCOME --> MENU{Ana Menü<br/>3 Buton}
    MENU -->|📦 Stok Güncelle| STOCK_FLOW[Stok Güncelleme Flow]
    MENU -->|💰 Fiyat Güncelle| PRICE_FLOW[Fiyat Güncelleme Flow]
    MENU -->|⚠️ Düşük Stok| LOWSTOCK_FLOW[Düşük Stok Flow]
    MENU -->|Default/Text| SEARCH[Arama/Menu Check]

    STOCK_FLOW --> CONTINUE{Devam Et?}
    PRICE_FLOW --> CONTINUE
    LOWSTOCK_FLOW --> CONTINUE

    CONTINUE -->|Evet| MENU
    CONTINUE -->|Hayır| GOODBYE[Hoşça Kal Mesajı]
    GOODBYE --> END([END])
```

---

## 📦 Stok Güncelleme Flow (Detaylı)

```mermaid
graph TD
    START_STOCK[Stok Güncelle Butonu] --> API_CAT[API: Kategorileri Getir]

    API_CAT -->|Success| CAT_LIST{Kategori Listesi<br/>Dynamic List}
    API_CAT -->|Error| CAT_ERROR[Hata Mesajı:<br/>Kategoriler yüklenemedi]
    CAT_ERROR --> BACK_MENU[Ana Menü]

    CAT_LIST --> API_PROD[API: Kategoriye Göre<br/>Ürünleri Getir]

    API_PROD -->|Success| CHECK_EMPTY{Ürün Var mı?}
    API_PROD -->|Error| PROD_ERROR[Hata Mesajı:<br/>Ürünler yüklenemedi]
    PROD_ERROR --> BACK_MENU

    CHECK_EMPTY -->|Hayır| NO_PROD[Ürün Bulunamadı<br/>Mesajı]
    NO_PROD --> BACK_MENU

    CHECK_EMPTY -->|Evet| PROD_LIST{Ürün Listesi<br/>Dynamic List}
    PROD_LIST --> API_DETAIL[API: Ürün Detayı Getir]

    API_DETAIL -->|Success| SHOW_STOCK[Mevcut Stok Göster<br/>Ürün: X<br/>Stok: Y adet]
    API_DETAIL -->|Error| DETAIL_ERROR[Detay Hatası]
    DETAIL_ERROR --> BACK_MENU

    SHOW_STOCK --> INPUT_STOCK[Yeni Stok Gir<br/>Text Input]
    INPUT_STOCK --> VALIDATE{Geçerli mi?<br/>">= 0"}

    VALIDATE -->|Hayır| INVALID[Geçersiz Stok!<br/>0 veya üstü girin]
    INVALID --> INPUT_STOCK

    VALIDATE -->|Evet| API_UPDATE[API: Stok Güncelle<br/>PUT /products/id]

    API_UPDATE -->|Success| SUCCESS[✅ Başarılı!<br/>Eski: X → Yeni: Y]
    API_UPDATE -->|Error| UPDATE_ERROR[Güncelleme Hatası]
    UPDATE_ERROR --> BACK_MENU

    SUCCESS --> CONTINUE{Devam Et?}

    style START_STOCK fill:#e3f2fd
    style API_CAT fill:#fff3e0
    style API_PROD fill:#fff3e0
    style API_DETAIL fill:#fff3e0
    style API_UPDATE fill:#fff3e0
    style SUCCESS fill:#c8e6c9
    style CAT_ERROR fill:#ffcdd2
    style PROD_ERROR fill:#ffcdd2
    style DETAIL_ERROR fill:#ffcdd2
    style UPDATE_ERROR fill:#ffcdd2
```

---

## 💰 Fiyat Güncelleme Flow (Detaylı)

```mermaid
graph TD
    START_PRICE[Fiyat Güncelle Butonu] --> API_BRAND[API: Markaları Getir]

    API_BRAND -->|Success| BRAND_LIST{Marka Listesi<br/>Dynamic List}
    API_BRAND -->|Error| BRAND_ERROR[Hata Mesajı:<br/>Markalar yüklenemedi]
    BRAND_ERROR --> BACK_MENU[Ana Menü]

    BRAND_LIST --> API_BRAND_PROD[API: Markaya Göre<br/>Ürünleri Getir]

    API_BRAND_PROD -->|Success| CHECK_BRAND_EMPTY{Ürün Var mı?}
    API_BRAND_PROD -->|Error| BRAND_PROD_ERROR[Hata Mesajı:<br/>Ürünler yüklenemedi]
    BRAND_PROD_ERROR --> BACK_MENU

    CHECK_BRAND_EMPTY -->|Hayır| NO_BRAND_PROD[Bu Markada<br/>Ürün Yok]
    NO_BRAND_PROD --> BACK_MENU

    CHECK_BRAND_EMPTY -->|Evet| BRAND_PROD_LIST{Ürün Listesi<br/>Dynamic List}
    BRAND_PROD_LIST --> API_BRAND_DETAIL[API: Ürün Detayı Getir]

    API_BRAND_DETAIL -->|Success| SHOW_PRICE[Mevcut Fiyat Göster<br/>Ürün: X<br/>Fiyat: Y TL]
    API_BRAND_DETAIL -->|Error| BRAND_DETAIL_ERROR[Detay Hatası]
    BRAND_DETAIL_ERROR --> BACK_MENU

    SHOW_PRICE --> INPUT_PRICE[Yeni Fiyat Gir<br/>Text Input]
    INPUT_PRICE --> VALIDATE_PRICE{Geçerli mi?<br/>"&gt; 0"}

    VALIDATE_PRICE -->|Hayır| INVALID_PRICE[Geçersiz Fiyat!<br/>0'dan büyük girin]
    INVALID_PRICE --> INPUT_PRICE

    VALIDATE_PRICE -->|Evet| API_UPDATE_PRICE[API: Fiyat Güncelle<br/>PUT /products/id]

    API_UPDATE_PRICE -->|Success| PRICE_SUCCESS[✅ Başarılı!<br/>Eski: X TL → Yeni: Y TL]
    API_UPDATE_PRICE -->|Error| PRICE_UPDATE_ERROR[Güncelleme Hatası]
    PRICE_UPDATE_ERROR --> BACK_MENU

    PRICE_SUCCESS --> CONTINUE{Devam Et?}

    style START_PRICE fill:#e3f2fd
    style API_BRAND fill:#fff3e0
    style API_BRAND_PROD fill:#fff3e0
    style API_BRAND_DETAIL fill:#fff3e0
    style API_UPDATE_PRICE fill:#fff3e0
    style PRICE_SUCCESS fill:#c8e6c9
    style BRAND_ERROR fill:#ffcdd2
    style BRAND_PROD_ERROR fill:#ffcdd2
    style BRAND_DETAIL_ERROR fill:#ffcdd2
    style PRICE_UPDATE_ERROR fill:#ffcdd2
```

---

## ⚠️ Düşük Stok Raporu Flow (Detaylı)

```mermaid
graph TD
    START_LOW[Düşük Stok Butonu] --> API_LOW[API: Düşük Stok Getir<br/>stock &lt; 10]

    API_LOW -->|Success| CHECK_LOW_EMPTY{Düşük Stok<br/>Var mı?}
    API_LOW -->|Error| LOW_ERROR[Hata Mesajı:<br/>Rapor alınamadı]
    LOW_ERROR --> BACK_MENU[Ana Menü]

    CHECK_LOW_EMPTY -->|Hayır| NO_LOW[✅ Harika!<br/>Düşük stok yok]
    NO_LOW --> BACK_MENU

    CHECK_LOW_EMPTY -->|Evet| SHOW_LOW_LIST[⚠️ Düşük Stok Listesi<br/>X ürün düşük stokta]
    SHOW_LOW_LIST --> LOW_ACTION{Ne Yapmak<br/>İstersiniz?}

    LOW_ACTION -->|Stok Güncelle| LOW_PROD_LIST{Ürün Seç<br/>Dynamic List}
    LOW_ACTION -->|Ana Menü| BACK_MENU

    LOW_PROD_LIST --> API_LOW_DETAIL[API: Ürün Detayı Getir]

    API_LOW_DETAIL -->|Success| SHOW_LOW_DETAIL[⚠️ DİKKAT!<br/>Düşük Stok: Y adet]
    API_LOW_DETAIL -->|Error| LOW_DETAIL_ERROR[Detay Hatası]
    LOW_DETAIL_ERROR --> BACK_MENU

    SHOW_LOW_DETAIL --> INPUT_LOW_STOCK[Yeni Stok Gir<br/>Text Input]
    INPUT_LOW_STOCK --> API_UPDATE_LOW[API: Stok Güncelle<br/>PUT /products/id]

    API_UPDATE_LOW -->|Success| LOW_SUCCESS[✅ Başarılı!<br/>Stok güncellendi]
    API_UPDATE_LOW -->|Error| LOW_UPDATE_ERROR[Güncelleme Hatası]
    LOW_UPDATE_ERROR --> BACK_MENU

    LOW_SUCCESS --> CONTINUE{Devam Et?}

    style START_LOW fill:#e3f2fd
    style API_LOW fill:#fff3e0
    style API_LOW_DETAIL fill:#fff3e0
    style API_UPDATE_LOW fill:#fff3e0
    style LOW_SUCCESS fill:#c8e6c9
    style NO_LOW fill:#c8e6c9
    style LOW_ERROR fill:#ffcdd2
    style LOW_DETAIL_ERROR fill:#ffcdd2
    style LOW_UPDATE_ERROR fill:#ffcdd2
    style SHOW_LOW_LIST fill:#fff9c4
    style SHOW_LOW_DETAIL fill:#fff9c4
```

---

## 🔄 Edge Routing Türleri

```mermaid
graph LR
    subgraph "Sequential Edge"
        A[Node A] --> B[Node B]
    end

    subgraph "Button Edge"
        C{Button Question} -->|sourceHandle: btn_id| D[Target Node]
    end

    subgraph "API Success/Error"
        E[API Node] -->|sourceHandle: success| F[Success Path]
        E -->|sourceHandle: error| G[Error Path]
    end

    subgraph "Condition True/False"
        H{Condition} -->|sourceHandle: true| I[True Path]
        H -->|sourceHandle: false| J[False Path]
    end

    style A fill:#e3f2fd
    style C fill:#fff3e0
    style E fill:#ffecb3
    style H fill:#f3e5f5
```

---

## 🛡️ Hata Yönetimi Patterns

```mermaid
graph TD
    subgraph "Pattern 1: API Error Recovery"
        API1[API Call] -->|Error| ERR1[Error Message]
        ERR1 --> MENU1[Back to Menu]
    end

    subgraph "Pattern 2: Validation Error Retry"
        COND1{Validation} -->|False| ERR2[Error Message]
        ERR2 --> INPUT1[Retry Input]
        INPUT1 --> COND1
    end

    subgraph "Pattern 3: Empty Data Handling"
        COND2{Data Empty?} -->|Yes| ERR3[No Data Message]
        ERR3 --> MENU2[Back to Menu]
        COND2 -->|No| SHOW1[Show Data]
    end

    style API1 fill:#fff3e0
    style ERR1 fill:#ffcdd2
    style ERR2 fill:#ffcdd2
    style ERR3 fill:#ffcdd2
    style COND1 fill:#f3e5f5
    style COND2 fill:#f3e5f5
```

---

## 📊 Variable Flow (Stok Güncelleme Örneği)

```mermaid
graph TD
    START_VAR[START] --> SET1["Set: main_menu_choice<br/>'stock_update'"]
    SET1 --> API1[API: Get Categories]
    API1 --> SET2["Set: categories<br/>[array of categories]"]
    SET2 --> USER1[User Selects Category]
    USER1 --> SET3["Set: selected_category_slug<br/>'bahce-ekipmanlari'"]
    SET3 --> API2["API: Get Products<br/>URL uses {{selected_category_slug}}"]
    API2 --> SET4["Set: products_by_category<br/>[array of products]"]
    SET4 --> USER2[User Selects Product]
    USER2 --> SET5["Set: selected_product_id<br/>'prod123'"]
    SET5 --> API3["API: Get Detail<br/>URL uses {{selected_product_id}}"]
    API3 --> SET6["Set: product_detail<br/>{name, sku, stock, price}"]
    SET6 --> SHOW["Show: {{product_detail.name}}<br/>{{product_detail.stock}} adet"]
    SHOW --> USER3[User Enters New Stock]
    USER3 --> SET7["Set: new_stock_amount<br/>'150'"]
    SET7 --> API4["API: Update<br/>Body: {stock: {{new_stock_amount}}}"]
    API4 --> SET8["Set: update_result<br/>{updated product}"]
    SET8 --> FINAL["Show: Eski {{product_detail.stock}}<br/>Yeni {{new_stock_amount}}"]

    style SET1 fill:#e1f5fe
    style SET2 fill:#e1f5fe
    style SET3 fill:#e1f5fe
    style SET4 fill:#e1f5fe
    style SET5 fill:#e1f5fe
    style SET6 fill:#e1f5fe
    style SET7 fill:#e1f5fe
    style SET8 fill:#e1f5fe
    style API1 fill:#fff3e0
    style API2 fill:#fff3e0
    style API3 fill:#fff3e0
    style API4 fill:#fff3e0
```

---

## 🎨 Dynamic List Processing

```mermaid
graph TD
    API[API Returns Data] --> CHECK{Check Response<br/>Structure}
    CHECK --> EXTRACT["Extract using<br/>apiResponsePath"]
    EXTRACT --> STORE["Store in Variable<br/>(e.g., 'categories')"]
    STORE --> QUESTION["Question Node<br/>dynamicListSource: 'categories'"]
    QUESTION --> MAP["Map Array Items:<br/>- Label: {{item[dynamicLabelField]}}<br/>- Desc: {{item[dynamicDescField]}}"]
    MAP --> PAGINATE{Array Length<br/>&gt; 8?}
    PAGINATE -->|Yes| PAGES["Create Pages<br/>8 items per page<br/>+ Navigation buttons"]
    PAGINATE -->|No| SINGLE["Single Page List"]
    PAGES --> DISPLAY[Display WhatsApp List]
    SINGLE --> DISPLAY
    DISPLAY --> USER[User Selects Item]
    USER --> SAVE["Save selected item's<br/>documentId to variable"]

    style API fill:#fff3e0
    style STORE fill:#e1f5fe
    style QUESTION fill:#f3e5f5
    style DISPLAY fill:#c8e6c9
    style SAVE fill:#e1f5fe
```

---

## 🔀 Chatbot Node Type Distribution

```mermaid
pie title Node Type Distribution (54 Total)
    "MESSAGE" : 24
    "QUESTION" : 14
    "REST_API" : 11
    "CONDITION" : 8
    "START" : 1
```

---

## 📈 API Call Frequency by Flow

```mermaid
graph LR
    subgraph "Stok Güncelleme (4 API Calls)"
        S1[GET Categories] --> S2[GET Products by Category]
        S2 --> S3[GET Product Detail]
        S3 --> S4[PUT Update Stock]
    end

    subgraph "Fiyat Güncelleme (4 API Calls)"
        P1[GET Brands] --> P2[GET Products by Brand]
        P2 --> P3[GET Product Detail]
        P3 --> P4[PUT Update Price]
    end

    subgraph "Düşük Stok (3 API Calls)"
        L1[GET Low Stock Products] --> L2[GET Product Detail]
        L2 --> L3[PUT Update Stock]
    end

    style S1 fill:#fff3e0
    style S2 fill:#fff3e0
    style S3 fill:#fff3e0
    style S4 fill:#ffccbc
    style P1 fill:#fff3e0
    style P2 fill:#fff3e0
    style P3 fill:#fff3e0
    style P4 fill:#ffccbc
    style L1 fill:#fff3e0
    style L2 fill:#fff3e0
    style L3 fill:#ffccbc
```

---

## 🎯 Complete User Journey (Stok Güncelleme)

```mermaid
sequenceDiagram
    participant U as User
    participant B as Chatbot
    participant API as Strapi API

    U->>B: Start conversation
    B->>U: Welcome message
    B->>U: Main menu (3 buttons)
    U->>B: Click "Stok Güncelle"

    B->>API: GET /categories
    API-->>B: [Categories array]
    B->>U: Category list (dynamic)

    U->>B: Select "Bahçe Ekipmanları"
    B->>API: GET /products?category=bahce-ekipmanlari
    API-->>B: [Products array]
    B->>U: Product list (dynamic)

    U->>B: Select "Bahçe Hortumu 20m"
    B->>API: GET /products/prod123
    API-->>B: {product detail}
    B->>U: Current stock: 45 adet

    B->>U: "Yeni stok girin:"
    U->>B: "150"

    Note over B: Validate: 150 >= 0 ✓

    B->>API: PUT /products/prod123<br/>{data: {stock: 150}}
    API-->>B: {updated product}
    B->>U: ✅ Success! 45 → 150

    B->>U: "Devam et?"
    U->>B: "Hayır, Çıkış"
    B->>U: Goodbye message
```

---

## 🔐 Error Recovery Journey

```mermaid
sequenceDiagram
    participant U as User
    participant B as Chatbot
    participant API as Strapi API

    U->>B: Click "Stok Güncelle"
    B->>API: GET /categories
    API--xB: 500 Internal Server Error

    Note over B: Error edge triggered

    B->>U: ❌ Kategoriler yüklenemedi<br/>Error: 500
    B->>U: Back to Main Menu

    Note over U: User tries again

    U->>B: Click "Stok Güncelle"
    B->>API: GET /categories
    API-->>B: [Categories] ✓
    B->>U: Category list

    Note over B: Flow continues normally
```

---

## 📊 Validation Flow Example

```mermaid
sequenceDiagram
    participant U as User
    participant B as Chatbot

    B->>U: "Yeni stok girin:"
    U->>B: "-10"

    Note over B: Condition: -10 >= 0?<br/>Result: FALSE

    B->>U: ❌ Geçersiz stok!<br/>0 veya üstü girin
    B->>U: "Yeni stok girin:" (retry)

    U->>B: "150"

    Note over B: Condition: 150 >= 0?<br/>Result: TRUE

    Note over B: Continue to update...
```

---

## 🗺️ Complete System Architecture

```mermaid
graph TB
    subgraph "WhatsApp"
        USER[👤 User]
    end

    subgraph "WhatsApp Builder Backend"
        WB[WebHook Handler]
        EXEC[Chatbot Execution Service]
        API_EXEC[REST API Executor]
        MSG[Message Service]
    end

    subgraph "Database"
        DB[(PostgreSQL)]
        CHAT_TABLE[chatbots table]
        CONV_TABLE[conversations table]
        CTX_TABLE[conversation_contexts table]
    end

    subgraph "Strapi Backend"
        STRAPI[Strapi API]
        STRAPI_DB[(Strapi DB)]
    end

    USER <-->|Messages| WB
    WB --> EXEC
    EXEC --> API_EXEC
    API_EXEC -->|HTTP Requests| STRAPI
    STRAPI <--> STRAPI_DB
    EXEC --> MSG
    MSG -->|Send Messages| USER
    EXEC <--> DB
    DB --- CHAT_TABLE
    DB --- CONV_TABLE
    DB --- CTX_TABLE

    style USER fill:#e3f2fd
    style EXEC fill:#fff3e0
    style API_EXEC fill:#ffccbc
    style STRAPI fill:#c8e6c9
    style DB fill:#f3e5f5
```

---

## 📝 Legend

### Node Colors
- 🔵 **Blue** (#e3f2fd): Start/Entry points
- 🟡 **Yellow** (#fff3e0): API calls
- 🟢 **Green** (#c8e6c9): Success states
- 🔴 **Red** (#ffcdd2): Error states
- 🟣 **Purple** (#f3e5f5): Conditions/Decisions
- 🟠 **Orange** (#ffccbc): Update/PUT operations
- ⚪ **Light Yellow** (#fff9c4): Warning/Alert states

### Node Shapes
- **Rectangle**: Process/Action
- **Diamond**: Decision/Condition
- **Rounded Rectangle**: Start/End
- **Parallelogram**: Input/Output
- **Circle**: Connection point

---

**Flow Diagram Version**: 1.0.0
**Created**: 2025-11-27
**Format**: Mermaid.js

**Note**: Bu diyagramları Markdown destekleyen herhangi bir platformda (GitHub, GitLab, Notion, vb.) görselleştirebilirsiniz.
