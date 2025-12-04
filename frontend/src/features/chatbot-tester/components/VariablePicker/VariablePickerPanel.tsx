/**
 * VariablePickerPanel Component
 *
 * n8n-style variable picker panel with tree view, search/filter,
 * expand/collapse functionality, and drag & drop support.
 */

import { useState, useCallback, useMemo } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { VariableNode } from './VariableNode';
import { useTesterState } from '../../context';

/**
 * Props interface for VariablePickerPanel
 */
export interface VariablePickerPanelProps {
  /** Variables to display (optional, defaults to context variables) */
  variables?: Record<string, unknown>;
  /** Callback when a variable is selected */
  onVariableSelect?: (path: string) => void;
  /** Callback when a variable is dropped */
  onVariableDrop?: (path: string, value: unknown) => void;
  /** Whether to show the search input */
  showSearch?: boolean;
  /** Whether drag is enabled */
  draggable?: boolean;
  /** Panel title */
  title?: string;
  /** Custom class name */
  className?: string;
  /** Collapse all by default */
  defaultCollapsed?: boolean;
}

/**
 * Filter variables recursively based on search term
 */
function filterVariables(
  variables: Record<string, unknown>,
  searchTerm: string,
  parentPath: string = ''
): Record<string, unknown> {
  if (!searchTerm.trim()) return variables;

  const lowerSearch = searchTerm.toLowerCase();
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(variables)) {
    const currentPath = parentPath ? `${parentPath}.${key}` : key;
    const keyMatches = key.toLowerCase().includes(lowerSearch);
    const pathMatches = currentPath.toLowerCase().includes(lowerSearch);

    // Check if value matches (for primitives)
    let valueMatches = false;
    if (typeof value === 'string') {
      valueMatches = value.toLowerCase().includes(lowerSearch);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      valueMatches = String(value).toLowerCase().includes(lowerSearch);
    }

    // If this key/path/value matches, include it
    if (keyMatches || pathMatches || valueMatches) {
      result[key] = value;
      continue;
    }

    // If it's an object/array, recursively filter
    if (value !== null && typeof value === 'object') {
      const filtered = Array.isArray(value)
        ? filterArrayVariables(value, searchTerm, currentPath)
        : filterVariables(value as Record<string, unknown>, searchTerm, currentPath);

      if (Object.keys(filtered).length > 0 || (Array.isArray(filtered) && filtered.length > 0)) {
        result[key] = filtered;
      }
    }
  }

  return result;
}

/**
 * Filter array elements recursively
 */
function filterArrayVariables(
  arr: unknown[],
  searchTerm: string,
  parentPath: string
): unknown[] {
  const lowerSearch = searchTerm.toLowerCase();
  const result: unknown[] = [];

  arr.forEach((item, index) => {
    const currentPath = `${parentPath}[${index}]`;
    const indexMatches = String(index).includes(lowerSearch);

    // Check if value matches
    let valueMatches = false;
    if (typeof item === 'string') {
      valueMatches = item.toLowerCase().includes(lowerSearch);
    } else if (typeof item === 'number' || typeof item === 'boolean') {
      valueMatches = String(item).toLowerCase().includes(lowerSearch);
    }

    if (indexMatches || valueMatches) {
      result.push(item);
      return;
    }

    // Recursively filter objects in array
    if (item !== null && typeof item === 'object') {
      const filtered = Array.isArray(item)
        ? filterArrayVariables(item, searchTerm, currentPath)
        : filterVariables(item as Record<string, unknown>, searchTerm, currentPath);

      if (Object.keys(filtered).length > 0 || (Array.isArray(filtered) && filtered.length > 0)) {
        result.push(filtered);
      }
    }
  });

  return result;
}

/**
 * Count total variables recursively
 */
function countVariables(variables: Record<string, unknown>): number {
  let count = 0;
  for (const value of Object.values(variables)) {
    count++;
    if (value !== null && typeof value === 'object') {
      if (Array.isArray(value)) {
        count += value.length;
        value.forEach((item) => {
          if (item !== null && typeof item === 'object') {
            count += countVariables(item as Record<string, unknown>);
          }
        });
      } else {
        count += countVariables(value as Record<string, unknown>);
      }
    }
  }
  return count;
}

/**
 * VariablePickerPanel - n8n-style variable tree picker
 */
export function VariablePickerPanel({
  variables: propsVariables,
  onVariableSelect,
  onVariableDrop,
  showSearch = true,
  draggable = true,
  title = 'Variables',
  className = '',
  defaultCollapsed = false,
}: VariablePickerPanelProps) {
  // Get variables from context if not provided via props
  const { variables: contextVariables } = useTesterState();
  const variables = propsVariables ?? contextVariables;

  const [searchTerm, setSearchTerm] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<{ path: string; value: unknown } | null>(
    null
  );

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Filter variables based on search
  const filteredVariables = useMemo(() => {
    return filterVariables(variables, searchTerm);
  }, [variables, searchTerm]);

  // Count stats
  const totalCount = useMemo(() => countVariables(variables), [variables]);
  const filteredCount = useMemo(() => countVariables(filteredVariables), [filteredVariables]);

  // Handle search input
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  // Toggle collapse
  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  // Drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveDragId(active.id as string);
    setActiveDragData(active.data.current as { path: string; value: unknown });
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDragId(null);
      setActiveDragData(null);

      if (over && onVariableDrop) {
        const data = active.data.current as { path: string; value: unknown };
        onVariableDrop(data.path, data.value);
      }
    },
    [onVariableDrop]
  );

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null);
    setActiveDragData(null);
  }, []);

  // Check if variables is empty
  const isEmpty = Object.keys(variables).length === 0;
  const isFilteredEmpty = Object.keys(filteredVariables).length === 0;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        className={`
          flex flex-col bg-zinc-900/50 border border-white/10 rounded-lg overflow-hidden
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50 border-b border-white/10">
          <button
            onClick={handleToggleCollapse}
            className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
          >
            <span
              className={`material-symbols-outlined text-sm transition-transform duration-200 ${
                isCollapsed ? '' : 'rotate-90'
              }`}
            >
              chevron_right
            </span>
            <span className="text-sm font-medium text-white">{title}</span>
            <span className="text-xs text-zinc-500">
              ({searchTerm ? `${filteredCount}/${totalCount}` : totalCount})
            </span>
          </button>

          {/* Header Actions */}
          <div className="flex items-center gap-1">
            {/* Expand All / Collapse All could go here */}
          </div>
        </div>

        {/* Content */}
        {!isCollapsed && (
          <>
            {/* Search Input */}
            {showSearch && !isEmpty && (
              <div className="px-3 py-2 border-b border-white/10">
                <div className="relative">
                  <span className="material-symbols-outlined text-sm text-zinc-500 absolute left-2 top-1/2 -translate-y-1/2">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Filter variables..."
                    className="
                      w-full pl-8 pr-8 py-1.5 rounded-md
                      bg-zinc-800 border border-white/10
                      text-sm text-white placeholder-zinc-500
                      focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25
                      transition-colors
                    "
                  />
                  {searchTerm && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                      aria-label="Clear search"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Variables Tree */}
            <div className="flex-1 overflow-auto p-2 min-h-0 max-h-96">
              {isEmpty ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <span className="material-symbols-outlined text-3xl text-zinc-600 mb-2">
                    data_object
                  </span>
                  <p className="text-sm text-zinc-400">No variables yet</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Variables will appear here during test execution
                  </p>
                </div>
              ) : isFilteredEmpty ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <span className="material-symbols-outlined text-3xl text-zinc-600 mb-2">
                    search_off
                  </span>
                  <p className="text-sm text-zinc-400">No matching variables</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Try a different search term
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {Object.entries(filteredVariables).map(([key, value]) => (
                    <VariableNode
                      key={key}
                      name={key}
                      value={value}
                      path={key}
                      depth={0}
                      onSelect={onVariableSelect}
                      draggable={draggable}
                      defaultExpanded={!!searchTerm}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer hint */}
            {!isEmpty && (
              <div className="px-3 py-1.5 border-t border-white/10 bg-zinc-800/30">
                <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">info</span>
                  Click to select, drag to insert, or click copy icon
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeDragId && activeDragData && (
          <div className="px-3 py-2 rounded-md bg-cyan-500/20 border border-cyan-500/50 shadow-lg backdrop-blur-sm">
            <span className="font-mono text-sm text-cyan-400">
              {`{{${activeDragData.path}}}`}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

export default VariablePickerPanel;
