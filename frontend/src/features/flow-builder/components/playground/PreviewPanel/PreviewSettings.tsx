import React, { useState, useRef, useEffect } from 'react';
import type { PreviewSettings as PreviewSettingsType } from '../types/playground.types';

interface PreviewSettingsProps {
  settings: PreviewSettingsType;
  onSettingsChange: (settings: Partial<PreviewSettingsType>) => void;
}

export const PreviewSettings: React.FC<PreviewSettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handlePlatformChange = (platform: 'android' | 'ios') => {
    onSettingsChange({ platform });
  };

  const handleThemeChange = (theme: 'light' | 'dark') => {
    onSettingsChange({ theme });
  };

  const handleInteractiveChange = (interactive: boolean) => {
    onSettingsChange({ interactive });
  };

  return (
    <div className="relative">
      {/* Settings Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-center w-10 h-10 rounded-lg
          transition-all
          ${
            isOpen
              ? 'bg-primary text-white'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
          }
        `}
        type="button"
        aria-label="Preview settings"
        title="Preview settings"
      >
        <span className="material-symbols-outlined text-xl">settings</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-64 z-50
                     bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg
                     overflow-hidden"
        >
          {/* Platform Section */}
          <div className="p-4 border-b border-zinc-700">
            <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
              Platform
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePlatformChange('ios')}
                className={`
                  flex-1 flex items-center justify-center gap-2
                  px-3 py-2 rounded-lg text-sm font-medium
                  transition-all
                  ${
                    settings.platform === 'ios'
                      ? 'bg-primary text-white'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }
                `}
                type="button"
              >
                <span className="material-symbols-outlined text-base">phone_iphone</span>
                iOS
              </button>
              <button
                onClick={() => handlePlatformChange('android')}
                className={`
                  flex-1 flex items-center justify-center gap-2
                  px-3 py-2 rounded-lg text-sm font-medium
                  transition-all
                  ${
                    settings.platform === 'android'
                      ? 'bg-primary text-white'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }
                `}
                type="button"
              >
                <span className="material-symbols-outlined text-base">phone_android</span>
                Android
              </button>
            </div>
          </div>

          {/* Theme Section */}
          <div className="p-4 border-b border-zinc-700">
            <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
              Theme
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleThemeChange('light')}
                className={`
                  flex-1 flex items-center justify-center gap-2
                  px-3 py-2 rounded-lg text-sm font-medium
                  transition-all
                  ${
                    settings.theme === 'light'
                      ? 'bg-primary text-white'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }
                `}
                type="button"
              >
                <span className="material-symbols-outlined text-base">light_mode</span>
                Light
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`
                  flex-1 flex items-center justify-center gap-2
                  px-3 py-2 rounded-lg text-sm font-medium
                  transition-all
                  ${
                    settings.theme === 'dark'
                      ? 'bg-primary text-white'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }
                `}
                type="button"
              >
                <span className="material-symbols-outlined text-base">dark_mode</span>
                Dark
              </button>
            </div>
          </div>

          {/* Interactive Mode Section */}
          <div className="p-4">
            <label
              className="flex items-center gap-3 cursor-pointer group"
              htmlFor="interactive-mode"
            >
              <div className="relative">
                <input
                  id="interactive-mode"
                  type="checkbox"
                  checked={settings.interactive}
                  onChange={(e) => handleInteractiveChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div
                  className="w-5 h-5 rounded border-2 flex items-center justify-center
                             transition-all
                             border-zinc-600 bg-zinc-700
                             peer-checked:border-primary peer-checked:bg-primary
                             group-hover:border-zinc-500 peer-checked:group-hover:border-primary"
                >
                  {settings.interactive && (
                    <span className="material-symbols-outlined text-white text-sm">
                      check
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                  Interactive mode
                </div>
                <div className="text-xs text-zinc-500">
                  Enable clickable components
                </div>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
