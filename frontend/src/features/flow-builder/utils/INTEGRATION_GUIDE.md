# Flow JSON Generator Integration Guide

This guide shows how to integrate the Flow JSON Generator into the Flow Builder UI.

## Quick Start

### 1. Import the Generator

```typescript
import {
  generateFlowJSON,
  validateGeneratedJSON,
  exportFlowJSON,
  calculateFlowJSONSize,
  isFlowJSONWithinSizeLimit,
} from '@/features/flow-builder/utils';
```

### 2. Generate from Builder State

```typescript
// In your Flow Builder component or hook
const flowJSON = generateFlowJSON(screens, edges, {
  version: '7.2',
  dataApiVersion: '3.0',
  includeRoutingModel: true,
});
```

## Integration Examples

### Example 1: Export Button in Toolbar

```typescript
import { useState } from 'react';
import { generateFlowJSON, validateGeneratedJSON } from '../utils';

export function FlowBuilderToolbar({ screens, edges, flowName }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Generate Flow JSON
      const flowJSON = generateFlowJSON(screens, edges, {
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

      // Export as file
      const jsonString = JSON.stringify(flowJSON, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${flowName || 'flow'}.json`;
      link.click();

      URL.revokeObjectURL(url);

      alert('Flow exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="toolbar">
      <button onClick={handleExport} disabled={isExporting}>
        {isExporting ? 'Exporting...' : 'Export Flow JSON'}
      </button>
    </div>
  );
}
```

### Example 2: Save Flow to Backend

```typescript
import axios from 'axios';
import { generateFlowJSON, validateGeneratedJSON, exportFlowJSONMinified } from '../utils';

export function useSaveFlow() {
  const saveFlow = async (flowId: string, screens: BuilderScreen[], edges: Edge[]) => {
    // Generate Flow JSON
    const flowJSON = generateFlowJSON(screens, edges, {
      version: '7.2',
      dataApiVersion: '3.0',
      cleanOutput: true,
    });

    // Validate
    const errors = validateGeneratedJSON(flowJSON);
    if (errors.length > 0) {
      throw new Error(`Invalid Flow: ${errors.join(', ')}`);
    }

    // Save to backend
    const response = await axios.post(`/api/flows/${flowId}/save`, {
      flowJSON: exportFlowJSONMinified(flowJSON),
    });

    return response.data;
  };

  return { saveFlow };
}
```

### Example 3: Preview Flow JSON in Modal

```typescript
import { useState } from 'react';
import { generateFlowJSON, exportFlowJSON } from '../utils';

export function FlowJSONPreviewModal({ screens, edges, onClose }) {
  const [jsonString, setJsonString] = useState('');

  const generatePreview = () => {
    const flowJSON = generateFlowJSON(screens, edges, {
      version: '7.2',
      includeRoutingModel: true,
    });

    const formatted = exportFlowJSON(flowJSON, 2);
    setJsonString(formatted);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonString);
    alert('Copied to clipboard!');
  };

  return (
    <div className="modal">
      <div className="modal-header">
        <h2>Flow JSON Preview</h2>
        <button onClick={onClose}>Close</button>
      </div>

      <div className="modal-body">
        <button onClick={generatePreview}>Generate</button>
        <button onClick={copyToClipboard}>Copy</button>

        <pre className="json-preview">
          <code>{jsonString}</code>
        </pre>
      </div>
    </div>
  );
}
```

### Example 4: Validation Panel

```typescript
import { useEffect, useState } from 'react';
import { generateFlowJSON, validateGeneratedJSON } from '../utils';

export function FlowValidationPanel({ screens, edges }) {
  const [errors, setErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    // Validate on every change
    try {
      const flowJSON = generateFlowJSON(screens, edges);
      const validationErrors = validateGeneratedJSON(flowJSON);

      setErrors(validationErrors);
      setIsValid(validationErrors.length === 0);
    } catch (error) {
      setErrors([error.message]);
      setIsValid(false);
    }
  }, [screens, edges]);

  return (
    <div className="validation-panel">
      <h3>Flow Validation</h3>

      {isValid ? (
        <div className="success">
          ✓ Flow is valid
        </div>
      ) : (
        <div className="errors">
          <p>Validation errors:</p>
          <ul>
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### Example 5: Size Monitor

```typescript
import { useEffect, useState } from 'react';
import { generateFlowJSON, calculateFlowJSONSize } from '../utils';

export function FlowSizeMonitor({ screens, edges }) {
  const [size, setSize] = useState(0);
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    const flowJSON = generateFlowJSON(screens, edges);
    const bytes = calculateFlowJSONSize(flowJSON);
    const maxSize = 10 * 1024 * 1024; // 10 MB

    setSize(bytes);
    setPercentage((bytes / maxSize) * 100);
  }, [screens, edges]);

  const sizeInMB = size / (1024 * 1024);
  const isWarning = percentage > 70;
  const isDanger = percentage > 90;

  return (
    <div className={`size-monitor ${isWarning ? 'warning' : ''} ${isDanger ? 'danger' : ''}`}>
      <div className="size-label">
        Flow Size: {sizeInMB.toFixed(2)} MB / 10 MB
      </div>

      <div className="size-bar">
        <div
          className="size-bar-fill"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {isDanger && (
        <div className="warning-text">
          Warning: Flow is approaching size limit!
        </div>
      )}
    </div>
  );
}
```

### Example 6: Auto-Save Hook

```typescript
import { useEffect, useRef } from 'react';
import { generateFlowJSON, validateGeneratedJSON } from '../utils';
import { useSaveFlow } from './useSaveFlow';

export function useAutoSave(
  flowId: string,
  screens: BuilderScreen[],
  edges: Edge[],
  intervalMs: number = 30000 // 30 seconds
) {
  const { saveFlow } = useSaveFlow();
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Generate current state
        const flowJSON = generateFlowJSON(screens, edges);
        const currentState = JSON.stringify(flowJSON);

        // Check if changed
        if (currentState === lastSavedRef.current) {
          return; // No changes
        }

        // Validate before saving
        const errors = validateGeneratedJSON(flowJSON);
        if (errors.length > 0) {
          console.warn('Auto-save skipped: validation errors', errors);
          return;
        }

        // Save
        await saveFlow(flowId, screens, edges);
        lastSavedRef.current = currentState;

        console.log('Auto-saved at', new Date().toISOString());
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [flowId, screens, edges, intervalMs, saveFlow]);
}
```

### Example 7: Routing Visualization

```typescript
import { useMemo } from 'react';
import { generateRoutingModel } from '../utils';

export function FlowRoutingVisualization({ screens, edges }) {
  const routingModel = useMemo(() => {
    return generateRoutingModel(screens, edges);
  }, [screens, edges]);

  return (
    <div className="routing-visualization">
      <h3>Flow Routing</h3>

      {Object.entries(routingModel).map(([screenId, targets]) => (
        <div key={screenId} className="routing-row">
          <span className="source-screen">{screenId}</span>
          <span className="arrow">→</span>
          <div className="target-screens">
            {targets.length === 0 ? (
              <span className="no-targets">Terminal</span>
            ) : (
              targets.map(target => (
                <span key={target} className="target-screen">
                  {target}
                </span>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Example 8: Publish to WhatsApp API

```typescript
import axios from 'axios';
import { generateFlowJSON, validateGeneratedJSON, exportFlowJSONMinified } from '../utils';

export async function publishFlowToWhatsApp(
  screens: BuilderScreen[],
  edges: Edge[],
  accessToken: string,
  whatsappBusinessAccountId: string
) {
  // Generate Flow JSON
  const flowJSON = generateFlowJSON(screens, edges, {
    version: '7.2',
    dataApiVersion: '3.0',
    cleanOutput: true,
  });

  // Validate
  const errors = validateGeneratedJSON(flowJSON);
  if (errors.length > 0) {
    throw new Error(`Cannot publish invalid Flow: ${errors.join(', ')}`);
  }

  // Publish to WhatsApp API
  const response = await axios.post(
    `https://graph.facebook.com/v18.0/${whatsappBusinessAccountId}/flows`,
    {
      name: 'My Flow',
      categories: ['LEAD_GENERATION'],
      flow_json: exportFlowJSONMinified(flowJSON),
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}
```

## State Management Integration

### With Context API

```typescript
import { createContext, useContext, useState } from 'react';
import { generateFlowJSON } from '../utils';

const FlowBuilderContext = createContext(null);

export function FlowBuilderProvider({ children }) {
  const [screens, setScreens] = useState<BuilderScreen[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const exportFlow = () => {
    return generateFlowJSON(screens, edges, {
      version: '7.2',
      includeRoutingModel: true,
    });
  };

  return (
    <FlowBuilderContext.Provider
      value={{
        screens,
        edges,
        setScreens,
        setEdges,
        exportFlow,
      }}
    >
      {children}
    </FlowBuilderContext.Provider>
  );
}

export function useFlowBuilder() {
  return useContext(FlowBuilderContext);
}
```

### With Zustand

```typescript
import { create } from 'zustand';
import { generateFlowJSON, validateGeneratedJSON } from '../utils';

interface FlowBuilderStore {
  screens: BuilderScreen[];
  edges: Edge[];
  setScreens: (screens: BuilderScreen[]) => void;
  setEdges: (edges: Edge[]) => void;
  exportFlow: () => FlowJSON;
  validateFlow: () => string[];
}

export const useFlowBuilderStore = create<FlowBuilderStore>((set, get) => ({
  screens: [],
  edges: [],

  setScreens: (screens) => set({ screens }),
  setEdges: (edges) => set({ edges }),

  exportFlow: () => {
    const { screens, edges } = get();
    return generateFlowJSON(screens, edges, {
      version: '7.2',
      includeRoutingModel: true,
    });
  },

  validateFlow: () => {
    const { screens, edges } = get();
    const flowJSON = generateFlowJSON(screens, edges);
    return validateGeneratedJSON(flowJSON);
  },
}));
```

## Best Practices

1. **Always Validate Before Export**
   ```typescript
   const errors = validateGeneratedJSON(flowJSON);
   if (errors.length > 0) {
     // Handle errors
   }
   ```

2. **Check Size Limits**
   ```typescript
   if (!isFlowJSONWithinSizeLimit(flowJSON)) {
     alert('Flow is too large!');
   }
   ```

3. **Use Clean Output**
   ```typescript
   generateFlowJSON(screens, edges, {
     cleanOutput: true, // Remove undefined/null
   });
   ```

4. **Handle Errors Gracefully**
   ```typescript
   try {
     const flowJSON = generateFlowJSON(screens, edges);
   } catch (error) {
     console.error('Generation failed:', error);
     showErrorNotification(error.message);
   }
   ```

5. **Provide User Feedback**
   ```typescript
   setIsExporting(true);
   try {
     // ... export logic
     showSuccessNotification('Flow exported!');
   } finally {
     setIsExporting(false);
   }
   ```

## Common Patterns Summary

| Pattern | Use Case | Key Functions |
|---------|----------|---------------|
| Export to File | Download Flow JSON | `generateFlowJSON`, `exportFlowJSON` |
| Save to Backend | Persist Flow | `generateFlowJSON`, `exportFlowJSONMinified` |
| Validation Panel | Show errors | `validateGeneratedJSON` |
| Size Monitor | Track size | `calculateFlowJSONSize` |
| Auto-Save | Periodic saves | `generateFlowJSON`, `validateGeneratedJSON` |
| Preview Modal | Show JSON | `exportFlowJSON` |
| API Publish | Send to WhatsApp | `generateFlowJSON`, `exportFlowJSONMinified` |
| Routing Viz | Show flow paths | `generateRoutingModel` |

## Next Steps

1. Integrate export button in your Flow Builder toolbar
2. Add validation panel to show real-time errors
3. Implement auto-save functionality
4. Add size monitoring
5. Create preview modal for JSON inspection
6. Integrate with WhatsApp API for publishing

## Additional Resources

- [Flow JSON Generator README](./FLOW_JSON_GENERATOR_README.md)
- [Generator Examples](./flowJsonGenerator.examples.ts)
- [Generator Tests](./flowJsonGenerator.test.ts)
- [WhatsApp Flows Documentation](https://developers.facebook.com/docs/whatsapp/flows)
