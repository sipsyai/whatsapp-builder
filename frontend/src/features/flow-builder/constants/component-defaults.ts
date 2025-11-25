/**
 * Default values for WhatsApp Flow components
 * Based on official WhatsApp Flows documentation
 */

export const COMPONENT_DEFAULTS = {
  // Text Components
  TextHeading: {
    type: 'TextHeading',
    text: '',
    visible: true,
  },
  TextSubheading: {
    type: 'TextSubheading',
    text: '',
    visible: true,
  },
  TextBody: {
    type: 'TextBody',
    text: '',
    visible: true,
    markdown: false,
    'font-weight': 'normal' as 'normal' | 'bold' | 'italic' | 'bold_italic',
    strikethrough: false,
  },
  TextCaption: {
    type: 'TextCaption',
    text: '',
    visible: true,
    markdown: false,
    'font-weight': 'normal' as 'normal' | 'bold' | 'italic' | 'bold_italic',
    strikethrough: false,
  },

  // RichText
  RichText: {
    type: 'RichText',
    text: '',
    visible: true,
  },

  // Text Entry Components
  TextInput: {
    type: 'TextInput',
    label: '',
    name: '',
    'input-type': 'text' as 'text' | 'number' | 'email' | 'password' | 'passcode' | 'phone',
    required: false,
    visible: true,
    'max-chars': 80,
  },
  TextArea: {
    type: 'TextArea',
    label: '',
    name: '',
    required: false,
    visible: true,
    enabled: true,
    'max-length': 600,
  },

  // CheckboxGroup
  CheckboxGroup: {
    type: 'CheckboxGroup',
    label: '',
    name: '',
    'data-source': [],
    required: false,
    visible: true,
    enabled: true,
    'media-size': 'regular' as 'regular' | 'large',
  },

  // RadioButtonsGroup
  RadioButtonsGroup: {
    type: 'RadioButtonsGroup',
    label: '',
    name: '',
    'data-source': [],
    required: false,
    visible: true,
    enabled: true,
    'media-size': 'regular' as 'regular' | 'large',
  },

  // Footer
  Footer: {
    type: 'Footer',
    label: '',
    enabled: true,
    'on-click-action': {
      name: 'complete',
      payload: {},
    },
  },

  // OptIn
  OptIn: {
    type: 'OptIn',
    label: '',
    name: '',
    required: false,
    visible: true,
  },

  // Dropdown
  Dropdown: {
    type: 'Dropdown',
    label: '',
    'data-source': [],
    required: false,
    visible: true,
    enabled: true,
  },

  // EmbeddedLink
  EmbeddedLink: {
    type: 'EmbeddedLink',
    text: '',
    visible: true,
    'on-click-action': {
      name: 'navigate',
      next: { type: 'screen', name: '' },
      payload: {},
    },
  },

  // DatePicker
  DatePicker: {
    type: 'DatePicker',
    label: '',
    name: '',
    visible: true,
    enabled: true,
  },

  // CalendarPicker
  CalendarPicker: {
    type: 'CalendarPicker',
    label: '',
    name: '',
    visible: true,
    enabled: true,
    required: false,
    mode: 'single' as 'single' | 'range',
  },

  // ChipsSelector
  ChipsSelector: {
    type: 'ChipsSelector',
    label: '',
    name: '',
    'data-source': [],
    required: false,
    visible: true,
    enabled: true,
  },

  // NavigationList
  NavigationList: {
    type: 'NavigationList',
    name: '',
    'list-items': [],
    visible: true,
    'media-size': 'regular' as 'regular' | 'large',
    'on-click-action': {
      name: 'navigate',
      next: { type: 'screen', name: '' },
      payload: {},
    },
  },

  // Image
  Image: {
    type: 'Image',
    src: '',
    'scale-type': 'contain' as 'contain' | 'cover',
    'aspect-ratio': 1,
  },

  // ImageCarousel
  ImageCarousel: {
    type: 'ImageCarousel',
    images: [],
    'aspect-ratio': '4:3' as '4:3' | '16:9',
    'scale-type': 'contain' as 'contain' | 'cover',
  },

  // If Component
  If: {
    type: 'If',
    condition: '',
    then: [],
    else: [],
  },

  // Switch Component
  Switch: {
    type: 'Switch',
    value: '',
    cases: {},
  },
} as const;

/**
 * Get default values for a component type
 */
export function getComponentDefaults<T extends keyof typeof COMPONENT_DEFAULTS>(
  componentType: T
): typeof COMPONENT_DEFAULTS[T] {
  return { ...COMPONENT_DEFAULTS[componentType] };
}

/**
 * Create a new component with default values
 */
export function createComponent<T extends keyof typeof COMPONENT_DEFAULTS>(
  componentType: T,
  overrides?: Partial<typeof COMPONENT_DEFAULTS[T]>
): typeof COMPONENT_DEFAULTS[T] {
  return {
    ...getComponentDefaults(componentType),
    ...overrides,
  };
}

/**
 * Data source item default
 */
export const DATA_SOURCE_ITEM_DEFAULT = {
  id: '',
  title: '',
  description: '',
  metadata: '',
  enabled: true,
};

/**
 * Navigation list item default
 */
export const NAVIGATION_LIST_ITEM_DEFAULT = {
  mainContent: {
    title: '',
    description: '',
    metadata: '',
  },
  start: {
    image: '',
    altText: '',
  },
};

/**
 * Image carousel item default
 */
export const IMAGE_CAROUSEL_ITEM_DEFAULT = {
  src: '',
  altText: '',
};
