import { useState } from "react";
import { client } from "../../../api/client";
import { VariableInput } from './VariablePicker';
import { OutputVariableBadge } from './OutputVariableBadge';

type TabType = 'request' | 'auth' | 'params' | 'headers' | 'response' | 'test';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type ContentType = 'application/json' | 'multipart/form-data' | 'application/x-www-form-urlencoded';
type AuthType = 'none' | 'bearer' | 'basic' | 'api_key';

interface Header {
    key: string;
    value: string;
}

interface QueryParam {
    key: string;
    value: string;
}

export const ConfigRestApi = ({ data, nodeId, nodeType, onClose, onSave }: any) => {
    const [activeTab, setActiveTab] = useState<TabType>('request');

    // Request tab state
    const [label, setLabel] = useState(data.label || "REST API");
    const [apiMethod, setApiMethod] = useState<HttpMethod>(data.apiMethod || 'GET');
    const [apiUrl, setApiUrl] = useState(data.apiUrl || "");
    const [apiBody, setApiBody] = useState(data.apiBody || "");
    const [apiTimeout, setApiTimeout] = useState(data.apiTimeout || 30000);
    const [apiContentType, setApiContentType] = useState<ContentType>(data.apiContentType || 'application/json');

    // Auth tab state
    const [authType, setAuthType] = useState<AuthType>(data.apiAuthType || 'none');
    const [authToken, setAuthToken] = useState(data.apiAuthToken || '');
    const [authUsername, setAuthUsername] = useState(data.apiAuthUsername || '');
    const [authPassword, setAuthPassword] = useState(data.apiAuthPassword || '');
    const [authKeyName, setAuthKeyName] = useState(data.apiAuthKeyName || 'X-API-Key');
    const [authKeyValue, setAuthKeyValue] = useState(data.apiAuthKeyValue || '');
    const [authKeyLocation, setAuthKeyLocation] = useState<'header' | 'query'>(data.apiAuthKeyLocation || 'header');

    // Query Params tab state
    const [queryParams, setQueryParams] = useState<QueryParam[]>(() => {
        if (data.apiQueryParams) {
            return Object.entries(data.apiQueryParams).map(([key, value]) => ({ key, value: String(value) }));
        }
        return [{ key: '', value: '' }];
    });

    // Headers tab state
    const [headers, setHeaders] = useState<Header[]>(() => {
        if (data.apiHeaders) {
            return Object.entries(data.apiHeaders).map(([key, value]) => ({ key, value: String(value) }));
        }
        return [{ key: '', value: '' }];
    });

    // Response tab state
    const [apiResponsePath, setApiResponsePath] = useState(data.apiResponsePath || "");

    // Test tab state
    const [testResult, setTestResult] = useState<any>(null);
    const [testing, setTesting] = useState(false);
    const [testResultTab, setTestResultTab] = useState<'body' | 'headers'>('body');

    // Header helpers
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

    // Query Params helpers
    const addQueryParam = () => {
        setQueryParams([...queryParams, { key: '', value: '' }]);
    };

    const removeQueryParam = (index: number) => {
        setQueryParams(queryParams.filter((_, i) => i !== index));
    };

    const updateQueryParam = (index: number, field: 'key' | 'value', value: string) => {
        const newParams = [...queryParams];
        newParams[index][field] = value;
        setQueryParams(newParams);
    };

    // Build final headers with auth
    const buildFinalHeaders = (): Record<string, string> => {
        const headersObj: Record<string, string> = {};
        headers.forEach(h => {
            if (h.key) headersObj[h.key] = h.value;
        });

        // Add auth header
        if (authType === 'bearer' && authToken) {
            headersObj['Authorization'] = `Bearer ${authToken}`;
        } else if (authType === 'api_key' && authKeyValue && authKeyLocation === 'header') {
            headersObj[authKeyName] = authKeyValue;
        }
        // Basic auth is handled by backend (base64 encoding)

        return headersObj;
    };

    // Build query params object
    const buildQueryParams = (): Record<string, string> => {
        const paramsObj: Record<string, string> = {};
        queryParams.forEach(p => {
            if (p.key) paramsObj[p.key] = p.value;
        });

        // Add API key to query if needed
        if (authType === 'api_key' && authKeyValue && authKeyLocation === 'query') {
            paramsObj[authKeyName] = authKeyValue;
        }

        return paramsObj;
    };

    const handleTest = async () => {
        if (!apiUrl) return;

        setTesting(true);
        setTestResult(null);

        try {
            const headersObj = buildFinalHeaders();
            const queryParamsObj = buildQueryParams();

            const response = await client.post('/api/chatbots/test-rest-api', {
                method: apiMethod,
                url: apiUrl,
                headers: headersObj,
                body: apiBody || undefined,
                responsePath: apiResponsePath,
                timeout: apiTimeout,
                contentType: apiContentType,
                testVariables: queryParamsObj,
            });

            setTestResult(response.data);
        } catch (error: any) {
            setTestResult({ success: false, error: error.message });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = () => {
        const headersObj = buildFinalHeaders();
        const queryParamsObj = buildQueryParams();

        const saveData = {
            ...data,
            label,
            apiMethod,
            apiUrl,
            apiHeaders: Object.keys(headersObj).length > 0 ? headersObj : undefined,
            apiBody: apiBody || undefined,
            apiResponsePath: apiResponsePath || undefined,
            apiTimeout,
            // New fields
            apiContentType: apiContentType !== 'application/json' ? apiContentType : undefined,
            apiQueryParams: Object.keys(queryParamsObj).length > 0 ? queryParamsObj : undefined,
            apiAuthType: authType !== 'none' ? authType : undefined,
            apiAuthToken: authType === 'bearer' ? authToken : undefined,
            apiAuthUsername: authType === 'basic' ? authUsername : undefined,
            apiAuthPassword: authType === 'basic' ? authPassword : undefined,
            apiAuthKeyName: authType === 'api_key' ? authKeyName : undefined,
            apiAuthKeyValue: authType === 'api_key' ? authKeyValue : undefined,
            apiAuthKeyLocation: authType === 'api_key' ? authKeyLocation : undefined,
        };
        // Remove legacy variable fields - auto-generated now
        delete saveData.apiOutputVariable;
        delete saveData.apiErrorVariable;
        onSave(saveData);
        onClose();
    };

    const tabs: { id: TabType; label: string; icon: string }[] = [
        { id: 'request', label: 'Request', icon: 'send' },
        { id: 'auth', label: 'Auth', icon: 'lock' },
        { id: 'params', label: 'Params', icon: 'tune' },
        { id: 'headers', label: 'Headers', icon: 'code' },
        { id: 'response', label: 'Response', icon: 'output' },
        { id: 'test', label: 'Test', icon: 'play_arrow' },
    ];

    const methodColors: Record<HttpMethod, string> = {
        GET: 'bg-green-500',
        POST: 'bg-blue-500',
        PUT: 'bg-orange-500',
        PATCH: 'bg-yellow-500',
        DELETE: 'bg-red-500',
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-2xl h-full bg-[#102216] shadow-2xl overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <header className="flex justify-between items-center p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="bg-cyan-500/20 p-2 rounded-lg">
                            <span className="material-symbols-outlined text-cyan-500">api</span>
                        </div>
                        <h1 className="text-xl font-bold text-white">Configure REST API</h1>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
                        <span className="material-symbols-outlined text-white">close</span>
                    </button>
                </header>

                {/* Tabs */}
                <div className="flex border-b border-white/10 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'text-cyan-500 border-b-2 border-cyan-500'
                                    : 'text-gray-400 hover:text-white'
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
                                <label className="block text-sm font-medium text-white mb-2">Label</label>
                                <input
                                    type="text"
                                    value={label}
                                    onChange={e => setLabel(e.target.value)}
                                    className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white"
                                    placeholder="API Node Label"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white mb-2">HTTP Method</label>
                                <div className="flex flex-wrap gap-2">
                                    {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const).map(method => (
                                        <button
                                            key={method}
                                            onClick={() => setApiMethod(method)}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                                apiMethod === method
                                                    ? `${methodColors[method]} text-white`
                                                    : 'bg-white/10 text-white hover:bg-white/20'
                                            }`}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white mb-2">URL</label>
                                <VariableInput
                                    value={apiUrl}
                                    onChange={setApiUrl}
                                    placeholder="https://api.example.com/{{endpoint}}"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Use {'{{variable}}'} for dynamic values
                                </p>
                            </div>

                            {['POST', 'PUT', 'PATCH'].includes(apiMethod) && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">Content-Type</label>
                                        <select
                                            value={apiContentType}
                                            onChange={e => setApiContentType(e.target.value as ContentType)}
                                            className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white"
                                        >
                                            <option value="application/json">application/json</option>
                                            <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option>
                                            <option value="multipart/form-data">multipart/form-data</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Request Body {apiContentType === 'application/json' ? '(JSON)' : '(Key-Value as JSON)'}
                                        </label>
                                        <VariableInput
                                            value={apiBody}
                                            onChange={setApiBody}
                                            placeholder='{"key": "{{variable}}"}'
                                            multiline
                                            rows={8}
                                        />
                                        {apiContentType !== 'application/json' && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                For {apiContentType}, provide key-value pairs as JSON. They will be converted automatically.
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Timeout (ms)</label>
                                <input
                                    type="number"
                                    value={apiTimeout}
                                    onChange={e => setApiTimeout(parseInt(e.target.value) || 30000)}
                                    className="w-32 p-3 border border-white/20 rounded-lg bg-white/5 text-white"
                                />
                            </div>
                        </div>
                    )}

                    {/* Auth Tab */}
                    {activeTab === 'auth' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Authentication Type</label>
                                <select
                                    value={authType}
                                    onChange={e => setAuthType(e.target.value as AuthType)}
                                    className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white"
                                >
                                    <option value="none">No Auth</option>
                                    <option value="bearer">Bearer Token</option>
                                    <option value="basic">Basic Auth</option>
                                    <option value="api_key">API Key</option>
                                </select>
                            </div>

                            {authType === 'bearer' && (
                                <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">Token</label>
                                        <VariableInput
                                            value={authToken}
                                            onChange={setAuthToken}
                                            placeholder="Bearer token or {{token_variable}}"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">
                                            Use {'{{variable}}'} for dynamic tokens
                                        </p>
                                    </div>
                                    <div className="text-xs text-gray-400 p-2 bg-gray-800 rounded">
                                        Header: <code className="text-cyan-400">Authorization: Bearer {'<token>'}</code>
                                    </div>
                                </div>
                            )}

                            {authType === 'basic' && (
                                <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">Username</label>
                                        <input
                                            type="text"
                                            value={authUsername}
                                            onChange={e => setAuthUsername(e.target.value)}
                                            className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white"
                                            placeholder="Username"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">Password</label>
                                        <input
                                            type="password"
                                            value={authPassword}
                                            onChange={e => setAuthPassword(e.target.value)}
                                            className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white"
                                            placeholder="Password"
                                        />
                                    </div>
                                    <div className="text-xs text-gray-400 p-2 bg-gray-800 rounded">
                                        Header: <code className="text-cyan-400">Authorization: Basic {'<base64>'}</code>
                                    </div>
                                </div>
                            )}

                            {authType === 'api_key' && (
                                <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">Key Name</label>
                                        <input
                                            type="text"
                                            value={authKeyName}
                                            onChange={e => setAuthKeyName(e.target.value)}
                                            className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white"
                                            placeholder="X-API-Key"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">Key Value</label>
                                        <input
                                            type="password"
                                            value={authKeyValue}
                                            onChange={e => setAuthKeyValue(e.target.value)}
                                            className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white font-mono"
                                            placeholder="API key value"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">Add to</label>
                                        <div className="flex gap-2">
                                            {(['header', 'query'] as const).map(loc => (
                                                <button
                                                    key={loc}
                                                    onClick={() => setAuthKeyLocation(loc)}
                                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                                        authKeyLocation === loc
                                                            ? 'bg-cyan-500 text-white'
                                                            : 'bg-white/10 text-white hover:bg-white/20'
                                                    }`}
                                                >
                                                    {loc === 'header' ? 'Header' : 'Query Params'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400 p-2 bg-gray-800 rounded">
                                        {authKeyLocation === 'header'
                                            ? <>Header: <code className="text-cyan-400">{authKeyName || 'X-API-Key'}: {'<value>'}</code></>
                                            : <>Query: <code className="text-cyan-400">?{authKeyName || 'api_key'}={'<value>'}</code></>
                                        }
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Query Params Tab */}
                    {activeTab === 'params' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-400">
                                Add query parameters to append to the URL.
                            </p>

                            {queryParams.map((param, index) => (
                                <div key={index} className="flex gap-2 items-start">
                                    <input
                                        type="text"
                                        value={param.key}
                                        onChange={e => updateQueryParam(index, 'key', e.target.value)}
                                        className="flex-1 p-3 border border-white/20 rounded-lg bg-white/5 text-white"
                                        placeholder="Parameter Name"
                                    />
                                    <div className="flex-1">
                                        <VariableInput
                                            value={param.value}
                                            onChange={(val) => updateQueryParam(index, 'value', val)}
                                            placeholder="Value or {{variable}}"
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeQueryParam(index)}
                                        className="p-3 text-red-500 hover:bg-red-500/10 rounded-lg"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            ))}

                            <button
                                onClick={addQueryParam}
                                className="flex items-center gap-2 px-4 py-2 text-cyan-500 hover:bg-cyan-500/10 rounded-lg"
                            >
                                <span className="material-symbols-outlined">add</span>
                                Add Parameter
                            </button>

                            {/* URL Preview */}
                            {queryParams.some(p => p.key) && (
                                <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                                    <p className="text-xs text-gray-400 mb-1">URL Preview:</p>
                                    <code className="text-sm text-cyan-400 break-all">
                                        {apiUrl || 'https://...'}{queryParams.filter(p => p.key).length > 0 && '?'}
                                        {queryParams.filter(p => p.key).map((p, i) => `${i > 0 ? '&' : ''}${p.key}=${p.value}`).join('')}
                                    </code>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Headers Tab */}
                    {activeTab === 'headers' && (
                        <div className="space-y-4">
                            {/* Auto-generated headers info */}
                            {(authType !== 'none' || ['POST', 'PUT', 'PATCH'].includes(apiMethod)) && (
                                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                    <p className="text-xs font-medium text-blue-400 mb-2">Auto-generated headers:</p>
                                    <div className="text-xs text-gray-400 space-y-1">
                                        {authType === 'bearer' && <div>Authorization: Bearer ***</div>}
                                        {authType === 'basic' && <div>Authorization: Basic ***</div>}
                                        {authType === 'api_key' && authKeyLocation === 'header' && <div>{authKeyName}: ***</div>}
                                        {['POST', 'PUT', 'PATCH'].includes(apiMethod) && <div>Content-Type: {apiContentType}</div>}
                                    </div>
                                </div>
                            )}

                            <p className="text-sm text-gray-400">
                                Add custom headers for additional configuration.
                            </p>

                            {headers.map((header, index) => (
                                <div key={index} className="flex gap-2 items-start">
                                    <input
                                        type="text"
                                        value={header.key}
                                        onChange={e => updateHeader(index, 'key', e.target.value)}
                                        className="flex-1 p-3 border border-white/20 rounded-lg bg-white/5 text-white"
                                        placeholder="Header Key"
                                    />
                                    <div className="flex-1">
                                        <VariableInput
                                            value={header.value}
                                            onChange={(val) => updateHeader(index, 'value', val)}
                                            placeholder="Value or {{variable}}"
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeHeader(index)}
                                        className="p-3 text-red-500 hover:bg-red-500/10 rounded-lg"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            ))}

                            <button
                                onClick={addHeader}
                                className="flex items-center gap-2 px-4 py-2 text-cyan-500 hover:bg-cyan-500/10 rounded-lg"
                            >
                                <span className="material-symbols-outlined">add</span>
                                Add Header
                            </button>
                        </div>
                    )}

                    {/* Response Tab */}
                    {activeTab === 'response' && (
                        <div className="space-y-6">
                            {/* Output Variable Badge (Auto-generated) */}
                            <OutputVariableBadge nodeId={nodeId} nodeType={nodeType} />

                            <div>
                                <label className="block text-sm font-medium text-white mb-2">JSON Path (optional)</label>
                                <input
                                    type="text"
                                    value={apiResponsePath}
                                    onChange={e => setApiResponsePath(e.target.value)}
                                    className="w-full p-3 border border-white/20 rounded-lg bg-white/5 text-white font-mono text-sm"
                                    placeholder="data"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Extract specific data from response (e.g., "data", "data.items", "data.items[0].name")
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Test Tab */}
                    {activeTab === 'test' && (
                        <div className="space-y-6">
                            <div className="bg-yellow-500/10 p-4 rounded-lg">
                                <p className="text-sm text-yellow-400">
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
                                <div className={`rounded-lg overflow-hidden ${testResult.success ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                    {/* Status Bar */}
                                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                                        <div className="flex items-center gap-2">
                                            <span className={`material-symbols-outlined ${testResult.success ? 'text-green-500' : 'text-red-500'}`}>
                                                {testResult.success ? 'check_circle' : 'error'}
                                            </span>
                                            <span className={`font-medium ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                                                {testResult.success ? 'Success' : 'Failed'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            {testResult.statusCode && (
                                                <span className={`px-2 py-1 rounded font-mono ${
                                                    testResult.statusCode >= 200 && testResult.statusCode < 300
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : testResult.statusCode >= 400
                                                            ? 'bg-red-500/20 text-red-400'
                                                            : 'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                    {testResult.statusCode}
                                                </span>
                                            )}
                                            {testResult.responseTime && (
                                                <span className="text-gray-400">
                                                    {testResult.responseTime}ms
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {testResult.error && (
                                        <div className="p-4 border-b border-white/10">
                                            <p className="text-sm text-red-400">{testResult.error}</p>
                                        </div>
                                    )}

                                    {/* Response Tabs */}
                                    {(testResult.data !== undefined || testResult.responseHeaders) && (
                                        <>
                                            <div className="flex border-b border-white/10">
                                                <button
                                                    onClick={() => setTestResultTab('body')}
                                                    className={`px-4 py-2 text-sm ${testResultTab === 'body' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'}`}
                                                >
                                                    Body
                                                </button>
                                                {testResult.responseHeaders && (
                                                    <button
                                                        onClick={() => setTestResultTab('headers')}
                                                        className={`px-4 py-2 text-sm ${testResultTab === 'headers' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400'}`}
                                                    >
                                                        Headers
                                                    </button>
                                                )}
                                            </div>

                                            <div className="p-4">
                                                {testResultTab === 'body' && testResult.data !== undefined && (
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs text-gray-400">
                                                                {typeof testResult.data === 'object'
                                                                    ? `${Array.isArray(testResult.data) ? testResult.data.length + ' items' : Object.keys(testResult.data).length + ' keys'}`
                                                                    : typeof testResult.data}
                                                            </span>
                                                            <button
                                                                onClick={() => navigator.clipboard.writeText(JSON.stringify(testResult.data, null, 2))}
                                                                className="text-xs text-cyan-400 hover:text-cyan-300"
                                                            >
                                                                Copy
                                                            </button>
                                                        </div>
                                                        <pre className="p-3 bg-gray-800 text-green-400 rounded-lg text-xs overflow-auto max-h-64">
                                                            {JSON.stringify(testResult.data, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}

                                                {testResultTab === 'headers' && testResult.responseHeaders && (
                                                    <div className="space-y-1">
                                                        {Object.entries(testResult.responseHeaders).map(([key, value]) => (
                                                            <div key={key} className="flex text-xs">
                                                                <span className="text-cyan-400 font-medium w-48 flex-shrink-0">{key}:</span>
                                                                <span className="text-gray-300 break-all">{String(value)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="flex justify-end gap-3 p-6 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-gray-400 hover:bg-white/10 rounded-lg"
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
