/**
 * ComponentAccordion Usage Example
 *
 * This file demonstrates how to use ComponentAccordion and ComponentAccordionItem
 * in a real-world scenario with state management.
 */

import { useState } from 'react';
import { ComponentAccordion } from './ComponentAccordion';
import type { BuilderComponent } from '../../../types/builder.types';

/**
 * Example: Complete playground editor with component management
 */
export function PlaygroundEditorExample() {
  // Sample components
  const [components, setComponents] = useState<BuilderComponent[]>([
    {
      id: 'comp-1',
      type: 'TextHeading',
      config: {
        text: 'Welcome to our service',
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
    },
    {
      id: 'comp-2',
      type: 'TextBody',
      config: {
        text: 'Please fill out the form below to get started.',
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
    },
    {
      id: 'comp-3',
      type: 'TextInput',
      config: {
        name: 'email',
        label: 'Email Address',
        required: true,
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
    },
    {
      id: 'comp-4',
      type: 'RadioButtonsGroup',
      config: {
        name: 'subscription',
        label: 'Choose your plan',
        required: true,
        dataSource: [
          { id: 'free', title: 'Free Plan' },
          { id: 'pro', title: 'Pro Plan' },
          { id: 'enterprise', title: 'Enterprise Plan' },
        ],
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
    },
    {
      id: 'comp-5',
      type: 'Footer',
      config: {
        label: 'Submit',
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
    },
  ]);

  const [expandedComponentId, setExpandedComponentId] = useState<string | null>(null);

  /**
   * Handle component reordering
   */
  const handleReorderComponents = (newOrder: string[]) => {
    const reordered = newOrder
      .map((id) => components.find((c) => c.id === id))
      .filter((c): c is BuilderComponent => c !== undefined);
    setComponents(reordered);
  };

  /**
   * Handle component updates
   */
  const handleUpdateComponent = (
    componentId: string,
    updates: Partial<BuilderComponent>
  ) => {
    setComponents((prev) =>
      prev.map((c) => (c.id === componentId ? { ...c, ...updates } : c))
    );
  };

  /**
   * Handle component deletion
   */
  const handleDeleteComponent = (componentId: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== componentId));
    if (expandedComponentId === componentId) {
      setExpandedComponentId(null);
    }
  };

  /**
   * Handle component duplication
   */
  const handleDuplicateComponent = (componentId: string) => {
    const original = components.find((c) => c.id === componentId);
    if (!original) return;

    // Create duplicate with new ID
    const duplicate: BuilderComponent = {
      ...original,
      id: `comp-${Date.now()}`,
      label: original.label ? `${original.label} (Copy)` : undefined,
    };

    // Insert after original
    const index = components.findIndex((c) => c.id === componentId);
    setComponents((prev) => [
      ...prev.slice(0, index + 1),
      duplicate,
      ...prev.slice(index + 1),
    ]);
  };

  /**
   * Get preview text for a component
   */
  const getPreviewText = (component: BuilderComponent): string => {
    const config = component.config as any;

    // Try common properties
    if (config.text) return config.text;
    if (config.label) return config.label;
    if (config.name) return config.name;

    // For selection components, show option count
    if (config.dataSource && Array.isArray(config.dataSource)) {
      return `${config.dataSource.length} options`;
    }

    return '';
  };

  return (
    <div className="min-h-screen bg-zinc-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            Component Editor Example
          </h1>
          <p className="text-zinc-400">
            Drag to reorder, click to expand, use menu for actions
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 flex gap-4">
          <div className="bg-zinc-800 rounded-lg px-4 py-3">
            <div className="text-2xl font-bold text-white">{components.length}</div>
            <div className="text-xs text-zinc-400">Components</div>
          </div>
          <div className="bg-zinc-800 rounded-lg px-4 py-3">
            <div className="text-2xl font-bold text-white">
              {expandedComponentId ? '1' : '0'}
            </div>
            <div className="text-xs text-zinc-400">Expanded</div>
          </div>
        </div>

        {/* Component Accordion */}
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-white/10">
          <ComponentAccordion
            components={components}
            expandedComponentId={expandedComponentId}
            onExpandComponent={setExpandedComponentId}
            onUpdateComponent={handleUpdateComponent}
            onDeleteComponent={handleDeleteComponent}
            onDuplicateComponent={handleDuplicateComponent}
            onReorderComponents={handleReorderComponents}
            getPreviewText={getPreviewText}
          />
        </div>

        {/* Current Order Display */}
        <div className="mt-6 p-4 bg-zinc-800/30 rounded-lg border border-white/10">
          <h3 className="text-sm font-semibold text-zinc-300 mb-2">
            Current Order (for debugging)
          </h3>
          <pre className="text-xs text-zinc-500 overflow-x-auto">
            {JSON.stringify(
              components.map((c) => ({ id: c.id, type: c.type })),
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}

/**
 * Example: Minimal usage with fewer components
 */
export function MinimalExample() {
  const [components, setComponents] = useState<BuilderComponent[]>([
    {
      id: '1',
      type: 'TextHeading',
      config: { text: 'Hello World' },
      validation: { isValid: true, errors: [], warnings: [] },
    },
    {
      id: '2',
      type: 'TextInput',
      config: { name: 'name', label: 'Your Name' },
      validation: { isValid: true, errors: [], warnings: [] },
    },
  ]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <ComponentAccordion
      components={components}
      expandedComponentId={expandedId}
      onExpandComponent={setExpandedId}
      onUpdateComponent={(id, updates) => {
        setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
      }}
      onDeleteComponent={(id) => {
        setComponents((prev) => prev.filter((c) => c.id !== id));
      }}
      onDuplicateComponent={(id) => {
        const comp = components.find((c) => c.id === id);
        if (comp) {
          setComponents((prev) => [...prev, { ...comp, id: Date.now().toString() }]);
        }
      }}
      onReorderComponents={(order) => {
        setComponents(order.map((id) => components.find((c) => c.id === id)!));
      }}
      getPreviewText={(c) => (c.config as any).text || (c.config as any).label || ''}
    />
  );
}
