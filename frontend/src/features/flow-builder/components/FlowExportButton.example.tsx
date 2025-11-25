/**
 * Flow Export Button - Real-world Example
 *
 * Complete, production-ready implementation of a Flow export button
 * using the Flow JSON Generator.
 */

import { useState } from 'react';
import {
  generateFlowJSON,
  validateGeneratedJSON,
  exportFlowJSON,
  calculateFlowJSONSize,
  isFlowJSONWithinSizeLimit,
  type GeneratorOptions,
} from '../utils';

import type { BuilderScreen } from '../types/builder.types';
import type { Edge } from '@xyflow/react';

// ============================================================================
// Component Props
// ============================================================================

interface FlowExportButtonProps {
  screens: BuilderScreen[];
  edges: Edge[];
  flowName: string;
  flowVersion?: string;
  onExportSuccess?: () => void;
  onExportError?: (error: string) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function FlowExportButton({
  screens,
  edges,
  flowName,
  flowVersion = '7.2',
  onExportSuccess,
  onExportError,
}: FlowExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewJSON, setPreviewJSON] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  // ============================================================================
  // Export Functions
  // ============================================================================

  const handleExport = async () => {
    setIsExporting(true);
    setErrors([]);

    try {
      // 1. Generate Flow JSON
      const options: GeneratorOptions = {
        version: flowVersion as any,
        dataApiVersion: '3.0',
        includeRoutingModel: true,
        cleanOutput: true,
      };

      const flowJSON = generateFlowJSON(screens, edges, options);

      // 2. Validate
      const validationErrors = validateGeneratedJSON(flowJSON);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        onExportError?.(
          `Validation failed with ${validationErrors.length} error(s)`
        );
        return;
      }

      // 3. Check size
      const size = calculateFlowJSONSize(flowJSON);
      const sizeInMB = size / (1024 * 1024);

      if (!isFlowJSONWithinSizeLimit(flowJSON)) {
        const errorMsg = `Flow is too large: ${sizeInMB.toFixed(2)} MB (max 10 MB)`;
        setErrors([errorMsg]);
        onExportError?.(errorMsg);
        return;
      }

      // 4. Export as file
      const jsonString = exportFlowJSON(flowJSON, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${sanitizeFileName(flowName)}.json`;
      link.click();

      // Cleanup
      URL.revokeObjectURL(url);

      // 5. Success callback
      onExportSuccess?.();

      // Show success message
      console.log(
        `✓ Flow exported successfully (${sizeInMB.toFixed(2)} MB, ${screens.length} screens)`
      );
    } catch (error) {
      const errorMsg = `Export failed: ${(error as Error).message}`;
      setErrors([errorMsg]);
      onExportError?.(errorMsg);
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreview = () => {
    try {
      const flowJSON = generateFlowJSON(screens, edges, {
        version: flowVersion as any,
        includeRoutingModel: true,
      });

      const jsonString = exportFlowJSON(flowJSON, 2);
      setPreviewJSON(jsonString);
      setShowPreview(true);
      setErrors([]);
    } catch (error) {
      const errorMsg = `Preview failed: ${(error as Error).message}`;
      setErrors([errorMsg]);
      console.error('Preview error:', error);
    }
  };

  const handleCopyJSON = () => {
    if (previewJSON) {
      navigator.clipboard.writeText(previewJSON);
      alert('Copied to clipboard!');
    }
  };

  // ============================================================================
  // Validation Status
  // ============================================================================

  const getValidationStatus = () => {
    try {
      const flowJSON = generateFlowJSON(screens, edges);
      const validationErrors = validateGeneratedJSON(flowJSON);

      if (validationErrors.length === 0) {
        const size = calculateFlowJSONSize(flowJSON);
        const sizeInMB = size / (1024 * 1024);

        return {
          isValid: true,
          message: `Ready to export (${sizeInMB.toFixed(2)} MB, ${screens.length} screens)`,
          sizeInMB,
          warnings: sizeInMB > 7 ? ['Flow is approaching size limit'] : [],
        };
      }

      return {
        isValid: false,
        message: `${validationErrors.length} validation error(s)`,
        errors: validationErrors,
      };
    } catch (error) {
      return {
        isValid: false,
        message: `Error: ${(error as Error).message}`,
        errors: [(error as Error).message],
      };
    }
  };

  const status = getValidationStatus();

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="flow-export-container">
      {/* Export Controls */}
      <div className="export-controls">
        <button
          onClick={handleExport}
          disabled={isExporting || !status.isValid || screens.length === 0}
          className="btn-primary"
        >
          {isExporting ? (
            <>
              <span className="spinner" />
              Exporting...
            </>
          ) : (
            <>
              <span className="icon">⬇</span>
              Export Flow JSON
            </>
          )}
        </button>

        <button
          onClick={handlePreview}
          disabled={screens.length === 0}
          className="btn-secondary"
        >
          <span className="icon">👁</span>
          Preview
        </button>
      </div>

      {/* Status Indicator */}
      <div className={`status-indicator ${status.isValid ? 'valid' : 'invalid'}`}>
        <span className="status-icon">
          {status.isValid ? '✓' : '⚠'}
        </span>
        <span className="status-message">{status.message}</span>
      </div>

      {/* Warnings */}
      {status.warnings && status.warnings.length > 0 && (
        <div className="warnings">
          {status.warnings.map((warning, i) => (
            <div key={i} className="warning-item">
              ⚠ {warning}
            </div>
          ))}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="errors">
          <strong>Export Errors:</strong>
          <ul>
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="preview-modal">
          <div className="preview-modal-overlay" onClick={() => setShowPreview(false)} />

          <div className="preview-modal-content">
            <div className="preview-modal-header">
              <h2>Flow JSON Preview</h2>

              <div className="preview-modal-actions">
                <button onClick={handleCopyJSON} className="btn-secondary">
                  📋 Copy
                </button>
                <button onClick={() => setShowPreview(false)} className="btn-secondary">
                  ✕ Close
                </button>
              </div>
            </div>

            <div className="preview-modal-body">
              <pre className="json-preview">
                <code>{previewJSON}</code>
              </pre>
            </div>

            <div className="preview-modal-footer">
              <div className="preview-stats">
                <span>Size: {(previewJSON.length / 1024).toFixed(2)} KB</span>
                <span>Screens: {screens.length}</span>
                <span>Components: {screens.reduce((sum, s) => sum + s.components.length, 0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function sanitizeFileName(name: string): string {
  // Remove invalid file name characters
  return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

// ============================================================================
// Styles (Example)
// ============================================================================

const styles = `
.flow-export-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f9f9f9;
}

.export-controls {
  display: flex;
  gap: 12px;
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #0d6efd;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0b5ed7;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #f5f5f5;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
}

.status-indicator.valid {
  background: #d1f2eb;
  color: #0f5132;
}

.status-indicator.invalid {
  background: #f8d7da;
  color: #842029;
}

.warnings {
  padding: 12px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
}

.warning-item {
  font-size: 13px;
  color: #664d03;
}

.errors {
  padding: 12px;
  background: #f8d7da;
  border: 1px solid #dc3545;
  border-radius: 4px;
}

.errors strong {
  display: block;
  margin-bottom: 8px;
  color: #842029;
}

.errors ul {
  margin: 0;
  padding-left: 20px;
  color: #842029;
}

.preview-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.preview-modal-content {
  position: relative;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.preview-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.preview-modal-actions {
  display: flex;
  gap: 8px;
}

.preview-modal-body {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

.json-preview {
  margin: 0;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow-x: auto;
}

.json-preview code {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
}

.preview-modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  background: #f9f9f9;
}

.preview-stats {
  display: flex;
  gap: 24px;
  font-size: 13px;
  color: #666;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
`;

// ============================================================================
// Usage Example
// ============================================================================

export function ExampleUsage() {
  // This shows how to use the FlowExportButton in your Flow Builder

  const [screens, setScreens] = useState<BuilderScreen[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  return (
    <div className="flow-builder">
      <div className="toolbar">
        <FlowExportButton
          screens={screens}
          edges={edges}
          flowName="My WhatsApp Flow"
          flowVersion="7.2"
          onExportSuccess={() => {
            console.log('Export successful!');
            // Show success toast
          }}
          onExportError={(error) => {
            console.error('Export failed:', error);
            // Show error toast
          }}
        />
      </div>

      {/* Rest of your Flow Builder UI */}
    </div>
  );
}
