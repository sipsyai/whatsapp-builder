/**
 * Data source limits for WhatsApp Flow components
 * Based on official WhatsApp Flows documentation
 */

export const DATA_SOURCE_LIMITS = {
  Dropdown: {
    min: 1,
    max: 200,
    maxWithImages: 100,
  },
  RadioButtonsGroup: {
    min: 1,
    max: 20,
  },
  CheckboxGroup: {
    min: 1,
    max: 20,
  },
  ChipsSelector: {
    min: 2,
    max: 20,
  },
  NavigationList: {
    min: 1,
    max: 20,
  },
} as const;

/**
 * Image size limits (in KB)
 */
export const IMAGE_SIZE_LIMITS = {
  // Before Flow JSON version 6.0
  legacy: 300,
  // Flow JSON version 6.0 and after
  current: 100,
} as const;

/**
 * Other component limits
 */
export const OTHER_LIMITS = {
  // Maximum number of components per screen
  maxComponentsPerScreen: 50,

  // OptIn
  maxOptInsPerScreen: 5,

  // EmbeddedLink
  maxEmbeddedLinksPerScreen: 2,

  // Image
  maxImagesPerScreen: 3,
  recommendedImageSizeKB: 300,

  // NavigationList
  maxNavigationListsPerScreen: 2,
  maxBadgesPerList: 1,
  maxTagsPerItem: 3,

  // If component
  maxNestedIfComponents: 3,

  // ImageCarousel (Flow JSON 7.1+)
  ImageCarousel: {
    min: 1,
    max: 3,
    maxPerScreen: 2,
    maxPerFlow: 3,
  },

  // Payload
  totalDataChannelPayloadSizeMB: 1,
} as const;

/**
 * Helper function to get data source limits for a component
 */
export function getDataSourceLimits(
  componentType: keyof typeof DATA_SOURCE_LIMITS
): { min: number; max: number; maxWithImages?: number } | undefined {
  return DATA_SOURCE_LIMITS[componentType];
}

/**
 * Validate if data source count is within limits
 */
export function isDataSourceCountValid(
  componentType: keyof typeof DATA_SOURCE_LIMITS,
  count: number,
  hasImages: boolean = false
): boolean {
  const limits = getDataSourceLimits(componentType);
  if (!limits) return true;

  if (count < limits.min) return false;

  // Check max with images if applicable
  if (hasImages && 'maxWithImages' in limits && limits.maxWithImages) {
    return count <= limits.maxWithImages;
  }

  return count <= limits.max;
}

/**
 * Get validation message for data source count
 */
export function getDataSourceValidationMessage(
  componentType: keyof typeof DATA_SOURCE_LIMITS,
  count: number,
  hasImages: boolean = false
): string | null {
  const limits = getDataSourceLimits(componentType);
  if (!limits) return null;

  if (count < limits.min) {
    return `${componentType} requires at least ${limits.min} option${limits.min > 1 ? 's' : ''}`;
  }

  if (hasImages && 'maxWithImages' in limits && limits.maxWithImages) {
    if (count > limits.maxWithImages) {
      return `${componentType} with images can have maximum ${limits.maxWithImages} options`;
    }
  } else if (count > limits.max) {
    return `${componentType} can have maximum ${limits.max} options`;
  }

  return null;
}
