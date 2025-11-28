import { useState, useEffect } from 'react';

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

export interface SaveFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; categories: string[] }) => void;
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

  // Reset form when modal opens with initialName
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialName,
        categories: [],
      });
      setErrors({});
    }
  }, [isOpen, initialName]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Flow name is required';
    }

    if (formData.categories.length === 0) {
      newErrors.categories = 'At least one category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSave({
      name: formData.name.trim(),
      categories: formData.categories,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl">
        <div className="sticky top-0 bg-surface border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Save Flow</h2>
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
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
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
              <p className="mt-2 text-sm text-red-600">{errors.categories}</p>
            )}
            <p className="mt-2 text-xs text-zinc-400">
              Select at least one category that describes your flow
            </p>
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
