/**
 * Flow JSON Parser - React Integration Example
 *
 * Shows how to integrate the parser in a React component
 * with file upload, validation, and ReactFlow visualization.
 */

import React, { useState, useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import {
  parseFlowJSON,
  isValidFlowJSON,
  getFlowStatistics,
} from './flowJsonParser';
import type { FlowJSON } from '../types/flow-json.types';
import type { BuilderScreen } from '../types/builder.types';

// ============================================================================
// Example 1: File Upload Component
// ============================================================================

export const FlowJSONImporter: React.FC = () => {
  const [screens, setScreens] = useState<BuilderScreen[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);

      // Read file
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate
      if (!isValidFlowJSON(data)) {
        throw new Error('Invalid Flow JSON structure');
      }

      // Parse
      const result = parseFlowJSON(data, file.name.replace('.json', ''));

      // Get statistics
      const flowStats = getFlowStatistics(result);
      setStats(flowStats);

      // Convert to ReactFlow nodes
      const reactFlowNodes: Node[] = result.screens.map(screen => ({
        id: screen.id,
        type: 'screenNode',
        position: screen.position || { x: 0, y: 0 },
        data: {
          screen,
          label: screen.title || screen.id,
          isTerminal: screen.terminal,
          hasFooter: screen.components.some(c => c.type === 'Footer'),
          componentCount: screen.components.length,
        },
      }));

      // Update state
      setScreens(result.screens);
      setNodes(reactFlowNodes);
      setEdges(result.edges);

      console.log('Flow imported successfully:', result);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import flow');
      console.error('Import error:', err);
    }
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Import Flow JSON</h2>

      <input
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        style={{ marginBottom: '20px' }}
      />

      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}

      {stats && (
        <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0' }}>
          <h3>Flow Statistics</h3>
          <p>Total Screens: {stats.totalScreens}</p>
          <p>Total Edges: {stats.totalEdges}</p>
          <p>Total Components: {stats.totalComponents}</p>
          <p>Terminal Screens: {stats.terminalScreens}</p>
          <p>Entry Screen: {stats.entryScreen}</p>
          <p>Version: {stats.version}</p>

          <h4>Components by Type:</h4>
          <ul>
            {Object.entries(stats.componentsByType).map(([type, count]) => (
              <li key={type}>{type}: {count}</li>
            ))}
          </ul>
        </div>
      )}

      {nodes.length > 0 && (
        <div style={{ height: '600px', border: '1px solid #ccc' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      )}

      {screens.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Screen Details</h3>
          {screens.map(screen => (
            <div
              key={screen.id}
              style={{
                marginBottom: '10px',
                padding: '10px',
                border: '1px solid #ddd',
              }}
            >
              <h4>{screen.title || screen.id}</h4>
              <p>Components: {screen.components.length}</p>
              <p>Position: ({screen.position?.x}, {screen.position?.y})</p>
              <p>Terminal: {screen.terminal ? 'Yes' : 'No'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Example 2: API Integration
// ============================================================================

interface FlowLoaderProps {
  flowId: string;
  onFlowLoaded?: (screens: BuilderScreen[]) => void;
}

export const FlowLoader: React.FC<FlowLoaderProps> = ({ flowId, onFlowLoaded }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFlow = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch from API
      const response = await fetch(`/api/flows/${flowId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch flow');
      }

      const flowJson = await response.json();

      // Validate
      if (!isValidFlowJSON(flowJson)) {
        throw new Error('Invalid Flow JSON from API');
      }

      // Parse
      const result = parseFlowJSON(flowJson, `Flow ${flowId}`);

      // Callback
      onFlowLoaded?.(result.screens);

      console.log('Flow loaded from API:', result);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load error');
    } finally {
      setLoading(false);
    }
  }, [flowId, onFlowLoaded]);

  return (
    <div>
      <button onClick={loadFlow} disabled={loading}>
        {loading ? 'Loading...' : 'Load Flow'}
      </button>

      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};

// ============================================================================
// Example 3: Drag-and-Drop Import
// ============================================================================

export const FlowJSONDropZone: React.FC<{
  onImport: (screens: BuilderScreen[], edges: Edge[]) => void;
}> = ({ onImport }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      setError(null);

      const file = e.dataTransfer.files[0];
      if (!file) return;

      if (!file.name.endsWith('.json')) {
        setError('Please drop a JSON file');
        return;
      }

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!isValidFlowJSON(data)) {
          throw new Error('Invalid Flow JSON format');
        }

        const result = parseFlowJSON(data, file.name.replace('.json', ''));
        onImport(result.screens, result.edges);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Import failed');
      }
    },
    [onImport]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        border: `2px dashed ${isDragging ? '#007bff' : '#ccc'}`,
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        background: isDragging ? '#f0f8ff' : '#f9f9f9',
        cursor: 'pointer',
      }}
    >
      <p>Drop Flow JSON file here</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

// ============================================================================
// Example 4: Complete Flow Builder Component
// ============================================================================

export const FlowBuilderWithImport: React.FC = () => {
  const [screens, setScreens] = useState<BuilderScreen[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [flowName, setFlowName] = useState<string>('Untitled Flow');

  const handleImport = useCallback((importedScreens: BuilderScreen[], importedEdges: Edge[]) => {
    // Convert screens to ReactFlow nodes
    const reactFlowNodes: Node[] = importedScreens.map(screen => ({
      id: screen.id,
      type: 'screenNode',
      position: screen.position || { x: 0, y: 0 },
      data: {
        screen,
        label: screen.title || screen.id,
        isTerminal: screen.terminal,
        componentCount: screen.components.length,
      },
    }));

    setScreens(importedScreens);
    setNodes(reactFlowNodes);
    setEdges(importedEdges);
  }, []);

  const handleExport = useCallback(() => {
    // Use flowJsonGenerator to convert back to Flow JSON
    // (This is complementary to the parser)
    console.log('Export functionality would go here');
  }, [screens]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
        <h1>{flowName}</h1>
        <button onClick={handleExport}>Export Flow JSON</button>
      </header>

      <div style={{ padding: '20px' }}>
        <FlowJSONDropZone onImport={handleImport} />
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        {nodes.length > 0 ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>No flow loaded. Drop a Flow JSON file above to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Example 5: With Validation Display
// ============================================================================

export const FlowImporterWithValidation: React.FC = () => {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleImportWithValidation = useCallback(
    async (file: File) => {
      const errors: string[] = [];
      const warns: string[] = [];

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Basic validation
        if (!isValidFlowJSON(data)) {
          errors.push('Invalid Flow JSON structure');
          setValidationErrors(errors);
          return;
        }

        const flowJson = data as FlowJSON;

        // Custom validations
        if (flowJson.screens.length === 0) {
          errors.push('Flow must have at least one screen');
        }

        const terminalScreens = flowJson.screens.filter(s => s.terminal);
        if (terminalScreens.length === 0) {
          warns.push('No terminal screens found - flow may not complete properly');
        }

        // Check for disconnected screens
        const result = parseFlowJSON(flowJson);
        const connectedScreens = new Set<string>();
        result.edges.forEach(edge => {
          connectedScreens.add(edge.source);
          connectedScreens.add(edge.target);
        });

        const disconnectedScreens = result.screens.filter(
          s => !connectedScreens.has(s.id) && s.id !== result.screens[0]?.id
        );

        if (disconnectedScreens.length > 0) {
          warns.push(
            `Disconnected screens: ${disconnectedScreens.map(s => s.id).join(', ')}`
          );
        }

        setValidationErrors(errors);
        setWarnings(warns);

        if (errors.length === 0) {
          console.log('Flow imported successfully');
        }

      } catch (err) {
        errors.push(err instanceof Error ? err.message : 'Parse error');
        setValidationErrors(errors);
      }
    },
    []
  );

  return (
    <div style={{ padding: '20px' }}>
      <h2>Import with Validation</h2>

      <input
        type="file"
        accept=".json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImportWithValidation(file);
        }}
      />

      {validationErrors.length > 0 && (
        <div style={{ marginTop: '20px', padding: '10px', background: '#ffebee' }}>
          <h3>Errors:</h3>
          <ul>
            {validationErrors.map((error, i) => (
              <li key={i} style={{ color: 'red' }}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div style={{ marginTop: '20px', padding: '10px', background: '#fff3e0' }}>
          <h3>Warnings:</h3>
          <ul>
            {warnings.map((warning, i) => (
              <li key={i} style={{ color: 'orange' }}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
