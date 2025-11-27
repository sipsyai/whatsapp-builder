# WhatsApp Webhook Kurulum Rehberi

Bu doküman, WhatsApp webhook'unuzu ngrok ile dışarıya açma ve yapılandırma sürecini açıklar.

## 📋 Gereksinimler

- Node.js ve npm kurulu olmalı
- PostgreSQL database çalışır durumda olmalı
- Ngrok kurulu olmalı (veya kurulum yapılacak)
- Meta Developer hesabı ve WhatsApp Business App

## 🚀 Hızlı Başlangıç

### 1. Ngrok Kurulumu

```bash
# Ngrok indir ve kur
# macOS/Linux
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Ngrok hesabı oluştur: https://dashboard.ngrok.com/signup
# Authtoken'ı kaydet
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

### 2. Environment Variables

`.env` dosyasında şu değerleri ayarlayın:

```env
# WhatsApp API Configuration
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_waba_id

# Webhook Configuration
WHATSAPP_APP_SECRET=your_app_secret
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token

# Server
PORT=3000
```

### 3. Database Migration

```bash
npm run migration:run
```

### 4. Backend'i Başlat

```bash
npm run start:dev
```

Backend `http://localhost:3000` adresinde çalışacak.

### 5. Ngrok'u Başlat

Yeni bir terminal açın:

```bash
ngrok http 3000
```

Ngrok size bir URL verecek:
```
Forwarding: https://your-unique-id.ngrok-free.dev -> http://localhost:3000
```

## 🔧 Meta Dashboard Webhook Yapılandırması

### Yöntem 1: UI Üzerinden Konfigürasyon (Önerilen - Production)

1. **Uygulamayı başlatın:**
   ```bash
   npm run start:dev
   ```

2. **WhatsApp Settings sayfasına gidin:**
   - Frontend: http://localhost:3000/settings/whatsapp-config
   - Production: https://whatsapp.sipsy.ai/settings/whatsapp-config

3. **Konfigürasyon formunu doldurun:**
   - **WhatsApp Access Token**: Meta Developer Portal'dan alın
   - **Phone Number ID**: WhatsApp Business Phone Number ID
   - **WhatsApp Business Account ID (WABA ID)**: Meta hesap ID'si
   - **App Secret**: Meta App Secret (webhook signature verification için)
   - **Backend URL**: `https://whatsapp.sipsy.ai` (veya ngrok URL'i)
   - **Webhook Verify Token**: Özel bir token belirleyin
   - **API Version**: v24.0 (önerilen)

4. **Kaydet'e tıklayın**

5. **Webhook URL'i kopyalayın** (otomatik oluşturulur):
   - Örnek: `https://whatsapp.sipsy.ai/api/webhooks/whatsapp`

6. **Meta Developer Dashboard'da yapılandırın:**
   - Dashboard: https://developers.facebook.com/apps/YOUR_APP_ID/whatsapp-business/wa-settings/
   - **Callback URL**: UI'dan kopyaladığınız URL
   - **Verify Token**: UI'da belirlediğiniz token
   - **Subscribe to fields**: `messages`, `message_status`

### Yöntem 2: Meta Dashboard (Manuel - Development)

1. **Meta Developer Dashboard'a gidin:**
   https://developers.facebook.com/apps/YOUR_APP_ID/whatsapp-business/wa-settings/

2. **Webhook bölümünde:**
   - **Callback URL:** `https://your-unique-id.ngrok-free.dev/api/webhooks/whatsapp`
   - **Verify Token:** `.env` dosyanızdaki `WHATSAPP_WEBHOOK_VERIFY_TOKEN` değeri

3. **"Verify and Save"** butonuna tıklayın

4. **Subscribe to fields:**
   - ✅ `messages`
   - ✅ `message_status`

### Yöntem 2: API ile (Alternatif)

```bash
# WABA'yı app'e subscribe et
curl -X POST "https://graph.facebook.com/v24.0/YOUR_WABA_ID/subscribed_apps" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📊 Webhook Endpoint Detayları

### GET /api/webhooks/whatsapp
**Amaç:** Webhook verification (Meta tarafından yapılandırma sırasında çağrılır)

**Query Parameters:**
- `hub.mode` - "subscribe" olmalı
- `hub.verify_token` - Yapılandırdığınız token ile eşleşmeli
- `hub.challenge` - Meta'nın gönderdiği challenge string

**Response:** Challenge string'i döner

### POST /api/webhooks/whatsapp
**Amaç:** WhatsApp mesajlarını ve status güncellemelerini alır

**Headers:**
- `x-hub-signature-256` - HMAC-SHA256 signature (doğrulama için)

**Request Body:** WhatsApp webhook payload

**Response:** `{"success": true}`

## 🔒 Güvenlik

### Signature Verification

Tüm gelen webhook istekleri HMAC-SHA256 ile doğrulanır:

1. WhatsApp `x-hub-signature-256` header'ı gönderir
2. Backend, `WHATSAPP_APP_SECRET` ile signature'ı doğrular
3. Geçersiz signature'lı istekler reddedilir

**Kod:** `src/modules/webhooks/services/webhook-signature.service.ts:30`

## 🧪 Test Etme

### 1. Backend Loglarını İzleyin

```bash
# Backend çalışıyorsa, loglar otomatik görünür
# Veya
tail -f logs/backend.log
```

### 2. Ngrok Dashboard

Tarayıcıda açın: http://localhost:4040

Buradan:
- Gelen tüm istekleri görürsünüz
- Request/response detaylarını inceleyebilirsiniz
- Replay özelliği ile tekrar test edebilirsiniz

### 3. Test Mesajı Gönderin

WhatsApp Business numaranıza mesaj gönderin:
- Text mesajı
- Resim/video
- Emoji reaction

Backend loglarında göreceksiniz:
```
[WebhooksController] Webhook payload received
[WebhookSignatureService] Webhook signature verified successfully
[WebhookProcessorService] Processing message...
[WebhookProcessorService] 24-hour window opened
[WebhookProcessorService] Message processed successfully
```

## 🔄 Webhook İşlem Akışı

```
1. WhatsApp Cloud API
   ↓
2. Ngrok (https://your-id.ngrok-free.dev)
   ↓
3. Backend (http://localhost:3000/api/webhooks/whatsapp)
   ↓
4. WebhooksController
   ↓
5. Signature Verification (WebhookSignatureService)
   ↓
6. Message Parsing (WebhookParserService)
   ↓
7. Message Processing (WebhookProcessorService)
   ↓
8. Database Storage
   - Users
   - Conversations
   - Messages
   ↓
9. 24-Hour Window Tracking
   ↓
10. WebSocket Broadcast (Real-time updates)
```

## 📦 Webhook Payload Yapısı

### Gelen Mesaj

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WABA_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "PHONE_NUMBER",
              "phone_number_id": "PHONE_NUMBER_ID"
            },
            "contacts": [
              {
                "profile": {
                  "name": "CUSTOMER_NAME"
                },
                "wa_id": "CUSTOMER_PHONE"
              }
            ],
            "messages": [
              {
                "from": "CUSTOMER_PHONE",
                "id": "wamid.xxx",
                "timestamp": "1234567890",
                "type": "text",
                "text": {
                  "body": "Merhaba"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

### Status Update

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WABA_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "PHONE_NUMBER",
              "phone_number_id": "PHONE_NUMBER_ID"
            },
            "statuses": [
              {
                "id": "wamid.xxx",
                "status": "delivered",
                "timestamp": "1234567890",
                "recipient_id": "CUSTOMER_PHONE"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

## 🐛 Sorun Giderme

### Webhook Verification Başarısız

**Hata:** "Invalid verification token"

**Çözüm:**
- `.env` dosyasındaki `WHATSAPP_WEBHOOK_VERIFY_TOKEN` değerini kontrol edin
- Meta Dashboard'da aynı token'ı kullandığınızdan emin olun
- Backend'i restart edin

### Mesajlar Gelmiyor

**Kontrol Listesi:**
1. ✅ Backend çalışıyor mu? (`npm run start:dev`)
2. ✅ Ngrok çalışıyor mu? (`ngrok http 3000`)
3. ✅ Meta Dashboard'da webhook yapılandırıldı mı?
4. ✅ Doğru WABA ID kullanılıyor mu?
5. ✅ `messages` ve `message_status` subscribe edildi mi?

### Signature Verification Hatası

**Hata:** "Invalid webhook signature"

**Çözüm:**
- `WHATSAPP_APP_SECRET` değerini kontrol edin
- Meta Dashboard > Settings > Basic > App Secret
- Backend'i restart edin

### Ngrok URL Değişti

Ngrok ücretsiz versiyonda her restart'ta URL değişir.

**Çözüm 1:** Ngrok'u durdurmayın, sürekli çalışır halde tutun

**Çözüm 2:** Ngrok paid plan ile sabit domain alın

**Çözüm 3:** Her restart sonrası Meta Dashboard'da URL'i güncelleyin

## 📝 Önemli Notlar

1. **Production için:** Ngrok yerine gerçek domain kullanın (örnek: https://whatsapp.sipsy.ai)
2. **UI Konfigürasyon:** Production'da tüm ayarları UI üzerinden yapabilirsiniz (https://whatsapp.sipsy.ai/settings/whatsapp-config)
3. **Güvenlik:** Signature verification'ı mutlaka aktif tutun (App Secret gereklidir)
4. **Rate Limiting:** WhatsApp API rate limit'lerine dikkat edin
5. **Idempotency:** Aynı mesaj ID'si için işlemi tekrarlamayın (kod zaten bunu yapıyor)
6. **24-Hour Window:** Müşterinin son mesajından sonra 24 saat içinde ücretsiz mesaj gönderebilirsiniz
7. **API Version:** Güncel WhatsApp API versiyonunu kullanın (v24.0 önerilir)

## 🔗 İlgili Dosyalar

- **Webhook Controller:** `src/modules/webhooks/webhooks.controller.ts`
- **Parser Service:** `src/modules/webhooks/services/webhook-parser.service.ts`
- **Processor Service:** `src/modules/webhooks/services/webhook-processor.service.ts`
- **Signature Service:** `src/modules/webhooks/services/webhook-signature.service.ts`
- **Conversation Entity:** `src/entities/conversation.entity.ts:42-63` (24h window)
- **Message Entity:** `src/entities/message.entity.ts`
- **Migration:** `src/migrations/1732446000000-AddWindowTrackingToConversation.ts`

## 📚 Ek Kaynaklar

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Webhook Setup Guide](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks)
- [Ngrok Documentation](https://ngrok.com/docs)
- [Frontend Integration Guide](./FRONTEND_INTEGRATION.md)

---

**Son Güncelleme:** 24 Kasım 2025
**Versiyon:** 1.0
