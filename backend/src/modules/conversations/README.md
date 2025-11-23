# Conversations Module

This module manages conversations and messages for the WhatsApp Web Clone backend.

## Overview

The Conversations module provides RESTful API endpoints for managing conversations and messages, integrating with the WhatsApp Business Messaging API to send and receive messages.

## Features

- Get all conversations
- Get messages for a conversation with pagination
- Send messages (text, image, video, document, audio, interactive)
- Mark conversations as read
- Integration with WhatsApp Messaging API
- Full request/response validation using DTOs
- Proper error handling

## API Endpoints

### 1. Get All Conversations

```
GET /api/conversations
```

**Response:**
```json
[
  {
    "id": "1234567890",
    "name": "John Doe",
    "avatar": "https://ui-avatars.com/api/?name=John+Doe",
    "lastMessage": "Hey, how are you?",
    "unreadCount": 2,
    "timestamp": "10:30 AM"
  }
]
```

### 2. Get Messages for a Conversation

```
GET /api/conversations/:id/messages?limit=50&before=msg_123
```

**Query Parameters:**
- `limit` (optional): Number of messages to fetch (default: 50)
- `before` (optional): Message ID for pagination

**Response:**
```json
{
  "messages": [
    {
      "id": "msg_1",
      "sender": "them",
      "type": "text",
      "content": "Hello!",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "status": "delivered"
    }
  ],
  "total": 100,
  "hasMore": true
}
```

### 3. Send a Message

```
POST /api/conversations/:id/messages
```

**Request Body (Text Message):**
```json
{
  "type": "text",
  "content": "Hello, how are you?"
}
```

**Request Body (Image Message):**
```json
{
  "type": "image",
  "content": {
    "url": "https://example.com/image.jpg",
    "caption": "Check this out!"
  }
}
```

**Request Body (Interactive Message):**
```json
{
  "type": "interactive",
  "content": {
    "header": {
      "text": "Choose an option"
    },
    "body": {
      "text": "Please select from the following:"
    },
    "footer": {
      "text": "Powered by WhatsApp"
    },
    "action": {
      "buttons": [
        {
          "id": "btn_1",
          "title": "Option 1"
        },
        {
          "id": "btn_2",
          "title": "Option 2"
        }
      ]
    }
  }
}
```

**Response:**
```json
{
  "id": "msg_123",
  "sender": "me",
  "type": "text",
  "content": "Hello, how are you?",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": "sent"
}
```

### 4. Mark Conversation as Read

```
POST /api/conversations/:id/read
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation marked as read"
}
```

## Message Types

The module supports the following message types:

- **text**: Plain text messages
- **image**: Image messages with optional captions
- **video**: Video messages
- **document**: Document messages
- **audio**: Audio messages
- **sticker**: Sticker messages
- **interactive**: Interactive messages with buttons or lists

## DTOs (Data Transfer Objects)

### Request DTOs

- `GetMessagesDto`: Pagination parameters for getting messages
- `SendMessageDto`: Message type and content for sending messages
- `InteractiveMessageContentDto`: Interactive message structure
- `ImageMessageContentDto`: Image message structure
- `DocumentMessageContentDto`: Document message structure

### Response DTOs

- `ConversationResponseDto`: Single conversation response
- `ConversationsListResponseDto`: List of conversations
- `MessageResponseDto`: Single message response
- `MessagesListResponseDto`: Paginated messages list
- `SuccessResponseDto`: Generic success response

## Architecture

```
conversations/
├── conversations.controller.ts    # REST API endpoints
├── conversations.service.ts       # Business logic
├── conversations.module.ts        # Module definition
├── interfaces/
│   └── conversation.interface.ts  # Core interfaces and enums
├── dto/
│   ├── requests/
│   │   ├── get-messages.dto.ts    # Pagination DTO
│   │   └── send-message.dto.ts    # Send message DTO
│   └── responses/
│       ├── conversation.response.dto.ts
│       ├── message.response.dto.ts
│       └── success.response.dto.ts
└── README.md
```

## Integration with WhatsApp API

The module integrates with the WhatsApp Business Messaging API through the `WhatsAppMessageService`:

- Text messages are automatically sent via WhatsApp API
- Message status is updated based on delivery
- Other message types are prepared for WhatsApp API integration

## Current Implementation

**Note:** The current implementation uses in-memory storage (Map objects) for conversations and messages. This is a placeholder for development and testing.

**When database is configured:**
1. Replace `Map` storage with database queries
2. Use TypeORM repositories for data persistence
3. Update service methods to use database operations
4. Add database entities (Conversation, Message)

## Error Handling

The module includes proper error handling:

- `NotFoundException`: When conversation is not found
- Validation errors: For invalid request data
- WhatsApp API errors: Logged but don't prevent message storage

## Future Enhancements

1. Database integration with TypeORM
2. WebSocket support for real-time updates
3. Support for more message types (video, audio, documents)
4. Message search functionality
5. Conversation filtering and sorting
6. Typing indicators
7. Message reactions
8. Read receipts via WhatsApp API

## Dependencies

- `@nestjs/common`: NestJS framework
- `class-validator`: Request validation
- `class-transformer`: DTO transformation
- `WhatsAppModule`: WhatsApp API integration

## Usage Example

```typescript
// In another module
import { ConversationsService } from './modules/conversations/conversations.service';

export class MyService {
  constructor(private conversationsService: ConversationsService) {}

  async sendWelcomeMessage(conversationId: string) {
    return this.conversationsService.sendMessage(conversationId, {
      type: MessageType.TEXT,
      content: 'Welcome to our service!',
    });
  }
}
```

## Testing

To test the endpoints:

```bash
# Get all conversations
curl http://localhost:3000/api/conversations

# Get messages for a conversation
curl http://localhost:3000/api/conversations/1234567890/messages?limit=10

# Send a text message
curl -X POST http://localhost:3000/api/conversations/1234567890/messages \
  -H "Content-Type: application/json" \
  -d '{"type":"text","content":"Hello!"}'

# Mark as read
curl -X POST http://localhost:3000/api/conversations/1234567890/read
```

## Contributing

When adding new features:

1. Add DTOs for request/response validation
2. Update service methods with proper error handling
3. Add JSDoc comments for documentation
4. Update this README with new endpoints
5. Add unit tests for new functionality
