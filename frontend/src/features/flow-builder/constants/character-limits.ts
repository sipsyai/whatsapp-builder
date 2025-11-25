/**
 * Character limits for WhatsApp Flow components
 * Based on official WhatsApp Flows documentation
 */

export const CHARACTER_LIMITS = {
  // Text Components
  TextHeading: {
    text: 80,
  },
  TextSubheading: {
    text: 80,
  },
  TextBody: {
    text: 4096,
  },
  TextCaption: {
    text: 409,
  },

  // Text Entry Components
  TextInput: {
    label: 20,
    helperText: 80,
    errorMessage: 30,
    maxCharsDefault: 80,
  },
  TextArea: {
    label: 20,
    helperText: 80,
    maxLengthDefault: 600,
  },

  // CheckboxGroup
  CheckboxGroup: {
    label: 30,
    description: 300,
    optionTitle: 30,
    optionDescription: 300,
    optionMetadata: 20,
  },

  // RadioButtonsGroup
  RadioButtonsGroup: {
    label: 30,
    description: 300,
    optionTitle: 30,
    optionDescription: 300,
    optionMetadata: 20,
  },

  // Footer
  Footer: {
    label: 35,
    leftCaption: 15,
    centerCaption: 15,
    rightCaption: 15,
  },

  // OptIn
  OptIn: {
    label: 120,
  },

  // Dropdown
  Dropdown: {
    label: 20,
    optionTitle: 30,
    optionDescription: 300,
    optionMetadata: 20,
  },

  // EmbeddedLink
  EmbeddedLink: {
    text: 25,
  },

  // DatePicker
  DatePicker: {
    label: 40,
    helperText: 80,
    errorMessage: 80,
  },

  // CalendarPicker
  CalendarPicker: {
    title: 80,
    description: 300,
    label: 40,
    helperText: 80,
    errorMessage: 80,
  },

  // ChipsSelector
  ChipsSelector: {
    label: 80,
    description: 300,
  },

  // NavigationList
  NavigationList: {
    label: 80,
    description: 300,
    mainContentTitle: 30,
    mainContentDescription: 20,
    mainContentMetadata: 80,
    endTitle: 10,
    endDescription: 10,
    endMetadata: 10,
    badge: 15,
    tag: 15,
  },
} as const;

/**
 * Helper function to get character limit for a component field
 */
export function getCharacterLimit(
  componentType: keyof typeof CHARACTER_LIMITS,
  field: string
): number | undefined {
  const limits = CHARACTER_LIMITS[componentType] as Record<string, number>;
  return limits?.[field];
}

/**
 * Validate if text exceeds character limit
 */
export function isTextWithinLimit(
  text: string,
  componentType: keyof typeof CHARACTER_LIMITS,
  field: string
): boolean {
  const limit = getCharacterLimit(componentType, field);
  if (!limit) return true;
  return text.length <= limit;
}

/**
 * Get remaining characters
 */
export function getRemainingCharacters(
  text: string,
  componentType: keyof typeof CHARACTER_LIMITS,
  field: string
): number {
  const limit = getCharacterLimit(componentType, field);
  if (!limit) return Infinity;
  return Math.max(0, limit - text.length);
}
