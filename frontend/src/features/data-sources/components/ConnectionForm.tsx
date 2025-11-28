import React, { useState, useEffect } from 'react';
import { connectionApi } from '../api';
import type {
  DataSourceConnection,
  CreateConnectionDto,
  HttpMethod,
  TransformConfig,
} from '../types';

interface ConnectionFormProps {
  dataSourceId: string;
  connection?: DataSourceConnection | null; // null for create, object for edit
  existingConnections: DataSourceConnection[]; // for chain dropdown
  onClose: () => void;
  onSave: () => void;
}

interface FormData {
  name: string;
  description: string;
  endpoint: string;
  method: HttpMethod;
  dataKey: string;
  transformConfig: TransformConfig | null;
  dependsOnConnectionId: string;
  paramMapping: Record<string, string>;
  isActive: boolean;
}

const initialFormData: FormData = {
  name: '',
  description: '',
  endpoint: '',
  method: 'GET',
  dataKey: '',
  transformConfig: null,
  dependsOnConnectionId: '',
  paramMapping: {},
  isActive: true,
};

/**
 * ConnectionForm - Modal form for creating/editing DataSourceConnections
 *
 * Features:
 * - Name (required)
 * - Endpoint path (required, starts with /)
 * - Method dropdown (GET, POST, PUT, PATCH, DELETE)
 * - Data Key (path to data in response, e.g., "data")
 * - Transform Config section: ID Field, Title Field, Description Field (optional)
 * - Chain Config section (toggle): Depends On Connection, Param Mapping
 * - Active toggle
 */
export const ConnectionForm: React.FC<ConnectionFormProps> = ({
  dataSourceId,
  connection,
  existingConnections,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [showTransformConfig, setShowTransformConfig] = useState(false);
  const [showChainConfig, setShowChainConfig] = useState(false);
  const [paramMappingEntries, setParamMappingEntries] = useState<Array<{ key: string; value: string }>>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!connection;

  // Initialize form data when editing
  useEffect(() => {
    if (connection) {
      setFormData({
        name: connection.name,
        description: connection.description || '',
        endpoint: connection.endpoint,
        method: connection.method,
        dataKey: connection.dataKey || '',
        transformConfig: connection.transformConfig || null,
        dependsOnConnectionId: connection.dependsOnConnectionId || '',
        paramMapping: connection.paramMapping || {},
        isActive: connection.isActive,
      });

      if (connection.transformConfig) {
        setShowTransformConfig(true);
      }

      if (connection.dependsOnConnectionId || connection.paramMapping) {
        setShowChainConfig(true);
        // Convert paramMapping to entries array
        const entries = Object.entries(connection.paramMapping || {}).map(([key, value]) => ({
          key,
          value,
        }));
        setParamMappingEntries(entries.length > 0 ? entries : [{ key: '', value: '' }]);
      }
    }
  }, [connection]);

  // Get available connections for chaining (exclude current connection and its dependents)
  const availableForChaining = existingConnections.filter((c) => {
    if (connection && c.id === connection.id) return false;
    // Also exclude any connection that depends on current connection (avoid circular)
    if (connection && c.dependsOnConnectionId === connection.id) return false;
    return true;
  });

  const handleFieldChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleTransformConfigChange = (field: keyof TransformConfig, value: string) => {
    setFormData((prev) => ({
      ...prev,
      transformConfig: {
        idField: prev.transformConfig?.idField || '',
        titleField: prev.transformConfig?.titleField || '',
        descriptionField: prev.transformConfig?.descriptionField,
        [field]: value,
      },
    }));
  };

  const handleParamMappingChange = (index: number, field: 'key' | 'value', value: string) => {
    setParamMappingEntries((prev) => {
      const newEntries = [...prev];
      newEntries[index] = { ...newEntries[index], [field]: value };
      return newEntries;
    });
  };

  const handleAddParamMapping = () => {
    setParamMappingEntries((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveParamMapping = (index: number) => {
    setParamMappingEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.endpoint.trim()) {
      errors.endpoint = 'Endpoint path is required';
    } else if (!formData.endpoint.startsWith('/')) {
      errors.endpoint = 'Endpoint must start with /';
    }

    if (showTransformConfig && formData.transformConfig) {
      if (!formData.transformConfig.idField.trim()) {
        errors.idField = 'ID Field is required when transform is enabled';
      }
      if (!formData.transformConfig.titleField.trim()) {
        errors.titleField = 'Title Field is required when transform is enabled';
      }
    }

    if (showChainConfig && formData.dependsOnConnectionId) {
      // Validate that at least one param mapping is defined
      const validMappings = paramMappingEntries.filter((e) => e.key.trim() && e.value.trim());
      if (validMappings.length === 0) {
        errors.paramMapping = 'At least one parameter mapping is required when chaining';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      // Build the DTO
      const dto: CreateConnectionDto = {
        name: formData.name.trim(),
        endpoint: formData.endpoint.trim(),
        method: formData.method,
        isActive: formData.isActive,
      };

      if (formData.description.trim()) {
        dto.description = formData.description.trim();
      }

      if (formData.dataKey.trim()) {
        dto.dataKey = formData.dataKey.trim();
      }

      if (showTransformConfig && formData.transformConfig) {
        dto.transformConfig = {
          idField: formData.transformConfig.idField.trim(),
          titleField: formData.transformConfig.titleField.trim(),
        };
        if (formData.transformConfig.descriptionField?.trim()) {
          dto.transformConfig.descriptionField = formData.transformConfig.descriptionField.trim();
        }
      }

      if (showChainConfig && formData.dependsOnConnectionId) {
        dto.dependsOnConnectionId = formData.dependsOnConnectionId;

        // Convert param mapping entries to object
        const mapping: Record<string, string> = {};
        paramMappingEntries.forEach((entry) => {
          if (entry.key.trim() && entry.value.trim()) {
            mapping[entry.key.trim()] = entry.value.trim();
          }
        });
        if (Object.keys(mapping).length > 0) {
          dto.paramMapping = mapping;
        }
      }

      if (isEdit && connection) {
        await connectionApi.update(connection.id, dto);
      } else {
        await connectionApi.create(dataSourceId, dto);
      }

      onSave();
    } catch (err: any) {
      console.error('Failed to save connection:', err);
      setValidationErrors({
        submit: err.response?.data?.message || 'Failed to save connection',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-surface-dark rounded-xl border border-zinc-800 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">
            {isEdit ? 'Edit Connection' : 'Add New Connection'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border bg-zinc-900 text-white focus:ring-2 focus:ring-primary focus:border-transparent ${
                  validationErrors.name ? 'border-red-500' : 'border-zinc-700'
                }`}
                placeholder="Get Products, Create Order, etc."
              />
              {validationErrors.name && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Optional description"
              />
            </div>

            {/* Method and Endpoint */}
            <div className="flex gap-3">
              <div className="w-32">
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Method <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.method}
                  onChange={(e) => handleFieldChange('method', e.target.value as HttpMethod)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Endpoint Path <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.endpoint}
                  onChange={(e) => handleFieldChange('endpoint', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border bg-zinc-900 text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${
                    validationErrors.endpoint ? 'border-red-500' : 'border-zinc-700'
                  }`}
                  placeholder="/api/products"
                />
                {validationErrors.endpoint && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.endpoint}</p>
                )}
              </div>
            </div>

            {/* Data Key */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Data Key
              </label>
              <input
                type="text"
                value={formData.dataKey}
                onChange={(e) => handleFieldChange('dataKey', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="data, data.items, response.results"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Path to extract data array from response (e.g., "data" for {"{ data: [...] }"})
              </p>
            </div>

            {/* Transform Config Section */}
            <div className="border border-zinc-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowTransformConfig(!showTransformConfig)}
                className="w-full flex items-center justify-between p-3 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-zinc-400">
                    transform
                  </span>
                  <span className="text-sm font-medium text-white">Transform Configuration</span>
                </div>
                <span className="material-symbols-outlined text-zinc-400">
                  {showTransformConfig ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {showTransformConfig && (
                <div className="p-3 space-y-3 border-t border-zinc-700">
                  <p className="text-xs text-zinc-400">
                    Map API response fields to standardized dropdown format (id, title, description)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        ID Field <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.transformConfig?.idField || ''}
                        onChange={(e) => handleTransformConfigChange('idField', e.target.value)}
                        className={`w-full px-2 py-1.5 rounded border bg-zinc-900 text-white font-mono text-xs focus:ring-2 focus:ring-primary focus:border-transparent ${
                          validationErrors.idField ? 'border-red-500' : 'border-zinc-700'
                        }`}
                        placeholder="id"
                      />
                      {validationErrors.idField && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.idField}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Title Field <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.transformConfig?.titleField || ''}
                        onChange={(e) => handleTransformConfigChange('titleField', e.target.value)}
                        className={`w-full px-2 py-1.5 rounded border bg-zinc-900 text-white font-mono text-xs focus:ring-2 focus:ring-primary focus:border-transparent ${
                          validationErrors.titleField ? 'border-red-500' : 'border-zinc-700'
                        }`}
                        placeholder="name, attributes.title"
                      />
                      {validationErrors.titleField && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.titleField}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Description Field (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.transformConfig?.descriptionField || ''}
                      onChange={(e) => handleTransformConfigChange('descriptionField', e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-zinc-700 bg-zinc-900 text-white font-mono text-xs focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="description, attributes.desc"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Chain Config Section */}
            <div className="border border-zinc-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setShowChainConfig(!showChainConfig);
                  if (!showChainConfig && paramMappingEntries.length === 0) {
                    setParamMappingEntries([{ key: '', value: '' }]);
                  }
                }}
                className="w-full flex items-center justify-between p-3 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-zinc-400">link</span>
                  <span className="text-sm font-medium text-white">Chain Configuration</span>
                </div>
                <span className="material-symbols-outlined text-zinc-400">
                  {showChainConfig ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {showChainConfig && (
                <div className="p-3 space-y-3 border-t border-zinc-700">
                  <p className="text-xs text-zinc-400">
                    Make this connection depend on another connection's selection (for cascading dropdowns)
                  </p>

                  {/* Depends On Connection */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Depends On Connection
                    </label>
                    <select
                      value={formData.dependsOnConnectionId}
                      onChange={(e) => handleFieldChange('dependsOnConnectionId', e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-zinc-700 bg-zinc-900 text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">None</option>
                      {availableForChaining.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.method} {c.endpoint})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Param Mapping */}
                  {formData.dependsOnConnectionId && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-medium text-zinc-400">
                          Parameter Mapping (JSONPath)
                        </label>
                        <button
                          type="button"
                          onClick={handleAddParamMapping}
                          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                          Add Mapping
                        </button>
                      </div>
                      {validationErrors.paramMapping && (
                        <p className="text-red-500 text-xs mb-2">{validationErrors.paramMapping}</p>
                      )}
                      <div className="space-y-2">
                        {paramMappingEntries.map((entry, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={entry.key}
                              onChange={(e) => handleParamMappingChange(index, 'key', e.target.value)}
                              className="flex-1 px-2 py-1.5 rounded border border-zinc-700 bg-zinc-900 text-white font-mono text-xs focus:ring-2 focus:ring-primary focus:border-transparent"
                              placeholder="filters[brand][$eq]"
                            />
                            <span className="text-zinc-500">=</span>
                            <input
                              type="text"
                              value={entry.value}
                              onChange={(e) => handleParamMappingChange(index, 'value', e.target.value)}
                              className="flex-1 px-2 py-1.5 rounded border border-zinc-700 bg-zinc-900 text-white font-mono text-xs focus:ring-2 focus:ring-primary focus:border-transparent"
                              placeholder="$.id"
                            />
                            {paramMappingEntries.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveParamMapping(index)}
                                className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                              >
                                <span className="material-symbols-outlined text-sm">close</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-zinc-500 mt-2">
                        Use JSONPath to extract values from parent selection (e.g., $.id, $.attributes.name)
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Is Active Toggle */}
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                <span className="ml-3 text-sm font-medium text-zinc-300">Active</span>
              </label>
            </div>

            {/* Submit Error */}
            {validationErrors.submit && (
              <div className="bg-red-900/20 border border-red-700 text-red-400 px-3 py-2 rounded-lg text-sm flex items-start gap-2">
                <span className="material-symbols-outlined text-sm mt-0.5">error</span>
                <span>{validationErrors.submit}</span>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-zinc-300 hover:bg-zinc-800 rounded-lg font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-primary text-[#112217] rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && (
              <span className="material-symbols-outlined animate-spin text-sm">sync</span>
            )}
            {isEdit ? 'Save Changes' : 'Create Connection'}
          </button>
        </div>
      </div>
    </div>
  );
};
