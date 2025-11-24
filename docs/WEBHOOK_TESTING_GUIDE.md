# WhatsApp Webhook Test Kılavuzu

Bu kılavuz, WhatsApp webhook'larınızı ngrok kullanarak test etmeniz için adım adım talimatlar içerir.

---

## 📋 Ön Gereksinimler

- ✅ Node.js 18+ yüklü olmalı
- ✅ PostgreSQL veritabanı çalışıyor olmalı
- ✅ WhatsApp Business Account (Test veya Production)
- ✅ Meta Developer hesabı

---

## 🚀 Adım 1: Backend'i Hazırlama

### 1.1 Veritabanı Migration'larını Çalıştırın

```bash
cd backend
npm run migration:run
```

Bu komut şu migration'ları çalıştıracak:
- ✅ WhatsApp config tablosu
- ✅ Conversation 24-hour window tracking field'leri

### 1.2 Environment Variables'ları Ayarlayın

`backend/.env` dosyanızı kontrol edin:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=whatsapp_builder
DB_SYNCHRONIZE=false
DB_LOGGING=false

# Server
PORT=3000
NODE_ENV=development

# WhatsApp API Configuration
WHATSAPP_API_TOKEN=your_permanent_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_waba_id

# Webhook Security
WHATSAPP_APP_SECRET=your_app_secret_from_meta
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_custom_verify_token_12345
```

**Önemli Notlar:**
- `WHATSAPP_APP_SECRET`: Meta Developer Dashboard'dan alın (App Settings > Basic > App Secret)
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`: Kendiniz belirleyin (örn: `mySecureToken_12345`)

### 1.3 Backend'i Başlatın

```bash
cd backend
npm run start:dev
```

Backend http://localhost:3000 adresinde çalışacak.

Logları kontrol edin:
```
[Nest] ... - Application is running on: http://localhost:3000
[WebhooksController] Webhook module initialized
```

---

## 🌐 Adım 2: Ngrok ile Webhook'u Dışarıya Açma

### 2.1 Ngrok Kurulumu

**Seçenek 1: NPM ile kurulum (Önerilen)**
```bash
npm install -g ngrok
```

**Seçenek 2: Manuel indirme**
1. https://ngrok.com/download adresine gidin
2. İşletim sisteminize göre indirin
3. ZIP dosyasını açın ve binary'yi PATH'e ekleyin

### 2.2 Ngrok Hesap Oluşturma ve Token

1. https://ngrok.com adresine gidin
2. Ücretsiz hesap oluşturun
3. Dashboard'dan **authtoken**'ı kopyalayın
4. Token'ı yapılandırın:

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### 2.3 Ngrok Tunnel Başlatma

Backend çalışırken, **yeni bir terminal** açın:

```bash
ngrok http 3000
```

**Çıktı:**
```
ngrok

Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Önemli:** `https://abc123def.ngrok-free.app` URL'ini kopyalayın. Bu sizin public webhook URL'iniz.

### 2.4 Ngrok Web Interface (Opsiyonel)

Gelen istekleri izlemek için:
```
http://127.0.0.1:4040
```

Bu arayüzde:
- ✅ Gelen tüm HTTP isteklerini görebilirsiniz
- ✅ Request/response body'lerini inceleyebilirsiniz
- ✅ Hata ayıklama yapabilirsiniz

---

## 🔧 Adım 3: Meta Developer Dashboard'da Webhook Kurulumu

### 3.1 WhatsApp App'i Seçin

1. https://developers.facebook.com/ adresine gidin
2. Sol menüden **"My Apps"** seçin
3. WhatsApp Business uygulamanızı seçin

### 3.2 Webhook Configuration

1. Sol menüden **"WhatsApp" > "Configuration"** seçin
2. **"Webhook"** bölümünde **"Edit"** butonuna tıklayın

### 3.3 Webhook URL ve Token Girin

**Callback URL:**
```
https://YOUR_NGROK_URL.ngrok-free.app/api/webhooks/whatsapp
```

Örnek:
```
https://abc123def.ngrok-free.app/api/webhooks/whatsapp
```

**Verify Token:**
```
your_custom_verify_token_12345
```
(`.env` dosyasındaki `WHATSAPP_WEBHOOK_VERIFY_TOKEN` ile aynı olmalı)

### 3.4 Verify and Save

1. **"Verify and Save"** butonuna tıklayın
2. WhatsApp, GET request ile webhook'unuzu doğrulayacak
3. Backend loglarında şunu görmelisiniz:

```
[WebhooksController] Webhook verification request received
[WebhooksController] Webhook verified successfully
```

✅ **Başarılı:** "Webhook has been verified successfully" mesajı görünecek

❌ **Hata:** Aşağıdaki "Sorun Giderme" bölümüne bakın

### 3.5 Webhook Fields'ları Subscribe Edin

1. **"Webhook fields"** bölümünde **"Manage"** butonuna tıklayın
2. Şu field'ları **aktif** edin:
   - ✅ **messages** - Gelen mesajlar
   - ✅ **message_status** - Mesaj durumu güncellemeleri (opsiyonel)

3. **"Done"** butonuna tıklayın

---

## 🧪 Adım 4: Webhook'u Test Etme

### 4.1 WhatsApp Business Number'ınızı Bulun

1. Meta Dashboard > WhatsApp > API Setup
2. **"Phone number ID"** ve **"Display phone number"** notunu alın

### 4.2 Test Mesajı Gönderme

**Seçenek 1: Gerçek Telefon ile**

1. Telefonunuzdan WhatsApp'ı açın
2. WhatsApp Business numaranıza mesaj gönderin:
   ```
   Merhaba! Bu bir test mesajıdır.
   ```

**Seçenek 2: WhatsApp Test Numarası ile**

Meta Dashboard'da test numarası ekleyin:
1. WhatsApp > API Setup
2. **"To"** alanında test numaranızı ekleyin
3. **"Send message"** ile test edin

### 4.3 Backend Loglarını Kontrol Edin

Backend terminalinde şunları görmelisiniz:

```
[WebhooksController] Webhook payload received
[WebhooksController] Processing 1 incoming message(s)
[WebhookProcessorService] Processing message wamid.ABC... from +905551234567
[WebhookProcessorService] Creating new user: +905551234567
[WebhookProcessorService] Creating new conversation between <uuid1> and <uuid2>
[WebhookProcessorService] 24-hour window opened for conversation <uuid>
[WebhookProcessorService] Message wamid.ABC... processed successfully
[WebhooksController] Successfully processed 1 message(s)
```

### 4.4 Ngrok Interface'de Kontrol Edin

http://127.0.0.1:4040 adresine gidin:

- ✅ POST request görünmeli
- ✅ Status: 200 OK
- ✅ Request body: WhatsApp webhook payload
- ✅ Response body: `{"success": true}`

### 4.5 Veritabanını Kontrol Edin

```bash
psql -U postgres -d whatsapp_builder

-- Kullanıcılar
SELECT * FROM users;

-- Mesajlar
SELECT * FROM messages ORDER BY "createdAt" DESC LIMIT 10;

-- Conversation'lar
SELECT
  id,
  "lastMessage",
  "lastMessageAt",
  "lastCustomerMessageAt",
  "isWindowOpen"
FROM conversations;
```

---

## 🎯 Adım 5: Farklı Mesaj Tiplerini Test Etme

### 5.1 Text Mesajı

WhatsApp'tan gönderin:
```
Merhaba dünya!
```

**Beklenen Log:**
```
[WebhookParserService] Parsed message type: text
[WebhookProcessorService] Message preview: Merhaba dünya!
```

### 5.2 Image Mesajı

1. WhatsApp'tan fotoğraf gönderin
2. Opsiyonel caption ekleyin

**Beklenen Log:**
```
[WebhookParserService] Parsed message type: image
[WebhookProcessorService] Message preview: 📷 Image
```

**Veritabanında:**
```json
{
  "whatsappMessageId": "wamid.xxx",
  "id": "media_id",
  "url": "https://...",
  "mimeType": "image/jpeg",
  "sha256": "...",
  "caption": "Test photo"
}
```

### 5.3 Reaction (Emoji) Mesajı

1. WhatsApp'ta önceki bir mesaja uzun basın
2. Emoji reaction ekleyin (örn: 👍)

**Beklenen Log:**
```
[WebhookParserService] Parsed message type: reaction
[WebhookProcessorService] Message preview: 👍 Reaction
```

**Veritabanında:**
```json
{
  "whatsappMessageId": "wamid.xxx",
  "messageId": "wamid.original_message",
  "emoji": "👍"
}
```

### 5.4 Voice Mesajı

1. WhatsApp'ta mikrofon butonuna basılı tutun
2. Sesli mesaj kaydedin ve gönderin

**Beklenen Log:**
```
[WebhookParserService] Parsed message type: audio
[WebhookProcessorService] Message preview: 🎤 Voice message
```

### 5.5 Location Mesajı

1. WhatsApp'ta attachment > Location
2. Konum gönderin

**Beklenen Log:**
```
[WebhookParserService] Parsed message type: location
```

---

## 🔍 Adım 6: 24-Hour Window Tracking'i Test Etme

### 6.1 İlk Mesaj (Window Açılır)

Kullanıcı mesaj gönderdiğinde:

```sql
SELECT
  "lastCustomerMessageAt",
  "isWindowOpen",
  NOW() - "lastCustomerMessageAt" AS elapsed_time
FROM conversations
WHERE id = 'your_conversation_id';
```

**Beklenen:**
- `lastCustomerMessageAt`: Şu anki zaman
- `isWindowOpen`: `true`
- `elapsed_time`: Birkaç saniye

### 6.2 Window Durumunu Kontrol Etme

TypeScript kodundan:

```typescript
// ConversationsService'e ekleme yapabilirsiniz
async checkConversationWindow(conversationId: string): Promise<{
  isOpen: boolean;
  remainingTime: number;
}> {
  const conversation = await this.conversationRepository.findOne({
    where: { id: conversationId },
  });

  if (!conversation || !conversation.lastCustomerMessageAt) {
    return { isOpen: false, remainingTime: 0 };
  }

  const now = new Date();
  const elapsed = now.getTime() - conversation.lastCustomerMessageAt.getTime();
  const windowDuration = 24 * 60 * 60 * 1000; // 24 hours
  const remainingTime = Math.max(0, windowDuration - elapsed);

  return {
    isOpen: conversation.canSendSessionMessage(),
    remainingTime: Math.floor(remainingTime / 1000 / 60), // minutes
  };
}
```

---

## 🐛 Sorun Giderme

### Webhook Verification Başarısız

**Hata:** "The callback URL or verify token couldn't be validated"

**Çözümler:**

1. **Verify token kontrolü:**
   ```bash
   # .env dosyasını kontrol edin
   cat backend/.env | grep WEBHOOK_VERIFY_TOKEN
   ```

2. **Backend loglarını kontrol edin:**
   ```
   [WebhooksController] Webhook verification token mismatch
   ```

3. **Ngrok URL'ini kontrol edin:**
   - HTTPS olmalı (`https://` ile başlamalı)
   - `/api/webhooks/whatsapp` ile bitmeli
   - Ngrok tunnel hala çalışıyor olmalı

4. **Manuel test yapın:**
   ```bash
   curl "https://YOUR_NGROK_URL.ngrok-free.app/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=your_custom_verify_token_12345&hub.challenge=test123"
   ```

   **Beklenen response:** `test123`

### Webhook Signature Verification Hatası

**Hata:** Backend'de "Invalid webhook signature" hatası

**Çözümler:**

1. **App Secret kontrolü:**
   ```bash
   # .env dosyasını kontrol edin
   cat backend/.env | grep WHATSAPP_APP_SECRET
   ```

2. **Meta Dashboard'dan App Secret'i alın:**
   - App Settings > Basic > App Secret
   - Show > Copy

3. **Development modda test:**

   `webhooks.controller.ts` dosyasında signature verification geçici olarak kapatılabilir:
   ```typescript
   // Satır 107-116
   if (!rawBody) {
     this.logger.warn('No raw body - skipping signature verification');
     // Development mode - signature verification atlandı
   }
   ```

### Mesajlar Gelmiyor

**Çözümler:**

1. **Webhook fields subscribe kontrolü:**
   - Meta Dashboard > WhatsApp > Configuration
   - Webhook fields > "messages" aktif mi?

2. **Ngrok tunnel kontrolü:**
   ```bash
   # Yeni terminal
   curl https://YOUR_NGROK_URL.ngrok-free.app/api/webhooks/whatsapp
   ```

3. **Backend çalışıyor mu:**
   ```bash
   curl http://localhost:3000/
   ```

4. **Webhook subscription test:**
   Meta Dashboard'dan test mesajı gönderin:
   - API Setup > "Send test message"

### Ngrok URL'i Sık Değişiyor

**Sorun:** Free plan'de her ngrok restart'ta yeni URL gelir.

**Çözüm 1: Reserved Domain (Paid)**
```bash
ngrok http 3000 --domain=your-reserved-domain.ngrok-free.app
```

**Çözüm 2: Stable Session (Ücretsiz)**
```bash
# ngrok.yml dosyası oluşturun
authtoken: YOUR_AUTH_TOKEN
tunnels:
  whatsapp:
    proto: http
    addr: 3000

# Başlatın
ngrok start whatsapp
```

**Çözüm 3: Automated Webhook Update (Advanced)**

Ngrok URL değiştiğinde webhook'u otomatik güncelleyen script:

```bash
#!/bin/bash
# update-webhook.sh

NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')
WEBHOOK_URL="$NGROK_URL/api/webhooks/whatsapp"

echo "New webhook URL: $WEBHOOK_URL"

# Meta Graph API ile webhook güncelle
# (Access token ve app ID gerekli)
```

### Database Connection Hatası

**Hata:** "Could not connect to PostgreSQL"

**Çözümler:**

1. **PostgreSQL çalışıyor mu:**
   ```bash
   sudo systemctl status postgresql
   # veya
   pg_isready
   ```

2. **Database var mı:**
   ```bash
   psql -U postgres -l | grep whatsapp_builder
   ```

3. **Database oluştur:**
   ```bash
   psql -U postgres
   CREATE DATABASE whatsapp_builder;
   \q
   ```

4. **Credentials kontrolü:**
   ```bash
   cat backend/.env | grep DB_
   ```

---

## 📊 Monitoring ve Logging

### Backend Logs

**Development modda:**
```bash
cd backend
npm run start:dev
```

**Production modda:**
```bash
cd backend
npm run build
npm run start:prod
```

**Log dosyasına yazma (opsiyonel):**
```bash
npm run start:dev 2>&1 | tee webhook-logs.txt
```

### Ngrok Logs

Ngrok web interface: http://127.0.0.1:4040

**Log dosyasına yazma:**
```bash
ngrok http 3000 --log=ngrok.log --log-level=info
```

### Database Queries

**Gerçek zamanlı mesaj akışı:**
```sql
-- PostgreSQL'de
SELECT
  m.id,
  m.type,
  m."timestamp",
  m.content->>'body' AS text,
  u."phoneNumber" AS sender
FROM messages m
JOIN users u ON m."senderId" = u.id
ORDER BY m."timestamp" DESC
LIMIT 20;
```

**24-hour window durumu:**
```sql
SELECT
  c.id,
  c."lastCustomerMessageAt",
  c."isWindowOpen",
  NOW() - c."lastCustomerMessageAt" AS elapsed,
  CASE
    WHEN NOW() - c."lastCustomerMessageAt" < INTERVAL '24 hours'
    THEN 'OPEN'
    ELSE 'CLOSED'
  END AS window_status
FROM conversations c
WHERE c."lastCustomerMessageAt" IS NOT NULL;
```

---

## 🎓 Best Practices

### 1. Development vs Production

**Development:**
- Ngrok ile test yapın
- Signature verification'ı debug mode'da test edin
- Test numaraları kullanın

**Production:**
- Public domain kullanın (ngrok paid veya kendi domain'iniz)
- HTTPS zorunlu
- Signature verification her zaman aktif
- Rate limiting ekleyin

### 2. Security

```typescript
// Production ortamda signature verification zorunlu yapın
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && (!rawBody || !signature)) {
  throw new UnauthorizedException('Signature verification required in production');
}
```

### 3. Error Handling

```typescript
// webhook-processor.service.ts
try {
  await this.processMessage(parsedMessage);
} catch (error) {
  // Dead letter queue'ya ekle
  await this.dlq.add(parsedMessage);
  this.logger.error(`Failed to process message: ${error.message}`);
  // WhatsApp'a 200 OK dön (retry'ı engelle)
}
```

### 4. Performance

```typescript
// Batch processing için
async processMessages(messages: ParsedMessageDto[]): Promise<void> {
  // Parallel processing
  await Promise.all(
    messages.map(msg => this.processMessage(msg))
  );
}
```

---

## 📚 Referanslar

- [WhatsApp Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Webhook Setup Guide](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks)
- [Ngrok Documentation](https://ngrok.com/docs)
- [NestJS Webhooks](https://docs.nestjs.com/techniques/http-module)

---

## ✅ Checklist

Test öncesi kontrol listesi:

- [ ] PostgreSQL çalışıyor
- [ ] Backend çalışıyor (http://localhost:3000)
- [ ] `.env` dosyası doğru yapılandırılmış
- [ ] Migration'lar çalıştırıldı
- [ ] Ngrok tunnel açık
- [ ] Meta Dashboard'da webhook yapılandırıldı
- [ ] Webhook fields subscribe edildi
- [ ] Test mesajı gönderildi
- [ ] Backend logları kontrol edildi
- [ ] Database'de data göründü

---

## 🆘 Destek

Sorun yaşarsanız:

1. Backend loglarını kontrol edin
2. Ngrok web interface'i kontrol edin (http://127.0.0.1:4040)
3. Database'de data var mı kontrol edin
4. Bu dokümandaki "Sorun Giderme" bölümüne bakın

---

**Son Güncelleme:** 2025-11-24
**Versiyon:** 1.0.0
