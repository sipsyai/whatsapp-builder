import React, { useState, useEffect, useCallback } from 'react';
import { getActiveDataSources } from '../../../../data-sources/api';
import type { DataSource } from '../../../../data-sources/api';
import type { ComponentDataSourceConfig } from '../../../../flows/api';

interface DataSourceSelectorProps {
  value?: ComponentDataSourceConfig;
  onChange: (config: ComponentDataSourceConfig | undefined) => void;
  componentName: string;
  availableFields?: string[]; // Diger form field'lari (dependsOn icin)
}

export const DataSourceSelector: React.FC<DataSourceSelectorProps> = ({
  value,
  onChange,
  componentName,
  availableFields = [],
}) => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(!!value);

  // Form state
  const [dataSourceId, setDataSourceId] = useState(value?.dataSourceId || '');
  const [endpoint, setEndpoint] = useState(value?.endpoint || '');
  const [dataKey, setDataKey] = useState(value?.dataKey || 'data');
  const [idField, setIdField] = useState(value?.transformTo?.idField || 'id');
  const [titleField, setTitleField] = useState(value?.transformTo?.titleField || 'name');
  const [descriptionField, setDescriptionField] = useState(value?.transformTo?.descriptionField || '');
  const [dependsOn, setDependsOn] = useState(value?.dependsOn || '');
  const [filterParam, setFilterParam] = useState(value?.filterParam || '');

  useEffect(() => {
    const loadDataSources = async () => {
      setLoading(true);
      try {
        const sources = await getActiveDataSources();
        setDataSources(sources);
      } catch (error) {
        console.error('Failed to load data sources:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDataSources();
  }, []);

  // Memoize onChange to prevent infinite loops
  const handleConfigChange = useCallback(() => {
    if (!enabled) {
      onChange(undefined);
      return;
    }

    if (dataSourceId && endpoint && dataKey && idField && titleField) {
      const config: ComponentDataSourceConfig = {
        componentName,
        dataSourceId,
        endpoint,
        dataKey,
        transformTo: {
          idField,
          titleField,
          descriptionField: descriptionField || undefined,
        },
        dependsOn: dependsOn || undefined,
        filterParam: filterParam || undefined,
      };
      onChange(config);
    }
  }, [enabled, dataSourceId, endpoint, dataKey, idField, titleField, descriptionField, dependsOn, filterParam, componentName, onChange]);

  // Config degistiginde parent'a bildir
  useEffect(() => {
    handleConfigChange();
  }, [handleConfigChange]);

  return (
    <div className="space-y-3 p-3 bg-blue-900/20 rounded-lg border border-blue-800">
      {/* Toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="w-4 h-4 rounded"
        />
        <span className="text-sm font-medium text-white">Fill from Data Source</span>
      </label>

      {enabled && (
        <div className="space-y-3 pl-6">
          {/* Data Source Secimi */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Data Source</label>
            <select
              value={dataSourceId}
              onChange={(e) => setDataSourceId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
              disabled={loading}
            >
              <option value="">Select a Data Source</option>
              {dataSources.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.name} ({ds.type})
                </option>
              ))}
            </select>
          </div>

          {/* Endpoint */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Endpoint</label>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="/api/brands"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
            />
          </div>

          {/* Data Key */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Data Key (path to array)</label>
            <input
              type="text"
              value={dataKey}
              onChange={(e) => setDataKey(e.target.value)}
              placeholder="data"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">e.g., "data" or "data.items"</p>
          </div>

          {/* Transform Fields */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">ID Field</label>
              <input
                type="text"
                value={idField}
                onChange={(e) => setIdField(e.target.value)}
                placeholder="id"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Title Field</label>
              <input
                type="text"
                value={titleField}
                onChange={(e) => setTitleField(e.target.value)}
                placeholder="name"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
              />
            </div>
          </div>

          {/* Description Field (Optional) */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Description Field (optional)</label>
            <input
              type="text"
              value={descriptionField}
              onChange={(e) => setDescriptionField(e.target.value)}
              placeholder="description"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
            />
          </div>

          {/* Cascading (Depends On) */}
          {availableFields.length > 0 && (
            <div className="pt-2 border-t border-gray-700">
              <label className="block text-xs text-gray-400 mb-1">Depends On (for cascading)</label>
              <select
                value={dependsOn}
                onChange={(e) => setDependsOn(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
              >
                <option value="">None</option>
                {availableFields.map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>

              {dependsOn && (
                <div className="mt-2">
                  <label className="block text-xs text-gray-400 mb-1">Filter Parameter</label>
                  <input
                    type="text"
                    value={filterParam}
                    onChange={(e) => setFilterParam(e.target.value)}
                    placeholder="filters[brand][id][$eq]"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataSourceSelector;
