import React from 'react';
import type { VariableInfo } from './types';

interface VariableTreeItemProps {
  variable: VariableInfo;
  onSelect: (variable: VariableInfo) => void;
  nodeColor: string;
}

export const VariableTreeItem: React.FC<VariableTreeItemProps> = ({
  variable,
  onSelect,
  nodeColor
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', `{{${variable.name}}}`);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const dataTypeIcon: Record<string, string> = {
    string: 'text_fields',
    number: 'numbers',
    boolean: 'toggle_on',
    object: 'data_object',
    array: 'data_array'
  };

  return (
    <button
      onClick={() => onSelect(variable)}
      draggable
      onDragStart={handleDragStart}
      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 transition-colors cursor-pointer group text-left"
    >
      <span className="material-symbols-outlined text-xs text-white/30">
        {dataTypeIcon[variable.dataType] || 'help'}
      </span>
      <span className="text-sm text-white/80 font-mono flex-1 truncate">
        {variable.name}
      </span>
      <span className={`material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity ${nodeColor}`}>
        add_circle
      </span>
    </button>
  );
};
