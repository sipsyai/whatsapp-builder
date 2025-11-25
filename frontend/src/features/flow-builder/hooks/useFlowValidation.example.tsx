/**
 * Example usage of useFlowValidation hook
 */

import React from 'react';
import { useFlowValidation } from './useFlowValidation';
import { BuilderScreen } from '../types';

// ============================================================================
// Example 1: Basic Usage
// ============================================================================

export const BasicValidationExample: React.FC<{ screens: BuilderScreen[] }> = ({ screens }) => {
  const {
    errors,
    isValidating,
    hasErrors,
    errorCount,
    warningCount,
  } = useFlowValidation(screens);

  return (
    <div>
      <h2>Flow Validation Status</h2>

      {isValidating && <p>Validating...</p>}

      {!isValidating && (
        <>
          <div>
            <strong>Has Errors:</strong> {hasErrors ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Error Count:</strong> {errorCount}
          </div>
          <div>
            <strong>Warning Count:</strong> {warningCount}
          </div>

          {errors.length > 0 && (
            <div>
              <h3>Validation Errors:</h3>
              <ul>
                {errors.map(error => (
                  <li key={error.id}>
                    [{error.type}] {error.message}
                    <br />
                    <small>Path: {error.path}</small>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ============================================================================
// Example 2: Validation Panel with Screen Filtering
// ============================================================================

export const ValidationPanel: React.FC<{ screens: BuilderScreen[] }> = ({ screens }) => {
  const {
    errors,
    isValidating,
    errorCount,
    warningCount,
    getErrorsForScreen,
  } = useFlowValidation(screens);

  return (
    <div className="validation-panel">
      <div className="validation-header">
        <h3>Validation</h3>
        <div className="validation-badges">
          {errorCount > 0 && (
            <span className="badge badge-error">{errorCount} Errors</span>
          )}
          {warningCount > 0 && (
            <span className="badge badge-warning">{warningCount} Warnings</span>
          )}
        </div>
      </div>

      {isValidating && (
        <div className="validation-loading">Validating...</div>
      )}

      {!isValidating && (
        <div className="validation-content">
          {screens.map(screen => {
            const screenErrors = getErrorsForScreen(screen.id);

            if (screenErrors.length === 0) return null;

            return (
              <div key={screen.id} className="screen-errors">
                <h4>{screen.title}</h4>
                <ul>
                  {screenErrors.map(error => (
                    <li key={error.id} className={`error-${error.type}`}>
                      {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {errors.length === 0 && (
            <div className="validation-success">
              All validation checks passed!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Example 3: Screen Card with Validation Badge
// ============================================================================

export const ScreenCard: React.FC<{
  screen: BuilderScreen;
  screens: BuilderScreen[];
}> = ({ screen, screens }) => {
  const { getErrorsForScreen, validateScreen } = useFlowValidation(screens);

  const screenErrors = getErrorsForScreen(screen.id);
  const hasErrors = screenErrors.length > 0;

  const handleRevalidate = () => {
    validateScreen(screen.id);
  };

  return (
    <div className={`screen-card ${hasErrors ? 'has-errors' : ''}`}>
      <div className="screen-card-header">
        <h3>{screen.title}</h3>
        {hasErrors && (
          <span className="error-badge">{screenErrors.length}</span>
        )}
      </div>

      <div className="screen-card-body">
        {screen.components.length} components
      </div>

      {hasErrors && (
        <div className="screen-card-errors">
          <h4>Validation Errors:</h4>
          <ul>
            {screenErrors.map(error => (
              <li key={error.id}>{error.message}</li>
            ))}
          </ul>
          <button onClick={handleRevalidate}>Revalidate</button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Example 4: Component Editor with Inline Validation
// ============================================================================

export const ComponentEditor: React.FC<{
  screenId: string;
  componentId: string;
  screens: BuilderScreen[];
}> = ({ screenId, componentId, screens }) => {
  const {
    getErrorsForComponent,
    validateComponent,
  } = useFlowValidation(screens);

  const componentErrors = getErrorsForComponent(componentId);

  const handleBlur = () => {
    // Validate component when user leaves a field
    validateComponent(screenId, componentId);
  };

  return (
    <div className="component-editor">
      <div className="component-fields">
        {/* Component fields here */}
        <input
          type="text"
          placeholder="Label"
          onBlur={handleBlur}
        />
      </div>

      {componentErrors.length > 0 && (
        <div className="component-errors">
          {componentErrors.map(error => (
            <div key={error.id} className="error-message">
              {error.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Example 5: Flow Builder with Publish Button
// ============================================================================

export const FlowBuilderHeader: React.FC<{
  screens: BuilderScreen[];
  onPublish: () => void;
}> = ({ screens, onPublish }) => {
  const {
    hasErrors,
    errorCount,
    warningCount,
    validateAll,
  } = useFlowValidation(screens);

  const handlePublish = () => {
    // Validate before publishing
    validateAll();

    if (!hasErrors) {
      onPublish();
    }
  };

  return (
    <div className="flow-builder-header">
      <h1>WhatsApp Flow Builder</h1>

      <div className="header-actions">
        <div className="validation-status">
          {errorCount > 0 && (
            <span className="status-errors">
              {errorCount} error{errorCount !== 1 ? 's' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="status-warnings">
              {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </span>
          )}
          {errorCount === 0 && warningCount === 0 && (
            <span className="status-success">Ready to publish</span>
          )}
        </div>

        <button
          onClick={handlePublish}
          disabled={hasErrors}
          className={hasErrors ? 'btn-disabled' : 'btn-primary'}
        >
          Publish Flow
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Example 6: Real-time Validation Indicator
// ============================================================================

export const ValidationIndicator: React.FC<{ screens: BuilderScreen[] }> = ({ screens }) => {
  const {
    isValidating,
    hasErrors,
    errorCount,
    warningCount,
  } = useFlowValidation(screens);

  return (
    <div className="validation-indicator">
      {isValidating && (
        <div className="indicator-validating">
          <span className="spinner" />
          Validating...
        </div>
      )}

      {!isValidating && hasErrors && (
        <div className="indicator-error">
          <span className="icon-error" />
          {errorCount} error{errorCount !== 1 ? 's' : ''} found
        </div>
      )}

      {!isValidating && !hasErrors && warningCount > 0 && (
        <div className="indicator-warning">
          <span className="icon-warning" />
          {warningCount} warning{warningCount !== 1 ? 's' : ''}
        </div>
      )}

      {!isValidating && !hasErrors && warningCount === 0 && (
        <div className="indicator-success">
          <span className="icon-success" />
          All checks passed
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Example 7: Validation Toast Notifications
// ============================================================================

export const ValidationToasts: React.FC<{ screens: BuilderScreen[] }> = ({ screens }) => {
  const { errors } = useFlowValidation(screens);
  const [dismissedErrors, setDismissedErrors] = React.useState<Set<string>>(new Set());

  const visibleErrors = errors.filter(error => !dismissedErrors.has(error.id));

  const handleDismiss = (errorId: string) => {
    setDismissedErrors(prev => new Set(prev).add(errorId));
  };

  return (
    <div className="validation-toasts">
      {visibleErrors.slice(0, 3).map(error => (
        <div key={error.id} className={`toast toast-${error.type}`}>
          <div className="toast-content">
            <strong>{error.type === 'error' ? 'Error' : 'Warning'}</strong>
            <p>{error.message}</p>
            <small>{error.path}</small>
          </div>
          <button
            onClick={() => handleDismiss(error.id)}
            className="toast-close"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// Example 8: Clear Errors Action
// ============================================================================

export const ValidationActions: React.FC<{ screens: BuilderScreen[] }> = ({ screens }) => {
  const {
    errors,
    validateAll,
    clearErrors,
  } = useFlowValidation(screens);

  return (
    <div className="validation-actions">
      <button onClick={validateAll}>
        Validate All
      </button>

      {errors.length > 0 && (
        <button onClick={clearErrors}>
          Clear All Errors ({errors.length})
        </button>
      )}
    </div>
  );
};
