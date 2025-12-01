// Calendar Permission enum
export type CalendarPermission = 'READ' | 'WRITE' | 'ADMIN';

// Invite Status enum
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

// Appointment Status enum
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

// Calendar interface
export interface Calendar {
  id: string;
  name: string;
  description: string | null;
  googleCalendarId: string | null;
  ownerId: string;
  color: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  permission?: CalendarPermission;
  ownerName?: string;
  isOwner?: boolean;
}

// Calendar Share interface
export interface CalendarShare {
  id: string;
  calendarId: string;
  userId: string | null;
  permission: CalendarPermission;
  inviteToken: string | null;
  inviteExpiresAt: string | null;
  inviteStatus: InviteStatus;
  invitedEmail: string | null;
  createdAt: string;
  userName?: string;
  calendarName?: string;
}

// Invite Link interface
export interface InviteLink {
  inviteLink: string;
  expiresAt: string;
  token: string;
}

// Invite Info interface
export interface InviteInfo {
  calendarName: string;
  ownerName: string;
  permission: CalendarPermission;
  expiresAt: string;
}

// Appointment interface
export interface Appointment {
  id: string;
  calendarId: string;
  googleEventId: string | null;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  customerPhone: string | null;
  customerName: string | null;
  customerEmail: string | null;
  status: AppointmentStatus;
  serviceType: string | null;
  duration: number | null;
  notes: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  calendarName?: string;
  calendarColor?: string;
}

// DTO interfaces
export interface CreateCalendarDto {
  name: string;
  description?: string;
  color?: string;
  isDefault?: boolean;
}

export interface UpdateCalendarDto {
  name?: string;
  description?: string;
  color?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface CreateInviteDto {
  calendarId: string;
  permission: CalendarPermission;
  invitedEmail?: string;
}

export interface CreateAppointmentDto {
  calendarId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  customerPhone?: string;
  customerName?: string;
  customerEmail?: string;
  serviceType?: string;
  duration?: number;
  notes?: string;
}

export interface UpdateAppointmentDto {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  customerPhone?: string;
  customerName?: string;
  customerEmail?: string;
  status?: AppointmentStatus;
  serviceType?: string;
  duration?: number;
  notes?: string;
}

export interface AppointmentQuery {
  calendarId?: string;
  startDate?: string;
  endDate?: string;
  status?: AppointmentStatus;
}
