import React, { useState, useMemo } from 'react';
import { DraggableComponent } from './DraggableComponent';
import type { Component } from '../../types/flow-json.types';

/**
 * Component category definition
 */
interface ComponentCategory {
  id: string;
  name: string;
  icon: string;
  components: ComponentDefinition[];
}

/**
 * Individual component definition in the palette
 */
interface ComponentDefinition {
  type: Component['type'];
  name: string;
  icon: string;
  description: string;
  category: string;
}

/**
 * All WhatsApp Flow components organized by category
 */
const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  // Text Components
  {
    type: 'TextHeading',
    name: 'Text Heading',
    icon: 'title',
    description: 'Top level title of a page (80 chars max)',
    category: 'text',
  },
  {
    type: 'TextSubheading',
    name: 'Text Subheading',
    icon: 'format_size',
    description: 'Section subheading (80 chars max)',
    category: 'text',
  },
  {
    type: 'TextBody',
    name: 'Text Body',
    icon: 'subject',
    description: 'Body text with markdown support (4096 chars max)',
    category: 'text',
  },
  {
    type: 'TextCaption',
    name: 'Text Caption',
    icon: 'notes',
    description: 'Small caption text with markdown (409 chars max)',
    category: 'text',
  },
  {
    type: 'RichText',
    name: 'Rich Text',
    icon: 'article',
    description: 'Rich formatted text with full markdown support',
    category: 'text',
  },

  // Input Components
  {
    type: 'TextInput',
    name: 'Text Input',
    icon: 'input',
    description: 'Single line text input with validation',
    category: 'input',
  },
  {
    type: 'TextArea',
    name: 'Text Area',
    icon: 'text_fields',
    description: 'Multi-line text input (600 chars max)',
    category: 'input',
  },

  // Selection Components
  {
    type: 'Dropdown',
    name: 'Dropdown',
    icon: 'arrow_drop_down_circle',
    description: 'Single selection dropdown (1-200 options)',
    category: 'selection',
  },
  {
    type: 'RadioButtonsGroup',
    name: 'Radio Buttons',
    icon: 'radio_button_checked',
    description: 'Single selection from list (1-20 options)',
    category: 'selection',
  },
  {
    type: 'CheckboxGroup',
    name: 'Checkbox Group',
    icon: 'check_box',
    description: 'Multiple selection from list (1-20 options)',
    category: 'selection',
  },
  {
    type: 'ChipsSelector',
    name: 'Chips Selector',
    icon: 'labels',
    description: 'Multiple selection with chips (2-20 options)',
    category: 'selection',
  },

  // Date Components
  {
    type: 'DatePicker',
    name: 'Date Picker',
    icon: 'calendar_today',
    description: 'Single date selection with constraints',
    category: 'date',
  },
  {
    type: 'CalendarPicker',
    name: 'Calendar Picker',
    icon: 'calendar_month',
    description: 'Single or range date selection with full calendar',
    category: 'date',
  },

  // Media Components
  {
    type: 'Image',
    name: 'Image',
    icon: 'image',
    description: 'Display image with base64 encoding (max 3 per screen)',
    category: 'media',
  },
  {
    type: 'ImageCarousel',
    name: 'Image Carousel',
    icon: 'view_carousel',
    description: 'Slide through multiple images (1-3 images)',
    category: 'media',
  },

  // Navigation Components
  {
    type: 'Footer',
    name: 'Footer',
    icon: 'west',
    description: 'CTA button with action (max 1 per screen)',
    category: 'navigation',
  },
  {
    type: 'EmbeddedLink',
    name: 'Embedded Link',
    icon: 'link',
    description: 'Clickable link with action (max 2 per screen)',
    category: 'navigation',
  },
  {
    type: 'NavigationList',
    name: 'Navigation List',
    icon: 'list',
    description: 'List of navigation items (1-20 items)',
    category: 'navigation',
  },

  // Control Components
  {
    type: 'If',
    name: 'If Condition',
    icon: 'fork_right',
    description: 'Conditional rendering based on boolean expression',
    category: 'control',
  },
  {
    type: 'Switch',
    name: 'Switch',
    icon: 'switch_account',
    description: 'Multi-branch conditional rendering',
    category: 'control',
  },
  {
    type: 'OptIn',
    name: 'Opt-In',
    icon: 'check_circle',
    description: 'Consent checkbox with optional "Read more" (max 5 per screen)',
    category: 'control',
  },
];

/**
 * Group components by category
 */
const CATEGORIES: ComponentCategory[] = [
  {
    id: 'text',
    name: 'Text',
    icon: 'text_fields',
    components: COMPONENT_DEFINITIONS.filter((c) => c.category === 'text'),
  },
  {
    id: 'input',
    name: 'Input',
    icon: 'edit',
    components: COMPONENT_DEFINITIONS.filter((c) => c.category === 'input'),
  },
  {
    id: 'selection',
    name: 'Selection',
    icon: 'ballot',
    components: COMPONENT_DEFINITIONS.filter((c) => c.category === 'selection'),
  },
  {
    id: 'date',
    name: 'Date',
    icon: 'event',
    components: COMPONENT_DEFINITIONS.filter((c) => c.category === 'date'),
  },
  {
    id: 'media',
    name: 'Media',
    icon: 'photo_library',
    components: COMPONENT_DEFINITIONS.filter((c) => c.category === 'media'),
  },
  {
    id: 'navigation',
    name: 'Navigation',
    icon: 'navigation',
    components: COMPONENT_DEFINITIONS.filter((c) => c.category === 'navigation'),
  },
  {
    id: 'control',
    name: 'Control',
    icon: 'settings_suggest',
    components: COMPONENT_DEFINITIONS.filter((c) => c.category === 'control'),
  },
];

interface ComponentPaletteProps {
  onAddComponent?: (componentType: Component['type']) => void;
  className?: string;
}

/**
 * Component Palette Sidebar
 *
 * Displays all available WhatsApp Flow components organized by category.
 * Components can be dragged onto the canvas or clicked to add.
 */
export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  onAddComponent,
  className = '',
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['text', 'input', 'selection']) // Default expanded categories
  );
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Toggle category expansion
   */
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  /**
   * Filter components based on search query
   */
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return CATEGORIES;
    }

    const query = searchQuery.toLowerCase();
    return CATEGORIES.map((category) => ({
      ...category,
      components: category.components.filter(
        (component) =>
          component.name.toLowerCase().includes(query) ||
          component.description.toLowerCase().includes(query) ||
          component.type.toLowerCase().includes(query)
      ),
    })).filter((category) => category.components.length > 0);
  }, [searchQuery]);

  /**
   * Expand all categories when searching
   */
  const displayCategories = useMemo(() => {
    if (searchQuery.trim()) {
      return filteredCategories.map((c) => c.id);
    }
    return Array.from(expandedCategories);
  }, [searchQuery, filteredCategories, expandedCategories]);

  return (
    <aside
      className={`w-72 bg-background-light dark:bg-background-dark border-r border-zinc-200 dark:border-[#23482f] flex flex-col h-full ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
          Components
        </h3>

        {/* Search Input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search components..."
            className="w-full pl-10 pr-3 py-2 bg-white dark:bg-[#23482f] border border-zinc-200 dark:border-transparent rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">
              search_off
            </span>
            <p className="text-sm">No components found</p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.id} className="mb-2">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-3 bg-white dark:bg-[#23482f] rounded-lg border dark:border-transparent shadow-sm hover:bg-gray-50 dark:hover:bg-[#1a3523] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    {category.icon}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {category.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({category.components.length})
                  </span>
                </div>
                <span
                  className={`material-symbols-outlined text-gray-500 transition-transform ${
                    displayCategories.includes(category.id) ? 'rotate-180' : ''
                  }`}
                >
                  expand_more
                </span>
              </button>

              {/* Category Components */}
              {displayCategories.includes(category.id) && (
                <div className="mt-2 space-y-2 pl-2">
                  {category.components.map((component) => (
                    <DraggableComponent
                      key={component.type}
                      component={component}
                      onAddClick={onAddComponent}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-700">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-blue-600 dark:text-blue-300">
            <strong>Tip:</strong> Drag components onto the canvas or click the + button to add them.
          </p>
        </div>
      </div>
    </aside>
  );
};
