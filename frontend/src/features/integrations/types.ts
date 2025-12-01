export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status: string;
  htmlLink: string;
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
}

export interface OAuthStatus {
  connected: boolean;
  provider: string;
  email?: string;
  expiresAt?: string;
  connectedAt?: string;
}

export interface AuthUrlResponse {
  authUrl: string;
}

export interface CalendarEventsResponse {
  events: CalendarEvent[];
  nextPageToken?: string;
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  provider: string;
  status: OAuthStatus | null;
}
