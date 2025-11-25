/**
 * Flow Validation Hook
 *
 * Real-time validation hook for WhatsApp Flow Builder.
 * Validates screens, components, and entire flow structure.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type {
  BuilderScreen,
  BuilderComponent,
} from '../types';
import type {
  ValidationError as RuleValidationError,
} from '../utils/validation-rules';
import {
  validateScreen,
  validateCharacterLimit,
  validateDataSourceCount,
  validateRequiredField,
  CHARACTER_LIMITS,
} from '../utils/validation-rules';

// ============================================================================
// Types
// ============================================================================

interface ValidationError {
  id: string;
  type: 'error' | 'warning';
  message: string;
  path: string;
  screenId?: string;
  componentId?: string;
}

interface UseFlowValidationReturn {
  errors: ValidationError[];
  isValidating: boolean;
  validateAll: () => void;
  validateScreen: (screenId: string) => void;
  validateComponent: (screenId: string, componentId: string) => void;
  hasErrors: boolean;
  errorCount: number;
  warningCount: number;
  getErrorsForScreen: (screenId: string) => ValidationError[];
  getErrorsForComponent: (componentId: string) => ValidationError[];
  clearErrors: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert validation rule error to validation error
 */
function convertRuleError(
  ruleError: RuleValidationError,
  screenId?: string,
  componentId?: string
): ValidationError {
  return {
    id: `${Date.now()}-${Math.random()}`,
    type: 'error',
    message: ruleError.message,
    path: ruleError.path || '',
    screenId,
    componentId,
  };
}

/**
 * Validate component configuration
 */
function validateComponentConfig(
  component: BuilderComponent,
  screenId: string,
  path: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const config = component.config;
  const componentType = component.type;

  // Text components validation
  if (componentType === 'TextHeading' || componentType === 'TextSubheading' ||
      componentType === 'TextBody' || componentType === 'TextCaption') {
    const text = (config as any).text;
    if (text) {
      const error = validateCharacterLimit(
        text,
        componentType as keyof typeof CHARACTER_LIMITS,
        'text',
        `${path}.text`
      );
      if (error) {
        errors.push(convertRuleError(error, screenId, component.id));
      }
    }
  }

  // TextInput validation
  if (componentType === 'TextInput') {
    const textInput = config as any;

    if (textInput.label) {
      const error = validateCharacterLimit(
        textInput.label,
        'TextInput',
        'label',
        `${path}.label`
      );
      if (error) errors.push(convertRuleError(error, screenId, component.id));
    }

    if (textInput.helperText) {
      const error = validateCharacterLimit(
        textInput.helperText,
        'TextInput',
        'helperText',
        `${path}.helperText`
      );
      if (error) errors.push(convertRuleError(error, screenId, component.id));
    }

    // Required field validation
    const requiredError = validateRequiredField(
      textInput.name,
      'TextInput',
      'name',
      `${path}.name`
    );
    if (requiredError) errors.push(convertRuleError(requiredError, screenId, component.id));
  }

  // TextArea validation
  if (componentType === 'TextArea') {
    const textArea = config as any;

    if (textArea.label) {
      const error = validateCharacterLimit(
        textArea.label,
        'TextArea',
        'label',
        `${path}.label`
      );
      if (error) errors.push(convertRuleError(error, screenId, component.id));
    }

    // Required field validation
    const requiredError = validateRequiredField(
      textArea.name,
      'TextArea',
      'name',
      `${path}.name`
    );
    if (requiredError) errors.push(convertRuleError(requiredError, screenId, component.id));
  }

  // CheckboxGroup validation
  if (componentType === 'CheckboxGroup') {
    const checkboxGroup = config as any;

    if (checkboxGroup.label) {
      const error = validateCharacterLimit(
        checkboxGroup.label,
        'CheckboxGroup',
        'label',
        `${path}.label`
      );
      if (error) errors.push(convertRuleError(error, screenId, component.id));
    }

    // Data source validation
    if (checkboxGroup.dataSource && Array.isArray(checkboxGroup.dataSource)) {
      const dataSourceError = validateDataSourceCount(
        'CheckboxGroup',
        checkboxGroup.dataSource.length,
        false,
        `${path}.dataSource`
      );
      if (dataSourceError) errors.push(convertRuleError(dataSourceError, screenId, component.id));

      // Validate each option
      checkboxGroup.dataSource.forEach((option: any, index: number) => {
        if (option.title) {
          const titleError = validateCharacterLimit(
            option.title,
            'CheckboxGroup',
            'optionTitle',
            `${path}.dataSource[${index}].title`
          );
          if (titleError) errors.push(convertRuleError(titleError, screenId, component.id));
        }
      });
    }

    // Required field validation
    const requiredError = validateRequiredField(
      checkboxGroup.name,
      'CheckboxGroup',
      'name',
      `${path}.name`
    );
    if (requiredError) errors.push(convertRuleError(requiredError, screenId, component.id));
  }

  // RadioButtonsGroup validation
  if (componentType === 'RadioButtonsGroup') {
    const radioGroup = config as any;

    if (radioGroup.label) {
      const error = validateCharacterLimit(
        radioGroup.label,
        'RadioButtonsGroup',
        'label',
        `${path}.label`
      );
      if (error) errors.push(convertRuleError(error, screenId, component.id));
    }

    // Data source validation
    if (radioGroup.dataSource && Array.isArray(radioGroup.dataSource)) {
      const dataSourceError = validateDataSourceCount(
        'RadioButtonsGroup',
        radioGroup.dataSource.length,
        false,
        `${path}.dataSource`
      );
      if (dataSourceError) errors.push(convertRuleError(dataSourceError, screenId, component.id));

      // Validate each option
      radioGroup.dataSource.forEach((option: any, index: number) => {
        if (option.title) {
          const titleError = validateCharacterLimit(
            option.title,
            'RadioButtonsGroup',
            'optionTitle',
            `${path}.dataSource[${index}].title`
          );
          if (titleError) errors.push(convertRuleError(titleError, screenId, component.id));
        }
      });
    }

    // Required field validation
    const requiredError = validateRequiredField(
      radioGroup.name,
      'RadioButtonsGroup',
      'name',
      `${path}.name`
    );
    if (requiredError) errors.push(convertRuleError(requiredError, screenId, component.id));
  }

  // Dropdown validation
  if (componentType === 'Dropdown') {
    const dropdown = config as any;

    if (dropdown.label) {
      const error = validateCharacterLimit(
        dropdown.label,
        'Dropdown',
        'label',
        `${path}.label`
      );
      if (error) errors.push(convertRuleError(error, screenId, component.id));
    }

    // Data source validation
    if (dropdown.dataSource && Array.isArray(dropdown.dataSource)) {
      const hasImages = dropdown.dataSource.some((item: any) => item.metadata?.image);
      const dataSourceError = validateDataSourceCount(
        'Dropdown',
        dropdown.dataSource.length,
        hasImages,
        `${path}.dataSource`
      );
      if (dataSourceError) errors.push(convertRuleError(dataSourceError, screenId, component.id));

      // Validate each option
      dropdown.dataSource.forEach((option: any, index: number) => {
        if (option.title) {
          const titleError = validateCharacterLimit(
            option.title,
            'Dropdown',
            'optionTitle',
            `${path}.dataSource[${index}].title`
          );
          if (titleError) errors.push(convertRuleError(titleError, screenId, component.id));
        }
      });
    }

    // Required field validation
    const requiredError = validateRequiredField(
      dropdown.name,
      'Dropdown',
      'name',
      `${path}.name`
    );
    if (requiredError) errors.push(convertRuleError(requiredError, screenId, component.id));
  }

  // Footer validation
  if (componentType === 'Footer') {
    const footer = config as any;

    if (footer.label) {
      const error = validateCharacterLimit(
        footer.label,
        'Footer',
        'label',
        `${path}.label`
      );
      if (error) errors.push(convertRuleError(error, screenId, component.id));
    }

    // Required field validation
    const requiredError = validateRequiredField(
      footer.label,
      'Footer',
      'label',
      `${path}.label`
    );
    if (requiredError) errors.push(convertRuleError(requiredError, screenId, component.id));
  }

  // OptIn validation
  if (componentType === 'OptIn') {
    const optIn = config as any;

    if (optIn.label) {
      const error = validateCharacterLimit(
        optIn.label,
        'OptIn',
        'label',
        `${path}.label`
      );
      if (error) errors.push(convertRuleError(error, screenId, component.id));
    }

    // Required field validation
    const requiredError = validateRequiredField(
      optIn.name,
      'OptIn',
      'name',
      `${path}.name`
    );
    if (requiredError) errors.push(convertRuleError(requiredError, screenId, component.id));
  }

  // DatePicker validation
  if (componentType === 'DatePicker') {
    const datePicker = config as any;

    if (datePicker.label) {
      const error = validateCharacterLimit(
        datePicker.label,
        'DatePicker',
        'label',
        `${path}.label`
      );
      if (error) errors.push(convertRuleError(error, screenId, component.id));
    }

    // Required field validation
    const requiredError = validateRequiredField(
      datePicker.name,
      'DatePicker',
      'name',
      `${path}.name`
    );
    if (requiredError) errors.push(convertRuleError(requiredError, screenId, component.id));
  }

  // CalendarPicker validation
  if (componentType === 'CalendarPicker') {
    const calendarPicker = config as any;

    if (calendarPicker.title) {
      const error = validateCharacterLimit(
        calendarPicker.title,
        'CalendarPicker',
        'title',
        `${path}.title`
      );
      if (error) errors.push(convertRuleError(error, screenId, component.id));
    }

    if (calendarPicker.label) {
      const error = validateCharacterLimit(
        calendarPicker.label,
        'CalendarPicker',
        'label',
        `${path}.label`
      );
      if (error) errors.push(convertRuleError(error, screenId, component.id));
    }

    // Required field validation
    const requiredError = validateRequiredField(
      calendarPicker.name,
      'CalendarPicker',
      'name',
      `${path}.name`
    );
    if (requiredError) errors.push(convertRuleError(requiredError, screenId, component.id));
  }

  // ChipsSelector validation
  if (componentType === 'ChipsSelector') {
    const chipsSelector = config as any;

    if (chipsSelector.label) {
      const error = validateCharacterLimit(
        chipsSelector.label,
        'ChipsSelector',
        'label',
        `${path}.label`
      );
      if (error) errors.push(convertRuleError(error, screenId, component.id));
    }

    // Data source validation
    if (chipsSelector.dataSource && Array.isArray(chipsSelector.dataSource)) {
      const dataSourceError = validateDataSourceCount(
        'ChipsSelector',
        chipsSelector.dataSource.length,
        false,
        `${path}.dataSource`
      );
      if (dataSourceError) errors.push(convertRuleError(dataSourceError, screenId, component.id));
    }

    // Required field validation
    const requiredError = validateRequiredField(
      chipsSelector.name,
      'ChipsSelector',
      'name',
      `${path}.name`
    );
    if (requiredError) errors.push(convertRuleError(requiredError, screenId, component.id));
  }

  // NavigationList validation
  if (componentType === 'NavigationList') {
    const navList = config as any;

    if (navList.label) {
      const error = validateCharacterLimit(
        navList.label,
        'NavigationList',
        'label',
        `${path}.label`
      );
      if (error) errors.push(convertRuleError(error, screenId, component.id));
    }

    // Data source validation
    if (navList.dataSource && Array.isArray(navList.dataSource)) {
      const dataSourceError = validateDataSourceCount(
        'NavigationList',
        navList.dataSource.length,
        false,
        `${path}.dataSource`
      );
      if (dataSourceError) errors.push(convertRuleError(dataSourceError, screenId, component.id));
    }
  }

  // EmbeddedLink validation
  if (componentType === 'EmbeddedLink') {
    const embeddedLink = config as any;

    if (embeddedLink.text) {
      const error = validateCharacterLimit(
        embeddedLink.text,
        'EmbeddedLink',
        'text',
        `${path}.text`
      );
      if (error) errors.push(convertRuleError(error, screenId, component.id));
    }

    // Required field validation
    const textError = validateRequiredField(
      embeddedLink.text,
      'EmbeddedLink',
      'text',
      `${path}.text`
    );
    if (textError) errors.push(convertRuleError(textError, screenId, component.id));

    const urlError = validateRequiredField(
      embeddedLink.url,
      'EmbeddedLink',
      'url',
      `${path}.url`
    );
    if (urlError) errors.push(convertRuleError(urlError, screenId, component.id));
  }

  return errors;
}

/**
 * Convert BuilderComponent to validation format
 */
function convertComponentsForValidation(components: BuilderComponent[]): any[] {
  return components.map(component => ({
    type: component.type,
    ...component.config,
  }));
}

/**
 * Check if screen is terminal (has no outgoing navigation)
 */
function isTerminalScreen(screen: BuilderScreen): boolean {
  // A screen is terminal if it has no navigation actions
  // or if it only has CompleteAction or DataExchangeAction
  const hasNavigateAction = screen.components.some(component => {
    const config = component.config as any;

    // Check Footer for navigation
    if (component.type === 'Footer') {
      return config.onClickAction?.name === 'navigate';
    }

    // Check NavigationList
    if (component.type === 'NavigationList' && config.dataSource) {
      return config.dataSource.some((item: any) =>
        item.onSelectAction?.name === 'navigate'
      );
    }

    return false;
  });

  return !hasNavigateAction;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export const useFlowValidation = (screens: BuilderScreen[]): UseFlowValidationReturn => {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  /**
   * Validate all screens in the flow
   */
  const validateAll = useCallback(() => {
    setIsValidating(true);
    const allErrors: ValidationError[] = [];

    screens.forEach(screen => {
      // Convert components for screen-level validation
      const componentsForValidation = convertComponentsForValidation(screen.components);
      const isTerminal = isTerminalScreen(screen);

      // Validate screen structure
      const screenValidation = validateScreen({
        components: componentsForValidation,
        isTerminal,
        path: `screens.${screen.id}`,
      });

      // Convert screen errors
      screenValidation.errors.forEach(error => {
        allErrors.push(convertRuleError(error, screen.id));
      });

      // Validate individual components
      screen.components.forEach((component, index) => {
        const componentPath = `screens.${screen.id}.components.${index}`;
        const componentErrors = validateComponentConfig(
          component,
          screen.id,
          componentPath
        );
        allErrors.push(...componentErrors);
      });
    });

    setErrors(allErrors);
    setIsValidating(false);
  }, [screens]);

  /**
   * Validate a single screen
   */
  const validateScreenById = useCallback((screenId: string) => {
    const screen = screens.find(s => s.id === screenId);
    if (!screen) return;

    setIsValidating(true);
    const screenErrors: ValidationError[] = [];

    // Convert components for screen-level validation
    const componentsForValidation = convertComponentsForValidation(screen.components);
    const isTerminal = isTerminalScreen(screen);

    // Validate screen structure
    const screenValidation = validateScreen({
      components: componentsForValidation,
      isTerminal,
      path: `screens.${screen.id}`,
    });

    // Convert screen errors
    screenValidation.errors.forEach(error => {
      screenErrors.push(convertRuleError(error, screen.id));
    });

    // Validate individual components
    screen.components.forEach((component, index) => {
      const componentPath = `screens.${screen.id}.components.${index}`;
      const componentErrors = validateComponentConfig(
        component,
        screen.id,
        componentPath
      );
      screenErrors.push(...componentErrors);
    });

    // Replace errors for this screen
    setErrors(prevErrors => [
      ...prevErrors.filter(e => e.screenId !== screenId),
      ...screenErrors,
    ]);

    setIsValidating(false);
  }, [screens]);

  /**
   * Validate a single component
   */
  const validateComponentById = useCallback((screenId: string, componentId: string) => {
    const screen = screens.find(s => s.id === screenId);
    if (!screen) return;

    const componentIndex = screen.components.findIndex(c => c.id === componentId);
    if (componentIndex === -1) return;

    const component = screen.components[componentIndex];

    setIsValidating(true);

    const componentPath = `screens.${screen.id}.components.${componentIndex}`;
    const componentErrors = validateComponentConfig(
      component,
      screen.id,
      componentPath
    );

    // Replace errors for this component
    setErrors(prevErrors => [
      ...prevErrors.filter(e => e.componentId !== componentId),
      ...componentErrors,
    ]);

    setIsValidating(false);
  }, [screens]);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  /**
   * Get errors for a specific screen
   */
  const getErrorsForScreen = useCallback((screenId: string) => {
    return errors.filter(e => e.screenId === screenId);
  }, [errors]);

  /**
   * Get errors for a specific component
   */
  const getErrorsForComponent = useCallback((componentId: string) => {
    return errors.filter(e => e.componentId === componentId);
  }, [errors]);

  /**
   * Computed values
   */
  const hasErrors = useMemo(() => {
    return errors.filter(e => e.type === 'error').length > 0;
  }, [errors]);

  const errorCount = useMemo(() => {
    return errors.filter(e => e.type === 'error').length;
  }, [errors]);

  const warningCount = useMemo(() => {
    return errors.filter(e => e.type === 'warning').length;
  }, [errors]);

  /**
   * Debounced auto-validation
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      validateAll();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [screens, validateAll]);

  return {
    errors,
    isValidating,
    validateAll,
    validateScreen: validateScreenById,
    validateComponent: validateComponentById,
    hasErrors,
    errorCount,
    warningCount,
    getErrorsForScreen,
    getErrorsForComponent,
    clearErrors,
  };
};

// ============================================================================
// Export Types
// ============================================================================

export type { ValidationError, UseFlowValidationReturn };
