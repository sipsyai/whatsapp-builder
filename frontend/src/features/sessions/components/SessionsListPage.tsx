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
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

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

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load initial sessions
  useEffect(() => {
    loadSessions();
  }, [currentTab, selectedChatbotId, currentPage, debouncedSearch, startDate, endDate]);

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
        search: debouncedSearch || undefined,
        startDate: startDate ? `${startDate}T00:00:00` : undefined, // Include full day from start
        endDate: endDate ? `${endDate}T23:59:59` : undefined, // Include full day to end
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

  // Export sessions as CSV
  const exportToCSV = () => {
    if (sessions.length === 0) {
      setToast({ message: 'No sessions to export', type: 'error' });
      return;
    }

    const headers = ['ID', 'Customer Name', 'Customer Phone', 'Chatbot', 'Status', 'Started At', 'Updated At', 'Completed At', 'Nodes', 'Messages'];
    const rows = sessions.map(s => [
      s.id,
      s.customerName || 'Unknown',
      s.customerPhone,
      s.chatbotName,
      s.status,
      new Date(s.startedAt).toLocaleString(),
      new Date(s.updatedAt).toLocaleString(),
      s.completedAt ? new Date(s.completedAt).toLocaleString() : '',
      s.nodeCount,
      s.messageCount,
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sessions_${currentTab}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setToast({ message: 'Sessions exported to CSV', type: 'success' });
    setShowExportMenu(false);
  };

  // Export sessions as JSON
  const exportToJSON = () => {
    if (sessions.length === 0) {
      setToast({ message: 'No sessions to export', type: 'error' });
      return;
    }

    const exportData = sessions.map(s => ({
      id: s.id,
      customerName: s.customerName,
      customerPhone: s.customerPhone,
      chatbotId: s.chatbotId,
      chatbotName: s.chatbotName,
      status: s.status,
      currentNodeId: s.currentNodeId,
      currentNodeLabel: s.currentNodeLabel,
      startedAt: s.startedAt,
      updatedAt: s.updatedAt,
      completedAt: s.completedAt,
      nodeCount: s.nodeCount,
      messageCount: s.messageCount,
      isActive: s.isActive,
    }));

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sessions_${currentTab}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setToast({ message: 'Sessions exported to JSON', type: 'success' });
    setShowExportMenu(false);
  };

  // Delete a session
  const handleDeleteSession = async (sessionId: string) => {
    try {
      await SessionsService.deleteSession(sessionId);
      setToast({ message: 'Session deleted successfully', type: 'success' });
      // Reload sessions to update the list
      loadSessions();
    } catch (err: any) {
      console.error('Failed to delete session:', err);
      setToast({
        message: err.response?.data?.message || 'Failed to delete session',
        type: 'error',
      });
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const activeCount = Array.from(activeSessions.values()).filter(s => s.isActive).length;

    // Date boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Completed today/yesterday counts
    let completedTodayCount = 0;
    let completedYesterdayCount = 0;

    if (currentTab === 'completed') {
      sessions.forEach(s => {
        if (!s.completedAt || s.status !== 'completed') return;
        const completedDate = new Date(s.completedAt);
        completedDate.setHours(0, 0, 0, 0);

        if (completedDate.getTime() === today.getTime()) {
          completedTodayCount++;
        } else if (completedDate.getTime() === yesterday.getTime()) {
          completedYesterdayCount++;
        }
      });
    }

    return {
      active: activeCount,
      completedToday: completedTodayCount,
      completedYesterday: completedYesterdayCount,
      total: totalSessions,
    };
  }, [activeSessions, sessions, totalSessions, currentTab]);

  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background overflow-y-auto">
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
              <h1 className="text-4xl font-bold text-white mb-2">Chatbot Sessions</h1>
              <p className="text-zinc-400">Monitor and track active chatbot conversations</p>
              {connected && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-xs text-green-600 font-medium">Live Updates Active</span>
                </div>
              )}
            </div>

            {/* Export Button */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={sessions.length === 0}
                className="px-4 py-2 bg-surface border border-zinc-700 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Export
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </button>

              {/* Export Dropdown Menu */}
              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-surface border border-zinc-700 rounded-xl shadow-lg z-20 overflow-hidden">
                    <button
                      onClick={exportToCSV}
                      className="w-full px-4 py-3 text-left text-white hover:bg-zinc-800 transition-colors flex items-center gap-3"
                    >
                      <span className="material-symbols-outlined text-green-500">table_chart</span>
                      Export as CSV
                    </button>
                    <button
                      onClick={exportToJSON}
                      className="w-full px-4 py-3 text-left text-white hover:bg-zinc-800 transition-colors flex items-center gap-3 border-t border-zinc-700"
                    >
                      <span className="material-symbols-outlined text-blue-500">code</span>
                      Export as JSON
                    </button>
                  </div>
                </>
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
                  : 'bg-surface text-zinc-400 hover:bg-zinc-50'
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
                  : 'bg-surface text-zinc-400 hover:bg-zinc-50'
              }`}
            >
              <span className="material-symbols-outlined">check_circle</span>
              Completed Sessions
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500 rounded-lg">
                  <span className="material-symbols-outlined text-white">play_circle</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-900">{stats.active}</p>
                  <p className="text-sm text-green-700">Active Sessions</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <span className="material-symbols-outlined text-white">today</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-blue-900">{stats.completedToday}</p>
                    {stats.completedYesterday > 0 && (
                      <span className="text-sm text-blue-600">
                        (+{stats.completedYesterday} yesterday)
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-blue-700">Completed Today</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500 rounded-lg">
                  <span className="material-symbols-outlined text-white">chat</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-900">{stats.total}</p>
                  <p className="text-sm text-purple-700">Total Sessions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[250px] max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name or phone..."
                className="w-full pl-12 pr-10 py-3 rounded-xl border border-zinc-700 bg-surface text-white placeholder-zinc-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                search
              </span>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>

            {/* Filter by Chatbot */}
            <div className="relative">
              <select
                value={selectedChatbotId}
                onChange={(e) => {
                  setSelectedChatbotId(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none w-full sm:w-64 pl-12 pr-10 py-3 rounded-xl border border-zinc-700 bg-surface text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer"
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

            {/* Date Range Filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 pr-3 py-3 rounded-xl border border-zinc-700 bg-surface text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all [color-scheme:dark]"
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none text-sm">
                  calendar_today
                </span>
              </div>
              <span className="text-zinc-400">to</span>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  min={startDate}
                  className="pl-10 pr-3 py-3 rounded-xl border border-zinc-700 bg-surface text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all [color-scheme:dark]"
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none text-sm">
                  calendar_today
                </span>
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setCurrentPage(1);
                  }}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                  title="Clear date filter"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>
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
          <div className="text-center py-20 bg-surface rounded-2xl border-2 border-dashed border-zinc-700">
            <div className="inline-block p-6 bg-zinc-800 rounded-full mb-6">
              <span className="material-symbols-outlined text-6xl text-zinc-400">
                {currentTab === 'active' ? 'play_circle' : 'check_circle'}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              No {currentTab} sessions
            </h3>
            <p className="text-zinc-400 mb-8 max-w-md mx-auto">
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
                  onDelete={handleDeleteSession}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-zinc-800">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-6 py-3 bg-surface border border-zinc-200 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
                Previous
              </button>
              <div className="text-sm text-zinc-400">
                Page {currentPage} • {sessions.length} session{sessions.length !== 1 ? 's' : ''}
              </div>
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={!hasNext}
                className="px-6 py-3 bg-surface border border-zinc-200 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50 transition-colors flex items-center gap-2"
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
