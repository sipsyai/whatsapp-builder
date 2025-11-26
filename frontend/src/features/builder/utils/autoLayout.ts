import Dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';

export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL';

interface LayoutOptions {
    direction?: LayoutDirection;
    nodeWidth?: number;
    nodeHeight?: number;
    rankSeparation?: number;
    nodeSeparation?: number;
}

const DEFAULT_NODE_WIDTH = 280;
const DEFAULT_NODE_HEIGHT = 80;

/**
 * Applies automatic layout to nodes using Dagre algorithm
 * @param nodes - ReactFlow nodes array
 * @param edges - ReactFlow edges array
 * @param options - Layout configuration options
 * @returns Layouted nodes with updated positions
 */
export const getLayoutedElements = (
    nodes: Node[],
    edges: Edge[],
    options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } => {
    const {
        direction = 'TB',
        nodeWidth = DEFAULT_NODE_WIDTH,
        nodeHeight = DEFAULT_NODE_HEIGHT,
        rankSeparation = 100,
        nodeSeparation = 50,
    } = options;

    const dagreGraph = new Dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({
        rankdir: direction,
        ranksep: rankSeparation,
        nodesep: nodeSeparation,
        marginx: 50,
        marginy: 50,
    });

    // Add nodes to dagre graph
    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, {
            width: nodeWidth,
            height: nodeHeight
        });
    });

    // Add edges to dagre graph
    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    // Run the layout algorithm
    Dagre.layout(dagreGraph);

    // Apply calculated positions to nodes
    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        // Center the node on the calculated position
        const x = nodeWithPosition.x - nodeWidth / 2;
        const y = nodeWithPosition.y - nodeHeight / 2;

        return {
            ...node,
            position: { x, y },
        };
    });

    return { nodes: layoutedNodes, edges };
};

/**
 * Direction labels for UI
 */
export const LAYOUT_DIRECTIONS: { value: LayoutDirection; label: string; icon: string }[] = [
    { value: 'TB', label: 'Top to Bottom', icon: 'arrow_downward' },
    { value: 'LR', label: 'Left to Right', icon: 'arrow_forward' },
    { value: 'BT', label: 'Bottom to Top', icon: 'arrow_upward' },
    { value: 'RL', label: 'Right to Left', icon: 'arrow_back' },
];
