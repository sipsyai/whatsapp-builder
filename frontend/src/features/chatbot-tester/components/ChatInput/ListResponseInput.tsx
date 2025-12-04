/**
 * ListResponseInput Component
 *
 * Renders interactive list items for WhatsApp list responses.
 * Used when waitingInputType is 'list'.
 */

import React, { useState, useCallback } from 'react';
import type { InteractiveListSection } from '../../types/tester.types';

// ============================================================================
// Types
// ============================================================================

interface ListResponseInputProps {
  /**
   * List sections to display
   */
  sections: InteractiveListSection[];
  /**
   * Button text to open the list
   */
  listButtonText?: string;
  /**
   * Callback when an item is selected
   */
  onSelect: (itemId: string, itemTitle: string) => void;
  /**
   * Whether the list is disabled
   */
  disabled?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const ListResponseInput: React.FC<ListResponseInputProps> = ({
  sections,
  listButtonText = 'View Options',
  onSelect,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /**
   * Toggle list visibility
   */
  const toggleList = useCallback(() => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  }, [disabled]);

  /**
   * Handle item selection
   */
  const handleSelect = useCallback(
    (itemId: string, itemTitle: string) => {
      if (disabled) return;

      setSelectedId(itemId);
      setIsOpen(false);

      // Small delay for visual feedback
      setTimeout(() => {
        onSelect(itemId, itemTitle);
      }, 150);
    },
    [onSelect, disabled]
  );

  if (!sections || sections.length === 0) {
    return null;
  }

  // Count total items
  const totalItems = sections.reduce(
    (acc, section) => acc + section.rows.length,
    0
  );

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Toggle Button */}
      <button
        onClick={toggleList}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between
          px-4 py-3
          bg-white dark:bg-gray-800
          border-2 border-green-500 rounded-lg
          text-sm font-medium
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
          ${disabled
            ? 'text-gray-400 border-gray-300 cursor-not-allowed'
            : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-gray-700 cursor-pointer'
          }
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          {listButtonText}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {totalItems} {totalItems === 1 ? 'option' : 'options'}
          </span>
          <span className={`material-symbols-outlined text-xl transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </span>
      </button>

      {/* Dropdown List */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* List Panel */}
          <div
            className="
              absolute bottom-full left-0 right-0 mb-2 z-20
              bg-white dark:bg-gray-800
              border border-gray-200 dark:border-gray-700
              rounded-lg shadow-lg
              max-h-[300px] overflow-y-auto
              animate-in slide-in-from-bottom-2 duration-200
            "
            role="listbox"
            aria-label="Select an option"
          >
            {sections.map((section, sectionIndex) => (
              <div key={section.title || sectionIndex}>
                {/* Section Header */}
                {section.title && (
                  <div
                    className="
                      px-4 py-2
                      bg-gray-50 dark:bg-gray-700
                      text-xs font-semibold text-gray-500 dark:text-gray-400
                      uppercase tracking-wider
                      sticky top-0
                    "
                  >
                    {section.title}
                  </div>
                )}

                {/* Section Items */}
                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                  {section.rows.map((row) => (
                    <li key={row.id}>
                      <button
                        onClick={() => handleSelect(row.id, row.title)}
                        className={`
                          w-full flex items-center justify-between
                          px-4 py-3
                          text-left
                          transition-colors duration-150
                          focus:outline-none focus:bg-green-50 dark:focus:bg-gray-700
                          ${selectedId === row.id
                            ? 'bg-green-50 dark:bg-green-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          }
                        `}
                        role="option"
                        aria-selected={selectedId === row.id}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {row.title}
                          </p>
                          {row.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {row.description}
                            </p>
                          )}
                        </div>

                        {/* Selection indicator */}
                        {selectedId === row.id && (
                          <span className="material-symbols-outlined text-xl text-green-500 ml-2 flex-shrink-0">check</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ListResponseInput;
