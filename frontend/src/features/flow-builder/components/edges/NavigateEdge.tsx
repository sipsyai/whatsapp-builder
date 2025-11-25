import { memo, useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow, type EdgeProps } from '@xyflow/react';
import type { NavigationEdgeData } from '../../types';

export const NavigateEdge = memo((props: EdgeProps) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    selected,
    markerEnd,
  } = props;

  // Cast data to NavigationEdgeData
  const data = props.data as NavigationEdgeData | undefined;

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

  // Determine color based on action type
  const getActionColor = () => {
    if (!data?.action) return '#71717a'; // default zinc-500

    switch (data.action.name) {
      case 'navigate':
        return '#3b82f6'; // blue-500
      case 'complete':
        return '#22c55e'; // green-500
      case 'data_exchange':
        return '#8b5cf6'; // purple-500
      default:
        return '#71717a'; // zinc-500
    }
  };

  const actionColor = data?.color || getActionColor();
  const edgeColor = isHovered
    ? '#ef4444' // red-500 on hover
    : selected
    ? '#65C997' // primary color on select
    : actionColor;

  const onEdgeDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  // Extract label from data
  const label = data?.label || data?.action?.name;

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

      {/* Visible animated dashed edge with hover effect */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: isHovered ? 3 : selected ? 3 : 2,
          strokeDasharray: '5,5',
          opacity: data?.animated ? 0.7 : 1,
          transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
        }}
        markerEnd={markerEnd || `url(#arrow-${selected ? 'selected' : isHovered ? 'hover' : 'default'})`}
      />

      {/* Edge Label and Delete Button */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}
            className="nodrag nopan"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Action label */}
            <div
              className={`
                px-2 py-1 text-xs font-medium rounded shadow-md transition-all duration-150
                ${
                  selected
                    ? 'bg-primary text-[#112217] ring-2 ring-primary/30'
                    : isHovered
                    ? 'bg-red-500 text-white scale-105'
                    : 'text-white border border-zinc-200 dark:border-white/10'
                }
              `}
              style={
                !selected && !isHovered
                  ? { backgroundColor: actionColor, color: 'white' }
                  : undefined
              }
            >
              {label}
            </div>

            {/* Delete button */}
            <button
              onClick={onEdgeDelete}
              className={`
                flex items-center justify-center w-5 h-5 rounded-full border shadow-sm transition-all duration-150
                ${
                  isHovered
                    ? 'bg-red-500 border-red-500 scale-110 opacity-100'
                    : 'bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 opacity-0'
                }
              `}
              title="Delete connection"
              style={{
                pointerEvents: isHovered ? 'all' : 'none',
              }}
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
      )}

      {/* Arrow markers */}
      <defs>
        <marker
          id="arrow-default"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill={actionColor}
          />
        </marker>
        <marker
          id="arrow-selected"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill="#65C997"
          />
        </marker>
        <marker
          id="arrow-hover"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill="#ef4444"
          />
        </marker>
      </defs>
    </>
  );
});

NavigateEdge.displayName = 'NavigateEdge';
