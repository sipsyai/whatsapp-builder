# Test Verileri

Bu dosya frontend testleri için kullanılacak standart test verilerini içerir.

---

## Authentication Test Data

```json
{
  "validUser": {
    "email": "test@example.com",
    "password": "password123"
  },
  "adminUser": {
    "email": "admin@example.com",
    "password": "adminpass123"
  },
  "invalidCredentials": {
    "email": "test@example.com",
    "password": "wrongpassword"
  },
  "invalidEmail": {
    "email": "not-an-email",
    "password": "password123"
  },
  "emptyCredentials": {
    "email": "",
    "password": ""
  }
}
```

---

## User Test Data

```json
{
  "newUser": {
    "name": "Test User",
    "email": "newuser@example.com",
    "password": "testpass123",
    "role": "user"
  },
  "adminUser": {
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "adminpass123",
    "role": "admin"
  },
  "invalidUser": {
    "name": "",
    "email": "invalid-email",
    "password": "short",
    "role": ""
  }
}
```

---

## ChatBot Test Data

```json
{
  "newChatBot": {
    "name": "Test ChatBot",
    "description": "A test chatbot for automated testing"
  },
  "searchTerms": [
    "test",
    "welcome",
    "support"
  ],
  "filters": {
    "all": "all",
    "active": "active",
    "archived": "archived"
  }
}
```

---

## WhatsApp Flow Test Data

```json
{
  "minimalFlow": {
    "name": "Test Flow",
    "categories": ["OTHER"],
    "screens": [
      {
        "id": "SCREEN_1",
        "title": "Welcome",
        "layout": {
          "type": "SingleColumnLayout",
          "children": [
            {
              "type": "TextHeading",
              "text": "Welcome!"
            },
            {
              "type": "Footer",
              "label": "Continue",
              "on-click-action": {
                "name": "complete",
                "payload": {}
              }
            }
          ]
        }
      }
    ]
  },
  "flowCategories": [
    "SIGN_UP",
    "SIGN_IN",
    "APPOINTMENT_BOOKING",
    "LEAD_GENERATION",
    "SHOPPING",
    "CONTACT_US",
    "CUSTOMER_SUPPORT",
    "SURVEY",
    "OTHER"
  ]
}
```

---

## Builder Node Test Data

```json
{
  "messageNode": {
    "type": "MESSAGE",
    "content": {
      "type": "text",
      "text": "Hello! How can I help you today?"
    }
  },
  "questionNode": {
    "type": "QUESTION",
    "questionType": "buttons",
    "question": "What would you like to do?",
    "variable": "user_choice",
    "options": [
      { "id": "opt1", "label": "Get Info" },
      { "id": "opt2", "label": "Contact Support" },
      { "id": "opt3", "label": "Exit" }
    ]
  },
  "conditionNode": {
    "type": "CONDITION",
    "variable": "user_choice",
    "operator": "equals",
    "value": "opt1"
  },
  "restApiNode": {
    "type": "REST_API",
    "url": "https://api.example.com/data",
    "method": "GET",
    "headers": {
      "Authorization": "Bearer {{token}}"
    },
    "responseVariable": "api_response"
  }
}
```

---

## Data Source Test Data

```json
{
  "bearerTokenSource": {
    "name": "API with Bearer Token",
    "baseUrl": "https://api.example.com",
    "authType": "bearer",
    "token": "test_bearer_token_123"
  },
  "apiKeySource": {
    "name": "API with API Key",
    "baseUrl": "https://api.example.com",
    "authType": "apiKey",
    "keyName": "X-API-Key",
    "keyValue": "test_api_key_456",
    "keyLocation": "header"
  },
  "basicAuthSource": {
    "name": "API with Basic Auth",
    "baseUrl": "https://api.example.com",
    "authType": "basic",
    "username": "testuser",
    "password": "testpass"
  },
  "noAuthSource": {
    "name": "Public API",
    "baseUrl": "https://api.publicapis.org",
    "authType": "none"
  },
  "invalidSource": {
    "name": "",
    "baseUrl": "not-a-url",
    "authType": "bearer",
    "token": ""
  }
}
```

---

## WhatsApp Settings Test Data

```json
{
  "validConfig": {
    "phoneNumberId": "123456789012345",
    "businessAccountId": "987654321098765",
    "accessToken": "EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "appSecret": "abcdef123456789",
    "apiVersion": "v21.0"
  },
  "invalidConfig": {
    "phoneNumberId": "",
    "businessAccountId": "",
    "accessToken": "invalid_token",
    "appSecret": "",
    "apiVersion": "v21.0"
  }
}
```

---

## Session Test Data

```json
{
  "filterOptions": {
    "status": ["active", "completed"],
    "dateRange": {
      "today": "today",
      "thisWeek": "this_week",
      "thisMonth": "this_month",
      "custom": {
        "startDate": "2024-01-01",
        "endDate": "2024-01-31"
      }
    }
  },
  "searchTerms": [
    "+905551234567",
    "John",
    "test"
  ]
}
```

---

## Chat Test Data

```json
{
  "textMessages": [
    "Hello, this is a test message",
    "How can I help you?",
    "Thank you for contacting us!"
  ],
  "longMessage": "This is a very long message that should wrap properly in the chat window. It contains multiple sentences and should demonstrate how the chat bubble handles long text content without breaking the layout.",
  "emojiMessage": "Hello! 👋 How are you today? 😊 Let me know if you need any help! 🙏",
  "specialCharacters": "Test with <html> tags & special \"characters\" and 'quotes'"
}
```

---

## Flow Builder Component Test Data

```json
{
  "textHeading": {
    "type": "TextHeading",
    "text": "Welcome to Our Service"
  },
  "textBody": {
    "type": "TextBody",
    "text": "Please fill out the form below to get started."
  },
  "textInput": {
    "type": "TextInput",
    "label": "Your Name",
    "name": "user_name",
    "required": true,
    "inputType": "text"
  },
  "dropdown": {
    "type": "Dropdown",
    "label": "Select Country",
    "name": "country",
    "required": true,
    "dataSource": {
      "type": "static",
      "options": [
        { "id": "us", "title": "United States" },
        { "id": "uk", "title": "United Kingdom" },
        { "id": "tr", "title": "Turkey" }
      ]
    }
  },
  "radioButtons": {
    "type": "RadioButtonsGroup",
    "label": "Preferred Contact",
    "name": "contact_method",
    "required": true,
    "dataSource": {
      "type": "static",
      "options": [
        { "id": "email", "title": "Email" },
        { "id": "phone", "title": "Phone" },
        { "id": "whatsapp", "title": "WhatsApp" }
      ]
    }
  },
  "footer": {
    "type": "Footer",
    "label": "Submit",
    "onClickAction": {
      "name": "navigate",
      "next": {
        "type": "screen",
        "name": "SCREEN_2"
      }
    }
  }
}
```

---

## Validation Test Data

```json
{
  "characterLimits": {
    "textHeading": 60,
    "textSubheading": 60,
    "textBody": 80,
    "textCaption": 80,
    "textInputLabel": 20,
    "footerLabel": 35
  },
  "overLimitTexts": {
    "textHeading": "This is a very long heading text that exceeds the maximum character limit of 60 characters allowed",
    "textBody": "This is an extremely long body text that goes well beyond the allowed limit of 80 characters for this component type"
  },
  "requiredFieldTests": {
    "emptyTextInput": {
      "label": "",
      "name": ""
    },
    "emptyDropdown": {
      "label": "",
      "name": "",
      "options": []
    }
  }
}
```

---

## Environment URLs

```json
{
  "local": {
    "frontend": "http://localhost:5173",
    "backend": "http://localhost:3001",
    "healthCheck": "http://localhost:3001/health"
  },
  "production": {
    "frontend": "https://whatsapp.sipsy.ai",
    "backend": "https://whatsapp-api.sipsy.ai",
    "healthCheck": "https://whatsapp-api.sipsy.ai/health"
  }
}
```

---

## Test Element Selectors (Common)

```json
{
  "login": {
    "emailInput": "input[type='email']",
    "passwordInput": "input[type='password']",
    "submitButton": "button[type='submit']",
    "errorMessage": "[role='alert']"
  },
  "sidebar": {
    "container": "[data-testid='sidebar']",
    "menuItems": "[data-testid='menu-item']"
  },
  "modal": {
    "container": "[role='dialog']",
    "closeButton": "[aria-label='Close']",
    "submitButton": "button[type='submit']"
  },
  "toast": {
    "success": "[data-type='success']",
    "error": "[data-type='error']"
  }
}
```

---

## Notes

- Tüm test verileri gerçek API'lerle uyumlu olmalı
- Hassas veriler (gerçek token'lar) test verilerinde kullanılmamalı
- Test verileri düzenli olarak güncelleneli
- Her test sonrası oluşturulan veriler temizlenmeli
