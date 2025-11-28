import React from 'react';
import type { BuilderScreen } from '../../../types/builder.types';

interface ScreenListItemProps {
  screen: BuilderScreen;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export const ScreenListItem: React.FC<ScreenListItemProps> = ({
  screen,
  index,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`
        group relative flex items-center gap-3 px-4 py-3 cursor-pointer
        border-b border-zinc-700 transition-all
        ${isSelected
          ? 'bg-primary/20 border-l-2 border-l-primary'
          : 'hover:bg-zinc-800 border-l-2 border-l-transparent'
        }
      `}
    >
      {/* Screen Number Indicator */}
      <div
        className={`
          flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold
          ${isSelected
            ? 'bg-primary text-white'
            : 'bg-zinc-700 text-zinc-400 group-hover:bg-zinc-600'
          }
        `}
      >
        {index + 1}
      </div>

      {/* Screen Title */}
      <div className="flex-1 min-w-0">
        <p
          className={`
            text-sm font-medium truncate
            ${isSelected ? 'text-white' : 'text-zinc-300'}
          `}
        >
          {screen.title || screen.id}
        </p>
        {screen.terminal && (
          <p className="text-xs text-zinc-500 mt-0.5">Terminal screen</p>
        )}
      </div>

      {/* Action Buttons */}
      <div
        className={`
          flex items-center gap-1
          ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
          transition-opacity
        `}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white
                     transition-colors"
          title="Duplicate screen"
          type="button"
        >
          <span className="material-symbols-outlined text-base">
            content_copy
          </span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 rounded hover:bg-red-600/20 text-zinc-400 hover:text-red-400
                     transition-colors"
          title="Delete screen"
          type="button"
        >
          <span className="material-symbols-outlined text-base">delete</span>
        </button>
      </div>
    </div>
  );
};
