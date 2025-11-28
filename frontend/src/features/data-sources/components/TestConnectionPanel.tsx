import React, { useState } from 'react';
import { testEndpoint, type TestEndpointRequest, type TestEndpointResponse } from '../api';

interface TestConnectionPanelProps {
    dataSourceId: string;
    onClose: () => void;
}

export const TestConnectionPanel: React.FC<TestConnectionPanelProps> = ({ dataSourceId, onClose }) => {
    const [endpoint, setEndpoint] = useState('');
    const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<TestEndpointResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleTest = async () => {
        if (!endpoint.trim()) {
            setError('Endpoint is required');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setResult(null);

            const request: TestEndpointRequest = {
                endpoint: endpoint.trim(),
                method,
            };

            // Parse body if provided (for POST/PUT/PATCH)
            if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && body.trim()) {
                try {
                    request.body = JSON.parse(body);
                } catch (err) {
                    setError('Invalid JSON in request body');
                    setLoading(false);
                    return;
                }
            }

            const response = await testEndpoint(dataSourceId, request);
            setResult(response);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to test endpoint');
        } finally {
            setLoading(false);
        }
    };

    const showBodyField = method === 'POST' || method === 'PUT' || method === 'PATCH';

    return (
        <div className="bg-zinc-800/50 border-t border-zinc-700 p-4">
            <div className="max-w-4xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Test Custom Endpoint</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                        title="Close"
                    >
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>

                <div className="space-y-3">
                    {/* Endpoint and Method Row */}
                    <div className="flex gap-2">
                        <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value as typeof method)}
                            className="px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                            <option value="DELETE">DELETE</option>
                        </select>

                        <input
                            type="text"
                            value={endpoint}
                            onChange={(e) => setEndpoint(e.target.value)}
                            placeholder="/api/products"
                            className="flex-1 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        />

                        <button
                            onClick={handleTest}
                            disabled={loading}
                            className="px-4 py-2 bg-primary text-[#112217] rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                                    Testing...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-sm">play_arrow</span>
                                    Test
                                </>
                            )}
                        </button>
                    </div>

                    {/* Body Field (only for POST/PUT/PATCH) */}
                    {showBodyField && (
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">
                                Request Body (JSON)
                            </label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder='{"key": "value"}'
                                rows={4}
                                className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-900/20 border border-red-700 text-red-400 px-3 py-2 rounded-lg text-sm flex items-start gap-2">
                            <span className="material-symbols-outlined text-sm mt-0.5">error</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Result Display */}
                    {result && (
                        <div className="space-y-2">
                            {/* Status Header */}
                            <div className="flex items-center gap-3 text-sm">
                                <div
                                    className={`flex items-center gap-1 ${
                                        result.success ? 'text-green-400' : 'text-red-400'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-sm">
                                        {result.success ? 'check_circle' : 'error'}
                                    </span>
                                    <span className="font-semibold">
                                        {result.success ? 'Success' : 'Failed'}
                                    </span>
                                </div>

                                {result.statusCode && (
                                    <div className="text-zinc-400">
                                        <span className="font-medium">Status:</span>{' '}
                                        <span className={`font-mono ${result.statusCode >= 200 && result.statusCode < 300 ? 'text-green-400' : 'text-red-400'}`}>
                                            {result.statusCode}
                                        </span>
                                    </div>
                                )}

                                <div className="text-zinc-400">
                                    <span className="font-medium">Time:</span>{' '}
                                    <span className="font-mono">{result.responseTime}ms</span>
                                </div>
                            </div>

                            {/* Response Data */}
                            {result.success && result.data && (
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                                        Response Data
                                    </label>
                                    <pre className="font-mono text-xs bg-zinc-900 p-3 rounded-lg max-h-64 overflow-auto text-green-400 border border-zinc-700">
                                        {JSON.stringify(result.data, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {/* Error Message */}
                            {!result.success && result.error && (
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                                        Error Details
                                    </label>
                                    <pre className="font-mono text-xs bg-zinc-900 p-3 rounded-lg max-h-64 overflow-auto text-red-400 border border-zinc-700">
                                        {result.error}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
