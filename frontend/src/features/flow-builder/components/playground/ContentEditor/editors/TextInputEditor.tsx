import React from 'react';
import type { ComponentEditorProps } from '../../types/playground.types';
import type { TextInput, TextArea } from '../../../../types/flow-json.types';

/**
 * Editor for text input components: TextInput, TextArea
 */
export const TextInputEditor: React.FC<ComponentEditorProps> = ({
  component,
  onChange,
  onDelete,
}) => {
  const config = component.config as TextInput | TextArea;
  const isTextInput = component.type === 'TextInput';

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const label = e.target.value;
    // Auto-generate name from label (lowercase, replace spaces with underscores)
    const name = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    onChange({
      config: {
        ...component.config,
        label,
        name: name || config.name,
      },
    });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      config: {
        ...component.config,
        name: e.target.value,
      },
    });
  };

  const handleRequiredChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      config: {
        ...component.config,
        required: e.target.checked as boolean,
      },
    });
  };

  const handleInputTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      config: {
        ...component.config,
        'input-type': e.target.value as TextInput['input-type'],
      },
    });
  };

  const handleHelperTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      config: {
        ...component.config,
        'helper-text': e.target.value,
      },
    });
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

      {/* Label Field */}
      <div>
        <label className="block text-sm text-zinc-400 mb-1.5">Label</label>
        <input
          type="text"
          value={config.label || ''}
          onChange={handleLabelChange}
          placeholder="Enter label..."
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg
                     text-white placeholder-zinc-500 focus:outline-none focus:ring-2
                     focus:ring-primary/50 focus:border-primary"
        />
      </div>

      {/* Name Field */}
      <div>
        <label className="block text-sm text-zinc-400 mb-1.5">Name</label>
        <input
          type="text"
          value={config.name || ''}
          onChange={handleNameChange}
          placeholder="field_name"
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg
                     text-white placeholder-zinc-500 focus:outline-none focus:ring-2
                     focus:ring-primary/50 focus:border-primary"
        />
        <p className="text-xs text-zinc-500 mt-1">
          Auto-generated from label or enter manually
        </p>
      </div>

      {/* Required Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id={`required-${component.id}`}
          checked={Boolean(config.required) || false}
          onChange={handleRequiredChange}
          className="w-4 h-4 bg-zinc-900 border-zinc-700 rounded text-primary
                     focus:ring-2 focus:ring-primary/50"
        />
        <label
          htmlFor={`required-${component.id}`}
          className="ml-2 text-sm text-zinc-400 cursor-pointer"
        >
          Required field
        </label>
      </div>

      {/* Input Type (TextInput only) */}
      {isTextInput && (
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Input Type</label>
          <select
            value={(config as TextInput)['input-type'] || 'text'}
            onChange={handleInputTypeChange}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg
                       text-white focus:outline-none focus:ring-2 focus:ring-primary/50
                       focus:border-primary"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="password">Password</option>
            <option value="passcode">Passcode</option>
          </select>
        </div>
      )}

      {/* Helper Text */}
      <div>
        <label className="block text-sm text-zinc-400 mb-1.5">
          Helper Text (Optional)
        </label>
        <input
          type="text"
          value={config['helper-text'] || ''}
          onChange={handleHelperTextChange}
          placeholder="Additional help text..."
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg
                     text-white placeholder-zinc-500 focus:outline-none focus:ring-2
                     focus:ring-primary/50 focus:border-primary"
        />
      </div>
    </div>
  );
};
