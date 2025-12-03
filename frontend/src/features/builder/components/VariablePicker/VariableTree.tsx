import React, { useState } from 'react';
import { VariableTreeItem } from './VariableTreeItem';
import type { NodeVariableGroup, VariableInfo } from './types';

interface VariableTreeProps {
  groups: NodeVariableGroup[];
  onSelect: (variable: VariableInfo) => void;
}

export const VariableTree: React.FC<VariableTreeProps> = ({ groups, onSelect }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(groups.map(g => g.nodeId))
  );

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  return (
    <div className="py-1">
      {groups.map(group => (
        <div key={group.nodeId} className="mb-1">
          <button
            onClick={() => toggleNode(group.nodeId)}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm text-white/40">
              {expandedNodes.has(group.nodeId) ? 'expand_more' : 'chevron_right'}
            </span>
            <span className={`material-symbols-outlined text-base ${group.color}`}>
              {group.icon}
            </span>
            <span className="text-sm font-medium text-white truncate flex-1 text-left">
              {group.nodeLabel}
            </span>
            <span className="text-xs text-white/40 bg-white/10 px-1.5 py-0.5 rounded">
              {group.variables.length}
            </span>
          </button>

          {expandedNodes.has(group.nodeId) && (
            <div className="pl-6">
              {group.variables.map(variable => (
                <VariableTreeItem
                  key={variable.id}
                  variable={variable}
                  onSelect={onSelect}
                  nodeColor={group.color}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
