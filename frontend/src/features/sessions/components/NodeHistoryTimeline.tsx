import { useEffect, useRef } from 'react';
import { MiniFlowVisualization } from './MiniFlowVisualization';
import type { Node, Edge } from '@xyflow/react';
import type { NodeDataType } from '../../../shared/types';

interface NodeHistoryTimelineProps {
    nodeHistory: string[];
    flowData: { nodes: Node[]; edges: Edge[] };
    currentNodeId: string;
    isActive: boolean;
}

export const NodeHistoryTimeline = ({
    nodeHistory,
    flowData,
    currentNodeId,
    isActive,
}: NodeHistoryTimelineProps) => {
    const currentNodeRef = useRef<HTMLDivElement>(null);

    // Icon mapping for timeline
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

    // Color mapping for timeline
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

    // Scroll to current node when it changes
    useEffect(() => {
        if (currentNodeRef.current) {
            currentNodeRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [currentNodeId]);

    // Get node details from flow data
    const getNodeDetails = (nodeId: string): { label: string; type: NodeDataType } => {
        const node = flowData.nodes.find((n) => n.id === nodeId);
        if (!node) {
            return { label: 'Unknown', type: 'start' };
        }
        return {
            label: String(node.data?.label || 'Unknown'),
            type: (node.type as NodeDataType) || 'start',
        };
    };

    // Get executed nodes (all nodes in history)
    const executedNodeIds = nodeHistory;

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Top Half: Mini Flow Visualization */}
            <div className="h-1/2 border-b-2 border-border-[#23482f]">
                <MiniFlowVisualization
                    nodes={flowData.nodes}
                    edges={flowData.edges}
                    executedNodeIds={executedNodeIds}
                    currentNodeId={currentNodeId}
                />
            </div>

            {/* Bottom Half: Timeline List */}
            <div className="h-1/2 overflow-y-auto p-6">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-200">
                    <span className="material-symbols-outlined text-primary text-xl">timeline</span>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Execution Timeline
                    </h3>
                    {isActive && (
                        <span className="ml-auto text-xs bg-green-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                            Active
                        </span>
                    )}
                </div>

                {nodeHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <span className="material-symbols-outlined text-zinc-400 text-4xl mb-2">
                            hourglass_empty
                        </span>
                        <p className="text-sm text-zinc-400">
                            No nodes executed yet
                        </p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Vertical connecting line */}
                        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-green-500 to-transparent"></div>

                        {/* Timeline items */}
                        <div className="space-y-4">
                            {nodeHistory.map((nodeId, index) => {
                                const { label, type } = getNodeDetails(nodeId);
                                const isCurrent = nodeId === currentNodeId;
                                const isCompleted = index < nodeHistory.length - 1;

                                return (
                                    <div
                                        key={`${nodeId}-${index}`}
                                        ref={isCurrent ? currentNodeRef : null}
                                        className={`
                                            relative flex items-start gap-3 pl-0 transition-all
                                            ${isCurrent ? 'scale-105' : 'scale-100'}
                                        `}
                                    >
                                        {/* Icon Circle */}
                                        <div className="relative z-10">
                                            <div
                                                className={`
                                                    ${getColor(type)}
                                                    size-10 rounded-full flex items-center justify-center
                                                    shadow-lg
                                                    ${isCurrent ? 'ring-4 ring-primary/30 animate-pulse-ring' : ''}
                                                `}
                                            >
                                                <span className="material-symbols-outlined text-lg">
                                                    {getIcon(type)}
                                                </span>
                                            </div>
                                            {/* Pulsing dot for current node */}
                                            {isCurrent && (
                                                <div className="absolute -top-1 -right-1 size-3 bg-primary rounded-full animate-ping"></div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 pt-1">
                                            <div className="flex items-center gap-2">
                                                <p className={`font-semibold truncate ${isCurrent ? 'text-primary text-base' : 'text-white text-sm'}`}>
                                                    {label}
                                                </p>
                                                {isCurrent && (
                                                    <span className="text-xs bg-primary text-[#112217] px-2 py-0.5 rounded-full font-bold animate-pulse">
                                                        Current
                                                    </span>
                                                )}
                                                {isCompleted && !isCurrent && (
                                                    <span className="material-symbols-outlined text-green-500 text-sm">
                                                        check_circle
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-zinc-400 capitalize">
                                                {type.replace('_', ' ')}
                                            </p>
                                            <p className="text-xs text-zinc-400 mt-0.5">
                                                Step {index + 1} of {nodeHistory.length}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
