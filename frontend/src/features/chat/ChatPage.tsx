import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatWindow } from "./components/ChatWindow";
import { getConversations, getMessages, sendMessage, markAsRead, type Conversation, type Message } from "../conversations/api";
import { socket } from "../../api/socket";

interface ChatPageProps {
    onBack?: () => void;
}

export const ChatPage = ({ onBack }: ChatPageProps) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const activeConversation = conversations.find((c) => c.id === activeConversationId);

    useEffect(() => {
        loadConversations();

        // Connect socket
        socket.connect();
        socket.on('conversation:update', handleConversationUpdate);
        socket.on('message:new', handleNewMessage);

        return () => {
            socket.off('conversation:update', handleConversationUpdate);
            socket.off('message:new', handleNewMessage);
            socket.disconnect();
        };
    }, []);

    const loadConversations = async () => {
        try {
            setLoading(true);
            const data = await getConversations();
            setConversations(data);
        } catch (error) {
            console.error("Failed to load conversations:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConversationUpdate = (updatedConversation: Conversation) => {
        setConversations(prev => {
            const index = prev.findIndex(c => c.id === updatedConversation.id);
            if (index === -1) return [updatedConversation, ...prev];
            const newConversations = [...prev];
            newConversations[index] = { ...newConversations[index], ...updatedConversation };
            return newConversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        });
    };

    const handleNewMessage = (message: Message) => {
        setConversations(prev => prev.map(c => {
            if (c.id === message.conversationId) {
                // Check if message already exists to prevent duplicates
                if (c.messages?.some(m => m.id === message.id)) return c;

                return {
                    ...c,
                    messages: [...(c.messages || []), message],
                    lastMessage: message.content,
                    updatedAt: message.createdAt,
                    unreadCount: c.id !== activeConversationId ? (c.unreadCount || 0) + 1 : 0
                };
            }
            return c;
        }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    };

    const handleSelectConversation = async (id: string) => {
        setActiveConversationId(id);

        // Load messages if not already loaded
        const conversation = conversations.find(c => c.id === id);
        if (conversation && (!conversation.messages || conversation.messages.length === 0)) {
            try {
                const messages = await getMessages(id);
                setConversations(prev => prev.map(c =>
                    c.id === id ? { ...c, messages, unreadCount: 0 } : c
                ));
            } catch (error) {
                console.error("Failed to load messages:", error);
            }
        }

        // Mark as read
        try {
            await markAsRead(id);
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
            // Optimistic update
            const tempId = Date.now().toString();
            const optimisticMessage: any = {
                id: tempId,
                conversationId: activeConversationId,
                content: typeof content === 'string' ? content : JSON.stringify(content),
                role: 'user', // Assuming 'user' for now
                createdAt: new Date().toISOString(),
                status: 'sent'
            };

            setConversations(prev => prev.map(c => {
                if (c.id === activeConversationId) {
                    return {
                        ...c,
                        messages: [...(c.messages || []), optimisticMessage],
                        lastMessage: typeof content === 'string' ? content : 'Media',
                        updatedAt: new Date().toISOString()
                    };
                }
                return c;
            }));

            const sentMessage = await sendMessage(activeConversationId, { content, type });

            // Replace optimistic message with real one
            setConversations(prev => prev.map(c => {
                if (c.id === activeConversationId) {
                    return {
                        ...c,
                        messages: c.messages?.map(m => m.id === tempId ? sentMessage : m) || [sentMessage]
                    };
                }
                return c;
            }));

        } catch (error) {
            console.error("Failed to send message:", error);
            alert("Failed to send message");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <div className="w-[400px] border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-surface-dark">
                <Sidebar
                    conversations={conversations}
                    activeId={activeConversationId}
                    onSelect={handleSelectConversation}
                    onBack={onBack}
                />
            </div>
            <div className="flex-1 flex flex-col bg-[#efeae2] dark:bg-[#0b141a] relative">
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
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 z-10">
                        <span className="material-symbols-outlined text-6xl mb-4">chat</span>
                        <h2 className="text-xl font-medium">WhatsApp Web Clone</h2>
                        <p className="mt-2">Select a chat to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
};
