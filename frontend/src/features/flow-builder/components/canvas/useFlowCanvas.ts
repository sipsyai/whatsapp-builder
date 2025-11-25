import { useState, useCallback, useMemo } from 'react';
import {
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
  type ReactFlowInstance,
} from '@xyflow/react';

import type { BuilderScreen, ScreenNodeData, NavigationEdgeData } from '../../types';

/**
 * Options for useFlowCanvas hook
 */
export interface UseFlowCanvasOptions {
  screens: BuilderScreen[];
  onScreenUpdate: (screenId: string, updates: Partial<BuilderScreen>) => void;
  onScreenSelect: (screenId: string | null) => void;
}

/**
 * Return type for useFlowCanvas hook
 */
export interface UseFlowCanvasReturn {
  // ReactFlow state
  nodes: Node<ScreenNodeData>[];
  edges: Edge<NavigationEdgeData>[];
  onNodesChange: OnNodesChange<Node<ScreenNodeData>>;
  onEdgesChange: OnEdgesChange<Edge<NavigationEdgeData>>;

  // ReactFlow instance
  reactFlowInstance: ReactFlowInstance | null;
  setReactFlowInstance: (instance: ReactFlowInstance | null) => void;

  // Node operations
  addNode: (node: Node<ScreenNodeData>) => void;
  updateNode: (nodeId: string, updates: Partial<Node<ScreenNodeData>>) => void;
  deleteNode: (nodeId: string) => void;

  // Edge operations
  addEdgeConnection: (connection: Connection) => void;
  deleteEdge: (edgeId: string) => void;
}

/**
 * Hook for managing ReactFlow canvas state
 *
 * Handles:
 * - Node and edge state management
 * - Synchronization with BuilderScreen data
 * - ReactFlow instance management
 */
export function useFlowCanvas({
  screens,
  onScreenSelect,
}: UseFlowCanvasOptions): UseFlowCanvasReturn {
  // ========================================================================
  // ReactFlow State
  // ========================================================================

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ScreenNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<NavigationEdgeData>>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // ========================================================================
  // Sync nodes with screens
  // ========================================================================

  // Update nodes when screens change
  useMemo(() => {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    const updatedNodes = screens.map(screen => {
      const existingNode = nodeMap.get(screen.id);

      return {
        id: screen.id,
        type: 'screen',
        position: existingNode?.position || { x: 0, y: 0 },
        data: {
          screen,
          label: screen.title || screen.id,
          onEdit: () => onScreenSelect(screen.id),
          onDelete: () => {
            // Will be handled by parent
          },
        },
      } as Node<ScreenNodeData>;
    });

    // Only update if nodes changed
    if (JSON.stringify(nodes.map(n => n.data.screen)) !== JSON.stringify(screens)) {
      setNodes(updatedNodes);
    }
  }, [screens, onScreenSelect]);

  // ========================================================================
  // Node Operations
  // ========================================================================

  const addNode = useCallback(
    (node: Node<ScreenNodeData>) => {
      setNodes(prev => [...prev, node]);
    },
    [setNodes]
  );

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<Node<ScreenNodeData>>) => {
      setNodes(prev =>
        prev.map(node => (node.id === nodeId ? { ...node, ...updates } : node))
      );
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes(prev => prev.filter(node => node.id !== nodeId));
      setEdges(prev =>
        prev.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
      );
    },
    [setNodes, setEdges]
  );

  // ========================================================================
  // Edge Operations
  // ========================================================================

  const addEdgeConnection = useCallback(
    (connection: Connection) => {
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

      setEdges(prev => addEdge(newEdge, prev));
    },
    [setEdges]
  );

  const deleteEdge = useCallback(
    (edgeId: string) => {
      setEdges(prev => prev.filter(edge => edge.id !== edgeId));
    },
    [setEdges]
  );

  // ========================================================================
  // Return
  // ========================================================================

  return {
    // ReactFlow state
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,

    // ReactFlow instance
    reactFlowInstance,
    setReactFlowInstance,

    // Node operations
    addNode,
    updateNode,
    deleteNode,

    // Edge operations
    addEdgeConnection,
    deleteEdge,
  };
}
