# WhatsApp Flows Examples

Practical examples demonstrating common Flow patterns and implementations.

## Example 1: Simple Contact Form (No Endpoint)

A basic contact form that collects name, email, and message.

```json
{
  "version": "7.2",
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
            "text": "We'll respond within 24 hours"
          },
          {
            "type": "TextInput",
            "name": "name",
            "label": "Your Name",
            "required": true,
            "input-type": "text"
          },
          {
            "type": "TextInput",
            "name": "email",
            "label": "Email Address",
            "required": true,
            "input-type": "email"
          },
          {
            "type": "TextArea",
            "name": "message",
            "label": "Message",
            "required": true,
            "max-length": 500
          },
          {
            "type": "Footer",
            "label": "Submit",
            "on-click-action": {
              "name": "navigate",
              "next": {"type": "screen", "name": "CONFIRMATION"},
              "payload": {
                "name": "${form.name}",
                "email": "${form.email}",
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
            "text": "`'Thank you ' ${data.name} ', we\\'ll get back to you soon.'`"
          },
          {
            "type": "Footer",
            "label": "Done",
            "on-click-action": {
              "name": "complete",
              "payload": {
                "name": "${data.name}",
                "email": "${data.email}",
                "message": "${data.message}"
              }
            }
          }
        ]
      }
    }
  ]
}
```

## Example 2: Appointment Booking (With Endpoint)

An appointment booking flow with date selection and confirmation.

```json
{
  "version": "7.2",
  "data_api_version": "4.0",
  "routing_model": {
    "SELECT_SERVICE": ["SELECT_TIME"],
    "SELECT_TIME": ["CONFIRMATION"],
    "CONFIRMATION": []
  },
  "screens": [
    {
      "id": "SELECT_SERVICE",
      "title": "Select Service",
      "data": {
        "services": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {"type": "string"},
              "title": {"type": "string"}
            }
          },
          "__example__": [
            {"id": "haircut", "title": "Haircut - $30"},
            {"id": "color", "title": "Hair Color - $80"}
          ]
        }
      },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Choose Your Service"
          },
          {
            "type": "RadioButtonsGroup",
            "name": "service",
            "label": "Service",
            "required": true,
            "data-source": "${data.services}"
          },
          {
            "type": "Footer",
            "label": "Continue",
            "on-click-action": {
              "name": "data_exchange",
              "payload": {
                "service_id": "${form.service}"
              }
            }
          }
        ]
      }
    },
    {
      "id": "SELECT_TIME",
      "title": "Select Time",
      "refresh_on_back": true,
      "data": {
        "available_slots": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {"type": "string"},
              "title": {"type": "string"}
            }
          },
          "__example__": [
            {"id": "2024-01-15T10:00", "title": "Jan 15, 10:00 AM"},
            {"id": "2024-01-15T14:00", "title": "Jan 15, 2:00 PM"}
          ]
        }
      },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Choose a Time Slot"
          },
          {
            "type": "RadioButtonsGroup",
            "name": "time_slot",
            "label": "Available Times",
            "required": true,
            "data-source": "${data.available_slots}"
          },
          {
            "type": "Footer",
            "label": "Confirm Booking",
            "on-click-action": {
              "name": "data_exchange",
              "payload": {
                "time_slot_id": "${form.time_slot}"
              }
            }
          }
        ]
      }
    },
    {
      "id": "CONFIRMATION",
      "title": "Booking Confirmed",
      "terminal": true,
      "success": true,
      "data": {
        "booking_id": {
          "type": "string",
          "__example__": "BK-12345"
        },
        "service_name": {
          "type": "string",
          "__example__": "Haircut"
        },
        "appointment_time": {
          "type": "string",
          "__example__": "Jan 15, 10:00 AM"
        }
      },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "All Set!"
          },
          {
            "type": "TextBody",
            "text": "`'Your ' ${data.service_name} ' appointment is booked for ' ${data.appointment_time}`"
          },
          {
            "type": "TextCaption",
            "text": "`'Booking ID: ' ${data.booking_id}`"
          },
          {
            "type": "Footer",
            "label": "Done",
            "on-click-action": {
              "name": "complete",
              "payload": {
                "booking_id": "${data.booking_id}"
              }
            }
          }
        ]
      }
    }
  ]
}
```

**Endpoint Handler (Node.js):**

```javascript
app.post("/appointment", async (req, res) => {
  const { decryptedBody, aesKeyBuffer, initialVectorBuffer } = decryptRequest(
    req.body,
    PRIVATE_KEY
  );

  const { action, screen, data, flow_token } = decryptedBody;

  let response;

  // Handle INIT - First screen
  if (action === "INIT") {
    response = {
      screen: "SELECT_SERVICE",
      data: {
        services: await getAvailableServices()
      }
    };
  }

  // Handle data_exchange from SELECT_SERVICE
  else if (action === "data_exchange" && screen === "SELECT_SERVICE") {
    const serviceId = data.service_id;
    response = {
      screen: "SELECT_TIME",
      data: {
        available_slots: await getAvailableSlots(serviceId)
      }
    };
  }

  // Handle data_exchange from SELECT_TIME
  else if (action === "data_exchange" && screen === "SELECT_TIME") {
    const booking = await createBooking(data.time_slot_id, flow_token);
    response = {
      screen: "CONFIRMATION",
      data: {
        booking_id: booking.id,
        service_name: booking.serviceName,
        appointment_time: booking.formattedTime
      }
    };
  }

  res.send(encryptResponse(response, aesKeyBuffer, initialVectorBuffer));
});
```

## Example 3: Survey with Conditional Questions

A survey that shows different questions based on previous answers.

```json
{
  "version": "7.2",
  "screens": [
    {
      "id": "SATISFACTION_SURVEY",
      "title": "Quick Survey",
      "data": {},
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "How was your experience?"
          },
          {
            "type": "RadioButtonsGroup",
            "name": "satisfaction",
            "label": "Overall Satisfaction",
            "required": true,
            "data-source": [
              {"id": "excellent", "title": "Excellent"},
              {"id": "good", "title": "Good"},
              {"id": "fair", "title": "Fair"},
              {"id": "poor", "title": "Poor"}
            ]
          },
          {
            "type": "If",
            "condition": "`${form.satisfaction} == 'poor' || ${form.satisfaction} == 'fair'`",
            "then": [
              {
                "type": "TextArea",
                "name": "improvement_feedback",
                "label": "What can we improve?",
                "required": true,
                "max-length": 500
              }
            ]
          },
          {
            "type": "CheckboxGroup",
            "name": "communication_prefs",
            "label": "Stay in touch via:",
            "data-source": [
              {"id": "email", "title": "Email"},
              {"id": "sms", "title": "SMS"},
              {"id": "whatsapp", "title": "WhatsApp"}
            ]
          },
          {
            "type": "Footer",
            "label": "Submit Survey",
            "on-click-action": {
              "name": "navigate",
              "next": {"type": "screen", "name": "THANK_YOU"},
              "payload": {
                "satisfaction": "${form.satisfaction}",
                "feedback": "${form.improvement_feedback}",
                "prefs": "${form.communication_prefs}"
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
      "data": {},
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Thanks for Your Feedback!"
          },
          {
            "type": "TextBody",
            "text": "Your input helps us improve our service."
          },
          {
            "type": "Footer",
            "label": "Close",
            "on-click-action": {
              "name": "complete",
              "payload": {}
            }
          }
        ]
      }
    }
  ]
}
```

## Example 4: Multi-Step Registration with Validation

Registration flow with sensitive fields and validation.

```json
{
  "version": "7.2",
  "screens": [
    {
      "id": "PERSONAL_INFO",
      "title": "Personal Information",
      "sensitive": ["password"],
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Create Your Account"
          },
          {
            "type": "TextInput",
            "name": "full_name",
            "label": "Full Name",
            "required": true,
            "input-type": "text"
          },
          {
            "type": "TextInput",
            "name": "email",
            "label": "Email Address",
            "required": true,
            "input-type": "email",
            "helper-text": "We'll never share your email"
          },
          {
            "type": "TextInput",
            "name": "password",
            "label": "Password",
            "required": true,
            "input-type": "password",
            "helper-text": "Minimum 8 characters"
          },
          {
            "type": "DatePicker",
            "name": "birth_date",
            "label": "Date of Birth",
            "required": true,
            "max-date": "2006-01-01"
          },
          {
            "type": "Footer",
            "label": "Continue",
            "on-click-action": {
              "name": "navigate",
              "next": {"type": "screen", "name": "PREFERENCES"},
              "payload": {
                "full_name": "${form.full_name}",
                "email": "${form.email}",
                "password": "${form.password}",
                "birth_date": "${form.birth_date}"
              }
            }
          }
        ]
      }
    },
    {
      "id": "PREFERENCES",
      "title": "Preferences",
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Customize Your Experience"
          },
          {
            "type": "Dropdown",
            "name": "language",
            "label": "Preferred Language",
            "required": true,
            "data-source": [
              {"id": "en", "title": "English"},
              {"id": "es", "title": "Spanish"},
              {"id": "fr", "title": "French"}
            ]
          },
          {
            "type": "CheckboxGroup",
            "name": "interests",
            "label": "Interests (optional)",
            "data-source": [
              {"id": "tech", "title": "Technology"},
              {"id": "sports", "title": "Sports"},
              {"id": "music", "title": "Music"},
              {"id": "travel", "title": "Travel"}
            ]
          },
          {
            "type": "OptIn",
            "name": "newsletter",
            "label": "Send me weekly updates",
            "on-click-action": {
              "name": "open_url",
              "url": "https://example.com/privacy-policy"
            }
          },
          {
            "type": "Footer",
            "label": "Create Account",
            "on-click-action": {
              "name": "navigate",
              "next": {"type": "screen", "name": "SUCCESS"},
              "payload": {}
            }
          }
        ]
      }
    },
    {
      "id": "SUCCESS",
      "title": "Welcome!",
      "terminal": true,
      "success": true,
      "data": {
        "user_name": {
          "type": "string",
          "__example__": "John"
        }
      },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "`'Welcome, ' ${screen.PERSONAL_INFO.form.full_name} '!'`"
          },
          {
            "type": "TextBody",
            "text": "Your account has been created successfully."
          },
          {
            "type": "Footer",
            "label": "Get Started",
            "on-click-action": {
              "name": "complete",
              "payload": {
                "email": "${screen.PERSONAL_INFO.form.email}"
              }
            }
          }
        ]
      }
    }
  ]
}
```

## Example 5: Dynamic Cascading Dropdowns

Country/State/City selection with update_data action.

```json
{
  "version": "7.2",
  "screens": [
    {
      "id": "ADDRESS_FORM",
      "title": "Shipping Address",
      "terminal": true,
      "data": {
        "countries": {
          "type": "array",
          "items": {"type": "object"},
          "__example__": [
            {
              "id": "us",
              "title": "United States",
              "on-select-action": {
                "name": "update_data",
                "payload": {
                  "states": [
                    {"id": "ny", "title": "New York"},
                    {"id": "ca", "title": "California"}
                  ],
                  "states_visible": true
                }
              }
            }
          ]
        },
        "states": {
          "type": "array",
          "items": {"type": "object"},
          "__example__": []
        },
        "states_visible": {
          "type": "boolean",
          "__example__": false
        }
      },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Enter Your Address"
          },
          {
            "type": "Dropdown",
            "name": "country",
            "label": "Country",
            "required": true,
            "data-source": "${data.countries}"
          },
          {
            "type": "Dropdown",
            "name": "state",
            "label": "State",
            "required": true,
            "visible": "${data.states_visible}",
            "data-source": "${data.states}"
          },
          {
            "type": "TextInput",
            "name": "city",
            "label": "City",
            "required": true,
            "input-type": "text"
          },
          {
            "type": "TextInput",
            "name": "postal_code",
            "label": "Postal Code",
            "required": true,
            "input-type": "text"
          },
          {
            "type": "Footer",
            "label": "Continue",
            "on-click-action": {
              "name": "complete",
              "payload": {
                "country": "${form.country}",
                "state": "${form.state}",
                "city": "${form.city}",
                "postal_code": "${form.postal_code}"
              }
            }
          }
        ]
      }
    }
  ]
}
```

## Example 6: Error Handling in Endpoint

Handling validation errors from the endpoint.

```javascript
app.post("/booking-endpoint", async (req, res) => {
  const { decryptedBody, aesKeyBuffer, initialVectorBuffer } = decryptRequest(
    req.body,
    PRIVATE_KEY
  );

  const { action, screen, data } = decryptedBody;

  let response;

  if (action === "data_exchange" && screen === "SELECT_TIME") {
    const timeSlot = data.time_slot_id;

    // Check if slot is still available
    const isAvailable = await checkSlotAvailability(timeSlot);

    if (!isAvailable) {
      // Return to same screen with error
      response = {
        screen: "SELECT_TIME",
        data: {
          error_message: "Sorry, this time slot is no longer available. Please choose another.",
          available_slots: await getAvailableSlots()
        }
      };
    } else {
      // Proceed to confirmation
      const booking = await createBooking(timeSlot);
      response = {
        screen: "CONFIRMATION",
        data: {
          booking_id: booking.id,
          appointment_time: booking.time
        }
      };
    }
  }

  res.send(encryptResponse(response, aesKeyBuffer, initialVectorBuffer));
});
```

## Example 7: Health Check Handler

Complete health check implementation.

```javascript
app.post("/flow-endpoint", async (req, res) => {
  try {
    const { decryptedBody, aesKeyBuffer, initialVectorBuffer } = decryptRequest(
      req.body,
      PRIVATE_KEY
    );

    const { action } = decryptedBody;

    // Handle health check
    if (action === "ping") {
      const response = {
        data: {
          status: "active"
        }
      };
      return res.send(encryptResponse(response, aesKeyBuffer, initialVectorBuffer));
    }

    // Handle error notification
    if (action === "error_notification") {
      console.error("Flow error:", decryptedBody.data);
      const response = {
        data: {
          acknowledged: true
        }
      };
      return res.send(encryptResponse(response, aesKeyBuffer, initialVectorBuffer));
    }

    // Handle normal flow actions
    // ... your flow logic here

  } catch (error) {
    console.error("Endpoint error:", error);
    res.status(500).send("Internal server error");
  }
});
```

## Common Patterns Summary

### 1. Simple Static Flow
- No endpoint needed
- Use navigate actions
- Pass data via payload
- Complete on terminal screen

### 2. Dynamic Data Flow
- Define data model with __example__
- Use ${data.field} references
- Endpoint returns screen data
- Use data_exchange actions

### 3. Multi-Step Form
- Break into logical screens
- Use global references to access previous data
- Show progress in titles
- Confirm before final submission

### 4. Conditional Flow
- Use If/Switch components
- Set visible properties
- Handle different paths
- Use nested expressions for complex conditions

### 5. Validated Input
- Use appropriate input types
- Add helper-text for guidance
- Handle errors from endpoint
- Return to screen with error_message

### 6. Cascading Selections
- Use update_data action
- Initialize with empty data
- Populate on selection
- Control visibility dynamically
