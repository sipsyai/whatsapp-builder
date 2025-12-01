import {
  Controller,
  Get,
  Delete,
  Query,
  Param,
  Res,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { GoogleOAuthService } from './google-oauth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CalendarEventsQueryDto, AvailabilityQueryDto } from './dto';
import type {
  OAuthStatusResponse,
  AuthUrlResponse,
  CalendarEventsResponse,
  AvailabilityResponse,
} from './dto';
import { ConfigService } from '@nestjs/config';

@ApiTags('Google OAuth')
@Controller('api/google-oauth')
export class GoogleOAuthController {
  private readonly logger = new Logger(GoogleOAuthController.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
  }

  @Get('auth-url')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Google OAuth authorization URL' })
  @ApiResponse({ status: 200, description: 'Returns authorization URL' })
  getAuthUrl(@CurrentUser() user: CurrentUserData): AuthUrlResponse {
    const authUrl = this.googleOAuthService.getAuthUrl(user.userId);
    return { authUrl };
  }

  @Get('callback')
  @Public()
  @ApiOperation({ summary: 'OAuth callback endpoint (handles redirect from Google)' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with result' })
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ): Promise<void> {
    // Handle error from Google
    if (error) {
      this.logger.warn(`OAuth error: ${error}`);
      res.redirect(`${this.frontendUrl}/integrations?error=${encodeURIComponent(error)}`);
      return;
    }

    if (!code || !state) {
      res.redirect(`${this.frontendUrl}/integrations?error=missing_params`);
      return;
    }

    // Parse state to determine flow type
    const parsedState = this.googleOAuthService.parseOAuthState(state);

    if (parsedState.type === 'invite' && parsedState.inviteToken) {
      // Calendar invite flow - creates/finds user and auto-accepts invite
      const result = await this.googleOAuthService.handleInviteCallback(code, parsedState.inviteToken);
      res.redirect(result.redirectUrl);
      return;
    }

    // Regular OAuth flow for logged-in users
    try {
      await this.googleOAuthService.handleCallback(code, parsedState.userId!);
      res.redirect(`${this.frontendUrl}/integrations?success=google_connected`);
    } catch (err) {
      this.logger.error('OAuth callback error:', err);
      res.redirect(`${this.frontendUrl}/integrations?error=connection_failed`);
    }
  }

  @Get('invite/:token')
  @Public()
  @ApiOperation({ summary: 'Redirect to Google OAuth for calendar invite' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  async handleInviteRedirect(
    @Param('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!token) {
      res.redirect(`${this.frontendUrl}/calendar?error=missing_invite_token`);
      return;
    }

    const authUrl = this.googleOAuthService.getInviteAuthUrl(token);
    res.redirect(authUrl);
  }

  @Get('status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Google Calendar connection status' })
  @ApiResponse({ status: 200, description: 'Returns connection status' })
  async getStatus(@CurrentUser() user: CurrentUserData): Promise<OAuthStatusResponse> {
    return this.googleOAuthService.getStatus(user.userId);
  }

  @Delete('disconnect')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect Google Calendar' })
  @ApiResponse({ status: 200, description: 'Calendar disconnected' })
  async disconnect(@CurrentUser() user: CurrentUserData): Promise<{ message: string }> {
    await this.googleOAuthService.disconnect(user.userId);
    return { message: 'Google Calendar disconnected successfully' };
  }

  @Get('calendar/events')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get calendar events' })
  @ApiResponse({ status: 200, description: 'Returns calendar events' })
  async getCalendarEvents(
    @CurrentUser() user: CurrentUserData,
    @Query() query: CalendarEventsQueryDto,
  ): Promise<CalendarEventsResponse> {
    return this.googleOAuthService.getCalendarEvents(
      user.userId,
      query.timeMin,
      query.timeMax,
      query.maxResults ? parseInt(query.maxResults, 10) : undefined,
    );
  }

  @Get('calendar/today')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get today\'s calendar events' })
  @ApiResponse({ status: 200, description: 'Returns today\'s events' })
  async getTodayEvents(@CurrentUser() user: CurrentUserData): Promise<CalendarEventsResponse> {
    return this.googleOAuthService.getTodayEvents(user.userId);
  }

  @Get('calendar/tomorrow')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tomorrow\'s calendar events' })
  @ApiResponse({ status: 200, description: 'Returns tomorrow\'s events' })
  async getTomorrowEvents(@CurrentUser() user: CurrentUserData): Promise<CalendarEventsResponse> {
    return this.googleOAuthService.getTomorrowEvents(user.userId);
  }

  @Get('calendar/availability')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get available time slots for a date',
    description: 'Returns available and busy time slots based on Google Calendar events. Useful for appointment booking in chatbots.',
  })
  @ApiResponse({ status: 200, description: 'Returns availability information' })
  async getAvailability(
    @CurrentUser() user: CurrentUserData,
    @Query() query: AvailabilityQueryDto,
  ): Promise<AvailabilityResponse> {
    return this.googleOAuthService.getAvailableSlots(
      user.userId,
      query.date,
      query.workStart || '09:00',
      query.workEnd || '18:00',
      query.slotDuration ? parseInt(query.slotDuration, 10) : 60,
    );
  }

  @Get('calendar/availability/slots')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get only available time slots (WhatsApp-friendly format)',
    description: 'Returns only available slots in a format suitable for WhatsApp interactive messages.',
  })
  @ApiResponse({ status: 200, description: 'Returns available slots only' })
  async getAvailableSlotsOnly(
    @CurrentUser() user: CurrentUserData,
    @Query() query: AvailabilityQueryDto,
  ): Promise<Array<{ id: string; title: string; enabled: boolean }>> {
    return this.googleOAuthService.getAvailableSlotsOnly(
      user.userId,
      query.date,
      query.workStart || '09:00',
      query.workEnd || '18:00',
      query.slotDuration ? parseInt(query.slotDuration, 10) : 60,
    );
  }
}
