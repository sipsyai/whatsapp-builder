import type { NodeDataType } from '@/shared/types';

export interface VariableInfo {
  id: string;                    // Unique identifier (nodeId.varName)
  name: string;                  // Output name (e.g., "response", "data")
  path: string;                  // Full auto path (e.g., "question_1.response")
  nodeId: string;                // Source node ID
  nodeType: NodeDataType;        // Node type
  nodeLabel: string;             // User-visible node label
  nodeIndex: number;             // Index of node by type in flow order
  autoVariableName: string;      // Auto-generated variable name (e.g., "question_1")
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;          // Optional description
}

export interface NodeVariableGroup {
  nodeId: string;
  nodeType: NodeDataType;
  nodeLabel: string;
  nodeIndex: number;             // Index of node by type in flow order
  autoVariableName: string;      // Auto-generated variable name (e.g., "question_1")
  color: string;                 // Tailwind color class
  icon: string;                  // Material icon name
  variables: VariableInfo[];
}

export interface VariablePickerProps {
  onSelect: (variable: VariableInfo) => void;
  onClose: () => void;
  currentNodeId?: string;        // Exclude self from list
  filterTypes?: NodeDataType[];  // Filter by node types
}

export interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  currentNodeId?: string;
  multiline?: boolean;
  rows?: number;
}
