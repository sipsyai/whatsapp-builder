# Kurulum Rehberi

Bu dokümantasyon, WhatsApp Flow Dinamik Randevu Sistemini sıfırdan kurmak için gereken tüm adımları içerir.

---

## 📋 İçindekiler

1. [Ön Gereksinimler](#ön-gereksinimler)
2. [WhatsApp Business Platform Kurulumu](#whatsapp-business-platform-kurulumu)
3. [Proje Kurulumu](#proje-kurulumu)
4. [Endpoint Konfigürasyonu](#endpoint-konfigürasyonu)
5. [Flow Oluşturma](#flow-oluşturma)
6. [Test Etme](#test-etme)

---

## 1. Ön Gereksinimler

### Yazılım Gereksinimleri

- **Node.js**: v18.0.0 veya üzeri
- **npm**: v8.0.0 veya üzeri
- **Git**: Versiyon kontrolü için
- **ngrok**: Local test için (opsiyonel)

```bash
# Versiyonları kontrol et
node --version  # v18+
npm --version   # v8+
git --version
```

### WhatsApp Business Hesabı

1. [Meta Business Suite](https://business.facebook.com/) hesabı
2. Doğrulanmış WhatsApp Business Account (WABA)
3. WhatsApp Business Phone Number
4. Meta App ID ve Access Token

---

## 2. WhatsApp Business Platform Kurulumu

### 2.1. Meta App Oluşturma

1. [Meta Developers](https://developers.facebook.com/apps) sayfasına git
2. "Create App" butonuna tıkla
3. "Business" tipinde app seç
4. App ismini gir (örn: "Salon Appointment System")
5. İletişim email'i gir
6. App'i oluştur

### 2.2. WhatsApp Product Ekleme

1. App Dashboard'da "Add Product" bölümüne git
2. "WhatsApp" ürününü ekle
3. "Set up" butonuna tıkla

### 2.3. Phone Number Ekleme

1. WhatsApp > Getting Started
2. "Add phone number" seç
3. Test numaranı ekle veya gerçek numara al

### 2.4. Access Token Alma

#### Geçici Token (Test için)

1. WhatsApp > API Setup
2. "Temporary access token" kopyala
3. **Uyarı**: 24 saat sonra geçersiz olur

#### Kalıcı Token (Production için)

1. Meta Business Suite > Business Settings
2. System Users > Add
3. İsim: "WhatsApp Flow API"
4. Role: Admin
5. "Generate New Token" tıkla
6. Permissions:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
7. Token'ı güvenli bir yere kaydet

### 2.5. Gerekli ID'leri Toplama

```bash
# Gerekli bilgiler:
- Phone Number ID: WhatsApp > API Setup
- WABA ID: WhatsApp > Getting Started
- Business ID: Business Settings > Business Info
- App ID: App Dashboard > Settings > Basic
```

---

## 3. Proje Kurulumu

### 3.1. Repository'yi Klonla

```bash
cd C:\Users\Ali\Documents\Projects
git clone [your-repo-url] whatsapp-builder
cd whatsapp-builder/server
```

### 3.2. Dependencies Yükle

```bash
npm install
```

Yüklenecek ana paketler:
- `@nestjs/core` - NestJS framework
- `@nestjs/platform-express` - HTTP server
- `axios` - HTTP client
- `form-data` - Multipart form data
- `crypto` - Şifreleme (Node.js built-in)

### 3.3. Environment Variables Ayarla

`.env` dosyası oluştur:

```bash
cp .env.example .env
```

`.env` içeriği:

```env
# WhatsApp Cloud API Configuration
WHATSAPP_ACCESS_TOKEN=YOUR_ACCESS_TOKEN_HERE
PHONE_NUMBER_ID=YOUR_PHONE_NUMBER_ID
WABA_ID=YOUR_WABA_ID
BUSINESS_ID=YOUR_BUSINESS_ID
APP_ID=YOUR_APP_ID

# Webhook Verify Token (istediğiniz bir string)
VERIFY_TOKEN=your_secure_verify_token_123

# API Version
API_VERSION=v24.0
BASE_URL=https://graph.facebook.com/v24.0

# Server Configuration
PORT=3000

# Flow ID (create-dynamic-flow.js çalıştırıldıktan sonra otomatik doldurulur)
EXISTING_FLOW_ID=

# Endpoint URL (ngrok ile doldurulacak)
FLOW_ENDPOINT_URL=
```

### 3.4. TypeScript Compile

```bash
npm run build
```

### 3.5. Development Server Başlat

```bash
npm run start:dev
```

**Beklenen Çıktı**:

```
[Nest] 12345  - LOG [NestFactory] Starting Nest application...
[Nest] 12345  - LOG [InstanceLoader] AppModule dependencies initialized

=================================
WhatsApp Flow Public Key:
=================================
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----
=================================

[Nest] 12345  - LOG [NestApplication] Nest application successfully started
```

**Public Key'i kopyala!** Bu key endpoint konfigürasyonunda kullanılacak.

---

## 4. Endpoint Konfigürasyonu

Dynamic Flow'ların çalışması için WhatsApp'ın ulaşabileceği bir endpoint gerekir.

### 4.1. Local Test için ngrok

#### ngrok Kurulumu

1. [ngrok.com](https://ngrok.com/) hesabı oluştur
2. ngrok'u indir ve kur:

**Windows**:
```bash
# Chocolatey ile
choco install ngrok

# Manuel indirme
# https://ngrok.com/download adresinden indir ve PATH'e ekle
```

**Mac**:
```bash
brew install ngrok
```

**Linux**:
```bash
snap install ngrok
```

#### ngrok Yapılandırma

```bash
# Auth token ekle (ngrok dashboard'dan al)
ngrok config add-authtoken YOUR_AUTHTOKEN

# Port 3000'i expose et
ngrok http 3000
```

**Çıktı**:
```
ngrok

Session Status                online
Account                       your-email@example.com
Version                       3.3.0
Region                        United States (us)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**HTTPS URL'i kopyala**: `https://abc123.ngrok.io`

### 4.2. Production Deployment (Alternatif)

#### Heroku

```bash
# Heroku CLI kur
npm install -g heroku

# Login
heroku login

# App oluştur
heroku create whatsapp-flow-appointment

# Deploy
git push heroku main

# Environment variables
heroku config:set WHATSAPP_ACCESS_TOKEN=your_token
heroku config:set PHONE_NUMBER_ID=your_phone_id
# ... diğer env variables

# URL: https://whatsapp-flow-appointment.herokuapp.com
```

#### AWS EC2

```bash
# EC2 instance oluştur
# Node.js kur
# PM2 ile uygulamayı başlat
pm2 start npm --name "flow-api" -- run start:prod

# Nginx reverse proxy kur
# SSL sertifikası ekle (Let's Encrypt)
```

### 4.3. WhatsApp Business Manager'da Endpoint Ekle

1. [WhatsApp Flows Manager](https://business.facebook.com/wa/manage/flows/) aç
2. Flow'u seç (Flow ID: oluşturulacak)
3. "Endpoint" sekmesine git
4. **Endpoint URL** gir:
   ```
   https://abc123.ngrok.io/flow-webhook
   ```
5. **Public Key** yapıştır (server log'larından kopyaladığın)
6. "Verify and Save" tıkla

**Doğrulama**:
- WhatsApp, endpoint'e ping request gönderir
- Server, `{version: "3.1", data: {status: "active"}}` döndürür
- Yeşil tik göründüğünde başarılı ✅

---

## 5. Flow Oluşturma

### 5.1. Basit Flow (Endpoint Yok)

Test için önce basit bir Flow oluştur:

```bash
# salon-simple-flow.json kullanılır
node create-new-flow.js
```

**Çıktı**:
```
✅ Flow created! ID: 812041691707463
✅ Meta App connected
✅ Flow published!

📋 Flow Details:
   Flow ID: 812041691707463
   Name: Kuaför Randevu Sistemi
   Status: PUBLISHED
```

### 5.2. Dinamik Flow (Endpoint ile)

```bash
# salon-dynamic-flow.json kullanılır
node create-dynamic-flow.js
```

**Çıktı**:
```
✅ Flow created! ID: 1546903456243545
✅ Meta App connected

📋 Flow Details:
   Flow ID: 1546903456243545
   Name: Kuaför Randevu Sistemi (Dinamik)
   Status: DRAFT

⚠️  IMPORTANT - Endpoint Configuration:
   - Endpoint URL: https://your-ngrok.ngrok.io/flow-webhook
   - Add the public key from server logs
```

### 5.3. Flow Güncelleme

JSON'da değişiklik yaptıktan sonra:

```bash
node update-dynamic-flow.js
```

**Not**: PUBLISHED Flow'lar güncellenemez, DRAFT mode'da kalmalı.

---

## 6. Test Etme

### 6.1. Test Mesajı Gönder

```bash
node test-send-message.js
```

**Çıktı**:
```
📨 Sending WhatsApp Flow Test Message...
📱 To: +905079720490
🔄 Flow ID: 1546903456243545

✅ Test Mesajı Başarıyla Gönderildi!

📋 Mesaj Detayları:
   Message ID: wamid.HBgMOTA1MDc5...
   Alıcı: +905079720490
```

### 6.2. WhatsApp'ta Test

1. WhatsApp'ı aç
2. Mesajı bul: "Kuaför Randevusu 💇‍♀️"
3. "Randevu Al" butonuna tıkla
4. Flow açılır

### 6.3. Test Senaryoları

#### ✅ Başarılı Akış

1. **Hizmet Seç**: Saç Kesimi
2. **Kuaför Seç**: Ali Bey
3. **Tarih Seç**: 25 Ocak (müsait bir gün)
4. **Saat Seç**: 13:00 (müsait bir saat)
5. **Bilgiler**:
   - İsim: Test Kullanıcı
   - Telefon: +905551234567
6. **Randevuyu Oluştur**
7. ✅ Başarı ekranı görünür

#### ❌ Dolu Slot Testi

1. **Ali Bey** ve **24 Ocak** seç
2. **Beklenen**: 09:00, 11:00, 14:00 saatleri görünmemeli
3. **Görünen**: 10:00, 12:00, 13:00, 15:00, 16:00, 17:00

### 6.4. Debug

#### Server Logs

```bash
# Server çalışırken
npm run start:dev

# Gelen her request console'da görünür:
[Nest] Received Flow request: {"action": "data_exchange", ...}
[Nest] Decrypted request: {"action": "get_available_slots", ...}
[MockCalendar] ali için 2025-01-24 tarihinde dolu saatler: ['09:00', '11:00', '14:00']
[MockCalendar] ali için 2025-01-24 tarihinde müsait saatler: ['10:00', '12:00', ...]
```

#### ngrok Inspector

ngrok çalışırken: `http://localhost:4040`

- Tüm HTTP request/response'ları görebilirsin
- Şifrelenmiş payloadları inceleyebilirsin
- Replay feature ile request'leri tekrar gönderebilirsin

### 6.5. Postman ile Test

Postman collection'ı kullan:

```json
{
  "name": "WhatsApp Flows API",
  "item": [
    {
      "name": "Send Flow Message",
      "request": {
        "method": "POST",
        "url": "https://graph.facebook.com/v24.0/{{PHONE_NUMBER_ID}}/messages",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{ACCESS_TOKEN}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"messaging_product\": \"whatsapp\",\n  \"to\": \"905079720490\",\n  \"type\": \"interactive\",\n  \"interactive\": {\n    \"type\": \"flow\",\n    \"header\": {\"type\": \"text\", \"text\": \"Kuaför Randevusu\"},\n    \"body\": {\"text\": \"Randevu oluşturmak için tıklayın\"},\n    \"action\": {\n      \"name\": \"flow\",\n      \"parameters\": {\n        \"flow_message_version\": \"3\",\n        \"mode\": \"draft\",\n        \"flow_id\": \"1546903456243545\",\n        \"flow_cta\": \"Randevu Al\",\n        \"flow_action\": \"navigate\",\n        \"flow_action_payload\": {\"screen\": \"MAIN_MENU\"}\n      }\n    }\n  }\n}"
        }
      }
    }
  ]
}
```

---

## 🎉 Kurulum Tamamlandı!

Tüm adımları tamamladıysan:

- ✅ Server çalışıyor (http://localhost:3000)
- ✅ ngrok expose ediyor (https://abc123.ngrok.io)
- ✅ Flow oluşturuldu (ID: 1546903456243545)
- ✅ Endpoint yapılandırıldı
- ✅ Test mesajı gönderildi

### Sonraki Adımlar

1. **Mock verileri güncelle**: Tarihleri bugüne göre ayarla
2. **Google Calendar entegrasyonu**: MockCalendarService'i değiştir
3. **Production deployment**: Heroku/AWS'e deploy et
4. **Flow'u publish et**: Test tamamlandıktan sonra

---

## 🆘 Sorun mu Yaşıyorsun?

[TROUBLESHOOTING.md](./TROUBLESHOOTING.md) dosyasına bak!

---

**Hazırlayan**: Claude Code
**Tarih**: 23 Kasım 2025
**Versiyon**: 1.0.0
