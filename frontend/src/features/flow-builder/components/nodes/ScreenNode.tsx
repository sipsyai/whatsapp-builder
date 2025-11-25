import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ScreenNodeData } from '../../types';

export const ScreenNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as ScreenNodeData;
  const { screen, isTerminal, hasFooter, componentCount, label, description } = nodeData;

  return (
    <div
      className={`
        min-w-[280px] max-w-[320px] rounded-lg border-2 shadow-lg
        bg-white dark:bg-[#193322] transition-all duration-200
        ${selected ? 'border-primary ring-2 ring-primary/30' : 'border-zinc-300 dark:border-white/10'}
        ${isTerminal ? 'border-green-500 dark:border-green-400' : ''}
      `}
    >
      {/* Input Handle (top) - not for start screen */}
      {!screen.id.startsWith('start') && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-primary !border-2 !border-white dark:!border-[#112217]"
        />
      )}

      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
              {label || 'Untitled Screen'}
            </h3>
            {description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          {isTerminal && (
            <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
              Terminal
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        {/* Screen ID */}
        <div className="flex items-center gap-2 text-xs">
          <span className="material-symbols-outlined text-xs text-zinc-400">badge</span>
          <span className="text-zinc-600 dark:text-zinc-400 font-mono">{screen.id}</span>
        </div>

        {/* Component Count */}
        <div className="flex items-center gap-2 text-xs">
          <span className="material-symbols-outlined text-xs text-blue-500">widgets</span>
          <span className="text-zinc-600 dark:text-zinc-400">
            {componentCount || 0} component{componentCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Footer Indicator */}
        {hasFooter && (
          <div className="flex items-center gap-2 text-xs">
            <span className="material-symbols-outlined text-xs text-purple-500">touch_app</span>
            <span className="text-zinc-600 dark:text-zinc-400">Has Footer</span>
          </div>
        )}

        {/* Data Model Indicator */}
        {screen.data && Object.keys(screen.data).length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="material-symbols-outlined text-xs text-orange-500">database</span>
            <span className="text-zinc-600 dark:text-zinc-400">
              {Object.keys(screen.data).length} data field{Object.keys(screen.data).length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Footer (validation status) */}
      {screen.validation && !screen.validation.isValid && (
        <div className="px-4 py-2 border-t border-zinc-200 dark:border-white/10 bg-red-50 dark:bg-red-900/20 rounded-b-lg">
          <div className="flex items-center gap-2 text-xs">
            <span className="material-symbols-outlined text-xs text-red-600 dark:text-red-400">error</span>
            <span className="text-red-700 dark:text-red-300 font-medium">
              {screen.validation.errors.length} validation error{screen.validation.errors.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Output Handle (bottom) - not for terminal screens */}
      {!isTerminal && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-primary !border-2 !border-white dark:!border-[#112217]"
        />
      )}
    </div>
  );
});

ScreenNode.displayName = 'ScreenNode';
