import { useState, useEffect } from 'react';
import { flowsApi, type WhatsAppFlow } from '../api';

export const FlowsPage = () => {
  const [flows, setFlows] = useState<WhatsAppFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<WhatsAppFlow | null>(null);

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
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp Flows</h1>
            <p className="text-sm text-gray-600 mt-1">
              Create and manage interactive WhatsApp Flows
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Create Flow
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">Loading...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {!loading && !error && flows.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-gray-300">
              check_box
            </span>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Flows yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Create your first WhatsApp Flow to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              Create Flow
            </button>
          </div>
        )}

        {!loading && !error && flows.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flows.map((flow) => (
              <div
                key={flow.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{flow.name}</h3>
                    {flow.description && (
                      <p className="text-sm text-gray-600 mt-1">{flow.description}</p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadgeClass(flow.status)}`}
                  >
                    {flow.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {flow.categories.map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded"
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex gap-2">
                    {flow.status === 'DRAFT' && (
                      <button
                        onClick={() => handlePublish(flow.id)}
                        className="text-xs text-green-600 hover:text-green-700"
                        title="Publish Flow"
                      >
                        <span className="material-symbols-outlined text-lg">publish</span>
                      </button>
                    )}
                    {flow.previewUrl && (
                      <button
                        onClick={() => handlePreview(flow.id)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                        title="Preview Flow"
                      >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedFlow(flow)}
                      className="text-xs text-gray-600 hover:text-gray-700"
                      title="View Details"
                    >
                      <span className="material-symbols-outlined text-lg">info</span>
                    </button>
                  </div>
                  <button
                    onClick={() => handleDelete(flow.id)}
                    className="text-xs text-red-600 hover:text-red-700"
                    title="Delete Flow"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
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
  );
};

// Placeholder modals
const CreateFlowModal = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-xl font-bold mb-4">Create WhatsApp Flow</h2>
        <p className="text-gray-600 mb-4">
          Flow creation UI coming soon. You can create Flows using the WhatsApp Flow
          Builder and they will appear here once created via the API.
        </p>
        <button
          onClick={onClose}
          className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
        >
          Close
        </button>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-auto">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold">{flow.name}</h2>
          <button onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <div className="mt-1">{flow.status}</div>
          </div>

          {flow.description && (
            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <div className="mt-1 text-gray-600">{flow.description}</div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Categories</label>
            <div className="mt-1 flex gap-2">
              {flow.categories.map((cat) => (
                <span
                  key={cat}
                  className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {flow.whatsappFlowId && (
            <div>
              <label className="text-sm font-medium text-gray-700">
                WhatsApp Flow ID
              </label>
              <div className="mt-1 font-mono text-sm text-gray-600">
                {flow.whatsappFlowId}
              </div>
            </div>
          )}

          {flow.endpointUri && (
            <div>
              <label className="text-sm font-medium text-gray-700">Endpoint URI</label>
              <div className="mt-1 font-mono text-sm text-gray-600">
                {flow.endpointUri}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Flow JSON</label>
            <pre className="mt-1 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(flow.flowJson, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
