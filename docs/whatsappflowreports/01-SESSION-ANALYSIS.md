# WhatsApp Flow Debugging Session Analysis

**Tarih:** 2025-11-28
**Kapsam:** Fiyat Guncelleme Flow debugging ve Strapi entegrasyonu

---

## 1. Karsilasilan Sorunlar

### 1.1 Strapi API Baglanti Sorunlari

| Sorun | Sebep | Cozum Yontemi |
|-------|-------|---------------|
| Markalar bos geliyor (401 Unauthorized) | `.env` dosyasinda `STRAPI_API_TOKEN` yazilmis ama kod `STRAPI_TOKEN` bekliyor | `.env` dosyasi manuel duzeltildi |
| Urunler gelmiyor (fetch failed) | `flow-endpoint.service.ts` icinde hardcoded localhost URL | Kod icinde manuel duzeltildi |
| Strapi 502 Error | Gecici sunucu sorunu | Beklendi |

### 1.2 WhatsApp Flow Sorunlari

| Sorun | Sebep | Cozum Yontemi |
|-------|-------|---------------|
| "Something went wrong" hatasi | Screen name mismatch (PRICE_INFO_SCREEN vs PRICE_UPDATE_SCREEN) | Kod icinde manuel duzeltildi |
| productId undefined | Flow payload'da `data.product_id` yerine `data.selected_product` geliyor | Kod icinde manuel duzeltildi |
| Degisken adlari gorunuyor (${data.xxx}) | WhatsApp Flow text binding sinirlamasi | Yeni Flow olusturuldu, static text kullanildi |

### 1.3 Chatbot Devam Etmiyor Sorunu

| Sorun | Sebep | Cozum Yontemi |
|-------|-------|---------------|
| Flow tamamlandiktan sonra chatbot devam etmiyor | `flow_token` parsing hatasi - kod 10 parca bekliyor ama 7 parca geliyor | Kod icinde manuel duzeltildi |
| Context bulunamadi hatasi | contextId sadece ilk parca aliniyordu, UUID 5 parca | Kod icinde manuel duzeltildi |

---

## 2. Database Uzerinden Yapilan Islemler

### 2.1 Chatbot Flow ID Guncelleme

```sql
-- Eski Flow ID: 836194732500069
-- Yeni Flow ID: 1389912172544248

UPDATE chatbots
SET nodes = jsonb_set(nodes, '{4,data,whatsappFlowId}', '"1389912172544248"')
WHERE id = 'd8b41e27-3f8e-43ec-943f-f38c004f2f14';
```

**NEDEN DATABASE?**
- Swagger API'de chatbot node'larini tek tek guncelleyecek endpoint YOK
- Tum chatbot'u guncelleme endpoint'i var ama sadece Flow ID icin cok riskli
- Frontend'de Flow ID degistirme UI'i YOK (sadece Flow secme dropdown'i var)

### 2.2 Context/Session Debugging

```sql
SELECT * FROM conversation_contexts WHERE id = 'xxx';
```

**NEDEN DATABASE?**
- Context debugging icin API endpoint YOK
- Session durumu (waiting_flow, running, etc.) sadece database'den gorulebiliyor

---

## 3. Swagger API ile YAPILAMAYANLAR

### 3.1 Flow Endpoint Konfigurasyonu

| Islem | API Durumu | Alternatif |
|-------|------------|------------|
| Strapi URL ayarlama | YOK | Kod degisikligi veya .env |
| Strapi Token ayarlama | YOK | Kod degisikligi veya .env |
| Flow-specific data source konfigurasyonu | YOK | Hardcoded kod |

### 3.2 Chatbot Node Guncelleme

| Islem | API Durumu | Alternatif |
|-------|------------|------------|
| Tek node'un Flow ID'sini degistirme | YOK | Database veya tam chatbot update |
| Flow node parametrelerini guncelleme | PARTIAL | Tam chatbot update gerekli |

### 3.3 WhatsApp Flow Yonetimi

| Islem | API Durumu | Alternatif |
|-------|------------|------------|
| Flow JSON preview | YOK | WhatsApp API direkt |
| Flow JSON download | YOK | WhatsApp API direkt |
| Flow deprecate etme | YOK | WhatsApp API direkt |

---

## 4. Kod Uzerinden Yapilan Duzeltmeler

### 4.1 flow-endpoint.service.ts

```typescript
// ONCEKI (HATALI)
private readonly strapiBaseUrl = 'https://gardenhausapi.sipsy.ai';
private readonly strapiToken = 'b1653f8a...';

// OLMASI GEREKEN
private readonly strapiBaseUrl = this.configService.get('STRAPI_BASE_URL');
private readonly strapiToken = this.configService.get('STRAPI_TOKEN');
```

**Duzeltilen satirlar:**
- Line 16-17: Hardcoded Strapi credentials
- Line 40-44: contextId parsing (parts[0] -> parts.slice(0,5).join('-'))
- Line 232-240: contextId parsing (ayni hata)
- Line 268: selected_product field mapping
- Line 280-295: PRICE_UPDATE_SCREEN data structure

### 4.2 chatbot-execution.service.ts

```typescript
// ONCEKI (HATALI)
if (parts.length < 10) {
  this.logger.error(`Invalid flow_token format...`);
  return;
}

// SONRAKI (DOGRU)
if (parts.length < 6) {
  this.logger.error(`Invalid flow_token format...`);
  return;
}
```

**Duzeltilen satirlar:**
- Line 1021: flow_token parsing (10 -> 6)

---

## 5. WhatsApp API ile Yapilan Islemler

### 5.1 Yeni Flow Olusturma

```bash
# 1. Flow olustur
POST /v24.0/{WABA_ID}/flows
{"name": "Fiyat Guncelleme v2", "categories": ["OTHER"]}
# Response: {"id": "1389912172544248"}

# 2. JSON yukle
POST /v24.0/{FLOW_ID}/assets
-F "name=flow.json" -F "asset_type=FLOW_JSON" -F "file=@flow.json"

# 3. Endpoint ayarla
POST /v24.0/{FLOW_ID}
{"endpoint_uri": "https://xxx.ngrok.io/api/webhooks/flow-endpoint"}

# 4. Publish et
POST /v24.0/{FLOW_ID}/publish
```

**NEDEN WHATSAPP API DIREKT?**
- Bizim backend'de Flow JSON guncelleme endpoint'i CALISMIYOR (DEPRECATED Flow'u guncelleyemez)
- Flow deprecate/delete islemleri icin endpoint YOK
- Flow status gecisleri (DRAFT -> PUBLISHED) icin uygun API YOK

---

## 6. Zaman Kaybi Analizi

| Islem | Harcanan Sure | Ideal Sure | Kayip |
|-------|---------------|------------|-------|
| Strapi baglanti debugging | 30 dk | 5 dk (UI'dan) | 25 dk |
| Flow screen name mismatch | 45 dk | 10 dk (validation) | 35 dk |
| flow_token parsing | 20 dk | 0 dk (dogru kod) | 20 dk |
| Database'den Flow ID guncelleme | 15 dk | 2 dk (UI'dan) | 13 dk |
| Yeni Flow olusturma (API) | 20 dk | 5 dk (UI'dan) | 15 dk |
| **TOPLAM** | **130 dk** | **22 dk** | **108 dk** |

---

## 7. Sonuc

Bu debugging session'da **108 dakika** (yaklasik 2 saat) gereksiz zaman kaybedildi. Bunun sebepleri:

1. **Hardcoded degerler** - Strapi URL/token kod icinde
2. **Eksik API endpoint'leri** - Chatbot node guncelleme, Flow debugging
3. **Yetersiz UI** - Flow ID degistirme, Strapi konfigurasyonu
4. **Hatali kod** - flow_token parsing mantigi
5. **Eksik validation** - Screen name uyumu kontrolu yok

Detayli gelistirme plani icin diger raporlara bakiniz.
