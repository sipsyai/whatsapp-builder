# Session Tracking Feature - WhatsApp Builder

## Overview

The Session Tracking feature provides comprehensive monitoring and management of chatbot conversations. It enables real-time tracking of user interactions, session status, and message flow with enhanced metadata for better bot/user differentiation.

**Live at**: https://whatsapp.sipsy.ai/#sessions

## Key Features

### Search & Filtering
- **Search by Name/Phone**: Debounced search input for customer name or phone number
- **Date Range Filtering**: Start and end date pickers to filter sessions
- **Chatbot Filter**: Filter sessions by specific chatbot
- **Tab Navigation**: Active vs Completed sessions

### Export & Management
- **CSV Export**: Export session list with all metadata
- **JSON Export**: Export session data in JSON format
- **Session Deletion**: Delete completed sessions (with confirmation)

### URL Deep Linking
- **Hash-based Routing**: `#sessions` for list, `#sessions/{sessionId}` for detail
- **Browser Navigation**: Back/forward button support
- **Direct URL Access**: Share session URLs directly

### Statistics
- **Active Sessions Counter**: Real-time count with pulse animation
- **Completed Today**: Today's completed session count
- **Yesterday Counter**: Shows completed yesterday count for context
- **Total Sessions**: Paginated total with navigation

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
- Split-view layout (60% conversation, 40% timeline/variables)
- Real-time message updates via WebSocket
- Session control (stop active sessions)
- Socket event listeners for live updates

#### ConversationLog (`frontend/src/features/sessions/components/ConversationLog.tsx`)
- Message rendering with sender differentiation
- Bot detection fallback mechanism
- Interactive message visualization (buttons, lists, flows)
- WhatsApp Flow response display (nfm_reply) with form data filtering
- Auto-scroll to bottom on new messages
- Date grouping (Today, Yesterday, specific dates)
- Dark mode support

#### SessionTimeline (`frontend/src/features/sessions/components/SessionTimeline.tsx`) **NEW**
- Visual timeline of all session events
- Event types: message_user, message_bot, session_start, session_end
- WhatsApp Flow completion visualization (nfm_reply)
- Date grouping with timestamps
- Active session indicator with current node

#### VariablesPanel (`frontend/src/features/sessions/components/VariablesPanel.tsx`)
- Collapsible panel design
- Copy to clipboard functionality
- Complex value (JSON) rendering with syntax highlighting
- Variable count badge
- Dark mode support

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

### Get Sessions (with Filters)
```
GET /api/chatbot-sessions

Query Parameters:
- status: 'active' | 'completed' | 'all'
- chatbotId: string (optional)
- search: string (optional) - Search by customer name or phone
- startDate: string (optional) - ISO date format
- endDate: string (optional) - ISO date format
- limit: number (default: 20)
- offset: number (default: 0)
- sortBy: 'startedAt' | 'updatedAt'
- sortOrder: 'ASC' | 'DESC'

Response: {
  data: ChatbotSession[],
  total: number,
  limit: number,
  offset: number,
  hasNext: boolean,
  hasPrevious: boolean
}
```

### Delete Session
```
DELETE /api/chatbot-sessions/:id

Response: 204 No Content

Errors:
- 400: Cannot delete active session
- 404: Session not found
```

### Get Session Messages
```
GET /api/chatbot-sessions/:sessionId/messages

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

## SessionTimeline Component

The SessionTimeline component provides a comprehensive visual timeline of all session events.

### Event Types

```typescript
interface TimelineEvent {
  id: string;
  type: 'message_user' | 'message_bot' | 'node_change' | 'status_change' | 'session_start' | 'session_end';
  timestamp: Date;
  title: string;
  description?: string;
  icon: string;
  iconColor: string;
  data?: any;
}
```

### Event Detection Logic

```typescript
// Build timeline events from messages and session data
const timelineEvents = useMemo(() => {
  const events: TimelineEvent[] = [];

  // Session start event
  events.push({
    id: 'session-start',
    type: 'session_start',
    timestamp: new Date(session.startedAt),
    title: 'Session Started',
    description: `Chatbot: ${session.chatbotName}`,
    icon: 'play_circle',
    iconColor: 'text-green-500',
  });

  // Process messages
  messages.forEach((msg) => {
    const isFromBot = msg.isFromBot ?? (msg.senderName === 'Business' || !msg.senderPhone);
    const messageType = msg.content?.type || msg.type;

    // Determine title, description, icon based on message type
    // ... (button_reply, list_reply, nfm_reply, etc.)

    events.push({ id: msg.id, type: isFromBot ? 'message_bot' : 'message_user', ... });
  });

  // Session end event (if completed)
  if (session.completedAt) {
    // ... (completed, expired, stopped states)
  }

  return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}, [messages, session]);
```

### nfm_reply Event Handling

```typescript
else if (messageType === 'nfm_reply') {
  title = 'Flow Form Submitted';
  const flowData = msg.content?.responseData || msg.content?.response_json;
  const parsedData = typeof flowData === 'string' ? JSON.parse(flowData) : flowData;
  const fieldCount = parsedData
    ? Object.keys(parsedData).filter(k => !['flow_token', 'version'].includes(k)).length
    : 0;
  description = fieldCount > 0 ? `${fieldCount} fields submitted` : 'Form completed';
  icon = 'check_circle';
  iconColor = 'text-green-500';
}
```

### Session End States

| Status | Title | Icon | Color |
|--------|-------|------|-------|
| completed | Session Completed | check_circle | green-500 |
| expired | Session Expired | timer_off | orange-500 |
| stopped | Session Stopped | cancel | red-500 |

### Visual Design

- Vertical timeline with date grouping
- Icon-based event type indicators
- Color-coded icons by event type
- Active session indicator with pulse animation
- Current node label display

## ConversationLog Enhanced nfm_reply Rendering

The ConversationLog component now includes enhanced handling for WhatsApp Flow completions:

```typescript
else if (content?.type === 'nfm_reply') {
  // Parse flow data from responseData or response_json
  const flowData = content.responseData || content.response_json;
  const parsedData = typeof flowData === 'string' ? JSON.parse(flowData) : flowData;

  // Filter internal fields (flow_token, version)
  const displayData = parsedData ? Object.fromEntries(
    Object.entries(parsedData).filter(([key]) => !['flow_token', 'version'].includes(key))
  ) : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-sm text-green-600">check_circle</span>
        <p className="text-sm font-medium">Form Completed</p>
      </div>
      {displayData && Object.keys(displayData).length > 0 && (
        <details className="text-xs" open>
          <summary className="cursor-pointer font-medium text-blue-600">
            View form data ({Object.keys(displayData).length} fields)
          </summary>
          <div className="mt-2 space-y-1.5 bg-gray-50 dark:bg-gray-900 p-2 rounded">
            {Object.entries(displayData).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-2">
                <span className="text-gray-500 font-medium">{key}:</span>
                <span className="text-gray-900 text-right">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
```

### Key Features

1. **Internal Field Filtering**: Removes `flow_token` and `version` from display
2. **Expandable Details**: Uses `<details>` element for collapsible form data
3. **Field Count Display**: Shows number of submitted fields
4. **Value Formatting**: Handles both primitive and object values
5. **Dark Mode Support**: Proper color classes for dark mode

## VariablesPanel Component

Enhanced panel for displaying session context variables:

### Features

1. **Collapsible Panel**: Toggle visibility with expand/collapse button
2. **Copy to Clipboard**: Click to copy any variable value
3. **Complex Value Rendering**: JSON syntax highlighting for objects/arrays
4. **Variable Count Badge**: Shows total number of variables

### Implementation

```typescript
const copyToClipboard = async (key: string, value: any) => {
  await navigator.clipboard.writeText(formatValue(value));
  setCopiedKey(key);
  setTimeout(() => setCopiedKey(null), 2000);
};

const formatValue = (value: any): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

const isComplexValue = (value: any): boolean => {
  return value !== null && typeof value === 'object';
};
```

## URL Routing Implementation

### Hash-based Navigation (`frontend/src/app/App.tsx`)

The application uses hash-based routing for deep linking without requiring React Router:

```typescript
// Parse URL hash to determine initial view state
const parseUrlHash = (): { view: ExtendedViewState; sessionId?: string } => {
  const hash = window.location.hash.slice(1);
  if (!hash) return { view: "chatbots" };

  // Parse /sessions/:sessionId format
  const sessionMatch = hash.match(/^sessions\/([a-f0-9-]+)$/i);
  if (sessionMatch) {
    return { view: "sessionDetail", sessionId: sessionMatch[1] };
  }

  const viewMap: Record<string, ExtendedViewState> = {
    'chatbots': 'chatbots',
    'sessions': 'sessions',
    'users': 'users',
    'flows': 'flows',
    'flowBuilder': 'flowBuilder',
    'settings': 'settings',
    'builder': 'builder',
  };

  return { view: viewMap[hash] || "chatbots" };
};

// Update URL hash based on current view
const updateUrlHash = (view: ExtendedViewState, sessionId?: string | null) => {
  let hash = '';
  if (view === 'sessionDetail' && sessionId) {
    hash = `sessions/${sessionId}`;
  } else if (view !== 'chatbots') {
    hash = view;
  }
  window.history.replaceState(null, '', hash ? `#${hash}` : window.location.pathname);
};
```

### URL Patterns

| URL | View | Description |
|-----|------|-------------|
| `#chatbots` | ChatBotsListPage | Default landing page |
| `#sessions` | SessionsListPage | Sessions list view |
| `#sessions/{uuid}` | SessionDetailPage | Session detail view |
| `#users` | UsersPage | User management |
| `#flows` | FlowsPage | WhatsApp flows |
| `#settings` | WhatsappConfigPage | Settings page |

## Export Implementation

### CSV Export (`frontend/src/features/sessions/components/SessionsListPage.tsx`)

```typescript
const exportToCSV = () => {
  const headers = ['ID', 'Customer Name', 'Customer Phone', 'Chatbot', 'Status',
                   'Started At', 'Updated At', 'Completed At', 'Nodes', 'Messages'];
  const rows = sessions.map(s => [
    s.id,
    s.customerName || 'Unknown',
    s.customerPhone,
    s.chatbotName,
    s.status,
    new Date(s.startedAt).toLocaleString(),
    new Date(s.updatedAt).toLocaleString(),
    s.completedAt ? new Date(s.completedAt).toLocaleString() : '',
    s.nodeCount,
    s.messageCount,
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sessions_${currentTab}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};
```

## Session Deletion

### Backend Implementation (`backend/src/modules/chatbots/services/session-history.service.ts`)

```typescript
async deleteSession(sessionId: string): Promise<void> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const context = await queryRunner.manager.findOne(ConversationContext, {
      where: { id: sessionId },
    });

    if (!context) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // Only allow deleting completed/inactive sessions
    if (context.isActive) {
      throw new BadRequestException(
        'Cannot delete an active session. Please stop the session first.',
      );
    }

    await queryRunner.manager.remove(ConversationContext, context);
    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

### Frontend Delete Handler

```typescript
const handleDeleteSession = async (sessionId: string) => {
  try {
    await SessionsService.deleteSession(sessionId);
    setToast({ message: 'Session deleted successfully', type: 'success' });
    loadSessions(); // Refresh list
  } catch (err: any) {
    setToast({
      message: err.response?.data?.message || 'Failed to delete session',
      type: 'error',
    });
  }
};
```

## Related Documentation

- [Backend Architecture](./02-backend-architecture.md) - SessionHistoryService and DTOs
- [Frontend Architecture](./03-frontend-architecture.md) - Session components
- [Real-time System](./05-real-time-system.md) - WebSocket integration
