import { useState, useCallback } from 'react';
import type { BuilderScreen, BuilderComponent } from '../../types';
import { ComponentList } from './ComponentList';

/**
 * Props interface for ScreenEditor
 */
interface ScreenEditorProps {
  screen: BuilderScreen;
  onUpdateScreen: (updates: Partial<BuilderScreen>) => void;
  onAddComponent: () => void;
  onReorderComponents: (newOrder: BuilderComponent[]) => void;
  onEditComponent: (componentId: string) => void;
  onDeleteComponent: (componentId: string) => void;
  onDuplicateComponent: (componentId: string) => void;
}

/**
 * ScreenEditor - Right panel editor for selected screen
 */
export function ScreenEditor({
  screen,
  onUpdateScreen,
  onAddComponent,
  onReorderComponents,
  onEditComponent,
  onDeleteComponent,
  onDuplicateComponent,
}: ScreenEditorProps) {
  const [isEditingId, setIsEditingId] = useState(false);

  const handleScreenIdChange = useCallback(
    (value: string) => {
      // Validate screen ID format
      const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, '');
      onUpdateScreen({ id: sanitized });
    },
    [onUpdateScreen]
  );

  const handleTitleChange = useCallback(
    (value: string) => {
      onUpdateScreen({ title: value });
    },
    [onUpdateScreen]
  );

  const handleTerminalToggle = useCallback(() => {
    onUpdateScreen({ terminal: !screen.terminal });
  }, [screen.terminal, onUpdateScreen]);

  const handleDataApiToggle = useCallback(() => {
    // If data doesn't exist, create empty object; if exists, remove it
    if (screen.data && Object.keys(screen.data).length > 0) {
      onUpdateScreen({ data: undefined });
    } else {
      onUpdateScreen({ data: {} });
    }
  }, [screen.data, onUpdateScreen]);

  const hasDataApi = Boolean(screen.data && Object.keys(screen.data).length >= 0);

  return (
    <div className="flex flex-col h-full bg-[#112217] border-l border-white/10">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-lg text-blue-400">
            edit_square
          </span>
          <h2 className="text-sm font-bold text-white">
            Screen Properties
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Screen Properties Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Basic Properties
            </h3>

            {/* Screen ID */}
            <div className="space-y-1.5">
              <label
                htmlFor="screen-id"
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-400"
              >
                <span className="material-symbols-outlined text-sm">badge</span>
                Screen ID
              </label>
              <div className="relative">
                <input
                  id="screen-id"
                  type="text"
                  value={screen.id}
                  onChange={(e) => handleScreenIdChange(e.target.value)}
                  disabled={!isEditingId}
                  className={`
                    w-full px-3 py-2 text-sm font-mono rounded-lg border transition-colors
                    bg-[#193322]
                    ${
                      isEditingId
                        ? 'border-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                        : 'border-white/10 bg-[#0d1912]'
                    }
                    text-white
                    disabled:cursor-not-allowed disabled:text-zinc-500
                  `}
                  placeholder="screen_id"
                />
                <button
                  onClick={() => setIsEditingId(!isEditingId)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/5 transition-colors"
                  aria-label={isEditingId ? 'Lock ID' : 'Edit ID'}
                  title={isEditingId ? 'Lock ID' : 'Edit ID'}
                >
                  <span className="material-symbols-outlined text-sm text-zinc-400">
                    {isEditingId ? 'lock_open' : 'lock'}
                  </span>
                </button>
              </div>
              <p className="text-xs text-zinc-500">
                Unique identifier for this screen (alphanumeric, underscores, hyphens)
              </p>
            </div>

            {/* Screen Title */}
            <div className="space-y-1.5">
              <label
                htmlFor="screen-title"
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-400"
              >
                <span className="material-symbols-outlined text-sm">title</span>
                Screen Title
              </label>
              <input
                id="screen-title"
                type="text"
                value={screen.title || ''}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="
                  w-full px-3 py-2 text-sm rounded-lg border transition-colors
                  border-white/10
                  bg-[#193322]
                  text-white
                  placeholder-zinc-500
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30
                "
                placeholder="Enter screen title"
              />
              <p className="text-xs text-zinc-500">
                Display name for this screen (shown in WhatsApp header)
              </p>
            </div>

            {/* Terminal Toggle */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-[#193322]/50 border border-white/10">
              <input
                id="terminal-toggle"
                type="checkbox"
                checked={screen.terminal || false}
                onChange={handleTerminalToggle}
                className="
                  mt-0.5 w-4 h-4 rounded border-zinc-600
                  text-green-500
                  focus:ring-2 focus:ring-green-500/20
                  bg-[#112217]
                  cursor-pointer
                "
              />
              <div className="flex-1">
                <label
                  htmlFor="terminal-toggle"
                  className="flex items-center gap-1.5 text-sm font-medium text-white cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-green-400">
                    flag
                  </span>
                  Terminal Screen
                </label>
                <p className="text-xs text-zinc-400 mt-1">
                  Mark this as the final screen in the flow (no navigation allowed)
                </p>
              </div>
            </div>

            {/* Data API Toggle */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-[#193322]/50 border border-white/10">
              <input
                id="data-api-toggle"
                type="checkbox"
                checked={hasDataApi}
                onChange={handleDataApiToggle}
                className="
                  mt-0.5 w-4 h-4 rounded border-zinc-600
                  text-orange-500
                  focus:ring-2 focus:ring-orange-500/20
                  bg-[#112217]
                  cursor-pointer
                "
              />
              <div className="flex-1">
                <label
                  htmlFor="data-api-toggle"
                  className="flex items-center gap-1.5 text-sm font-medium text-white cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-orange-400">
                    database
                  </span>
                  Use Data API
                </label>
                <p className="text-xs text-zinc-400 mt-1">
                  Enable data exchange with your endpoint for dynamic content
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10" />

          {/* Components Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Components
              </h3>
              <span className="text-xs text-zinc-500">
                {screen.components.length} item{screen.components.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Component List */}
            <ComponentList
              components={screen.components}
              onReorder={onReorderComponents}
              onEditComponent={onEditComponent}
              onDeleteComponent={onDeleteComponent}
              onDuplicateComponent={onDuplicateComponent}
            />

            {/* Add Component Button */}
            <button
              onClick={onAddComponent}
              className="
                w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                border-2 border-dashed border-zinc-600
                text-sm font-medium text-zinc-300
                hover:border-blue-500
                hover:text-blue-400
                hover:bg-blue-900/10
                transition-colors
              "
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Add Component
            </button>
          </div>

          {/* Screen Metadata */}
          {(screen.createdAt || screen.updatedAt) && (
            <>
              <div className="border-t border-white/10" />
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Metadata
                </h3>
                <div className="space-y-1.5 text-xs text-zinc-500">
                  {screen.createdAt && (
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      <span>Created: {new Date(screen.createdAt).toLocaleString()}</span>
                    </div>
                  )}
                  {screen.updatedAt && (
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs">update</span>
                      <span>Updated: {new Date(screen.updatedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Validation Errors (if any) */}
      {screen.validation && !screen.validation.isValid && (
        <div className="flex-shrink-0 border-t border-red-500/30 bg-red-900/20">
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-red-400">
                error
              </span>
              <h3 className="text-xs font-semibold text-red-300 uppercase tracking-wider">
                Validation Errors
              </h3>
            </div>
            <ul className="space-y-1">
              {screen.validation.errors.map((error, index) => (
                <li key={index} className="text-xs text-red-300 pl-5 list-disc">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
