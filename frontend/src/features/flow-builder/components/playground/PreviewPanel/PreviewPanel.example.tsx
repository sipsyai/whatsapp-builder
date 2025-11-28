/**
 * Example usage of PreviewSettings and CopyJsonButton components
 * 
 * This example demonstrates how to integrate both components
 * in a typical Preview Panel toolbar.
 */

import React, { useState } from 'react';
import { PreviewSettings } from './PreviewSettings';
import { CopyJsonButton } from './CopyJsonButton';
import type { PreviewSettings as PreviewSettingsType } from '../../types/playground.types';
import type { BuilderScreen } from '../../../types/builder.types';

// Example usage in a Preview Panel
export const PreviewPanelExample: React.FC = () => {
  const [previewSettings, setPreviewSettings] = useState<PreviewSettingsType>({
    platform: 'android',
    theme: 'light',
    interactive: true,
  });

  // Example screens data
  const exampleScreens: BuilderScreen[] = [
    {
      id: 'WELCOME',
      title: 'Welcome',
      terminal: false,
      components: [
        {
          id: 'heading-1',
          type: 'TextHeading',
          config: {
            type: 'TextHeading',
            text: 'Welcome to our Flow',
          },
          validation: {
            isValid: true,
            errors: [],
            warnings: [],
          },
        },
      ],
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const handleSettingsChange = (updates: Partial<PreviewSettingsType>) => {
    setPreviewSettings((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const handleCopy = () => {
    console.log('Flow JSON copied to clipboard!');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-zinc-800">
        <div className="text-sm font-medium text-zinc-300">Preview</div>
        
        <div className="flex items-center gap-2">
          {/* Preview Settings */}
          <PreviewSettings
            settings={previewSettings}
            onSettingsChange={handleSettingsChange}
          />
          
          {/* Copy JSON Button */}
          <CopyJsonButton
            screens={exampleScreens}
            flowVersion="7.2"
            onCopy={handleCopy}
          />
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-zinc-400 mb-2">
            Platform: {previewSettings.platform}
          </div>
          <div className="text-zinc-400 mb-2">
            Theme: {previewSettings.theme}
          </div>
          <div className="text-zinc-400">
            Interactive: {previewSettings.interactive ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      </div>
    </div>
  );
};
