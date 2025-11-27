/**
 * ComponentList Usage Examples
 *
 * This file demonstrates how to use the ComponentList component
 * with drag-and-drop reordering functionality.
 */

import React, { useState } from 'react';
import { ComponentList } from './ComponentList';
import { BuilderComponent } from '../../types';

/**
 * Example 1: Basic Component List
 */
export function BasicComponentListExample() {
  const [components, setComponents] = useState<BuilderComponent[]>([
    {
      id: 'comp-1',
      type: 'TextHeading',
      label: 'Welcome Message',
      config: {
        type: 'TextHeading',
        text: 'Welcome to our store!',
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
      label: 'Store Description',
      config: {
        type: 'TextBody',
        text: 'Find the best products at unbeatable prices.',
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
    },
    {
      id: 'comp-3',
      type: 'Image',
      label: 'Banner Image',
      config: {
        type: 'Image',
        src: 'https://example.com/banner.jpg',
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
    },
    {
      id: 'comp-4',
      type: 'Footer',
      label: 'Continue Button',
      config: {
        type: 'Footer',
        label: 'Continue Shopping',
        'on-click-action': {
          name: 'navigate',
          next: { name: 'PRODUCTS' },
        },
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
    },
  ]);

  const handleReorder = (newOrder: BuilderComponent[]) => {
    setComponents(newOrder);
    console.log('New order:', newOrder.map((c) => c.id));
  };

  const handleEdit = (id: string) => {
    console.log('Edit component:', id);
    // In a real app, this would open a component editor
  };

  const handleDelete = (id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
    console.log('Deleted component:', id);
  };

  const handleDuplicate = (id: string) => {
    const component = components.find((c) => c.id === id);
    if (!component) return;

    const duplicated: BuilderComponent = {
      ...component,
      id: `comp-${Date.now()}`,
      label: `${component.label} (Copy)`,
    };

    const index = components.findIndex((c) => c.id === id);
    const newComponents = [...components];
    newComponents.splice(index + 1, 0, duplicated);

    setComponents(newComponents);
    console.log('Duplicated component:', id);
  };

  return (
    <div className="w-96 p-4 bg-[#0d1912] min-h-screen">
      <h2 className="text-lg font-bold mb-4 text-white">
        Component List Example
      </h2>
      <ComponentList
        components={components}
        onReorder={handleReorder}
        onEditComponent={handleEdit}
        onDeleteComponent={handleDelete}
        onDuplicateComponent={handleDuplicate}
      />
    </div>
  );
}

/**
 * Example 2: Empty Component List
 */
export function EmptyComponentListExample() {
  const [components] = useState<BuilderComponent[]>([]);

  return (
    <div className="w-96 p-4 bg-[#0d1912] min-h-screen">
      <h2 className="text-lg font-bold mb-4 text-white">
        Empty Component List
      </h2>
      <ComponentList
        components={components}
        onReorder={() => {}}
        onEditComponent={() => {}}
        onDeleteComponent={() => {}}
        onDuplicateComponent={() => {}}
      />
    </div>
  );
}

/**
 * Example 3: Component List with Validation Errors
 */
export function ComponentListWithErrorsExample() {
  const [components, setComponents] = useState<BuilderComponent[]>([
    {
      id: 'comp-1',
      type: 'TextInput',
      label: 'Email Input',
      config: {
        type: 'TextInput',
        name: 'email',
        label: 'Email Address',
        required: true,
      },
      validation: {
        isValid: false,
        errors: ['Email validation pattern is missing', 'Input name conflicts with another component'],
        warnings: [],
      },
    },
    {
      id: 'comp-2',
      type: 'TextInput',
      label: 'Phone Input',
      config: {
        type: 'TextInput',
        name: 'phone',
        label: 'Phone Number',
        required: true,
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: ['Consider adding input mask for phone numbers'],
      },
    },
    {
      id: 'comp-3',
      type: 'Footer',
      label: 'Submit Button',
      config: {
        type: 'Footer',
        label: 'Submit',
        // Missing on-click-action
      },
      validation: {
        isValid: false,
        errors: ['Footer requires an on-click-action'],
        warnings: [],
      },
    },
  ]);

  return (
    <div className="w-96 p-4 bg-[#0d1912] min-h-screen">
      <h2 className="text-lg font-bold mb-4 text-white">
        Components with Validation Errors
      </h2>
      <ComponentList
        components={components}
        onReorder={setComponents}
        onEditComponent={(id) => console.log('Edit:', id)}
        onDeleteComponent={(id) => setComponents((prev) => prev.filter((c) => c.id !== id))}
        onDuplicateComponent={(id) => console.log('Duplicate:', id)}
      />
    </div>
  );
}

/**
 * Example 4: Component List with Hidden Components
 */
export function ComponentListWithHiddenExample() {
  const [components, setComponents] = useState<BuilderComponent[]>([
    {
      id: 'comp-1',
      type: 'TextHeading',
      label: 'Visible Heading',
      visible: true,
      config: {
        type: 'TextHeading',
        text: 'This heading is visible',
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
      label: 'Hidden Description',
      visible: false,
      config: {
        type: 'TextBody',
        text: 'This text is hidden in preview',
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
    },
    {
      id: 'comp-3',
      type: 'Footer',
      label: 'Visible Button',
      visible: true,
      config: {
        type: 'Footer',
        label: 'Continue',
        'on-click-action': {
          name: 'navigate',
          next: { name: 'NEXT_SCREEN' },
        },
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
    },
  ]);

  return (
    <div className="w-96 p-4 bg-[#0d1912] min-h-screen">
      <h2 className="text-lg font-bold mb-4 text-white">
        Components with Visibility Toggle
      </h2>
      <ComponentList
        components={components}
        onReorder={setComponents}
        onEditComponent={(id) => console.log('Edit:', id)}
        onDeleteComponent={(id) => setComponents((prev) => prev.filter((c) => c.id !== id))}
        onDuplicateComponent={(id) => console.log('Duplicate:', id)}
      />
    </div>
  );
}

/**
 * Example 5: All Component Types
 */
export function AllComponentTypesExample() {
  const [components] = useState<BuilderComponent[]>([
    // Text components
    {
      id: 'comp-1',
      type: 'TextHeading',
      label: 'Main Heading',
      config: { type: 'TextHeading', text: 'Welcome!' },
      validation: { isValid: true, errors: [], warnings: [] },
    },
    {
      id: 'comp-2',
      type: 'TextSubheading',
      label: 'Subheading',
      config: { type: 'TextSubheading', text: 'Get started below' },
      validation: { isValid: true, errors: [], warnings: [] },
    },
    {
      id: 'comp-3',
      type: 'TextBody',
      label: 'Body Text',
      config: { type: 'TextBody', text: 'This is body text' },
      validation: { isValid: true, errors: [], warnings: [] },
    },
    {
      id: 'comp-4',
      type: 'TextCaption',
      label: 'Caption',
      config: { type: 'TextCaption', text: 'Small caption text' },
      validation: { isValid: true, errors: [], warnings: [] },
    },
    // Input components
    {
      id: 'comp-5',
      type: 'TextInput',
      label: 'Text Input',
      config: { type: 'TextInput', name: 'name', label: 'Your Name' },
      validation: { isValid: true, errors: [], warnings: [] },
    },
    {
      id: 'comp-6',
      type: 'TextArea',
      label: 'Text Area',
      config: { type: 'TextArea', name: 'message', label: 'Your Message' },
      validation: { isValid: true, errors: [], warnings: [] },
    },
    // Selection components
    {
      id: 'comp-7',
      type: 'CheckboxGroup',
      label: 'Checkbox Group',
      config: { type: 'CheckboxGroup', name: 'interests', label: 'Select Interests' },
      validation: { isValid: true, errors: [], warnings: [] },
    },
    {
      id: 'comp-8',
      type: 'RadioButtonsGroup',
      label: 'Radio Buttons',
      config: { type: 'RadioButtonsGroup', name: 'size', label: 'Select Size' },
      validation: { isValid: true, errors: [], warnings: [] },
    },
    {
      id: 'comp-9',
      type: 'Dropdown',
      label: 'Dropdown',
      config: { type: 'Dropdown', name: 'country', label: 'Select Country' },
      validation: { isValid: true, errors: [], warnings: [] },
    },
    // Date components
    {
      id: 'comp-10',
      type: 'DatePicker',
      label: 'Date Picker',
      config: { type: 'DatePicker', name: 'date', label: 'Select Date' },
      validation: { isValid: true, errors: [], warnings: [] },
    },
    // Media components
    {
      id: 'comp-11',
      type: 'Image',
      label: 'Image',
      config: { type: 'Image', src: 'https://example.com/image.jpg' },
      validation: { isValid: true, errors: [], warnings: [] },
    },
    // Interactive components
    {
      id: 'comp-12',
      type: 'Footer',
      label: 'Footer Button',
      config: { type: 'Footer', label: 'Continue', 'on-click-action': { name: 'navigate' } },
      validation: { isValid: true, errors: [], warnings: [] },
    },
  ]);

  return (
    <div className="w-96 p-4 bg-[#0d1912] min-h-screen">
      <h2 className="text-lg font-bold mb-4 text-white">
        All Component Types
      </h2>
      <ComponentList
        components={components}
        onReorder={() => {}}
        onEditComponent={(id) => console.log('Edit:', id)}
        onDeleteComponent={() => {}}
        onDuplicateComponent={() => {}}
      />
    </div>
  );
}

/**
 * Example 6: Integration Test
 *
 * Shows how ComponentList can be tested with user interactions
 */
export function ComponentListIntegrationTest() {
  const [components, setComponents] = useState<BuilderComponent[]>([
    {
      id: 'comp-1',
      type: 'TextHeading',
      label: 'Component 1',
      config: { type: 'TextHeading', text: 'First' },
      validation: { isValid: true, errors: [], warnings: [] },
    },
    {
      id: 'comp-2',
      type: 'TextBody',
      label: 'Component 2',
      config: { type: 'TextBody', text: 'Second' },
      validation: { isValid: true, errors: [], warnings: [] },
    },
    {
      id: 'comp-3',
      type: 'Footer',
      label: 'Component 3',
      config: { type: 'Footer', label: 'Third' },
      validation: { isValid: true, errors: [], warnings: [] },
    },
  ]);

  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleReorder = (newOrder: BuilderComponent[]) => {
    setComponents(newOrder);
    addLog(`Reordered: ${newOrder.map((c) => c.label).join(' → ')}`);
  };

  const handleEdit = (id: string) => {
    const component = components.find((c) => c.id === id);
    addLog(`Edited: ${component?.label}`);
  };

  const handleDelete = (id: string) => {
    const component = components.find((c) => c.id === id);
    setComponents((prev) => prev.filter((c) => c.id !== id));
    addLog(`Deleted: ${component?.label}`);
  };

  const handleDuplicate = (id: string) => {
    const component = components.find((c) => c.id === id);
    if (!component) return;

    const duplicated: BuilderComponent = {
      ...component,
      id: `comp-${Date.now()}`,
      label: `${component.label} (Copy)`,
    };

    const index = components.findIndex((c) => c.id === id);
    const newComponents = [...components];
    newComponents.splice(index + 1, 0, duplicated);

    setComponents(newComponents);
    addLog(`Duplicated: ${component.label}`);
  };

  return (
    <div className="flex gap-4 p-4 bg-[#0d1912] min-h-screen">
      <div className="w-96">
        <h2 className="text-lg font-bold mb-4 text-white">
          Component List
        </h2>
        <ComponentList
          components={components}
          onReorder={handleReorder}
          onEditComponent={handleEdit}
          onDeleteComponent={handleDelete}
          onDuplicateComponent={handleDuplicate}
        />
      </div>
      <div className="flex-1">
        <h2 className="text-lg font-bold mb-4 text-white">
          Action Log
        </h2>
        <div className="bg-[#193322] rounded-lg border border-white/10 p-4">
          <div className="space-y-1 text-xs font-mono">
            {log.length === 0 ? (
              <p className="text-zinc-400">No actions yet</p>
            ) : (
              log.map((entry, index) => (
                <div key={index} className="text-zinc-300">
                  {entry}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
