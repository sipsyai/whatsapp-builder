# WhatsApp Flows Troubleshooting Guide

Common issues, their causes, and solutions when working with WhatsApp Flows.

## Flow JSON Validation Errors

### INVALID_PROPERTY

**Error:** Unknown or invalid property in component or screen.

**Common Causes:**
- Typo in property name
- Property not supported in this component
- Property not available in current Flow JSON version

**Solutions:**
```json
// ❌ Wrong
{
  "type": "TextInput",
  "text": "Label"  // Should be "label"
}

// ✅ Correct
{
  "type": "TextInput",
  "label": "Label"
}
```

**How to fix:**
1. Check component documentation for valid properties
2. Verify property spelling
3. Confirm version compatibility
4. Read the complete Flow JSON documentation

### REQUIRED_PROPERTY_MISSING

**Error:** A required property is not set.

**Common Missing Properties:**
- Component `type` and `name`
- Screen `id` and `layout`
- Footer on terminal screens
- `data_api_version` when using endpoint

**Solutions:**
```json
// ❌ Missing required properties
{
  "type": "TextInput",
  "label": "Name"
  // Missing: "name" property
}

// ✅ Correct
{
  "type": "TextInput",
  "name": "user_name",
  "label": "Name"
}
```

### INVALID_ROUTING_MODEL

**Error:** Routing model validation failed.

**Common Causes:**
- Screen referenced doesn't exist
- Circular routing
- Missing routing definition
- No entry screen
- Routes don't end at terminal screen

**Solutions:**
```json
// ❌ Wrong - Screen doesn't exist
{
  "routing_model": {
    "SCREEN_A": ["SCREEN_B"],
    "SCREEN_B": ["SCREEN_C"]  // SCREEN_C doesn't exist
  }
}

// ✅ Correct
{
  "routing_model": {
    "SCREEN_A": ["SCREEN_B"],
    "SCREEN_B": []  // Terminal screen
  }
}
```

**Routing Rules:**
1. All screens must exist
2. Terminal screens should have empty array: `[]`
3. No circular references
4. Must have entry screen (no inbound edges)
5. All paths must end at terminal screen
6. Only specify forward routes

### INVALID_DATA_TYPE

**Error:** Property value type doesn't match expected type.

**Common Causes:**
- String instead of boolean
- Number instead of string
- Wrong array structure
- Missing __example__ in data model

**Solutions:**
```json
// ❌ Wrong types
{
  "type": "TextInput",
  "required": "true",  // Should be boolean
  "max-length": "100"  // Should be number
}

// ✅ Correct types
{
  "type": "TextInput",
  "required": true,
  "max-length": 100
}
```

### UNKNOWN_SCREEN

**Error:** Referenced screen doesn't exist.

**Common in:**
- Navigate actions
- Routing model
- refresh_on_back scenarios

**Solutions:**
```json
// ❌ Screen doesn't exist
{
  "on-click-action": {
    "name": "navigate",
    "next": {"type": "screen", "name": "NONEXISTENT"}
  }
}

// ✅ Screen exists
{
  "on-click-action": {
    "name": "navigate",
    "next": {"type": "screen", "name": "CONFIRMATION"}
  }
}
```

## Endpoint Errors

### ENCRYPTION_ERROR / DECRYPTION_FAILED

**Error:** Unable to decrypt request or encrypt response.

**Common Causes:**
- Wrong private key
- Incorrect encryption algorithm
- IV bit flipping error
- Missing authentication tag

**Solutions:**

**Check Algorithm:**
```javascript
// ✅ Correct decryption
const decipher = crypto.createDecipheriv(
  'aes-128-gcm',  // Must be AES-128-GCM
  decryptedAesKey,
  initialVectorBuffer
);
decipher.setAuthTag(encrypted_flow_data_tag);
```

**Check Key Decryption:**
```javascript
// ✅ Correct AES key decryption
const decryptedAesKey = crypto.privateDecrypt(
  {
    key: crypto.createPrivateKey(privatePem),
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: "sha256"
  },
  Buffer.from(encrypted_aes_key, "base64")
);
```

**Check Response Encryption:**
```javascript
// ✅ Correct IV flipping
const flipped_iv = [];
for (const pair of initialVectorBuffer.entries()) {
  flipped_iv.push(~pair[1]);  // Bitwise NOT
}
```

**Return HTTP 421 if decryption fails:**
```javascript
try {
  const decrypted = decryptRequest(body, privateKey);
} catch (error) {
  return res.status(421).send("Decryption failed");
}
```

### SIGNATURE_VERIFICATION_FAILED

**Error:** X-Hub-Signature-256 validation failed.

**Common Causes:**
- Wrong app secret
- Signature not validated correctly
- Header parsing error

**Solutions:**
```javascript
// ✅ Correct signature validation
const crypto = require('crypto');

function validateSignature(req, appSecret) {
  const signature = req.headers['x-hub-signature-256'];

  if (!signature) {
    return false;
  }

  const signatureHash = signature.split('sha256=')[1];
  const expectedHash = crypto
    .createHmac('sha256', appSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  return signatureHash === expectedHash;
}

// Use in endpoint
app.post('/endpoint', (req, res) => {
  if (!validateSignature(req, APP_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  // Continue processing...
});
```

**Return HTTP 432 for signature errors:**
```javascript
if (!validateSignature(req)) {
  return res.status(432).send("Invalid signature");
}
```

### ENDPOINT_TIMEOUT

**Error:** Endpoint didn't respond within 10 seconds.

**Common Causes:**
- Slow database queries
- External API calls
- Heavy computation
- Network latency

**Solutions:**

**1. Optimize database queries:**
```javascript
// ❌ Slow - Multiple queries
const user = await db.users.findOne({id: userId});
const orders = await db.orders.findMany({userId});
const products = await db.products.findMany({ids: orderIds});

// ✅ Fast - Single query with joins
const userData = await db.users.findOne({
  id: userId,
  include: {
    orders: {
      include: {
        products: true
      }
    }
  }
});
```

**2. Cache frequently accessed data:**
```javascript
const cache = new Map();

async function getAvailableSlots(serviceId) {
  const cacheKey = `slots_${serviceId}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const slots = await db.getSlots(serviceId);
  cache.set(cacheKey, slots, 300); // 5 min TTL
  return slots;
}
```

**3. Use async operations:**
```javascript
// ✅ Run operations in parallel
const [services, availability, pricing] = await Promise.all([
  getServices(),
  getAvailability(),
  getPricing()
]);
```

**4. Set timeout on external calls:**
```javascript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 8000);

try {
  const response = await fetch(apiUrl, {
    signal: controller.signal
  });
} catch (error) {
  // Handle timeout
  return fallbackData;
} finally {
  clearTimeout(timeout);
}
```

### PUBLIC_KEY_MISSING / PUBLIC_KEY_SIGNATURE_VERIFICATION

**Error:** Public key issues.

**When to Re-upload:**
- After registering number
- After migration (On-Prem ↔ Cloud)
- When receiving these error webhooks

**Solutions:**
```bash
# Generate new key pair
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Upload via Cloud API
curl -X POST "https://graph.facebook.com/v18.0/{WABA-ID}/whatsapp_business_encryption" \
  -H "Authorization: Bearer {ACCESS-TOKEN}" \
  -F "business_public_key=@public.pem"
```

## Runtime Errors

### INVALID_FLOW_TOKEN

**Error:** Flow token is invalid, expired, or missing.

**Common Causes:**
- Token expired
- Token not generated securely
- Token validation failed on server

**Solutions:**

**1. Use longer expiration (2-3 days):**
```javascript
const flowToken = jwt.sign(
  { userId: user.id, sessionId: session.id },
  JWT_SECRET,
  { expiresIn: '3d' }  // 3 days
);
```

**2. Implement re-authentication:**
```json
{
  "screen": "ERROR_SCREEN",
  "data": {
    "error_message": "Your session has expired. Please request a new link to continue."
  }
}
```

**3. Validate flow_token_signature (v4.0+):**
```javascript
const jwt = require('jsonwebtoken');

function validateFlowToken(flowToken, flowTokenSignature, appSecret) {
  try {
    // Verify JWT signature
    const decoded = jwt.verify(flowTokenSignature, appSecret);

    // Check if token matches
    return decoded.flow_token === flowToken;
  } catch (error) {
    return false;
  }
}
```

### FORM_VALIDATION_ERROR

**Error:** Form input doesn't meet validation requirements.

**Common Causes:**
- Missing required field
- Invalid email format
- Text exceeds max-length
- Date outside min/max range

**Solutions:**

**Client-side (Flow JSON):**
```json
{
  "type": "TextInput",
  "name": "email",
  "label": "Email",
  "required": true,
  "input-type": "email",
  "helper-text": "Enter a valid email address"
}
```

**Server-side (Endpoint):**
```javascript
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

if (!validateEmail(data.email)) {
  return {
    screen: "CURRENT_SCREEN",
    data: {
      error_message: "Please enter a valid email address"
    }
  };
}
```

### SCREEN_DATA_MISMATCH

**Error:** Screen data doesn't match data model.

**Common Causes:**
- Missing field in data object
- Wrong data type in response
- Extra fields not in model

**Solutions:**

**Match data model exactly:**
```json
// Data model in Flow JSON
{
  "data": {
    "user_name": {
      "type": "string",
      "__example__": "John"
    },
    "age": {
      "type": "number",
      "__example__": 25
    }
  }
}
```

```javascript
// Endpoint response - must match
{
  "screen": "PROFILE_SCREEN",
  "data": {
    "user_name": "Jane",  // string ✅
    "age": 30  // number ✅
    // Don't include extra fields
  }
}
```

## Flow Builder Issues

### Flow Preview Not Loading

**Solutions:**
1. Validate Flow JSON syntax
2. Check all screen references exist
3. Verify routing model if using endpoint
4. Ensure __example__ values in data model
5. Clear browser cache

### Components Not Rendering

**Check:**
1. Component type spelled correctly
2. Required properties set
3. Version compatibility
4. Visible property not false

### Dynamic Data Not Showing

**Solutions:**
```json
// ❌ Missing __example__
{
  "data": {
    "user_name": {
      "type": "string"
    }
  }
}

// ✅ Has __example__ for preview
{
  "data": {
    "user_name": {
      "type": "string",
      "__example__": "John Doe"
    }
  }
}
```

## Testing Checklist

When troubleshooting, verify:

- [ ] Flow JSON syntax is valid
- [ ] All screen IDs are unique
- [ ] Routing model is correct
- [ ] All referenced screens exist
- [ ] Terminal screens have Footer
- [ ] Required properties are set
- [ ] Data types match model
- [ ] __example__ values provided
- [ ] Endpoint encryption works
- [ ] Signature validation works
- [ ] Endpoint responds < 10s
- [ ] Health check responds
- [ ] Error handling implemented

## Debugging Tools

### 1. Validate Flow JSON
Use WhatsApp Flow Builder to catch syntax errors

### 2. Test Encryption Locally
```javascript
// Test encryption/decryption
const testPayload = {
  version: "3.0",
  action: "INIT",
  flow_token: "test-token"
};

const encrypted = encryptRequest(testPayload);
const decrypted = decryptRequest(encrypted);
console.assert(
  JSON.stringify(testPayload) === JSON.stringify(decrypted)
);
```

### 3. Log Endpoint Requests
```javascript
app.post('/endpoint', async (req, res) => {
  console.log('Request:', {
    action: req.body.action,
    screen: req.body.screen,
    timestamp: new Date()
  });

  // Process request...

  console.log('Response:', {
    screen: response.screen,
    timestamp: new Date()
  });
});
```

### 4. Monitor Response Times
```javascript
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.path} took ${duration}ms`);
    if (duration > 9000) {
      console.warn('⚠️ Close to timeout!');
    }
  });
  next();
});
```

## Getting Help

When seeking help, provide:

1. **Flow JSON** (or relevant screen)
2. **Error message** (exact text)
3. **Endpoint logs** (if applicable)
4. **Flow version**
5. **Expected vs actual behavior**

**Where to look:**
- Read the error codes documentation: `Error_Codes_-_WhatsApp_Flows.md`
- Check Flow JSON reference: `Flow_JSON_-_WhatsApp_Flows.md`
- Review endpoint guide: `Implementing_Endpoints_for_Flows_-_WhatsApp_Flows.md`
- Consult best practices: `Best_Practices_-_WhatsApp_Flows.md`
