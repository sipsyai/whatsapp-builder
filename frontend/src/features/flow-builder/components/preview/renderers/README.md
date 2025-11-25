# WhatsApp Flow Preview Component Renderers

This directory contains renderer components for WhatsApp Flow components in the preview panel.

## Overview

Each renderer component takes a WhatsApp Flow component configuration and renders it with WhatsApp-like styling. Renderers handle form state, validation, user interactions, and visual feedback.

## File Structure

```
renderers/
├── index.ts                  # Central exports and component type mapping
├── TextRenderers.tsx         # Text components (Heading, Subheading, Body, Caption)
├── InputRenderers.tsx        # Input components (TextInput, TextArea)
├── SelectionRenderers.tsx    # Selection components (Dropdown, Radio, Checkbox, Chips)
└── ActionRenderers.tsx       # Action components (Footer, OptIn, EmbeddedLink)
```

## Components

### Text Renderers (`TextRenderers.tsx`)

- **PreviewTextHeading**: Large, bold heading text
- **PreviewTextSubheading**: Medium, semibold subheading text
- **PreviewTextBody**: Normal body text with font-weight and strikethrough support
- **PreviewTextCaption**: Small, gray caption text

### Input Renderers (`InputRenderers.tsx`)

- **PreviewTextInput**: Text input field with label, validation, and helper text
  - Supports different input types (text, email, phone, password, etc.)
  - Character count display
  - Error message display
  - Required field indicator

- **PreviewTextArea**: Multi-line text area with similar features
  - Character limit display
  - Enabled/disabled state
  - Auto-resize height

### Selection Renderers (`SelectionRenderers.tsx`)

- **PreviewDropdown**: Classic select dropdown
  - Disabled options support
  - Required field indicator
  - Error states

- **PreviewRadioButtonsGroup**: Radio button list with cards
  - Single selection
  - Visual selection feedback
  - Description text support

- **PreviewCheckboxGroup**: Checkbox list with cards
  - Multiple selection
  - Min/max selection limits
  - Visual selection feedback

- **PreviewChipsSelector**: Chip-based selection UI
  - Multiple selection with chips
  - WhatsApp green selection color
  - Compact, horizontal layout

### Action Renderers (`ActionRenderers.tsx`)

- **PreviewFooter**: Bottom CTA button
  - WhatsApp green styling
  - Sticky positioning
  - Caption support (left, center, right)
  - Action dispatching

- **PreviewOptIn**: Checkbox with label
  - Required field support
  - On-select/on-unselect actions
  - Clickable label with link action

- **PreviewEmbeddedLink**: Inline link text
  - Navigation or URL opening
  - External link indicator icon
  - Hover effects

## Usage

### Direct Component Usage

```tsx
import { PreviewTextHeading, PreviewTextInput } from './renderers';
import type { TextHeading, TextInput } from '../../../types';

const headingComponent: TextHeading = {
  type: 'TextHeading',
  text: 'Welcome to Our Service',
};

const inputComponent: TextInput = {
  type: 'TextInput',
  name: 'email',
  label: 'Email Address',
  'input-type': 'email',
  required: true,
  'helper-text': 'We will never share your email',
};

function MyPreview() {
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <PreviewTextHeading component={headingComponent} />
      <PreviewTextInput
        component={inputComponent}
        value={formData.email}
        onChange={handleChange}
      />
    </div>
  );
}
```

### Dynamic Rendering with Mapping

```tsx
import { getRendererForComponent } from './renderers';
import type { Component } from '../../../types';

interface PreviewProps {
  components: Component[];
  formData: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  onAction: (actionName: string, payload?: unknown) => void;
}

function DynamicPreview({ components, formData, onChange, onAction }: PreviewProps) {
  return (
    <div className="space-y-4">
      {components.map((component, index) => {
        const RendererComponent = getRendererForComponent(component.type);

        if (!RendererComponent) {
          console.warn(`No renderer found for component type: ${component.type}`);
          return null;
        }

        return (
          <RendererComponent
            key={index}
            component={component}
            value={formData[component.name]}
            onChange={onChange}
            onAction={onAction}
          />
        );
      })}
    </div>
  );
}
```

### Category-Based Rendering

```tsx
import { getComponentCategory, isComponentInCategory } from './renderers';

function CategoryPreview({ components }: { components: Component[] }) {
  const textComponents = components.filter(c => isComponentInCategory(c.type, 'text'));
  const inputComponents = components.filter(c => isComponentInCategory(c.type, 'input'));

  return (
    <div>
      <section>
        <h3>Text Content</h3>
        {textComponents.map((component, i) => (
          <RenderComponent key={i} component={component} />
        ))}
      </section>

      <section>
        <h3>Form Inputs</h3>
        {inputComponents.map((component, i) => (
          <RenderComponent key={i} component={component} />
        ))}
      </section>
    </div>
  );
}
```

## Props Interface

### Common Props

All renderers accept these common props:

- `component`: The WhatsApp Flow component configuration
- `visible`: Boolean or dynamic string for visibility control (default: true)

### Form Component Props

Input and selection renderers also accept:

- `value`: Current value (string for inputs, string[] for multi-select)
- `onChange`: Callback when value changes: `(name: string, value: string | string[]) => void`
- `error`: Error message to display

### Action Component Props

Action renderers also accept:

- `onAction`: Callback when action is triggered: `(actionName: string, payload?: unknown) => void`

## Styling

All renderers use Tailwind CSS for styling with:

- **WhatsApp Green**: `#25D366` or Tailwind's `green-500` for primary actions
- **Dark Mode Support**: All components support dark mode via `dark:` classes
- **Responsive**: Components are mobile-first responsive
- **Accessibility**: Proper ARIA labels and keyboard navigation

### Color Palette

```css
/* WhatsApp Colors */
Primary Green: #25D366 (green-500)
Dark Green: #128C7E (green-600)
Light Green: #DCF8C6 (green-50)

/* Text Colors */
Primary: text-gray-900 dark:text-white
Secondary: text-gray-700 dark:text-gray-300
Muted: text-gray-500 dark:text-gray-400

/* Borders */
Border: border-gray-300 dark:border-gray-600
Focus: border-green-500 ring-green-500

/* Error */
Error: text-red-500 border-red-500
```

## Form State Management

For complete forms, use a centralized state management approach:

```tsx
import { useState } from 'react';

function FlowPreview({ screen }: { screen: FlowScreen }) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (name: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAction = (actionName: string, payload?: unknown) => {
    if (actionName === 'complete') {
      // Validate form
      const newErrors = validateForm(formData, screen.layout.children);
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      // Submit form
      console.log('Form submitted:', formData);
    } else if (actionName === 'navigate') {
      // Navigate to next screen
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      {screen.layout.children.map((component, index) => {
        const RendererComponent = getRendererForComponent(component.type);
        return (
          <RendererComponent
            key={index}
            component={component}
            value={formData[component.name]}
            onChange={handleChange}
            onAction={handleAction}
            error={errors[component.name]}
          />
        );
      })}
    </div>
  );
}
```

## Unsupported Components

The following component types do not have renderers yet:

- `RichText`
- `DatePicker`
- `CalendarPicker`
- `Image`
- `ImageCarousel`
- `NavigationList`
- `If` (conditional)
- `Switch` (conditional)

These will need to be implemented in future iterations.

## Testing

Test renderers with different configurations:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PreviewTextInput } from './InputRenderers';

test('renders text input with label', () => {
  const component: TextInput = {
    type: 'TextInput',
    name: 'username',
    label: 'Username',
    required: true,
  };

  render(<PreviewTextInput component={component} />);
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
});

test('calls onChange when input changes', () => {
  const onChange = jest.fn();
  const component: TextInput = {
    type: 'TextInput',
    name: 'username',
    label: 'Username',
  };

  render(<PreviewTextInput component={component} onChange={onChange} />);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'john' } });
  expect(onChange).toHaveBeenCalledWith('username', 'john');
});
```

## Best Practices

1. **Always handle visibility**: Check `visible` prop before rendering
2. **Use controlled inputs**: Always pass `value` and `onChange` for form components
3. **Handle dynamic values**: Support both static values and dynamic strings (e.g., `"${data.field}"`)
4. **Validate on blur**: Validate form fields on blur for better UX
5. **Show error states**: Display error messages clearly with red colors
6. **Support dark mode**: All renderers should work in dark mode
7. **Use semantic HTML**: Use proper HTML elements for accessibility
8. **Keyboard navigation**: Ensure all interactive elements are keyboard accessible

## Future Enhancements

- [ ] Add animation transitions
- [ ] Implement date picker components
- [ ] Add media component renderers (Image, ImageCarousel)
- [ ] Support conditional rendering (If, Switch)
- [ ] Add navigation list renderer
- [ ] Implement RichText with markdown support
- [ ] Add validation helpers
- [ ] Improve accessibility (ARIA labels, keyboard shortcuts)
- [ ] Add loading states for async data sources
- [ ] Support dynamic data source resolution
