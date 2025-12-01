import { client as apiClient } from '../../api/client';
import type {
  Calendar,
  CalendarShare,
  InviteLink,
  InviteInfo,
  Appointment,
  CreateCalendarDto,
  UpdateCalendarDto,
  CreateInviteDto,
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentQuery,
  CalendarPermission,
} from './types';

const BASE_URL = '/api/calendars';

export const calendarApi = {
  // =====================================================
  // Calendar CRUD
  // =====================================================

  async getCalendars(): Promise<Calendar[]> {
    const response = await apiClient.get<Calendar[]>(BASE_URL);
    return response.data;
  },

  async getCalendarById(id: string): Promise<Calendar> {
    const response = await apiClient.get<Calendar>(`${BASE_URL}/${id}`);
    return response.data;
  },

  async createCalendar(data: CreateCalendarDto): Promise<Calendar> {
    const response = await apiClient.post<Calendar>(BASE_URL, data);
    return response.data;
  },

  async updateCalendar(id: string, data: UpdateCalendarDto): Promise<Calendar> {
    const response = await apiClient.put<Calendar>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  async deleteCalendar(id: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/${id}`);
  },

  // =====================================================
  // Sharing & Invitations
  // =====================================================

  async createInviteLink(data: CreateInviteDto): Promise<InviteLink> {
    const response = await apiClient.post<InviteLink>(`${BASE_URL}/invites`, data);
    return response.data;
  },

  async getInviteInfo(token: string): Promise<InviteInfo> {
    const response = await apiClient.get<InviteInfo>(`${BASE_URL}/invites/${token}/info`);
    return response.data;
  },

  async acceptInvite(token: string): Promise<CalendarShare> {
    const response = await apiClient.post<CalendarShare>(`${BASE_URL}/invites/${token}/accept`);
    return response.data;
  },

  async getCalendarShares(calendarId: string): Promise<CalendarShare[]> {
    const response = await apiClient.get<CalendarShare[]>(`${BASE_URL}/${calendarId}/shares`);
    return response.data;
  },

  async updateSharePermission(shareId: string, permission: CalendarPermission): Promise<CalendarShare> {
    const response = await apiClient.patch<CalendarShare>(`${BASE_URL}/shares/${shareId}/permission`, { permission });
    return response.data;
  },

  async revokeShare(shareId: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/shares/${shareId}`);
  },

  // =====================================================
  // Appointments
  // =====================================================

  async getAppointments(query?: AppointmentQuery): Promise<Appointment[]> {
    const params = new URLSearchParams();
    if (query?.calendarId) params.append('calendarId', query.calendarId);
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.status) params.append('status', query.status);

    const response = await apiClient.get<Appointment[]>(`${BASE_URL}/appointments?${params.toString()}`);
    return response.data;
  },

  async getTodayAppointments(): Promise<Appointment[]> {
    const response = await apiClient.get<Appointment[]>(`${BASE_URL}/appointments/today`);
    return response.data;
  },

  async getUpcomingAppointments(days?: number): Promise<Appointment[]> {
    const params = days ? `?days=${days}` : '';
    const response = await apiClient.get<Appointment[]>(`${BASE_URL}/appointments/upcoming${params}`);
    return response.data;
  },

  async getAppointmentById(id: string): Promise<Appointment> {
    const response = await apiClient.get<Appointment>(`${BASE_URL}/appointments/${id}`);
    return response.data;
  },

  async createAppointment(data: CreateAppointmentDto): Promise<Appointment> {
    const response = await apiClient.post<Appointment>(`${BASE_URL}/appointments`, data);
    return response.data;
  },

  async updateAppointment(id: string, data: UpdateAppointmentDto): Promise<Appointment> {
    const response = await apiClient.put<Appointment>(`${BASE_URL}/appointments/${id}`, data);
    return response.data;
  },

  async cancelAppointment(id: string): Promise<void> {
    await apiClient.post(`${BASE_URL}/appointments/${id}/cancel`);
  },

  async deleteAppointment(id: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/appointments/${id}`);
  },
};
