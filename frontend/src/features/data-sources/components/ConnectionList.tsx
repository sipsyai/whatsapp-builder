import React, { useEffect, useState, useCallback } from 'react';
import type { DataSource } from '../api';
import { connectionApi } from '../api';
import type {
  DataSourceConnection,
  CreateConnectionDto,
  HttpMethod,
  TransformConfig,
  TestConnectionResponse,
} from '../types';

interface ConnectionListProps {
  dataSource: DataSource;
  onUpdate: () => void;
}

interface ConnectionFormData {
  name: string;
  description: string;
  endpoint: string;
  method: HttpMethod;
  defaultParams: string;
  defaultBody: string;
  dataKey: string;
  transformConfig: {
    idField: string;
    titleField: string;
    descriptionField: string;
  };
  dependsOnConnectionId: string;
  paramMapping: string;
  isActive: boolean;
}

const initialFormData: ConnectionFormData = {
  name: '',
  description: '',
  endpoint: '',
  method: 'GET',
  defaultParams: '',
  defaultBody: '',
  dataKey: '',
  transformConfig: {
    idField: '',
    titleField: '',
    descriptionField: '',
  },
  dependsOnConnectionId: '',
  paramMapping: '',
  isActive: true,
};

const getMethodBadgeColor = (method: HttpMethod): string => {
  switch (method) {
    case 'GET':
      return 'bg-green-900/30 text-green-400';
    case 'POST':
      return 'bg-blue-900/30 text-blue-400';
    case 'PUT':
      return 'bg-yellow-900/30 text-yellow-400';
    case 'PATCH':
      return 'bg-orange-900/30 text-orange-400';
    case 'DELETE':
      return 'bg-red-900/30 text-red-400';
    default:
      return 'bg-gray-900/30 text-gray-400';
  }
};

export const ConnectionList: React.FC<ConnectionListProps> = ({
  dataSource,
  onUpdate,
}) => {
  const [connections, setConnections] = useState<DataSourceConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState<DataSourceConnection | null>(null);
  const [formData, setFormData] = useState<ConnectionFormData>(initialFormData);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; result: TestConnectionResponse } | null>(null);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await connectionApi.getByDataSource(dataSource.id);
      setConnections(data);
    } catch (err) {
      console.error('Failed to load connections:', err);
      setError('Failed to load connections');
    } finally {
      setLoading(false);
    }
  }, [dataSource.id]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const resetForm = () => {
    setFormData(initialFormData);
    setValidationErrors({});
    setEditingConnection(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (connection: DataSourceConnection) => {
    setEditingConnection(connection);
    setFormData({
      name: connection.name,
      description: connection.description || '',
      endpoint: connection.endpoint,
      method: connection.method,
      defaultParams: connection.defaultParams ? JSON.stringify(connection.defaultParams, null, 2) : '',
      defaultBody: connection.defaultBody ? JSON.stringify(connection.defaultBody, null, 2) : '',
      dataKey: connection.dataKey || '',
      transformConfig: {
        idField: connection.transformConfig?.idField || '',
        titleField: connection.transformConfig?.titleField || '',
        descriptionField: connection.transformConfig?.descriptionField || '',
      },
      dependsOnConnectionId: connection.dependsOnConnectionId || '',
      paramMapping: connection.paramMapping ? JSON.stringify(connection.paramMapping, null, 2) : '',
      isActive: connection.isActive,
    });
    setValidationErrors({});
    setShowModal(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.endpoint.trim()) {
      errors.endpoint = 'Endpoint is required';
    }

    // Validate JSON fields
    if (formData.defaultParams.trim()) {
      try {
        JSON.parse(formData.defaultParams);
      } catch {
        errors.defaultParams = 'Invalid JSON format';
      }
    }

    if (formData.defaultBody.trim()) {
      try {
        JSON.parse(formData.defaultBody);
      } catch {
        errors.defaultBody = 'Invalid JSON format';
      }
    }

    if (formData.paramMapping.trim()) {
      try {
        JSON.parse(formData.paramMapping);
      } catch {
        errors.paramMapping = 'Invalid JSON format';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildConnectionDto = (): CreateConnectionDto => {
    const dto: CreateConnectionDto = {
      name: formData.name.trim(),
      endpoint: formData.endpoint.trim(),
      method: formData.method,
      isActive: formData.isActive,
    };

    if (formData.description.trim()) {
      dto.description = formData.description.trim();
    }

    if (formData.defaultParams.trim()) {
      dto.defaultParams = JSON.parse(formData.defaultParams);
    }

    if (formData.defaultBody.trim()) {
      dto.defaultBody = JSON.parse(formData.defaultBody);
    }

    if (formData.dataKey.trim()) {
      dto.dataKey = formData.dataKey.trim();
    }

    // Build transform config only if at least idField and titleField are provided
    if (formData.transformConfig.idField.trim() && formData.transformConfig.titleField.trim()) {
      const transformConfig: TransformConfig = {
        idField: formData.transformConfig.idField.trim(),
        titleField: formData.transformConfig.titleField.trim(),
      };
      if (formData.transformConfig.descriptionField.trim()) {
        transformConfig.descriptionField = formData.transformConfig.descriptionField.trim();
      }
      dto.transformConfig = transformConfig;
    }

    if (formData.dependsOnConnectionId.trim()) {
      dto.dependsOnConnectionId = formData.dependsOnConnectionId.trim();
    }

    if (formData.paramMapping.trim()) {
      dto.paramMapping = JSON.parse(formData.paramMapping);
    }

    return dto;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const dto = buildConnectionDto();
      await connectionApi.create(dataSource.id, dto);
      setShowModal(false);
      resetForm();
      loadConnections();
      onUpdate();
    } catch (err: any) {
      console.error('Failed to create connection:', err);
      setValidationErrors({
        submit: err.response?.data?.message || 'Failed to create connection',
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingConnection || !validateForm()) {
      return;
    }

    try {
      const dto = buildConnectionDto();
      await connectionApi.update(editingConnection.id, dto);
      setShowModal(false);
      resetForm();
      loadConnections();
      onUpdate();
    } catch (err: any) {
      console.error('Failed to update connection:', err);
      setValidationErrors({
        submit: err.response?.data?.message || 'Failed to update connection',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this connection?')) {
      return;
    }

    try {
      await connectionApi.delete(id);
      loadConnections();
      onUpdate();
    } catch (err) {
      console.error('Failed to delete connection:', err);
      alert('Failed to delete connection');
    }
  };

  const handleTestConnection = async (id: string) => {
    try {
      setTestingId(id);
      setTestResult(null);
      const result = await connectionApi.execute(id);
      setTestResult({ id, result });

      if (result.success) {
        setTimeout(() => {
          setTestResult(null);
        }, 5000);
      }
    } catch (err: any) {
      setTestResult({
        id,
        result: {
          success: false,
          responseTime: 0,
          error: err.response?.data?.message || 'Connection test failed',
        },
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleFormChange = (field: keyof ConnectionFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleTransformConfigChange = (field: keyof ConnectionFormData['transformConfig'], value: string) => {
    setFormData((prev) => ({
      ...prev,
      transformConfig: { ...prev.transformConfig, [field]: value },
    }));
  };

  const getConnectionDependencyName = (dependsOnId?: string) => {
    if (!dependsOnId) return null;
    const parentConnection = connections.find((c) => c.id === dependsOnId);
    return parentConnection?.name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white">Connections</h2>
          <p className="text-sm text-zinc-400">
            {dataSource.name} - {connections.length} connection{connections.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-3 py-1.5 bg-primary text-[#112217] rounded-lg font-bold text-sm flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add Connection
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Connections List */}
      <div className="flex-1 overflow-y-auto p-4">
        {connections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="material-symbols-outlined text-4xl text-zinc-600 mb-2">
              link_off
            </span>
            <p className="text-zinc-400">No connections yet</p>
            <p className="text-sm text-zinc-500 mt-1">
              Add a connection to define API endpoints for this data source
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map((connection) => (
              <div key={connection.id}>
                <div
                  className={`p-4 rounded-lg border transition-colors ${
                    expandedTestId === connection.id
                      ? 'border-primary bg-primary/5'
                      : 'border-zinc-800 bg-surface-dark hover:border-zinc-700'
                  }`}
                >
                  {/* Connection Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white truncate">
                          {connection.name}
                        </h3>
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                            connection.isActive
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-red-900/30 text-red-400'
                          }`}
                        >
                          {connection.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {connection.description && (
                        <p className="text-xs text-zinc-500 mt-0.5 truncate">
                          {connection.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Endpoint Info */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded ${getMethodBadgeColor(connection.method)}`}
                    >
                      {connection.method}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono truncate">
                      {connection.endpoint}
                    </span>
                  </div>

                  {/* Feature Badges */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {connection.dataKey && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-zinc-800 text-zinc-400">
                        dataKey: {connection.dataKey}
                      </span>
                    )}
                    {connection.transformConfig && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-indigo-900/30 text-indigo-400">
                        Transform
                      </span>
                    )}
                    {connection.dependsOnConnectionId && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-cyan-900/30 text-cyan-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">link</span>
                        {getConnectionDependencyName(connection.dependsOnConnectionId)}
                      </span>
                    )}
                  </div>

                  {/* Test Result (inline) */}
                  {testResult && testResult.id === connection.id && (
                    <div
                      className={`mb-3 text-xs flex items-center gap-1 ${
                        testResult.result.success ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {testResult.result.success ? 'check_circle' : 'error'}
                      </span>
                      {testResult.result.success
                        ? `Success (${testResult.result.responseTime}ms)`
                        : testResult.result.error || 'Test failed'}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 border-t border-zinc-800 pt-2 -mx-4 px-4 -mb-4 pb-3">
                    <button
                      onClick={() => setExpandedTestId(expandedTestId === connection.id ? null : connection.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        expandedTestId === connection.id
                          ? 'text-primary bg-primary/10'
                          : 'text-zinc-400 hover:text-blue-400 hover:bg-blue-900/20'
                      }`}
                      title="Expand Test Panel"
                    >
                      <span className="material-symbols-outlined text-sm">science</span>
                    </button>
                    <button
                      onClick={() => handleTestConnection(connection.id)}
                      disabled={testingId === connection.id}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                      title="Quick Test"
                    >
                      {testingId === connection.id ? (
                        <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                      ) : (
                        <span className="material-symbols-outlined text-sm">play_arrow</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(connection)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Edit Connection"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(connection.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                      title="Delete Connection"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Test Panel */}
                {expandedTestId === connection.id && testResult && testResult.id === connection.id && testResult.result.data && (
                  <div className="mt-2 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-zinc-400">Response Data</span>
                      <span className="text-xs text-zinc-500">{testResult.result.responseTime}ms</span>
                    </div>
                    <pre className="text-xs font-mono text-green-400 bg-zinc-950 p-2 rounded overflow-auto max-h-48">
                      {JSON.stringify(testResult.result.data, null, 2)}
                    </pre>
                    {testResult.result.transformedData && (
                      <>
                        <span className="text-xs font-medium text-zinc-400 mt-3 block mb-2">Transformed Data</span>
                        <pre className="text-xs font-mono text-blue-400 bg-zinc-950 p-2 rounded overflow-auto max-h-48">
                          {JSON.stringify(testResult.result.transformedData, null, 2)}
                        </pre>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-surface-dark rounded-xl border border-zinc-800 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingConnection ? 'Edit Connection' : 'Add New Connection'}
            </h2>
            <form onSubmit={editingConnection ? handleUpdate : handleCreate}>
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border bg-zinc-900 text-white focus:ring-2 focus:ring-primary focus:border-transparent ${
                      validationErrors.name ? 'border-red-500' : 'border-zinc-700'
                    }`}
                    placeholder="Get Products"
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
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Optional description"
                  />
                </div>

                {/* Method and Endpoint */}
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                      Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.method}
                      onChange={(e) => handleFormChange('method', e.target.value as HttpMethod)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                      Endpoint <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.endpoint}
                      onChange={(e) => handleFormChange('endpoint', e.target.value)}
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
                    onChange={(e) => handleFormChange('dataKey', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="data or data.items"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    JSONPath to extract array from response (e.g., "data" for {"{"} data: [...] {"}"})
                  </p>
                </div>

                {/* Default Params */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Default Parameters (JSON)
                  </label>
                  <textarea
                    value={formData.defaultParams}
                    onChange={(e) => handleFormChange('defaultParams', e.target.value)}
                    rows={2}
                    className={`w-full px-3 py-2 rounded-lg border bg-zinc-900 text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${
                      validationErrors.defaultParams ? 'border-red-500' : 'border-zinc-700'
                    }`}
                    placeholder='{"populate": "*", "pagination[limit]": 100}'
                  />
                  {validationErrors.defaultParams && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.defaultParams}</p>
                  )}
                </div>

                {/* Default Body (only for POST/PUT/PATCH) */}
                {(formData.method === 'POST' || formData.method === 'PUT' || formData.method === 'PATCH') && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                      Default Body (JSON)
                    </label>
                    <textarea
                      value={formData.defaultBody}
                      onChange={(e) => handleFormChange('defaultBody', e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border bg-zinc-900 text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${
                        validationErrors.defaultBody ? 'border-red-500' : 'border-zinc-700'
                      }`}
                      placeholder='{"key": "value"}'
                    />
                    {validationErrors.defaultBody && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.defaultBody}</p>
                    )}
                  </div>
                )}

                {/* Transform Config */}
                <div className="border border-zinc-800 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Transform Configuration</h3>
                  <p className="text-xs text-zinc-500 mb-3">
                    Map response fields to dropdown format (id, title, description)
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        ID Field
                      </label>
                      <input
                        type="text"
                        value={formData.transformConfig.idField}
                        onChange={(e) => handleTransformConfigChange('idField', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="id"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Title Field
                      </label>
                      <input
                        type="text"
                        value={formData.transformConfig.titleField}
                        onChange={(e) => handleTransformConfigChange('titleField', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="attributes.name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Description Field
                      </label>
                      <input
                        type="text"
                        value={formData.transformConfig.descriptionField}
                        onChange={(e) => handleTransformConfigChange('descriptionField', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="attributes.desc"
                      />
                    </div>
                  </div>
                </div>

                {/* Chaining Config */}
                <div className="border border-zinc-800 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Chaining Configuration</h3>
                  <p className="text-xs text-zinc-500 mb-3">
                    Make this connection depend on another connection's selection
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Depends On Connection
                      </label>
                      <select
                        value={formData.dependsOnConnectionId}
                        onChange={(e) => handleFormChange('dependsOnConnectionId', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">None (Independent)</option>
                        {connections
                          .filter((c) => c.id !== editingConnection?.id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    {formData.dependsOnConnectionId && (
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          Parameter Mapping (JSON)
                        </label>
                        <textarea
                          value={formData.paramMapping}
                          onChange={(e) => handleFormChange('paramMapping', e.target.value)}
                          rows={2}
                          className={`w-full px-3 py-2 rounded-lg border bg-zinc-900 text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${
                            validationErrors.paramMapping ? 'border-red-500' : 'border-zinc-700'
                          }`}
                          placeholder='{"filters[brand][$eq]": "$.id"}'
                        />
                        {validationErrors.paramMapping && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.paramMapping}</p>
                        )}
                        <p className="text-xs text-zinc-500 mt-1">
                          Map query params to JSONPath expressions from parent selection
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Is Active */}
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => handleFormChange('isActive', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    <span className="ml-3 text-sm font-medium text-zinc-300">Is Active</span>
                  </label>
                </div>

                {/* Submit Error */}
                {validationErrors.submit && (
                  <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-lg">
                    {validationErrors.submit}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-zinc-300 hover:bg-zinc-800 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-[#112217] rounded-lg font-bold hover:bg-primary/90 transition-colors"
                >
                  {editingConnection ? 'Save Changes' : 'Create Connection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
