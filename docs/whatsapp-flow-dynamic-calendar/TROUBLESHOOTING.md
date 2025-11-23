# Troubleshooting Rehberi

Sık karşılaşılan sorunlar ve çözümleri.

---

## 📋 İçindekiler

1. [Server Issues](#server-issues)
2. [Flow Creation Errors](#flow-creation-errors)
3. [Endpoint Configuration](#endpoint-configuration)
4. [Message Sending Errors](#message-sending-errors)
5. [Dynamic Data Issues](#dynamic-data-issues)
6. [Encryption Problems](#encryption-problems)

---

## 1. Server Issues

### ❌ EADDRINUSE: Port 3000 already in use

**Hata**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Sebep**: Port 3000'de başka bir Node.js process çalışıyor

**Çözüm 1 - Process'i Öldür (Windows)**:
```bash
# Port'u kullanan process'i bul
netstat -ano | findstr :3000

# Output örneği:
# TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       12345

# Process'i öldür
taskkill /PID 12345 /F
```

**Çözüm 2 - Process'i Öldür (Mac/Linux)**:
```bash
# Port'u kullanan process'i bul ve öldür
lsof -ti:3000 | xargs kill -9
```

**Çözüm 3 - Farklı Port Kullan**:
```env
# .env
PORT=3001
```

---

### ❌ TypeScript Compilation Errors

**Hata**:
```
src/flows/mock-calendar.service.ts:111:18 - error TS2345:
Argument of type '{ id: string; title: string; enabled: boolean; }'
is not assignable to parameter of type 'never'.
```

**Sebep**: Array type annotation eksik

**Çözüm**:
```typescript
// ❌ Yanlış
const dates = [];

// ✅ Doğru
const dates: Array<{ id: string; title: string; enabled: boolean }> = [];
```

---

### ❌ Module Not Found

**Hata**:
```
Error: Cannot find module 'axios'
```

**Çözüm**:
```bash
cd server
npm install
```

---

## 2. Flow Creation Errors

### ❌ Invalid Flow JSON Version

**Hata**:
```json
{
  "error": {
    "message": "INVALID_FLOW_JSON_VERSION",
    "code": 100
  }
}
```

**Çözüm**: Flow version'ı 7.2 kullan:
```json
{
  "version": "7.2"
}
```

---

### ❌ Missing Required Property

**Hata**:
```json
{
  "validation_errors": [
    {
      "error": "MISSING_REQUIRED_PROPERTY",
      "message": "The property 'routing_model' is required for property 'data_api_version'."
    }
  ]
}
```

**Sebep**: `data_api_version` kullanıldığında `routing_model` zorunlu

**Çözüm**: Routing model ekle:
```json
{
  "version": "7.2",
  "data_api_version": "3.0",
  "routing_model": {
    "MAIN_MENU": ["DATETIME_SCREEN"],
    "DATETIME_SCREEN": ["CUSTOMER_INFO"],
    "CUSTOMER_INFO": ["SUCCESS"],
    "SUCCESS": []
  }
}
```

---

### ❌ Invalid Routing Model

**Hata**:
```json
{
  "error": "INVALID_ROUTING_MODEL",
  "message": "Backward route [DATETIME_SCREEN->MAIN_MENU] is not allowed"
}
```

**Sebep**: Routing model sadece forward route kabul eder

**Çözüm**:
```json
// ❌ Yanlış
{
  "routing_model": {
    "MAIN_MENU": ["DATETIME_SCREEN"],
    "DATETIME_SCREEN": ["CUSTOMER_INFO", "MAIN_MENU"]  // ❌ Backward route
  }
}

// ✅ Doğru
{
  "routing_model": {
    "MAIN_MENU": ["DATETIME_SCREEN"],
    "DATETIME_SCREEN": ["CUSTOMER_INFO"]  // ✅ Sadece forward
  }
}
```

---

### ❌ Invalid Property Type

**Hata**:
```json
{
  "error": "INVALID_PROPERTY_TYPE",
  "message": "Expected property 'enabled' to be of type 'boolean' but found 'string'",
  "path": "screens[1].layout.children[2].enabled"
}
```

**Sebep**: Boolean expression string olarak yorumlandı

**Çözüm**: enabled property'sini kaldır veya boolean değer kullan:
```json
// ❌ Yanlış
{
  "enabled": "${form.appointment_date != ''}"
}

// ✅ Çözüm 1: Kaldır
{
  // enabled olmadan
}

// ✅ Çözüm 2: Boolean kullan
{
  "enabled": true
}
```

---

### ❌ Missing Form Component

**Hata**:
```json
{
  "error": "Missing Form component ${form.service} for screen 'SUCCESS'"
}
```

**Sebep**: SUCCESS screen, kendi screen'indeki form field'a erişmeye çalışıyor

**Çözüm**: Cross-screen referencing kullan:
```json
// ❌ Yanlış (SUCCESS screen'inde)
{
  "payload": {
    "service": "${form.service}"  // SUCCESS'de böyle bir form yok
  }
}

// ✅ Doğru
{
  "payload": {
    "service": "${screen.MAIN_MENU.form.service}"  // MAIN_MENU'den al
  }
}
```

---

## 3. Endpoint Configuration

### ❌ Endpoint Not Responding

**Hata**: WhatsApp "Endpoint verification failed" gösteriyor

**Kontrol Listesi**:

1. **Server çalışıyor mu?**
   ```bash
   curl http://localhost:3000/flow-webhook/public-key
   ```

2. **ngrok çalışıyor mu?**
   ```bash
   curl https://your-ngrok-url.ngrok.io/flow-webhook/public-key
   ```

3. **Endpoint URL doğru mu?**
   - HTTPS ile başlamalı
   - `/flow-webhook` path'i olmalı

4. **Public key doğru kopyalandı mı?**
   - Server log'larından tam olarak kopyala
   - BEGIN ve END satırları dahil

---

### ❌ ngrok Connection Refused

**Hata**:
```
ngrok: ERROR: connect: connection refused
```

**Sebep**: Server port 3000'de çalışmıyor

**Çözüm**:
```bash
# Önce server'ı başlat
cd server
npm run start:dev

# Sonra ngrok'u başlat
ngrok http 3000
```

---

### ❌ ngrok Session Expired

**Hata**: ngrok URL artık çalışmıyor

**Sebep**: Ücretsiz ngrok 8 saat sonra URL değiştiriyor

**Çözüm 1 - Yeni URL Al**:
```bash
# ngrok'u yeniden başlat
ngrok http 3000

# Yeni URL'i WhatsApp Business Manager'da güncelle
```

**Çözüm 2 - Static Domain (Ücretli)**:
```bash
ngrok http 3000 --domain=your-static-domain.ngrok.io
```

---

## 4. Message Sending Errors

### ❌ Invalid OAuth Access Token

**Hata**:
```json
{
  "error": {
    "message": "Invalid OAuth access token",
    "type": "OAuthException",
    "code": 190
  }
}
```

**Sebep**: Access token geçersiz veya expired

**Çözüm**:
1. WhatsApp > API Setup'tan yeni temporary token al
2. Veya system user token oluştur (kalıcı)
3. `.env` dosyasını güncelle

---

### ❌ Phone Number Not Found

**Hata**:
```json
{
  "error": {
    "message": "Phone number not found",
    "code": 100
  }
}
```

**Çözüm**: `.env` dosyasında `PHONE_NUMBER_ID` doğru olduğundan emin ol

---

### ❌ Flow Not Found

**Hata**:
```json
{
  "error": {
    "message": "Flow not found",
    "code": 100
  }
}
```

**Çözüm**:
1. Flow ID'yi kontrol et
2. Flow silindi mi kontrol et:
   ```bash
   curl "https://graph.facebook.com/v24.0/{FLOW_ID}" \
     -H "Authorization: Bearer {TOKEN}"
   ```

---

### ❌ Wrong Flow Content in Test Message

**Sorun**: Test mesajında eski Flow JSON'u görünüyor

**Sebep**: `mode: 'draft'` parametresi eksik, published version gösteriliyor

**Çözüm**:
```javascript
// test-send-message.js
parameters: {
  flow_message_version: '3',
  mode: 'draft',  // ✅ Bu satırı ekle
  flow_id: FLOW_ID,
  // ...
}
```

---

## 5. Dynamic Data Issues

### ❌ Empty Dropdown Options

**Sorun**: Dropdown boş, seçenek yok

**Debug Adımları**:

1. **Server log'larını kontrol et**:
   ```
   [MockCalendar] ali için 2025-01-24 tarihinde müsait saatler: []
   ```

2. **Mock tarihleri güncelle**:
   ```typescript
   // mock-calendar.service.ts
   private mockEvents: CalendarEvent[] = [
     {
       stylist: 'ali',
       date: '2025-01-24',  // ❌ Geçmiş tarih
       // ...
     }
   ];
   ```

   Tarihleri bugün veya gelecek olacak şekilde güncelle.

3. **Webhook response'u kontrol et**:
   ```json
   {
     "version": "3.0",
     "screen": "DATETIME_SCREEN",
     "data": {
       "available_slots": []  // ❌ Boş
     }
   }
   ```

---

### ❌ Data Not Updating

**Sorun**: Kuaför değiştirildiğinde slot'lar güncellenmiyor

**Sebep**: `on-select-action` eksik veya yanlış

**Çözüm**:
```json
{
  "type": "Dropdown",
  "name": "stylist",
  "on-select-action": {
    "name": "data_exchange",  // ✅ Doğru action
    "payload": {
      "action": "get_stylist_info",
      "stylist": "${form.stylist}"
    }
  }
}
```

---

### ❌ Cross-Screen Data Not Working

**Sorun**: `${screen.MAIN_MENU.form.service}` undefined

**Sebep**: Screen ID veya field name yanlış

**Debug**:
```typescript
// Webhook'ta log ekle
console.log('All form data:', JSON.stringify(decryptedRequest, null, 2));
```

**Çözüm**:
- Screen ID'yi kontrol et (büyük/küçük harf)
- Field name'i kontrol et (snake_case)

---

## 6. Encryption Problems

### ❌ Decryption Failed

**Hata**:
```
Error: Unsupported state or unable to authenticate data
```

**Sebep**: Public/private key uyumsuz

**Çözüm**:
1. Server'ı yeniden başlat (yeni key pair oluşturulur)
2. Yeni public key'i kopyala
3. WhatsApp Business Manager'da güncelle

---

### ❌ Invalid Encrypted Data

**Hata**:
```
Error: Invalid base64 string
```

**Sebep**: Request body bozuk

**Debug**:
```typescript
console.log('Raw request body:', body);
console.log('Encrypted data length:', body.encrypted_flow_data?.length);
```

---

## 7. Development Issues

### ❌ Hot Reload Not Working

**Sorun**: Kod değişiklikleri uygulanmıyor

**Çözüm**:
```bash
# Watch mode'u yeniden başlat
npm run start:dev
```

---

### ❌ Environment Variables Not Loading

**Sorun**: `process.env.WHATSAPP_ACCESS_TOKEN` undefined

**Çözüm**:
1. `.env` dosyası `server/` dizininde mi?
2. `require('dotenv').config()` çağrılıyor mu?
3. Server restart yapıldı mı?

---

## 8. Testing Issues

### ❌ Can't Test Flow in Preview

**Sorun**: Preview URL açılmıyor

**Çözüm**:
1. Flow ID doğru mu?
2. WhatsApp Business Manager'da login olunmuş mu?
3. Browser cache temizle

---

### ❌ Webhook Logs Not Showing

**Sorun**: Server'a request gelmiyor gibi görünüyor

**Debug**:
1. **ngrok Inspector'ı aç**: http://localhost:4040
2. Request'leri orada görebilirsin
3. Response time'ı kontrol et (2 saniyeden az olmalı)

---

## 9. Production Issues

### ❌ Rate Limit Exceeded

**Hata**:
```json
{
  "error": {
    "code": 4,
    "message": "Too many messages sent from this phone number"
  }
}
```

**Çözüm**:
- Tier limit'ini yükselt (Business verification gerekli)
- Rate limiting ekle

---

### ❌ Webhook Timeout

**Sorun**: WhatsApp "Request timeout" error veriyor

**Sebep**: Webhook 2 saniyeden fazla sürüyor

**Çözüm**:
```typescript
// Ağır işlemleri asenkron yap
async handleDataExchange(data: any) {
  // ✅ Hızlı response dön
  const response = {
    version: '3.0',
    screen: 'LOADING',
    data: {}
  };

  // ❌ Ağır işlemleri background'da yap
  this.processInBackground(data);

  return response;
}
```

---

## 🆘 Hala Çözemediysen?

### Log Dosyalarını İncele

```bash
# Server logs
cd server
npm run start:dev 2>&1 | tee server.log

# Flow validation errors
node create-dynamic-flow.js > flow-creation.log 2>&1
```

### Debug Mode

```typescript
// Tüm request/response'ları logla
console.log('='.repeat(50));
console.log('REQUEST:', JSON.stringify(decryptedRequest, null, 2));
console.log('RESPONSE:', JSON.stringify(responseData, null, 2));
console.log('='.repeat(50));
```

### GitHub Issues

Sorunu GitHub'da aç:
- Server logs
- Request/response examples
- Error messages
- Environment (OS, Node version, etc.)

---

## 📚 Yararlı Komutlar

```bash
# Server restart
npm run start:dev

# Flow oluştur
node create-dynamic-flow.js

# Flow güncelle
node update-dynamic-flow.js

# Test mesajı gönder
node test-send-message.js

# Port temizle (Windows)
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# Port temizle (Mac/Linux)
lsof -ti:3000 | xargs kill -9

# ngrok başlat
ngrok http 3000

# Public key al
curl http://localhost:3000/flow-webhook/public-key
```

---

**Hazırlayan**: Claude Code
**Tarih**: 23 Kasım 2025
