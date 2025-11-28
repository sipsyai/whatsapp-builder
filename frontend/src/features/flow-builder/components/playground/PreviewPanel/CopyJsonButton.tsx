import React, { useState, useCallback } from 'react';
import type { BuilderScreen } from '../../../types/builder.types';
import type { FlowJSONVersion, FlowJSON, FlowScreen, Component } from '../../../types/flow-json.types';

interface CopyJsonButtonProps {
  screens: BuilderScreen[];
  flowVersion?: FlowJSONVersion;
  onCopy?: () => void;
}

export const CopyJsonButton: React.FC<CopyJsonButtonProps> = ({
  screens,
  flowVersion = '7.2',
  onCopy,
}) => {
  const [copied, setCopied] = useState(false);

  const generateFlowJSON = useCallback((): FlowJSON => {
    const flowScreens: FlowScreen[] = screens.map((screen) => ({
      id: screen.id,
      title: screen.title,
      terminal: screen.terminal,
      data: screen.data,
      layout: {
        type: 'SingleColumnLayout' as const,
        children: screen.components.map((component) => ({
          type: component.type,
          ...component.config,
        })) as Component[],
      },
      refresh_on_back: screen.refresh_on_back,
    }));

    return {
      version: flowVersion,
      screens: flowScreens,
    };
  }, [screens, flowVersion]);

  const handleCopy = useCallback(async () => {
    try {
      const flowJSON = generateFlowJSON();
      const jsonString = JSON.stringify(flowJSON, null, 2);

      await navigator.clipboard.writeText(jsonString);

      setCopied(true);
      onCopy?.();

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy JSON:', error);
    }
  }, [generateFlowJSON, onCopy]);

  return (
    <button
      onClick={handleCopy}
      className={`
        flex items-center justify-center w-10 h-10 rounded-lg
        transition-all
        ${
          copied
            ? 'bg-green-600 text-white'
            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
        }
      `}
      type="button"
      aria-label={copied ? 'Copied to clipboard' : 'Copy Flow JSON'}
      title={copied ? 'Copied!' : 'Copy Flow JSON'}
    >
      <span className="material-symbols-outlined text-xl">
        {copied ? 'check' : 'content_copy'}
      </span>
    </button>
  );
};
