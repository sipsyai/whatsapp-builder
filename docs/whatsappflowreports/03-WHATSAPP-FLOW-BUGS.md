# WhatsApp Flow Bugları ve Sınırlamaları

**Tarih:** 2025-11-28
**Oncelik:** YUKSEK

---

## 1. Karsilasilan Bug: Text Binding Calismadi

### 1.1 Sorunun Tanimi

**Semptom:**
- `TextHeading` ve `TextBody` bilesenlerinde `${data.brand_name}` literal olarak gorundu
- Ekranda "Marka: ${data.brand_name}" yazisi cikti (degisken degeri yerine)

**Beklenen Davranis:**
- Ekranda "Marka: Nike" gorunmeli

**Gerceklesen Davranis:**
- Ekranda "${data.brand_name}" literal string gorundu

---

## 2. Kok Neden Analizi

### 2.1 WhatsApp Flow Text Binding Kurallari

| Kullanim | Sonuc | Aciklama |
|----------|-------|----------|
| `"text": "Statik metin"` | Statik metin | Sabit deger |
| `"text": "${data.field}"` | Dinamik deger | Sunucu verisini gosterir |
| `"text": "Marka: ${data.field}"` | HATALI | Static + Dynamic karisimiyor |
| `` "text": "`'Marka: ' ${data.field}`" `` | Marka: Nike | Nested expression gerekli |

### 2.2 Neden Dropdown Calisti?

```json
{
  "type": "Dropdown",
  "data-source": "${data.brands}"  // Bu CALISTI
}
```

**Sebep:** `Dropdown` bileseni `data-source` ozelligi **sadece dinamik** veri kabul eder. String concatenation gerektirmez.

### 2.3 Neden TextHeading Calismadi?

```json
{
  "type": "TextHeading",
  "text": "Marka: ${data.brand_name}"  // Bu CALISMADI
}
```

**Sebep:** `text` ozelligi hem statik hem dinamik olabilir. Static + Dynamic karistirmak icin **backtick** ve **nested expression** gerekiyor.

---

## 3. Cozum Yontemleri

### 3.1 Cozum 1: Nested Expressions (ONERILEN)

```json
{
  "type": "TextHeading",
  "text": "`'Marka: ' ${data.brand_name}`"
}
```

**Kurallar:**
- Backtick (`) ile baslar ve biter
- String literals tek tirnak (') icinde
- Degiskenler `${data.field}` formati

### 3.2 Cozum 2: Sunucu Tarafinda Formatlama

**Flow JSON:**
```json
{
  "type": "TextHeading",
  "text": "${data.formatted_brand}"
}
```

**Sunucu Yaniti:**
```json
{
  "screen": "BRAND_SCREEN",
  "data": {
    "formatted_brand": "Marka: Nike"  // Hazir string gonder
  }
}
```

### 3.3 Cozum 3: Statik Metin Kullanimi (WORKAROUND)

Degisken gosterme gerektirmeyen statik metin kullan:

```json
{
  "type": "TextHeading",
  "text": "Fiyat Guncelleme"  // Sabit baslik
}
```

**NOT:** Bu yaklaşım debugging session'inda kullanildi.

---

## 4. Desteklenen Bilesenlerin Ozeti

### 4.1 Tam Dinamik Binding Destegi

| Bilesen | Ozellik | Ornek |
|---------|---------|-------|
| Dropdown | data-source | `"${data.brands}"` |
| RadioButtonsGroup | data-source | `"${data.options}"` |
| CheckboxGroup | data-source | `"${data.items}"` |
| Image | src | `"${data.image_url}"` |

### 4.2 Nested Expression Gerektiren

| Bilesen | Ozellik | Basit | String Concat |
|---------|---------|-------|---------------|
| TextHeading | text | `"${data.x}"` | `` "`'X: ' ${data.x}`" `` |
| TextBody | text | `"${data.x}"` | `` "`'X: ' ${data.x}`" `` |
| TextSubheading | text | `"${data.x}"` | `` "`'X: ' ${data.x}`" `` |
| Footer | label | `"${data.x}"` | `` "`'X: ' ${data.x}`" `` |

---

## 5. Diger Karsilasilan Sorunlar

### 5.1 Flow Update Edilemedi (DEPRECATED Status)

**Sorun:**
```
Error: DEPRECATED Flows cannot be updated
```

**Sebep:**
- WhatsApp API, DEPRECATED statussundeki Flow'lari guncellemez
- Bir kez DEPRECATED oldugunda, sadece okunabilir

**Cozum:**
- Yeni Flow olusturuldu (ID: 1389912172544248)
- Yeni JSON yuklendi
- Eski Flow yerine yeni Flow kullanildi

### 5.2 Endpoint URI Değişikliği

**Sorun:**
- Flow endpoint'i ngrok URL'ine ayarliydi
- ngrok URL degisti, Flow calismadi

**Cozum:**
```bash
curl -X POST "https://graph.facebook.com/v24.0/{FLOW_ID}" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{"endpoint_uri": "https://new-url.ngrok.io/api/webhooks/flow-endpoint"}'
```

### 5.3 Screen Name Mismatch

**Sorun:**
- Backend `PRICE_INFO_SCREEN` donuyordu
- Flow JSON'da `PRICE_UPDATE_SCREEN` tanimli
- WhatsApp "Something went wrong" hatasi verdi

**Cozum:**
- Backend'de screen name duzeltildi
- routing_model ile uyumlu hale getirildi

---

## 6. Best Practices

### 6.1 Flow JSON Tasarimi

1. **Her zaman `__example__` tanimla:**
   ```json
   "data": {
     "brand_name": {
       "type": "string",
       "__example__": "Nike"
     }
   }
   ```

2. **routing_model'i dogru tanimla:**
   ```json
   "routing_model": {
     "BRAND_SCREEN": ["PRODUCT_SCREEN"],
     "PRODUCT_SCREEN": ["PRICE_UPDATE_SCREEN"]
   }
   ```

3. **Version kontrolu yap:**
   ```json
   {
     "version": "7.2",
     "data_api_version": "3.0"
   }
   ```

### 6.2 Endpoint Gelistirme

1. **Screen name'leri routing_model ile eslesir**
2. **data objesi ekrandaki tum degiskenleri icerir**
3. **Hata durumunda mevcut ekrani dondur, user-friendly mesaj goster**

### 6.3 Test Stratejisi

1. **Flow Preview kullan** (WhatsApp Manager)
2. **Endpoint'i curl ile test et**
3. **Tum screen gecislerini dogrula**
4. **Hata senaryolarini test et**

---

## 7. Debugging Checklist

Flow calismiyorsa kontrol et:

- [ ] Flow version >= 6.0 (nested expressions icin)
- [ ] data blogu tum alanlari tanimliyor
- [ ] __example__ degerleri var
- [ ] Backtick ve tek tirnak dogru kullaniliyor
- [ ] routing_model dogru tanimli
- [ ] Endpoint URI dogru
- [ ] Screen name'ler backend ile esliyor
- [ ] Sunucu yaniti dogru data donuyor

---

## 8. Ilgili Kaynaklar

- WhatsApp Flow JSON Reference: https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson
- Nested Expressions: v6.0+ ozelligi
- Proje Dokumantasyonu: `/docs/WHATSAPP_FLOWS_TEXT_BINDING_LIMITATIONS.md`

