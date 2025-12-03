import { useState, useEffect } from 'react';
import { getActiveDataSources } from '../../../../data-sources/api';
import type { DataSource } from '../../../../data-sources/api';

// WhatsApp Flow Categories
const FLOW_CATEGORIES = [
  'SIGN_UP',
  'SIGN_IN',
  'APPOINTMENT_BOOKING',
  'LEAD_GENERATION',
  'CONTACT_US',
  'CUSTOMER_SUPPORT',
  'SURVEY',
  'OTHER',
] as const;

export type FlowCategory = typeof FLOW_CATEGORIES[number];

export interface IntegrationConfig {
  componentName: string;
  integrationType: 'google_calendar' | 'rest_api';
  sourceType: 'owner' | 'static' | 'variable';
  sourceVariable?: string;
  sourceId?: string;
  action: string;
  params?: Record<string, unknown>;
  dependsOn?: string;
  transformTo: {
    idField: string;
    titleField: string;
    descriptionField?: string;
  };
}

export interface SaveFlowModalData {
  name: string;
  categories: string[];
  dataSourceId?: string;
  integrationConfigs?: IntegrationConfig[];
}

export interface SaveFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SaveFlowModalData) => void;
  initialName?: string;
}

export const SaveFlowModal = ({
  isOpen,
  onClose,
  onSave,
  initialName = '',
}: SaveFlowModalProps) => {
  const [formData, setFormData] = useState({
    name: initialName,
    categories: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedDataSourceId, setSelectedDataSourceId] = useState<string>('');
  const [loadingDataSources, setLoadingDataSources] = useState(false);
  const [integrationConfigJson, setIntegrationConfigJson] = useState<string>('[]');
  const [showIntegrationConfig, setShowIntegrationConfig] = useState(false);

  // Load data sources
  useEffect(() => {
    const loadDataSources = async () => {
      setLoadingDataSources(true);
      try {
        const sources = await getActiveDataSources();
        setDataSources(sources);
      } catch (error) {
        console.error('Failed to load data sources:', error);
      } finally {
        setLoadingDataSources(false);
      }
    };
    loadDataSources();
  }, []);

  // Reset form when modal opens with initialName
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialName,
        categories: [],
      });
      setErrors({});
      setSelectedDataSourceId('');
      setIntegrationConfigJson('[]');
      setShowIntegrationConfig(false);
    }
  }, [isOpen, initialName]);

  // Auto-expand integration config section when there's an error
  useEffect(() => {
    if (errors.integrationConfig) {
      setShowIntegrationConfig(true);
    }
  }, [errors.integrationConfig]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Flow name is required';
    }

    if (formData.categories.length === 0) {
      newErrors.categories = 'At least one category is required';
    }

    // Validate integration config JSON if provided
    if (integrationConfigJson.trim() && integrationConfigJson.trim() !== '[]') {
      try {
        const parsed = JSON.parse(integrationConfigJson);
        if (!Array.isArray(parsed)) {
          newErrors.integrationConfig = 'Integration config must be a JSON array';
        } else {
          // Validate each config item
          for (let i = 0; i < parsed.length; i++) {
            const item = parsed[i];
            if (!item.componentName) {
              newErrors.integrationConfig = `Item ${i + 1}: componentName is required`;
              break;
            }
            if (!['google_calendar', 'rest_api'].includes(item.integrationType)) {
              newErrors.integrationConfig = `Item ${i + 1}: integrationType must be 'google_calendar' or 'rest_api'`;
              break;
            }
            if (!item.transformTo?.idField || !item.transformTo?.titleField) {
              newErrors.integrationConfig = `Item ${i + 1}: transformTo.idField and titleField are required`;
              break;
            }
          }
        }
      } catch {
        newErrors.integrationConfig = 'Invalid JSON format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Parse integration configs if provided
    let integrationConfigs: IntegrationConfig[] | undefined;
    if (integrationConfigJson.trim() && integrationConfigJson.trim() !== '[]') {
      try {
        integrationConfigs = JSON.parse(integrationConfigJson) as IntegrationConfig[];
      } catch {
        // Should not happen as we validate above
      }
    }

    onSave({
      name: formData.name.trim(),
      categories: formData.categories,
      dataSourceId: selectedDataSourceId || undefined,
      integrationConfigs,
    });
  };

  const handleCategoryToggle = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-flow-modal-title"
    >
      <div className="bg-surface rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl">
        <div className="sticky top-0 bg-surface border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <h2 id="save-flow-modal-title" className="text-xl font-bold text-white">
            {initialName ? 'Update Flow' : 'Save Flow'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Flow Name */}
          <div>
            <label htmlFor="flow-name" className="block text-sm font-medium text-zinc-300 mb-1">
              Flow Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="flow-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg bg-zinc-900 text-white focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.name ? 'border-red-500' : 'border-zinc-700'
              }`}
              placeholder="Enter flow name"
              autoFocus
            />
            {errors.name && <p role="alert" className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Categories <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FLOW_CATEGORIES.map((category) => (
                <label
                  key={category}
                  className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer transition-colors ${
                    formData.categories.includes(category)
                      ? 'bg-primary/20 border border-primary'
                      : 'bg-zinc-900 border border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="w-4 h-4 text-primary border-zinc-700 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-zinc-300">
                    {category.replace(/_/g, ' ')}
                  </span>
                </label>
              ))}
            </div>
            {errors.categories && (
              <p role="alert" className="mt-2 text-sm text-red-600">{errors.categories}</p>
            )}
            <p className="mt-2 text-xs text-zinc-400">
              Select at least one category that describes your flow
            </p>
          </div>

          {/* Default Data Source (Optional) */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Default Data Source <span className="text-zinc-500">(optional)</span>
            </label>
            <select
              value={selectedDataSourceId}
              onChange={(e) => setSelectedDataSourceId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loadingDataSources}
            >
              <option value="">None</option>
              {dataSources.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.name} ({ds.type})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-zinc-400">
              Components can override this with their own data source
            </p>
          </div>

          {/* Integration Configs (Optional - Collapsible) */}
          <div className="border border-zinc-700 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowIntegrationConfig(!showIntegrationConfig)}
              aria-expanded={showIntegrationConfig}
              aria-controls="integration-config-section"
              className="w-full flex items-center justify-between px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">extension</span>
                <span className="text-sm font-medium text-zinc-300">
                  Integration Configs <span className="text-zinc-500">(optional)</span>
                </span>
              </div>
              <span className="material-symbols-outlined text-zinc-400">
                {showIntegrationConfig ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {showIntegrationConfig && (
              <div id="integration-config-section" className="p-4 space-y-3 border-t border-zinc-700">
                <p className="text-xs text-zinc-400">
                  Configure dynamic data sources for dropdown components. Supported types:{' '}
                  <code className="text-primary">google_calendar</code>,{' '}
                  <code className="text-primary">rest_api</code>
                </p>
                <textarea
                  value={integrationConfigJson}
                  onChange={(e) => setIntegrationConfigJson(e.target.value)}
                  rows={8}
                  className={`w-full px-3 py-2 border rounded-lg font-mono text-sm bg-zinc-900 text-white focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.integrationConfig ? 'border-red-500' : 'border-zinc-700'
                  }`}
                  placeholder={`[
  {
    "componentName": "dropdown_name",
    "integrationType": "google_calendar",
    "sourceType": "static",
    "action": "list_calendar_users",
    "transformTo": {
      "idField": "id",
      "titleField": "title"
    }
  }
]`}
                />
                {errors.integrationConfig && (
                  <p role="alert" className="text-red-400 text-sm mt-1">{errors.integrationConfig}</p>
                )}

                {/* Example */}
                <details className="text-xs">
                  <summary className="text-zinc-400 cursor-pointer hover:text-zinc-300">
                    View example config
                  </summary>
                  <pre className="mt-2 p-3 bg-zinc-900 rounded-lg text-zinc-400 overflow-auto">{`[
  {
    "componentName": "barbers",
    "integrationType": "google_calendar",
    "sourceType": "static",
    "action": "list_calendar_users",
    "transformTo": { "idField": "id", "titleField": "title" }
  },
  {
    "componentName": "time_slots",
    "integrationType": "google_calendar",
    "sourceType": "variable",
    "sourceVariable": "selected_barber",
    "action": "check_availability",
    "params": {
      "workingHoursStart": "09:00",
      "workingHoursEnd": "18:00",
      "slotDuration": 30,
      "dateSource": "variable",
      "dateVariable": "selected_date"
    },
    "dependsOn": "selected_date",
    "transformTo": { "idField": "id", "titleField": "title" }
  }
]`}</pre>
                </details>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-[#112217] rounded-lg font-bold transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              Save Flow
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
