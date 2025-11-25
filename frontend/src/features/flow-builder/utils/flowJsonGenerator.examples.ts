/**
 * Flow JSON Generator Examples
 *
 * Practical examples showing how to use the Flow JSON Generator
 * in different scenarios.
 */

import {
  generateFlowJSON,
  builderScreenToFlowScreen,
  builderComponentToFlowComponent,
  generateRoutingModel,
  validateGeneratedJSON,
  exportFlowJSON,
  exportFlowJSONMinified,
  calculateFlowJSONSize,
  isFlowJSONWithinSizeLimit,
  type GeneratorOptions,
} from './flowJsonGenerator';

import type {
  BuilderScreen,
  BuilderComponent,
  FlowBuilderState,
} from '../types/builder.types';

import type { FlowJSON } from '../types/flow-json.types';

// ============================================================================
// Example 1: Basic Flow Generation
// ============================================================================

/**
 * Generate a simple Flow JSON from builder state
 */
export function example1_BasicGeneration() {
  // Sample builder screens
  const screens: BuilderScreen[] = [
    {
      id: 'WELCOME',
      title: 'Welcome Screen',
      terminal: false,
      components: [
        {
          id: 'heading-1',
          type: 'TextHeading',
          config: {
            type: 'TextHeading',
            text: 'Welcome!',
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'footer-1',
          type: 'Footer',
          config: {
            type: 'Footer',
            label: 'Start',
            'on-click-action': {
              name: 'navigate',
              next: { type: 'screen', name: 'QUESTIONS' },
            },
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
      ],
      validation: { isValid: true, errors: [], warnings: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'QUESTIONS',
      title: 'Questions',
      terminal: true,
      components: [
        {
          id: 'input-1',
          type: 'TextInput',
          config: {
            type: 'TextInput',
            name: 'full_name',
            label: 'Full Name',
            required: true,
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'footer-2',
          type: 'Footer',
          config: {
            type: 'Footer',
            label: 'Submit',
            'on-click-action': {
              name: 'complete',
            },
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
      ],
      validation: { isValid: true, errors: [], warnings: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Generate Flow JSON
  const flowJSON = generateFlowJSON(screens);

  console.log('Generated Flow JSON:', JSON.stringify(flowJSON, null, 2));

  return flowJSON;
}

// ============================================================================
// Example 2: Flow with Custom Options
// ============================================================================

/**
 * Generate Flow JSON with custom version and routing model
 */
export function example2_CustomOptions() {
  const screens: BuilderScreen[] = [
    /* ... screens ... */
  ] as any;

  const edges = [
    {
      id: 'edge-1',
      source: 'WELCOME',
      target: 'QUESTIONS',
      type: 'default',
    },
  ];

  const options: GeneratorOptions = {
    version: '7.2',
    dataApiVersion: '3.0',
    includeRoutingModel: true,
    cleanOutput: true,
  };

  const flowJSON = generateFlowJSON(screens, edges, options);

  console.log('Flow JSON with routing model:', flowJSON.routing_model);

  return flowJSON;
}

// ============================================================================
// Example 3: Generate and Validate
// ============================================================================

/**
 * Generate Flow JSON and validate it
 */
export function example3_GenerateAndValidate() {
  const screens: BuilderScreen[] = [
    /* ... screens ... */
  ] as any;

  // Generate
  const flowJSON = generateFlowJSON(screens);

  // Validate
  const errors = validateGeneratedJSON(flowJSON);

  if (errors.length > 0) {
    console.error('Validation errors:', errors);
    return null;
  }

  console.log('Flow JSON is valid!');
  return flowJSON;
}

// ============================================================================
// Example 4: Export for Download
// ============================================================================

/**
 * Generate and export Flow JSON for file download
 */
export function example4_ExportForDownload(screens: BuilderScreen[], flowName: string) {
  // Generate Flow JSON
  const flowJSON = generateFlowJSON(screens, [], {
    version: '7.2',
    dataApiVersion: '3.0',
  });

  // Validate
  const errors = validateGeneratedJSON(flowJSON);
  if (errors.length > 0) {
    throw new Error(`Invalid Flow JSON: ${errors.join(', ')}`);
  }

  // Export as formatted JSON
  const jsonString = exportFlowJSON(flowJSON, 2);

  // Create blob for download
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = `${flowName}.json`;
  link.click();

  // Cleanup
  URL.revokeObjectURL(url);

  return flowJSON;
}

// ============================================================================
// Example 5: Check Size Before Export
// ============================================================================

/**
 * Check if Flow JSON is within WhatsApp's 10MB limit
 */
export function example5_CheckSizeLimit(screens: BuilderScreen[]) {
  const flowJSON = generateFlowJSON(screens);

  const size = calculateFlowJSONSize(flowJSON);
  const sizeInMB = size / (1024 * 1024);

  console.log(`Flow JSON size: ${sizeInMB.toFixed(2)} MB`);

  if (!isFlowJSONWithinSizeLimit(flowJSON)) {
    console.error('Flow JSON exceeds 10MB limit!');
    return {
      success: false,
      size: sizeInMB,
      message: 'Flow is too large. Consider reducing the number of screens or components.',
    };
  }

  return {
    success: true,
    size: sizeInMB,
    flowJSON,
  };
}

// ============================================================================
// Example 6: Generate from Full Builder State
// ============================================================================

/**
 * Generate Flow JSON from complete FlowBuilderState
 */
export function example6_FromBuilderState(state: FlowBuilderState): FlowJSON {
  const flowJSON = generateFlowJSON(state.screens, state.edges, {
    version: state.flowVersion,
    dataApiVersion: state.dataApiVersion,
    includeRoutingModel: true,
  });

  return flowJSON;
}

// ============================================================================
// Example 7: Convert Single Screen
// ============================================================================

/**
 * Convert a single screen for preview or testing
 */
export function example7_ConvertSingleScreen(screen: BuilderScreen) {
  const flowScreen = builderScreenToFlowScreen(screen, {
    cleanOutput: true,
  });

  console.log('Converted screen:', JSON.stringify(flowScreen, null, 2));

  return flowScreen;
}

// ============================================================================
// Example 8: Generate Routing Model Only
// ============================================================================

/**
 * Generate just the routing model for visualization
 */
export function example8_GenerateRoutingOnly(
  screens: BuilderScreen[],
  edges: any[]
) {
  const routingModel = generateRoutingModel(screens, edges);

  console.log('Routing model:', routingModel);

  // Example output:
  // {
  //   "WELCOME": ["QUESTIONS", "INFO"],
  //   "QUESTIONS": ["SUCCESS"],
  //   "INFO": ["SUCCESS"],
  //   "SUCCESS": []
  // }

  return routingModel;
}

// ============================================================================
// Example 9: Export Minified for API
// ============================================================================

/**
 * Export minified Flow JSON for API submission
 */
export function example9_ExportMinifiedForAPI(screens: BuilderScreen[]) {
  const flowJSON = generateFlowJSON(screens, [], {
    cleanOutput: true,
  });

  // Validate first
  const errors = validateGeneratedJSON(flowJSON);
  if (errors.length > 0) {
    throw new Error(`Cannot export invalid Flow: ${errors.join(', ')}`);
  }

  // Export minified
  const minified = exportFlowJSONMinified(flowJSON);

  // Can be sent directly to WhatsApp API
  return minified;
}

// ============================================================================
// Example 10: Generate with Data Exchange
// ============================================================================

/**
 * Generate Flow JSON with data exchange endpoint
 */
export function example10_WithDataExchange() {
  const screens: BuilderScreen[] = [
    {
      id: 'INIT',
      title: 'Loading...',
      terminal: false,
      data: {
        user_name: {
          type: 'string',
          __example__: 'John Doe',
        },
        products: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              price: { type: 'number' },
            },
          },
          __example__: [
            { id: '1', name: 'Product A', price: 99.99 },
          ],
        },
      },
      components: [
        {
          id: 'text-1',
          type: 'TextHeading',
          config: {
            type: 'TextHeading',
            text: 'Welcome, ${data.user_name}!',
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'footer-1',
          type: 'Footer',
          config: {
            type: 'Footer',
            label: 'Continue',
            'on-click-action': {
              name: 'data_exchange',
              payload: {
                action: 'LOAD_PRODUCTS',
              },
            },
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
      ],
      validation: { isValid: true, errors: [], warnings: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const flowJSON = generateFlowJSON(screens, [], {
    version: '7.2',
    dataApiVersion: '3.0', // Required for data_exchange
  });

  return flowJSON;
}

// ============================================================================
// Example 11: Error Handling
// ============================================================================

/**
 * Proper error handling when generating Flow JSON
 */
export function example11_WithErrorHandling(screens: BuilderScreen[]) {
  try {
    // Generate
    const flowJSON = generateFlowJSON(screens);

    // Validate
    const errors = validateGeneratedJSON(flowJSON);

    if (errors.length > 0) {
      return {
        success: false,
        errors,
        flowJSON: null,
      };
    }

    // Check size
    if (!isFlowJSONWithinSizeLimit(flowJSON)) {
      return {
        success: false,
        errors: ['Flow JSON exceeds 10MB size limit'],
        flowJSON: null,
      };
    }

    return {
      success: true,
      errors: [],
      flowJSON,
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Generation failed: ${(error as Error).message}`],
      flowJSON: null,
    };
  }
}

// ============================================================================
// Example 12: Incremental Generation
// ============================================================================

/**
 * Generate Flow JSON for a subset of screens (useful for testing)
 */
export function example12_IncrementalGeneration(
  allScreens: BuilderScreen[],
  screenIds: string[]
) {
  // Filter screens
  const selectedScreens = allScreens.filter(screen =>
    screenIds.includes(screen.id)
  );

  if (selectedScreens.length === 0) {
    throw new Error('No screens selected for generation');
  }

  // Generate for subset
  const flowJSON = generateFlowJSON(selectedScreens);

  console.log(`Generated Flow JSON for ${selectedScreens.length} screen(s)`);

  return flowJSON;
}

// ============================================================================
// Usage in React Component
// ============================================================================

/**
 * Example: Using Flow JSON Generator in a React component
 */
export function ExampleReactComponent() {
  // This is pseudocode showing typical usage

  const handleExportFlow = () => {
    // Get screens from state/context
    const screens: BuilderScreen[] = []; // From your state

    try {
      // Generate
      const flowJSON = generateFlowJSON(screens, [], {
        version: '7.2',
        dataApiVersion: '3.0',
        includeRoutingModel: true,
      });

      // Validate
      const errors = validateGeneratedJSON(flowJSON);
      if (errors.length > 0) {
        alert(`Validation errors:\n${errors.join('\n')}`);
        return;
      }

      // Check size
      const size = calculateFlowJSONSize(flowJSON);
      const sizeInMB = size / (1024 * 1024);

      if (sizeInMB > 10) {
        alert(`Flow is too large: ${sizeInMB.toFixed(2)} MB (max 10 MB)`);
        return;
      }

      // Export
      const jsonString = exportFlowJSON(flowJSON, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'flow.json';
      link.click();

      URL.revokeObjectURL(url);

      alert('Flow exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${(error as Error).message}`);
    }
  };

  return {
    handleExportFlow,
  };
}

// ============================================================================
// Example 13: Generate with Conditional Components
// ============================================================================

/**
 * Generate Flow JSON with conditional rendering (If/Switch components)
 */
export function example13_WithConditionals() {
  const screens: BuilderScreen[] = [
    {
      id: 'CONDITIONAL_SCREEN',
      title: 'Conditional Example',
      terminal: false,
      data: {
        user_type: {
          type: 'string',
          __example__: 'premium',
        },
        age: {
          type: 'number',
          __example__: 25,
        },
      },
      components: [
        {
          id: 'heading-1',
          type: 'TextHeading',
          config: {
            type: 'TextHeading',
            text: 'Welcome',
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'if-1',
          type: 'If',
          config: {
            type: 'If',
            condition: '${data.age} >= 18',
            then: [
              {
                type: 'TextBody',
                text: 'Adult content',
              },
            ],
            else: [
              {
                type: 'TextBody',
                text: 'Minor content',
              },
            ],
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'footer-1',
          type: 'Footer',
          config: {
            type: 'Footer',
            label: 'Continue',
            'on-click-action': {
              name: 'complete',
            },
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
      ],
      validation: { isValid: true, errors: [], warnings: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const flowJSON = generateFlowJSON(screens);

  return flowJSON;
}

// ============================================================================
// Export Examples
// ============================================================================

export const examples = {
  basic: example1_BasicGeneration,
  customOptions: example2_CustomOptions,
  validate: example3_GenerateAndValidate,
  download: example4_ExportForDownload,
  checkSize: example5_CheckSizeLimit,
  fromState: example6_FromBuilderState,
  singleScreen: example7_ConvertSingleScreen,
  routingOnly: example8_GenerateRoutingOnly,
  minified: example9_ExportMinifiedForAPI,
  dataExchange: example10_WithDataExchange,
  errorHandling: example11_WithErrorHandling,
  incremental: example12_IncrementalGeneration,
  conditionals: example13_WithConditionals,
};
