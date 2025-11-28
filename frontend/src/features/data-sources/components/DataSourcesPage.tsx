import React, { useEffect, useState, useCallback } from 'react';
import {
  getAllDataSources,
  createDataSource,
  updateDataSource,
  deleteDataSource,
  testConnection,
  type DataSource,
  type CreateDataSourceDto,
  type DataSourceType,
  type AuthType,
  type TestConnectionResponse,
} from '../api';
import { DataSourceCard } from './DataSourceCard';
import { ConnectionList } from './ConnectionList';

export const DataSourcesPage: React.FC = () => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedDataSourceId, setSelectedDataSourceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDataSource, setEditingDataSource] = useState<DataSource | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; result: TestConnectionResponse } | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateDataSourceDto>({
    name: '',
    description: '',
    type: 'REST_API',
    baseUrl: '',
    authType: 'NONE',
    authToken: '',
    authHeaderName: '',
    timeout: 30000,
    isActive: true,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const loadDataSources = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllDataSources();
      setDataSources(data);
      setError(null);

      // Auto-select first data source if none selected
      if (data.length > 0 && !selectedDataSourceId) {
        setSelectedDataSourceId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load data sources:', err);
      setError('Failed to load data sources. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedDataSourceId]);

  useEffect(() => {
    loadDataSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedDataSource = dataSources.find((ds) => ds.id === selectedDataSourceId);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'REST_API',
      baseUrl: '',
      authType: 'NONE',
      authToken: '',
      authHeaderName: '',
      timeout: 30000,
      isActive: true,
    });
    setValidationErrors({});
    setEditingDataSource(null);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.baseUrl.trim()) {
      errors.baseUrl = 'Base URL is required';
    } else {
      try {
        new URL(formData.baseUrl);
      } catch {
        errors.baseUrl = 'Please enter a valid URL';
      }
    }

    if (formData.authType === 'API_KEY' && !formData.authHeaderName?.trim()) {
      errors.authHeaderName = 'Header name is required for API Key authentication';
    }

    if (formData.authType !== 'NONE' && !formData.authToken?.trim()) {
      errors.authToken = 'Auth token is required for selected authentication type';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const dataToSubmit = { ...formData };

      // Clean up optional fields
      if (!dataToSubmit.description?.trim()) {
        delete dataToSubmit.description;
      }
      if (dataToSubmit.authType === 'NONE') {
        delete dataToSubmit.authToken;
        delete dataToSubmit.authHeaderName;
      }
      if (dataToSubmit.authType !== 'API_KEY') {
        delete dataToSubmit.authHeaderName;
      }

      const newDataSource = await createDataSource(dataToSubmit);
      setDataSources([...dataSources, newDataSource]);
      setSelectedDataSourceId(newDataSource.id);
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      console.error('Failed to create data source:', err);
      setValidationErrors({
        submit: err.response?.data?.message || 'Failed to create data source',
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingDataSource || !validateForm()) {
      return;
    }

    try {
      const dataToSubmit = { ...formData };

      // Clean up optional fields
      if (!dataToSubmit.description?.trim()) {
        delete dataToSubmit.description;
      }
      if (dataToSubmit.authType === 'NONE') {
        delete dataToSubmit.authToken;
        delete dataToSubmit.authHeaderName;
      }
      if (dataToSubmit.authType !== 'API_KEY') {
        delete dataToSubmit.authHeaderName;
      }

      const updatedDataSource = await updateDataSource(editingDataSource.id, dataToSubmit);
      setDataSources(dataSources.map((ds) => (ds.id === updatedDataSource.id ? updatedDataSource : ds)));
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      console.error('Failed to update data source:', err);
      setValidationErrors({
        submit: err.response?.data?.message || 'Failed to update data source',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this data source? All associated connections will also be deleted.')) return;

    try {
      await deleteDataSource(id);
      const updatedDataSources = dataSources.filter((ds) => ds.id !== id);
      setDataSources(updatedDataSources);

      // If deleted data source was selected, select another one
      if (selectedDataSourceId === id) {
        setSelectedDataSourceId(updatedDataSources.length > 0 ? updatedDataSources[0].id : null);
      }
    } catch (err) {
      console.error('Failed to delete data source:', err);
      alert('Failed to delete data source');
    }
  };

  const handleTestConnection = async (id: string) => {
    try {
      setTestingId(id);
      setTestResult(null);
      const result = await testConnection(id);
      setTestResult({ id, result });

      // Auto-hide success message after 3 seconds
      if (result.success) {
        setTimeout(() => {
          setTestResult(null);
        }, 3000);
      }
    } catch (err: any) {
      setTestResult({
        id,
        result: {
          success: false,
          message: err.response?.data?.message || 'Connection test failed',
        },
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleOpenEdit = (dataSource: DataSource) => {
    setEditingDataSource(dataSource);
    setFormData({
      name: dataSource.name,
      description: dataSource.description || '',
      type: dataSource.type,
      baseUrl: dataSource.baseUrl,
      authType: dataSource.authType,
      authToken: dataSource.authToken || '',
      authHeaderName: dataSource.authHeaderName || '',
      timeout: dataSource.timeout || 30000,
      isActive: dataSource.isActive,
    });
    setValidationErrors({});
    setShowModal(true);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleFormChange = (field: keyof CreateDataSourceDto, value: any) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background">
      {/* Left Panel - Data Sources List */}
      <div className="w-1/3 border-r border-zinc-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white">Data Sources</h2>
            <p className="text-xs text-zinc-400 mt-0.5">{dataSources.length} source{dataSources.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-3 py-1.5 bg-primary text-[#112217] rounded-lg font-bold text-sm flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-4 mt-4 bg-red-900/20 border border-red-700 text-red-400 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Data Sources List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {dataSources.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <span className="material-symbols-outlined text-4xl text-zinc-600 mb-2">
                database
              </span>
              <p className="text-zinc-400">No data sources yet</p>
              <p className="text-sm text-zinc-500 mt-1">
                Click "Add" to create your first data source
              </p>
            </div>
          ) : (
            dataSources.map((dataSource) => (
              <div key={dataSource.id}>
                <DataSourceCard
                  dataSource={dataSource}
                  isSelected={dataSource.id === selectedDataSourceId}
                  onSelect={() => setSelectedDataSourceId(dataSource.id)}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                  onTestConnection={handleTestConnection}
                  isTestingConnection={testingId === dataSource.id}
                />
                {/* Test Result Display */}
                {testResult && testResult.id === dataSource.id && (
                  <div
                    className={`mt-2 px-3 py-2 rounded-lg text-xs flex items-center gap-1 ${
                      testResult.result.success
                        ? 'bg-green-900/20 text-green-400'
                        : 'bg-red-900/20 text-red-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {testResult.result.success ? 'check_circle' : 'error'}
                    </span>
                    {testResult.result.message}
                    {testResult.result.responseTime && ` (${testResult.result.responseTime}ms)`}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Connections */}
      <div className="w-2/3 flex flex-col">
        {selectedDataSource ? (
          <ConnectionList
            dataSource={selectedDataSource}
            onUpdate={loadDataSources}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="material-symbols-outlined text-5xl text-zinc-600 mb-3">
              touch_app
            </span>
            <p className="text-zinc-400 text-lg">Select a data source</p>
            <p className="text-sm text-zinc-500 mt-1">
              Choose a data source from the left panel to view and manage its connections
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-surface-dark rounded-xl border border-zinc-800 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingDataSource ? 'Edit Data Source' : 'Add New Data Source'}
            </h2>
            <form onSubmit={editingDataSource ? handleUpdate : handleCreate}>
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
                    placeholder="My API Service"
                  />
                  {validationErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Optional description"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleFormChange('type', e.target.value as DataSourceType)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="REST_API">REST API</option>
                    <option value="STRAPI">Strapi</option>
                    <option value="GRAPHQL">GraphQL</option>
                  </select>
                </div>

                {/* Base URL */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Base URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.baseUrl}
                    onChange={(e) => handleFormChange('baseUrl', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border bg-zinc-900 text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${
                      validationErrors.baseUrl ? 'border-red-500' : 'border-zinc-700'
                    }`}
                    placeholder="https://api.example.com"
                  />
                  {validationErrors.baseUrl && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.baseUrl}</p>
                  )}
                </div>

                {/* Auth Type */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Authentication Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.authType}
                    onChange={(e) => handleFormChange('authType', e.target.value as AuthType)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="NONE">None</option>
                    <option value="BEARER">Bearer Token</option>
                    <option value="API_KEY">API Key</option>
                    <option value="BASIC">Basic Auth</option>
                  </select>
                </div>

                {/* Auth Header Name (only for API_KEY) */}
                {formData.authType === 'API_KEY' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                      Auth Header Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.authHeaderName}
                      onChange={(e) => handleFormChange('authHeaderName', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border bg-zinc-900 text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${
                        validationErrors.authHeaderName ? 'border-red-500' : 'border-zinc-700'
                      }`}
                      placeholder="X-API-Key"
                    />
                    {validationErrors.authHeaderName && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.authHeaderName}</p>
                    )}
                  </div>
                )}

                {/* Auth Token (only when auth type is not NONE) */}
                {formData.authType !== 'NONE' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                      Auth Token <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.authToken}
                      onChange={(e) => handleFormChange('authToken', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border bg-zinc-900 text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${
                        validationErrors.authToken ? 'border-red-500' : 'border-zinc-700'
                      }`}
                      placeholder={
                        formData.authType === 'BASIC'
                          ? 'username:password'
                          : 'Your token or API key'
                      }
                    />
                    {validationErrors.authToken && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.authToken}</p>
                    )}
                  </div>
                )}

                {/* Timeout */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Timeout (ms)
                  </label>
                  <input
                    type="number"
                    value={formData.timeout}
                    onChange={(e) => handleFormChange('timeout', parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="30000"
                    min="1000"
                    max="120000"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Request timeout in milliseconds (default: 30000)</p>
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
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <span className="block sm:inline">{validationErrors.submit}</span>
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
                  {editingDataSource ? 'Save Changes' : 'Create Data Source'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
