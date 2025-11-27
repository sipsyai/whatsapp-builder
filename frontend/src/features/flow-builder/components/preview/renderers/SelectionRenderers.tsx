/**
 * WhatsApp Flow Preview - Selection Component Renderers
 *
 * Renders selection components (Dropdown, RadioButtonsGroup, CheckboxGroup, ChipsSelector)
 * with WhatsApp-like styling and form state management.
 */

import React, { useCallback } from 'react';
import type { Dropdown, RadioButtonsGroup, CheckboxGroup, ChipsSelector, DataSourceItem } from '../../../types';

// ============================================================================
// Common Props Interface
// ============================================================================

interface BaseSelectionRendererProps {
  value?: string | string[];
  onChange?: (name: string, value: string | string[]) => void;
  visible?: boolean | string;
  error?: string;
}

// ============================================================================
// Helper: Extract Data Source Items
// ============================================================================

function getDataSourceItems(dataSource: DataSourceItem[] | string | undefined): DataSourceItem[] {
  // If undefined or null, return empty array
  if (!dataSource) {
    return [];
  }
  // If dynamic string, return empty array (will be populated at runtime)
  if (typeof dataSource === 'string') {
    return [];
  }
  return dataSource;
}

// ============================================================================
// Dropdown Renderer
// ============================================================================

interface PreviewDropdownProps extends BaseSelectionRendererProps {
  component: Dropdown;
}

export const PreviewDropdown: React.FC<PreviewDropdownProps> = ({
  component,
  value = '',
  onChange,
  visible = true,
  error,
}) => {
  const isVisible = typeof visible === 'string' ? true : visible;
  if (!isVisible || component.visible === false) return null;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onChange) {
        onChange(component.label, e.target.value);
      }
    },
    [onChange, component.label]
  );

  const items = getDataSourceItems(component['data-source']);
  const isRequired = component.required === true;
  const isEnabled = component.enabled !== false;
  const errorMessage = error || component['error-message'];
  const selectedValue = (value as string) || component['init-value'] || '';

  return (
    <div className="mb-4">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {component.label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Select Box */}
      <select
        value={selectedValue}
        onChange={handleChange}
        required={isRequired}
        disabled={!isEnabled}
        className={`w-full px-3 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 ${
          errorMessage
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-600 focus:ring-green-500 focus:border-green-500'
        } bg-gray-800 text-white ${
          !isEnabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <option value="">Select an option</option>
        {items.map((item) => (
          <option key={item.id} value={item.id} disabled={item.enabled === false}>
            {item.title}
          </option>
        ))}
      </select>

      {/* Error Message */}
      {errorMessage && <p className="mt-1 text-xs text-red-500">{errorMessage}</p>}
    </div>
  );
};

// ============================================================================
// RadioButtonsGroup Renderer
// ============================================================================

interface PreviewRadioButtonsGroupProps extends BaseSelectionRendererProps {
  component: RadioButtonsGroup;
}

export const PreviewRadioButtonsGroup: React.FC<PreviewRadioButtonsGroupProps> = ({
  component,
  value = [],
  onChange,
  visible = true,
  error,
}) => {
  const isVisible = typeof visible === 'string' ? true : visible;
  if (!isVisible || component.visible === false) return null;

  const handleChange = useCallback(
    (itemId: string) => {
      if (onChange && component.name) {
        onChange(component.name, [itemId]);
      }
    },
    [onChange, component.name]
  );

  const items = getDataSourceItems(component['data-source']);
  const isRequired = component.required === true;
  const isEnabled = component.enabled !== false;
  const errorMessage = error || component['error-message'];
  const selectedValue = Array.isArray(value) ? value[0] : value;
  const initValue = component['init-value'];
  const selected = selectedValue || (Array.isArray(initValue) ? initValue[0] : '');

  return (
    <div className="mb-4">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {component.label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Description */}
      {component.description && (
        <p className="text-xs text-gray-400 mb-3">{component.description}</p>
      )}

      {/* Radio Options */}
      <div className="space-y-2">
        {items.map((item) => {
          const isSelected = selected === item.id;
          const isItemEnabled = isEnabled && item.enabled !== false;

          return (
            <label
              key={item.id}
              className={`flex items-start p-3 border rounded-lg transition-all cursor-pointer ${
                isSelected
                  ? 'border-green-500 bg-green-900/20'
                  : 'border-gray-600 hover:border-green-300'
              } ${!isItemEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => isItemEnabled && handleChange(item.id)}
            >
              <input
                type="radio"
                name={component.name}
                value={item.id}
                checked={isSelected}
                disabled={!isItemEnabled}
                onChange={() => {}}
                className="mt-1 w-4 h-4 text-green-500 focus:ring-green-500 border-gray-300"
              />
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {/* Error Message */}
      {errorMessage && <p className="mt-2 text-xs text-red-500">{errorMessage}</p>}
    </div>
  );
};

// ============================================================================
// CheckboxGroup Renderer
// ============================================================================

interface PreviewCheckboxGroupProps extends BaseSelectionRendererProps {
  component: CheckboxGroup;
}

export const PreviewCheckboxGroup: React.FC<PreviewCheckboxGroupProps> = ({
  component,
  value = [],
  onChange,
  visible = true,
  error,
}) => {
  const isVisible = typeof visible === 'string' ? true : visible;
  if (!isVisible || component.visible === false) return null;

  const handleChange = useCallback(
    (itemId: string, checked: boolean) => {
      if (onChange && component.name) {
        const currentValues = Array.isArray(value) ? value : [];
        const newValues = checked
          ? [...currentValues, itemId]
          : currentValues.filter((id) => id !== itemId);
        onChange(component.name, newValues);
      }
    },
    [onChange, component.name, value]
  );

  const items = getDataSourceItems(component['data-source']);
  const isRequired = component.required === true;
  const isEnabled = component.enabled !== false;
  const errorMessage = error || component['error-message'];
  const selectedValues = Array.isArray(value) ? value : [];
  const initValue = component['init-value'];
  const selected = selectedValues.length > 0 ? selectedValues : (Array.isArray(initValue) ? initValue : []);

  return (
    <div className="mb-4">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {component.label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Description */}
      {component.description && (
        <p className="text-xs text-gray-400 mb-3">{component.description}</p>
      )}

      {/* Checkbox Options */}
      <div className="space-y-2">
        {items.map((item) => {
          const isSelected = selected.includes(item.id);
          const isItemEnabled = isEnabled && item.enabled !== false;

          return (
            <label
              key={item.id}
              className={`flex items-start p-3 border rounded-lg transition-all cursor-pointer ${
                isSelected
                  ? 'border-green-500 bg-green-900/20'
                  : 'border-gray-600 hover:border-green-300'
              } ${!isItemEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => isItemEnabled && handleChange(item.id, !isSelected)}
            >
              <input
                type="checkbox"
                name={component.name}
                value={item.id}
                checked={isSelected}
                disabled={!isItemEnabled}
                onChange={() => {}}
                className="mt-1 w-4 h-4 text-green-500 focus:ring-green-500 border-gray-300 rounded"
              />
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {/* Error Message */}
      {errorMessage && <p className="mt-2 text-xs text-red-500">{errorMessage}</p>}
    </div>
  );
};

// ============================================================================
// ChipsSelector Renderer
// ============================================================================

interface PreviewChipsSelectorProps extends BaseSelectionRendererProps {
  component: ChipsSelector;
}

export const PreviewChipsSelector: React.FC<PreviewChipsSelectorProps> = ({
  component,
  value = [],
  onChange,
  visible = true,
  error,
}) => {
  const isVisible = typeof visible === 'string' ? true : visible;
  if (!isVisible || component.visible === false) return null;

  const handleChange = useCallback(
    (itemId: string, selected: boolean) => {
      if (onChange && component.name) {
        const currentValues = Array.isArray(value) ? value : [];
        const newValues = selected
          ? [...currentValues, itemId]
          : currentValues.filter((id) => id !== itemId);
        onChange(component.name, newValues);
      }
    },
    [onChange, component.name, value]
  );

  const items = getDataSourceItems(component['data-source']);
  const isRequired = component.required === true;
  const isEnabled = component.enabled !== false;
  const errorMessage = error || component['error-message'];
  const selectedValues = Array.isArray(value) ? value : [];
  const initValue = component['init-value'];
  const selected = selectedValues.length > 0 ? selectedValues : (Array.isArray(initValue) ? initValue : []);

  return (
    <div className="mb-4">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {component.label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Description */}
      {component.description && (
        <p className="text-xs text-gray-400 mb-3">{component.description}</p>
      )}

      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const isSelected = selected.includes(item.id);
          const isItemEnabled = isEnabled && item.enabled !== false;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => isItemEnabled && handleChange(item.id, !isSelected)}
              disabled={!isItemEnabled}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              } ${!isItemEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {item.title}
            </button>
          );
        })}
      </div>

      {/* Error Message */}
      {errorMessage && <p className="mt-2 text-xs text-red-500">{errorMessage}</p>}
    </div>
  );
};
