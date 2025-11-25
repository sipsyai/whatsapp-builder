/**
 * WhatsApp Flow JSON v7.2 TypeScript Type Definitions
 *
 * Complete type definitions for WhatsApp Flows based on the official specification.
 * These types represent the structure of WhatsApp Flow JSON files.
 */

// ============================================================================
// Flow JSON Version
// ============================================================================

export type FlowJSONVersion = '2.1' | '3.0' | '4.0' | '5.0' | '5.1' | '6.0' | '6.1' | '6.2' | '6.3' | '7.0' | '7.1' | '7.2';

// ============================================================================
// Common Types
// ============================================================================

export type DynamicString = string; // Can be "${data.field}" or static string
export type DynamicBoolean = boolean | string; // Can be "${data.field}" or static boolean
export type DynamicNumber = number | string; // Can be "${data.field}" or static number

// ============================================================================
// Data Source Item
// ============================================================================

export interface DataSourceItem {
  id: string;
  title: string;
  description?: string;
  metadata?: string;
  enabled?: boolean;
  // Flow JSON v5.0+
  image?: string; // Base64 encoded image
  'alt-text'?: string;
  color?: string; // 6-digit hex color string
  // Flow JSON v6.0+
  'on-select-action'?: UpdateDataAction;
  'on-unselect-action'?: UpdateDataAction;
}

// ============================================================================
// Actions
// ============================================================================

export interface NavigateAction {
  name: 'navigate';
  next: {
    type: 'screen';
    name: string;
  };
  payload?: Record<string, unknown>;
}

export interface CompleteAction {
  name: 'complete';
  payload?: Record<string, unknown>;
}

export interface DataExchangeAction {
  name: 'data_exchange';
  payload?: Record<string, unknown>;
}

export interface UpdateDataAction {
  name: 'update_data';
  payload: Record<string, unknown>;
}

export interface OpenUrlAction {
  name: 'open_url';
  payload: {
    url: string;
  };
}

export type Action =
  | NavigateAction
  | CompleteAction
  | DataExchangeAction
  | UpdateDataAction
  | OpenUrlAction;

// ============================================================================
// Text Components
// ============================================================================

export interface TextHeading {
  type: 'TextHeading';
  text: DynamicString;
  visible?: DynamicBoolean;
}

export interface TextSubheading {
  type: 'TextSubheading';
  text: DynamicString;
  visible?: DynamicBoolean;
}

export interface TextBody {
  type: 'TextBody';
  text: DynamicString;
  'font-weight'?: 'bold' | 'italic' | 'bold_italic' | 'normal';
  strikethrough?: DynamicBoolean;
  visible?: DynamicBoolean;
  markdown?: boolean; // v5.1+
}

export interface TextCaption {
  type: 'TextCaption';
  text: DynamicString;
  'font-weight'?: 'bold' | 'italic' | 'bold_italic' | 'normal';
  strikethrough?: DynamicBoolean;
  visible?: DynamicBoolean;
  markdown?: boolean; // v5.1+
}

export interface RichText {
  type: 'RichText';
  text: DynamicString | string[];
  visible?: DynamicBoolean;
}

// ============================================================================
// Text Entry Components
// ============================================================================

export interface TextInput {
  type: 'TextInput';
  label: DynamicString;
  'label-variant'?: 'large'; // v7.0+
  'input-type'?: 'text' | 'number' | 'email' | 'password' | 'passcode' | 'phone';
  pattern?: string; // v6.2+
  required?: DynamicBoolean;
  'min-chars'?: DynamicString;
  'max-chars'?: DynamicString;
  'helper-text'?: DynamicString;
  name: string;
  visible?: DynamicBoolean;
  'init-value'?: DynamicString; // v4.0+
  'error-message'?: DynamicString; // v4.0+
}

export interface TextArea {
  type: 'TextArea';
  label: DynamicString;
  'label-variant'?: 'large'; // v7.0+
  required?: DynamicBoolean;
  'max-length'?: DynamicString;
  name: string;
  'helper-text'?: DynamicString;
  enabled?: DynamicBoolean;
  visible?: DynamicBoolean;
  'init-value'?: DynamicString; // v4.0+
  'error-message'?: DynamicString; // v4.0+
}

// ============================================================================
// Selection Components
// ============================================================================

export interface CheckboxGroup {
  type: 'CheckboxGroup';
  'data-source': DataSourceItem[] | DynamicString;
  name: string;
  'min-selected-items'?: number | DynamicString;
  'max-selected-items'?: number | DynamicString;
  enabled?: DynamicBoolean;
  label: DynamicString;
  required?: DynamicBoolean;
  visible?: DynamicBoolean;
  'on-select-action'?: DataExchangeAction | UpdateDataAction;
  'on-unselect-action'?: UpdateDataAction; // v6.0+
  description?: DynamicString; // v4.0+
  'init-value'?: string[] | DynamicString; // v4.0+
  'error-message'?: DynamicString; // v4.0+
  'media-size'?: 'regular' | 'large'; // v5.0+
}

export interface RadioButtonsGroup {
  type: 'RadioButtonsGroup';
  'data-source': DataSourceItem[] | DynamicString;
  name: string;
  enabled?: DynamicBoolean;
  label: DynamicString;
  required?: DynamicBoolean;
  visible?: DynamicBoolean;
  'on-select-action'?: DataExchangeAction | UpdateDataAction;
  'on-unselect-action'?: UpdateDataAction; // v6.0+
  description?: DynamicString; // v4.0+
  'init-value'?: string[] | DynamicString; // v4.0+
  'error-message'?: DynamicString; // v4.0+
  'media-size'?: 'regular' | 'large'; // v5.0+
}

export interface Dropdown {
  type: 'Dropdown';
  label: DynamicString;
  'data-source': DataSourceItem[] | DynamicString;
  required?: DynamicBoolean;
  enabled?: DynamicBoolean;
  visible?: DynamicBoolean;
  'on-select-action'?: DataExchangeAction | UpdateDataAction;
  'on-unselect-action'?: UpdateDataAction; // v6.0+
  'init-value'?: DynamicString;
  'error-message'?: DynamicString;
}

export interface ChipsSelector {
  type: 'ChipsSelector';
  'data-source': DataSourceItem[] | DynamicString;
  name: string;
  'min-selected-items'?: number | DynamicString;
  'max-selected-items'?: number | DynamicString;
  enabled?: DynamicBoolean;
  label: DynamicString;
  required?: DynamicBoolean;
  visible?: DynamicBoolean;
  description?: DynamicString;
  'init-value'?: string[] | DynamicString;
  'error-message'?: DynamicString;
  'on-select-action'?: DataExchangeAction | UpdateDataAction; // v7.1+
  'on-unselect-action'?: UpdateDataAction; // v7.1+
}

// ============================================================================
// Date Components
// ============================================================================

export interface DatePicker {
  type: 'DatePicker';
  label: DynamicString;
  'min-date'?: DynamicString; // v5.0+ uses "YYYY-MM-DD", before: timestamp
  'max-date'?: DynamicString; // v5.0+ uses "YYYY-MM-DD", before: timestamp
  name: string;
  'unavailable-dates'?: string[] | DynamicString;
  visible?: DynamicBoolean;
  'helper-text'?: DynamicString;
  enabled?: DynamicBoolean;
  'on-select-action'?: DataExchangeAction;
  'init-value'?: DynamicString; // v4.0+
  'error-message'?: DynamicString; // v4.0+
}

export interface CalendarPicker {
  type: 'CalendarPicker';
  name: string;
  title?: DynamicString; // Only when mode='range'
  description?: DynamicString; // Only when mode='range'
  label: DynamicString;
  'helper-text'?: DynamicString;
  required?: DynamicBoolean;
  visible?: DynamicBoolean;
  enabled?: DynamicBoolean;
  mode?: 'single' | 'range';
  'min-date'?: DynamicString; // "YYYY-MM-DD"
  'max-date'?: DynamicString; // "YYYY-MM-DD"
  'unavailable-dates'?: string[] | DynamicString;
  'include-days'?: Array<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'>;
  'min-days'?: number | DynamicString; // Only in range mode
  'max-days'?: number | DynamicString; // Only in range mode
  'on-select-action'?: DataExchangeAction;
  'init-value'?: DynamicString;
  'error-message'?: DynamicString;
}

// ============================================================================
// Interactive Components
// ============================================================================

export interface Footer {
  type: 'Footer';
  label: DynamicString;
  'left-caption'?: DynamicString;
  'center-caption'?: DynamicString;
  'right-caption'?: DynamicString;
  enabled?: DynamicBoolean;
  'on-click-action': Action;
}

export interface OptIn {
  type: 'OptIn';
  label: DynamicString;
  required?: DynamicBoolean;
  name: string;
  'on-click-action'?: DataExchangeAction | NavigateAction | OpenUrlAction; // v6.0+ includes open_url
  'on-select-action'?: UpdateDataAction; // v6.0+
  'on-unselect-action'?: UpdateDataAction; // v6.0+
  visible?: DynamicBoolean;
  'init-value'?: DynamicBoolean; // v4.0+
}

export interface EmbeddedLink {
  type: 'EmbeddedLink';
  text: DynamicString;
  'on-click-action': DataExchangeAction | NavigateAction | OpenUrlAction; // v6.0+ includes open_url
  visible?: DynamicBoolean;
}

// ============================================================================
// Media Components
// ============================================================================

export interface Image {
  type: 'Image';
  src: DynamicString; // Base64 encoded
  width?: number | DynamicString;
  height?: number | DynamicString;
  'scale-type'?: 'cover' | 'contain';
  'aspect-ratio'?: number | DynamicString;
  'alt-text'?: DynamicString;
}

export interface ImageCarousel {
  type: 'ImageCarousel';
  images: Array<{
    src: string; // Base64 encoded
    'alt-text': string;
  }> | DynamicString;
  'aspect-ratio'?: '4:3' | '16:9';
  'scale-type'?: 'contain' | 'cover';
}

// ============================================================================
// Navigation Components
// ============================================================================

export interface NavigationListItem {
  'main-content': {
    title: string;
    description?: string;
    metadata?: string;
  };
  end?: {
    title?: string;
    description?: string;
    metadata?: string;
  };
  start?: {
    image: string; // Base64 encoded
    'alt-text'?: string;
  };
  badge?: string;
  tags?: string[];
  'on-click-action'?: DataExchangeAction | NavigateAction;
}

export interface NavigationList {
  type: 'NavigationList';
  name: string;
  'list-items': NavigationListItem[] | DynamicString;
  label?: DynamicString;
  description?: DynamicString;
  'media-size'?: 'regular' | 'large';
  'on-click-action'?: DataExchangeAction | NavigateAction;
}

// ============================================================================
// Conditional Components
// ============================================================================

export type ConditionalComponent =
  | TextHeading
  | TextSubheading
  | TextBody
  | TextCaption
  | CheckboxGroup
  | DatePicker
  | Dropdown
  | EmbeddedLink
  | Footer
  | Image
  | OptIn
  | RadioButtonsGroup
  | TextArea
  | TextInput
  | If
  | ChipsSelector; // v7.1+

export interface If {
  type: 'If';
  condition: DynamicString; // Boolean expression
  then: ConditionalComponent[];
  else?: ConditionalComponent[];
}

export interface Switch {
  type: 'Switch';
  value: DynamicString;
  cases: Record<string, ConditionalComponent[]>;
}

// ============================================================================
// All Components Union Type
// ============================================================================

export type Component =
  | TextHeading
  | TextSubheading
  | TextBody
  | TextCaption
  | RichText
  | TextInput
  | TextArea
  | CheckboxGroup
  | RadioButtonsGroup
  | Dropdown
  | ChipsSelector
  | DatePicker
  | CalendarPicker
  | Footer
  | OptIn
  | EmbeddedLink
  | Image
  | ImageCarousel
  | NavigationList
  | If
  | Switch;

// ============================================================================
// Layout
// ============================================================================

export interface SingleColumnLayout {
  type: 'SingleColumnLayout';
  children: Component[];
}

export type Layout = SingleColumnLayout;

// ============================================================================
// Screen Data Model
// ============================================================================

export interface DataProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  __example__?: unknown;
  // For arrays
  items?: {
    type: string;
    properties?: Record<string, DataProperty>;
  };
  // For objects
  properties?: Record<string, DataProperty>;
}

export interface ScreenData {
  [key: string]: DataProperty;
}

// ============================================================================
// Flow Screen
// ============================================================================

export interface FlowScreen {
  id: string;
  title?: string;
  data?: ScreenData;
  terminal?: boolean;
  layout: Layout;
  refresh_on_back?: boolean; // v3.0+
}

// ============================================================================
// Flow JSON Root
// ============================================================================

export interface FlowJSON {
  version: FlowJSONVersion;
  name?: string; // Optional flow name for UI purposes
  data_api_version?: '3.0';
  routing_model?: Record<string, unknown>;
  screens: FlowScreen[];
}

// ============================================================================
// Helper Types for Type Guards
// ============================================================================

export function isTextComponent(component: Component): component is TextHeading | TextSubheading | TextBody | TextCaption | RichText {
  return ['TextHeading', 'TextSubheading', 'TextBody', 'TextCaption', 'RichText'].includes(component.type);
}

export function isInputComponent(component: Component): component is TextInput | TextArea {
  return ['TextInput', 'TextArea'].includes(component.type);
}

export function isSelectionComponent(component: Component): component is CheckboxGroup | RadioButtonsGroup | Dropdown | ChipsSelector {
  return ['CheckboxGroup', 'RadioButtonsGroup', 'Dropdown', 'ChipsSelector'].includes(component.type);
}

export function isDateComponent(component: Component): component is DatePicker | CalendarPicker {
  return ['DatePicker', 'CalendarPicker'].includes(component.type);
}

export function isMediaComponent(component: Component): component is Image | ImageCarousel {
  return ['Image', 'ImageCarousel'].includes(component.type);
}

export function isConditionalComponent(component: Component): component is If | Switch {
  return ['If', 'Switch'].includes(component.type);
}

export function isNavigateAction(action: Action): action is NavigateAction {
  return action.name === 'navigate';
}

export function isCompleteAction(action: Action): action is CompleteAction {
  return action.name === 'complete';
}

export function isDataExchangeAction(action: Action): action is DataExchangeAction {
  return action.name === 'data_exchange';
}

export function isUpdateDataAction(action: Action): action is UpdateDataAction {
  return action.name === 'update_data';
}

export function isOpenUrlAction(action: Action): action is OpenUrlAction {
  return action.name === 'open_url';
}
