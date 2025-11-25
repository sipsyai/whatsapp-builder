/**
 * Validation rules for WhatsApp Flow components
 * Based on official WhatsApp Flows documentation
 */

import { CHARACTER_LIMITS, isTextWithinLimit } from '../constants/character-limits';
import {
  DATA_SOURCE_LIMITS,
  OTHER_LIMITS,
  isDataSourceCountValid,
  getDataSourceValidationMessage,
} from '../constants/data-source-limits';

// Re-export for convenience
export { CHARACTER_LIMITS, DATA_SOURCE_LIMITS, OTHER_LIMITS };

/**
 * Screen validation rules
 */
export const SCREEN_VALIDATION_RULES = {
  MAX_COMPONENTS_PER_SCREEN: OTHER_LIMITS.maxComponentsPerScreen,
  SINGLE_FOOTER_PER_SCREEN: true,
  TERMINAL_SCREEN_REQUIRES_FOOTER: true,
  NAVIGATION_LIST_NOT_ON_TERMINAL: true,
} as const;

/**
 * If component validation rules
 */
export const IF_COMPONENT_RULES = {
  FOOTER_BOTH_BRANCHES: true,
  MAX_NESTED_IF: OTHER_LIMITS.maxNestedIfComponents,
} as const;

/**
 * Validation error types
 */
export const ValidationErrorType = {
  CHARACTER_LIMIT: 'CHARACTER_LIMIT',
  DATA_SOURCE_LIMIT: 'DATA_SOURCE_LIMIT',
  MAX_COMPONENTS: 'MAX_COMPONENTS',
  SINGLE_FOOTER: 'SINGLE_FOOTER',
  TERMINAL_FOOTER_REQUIRED: 'TERMINAL_FOOTER_REQUIRED',
  NAVIGATION_LIST_ON_TERMINAL: 'NAVIGATION_LIST_ON_TERMINAL',
  IF_FOOTER_BOTH_BRANCHES: 'IF_FOOTER_BOTH_BRANCHES',
  IF_NESTED_LIMIT: 'IF_NESTED_LIMIT',
  EMPTY_VALUE: 'EMPTY_VALUE',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
} as const;

export type ValidationErrorType = typeof ValidationErrorType[keyof typeof ValidationErrorType];

/**
 * Validation error
 */
export interface ValidationError {
  type: ValidationErrorType;
  message: string;
  path?: string;
  componentType?: string;
  field?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Component type
 */
type ComponentType = keyof typeof CHARACTER_LIMITS;

/**
 * Validate character limit for a field
 */
export function validateCharacterLimit(
  text: string,
  componentType: ComponentType,
  field: string,
  path?: string
): ValidationError | null {
  if (isTextWithinLimit(text, componentType, field)) {
    return null;
  }

  const limit = CHARACTER_LIMITS[componentType][field as keyof typeof CHARACTER_LIMITS[typeof componentType]];

  return {
    type: ValidationErrorType.CHARACTER_LIMIT,
    message: `${field} exceeds character limit of ${limit} characters (current: ${text.length})`,
    path,
    componentType,
    field,
  };
}

/**
 * Validate data source count
 */
export function validateDataSourceCount(
  componentType: keyof typeof DATA_SOURCE_LIMITS,
  count: number,
  hasImages: boolean = false,
  path?: string
): ValidationError | null {
  if (isDataSourceCountValid(componentType, count, hasImages)) {
    return null;
  }

  const message = getDataSourceValidationMessage(componentType, count, hasImages);

  return {
    type: ValidationErrorType.DATA_SOURCE_LIMIT,
    message: message || 'Invalid data source count',
    path,
    componentType,
  };
}

/**
 * Validate empty or blank value
 */
export function validateNotEmpty(
  value: string,
  componentType: string,
  field: string,
  path?: string
): ValidationError | null {
  if (value && value.trim().length > 0) {
    return null;
  }

  return {
    type: ValidationErrorType.EMPTY_VALUE,
    message: `${field} cannot be empty or blank`,
    path,
    componentType,
    field,
  };
}

/**
 * Validate required field
 */
export function validateRequiredField(
  value: any,
  componentType: string,
  field: string,
  path?: string
): ValidationError | null {
  if (value !== undefined && value !== null && value !== '') {
    return null;
  }

  return {
    type: ValidationErrorType.REQUIRED_FIELD,
    message: `${field} is required`,
    path,
    componentType,
    field,
  };
}

/**
 * Screen validation context
 */
interface ScreenValidationContext {
  components: any[];
  isTerminal: boolean;
  path?: string;
}

/**
 * Count components by type
 */
function countComponentsByType(components: any[], type: string): number {
  let count = 0;

  for (const component of components) {
    if (component.type === type) {
      count++;
    }

    // Check nested If components
    if (component.type === 'If') {
      if (component.then) {
        count += countComponentsByType(component.then, type);
      }
      if (component.else) {
        count += countComponentsByType(component.else, type);
      }
    }

    // Check Switch components
    if (component.type === 'Switch' && component.cases) {
      for (const caseComponents of Object.values(component.cases)) {
        if (Array.isArray(caseComponents)) {
          count += countComponentsByType(caseComponents, type);
        }
      }
    }
  }

  return count;
}

/**
 * Count total components recursively
 */
function countTotalComponents(components: any[]): number {
  let count = 0;

  for (const component of components) {
    count++;

    if (component.type === 'If') {
      if (component.then) {
        count += countTotalComponents(component.then);
      }
      if (component.else) {
        count += countTotalComponents(component.else);
      }
    }

    if (component.type === 'Switch' && component.cases) {
      for (const caseComponents of Object.values(component.cases)) {
        if (Array.isArray(caseComponents)) {
          count += countTotalComponents(caseComponents);
        }
      }
    }
  }

  return count;
}

/**
 * Validate max components per screen
 */
export function validateMaxComponentsPerScreen(
  context: ScreenValidationContext
): ValidationError | null {
  const count = countTotalComponents(context.components);

  if (count <= SCREEN_VALIDATION_RULES.MAX_COMPONENTS_PER_SCREEN) {
    return null;
  }

  return {
    type: ValidationErrorType.MAX_COMPONENTS,
    message: `Screen exceeds maximum of ${SCREEN_VALIDATION_RULES.MAX_COMPONENTS_PER_SCREEN} components (current: ${count})`,
    path: context.path,
  };
}

/**
 * Validate single footer per screen
 */
export function validateSingleFooterPerScreen(
  context: ScreenValidationContext
): ValidationError | null {
  const footerCount = countComponentsByType(context.components, 'Footer');

  if (footerCount <= 1) {
    return null;
  }

  return {
    type: ValidationErrorType.SINGLE_FOOTER,
    message: 'You can only have 1 Footer component per screen',
    path: context.path,
  };
}

/**
 * Validate terminal screen has footer
 */
export function validateTerminalScreenHasFooter(
  context: ScreenValidationContext
): ValidationError | null {
  if (!context.isTerminal) {
    return null;
  }

  const footerCount = countComponentsByType(context.components, 'Footer');

  if (footerCount > 0) {
    return null;
  }

  return {
    type: ValidationErrorType.TERMINAL_FOOTER_REQUIRED,
    message: 'Terminal screen must have a Footer component',
    path: context.path,
  };
}

/**
 * Validate NavigationList not on terminal screen
 */
export function validateNavigationListNotOnTerminal(
  context: ScreenValidationContext
): ValidationError | null {
  if (!context.isTerminal) {
    return null;
  }

  const navListCount = countComponentsByType(context.components, 'NavigationList');

  if (navListCount === 0) {
    return null;
  }

  return {
    type: ValidationErrorType.NAVIGATION_LIST_ON_TERMINAL,
    message: 'NavigationList component cannot be used on a terminal screen',
    path: context.path,
  };
}

/**
 * Check if If component has footer in both branches
 */
function hasFooterInBranch(components: any[]): boolean {
  return components.some(c => c.type === 'Footer');
}

/**
 * Validate If component footer in both branches
 */
export function validateIfFooterBothBranches(
  ifComponent: any,
  path?: string
): ValidationError | null {
  const thenHasFooter = hasFooterInBranch(ifComponent.then || []);
  const elseHasFooter = hasFooterInBranch(ifComponent.else || []);

  // If one branch has footer, both must have
  if (thenHasFooter || elseHasFooter) {
    if (!thenHasFooter) {
      return {
        type: ValidationErrorType.IF_FOOTER_BOTH_BRANCHES,
        message: 'Missing Footer inside one of the if branches. Branch "then" should contain one Footer',
        path,
        componentType: 'If',
      };
    }

    if (!elseHasFooter) {
      return {
        type: ValidationErrorType.IF_FOOTER_BOTH_BRANCHES,
        message: 'Missing Footer inside one of the if branches. Branch "else" should exist and contain one Footer',
        path,
        componentType: 'If',
      };
    }
  }

  return null;
}

/**
 * Count nested If components depth
 */
function countNestedIfDepth(components: any[], currentDepth: number = 0): number {
  let maxDepth = currentDepth;

  for (const component of components) {
    if (component.type === 'If') {
      const newDepth = currentDepth + 1;
      maxDepth = Math.max(maxDepth, newDepth);

      if (component.then) {
        maxDepth = Math.max(maxDepth, countNestedIfDepth(component.then, newDepth));
      }
      if (component.else) {
        maxDepth = Math.max(maxDepth, countNestedIfDepth(component.else, newDepth));
      }
    }
  }

  return maxDepth;
}

/**
 * Validate If component nesting limit
 */
export function validateIfNestedLimit(
  components: any[],
  path?: string
): ValidationError | null {
  const depth = countNestedIfDepth(components);

  if (depth <= IF_COMPONENT_RULES.MAX_NESTED_IF) {
    return null;
  }

  return {
    type: ValidationErrorType.IF_NESTED_LIMIT,
    message: `If components can only be nested up to ${IF_COMPONENT_RULES.MAX_NESTED_IF} levels (current: ${depth})`,
    path,
    componentType: 'If',
  };
}

/**
 * Validate screen
 */
export function validateScreen(context: ScreenValidationContext): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate max components
  const maxComponentsError = validateMaxComponentsPerScreen(context);
  if (maxComponentsError) {
    errors.push(maxComponentsError);
  }

  // Validate single footer
  const singleFooterError = validateSingleFooterPerScreen(context);
  if (singleFooterError) {
    errors.push(singleFooterError);
  }

  // Validate terminal screen footer
  const terminalFooterError = validateTerminalScreenHasFooter(context);
  if (terminalFooterError) {
    errors.push(terminalFooterError);
  }

  // Validate NavigationList not on terminal
  const navListError = validateNavigationListNotOnTerminal(context);
  if (navListError) {
    errors.push(navListError);
  }

  // Validate If nesting
  const ifNestingError = validateIfNestedLimit(context.components, context.path);
  if (ifNestingError) {
    errors.push(ifNestingError);
  }

  // Validate If footer branches (recursive check for all If components)
  function checkIfComponents(components: any[], basePath?: string) {
    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      const componentPath = basePath ? `${basePath}/components[${i}]` : `components[${i}]`;

      if (component.type === 'If') {
        const ifError = validateIfFooterBothBranches(component, componentPath);
        if (ifError) {
          errors.push(ifError);
        }

        // Check nested components
        if (component.then) {
          checkIfComponents(component.then, `${componentPath}/then`);
        }
        if (component.else) {
          checkIfComponents(component.else, `${componentPath}/else`);
        }
      }
    }
  }

  checkIfComponents(context.components, context.path);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create validation result
 */
export function createValidationResult(errors: (ValidationError | null)[]): ValidationResult {
  const validErrors = errors.filter((e): e is ValidationError => e !== null);

  return {
    valid: validErrors.length === 0,
    errors: validErrors,
  };
}
