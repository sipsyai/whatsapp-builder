import React, { useEffect, useState } from 'react';
import { getFlows, deleteFlow, type Flow } from '../api';

interface FlowsListPageProps {
    onNavigate: (path: string) => void;
    onLoadFlow?: (flow: Flow) => void;
}

export const FlowsListPage: React.FC<FlowsListPageProps> = ({ onNavigate, onLoadFlow }) => {
    const [flows, setFlows] = useState<Flow[]>([]);
    const [filteredFlows, setFilteredFlows] = useState<Flow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadFlows();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredFlows(flows);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredFlows(flows.filter(f =>
                f.name.toLowerCase().includes(query) ||
                f.id.toLowerCase().includes(query)
            ));
        }
    }, [searchQuery, flows]);

    const loadFlows = async () => {
        try {
            setLoading(true);
            const data = await getFlows();
            setFlows(data);
            setFilteredFlows(data);
            setError(null);
        } catch (err) {
            console.error('Failed to load flows:', err);
            setError('Failed to load flows. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this flow?')) return;

        try {
            await deleteFlow(id);
            setFlows(flows.filter(f => f.id !== id));
        } catch (err) {
            console.error('Failed to delete flow:', err);
            alert('Failed to delete flow');
        }
    };

    const handleLoadFlow = (flow: Flow) => {
        if (onLoadFlow) {
            onLoadFlow(flow);
        }
        onNavigate('/builder');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-background-light dark:bg-background-dark">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-zinc-500 dark:text-zinc-400">Loading flows...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-background-light dark:bg-background-dark overflow-y-auto">
            <div className="max-w-7xl mx-auto p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">My Chatbots</h1>
                            <p className="text-zinc-500 dark:text-zinc-400">Manage and organize your chatbot flows</p>
                        </div>
                        <button
                            onClick={() => onNavigate('/builder')}
                            className="px-6 py-3 bg-primary text-[#112217] rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            <span className="material-symbols-outlined">add_circle</span>
                            Create New Flow
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">search</span>
                        <input
                            type="text"
                            placeholder="Search flows by name or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-surface-dark text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-500 rounded-lg">
                                    <span className="material-symbols-outlined text-white">smart_toy</span>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{flows.length}</p>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">Total Flows</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-500 rounded-lg">
                                    <span className="material-symbols-outlined text-white">account_tree</span>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">{flows.reduce((sum, f) => sum + (f.nodes?.length || 0), 0)}</p>
                                    <p className="text-sm text-green-700 dark:text-green-300">Total Nodes</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-500 rounded-lg">
                                    <span className="material-symbols-outlined text-white">link</span>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{flows.reduce((sum, f) => sum + (f.edges?.length || 0), 0)}</p>
                                    <p className="text-sm text-purple-700 dark:text-purple-300">Total Connections</p>
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

                {filteredFlows.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-surface-dark rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700">
                        <div className="inline-block p-6 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-6">
                            <span className="material-symbols-outlined text-6xl text-zinc-400 dark:text-zinc-500">account_tree</span>
                        </div>
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                            {searchQuery ? 'No flows found' : 'No flows yet'}
                        </h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-md mx-auto">
                            {searchQuery
                                ? 'Try adjusting your search query'
                                : 'Create your first chatbot flow to get started with building intelligent conversations'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => onNavigate('/builder')}
                                className="px-6 py-3 bg-primary text-[#112217] rounded-xl font-bold inline-flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
                            >
                                <span className="material-symbols-outlined">add_circle</span>
                                Create Your First Flow
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFlows.map((flow) => (
                            <div
                                key={flow.id}
                                className="bg-white dark:bg-surface-dark rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-2xl transition-all duration-300 group hover:scale-105"
                            >
                                {/* Flow Preview/Header */}
                                <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent relative overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-6xl text-primary/30">smart_toy</span>
                                    </div>
                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleLoadFlow(flow)}
                                            className="p-2 bg-white dark:bg-zinc-800 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors shadow-lg"
                                            title="Load & Edit"
                                        >
                                            <span className="material-symbols-outlined text-xl">edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(flow.id)}
                                            className="p-2 bg-white dark:bg-zinc-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shadow-lg"
                                            title="Delete"
                                        >
                                            <span className="material-symbols-outlined text-xl">delete</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Flow Info */}
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3 truncate">{flow.name}</h3>

                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                                            <span className="material-symbols-outlined text-lg text-blue-500">account_tree</span>
                                            <span className="font-medium">{flow.nodes?.length || 0}</span>
                                            <span>nodes</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                                            <span className="material-symbols-outlined text-lg text-purple-500">link</span>
                                            <span className="font-medium">{flow.edges?.length || 0}</span>
                                            <span>edges</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                                        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">schedule</span>
                                                Created
                                            </span>
                                            <span className="font-medium">{new Date(flow.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">update</span>
                                                Updated
                                            </span>
                                            <span className="font-medium">{new Date(flow.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">fingerprint</span>
                                                ID
                                            </span>
                                            <span className="font-mono font-medium">{flow.id.slice(0, 8)}...</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleLoadFlow(flow)}
                                        className="w-full mt-4 px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-[#112217] rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-sm">play_arrow</span>
                                        Load Flow
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
