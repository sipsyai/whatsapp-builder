import React, { useState, useEffect, useCallback } from 'react';
import { googleOAuthApi } from '../api';
import type { OAuthStatus, CalendarEvent } from '../types';

type ViewMode = 'today' | 'tomorrow' | 'custom';

export const IntegrationsPage: React.FC = () => {
  const [status, setStatus] = useState<OAuthStatus | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [error, setError] = useState<string | null>(null);

  // Check for OAuth callback result in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const errorParam = params.get('error');

    if (success === 'google_connected') {
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      // Refresh status
      fetchStatus();
    } else if (errorParam) {
      setError(`Connection failed: ${errorParam}`);
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await googleOAuthApi.getStatus();
      setStatus(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch status:', err);
      setError('Failed to load connection status');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    if (!status?.connected) return;

    try {
      setEventsLoading(true);
      let data;
      if (viewMode === 'today') {
        data = await googleOAuthApi.getTodayEvents();
      } else if (viewMode === 'tomorrow') {
        data = await googleOAuthApi.getTomorrowEvents();
      } else {
        data = await googleOAuthApi.getCalendarEvents();
      }
      setEvents(data.events);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch events:', err);
      if (err.response?.status === 401) {
        setError('Calendar access expired. Please reconnect.');
        setStatus({ connected: false, provider: 'google_calendar' });
      } else {
        setError('Failed to load calendar events');
      }
    } finally {
      setEventsLoading(false);
    }
  }, [status?.connected, viewMode]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (status?.connected) {
      fetchEvents();
    }
  }, [status?.connected, fetchEvents]);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError(null);
      const { authUrl } = await googleOAuthApi.getAuthUrl();
      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (err) {
      console.error('Failed to get auth URL:', err);
      setError('Failed to start connection. Please try again.');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar?')) return;

    try {
      setLoading(true);
      await googleOAuthApi.disconnect();
      setStatus({ connected: false, provider: 'google_calendar' });
      setEvents([]);
      setError(null);
    } catch (err) {
      console.error('Failed to disconnect:', err);
      setError('Failed to disconnect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatEventTime = (event: CalendarEvent): string => {
    if (event.start.dateTime) {
      const start = new Date(event.start.dateTime);
      const end = new Date(event.end.dateTime!);
      return `${start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return 'All day';
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-emerald-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Integrations</h1>
          <p className="text-gray-400">Connect external services to enhance your chatbot capabilities</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-red-400">error</span>
              <p className="text-red-400">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        )}

        {/* Google Calendar Card */}
        <div className="bg-surface-dark border border-zinc-800 rounded-xl overflow-hidden">
          {/* Card Header */}
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Google Calendar Icon */}
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-8 h-8">
                    <path fill="#4285F4" d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10 10-4.48 10-10z"/>
                    <path fill="#FFFFFF" d="M12 6v6l4 2"/>
                    <path fill="#EA4335" d="M12 2C6.48 2 2 6.48 2 12h4c0-3.31 2.69-6 6-6V2z"/>
                    <path fill="#FBBC05" d="M2 12c0 5.52 4.48 10 10 10v-4c-3.31 0-6-2.69-6-6H2z"/>
                    <path fill="#34A853" d="M12 22c5.52 0 10-4.48 10-10h-4c0 3.31-2.69 6-6 6v4z"/>
                    <path fill="#4285F4" d="M22 12c0-5.52-4.48-10-10-10v4c3.31 0 6 2.69 6 6h4z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Google Calendar</h2>
                  <p className="text-gray-400 text-sm">
                    {status?.connected
                      ? `Connected as ${status.email}`
                      : 'View and manage calendar events in your chatbot'
                    }
                  </p>
                </div>
              </div>

              {/* Connection Status & Actions */}
              <div className="flex items-center gap-3">
                {status?.connected ? (
                  <>
                    <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-sm">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                      Connected
                    </span>
                    <button
                      onClick={handleDisconnect}
                      className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white rounded-lg transition-colors"
                  >
                    {connecting ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">link</span>
                        Connect
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Calendar Events Section (only when connected) */}
          {status?.connected && (
            <div className="p-6">
              {/* View Mode Tabs */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setViewMode('today')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'today'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-gray-400 hover:text-white'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setViewMode('tomorrow')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'tomorrow'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-gray-400 hover:text-white'
                  }`}
                >
                  Tomorrow
                </button>
                <button
                  onClick={fetchEvents}
                  disabled={eventsLoading}
                  className="ml-auto p-2 text-gray-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <span className={`material-symbols-outlined ${eventsLoading ? 'animate-spin' : ''}`}>
                    refresh
                  </span>
                </button>
              </div>

              {/* Events List */}
              {eventsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="animate-spin h-6 w-6 text-emerald-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl text-gray-600 mb-2">event_busy</span>
                  <p className="text-gray-400">No events for {viewMode === 'today' ? 'today' : 'tomorrow'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">{event.summary}</h3>
                          <p className="text-sm text-emerald-400 mt-1">
                            <span className="material-symbols-outlined text-sm align-middle mr-1">schedule</span>
                            {formatEventTime(event)}
                          </p>
                          {event.location && (
                            <p className="text-sm text-gray-400 mt-1 truncate">
                              <span className="material-symbols-outlined text-sm align-middle mr-1">location_on</span>
                              {event.location}
                            </p>
                          )}
                        </div>
                        <a
                          href={event.htmlLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Open in Google Calendar"
                        >
                          <span className="material-symbols-outlined">open_in_new</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Help Text (when not connected) */}
          {!status?.connected && (
            <div className="p-6 bg-zinc-900/50">
              <h3 className="text-sm font-medium text-white mb-3">What you can do with Google Calendar:</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
                  View your calendar events in the dashboard
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
                  Let chatbot respond with your schedule information
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
                  Check availability for appointments
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Usage Instructions */}
        {status?.connected && (
          <div className="mt-6 p-6 bg-surface-dark border border-zinc-800 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Using Calendar in Chatbot</h3>
            <p className="text-gray-400 mb-4">
              You can use the REST API node in your chatbot to fetch calendar events. Configure a DataSource
              connection to the Google Calendar API endpoint.
            </p>
            <div className="bg-zinc-900 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Example API Endpoint:</p>
              <code className="text-emerald-400 text-sm">
                GET /api/google-oauth/calendar/today
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
