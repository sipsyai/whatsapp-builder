import React, { useEffect, useState } from 'react';
import { getFlows, deleteFlow, type Flow } from '../api';

interface FlowsListPageProps {
    onNavigate: (path: string) => void;
}

export const FlowsListPage: React.FC<FlowsListPageProps> = ({ onNavigate }) => {
    const [flows, setFlows] = useState<Flow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadFlows();
    }, []);

    const loadFlows = async () => {
        try {
            setLoading(true);
            const data = await getFlows();
            setFlows(data);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-8 h-full bg-background-light dark:bg-background-dark overflow-y-auto">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Flows</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your chatbot flows</p>
                    </div>
                    <button
                        onClick={() => onNavigate('/builder')}
                        className="px-4 py-2 bg-primary text-[#112217] rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Create New Flow
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 relative">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {flows.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-surface-dark rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <span className="material-symbols-outlined text-6xl text-zinc-300 dark:text-zinc-600 mb-4">account_tree</span>
                        <h3 className="text-xl font-medium text-zinc-900 dark:text-white mb-2">No flows yet</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-6">Create your first flow to get started</p>
                        <button
                            onClick={() => onNavigate('/builder')}
                            className="px-4 py-2 bg-primary text-[#112217] rounded-lg font-bold inline-flex items-center gap-2 hover:bg-primary/90 transition-colors"
                        >
                            <span className="material-symbols-outlined">add</span>
                            Create Flow
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {flows.map((flow) => (
                            <div key={flow.id} className="bg-white dark:bg-surface-dark rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-lg transition-shadow group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                        <span className="material-symbols-outlined">smart_toy</span>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onNavigate(`/builder?id=${flow.id}`)}
                                            className="p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <span className="material-symbols-outlined">edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(flow.id)}
                                            className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{flow.name}</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                                    {flow.nodes?.length || 0} nodes • {flow.edges?.length || 0} connections
                                </p>
                                <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                    <span>Created {new Date(flow.createdAt).toLocaleDateString()}</span>
                                    <span>ID: {flow.id.slice(0, 8)}...</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
