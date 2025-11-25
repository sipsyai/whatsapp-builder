/**
 * ComponentPalette Usage Example
 *
 * This file demonstrates how to integrate the ComponentPalette
 * into a Flow Builder page with ReactFlow canvas.
 */

import React, { useState, useCallback } from 'react';
import { ReactFlow, Background, Controls, Node, Edge } from '@xyflow/react';
import { ComponentPalette } from './ComponentPalette';
import type { Component } from '../../types/flow-json.types';
import type { BuilderComponent, BuilderScreen } from '../../types/builder.types';

// Example: Complete Flow Builder Page with ComponentPalette
export const FlowBuilderPageExample = () => {
  // State
  const [screens, setScreens] = useState<BuilderScreen[]>([
    {
      id: 'screen-1',
      title: 'Welcome Screen',
      components: [],
      terminal: false,
      validation: { isValid: true, errors: [], warnings: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  const [selectedScreenId, setSelectedScreenId] = useState<string | null>('screen-1');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  /**
   * Handle adding a component via click (+ button)
   */
  const handleAddComponent = useCallback(
    (componentType: Component['type']) => {
      if (!selectedScreenId) {
        alert('Please select a screen first');
        return;
      }

      // Create new component with default config
      const newComponent: BuilderComponent = {
        id: crypto.randomUUID(),
        type: componentType,
        config: createDefaultConfig(componentType),
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
        },
      };

      // Add component to selected screen
      setScreens((prevScreens) =>
        prevScreens.map((screen) => {
          if (screen.id === selectedScreenId) {
            return {
              ...screen,
              components: [...screen.components, newComponent],
              updatedAt: new Date().toISOString(),
            };
          }
          return screen;
        })
      );

      console.log(`Added ${componentType} to screen ${selectedScreenId}`);
    },
    [selectedScreenId]
  );

  /**
   * Handle component drop on canvas
   */
  const handleCanvasDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const componentType = event.dataTransfer.getData(
        'application/whatsapp-flow-component'
      ) as Component['type'];

      if (!componentType || !selectedScreenId) {
        return;
      }

      // Get drop position
      const canvasRect = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - canvasRect.left,
        y: event.clientY - canvasRect.top,
      };

      // Create new component
      const newComponent: BuilderComponent = {
        id: crypto.randomUUID(),
        type: componentType,
        config: createDefaultConfig(componentType),
        position,
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
        },
      };

      // Add to selected screen
      setScreens((prevScreens) =>
        prevScreens.map((screen) => {
          if (screen.id === selectedScreenId) {
            return {
              ...screen,
              components: [...screen.components, newComponent],
              updatedAt: new Date().toISOString(),
            };
          }
          return screen;
        })
      );

      console.log(`Dropped ${componentType} at position:`, position);
    },
    [selectedScreenId]
  );

  const handleCanvasDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  // Get current screen
  const currentScreen = screens.find((s) => s.id === selectedScreenId);

  return (
    <div className="flex h-screen w-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-200 dark:border-[#23482f] px-6 py-3 bg-background-light dark:bg-background-dark">
        <div className="flex items-center gap-4">
          <div className="size-6 text-primary">
            <span className="material-symbols-outlined text-primary">account_tree</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              WhatsApp Flow Builder
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {currentScreen ? `Editing: ${currentScreen.title}` : 'No screen selected'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg text-sm font-bold hover:bg-gray-300 dark:hover:bg-gray-600">
            Preview
          </button>
          <button className="px-4 py-2 bg-primary text-[#112217] rounded-lg text-sm font-bold hover:opacity-90">
            Save Flow
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Component Palette Sidebar */}
        <ComponentPalette onAddComponent={handleAddComponent} />

        {/* Main Canvas Area */}
        <main
          className="flex-1 overflow-hidden"
          onDrop={handleCanvasDrop}
          onDragOver={handleCanvasDragOver}
        >
          <div className="h-full bg-zinc-100 dark:bg-[#0a160e]">
            {currentScreen ? (
              <div className="h-full p-8">
                {/* Screen Info */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                    {currentScreen.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {currentScreen.components.length} components
                  </p>
                </div>

                {/* Component List */}
                <div className="space-y-3">
                  {currentScreen.components.length === 0 ? (
                    <div className="text-center py-16 text-zinc-500 dark:text-zinc-400">
                      <span className="material-symbols-outlined text-6xl mb-4 opacity-30">
                        widgets
                      </span>
                      <p className="text-lg mb-2">No components yet</p>
                      <p className="text-sm">
                        Drag components from the palette or click + to add them
                      </p>
                    </div>
                  ) : (
                    currentScreen.components.map((component, index) => (
                      <div
                        key={component.id}
                        className="p-4 bg-white dark:bg-[#23482f] rounded-lg border dark:border-transparent shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-zinc-500 dark:text-zinc-400">
                              {index + 1}.
                            </span>
                            <span className="font-medium text-zinc-900 dark:text-white">
                              {component.type}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-[#1a3523] rounded">
                              <span className="material-symbols-outlined text-sm">
                                settings
                              </span>
                            </button>
                            <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded">
                              <span className="material-symbols-outlined text-sm">
                                delete
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                <div className="text-center">
                  <span className="material-symbols-outlined text-6xl mb-4 opacity-30">
                    info
                  </span>
                  <p className="text-lg">No screen selected</p>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Properties Panel (Optional) */}
        <aside className="w-80 bg-background-light dark:bg-background-dark border-l border-zinc-200 dark:border-[#23482f] p-4 overflow-y-auto">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
            Properties
          </h3>

          {currentScreen ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Screen Title
                </label>
                <input
                  type="text"
                  value={currentScreen.title}
                  onChange={(e) => {
                    setScreens((prev) =>
                      prev.map((s) =>
                        s.id === selectedScreenId ? { ...s, title: e.target.value } : s
                      )
                    );
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-[#23482f] border border-zinc-200 dark:border-transparent rounded-lg text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={currentScreen.terminal || false}
                    onChange={(e) => {
                      setScreens((prev) =>
                        prev.map((s) =>
                          s.id === selectedScreenId
                            ? { ...s, terminal: e.target.checked }
                            : s
                        )
                      );
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">
                    Terminal Screen
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Select a screen to edit properties
            </p>
          )}
        </aside>
      </div>
    </div>
  );
};

/**
 * Helper: Create default config for a component type
 */
function createDefaultConfig(componentType: Component['type']): Partial<Component> {
  const baseConfig: any = {
    type: componentType,
    visible: true,
  };

  // Add type-specific defaults
  switch (componentType) {
    case 'TextHeading':
      return { ...baseConfig, text: 'Heading Text' };
    case 'TextSubheading':
      return { ...baseConfig, text: 'Subheading Text' };
    case 'TextBody':
      return { ...baseConfig, text: 'Body text goes here' };
    case 'TextCaption':
      return { ...baseConfig, text: 'Caption text' };
    case 'RichText':
      return { ...baseConfig, text: 'Rich text content' };

    case 'TextInput':
      return { ...baseConfig, name: 'text_input', label: 'Enter text', required: false };
    case 'TextArea':
      return { ...baseConfig, name: 'text_area', label: 'Enter details', required: false };

    case 'Dropdown':
      return {
        ...baseConfig,
        name: 'dropdown',
        label: 'Select an option',
        'data-source': [],
        required: false,
      };
    case 'RadioButtonsGroup':
      return {
        ...baseConfig,
        name: 'radio_group',
        label: 'Choose one',
        'data-source': [],
        required: false,
      };
    case 'CheckboxGroup':
      return {
        ...baseConfig,
        name: 'checkbox_group',
        label: 'Select multiple',
        'data-source': [],
        required: false,
      };
    case 'ChipsSelector':
      return {
        ...baseConfig,
        name: 'chips',
        label: 'Select options',
        'data-source': [],
        required: false,
      };

    case 'DatePicker':
      return { ...baseConfig, name: 'date', label: 'Select date' };
    case 'CalendarPicker':
      return { ...baseConfig, name: 'calendar', label: 'Select date', mode: 'single' };

    case 'Image':
      return { ...baseConfig, src: '', 'alt-text': 'Image' };
    case 'ImageCarousel':
      return { ...baseConfig, images: [], 'aspect-ratio': '4:3' };

    case 'Footer':
      return {
        ...baseConfig,
        label: 'Continue',
        'on-click-action': { name: 'complete' as const },
      };
    case 'EmbeddedLink':
      return {
        ...baseConfig,
        text: 'Click here',
        'on-click-action': { name: 'complete' as const },
      };
    case 'NavigationList':
      return {
        ...baseConfig,
        name: 'nav_list',
        'list-items': [],
        'on-click-action': { name: 'navigate' as const, next: { type: 'screen', name: '' } },
      };

    case 'If':
      return { ...baseConfig, condition: '${data.value} == true', then: [], else: [] };
    case 'Switch':
      return { ...baseConfig, value: '${data.field}', cases: {} };
    case 'OptIn':
      return { ...baseConfig, name: 'opt_in', label: 'I agree to the terms', required: false };

    default:
      return baseConfig;
  }
}

export default FlowBuilderPageExample;
