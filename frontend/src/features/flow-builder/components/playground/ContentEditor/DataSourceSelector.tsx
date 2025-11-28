import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { connectionApi } from '../../../../data-sources/api';
import type { GroupedConnections } from '../../../../data-sources/types';
import type { ComponentDataSourceConfig } from '../../../../flows/api';

interface DataSourceSelectorProps {
  value?: ComponentDataSourceConfig;
  onChange: (config: ComponentDataSourceConfig | undefined) => void;
  componentName: string;
  availableFields?: string[]; // Other form fields (for dependsOn)
}

export const DataSourceSelector: React.FC<DataSourceSelectorProps> = ({
  value,
  onChange,
  componentName,
  availableFields = [],
}) => {
  const [groupedConnections, setGroupedConnections] = useState<GroupedConnections[]>([]);
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(!!value);
  const [selectedConnectionId, setSelectedConnectionId] = useState(value?.connectionId || '');
  const [dependsOnField, setDependsOnField] = useState(value?.dependsOn || '');

  // Load grouped connections
  useEffect(() => {
    const loadConnections = async () => {
      setLoading(true);
      try {
        const grouped = await connectionApi.getAllActiveGrouped();
        setGroupedConnections(grouped);
      } catch (error) {
        console.error('Failed to load connections:', error);
      } finally {
        setLoading(false);
      }
    };
    loadConnections();
  }, []);

  // Find selected connection and its data source
  const selectedConnection = useMemo(() => {
    for (const group of groupedConnections) {
      const found = group.connections.find((c) => c.id === selectedConnectionId);
      if (found) {
        return { connection: found, dataSource: group.dataSource };
      }
    }
    return null;
  }, [groupedConnections, selectedConnectionId]);

  // Memoize onChange callback
  const handleConfigChange = useCallback(() => {
    if (!enabled || !selectedConnection) {
      onChange(undefined);
      return;
    }

    const { connection, dataSource } = selectedConnection;
    const config: ComponentDataSourceConfig = {
      componentName,
      connectionId: connection.id,
      dataSourceId: dataSource.id,
      endpoint: connection.endpoint,
      dataKey: connection.dataKey || 'data',
      transformTo: connection.transformConfig || { idField: 'id', titleField: 'name' },
      dependsOn: connection.dependsOnConnectionId ? dependsOnField : undefined,
      filterParam: connection.paramMapping
        ? Object.keys(connection.paramMapping)[0]
        : undefined,
    };
    onChange(config);
  }, [enabled, selectedConnection, dependsOnField, componentName, onChange]);

  // Update parent when selection changes
  useEffect(() => {
    handleConfigChange();
  }, [handleConfigChange]);

  // Handle enable/disable toggle
  const handleToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnabled = e.target.checked;
    setEnabled(newEnabled);
    if (!newEnabled) {
      setSelectedConnectionId('');
      setDependsOnField('');
    }
  }, []);

  // Handle connection selection
  const handleConnectionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedConnectionId(e.target.value);
    setDependsOnField(''); // Reset depends on when connection changes
  }, []);

  // Handle depends on field selection
  const handleDependsOnChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setDependsOnField(e.target.value);
  }, []);

  // Check if connection has chaining configured
  const hasChaining = selectedConnection?.connection.dependsOnConnectionId;

  return (
    <div className="space-y-3 p-3 bg-blue-900/20 rounded-lg border border-blue-800">
      {/* Toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={handleToggle}
          className="w-4 h-4 rounded"
        />
        <span className="text-sm font-medium text-white">Fill from Data Source</span>
      </label>

      {enabled && (
        <div className="space-y-3 pl-6">
          {/* Connection Dropdown - Grouped by DataSource */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Connection</label>
            <select
              value={selectedConnectionId}
              onChange={handleConnectionChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
              disabled={loading}
            >
              <option value="">Select a connection...</option>
              {groupedConnections.map((group) => (
                <optgroup key={group.dataSource.id} label={group.dataSource.name}>
                  {group.connections.map((conn) => (
                    <option key={conn.id} value={conn.id}>
                      {conn.name} ({conn.method} {conn.endpoint})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {loading && (
              <p className="text-xs text-gray-500 mt-1">Loading connections...</p>
            )}
          </div>

          {/* Show connection details when selected */}
          {selectedConnection && (
            <div className="p-2 bg-gray-800/50 rounded border border-gray-700">
              <div className="text-xs text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Data Source:</span>
                  <span className="text-white">{selectedConnection.dataSource.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Endpoint:</span>
                  <span className="text-white font-mono text-xs">
                    {selectedConnection.connection.method} {selectedConnection.connection.endpoint}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Data Key:</span>
                  <span className="text-white font-mono text-xs">
                    {selectedConnection.connection.dataKey || 'data'}
                  </span>
                </div>
                {selectedConnection.connection.transformConfig && (
                  <div className="flex justify-between">
                    <span>Mapping:</span>
                    <span className="text-white font-mono text-xs">
                      id={selectedConnection.connection.transformConfig.idField},{' '}
                      title={selectedConnection.connection.transformConfig.titleField}
                      {selectedConnection.connection.transformConfig.descriptionField && (
                        <>, desc={selectedConnection.connection.transformConfig.descriptionField}</>
                      )}
                    </span>
                  </div>
                )}
                {hasChaining && (
                  <div className="flex justify-between text-yellow-400">
                    <span>Chained:</span>
                    <span>Yes (depends on parent connection)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Depends On Field - only if connection is chained and has available fields */}
          {hasChaining && availableFields.length > 0 && (
            <div className="pt-2 border-t border-gray-700">
              <label className="block text-xs text-gray-400 mb-1">
                Depends On (form field for filtering)
              </label>
              <select
                value={dependsOnField}
                onChange={handleDependsOnChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
              >
                <option value="">Select form field...</option>
                {availableFields.map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                This connection will filter based on the selected value of this field
              </p>
            </div>
          )}

          {/* Warning if chained but no dependsOn selected */}
          {hasChaining && availableFields.length > 0 && !dependsOnField && (
            <div className="p-2 bg-yellow-900/30 rounded border border-yellow-700">
              <p className="text-xs text-yellow-400">
                This connection is chained. Select a form field above to enable cascading behavior.
              </p>
            </div>
          )}

          {/* Warning if chained but no available fields */}
          {hasChaining && availableFields.length === 0 && (
            <div className="p-2 bg-yellow-900/30 rounded border border-yellow-700">
              <p className="text-xs text-yellow-400">
                This connection is chained but there are no other form fields to depend on.
                Add another dropdown field first.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataSourceSelector;
