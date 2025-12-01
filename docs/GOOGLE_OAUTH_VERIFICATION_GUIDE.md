# Google OAuth Verification Rehberi

## Mevcut Sayfalar (sipsy.ai'da var)
- Privacy Policy: `https://sipsy.ai/privacy-policy`
- Terms of Service: `https://sipsy.ai/terms`

---

## Google Cloud Console'da Yapılacaklar

### Adım 1: OAuth Consent Screen'e Git
```
https://console.cloud.google.com/apis/credentials/consent
```

### Adım 2: "EDIT APP" Butonuna Tıkla

### Adım 3: App Information Doldur

| Alan | Değer |
|------|-------|
| App name | `WhatsApp Builder` |
| User support email | `support@sipsy.ai` |
| App logo | 120x120 px PNG (opsiyonel) |

### Adım 4: App Domain Doldur

| Alan | Değer |
|------|-------|
| Application home page | `https://sipsy.ai` |
| Application privacy policy link | `https://sipsy.ai/privacy-policy` |
| Application terms of service link | `https://sipsy.ai/terms` |

### Adım 5: Authorized Domains
```
sipsy.ai
```

### Adım 6: Developer Contact Information
```
support@sipsy.ai
```

### Adım 7: Scopes (Zaten Ayarlı Olmalı)
- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly`
- `https://www.googleapis.com/auth/userinfo.email`

### Adım 8: SAVE AND CONTINUE

### Adım 9: PUBLISH APP
- "Push to production" seç

---

## Verification Form'da Sorulacaklar

Google bir form doldurmmanı isteyecek. Hazır cevaplar:

### 1. "Describe your app and how it uses Google user data"

```
WhatsApp Builder is a chatbot creation platform that helps businesses automate their WhatsApp communication.

We use Google Calendar integration to:
1. Display users' calendar events in our dashboard
2. Allow chatbots to check appointment availability
3. Enable calendar sharing between team members

We only request READ-ONLY access to calendar data. We do not modify, create, or delete any calendar events.

Data is cached temporarily (max 24 hours) for performance and is never sold or shared with third parties.
```

### 2. "Why do you need access to this sensitive scope?"

```
We need calendar.readonly and calendar.events.readonly to:

1. Show users their upcoming appointments in our dashboard
2. Allow their WhatsApp chatbots to respond with availability information when customers ask for appointments
3. Enable team calendar sharing for businesses with multiple staff members

This is a core feature that helps businesses manage appointments through WhatsApp.
```

### 3. "How will you use, store, and secure user data?"

```
USE:
- Display calendar events in our web dashboard
- Provide appointment availability through WhatsApp chatbots
- Enable authorized team members to view shared calendars

STORAGE:
- OAuth tokens stored encrypted in our database
- Calendar data cached for maximum 24 hours
- Users can disconnect and delete all data at any time

SECURITY:
- All data transmitted via HTTPS/TLS
- OAuth 2.0 with refresh tokens
- Role-based access control
- Regular security audits
```

### 4. Demo Video/Link (İstenirse)

Eğer demo video isterlerse:
- Loom veya YouTube'a 2-3 dakikalık video yükle
- Gösterilecekler:
  1. Google Calendar bağlama
  2. Dashboard'da takvim görüntüleme
  3. Chatbot'ta takvim kullanımı
  4. Bağlantıyı kesme

---

## Tahmini Süre

| Scope Türü | Süre |
|------------|------|
| Non-sensitive (email) | 1-3 gün |
| Sensitive (calendar.readonly) | 1-3 hafta |
| Restricted | 4-6 hafta + security assessment |

Calendar.readonly "sensitive" scope olduğu için **1-3 hafta** bekle.

---

## Checklist

- [ ] sipsy.ai'da Privacy Policy sayfası var mı? Kontrol et
- [ ] sipsy.ai'da Terms sayfası var mı? Kontrol et
- [ ] Google Cloud Console'da domain doğrulandı mı?
- [ ] OAuth consent screen bilgileri dolduruldu mu?
- [ ] "PUBLISH APP" tıklandı mı?
- [ ] Verification form dolduruldu mu?
