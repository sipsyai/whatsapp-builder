# Project Architect - WhatsApp Builder

Kapsamlı proje mimarisi dökümantasyonu ve rehberi.

## Hızlı Başvuru

### Proje Nedir?

WhatsApp Builder, WhatsApp Business API üzerinden görsel akış bazlı chatbot'lar oluşturmanızı sağlayan bir full-stack TypeScript uygulamasıdır.

**Temel Özellikler:**
- 🎨 Görsel akış editörü (ReactFlow)
- 💬 Real-time chat interface
- 🤖 Chatbot akış yürütme motoru
- 📱 WhatsApp Business API entegrasyonu
- ⚡ WebSocket ile canlı güncellemeler
- 🧠 AI destekli akış oluşturma (Google Gemini)

### Teknoloji Stack

**Backend:**
- NestJS 11 + TypeScript 5.7
- PostgreSQL 14+ + TypeORM 0.3
- Socket.IO 4.8
- WhatsApp Business API

**Frontend:**
- React 19 + TypeScript 5.9
- ReactFlow 12.3 (visual editor)
- Socket.IO Client 4.8
- Vite 7.2

### Proje Yapısı

```
whatsapp-builder/
├── backend/                    # NestJS backend
│   ├── src/
│   │   ├── modules/           # 9 feature modules
│   │   ├── entities/          # 7 database entities
│   │   ├── migrations/        # 5 applied migrations
│   │   ├── config/            # Configuration
│   │   └── database/          # DB setup
│   └── package.json
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── features/          # 7+ feature modules
│   │   ├── api/               # API clients
│   │   ├── hooks/             # Custom React hooks
│   │   └── types/             # TypeScript types
│   └── package.json
└── .claude/                    # Claude AI configuration
    ├── agents/                # AI agents
    └── skills/                # Skill definitions
        └── project-architect/ # This documentation
```

### Modüller (Backend)

1. **auth** - JWT authentication ve authorization
2. **chatbots** - Chatbot CRUD ve akış yürütme
3. **conversations** - Sohbet yönetimi
4. **messages** - Mesaj CRUD ve WhatsApp gönderimi
5. **users** - Kullanıcı yönetimi
6. **webhooks** - WhatsApp webhook işleme
7. **websocket** - Real-time iletişim
8. **whatsapp** - WhatsApp API entegrasyonu
9. **media** - Medya dosya yönetimi

### Features (Frontend)

1. **auth** - Login sayfası ve AuthContext
2. **builder** - ReactFlow görsel editör
3. **chat** - Real-time chat arayüzü
4. **chatbots** - Chatbot liste ve yönetim
5. **nodes** - 4 özel ReactFlow node
6. **users**, **settings**, **conversations**, **flows**, **landing**

### Veritabanı

**7 Tablo:**
- `users` - Platform kullanıcıları
- `chatbots` - Akış tanımları (JSONB nodes/edges)
- `conversations` - Sohbet oturumları
- `conversation_contexts` - Chatbot yürütme durumu
- `messages` - Chat mesajları (JSONB content)
- `whatsapp_config` - API yapılandırması
- `conversation_participants` - Many-to-many join table

**Özellikler:**
- UUID primary keys
- JSONB columns (esnek schema)
- Enum types (type-safe)
- Migration-based schema
- Partial unique indexes

### Real-Time

**Socket.IO Namespace:** `/messages`

**Events:**
- `message:received` - Yeni mesaj
- `message:status` - Durum güncelleme
- `typing:start` / `typing:stop` - Yazıyor göstergesi
- `user:online` / `user:offline` - Çevrimiçi durum

**Pattern:** Room-based messaging (`conversation:${id}`)

### WhatsApp Entegrasyonu

**Mesaj Tipleri:**
- Text mesajlar
- Interactive button mesajlar (max 3)
- Interactive list mesajlar (max 10)
- Flow mesajları (planned)

**Webhook:**
- HMAC SHA256 signature verification
- Message parsing ve validation
- Idempotency (duplicate prevention)
- 24 saat mesajlaşma penceresi takibi

### Chatbot Akış Yürütme

**Node Tipleri:**
1. START - Başlangıç noktası
2. MESSAGE - Metin gönder
3. QUESTION - Soru sor (text/buttons/list)
4. CONDITION - Koşula göre dallan

**Pattern:** State machine with recursive execution

**Özellikler:**
- Variable storage ({{name}} template)
- Conditional branching (==, !=, contains, >, <)
- Node history tracking
- Flow validation

## Hızlı Linkler

### Detaylı Dökümantasyon
- [Project Overview](reference/01-project-overview.md) - Proje tanıtımı
- [Backend Architecture](reference/02-backend-architecture.md) - Backend detayları
- [Frontend Architecture](reference/03-frontend-architecture.md) - Frontend detayları
- [Database Design](reference/04-database-design.md) - Veritabanı şeması
- [Real-Time System](reference/05-real-time-system.md) - Socket.IO mimarisi
- [WhatsApp Integration](reference/06-whatsapp-integration.md) - WhatsApp API
- [Project Structure](reference/07-project-structure.md) - Klasör yapısı
- [Module Relationships](reference/08-module-relationships.md) - Bağımlılıklar
- [Development Guide](reference/09-development-guide.md) - Geliştirme rehberi
- [Deployment](reference/10-deployment-architecture.md) - Production yapılandırması
- [Authentication & Security](reference/15-authentication-security.md) - JWT auth ve güvenlik

### İlgili Skills
- [NestJS Expert](../nestjs-expert/SKILL.md)
- [TypeORM Development](../typeorm-development/SKILL.md)
- [PostgreSQL Expert](../postgresql-expert/SKILL.md)
- [React Expert](../react-expert/SKILL.md)
- [ReactFlow Development](../reactflow-development/SKILL.md)
- [Socket.IO Expert](../socket-io-expert/SKILL.md)
- [WhatsApp Messaging API Expert](../whatsapp-messaging-api-expert/SKILL.md)

## Sık Kullanım Senaryoları

### Yeni Özellik Eklemek
1. Bu dökümantasyonda hangi modüllerin etkileneceğini öğren
2. İlgili specialized agent'ı çağır
3. Backend → Frontend → Test akışını takip et

### Mimari Karar Almak
1. Project Architect agent'ını çağır
2. Mevcut pattern'leri incele
3. Seçenekleri değerlendir
4. Karar ver ve dökümante et

### Hata Ayıklama
1. Hatanın hangi katmanda olduğunu belirle
2. İlgili modülün dökümantasyonuna bak
3. Data flow'u takip et
4. İlgili agent'tan yardım al

### Onboarding
1. README'yi oku (burası)
2. Project Overview'a bak
3. İlgilendiğin katmanın detaylı dökümantasyonunu oku
4. Development Guide ile kurulum yap
5. İlk contribution'ı yap

## Development Setup

```bash
# 1. Repository'yi clone et
git clone [repository-url]
cd whatsapp-builder

# 2. Backend setup
cd backend
npm install
cp .env.example .env
# .env dosyasını düzenle
npm run migration:run
npm run start:dev

# 3. Frontend setup (yeni terminal)
cd ../frontend
npm install
cp .env.example .env
# .env dosyasını düzenle
npm run dev

# 4. Tarayıcıda aç
# Frontend: http://localhost:3000
# Backend API: http://localhost:3000/api
```

## Environment Variables

### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=whatsapp_builder

# Authentication
JWT_SECRET=your-super-secret-key-change-in-production
ADMIN_EMAIL=admin@whatsapp-builder.local
ADMIN_PASSWORD=Admin123

# WhatsApp API
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token
WHATSAPP_APP_SECRET=your_app_secret

# Server
PORT=3000
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
VITE_GOOGLE_GENAI_API_KEY=your_gemini_api_key
```

## Production Checklist

**✓ Hazır:**
- Migration-based schema
- Connection pooling
- Webhook signature verification
- Error handling
- Input validation
- TypeScript type safety
- CORS configuration
- JWT authentication (global guard)
- bcrypt password hashing
- WebSocket JWT validation
- Admin user seed script

**⚠️ Gerekli:**
- Rate limiting
- Refresh token mechanism
- Structured logging (Winston/Pino)
- Redis adapter (WebSocket scaling)
- Health check endpoints
- API documentation (Swagger)
- Comprehensive test suite
- Monitoring & alerting

## Yardım

### Agent Kullanımı
- General questions: `project-architect` agent
- Backend details: `nestjs-expert`, `typeorm-expert`, `postgresql-expert`
- Frontend details: `react-expert`, `reactflow-expert`
- Real-time: `socket-io-expert`
- WhatsApp: `whatsapp-messaging-api-expert`

### Dökümantasyon
- Ana skill: [SKILL.md](SKILL.md)
- Detaylı referans: [reference/](reference/) klasörü
- Agent tanımı: [../../agents/project-architect.md](../../agents/project-architect.md)

## Version

- **Version:** 1.1.0
- **Last Updated:** 2025-01-27
- **Author:** Project Documentation System
