# WhatsApp Flow ile Dinamik Kuaför Randevu Sistemi

## 📋 Proje Hakkında

Bu proje, WhatsApp Flows API kullanarak dinamik bir kuaför randevu sistemi geliştirmeyi göstermektedir. Sistem, kuaför seçimine göre müsait tarihleri ve seçilen tarihe göre müsait saatleri gerçek zamanlı olarak yükler.

### Özellikler

- ✅ **Dinamik Slot Yükleme**: Kuaför ve tarih seçimine göre müsait saatler otomatik güncellenir
- ✅ **Mock Calendar Entegrasyonu**: Test için mock takvim verisi (Google Calendar için hazır)
- ✅ **RSA + AES-128-GCM Şifreleme**: Güvenli veri iletişimi
- ✅ **NestJS Backend**: Profesyonel ve ölçeklenebilir backend yapısı
- ✅ **TypeScript**: Tip güvenli geliştirme
- ✅ **WhatsApp Flow API v7.2**: En güncel Flow versiyonu

---

## 🏗️ Mimari

```
┌─────────────────┐
│   WhatsApp      │
│   User          │
└────────┬────────┘
         │ 1. Flow açılır
         ▼
┌─────────────────────────────┐
│   WhatsApp Flow             │
│   (salon-dynamic-flow.json) │
│                             │
│   • Kuaför seçimi           │
│   • Tarih seçimi            │
│   • Saat seçimi             │
│   • Müşteri bilgileri       │
└────────┬────────────────────┘
         │ 2. data_exchange
         ▼
┌─────────────────────────────┐
│   Webhook Endpoint          │
│   /flow-webhook             │
│                             │
│   • RSA Decryption          │
│   • Action Handler          │
│   • AES Encryption          │
└────────┬────────────────────┘
         │ 3. Get available data
         ▼
┌─────────────────────────────┐
│   Mock Calendar Service     │
│                             │
│   • Available Dates         │
│   • Available Slots         │
│   • Booked Appointments     │
└─────────────────────────────┘
```

---

## 📁 Proje Yapısı

```
server/
├── src/
│   └── flows/
│       ├── salon-dynamic-flow.json      # Dinamik Flow JSON
│       ├── salon-simple-flow.json       # Basit Flow JSON (endpoint yok)
│       ├── flows.controller.ts          # Flow CRUD controller
│       ├── flows.service.ts             # Flow business logic
│       ├── flows.module.ts              # NestJS module
│       ├── flow-webhook.controller.ts   # Webhook endpoint
│       ├── flow-crypto.util.ts          # Encryption/Decryption
│       ├── mock-calendar.service.ts     # Mock takvim servisi
│       └── appointment.service.ts       # Randevu yönetimi
│
├── create-dynamic-flow.js               # Flow oluşturma scripti
├── update-dynamic-flow.js               # Flow güncelleme scripti
├── test-send-message.js                 # Test mesajı gönderme
└── .env                                 # API credentials

docs/
└── whatsapp-flow-dynamic-calendar/
    ├── README.md                        # Bu dosya
    ├── SETUP.md                         # Kurulum rehberi
    ├── FLOW-STRUCTURE.md                # Flow JSON yapısı
    ├── WEBHOOK-GUIDE.md                 # Webhook geliştirme
    ├── API-SCRIPTS.md                   # API script'leri
    ├── TROUBLESHOOTING.md               # Sorun giderme
    └── examples/                        # Örnek kodlar
```

---

## 🚀 Hızlı Başlangıç

### 1. Gereksinimler

- Node.js v18+
- WhatsApp Business Account
- Meta App ID
- ngrok (local test için)

### 2. Kurulum

```bash
cd server
npm install
```

### 3. Ortam Değişkenlerini Ayarla

`.env` dosyasını düzenle:

```env
WHATSAPP_ACCESS_TOKEN=your_access_token
PHONE_NUMBER_ID=your_phone_id
WABA_ID=your_waba_id
APP_ID=your_app_id
EXISTING_FLOW_ID=1546903456243545
PORT=3000
```

### 4. Serveri Başlat

```bash
npm run start:dev
```

Server başladığında console'da Public Key görünecek.

### 5. Flow'u Oluştur

```bash
node create-dynamic-flow.js
```

### 6. Endpoint'i Yapılandır

1. ngrok ile expose et:
```bash
ngrok http 3000
```

2. WhatsApp Business Manager'a git:
   - Flow ID: `1546903456243545`
   - Endpoint URL: `https://your-ngrok-url.ngrok.io/flow-webhook`
   - Public Key'i yapıştır

### 7. Test Et

```bash
node test-send-message.js
```

---

## 🎯 Nasıl Çalışır?

### 1. Flow Açılır (INIT)

Kullanıcı "Randevu Al" butonuna tıkladığında Flow açılır ve ilk ekran gösterilir.

```json
{
  "action": "INIT",
  "screen": "MAIN_MENU"
}
```

### 2. Kuaför Seçimi (get_stylist_info)

Kullanıcı bir kuaför seçtiğinde `data_exchange` action tetiklenir:

```json
{
  "action": "get_stylist_info",
  "stylist": "ali",
  "service": "haircut"
}
```

Webhook, kuaföre ait müsait tarihleri döndürür:

```json
{
  "version": "3.0",
  "screen": "MAIN_MENU",
  "data": {
    "available_dates": [
      {"id": "2025-01-24", "title": "24 Ocak Cuma", "enabled": true},
      {"id": "2025-01-25", "title": "25 Ocak Cumartesi", "enabled": true}
    ]
  }
}
```

### 3. Tarih Seçimi (get_available_slots)

Kullanıcı tarih seçtiğinde:

```json
{
  "action": "get_available_slots",
  "stylist": "ali",
  "date": "2025-01-24"
}
```

Webhook, o gün için müsait saatleri döndürür:

```json
{
  "version": "3.0",
  "screen": "DATETIME_SCREEN",
  "data": {
    "available_slots": [
      {"id": "10:00", "title": "10:00", "enabled": true},
      {"id": "12:00", "title": "12:00", "enabled": true},
      {"id": "13:00", "title": "13:00", "enabled": true}
    ]
  }
}
```

### 4. Randevu Oluşturma (create_appointment)

Kullanıcı bilgilerini girip "Randevuyu Oluştur" butonuna bastığında:

```json
{
  "action": "create_appointment",
  "service": "haircut",
  "stylist": "ali",
  "appointment_date": "2025-01-24",
  "appointment_time": "10:00",
  "customer_name": "Ahmet Yılmaz",
  "customer_phone": "+905551234567",
  "notes": "Özel istek yok"
}
```

Webhook, başarı ekranına yönlendirir:

```json
{
  "version": "3.0",
  "screen": "SUCCESS",
  "data": {
    "confirmation_message": "Randevunuz başarıyla oluşturuldu!",
    "appointment_details": "📅 24 Ocak 2025\n🕐 10:00\n💇 Ali Bey\n✂️ Saç Kesimi"
  }
}
```

---

## 🔐 Güvenlik

### Şifreleme Akışı

1. **WhatsApp → Webhook (Request)**
   - WhatsApp, AES key'i RSA ile şifreler
   - Flow verisini AES-128-GCM ile şifreler
   - Her ikisini de gönderir

2. **Webhook → WhatsApp (Response)**
   - Webhook, response'u AES-128-GCM ile şifreler
   - WhatsApp'ın gönderdiği key ve IV kullanılır

### Public Key Yönetimi

Server her başlatıldığında yeni bir RSA key pair oluşturur. Production'da:

1. Bir kere oluştur
2. `.env` dosyasına kaydet
3. WhatsApp Business Manager'a public key'i ekle

```typescript
// Production için
const keys = FlowCryptoUtil.generateKeyPair();
// FLOW_PRIVATE_KEY ve FLOW_PUBLIC_KEY'i .env'e kaydet
```

---

## 📊 Mock Takvim Verisi

Mock Calendar Service, 3 kuaför için örnek randevu verisi içerir:

### Ali Bey (ali)
- **Uzmanlık**: Saç Kesimi, Sakal Traşı
- **24 Ocak**: 09:00, 11:00, 14:00 dolu
- **25 Ocak**: 10:00 dolu

### Ayşe Hanım (ayse)
- **Uzmanlık**: Saç Boyama, Keratin
- **24 Ocak**: 10:00, 13:00 dolu
- **25 Ocak**: 09:00 dolu

### Zeynep Hanım (zeynep)
- **Uzmanlık**: Perma, Fön
- **24 Ocak**: 09:00, 15:00 dolu

### Çalışma Saatleri

- Başlangıç: 09:00
- Bitiş: 18:00
- Slot süresi: 60 dakika

---

## 🔄 Google Calendar Entegrasyonu

Mock Calendar Service'i Google Calendar ile değiştirmek için:

### 1. Google Calendar API Kurulumu

```bash
npm install googleapis
```

### 2. Service Account Oluştur

- Google Cloud Console
- Create Service Account
- Calendar ID'yi service account'a paylaş

### 3. MockCalendarService'i Güncelle

```typescript
// mock-calendar.service.ts yerine google-calendar.service.ts

import { google } from 'googleapis';

@Injectable()
export class GoogleCalendarService {
  private calendar;

  constructor() {
    const auth = new google.auth.GoogleAuth({
      keyFile: 'path/to/service-account.json',
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    this.calendar = google.calendar({ version: 'v3', auth });
  }

  async getAvailableSlots(stylist: string, date: string) {
    const calendarId = this.getStylistCalendarId(stylist);

    const response = await this.calendar.events.list({
      calendarId,
      timeMin: `${date}T00:00:00Z`,
      timeMax: `${date}T23:59:59Z`,
      singleEvents: true,
    });

    const bookedSlots = response.data.items.map(event =>
      event.start.dateTime.substring(11, 16)
    );

    return this.filterAvailableSlots(bookedSlots);
  }
}
```

---

## 📱 Test Senaryoları

### Senaryo 1: Normal Randevu Akışı

1. Kullanıcı Flow'u açar
2. "Saç Kesimi" seçer
3. "Ali Bey" seçer
4. "24 Ocak" seçer
5. Müsait saatlerden "10:00" seçer
6. İsim: "Ahmet Yılmaz", Tel: "+905551234567"
7. Randevu oluşturulur ✅

### Senaryo 2: Dolu Saatler

1. Kullanıcı "Ali Bey" seçer
2. "24 Ocak" seçer
3. Müsait saatler: 10:00, 12:00, 13:00, 15:00, 16:00, 17:00
4. Dolu saatler görünmez: 09:00, 11:00, 14:00 ❌

### Senaryo 3: Farklı Kuaförler

1. "Ayşe Hanım" seçildiğinde farklı dolu saatler
2. "Zeynep Hanım" seçildiğinde farklı dolu saatler

---

## 🐛 Bilinen Sorunlar ve Çözümler

### 1. EADDRINUSE Hatası

**Sorun**: Port 3000 zaten kullanımda

**Çözüm**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### 2. Validation Errors

**Sorun**: Flow JSON validation hatası

**Çözüm**: `salon-dynamic-flow.json` dosyasını kontrol et:
- `routing_model` doğru formatta mı?
- `data-source` referansları doğru mu?
- Tüm required field'lar var mı?

### 3. Endpoint Not Responding

**Sorun**: WhatsApp endpoint'e ulaşamıyor

**Çözüm**:
1. ngrok çalışıyor mu? (`ngrok http 3000`)
2. Endpoint URL doğru girildi mi? (https ile başlamalı)
3. Public key doğru kopyalandı mı?
4. Server çalışıyor mu? (`npm run start:dev`)

### 4. Empty Slots Array

**Sorun**: Tarih seçildiğinde boş saat listesi

**Çözüm**:
- `mock-calendar.service.ts` dosyasındaki tarihleri kontrol et
- Mock tarihleri geçmişte olabilir, güncel tarihlere güncelle
- Console log'ları kontrol et: `[MockCalendar] ... için ... tarihinde müsait saatler`

---

## 📚 Ek Kaynaklar

- [WhatsApp Flows API Documentation](https://developers.facebook.com/docs/whatsapp/flows)
- [WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp)
- [NestJS Documentation](https://docs.nestjs.com/)
- [ngrok Documentation](https://ngrok.com/docs)

---

## 🤝 Katkıda Bulunma

Bu dokümantasyonu geliştirmek için:

1. Yeni özellikler ekleyin
2. Hataları düzeltin
3. Daha iyi açıklamalar yazın
4. Daha fazla örnek ekleyin

---

## 📄 Lisans

Bu proje eğitim amaçlıdır ve MIT lisansı altındadır.

---

## 📞 İletişim

Sorularınız için:
- GitHub Issues
- WhatsApp Business API Community

---

**Son Güncelleme**: 23 Kasım 2025
**Versiyon**: 1.0.0
**Flow API Version**: 7.2
**Data API Version**: 3.0
