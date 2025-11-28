# WhatsApp Flow Playground Integration - Backend

## Overview

Bu döküman, WhatsApp Flow Playground'dan export edilen JSON'u backend'de nasıl işlediğimizi açıklar.

## Yeni Endpoint

### `POST /api/flows/from-playground`

Playground'dan export edilen JSON ile yeni bir WhatsApp Flow oluşturur.

**Request Body:**
```typescript
{
  playgroundJson: any;           // Required - Complete playground export JSON
  name?: string;                 // Optional - Flow adı (yoksa playground JSON'dan çıkarılır)
  description?: string;          // Optional - Flow açıklaması
  categories: WhatsAppFlowCategory[];  // Required - Flow kategorileri
  endpointUri?: string;          // Optional - Custom endpoint URI
  autoPublish?: boolean;         // Optional - Otomatik publish (default: false)
}
```

**Example Request:**
```json
{
  "playgroundJson": {
    "version": "5.0",
    "data_api_version": "3.0",
    "routing_model": {},
    "screens": [
      {
        "id": "WELCOME_SCREEN",
        "title": "Welcome",
        "terminal": true,
        "data": {},
        "layout": {
          "type": "SingleColumnLayout",
          "children": [
            {
              "type": "Text",
              "text": "Welcome to our flow!"
            }
          ]
        }
      }
    ]
  },
  "name": "My Custom Flow",
  "categories": ["OTHER"],
  "autoPublish": false
}
```

**Response:**
```json
{
  "id": "uuid",
  "whatsappFlowId": "123456789",
  "name": "My Custom Flow",
  "description": "Created from WhatsApp Flow Playground",
  "status": "DRAFT",
  "categories": ["OTHER"],
  "flowJson": { ... },
  "metadata": {
    "source": "playground",
    "created_from_playground": true,
    "playground_json_received": "2025-11-28T..."
  },
  "createdAt": "2025-11-28T...",
  "updatedAt": "2025-11-28T..."
}
```

## Backend İşlem Akışı

### 1. Validasyon
```typescript
validateAndNormalizePlaygroundJson(playgroundJson)
```

**Kontroller:**
- `version` alanının varlığı
- `screens` array'inin varlığı ve boş olmaması
- Minimum 1 screen olması gerekir

**Normalizasyon:**
- Required fields: `version`, `screens`
- Optional fields: `data_api_version`, `routing_model`
- Diğer bilinmeyen alanlar da korunur

### 2. Flow Adı Oluşturma
```typescript
generateFlowNameFromPlayground(flowJson)
```

**Strateji:**
1. DTO'da `name` varsa onu kullan
2. Yoksa ilk screen'in `title`'ını kullan
3. Yoksa ilk screen'in `id`'sini formatla (örn: "WELCOME_SCREEN" → "Welcome Screen")
4. Hiçbiri yoksa "Playground Flow" kullan

### 3. WhatsApp API'ye Gönderme
```typescript
whatsappFlowService.createFlow({
  name: flowName,
  categories: dto.categories,
  flowJson: normalizedJson,
  endpointUri: dto.endpointUri,
})
```

### 4. Database'e Kaydetme
```typescript
flowRepo.create({
  whatsappFlowId: whatsappResponse.id,
  name: flowName,
  description: dto.description || 'Created from WhatsApp Flow Playground',
  status: WhatsAppFlowStatus.DRAFT,
  categories: dto.categories,
  flowJson: normalizedJson,
  endpointUri: dto.endpointUri,
  isActive: true,
  metadata: {
    source: 'playground',
    created_from_playground: true,
    playground_json_received: new Date().toISOString(),
  },
})
```

### 5. Auto-Publish (Opsiyonel)
```typescript
if (dto.autoPublish) {
  return this.publish(flow.id);
}
```

## Mevcut Endpoint ile Farklar

### Mevcut `POST /api/flows`
- Flow JSON'u direkt alır
- Flow adı zorunludur
- Manuel validasyon gerektirir

### Yeni `POST /api/flows/from-playground`
- Playground export formatını kabul eder
- Flow adı otomatik oluşturulabilir
- Otomatik validasyon ve normalizasyon
- Metadata ile playground kaynağını işaretler
- Auto-publish seçeneği

## Playground JSON Format Beklentisi

WhatsApp Flow Playground'dan export edilen JSON şu yapıda olmalıdır:

```json
{
  "version": "5.0",                    // Required
  "data_api_version": "3.0",          // Optional
  "routing_model": {},                 // Optional
  "screens": [                         // Required - En az 1 screen
    {
      "id": "SCREEN_ID",
      "title": "Screen Title",
      "terminal": false,
      "data": {},
      "layout": {
        "type": "SingleColumnLayout",
        "children": [...]
      }
    }
  ]
}
```

## Hata Durumları

### 400 Bad Request - Invalid Playground JSON
```json
{
  "statusCode": 400,
  "message": "Invalid playground JSON format",
  "error": "Bad Request"
}
```

### 400 Bad Request - Missing Version
```json
{
  "statusCode": 400,
  "message": "Playground JSON missing required \"version\" field",
  "error": "Bad Request"
}
```

### 400 Bad Request - Missing Screens
```json
{
  "statusCode": 400,
  "message": "Playground JSON missing required \"screens\" array",
  "error": "Bad Request"
}
```

### 400 Bad Request - Empty Screens
```json
{
  "statusCode": 400,
  "message": "Playground JSON must contain at least one screen",
  "error": "Bad Request"
}
```

## Frontend Entegrasyon Önerisi

### React Component Example
```typescript
const createFlowFromPlayground = async (playgroundJson: any) => {
  try {
    const response = await fetch('/api/flows/from-playground', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playgroundJson,
        categories: ['OTHER'],
        autoPublish: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const flow = await response.json();
    console.log('Flow created:', flow);
    return flow;
  } catch (error) {
    console.error('Failed to create flow:', error);
    throw error;
  }
};
```

### File Upload Handler
```typescript
const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const playgroundJson = JSON.parse(text);

    const flow = await createFlowFromPlayground(playgroundJson);

    // Show success message
    toast.success(`Flow "${flow.name}" created successfully!`);

    // Navigate to flow detail page
    navigate(`/flows/${flow.id}`);
  } catch (error) {
    toast.error('Failed to create flow from playground JSON');
  }
};
```

### Drag & Drop Handler
```typescript
const handleDrop = async (event: React.DragEvent) => {
  event.preventDefault();

  const file = event.dataTransfer.files[0];
  if (!file || !file.name.endsWith('.json')) {
    toast.error('Please upload a JSON file');
    return;
  }

  try {
    const text = await file.text();
    const playgroundJson = JSON.parse(text);

    const flow = await createFlowFromPlayground(playgroundJson);
    toast.success(`Flow "${flow.name}" created!`);
  } catch (error) {
    toast.error('Invalid playground JSON file');
  }
};
```

## Test Scenarios

### 1. Valid Playground JSON
```bash
curl -X POST http://localhost:3000/api/flows/from-playground \
  -H "Content-Type: application/json" \
  -d '{
    "playgroundJson": {
      "version": "5.0",
      "screens": [
        {
          "id": "WELCOME",
          "title": "Welcome",
          "terminal": true,
          "data": {},
          "layout": { "type": "SingleColumnLayout", "children": [] }
        }
      ]
    },
    "categories": ["OTHER"]
  }'
```

### 2. With Custom Name
```bash
curl -X POST http://localhost:3000/api/flows/from-playground \
  -H "Content-Type: application/json" \
  -d '{
    "playgroundJson": { ... },
    "name": "My Custom Flow Name",
    "categories": ["LEAD_GENERATION"]
  }'
```

### 3. Auto-Publish
```bash
curl -X POST http://localhost:3000/api/flows/from-playground \
  -H "Content-Type: application/json" \
  -d '{
    "playgroundJson": { ... },
    "categories": ["OTHER"],
    "autoPublish": true
  }'
```

## Files Modified

1. **New Files:**
   - `/backend/src/modules/flows/dto/create-flow-from-playground.dto.ts`

2. **Modified Files:**
   - `/backend/src/modules/flows/flows.service.ts`
     - Added `createFromPlayground()` method
     - Added `validateAndNormalizePlaygroundJson()` private method
     - Added `generateFlowNameFromPlayground()` private method

   - `/backend/src/modules/flows/flows.controller.ts`
     - Added `POST /from-playground` endpoint

## Next Steps

Frontend'de yapılması gerekenler:
1. "Create with Playground" butonu ekleme
2. File upload input veya drag & drop area
3. JSON validasyonu (client-side)
4. Success/error handling
5. Flow list'e navigate etme

Backend'de ilave geliştirmeler:
1. Playground JSON schema validasyonu (örn: Joi, class-validator)
2. Flow JSON size limitleri
3. Rate limiting
4. Audit logging
5. Batch import (birden fazla flow)
