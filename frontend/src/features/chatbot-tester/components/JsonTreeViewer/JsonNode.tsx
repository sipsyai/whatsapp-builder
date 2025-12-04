import React, { useState, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonValue = any;

interface JsonNodeProps {
  name: string;
  value: JsonValue;
  depth: number;
  maxDepth: number;
  defaultExpanded: boolean;
  isLast?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getValueType(value: JsonValue): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function getValuePreview(value: JsonValue): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    return `{${keys.length}}`;
  }
  if (typeof value === 'string') return `"${value}"`;
  return String(value);
}

// ============================================================================
// Value Renderer
// ============================================================================

interface ValueRendererProps {
  value: JsonValue;
}

const ValueRenderer: React.FC<ValueRendererProps> = ({ value }) => {
  const type = getValueType(value);

  const colorClasses: Record<string, string> = {
    string: 'text-green-400',
    number: 'text-amber-400',
    boolean: 'text-purple-400',
    null: 'text-gray-500',
  };

  if (type === 'string') {
    return (
      <span className={colorClasses.string}>
        "{value as string}"
      </span>
    );
  }

  if (type === 'number') {
    return <span className={colorClasses.number}>{value as number}</span>;
  }

  if (type === 'boolean') {
    return <span className={colorClasses.boolean}>{String(value)}</span>;
  }

  if (type === 'null') {
    return <span className={colorClasses.null}>null</span>;
  }

  return null;
};

// ============================================================================
// Copy Button
// ============================================================================

interface CopyButtonProps {
  value: JsonValue;
}

const CopyButton: React.FC<CopyButtonProps> = ({ value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [value]);

  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 ml-2 p-0.5 rounded hover:bg-gray-700 transition-opacity"
      title="Copy to clipboard"
    >
      {copied ? (
        <span className="material-symbols-outlined text-xs text-green-400">check</span>
      ) : (
        <span className="material-symbols-outlined text-xs text-gray-400">content_copy</span>
      )}
    </button>
  );
};

// ============================================================================
// JsonNode Component
// ============================================================================

export const JsonNode: React.FC<JsonNodeProps> = ({
  name,
  value,
  depth,
  maxDepth,
  defaultExpanded,
  isLast = false,
}) => {
  const type = getValueType(value);
  const isExpandable = type === 'object' || type === 'array';
  const shouldDefaultExpand = defaultExpanded && depth < maxDepth;
  const [isExpanded, setIsExpanded] = useState(shouldDefaultExpand);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const indent = depth * 16;

  // Primitive values
  if (!isExpandable) {
    return (
      <div
        className="group flex items-center py-0.5 hover:bg-gray-800/50 rounded"
        style={{ paddingLeft: `${indent + 20}px` }}
      >
        <span className="text-cyan-300">{name}</span>
        <span className="text-gray-500 mx-1">:</span>
        <ValueRenderer value={value} />
        <CopyButton value={value} />
        {!isLast && <span className="text-gray-500">,</span>}
      </div>
    );
  }

  // Arrays and Objects
  const entries = type === 'array'
    ? (value as JsonValue[]).map((v, i) => [String(i), v] as [string, JsonValue])
    : Object.entries(value as Record<string, JsonValue>);

  const openBracket = type === 'array' ? '[' : '{';
  const closeBracket = type === 'array' ? ']' : '}';
  const isEmpty = entries.length === 0;

  return (
    <div className="font-mono text-sm">
      {/* Header row */}
      <div
        className="group flex items-center py-0.5 hover:bg-gray-800/50 rounded cursor-pointer select-none"
        style={{ paddingLeft: `${indent}px` }}
        onClick={toggleExpand}
      >
        {/* Expand/Collapse icon */}
        <span className="w-4 h-4 flex items-center justify-center text-gray-400">
          {!isEmpty && (
            <span className={`material-symbols-outlined text-sm transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
              chevron_right
            </span>
          )}
        </span>

        {/* Key name */}
        <span className="text-cyan-300 ml-1">{name}</span>
        <span className="text-gray-500 mx-1">:</span>

        {/* Opening bracket or preview */}
        {isExpanded ? (
          <span className="text-gray-400">{openBracket}</span>
        ) : (
          <>
            <span className="text-gray-500">
              {getValuePreview(value)}
            </span>
            <CopyButton value={value} />
          </>
        )}

        {/* Empty array/object closing bracket */}
        {isEmpty && (
          <>
            <span className="text-gray-400">{closeBracket}</span>
            {!isLast && <span className="text-gray-500">,</span>}
          </>
        )}
      </div>

      {/* Children */}
      {isExpanded && !isEmpty && (
        <>
          {entries.map(([key, val], index) => (
            <JsonNode
              key={`${depth}-${key}`}
              name={key}
              value={val}
              depth={depth + 1}
              maxDepth={maxDepth}
              defaultExpanded={defaultExpanded}
              isLast={index === entries.length - 1}
            />
          ))}

          {/* Closing bracket */}
          <div
            className="py-0.5 text-gray-400"
            style={{ paddingLeft: `${indent + 20}px` }}
          >
            {closeBracket}
            {!isLast && <span className="text-gray-500">,</span>}
          </div>
        </>
      )}
    </div>
  );
};

export default JsonNode;
