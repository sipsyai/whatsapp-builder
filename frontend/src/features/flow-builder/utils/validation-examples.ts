/**
 * Example usage of validation rules
 * This file demonstrates how to use the validation utilities
 */

import {
  validateCharacterLimit,
  validateDataSourceCount,
  validateNotEmpty,
  validateRequiredField,
  validateScreen,
  createValidationResult,
} from './validation-rules';

/**
 * Example: Validate a TextInput component
 */
export function validateTextInputExample() {
  const component = {
    type: 'TextInput',
    label: 'Enter your name',
    helperText: 'Please enter your full name as it appears on your ID',
    errorMessage: 'Name is required',
  };

  const errors = [
    validateCharacterLimit(component.label, 'TextInput', 'label', 'screen1/components[0]/label'),
    validateCharacterLimit(
      component.helperText,
      'TextInput',
      'helperText',
      'screen1/components[0]/helperText'
    ),
    validateCharacterLimit(
      component.errorMessage,
      'TextInput',
      'errorMessage',
      'screen1/components[0]/errorMessage'
    ),
    validateNotEmpty(component.label, 'TextInput', 'label', 'screen1/components[0]/label'),
  ];

  return createValidationResult(errors);
}

/**
 * Example: Validate a Dropdown component
 */
export function validateDropdownExample() {
  const component = {
    type: 'Dropdown',
    label: 'Select your country',
    dataSource: [
      { id: '1', title: 'USA', enabled: true },
      { id: '2', title: 'UK', enabled: true },
      // ... more options
    ],
  };

  const hasImages = component.dataSource.some((item: any) => item.image);

  const errors = [
    validateCharacterLimit(component.label, 'Dropdown', 'label', 'screen1/components[0]/label'),
    validateDataSourceCount(
      'Dropdown',
      component.dataSource.length,
      hasImages,
      'screen1/components[0]/dataSource'
    ),
    validateRequiredField(component.label, 'Dropdown', 'label', 'screen1/components[0]/label'),
  ];

  return createValidationResult(errors);
}

/**
 * Example: Validate a screen
 */
export function validateScreenExample() {
  const screen = {
    id: 'SCREEN_1',
    title: 'Welcome',
    terminal: false,
    components: [
      {
        type: 'TextHeading',
        text: 'Welcome to our service',
      },
      {
        type: 'TextBody',
        text: 'Please fill out the form below',
      },
      {
        type: 'TextInput',
        label: 'Name',
        name: 'name',
        required: true,
      },
      {
        type: 'Footer',
        label: 'Continue',
        onClickAction: {
          name: 'navigate',
          next: { type: 'screen', name: 'SCREEN_2' },
        },
      },
    ],
  };

  return validateScreen({
    components: screen.components,
    isTerminal: screen.terminal,
    path: `screens/${screen.id}`,
  });
}

/**
 * Example: Validate a screen with If component
 */
export function validateScreenWithIfExample() {
  const screen = {
    id: 'SCREEN_1',
    title: 'Conditional Form',
    terminal: true,
    components: [
      {
        type: 'TextHeading',
        text: 'Welcome',
      },
      {
        type: 'If',
        condition: '${form.showDetails} == true',
        then: [
          {
            type: 'TextBody',
            text: 'Details section',
          },
          {
            type: 'Footer',
            label: 'Submit',
            onClickAction: { name: 'complete' },
          },
        ],
        else: [
          {
            type: 'TextBody',
            text: 'Skip details',
          },
          {
            type: 'Footer',
            label: 'Continue',
            onClickAction: { name: 'complete' },
          },
        ],
      },
    ],
  };

  return validateScreen({
    components: screen.components,
    isTerminal: screen.terminal,
    path: `screens/${screen.id}`,
  });
}

/**
 * Example: Validate NavigationList component
 */
export function validateNavigationListExample() {
  const component = {
    type: 'NavigationList',
    label: 'Choose a category',
    description: 'Select from available categories',
    name: 'category_list',
    listItems: [
      {
        id: '1',
        mainContent: {
          title: 'Electronics',
          description: 'Phones, laptops, accessories',
          metadata: 'Popular',
        },
      },
      // ... more items
    ],
  };

  const errors = [
    validateCharacterLimit(
      component.label,
      'NavigationList',
      'label',
      'screen1/components[0]/label'
    ),
    validateCharacterLimit(
      component.description,
      'NavigationList',
      'description',
      'screen1/components[0]/description'
    ),
    validateDataSourceCount(
      'NavigationList',
      component.listItems.length,
      false,
      'screen1/components[0]/listItems'
    ),
  ];

  return createValidationResult(errors);
}

/**
 * Example: Real-time validation for input field
 */
export function validateInputRealTime(
  value: string,
  componentType: 'TextInput' | 'TextArea',
  field: 'label' | 'helperText'
) {
  const error = validateCharacterLimit(value, componentType, field);

  if (error) {
    return {
      isValid: false,
      errorMessage: error.message,
    };
  }

  return {
    isValid: true,
    errorMessage: null,
  };
}

/**
 * Example: Validate entire flow
 */
export function validateFlowExample(flow: any) {
  const allErrors: any[] = [];

  // Validate each screen
  for (const [screenId, screen] of Object.entries(flow.screens)) {
    const screenData = screen as any;

    const result = validateScreen({
      components: screenData.layout || [],
      isTerminal: screenData.terminal || false,
      path: `screens/${screenId}`,
    });

    if (!result.valid) {
      allErrors.push({
        screenId,
        errors: result.errors,
      });
    }
  }

  return {
    valid: allErrors.length === 0,
    screenErrors: allErrors,
  };
}
