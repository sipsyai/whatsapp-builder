import { useState } from 'react';

interface VariablesPanelProps {
  variables: Record<string, any>;
}

export const VariablesPanel = ({ variables }: VariablesPanelProps) => {
  const [isVariablesExpanded, setIsVariablesExpanded] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const copyToClipboard = async (key: string, value: any) => {
    try {
      await navigator.clipboard.writeText(formatValue(value));
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const isComplexValue = (value: any): boolean => {
    return value !== null && typeof value === 'object';
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Variables Section */}
      <div className="bg-bg-gray-800 rounded-lg shadow-sm border border-gray-700">
        <button
          onClick={() => setIsVariablesExpanded(!isVariablesExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">
              database
            </span>
            <h3 className="font-semibold text-gray-900">
              Variables
            </h3>
            <span className="text-xs text-gray-500 bg-bg-gray-700 px-2 py-0.5 rounded-full">
              {Object.keys(variables).length}
            </span>
          </div>
          <span className={`material-symbols-outlined text-gray-400 transition-transform ${isVariablesExpanded ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        {isVariablesExpanded && (
          <div className="border-t border-gray-700">
            {Object.keys(variables).length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No variables set
              </div>
            ) : (
              <div className="divide-y divide-gray-700 max-h-[400px] overflow-y-auto">
                {Object.entries(variables).map(([key, value]) => (
                  <div key={key} className="p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-700 font-mono">
                        {key}
                      </span>
                      <button
                        onClick={() => copyToClipboard(key, value)}
                        className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                        title="Copy value"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {copiedKey === key ? 'check' : 'content_copy'}
                        </span>
                      </button>
                    </div>
                    <div className={`text-sm ${isComplexValue(value) ? 'font-mono' : ''}`}>
                      {isComplexValue(value) ? (
                        <pre className="text-xs text-gray-600 bg-gray-900 p-2 rounded overflow-x-auto">
                          {formatValue(value)}
                        </pre>
                      ) : (
                        <span className="text-gray-900">
                          {formatValue(value)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
