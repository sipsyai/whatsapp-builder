# useFlowValidation Hook

Real-time validation hook for WhatsApp Flow Builder that validates screens, components, and the entire flow structure according to WhatsApp's official specifications.

## Features

- Real-time validation with debouncing (300ms)
- Screen-level validation
- Component-level validation
- Character limit validation
- Data source limit validation
- Required field validation
- Terminal screen validation
- Footer component validation
- Nested If component validation
- Error and warning categorization
- Error filtering by screen or component

## Installation

The hook is already included in the Flow Builder feature. Import it from the hooks index:

```tsx
import { useFlowValidation } from '@/features/flow-builder/hooks';
```

## Usage

### Basic Usage

```tsx
import { useFlowValidation } from '@/features/flow-builder/hooks';

const MyComponent = ({ screens }) => {
  const {
    errors,
    isValidating,
    hasErrors,
    errorCount,
    warningCount,
  } = useFlowValidation(screens);

  return (
    <div>
      {hasErrors && (
        <div>Found {errorCount} errors</div>
      )}
    </div>
  );
};
```

### Validate Specific Screen

```tsx
const { validateScreen, getErrorsForScreen } = useFlowValidation(screens);

// Validate a specific screen
validateScreen('WELCOME');

// Get errors for a screen
const screenErrors = getErrorsForScreen('WELCOME');
```

### Validate Specific Component

```tsx
const { validateComponent, getErrorsForComponent } = useFlowValidation(screens);

// Validate a specific component
validateComponent('WELCOME', 'comp-123');

// Get errors for a component
const componentErrors = getErrorsForComponent('comp-123');
```

### Manual Validation

```tsx
const { validateAll, clearErrors } = useFlowValidation(screens);

// Manually trigger validation
validateAll();

// Clear all errors
clearErrors();
```

## API

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `screens` | `BuilderScreen[]` | Array of screens to validate |

### Return Value

```tsx
interface UseFlowValidationReturn {
  // Validation state
  errors: ValidationError[];
  isValidating: boolean;
  hasErrors: boolean;
  errorCount: number;
  warningCount: number;

  // Validation methods
  validateAll: () => void;
  validateScreen: (screenId: string) => void;
  validateComponent: (screenId: string, componentId: string) => void;
  clearErrors: () => void;

  // Error filtering
  getErrorsForScreen: (screenId: string) => ValidationError[];
  getErrorsForComponent: (componentId: string) => ValidationError[];
}
```

### ValidationError Type

```tsx
interface ValidationError {
  id: string;
  type: 'error' | 'warning';
  message: string;
  path: string; // e.g., "screens.WELCOME.components.0.label"
  screenId?: string;
  componentId?: string;
}
```

## Validation Rules

### Character Limits

The hook validates character limits for all component fields according to WhatsApp's specifications:

- **TextHeading**: 80 characters
- **TextSubheading**: 80 characters
- **TextBody**: 4096 characters
- **TextCaption**: 409 characters
- **TextInput label**: 20 characters
- **TextArea label**: 20 characters
- **Footer label**: 35 characters
- **CheckboxGroup label**: 30 characters
- **RadioButtonsGroup label**: 30 characters
- **Dropdown label**: 20 characters
- **DatePicker label**: 40 characters
- **CalendarPicker title**: 80 characters
- And more...

### Data Source Limits

Validates the number of options in components with data sources:

- **Dropdown**: 1-200 options (1-100 with images)
- **RadioButtonsGroup**: 1-20 options
- **CheckboxGroup**: 1-20 options
- **ChipsSelector**: 2-20 options
- **NavigationList**: 1-20 items

### Screen-Level Rules

- Maximum 50 components per screen
- Only 1 Footer component per screen
- Terminal screens must have a Footer
- NavigationList cannot be on terminal screens
- If components can only be nested up to 3 levels

### Required Fields

Validates that required fields are present:

- TextInput: `name`
- TextArea: `name`
- CheckboxGroup: `name`
- RadioButtonsGroup: `name`
- Dropdown: `name`
- Footer: `label`
- OptIn: `name`
- DatePicker: `name`
- CalendarPicker: `name`
- ChipsSelector: `name`
- EmbeddedLink: `text`, `url`

### If Component Rules

- If one branch has a Footer, both must have one
- Maximum 3 levels of nested If components

## Examples

See [useFlowValidation.example.tsx](./useFlowValidation.example.tsx) for complete examples including:

1. Basic validation status display
2. Validation panel with screen filtering
3. Screen card with validation badge
4. Component editor with inline validation
5. Flow builder with publish button
6. Real-time validation indicator
7. Validation toast notifications
8. Clear errors action

## Performance

The hook uses:

- **Debouncing**: Validates 300ms after changes to avoid excessive validation
- **Memoization**: Uses `useMemo` and `useCallback` for optimal performance
- **Selective Validation**: Can validate individual screens or components instead of the entire flow

## Testing

The hook includes comprehensive tests. Run tests with:

```bash
npm test useFlowValidation.test.ts
```

Test coverage includes:

- Initial validation
- Character limit validation
- Required field validation
- Data source validation
- Screen-level validation
- Validation by screen
- Validation by component
- Error filtering
- Clear errors
- Debounced validation
- Error and warning counts

## Related Files

- `/src/features/flow-builder/utils/validation-rules.ts` - Core validation rules
- `/src/features/flow-builder/constants/character-limits.ts` - Character limit constants
- `/src/features/flow-builder/constants/data-source-limits.ts` - Data source limit constants
- `/src/features/flow-builder/types/builder.types.ts` - Type definitions

## License

This hook is part of the WhatsApp Flow Builder project.
