import React, { useState, useCallback } from 'react';
import type { LogEntry, LogEntryType } from '../../types/tester.types';
import { JsonTreeViewer } from '../JsonTreeViewer';

// ============================================================================
// Types
// ============================================================================

export interface LogEntryItemProps {
  /** Log entry to display */
  log: LogEntry;
  /** Whether to show timestamp */
  showTimestamp?: boolean;
}

// ============================================================================
// Style Configuration
// ============================================================================

interface LogTypeStyle {
  icon: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  iconColor: string;
}

const logTypeStyles: Record<LogEntryType, LogTypeStyle> = {
  system: {
    icon: 'info',
    bgColor: 'bg-gray-800/50',
    textColor: 'text-gray-300',
    borderColor: 'border-gray-600',
    iconColor: 'text-gray-400',
  },
  message: {
    icon: 'chat',
    bgColor: 'bg-blue-900/30',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-700',
    iconColor: 'text-blue-400',
  },
  node: {
    icon: 'inventory_2',
    bgColor: 'bg-cyan-900/30',
    textColor: 'text-cyan-300',
    borderColor: 'border-cyan-700',
    iconColor: 'text-cyan-400',
  },
  variable: {
    icon: 'data_object',
    bgColor: 'bg-purple-900/30',
    textColor: 'text-purple-300',
    borderColor: 'border-purple-700',
    iconColor: 'text-purple-400',
  },
  error: {
    icon: 'error',
    bgColor: 'bg-red-900/30',
    textColor: 'text-red-300',
    borderColor: 'border-red-700',
    iconColor: 'text-red-400',
  },
  warning: {
    icon: 'warning',
    bgColor: 'bg-amber-900/30',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-700',
    iconColor: 'text-amber-400',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatFullTimestamp(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

// ============================================================================
// LogEntryItem Component
// ============================================================================

/**
 * Single log entry renderer with icon, timestamp, and expandable details.
 */
export const LogEntryItem: React.FC<LogEntryItemProps> = ({
  log,
  showTimestamp = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = log.data && Object.keys(log.data).length > 0;

  const toggleExpand = useCallback(() => {
    if (hasDetails) {
      setIsExpanded((prev) => !prev);
    }
  }, [hasDetails]);

  const style = logTypeStyles[log.type];

  return (
    <div
      className={`
        ${style.bgColor}
        border-l-2 ${style.borderColor}
        rounded-r-md
        transition-colors
        ${hasDetails ? 'cursor-pointer hover:brightness-110' : ''}
      `}
    >
      {/* Main Row */}
      <div
        className="flex items-start gap-2 px-3 py-2"
        onClick={toggleExpand}
      >
        {/* Expand indicator */}
        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">
          {hasDetails && (
            <span className={`material-symbols-outlined text-sm text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
              chevron_right
            </span>
          )}
        </div>

        {/* Icon */}
        <div className={`flex-shrink-0 mt-0.5 ${style.iconColor}`}>
          <span className="material-symbols-outlined text-base">{style.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className={`text-sm ${style.textColor} break-words`}>
              {log.message}
            </span>

            {/* Timestamp */}
            {showTimestamp && (
              <span
                className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0"
                title={formatFullTimestamp(log.timestamp)}
              >
                <span className="material-symbols-outlined text-xs">schedule</span>
                {formatTimestamp(log.timestamp)}
              </span>
            )}
          </div>

          {/* Node info badge */}
          {log.nodeName && (
            <div className="mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-700/50 text-gray-400 rounded">
                <span className="material-symbols-outlined text-xs">inventory_2</span>
                {log.nodeName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Details */}
      {isExpanded && hasDetails && (
        <div className="px-3 pb-3 pt-1 ml-6">
          <JsonTreeViewer
            data={log.data}
            name="details"
            defaultExpanded={true}
            maxDepth={2}
            className="text-xs"
          />
        </div>
      )}
    </div>
  );
};

export default LogEntryItem;
