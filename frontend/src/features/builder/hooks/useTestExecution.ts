import { useState, useMemo, useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';

/**
 * Execution state for test mode
 */
export interface ExecutionState {
  /** Whether test mode is active */
  isTestMode: boolean;
  /** Whether execution is currently running */
  isRunning: boolean;
  /** ID of the currently executing node */
  currentNodeId: string | null;
  /** List of node IDs that have been executed */
  executedNodeIds: string[];
  /** List of edge IDs that form the execution path */
  executionPath: string[];
  /** Current execution status */
  status: 'idle' | 'running' | 'waiting' | 'completed' | 'error';
  /** Error message if status is 'error' */
  errorMessage?: string;
}

/**
 * Test state data added to nodes during test mode
 */
export interface NodeTestState {
  /** Whether this node is currently executing */
  isCurrent: boolean;
  /** Whether this node has been executed */
  isExecuted: boolean;
  /** Whether this node is pending execution (in the path but not yet executed) */
  isPending: boolean;
  /** Execution order index (1-based) */
  executionOrder?: number;
}

/**
 * Test state data added to edges during test mode
 */
export interface EdgeTestState {
  /** Whether this edge has been traversed */
  isExecuted: boolean;
  /** Whether this edge is currently being traversed */
  isAnimated: boolean;
}

/**
 * Return type for useTestExecution hook
 */
export interface UseTestExecutionReturn {
  /** Current execution state */
  executionState: ExecutionState;
  /** Enable or disable test mode */
  setTestMode: (enabled: boolean) => void;
  /** Set the currently executing node */
  setCurrentNode: (nodeId: string | null) => void;
  /** Mark a node as completed and optionally add an edge to the execution path */
  completeNode: (nodeId: string, edgeId?: string) => void;
  /** Reset execution state to initial values */
  resetExecution: () => void;
  /** Start execution from a specific node */
  startExecution: (startNodeId: string) => void;
  /** Set execution status */
  setStatus: (status: ExecutionState['status']) => void;
  /** Set error state */
  setError: (message: string) => void;
  /** Get nodes with test state data added */
  getEnhancedNodes: () => Node[];
  /** Get edges with test state data added */
  getEnhancedEdges: () => Edge[];
}

const initialExecutionState: ExecutionState = {
  isTestMode: false,
  isRunning: false,
  currentNodeId: null,
  executedNodeIds: [],
  executionPath: [],
  status: 'idle',
};

/**
 * Hook for managing test execution state and enhancing nodes/edges with test visualization data.
 *
 * This hook provides:
 * - Execution state tracking (current node, executed nodes, execution path)
 * - Node enhancement with testState data (isCurrent, isExecuted, isPending)
 * - Edge enhancement with animated and executed styling
 * - Methods for controlling execution flow
 *
 * @param nodes - ReactFlow nodes array
 * @param edges - ReactFlow edges array
 * @returns Test execution state and control methods
 *
 * @example
 * ```tsx
 * const {
 *   executionState,
 *   setTestMode,
 *   getEnhancedNodes,
 *   getEnhancedEdges
 * } = useTestExecution(nodes, edges);
 *
 * // Use enhanced nodes/edges in ReactFlow
 * <ReactFlow
 *   nodes={executionState.isTestMode ? getEnhancedNodes() : nodes}
 *   edges={executionState.isTestMode ? getEnhancedEdges() : edges}
 * />
 * ```
 */
export function useTestExecution(
  nodes: Node[],
  edges: Edge[]
): UseTestExecutionReturn {
  const [executionState, setExecutionState] = useState<ExecutionState>(initialExecutionState);

  /**
   * Enable or disable test mode
   */
  const setTestMode = useCallback((enabled: boolean) => {
    setExecutionState(prev => ({
      ...prev,
      isTestMode: enabled,
      // Reset execution state when entering/exiting test mode
      isRunning: false,
      currentNodeId: null,
      executedNodeIds: [],
      executionPath: [],
      status: 'idle',
      errorMessage: undefined,
    }));
  }, []);

  /**
   * Set the currently executing node
   */
  const setCurrentNode = useCallback((nodeId: string | null) => {
    setExecutionState(prev => ({
      ...prev,
      currentNodeId: nodeId,
      status: nodeId ? 'running' : prev.status,
    }));
  }, []);

  /**
   * Mark a node as completed and optionally add an edge to the execution path
   */
  const completeNode = useCallback((nodeId: string, edgeId?: string) => {
    setExecutionState(prev => {
      const newExecutedNodeIds = prev.executedNodeIds.includes(nodeId)
        ? prev.executedNodeIds
        : [...prev.executedNodeIds, nodeId];

      const newExecutionPath = edgeId && !prev.executionPath.includes(edgeId)
        ? [...prev.executionPath, edgeId]
        : prev.executionPath;

      return {
        ...prev,
        executedNodeIds: newExecutedNodeIds,
        executionPath: newExecutionPath,
        currentNodeId: prev.currentNodeId === nodeId ? null : prev.currentNodeId,
      };
    });
  }, []);

  /**
   * Reset execution state to initial values
   */
  const resetExecution = useCallback(() => {
    setExecutionState(prev => ({
      ...prev,
      isRunning: false,
      currentNodeId: null,
      executedNodeIds: [],
      executionPath: [],
      status: 'idle',
      errorMessage: undefined,
    }));
  }, []);

  /**
   * Start execution from a specific node
   */
  const startExecution = useCallback((startNodeId: string) => {
    setExecutionState(prev => ({
      ...prev,
      isRunning: true,
      currentNodeId: startNodeId,
      executedNodeIds: [],
      executionPath: [],
      status: 'running',
      errorMessage: undefined,
    }));
  }, []);

  /**
   * Set execution status
   */
  const setStatus = useCallback((status: ExecutionState['status']) => {
    setExecutionState(prev => ({
      ...prev,
      status,
      isRunning: status === 'running' || status === 'waiting',
    }));
  }, []);

  /**
   * Set error state
   */
  const setError = useCallback((message: string) => {
    setExecutionState(prev => ({
      ...prev,
      status: 'error',
      isRunning: false,
      errorMessage: message,
    }));
  }, []);

  /**
   * Build a set of node IDs that are in the pending path
   * (connected to executed nodes but not yet executed)
   */
  const pendingNodeIds = useMemo(() => {
    const pending = new Set<string>();
    const { executedNodeIds, currentNodeId } = executionState;

    if (!executionState.isTestMode) return pending;

    // Find edges from executed nodes that lead to non-executed nodes
    edges.forEach(edge => {
      const sourceExecuted = executedNodeIds.includes(edge.source);
      const targetExecuted = executedNodeIds.includes(edge.target);
      const targetIsCurrent = edge.target === currentNodeId;

      if (sourceExecuted && !targetExecuted && !targetIsCurrent) {
        pending.add(edge.target);
      }
    });

    return pending;
  }, [edges, executionState.executedNodeIds, executionState.currentNodeId, executionState.isTestMode]);

  /**
   * Get nodes enhanced with test state data
   * Does NOT modify original nodes - returns new array with enhanced copies
   */
  const getEnhancedNodes = useCallback((): Node[] => {
    if (!executionState.isTestMode) {
      return nodes;
    }

    const { currentNodeId, executedNodeIds } = executionState;

    return nodes.map((node, _index) => {
      const isCurrent = node.id === currentNodeId;
      const isExecuted = executedNodeIds.includes(node.id);
      const isPending = pendingNodeIds.has(node.id);
      const executionOrder = isExecuted
        ? executedNodeIds.indexOf(node.id) + 1
        : undefined;

      const testState: NodeTestState = {
        isCurrent,
        isExecuted,
        isPending,
        executionOrder,
      };

      // Return a new node object with testState in data
      // This does NOT modify the original node
      return {
        ...node,
        data: {
          ...node.data,
          testState,
        },
      };
    });
  }, [nodes, executionState, pendingNodeIds]);

  /**
   * Get edges enhanced with test state data
   * Does NOT modify original edges - returns new array with enhanced copies
   */
  const getEnhancedEdges = useCallback((): Edge[] => {
    if (!executionState.isTestMode) {
      return edges;
    }

    const { executionPath, currentNodeId, executedNodeIds } = executionState;

    return edges.map(edge => {
      const isExecuted = executionPath.includes(edge.id);

      // Edge is animated if:
      // 1. Source is current node OR
      // 2. Target is current node and source is executed
      const isAnimated =
        edge.source === currentNodeId ||
        (edge.target === currentNodeId && executedNodeIds.includes(edge.source));

      const testState: EdgeTestState = {
        isExecuted,
        isAnimated,
      };

      // Return a new edge object with enhanced styling
      // This does NOT modify the original edge
      return {
        ...edge,
        animated: isAnimated,
        data: {
          ...edge.data,
          testState,
        },
        style: {
          ...edge.style,
          ...(isExecuted && {
            stroke: '#22c55e', // green-500 for executed edges
            strokeWidth: 2,
          }),
          ...(isAnimated && {
            stroke: '#f97316', // orange-500 for animated edges
            strokeWidth: 3,
          }),
        },
      };
    });
  }, [edges, executionState]);

  return {
    executionState,
    setTestMode,
    setCurrentNode,
    completeNode,
    resetExecution,
    startExecution,
    setStatus,
    setError,
    getEnhancedNodes,
    getEnhancedEdges,
  };
}

export default useTestExecution;
