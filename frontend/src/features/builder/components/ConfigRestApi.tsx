import { useState } from "react";

type TabType = 'request' | 'headers' | 'response' | 'test';

interface Header {
    key: string;
    value: string;
}

export const ConfigRestApi = ({ data, onClose, onSave }: any) => {
    const [activeTab, setActiveTab] = useState<TabType>('request');

    // Request tab state
    const [label, setLabel] = useState(data.label || "REST API");
    const [apiMethod, setApiMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>(data.apiMethod || 'GET');
    const [apiUrl, setApiUrl] = useState(data.apiUrl || "");
    const [apiBody, setApiBody] = useState(data.apiBody || "");
    const [apiTimeout, setApiTimeout] = useState(data.apiTimeout || 30000);

    // Headers tab state
    const [headers, setHeaders] = useState<Header[]>(() => {
        if (data.apiHeaders) {
            return Object.entries(data.apiHeaders).map(([key, value]) => ({ key, value: String(value) }));
        }
        return [{ key: '', value: '' }];
    });

    // Response tab state
    const [apiOutputVariable, setApiOutputVariable] = useState(data.apiOutputVariable || "");
    const [apiResponsePath, setApiResponsePath] = useState(data.apiResponsePath || "");
    const [apiErrorVariable, setApiErrorVariable] = useState(data.apiErrorVariable || "api_error");

    // Test tab state
    const [testResult, setTestResult] = useState<any>(null);
    const [testing, setTesting] = useState(false);

    const addHeader = () => {
        setHeaders([...headers, { key: '', value: '' }]);
    };

    const removeHeader = (index: number) => {
        setHeaders(headers.filter((_, i) => i !== index));
    };

    const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
        const newHeaders = [...headers];
        newHeaders[index][field] = value;
        setHeaders(newHeaders);
    };

    const handleTest = async () => {
        if (!apiUrl) return;

        setTesting(true);
        setTestResult(null);

        try {
            const headersObj: Record<string, string> = {};
            headers.forEach(h => {
                if (h.key) headersObj[h.key] = h.value;
            });

            const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000');
            const response = await fetch(`${apiBaseUrl}/api/chatbots/test-rest-api`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    method: apiMethod,
                    url: apiUrl,
                    headers: headersObj,
                    body: apiBody || undefined,
                    responsePath: apiResponsePath,
                    timeout: apiTimeout,
                }),
            });

            const result = await response.json();
            setTestResult(result);
        } catch (error: any) {
            setTestResult({ success: false, error: error.message });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = () => {
        const headersObj: Record<string, string> = {};
        headers.forEach(h => {
            if (h.key) headersObj[h.key] = h.value;
        });

        onSave({
            ...data,
            label,
            apiMethod,
            apiUrl,
            apiHeaders: Object.keys(headersObj).length > 0 ? headersObj : undefined,
            apiBody: apiBody || undefined,
            apiOutputVariable: apiOutputVariable || undefined,
            apiResponsePath: apiResponsePath || undefined,
            apiErrorVariable: apiErrorVariable || undefined,
            apiTimeout,
        });
        onClose();
    };

    const tabs: { id: TabType; label: string; icon: string }[] = [
        { id: 'request', label: 'Request', icon: 'send' },
        { id: 'headers', label: 'Headers', icon: 'code' },
        { id: 'response', label: 'Response', icon: 'output' },
        { id: 'test', label: 'Test', icon: 'play_arrow' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-2xl h-full bg-white dark:bg-[#102216] shadow-2xl overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <header className="flex justify-between items-center p-6 border-b dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="bg-cyan-500/20 p-2 rounded-lg">
                            <span className="material-symbols-outlined text-cyan-500">api</span>
                        </div>
                        <h1 className="text-xl font-bold dark:text-white">Configure REST API</h1>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg">
                        <span className="material-symbols-outlined dark:text-white">close</span>
                    </button>
                </header>

                {/* Tabs */}
                <div className="flex border-b dark:border-white/10">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'text-cyan-500 border-b-2 border-cyan-500'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                            }`}
                        >
                            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Request Tab */}
                    {activeTab === 'request' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium dark:text-white mb-2">Label</label>
                                <input
                                    type="text"
                                    value={label}
                                    onChange={e => setLabel(e.target.value)}
                                    className="w-full p-3 border dark:border-white/20 rounded-lg dark:bg-white/5 dark:text-white"
                                    placeholder="API Node Label"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium dark:text-white mb-2">HTTP Method</label>
                                <div className="flex gap-2">
                                    {(['GET', 'POST', 'PUT', 'DELETE'] as const).map(method => (
                                        <button
                                            key={method}
                                            onClick={() => setApiMethod(method)}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                                apiMethod === method
                                                    ? 'bg-cyan-500 text-white'
                                                    : 'bg-gray-100 dark:bg-white/10 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20'
                                            }`}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium dark:text-white mb-2">URL</label>
                                <input
                                    type="text"
                                    value={apiUrl}
                                    onChange={e => setApiUrl(e.target.value)}
                                    className="w-full p-3 border dark:border-white/20 rounded-lg dark:bg-white/5 dark:text-white font-mono text-sm"
                                    placeholder="http://192.168.1.18:1337/api/categories"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Use {'{{variable}}'} for dynamic values
                                </p>
                            </div>

                            {['POST', 'PUT'].includes(apiMethod) && (
                                <div>
                                    <label className="block text-sm font-medium dark:text-white mb-2">Request Body (JSON)</label>
                                    <textarea
                                        value={apiBody}
                                        onChange={e => setApiBody(e.target.value)}
                                        className="w-full p-3 border dark:border-white/20 rounded-lg dark:bg-white/5 dark:text-white font-mono text-sm h-32"
                                        placeholder='{"key": "value"}'
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium dark:text-white mb-2">Timeout (ms)</label>
                                <input
                                    type="number"
                                    value={apiTimeout}
                                    onChange={e => setApiTimeout(parseInt(e.target.value) || 30000)}
                                    className="w-32 p-3 border dark:border-white/20 rounded-lg dark:bg-white/5 dark:text-white"
                                />
                            </div>
                        </div>
                    )}

                    {/* Headers Tab */}
                    {activeTab === 'headers' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Add custom headers for authentication or other purposes.
                            </p>

                            {headers.map((header, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={header.key}
                                        onChange={e => updateHeader(index, 'key', e.target.value)}
                                        className="flex-1 p-3 border dark:border-white/20 rounded-lg dark:bg-white/5 dark:text-white"
                                        placeholder="Header Key"
                                    />
                                    <input
                                        type="text"
                                        value={header.value}
                                        onChange={e => updateHeader(index, 'value', e.target.value)}
                                        className="flex-1 p-3 border dark:border-white/20 rounded-lg dark:bg-white/5 dark:text-white"
                                        placeholder="Header Value"
                                    />
                                    <button
                                        onClick={() => removeHeader(index)}
                                        className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            ))}

                            <button
                                onClick={addHeader}
                                className="flex items-center gap-2 px-4 py-2 text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 rounded-lg"
                            >
                                <span className="material-symbols-outlined">add</span>
                                Add Header
                            </button>
                        </div>
                    )}

                    {/* Response Tab */}
                    {activeTab === 'response' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium dark:text-white mb-2">Output Variable</label>
                                <input
                                    type="text"
                                    value={apiOutputVariable}
                                    onChange={e => setApiOutputVariable(e.target.value)}
                                    className="w-full p-3 border dark:border-white/20 rounded-lg dark:bg-white/5 dark:text-white"
                                    placeholder="api_result"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Variable name to store successful response
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium dark:text-white mb-2">JSON Path (optional)</label>
                                <input
                                    type="text"
                                    value={apiResponsePath}
                                    onChange={e => setApiResponsePath(e.target.value)}
                                    className="w-full p-3 border dark:border-white/20 rounded-lg dark:bg-white/5 dark:text-white font-mono text-sm"
                                    placeholder="data"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Extract specific data from response (e.g., "data", "data.items", "data.items[0].name")
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium dark:text-white mb-2">Error Variable</label>
                                <input
                                    type="text"
                                    value={apiErrorVariable}
                                    onChange={e => setApiErrorVariable(e.target.value)}
                                    className="w-full p-3 border dark:border-white/20 rounded-lg dark:bg-white/5 dark:text-white"
                                    placeholder="api_error"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Variable name to store error message on failure
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Test Tab */}
                    {activeTab === 'test' && (
                        <div className="space-y-6">
                            <div className="bg-yellow-50 dark:bg-yellow-500/10 p-4 rounded-lg">
                                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                    Test your API configuration before saving. This will make a real request.
                                </p>
                            </div>

                            <button
                                onClick={handleTest}
                                disabled={!apiUrl || testing}
                                className="flex items-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {testing ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                        Testing...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">play_arrow</span>
                                        Run Test
                                    </>
                                )}
                            </button>

                            {testResult && (
                                <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`material-symbols-outlined ${testResult.success ? 'text-green-500' : 'text-red-500'}`}>
                                            {testResult.success ? 'check_circle' : 'error'}
                                        </span>
                                        <span className={`font-medium ${testResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                            {testResult.success ? `Success (${testResult.statusCode}) - ${testResult.responseTime}ms` : 'Failed'}
                                        </span>
                                    </div>

                                    {testResult.error && (
                                        <p className="text-sm text-red-600 dark:text-red-400 mb-2">{testResult.error}</p>
                                    )}

                                    {testResult.data && (
                                        <div className="mt-2">
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Response:</p>
                                            <pre className="p-3 bg-gray-800 text-green-400 rounded-lg text-xs overflow-auto max-h-64">
                                                {JSON.stringify(testResult.data, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="flex justify-end gap-3 p-6 border-t dark:border-white/10">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!apiUrl}
                        className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50"
                    >
                        Save
                    </button>
                </footer>
            </div>
        </div>
    );
};
