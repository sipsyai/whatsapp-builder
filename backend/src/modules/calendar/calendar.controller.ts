import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CalendarPermission } from '../../entities/calendar-share.entity';
import {
  CreateCalendarDto,
  UpdateCalendarDto,
  CreateInviteDto,
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentQueryDto,
  CalendarResponseDto,
  CalendarShareResponseDto,
  InviteLinkResponseDto,
  AppointmentResponseDto,
  CalendarWithPermission,
} from './dto';

@ApiTags('Calendar')
@Controller('api/calendars')
export class CalendarController {
  private readonly logger = new Logger(CalendarController.name);

  constructor(private readonly calendarService: CalendarService) {}

  // =====================================================
  // Calendar Endpoints
  // =====================================================

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new calendar' })
  @ApiResponse({ status: 201, description: 'Calendar created', type: CalendarResponseDto })
  async createCalendar(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateCalendarDto,
  ): Promise<CalendarResponseDto> {
    return this.calendarService.createCalendar(user.userId, dto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all calendars (owned + shared)' })
  @ApiResponse({ status: 200, description: 'Returns list of calendars' })
  async getUserCalendars(@CurrentUser() user: CurrentUserData): Promise<CalendarWithPermission[]> {
    return this.calendarService.getUserCalendars(user.userId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get calendar by ID' })
  @ApiParam({ name: 'id', description: 'Calendar UUID' })
  @ApiResponse({ status: 200, description: 'Returns calendar details' })
  async getCalendarById(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CalendarWithPermission> {
    return this.calendarService.getCalendarById(id, user.userId);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update calendar' })
  @ApiParam({ name: 'id', description: 'Calendar UUID' })
  @ApiResponse({ status: 200, description: 'Calendar updated' })
  async updateCalendar(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCalendarDto,
  ): Promise<CalendarResponseDto> {
    return this.calendarService.updateCalendar(id, user.userId, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete calendar' })
  @ApiParam({ name: 'id', description: 'Calendar UUID' })
  @ApiResponse({ status: 200, description: 'Calendar deleted' })
  async deleteCalendar(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.calendarService.deleteCalendar(id, user.userId);
    return { message: 'Calendar deleted successfully' };
  }

  // =====================================================
  // Sharing & Invitation Endpoints
  // =====================================================

  @Post('invites')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create invite link for calendar' })
  @ApiResponse({ status: 201, description: 'Invite link created', type: InviteLinkResponseDto })
  async createInviteLink(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateInviteDto,
  ): Promise<InviteLinkResponseDto> {
    return this.calendarService.createInviteLink(user.userId, dto);
  }

  @Get('invites/:token/info')
  @Public()
  @ApiOperation({ summary: 'Get invite info by token (public)' })
  @ApiParam({ name: 'token', description: 'Invite token' })
  @ApiResponse({ status: 200, description: 'Returns invite info' })
  async getInviteInfo(@Param('token') token: string): Promise<{
    calendarName: string;
    ownerName: string;
    permission: CalendarPermission;
    expiresAt: Date;
  }> {
    return this.calendarService.getInviteInfo(token);
  }

  @Post('invites/:token/accept')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept calendar invite' })
  @ApiParam({ name: 'token', description: 'Invite token' })
  @ApiResponse({ status: 200, description: 'Invite accepted', type: CalendarShareResponseDto })
  async acceptInvite(
    @CurrentUser() user: CurrentUserData,
    @Param('token') token: string,
  ): Promise<CalendarShareResponseDto> {
    return this.calendarService.acceptInvite(user.userId, token);
  }

  @Get(':id/shares')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all shares for a calendar' })
  @ApiParam({ name: 'id', description: 'Calendar UUID' })
  @ApiResponse({ status: 200, description: 'Returns list of shares' })
  async getCalendarShares(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CalendarShareResponseDto[]> {
    return this.calendarService.getCalendarShares(id, user.userId);
  }

  @Patch('shares/:shareId/permission')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update share permission' })
  @ApiParam({ name: 'shareId', description: 'Share UUID' })
  @ApiResponse({ status: 200, description: 'Permission updated' })
  async updateSharePermission(
    @CurrentUser() user: CurrentUserData,
    @Param('shareId', ParseUUIDPipe) shareId: string,
    @Body('permission') permission: CalendarPermission,
  ): Promise<CalendarShareResponseDto> {
    return this.calendarService.updateSharePermission(shareId, user.userId, permission);
  }

  @Delete('shares/:shareId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke calendar share' })
  @ApiParam({ name: 'shareId', description: 'Share UUID' })
  @ApiResponse({ status: 200, description: 'Share revoked' })
  async revokeShare(
    @CurrentUser() user: CurrentUserData,
    @Param('shareId', ParseUUIDPipe) shareId: string,
  ): Promise<{ message: string }> {
    await this.calendarService.revokeShare(shareId, user.userId);
    return { message: 'Share revoked successfully' };
  }

  // =====================================================
  // Appointment Endpoints
  // =====================================================

  @Post('appointments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created', type: AppointmentResponseDto })
  async createAppointment(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    return this.calendarService.createAppointment(user.userId, dto);
  }

  @Get('appointments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get appointments with filters' })
  @ApiResponse({ status: 200, description: 'Returns list of appointments' })
  async getAppointments(
    @CurrentUser() user: CurrentUserData,
    @Query() query: AppointmentQueryDto,
  ): Promise<AppointmentResponseDto[]> {
    return this.calendarService.getAppointments(user.userId, query);
  }

  @Get('appointments/today')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get today\'s appointments' })
  @ApiResponse({ status: 200, description: 'Returns today\'s appointments' })
  async getTodayAppointments(
    @CurrentUser() user: CurrentUserData,
  ): Promise<AppointmentResponseDto[]> {
    return this.calendarService.getTodayAppointments(user.userId);
  }

  @Get('appointments/upcoming')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get upcoming appointments (next 7 days)' })
  @ApiResponse({ status: 200, description: 'Returns upcoming appointments' })
  async getUpcomingAppointments(
    @CurrentUser() user: CurrentUserData,
    @Query('days') days?: string,
  ): Promise<AppointmentResponseDto[]> {
    return this.calendarService.getUpcomingAppointments(
      user.userId,
      days ? parseInt(days, 10) : 7,
    );
  }

  @Get('appointments/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Returns appointment details' })
  async getAppointmentById(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AppointmentResponseDto> {
    return this.calendarService.getAppointmentById(id, user.userId);
  }

  @Put('appointments/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Appointment updated' })
  async updateAppointment(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    return this.calendarService.updateAppointment(id, user.userId, dto);
  }

  @Post('appointments/:id/cancel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled' })
  async cancelAppointment(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.calendarService.cancelAppointment(id, user.userId);
    return { message: 'Appointment cancelled successfully' };
  }

  @Delete('appointments/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Appointment deleted' })
  async deleteAppointment(
    @CurrentUser() user: CurrentUserData,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.calendarService.deleteAppointment(id, user.userId);
    return { message: 'Appointment deleted successfully' };
  }
}
