# Flow JSON Generator

A comprehensive utility for converting Flow Builder state to WhatsApp Flow JSON format.

## Overview

The Flow JSON Generator transforms the internal builder representation (`BuilderScreen`, `BuilderComponent`) into valid WhatsApp Flow JSON structure that can be exported, saved, or sent to the WhatsApp Flows API.

## Features

- **Complete Conversion**: Converts screens, components, and navigation to Flow JSON
- **Routing Model Generation**: Automatically generates routing model from edges and actions
- **Validation**: Built-in validation for generated Flow JSON
- **JSON Cleaning**: Removes undefined/null values for clean output
- **Size Checking**: Validates against WhatsApp's 10MB limit
- **Multiple Export Formats**: Formatted or minified JSON output
- **Type-Safe**: Full TypeScript support with strict typing

## Installation

The generator is part of the Flow Builder utils and is automatically available:

```typescript
import { generateFlowJSON } from '@/features/flow-builder/utils';
```

## Basic Usage

### Generate Flow JSON

```typescript
import { generateFlowJSON } from '@/features/flow-builder/utils';

const flowJSON = generateFlowJSON(screens, edges);
```

### With Options

```typescript
const flowJSON = generateFlowJSON(screens, edges, {
  version: '7.2',
  dataApiVersion: '3.0',
  includeRoutingModel: true,
  cleanOutput: true,
});
```

## API Reference

### `generateFlowJSON()`

Main function to generate Flow JSON from builder state.

**Signature:**
```typescript
function generateFlowJSON(
  screens: BuilderScreen[],
  edges?: Edge[] | NavigationEdge[],
  options?: GeneratorOptions
): FlowJSON
```

**Parameters:**
- `screens` - Array of builder screens to convert
- `edges` - Optional array of navigation edges (for routing model)
- `options` - Optional generation options

**Returns:** Complete Flow JSON structure

**Example:**
```typescript
const flowJSON = generateFlowJSON(
  [screen1, screen2],
  [{ id: 'e1', source: 'SCREEN_1', target: 'SCREEN_2' }],
  { version: '7.2' }
);
```

---

### `builderScreenToFlowScreen()`

Convert a single BuilderScreen to FlowScreen format.

**Signature:**
```typescript
function builderScreenToFlowScreen(
  screen: BuilderScreen,
  options?: GeneratorOptions
): FlowScreen
```

**Example:**
```typescript
const flowScreen = builderScreenToFlowScreen(builderScreen, {
  cleanOutput: true,
});
```

---

### `builderComponentToFlowComponent()`

Convert a single BuilderComponent to Flow JSON Component format.

**Signature:**
```typescript
function builderComponentToFlowComponent(
  component: BuilderComponent,
  options?: GeneratorOptions
): Component
```

**Example:**
```typescript
const flowComponent = builderComponentToFlowComponent(builderComponent);
```

---

### `generateRoutingModel()`

Generate routing model from screens and edges.

**Signature:**
```typescript
function generateRoutingModel(
  screens: BuilderScreen[],
  edges: Edge[] | NavigationEdge[]
): Record<string, string[]>
```

**Returns:** Object mapping screen IDs to their target screen IDs

**Example:**
```typescript
const routingModel = generateRoutingModel(screens, edges);
// Output: { "WELCOME": ["QUESTIONS", "INFO"], "QUESTIONS": ["SUCCESS"] }
```

---

### `validateGeneratedJSON()`

Validate that generated Flow JSON is structurally correct.

**Signature:**
```typescript
function validateGeneratedJSON(flowJSON: FlowJSON): string[]
```

**Returns:** Array of validation error messages (empty if valid)

**Example:**
```typescript
const errors = validateGeneratedJSON(flowJSON);
if (errors.length > 0) {
  console.error('Validation failed:', errors);
}
```

---

### `cleanJSON()`

Deep clean JSON by removing undefined, null, and empty values.

**Signature:**
```typescript
function cleanJSON<T>(obj: T): T
```

**Example:**
```typescript
const cleaned = cleanJSON({
  text: 'Hello',
  visible: undefined,
  empty: null,
});
// Result: { text: 'Hello' }
```

---

### `exportFlowJSON()`

Export Flow JSON as formatted string.

**Signature:**
```typescript
function exportFlowJSON(flowJSON: FlowJSON, indent?: number): string
```

**Example:**
```typescript
const jsonString = exportFlowJSON(flowJSON, 2); // 2-space indentation
```

---

### `exportFlowJSONMinified()`

Export Flow JSON as minified string (no whitespace).

**Signature:**
```typescript
function exportFlowJSONMinified(flowJSON: FlowJSON): string
```

**Example:**
```typescript
const minified = exportFlowJSONMinified(flowJSON);
```

---

### `calculateFlowJSONSize()`

Calculate Flow JSON size in bytes.

**Signature:**
```typescript
function calculateFlowJSONSize(flowJSON: FlowJSON): number
```

**Example:**
```typescript
const size = calculateFlowJSONSize(flowJSON);
console.log(`Size: ${size / 1024} KB`);
```

---

### `isFlowJSONWithinSizeLimit()`

Check if Flow JSON is within WhatsApp's 10MB limit.

**Signature:**
```typescript
function isFlowJSONWithinSizeLimit(flowJSON: FlowJSON): boolean
```

**Example:**
```typescript
if (!isFlowJSONWithinSizeLimit(flowJSON)) {
  alert('Flow is too large!');
}
```

---

## Generator Options

```typescript
interface GeneratorOptions {
  // Target Flow JSON version (default: '7.2')
  version?: FlowJSONVersion;

  // Data API version (default: '3.0')
  // Required if any screen uses data_exchange action
  dataApiVersion?: '3.0' | '4.0';

  // Include routing_model in output (default: false)
  includeRoutingModel?: boolean;

  // Remove undefined/null values (default: true)
  cleanOutput?: boolean;

  // Include metadata (non-standard, default: false)
  includeMetadata?: boolean;
}
```

## Common Patterns

### 1. Export Flow for Download

```typescript
function exportFlowForDownload(screens: BuilderScreen[], flowName: string) {
  // Generate
  const flowJSON = generateFlowJSON(screens, [], {
    version: '7.2',
    dataApiVersion: '3.0',
  });

  // Validate
  const errors = validateGeneratedJSON(flowJSON);
  if (errors.length > 0) {
    throw new Error(`Invalid Flow: ${errors.join(', ')}`);
  }

  // Export
  const jsonString = exportFlowJSON(flowJSON, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${flowName}.json`;
  link.click();

  URL.revokeObjectURL(url);
}
```

### 2. Generate and Validate

```typescript
function generateWithValidation(screens: BuilderScreen[]) {
  // Generate
  const flowJSON = generateFlowJSON(screens);

  // Validate
  const errors = validateGeneratedJSON(flowJSON);
  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Check size
  if (!isFlowJSONWithinSizeLimit(flowJSON)) {
    return {
      success: false,
      errors: ['Flow exceeds 10MB limit'],
    };
  }

  return { success: true, flowJSON };
}
```

### 3. Generate for API Submission

```typescript
function prepareForAPI(screens: BuilderScreen[]) {
  const flowJSON = generateFlowJSON(screens, [], {
    version: '7.2',
    dataApiVersion: '3.0',
    cleanOutput: true,
  });

  // Validate
  const errors = validateGeneratedJSON(flowJSON);
  if (errors.length > 0) {
    throw new Error('Invalid Flow JSON');
  }

  // Return minified
  return exportFlowJSONMinified(flowJSON);
}
```

### 4. Generate Routing Model for Visualization

```typescript
function getFlowRouting(screens: BuilderScreen[], edges: Edge[]) {
  const routingModel = generateRoutingModel(screens, edges);

  // Use for visualization
  console.log('Flow routing:', routingModel);

  return routingModel;
}
```

### 5. Incremental Generation (Single Screen)

```typescript
function previewScreen(screen: BuilderScreen) {
  const flowScreen = builderScreenToFlowScreen(screen);

  console.log('Screen preview:', JSON.stringify(flowScreen, null, 2));

  return flowScreen;
}
```

## Validation Rules

The generator validates:

1. **Required Fields**
   - Flow must have a version
   - Flow must have at least one screen
   - Each screen must have an id and layout

2. **Screen Structure**
   - Screens must have components
   - Terminal screens should have a Footer component

3. **Terminal Screens**
   - Flow should have at least one terminal screen

4. **Routing Model** (if included)
   - All referenced screen IDs must exist
   - Source and target screens must be valid

5. **Size Limits**
   - Flow JSON must not exceed 10MB

## Error Handling

Always handle errors when generating:

```typescript
try {
  const flowJSON = generateFlowJSON(screens);

  const errors = validateGeneratedJSON(flowJSON);
  if (errors.length > 0) {
    // Handle validation errors
    console.error('Validation errors:', errors);
    return;
  }

  // Success
  return flowJSON;
} catch (error) {
  console.error('Generation failed:', error);
  throw error;
}
```

## Output Format

### Generated Flow JSON Structure

```json
{
  "version": "7.2",
  "data_api_version": "3.0",
  "routing_model": {
    "WELCOME": ["QUESTIONS"],
    "QUESTIONS": ["SUCCESS"]
  },
  "screens": [
    {
      "id": "WELCOME",
      "title": "Welcome Screen",
      "terminal": false,
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Welcome!"
          },
          {
            "type": "Footer",
            "label": "Continue",
            "on-click-action": {
              "name": "navigate",
              "next": {
                "type": "screen",
                "name": "QUESTIONS"
              }
            }
          }
        ]
      }
    }
  ]
}
```

## Best Practices

1. **Always Validate**: Use `validateGeneratedJSON()` before exporting
2. **Check Size**: Use `isFlowJSONWithinSizeLimit()` for large flows
3. **Clean Output**: Enable `cleanOutput: true` to remove empty values
4. **Version Matching**: Set the correct version based on features used
5. **Data API Version**: Include `dataApiVersion` if using `data_exchange` actions
6. **Error Handling**: Wrap generation in try-catch blocks
7. **Routing Model**: Include for better flow visualization and validation

## Integration with Builder

### In FlowBuilderPage

```typescript
import { generateFlowJSON, validateGeneratedJSON } from './utils';

function FlowBuilderPage() {
  const { screens, edges } = useFlowBuilderState();

  const handleExport = () => {
    const flowJSON = generateFlowJSON(screens, edges, {
      version: '7.2',
      includeRoutingModel: true,
    });

    const errors = validateGeneratedJSON(flowJSON);
    if (errors.length > 0) {
      showErrorNotification(errors);
      return;
    }

    downloadJSON(flowJSON);
  };

  return <Button onClick={handleExport}>Export Flow</Button>;
}
```

## Testing

The generator includes comprehensive tests in `flowJsonGenerator.test.ts`:

```bash
npm test flowJsonGenerator.test.ts
```

Tests cover:
- Component conversion
- Screen conversion
- Flow JSON generation
- Routing model generation
- Validation
- JSON cleaning
- Export functions
- Size checking
- Integration scenarios

## Examples

See `flowJsonGenerator.examples.ts` for more practical examples:

- Basic generation
- Custom options
- Validation
- Download functionality
- Size checking
- Data exchange flows
- Conditional components
- Error handling

## Troubleshooting

### Issue: Generated JSON is invalid

**Solution:**
```typescript
const errors = validateGeneratedJSON(flowJSON);
console.log('Validation errors:', errors);
```

### Issue: Flow is too large

**Solution:**
```typescript
const size = calculateFlowJSONSize(flowJSON);
console.log(`Size: ${size / 1024 / 1024} MB`);
// Reduce screens or components
```

### Issue: Routing model is incorrect

**Solution:**
```typescript
// Ensure edges are provided
const flowJSON = generateFlowJSON(screens, edges, {
  includeRoutingModel: true,
});
```

### Issue: Components are missing in output

**Solution:**
```typescript
// Check if components have visible: false
// These are filtered out by default
```

## Related Files

- `flowJsonGenerator.ts` - Main generator implementation
- `flowJsonGenerator.test.ts` - Test suite
- `flowJsonGenerator.examples.ts` - Usage examples
- `validation.ts` - Additional validation utilities
- `builder.types.ts` - Builder type definitions
- `flow-json.types.ts` - Flow JSON type definitions

## Support

For issues or questions:
1. Check validation errors with `validateGeneratedJSON()`
2. Review examples in `flowJsonGenerator.examples.ts`
3. See test cases in `flowJsonGenerator.test.ts`
4. Refer to WhatsApp Flows documentation
