import { client } from '../../api/client';
import type {
  OAuthStatus,
  AuthUrlResponse,
  CalendarEventsResponse,
} from './types';

// Google OAuth API
export const googleOAuthApi = {
  // Get authorization URL to start OAuth flow
  getAuthUrl: async (): Promise<AuthUrlResponse> => {
    const response = await client.get<AuthUrlResponse>('/api/google-oauth/auth-url');
    return response.data;
  },

  // Get connection status
  getStatus: async (): Promise<OAuthStatus> => {
    const response = await client.get<OAuthStatus>('/api/google-oauth/status');
    return response.data;
  },

  // Disconnect Google Calendar
  disconnect: async (): Promise<void> => {
    await client.delete('/api/google-oauth/disconnect');
  },

  // Get calendar events with optional date range
  getCalendarEvents: async (
    timeMin?: string,
    timeMax?: string,
    maxResults?: number,
  ): Promise<CalendarEventsResponse> => {
    const params = new URLSearchParams();
    if (timeMin) params.append('timeMin', timeMin);
    if (timeMax) params.append('timeMax', timeMax);
    if (maxResults) params.append('maxResults', maxResults.toString());

    const queryString = params.toString();
    const url = queryString
      ? `/api/google-oauth/calendar/events?${queryString}`
      : '/api/google-oauth/calendar/events';

    const response = await client.get<CalendarEventsResponse>(url);
    return response.data;
  },

  // Get today's events
  getTodayEvents: async (): Promise<CalendarEventsResponse> => {
    const response = await client.get<CalendarEventsResponse>('/api/google-oauth/calendar/today');
    return response.data;
  },

  // Get tomorrow's events
  getTomorrowEvents: async (): Promise<CalendarEventsResponse> => {
    const response = await client.get<CalendarEventsResponse>('/api/google-oauth/calendar/tomorrow');
    return response.data;
  },
};
