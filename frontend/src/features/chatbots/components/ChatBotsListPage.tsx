import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getChatBots, softDeleteChatBot, toggleActiveChatBot, exportChatbot, importChatbot, type ChatBot, ChatBotStatus } from '../api';

interface ChatBotsListPageProps {
    onNavigate: (path: string) => void;
    onLoadChatBot?: (chatbot: ChatBot) => void;
}

type FilterType = 'all' | 'active' | 'archived';

export const ChatBotsListPage: React.FC<ChatBotsListPageProps> = ({ onNavigate, onLoadChatBot }) => {
    const [chatbots, setChatBots] = useState<ChatBot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(12);
    const [sortBy] = useState<'name' | 'createdAt' | 'updatedAt'>('createdAt');
    const [sortOrder] = useState<'ASC' | 'DESC'>('DESC');
    const [filter, setFilter] = useState<FilterType>('active');
    const [togglingChatBotId, setTogglingChatBotId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadChatBots();
    }, [searchQuery, currentPage, filter]);

    // Auto-hide toast after 3 seconds
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const loadChatBots = async () => {
        try {
            setLoading(true);
            const data = await getChatBots({
                search: searchQuery || undefined,
                limit: pageSize,
                offset: (currentPage - 1) * pageSize,
                sortBy,
                sortOrder,
                // For "active" filter, use isActive: true to find currently active chatbot
                // For "archived" filter, use status: ARCHIVED
                isActive: filter === 'active' ? true : undefined,
                status: filter === 'archived' ? ChatBotStatus.ARCHIVED : undefined
            });
            // Ensure data is always an array
            setChatBots(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            console.error('Failed to load chatbots:', err);
            setError('Failed to load chatbots. Please try again.');
            setChatBots([]);  // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const toggleChatBotStatus = async (chatbotId: string) => {
        try {
            setTogglingChatBotId(chatbotId);

            // Activate this chatbot (automatically deactivates all others)
            await toggleActiveChatBot(chatbotId);
            setToast({
                message: 'ChatBot activated successfully. All other chatbots have been deactivated.',
                type: 'success'
            });

            // Reload chatbots to reflect the changes
            await loadChatBots();
        } catch (err) {
            console.error('Failed to toggle chatbot status:', err);
            setToast({
                message: 'Failed to update chatbot status',
                type: 'error'
            });
        } finally {
            setTogglingChatBotId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Archive this chatbot? You can restore it later.')) return;

        try {
            await softDeleteChatBot(id);
            loadChatBots();  // Reload to remove from active list
        } catch (err) {
            console.error('Failed to archive chatbot:', err);
            alert('Failed to archive chatbot');
        }
    };

    const handleLoadChatBot = (chatbot: ChatBot) => {
        if (onLoadChatBot) {
            onLoadChatBot(chatbot);
        }
        onNavigate('/builder');
    };

    const handleExport = async (chatbot: ChatBot) => {
        try {
            const blob = await exportChatbot(chatbot.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${chatbot.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            setToast({ message: 'Chatbot exported successfully', type: 'success' });
        } catch (error) {
            setToast({ message: 'Failed to export chatbot', type: 'error' });
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    // Use ref to store loadChatBots to avoid stale closure in processImportFile
    const loadChatBotsRef = useRef(loadChatBots);
    useEffect(() => {
        loadChatBotsRef.current = loadChatBots;
    });

    // Track if import is being processed to prevent double execution
    const isProcessingRef = useRef(false);

    // File processing logic - uses ref to always call latest loadChatBots
    const processImportFile = useCallback(async (file: File) => {
        // Prevent double execution from both native and React events
        if (isProcessingRef.current) {
            return;
        }

        if (!file.name.endsWith('.json')) {
            setToast({ message: 'Please select a JSON file', type: 'error' });
            return;
        }

        isProcessingRef.current = true;
        setImporting(true);
        try {
            const result = await importChatbot(file);
            if (result.success) {
                setToast({
                    message: `Chatbot "${result.chatbotName}" imported successfully`,
                    type: 'success'
                });
                // Use ref to get the latest loadChatBots with current state
                loadChatBotsRef.current();
            } else {
                setToast({ message: result.message, type: 'error' });
            }
        } catch (error: any) {
            setToast({ message: error.response?.data?.message || 'Failed to import chatbot', type: 'error' });
        } finally {
            setImporting(false);
            isProcessingRef.current = false;
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, []);

    // Native change event listener for Playwright compatibility
    // Playwright's browser_file_upload doesn't always trigger React's synthetic onChange
    // This listener catches native DOM events that React might miss
    useEffect(() => {
        const input = fileInputRef.current;
        if (!input) return;

        const handleNativeChange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
                processImportFile(file);
            }
        };

        input.addEventListener('change', handleNativeChange);
        return () => input.removeEventListener('change', handleNativeChange);
    }, [processImportFile]);

    // React synthetic event handler - kept for standard browser compatibility
    // The isProcessingRef guard prevents double execution if native event also fires
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await processImportFile(file);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-zinc-400">Loading chatbots...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-background overchatbot-y-auto">
            <div className="max-w-7xl mx-auto p-8">
                {/* Toast Notification */}
                {toast && (
                    <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-slideIn ${
                        toast.type === 'success'
                            ? 'bg-green-100 border border-green-400 text-green-800'
                            : 'bg-red-100 border border-red-400 text-red-800'
                    }`}>
                        <span className="material-symbols-outlined">
                            {toast.type === 'success' ? 'check_circle' : 'error'}
                        </span>
                        <span className="font-medium">{toast.message}</span>
                    </div>
                )}

                {/* Header */}
                <div className="mb-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">My Chatbots</h1>
                            <p className="text-zinc-400">Manage and organize your chatbots</p>
                        </div>
                        <div className="flex gap-3">
                            {/* Hidden file input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".json"
                                className="hidden"
                            />
                            {/* Import button */}
                            <button
                                onClick={handleImportClick}
                                disabled={importing}
                                className="px-6 py-3 bg-surface border border-zinc-700 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined">upload</span>
                                {importing ? 'Importing...' : 'Import'}
                            </button>
                            <button
                                onClick={() => onNavigate('/builder')}
                                className="px-6 py-3 bg-primary text-[#112217] rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                <span className="material-symbols-outlined">add_circle</span>
                                Create New ChatBot
                            </button>
                        </div>
                    </div>

                    {/* Search Bar and Filter */}
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">search</span>
                            <input
                                type="text"
                                placeholder="Search chatbots by name or description..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);  // Reset to first page on search
                                }}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-700 bg-surface text-white placeholder-zinc-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Filter Dropdown */}
                        <div className="relative">
                            <select
                                value={filter}
                                onChange={(e) => {
                                    setFilter(e.target.value as FilterType);
                                    setCurrentPage(1);
                                }}
                                className="appearance-none pl-4 pr-10 py-3 rounded-xl border border-zinc-700 bg-surface text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer"
                            >
                                <option value="all">All ChatBots</option>
                                <option value="active">Active Only</option>
                                <option value="archived">Archived Only</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                                filter_list
                            </span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 rounded-xl p-4 border border-blue-800">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-500 rounded-lg">
                                    <span className="material-symbols-outlined text-white">smart_toy</span>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-blue-100">{chatbots.length}</p>
                                    <p className="text-sm text-blue-300">Total ChatBots</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 rounded-xl p-4 border border-green-800">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-500 rounded-lg">
                                    <span className="material-symbols-outlined text-white">account_tree</span>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-green-100">{Array.isArray(chatbots) ? chatbots.reduce((sum, f) => sum + (f.nodes?.length || 0), 0) : 0}</p>
                                    <p className="text-sm text-green-300">Total Nodes</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 rounded-xl p-4 border border-purple-800">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-500 rounded-lg">
                                    <span className="material-symbols-outlined text-white">link</span>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-purple-100">{Array.isArray(chatbots) ? chatbots.reduce((sum, f) => sum + (f.edges?.length || 0), 0) : 0}</p>
                                    <p className="text-sm text-purple-300">Total Connections</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6 relative flex items-center gap-3">
                        <span className="material-symbols-outlined">error</span>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {chatbots.length === 0 && !searchQuery ? (
                    <div className="text-center py-20 bg-surface rounded-2xl border-2 border-dashed border-zinc-700">
                        <div className="inline-block p-6 bg-zinc-800 rounded-full mb-6">
                            <span className="material-symbols-outlined text-6xl text-zinc-500">account_tree</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                            {searchQuery ? 'No chatbots found' : 'No chatbots yet'}
                        </h3>
                        <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                            {searchQuery
                                ? 'Try adjusting your search query'
                                : 'Create your first chatbot to get started with building intelligent conversations'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => onNavigate('/builder')}
                                className="px-6 py-3 bg-primary text-[#112217] rounded-xl font-bold inline-flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
                            >
                                <span className="material-symbols-outlined">add_circle</span>
                                Create Your First ChatBot
                            </button>
                        )}
                    </div>
                ) : chatbots.length === 0 && searchQuery ? (
                    <div className="text-center py-20 bg-surface rounded-2xl border-2 border-dashed border-zinc-700">
                        <div className="inline-block p-6 bg-zinc-800 rounded-full mb-6">
                            <span className="material-symbols-outlined text-6xl text-zinc-500">search_off</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No chatbots found</h3>
                        <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                            Try adjusting your search query
                        </p>
                    </div>
                ) : (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.isArray(chatbots) && chatbots.map((chatbot) => (
                                <div
                                    key={chatbot.id}
                                    className={`bg-surface rounded-2xl border overchatbot-hidden hover:shadow-2xl transition-all duration-300 group hover:scale-105 ${
                                        chatbot.isActive
                                            ? 'border-l-4 border-l-green-500 border-zinc-800'
                                            : 'border-zinc-800 opacity-75'
                                    }`}
                                >
                                    {/* ChatBot Preview/Header */}
                                    <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent relative overchatbot-hidden">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-6xl text-primary/30">smart_toy</span>
                                        </div>

                                        {/* Active Badge - Top Left */}
                                        <div className="absolute top-3 left-3">
                                            {chatbot.isActive ? (
                                                <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-xs font-bold flex items-center gap-1">
                                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-zinc-800 text-zinc-400 rounded-full text-xs font-medium">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>

                                        {/* Action Buttons - Top Right */}
                                        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleLoadChatBot(chatbot)}
                                                className="p-2 bg-zinc-800 text-blue-600 hover:bg-blue-900/20 rounded-lg transition-colors shadow-lg"
                                                title="Load & Edit"
                                            >
                                                <span className="material-symbols-outlined text-xl">edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleExport(chatbot)}
                                                className="p-2 bg-zinc-800 text-green-600 hover:bg-green-900/20 rounded-lg transition-colors shadow-lg"
                                                title="Export as JSON"
                                            >
                                                <span className="material-symbols-outlined text-xl">download</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(chatbot.id)}
                                                className="p-2 bg-zinc-800 text-red-600 hover:bg-red-900/20 rounded-lg transition-colors shadow-lg"
                                                title="Delete"
                                            >
                                                <span className="material-symbols-outlined text-xl">delete</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* ChatBot Info */}
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-white mb-2 truncate">{chatbot.name}</h3>
                                        <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
                                            {chatbot.description || <span className="italic text-zinc-500">No description</span>}
                                        </p>

                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="flex items-center gap-1 text-sm text-zinc-400">
                                                <span className="material-symbols-outlined text-lg text-blue-500">account_tree</span>
                                                <span className="font-medium">{chatbot.nodes?.length || 0}</span>
                                                <span>nodes</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-sm text-zinc-400">
                                                <span className="material-symbols-outlined text-lg text-purple-500">link</span>
                                                <span className="font-medium">{chatbot.edges?.length || 0}</span>
                                                <span>edges</span>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-zinc-800 space-y-2">
                                            <div className="flex items-center justify-between text-xs text-zinc-400">
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">schedule</span>
                                                    Created
                                                </span>
                                                <span className="font-medium">{new Date(chatbot.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-zinc-400">
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">update</span>
                                                    Updated
                                                </span>
                                                <span className="font-medium">{new Date(chatbot.updatedAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-zinc-400">
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">fingerprint</span>
                                                    ID
                                                </span>
                                                <span className="font-mono font-medium">{chatbot.id.slice(0, 8)}...</span>
                                            </div>
                                        </div>

                                        {/* Activation Toggle */}
                                        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                                            <span className="text-sm font-medium text-zinc-300">
                                                Set as Active
                                            </span>
                                            <button
                                                onClick={() => !chatbot.isActive && toggleChatBotStatus(chatbot.id)}
                                                disabled={togglingChatBotId === chatbot.id || chatbot.isActive}
                                                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                    chatbot.isActive
                                                        ? 'bg-green-500 focus:ring-green-500'
                                                        : 'bg-zinc-700 focus:ring-zinc-400 hover:bg-zinc-600'
                                                }`}
                                                title={chatbot.isActive ? 'Currently active' : 'Click to activate (deactivates all others)'}
                                            >
                                                <span
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                                        chatbot.isActive ? 'translate-x-8' : 'translate-x-1'
                                                    }`}
                                                >
                                                    {togglingChatBotId === chatbot.id && (
                                                        <span className="flex items-center justify-center h-full">
                                                            <span className="animate-spin h-3 w-3 border-2 border-zinc-400 border-t-transparent rounded-full"></span>
                                                        </span>
                                                    )}
                                                </span>
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => handleLoadChatBot(chatbot)}
                                            className="w-full mt-4 px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-[#112217] rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-sm">play_arrow</span>
                                            Load ChatBot
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex justify-between items-center mt-8 pt-6 border-t border-zinc-800">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-6 py-3 bg-surface border border-zinc-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">chevron_left</span>
                                Previous
                            </button>
                            <div className="text-sm text-zinc-400">
                                Page {currentPage} • {chatbots.length} chatbot{chatbots.length !== 1 ? 's' : ''}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={chatbots.length < pageSize}
                                className="px-6 py-3 bg-surface border border-zinc-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors flex items-center gap-2"
                            >
                                Next
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
