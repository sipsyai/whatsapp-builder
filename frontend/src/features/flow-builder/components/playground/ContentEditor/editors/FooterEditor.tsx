import React, { useState } from 'react';
import type { ComponentEditorProps } from '../../types/playground.types';
import type { Footer, NavigateAction, CompleteAction, DataExchangeAction } from '../../../../types/flow-json.types';

type FooterActionName = 'navigate' | 'complete' | 'data_exchange';

/**
 * Editor for Footer component
 */
export const FooterEditor: React.FC<ComponentEditorProps> = ({
  component,
  onChange,
  onDelete,
}) => {
  const config = component.config as Footer;
  const [actionType, setActionType] = useState<FooterActionName>(
    (config['on-click-action']?.name as FooterActionName) || 'navigate'
  );

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      config: {
        ...component.config,
        label: e.target.value,
      },
    });
  };

  const handleActionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newActionType = e.target.value as FooterActionName;
    setActionType(newActionType);

    let newAction: NavigateAction | CompleteAction | DataExchangeAction;

    switch (newActionType) {
      case 'navigate':
        newAction = {
          name: 'navigate',
          next: {
            type: 'screen',
            name: '',
          },
        };
        break;
      case 'complete':
        newAction = {
          name: 'complete',
        };
        break;
      case 'data_exchange':
        newAction = {
          name: 'data_exchange',
        };
        break;
      default:
        newAction = {
          name: 'navigate',
          next: {
            type: 'screen',
            name: '',
          },
        };
    }

    const newConfig: Partial<Footer> = {
      ...(component.config as Partial<Footer>),
      'on-click-action': newAction,
    };

    onChange({
      config: newConfig,
    });
  };

  const handleTargetScreenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (config['on-click-action']?.name === 'navigate') {
      onChange({
        config: {
          ...component.config,
          'on-click-action': {
            name: 'navigate',
            next: {
              type: 'screen',
              name: e.target.value,
            },
          },
        },
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Component Type Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">{component.type}</h3>
        <button
          onClick={onDelete}
          className="p-1.5 rounded hover:bg-red-600/20 text-zinc-400 hover:text-red-400
                     transition-colors"
          title="Delete component"
          type="button"
        >
          <span className="material-symbols-outlined text-base">delete</span>
        </button>
      </div>

      {/* Button Label */}
      <div>
        <label className="block text-sm text-zinc-400 mb-1.5">Button Label</label>
        <input
          type="text"
          value={config.label || ''}
          onChange={handleLabelChange}
          placeholder="Next, Submit, Continue..."
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg
                     text-white placeholder-zinc-500 focus:outline-none focus:ring-2
                     focus:ring-primary/50 focus:border-primary"
        />
      </div>

      {/* Action Type */}
      <div>
        <label className="block text-sm text-zinc-400 mb-1.5">Action Type</label>
        <select
          value={actionType}
          onChange={handleActionTypeChange}
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg
                     text-white focus:outline-none focus:ring-2 focus:ring-primary/50
                     focus:border-primary"
        >
          <option value="navigate">Navigate to Screen</option>
          <option value="complete">Complete Flow</option>
          <option value="data_exchange">Data Exchange</option>
        </select>
      </div>

      {/* Target Screen (Navigate only) */}
      {actionType === 'navigate' && (
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Target Screen ID</label>
          <input
            type="text"
            value={
              config['on-click-action']?.name === 'navigate'
                ? config['on-click-action'].next.name
                : ''
            }
            onChange={handleTargetScreenChange}
            placeholder="SCREEN_ID"
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg
                       text-white placeholder-zinc-500 focus:outline-none focus:ring-2
                       focus:ring-primary/50 focus:border-primary"
          />
          <p className="text-xs text-zinc-500 mt-1">
            The screen ID to navigate to when clicked
          </p>
        </div>
      )}

      {/* Action Description */}
      <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-700">
        <p className="text-xs text-zinc-400">
          {actionType === 'navigate' && (
            <>
              <strong>Navigate:</strong> Move to another screen in the flow
            </>
          )}
          {actionType === 'complete' && (
            <>
              <strong>Complete:</strong> End the flow and close
            </>
          )}
          {actionType === 'data_exchange' && (
            <>
              <strong>Data Exchange:</strong> Send data to your endpoint and continue
            </>
          )}
        </p>
      </div>
    </div>
  );
};
