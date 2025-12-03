import { useState, useCallback, useEffect } from 'react';
import { usePlaygroundState } from './components/playground/hooks/usePlaygroundState';
import { usePreviewSettings } from './components/playground/hooks/usePreviewSettings';
import { ScreensPanel } from './components/playground/ScreensPanel';
import { ContentEditor } from './components/playground/ContentEditor';
import { PreviewPanel } from './components/playground/PreviewPanel';
import { SaveFlowModal } from './components/playground/modals';
import type { SaveFlowModalData } from './components/playground/modals';
import { flowsApi } from '../flows/api';
import type { FlowValidationResult } from '../flows/api';
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
   * Mode: 'create' for new flows, 'edit' for existing flows
   * @default 'edit'
   */
  mode?: 'create' | 'edit';

  /**
   * Callback when flow is saved
   */
  onSave?: (flowData: {
    name: string;
    categories?: string[];
    screens: BuilderScreen[];
    version: FlowJSONVersion;
    integrationConfigs?: any[];
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
  mode = 'edit',
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
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'screens' | 'editor' | 'preview'>('editor');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<FlowValidationResult | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ========================================================================
  // Save Flow
  // ========================================================================

  const handleSave = useCallback(async (data?: { name: string; categories: string[]; integrationConfigs?: any[] }) => {
    setIsSaving(true);

    try {
      const flowData = {
        name: data?.name || playground.flowName,
        categories: data?.categories,
        screens: playground.screens,
        version: playground.flowVersion,
        integrationConfigs: data?.integrationConfigs,
      };

      if (onSave) {
        await onSave(flowData);
      }

      // Show success feedback
      setToast({ message: `Flow "${flowData.name}" saved successfully!`, type: 'success' });
    } catch (error) {
      console.error('Save error:', error);
      setToast({ message: 'Failed to save flow. Please try again.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  }, [playground.flowName, playground.screens, playground.flowVersion, onSave]);

  const handleSaveClick = useCallback(() => {
    if (mode === 'create') {
      // Create mode: Show modal to get name and categories
      setShowSaveModal(true);
    } else {
      // Edit mode: Save directly
      handleSave();
    }
  }, [mode, handleSave]);

  const handleSaveModalSubmit = useCallback(async (data: SaveFlowModalData) => {
    setShowSaveModal(false);
    await handleSave(data);
  }, [handleSave]);

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
  // Validate Flow
  // ========================================================================

  const handleValidate = useCallback(async () => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      // Build flow JSON for validation (same structure as save)
      const screens = playground.screens.map(screen => {
        const hasCompleteAction = screen.components.some((c: any) =>
          c.type === 'Footer' &&
          c.config?.['on-click-action']?.name === 'complete'
        );
        const isTerminal = hasCompleteAction || screen.terminal;

        const screenObj: any = {
          id: screen.id,
          title: screen.title,
          terminal: isTerminal,
          data: screen.data || {},
          layout: {
            type: 'SingleColumnLayout',
            children: screen.components.map((c: any) => ({
              type: c.type,
              ...c.config,
            })),
          },
        };

        if (isTerminal) {
          screenObj.success = true;
        }

        if (screen.refresh_on_back !== undefined) {
          screenObj.refresh_on_back = screen.refresh_on_back;
        }

        return screenObj;
      });

      const usesDataExchange = screens.some(screen =>
        screen.layout.children.some((c: any) =>
          c['on-click-action']?.name === 'data_exchange'
        )
      );

      let flowJson: any;
      if (usesDataExchange) {
        const routing_model: Record<string, string[]> = {};
        screens.forEach(screen => {
          if (screen.terminal) {
            routing_model[screen.id] = [];
          } else {
            routing_model[screen.id] = screens
              .filter(s => s.id !== screen.id)
              .map(s => s.id);
          }
        });
        flowJson = {
          version: playground.flowVersion,
          data_api_version: '3.0',
          routing_model,
          screens,
        };
      } else {
        flowJson = {
          version: playground.flowVersion,
          screens,
        };
      }

      const result = await flowsApi.validate({
        flowJson,
        flowId: flowId,
        name: playground.flowName || 'Validation Test',
      });

      setValidationResult(result);
    } catch (error: any) {
      console.error('Validation error:', error);
      setValidationResult({
        isValid: false,
        errors: [{
          error: 'VALIDATION_FAILED',
          error_type: 'CLIENT_ERROR',
          message: error.response?.data?.message || error.message || 'Validation failed',
        }],
      });
    } finally {
      setIsValidating(false);
    }
  }, [flowId, playground.flowName, playground.flowVersion, playground.screens]);

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
          {/* Validate */}
          <button
            onClick={handleValidate}
            disabled={isValidating || playground.screens.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              validationResult?.isValid
                ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                : validationResult?.errors?.length
                ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                : 'text-zinc-300 hover:bg-white/5'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Validate Flow JSON against Meta API"
          >
            <span className="material-symbols-outlined text-lg">
              {isValidating ? 'sync' : validationResult?.isValid ? 'check_circle' : validationResult?.errors?.length ? 'error' : 'verified'}
            </span>
            <span className="hidden sm:inline">
              {isValidating ? 'Validating...' : 'Validate'}
            </span>
          </button>

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
            onClick={handleSaveClick}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold bg-primary text-[#112217] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      {/* Validation Results Banner */}
      {validationResult && (
        <div className={`flex-shrink-0 px-6 py-3 border-b border-zinc-700 ${
          validationResult.isValid
            ? 'bg-emerald-500/10'
            : 'bg-red-500/10'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <span className={`material-symbols-outlined text-xl mt-0.5 ${
                validationResult.isValid ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {validationResult.isValid ? 'check_circle' : 'error'}
              </span>
              <div>
                <h3 className={`font-medium ${
                  validationResult.isValid ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {validationResult.isValid
                    ? 'Flow JSON is valid! Ready to publish.'
                    : `${validationResult.errors.length} validation error${validationResult.errors.length !== 1 ? 's' : ''} found`
                  }
                </h3>
                {!validationResult.isValid && (
                  <ul className="mt-2 space-y-1">
                    {validationResult.errors.map((err, idx) => (
                      <li key={idx} className="text-sm text-zinc-300">
                        <span className="text-red-400 font-mono">{err.error}</span>
                        {err.line_start && (
                          <span className="text-zinc-500 ml-2">
                            (Line {err.line_start}{err.column_start ? `:${err.column_start}` : ''})
                          </span>
                        )}
                        <span className="text-zinc-400 ml-2">{err.message}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <button
              onClick={() => setValidationResult(null)}
              className="text-zinc-400 hover:text-zinc-200 transition-colors"
              aria-label="Dismiss"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}

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
            allScreens={playground.screens.map(s => ({ id: s.id, title: s.title || 'Untitled' }))}
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

      {/* Save Flow Modal (Create mode only) */}
      <SaveFlowModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        initialName={playground.flowName}
        onSave={handleSaveModalSubmit}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg z-50 ${
            toast.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/20 border border-red-500/30 text-red-400'
          }`}
          role="alert"
        >
          <span className="material-symbols-outlined text-xl">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 hover:opacity-70 transition-opacity"
            aria-label="Dismiss"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
