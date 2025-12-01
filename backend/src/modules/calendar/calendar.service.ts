import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Calendar } from '../../entities/calendar.entity';
import { CalendarShare, CalendarPermission, InviteStatus } from '../../entities/calendar-share.entity';
import { Appointment, AppointmentStatus } from '../../entities/appointment.entity';
import { User } from '../../entities/user.entity';
import {
  CreateCalendarDto,
  UpdateCalendarDto,
  CreateInviteDto,
  CreateAppointmentDto,
  UpdateAppointmentDto,
  CalendarResponseDto,
  CalendarShareResponseDto,
  InviteLinkResponseDto,
  AppointmentResponseDto,
  AppointmentQueryDto,
  CalendarWithPermission,
} from './dto';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Calendar)
    private readonly calendarRepository: Repository<Calendar>,
    @InjectRepository(CalendarShare)
    private readonly shareRepository: Repository<CalendarShare>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
  }

  // =====================================================
  // Calendar CRUD
  // =====================================================

  async createCalendar(userId: string, dto: CreateCalendarDto): Promise<CalendarResponseDto> {
    // If this is set as default, remove default from other calendars
    if (dto.isDefault) {
      await this.calendarRepository.update(
        { ownerId: userId },
        { isDefault: false },
      );
    }

    const calendar = this.calendarRepository.create({
      ...dto,
      ownerId: userId,
    });

    await this.calendarRepository.save(calendar);
    this.logger.log(`Calendar ${calendar.id} created by user ${userId}`);

    return this.toCalendarResponse(calendar);
  }

  async getUserCalendars(userId: string): Promise<CalendarWithPermission[]> {
    // Get owned calendars
    const ownedCalendars = await this.calendarRepository.find({
      where: { ownerId: userId, isActive: true },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });

    // Get shared calendars
    const shares = await this.shareRepository.find({
      where: { userId, inviteStatus: InviteStatus.ACCEPTED },
      relations: ['calendar', 'calendar.owner'],
    });

    const result: CalendarWithPermission[] = [];

    // Add owned calendars
    for (const cal of ownedCalendars) {
      result.push({
        ...this.toCalendarResponse(cal),
        permission: CalendarPermission.ADMIN,
        isOwner: true,
      });
    }

    // Add shared calendars
    for (const share of shares) {
      if (share.calendar && share.calendar.isActive) {
        result.push({
          ...this.toCalendarResponse(share.calendar),
          permission: share.permission,
          isOwner: false,
          ownerName: share.calendar.owner?.name,
        });
      }
    }

    return result;
  }

  async getCalendarById(calendarId: string, userId: string): Promise<CalendarWithPermission> {
    const calendar = await this.calendarRepository.findOne({
      where: { id: calendarId },
      relations: ['owner'],
    });

    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    const permission = await this.getUserPermission(calendarId, userId);
    if (!permission) {
      throw new ForbiddenException('Access denied to this calendar');
    }

    return {
      ...this.toCalendarResponse(calendar),
      permission,
      isOwner: calendar.ownerId === userId,
      ownerName: calendar.owner?.name,
    };
  }

  async updateCalendar(
    calendarId: string,
    userId: string,
    dto: UpdateCalendarDto,
  ): Promise<CalendarResponseDto> {
    const calendar = await this.calendarRepository.findOne({
      where: { id: calendarId },
    });

    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    // Only owner or admin can update
    const permission = await this.getUserPermission(calendarId, userId);
    if (permission !== CalendarPermission.ADMIN && calendar.ownerId !== userId) {
      throw new ForbiddenException('Only calendar owner or admin can update');
    }

    // If setting as default, remove default from other calendars
    if (dto.isDefault && !calendar.isDefault) {
      await this.calendarRepository.update(
        { ownerId: calendar.ownerId },
        { isDefault: false },
      );
    }

    Object.assign(calendar, dto);
    await this.calendarRepository.save(calendar);

    this.logger.log(`Calendar ${calendarId} updated by user ${userId}`);
    return this.toCalendarResponse(calendar);
  }

  async deleteCalendar(calendarId: string, userId: string): Promise<void> {
    const calendar = await this.calendarRepository.findOne({
      where: { id: calendarId },
    });

    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    // Only owner can delete
    if (calendar.ownerId !== userId) {
      throw new ForbiddenException('Only calendar owner can delete');
    }

    await this.calendarRepository.remove(calendar);
    this.logger.log(`Calendar ${calendarId} deleted by user ${userId}`);
  }

  // =====================================================
  // Calendar Sharing & Invitations
  // =====================================================

  async createInviteLink(
    userId: string,
    dto: CreateInviteDto,
  ): Promise<InviteLinkResponseDto> {
    const calendar = await this.calendarRepository.findOne({
      where: { id: dto.calendarId },
    });

    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    // Only owner or admin can create invites
    const permission = await this.getUserPermission(dto.calendarId, userId);
    if (permission !== CalendarPermission.ADMIN && calendar.ownerId !== userId) {
      throw new ForbiddenException('Only calendar owner or admin can create invites');
    }

    // Generate unique token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const share = this.shareRepository.create({
      calendarId: dto.calendarId,
      permission: dto.permission,
      inviteToken: token,
      inviteExpiresAt: expiresAt,
      inviteStatus: InviteStatus.PENDING,
      invitedEmail: dto.invitedEmail,
    });

    await this.shareRepository.save(share);
    this.logger.log(`Invite link created for calendar ${dto.calendarId}`);

    // Return Google OAuth URL that will handle invite flow
    return {
      inviteLink: `${this.frontendUrl}/api/google-oauth/invite/${token}`,
      expiresAt,
      token,
    };
  }

  async getInviteInfo(token: string): Promise<{
    calendarName: string;
    ownerName: string;
    permission: CalendarPermission;
    expiresAt: Date;
  }> {
    const share = await this.shareRepository.findOne({
      where: { inviteToken: token },
      relations: ['calendar', 'calendar.owner'],
    });

    if (!share) {
      throw new NotFoundException('Invite not found');
    }

    if (share.inviteStatus !== InviteStatus.PENDING) {
      throw new BadRequestException('This invite has already been used or expired');
    }

    if (share.inviteExpiresAt && share.inviteExpiresAt < new Date()) {
      share.inviteStatus = InviteStatus.EXPIRED;
      await this.shareRepository.save(share);
      throw new BadRequestException('This invite has expired');
    }

    return {
      calendarName: share.calendar.name,
      ownerName: share.calendar.owner?.name || 'Unknown',
      permission: share.permission,
      expiresAt: share.inviteExpiresAt!,
    };
  }

  async acceptInvite(userId: string, token: string): Promise<CalendarShareResponseDto> {
    const share = await this.shareRepository.findOne({
      where: { inviteToken: token },
      relations: ['calendar'],
    });

    if (!share) {
      throw new NotFoundException('Invite not found');
    }

    if (share.inviteStatus !== InviteStatus.PENDING) {
      throw new BadRequestException('This invite has already been used or expired');
    }

    if (share.inviteExpiresAt && share.inviteExpiresAt < new Date()) {
      share.inviteStatus = InviteStatus.EXPIRED;
      await this.shareRepository.save(share);
      throw new BadRequestException('This invite has expired');
    }

    // Check if user already has access
    const existingShare = await this.shareRepository.findOne({
      where: { calendarId: share.calendarId, userId },
    });

    if (existingShare) {
      throw new BadRequestException('You already have access to this calendar');
    }

    // Check if user is the owner
    if (share.calendar.ownerId === userId) {
      throw new BadRequestException('You are the owner of this calendar');
    }

    // Accept the invite
    share.userId = userId;
    share.inviteStatus = InviteStatus.ACCEPTED;
    share.inviteToken = undefined as any; // Clear token after use
    await this.shareRepository.save(share);

    const user = await this.userRepository.findOne({ where: { id: userId } });

    this.logger.log(`User ${userId} accepted invite to calendar ${share.calendarId}`);

    return {
      id: share.id,
      calendarId: share.calendarId,
      userId: share.userId,
      permission: share.permission,
      inviteToken: null,
      inviteExpiresAt: share.inviteExpiresAt,
      inviteStatus: share.inviteStatus,
      invitedEmail: share.invitedEmail,
      createdAt: share.createdAt,
      userName: user?.name,
      calendarName: share.calendar.name,
    };
  }

  async getCalendarShares(calendarId: string, userId: string): Promise<CalendarShareResponseDto[]> {
    const calendar = await this.calendarRepository.findOne({
      where: { id: calendarId },
    });

    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    // Only owner or admin can view shares
    const permission = await this.getUserPermission(calendarId, userId);
    if (permission !== CalendarPermission.ADMIN && calendar.ownerId !== userId) {
      throw new ForbiddenException('Only calendar owner or admin can view shares');
    }

    const shares = await this.shareRepository.find({
      where: { calendarId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    return shares.map(share => ({
      id: share.id,
      calendarId: share.calendarId,
      userId: share.userId,
      permission: share.permission,
      inviteToken: share.inviteToken,
      inviteExpiresAt: share.inviteExpiresAt,
      inviteStatus: share.inviteStatus,
      invitedEmail: share.invitedEmail,
      createdAt: share.createdAt,
      userName: share.user?.name,
    }));
  }

  async updateSharePermission(
    shareId: string,
    userId: string,
    permission: CalendarPermission,
  ): Promise<CalendarShareResponseDto> {
    const share = await this.shareRepository.findOne({
      where: { id: shareId },
      relations: ['calendar', 'user'],
    });

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    // Only owner or admin can update permissions
    const userPermission = await this.getUserPermission(share.calendarId, userId);
    if (userPermission !== CalendarPermission.ADMIN && share.calendar.ownerId !== userId) {
      throw new ForbiddenException('Only calendar owner or admin can update permissions');
    }

    share.permission = permission;
    await this.shareRepository.save(share);

    this.logger.log(`Share ${shareId} permission updated to ${permission}`);

    return {
      id: share.id,
      calendarId: share.calendarId,
      userId: share.userId,
      permission: share.permission,
      inviteToken: share.inviteToken,
      inviteExpiresAt: share.inviteExpiresAt,
      inviteStatus: share.inviteStatus,
      invitedEmail: share.invitedEmail,
      createdAt: share.createdAt,
      userName: share.user?.name,
    };
  }

  async revokeShare(shareId: string, userId: string): Promise<void> {
    const share = await this.shareRepository.findOne({
      where: { id: shareId },
      relations: ['calendar'],
    });

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    // Only owner or admin can revoke
    const permission = await this.getUserPermission(share.calendarId, userId);
    if (permission !== CalendarPermission.ADMIN && share.calendar.ownerId !== userId) {
      throw new ForbiddenException('Only calendar owner or admin can revoke access');
    }

    await this.shareRepository.remove(share);
    this.logger.log(`Share ${shareId} revoked by user ${userId}`);
  }

  // =====================================================
  // Appointments
  // =====================================================

  async createAppointment(
    userId: string,
    dto: CreateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    // Check permission (must have WRITE or ADMIN)
    const permission = await this.getUserPermission(dto.calendarId, userId);
    if (!permission || permission === CalendarPermission.READ) {
      throw new ForbiddenException('You do not have write access to this calendar');
    }

    const calendar = await this.calendarRepository.findOne({
      where: { id: dto.calendarId },
    });

    if (!calendar) {
      throw new NotFoundException('Calendar not found');
    }

    const appointment = this.appointmentRepository.create({
      ...dto,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      createdById: userId,
      status: AppointmentStatus.PENDING,
    });

    await this.appointmentRepository.save(appointment);
    this.logger.log(`Appointment ${appointment.id} created in calendar ${dto.calendarId}`);

    return this.toAppointmentResponse(appointment, calendar);
  }

  async getAppointments(
    userId: string,
    query: AppointmentQueryDto,
  ): Promise<AppointmentResponseDto[]> {
    // Get all calendars user has access to
    const calendars = await this.getUserCalendars(userId);
    const calendarIds = calendars.map(c => c.id);

    if (calendarIds.length === 0) {
      return [];
    }

    // Build query
    const whereConditions: any = {
      calendarId: query.calendarId ? query.calendarId : In(calendarIds),
    };

    // Check if user has access to specific calendar
    if (query.calendarId && !calendarIds.includes(query.calendarId)) {
      throw new ForbiddenException('Access denied to this calendar');
    }

    if (query.status) {
      whereConditions.status = query.status;
    }

    if (query.startDate && query.endDate) {
      whereConditions.startTime = Between(
        new Date(query.startDate),
        new Date(query.endDate),
      );
    } else if (query.startDate) {
      whereConditions.startTime = MoreThanOrEqual(new Date(query.startDate));
    } else if (query.endDate) {
      whereConditions.startTime = LessThanOrEqual(new Date(query.endDate));
    }

    const appointments = await this.appointmentRepository.find({
      where: whereConditions,
      relations: ['calendar'],
      order: { startTime: 'ASC' },
    });

    return appointments.map(apt => this.toAppointmentResponse(apt, apt.calendar));
  }

  async getAppointmentById(
    appointmentId: string,
    userId: string,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['calendar'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Check access
    const permission = await this.getUserPermission(appointment.calendarId, userId);
    if (!permission) {
      throw new ForbiddenException('Access denied');
    }

    return this.toAppointmentResponse(appointment, appointment.calendar);
  }

  async updateAppointment(
    appointmentId: string,
    userId: string,
    dto: UpdateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['calendar'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Check permission (must have WRITE or ADMIN)
    const permission = await this.getUserPermission(appointment.calendarId, userId);
    if (!permission || permission === CalendarPermission.READ) {
      throw new ForbiddenException('You do not have write access');
    }

    // Update fields
    if (dto.startTime) {
      appointment.startTime = new Date(dto.startTime);
    }
    if (dto.endTime) {
      appointment.endTime = new Date(dto.endTime);
    }
    Object.assign(appointment, dto);

    await this.appointmentRepository.save(appointment);
    this.logger.log(`Appointment ${appointmentId} updated by user ${userId}`);

    return this.toAppointmentResponse(appointment, appointment.calendar);
  }

  async cancelAppointment(appointmentId: string, userId: string): Promise<void> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['calendar'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Check permission
    const permission = await this.getUserPermission(appointment.calendarId, userId);
    if (!permission || permission === CalendarPermission.READ) {
      throw new ForbiddenException('You do not have write access');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    await this.appointmentRepository.save(appointment);
    this.logger.log(`Appointment ${appointmentId} cancelled by user ${userId}`);
  }

  async deleteAppointment(appointmentId: string, userId: string): Promise<void> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['calendar'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Check permission (must be ADMIN or owner)
    const calendar = appointment.calendar;
    const permission = await this.getUserPermission(appointment.calendarId, userId);
    if (permission !== CalendarPermission.ADMIN && calendar.ownerId !== userId) {
      throw new ForbiddenException('Only admin can delete appointments');
    }

    await this.appointmentRepository.remove(appointment);
    this.logger.log(`Appointment ${appointmentId} deleted by user ${userId}`);
  }

  async getTodayAppointments(userId: string): Promise<AppointmentResponseDto[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    return this.getAppointments(userId, {
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString(),
    });
  }

  async getUpcomingAppointments(
    userId: string,
    days: number = 7,
  ): Promise<AppointmentResponseDto[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.getAppointments(userId, {
      startDate: now.toISOString(),
      endDate: futureDate.toISOString(),
    });
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  private async getUserPermission(
    calendarId: string,
    userId: string,
  ): Promise<CalendarPermission | null> {
    // Check if user is owner
    const calendar = await this.calendarRepository.findOne({
      where: { id: calendarId },
    });

    if (!calendar) {
      return null;
    }

    if (calendar.ownerId === userId) {
      return CalendarPermission.ADMIN;
    }

    // Check shares
    const share = await this.shareRepository.findOne({
      where: { calendarId, userId, inviteStatus: InviteStatus.ACCEPTED },
    });

    return share?.permission || null;
  }

  private toCalendarResponse(calendar: Calendar): CalendarResponseDto {
    return {
      id: calendar.id,
      name: calendar.name,
      description: calendar.description,
      googleCalendarId: calendar.googleCalendarId,
      ownerId: calendar.ownerId,
      color: calendar.color,
      isActive: calendar.isActive,
      isDefault: calendar.isDefault,
      createdAt: calendar.createdAt,
      updatedAt: calendar.updatedAt,
    };
  }

  private toAppointmentResponse(
    appointment: Appointment,
    calendar?: Calendar,
  ): AppointmentResponseDto {
    return {
      id: appointment.id,
      calendarId: appointment.calendarId,
      googleEventId: appointment.googleEventId,
      title: appointment.title,
      description: appointment.description,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      customerPhone: appointment.customerPhone,
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      status: appointment.status,
      serviceType: appointment.serviceType,
      duration: appointment.duration,
      notes: appointment.notes,
      createdById: appointment.createdById,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      calendarName: calendar?.name,
      calendarColor: calendar?.color,
    };
  }
}
