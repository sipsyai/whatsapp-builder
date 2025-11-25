import { useState } from "react";
import {
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath,
    useReactFlow,
    type EdgeProps,
} from "@xyflow/react";

export const DeletableEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
}: EdgeProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const { setEdges } = useReactFlow();

    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const onEdgeDelete = (event: React.MouseEvent) => {
        event.stopPropagation();
        setEdges((edges) => edges.filter((edge) => edge.id !== id));
    };

    return (
        <>
            {/* Invisible wider path for easier hover interaction */}
            <path
                d={edgePath}
                fill="none"
                strokeWidth={20}
                stroke="transparent"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{ cursor: 'pointer' }}
            />
            {/* Visible edge with hover effect */}
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    stroke: isHovered ? '#ef4444' : (style.stroke || '#b1b1b7'),
                    strokeWidth: isHovered ? 3 : (style.strokeWidth || 2),
                    transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
                }}
            />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: "absolute",
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: "all",
                        opacity: isHovered ? 1 : 0.6,
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                    }}
                    className="nodrag nopan"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <button
                        onClick={onEdgeDelete}
                        className={`flex items-center justify-center w-5 h-5 rounded-full border shadow-sm transition-all duration-150 ${
                            isHovered
                                ? 'bg-red-500 border-red-500 scale-110'
                                : 'bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600'
                        }`}
                        title="Delete connection"
                    >
                        <span
                            className={`material-symbols-outlined ${isHovered ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'}`}
                            style={{ fontSize: '14px' }}
                        >
                            close
                        </span>
                    </button>
                </div>
            </EdgeLabelRenderer>
        </>
    );
};
