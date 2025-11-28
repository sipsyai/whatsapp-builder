import { useState, useEffect } from 'react';
import { flowsApi, type WhatsAppFlow, type SyncResult, WhatsAppFlowCategory, WHATSAPP_FLOW_CATEGORY_LABELS } from '../api';

export interface FlowsPageProps {
  onEditInBuilder?: (flow: WhatsAppFlow) => void;
  onOpenPlayground?: (flow: WhatsAppFlow | null) => void;
}

export const FlowsPage = ({ onEditInBuilder, onOpenPlayground }: FlowsPageProps) => {
  const [flows, setFlows] = useState<WhatsAppFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<WhatsAppFlow | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    try {
      setLoading(true);
      const data = await flowsApi.getAll();
      setFlows(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await flowsApi.publish(id);
      await loadFlows();
      alert('Flow published successfully!');
    } catch (err: any) {
      alert(`Failed to publish: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Flow?')) return;

    try {
      await flowsApi.delete(id);
      await loadFlows();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handlePreview = async (id: string) => {
    try {
      const previewUrl = await flowsApi.getPreview(id);
      window.open(previewUrl, '_blank');
    } catch (err: any) {
      alert(`Failed to get preview: ${err.message}`);
    }
  };

  const handleSyncFromMeta = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      const result = await flowsApi.syncFromMeta();
      setSyncResult(result);
      await loadFlows();
    } catch (err: any) {
      setError(`Failed to sync: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'DEPRECATED':
        return 'bg-red-100 text-red-800';
      case 'THROTTLED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">WhatsApp Flows</h1>
              <p className="text-zinc-400">Create and manage interactive WhatsApp Flows</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSyncFromMeta}
                disabled={syncing}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {syncing ? (
                  <>
                    <span className="animate-spin material-symbols-outlined">sync</span>
                    Syncing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">cloud_download</span>
                    Sync from Meta
                  </>
                )}
              </button>
              {onOpenPlayground && (
                <button
                  onClick={() => onOpenPlayground(null)}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span className="material-symbols-outlined">science</span>
                  Create with Playground
                </button>
              )}
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-primary text-[#112217] rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span className="material-symbols-outlined">add_circle</span>
                Create Flow
              </button>
            </div>
          </div>

          {/* Sync Result Banner */}
          {syncResult && (
            <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-blue-400">check_circle</span>
                <div>
                  <p className="font-medium text-blue-100">
                    Sync completed successfully!
                  </p>
                  <p className="text-sm text-blue-300">
                    {syncResult.total} flows found: {syncResult.created} created, {syncResult.updated} updated, {syncResult.unchanged} unchanged
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSyncResult(null)}
                className="text-blue-400 hover:text-blue-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div>
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-zinc-400">Loading flows...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6 relative flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && flows.length === 0 && (
          <div className="text-center py-20 bg-surface rounded-2xl border-2 border-dashed border-zinc-700">
            <div className="inline-block p-6 bg-zinc-800 rounded-full mb-6">
              <span className="material-symbols-outlined text-6xl text-zinc-500">
                check_box
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Flows yet</h3>
            <p className="text-zinc-400 mb-8 max-w-md mx-auto">
              Create your first WhatsApp Flow to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-primary text-[#112217] rounded-xl font-bold inline-flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Create Your First Flow
            </button>
          </div>
        )}

        {!loading && !error && flows.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flows.map((flow) => (
              <div
                key={flow.id}
                className="bg-surface rounded-2xl border border-zinc-800 overflow-hidden hover:shadow-2xl transition-all duration-300 group hover:scale-105"
              >
                {/* Flow Header with gradient */}
                <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-primary/30">check_box</span>
                  </div>

                  {/* Status Badge - Top Left */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusBadgeClass(flow.status)}`}>
                      {flow.status}
                    </span>
                  </div>

                  {/* Action Buttons - Top Right */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onOpenPlayground && (
                      <button
                        onClick={() => onOpenPlayground(flow)}
                        className="p-2 bg-zinc-800 text-purple-400 hover:bg-purple-900/20 rounded-lg transition-colors shadow-lg"
                        title="Open in Playground"
                      >
                        <span className="material-symbols-outlined text-xl">science</span>
                      </button>
                    )}
                    {onEditInBuilder && (
                      <button
                        onClick={() => onEditInBuilder(flow)}
                        className="p-2 bg-zinc-800 text-primary hover:bg-primary/20 rounded-lg transition-colors shadow-lg"
                        title="Edit in Builder"
                      >
                        <span className="material-symbols-outlined text-xl">edit_note</span>
                      </button>
                    )}
                    {flow.status === 'DRAFT' && (
                      <button
                        onClick={() => handlePublish(flow.id)}
                        className="p-2 bg-zinc-800 text-green-600 hover:bg-green-900/20 rounded-lg transition-colors shadow-lg"
                        title="Publish Flow"
                      >
                        <span className="material-symbols-outlined text-xl">publish</span>
                      </button>
                    )}
                    {flow.previewUrl && (
                      <button
                        onClick={() => handlePreview(flow.id)}
                        className="p-2 bg-zinc-800 text-blue-600 hover:bg-blue-900/20 rounded-lg transition-colors shadow-lg"
                        title="Preview Flow"
                      >
                        <span className="material-symbols-outlined text-xl">visibility</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(flow.id)}
                      className="p-2 bg-zinc-800 text-red-600 hover:bg-red-900/20 rounded-lg transition-colors shadow-lg"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                </div>

                {/* Flow Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2 truncate">{flow.name}</h3>
                  {flow.description && (
                    <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
                      {flow.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1 mb-3">
                    {flow.categories.map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-1 text-xs bg-blue-900/30 text-blue-400 rounded"
                      >
                        {WHATSAPP_FLOW_CATEGORY_LABELS[cat]}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => setSelectedFlow(flow)}
                    className="w-full mt-4 px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-[#112217] rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">info</span>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <CreateFlowModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              loadFlows();
            }}
          />
        )}

        {/* Details Modal */}
        {selectedFlow && (
          <FlowDetailsModal
            flow={selectedFlow}
            onClose={() => setSelectedFlow(null)}
          />
        )}
      </div>
    </div>
  );
};

// WhatsApp Flow Categories - Use enum values
const FLOW_CATEGORIES = Object.values(WhatsAppFlowCategory);

const EXAMPLE_FLOW_JSON = {
  version: '3.0',
  screens: [
    {
      id: 'START',
      title: 'Welcome',
      data: {},
      terminal: false,
      layout: {
        type: 'SingleColumnLayout',
        children: [
          {
            type: 'TextHeading',
            text: 'Welcome to our Flow',
          },
          {
            type: 'TextBody',
            text: 'This is an example flow structure',
          },
          {
            type: 'Footer',
            label: 'Continue',
            'on-click-action': {
              name: 'navigate',
              next: { type: 'screen', name: 'END' },
              payload: {},
            },
          },
        ],
      },
    },
    {
      id: 'END',
      title: 'Thank You',
      data: {},
      terminal: true,
      success: true,
      layout: {
        type: 'SingleColumnLayout',
        children: [
          {
            type: 'TextHeading',
            text: 'Thank You!',
          },
          {
            type: 'TextBody',
            text: 'Your submission has been received.',
          },
          {
            type: 'Footer',
            label: 'Done',
            'on-click-action': {
              name: 'complete',
              payload: {},
            },
          },
        ],
      },
    },
  ],
};

const CreateFlowModal = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categories: [] as WhatsAppFlowCategory[],
    flowJson: JSON.stringify(EXAMPLE_FLOW_JSON, null, 2),
    endpointUri: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.flowJson.trim()) {
      newErrors.flowJson = 'Flow JSON is required';
    } else {
      try {
        JSON.parse(formData.flowJson);
      } catch (e) {
        newErrors.flowJson = 'Invalid JSON format';
      }
    }

    if (formData.categories.length === 0) {
      newErrors.categories = 'At least one category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const flowJson = JSON.parse(formData.flowJson);

      await flowsApi.create({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        categories: formData.categories,
        flowJson,
        endpointUri: formData.endpointUri.trim() || undefined,
      });

      onSuccess();
    } catch (err: any) {
      setErrors({
        submit: err.message || 'Failed to create flow',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCategoryToggle = (category: WhatsAppFlowCategory) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto shadow-2xl">
        <div className="sticky top-0 bg-surface border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Create WhatsApp Flow</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg bg-zinc-900 text-white focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.name ? 'border-red-500' : 'border-zinc-700'
              }`}
              placeholder="Enter flow name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-zinc-300 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-zinc-700 rounded-lg bg-zinc-900 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter flow description"
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Categories <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {FLOW_CATEGORIES.map((category) => (
                <label
                  key={category}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="w-4 h-4 text-primary border-zinc-700 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-zinc-300">
                    {WHATSAPP_FLOW_CATEGORY_LABELS[category]}
                  </span>
                </label>
              ))}
            </div>
            {errors.categories && (
              <p className="mt-1 text-sm text-red-600">{errors.categories}</p>
            )}
          </div>

          {/* Endpoint URI */}
          <div>
            <label
              htmlFor="endpointUri"
              className="block text-sm font-medium text-zinc-300 mb-1"
            >
              Endpoint URI
            </label>
            <input
              type="text"
              id="endpointUri"
              value={formData.endpointUri}
              onChange={(e) => setFormData({ ...formData, endpointUri: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-700 rounded-lg bg-zinc-900 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://your-webhook-endpoint.com"
            />
            <p className="mt-1 text-xs text-zinc-400">
              Optional webhook endpoint URL for handling Flow responses
            </p>
          </div>

          {/* Flow JSON */}
          <div>
            <label
              htmlFor="flowJson"
              className="block text-sm font-medium text-zinc-300 mb-1"
            >
              Flow JSON <span className="text-red-500">*</span>
            </label>
            <textarea
              id="flowJson"
              value={formData.flowJson}
              onChange={(e) => setFormData({ ...formData, flowJson: e.target.value })}
              rows={15}
              className={`w-full px-3 py-2 border rounded-lg font-mono text-sm bg-zinc-900 text-white focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.flowJson ? 'border-red-500' : 'border-zinc-700'
              }`}
              placeholder="Enter Flow JSON structure"
            />
            {errors.flowJson && <p className="mt-1 text-sm text-red-600">{errors.flowJson}</p>}
            <p className="mt-1 text-xs text-zinc-400">
              Define your Flow structure in JSON format (WhatsApp Flow JSON 3.0)
            </p>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
              <span className="material-symbols-outlined">error</span>
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-[#112217] rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="animate-spin material-symbols-outlined text-sm">
                    progress_activity
                  </span>
                  Creating...
                </>
              ) : (
                'Create Flow'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FlowDetailsModal = ({
  flow,
  onClose,
}: {
  flow: WhatsAppFlow;
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-auto shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-white">{flow.name}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-300 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-zinc-300">Status</label>
            <div className="mt-1">
              <span className={`px-3 py-1 text-xs font-bold rounded-full inline-block ${
                flow.status === 'PUBLISHED' ? 'bg-green-900/30 text-green-400' :
                flow.status === 'DRAFT' ? 'bg-gray-900/30 text-gray-400' :
                flow.status === 'DEPRECATED' ? 'bg-red-900/30 text-red-400' :
                'bg-yellow-900/30 text-yellow-400'
              }`}>
                {flow.status}
              </span>
            </div>
          </div>

          {flow.description && (
            <div>
              <label className="text-sm font-medium text-zinc-300">Description</label>
              <div className="mt-1 text-zinc-400">{flow.description}</div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-zinc-300">Categories</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {flow.categories.map((cat) => (
                <span
                  key={cat}
                  className="px-2 py-1 text-xs bg-blue-900/30 text-blue-400 rounded"
                >
                  {WHATSAPP_FLOW_CATEGORY_LABELS[cat]}
                </span>
              ))}
            </div>
          </div>

          {flow.whatsappFlowId && (
            <div>
              <label className="text-sm font-medium text-zinc-300">
                WhatsApp Flow ID
              </label>
              <div className="mt-1 font-mono text-sm text-zinc-400">
                {flow.whatsappFlowId}
              </div>
            </div>
          )}

          {flow.endpointUri && (
            <div>
              <label className="text-sm font-medium text-zinc-300">Endpoint URI</label>
              <div className="mt-1 font-mono text-sm text-zinc-400">
                {flow.endpointUri}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-zinc-300">Flow JSON</label>
            <pre className="mt-1 p-3 bg-zinc-900 rounded text-xs overflow-auto max-h-96 text-zinc-100">
              {JSON.stringify(flow.flowJson, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
