/**
 * Flow JSON Generator Tests
 *
 * Comprehensive test suite for the Flow JSON Generator utility.
 */

import {
  generateFlowJSON,
  builderScreenToFlowScreen,
  builderComponentToFlowComponent,
  generateRoutingModel,
  cleanJSON,
  validateGeneratedJSON,
  calculateFlowJSONSize,
  isFlowJSONWithinSizeLimit,
  exportFlowJSON,
  exportFlowJSONMinified,
} from './flowJsonGenerator';

import type {
  BuilderScreen,
  BuilderComponent,
  NavigationEdge,
} from '../types/builder.types';

import type {
  FlowJSON,
  FlowScreen,
  Component,
} from '../types/flow-json.types';

import { Edge } from '@xyflow/react';

// ============================================================================
// Test Data Fixtures
// ============================================================================

const mockTextComponent: BuilderComponent = {
  id: 'text-1',
  type: 'TextHeading',
  config: {
    type: 'TextHeading',
    text: 'Welcome',
    visible: true,
  },
  validation: {
    isValid: true,
    errors: [],
    warnings: [],
  },
};

const mockInputComponent: BuilderComponent = {
  id: 'input-1',
  type: 'TextInput',
  config: {
    type: 'TextInput',
    name: 'full_name',
    label: 'Full Name',
    required: true,
    'input-type': 'text',
  },
  validation: {
    isValid: true,
    errors: [],
    warnings: [],
  },
};

const mockFooterComponent: BuilderComponent = {
  id: 'footer-1',
  type: 'Footer',
  config: {
    type: 'Footer',
    label: 'Continue',
    'on-click-action': {
      name: 'navigate',
      next: {
        type: 'screen',
        name: 'SCREEN_2',
      },
    },
  },
  validation: {
    isValid: true,
    errors: [],
    warnings: [],
  },
};

const mockScreen1: BuilderScreen = {
  id: 'SCREEN_1',
  title: 'Welcome Screen',
  terminal: false,
  components: [mockTextComponent, mockInputComponent, mockFooterComponent],
  validation: {
    isValid: true,
    errors: [],
    warnings: [],
  },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const mockScreen2: BuilderScreen = {
  id: 'SCREEN_2',
  title: 'Confirmation Screen',
  terminal: true,
  components: [
    {
      id: 'text-2',
      type: 'TextBody',
      config: {
        type: 'TextBody',
        text: 'Thank you for submitting!',
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
    },
    {
      id: 'footer-2',
      type: 'Footer',
      config: {
        type: 'Footer',
        label: 'Done',
        'on-click-action': {
          name: 'complete',
        },
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
    },
  ],
  validation: {
    isValid: true,
    errors: [],
    warnings: [],
  },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const mockEdges: Edge[] = [
  {
    id: 'edge-1',
    source: 'SCREEN_1',
    target: 'SCREEN_2',
    type: 'default',
  },
];

// ============================================================================
// Component Conversion Tests
// ============================================================================

describe('builderComponentToFlowComponent', () => {
  test('converts text component correctly', () => {
    const result = builderComponentToFlowComponent(mockTextComponent);

    expect(result).toEqual({
      type: 'TextHeading',
      text: 'Welcome',
      visible: true,
    });
  });

  test('converts input component correctly', () => {
    const result = builderComponentToFlowComponent(mockInputComponent);

    expect(result).toEqual({
      type: 'TextInput',
      name: 'full_name',
      label: 'Full Name',
      required: true,
      'input-type': 'text',
    });
  });

  test('converts footer with action correctly', () => {
    const result = builderComponentToFlowComponent(mockFooterComponent);

    expect(result).toEqual({
      type: 'Footer',
      label: 'Continue',
      'on-click-action': {
        name: 'navigate',
        next: {
          type: 'screen',
          name: 'SCREEN_2',
        },
      },
    });
  });

  test('removes undefined values when cleanOutput is true', () => {
    const componentWithUndefined: BuilderComponent = {
      id: 'comp-1',
      type: 'TextBody',
      config: {
        type: 'TextBody',
        text: 'Hello',
        visible: undefined,
        'font-weight': undefined,
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
    };

    const result = builderComponentToFlowComponent(componentWithUndefined);

    expect(result).toEqual({
      type: 'TextBody',
      text: 'Hello',
    });
    expect(result).not.toHaveProperty('visible');
    expect(result).not.toHaveProperty('font-weight');
  });
});

// ============================================================================
// Screen Conversion Tests
// ============================================================================

describe('builderScreenToFlowScreen', () => {
  test('converts basic screen correctly', () => {
    const result = builderScreenToFlowScreen(mockScreen1);

    expect(result.id).toBe('SCREEN_1');
    expect(result.title).toBe('Welcome Screen');
    expect(result.terminal).toBe(false);
    expect(result.layout).toBeDefined();
    expect(result.layout.type).toBe('SingleColumnLayout');
    expect(result.layout.children).toHaveLength(3);
  });

  test('converts terminal screen correctly', () => {
    const result = builderScreenToFlowScreen(mockScreen2);

    expect(result.id).toBe('SCREEN_2');
    expect(result.terminal).toBe(true);
    expect(result.layout.children).toHaveLength(2);
  });

  test('includes screen data if present', () => {
    const screenWithData: BuilderScreen = {
      ...mockScreen1,
      data: {
        user_name: {
          type: 'string',
          __example__: 'John Doe',
        },
        age: {
          type: 'number',
          __example__: 25,
        },
      },
    };

    const result = builderScreenToFlowScreen(screenWithData);

    expect(result.data).toBeDefined();
    expect(result.data?.user_name).toEqual({
      type: 'string',
      __example__: 'John Doe',
    });
  });

  test('includes refresh_on_back if set', () => {
    const screenWithRefresh: BuilderScreen = {
      ...mockScreen1,
      refresh_on_back: true,
    };

    const result = builderScreenToFlowScreen(screenWithRefresh);

    expect(result.refresh_on_back).toBe(true);
  });

  test('filters out invisible components', () => {
    const screenWithInvisible: BuilderScreen = {
      ...mockScreen1,
      components: [
        mockTextComponent,
        {
          ...mockInputComponent,
          config: {
            ...mockInputComponent.config,
            visible: false,
          },
        },
        mockFooterComponent,
      ],
    };

    const result = builderScreenToFlowScreen(screenWithInvisible);

    expect(result.layout.children).toHaveLength(2); // Only visible components
  });
});

// ============================================================================
// Flow JSON Generation Tests
// ============================================================================

describe('generateFlowJSON', () => {
  test('generates basic Flow JSON correctly', () => {
    const result = generateFlowJSON([mockScreen1, mockScreen2], mockEdges);

    expect(result.version).toBe('7.2');
    expect(result.data_api_version).toBe('3.0');
    expect(result.screens).toHaveLength(2);
    expect(result.screens[0].id).toBe('SCREEN_1');
    expect(result.screens[1].id).toBe('SCREEN_2');
  });

  test('uses custom version if provided', () => {
    const result = generateFlowJSON([mockScreen1], [], {
      version: '6.0',
    });

    expect(result.version).toBe('6.0');
  });

  test('uses custom dataApiVersion if provided', () => {
    const result = generateFlowJSON([mockScreen1], [], {
      dataApiVersion: '4.0',
    });

    expect(result.data_api_version).toBe('4.0');
  });

  test('includes routing model if requested', () => {
    const result = generateFlowJSON([mockScreen1, mockScreen2], mockEdges, {
      includeRoutingModel: true,
    });

    expect(result.routing_model).toBeDefined();
    expect(result.routing_model).toHaveProperty('SCREEN_1');
    expect(result.routing_model?.SCREEN_1).toContain('SCREEN_2');
  });

  test('generates valid multi-screen flow', () => {
    const screens = [mockScreen1, mockScreen2];
    const edges: Edge[] = [
      {
        id: 'edge-1',
        source: 'SCREEN_1',
        target: 'SCREEN_2',
        type: 'default',
      },
    ];

    const result = generateFlowJSON(screens, edges);

    // Validate structure
    expect(result.version).toBeDefined();
    expect(result.screens).toHaveLength(2);

    // Check screens are properly formatted
    result.screens.forEach(screen => {
      expect(screen.id).toBeDefined();
      expect(screen.layout).toBeDefined();
      expect(screen.layout.type).toBe('SingleColumnLayout');
      expect(screen.layout.children).toBeDefined();
    });
  });
});

// ============================================================================
// Routing Model Tests
// ============================================================================

describe('generateRoutingModel', () => {
  test('generates routing model from edges', () => {
    const result = generateRoutingModel([mockScreen1, mockScreen2], mockEdges);

    expect(result).toEqual({
      SCREEN_1: ['SCREEN_2'],
      SCREEN_2: [],
    });
  });

  test('extracts routing from component actions', () => {
    const result = generateRoutingModel([mockScreen1, mockScreen2], []);

    // Should find SCREEN_2 from the navigate action in footer
    expect(result.SCREEN_1).toContain('SCREEN_2');
  });

  test('handles multiple navigation targets', () => {
    const screenWithMultipleNav: BuilderScreen = {
      ...mockScreen1,
      components: [
        {
          id: 'footer-1',
          type: 'Footer',
          config: {
            type: 'Footer',
            label: 'Next',
            'on-click-action': {
              name: 'navigate',
              next: { type: 'screen', name: 'SCREEN_A' },
            },
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'footer-2',
          type: 'Footer',
          config: {
            type: 'Footer',
            label: 'Skip',
            'on-click-action': {
              name: 'navigate',
              next: { type: 'screen', name: 'SCREEN_B' },
            },
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
      ],
    };

    const result = generateRoutingModel([screenWithMultipleNav], []);

    expect(result[screenWithMultipleNav.id]).toContain('SCREEN_A');
    expect(result[screenWithMultipleNav.id]).toContain('SCREEN_B');
  });

  test('avoids duplicate routes', () => {
    const edges: Edge[] = [
      { id: 'e1', source: 'SCREEN_1', target: 'SCREEN_2', type: 'default' },
      { id: 'e2', source: 'SCREEN_1', target: 'SCREEN_2', type: 'default' },
    ];

    const result = generateRoutingModel([mockScreen1, mockScreen2], edges);

    expect(result.SCREEN_1).toEqual(['SCREEN_2']); // No duplicates
  });
});

// ============================================================================
// JSON Cleaning Tests
// ============================================================================

describe('cleanJSON', () => {
  test('removes undefined values', () => {
    const obj = {
      a: 'value',
      b: undefined,
      c: 'another',
    };

    const result = cleanJSON(obj);

    expect(result).toEqual({
      a: 'value',
      c: 'another',
    });
    expect(result).not.toHaveProperty('b');
  });

  test('removes null values', () => {
    const obj = {
      a: 'value',
      b: null,
      c: 'another',
    };

    const result = cleanJSON(obj);

    expect(result).toEqual({
      a: 'value',
      c: 'another',
    });
  });

  test('removes empty arrays', () => {
    const obj = {
      a: 'value',
      b: [],
      c: [1, 2, 3],
    };

    const result = cleanJSON(obj);

    expect(result).toEqual({
      a: 'value',
      c: [1, 2, 3],
    });
  });

  test('removes empty objects', () => {
    const obj = {
      a: 'value',
      b: {},
      c: { nested: 'value' },
    };

    const result = cleanJSON(obj);

    expect(result).toEqual({
      a: 'value',
      c: { nested: 'value' },
    });
  });

  test('handles nested cleaning', () => {
    const obj = {
      a: 'value',
      b: {
        c: 'nested',
        d: undefined,
        e: {
          f: null,
          g: 'deep',
        },
      },
    };

    const result = cleanJSON(obj);

    expect(result).toEqual({
      a: 'value',
      b: {
        c: 'nested',
        e: {
          g: 'deep',
        },
      },
    });
  });

  test('handles arrays with nested objects', () => {
    const obj = {
      items: [
        { id: 1, value: 'a', empty: undefined },
        { id: 2, value: 'b', empty: null },
      ],
    };

    const result = cleanJSON(obj);

    expect(result).toEqual({
      items: [
        { id: 1, value: 'a' },
        { id: 2, value: 'b' },
      ],
    });
  });
});

// ============================================================================
// Validation Tests
// ============================================================================

describe('validateGeneratedJSON', () => {
  test('validates correct Flow JSON', () => {
    const flowJSON = generateFlowJSON([mockScreen1, mockScreen2], mockEdges);
    const errors = validateGeneratedJSON(flowJSON);

    expect(errors).toHaveLength(0);
  });

  test('detects missing version', () => {
    const flowJSON: FlowJSON = {
      version: '' as any,
      screens: [builderScreenToFlowScreen(mockScreen1)],
    };

    const errors = validateGeneratedJSON(flowJSON);

    expect(errors).toContain('Flow JSON must have a version');
  });

  test('detects missing screens', () => {
    const flowJSON: FlowJSON = {
      version: '7.2',
      screens: [],
    };

    const errors = validateGeneratedJSON(flowJSON);

    expect(errors).toContain('Flow JSON must have at least one screen');
  });

  test('detects screen without id', () => {
    const flowJSON: FlowJSON = {
      version: '7.2',
      screens: [
        {
          id: '',
          layout: {
            type: 'SingleColumnLayout',
            children: [],
          },
        } as any,
      ],
    };

    const errors = validateGeneratedJSON(flowJSON);

    expect(errors.some(e => e.includes('missing an id'))).toBe(true);
  });

  test('detects terminal screen without footer', () => {
    const screenWithoutFooter: BuilderScreen = {
      ...mockScreen2,
      components: [
        {
          id: 'text-1',
          type: 'TextBody',
          config: {
            type: 'TextBody',
            text: 'Text only',
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
      ],
    };

    const flowJSON = generateFlowJSON([screenWithoutFooter], []);
    const errors = validateGeneratedJSON(flowJSON);

    expect(errors.some(e => e.includes('should have a Footer'))).toBe(true);
  });

  test('warns if no terminal screen', () => {
    const nonTerminalScreen: BuilderScreen = {
      ...mockScreen1,
      terminal: false,
    };

    const flowJSON = generateFlowJSON([nonTerminalScreen], []);
    const errors = validateGeneratedJSON(flowJSON);

    expect(errors.some(e => e.includes('at least one terminal screen'))).toBe(true);
  });

  test('validates routing model references', () => {
    const flowJSON = generateFlowJSON([mockScreen1], [], {
      includeRoutingModel: true,
    });

    // Add invalid routing reference
    flowJSON.routing_model = {
      SCREEN_1: ['INVALID_SCREEN'],
    };

    const errors = validateGeneratedJSON(flowJSON);

    expect(errors.some(e => e.includes('unknown target screen'))).toBe(true);
  });
});

// ============================================================================
// Export Tests
// ============================================================================

describe('exportFlowJSON', () => {
  test('exports formatted JSON string', () => {
    const flowJSON = generateFlowJSON([mockScreen1], []);
    const result = exportFlowJSON(flowJSON);

    expect(typeof result).toBe('string');
    expect(result).toContain('\n'); // Has line breaks
    expect(result).toContain('  '); // Has indentation
  });

  test('uses custom indentation', () => {
    const flowJSON = generateFlowJSON([mockScreen1], []);
    const result = exportFlowJSON(flowJSON, 4);

    expect(result).toContain('    '); // 4-space indentation
  });
});

describe('exportFlowJSONMinified', () => {
  test('exports minified JSON string', () => {
    const flowJSON = generateFlowJSON([mockScreen1], []);
    const result = exportFlowJSONMinified(flowJSON);

    expect(typeof result).toBe('string');
    expect(result).not.toContain('\n'); // No line breaks
    expect(result).not.toContain('  '); // No indentation
  });
});

// ============================================================================
// Size Tests
// ============================================================================

describe('calculateFlowJSONSize', () => {
  test('calculates size correctly', () => {
    const flowJSON = generateFlowJSON([mockScreen1], []);
    const size = calculateFlowJSONSize(flowJSON);

    expect(size).toBeGreaterThan(0);
    expect(typeof size).toBe('number');
  });
});

describe('isFlowJSONWithinSizeLimit', () => {
  test('returns true for small flows', () => {
    const flowJSON = generateFlowJSON([mockScreen1, mockScreen2], mockEdges);
    const result = isFlowJSONWithinSizeLimit(flowJSON);

    expect(result).toBe(true);
  });

  test('returns false for oversized flows', () => {
    // Create a mock large flow
    const largeFlow: FlowJSON = {
      version: '7.2',
      screens: [],
    };

    // Mock calculateFlowJSONSize to return a large value
    jest.spyOn(global.Blob.prototype, 'size', 'get').mockReturnValue(11 * 1024 * 1024);

    const result = isFlowJSONWithinSizeLimit(largeFlow);

    expect(result).toBe(false);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration: Complete Flow Generation', () => {
  test('generates a complete multi-screen flow with all features', () => {
    const screen1: BuilderScreen = {
      id: 'WELCOME',
      title: 'Welcome',
      terminal: false,
      components: [
        {
          id: 'heading',
          type: 'TextHeading',
          config: {
            type: 'TextHeading',
            text: 'Welcome to Our Service',
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'name-input',
          type: 'TextInput',
          config: {
            type: 'TextInput',
            name: 'customer_name',
            label: 'Your Name',
            required: true,
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'footer',
          type: 'Footer',
          config: {
            type: 'Footer',
            label: 'Continue',
            'on-click-action': {
              name: 'navigate',
              next: { type: 'screen', name: 'CONFIRMATION' },
            },
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
      ],
      validation: { isValid: true, errors: [], warnings: [] },
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    };

    const screen2: BuilderScreen = {
      id: 'CONFIRMATION',
      title: 'Confirmation',
      terminal: true,
      data: {
        user_name: {
          type: 'string',
          __example__: 'John Doe',
        },
      },
      components: [
        {
          id: 'confirmation-text',
          type: 'TextBody',
          config: {
            type: 'TextBody',
            text: 'Thank you, ${screen.WELCOME.form.customer_name}!',
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
        {
          id: 'footer',
          type: 'Footer',
          config: {
            type: 'Footer',
            label: 'Finish',
            'on-click-action': {
              name: 'complete',
            },
          },
          validation: { isValid: true, errors: [], warnings: [] },
        },
      ],
      validation: { isValid: true, errors: [], warnings: [] },
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    };

    const edges: Edge[] = [
      {
        id: 'edge-1',
        source: 'WELCOME',
        target: 'CONFIRMATION',
        type: 'default',
      },
    ];

    const flowJSON = generateFlowJSON([screen1, screen2], edges, {
      version: '7.2',
      dataApiVersion: '3.0',
      includeRoutingModel: true,
    });

    // Validate structure
    expect(flowJSON.version).toBe('7.2');
    expect(flowJSON.data_api_version).toBe('3.0');
    expect(flowJSON.screens).toHaveLength(2);
    expect(flowJSON.routing_model).toBeDefined();

    // Validate screens
    expect(flowJSON.screens[0].id).toBe('WELCOME');
    expect(flowJSON.screens[0].layout.children).toHaveLength(3);
    expect(flowJSON.screens[1].id).toBe('CONFIRMATION');
    expect(flowJSON.screens[1].terminal).toBe(true);
    expect(flowJSON.screens[1].data).toBeDefined();

    // Validate routing
    expect(flowJSON.routing_model?.WELCOME).toContain('CONFIRMATION');

    // Validate it passes validation
    const errors = validateGeneratedJSON(flowJSON);
    expect(errors).toHaveLength(0);

    // Validate it can be exported
    const exported = exportFlowJSON(flowJSON);
    expect(exported).toBeTruthy();
    expect(JSON.parse(exported)).toEqual(flowJSON);
  });
});
