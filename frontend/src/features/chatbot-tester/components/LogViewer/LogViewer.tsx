import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { LogEntry, LogEntryType } from '../../types/tester.types';
import { LogEntryItem } from './LogEntryItem';

// ============================================================================
// Types
// ============================================================================

export interface LogViewerProps {
  /** Array of log entries to display */
  logs: LogEntry[];
  /** Maximum height of the log viewer */
  maxHeight?: string;
  /** Callback to clear logs */
  onClear?: () => void;
  /** Whether to auto-scroll to bottom on new logs */
  autoScroll?: boolean;
  /** Title for the log viewer */
  title?: string;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Filter Options
// ============================================================================

const filterOptions: { value: LogEntryType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Logs' },
  { value: 'system', label: 'System' },
  { value: 'message', label: 'Messages' },
  { value: 'node', label: 'Nodes' },
  { value: 'variable', label: 'Variables' },
  { value: 'error', label: 'Errors' },
  { value: 'warning', label: 'Warnings' },
];

// ============================================================================
// LogViewer Component
// ============================================================================

/**
 * Execution log viewer with filtering, auto-scroll, and collapsible details.
 */
export const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  maxHeight = '400px',
  onClear,
  autoScroll = true,
  title = 'Execution Logs',
  className = '',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<LogEntryType | 'all'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(autoScroll);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Filter logs
  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter((log) => log.type === filter);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (isAutoScrollEnabled && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [filteredLogs.length, isAutoScrollEnabled]);

  // Handle scroll to detect if user has scrolled up
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      setShowScrollButton(!isNearBottom);
      setIsAutoScrollEnabled(isNearBottom);
    }
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      setIsAutoScrollEnabled(true);
    }
  }, []);

  // Toggle filter dropdown
  const toggleFilter = useCallback(() => {
    setIsFilterOpen((prev) => !prev);
  }, []);

  // Select filter
  const selectFilter = useCallback((value: LogEntryType | 'all') => {
    setFilter(value);
    setIsFilterOpen(false);
  }, []);

  // Get current filter label
  const currentFilterLabel = filterOptions.find((opt) => opt.value === filter)?.label || 'All Logs';

  // Count logs by type
  const logCounts = logs.reduce((acc, log) => {
    acc[log.type] = (acc[log.type] || 0) + 1;
    return acc;
  }, {} as Record<LogEntryType, number>);

  const errorCount = logCounts.error || 0;
  const warningCount = logCounts.warning || 0;

  return (
    <div className={`bg-gray-900 rounded-lg overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800/50 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-gray-400">description</span>
          <span className="text-sm font-medium text-gray-200">{title}</span>
          <span className="text-xs text-gray-500">({filteredLogs.length})</span>

          {/* Error/Warning badges */}
          {errorCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-red-900/50 text-red-400 rounded">
              {errorCount} error{errorCount !== 1 ? 's' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-amber-900/50 text-amber-400 rounded">
              {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filter dropdown */}
          <div className="relative">
            <button
              onClick={toggleFilter}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              <span className="material-symbols-outlined text-sm">filter_list</span>
              <span>{currentFilterLabel}</span>
              <span className={`material-symbols-outlined text-xs transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {isFilterOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsFilterOpen(false)}
                />

                {/* Dropdown menu */}
                <div className="absolute right-0 mt-1 w-36 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-20 py-1">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => selectFilter(option.value)}
                      className={`
                        w-full text-left px-3 py-1.5 text-xs transition-colors
                        ${filter === option.value
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                        }
                      `}
                    >
                      {option.label}
                      {option.value !== 'all' && logCounts[option.value as LogEntryType] && (
                        <span className="ml-1 text-gray-500">
                          ({logCounts[option.value as LogEntryType]})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Clear button */}
          {onClear && logs.length > 0 && (
            <button
              onClick={onClear}
              className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
              title="Clear logs"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Log entries */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2 space-y-1 relative"
        style={{ maxHeight }}
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <span className="material-symbols-outlined text-3xl mb-2 opacity-50">description</span>
            <span className="text-sm">
              {logs.length === 0 ? 'No logs yet' : 'No matching logs'}
            </span>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <LogEntryItem
              key={log.id}
              log={log}
              showTimestamp={true}
            />
          ))
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && filteredLogs.length > 0 && (
        <div className="absolute bottom-4 right-4">
          <button
            onClick={scrollToBottom}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full shadow-lg transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_downward</span>
            <span>Scroll to bottom</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default LogViewer;
