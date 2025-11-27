import React from 'react';
import type { ChatbotSession, SessionStatus } from '../../../types/sessions';

interface SessionCardProps {
  session: ChatbotSession;
  onClick: () => void;
}

const getStatusConfig = (status: SessionStatus) => {
  switch (status) {
    case 'running':
      return {
        label: 'Running',
        bgClass: 'bg-green-900/30',
        textClass: 'text-green-400',
        borderClass: 'border-green-500',
        dotClass: 'bg-green-500',
        headerClass: 'bg-gradient-to-br from-green-900/20 via-green-800/10 to-transparent',
        iconClass: 'text-green-500/30',
        animate: true,
      };
    case 'waiting_input':
      return {
        label: 'Waiting Input',
        bgClass: 'bg-yellow-900/30',
        textClass: 'text-yellow-400',
        borderClass: 'border-yellow-500',
        dotClass: 'bg-yellow-500',
        headerClass: 'bg-gradient-to-br from-yellow-900/20 via-yellow-800/10 to-transparent',
        iconClass: 'text-yellow-500/30',
        animate: false,
      };
    case 'waiting_flow':
      return {
        label: 'Waiting Flow',
        bgClass: 'bg-blue-900/30',
        textClass: 'text-blue-400',
        borderClass: 'border-blue-500',
        dotClass: 'bg-blue-500',
        headerClass: 'bg-gradient-to-br from-blue-900/20 via-blue-800/10 to-transparent',
        iconClass: 'text-blue-500/30',
        animate: false,
      };
    case 'completed':
      return {
        label: 'Completed',
        bgClass: 'bg-gray-900/30',
        textClass: 'text-gray-400',
        borderClass: 'border-gray-500',
        dotClass: 'bg-gray-500',
        headerClass: 'bg-gradient-to-br from-gray-900/20 via-gray-800/10 to-transparent',
        iconClass: 'text-gray-500/30',
        animate: false,
      };
    case 'expired':
      return {
        label: 'Expired',
        bgClass: 'bg-red-900/30',
        textClass: 'text-red-400',
        borderClass: 'border-red-500',
        dotClass: 'bg-red-500',
        headerClass: 'bg-gradient-to-br from-red-900/20 via-red-800/10 to-transparent',
        iconClass: 'text-red-500/30',
        animate: false,
      };
    case 'stopped':
      return {
        label: 'Stopped',
        bgClass: 'bg-orange-900/30',
        textClass: 'text-orange-400',
        borderClass: 'border-orange-500',
        dotClass: 'bg-orange-500',
        headerClass: 'bg-gradient-to-br from-orange-900/20 via-orange-800/10 to-transparent',
        iconClass: 'text-orange-500/30',
        animate: false,
      };
    default:
      return {
        label: 'Unknown',
        bgClass: 'bg-gray-900/30',
        textClass: 'text-gray-400',
        borderClass: 'border-gray-500',
        dotClass: 'bg-gray-500',
        headerClass: 'bg-gradient-to-br from-gray-900/20 via-gray-800/10 to-transparent',
        iconClass: 'text-gray-500/30',
        animate: false,
      };
  }
};

const formatDuration = (startedAt: string, completedAt: string | null) => {
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const duration = end - start;

  const minutes = Math.floor(duration / 60000);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
};

export const SessionCard: React.FC<SessionCardProps> = ({ session, onClick }) => {
  const statusConfig = getStatusConfig(session.status);

  return (
    <div
      onClick={onClick}
      className={`bg-surface rounded-2xl border overflow-hidden hover:shadow-2xl transition-all duration-300 group hover:scale-105 cursor-pointer ${
        session.isActive
          ? `border-l-4 ${statusConfig.borderClass} border-zinc-800`
          : 'border-zinc-800 opacity-75'
      }`}
    >
      {/* Header with gradient */}
      <div className={`h-24 ${statusConfig.headerClass} relative overflow-hidden`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`material-symbols-outlined text-5xl ${statusConfig.iconClass}`}>
            chat
          </span>
        </div>

        {/* Status Badge - Top Left */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 ${statusConfig.bgClass} ${statusConfig.textClass} rounded-full text-xs font-bold flex items-center gap-1`}>
            {statusConfig.animate && (
              <span className={`w-2 h-2 ${statusConfig.dotClass} rounded-full animate-pulse`}></span>
            )}
            {statusConfig.label}
          </span>
        </div>

        {/* Duration - Top Right */}
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 bg-zinc-800/80 backdrop-blur-sm text-zinc-300 rounded-full text-xs font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">schedule</span>
            {formatDuration(session.startedAt, session.completedAt)}
          </span>
        </div>
      </div>

      {/* Session Info */}
      <div className="p-6">
        {/* Customer Info */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-white mb-1 truncate">
            {session.customerName || 'Unknown Customer'}
          </h3>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="material-symbols-outlined text-base">phone</span>
            <span className="font-mono">{session.customerPhone}</span>
          </div>
        </div>

        {/* Chatbot Name */}
        <div className="mb-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="material-symbols-outlined text-base text-primary">smart_toy</span>
            <span className="font-medium">{session.chatbotName}</span>
          </div>
        </div>

        {/* Current Node */}
        <div className="mb-4">
          <div className="text-xs text-zinc-400 mb-1">Current Node</div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-blue-500">account_tree</span>
            <span className="text-sm font-medium text-white truncate">
              {session.currentNodeLabel || session.currentNodeId || 'N/A'}
            </span>
          </div>
        </div>

        {/* Stats Badges */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1 px-3 py-1 bg-blue-900/20 rounded-lg">
            <span className="material-symbols-outlined text-sm text-blue-400">account_tree</span>
            <span className="text-xs font-bold text-blue-100">{session.nodeCount}</span>
            <span className="text-xs text-blue-300">nodes</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 bg-purple-900/20 rounded-lg">
            <span className="material-symbols-outlined text-sm text-purple-400">chat_bubble</span>
            <span className="text-xs font-bold text-purple-100">{session.messageCount}</span>
            <span className="text-xs text-purple-300">msgs</span>
          </div>
        </div>

        {/* Timestamps */}
        <div className="space-y-1 text-xs text-zinc-400">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">schedule</span>
              Started
            </span>
            <span className="font-medium">{new Date(session.startedAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">update</span>
              Updated
            </span>
            <span className="font-medium">{new Date(session.updatedAt).toLocaleString()}</span>
          </div>
          {session.completedAt && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">check_circle</span>
                Completed
              </span>
              <span className="font-medium">{new Date(session.completedAt).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* View Details Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="w-full mt-4 px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-[#112217] rounded-lg font-medium transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">visibility</span>
          View Details
        </button>
      </div>
    </div>
  );
};
