import type { Conversation } from "../../conversations/api";

interface SidebarProps {
    conversations: Conversation[];
    activeId: string | null;
    onSelect: (id: string) => void;
    onBack?: () => void;
}

export const Sidebar = ({ conversations, activeId, onSelect, onBack }: SidebarProps) => {
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="h-16 bg-gray-100 dark:bg-[#202c33] flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
                <div className="flex items-center gap-2">
                    {onBack && (
                        <button onClick={onBack} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full mr-1" title="Back to Builder">
                            <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">arrow_back</span>
                        </button>
                    )}
                    <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                        <img src="https://ui-avatars.com/api/?name=Me&background=random" alt="Profile" className="w-full h-full object-cover" />
                    </div>
                </div>
                <div className="flex gap-4 text-gray-600 dark:text-gray-300">
                    <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <span className="material-symbols-outlined">groups</span>
                    </button>
                    <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <span className="material-symbols-outlined">donut_large</span>
                    </button>
                    <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <span className="material-symbols-outlined">chat</span>
                    </button>
                    <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <span className="material-symbols-outlined">more_vert</span>
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="p-2 bg-white dark:bg-[#111b21] border-b border-gray-200 dark:border-gray-700 shrink-0">
                <div className="bg-gray-100 dark:bg-[#202c33] rounded-lg flex items-center px-3 py-1.5">
                    <span className="material-symbols-outlined text-gray-500 text-sm">search</span>
                    <input
                        type="text"
                        placeholder="Search or start new chat"
                        className="bg-transparent border-none focus:ring-0 text-sm w-full ml-2 text-gray-700 dark:text-gray-200 placeholder-gray-500"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#111b21]">
                {conversations.map((conv) => (
                    <div
                        key={conv.id}
                        onClick={() => onSelect(conv.id)}
                        className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#202c33] transition-colors ${activeId === conv.id ? "bg-gray-100 dark:bg-[#2a3942]" : ""
                            }`}
                    >
                        <div className="w-12 h-12 rounded-full overflow-hidden mr-3 shrink-0">
                            <img
                                src={conv.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.name || conv.title || 'Unknown')}&background=random`}
                                alt={conv.name || conv.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0 border-b border-gray-100 dark:border-gray-800 pb-3">
                            <div className="flex justify-between items-baseline mb-1">
                                <h3 className="text-base font-normal text-gray-900 dark:text-gray-100 truncate">
                                    {conv.name || conv.title || 'Unknown User'}
                                </h3>
                                <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                                    {formatTime(conv.updatedAt || conv.createdAt)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate pr-2">
                                    {conv.lastMessage || (conv.messages && conv.messages.length > 0 ? conv.messages[conv.messages.length - 1].content : 'No messages')}
                                </p>
                                {(conv.unreadCount || 0) > 0 && (
                                    <span className="bg-[#25D366] text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                        {conv.unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
