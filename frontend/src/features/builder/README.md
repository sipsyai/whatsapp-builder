# Chatbot Flow Builder

Visual drag-and-drop interface for building WhatsApp chatbot conversation flows using ReactFlow.

## Directory Structure

```
builder/
├── constants/
│   ├── character-limits.ts      # Character limits for all components
│   ├── data-source-limits.ts    # Data source and other component limits
│   ├── component-defaults.ts    # Default values for all component types
│   └── index.ts                 # Re-exports all constants
├── utils/
│   ├── validation-rules.ts      # Validation functions and rules
│   ├── validation-examples.ts   # Usage examples
│   └── index.ts                 # Re-exports validation utilities
└── README.md                    # This file
```

## Files Overview

### 1. `constants/character-limits.ts`

Contains character limits for all WhatsApp Flow components.

**Features:**
- Character limits for each component type and field
- Helper functions: `getCharacterLimit()`, `isTextWithinLimit()`, `getRemainingCharacters()`

**Example:**
```typescript
import { CHARACTER_LIMITS, isTextWithinLimit, getRemainingCharacters } from '@/features/builder/constants';

// Check if text is within limit
const isValid = isTextWithinLimit('Hello', 'TextInput', 'label'); // true

// Get remaining characters
const remaining = getRemainingCharacters('Hello', 'TextInput', 'label'); // 15 (20 - 5)

// Direct access to limits
const limit = CHARACTER_LIMITS.TextInput.label; // 20
```

### 2. `constants/data-source-limits.ts`

Contains data source limits and other component-level restrictions.

**Features:**
- Min/max limits for data sources (Dropdown, RadioButtonsGroup, CheckboxGroup, etc.)
- Image size limits
- Other component limits (max components per screen, max OptIns, etc.)
- Helper functions: `getDataSourceLimits()`, `isDataSourceCountValid()`, `getDataSourceValidationMessage()`

**Example:**
```typescript
import { DATA_SOURCE_LIMITS, isDataSourceCountValid, OTHER_LIMITS } from '@/features/builder/constants';

// Check if data source count is valid
const isValid = isDataSourceCountValid('Dropdown', 150, false); // true
const isValidWithImages = isDataSourceCountValid('Dropdown', 150, true); // false (max 100 with images)

// Get validation message
const message = getDataSourceValidationMessage('RadioButtonsGroup', 25, false);
// "RadioButtonsGroup can have maximum 20 options"

// Access other limits
const maxComponents = OTHER_LIMITS.maxComponentsPerScreen; // 50
const maxNestedIf = OTHER_LIMITS.maxNestedIfComponents; // 3
```

### 3. `constants/component-defaults.ts`

Contains default values for all component types.

**Features:**
- Default values for every WhatsApp Flow component
- Helper functions: `getComponentDefaults()`, `createComponent()`
- Default data source and list items

**Example:**
```typescript
import { COMPONENT_DEFAULTS, createComponent } from '@/features/builder/constants';

// Create a new component with defaults
const textInput = createComponent('TextInput', {
  label: 'Email',
  name: 'email',
  inputType: 'email',
});
// Result: { type: 'TextInput', label: 'Email', name: 'email', inputType: 'email', required: false, visible: true, maxChars: '80' }

// Get defaults only
const defaults = getComponentDefaults('Footer');
```

### 4. `utils/validation-rules.ts`

Contains validation functions and rules for components and screens.

**Features:**
- Character limit validation
- Data source count validation
- Screen-level validation (max components, single footer, terminal screen rules)
- If component validation (footer in both branches, nesting limit)
- Comprehensive validation result types

**Example:**
```typescript
import {
  validateCharacterLimit,
  validateDataSourceCount,
  validateScreen,
  ValidationErrorType,
} from '@/features/builder/utils';

// Validate character limit
const error = validateCharacterLimit(
  'This is a very long label that exceeds the limit',
  'TextInput',
  'label',
  'screen1/components[0]/label'
);

if (error) {
  console.log(error.message);
  // "label exceeds character limit of 20 characters (current: 48)"
}

// Validate entire screen
const result = validateScreen({
  components: screenComponents,
  isTerminal: true,
  path: 'screens/WELCOME',
});

if (!result.valid) {
  result.errors.forEach(error => {
    console.log(`${error.type}: ${error.message}`);
  });
}
```

## Validation Rules

### Screen Rules

1. **MAX_COMPONENTS_PER_SCREEN**: Maximum 50 components per screen
2. **SINGLE_FOOTER_PER_SCREEN**: Only one Footer component per screen
3. **TERMINAL_SCREEN_REQUIRES_FOOTER**: Terminal screens must have a Footer
4. **NAVIGATION_LIST_NOT_ON_TERMINAL**: NavigationList cannot be on terminal screens

### If Component Rules

1. **FOOTER_BOTH_BRANCHES**: If Footer exists in one branch, it must exist in both
2. **MAX_NESTED_IF**: Maximum 3 nested If components

## Validation Error Types

```typescript
enum ValidationErrorType {
  CHARACTER_LIMIT = 'CHARACTER_LIMIT',
  DATA_SOURCE_LIMIT = 'DATA_SOURCE_LIMIT',
  MAX_COMPONENTS = 'MAX_COMPONENTS',
  SINGLE_FOOTER = 'SINGLE_FOOTER',
  TERMINAL_FOOTER_REQUIRED = 'TERMINAL_FOOTER_REQUIRED',
  NAVIGATION_LIST_ON_TERMINAL = 'NAVIGATION_LIST_ON_TERMINAL',
  IF_FOOTER_BOTH_BRANCHES = 'IF_FOOTER_BOTH_BRANCHES',
  IF_NESTED_LIMIT = 'IF_NESTED_LIMIT',
  EMPTY_VALUE = 'EMPTY_VALUE',
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
}
```

## Usage Examples

### Real-time Input Validation

```typescript
import { validateCharacterLimit, getRemainingCharacters } from '@/features/builder';

function TextInputEditor({ value, onChange }) {
  const [label, setLabel] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLabel(newValue);

    const error = validateCharacterLimit(newValue, 'TextInput', 'label');
    if (error) {
      // Show error message
      console.error(error.message);
    }

    onChange(newValue);
  };

  const remaining = getRemainingCharacters(label, 'TextInput', 'label');

  return (
    <div>
      <input value={label} onChange={handleChange} />
      <span>{remaining} characters remaining</span>
    </div>
  );
}
```

### Dropdown Data Source Validation

```typescript
import { validateDataSourceCount, DATA_SOURCE_LIMITS } from '@/features/builder';

function DropdownEditor({ dataSource, hasImages }) {
  const error = validateDataSourceCount('Dropdown', dataSource.length, hasImages);

  if (error) {
    return <div className="error">{error.message}</div>;
  }

  const limits = DATA_SOURCE_LIMITS.Dropdown;
  const max = hasImages ? limits.maxWithImages : limits.max;

  return (
    <div>
      <p>Options: {dataSource.length} / {max}</p>
      {/* ... */}
    </div>
  );
}
```

### Screen Validation

```typescript
import { validateScreen } from '@/features/builder';

function ScreenEditor({ screen }) {
  const result = validateScreen({
    components: screen.components,
    isTerminal: screen.terminal,
    path: `screens/${screen.id}`,
  });

  if (!result.valid) {
    return (
      <div className="validation-errors">
        <h3>Validation Errors:</h3>
        <ul>
          {result.errors.map((error, index) => (
            <li key={index}>
              <strong>{error.type}:</strong> {error.message}
              {error.path && <span> (at {error.path})</span>}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return <div>Screen is valid</div>;
}
```

### Creating New Components

```typescript
import { createComponent } from '@/features/builder';

function addTextInput() {
  const newComponent = createComponent('TextInput', {
    name: 'user_email',
    label: 'Email Address',
    inputType: 'email',
    required: true,
  });

  // Add to screen components
  // ...
}

function addFooter() {
  const footer = createComponent('Footer', {
    label: 'Continue',
    onClickAction: {
      name: 'navigate',
      next: { type: 'screen', name: 'NEXT_SCREEN' },
    },
  });

  // Add to screen components
  // ...
}
```

## Component Types

All component types are fully typed with TypeScript. The following component types are supported:

- Text Components: `TextHeading`, `TextSubheading`, `TextBody`, `TextCaption`, `RichText`
- Text Entry: `TextInput`, `TextArea`
- Selection: `CheckboxGroup`, `RadioButtonsGroup`, `Dropdown`, `ChipsSelector`
- Action: `Footer`, `OptIn`, `EmbeddedLink`
- Date: `DatePicker`, `CalendarPicker`
- Media: `Image`, `ImageCarousel`
- Navigation: `NavigationList`
- Conditional: `If`, `Switch`

## Reference

All constants and validation rules are based on the official WhatsApp Flows documentation:
- See: `/home/ali/whatsapp-builder/.claude/skills/whatsapp-flows-expert/reference/components.md`
- Source: https://developers.facebook.com/docs/whatsapp/flows/reference/components

## Testing

See `utils/validation-examples.ts` for comprehensive examples of how to use the validation functions.

## Integration

These utilities are designed to be used throughout the WhatsApp Flow Builder application:

1. **Form Validation**: Use in form components for real-time validation
2. **Screen Editor**: Validate screens before saving
3. **Flow Preview**: Show validation errors in preview mode
4. **Export**: Validate entire flow before exporting to JSON

## Type Safety

All functions are fully typed with TypeScript. Use the exported types for type-safe validation:

```typescript
import type {
  ValidationError,
  ValidationResult,
  ValidationErrorType,
} from '@/features/builder/utils';
```
