/**
 * Interface definitions for test execution adapter
 */

/**
 * Loop detection statistics for preventing infinite loops
 */
export interface LoopDetectionStats {
  /** Count of visits per node ID */
  nodeVisits: Record<string, number>;
  /** Total steps executed in the test */
  totalSteps: number;
  /** Whether a loop was detected */
  loopDetected: boolean;
  /** Details about detected loop, if any */
  loopDetails?: {
    nodeId: string;
    visitCount: number;
    message: string;
  };
}

/**
 * Configuration for loop detection
 */
export interface LoopDetectionConfig {
  /** Maximum times a single node can be visited (default: 10) */
  maxNodeVisits: number;
  /** Maximum total steps in execution (default: 100) */
  maxTotalSteps: number;
}

/**
 * Result of test node execution
 */
export interface TestNodeExecutionResult {
  /** Whether execution was successful */
  success: boolean;
  /** Node ID that was executed */
  nodeId: string;
  /** Type of node */
  nodeType: string;
  /** Label of the node */
  nodeLabel?: string;
  /** Execution duration in milliseconds */
  duration: number;
  /** Error message if failed */
  error?: string;
  /** Output data from the node */
  output?: any;
  /** Whether loop was detected during execution */
  loopDetected?: boolean;
  /** Next node to execute, if any */
  nextNodeId?: string | null;
}

/**
 * Test execution state
 */
export interface TestExecutionState {
  /** Test context ID */
  contextId: string;
  /** Chatbot being tested */
  chatbotId: string;
  /** Current status */
  status: 'initializing' | 'running' | 'waiting_input' | 'waiting_flow' | 'completed' | 'error' | 'loop_detected';
  /** Current node being executed */
  currentNodeId: string | null;
  /** Variables in context */
  variables: Record<string, any>;
  /** History of executed nodes */
  nodeHistory: string[];
  /** Loop detection statistics */
  loopStats: LoopDetectionStats;
  /** When execution started */
  startedAt: Date;
  /** When execution completed (if applicable) */
  completedAt?: Date;
  /** Completion reason */
  completionReason?: string;
}

/**
 * Options for starting a test execution
 */
export interface StartTestOptions {
  /** Initial variables to inject */
  initialVariables?: Record<string, any>;
  /** Loop detection configuration override */
  loopDetectionConfig?: Partial<LoopDetectionConfig>;
  /** Whether to emit WebSocket events */
  emitEvents?: boolean;
}

/**
 * Options for processing test response
 */
export interface ProcessTestResponseOptions {
  /** Button ID if user clicked a button */
  buttonId?: string;
  /** List row ID if user selected from list */
  listRowId?: string;
  /** Flow response data if completing a flow */
  flowResponse?: any;
}
