import { useState, useCallback, useMemo } from 'react';
import type { BuilderScreen } from '../../types';
import { PhoneFrame } from './PhoneFrame';
import { ScreenPreview } from './ScreenPreview';

/**
 * Props interface for FlowPreview
 */
export interface FlowPreviewProps {
  screens: BuilderScreen[];
  currentScreenId: string;
  onNavigate: (screenId: string) => void;
  onComplete: (payload: any) => void;
}

/**
 * FlowPreview - Interactive preview of WhatsApp Flow in iPhone frame
 *
 * Features:
 * - iPhone mock frame with notch and status bar
 * - Screen navigation between Flow screens
 * - Form state management across screens
 * - WhatsApp-themed UI
 * - Dark mode support
 */
export function FlowPreview({
  screens,
  currentScreenId,
  onNavigate,
  onComplete,
}: FlowPreviewProps) {
  // Form data state - persists across screens
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Navigation history for back button
  const [navigationHistory, setNavigationHistory] = useState<string[]>([currentScreenId]);

  // Find current screen
  const currentScreen = useMemo(
    () => screens.find((s) => s.id === currentScreenId),
    [screens, currentScreenId]
  );

  // Handle form field changes
  const handleFormDataChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Handle navigation to another screen
  const handleNavigate = useCallback(
    (screenId: string, payload?: any) => {
      // Update navigation history
      setNavigationHistory((prev) => [...prev, screenId]);

      // Merge payload into form data if provided
      if (payload) {
        setFormData((prev) => ({ ...prev, ...payload }));
      }

      // Navigate to screen
      onNavigate(screenId);
    },
    [onNavigate]
  );

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (navigationHistory.length <= 1) return;

    // Remove current screen from history
    const newHistory = navigationHistory.slice(0, -1);
    setNavigationHistory(newHistory);

    // Navigate to previous screen
    const previousScreenId = newHistory[newHistory.length - 1];
    onNavigate(previousScreenId);
  }, [navigationHistory, onNavigate]);

  // Handle flow completion
  const handleComplete = useCallback(
    (payload: any) => {
      const finalPayload = {
        ...formData,
        ...payload,
      };
      onComplete(finalPayload);
    },
    [formData, onComplete]
  );

  // Reset preview to first screen
  const handleReset = useCallback(() => {
    setFormData({});
    setNavigationHistory([screens[0]?.id || currentScreenId]);
    onNavigate(screens[0]?.id || currentScreenId);
  }, [screens, currentScreenId, onNavigate]);

  if (!currentScreen) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-100 dark:bg-zinc-900">
        <div className="text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            <p className="font-medium">Screen not found</p>
            <p className="text-sm">The selected screen does not exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-100 dark:bg-zinc-900">
      {/* Preview Controls */}
      <div className="flex-shrink-0 bg-white dark:bg-[#112217] border-b border-zinc-200 dark:border-white/10">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left: Screen Info */}
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-zinc-500 dark:text-zinc-400">
              phonelink
            </span>
            <div>
              <div className="text-sm font-medium text-zinc-900 dark:text-white">
                Flow Preview
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {currentScreen.title || currentScreen.id}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Navigation History */}
            <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="material-symbols-outlined text-sm">layers</span>
              <span>
                {navigationHistory.length} screen{navigationHistory.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-2" />

            {/* Back Button */}
            <button
              onClick={handleBack}
              disabled={navigationHistory.length <= 1}
              className="
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                text-zinc-700 dark:text-zinc-300
                hover:bg-zinc-100 dark:hover:bg-white/5
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
              title="Go back to previous screen"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back
            </button>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                text-zinc-700 dark:text-zinc-300
                hover:bg-zinc-100 dark:hover:bg-white/5
                transition-colors
              "
              title="Reset preview to first screen"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto">
        <PhoneFrame>
          <ScreenPreview
            screen={currentScreen}
            formData={formData}
            onFormDataChange={handleFormDataChange}
            onNavigate={handleNavigate}
            onComplete={handleComplete}
          />
        </PhoneFrame>
      </div>

      {/* Debug Panel (optional, for development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="flex-shrink-0 border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#0d1912]">
          <details className="group">
            <summary className="px-6 py-2 cursor-pointer text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
              Debug Info
            </summary>
            <div className="px-6 pb-3 space-y-2">
              <div>
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Current Screen:
                </div>
                <div className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                  {currentScreen.id}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Navigation History:
                </div>
                <div className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                  {navigationHistory.join(' → ')}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Form Data:
                </div>
                <pre className="text-xs font-mono text-zinc-600 dark:text-zinc-400 bg-white dark:bg-[#112217] p-2 rounded border border-zinc-200 dark:border-zinc-700 overflow-auto max-h-40">
                  {JSON.stringify(formData, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
