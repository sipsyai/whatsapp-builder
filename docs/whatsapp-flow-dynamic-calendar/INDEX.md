# 📚 Dokümantasyon İndeksi

WhatsApp Flow ile Dinamik Kuaför Randevu Sistemi - Tüm Dokümantasyon

---

## 🗂️ Dokümantasyon Yapısı

```
docs/whatsapp-flow-dynamic-calendar/
├── INDEX.md                      # Bu dosya
├── README.md                     # Genel bakış ve hızlı başlangıç
├── SETUP.md                      # Detaylı kurulum rehberi
├── FLOW-STRUCTURE.md             # Flow JSON yapısı
├── WEBHOOK-GUIDE.md              # Webhook development
├── API-SCRIPTS.md                # API script'leri
├── TROUBLESHOOTING.md            # Sorun giderme
└── examples/                     # Örnek kodlar
    ├── simple-flow-example.json
    └── webhook-handler-example.ts
```

---

## 📖 Dokümantasyon Rehberi

### 1. Başlangıç (Yeni Başlayanlar İçin)

#### 1.1. [README.md](./README.md)
**Ne zaman oku**: İlk olarak buradan başla

**İçerik**:
- ✅ Proje hakkında genel bilgi
- ✅ Mimari açıklama
- ✅ Proje yapısı
- ✅ Hızlı başlangıç
- ✅ Nasıl çalışır? (Akış diyagramları)
- ✅ Mock takvim verisi
- ✅ Google Calendar entegrasyonu

**Kimlere Önerilir**:
- Projeye yeni başlayanlar
- Genel bakış isteyenler
- Hızlı başlamak isteyenler

---

#### 1.2. [SETUP.md](./SETUP.md)
**Ne zaman oku**: Kuruluma başlamadan önce

**İçerik**:
- ✅ Ön gereksinimler
- ✅ WhatsApp Business Platform kurulumu
- ✅ Proje kurulumu (adım adım)
- ✅ Environment variables
- ✅ Endpoint konfigürasyonu (ngrok, production)
- ✅ Flow oluşturma
- ✅ Test etme

**Kimlere Önerilir**:
- İlk kez WhatsApp Flow API kullananlar
- Production deployment planlıyanlar
- ngrok kullanmayı öğrenmek isteyenler

**Tahmini Süre**: 30-45 dakika

---

### 2. Geliştirme (Developer'lar İçin)

#### 2.1. [FLOW-STRUCTURE.md](./FLOW-STRUCTURE.md)
**Ne zaman oku**: Flow JSON oluştururken veya düzenlerken

**İçerik**:
- ✅ Flow JSON temel yapısı
- ✅ Routing model
- ✅ Screen yapısı (data, layout, components)
- ✅ Dynamic data binding
- ✅ Actions (navigate, data_exchange, complete)
- ✅ Component types (TextInput, Dropdown, vb.)
- ✅ Best practices
- ✅ Validation ve testing

**Kimlere Önerilir**:
- Flow JSON yazacaklar
- Component'leri öğrenmek isteyenler
- Dynamic data binding anlamak isteyenler

**Referans**: Flow JSON yazarken bu dokümantasyonu açık tut

---

#### 2.2. [WEBHOOK-GUIDE.md](./WEBHOOK-GUIDE.md)
**Ne zaman oku**: Webhook endpoint geliştirirken

**İçerik**:
- ✅ Webhook akışı
- ✅ Şifreleme ve güvenlik (RSA + AES-128-GCM)
- ✅ Request handling
- ✅ Response format
- ✅ Action handlers (INIT, data_exchange, vb.)
- ✅ Mock Calendar Service implementasyonu
- ✅ Error handling
- ✅ Testing

**Kimlere Önerilir**:
- Backend developer'lar
- Şifreleme mekanizmasını anlamak isteyenler
- Custom action handler yazacaklar

**Önemli**: Bu dokümantasyonda production-ready kod örnekleri var

---

#### 2.3. [API-SCRIPTS.md](./API-SCRIPTS.md)
**Ne zaman oku**: API script'lerini kullanırken veya özelleştirirken

**İçerik**:
- ✅ create-dynamic-flow.js açıklaması
- ✅ update-dynamic-flow.js açıklaması
- ✅ test-send-message.js açıklaması
- ✅ WhatsApp API endpoint'leri
- ✅ Request/response formatları
- ✅ Error handling
- ✅ Best practices

**Kimlere Önerilir**:
- Script'leri anlamak isteyenler
- Kendi automation script'leri yazacaklar
- WhatsApp API'yi öğrenmek isteyenler

---

### 3. Sorun Giderme

#### 3.1. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
**Ne zaman oku**: Hata aldığında veya bir şey çalışmadığında

**İçerik**:
- ✅ Server issues (port, TypeScript, modules)
- ✅ Flow creation errors (validation, routing)
- ✅ Endpoint configuration issues
- ✅ Message sending errors
- ✅ Dynamic data issues
- ✅ Encryption problems
- ✅ Development issues
- ✅ Production issues

**Kimlere Önerilir**:
- Hata alanlar
- Debug yapmak isteyenler
- Production'da sorun yaşayanlar

**Kullanım**: Ctrl+F ile hata mesajını ara

---

### 4. Örnekler

#### 4.1. [examples/simple-flow-example.json](./examples/simple-flow-example.json)
**Ne zaman kullan**: Basit bir Flow oluşturmak istediğinde

**İçerik**:
- ✅ 2 screen'li basit Flow
- ✅ TextInput ve RadioButtonsGroup kullanımı
- ✅ Cross-screen data reference
- ✅ Endpoint gerektirmeyen yapı

**Kopyala-Yapıştır**: Evet, direkt kullanılabilir

---

#### 4.2. [examples/webhook-handler-example.ts](./examples/webhook-handler-example.ts)
**Ne zaman kullan**: Yeni bir webhook handler yazmak istediğinde

**İçerik**:
- ✅ Minimal webhook controller
- ✅ Encryption/decryption
- ✅ Action handling
- ✅ Response formatting

**Kopyala-Yapıştır**: Evet, template olarak kullan

---

## 🎯 Kullanım Senaryoları

### Senaryo 1: "Sıfırdan başlıyorum"

1. ✅ [README.md](./README.md) - Projeyi anla
2. ✅ [SETUP.md](./SETUP.md) - Kurulumu tamamla
3. ✅ Test mesajı gönder
4. ✅ [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Sorun çıkarsa bak

**Tahmini Süre**: 1-2 saat

---

### Senaryo 2: "Kendi Flow'umu yazmak istiyorum"

1. ✅ [examples/simple-flow-example.json](./examples/simple-flow-example.json) - Basit örnekle başla
2. ✅ [FLOW-STRUCTURE.md](./FLOW-STRUCTURE.md) - Component'leri öğren
3. ✅ Flow JSON'u oluştur
4. ✅ `node create-dynamic-flow.js` ile yükle
5. ✅ [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Validation hatası alırsan bak

---

### Senaryo 3: "Webhook endpoint geliştirmek istiyorum"

1. ✅ [WEBHOOK-GUIDE.md](./WEBHOOK-GUIDE.md) - Webhook mekanizmasını anla
2. ✅ [examples/webhook-handler-example.ts](./examples/webhook-handler-example.ts) - Template'i kopyala
3. ✅ Custom action handler yaz
4. ✅ Local test et (ngrok ile)
5. ✅ [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Endpoint çalışmazsa bak

---

### Senaryo 4: "Production'a deploy etmek istiyorum"

1. ✅ [SETUP.md](./SETUP.md) - Production deployment bölümü
2. ✅ Environment variables'ı ayarla
3. ✅ Heroku/AWS'e deploy et
4. ✅ WhatsApp Business Manager'da endpoint'i güncelle
5. ✅ Flow'u publish et
6. ✅ [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Production issues bölümü

---

### Senaryo 5: "Google Calendar entegre etmek istiyorum"

1. ✅ [README.md](./README.md) - Google Calendar entegrasyonu bölümü
2. ✅ Google Calendar API setup
3. ✅ MockCalendarService'i değiştir
4. ✅ Test et

---

## 📊 Dokümantasyon İstatistikleri

| Dosya | Satır | Kelime | Karakter | Süre |
|-------|-------|--------|----------|------|
| README.md | 700+ | 4500+ | 30,000+ | 20 dk |
| SETUP.md | 500+ | 3000+ | 20,000+ | 15 dk |
| FLOW-STRUCTURE.md | 800+ | 5000+ | 35,000+ | 25 dk |
| WEBHOOK-GUIDE.md | 600+ | 4000+ | 28,000+ | 20 dk |
| API-SCRIPTS.md | 500+ | 3000+ | 22,000+ | 15 dk |
| TROUBLESHOOTING.md | 400+ | 2500+ | 18,000+ | 12 dk |

**Toplam**: ~3500 satır, ~22,000 kelime, ~150,000 karakter

---

## 🔍 Hızlı Arama

### Kavram Arama

| Kavram | Dosya | Bölüm |
|--------|-------|-------|
| RSA Encryption | WEBHOOK-GUIDE.md | §2.1 |
| AES-128-GCM | WEBHOOK-GUIDE.md | §2.2 |
| routing_model | FLOW-STRUCTURE.md | §2 |
| data_exchange | FLOW-STRUCTURE.md | §5.2 |
| on-select-action | FLOW-STRUCTURE.md | §5.2 |
| Cross-screen data | FLOW-STRUCTURE.md | §4.2 |
| ngrok setup | SETUP.md | §4.1 |
| Mock Calendar | README.md, WEBHOOK-GUIDE.md | §6 |
| Flow validation | TROUBLESHOOTING.md | §2 |
| Endpoint config | TROUBLESHOOTING.md | §3 |

### Hata Arama

| Hata | Dosya | Çözüm |
|------|-------|-------|
| EADDRINUSE | TROUBLESHOOTING.md | §1.1 |
| Invalid Token | TROUBLESHOOTING.md | §4.1 |
| Validation Error | TROUBLESHOOTING.md | §2 |
| Endpoint Not Responding | TROUBLESHOOTING.md | §3.1 |
| Empty Dropdown | TROUBLESHOOTING.md | §5.1 |
| Decryption Failed | TROUBLESHOOTING.md | §6.1 |

---

## 🛠️ Developer Workflow

### 1. Günlük Development

```
Sabah:
├── npm run start:dev (Server başlat)
├── ngrok http 3000 (Endpoint expose et)
└── Browser: http://localhost:4040 (ngrok inspector aç)

Development:
├── Flow JSON düzenle
├── node update-dynamic-flow.js
├── node test-send-message.js
└── WhatsApp'ta test et

Debug:
├── Server logs kontrol et
├── ngrok inspector kullan
└── TROUBLESHOOTING.md'ye bak
```

### 2. Haftalık Maintenance

```
- Access token'ı yenile (24 saat geçerliyse)
- Mock takvim tarihlerini güncelle
- Log dosyalarını temizle
- Validation errors kontrol et
```

---

## 📞 Destek ve İletişim

### Sık Sorulan Sorular

**S**: Flow JSON validation hatası alıyorum
**C**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) §2

**S**: Endpoint verification failed
**C**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) §3.1

**S**: Empty dropdown gösteriyor
**C**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) §5.1

**S**: Cross-screen data çalışmıyor
**C**: [FLOW-STRUCTURE.md](./FLOW-STRUCTURE.md) §4.2

**S**: Google Calendar nasıl entegre edilir?
**C**: [README.md](./README.md) "Google Calendar Entegrasyonu" bölümü

### GitHub Issues

Dokümantasyonda bulamadıysan:
1. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)'ye bak
2. Server logs'u incele
3. GitHub issue aç

---

## 🎓 Öğrenme Yolu

### Beginner (0-1 hafta)

1. ✅ README.md oku
2. ✅ SETUP.md'yi takip et, projeyi kur
3. ✅ Test mesajı gönder
4. ✅ simple-flow-example.json'u incele
5. ✅ Kendi basit Flow'unu yaz

### Intermediate (1-2 hafta)

1. ✅ FLOW-STRUCTURE.md'yi oku
2. ✅ Dynamic data binding'i öğren
3. ✅ WEBHOOK-GUIDE.md'yi oku
4. ✅ Kendi action handler'ını yaz
5. ✅ MockCalendarService'i özelleştir

### Advanced (2+ hafta)

1. ✅ Google Calendar entegrasyonu
2. ✅ Production deployment
3. ✅ Rate limiting implementasyonu
4. ✅ Advanced error handling
5. ✅ Custom encryption/auth

---

## 📝 Notlar

- Tüm dokümantasyon **Türkçe** yazılmıştır
- Kod örnekleri **production-ready**'dir
- Her dosya **bağımsız** okunabilir
- **Ctrl+F** ile arama yap
- Dokümantasyon **23 Kasım 2025** tarihinde oluşturuldu

---

## 🔄 Güncelleme Geçmişi

| Tarih | Versiyon | Değişiklik |
|-------|----------|------------|
| 23 Kasım 2025 | 1.0.0 | İlk versiyon yayınlandı |

---

**Hazırlayan**: Claude Code
**Proje**: WhatsApp Flow Dynamic Calendar
**Durum**: Aktif Geliştirme
