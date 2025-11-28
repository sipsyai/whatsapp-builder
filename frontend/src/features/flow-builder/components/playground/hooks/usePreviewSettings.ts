import { useState, useEffect, useCallback } from 'react';
import type { PreviewSettings } from '../types/playground.types';
import { DEFAULT_PREVIEW_SETTINGS } from '../types/playground.types';

/**
 * Options for usePreviewSettings hook
 */
interface UsePreviewSettingsOptions {
  /**
   * Key for localStorage persistence
   * @default 'whatsapp-playground-preview-settings'
   */
  persistKey?: string;
}

/**
 * Return type for usePreviewSettings hook
 */
interface UsePreviewSettingsReturn {
  /**
   * Current preview settings
   */
  settings: PreviewSettings;

  /**
   * Set the platform (android or ios)
   */
  setPlatform: (platform: 'android' | 'ios') => void;

  /**
   * Set the theme (light or dark)
   */
  setTheme: (theme: 'light' | 'dark') => void;

  /**
   * Toggle interactive mode on/off
   */
  toggleInteractive: () => void;

  /**
   * Reset settings to default values
   */
  resetSettings: () => void;
}

/**
 * Hook for managing WhatsApp Flows Playground preview settings
 *
 * Features:
 * - LocalStorage persistence
 * - Platform selection (Android/iOS)
 * - Theme selection (Light/Dark)
 * - Interactive mode toggle
 * - Reset to defaults
 *
 * @param options - Hook options
 * @returns Preview settings and actions
 *
 * @example
 * ```tsx
 * const { settings, setPlatform, setTheme, toggleInteractive, resetSettings } = usePreviewSettings();
 *
 * // Change platform
 * setPlatform('android');
 *
 * // Change theme
 * setTheme('dark');
 *
 * // Toggle interactive mode
 * toggleInteractive();
 *
 * // Reset to defaults
 * resetSettings();
 * ```
 */
export function usePreviewSettings(
  options?: UsePreviewSettingsOptions
): UsePreviewSettingsReturn {
  const persistKey = options?.persistKey || 'whatsapp-playground-preview-settings';

  // Load initial settings from localStorage or use defaults
  const loadSettings = useCallback((): PreviewSettings => {
    try {
      const stored = localStorage.getItem(persistKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate the stored data has the correct shape
        if (
          parsed &&
          typeof parsed === 'object' &&
          ('platform' in parsed || 'theme' in parsed || 'interactive' in parsed)
        ) {
          return {
            ...DEFAULT_PREVIEW_SETTINGS,
            ...parsed,
          };
        }
      }
    } catch (error) {
      console.warn('Failed to load preview settings from localStorage:', error);
    }
    return DEFAULT_PREVIEW_SETTINGS;
  }, [persistKey]);

  const [settings, setSettings] = useState<PreviewSettings>(loadSettings);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(persistKey, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save preview settings to localStorage:', error);
    }
  }, [settings, persistKey]);

  /**
   * Set the platform
   */
  const setPlatform = useCallback((platform: 'android' | 'ios') => {
    setSettings((prev) => ({
      ...prev,
      platform,
    }));
  }, []);

  /**
   * Set the theme
   */
  const setTheme = useCallback((theme: 'light' | 'dark') => {
    setSettings((prev) => ({
      ...prev,
      theme,
    }));
  }, []);

  /**
   * Toggle interactive mode
   */
  const toggleInteractive = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      interactive: !prev.interactive,
    }));
  }, []);

  /**
   * Reset settings to default values
   */
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_PREVIEW_SETTINGS);
  }, []);

  return {
    settings,
    setPlatform,
    setTheme,
    toggleInteractive,
    resetSettings,
  };
}
