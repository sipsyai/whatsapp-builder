import type { ValidationError } from '../../types';

interface ValidationPanelProps {
  errors: ValidationError[];
  onClose: () => void;
  onNavigateToError?: (screenId: string) => void;
}

/**
 * ValidationPanel - Displays validation errors and warnings
 *
 * Shows a list of validation issues with their severity levels,
 * allowing users to navigate to the problematic screens/components.
 */
export function ValidationPanel({
  errors,
  onClose,
  onNavigateToError,
}: ValidationPanelProps) {
  const errorCount = errors.filter(e => e.type === 'error').length;
  const warningCount = errors.filter(e => e.type === 'warning').length;

  if (errors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center p-6">
        <span className="material-symbols-outlined text-5xl text-green-400 mb-3">
          check_circle
        </span>
        <h3 className="text-sm font-semibold text-white mb-1">
          No Issues Found
        </h3>
        <p className="text-xs text-zinc-400">
          Your flow is valid and ready to be used!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#193322] rounded-lg border border-white/10 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0d1912] border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-lg text-yellow-400">
            warning
          </span>
          <h3 className="text-sm font-bold text-white">
            Validation Results
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
          aria-label="Close validation panel"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 px-4 py-3 bg-[#112217] border-b border-white/10">
        {errorCount > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-red-400">
              error
            </span>
            <span className="text-xs font-medium text-red-300">
              {errorCount} {errorCount === 1 ? 'Error' : 'Errors'}
            </span>
          </div>
        )}
        {warningCount > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-yellow-400">
              warning
            </span>
            <span className="text-xs font-medium text-yellow-300">
              {warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}
            </span>
          </div>
        )}
      </div>

      {/* Error List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-2">
          {errors.map((error, index) => (
            <div
              key={`${error.id}-${index}`}
              className={`
                p-3 rounded-lg border cursor-pointer transition-colors
                ${
                  error.type === 'error'
                    ? 'bg-red-900/20 border-red-800 hover:bg-red-900/30'
                    : 'bg-yellow-900/20 border-yellow-800 hover:bg-yellow-900/30'
                }
              `}
              onClick={() => error.screenId && onNavigateToError?.(error.screenId)}
            >
              <div className="flex items-start gap-2">
                <span
                  className={`material-symbols-outlined text-sm mt-0.5 ${
                    error.type === 'error'
                      ? 'text-red-400'
                      : 'text-yellow-400'
                  }`}
                >
                  {error.type === 'error' ? 'error' : 'warning'}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      error.type === 'error'
                        ? 'text-red-200'
                        : 'text-yellow-200'
                    }`}
                  >
                    {error.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-zinc-400">
                      {!error.screenId ? 'Flow Level' : `Screen: ${error.screenId.slice(0, 8)}`}
                    </span>
                    {error.path && (
                      <>
                        <span className="text-xs text-zinc-400">•</span>
                        <span className="text-xs text-zinc-400 font-mono">
                          {error.path}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {onNavigateToError && error.screenId && (
                  <span className="material-symbols-outlined text-sm text-zinc-400">
                    arrow_forward
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0d1912] border-t border-white/10">
        <span className="text-xs text-zinc-400">
          {errors.length} {errors.length === 1 ? 'issue' : 'issues'} found
        </span>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-300 hover:bg-white/5 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
