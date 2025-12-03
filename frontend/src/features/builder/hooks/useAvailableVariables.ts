import { useMemo } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { NodeDataType } from '@/shared/types';
import {
  generateAutoVariableName,
  getNodeOutputs,
  getFullVariablePath,
  type NodeOutputDefinition
} from '../utils/autoVariableNaming';

interface VariableInfo {
  id: string;
  name: string;
  path: string;
  nodeId: string;
  nodeType: NodeDataType;
  nodeLabel: string;
  nodeIndex: number;
  autoVariableName: string;
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
}

interface NodeVariableGroup {
  nodeId: string;
  nodeType: NodeDataType;
  nodeLabel: string;
  nodeIndex: number;
  autoVariableName: string;
  color: string;
  icon: string;
  variables: VariableInfo[];
}

interface UseAvailableVariablesOptions {
  excludeNodeId?: string;
  filterTypes?: NodeDataType[];
}

// Topological sort for node ordering based on flow connections
function topologicalSort(nodes: any[], edges: any[]): string[] {
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize
  nodes.forEach(node => {
    graph.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  // Build graph from edges
  edges.forEach(edge => {
    const neighbors = graph.get(edge.source);
    if (neighbors) {
      neighbors.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }
  });

  // Kahn's algorithm
  const queue: string[] = [];
  const result: string[] = [];

  // Start with nodes that have no incoming edges
  nodes.forEach(node => {
    if (inDegree.get(node.id) === 0) {
      queue.push(node.id);
    }
  });

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    result.push(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  return result;
}

// Calculate node index by type in topological order
function calculateNodeIndices(
  nodes: any[],
  sortedNodeIds: string[]
): Map<string, number> {
  const typeCounters = new Map<string, number>();
  const nodeIndices = new Map<string, number>();

  for (const nodeId of sortedNodeIds) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) continue;

    const nodeType = node.type as string;
    const currentCount = typeCounters.get(nodeType) || 0;
    const newIndex = currentCount + 1;
    typeCounters.set(nodeType, newIndex);
    nodeIndices.set(nodeId, newIndex);
  }

  return nodeIndices;
}

export function useAvailableVariables(options: UseAvailableVariablesOptions = {}) {
  const { excludeNodeId, filterTypes } = options;
  const { getNodes, getEdges } = useReactFlow();

  const nodeGroups = useMemo<NodeVariableGroup[]>(() => {
    const nodes = getNodes();
    const edges = getEdges();
    const groups: NodeVariableGroup[] = [];

    // Topological sort for flow order
    const sortedNodeIds = topologicalSort(nodes, edges);
    const nodeIndices = calculateNodeIndices(nodes, sortedNodeIds);

    // System variables grubu
    groups.push({
      nodeId: 'system',
      nodeType: 'start' as NodeDataType,
      nodeLabel: 'System',
      nodeIndex: 0,
      autoVariableName: 'system',
      color: 'text-gray-400',
      icon: 'settings',
      variables: [
        {
          id: 'system.customer_phone',
          name: 'customer_phone',
          path: 'customer_phone',
          nodeId: 'system',
          nodeType: 'start' as NodeDataType,
          nodeLabel: 'System',
          nodeIndex: 0,
          autoVariableName: 'system',
          dataType: 'string',
          description: 'Customer phone number'
        }
      ]
    });

    // Process nodes in topological order
    for (const nodeId of sortedNodeIds) {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;
      if (excludeNodeId && node.id === excludeNodeId) continue;
      if (node.type === 'start') continue;
      if (filterTypes && !filterTypes.includes(node.type as NodeDataType)) continue;

      const nodeType = node.type as string;
      const nodeIndex = nodeIndices.get(nodeId) || 1;
      const autoVariableName = generateAutoVariableName(nodeType, nodeIndex);
      const outputs = getNodeOutputs(nodeType);

      if (outputs.length === 0) continue;

      const variables = extractAutoVariables(
        node,
        nodeIndex,
        autoVariableName,
        outputs
      );

      groups.push({
        nodeId: node.id,
        nodeType: node.type as NodeDataType,
        nodeLabel: String(node.data?.label || node.type || 'Unknown'),
        nodeIndex,
        autoVariableName,
        color: getNodeColor(node.type as NodeDataType),
        icon: getNodeIcon(node.type as NodeDataType),
        variables
      });
    }

    return groups;
  }, [getNodes, getEdges, excludeNodeId, filterTypes]);

  const allVariables = useMemo(() => {
    return nodeGroups.flatMap(group => group.variables);
  }, [nodeGroups]);

  const searchVariables = (query: string): VariableInfo[] => {
    const lowerQuery = query.toLowerCase();
    return allVariables.filter(v =>
      v.name.toLowerCase().includes(lowerQuery) ||
      v.path.toLowerCase().includes(lowerQuery) ||
      v.nodeLabel.toLowerCase().includes(lowerQuery) ||
      v.autoVariableName.toLowerCase().includes(lowerQuery)
    );
  };

  // Get auto variable info for a specific node
  const getNodeAutoVariable = (nodeId: string) => {
    const group = nodeGroups.find(g => g.nodeId === nodeId);
    if (!group) return null;
    return {
      autoVariableName: group.autoVariableName,
      nodeIndex: group.nodeIndex,
      outputs: group.variables
    };
  };

  return {
    nodeGroups,
    allVariables,
    searchVariables,
    getNodeAutoVariable,
    isEmpty: nodeGroups.length <= 1 // Only system group
  };
}

function extractAutoVariables(
  node: any,
  nodeIndex: number,
  autoVariableName: string,
  outputs: NodeOutputDefinition[]
): VariableInfo[] {
  const data = node.data || {};
  const nodeType = node.type as NodeDataType;
  const nodeLabel = String(data.label || node.type || 'Unknown');

  return outputs.map(output => {
    const fullPath = getFullVariablePath(nodeType, nodeIndex, output.name);
    return {
      id: `${node.id}.${output.name}`,
      name: output.name,
      path: fullPath,
      nodeId: node.id,
      nodeType,
      nodeLabel,
      nodeIndex,
      autoVariableName,
      dataType: output.dataType,
      description: output.description
    };
  });
}

function getNodeColor(type: NodeDataType): string {
  const colors: Record<string, string> = {
    start: 'text-gray-400',
    message: 'text-blue-400',
    question: 'text-orange-400',
    condition: 'text-purple-400',
    whatsapp_flow: 'text-green-400',
    rest_api: 'text-cyan-400',
    google_calendar: 'text-emerald-400'
  };
  return colors[type] || 'text-gray-400';
}

function getNodeIcon(type: NodeDataType): string {
  const icons: Record<string, string> = {
    start: 'play_arrow',
    message: 'chat',
    question: 'help',
    condition: 'call_split',
    whatsapp_flow: 'check_box',
    rest_api: 'api',
    google_calendar: 'calendar_month'
  };
  return icons[type] || 'circle';
}
