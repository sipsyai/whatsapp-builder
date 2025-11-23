import { useState, useRef, useEffect } from "react";
import type { Conversation } from "../../conversations/api";
import { MessageBubble } from "./MessageBubble";

interface ChatWindowProps {
    conversation: Conversation;
    onSendMessage: (content: any, type?: "text" | "image" | "document") => void;
}

export const ChatWindow = ({ conversation, onSendMessage }: ChatWindowProps) => {
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversation.messages]);

    const handleSend = () => {
        if (!inputValue.trim()) return;
        onSendMessage(inputValue, "text");
        setInputValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full z-10">
            {/* Header */}
            <div className="h-16 bg-gray-100 dark:bg-[#202c33] flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
                <div className="flex items-center cursor-pointer">
                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                        <img
                            src={conversation.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.name || conversation.title || 'Unknown')}&background=random`}
                            alt={conversation.name || conversation.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h3 className="text-base font-normal text-gray-900 dark:text-gray-100">
                            {conversation.name || conversation.title || 'Unknown User'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">click here for contact info</p>
                    </div>
                </div>
                <div className="flex gap-4 text-gray-600 dark:text-gray-300">
                    <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <span className="material-symbols-outlined">search</span>
                    </button>
                    <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <span className="material-symbols-outlined">more_vert</span>
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {(conversation.messages || []).map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-gray-100 dark:bg-[#202c33] px-4 py-2 flex items-center gap-2 shrink-0">
                <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                    <span className="material-symbols-outlined">sentiment_satisfied</span>
                </button>
                <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                    <span className="material-symbols-outlined">attach_file</span>
                </button>

                <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-lg px-4 py-2 flex items-center">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message"
                        className="w-full bg-transparent border-none focus:ring-0 text-gray-900 dark:text-gray-100 placeholder-gray-500 text-sm"
                    />
                </div>

                {inputValue.trim() ? (
                    <button onClick={handleSend} className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <span className="material-symbols-outlined">send</span>
                    </button>
                ) : (
                    <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <span className="material-symbols-outlined">mic</span>
                    </button>
                )}
            </div>
        </div>
    );
};
