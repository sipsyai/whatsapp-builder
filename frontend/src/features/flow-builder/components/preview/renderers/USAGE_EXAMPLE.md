# WhatsApp Flow Preview Renderers - Usage Examples

This document provides practical examples of using the WhatsApp Flow component renderers.

## Table of Contents
1. [Basic Component Rendering](#basic-component-rendering)
2. [Complete Screen Preview](#complete-screen-preview)
3. [Form State Management](#form-state-management)
4. [Action Handling](#action-handling)
5. [Validation](#validation)
6. [Dynamic Data Sources](#dynamic-data-sources)

---

## Basic Component Rendering

### Rendering Text Components

```tsx
import { PreviewTextHeading, PreviewTextBody } from './renderers';
import type { TextHeading, TextBody } from '../../../types';

function ExampleTextComponents() {
  const heading: TextHeading = {
    type: 'TextHeading',
    text: 'Welcome to Our Service',
  };

  const body: TextBody = {
    type: 'TextBody',
    text: 'Please fill out the form below to get started.',
    'font-weight': 'normal',
  };

  return (
    <div>
      <PreviewTextHeading component={heading} />
      <PreviewTextBody component={body} />
    </div>
  );
}
```

### Rendering Input Components

```tsx
import { PreviewTextInput } from './renderers';
import type { TextInput } from '../../../types';
import { useState } from 'react';

function ExampleInputComponent() {
  const [email, setEmail] = useState('');

  const inputComponent: TextInput = {
    type: 'TextInput',
    name: 'email',
    label: 'Email Address',
    'input-type': 'email',
    required: true,
    'helper-text': 'We will never share your email',
    'max-chars': '100',
  };

  const handleChange = (name: string, value: string) => {
    if (name === 'email') {
      setEmail(value);
    }
  };

  return (
    <PreviewTextInput
      component={inputComponent}
      value={email}
      onChange={handleChange}
    />
  );
}
```

---

## Complete Screen Preview

### Full Flow Screen with Multiple Components

```tsx
import { getRendererForComponent } from './renderers';
import type { FlowScreen, Component } from '../../../types';
import { useState } from 'react';

interface FlowScreenPreviewProps {
  screen: FlowScreen;
}

function FlowScreenPreview({ screen }: FlowScreenPreviewProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const handleChange = (name: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAction = (actionName: string, payload?: unknown) => {
    console.log('Action:', actionName, payload);

    if (actionName === 'complete') {
      console.log('Form completed with data:', formData);
    }
  };

  const components = screen.layout.type === 'SingleColumnLayout'
    ? screen.layout.children
    : [];

  return (
    <div className="max-w-md mx-auto p-4 bg-white dark:bg-gray-800">
      <h1 className="text-2xl font-bold mb-4">{screen.title}</h1>

      {components.map((component, index) => {
        const RendererComponent = getRendererForComponent(component.type);

        if (!RendererComponent) return null;

        const componentName = 'name' in component ? component.name : undefined;

        return (
          <RendererComponent
            key={index}
            component={component}
            value={componentName ? formData[componentName] : undefined}
            onChange={handleChange}
            onAction={handleAction}
          />
        );
      })}
    </div>
  );
}
```

---

## Form State Management

### Centralized Form State with Validation

```tsx
import { useState, useCallback } from 'react';
import type { Component } from '../../../types';

interface FormState {
  data: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

function useFormState(components: Component[]) {
  const [state, setState] = useState<FormState>({
    data: {},
    errors: {},
    touched: {},
  });

  const setValue = useCallback((name: string, value: unknown) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, [name]: value },
      touched: { ...prev.touched, [name]: true },
    }));
  }, []);

  const setError = useCallback((name: string, error: string) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [name]: error },
    }));
  }, []);

  const clearError = useCallback((name: string) => {
    setState(prev => {
      const newErrors = { ...prev.errors };
      delete newErrors[name];
      return { ...prev, errors: newErrors };
    });
  }, []);

  const validate = useCallback(() => {
    const errors: Record<string, string> = {};

    components.forEach(component => {
      if ('name' in component && 'required' in component && component.required) {
        const value = state.data[component.name as string];

        if (!value || (Array.isArray(value) && value.length === 0)) {
          errors[component.name as string] = 'This field is required';
        }
      }

      // Add more validation rules here
      if (component.type === 'TextInput' && 'name' in component) {
        const name = component.name as string;
        const value = state.data[name] as string;

        if (value && component['input-type'] === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors[name] = 'Invalid email address';
          }
        }

        if (value && component['min-chars']) {
          const minChars = typeof component['min-chars'] === 'number'
            ? component['min-chars']
            : parseInt(component['min-chars'], 10);

          if (value.length < minChars) {
            errors[name] = `Minimum ${minChars} characters required`;
          }
        }
      }
    });

    setState(prev => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  }, [components, state.data]);

  return {
    formData: state.data,
    errors: state.errors,
    touched: state.touched,
    setValue,
    setError,
    clearError,
    validate,
  };
}

// Usage
function FormPreview({ screen }: { screen: FlowScreen }) {
  const components = screen.layout.type === 'SingleColumnLayout'
    ? screen.layout.children
    : [];

  const { formData, errors, setValue, validate } = useFormState(components);

  const handleSubmit = () => {
    if (validate()) {
      console.log('Form is valid:', formData);
    } else {
      console.log('Form has errors');
    }
  };

  return (
    <div>
      {/* Render components with formData and errors */}
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
```

---

## Action Handling

### Handling Different Action Types

```tsx
import { PreviewFooter, PreviewEmbeddedLink, PreviewOptIn } from './renderers';
import type { Footer, EmbeddedLink, OptIn, Action } from '../../../types';

function ActionHandlingExample() {
  const handleAction = (actionName: string, payload?: unknown) => {
    switch (actionName) {
      case 'navigate':
        // Navigate to another screen
        const navPayload = payload as { next: { name: string }; payload?: Record<string, unknown> };
        console.log('Navigate to:', navPayload.next.name);
        console.log('With data:', navPayload.payload);
        // router.push(navPayload.next.name);
        break;

      case 'complete':
        // Complete the flow
        console.log('Flow completed with data:', payload);
        // onFlowComplete(payload);
        break;

      case 'data_exchange':
        // Exchange data with server
        console.log('Data exchange:', payload);
        // api.exchangeData(payload);
        break;

      case 'update_data':
        // Update local form data
        console.log('Update data:', payload);
        // setFormData(prev => ({ ...prev, ...payload }));
        break;

      case 'open_url':
        // Open external URL
        const urlPayload = payload as { url: string };
        window.open(urlPayload.url, '_blank', 'noopener,noreferrer');
        break;

      default:
        console.warn('Unknown action:', actionName);
    }
  };

  const footerComponent: Footer = {
    type: 'Footer',
    label: 'Continue',
    enabled: true,
    'on-click-action': {
      name: 'navigate',
      next: { type: 'screen', name: 'CONFIRMATION' },
      payload: { step: 'completed' },
    },
  };

  const linkComponent: EmbeddedLink = {
    type: 'EmbeddedLink',
    text: 'Learn more about our privacy policy',
    'on-click-action': {
      name: 'open_url',
      payload: { url: 'https://example.com/privacy' },
    },
  };

  const optInComponent: OptIn = {
    type: 'OptIn',
    name: 'marketing_consent',
    label: 'I agree to receive marketing emails',
    'on-select-action': {
      name: 'update_data',
      payload: { marketing_consent: true },
    },
    'on-unselect-action': {
      name: 'update_data',
      payload: { marketing_consent: false },
    },
  };

  return (
    <div>
      <PreviewOptIn component={optInComponent} onAction={handleAction} />
      <PreviewEmbeddedLink component={linkComponent} onAction={handleAction} />
      <PreviewFooter component={footerComponent} onAction={handleAction} />
    </div>
  );
}
```

---

## Validation

### Real-time Validation with Error Display

```tsx
import { PreviewTextInput } from './renderers';
import type { TextInput } from '../../../types';
import { useState, useCallback } from 'react';

function ValidatedInput() {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const component: TextInput = {
    type: 'TextInput',
    name: 'password',
    label: 'Password',
    'input-type': 'password',
    required: true,
    'min-chars': '8',
    'helper-text': 'Must be at least 8 characters',
  };

  const validatePassword = useCallback((password: string) => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return '';
  }, []);

  const handleChange = useCallback((name: string, newValue: string) => {
    setValue(newValue);
    const validationError = validatePassword(newValue);
    setError(validationError);
  }, [validatePassword]);

  return (
    <PreviewTextInput
      component={component}
      value={value}
      onChange={handleChange}
      error={error}
    />
  );
}
```

---

## Dynamic Data Sources

### Loading Data Sources Dynamically

```tsx
import { PreviewDropdown, PreviewCheckboxGroup } from './renderers';
import type { Dropdown, CheckboxGroup, DataSourceItem } from '../../../types';
import { useState, useEffect } from 'react';

function DynamicDataSourceExample() {
  const [countries, setCountries] = useState<DataSourceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCountries([
        { id: 'us', title: 'United States', description: 'USA' },
        { id: 'uk', title: 'United Kingdom', description: 'UK' },
        { id: 'ca', title: 'Canada', description: 'CA' },
        { id: 'au', title: 'Australia', description: 'AU' },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const dropdownComponent: Dropdown = {
    type: 'Dropdown',
    label: 'Select your country',
    'data-source': countries,
    required: true,
  };

  const checkboxComponent: CheckboxGroup = {
    type: 'CheckboxGroup',
    name: 'interests',
    label: 'Select your interests',
    'data-source': countries, // Could be different data
    'min-selected-items': 1,
    'max-selected-items': 3,
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <PreviewDropdown component={dropdownComponent} />
      <PreviewCheckboxGroup component={checkboxComponent} />
    </div>
  );
}
```

### Resolving Dynamic Strings

```tsx
// Helper function to resolve dynamic strings like "${data.field}"
function resolveDynamicValue(
  value: string | number | boolean,
  data: Record<string, unknown>
): string | number | boolean {
  if (typeof value !== 'string') return value;

  // Check if it's a dynamic reference
  const dynamicPattern = /^\$\{data\.([a-zA-Z0-9_]+)\}$/;
  const match = value.match(dynamicPattern);

  if (match) {
    const fieldName = match[1];
    return data[fieldName] ?? value;
  }

  return value;
}

// Usage in component
function DynamicTextExample({ formData }: { formData: Record<string, unknown> }) {
  const component: TextBody = {
    type: 'TextBody',
    text: '${data.userName}', // Dynamic reference
  };

  const resolvedText = resolveDynamicValue(component.text, formData) as string;

  return (
    <PreviewTextBody
      component={{ ...component, text: resolvedText }}
    />
  );
}
```

---

## Complete Integration Example

### Full WhatsApp Flow Preview with All Features

```tsx
import { useState, useCallback } from 'react';
import { getRendererForComponent } from './renderers';
import type { FlowScreen, Component } from '../../../types';

interface CompleteFlowPreviewProps {
  screens: FlowScreen[];
  initialScreenId: string;
  onComplete: (data: Record<string, unknown>) => void;
}

function CompleteFlowPreview({
  screens,
  initialScreenId,
  onComplete,
}: CompleteFlowPreviewProps) {
  const [currentScreenId, setCurrentScreenId] = useState(initialScreenId);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<string[]>([initialScreenId]);

  const currentScreen = screens.find(s => s.id === currentScreenId);

  const handleChange = useCallback((name: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const handleAction = useCallback((actionName: string, payload?: unknown) => {
    switch (actionName) {
      case 'navigate':
        const navPayload = payload as { next: { name: string } };
        setCurrentScreenId(navPayload.next.name);
        setHistory(prev => [...prev, navPayload.next.name]);
        break;

      case 'complete':
        onComplete({ ...formData, ...payload });
        break;

      case 'data_exchange':
        // Implement data exchange logic
        console.log('Data exchange:', payload);
        break;

      case 'update_data':
        if (payload && typeof payload === 'object') {
          setFormData(prev => ({ ...prev, ...payload }));
        }
        break;

      case 'open_url':
        if (payload && 'url' in payload) {
          window.open((payload as { url: string }).url, '_blank');
        }
        break;
    }
  }, [formData, onComplete]);

  const handleBack = useCallback(() => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setCurrentScreenId(newHistory[newHistory.length - 1]);
    }
  }, [history]);

  if (!currentScreen) {
    return <div>Screen not found</div>;
  }

  const components = currentScreen.layout.type === 'SingleColumnLayout'
    ? currentScreen.layout.children
    : [];

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 min-h-screen">
      {/* Header */}
      <div className="bg-green-500 text-white p-4 flex items-center gap-3">
        {history.length > 1 && (
          <button onClick={handleBack} className="text-white">
            ← Back
          </button>
        )}
        <h1 className="text-xl font-semibold">{currentScreen.title}</h1>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {components.map((component, index) => {
          const RendererComponent = getRendererForComponent(component.type);

          if (!RendererComponent) {
            return (
              <div key={index} className="text-gray-500">
                Component {component.type} not supported
              </div>
            );
          }

          const componentName = 'name' in component ? component.name as string : undefined;

          return (
            <RendererComponent
              key={index}
              component={component}
              value={componentName ? formData[componentName] : undefined}
              onChange={handleChange}
              onAction={handleAction}
              error={componentName ? errors[componentName] : undefined}
            />
          );
        })}
      </div>

      {/* Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
        <details className="p-4 border-t">
          <summary className="cursor-pointer text-sm font-medium">Debug Info</summary>
          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify({ currentScreenId, formData, errors, history }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
```

---

## Summary

These examples demonstrate:

1. **Basic Rendering**: How to render individual components
2. **Form State**: Centralized state management with validation
3. **Actions**: Handling different action types (navigate, complete, etc.)
4. **Validation**: Real-time validation with error display
5. **Dynamic Data**: Loading and resolving dynamic data sources
6. **Complete Integration**: Full flow preview with all features combined

Use these patterns as a starting point for building your own WhatsApp Flow preview components!
