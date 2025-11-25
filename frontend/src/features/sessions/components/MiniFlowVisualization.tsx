import { useEffect } from 'react';
import {
    ReactFlow,
    useNodesState,
    useEdgesState,
    Background,
    ReactFlowProvider,
    useReactFlow,
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import type { NodeData, NodeDataType } from '../../../shared/types';

interface MiniFlowVisualizationProps {
    nodes: Node[];
    edges: Edge[];
    executedNodeIds: string[];
    currentNodeId: string;
}

// Simple custom node component for mini visualization
const MiniNode = ({ data }: { data: NodeData & { isExecuted?: boolean; isCurrent?: boolean } }) => {
    const nodeType = data.type || 'start';

    // Icon mapping
    const getIcon = (type: NodeDataType) => {
        switch (type) {
            case 'start':
                return 'play_arrow';
            case 'message':
                return 'chat';
            case 'question':
                return 'help';
            case 'condition':
                return 'call_split';
            case 'whatsapp_flow':
                return 'description';
            default:
                return 'circle';
        }
    };

    // Color mapping
    const getColor = (type: NodeDataType) => {
        switch (type) {
            case 'start':
                return 'bg-primary text-[#112217]';
            case 'message':
                return 'bg-blue-500 text-white';
            case 'question':
                return 'bg-orange-500 text-white';
            case 'condition':
                return 'bg-purple-500 text-white';
            case 'whatsapp_flow':
                return 'bg-green-600 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };

    const baseClasses = `
        rounded-lg shadow-md border transition-all
        ${data.isExecuted ? 'border-green-500 border-2' : 'border-gray-300 dark:border-gray-600'}
        ${data.isCurrent ? 'animate-pulse-glow' : ''}
        ${!data.isExecuted ? 'opacity-50' : 'opacity-100'}
        bg-background-light dark:bg-background-dark
    `;

    return (
        <div className={baseClasses} style={{ width: 120, minHeight: 50 }}>
            <div className="flex items-center gap-2 p-2">
                <div className={`${getColor(nodeType)} flex items-center justify-center rounded size-6 flex-shrink-0`}>
                    <span className="material-symbols-outlined text-sm">{getIcon(nodeType)}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                        {data.label}
                    </p>
                </div>
            </div>
        </div>
    );
};

const nodeTypes = {
    start: MiniNode,
    message: MiniNode,
    question: MiniNode,
    condition: MiniNode,
    whatsapp_flow: MiniNode,
};

// Inner component that uses ReactFlow hooks
const MiniFlowInner = ({
    nodes: initialNodes,
    edges: initialEdges,
    executedNodeIds,
    currentNodeId,
}: MiniFlowVisualizationProps) => {
    const { fitView } = useReactFlow();

    // Enhance nodes with execution state
    const enhancedNodes = initialNodes.map((node) => ({
        ...node,
        data: {
            ...node.data,
            isExecuted: executedNodeIds.includes(node.id),
            isCurrent: node.id === currentNodeId,
        },
        draggable: false,
        selectable: false,
        connectable: false,
    }));

    // Enhance edges with execution state
    const enhancedEdges = initialEdges.map((edge) => {
        const isExecuted =
            executedNodeIds.includes(edge.source) &&
            executedNodeIds.includes(edge.target);

        return {
            ...edge,
            animated: false,
            style: {
                stroke: isExecuted ? '#22c55e' : '#9ca3af',
                strokeWidth: isExecuted ? 2 : 1,
                strokeDasharray: isExecuted ? '0' : '5,5',
            },
        };
    });

    const [nodes, , onNodesChange] = useNodesState(enhancedNodes);
    const [edges, , onEdgesChange] = useEdgesState(enhancedEdges);

    // Fit view on mount and when nodes change
    useEffect(() => {
        setTimeout(() => {
            fitView({ padding: 0.2, duration: 200 });
        }, 50);
    }, [fitView, initialNodes.length]);

    return (
        <div className="w-full h-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                panOnScroll={false}
                zoomOnScroll={false}
                zoomOnPinch={false}
                zoomOnDoubleClick={false}
                preventScrolling={false}
                panOnDrag={false}
                minZoom={0.5}
                maxZoom={1.5}
                fitView
                className="bg-zinc-50 dark:bg-[#0a160e]"
            >
                <Background color="#666" gap={16} size={0.5} />
            </ReactFlow>
        </div>
    );
};

export const MiniFlowVisualization = (props: MiniFlowVisualizationProps) => {
    return (
        <ReactFlowProvider>
            <MiniFlowInner {...props} />
        </ReactFlowProvider>
    );
};
