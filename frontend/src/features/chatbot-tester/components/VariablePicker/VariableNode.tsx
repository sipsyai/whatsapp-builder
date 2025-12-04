/**
 * VariableNode Component
 *
 * Renders a single variable item with type badge, value preview,
 * expand/collapse functionality (for objects/arrays), and copy button.
 * Supports recursive rendering for nested structures.
 */

import { useState, useCallback, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

/**
 * Type for variable values
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VariableValue = any;

/**
 * Props interface for VariableNode
 */
export interface VariableNodeProps {
  /** Variable key/name */
  name: string;
  /** Variable value */
  value: VariableValue;
  /** Full JSON path to this variable (e.g., "user.profile.name") */
  path: string;
  /** Nesting depth for indentation */
  depth?: number;
  /** Callback when variable is selected/clicked */
  onSelect?: (path: string) => void;
  /** Whether drag is enabled */
  draggable?: boolean;
  /** Default expanded state */
  defaultExpanded?: boolean;
}

/**
 * Get the type of a value for display
 */
function getValueType(value: VariableValue): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Get type badge color classes
 */
function getTypeBadgeClasses(type: string): string {
  const typeColors: Record<string, string> = {
    string: 'bg-green-500/20 text-green-400 border-green-500/30',
    number: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    boolean: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    object: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    array: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    null: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    undefined: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  return typeColors[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}

/**
 * Get icon for type
 */
function getTypeIcon(type: string): string {
  const typeIcons: Record<string, string> = {
    string: 'format_quote',
    number: 'tag',
    boolean: 'toggle_on',
    object: 'data_object',
    array: 'data_array',
    null: 'block',
    undefined: 'help_outline',
  };
  return typeIcons[type] || 'help_outline';
}

/**
 * Format value preview for display
 */
function formatValuePreview(value: VariableValue, type: string): string {
  if (type === 'null') return 'null';
  if (type === 'undefined') return 'undefined';
  if (type === 'string') {
    const str = value as string;
    if (str.length > 50) {
      return `"${str.substring(0, 50)}..."`;
    }
    return `"${str}"`;
  }
  if (type === 'boolean') return String(value);
  if (type === 'number') return String(value);
  if (type === 'array') {
    const arr = value as unknown[];
    return `[${arr.length} items]`;
  }
  if (type === 'object') {
    const obj = value as object;
    const keys = Object.keys(obj);
    return `{${keys.length} keys}`;
  }
  return String(value);
}

/**
 * VariableNode - Renders a single variable with recursive support
 */
export function VariableNode({
  name,
  value,
  path,
  depth = 0,
  onSelect,
  draggable = true,
  defaultExpanded = false,
}: VariableNodeProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isCopied, setIsCopied] = useState(false);

  const valueType = useMemo(() => getValueType(value), [value]);
  const isExpandable = valueType === 'object' || valueType === 'array';
  const hasChildren = isExpandable && value !== null && Object.keys(value as object).length > 0;

  // Drag setup
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: path,
    data: {
      type: 'variable',
      path,
      value,
      valueType,
    },
    disabled: !draggable,
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  // Toggle expand/collapse
  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasChildren) {
        setIsExpanded((prev) => !prev);
      }
    },
    [hasChildren]
  );

  // Handle selection
  const handleSelect = useCallback(() => {
    onSelect?.(path);
  }, [onSelect, path]);

  // Copy path to clipboard
  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const variableRef = `{{${path}}}`;
        await navigator.clipboard.writeText(variableRef);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    },
    [path]
  );

  // Get children for expandable types
  const children = useMemo(() => {
    if (!isExpandable || value === null || value === undefined) return [];

    if (valueType === 'array') {
      return (value as unknown[]).map((item, index) => ({
        key: String(index),
        value: item,
        path: `${path}[${index}]`,
      }));
    }

    return Object.entries(value as object).map(([key, val]) => ({
      key,
      value: val,
      path: `${path}.${key}`,
    }));
  }, [isExpandable, value, valueType, path]);

  const indentPadding = depth * 16;

  return (
    <div className="select-none">
      {/* Main Node Row */}
      <div
        ref={setNodeRef}
        style={{ ...style, paddingLeft: indentPadding }}
        className={`
          group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer
          transition-all duration-150
          ${isDragging ? 'opacity-50 bg-cyan-500/20' : 'hover:bg-white/5'}
        `}
        onClick={handleSelect}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleSelect();
          }
        }}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={handleToggle}
          className={`
            flex-shrink-0 w-5 h-5 flex items-center justify-center rounded
            transition-colors
            ${hasChildren ? 'hover:bg-white/10 text-zinc-400' : 'text-transparent'}
          `}
          disabled={!hasChildren}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {hasChildren && (
            <span
              className={`material-symbols-outlined text-sm transition-transform duration-200 ${
                isExpanded ? 'rotate-90' : ''
              }`}
            >
              chevron_right
            </span>
          )}
        </button>

        {/* Drag Handle */}
        {draggable && (
          <button
            {...attributes}
            {...listeners}
            className="flex-shrink-0 p-0.5 rounded cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Drag variable"
          >
            <span className="material-symbols-outlined text-sm text-zinc-500">
              drag_indicator
            </span>
          </button>
        )}

        {/* Type Icon */}
        <span
          className={`
            material-symbols-outlined text-sm flex-shrink-0
            ${getTypeBadgeClasses(valueType).split(' ')[1]}
          `}
        >
          {getTypeIcon(valueType)}
        </span>

        {/* Variable Name */}
        <span className="font-mono text-sm text-white font-medium truncate">
          {name}
        </span>

        {/* Type Badge */}
        <span
          className={`
            px-1.5 py-0.5 text-[10px] font-medium uppercase rounded border
            ${getTypeBadgeClasses(valueType)}
          `}
        >
          {valueType}
        </span>

        {/* Value Preview (for non-expandable types or collapsed expandable) */}
        {(!isExpandable || !isExpanded) && (
          <span className="font-mono text-xs text-zinc-400 truncate flex-1 text-right">
            {formatValuePreview(value, valueType)}
          </span>
        )}

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className={`
            flex-shrink-0 p-1 rounded transition-all duration-200
            ${
              isCopied
                ? 'bg-green-500/20 text-green-400'
                : 'hover:bg-white/10 text-zinc-500 opacity-0 group-hover:opacity-100'
            }
          `}
          aria-label={isCopied ? 'Copied!' : 'Copy variable reference'}
          title={isCopied ? 'Copied!' : `Copy {{${path}}}`}
        >
          <span className="material-symbols-outlined text-sm">
            {isCopied ? 'check' : 'content_copy'}
          </span>
        </button>
      </div>

      {/* Children (Recursive) */}
      {hasChildren && isExpanded && (
        <div className="border-l border-white/10 ml-4">
          {children.map((child) => (
            <VariableNode
              key={child.path}
              name={child.key}
              value={child.value}
              path={child.path}
              depth={depth + 1}
              onSelect={onSelect}
              draggable={draggable}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default VariableNode;
