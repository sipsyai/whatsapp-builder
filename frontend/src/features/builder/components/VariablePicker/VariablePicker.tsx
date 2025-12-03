import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAvailableVariables } from '../../hooks/useAvailableVariables';
import { VariableTree } from './VariableTree';
import type { VariablePickerProps, VariableInfo } from './types';

export const VariablePicker: React.FC<VariablePickerProps> = ({
  onSelect,
  onClose,
  currentNodeId,
  filterTypes
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const { nodeGroups, isEmpty } = useAvailableVariables({
    excludeNodeId: currentNodeId,
    filterTypes
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return nodeGroups;
    const lowerQuery = searchQuery.toLowerCase();
    return nodeGroups
      .map(group => ({
        ...group,
        variables: group.variables.filter(v =>
          v.name.toLowerCase().includes(lowerQuery) ||
          v.path.toLowerCase().includes(lowerQuery) ||
          v.nodeLabel.toLowerCase().includes(lowerQuery)
        )
      }))
      .filter(g => g.variables.length > 0);
  }, [nodeGroups, searchQuery]);

  const handleSelect = (variable: VariableInfo) => {
    onSelect(variable);
    onClose();
  };

  return (
    <div
      ref={containerRef}
      className="absolute z-[100] w-80 max-h-96 bg-[#102216] border border-white/20 rounded-lg shadow-2xl overflow-hidden"
    >
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">data_object</span>
          <span className="text-sm font-bold text-white">Insert Variable</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors">
          <span className="material-symbols-outlined text-white/60 text-sm">close</span>
        </button>
      </div>

      <div className="p-2 border-b border-white/10">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-white/40 text-sm">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search variables..."
            className="w-full pl-8 pr-3 py-1.5 bg-black/20 border border-white/10 rounded text-sm text-white placeholder-white/40 focus:outline-none focus:border-primary/50"
            autoFocus
          />
        </div>
      </div>

      <div className="overflow-y-auto max-h-64">
        {isEmpty ? (
          <div className="p-4 text-center">
            <span className="material-symbols-outlined text-3xl text-white/30 mb-2">warning</span>
            <p className="text-sm text-white/60">No variables available</p>
            <p className="text-xs text-white/40 mt-1">
              Add Question or REST API nodes with output variables
            </p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-white/60">No matching variables</p>
          </div>
        ) : (
          <VariableTree groups={filteredGroups} onSelect={handleSelect} />
        )}
      </div>

      <div className="p-2 border-t border-white/10 bg-white/5">
        <p className="text-xs text-white/40 text-center">
          Click to insert - Drag to drop
        </p>
      </div>
    </div>
  );
};
