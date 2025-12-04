import {
    BaseEdge,
    EdgeLabelRenderer,
    getSmoothStepPath,
    type EdgeProps,
} from "@xyflow/react";

interface AnimatedTestEdgeData {
    isExecuted?: boolean;
    isAnimating?: boolean;
    executionOrder?: number;
    [key: string]: unknown;
}

interface AnimatedTestEdgeProps extends EdgeProps {
    data?: AnimatedTestEdgeData;
}

// SVG filter for glow effect
const GlowFilter = () => (
    <defs>
        <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
        <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
    </defs>
);

export const AnimatedTestEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
}: AnimatedTestEdgeProps) => {
    const isExecuted = data?.isExecuted ?? false;
    const isAnimating = data?.isAnimating ?? false;
    const executionOrder = data?.executionOrder;

    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 8,
    });

    // Determine edge styling based on state
    const getEdgeStyle = () => {
        if (isExecuted) {
            return {
                stroke: '#22c55e', // green-500
                strokeWidth: 2.5,
                strokeDasharray: 'none',
                filter: 'url(#glow-green)',
            };
        }
        if (isAnimating) {
            return {
                stroke: '#f59e0b', // amber-500
                strokeWidth: 2,
                strokeDasharray: 'none',
            };
        }
        // Pending state
        return {
            stroke: '#6b7280', // gray-500
            strokeWidth: 1.5,
            strokeDasharray: '5 5',
        };
    };

    const edgeStyle = getEdgeStyle();

    return (
        <>
            {/* SVG Filters Definition */}
            <GlowFilter />

            {/* Base edge with state-based styling */}
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    ...edgeStyle,
                    transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
                }}
            />

            {/* Animated particle when animating */}
            {isAnimating && (
                <g filter="url(#glow-amber)">
                    {/* Main particle */}
                    <circle r="5" fill="#f59e0b">
                        <animateMotion
                            dur="1s"
                            repeatCount="indefinite"
                            path={edgePath}
                        />
                    </circle>
                    {/* Inner glow particle */}
                    <circle r="3" fill="#fbbf24">
                        <animateMotion
                            dur="1s"
                            repeatCount="indefinite"
                            path={edgePath}
                        />
                    </circle>
                    {/* Trail particles */}
                    <circle r="3" fill="#f59e0b" opacity="0.6">
                        <animateMotion
                            dur="1s"
                            repeatCount="indefinite"
                            path={edgePath}
                            begin="-0.15s"
                        />
                    </circle>
                    <circle r="2" fill="#f59e0b" opacity="0.3">
                        <animateMotion
                            dur="1s"
                            repeatCount="indefinite"
                            path={edgePath}
                            begin="-0.3s"
                        />
                    </circle>
                </g>
            )}

            {/* Execution order badge */}
            {executionOrder !== undefined && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: "absolute",
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                            pointerEvents: "none",
                        }}
                        className="nodrag nopan"
                    >
                        <div
                            className={`
                                flex items-center justify-center
                                w-6 h-6 rounded-full
                                text-xs font-bold
                                shadow-md
                                transition-all duration-300
                                ${isExecuted
                                    ? 'bg-green-500 text-white border-2 border-green-400'
                                    : isAnimating
                                        ? 'bg-amber-500 text-white border-2 border-amber-400 animate-pulse'
                                        : 'bg-gray-600 text-gray-300 border-2 border-gray-500'
                                }
                            `}
                            style={{
                                boxShadow: isExecuted
                                    ? '0 0 8px rgba(34, 197, 94, 0.5)'
                                    : isAnimating
                                        ? '0 0 8px rgba(245, 158, 11, 0.5)'
                                        : 'none',
                            }}
                        >
                            {executionOrder}
                        </div>
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
};

export default AnimatedTestEdge;
