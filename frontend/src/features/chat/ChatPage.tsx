import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatWindow } from "./components/ChatWindow";
import { mockConversations } from "./mockData";
import type { Conversation } from "./mockData";

interface ChatPageProps {
    onBack?: () => void;
}

export const ChatPage = ({ onBack }: ChatPageProps) => {
    const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

    const activeConversation = conversations.find((c) => c.id === activeConversationId);

    const handleSelectConversation = (id: string) => {
        setActiveConversationId(id);
        // Mark as read logic would go here
        setConversations(prev => prev.map(c =>
            c.id === id ? { ...c, unreadCount: 0 } : c
        ));
    };

    const handleSendMessage = (content: any, type: "text" | "image" | "document" = "text") => {
        if (!activeConversationId) return;

        const newMessage = {
            id: Date.now().toString(),
            sender: "me" as const,
            type,
            content,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: "sent" as const
        };

        setConversations(prev => prev.map(c => {
            if (c.id === activeConversationId) {
                return {
                    ...c,
                    messages: [...c.messages, newMessage],
                    lastMessage: type === 'text' ? content : type,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
            }
            return c;
        }));
    };

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
