import { useState, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ComponentPalette } from './components/palette';
import { FlowCanvas } from './components/canvas';
import { ScreenEditor, ComponentConfigModal } from './components/editor';
import { FlowPreview } from './components/preview';
import { ValidationPanel } from './components/validation';

import { useFlowBuilder } from './hooks';
import { useFlowCanvas } from './components/canvas/useFlowCanvas';
import { validateFlowJSON } from './utils/validation';
import { builderScreenToFlowScreen } from './types/builder.types';

import type { FlowJSON, BuilderScreen, BuilderComponent, ValidationError } from './types';
import type { Component } from './types/flow-json.types';
import { getComponentDefaults, COMPONENT_DEFAULTS } from './constants/component-defaults';

// ============================================================================
// Props Interface
// ============================================================================

export interface FlowBuilderPageProps {
  /**
   * Initial flow ID (for editing existing flows)
   */
  initialFlowId?: string;

  /**
   * Initial flow data to load
   */
  initialFlowData?: FlowJSON;

  /**
   * Callback when flow is saved
   */
  onSave?: (flowJson: FlowJSON) => void;

  /**
   * Callback for back navigation
   */
  onBack?: () => void;
}

// ============================================================================
// FlowBuilderPage Component
// ============================================================================

/**
 * FlowBuilderPage - Main WhatsApp Flow Builder interface
 *
 * Three-panel layout:
 * - Left: ComponentPalette (w-72)
 * - Center: FlowCanvas (flex-1)
 * - Right: ScreenEditor + FlowPreview (w-96)
 *
 * Features:
 * - Drag & drop components
 * - Visual flow editing with ReactFlow
 * - Real-time validation
 * - Flow preview
 * - Save/Load functionality
 */
export function FlowBuilderPage({
  initialFlowId,
  initialFlowData,
  onSave,
  onBack,
}: FlowBuilderPageProps) {
  // ========================================================================
  // Flow Builder State
  // ========================================================================

  const flowBuilder = useFlowBuilder({
    initialFlowId,
    initialFlowName: initialFlowData?.name || 'New Flow',
    initialFlowVersion: initialFlowData?.version || '7.2',
    initialScreens: initialFlowData?.screens.map(screen => ({
      id: screen.id,
      title: screen.title,
      terminal: screen.terminal,
      data: screen.data,
      layout: screen.layout,
      components: [],
      validation: { isValid: true, errors: [], warnings: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })) || [],
  });

  // ========================================================================
  // ReactFlow Canvas Hook
  // ========================================================================

  const canvas = useFlowCanvas({
    screens: flowBuilder.screens,
    onScreenUpdate: flowBuilder.updateScreen,
    onScreenSelect: flowBuilder.selectScreen,
  });

  // ========================================================================
  // UI State
  // ========================================================================

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingComponent, setEditingComponent] = useState<BuilderComponent | null>(null);

  // ========================================================================
  // Validation
  // ========================================================================

  const handleValidate = useCallback(() => {
    // Build Flow JSON from current state
    const flowJSON: FlowJSON = {
      version: flowBuilder.flowVersion,
      name: flowBuilder.flowName,
      screens: flowBuilder.screens.map(screen => builderScreenToFlowScreen(screen)),
    };

    // Validate
    const result = validateFlowJSON(flowJSON);
    setValidationErrors(result.errors);
    setShowValidationPanel(true);

    return result;
  }, [flowBuilder]);

  // ========================================================================
  // Save Flow
  // ========================================================================

  const handleSave = useCallback(async () => {
    // Validate before saving
    const validation = handleValidate();

    // Check for errors
    const hasErrors = validation.errors.some(e => e.type === 'error');
    const hasWarnings = validation.errors.some(e => e.type === 'warning');

    if (hasErrors) {
      alert('Flow has validation errors. Please fix them before saving.');
      return;
    }

    if (hasWarnings) {
      const confirmed = window.confirm(
        'There are some warnings in your flow. Do you want to continue saving?'
      );
      if (!confirmed) {
        return;
      }
    }

    setIsSaving(true);

    try {
      // Build Flow JSON
      const flowJSON: FlowJSON = {
        version: flowBuilder.flowVersion,
        name: flowBuilder.flowName,
        screens: flowBuilder.screens.map(screen => builderScreenToFlowScreen(screen)),
      };

      // Call save callback
      if (onSave) {
        await onSave(flowJSON);
      }

      // Clear validation errors on success
      setValidationErrors([]);
      setShowValidationPanel(false);

      alert(`Flow "${flowBuilder.flowName}" saved successfully!`);
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save flow. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [flowBuilder, handleValidate, onSave]);

  // ========================================================================
  // Screen Management
  // ========================================================================

  const handleAddScreen = useCallback(() => {
    // Calculate position for new screen
    const position = canvas.reactFlowInstance
      ? canvas.reactFlowInstance.screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        })
      : {
          x: 250 + flowBuilder.screens.length * 100,
          y: 250 + flowBuilder.screens.length * 50,
        };

    const newScreen = flowBuilder.addScreen({
      title: `Screen ${flowBuilder.screens.length + 1}`,
    });

    // Add node to canvas
    canvas.addNode({
      id: newScreen.id,
      type: 'screen',
      position,
      data: {
        screen: newScreen,
        label: newScreen.title || newScreen.id,
        onEdit: () => flowBuilder.selectScreen(newScreen.id),
        onDelete: () => flowBuilder.deleteScreen(newScreen.id),
      },
    });
  }, [flowBuilder, canvas]);

  const handleUpdateScreen = useCallback(
    (updates: Partial<BuilderScreen>) => {
      if (!flowBuilder.selectedScreenId) return;
      flowBuilder.updateScreen(flowBuilder.selectedScreenId, updates);
    },
    [flowBuilder]
  );

  // ========================================================================
  // Component Management
  // ========================================================================

  const handleAddComponent = useCallback(
    (componentType?: Component['type']) => {
      if (!flowBuilder.selectedScreenId) {
        alert('Please select a screen first');
        return;
      }

      const type = componentType || 'TextBody';

      // Get default config for this component type
      const defaultConfig = type in COMPONENT_DEFAULTS
        ? getComponentDefaults(type as keyof typeof COMPONENT_DEFAULTS)
        : {};

      flowBuilder.addComponent(flowBuilder.selectedScreenId, {
        type,
        config: defaultConfig,
      });
    },
    [flowBuilder]
  );

  const handleReorderComponents = useCallback(
    (newOrder: any[]) => {
      if (!flowBuilder.selectedScreenId) return;
      flowBuilder.reorderComponents(
        flowBuilder.selectedScreenId,
        newOrder.map(c => c.id)
      );
    },
    [flowBuilder]
  );

  const handleEditComponent = useCallback(
    (componentId: string) => {
      flowBuilder.selectComponent(componentId);

      // Find and open the component config modal
      if (!flowBuilder.selectedScreenId) return;
      const component = flowBuilder.getComponent(flowBuilder.selectedScreenId, componentId);
      if (component) {
        setEditingComponent(component);
      }
    },
    [flowBuilder]
  );

  const handleSaveComponentConfig = useCallback(
    (config: any) => {
      if (!flowBuilder.selectedScreenId || !editingComponent) return;

      flowBuilder.updateComponent(
        flowBuilder.selectedScreenId,
        editingComponent.id,
        { config }
      );

      setEditingComponent(null);
    },
    [flowBuilder, editingComponent]
  );

  const handleDeleteComponent = useCallback(
    (componentId: string) => {
      if (!flowBuilder.selectedScreenId) return;
      const confirmed = window.confirm('Are you sure you want to delete this component?');
      if (confirmed) {
        flowBuilder.deleteComponent(flowBuilder.selectedScreenId, componentId);
      }
    },
    [flowBuilder]
  );

  const handleDuplicateComponent = useCallback(
    (componentId: string) => {
      if (!flowBuilder.selectedScreenId) return;
      flowBuilder.duplicateComponent(flowBuilder.selectedScreenId, componentId);
    },
    [flowBuilder]
  );

  // ========================================================================
  // Preview Management
  // ========================================================================

  const [previewScreenId, setPreviewScreenId] = useState<string>(
    flowBuilder.screens[0]?.id || ''
  );

  const handlePreviewNavigate = useCallback((screenId: string) => {
    setPreviewScreenId(screenId);
  }, []);

  const handlePreviewComplete = useCallback((payload: any) => {
    console.log('Flow completed with payload:', payload);
    alert('Flow completed successfully!');
  }, []);

  // ========================================================================
  // Undo/Redo (TODO)
  // ========================================================================

  const handleUndo = useCallback(() => {
    // TODO: Implement undo
    alert('Undo not yet implemented');
  }, []);

  const handleRedo = useCallback(() => {
    // TODO: Implement redo
    alert('Redo not yet implemented');
  }, []);

  // ========================================================================
  // Export JSON
  // ========================================================================

  const handleExportJSON = useCallback(() => {
    const flowJSON: FlowJSON = {
      version: flowBuilder.flowVersion,
      name: flowBuilder.flowName,
      screens: flowBuilder.screens.map(screen => builderScreenToFlowScreen(screen)),
    };

    const json = JSON.stringify(flowJSON, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flowBuilder.flowName.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [flowBuilder]);

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen w-full bg-zinc-50 dark:bg-[#0a160e]">
        {/* Header / Toolbar */}
        <header className="flex-shrink-0 flex items-center justify-between border-b border-zinc-200 dark:border-[#23482f] px-6 py-3 bg-white dark:bg-[#112217] z-20 shadow-sm">
          {/* Left: Flow Info */}
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-lg text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                aria-label="Go back"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
            )}
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">
                account_tree
              </span>
              <div>
                <input
                  type="text"
                  value={flowBuilder.flowName}
                  onChange={(e) => flowBuilder.setFlowName(e.target.value)}
                  className="text-lg font-bold text-zinc-900 dark:text-white bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/20 rounded px-2 py-1"
                  placeholder="Flow name..."
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {flowBuilder.flowId
                    ? `Editing Flow • ${flowBuilder.screens.length} screens`
                    : `New Flow • ${flowBuilder.screens.length} screens`}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleUndo}
                disabled
                className="p-2 rounded-lg text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <span className="material-symbols-outlined text-lg">undo</span>
              </button>
              <button
                onClick={handleRedo}
                disabled
                className="p-2 rounded-lg text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Redo (Ctrl+Y)"
              >
                <span className="material-symbols-outlined text-lg">redo</span>
              </button>
            </div>

            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700" />

            {/* Validate */}
            <button
              onClick={handleValidate}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">check_circle</span>
              Validate
            </button>

            {/* Export JSON */}
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              Export JSON
            </button>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold bg-primary text-[#112217] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              <span className="material-symbols-outlined text-lg">save</span>
              {isSaving ? 'Saving...' : 'Save Flow'}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Component Palette */}
          <ComponentPalette onAddComponent={handleAddComponent} />

          {/* Center: Flow Canvas */}
          <div className="flex-1 relative">
            <FlowCanvas
              nodes={canvas.nodes}
              edges={canvas.edges}
              onNodesChange={canvas.onNodesChange}
              onEdgesChange={canvas.onEdgesChange}
              onNodeClick={(_, node) => {
                const screenId = node.data?.screen?.id;
                if (screenId) {
                  flowBuilder.selectScreen(screenId);
                }
              }}
              onComponentDrop={(componentType) => {
                // Add component to selected screen when dropped on canvas
                if (flowBuilder.selectedScreenId) {
                  handleAddComponent(componentType as any);
                } else {
                  // If no screen selected, create a new screen first
                  const newScreen = flowBuilder.addScreen();
                  if (newScreen) {
                    handleAddComponent(componentType as any);
                  }
                }
              }}
            />

            {/* Floating Add Screen Button */}
            <button
              onClick={handleAddScreen}
              className="absolute bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold bg-primary text-[#112217] shadow-lg hover:opacity-90 transition-opacity z-10"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Add Screen
            </button>
          </div>

          {/* Right Panel: Editor + Preview */}
          <div className="w-96 flex flex-col border-l border-zinc-200 dark:border-[#23482f] bg-white dark:bg-[#112217]">
            {/* Screen Editor */}
            {flowBuilder.selectedScreen ? (
              <div className="flex-1 overflow-hidden">
                <ScreenEditor
                  screen={flowBuilder.selectedScreen}
                  onUpdateScreen={handleUpdateScreen}
                  onAddComponent={() => handleAddComponent()}
                  onReorderComponents={handleReorderComponents}
                  onEditComponent={handleEditComponent}
                  onDeleteComponent={handleDeleteComponent}
                  onDuplicateComponent={handleDuplicateComponent}
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <span className="material-symbols-outlined text-6xl text-zinc-300 dark:text-zinc-600 mb-4">
                  edit_square
                </span>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">
                  No Screen Selected
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                  Select a screen from the canvas to edit its properties and components.
                </p>
                <button
                  onClick={handleAddScreen}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-[#112217] hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Add First Screen
                </button>
              </div>
            )}

            {/* Divider */}
            <div className="h-px bg-zinc-200 dark:bg-zinc-700" />

            {/* Flow Preview */}
            <div className="h-96 flex-shrink-0">
              {flowBuilder.screens.length > 0 ? (
                <FlowPreview
                  screens={flowBuilder.screens}
                  currentScreenId={previewScreenId || flowBuilder.screens[0]?.id}
                  onNavigate={handlePreviewNavigate}
                  onComplete={handlePreviewComplete}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                  <span className="material-symbols-outlined text-4xl text-zinc-300 dark:text-zinc-600 mb-2">
                    phonelink
                  </span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Add screens to see preview
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Validation Panel Overlay */}
        {showValidationPanel && validationErrors.length > 0 && (
          <div className="fixed bottom-6 right-6 w-96 max-h-96 z-50">
            <ValidationPanel
              errors={validationErrors}
              onClose={() => setShowValidationPanel(false)}
              onNavigateToError={(errorId) => {
                // Navigate to the screen with error
                const screen = flowBuilder.screens.find(s => s.id === errorId);
                if (screen) {
                  flowBuilder.selectScreen(screen.id);
                }
              }}
            />
          </div>
        )}

        {/* Component Configuration Modal */}
        {editingComponent && (
          <ComponentConfigModal
            component={{
              type: editingComponent.type,
              config: editingComponent.config,
            }}
            onSave={handleSaveComponentConfig}
            onClose={() => setEditingComponent(null)}
          />
        )}
      </div>
    </ReactFlowProvider>
  );
}
