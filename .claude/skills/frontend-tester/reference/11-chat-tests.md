# Chat Sayfası Test Senaryoları

**URL:** http://localhost:5173/#chat
**Önkoşul:** Giriş yapılmış olmalı
**Öncelik:** P2 - Orta

---

## Sayfa Yapısı

Chat sayfası 2 panel layout kullanır:
- **Sol Panel:** Conversation listesi (sidebar)
- **Sağ Panel:** Chat window (mesajlar + input)

---

## Test Senaryoları

### TEST-CHAT-001: Conversation Listesi Yükleme
**Açıklama:** Conversation listesi yüklenmeli

**Adımlar:**
1. `browser_navigate` → http://localhost:5173/#chat
2. `browser_wait_for` → Conversation listesi
3. `browser_snapshot` → Liste yapısını kontrol et

**Beklenen Sonuç:**
- Conversation'lar sol panelde görünmeli
- Her conversation: customer info, son mesaj, zaman görünmeli
- Okunmamış mesaj badge'i (varsa)

---

### TEST-CHAT-002: Conversation Seçme
**Açıklama:** Conversation seçilebilmeli

**Adımlar:**
1. `browser_snapshot` → Conversation listesini bul
2. `browser_click` → Bir conversation'a tıkla
3. `browser_wait_for` → Mesajların yüklenmesi
4. `browser_snapshot` → Chat window

**Beklenen Sonuç:**
- Conversation seçili olarak işaretlenmeli
- Sağ panelde mesajlar görünmeli
- Input alanı aktif olmalı

---

### TEST-CHAT-003: Mesaj Listesi Yükleme
**Açıklama:** Seçili conversation'ın mesajları yüklenmeli

**Adımlar:**
1. Bir conversation seç
2. `browser_snapshot` → Mesaj listesi

**Beklenen Sonuç:**
- Mesajlar kronolojik sırada görünmeli
- Gelen mesajlar sol tarafa
- Giden mesajlar sağ tarafa
- Timestamp görünmeli

---

### TEST-CHAT-004: Mesaj Gönderme
**Açıklama:** Mesaj gönderilebilmeli

**Adımlar:**
1. Bir conversation seç
2. `browser_snapshot` → Input alanını bul
3. `browser_type` → Mesaj yaz
4. `browser_click` → Send butonuna tıkla (veya Enter)
5. `browser_wait_for` → Mesajın gönderilmesi
6. `browser_snapshot` → Mesaj listede

**Beklenen Sonuç:**
- Mesaj chat window'da görünmeli
- Input temizlenmeli
- Mesaj sağ tarafa (giden) olarak görünmeli

---

### TEST-CHAT-005: Enter ile Mesaj Gönderme
**Açıklama:** Enter tuşu ile mesaj gönderilebilmeli

**Adımlar:**
1. Bir conversation seç
2. `browser_type` → Mesaj yaz
3. `browser_press_key` → Enter
4. `browser_wait_for` → Mesaj gönderildi
5. `browser_snapshot` → Mesaj listede

**Beklenen Sonuç:**
- Mesaj gönderilmeli
- Input temizlenmeli

---

### TEST-CHAT-006: WebSocket Real-time Mesaj Alma
**Açıklama:** Yeni mesajlar real-time görünmeli

**Adımlar:**
1. Bir conversation seç
2. Backend/WhatsApp'tan mesaj gönder
3. `browser_wait_for` → Yeni mesaj
4. `browser_snapshot` → Yeni mesaj görünüyor

**Beklenen Sonuç:**
- Sayfa refresh olmadan yeni mesaj görünmeli
- Mesaj sese (opsiyonel)

---

### TEST-CHAT-007: Okundu Olarak İşaretleme
**Açıklama:** Conversation açıldığında okundu işaretlenmeli

**Adımlar:**
1. Okunmamış mesajı olan conversation bul
2. `browser_snapshot` → Badge/indicator kontrol
3. Conversation'a tıkla
4. `browser_wait_for` → Mesajlar yüklendi
5. `browser_snapshot` → Badge kayboldu

**Beklenen Sonuç:**
- Okunmamış badge kaybolmalı
- Backend'e mark as read çağrısı gitmeli

---

### TEST-CHAT-008: Empty State
**Açıklama:** Conversation seçilmemişse empty state

**Adımlar:**
1. Hiçbir conversation seçmeden sayfayı aç
2. `browser_snapshot` → Sağ panel (chat window)

**Beklenen Sonuç:**
- "Select a conversation" mesajı görünmeli
- Veya ilk conversation otomatik seçilmeli

---

### TEST-CHAT-009: Conversation Listesi Empty State
**Açıklama:** Conversation yoksa empty state

**Adımlar:**
1. `browser_snapshot` → Sol panel

**Beklenen Sonuç:**
- "No conversations" mesajı görünmeli (eğer conversation yoksa)

---

### TEST-CHAT-010: Mesaj Scroll
**Açıklama:** Mesaj listesi scroll yapılabilmeli

**Adımlar:**
1. Çok mesajı olan conversation seç
2. Scroll yap
3. `browser_snapshot` → Eski mesajlar görünür

**Beklenen Sonuç:**
- Scroll çalışmalı
- Eski mesajlar yüklenebilmeli (pagination)

---

### TEST-CHAT-011: Boş Mesaj Engelleme
**Açıklama:** Boş mesaj gönderilemeli

**Adımlar:**
1. Input boşken send butonuna tıkla
2. `browser_snapshot` → Durum

**Beklenen Sonuç:**
- Mesaj gönderilmemeli
- Send butonu disabled olabilir

---

## Sayfa Elementleri

```
- Left Panel: Conversation Sidebar
  - Conversation list
    - Conversation item:
      - Customer avatar/icon
      - Customer name/phone
      - Last message preview
      - Timestamp
      - Unread badge (optional)

- Right Panel: Chat Window
  - Header:
    - Customer info
    - Status
  - Message List:
    - Incoming message bubbles (left)
    - Outgoing message bubbles (right)
    - Timestamps
    - Message status (sent, delivered, read)
  - Input Area:
    - Text input
    - Send button
    - Attachment button (optional)

- Empty States
```

---

## Mesaj Tipleri

| Tip | Açıklama |
|-----|----------|
| text | Düz metin mesaj |
| image | Görsel mesaj |
| video | Video mesaj |
| audio | Ses mesaj |
| document | Dosya/belge |
| location | Konum |
| template | Template mesaj |
| interactive | Button/list mesaj |

---

## Message Status

| Status | Açıklama | İkon |
|--------|----------|------|
| sending | Gönderiliyor | Loading spinner |
| sent | Gönderildi | Single check |
| delivered | Teslim edildi | Double check |
| read | Okundu | Blue double check |
| failed | Gönderilemedi | Error icon |

---

## Test Verileri

```json
{
  "testMessage": "Test message from Playwright",
  "longMessage": "This is a very long message that should wrap properly in the chat window...",
  "emojiMessage": "Hello! 👋 How are you? 😊"
}
```
