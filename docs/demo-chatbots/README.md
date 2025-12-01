# Multi-Sektor Demo Chatbot

Bu dizin, 5 farkli sektor icin WhatsApp Flow entegrasyonlu demo chatbot orneklerini icerir.

## Dosya Yapisi

```
docs/demo-chatbots/
├── multi-sector-demo-chatbot.json    # Ana chatbot (nodes + edges)
├── flows/
│   ├── 01-berber-randevu-flow.json   # Berber WhatsApp Flow
│   ├── 02-restoran-rezervasyon-flow.json # Restoran WhatsApp Flow
│   ├── 03-klinik-randevu-flow.json   # Klinik WhatsApp Flow
│   ├── 04-eticaret-siparis-flow.json # E-Ticaret WhatsApp Flow
│   └── 05-emlak-danismanlik-flow.json # Emlak WhatsApp Flow
└── README.md
```

## Chatbot Akis Yapisi

```
START
  │
  ▼
HOSGELDINIZ MESAJI
  │
  ▼
DEMO GIRIS BUTONU ──────────────────────┐
  │ (Demolari Gor)      (Hakkinda)      │
  │                                      │
  ▼                                      ▼
DEMO LISTESI                     HAKKINDA MESAJI
  │                                      │
  │ (5 sektor secenegi)                  │
  │                                      │
  ▼◄─────────────────────────────────────┘
CONDITION CHAIN (Zincirleme kosul kontrolleri)
  │
  ├─► Berber? ──► BERBER FLOW ──► BERBER ONAY
  │       │
  │       ▼
  ├─► Restoran? ──► RESTORAN FLOW ──► RESTORAN ONAY
  │       │
  │       ▼
  ├─► Klinik? ──► KLINIK FLOW ──► KLINIK ONAY
  │       │
  │       ▼
  ├─► E-Ticaret? ──► ETICARET FLOW ──► ETICARET ONAY
  │       │
  │       ▼
  └─► Emlak? ──► EMLAK FLOW ──► EMLAK ONAY
          │
          ▼
       BILINMEYEN DEMO
  │
  ▼
DEVAM SORUSU
  │
  ├─► (Evet) ──► DEMO LISTESI (loop)
  │
  └─► (Hayir) ──► VEDA MESAJI
```

## WhatsApp Flow Detaylari

### 1. Berber Randevu Flow
**Ekranlar:**
1. `BERBER_SECIM` - Berber ve hizmet secimi
2. `TARIH_SAAT_SECIM` - Tarih, saat ve musteri bilgileri
3. `ONAY_EKRANI` - Randevu onay ozeti

**Cikti Degiskenleri:**
- `berber_name`, `service`, `date`, `time`, `appointment_id`

### 2. Restoran Rezervasyon Flow
**Ekranlar:**
1. `REZERVASYON_BILGI` - Tarih, saat, kisi sayisi
2. `MASA_TERCIHI` - Masa tercihi ve musteri bilgileri
3. `REZERVASYON_ONAY` - Rezervasyon onay ozeti

**Cikti Degiskenleri:**
- `date`, `time`, `guest_count`, `table_preference`, `reservation_id`

### 3. Klinik Randevu Flow
**Ekranlar:**
1. `BOLUM_SECIM` - Poliklinik secimi
2. `DOKTOR_SECIM` - Doktor secimi
3. `RANDEVU_DETAY` - Tarih, saat ve hasta bilgileri
4. `RANDEVU_ONAY` - Randevu onay ozeti

**Cikti Degiskenleri:**
- `department`, `doctor_name`, `date`, `time`, `appointment_id`

### 4. E-Ticaret Siparis Flow
**Ekranlar:**
1. `KATEGORI_SECIM` - Urun kategorisi secimi
2. `URUN_SECIM` - Urun ve adet secimi
3. `TESLIMAT_BILGI` - Teslimat adresi
4. `SIPARIS_ONAY` - Siparis onay ozeti

**Cikti Degiskenleri:**
- `product_name`, `quantity`, `total_price`, `address`, `order_id`

### 5. Emlak Danismanlik Flow
**Ekranlar:**
1. `ARAMA_KRITERLERI` - Emlak tipi ve islem turu
2. `KONUM_BUTCE` - Konum ve butce araligi
3. `ILETISIM_BILGI` - Iletisim bilgileri
4. `TALEP_ONAY` - Talep onay ozeti

**Cikti Degiskenleri:**
- `property_type`, `location`, `room_count`, `budget`, `request_id`

## Chatbot Node Tipleri

| Node ID | Tip | Aciklama |
|---------|-----|----------|
| `start_1` | START | Baslangic noktasi |
| `welcome_msg` | MESSAGE | Karsilama mesaji |
| `demo_intro_btn` | QUESTION (buttons) | Demo giris butonu |
| `demo_list` | QUESTION (list) | 5 demo secenegi |
| `cond_*` | CONDITION | Demo secim kontrolleri |
| `flow_*` | WHATSAPP_FLOW | Sektor Flow'lari |
| `msg_*_onay` | MESSAGE | Onay mesajlari |
| `end_question` | QUESTION (buttons) | Devam sorusu |

## Kullanim

### Chatbot'u Sisteme Yukleme

1. Backend API uzerinden POST `/chatbots` endpoint'ine chatbot JSON'u gonderin
2. Veya direkt veritabanina `chatbots` tablosuna ekleyin:

```sql
INSERT INTO chatbots (name, description, nodes, edges, is_active, status)
VALUES (
  'Multi-Sektor Demo Chatbot',
  '5 farkli sektor icin WhatsApp Flow entegrasyonlu demo chatbot',
  '[...nodes JSON...]',
  '[...edges JSON...]',
  true,
  'active'
);
```

### WhatsApp Flow'lari Meta'ya Yukleme

1. Meta Business Manager'da her bir Flow JSON'u yukleyin
2. Flow ID'lerini alin
3. Chatbot'taki `whatsappFlowId` alanlarini gunceleyin:
   - `BERBER_DEMO_FLOW_ID` -> Gercek Berber Flow ID
   - `RESTORAN_DEMO_FLOW_ID` -> Gercek Restoran Flow ID
   - `KLINIK_DEMO_FLOW_ID` -> Gercek Klinik Flow ID
   - `ETICARET_DEMO_FLOW_ID` -> Gercek E-Ticaret Flow ID
   - `EMLAK_DEMO_FLOW_ID` -> Gercek Emlak Flow ID

## Edge (Baglanti) Yapisi

### Ana Akis Edges

| Edge | Source | Target | Handle |
|------|--------|--------|--------|
| e1 | start_1 | welcome_msg | - |
| e2 | welcome_msg | demo_intro_btn | - |
| e3 | demo_intro_btn | demo_list | btn_demolar |
| e4 | demo_intro_btn | hakkinda_msg | btn_hakkinda |
| e5 | hakkinda_msg | demo_list | - |
| e6 | demo_list | cond_berber | - |

### Condition Chain Edges

| Edge | Source | Target | Handle |
|------|--------|--------|--------|
| e7 | cond_berber | flow_berber | true |
| e8 | cond_berber | cond_restoran | false |
| e9 | cond_restoran | flow_restoran | true |
| e10 | cond_restoran | cond_klinik | false |
| e11 | cond_klinik | flow_klinik | true |
| e12 | cond_klinik | cond_eticaret | false |
| e13 | cond_eticaret | flow_eticaret | true |
| e14 | cond_eticaret | cond_emlak | false |
| e15 | cond_emlak | flow_emlak | true |
| e16 | cond_emlak | msg_unknown_demo | false |

### Onay ve Bitis Edges

| Edge | Source | Target | Handle |
|------|--------|--------|--------|
| e17-e21 | flow_* | msg_*_onay | - |
| e22-e27 | msg_*_onay | end_question | - |
| e28 | end_question | demo_list | btn_evet |
| e29 | end_question | msg_goodbye | btn_hayir |

## Degisken Kullanimi

### Flow Ciktilari

Her WhatsApp Flow tamamlandiginda, `flowOutputVariable` ile belirtilen degiskene sonuc kaydedilir:

```
{{berber_randevu.berber_name}}
{{restoran_rezervasyon.date}}
{{klinik_randevu.doctor_name}}
{{eticaret_siparis.product_name}}
{{emlak_talep.property_type}}
```

### Onay Mesajlarinda Kullanim

```
Randevunuz basariyla olusturuldu!

Berber: {{berber_randevu.berber_name}}
Hizmet: {{berber_randevu.service}}
Tarih: {{berber_randevu.date}}
Saat: {{berber_randevu.time}}

Randevu No: #{{berber_randevu.appointment_id}}
```

## Notlar

- WhatsApp Flow version: 6.0
- Tum Flow'lar `navigate` modu ile calisir (endpoint gerektirmez)
- DatePicker min/max tarihleri timestamp formatindadir
- Her Flow sonunda `complete` action ile tum veriler chatbot'a doner
