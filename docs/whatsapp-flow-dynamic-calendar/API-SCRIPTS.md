# API Scripts Dokümantasyonu

Bu dokümantasyon, WhatsApp Flow API ile etkileşim için kullanılan script'leri açıklar.

---

## 📋 İçindekiler

1. [create-dynamic-flow.js](#create-dynamic-flowjs)
2. [update-dynamic-flow.js](#update-dynamic-flowjs)
3. [test-send-message.js](#test-send-messagejs)
4. [WhatsApp API Reference](#whatsapp-api-reference)

---

## 1. create-dynamic-flow.js

Yeni bir Flow oluşturur ve WhatsApp Business API'ye yükler.

### Kullanım

```bash
cd server
node create-dynamic-flow.js
```

### Kod Açıklaması

```javascript
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BASE_URL = 'https://graph.facebook.com/v24.0';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WABA_ID = process.env.WABA_ID;
const APP_ID = process.env.APP_ID;

async function createDynamicFlow() {
  try {
    console.log('🚀 Creating Dynamic WhatsApp Flow with Endpoint...\n');

    // 1. Flow JSON dosyasını oku
    const flowJsonPath = path.join(__dirname, 'src', 'flows', 'salon-dynamic-flow.json');
    const flowJson = fs.readFileSync(flowJsonPath, 'utf-8');

    // 2. Flow oluştur
    console.log('📤 Creating Dynamic Flow...');
    const createResponse = await axios.post(
      `${BASE_URL}/${WABA_ID}/flows`,
      {
        name: 'Kuaför Randevu Sistemi (Dinamik)',
        categories: ['APPOINTMENT_BOOKING'],
        flow_json: flowJson,
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const flowId = createResponse.data.id;
    console.log(`✅ Flow created! ID: ${flowId}\n`);

    // 3. Validation kontrolü
    if (createResponse.data.validation_errors?.length > 0) {
      console.warn('⚠️  Validation warnings:');
      console.log(JSON.stringify(createResponse.data.validation_errors, null, 2));
      console.log('');
    }

    // 4. Meta App bağla
    if (APP_ID) {
      console.log('🔧 Connecting Meta App...');
      await axios.post(
        `${BASE_URL}/${flowId}`,
        {
          application_id: APP_ID,
        },
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      );
      console.log('✅ Meta App connected\n');
    }

    // 5. Flow detaylarını al
    const detailsResponse = await axios.get(
      `${BASE_URL}/${flowId}?fields=id,name,status,preview`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      },
    );

    // 6. Sonuçları göster
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ Dynamic Flow Created Successfully!');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('📋 Flow Details:');
    console.log(`   Flow ID: ${flowId}`);
    console.log(`   Name: ${detailsResponse.data.name}`);
    console.log(`   Status: ${detailsResponse.data.status}\n`);

    if (detailsResponse.data.preview?.preview_url) {
      console.log('🔗 Preview URL:');
      console.log(`   ${detailsResponse.data.preview.preview_url}\n`);
    }

    // 7. Flow ID'yi kaydet
    fs.writeFileSync(path.join(__dirname, '.dynamic-flow-id'), flowId);
    console.log('💾 Flow ID saved to .dynamic-flow-id\n');

    // 8. .env dosyasını güncelle
    console.log('🔄 Updating .env file...');
    let envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');

    if (envContent.includes('EXISTING_FLOW_ID=')) {
      envContent = envContent.replace(
        /EXISTING_FLOW_ID=.*/,
        `EXISTING_FLOW_ID=${flowId}`
      );
    }

    fs.writeFileSync(path.join(__dirname, '.env'), envContent);
    console.log('✅ .env updated with new Flow ID\n');

    // 9. Endpoint yapılandırma talimatları
    console.log('⚠️  IMPORTANT - Endpoint Configuration:');
    console.log('   This is a dynamic Flow that requires an endpoint.');
    console.log('   You need to:');
    console.log('   1. Set up a public endpoint (ngrok or deploy)');
    console.log('   2. Configure endpoint in WhatsApp Business Manager:');
    console.log(`      - Flow ID: ${flowId}`);
    console.log('      - Endpoint URL: https://your-domain.com/flow-webhook');
    console.log('      - Add the public key from server logs\n');

    return flowId;
  } catch (error) {
    console.error('\n❌ Error creating flow:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

createDynamicFlow();
```

### API Endpoints

#### Create Flow
```http
POST https://graph.facebook.com/v24.0/{WABA_ID}/flows
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json

{
  "name": "Flow Name",
  "categories": ["APPOINTMENT_BOOKING"],
  "flow_json": "..."
}
```

**Response**:
```json
{
  "id": "1546903456243545",
  "validation_errors": []
}
```

#### Connect App
```http
POST https://graph.facebook.com/v24.0/{FLOW_ID}
Authorization: Bearer {ACCESS_TOKEN}

{
  "application_id": "YOUR_APP_ID"
}
```

#### Get Flow Details
```http
GET https://graph.facebook.com/v24.0/{FLOW_ID}?fields=id,name,status,preview
Authorization: Bearer {ACCESS_TOKEN}
```

**Response**:
```json
{
  "id": "1546903456243545",
  "name": "Kuaför Randevu Sistemi",
  "status": "DRAFT",
  "preview": {
    "preview_url": "https://business.facebook.com/wa/manage/flows/..."
  }
}
```

---

## 2. update-dynamic-flow.js

Mevcut bir Flow'un JSON içeriğini günceller.

### Kullanım

```bash
cd server
node update-dynamic-flow.js
```

### Kod Açıklaması

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BASE_URL = 'https://graph.facebook.com/v24.0';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const FLOW_ID = '1546903456243545'; // Dynamic Flow ID

async function updateDynamicFlow() {
  try {
    console.log('🔄 Updating Dynamic WhatsApp Flow...\n');
    console.log(`Flow ID: ${FLOW_ID}\n`);

    // 1. Flow JSON dosyasını oku
    const flowJsonPath = path.join(__dirname, 'src', 'flows', 'salon-dynamic-flow.json');
    const flowJson = fs.readFileSync(flowJsonPath);

    // 2. FormData oluştur
    const formData = new FormData();
    formData.append('name', 'flow.json');
    formData.append('asset_type', 'FLOW_JSON');
    formData.append('file', flowJson, {
      filename: 'flow.json',
      contentType: 'application/json',
    });

    // 3. Flow JSON'u yükle
    console.log('📤 Uploading corrected Flow JSON...');
    const response = await axios.post(
      `${BASE_URL}/${FLOW_ID}/assets`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      },
    );

    console.log('✅ Flow JSON updated successfully!\n');

    // 4. Validation kontrolü
    if (response.data.validation_errors && response.data.validation_errors.length > 0) {
      console.warn('⚠️  Validation warnings:');
      console.log(JSON.stringify(response.data.validation_errors, null, 2));
      console.log('');
    } else {
      console.log('✅ No validation errors!\n');
    }

    // 5. Flow detaylarını al
    console.log('🔍 Getting Flow details...');
    const detailsResponse = await axios.get(
      `${BASE_URL}/${FLOW_ID}?fields=id,name,status,preview`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      },
    );

    // 6. Sonuçları göster
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ Dynamic Flow Updated Successfully!');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('📋 Flow Details:');
    console.log(`   Flow ID: ${detailsResponse.data.id}`);
    console.log(`   Name: ${detailsResponse.data.name}`);
    console.log(`   Status: ${detailsResponse.data.status}\n`);

    return response.data;
  } catch (error) {
    console.error('\n❌ Error updating flow:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

updateDynamicFlow();
```

### API Endpoint

#### Update Flow JSON
```http
POST https://graph.facebook.com/v24.0/{FLOW_ID}/assets
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="name"

flow.json
--boundary
Content-Disposition: form-data; name="asset_type"

FLOW_JSON
--boundary
Content-Disposition: form-data; name="file"; filename="flow.json"
Content-Type: application/json

{...flow json...}
--boundary--
```

**Response**:
```json
{
  "success": true,
  "validation_errors": []
}
```

### Not

- **PUBLISHED** Flow'lar güncellenemez
- Güncelleme için Flow **DRAFT** modda olmalı
- Validation hatası olursa update başarılı olur ama uyarı verir

---

## 3. test-send-message.js

Test kullanıcısına Flow mesajı gönderir.

### Kullanım

```bash
cd server
node test-send-message.js
```

### Kod Açıklaması

```javascript
const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'https://graph.facebook.com/v24.0';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const FLOW_ID = process.env.EXISTING_FLOW_ID || '1546903456243545';

// Test phone number
const RECIPIENT = '905079720490';

async function sendTestMessage() {
  try {
    console.log('📨 Sending WhatsApp Flow Test Message...\n');
    console.log(`📱 To: +${RECIPIENT}`);
    console.log(`🔄 Flow ID: ${FLOW_ID}\n`);

    const response = await axios.post(
      `${BASE_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: RECIPIENT,
        type: 'interactive',
        interactive: {
          type: 'flow',
          header: {
            type: 'text',
            text: 'Kuaför Randevusu 💇‍♀️',
          },
          body: {
            text: 'Merhaba! Randevu oluşturmak için aşağıdaki butona tıklayın.',
          },
          footer: {
            text: 'Sipsy - WhatsApp Flows',
          },
          action: {
            name: 'flow',
            parameters: {
              flow_message_version: '3',
              mode: 'draft',  // DRAFT mode'da test et
              flow_token: 'TEST_TOKEN_' + Date.now(),
              flow_id: FLOW_ID,
              flow_cta: 'Randevu Al',
              flow_action: 'navigate',
              flow_action_payload: {
                screen: 'MAIN_MENU',
              },
            },
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    );

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ Test Mesajı Başarıyla Gönderildi!');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('📋 Mesaj Detayları:');
    console.log(`   Message ID: ${response.data.messages?.[0]?.id}`);
    console.log(`   Alıcı: +${RECIPIENT}`);
    console.log(`   Flow ID: ${FLOW_ID}\n`);

    console.log('📱 Şimdi WhatsApp\'ınızı kontrol edin!');
    console.log('   "Randevu Al" butonuna tıklayın.\n');

    return response.data;
  } catch (error) {
    console.error('\n❌ Hata oluştu:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

sendTestMessage();
```

### API Endpoint

#### Send Message
```http
POST https://graph.facebook.com/v24.0/{PHONE_NUMBER_ID}/messages
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "905079720490",
  "type": "interactive",
  "interactive": {
    "type": "flow",
    "header": {
      "type": "text",
      "text": "Kuaför Randevusu"
    },
    "body": {
      "text": "Randevu oluşturmak için tıklayın"
    },
    "footer": {
      "text": "Powered by WhatsApp"
    },
    "action": {
      "name": "flow",
      "parameters": {
        "flow_message_version": "3",
        "mode": "draft",
        "flow_token": "UNIQUE_TOKEN",
        "flow_id": "FLOW_ID",
        "flow_cta": "Randevu Al",
        "flow_action": "navigate",
        "flow_action_payload": {
          "screen": "MAIN_MENU"
        }
      }
    }
  }
}
```

**Response**:
```json
{
  "messaging_product": "whatsapp",
  "contacts": [
    {
      "input": "905079720490",
      "wa_id": "905079720490"
    }
  ],
  "messages": [
    {
      "id": "wamid.HBgMOTA1MDc5NzIwNDkwFQIAERgS..."
    }
  ]
}
```

### Parameters

#### mode
- `draft`: DRAFT Flow'u test et
- `published`: PUBLISHED Flow'u kullan (varsayılan)

#### flow_token
- Unique identifier
- Webhook'ta session tracking için kullanılır
- Örnek: `'TEST_TOKEN_' + Date.now()`

#### flow_action_payload
- İlk screen'e gönderilecek data
- Boş olabilir: `{}`
- Veya data içerebilir: `{screen: 'MAIN_MENU', data: {...}}`

---

## 4. WhatsApp API Reference

### Base URL

```
https://graph.facebook.com/v24.0
```

### Authentication

Tüm request'lerde Bearer token:

```
Authorization: Bearer {ACCESS_TOKEN}
```

### Common Endpoints

#### 1. List Flows

```http
GET /{WABA_ID}/flows
```

**Response**:
```json
{
  "data": [
    {
      "id": "1546903456243545",
      "name": "Kuaför Randevu Sistemi",
      "status": "DRAFT"
    }
  ]
}
```

#### 2. Get Flow

```http
GET /{FLOW_ID}?fields=id,name,status,categories,preview
```

#### 3. Delete Flow

```http
DELETE /{FLOW_ID}
```

#### 4. Publish Flow

```http
POST /{FLOW_ID}/publish
```

**Response**:
```json
{
  "success": true
}
```

**Not**: Endpoint yapılandırılmamış Flow'lar publish edilemez.

#### 5. Deprecate Flow

```http
POST /{FLOW_ID}/deprecate
```

Published Flow'u DEPRECATED durumuna getirir.

---

## 5. Error Handling

### Common Errors

#### Invalid Token
```json
{
  "error": {
    "message": "Invalid OAuth access token",
    "type": "OAuthException",
    "code": 190
  }
}
```

**Çözüm**: Access token'ı yenile

#### Flow Not Found
```json
{
  "error": {
    "message": "Flow not found",
    "type": "OAuthException",
    "code": 100
  }
}
```

**Çözüm**: Flow ID'yi kontrol et

#### Permission Error
```json
{
  "error": {
    "message": "Insufficient permissions",
    "type": "OAuthException",
    "code": 200
  }
}
```

**Çözüm**: Access token'ın doğru permission'ları olduğundan emin ol

#### Validation Errors

```json
{
  "id": "1546903456243545",
  "validation_errors": [
    {
      "error": "INVALID_PROPERTY_TYPE",
      "message": "Expected property 'enabled' to be of type 'boolean'",
      "path": "screens[1].layout.children[2].enabled"
    }
  ]
}
```

**Çözüm**: Flow JSON'u düzelt ve tekrar yükle

---

## 6. Best Practices

### 1. Environment Variables

Hassas bilgileri `.env` dosyasında sakla:

```env
WHATSAPP_ACCESS_TOKEN=your_token
PHONE_NUMBER_ID=your_phone_id
WABA_ID=your_waba_id
```

### 2. Error Handling

Her API call'u try-catch ile sarla:

```javascript
try {
  const response = await axios.post(...);
  // Handle success
} catch (error) {
  if (error.response) {
    // API error
    console.error('API Error:', error.response.data);
  } else {
    // Network error
    console.error('Network Error:', error.message);
  }
}
```

### 3. Logging

Debug için detaylı log:

```javascript
console.log('Request:', JSON.stringify(requestData, null, 2));
console.log('Response:', JSON.stringify(response.data, null, 2));
```

### 4. Rate Limiting

WhatsApp API rate limit'leri:
- 60 requests / minute
- 1000 requests / hour

Batch işlemler için rate limiting ekle:

```javascript
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

for (const item of items) {
  await processItem(item);
  await delay(1000); // 1 saniye bekle
}
```

---

## 📚 Referanslar

- [WhatsApp Business Platform API](https://developers.facebook.com/docs/whatsapp)
- [WhatsApp Flows API](https://developers.facebook.com/docs/whatsapp/flows)
- [Graph API Reference](https://developers.facebook.com/docs/graph-api)

---

**Hazırlayan**: Claude Code
**Tarih**: 23 Kasım 2025
