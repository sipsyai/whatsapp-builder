import React, { useEffect, useState, useMemo } from 'react';
import { SessionsService } from '../../../api/sessions.service';
import { getChatBots } from '../../chatbots/api';
import { useSessionSocket } from '../../../hooks/useSessionSocket';
import { SessionCard } from './SessionCard';
import type { ChatbotSession, PaginatedSessions } from '../../../types/sessions';
import type { ChatBot } from '../../chatbots/api';

interface SessionsListPageProps {
  onViewSession: (sessionId: string) => void;
}

type TabType = 'active' | 'completed';

export const SessionsListPage: React.FC<SessionsListPageProps> = ({ onViewSession }) => {
  const [sessions, setSessions] = useState<ChatbotSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<TabType>('active');
  const [selectedChatbotId, setSelectedChatbotId] = useState<string>('all');
  const [chatbots, setChatbots] = useState<ChatBot[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalSessions, setTotalSessions] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // WebSocket for real-time updates
  const {
    connected,
    activeSessions,
    sessionStarted,
    sessionStatusChanged,
    sessionCompleted,
    subscribeToSessions
  } = useSessionSocket();

  // Subscribe to session updates when connected
  useEffect(() => {
    if (connected) {
      subscribeToSessions();
    }
  }, [connected, subscribeToSessions]);

  // Load initial sessions
  useEffect(() => {
    loadSessions();
  }, [currentTab, selectedChatbotId, currentPage]);

  // Load chatbots for filter dropdown
  useEffect(() => {
    loadChatbots();
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Real-time session updates
  useEffect(() => {
    if (sessionStarted) {
      setToast({
        message: `New session started: ${sessionStarted.customerName || sessionStarted.customerPhone}`,
        type: 'success',
      });
      if (currentTab === 'active') {
        loadSessions();
      }
    }
  }, [sessionStarted, currentTab]);

  useEffect(() => {
    if (sessionStatusChanged) {
      // Reload if status changed to completed and we're on completed tab
      if (['completed', 'expired', 'stopped'].includes(sessionStatusChanged.newStatus) && currentTab === 'completed') {
        loadSessions();
      }
    }
  }, [sessionStatusChanged, currentTab]);

  useEffect(() => {
    if (sessionCompleted) {
      setToast({
        message: 'Session completed',
        type: 'success',
      });
      if (currentTab === 'completed') {
        loadSessions();
      } else {
        loadSessions(); // Refresh to remove from active
      }
    }
  }, [sessionCompleted, currentTab]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data: PaginatedSessions = await SessionsService.getSessions({
        status: currentTab === 'active' ? 'active' : 'completed',
        chatbotId: selectedChatbotId === 'all' ? undefined : selectedChatbotId,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        sortBy: 'startedAt',
        sortOrder: 'DESC',
      });

      setSessions(data.data || []);
      setTotalSessions(data.total);
      setHasNext(data.hasNext);
      setError(null);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError('Failed to load sessions. Please try again.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadChatbots = async () => {
    try {
      const data = await getChatBots({ status: 'active' });
      setChatbots(data || []);
    } catch (err) {
      console.error('Failed to load chatbots:', err);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const activeCount = Array.from(activeSessions.values()).filter(s => s.isActive).length;

    // Completed today count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedTodayCount = sessions.filter(s => {
      if (!s.completedAt) return false;
      const completedDate = new Date(s.completedAt);
      return completedDate >= today && s.status === 'completed';
    }).length;

    return {
      active: activeCount,
      completedToday: currentTab === 'completed' ? completedTodayCount : 0,
      total: totalSessions,
    };
  }, [activeSessions, sessions, totalSessions, currentTab]);

  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-zinc-500 dark:text-zinc-400">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background-light dark:bg-background-dark overflow-y-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-slideIn ${
            toast.type === 'success'
              ? 'bg-green-100 border border-green-400 text-green-800'
              : 'bg-red-100 border border-red-400 text-red-800'
          }`}>
            <span className="material-symbols-outlined">
              {toast.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span className="font-medium">{toast.message}</span>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">Chatbot Sessions</h1>
              <p className="text-zinc-500 dark:text-zinc-400">Monitor and track active chatbot conversations</p>
              {connected && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">Live Updates Active</span>
                </div>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setCurrentTab('active');
                setCurrentPage(1);
              }}
              className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                currentTab === 'active'
                  ? 'bg-primary text-[#112217] shadow-lg'
                  : 'bg-white dark:bg-surface-dark text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="material-symbols-outlined">play_circle</span>
              Active Sessions
              {stats.active > 0 && (
                <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-bold">
                  {stats.active}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setCurrentTab('completed');
                setCurrentPage(1);
              }}
              className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                currentTab === 'completed'
                  ? 'bg-primary text-[#112217] shadow-lg'
                  : 'bg-white dark:bg-surface-dark text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="material-symbols-outlined">check_circle</span>
              Completed Sessions
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500 rounded-lg">
                  <span className="material-symbols-outlined text-white">play_circle</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.active}</p>
                  <p className="text-sm text-green-700 dark:text-green-300">Active Sessions</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <span className="material-symbols-outlined text-white">today</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.completedToday}</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Completed Today</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500 rounded-lg">
                  <span className="material-symbols-outlined text-white">chat</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.total}</p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">Total Sessions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter by Chatbot */}
          <div className="relative">
            <select
              value={selectedChatbotId}
              onChange={(e) => {
                setSelectedChatbotId(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none w-full sm:w-64 pl-12 pr-10 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-surface-dark text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer"
            >
              <option value="all">All Chatbots</option>
              {chatbots.map((chatbot) => (
                <option key={chatbot.id} value={chatbot.id}>
                  {chatbot.name}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
              smart_toy
            </span>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
              expand_more
            </span>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6 relative flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Empty State */}
        {sessions.length === 0 && !loading ? (
          <div className="text-center py-20 bg-white dark:bg-surface-dark rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700">
            <div className="inline-block p-6 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-6">
              <span className="material-symbols-outlined text-6xl text-zinc-400 dark:text-zinc-500">
                {currentTab === 'active' ? 'play_circle' : 'check_circle'}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
              No {currentTab} sessions
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-md mx-auto">
              {currentTab === 'active'
                ? 'There are no active chatbot sessions at the moment. Sessions will appear here when customers interact with your chatbots.'
                : 'No completed sessions found. Completed sessions will appear here once customers finish their conversations.'}
            </p>
          </div>
        ) : (
          <div>
            {/* Sessions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onClick={() => onViewSession(session.id)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-6 py-3 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
                Previous
              </button>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Page {currentPage} • {sessions.length} session{sessions.length !== 1 ? 's' : ''}
              </div>
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={!hasNext}
                className="px-6 py-3 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
              >
                Next
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
