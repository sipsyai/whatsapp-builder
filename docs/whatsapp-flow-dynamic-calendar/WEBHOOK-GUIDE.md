# Webhook Development Rehberi

Bu dokümantasyon, WhatsApp Flow webhook endpoint'inin nasıl geliştirildiğini detaylı açıklar.

---

## 📋 İçindekiler

1. [Webhook Akışı](#webhook-akışı)
2. [Şifreleme ve Güvenlik](#şifreleme-ve-güvenlik)
3. [Request Handling](#request-handling)
4. [Response Format](#response-format)
5. [Action Handlers](#action-handlers)
6. [Mock Calendar Service](#mock-calendar-service)
7. [Error Handling](#error-handling)

---

## 1. Webhook Akışı

```
WhatsApp → Encrypted Request → Webhook
                ↓
         Decrypt with RSA + AES
                ↓
         Process Request (Action Handler)
                ↓
         Encrypt Response with AES
                ↓
WhatsApp ← Encrypted Response ← Webhook
```

---

## 2. Şifreleme ve Güvenlik

### 2.1. RSA Key Pair

Server başladığında RSA-2048 key pair oluşturulur:

```typescript
// flow-crypto.util.ts
export class FlowCryptoUtil {
  static generateKeyPair(): { privateKey: string; publicKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { privateKey, publicKey };
  }
}
```

**Controller'da kullanımı**:

```typescript
// flow-webhook.controller.ts
export class FlowWebhookController {
  private privateKey: string;
  private publicKey: string;

  constructor() {
    const keys = FlowCryptoUtil.generateKeyPair();
    this.privateKey = keys.privateKey;
    this.publicKey = keys.publicKey;

    console.log('WhatsApp Flow Public Key:');
    console.log(this.publicKey);
  }

  @Get('public-key')
  getPublicKey() {
    return {
      publicKey: this.publicKey,
      message: 'Use this public key in WhatsApp Business Manager',
    };
  }
}
```

### 2.2. Request Decryption

WhatsApp gönderdiği request format:

```json
{
  "encrypted_flow_data": "base64_encrypted_data",
  "encrypted_aes_key": "base64_rsa_encrypted_aes_key",
  "initial_vector": "base64_iv"
}
```

**Decryption adımları**:

```typescript
static decryptRequest(body: any, privateKey: string): any {
  // 1. RSA ile AES key'i decrypt et
  const decryptedAesKey = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(body.encrypted_aes_key, 'base64')
  );

  // 2. AES-128-GCM ile flow data'yı decrypt et
  const decipher = crypto.createDecipheriv(
    'aes-128-gcm',
    decryptedAesKey.subarray(0, 16),  // İlk 16 byte
    Buffer.from(body.initial_vector, 'base64')
  );

  // 3. Auth tag ekle
  const encryptedFlowDataBody = Buffer.from(body.encrypted_flow_data, 'base64');
  const encryptedFlowDataTag = encryptedFlowDataBody.subarray(-16);
  const encryptedFlowDataBuffer = encryptedFlowDataBody.subarray(0, -16);

  decipher.setAuthTag(encryptedFlowDataTag);

  // 4. Decrypt
  const decryptedData = Buffer.concat([
    decipher.update(encryptedFlowDataBuffer),
    decipher.final(),
  ]);

  return JSON.parse(decryptedData.toString('utf-8'));
}
```

### 2.3. Response Encryption

```typescript
static encryptResponse(
  response: any,
  aesKey: Buffer,
  initialVector: Buffer
): string {
  // 1. Response'u JSON'a çevir
  const responseString = JSON.stringify(response);

  // 2. AES-128-GCM cipher oluştur
  const cipher = crypto.createCipheriv(
    'aes-128-gcm',
    aesKey,
    initialVector
  );

  // 3. Encrypt
  const encryptedData = Buffer.concat([
    cipher.update(responseString, 'utf-8'),
    cipher.final(),
    cipher.getAuthTag(),  // Son 16 byte: auth tag
  ]);

  // 4. Base64'e çevir
  return encryptedData.toString('base64');
}
```

---

## 3. Request Handling

### 3.1. Main Endpoint

```typescript
@Post()
@HttpCode(HttpStatus.OK)
async handleFlowRequest(@Body() body: any) {
  try {
    console.log('Received Flow request:', JSON.stringify(body, null, 2));

    // 1. Decrypt request
    const decryptedRequest = FlowCryptoUtil.decryptRequest(
      body,
      this.privateKey,
    );

    console.log('Decrypted request:', JSON.stringify(decryptedRequest, null, 2));

    // 2. Extract AES key and IV for response
    const aesKey = Buffer.from(body.encrypted_aes_key, 'base64');
    const initialVector = Buffer.from(body.initial_vector, 'base64');

    // 3. Process request
    let responseData;

    if (decryptedRequest.action === 'ping') {
      // Health check
      responseData = {
        version: '3.1',
        data: {
          status: 'active',
        },
      };
    } else if (decryptedRequest.action === 'INIT') {
      // Flow başlangıcı
      responseData = {
        version: '3.0',
        screen: 'MAIN_MENU',
        data: {},
      };
    } else if (decryptedRequest.action === 'data_exchange') {
      // Custom action handler
      responseData = await this.handleDataExchange(decryptedRequest);
    } else {
      // Unknown action
      responseData = {
        version: '3.1',
        data: {
          error: 'Unknown action',
        },
      };
    }

    // 4. Encrypt response
    const encryptedResponse = FlowCryptoUtil.encryptResponse(
      responseData,
      aesKey.subarray(0, 16),
      initialVector,
    );

    console.log('Response data:', JSON.stringify(responseData, null, 2));

    // 5. Return encrypted response
    return {
      encrypted_flow_data: encryptedResponse,
    };
  } catch (error) {
    console.error('Error handling flow request:', error);

    return {
      error: 'Failed to process request',
      message: error.message,
    };
  }
}
```

---

## 4. Response Format

### 4.1. Success Response

```typescript
{
  "version": "3.0",
  "screen": "CURRENT_SCREEN",
  "data": {
    "field_name": [ ... ]
  }
}
```

**Örnek**:

```typescript
return {
  version: '3.0',
  screen: 'DATETIME_SCREEN',
  data: {
    available_slots: [
      { id: '10:00', title: '10:00', enabled: true },
      { id: '11:00', title: '11:00', enabled: true },
    ],
  },
};
```

### 4.2. Navigation Response

Başka bir screen'e yönlendirme:

```typescript
return {
  version: '3.0',
  screen: 'SUCCESS',
  data: {
    confirmation_message: 'Randevunuz oluşturuldu!',
    appointment_details: '24 Ocak 2025, 10:00',
  },
};
```

### 4.3. Error Response

```typescript
return {
  version: '3.0',
  screen: 'DATETIME_SCREEN',  // Aynı screen'de kal
  data: {
    error_message: 'Bu tarihte müsait saat yok',
  },
};
```

Screen'de error göstermek için:

```json
{
  "type": "TextBody",
  "text": "${data.error_message}",
  "visible": "${data.error_message != ''}"
}
```

### 4.4. Ping Response

WhatsApp sağlık kontrolü için:

```typescript
if (decryptedRequest.action === 'ping') {
  return {
    version: '3.1',
    data: {
      status: 'active',
    },
  };
}
```

---

## 5. Action Handlers

### 5.1. INIT Action

Flow açıldığında ilk request:

```typescript
if (decryptedRequest.action === 'INIT') {
  // İlk screen için gerekli verileri hazırla
  const availableDates = this.mockCalendarService.getAvailableDates('ali');

  return {
    version: '3.0',
    screen: 'MAIN_MENU',
    data: {},
  };
}
```

### 5.2. data_exchange Handler

Custom action'lar için:

```typescript
private handleDataExchange(decryptedRequest: any) {
  const screenId = decryptedRequest.screen;
  const data = decryptedRequest.data;

  if (data.action === 'get_stylist_info') {
    return this.handleGetStylistInfo(data, screenId);
  } else if (data.action === 'get_available_slots') {
    return this.handleGetAvailableSlots(data, screenId);
  } else if (data.action === 'create_appointment') {
    return this.handleCreateAppointment(data);
  }

  // Default
  return {
    version: '3.0',
    screen: screenId,
    data: {},
  };
}
```

### 5.3. get_stylist_info

Kuaför seçildiğinde:

```typescript
private handleGetStylistInfo(data: any, screenId: string) {
  const availableDates = this.mockCalendarService.getAvailableDates(
    data.stylist,
  );

  return {
    version: '3.0',
    screen: screenId,
    data: {
      // İleride dates de eklenebilir
    },
  };
}
```

**Request**:
```json
{
  "action": "data_exchange",
  "screen": "MAIN_MENU",
  "data": {
    "action": "get_stylist_info",
    "stylist": "ali",
    "service": "haircut"
  }
}
```

### 5.4. get_available_slots

Tarih seçildiğinde:

```typescript
private handleGetAvailableSlots(data: any, screenId: string) {
  const availableSlots = this.mockCalendarService.getAvailableSlots(
    data.stylist,
    data.date,
  );

  return {
    version: '3.0',
    screen: screenId,
    data: {
      available_slots: availableSlots,
    },
  };
}
```

**Request**:
```json
{
  "action": "data_exchange",
  "screen": "DATETIME_SCREEN",
  "data": {
    "action": "get_available_slots",
    "stylist": "ali",
    "date": "2025-01-24",
    "service": "haircut"
  }
}
```

**Response**:
```json
{
  "version": "3.0",
  "screen": "DATETIME_SCREEN",
  "data": {
    "available_slots": [
      {"id": "10:00", "title": "10:00", "enabled": true},
      {"id": "12:00", "title": "12:00", "enabled": true}
    ]
  }
}
```

### 5.5. create_appointment

Randevu oluşturulduğunda:

```typescript
private handleCreateAppointment(data: any) {
  try {
    const appointment = this.appointmentService.createAppointment({
      service: data.service,
      stylist: data.stylist,
      appointmentDate: data.appointment_date,
      appointmentTime: data.appointment_time,
      customerName: data.customer_name,
      customerPhone: data.customer_phone,
      notes: data.notes,
    });

    const appointmentDetails =
      this.appointmentService.getAppointmentDetails(appointment);

    return {
      version: '3.0',
      screen: 'SUCCESS',
      data: {
        confirmation_message: `Merhaba ${appointment.customerName}! Randevunuz başarıyla oluşturuldu.`,
        appointment_details: appointmentDetails,
      },
    };
  } catch (error) {
    return {
      version: '3.0',
      screen: 'DATETIME_SCREEN',
      data: {
        error_message: error.message,
      },
    };
  }
}
```

---

## 6. Mock Calendar Service

### 6.1. Service Yapısı

```typescript
@Injectable()
export class MockCalendarService {
  // Mock calendar data
  private mockEvents: CalendarEvent[] = [
    {
      stylist: 'ali',
      date: '2025-01-24',
      startTime: '09:00',
      endTime: '10:00',
      title: 'Ahmet - Saç Kesimi',
    },
    // ... daha fazla
  ];

  // Çalışma saatleri
  private workingHours = {
    start: '09:00',
    end: '18:00',
    slotDuration: 60, // dakika
  };
}
```

### 6.2. getAvailableDates

Önümüzdeki 14 gün için tarihler:

```typescript
getAvailableDates(stylist: string): Array<{ id: string; title: string; enabled: boolean }> {
  const dates: Array<{ id: string; title: string; enabled: boolean }> = [];
  const today = new Date();

  // Önümüzdeki 14 gün
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dateStr = date.toISOString().split('T')[0];
    const dateFormatted = date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      weekday: 'short',
    });

    dates.push({
      id: dateStr,
      title: dateFormatted,
      enabled: true,
    });
  }

  return dates;
}
```

### 6.3. getAvailableSlots

Dolu saatleri filtrele:

```typescript
getAvailableSlots(
  stylist: string,
  date: string,
): Array<{ id: string; title: string; enabled: boolean }> {
  // 1. O tarih için dolu saatleri bul
  const bookedSlots = this.mockEvents
    .filter((event) => event.stylist === stylist && event.date === date)
    .map((event) => event.startTime);

  console.log(
    `[MockCalendar] ${stylist} için ${date} tarihinde dolu saatler:`,
    bookedSlots,
  );

  // 2. Tüm çalışma saatlerini oluştur
  const allSlots = this.generateTimeSlots();

  // 3. Dolu olmayan saatleri döndür
  const availableSlots = allSlots
    .filter((slot) => !bookedSlots.includes(slot))
    .map((slot) => ({
      id: slot,
      title: slot,
      enabled: true,
    }));

  console.log(
    `[MockCalendar] ${stylist} için ${date} tarihinde müsait saatler:`,
    availableSlots.map((s) => s.id),
  );

  return availableSlots;
}
```

### 6.4. generateTimeSlots

Çalışma saatleri aralığında slot'lar oluştur:

```typescript
private generateTimeSlots(): string[] {
  const slots: string[] = [];
  const [startHour, startMinute] = this.workingHours.start
    .split(':')
    .map(Number);
  const [endHour, endMinute] = this.workingHours.end.split(':').map(Number);

  let currentHour = startHour;
  let currentMinute = startMinute;

  while (
    currentHour < endHour ||
    (currentHour === endHour && currentMinute < endMinute)
  ) {
    const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    slots.push(timeStr);

    // Slot duration kadar ilerle
    currentMinute += this.workingHours.slotDuration;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }

  return slots;
}
```

**Örnek Output**:
```
['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
```

---

## 7. Error Handling

### 7.1. Try-Catch Wrapper

```typescript
@Post()
async handleFlowRequest(@Body() body: any) {
  try {
    // ... processing
  } catch (error) {
    console.error('Error handling flow request:', error);

    return {
      error: 'Failed to process request',
      message: error.message,
    };
  }
}
```

### 7.2. Validation Errors

```typescript
if (!data.stylist || !data.date) {
  return {
    version: '3.0',
    screen: screenId,
    data: {
      error_message: 'Gerekli bilgiler eksik',
    },
  };
}
```

### 7.3. Business Logic Errors

```typescript
const availableSlots = this.mockCalendarService.getAvailableSlots(
  data.stylist,
  data.date,
);

if (availableSlots.length === 0) {
  return {
    version: '3.0',
    screen: screenId,
    data: {
      error_message: 'Bu tarihte müsait saat bulunmuyor',
    },
  };
}
```

### 7.4. Logging

```typescript
console.log('Received Flow request:', JSON.stringify(body, null, 2));
console.log('Decrypted request:', JSON.stringify(decryptedRequest, null, 2));
console.log(`[MockCalendar] ${stylist} için ${date} tarihinde dolu saatler:`, bookedSlots);
console.log('Response data:', JSON.stringify(responseData, null, 2));
```

---

## 8. Testing

### 8.1. Unit Tests

```typescript
// mock-calendar.service.spec.ts
describe('MockCalendarService', () => {
  let service: MockCalendarService;

  beforeEach(() => {
    service = new MockCalendarService();
  });

  it('should return 14 dates', () => {
    const dates = service.getAvailableDates('ali');
    expect(dates).toHaveLength(14);
  });

  it('should filter booked slots', () => {
    const slots = service.getAvailableSlots('ali', '2025-01-24');
    expect(slots).not.toContainEqual(
      expect.objectContaining({ id: '09:00' })
    );
  });
});
```

### 8.2. Integration Tests

Postman collection:

```json
{
  "name": "Flow Webhook",
  "request": {
    "method": "POST",
    "url": "http://localhost:3000/flow-webhook",
    "body": {
      "mode": "raw",
      "raw": "{\n  \"encrypted_flow_data\": \"...\",\n  \"encrypted_aes_key\": \"...\",\n  \"initial_vector\": \"...\"\n}"
    }
  }
}
```

### 8.3. ngrok Inspector

http://localhost:4040 adresinde:
- Request/response logları
- Payload inspection
- Request replay

---

## 📚 Örnek Kod Parçaları

### Tam Controller Yapısı

```typescript
@Controller('flow-webhook')
export class FlowWebhookController {
  private privateKey: string;
  private publicKey: string;

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly mockCalendarService: MockCalendarService,
  ) {
    const keys = FlowCryptoUtil.generateKeyPair();
    this.privateKey = keys.privateKey;
    this.publicKey = keys.publicKey;
  }

  @Get('public-key')
  getPublicKey() {
    return { publicKey: this.publicKey };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleFlowRequest(@Body() body: any) {
    // ... implementation
  }

  @Get('appointments')
  getAllAppointments() {
    return {
      appointments: this.appointmentService.getAllAppointments(),
    };
  }
}
```

---

**Hazırlayan**: Claude Code
**Tarih**: 23 Kasım 2025
