import type { NodeDataType } from '@/shared/types';

export interface VariableInfo {
  id: string;                    // Unique identifier (nodeId.varName)
  name: string;                  // Variable name (e.g., "user_name")
  path: string;                  // Full path for nested (e.g., "api_result.data")
  nodeId: string;                // Source node ID
  nodeType: NodeDataType;        // Node type
  nodeLabel: string;             // User-visible node label
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;          // Optional description
}

export interface NodeVariableGroup {
  nodeId: string;
  nodeType: NodeDataType;
  nodeLabel: string;
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
