import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { UserOAuthToken, OAuthProvider } from '../../entities/user-oauth-token.entity';
import { User } from '../../entities/user.entity';
import { CalendarShare, CalendarPermission, InviteStatus } from '../../entities/calendar-share.entity';
import {
  CalendarEvent,
  OAuthStatusResponse,
  CalendarEventsResponse,
} from './dto';

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface GoogleUserInfo {
  email: string;
  name?: string;
  picture?: string;
}

@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly frontendUrl: string;
  private readonly scopes: string[];

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(UserOAuthToken)
    private readonly tokenRepository: Repository<UserOAuthToken>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CalendarShare)
    private readonly calendarShareRepository: Repository<CalendarShare>,
  ) {
    this.clientId = this.configService.get<string>('google.clientId') || '';
    this.clientSecret = this.configService.get<string>('google.clientSecret') || '';
    this.redirectUri = this.configService.get<string>('google.redirectUri') || '';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    this.scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ];
  }

  /**
   * Generate Google OAuth authorization URL
   * @param userId - User ID (for logged-in users)
   * @param inviteToken - Calendar invite token (for invite flow)
   */
  getAuthUrl(userId?: string, inviteToken?: string): string {
    // State format: "userId" or "invite:token"
    const state = inviteToken ? `invite:${inviteToken}` : userId;

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state: state || '',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Generate OAuth URL for calendar invite
   */
  getInviteAuthUrl(inviteToken: string): string {
    return this.getAuthUrl(undefined, inviteToken);
  }

  /**
   * Exchange authorization code for tokens and save
   */
  async handleCallback(code: string, userId: string): Promise<UserOAuthToken> {
    try {
      // Exchange code for tokens
      const tokenResponse = await axios.post<GoogleTokenResponse>(
        'https://oauth2.googleapis.com/token',
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const { access_token, refresh_token, expires_in, scope } = tokenResponse.data;

      // Get user info (email)
      const userInfo = await this.getUserInfo(access_token);

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      // Check if token already exists for this user
      let token = await this.tokenRepository.findOne({
        where: { userId, provider: OAuthProvider.GOOGLE_CALENDAR },
      });

      if (token) {
        // Update existing token
        token.accessToken = access_token;
        token.refreshToken = refresh_token || token.refreshToken;
        token.expiresAt = expiresAt;
        token.scope = scope;
        token.metadata = { email: userInfo.email, name: userInfo.name };
        token.isActive = true;
      } else {
        // Create new token
        token = this.tokenRepository.create({
          userId,
          provider: OAuthProvider.GOOGLE_CALENDAR,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt,
          scope,
          metadata: { email: userInfo.email, name: userInfo.name },
          isActive: true,
        });
      }

      await this.tokenRepository.save(token);
      this.logger.log(`Google Calendar connected for user ${userId}`);

      return token;
    } catch (error) {
      this.logger.error('Failed to exchange OAuth code:', error);
      throw new BadRequestException('Failed to connect Google Calendar');
    }
  }

  /**
   * Get user info from Google
   */
  private async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await axios.get<GoogleUserInfo>(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    return response.data;
  }

  /**
   * Refresh access token if expired
   */
  async refreshAccessToken(userId: string): Promise<string> {
    const token = await this.tokenRepository.findOne({
      where: { userId, provider: OAuthProvider.GOOGLE_CALENDAR, isActive: true },
    });

    if (!token) {
      throw new UnauthorizedException('Google Calendar not connected');
    }

    // Check if token is still valid (with 5 min buffer)
    if (token.expiresAt && token.expiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
      return token.accessToken;
    }

    if (!token.refreshToken) {
      throw new UnauthorizedException('No refresh token available. Please reconnect.');
    }

    try {
      const response = await axios.post<GoogleTokenResponse>(
        'https://oauth2.googleapis.com/token',
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: token.refreshToken,
          grant_type: 'refresh_token',
        },
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const { access_token, expires_in } = response.data;

      // Update token in database
      token.accessToken = access_token;
      token.expiresAt = new Date(Date.now() + expires_in * 1000);
      await this.tokenRepository.save(token);

      this.logger.debug(`Refreshed Google token for user ${userId}`);
      return access_token;
    } catch (error) {
      this.logger.error('Failed to refresh token:', error);
      // Mark token as inactive
      token.isActive = false;
      await this.tokenRepository.save(token);
      throw new UnauthorizedException('Failed to refresh token. Please reconnect.');
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(userId: string): Promise<string> {
    return this.refreshAccessToken(userId);
  }

  /**
   * Get OAuth connection status
   */
  async getStatus(userId: string): Promise<OAuthStatusResponse> {
    const token = await this.tokenRepository.findOne({
      where: { userId, provider: OAuthProvider.GOOGLE_CALENDAR, isActive: true },
    });

    if (!token) {
      return {
        connected: false,
        provider: 'google_calendar',
      };
    }

    return {
      connected: true,
      provider: 'google_calendar',
      email: token.metadata?.email,
      expiresAt: token.expiresAt,
      connectedAt: token.createdAt,
    };
  }

  /**
   * Disconnect Google Calendar
   */
  async disconnect(userId: string): Promise<void> {
    const token = await this.tokenRepository.findOne({
      where: { userId, provider: OAuthProvider.GOOGLE_CALENDAR },
    });

    if (token) {
      // Optionally revoke token at Google
      try {
        await axios.post(`https://oauth2.googleapis.com/revoke?token=${token.accessToken}`);
      } catch (error) {
        this.logger.warn('Failed to revoke token at Google:', error);
      }

      await this.tokenRepository.remove(token);
      this.logger.log(`Google Calendar disconnected for user ${userId}`);
    }
  }

  /**
   * Get calendar events
   */
  async getCalendarEvents(
    userId: string,
    timeMin?: string,
    timeMax?: string,
    maxResults?: number,
  ): Promise<CalendarEventsResponse> {
    const accessToken = await this.getValidAccessToken(userId);

    // Default to today if no date range specified
    const now = new Date();
    const defaultTimeMin = timeMin || new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const defaultTimeMax = timeMax || new Date(now.setHours(23, 59, 59, 999)).toISOString();

    const params = new URLSearchParams({
      timeMin: defaultTimeMin,
      timeMax: defaultTimeMax,
      maxResults: (maxResults || 50).toString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    try {
      const response = await axios.get(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      const events: CalendarEvent[] = (response.data.items || []).map((item: any) => ({
        id: item.id,
        summary: item.summary || 'No title',
        description: item.description,
        start: item.start,
        end: item.end,
        status: item.status,
        htmlLink: item.htmlLink,
        location: item.location,
        attendees: item.attendees,
      }));

      return {
        events,
        nextPageToken: response.data.nextPageToken,
      };
    } catch (error: any) {
      this.logger.error('Failed to fetch calendar events:', error);
      if (error.response?.status === 401) {
        throw new UnauthorizedException('Calendar access expired. Please reconnect.');
      }
      throw new BadRequestException('Failed to fetch calendar events');
    }
  }

  /**
   * Get today's events
   */
  async getTodayEvents(userId: string): Promise<CalendarEventsResponse> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    return this.getCalendarEvents(
      userId,
      startOfDay.toISOString(),
      endOfDay.toISOString(),
    );
  }

  /**
   * Get tomorrow's events
   */
  async getTomorrowEvents(userId: string): Promise<CalendarEventsResponse> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfDay = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0);
    const endOfDay = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59);

    return this.getCalendarEvents(
      userId,
      startOfDay.toISOString(),
      endOfDay.toISOString(),
    );
  }

  /**
   * Handle OAuth callback for calendar invite flow
   * Creates/finds user, saves OAuth token, and auto-accepts calendar invite
   */
  async handleInviteCallback(code: string, inviteToken: string): Promise<{ redirectUrl: string }> {
    // 1. Verify invite exists and is valid
    const share = await this.calendarShareRepository.findOne({
      where: { inviteToken },
      relations: ['calendar'],
    });

    if (!share) {
      return { redirectUrl: `${this.frontendUrl}/calendar?error=invite_not_found` };
    }

    if (share.inviteStatus !== InviteStatus.PENDING) {
      return { redirectUrl: `${this.frontendUrl}/calendar?error=invite_already_used` };
    }

    if (share.inviteExpiresAt && share.inviteExpiresAt < new Date()) {
      share.inviteStatus = InviteStatus.EXPIRED;
      await this.calendarShareRepository.save(share);
      return { redirectUrl: `${this.frontendUrl}/calendar?error=invite_expired` };
    }

    try {
      // 2. Exchange code for tokens
      const tokenResponse = await axios.post<GoogleTokenResponse>(
        'https://oauth2.googleapis.com/token',
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const { access_token, refresh_token, expires_in, scope } = tokenResponse.data;

      // 3. Get user info from Google
      const userInfo = await this.getUserInfo(access_token);
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      // 4. Find or create user based on Google email
      let user = await this.userRepository.findOne({
        where: { email: userInfo.email },
      });

      if (!user) {
        // Create new user with Google info
        const randomPassword = Math.random().toString(36).slice(-12);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        user = this.userRepository.create({
          email: userInfo.email,
          name: userInfo.name || userInfo.email.split('@')[0],
          password: hashedPassword,
          role: 'user',
          isActive: true,
        });
        await this.userRepository.save(user);
        this.logger.log(`Created new user ${user.id} from Google OAuth invite`);
      }

      // 5. Check if user is the calendar owner
      if (share.calendar.ownerId === user.id) {
        return { redirectUrl: `${this.frontendUrl}/calendar?error=cannot_invite_owner` };
      }

      // 6. Check if user already has access to this calendar
      const existingShare = await this.calendarShareRepository.findOne({
        where: { calendarId: share.calendarId, userId: user.id },
      });

      if (existingShare) {
        return { redirectUrl: `${this.frontendUrl}/calendar?error=already_has_access` };
      }

      // 7. Save OAuth token for this user
      let token = await this.tokenRepository.findOne({
        where: { userId: user.id, provider: OAuthProvider.GOOGLE_CALENDAR },
      });

      if (token) {
        token.accessToken = access_token;
        token.refreshToken = refresh_token || token.refreshToken;
        token.expiresAt = expiresAt;
        token.scope = scope;
        token.metadata = { email: userInfo.email, name: userInfo.name };
        token.isActive = true;
      } else {
        token = this.tokenRepository.create({
          userId: user.id,
          provider: OAuthProvider.GOOGLE_CALENDAR,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt,
          scope,
          metadata: { email: userInfo.email, name: userInfo.name },
          isActive: true,
        });
      }
      await this.tokenRepository.save(token);

      // 8. Accept the calendar invite
      share.userId = user.id;
      share.inviteStatus = InviteStatus.ACCEPTED;
      share.inviteToken = undefined as any; // Clear token after use
      await this.calendarShareRepository.save(share);

      this.logger.log(`User ${user.id} (${userInfo.email}) joined calendar ${share.calendarId} via invite`);

      // 9. Return success redirect
      return {
        redirectUrl: `${this.frontendUrl}/calendar?success=joined&calendar=${share.calendar.name}`,
      };
    } catch (error) {
      this.logger.error('Failed to handle invite OAuth callback:', error);
      return { redirectUrl: `${this.frontendUrl}/calendar?error=oauth_failed` };
    }
  }

  /**
   * Parse state from OAuth callback
   * Returns { type: 'user', userId } or { type: 'invite', inviteToken }
   */
  parseOAuthState(state: string): { type: 'user' | 'invite'; userId?: string; inviteToken?: string } {
    if (state.startsWith('invite:')) {
      return { type: 'invite', inviteToken: state.substring(7) };
    }
    return { type: 'user', userId: state };
  }
}
