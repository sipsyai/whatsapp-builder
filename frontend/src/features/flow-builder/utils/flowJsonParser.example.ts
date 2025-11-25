/**
 * Flow JSON Parser Usage Examples
 *
 * Demonstrates how to use the Flow JSON Parser to convert
 * WhatsApp Flow JSON into Flow Builder state.
 */

import type { FlowJSON } from '../types/flow-json.types';
import {
  parseFlowJSON,
  isValidFlowJSON,
  getFlowStatistics,
  flowScreenToBuilderScreen,
  flowComponentToBuilderComponent,
} from './flowJsonParser';

// ============================================================================
// Example 1: Simple Flow with Two Screens
// ============================================================================

export const simpleFlowExample: FlowJSON = {
  version: '7.2',
  data_api_version: '3.0',
  screens: [
    {
      id: 'WELCOME',
      title: 'Welcome Screen',
      data: {},
      layout: {
        type: 'SingleColumnLayout',
        children: [
          {
            type: 'TextHeading',
            text: 'Welcome to our service!',
          },
          {
            type: 'TextBody',
            text: 'Please click the button below to continue.',
          },
          {
            type: 'Footer',
            label: 'Continue',
            'on-click-action': {
              name: 'navigate',
              next: {
                type: 'screen',
                name: 'FORM',
              },
            },
          },
        ],
      },
    },
    {
      id: 'FORM',
      title: 'Form Screen',
      data: {
        name: {
          type: 'string',
          __example__: 'John Doe',
        },
      },
      layout: {
        type: 'SingleColumnLayout',
        children: [
          {
            type: 'TextInput',
            label: 'Your Name',
            name: 'name',
            required: true,
          },
          {
            type: 'Footer',
            label: 'Submit',
            'on-click-action': {
              name: 'complete',
            },
          },
        ],
      },
      terminal: true,
    },
  ],
};

// Parse the simple flow
export function parseSimpleFlow() {
  // Validate first
  if (!isValidFlowJSON(simpleFlowExample)) {
    throw new Error('Invalid Flow JSON');
  }

  // Parse
  const result = parseFlowJSON(simpleFlowExample, 'Simple Welcome Flow');

  // Get statistics
  const stats = getFlowStatistics(result);

  console.log('Parsed Flow:', result);
  console.log('Statistics:', stats);

  return { result, stats };
}

// ============================================================================
// Example 2: Complex Flow with Conditional Navigation
// ============================================================================

export const complexFlowExample: FlowJSON = {
  version: '7.2',
  data_api_version: '3.0',
  screens: [
    {
      id: 'HOME',
      title: 'Home',
      data: {},
      layout: {
        type: 'SingleColumnLayout',
        children: [
          {
            type: 'TextHeading',
            text: 'Welcome',
          },
          {
            type: 'NavigationList',
            name: 'menu',
            'list-items': [
              {
                'main-content': {
                  title: 'Products',
                  description: 'Browse our products',
                },
                'on-click-action': {
                  name: 'navigate',
                  next: {
                    type: 'screen',
                    name: 'PRODUCTS',
                  },
                },
              },
              {
                'main-content': {
                  title: 'Support',
                  description: 'Get help',
                },
                'on-click-action': {
                  name: 'navigate',
                  next: {
                    type: 'screen',
                    name: 'SUPPORT',
                  },
                },
              },
            ],
          },
        ],
      },
    },
    {
      id: 'PRODUCTS',
      title: 'Products',
      data: {},
      layout: {
        type: 'SingleColumnLayout',
        children: [
          {
            type: 'TextHeading',
            text: 'Our Products',
          },
          {
            type: 'Footer',
            label: 'Back',
            'on-click-action': {
              name: 'navigate',
              next: {
                type: 'screen',
                name: 'HOME',
              },
            },
          },
        ],
      },
    },
    {
      id: 'SUPPORT',
      title: 'Support',
      data: {},
      layout: {
        type: 'SingleColumnLayout',
        children: [
          {
            type: 'TextHeading',
            text: 'Support',
          },
          {
            type: 'EmbeddedLink',
            text: 'Contact Us',
            'on-click-action': {
              name: 'navigate',
              next: {
                type: 'screen',
                name: 'CONTACT',
              },
            },
          },
          {
            type: 'Footer',
            label: 'Back',
            'on-click-action': {
              name: 'navigate',
              next: {
                type: 'screen',
                name: 'HOME',
              },
            },
          },
        ],
      },
    },
    {
      id: 'CONTACT',
      title: 'Contact',
      data: {
        email: {
          type: 'string',
          __example__: 'user@example.com',
        },
        message: {
          type: 'string',
          __example__: 'Hello!',
        },
      },
      layout: {
        type: 'SingleColumnLayout',
        children: [
          {
            type: 'TextInput',
            label: 'Email',
            name: 'email',
            'input-type': 'email',
            required: true,
          },
          {
            type: 'TextArea',
            label: 'Message',
            name: 'message',
            required: true,
          },
          {
            type: 'Footer',
            label: 'Submit',
            'on-click-action': {
              name: 'complete',
            },
          },
        ],
      },
      terminal: true,
    },
  ],
};

// Parse the complex flow
export function parseComplexFlow() {
  const result = parseFlowJSON(complexFlowExample, 'Customer Support Flow');
  const stats = getFlowStatistics(result);

  console.log('Parsed Complex Flow:', result);
  console.log('Statistics:', stats);
  console.log('Auto-layout positions:');
  result.screens.forEach((screen) => {
    console.log(`  ${screen.id}: (${screen.position?.x}, ${screen.position?.y})`);
  });

  return { result, stats };
}

// ============================================================================
// Example 3: Flow with Conditional Components (If)
// ============================================================================

export const conditionalFlowExample: FlowJSON = {
  version: '7.2',
  data_api_version: '3.0',
  screens: [
    {
      id: 'START',
      title: 'Start',
      data: {
        isLoggedIn: {
          type: 'boolean',
          __example__: false,
        },
      },
      layout: {
        type: 'SingleColumnLayout',
        children: [
          {
            type: 'TextHeading',
            text: 'Welcome',
          },
          {
            type: 'If',
            condition: '${data.isLoggedIn}',
            then: [
              {
                type: 'Footer',
                label: 'Go to Dashboard',
                'on-click-action': {
                  name: 'navigate',
                  next: {
                    type: 'screen',
                    name: 'DASHBOARD',
                  },
                },
              },
            ],
            else: [
              {
                type: 'Footer',
                label: 'Login',
                'on-click-action': {
                  name: 'navigate',
                  next: {
                    type: 'screen',
                    name: 'LOGIN',
                  },
                },
              },
            ],
          },
        ],
      },
    },
    {
      id: 'LOGIN',
      title: 'Login',
      data: {},
      layout: {
        type: 'SingleColumnLayout',
        children: [
          {
            type: 'TextInput',
            label: 'Username',
            name: 'username',
            required: true,
          },
          {
            type: 'Footer',
            label: 'Login',
            'on-click-action': {
              name: 'navigate',
              next: {
                type: 'screen',
                name: 'DASHBOARD',
              },
            },
          },
        ],
      },
    },
    {
      id: 'DASHBOARD',
      title: 'Dashboard',
      data: {},
      terminal: true,
      layout: {
        type: 'SingleColumnLayout',
        children: [
          {
            type: 'TextHeading',
            text: 'Dashboard',
          },
        ],
      },
    },
  ],
};

// Parse conditional flow
export function parseConditionalFlow() {
  const result = parseFlowJSON(conditionalFlowExample, 'Login Flow');
  const stats = getFlowStatistics(result);

  // Note: Conditional navigation is extracted from both 'then' and 'else' branches
  console.log('Conditional Flow Edges:', result.edges.length);
  console.log('Expected: 3 edges (START->DASHBOARD, START->LOGIN, LOGIN->DASHBOARD)');

  return { result, stats };
}

// ============================================================================
// Example 4: Individual Component Parsing
// ============================================================================

export function parseIndividualComponents() {
  const screen = simpleFlowExample.screens[0];

  // Parse screen
  const builderScreen = flowScreenToBuilderScreen(screen, { x: 100, y: 100 });

  console.log('Parsed Screen:', builderScreen);
  console.log('Components count:', builderScreen.components.length);

  // Parse individual components
  const components = screen.layout.children.map((comp, index) =>
    flowComponentToBuilderComponent(comp, screen.id, index)
  );

  console.log('Individual Components:', components);

  return { builderScreen, components };
}

// ============================================================================
// Example 5: Error Handling
// ============================================================================

export function errorHandlingExample() {
  const invalidFlow = {
    version: '7.2',
    // Missing screens array
  };

  // Check if valid
  if (!isValidFlowJSON(invalidFlow)) {
    console.log('Flow JSON is invalid (as expected)');
    return;
  }

  // This won't execute
  parseFlowJSON(invalidFlow as FlowJSON);
}

// ============================================================================
// Run All Examples
// ============================================================================

export function runAllExamples() {
  console.log('=== Example 1: Simple Flow ===');
  parseSimpleFlow();

  console.log('\n=== Example 2: Complex Flow ===');
  parseComplexFlow();

  console.log('\n=== Example 3: Conditional Flow ===');
  parseConditionalFlow();

  console.log('\n=== Example 4: Individual Components ===');
  parseIndividualComponents();

  console.log('\n=== Example 5: Error Handling ===');
  errorHandlingExample();
}
