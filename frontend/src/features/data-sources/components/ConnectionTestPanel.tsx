import React, { useState } from 'react';
import { connectionApi } from '../api';
import type {
  DataSourceConnection,
  TestConnectionRequest,
  TestConnectionResponse,
} from '../types';

interface ConnectionTestPanelProps {
  connection: DataSourceConnection;
  allConnections: DataSourceConnection[]; // for chained context
  onClose: () => void;
}

/**
 * ConnectionTestPanel - Inline expandable panel for testing a connection
 *
 * Features:
 * - Shows endpoint: METHOD /path
 * - Optional params input (JSON)
 * - Execute button
 * - Results: status code, response time, data preview, transformed data
 * - If chained: context data input
 */
export const ConnectionTestPanel: React.FC<ConnectionTestPanelProps> = ({
  connection,
  allConnections,
  onClose,
}) => {
  const [paramsJson, setParamsJson] = useState('');
  const [bodyJson, setBodyJson] = useState('');
  const [contextDataJson, setContextDataJson] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestConnectionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const isChained = !!connection.dependsOnConnectionId;
  const showBodyField =
    connection.method === 'POST' ||
    connection.method === 'PUT' ||
    connection.method === 'PATCH';

  const getParentConnection = () => {
    if (!connection.dependsOnConnectionId) return null;
    return allConnections.find((c) => c.id === connection.dependsOnConnectionId);
  };

  const parentConnection = getParentConnection();

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-900/30 text-green-400';
      case 'POST':
        return 'bg-blue-900/30 text-blue-400';
      case 'PUT':
        return 'bg-yellow-900/30 text-yellow-400';
      case 'PATCH':
        return 'bg-orange-900/30 text-orange-400';
      case 'DELETE':
        return 'bg-red-900/30 text-red-400';
      default:
        return 'bg-zinc-900/30 text-zinc-400';
    }
  };

  const handleTest = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const request: TestConnectionRequest = {};

      // Parse params if provided
      if (paramsJson.trim()) {
        try {
          request.params = JSON.parse(paramsJson);
        } catch (err) {
          setError('Invalid JSON in parameters field');
          setLoading(false);
          return;
        }
      }

      // Parse body if provided
      if (showBodyField && bodyJson.trim()) {
        try {
          request.body = JSON.parse(bodyJson);
        } catch (err) {
          setError('Invalid JSON in request body field');
          setLoading(false);
          return;
        }
      }

      // Parse context data if chained
      if (isChained && contextDataJson.trim()) {
        try {
          request.contextData = JSON.parse(contextDataJson);
        } catch (err) {
          setError('Invalid JSON in context data field');
          setLoading(false);
          return;
        }
      }

      const response = await connectionApi.execute(connection.id, request);
      setResult(response);
    } catch (err: any) {
      console.error('Test failed:', err);
      setError(err.response?.data?.message || err.message || 'Failed to execute connection');
    } finally {
      setLoading(false);
    }
  };

  const formatJson = (data: any): string => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-700 rounded-lg m-2 mt-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-700 bg-zinc-800/50">
        <div className="flex items-center gap-3">
          <span
            className={`px-2 py-0.5 text-xs font-bold rounded ${getMethodBadgeColor(
              connection.method
            )}`}
          >
            {connection.method}
          </span>
          <span className="text-sm font-mono text-white">{connection.endpoint}</span>
          {connection.dataKey && (
            <span className="text-xs text-zinc-400">
              (data key: <code className="text-zinc-300">{connection.dataKey}</code>)
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
          title="Close"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>

      {/* Test Form */}
      <div className="p-3 space-y-3">
        {/* Chained Connection Notice */}
        {isChained && parentConnection && (
          <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-2 text-xs">
            <div className="flex items-center gap-2 text-purple-300">
              <span className="material-symbols-outlined text-sm">link</span>
              <span>
                This connection is chained to{' '}
                <strong>{parentConnection.name}</strong>
              </span>
            </div>
            {connection.paramMapping && Object.keys(connection.paramMapping).length > 0 && (
              <div className="mt-2 text-zinc-400">
                <div className="font-medium mb-1">Parameter Mapping:</div>
                <div className="font-mono text-xs bg-zinc-900/50 rounded p-2 space-y-1">
                  {Object.entries(connection.paramMapping).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-zinc-300">{key}</span>
                      <span className="text-zinc-500"> = </span>
                      <span className="text-purple-400">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Context Data Input (for chained connections) */}
        {isChained && (
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Context Data (JSON) - Selected item from parent
            </label>
            <textarea
              value={contextDataJson}
              onChange={(e) => setContextDataJson(e.target.value)}
              placeholder='{"id": "1", "name": "iPhone"}'
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white font-mono text-xs focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Provide the selected item data for JSONPath extraction
            </p>
          </div>
        )}

        {/* Query Parameters Input */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Query Parameters (JSON)
          </label>
          <textarea
            value={paramsJson}
            onChange={(e) => setParamsJson(e.target.value)}
            placeholder='{"page": 1, "limit": 10}'
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white font-mono text-xs focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Request Body Input (for POST/PUT/PATCH) */}
        {showBodyField && (
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Request Body (JSON)
            </label>
            <textarea
              value={bodyJson}
              onChange={(e) => setBodyJson(e.target.value)}
              placeholder='{"key": "value"}'
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white font-mono text-xs focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        )}

        {/* Execute Button */}
        <div className="flex justify-end">
          <button
            onClick={handleTest}
            disabled={loading}
            className="px-4 py-2 bg-primary text-[#112217] rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                Executing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">play_arrow</span>
                Execute
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-400 px-3 py-2 rounded-lg text-sm flex items-start gap-2">
            <span className="material-symbols-outlined text-sm mt-0.5">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="space-y-3 border-t border-zinc-700 pt-3">
            {/* Status Header */}
            <div className="flex items-center gap-4 text-sm">
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
                  <span
                    className={`font-mono ${
                      result.statusCode >= 200 && result.statusCode < 300
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {result.statusCode}
                  </span>
                </div>
              )}

              <div className="text-zinc-400">
                <span className="font-medium">Time:</span>{' '}
                <span className="font-mono">{result.responseTime}ms</span>
              </div>
            </div>

            {/* Transformed Data (if available) */}
            {result.success && result.transformedData && result.transformedData.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-zinc-400">
                    Transformed Data ({result.transformedData.length} items)
                  </label>
                  <button
                    onClick={() => setShowRaw(!showRaw)}
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {showRaw ? 'visibility_off' : 'visibility'}
                    </span>
                    {showRaw ? 'Show Transformed' : 'Show Raw'}
                  </button>
                </div>

                {!showRaw ? (
                  <div className="max-h-48 overflow-auto border border-zinc-700 rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-zinc-800 sticky top-0">
                        <tr>
                          <th className="px-2 py-1.5 text-left text-zinc-400 font-medium">ID</th>
                          <th className="px-2 py-1.5 text-left text-zinc-400 font-medium">Title</th>
                          <th className="px-2 py-1.5 text-left text-zinc-400 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {result.transformedData.map((item, idx) => (
                          <tr key={idx} className="hover:bg-zinc-800/50">
                            <td className="px-2 py-1.5 text-zinc-300 font-mono">{item.id}</td>
                            <td className="px-2 py-1.5 text-white">{item.title}</td>
                            <td className="px-2 py-1.5 text-zinc-400">{item.description || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <pre className="font-mono text-xs bg-zinc-900 p-3 rounded-lg max-h-48 overflow-auto text-green-400 border border-zinc-700">
                    {formatJson(result.data)}
                  </pre>
                )}
              </div>
            )}

            {/* Raw Response Data (if no transform or showing raw) */}
            {result.success && result.data && (!result.transformedData || result.transformedData.length === 0) && (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Response Data
                </label>
                <pre className="font-mono text-xs bg-zinc-900 p-3 rounded-lg max-h-64 overflow-auto text-green-400 border border-zinc-700">
                  {formatJson(result.data)}
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
  );
};
