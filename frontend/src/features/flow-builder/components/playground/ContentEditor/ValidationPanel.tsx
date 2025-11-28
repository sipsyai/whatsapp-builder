import { useState } from 'react';

/**
 * Validation error interface
 */
export interface ValidationError {
  id: string;
  type: 'error';
  message: string;
  path?: string; // JSON path (e.g., 'screens[0].layout.children[2]')
  line?: number; // Line number in JSON
}

/**
 * Validation warning interface
 */
export interface ValidationWarning {
  id: string;
  type: 'warning';
  message: string;
  path?: string;
  line?: number;
}

/**
 * Props interface for ValidationPanel
 */
export interface ValidationPanelProps {
  /**
   * List of validation errors
   */
  errors: ValidationError[];

  /**
   * List of validation warnings
   */
  warnings: ValidationWarning[];

  /**
   * Callback when an error or warning is clicked
   */
  onErrorClick?: (error: ValidationError) => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ValidationPanel - Displays JSON and screen validation errors and warnings
 *
 * Features:
 * - Collapsible panel with expand/collapse toggle
 * - Error and warning counts in header
 * - Clickable errors and warnings for navigation
 * - Shows path information if available
 * - Success state when no errors/warnings
 *
 * Layout (collapsed):
 * ```
 * +------------------------------------------+
 * | Validation  [2 errors] [1 warning]  [▼] |
 * +------------------------------------------+
 * ```
 *
 * Layout (expanded):
 * ```
 * +------------------------------------------+
 * | Validation  [2 errors] [1 warning]  [▲] |
 * +------------------------------------------+
 * | ✕ Error message 1                        |
 * |   at screens[0].layout.children[0]       |
 * | ✕ Error message 2                        |
 * |   at screens[0].layout.children[2]       |
 * | ⚠ Warning message 1                      |
 * +------------------------------------------+
 * ```
 *
 * @example
 * ```tsx
 * <ValidationPanel
 *   errors={[
 *     {
 *       id: '1',
 *       type: 'error',
 *       message: 'Required field is missing',
 *       path: 'screens[0].layout.children[0]'
 *     }
 *   ]}
 *   warnings={[
 *     {
 *       id: '2',
 *       type: 'warning',
 *       message: 'Field length exceeds recommendation',
 *       path: 'screens[0].title'
 *     }
 *   ]}
 *   onErrorClick={(error) => console.log('Navigate to:', error.path)}
 * />
 * ```
 */
export function ValidationPanel({
  errors,
  warnings,
  onErrorClick,
  className = '',
}: ValidationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const errorCount = errors.length;
  const warningCount = warnings.length;
  const hasIssues = errorCount > 0 || warningCount > 0;

  /**
   * Handle toggle expand/collapse
   */
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  /**
   * Handle error/warning click
   */
  const handleItemClick = (item: ValidationError | ValidationWarning) => {
    if (onErrorClick && item.type === 'error') {
      onErrorClick(item as ValidationError);
    }
  };

  return (
    <div
      className={`
        rounded-lg border transition-all duration-200
        ${isExpanded ? 'bg-zinc-900' : 'bg-zinc-800'}
        ${hasIssues ? 'border-white/10' : 'border-green-500/30'}
        ${className}
      `}
    >
      {/* Header - Always Visible */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors rounded-t-lg"
        aria-expanded={isExpanded}
      >
        {/* Title */}
        <span className="text-sm font-semibold text-white">Validation</span>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-1">
          {errorCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
              {errorCount} {errorCount === 1 ? 'error' : 'errors'}
            </span>
          )}
          {warningCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              {warningCount} {warningCount === 1 ? 'warning' : 'warnings'}
            </span>
          )}
        </div>

        {/* Expand/Collapse Toggle */}
        <span className="material-symbols-outlined text-base flex-shrink-0 text-zinc-400 transition-transform duration-200">
          {isExpanded ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Expanded Content */}
      <div
        className={`
          overflow-hidden transition-all duration-200
          ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="px-4 pb-3 border-t border-white/5">
          {/* Empty State - Success */}
          {!hasIssues && (
            <div className="flex items-center gap-2.5 py-4">
              <span className="material-symbols-outlined text-xl text-green-400 flex-shrink-0">
                check_circle
              </span>
              <div>
                <p className="text-sm font-medium text-green-400">
                  No validation errors
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Your Flow JSON is valid and ready to use
                </p>
              </div>
            </div>
          )}

          {/* Errors List */}
          {errorCount > 0 && (
            <div className="space-y-2 mt-3">
              {errors.map((error) => (
                <button
                  key={error.id}
                  onClick={() => handleItemClick(error)}
                  className="w-full flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-red-500/5 border border-red-500/20 text-left transition-colors group"
                >
                  {/* Error Icon */}
                  <span className="material-symbols-outlined text-base text-red-400 flex-shrink-0 mt-0.5">
                    error
                  </span>

                  {/* Error Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-red-400 font-medium break-words">
                      {error.message}
                    </p>
                    {error.path && (
                      <p className="text-xs text-zinc-500 mt-1 font-mono break-all">
                        at {error.path}
                      </p>
                    )}
                    {error.line !== undefined && (
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Line {error.line}
                      </p>
                    )}
                  </div>

                  {/* Click indicator */}
                  {onErrorClick && (
                    <span className="material-symbols-outlined text-base text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 mt-0.5 transition-colors">
                      arrow_forward
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Warnings List */}
          {warningCount > 0 && (
            <div className={`space-y-2 ${errorCount > 0 ? 'mt-3' : 'mt-3'}`}>
              {warnings.map((warning) => (
                <button
                  key={warning.id}
                  onClick={() => handleItemClick(warning)}
                  className="w-full flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-yellow-500/5 border border-yellow-500/20 text-left transition-colors group"
                >
                  {/* Warning Icon */}
                  <span className="material-symbols-outlined text-base text-yellow-400 flex-shrink-0 mt-0.5">
                    warning
                  </span>

                  {/* Warning Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-yellow-400 font-medium break-words">
                      {warning.message}
                    </p>
                    {warning.path && (
                      <p className="text-xs text-zinc-500 mt-1 font-mono break-all">
                        at {warning.path}
                      </p>
                    )}
                    {warning.line !== undefined && (
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Line {warning.line}
                      </p>
                    )}
                  </div>

                  {/* Click indicator */}
                  {onErrorClick && (
                    <span className="material-symbols-outlined text-base text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 mt-0.5 transition-colors">
                      arrow_forward
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
