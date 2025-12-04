import React, { useCallback, useState } from 'react';
import { JsonNode } from './JsonNode';

// ============================================================================
// Types
// ============================================================================

export interface JsonTreeViewerProps {
  /** JSON data to display */
  data: unknown;
  /** Root name for the data */
  name?: string;
  /** Whether nodes should be expanded by default */
  defaultExpanded?: boolean;
  /** Maximum depth to auto-expand */
  maxDepth?: number;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// JsonTreeViewer Component
// ============================================================================

/**
 * Custom lightweight JSON viewer component with expand/collapse,
 * syntax highlighting, and copy to clipboard functionality.
 */
export const JsonTreeViewer: React.FC<JsonTreeViewerProps> = ({
  data,
  name = 'root',
  defaultExpanded = true,
  maxDepth = 3,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCopyAll = useCallback(async () => {
    try {
      const text = JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy JSON:', err);
    }
  }, [data]);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  // Handle empty/null data
  if (data === undefined) {
    return (
      <div className={`bg-gray-900 rounded-lg p-3 font-mono text-sm ${className}`}>
        <span className="text-gray-500 italic">undefined</span>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className={`bg-gray-900 rounded-lg p-3 font-mono text-sm ${className}`}>
        <span className="text-gray-500">null</span>
      </div>
    );
  }

  // Handle primitive types
  const isPrimitive = typeof data !== 'object';

  return (
    <div className={`bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800/50 border-b border-gray-700">
        <button
          onClick={toggleCollapse}
          className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-colors"
        >
          {!isPrimitive && (
            <span className={`material-symbols-outlined text-base transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>
              chevron_right
            </span>
          )}
          <span className="font-medium">{name}</span>
          {!isPrimitive && (
            <span className="text-gray-500 text-xs ml-2">
              {Array.isArray(data) ? `${data.length} items` : `${Object.keys(data).length} keys`}
            </span>
          )}
        </button>

        <button
          onClick={handleCopyAll}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700"
          title="Copy all"
        >
          {copied ? (
            <>
              <span className="material-symbols-outlined text-sm text-green-400">check</span>
              <span className="text-green-400">Copied</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">content_copy</span>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-3 overflow-x-auto">
          {isPrimitive ? (
            <PrimitiveValue value={data} />
          ) : (
            <div className="font-mono text-sm">
              {Array.isArray(data) ? (
                // Array root
                <>
                  <span className="text-gray-400">[</span>
                  {data.map((item, index) => (
                    <JsonNode
                      key={index}
                      name={String(index)}
                      value={item}
                      depth={1}
                      maxDepth={maxDepth}
                      defaultExpanded={defaultExpanded}
                      isLast={index === data.length - 1}
                    />
                  ))}
                  <span className="text-gray-400">]</span>
                </>
              ) : (
                // Object root
                <>
                  <span className="text-gray-400">{'{'}</span>
                  {Object.entries(data as Record<string, unknown>).map(([key, value], index, arr) => (
                    <JsonNode
                      key={key}
                      name={key}
                      value={value}
                      depth={1}
                      maxDepth={maxDepth}
                      defaultExpanded={defaultExpanded}
                      isLast={index === arr.length - 1}
                    />
                  ))}
                  <span className="text-gray-400">{'}'}</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Primitive Value Renderer
// ============================================================================

interface PrimitiveValueProps {
  value: unknown;
}

const PrimitiveValue: React.FC<PrimitiveValueProps> = ({ value }) => {
  if (typeof value === 'string') {
    return <span className="text-green-400 font-mono">"{value}"</span>;
  }
  if (typeof value === 'number') {
    return <span className="text-amber-400 font-mono">{value}</span>;
  }
  if (typeof value === 'boolean') {
    return <span className="text-purple-400 font-mono">{String(value)}</span>;
  }
  return <span className="text-gray-500 font-mono">{String(value)}</span>;
};

export default JsonTreeViewer;
