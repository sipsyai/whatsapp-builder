import React, { useCallback, useMemo } from 'react';
import { MiniMap, type Node } from '@xyflow/react';

export interface ExecutionState {
  currentNodeId: string | null;
  executedNodeIds: string[];
  totalNodes: number;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
}

export interface TestProgressMiniMapProps {
  executionState: ExecutionState;
}

// Status configuration for display
const statusConfig: Record<ExecutionState['status'], { label: string; color: string; icon: string }> = {
  idle: { label: 'Ready', color: 'bg-zinc-500', icon: 'radio_button_unchecked' },
  running: { label: 'Running', color: 'bg-amber-500', icon: 'play_circle' },
  paused: { label: 'Paused', color: 'bg-blue-500', icon: 'pause_circle' },
  completed: { label: 'Completed', color: 'bg-green-500', icon: 'check_circle' },
  error: { label: 'Error', color: 'bg-red-500', icon: 'error' },
};

export const TestProgressMiniMap: React.FC<TestProgressMiniMapProps> = ({
  executionState,
}) => {
  const { currentNodeId, executedNodeIds, totalNodes, status } = executionState;

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (totalNodes === 0) return 0;
    return Math.round((executedNodeIds.length / totalNodes) * 100);
  }, [executedNodeIds.length, totalNodes]);

  // Node color callback based on execution state
  const nodeColor = useCallback(
    (node: Node): string => {
      // Current node - amber/yellow (executing)
      if (node.id === currentNodeId) {
        return '#f59e0b'; // amber-500
      }
      // Executed nodes - green (completed)
      if (executedNodeIds.includes(node.id)) {
        return '#22c55e'; // green-500
      }
      // Pending nodes - gray (not yet executed)
      return '#52525b'; // zinc-600
    },
    [currentNodeId, executedNodeIds]
  );

  // Node stroke color for better visibility
  const nodeStrokeColor = useCallback(
    (node: Node): string => {
      if (node.id === currentNodeId) {
        return '#fbbf24'; // amber-400
      }
      if (executedNodeIds.includes(node.id)) {
        return '#4ade80'; // green-400
      }
      return '#3f3f46'; // zinc-700
    },
    [currentNodeId, executedNodeIds]
  );

  const statusInfo = statusConfig[status];

  return (
    <div className="relative">
      {/* MiniMap with custom node colors */}
      <MiniMap
        nodeColor={nodeColor}
        nodeStrokeColor={nodeStrokeColor}
        nodeStrokeWidth={2}
        nodeBorderRadius={4}
        maskColor="rgba(17, 34, 23, 0.8)"
        bgColor="#0a160e"
        style={{
          backgroundColor: '#0a160e',
          border: '1px solid #23482f',
          borderRadius: '8px',
        }}
        className="!bg-[#0a160e]"
        pannable
        zoomable
      />

      {/* Progress Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#112217]/95 backdrop-blur-sm border-t border-[#23482f] rounded-b-lg p-2">
        {/* Status Indicator */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className={`material-symbols-outlined text-sm ${
              status === 'running' ? 'animate-pulse text-amber-500' :
              status === 'completed' ? 'text-green-500' :
              status === 'error' ? 'text-red-500' :
              status === 'paused' ? 'text-blue-500' :
              'text-zinc-500'
            }`}>
              {statusInfo.icon}
            </span>
            <span className="text-xs font-medium text-zinc-300">
              {statusInfo.label}
            </span>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {executedNodeIds.length}/{totalNodes}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out ${
              status === 'running' ? 'bg-amber-500' :
              status === 'completed' ? 'bg-green-500' :
              status === 'error' ? 'bg-red-500' :
              status === 'paused' ? 'bg-blue-500' :
              'bg-zinc-600'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
          {/* Animated pulse for running state */}
          {status === 'running' && (
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-amber-400/50 animate-pulse"
              style={{ width: `${progressPercentage}%` }}
            />
          )}
        </div>

        {/* Progress Percentage */}
        <div className="flex justify-end mt-1">
          <span className="text-[10px] font-mono text-zinc-500">
            {progressPercentage}%
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-2 right-2 bg-[#112217]/90 backdrop-blur-sm border border-[#23482f] rounded-md p-1.5 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm bg-amber-500" />
          <span className="text-[9px] text-zinc-400">Current</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm bg-green-500" />
          <span className="text-[9px] text-zinc-400">Executed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm bg-zinc-600" />
          <span className="text-[9px] text-zinc-400">Pending</span>
        </div>
      </div>
    </div>
  );
};

export default TestProgressMiniMap;
