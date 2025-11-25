/**
 * Flow Builder Types Index
 *
 * Central export point for all Flow Builder type definitions.
 */

// Flow JSON Types
export type {
  // Version
  FlowJSONVersion,

  // Common
  DynamicString,
  DynamicBoolean,
  DynamicNumber,

  // Data Source
  DataSourceItem,

  // Actions
  NavigateAction,
  CompleteAction,
  DataExchangeAction,
  UpdateDataAction,
  OpenUrlAction,
  Action,

  // Text Components
  TextHeading,
  TextSubheading,
  TextBody,
  TextCaption,
  RichText,

  // Input Components
  TextInput,
  TextArea,

  // Selection Components
  CheckboxGroup,
  RadioButtonsGroup,
  Dropdown,
  ChipsSelector,

  // Date Components
  DatePicker,
  CalendarPicker,

  // Interactive Components
  Footer,
  OptIn,
  EmbeddedLink,

  // Media Components
  Image,
  ImageCarousel,

  // Navigation Components
  NavigationList,
  NavigationListItem,

  // Conditional Components
  If,
  Switch,
  ConditionalComponent,

  // All Components
  Component,

  // Layout
  SingleColumnLayout,
  Layout,

  // Data Model
  DataProperty,
  ScreenData,

  // Screen & Flow
  FlowScreen,
  FlowJSON,
} from './flow-json.types';

// Builder Types
export type {
  // Component Instance
  BaseBuilderComponent,
  BuilderComponent,

  // Screen
  BuilderScreen,

  // ReactFlow
  ScreenNodeData,
  ScreenNode,
  NavigationEdgeData,
  NavigationEdge,

  // Selection
  SelectionState,

  // Clipboard
  ClipboardState,

  // History
  HistoryEntry,
  HistoryState,

  // Validation
  ValidationError,
  ValidationResult,

  // Component Library
  ComponentTemplate,

  // Data Model
  DataModelField,
  DataModel,

  // State
  FlowBuilderState,
  BuilderAction,
} from './builder.types';

// Type Guards
export {
  isTextComponent,
  isInputComponent,
  isSelectionComponent,
  isDateComponent,
  isMediaComponent,
  isConditionalComponent,
  isNavigateAction,
  isCompleteAction,
  isDataExchangeAction,
  isUpdateDataAction,
  isOpenUrlAction,
} from './flow-json.types';

// Helper Functions
export {
  createEmptyScreen,
  createComponent,
  builderScreenToFlowScreen,
  flowScreenToBuilderScreen,
  builderStateToFlowJSON,
  flowJSONToBuilderState,
} from './builder.types';
