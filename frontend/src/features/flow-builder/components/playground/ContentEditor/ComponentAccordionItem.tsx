import { useState, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { BuilderComponent } from '../../../types/builder.types';
import { CONTENT_CATEGORIES } from '../constants/contentCategories';

/**
 * Props interface for ComponentAccordionItem
 */
export interface ComponentAccordionItemProps {
  /**
   * The component to display
   */
  component: BuilderComponent;

  /**
   * Whether this item is expanded
   */
  isExpanded: boolean;

  /**
   * Preview text to show when collapsed
   */
  previewText: string;

  /**
   * Callback when toggle expand/collapse
   */
  onToggle: () => void;

  /**
   * Callback when component properties are updated
   */
  onUpdate: (updates: Partial<BuilderComponent>) => void;

  /**
   * Callback when component should be deleted
   */
  onDelete: () => void;

  /**
   * Callback when component should be duplicated
   */
  onDuplicate: () => void;
}

/**
 * Get icon and label for a component type from content categories
 */
function getContentItemByType(type: string): { icon: string; label: string } | null {
  for (const category of CONTENT_CATEGORIES) {
    const item = category.items.find((item) => item.type === type);
    if (item) {
      return {
        icon: item.icon,
        label: item.label,
      };
    }
  }
  return null;
}

/**
 * Truncate text to a maximum length
 */
function truncate(text: string, maxLength: number = 40): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * ComponentAccordionItem - Individual expandable/collapsible component item
 *
 * Layout (collapsed):
 * ```
 * [≡] [Icon] Component Type · Preview text... [▼] [⋮]
 * ```
 *
 * Layout (expanded):
 * ```
 * [≡] [Icon] Component Type · Preview text... [▲] [⋮]
 * +----------------------------------------+
 * |  Inline editor form (placeholder)      |
 * +----------------------------------------+
 * ```
 *
 * Features:
 * - Drag handle (left icon ≡)
 * - Component type icon and label
 * - Preview text (truncated)
 * - Expand/collapse toggle
 * - More menu (delete, duplicate)
 * - Smooth transition animation
 */
export function ComponentAccordionItem({
  component,
  isExpanded,
  previewText,
  onToggle,
  onDelete,
  onDuplicate,
}: ComponentAccordionItemProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Setup sortable (drag-and-drop)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Get component metadata
  const contentItem = getContentItemByType(component.type);
  const icon = contentItem?.icon || 'widgets';
  const label = contentItem?.label || component.type;
  const truncatedPreview = truncate(previewText);

  // Handle more menu toggle
  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMoreMenu(!showMoreMenu);
  };

  // Handle delete with confirmation
  const handleDelete = () => {
    setShowMoreMenu(false);
    onDelete();
  };

  // Handle duplicate
  const handleDuplicate = () => {
    setShowMoreMenu(false);
    onDuplicate();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative rounded-lg border transition-all duration-200
        ${isDragging ? 'opacity-50 shadow-lg scale-105' : ''}
        ${
          isExpanded
            ? 'bg-zinc-800/50 border-l-2 border-primary border-r border-r-white/10 border-t border-t-white/10 border-b border-b-white/10'
            : 'bg-zinc-800 border-white/10 hover:bg-zinc-700'
        }
      `}
    >
      {/* Header - Always Visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
        aria-expanded={isExpanded}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing flex-shrink-0 p-1 rounded hover:bg-white/5 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="material-symbols-outlined text-base text-zinc-500">
            drag_indicator
          </span>
        </div>

        {/* Component Icon */}
        <span className="material-symbols-outlined text-base flex-shrink-0 text-blue-400">
          {icon}
        </span>

        {/* Component Type and Preview */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-sm text-zinc-300">
            <span className="font-medium">{label}</span>
            {truncatedPreview && (
              <>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-400 truncate">{truncatedPreview}</span>
              </>
            )}
          </div>
        </div>

        {/* Expand/Collapse Toggle */}
        <span className="material-symbols-outlined text-base flex-shrink-0 text-zinc-400 transition-transform duration-200">
          {isExpanded ? 'expand_less' : 'expand_more'}
        </span>

        {/* More Menu Button */}
        <div className="relative" ref={moreMenuRef}>
          <button
            onClick={handleMoreClick}
            className="p-1 rounded hover:bg-white/5 transition-colors flex-shrink-0"
            aria-label="More options"
          >
            <span className="material-symbols-outlined text-base text-zinc-400">
              more_vert
            </span>
          </button>

          {/* More Menu Dropdown */}
          {showMoreMenu && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMoreMenu(false)}
              />

              {/* Menu */}
              <div className="absolute right-0 top-full mt-1 z-20 w-40 py-1 bg-zinc-800 border border-white/10 rounded-lg shadow-lg">
                <button
                  onClick={handleDuplicate}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">
                    content_copy
                  </span>
                  Duplicate
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </button>

      {/* Expanded Content - Editor Form */}
      <div
        className={`
          overflow-hidden transition-all duration-200
          ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="px-3 pb-3 pt-1 border-t border-white/5">
          {/* Placeholder for inline editor form */}
          <div className="bg-zinc-900/50 rounded-lg p-4 border border-white/5">
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-3xl text-zinc-600 mb-2 block">
                edit_note
              </span>
              <p className="text-sm text-zinc-400 mb-1">Component Editor</p>
              <p className="text-xs text-zinc-500">
                Inline form for {component.type} will appear here
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
