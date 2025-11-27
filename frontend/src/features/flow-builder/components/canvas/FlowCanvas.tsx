import React, { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Connection,
  type Edge,
  type Node,
  type ReactFlowInstance,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ScreenNode } from '../nodes/ScreenNode';
import { NavigateEdge } from '../edges/NavigateEdge';
import type { ScreenNodeData, NavigationEdgeData, BuilderScreen } from '../../types';

// Node and edge types configuration
const nodeTypes: NodeTypes = {
  screen: ScreenNode,
} as NodeTypes;

const edgeTypes: EdgeTypes = {
  navigate: NavigateEdge,
} as EdgeTypes;

// Default edge options
const defaultEdgeOptions = {
  type: 'navigate',
  animated: false,
};

// ReactFlow pro options (disable attribution)
const proOptions = { hideAttribution: true };

// ============================================================================
// Props Interface
// ============================================================================

export interface FlowCanvasProps {
  // ReactFlow state
  nodes: Node<ScreenNodeData>[];
  edges: Edge<NavigationEdgeData>[];
  onNodesChange: OnNodesChange<Node<ScreenNodeData>>;
  onEdgesChange: OnEdgesChange<Edge<NavigationEdgeData>>;

  // Event handlers
  onNodeClick?: (event: React.MouseEvent, node: Node<ScreenNodeData>) => void;
  onEdgeClick?: (event: React.MouseEvent, edge: Edge<NavigationEdgeData>) => void;

  // Drag & drop handler for adding components to selected screen
  onComponentDrop?: (componentType: string) => void;

  // Drag & drop handler for adding new screens
  onDrop?: (screen: BuilderScreen, position: { x: number; y: number }) => void;
}

// ============================================================================
// FlowCanvas Component
// ============================================================================

export const FlowCanvas: React.FC<FlowCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  onEdgeClick,
  onComponentDrop,
  onDrop,
}) => {
  // Refs and state
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // ============================================================================
  // Connection Handler
  // ============================================================================

  const onConnect = useCallback(
    (connection: Connection) => {
      // Create edge with default type
      const newEdge: Edge<NavigationEdgeData> = {
        ...connection,
        id: `${connection.source}-${connection.target}`,
        type: 'navigate',
        data: {
          action: {
            name: 'navigate',
            next: {
              type: 'screen',
              name: connection.target || '',
            },
          },
          sourceScreenId: connection.source || '',
          label: 'Navigate',
        },
      } as Edge<NavigationEdgeData>;

      onEdgesChange([
        {
          type: 'add',
          item: newEdge,
        },
      ]);
    },
    [onEdgesChange]
  );

  // ============================================================================
  // Connection Validation
  // ============================================================================

  const isValidConnection = useCallback(
    (connection: Connection) => {
      // Prevent self-connections
      if (connection.source === connection.target) {
        return false;
      }

      // Find target node
      const targetNode = nodes.find((n) => n.id === connection.target);

      // Prevent connecting to start screen
      if (targetNode?.data?.screen?.id.startsWith('start')) {
        return false;
      }

      // Prevent duplicate connections
      const isDuplicate = edges.some(
        (edge) =>
          edge.source === connection.source &&
          edge.target === connection.target &&
          edge.sourceHandle === connection.sourceHandle
      );

      return !isDuplicate;
    },
    [nodes, edges]
  );

  // ============================================================================
  // Drag & Drop Handlers
  // ============================================================================

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDropHandler = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      // First, check for component drop from palette
      const componentType = event.dataTransfer.getData('application/whatsapp-flow-component');
      if (componentType && onComponentDrop) {
        onComponentDrop(componentType);
        return;
      }

      // Then, check for screen drop
      if (!reactFlowInstance || !onDrop) return;

      const screenData = event.dataTransfer.getData('application/reactflow');
      if (!screenData) return;

      try {
        const screen: BuilderScreen = JSON.parse(screenData);

        // Convert screen coordinates to flow coordinates
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        // Call the onDrop handler with screen and position
        onDrop(screen, position);
      } catch (error) {
        console.error('Error parsing dropped screen data:', error);
      }
    },
    [reactFlowInstance, onDrop, onComponentDrop]
  );

  // ============================================================================
  // MiniMap Node Color
  // ============================================================================

  const nodeColor = useCallback((node: Node) => {
    const nodeData = node.data as ScreenNodeData;

    // Terminal screens
    if (nodeData.isTerminal) {
      return '#22c55e'; // green-500
    }

    // Screens with validation errors
    if (nodeData.screen?.validation && !nodeData.screen.validation.isValid) {
      return '#ef4444'; // red-500
    }

    // Default color
    return '#65C997'; // primary
  }, []);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes as Node[]}
        edges={edges as Edge[]}
        onNodesChange={onNodesChange as OnNodesChange}
        onEdgesChange={onEdgesChange as OnEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onNodeClick={onNodeClick as any}
        onEdgeClick={onEdgeClick as any}
        onDrop={onDropHandler}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        isValidConnection={isValidConnection as any}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.5,
          maxZoom: 1.5,
        }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={proOptions}
        className="bg-[#0a160e]"
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Control', 'Meta']}
        selectionKeyCode={['Shift']}
      >
        {/* Background with dots pattern */}
        <Background
          color="#71717a"
          gap={20}
          size={1}
          variant={BackgroundVariant.Dots}
          className="bg-[#0a160e]"
        />

        {/* Controls for zoom and fit view */}
        <Controls
          showInteractive={false}
          className="bg-[#193322] border border-white/10 rounded-lg shadow-lg"
        />

        {/* MiniMap in bottom right */}
        <MiniMap
          nodeColor={nodeColor}
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="bg-[#193322] border border-white/10 rounded-lg shadow-lg"
          style={{
            backgroundColor: 'transparent',
          }}
        />
      </ReactFlow>
    </div>
  );
};
