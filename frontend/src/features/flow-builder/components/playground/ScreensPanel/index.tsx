import React from 'react';
import type { BuilderScreen } from '../../../types/builder.types';
import { ScreenListItem } from './ScreenListItem';
import { AddScreenButton } from './AddScreenButton';

interface ScreensPanelProps {
  screens: BuilderScreen[];
  selectedScreenId: string | null;
  onSelectScreen: (screenId: string) => void;
  onAddScreen: () => void;
  onDeleteScreen: (screenId: string) => void;
  onDuplicateScreen: (screenId: string) => void;
  className?: string;
}

export const ScreensPanel: React.FC<ScreensPanelProps> = ({
  screens,
  selectedScreenId,
  onSelectScreen,
  onAddScreen,
  onDeleteScreen,
  onDuplicateScreen,
  className = '',
}) => {
  return (
    <div
      className={`
        flex flex-col h-full bg-zinc-900 border-r border-zinc-700
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
        <h2 className="text-sm font-semibold text-white">Screens</h2>
        <span className="text-xs text-zinc-500">
          {screens.length} {screens.length === 1 ? 'screen' : 'screens'}
        </span>
      </div>

      {/* Screen List (Scrollable) */}
      <div className="flex-1 overflow-y-auto">
        {screens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 py-8 text-center">
            <span className="material-symbols-outlined text-5xl text-zinc-700 mb-3">
              devices
            </span>
            <p className="text-sm text-zinc-400 mb-1">No screens yet</p>
            <p className="text-xs text-zinc-500">
              Add your first screen to get started
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-700">
            {screens.map((screen, index) => (
              <ScreenListItem
                key={screen.id}
                screen={screen}
                index={index}
                isSelected={screen.id === selectedScreenId}
                onSelect={() => onSelectScreen(screen.id)}
                onDelete={() => onDeleteScreen(screen.id)}
                onDuplicate={() => onDuplicateScreen(screen.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Screen Button */}
      <AddScreenButton onClick={onAddScreen} />
    </div>
  );
};
