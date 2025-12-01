# Google Calendar Demo Video Rehberi

Bu belge, Google OAuth verification için gerekli demo videoyu kaydetmek için adım adım senaryo içerir.

---

## Video Süresi: 2-3 dakika

---

## Senaryo 1: Google Calendar Bağlama (30 saniye)

### Adımlar:
1. https://whatsapp.sipsy.ai adresine giriş yap
2. Sol menüden **"Integrations"** sekmesine tıkla
3. Google Calendar kartında **"Connect"** butonuna tıkla
4. Google OAuth ekranında hesabını seç ve izinleri onayla
5. Başarılı bağlantı sonrası "Connected as [email]" mesajını göster

### Gösterilecekler:
- Connect butonu
- Google OAuth consent screen
- Başarılı bağlantı durumu

---

## Senaryo 2: Dashboard'da Takvim Görüntüleme (45 saniye)

### Adımlar:
1. Integrations sayfasında Google Calendar kartını göster
2. **"Today"** sekmesinde bugünkü etkinlikleri göster
3. **"Tomorrow"** sekmesine tıklayarak yarınki etkinlikleri göster
4. Bir etkinliğin detaylarını göster (başlık, saat, konum)
5. **"Open in Google Calendar"** ikonuna tıklayarak Google Calendar'da aç

### Gösterilecekler:
- Event listesi
- Today/Tomorrow sekmeleri
- Event detayları (saat, başlık, konum)
- Refresh butonu
- Google Calendar'a link

---

## Senaryo 3: Chatbot'ta Takvim Kullanımı (60 saniye)

### Adımlar:
1. Sol menüden **"Chatbot Builder"** sayfasına git
2. Mevcut bir chatbot'u düzenle veya yeni oluştur
3. Node paletinden **"Google Calendar"** node'unu sürükle
4. Google Calendar node'u yapılandır:

#### Google Calendar Node Ayarları:

**Action Seçenekleri:**
- Get Today's Events - Bugünkü etkinlikler
- Get Tomorrow's Events - Yarınki etkinlikler
- Get Events by Date - Belirli tarih aralığında etkinlikler
- Check Availability - Müsaitlik kontrolü

**Calendar Owner (Kimin takvimi okunacak):**
- Chatbot Owner - Chatbot sahibinin takvimi (varsayılan)
- Specific User - Belirli bir kullanıcı seç (dropdown)
- From Variable - Dinamik olarak değişkenden al

```
Action: Check Availability
Calendar Owner: Chatbot Owner (veya From Variable: selected_stylist_id)
Date Source: Static Date
Static Date: 2025-01-15
Working Hours: 09:00 - 18:00
Slot Duration: 60 dakika
Output Variable: available_slots
Output Format: Available Slots Only
```

5. Google Calendar node'undan sonra **QUESTION** node ekle (List tipi):
```
Content: "Lütfen randevu saatinizi seçin:"
Dynamic List Source: available_slots
Variable: selected_time
```

6. QUESTION'dan sonra **MESSAGE** node ekle:
```
"Randevunuz {{selected_time}} saatine alınmıştır!"
```

7. Flow'u kaydet ve test et

### Dinamik Kullanıcı Seçimi Örneği (Kuaför Senaryosu):
```
1. QUESTION: "Hangi kuaförü tercih edersiniz?" → selected_stylist_id
2. GOOGLE_CALENDAR:
   - Action: Check Availability
   - Calendar Owner: From Variable (selected_stylist_id)
   - Output: stylist_slots
3. QUESTION: "Müsait saatler:" → selected_time
4. MESSAGE: "Randevunuz alındı!"
```

### Gösterilecekler:
- Chatbot builder'da Google Calendar node'u (yeşil renk)
- Action dropdown (4 seçenek)
- Calendar Owner seçimi (Owner/Static/Variable)
- Node konfigürasyon paneli
- Google Calendar'dan gelen müsait saatler

---

## Senaryo 4: Bağlantıyı Kesme (15 saniye)

### Adımlar:
1. **"Integrations"** sayfasına git
2. Google Calendar kartında **"Disconnect"** butonuna tıkla
3. Onay dialogunda **"OK"** butonuna tıkla
4. "Not Connected" durumunun görünmesini bekle
5. "Connect" butonunun tekrar göründüğünü doğrula

### Gösterilecekler:
- Disconnect butonu
- Onay dialogu
- Bağlantı kesildi durumu

---

## API Endpoints (Demo icin)

### Google OAuth Endpoints

| Endpoint | Aciklama |
|----------|----------|
| `GET /api/google-oauth/auth-url` | OAuth URL olustur |
| `GET /api/google-oauth/status` | Baglanti durumunu kontrol et |
| `GET /api/google-oauth/calendar/events` | Tum etkinlikleri getir |
| `GET /api/google-oauth/calendar/today` | Bugunku etkinlikler |
| `GET /api/google-oauth/calendar/tomorrow` | Yarinki etkinlikler |
| `GET /api/google-oauth/calendar/availability?date=YYYY-MM-DD` | Musaitlik bilgisi |
| `GET /api/google-oauth/calendar/availability/slots?date=YYYY-MM-DD` | Sadece musait slotlar |
| `DELETE /api/google-oauth/disconnect` | Baglantiyi kes |

### Users API - Google Calendar Filter

| Endpoint | Aciklama |
|----------|----------|
| `GET /api/users?hasGoogleCalendar=true` | Google Calendar baglantisi olan kullanicilari listeler |

**Response:**
```json
[
  {
    "id": "uuid-1",
    "name": "Ali Veli",
    "email": "ali@example.com"
  }
]
```

Bu endpoint, chatbot builder'da Google Calendar node yapilandirirken "Calendar Owner" secimi icin kullanilir. Sadece aktif Google Calendar OAuth token'i olan kullanicilar listelenir.

---

## Availability API Response Örneği

```json
{
  "date": "2025-01-15",
  "workingHours": {
    "start": "09:00",
    "end": "18:00"
  },
  "slotDuration": 60,
  "slots": [
    { "id": "09:00", "time": "09:00", "available": true },
    { "id": "10:00", "time": "10:00", "available": false },
    { "id": "11:00", "time": "11:00", "available": true },
    ...
  ],
  "totalSlots": 9,
  "availableSlots": 6,
  "busySlots": 3
}
```

---

## Video Kayıt İpuçları

1. **Ekran Çözünürlüğü**: 1920x1080 tercih edilir
2. **Tarayıcı**: Google Chrome (temiz profil)
3. **Dil**: İngilizce arayüz tercih edilir
4. **Test Verileri**: Önceden Google Calendar'a birkaç test etkinliği ekle
5. **Tempo**: Yavaş ve net hareketler, her adımda birkaç saniye bekle

---

## Checklist

- [ ] Google hesabında test etkinlikleri var mı?
- [ ] whatsapp.sipsy.ai erişilebilir mi?
- [ ] Demo chatbot flow hazır mı?
- [ ] Ekran kayıt yazılımı (Loom, OBS) hazır mı?
- [ ] Tarayıcı temiz durumda mı?

---

## Notlar

- Video YouTube veya Loom'a yüklenebilir
- Public veya unlisted olarak paylaşılabilir
- Google verification formunda video URL'i istenecek
