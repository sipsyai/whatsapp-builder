import React, { useState, useEffect } from 'react';
import type { ComponentEditorProps } from '../../types/playground.types';
import type { Dropdown, DataSourceItem } from '../../../../types/flow-json.types';
import type { ComponentDataSourceConfig } from '../../../../../flows/api';
import DataSourceSelector from '../DataSourceSelector';

interface DropdownEditorProps extends ComponentEditorProps {
  availableFields?: string[];
}

/**
 * Editor for Dropdown component
 */
export const DropdownEditor: React.FC<DropdownEditorProps> = ({
  component,
  onChange,
  onDelete,
  availableFields = [],
}) => {
  const config = component.config as Dropdown & { __dataSourceConfig?: ComponentDataSourceConfig };
  const [newOptionTitle, setNewOptionTitle] = useState('');
  const [useDataSource, setUseDataSource] = useState<boolean>(
    !!config.__dataSourceConfig
  );

  // Sync useDataSource state with __dataSourceConfig
  useEffect(() => {
    setUseDataSource(!!config.__dataSourceConfig);
  }, [config.__dataSourceConfig]);

  const dataSource = Array.isArray(config['data-source']) ? config['data-source'] : [];

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      config: {
        ...component.config,
        label: e.target.value,
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

  const handleAddOption = () => {
    if (!newOptionTitle.trim()) return;

    const newOption: DataSourceItem = {
      id: `option_${Date.now()}`,
      title: newOptionTitle,
    };

    // Read current data-source directly from config to avoid stale closure
    const currentDataSource = Array.isArray(config['data-source']) ? config['data-source'] : [];

    onChange({
      config: {
        ...component.config,
        'data-source': [...currentDataSource, newOption],
      },
    });

    setNewOptionTitle('');
  };

  const handleUpdateOption = (index: number, title: string) => {
    // Read current data-source directly from config to avoid stale closure
    const currentDataSource = Array.isArray(config['data-source']) ? config['data-source'] : [];
    const updatedDataSource = [...currentDataSource];
    updatedDataSource[index] = {
      ...updatedDataSource[index],
      title,
    };

    onChange({
      config: {
        ...component.config,
        'data-source': updatedDataSource,
      },
    });
  };

  const handleRemoveOption = (index: number) => {
    // Read current data-source directly from config to avoid stale closure
    const currentDataSource = Array.isArray(config['data-source']) ? config['data-source'] : [];
    const updatedDataSource = currentDataSource.filter((_, i) => i !== index);

    onChange({
      config: {
        ...component.config,
        'data-source': updatedDataSource,
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

      {/* Data Source Toggle */}
      <DataSourceSelector
        value={config.__dataSourceConfig}
        onChange={(dsConfig) => {
          if (dsConfig) {
            // DataSource aktif - data-source'u dynamic binding yap
            onChange({
              config: {
                ...component.config,
                'data-source': `\${data.${dsConfig.componentName || component.id}}`,
                __dataSourceConfig: dsConfig,
              } as unknown as Partial<Dropdown>,
            });
          } else {
            // DataSource deaktif - manual options'a don
            const { __dataSourceConfig, ...rest } = config;
            onChange({
              config: {
                ...rest,
                'data-source': [], // Bos array ile basla
              },
            });
          }
        }}
        componentName={component.id || 'dropdown_field'}
        availableFields={availableFields}
      />

      {/* Manual Options Editor - sadece DataSource kullanilmiyorsa goster */}
      {!useDataSource && (
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Options</label>
          <div className="space-y-2">
            {/* Existing Options */}
            {dataSource.map((option, index) => (
              <div key={option.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={option.title}
                  onChange={(e) => handleUpdateOption(index, e.target.value)}
                  placeholder="Option title"
                  className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg
                             text-white placeholder-zinc-500 focus:outline-none focus:ring-2
                             focus:ring-primary/50 focus:border-primary"
                />
                <button
                  onClick={() => handleRemoveOption(index)}
                  className="p-2 rounded hover:bg-red-600/20 text-zinc-400 hover:text-red-400
                             transition-colors flex-shrink-0"
                  title="Remove option"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            ))}

            {/* Add New Option */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newOptionTitle}
                onChange={(e) => setNewOptionTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddOption();
                  }
                }}
                placeholder="New option title"
                className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg
                           text-white placeholder-zinc-500 focus:outline-none focus:ring-2
                           focus:ring-primary/50 focus:border-primary"
              />
              <button
                onClick={handleAddOption}
                className="px-3 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg
                           transition-colors flex-shrink-0"
                type="button"
              >
                <span className="material-symbols-outlined text-base">add</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-zinc-500 mt-2">
            {dataSource.length} {dataSource.length === 1 ? 'option' : 'options'}
          </p>
        </div>
      )}
    </div>
  );
};
