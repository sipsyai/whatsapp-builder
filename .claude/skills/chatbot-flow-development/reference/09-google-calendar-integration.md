# Google Calendar Integration

This document covers the Google Calendar node integration for chatbot flows in WhatsApp Builder.

## Overview

The Google Calendar node enables chatbots to interact with Google Calendar data, allowing for real-time appointment booking, availability checking, and event retrieval. This integration uses OAuth 2.0 for secure access to user calendars.

## Prerequisites

1. **Chatbot Owner**: The chatbot must have an owner (userId) set
2. **Google OAuth Connected**: Users whose calendars will be read must have connected their Google Calendar via OAuth
3. **API Endpoint**: Use `/api/users?hasGoogleCalendar=true` to get users with connected calendars

## Node Configuration

### Basic Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `label` | string | Yes | Display name for the node |
| `type` | string | Yes | Must be `'google_calendar'` |
| `calendarAction` | string | Yes | Action type (see below) |
| `calendarUserSource` | string | Yes | Who's calendar to read (`'owner'`, `'static'`, `'variable'`) |
| `calendarOutputVariable` | string | No | Variable to store results |

### Calendar Actions

#### `get_today_events`
Retrieves all events scheduled for today.

```typescript
{
  label: "Today's Events",
  type: 'google_calendar',
  calendarAction: 'get_today_events',
  calendarUserSource: 'owner',
  calendarOutputVariable: 'today_events'
}
```

#### `get_tomorrow_events`
Retrieves all events scheduled for tomorrow.

```typescript
{
  label: "Tomorrow's Events",
  type: 'google_calendar',
  calendarAction: 'get_tomorrow_events',
  calendarUserSource: 'owner',
  calendarOutputVariable: 'tomorrow_events'
}
```

#### `get_events`
Retrieves events for a specific date or date range.

**Additional Properties:**
| Property | Type | Description |
|----------|------|-------------|
| `calendarDateSource` | `'variable'` \| `'static'` | How start date is provided |
| `calendarDateVariable` | string | Variable containing start date |
| `calendarStaticDate` | string | Static start date (YYYY-MM-DD) |
| `calendarEndDateSource` | `'variable'` \| `'static'` | How end date is provided (optional) |
| `calendarEndDateVariable` | string | Variable containing end date |
| `calendarStaticEndDate` | string | Static end date (YYYY-MM-DD) |
| `calendarMaxResults` | number | Maximum events to return (default: 10) |

```typescript
// Single date
{
  label: 'Events for Date',
  type: 'google_calendar',
  calendarAction: 'get_events',
  calendarUserSource: 'owner',
  calendarDateSource: 'variable',
  calendarDateVariable: 'selected_date',
  calendarMaxResults: 20,
  calendarOutputVariable: 'date_events'
}

// Date range
{
  label: 'Week Events',
  type: 'google_calendar',
  calendarAction: 'get_events',
  calendarUserSource: 'owner',
  calendarDateSource: 'static',
  calendarStaticDate: '2024-12-01',
  calendarEndDateSource: 'static',
  calendarStaticEndDate: '2024-12-07',
  calendarMaxResults: 50,
  calendarOutputVariable: 'week_events'
}
```

#### `check_availability`
Checks calendar for a specific date and returns available time slots.

**Additional Properties:**
| Property | Type | Description |
|----------|------|-------------|
| `calendarDateSource` | `'variable'` \| `'static'` | How date is provided |
| `calendarDateVariable` | string | Variable containing date |
| `calendarStaticDate` | string | Static date (YYYY-MM-DD) |
| `calendarWorkingHoursStart` | string | Start of working hours (HH:mm) |
| `calendarWorkingHoursEnd` | string | End of working hours (HH:mm) |
| `calendarSlotDuration` | number | Slot duration in minutes (15, 30, 45, 60, 90, 120) |
| `calendarOutputFormat` | `'full'` \| `'slots_only'` | Response format |

```typescript
{
  label: 'Check Availability',
  type: 'google_calendar',
  calendarAction: 'check_availability',
  calendarUserSource: 'owner',
  calendarDateSource: 'variable',
  calendarDateVariable: 'appointment_date',
  calendarWorkingHoursStart: '09:00',
  calendarWorkingHoursEnd: '18:00',
  calendarSlotDuration: 30,
  calendarOutputFormat: 'slots_only',
  calendarOutputVariable: 'available_slots'
}
```

### Calendar User Sources

#### `owner` (Default)
Uses the calendar of the chatbot's owner.

```typescript
{
  calendarUserSource: 'owner'
}
```

**Requirements:**
- Chatbot must have `userId` (owner) set
- Owner must have connected Google Calendar via OAuth

#### `static`
Uses a specific user's calendar selected by ID.

```typescript
{
  calendarUserSource: 'static',
  calendarUserId: '550e8400-e29b-41d4-a716-446655440000'
}
```

**Use Case:** When you want to always check a specific person's calendar (e.g., the business manager).

#### `variable`
Uses a user ID from a chatbot variable (dynamic selection).

```typescript
{
  calendarUserSource: 'variable',
  calendarUserVariable: 'selected_stylist_id'
}
```

**Use Case:** When the user selects from multiple service providers (e.g., stylists, doctors, consultants).

## Output Formats

### Full Response (`calendarOutputFormat: 'full'`)

Returns complete availability data including events and slots:

```json
{
  "date": "2024-12-01",
  "workingHours": {
    "start": "09:00",
    "end": "18:00"
  },
  "slotDuration": 30,
  "slots": [
    { "id": "09:00", "time": "09:00", "available": true },
    { "id": "09:30", "time": "09:30", "available": false },
    { "id": "10:00", "time": "10:00", "available": true }
  ],
  "totalSlots": 18,
  "availableSlots": 12,
  "busySlots": 6
}
```

### Slots Only (`calendarOutputFormat: 'slots_only'`)

Returns a simplified array suitable for WhatsApp list messages:

```json
[
  { "id": "09:00", "title": "09:00", "enabled": true },
  { "id": "10:00", "title": "10:00", "enabled": true },
  { "id": "11:00", "title": "11:00", "enabled": true }
]
```

**Note:** Use `slots_only` when feeding results to a Question node with dynamic list.

## Edge Routing

The Google Calendar node has two output handles:

### Success (`sourceHandle: 'success'`)
Calendar data retrieved successfully.

### Error (`sourceHandle: 'error'`)
Calendar fetch failed. Possible causes:
- User not connected to Google Calendar
- OAuth token expired and refresh failed
- Invalid user ID
- Network error

```typescript
const edges = [
  {
    source: 'calendar-node',
    target: 'show-slots',
    sourceHandle: 'success'
  },
  {
    source: 'calendar-node',
    target: 'error-message',
    sourceHandle: 'error'
  }
];
```

## Complete Example: Appointment Booking Flow

```typescript
const nodes = [
  {
    id: 'start',
    type: 'start',
    data: { label: 'Start', type: 'start' },
    position: { x: 100, y: 200 }
  },
  {
    id: 'welcome',
    type: 'message',
    data: {
      label: 'Welcome',
      type: 'message',
      content: 'Welcome to our appointment booking service!'
    },
    position: { x: 300, y: 200 }
  },
  {
    id: 'ask-date',
    type: 'question',
    data: {
      label: 'Ask Date',
      type: 'question',
      questionType: 'text',
      content: 'Please enter your preferred date (YYYY-MM-DD):',
      variable: 'selected_date'
    },
    position: { x: 500, y: 200 }
  },
  {
    id: 'check-calendar',
    type: 'google_calendar',
    data: {
      label: 'Check Availability',
      type: 'google_calendar',
      calendarAction: 'check_availability',
      calendarUserSource: 'owner',
      calendarDateSource: 'variable',
      calendarDateVariable: 'selected_date',
      calendarWorkingHoursStart: '09:00',
      calendarWorkingHoursEnd: '18:00',
      calendarSlotDuration: 30,
      calendarOutputFormat: 'slots_only',
      calendarOutputVariable: 'available_slots'
    },
    position: { x: 700, y: 200 }
  },
  {
    id: 'select-time',
    type: 'question',
    data: {
      label: 'Select Time',
      type: 'question',
      questionType: 'list',
      content: 'Available times for {{selected_date}}:',
      variable: 'selected_time',
      dynamicListSource: 'available_slots',
      dynamicLabelField: 'title',
      listButtonText: 'Select Time'
    },
    position: { x: 900, y: 150 }
  },
  {
    id: 'confirm',
    type: 'message',
    data: {
      label: 'Confirmation',
      type: 'message',
      content: 'Your appointment is booked for {{selected_date}} at {{selected_time}}!'
    },
    position: { x: 1100, y: 150 }
  },
  {
    id: 'error',
    type: 'message',
    data: {
      label: 'Error',
      type: 'message',
      content: 'Sorry, we could not check calendar availability. Please try again.'
    },
    position: { x: 900, y: 300 }
  }
];

const edges = [
  { id: 'e1', source: 'start', target: 'welcome' },
  { id: 'e2', source: 'welcome', target: 'ask-date' },
  { id: 'e3', source: 'ask-date', target: 'check-calendar' },
  { id: 'e4', source: 'check-calendar', target: 'select-time', sourceHandle: 'success' },
  { id: 'e5', source: 'check-calendar', target: 'error', sourceHandle: 'error' },
  { id: 'e6', source: 'select-time', target: 'confirm' }
];
```

## Multi-Stylist Booking Example

```typescript
const nodes = [
  // First, fetch users with Google Calendar connected
  {
    id: 'fetch-stylists',
    type: 'rest_api',
    data: {
      label: 'Fetch Stylists',
      type: 'rest_api',
      apiUrl: '/api/users?hasGoogleCalendar=true',
      apiMethod: 'GET',
      apiOutputVariable: 'stylists'
    }
  },
  // Let user select a stylist
  {
    id: 'select-stylist',
    type: 'question',
    data: {
      label: 'Select Stylist',
      type: 'question',
      questionType: 'list',
      content: 'Please select your preferred stylist:',
      variable: 'selected_stylist_id',
      dynamicListSource: 'stylists',
      dynamicLabelField: 'name',
      dynamicDescField: 'email',
      listButtonText: 'Choose Stylist'
    }
  },
  // Check that stylist's calendar
  {
    id: 'check-stylist-calendar',
    type: 'google_calendar',
    data: {
      label: 'Stylist Availability',
      type: 'google_calendar',
      calendarAction: 'check_availability',
      calendarUserSource: 'variable',
      calendarUserVariable: 'selected_stylist_id',
      calendarDateSource: 'variable',
      calendarDateVariable: 'booking_date',
      calendarWorkingHoursStart: '10:00',
      calendarWorkingHoursEnd: '20:00',
      calendarSlotDuration: 60,
      calendarOutputFormat: 'slots_only',
      calendarOutputVariable: 'stylist_slots'
    }
  }
];
```

## API Reference

### Users with Google Calendar Endpoint

```
GET /api/users?hasGoogleCalendar=true
```

Returns users who have connected their Google Calendar:

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Jane Smith",
    "email": "jane@example.com"
  }
]
```

## Troubleshooting

### "NO_USER" Error
- **Cause**: Calendar user could not be determined
- **Solution**:
  - If using `owner`, ensure chatbot has userId set
  - If using `variable`, ensure variable contains valid user ID
  - If using `static`, ensure calendarUserId is set

### Calendar Returns Error
- **Cause**: OAuth issue or user not connected
- **Solution**:
  - Verify user has completed Google OAuth flow
  - User may need to reconnect if token expired
  - Check user exists in `/api/users?hasGoogleCalendar=true`

### Empty Slots Array
- **Cause**: All time slots are busy
- **Solution**:
  - Check calendar for the selected date
  - Try a different date
  - Adjust working hours configuration

### Wrong Calendar Being Read
- **Cause**: Incorrect calendarUserSource configuration
- **Solution**:
  - Use `owner` for chatbot owner's calendar
  - Use `static` with explicit ID for specific user
  - Use `variable` with correct variable name for dynamic selection

## Best Practices

1. **Always handle errors**: Connect both success and error handles
2. **Use slots_only for lists**: When feeding to dynamic Question nodes
3. **Validate dates**: Ensure date format is YYYY-MM-DD before calendar node
4. **Set appropriate working hours**: Match your business hours
5. **Pre-filter users**: Use hasGoogleCalendar filter when building user lists
6. **Provide fallback**: Give users alternative options if calendar fails
