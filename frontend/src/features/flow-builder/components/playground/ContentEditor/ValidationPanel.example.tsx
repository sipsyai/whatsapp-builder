import { ValidationPanel } from './ValidationPanel';
import type { ValidationError, ValidationWarning } from './ValidationPanel';

/**
 * Example usage of ValidationPanel component
 *
 * This file demonstrates:
 * 1. Panel with errors and warnings
 * 2. Panel with only errors
 * 3. Panel with only warnings
 * 4. Empty panel (success state)
 * 5. Click handler for navigation
 */

// Sample validation errors
const sampleErrors: ValidationError[] = [
  {
    id: 'err-1',
    type: 'error',
    message: 'Required field "label" is missing',
    path: 'screens[0].layout.children[0]',
    line: 15,
  },
  {
    id: 'err-2',
    type: 'error',
    message: 'Invalid data type: expected string, got number',
    path: 'screens[0].layout.children[2].text-heading.text',
    line: 28,
  },
  {
    id: 'err-3',
    type: 'error',
    message: 'Screen ID must be unique',
    path: 'screens[1].id',
  },
];

// Sample validation warnings
const sampleWarnings: ValidationWarning[] = [
  {
    id: 'warn-1',
    type: 'warning',
    message: 'Text length exceeds 80 characters (recommended limit)',
    path: 'screens[0].title',
    line: 8,
  },
  {
    id: 'warn-2',
    type: 'warning',
    message: 'Consider adding a description for better accessibility',
    path: 'screens[0].layout.children[1]',
  },
];

/**
 * Example: Panel with errors and warnings
 */
export function ValidationPanelWithErrorsAndWarnings() {
  const handleErrorClick = (error: ValidationError) => {
    console.log('Navigate to error:', error);
    // In real implementation, this would navigate to the error location
    // For example, scroll to line number or highlight the field
  };

  return (
    <div className="p-4 bg-zinc-950">
      <ValidationPanel
        errors={sampleErrors}
        warnings={sampleWarnings}
        onErrorClick={handleErrorClick}
      />
    </div>
  );
}

/**
 * Example: Panel with only errors
 */
export function ValidationPanelWithErrorsOnly() {
  return (
    <div className="p-4 bg-zinc-950">
      <ValidationPanel
        errors={sampleErrors}
        warnings={[]}
        onErrorClick={(error) => console.log('Error clicked:', error)}
      />
    </div>
  );
}

/**
 * Example: Panel with only warnings
 */
export function ValidationPanelWithWarningsOnly() {
  return (
    <div className="p-4 bg-zinc-950">
      <ValidationPanel
        errors={[]}
        warnings={sampleWarnings}
      />
    </div>
  );
}

/**
 * Example: Panel with no errors or warnings (success state)
 */
export function ValidationPanelSuccess() {
  return (
    <div className="p-4 bg-zinc-950">
      <ValidationPanel
        errors={[]}
        warnings={[]}
      />
    </div>
  );
}

/**
 * Example: Panel with custom className
 */
export function ValidationPanelCustomStyles() {
  return (
    <div className="p-4 bg-zinc-950">
      <ValidationPanel
        errors={sampleErrors.slice(0, 1)}
        warnings={sampleWarnings.slice(0, 1)}
        onErrorClick={(error) => console.log('Error clicked:', error)}
        className="max-w-2xl mx-auto"
      />
    </div>
  );
}

/**
 * Example: Integration with JSON editor
 */
export function ValidationPanelWithJSONEditor() {
  // Simulated JSON validation
  const jsonErrors: ValidationError[] = [
    {
      id: 'json-1',
      type: 'error',
      message: 'Unexpected token } in JSON at position 245',
      line: 12,
    },
    {
      id: 'json-2',
      type: 'error',
      message: 'Missing closing bracket',
      line: 18,
    },
  ];

  const handleErrorClick = (error: ValidationError) => {
    if (error.line !== undefined) {
      console.log(`Navigate to line ${error.line}`);
      // In real implementation, scroll to line in Monaco Editor
      // editor.revealLineInCenter(error.line);
      // editor.setPosition({ lineNumber: error.line, column: 1 });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-950 p-4">
      {/* Monaco Editor would go here */}
      <div className="flex-1 bg-zinc-900 rounded-lg mb-4 flex items-center justify-center">
        <p className="text-zinc-500">JSON Editor (Monaco Editor)</p>
      </div>

      {/* Validation Panel */}
      <ValidationPanel
        errors={jsonErrors}
        warnings={[]}
        onErrorClick={handleErrorClick}
      />
    </div>
  );
}

/**
 * Default export: All examples in a grid
 */
export default function ValidationPanelExamples() {
  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <h1 className="text-2xl font-bold text-white mb-8">
        ValidationPanel Component Examples
      </h1>

      <div className="space-y-8">
        {/* Example 1 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            1. Errors and Warnings
          </h2>
          <ValidationPanelWithErrorsAndWarnings />
        </section>

        {/* Example 2 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            2. Errors Only
          </h2>
          <ValidationPanelWithErrorsOnly />
        </section>

        {/* Example 3 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            3. Warnings Only
          </h2>
          <ValidationPanelWithWarningsOnly />
        </section>

        {/* Example 4 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            4. Success State (No Issues)
          </h2>
          <ValidationPanelSuccess />
        </section>

        {/* Example 5 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            5. Custom Styles
          </h2>
          <ValidationPanelCustomStyles />
        </section>

        {/* Example 6 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            6. Integration with JSON Editor
          </h2>
          <ValidationPanelWithJSONEditor />
        </section>
      </div>
    </div>
  );
}
