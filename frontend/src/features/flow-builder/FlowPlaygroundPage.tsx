import { useState, useCallback } from 'react';
import { usePlaygroundState } from './components/playground/hooks/usePlaygroundState';
import { usePreviewSettings } from './components/playground/hooks/usePreviewSettings';
import { ScreensPanel } from './components/playground/ScreensPanel';
import { ContentEditor } from './components/playground/ContentEditor';
import { PreviewPanel } from './components/playground/PreviewPanel';
import type { BuilderScreen } from './types/builder.types';
import type { FlowJSONVersion } from './types/flow-json.types';

// ============================================================================
// Props Interface
// ============================================================================

export interface FlowPlaygroundPageProps {
  /**
   * Flow ID (for editing existing flows)
   */
  flowId?: string;

  /**
   * Initial flow data to load
   */
  initialFlow?: {
    name: string;
    screens: BuilderScreen[];
    version?: FlowJSONVersion;
  };

  /**
   * Callback when flow is saved
   */
  onSave?: (flowData: {
    name: string;
    screens: BuilderScreen[];
    version: FlowJSONVersion;
  }) => void;

  /**
   * Callback for back navigation
   */
  onBack?: () => void;
}

// ============================================================================
// FlowPlaygroundPage Component
// ============================================================================

/**
 * FlowPlaygroundPage - WhatsApp Flows Playground
 *
 * Interactive 3-panel layout for testing and building WhatsApp Flows:
 * - Left: ScreensPanel (w-60) - Screen management
 * - Center: ContentEditor (flex-1) - Component editing
 * - Right: PreviewPanel (w-96) - Live WhatsApp preview
 *
 * Features:
 * - Editable flow name
 * - Save flow data
 * - Export Flow JSON
 * - Close/Back navigation
 * - Responsive layout (tabs on mobile)
 */
export function FlowPlaygroundPage({
  flowId,
  initialFlow,
  onSave,
  onBack,
}: FlowPlaygroundPageProps) {
  // ========================================================================
  // Playground State
  // ========================================================================

  const playground = usePlaygroundState({
    initialFlowId: flowId,
    initialFlowName: initialFlow?.name || 'New Flow',
    initialFlowVersion: initialFlow?.version || '7.2',
    initialScreens: initialFlow?.screens || [],
  });

  const preview = usePreviewSettings();

  // ========================================================================
  // UI State
  // ========================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'screens' | 'editor' | 'preview'>('editor');

  // ========================================================================
  // Save Flow
  // ========================================================================

  const handleSave = useCallback(async () => {
    setIsSaving(true);

    try {
      const flowData = {
        name: playground.flowName,
        screens: playground.screens,
        version: playground.flowVersion,
      };

      if (onSave) {
        await onSave(flowData);
      }

      // Show success feedback
      alert(`Flow "${playground.flowName}" saved successfully!`);
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save flow. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [playground.flowName, playground.screens, playground.flowVersion, onSave]);

  // ========================================================================
  // Export JSON
  // ========================================================================

  const handleExportJSON = useCallback(() => {
    const flowJSON = {
      version: playground.flowVersion,
      data_api_version: '3.0' as const,
      screens: playground.screens.map((screen) => ({
        id: screen.id,
        title: screen.title,
        terminal: screen.terminal,
        data: screen.data,
        layout: {
          type: 'SingleColumnLayout' as const,
          children: screen.components.map((c) => c.config),
        },
        refresh_on_back: screen.refresh_on_back,
      })),
    };

    const json = JSON.stringify(flowJSON, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playground.flowName.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [playground.flowName, playground.screens, playground.flowVersion]);

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a160e]">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between border-b border-zinc-700 px-6 py-3 bg-[#112217] shadow-sm">
        {/* Left: Flow Info */}
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
              aria-label="Go back"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          )}
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">
              touch_app
            </span>
            <div>
              <input
                type="text"
                value={playground.flowName}
                onChange={(e) => playground.setFlowName(e.target.value)}
                className="text-lg font-bold text-white bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/20 rounded px-2 py-1"
                placeholder="Flow name..."
              />
              <p className="text-xs text-zinc-400">
                {playground.screens.length} screen{playground.screens.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-white/5 transition-colors"
            title="Export Flow JSON"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold bg-primary text-[#112217] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      {/* Mobile Tabs (visible on <lg) */}
      <div className="lg:hidden flex border-b border-zinc-700 bg-[#112217]">
        <button
          onClick={() => setActiveTab('screens')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'screens'
              ? 'text-primary border-b-2 border-primary'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span className="material-symbols-outlined text-lg mr-2">list</span>
          Screens
        </button>
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'editor'
              ? 'text-primary border-b-2 border-primary'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span className="material-symbols-outlined text-lg mr-2">edit</span>
          Editor
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'preview'
              ? 'text-primary border-b-2 border-primary'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span className="material-symbols-outlined text-lg mr-2">smartphone</span>
          Preview
        </button>
      </div>

      {/* Main Content - 3 Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Screens (w-60) - Desktop only or when active tab on mobile */}
        <div
          className={`${
            activeTab === 'screens' ? 'flex' : 'hidden'
          } lg:flex w-full lg:w-60 flex-col border-r border-zinc-700 bg-[#0f1c14]`}
        >
          <ScreensPanel
            screens={playground.screens}
            selectedScreenId={playground.selectedScreenId}
            onSelectScreen={playground.selectScreen}
            onAddScreen={() => playground.addScreen()}
            onDeleteScreen={playground.deleteScreen}
            onDuplicateScreen={playground.duplicateScreen}
          />
        </div>

        {/* Center Panel: Content Editor (flex-1) - Desktop only or when active tab on mobile */}
        <div
          className={`${
            activeTab === 'editor' ? 'flex' : 'hidden'
          } lg:flex flex-1 flex-col min-h-0 overflow-hidden bg-[#0a160e] p-4`}
        >
          <ContentEditor
            screen={playground.selectedScreen}
            editorMode={playground.editorMode}
            expandedComponentId={playground.expandedComponentId}
            addContentMenuOpen={playground.addContentMenuOpen}
            onAddContentMenuOpenChange={playground.setAddContentMenuOpen}
            onToggleEditorMode={playground.toggleEditorMode}
            onUpdateScreen={(updates) => {
              if (playground.selectedScreenId) {
                playground.updateScreen(playground.selectedScreenId, updates);
              }
            }}
            onAddComponent={playground.addComponentFromMenu}
            onUpdateComponent={(componentId, updates) => {
              if (playground.selectedScreenId) {
                playground.updateComponent(playground.selectedScreenId, componentId, updates);
              }
            }}
            onDeleteComponent={(componentId) => {
              if (playground.selectedScreenId) {
                playground.deleteComponent(playground.selectedScreenId, componentId);
              }
            }}
            onDuplicateComponent={(componentId) => {
              if (playground.selectedScreenId) {
                playground.duplicateComponent(playground.selectedScreenId, componentId);
              }
            }}
            onReorderComponents={(newOrder) => {
              if (playground.selectedScreenId) {
                playground.reorderComponents(playground.selectedScreenId, newOrder);
              }
            }}
            onExpandComponent={playground.setExpandedComponentId}
            getComponentPreviewText={playground.getComponentPreviewText}
          />
        </div>

        {/* Right Panel: Preview (w-96) - Desktop only or when active tab on mobile */}
        <div
          className={`${
            activeTab === 'preview' ? 'flex' : 'hidden'
          } lg:flex w-full lg:w-96 flex-col border-l border-zinc-700 bg-[#112217]`}
        >
          <PreviewPanel
            screens={playground.screens}
            currentScreenId={playground.selectedScreenId}
            previewSettings={preview.settings}
            onNavigate={playground.selectScreen}
            onSettingsChange={(settings) => {
              if (settings.platform) preview.setPlatform(settings.platform);
              if (settings.theme) preview.setTheme(settings.theme);
              if (settings.interactive !== undefined) preview.toggleInteractive();
            }}
          />
        </div>
      </div>
    </div>
  );
}
