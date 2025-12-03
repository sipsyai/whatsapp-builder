export interface NodeOutputDefinition {
  name: string;
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
}

export const NODE_OUTPUT_SCHEMA: Record<string, NodeOutputDefinition[]> = {
  question: [
    { name: 'response', dataType: 'string', description: 'User response text' },
  ],
  rest_api: [
    { name: 'data', dataType: 'object', description: 'API response data' },
    { name: 'error', dataType: 'string', description: 'Error message if failed' },
    { name: 'status', dataType: 'number', description: 'HTTP status code' },
  ],
  whatsapp_flow: [
    { name: 'response', dataType: 'object', description: 'Flow form response' },
  ],
  google_calendar: [
    { name: 'result', dataType: 'array', description: 'Calendar events or slots' },
  ],
};

export function normalizeNodeType(nodeType: string): string {
  const typeMap: Record<string, string> = {
    question: 'question',
    rest_api: 'rest_api',
    whatsapp_flow: 'flow',
    google_calendar: 'calendar',
  };
  return typeMap[nodeType] || nodeType;
}

export function generateAutoVariableName(nodeType: string, index: number): string {
  const normalized = normalizeNodeType(nodeType);
  return `${normalized}_${index}`;
}

export function getFullVariablePath(nodeType: string, index: number, outputName: string): string {
  const baseName = generateAutoVariableName(nodeType, index);
  return `${baseName}.${outputName}`;
}

/**
 * Calculate the index of a node within its type based on execution history
 */
export function calculateNodeIndex(
  nodes: any[],
  nodeHistory: string[],
  currentNodeId: string,
  currentNodeType: string,
): number {
  let index = 0;

  // Count nodes of same type that were executed before this one
  for (const historyNodeId of nodeHistory) {
    const historyNode = nodes.find((n) => n.id === historyNodeId);
    if (historyNode) {
      const historyNodeType = historyNode.data?.type || historyNode.type;
      if (historyNodeType === currentNodeType) {
        index++;
      }
    }
  }

  // Add 1 for current node (1-indexed)
  return index + 1;
}
