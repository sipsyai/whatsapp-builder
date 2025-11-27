# Complete Chatbot and Flow Examples

Comprehensive examples demonstrating real-world chatbot flows and WhatsApp Flow implementations.

## Table of Contents

**Chatbot Examples:**
1. [Simple Welcome Bot](#example-1-simple-welcome-bot)
2. [Menu Bot with Buttons](#example-2-menu-bot-with-buttons)
3. [Form Bot with Conditions](#example-3-form-bot-with-conditions)
4. [API Integration Bot](#example-4-api-integration-bot)

**WhatsApp Flow Examples:**
5. [Contact Form Flow](#example-5-contact-form-flow)
6. [Appointment Booking Flow](#example-6-appointment-booking-flow)
7. [Survey Flow](#example-7-survey-flow)

---

## Chatbot Examples

### Example 1: Simple Welcome Bot

**Description:** Basic bot that welcomes users and sends a goodbye message.

**Flow Structure:**
```
START → Message (Welcome) → Message (Goodbye)
```

**Complete JSON:**
```json
{
  "name": "Simple Welcome Bot",
  "description": "Welcomes users with a simple message",
  "isActive": true,
  "nodes": [
    {
      "id": "start_1",
      "type": "start",
      "position": { "x": 100, "y": 100 },
      "data": {
        "type": "start",
        "label": "Start"
      }
    },
    {
      "id": "message_1",
      "type": "message",
      "position": { "x": 100, "y": 200 },
      "data": {
        "type": "message",
        "label": "Welcome Message",
        "content": "Hello! Welcome to our service. Thank you for contacting us.",
        "messageType": "text"
      }
    },
    {
      "id": "message_2",
      "type": "message",
      "position": { "x": 100, "y": 300 },
      "data": {
        "type": "message",
        "label": "Goodbye",
        "content": "Have a great day! Feel free to reach out anytime.",
        "messageType": "text"
      }
    }
  ],
  "edges": [
    {
      "id": "e_start_msg1",
      "source": "start_1",
      "target": "message_1"
    },
    {
      "id": "e_msg1_msg2",
      "source": "message_1",
      "target": "message_2"
    }
  ]
}
```

---

### Example 2: Menu Bot with Buttons

**Description:** Interactive menu with 3 options using buttons.

**Flow Structure:**
```
START → Question (Menu) → [User selects]
  ├─ Sales Info → Message (Sales)
  ├─ Support → Message (Support)
  └─ Contact → Message (Contact)
```

**Complete JSON:**
```json
{
  "name": "Menu Bot",
  "description": "Interactive menu with button options",
  "isActive": true,
  "nodes": [
    {
      "id": "start_1",
      "type": "start",
      "position": { "x": 100, "y": 100 },
      "data": {
        "type": "start",
        "label": "Start"
      }
    },
    {
      "id": "question_1",
      "type": "question",
      "position": { "x": 100, "y": 200 },
      "data": {
        "type": "question",
        "label": "Main Menu",
        "content": "Welcome! How can we help you today?",
        "questionType": "buttons",
        "variable": "user_choice",
        "buttons": [
          { "id": "btn_sales", "title": "Sales Info" },
          { "id": "btn_support", "title": "Support" },
          { "id": "btn_contact", "title": "Contact Us" }
        ]
      }
    },
    {
      "id": "condition_1",
      "type": "condition",
      "position": { "x": 100, "y": 350 },
      "data": {
        "type": "condition",
        "label": "Route User",
        "conditionVar": "user_choice",
        "conditionOp": "eq",
        "conditionVal": "Sales Info"
      }
    },
    {
      "id": "message_sales",
      "type": "message",
      "position": { "x": -100, "y": 500 },
      "data": {
        "type": "message",
        "label": "Sales Information",
        "content": "Our sales team is available Mon-Fri, 9 AM - 6 PM.\n\nEmail: sales@company.com\nPhone: +1 555-0123"
      }
    },
    {
      "id": "condition_2",
      "type": "condition",
      "position": { "x": 300, "y": 500 },
      "data": {
        "type": "condition",
        "label": "Check Support",
        "conditionVar": "user_choice",
        "conditionOp": "eq",
        "conditionVal": "Support"
      }
    },
    {
      "id": "message_support",
      "type": "message",
      "position": { "x": 100, "y": 650 },
      "data": {
        "type": "message",
        "label": "Support Info",
        "content": "For technical support:\n\nEmail: support@company.com\nPhone: +1 555-0199\n24/7 support available"
      }
    },
    {
      "id": "message_contact",
      "type": "message",
      "position": { "x": 500, "y": 650 },
      "data": {
        "type": "message",
        "label": "Contact Info",
        "content": "Contact Us:\n\nMain Office: 123 Business St, City\nEmail: info@company.com\nPhone: +1 555-0100"
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "start_1", "target": "question_1" },
    { "id": "e2", "source": "question_1", "target": "condition_1" },
    { "id": "e3", "source": "condition_1", "target": "message_sales", "sourceHandle": "true" },
    { "id": "e4", "source": "condition_1", "target": "condition_2", "sourceHandle": "false" },
    { "id": "e5", "source": "condition_2", "target": "message_support", "sourceHandle": "true" },
    { "id": "e6", "source": "condition_2", "target": "message_contact", "sourceHandle": "false" }
  ]
}
```

---

### Example 3: Form Bot with Conditions

**Description:** Collects user information and provides personalized response based on age.

**Flow Structure:**
```
START → Question (Name) → Question (Email) → Question (Age) → Condition (Age Check)
  ├─ True (18+) → Message (Adult Welcome)
  └─ False (<18) → Message (Minor Welcome)
```

**Complete JSON:**
```json
{
  "name": "Registration Bot",
  "description": "Collects user info and personalizes response",
  "isActive": true,
  "nodes": [
    {
      "id": "start_1",
      "type": "start",
      "position": { "x": 250, "y": 50 },
      "data": { "type": "start", "label": "Start" }
    },
    {
      "id": "question_name",
      "type": "question",
      "position": { "x": 250, "y": 150 },
      "data": {
        "type": "question",
        "label": "Ask Name",
        "content": "Welcome! What's your name?",
        "questionType": "text",
        "variable": "user_name"
      }
    },
    {
      "id": "question_email",
      "type": "question",
      "position": { "x": 250, "y": 270 },
      "data": {
        "type": "question",
        "label": "Ask Email",
        "content": "Thanks {{user_name}}! What's your email address?",
        "questionType": "text",
        "variable": "user_email"
      }
    },
    {
      "id": "question_age",
      "type": "question",
      "position": { "x": 250, "y": 390 },
      "data": {
        "type": "question",
        "label": "Ask Age",
        "content": "How old are you?",
        "questionType": "text",
        "variable": "user_age"
      }
    },
    {
      "id": "condition_age",
      "type": "condition",
      "position": { "x": 250, "y": 510 },
      "data": {
        "type": "condition",
        "label": "Check Age",
        "conditionVar": "user_age",
        "conditionOp": "gte",
        "conditionVal": "18"
      }
    },
    {
      "id": "message_adult",
      "type": "message",
      "position": { "x": 100, "y": 650 },
      "data": {
        "type": "message",
        "label": "Adult Welcome",
        "content": "Perfect, {{user_name}}! Since you're {{user_age}}, you have access to all our services.\n\nWe'll send updates to: {{user_email}}"
      }
    },
    {
      "id": "message_minor",
      "type": "message",
      "position": { "x": 400, "y": 650 },
      "data": {
        "type": "message",
        "label": "Minor Welcome",
        "content": "Thanks {{user_name}}! You're {{user_age}} years old.\n\nYou'll need parental consent for some services. We'll contact you at: {{user_email}}"
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "start_1", "target": "question_name" },
    { "id": "e2", "source": "question_name", "target": "question_email" },
    { "id": "e3", "source": "question_email", "target": "question_age" },
    { "id": "e4", "source": "question_age", "target": "condition_age" },
    { "id": "e5", "source": "condition_age", "target": "message_adult", "sourceHandle": "true" },
    { "id": "e6", "source": "condition_age", "target": "message_minor", "sourceHandle": "false" }
  ]
}
```

---

### Example 4: API Integration Bot

**Description:** Fetches products from API and displays as dynamic list for user selection.

**Flow Structure:**
```
START → REST_API (Fetch Categories) → Question (Select Category)
  → REST_API (Fetch Products) → Question (Select Product)
  → Message (Confirmation)
```

**Complete JSON:**
```json
{
  "name": "Product Catalog Bot",
  "description": "Dynamic product selection using REST API",
  "isActive": true,
  "nodes": [
    {
      "id": "start_1",
      "type": "start",
      "position": { "x": 300, "y": 50 },
      "data": { "type": "start", "label": "Start" }
    },
    {
      "id": "message_welcome",
      "type": "message",
      "position": { "x": 300, "y": 150 },
      "data": {
        "type": "message",
        "label": "Welcome",
        "content": "Welcome to our Product Catalog! Let me show you what we have."
      }
    },
    {
      "id": "api_categories",
      "type": "rest_api",
      "position": { "x": 300, "y": 270 },
      "data": {
        "type": "rest_api",
        "label": "Fetch Categories",
        "apiUrl": "https://api.example.com/categories",
        "apiMethod": "GET",
        "apiHeaders": {
          "Content-Type": "application/json"
        },
        "apiOutputVariable": "categories",
        "apiResponsePath": "data",
        "apiErrorVariable": "api_error",
        "apiTimeout": 10000
      }
    },
    {
      "id": "question_category",
      "type": "question",
      "position": { "x": 300, "y": 420 },
      "data": {
        "type": "question",
        "label": "Select Category",
        "content": "Please select a category:",
        "questionType": "list",
        "variable": "selected_category",
        "dynamicListSource": "categories",
        "dynamicLabelField": "name",
        "dynamicDescField": "description",
        "listButtonText": "View Categories"
      }
    },
    {
      "id": "api_products",
      "type": "rest_api",
      "position": { "x": 300, "y": 570 },
      "data": {
        "type": "rest_api",
        "label": "Fetch Products",
        "apiUrl": "https://api.example.com/products?category={{selected_category}}",
        "apiMethod": "GET",
        "apiOutputVariable": "products",
        "apiResponsePath": "data.items",
        "apiErrorVariable": "product_error"
      }
    },
    {
      "id": "question_product",
      "type": "question",
      "position": { "x": 300, "y": 720 },
      "data": {
        "type": "question",
        "label": "Select Product",
        "content": "Here are the products in {{selected_category}}:",
        "questionType": "list",
        "variable": "selected_product",
        "dynamicListSource": "products",
        "dynamicLabelField": "name",
        "dynamicDescField": "price",
        "listButtonText": "View Products"
      }
    },
    {
      "id": "message_confirmation",
      "type": "message",
      "position": { "x": 300, "y": 870 },
      "data": {
        "type": "message",
        "label": "Confirmation",
        "content": "Great choice! You selected: {{selected_product}}\n\nCategory: {{selected_category}}\n\nWould you like to proceed with this selection?"
      }
    },
    {
      "id": "message_error",
      "type": "message",
      "position": { "x": 550, "y": 420 },
      "data": {
        "type": "message",
        "label": "API Error",
        "content": "Sorry, we're having trouble loading categories right now. Please try again later.\n\nError: {{api_error}}"
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "start_1", "target": "message_welcome" },
    { "id": "e2", "source": "message_welcome", "target": "api_categories" },
    { "id": "e3", "source": "api_categories", "target": "question_category", "sourceHandle": "success" },
    { "id": "e4", "source": "api_categories", "target": "message_error", "sourceHandle": "error" },
    { "id": "e5", "source": "question_category", "target": "api_products" },
    { "id": "e6", "source": "api_products", "target": "question_product", "sourceHandle": "success" },
    { "id": "e7", "source": "question_product", "target": "message_confirmation" }
  ]
}
```

---

## WhatsApp Flow Examples

### Example 5: Contact Form Flow

**Description:** Simple contact form with name, email, and message fields.

**Flow Structure:**
- Single screen with form inputs
- Navigate to confirmation screen on submit

**Complete Flow JSON:**
```json
{
  "name": "Contact Form",
  "description": "Collect contact information from users",
  "categories": ["CONTACT_US"],
  "flowJson": {
    "version": "7.2",
    "data_api_version": "3.0",
    "routing_model": {},
    "screens": [
      {
        "id": "CONTACT_FORM",
        "title": "Contact Us",
        "terminal": false,
        "layout": {
          "type": "SingleColumnLayout",
          "children": [
            {
              "type": "TextHeading",
              "text": "Get in Touch"
            },
            {
              "type": "TextBody",
              "text": "Fill out the form below and we'll respond within 24 hours."
            },
            {
              "type": "TextInput",
              "name": "name",
              "label": "Your Name",
              "input-type": "text",
              "required": true,
              "helper-text": "Enter your full name"
            },
            {
              "type": "TextInput",
              "name": "email",
              "label": "Email Address",
              "input-type": "email",
              "required": true,
              "helper-text": "We'll never share your email"
            },
            {
              "type": "TextInput",
              "name": "phone",
              "label": "Phone Number",
              "input-type": "phone",
              "required": false,
              "helper-text": "Optional"
            },
            {
              "type": "TextArea",
              "name": "message",
              "label": "Your Message",
              "required": true,
              "max-length": 500,
              "helper-text": "Maximum 500 characters"
            },
            {
              "type": "Footer",
              "label": "Submit",
              "on-click-action": {
                "name": "navigate",
                "next": {
                  "type": "screen",
                  "name": "CONFIRMATION"
                },
                "payload": {
                  "name": "${form.name}",
                  "email": "${form.email}",
                  "phone": "${form.phone}",
                  "message": "${form.message}"
                }
              }
            }
          ]
        }
      },
      {
        "id": "CONFIRMATION",
        "title": "Thank You",
        "terminal": true,
        "success": true,
        "data": {
          "name": {
            "type": "string",
            "__example__": "John Doe"
          },
          "email": {
            "type": "string",
            "__example__": "john@example.com"
          }
        },
        "layout": {
          "type": "SingleColumnLayout",
          "children": [
            {
              "type": "TextHeading",
              "text": "Message Received!"
            },
            {
              "type": "TextBody",
              "text": "Thank you ${data.name}! We've received your message and will get back to you at ${data.email} soon."
            },
            {
              "type": "Footer",
              "label": "Done",
              "on-click-action": {
                "name": "complete",
                "payload": {
                  "name": "${data.name}",
                  "email": "${data.email}",
                  "phone": "${data.phone}",
                  "message": "${data.message}",
                  "status": "submitted"
                }
              }
            }
          ]
        }
      }
    ]
  }
}
```

---

### Example 6: Appointment Booking Flow

**Description:** Dynamic appointment booking with date selection and service dropdown.

**Flow Structure:**
- Screen 1: Select service and date
- Screen 2: Confirmation with data_exchange for availability check

**Complete Flow JSON:**
```json
{
  "name": "Appointment Booking",
  "description": "Book appointments with service selection",
  "categories": ["APPOINTMENT_BOOKING"],
  "endpointUri": "https://api.example.com/appointments/flow-endpoint",
  "flowJson": {
    "version": "7.2",
    "data_api_version": "3.0",
    "routing_model": {},
    "screens": [
      {
        "id": "BOOKING_FORM",
        "title": "Book Appointment",
        "terminal": false,
        "data": {
          "services": {
            "type": "array",
            "__example__": [
              {"id": "haircut", "title": "Haircut - $30"},
              {"id": "coloring", "title": "Hair Coloring - $80"},
              {"id": "styling", "title": "Hair Styling - $40"}
            ]
          }
        },
        "layout": {
          "type": "SingleColumnLayout",
          "children": [
            {
              "type": "TextHeading",
              "text": "Book Your Appointment"
            },
            {
              "type": "TextBody",
              "text": "Select your preferred service and date."
            },
            {
              "type": "TextInput",
              "name": "customer_name",
              "label": "Your Name",
              "input-type": "text",
              "required": true
            },
            {
              "type": "TextInput",
              "name": "customer_phone",
              "label": "Phone Number",
              "input-type": "phone",
              "required": true,
              "helper-text": "We'll send confirmation to this number"
            },
            {
              "type": "Dropdown",
              "name": "service",
              "label": "Select Service",
              "required": true,
              "data-source": "${data.services}",
              "on-select-action": {
                "name": "data_exchange",
                "payload": {
                  "selected_service": "${form.service}"
                }
              }
            },
            {
              "type": "DatePicker",
              "name": "appointment_date",
              "label": "Preferred Date",
              "required": true,
              "min-date": "2025-01-01",
              "max-date": "2025-12-31",
              "helper-text": "Select a date for your appointment"
            },
            {
              "type": "RadioButtonsGroup",
              "name": "time_slot",
              "label": "Time Slot",
              "required": true,
              "data-source": [
                {"id": "morning", "title": "Morning (9 AM - 12 PM)"},
                {"id": "afternoon", "title": "Afternoon (1 PM - 5 PM)"},
                {"id": "evening", "title": "Evening (6 PM - 8 PM)"}
              ]
            },
            {
              "type": "Footer",
              "label": "Check Availability",
              "on-click-action": {
                "name": "data_exchange",
                "payload": {
                  "service": "${form.service}",
                  "date": "${form.appointment_date}",
                  "time_slot": "${form.time_slot}",
                  "customer_name": "${form.customer_name}",
                  "customer_phone": "${form.customer_phone}"
                }
              }
            }
          ]
        }
      },
      {
        "id": "CONFIRMATION",
        "title": "Confirm Booking",
        "terminal": false,
        "data": {
          "available": {
            "type": "boolean",
            "__example__": true
          },
          "booking_id": {
            "type": "string",
            "__example__": "APT12345"
          },
          "service_name": {
            "type": "string",
            "__example__": "Haircut"
          },
          "formatted_date": {
            "type": "string",
            "__example__": "January 15, 2025"
          }
        },
        "layout": {
          "type": "SingleColumnLayout",
          "children": [
            {
              "type": "TextHeading",
              "text": "Confirm Your Booking"
            },
            {
              "type": "TextBody",
              "text": "Service: ${data.service_name}\nDate: ${data.formatted_date}\nBooking ID: ${data.booking_id}"
            },
            {
              "type": "TextCaption",
              "text": "Please confirm to complete your booking."
            },
            {
              "type": "Footer",
              "label": "Confirm Booking",
              "on-click-action": {
                "name": "complete",
                "payload": {
                  "booking_id": "${data.booking_id}",
                  "status": "confirmed"
                }
              }
            }
          ]
        }
      }
    ]
  }
}
```

**Endpoint Response Example:**

When user clicks "Check Availability", your endpoint receives:
```json
{
  "action": "data_exchange",
  "screen": "BOOKING_FORM",
  "data": {
    "service": "haircut",
    "date": "2025-01-15",
    "time_slot": "morning",
    "customer_name": "John Doe",
    "customer_phone": "+1234567890"
  },
  "flow_token": "unique_token_123"
}
```

Your endpoint should respond:
```json
{
  "version": "7.2",
  "screen": "CONFIRMATION",
  "data": {
    "available": true,
    "booking_id": "APT12345",
    "service_name": "Haircut - $30",
    "formatted_date": "January 15, 2025",
    "services": [
      {"id": "haircut", "title": "Haircut - $30"},
      {"id": "coloring", "title": "Hair Coloring - $80"}
    ]
  }
}
```

---

### Example 7: Survey Flow

**Description:** Multi-question survey with checkboxes and ratings.

**Complete Flow JSON:**
```json
{
  "name": "Customer Satisfaction Survey",
  "description": "Collect customer feedback",
  "categories": ["SURVEY"],
  "flowJson": {
    "version": "7.2",
    "data_api_version": "3.0",
    "routing_model": {},
    "screens": [
      {
        "id": "SURVEY_SCREEN",
        "title": "Feedback Survey",
        "terminal": false,
        "layout": {
          "type": "SingleColumnLayout",
          "children": [
            {
              "type": "TextHeading",
              "text": "We Value Your Feedback"
            },
            {
              "type": "TextBody",
              "text": "Please take a moment to share your experience with us."
            },
            {
              "type": "RadioButtonsGroup",
              "name": "satisfaction",
              "label": "How satisfied are you with our service?",
              "required": true,
              "data-source": [
                {"id": "very_satisfied", "title": "Very Satisfied"},
                {"id": "satisfied", "title": "Satisfied"},
                {"id": "neutral", "title": "Neutral"},
                {"id": "dissatisfied", "title": "Dissatisfied"},
                {"id": "very_dissatisfied", "title": "Very Dissatisfied"}
              ]
            },
            {
              "type": "CheckboxGroup",
              "name": "features",
              "label": "Which features did you use? (Select all that apply)",
              "required": false,
              "min-selected-items": 0,
              "max-selected-items": 10,
              "data-source": [
                {"id": "feature1", "title": "Online Booking"},
                {"id": "feature2", "title": "Customer Support"},
                {"id": "feature3", "title": "Product Catalog"},
                {"id": "feature4", "title": "Payment System"},
                {"id": "feature5", "title": "Delivery Tracking"}
              ]
            },
            {
              "type": "Dropdown",
              "name": "recommendation",
              "label": "How likely are you to recommend us?",
              "required": true,
              "data-source": [
                {"id": "10", "title": "10 - Extremely Likely"},
                {"id": "9", "title": "9"},
                {"id": "8", "title": "8"},
                {"id": "7", "title": "7"},
                {"id": "6", "title": "6"},
                {"id": "5", "title": "5"},
                {"id": "4", "title": "4"},
                {"id": "3", "title": "3"},
                {"id": "2", "title": "2"},
                {"id": "1", "title": "1 - Not Likely"}
              ]
            },
            {
              "type": "TextArea",
              "name": "comments",
              "label": "Additional Comments",
              "required": false,
              "max-length": 1000,
              "helper-text": "Share any additional feedback (optional)"
            },
            {
              "type": "Footer",
              "label": "Submit Survey",
              "on-click-action": {
                "name": "navigate",
                "next": {
                  "type": "screen",
                  "name": "THANK_YOU"
                },
                "payload": {
                  "satisfaction": "${form.satisfaction}",
                  "features": "${form.features}",
                  "recommendation": "${form.recommendation}",
                  "comments": "${form.comments}"
                }
              }
            }
          ]
        }
      },
      {
        "id": "THANK_YOU",
        "title": "Thank You",
        "terminal": true,
        "success": true,
        "data": {
          "satisfaction": {
            "type": "string",
            "__example__": "very_satisfied"
          }
        },
        "layout": {
          "type": "SingleColumnLayout",
          "children": [
            {
              "type": "TextHeading",
              "text": "Thank You for Your Feedback!"
            },
            {
              "type": "TextBody",
              "text": "We appreciate you taking the time to complete our survey. Your feedback helps us improve our service."
            },
            {
              "type": "TextCaption",
              "text": "You can close this window now."
            },
            {
              "type": "Footer",
              "label": "Done",
              "on-click-action": {
                "name": "complete",
                "payload": {
                  "satisfaction": "${data.satisfaction}",
                  "features": "${data.features}",
                  "recommendation": "${data.recommendation}",
                  "comments": "${data.comments}",
                  "completed_at": "2025-11-27T10:00:00Z"
                }
              }
            }
          ]
        }
      }
    ]
  }
}
```

---

## Using Examples in Your Project

### How to Import Chatbot Examples

1. **Copy the JSON** from the example
2. **Navigate to Builder** in the frontend
3. **Create new chatbot** or edit existing
4. **Paste nodes and edges** directly
5. **Adjust positions** using auto-layout
6. **Test the flow** before activating

### How to Create WhatsApp Flows

1. **Navigate to Flows page** (`/flows`)
2. **Click "Create Flow"**
3. **Paste flowJson** from example
4. **Update endpointUri** if using data_exchange
5. **Save as DRAFT**
6. **Test with WhatsApp Flow Builder**
7. **Publish when ready**

### Customization Tips

**For Chatbots:**
- Replace placeholder text with your content
- Adjust variable names for clarity
- Add more conditions for complex logic
- Connect API nodes to real endpoints

**For WhatsApp Flows:**
- Update service lists with your offerings
- Customize date ranges for DatePicker
- Add your branding to text components
- Implement endpoint for data_exchange

---

## Testing Your Flows

### Chatbot Testing

1. **Use Test Mode** in builder
2. **Simulate user responses**
3. **Check variable values** in context
4. **Verify API calls** using test endpoint
5. **Test error branches**

### WhatsApp Flow Testing

1. **Use WhatsApp Flow Builder** preview
2. **Test all input validations**
3. **Verify data_exchange responses**
4. **Check terminal screens**
5. **Test on real WhatsApp** before production

---

**Last Updated**: 2025-11-27
**Document Version**: 1.0
**Related**:
- [05-whatsapp-flow-components.md](./05-whatsapp-flow-components.md)
- [06-whatsapp-flow-actions.md](./06-whatsapp-flow-actions.md)
- [07-rest-api-integration.md](./07-rest-api-integration.md)
