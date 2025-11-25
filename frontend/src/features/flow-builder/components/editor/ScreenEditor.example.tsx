/**
 * ScreenEditor Usage Examples
 *
 * This file demonstrates how to use the ScreenEditor component
 * in a Flow Builder application.
 */

import React, { useState } from 'react';
import { ScreenEditor } from './ScreenEditor';
import { BuilderScreen, BuilderComponent } from '../../types';

/**
 * Example 1: Basic Screen Editor
 */
export function BasicScreenEditorExample() {
  const [screen, setScreen] = useState<BuilderScreen>({
    id: 'WELCOME',
    title: 'Welcome Screen',
    terminal: false,
    components: [
      {
        id: 'comp-1',
        type: 'TextHeading',
        label: 'Welcome!',
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
        label: 'Description',
        config: {
          type: 'TextBody',
          text: 'Browse our products below',
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
        label: 'Continue Button',
        config: {
          type: 'Footer',
          label: 'Continue',
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
    ],
    validation: {
      isValid: true,
      errors: [],
      warnings: [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const handleUpdateScreen = (updates: Partial<BuilderScreen>) => {
    setScreen((prev) => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleReorderComponents = (newOrder: BuilderComponent[]) => {
    setScreen((prev) => ({
      ...prev,
      components: newOrder,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleAddComponent = () => {
    const newComponent: BuilderComponent = {
      id: `comp-${Date.now()}`,
      type: 'TextBody',
      label: 'New Component',
      config: {
        type: 'TextBody',
        text: 'New text component',
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
    };

    setScreen((prev) => ({
      ...prev,
      components: [...prev.components, newComponent],
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleEditComponent = (componentId: string) => {
    console.log('Edit component:', componentId);
    // In a real app, this would open a component editor modal/panel
  };

  const handleDeleteComponent = (componentId: string) => {
    setScreen((prev) => ({
      ...prev,
      components: prev.components.filter((c) => c.id !== componentId),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleDuplicateComponent = (componentId: string) => {
    const component = screen.components.find((c) => c.id === componentId);
    if (!component) return;

    const duplicated: BuilderComponent = {
      ...component,
      id: `comp-${Date.now()}`,
      label: `${component.label} (Copy)`,
    };

    const index = screen.components.findIndex((c) => c.id === componentId);
    const newComponents = [...screen.components];
    newComponents.splice(index + 1, 0, duplicated);

    setScreen((prev) => ({
      ...prev,
      components: newComponents,
      updatedAt: new Date().toISOString(),
    }));
  };

  return (
    <div className="h-screen">
      <ScreenEditor
        screen={screen}
        onUpdateScreen={handleUpdateScreen}
        onAddComponent={handleAddComponent}
        onReorderComponents={handleReorderComponents}
        onEditComponent={handleEditComponent}
        onDeleteComponent={handleDeleteComponent}
        onDuplicateComponent={handleDuplicateComponent}
      />
    </div>
  );
}

/**
 * Example 2: Terminal Screen with Data API
 */
export function TerminalScreenExample() {
  const [screen, setScreen] = useState<BuilderScreen>({
    id: 'THANK_YOU',
    title: 'Thank You',
    terminal: true,
    data: {
      order_id: {
        type: 'string',
        __example__: '12345',
      },
      total: {
        type: 'number',
        __example__: 99.99,
      },
    },
    components: [
      {
        id: 'comp-1',
        type: 'TextHeading',
        label: 'Thank You Message',
        config: {
          type: 'TextHeading',
          text: 'Thank you for your order!',
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
        label: 'Order Details',
        config: {
          type: 'TextBody',
          text: 'Order #${data.order_id}',
        },
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
        },
      },
      {
        id: 'comp-3',
        type: 'TextCaption',
        label: 'Total Amount',
        config: {
          type: 'TextCaption',
          text: 'Total: $${data.total}',
        },
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
        },
      },
    ],
    validation: {
      isValid: true,
      errors: [],
      warnings: [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const handleUpdateScreen = (updates: Partial<BuilderScreen>) => {
    setScreen((prev) => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  };

  return (
    <div className="h-screen">
      <ScreenEditor
        screen={screen}
        onUpdateScreen={handleUpdateScreen}
        onAddComponent={() => {}}
        onReorderComponents={() => {}}
        onEditComponent={() => {}}
        onDeleteComponent={() => {}}
        onDuplicateComponent={() => {}}
      />
    </div>
  );
}

/**
 * Example 3: Screen with Validation Errors
 */
export function ScreenWithErrorsExample() {
  const [screen] = useState<BuilderScreen>({
    id: 'CHECKOUT',
    title: 'Checkout Form',
    terminal: false,
    components: [
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
          errors: ['Email validation pattern is missing'],
          warnings: ['Consider adding a placeholder text'],
        },
      },
      {
        id: 'comp-2',
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
    ],
    validation: {
      isValid: false,
      errors: [
        'Screen contains 2 components with validation errors',
        'Terminal screen is recommended for flows without navigation',
      ],
      warnings: ['Consider adding a heading component'],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return (
    <div className="h-screen">
      <ScreenEditor
        screen={screen}
        onUpdateScreen={() => {}}
        onAddComponent={() => {}}
        onReorderComponents={() => {}}
        onEditComponent={() => {}}
        onDeleteComponent={() => {}}
        onDuplicateComponent={() => {}}
      />
    </div>
  );
}

/**
 * Example 4: Empty Screen
 */
export function EmptyScreenExample() {
  const [screen, setScreen] = useState<BuilderScreen>({
    id: 'NEW_SCREEN',
    title: 'New Screen',
    terminal: false,
    components: [],
    validation: {
      isValid: false,
      errors: ['Screen must contain at least one component'],
      warnings: [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const handleAddComponent = () => {
    const newComponent: BuilderComponent = {
      id: `comp-${Date.now()}`,
      type: 'TextHeading',
      label: 'Welcome Heading',
      config: {
        type: 'TextHeading',
        text: 'Welcome!',
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
    };

    setScreen((prev) => ({
      ...prev,
      components: [newComponent],
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  return (
    <div className="h-screen">
      <ScreenEditor
        screen={screen}
        onUpdateScreen={(updates) => setScreen((prev) => ({ ...prev, ...updates }))}
        onAddComponent={handleAddComponent}
        onReorderComponents={(newOrder) =>
          setScreen((prev) => ({ ...prev, components: newOrder }))
        }
        onEditComponent={() => {}}
        onDeleteComponent={(id) =>
          setScreen((prev) => ({
            ...prev,
            components: prev.components.filter((c) => c.id !== id),
          }))
        }
        onDuplicateComponent={() => {}}
      />
    </div>
  );
}

/**
 * Example 5: Integration with State Management
 *
 * Shows how to integrate ScreenEditor with a global state management system
 * like Redux or Zustand.
 */
export function IntegratedScreenEditorExample() {
  // In a real app, these would be Redux actions or Zustand setters
  const dispatch = (action: any) => {
    console.log('Dispatching action:', action);
  };

  // Mock screen data (would come from Redux/Zustand store)
  const screen: BuilderScreen = {
    id: 'PRODUCTS',
    title: 'Product Catalog',
    terminal: false,
    components: [],
    validation: {
      isValid: true,
      errors: [],
      warnings: [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="h-screen">
      <ScreenEditor
        screen={screen}
        onUpdateScreen={(updates) =>
          dispatch({
            type: 'UPDATE_SCREEN',
            payload: { screenId: screen.id, updates },
          })
        }
        onAddComponent={() =>
          dispatch({
            type: 'ADD_COMPONENT',
            payload: { screenId: screen.id },
          })
        }
        onReorderComponents={(newOrder) =>
          dispatch({
            type: 'REORDER_COMPONENTS',
            payload: { screenId: screen.id, newOrder },
          })
        }
        onEditComponent={(componentId) =>
          dispatch({
            type: 'SELECT_COMPONENT',
            payload: { componentId },
          })
        }
        onDeleteComponent={(componentId) =>
          dispatch({
            type: 'DELETE_COMPONENT',
            payload: { screenId: screen.id, componentId },
          })
        }
        onDuplicateComponent={(componentId) =>
          dispatch({
            type: 'DUPLICATE_COMPONENT',
            payload: { screenId: screen.id, componentId },
          })
        }
      />
    </div>
  );
}
