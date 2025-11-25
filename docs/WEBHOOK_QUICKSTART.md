# WhatsApp Webhook Hızlı Başlangıç

Bu rehber, WhatsApp webhook'larınızı hızlıca çalıştırmanız için gerekli adımları gösterir.

## 🚀 Hızlı Başlatma

Tek komutla backend ve ngrok'u başlatın:

```bash
npm run webhook:start
```

Bu komut:
- ✅ Backend'i başlatır (port 3000)
- ✅ Ngrok'u başlatır ve public URL oluşturur
- ✅ Webhook URL'ini gösterir
- ✅ Meta Dashboard yapılandırma talimatlarını gösterir

## 📋 Komutlar

### Webhook'u Başlat
```bash
npm run webhook:start
```

### Webhook URL'ini Göster
Webhook'lar çalışırken URL'i tekrar görmek için:
```bash
npm run webhook:url
```

### Webhook'u Durdur
```bash
npm run webhook:stop
```

veya çalışan terminalde `Ctrl+C`

## ⚙️ Meta Dashboard'da Webhook Yapılandırması

Script çalıştırıldığında size bir webhook URL'i verilecek. Bu URL'i Meta Dashboard'a kaydetmeniz gerekiyor:

1. **Meta Developer Console'a gidin:**
   https://developers.facebook.com/apps/841990238230922/whatsapp-business/wa-settings/

2. **Webhook bölümünde 'Edit' butonuna tıklayın**

3. **Şu değerleri girin:**
   - **Callback URL:** Script'in size verdiği URL (örnek: `https://xxxx.ngrok-free.dev/api/webhooks/whatsapp`)
   - **Verify Token:** `sipsy_webhook_2025`

4. **'Verify and Save' butonuna tıklayın**

5. **Webhook fields için şunları seçin:**
   - ✅ messages
   - ✅ message_status

## 🧪 Test Etme

### 1. Backend Loglarını İzleyin

Script çalıştırıldığında otomatik olarak backend logları gösterilir.

### 2. Ngrok Dashboard

Tarayıcıda açın: http://localhost:4040

Buradan gelen tüm webhook isteklerini görebilirsiniz.

### 3. WhatsApp'tan Mesaj Gönderin

WhatsApp Business numaranıza mesaj gönderin ve backend loglarında şunları görmelisiniz:

```
[WebhooksController] Webhook payload received
[WebhookSignatureService] Webhook signature verified successfully
[WebhookProcessorService] Processing message...
[WebhookProcessorService] Message processed successfully
```

## 🔍 Sorun Giderme

### Backend başlamıyor
- PostgreSQL'in çalıştığından emin olun: `pg_isready -h localhost -p 5432`
- .env dosyasının mevcut olduğundan emin olun
- Log dosyasını kontrol edin: `logs/backend-*.log`

### Ngrok URL değişti
Ngrok ücretsiz versiyonda her yeniden başlatmada URL değişir:
- URL'i tekrar almak için: `npm run webhook:url`
- Yeni URL'i Meta Dashboard'da güncelleyin

### Mesajlar gelmiyor
1. Backend çalışıyor mu? → `npm run webhook:start`
2. Ngrok çalışıyor mu? → http://localhost:4040 açılıyor mu?
3. Meta Dashboard'da webhook yapılandırıldı mı?
4. Doğru URL kullanılıyor mu? → `npm run webhook:url`

### Signature verification hatası
- .env dosyasındaki `WHATSAPP_APP_SECRET` değerini kontrol edin
- Meta Dashboard > Settings > Basic > App Secret ile karşılaştırın

## 📝 Önemli Notlar

1. **Development Ortamı:** Bu setup sadece development için uygundur
2. **Ngrok URL'i:** Ücretsiz ngrok her restart'ta yeni URL verir
3. **Production:** Production'da gerçek domain ve SSL kullanın
4. **Güvenlik:** Signature verification aktif, asla devre dışı bırakmayın

## 📊 Durum Kontrolü

### Backend çalışıyor mu?
```bash
curl http://localhost:3000/api/health
```

### Ngrok çalışıyor mu?
```bash
curl http://localhost:4040/api/tunnels
```

## 🔗 İlgili Dökümanlar

- [Detaylı Webhook Setup](docs/WEBHOOK_SETUP.md)
- [Frontend Integration](docs/FRONTEND_INTEGRATION.md)
- [WhatsApp API Docs](https://developers.facebook.com/docs/whatsapp)

---

**İlk kez çalıştırıyorsanız:**
1. `npm run webhook:start` komutunu çalıştırın
2. Verilen webhook URL'ini kopyalayın
3. Meta Dashboard'da webhook'u yapılandırın
4. WhatsApp'tan test mesajı gönderin
5. Backend loglarında mesajı görün

**Sorun yaşıyorsanız:**
- Logs dizinindeki log dosyalarını kontrol edin
- http://localhost:4040 ngrok dashboard'a bakın
- docs/WEBHOOK_SETUP.md detaylı rehberine göz atın
