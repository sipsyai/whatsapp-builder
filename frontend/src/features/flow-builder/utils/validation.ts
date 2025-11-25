/**
 * Flow Validation Utilities
 *
 * Validates WhatsApp Flow JSON structure and content.
 */

import type { FlowJSON, FlowScreen, Component } from '../types';
import type { ValidationError, ValidationResult } from '../types/builder.types';

let errorIdCounter = 0;
function generateErrorId(): string {
  return `error-${++errorIdCounter}`;
}

/**
 * Validate a complete Flow JSON
 */
export function validateFlowJSON(flowJSON: FlowJSON): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate version
  if (!flowJSON.version) {
    errors.push({
      id: generateErrorId(),
      type: 'error',
      message: 'Flow version is required',
      path: 'version',
    });
  }

  // Validate screens exist
  if (!flowJSON.screens || flowJSON.screens.length === 0) {
    errors.push({
      id: generateErrorId(),
      type: 'error',
      message: 'Flow must have at least one screen',
      path: 'screens',
    });
  } else {
    // Validate each screen
    flowJSON.screens.forEach((screen) => {
      const screenErrors = validateScreen(screen);
      screenErrors.forEach(e => {
        if (e.type === 'error') {
          errors.push(e);
        } else {
          warnings.push(e);
        }
      });
    });

    // Validate screen IDs are unique
    const screenIds = flowJSON.screens.map(s => s.id);
    const duplicateIds = screenIds.filter((id, index) => screenIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push({
        id: generateErrorId(),
        type: 'error',
        message: `Duplicate screen IDs found: ${duplicateIds.join(', ')}`,
        path: 'screens',
      });
    }

    // Validate at least one terminal screen
    const hasTerminal = flowJSON.screens.some(s => s.terminal);
    if (!hasTerminal) {
      warnings.push({
        id: generateErrorId(),
        type: 'warning',
        message: 'Flow must have at least one terminal screen',
        path: 'screens',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    timestamp: Date.now(),
  };
}

/**
 * Validate a single screen
 */
export function validateScreen(screen: FlowScreen): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate screen ID
  if (!screen.id) {
    errors.push({
      id: generateErrorId(),
      type: 'error',
      message: 'Screen ID is required',
      path: `screens.${screen.id || 'unknown'}.id`,
      screenId: screen.id,
    });
  } else if (!/^[a-zA-Z0-9_-]+$/.test(screen.id)) {
    errors.push({
      id: generateErrorId(),
      type: 'error',
      message: 'Screen ID must contain only alphanumeric characters, underscores, and hyphens',
      path: `screens.${screen.id}.id`,
      screenId: screen.id,
    });
  }

  // Validate title
  if (!screen.title) {
    errors.push({
      id: generateErrorId(),
      type: 'warning',
      message: 'Screen title is required',
      path: `screens.${screen.id}.title`,
      screenId: screen.id,
    });
  }

  // Validate layout
  if (!screen.layout) {
    errors.push({
      id: generateErrorId(),
      type: 'error',
      message: 'Screen layout is required',
      path: `screens.${screen.id}.layout`,
      screenId: screen.id,
    });
  }

  // Validate components exist
  const children = screen.layout?.children || [];
  if (children.length === 0) {
    errors.push({
      id: generateErrorId(),
      type: 'warning',
      message: 'Screen must have at least one component',
      path: `screens.${screen.id}.layout.children`,
      screenId: screen.id,
    });
  } else {
    // Validate each component
    children.forEach((component: Component, index: number) => {
      const componentErrors = validateComponent(component, screen.id, index);
      errors.push(...componentErrors);
    });
  }

  return errors;
}

/**
 * Validate a single component
 */
export function validateComponent(
  component: Component,
  screenId: string,
  index: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  const basePath = `screens.${screenId}.layout.children[${index}]`;

  // Validate component type
  if (!component.type) {
    errors.push({
      id: generateErrorId(),
      type: 'error',
      message: 'Component type is required',
      path: `${basePath}.type`,
      screenId,
    });
  }

  // Type-specific validation
  switch (component.type) {
    case 'TextHeading':
    case 'TextSubheading':
    case 'TextBody':
    case 'TextCaption':
      if (!(component as any).text) {
        errors.push({
          id: generateErrorId(),
          type: 'error',
          message: `${component.type} must have text content`,
          path: `${basePath}.text`,
          screenId,
        });
      }
      break;

    case 'TextInput':
    case 'TextArea':
      if (!(component as any).name) {
        errors.push({
          id: generateErrorId(),
          type: 'error',
          message: `${component.type} must have a name`,
          path: `${basePath}.name`,
          screenId,
        });
      }
      if (!(component as any).label) {
        errors.push({
          id: generateErrorId(),
          type: 'warning',
          message: `${component.type} should have a label`,
          path: `${basePath}.label`,
          screenId,
        });
      }
      break;

    case 'Dropdown':
    case 'RadioButtonsGroup':
    case 'CheckboxGroup':
      if (!(component as any).name) {
        errors.push({
          id: generateErrorId(),
          type: 'error',
          message: `${component.type} must have a name`,
          path: `${basePath}.name`,
          screenId,
        });
      }
      if (!(component as any)['data-source'] || (component as any)['data-source'].length === 0) {
        errors.push({
          id: generateErrorId(),
          type: 'error',
          message: `${component.type} must have at least one option`,
          path: `${basePath}.data-source`,
          screenId,
        });
      }
      break;

    case 'Footer':
      if (!(component as any).label) {
        errors.push({
          id: generateErrorId(),
          type: 'error',
          message: 'Footer must have a label',
          path: `${basePath}.label`,
          screenId,
        });
      }
      if (!(component as any)['on-click-action']) {
        errors.push({
          id: generateErrorId(),
          type: 'error',
          message: 'Footer must have an action',
          path: `${basePath}.on-click-action`,
          screenId,
        });
      }
      break;

    case 'Image':
      if (!(component as any).src) {
        errors.push({
          id: generateErrorId(),
          type: 'error',
          message: 'Image must have a source',
          path: `${basePath}.src`,
          screenId,
        });
      }
      break;
  }

  return errors;
}

/**
 * Check if Flow JSON is valid (no errors)
 */
export function isFlowValid(flowJSON: FlowJSON): boolean {
  const result = validateFlowJSON(flowJSON);
  return result.isValid;
}

/**
 * Get all validation errors from Flow JSON
 */
export function getFlowErrors(flowJSON: FlowJSON): ValidationError[] {
  const result = validateFlowJSON(flowJSON);
  return result.errors;
}

/**
 * Get all validation warnings from Flow JSON
 */
export function getFlowWarnings(flowJSON: FlowJSON): ValidationError[] {
  const result = validateFlowJSON(flowJSON);
  return result.warnings;
}
