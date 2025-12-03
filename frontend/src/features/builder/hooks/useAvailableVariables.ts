import { useMemo } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { NodeDataType } from '@/shared/types';

interface VariableInfo {
  id: string;
  name: string;
  path: string;
  nodeId: string;
  nodeType: NodeDataType;
  nodeLabel: string;
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
}

interface NodeVariableGroup {
  nodeId: string;
  nodeType: NodeDataType;
  nodeLabel: string;
  color: string;
  icon: string;
  variables: VariableInfo[];
}

interface UseAvailableVariablesOptions {
  excludeNodeId?: string;
  filterTypes?: NodeDataType[];
}

export function useAvailableVariables(options: UseAvailableVariablesOptions = {}) {
  const { excludeNodeId, filterTypes } = options;
  const { getNodes } = useReactFlow();

  const nodeGroups = useMemo<NodeVariableGroup[]>(() => {
    const nodes = getNodes();
    const groups: NodeVariableGroup[] = [];

    // System variables grubu
    groups.push({
      nodeId: 'system',
      nodeType: 'start' as NodeDataType,
      nodeLabel: 'System',
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
          dataType: 'string',
          description: 'Customer phone number'
        }
      ]
    });

    nodes.forEach(node => {
      if (excludeNodeId && node.id === excludeNodeId) return;
      if (node.type === 'start') return;
      if (filterTypes && !filterTypes.includes(node.type as NodeDataType)) return;

      const variables = extractVariablesFromNode(node);
      if (variables.length === 0) return;

      groups.push({
        nodeId: node.id,
        nodeType: node.type as NodeDataType,
        nodeLabel: String(node.data?.label || node.type || 'Unknown'),
        color: getNodeColor(node.type as NodeDataType),
        icon: getNodeIcon(node.type as NodeDataType),
        variables
      });
    });

    return groups;
  }, [getNodes, excludeNodeId, filterTypes]);

  const allVariables = useMemo(() => {
    return nodeGroups.flatMap(group => group.variables);
  }, [nodeGroups]);

  const searchVariables = (query: string): VariableInfo[] => {
    const lowerQuery = query.toLowerCase();
    return allVariables.filter(v =>
      v.name.toLowerCase().includes(lowerQuery) ||
      v.nodeLabel.toLowerCase().includes(lowerQuery)
    );
  };

  return {
    nodeGroups,
    allVariables,
    searchVariables,
    isEmpty: nodeGroups.length <= 1 // Only system group
  };
}

function extractVariablesFromNode(node: any): VariableInfo[] {
  const variables: VariableInfo[] = [];
  const data = node.data || {};

  switch (node.type) {
    case 'question':
      if (data.variable) {
        variables.push({
          id: `${node.id}.${data.variable}`,
          name: data.variable,
          path: data.variable,
          nodeId: node.id,
          nodeType: 'question',
          nodeLabel: data.label || 'Question',
          dataType: 'string',
          description: 'User response'
        });
      }
      break;

    case 'rest_api':
      if (data.apiOutputVariable) {
        variables.push({
          id: `${node.id}.${data.apiOutputVariable}`,
          name: data.apiOutputVariable,
          path: data.apiOutputVariable,
          nodeId: node.id,
          nodeType: 'rest_api',
          nodeLabel: data.label || 'REST API',
          dataType: 'object',
          description: 'API response data'
        });
      }
      if (data.apiErrorVariable) {
        variables.push({
          id: `${node.id}.${data.apiErrorVariable}`,
          name: data.apiErrorVariable,
          path: data.apiErrorVariable,
          nodeId: node.id,
          nodeType: 'rest_api',
          nodeLabel: data.label || 'REST API',
          dataType: 'string',
          description: 'Error message'
        });
      }
      break;

    case 'google_calendar':
      if (data.calendarOutputVariable) {
        variables.push({
          id: `${node.id}.${data.calendarOutputVariable}`,
          name: data.calendarOutputVariable,
          path: data.calendarOutputVariable,
          nodeId: node.id,
          nodeType: 'google_calendar',
          nodeLabel: data.label || 'Calendar',
          dataType: 'array',
          description: 'Calendar events or slots'
        });
      }
      break;

    case 'whatsapp_flow':
      if (data.flowOutputVariable) {
        variables.push({
          id: `${node.id}.${data.flowOutputVariable}`,
          name: data.flowOutputVariable,
          path: data.flowOutputVariable,
          nodeId: node.id,
          nodeType: 'whatsapp_flow',
          nodeLabel: data.label || 'WhatsApp Flow',
          dataType: 'object',
          description: 'Flow response'
        });
      }
      break;
  }

  return variables;
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
