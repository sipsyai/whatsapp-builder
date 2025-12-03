# REST API Node - Postman Benzeri Geliştirme Planı

**STATUS: COMPLETED** (2025-12-03)

## Kullanıcı Tercihleri
- **Yaklaşım:** Simplicity (Hızlı) - Mevcut ConfigRestApi.tsx dosyasını güncelleyerek geliştirme
- **Monaco Editor:** Hayır - Basit textarea kullanıldı (gelecekte eklenebilir)
- **Öncelikler:** Content-Type + PATCH, Auth Tab, Query Params Tab

## Tamamlanan Özellikler
- PATCH HTTP method desteği
- Content-Type seçimi (JSON, form-data, x-www-form-urlencoded)
- Auth Tab (Bearer Token, Basic Auth, API Key)
- Query Parameters Tab
- Test Tab zenginleştirmeleri (status badge, response headers, copy)

## Mevcut Altyapı Özeti

### Backend Durumu (HAZIR)
| Özellik | Dosya | Durum |
|---------|-------|-------|
| `apiContentType` | `rest-api-executor.service.ts:107-146` | ✅ Destekliyor |
| `form-data` parsing | `rest-api-executor.service.ts:111-124` | ✅ Destekliyor |
| `x-www-form-urlencoded` | `rest-api-executor.service.ts:125-139` | ✅ Destekliyor |
| `apiFilterField/Value` | `rest-api-executor.service.ts:182-185` | ✅ Destekliyor |
| Variable replacement | `rest-api-executor.service.ts:20-67` | ✅ Destekliyor |

### Frontend Eksikleri
| Özellik | Dosya | Durum |
|---------|-------|-------|
| Content-Type UI | `ConfigRestApi.tsx` | ❌ YOK |
| PATCH method | `ConfigRestApi.tsx` | ❌ YOK |
| Auth Tab | `ConfigRestApi.tsx` | ❌ YOK |
| Query Params Tab | `ConfigRestApi.tsx` | ❌ YOK |
| Monaco Editor | - | ❌ YOK |

### Migration Gereksinimi
**HAYIR** - JSONB yapısı sayesinde database migration gerekmiyor.

---

## Implementation Plan

### PHASE 1: Backend (Paralel)

#### TODO 1: TestRestApiDto'ya Eksik Alanları Ekle
**Agent:** `nestjs-expert`
**Dosyalar:**
- `/backend/src/modules/chatbots/dto/test-rest-api.dto.ts`

**Görevler:**
1. Method enum'una PATCH ekle
2. `contentType` field ekle (@IsOptional, @IsString)
3. `filterField` field ekle
4. `filterValue` field ekle

---

#### TODO 2: Test Endpoint'i Güncelle
**Agent:** `nestjs-expert`
**Dosyalar:**
- `/backend/src/modules/chatbots/chatbots.controller.ts`

**Görevler:**
1. `testRestApi` metodunda `contentType`, `filterField`, `filterValue` parametrelerini executor'a ilet (satır 348-358)

---

#### TODO 3: RestApiExecutorService - Auth ve Query Params Desteği
**Agent:** `nestjs-expert`
**Dosyalar:**
- `/backend/src/modules/chatbots/services/rest-api-executor.service.ts`

**Görevler:**
1. Execute config interface'ine auth alanları ekle (authType, authToken, authUsername, authPassword, authKeyName, authKeyValue, authKeyLocation)
2. Execute config interface'ine queryParams ekle
3. Auth header oluşturma logic'i ekle (Bearer, Basic, API Key)
4. Query params URL'e ekleme logic'i ekle
5. Response'a headers ekle (responseHeaders field)

---

#### TODO 4: ChatBotExecutionService Güncelle
**Agent:** `nestjs-expert`
**Dosyalar:**
- `/backend/src/modules/chatbots/services/chatbot-execution.service.ts`

**Görevler:**
1. processRestApiNode metodunda yeni alanları oku (apiAuthType, apiAuthToken, vb.)
2. restApiExecutor.execute çağrısına yeni parametreleri ekle

---

#### TODO 5: NodeDataDto'ya Auth Alanları Ekle
**Agent:** `nestjs-expert`
**Dosyalar:**
- `/backend/src/modules/chatbots/dto/node-data.dto.ts`

**Görevler:**
1. Auth alanlarını ekle: apiAuthType, apiAuthToken, apiAuthUsername, apiAuthPassword, apiAuthKeyName, apiAuthKeyValue, apiAuthKeyLocation
2. Query params alanı ekle: apiQueryParams

---

### PHASE 2: Frontend Types (Paralel)

#### TODO 6: NodeData Interface Güncelle
**Agent:** `react-expert`
**Dosyalar:**
- `/frontend/src/shared/types/index.ts`

**Görevler:**
1. apiMethod'a 'PATCH' ekle
2. apiContentType field ekle
3. apiQueryParams field ekle (Record<string, string>)
4. Auth alanları ekle: apiAuthType, apiAuthToken, apiAuthUsername, apiAuthPassword, apiAuthKeyName, apiAuthKeyValue, apiAuthKeyLocation

---

### PHASE 3: Frontend UI (Sıralı)

#### TODO 7: ConfigRestApi - PATCH ve Content-Type
**Agent:** `react-expert`
**Dosyalar:**
- `/frontend/src/features/builder/components/ConfigRestApi.tsx`

**Görevler:**
1. State'e apiContentType ekle
2. Method butonlarına PATCH ekle
3. Content-Type dropdown ekle (POST/PUT/PATCH için)
4. handleSave'e apiContentType ekle

---

#### TODO 8: ConfigRestApi - Auth Tab
**Agent:** `react-expert`
**Dosyalar:**
- `/frontend/src/features/builder/components/ConfigRestApi.tsx`

**Görevler:**
1. TabType'a 'auth' ekle
2. Auth state'leri ekle (authType, authToken, authUsername, authPassword, authKeyName, authKeyValue, authKeyLocation)
3. Tabs array'ine Auth tab ekle
4. Auth Tab UI implement et (No Auth, Bearer Token, Basic Auth, API Key seçenekleri)
5. handleSave'e auth alanları ekle

---

#### TODO 9: ConfigRestApi - Query Params Tab
**Agent:** `react-expert`
**Dosyalar:**
- `/frontend/src/features/builder/components/ConfigRestApi.tsx`

**Görevler:**
1. TabType'a 'params' ekle
2. queryParams state ekle
3. Helper fonksiyonlar ekle (addQueryParam, removeQueryParam, updateQueryParam)
4. Params Tab UI implement et
5. handleSave'e queryParams ekle

---

#### TODO 10: ConfigRestApi - handleTest Güncelle
**Agent:** `react-expert`
**Dosyalar:**
- `/frontend/src/features/builder/components/ConfigRestApi.tsx`

**Görevler:**
1. Test request'ine contentType ekle
2. Auth header'larını test request'ine ekle
3. Query params'ı test request'ine ekle
4. Test sonuçlarında status badge, response time, headers göster

---

#### TODO 11: Monaco Editor Entegrasyonu
**Agent:** `react-expert`
**Dosyalar:**
- `/frontend/src/features/builder/components/ConfigRestApi.tsx`
- `/frontend/package.json` (eğer monaco-editor yoksa)

**Görevler:**
1. Monaco Editor import et (mevcut JSONEditor pattern'ini kontrol et)
2. Body textarea'yı Monaco Editor ile değiştir (JSON content-type için)
3. Format ve Validate butonları ekle

---

#### TODO 12: RestApiNode Görsel Güncelle
**Agent:** `react-expert`
**Dosyalar:**
- `/frontend/src/features/nodes/RestApiNode/RestApiNode.tsx`

**Görevler:**
1. methodColors'a PATCH rengi ekle (yellow-400)

---

### PHASE 4: Build & Test

#### TODO 13: Backend Build
**Agent:** manuel
**Komutlar:**
```bash
cd /home/ali/whatsapp-builder/backend && npm run build
```

---

#### TODO 14: Frontend Build
**Agent:** manuel
**Komutlar:**
```bash
cd /home/ali/whatsapp-builder/frontend && npm run build
```

---

### PHASE 5: Docker Deployment

#### TODO 15: Docker Build & Deploy
**Agent:** manuel
**Komutlar:**
```bash
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml up -d backend
docker logs whatsapp-backend --tail 30
```

---

### PHASE 6: Documentation

#### TODO 16: Reference Dokümantasyonu
**Agent:** `project-architect`
**Dosyalar:**
- `.claude/skills/project-architect/reference/08-rest-api-postman-features.md`

**Görevler:**
1. Yeni özelliklerin dokümantasyonunu yaz
2. Kullanım örnekleri ekle

---

## Agent Kullanım Özeti

| Agent | TODO'lar |
|-------|----------|
| `nestjs-expert` | 1, 2, 3, 4, 5 |
| `react-expert` | 6, 7, 8, 9, 10, 11, 12 |
| `project-architect` | 16 |
| manuel | 13, 14, 15 |

---

## Paralel Çalıştırma Grupları

```
Grup 1 (Backend - Paralel):
  TODO 1, 2, 5 → nestjs-expert (DTO'lar)

Grup 2 (Backend - Sıralı):
  TODO 3, 4 → nestjs-expert (Service'ler, TODO 1-2-5 sonrası)

Grup 3 (Frontend Types - Paralel ile Grup 1):
  TODO 6 → react-expert

Grup 4 (Frontend UI - Sıralı):
  TODO 7 → react-expert (PATCH + Content-Type)
  TODO 8 → react-expert (Auth Tab)
  TODO 9 → react-expert (Params Tab)
  TODO 10 → react-expert (Test güncelleme)
  TODO 11 → react-expert (Monaco Editor)
  TODO 12 → react-expert (Node görsel)

Grup 5 (Build - Paralel):
  TODO 13, 14 → manuel

Grup 6 (Deploy):
  TODO 15 → manuel

Grup 7 (Docs):
  TODO 16 → project-architect
```

---

## Kritik Dosyalar

1. **Frontend Ana Bileşen:**
   - `/frontend/src/features/builder/components/ConfigRestApi.tsx`

2. **Backend Service:**
   - `/backend/src/modules/chatbots/services/rest-api-executor.service.ts`
   - `/backend/src/modules/chatbots/services/chatbot-execution.service.ts`

3. **DTO'lar:**
   - `/backend/src/modules/chatbots/dto/test-rest-api.dto.ts`
   - `/backend/src/modules/chatbots/dto/node-data.dto.ts`

4. **Types:**
   - `/frontend/src/shared/types/index.ts`

5. **Node Görsel:**
   - `/frontend/src/features/nodes/RestApiNode/RestApiNode.tsx`
