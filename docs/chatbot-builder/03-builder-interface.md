# Builder Interface

Chatbot Builder arayüzü üç ana bölümden oluşur: Header Toolbar, Sidebar ve Canvas.

## Genel Bakış

![Builder Main Interface](images/09-main-sidebar-menu.png)

---

## 1. Header Toolbar

Üst kısımda yer alan toolbar, akış yönetimi için temel işlemleri içerir.

![Header Toolbar](images/03-header-toolbar.png)

### Toolbar Butonları

| Buton | Renk | Açıklama |
|-------|------|----------|
| **+ New Flow** | Gri | Yeni boş akış oluşturur |
| **📋 Preview** | Gri | Chat sayfasında önizleme |
| **🧪 Test Mode** | Kırmızı | Flow simülasyonu başlatır |
| **✅ Validate** | Yeşil | Akış doğrulaması yapar |
| **🔀 Auto Layout** | Mor | Node'ları otomatik düzenler |
| **✨ AI Build** | Mavi | AI ile akış oluşturur |
| **Update Flow** | Yeşil | Değişiklikleri kaydeder |

---

## 2. Sidebar (Sol Panel)

Sidebar iki ana bölümden oluşur:

### Flow Details

| Alan | Açıklama |
|------|----------|
| **Flow Name** | Akışın adı |
| **Description** | Akışın açıklaması (opsiyonel) |

### Nodes

Eklenebilir node listesi:

![Sidebar Nodes](images/04-sidebar-nodes.png)

| Node | Icon | Renk |
|------|------|------|
| Message | 💬 chat | Mavi |
| Question | ❓ help | Turuncu |
| Condition | 🔀 call_split | Mor |
| WhatsApp Flow | ✅ check_box | Yeşil |
| REST API | 🔗 api | Cyan |

**Node Ekleme Yöntemleri:**

1. **➕ Add Butonu**: Tıklayarak node'u canvas'a ekler
2. **Drag & Drop**: Node'u sürükleyip canvas'a bırakır

---

## 3. Canvas (Çalışma Alanı)

ReactFlow tabanlı görsel düzenleyici.

![Canvas with Nodes](images/05-canvas-nodes.png)

### Canvas Özellikleri

| Özellik | Değer |
|---------|-------|
| **Zoom Aralığı** | 0.5x - 2x |
| **Pan** | Mouse ile sürükleme |
| **Double Click Zoom** | Aktif |
| **Fit View** | Aktif |

### Control Panel

Canvas sağ alt köşesinde kontrol paneli bulunur:

| Buton | İşlev |
|-------|-------|
| **➕ Zoom In** | Yakınlaştır |
| **➖ Zoom Out** | Uzaklaştır |
| **⬜ Fit View** | Tüm node'ları göster |
| **🔒 Toggle Interactivity** | Etkileşimi aç/kapat |

---

## Edge (Bağlantı) İşlemleri

### Bağlantı Oluşturma

1. Bir node'un çıkış handle'ından (sağ taraf) tıklayın
2. Hedef node'un giriş handle'ına (sol taraf) sürükleyin
3. Bağlantı otomatik oluşur

### Bağlantı Silme

Her edge üzerinde **❌ close** butonu bulunur. Tıklayarak bağlantıyı silebilirsiniz.

---

## Klavye Kısayolları

| Kısayol | İşlev |
|---------|-------|
| `Delete` / `Backspace` | Seçili node'u sil |
| `Ctrl + Z` | Geri al |
| `Ctrl + Y` | Yinele |
| `Ctrl + A` | Tümünü seç |

---

## NestJS Integration Notu

Sidebar'ın altında NestJS entegrasyon notu bulunur:

> **NestJS Integration:** The nodes and edges are sent to `POST /flows`. Ensure the NestJS server is running.

Bu, akışın backend'e nasıl kaydedildiğini gösterir.

