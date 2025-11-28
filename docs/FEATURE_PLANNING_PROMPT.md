# Feature Planning Prompt

Bu prompt, yeni özellik geliştirirken sistematik planlama yapmak için kullanılır.

---

## Kullanım

Yeni bir özellik istediğinde şu formatı kullan:

```
[Özellik açıklaması]. Agentları kullanarak planlamanı yap.
```

---

## Planlama Süreci

### PHASE 1: Codebase Keşfi (Paralel Agent'lar)

Aşağıdaki agent'ları **paralel** olarak çalıştır:

1. **project-architect** - Proje mimarisini ve cross-cutting concern'leri analiz et
2. **nestjs-expert** - Backend modülleri, service/controller pattern'leri, dependency injection yapısını incele
3. **react-expert** - Frontend component pattern'leri, hooks, state management, TypeScript entegrasyonu
4. **typeorm-expert** - Mevcut entity ilişkilerini ve migration pattern'lerini incele

### PHASE 2: Yaklaşım Planlaması (Paralel Plan Agent'ları)

Farklı perspektiflerden plan agent'ları çalıştır:

1. **Plan (Simplicity)** - En basit implementasyon yaklaşımı
2. **Plan (Real-time UX)** - WebSocket ve real-time güncellemeler odaklı
3. **Plan (Analytics)** - Veri analizi ve raporlama odaklı (opsiyonel)

### PHASE 3: Kullanıcı Tercihleri

AskUserQuestion tool'u ile kritik kararları netleştir:
- UI yaklaşımı (modal vs sayfa)
- Real-time gereksinimi
- Ek özellikler

### PHASE 4: TODO Listesi Oluşturma

Plan dosyasına TODO'ları yaz. Her TODO için:

```markdown
#### TODO X: [Başlık]
**Agent:** `[agent-adı]` (skill veya agent)
**Dosyalar:**
- `path/to/file1.ts`
- `path/to/file2.ts`

**Görevler:**
1. Görev 1
2. Görev 2
3. Görev 3
```

### PHASE 5: Implementation (Paralel Agent'lar)

TODO'ları gruplara ayır ve bağımsız olanları paralel çalıştır:

```
TODO 1, 2 (Entity, Migration) → Paralel
TODO 3, 4, 5 (DTO, Service, Controller) → Paralel
TODO 6, 7, 8 (WebSocket) → Paralel
TODO 9-15 (Frontend) → Paralel gruplar halinde
```

### PHASE 6: Build & Test

Backend ve frontend build'lerini paralel test et:

```bash
# Paralel build test
cd backend && npm run build &
cd frontend && npm run build &
wait
```

### PHASE 7: Docker Deployment

Production ortamına deploy etmek için Docker işlemleri:

```bash
# 1. Docker image'ı yeniden build et
docker compose -f docker-compose.prod.yml build backend

# 2. Container'ı yeniden başlat
docker compose -f docker-compose.prod.yml up -d backend

# 3. Health check ve logları kontrol et
docker ps | grep whatsapp
docker logs whatsapp-backend --tail 30

# 4. Opsiyonel: Migration çalıştır (yeni entity/column varsa)
docker compose -f docker-compose.prod.yml exec backend npm run migration:run
```

**Production URL:** https://whatsapp.sipsy.ai

### PHASE 8: Documentation & Commit

1. **project-architect** agent ile dokümantasyon güncelle:
   - Reference dosyası oluştur: `.claude/skills/project-architect/reference/XX-feature-name.md`
   - İlgili docs dosyalarını güncelle
   - README.md'yi güncelle


---

## Agent Kullanım Rehberi

| Agent | Ne Zaman Kullan |
|-------|-----------------|
| `project-architect` | Mimari kararlar, cross-cutting concerns, dokümantasyon |
| `Explore` | Codebase keşfi, pattern analizi |
| `Plan` | Farklı yaklaşımları değerlendirme |
| `nestjs-expert` | NestJS service, controller, module, DTO |
| `typeorm-expert` | Entity, migration, repository, complex queries |
| `postgresql-expert` | Database schema, indexler, performans |
| `socket-io-expert` | WebSocket gateway, real-time events |
| `react-expert` | React components, hooks, state management |
| `reactflow-expert` | Node-based UI, flow visualization |
| `redis-expert` | Caching, pub/sub, session storage |
| `whatsapp-messaging-api-expert` | WhatsApp API entegrasyonu |
| `whatsapp-flows-expert` | WhatsApp Flows geliştirme |
| `whatsapp-flow-builder-expert` | WhatsApp Flow JSON yapısı, screen navigation, data exchange |
| `chatbot-builder-expert` | Chatbot flow'ları, 6 node tipi, variable system, edge routing |
| `bullmq-expert` | Job queues, background processing |

---

## Örnek Plan Yapısı

```markdown
# [Feature Name] - Implementation Plan

## Kullanıcı Tercihleri
- **UI:** [Modal / Ayrı Sayfa]
- **Real-time:** [Evet / Hayır]
- **Ek Özellikler:** [Liste]

## Mevcut Altyapı
[Explore agent'larından gelen bilgiler]

## Implementation Plan

### PHASE 1: Backend
- TODO 1: [Migration] → postgresql-expert
- TODO 2: [Entity] → typeorm-expert
- TODO 3: [DTOs] → nestjs-expert
- TODO 4: [Service] → typeorm-expert
- TODO 5: [Controller] → nestjs-expert

### PHASE 2: WebSocket (opsiyonel)
- TODO 6: [Gateway] → socket-io-expert
- TODO 7: [Events] → socket-io-expert

### PHASE 3: Frontend
- TODO 8: [Types] → react-expert
- TODO 9: [API Service] → react-expert
- TODO 10: [Hook] → react-expert
- TODO 11-15: [Components] → react-expert

### PHASE 4: Integration
- TODO 16: [Navigation] → react-expert
- TODO 17: [Testing] → manuel

### PHASE 5: Docker Deployment
- TODO 18: [Docker Build] → manuel
- TODO 19: [Health Check] → manuel

## Agent Kullanım Özeti
| Agent | TODO'lar |
|-------|----------|
| postgresql-expert | 1 |
| typeorm-expert | 2, 4 |
| nestjs-expert | 3, 5 |
| socket-io-expert | 6, 7 |
| react-expert | 8-16 |
```

---

## Önemli Notlar

1. **Paralel Çalıştırma**: Bağımsız TODO'ları her zaman paralel agent'larla çalıştır
2. **Build Test**: Her phase sonunda build test et
3. **Incremental**: Büyük değişiklikleri küçük commit'lere böl
4. **Documentation**: Her özellik için implementation doc oluştur
5. **Real Data**: Mock data kullanma, gerçek API/database kullan
6. **Docker Deployment**: Feature tamamlandıktan sonra mutlaka Docker'a deploy et
7. **Production URL**: https://whatsapp.sipsy.ai adresinden test et
8. **Health Check**: Deploy sonrası `docker logs` ve `/health` endpoint'i kontrol et
