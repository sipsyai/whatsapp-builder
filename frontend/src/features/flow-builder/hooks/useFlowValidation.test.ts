/**
 * Tests for useFlowValidation hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useFlowValidation } from './useFlowValidation';
import { BuilderScreen, BuilderComponent } from '../types';

describe('useFlowValidation', () => {
  // Helper function to create a mock screen
  const createMockScreen = (
    id: string,
    components: Partial<BuilderComponent>[] = []
  ): BuilderScreen => ({
    id,
    title: `Screen ${id}`,
    data: {},
    components: components.map((comp, index) => ({
      id: comp.id || `comp-${index}`,
      type: comp.type || 'TextBody',
      config: comp.config || {},
      ...comp,
    })) as BuilderComponent[],
  });

  describe('Initial validation', () => {
    it('should validate screens on mount', async () => {
      const screens = [createMockScreen('screen1')];

      const { result } = renderHook(() => useFlowValidation(screens));

      await waitFor(() => {
        expect(result.current.isValidating).toBe(false);
      });
    });

    it('should return empty errors for valid screens', async () => {
      const screens = [
        createMockScreen('screen1', [
          {
            id: 'comp1',
            type: 'TextBody',
            config: { text: 'Hello World' },
          },
          {
            id: 'comp2',
            type: 'Footer',
            config: { label: 'Continue', onClickAction: { name: 'complete', payload: {} } },
          },
        ]),
      ];

      const { result } = renderHook(() => useFlowValidation(screens));

      await waitFor(() => {
        expect(result.current.isValidating).toBe(false);
      });

      expect(result.current.errors).toHaveLength(0);
      expect(result.current.hasErrors).toBe(false);
      expect(result.current.errorCount).toBe(0);
    });
  });

  describe('Character limit validation', () => {
    it('should detect text exceeding character limit', async () => {
      const longText = 'a'.repeat(81); // TextHeading limit is 80
      const screens = [
        createMockScreen('screen1', [
          {
            id: 'comp1',
            type: 'TextHeading',
            config: { text: longText },
          },
        ]),
      ];

      const { result } = renderHook(() => useFlowValidation(screens));

      await waitFor(() => {
        expect(result.current.errors.length).toBeGreaterThan(0);
      });

      expect(result.current.hasErrors).toBe(true);
      expect(result.current.errors[0].message).toContain('exceeds character limit');
    });

    it('should validate TextInput label length', async () => {
      const longLabel = 'a'.repeat(21); // TextInput label limit is 20
      const screens = [
        createMockScreen('screen1', [
          {
            id: 'comp1',
            type: 'TextInput',
            config: { label: longLabel, name: 'input1' },
          },
        ]),
      ];

      const { result } = renderHook(() => useFlowValidation(screens));

      await waitFor(() => {
        expect(result.current.errors.length).toBeGreaterThan(0);
      });

      const labelError = result.current.errors.find(e => e.message.includes('label'));
      expect(labelError).toBeDefined();
    });
  });

  describe('Required field validation', () => {
    it('should detect missing required field', async () => {
      const screens = [
        createMockScreen('screen1', [
          {
            id: 'comp1',
            type: 'TextInput',
            config: { label: 'Name' }, // missing required 'name' field
          },
        ]),
      ];

      const { result } = renderHook(() => useFlowValidation(screens));

      await waitFor(() => {
        expect(result.current.errors.length).toBeGreaterThan(0);
      });

      const requiredError = result.current.errors.find(e => e.message.includes('required'));
      expect(requiredError).toBeDefined();
    });

    it('should validate Footer label is required', async () => {
      const screens = [
        createMockScreen('screen1', [
          {
            id: 'comp1',
            type: 'Footer',
            config: { onClickAction: { name: 'complete', payload: {} } }, // missing label
          },
        ]),
      ];

      const { result } = renderHook(() => useFlowValidation(screens));

      await waitFor(() => {
        expect(result.current.errors.length).toBeGreaterThan(0);
      });

      expect(result.current.errors[0].message).toContain('required');
    });
  });

  describe('Data source validation', () => {
    it('should detect too many options in CheckboxGroup', async () => {
      const manyOptions = Array.from({ length: 21 }, (_, i) => ({
        id: `opt-${i}`,
        title: `Option ${i}`,
      }));

      const screens = [
        createMockScreen('screen1', [
          {
            id: 'comp1',
            type: 'CheckboxGroup',
            config: {
              label: 'Select',
              name: 'checkbox1',
              dataSource: manyOptions,
            },
          },
        ]),
      ];

      const { result } = renderHook(() => useFlowValidation(screens));

      await waitFor(() => {
        expect(result.current.errors.length).toBeGreaterThan(0);
      });

      const dataSourceError = result.current.errors.find(e =>
        e.message.includes('maximum')
      );
      expect(dataSourceError).toBeDefined();
    });

    it('should detect too few options in ChipsSelector', async () => {
      const screens = [
        createMockScreen('screen1', [
          {
            id: 'comp1',
            type: 'ChipsSelector',
            config: {
              label: 'Select',
              name: 'chips1',
              dataSource: [{ id: 'opt1', title: 'Option 1' }], // needs at least 2
            },
          },
        ]),
      ];

      const { result } = renderHook(() => useFlowValidation(screens));

      await waitFor(() => {
        expect(result.current.errors.length).toBeGreaterThan(0);
      });

      const dataSourceError = result.current.errors.find(e =>
        e.message.includes('at least')
      );
      expect(dataSourceError).toBeDefined();
    });
  });

  describe('Screen-level validation', () => {
    it('should detect multiple Footer components', async () => {
      const screens = [
        createMockScreen('screen1', [
          {
            id: 'comp1',
            type: 'Footer',
            config: { label: 'Continue', onClickAction: { name: 'complete', payload: {} } },
          },
          {
            id: 'comp2',
            type: 'Footer',
            config: { label: 'Cancel', onClickAction: { name: 'complete', payload: {} } },
          },
        ]),
      ];

      const { result } = renderHook(() => useFlowValidation(screens));

      await waitFor(() => {
        expect(result.current.errors.length).toBeGreaterThan(0);
      });

      const footerError = result.current.errors.find(e =>
        e.message.includes('only have 1 Footer')
      );
      expect(footerError).toBeDefined();
    });

    it('should detect missing Footer on terminal screen', async () => {
      const screens = [
        createMockScreen('screen1', [
          {
            id: 'comp1',
            type: 'TextBody',
            config: { text: 'This is a terminal screen without footer' },
          },
        ]),
      ];

      const { result } = renderHook(() => useFlowValidation(screens));

      await waitFor(() => {
        expect(result.current.errors.length).toBeGreaterThan(0);
      });

      const terminalError = result.current.errors.find(e =>
        e.message.includes('Terminal screen must have a Footer')
      );
      expect(terminalError).toBeDefined();
    });
  });

  describe('Validation by screen', () => {
    it('should validate specific screen', async () => {
      const screens = [
        createMockScreen('screen1', [
          {
            id: 'comp1',
            type: 'TextHeading',
            config: { text: 'Valid text' },
          },
        ]),
        createMockScreen('screen2', [
          {
            id: 'comp2',
            type: 'TextHeading',
            config: { text: 'a'.repeat(81) }, // invalid
          },
        ]),
      ];

      const { result } = renderHook(() => useFlowValidation(screens));

      await waitFor(() => {
        expect(result.current.isValidating).toBe(false);
      });

      result.current.validateScreen('screen2');

      await waitFor(() => {
        const screen2Errors = result.current.getErrorsForScreen('screen2');
        expect(screen2Errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Validation by component', () => {
    it('should validate specific component', async () => {
      const screens = [
        createMockScreen('screen1', [
          {
            id: 'comp1',
            type: 'TextInput',
            config: { label: 'a'.repeat(21), name: 'input1' }, // invalid label
          },
        ]),
      ];

      const { result } = renderHook(() => useFlowValidation(screens));

      await waitFor(() => {
        expect(result.current.isValidating).toBe(false);
      });

      result.current.validateComponent('screen1', 'comp1');

      await waitFor(() => {
        const componentErrors = result.current.getErrorsForComponent('comp1');
        expect(componentErrors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error filtering', () => {
    it('should get errors for screen', async () => {
      const screens = [
        createMockScreen('screen1', [
          {
            id: 'comp1',
            type: 'TextHeading',
            config: { text: 'a'.repeat(81) },
          },
        ]),
        createMockScreen('screen2', [
          {
            id: 'comp2',
            type: 'TextBody',
            config: { text: 'Valid' },
          },
        ]),
      ];

      const { result } = renderHook(() => useFlowValidation(screens));

      await waitFor(() => {
        expect(result.current.isValidating).toBe(false);
      });

      const screen1Errors = result.current.getErrorsForScreen('screen1');
      const screen2Errors = result.current.getErrorsForScreen('screen2');

      expect(screen1Errors.length).toBeGreaterThan(0);
      expect(screen2Errors.length).toBe(0);
    });

    it('should get errors for component', async () => {
      const screens = [
        createMockScreen('screen1', [
          {
            id: 'comp1',
            type: 'TextHeading',
            config: { text: 'a'.repeat(81) },
          },
          {
            id: 'comp2',
            type: 'TextBody',
            config: { text: 'Valid' },
          },
        ]),
      ];

      const { result } = renderHook(() => useFlowValidation(screens));

      await waitFor(() => {
        expect(result.current.isValidating).toBe(false);
      });

      const comp1Errors = result.current.getErrorsForComponent('comp1');
      const comp2Errors = result.current.getErrorsForComponent('comp2');

      expect(comp1Errors.length).toBeGreaterThan(0);
      expect(comp2Errors.length).toBe(0);
    });
  });

  describe('Clear errors', () => {
    it('should clear all errors', async () => {
      const screens = [
        createMockScreen('screen1', [
          {
            id: 'comp1',
            type: 'TextHeading',
            config: { text: 'a'.repeat(81) },
          },
        ]),
      ];

      const { result } = renderHook(() => useFlowValidation(screens));

      await waitFor(() => {
        expect(result.current.errors.length).toBeGreaterThan(0);
      });

      result.current.clearErrors();

      await waitFor(() => {
        expect(result.current.errors).toHaveLength(0);
      });
    });
  });

  describe('Debounced validation', () => {
    it('should re-validate after screen changes', async () => {
      const { result, rerender } = renderHook(
        ({ screens }) => useFlowValidation(screens),
        {
          initialProps: {
            screens: [createMockScreen('screen1')],
          },
        }
      );

      await waitFor(() => {
        expect(result.current.isValidating).toBe(false);
      });

      // Update screens with invalid data
      rerender({
        screens: [
          createMockScreen('screen1', [
            {
              id: 'comp1',
              type: 'TextHeading',
              config: { text: 'a'.repeat(81) },
            },
          ]),
        ],
      });

      await waitFor(
        () => {
          expect(result.current.errors.length).toBeGreaterThan(0);
        },
        { timeout: 500 }
      );
    });
  });

  describe('Error and warning counts', () => {
    it('should count errors correctly', async () => {
      const screens = [
        createMockScreen('screen1', [
          {
            id: 'comp1',
            type: 'TextHeading',
            config: { text: 'a'.repeat(81) },
          },
          {
            id: 'comp2',
            type: 'TextInput',
            config: { label: 'a'.repeat(21), name: 'input1' },
          },
        ]),
      ];

      const { result } = renderHook(() => useFlowValidation(screens));

      await waitFor(() => {
        expect(result.current.errorCount).toBeGreaterThan(0);
      });

      expect(result.current.hasErrors).toBe(true);
    });
  });
});
