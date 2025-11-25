# ChatBots API Documentation

## Public Endpoints

### Create ChatBot
`POST /api/chatbots`

**Request Body:**
```json
{
  "name": "Support Bot",
  "description": "Customer support chatbot",
  "nodes": [
    {
      "id": "start-1",
      "type": "start",
      "position": { "x": 100, "y": 100 },
      "data": { "label": "Start" }
    }
  ],
  "edges": []
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "Support Bot",
  "description": "Customer support chatbot",
  "nodes": [...],
  "edges": [],
  "isActive": false,
  "status": "draft",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

---

### Get All ChatBots
`GET /api/chatbots`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Support Bot",
    "isActive": true,
    "status": "active",
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

---

### Get ChatBot by ID
`GET /api/chatbots/:id`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Support Bot",
  "description": "Customer support chatbot",
  "nodes": [...],
  "edges": [...],
  "isActive": true,
  "status": "active",
  "metadata": {},
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

---

### Update ChatBot
`PUT /api/chatbots/:id`

**Request Body:**
```json
{
  "name": "Updated Bot Name",
  "nodes": [...],
  "edges": [...]
}
```

**Response:** `200 OK`

---

### Delete ChatBot
`DELETE /api/chatbots/:id`

**Response:** `200 OK`

---

### Toggle Active ChatBot
`POST /api/chatbots/:id/toggle-active`

Activates a chatbot and deactivates all others.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Support Bot",
  "isActive": true
}
```

---

### Stop ChatBot for Conversation
`POST /api/chatbots/conversations/:conversationId/stop`

Stops the active chatbot session for a specific conversation.

**Response:** `200 OK`
```json
{
  "message": "Chatbot stopped successfully",
  "conversationId": "uuid"
}
```

---

### Skip Current Node
`POST /api/chatbots/conversations/:conversationId/skip`

Skips the current waiting node (Flow or Question) in the chatbot flow.

**Response (Success):** `200 OK`
```json
{
  "message": "Node skipped successfully",
  "conversationId": "uuid",
  "skipped": true
}
```

**Response (Nothing to Skip):** `200 OK`
```json
{
  "message": "Nothing to skip",
  "conversationId": "uuid",
  "skipped": false
}
```

---

## Debug Endpoints

### Get All Active Contexts
`GET /api/chatbots/debug/contexts`

Lists all active chatbot contexts with detailed information.

**Response:** `200 OK`
```json
[
  {
    "id": "ctx-uuid",
    "conversationId": "conv-uuid",
    "chatbotName": "Support Bot",
    "currentNodeId": "node-123",
    "isWaitingForFlow": true,
    "isWaitingForQuestion": false,
    "expiresAt": "2024-01-15T10:40:00Z",
    "isExpired": false,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:35:00Z",
    "ageMinutes": 5
  }
]
```

---

### Get Context Statistics
`GET /api/chatbots/debug/contexts/stats`

Returns aggregated statistics about chatbot contexts.

**Response:** `200 OK`
```json
{
  "activeContexts": 12,
  "expiredContexts": 3,
  "waitingForFlow": 5,
  "waitingForQuestion": 2
}
```

---

### Force Complete Context
`POST /api/chatbots/debug/contexts/:contextId/force-complete`

Force completes a stuck context (admin only).

**Response:** `200 OK`
```json
{
  "message": "Context force completed successfully",
  "contextId": "ctx-uuid"
}
```

**Response (Not Found):** `404 Not Found`
```json
{
  "message": "Context not found",
  "contextId": "ctx-uuid"
}
```

---

### Manual Cleanup Trigger
`POST /api/chatbots/debug/cleanup`

Manually triggers the cleanup of expired contexts.

**Response:** `200 OK`
```json
{
  "message": "Cleanup completed",
  "cleanedCount": 5
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "ChatBot not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Swagger Documentation

All endpoints are documented with Swagger decorators:
- `@ApiOperation` - Endpoint description
- `@ApiParam` - Path parameter documentation
- `@ApiResponse` - Response schema and status codes
- `@ApiTags` - Grouped under "ChatBots"

Access Swagger UI at: `http://localhost:3000/api/docs`
