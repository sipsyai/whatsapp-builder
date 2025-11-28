import React from 'react';
import type { ComponentEditorProps } from '../../types/playground.types';
import type { TextHeading, TextSubheading, TextBody, TextCaption } from '../../../../types/flow-json.types';

/**
 * Editor for text components: TextHeading, TextSubheading, TextBody, TextCaption
 */
export const TextHeadingEditor: React.FC<ComponentEditorProps> = ({
  component,
  onChange,
  onDelete,
}) => {
  const config = component.config as TextHeading | TextSubheading | TextBody | TextCaption;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      config: {
        ...component.config,
        text: e.target.value,
      },
    });
  };

  const handleFontWeightChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      config: {
        ...component.config,
        'font-weight': e.target.value as 'bold' | 'italic' | 'bold_italic' | 'normal',
      },
    });
  };

  const isTextBody = component.type === 'TextBody';
  const isTextCaption = component.type === 'TextCaption';

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

      {/* Text Field */}
      <div>
        <label className="block text-sm text-zinc-400 mb-1.5">Text</label>
        <textarea
          value={config.text || ''}
          onChange={handleTextChange}
          placeholder="Enter text..."
          rows={3}
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg
                     text-white placeholder-zinc-500 focus:outline-none focus:ring-2
                     focus:ring-primary/50 focus:border-primary resize-none"
        />
      </div>

      {/* Font Weight (TextBody and TextCaption only) */}
      {(isTextBody || isTextCaption) && (
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Font Weight</label>
          <select
            value={(config as TextBody | TextCaption)['font-weight'] || 'normal'}
            onChange={handleFontWeightChange}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg
                       text-white focus:outline-none focus:ring-2 focus:ring-primary/50
                       focus:border-primary"
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
            <option value="italic">Italic</option>
            <option value="bold_italic">Bold Italic</option>
          </select>
        </div>
      )}
    </div>
  );
};
