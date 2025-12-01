import React, { useState, useEffect, useCallback } from 'react';
import { calendarApi } from '../api';
import type {
  Calendar,
  CalendarShare,
  Appointment,
  CreateCalendarDto,
  CreateAppointmentDto,
  CalendarPermission,
} from '../types';

// Color options for calendars
const COLOR_OPTIONS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

type TabType = 'calendars' | 'appointments' | 'shares';

export const CalendarPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('calendars');
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [shares, setShares] = useState<CalendarShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<Calendar | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  // Form states
  const [calendarForm, setCalendarForm] = useState<CreateCalendarDto>({
    name: '',
    description: '',
    color: '#3b82f6',
    isDefault: false,
  });
  const [appointmentForm, setAppointmentForm] = useState<CreateAppointmentDto>({
    calendarId: '',
    title: '',
    startTime: '',
    endTime: '',
    customerName: '',
    customerPhone: '',
    serviceType: '',
    notes: '',
  });
  const [sharePermission, setSharePermission] = useState<CalendarPermission>('READ');

  // Fetch data
  const fetchCalendars = useCallback(async () => {
    try {
      setLoading(true);
      const data = await calendarApi.getCalendars();
      setCalendars(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch calendars:', err);
      setError('Failed to load calendars');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    try {
      const data = await calendarApi.getUpcomingAppointments(30);
      setAppointments(data);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    }
  }, []);

  const fetchShares = useCallback(async (calendarId: string) => {
    try {
      const data = await calendarApi.getCalendarShares(calendarId);
      setShares(data);
    } catch (err) {
      console.error('Failed to fetch shares:', err);
    }
  }, []);

  // Check for success/error from URL params (after OAuth redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const errorParam = params.get('error');
    const calendarName = params.get('calendar');

    if (success === 'joined') {
      setError(null);
      // Show success message
      alert(`Successfully joined calendar${calendarName ? `: ${calendarName}` : ''}!`);
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    } else if (errorParam) {
      const errorMessages: Record<string, string> = {
        invite_not_found: 'Invite link not found or invalid',
        invite_already_used: 'This invite has already been used',
        invite_expired: 'This invite link has expired',
        cannot_invite_owner: 'You cannot join your own calendar',
        already_has_access: 'You already have access to this calendar',
        oauth_failed: 'Failed to connect with Google. Please try again.',
      };
      setError(errorMessages[errorParam] || `Error: ${errorParam}`);
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    }
  }, []);

  useEffect(() => {
    fetchCalendars();
    fetchAppointments();
  }, [fetchCalendars, fetchAppointments]);

  // Calendar handlers
  const handleCreateCalendar = async () => {
    try {
      await calendarApi.createCalendar(calendarForm);
      setShowCalendarModal(false);
      setCalendarForm({ name: '', description: '', color: '#3b82f6', isDefault: false });
      fetchCalendars();
    } catch (err) {
      console.error('Failed to create calendar:', err);
      setError('Failed to create calendar');
    }
  };

  const handleDeleteCalendar = async (id: string) => {
    if (!confirm('Are you sure you want to delete this calendar? All appointments will be deleted.')) return;
    try {
      await calendarApi.deleteCalendar(id);
      fetchCalendars();
      fetchAppointments();
    } catch (err) {
      console.error('Failed to delete calendar:', err);
      setError('Failed to delete calendar');
    }
  };

  // Appointment handlers
  const handleCreateAppointment = async () => {
    try {
      await calendarApi.createAppointment(appointmentForm);
      setShowAppointmentModal(false);
      setAppointmentForm({
        calendarId: '',
        title: '',
        startTime: '',
        endTime: '',
        customerName: '',
        customerPhone: '',
        serviceType: '',
        notes: '',
      });
      fetchAppointments();
    } catch (err) {
      console.error('Failed to create appointment:', err);
      setError('Failed to create appointment');
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await calendarApi.cancelAppointment(id);
      fetchAppointments();
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      setError('Failed to cancel appointment');
    }
  };

  // Share handlers
  const handleCreateInviteLink = async () => {
    if (!selectedCalendar) return;
    try {
      const result = await calendarApi.createInviteLink({
        calendarId: selectedCalendar.id,
        permission: sharePermission,
      });
      setInviteLink(result.inviteLink);
    } catch (err) {
      console.error('Failed to create invite link:', err);
      setError('Failed to create invite link');
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    if (!confirm('Are you sure you want to revoke this share?')) return;
    try {
      await calendarApi.revokeShare(shareId);
      if (selectedCalendar) {
        fetchShares(selectedCalendar.id);
      }
    } catch (err) {
      console.error('Failed to revoke share:', err);
      setError('Failed to revoke share');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'CONFIRMED':
        return 'bg-green-500/20 text-green-400';
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-400';
      case 'COMPLETED':
        return 'bg-blue-500/20 text-blue-400';
      case 'NO_SHOW':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-emerald-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-gray-400">Loading calendars...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Calendar Management</h1>
          <p className="text-gray-400">Manage your calendars, appointments, and sharing settings</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-red-400">error</span>
              <p className="text-red-400">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('calendars')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'calendars'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined align-middle mr-2 text-lg">calendar_month</span>
            Calendars
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'appointments'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined align-middle mr-2 text-lg">event</span>
            Appointments
          </button>
        </div>

        {/* Calendars Tab */}
        {activeTab === 'calendars' && (
          <div>
            {/* Add Calendar Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowCalendarModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">add</span>
                Add Calendar
              </button>
            </div>

            {/* Calendars List */}
            {calendars.length === 0 ? (
              <div className="text-center py-12 bg-surface-dark border border-zinc-800 rounded-xl">
                <span className="material-symbols-outlined text-5xl text-gray-600 mb-4">calendar_month</span>
                <p className="text-gray-400 mb-4">No calendars yet</p>
                <button
                  onClick={() => setShowCalendarModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                >
                  Create your first calendar
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {calendars.map((calendar) => (
                  <div
                    key={calendar.id}
                    className="p-5 bg-surface-dark border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-4 h-full min-h-[60px] rounded-full"
                        style={{ backgroundColor: calendar.color }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{calendar.name}</h3>
                          {calendar.isDefault && (
                            <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded">
                              Default
                            </span>
                          )}
                          {!calendar.isOwner && (
                            <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                              Shared
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-3">
                          {calendar.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="material-symbols-outlined text-sm">shield</span>
                          {calendar.permission || 'ADMIN'}
                          {calendar.ownerName && ` • Owner: ${calendar.ownerName}`}
                        </div>
                      </div>
                      {calendar.isOwner && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setSelectedCalendar(calendar);
                              fetchShares(calendar.id);
                              setShowShareModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                            title="Share"
                          >
                            <span className="material-symbols-outlined">share</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCalendar(calendar.id)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div>
            {/* Add Appointment Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  if (calendars.length === 0) {
                    setError('Please create a calendar first');
                    return;
                  }
                  setAppointmentForm({ ...appointmentForm, calendarId: calendars[0].id });
                  setShowAppointmentModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">add</span>
                Add Appointment
              </button>
            </div>

            {/* Appointments List */}
            {appointments.length === 0 ? (
              <div className="text-center py-12 bg-surface-dark border border-zinc-800 rounded-xl">
                <span className="material-symbols-outlined text-5xl text-gray-600 mb-4">event_busy</span>
                <p className="text-gray-400">No upcoming appointments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 bg-surface-dark border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div
                          className="w-1 rounded-full min-h-[80px]"
                          style={{ backgroundColor: appointment.calendarColor || '#3b82f6' }}
                        />
                        <div>
                          <h3 className="font-medium text-white mb-1">{appointment.title}</h3>
                          <p className="text-sm text-emerald-400 mb-2">
                            <span className="material-symbols-outlined text-sm align-middle mr-1">schedule</span>
                            {formatDateTime(appointment.startTime)} - {formatDateTime(appointment.endTime)}
                          </p>
                          {appointment.customerName && (
                            <p className="text-sm text-gray-400">
                              <span className="material-symbols-outlined text-sm align-middle mr-1">person</span>
                              {appointment.customerName}
                              {appointment.customerPhone && ` (${appointment.customerPhone})`}
                            </p>
                          )}
                          {appointment.serviceType && (
                            <p className="text-sm text-gray-400 mt-1">
                              <span className="material-symbols-outlined text-sm align-middle mr-1">content_cut</span>
                              {appointment.serviceType}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">{appointment.calendarName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                        {appointment.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancelAppointment(appointment.id)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <span className="material-symbols-outlined">cancel</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Calendar Modal */}
        {showCalendarModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-surface-dark border border-zinc-800 rounded-xl w-full max-w-md p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Create Calendar</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name *</label>
                  <input
                    type="text"
                    value={calendarForm.name}
                    onChange={(e) => setCalendarForm({ ...calendarForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g., Work Calendar"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <textarea
                    value={calendarForm.description}
                    onChange={(e) => setCalendarForm({ ...calendarForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                    rows={2}
                    placeholder="Optional description"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Color</label>
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setCalendarForm({ ...calendarForm, color })}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          calendarForm.color === color ? 'border-white scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calendarForm.isDefault}
                    onChange={(e) => setCalendarForm({ ...calendarForm, isDefault: e.target.checked })}
                    className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500"
                  />
                  Set as default calendar
                </label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCalendarModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCalendar}
                  disabled={!calendarForm.name}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white rounded-lg transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Appointment Modal */}
        {showAppointmentModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-surface-dark border border-zinc-800 rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold text-white mb-4">Create Appointment</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Calendar *</label>
                  <select
                    value={appointmentForm.calendarId}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, calendarId: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {calendars
                      .filter((c) => c.permission !== 'READ')
                      .map((calendar) => (
                        <option key={calendar.id} value={calendar.id}>
                          {calendar.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Title *</label>
                  <input
                    type="text"
                    value={appointmentForm.title}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g., Haircut"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Start Time *</label>
                    <input
                      type="datetime-local"
                      value={appointmentForm.startTime}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, startTime: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">End Time *</label>
                    <input
                      type="datetime-local"
                      value={appointmentForm.endTime}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, endTime: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={appointmentForm.customerName}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Customer Phone</label>
                  <input
                    type="tel"
                    value={appointmentForm.customerPhone}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="+90 555 123 4567"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Service Type</label>
                  <input
                    type="text"
                    value={appointmentForm.serviceType}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, serviceType: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g., Haircut, Beard Trim"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Notes</label>
                  <textarea
                    value={appointmentForm.notes}
                    onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                    rows={2}
                    placeholder="Additional notes"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAppointmentModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAppointment}
                  disabled={!appointmentForm.title || !appointmentForm.startTime || !appointmentForm.endTime}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white rounded-lg transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && selectedCalendar && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-surface-dark border border-zinc-800 rounded-xl w-full max-w-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Share "{selectedCalendar.name}"
              </h2>

              {/* Create Invite Link Section */}
              <div className="mb-6 p-4 bg-zinc-900 rounded-lg">
                <h3 className="text-sm font-medium text-white mb-3">Create Invite Link</h3>
                <div className="flex gap-3">
                  <select
                    value={sharePermission}
                    onChange={(e) => setSharePermission(e.target.value as CalendarPermission)}
                    className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="READ">Read Only</option>
                    <option value="WRITE">Can Edit</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <button
                    onClick={handleCreateInviteLink}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                  >
                    Generate Link
                  </button>
                </div>

                {inviteLink && (
                  <div className="mt-3 p-3 bg-zinc-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        className="flex-1 px-2 py-1 bg-transparent text-sm text-gray-300 outline-none"
                      />
                      <button
                        onClick={() => copyToClipboard(inviteLink)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Copy"
                      >
                        <span className="material-symbols-outlined text-lg">content_copy</span>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Link expires in 7 days</p>
                  </div>
                )}
              </div>

              {/* Current Shares */}
              <div>
                <h3 className="text-sm font-medium text-white mb-3">Current Shares</h3>
                {shares.length === 0 ? (
                  <p className="text-sm text-gray-400">No shares yet</p>
                ) : (
                  <div className="space-y-2">
                    {shares.map((share) => (
                      <div
                        key={share.id}
                        className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg"
                      >
                        <div>
                          <p className="text-sm text-white">
                            {share.userName || share.invitedEmail || 'Pending invite'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {share.permission} • {share.inviteStatus}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRevokeShare(share.id)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          title="Revoke"
                        >
                          <span className="material-symbols-outlined">person_remove</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setSelectedCalendar(null);
                    setInviteLink(null);
                    setShares([]);
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
