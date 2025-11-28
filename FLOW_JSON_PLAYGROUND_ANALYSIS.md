# WhatsApp Flows Playground - Flow JSON v7.2 Analysis

## Overview

This document provides a comprehensive analysis of Flow JSON v7.2 structure for implementing a drag-and-drop Playground where users can build WhatsApp Flows visually and generate Flow JSON automatically.

## 1. Flow JSON v7.2 Specification

### Top-Level Structure

```typescript
interface FlowJSON {
  version: "7.2";                    // Required: Flow JSON version
  data_api_version?: "3.0" | "4.0";  // Optional: Required if using endpoint
  routing_model?: RoutingModel;      // Optional: Required if using endpoint
  screens: Screen[];                 // Required: Array of screens
}

interface RoutingModel {
  [screenId: string]: string[];      // Map of screen -> allowed next screens
}
```

### Screen Structure

```typescript
interface Screen {
  id: string;                        // Required: Unique identifier (UPPERCASE_SNAKE_CASE)
  title?: string;                    // Optional: Screen title in top nav bar
  terminal?: boolean;                // Optional: Is this a final screen?
  success?: boolean;                 // Optional: Is this a successful outcome? (terminal only)
  refresh_on_back?: boolean;         // Optional: Refresh data when navigating back (endpoint only)
  sensitive?: string[];              // Optional: Field names to mask in summary (v5.1+)
  data?: DataModel;                  // Optional: Dynamic data model declaration
  layout: Layout;                    // Required: Screen layout
}

interface DataModel {
  [fieldName: string]: {
    type: "string" | "number" | "boolean" | "array" | "object";
    __example__: any;                // Required for preview/testing
    items?: object;                  // Required if type is "array"
    properties?: object;             // Required if type is "object"
  };
}

interface Layout {
  type: "SingleColumnLayout";        // Only layout type available in v7.2
  children: Component[];             // Array of components
}
```

## 2. Component Types & Mapping

### Text Components (Read-Only)

#### TextHeading
```typescript
{
  type: "TextHeading";
  text: string | DynamicReference;   // Large heading
  visible?: boolean | DynamicExpression;
}
```

#### TextSubheading
```typescript
{
  type: "TextSubheading";
  text: string | DynamicReference;   // Medium heading
  visible?: boolean | DynamicExpression;
}
```

#### TextBody
```typescript
{
  type: "TextBody";
  text: string | DynamicReference;   // Regular text
  visible?: boolean | DynamicExpression;
}
```

#### TextCaption
```typescript
{
  type: "TextCaption";
  text: string | DynamicReference;   // Small caption text
  visible?: boolean | DynamicExpression;
}
```

**Default Values for Text Components:**
- `text`: "" (empty string)
- `visible`: true

**Validation Rules:**
- `type` is required
- `text` is required and must be non-empty
- If using dynamic reference, must match pattern `${data.field}` or `${form.field}`

---

### Input Components (Interactive)

#### TextInput
```typescript
{
  type: "TextInput";
  name: string;                      // Required: Form field name
  label: string;                     // Required: Field label
  required?: boolean;                // Optional: Is field required?
  input-type?: "text" | "number" | "email" | "password" | "passcode";
  "helper-text"?: string;            // Optional: Helper text below input
  "init-value"?: string | DynamicReference;  // Optional: Initial value
  "error-message"?: string | DynamicReference;  // Optional: Error message
  "min-chars"?: number;              // Optional: Minimum characters
  "max-chars"?: number;              // Optional: Maximum characters
  visible?: boolean | DynamicExpression;
}
```

**Default Values:**
- `required`: false
- `input-type`: "text"
- `visible`: true

**Validation Rules:**
- `name` must be unique within screen
- `label` is required
- `min-chars` must be ≥ 0
- `max-chars` must be > min-chars

---

#### TextArea
```typescript
{
  type: "TextArea";
  name: string;                      // Required
  label: string;                     // Required
  required?: boolean;
  "max-length"?: number;             // Optional: Max 3000 characters
  "helper-text"?: string;
  "init-value"?: string | DynamicReference;
  "error-message"?: string | DynamicReference;
  visible?: boolean | DynamicExpression;
}
```

**Default Values:**
- `required`: false
- `max-length`: 3000
- `visible`: true

---

#### Dropdown
```typescript
{
  type: "Dropdown";
  name: string;                      // Required
  label: string;                     // Required
  required?: boolean;
  "data-source": DataSourceItem[] | DynamicReference;  // Required
  "init-value"?: string | DynamicReference;
  "error-message"?: string | DynamicReference;
  visible?: boolean | DynamicExpression;
}

interface DataSourceItem {
  id: string;
  title: string;
  description?: string;
  metadata?: string;
  enabled?: boolean;
}
```

**Default Values:**
- `required`: false
- `data-source`: []
- `visible`: true

**Validation Rules:**
- `data-source` must have at least 1 item
- Each item must have unique `id`
- Each item must have `title`

---

#### RadioButtonsGroup
```typescript
{
  type: "RadioButtonsGroup";
  name: string;                      // Required
  label: string;                     // Required
  required?: boolean;
  "data-source": DataSourceItem[] | DynamicReference;  // Required
  "init-value"?: string | DynamicReference;
  "error-message"?: string | DynamicReference;
  visible?: boolean | DynamicExpression;
}
```

**Default Values:**
- `required`: false
- `data-source`: []
- `visible`: true

---

#### CheckboxGroup
```typescript
{
  type: "CheckboxGroup";
  name: string;                      // Required
  label: string;                     // Required
  required?: boolean;
  "data-source": DataSourceItem[] | DynamicReference;  // Required
  "min-selected-items"?: number;
  "max-selected-items"?: number;
  "init-value"?: string[] | DynamicReference;  // Array of IDs
  "error-message"?: string | DynamicReference;
  visible?: boolean | DynamicExpression;
}
```

**Default Values:**
- `required`: false
- `data-source`: []
- `init-value`: []
- `visible`: true

---

#### DatePicker
```typescript
{
  type: "DatePicker";
  name: string;                      // Required
  label: string;                     // Required
  required?: boolean;
  "min-date"?: string;               // Format: "YYYY-MM-DD"
  "max-date"?: string;               // Format: "YYYY-MM-DD"
  "unavailable-dates"?: string[];    // Array of dates in "YYYY-MM-DD"
  "helper-text"?: string;
  "init-value"?: string | DynamicReference;  // "YYYY-MM-DD"
  "error-message"?: string | DynamicReference;
  visible?: boolean | DynamicExpression;
}
```

**Default Values:**
- `required`: false
- `visible`: true

**Validation Rules:**
- Dates must be in ISO format "YYYY-MM-DD"
- `min-date` < `max-date`

---

#### OptIn
```typescript
{
  type: "OptIn";
  name: string;                      // Required
  label: string;                     // Required: Text next to checkbox
  required?: boolean;
  "on-click-action"?: OpenUrlAction;  // Optional: Link to T&C
  "init-value"?: boolean | DynamicReference;
  visible?: boolean | DynamicExpression;
}
```

**Default Values:**
- `required`: false
- `init-value`: false
- `visible`: true

---

### Media Components

#### Image
```typescript
{
  type: "Image";
  src: string | DynamicReference;    // Required: Image URL or base64
  width?: number;                    // Optional: Width in pixels
  height?: number;                   // Optional: Height in pixels
  "scale-type"?: "cover" | "contain";
  "aspect-ratio"?: number;           // Width/height ratio
  "alt-text"?: string;               // Accessibility text
  visible?: boolean | DynamicExpression;
}
```

**Default Values:**
- `scale-type`: "contain"
- `visible`: true

**Validation Rules:**
- `src` must be valid URL or base64 data URI
- Image size limit: 300KB

---

### Navigation Components

#### Footer
```typescript
{
  type: "Footer";
  label: string;                     // Required: CTA button text
  "on-click-action": Action;         // Required: Action to perform
  enabled?: boolean | DynamicExpression;  // Optional: Button enabled state
}
```

**Default Values:**
- `enabled`: true

**Validation Rules:**
- Required on terminal screens
- Can only have ONE Footer per screen
- `label` must be action-oriented (verb)

---

#### EmbeddedLink
```typescript
{
  type: "EmbeddedLink";
  text: string;                      // Required: Link text
  "on-click-action": NavigateAction | OpenUrlAction;  // Required
  visible?: boolean | DynamicExpression;
}
```

**Default Values:**
- `visible`: true

---

### Conditional Components

#### If
```typescript
{
  type: "If";
  condition: string;                 // Required: Boolean expression
  then: Component[];                 // Required: Components if true
  else?: Component[];                // Optional: Components if false
}
```

**Example:**
```json
{
  "type": "If",
  "condition": "`${form.age} >= 18`",
  "then": [
    {"type": "TextBody", "text": "You are an adult"}
  ],
  "else": [
    {"type": "TextBody", "text": "You are a minor"}
  ]
}
```

---

#### Switch
```typescript
{
  type: "Switch";
  value: string;                     // Required: Value to match
  cases: {
    [caseValue: string]: Component[];
  };
  default?: Component[];             // Optional: Default case
}
```

**Example:**
```json
{
  "type": "Switch",
  "value": "${form.plan}",
  "cases": {
    "basic": [{"type": "TextBody", "text": "Basic plan selected"}],
    "premium": [{"type": "TextBody", "text": "Premium plan selected"}]
  },
  "default": [{"type": "TextBody", "text": "No plan selected"}]
}
```

---

## 3. Actions

### navigate
```typescript
{
  name: "navigate";
  next: { type: "screen"; name: string };
  payload: { [key: string]: DynamicReference };
}
```

**Use Case:** Navigate to another screen without endpoint
**Example:**
```json
{
  "name": "navigate",
  "next": {"type": "screen", "name": "CONFIRMATION"},
  "payload": {
    "user_name": "${form.name}",
    "user_email": "${form.email}"
  }
}
```

---

### complete
```typescript
{
  name: "complete";
  payload: { [key: string]: DynamicReference };
}
```

**Use Case:** Complete the flow and send webhook
**Example:**
```json
{
  "name": "complete",
  "payload": {
    "booking_id": "${data.booking_id}",
    "appointment_time": "${data.time_slot}"
  }
}
```

---

### data_exchange
```typescript
{
  name: "data_exchange";
  payload: { [key: string]: DynamicReference };
}
```

**Use Case:** Send data to endpoint and get next screen
**Example:**
```json
{
  "name": "data_exchange",
  "payload": {
    "service_id": "${form.service}",
    "date": "${form.appointment_date}"
  }
}
```

---

### update_data (v6.0+)
```typescript
{
  name: "update_data";
  payload: { [key: string]: any };
}
```

**Use Case:** Update screen data based on user interaction
**Example:**
```json
{
  "name": "update_data",
  "payload": {
    "cities": ["New York", "Los Angeles"],
    "cities_visible": true
  }
}
```

---

### open_url (v6.0+)
```typescript
{
  name: "open_url";
  url: string | DynamicReference;
}
```

**Use Case:** Open external URL in browser
**Example:**
```json
{
  "name": "open_url",
  "url": "https://example.com/terms"
}
```

---

## 4. Dynamic References

### Form References
Access user input from current screen:
```
${form.field_name}
```

### Data References
Access data provided by endpoint or previous screen:
```
${data.property_name}
```

### Global References (v4.0+)
Access data from any screen:
```
${screen.SCREEN_NAME.form.field_name}
${screen.SCREEN_NAME.data.property_name}
```

### Nested Expressions (v6.0+)
```
// Conditional visibility
`${form.age} >= 18`

// String concatenation
`'Hello ' ${form.name}`

// Math operations
`${data.price} * ${form.quantity}`

// Logical operators
`${form.accept} && ${form.subscribe}`

// Equality
`${form.country} == 'US'`
```

---

## 5. Component → Flow JSON Mapping Strategy

### Playground Component Model

```typescript
interface PlaygroundComponent {
  id: string;                        // Unique component ID (for React key)
  type: ComponentType;               // Component type enum
  properties: ComponentProperties;   // Type-specific properties
  position: { x: number; y: number }; // Canvas position (not in Flow JSON)
}

enum ComponentType {
  // Text
  TEXT_HEADING = "TextHeading",
  TEXT_SUBHEADING = "TextSubheading",
  TEXT_BODY = "TextBody",
  TEXT_CAPTION = "TextCaption",

  // Input
  TEXT_INPUT = "TextInput",
  TEXT_AREA = "TextArea",
  DROPDOWN = "Dropdown",
  RADIO_BUTTONS = "RadioButtonsGroup",
  CHECKBOX_GROUP = "CheckboxGroup",
  DATE_PICKER = "DatePicker",
  OPT_IN = "OptIn",

  // Media
  IMAGE = "Image",

  // Navigation
  FOOTER = "Footer",
  EMBEDDED_LINK = "EmbeddedLink",

  // Conditional
  IF = "If",
  SWITCH = "Switch"
}
```

### Mapping Logic

```typescript
class FlowJSONGenerator {

  /**
   * Convert Playground components to Flow JSON
   */
  generateFlowJSON(
    screens: PlaygroundScreen[],
    hasEndpoint: boolean
  ): FlowJSON {
    const flowJson: FlowJSON = {
      version: "7.2",
      screens: screens.map(screen => this.convertScreen(screen))
    };

    if (hasEndpoint) {
      flowJson.data_api_version = "4.0";
      flowJson.routing_model = this.generateRoutingModel(screens);
    }

    return flowJson;
  }

  /**
   * Convert Playground screen to Flow JSON screen
   */
  convertScreen(screen: PlaygroundScreen): Screen {
    const flowScreen: Screen = {
      id: screen.id,
      layout: {
        type: "SingleColumnLayout",
        children: screen.components.map(c => this.convertComponent(c))
      }
    };

    if (screen.title) flowScreen.title = screen.title;
    if (screen.terminal) flowScreen.terminal = true;
    if (screen.success !== undefined) flowScreen.success = screen.success;
    if (screen.dataModel) flowScreen.data = screen.dataModel;
    if (screen.sensitiveFields?.length) flowScreen.sensitive = screen.sensitiveFields;

    return flowScreen;
  }

  /**
   * Convert component to Flow JSON format
   */
  convertComponent(component: PlaygroundComponent): any {
    const base = {
      type: component.type
    };

    // Add component-specific properties
    switch (component.type) {
      case "TextHeading":
      case "TextSubheading":
      case "TextBody":
      case "TextCaption":
        return {
          ...base,
          text: component.properties.text || "",
          ...(component.properties.visible !== undefined && {
            visible: component.properties.visible
          })
        };

      case "TextInput":
        return {
          ...base,
          name: component.properties.name,
          label: component.properties.label,
          ...(component.properties.required && { required: true }),
          ...(component.properties.inputType && { "input-type": component.properties.inputType }),
          ...(component.properties.helperText && { "helper-text": component.properties.helperText }),
          ...(component.properties.initValue && { "init-value": component.properties.initValue }),
          ...(component.properties.visible !== undefined && { visible: component.properties.visible })
        };

      case "Dropdown":
      case "RadioButtonsGroup":
        return {
          ...base,
          name: component.properties.name,
          label: component.properties.label,
          "data-source": component.properties.dataSource || [],
          ...(component.properties.required && { required: true }),
          ...(component.properties.initValue && { "init-value": component.properties.initValue }),
          ...(component.properties.visible !== undefined && { visible: component.properties.visible })
        };

      case "Footer":
        return {
          ...base,
          label: component.properties.label,
          "on-click-action": component.properties.action
        };

      // Add other component types...

      default:
        return base;
    }
  }

  /**
   * Generate routing model from screen connections
   */
  generateRoutingModel(screens: PlaygroundScreen[]): RoutingModel {
    const model: RoutingModel = {};

    screens.forEach(screen => {
      const nextScreens = this.findNextScreens(screen);
      model[screen.id] = nextScreens;
    });

    return model;
  }

  /**
   * Find next screens from Footer/EmbeddedLink actions
   */
  findNextScreens(screen: PlaygroundScreen): string[] {
    const nextScreens: string[] = [];

    screen.components.forEach(component => {
      if (component.type === "Footer" || component.type === "EmbeddedLink") {
        const action = component.properties.action;
        if (action?.name === "navigate") {
          nextScreens.push(action.next.name);
        }
      }
    });

    return [...new Set(nextScreens)]; // Remove duplicates
  }
}
```

---

## 6. Default Values & Validation

### Component Default Values

```typescript
const COMPONENT_DEFAULTS = {
  TextHeading: {
    text: "Heading",
    visible: true
  },
  TextInput: {
    name: "field_name",
    label: "Field Label",
    required: false,
    "input-type": "text",
    visible: true
  },
  Dropdown: {
    name: "selection",
    label: "Select an option",
    required: false,
    "data-source": [],
    visible: true
  },
  RadioButtonsGroup: {
    name: "choice",
    label: "Choose one",
    required: false,
    "data-source": [],
    visible: true
  },
  CheckboxGroup: {
    name: "preferences",
    label: "Select all that apply",
    required: false,
    "data-source": [],
    "init-value": [],
    visible: true
  },
  DatePicker: {
    name: "date",
    label: "Select date",
    required: false,
    visible: true
  },
  OptIn: {
    name: "opt_in",
    label: "I agree to terms",
    required: false,
    "init-value": false,
    visible: true
  },
  Image: {
    src: "",
    "scale-type": "contain",
    visible: true
  },
  Footer: {
    label: "Continue",
    "on-click-action": {
      name: "navigate",
      next: { type: "screen", name: "NEXT_SCREEN" },
      payload: {}
    },
    enabled: true
  },
  EmbeddedLink: {
    text: "Learn more",
    visible: true
  }
};
```

### Validation Rules

```typescript
interface ValidationRule {
  field: string;
  rule: (value: any, component: any) => boolean;
  message: string;
}

const VALIDATION_RULES: Record<ComponentType, ValidationRule[]> = {
  TextInput: [
    {
      field: "name",
      rule: (v) => v && /^[a-z_][a-z0-9_]*$/i.test(v),
      message: "Name must be valid identifier (letters, numbers, underscores)"
    },
    {
      field: "label",
      rule: (v) => v && v.length > 0,
      message: "Label is required"
    },
    {
      field: "max-chars",
      rule: (v, c) => !v || !c["min-chars"] || v > c["min-chars"],
      message: "max-chars must be greater than min-chars"
    }
  ],

  Dropdown: [
    {
      field: "data-source",
      rule: (v) => Array.isArray(v) && v.length > 0,
      message: "data-source must have at least one option"
    },
    {
      field: "data-source",
      rule: (v) => {
        const ids = v.map(item => item.id);
        return ids.length === new Set(ids).size;
      },
      message: "All option IDs must be unique"
    }
  ],

  Footer: [
    {
      field: "on-click-action",
      rule: (v) => v && ["navigate", "complete", "data_exchange"].includes(v.name),
      message: "Footer must have valid action"
    }
  ],

  DatePicker: [
    {
      field: "min-date",
      rule: (v, c) => {
        if (!v || !c["max-date"]) return true;
        return new Date(v) < new Date(c["max-date"]);
      },
      message: "min-date must be before max-date"
    }
  ]
};
```

---

## 7. Screen Navigation Logic

### Navigation Flow

1. **Entry Screen**: First screen with no inbound connections
2. **Intermediate Screens**: Screens with both inbound and outbound connections
3. **Terminal Screens**: Screens marked with `terminal: true`

### Routing Model Generation

```typescript
/**
 * Generate routing model based on screen connections
 */
function generateRoutingModel(screens: Screen[]): RoutingModel {
  const model: RoutingModel = {};

  screens.forEach(screen => {
    // Find all navigate actions in screen
    const navigateActions = findNavigateActions(screen);
    const nextScreens = navigateActions.map(action => action.next.name);

    model[screen.id] = [...new Set(nextScreens)];
  });

  // Validate routing model
  validateRoutingModel(model, screens);

  return model;
}

function validateRoutingModel(model: RoutingModel, screens: Screen[]): void {
  const screenIds = screens.map(s => s.id);
  const terminalScreens = screens.filter(s => s.terminal).map(s => s.id);

  // Check 1: All referenced screens exist
  Object.values(model).flat().forEach(targetScreen => {
    if (!screenIds.includes(targetScreen)) {
      throw new Error(`Unknown screen referenced: ${targetScreen}`);
    }
  });

  // Check 2: All routes end at terminal screens
  const reachableTerminals = new Set<string>();

  function findReachableTerminals(screenId: string, visited = new Set<string>()) {
    if (visited.has(screenId)) return;
    visited.add(screenId);

    if (terminalScreens.includes(screenId)) {
      reachableTerminals.add(screenId);
      return;
    }

    const nextScreens = model[screenId] || [];
    nextScreens.forEach(next => findReachableTerminals(next, visited));
  }

  // Start from entry screen
  const entryScreen = findEntryScreen(model, screenIds);
  findReachableTerminals(entryScreen);

  if (reachableTerminals.size === 0) {
    throw new Error("No path to terminal screen found");
  }
}

function findEntryScreen(model: RoutingModel, screenIds: string[]): string {
  const hasInbound = new Set<string>();

  Object.values(model).flat().forEach(screenId => {
    hasInbound.add(screenId);
  });

  const entryScreens = screenIds.filter(id => !hasInbound.has(id));

  if (entryScreens.length === 0) {
    throw new Error("No entry screen found (circular reference?)");
  }

  if (entryScreens.length > 1) {
    throw new Error(`Multiple entry screens found: ${entryScreens.join(", ")}`);
  }

  return entryScreens[0];
}
```

---

## 8. Data Exchange Endpoint Integration

### Endpoint Flow

1. User opens Flow → `INIT` action sent to endpoint
2. Endpoint returns first screen data
3. User interacts → `data_exchange` action sent with form data
4. Endpoint validates and returns next screen or error
5. User completes → `complete` action sent to webhook (not endpoint)

### Request/Response Structure

```typescript
// Request from WhatsApp to your endpoint
interface EndpointRequest {
  version: "3.0";
  action: "INIT" | "data_exchange" | "BACK" | "ping" | "error_notification";
  screen: string;
  data: any;
  flow_token: string;
}

// Response from your endpoint to WhatsApp
interface EndpointResponse {
  screen: string;
  data: {
    [key: string]: any;
    error_message?: string;  // Show error on current screen
    extension_message_response?: {
      params: {
        flow_token: string;
        [key: string]: any;
      }
    }
  };
}
```

### Example Endpoint Handler

```typescript
async function handleFlowEndpoint(request: EndpointRequest): Promise<EndpointResponse> {
  const { action, screen, data, flow_token } = request;

  // Health check
  if (action === "ping") {
    return { data: { status: "active" } };
  }

  // Initialize flow
  if (action === "INIT") {
    return {
      screen: "FIRST_SCREEN",
      data: {
        welcome_message: "Welcome!",
        options: await getOptions()
      }
    };
  }

  // Handle data exchange
  if (action === "data_exchange") {
    switch (screen) {
      case "FIRST_SCREEN":
        // Validate input
        if (!data.selection) {
          return {
            screen: "FIRST_SCREEN",
            data: {
              error_message: "Please make a selection"
            }
          };
        }

        // Return next screen
        return {
          screen: "SECOND_SCREEN",
          data: {
            details: await getDetails(data.selection)
          }
        };

      case "SECOND_SCREEN":
        // Final screen before completion
        const result = await processBooking(data);

        return {
          screen: "SUCCESS",
          data: {
            booking_id: result.id,
            confirmation_message: "Booking confirmed!",
            extension_message_response: {
              params: {
                flow_token,
                booking_id: result.id
              }
            }
          }
        };

      default:
        throw new Error(`Unknown screen: ${screen}`);
    }
  }

  throw new Error(`Unsupported action: ${action}`);
}
```

---

## 9. Playground Implementation Recommendations

### Component Palette

```typescript
interface ComponentPaletteItem {
  category: "text" | "input" | "media" | "navigation" | "conditional";
  type: ComponentType;
  label: string;
  icon: string;
  description: string;
  defaultProperties: ComponentProperties;
}

const COMPONENT_PALETTE: ComponentPaletteItem[] = [
  // Text Components
  {
    category: "text",
    type: "TextHeading",
    label: "Heading",
    icon: "IconH1",
    description: "Large heading text",
    defaultProperties: { text: "Heading" }
  },

  // Input Components
  {
    category: "input",
    type: "TextInput",
    label: "Text Input",
    icon: "IconTextbox",
    description: "Single line text input",
    defaultProperties: {
      name: "field_name",
      label: "Field Label",
      required: false
    }
  },

  {
    category: "input",
    type: "Dropdown",
    label: "Dropdown",
    icon: "IconChevronDown",
    description: "Select from dropdown list",
    defaultProperties: {
      name: "selection",
      label: "Select an option",
      "data-source": [
        { id: "option1", title: "Option 1" },
        { id: "option2", title: "Option 2" }
      ]
    }
  },

  // Continue for all components...
];
```

### Property Editor

```typescript
interface PropertyEditorField {
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "select" | "array" | "dynamic";
  required: boolean;
  validation?: ValidationRule;
  help?: string;
  conditional?: {
    field: string;
    value: any;
  };
}

const PROPERTY_EDITORS: Record<ComponentType, PropertyEditorField[]> = {
  TextInput: [
    {
      key: "name",
      label: "Field Name",
      type: "text",
      required: true,
      validation: /^[a-z_][a-z0-9_]*$/i,
      help: "Unique identifier for this field"
    },
    {
      key: "label",
      label: "Label",
      type: "text",
      required: true,
      help: "Label shown to user"
    },
    {
      key: "required",
      label: "Required",
      type: "boolean",
      required: false
    },
    {
      key: "input-type",
      label: "Input Type",
      type: "select",
      required: false,
      options: ["text", "number", "email", "password", "passcode"]
    },
    {
      key: "helper-text",
      label: "Helper Text",
      type: "text",
      required: false,
      help: "Optional guidance text below input"
    }
  ],

  // Continue for all components...
};
```

### Canvas State Management

```typescript
interface PlaygroundState {
  screens: {
    [screenId: string]: {
      id: string;
      title: string;
      terminal: boolean;
      success?: boolean;
      components: PlaygroundComponent[];
      dataModel?: DataModel;
      connections: string[];  // Connected screen IDs
    };
  };

  activeScreenId: string;
  hasEndpoint: boolean;
  endpointUri?: string;

  // UI state
  selectedComponentId?: string;
  isDragging: boolean;
  isPreviewMode: boolean;
}

// Redux actions
const actions = {
  addScreen: (screen: Screen) => {},
  deleteScreen: (screenId: string) => {},
  updateScreen: (screenId: string, updates: Partial<Screen>) => {},

  addComponent: (screenId: string, component: PlaygroundComponent) => {},
  deleteComponent: (screenId: string, componentId: string) => {},
  updateComponent: (screenId: string, componentId: string, properties: any) => {},
  reorderComponents: (screenId: string, componentIds: string[]) => {},

  connectScreens: (fromScreenId: string, toScreenId: string) => {},
  disconnectScreens: (fromScreenId: string, toScreenId: string) => {},

  setEndpoint: (enabled: boolean, uri?: string) => {},

  generateFlowJSON: () => FlowJSON,
  importFlowJSON: (flowJson: FlowJSON) => {},
};
```

---

## 10. Testing & Validation

### Pre-Publish Validation

```typescript
function validateFlowJSON(flowJson: FlowJSON): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check version
  if (flowJson.version !== "7.2") {
    errors.push("Invalid version. Must be 7.2");
  }

  // 2. Check screens
  if (!flowJson.screens || flowJson.screens.length === 0) {
    errors.push("Flow must have at least one screen");
  }

  // 3. Validate screen IDs
  const screenIds = flowJson.screens.map(s => s.id);
  const duplicates = screenIds.filter((id, i) => screenIds.indexOf(id) !== i);
  if (duplicates.length > 0) {
    errors.push(`Duplicate screen IDs: ${duplicates.join(", ")}`);
  }

  // 4. Check for terminal screens
  const terminalScreens = flowJson.screens.filter(s => s.terminal);
  if (terminalScreens.length === 0) {
    errors.push("Flow must have at least one terminal screen");
  }

  // 5. Validate terminal screens have Footer
  terminalScreens.forEach(screen => {
    const hasFooter = screen.layout.children.some(c => c.type === "Footer");
    if (!hasFooter) {
      errors.push(`Terminal screen ${screen.id} must have a Footer component`);
    }
  });

  // 6. Validate routing model if endpoint
  if (flowJson.data_api_version) {
    if (!flowJson.routing_model) {
      errors.push("routing_model is required when using endpoint");
    } else {
      // Validate routing model
      const routingErrors = validateRoutingModel(flowJson.routing_model, flowJson.screens);
      errors.push(...routingErrors);
    }
  }

  // 7. Validate each screen
  flowJson.screens.forEach(screen => {
    const screenErrors = validateScreen(screen);
    errors.push(...screenErrors);
  });

  // 8. Check Flow size
  const flowJsonSize = JSON.stringify(flowJson).length;
  if (flowJsonSize > 10 * 1024 * 1024) {  // 10MB limit
    errors.push("Flow JSON exceeds 10MB limit");
  } else if (flowJsonSize > 5 * 1024 * 1024) {  // Warning at 5MB
    warnings.push("Flow JSON size is large (>5MB). Consider simplifying.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
```

---

## 11. Summary & Next Steps

### Component Implementation Priority

1. **Phase 1: Core Components**
   - TextHeading, TextBody
   - TextInput
   - Footer
   - Basic screen management

2. **Phase 2: Input Components**
   - Dropdown
   - RadioButtonsGroup
   - CheckboxGroup
   - DatePicker

3. **Phase 3: Advanced Features**
   - Conditional components (If/Switch)
   - Dynamic references
   - Endpoint integration

4. **Phase 4: Polish**
   - Image support
   - Data source integration
   - Advanced validation
   - Preview mode

### Key Implementation Files

**Frontend:**
- `/frontend/src/features/flows-playground/components/FlowPlayground.tsx` - Main canvas
- `/frontend/src/features/flows-playground/components/ComponentPalette.tsx` - Drag source
- `/frontend/src/features/flows-playground/components/PropertyEditor.tsx` - Properties panel
- `/frontend/src/features/flows-playground/utils/flowJsonGenerator.ts` - JSON generator
- `/frontend/src/features/flows-playground/store/playgroundSlice.ts` - State management

**Backend:**
- Existing `/backend/src/modules/flows/flows.service.ts` - CRUD operations
- Existing `/backend/src/entities/whatsapp-flow.entity.ts` - Database schema
- New validation in flows.service.ts before publish

### Integration with Existing System

The Playground should integrate with existing Flow management:
1. Save Flow JSON to `WhatsAppFlow.flowJson` field
2. Use `FlowsService.create()` to publish
3. Use `FlowsService.publish()` to make live
4. Use `FlowsService.getPreview()` to test

---

## References

- [Flow JSON Documentation](/.claude/skills/whatsapp-flows-expert/whatsapp-flows-docs/Flow_JSON_-_WhatsApp_Flows.md)
- [Quick Reference](/.claude/skills/whatsapp-flows-expert/reference/quick-reference.md)
- [Examples](/.claude/skills/whatsapp-flows-expert/reference/examples.md)
- [Existing WhatsAppFlow Entity](/backend/src/entities/whatsapp-flow.entity.ts)
- [Flows Service](/backend/src/modules/flows/flows.service.ts)
