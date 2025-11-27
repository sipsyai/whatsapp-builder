import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatWindow } from "./components/ChatWindow";
import { ConversationsService } from "../../api/conversations.service";
import { MessagesService } from "../../api/messages.service";
import { useWebSocket } from "../../hooks/useWebSocket";
import { socket } from "../../api/socket";
import type { Conversation, Message } from "../../types/messages";

interface ChatPageProps {
    onBack?: () => void;
}

export const ChatPage = ({ onBack }: ChatPageProps) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Use the new WebSocket hook
    const { newMessage, messageStatusUpdate } = useWebSocket();

    const activeConversation = conversations.find((c) => c.id === activeConversationId);

    useEffect(() => {
        loadConversations();
    }, []);

    // Handle new messages from WebSocket
    useEffect(() => {
        if (newMessage) {
            handleNewMessage(newMessage);
        }
    }, [newMessage]);

    // Handle message status updates from WebSocket
    useEffect(() => {
        if (messageStatusUpdate) {
            handleMessageStatusUpdate(messageStatusUpdate.messageId, messageStatusUpdate.status);
        }
    }, [messageStatusUpdate]);

    const loadConversations = async () => {
        try {
            setLoading(true);
            const data = await ConversationsService.getConversations();
            setConversations(data);
        } catch (error) {
            console.error("Failed to load conversations:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewMessage = (message: Message) => {
        setConversations(prev => prev.map(c => {
            if (c.id === message.conversationId) {
                // Check if message already exists to prevent duplicates
                if (c.messages?.some(m => m.id === message.id)) return c;

                const updatedMessages = [...(c.messages || []), message];

                // Determine last message content for preview
                let lastMessageContent = '';
                if (typeof message.content === 'string') {
                    lastMessageContent = message.content;
                } else if ('body' in message.content) {
                    lastMessageContent = typeof message.content.body === 'string'
                        ? message.content.body
                        : (message.content.body as any)?.text || '';
                } else if ('caption' in message.content && message.content.caption) {
                    lastMessageContent = message.content.caption;
                } else {
                    lastMessageContent = message.type.charAt(0).toUpperCase() + message.type.slice(1);
                }

                return {
                    ...c,
                    messages: updatedMessages,
                    lastMessage: lastMessageContent,
                    lastMessageAt: message.createdAt,
                    updatedAt: message.createdAt,
                    unreadCount: c.id !== activeConversationId ? (c.unreadCount || 0) + 1 : 0
                };
            }
            return c;
        }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    };

    const handleMessageStatusUpdate = (messageId: string, status: string) => {
        setConversations(prev => prev.map(c => ({
            ...c,
            messages: c.messages?.map(m =>
                m.id === messageId ? { ...m, status: status as any } : m
            ) || []
        })));
    };

    const handleSelectConversation = async (id: string) => {
        // Leave previous conversation room if any
        if (activeConversationId) {
            socket.emit('conversation:leave', { conversationId: activeConversationId });
            console.log(`Left conversation room: ${activeConversationId}`);
        }

        setActiveConversationId(id);

        // Join new conversation room for real-time updates
        socket.emit('conversation:join', { conversationId: id });
        console.log(`Joined conversation room: ${id}`);

        // Load messages if not already loaded or if we want to refresh
        try {
            const messages = await MessagesService.getMessages(id);
            setConversations(prev => prev.map(c =>
                c.id === id ? { ...c, messages, unreadCount: 0 } : c
            ));
        } catch (error) {
            console.error("Failed to load messages:", error);
        }

        // Mark as read
        try {
            await MessagesService.markAsRead(id);
            setConversations(prev => prev.map(c =>
                c.id === id ? { ...c, unreadCount: 0 } : c
            ));
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const handleSendMessage = async (content: any, type: "text" | "image" | "document" = "text") => {
        if (!activeConversationId) return;

        try {
            if (type === 'text') {
                // Send message and immediately add it to the UI
                const sentMessage = await MessagesService.sendTextMessage(activeConversationId, content);

                // Optimistically add the message to the conversation
                setConversations(prev => prev.map(c => {
                    if (c.id === activeConversationId) {
                        // Check if message already exists to prevent duplicates
                        if (c.messages?.some(m => m.id === sentMessage.id)) return c;

                        const updatedMessages = [...(c.messages || []), sentMessage];

                        // Determine last message content for preview
                        let lastMessageContent = '';
                        if (typeof sentMessage.content === 'string') {
                            lastMessageContent = sentMessage.content;
                        } else if ('body' in sentMessage.content) {
                            lastMessageContent = typeof sentMessage.content.body === 'string'
                                ? sentMessage.content.body
                                : (sentMessage.content.body as any)?.text || '';
                        } else {
                            lastMessageContent = sentMessage.type;
                        }

                        return {
                            ...c,
                            messages: updatedMessages,
                            lastMessage: lastMessageContent,
                            lastMessageAt: sentMessage.createdAt,
                            updatedAt: sentMessage.createdAt,
                        };
                    }
                    return c;
                }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            alert("Failed to send message");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background">
            <div className="w-[400px] border-r border-gray-700 flex flex-col bg-surface">
                <Sidebar
                    conversations={conversations}
                    activeId={activeConversationId}
                    onSelect={handleSelectConversation}
                    onBack={onBack}
                />
            </div>
            <div className="flex-1 flex flex-col bg-[#0b141a] relative">
                {/* Background Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
                    style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')" }}>
                </div>

                {activeConversation ? (
                    <ChatWindow
                        conversation={activeConversation}
                        onSendMessage={handleSendMessage}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 z-10">
                        <span className="material-symbols-outlined text-6xl mb-4">chat</span>
                        <h2 className="text-xl font-medium">WhatsApp Web Clone</h2>
                        <p className="mt-2">Select a chat to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
};

