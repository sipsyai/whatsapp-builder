# AI Features

Chatbot Builder, yapay zeka destekli özelliklerle akış tasarımını hızlandırır.

---

## AI Build

AI Build özelliği, doğal dil açıklamasından otomatik olarak chatbot akışı oluşturur.

### AI Build Kullanımı

1. Header toolbar'daki **✨ AI Build** butonuna tıklayın
2. Modal açılır

![AI Build Modal](images/17-ai-build-modal.png)

3. Akışınızı doğal dilde açıklayın
4. **Generate** butonuna tıklayın
5. AI, açıklamanıza göre node'lar ve bağlantılar oluşturur

### AI Build Modal Bileşenleri

| Bileşen | Açıklama |
|---------|----------|
| **Describe your bot flow...** | Akış açıklaması textarea'sı |
| **Cancel** | İşlemi iptal et |
| **Generate** | Akış oluşturmayı başlat |

### Etkili Prompt Yazma

#### İyi Örnek ✅

```
Müşteri hizmetleri chatbot'u oluştur:
1. Hoş geldiniz mesajı gönder
2. "Sipariş Takibi", "İade Talebi", "Genel Bilgi" seçeneklerini sun
3. Sipariş Takibi seçilirse sipariş numarası sor
4. API ile sipariş durumunu kontrol et
5. Sonucu kullanıcıya göster
```

#### Kötü Örnek ❌

```
Chatbot yap
```

### Prompt İpuçları

| İpucu | Açıklama |
|-------|----------|
| **Adımları numaralandırın** | Sıralı akış için |
| **Seçenekleri belirtin** | Buttons/List için |
| **API detayları verin** | REST API node'ları için |
| **Koşulları açıklayın** | Condition node'ları için |
| **Değişken isimleri önerin** | Variable tanımları için |

### AI Tarafından Desteklenen Node Türleri

| Node Tipi | AI Desteği |
|-----------|------------|
| Message | ✅ Tam destek |
| Question (Text) | ✅ Tam destek |
| Question (Buttons) | ✅ Tam destek |
| Question (List) | ✅ Tam destek |
| Condition | ✅ Tam destek |
| REST API | ⚠️ Kısmi destek |
| WhatsApp Flow | ⚠️ Kısmi destek |

---

## Auto Layout

Auto Layout özelliği, canvas'taki node'ları otomatik olarak düzenler.

### Auto Layout Kullanımı

1. Header toolbar'daki **🔀 Auto Layout** butonuna tıklayın
2. Node'lar dagre algoritması ile yeniden düzenlenir
3. Bağlantılar optimize edilir

### Auto Layout Özellikleri

| Özellik | Açıklama |
|---------|----------|
| **Algoritma** | dagre (directed graph) |
| **Yön** | Sol → Sağ |
| **Spacing** | Otomatik node aralığı |
| **Edge Routing** | Otomatik bağlantı yönlendirme |

### Ne Zaman Kullanılmalı?

- Node'lar üst üste bindiğinde
- Bağlantılar karışık göründüğünde
- Yeni node'lar ekledikten sonra
- AI Build sonrası

---

## Gelecek AI Özellikleri

| Özellik | Durum |
|---------|-------|
| Akış optimizasyonu önerileri | 🔜 Planlı |
| Otomatik hata düzeltme | 🔜 Planlı |
| Mesaj iyileştirme önerileri | 🔜 Planlı |
| A/B test önerileri | 🔜 Planlı |

---

## AI Kullanım Limitleri

| Limit | Değer |
|-------|-------|
| Maksimum prompt uzunluğu | 2000 karakter |
| Günlük istek limiti | 100 istek |
| Maksimum node sayısı | 50 node/akış |

---

## Sorun Giderme

### AI Generate Çalışmıyor

1. Internet bağlantısını kontrol edin
2. Prompt'un yeterince açıklayıcı olduğundan emin olun
3. Backend servisinin çalıştığını doğrulayın

### Beklenen Akış Oluşmuyor

1. Prompt'u daha detaylı yazın
2. Adımları numaralandırın
3. Seçenekleri açıkça belirtin
4. Gerekirse manuel düzenleme yapın

