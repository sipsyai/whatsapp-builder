# Frontend Webhook Entegrasyonu Kılavuzu

Bu doküman, backend'de eklenen webhook özelliklerinin (reaction messages, media URL parsing, 24-hour window tracking) frontend tarafında nasıl entegre edileceğini adım adım açıklar.

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [API Servislerini Güncelleme](#api-servislerini-güncelleme)
3. [WebSocket Entegrasyonu](#websocket-entegrasyonu)
4. [Conversation Komponenti](#conversation-komponenti)
5. [Message Components](#message-components)
6. [24-Hour Window Göstergesi](#24-hour-window-göstergesi)
7. [Reaction Messages UI](#reaction-messages-ui)
8. [Media Mesajları](#media-mesajları)
9. [TypeScript Tipleri](#typescript-tipleri)
10. [Best Practices](#best-practices)

---

## 🎯 Genel Bakış

### Backend'de Eklenen Özellikler

1. **Reaction Messages**: Kullanıcıların gönderdiği emoji reaksiyonları
2. **Media URL Parsing**: Image, video, audio, document URL'leri
3. **24-Hour Window Tracking**: Ücretsiz mesaj penceresinin takibi

### Frontend'de Yapılacaklar

1. API servislerini genişletme
2. WebSocket ile real-time message updates
3. Yeni mesaj tiplerini gösterme (reaction)
4. Media mesajlarını gösterme (URL'lerle)
5. 24-hour window göstergesi ekleme

---

## 🔧 API Servislerini Güncelleme

### 1. TypeScript Type Definitions

`frontend/src/types/messages.ts` dosyası oluşturun:

```typescript
// Message Types
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  STICKER = 'sticker',
  INTERACTIVE = 'interactive',
  REACTION = 'reaction', // 🆕 YENİ
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

// Base Message Interface
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: MessageContent;
  status: MessageStatus;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Message Content Types
export type MessageContent =
  | TextMessageContent
  | ImageMessageContent
  | VideoMessageContent
  | AudioMessageContent
  | DocumentMessageContent
  | StickerMessageContent
  | ReactionMessageContent // 🆕 YENİ
  | InteractiveMessageContent;

// Text Message
export interface TextMessageContent {
  whatsappMessageId: string;
  body: string;
}

// Image Message
export interface ImageMessageContent {
  whatsappMessageId: string;
  id: string;
  url?: string; // 🆕 YENİ - Backend'den geliyor
  mimeType: string;
  sha256: string;
  caption?: string;
}

// Video Message
export interface VideoMessageContent {
  whatsappMessageId: string;
  id: string;
  url?: string; // 🆕 YENİ
  mimeType: string;
  sha256: string;
  caption?: string;
}

// Audio Message
export interface AudioMessageContent {
  whatsappMessageId: string;
  id: string;
  url?: string; // 🆕 YENİ
  mimeType: string;
  sha256: string;
  voice: boolean;
}

// Document Message
export interface DocumentMessageContent {
  whatsappMessageId: string;
  id: string;
  url?: string; // 🆕 YENİ
  mimeType: string;
  sha256: string;
  filename: string;
  caption?: string;
}

// Sticker Message
export interface StickerMessageContent {
  whatsappMessageId: string;
  id: string;
  url?: string; // 🆕 YENİ
  mimeType: string;
  sha256: string;
  animated: boolean;
}

// Reaction Message (🆕 YENİ)
export interface ReactionMessageContent {
  whatsappMessageId: string;
  messageId: string; // Hangi mesaja reaction yapıldı
  emoji: string; // Hangi emoji kullanıldı
}

// Interactive Message
export interface InteractiveMessageContent {
  whatsappMessageId: string;
  type: 'button_reply' | 'list_reply';
  buttonId?: string;
  buttonTitle?: string;
  listId?: string;
  listTitle?: string;
  listDescription?: string;
}

// Conversation Interface
export interface Conversation {
  id: string;
  participants: User[];
  messages: Message[];
  lastMessage: string;
  lastMessageAt: Date;
  lastCustomerMessageAt: Date | null; // 🆕 YENİ
  isWindowOpen: boolean; // 🆕 YENİ
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  phoneNumber: string;
  name: string;
  avatar?: string;
}
```

### 2. API Service - Messages

`frontend/src/api/messages.service.ts` dosyası oluşturun:

```typescript
import { client } from './client';
import { Message, Conversation } from '../types/messages';

export class MessagesService {
  /**
   * Get all messages for a conversation
   */
  static async getMessages(
    conversationId: string,
    limit = 50,
    before?: string
  ): Promise<Message[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(before && { before }),
    });

    const response = await client.get<Message[]>(
      `/api/conversations/${conversationId}/messages?${params}`
    );

    return response.data;
  }

  /**
   * Send a text message
   */
  static async sendTextMessage(
    conversationId: string,
    body: string
  ): Promise<Message> {
    const response = await client.post<Message>(
      `/api/conversations/${conversationId}/messages`,
      {
        type: 'text',
        content: { body },
      }
    );

    return response.data;
  }

  /**
   * Mark conversation as read
   */
  static async markAsRead(conversationId: string): Promise<void> {
    await client.post(
      `/api/conversations/${conversationId}/messages/read`
    );
  }

  /**
   * Download media file by ID
   */
  static async downloadMedia(mediaId: string): Promise<Blob> {
    const response = await client.get(`/api/whatsapp/media/${mediaId}`, {
      responseType: 'blob',
    });

    return response.data;
  }
}
```

### 3. API Service - Conversations

`frontend/src/api/conversations.service.ts` dosyası oluşturun:

```typescript
import { client } from './client';
import { Conversation } from '../types/messages';

export class ConversationsService {
  /**
   * Get all conversations
   */
  static async getConversations(): Promise<Conversation[]> {
    const response = await client.get<Conversation[]>('/api/conversations');
    return response.data;
  }

  /**
   * Get a specific conversation
   */
  static async getConversation(conversationId: string): Promise<Conversation> {
    const response = await client.get<Conversation>(
      `/api/conversations/${conversationId}`
    );
    return response.data;
  }

  /**
   * Create a new conversation
   */
  static async createConversation(
    participantIds: string[]
  ): Promise<Conversation> {
    const response = await client.post<Conversation>('/api/conversations', {
      participantIds,
    });
    return response.data;
  }

  /**
   * Check 24-hour window status (🆕 YENİ)
   */
  static async checkWindowStatus(conversationId: string): Promise<{
    isOpen: boolean;
    remainingMinutes: number;
  }> {
    const conversation = await this.getConversation(conversationId);

    if (!conversation.lastCustomerMessageAt) {
      return { isOpen: false, remainingMinutes: 0 };
    }

    const now = new Date();
    const lastMessageTime = new Date(conversation.lastCustomerMessageAt);
    const elapsedMs = now.getTime() - lastMessageTime.getTime();
    const windowDurationMs = 24 * 60 * 60 * 1000; // 24 hours
    const remainingMs = Math.max(0, windowDurationMs - elapsedMs);
    const remainingMinutes = Math.floor(remainingMs / 1000 / 60);

    return {
      isOpen: conversation.isWindowOpen && remainingMs > 0,
      remainingMinutes,
    };
  }
}
```

---

## 🔌 WebSocket Entegrasyonu

### 1. WebSocket Hook

`frontend/src/hooks/useWebSocket.ts` dosyası oluşturun:

```typescript
import { useEffect, useState } from 'react';
import { socket } from '../api/socket';
import { Message } from '../types/messages';

interface UseWebSocketReturn {
  connected: boolean;
  newMessage: Message | null;
  messageStatusUpdate: {
    messageId: string;
    status: string;
  } | null;
}

export function useWebSocket(): UseWebSocketReturn {
  const [connected, setConnected] = useState(false);
  const [newMessage, setNewMessage] = useState<Message | null>(null);
  const [messageStatusUpdate, setMessageStatusUpdate] = useState<{
    messageId: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    socket.connect();

    // Connection events
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    // Message events
    socket.on('message:new', (message: Message) => {
      console.log('New message received:', message);
      setNewMessage(message);
    });

    socket.on('message:status', (data: { messageId: string; status: string }) => {
      console.log('Message status update:', data);
      setMessageStatusUpdate(data);
    });

    // Cleanup
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('message:new');
      socket.off('message:status');
      socket.disconnect();
    };
  }, []);

  return { connected, newMessage, messageStatusUpdate };
}
```

### 2. WebSocket Hook Kullanımı

```typescript
import { useWebSocket } from '../hooks/useWebSocket';

function ChatComponent() {
  const { connected, newMessage, messageStatusUpdate } = useWebSocket();
  const [messages, setMessages] = useState<Message[]>([]);

  // Yeni mesaj geldiğinde
  useEffect(() => {
    if (newMessage) {
      setMessages(prev => [...prev, newMessage]);
    }
  }, [newMessage]);

  // Mesaj durumu güncellendiğinde
  useEffect(() => {
    if (messageStatusUpdate) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageStatusUpdate.messageId
            ? { ...msg, status: messageStatusUpdate.status }
            : msg
        )
      );
    }
  }, [messageStatusUpdate]);

  return (
    <div>
      {connected ? (
        <span>🟢 Connected</span>
      ) : (
        <span>🔴 Disconnected</span>
      )}
      {/* ... */}
    </div>
  );
}
```

---

## 💬 Conversation Komponenti

### Conversation List

`frontend/src/features/conversations/ConversationList.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { ConversationsService } from '../../api/conversations.service';
import { Conversation } from '../../types/messages';
import { ConversationItem } from './ConversationItem';

export function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await ConversationsService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="conversation-list">
      {conversations.map(conversation => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
        />
      ))}
    </div>
  );
}
```

### Conversation Item

`frontend/src/features/conversations/ConversationItem.tsx`:

```typescript
import React from 'react';
import { Conversation } from '../../types/messages';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface ConversationItemProps {
  conversation: Conversation;
}

export function ConversationItem({ conversation }: ConversationItemProps) {
  const lastMessageTime = conversation.lastMessageAt
    ? formatDistanceToNow(new Date(conversation.lastMessageAt), {
        addSuffix: true,
        locale: tr,
      })
    : '';

  // 🆕 24-hour window göstergesi
  const windowStatusIcon = conversation.isWindowOpen ? '🟢' : '🔴';
  const windowStatusText = conversation.isWindowOpen
    ? 'Pencere açık'
    : 'Pencere kapalı';

  return (
    <div className="conversation-item">
      <div className="conversation-avatar">
        {conversation.participants[0]?.avatar ? (
          <img src={conversation.participants[0].avatar} alt="Avatar" />
        ) : (
          <div className="avatar-placeholder">
            {conversation.participants[0]?.name?.[0] || '?'}
          </div>
        )}
      </div>

      <div className="conversation-content">
        <div className="conversation-header">
          <h3>{conversation.participants[0]?.name || 'Unknown'}</h3>
          <span className="conversation-time">{lastMessageTime}</span>
        </div>

        <div className="conversation-preview">
          <p>{conversation.lastMessage}</p>
        </div>

        {/* 🆕 24-Hour Window Badge */}
        <div className="conversation-window-status" title={windowStatusText}>
          {windowStatusIcon} {windowStatusText}
        </div>
      </div>
    </div>
  );
}
```

---

## 📨 Message Components

### Message Bubble Component

`frontend/src/features/chat/MessageBubble.tsx`:

```typescript
import React from 'react';
import { Message, MessageType } from '../../types/messages';
import { TextMessage } from './messages/TextMessage';
import { ImageMessage } from './messages/ImageMessage';
import { VideoMessage } from './messages/VideoMessage';
import { AudioMessage } from './messages/AudioMessage';
import { DocumentMessage } from './messages/DocumentMessage';
import { ReactionMessage } from './messages/ReactionMessage'; // 🆕 YENİ
import { InteractiveMessage } from './messages/InteractiveMessage';

interface MessageBubbleProps {
  message: Message;
  isSent: boolean; // Kendi gönderdiğimiz mi?
}

export function MessageBubble({ message, isSent }: MessageBubbleProps) {
  const renderMessageContent = () => {
    switch (message.type) {
      case MessageType.TEXT:
        return <TextMessage content={message.content} />;

      case MessageType.IMAGE:
        return <ImageMessage content={message.content} />;

      case MessageType.VIDEO:
        return <VideoMessage content={message.content} />;

      case MessageType.AUDIO:
        return <AudioMessage content={message.content} />;

      case MessageType.DOCUMENT:
        return <DocumentMessage content={message.content} />;

      case MessageType.STICKER:
        return <img src={message.content.url} alt="Sticker" />;

      case MessageType.REACTION: // 🆕 YENİ
        return <ReactionMessage content={message.content} />;

      case MessageType.INTERACTIVE:
        return <InteractiveMessage content={message.content} />;

      default:
        return <div>Unsupported message type</div>;
    }
  };

  return (
    <div className={`message-bubble ${isSent ? 'sent' : 'received'}`}>
      {renderMessageContent()}

      <div className="message-footer">
        <span className="message-time">
          {new Date(message.timestamp).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>

        {isSent && (
          <span className="message-status">
            {message.status === 'sent' && '✓'}
            {message.status === 'delivered' && '✓✓'}
            {message.status === 'read' && '✓✓'}
          </span>
        )}
      </div>
    </div>
  );
}
```

### Text Message

`frontend/src/features/chat/messages/TextMessage.tsx`:

```typescript
import React from 'react';
import { TextMessageContent } from '../../../types/messages';

interface TextMessageProps {
  content: TextMessageContent;
}

export function TextMessage({ content }: TextMessageProps) {
  return (
    <div className="text-message">
      <p>{content.body}</p>
    </div>
  );
}
```

### Image Message (🆕 URL Desteği ile)

`frontend/src/features/chat/messages/ImageMessage.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { ImageMessageContent } from '../../../types/messages';
import { MessagesService } from '../../../api/messages.service';

interface ImageMessageProps {
  content: ImageMessageContent;
}

export function ImageMessage({ content }: ImageMessageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImage();
  }, [content.id]);

  const loadImage = async () => {
    try {
      // Eğer URL varsa direkt kullan (🆕 YENİ)
      if (content.url) {
        setImageUrl(content.url);
        setLoading(false);
        return;
      }

      // URL yoksa media ID ile indir
      const blob = await MessagesService.downloadMedia(content.id);
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    } catch (error) {
      console.error('Failed to load image:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="image-message loading">Loading image...</div>;
  }

  return (
    <div className="image-message">
      {imageUrl ? (
        <>
          <img src={imageUrl} alt={content.caption || 'Image'} />
          {content.caption && <p className="caption">{content.caption}</p>}
        </>
      ) : (
        <div className="image-error">Failed to load image</div>
      )}
    </div>
  );
}
```

### Video Message (🆕 URL Desteği ile)

`frontend/src/features/chat/messages/VideoMessage.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { VideoMessageContent } from '../../../types/messages';
import { MessagesService } from '../../../api/messages.service';

interface VideoMessageProps {
  content: VideoMessageContent;
}

export function VideoMessage({ content }: VideoMessageProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideo();
  }, [content.id]);

  const loadVideo = async () => {
    try {
      // Eğer URL varsa direkt kullan (🆕 YENİ)
      if (content.url) {
        setVideoUrl(content.url);
        setLoading(false);
        return;
      }

      // URL yoksa media ID ile indir
      const blob = await MessagesService.downloadMedia(content.id);
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
    } catch (error) {
      console.error('Failed to load video:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="video-message loading">Loading video...</div>;
  }

  return (
    <div className="video-message">
      {videoUrl ? (
        <>
          <video controls>
            <source src={videoUrl} type={content.mimeType} />
            Your browser does not support the video tag.
          </video>
          {content.caption && <p className="caption">{content.caption}</p>}
        </>
      ) : (
        <div className="video-error">Failed to load video</div>
      )}
    </div>
  );
}
```

### Reaction Message (🆕 YENİ)

`frontend/src/features/chat/messages/ReactionMessage.tsx`:

```typescript
import React from 'react';
import { ReactionMessageContent } from '../../../types/messages';

interface ReactionMessageProps {
  content: ReactionMessageContent;
}

export function ReactionMessage({ content }: ReactionMessageProps) {
  return (
    <div className="reaction-message">
      <span className="reaction-emoji">{content.emoji}</span>
      <span className="reaction-text">
        Reacted to a message
      </span>
    </div>
  );
}
```

**CSS:**

```css
/* frontend/src/features/chat/messages/ReactionMessage.css */
.reaction-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f0f0f0;
  border-radius: 20px;
  font-size: 14px;
}

.reaction-emoji {
  font-size: 24px;
}

.reaction-text {
  color: #666;
  font-style: italic;
}
```

---

## ⏱️ 24-Hour Window Göstergesi

### Window Status Component

`frontend/src/features/chat/WindowStatus.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { ConversationsService } from '../../api/conversations.service';

interface WindowStatusProps {
  conversationId: string;
}

export function WindowStatus({ conversationId }: WindowStatusProps) {
  const [windowStatus, setWindowStatus] = useState<{
    isOpen: boolean;
    remainingMinutes: number;
  } | null>(null);

  useEffect(() => {
    checkWindowStatus();

    // Her 1 dakikada bir kontrol et
    const interval = setInterval(checkWindowStatus, 60000);

    return () => clearInterval(interval);
  }, [conversationId]);

  const checkWindowStatus = async () => {
    try {
      const status = await ConversationsService.checkWindowStatus(conversationId);
      setWindowStatus(status);
    } catch (error) {
      console.error('Failed to check window status:', error);
    }
  };

  if (!windowStatus) return null;

  const formatRemainingTime = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}s ${mins}dk`;
    }
    return `${minutes}dk`;
  };

  return (
    <div className={`window-status ${windowStatus.isOpen ? 'open' : 'closed'}`}>
      {windowStatus.isOpen ? (
        <>
          <span className="status-icon">🟢</span>
          <span className="status-text">
            24 saatlik pencere açık - Kalan süre:{' '}
            {formatRemainingTime(windowStatus.remainingMinutes)}
          </span>
        </>
      ) : (
        <>
          <span className="status-icon">🔴</span>
          <span className="status-text">
            24 saatlik pencere kapalı - Template mesajı kullanın
          </span>
        </>
      )}
    </div>
  );
}
```

**CSS:**

```css
/* frontend/src/features/chat/WindowStatus.css */
.window-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}

.window-status.open {
  background: #e8f5e9;
  border: 1px solid #4caf50;
  color: #2e7d32;
}

.window-status.closed {
  background: #ffebee;
  border: 1px solid #f44336;
  color: #c62828;
}

.status-icon {
  font-size: 16px;
}

.status-text {
  font-weight: 500;
}
```

### Chat Input with Window Check

`frontend/src/features/chat/ChatInput.tsx`:

```typescript
import React, { useState } from 'react';
import { MessagesService } from '../../api/messages.service';
import { WindowStatus } from './WindowStatus';

interface ChatInputProps {
  conversationId: string;
  isWindowOpen: boolean;
}

export function ChatInput({ conversationId, isWindowOpen }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;

    // 24-hour window kontrolü
    if (!isWindowOpen) {
      alert(
        '24 saatlik pencere kapalı! Template mesajı kullanmanız gerekiyor.'
      );
      return;
    }

    try {
      setSending(true);
      await MessagesService.sendTextMessage(conversationId, message);
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Mesaj gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-input">
      <WindowStatus conversationId={conversationId} />

      <div className="input-container">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder={
            isWindowOpen
              ? 'Mesajınızı yazın...'
              : 'Pencere kapalı - Template kullanın'
          }
          disabled={!isWindowOpen || sending}
        />

        <button
          onClick={handleSend}
          disabled={!isWindowOpen || sending || !message.trim()}
        >
          {sending ? 'Gönderiliyor...' : 'Gönder'}
        </button>
      </div>
    </div>
  );
}
```

---

## 🎨 CSS Stilleri

### Global Message Styles

`frontend/src/features/chat/MessageBubble.css`:

```css
.message-bubble {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 18px;
  margin-bottom: 8px;
  word-wrap: break-word;
}

.message-bubble.sent {
  align-self: flex-end;
  background: #dcf8c6;
  border-bottom-right-radius: 4px;
}

.message-bubble.received {
  align-self: flex-start;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-bottom-left-radius: 4px;
}

.message-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 11px;
  color: #667781;
}

.message-status {
  color: #4fc3f7;
}

/* Image Message */
.image-message img {
  max-width: 100%;
  border-radius: 8px;
}

.image-message .caption {
  margin-top: 8px;
  font-size: 14px;
}

/* Video Message */
.video-message video {
  max-width: 100%;
  border-radius: 8px;
}

/* Audio Message */
.audio-message {
  display: flex;
  align-items: center;
  gap: 12px;
}

.audio-message audio {
  width: 200px;
}

/* Document Message */
.document-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.document-icon {
  font-size: 32px;
}

.document-info {
  flex: 1;
}

.document-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.document-size {
  font-size: 12px;
  color: #666;
}
```

---

## 🔄 React Query ile State Management (Önerilen)

React Query kullanarak daha iyi state management:

### Setup

```bash
npm install @tanstack/react-query
```

### Configuration

`frontend/src/api/queryClient.ts`:

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
```

### Hooks

`frontend/src/hooks/useConversations.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConversationsService } from '../api/conversations.service';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => ConversationsService.getConversations(),
  });
}

export function useConversation(conversationId: string) {
  return useQuery({
    queryKey: ['conversations', conversationId],
    queryFn: () => ConversationsService.getConversation(conversationId),
    enabled: !!conversationId,
  });
}
```

`frontend/src/hooks/useMessages.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessagesService } from '../api/messages.service';

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => MessagesService.getMessages(conversationId),
    enabled: !!conversationId,
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) =>
      MessagesService.sendTextMessage(conversationId, body),
    onSuccess: () => {
      // Invalidate messages query to refetch
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });
}
```

### Usage

```typescript
import { useMessages, useSendMessage } from '../../hooks/useMessages';

function ChatComponent({ conversationId }: { conversationId: string }) {
  const { data: messages, isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId);

  const handleSend = (text: string) => {
    sendMessage.mutate(text);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {messages?.map(message => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}
```

---

## ✅ Best Practices

### 1. Error Handling

```typescript
try {
  const messages = await MessagesService.getMessages(conversationId);
  setMessages(messages);
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) {
      toast.error('Conversation not found');
    } else if (error.response?.status === 500) {
      toast.error('Server error, please try again');
    } else {
      toast.error('Failed to load messages');
    }
  }
}
```

### 2. Loading States

```typescript
function MessageList() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);

  if (loading) {
    return (
      <div className="message-list-loading">
        <Spinner />
        <p>Loading messages...</p>
      </div>
    );
  }

  return <div>{/* messages */}</div>;
}
```

### 3. Optimistic Updates

```typescript
const sendMessage = async (text: string) => {
  // Optimistic update
  const tempMessage: Message = {
    id: `temp-${Date.now()}`,
    type: MessageType.TEXT,
    content: { body: text },
    status: MessageStatus.SENT,
    timestamp: new Date(),
    // ...
  };

  setMessages(prev => [...prev, tempMessage]);

  try {
    const savedMessage = await MessagesService.sendTextMessage(conversationId, text);

    // Replace temp message with real one
    setMessages(prev =>
      prev.map(msg => (msg.id === tempMessage.id ? savedMessage : msg))
    );
  } catch (error) {
    // Remove temp message on error
    setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    toast.error('Failed to send message');
  }
};
```

### 4. Media Caching

```typescript
// Cache media URLs
const mediaCache = new Map<string, string>();

const loadMedia = async (mediaId: string): Promise<string> => {
  // Check cache
  if (mediaCache.has(mediaId)) {
    return mediaCache.get(mediaId)!;
  }

  // Download and cache
  const blob = await MessagesService.downloadMedia(mediaId);
  const url = URL.createObjectURL(blob);
  mediaCache.set(mediaId, url);

  return url;
};
```

### 5. Lazy Loading

```typescript
import { lazy, Suspense } from 'react';

const ImageMessage = lazy(() => import('./messages/ImageMessage'));
const VideoMessage = lazy(() => import('./messages/VideoMessage'));

function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {message.type === MessageType.IMAGE && <ImageMessage content={message.content} />}
      {message.type === MessageType.VIDEO && <VideoMessage content={message.content} />}
    </Suspense>
  );
}
```

---

## 🧪 Testing

### Unit Test Example

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { MessageBubble } from './MessageBubble';
import { MessageType, MessageStatus } from '../../types/messages';

describe('MessageBubble', () => {
  it('renders text message correctly', () => {
    const message = {
      id: '1',
      type: MessageType.TEXT,
      content: { body: 'Hello world' },
      status: MessageStatus.SENT,
      timestamp: new Date(),
    };

    render(<MessageBubble message={message} isSent={true} />);

    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders reaction message correctly', () => {
    const message = {
      id: '2',
      type: MessageType.REACTION,
      content: { emoji: '👍', messageId: '1' },
      status: MessageStatus.SENT,
      timestamp: new Date(),
    };

    render(<MessageBubble message={message} isSent={false} />);

    expect(screen.getByText('👍')).toBeInTheDocument();
  });
});
```

---

## 📦 Özet

### Backend'den Gelen Yeni Özellikler

1. ✅ **REACTION MessageType** - Emoji reaksiyonları
2. ✅ **Media URL field'leri** - Image, video, audio, document URL'leri
3. ✅ **24-hour window tracking** - lastCustomerMessageAt, isWindowOpen

### Frontend'de Yapılanlar

1. ✅ TypeScript type definitions
2. ✅ API services (messages, conversations)
3. ✅ WebSocket integration
4. ✅ Message components (text, image, video, audio, reaction)
5. ✅ 24-hour window status indicator
6. ✅ Chat input with window check

### Sonraki Adımlar

1. Backend migration'ını çalıştırın: `npm run migration:run`
2. Frontend'de type definitions'ı ekleyin
3. API servislerini implement edin
4. Message component'lerini oluşturun
5. WebSocket entegrasyonunu yapın
6. Test edin!

---

**Son Güncelleme:** 2025-11-24
**Versiyon:** 1.0.0
