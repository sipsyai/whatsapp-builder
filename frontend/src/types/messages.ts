// Message Types
export const MessageType = {
    TEXT: 'text',
    IMAGE: 'image',
    VIDEO: 'video',
    DOCUMENT: 'document',
    AUDIO: 'audio',
    STICKER: 'sticker',
    INTERACTIVE: 'interactive',
    REACTION: 'reaction',
} as const;

export type MessageType = typeof MessageType[keyof typeof MessageType];

export const MessageStatus = {
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read',
} as const;

export type MessageStatus = typeof MessageStatus[keyof typeof MessageStatus];

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
    role?: 'user' | 'assistant' | 'system'; // For backward compatibility
}

// Message Content Types
export type MessageContent =
    | TextMessageContent
    | ImageMessageContent
    | VideoMessageContent
    | AudioMessageContent
    | DocumentMessageContent
    | StickerMessageContent
    | ReactionMessageContent
    | InteractiveMessageContent
    | string; // For backward compatibility

// Text Message
export interface TextMessageContent {
    whatsappMessageId: string;
    body: string;
}

// Image Message
export interface ImageMessageContent {
    whatsappMessageId: string;
    id: string;
    url?: string;
    mimeType: string;
    sha256: string;
    caption?: string;
}

// Video Message
export interface VideoMessageContent {
    whatsappMessageId: string;
    id: string;
    url?: string;
    mimeType: string;
    sha256: string;
    caption?: string;
}

// Audio Message
export interface AudioMessageContent {
    whatsappMessageId: string;
    id: string;
    url?: string;
    mimeType: string;
    sha256: string;
    voice: boolean;
}

// Document Message
export interface DocumentMessageContent {
    whatsappMessageId: string;
    id: string;
    url?: string;
    mimeType: string;
    sha256: string;
    filename: string;
    caption?: string;
}

// Sticker Message
export interface StickerMessageContent {
    whatsappMessageId: string;
    id: string;
    url?: string;
    mimeType: string;
    sha256: string;
    animated: boolean;
}

// Reaction Message
export interface ReactionMessageContent {
    whatsappMessageId: string;
    messageId: string; // Hangi mesaja reaction yapıldı
    emoji: string; // Hangi emoji kullanıldı
}

// Interactive Message
export interface InteractiveMessageContent {
    whatsappMessageId: string;
    // For incoming messages (user responses)
    type?: 'button_reply' | 'list_reply' | 'button' | 'list';
    buttonId?: string;
    buttonTitle?: string;
    listId?: string;
    listTitle?: string;
    listDescription?: string;
    // For outgoing messages (bot sends)
    header?: {
        type?: string;
        text?: string;
    };
    body?: {
        text: string;
    };
    footer?: {
        text?: string;
    };
    action?: {
        buttons?: Array<{
            type?: string;
            reply?: {
                id: string;
                title: string;
            };
        }>;
        button?: string; // List button text
        sections?: Array<{
            title: string;
            rows: Array<{
                id: string;
                title: string;
                description?: string;
            }>;
        }>;
    };
}

// Conversation Interface
export interface Conversation {
    id: string;
    participants: User[];
    messages: Message[];
    lastMessage: string;
    lastMessageAt: Date;
    lastCustomerMessageAt: Date | null;
    isWindowOpen: boolean;
    createdAt: Date;
    updatedAt: Date;
    // Backward compatibility fields
    title?: string;
    name?: string;
    avatar?: string;
    unreadCount?: number;
}

export interface User {
    id: string;
    phoneNumber: string;
    name: string;
    avatar?: string;
}
