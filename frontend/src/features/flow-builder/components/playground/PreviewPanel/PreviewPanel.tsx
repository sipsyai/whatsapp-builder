import { useState, useMemo, useCallback } from 'react';
import type { BuilderScreen } from '../../../types/builder.types';
import type { PreviewSettings as PreviewSettingsType } from '../types/playground.types';
import { PhoneFrame } from '../../preview/PhoneFrame';
import { ScreenPreview } from '../../preview/ScreenPreview';
import { PreviewSettings } from './PreviewSettings';
import { CopyJsonButton } from './CopyJsonButton';

/**
 * Props interface for PreviewPanel
 */
export interface PreviewPanelProps {
  /**
   * List of screens in the flow
   */
  screens: BuilderScreen[];

  /**
   * ID of the currently displayed screen
   */
  currentScreenId: string | null;

  /**
   * Preview settings (platform, theme, interactive mode)
   */
  previewSettings: PreviewSettingsType;

  /**
   * Callback when navigating to a different screen
   */
  onNavigate?: (screenId: string) => void;

  /**
   * Callback when preview settings change
   */
  onSettingsChange?: (settings: Partial<PreviewSettingsType>) => void;

  /**
   * Callback when copy JSON button is clicked
   */
  onCopyJson?: () => void;

  /**
   * Optional className for the container
   */
  className?: string;
}

/**
 * PreviewPanel - WhatsApp Flow preview panel with phone frame and navigation
 *
 * Features:
 * - Phone frame with platform-specific styling (iOS/Android)
 * - Screen preview with interactive components
 * - Screen navigation controls (Previous/Next)
 * - Copy JSON and settings buttons
 * - Empty state handling
 *
 * Layout:
 * ```
 * +------------------------------------------+
 * | Preview  [Copy JSON] [Settings ⚙]        |
 * +------------------------------------------+
 * |                                          |
 * |     +----------------------------+       |
 * |     |                            |       |
 * |     |    PhoneFrame              |       |
 * |     |                            |       |
 * |     |    [Screen Preview]        |       |
 * |     |                            |       |
 * |     +----------------------------+       |
 * |                                          |
 * |     [← Prev]  Screen 1/3  [Next →]       |
 * |                                          |
 * +------------------------------------------+
 * ```
 */
export function PreviewPanel({
  screens,
  currentScreenId,
  previewSettings,
  onNavigate,
  onSettingsChange,
  onCopyJson,
  className = '',
}: PreviewPanelProps) {
  // Form data state for preview interactivity
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Find current screen and its index
  const currentScreenIndex = useMemo(() => {
    if (!currentScreenId) return -1;
    return screens.findIndex((s) => s.id === currentScreenId);
  }, [screens, currentScreenId]);

  const currentScreen = useMemo(() => {
    if (currentScreenIndex === -1) return null;
    return screens[currentScreenIndex];
  }, [screens, currentScreenIndex]);

  // Navigation state
  const canGoPrevious = currentScreenIndex > 0;
  const canGoNext = currentScreenIndex < screens.length - 1;

  // Handle form data changes
  const handleFormDataChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Handle navigation to previous screen
  const handlePrevious = useCallback(() => {
    if (canGoPrevious && onNavigate) {
      const previousScreen = screens[currentScreenIndex - 1];
      onNavigate(previousScreen.id);
    }
  }, [canGoPrevious, onNavigate, screens, currentScreenIndex]);

  // Handle navigation to next screen
  const handleNext = useCallback(() => {
    if (canGoNext && onNavigate) {
      const nextScreen = screens[currentScreenIndex + 1];
      onNavigate(nextScreen.id);
    }
  }, [canGoNext, onNavigate, screens, currentScreenIndex]);

  // Handle screen navigation from interactive preview
  const handleNavigateFromPreview = useCallback(
    (screenId: string, payload?: any) => {
      // Merge payload into form data if provided
      if (payload) {
        setFormData((prev) => ({ ...prev, ...payload }));
      }

      // Navigate to screen
      if (onNavigate) {
        onNavigate(screenId);
      }
    },
    [onNavigate]
  );

  // Handle flow completion
  const handleComplete = useCallback((payload: any) => {
    console.log('Flow completed with payload:', payload);
    // TODO: Show completion dialog or callback
  }, []);

  // Empty state - no screens
  if (screens.length === 0) {
    return (
      <div className={`h-full flex flex-col bg-zinc-900 ${className}`}>
        {/* Header */}
        <div className="flex-shrink-0 border-b border-zinc-700 bg-[#112217]">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Preview</h2>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 px-6">
            <div className="text-6xl">📱</div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-white">No screens to preview</h3>
              <p className="text-sm text-zinc-400 max-w-sm">
                Add a screen to your flow to see the preview here. The preview will show how your
                flow looks on a mobile device.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state - screen not found
  if (!currentScreen) {
    return (
      <div className={`h-full flex flex-col bg-zinc-900 ${className}`}>
        {/* Header */}
        <div className="flex-shrink-0 border-b border-zinc-700 bg-[#112217]">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Preview</h2>

            <div className="flex items-center gap-2">
              {/* Preview Settings */}
              {onSettingsChange && (
                <PreviewSettings
                  settings={previewSettings}
                  onSettingsChange={onSettingsChange}
                />
              )}

              {/* Copy JSON Button */}
              <CopyJsonButton
                screens={screens}
                onCopy={onCopyJson}
              />
            </div>
          </div>
        </div>

        {/* Error State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 px-6">
            <div className="text-6xl">⚠️</div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-white">Screen not found</h3>
              <p className="text-sm text-zinc-400 max-w-sm">
                The selected screen could not be found. Please select a different screen from the
                list.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col bg-zinc-900 ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 border-b border-zinc-700 bg-[#112217]">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Preview</h2>

          <div className="flex items-center gap-2">
            {/* Preview Settings */}
            {onSettingsChange && (
              <PreviewSettings
                settings={previewSettings}
                onSettingsChange={onSettingsChange}
              />
            )}

            {/* Copy JSON Button */}
            <CopyJsonButton
              screens={screens}
              onCopy={onCopyJson}
            />
          </div>
        </div>
      </div>

      {/* Phone Frame Area */}
      <div className="flex-1 overflow-auto">
        <PhoneFrame>
          <ScreenPreview
            screen={currentScreen}
            formData={formData}
            onFormDataChange={handleFormDataChange}
            onNavigate={handleNavigateFromPreview}
            onComplete={handleComplete}
          />
        </PhoneFrame>
      </div>

      {/* Screen Navigation Footer */}
      <div className="flex-shrink-0 border-t border-zinc-700 bg-[#112217]">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            className="
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              text-zinc-300
              hover:bg-zinc-800
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent
              transition-colors
            "
            title="Previous screen"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Previous
          </button>

          {/* Screen Indicator */}
          <div className="text-sm font-medium text-zinc-300">
            Screen {currentScreenIndex + 1} / {screens.length}
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className="
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              text-zinc-300
              hover:bg-zinc-800
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent
              transition-colors
            "
            title="Next screen"
          >
            Next
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
