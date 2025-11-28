/**
 * ContentEditor Component
 *
 * Main content editor panel for WhatsApp Flows Playground.
 * Manages the editing of screen content with both form and JSON modes.
 */

import React, { useState } from 'react';
import type {
  BuilderScreen,
  BuilderComponent,
} from '../../../types/builder.types';
import type { EditorMode } from '../types/playground.types';
import { AddContentMenu } from './AddContentMenu';
import { TextHeadingEditor } from './editors/TextHeadingEditor';
import { TextInputEditor } from './editors/TextInputEditor';
import { RadioButtonsEditor } from './editors/RadioButtonsEditor';
import { DropdownEditor } from './editors/DropdownEditor';
import { FooterEditor } from './editors/FooterEditor';

// ============================================================================
// Props Interface
// ============================================================================

interface ContentEditorProps {
  /**
   * The currently selected screen to edit
   */
  screen: BuilderScreen | undefined;

  /**
   * Current editor mode (form or JSON)
   */
  editorMode: EditorMode;

  /**
   * ID of the currently expanded component in the accordion
   */
  expandedComponentId: string | null;

  /**
   * State of the add content menu
   */
  addContentMenuOpen: boolean;

  /**
   * Callback when add content menu open state changes
   */
  onAddContentMenuOpenChange: (open: boolean) => void;

  /**
   * Toggle between JSON and form editor modes
   */
  onToggleEditorMode: () => void;

  /**
   * Update the screen properties (e.g., title)
   */
  onUpdateScreen: (updates: Partial<BuilderScreen>) => void;

  /**
   * Add a new component to the screen
   */
  onAddComponent: (type: string) => void;

  /**
   * Update a component's properties
   */
  onUpdateComponent: (
    componentId: string,
    updates: Partial<BuilderComponent>
  ) => void;

  /**
   * Delete a component from the screen
   */
  onDeleteComponent: (componentId: string) => void;

  /**
   * Duplicate a component
   */
  onDuplicateComponent: (componentId: string) => void;

  /**
   * Reorder components in the screen
   */
  onReorderComponents: (newOrder: string[]) => void;

  /**
   * Expand or collapse a component in the accordion
   */
  onExpandComponent: (componentId: string | null) => void;

  /**
   * Get preview text for a component (for accordion headers)
   */
  getComponentPreviewText: (component: BuilderComponent) => string;

  /**
   * All screens in the flow (for navigation selection)
   */
  allScreens?: Array<{ id: string; title: string }>;

  /**
   * Additional CSS classes
   */
  className?: string;
}

// ============================================================================
// ContentEditor Component
// ============================================================================

export const ContentEditor: React.FC<ContentEditorProps> = ({
  screen,
  editorMode,
  expandedComponentId,
  addContentMenuOpen,
  onAddContentMenuOpenChange,
  onToggleEditorMode,
  onUpdateScreen,
  onAddComponent,
  onUpdateComponent,
  onDeleteComponent,
  // onDuplicateComponent, // TODO: Add duplicate functionality to component editors
  // onReorderComponents, // TODO: Add drag-and-drop reordering to component list
  onExpandComponent,
  getComponentPreviewText,
  allScreens = [],
  className = '',
}) => {
  // Local state for screen title editor expansion
  const [isTitleExpanded, setIsTitleExpanded] = useState(true);

  // Handle screen title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateScreen({ title: e.target.value });
  };

  // Toggle screen title section
  const toggleTitleSection = () => {
    setIsTitleExpanded(!isTitleExpanded);
  };

  // Render the appropriate editor for each component type
  const renderComponentEditor = (component: BuilderComponent) => {
    const editorProps = {
      component,
      onChange: (updates: Partial<BuilderComponent>) => {
        onUpdateComponent(component.id, updates);
      },
      onDelete: () => {
        onDeleteComponent(component.id);
      },
    };

    // Text components: TextHeading, TextSubheading, TextBody, TextCaption
    if (
      component.type === 'TextHeading' ||
      component.type === 'TextSubheading' ||
      component.type === 'TextBody' ||
      component.type === 'TextCaption'
    ) {
      return <TextHeadingEditor {...editorProps} />;
    }

    // Input components: TextInput, TextArea
    if (component.type === 'TextInput' || component.type === 'TextArea') {
      return <TextInputEditor {...editorProps} />;
    }

    // Selection components: RadioButtonsGroup, CheckboxGroup
    if (component.type === 'RadioButtonsGroup' || component.type === 'CheckboxGroup') {
      return <RadioButtonsEditor {...editorProps} />;
    }

    // Dropdown component
    if (component.type === 'Dropdown') {
      return <DropdownEditor {...editorProps} />;
    }

    // Footer component
    if (component.type === 'Footer') {
      return (
        <FooterEditor
          {...editorProps}
          availableScreens={allScreens}
          currentScreenId={screen?.id}
        />
      );
    }

    // Fallback for unsupported component types
    return (
      <div className="text-xs text-zinc-600 p-3 bg-zinc-900 rounded border border-zinc-800">
        <p>Editor not yet implemented for {component.type}</p>
        <p className="mt-1">Component ID: {component.id}</p>
      </div>
    );
  };

  // Render empty state when no screen is selected
  if (!screen) {
    return (
      <div
        className={`flex flex-col h-full bg-zinc-900 border border-zinc-700 rounded-lg ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h2 className="text-sm font-medium text-zinc-200">Edit content</h2>
          <button
            onClick={onToggleEditorMode}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title={editorMode === 'json' ? 'Switch to form view' : 'Switch to JSON view'}
          >
            <span className="material-symbols-rounded text-[20px]">
              {editorMode === 'json' ? 'list' : 'code'}
            </span>
          </button>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div className="text-zinc-500">
            <span className="material-symbols-rounded text-[48px] mb-2 block opacity-50">
              article
            </span>
            <p className="text-sm">Select a screen to edit its content</p>
          </div>
        </div>
      </div>
    );
  }

  // Render JSON editor mode
  if (editorMode === 'json') {
    return (
      <div
        className={`flex flex-col h-full bg-zinc-900 border border-zinc-700 rounded-lg ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h2 className="text-sm font-medium text-zinc-200">Edit content</h2>
          <button
            onClick={onToggleEditorMode}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Switch to form view"
          >
            <span className="material-symbols-rounded text-[20px]">list</span>
          </button>
        </div>

        {/* JSON Editor Placeholder */}
        <div className="flex-1 p-4">
          <div className="w-full h-full bg-zinc-950 rounded border border-zinc-800 p-4">
            <div className="text-zinc-500 text-sm font-mono">
              {/* Placeholder for JSONEditor component */}
              <p>JSON Editor</p>
              <p className="text-xs mt-2 text-zinc-600">
                (JSONEditor component will be implemented here)
              </p>
              <pre className="mt-4 text-xs overflow-auto">
                {JSON.stringify(
                  {
                    id: screen.id,
                    title: screen.title,
                    components: screen.components,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render form editor mode
  return (
    <div
      className={`flex flex-col h-full min-h-0 bg-zinc-900 border border-zinc-700 rounded-lg ${className}`}
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-zinc-700">
        <h2 className="text-sm font-medium text-zinc-200">Edit content</h2>
        <button
          onClick={onToggleEditorMode}
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Switch to JSON view"
        >
          <span className="material-symbols-rounded text-[20px]">code</span>
        </button>
      </div>

      {/* Content area - scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Screen Title Section */}
        <div className="border-b border-zinc-800">
          <button
            onClick={toggleTitleSection}
            className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors text-left"
          >
            <span className="text-sm font-medium text-zinc-300">Screen title</span>
            <span className="material-symbols-rounded text-[20px] text-zinc-400">
              {isTitleExpanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {isTitleExpanded && (
            <div className="px-4 pb-4">
              <input
                type="text"
                value={screen.title || ''}
                onChange={handleTitleChange}
                placeholder="Enter screen title"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
          )}
        </div>

        {/* Component List */}
        <div className="py-2">
          {screen.components.length === 0 ? (
            <div className="px-4 py-8 text-center text-zinc-500 text-sm">
              <span className="material-symbols-rounded text-[32px] mb-2 block opacity-50">
                add_box
              </span>
              <p>No components yet</p>
              <p className="text-xs mt-1">Click "Add content" to get started</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {screen.components.map((component) => {
                const isExpanded = expandedComponentId === component.id;
                const previewText = getComponentPreviewText(component);

                return (
                  <div
                    key={component.id}
                    className="border-b border-zinc-800 last:border-b-0"
                  >
                    {/* Component Accordion Header - Placeholder */}
                    <button
                      onClick={() =>
                        onExpandComponent(isExpanded ? null : component.id)
                      }
                      className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="material-symbols-rounded text-[20px] text-zinc-400">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-zinc-300 truncate">
                            <span className="text-zinc-500">
                              {component.type}
                            </span>
                            {previewText && (
                              <>
                                <span className="text-zinc-600 mx-1.5">·</span>
                                <span className="text-zinc-400">{previewText}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Component Editor */}
                    {isExpanded && (
                      <div className="px-4 pb-4 bg-zinc-950/50">
                        {renderComponentEditor(component)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Content Menu - fixed at bottom */}
      <div className="flex-shrink-0 border-t border-zinc-700 p-4">
        <AddContentMenu
          isOpen={addContentMenuOpen}
          onOpenChange={onAddContentMenuOpenChange}
          onAddComponent={onAddComponent}
        />
      </div>
    </div>
  );
};
