# Backend Execution Details

Bu dokuman, chatbot akislarinin backend tarafinda nasil calistigini, DTO validation kurallarini ve kritik implementation detaylarini aciklar.

---

## DTO Validation

### IsStringOrNumber Custom Validator

Frontend bazen ID alanlarina numeric degerler gonderebilir (ornegin `id: 1` yerine `id: "1"`). Bu durumu desteklemek icin custom bir validator kullanilmaktadir.

**Dosya:** `backend/src/modules/chatbots/dto/list-section.dto.ts`

```typescript
/**
 * Custom validator that accepts both string and number types for ID fields.
 * This handles cases where frontend may send numeric IDs but backend expects strings.
 * Also accepts undefined/null for optional fields.
 */
function IsStringOrNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStringOrNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          // Accept undefined/null (for optional fields with @IsOptional)
          if (value === undefined || value === null) {
            return true;
          }
          return typeof value === 'string' || typeof value === 'number';
        },
        defaultMessage() {
          return '$property must be a string or number';
        },
      },
    });
  };
}
```

### Kullanim Alanlari

Bu validator asagidaki DTO siniflarina uygulanmistir:

| DTO Class | Property | Aciklama |
|-----------|----------|----------|
| `ButtonItemDto` | `id` | Buton kimlik alani |
| `ListRowDto` | `id` | Liste satiri kimlik alani |
| `ListSectionDto` | `id` | Liste bolumu kimlik alani |

### Transform ile String Donusumu

Numeric degerler otomatik olarak string'e donusturulur:

```typescript
const transformToString = ({ value, key }: TransformFnParams): string | null | undefined => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') return undefined;
  return String(value);
};

// Kullanim ornegi
export class ButtonItemDto {
  @IsOptional()
  @Transform(transformToString, { toClassOnly: true })
  @IsStringOrNumber()
  id?: string;
}
```

### ListRowDto Description Optional

`ListRowDto.description` alani artik optional:

```typescript
export class ListRowDto {
  @IsOptional()
  @IsString()
  description?: string;  // Zorunlu degil
}
```

---

## Multi-Condition Support (Condition Groups)

CONDITION node'larinda artik coklu kosul gruplari desteklenmektedir.

### ConditionDto

Tek bir kosulu temsil eder:

```typescript
export class ConditionDto {
  @IsString()
  id: string;           // Unique condition identifier, e.g., 'cond_1'

  @IsString()
  variable: string;     // Variable name, e.g., 'user_age'

  @IsString()
  operator: string;     // Operator, e.g., 'eq', 'gt', 'contains'

  @IsString()
  value: string;        // Comparison value, e.g., '18'
}
```

### ConditionGroupDto

Birden fazla kosulu mantiksal operatorle birlestirir:

```typescript
export class ConditionGroupDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionDto)
  conditions: ConditionDto[];

  @IsIn(['AND', 'OR'])
  logicalOperator: 'AND' | 'OR';
}
```

### NodeDataDto'da Kullanim

```typescript
export class NodeDataDto {
  // ... diger alanlar

  @IsOptional()
  @ValidateNested()
  @Type(() => ConditionGroupDto)
  conditionGroup?: ConditionGroupDto;
}
```

### Ornek Condition Group

```json
{
  "conditionGroup": {
    "conditions": [
      {
        "id": "cond_1",
        "variable": "user_age",
        "operator": "gt",
        "value": "18"
      },
      {
        "id": "cond_2",
        "variable": "user_country",
        "operator": "eq",
        "value": "TR"
      }
    ],
    "logicalOperator": "AND"
  }
}
```

Bu ornekte, kullanicinin yasi 18'den buyuk VE ulkesi TR ise kosul true doner.

---

## LIST/BUTTONS Selection - ID vs Title Kaydı

### Kritik Degisiklik

**Onceki Davranis (Hatali):**
- LIST veya BUTTONS sorusunda kullanici secim yaptiginda, secimin **title** degeri kaydediliyordu.
- Ornek: Kullanici "Berber Randevu" butonuna tikladiginda, variable'a `"Berber Randevu"` kaydediliyordu.

**Yeni Davranis (Dogru):**
- Artik secimin **ID** degeri kaydedilmektedir.
- Ornek: Kullanici "Berber Randevu" butonuna tikladiginda, variable'a `"demo_berber"` (butonun ID'si) kaydediliyor.

### Neden Onemli?

CONDITION node'larinda kosullar genellikle ID'ye gore tanimlanir:

```json
{
  "conditionVar": "selected_demo",
  "conditionOp": "eq",
  "conditionVal": "demo_berber"
}
```

Eger title kaydedilseydi (`"Berber Randevu"`), bu kosul asla true donmezdi cunku `"Berber Randevu" != "demo_berber"`.

### Implementation

**Dosya:** `backend/src/modules/chatbots/services/chatbot-execution.service.ts`

```typescript
async processUserResponse(
  conversationId: string,
  userMessage: string,
  buttonId?: string,
  listRowId?: string,
): Promise<void> {
  // ... context yukleme kodu

  // Save user response to variables
  // For LIST questions, save the row ID instead of the display text
  // For BUTTONS questions, save the button ID instead of the display text
  const questionType = currentNode.data?.questionType;
  let valueToSave = userMessage;

  if (questionType === QuestionType.LIST && listRowId) {
    valueToSave = listRowId;  // ID kaydediliyor, title degil
  } else if (questionType === QuestionType.BUTTONS && buttonId) {
    valueToSave = buttonId;   // ID kaydediliyor, title degil
  }

  context.variables[variable] = valueToSave;

  // ... geri kalan kod
}
```

### Ornek Senaryo

1. **Question Node Yapisi:**
   ```json
   {
     "type": "question",
     "questionType": "buttons",
     "content": "Hangi hizmeti seçmek istersiniz?",
     "variable": "selected_service",
     "buttons": [
       { "id": "berber", "title": "Berber Randevu" },
       { "id": "kuafor", "title": "Kuaför Randevu" }
     ]
   }
   ```

2. **Kullanici "Berber Randevu" butonuna tiklar**

3. **Kaydedilen Deger:**
   ```json
   {
     "variables": {
       "selected_service": "berber"  // ID kaydedildi
     }
   }
   ```

4. **Condition Node Kontrolu:**
   ```json
   {
     "conditionVar": "selected_service",
     "conditionOp": "eq",
     "conditionVal": "berber"
   }
   ```

   Sonuc: `"berber" == "berber"` -> **TRUE**

---

## Desteklenen Condition Operatorleri

| Operator | Alternatif | Aciklama |
|----------|------------|----------|
| `==` | `eq`, `equals` | Esit |
| `!=` | `neq`, `not_equals` | Esit degil |
| `>` | `gt`, `greater` | Buyuk |
| `<` | `lt`, `less` | Kucuk |
| `>=` | `gte`, `greater_or_equal` | Buyuk veya esit |
| `<=` | `lte`, `less_or_equal` | Kucuk veya esit |
| `contains` | - | Icerir (case-insensitive) |
| `not_contains` | - | Icermez (case-insensitive) |

---

## Debug Bilgileri

### DTO Validation Debug Loglari

IsStringOrNumber validator ve Transform debug loglar:

```
[IsStringOrNumber DEBUG] Property: id, Value: 123, Type: number
[Transform DEBUG] Key: id, Value: 123, Type: number
[Transform DEBUG] Key: id, Value: "123", Type: string (after transform)
```

### Selection Debug Loglari

Kullanici secimi islenirken:

```
[ChatBotExecutionService] Processing user response: buttonId=berber, listRowId=undefined
[ChatBotExecutionService] Saved response to variable selected_service: berber
```

---

## Ilgili Dosyalar

| Dosya | Aciklama |
|-------|----------|
| `backend/src/modules/chatbots/dto/list-section.dto.ts` | ButtonItemDto, ListRowDto, ListSectionDto, IsStringOrNumber validator |
| `backend/src/modules/chatbots/dto/node-data.dto.ts` | NodeDataDto, ConditionDto, ConditionGroupDto |
| `backend/src/modules/chatbots/services/chatbot-execution.service.ts` | Flow execution engine, processUserResponse |

---

**Son Guncelleme:** 1 Aralik 2024
