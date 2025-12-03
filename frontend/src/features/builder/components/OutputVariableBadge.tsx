import React, { useState } from 'react';
import { useAvailableVariables } from '../hooks/useAvailableVariables';
import { getNodeOutputs, type NodeOutputDefinition } from '../utils/autoVariableNaming';

interface OutputVariableBadgeProps {
  nodeId: string;
  nodeType: string;
}

export const OutputVariableBadge: React.FC<OutputVariableBadgeProps> = ({
  nodeId,
  nodeType
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const { getNodeAutoVariable } = useAvailableVariables();

  const nodeInfo = getNodeAutoVariable(nodeId);
  const outputs = getNodeOutputs(nodeType);

  if (!nodeInfo || outputs.length === 0) {
    return null;
  }

  const { autoVariableName } = nodeInfo;

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`{{${text}}}`);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  const dataTypeIcon: Record<string, string> = {
    string: 'text_fields',
    number: 'numbers',
    boolean: 'toggle_on',
    object: 'data_object',
    array: 'data_array'
  };

  return (
    <div className="space-y-2">
      {/* Header Label */}
      <label className="text-sm text-white/60">Output Variables (Auto-generated)</label>

      {/* Main Badge */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 p-3 bg-black/30 border border-primary/30 rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
      >
        <span className="material-symbols-outlined text-primary text-lg">data_object</span>
        <code className="flex-1 text-sm font-mono text-primary font-medium">
          {autoVariableName}
        </code>
        <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded">
          {outputs.length} output{outputs.length > 1 ? 's' : ''}
        </span>
        <span className={`material-symbols-outlined text-white/40 text-sm transition-transform ${expanded ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </div>

      {/* Output Details */}
      {expanded && (
        <div className="bg-black/20 border border-white/10 rounded-lg overflow-hidden">
          <div className="p-2 bg-white/5 border-b border-white/10">
            <span className="text-xs text-white/50">Available outputs:</span>
          </div>
          <div className="divide-y divide-white/5">
            {outputs.map((output: NodeOutputDefinition) => {
              const fullPath = `${autoVariableName}.${output.name}`;
              const isCopied = copied === fullPath;

              return (
                <div
                  key={output.name}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 group"
                >
                  <span className="material-symbols-outlined text-sm text-white/30">
                    {dataTypeIcon[output.dataType] || 'help'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <code className="text-sm font-mono text-white/80 block truncate">
                      {fullPath}
                    </code>
                    {output.description && (
                      <span className="text-xs text-white/40">{output.description}</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleCopy(fullPath, e)}
                    className={`p-1.5 rounded transition-colors ${
                      isCopied
                        ? 'bg-green-500/20 text-green-400'
                        : 'opacity-0 group-hover:opacity-100 hover:bg-white/10 text-white/60'
                    }`}
                    title="Copy variable"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isCopied ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
          <div className="p-2 bg-white/5 border-t border-white/10">
            <p className="text-xs text-white/40 text-center">
              Use <code className="text-primary/70">{'{{variable}}'}</code> syntax in messages
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
