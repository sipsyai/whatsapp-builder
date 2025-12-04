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
      <div className="bg-gray-900 rounded-lg shadow-lg border border-gray-700/50">
        <button
          onClick={() => setIsVariablesExpanded(!isVariablesExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors rounded-t-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-cyan-400 text-lg">
                database
              </span>
            </div>
            <h3 className="font-semibold text-gray-100">
              Variables
            </h3>
            <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
              {Object.keys(variables).length}
            </span>
          </div>
          <span className={`material-symbols-outlined text-gray-500 transition-transform duration-200 ${isVariablesExpanded ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        {isVariablesExpanded && (
          <div className="border-t border-gray-700/50">
            {Object.keys(variables).length === 0 ? (
              <div className="p-6 text-center">
                <span className="material-symbols-outlined text-3xl text-gray-600 mb-2 block">inventory_2</span>
                <p className="text-sm text-gray-500">No variables set</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700/30 max-h-[400px] overflow-y-auto">
                {Object.entries(variables).map(([key, value]) => (
                  <div key={key} className="p-3 hover:bg-gray-800/50 transition-colors group">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm font-medium text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">
                        {key}
                      </span>
                      <button
                        onClick={() => copyToClipboard(key, value)}
                        className={`flex-shrink-0 p-1 rounded transition-all duration-200 ${
                          copiedKey === key
                            ? 'text-emerald-400 bg-emerald-500/20'
                            : 'text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 opacity-0 group-hover:opacity-100'
                        }`}
                        title="Copy value"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {copiedKey === key ? 'check' : 'content_copy'}
                        </span>
                      </button>
                    </div>
                    <div className={`text-sm ${isComplexValue(value) ? 'font-mono' : ''}`}>
                      {isComplexValue(value) ? (
                        <pre className="text-xs text-cyan-300/90 bg-gray-950 p-3 rounded-lg overflow-x-auto border border-gray-800 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                          {formatValue(value)}
                        </pre>
                      ) : (
                        <span className="text-gray-300">
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
