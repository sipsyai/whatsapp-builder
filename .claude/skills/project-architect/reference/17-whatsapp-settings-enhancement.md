# WhatsApp Settings Enhancement Feature

## Overview

This feature enhances the WhatsApp configuration page by adding advanced settings for webhook endpoints, backend URLs, API version selection, and App Secret management. It provides a comprehensive UI to manage all WhatsApp-related configurations from a single interface.

**Implementation Date**: November 27, 2025
**Status**: Production Ready
**Live URL**: https://whatsapp.sipsy.ai/settings/whatsapp-config

---

## What Was Added

### 1. New Configuration Fields

**Entity Extensions** (`backend/src/entities/whatsapp-config.entity.ts`):
```typescript
@Column({ type: 'varchar', length: 255, nullable: true })
backendUrl: string;

@Column({ type: 'varchar', length: 255, nullable: true })
flowEndpointUrl: string;

@Column({ type: 'varchar', length: 50, default: 'v24.0' })
apiVersion: string;
```

**Purpose**:
- `backendUrl`: Base URL for the backend server (e.g., https://whatsapp.sipsy.ai)
- `flowEndpointUrl`: Full URL for WhatsApp Flows endpoint (e.g., https://whatsapp.sipsy.ai/api/flow-endpoint)
- `apiVersion`: WhatsApp API version selector (v18.0 - v24.0)

### 2. Enhanced UI Design

**Three-Section Layout**:

#### Section 1: API Credentials
- WhatsApp Access Token (masked input)
- Phone Number ID
- WhatsApp Business Account ID (WABA ID)
- **NEW**: App Secret (masked input for signature verification)

#### Section 2: Webhook Configuration
- **DISPLAY ONLY**: Webhook URL (auto-generated, read-only)
- **NEW**: Backend URL (editable)
- Webhook Verify Token (masked input)

#### Section 3: Advanced Settings
- **NEW**: Flow Endpoint URL (editable)
- **NEW**: API Version (dropdown selector: v18.0, v19.0, v20.0, v21.0, v22.0, v23.0, v24.0)

**UI Improvements**:
- Fixed scroll issue (added `overflow-y-auto` to form container)
- Organized sections with clear visual separation
- Masked sensitive fields with `type="password"`
- Read-only webhook URL display with copy functionality

### 3. Backend Enhancements

**DTO Updates** (`backend/src/modules/whatsapp/dto/requests/whatsapp-config.dto.ts`):

**CreateWhatsAppConfigDto**:
```typescript
@IsOptional()
@IsUrl()
backendUrl?: string;

@IsOptional()
@IsUrl()
flowEndpointUrl?: string;

@IsOptional()
@IsString()
apiVersion?: string;
```

**WhatsAppConfigResponseDto**:
```typescript
backendUrl: string;
flowEndpointUrl: string;
apiVersion: string;
```

**WebhookUrlResponseDto**:
```typescript
webhookUrl: string;
flowEndpointUrl: string;
```

**Service Updates** (`backend/src/modules/whatsapp/services/whatsapp-config.service.ts`):

**saveConfig()**: Now saves all new fields
**mapToResponseDto()**: Returns complete configuration
**getWebhookUrl()**: Returns both webhook URL and flow endpoint URL

### 4. Database Migration

**Migration**: `backend/src/migrations/1732700000000-AddConfigUrlsToWhatsAppConfig.ts`

**Changes**:
```sql
ALTER TABLE whatsapp_config
  ADD COLUMN backend_url VARCHAR(255),
  ADD COLUMN flow_endpoint_url VARCHAR(255),
  ADD COLUMN api_version VARCHAR(50) DEFAULT 'v24.0';
```

**Features**:
- Nullable columns for backward compatibility
- Default value for `api_version`
- Reversible migration (up/down methods)

---

## Technical Architecture

### Data Flow

**1. Frontend → Backend (Save Configuration)**:
```
User fills form
  ↓
Frontend validates fields
  ↓
POST /api/whatsapp/config
  ↓
WhatsAppController.saveConfig()
  ↓
WhatsAppConfigService.saveConfig()
  ↓
Entity saved to database
  ↓
Response with complete config
```

**2. Backend → Frontend (Load Configuration)**:
```
GET /api/whatsapp/config
  ↓
WhatsAppController.getConfig()
  ↓
WhatsAppConfigService.getConfig()
  ↓
mapToResponseDto()
  ↓
Frontend displays in form
```

**3. Webhook URL Generation**:
```
GET /api/whatsapp/webhook-url
  ↓
WhatsAppController.getWebhookUrl()
  ↓
WhatsAppConfigService.getWebhookUrl()
  ↓
Returns: {
  webhookUrl: backendUrl + '/api/webhooks/whatsapp',
  flowEndpointUrl: flowEndpointUrl || backendUrl + '/api/flow-endpoint'
}
```

### File Locations

**Backend**:
- Entity: `backend/src/entities/whatsapp-config.entity.ts`
- DTOs: `backend/src/modules/whatsapp/dto/requests/whatsapp-config.dto.ts`
- Service: `backend/src/modules/whatsapp/services/whatsapp-config.service.ts`
- Controller: `backend/src/modules/whatsapp/whatsapp.controller.ts`
- Migration: `backend/src/migrations/1732700000000-AddConfigUrlsToWhatsAppConfig.ts`

**Frontend**:
- Component: `frontend/src/features/settings/WhatsappConfigPage.tsx`
- API Types: `frontend/src/features/settings/api.ts`
- Service: `frontend/src/features/settings/service.ts`

---

## Use Cases

### Use Case 1: Initial Setup

**User Story**: As a new user, I want to configure my WhatsApp integration in one place.

**Steps**:
1. Navigate to Settings → WhatsApp Configuration
2. Fill in API credentials from Meta Developer Portal
3. Provide backend URL (e.g., https://whatsapp.sipsy.ai)
4. Set webhook verify token
5. Select API version (default: v24.0)
6. Click Save

**Result**: All WhatsApp endpoints are configured and ready to use.

### Use Case 2: Update Backend URL

**User Story**: As a developer, I want to change my production domain without code changes.

**Steps**:
1. Open WhatsApp Configuration page
2. Update "Backend URL" field
3. System auto-generates new webhook URL
4. Click Save
5. Copy new webhook URL to Meta Dashboard

**Result**: Webhooks now point to the new domain.

### Use Case 3: Upgrade API Version

**User Story**: As a system admin, I want to test a newer WhatsApp API version.

**Steps**:
1. Open WhatsApp Configuration page
2. Change API Version dropdown (e.g., v23.0 → v24.0)
3. Click Save
4. Test API calls

**Result**: All WhatsApp API requests use the new version.

### Use Case 4: Configure Flow Endpoints

**User Story**: As a chatbot designer, I want to use WhatsApp Flows with custom endpoints.

**Steps**:
1. Open WhatsApp Configuration page
2. Set "Flow Endpoint URL" (e.g., https://whatsapp.sipsy.ai/api/flow-endpoint)
3. Click Save
4. Copy URL to WhatsApp Flow configuration in Meta

**Result**: WhatsApp Flows can communicate with the backend.

---

## API Reference

### Save Configuration

```http
POST /api/whatsapp/config
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "accessToken": "your_whatsapp_access_token",
  "phoneNumberId": "123456789",
  "businessAccountId": "987654321",
  "appSecret": "your_app_secret",
  "verifyToken": "your_verify_token",
  "backendUrl": "https://whatsapp.sipsy.ai",
  "flowEndpointUrl": "https://whatsapp.sipsy.ai/api/flow-endpoint",
  "apiVersion": "v24.0"
}

Response 200:
{
  "id": "uuid",
  "accessToken": "your_whatsapp_access_token",
  "phoneNumberId": "123456789",
  "businessAccountId": "987654321",
  "appSecret": "your_app_secret",
  "verifyToken": "your_verify_token",
  "backendUrl": "https://whatsapp.sipsy.ai",
  "flowEndpointUrl": "https://whatsapp.sipsy.ai/api/flow-endpoint",
  "apiVersion": "v24.0",
  "createdAt": "2025-11-27T10:00:00.000Z",
  "updatedAt": "2025-11-27T10:00:00.000Z"
}
```

### Get Configuration

```http
GET /api/whatsapp/config
Authorization: Bearer {jwt_token}

Response 200:
{
  "id": "uuid",
  "accessToken": "your_whatsapp_access_token",
  "phoneNumberId": "123456789",
  "businessAccountId": "987654321",
  "appSecret": "your_app_secret",
  "verifyToken": "your_verify_token",
  "backendUrl": "https://whatsapp.sipsy.ai",
  "flowEndpointUrl": "https://whatsapp.sipsy.ai/api/flow-endpoint",
  "apiVersion": "v24.0",
  "createdAt": "2025-11-27T10:00:00.000Z",
  "updatedAt": "2025-11-27T10:00:00.000Z"
}

Response 404:
{
  "statusCode": 404,
  "message": "WhatsApp configuration not found"
}
```

### Get Webhook URL

```http
GET /api/whatsapp/webhook-url
Authorization: Bearer {jwt_token}

Response 200:
{
  "webhookUrl": "https://whatsapp.sipsy.ai/api/webhooks/whatsapp",
  "flowEndpointUrl": "https://whatsapp.sipsy.ai/api/flow-endpoint"
}
```

---

## Configuration Best Practices

### 1. Backend URL Configuration

**Development**:
```
backendUrl: https://your-ngrok-id.ngrok-free.dev
```

**Production**:
```
backendUrl: https://whatsapp.sipsy.ai
```

**Considerations**:
- Use HTTPS for production
- Ensure URL is accessible from WhatsApp servers
- No trailing slash

### 2. Flow Endpoint URL

**Default (Auto-generated)**:
- If not provided, defaults to `{backendUrl}/api/flow-endpoint`

**Custom Endpoint**:
- Useful for separate Flow handling server
- Must be publicly accessible
- Must handle WhatsApp Flow decryption

### 3. API Version Selection

**Supported Versions**:
- v18.0 (Deprecated soon)
- v19.0
- v20.0
- v21.0
- v22.0
- v23.0
- v24.0 (Recommended, Default)

**Upgrade Strategy**:
1. Test in development with new version
2. Monitor Meta's changelog for breaking changes
3. Update in production during low-traffic hours
4. Rollback if issues occur

### 4. App Secret Security

**Purpose**: Used for webhook signature verification (HMAC-SHA256)

**Security**:
- Store securely (never commit to Git)
- Use environment variables in production
- Rotate periodically (quarterly recommended)

**Verification Flow**:
```
WhatsApp sends webhook
  ↓
x-hub-signature-256 header
  ↓
Backend verifies with App Secret
  ↓
If valid: Process webhook
If invalid: Reject (401)
```

---

## Integration with Other Features

### Webhook Processing

**File**: `backend/src/modules/webhooks/services/webhook-signature.service.ts`

Uses `appSecret` from WhatsApp Config to verify signatures:
```typescript
const signature = crypto
  .createHmac('sha256', appSecret)
  .update(rawBody)
  .digest('hex');

if (signature !== receivedSignature) {
  throw new UnauthorizedException('Invalid signature');
}
```

### WhatsApp API Client

**File**: `backend/src/modules/whatsapp/services/whatsapp-api.client.ts`

Uses `apiVersion` from config:
```typescript
const baseUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}`;
```

### Flow Endpoint

**File**: `backend/src/modules/whatsapp/controllers/flow-endpoint.controller.ts`

Endpoint configured in Meta Dashboard must match `flowEndpointUrl`:
```
POST {flowEndpointUrl}
x-hub-signature-256: {signature}
```

---

## Testing

### Manual Testing Checklist

1. **Save New Configuration**:
   - [ ] Fill all required fields
   - [ ] Click Save
   - [ ] Verify success message
   - [ ] Refresh page, check values persist

2. **Update Existing Configuration**:
   - [ ] Change backend URL
   - [ ] Save
   - [ ] Verify webhook URL updates

3. **API Version Change**:
   - [ ] Change version dropdown
   - [ ] Save
   - [ ] Test WhatsApp API call

4. **Webhook URL Display**:
   - [ ] Copy webhook URL
   - [ ] Verify format: {backendUrl}/api/webhooks/whatsapp

5. **Validation**:
   - [ ] Try saving with invalid URL
   - [ ] Try saving with empty required fields
   - [ ] Verify error messages

### API Testing with cURL

```bash
# Get current config
curl -X GET http://localhost:3000/api/whatsapp/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Save config
curl -X POST http://localhost:3000/api/whatsapp/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "accessToken": "test_token",
    "phoneNumberId": "123456",
    "businessAccountId": "654321",
    "appSecret": "test_secret",
    "verifyToken": "test_verify",
    "backendUrl": "https://test.example.com",
    "apiVersion": "v24.0"
  }'

# Get webhook URL
curl -X GET http://localhost:3000/api/whatsapp/webhook-url \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Migration Guide

### Upgrading from Old Version

**Before Migration**:
```sql
SELECT * FROM whatsapp_config;
-- No backend_url, flow_endpoint_url, api_version columns
```

**Run Migration**:
```bash
docker compose exec backend npm run migration:run
```

**After Migration**:
```sql
SELECT * FROM whatsapp_config;
-- New columns added with NULL/default values
```

**Update Configuration**:
1. Open WhatsApp Configuration page
2. Fill in new fields
3. Save

**Rollback (if needed)**:
```bash
docker compose exec backend npm run migration:revert
```

---

## Production Deployment

### Environment Variables

No additional environment variables required. All settings are stored in the database and managed via UI.

**Optional Override** (for initial setup):
```bash
# .env file
WHATSAPP_BACKEND_URL=https://whatsapp.sipsy.ai
WHATSAPP_API_VERSION=v24.0
```

### Meta Dashboard Configuration

**Webhook Setup**:
1. Go to Meta Developer Dashboard
2. WhatsApp → Configuration → Webhooks
3. Set Callback URL: (from UI "Webhook URL" field)
4. Set Verify Token: (from UI "Webhook Verify Token" field)
5. Subscribe to: `messages`, `message_status`

**Flow Configuration** (if using WhatsApp Flows):
1. WhatsApp → Flows → Your Flow
2. Set Endpoint URL: (from UI "Flow Endpoint URL" field)
3. Configure encryption settings

---

## Troubleshooting

### Issue 1: Webhook URL Not Updating

**Symptoms**: After changing backend URL, webhook URL still shows old value

**Solution**:
```bash
# Restart backend
docker compose restart backend

# Clear browser cache
# Hard reload page (Ctrl+Shift+R)
```

### Issue 2: Webhook Signature Verification Failing

**Symptoms**: All incoming webhooks return 401 Unauthorized

**Solution**:
```bash
# Verify App Secret matches Meta Dashboard
# Meta Developer Dashboard → Settings → Basic → App Secret

# Update in UI
# Settings → WhatsApp Configuration → App Secret
```

### Issue 3: API Version Mismatch

**Symptoms**: WhatsApp API returns errors after version change

**Solution**:
```bash
# Check Meta's API compatibility
# https://developers.facebook.com/docs/whatsapp/changelog

# Rollback to stable version
# Settings → WhatsApp Configuration → API Version → v23.0
```

### Issue 4: Flow Endpoint 404

**Symptoms**: WhatsApp Flows not working, backend returns 404

**Solution**:
```bash
# Verify endpoint is registered
# backend/src/modules/whatsapp/whatsapp.module.ts
# Should have FlowEndpointController

# Verify URL in Meta Dashboard
# Should match: {flowEndpointUrl}

# Test endpoint manually
curl -X POST https://whatsapp.sipsy.ai/api/flow-endpoint \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

---

## Related Features

- **[06-whatsapp-integration.md](./06-whatsapp-integration.md)** - WhatsApp API integration overview
- **[15-authentication-security.md](./15-authentication-security.md)** - JWT authentication for settings page
- **[10-deployment-architecture.md](./10-deployment-architecture.md)** - Production deployment with Docker

---

## Future Enhancements

### Planned Features
1. **Multiple Configuration Profiles**: Support dev/staging/production configs
2. **Webhook Test Button**: Test webhook connectivity from UI
3. **API Version Auto-Upgrade**: Suggest/auto-upgrade to latest stable version
4. **Configuration Backup/Restore**: Export/import configurations
5. **Health Dashboard**: Show WhatsApp API status, webhook delivery rate

### Technical Debt
- [ ] Add unit tests for WhatsAppConfigService
- [ ] Add E2E tests for settings page
- [ ] Add validation for URL reachability
- [ ] Add webhook signature test endpoint
- [ ] Add API version compatibility checker

---

**Last Updated**: November 27, 2025
**Version**: 1.0
**Status**: Production Ready
**Contributors**: Project Architect
