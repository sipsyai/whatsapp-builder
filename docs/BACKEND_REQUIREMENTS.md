# Backend Requirements for WhatsApp Web Clone

This document outlines the backend API endpoints and data structures required to support the WhatsApp Web clone frontend interface.

## Data Structures

### Conversation
Represents a chat thread.

```typescript
interface Conversation {
  id: string;
  name: string;
  avatar: string; // URL to profile picture
  lastMessage: string; // Preview of the last message
  unreadCount: number;
  timestamp: string; // Formatted time string (e.g., "10:30 AM", "Yesterday")
  // In a real app, messages might be fetched separately or paginated
  messages: Message[]; 
}
```

### Message
Represents a single message within a conversation.

```typescript
interface Message {
  id: string;
  sender: "me" | "them";
  type: "text" | "image" | "video" | "document" | "audio" | "sticker" | "interactive";
  content: any; // Structure depends on type
  timestamp: string;
  status: "sent" | "delivered" | "read";
}
```

#### Message Content Types

- **Text**: `string`
- **Image**: `{ url: string, caption?: string }`
- **Document**: `{ fileName: string, fileSize: string, url: string }`
- **Interactive**: 
  ```typescript
  {
      header?: { text: string };
      body: { text: string };
      footer?: { text: string };
      action: {
          buttons?: { id: string, title: string }[];
          sections?: { title: string, rows: { id: string, title: string, description?: string }[] }[];
      }
  }
  ```

## API Endpoints

### 1. Get Conversations
Fetch the list of active conversations for the sidebar.

- **Endpoint**: `GET /api/conversations`
- **Response**: `Conversation[]` (without full message history, maybe just last message)

### 2. Get Messages
Fetch message history for a specific conversation.

- **Endpoint**: `GET /api/conversations/:id/messages`
- **Query Params**: 
  - `limit`: Number of messages to fetch (default 50)
  - `before`: Timestamp/ID for pagination
- **Response**: `Message[]`

### 3. Send Message
Send a new message to a conversation.

- **Endpoint**: `POST /api/conversations/:id/messages`
- **Body**:
  ```json
  {
    "type": "text",
    "content": "Hello world"
  }
  ```
  *(For media, content would be the media object or ID after upload)*
- **Response**: `Message` (the created message object)

### 4. Mark as Read
Mark all messages in a conversation as read.

- **Endpoint**: `POST /api/conversations/:id/read`
- **Response**: `{ success: true }`

### 5. Upload Media
Upload media files (images, documents) before sending.

- **Endpoint**: `POST /api/upload`
- **Body**: `FormData` with file
- **Response**: 
  ```json
  {
    "url": "https://...",
    "fileName": "image.png",
    "fileSize": "1.2 MB"
  }
  ```

## Real-time Updates (WebSockets)

The frontend expects real-time updates for:
1.  **New Messages**: When a message is received from the "other" side.
2.  **Message Status**: When a sent message is delivered or read.
3.  **Presence**: Online status / typing indicators (optional).

**Socket Events:**
- `message:received`: Payload `Message` & `conversationId`
- `message:status`: Payload `{ messageId: string, status: "delivered" | "read" }`

## Integration with WhatsApp Business API

The backend should act as a middleware between this frontend and the WhatsApp Business Cloud API.
- **Incoming Webhooks**: Receive messages from WhatsApp -> Store in DB -> Emit via Socket -> Frontend.
- **Outgoing API Calls**: Frontend sends message -> Backend calls WhatsApp API -> Updates DB -> Returns success.
