/**
 * TesterPanelHeader Component
 *
 * Header component for the Tester Panel containing:
 * - Chatbot name
 * - Status badge
 * - Control buttons (Start/Pause/Resume, Stop, Reset)
 * - Close button
 */

import React, { useMemo, useState } from 'react';
import { useTesterContext } from '../../context';
import { useSessionManager } from './TesterPanel';
import type { TestSessionStatus } from '../../types/tester.types';

// ============================================================================
// Types
// ============================================================================

interface TesterPanelHeaderProps {
  chatbotName: string;
  onClose: () => void;
}

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  pulse?: boolean;
}

// ============================================================================
// Status Configuration
// ============================================================================

const STATUS_CONFIG: Record<TestSessionStatus, StatusConfig> = {
  idle: {
    label: 'Ready',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    icon: 'radio_button_unchecked',
  },
  connecting: {
    label: 'Connecting',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    icon: 'sync',
    pulse: true,
  },
  running: {
    label: 'Running',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    icon: 'play_circle',
    pulse: true,
  },
  waiting_input: {
    label: 'Waiting Input',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    icon: 'pending',
    pulse: true,
  },
  waiting_flow: {
    label: 'Waiting Flow',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    icon: 'dynamic_form',
    pulse: true,
  },
  paused: {
    label: 'Paused',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    icon: 'pause_circle',
  },
  completed: {
    label: 'Completed',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    icon: 'check_circle',
  },
  stopped: {
    label: 'Stopped',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    icon: 'stop_circle',
  },
  error: {
    label: 'Error',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: 'error',
  },
};

// ============================================================================
// Component
// ============================================================================

export const TesterPanelHeader: React.FC<TesterPanelHeaderProps> = ({
  chatbotName,
  onClose,
}) => {
  const { state, actions } = useTesterContext();
  const { startSession, stopSession, pauseSession, resumeSession } = useSessionManager();
  const { status } = state;
  const [isLoading, setIsLoading] = useState(false);

  // Get status configuration
  const statusConfig = useMemo(() => STATUS_CONFIG[status], [status]);

  // Handle start action
  const handleStart = async () => {
    setIsLoading(true);
    try {
      await startSession();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pause action
  const handlePause = async () => {
    setIsLoading(true);
    try {
      await pauseSession();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resume action
  const handleResume = async () => {
    setIsLoading(true);
    try {
      await resumeSession();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle stop action
  const handleStop = async () => {
    setIsLoading(true);
    try {
      await stopSession();
    } finally {
      setIsLoading(false);
    }
  };

  // Determine which primary action to show
  const primaryAction = useMemo(() => {
    switch (status) {
      case 'idle':
      case 'completed':
      case 'stopped':
      case 'error':
        return {
          action: handleStart,
          icon: 'play_arrow',
          label: 'Start',
          color: 'bg-[#25d366] hover:bg-[#22c55e] text-white',
        };
      case 'running':
      case 'waiting_input':
      case 'waiting_flow':
        return {
          action: handlePause,
          icon: 'pause',
          label: 'Pause',
          color: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30',
        };
      case 'paused':
        return {
          action: handleResume,
          icon: 'play_arrow',
          label: 'Resume',
          color: 'bg-[#25d366] hover:bg-[#22c55e] text-white',
        };
      default:
        return null;
    }
  }, [status]);

  // Can stop test?
  const canStop = useMemo(() => {
    return ['running', 'waiting_input', 'waiting_flow', 'paused'].includes(status);
  }, [status]);

  // Can reset?
  const canReset = useMemo(() => {
    return status !== 'idle';
  }, [status]);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-800/80 border-b border-gray-700/50 backdrop-blur-sm">
      {/* Left: Chatbot info */}
      <div className="flex items-center gap-3 min-w-0">
        {/* WhatsApp icon */}
        <div className="w-10 h-10 rounded-xl bg-[#25d366]/20 flex items-center justify-center flex-shrink-0 ring-1 ring-[#25d366]/30">
          <span className="material-symbols-outlined text-[#25d366] text-xl">
            smart_toy
          </span>
        </div>

        {/* Name and status */}
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-100 truncate text-sm">
            {chatbotName}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            {/* Status badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.color}`}
            >
              <span
                className={`material-symbols-outlined text-sm ${statusConfig.pulse ? 'animate-pulse' : ''}`}
              >
                {statusConfig.icon}
              </span>
              {statusConfig.label}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        {/* Primary action (Start/Pause/Resume) */}
        {primaryAction && (
          <button
            onClick={primaryAction.action}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 ${primaryAction.color}`}
            title={primaryAction.label}
          >
            <span className="material-symbols-outlined text-lg">
              {isLoading ? 'hourglass_empty' : primaryAction.icon}
            </span>
            <span className="hidden sm:inline">{primaryAction.label}</span>
          </button>
        )}

        {/* Stop button */}
        <button
          onClick={handleStop}
          disabled={!canStop || isLoading}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            canStop && !isLoading
              ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300'
              : 'text-gray-600 cursor-not-allowed'
          }`}
          title="Stop"
        >
          <span className="material-symbols-outlined text-xl">stop</span>
        </button>

        {/* Reset button */}
        <button
          onClick={actions.resetTest}
          disabled={!canReset || isLoading}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            canReset && !isLoading
              ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              : 'text-gray-600 cursor-not-allowed'
          }`}
          title="Reset"
        >
          <span className="material-symbols-outlined text-xl">refresh</span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-700 mx-1" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-all duration-200"
          title="Close"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>
    </div>
  );
};

export default TesterPanelHeader;
