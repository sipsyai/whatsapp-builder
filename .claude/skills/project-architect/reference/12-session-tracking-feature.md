# Session Tracking Feature - WhatsApp Builder

## Overview

The Session Tracking feature provides comprehensive monitoring and management of chatbot conversations. It enables real-time tracking of user interactions, session status, and message flow with enhanced metadata for better bot/user differentiation.

## Architecture

### Backend Components

#### SessionHistoryService (`backend/src/modules/chatbots/services/session-history.service.ts`)
- Session lifecycle management
- Message retrieval with enhanced metadata
- Bot detection logic

**Key Enhancements**:
1. **Bot Message Detection**: Automatically identifies messages sent by the bot by comparing senderId with Business user
2. **Enhanced Message Data**: Includes sender phone, name, and isFromBot flag
3. **Session Start Buffer**: 1-second buffer to capture session's first message

```typescript
// Bot detection implementation
const businessUser = context.conversation?.participants?.find(
  (p) => p.name === 'Business',
);

// Session start buffer for first message capture
const sessionStartBuffer = new Date(context.createdAt.getTime() - 1000);

// Enhanced message mapping
return messages.map((message) => ({
  id: message.id,
  senderId: message.senderId,
  senderPhone: message.sender?.phoneNumber,
  senderName: message.sender?.name,
  isFromBot: businessUser ? message.senderId === businessUser.id : false,
  type: message.type,
  content: message.content,
  status: message.status,
  timestamp: message.timestamp,
}));
```

#### MessageDto (`backend/src/modules/chatbots/dto/session.dto.ts`)
Enhanced DTO with new fields:
- `senderPhone?` (string) - Sender's phone number
- `senderName?` (string) - Sender's name (e.g., 'Business' for bot)
- `isFromBot?` (boolean) - Whether message is from bot

### Frontend Components

#### SessionsListPage (`frontend/src/features/sessions/components/SessionsListPage.tsx`)
- Tab-based UI (Active/Completed)
- Real-time session updates via WebSocket
- Session filtering and pagination

#### SessionDetailPage (`frontend/src/features/sessions/components/SessionDetailPage.tsx`)
- Split-view layout (60% conversation, 40% variables)
- Real-time message updates
- Session control (stop active sessions)

#### ConversationLog (`frontend/src/features/sessions/components/ConversationLog.tsx`)
- Message rendering with sender differentiation
- Interactive message visualization (buttons, lists, flows)
- WhatsApp Flow response display (nfm_reply)

## Data Flow

### Session Message Retrieval

```
GET /api/sessions/{sessionId}/messages
  -> SessionHistoryService.getSessionMessages()
    -> Load conversation context with participants
    -> Identify Business user (bot)
    -> Query messages with 1-second buffer
    -> Map messages with enhanced fields:
      - senderPhone (from sender.phoneNumber)
      - senderName (from sender.name)
      - isFromBot (compare senderId with Business user ID)
  -> Return enriched message array
```

### Real-time Updates

```
WebSocket Event: session:message-sent
  -> Frontend receives message data
  -> Check isFromBot flag
  -> Render message in appropriate side (left=bot, right=user)
  -> Update conversation log
```

## Bot Detection Logic

### Backend (Primary)

The backend determines `isFromBot` by:
1. Loading conversation participants
2. Finding Business user (name === 'Business')
3. Comparing message senderId with Business user ID

### Frontend (Fallback)

If `isFromBot` is undefined, frontend uses heuristics:

```typescript
const determineIsFromBot = (message: SessionMessage): boolean => {
  const content = message.content;

  // User response types - definitely from user
  if (content?.type === 'button_reply' ||
      content?.type === 'list_reply' ||
      content?.type === 'nfm_reply') {
    return false;
  }

  // Interactive message with action - from bot
  if (message.type === 'interactive' && content?.action) {
    return true;
  }

  // senderName 'Business' indicates bot
  if (message.senderName === 'Business') {
    return true;
  }

  // senderPhone exists and not Business - user
  if (message.senderPhone && message.senderName !== 'Business') {
    return false;
  }

  // Default: assume bot
  return true;
};

// Usage
const isFromBot = message.isFromBot ?? determineIsFromBot(message);
```

## Interactive Message Types

### 1. Button Reply (`button_reply`)
- User clicked a reply button
- Content: `{ type: 'button_reply', buttonTitle, buttonId }`
- UI: Icon (touch_app) + title + ID

### 2. List Reply (`list_reply`)
- User selected from a list
- Content: `{ type: 'list_reply', listTitle, listDescription, listId }`
- UI: Icon (list) + title + description + ID

### 3. Flow Completion (`nfm_reply`)
- User completed a WhatsApp Flow
- Content: `{ type: 'nfm_reply', body?, response_json }`
- UI: Icon (check_circle) + "Form Completed" + body + expandable JSON

```typescript
// nfm_reply rendering
else if (content?.type === 'nfm_reply') {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-sm">check_circle</span>
        <p className="text-sm font-medium">Form Completed</p>
      </div>
      {content.body && (
        <p className="text-xs opacity-75">{content.body}</p>
      )}
      {content.response_json && (
        <details className="text-xs">
          <summary className="cursor-pointer opacity-75 hover:opacity-100">
            View submitted data
          </summary>
          <pre className="mt-1 bg-black/10 dark:bg-white/10 p-2 rounded overflow-x-auto">
            {JSON.stringify(content.response_json, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
```

## API Endpoints

### Get Session Messages
```
GET /api/sessions/:sessionId/messages

Response: {
  messages: [
    {
      id: string,
      senderId: string,
      senderPhone?: string,
      senderName?: string,
      isFromBot?: boolean,
      type: string,
      content: any,
      status: string,
      timestamp: Date
    }
  ]
}
```

### WebSocket Events

**Inbound (Client -> Server)**:
- `session:join` - Join session room for updates
- `session:leave` - Leave session room

**Outbound (Server -> Client)**:
- `session:message-sent` - New message sent in session (includes isFromBot)
- `session:node-executed` - ChatBot node executed
- `session:status-changed` - Session status changed
- `session:completed` - Session completed

## Visual Design

### Message Alignment
- **Bot messages**: Left-aligned, gray background
- **User messages**: Right-aligned, blue background

### Interactive Response Icons
- `touch_app` - Button response
- `list` - List response
- `check_circle` - Flow completion

### Dark Mode
Full dark mode support with appropriate color adjustments.

## Related Documentation

- [Backend Architecture](./02-backend-architecture.md) - SessionHistoryService and DTOs
- [Frontend Architecture](./03-frontend-architecture.md) - Session components
- [Real-time System](./05-real-time-system.md) - WebSocket integration
